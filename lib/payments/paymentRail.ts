import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BASE58_ADDRESS, NATIVE_USDC_MINT, assertDevnetEndpoint, fetchDevnetTransaction, newPaymentReference, observePayment, type ParsedTransaction } from "@/lib/payments/solana";

/**
 * Provider-neutral payment core (Worker side). The database RPCs are the ledger and decide every
 * state; this module only supplies server-side inputs the browser must never choose:
 *   FX rate (explicit provider), network, native mint, recipient, reference, chain observations.
 *
 * Phase: STAGING Solana DEVNET only, and only when explicitly configured. Production is disabled:
 *   - rail runs only against the staging Supabase project (same allow-list as Web Push);
 *   - the FX provider is an explicit TEST provider fed by configured test rates (never invented);
 *   - there is NO signer / private key anywhere: payouts and refunds are instructions until a
 *     custody / payout provider (or a later, reviewed devnet signer) submits them.
 */

const STAGING_REF: string = "wreebowcbiymodswajwe";
export const RAIL_NETWORK = "solana-devnet" as const;
export const RAIL_PROVIDER = "SOLANA_DIRECT_DEVNET" as const;

export type RailConfig = { network: typeof RAIL_NETWORK; mint: string; recipient: string; rpcUrl: string };
export type FxQuote = { rate: number; provider: string; sourceRef: string };

async function runtimeEnv(): Promise<Record<string, string | undefined>> {
  try { return (await getCloudflareContext({ async: true })).env as Record<string, string | undefined>; } catch { return {}; }
}

/** Rail configuration, or null when this environment may not take payments. */
export async function getRailConfig(env?: Record<string, string | undefined>): Promise<RailConfig | null> {
  const e = env ?? await runtimeEnv();
  const ref = (e.SUPABASE_URL || "").match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1];
  if (ref !== STAGING_REF || e.LIFE_HELP_PAYMENT_MODE !== "STAGING_DEVNET_TEST") return null;
  const recipient = e.LIFE_HELP_SOLANA_DEVNET_RECIPIENT?.trim() ?? "";
  if (!BASE58_ADDRESS.test(recipient)) return null;
  // Any standard Solana JSON-RPC provider; configured ONLY here (a staging secret: it may carry an API
  // key). No built-in default. The URL guard runs here and the genesis-hash guard before every use.
  const rpcUrl = e.LIFE_HELP_SOLANA_DEVNET_RPC_URL?.trim() ?? "";
  try { assertDevnetEndpoint(rpcUrl); } catch { return null; }
  return { network: RAIL_NETWORK, mint: NATIVE_USDC_MINT[RAIL_NETWORK], recipient, rpcUrl };
}

/**
 * Why is the rail off? Shape-only answers (booleans / lengths), NEVER the endpoint value itself:
 * the RPC URL is a secret that may carry an API key.
 */
export async function railConfigDiagnostics(env?: Record<string, string | undefined>) {
  const e = env ?? await runtimeEnv();
  const raw = e.LIFE_HELP_SOLANA_DEVNET_RPC_URL ?? "";
  const url = raw.trim();
  let parsed: URL | null = null;
  try { parsed = new URL(url); } catch { parsed = null; }
  const host = parsed?.hostname.toLowerCase() ?? "";
  return {
    stagingProject: (e.SUPABASE_URL || "").match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1] === STAGING_REF,
    paymentMode: e.LIFE_HELP_PAYMENT_MODE === "STAGING_DEVNET_TEST",
    recipientValid: BASE58_ADDRESS.test(e.LIFE_HELP_SOLANA_DEVNET_RECIPIENT?.trim() ?? ""),
    rpc: {
      present: raw.length > 0, length: url.length, surroundingWhitespace: raw !== url, quoted: /^["']|["']$/.test(url), containsEquals: /^[A-Z_]+=/.test(url),
      parseable: !!parsed, https: parsed?.protocol === "https:", hostContainsDevnet: host.includes("devnet"),
      hostOrPathContainsMainnet: /mainnet/.test(host) || /mainnet/.test(parsed?.pathname ?? ""), guardPasses: (() => { try { assertDevnetEndpoint(url); return true; } catch { return false; } })(),
    },
  };
}

/**
 * TEST / SANDBOX FX: rates come only from explicit configuration, e.g.
 * LIFE_HELP_TEST_FX_RATES="KRW=1400" (source-currency units per 1 USDC). No production FX provider
 * is connected; an unconfigured currency has no quote (FX_UNAVAILABLE), never a guessed rate.
 */
export async function getTestFxQuote(currency: string, env?: Record<string, string | undefined>): Promise<FxQuote | null> {
  const e = env ?? await runtimeEnv();
  if (e.LIFE_HELP_PAYMENT_MODE !== "STAGING_DEVNET_TEST") return null;
  for (const pair of (e.LIFE_HELP_TEST_FX_RATES ?? "").split(",")) {
    const [code, value] = pair.split("=").map((s) => s.trim());
    const rate = Number(value);
    if (code === currency && Number.isFinite(rate) && rate > 0) return { rate, provider: "TEST_SANDBOX_FX", sourceRef: "config:LIFE_HELP_TEST_FX_RATES" };
  }
  return null;
}

/** Quote + intent for a checkout owned by `customerId`. All payment parameters are server-side. */
export async function openPaymentIntent(client: SupabaseClient, checkoutId: string, customerId: string, env?: Record<string, string | undefined>) {
  const rail = await getRailConfig(env);
  if (!rail) return { ok: false as const, httpStatus: 503, code: "PAYMENT_RAIL_DISABLED" };
  const { data: checkout } = await client.from("service_checkouts").select("id, fiat_currency").eq("id", checkoutId).eq("customer_id", customerId).maybeSingle();
  if (!checkout) return { ok: false as const, httpStatus: 404, code: "CHECKOUT_NOT_FOUND" };
  const fx = await getTestFxQuote(checkout.fiat_currency, env);
  if (!fx) return { ok: false as const, httpStatus: 503, code: "FX_UNAVAILABLE" };
  const { data: quote, error: quoteError } = await client.rpc("create_payment_quote", {
    p_checkout_id: checkoutId, p_customer_id: customerId, p_network: rail.network, p_mint: rail.mint,
    p_fx_rate: fx.rate, p_fx_provider: fx.provider, p_fx_source_ref: fx.sourceRef, p_ttl_seconds: 600,
  });
  if (quoteError || !quote) return { ok: false as const, httpStatus: 502, code: "QUOTE_FAILED" };
  if (!quote.success) return { ok: false as const, httpStatus: 409, code: String(quote.code) };
  const { data: intent, error: intentError } = await client.rpc("create_payment_intent", {
    p_quote_id: quote.quote_id, p_customer_id: customerId, p_recipient: rail.recipient, p_reference: newPaymentReference(),
  });
  if (intentError || !intent) return { ok: false as const, httpStatus: 502, code: "INTENT_FAILED" };
  if (!intent.success) return { ok: false as const, httpStatus: 409, code: String(intent.code) };
  return { ok: true as const, quote, intent };
}

/**
 * Server-side verification of a customer-submitted signature. The browser's claim ("paid") is
 * never trusted: the transaction is read from the devnet RPC and classified by the database.
 */
export async function verifyPaymentSignature(
  client: SupabaseClient, intent: { id: string; recipient: string; mint: string; reference: string; network: string }, signature: string,
  fetchTx: (signature: string) => Promise<{ tx: ParsedTransaction; confirmation: "finalized" | "confirmed" } | null>,
) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) return { ok: false as const, httpStatus: 400, code: "INVALID_SIGNATURE" };
  const found = await fetchTx(signature);
  if (!found) return { ok: false as const, httpStatus: 409, code: "TRANSACTION_NOT_FOUND" };
  const observed = observePayment(found.tx, { recipient: intent.recipient, mint: intent.mint, reference: intent.reference });
  const { data, error } = await client.rpc("record_payment_observation", {
    p_intent_id: intent.id, p_network: intent.network, p_signature: signature, p_slot: observed.slot, p_mint: observed.mint,
    p_recipient: observed.recipient, p_amount_base_units: observed.amountBaseUnits, p_reference_matched: observed.referenceMatched,
    p_tx_success: observed.txSuccess, p_confirmation: found.confirmation,
  });
  if (error || !data) return { ok: false as const, httpStatus: 502, code: "VERIFICATION_FAILED" };
  return { ok: true as const, result: data as Record<string, unknown> };
}

export async function devnetTransactionFetcher(env?: Record<string, string | undefined>) {
  const rail = await getRailConfig(env);
  if (!rail) return null;
  return (signature: string) => fetchDevnetTransaction(rail.rpcUrl, signature);
}

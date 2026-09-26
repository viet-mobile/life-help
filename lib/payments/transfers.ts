import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getRailConfig, getTestFxQuote, RAIL_NETWORK, RAIL_PROVIDER } from "@/lib/payments/paymentRail";
import { NATIVE_USDC_MINT, observePayment } from "@/lib/payments/solana";
import { DevnetRpc, sendUsdcTransfer, signerFromSecret, transferReference, type Signer } from "@/lib/payments/solanaTx";
import { closeServiceRequest, runConversationCleanup, settleServiceRequest } from "@/lib/settlement/serviceSettlement";

/**
 * STAGING DEVNET money movement: Helper payouts, refunds, Referral payouts.
 *
 * This direct-signer adapter is TEST / STAGING ONLY. Production must use a licensed PSP / custody /
 * escrow / payout provider; LIFE.HELP production must never depend on a raw application hot-wallet
 * key. The adapter refuses to exist outside staging (Supabase ref + explicit STAGING_DEVNET_TEST mode
 * + devnet genesis hash verified on every RPC client before signing).
 *
 * Exactly once: every transfer is CLAIMED first by a unique payment_events row
 * (LIFE_HELP_TRANSFER_CLAIM, "<kind>:<id>"); only the claimer sends. Each transfer carries a
 * deterministic reference key, so a retry reconciles the existing chain transaction instead of
 * paying twice. Nothing is recorded as paid / refunded until the chain transaction is FINALIZED and
 * re-read: recipient, native devnet USDC mint, amount, success.
 */

export type DevnetRail = { rpc: DevnetRpc; signer: Signer; mint: string };

async function runtimeEnv(): Promise<Record<string, string | undefined>> {
  try { return (await getCloudflareContext({ async: true })).env as Record<string, string | undefined>; } catch { return {}; }
}

/** The devnet signer, or null anywhere it must not exist (production, unconfigured, key mismatch). */
export async function getDevnetRail(env?: Record<string, string | undefined>): Promise<DevnetRail | null> {
  const e = env ?? await runtimeEnv();
  const rail = await getRailConfig(e);
  const secret = e.LIFE_HELP_SOLANA_DEVNET_SIGNER_SECRET;
  if (!rail || !secret) return null;
  try {
    const signer = await signerFromSecret(secret);
    // The signer IS the holding account that received the customer payments.
    if (signer.publicKey !== rail.recipient) return null;
    return { rpc: new DevnetRpc(rail.rpcUrl), signer, mint: NATIVE_USDC_MINT[RAIL_NETWORK] };
  } catch {
    return null;
  }
}

async function claim(client: SupabaseClient, key: string, payload: Record<string, unknown>): Promise<boolean> {
  const { error } = await client.from("payment_events").insert({ provider: "LIFE_HELP_TRANSFER_CLAIM", provider_event_id: key, event_type: "TRANSFER_CLAIM", processing_status: "PROCESSED", payload });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`CLAIM_FAILED_${error.code}`);
}

async function logEvent(client: SupabaseClient, intentId: string | null, type: string, payload: Record<string, unknown>) {
  await client.from("payment_events").insert({ provider: "LIFE_HELP_LEDGER", provider_event_id: crypto.randomUUID(), provider_payment_id: intentId, event_type: type, processing_status: "PROCESSED", payload, payment_intent_id: intentId, processed_at: new Date().toISOString() });
}

async function readEvent(client: SupabaseClient, type: string, key: string, value: string) {
  const { data } = await client.from("payment_events").select("payload").eq("event_type", type).eq(`payload->>${key}`, value).order("received_at", { ascending: false }).limit(1).maybeSingle();
  return (data?.payload ?? null) as Record<string, string> | null;
}

/** Finalized chain proof that `amount` native USDC reached `owner` in `signature`. */
async function provenTransfer(rail: DevnetRail, signature: string, owner: string, amount: string, reference: string): Promise<"CONFIRMED" | "FAILED" | "PENDING"> {
  const status = await rail.rpc.status(signature).catch(() => null);
  if (status?.err) return "FAILED";
  if (status?.confirmationStatus !== "finalized") return "PENDING";
  const tx = await rail.rpc.transaction(signature, "finalized").catch(() => null);
  if (!tx) return "PENDING";
  const seen = observePayment(tx, { recipient: owner, mint: rail.mint, reference });
  return seen.txSuccess && seen.recipient === owner && seen.mint === rail.mint && seen.amountBaseUnits === amount && seen.referenceMatched ? "CONFIRMED" : "FAILED";
}

async function findExisting(rail: DevnetRail, reference: string): Promise<string | null> {
  const found = await rail.rpc.signaturesFor(reference, 5).catch(() => []);
  return found.find((s) => !s.err)?.signature ?? null;
}

// ---------------------------------------------------------------------------------------------
// Helper payout (after the customer's "서비스 완료")
// ---------------------------------------------------------------------------------------------
export type TransferOutcome = { status: string; signature?: string | null; reason?: string };

export async function dispatchHelperPayout(client: SupabaseClient, obligationId: string, railArg?: DevnetRail | null): Promise<TransferOutcome> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_SUBMITTED", reason: "PAYOUT_RAIL_NOT_CONFIGURED" };
  const { data: ob } = await client.from("payout_obligations").select("*").eq("id", obligationId).maybeSingle();
  if (!ob || ob.kind !== "HELPER_SERVICE") return { status: "NOT_SUBMITTED", reason: "OBLIGATION_NOT_FOUND" };
  if (ob.status !== "CREATED") return { status: ob.status, signature: ob.chain_signature };
  const { data: req } = await client.from("service_requests").select("country").eq("id", ob.request_id).maybeSingle();
  const { data: enabled } = await client.rpc("payment_rail_enabled", { p_country: req?.country ?? "", p_capability: "USDC_HELPER_PAYOUT", p_network: RAIL_NETWORK, p_provider: RAIL_PROVIDER });
  if (enabled !== true) return { status: "NOT_SUBMITTED", reason: "PAYMENT_RAIL_DISABLED" };
  const { data: dest } = await client.from("payout_destinations").select("id, provider_payee_token").eq("owner_helper_id", ob.helper_id).eq("payout_method", "USDC_SOLANA").eq("status", "ACTIVE").maybeSingle();
  if (!dest?.provider_payee_token) return { status: "NOT_SUBMITTED", reason: "PAYOUT_DESTINATION_MISSING" };
  // Ledger amount -> USDC at the SAME rate the customer paid; never more than was received.
  const { data: intent } = await client.from("payment_intents").select("id, quote_id, amount_base_units").eq("id", ob.payment_intent_id).maybeSingle();
  const { data: quote } = intent ? await client.from("payment_quotes").select("fx_rate, fx_provider").eq("id", intent.quote_id).maybeSingle() : { data: null };
  if (!intent || !quote) return { status: "NOT_SUBMITTED", reason: "PAYMENT_NOT_FOUND" };
  const computed = BigInt(Math.floor((Number(ob.net_amount) * 1_000_000) / Number(quote.fx_rate)));
  const amount = computed < BigInt(intent.amount_base_units) ? computed : BigInt(intent.amount_base_units);
  if (amount <= BigInt(0)) return { status: "NOT_SUBMITTED", reason: "NOTHING_TO_PAY" };
  const reference = await transferReference("helper-payout", obligationId);
  if (!(await claim(client, `HELPER_PAYOUT:${obligationId}`, { obligation_id: obligationId, reference }))) return { status: "ALREADY_CLAIMED" };
  const signature = (await findExisting(rail, reference)) ?? await sendUsdcTransfer(rail.rpc, rail.signer, { mint: rail.mint, toOwner: dest.provider_payee_token, amountBaseUnits: amount, reference });
  await logEvent(client, intent.id, "HELPER_PAYOUT_SUBMITTED", {
    obligation_id: obligationId, signature, reference, to: dest.provider_payee_token, amount_base_units: amount.toString(),
    fx_rate: String(quote.fx_rate), fx_provider: quote.fx_provider, net_amount: String(ob.net_amount), currency: ob.currency,
  });
  const { data: sub } = await client.rpc("record_payout_submission", { p_obligation_id: obligationId, p_provider: RAIL_PROVIDER, p_provider_payout_id: reference, p_chain_network: RAIL_NETWORK, p_chain_signature: signature });
  return { status: sub?.success ? "SUBMITTED" : String(sub?.code ?? "SUBMISSION_NOT_RECORDED"), signature };
}

/** SUBMITTED -> PAID only after finalized on-chain proof; then settle (-> SETTLED -> cleanup -> CLOSED). */
export async function reconcileHelperPayout(client: SupabaseClient, obligationId: string, railArg?: DevnetRail | null): Promise<TransferOutcome> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_RECONCILED", reason: "PAYOUT_RAIL_NOT_CONFIGURED" };
  const { data: ob } = await client.from("payout_obligations").select("*").eq("id", obligationId).maybeSingle();
  if (!ob) return { status: "NOT_RECONCILED", reason: "OBLIGATION_NOT_FOUND" };
  if (ob.status === "PAID") return { status: "PAID", signature: ob.chain_signature };
  if (ob.status !== "SUBMITTED" || !ob.chain_signature) return { status: ob.status };
  const sent = await readEvent(client, ob.kind === "HELPER_SERVICE" ? "HELPER_PAYOUT_SUBMITTED" : "REFERRAL_PAYOUT_SUBMITTED", "obligation_id", obligationId);
  if (!sent) return { status: "SUBMITTED", reason: "SUBMISSION_EVIDENCE_MISSING" };
  const proof = await provenTransfer(rail, ob.chain_signature, sent.to, sent.amount_base_units, sent.reference);
  if (proof === "PENDING") return { status: "SUBMITTED", signature: ob.chain_signature };
  const { data: result } = await client.rpc("record_payout_result", { p_obligation_id: obligationId, p_provider: RAIL_PROVIDER, p_provider_payout_id: ob.provider_payout_id, p_success: proof === "CONFIRMED" });
  if (proof === "CONFIRMED" && ob.kind === "HELPER_SERVICE" && result?.success) {
    const settled = await settleServiceRequest(client, ob.request_id, "PAYOUT_RECONCILER");
    if (settled.ok) { await runConversationCleanup(client, { requestId: ob.request_id }); await closeServiceRequest(client, ob.request_id, "CLEANUP_RUNNER"); }
  }
  return { status: proof === "CONFIRMED" ? "PAID" : "FAILED", signature: ob.chain_signature };
}

// ---------------------------------------------------------------------------------------------
// Refund (customer cancelled an unmatched funded request, activation failure, price difference)
// ---------------------------------------------------------------------------------------------
async function payerOf(rail: DevnetRail, signature: string, recipient: string): Promise<string | null> {
  const tx = await rail.rpc.transaction(signature, "finalized").catch(() => null);
  if (!tx?.meta) return null;
  const meta = tx.meta as { preTokenBalances?: Array<{ accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string } }>; postTokenBalances?: Array<{ accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string } }> };
  const post = new Map((meta.postTokenBalances ?? []).map((b) => [b.accountIndex, b]));
  // The account whose native-USDC balance DECREASED is the payer (never the recipient).
  for (const pre of meta.preTokenBalances ?? []) {
    const after = post.get(pre.accountIndex);
    if (pre.mint === rail.mint && pre.owner && pre.owner !== recipient && after && BigInt(after.uiTokenAmount.amount) < BigInt(pre.uiTokenAmount.amount)) return pre.owner;
  }
  return null;
}

export async function dispatchRefund(client: SupabaseClient, refundId: string, railArg?: DevnetRail | null): Promise<TransferOutcome> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_SUBMITTED", reason: "REFUND_RAIL_NOT_CONFIGURED" };
  const { data: refund } = await client.from("service_refunds").select("*").eq("id", refundId).maybeSingle();
  if (!refund) return { status: "NOT_SUBMITTED", reason: "REFUND_NOT_FOUND" };
  if (refund.status !== "PENDING") return { status: refund.status, signature: refund.chain_signature };
  const { data: intent } = await client.from("payment_intents").select("id, quote_id, amount_base_units, verified_signature, recipient, fiat_amount").eq("id", refund.payment_intent_id).maybeSingle();
  if (!intent?.verified_signature) return { status: "NOT_SUBMITTED", reason: "NO_VERIFIED_PAYMENT" };
  const payer = await payerOf(rail, intent.verified_signature, intent.recipient);
  if (!payer) return { status: "NOT_SUBMITTED", reason: "PAYER_NOT_FOUND" };
  // Full refunds return exactly what was received; partial ones convert at the payment's own rate.
  const { data: quote } = await client.from("payment_quotes").select("fx_rate").eq("id", intent.quote_id).maybeSingle();
  const full = Number(refund.amount) === Number(intent.fiat_amount);
  const amount = full ? BigInt(intent.amount_base_units) : BigInt(Math.floor((Number(refund.amount) * 1_000_000) / Number(quote?.fx_rate)));
  const reference = await transferReference("refund", refundId);
  if (!(await claim(client, `REFUND:${refundId}`, { refund_id: refundId, reference }))) return { status: "ALREADY_CLAIMED" };
  const signature = (await findExisting(rail, reference)) ?? await sendUsdcTransfer(rail.rpc, rail.signer, { mint: rail.mint, toOwner: payer, amountBaseUnits: amount, reference });
  await logEvent(client, intent.id, "REFUND_SUBMITTED", { refund_id: refundId, signature, reference, to: payer, amount_base_units: amount.toString() });
  return { status: "SUBMITTED", signature };
}

export async function reconcileRefund(client: SupabaseClient, refundId: string, railArg?: DevnetRail | null): Promise<TransferOutcome> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_RECONCILED", reason: "REFUND_RAIL_NOT_CONFIGURED" };
  const { data: refund } = await client.from("service_refunds").select("status, chain_signature").eq("id", refundId).maybeSingle();
  if (!refund) return { status: "NOT_RECONCILED", reason: "REFUND_NOT_FOUND" };
  if (refund.status === "COMPLETED") return { status: "COMPLETED", signature: refund.chain_signature };
  const sent = await readEvent(client, "REFUND_SUBMITTED", "refund_id", refundId);
  if (!sent) return { status: refund.status };
  const proof = await provenTransfer(rail, sent.signature, sent.to, sent.amount_base_units, sent.reference);
  if (proof === "PENDING") return { status: "SUBMITTED", signature: sent.signature };
  await client.rpc("record_refund_result", { p_refund_id: refundId, p_provider: RAIL_PROVIDER, p_provider_refund_id: sent.reference, p_chain_network: RAIL_NETWORK, p_chain_signature: sent.signature, p_success: proof === "CONFIRMED" });
  return { status: proof === "CONFIRMED" ? "COMPLETED" : "FAILED", signature: sent.signature };
}

// ---------------------------------------------------------------------------------------------
// Referral payout (reward lifecycle unchanged: PAYABLE -> PAYOUT_PROCESSING -> PAID)
// ---------------------------------------------------------------------------------------------
export async function dispatchReferralPayout(client: SupabaseClient, rewardId: string, country: string, railArg?: DevnetRail | null): Promise<TransferOutcome & { obligationId?: string }> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_SUBMITTED", reason: "PAYOUT_RAIL_NOT_CONFIGURED" };
  const { data: created } = await client.rpc("create_referral_payout_obligation", { p_reward_id: rewardId, p_rail: "USDC_SOLANA", p_country: country });
  if (!created?.success) return { status: "NOT_SUBMITTED", reason: String(created?.code ?? "OBLIGATION_FAILED") };
  const obligationId = String(created.payout_obligation_id);
  const { data: ob } = await client.from("payout_obligations").select("*").eq("id", obligationId).maybeSingle();
  if (ob?.status !== "CREATED") return { status: String(ob?.status), obligationId, signature: ob?.chain_signature };
  const { data: reward } = await client.from("referral_rewards").select("referrer_identity_id").eq("id", rewardId).maybeSingle();
  const { data: dest } = await client.from("payout_destinations").select("provider_payee_token").eq("owner_identity_id", reward?.referrer_identity_id).eq("payout_method", "USDC_SOLANA").eq("status", "ACTIVE").maybeSingle();
  if (!dest?.provider_payee_token) return { status: "NOT_SUBMITTED", reason: "PAYOUT_DESTINATION_MISSING", obligationId };
  // Fiat-denominated reward: explicit TEST FX, snapshot stored with the submission evidence.
  const fx = await getTestFxQuote(ob.currency);
  if (!fx) return { status: "NOT_SUBMITTED", reason: "FX_UNAVAILABLE", obligationId };
  const amount = BigInt(Math.floor((Number(ob.net_amount) * 1_000_000) / fx.rate));
  const reference = await transferReference("referral-payout", obligationId);
  if (!(await claim(client, `REFERRAL_PAYOUT:${obligationId}`, { obligation_id: obligationId, reference }))) return { status: "ALREADY_CLAIMED", obligationId };
  const signature = (await findExisting(rail, reference)) ?? await sendUsdcTransfer(rail.rpc, rail.signer, { mint: rail.mint, toOwner: dest.provider_payee_token, amountBaseUnits: amount, reference });
  await logEvent(client, null, "REFERRAL_PAYOUT_SUBMITTED", {
    obligation_id: obligationId, reward_id: rewardId, signature, reference, to: dest.provider_payee_token, amount_base_units: amount.toString(),
    fx_rate: String(fx.rate), fx_provider: fx.provider, fx_source_ref: fx.sourceRef, net_amount: String(ob.net_amount), currency: ob.currency,
  });
  const { data: sub } = await client.rpc("record_payout_submission", { p_obligation_id: obligationId, p_provider: RAIL_PROVIDER, p_provider_payout_id: reference, p_chain_network: RAIL_NETWORK, p_chain_signature: signature });
  return { status: sub?.success ? "SUBMITTED" : String(sub?.code), signature, obligationId };
}

/** Reconcile everything in flight (cron / operator / status polling). Bounded. */
export async function reconcileTransfers(client: SupabaseClient, limit = 20): Promise<{ payouts: TransferOutcome[]; refunds: TransferOutcome[]; dispatched: TransferOutcome[] }> {
  const rail = await getDevnetRail();
  if (!rail) return { payouts: [], refunds: [], dispatched: [] };
  const dispatched: TransferOutcome[] = [];
  const { data: created } = await client.from("payout_obligations").select("id").eq("kind", "HELPER_SERVICE").eq("status", "CREATED").limit(limit);
  for (const row of created ?? []) dispatched.push(await dispatchHelperPayout(client, row.id, rail).catch((e) => ({ status: "ERROR", reason: String(e?.message ?? e) })));
  const { data: pendingRefunds } = await client.from("service_refunds").select("id").eq("status", "PENDING").limit(limit);
  for (const row of pendingRefunds ?? []) dispatched.push(await dispatchRefund(client, row.id, rail).catch((e) => ({ status: "ERROR", reason: String(e?.message ?? e) })));
  const payouts: TransferOutcome[] = [];
  const { data: submitted } = await client.from("payout_obligations").select("id").eq("status", "SUBMITTED").limit(limit);
  for (const row of submitted ?? []) payouts.push(await reconcileHelperPayout(client, row.id, rail).catch((e) => ({ status: "ERROR", reason: String(e?.message ?? e) })));
  const refunds: TransferOutcome[] = [];
  for (const row of pendingRefunds ?? []) refunds.push(await reconcileRefund(client, row.id, rail).catch((e) => ({ status: "ERROR", reason: String(e?.message ?? e) })));
  return { payouts, refunds, dispatched };
}

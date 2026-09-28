import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getRailConfig, getTestFxQuote, RAIL_NETWORK, RAIL_PROVIDER } from "@/lib/payments/paymentRail";
import { BASE58_ADDRESS, NATIVE_USDC_MINT, observePayment } from "@/lib/payments/solana";
import { DevnetRpc, prepareUsdcTransfer, signerFromSecret, transferReference, type Signer } from "@/lib/payments/solanaTx";
import {
  MoneyMovementError, moneyJobIdFor, runDueMoneyJobs, runMoneyJob,
  type AttemptView, type ClaimedJob, type MoneyAdapter, type MoneyJobHooks, type MoneyJobOutcome, type Observation, type PlannedTransfer,
} from "@/lib/payments/moneyJobs";
import { closeServiceRequest, runConversationCleanup, settleServiceRequest } from "@/lib/settlement/serviceSettlement";

/**
 * STAGING DEVNET money movement: Helper payouts, refunds, Referral payouts, executed through the
 * durable money-movement outbox (lib/payments/moneyJobs.ts, migration 202609270015).
 *
 * This direct-signer adapter is TEST / STAGING ONLY. Production must use a licensed PSP / custody /
 * escrow / payout provider adapter; LIFE.HELP production must never depend on a raw application
 * hot-wallet key. The adapter refuses to exist outside staging (Supabase ref + explicit
 * STAGING_DEVNET_TEST mode + devnet genesis hash verified on every RPC client before signing).
 *
 * Each transfer carries a deterministic reference key per obligation (confirmation search), is
 * persisted as a PREPARED attempt (signature + signed bytes, server-only) BEFORE broadcast, and is
 * recorded paid / refunded only after it is FINALIZED and re-read: destination, native devnet USDC
 * mint, amount, reference, success.
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

type TokenBalance = { accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string } };

/** The customer who paid: the owner whose native-USDC balance DECREASED in the verified payment. */
async function payerOf(rail: DevnetRail, signature: string, recipient: string): Promise<string | null> {
  const tx = await rail.rpc.transaction(signature, "finalized");
  if (!tx?.meta) return null;
  const meta = tx.meta as { preTokenBalances?: TokenBalance[]; postTokenBalances?: TokenBalance[] };
  const post = new Map((meta.postTokenBalances ?? []).map((b) => [b.accountIndex, b]));
  for (const pre of meta.preTokenBalances ?? []) {
    const after = post.get(pre.accountIndex);
    if (pre.mint === rail.mint && pre.owner && pre.owner !== recipient && after && BigInt(after.uiTokenAmount.amount) < BigInt(pre.uiTokenAmount.amount)) return pre.owner;
  }
  return null;
}

const toBaseUnits = (fiat: number, rate: number) => BigInt(Math.floor((fiat * 1_000_000) / rate));

/** Snapshot of the 014 ledger rows a job points to (money_job_context in migration 015). */
type JobContext = {
  business_status: string; currency: string; net_amount?: string | number; amount?: string | number; fx_rate?: string | number | null;
  country?: string | null; destination?: string | null; obligation_id?: string; refund_id?: string;
  source_signature?: string | null; asset_amount_base_units?: string | null;
  intent?: { amount_base_units: string; network?: string; mint?: string; recipient?: string; fiat_amount?: string | number; verified_signature?: string | null } | null;
};

/** The staging devnet adapter: business planning (who / how much) + Solana preparation and observation. */
export function devnetAdapter(client: SupabaseClient, rail: DevnetRail): MoneyAdapter {
  const destinationOk = (address: unknown): address is string => typeof address === "string" && BASE58_ADDRESS.test(address) && address !== rail.signer.publicKey;

  async function plan(job: ClaimedJob): Promise<PlannedTransfer> {
    const ctx = job.context as JobContext;
    if (job.obligation_type === "REFUND") {
      if (!["PENDING", "FAILED", "SUBMITTED"].includes(ctx.business_status)) throw new MoneyMovementError(`REFUND_STATE_${ctx.business_status}`, "REVIEW");
      const intent = ctx.intent;
      if (!intent || intent.network !== RAIL_NETWORK || intent.mint !== rail.mint) throw new MoneyMovementError("UNSUPPORTED_NETWORK_OR_MINT", "PERMANENT");
      if (ctx.source_signature) {
        // Operator-approved refund of ONE observed transfer (migration 017): the exact observed amount,
        // back to the wallet that sent THAT transaction. No destination is ever supplied by a person.
        const sourcePayer = await payerOf(rail, ctx.source_signature, String(intent.recipient));
        if (!destinationOk(sourcePayer)) throw new MoneyMovementError("SOURCE_PAYER_NOT_FOUND", "REVIEW");
        const exact = BigInt(ctx.asset_amount_base_units ?? "0");
        if (exact <= BigInt(0)) throw new MoneyMovementError("BUSINESS_AMOUNT_INVALID", "REVIEW");
        return { destination: sourcePayer, amountBaseUnits: exact, reference: await transferReference("refund", String(ctx.refund_id)) };
      }
      if (!intent.verified_signature) throw new MoneyMovementError("NO_VERIFIED_PAYMENT", "REVIEW");
      const payer = await payerOf(rail, intent.verified_signature, String(intent.recipient));
      if (!destinationOk(payer)) throw new MoneyMovementError("PAYER_NOT_FOUND", "REVIEW");
      // Full refunds return exactly what was received; partial ones convert at the payment's own rate.
      const full = Number(ctx.amount) === Number(intent.fiat_amount);
      const amount = full ? BigInt(intent.amount_base_units) : toBaseUnits(Number(ctx.amount), Number(ctx.fx_rate));
      if (amount <= BigInt(0) || amount > BigInt(intent.amount_base_units)) throw new MoneyMovementError("BUSINESS_AMOUNT_INVALID", "REVIEW");
      return { destination: payer, amountBaseUnits: amount, reference: await transferReference("refund", String(ctx.refund_id)) };
    }
    if (!["CREATED", "FAILED", "SUBMITTED"].includes(ctx.business_status)) throw new MoneyMovementError(`OBLIGATION_STATE_${ctx.business_status}`, "REVIEW");
    if (!ctx.destination) throw new MoneyMovementError("PAYOUT_DESTINATION_MISSING", "WAITING", 6 * 3600);
    if (!destinationOk(ctx.destination)) throw new MoneyMovementError("INVALID_PAYOUT_DESTINATION", "PERMANENT");
    if (job.obligation_type === "HELPER_PAYOUT") {
      const { data: enabled, error } = await client.rpc("payment_rail_enabled", { p_country: String(ctx.country ?? ""), p_capability: "USDC_HELPER_PAYOUT", p_network: RAIL_NETWORK, p_provider: RAIL_PROVIDER });
      if (error) throw new MoneyMovementError("POLICY_LOOKUP_FAILED", "RETRYABLE");
      if (enabled !== true) throw new MoneyMovementError("PAYMENT_RAIL_DISABLED", "PERMANENT");
      // Ledger amount -> USDC at the SAME rate the customer paid; never more than was received.
      const received = BigInt(ctx.intent?.amount_base_units ?? "0");
      const computed = toBaseUnits(Number(ctx.net_amount), Number(ctx.fx_rate));
      const amount = computed < received ? computed : received;
      if (amount <= BigInt(0)) throw new MoneyMovementError("NOTHING_TO_PAY", "REVIEW");
      return { destination: ctx.destination, amountBaseUnits: amount, reference: await transferReference("helper-payout", String(ctx.obligation_id)) };
    }
    // Referral payout: fiat reward at the explicit TEST FX rate (the job locks the amount at attempt 1).
    const fx = await getTestFxQuote(String(ctx.currency));
    if (!fx) throw new MoneyMovementError("FX_UNAVAILABLE", "REVIEW");
    const amount = toBaseUnits(Number(ctx.net_amount), fx.rate);
    if (amount <= BigInt(0)) throw new MoneyMovementError("NOTHING_TO_PAY", "REVIEW");
    return { destination: ctx.destination, amountBaseUnits: amount, reference: await transferReference("referral-payout", String(ctx.obligation_id)), meta: { fx_rate: fx.rate, fx_provider: fx.provider } };
  }

  async function observe(attempt: AttemptView): Promise<Observation> {
    const payload = attempt.adapter_payload as { lastValidBlockHeight?: number; reference?: string; legacy?: boolean };
    // A pre-outbox submission has no blockhash metadata: its expiry can never be proven.
    if (payload.legacy) throw new MoneyMovementError("LEGACY_ATTEMPT_UNVERIFIABLE", "REVIEW");
    const status = await rail.rpc.status(attempt.external_id);
    if (status?.err) return { kind: "FAILED_ONCHAIN", code: "TX_ERROR" };
    if (status?.confirmationStatus === "finalized") {
      const tx = await rail.rpc.transaction(attempt.external_id, "finalized");
      if (!tx) return { kind: "PENDING" };
      // Finality from the chain, not from the provider's label: the slot must be finalized.
      if (typeof tx.slot !== "number" || tx.slot > await rail.rpc.finalizedSlot()) return { kind: "PENDING" };
      const seen = observePayment(tx, { recipient: attempt.destination, mint: rail.mint, reference: String(payload.reference ?? "") });
      const exact = seen.txSuccess && seen.recipient === attempt.destination && seen.mint === rail.mint && seen.amountBaseUnits === attempt.amount_base_units && seen.referenceMatched;
      return exact ? { kind: "CONFIRMED" } : { kind: "MISMATCH", code: "LANDED_TRANSFER_MISMATCH" };
    }
    if (status) return { kind: "PENDING" };
    if (typeof payload.lastValidBlockHeight !== "number") return { kind: "NOT_FOUND", expired: false };
    // Expired only when even the FINALIZED height is past the blockhash's last valid height.
    return { kind: "NOT_FOUND", expired: (await rail.rpc.finalizedBlockHeight()) > payload.lastValidBlockHeight };
  }

  return {
    provider: RAIL_PROVIDER,
    network: RAIL_NETWORK,
    asset: "USDC",
    plan,
    async search(_job, planned) {
      const found = await rail.rpc.signaturesFor(planned.reference, 20);
      return found.map((s) => ({ externalId: s.signature, success: !s.err }));
    },
    async prepare(_job, planned) {
      const p = await prepareUsdcTransfer(rail.rpc, rail.signer, { mint: rail.mint, toOwner: planned.destination, amountBaseUnits: planned.amountBaseUnits, reference: planned.reference });
      return { externalId: p.signature, signedPayload: p.signedBase64, adapterPayload: { recentBlockhash: p.recentBlockhash, lastValidBlockHeight: p.lastValidBlockHeight, ...(planned.meta ?? {}) } };
    },
    async submit(attempt) {
      if (!attempt.signed_payload) throw new MoneyMovementError("NO_SIGNED_PAYLOAD", "REVIEW");
      try {
        await rail.rpc.sendBase64(attempt.signed_payload);
      } catch (error) {
        // Rebroadcast of bytes the network already has is success, not a new payment.
        if (/already been processed|AlreadyProcessed/i.test(error instanceof Error ? error.message : "")) return;
        throw error;
      }
    },
    observe,
  };
}

/** After a CONFIRMED Helper payout: settle the request (-> SETTLED -> cleanup -> CLOSED). */
function settlementHooks(client: SupabaseClient): MoneyJobHooks {
  return {
    async onConfirmed(job) {
      const requestId = (job.context as { request_id?: string }).request_id;
      if (job.obligation_type !== "HELPER_PAYOUT" || !requestId) return;
      const settled = await settleServiceRequest(client, requestId, "PAYOUT_RECONCILER");
      if (settled.ok) { await runConversationCleanup(client, { requestId }); await closeServiceRequest(client, requestId, "CLEANUP_RUNNER"); }
    },
  };
}

export type TransferOutcome = { status: string; signature?: string | null; reason?: string; obligationId?: string };
const outcome = (o: MoneyJobOutcome, obligationId?: string): TransferOutcome => ({ status: o.status, signature: o.externalId ?? null, reason: o.code, obligationId });

async function runFor(client: SupabaseClient, link: { payoutObligationId?: string; serviceRefundId?: string }, railArg?: DevnetRail | null): Promise<TransferOutcome> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_SUBMITTED", reason: "PAYOUT_RAIL_NOT_CONFIGURED" };
  const jobId = await moneyJobIdFor(client, link);
  if (!jobId) return { status: "NOT_SUBMITTED", reason: "MONEY_JOB_NOT_FOUND" };
  return outcome(await runMoneyJob(client, devnetAdapter(client, rail), jobId, settlementHooks(client)));
}

/** Inline fast path after "서비스 완료": the obligation's job is processed now; the outbox retries on any failure. */
export const processHelperPayout = (client: SupabaseClient, obligationId: string, rail?: DevnetRail | null) => runFor(client, { payoutObligationId: obligationId }, rail);
export const processRefund = (client: SupabaseClient, refundId: string, rail?: DevnetRail | null) => runFor(client, { serviceRefundId: refundId }, rail);

/** Referral payout: PAYABLE -> exactly one obligation (+ its job, same transaction) -> processed. Qualification unchanged. */
export async function processReferralPayout(client: SupabaseClient, rewardId: string, country: string, railArg?: DevnetRail | null): Promise<TransferOutcome> {
  const rail = railArg ?? await getDevnetRail();
  if (!rail) return { status: "NOT_SUBMITTED", reason: "PAYOUT_RAIL_NOT_CONFIGURED" };
  // QUALIFIED -> PAYABLE only through the trusted promotion (re-checks attribution, settled request, no refund).
  // A reward already past PAYABLE falls through: the obligation call replays its existing obligation.
  const { data: promoted } = await client.rpc("promote_referral_reward_payable", { p_reward_id: rewardId });
  if (!promoted?.success && promoted?.code !== "REWARD_NOT_QUALIFIED") return { status: "NOT_SUBMITTED", reason: String(promoted?.code ?? "PROMOTION_FAILED") };
  const { data: created } = await client.rpc("create_referral_payout_obligation", { p_reward_id: rewardId, p_rail: "USDC_SOLANA", p_country: country });
  if (!created?.success) return { status: "NOT_SUBMITTED", reason: String(created?.code ?? "OBLIGATION_FAILED") };
  const obligationId = String(created.payout_obligation_id);
  return { ...(await runFor(client, { payoutObligationId: obligationId }, rail)), obligationId };
}

/** Durable retry (cron / operator): every due job, bounded. No adapter in this environment -> nothing moves. */
export async function runMoneyOutbox(client: SupabaseClient, limit = 20): Promise<{ processed: MoneyJobOutcome[]; configured: boolean }> {
  const rail = await getDevnetRail();
  if (!rail) return { processed: [], configured: false };
  const hooks = settlementHooks(client);
  const processed = await runDueMoneyJobs(client, devnetAdapter(client, rail), limit, hooks);
  // Crash after CONFIRMED but before settlement: finish the settlement of paid, still-pending requests.
  const { data: paid } = await client.from("payout_obligations").select("request_id").eq("kind", "HELPER_SERVICE").eq("status", "PAID").order("paid_at", { ascending: false }).limit(50);
  const ids = (paid ?? []).map((r) => r.request_id as string).filter(Boolean);
  const { data: pending } = ids.length ? await client.from("service_requests").select("id").in("id", ids).eq("status", "PAYMENT_PENDING").limit(limit) : { data: [] };
  for (const row of pending ?? []) {
    await hooks.onConfirmed?.({ obligation_type: "HELPER_PAYOUT", context: { request_id: row.id } } as unknown as ClaimedJob).catch(() => undefined);
  }
  return { processed, configured: true };
}

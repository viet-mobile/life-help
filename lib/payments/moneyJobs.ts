import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Durable money-movement outbox engine (provider-neutral; migration 202609270015).
 *
 * One business obligation (Helper payout, Referral payout, refund) = exactly one money_movement_job,
 * created by the database together with the obligation. This engine processes a job under a LEASE
 * (every write is fenced by the lease token) with one rule above all others:
 *
 *   a job that already has a live attempt (PREPARED / SUBMITTED) is ALWAYS reconciled first -
 *   same external id, same signed payload - and a new attempt is only created after the previous
 *   one is provably terminal (FAILED_ONCHAIN, or EXPIRED_NOT_LANDED after the adapter proved it can
 *   no longer land AND a confirmation search found nothing).
 *
 * Crash windows:
 *   claim -> crash                       lease expires, the next worker reclaims the same job
 *   prepare (persisted) -> crash          the retry finds the PREPARED attempt: reconcile / rebroadcast it
 *   broadcast -> crash before ack        same as above: PREPARED is treated as "possibly broadcast"
 *   submitted, result lost / pending     reconcile the SAME external id; never a second attempt
 *   uncertain (unverifiable, unknown transfer for the reference, mismatch) -> REVIEW_REQUIRED
 * Only a CONFIRMED observation (finalized + re-verified by the adapter) moves the obligation to
 * PAID / COMPLETED - through the database, atomically with the attempt and the job.
 *
 * Adapters are environment-specific (staging: Solana devnet direct signer; production: a licensed
 * PSP / custody / payout provider). The engine itself never signs and never holds keys.
 */

export type ErrorClass = "RETRYABLE" | "PERMANENT" | "REVIEW" | "WAITING";

export class MoneyMovementError extends Error {
  readonly code: string;
  readonly errorClass: ErrorClass;
  readonly delaySeconds?: number;
  constructor(code: string, errorClass: ErrorClass, delaySeconds?: number) {
    super(code);
    this.code = code;
    this.errorClass = errorClass;
    this.delaySeconds = delaySeconds;
  }
}

/** Error -> retry class. Transient transport failures retry (bounded); configuration / business errors go to review. */
export function classifyMoneyError(error: unknown): { code: string; errorClass: ErrorClass; delaySeconds?: number } {
  if (error instanceof MoneyMovementError) return { code: error.code, errorClass: error.errorClass, delaySeconds: error.delaySeconds };
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);
  if (/^(MINT_NOT_ALLOWED|INVALID_ADDRESS|INVALID_PUBLIC_KEY|INVALID_AMOUNT|MAINNET_DISABLED|SIGNER_KEY_MISMATCH|MISSING_SIGNER)$/.test(message) || name === "MainnetDisabledError") {
    return { code: message || name, errorClass: "PERMANENT" };
  }
  if (name === "TimeoutError" || name === "AbortError") return { code: "RPC_TIMEOUT", errorClass: "RETRYABLE" };
  if (/HTTP_(429|5\d\d)|fetch failed|ECONN|ETIMEDOUT|network|timeout/i.test(message)) return { code: message.slice(0, 80) || "TRANSIENT", errorClass: "RETRYABLE" };
  // Unknown errors are retried, but bounded by the job's max_failures (then REVIEW_REQUIRED).
  return { code: (message || "UNKNOWN_ERROR").slice(0, 80), errorClass: "RETRYABLE" };
}

export type AttemptView = {
  attempt_id: string; attempt_number: number; state: string; provider: string; network: string; asset: string;
  amount_base_units: string; destination: string; external_id: string; adapter_payload: Record<string, unknown>;
  signed_payload: string | null; submitted_at: string | null;
};

export type ClaimedJob = {
  job_id: string; lease_token: string; claim_expires_at: string; recovered_lease: boolean;
  obligation_type: "HELPER_PAYOUT" | "REFERRAL_PAYOUT" | "REFUND"; rail: string; status: string;
  provider: string | null; network: string | null; asset: string | null; amount_base_units: string | null;
  attempt_count: number; max_attempts: number; failure_count: number;
  live_attempt: AttemptView | null; attempts: AttemptView[]; context: Record<string, unknown>;
};

export type PlannedTransfer = { destination: string; amountBaseUnits: bigint; reference: string; meta?: Record<string, unknown> };
export type PreparedTransfer = { externalId: string; signedPayload: string | null; adapterPayload: Record<string, unknown> };
export type Observation =
  | { kind: "CONFIRMED" }
  | { kind: "PENDING" }
  | { kind: "FAILED_ONCHAIN"; code: string }
  | { kind: "MISMATCH"; code: string }
  | { kind: "NOT_FOUND"; expired: boolean };

export interface MoneyAdapter {
  readonly provider: string;
  readonly network: string;
  readonly asset: string;
  /** Business -> transfer (destination, amount, reference). Throws MoneyMovementError (WAITING / PERMANENT / REVIEW / RETRYABLE). */
  plan(job: ClaimedJob): Promise<PlannedTransfer>;
  /** Confirmation search: every external transfer already carrying this job's reference. */
  search(job: ClaimedJob, plan: PlannedTransfer): Promise<Array<{ externalId: string; success: boolean }>>;
  /** Build + sign ONE transfer. Must not broadcast. */
  prepare(job: ClaimedJob, plan: PlannedTransfer): Promise<PreparedTransfer>;
  /** Broadcast the persisted attempt (the same bytes on every call). */
  submit(attempt: AttemptView): Promise<void>;
  /** Where is this attempt? CONFIRMED only after finality + re-verification of destination / asset / amount / reference. */
  observe(attempt: AttemptView): Promise<Observation>;
}

export type MoneyJobHooks = { onConfirmed?: (job: ClaimedJob) => Promise<void> };
export type MoneyJobOutcome = { jobId: string | null; status: string; code?: string; externalId?: string };

async function call(client: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new MoneyMovementError(`DB_${fn}_${error.code ?? "ERROR"}`, "RETRYABLE");
  return (data ?? {}) as Record<string, unknown>;
}

export async function claimMoneyJob(client: SupabaseClient, jobId: string | null, leaseSeconds = 120): Promise<{ job: ClaimedJob | null; code?: string }> {
  const r = await call(client, "claim_money_job", { p_job_id: jobId, p_lease_seconds: leaseSeconds });
  if (r.success !== true) return { job: null, code: String(r.code ?? "CLAIM_FAILED") };
  return { job: (r.job ?? null) as ClaimedJob | null };
}

const fence = (job: ClaimedJob) => ({ p_job_id: job.job_id, p_lease: job.lease_token });

async function release(client: SupabaseClient, job: ClaimedJob, error: unknown): Promise<MoneyJobOutcome> {
  const c = classifyMoneyError(error);
  const r = await call(client, "release_money_job", { ...fence(job), p_class: c.errorClass, p_code: c.code, p_delay_seconds: c.delaySeconds ?? null });
  return { jobId: job.job_id, status: String(r.status ?? r.code ?? "RELEASED"), code: c.code };
}

async function result(client: SupabaseClient, job: ClaimedJob, attempt: AttemptView, outcome: string, code: string | null, hooks: MoneyJobHooks): Promise<MoneyJobOutcome> {
  const r = await call(client, "record_money_attempt_result", { ...fence(job), p_attempt_id: attempt.attempt_id, p_outcome: outcome, p_code: code });
  if (r.success !== true) return { jobId: job.job_id, status: "NOT_RECORDED", code: String(r.code ?? "RESULT_REFUSED"), externalId: attempt.external_id };
  if (r.status === "CONFIRMED" && hooks.onConfirmed) await hooks.onConfirmed(job).catch(() => undefined);
  return { jobId: job.job_id, status: String(r.status), externalId: attempt.external_id };
}

/** Reconcile an existing live attempt. Never creates a new one. */
async function reconcile(client: SupabaseClient, adapter: MoneyAdapter, job: ClaimedJob, attempt: AttemptView, hooks: MoneyJobHooks): Promise<MoneyJobOutcome> {
  const seen = await adapter.observe(attempt);
  if (seen.kind === "CONFIRMED") return result(client, job, attempt, "CONFIRMED", null, hooks);
  if (seen.kind === "PENDING") return result(client, job, attempt, "PENDING", null, hooks);
  if (seen.kind === "FAILED_ONCHAIN") return result(client, job, attempt, "FAILED_ONCHAIN", seen.code, hooks);
  if (seen.kind === "MISMATCH") return release(client, job, new MoneyMovementError(seen.code, "REVIEW"));
  if (!seen.expired) {
    // Still able to land: rebroadcast the SAME signed bytes (same signature), then look again later.
    if (attempt.signed_payload) {
      await adapter.submit(attempt);
      if (attempt.state === "PREPARED") await call(client, "mark_money_attempt_submitted", { ...fence(job), p_attempt_id: attempt.attempt_id });
    }
    return release(client, job, new MoneyMovementError("AWAITING_NETWORK", "WAITING", 15));
  }
  // Blockhash provably expired and the signature is unknown to the network. Before declaring it
  // dead, search for ANY transfer carrying this job's reference (a landed transfer wins, always).
  const plan = { destination: attempt.destination, amountBaseUnits: BigInt(attempt.amount_base_units), reference: String(attempt.adapter_payload.reference ?? "") };
  const found = plan.reference ? await adapter.search(job, plan) : [];
  if (found.some((f) => f.success)) {
    const ours = found.find((f) => f.success && f.externalId === attempt.external_id);
    if (ours) return release(client, job, new MoneyMovementError("SEARCH_SEES_EXPIRED_ATTEMPT", "RETRYABLE"));
    return release(client, job, new MoneyMovementError("UNKNOWN_TRANSFER_FOR_REFERENCE", "REVIEW"));
  }
  return result(client, job, attempt, "EXPIRED_NOT_LANDED", attempt.state === "PREPARED" ? "EXPIRED_NEVER_SEEN" : "EXPIRED_SUBMITTED_NOT_LANDED", hooks);
}

/** Process one claimed job to its next durable state. Every exit releases or finalizes the lease. */
export async function processClaimedMoneyJob(client: SupabaseClient, adapter: MoneyAdapter, job: ClaimedJob, hooks: MoneyJobHooks = {}): Promise<MoneyJobOutcome> {
  try {
    if (job.live_attempt) return await reconcile(client, adapter, job, job.live_attempt, hooks);

    const plan = await adapter.plan(job);
    // Confirmation search BEFORE any new attempt: nothing may be paid twice for one obligation.
    const found = await adapter.search(job, plan);
    if (found.some((f) => f.success)) {
      const known = found.find((f) => f.success && job.attempts.some((a) => a.external_id === f.externalId));
      return await release(client, job, new MoneyMovementError(known ? "TERMINAL_ATTEMPT_LANDED" : "UNKNOWN_TRANSFER_FOR_REFERENCE", "REVIEW"));
    }
    const prepared = await adapter.prepare(job, plan);
    const persisted = await call(client, "prepare_money_attempt", {
      ...fence(job), p_provider: adapter.provider, p_network: adapter.network, p_asset: adapter.asset,
      p_amount_base_units: plan.amountBaseUnits.toString(), p_destination: plan.destination, p_external_id: prepared.externalId,
      p_adapter_payload: { ...prepared.adapterPayload, reference: plan.reference }, p_signed_payload: prepared.signedPayload,
    });
    if (persisted.success !== true) {
      // Nothing was broadcast. LIVE_ATTEMPT_EXISTS: reconcile that one instead.
      if (persisted.code === "LIVE_ATTEMPT_EXISTS" && persisted.attempt) return await reconcile(client, adapter, job, persisted.attempt as AttemptView, hooks);
      return { jobId: job.job_id, status: String(persisted.status ?? "NOT_PREPARED"), code: String(persisted.code ?? "PREPARE_REFUSED") };
    }
    const attempt: AttemptView = {
      attempt_id: String(persisted.attempt_id), attempt_number: Number(persisted.attempt_number), state: "PREPARED",
      provider: adapter.provider, network: adapter.network, asset: adapter.asset, amount_base_units: plan.amountBaseUnits.toString(),
      destination: plan.destination, external_id: prepared.externalId, adapter_payload: { ...prepared.adapterPayload, reference: plan.reference },
      signed_payload: prepared.signedPayload, submitted_at: null,
    };
    // Persisted first, broadcast second: a crash from here on leaves a recoverable PREPARED attempt.
    await adapter.submit(attempt);
    const marked = await call(client, "mark_money_attempt_submitted", { ...fence(job), p_attempt_id: attempt.attempt_id });
    if (marked.success !== true) return { jobId: job.job_id, status: "SUBMITTED_UNACKNOWLEDGED", code: String(marked.code), externalId: attempt.external_id };
    return await reconcile(client, adapter, job, { ...attempt, state: "SUBMITTED" }, hooks);
  } catch (error) {
    return release(client, job, error).catch(() => ({ jobId: job.job_id, status: "LEASE_LEFT_TO_EXPIRE", code: classifyMoneyError(error).code }));
  }
}

/** Inline fast path / targeted retry: claim this job (if due and free) and process it. */
export async function runMoneyJob(client: SupabaseClient, adapter: MoneyAdapter, jobId: string, hooks: MoneyJobHooks = {}): Promise<MoneyJobOutcome> {
  const { job, code } = await claimMoneyJob(client, jobId);
  if (!job) return { jobId, status: "NOT_CLAIMED", code };
  return processClaimedMoneyJob(client, adapter, job, hooks);
}

/** Durable retry loop (cron / operator): due jobs, bounded per run. */
export async function runDueMoneyJobs(client: SupabaseClient, adapter: MoneyAdapter, limit = 20, hooks: MoneyJobHooks = {}): Promise<MoneyJobOutcome[]> {
  const outcomes: MoneyJobOutcome[] = [];
  for (let i = 0; i < limit; i += 1) {
    const { job } = await claimMoneyJob(client, null);
    if (!job) break;
    outcomes.push(await processClaimedMoneyJob(client, adapter, job, hooks));
  }
  return outcomes;
}

export async function moneyJobIdFor(client: SupabaseClient, link: { payoutObligationId?: string; serviceRefundId?: string }): Promise<string | null> {
  const column = link.payoutObligationId ? "payout_obligation_id" : "service_refund_id";
  const value = link.payoutObligationId ?? link.serviceRefundId;
  if (!value) return null;
  const { data } = await client.from("money_movement_jobs").select("id").eq(column, value).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Operator REVIEW_REQUIRED console data (migration 017). Read-only views over the existing ledger;
 * the only write path is operator_review_action(). Every select names its columns explicitly: signed
 * transaction bytes, keys and provider secrets are never read here, and customer private auth data is
 * never joined in.
 */

export type ReviewCaseType = "PAYMENT" | "MONEY_JOB";
export const REVIEW_ACTIONS = ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "MARK_NO_FURTHER_AUTOMATION", "INITIATE_REFUND", "CLOSE_AS_REVIEWED", "ESCALATE", "NOTE"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];
/** Actions that can lead to external money movement: always need an explicit second confirmation. */
export const MONEY_ACTIONS: ReviewAction[] = ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "INITIATE_REFUND"];

export type ReviewCaseRow = {
  caseType: ReviewCaseType; caseId: string; kind: string; status: string; reason: string | null;
  amount: string | null; currency: string | null; token: string; network: string | null;
  destination: string | null; destinationSource: string | null; signatures: string[];
  obligationId: string | null; paymentIntentId: string | null; requestId: string | null;
  createdAt: string; updatedAt: string | null; attemptCount: number | null; lastError: string | null;
  leaseHeld: boolean; closed: boolean; allowedActions: string[];
};

const PAYMENT_REVIEW_CLASSES = ["UNDERPAID", "OVERPAID", "WRONG_RECIPIENT", "WRONG_MINT", "WRONG_NETWORK", "MISSING_REFERENCE", "LATE", "EXTRA_PAYMENT"];
const STUCK_AFTER_MS = 60 * 60 * 1000;
const usdc = (baseUnits: unknown) => (baseUnits === null || baseUnits === undefined ? null : (Number(baseUnits) / 1_000_000).toFixed(6));

async function rules(client: SupabaseClient, caseType: ReviewCaseType, caseId: string) {
  const { data } = await client.rpc("review_case_actions", { p_case_type: caseType, p_case_id: caseId });
  return (data ?? { exists: false, actions: [] }) as { exists: boolean; closed?: boolean; lease_held?: boolean; actions: string[]; refundable_transfers?: Array<Record<string, string>> };
}

export async function listReviewCases(client: SupabaseClient, filter: { caseType?: string; status?: string; reason?: string; includeClosed?: boolean } = {}): Promise<ReviewCaseRow[]> {
  const rows: ReviewCaseRow[] = [];
  if (!filter.caseType || filter.caseType === "PAYMENT") {
    const { data: txs } = await client.from("payment_chain_transactions").select("payment_intent_id, signature, classification, amount_base_units, network, observed_at").in("classification", PAYMENT_REVIEW_CLASSES).limit(500);
    const { data: reviewIntents } = await client.from("payment_intents").select("id").eq("status", "REVIEW_REQUIRED").limit(500);
    const ids = [...new Set([...(txs ?? []).map((t) => t.payment_intent_id as string), ...(reviewIntents ?? []).map((i) => i.id as string)])];
    const { data: intents } = ids.length ? await client.from("payment_intents").select("id, status, network, mint, fiat_currency, fiat_amount, amount_base_units, request_id, created_at, updated_at").in("id", ids) : { data: [] };
    for (const intent of intents ?? []) {
      const mine = (txs ?? []).filter((t) => t.payment_intent_id === intent.id);
      const r = await rules(client, "PAYMENT", intent.id);
      rows.push({
        caseType: "PAYMENT", caseId: intent.id, kind: `PAYMENT:${mine.map((t) => t.classification).join("+") || "REVIEW"}`, status: intent.status,
        reason: mine.map((t) => t.classification).join(", ") || null, amount: usdc(mine.reduce((sum, t) => sum + Number(t.amount_base_units ?? 0), 0)),
        currency: intent.fiat_currency, token: "USDC", network: intent.network, destination: null,
        destinationSource: (r.refundable_transfers?.length ?? 0) > 0 ? "PAYER_OF_SOURCE_SIGNATURE" : null,
        signatures: mine.map((t) => t.signature as string), obligationId: null, paymentIntentId: intent.id, requestId: intent.request_id,
        createdAt: intent.created_at, updatedAt: intent.updated_at, attemptCount: null, lastError: null, leaseHeld: false,
        closed: r.closed === true, allowedActions: r.actions ?? [],
      });
    }
  }
  if (!filter.caseType || filter.caseType === "MONEY_JOB") {
    const { data: jobs } = await client.from("money_movement_jobs").select("id, obligation_type, payout_obligation_id, service_refund_id, rail, provider, network, asset, amount_base_units, status, attempt_count, failure_count, last_error_code, last_error_class, claim_expires_at, next_retry_at, created_at, updated_at, automation_policy").not("status", "in", "(CONFIRMED)").limit(500);
    const now = Date.now();
    for (const job of jobs ?? []) {
      const stuck = job.status !== "REVIEW_REQUIRED" && job.status !== "FAILED_PERMANENT" && (Number(job.failure_count) >= 3 || now - new Date(job.updated_at).getTime() > STUCK_AFTER_MS);
      if (job.status !== "REVIEW_REQUIRED" && job.status !== "FAILED_PERMANENT" && !stuck) continue;
      const { data: attempts } = await client.from("money_movement_attempts").select("external_id, destination, state").eq("job_id", job.id).order("attempt_number");
      const r = await rules(client, "MONEY_JOB", job.id);
      const last = attempts?.[attempts.length - 1];
      rows.push({
        caseType: "MONEY_JOB", caseId: job.id, kind: `JOB:${job.obligation_type}${stuck ? ":STUCK" : ""}`, status: job.status,
        reason: job.last_error_code, amount: usdc(job.amount_base_units), currency: null, token: job.asset ?? "USDC", network: job.network,
        destination: last?.destination ?? null, destinationSource: job.obligation_type === "REFUND" ? "PAYER_OF_VERIFIED_PAYMENT" : "OBLIGATION_PAYOUT_DESTINATION",
        signatures: (attempts ?? []).map((a) => a.external_id as string), obligationId: job.payout_obligation_id ?? job.service_refund_id, paymentIntentId: null, requestId: null,
        createdAt: job.created_at, updatedAt: job.updated_at, attemptCount: job.attempt_count, lastError: job.last_error_code,
        leaseHeld: !!job.claim_expires_at && new Date(job.claim_expires_at).getTime() > now, closed: r.closed === true, allowedActions: r.actions ?? [],
      });
    }
  }
  return rows
    .filter((row) => filter.includeClosed || !row.closed)
    .filter((row) => !filter.status || row.status === filter.status)
    .filter((row) => !filter.reason || (row.reason ?? "").includes(filter.reason))
    .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
}

/** One case: FACTS (observed on chain), SYSTEM DECISIONS, OPERATOR ACTIONS, and what is still unresolved. */
export async function reviewCaseDetail(client: SupabaseClient, caseType: ReviewCaseType, caseId: string) {
  const r = await rules(client, caseType, caseId);
  if (!r.exists) return null;
  const { data: operatorActions } = await client.from("operator_review_actions").select("action, operator_id, operator_kind, reason, previous_state, resulting_state, safe_refs, created_at").eq("case_type", caseType).eq("case_id", caseId).order("created_at");
  if (caseType === "PAYMENT") {
    const { data: intent } = await client.from("payment_intents").select("id, checkout_id, status, network, mint, recipient, reference, fiat_currency, fiat_amount, amount_base_units, verified_signature, request_id, expires_at, created_at, updated_at").eq("id", caseId).maybeSingle();
    const { data: chain } = await client.from("payment_chain_transactions").select("signature, network, slot, mint, recipient, amount_base_units, reference_matched, tx_success, confirmation, classification, observed_at").eq("payment_intent_id", caseId).order("observed_at");
    const { data: events } = await client.from("payment_events").select("event_type, received_at").eq("payment_intent_id", caseId).order("received_at");
    const { data: refunds } = await client.from("service_refunds").select("id, reason, status, amount, currency, source_signature, asset_amount_base_units, chain_signature, created_at, completed_at").eq("payment_intent_id", caseId).order("created_at");
    const { data: request } = intent?.request_id ? await client.from("service_requests").select("id, status, request_mode").eq("id", intent.request_id).maybeSingle() : { data: null };
    const { data: selections } = intent?.request_id ? await client.from("request_price_selections").select("selection_version, status, helper_id, initial_payable_amount, currency").eq("request_id", intent.request_id).order("selection_version") : { data: [] };
    return {
      caseType, caseId, closed: r.closed === true, allowedActions: r.actions, refundableTransfers: r.refundable_transfers ?? [],
      facts: { observedOnChain: chain ?? [] },
      systemDecisions: { intent, events: events ?? [], refunds: refunds ?? [], request, priceSelections: selections ?? [] },
      operatorActions: operatorActions ?? [],
      unresolved: r.closed !== true,
    };
  }
  const { data: job } = await client.from("money_movement_jobs").select("id, obligation_type, payout_obligation_id, service_refund_id, rail, provider, network, asset, amount_base_units, status, automation_policy, attempt_count, max_attempts, failure_count, max_failures, claim_expires_at, next_retry_at, last_attempt_at, last_error_code, last_error_class, confirmed_at, created_at, updated_at").eq("id", caseId).maybeSingle();
  const { data: attempts } = await client.from("money_movement_attempts").select("attempt_number, state, provider, network, asset, amount_base_units, destination, external_id, failure_category, prepared_at, submitted_at, resolved_at").eq("job_id", caseId).order("attempt_number");
  const { data: obligation } = job?.payout_obligation_id ? await client.from("payout_obligations").select("id, kind, status, currency, gross_amount, platform_fee_amount, net_amount, fee_policy, payout_rail, request_id, referral_reward_id, chain_signature, created_at, submitted_at, paid_at").eq("id", job.payout_obligation_id).maybeSingle() : { data: null };
  const { data: refund } = job?.service_refund_id ? await client.from("service_refunds").select("id, reason, status, amount, currency, payment_intent_id, source_signature, asset_amount_base_units, chain_signature, created_at, completed_at").eq("id", job.service_refund_id).maybeSingle() : { data: null };
  return {
    caseType, caseId, closed: r.closed === true, allowedActions: r.actions,
    facts: { attemptsObservedExternally: (attempts ?? []).map((a) => ({ attempt: a.attempt_number, externalId: a.external_id, state: a.state, destination: a.destination, amountBaseUnits: a.amount_base_units })) },
    systemDecisions: { job, attempts: attempts ?? [], obligation, refund },
    operatorActions: operatorActions ?? [],
    unresolved: r.closed !== true && job?.status !== "CONFIRMED",
  };
}

/** The confirmation summary shown before any action that may move money (no secret material). */
export async function moneyActionSummary(client: SupabaseClient, caseType: ReviewCaseType, caseId: string, action: ReviewAction, signature?: string) {
  if (caseType === "PAYMENT") {
    const { data: tx } = await client.from("payment_chain_transactions").select("signature, amount_base_units, network, mint, classification").eq("payment_intent_id", caseId).eq("signature", signature ?? "").maybeSingle();
    return { case: `${caseType}:${caseId}`, action, amount: usdc(tx?.amount_base_units), token: "USDC", network: tx?.network ?? null, provider: "configured refund rail", destinationSource: "the wallet that sent this transaction (derived on chain at execution)", sourceSignature: tx?.signature ?? null, classification: tx?.classification ?? null };
  }
  const { data: job } = await client.from("money_movement_jobs").select("obligation_type, provider, network, asset, amount_base_units").eq("id", caseId).maybeSingle();
  return {
    case: `${caseType}:${caseId}`, action, amount: usdc(job?.amount_base_units), token: job?.asset ?? "USDC", network: job?.network ?? null, provider: job?.provider ?? "configured rail",
    destinationSource: job?.obligation_type === "REFUND" ? "payer of the verified payment" : "the obligation's registered payout destination",
    effect: action === "RETRY_RECONCILIATION" ? "reconcile existing attempts only; never creates a new transfer" : "one more automatic attempt, after a reference search proves nothing landed",
  };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { maskAttemptKey, maskDestination, maskProviderEvidence, maskReference } from "@/lib/admin/maskDestination";

/**
 * Operator REVIEW_REQUIRED console data (migration 017). Read-only views over the existing ledger;
 * the only write path is operator_review_action(). Every select names its columns explicitly: signed
 * transaction bytes, keys and provider secrets are never read here, and customer private auth data is
 * never joined in. Payout destinations and payment receiving wallets (intent / observed recipients) are read
 * only to derive masked display values (maskDestination); the raw addresses are never returned. Likewise provider
 * object references, operator ids and Helper internal ids are read server-side only and returned as masked /
 * public display values (safe* helpers below). LIFE.HELP attempt / idempotency keys on provider networks (and
 * every copy: obligation / refund chain_signature, provider-hosted verified_signature) are masked too; on-chain
 * transaction signatures stay in full (public chain evidence). provider_event_id: full only in the authorized
 * case detail (replay / support investigation), masked in the queue's provider list. Payment references are
 * intentionally returned in full: public chain / payment references needed for reconciliation. None of these
 * display values is ever used for any decision.
 */

export type ReviewCaseType = "PAYMENT" | "MONEY_JOB";
export const REVIEW_ACTIONS = ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "MARK_NO_FURTHER_AUTOMATION", "INITIATE_REFUND", "CLOSE_AS_REVIEWED", "ESCALATE", "NOTE"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];
/** Actions that can lead to external money movement: always need an explicit second confirmation. */
export const MONEY_ACTIONS: ReviewAction[] = ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "INITIATE_REFUND"];

export type ReviewCaseRow = {
  caseType: ReviewCaseType; caseId: string; kind: string; status: string; reason: string | null;
  amount: string | null; currency: string | null; token: string; network: string | null;
  destinationMasked: string | null; destinationSource: string | null; signatures: string[];
  obligationId: string | null; paymentIntentId: string | null; requestId: string | null;
  createdAt: string; updatedAt: string | null; attemptCount: number | null; lastError: string | null;
  leaseHeld: boolean; closed: boolean; allowedActions: string[];
};

const PAYMENT_REVIEW_CLASSES = ["UNDERPAID", "OVERPAID", "WRONG_RECIPIENT", "WRONG_MINT", "WRONG_NETWORK", "MISSING_REFERENCE", "LATE", "EXTRA_PAYMENT"];
const STUCK_AFTER_MS = 60 * 60 * 1000;
/** Provider evidence columns shown to operators (evidence only: no payload, no secrets). */
const PROVIDER_EVENT_COLUMNS = "provider, environment, provider_event_id, source, event_type, provider_event_type, object_ref, amount_minor, currency, occurred_at, provider_sequence, received_at, processed_at, processing_result, result_code";

/**
 * Provider evidence that could not be tied to a ledger object, or that the ledger refused / sent to review
 * (unknown provider payment or transfer, amount / currency / target mismatch, wrong environment, provider
 * confirming an attempt the ledger considers failed). Read-only in the existing queue; the affected intent /
 * money job (when there is one) is itself REVIEW_REQUIRED and actionable through the normal case actions.
 */
export async function listProviderEventsNeedingReview(client: SupabaseClient) {
  const { data } = await client.from("provider_events").select(`${PROVIDER_EVENT_COLUMNS}, payment_intent_id, money_job_id`)
    .in("processing_result", ["UNMATCHED", "REVIEW", "REJECTED"]).order("received_at", { ascending: false }).limit(200);
  // Queue / list: the provider event id is masked here; the exact id stays in the authorized case detail.
  return safeProviderEvents(data).map(({ provider_event_id, ...rest }) => ({ ...rest, providerEventIdMasked: maskReference(provider_event_id as string | null) }));
}

/** Provider evidence rows without the raw provider object reference (objectRefMasked for correlation). */
function safeProviderEvents<T extends { object_ref?: unknown }>(rows: T[] | null): Array<Omit<T, "object_ref"> & { objectRefMasked: string | null }> {
  return (rows ?? []).map(({ object_ref, ...rest }) => ({ ...rest, objectRefMasked: maskReference(object_ref as string | null) }));
}
/** Operator action history without the raw operator id: trusted label from operator_kind + a masked id. */
function safeOperatorActions<T extends { operator_id?: unknown; operator_kind?: unknown }>(rows: T[] | null) {
  return (rows ?? []).map(({ operator_id, ...rest }) => ({
    ...rest,
    operatorLabel: rest.operator_kind === "PLATFORM_TOKEN" ? "Platform operator token" : rest.operator_kind === "SYS_SESSION" ? "SYS admin session" : "Operator",
    operatorIdMasked: rest.operator_kind === "PLATFORM_TOKEN" ? null : maskReference(operator_id as string | null),
  }));
}

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
        currency: intent.fiat_currency, token: "USDC", network: intent.network, destinationMasked: null,
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
      const { data: attempts } = await client.from("money_movement_attempts").select("external_id, destination, network, state").eq("job_id", job.id).order("attempt_number");
      const r = await rules(client, "MONEY_JOB", job.id);
      const last = attempts?.[attempts.length - 1];
      rows.push({
        caseType: "MONEY_JOB", caseId: job.id, kind: `JOB:${job.obligation_type}${stuck ? ":STUCK" : ""}`, status: job.status,
        reason: job.last_error_code, amount: usdc(job.amount_base_units), currency: null, token: job.asset ?? "USDC", network: job.network,
        destinationMasked: maskDestination(last?.destination, last?.network), destinationSource: job.obligation_type === "REFUND" ? "PAYER_OF_VERIFIED_PAYMENT" : "OBLIGATION_PAYOUT_DESTINATION",
        signatures: (attempts ?? []).map((a) => maskAttemptKey(a.external_id as string, a.network as string) as string), obligationId: job.payout_obligation_id ?? job.service_refund_id, paymentIntentId: null, requestId: null,
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

/**
 * Read-only payout evidence for a money-job case, per ATTEMPT (migration 023). providerReportedPaidAt comes only
 * from money_movement_attempts.provider_reported_paid_at: the provider SAID it paid - NOT a final status, NOT
 * beneficiary receipt, NOT a LIFE.HELP payout confirmation. Final confirmation is only an attempt in state
 * CONFIRMED (and the obligation / refund status the ledger shows). Never derived from job codes or events.
 */
type AttemptEvidenceRow = { attempt_number: number; state: string; provider: string; network: string; attemptKeyDisplay: string | null; destinationMasked: string | null; provider_reported_paid_at?: string | null };
function payoutEvidence(job: Record<string, unknown> | null, attempts: AttemptEvidenceRow[], business: Record<string, unknown> | null) {
  return {
    jobStatus: job?.status ?? null, reviewReason: job?.last_error_code ?? null, provider: job?.provider ?? null, network: job?.network ?? null,
    businessStatus: business?.status ?? null, obligationId: job?.payout_obligation_id ?? job?.service_refund_id ?? null,
    attempts: attempts.map((a) => ({
      attempt: a.attempt_number, state: a.state, provider: a.provider, network: a.network, attemptKey: a.attemptKeyDisplay, destinationMasked: a.destinationMasked,
      providerReportedPaidAt: a.provider_reported_paid_at ?? null, finalConfirmation: a.state === "CONFIRMED",
    })),
  };
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
    const { data: providerEvidence } = await client.from("provider_events").select(PROVIDER_EVENT_COLUMNS).eq("payment_intent_id", caseId).order("received_at");
    // Helper display: the public Helper code joined server-side (presentation only, never authority); a masked
    // internal id only when no public mapping exists. The raw internal helper_id is not returned.
    const helperIds = [...new Set((selections ?? []).map((x) => x.helper_id as string).filter(Boolean))];
    const { data: helperRows } = helperIds.length ? await client.from("helpers").select("id, helper_id").in("id", helperIds) : { data: [] };
    const publicHelper = new Map((helperRows ?? []).map((h) => [h.id as string, h.helper_id as string]));
    const safeSelections = (selections ?? []).map(({ helper_id, ...rest }) => ({
      ...rest, helperPublicId: publicHelper.get(helper_id as string) ?? null, helperIdMasked: publicHelper.has(helper_id as string) ? null : maskReference(helper_id as string | null),
    }));
    // Least exposure: the platform receiving wallet (and any observed recipient) is returned masked only. The
    // comparison with the intent's recipient happens HERE on the full values (display flag only; the ledger's own
    // classification - e.g. WRONG_RECIPIENT - remains the authority and is unchanged).
    const { recipient: intentRecipient, ...intentRest } = intent ?? ({} as Record<string, unknown>);
    const { verified_signature: intentEvidence, ...intentShown } = intentRest as Record<string, unknown>;
    const safeIntent = intent ? { ...intentShown, verifiedEvidence: maskProviderEvidence(intentEvidence as string | null), recipientMasked: maskDestination(intentRecipient as string | null, intent.network) } : null;
    const safeRefunds = (refunds ?? []).map(({ chain_signature, ...rest }) => ({ ...rest, chainSignatureDisplay: maskAttemptKey(chain_signature as string | null, intent?.network) }));
    const safeChain = (chain ?? []).map(({ recipient, ...rest }) => ({
      ...rest, recipientMasked: maskDestination(recipient, rest.network), recipientMatchesIntent: !!intent && recipient === intentRecipient,
    }));
    return {
      caseType, caseId, closed: r.closed === true, allowedActions: r.actions, refundableTransfers: r.refundable_transfers ?? [],
      facts: { observedOnChain: safeChain, providerEvidence: safeProviderEvents(providerEvidence) },
      systemDecisions: { intent: safeIntent, events: events ?? [], refunds: safeRefunds, request, priceSelections: safeSelections },
      paymentEvidence: {
        intentStatus: intent?.status ?? null, network: intent?.network ?? null, mint: intent?.mint ?? null, receivingWalletMasked: safeIntent?.recipientMasked ?? null,
        reference: intent?.reference ?? null, reviewReasons: [...new Set(safeChain.map((t) => t.classification).filter(Boolean))],
        transfers: safeChain.map((t) => ({ signature: t.signature, classification: t.classification, recipientMasked: t.recipientMasked, recipientMatchesIntent: t.recipientMatchesIntent })),
      },
      operatorActions: safeOperatorActions(operatorActions),
      unresolved: r.closed !== true,
    };
  }
  const { data: job } = await client.from("money_movement_jobs").select("id, obligation_type, payout_obligation_id, service_refund_id, rail, provider, network, asset, amount_base_units, status, automation_policy, attempt_count, max_attempts, failure_count, max_failures, claim_expires_at, next_retry_at, last_attempt_at, last_error_code, last_error_class, confirmed_at, created_at, updated_at").eq("id", caseId).maybeSingle();
  const { data: attempts } = await client.from("money_movement_attempts").select("attempt_number, state, provider, network, asset, amount_base_units, destination, external_id, failure_category, prepared_at, submitted_at, resolved_at, provider_reported_paid_at").eq("job_id", caseId).order("attempt_number");
  const { data: obligation } = job?.payout_obligation_id ? await client.from("payout_obligations").select("id, kind, status, currency, gross_amount, platform_fee_amount, net_amount, fee_policy, payout_rail, request_id, referral_reward_id, chain_signature, created_at, submitted_at, paid_at").eq("id", job.payout_obligation_id).maybeSingle() : { data: null };
  const { data: refund } = job?.service_refund_id ? await client.from("service_refunds").select("id, reason, status, amount, currency, payment_intent_id, source_signature, asset_amount_base_units, chain_signature, created_at, completed_at").eq("id", job.service_refund_id).maybeSingle() : { data: null };
  const { data: providerEvidence } = await client.from("provider_events").select(PROVIDER_EVENT_COLUMNS).eq("money_job_id", caseId).order("received_at");
  // The raw destination never leaves this function: every attempt row is rebuilt without it.
  // ...nor does the raw LIFE.HELP attempt key on provider networks (masked; chain signatures stay public evidence).
  const safeAttempts = (attempts ?? []).map(({ destination, external_id, ...rest }) => ({ ...rest, attemptKeyDisplay: maskAttemptKey(external_id, rest.network), destinationMasked: maskDestination(destination, rest.network) }));
  const { chain_signature: obligationSig, ...obligationShown } = (obligation ?? {}) as Record<string, unknown>;
  const safeObligation = obligation ? { ...obligationShown, chainSignatureDisplay: maskAttemptKey(obligationSig as string | null, job?.network) } : null;
  const { chain_signature: refundSig, ...refundShown } = (refund ?? {}) as Record<string, unknown>;
  const safeRefund = refund ? { ...refundShown, chainSignatureDisplay: maskAttemptKey(refundSig as string | null, job?.network) } : null;
  return {
    caseType, caseId, closed: r.closed === true, allowedActions: r.actions,
    facts: { providerEvidence: safeProviderEvents(providerEvidence), attemptsObservedExternally: safeAttempts.map((a) => ({ attempt: a.attempt_number, attemptKey: a.attemptKeyDisplay, state: a.state, destinationMasked: a.destinationMasked, amountBaseUnits: a.amount_base_units, providerReportedPaidAt: a.provider_reported_paid_at ?? null })) },
    systemDecisions: { job, attempts: safeAttempts, obligation: safeObligation, refund: safeRefund },
    payoutEvidence: payoutEvidence(job, safeAttempts, safeObligation ?? safeRefund ?? null),
    operatorActions: safeOperatorActions(operatorActions),
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
    // Provider rails move fiat minor units; only chain rails are USDC base units.
    case: `${caseType}:${caseId}`, action, amount: String(job?.network ?? "").startsWith("provider:") ? job?.amount_base_units ?? null : usdc(job?.amount_base_units),
    amountUnit: String(job?.network ?? "").startsWith("provider:") ? "MINOR_UNITS" : "USDC", token: job?.asset ?? "USDC", network: job?.network ?? null, provider: job?.provider ?? "configured rail",
    destinationSource: job?.obligation_type === "REFUND" ? "payer of the verified payment" : "the obligation's registered payout destination",
    effect: action === "RETRY_RECONCILIATION" ? "reconcile existing attempts only; never creates a new transfer" : "one more automatic attempt, after a reference search proves nothing landed",
  };
}

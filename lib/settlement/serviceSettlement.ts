import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformActor } from "@/lib/settlement/platformAuth";
import { agreedPriceAudit, loadCurrentAgreedPrice, type AgreedPrice } from "@/lib/pricing/requestPrice";

/**
 * Internal service settlement lifecycle:
 *
 *   COMPLETED → PAYMENT_PENDING → SETTLED → (conversation cleanup) → CLOSED
 *
 * No external payment provider is connected. Settlement here is an internal platform
 * confirmation only: no PSP transaction id is created or recorded, and audit metadata
 * states external_payment_verified=false.
 *
 * Every transition is a conditional single-row update (`.eq("status", from)`), so exactly one
 * caller wins. All SETTLED side effects are idempotent and are re-applied on duplicate calls,
 * which makes a retry after a partial failure converge instead of diverging.
 *
 * Retention boundary: cleanup deletes `messages` rows only. service_requests,
 * request_assignments, conversation metadata rows, referral_rewards and admin_audit_logs
 * are transaction/settlement/dispute/audit records and are never touched by cleanup.
 */

export const SETTLEMENT_METHOD = "INTERNAL_PLATFORM_CONFIRMATION";
const SETTLED_STATES = ["SETTLED", "CLOSED"];

export type LifecycleResult =
  | { ok: true; requestId: string; status: string; idempotent: boolean; [key: string]: unknown }
  | { ok: false; httpStatus: number; code: string; currentStatus?: string };

type RequestRow = { id: string; customer_id: string; status: string; selection_mode: string };

async function loadRequest(client: SupabaseClient, requestId: string): Promise<RequestRow | null> {
  const { data, error } = await client.from("service_requests").select("id, customer_id, status, selection_mode").eq("id", requestId).maybeSingle();
  return error || !data ? null : (data as RequestRow);
}

async function audit(client: SupabaseClient, action: string, requestId: string, metadata: Record<string, unknown>) {
  await client.from("admin_audit_logs").insert({ action, entity_type: "service_request", entity_id: requestId, actor_id: null, metadata });
}

async function notifyCustomer(client: SupabaseClient, customerId: string, requestId: string, status: string) {
  await client.from("app_notifications").insert({ recipient_type: "CUSTOMER", recipient_id: customerId, type: "SERVICE_STATUS_CHANGED", title: "Service status changed", body: `Service status is now ${status}.`, payload: { request_id: requestId, status } });
}

/** Conditional status move. Returns true only for the single caller that performed it. */
async function transition(client: SupabaseClient, requestId: string, from: string, to: string): Promise<boolean> {
  const { data } = await client.from("service_requests").update({ status: to, updated_at: new Date().toISOString() }).eq("id", requestId).eq("status", from).select("id").maybeSingle();
  return !!data;
}

/** Agreed price of a customer-selected request (current accepted selection); null for AUTO_MATCH. */
async function agreedPriceFor(client: SupabaseClient, row: RequestRow): Promise<AgreedPrice | null> {
  return row.selection_mode === "CUSTOMER_SELECTED" ? loadCurrentAgreedPrice(client, row.id) : null;
}

/** Operational (non-financial) admin transitions preserved from the original SYS route. */
export async function applyOperationalTransition(client: SupabaseClient, requestId: string, target: "IN_PROGRESS" | "COMPLETED"): Promise<LifecycleResult> {
  const from = target === "IN_PROGRESS" ? "ACCEPTED" : "IN_PROGRESS";
  const row = await loadRequest(client, requestId);
  if (!row) return { ok: false, httpStatus: 404, code: "REQUEST_NOT_FOUND" };
  if (target === "COMPLETED") {
    // Same atomic path as Helper COMPLETE: the request and its accepted assignment move together,
    // so an admin override can never leave the helper occupied.
    const { data: assignment } = await client.from("request_assignments").select("id, helper_id").eq("request_id", requestId).in("status", ["ACCEPTED", "COMPLETED"]).order("assigned_at", { ascending: false }).limit(1).maybeSingle();
    if (!assignment) return { ok: false, httpStatus: 409, code: "NO_ACCEPTED_ASSIGNMENT", currentStatus: row.status };
    const { data, error } = await client.rpc("complete_assignment_service", { p_assignment_id: assignment.id, p_helper_id: assignment.helper_id });
    if (error || !data?.success) return { ok: false, httpStatus: 409, code: data?.code || "INVALID_TRANSITION", currentStatus: data?.request_status ?? row.status };
    if (!data.idempotent) await notifyCustomer(client, row.customer_id, requestId, "COMPLETED");
    return { ok: true, requestId, status: data.request_status, idempotent: data.idempotent === true };
  }
  if (row.status === target) return { ok: true, requestId, status: target, idempotent: true };
  if (row.status !== from || !(await transition(client, requestId, from, target))) return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION", currentStatus: row.status };
  await notifyCustomer(client, row.customer_id, requestId, target);
  return { ok: true, requestId, status: target, idempotent: false };
}

export async function markPaymentPending(client: SupabaseClient, requestId: string, actor: PlatformActor): Promise<LifecycleResult> {
  const row = await loadRequest(client, requestId);
  if (!row) return { ok: false, httpStatus: 404, code: "REQUEST_NOT_FOUND" };
  if (row.status === "PAYMENT_PENDING") return { ok: true, requestId, status: row.status, idempotent: true };
  if (row.status !== "COMPLETED") return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION", currentStatus: row.status };
  // A customer-selected request is paid at its CURRENT accepted price selection; without one it
  // cannot enter payment (a declined Helper's ended selection is history, never the price).
  const agreedPrice = await agreedPriceFor(client, row);
  if (row.selection_mode === "CUSTOMER_SELECTED" && !agreedPrice) return { ok: false, httpStatus: 409, code: "PRICE_AGREEMENT_MISSING", currentStatus: row.status };
  if (!(await transition(client, requestId, "COMPLETED", "PAYMENT_PENDING"))) {
    const latest = await loadRequest(client, requestId);
    if (latest?.status === "PAYMENT_PENDING") return { ok: true, requestId, status: latest.status, idempotent: true };
    return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION", currentStatus: latest?.status };
  }
  await audit(client, "SERVICE_PAYMENT_PENDING", requestId, { actor_kind: actor, external_payment_provider: null, external_payment_verified: false, agreed_price: agreedPriceAudit(agreedPrice) });
  await notifyCustomer(client, row.customer_id, requestId, "PAYMENT_PENDING");
  return { ok: true, requestId, status: "PAYMENT_PENDING", idempotent: false, agreedPrice };
}

/**
 * Marks every still-open conversation of the request for content deletion.
 * Conditional on the current status, so each conversation is scheduled exactly once.
 */
async function scheduleConversationCleanup(client: SupabaseClient, requestId: string): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await client.from("conversations").update({ status: "DELETION_SCHEDULED", deletion_scheduled_at: now, closed_at: now }).eq("request_id", requestId).in("status", ["ACTIVE", "CLOSED"]).select("id");
  return data?.length ?? 0;
}

/**
 * One-level referral reward at the settlement boundary only. The referred customer's direct
 * referrer may be rewarded; indirect referrers never are. Duplicate settlement cannot create a
 * second reward because referral_rewards.qualifying_request_id is unique.
 */
async function qualifyReferralReward(client: SupabaseClient, requestId: string, customerId: string): Promise<"QUALIFIED" | "ALREADY_QUALIFIED" | "NO_REFERRAL"> {
  const { data: referred } = await client.from("referral_identities").select("id, subject_key").eq("subject_type", "CUSTOMER").eq("subject_key", customerId).maybeSingle();
  if (!referred) return "NO_REFERRAL";
  const { data: attribution } = await client.from("referral_attributions").select("id, referrer_identity_id, referrer_identity:referrer_identity_id(id, subject_key)").eq("referred_identity_id", referred.id).eq("status", "ACTIVE").maybeSingle();
  const referrer = ((Array.isArray(attribution?.referrer_identity) ? attribution?.referrer_identity[0] : attribution?.referrer_identity) || null) as { id: string; subject_key: string | null } | null;
  if (!attribution || !referrer) return "NO_REFERRAL";
  const { data: existing } = await client.from("referral_rewards").select("id").eq("qualifying_request_id", requestId).maybeSingle();
  if (existing) return "ALREADY_QUALIFIED";
  const { count } = await client.from("service_requests").select("id", { count: "exact", head: true }).eq("customer_id", referrer.subject_key || "").in("status", SETTLED_STATES);
  const settledCount = count || 0;
  const tier = settledCount >= 5 ? "GLH" : settledCount >= 1 ? "CLH" : "WLH";
  const amount = tier === "GLH" ? 10000 : tier === "CLH" ? 5000 : 1000;
  const { error } = await client.from("referral_rewards").insert({ attribution_id: attribution.id, qualifying_request_id: requestId, referrer_identity_id: referrer.id, referred_identity_id: referred.id, tier, reward_amount_krw: amount, first_service_discount_krw: amount, state: "QUALIFIED", settled_at: new Date().toISOString() });
  // 23505: a concurrent settlement retry already inserted the reward for this request.
  if (error) return error.code === "23505" ? "ALREADY_QUALIFIED" : "NO_REFERRAL";
  await client.from("app_notifications").insert({ recipient_type: "CUSTOMER", recipient_id: referrer.subject_key || "", type: "REFERRAL_REWARD_CONFIRMED", title: "Referral reward qualified", body: `${tier} referral reward qualified.`, payload: { request_id: requestId, tier, reward_amount_krw: amount } });
  return "QUALIFIED";
}

export async function settleServiceRequest(client: SupabaseClient, requestId: string, actor: PlatformActor): Promise<LifecycleResult> {
  const row = await loadRequest(client, requestId);
  if (!row) return { ok: false, httpStatus: 404, code: "REQUEST_NOT_FOUND" };
  let won = false;
  let status = row.status;
  if (row.status === "PAYMENT_PENDING") {
    won = await transition(client, requestId, "PAYMENT_PENDING", "SETTLED");
    if (won) status = "SETTLED";
    else status = (await loadRequest(client, requestId))?.status ?? row.status;
  }
  if (!SETTLED_STATES.includes(status)) return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION", currentStatus: status };
  const agreedPrice = await agreedPriceFor(client, row);

  if (won) {
    await audit(client, "SERVICE_SETTLED", requestId, { actor_kind: actor, settlement_method: SETTLEMENT_METHOD, external_payment_provider: null, external_payment_transaction_id: null, external_payment_verified: false, agreed_price: agreedPriceAudit(agreedPrice) });
    await notifyCustomer(client, row.customer_id, requestId, "SETTLED");
  } else {
    // Reconcile a settlement whose side effects may have been interrupted.
    const { data: existingAudit } = await client.from("admin_audit_logs").select("id").eq("action", "SERVICE_SETTLED").eq("entity_id", requestId).limit(1);
    if (!existingAudit?.length) await audit(client, "SERVICE_SETTLED", requestId, { actor_kind: actor, settlement_method: SETTLEMENT_METHOD, external_payment_provider: null, external_payment_transaction_id: null, external_payment_verified: false, agreed_price: agreedPriceAudit(agreedPrice), reconciled: true });
  }
  const cleanupScheduled = await scheduleConversationCleanup(client, requestId);
  const reward = await qualifyReferralReward(client, requestId, row.customer_id);
  return { ok: true, requestId, status, idempotent: !won, cleanupScheduled, reward, settlementMethod: SETTLEMENT_METHOD, externalPaymentVerified: false, agreedPrice };
}

/** SETTLED → CLOSED, allowed only once no conversation of the request still holds content. */
export async function closeServiceRequest(client: SupabaseClient, requestId: string, actor: PlatformActor | "CLEANUP_RUNNER"): Promise<LifecycleResult> {
  const row = await loadRequest(client, requestId);
  if (!row) return { ok: false, httpStatus: 404, code: "REQUEST_NOT_FOUND" };
  if (row.status === "CLOSED") return { ok: true, requestId, status: "CLOSED", idempotent: true };
  if (row.status !== "SETTLED") return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION", currentStatus: row.status };
  const { count } = await client.from("conversations").select("id", { count: "exact", head: true }).eq("request_id", requestId).neq("status", "DELETED");
  if ((count ?? 1) > 0) return { ok: false, httpStatus: 409, code: "CLEANUP_PENDING", currentStatus: row.status };
  if (!(await transition(client, requestId, "SETTLED", "CLOSED"))) {
    const latest = await loadRequest(client, requestId);
    if (latest?.status === "CLOSED") return { ok: true, requestId, status: "CLOSED", idempotent: true };
    return { ok: false, httpStatus: 409, code: "INVALID_TRANSITION", currentStatus: latest?.status };
  }
  await audit(client, "SERVICE_CLOSED", requestId, { actor_kind: actor });
  await notifyCustomer(client, row.customer_id, requestId, "CLOSED");
  return { ok: true, requestId, status: "CLOSED", idempotent: false };
}

export type CleanupReport = {
  /** Conversations examined (due DELETION_SCHEDULED + already-DELETED ones of unclosed SETTLED requests). */
  scanned: number;
  /** Scanned conversations whose request is financially settled, i.e. allowed to lose content. */
  eligible: number;
  /** Conversations moved to DELETED by this run. */
  cleaned: number;
  /** Eligible conversations another run had already moved to DELETED. */
  already_clean: number;
  /** Eligible conversations whose cleanup errored; left as-is for the next retry. */
  failed: number;
  /** Conversations of SETTLED requests whose missing cleanup schedule was repaired by this run. */
  reconciled: number;
  /** SETTLED requests that had never had cleanup scheduled (SETTLED_CLEANUP_RECONCILED). */
  reconciledRequestIds: string[];
  processed: number;
  messagesDeleted: number;
  closedRequests: number;
  skipped: number;
};

async function deleteMessages(client: SupabaseClient, conversationId: string): Promise<number> {
  const { data, error } = await client.from("messages").delete().eq("conversation_id", conversationId).select("id");
  if (error) throw new Error(`messages delete failed: ${error.code || error.message}`);
  return data?.length ?? 0;
}

/**
 * Executes due conversation cleanup: deletes message content of DELETION_SCHEDULED conversations
 * whose request is financially settled, marks the conversation DELETED, then closes the request.
 * Conversation metadata rows are retained (no content) so audit/dispute references stay valid.
 *
 * Also the retry path for an interrupted cleanup: a SETTLED request whose conversations are all
 * DELETED but which never reached CLOSED gets any stray content removed and is closed.
 * Before that, it reconciles a settlement that crashed between SETTLED and cleanup scheduling:
 * a SETTLED request whose conversation is still ACTIVE/CLOSED gets the same scheduling call
 * settleServiceRequest makes, then flows through the normal cleanup below. Eligibility comes from
 * the request status only; rewards and settlement records are not touched.
 *
 * Each conversation is isolated: one failure is counted and left for the next run.
 * Only SETTLED/CLOSED requests are ever touched; COMPLETED and PAYMENT_PENDING never are.
 */
export async function runConversationCleanup(client: SupabaseClient, options: { requestId?: string; limit?: number } = {}): Promise<CleanupReport> {
  const report: CleanupReport = { scanned: 0, eligible: 0, cleaned: 0, already_clean: 0, failed: 0, reconciled: 0, reconciledRequestIds: [], processed: 0, messagesDeleted: 0, closedRequests: 0, skipped: 0 };
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  // Missing cleanup schedule: settlement reached SETTLED but crashed before scheduling. Rooted in
  // the request lifecycle (status = SETTLED), never in conversation state alone.
  let unscheduled = client.from("service_requests").select("id").eq("status", "SETTLED").order("updated_at", { ascending: true }).limit(limit);
  if (options.requestId) unscheduled = unscheduled.eq("id", options.requestId);
  const { data: settledForSchedule } = await unscheduled;
  for (const requestRow of settledForSchedule ?? []) {
    try {
      const { data: open } = await client.from("conversations").select("id").eq("request_id", requestRow.id).in("status", ["ACTIVE", "CLOSED"]);
      if (!open?.length) continue;
      // Re-check right before the write: only a still-SETTLED request may have content scheduled.
      if ((await loadRequest(client, requestRow.id))?.status !== "SETTLED") continue;
      const scheduled = await scheduleConversationCleanup(client, requestRow.id);
      if (!scheduled) continue;
      report.reconciled += scheduled;
      report.reconciledRequestIds.push(requestRow.id);
      await audit(client, "SETTLED_CLEANUP_RECONCILED", requestRow.id, { conversations_scheduled: scheduled, reason: "SETTLED_WITHOUT_CLEANUP_SCHEDULE" });
    } catch {
      report.failed += 1;
    }
  }

  let query = client.from("conversations").select("id, request_id").eq("status", "DELETION_SCHEDULED").lte("deletion_scheduled_at", new Date().toISOString()).order("deletion_scheduled_at", { ascending: true }).limit(limit);
  if (options.requestId) query = query.eq("request_id", options.requestId);
  const { data: due } = await query;
  for (const conversation of due ?? []) {
    report.scanned += 1;
    try {
      const requestRow = conversation.request_id ? await loadRequest(client, conversation.request_id) : null;
      // Never delete conversation content for a request that is not financially settled.
      if (!requestRow || !SETTLED_STATES.includes(requestRow.status)) { report.skipped += 1; continue; }
      report.eligible += 1;
      // A failed delete throws before the status change, so the conversation stays retryable.
      const deleted = await deleteMessages(client, conversation.id);
      const { data: marked, error: markError } = await client.from("conversations").update({ status: "DELETED" }).eq("id", conversation.id).eq("status", "DELETION_SCHEDULED").select("id").maybeSingle();
      if (markError) throw new Error(`conversation mark failed: ${markError.code || markError.message}`);
      // Second pass removes any message that raced in between the delete and the status change.
      const count = deleted + (await deleteMessages(client, conversation.id));
      report.messagesDeleted += count;
      if (!marked) { report.already_clean += 1; continue; }
      report.cleaned += 1;
      report.processed += 1;
      await audit(client, "CONVERSATION_CONTENT_DELETED", requestRow.id, { conversation_id: conversation.id, messages_deleted: count, retained: ["service_requests", "request_assignments", "conversations(metadata)", "referral_rewards", "admin_audit_logs"] });
      const closed = await closeServiceRequest(client, requestRow.id, "CLEANUP_RUNNER");
      if (closed.ok && !closed.idempotent) report.closedRequests += 1;
    } catch {
      report.failed += 1;
    }
  }

  // Interrupted close: content cleanup finished (or crashed after marking DELETED) but the request
  // stayed SETTLED. Requests that still have non-DELETED conversations are left to the pass above.
  let settled = client.from("service_requests").select("id").eq("status", "SETTLED").order("updated_at", { ascending: true }).limit(limit);
  if (options.requestId) settled = settled.eq("id", options.requestId);
  const { data: settledRows } = await settled;
  for (const requestRow of settledRows ?? []) {
    const { data: conversations } = await client.from("conversations").select("id, status").eq("request_id", requestRow.id);
    if ((conversations ?? []).some((row) => row.status !== "DELETED")) continue;
    let requestFailed = false;
    for (const conversation of conversations ?? []) {
      report.scanned += 1;
      report.eligible += 1;
      try {
        report.messagesDeleted += await deleteMessages(client, conversation.id);
        report.already_clean += 1;
      } catch {
        report.failed += 1;
        requestFailed = true;
      }
    }
    if (requestFailed) continue;
    const closed = await closeServiceRequest(client, requestRow.id, "CLEANUP_RUNNER");
    if (closed.ok && !closed.idempotent) report.closedRequests += 1;
  }
  return report;
}

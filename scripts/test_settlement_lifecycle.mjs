// Deterministic settlement/cleanup lifecycle test.
// Runs the real lib/settlement/serviceSettlement.ts against an in-memory Supabase stand-in.
// Usage: node --experimental-strip-types scripts/test_settlement_lifecycle.mjs
import fs from "node:fs";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const lib = await import(new URL("../lib/settlement/serviceSettlement.ts", import.meta.url).href);

// ---------- in-memory Supabase stand-in ----------
function createDb() {
  const tables = {
    service_requests: [], conversations: [], messages: [], referral_identities: [], referral_attributions: [],
    referral_rewards: [], admin_audit_logs: [], app_notifications: [], request_assignments: [],
  };
  const unique = { referral_rewards: ["qualifying_request_id"] };
  // Conversation ids whose messages delete returns an error (interrupted-cleanup simulation).
  const failMessageDelete = new Set();
  let seq = 0;
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.eqs = {}; this.op = "select"; this.limitN = Infinity; this.single = false; this.returning = false; }
    select(cols, opts = {}) { if (this.op === "select") { this.cols = cols; this.count = opts.count; this.head = opts.head; } else this.returning = true; return this; }
    update(values) { this.op = "update"; this.values = values; return this; }
    insert(values) { this.op = "insert"; this.values = values; return this; }
    delete() { this.op = "delete"; return this; }
    eq(col, value) { this.eqs[col] = value; this.filters.push((row) => row[col] === value); return this; }
    neq(col, value) { this.filters.push((row) => row[col] !== value); return this; }
    in(col, values) { this.filters.push((row) => values.includes(row[col])); return this; }
    lte(col, value) { this.filters.push((row) => row[col] != null && row[col] <= value); return this; }
    order() { return this; }
    limit(n) { this.limitN = n; return this; }
    maybeSingle() { this.single = true; return this; }
    then(resolve, reject) { try { resolve(this.run()); } catch (error) { reject(error); } }
    rows() { return tables[this.table].filter((row) => this.filters.every((f) => f(row))); }
    shape(rows) {
      const out = rows.slice(0, this.limitN).map((row) => {
        const copy = { ...row };
        if (this.table === "referral_attributions" && this.cols?.includes("referrer_identity:")) copy.referrer_identity = tables.referral_identities.find((r) => r.id === row.referrer_identity_id) || null;
        return copy;
      });
      return this.single ? (out[0] ?? null) : out;
    }
    run() {
      if (this.op === "insert") {
        for (const col of unique[this.table] || []) if (tables[this.table].some((row) => row[col] === this.values[col])) return { data: null, error: { code: "23505" } };
        tables[this.table].push({ id: this.values.id ?? `${this.table}-${++seq}`, created_at: new Date().toISOString(), ...this.values });
        return { data: null, error: null };
      }
      if (this.op === "update") {
        const hit = this.rows().slice(0, this.single ? 1 : Infinity);
        hit.forEach((row) => Object.assign(row, this.values));
        return { data: this.returning ? this.shape(hit) : null, error: null };
      }
      if (this.op === "delete") {
        if (this.table === "messages" && failMessageDelete.has(this.eqs.conversation_id)) return { data: null, error: { code: "XX000", message: "injected failure" } };
        const hit = this.rows();
        tables[this.table] = tables[this.table].filter((row) => !hit.includes(row));
        return { data: this.returning ? this.shape(hit) : null, error: null };
      }
      const hit = this.rows();
      return { data: this.head ? null : this.shape(hit), error: null, count: this.count ? hit.length : undefined };
    }
  }
  return { tables, failMessageDelete, client: { from: (table) => new Query(table) } };
}

// ---------- fixtures ----------
const past = new Date(Date.now() - 1000).toISOString();
function seed({ status = "COMPLETED", withReferral = true, messages = 2 } = {}) {
  const db = createDb();
  const t = db.tables;
  t.service_requests.push({ id: "req-B1", customer_id: "CUST-B", status });
  t.service_requests.push({ id: "req-C1", customer_id: "CUST-C", status: "PAYMENT_PENDING" });
  t.conversations.push({ id: "conv-B1", request_id: "req-B1", status: "ACTIVE", deletion_scheduled_at: null });
  t.conversations.push({ id: "conv-C1", request_id: "req-C1", status: "ACTIVE", deletion_scheduled_at: null });
  t.conversations.push({ id: "conv-other", request_id: "req-other", status: "DELETION_SCHEDULED", deletion_scheduled_at: past });
  t.service_requests.push({ id: "req-other", customer_id: "CUST-X", status: "COMPLETED" });
  for (let i = 0; i < messages; i += 1) t.messages.push({ id: `msg-B${i}`, conversation_id: "conv-B1", original_text: `secret ${i}` });
  t.messages.push({ id: "msg-C0", conversation_id: "conv-C1", original_text: "c secret" });
  t.messages.push({ id: "msg-other", conversation_id: "conv-other", original_text: "unsettled content" });
  t.request_assignments.push({ id: "asg-B1", request_id: "req-B1", status: "ACCEPTED" });
  if (withReferral) {
    // A → B → C chain.
    t.referral_identities.push({ id: "id-A", subject_type: "CUSTOMER", subject_key: "CUST-A" });
    t.referral_identities.push({ id: "id-B", subject_type: "CUSTOMER", subject_key: "CUST-B" });
    t.referral_identities.push({ id: "id-C", subject_type: "CUSTOMER", subject_key: "CUST-C" });
    t.referral_attributions.push({ id: "att-AB", referred_identity_id: "id-B", referrer_identity_id: "id-A", status: "ACTIVE" });
    t.referral_attributions.push({ id: "att-BC", referred_identity_id: "id-C", referrer_identity_id: "id-B", status: "ACTIVE" });
  }
  return db;
}

// ---------- assertions ----------
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

{
  const { tables: t, client } = seed();
  const early = await lib.settleServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("COMPLETED cannot jump to SETTLED", !early.ok && early.code === "INVALID_TRANSITION" && t.service_requests[0].status === "COMPLETED");
  check("COMPLETED alone creates no reward", t.referral_rewards.length === 0);
  check("COMPLETED alone schedules no cleanup", t.conversations[0].status === "ACTIVE" && t.messages.some((m) => m.conversation_id === "conv-B1"));
  const earlyClose = await lib.closeServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("COMPLETED cannot jump to CLOSED", !earlyClose.ok && earlyClose.code === "INVALID_TRANSITION");

  const pending = await lib.markPaymentPending(client, "req-B1", "PLATFORM_TOKEN");
  check("COMPLETED → PAYMENT_PENDING", pending.ok && !pending.idempotent && t.service_requests[0].status === "PAYMENT_PENDING");
  const pendingAgain = await lib.markPaymentPending(client, "req-B1", "PLATFORM_TOKEN");
  check("Duplicate PAYMENT_PENDING idempotent", pendingAgain.ok && pendingAgain.idempotent);
  const pendingAudit = t.admin_audit_logs.find((row) => row.action === "SERVICE_PAYMENT_PENDING");
  check("PAYMENT_PENDING records no external payment", pendingAudit?.metadata.external_payment_verified === false && pendingAudit?.metadata.external_payment_provider === null);
  check("PAYMENT_PENDING creates no reward", t.referral_rewards.length === 0);

  const settled = await lib.settleServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("PAYMENT_PENDING → SETTLED", settled.ok && !settled.idempotent && settled.status === "SETTLED" && t.service_requests[0].status === "SETTLED");
  check("SETTLED schedules cleanup exactly once", settled.cleanupScheduled === 1 && t.conversations[0].status === "DELETION_SCHEDULED");
  check("Scheduling does not touch other requests", t.conversations[1].status === "ACTIVE");
  const settleAudit = t.admin_audit_logs.filter((row) => row.action === "SERVICE_SETTLED");
  check("Settlement audit is truthful (no PSP id, not verified)", settleAudit.length === 1 && settleAudit[0].metadata.external_payment_transaction_id === null && settleAudit[0].metadata.external_payment_verified === false && settleAudit[0].metadata.settlement_method === "INTERNAL_PLATFORM_CONFIRMATION");
  check("Reward qualified at settlement boundary", settled.reward === "QUALIFIED" && t.referral_rewards.length === 1 && t.referral_rewards[0].referrer_identity_id === "id-A" && t.referral_rewards[0].state === "QUALIFIED");

  const again = await lib.settleServiceRequest(client, "req-B1", "SYS_SESSION");
  check("Duplicate SETTLED idempotent", again.ok && again.idempotent && again.cleanupScheduled === 0);
  check("Duplicate SETTLED creates no second reward", t.referral_rewards.length === 1 && again.reward === "ALREADY_QUALIFIED");
  check("Duplicate SETTLED creates no second audit", t.admin_audit_logs.filter((row) => row.action === "SERVICE_SETTLED").length === 1);

  const closeBeforeCleanup = await lib.closeServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("CLOSED blocked until cleanup completes", !closeBeforeCleanup.ok && closeBeforeCleanup.code === "CLEANUP_PENDING");

  const report = await lib.runConversationCleanup(client, {});
  check("Cleanup deletes settled conversation content", report.processed === 1 && report.messagesDeleted === 2 && !t.messages.some((m) => m.conversation_id === "conv-B1"));
  check("Cleanup marks conversation DELETED, keeps metadata row", t.conversations[0].status === "DELETED" && t.conversations.length === 3);
  check("Cleanup never deletes unsettled content", t.messages.some((m) => m.id === "msg-other") && t.conversations[2].status === "DELETION_SCHEDULED" && report.skipped === 1);
  check("Cleanup leaves other active conversations", t.messages.some((m) => m.id === "msg-C0"));
  check("SETTLED → CLOSED after cleanup", report.closedRequests === 1 && t.service_requests[0].status === "CLOSED");
  check("Legal/audit records preserved", t.service_requests.some((r) => r.id === "req-B1") && t.request_assignments.length === 1 && t.referral_rewards.length === 1 && ["SERVICE_PAYMENT_PENDING", "SERVICE_SETTLED", "CONVERSATION_CONTENT_DELETED", "SERVICE_CLOSED"].every((action) => t.admin_audit_logs.some((row) => row.action === action)));
  check("Cleanup audit holds no message content", !JSON.stringify(t.admin_audit_logs).includes("secret"));

  const rerun = await lib.runConversationCleanup(client, {});
  check("Cleanup rerun is a no-op", rerun.processed === 0 && rerun.closedRequests === 0);
  const closeAgain = await lib.closeServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("Duplicate CLOSED idempotent", closeAgain.ok && closeAgain.idempotent);
  const settleAfterClose = await lib.settleServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("SETTLED after CLOSED idempotent, no new reward", settleAfterClose.ok && settleAfterClose.idempotent && t.referral_rewards.length === 1);

  // One-level referral: C settles → B (direct referrer) may be rewarded, A must not be.
  const cSettle = await lib.settleServiceRequest(client, "req-C1", "PLATFORM_TOKEN");
  const cReward = t.referral_rewards.find((row) => row.qualifying_request_id === "req-C1");
  check("One-level referral: C rewards B only", cSettle.ok && cReward?.referrer_identity_id === "id-B" && !t.referral_rewards.some((row) => row.qualifying_request_id === "req-C1" && row.referrer_identity_id === "id-A"));
  check("Referrer tier counts CLOSED as settled", cReward?.tier === "CLH");
}

{
  // Interrupted settlement: status moved but side effects missing → retry reconciles them.
  const { tables: t, client } = seed({ status: "SETTLED" });
  const retry = await lib.settleServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("Retry reconciles interrupted settlement", retry.ok && retry.idempotent && retry.cleanupScheduled === 1 && t.referral_rewards.length === 1 && t.admin_audit_logs.filter((row) => row.action === "SERVICE_SETTLED").length === 1);
}

{
  // Request without any conversation closes directly.
  const { tables: t, client } = seed({ withReferral: false });
  t.conversations = t.conversations.filter((row) => row.request_id !== "req-B1");
  t.service_requests[0].status = "SETTLED";
  const closed = await lib.closeServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("SETTLED without conversation closes", closed.ok && t.service_requests[0].status === "CLOSED");
  check("No referral → no reward", t.referral_rewards.length === 0);
}

{
  // Admin COMPLETED override must use the same atomic RPC as Helper COMPLETE (helper release).
  const { tables: t, client } = seed({ status: "IN_PROGRESS" });
  t.request_assignments[0].helper_id = "helper-H";
  const calls = [];
  client.rpc = async (name, args) => {
    calls.push([name, args]);
    t.service_requests[0].status = "COMPLETED";
    t.request_assignments[0].status = "COMPLETED";
    return { data: { success: true, idempotent: false, request_status: "COMPLETED", assignment_status: "COMPLETED" }, error: null };
  };
  const completed = await lib.applyOperationalTransition(client, "req-B1", "COMPLETED");
  check("Admin COMPLETED goes through complete_assignment_service", completed.ok && calls.length === 1 && calls[0][0] === "complete_assignment_service" && calls[0][1].p_assignment_id === "asg-B1" && calls[0][1].p_helper_id === "helper-H");
  check("Service COMPLETED qualifies no reward and schedules no cleanup", t.referral_rewards.length === 0 && t.conversations[0].status === "ACTIVE" && t.messages.some((m) => m.conversation_id === "conv-B1"));
  const pending = await lib.markPaymentPending(client, "req-B1", "PLATFORM_TOKEN");
  const settled = await lib.settleServiceRequest(client, "req-B1", "PLATFORM_TOKEN");
  check("Settlement still works after helper release", pending.ok && settled.ok && t.referral_rewards.length === 1 && t.conversations[0].status === "DELETION_SCHEDULED" && t.request_assignments[0].status === "COMPLETED");
}

{
  const { client } = seed();
  const missing = await lib.settleServiceRequest(client, "req-missing", "PLATFORM_TOKEN");
  check("Unknown request rejected", !missing.ok && missing.httpStatus === 404);
}


// ---------- scheduled cleanup retry ----------
function seedSettled(db, n, { conversationStatus = "DELETION_SCHEDULED", status = "SETTLED" } = {}) {
  const t = db.tables;
  t.service_requests.push({ id: `req-R${n}`, customer_id: `CUST-R${n}`, status });
  t.conversations.push({ id: `conv-R${n}`, request_id: `req-R${n}`, status: conversationStatus, deletion_scheduled_at: conversationStatus === "ACTIVE" ? null : past });
  t.messages.push({ id: `msg-R${n}a`, conversation_id: `conv-R${n}`, original_text: `retry secret ${n}` }, { id: `msg-R${n}b`, conversation_id: `conv-R${n}`, original_text: `retry secret ${n}` });
  t.request_assignments.push({ id: `asg-R${n}`, request_id: `req-R${n}`, status: "COMPLETED" });
  t.referral_rewards.push({ id: `rw-R${n}`, qualifying_request_id: `req-R${n}`, state: "QUALIFIED" });
  t.admin_audit_logs.push({ id: `au-R${n}`, action: "SERVICE_SETTLED", entity_id: `req-R${n}`, metadata: { external_payment_verified: false } });
}

{
  // Interrupted post-SETTLED cleanup recovered by the retry runner; second run is a no-op.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1);
  const first = await lib.runConversationCleanup(db.client, {});
  check("Retry: interrupted SETTLED cleanup recovered", first.scanned === 1 && first.eligible === 1 && first.cleaned === 1 && first.failed === 0 && first.messagesDeleted === 2 && !t.messages.length && t.conversations[0].status === "DELETED");
  check("Retry: request closes after recovered cleanup", first.closedRequests === 1 && t.service_requests[0].status === "CLOSED");
  check("Retry: assignment/reward/audit preserved", t.request_assignments.length === 1 && t.referral_rewards.length === 1 && t.admin_audit_logs.some((row) => row.action === "SERVICE_SETTLED") && t.conversations.length === 1);
  const auditsBefore = t.admin_audit_logs.length;
  const second = await lib.runConversationCleanup(db.client, {});
  check("Retry: second run idempotent", second.scanned === 0 && second.cleaned === 0 && second.closedRequests === 0 && second.failed === 0 && t.admin_audit_logs.length === auditsBefore && t.referral_rewards.length === 1 && t.service_requests[0].status === "CLOSED");
}

{
  // One failing conversation does not corrupt or block the others, and is retried next run.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1);
  seedSettled(db, 2);
  db.failMessageDelete.add("conv-R1");
  const run = await lib.runConversationCleanup(db.client, {});
  const conv1 = t.conversations.find((row) => row.id === "conv-R1");
  check("Retry: failure counted, others cleaned", run.scanned === 2 && run.eligible === 2 && run.failed === 1 && run.cleaned === 1 && t.service_requests.find((row) => row.id === "req-R2").status === "CLOSED");
  check("Retry: failed conversation left retryable, content intact", conv1.status === "DELETION_SCHEDULED" && t.messages.filter((m) => m.conversation_id === "conv-R1").length === 2 && t.service_requests.find((row) => row.id === "req-R1").status === "SETTLED");
  db.failMessageDelete.clear();
  const retry = await lib.runConversationCleanup(db.client, {});
  check("Retry: failed conversation recovered next run", retry.cleaned === 1 && retry.failed === 0 && conv1.status === "DELETED" && t.service_requests.find((row) => row.id === "req-R1").status === "CLOSED" && !t.messages.length);
}

{
  // Crash after marking DELETED but before CLOSED: retry sweeps stray content and closes.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1, { conversationStatus: "DELETED" });
  const run = await lib.runConversationCleanup(db.client, {});
  check("Retry: interrupted close recovered", run.already_clean === 1 && run.closedRequests === 1 && run.messagesDeleted === 2 && t.service_requests[0].status === "CLOSED" && t.conversations[0].status === "DELETED");
}

{
  // Only SETTLED is a cleanup boundary: COMPLETED and PAYMENT_PENDING content is never touched.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1, { status: "PAYMENT_PENDING" });
  seedSettled(db, 2, { status: "COMPLETED" });
  seedSettled(db, 3, { status: "COMPLETED", conversationStatus: "ACTIVE" });
  const run = await lib.runConversationCleanup(db.client, {});
  check("Retry: PAYMENT_PENDING/COMPLETED never cleaned", run.eligible === 0 && run.cleaned === 0 && run.skipped === 2 && t.messages.length === 6 && t.conversations.every((row) => row.status !== "DELETED") && t.service_requests.every((row) => !["CLOSED", "SETTLED"].includes(row.status)));
}

// ---------- SETTLED without cleanup schedule (reconciliation) ----------
{
  // Settlement succeeded (reward + audit written) but crashed before scheduling cleanup.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1, { conversationStatus: "ACTIVE" });
  const notificationsBefore = t.app_notifications.length;
  const run = await lib.runConversationCleanup(db.client, {});
  check("Reconcile: missing cleanup schedule detected", run.reconciled === 1 && run.reconciledRequestIds.join() === "req-R1");
  check("Reconcile: SETTLED_CLEANUP_RECONCILED audit, no content", t.admin_audit_logs.filter((row) => row.action === "SETTLED_CLEANUP_RECONCILED" && row.entity_id === "req-R1").length === 1 && !JSON.stringify(t.admin_audit_logs).includes("retry secret"));
  check("Reconcile: existing cleanup path cleans ACTIVE → DELETED", run.cleaned === 1 && run.failed === 0 && t.conversations[0].status === "DELETED" && !t.messages.length && t.conversations.length === 1);
  check("Reconcile: request SETTLED → CLOSED", run.closedRequests === 1 && t.service_requests[0].status === "CLOSED");
  check("Reconcile: reward/assignment/settlement audit unchanged", t.referral_rewards.length === 1 && t.request_assignments.length === 1 && t.request_assignments[0].status === "COMPLETED" && t.admin_audit_logs.filter((row) => row.action === "SERVICE_SETTLED").length === 1 && t.admin_audit_logs.find((row) => row.action === "SERVICE_SETTLED").metadata.external_payment_verified === false && !t.app_notifications.slice(notificationsBefore).some((row) => row.type === "REFERRAL_REWARD_CONFIRMED"));
  const audits = t.admin_audit_logs.length;
  const again = await lib.runConversationCleanup(db.client, {});
  check("Reconcile: second run idempotent", again.reconciled === 0 && again.cleaned === 0 && again.closedRequests === 0 && again.failed === 0 && t.admin_audit_logs.length === audits && t.referral_rewards.length === 1 && t.service_requests[0].status === "CLOSED" && t.conversations[0].status === "DELETED");
}

{
  // Reconciliation never runs reward qualification, even if settlement never qualified one.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1, { conversationStatus: "ACTIVE" });
  t.referral_rewards.length = 0;
  t.referral_identities.push({ id: "id-P", subject_type: "CUSTOMER", subject_key: "CUST-P" }, { id: "id-R1", subject_type: "CUSTOMER", subject_key: "CUST-R1" });
  t.referral_attributions.push({ id: "att-PR1", referred_identity_id: "id-R1", referrer_identity_id: "id-P", status: "ACTIVE" });
  const run = await lib.runConversationCleanup(db.client, {});
  check("Reconcile: no reward qualification rerun", run.reconciled === 1 && t.referral_rewards.length === 0 && t.service_requests[0].status === "CLOSED");
}

{
  // Failure isolation: B's cleanup fails, A is still repaired; B recovers next run without a second reconcile.
  const db = createDb();
  const t = db.tables;
  seedSettled(db, 1, { conversationStatus: "ACTIVE" });
  seedSettled(db, 2, { conversationStatus: "ACTIVE" });
  db.failMessageDelete.add("conv-R2");
  const run = await lib.runConversationCleanup(db.client, {});
  const byId = (table, id) => t[table].find((row) => row.id === id);
  check("Reconcile isolation: A repaired despite B failure", run.reconciled === 2 && run.cleaned === 1 && run.failed === 1 && byId("service_requests", "req-R1").status === "CLOSED" && byId("conversations", "conv-R1").status === "DELETED");
  check("Reconcile isolation: B left retryable, content intact", byId("service_requests", "req-R2").status === "SETTLED" && byId("conversations", "conv-R2").status === "DELETION_SCHEDULED" && t.messages.filter((m) => m.conversation_id === "conv-R2").length === 2);
  db.failMessageDelete.clear();
  const retry = await lib.runConversationCleanup(db.client, {});
  check("Reconcile isolation: B recovered, not reconciled twice", retry.reconciled === 0 && retry.cleaned === 1 && byId("service_requests", "req-R2").status === "CLOSED" && t.admin_audit_logs.filter((row) => row.action === "SETTLED_CLEANUP_RECONCILED").length === 2 && t.referral_rewards.length === 2);
}

{
  // Eligibility is rooted in the request lifecycle: no non-settled status ever gets cleanup scheduled.
  const db = createDb();
  const t = db.tables;
  const unsettled = ["CREATED", "SEARCHING", "MATCHED", "HELPER_NOTIFIED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "PAYMENT_PENDING", "CANCELLED", "EXPIRED", "NO_HELPER_AVAILABLE"];
  unsettled.forEach((status, i) => seedSettled(db, i, { status, conversationStatus: "ACTIVE" }));
  const run = await lib.runConversationCleanup(db.client, {});
  check("Reconcile: every non-SETTLED status protected (incl. COMPLETED, PAYMENT_PENDING)", run.reconciled === 0 && run.cleaned === 0 && t.conversations.every((row) => row.status === "ACTIVE" && row.deletion_scheduled_at === null) && t.messages.length === unsettled.length * 2 && !t.admin_audit_logs.some((row) => row.action === "SETTLED_CLEANUP_RECONCILED"));
}

// ---------- static authority boundaries ----------
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const statusRoute = read("app/api/sys/requests/[requestId]/status/route.ts");
const cleanupRoute = read("app/api/sys/cleanup/conversations/route.ts");
const auth = read("lib/settlement/platformAuth.ts");
const chatRoute = read("app/api/chat/route.ts");
check("Settlement route requires platform operator", statusRoute.includes("authorizePlatformOperator(request)") && statusRoute.includes("UNAUTHORIZED"));
check("Cleanup route requires platform operator", cleanupRoute.includes("authorizePlatformOperator(request)") && cleanupRoute.includes("UNAUTHORIZED"));
check("Settlement is staging-only (no payment provider)", auth.includes("wreebowcbiymodswajwe") && statusRoute.includes("createStagingSettlementClient") && cleanupRoute.includes("createStagingSettlementClient"));
check("Platform auth ignores helper/customer/public-ID credentials", !/resolveAuthenticatedHelper|verifyConversationCapability|referral_id|referralId/.test(auth));
check("Settlement token has a minimum length", auth.includes("SETTLEMENT_TOKEN_MIN_LENGTH = 32"));
const helperRoutes = fs.readdirSync(new URL("../app/api/helper/assignments/[assignmentId]/", import.meta.url)).map((dir) => read(`app/api/helper/assignments/[assignmentId]/${dir}/route.ts`));
check("Helper routes cannot set financial states", helperRoutes.every((source) => !/PAYMENT_PENDING|"SETTLED"|"CLOSED"|settleServiceRequest/.test(source)));
const customerRoutes = ["app/api/requests/status/route.ts", "app/api/requests/capability/route.ts", "app/api/requests/route.ts", "app/api/chat/route.ts", "app/api/rewards/route.ts", "app/api/referrals/identity/route.ts"].map(read);
check("Customer/public routes cannot set financial states", customerRoutes.every((source) => !/settleServiceRequest|markPaymentPending|status: "SETTLED"|status: "PAYMENT_PENDING"/.test(source)));
check("Chat writes blocked after settlement", chatRoute.includes('conversation.status !== "ACTIVE"') && chatRoute.includes("CONVERSATION_CLOSED"));
check("Chat content withheld once cleanup scheduled", chatRoute.includes("DELETION_SCHEDULED") && chatRoute.includes("contentDeleted: true"));
const settlementLib = read("lib/settlement/serviceSettlement.ts");
const scheduledWorker = read("workers/scheduled.mjs");
const wranglerConfig = read("wrangler.jsonc");
const pkgScripts = JSON.parse(read("package.json")).scripts;
check("Scheduler calls the platform-token cleanup route", scheduledWorker.includes("/api/sys/cleanup/conversations") && scheduledWorker.includes("env.LIFE_HELP_SETTLEMENT_TOKEN") && scheduledWorker.includes("async scheduled("));
const stagingConfig = read("wrangler.staging.jsonc");
check("Cron attached by deploy:staging only", pkgScripts["deploy:staging"].endsWith("wrangler deploy --config wrangler.staging.jsonc") && stagingConfig.includes('"name": "life-help-staging"') && stagingConfig.includes('"main": "workers/scheduled.mjs"') && stagingConfig.includes('"crons": ["17 */6 * * *"]') && !/schedule|triggers|scheduled\.mjs|staging\.jsonc/.test(pkgScripts["deploy:production"]) && pkgScripts["deploy:production"].endsWith("wrangler deploy --name life-help"));
const compat = (source) => source.match(/"compatibility_date": "[^"]+"/)?.[0] + source.match(/"compatibility_flags": \[[^\]]*\]/)?.[0];
check("Staging config mirrors production runtime settings", compat(stagingConfig) === compat(wranglerConfig));
check("wrangler.jsonc has no cron trigger", !/"triggers"|"crons"/.test(wranglerConfig) && wranglerConfig.includes('"main": ".open-next/worker.js"'));
check("Retry audit distinguishes reconciliation from queued retry", cleanupRoute.includes('"SETTLED_CLEANUP_RECONCILED"') && cleanupRoute.includes('"QUEUED_CLEANUP_RETRY"'));
check("Reconciliation reuses scheduling, never qualifies rewards", (() => { const body = settlementLib.slice(settlementLib.indexOf("export async function runConversationCleanup")); return body.includes("scheduleConversationCleanup(client, requestRow.id)") && !body.includes("qualifyReferralReward") && !body.includes("settleServiceRequest") && !body.includes('from("referral_rewards")'); })());
check("Cleanup route stays platform-authorized for scheduled runs", cleanupRoute.indexOf("authorizePlatformOperator(request)") < cleanupRoute.indexOf("x-life-help-trigger"));
check("Cleanup deletes only messages", !/from\("(service_requests|referral_rewards|admin_audit_logs|request_assignments|conversations)"\)\.delete\(/.test(settlementLib));

if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

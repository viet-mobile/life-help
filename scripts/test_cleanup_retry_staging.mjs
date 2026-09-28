// Live STAGING E2E for the scheduled conversation-cleanup retry.
//
// Builds a real request through PAYMENT_PENDING via the public APIs, then reproduces the state a
// settlement leaves behind when it is interrupted after scheduling cleanup (request SETTLED,
// settlement audit + reward written, conversation DELETION_SCHEDULED, messages still present).
// No application code is changed to build the fixture.
//
// Usage:
//   node scripts/test_cleanup_retry_staging.mjs          # invoke the retry exactly as the cron does
//   node scripts/test_cleanup_retry_staging.mjs --cron   # wait for the deployed cron trigger instead
//   add --scenario=unscheduled: SETTLED request whose cleanup was never scheduled (ACTIVE chat)
import crypto from "node:crypto";
import { runGuarded, stagingTarget } from "./lib/envGuard.mjs";

// Shared tripwire: staging Supabase + staging Worker, verified before any mutation.
const { env, supabaseUrl, base } = await runGuarded("staging target", () => stagingTarget());
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const settlementToken = env.TEST_LIFE_HELP_SETTLEMENT_TOKEN;
const waitForCron = process.argv.includes("--cron");
// queued: crash after cleanup was scheduled. unscheduled: crash between SETTLED and scheduling.
const scenario = process.argv.includes("--scenario=unscheduled") ? "unscheduled" : "queued";
const cronTimeoutMs = 3 * 60 * 1000;
const runId = `CRT${Date.now()}`;
const startedAt = new Date().toISOString();

if (!serviceKey || !settlementToken) throw new Error("TEST_SUPABASE_SERVICE_ROLE_KEY and TEST_LIFE_HELP_SETTLEMENT_TOKEN are required");

const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
const results = [];
const created = { requestIds: new Set(), helperIds: new Set(), authUserIds: new Set(), identityIds: new Set(), conversationIds: new Set(), retryAuditIds: new Set() };

function pass(name, detail = "") { results.push(["PASS", name]); console.log(`PASS ${name}${detail ? ` ${detail}` : ""}`); }
function fail(name, error) { results.push(["FAIL", name]); console.log(`FAIL ${name} ${error}`); }
const expect = (name, condition, detail) => (condition ? pass(name) : fail(name, typeof detail === "string" ? detail : JSON.stringify(detail)));
const record = (status, name) => console.log(`${status} ${name}`);

async function readResponse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text.slice(0, 200) }; }
}

async function db(path, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { method, headers: { ...dbHeaders, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`${method} ${path.split("?")[0]} ${response.status} ${value?.message || value?.code || ""}`);
  return value;
}

async function authAdmin(path, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${path}`, { method, headers: dbHeaders, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`auth ${method} ${response.status} ${value?.msg || value?.message || ""}`);
  return value;
}


async function createHelper() {
  const email = `h.${runId.toLowerCase()}@example.test`;
  const password = `CRT-${crypto.randomUUID()}!`;
  const user = await authAdmin("users", "POST", { email, password, email_confirm: true });
  created.authUserIds.add(user.id);
  const helper = (await db("helpers", "POST", { auth_user_id: user.id, helper_id: `HLP-${runId}`, name: `CRT TEST ${runId}`, email, country: "KR", sido: `CRT-${runId}`, gungu: "G1", primary_locale: "ko", spoken_locales: ["ko"], on_duty: true, is_active: true, rating: 5, completed_jobs: 0 }))[0];
  created.helperIds.add(helper.id);
  await db("helper_services", "POST", { helper_id: helper.id, service_slug: "boiler" });
  await db("helper_regions", "POST", { helper_id: helper.id, country: "KR", sido: `CRT-${runId}`, gungu: "G1" });
  const session = await readResponse(await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: serviceKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
  return { helper, accessToken: session.access_token };
}

// A real customer device: server-issued public ID (= subject key) plus the HttpOnly owner cookie.
async function referral(deviceId, referralId) {
  const response = await fetch(`${base}/api/referrals/identity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, subjectType: "CUSTOMER", ...(referralId ? { referralId } : {}) }) });
  const body = await readResponse(response);
  const cookie = (response.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).find((c) => c.startsWith("life_help_device_owner="));
  if (body.referralId) created.subjectKeys.add(body.referralId);
  return { ...body, cookie };
}

/** Exactly the request workers/scheduled.mjs sends, over the public URL. */
function cleanupRetry(headers = {}, body = { limit: 50 }) {
  return fetch(`${base}/api/sys/cleanup/conversations`, { method: "POST", headers: { "Content-Type": "application/json", "X-Life-Help-Trigger": "scheduled", ...headers }, body: JSON.stringify(body) });
}

// Referral rewards are immutable financial history (migration 019): a rewarded request is kept with its
// settlement audit (row only) and the identities / attribution the reward references; the rest is removed.
const retained = { requests: new Set(), identities: new Set() };
async function cleanupFixtures() {
  const ids = [...created.requestIds];
  for (const r of ids.length ? await db(`referral_rewards?qualifying_request_id=in.(${ids.join(",")})&select=qualifying_request_id,referrer_identity_id,referred_identity_id`).catch(() => []) : []) {
    retained.requests.add(r.qualifying_request_id); retained.identities.add(r.referrer_identity_id); retained.identities.add(r.referred_identity_id);
  }
  for (const requestId of created.requestIds) {
    await db(`app_notifications?payload->>request_id=eq.${requestId}`, "DELETE").catch(() => {});
    for (const { id } of await db(`conversations?request_id=eq.${requestId}&select=id`).catch(() => [])) created.conversationIds.add(id);
    for (const id of created.conversationIds) {
      await db(`app_notifications?payload->>conversation_id=eq.${id}`, "DELETE").catch(() => {});
      await db(`messages?conversation_id=eq.${id}`, "DELETE").catch(() => {});
    }
    await db(`request_assignments?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`conversations?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`admin_escalations?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    if (retained.requests.has(requestId)) continue;
    await db(`service_requests?id=eq.${requestId}`, "DELETE").catch(() => {});
  }
  // Audit rows (settlement + cleanup-retry runs) are append-only history since migration 021: never deleted.
  for (const helperId of created.helperIds) {
    await db(`helper_services?helper_id=eq.${helperId}`, "DELETE").catch(() => {});
    await db(`helper_regions?helper_id=eq.${helperId}`, "DELETE").catch(() => {});
    await db(`helpers?id=eq.${helperId}`, "DELETE").catch(() => {});
  }
  for (const userId of created.authUserIds) await authAdmin(`users/${userId}`, "DELETE").catch(() => {});
  for (const identityId of created.identityIds) {
    await db(`app_notifications?recipient_id=in.(${[...created.subjectKeys].join(",")})`, "DELETE").catch(() => {});
    if (retained.identities.has(identityId)) continue;
    await db(`referral_attributions?or=(referred_identity_id.eq.${identityId},referrer_identity_id.eq.${identityId})`, "DELETE").catch(() => {});
    await db(`referral_identities?id=eq.${identityId}`, "DELETE").catch(() => {});
  }
}

created.subjectKeys = new Set();
try {
  // ---------- fixture: real lifecycle up to PAYMENT_PENDING ----------
  const referrer = await referral(`${runId}-referrer`);
  const referred = await referral(`${runId}-customer`, referrer.referralId);
  const referrerKey = referrer.referralId, customerKey = referred.referralId;
  const identities = await db(`referral_identities?subject_key=in.(${referrerKey},${customerKey})&select=id,subject_key,referral_id`);
  identities.forEach((row) => created.identityIds.add(row.id));
  const referrerIdentity = identities.find((row) => row.subject_key === referrerKey);
  const customerIdentity = identities.find((row) => row.subject_key === customerKey);
  const attribution = (await db(`referral_attributions?referred_identity_id=eq.${customerIdentity?.id}&select=id`))[0];

  const helper = await createHelper();
  const helperAuth = { Authorization: `Bearer ${helper.accessToken}` };
  const platformPost = (id, target) => fetch(`${base}/api/sys/requests/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status: target }) });

  /** Real lifecycle via public APIs: request → match H → accept/start/complete → 2 chat messages (→ PAYMENT_PENDING). */
  async function buildRequest(device, label, { paymentPending }) {
    const customer = device.referralId;
    const idempotencyKey = crypto.randomUUID();
    const createBody = await readResponse(await fetch(`${base}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey, Cookie: device.cookie, Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ service_slug: "boiler", customer_id: customer, customer_locale: "en", country: "KR", sido: `CRT-${runId}`, gungu: "G1", dong: "D1", address: `${runId} address`, description: `${runId} ${label} request`, selected_options: ["test"] }) }));
    if (createBody.requestId) created.requestIds.add(createBody.requestId);
    const id = createBody.requestId;
    const assignment = (await db(`request_assignments?request_id=eq.${id}&select=id,helper_id`))[0];
    const steps = [];
    for (const action of ["accept", "start", "complete"]) steps.push((await fetch(`${base}/api/helper/assignments/${assignment?.id}/${action}`, { method: "POST", headers: helperAuth })).status);
    const capability = (await readResponse(await fetch(`${base}/api/requests/capability`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey, Cookie: device.cookie } }))).capability;
    steps.push((await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, capability, originalLanguage: "en", originalText: `${runId} ${label} customer message` }) })).status);
    steps.push((await fetch(`${base}/api/chat`, { method: "POST", headers: { ...helperAuth, "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, originalLanguage: "ko", originalText: `${runId} ${label} helper message` }) })).status);
    if (paymentPending) steps.push((await platformPost(id, "PAYMENT_PENDING")).status);
    const conversation = (await db(`conversations?request_id=eq.${id}&select=id,status`))[0];
    if (conversation) created.conversationIds.add(conversation.id);
    const ok = createBody.status === "MATCHED" && assignment?.helper_id === helper.helper.id && steps.every((code) => code === 200) && !!conversation;
    return { requestId: id, capability, conversation, ok, steps, match: createBody.status };
  }

  const main = await buildRequest(referred, "main", { paymentPending: true });
  const requestId = main.requestId;
  const capability = main.capability;
  const conversation = main.conversation;
  expect("Fixture: real lifecycle to PAYMENT_PENDING", main.ok && attribution, { match: main.match, steps: main.steps, attribution: !!attribution });
  // Invalid candidates with live chat content: the retry must never touch them.
  const completedDevice = await referral(`${runId}-completed`), pendingDevice = await referral(`${runId}-pending`);
  for (const row of await db(`referral_identities?referral_id=in.(${completedDevice.referralId},${pendingDevice.referralId})&select=id`)) created.identityIds.add(row.id);
  const protectedCompleted = await buildRequest(completedDevice, "completed", { paymentPending: false });
  const protectedPending = await buildRequest(pendingDevice, "pending", { paymentPending: true });
  expect("Fixture: COMPLETED and PAYMENT_PENDING candidates with ACTIVE chat", protectedCompleted.ok && protectedPending.ok, { completed: protectedCompleted.steps, pending: protectedPending.steps });

  // ---------- simulate the interrupted settlement ----------
  // Same writes settleServiceRequest performs (status, settlement audit, reward). "queued" also
  // schedules cleanup (crash before the inline cleanup); "unscheduled" crashes before scheduling.
  const settled = await db(`service_requests?id=eq.${requestId}&status=eq.PAYMENT_PENDING`, "PATCH", { status: "SETTLED", updated_at: new Date().toISOString() });
  // The settlement audit goes through the same append-only authority settlement uses (migration 021).
  await fetch(`${supabaseUrl}/rest/v1/rpc/append_admin_audit_log`, { method: "POST", headers: dbHeaders, body: JSON.stringify({ p_action: "SERVICE_SETTLED", p_entity_type: "service_request", p_entity_id: requestId, p_metadata: { actor_kind: "PLATFORM_TOKEN", settlement_method: "INTERNAL_PLATFORM_CONFIRMATION", settlement_rail: "INTERNAL", external_payment_provider: null, external_payment_transaction_id: null, external_payment_verified: false } }) });
  const now = new Date().toISOString();
  if (scenario === "queued") await db(`conversations?request_id=eq.${requestId}&status=in.(ACTIVE,CLOSED)`, "PATCH", { status: "DELETION_SCHEDULED", deletion_scheduled_at: now, closed_at: now });
  // The reward is created exactly as settlement creates it since migration 019: the trusted function.
  await fetch(`${supabaseUrl}/rest/v1/rpc/create_referral_reward_for_settled_request`, { method: "POST", headers: dbHeaders, body: JSON.stringify({ p_request_id: requestId }) });

  const status = async () => (await db(`service_requests?id=eq.${requestId}&select=status`))[0]?.status;
  const messageCount = async () => (await db(`messages?conversation_id=eq.${conversation.id}&select=id`)).length;
  const conversationStatus = async () => (await db(`conversations?id=eq.${conversation.id}&select=status`))[0]?.status;
  const rewardCount = async () => (await db(`referral_rewards?qualifying_request_id=eq.${requestId}&select=id`)).length;
  const auditCount = async (action) => (await db(`admin_audit_logs?entity_id=eq.${requestId}&action=eq.${action}&select=id`)).length;
  const protectedIntact = async () => {
    const rows = [];
    for (const [fixture, expected] of [[protectedCompleted, "COMPLETED"], [protectedPending, "PAYMENT_PENDING"]]) {
      const request = (await db(`service_requests?id=eq.${fixture.requestId}&select=status`))[0]?.status;
      const conv = (await db(`conversations?id=eq.${fixture.conversation.id}&select=status,deletion_scheduled_at`))[0];
      const messages = (await db(`messages?conversation_id=eq.${fixture.conversation.id}&select=id`)).length;
      rows.push({ expected, request, conversation: conv?.status, scheduled: conv?.deletion_scheduled_at, messages, rewards: (await db(`referral_rewards?qualifying_request_id=eq.${fixture.requestId}&select=id`)).length });
    }
    return { ok: rows.every((row) => row.request === row.expected && row.conversation === "ACTIVE" && row.scheduled === null && row.messages === 2 && row.rewards === 0), rows };
  };
  const expectedConversation = scenario === "queued" ? "DELETION_SCHEDULED" : "ACTIVE";
  expect(`Fixture: SETTLED + ${expectedConversation} conversation, content present, reward x1`, settled.length === 1 && (await status()) === "SETTLED" && (await conversationStatus()) === expectedConversation && (await messageCount()) === 2 && (await rewardCount()) === 1 && (await auditCount("SETTLED_CLEANUP_RECONCILED")) === 0, { status: await status(), conversation: await conversationStatus(), messages: await messageCount() });

  // ---------- security: the retry is not publicly callable ----------
  const denied = {
    anonymous: (await cleanupRetry()).status,
    customerCapability: (await cleanupRetry({ Authorization: `Bearer ${capability}` }, { limit: 50, capability, requestId })).status,
    publicId: (await cleanupRetry({ Authorization: `Bearer ${referred.referralId}` })).status,
    helper: (await cleanupRetry(helperAuth)).status,
    wrongToken: (await cleanupRetry({ Authorization: `Bearer ${settlementToken.slice(0, -2)}xx` })).status,
    serviceRoleKey: (await cleanupRetry({ Authorization: `Bearer ${serviceKey}` })).status,
  };
  expect("Unauthorized callers blocked (anon/customer/public ID/helper/wrong token/service key)", Object.values(denied).every((code) => code === 401), denied);
  expect("Blocked calls changed nothing", (await messageCount()) === 2 && (await status()) === "SETTLED" && (await conversationStatus()) === expectedConversation, "fixture mutated");

  // ---------- recovery ----------
  let first;
  if (waitForCron) {
    const deadline = Date.now() + cronTimeoutMs;
    while (Date.now() < deadline && (await status()) !== "CLOSED") await new Promise((resolve) => setTimeout(resolve, 10000));
    const audit = (await db(`admin_audit_logs?action=eq.CONVERSATION_CLEANUP_RETRY&created_at=gte.${startedAt}&select=id,metadata&order=id.desc`)).find((row) => row.metadata?.trigger === "SCHEDULED" && row.metadata?.cleaned >= 1);
    if (audit) created.retryAuditIds.add(audit.id);
    first = audit?.metadata;
    expect("Cron trigger fired and ran the retry", audit && audit.metadata.actor_kind === "PLATFORM_TOKEN", "no SCHEDULED retry audit within timeout");
  } else {
    const response = await cleanupRetry({ Authorization: `Bearer ${settlementToken}` });
    first = await readResponse(response);
    expect("Scheduler path authorized", response.status === 200 && first.trigger === "SCHEDULED", { status: response.status, first });
    const audit = (await db(`admin_audit_logs?action=eq.CONVERSATION_CLEANUP_RETRY&created_at=gte.${startedAt}&select=id,metadata&order=id.desc`)).find((row) => row.metadata?.trigger === "SCHEDULED");
    if (audit) created.retryAuditIds.add(audit.id);
    expect("Retry run recorded with counts", audit && ["scanned", "eligible", "cleaned", "already_clean", "failed"].every((key) => typeof audit.metadata[key] === "number"), audit?.metadata);
  }
  console.log(`  counts ${JSON.stringify({ scanned: first?.scanned, eligible: first?.eligible, cleaned: first?.cleaned, already_clean: first?.already_clean, failed: first?.failed, reconciled: first?.reconciled, closedRequests: first?.closedRequests })}`);
  if (scenario === "unscheduled") {
    expect("Missing cleanup schedule detected and reconciled", first?.reconciled >= 1 && first?.reason === "SETTLED_CLEANUP_RECONCILED" && (first?.reconciledRequestIds || []).includes(requestId) && (await auditCount("SETTLED_CLEANUP_RECONCILED")) === 1, first);
    const reconciledAudit = (await db(`admin_audit_logs?entity_id=eq.${requestId}&action=eq.SETTLED_CLEANUP_RECONCILED&select=metadata`))[0];
    expect("Reconciliation audit holds no message content", reconciledAudit && !JSON.stringify(reconciledAudit).includes(runId), reconciledAudit);
  } else {
    expect("Queued retry is not labelled as reconciliation", first?.reason === "QUEUED_CLEANUP_RETRY" && (await auditCount("SETTLED_CLEANUP_RECONCILED")) === 0, first);
  }
  expect("Interrupted SETTLED cleanup recovered", first?.cleaned >= 1 && first?.failed === 0 && (await messageCount()) === 0 && (await conversationStatus()) === "DELETED", first);
  expect("Request closed after recovered cleanup", (await status()) === "CLOSED" && (await auditCount("SERVICE_CLOSED")) === 1, await status());
  expect("Assignment history preserved", (await db(`request_assignments?request_id=eq.${requestId}&select=status`)).map((row) => row.status).join() === "COMPLETED");
  expect("Reward preserved, not duplicated", (await rewardCount()) === 1);
  const settledAudit = (await db(`admin_audit_logs?entity_id=eq.${requestId}&action=eq.SERVICE_SETTLED&select=metadata`))[0];
  expect("external_payment_verified stays false", settledAudit?.metadata?.external_payment_verified === false && settledAudit?.metadata?.external_payment_transaction_id === null, settledAudit);
  const intact = await protectedIntact();
  expect("COMPLETED and PAYMENT_PENDING conversations protected", intact.ok, intact.rows);
  expect("Legal/audit records preserved", (await auditCount("SERVICE_SETTLED")) === 1 && (await auditCount("SERVICE_PAYMENT_PENDING")) === 1 && (await auditCount("CONVERSATION_CONTENT_DELETED")) === 1 && (await db(`conversations?id=eq.${conversation.id}&select=id`)).length === 1);

  // ---------- idempotent re-run ----------
  const againResponse = await cleanupRetry({ Authorization: `Bearer ${settlementToken}` }, { limit: 50, requestId });
  const again = await readResponse(againResponse);
  expect("Second retry idempotent", againResponse.status === 200 && again.cleaned === 0 && again.reconciled === 0 && again.closedRequests === 0 && again.failed === 0 && (await status()) === "CLOSED" && (await conversationStatus()) === "DELETED" && (await auditCount("SETTLED_CLEANUP_RECONCILED")) === (scenario === "unscheduled" ? 1 : 0) && (await db(`request_assignments?request_id=eq.${requestId}&select=status`)).map((row) => row.status).join() === "COMPLETED" && (await rewardCount()) === 1 && (await auditCount("CONVERSATION_CONTENT_DELETED")) === 1 && (await auditCount("SERVICE_CLOSED")) === 1, again);
  const resettle = await readResponse(await fetch(`${base}/api/sys/requests/${requestId}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status: "SETTLED" }) }));
  expect("No invalid transition or duplicate reward on re-settle", resettle.idempotent === true && resettle.status === "CLOSED" && (await rewardCount()) === 1 && (await auditCount("SERVICE_SETTLED")) === 1, resettle);
} catch (error) {
  fail("E2E harness", error);
} finally {
  await cleanupFixtures();
  const leftovers = {
    requests: (await db(`service_requests?description=like.${runId}*&select=id`)).filter((r) => !retained.requests.has(r.id)).length,
    helpers: (await db(`helpers?helper_id=eq.HLP-${runId}&select=id`)).length,
    conversations: created.conversationIds.size ? (await db(`conversations?id=in.(${[...created.conversationIds].join(",")})&select=id`)).length : 0,
    messages: (await db(`messages?original_text=like.${runId}*&select=id`)).length,
    identities: (await db(`referral_identities?subject_key=in.(${[...created.subjectKeys].join(",")})&select=id`)).filter((r) => !retained.identities.has(r.id)).length,
    notifications: (await db(`app_notifications?recipient_id=in.(${[...created.subjectKeys].join(",")},HLP-${runId})&select=id`)).length,
  };
  record("INFO", `audit history retained (append-only): ${(await db(`admin_audit_logs?entity_id=in.(${[...created.requestIds, "00000000-0000-0000-0000-000000000000"].join(",")})&select=id`)).length} request audit rows + ${created.retryAuditIds.size} cleanup-retry run rows`);
  expect("Fixture cleanup (reward history retained, never deleted)", Object.values(leftovers).every((n) => n === 0), { ...leftovers, retainedRequests: [...retained.requests], retainedIdentities: [...retained.identities] });
}

const counts = Object.fromEntries(["PASS", "FAIL"].map((s) => [s, results.filter(([v]) => v === s).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
if (counts.FAIL > 0) process.exit(1);

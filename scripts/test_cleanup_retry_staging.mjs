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
import fs from "node:fs";
import crypto from "node:crypto";

const env = {};
for (const line of fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
}

const supabaseUrl = env.TEST_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const settlementToken = env.TEST_LIFE_HELP_SETTLEMENT_TOKEN;
const stagingRef = (supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase/) || [])[1];
const base = "https://life-help-staging.simpl2eye.workers.dev";
const waitForCron = process.argv.includes("--cron");
const cronTimeoutMs = 3 * 60 * 1000;
const runId = `CRT${Date.now()}`;
const startedAt = new Date().toISOString();

if (stagingRef !== "wreebowcbiymodswajwe" || stagingRef === "wstdbymmkrqgtsibhcjz") throw new Error(`STAGING GUARD FAILED: ${stagingRef || "missing"}`);
if (!serviceKey || !settlementToken) throw new Error("TEST_SUPABASE_SERVICE_ROLE_KEY and TEST_LIFE_HELP_SETTLEMENT_TOKEN are required");

const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
const results = [];
const created = { requestIds: new Set(), helperIds: new Set(), authUserIds: new Set(), identityIds: new Set(), conversationIds: new Set(), retryAuditIds: new Set() };

function pass(name, detail = "") { results.push(["PASS", name]); console.log(`PASS ${name}${detail ? ` ${detail}` : ""}`); }
function fail(name, error) { results.push(["FAIL", name]); console.log(`FAIL ${name} ${error}`); }
const expect = (name, condition, detail) => (condition ? pass(name) : fail(name, typeof detail === "string" ? detail : JSON.stringify(detail)));

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

const letters = (n) => Array.from(crypto.randomBytes(n), (b) => String.fromCharCode(65 + (b % 26))).join("");

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

async function referral(deviceId, subjectKey, referralId) {
  const response = await fetch(`${base}/api/referrals/identity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, subjectType: "CUSTOMER", subjectKey, ...(referralId ? { referralId } : {}) }) });
  return readResponse(response);
}

/** Exactly the request workers/scheduled.mjs sends, over the public URL. */
function cleanupRetry(headers = {}, body = { limit: 50 }) {
  return fetch(`${base}/api/sys/cleanup/conversations`, { method: "POST", headers: { "Content-Type": "application/json", "X-Life-Help-Trigger": "scheduled", ...headers }, body: JSON.stringify(body) });
}

async function cleanupFixtures() {
  for (const requestId of created.requestIds) {
    await db(`referral_rewards?qualifying_request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`admin_audit_logs?entity_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`app_notifications?payload->>request_id=eq.${requestId}`, "DELETE").catch(() => {});
    for (const { id } of await db(`conversations?request_id=eq.${requestId}&select=id`).catch(() => [])) created.conversationIds.add(id);
    for (const id of created.conversationIds) {
      await db(`app_notifications?payload->>conversation_id=eq.${id}`, "DELETE").catch(() => {});
      await db(`messages?conversation_id=eq.${id}`, "DELETE").catch(() => {});
    }
    await db(`request_assignments?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`conversations?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`admin_escalations?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`service_requests?id=eq.${requestId}`, "DELETE").catch(() => {});
  }
  for (const id of created.retryAuditIds) await db(`admin_audit_logs?id=eq.${id}`, "DELETE").catch(() => {});
  for (const helperId of created.helperIds) {
    await db(`helper_services?helper_id=eq.${helperId}`, "DELETE").catch(() => {});
    await db(`helper_regions?helper_id=eq.${helperId}`, "DELETE").catch(() => {});
    await db(`helpers?id=eq.${helperId}`, "DELETE").catch(() => {});
  }
  for (const userId of created.authUserIds) await authAdmin(`users/${userId}`, "DELETE").catch(() => {});
  for (const identityId of created.identityIds) {
    await db(`app_notifications?recipient_id=in.(${[...created.subjectKeys].join(",")})`, "DELETE").catch(() => {});
    await db(`referral_attributions?or=(referred_identity_id.eq.${identityId},referrer_identity_id.eq.${identityId})`, "DELETE").catch(() => {});
    await db(`referral_identities?id=eq.${identityId}`, "DELETE").catch(() => {});
  }
}

created.subjectKeys = new Set();
try {
  // ---------- fixture: real lifecycle up to PAYMENT_PENDING ----------
  const referrerKey = letters(8), customerKey = letters(8);
  created.subjectKeys.add(referrerKey).add(customerKey);
  const referrer = await referral(`${runId}-referrer`, referrerKey);
  const referred = await referral(`${runId}-customer`, customerKey, referrer.referralId);
  const identities = await db(`referral_identities?subject_key=in.(${referrerKey},${customerKey})&select=id,subject_key,referral_id`);
  identities.forEach((row) => created.identityIds.add(row.id));
  const referrerIdentity = identities.find((row) => row.subject_key === referrerKey);
  const customerIdentity = identities.find((row) => row.subject_key === customerKey);
  const attribution = (await db(`referral_attributions?referred_identity_id=eq.${customerIdentity?.id}&select=id`))[0];

  const helper = await createHelper();
  const idempotencyKey = crypto.randomUUID();
  const createResponse = await fetch(`${base}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ service_slug: "boiler", customer_id: customerKey, customer_locale: "en", country: "KR", sido: `CRT-${runId}`, gungu: "G1", dong: "D1", address: `${runId} address`, description: `${runId} request`, selected_options: ["test"] }) });
  const createBody = await readResponse(createResponse);
  if (createBody.requestId) created.requestIds.add(createBody.requestId);
  const requestId = createBody.requestId;
  const assignment = (await db(`request_assignments?request_id=eq.${requestId}&select=id,helper_id`))[0];
  const helperAuth = { Authorization: `Bearer ${helper.accessToken}` };
  const lifecycle = [];
  for (const action of ["accept", "start", "complete"]) lifecycle.push((await fetch(`${base}/api/helper/assignments/${assignment?.id}/${action}`, { method: "POST", headers: helperAuth })).status);
  const capability = (await readResponse(await fetch(`${base}/api/requests/capability`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey } }))).capability;
  const chatA = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, capability, originalLanguage: "en", originalText: `${runId} customer message` }) });
  const chatB = await fetch(`${base}/api/chat`, { method: "POST", headers: { ...helperAuth, "Content-Type": "application/json" }, body: JSON.stringify({ requestId, originalLanguage: "ko", originalText: `${runId} helper message` }) });
  const pending = await fetch(`${base}/api/sys/requests/${requestId}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status: "PAYMENT_PENDING" }) });
  const conversation = (await db(`conversations?request_id=eq.${requestId}&select=id,status`))[0];
  if (conversation) created.conversationIds.add(conversation.id);
  expect("Fixture: real lifecycle to PAYMENT_PENDING", createBody.status === "MATCHED" && assignment?.helper_id === helper.helper.id && lifecycle.every((s) => s === 200) && chatA.status === 200 && chatB.status === 200 && pending.status === 200 && attribution, { match: createBody.status, lifecycle, chat: [chatA.status, chatB.status], pending: pending.status, attribution: !!attribution });

  // ---------- simulate settlement interrupted after scheduling cleanup ----------
  // Same writes settleServiceRequest performs before the inline runConversationCleanup call.
  const settled = await db(`service_requests?id=eq.${requestId}&status=eq.PAYMENT_PENDING`, "PATCH", { status: "SETTLED", updated_at: new Date().toISOString() });
  await db("admin_audit_logs", "POST", { action: "SERVICE_SETTLED", entity_type: "service_request", entity_id: requestId, actor_id: null, metadata: { actor_kind: "PLATFORM_TOKEN", settlement_method: "INTERNAL_PLATFORM_CONFIRMATION", external_payment_provider: null, external_payment_transaction_id: null, external_payment_verified: false } });
  const now = new Date().toISOString();
  await db(`conversations?request_id=eq.${requestId}&status=in.(ACTIVE,CLOSED)`, "PATCH", { status: "DELETION_SCHEDULED", deletion_scheduled_at: now, closed_at: now });
  await db("referral_rewards", "POST", { attribution_id: attribution.id, qualifying_request_id: requestId, referrer_identity_id: referrerIdentity.id, referred_identity_id: customerIdentity.id, tier: "WLH", reward_amount_krw: 1000, first_service_discount_krw: 1000, state: "QUALIFIED", settled_at: now });

  const status = async () => (await db(`service_requests?id=eq.${requestId}&select=status`))[0]?.status;
  const messageCount = async () => (await db(`messages?conversation_id=eq.${conversation.id}&select=id`)).length;
  const conversationStatus = async () => (await db(`conversations?id=eq.${conversation.id}&select=status`))[0]?.status;
  const rewardCount = async () => (await db(`referral_rewards?qualifying_request_id=eq.${requestId}&select=id`)).length;
  const auditCount = async (action) => (await db(`admin_audit_logs?entity_id=eq.${requestId}&action=eq.${action}&select=id`)).length;
  expect("Fixture: request SETTLED, cleanup interrupted", settled.length === 1 && (await status()) === "SETTLED" && (await conversationStatus()) === "DELETION_SCHEDULED" && (await messageCount()) === 2, { status: await status(), conversation: await conversationStatus(), messages: await messageCount() });

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
  expect("Blocked calls changed nothing", (await messageCount()) === 2 && (await status()) === "SETTLED", "fixture mutated");

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
  console.log(`  counts ${JSON.stringify({ scanned: first?.scanned, eligible: first?.eligible, cleaned: first?.cleaned, already_clean: first?.already_clean, failed: first?.failed, closedRequests: first?.closedRequests })}`);
  expect("Interrupted SETTLED cleanup recovered", first?.cleaned >= 1 && first?.failed === 0 && (await messageCount()) === 0 && (await conversationStatus()) === "DELETED", first);
  expect("Request closed after recovered cleanup", (await status()) === "CLOSED" && (await auditCount("SERVICE_CLOSED")) === 1, await status());
  expect("Assignment history preserved", (await db(`request_assignments?request_id=eq.${requestId}&select=status`)).map((row) => row.status).join() === "COMPLETED");
  expect("Reward preserved, not duplicated", (await rewardCount()) === 1);
  expect("Legal/audit records preserved", (await auditCount("SERVICE_SETTLED")) === 1 && (await auditCount("SERVICE_PAYMENT_PENDING")) === 1 && (await auditCount("CONVERSATION_CONTENT_DELETED")) === 1 && (await db(`conversations?id=eq.${conversation.id}&select=id`)).length === 1);

  // ---------- idempotent re-run ----------
  const againResponse = await cleanupRetry({ Authorization: `Bearer ${settlementToken}` }, { limit: 50, requestId });
  const again = await readResponse(againResponse);
  expect("Second retry idempotent", againResponse.status === 200 && again.cleaned === 0 && again.closedRequests === 0 && again.failed === 0 && (await status()) === "CLOSED" && (await rewardCount()) === 1 && (await auditCount("CONVERSATION_CONTENT_DELETED")) === 1 && (await auditCount("SERVICE_CLOSED")) === 1, again);
  const resettle = await readResponse(await fetch(`${base}/api/sys/requests/${requestId}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status: "SETTLED" }) }));
  expect("No invalid transition or duplicate reward on re-settle", resettle.idempotent === true && resettle.status === "CLOSED" && (await rewardCount()) === 1 && (await auditCount("SERVICE_SETTLED")) === 1, resettle);
} catch (error) {
  fail("E2E harness", error);
} finally {
  await cleanupFixtures();
  const leftovers = {
    requests: (await db(`service_requests?description=like.${runId}*&select=id`)).length,
    helpers: (await db(`helpers?helper_id=eq.HLP-${runId}&select=id`)).length,
    conversations: created.conversationIds.size ? (await db(`conversations?id=in.(${[...created.conversationIds].join(",")})&select=id`)).length : 0,
    messages: (await db(`messages?original_text=like.${runId}*&select=id`)).length,
    identities: (await db(`referral_identities?subject_key=in.(${[...created.subjectKeys].join(",")})&select=id`)).length,
    notifications: (await db(`app_notifications?recipient_id=in.(${[...created.subjectKeys].join(",")},HLP-${runId})&select=id`)).length,
    retryAudits: created.retryAuditIds.size ? (await db(`admin_audit_logs?id=in.(${[...created.retryAuditIds].join(",")})&select=id`)).length : 0,
  };
  expect("Fixture cleanup", Object.values(leftovers).every((n) => n === 0), leftovers);
}

const counts = Object.fromEntries(["PASS", "FAIL"].map((s) => [s, results.filter(([v]) => v === s).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
if (counts.FAIL > 0) process.exit(1);

import fs from "node:fs";
import crypto from "node:crypto";

const env = {};
for (const line of fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
}

const supabaseUrl = env.TEST_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const stagingRef = (supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase/) || [])[1];
const productionRef = "wstdbymmkrqgtsibhcjz";
const expectedRef = "wreebowcbiymodswajwe";
const base = "https://life-help-staging.simpl2eye.workers.dev";
const runId = `S3E2E${Date.now()}`;

if (stagingRef !== expectedRef || stagingRef === productionRef) {
  throw new Error(`STAGING GUARD FAILED: ${stagingRef || "missing"}`);
}
if (!serviceKey) throw new Error("TEST_SUPABASE_SERVICE_ROLE_KEY is required");

const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
const results = [];
const requestIds = new Set();
const helperIds = new Set();
const authUserIds = new Set();
const referralIdentityIds = new Set();

function pass(name, detail = "") { results.push(["PASS", name, detail]); console.log(`PASS ${name}${detail ? ` ${detail}` : ""}`); }
function fail(name, error) { results.push(["FAIL", name, String(error)]); console.log(`FAIL ${name} ${error}`); }
function notTested(name, reason) { results.push(["NOT_TESTED", name, reason]); console.log(`NOT_TESTED ${name} ${reason}`); }

async function readResponse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text.slice(0, 200) }; }
}

async function db(path, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: { ...dbHeaders, Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`${method} ${path.split("?")[0]} ${response.status} ${value?.message || value?.code || ""}`);
  return value;
}

async function authAdmin(path, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${path}`, {
    method,
    headers: dbHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`auth ${method} ${response.status} ${value?.msg || value?.message || ""}`);
  return value;
}

async function createHelper(label, rating) {
  const email = `${label.toLowerCase()}.${runId.toLowerCase()}@example.test`;
  const password = `S3-Test-${crypto.randomUUID()}!`;
  const user = await authAdmin("users", "POST", { email, password, email_confirm: true });
  authUserIds.add(user.id);
  const helper = (await db("helpers", "POST", {
    auth_user_id: user.id,
    helper_id: `HLP-${runId}-${label}`,
    name: `S3 TEST ${label}`,
    email,
    country: "KR",
    sido: `S3-${runId}`,
    gungu: "G1",
    primary_locale: "ko",
    spoken_locales: ["ko"],
    on_duty: true,
    is_active: true,
    rating,
    completed_jobs: 0,
  }))[0];
  helperIds.add(helper.id);
  await db("helper_services", "POST", { helper_id: helper.id, service_slug: "boiler" });
  await db("helper_regions", "POST", { helper_id: helper.id, country: "KR", sido: `S3-${runId}`, gungu: "G1" });
  const session = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: serviceKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const sessionBody = await readResponse(session);
  return { helper, accessToken: sessionBody.access_token };
}

async function referral(deviceId, subjectKey, referralId) {
  const response = await fetch(`${base}/api/referrals/identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, subjectType: "CUSTOMER", subjectKey, ...(referralId ? { referralId } : {}) }),
  });
  return { response, body: await readResponse(response) };
}

async function createRequest(customerId, idempotencyKey = crypto.randomUUID()) {
  const response = await fetch(`${base}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      service_slug: "boiler", customer_id: customerId, customer_locale: "en", country: "KR",
      sido: `S3-${runId}`, gungu: "G1", dong: "D1", address: `${runId} address`,
      description: `${runId} customer request`, selected_options: ["test"],
    }),
  });
  const body = await readResponse(response);
  if (body.requestId) requestIds.add(body.requestId);
  return { response, body, idempotencyKey };
}

async function cleanup() {
  for (const requestId of requestIds) {
    await db(`messages?conversation_id=in.(${requestId})`, "DELETE").catch(() => {});
    await db(`app_notifications?payload->>request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`request_assignments?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`conversations?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`admin_escalations?request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`service_requests?id=eq.${requestId}`, "DELETE").catch(() => {});
  }
  for (const helperId of helperIds) {
    await db(`helper_services?helper_id=eq.${helperId}`, "DELETE").catch(() => {});
    await db(`helper_regions?helper_id=eq.${helperId}`, "DELETE").catch(() => {});
    await db(`helpers?id=eq.${helperId}`, "DELETE").catch(() => {});
  }
  for (const userId of authUserIds) await authAdmin(`users/${userId}`, "DELETE").catch(() => {});
  for (const identityId of referralIdentityIds) {
    await db(`referral_attributions?or=(referred_identity_id.eq.${identityId},referrer_identity_id.eq.${identityId})`, "DELETE").catch(() => {});
    await db(`referral_identities?id=eq.${identityId}`, "DELETE").catch(() => {});
  }
}

try {
  // A. Referral attribution
  const referrer = await referral(`${runId}-referrer-device`, "S3REF-A");
  const referred = await referral(`${runId}-referred-device`, "QWERTYUI", referrer.body.referralId);
  if (referrer.response.status === 200 && /^[A-Z]{8}$/.test(referrer.body.referralId || "") && referred.response.status === 200) pass("Referral API attribution"); else fail("Referral API attribution", JSON.stringify({ referrer: referrer.response.status, referred: referred.response.status }));
  const refRows = await db(`referral_identities?select=id,referral_id,subject_key&referral_id=in.(${referrer.body.referralId},${referred.body.referralId})`);
  refRows.forEach((row) => referralIdentityIds.add(row.id));
  const referredIdentityId = refRows.find((row) => row.subject_key === "QWERTYUI")?.id || "none";
  const attributionRows = await db(`referral_attributions?referred_identity_id=eq.${referredIdentityId}&select=id,referrer_identity_id`);
  if (attributionRows.length === 1) pass("Referral attribution DB"); else fail("Referral attribution DB", `count=${attributionRows.length}`);
  const duplicate = await referral(`${runId}-referred-device`, "QWERTYUI", referrer.body.referralId);
  if ((duplicate.response.status === 200 || duplicate.response.status === 409) && (await db(`referral_attributions?referred_identity_id=eq.${referredIdentityId}`)).length === 1) pass("Duplicate attribution"); else fail("Duplicate attribution", `status=${duplicate.response.status}`);
  const invalid = await referral(`${runId}-invalid-device`, "ASDFGHJK", "ZZZZZZZY");
  if (invalid.response.status === 400) pass("Invalid referral rejection"); else fail("Invalid referral rejection", invalid.response.status);
  const self = await referral(`${runId}-referrer-device`, "S3REF-A", referrer.body.referralId);
  if (self.response.status === 409) pass("Self-referral rejection"); else fail("Self-referral rejection", self.response.status);
  notTested("Referral URL UI lock", "Browser automation not invoked in this script");
  notTested("Manual referral UI", "Browser automation not invoked in this script");

  // B. Helper assignment and accept
  const helperA = await createHelper("A", 5); const helperB = await createHelper("B", 4);
  const request = await createRequest("QWERTYUI");
  const listAResponse = await fetch(`${base}/api/helper/assignments`, { headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const listA = await readResponse(listAResponse);
  const listB = await readResponse(await fetch(`${base}/api/helper/assignments`, { headers: { Authorization: `Bearer ${helperB.accessToken}` } }));
  if (request.response.status === 201 && request.body.status === "MATCHED" && listAResponse.status === 200 && listA.assignments?.length === 1) pass("Helper ACCEPT precondition"); else fail("Helper ACCEPT precondition", JSON.stringify({ request: request.response.status, match: request.body.status, own: listA.assignments?.length }));
  if ((listB.assignments || []).every((row) => row.requestId !== request.body.requestId)) pass("Cross-helper assignment isolation"); else fail("Cross-helper assignment isolation", "Helper B saw Helper A request");
  const acceptResponse = await fetch(`${base}/api/helper/assignments/${listA.assignments[0].assignmentId}/accept`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const acceptBody = await readResponse(acceptResponse);
  const acceptedRows = await db(`service_requests?id=eq.${request.body.requestId}&select=status`);
  if (acceptResponse.status === 200 && acceptBody.request_status === "ACCEPTED" && acceptedRows[0]?.status === "ACCEPTED") pass("Helper ACCEPT"); else fail("Helper ACCEPT", JSON.stringify({ status: acceptResponse.status, body: acceptBody, db: acceptedRows }));

  // C. Customer/helper chat
  const capabilityResponse = await fetch(`${base}/api/requests/capability`, { method: "POST", headers: { "Idempotency-Key": request.idempotencyKey } });
  const capability = await readResponse(capabilityResponse);
  const customerSend = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: request.body.requestId, capability: capability.capability, originalLanguage: "en", originalText: "S3E2E customer original" }) });
  const helperRead = await fetch(`${base}/api/chat?requestId=${request.body.requestId}`, { headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const helperSend = await fetch(`${base}/api/chat`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestId: request.body.requestId, originalLanguage: "ko", originalText: "S3E2E helper original" }) });
  const customerRead = await fetch(`${base}/api/chat?requestId=${request.body.requestId}&capability=${encodeURIComponent(capability.capability)}`);
  const customerReadBody = await readResponse(customerRead);
  const messages = await db(`messages?conversation_id=eq.${customerReadBody.conversation?.id}&select=original_text`);
  if (customerSend.status === 200 && helperRead.status === 200 && helperSend.status === 200 && customerRead.status === 200 && messages.some((row) => row.original_text === "S3E2E customer original") && messages.some((row) => row.original_text === "S3E2E helper original")) pass("Customer→Helper chat"); else fail("Customer→Helper chat", JSON.stringify({ customerSend: customerSend.status, helperRead: helperRead.status, helperSend: helperSend.status, customerRead: customerRead.status, messages }));
  const wrongCapability = await fetch(`${base}/api/chat?requestId=${request.body.requestId}&capability=invalid-token`);
  if (wrongCapability.status === 403) pass("Wrong customer capability rejection"); else fail("Wrong customer capability rejection", wrongCapability.status);
  if (!(await (await fetch(`${base}/api/helper/assignments`)).status === 401)) fail("Anonymous helper assignments", "not 401"); else pass("Anonymous helper assignments");

  // D/E/F/G lifecycle/admin/rewards require authenticated sys session; do not weaken auth.
  notTested("IN_PROGRESS", "Automated SYS HMAC login credentials are not available in staging env");
  notTested("COMPLETED", "Automated SYS HMAC login credentials are not available in staging env");
  notTested("PAYMENT_PENDING", "Automated SYS HMAC login credentials are not available in staging env");
  notTested("SETTLED", "Automated SYS HMAC login credentials are not available in staging env");
  notTested("Conversation deletion", "SETTLED transition not executed without SYS session");
  notTested("Reward qualification", "SETTLED transition not executed without SYS session");
  notTested("WLH/CLH/GLH", "Settlement fixtures require SYS lifecycle execution");
  notTested("Admin UI visibility", "Automated SYS HMAC login credentials are not available in staging env");
  notTested("Notifications", "Lifecycle/reward events not executed in this run");
} catch (error) {
  fail("E2E harness", error);
} finally {
  await cleanup();
}

const counts = Object.fromEntries(["PASS", "FAIL", "NOT_TESTED"].map((status) => [status, results.filter(([value]) => value === status).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
if (counts.FAIL > 0) process.exit(1);

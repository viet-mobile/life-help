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
    await db(`referral_rewards?qualifying_request_id=eq.${requestId}`, "DELETE").catch(() => {});
    await db(`admin_audit_logs?entity_id=eq.${requestId}`, "DELETE").catch(() => {});
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

  const assignmentId = listA.assignments[0].assignmentId;
  const invalidComplete = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  if (invalidComplete.status === 409) pass("Completion rejected before START"); else fail("Completion rejected before START", invalidComplete.status);
  const wrongHelperStart = await fetch(`${base}/api/helper/assignments/${assignmentId}/start`, { method: "POST", headers: { Authorization: `Bearer ${helperB.accessToken}` } });
  if (wrongHelperStart.status === 404) pass("Cross-helper START isolation"); else fail("Cross-helper START isolation", wrongHelperStart.status);
  const startResponse = await fetch(`${base}/api/helper/assignments/${assignmentId}/start`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const startBody = await readResponse(startResponse);
  const startedRows = await db(`service_requests?id=eq.${request.body.requestId}&select=status`);
  if (startResponse.status === 200 && startBody.status === "IN_PROGRESS" && startedRows[0]?.status === "IN_PROGRESS") pass("Helper START"); else fail("Helper START", JSON.stringify({ status: startResponse.status, body: startBody, db: startedRows }));

  const capabilityResponse = await fetch(`${base}/api/requests/capability`, { method: "POST", headers: { "Idempotency-Key": request.idempotencyKey } });
  const capability = await readResponse(capabilityResponse);
  const customerStatus = await fetch(`${base}/api/requests/status?requestId=${request.body.requestId}&capability=${encodeURIComponent(capability.capability)}`);
  const customerStatusBody = await readResponse(customerStatus);
  if (customerStatus.status === 200 && customerStatusBody.status === "IN_PROGRESS") pass("Customer live status authorization"); else fail("Customer live status authorization", JSON.stringify({ status: customerStatus.status, body: customerStatusBody }));

  const wrongHelperComplete = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${helperB.accessToken}` } });
  const anonComplete = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST" });
  const customerComplete = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${capability.capability}` } });
  const publicIdComplete = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${referred.body.referralId}` } });
  const stillInProgress = (await db(`service_requests?id=eq.${request.body.requestId}&select=status`))[0]?.status === "IN_PROGRESS" && (await db(`request_assignments?id=eq.${assignmentId}&select=status`))[0]?.status === "ACCEPTED";
  if (wrongHelperComplete.status === 404 && stillInProgress) pass("Wrong helper cannot complete"); else fail("Wrong helper cannot complete", wrongHelperComplete.status);
  if (anonComplete.status === 401 && customerComplete.status === 401 && publicIdComplete.status === 401 && stillInProgress) pass("Anonymous/customer/public-ID cannot complete"); else fail("Anonymous/customer/public-ID cannot complete", `${anonComplete.status}/${customerComplete.status}/${publicIdComplete.status}`);
  const completeResponse = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const completeBody = await readResponse(completeResponse);
  const completedRows = await db(`service_requests?id=eq.${request.body.requestId}&select=status`);
  if (completeResponse.status === 200 && completeBody.status === "COMPLETED" && completedRows[0]?.status === "COMPLETED") pass("Helper COMPLETE"); else fail("Helper COMPLETE", JSON.stringify({ status: completeResponse.status, body: completeBody, db: completedRows }));
  if (completedRows[0]?.status !== "SETTLED") pass("COMPLETED is not SETTLED"); else fail("COMPLETED is not SETTLED", "request auto-settled");
  const repeatedComplete = await fetch(`${base}/api/helper/assignments/${assignmentId}/complete`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const repeatedCompleteBody = await readResponse(repeatedComplete);
  if (repeatedComplete.status === 200 && repeatedCompleteBody.idempotent === true) pass("Duplicate COMPLETE idempotency"); else fail("Duplicate COMPLETE idempotency", JSON.stringify({ status: repeatedComplete.status, body: repeatedCompleteBody }));
  const assignmentAfterComplete = (await db(`request_assignments?id=eq.${assignmentId}&select=status,completed_at`))[0];
  if (assignmentAfterComplete?.status === "COMPLETED" && assignmentAfterComplete.completed_at) pass("Assignment COMPLETED with service COMPLETED"); else fail("Assignment COMPLETED with service COMPLETED", JSON.stringify(assignmentAfterComplete));
  // Helper release happens at service COMPLETED: A is not settled yet. Helper B goes off duty so
  // helper A (H) is the only compatible candidate for everything below.
  await db(`helpers?id=eq.${helperB.helper.id}`, "PATCH", { on_duty: false });
  try {
    const reuse = await createRequest("REUSEBBB");
    const reuseAssignment = (await db(`request_assignments?request_id=eq.${reuse.body.requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id`))[0];
    const aStillCompleted = (await db(`service_requests?id=eq.${request.body.requestId}&select=status`))[0]?.status === "COMPLETED";
    if (reuse.body.status === "MATCHED" && reuseAssignment?.helper_id === helperA.helper.id && aStillCompleted) pass("Helper reusable before SETTLED (rematched)"); else fail("Helper reusable before SETTLED (rematched)", JSON.stringify({ status: reuse.body.status, reuseAssignment, aStillCompleted }));
    // Finish the second job too, which frees H again through the same atomic path.
    const reuseAuth = { Authorization: `Bearer ${helperA.accessToken}` };
    const reuseSteps = [];
    for (const action of ["accept", "start", "complete"]) reuseSteps.push((await fetch(`${base}/api/helper/assignments/${reuseAssignment?.id}/${action}`, { method: "POST", headers: reuseAuth })).status);
    const reuseAssignmentAfter = (await db(`request_assignments?id=eq.${reuseAssignment?.id}&select=status`))[0]?.status;
    if (reuseSteps.every((code) => code === 200) && reuseAssignmentAfter === "COMPLETED") pass("Second job completed; helper released again"); else fail("Second job completed; helper released again", JSON.stringify({ reuseSteps, reuseAssignmentAfter }));

    // Real concurrent race on the staging database: two compatible requests, H the only candidate.
    const [raceB, raceC] = await Promise.all([createRequest("RACEBBBB"), createRequest("RACECCCC")]);
    const raceRows = await db(`request_assignments?request_id=in.(${raceB.body.requestId},${raceC.body.requestId})&select=request_id,helper_id,status`);
    const activeRace = raceRows.filter((row) => ["PENDING", "NOTIFIED", "ACCEPTED"].includes(row.status));
    const helperAActive = await db(`request_assignments?helper_id=eq.${helperA.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,request_id`);
    const statuses = [raceB.body.status, raceC.body.status].sort();
    if (statuses[0] === "MATCHED" && statuses[1] === "NO_HELPER_AVAILABLE" && activeRace.length === 1 && activeRace[0].helper_id === helperA.helper.id && helperAActive.length === 1) pass("Concurrent double assignment prevented"); else fail("Concurrent double assignment prevented", JSON.stringify({ statuses, raceRows, helperAActive }));
    const loser = raceB.body.status === "NO_HELPER_AVAILABLE" ? raceB : raceC;
    const loserEscalation = await db(`admin_escalations?request_id=eq.${loser.body.requestId}&select=reason,status,admin_notes`);
    if (loserEscalation.length === 1 && loserEscalation[0].reason === "NO_HELPER_AVAILABLE") pass("Race loser escalated as NO_HELPER_AVAILABLE"); else fail("Race loser escalated as NO_HELPER_AVAILABLE", JSON.stringify(loserEscalation));
  } finally {
    await db(`helpers?id=eq.${helperB.helper.id}`, "PATCH", { on_duty: true }).catch(() => {});
  }
  const requestARows = await db(`service_requests?id=eq.${request.body.requestId}&select=status`);
  const conversationAtComplete = await db(`conversations?request_id=eq.${request.body.requestId}&select=status,deletion_scheduled_at`);
  if (requestARows[0]?.status === "COMPLETED" && (await db(`referral_rewards?qualifying_request_id=eq.${request.body.requestId}&select=id`)).length === 0) pass("Helper release does not settle or reward"); else fail("Helper release does not settle or reward", JSON.stringify(requestARows));
  if (conversationAtComplete[0]?.status === "ACTIVE" && conversationAtComplete[0]?.deletion_scheduled_at === null) pass("COMPLETED does not schedule conversation cleanup"); else fail("COMPLETED does not schedule conversation cleanup", JSON.stringify(conversationAtComplete));

  // C. Customer/helper chat
  const customerSend = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: request.body.requestId, capability: capability.capability, originalLanguage: "en", originalText: "S3E2E customer original" }) });
  const helperRead = await fetch(`${base}/api/chat?requestId=${request.body.requestId}`, { headers: { Authorization: `Bearer ${helperA.accessToken}` } });
  const helperSend = await fetch(`${base}/api/chat`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestId: request.body.requestId, originalLanguage: "ko", originalText: "S3E2E helper original" }) });
  const customerRead = await fetch(`${base}/api/chat?requestId=${request.body.requestId}&capability=${encodeURIComponent(capability.capability)}`);
  const customerReadBody = await readResponse(customerRead);
  const messages = await db(`messages?conversation_id=eq.${customerReadBody.conversation?.id}&select=original_text`);
  if (customerSend.status === 200 && helperRead.status === 200 && helperSend.status === 200 && customerRead.status === 200 && messages.some((row) => row.original_text === "S3E2E customer original") && messages.some((row) => row.original_text === "S3E2E helper original")) pass("Customer→Helper chat"); else fail("Customer→Helper chat", JSON.stringify({ customerSend: customerSend.status, helperRead: helperRead.status, helperSend: helperSend.status, customerRead: customerRead.status, messages }));
  if (customerReadBody.contentDeleted !== true && (customerReadBody.messages || []).length === 2) pass("Chat intact after service COMPLETED"); else fail("Chat intact after service COMPLETED", JSON.stringify(customerReadBody).slice(0, 200));
  const wrongCapability = await fetch(`${base}/api/chat?requestId=${request.body.requestId}&capability=invalid-token`);
  if (wrongCapability.status === 403) pass("Wrong customer capability rejection"); else fail("Wrong customer capability rejection", wrongCapability.status);
  if (!(await (await fetch(`${base}/api/helper/assignments`)).status === 401)) fail("Anonymous helper assignments", "not 401"); else pass("Anonymous helper assignments");

  // D. Settlement lifecycle: COMPLETED → PAYMENT_PENDING → SETTLED → cleanup → CLOSED (platform authority only)
  const requestId = request.body.requestId;
  const conversationId = customerReadBody.conversation?.id;
  const sysStatus = (status, headers = {}) => fetch(`${base}/api/sys/requests/${requestId}/status`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ status }) });
  const statusOf = async () => (await db(`service_requests?id=eq.${requestId}&select=status`))[0]?.status;
  const rewardsOf = () => db(`referral_rewards?qualifying_request_id=eq.${requestId}&select=id,state,tier,referrer_identity_id,reward_amount_krw`);
  const auditsOf = (action) => db(`admin_audit_logs?entity_id=eq.${requestId}&action=eq.${action}&select=id,metadata`);
  if (!settlementToken) throw new Error("TEST_LIFE_HELP_SETTLEMENT_TOKEN is required for settlement E2E");

  const helperSettle = await sysStatus("SETTLED", { Authorization: `Bearer ${helperA.accessToken}` });
  const helperPending = await sysStatus("PAYMENT_PENDING", { Authorization: `Bearer ${helperA.accessToken}` });
  if (helperSettle.status === 401 && helperPending.status === 401 && (await statusOf()) === "COMPLETED") pass("Helper cannot settle"); else fail("Helper cannot settle", `${helperSettle.status}/${helperPending.status}`);
  const customerSettle = await fetch(`${base}/api/sys/requests/${requestId}/status?capability=${encodeURIComponent(capability.capability)}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${capability.capability}` }, body: JSON.stringify({ status: "SETTLED", capability: capability.capability }) });
  if (customerSettle.status === 401 && (await statusOf()) === "COMPLETED") pass("Customer capability cannot settle"); else fail("Customer capability cannot settle", customerSettle.status);
  const publicIdSettle = await sysStatus("SETTLED", { Authorization: `Bearer ${referred.body.referralId}` });
  if (publicIdSettle.status === 401) pass("Public LIFE.HELP ID cannot settle"); else fail("Public LIFE.HELP ID cannot settle", publicIdSettle.status);
  const wrongToken = await sysStatus("SETTLED", { Authorization: `Bearer ${settlementToken.slice(0, -2)}xx` });
  const forgedCookie = await sysStatus("SETTLED", { Cookie: `life_help_sys_session=${encodeURIComponent(`admin|${Date.now() + 60000}|${"0".repeat(64)}`)}` });
  if (wrongToken.status === 401 && forgedCookie.status === 401 && (await statusOf()) === "COMPLETED") pass("Wrong platform authority cannot settle"); else fail("Wrong platform authority cannot settle", `${wrongToken.status}/${forgedCookie.status}`);

  const platform = { Authorization: `Bearer ${settlementToken}` };
  const skipAhead = await sysStatus("SETTLED", platform);
  if (skipAhead.status === 409 && (await statusOf()) === "COMPLETED" && (await rewardsOf()).length === 0) pass("COMPLETED cannot jump to SETTLED"); else fail("COMPLETED cannot jump to SETTLED", skipAhead.status);

  const pendingResponse = await sysStatus("PAYMENT_PENDING", platform);
  const pendingBody = await readResponse(pendingResponse);
  if (pendingResponse.status === 200 && pendingBody.status === "PAYMENT_PENDING" && (await statusOf()) === "PAYMENT_PENDING") pass("COMPLETED → PAYMENT_PENDING"); else fail("COMPLETED → PAYMENT_PENDING", JSON.stringify({ status: pendingResponse.status, body: pendingBody }));
  const pendingAgain = await readResponse(await sysStatus("PAYMENT_PENDING", platform));
  if (pendingAgain.idempotent === true) pass("Duplicate PAYMENT_PENDING idempotency"); else fail("Duplicate PAYMENT_PENDING idempotency", JSON.stringify(pendingAgain));
  const customerPending = await readResponse(await fetch(`${base}/api/requests/status?requestId=${requestId}&capability=${encodeURIComponent(capability.capability)}`));
  if (customerPending.status === "PAYMENT_PENDING") pass("Customer sees PAYMENT_PENDING"); else fail("Customer sees PAYMENT_PENDING", JSON.stringify(customerPending));
  const pendingAudit = await auditsOf("SERVICE_PAYMENT_PENDING");
  if ((await rewardsOf()).length === 0 && (await db(`messages?conversation_id=eq.${conversationId}&select=id`)).length === 2 && pendingAudit[0]?.metadata?.external_payment_verified === false) pass("PAYMENT_PENDING has no reward/cleanup/fake payment"); else fail("PAYMENT_PENDING has no reward/cleanup/fake payment", JSON.stringify(pendingAudit));

  const settleResponse = await sysStatus("SETTLED", platform);
  const settleBody = await readResponse(settleResponse);
  if (settleResponse.status === 200 && settleBody.idempotent === false && settleBody.externalPaymentVerified === false && settleBody.settlementMethod === "INTERNAL_PLATFORM_CONFIRMATION") pass("PAYMENT_PENDING → SETTLED"); else fail("PAYMENT_PENDING → SETTLED", JSON.stringify({ status: settleResponse.status, body: settleBody }));
  const settledAudit = await auditsOf("SERVICE_SETTLED");
  if (settledAudit.length === 1 && settledAudit[0].metadata?.external_payment_transaction_id === null && settledAudit[0].metadata?.external_payment_verified === false) pass("Settlement audit truthful (no PSP id)"); else fail("Settlement audit truthful (no PSP id)", JSON.stringify(settledAudit));
  if (settleBody.cleanupScheduled === 1) pass("SETTLED schedules cleanup"); else fail("SETTLED schedules cleanup", JSON.stringify(settleBody));
  const conversationRows = await db(`conversations?id=eq.${conversationId}&select=id,status,deletion_scheduled_at`);
  const remainingMessages = await db(`messages?conversation_id=eq.${conversationId}&select=id`);
  if (settleBody.cleanup?.processed === 1 && settleBody.cleanup?.messagesDeleted === 2 && remainingMessages.length === 0 && conversationRows[0]?.status === "DELETED") pass("Conversation cleanup executed"); else fail("Conversation cleanup executed", JSON.stringify({ cleanup: settleBody.cleanup, remainingMessages: remainingMessages.length, conversationRows }));
  if (settleBody.status === "CLOSED" && (await statusOf()) === "CLOSED") pass("SETTLED → CLOSED after cleanup"); else fail("SETTLED → CLOSED after cleanup", JSON.stringify({ body: settleBody.status, db: await statusOf() }));
  const rewards = await rewardsOf();
  const referrerIdentityId = refRows.find((row) => row.referral_id === referrer.body.referralId)?.id;
  if (rewards.length === 1 && rewards[0].state === "QUALIFIED" && rewards[0].referrer_identity_id === referrerIdentityId && rewards[0].tier === "WLH" && rewards[0].reward_amount_krw === 1000) pass("Reward qualified at settlement boundary (WLH)"); else fail("Reward qualified at settlement boundary (WLH)", JSON.stringify(rewards));

  const settleAgain = await sysStatus("SETTLED", platform);
  const settleAgainBody = await readResponse(settleAgain);
  if (settleAgain.status === 200 && settleAgainBody.idempotent === true && settleAgainBody.cleanupScheduled === 0 && (await rewardsOf()).length === 1 && (await auditsOf("SERVICE_SETTLED")).length === 1 && (await auditsOf("CONVERSATION_CONTENT_DELETED")).length === 1) pass("Duplicate SETTLED idempotency"); else fail("Duplicate SETTLED idempotency", JSON.stringify(settleAgainBody));
  const closeAgain = await readResponse(await sysStatus("CLOSED", platform));
  if (closeAgain.idempotent === true && closeAgain.status === "CLOSED") pass("Duplicate CLOSED idempotency"); else fail("Duplicate CLOSED idempotency", JSON.stringify(closeAgain));

  const customerAfter = await readResponse(await fetch(`${base}/api/chat?requestId=${requestId}&capability=${encodeURIComponent(capability.capability)}`));
  const customerPostAfter = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, capability: capability.capability, originalLanguage: "en", originalText: "after settlement" }) });
  const helperPostAfter = await fetch(`${base}/api/chat`, { method: "POST", headers: { Authorization: `Bearer ${helperA.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestId, originalLanguage: "ko", originalText: "after settlement" }) });
  if (customerAfter.contentDeleted === true && customerAfter.messages?.length === 0 && customerPostAfter.status === 409 && helperPostAfter.status === 409 && (await db(`messages?conversation_id=eq.${conversationId}&select=id`)).length === 0) pass("Chat closed after settlement"); else fail("Chat closed after settlement", JSON.stringify({ customerAfter, customerPost: customerPostAfter.status, helperPost: helperPostAfter.status }));

  const keptRequest = await db(`service_requests?id=eq.${requestId}&select=id`);
  const keptAssignment = await db(`request_assignments?request_id=eq.${requestId}&select=id`);
  const keptAudits = await db(`admin_audit_logs?entity_id=eq.${requestId}&select=action,metadata`);
  if (keptRequest.length === 1 && keptAssignment.length >= 1 && conversationRows.length === 1 && (await rewardsOf()).length === 1 && ["SERVICE_PAYMENT_PENDING", "SERVICE_SETTLED", "CONVERSATION_CONTENT_DELETED", "SERVICE_CLOSED"].every((action) => keptAudits.some((row) => row.action === action)) && !JSON.stringify(keptAudits).includes("S3E2E")) pass("Legal/audit records preserved"); else fail("Legal/audit records preserved", JSON.stringify({ keptRequest, keptAssignment, keptAudits }));

  const historicalAssignment = (await db(`request_assignments?id=eq.${assignmentId}&select=status`))[0];
  if (historicalAssignment?.status === "COMPLETED") pass("Completed assignment retained after CLOSED"); else fail("Completed assignment retained after CLOSED", JSON.stringify(historicalAssignment));
  const cleanupAnon = await fetch(`${base}/api/sys/cleanup/conversations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const cleanupRun = await fetch(`${base}/api/sys/cleanup/conversations`, { method: "POST", headers: { "Content-Type": "application/json", ...platform }, body: JSON.stringify({ requestId }) });
  const cleanupRunBody = await readResponse(cleanupRun);
  if (cleanupAnon.status === 401 && cleanupRun.status === 200 && cleanupRunBody.processed === 0) pass("Cleanup runner authorized + idempotent"); else fail("Cleanup runner authorized + idempotent", JSON.stringify({ anon: cleanupAnon.status, run: cleanupRun.status, cleanupRunBody }));

  const notifications = await db(`app_notifications?payload->>request_id=eq.${requestId}&select=type,recipient_id,payload`);
  if (["PAYMENT_PENDING", "SETTLED", "CLOSED"].every((status) => notifications.some((row) => row.type === "SERVICE_STATUS_CHANGED" && row.payload?.status === status)) && notifications.some((row) => row.type === "REFERRAL_REWARD_CONFIRMED" && row.recipient_id === "S3REF-A")) pass("Lifecycle notifications recorded (in-app only)"); else fail("Lifecycle notifications recorded (in-app only)", JSON.stringify(notifications));

  notTested("CLH/GLH staging tiers", "Covered deterministically in test_settlement_lifecycle.mjs; staging run exercises WLH");
  notTested("Admin UI visibility", "SYS admin secrets are not configured on the staging Worker");
  notTested("Push delivery", "Push provider not connected; notifications are in-app records only");
} catch (error) {
  fail("E2E harness", error);
} finally {
  await cleanup();
}

const counts = Object.fromEntries(["PASS", "FAIL", "NOT_TESTED"].map((status) => [status, results.filter(([value]) => value === status).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
if (counts.FAIL > 0) process.exit(1);

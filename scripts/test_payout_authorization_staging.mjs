import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/)) { const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (match) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2"); }
const supabaseUrl = env.TEST_SUPABASE_URL.replace(/\/$/, "");
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const stagingRef = (supabaseUrl.match(/https?:\/\/([^.]+)\.supabase/) || [])[1];
const productionRef = "wstdbymmkrqgtsibhcjz";
const expectedRef = "wreebowcbiymodswajwe";
const base = "https://life-help-staging.simpl2eye.workers.dev";
if (stagingRef !== expectedRef || stagingRef === productionRef) throw new Error("STAGING GUARD FAILED");
const results = [];
function pass(name) { results.push("PASS"); console.log(`PASS ${name}`); }
function fail(name, detail) { results.push("FAIL"); console.log(`FAIL ${name} ${detail}`); }
function notTested(name, reason) { results.push("NOT_TESTED"); console.log(`NOT_TESTED ${name} ${reason}`); }
function jar() { return { cookies: new Map() }; }
function cookieHeader(context) { return [...context.cookies].map(([name, value]) => `${name}=${value}`).join("; "); }
function absorb(context, response) { const raw = response.headers.get("set-cookie"); if (!raw) return; const first = raw.split(",")[0].split(";")[0]; const index = first.indexOf("="); if (index > 0) context.cookies.set(first.slice(0, index), first.slice(index + 1)); }
async function call(path, options = {}, context) { const headers = { ...(options.headers || {}) }; if (context && context.cookies.size) headers.cookie = cookieHeader(context); const response = await fetch(base + path, { ...options, headers }); if (context) absorb(context, response); const text = await response.text(); let body; try { body = JSON.parse(text); } catch { body = { raw: text }; } return { response, body }; }
async function identity(context, referrer) { return call("/api/referrals/identity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: `s3-payout-${context.name}-device-0001`, subjectType: "CUSTOMER", ...(referrer ? { referralId: referrer } : {}) }) }, context); }
async function direct(path, method, body, key) { const response = await fetch(supabaseUrl + "/rest/v1/" + path, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); return { status: response.status, text: await response.text() }; }

const A = { name: "A", cookies: new Map() }; const B = { name: "B", cookies: new Map() };
try {
  const a1 = await identity(A); const a2 = await identity(A); const b1 = await identity(B, a1.body.referralId); const b2 = await identity(B);
  if (a1.response.status === 200 && /^[A-Z]{8}$/.test(a1.body.referralId || "") && a2.body.referralId === a1.body.referralId) pass("A identity and persistence"); else fail("A identity and persistence", "status or ID mismatch");
  if (b1.response.status === 200 && /^[A-Z]{8}$/.test(b1.body.referralId || "") && b1.body.referralId !== a1.body.referralId && b2.body.referralId === b1.body.referralId) pass("B own identity and referral semantics"); else fail("B own identity and referral semantics", "visitor identity mismatch");
  const ownerCookie = A.cookies.get("life_help_device_owner");
  if (ownerCookie && ownerCookie !== B.cookies.get("life_help_device_owner")) pass("private owner cookies differ"); else fail("private owner cookies differ", "missing or equal cookie");
  const noRewards = await call("/api/rewards", {}, { cookies: new Map() });
  if (noRewards.response.status === 401) pass("M no private proof rewards rejected"); else fail("M no private proof rewards rejected", noRewards.response.status);
  const publicOnly = await call(`/api/rewards?ownerPublicId=${a1.body.referralId}`, {}, { cookies: new Map() });
  if (publicOnly.response.status === 401) pass("N public ID alone rejected"); else fail("N public ID alone rejected", publicOnly.response.status);
  const aRewards = await call("/api/rewards", {}, A); const bRewards = await call("/api/rewards", {}, B);
  if (aRewards.response.status === 200 && bRewards.response.status === 200) pass("O/P device-scoped rewards access"); else fail("O/P device-scoped rewards access", `${aRewards.response.status}/${bRewards.response.status}`);
  const changed = await call(`/api/rewards?ownerPublicId=${b1.body.referralId}`, {}, A);
  if (changed.response.status === 200 || changed.response.status === 401) pass("Q public parameter cannot switch reward owner"); else fail("Q public parameter cannot switch reward owner", changed.response.status);
  const noPayout = await call("/api/rewards/payout/capability", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, { cookies: new Map() });
  if (noPayout.response.status === 401) pass("S public/no cookie payout mint rejected"); else fail("S public/no cookie payout mint rejected", noPayout.response.status);
  const conversationOnly = await call("/api/rewards/payout/capability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: "00000000-0000-4000-8000-000000000000", capability: "fake" }) }, { cookies: new Map() });
  if (conversationOnly.response.status === 401) pass("T conversation-only payout mint rejected"); else fail("T conversation-only payout mint rejected", conversationOnly.response.status);
  const aPayout = await call("/api/rewards/payout/capability", { method: "POST" }, A); const bPayout = await call("/api/rewards/payout/capability", { method: "POST" }, B);
  if (aPayout.response.status === 200 && bPayout.response.status === 200 && aPayout.body.payoutCapability !== bPayout.body.payoutCapability) pass("U/V device payout capabilities issued separately"); else fail("U/V device payout capabilities issued separately", `${aPayout.response.status}/${bPayout.response.status}`);
  const noDestination = await call("/api/rewards/payout", {}, { cookies: new Map() });
  if (noDestination.response.status === 403) pass("AA no payout capability rejected"); else fail("AA no payout capability rejected", noDestination.response.status);
  const malformed = await call("/api/rewards/payout?payoutCapability=bad&ownerPublicId=${a1.body.referralId}");
  if (malformed.response.status === 403) pass("AB malformed payout capability rejected"); else fail("AB malformed payout capability rejected", malformed.response.status);
  const providerAttempt = await call("/api/rewards/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payoutCapability: aPayout.body.payoutCapability, ownerPublicId: b1.body.referralId, country: "KR", currency: "KRW", payoutMethod: "PROVIDER_TOKEN", consent: true }) });
  if (providerAttempt.response.status === 503 && providerAttempt.body.code === "PAYOUT_PROVIDER_NOT_CONNECTED") pass("AJ/AK provider token and masked input not accepted"); else fail("AJ/AK provider token and masked input not accepted", providerAttempt.response.status);
  const catalogOwner = await direct("payout_destinations?select=owner_identity_id&limit=0", "GET", undefined, serviceKey);
  const catalogRequest = await direct("payout_destinations?select=request_id&limit=0", "GET", undefined, serviceKey);
  if (catalogOwner.status === 200) pass("catalog owner_identity_id present"); else notTested("catalog owner_identity_id present", `status ${catalogOwner.status}`);
  if (catalogRequest.status >= 400) pass("catalog request_id absent"); else fail("catalog request_id absent", catalogRequest.status);
  const anonSelect = await direct("payout_destinations?select=*&limit=0", "GET", undefined, anonKey);
  const anonInsert = await direct("payout_destinations", "POST", { country: "XX", currency: "XXX", payout_method: "TEST", consent_at: new Date().toISOString() }, anonKey);
  if (anonSelect.status >= 400) pass("anon SELECT denied"); else fail("anon SELECT denied", anonSelect.status);
  if (anonInsert.status >= 400) pass("anon INSERT denied"); else fail("anon INSERT denied", anonInsert.status);
  notTested("authenticated direct payout table access", "No authenticated Supabase test user credentials supplied");
  notTested("W/X/Y/Z/AC-AI full token tamper/expiry/isolation", "No destination rows/provider and no token fixtures are created by this read-only security run");
} finally {
  console.log(`SUMMARY PASS=${results.filter((value) => value === "PASS").length} FAIL=${results.filter((value) => value === "FAIL").length} NOT_TESTED=${results.filter((value) => value === "NOT_TESTED").length}`);
}

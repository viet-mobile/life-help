// Live STAGING Web Push E2E.
//
// Real delivery paths (nothing mocked):
//   * Mozilla autopush: a Node client registers a real channel on push.services.mozilla.com
//     (the protocol Firefox uses); the Worker encrypts + VAPID-signs, Mozilla delivers, and this
//     script decrypts with keys only it holds.
//   * Chrome: a temporary-profile Chrome (DevTools protocol) registers the staging service worker,
//     subscribes through the real UI button after a trusted click, and receives FCM pushes; the
//     displayed notifications are read back from the service worker.
//
// Usage: node scripts/test_web_push_staging.mjs            (headless Chrome)
//        node scripts/test_web_push_staging.mjs --headed   (visible Chrome window)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const env = {};
for (const line of fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
}
const supabaseUrl = env.TEST_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const settlementToken = env.TEST_LIFE_HELP_SETTLEMENT_TOKEN;
const vapidPublicKey = env.TEST_LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY;
const stagingRef = (supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase/) || [])[1];
const base = "https://life-help-staging.simpl2eye.workers.dev";
const origin = new URL(base).origin;
const runId = `WP${Date.now()}`;
const headed = process.argv.includes("--headed");
if (stagingRef !== "wreebowcbiymodswajwe" || stagingRef === "wstdbymmkrqgtsibhcjz") throw new Error(`STAGING GUARD FAILED: ${stagingRef || "missing"}`);
if (!serviceKey || !settlementToken || !vapidPublicKey) throw new Error("staging service key, settlement token and VAPID public key are required");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
function record(status, name, detail = "") { results.push([status, name]); console.log(`${status} ${name}${detail ? ` ${detail}` : ""}`); }
const expect = (name, condition, detail) => record(condition ? "PASS" : "FAIL", name, condition ? "" : (typeof detail === "string" ? detail : JSON.stringify(detail ?? "")).slice(0, 400));
const notTestable = (name, reason) => record("NOT_TESTABLE", name, reason);

const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
async function readResponse(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { raw: text.slice(0, 200) }; } }
async function db(pathname, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...dbHeaders, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`${method} ${pathname.split("?")[0]} ${response.status} ${value?.message || value?.code || ""}`);
  return value;
}
async function authAdmin(pathname, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${pathname}`, { method, headers: dbHeaders, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`auth ${method} ${response.status}`);
  return value;
}
const letters = (n) => Array.from(crypto.randomBytes(n), (b) => String.fromCharCode(65 + (b % 26))).join("");
async function waitFor(fn, timeoutMs = 30000, interval = 1000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) { const value = await fn().catch(() => null); if (value) return value; if (Date.now() > deadline) return null; await sleep(interval); }
}

const created = { requestIds: new Set(), helperIds: new Set(), authUserIds: new Set(), identityIds: new Set(), subjectKeys: new Set(), helperPublicIds: new Set() };
const sido = `WP-${runId}`;

async function createHelper(label, locale, onDuty) {
  const email = `${label.toLowerCase()}.${runId.toLowerCase()}@example.test`, password = `WP-${crypto.randomUUID()}!`;
  const user = await authAdmin("users", "POST", { email, password, email_confirm: true });
  created.authUserIds.add(user.id);
  const helper = (await db("helpers", "POST", { auth_user_id: user.id, helper_id: `HLP-${runId}-${label}`, name: `WP TEST ${label}`, email, country: "KR", sido, gungu: "G1", primary_locale: locale, spoken_locales: [locale], on_duty: onDuty, is_active: true, rating: 5, completed_jobs: 0 }))[0];
  created.helperIds.add(helper.id);
  created.helperPublicIds.add(helper.helper_id);
  await db("helper_services", "POST", { helper_id: helper.id, service_slug: "boiler" });
  await db("helper_regions", "POST", { helper_id: helper.id, country: "KR", sido, gungu: "G1" });
  const session = await readResponse(await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: serviceKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
  return { helper, token: session.access_token, auth: { Authorization: `Bearer ${session.access_token}` } };
}

/** Real device identity + HttpOnly owner cookie, exactly as the customer pages obtain it. */
async function customerDevice(subjectKey) {
  const response = await fetch(`${base}/api/referrals/identity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: `${runId}-device-${subjectKey}`, subjectType: "CUSTOMER", subjectKey }) });
  const body = await readResponse(response);
  const cookie = (response.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).find((c) => c.startsWith("life_help_device_owner="));
  const identity = (await db(`referral_identities?subject_key=eq.${subjectKey}&subject_type=eq.CUSTOMER&select=id,referral_id`))[0];
  created.subjectKeys.add(subjectKey);
  if (identity) created.identityIds.add(identity.id);
  return { publicId: body.referralId, cookie, identityId: identity?.id, subjectKey };
}

async function createRequest(customerId, locale = "en") {
  const idempotencyKey = crypto.randomUUID();
  const response = await fetch(`${base}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ service_slug: "boiler", customer_id: customerId, customer_locale: locale, country: "KR", sido, gungu: "G1", dong: "D1", address: `${runId} address`, description: `${runId} request`, selected_options: ["test"] }) });
  const body = await readResponse(response);
  if (body.requestId) created.requestIds.add(body.requestId);
  const capability = body.requestId ? (await readResponse(await fetch(`${base}/api/requests/capability`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey } }))).capability : null;
  return { status: response.status, body, capability };
}

const subscribe = (audience, subscription, headers = {}, extra = {}, query = "") => fetch(`${base}/api/push/subscription${query}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ audience, subscription, ...extra }) });
const unsubscribe = (audience, endpoint, headers = {}) => fetch(`${base}/api/push/subscription`, { method: "DELETE", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ audience, endpoint }) });
const subsByEndpoint = (endpoint) => db(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=id,owner_type,helper_id,customer_identity_id,status,failure_count,last_failure_status,last_success_at,invalidated_at`);

// ---------- Mozilla autopush client (real push service) ----------
class Autopush {
  constructor() { this.messages = []; this.waiters = []; this.pendingRegs = new Map(); this.channels = new Map(); }
  async connect() {
    this.ws = new WebSocket("wss://push.services.mozilla.com/");
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve); this.ws.addEventListener("error", reject); });
    this.ws.addEventListener("message", (event) => this.onMessage(JSON.parse(event.data)));
    const hello = new Promise((resolve) => (this.onHello = resolve));
    this.send({ messageType: "hello", use_webpush: true });
    await hello;
  }
  send(message) { this.ws.send(JSON.stringify(message)); }
  onMessage(message) {
    if (message.messageType === "hello") this.onHello(message);
    else if (message.messageType === "register") this.pendingRegs.get(message.channelID)?.(message);
    else if (message.messageType === "notification") {
      this.send({ messageType: "ack", updates: [{ channelID: message.channelID, version: message.version, code: 100 }] });
      this.messages.push(message);
      this.waiters = this.waiters.filter((waiter) => !waiter(message));
    }
  }
  async register() {
    const channelID = crypto.randomUUID();
    const reply = new Promise((resolve) => this.pendingRegs.set(channelID, resolve));
    this.send({ messageType: "register", channelID, key: vapidPublicKey });
    const message = await reply;
    const ecdh = crypto.createECDH("prime256v1"); ecdh.generateKeys();
    const auth = crypto.randomBytes(16);
    const channel = { channelID, endpoint: message.pushEndpoint, ecdh, auth, subscription: { endpoint: message.pushEndpoint, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } } };
    this.channels.set(channelID, channel);
    return channel;
  }
  unregister(channel) { this.send({ messageType: "unregister", channelID: channel.channelID }); }
  decrypt(channel, message) {
    const body = Buffer.from(message.data, "base64url");
    const salt = body.subarray(0, 16), idlen = body[20], asPublic = body.subarray(21, 21 + idlen), ciphertext = body.subarray(21 + idlen);
    const ikm = Buffer.from(crypto.hkdfSync("sha256", channel.ecdh.computeSecret(asPublic), channel.auth, Buffer.concat([Buffer.from("WebPush: info\0"), channel.ecdh.getPublicKey(), asPublic]), 32));
    const cek = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
    const nonce = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
    const decipher = crypto.createDecipheriv("aes-128-gcm", cek, nonce);
    decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
    const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
    return JSON.parse(plain.subarray(0, plain.length - 1).toString("utf8"));
  }
  next(channel, predicate = () => true, timeoutMs = 45000) {
    const already = this.messages.find((m) => m.channelID === channel.channelID && !m.consumed && predicate(this.decrypt(channel, m)));
    if (already) { already.consumed = true; return Promise.resolve(this.decrypt(channel, already)); }
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      this.waiters.push((message) => {
        if (message.channelID !== channel.channelID) return false;
        const payload = this.decrypt(channel, message);
        if (!predicate(payload)) return false;
        message.consumed = true; clearTimeout(timer); resolve(payload); return true;
      });
    });
  }
  close() { try { this.ws.close(); } catch { /* closed */ } }
}

const PAYLOAD_KEYS = "audience,body,tag,title,type,url,v";
const minimal = (payload, secrets) => payload && Object.keys(payload).sort().join() === PAYLOAD_KEYS && !secrets.some((secret) => secret && JSON.stringify(payload).includes(secret));

// ---------- Chrome via DevTools protocol ----------
async function launchChrome() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lh-push-chrome-"));
  const port = 9400 + Math.floor(Math.random() * 400);
  const exe = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
  if (!exe) return null;
  const proc = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--window-size=1200,900", ...(headed ? [] : ["--headless=new"]), "about:blank"], { stdio: "ignore" });
  let version = null;
  for (let i = 0; i < 75 && !version; i += 1) { await sleep(200); version = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()).catch(() => null); }
  if (!version) { proc.kill(); return null; }
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let seq = 0; const pending = new Map();
  ws.addEventListener("message", (event) => { const m = JSON.parse(event.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const cdp = (method, params = {}, sessionId) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  const { result: { targetId } } = await cdp("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  await cdp("Page.enable", {}, sessionId);
  const evaluate = async (expression, session = sessionId) => (await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, session)).result?.result?.value;
  const close = async () => { try { ws.close(); } catch { /* closed */ } proc.kill(); await sleep(800); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* locked */ } };
  return { cdp, sessionId, evaluate, close };
}

/** Trusted click (real input event, so it carries user activation) on a data-testid element. */
async function trustedClick(browser, testId) {
  const box = await browser.evaluate(`(() => { const el = document.querySelector('[data-testid="${testId}"]'); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) return false;
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await browser.cdp("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: type === "mouseMoved" ? "none" : "left", clickCount: 1 }, browser.sessionId);
  return true;
}

async function serviceWorkerSession(browser) {
  const { result } = await browser.cdp("Target.getTargets");
  const target = result.targetInfos.find((t) => t.type === "service_worker" && t.url.startsWith(`${origin}/sw.js`));
  if (!target) return null;
  return (await browser.cdp("Target.attachToTarget", { targetId: target.targetId, flatten: true })).result.sessionId;
}

// ======================================================================================
const autopush = new Autopush();
let browser = null;
try {
  // ---------- config ----------
  const configResponse = await fetch(`${base}/api/push/config`);
  const config = await readResponse(configResponse);
  expect("Config endpoint returns only enabled + public key", configResponse.status === 200 && config.enabled === true && config.publicKey === vapidPublicKey && Object.keys(config).sort().join() === "enabled,publicKey", config);

  // ---------- fixtures ----------
  const h1 = await createHelper("H1", "ko", true);
  const h2 = await createHelper("H2", "en", false);
  const custA = await customerDevice(letters(8));
  const custB = await customerDevice(letters(8));
  expect("Fixtures: helpers + customer device cookies", h1.token && h2.token && custA.cookie && custB.cookie && custA.identityId && custB.identityId, { a: !!custA.cookie, b: !!custB.cookie });
  await autopush.connect();
  const helperCh = await autopush.register(), helperDeadCh = await autopush.register(), customerCh = await autopush.register(), customerCh2 = await autopush.register();
  expect("Real push service channels registered (Mozilla autopush)", [helperCh, helperDeadCh, customerCh, customerCh2].every((c) => c.endpoint?.startsWith("https://updates.push.services.mozilla.com/")));

  // ---------- customer ownership security ----------
  const cookieA = { Cookie: custA.cookie }, cookieB = { Cookie: custB.cookie };
  const noCookie = await subscribe("customer", customerCh.subscription);
  const publicIdBearer = await subscribe("customer", customerCh.subscription, { Authorization: `Bearer ${custA.publicId}` });
  const publicIdBody = await subscribe("customer", customerCh.subscription, {}, { referralId: custA.publicId, customerId: custA.subjectKey });
  const refQuery = await subscribe("customer", customerCh.subscription, {}, {}, `?ref=${custA.publicId}`);
  const forged = await subscribe("customer", customerCh.subscription, { Cookie: "life_help_device_owner=eyJkZXZpY2VIYXNoIjoiYSJ9.forged" });
  expect("Customer subscribe without device cookie blocked", noCookie.status === 401, noCookie.status);
  expect("Public 8-letter ID alone cannot subscribe (bearer/body)", publicIdBearer.status === 401 && publicIdBody.status === 401, [publicIdBearer.status, publicIdBody.status]);
  expect("?ref= cannot subscribe", refQuery.status === 401, refQuery.status);
  expect("Forged device cookie blocked", forged.status === 401, forged.status);
  expect("Blocked customer attempts wrote nothing", (await subsByEndpoint(customerCh.endpoint)).length === 0);
  const hijack = await subscribe("customer", customerCh.subscription, cookieA, { referralId: custB.publicId, customerIdentityId: custB.identityId }, `?ref=${custB.publicId}`);
  const ownedA = await subsByEndpoint(customerCh.endpoint);
  expect("Customer owner comes from the device cookie only (B's public ID / ?ref= ignored)", hijack.status === 200 && ownedA.length === 1 && ownedA[0].owner_type === "CUSTOMER" && ownedA[0].customer_identity_id === custA.identityId, { status: hijack.status, ownedA });
  const hijackBody = await readResponse(hijack);
  expect("Subscribe response exposes no endpoint/keys/ids", !JSON.stringify(hijackBody).match(/mozilla|p256dh|auth"|subscription_id|identity/i), hijackBody);
  const again = await readResponse(await subscribe("customer", customerCh.subscription, cookieA));
  expect("Customer re-subscribe idempotent", again.created === false && (await subsByEndpoint(customerCh.endpoint)).length === 1, again);
  const crossDelete = await readResponse(await unsubscribe("customer", customerCh.endpoint, cookieB));
  expect("Device B cannot unsubscribe device A", crossDelete.revoked === 0 && (await subsByEndpoint(customerCh.endpoint))[0].status === "ACTIVE", crossDelete);
  const anonDelete = await unsubscribe("customer", customerCh.endpoint, { Authorization: `Bearer ${custA.publicId}` });
  expect("Public ID cannot unsubscribe", anonDelete.status === 401 && (await subsByEndpoint(customerCh.endpoint))[0].status === "ACTIVE", anonDelete.status);
  const ssrf = await subscribe("customer", { endpoint: "https://evil.example/collect", keys: customerCh.subscription.keys }, cookieA);
  const httpEndpoint = await subscribe("customer", { endpoint: "http://updates.push.services.mozilla.com/x", keys: customerCh.subscription.keys }, cookieA);
  expect("Non-push / non-https endpoints rejected", ssrf.status === 400 && httpEndpoint.status === 400, [ssrf.status, httpEndpoint.status]);

  // ---------- helper ownership security ----------
  const hAnon = await subscribe("helper", helperCh.subscription);
  const hCookie = await subscribe("helper", helperCh.subscription, cookieA);
  const hPublic = await subscribe("helper", helperCh.subscription, { Authorization: `Bearer ${custA.publicId}` });
  expect("Anonymous / customer cookie / public ID cannot manage helper subscriptions", hAnon.status === 401 && hCookie.status === 401 && hPublic.status === 401, [hAnon.status, hCookie.status, hPublic.status]);
  const hOwn = await subscribe("helper", helperCh.subscription, h1.auth, { helperId: h2.helper.id, helper_id: h2.helper.helper_id });
  const ownedH = await subsByEndpoint(helperCh.endpoint);
  expect("Helper owner comes from Supabase Auth only (client helper id ignored)", hOwn.status === 200 && ownedH.length === 1 && ownedH[0].helper_id === h1.helper.id, { status: hOwn.status, ownedH });
  const h2Delete = await readResponse(await unsubscribe("helper", helperCh.endpoint, h2.auth));
  expect("Helper B cannot unsubscribe Helper A", h2Delete.revoked === 0 && (await subsByEndpoint(helperCh.endpoint))[0].status === "ACTIVE", h2Delete);
  await subscribe("helper", helperDeadCh.subscription, h1.auth);
  autopush.unregister(helperDeadCh);
  await sleep(1500);

  // ---------- REAL helper assignment push (with one dead subscription) ----------
  const reqA = await createRequest(custA.subjectKey, "en");
  const assignment = reqA.body.requestId ? (await db(`request_assignments?request_id=eq.${reqA.body.requestId}&select=id,helper_id,status`))[0] : null;
  expect("Matching unaffected by push (201 MATCHED to H1)", reqA.status === 201 && reqA.body.status === "MATCHED" && assignment?.helper_id === h1.helper.id, { status: reqA.status, body: reqA.body });
  const helperPayload = await autopush.next(helperCh, (p) => p.type === "HELPER_ASSIGNED");
  expect("REAL Web Push: helper assignment delivered via Mozilla push service", helperPayload?.type === "HELPER_ASSIGNED" && helperPayload.title === "새 서비스 요청" && helperPayload.url === "/tech/assignments", helperPayload);
  expect("Helper payload minimal (no ids, capability, names, address)", minimal(helperPayload, [reqA.body.requestId, reqA.capability, "WP TEST", `${runId} address`, custA.subjectKey]), helperPayload);
  const deadRow = await waitFor(async () => { const rows = await subsByEndpoint(helperDeadCh.endpoint); return rows[0]?.status === "INVALID" ? rows[0] : null; }, 20000);
  expect("410 from real push service -> subscription INVALID", deadRow?.status === "INVALID" && [404, 410].includes(deadRow.last_failure_status), deadRow);
  const liveRow = await waitFor(async () => { const rows = await subsByEndpoint(helperCh.endpoint); return rows[0]?.last_success_at ? rows[0] : null; }, 20000);
  expect("Dead subscription did not block the live one (success recorded)", liveRow?.status === "ACTIVE" && liveRow.failure_count === 0, liveRow);
  const helperInApp = await db(`app_notifications?recipient_id=eq.${h1.helper.helper_id}&type=eq.NEW_SERVICE_REQUEST&payload->>request_id=eq.${reqA.body.requestId}&select=id`);
  expect("In-app NEW_SERVICE_REQUEST still recorded", helperInApp.length === 1, helperInApp.length);

  // ---------- REAL customer lifecycle push (with one failing subscription) ----------
  const junkKeys = { p256dh: crypto.createECDH("prime256v1").generateKeys().toString("base64url"), auth: crypto.randomBytes(16).toString("base64url") };
  const junkEndpoint = `https://fcm.googleapis.com/fcm/send/lifehelp-invalid-${runId}`;
  const junk = await subscribe("customer", { endpoint: junkEndpoint, keys: junkKeys }, cookieA);
  expect("Failing customer subscription registered", junk.status === 200, junk.status);
  const steps = [];
  for (const action of ["accept", "start", "complete"]) steps.push((await fetch(`${base}/api/helper/assignments/${assignment?.id}/${action}`, { method: "POST", headers: h1.auth })).status);
  const afterComplete = (await db(`service_requests?id=eq.${reqA.body.requestId}&select=status`))[0]?.status;
  expect("Lifecycle unaffected by push failures (accept/start/complete 200, COMPLETED)", steps.every((s) => s === 200) && afterComplete === "COMPLETED", { steps, afterComplete });
  const customerPayload = await autopush.next(customerCh, (p) => p.type === "SERVICE_STATUS");
  expect("REAL Web Push: customer lifecycle update delivered via Mozilla push service", customerPayload?.type === "SERVICE_STATUS" && customerPayload.title === "Service update" && customerPayload.url === "/request", customerPayload);
  expect("Customer payload minimal (no ids, capability, names, address)", minimal(customerPayload, [reqA.body.requestId, reqA.capability, "WP TEST", `${runId} address`, custA.subjectKey, custA.publicId]), customerPayload);
  const junkRow = await waitFor(async () => { const rows = await subsByEndpoint(junkEndpoint); return rows[0] && (rows[0].failure_count > 0 || rows[0].status === "INVALID") ? rows[0] : null; }, 20000);
  expect("Failing subscription recorded without blocking delivery", junkRow && !junkRow.last_success_at && junkRow.last_failure_status !== null, junkRow);
  const customerInApp = await db(`app_notifications?recipient_id=eq.${custA.subjectKey}&type=eq.SERVICE_STATUS_CHANGED&payload->>request_id=eq.${reqA.body.requestId}&payload->>status=eq.COMPLETED&select=id`);
  expect("In-app SERVICE_STATUS_CHANGED (COMPLETED) recorded", customerInApp.length === 1, customerInApp.length);

  // ---------- staging test push authorization ----------
  const testPush = (headers, target = { type: "HELPER", helperId: h1.helper.id }, extra = {}) => fetch(`${base}/api/sys/push/test`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ target, ...extra }) });
  const denied = {
    anonymous: (await testPush({})).status,
    wrongToken: (await testPush({ Authorization: `Bearer ${settlementToken.slice(0, -2)}xx` })).status,
    customerCapability: (await testPush({ Authorization: `Bearer ${reqA.capability}` })).status,
    publicId: (await testPush({ Authorization: `Bearer ${custA.publicId}` })).status,
    helper: (await testPush(h1.auth)).status,
    serviceKey: (await testPush({ Authorization: `Bearer ${serviceKey}` })).status,
    customerCookie: (await testPush(cookieA)).status,
  };
  expect("Test push blocked for anon/wrong token/capability/public ID/helper/service key/customer cookie", Object.values(denied).every((s) => s === 401), denied);
  const badTarget = await testPush({ Authorization: `Bearer ${settlementToken}` }, { type: "HELPER", helperId: h1.helper.helper_id });
  expect("Test push rejects non-internal target ids", badTarget.status === 400, badTarget.status);
  const operator = await readResponse(await testPush({ Authorization: `Bearer ${settlementToken}` }, { type: "HELPER", helperId: h1.helper.id }, { title: "<b>custom</b>", body: "custom", url: "https://evil.example" }));
  const testPayload = await autopush.next(helperCh, (p) => p.type === "STAGING_TEST");
  expect("Operator test push delivered with fixed content only", operator.delivered >= 1 && testPayload?.type === "STAGING_TEST" && testPayload.title === "Test notification" && !JSON.stringify(testPayload).includes("custom") && !JSON.stringify(testPayload).includes("evil"), { operator, testPayload });

  // ---------- Chrome: real browser subscription + FCM delivery ----------
  browser = await launchChrome();
  if (!browser) {
    notTestable("Browser flow", "Chrome not available");
  } else {
    await browser.cdp("Page.addScriptToEvaluateOnNewDocument", { source: `(() => { window.__permissionCalls = []; const original = Notification.requestPermission.bind(Notification); Notification.requestPermission = (...args) => { window.__permissionCalls.push({ userActivation: navigator.userActivation?.isActive === true }); return original(...args); }; })();` }, browser.sessionId);
    await browser.cdp("Page.navigate", { url: `${base}/request` }, browser.sessionId);
    const deviceId = await waitFor(() => browser.evaluate("localStorage.getItem('life_help_public_identity_device')"), 20000, 500);
    const deviceHash = crypto.createHash("sha256").update(deviceId || "").digest("hex");
    const browserIdentity = await waitFor(async () => (await db(`referral_identities?device_id_hash=eq.${deviceHash}&select=id,subject_key,referral_id`))[0], 20000);
    if (browserIdentity) { created.identityIds.add(browserIdentity.id); created.subjectKeys.add(browserIdentity.subject_key); }
    expect("Browser: device-owner identity issued by the real /request page", !!browserIdentity, deviceId);
    const swReady = await waitFor(() => browser.evaluate("navigator.serviceWorker.getRegistration('/').then((r) => !!(r && r.active && r.active.scriptURL.endsWith('/sw.js')))"), 20000, 500);
    expect("Browser: service worker registered (/sw.js active)", swReady === true);

    const reqB = await createRequest(browserIdentity.subject_key, "en");
    await browser.cdp("Page.navigate", { url: `${base}/chat?requestId=${reqB.body.requestId}&capability=${encodeURIComponent(reqB.capability)}` }, browser.sessionId);
    const buttonShown = await waitFor(() => browser.evaluate("!!document.querySelector('[data-testid=\"push-customer-enable\"]')"), 20000, 500);
    const beforeClick = await browser.evaluate("({ calls: window.__permissionCalls.length, permission: Notification.permission })");
    expect("Browser: no permission request on page load", buttonShown === true && beforeClick?.calls === 0 && beforeClick?.permission === "default", beforeClick);
    await browser.cdp("Browser.grantPermissions", { origin, permissions: ["notifications"] });
    // Wait for hydration so the React click handler is attached, then click (retry only while no
    // permission request has happened, so the count below still proves exactly one request).
    await sleep(3000);
    let clicked = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      clicked = await trustedClick(browser, "push-customer-enable");
      if (await waitFor(() => browser.evaluate("window.__permissionCalls.length > 0"), 5000, 500)) break;
    }
    const turnedOn = await waitFor(() => browser.evaluate("!!document.querySelector('[data-testid=\"push-customer-on\"]')"), 30000, 500);
    const calls = await browser.evaluate("window.__permissionCalls");
    expect("Browser: permission requested once, inside a user gesture", clicked && calls?.length === 1 && calls[0].userActivation === true, calls);
    const browserEndpoint = await browser.evaluate("navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => s && s.endpoint)");
    const browserRow = browserEndpoint ? (await subsByEndpoint(browserEndpoint))[0] : null;
    expect("Browser: PushManager subscription persisted for the device owner", turnedOn === true && browserEndpoint?.startsWith("https://fcm.googleapis.com/") && browserRow?.status === "ACTIVE" && browserRow.owner_type === "CUSTOMER" && browserRow.customer_identity_id === browserIdentity.id, { turnedOn, host: browserEndpoint && new URL(browserEndpoint).host, browserRow });
    const resub = await browser.evaluate(`navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => fetch('/api/push/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audience: 'customer', subscription: s.toJSON() }) })).then((r) => r.json())`);
    expect("Browser: same-browser re-subscribe idempotent", resub?.created === false && (await subsByEndpoint(browserEndpoint)).length === 1, resub);
    const foreignDelete = await readResponse(await unsubscribe("customer", browserEndpoint, cookieB));
    expect("Browser: another device cannot unsubscribe it", foreignDelete.revoked === 0 && (await subsByEndpoint(browserEndpoint))[0].status === "ACTIVE", foreignDelete);

    // Real lifecycle push to the browser: helper completes the browser customer's request.
    const asgB = (await db(`request_assignments?request_id=eq.${reqB.body.requestId}&select=id,helper_id`))[0];
    const stepsB = [];
    for (const action of ["accept", "start", "complete"]) stepsB.push((await fetch(`${base}/api/helper/assignments/${asgB?.id}/${action}`, { method: "POST", headers: h1.auth })).status);
    const swSession = await waitFor(() => serviceWorkerSession(browser), 15000, 500);
    const shown = await waitFor(async () => {
      const list = await browser.evaluate("self.registration.getNotifications().then((n) => n.map((x) => ({ title: x.title, body: x.body, tag: x.tag, data: x.data })))", swSession);
      return Array.isArray(list) && list.find((n) => n.data?.type === "SERVICE_STATUS") ? list : null;
    }, 60000, 2000);
    const statusNote = shown?.find((n) => n.data?.type === "SERVICE_STATUS");
    expect("REAL Web Push: customer lifecycle push received and displayed by Chrome (FCM)", stepsB.every((s) => s === 200) && statusNote?.title === "Service update" && statusNote.data.url === "/request", { stepsB, shown });
    const operatorBrowser = await readResponse(await testPush({ Authorization: `Bearer ${settlementToken}` }, { type: "CUSTOMER", customerIdentityId: browserIdentity.id }));
    const shownTest = await waitFor(async () => {
      const list = await browser.evaluate("self.registration.getNotifications().then((n) => n.map((x) => ({ title: x.title, data: x.data })))", swSession);
      return list?.find((n) => n.data?.type === "STAGING_TEST") || null;
    }, 60000, 2000);
    expect("REAL Web Push: operator test push displayed by Chrome", operatorBrowser.delivered === 1 && shownTest?.title === "Test notification", { operatorBrowser, shownTest });

    // notificationclick routing logic, evaluated inside the live service worker.
    const routing = await browser.evaluate(`(() => { const p = self.__lifeHelpPush.parsePushPayload; return { evil: p(JSON.stringify({ url: "https://evil.example/x", audience: "customer" })).url, protocolRelative: p(JSON.stringify({ url: "//evil.example" })).url, helper: p(JSON.stringify({ url: "/tech/assignments", audience: "helper" })).url, customer: p(JSON.stringify({ url: "/request", audience: "customer" })).url, clickHandler: typeof self.onnotificationclick === "object" || true }; })()`, swSession);
    expect("Service worker: notification routes limited to fixed same-origin paths", routing?.evil === "/" && routing.protocolRelative === "/" && routing.helper === "/tech/assignments" && routing.customer === "/request", routing);
    notTestable("notificationclick via a real OS click", "Chrome DevTools cannot click an OS notification; the click handler's routing is verified inside the live service worker");

    const disableClicked = await trustedClick(browser, "push-customer-disable");
    const revokedRow = await waitFor(async () => { const row = (await subsByEndpoint(browserEndpoint))[0]; return row?.status === "REVOKED" ? row : null; }, 20000);
    expect("Browser: owner unsubscribe via UI revokes the row", disableClicked && revokedRow?.status === "REVOKED", { disableClicked, revokedRow });
  }
} catch (error) {
  record("FAIL", "E2E harness", String(error?.stack || error).slice(0, 500));
} finally {
  if (browser) await browser.close();
  for (const channel of autopush.channels.values()) { try { autopush.unregister(channel); } catch { /* closed */ } }
  await sleep(500);
  autopush.close();
  // ---------- fixture cleanup ----------
  const del = (p) => db(p, "DELETE").catch(() => null);
  for (const requestId of created.requestIds) {
    for (const { id } of await db(`conversations?request_id=eq.${requestId}&select=id`).catch(() => [])) { await del(`app_notifications?payload->>conversation_id=eq.${id}`); await del(`messages?conversation_id=eq.${id}`); }
    await del(`app_notifications?payload->>request_id=eq.${requestId}`);
    await del(`admin_audit_logs?entity_id=eq.${requestId}`);
    await del(`request_assignments?request_id=eq.${requestId}`);
    await del(`conversations?request_id=eq.${requestId}`);
    await del(`admin_escalations?request_id=eq.${requestId}`);
    await del(`service_requests?id=eq.${requestId}`);
  }
  for (const id of created.identityIds) { await del(`push_subscriptions?customer_identity_id=eq.${id}`); await del(`admin_audit_logs?entity_id=eq.${id}`); await del(`referral_attributions?or=(referred_identity_id.eq.${id},referrer_identity_id.eq.${id})`); await del(`referral_identities?id=eq.${id}`); }
  for (const id of created.helperIds) { await del(`push_subscriptions?helper_id=eq.${id}`); await del(`admin_audit_logs?entity_id=eq.${id}`); await del(`helper_services?helper_id=eq.${id}`); await del(`helper_regions?helper_id=eq.${id}`); await del(`helpers?id=eq.${id}`); }
  for (const id of created.authUserIds) await authAdmin(`users/${id}`, "DELETE").catch(() => null);
  const recipients = [...created.subjectKeys, ...created.helperPublicIds];
  if (recipients.length) await del(`app_notifications?recipient_id=in.(${recipients.join(",")})`);
  const leftovers = {
    requests: (await db(`service_requests?description=eq.${runId} request&select=id`)).length,
    helpers: (await db(`helpers?helper_id=like.HLP-${runId}*&select=id`)).length,
    identities: created.identityIds.size ? (await db(`referral_identities?id=in.(${[...created.identityIds].join(",")})&select=id`)).length : 0,
    pushRows: (await db(`push_subscriptions?or=(endpoint.like.*${runId}*,customer_identity_id.in.(${[...created.identityIds, "00000000-0000-0000-0000-000000000000"].join(",")}),helper_id.in.(${[...created.helperIds, "00000000-0000-0000-0000-000000000000"].join(",")}))&select=id`)).length,
    notifications: recipients.length ? (await db(`app_notifications?recipient_id=in.(${recipients.join(",")})&select=id`)).length : 0,
    testAudits: (await db(`admin_audit_logs?action=eq.WEB_PUSH_TEST_SENT&created_at=gte.${new Date(Number(runId.slice(2))).toISOString()}&select=id`)).length,
  };
  expect("Fixture cleanup", Object.values(leftovers).every((n) => n === 0), leftovers);
}
const counts = Object.fromEntries(["PASS", "FAIL", "NOT_TESTABLE"].map((s) => [s, results.filter(([v]) => v === s).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
if (counts.FAIL > 0) process.exit(1);

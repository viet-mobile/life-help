// Shared STAGING harness for the Web Push / ownership E2E scripts.
// Real services only: staging Worker + staging Supabase, Mozilla autopush (real push service),
// and a temporary-profile Chrome driven over the DevTools protocol (real FCM delivery).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { runGuarded, stagingTarget } from "./envGuard.mjs";

// Shared tripwire: staging Supabase + staging Worker, verified before any fixture exists.
const target = await runGuarded("staging target", () => stagingTarget());
export const env = target.env;
export const supabaseUrl = target.supabaseUrl;
export const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
export const settlementToken = env.TEST_LIFE_HELP_SETTLEMENT_TOKEN;
export const vapidPublicKey = env.TEST_LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY;
export const base = target.base;
export const origin = new URL(base).origin;
if (!serviceKey || !settlementToken || !vapidPublicKey) throw new Error("staging service key, settlement token and VAPID public key are required");

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function readResponse(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { raw: text.slice(0, 200) }; } }
const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
export async function db(pathname, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...dbHeaders, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`${method} ${pathname.split("?")[0]} ${response.status} ${value?.message || value?.code || ""}`);
  return value;
}
export async function authAdmin(pathname, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${pathname}`, { method, headers: dbHeaders, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readResponse(response);
  if (!response.ok) throw new Error(`auth ${method} ${response.status}`);
  return value;
}
export async function waitFor(fn, timeoutMs = 30000, interval = 1000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) { const value = await fn().catch(() => null); if (value) return value; if (Date.now() > deadline) return null; await sleep(interval); }
}
export async function deriveRequestId(key) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`life.help/service-request/idempotency/v1:${key}`))).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export const capabilityOwner = (capability) => { try { return JSON.parse(Buffer.from(String(capability).split(".")[0], "base64url").toString()).customerId; } catch { return null; } };

export function recorder() {
  const results = [];
  const record = (status, name, detail = "") => { results.push([status, name]); console.log(`${status} ${name}${detail ? ` ${detail}` : ""}`); };
  const expect = (name, condition, detail) => record(condition ? "PASS" : "FAIL", name, condition ? "" : (typeof detail === "string" ? detail : JSON.stringify(detail ?? "")).slice(0, 400));
  const notTestable = (name, reason) => record("NOT_TESTABLE", name, reason);
  const summary = () => { const counts = Object.fromEntries(["PASS", "FAIL", "NOT_TESTABLE"].map((s) => [s, results.filter(([v]) => v === s).length])); console.log(`SUMMARY ${JSON.stringify(counts)}`); return counts; };
  return { record, expect, notTestable, summary };
}

/** Fixture factory; everything it creates is tracked and removed by cleanup(). */
export function fixtures(runId) {
  const created = { requestIds: new Set(), helperIds: new Set(), authUserIds: new Set(), identityIds: new Set(), publicIds: new Set(), helperPublicIds: new Set() };
  const sido = `${runId}-S`;

  async function createHelper(label, { locale = "ko", onDuty = true, rating = 5, sido: helperSido = sido, service = "boiler" } = {}) {
    const email = `${label.toLowerCase()}.${runId.toLowerCase()}@example.test`, password = `LH-${crypto.randomUUID()}!`;
    const user = await authAdmin("users", "POST", { email, password, email_confirm: true });
    created.authUserIds.add(user.id);
    const helper = (await db("helpers", "POST", { auth_user_id: user.id, helper_id: `HLP-${runId}-${label}`, name: `PUSH TEST ${label}`, email, country: "KR", sido: helperSido, gungu: "G1", primary_locale: locale, spoken_locales: [locale], on_duty: onDuty, is_active: true, rating, completed_jobs: 0 }))[0];
    created.helperIds.add(helper.id); created.helperPublicIds.add(helper.helper_id);
    await db("helper_services", "POST", { helper_id: helper.id, service_slug: service });
    await db("helper_regions", "POST", { helper_id: helper.id, country: "KR", sido: helperSido, gungu: "G1" });
    const session = await readResponse(await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: serviceKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
    return { helper, email, password, token: session.access_token, auth: { Authorization: `Bearer ${session.access_token}` } };
  }

  /** Real customer device: public ID + HttpOnly owner cookie from the identity API. */
  async function customerDevice(label, referralId) {
    const response = await fetch(`${base}/api/referrals/identity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: `${runId}-device-${label}-0000`, subjectType: "CUSTOMER", ...(referralId ? { referralId } : {}) }) });
    const body = await readResponse(response);
    const cookie = (response.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).find((c) => c.startsWith("life_help_device_owner="));
    const identity = body.referralId ? (await db(`referral_identities?referral_id=eq.${body.referralId}&select=id,subject_key`))[0] : null;
    if (identity) created.identityIds.add(identity.id);
    if (body.referralId) created.publicIds.add(body.referralId);
    return { status: response.status, publicId: body.referralId, cookie, identityId: identity?.id, subjectKey: identity?.subject_key };
  }

  function requestPayload(customerId, locale = "en", label = "request") {
    return { service_slug: "boiler", customer_id: customerId, customer_locale: locale, country: "KR", sido, gungu: "G1", dong: "D1", address: `${runId} address`, description: `${runId} ${label}`, selected_options: ["test"] };
  }

  /** POST /api/requests as a device (cookie); `claimedCustomerId` lets a test spoof the body. */
  async function createRequest(device, { locale = "en", claimedCustomerId, key = crypto.randomUUID(), label } = {}) {
    // Migration 014: unpaid creation is internal legacy test compatibility (operator token only).
    const response = await fetch(`${base}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key, Authorization: `Bearer ${settlementToken}`, ...(device?.cookie ? { Cookie: device.cookie } : {}) }, body: JSON.stringify(requestPayload(claimedCustomerId ?? device?.publicId, locale, label)) });
    const body = await readResponse(response);
    if (body.requestId) created.requestIds.add(body.requestId);
    return { status: response.status, body, key };
  }
  const capabilityFor = async (cookie, key) => readResponse(await fetch(`${base}/api/requests/capability`, { method: "POST", headers: { "Idempotency-Key": key, ...(cookie ? { Cookie: cookie } : {}) } }));

  // admin_audit_logs is append-only (migration 021): fixture audit rows stay as immutable history.
  async function cleanup() {
    const del = (p) => db(p, "DELETE").catch(() => null);
    for (const requestId of created.requestIds) {
      for (const { id } of await db(`conversations?request_id=eq.${requestId}&select=id`).catch(() => [])) { await del(`app_notifications?payload->>conversation_id=eq.${id}`); await del(`messages?conversation_id=eq.${id}`); }
      await del(`app_notifications?payload->>request_id=eq.${requestId}`);
      await del(`request_assignments?request_id=eq.${requestId}`);
      await del(`conversations?request_id=eq.${requestId}`);
      await del(`admin_escalations?request_id=eq.${requestId}`);
      await del(`service_requests?id=eq.${requestId}`);
    }
    for (const id of created.identityIds) { await del(`push_subscriptions?customer_identity_id=eq.${id}`); await del(`referral_attributions?or=(referred_identity_id.eq.${id},referrer_identity_id.eq.${id})`); await del(`referral_identities?id=eq.${id}`); }
    for (const id of created.helperIds) { await del(`push_subscriptions?helper_id=eq.${id}`); await del(`helper_services?helper_id=eq.${id}`); await del(`helper_regions?helper_id=eq.${id}`); await del(`helpers?id=eq.${id}`); }
    for (const id of created.authUserIds) await authAdmin(`users/${id}`, "DELETE").catch(() => null);
    const recipients = [...created.publicIds, ...created.helperPublicIds];
    if (recipients.length) await del(`app_notifications?recipient_id=in.(${recipients.join(",")})`);
    const zero = "00000000-0000-0000-0000-000000000000";
    return {
      requests: (await db(`service_requests?description=like.${runId}*&select=id`)).length,
      helpers: (await db(`helpers?helper_id=like.HLP-${runId}*&select=id`)).length,
      identities: (await db(`referral_identities?id=in.(${[...created.identityIds, zero].join(",")})&select=id`)).length,
      pushRows: (await db(`push_subscriptions?or=(customer_identity_id.in.(${[...created.identityIds, zero].join(",")}),helper_id.in.(${[...created.helperIds, zero].join(",")}))&select=id`)).length,
      notifications: recipients.length ? (await db(`app_notifications?recipient_id=in.(${recipients.join(",")})&select=id`)).length : 0,
    };
  }
  /** Database-level fixture request (service role), for matcher behaviour checks. */
  async function insertRequest(label, { sido: requestSido = sido, service = "boiler", customerId = "DBFIXTUR" } = {}) {
    // Migration 014: raw fixture rows are explicit legacy (unfunded) auto-match requests.
    const row = (await db("service_requests", "POST", { request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true, customer_id: customerId, customer_display_name: `DB FIXTURE ${label}`, service_slug: service, country: "KR", sido: requestSido, gungu: "G1", description: `${runId} ${label}`, status: "SEARCHING" }))[0];
    created.requestIds.add(row.id);
    return row.id;
  }
  return { created, sido, createHelper, customerDevice, requestPayload, createRequest, capabilityFor, insertRequest, cleanup };
}

export const subscribe = (audience, subscription, headers = {}, extra = {}, query = "") => fetch(`${base}/api/push/subscription${query}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ audience, subscription, ...extra }) });
export const unsubscribe = (audience, endpoint, headers = {}) => fetch(`${base}/api/push/subscription`, { method: "DELETE", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ audience, endpoint }) });
export const subsByEndpoint = (endpoint) => db(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=id,owner_type,helper_id,customer_identity_id,status,failure_count,last_failure_status,last_success_at,invalidated_at`);

export const PAYLOAD_KEYS = "audience,body,tag,title,type,url,v";
export const minimalPayload = (payload, secrets) => !!payload && Object.keys(payload).sort().join() === PAYLOAD_KEYS && !secrets.some((secret) => secret && JSON.stringify(payload).includes(secret));

/** Mozilla autopush client: registers real channels and decrypts what the Worker sends. */
export class Autopush {
  constructor() { this.messages = []; this.waiters = []; this.pendingRegs = new Map(); this.channels = new Map(); this.uaid = null; this.closing = false; this.reconnects = 0; }
  // Reconnects with the same uaid + channel ids if the service drops an idle socket; autopush then
  // redelivers anything queued meanwhile.
  async connect() {
    for (let attempt = 0; ; attempt += 1) {
      try {
        this.ws = new WebSocket("wss://push.services.mozilla.com/");
        await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve); this.ws.addEventListener("error", reject); });
        break;
      } catch (error) {
        if (attempt >= 4) throw new Error(`autopush connect failed: ${error?.message || error?.type || error}`);
        await sleep(2000 * (attempt + 1));
      }
    }
    this.ws.addEventListener("message", (event) => this.onMessage(JSON.parse(event.data)));
    this.ws.addEventListener("close", () => { if (!this.closing) { this.reconnects += 1; this.connect().catch(() => undefined); } });
    const hello = new Promise((resolve) => (this.onHello = resolve));
    this.send({ messageType: "hello", use_webpush: true, ...(this.uaid ? { uaid: this.uaid, channelIDs: [...this.channels.keys()] } : {}) });
    const reply = await hello;
    this.uaid = reply.uaid || this.uaid;
  }
  send(message) { this.ws.send(JSON.stringify(message)); }
  onMessage(message) {
    if (message.messageType === "hello") this.onHello(message);
    else if (message.messageType === "register") this.pendingRegs.get(message.channelID)?.(message);
    else if (message.messageType === "notification") {
      this.send({ messageType: "ack", updates: [{ channelID: message.channelID, version: message.version, code: 100 }] });
      message.receivedAt = Date.now();
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
  /** All payloads received so far on a channel (decrypted). */
  received(channel) { return this.messages.filter((m) => m.channelID === channel.channelID).map((m) => this.decrypt(channel, m)); }
  // 120s: Mozilla autopush has been measured delivering >45s after accepting (201) a message.
  next(channel, predicate = () => true, timeoutMs = 120000) {
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
  close() { this.closing = true; for (const channel of this.channels.values()) { try { this.unregister(channel); } catch { /* closed */ } } try { this.ws.close(); } catch { /* closed */ } }
}

/** Temporary-profile Chrome over the DevTools protocol. */
export async function launchChrome({ headed = false } = {}) {
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
  let seq = 0; const pending = new Map(); const listeners = new Map();
  ws.addEventListener("message", (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) for (const fn of listeners.get(m.method) || []) fn(m.params, m.sessionId);
  });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) || []), fn]);
  const cdp = (method, params = {}, sessionId) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  const { result: { targetId } } = await cdp("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  await cdp("Page.enable", {}, sessionId);
  const evaluate = async (expression, session = sessionId) => (await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, session)).result?.result?.value;
  const navigate = (url) => cdp("Page.navigate", { url }, sessionId);
  const instrumentPermission = () => cdp("Page.addScriptToEvaluateOnNewDocument", { source: "(() => { window.__permissionCalls = []; const original = Notification.requestPermission.bind(Notification); Notification.requestPermission = (...args) => { window.__permissionCalls.push({ userActivation: navigator.userActivation?.isActive === true }); return original(...args); }; })();" }, sessionId);
  const close = async () => { try { ws.close(); } catch { /* closed */ } proc.kill(); await sleep(800); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* locked */ } };
  return { cdp, on, sessionId, evaluate, navigate, instrumentPermission, close };
}

/**
 * Staging test harness: the page's own POST /api/checkouts gets the platform-operator header added by
 * DevTools request interception (never visible to page script), so the checkout the real UI creates is
 * a purgeable test_fixture (isStagingTestOperator). Nothing else about the request changes.
 */
export async function markBrowserCheckoutsAsTestFixtures(browser, operatorToken) {
  browser.on("Fetch.requestPaused", (params, session) => {
    const isCreate = params.request.method === "POST" && new URL(params.request.url).pathname === "/api/checkouts";
    const headers = Object.entries(params.request.headers).map(([name, value]) => ({ name, value }));
    if (isCreate) headers.push({ name: "Authorization", value: `Bearer ${operatorToken}` });
    void browser.cdp("Fetch.continueRequest", { requestId: params.requestId, ...(isCreate ? { headers } : {}) }, session);
  });
  await browser.cdp("Fetch.enable", { patterns: [{ urlPattern: "*/api/checkouts", requestStage: "Request" }] }, browser.sessionId);
}

/** Trusted click (real input events carry user activation) on a data-testid or CSS selector. */
export async function trustedClick(browser, target) {
  const selector = target.startsWith("[") || target.includes(" ") || target.startsWith("button") ? target : `[data-testid="${target}"]`;
  const box = await browser.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) return false;
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await browser.cdp("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: type === "mouseMoved" ? "none" : "left", clickCount: 1 }, browser.sessionId);
  return true;
}

/** Hydration-safe "enable notifications" click: retries only while no permission request happened. */
export async function clickEnable(browser, testId) {
  await sleep(3000);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await trustedClick(browser, testId);
    if (await waitFor(() => browser.evaluate("(window.__permissionCalls || []).length > 0"), 5000, 500)) return true;
  }
  return false;
}

export async function serviceWorkerSession(browser) {
  const { result } = await browser.cdp("Target.getTargets");
  const target = result.targetInfos.find((t) => t.type === "service_worker" && t.url.startsWith(`${origin}/sw.js`));
  if (!target) return null;
  return (await browser.cdp("Target.attachToTarget", { targetId: target.targetId, flatten: true })).result.sessionId;
}

/**
 * Notifications currently shown by the site's service worker. Chrome terminates idle workers and
 * relaunches them (new DevTools target) for the next push, so the target is resolved on every call.
 */
export async function shownNotifications(browser) {
  const session = await serviceWorkerSession(browser);
  if (!session) return null;
  return browser.evaluate("self.registration.getNotifications().then((n) => n.map((x) => ({ title: x.title, body: x.body, tag: x.tag, data: x.data })))", session);
}

/** Service-role RPC on the staging database; returns { status, data } without throwing. */
export async function rpc(name, args) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, { method: "POST", headers: { ...dbHeaders }, body: JSON.stringify(args) });
  return { status: response.status, data: await readResponse(response) };
}

/**
 * Classifies a browser (FCM) delivery that did not show up: FCM answering 410 on the first push
 * to a brand-new headless-Chrome subscription is an external provider refusal (the product then
 * correctly marks the subscription INVALID). Anything else (e.g. 403 VAPID) is a real failure.
 */
export function fcmRefusedFreshSubscription(row) {
  return !!row && row.status === "INVALID" && row.last_failure_status === 410 && !row.last_success_at && row.failure_count === 1;
}

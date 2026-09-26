// Deterministic Web Push tests: RFC 8291 encryption (decrypted by an independent node:crypto
// implementation), RFC 8292 VAPID JWT, endpoint allow-list, delivery isolation with stubbed
// fetch/DB, payload minimality, and source-level authorization boundaries.
// No network, no staging, no production.
// Usage: node scripts/test_web_push.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import nodeCrypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const root = new URL("..", import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), "utf8");
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

// Stubs so the server modules load in Node: server-only, the Cloudflare context, and "@/messages"
// (backed by the real JSON dictionaries).
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-push-"));
const messagesStub = path.join(stubDir, "messages.mjs");
fs.writeFileSync(messagesStub, `import fs from "node:fs";
const dir = ${JSON.stringify(new URL("messages/", root).pathname.replace(/^\/([A-Za-z]:)/, "$1"))};
const cache = {};
const dict = (l) => (cache[l] ??= JSON.parse(fs.readFileSync(dir + l + ".json", "utf8")));
const locales = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
export const isValidLocale = (v) => typeof v === "string" && locales.includes(v);
export function translate(locale, key) { const get = (d) => key.split(".").reduce((c, k) => (c && typeof c === "object" ? c[k] : undefined), d); return get(dict(locale)) ?? get(dict("en")) ?? key; }
`);
const cloudflareStub = path.join(stubDir, "cloudflare.mjs");
fs.writeFileSync(cloudflareStub, `export async function getCloudflareContext() { return { env: globalThis.__testEnv || {}, ctx: { waitUntil: (p) => (globalThis.__waitUntil ||= []).push(p) } }; }`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(cloudflareStub).href, shortCircuit: true };
    if (specifier === "@/messages") return { url: pathToFileURL(messagesStub).href, shortCircuit: true };
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
    return nextResolve(specifier, context);
  },
});

const pushCrypto = await import(new URL("lib/push/webPushCrypto.ts", root).href);
const delivery = await import(new URL("lib/push/pushDelivery.ts", root).href);
const b64u = (buf) => Buffer.from(buf).toString("base64url");

// ---------- subscriber (browser) keys ----------
const ua = nodeCrypto.createECDH("prime256v1");
ua.generateKeys();
const uaAuth = nodeCrypto.randomBytes(16);
const subscription = { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", p256dh: b64u(ua.getPublicKey()), auth: b64u(uaAuth) };

// Independent RFC 8291 decryption with node:crypto.
function decrypt(body) {
  const salt = body.subarray(0, 16), rs = body.readUInt32BE(16), idlen = body[20];
  const asPublic = body.subarray(21, 21 + idlen), ciphertext = body.subarray(21 + idlen);
  const ecdh = ua.computeSecret(asPublic);
  const ikm = Buffer.from(nodeCrypto.hkdfSync("sha256", ecdh, uaAuth, Buffer.concat([Buffer.from("WebPush: info\0"), ua.getPublicKey(), asPublic]), 32));
  const cek = Buffer.from(nodeCrypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(nodeCrypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const decipher = nodeCrypto.createDecipheriv("aes-128-gcm", cek, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  return { rs, idlen, delimiter: plain[plain.length - 1], text: plain.subarray(0, plain.length - 1).toString("utf8") };
}

const message = JSON.stringify({ v: 1, type: "STAGING_TEST", title: "Test", body: "Body" });
const encrypted = Buffer.from(await pushCrypto.encryptPayload(subscription, new TextEncoder().encode(message)));
const opened = decrypt(encrypted);
check("RFC 8291: independent decryption recovers the payload", opened.text === message);
check("RFC 8291: header rs=4096, idlen=65, final-record delimiter 0x02", opened.rs === 4096 && opened.idlen === 65 && opened.delimiter === 2);
const again = Buffer.from(await pushCrypto.encryptPayload(subscription, new TextEncoder().encode(message)));
check("RFC 8291: fresh salt and server key per message", !again.subarray(0, 86).equals(encrypted.subarray(0, 86)));
let tampered = false;
try { const bad = Buffer.from(encrypted); bad[bad.length - 1] ^= 1; decrypt(bad); } catch { tampered = true; }
check("RFC 8291: tampered ciphertext is rejected", tampered);

// ---------- VAPID ----------
const vapidEcdh = nodeCrypto.createECDH("prime256v1");
vapidEcdh.generateKeys();
const vapid = { publicKey: b64u(vapidEcdh.getPublicKey()), privateKey: b64u(vapidEcdh.getPrivateKey()), subject: "https://life.help" };
const now = 1_790_000_000;
const header = await pushCrypto.vapidAuthorization(subscription.endpoint, vapid, now);
const [, jwt, k] = header.match(/^vapid t=([^,]+), k=(.+)$/) || [];
const [h64, c64, s64] = (jwt || "").split(".");
const claims = JSON.parse(Buffer.from(c64 || "", "base64url").toString());
const jwk = { kty: "EC", crv: "P-256", x: b64u(vapidEcdh.getPublicKey().subarray(1, 33)), y: b64u(vapidEcdh.getPublicKey().subarray(33)) };
const verified = nodeCrypto.verify("sha256", Buffer.from(`${h64}.${c64}`), { key: nodeCrypto.createPublicKey({ key: jwk, format: "jwk" }), dsaEncoding: "ieee-p1363" }, Buffer.from(s64 || "", "base64url"));
check("VAPID: ES256 JWT verifies with the public key", verified);
check("VAPID: aud is the push service origin, sub is the subject, exp <= 24h", claims.aud === "https://fcm.googleapis.com" && claims.sub === "https://life.help" && claims.exp - now > 0 && claims.exp - now <= 86400 && JSON.parse(Buffer.from(h64, "base64url").toString()).alg === "ES256");
check("VAPID: header carries only the public key", k === vapid.publicKey && !header.includes(vapid.privateKey));

// ---------- endpoint allow-list / subscription parsing ----------
const allowed = ["https://fcm.googleapis.com/fcm/send/x", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://web.push.apple.com/x", "https://wns2-par02p.notify.windows.com/w/?token=x"];
const rejected = ["http://fcm.googleapis.com/fcm/send/x", "https://fcm.googleapis.com.evil.example/x", "https://evil.example/fcm.googleapis.com", "https://169.254.169.254/latest", "https://localhost/x", "https://fcm.googleapis.com:8443/x", "https://user:pass@fcm.googleapis.com/x", "javascript:alert(1)", "", null, 42];
check("Endpoint allow-list accepts real push services", allowed.every((e) => pushCrypto.isAllowedPushEndpoint(e)));
check("Endpoint allow-list rejects http, lookalikes, internal hosts, ports, userinfo", rejected.every((e) => !pushCrypto.isAllowedPushEndpoint(e)), rejected.filter((e) => pushCrypto.isAllowedPushEndpoint(e)).join(","));
check("Subscription parser accepts a browser subscription", !!pushCrypto.parseSubscription({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth }, expirationTime: null }));
check("Subscription parser rejects short/garbled keys and foreign endpoints", [
  { endpoint: subscription.endpoint, keys: { p256dh: "AAAA", auth: subscription.auth } },
  { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: "AAAA" } },
  { endpoint: subscription.endpoint, keys: { p256dh: "<script>", auth: subscription.auth } },
  { endpoint: "https://evil.example/x", keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
  { endpoint: subscription.endpoint },
].every((s) => pushCrypto.parseSubscription(s) === null));

// ---------- configuration guard ----------
const stagingEnv = { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY: vapid.publicKey, LIFE_HELP_WEB_PUSH_VAPID_PRIVATE_KEY: vapid.privateKey };
globalThis.__testEnv = stagingEnv;
const publicConfig = await delivery.getPublicPushConfig();
check("Config exposes only enabled + public key", publicConfig.enabled === true && publicConfig.publicKey === vapid.publicKey && Object.keys(publicConfig).sort().join() === "enabled,publicKey" && !JSON.stringify(publicConfig).includes(vapid.privateKey));
globalThis.__testEnv = { ...stagingEnv, SUPABASE_URL: "https://wstdbymmkrqgtsibhcjz.supabase.co" };
check("Push disabled against the production project", (await delivery.getVapidConfig()) === null && (await delivery.getPublicPushConfig()).enabled === false);
globalThis.__testEnv = { SUPABASE_URL: stagingEnv.SUPABASE_URL };
check("Push disabled without VAPID secrets", (await delivery.getVapidConfig()) === null);
globalThis.__testEnv = stagingEnv;

// ---------- payload minimality ----------
for (const [event, locale] of [["HELPER_ASSIGNED", "ko"], ["SERVICE_STATUS", "vi"], ["STAGING_TEST", "xx-invalid"]]) {
  const payload = JSON.parse(delivery.buildPushPayload(event, locale));
  check(`Payload ${event}: only generic fields and a fixed route`, Object.keys(payload).sort().join() === "audience,body,tag,title,type,url,v" && ["/tech/assignments", "/request"].includes(payload.url) && payload.title && payload.body && !/capability|token|@|\d{3}-\d{3,4}/i.test(JSON.stringify(payload)), JSON.stringify(payload));
}
check("Payload is localized (ko helper, vi customer, en fallback)", JSON.parse(delivery.buildPushPayload("HELPER_ASSIGNED", "ko")).title === "새 서비스 요청" && JSON.parse(delivery.buildPushPayload("SERVICE_STATUS", "vi")).title === "Cập nhật dịch vụ" && JSON.parse(delivery.buildPushPayload("STAGING_TEST", "zz")).title === "Test notification");

// ---------- delivery isolation (stubbed push service + DB) ----------
function fakeClient(rows) {
  const recorded = [];
  const query = { select() { return this; }, eq() { return this; }, in() { return this; }, limit() { return this; }, maybeSingle() { return this; }, then(resolve) { resolve({ data: rows, error: null }); } };
  return { recorded, from: () => Object.create(query), rpc: async (name, args) => { recorded.push([name, args]); return { data: { success: true }, error: null }; } };
}
const endpoints = { ok: "https://fcm.googleapis.com/fcm/send/ok", gone: "https://fcm.googleapis.com/fcm/send/gone", missing: "https://fcm.googleapis.com/fcm/send/missing", broken: "https://fcm.googleapis.com/fcm/send/broken", slow: "https://fcm.googleapis.com/fcm/send/5xx" };
const sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  sent.push({ url, init });
  if (url === endpoints.broken) throw new Error("network down");
  return new Response(null, { status: { [endpoints.ok]: 201, [endpoints.gone]: 410, [endpoints.missing]: 404, [endpoints.slow]: 503 }[url] });
};
const rows = Object.entries(endpoints).map(([name, endpoint]) => ({ id: `sub-${name}`, endpoint, p256dh: subscription.p256dh, auth: subscription.auth }));
const client = fakeClient(rows);
const report = await delivery.deliverPush(client, { ownerType: "HELPER", helperId: "00000000-0000-4000-8000-000000000001" }, "HELPER_ASSIGNED", "en");
globalThis.fetch = realFetch;
const statusOf = (id) => client.recorded.find(([, args]) => args.p_subscription_id === id)?.[1].p_http_status;
check("Delivery: every subscription attempted despite failures", report.attempted === 5 && sent.length === 5, JSON.stringify(report));
check("Delivery: counts success / 404+410 invalidated / other failures", report.delivered === 1 && report.invalidated === 2 && report.failed === 2, JSON.stringify(report));
check("Delivery: every result recorded via record_push_delivery_result", client.recorded.length === 5 && client.recorded.every(([name]) => name === "record_push_delivery_result") && statusOf("sub-ok") === 201 && statusOf("sub-gone") === 410 && statusOf("sub-missing") === 404 && statusOf("sub-slow") === 503 && statusOf("sub-broken") === 0);
const request = sent.find((s) => s.url === endpoints.ok).init;
check("Delivery: aes128gcm + VAPID headers, no redirects followed", request.headers["Content-Encoding"] === "aes128gcm" && request.headers.Authorization.startsWith("vapid t=") && request.headers.TTL && request.redirect === "manual");
check("Delivery: body decrypts to the minimal payload", JSON.parse(decrypt(Buffer.from(request.body)).text).type === "HELPER_ASSIGNED");
const throwingClient = { from() { throw new Error("db down"); }, rpc: async () => { throw new Error("db down"); } };
check("Delivery never throws (DB failure)", (await delivery.deliverPush(throwingClient, { ownerType: "HELPER", helperId: "x" }, "HELPER_ASSIGNED", "en")).attempted === 0);
check("pushHelperAssignment/pushCustomerStatus never throw", (await delivery.pushHelperAssignment(throwingClient, "r")) === null && (await delivery.pushCustomerStatus(throwingClient, "r")) === null);
let backgroundThrew = false;
try { await delivery.dispatchPushInBackground(async () => { throw new Error("boom"); }); await Promise.all(globalThis.__waitUntil || []); } catch { backgroundThrew = true; }
check("Background dispatch swallows errors", !backgroundThrew);

// ---------- source-level boundaries ----------
const sw = read("public/sw.js");
check("Service worker handles push and notificationclick", /addEventListener\("push"/.test(sw) && /addEventListener\("notificationclick"/.test(sw) && sw.includes("showNotification"));
check("Service worker opens only fixed same-origin routes", /const PUSH_ROUTES = \["\/tech\/assignments", "\/request", "\/"\]/.test(sw) && sw.includes("PUSH_ROUTES.includes(data.url)") && sw.includes("self.location.origin"));
check("Service worker never handles capabilities or tokens", !/capability|token|Authorization/i.test(sw.replace(/\/\/.*$/gm, "")));
const toggle = read("components/push/PushToggle.tsx");
const effectBody = toggle.slice(toggle.indexOf("useEffect("), toggle.indexOf("const enable"));
check("Permission requested only inside the click handler", (toggle.match(/Notification\.requestPermission\(/g) || []).length === 1 && !effectBody.includes("requestPermission") && toggle.indexOf("requestPermission") > toggle.indexOf("const enable = async"));
check("Client sends no owner identifiers", !/helperId|helper_id|referralId|referral_id|customer_id|\?ref=/.test(toggle));
const owner = read("lib/push/pushOwner.ts");
check("Helper owner via Supabase Auth -> helpers", owner.includes('audience === "helper"') && owner.includes("resolveAuthenticatedHelper(request)") && owner.includes("resolved.value.helper.id"));
const customerOwner = read("lib/request/customerOwner.ts");
check("Customer owner via signed device cookie -> CUSTOMER identity (shared resolver)", owner.includes("resolveCustomerOwner(client)") && customerOwner.includes("verifyDeviceOwnerCookie(") && customerOwner.includes('.eq("device_id_hash", deviceHash)') && customerOwner.includes('.eq("subject_type", "CUSTOMER")'));
check("Owner resolution never reads the request body or query", !/request\.(json|text|formData)\(|searchParams|new URL\(request|\breferral_id\b|\bsubject_key\b/.test(owner.replace(/^\s*\*.*$/gm, "").replace(/\/\/.*$/gm, "")));
const subRoute = read("app/api/push/subscription/route.ts");
check("Subscription route resolves owner before any write and uses the RPCs", subRoute.indexOf("resolvePushOwner(") < subRoute.indexOf('rpc("upsert_push_subscription"') && subRoute.includes('rpc("revoke_push_subscription"') && !/from\("push_subscriptions"\)/.test(subRoute));
check("Subscription route never returns endpoint or keys", !/respond\(\{[^}]*(endpoint|p256dh|auth:|subscription_id)/.test(subRoute));
const testRoute = read("app/api/sys/push/test/route.ts");
check("Test push requires platform operator before anything else", testRoute.indexOf("authorizePlatformOperator(request)") > 0 && testRoute.indexOf("authorizePlatformOperator(request)") < testRoute.indexOf("request.json()") && testRoute.includes("createStagingSettlementClient"));
check("Test push content is fixed (no caller title/body/url)", testRoute.includes('"STAGING_TEST"') && !/body\??\.(title|body|url|html|message)/.test(testRoute));
const configRoute = read("app/api/push/config/route.ts");
check("Config route returns only enabled + publicKey", /NextResponse\.json\(\{ enabled: config\.enabled, publicKey: config\.publicKey \}/.test(configRoute));
const clientFiles = ["components/push/PushToggle.tsx", "components/chat/DbChatPanel.tsx", "components/tech/DbAssignmentPanel.tsx", "public/sw.js"].map(read).join("\n");
check("Private VAPID key name never referenced client-side", !clientFiles.includes("VAPID_PRIVATE") && !clientFiles.includes("pushDelivery"));
const privateRefs = ["app", "lib", "components", "public"].flatMap(function walk(dir) { return fs.readdirSync(new URL(dir + "/", root), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]); }).filter((f) => /\.(tsx?|mjs|js)$/.test(f) && read(f).includes("LIFE_HELP_WEB_PUSH_VAPID_PRIVATE_KEY"));
check("VAPID private key read only in lib/push/pushDelivery.ts (server-only)", privateRefs.length === 1 && privateRefs[0] === "lib/push/pushDelivery.ts" && read("lib/push/pushDelivery.ts").startsWith('import "server-only";'), privateRefs.join(","));
const runtimeFiles = ["app", "lib", "components"].flatMap(function walk(dir) { return fs.readdirSync(new URL(dir + "/", root), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]); }).filter((f) => /\.tsx?$/.test(f));
const pushTableUsers = runtimeFiles.filter((f) => read(f).includes('from("push_subscriptions")'));
check("Runtime never hard-deletes push subscriptions (status-only via RPCs)", pushTableUsers.join() === "lib/push/pushDelivery.ts" && !/from\("push_subscriptions"\)[^;]*\.(delete|update|insert|upsert)\(/.test(read("lib/push/pushDelivery.ts")), pushTableUsers.join());
const requestRoute = read("app/api/requests/route.ts");
check("Helper push runs after matching, only for a fresh MATCHED result", requestRoute.indexOf("submitServiceRequest(client") < requestRoute.lastIndexOf("pushHelperAssignment(") && requestRoute.includes('result.matchedByThisCall && result.body.success && result.body.status === "MATCHED"'));
const completeRoute = read("app/api/helper/assignments/[assignmentId]/complete/route.ts");
check("Customer push after committed COMPLETE only", completeRoute.indexOf('rpc("complete_assignment_service"') < completeRoute.lastIndexOf("notifyCustomerStatusChange(") && completeRoute.includes("data.idempotent !== true"));

fs.rmSync(stubDir, { recursive: true, force: true });
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

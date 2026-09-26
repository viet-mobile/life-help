// Deterministic customer-ownership + rematch-push tests.
// Runs the real lib/request/customerOwner.ts and lib/push/pushDelivery.ts with real signed
// device-owner cookies against an in-memory database; plus source-level wiring checks.
// No network, no staging, no production.
// Usage: node scripts/test_customer_ownership.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const root = new URL("..", import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), "utf8");
const code = (file) => read(file).replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

// ---------- module stubs: server-only, Cloudflare env, next/headers cookies, @/messages ----------
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-owner-"));
const stub = (name, source) => { const file = path.join(stubDir, name); fs.writeFileSync(file, source); return pathToFileURL(file).href; };
const cloudflare = stub("cloudflare.mjs", "export async function getCloudflareContext() { return { env: globalThis.__env || {}, ctx: { waitUntil() {} } }; }");
const headers = stub("headers.mjs", "export async function cookies() { return { get: (name) => (globalThis.__cookies || {})[name] === undefined ? undefined : { name, value: globalThis.__cookies[name] } }; }");
const messages = stub("messages.mjs", "export const isValidLocale = (v) => v === 'en'; export const translate = (_l, key) => key;");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: cloudflare, shortCircuit: true };
    if (specifier === "next/headers") return { url: headers, shortCircuit: true };
    if (specifier === "@/messages") return { url: messages, shortCircuit: true };
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
    return nextResolve(specifier, context);
  },
});
globalThis.__env = { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-service-key-for-hmac-only", LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY: "", LIFE_HELP_WEB_PUSH_VAPID_PRIVATE_KEY: "" };

const ownership = await import(new URL("lib/referral/deviceOwnership.ts", root).href);
const { resolveCustomerOwner } = await import(new URL("lib/request/customerOwner.ts", root).href);
const push = await import(new URL("lib/push/pushDelivery.ts", root).href);

// ---------- in-memory referral_identities / service_requests / push_subscriptions ----------
function fakeClient(tables) {
  const queries = [];
  const client = {
    queries,
    from(table) {
      const filters = [];
      const q = {
        select() { return q; }, limit() { return q; },
        eq(col, value) { filters.push([col, value]); return q; },
        in(col, values) { filters.push([col, values]); return q; },
        maybeSingle() { q.single = true; return q; },
        then(resolve) {
          queries.push({ table, filters: [...filters] });
          const rows = (tables[table] || []).filter((row) => filters.every(([c, v]) => Array.isArray(v) ? v.includes(row[c]) : row[c] === v));
          resolve({ data: q.single ? (rows[0] ?? null) : rows, error: null });
        },
      };
      return q;
    },
    rpc: async () => ({ data: { success: true }, error: null }),
  };
  return client;
}
const tables = {
  referral_identities: [
    { id: "id-A", device_id_hash: "hash-A", subject_type: "CUSTOMER", status: "ACTIVE", subject_key: "AAAAAAAA", referral_id: "AAAAAAAA" },
    { id: "id-B", device_id_hash: "hash-B", subject_type: "CUSTOMER", status: "ACTIVE", subject_key: "BBBBBBBB", referral_id: "BBBBBBBB" },
    { id: "id-H", device_id_hash: "hash-H", subject_type: "HELPER", status: "ACTIVE", subject_key: "HHHHHHHH", referral_id: "HHHHHHHH" },
    { id: "id-R", device_id_hash: "hash-R", subject_type: "CUSTOMER", status: "REVOKED", subject_key: "RRRRRRRR", referral_id: "RRRRRRRR" },
    { id: "id-X", device_id_hash: "hash-X", subject_type: "CUSTOMER", status: "ACTIVE", subject_key: "S3REF-A", referral_id: "XXXXXXXX" },
  ],
  service_requests: [{ id: "req-B", customer_id: "BBBBBBBB", customer_locale: "en" }],
  push_subscriptions: [],
};
const client = fakeClient(tables);
const asDevice = async (hash) => { globalThis.__cookies = { life_help_device_owner: await ownership.issueDeviceOwnerCookie(hash) }; };

// ---------- server-derived owner ----------
globalThis.__cookies = {};
check("No device cookie -> 401 DEVICE_OWNER_REQUIRED", (await resolveCustomerOwner(client)).code === "DEVICE_OWNER_REQUIRED");
globalThis.__cookies = { life_help_device_owner: "eyJkZXZpY2VIYXNoIjoiaGFzaC1BIiwiZXhwaXJlc0F0Ijo5OTk5OTk5OTk5OTk5fQ.forged" };
check("Forged device cookie (A's hash, wrong MAC) -> rejected", (await resolveCustomerOwner(client)).ok === false);
globalThis.__cookies = { life_help_device_owner: "AAAAAAAA" };
check("Public 8-letter ID as the cookie value -> rejected", (await resolveCustomerOwner(client)).ok === false);
await asDevice("hash-B");
const ownerB = await resolveCustomerOwner(client);
check("Device B cookie -> B's identity and customer id", ownerB.ok && ownerB.owner.identityId === "id-B" && ownerB.owner.customerId === "BBBBBBBB", JSON.stringify(ownerB));
await asDevice("hash-A");
const ownerA = await resolveCustomerOwner(client);
check("Device A cookie -> A (owner follows the cookie, nothing else)", ownerA.ok && ownerA.owner.customerId === "AAAAAAAA");
await asDevice("hash-H");
check("HELPER identity cannot act as a customer owner", (await resolveCustomerOwner(client)).ok === false);
await asDevice("hash-R");
check("Revoked identity cannot own requests", (await resolveCustomerOwner(client)).ok === false);
await asDevice("hash-X");
check("Identity with a non-customer-id subject_key -> 409 CUSTOMER_OWNER_INVALID", (await resolveCustomerOwner(client)).code === "CUSTOMER_OWNER_INVALID");
await asDevice("hash-unknown");
check("Valid cookie for an unknown device -> 401", (await resolveCustomerOwner(client)).code === "DEVICE_OWNER_REQUIRED");
const expiredPayload = Buffer.from(JSON.stringify({ deviceHash: "hash-A", expiresAt: Date.now() - 1000 })).toString("base64url");
globalThis.__cookies = { life_help_device_owner: `${expiredPayload}.${(await ownership.issueDeviceOwnerCookie("hash-A")).split(".")[1]}` };
check("Expired or tampered cookie payload -> rejected", (await resolveCustomerOwner(client)).ok === false);

// ---------- push targeting follows the stored (server-derived) owner ----------
globalThis.__env = { ...globalThis.__env, LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY: "BPlaceholderKeyForTargetingOnly", LIFE_HELP_WEB_PUSH_VAPID_PRIVATE_KEY: "placeholder" };
client.queries.length = 0;
await push.pushCustomerStatus(client, "req-B");
const subscriptionQuery = client.queries.find((q) => q.table === "push_subscriptions");
const identityQuery = client.queries.find((q) => q.table === "referral_identities");
check("Customer push targets only the request owner's identity (B), never A", subscriptionQuery?.filters.some(([c, v]) => c === "customer_identity_id" && v === "id-B") && !JSON.stringify(client.queries).includes("id-A"), JSON.stringify(client.queries));
check("Customer push resolves the owner server-side from service_requests.customer_id", identityQuery?.filters.some(([c, v]) => c === "subject_key" && v === "BBBBBBBB") && identityQuery.filters.some(([c, v]) => c === "subject_type" && v === "CUSTOMER"));

// ---------- source wiring ----------
const route = code("app/api/requests/route.ts");
check("Request route resolves the owner before validation", route.indexOf("resolveCustomerOwner(client)") > 0 && route.indexOf("resolveCustomerOwner(client)") < route.indexOf("validateCreateServiceRequest("));
check("Request route overwrites any client customer_id with the server owner", /\{ \.\.\.\(body as Record<string, unknown>\), customer_id: owner\.owner\.customerId \}/.test(route));
check("Request route rejects callers without device ownership", /if \(!owner\.ok\)[\s\S]{0,40}return respond\(owner\.status/.test(route));
const capability = code("app/api/requests/capability/route.ts");
check("Capability issued only to the device that owns the request", capability.includes("resolveCustomerOwner(client)") && capability.includes("owner.owner.customerId !== data.customer_id") && capability.indexOf("owner.owner.customerId !== data.customer_id") < capability.indexOf("issueConversationCapability("));
const owner = code("lib/request/customerOwner.ts");
check("Owner resolver reads only the signed cookie (no body/query/public ID)", owner.includes("verifyDeviceOwnerCookie(") && !/request\.|searchParams|\breferral_id\b|body\./.test(owner));
check("Push subscription owner reuses the same resolver", read("lib/push/pushOwner.ts").includes("resolveCustomerOwner(client)"));
const identityRoute = code("app/api/referrals/identity/route.ts");
check("Identity API ignores client subjectKey for CUSTOMER identities", identityRoute.includes('body.subjectType !== "CUSTOMER" && typeof body.subjectKey === "string"'));
check("Identity API never overwrites an existing subject_key", identityRoute.includes("subjectKey && !existing?.subject_key"));
check("?ref= is only ever sent as referralId (referrer), never as the visitor identity", /referralId: ref \}/.test(read("components/shared/ReferralCard.tsx")) && /\.\.\.\(referralId \? \{ referralId \} : \{\}\)/.test(read("app/request/page.tsx")));
check("Home card and request page share one device id", read("components/shared/ReferralCard.tsx").includes("getCustomerDeviceId()") && read("app/request/page.tsx").includes("getCustomerDeviceId()") && !read("app/request/page.tsx").includes('const key = "life_help_public_identity_device"'));

// ---------- rematch push wiring ----------
const serverRequest = code("lib/request/serverRequest.ts");
check("First-match and orphan-replay push only when this call's RPC matched", (serverRequest.match(/matchedByThisCall = attempt\.outcome === "RAN" && attempt\.status === "MATCHED"/g) || []).length === 2 && route.includes("result.matchedByThisCall && result.body.success"));
const decline = code("app/api/helper/assignments/[assignmentId]/decline/route.ts");
check("Decline -> rematch pushes the new helper only after a successful release + MATCHED", decline.indexOf('rpc("release_assignment_for_rematch"') < decline.indexOf("pushHelperAssignment(") && decline.includes("if (!release?.success) return") && decline.includes('matching?.success === true && matching.status === "MATCHED"'));
const recover = code("app/api/sys/requests/recover/route.ts");
check("Admin recovery pushes only for requests this run RECOVERED as MATCHED", recover.includes('r.outcome === "RECOVERED" && r.status === "MATCHED"') && recover.indexOf("authorizeRecoveryRequest(request)") < recover.indexOf("pushHelperAssignment("));
const assignmentCreators = ["app", "lib"].flatMap(function walk(dir) { return fs.readdirSync(new URL(dir + "/", root), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]); }).filter((f) => /\.tsx?$/.test(f) && /rpc\("match_and_assign_helper"/.test(read(f)));
check("Every runtime match_and_assign_helper caller is covered by helper push", assignmentCreators.sort().join() === ["app/api/helper/assignments/[assignmentId]/decline/route.ts", "lib/db/serverMatching.ts", "lib/request/requestRecovery.ts"].join(), assignmentCreators.join());
const serverMatchingUsers = ["app", "lib", "components"].flatMap(function walk(dir) { return fs.readdirSync(new URL(dir + "/", root), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]); }).filter((f) => /\.tsx?$/.test(f) && f !== "lib/db/serverMatching.ts" && /serverMatching/.test(read(f)));
check("TIMEOUT release helper (lib/db/serverMatching.ts) has no runtime caller", serverMatchingUsers.length === 0, serverMatchingUsers.join());

// ---------- staging build never inlines the production Supabase project ----------
const scripts = JSON.parse(read("package.json")).scripts;
const buildStaging = read("scripts/build-staging.mjs");
check("deploy:staging builds with staging NEXT_PUBLIC Supabase values", scripts["deploy:staging"].startsWith("node scripts/build-staging.mjs && ") && /NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey/.test(buildStaging) && buildStaging.includes('url.includes(`${STAGING_REF}.supabase.co`)'));
check("Staging build fails closed if the production URL is in the output", buildStaging.includes("`${PRODUCTION_REF}.supabase`") && buildStaging.includes("refusing to deploy"));
check("Production deploy script unchanged", scripts["deploy:production"] === "opennextjs-cloudflare build && wrangler deploy --name life-help");

fs.rmSync(stubDir, { recursive: true, force: true });
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

// Deterministic failure-isolation test of the scheduled maintenance route
// (/api/sys/cleanup/conversations: conversation cleanup, unpaid-checkout expiry, media deletion,
// money outbox) and of the media deletion runner. Real route / runner code; every dependency is a
// stub, so no network, no Supabase, no chain.
// Usage: node scripts/test_cron_isolation_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const root = new URL("..", import.meta.url);
let failed = 0, passed = 0;
const check = (name, condition, detail = "") => { if (condition) { passed += 1; console.log(`PASS ${name}`); } else { failed += 1; console.error(`FAIL ${name} ${JSON.stringify(detail)}`); } };

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-cron-"));
const stub = (name, source) => { const file = path.join(dir, name); fs.writeFileSync(file, source); return pathToFileURL(file).href; };
const stubs = {
  "next/server": stub("next.mjs", "export const NextResponse = { json(body, init = {}) { return { status: init.status ?? 200, body }; } };"),
  "@opennextjs/cloudflare": stub("cf.mjs", "export async function getCloudflareContext() { return { env: globalThis.__env || {} }; }"),
  "@/lib/settlement/platformAuth": stub("auth.mjs", "export async function authorizePlatformOperator() { return 'PLATFORM_OPERATOR'; } export async function createStagingSettlementClient() { return globalThis.__client; }"),
  "@/lib/settlement/serviceSettlement": stub("settle.mjs", "export async function runConversationCleanup() { globalThis.__calls.push('conversations'); if (globalThis.__fail === 'conversations') throw new Error('conversation boom'); return { scanned: 0, eligible: 0, cleaned: 1, already_clean: 0, failed: 0, reconciled: 0, reconciledRequestIds: [], processed: 1, messagesDeleted: 0, closedRequests: 0, skipped: 0 }; }"),
  "@/lib/media/mediaStorage": stub("media.mjs", "export async function runMediaDeletion() { globalThis.__calls.push('media'); if (globalThis.__fail === 'media') throw new Error('storage boom'); return { deleted: 1, failed: 0, notConfigured: false }; }"),
  "@/lib/payments/transfers": stub("transfers.mjs", "export async function runMoneyOutbox() { globalThis.__calls.push('outbox'); if (globalThis.__fail === 'outbox') throw new Error('outbox boom'); return { processed: [], configured: true }; }"),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (stubs[specifier] && !(specifier === "@/lib/media/mediaStorage" && globalThis.__realMedia)) return { url: stubs[specifier], shortCircuit: true };
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
    return nextResolve(specifier, context);
  },
});

const client = {
  rpc: async (fn) => { globalThis.__calls.push(fn); return globalThis.__fail === "checkouts" ? { data: null, error: { code: "57014" } } : { data: { success: true, expired: 0, media_queued: 0 }, error: null }; },
  from: () => ({ insert: async () => ({ error: null }) }),
};
globalThis.__client = client;
const route = await import(new URL("app/api/sys/cleanup/conversations/route.ts", root).href);
const post = () => route.POST(new Request("https://x.internal/api/sys/cleanup/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));

for (const fail of [null, "conversations", "checkouts", "media", "outbox"]) {
  globalThis.__calls = []; globalThis.__fail = fail;
  const res = await post();
  const ran = ["conversations", "expire_stale_checkouts", "media", "outbox"].every((c) => globalThis.__calls.includes(c));
  if (!fail) check("All four subsystems run; 200 with an empty error list", ran && res.status === 200 && res.body.success === true && res.body.subsystemErrors.length === 0, res);
  else check(`'${fail}' fails -> every other subsystem still runs; the run is reported non-2xx with that failure only`, ran && res.status === 500 && res.body.success === false && res.body.subsystemErrors.length === 1, { calls: globalThis.__calls, errors: res.body.subsystemErrors });
}

// ---- media deletion runner: per-item isolation ----
globalThis.__realMedia = true;
globalThis.__env = { LIFE_HELP_MEDIA_BUCKET: "life-help-staging-request-media" };
const media = await import(new URL("lib/media/mediaStorage.ts", root).href + "?real");
const recorded = [], deletedIds = [];
const objects = new Set(["k-throws", "k-error", "k-stays", "k-unverified", "k-ok"]);
const mediaClient = {
  rpc: async (fn, args) => {
    if (fn === "list_media_pending_deletion") return { data: [...objects].map((k, i) => ({ media_id: `m${i}-${k}`, object_key: k })) };
    if (fn === "record_media_deletion_failure") { recorded.push([args.p_media_id, args.p_error_code]); return { data: { success: true } }; }
    if (fn === "mark_request_media_deleted") { deletedIds.push(args.p_media_id); return { data: { success: true } }; }
    return { data: null };
  },
  storage: { from: () => ({
    remove: async ([key]) => { if (key === "k-throws") throw new Error("network"); if (key === "k-error") return { error: { message: "denied" } }; if (key !== "k-stays" && key !== "k-unverified") objects.delete(key); return { error: null }; },
    info: async (key) => (key === "k-unverified" ? { data: null, error: { status: 500 } } : objects.has(key) ? { data: { name: key }, error: null } : { data: null, error: { status: 400 } }),
    download: async () => { throw new Error("verification must not use cacheable downloads"); },
  }) },
};
const out = await media.runMediaDeletion(mediaClient, 50);
check("One object throwing / failing / still present does not stop the others: the healthy item is deleted", out.deleted === 1 && out.failed === 4 && deletedIds.length === 1 && deletedIds[0].endsWith("k-ok"), { out, deletedIds });
check("Each failure is recorded (stays queued with backoff) with a safe code - incl. 'could not verify' (metadata error) and 'still present'; none is marked DELETED; verification never uses a cacheable download", recorded.map((r) => r[1]).sort().join() === "STORAGE_DELETE_ERROR,STORAGE_DELETE_FAILED,STORAGE_DELETE_UNVERIFIED,STORAGE_OBJECT_STILL_PRESENT" && !deletedIds.some((id) => /k-(throws|error|stays|unverified)/.test(id)), recorded);

fs.rmSync(dir, { recursive: true, force: true });
console.log(`${passed} passed, ${failed} failed`);
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

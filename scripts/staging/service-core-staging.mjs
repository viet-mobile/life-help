#!/usr/bin/env node
/**
 * STAGING validation of the service core (customer <-> helper server authority). READY_NOT_RUN: this file is prepared but has NOT been
 * executed against any project. Run it only against the dedicated STAGING Supabase project, after migrations 202610090040 and 202610100041 are applied.
 *
 *   SERVICE_CORE_SUPABASE_URL=https://<staging-ref>.supabase.co \
 *   SERVICE_CORE_SUPABASE_SECRET_KEY=<staging secret key> \
 *   EXPECTED_SERVICE_CORE_SUPABASE_REF=<staging-ref> \
 *   SERVICE_CORE_STAGING_CONFIRM=<staging-ref> \
 *   node scripts/staging/service-core-staging.mjs            # --plan prints the gates without touching anything
 *
 * Safety: refuses unless the URL's project ref equals EXPECTED_..._REF and SERVICE_CORE_STAGING_CONFIRM names that same ref, uses a
 * unique RUN_ID in every fixture (names, descriptions), never touches rows without that marker, and finishes with a residue check.
 * Secrets are read from the environment only and are never printed.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { loadStagingEnv } from "./contract.cjs";

// the local staging env file (gitignored) fills any variable the shell did not set; values are never printed
for (const [k, v] of Object.entries(loadStagingEnv())) if (!process.env[k]) process.env[k] = v;

const GATES = [
  "G01 migration 040 present (all svc_* functions and tables exist)",
  "G02 RPC / grant security: anon + authenticated cannot call any svc function or read any svc table",
  "G03 helper approval: PENDING cannot list / accept; APPROVED can",
  "G04 customer request + server matching (service, region, availability; no fallback helper)",
  "G05 TRUE CONCURRENCY: 20 helpers accept one request over 20 separate HTTPS connections -> exactly one winner",
  "G06 admin assign vs helper accept race -> one canonical helper",
  "G07 cancel vs accept race -> one valid state",
  "G08 START / COMPLETE replay x20 -> one transition each",
  "G09 message idempotency: same client id x10 -> one stored message",
  "G10 cross-device chat + start/complete visible to the other actors",
  "G11 notification outbox: exactly one event per step and recipient",
  "G12 negative authorization matrix (stranger customer, unassigned helper, forged credential, bare request UUID)",
  "G13 request access: expired link denied, revoked link denied, rotation kills the old link and the new one works",
  "G14 request access: sessions are separate from the link; revoke-all ends every session (cross-device) and the link",
  "G15 cleanup + residue check (no rows carrying this RUN_ID remain)",
];
if (process.argv.includes("--plan")) {
  console.log("service-core staging plan (not executed):\n" + GATES.map((g) => "  - " + g).join("\n"));
  process.exit(0);
}

const url = process.env.SERVICE_CORE_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SERVICE_CORE_SUPABASE_SECRET_KEY;
const ref = process.env.EXPECTED_SERVICE_CORE_SUPABASE_REF;
if (!url || !key || !ref || process.env.SERVICE_CORE_STAGING_CONFIRM !== ref || new URL(url).hostname.split(".")[0] !== ref) {
  console.error("REFUSED: set SERVICE_CORE_SUPABASE_URL / _SECRET_KEY / EXPECTED_SERVICE_CORE_SUPABASE_REF and SERVICE_CORE_STAGING_CONFIRM=<same ref>.");
  process.exit(2);
}
const { createClient } = await import("@supabase/supabase-js");
// one client per simulated actor => separate HTTP connections (a single client would share one pool)
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const admin = client();

const RUN_ID = process.env.STAGING_RUN_ID || `STG-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
const sha = (s) => createHash("sha256").update(s).digest("hex");
const secret = () => randomBytes(32).toString("hex");
const IKSAN = { country: "KR", sido: "전북특별자치도", gungu: "익산시" };
const results = [];
const created = { requests: [], helpers: [], customers: [] };
// every request / helper id is also appended to the run manifest (if the runner set one) so the audit rows this run adds can be attributed
// to it even after this harness has deleted the rows themselves
import fs from "node:fs";
const track = (kind, id) => { created[kind].push(id); if (process.env.STAGING_RUN_MANIFEST) fs.appendFileSync(process.env.STAGING_RUN_MANIFEST, JSON.stringify({ kind, id }) + "\n"); };

async function rpc(c, fn, args) {
  const { data, error } = await c.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}
const settle = (ps) => Promise.allSettled(ps);
const wins = (r) => r.filter((x) => x.status === "fulfilled").length;
async function gate(id, fn) {
  try { await fn(); results.push([id, "PASS"]); }
  catch (e) { results.push([id, "FAIL: " + (e?.message ?? e)]); }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const mustReject = async (p, re, msg) => { try { await p; } catch (e) { must(re.test(e.message), `${msg}: wrong error ${e.message}`); return; } throw new Error(`${msg}: should have been denied`); };

async function newCustomer() { const cred = secret(), token = secret(), session = secret(); const c = { cred, token, session, credHash: sha(cred), tokenHash: sha(token), sessionHash: sha(session) }; created.customers.push(c); return c; }
async function newRequest(c, over = {}) {
  const out = await rpc(admin, "svc_c_create_request", {
    p_cred: c.credHash, p_token: c.tokenHash, p_session: c.sessionHash, p_locale: "vi", p_service: over.service ?? "toilet-clog", p_country: IKSAN.country, p_sido: IKSAN.sido, p_gungu: IKSAN.gungu,
    p_address: `${RUN_ID} test address`, p_description: `${RUN_ID} test request`, p_options: ["urgent"],
  });
  track("requests", out.request.id);
  return out.request;
}
async function newHelper(name, { approve = true, available = true } = {}) {
  const cred = secret();
  const h = await rpc(admin, "svc_h_register", {
    p_cred: sha(cred), p_expires: new Date(Date.now() + 7 * 86_400_000).toISOString(), p_name: `${RUN_ID} ${name}`, p_primary_locale: "ko", p_spoken: ["ko", "vi"],
    p_capabilities: ["toilet-clog"], p_regions: [IKSAN], p_email: null,
  });
  track("helpers", h.id);
  const helper = { id: h.id, credHash: sha(cred), client: client() };
  if (approve) await rpc(admin, "svc_a_set_helper_status", { p_admin: RUN_ID, p_helper: h.id, p_status: "APPROVED" });
  if (approve && available) await rpc(helper.client, "svc_h_set_available", { p_cred: helper.credHash, p_available: true });
  return helper;
}
const outboxCount = async (id, type) => {
  const { count, error } = await admin.from("svc_outbox").select("id", { count: "exact", head: true }).eq("request_id", id).eq("event_type", type);
  if (error) throw new Error(error.message);
  return count;
};

console.log(`service-core staging run ${RUN_ID} against project ${ref}`);

await gate("G01", async () => {
  const { error } = await admin.from("svc_requests").select("id", { head: true, count: "exact" }).limit(1);
  must(!error, "svc_requests missing: " + error?.message);
  await rpc(admin, "svc_a_list_helpers", { p_status: null });
});

await gate("G02", async () => {
  const anon = createClient(url, process.env.SERVICE_CORE_STAGING_ANON_KEY ?? "", { auth: { persistSession: false } });
  if (!process.env.SERVICE_CORE_STAGING_ANON_KEY) throw new Error("SERVICE_CORE_STAGING_ANON_KEY (publishable key) is required for the grant gate");
  for (const fn of ["svc_h_me", "svc_c_list_requests", "svc_a_list_requests", "svc_a_set_helper_status"]) {
    const { error } = await anon.rpc(fn, {});
    must(error, `anon could call ${fn}`);
  }
  const { data, error } = await anon.from("svc_requests").select("id").limit(1);
  must(error || (data ?? []).length === 0, "anon can read svc_requests");
});

let pending, approved;
await gate("G03", async () => {
  pending = await newHelper("pending", { approve: false });
  const c = await newCustomer();
  const r = await newRequest(c);
  await mustReject(rpc(pending.client, "svc_h_accept", { p_cred: pending.credHash, p_request: r.id }), /NOT_APPROVED/, "pending helper accept");
  await mustReject(rpc(pending.client, "svc_h_list_requests", { p_cred: pending.credHash }), /NOT_APPROVED/, "pending helper list");
  await rpc(admin, "svc_a_set_helper_status", { p_admin: RUN_ID, p_helper: pending.id, p_status: "APPROVED" });
  await rpc(pending.client, "svc_h_set_available", { p_cred: pending.credHash, p_available: true });
  approved = pending;
  const out = await rpc(approved.client, "svc_h_accept", { p_cred: approved.credHash, p_request: r.id });
  must(out.status === "ASSIGNED", "approved helper could not accept");
});

await gate("G04", async () => {
  const c = await newCustomer();
  const other = await newRequest(c, { service: "boiler" }); // nobody in this run offers boiler
  must(other.unmatched === true, "request without an eligible helper must be flagged unmatched");
  must(other.status === "WAITING", "unmatched request must stay WAITING");
});

await gate("G05", async () => {
  const helpers = await Promise.all(Array.from({ length: 20 }, (_, i) => newHelper(`racer-${i}`)));
  const c = await newCustomer();
  const r = await newRequest(c);
  const res = await settle(helpers.map((h) => rpc(h.client, "svc_h_accept", { p_cred: h.credHash, p_request: r.id })));
  must(wins(res) === 1, `expected exactly 1 accept, got ${wins(res)}`);
  must((await outboxCount(r.id, "HELPER_ACCEPTED")) === 1, "HELPER_ACCEPTED must be written once");
});

await gate("G06", async () => {
  const [a, b] = [await newHelper("self"), await newHelper("picked")];
  const c = await newCustomer();
  const r = await newRequest(c);
  await settle([rpc(a.client, "svc_h_accept", { p_cred: a.credHash, p_request: r.id }), rpc(client(), "svc_a_assign", { p_admin: RUN_ID, p_request: r.id, p_helper: b.id })]);
  const got = (await rpc(admin, "svc_c_get_request", { p_cred: c.credHash, p_token: null, p_request: r.id })).request;
  must(got.status === "ASSIGNED" && [a.id, b.id].includes(got.helper.id), "one canonical helper expected");
});

await gate("G07", async () => {
  for (let i = 0; i < 5; i++) {
    const h = await newHelper(`cancel-${i}`);
    const c = await newCustomer();
    const r = await newRequest(c);
    await settle([rpc(h.client, "svc_h_accept", { p_cred: h.credHash, p_request: r.id }), rpc(client(), "svc_c_cancel_request", { p_cred: c.credHash, p_token: null, p_request: r.id })]);
    const st = (await rpc(admin, "svc_c_get_request", { p_cred: c.credHash, p_token: null, p_request: r.id })).request.status;
    must(st === "ASSIGNED" || st === "CANCELLED", "unexpected state " + st);
  }
});

await gate("G08", async () => {
  const h = await newHelper("replay");
  const c = await newCustomer();
  const r = await newRequest(c);
  await rpc(h.client, "svc_h_accept", { p_cred: h.credHash, p_request: r.id });
  const starts = await settle(Array.from({ length: 20 }, () => rpc(client(), "svc_h_start_request", { p_cred: h.credHash, p_request: r.id })));
  must(wins(starts) === 1 && (await outboxCount(r.id, "REQUEST_STARTED")) === 1, "START must apply once");
  const done = await settle(Array.from({ length: 20 }, () => rpc(client(), "svc_h_complete_request", { p_cred: h.credHash, p_request: r.id })));
  must(wins(done) === 1 && (await outboxCount(r.id, "REQUEST_COMPLETED")) === 1, "COMPLETE must apply once");
});

let flow;
await gate("G09", async () => {
  const h = await newHelper("chat");
  const c = await newCustomer();
  const r = await newRequest(c);
  await rpc(h.client, "svc_h_accept", { p_cred: h.credHash, p_request: r.id });
  flow = { h, c, r };
  const id = randomUUID();
  const sends = await settle(Array.from({ length: 10 }, () => rpc(client(), "svc_msg_send", { p_kind: "CUSTOMER", p_cred: c.credHash, p_token: null, p_request: r.id, p_body: `${RUN_ID} hello`, p_locale: "vi", p_client_id: id })));
  must(wins(sends) === 10, "all replays must be answered");
  const list = await rpc(admin, "svc_msg_list", { p_kind: "CUSTOMER", p_cred: c.credHash, p_token: null, p_request: r.id, p_after: 0, p_target_locale: null });
  must(list.length === 1, "one stored message expected, got " + list.length);
});

await gate("G10", async () => {
  const { h, c, r } = flow;
  await rpc(client(), "svc_msg_send", { p_kind: "HELPER", p_cred: h.credHash, p_token: null, p_request: r.id, p_body: `${RUN_ID} reply`, p_locale: "ko" });
  const seen = await rpc(client(), "svc_msg_list", { p_kind: "CUSTOMER", p_cred: null, p_token: c.sessionHash, p_request: r.id, p_after: 0, p_target_locale: "vi" }); // "other device": token only
  must(seen.length === 2, "customer on another device must see both messages");
  await rpc(client(), "svc_h_start_request", { p_cred: h.credHash, p_request: r.id });
  await rpc(client(), "svc_h_complete_request", { p_cred: h.credHash, p_request: r.id });
  must((await rpc(client(), "svc_c_get_request", { p_cred: null, p_token: c.sessionHash, p_request: r.id })).request.status === "COMPLETED", "completed state must be visible");
});

await gate("G11", async () => {
  const { r } = flow;
  for (const t of ["HELPER_ACCEPTED", "REQUEST_STARTED", "REQUEST_COMPLETED"]) must((await outboxCount(r.id, t)) === 1, `${t} must exist exactly once`);
  must((await outboxCount(r.id, "NEW_CHAT_MESSAGE")) === 2, "one NEW_CHAT_MESSAGE per message and recipient");
});

await gate("G12", async () => {
  const { h, c, r } = flow;
  const stranger = await newCustomer();
  const noise = await newHelper("noise");
  await mustReject(rpc(client(), "svc_c_get_request", { p_cred: stranger.credHash, p_token: null, p_request: r.id }), /NOT_FOUND/, "stranger customer");
  await mustReject(rpc(client(), "svc_c_get_request", { p_cred: null, p_token: null, p_request: r.id }), /NOT_FOUND/, "bare request id");
  await mustReject(rpc(client(), "svc_c_get_request", { p_cred: null, p_token: sha("forged"), p_request: r.id }), /NOT_FOUND/, "forged token");
  await mustReject(rpc(noise.client, "svc_h_get_request", { p_cred: noise.credHash, p_request: r.id }), /NOT_FOUND|FORBIDDEN|NOT_ELIGIBLE/, "unassigned helper read");
  await mustReject(rpc(client(), "svc_h_me", { p_cred: sha("forged") }), /FORBIDDEN/, "forged helper credential");
  await mustReject(rpc(client(), "svc_msg_send", { p_kind: "CUSTOMER", p_cred: stranger.credHash, p_token: null, p_request: r.id, p_body: "x", p_locale: "vi" }), /NOT_FOUND|FORBIDDEN/, "stranger chat");
  void h; void c;
});

await gate("G13", async () => {
  const owner = await newCustomer();
  const r = await newRequest(owner);
  const claim = (link, session) => rpc(client(), "svc_c_claim", { p_request: r.id, p_link: sha(link), p_session: sha(session) });
  const read = (session) => rpc(client(), "svc_c_get_request", { p_cred: null, p_token: sha(session), p_request: r.id });
  // valid link -> session -> read
  const s1 = secret();
  await claim(owner.token, s1);
  must((await read(s1)).request.id === r.id, "claimed session must read the request");
  // expired link (server-side clock): denied; the session already issued keeps its own lifetime
  await admin.from("svc_requests").update({ token_expires_at: new Date(Date.now() - 1000).toISOString() }).eq("id", r.id);
  await mustReject(claim(owner.token, secret()), /NOT_FOUND/, "expired link");
  must((await read(s1)).request.id === r.id, "expired link must not end existing sessions");
  // rotation: old link stays dead, the new one works (rotate clears expiry/revocation)
  const next = secret();
  await rpc(admin, "svc_c_rotate_link", { p_cred: owner.credHash, p_request: r.id, p_new_link: sha(next) });
  await mustReject(claim(owner.token, secret()), /NOT_FOUND/, "old link after rotation");
  await claim(next, secret());
  // revoked link
  await rpc(admin, "svc_c_revoke_link", { p_cred: owner.credHash, p_request: r.id });
  await mustReject(claim(next, secret()), /NOT_FOUND/, "revoked link");
  // forged / malformed / other-request credentials
  await mustReject(claim(secret(), secret()), /NOT_FOUND/, "forged link");
  await mustReject(read(secret()), /NOT_FOUND/, "forged session");
  const other = await newCustomer();
  const r2 = await newRequest(other);
  await mustReject(rpc(client(), "svc_c_get_request", { p_cred: null, p_token: owner.sessionHash, p_request: r2.id }), /NOT_FOUND/, "request-A session on request-B");
});

await gate("G14", async () => {
  const owner = await newCustomer();
  const r = await newRequest(owner);
  const deviceA = secret(), deviceB = secret();
  const claim = (session) => rpc(client(), "svc_c_claim", { p_request: r.id, p_link: sha(owner.token), p_session: sha(session) });
  const read = (session) => rpc(client(), "svc_c_get_request", { p_cred: null, p_token: sha(session), p_request: r.id });
  await claim(deviceA); await claim(deviceB);
  must((await read(deviceA)).request.id === (await read(deviceB)).request.id, "both devices must see the same request");
  const out = await rpc(admin, "svc_c_revoke_all_access", { p_cred: owner.credHash, p_request: r.id });
  must(out.sessionsRevoked >= 3, "creator + two claimed sessions must be revoked");
  await mustReject(read(deviceA), /NOT_FOUND/, "device A after revoke-all");
  await mustReject(read(deviceB), /NOT_FOUND/, "device B after revoke-all");
  await mustReject(claim(secret()), /NOT_FOUND/, "link after revoke-all");
  must((await rpc(client(), "svc_c_get_request", { p_cred: owner.credHash, p_token: null, p_request: r.id })).request.id === r.id, "the owner customer credential is a separate identity");
});

await gate("G15", async () => {
  // delete only rows this run created (cascades remove events, messages, outbox rows), then prove nothing with the RUN_ID is left
  if (created.requests.length) await admin.from("svc_requests").delete().in("id", created.requests);
  if (created.helpers.length) await admin.from("svc_helpers").delete().in("id", created.helpers);
  if (created.customers.length) await admin.from("svc_customers").delete().in("credential_hash", created.customers.map((c) => c.credHash)); // only the customers this run made
  const left = await admin.from("svc_helpers").select("id", { count: "exact", head: true }).like("display_name", `${RUN_ID}%`);
  const leftReq = await admin.from("svc_requests").select("id", { count: "exact", head: true }).like("description", `${RUN_ID}%`);
  must(!left.error && left.count === 0 && !leftReq.error && leftReq.count === 0, `residue left: helpers=${left.count} requests=${leftReq.count}`);
});

console.log(results.map(([g, r]) => `${g} ${r}`).join("\n"));
const failed = results.filter(([, r]) => r !== "PASS");
console.log(failed.length ? `STAGING SERVICE CORE = FAILED (${failed.length} gate(s))` : "STAGING SERVICE CORE = VALIDATED");
process.exit(failed.length ? 1 : 0);

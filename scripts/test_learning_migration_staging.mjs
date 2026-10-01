// Live STAGING verification of migrations 202609300024 (learning platform) and 202609300025 (learn_load_content).
// Run ONLY after those two migrations have been applied to the staging project, and only with explicit approval.
// Same behavioural gate as the deterministic scripts/test_learning_migration_db.mjs (scripts/lib/learningGate.mjs), over
// real PostgREST: service key / anon key / real Auth user JWTs. Catalog-level facts (RLS flags, SECURITY DEFINER,
// search_path, policies, grants) are checked afterwards by the read-only probe supabase/diagnostics/*.sql.
//
//   --phase=pre   READ-ONLY. Confirms 024 / 025 are NOT yet applied (learn tables / RPCs absent). Creates nothing.
//   --phase=gate  (default) creates purgeable fixtures only: 3 Auth users (cascade-deletes every learn_* student row) and a
//                 handful of content rows written by the trusted server key / a STAFF fixture, all deleted afterwards.
//                 No admin_audit_logs or other immutable table is written. No Worker, no chain, no money.
// Usage: node scripts/test_learning_migration_staging.mjs [--phase=pre|gate]
import crypto from "node:crypto";
import { runGuarded, stagingTarget } from "./lib/envGuard.mjs";
import { LEARN_TABLES, learningGate } from "./lib/learningGate.mjs";

// Fail-closed tripwire: staging Supabase only (production refs refused), verified before any request is sent.
const { env, supabaseUrl } = await runGuarded("staging target", () => stagingTarget());
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY, anonKey = env.TEST_SUPABASE_ANON_KEY;
if (!serviceKey || !anonKey) throw new Error("staging service key and anon key are required");
const phase = process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "gate";
const results = [];
const record = (status, name, detail = "") => { results.push(status); console.log(`${status} ${name}${detail ? ` ${detail}` : ""}`); };
const expect = (name, condition, detail) => record(condition ? "PASS" : "FAIL", name, condition ? "" : (typeof detail === "string" ? detail : JSON.stringify(detail ?? "")).slice(0, 400));
const notTestable = (name, reason) => record("NOT_TESTABLE", name, reason);

const readBody = async (response) => { const text = await response.text(); try { return text ? JSON.parse(text) : null; } catch { return { raw: text.slice(0, 200) }; } };
const headersFor = (actor) => {
  const token = actor === "anon" ? anonKey : actor === "service" ? serviceKey : actor.token;
  return { apikey: actor === "service" ? serviceKey : anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" };
};
async function call(actor, pathname, method = "GET", body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: headersFor(actor), body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readBody(response);
  if (response.ok) return { status: "ok", rows: Array.isArray(value) ? value : [], data: value };
  const denied = response.status === 401 || response.status === 403 || value?.code === "42501";
  return { status: denied ? "denied" : "error", httpStatus: response.status, code: value?.code, message: String(value?.message ?? value?.raw ?? "").slice(0, 200) };
}
const qs = (filter) => Object.entries(filter).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
const authAdmin = async (pathname, method = "GET", body) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${pathname}`, { method, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readBody(response);
  if (!response.ok) throw new Error(`auth ${method} ${pathname.split("/")[0]} ${response.status}`);
  return value;
};
const runId = `LG${Date.now()}`;
const created = [];

const backend = {
  select: (actor, table, filter = {}, { limit } = {}) => call(actor, `${table}?select=*${Object.keys(filter).length ? `&${qs(filter)}` : ""}${limit ? `&limit=${limit}` : ""}`),
  insert: (actor, table, row) => call(actor, table, "POST", row),
  update: (actor, table, set, filter) => call(actor, `${table}?${qs(filter)}`, "PATCH", set),
  del: (actor, table, filter) => call(actor, `${table}?${qs(filter)}`, "DELETE"),
  rpc: async (actor, fn, args) => { const r = await call(actor, `rpc/${fn}`, "POST", args); return r.status === "ok" ? { status: "ok", data: r.data } : r; },
  createUser: async (label) => {
    const email = `${label}.${runId.toLowerCase()}@example.test`, password = `LH-${crypto.randomUUID()}!`;
    const user = await authAdmin("users", "POST", { email, password, email_confirm: true });
    created.push(user.id);
    const session = await readBody(await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }));
    if (!session?.access_token) throw new Error(`fixture sign-in failed for ${label}`);
    return { id: user.id, token: session.access_token, label };
  },
  makeStaff: async (user) => {
    const p = await call("service", "profiles", "POST", { id: user.id, display_name: "learning gate staff" });
    const r = await call("service", "user_roles", "POST", { user_id: user.id, role: "STAFF" });
    if (p.status !== "ok" || r.status !== "ok") throw new Error(`staff fixture refused: ${p.status}/${r.status}`);
  },
  catalog: undefined, // not reachable over PostgREST
  purge: async () => {
    // Deleting the Auth users cascades profiles, roles and every learn_* student row.
    for (const id of created) await authAdmin(`users/${id}`, "DELETE").catch(() => null);
    const left = [];
    for (const t of LEARN_TABLES) {
      const r = await call("service", `${t}?select=*&limit=1000`);
      const rows = (r.rows ?? []).filter((row) => row.user_id && created.includes(row.user_id));
      if (rows.length) left.push(`${t}=${rows.length}`);
    }
    expect("PURGE. no fixture student rows are left in any learn_* table", left.length === 0, left);
  },
};

if (phase === "pre") {
  const probes = [];
  for (const t of ["learn_countries", "learn_questions", "learn_xp_ledger"]) probes.push([t, (await call("service", `${t}?select=*&limit=1`)).status]);
  const rpc = await call("service", "rpc/learn_load_content", "POST", { p_subject: "math" });
  expect("PRE. migrations 024 / 025 are NOT applied yet (learn tables and learn_load_content absent)", probes.every(([, s]) => s === "error") && rpc.status === "error", { probes, rpc: rpc.status });
} else if (phase === "gate") {
  await learningGate(backend, { expect, notTestable });
} else throw new Error(`unknown phase ${phase}`);

const counts = Object.fromEntries(["PASS", "FAIL", "NOT_TESTABLE"].map((s) => [s, results.filter((v) => v === s).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
process.exit(counts.FAIL ? 1 : 0);

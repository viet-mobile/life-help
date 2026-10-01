// Live STAGING verification of migrations 202609300024 (learning platform) and 202609300025 (learn_load_content).
// Run ONLY after those two migrations have been applied to the staging project, and only with explicit approval.
// Same behavioural gate as the deterministic scripts/test_learning_migration_db.mjs (scripts/lib/learningGate.mjs), over
// real PostgREST: service key / anon key / real Auth user JWTs. Catalog-level facts (RLS flags, SECURITY DEFINER,
// search_path, policies, grants) are checked afterwards by the read-only probe supabase/diagnostics/*.sql.
//
//   --phase=pre   READ-ONLY (GET only). Before 023 / 026 are applied on a project that has 024 / 025: learn tables present, learn_staff_users absent.
//   --phase=gate  (default) creates purgeable fixtures only: 3 Auth users (cascade-deletes every learn_* student row) and a
//                 handful of content rows written by the trusted server key / a STAFF fixture, all deleted afterwards.
//                 No admin_audit_logs or other immutable table is written. No Worker, no chain, no money.
// Usage: node scripts/test_learning_migration_staging.mjs [--phase=pre|gate]
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { runGuarded, stagingTarget } from "./lib/envGuard.mjs";
import { LEARN_TABLES, learningGate } from "./lib/learningGate.mjs";

// Fail-closed tripwire: staging Supabase only (production refs refused), verified before any request is sent.
const { env, supabaseUrl } = await runGuarded("staging target", () => stagingTarget());
const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY; // secret key (sb_secret_...) or legacy service_role JWT: REQUIRED for every phase
if (!serviceKey) throw new Error("TEST_SUPABASE_SERVICE_ROLE_KEY (the staging secret key) is required");
const phase = process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "gate";
const anonKey = env.TEST_SUPABASE_ANON_KEY; // publishable key: REQUIRED ONLY for --phase=gate (user sign-in + anon / student requests)
if (phase === "gate" && !anonKey) throw new Error("--phase=gate needs TEST_SUPABASE_ANON_KEY (the publishable key)");
const results = [];
const record = (status, name, detail = "") => { results.push(status); console.log(`${status} ${name}${detail ? ` ${detail}` : ""}`); };
const expect = (name, condition, detail) => record(condition ? "PASS" : "FAIL", name, condition ? "" : (typeof detail === "string" ? detail : JSON.stringify(detail ?? "")).slice(0, 400));
const notTestable = (name, reason) => record("NOT_TESTABLE", name, reason);

const readBody = async (response) => { const text = await response.text(); try { return text ? JSON.parse(text) : null; } catch { return { raw: text.slice(0, 200) }; } };
// New-format keys (sb_secret_ / sb_publishable_) are not JWTs: they go in `apikey` only. Legacy JWT keys also go in Authorization.
const headersFor = (actor) => {
  const key = actor === "service" ? serviceKey : anonKey;
  const headers = { apikey: key, "Content-Type": "application/json", Prefer: "return=representation" };
  if (actor !== "anon" && actor !== "service") return { ...headers, Authorization: `Bearer ${actor.token}` };
  return String(key).startsWith("sb_") ? headers : { ...headers, Authorization: `Bearer ${key}` };
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
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${pathname}`, { method, headers: { apikey: serviceKey, ...(String(serviceKey).startsWith("sb_") ? {} : { Authorization: `Bearer ${serviceKey}` }), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await readBody(response);
  if (!response.ok) throw new Error(`auth ${method} ${pathname.split("/")[0]} ${response.status}`);
  return value;
};
const STAGING_REF = "wreebowcbiymodswajwe"; // pinned: the fixture SQL is executed only on the staging project
if (!supabaseUrl.includes(STAGING_REF)) throw new Error("not the staging project");
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
  // Learning staff = a row in public.learn_staff_users. The API roles (incl. the server key) cannot write that table by design
  // (migration 202609300026), so the fixture row is granted the way production staff are: as the database owner, through the
  // Management API (`supabase db query`). It is purgeable: the row cascades away when the Auth user is deleted.
  makeStaff: async (user) => {
    if (!/^[0-9a-f-]{36}$/.test(user.id)) throw new Error("unexpected user id");
    const sql = `insert into public.learn_staff_users (user_id, role, note) values ('${user.id}', 'EDITOR', 'learning gate fixture')`;
    execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "supabase@2.119.0", "db", "query", "--linked", "--project-ref", STAGING_REF, sql], { stdio: "pipe", shell: process.platform === "win32" });
  },
  // PostgREST only serves schemas listed in db-schemas (public, graphql_public). A function in learn_security must not be callable.
  rpcInSchema: async (actor, schema, fn, args) => {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...headersFor(actor), "Content-Profile": schema, "Accept-Profile": schema }, body: JSON.stringify(args) });
    const value = await readBody(response);
    if (response.ok) return { status: "ok", data: value };
    return { status: response.status === 401 || response.status === 403 ? "denied" : "error", httpStatus: response.status, code: value?.code };
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
  // READ-ONLY by construction: only HTTP GET requests (PostgREST allows GET on tables and on STABLE functions only).
  // State before 023 / 026 are applied to a project that already has 024 / 025: the learning tables exist, the self-contained
  // authorization objects do not yet.
  const control = await call("service", "helpers?select=id&limit=1");
  expect("PRE-0. control: the staging secret key can read an existing table (credentials work; nothing is printed)", control.status === "ok", { status: control.status, http: control.httpStatus });
  const present = [];
  for (const t of ["learn_countries", "learn_questions", "learn_xp_ledger"]) present.push([t, (await call("service", `${t}?select=*&limit=1`)).status]);
  const staff = await call("service", "learn_staff_users?select=*&limit=1");
  expect("PRE-1. 024 / 025 are applied (learn tables readable) and 026 is NOT yet applied (learn_staff_users absent, HTTP 404)", present.every(([, st]) => st === "ok") && staff.httpStatus === 404, { present, staff: staff.httpStatus });
} else if (phase === "gate") {
  await learningGate(backend, { expect, notTestable });
} else throw new Error(`unknown phase ${phase}`);

const counts = Object.fromEntries(["PASS", "FAIL", "NOT_TESTABLE"].map((s) => [s, results.filter((v) => v === s).length]));
console.log(`SUMMARY ${JSON.stringify(counts)}`);
process.exit(counts.FAIL ? 1 : 0);

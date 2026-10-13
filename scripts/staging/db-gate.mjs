#!/usr/bin/env node
/**
 * Read-only staging DB gate (no mutation).
 *   structure  (elevated SERVICE_CORE_SUPABASE_SECRET_KEY, GET /rest/v1/ OpenAPI): API postconditions of the integrated tree's migrations,
 *              including learning foundation and figure/elective columns; migration history is NOT inferred; service_role reaches every intended API object. The OpenAPI document is
 *              structural discovery ONLY: PostgREST lists functions regardless of EXECUTE, so presence there is never evidence of authority.
 *   internals  every svc__* function is CALLED with the elevated key (apikey header, exact parameter names, null values) and must be refused
 *              with a permission-denied-for-function error. A 2xx, an invalid-key answer, a wrong call shape (404), a malformed body or a
 *              network failure is a FAIL, never a pass.
 *   key        SERVICE_CORE_STAGING_ANON_KEY is validated through the public Auth settings endpoint (modern sb_publishable_* keys are NOT
 *              valid proof via the OpenAPI root, and are never sent as a Bearer token: sb_* keys go in `apikey` only)
 *   denial     with that publishable key every learning / service-core / entitlement table and service-core / entitlement function is CALLED DIRECTLY and must be refused by
 *              PostgREST with a permission error (401/403 + 42501). A 2xx (even an empty array), a network failure, an invalid-key
 *              answer or a wrong-project key is never a pass.
 *   --snapshot <file>: row counts of the tables a run may touch (foreign-row baseline for the cleanup step)
 * Catalog details (SECURITY DEFINER, empty search_path, owner, no dynamic SQL) are proven on the identical migration files by
 * tests/service/db-service-hardening.test.ts; PostgREST cannot read pg_catalog.
 * Exit: 0 pass | 4 migrations pending | 6 elevated credential rejected (DB_GATE_BLOCKED_AUTH) | 3 missing env | 2 refused | 1 gate failure
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, STAGING_REF, loadStagingEnv, preflight, refOfUrl } from "./contract.cjs";
import { auditBaseline, readAuditRows } from "./audit.mjs";

// These files have observable API postconditions. This is NOT a migration-history audit.
export const REQUIRED = ["202609300024_learning_platform.sql", "202609300025_learning_content_rpc.sql", "202609300026_learning_selfcontained_auth.sql", "202610070028_learning_korean_study.sql", "202610080029_learning_entitlements.sql", "202610090040_service_core.sql", "202610100041_service_request_access.sql", "202610110042_service_core_internal_rpc_lockdown.sql", "202610130043_learning_question_figure.sql"];
// Their deployed postconditions require pg_catalog access, not OpenAPI inference.
export const CATALOG_ONLY = ["202609300023_learning_prereq_shim.sql", "202609300027_learning_elementary_grades.sql"];
const TRIGGER_FUNCTIONS = new Set(["learn_enforce_publish_flow"]);
const REQUIRED_COLUMNS = { "202610130043_learning_question_figure.sql": [["learn_questions", "figure"], ["learn_courses", "elective"]] };
// svc_audit is append-only: it gets an identity-level baseline below, not row-count equality.
const SNAPSHOT_TABLES = ["svc_customers", "svc_helpers", "svc_requests", "svc_request_sessions", "svc_messages", "svc_outbox", "learn_entitlements", "learn_student_profiles"];

/** modern sb_* keys travel in `apikey` only; legacy JWT keys are also sent as the Authorization bearer (the user-JWT slot) */
export const keyHeaders = (key) => ({ apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) });

/** Tables and functions a migration file creates in schema public (last definition of a function wins: 041 replaces a 040 function). */
export function objectsOf(file, root = ROOT) {
  const sql = fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8");
  const tables = [...sql.matchAll(/create table (?:if not exists )?public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
  const fns = new Map();
  for (const m of sql.matchAll(/create (?:or replace )?function public\.([a-z0-9_]+)\s*\(/gi)) {
    let depth = 1, i = m.index + m[0].length, cur = "";
    const parts = [];
    for (; i < sql.length && depth > 0; i++) {
      const c = sql[i];
      if (c === "(") depth++;
      if (c === ")") { depth--; if (depth === 0) break; }
      if (c === "," && depth === 1) { parts.push(cur); cur = ""; } else cur += c;
    }
    parts.push(cur);
    fns.set(m[1], parts.map((p) => p.trim().split(/\s+/)[0]).filter((n) => n && !/^(in|out|inout|variadic)$/i.test(n)));
  }
  return { tables, fns };
}

const isPermissionDenied = (status, body) =>
  (status === 401 || status === 403) && !!body && typeof body === "object" && (body.code === "42501" || /permission denied/i.test(String(body.message ?? "")));
const looksLikeKeyRejection = (body) => !!body && /invalid api key|invalid jwt|jwt|apikey/i.test(String(body.message ?? body.msg ?? body.hint ?? ""));
const jsonOf = async (r) => { try { return await r.json(); } catch { return null; } };

/** Injectable core: fetchImpl is the network, env the staging env. Never throws; returns { code, lines }. */
export async function runDbGate({ fetchImpl = fetch, env, snapshotFile = "", root = ROOT }) {
  const lines = [];
  const say = (s) => lines.push(s);
  const done = (code) => ({ code, lines });
  const pf = preflight(env);
  if (pf.status === "BLOCKED_MISSING_ENV") { say("BLOCKED_MISSING_ENV"); return done(3); }
  if (pf.status !== "READY") { say("REFUSED: identity guard failed"); return done(2); }
  const url = env.SERVICE_CORE_SUPABASE_URL.replace(/\/$/, "");
  if (refOfUrl(url) !== STAGING_REF) { say("REFUSED: target is not the staging project"); return done(2); }
  const secretKey = env.SERVICE_CORE_SUPABASE_SECRET_KEY;
  const pubKey = env.SERVICE_CORE_STAGING_ANON_KEY;
  const svc = keyHeaders(secretKey);
  const pub = { apikey: pubKey }; // publishable / anon: the apikey header only, never an Authorization bearer
  let failed = 0;
  const gate = (name, ok, extra = "") => { say(`${ok ? "PASS" : "FAIL"} ${name}${ok || !extra ? "" : " :: " + extra}`); if (!ok) failed++; };

  // ---- structure, with the elevated key -------------------------------------------------------------------------------------
  let spec;
  try {
    const r = await fetchImpl(`${url}/rest/v1/`, { headers: { ...svc, Accept: "application/openapi+json" } });
    if (r.status === 401 || r.status === 403) { say(`DB_GATE_BLOCKED_AUTH: the staging credential was rejected (HTTP ${r.status}); nothing was read or changed`); return done(6); }
    if (!r.ok) { say(`INTEGRATED_STAGING_DB_GATE = FAIL: OpenAPI answered HTTP ${r.status}`); return done(1); }
    spec = await jsonOf(r);
  } catch { say("INTEGRATED_STAGING_DB_GATE = FAIL: staging unreachable"); return done(1); }
  if (!spec || typeof spec !== "object") { say("INTEGRATED_STAGING_DB_GATE = FAIL: OpenAPI response was not JSON"); return done(1); }
  const asService = new Set(Object.keys(spec.paths ?? {}).map((p) => p.replace(/^\/(rpc\/)?/, "")).filter(Boolean));
  const rpcParams = (fn) => Object.keys(spec.definitions?.[`(rpc) ${fn}`]?.properties ?? {});

  const visible = [], pending = [];
  const perFile = {};
  for (const f of REQUIRED) {
    const { tables, fns } = objectsOf(f, root);
    perFile[f] = { tables, fns };
    const api = [...tables, ...[...fns.keys()].filter((n) => !n.startsWith("svc__") && !TRIGGER_FUNCTIONS.has(n))];
    const missing = api.filter((n) => !asService.has(n));
    for (const [table, column] of REQUIRED_COLUMNS[f] ?? []) {
      const properties = spec.definitions?.[table]?.properties;
      if (!properties || !Object.hasOwn(properties, column)) missing.push(`${table}.${column}`);
    }
    (missing.length ? pending : visible).push(f);
    if (missing.length) say(`  ${f}: ${missing.length} object(s) not visible to service_role: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? ", ..." : ""}`);
  }
  say(`MIGRATIONS_REQUIRED = ${REQUIRED.join(", ")}`);
  say(`MIGRATION_OBJECTS_VISIBLE = ${visible.join(", ") || "none"}`);
  say(`MIGRATIONS_PENDING = ${pending.join(", ") || "none"}`);
  say("MIGRATION_HISTORY = NOT_VERIFIED (OpenAPI proves API postconditions only)");
  say(`CATALOG_REVIEW_REQUIRED = ${CATALOG_ONLY.join(", ")} (use scripts/staging/learning-catalog-readonly.sql; no remote catalog audit was performed here)`);
  if (pending.length) {
    say("BLOCKED_MIGRATIONS_PENDING: required API postconditions are missing. Compare migration history and deployed pg_catalog before planning any STAGING change; missing visibility is not proof a file should be reapplied. This runner never applies migrations.");
    return done(4);
  }

  const guarded = REQUIRED.filter((x) => /service|entitle/.test(x));
  const tables = [...new Set(REQUIRED.flatMap(f => perFile[f].tables))], apiFns = new Map(), internals = new Map();
  for (const f of guarded) {
    for (const [n, params] of perFile[f].fns) (n.startsWith("svc__") ? internals : apiFns).set(n, params);
  }
  gate(`service_role can reach every API object (${tables.length} learning / service tables, ${apiFns.size} service / entitlement functions)`, [...tables, ...apiFns.keys()].every((n) => asService.has(n)));

  // ---- the publishable key: valid for THIS project, and not a secret key ---------------------------------------------------------
  if (/^sb_secret_/.test(pubKey) || pubKey === secretKey) { gate("SERVICE_CORE_STAGING_ANON_KEY is a public key (not a secret key)", false, "a secret key was supplied in the public-key slot"); say("INTEGRATED_STAGING_DB_GATE = FAIL (PUBLISHABLE_KEY_INVALID)"); return done(1); }
  try {
    const r = await fetchImpl(`${url}/auth/v1/settings`, { headers: pub });
    gate("publishable key is valid for the staging project (Auth settings)", r.status === 200, `HTTP ${r.status}`);
    if (r.status !== 200) { say("INTEGRATED_STAGING_DB_GATE = FAIL (PUBLISHABLE_KEY_INVALID)"); return done(1); }
  } catch { gate("publishable key is valid for the staging project (Auth settings)", false, "network failure"); return done(1); }

  // ---- positive control: the elevated key really can read a privileged table (a denial below is therefore about the key) -----------
  try {
    const r = await fetchImpl(`${url}/rest/v1/svc_requests?select=id&limit=1`, { headers: svc });
    gate("positive control: elevated key reads svc_requests", r.status === 200 && Array.isArray(await jsonOf(r)), `HTTP ${r.status}`);
  } catch { gate("positive control: elevated key reads svc_requests", false, "network failure"); }

  try {
    const r = await fetchImpl(`${url}/rest/v1/rpc/svc_core_schema_version`, { method: "POST", headers: { ...svc, "Content-Type": "application/json" }, body: "{}" });
    const body = await jsonOf(r);
    gate("positive control: elevated key executes the external server API (svc_core_schema_version)", r.status === 200 && body === 42, `HTTP ${r.status}`);
  } catch { gate("positive control: elevated key executes the external server API (svc_core_schema_version)", false, "network failure"); }

  // Learning positive control reads no rows (column visibility alone is not a SELECT grant).
  try {
    const r = await fetchImpl(`${url}/rest/v1/learn_questions?select=id&limit=0`, { headers: svc });
    gate("positive control: elevated key reads learn_questions", r.status === 200 && Array.isArray(await jsonOf(r)), `HTTP ${r.status}`);
  } catch { gate("positive control: elevated key reads learn_questions", false, "network failure"); }

  // ---- service_role cannot EXECUTE any internal: proven by calling each one ------------------------------------------------------
  const internalDenial = [];
  for (const [fn, params] of internals) {
    const names = spec.definitions?.[`(rpc) ${fn}`] ? rpcParams(fn) : params; // the deployed shape when PostgREST knows it, else the migration's
    try {
      const r = await fetchImpl(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...svc, "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(names.map((p) => [p, null]))) });
      const body = await jsonOf(r);
      // only an unambiguous "permission denied for function" proves the missing EXECUTE; key rejection, 404 (wrong shape / unknown), 2xx, malformed: no
      const ok = (r.status === 401 || r.status === 403) && !!body && typeof body === "object" && /permission denied for function/i.test(String(body.message ?? "")) && (body.code === undefined || body.code === "42501");
      internalDenial.push([fn, ok, `HTTP ${r.status}${r.status >= 200 && r.status < 300 ? " (EXECUTED)" : ""}`]);
    } catch { internalDenial.push([fn, false, "network failure"]); }
  }
  gate(`service_role cannot EXECUTE any of the ${internals.size} svc__ internals (each called directly; permission denied for function)`, internalDenial.every((v) => v[1]), internalDenial.filter((v) => !v[1]).map((v) => `${v[0]}: ${v[2]}`).join("; "));

  // ---- anonymous denial, proven by direct calls ---------------------------------------------------------------------------------
  const tableVerdicts = [];
  for (const t of tables) {
    try {
      const r = await fetchImpl(`${url}/rest/v1/${t}?select=*&limit=0`, { headers: pub });
      const body = await jsonOf(r);
      const ok = isPermissionDenied(r.status, body) && !looksLikeKeyRejection({ message: body?.message?.replace?.(/permission denied[^]*/i, "") });
      tableVerdicts.push([t, ok, `HTTP ${r.status}${r.status >= 200 && r.status < 300 ? " (access NOT denied)" : ""}`]);
    } catch { tableVerdicts.push([t, false, "network failure"]); }
  }
  gate(`anon cannot read any of the ${tables.length} learning / service-core / entitlement tables (catalog, answers, progress, staff, svc_requests, sessions, entitlements, ...)`, tableVerdicts.every((v) => v[1]), tableVerdicts.filter((v) => !v[1]).map((v) => `${v[0]}: ${v[2]}`).join("; "));

  const rpcVerdicts = [];
  const callAnon = async (fn, params) => {
    const r = await fetchImpl(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...pub, "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(params.map((p) => [p, null]))) });
    return { status: r.status, body: await jsonOf(r) };
  };
  for (const [fn, params] of [...apiFns, ...internals]) {
    const internal = internals.has(fn);
    try {
      const { status, body } = await callAnon(fn, params);
      let ok = isPermissionDenied(status, body) && !looksLikeKeyRejection({ message: String(body?.message ?? "").replace(/permission denied[^]*/i, "") });
      // "not found in the schema cache" counts as a denial only when the call shape is proven right: an API function must carry exactly the
      // parameter names the elevated OpenAPI lists; an internal is absent for everybody by design
      if (!ok && status === 404 && body?.code === "PGRST202") {
        const shape = rpcParams(fn);
        ok = internal || (shape.length === params.length && params.every((p) => shape.includes(p)));
      }
      rpcVerdicts.push([fn, ok, `HTTP ${status}${status >= 200 && status < 300 ? " (access NOT denied)" : ""}`, internal]);
    } catch { rpcVerdicts.push([fn, false, "network failure", internal]); }
  }
  const adminHelper = rpcVerdicts.filter((v) => /^svc_(h|a)_/.test(v[0]));
  gate(`anon cannot invoke the ${adminHelper.length} privileged svc_h_* / svc_a_* functions`, adminHelper.every((v) => v[1]), adminHelper.filter((v) => !v[1]).map((v) => `${v[0]}: ${v[2]}`).join("; "));
  const others = rpcVerdicts.filter((v) => !/^svc_(h|a)_/.test(v[0]) && !v[3]);
  gate(`anon cannot invoke the ${others.length} other service-core / entitlement functions (customer, chat, notifications, learn_grant/revoke_entitlement)`, others.every((v) => v[1]), others.filter((v) => !v[1]).map((v) => `${v[0]}: ${v[2]}`).join("; "));
  const internalVerdicts = rpcVerdicts.filter((v) => v[3]);
  gate(`anon cannot invoke the ${internalVerdicts.length} internal svc__ functions`, internalVerdicts.every((v) => v[1]), internalVerdicts.filter((v) => !v[1]).map((v) => `${v[0]}: ${v[2]}`).join("; "));

  if (snapshotFile) {
    const counts = {};
    for (const t of SNAPSHOT_TABLES) {
      try {
        const r = await fetchImpl(`${url}/rest/v1/${t}?select=*`, { method: "HEAD", headers: { ...svc, Prefer: "count=exact", Range: "0-0" } });
        const m = (r.headers.get("content-range") ?? "").match(/\/(\d+)$/);
        if (!m) { gate(`row count of ${t}`, false, `HTTP ${r.status}`); continue; }
        counts[t] = Number(m[1]);
      } catch { gate(`row count of ${t}`, false, "network failure"); }
    }
    let audit = null;
    try {
      audit = auditBaseline(await readAuditRows((p, range) => fetchImpl(`${url}/rest/v1/${p}`, { headers: { ...svc, "Range-Unit": "items", Range: range } })));
      say(`audit baseline recorded: ${audit.count} svc_audit rows (append-only; identities and content hashed)`);
    } catch (e) { gate("svc_audit baseline", false, e instanceof Error ? e.message : "unreadable"); }
    fs.writeFileSync(snapshotFile, JSON.stringify({ at: new Date().toISOString(), counts, audit }));
    say(`baseline counts recorded for ${Object.keys(counts).length} tables`);
  }
  say(failed ? `INTEGRATED_STAGING_DB_GATE = FAIL (${failed})` : "INTEGRATED_STAGING_DB_GATE = PASS");
  return done(failed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const i = process.argv.indexOf("--snapshot");
  const r = await runDbGate({ env: loadStagingEnv(), snapshotFile: i > 0 ? process.argv[i + 1] : "" });
  console.log(r.lines.join("\n"));
  process.exit(r.code);
}

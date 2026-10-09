#!/usr/bin/env node
/**
 * Read-only staging DB gate (REST only, no mutation).
 *   - migration audit: which of the integrated tree's migrations are already applied, derived from the objects each file creates
 *   - grants/RLS as PostgREST exposes them: service_role sees every API object, anon sees none of the service-core / entitlement objects,
 *     nobody (service_role included) sees the svc__ internals
 *   - --snapshot <file>: row counts of the tables a run may touch (foreign-row baseline for the cleanup step)
 * Catalog details (SECURITY DEFINER, empty search_path, owner, no dynamic SQL) are proven on the identical migration files by
 * tests/service/db-service-hardening.test.ts; PostgREST cannot read pg_catalog.
 * Exit: 0 pass | 4 migrations pending (BLOCKED_MIGRATIONS_PENDING) | 1 gate failure
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, STAGING_REF, loadStagingEnv, preflight, refOfUrl } from "./contract.cjs";

const REQUIRED = ["202610070028_learning_korean_study.sql", "202610080029_learning_entitlements.sql", "202610090040_service_core.sql", "202610100041_service_request_access.sql"];
const env = loadStagingEnv();
const pf = preflight(env);
if (pf.status !== "READY") { console.error(pf.status); process.exit(pf.status === "BLOCKED_MISSING_ENV" ? 3 : 2); }
const url = env.SERVICE_CORE_SUPABASE_URL.replace(/\/$/, "");
if (refOfUrl(url) !== STAGING_REF) { console.error("REFUSED: target is not the staging project"); process.exit(2); }
const svc = { apikey: env.SERVICE_CORE_SUPABASE_SECRET_KEY, ...(env.SERVICE_CORE_SUPABASE_SECRET_KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${env.SERVICE_CORE_SUPABASE_SECRET_KEY}` }) };
const anon = { apikey: env.SERVICE_CORE_STAGING_ANON_KEY, ...(env.SERVICE_CORE_STAGING_ANON_KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${env.SERVICE_CORE_STAGING_ANON_KEY}` }) };

async function exposed(headers) {
  const r = await fetch(`${url}/rest/v1/`, { headers: { ...headers, Accept: "application/openapi+json" } });
  if (!r.ok) throw new Error(`OpenAPI ${r.status}`);
  const spec = await r.json();
  return new Set(Object.keys(spec.paths ?? {}).map((p) => p.replace(/^\/(rpc\/)?/, "")).filter(Boolean));
}
/** Objects a migration creates (tables and functions in schema public), read from the file itself. */
function objectsOf(file) {
  const sql = fs.readFileSync(path.join(ROOT, "supabase/migrations", file), "utf8");
  const tables = [...sql.matchAll(/create table (?:if not exists )?public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
  const fns = [...sql.matchAll(/create (?:or replace )?function public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
  return { tables, fns };
}

let failed = 0;
const gate = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok || !extra ? "" : " :: " + extra}`); if (!ok) failed++; };

const asService = await exposed(svc);
const asAnon = await exposed(anon);
const applied = [], pending = [];
for (const f of REQUIRED) {
  const { tables, fns } = objectsOf(f);
  const api = [...tables, ...fns.filter((n) => !n.startsWith("svc__"))];
  const missing = api.filter((n) => !asService.has(n));
  (missing.length ? pending : applied).push(f);
  if (missing.length) console.log(`  ${f}: ${missing.length} object(s) not visible to service_role: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? ", ..." : ""}`);
}
console.log(`MIGRATIONS_REQUIRED = ${REQUIRED.join(", ")}`);
console.log(`MIGRATIONS_ALREADY_APPLIED = ${applied.join(", ") || "none"}`);
console.log(`MIGRATIONS_PENDING = ${pending.join(", ") || "none"}`);
if (pending.length) {
  console.log("BLOCKED_MIGRATIONS_PENDING: apply ONLY these files to STAGING (supabase db push from a temporary workdir holding just them, as docs/LEARNING_RELEASE.md describes), then rerun. This runner never applies migrations.");
  process.exit(4);
}

const internals = [];
const serviceObjects = [];
for (const f of REQUIRED.filter((x) => /service|entitle/.test(x))) {
  const { tables, fns } = objectsOf(f);
  serviceObjects.push(...tables, ...fns.filter((n) => !n.startsWith("svc__")));
  internals.push(...fns.filter((n) => n.startsWith("svc__")));
}
gate(`service_role can reach every API object (${serviceObjects.length})`, serviceObjects.every((n) => asService.has(n)));
gate("anon cannot reach any service-core / entitlement table or function", serviceObjects.every((n) => !asAnon.has(n)), serviceObjects.filter((n) => asAnon.has(n)).join(", "));
gate(`nobody can reach the svc__ internals (${internals.length})`, internals.every((n) => !asService.has(n) && !asAnon.has(n)), internals.filter((n) => asService.has(n) || asAnon.has(n)).join(", "));
const rls = await fetch(`${url}/rest/v1/svc_requests?select=id&limit=1`, { headers: anon });
gate("anon read of svc_requests is refused (RLS + revoked privileges)", rls.status === 401 || rls.status === 403 || rls.status === 404, `status ${rls.status}`);
const deny = await fetch(`${url}/rest/v1/rpc/svc_a_list_requests`, { method: "POST", headers: { ...anon, "Content-Type": "application/json" }, body: JSON.stringify({ p_status: null }) });
gate("anon call of an admin function is refused", deny.status >= 400 && deny.status < 500, `status ${deny.status}`);

const snapIdx = process.argv.indexOf("--snapshot");
if (snapIdx > 0) {
  const counts = {};
  for (const t of ["svc_customers", "svc_helpers", "svc_requests", "svc_request_sessions", "svc_messages", "svc_outbox", "svc_audit", "learn_entitlements", "learn_student_profiles"]) {
    const r = await fetch(`${url}/rest/v1/${t}?select=*`, { method: "HEAD", headers: { ...svc, Prefer: "count=exact", Range: "0-0" } });
    const m = (r.headers.get("content-range") ?? "").match(/\/(\d+)$/);
    if (!m) { gate(`row count of ${t}`, false, `status ${r.status}`); continue; }
    counts[t] = Number(m[1]);
  }
  fs.writeFileSync(process.argv[snapIdx + 1], JSON.stringify({ at: new Date().toISOString(), counts }));
  console.log(`baseline counts recorded for ${Object.keys(counts).length} tables`);
}
console.log(failed ? `INTEGRATED_STAGING_DB_GATE = FAIL (${failed})` : "INTEGRATED_STAGING_DB_GATE = PASS");
process.exit(failed ? 1 : 0);

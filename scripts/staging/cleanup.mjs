#!/usr/bin/env node
/**
 * Run-scoped cleanup + residue verifier. Deletes ONLY rows carrying this run's STAGING_RUN_ID marker:
 *   svc_requests.description / svc_helpers.display_name starting with the RUN_ID, and Auth users whose email contains it
 *   (their learn_* rows and entitlements cascade). Customers left without any request after that are removed only if they
 *   were the owners of this run's requests. Never touches learning baseline/content tables or unrelated users.
 * Then verifies CURRENT_RUN_RESIDUE = 0 and (with --baseline <file>) that the foreign-row counts equal the recorded baseline.
 */
import fs from "node:fs";
import { STAGING_REF, loadStagingEnv, preflight, refOfUrl } from "./contract.cjs";

const RUN_ID = process.env.STAGING_RUN_ID;
if (!RUN_ID || !/^STG-[a-z0-9-]{6,40}$/.test(RUN_ID)) { console.error("STAGING_RUN_ID missing or malformed: nothing to clean"); process.exit(2); }
const env = loadStagingEnv();
const pf = preflight(env);
if (pf.status !== "READY") { console.error(pf.status); process.exit(pf.status === "BLOCKED_MISSING_ENV" ? 3 : 2); }
const url = env.SERVICE_CORE_SUPABASE_URL.replace(/\/$/, "");
if (refOfUrl(url) !== STAGING_REF) { console.error("REFUSED: target is not the staging project"); process.exit(2); }
const key = env.SERVICE_CORE_SUPABASE_SECRET_KEY;
const h = { apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }), "Content-Type": "application/json" };
const rest = (p, init = {}) => fetch(`${url}/rest/v1/${p}`, { ...init, headers: { ...h, ...(init.headers ?? {}) } });
const like = encodeURIComponent(`${RUN_ID}*`); // PostgREST like wildcard is *

const mine = await (await rest(`svc_requests?select=id,customer_id&description=like.${like}`)).json();
const owners = [...new Set(mine.map((r) => r.customer_id))];
let deleted = 0;
if (mine.length) {
  const d = await rest(`svc_requests?description=like.${like}`, { method: "DELETE", headers: { Prefer: "count=exact" } });
  deleted += mine.length; if (!d.ok) console.error(`request delete status ${d.status}`);
}
const helpers = await rest(`svc_helpers?display_name=like.${like}`, { method: "DELETE", headers: { Prefer: "count=exact" } });
for (const c of owners) {
  const left = await (await rest(`svc_requests?select=id&customer_id=eq.${c}&limit=1`)).json();
  if (Array.isArray(left) && left.length === 0) await rest(`svc_customers?id=eq.${c}`, { method: "DELETE" });
}
if (env.TEST_SUPABASE_URL && refOfUrl(env.TEST_SUPABASE_URL) === STAGING_REF) {
  const lh = { apikey: env.TEST_SUPABASE_SERVICE_ROLE_KEY, ...(env.TEST_SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${env.TEST_SUPABASE_SERVICE_ROLE_KEY}` }) };
  const base = env.TEST_SUPABASE_URL.replace(/\/$/, "");
  const list = await (await fetch(`${base}/auth/v1/admin/users?per_page=1000`, { headers: lh })).json();
  for (const u of (list.users ?? []).filter((x) => typeof x.email === "string" && x.email.includes(RUN_ID.toLowerCase()))) {
    await fetch(`${base}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: lh });
  }
}

// residue
const resReq = await (await rest(`svc_requests?select=id&description=like.${like}`)).json();
const resHelp = await (await rest(`svc_helpers?select=id&display_name=like.${like}`)).json();
let resUsers = 0;
if (env.TEST_SUPABASE_URL) {
  const lh = { apikey: env.TEST_SUPABASE_SERVICE_ROLE_KEY, ...(env.TEST_SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${env.TEST_SUPABASE_SERVICE_ROLE_KEY}` }) };
  const list = await (await fetch(`${env.TEST_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users?per_page=1000`, { headers: lh })).json();
  resUsers = (list.users ?? []).filter((x) => typeof x.email === "string" && x.email.includes(RUN_ID.toLowerCase())).length;
}
const residue = (resReq.length ?? 0) + (resHelp.length ?? 0) + resUsers;
console.log(`CURRENT_RUN_RESIDUE = ${residue} (requests ${resReq.length}, helpers ${resHelp.length}, auth users ${resUsers})`);
let foreign = "NOT_CHECKED";
const bi = process.argv.indexOf("--baseline");
if (bi > 0 && fs.existsSync(process.argv[bi + 1])) {
  const base = JSON.parse(fs.readFileSync(process.argv[bi + 1], "utf8")).counts;
  const diffs = [];
  for (const [t, n] of Object.entries(base)) {
    const r = await rest(`${t}?select=*`, { method: "HEAD", headers: { Prefer: "count=exact", Range: "0-0" } });
    const m = (r.headers.get("content-range") ?? "").match(/\/(\d+)$/);
    if (!m || Number(m[1]) !== n) diffs.push(`${t}: ${n} -> ${m ? m[1] : "?"}`);
  }
  foreign = diffs.length ? `FAIL (${diffs.join("; ")})` : "PASS";
}
console.log(`FOREIGN_ROWS_UNTOUCHED = ${foreign}`);
void deleted; void helpers;
process.exit(residue === 0 && !foreign.startsWith("FAIL") ? 0 : 1);

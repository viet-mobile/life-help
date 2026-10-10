#!/usr/bin/env node
/**
 * Run-scoped cleanup + residue verifier. Deletes ONLY rows carrying this run's STAGING_RUN_ID marker:
 *   svc_requests.description / svc_helpers.display_name starting with the RUN_ID, and Auth users whose email contains it
 *   (their learn_* rows and entitlements cascade). Customers left without any request after that are removed only if they
 *   were the owners of this run's requests. Never touches learning baseline/content tables or unrelated users.
 * Then verifies CURRENT_RUN_RESIDUE = 0 and (with --baseline <file>) that the foreign-row counts of the MUTABLE tables equal the recorded
 * baseline. svc_audit is append-only (see audit.mjs): it is never deleted from; instead every baseline audit row must still exist unchanged
 * (APPEND_ONLY_AUDIT_PRESERVED) and rows added during the run must belong to an entity of this run (NEW_AUDIT_ROWS).
 *
 * Failure handling: every HTTP status is checked BEFORE its body is used. If the credentials are rejected (401/403) the run reports
 * CLEANUP_BLOCKED_AUTH (exit 5) before any delete and attempts no fallback. Any other unexpected response reports CLEANUP_FAILED
 * with the status (exit 1). Never an opaque TypeError.
 * Exit: 0 clean | 1 failed / residue / foreign rows changed | 2 refused | 3 missing env | 5 CLEANUP_BLOCKED_AUTH
 */
import fs from "node:fs";
import { STAGING_REF, loadStagingEnv, preflight, refOfUrl } from "./contract.cjs";
import { compareAudit, readAuditRows } from "./audit.mjs";

class Blocked extends Error { constructor(code, detail) { super(detail); this.code = code; } }

const authHeaders = (key) => ({ apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) });

/** Pure, injectable core: `fetchImpl` is the network, `env` the staging env. Returns { code, lines } and never throws. */
export async function runCleanup({ fetchImpl = fetch, env, runId, baselineFile = "", manifestFile = "", log = () => {} }) {
  const out = (code, lines) => ({ code, lines });
  if (!runId || !/^STG-[a-z0-9-]{6,40}$/.test(runId)) return out(2, ["STAGING_RUN_ID missing or malformed: nothing to clean"]);
  const pf = preflight(env);
  if (pf.status === "BLOCKED_MISSING_ENV") return out(3, ["BLOCKED_MISSING_ENV"]);
  if (pf.status !== "READY") return out(2, ["REFUSED: identity guard failed"]);
  const url = env.SERVICE_CORE_SUPABASE_URL.replace(/\/$/, "");
  if (refOfUrl(url) !== STAGING_REF) return out(2, ["REFUSED: target is not the staging project"]);

  const h = { ...authHeaders(env.SERVICE_CORE_SUPABASE_SECRET_KEY), "Content-Type": "application/json" };
  const rest = (p, init = {}) => fetchImpl(`${url}/rest/v1/${p}`, { ...init, headers: { ...h, ...(init.headers ?? {}) } });
  /** GET that must return a JSON array: status first, then shape. */
  const rows = async (p) => {
    const r = await rest(p);
    if (r.status === 401 || r.status === 403) throw new Blocked("CLEANUP_BLOCKED_AUTH", `REST ${r.status} on ${p.split("?")[0]}`);
    if (!r.ok) throw new Blocked("CLEANUP_FAILED", `REST ${r.status} on ${p.split("?")[0]}`);
    const body = await r.json().catch(() => null);
    if (!Array.isArray(body)) throw new Blocked("CLEANUP_FAILED", `unexpected non-array response (status ${r.status}) on ${p.split("?")[0]}`);
    return body;
  };
  const del = async (p) => {
    if (/^svc_audit\b/.test(p)) throw new Blocked("CLEANUP_FAILED", "refusing to delete from the append-only svc_audit");
    const r = await rest(p, { method: "DELETE" });
    if (r.status === 401 || r.status === 403) throw new Blocked("CLEANUP_BLOCKED_AUTH", `REST ${r.status} on DELETE ${p.split("?")[0]}`);
    if (!r.ok) throw new Blocked("CLEANUP_FAILED", `REST ${r.status} on DELETE ${p.split("?")[0]}`);
  };
  const like = encodeURIComponent(`${runId}*`); // PostgREST like wildcard is *
  const lines = [];
  try {
    // 1. auth probe BEFORE any destructive call: a rejected credential stops everything here (no fallback path exists)
    const mine = await rows(`svc_requests?select=id,customer_id&description=like.${like}`);
    const owners = [...new Set(mine.map((r) => r.customer_id))];
    // ids of every request/helper of this run (still present now + recorded earlier by the harness, which cleans its own rows) - used to attribute audit rows
    const runIds = new Set(mine.map((r) => String(r.id)));
    for (const hRow of await rows(`svc_helpers?select=id&display_name=like.${like}`)) runIds.add(String(hRow.id));
    if (manifestFile && fs.existsSync(manifestFile)) {
      for (const line of fs.readFileSync(manifestFile, "utf8").split("\n").filter(Boolean)) { try { const m = JSON.parse(line); if (m && typeof m.id === "string") runIds.add(m.id); } catch { /* ignore a torn line */ } }
    }
    if (mine.length) await del(`svc_requests?description=like.${like}`);
    await del(`svc_helpers?display_name=like.${like}`);
    for (const c of owners) {
      const left = await rows(`svc_requests?select=id&customer_id=eq.${c}&limit=1`);
      if (left.length === 0) await del(`svc_customers?id=eq.${c}`);
    }
    // learning Auth fixtures of this run only (email carries the lower-cased RUN_ID); cascades learn_* and entitlements
    const lbase = env.TEST_SUPABASE_URL && refOfUrl(env.TEST_SUPABASE_URL) === STAGING_REF ? env.TEST_SUPABASE_URL.replace(/\/$/, "") : null;
    const usersOfRun = async () => {
      if (!lbase) return [];
      const r = await fetchImpl(`${lbase}/auth/v1/admin/users?per_page=1000`, { headers: authHeaders(env.TEST_SUPABASE_SERVICE_ROLE_KEY) });
      if (r.status === 401 || r.status === 403) throw new Blocked("CLEANUP_BLOCKED_AUTH", `Auth admin ${r.status}`);
      const body = await r.json().catch(() => null);
      if (!r.ok || !body || !Array.isArray(body.users)) throw new Blocked("CLEANUP_FAILED", `Auth admin unexpected response (status ${r.status})`);
      return body.users.filter((x) => typeof x.email === "string" && x.email.includes(runId.toLowerCase()));
    };
    for (const u of await usersOfRun()) {
      const d = await fetchImpl(`${lbase}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: authHeaders(env.TEST_SUPABASE_SERVICE_ROLE_KEY) });
      if (d.status === 401 || d.status === 403) throw new Blocked("CLEANUP_BLOCKED_AUTH", `Auth admin DELETE ${d.status}`);
    }

    // 2. residue
    const resReq = await rows(`svc_requests?select=id&description=like.${like}`);
    const resHelp = await rows(`svc_helpers?select=id&display_name=like.${like}`);
    const resUsers = (await usersOfRun()).length;
    const residue = resReq.length + resHelp.length + resUsers;
    lines.push(`CURRENT_RUN_RESIDUE = ${residue} (requests ${resReq.length}, helpers ${resHelp.length}, auth users ${resUsers})`);
    let foreign = "NOT_CHECKED";
    let auditResult = null;
    if (baselineFile && fs.existsSync(baselineFile)) {
      const snap = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
      const diffs = [];
      for (const [t, n] of Object.entries(snap.counts ?? {})) {
        const r = await rest(`${t}?select=*`, { method: "HEAD", headers: { Prefer: "count=exact", Range: "0-0" } });
        if (r.status === 401 || r.status === 403) throw new Blocked("CLEANUP_BLOCKED_AUTH", `REST ${r.status} on count ${t}`);
        const m = (r.headers.get("content-range") ?? "").match(/\/(\d+)$/);
        if (!m || Number(m[1]) !== n) diffs.push(`${t}: ${n} -> ${m ? m[1] : "?"}`);
      }
      foreign = diffs.length ? `FAIL (${diffs.join("; ")})` : "PASS";
      if (snap.audit) {
        let now;
        try { now = await readAuditRows((p, range) => rest(p, { headers: { "Range-Unit": "items", Range: range } })); }
        catch (e) { if (e && e.auth) throw new Blocked("CLEANUP_BLOCKED_AUTH", e.message); throw new Blocked("CLEANUP_FAILED", e instanceof Error ? e.message : "svc_audit unreadable"); }
        auditResult = compareAudit(snap.audit, now, runIds);
      }
    }
    lines.push(`FOREIGN_ROWS_UNTOUCHED = ${foreign}`);
    if (auditResult) {
      lines.push(`APPEND_ONLY_AUDIT_PRESERVED = ${auditResult.preserved ? "PASS" : `FAIL (missing ${auditResult.missing.length}, modified ${auditResult.modified.length})`} (baseline rows ${auditResult.baselineRows})`);
      lines.push(`NEW_AUDIT_ROWS = ${auditResult.newRows} (attributed to this run ${auditResult.attributed}, unattributed ${auditResult.unattributed.length}${auditResult.unattributed.length ? ": " + auditResult.unattributed.slice(0, 5).map((u) => `${u.id}/${u.action}/${u.entity}`).join(", ") : ""})`);
    } else {
      lines.push("APPEND_ONLY_AUDIT_PRESERVED = NOT_CHECKED (no audit baseline in the snapshot)");
    }
    const auditOk = !auditResult || (auditResult.preserved && auditResult.unattributed.length === 0);
    log(lines.join("\n"));
    return out(residue === 0 && !foreign.startsWith("FAIL") && auditOk ? 0 : 1, lines);
  } catch (e) {
    if (e instanceof Blocked) return out(e.code === "CLEANUP_BLOCKED_AUTH" ? 5 : 1, [...lines, `${e.code}: ${e.message}`, ...(e.code === "CLEANUP_BLOCKED_AUTH" ? ["no cleanup was attempted after the authentication failure; fix the staging credential and rerun the cleanup for this RUN_ID"] : [])]);
    return out(1, [...lines, `CLEANUP_FAILED: ${e instanceof Error ? e.message.slice(0, 200) : "unexpected error"}`]);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const bi = process.argv.indexOf("--baseline");
  const r = await runCleanup({ env: loadStagingEnv(), runId: process.env.STAGING_RUN_ID, baselineFile: bi > 0 ? process.argv[bi + 1] : "", manifestFile: process.env.STAGING_RUN_MANIFEST ?? "" });
  console.log(r.lines.join("\n"));
  process.exit(r.code);
}

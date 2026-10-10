import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as C from "../../scripts/staging/contract.cjs";
import { runCleanup } from "../../scripts/staging/cleanup.mjs";
import { STEPS, executePlan, probeDeployed } from "../../scripts/staging/integrated.mjs";

const RUN = "STG-abc123-ffeedd";
const STAGING = `https://${C.STAGING_REF}.supabase.co`;
const env = () => Object.fromEntries(C.ALL_ENV_NAMES.map((n) => [n, C.URL_NAMES.includes(n) ? STAGING : n.includes("CONFIRM") || n.includes("EXPECTED") ? C.STAGING_REF : `secret-${n}`])) as Record<string, string>;

/** A scripted network: first matching rule wins; every call is recorded (method + url). */
function fakeNet(rules: Array<{ match: RegExp; method?: string; status: number; body?: unknown; headers?: Record<string, string>; once?: boolean }>) {
  const calls: Array<{ method: string; url: string }> = [];
  const fetchImpl = async (url: string, init: { method?: string } = {}) => {
    const method = init.method ?? "GET";
    calls.push({ method, url });
    const rule = rules.find((r) => r.match.test(url) && (r.method ?? method) === method);
    if (rule?.once) rules.splice(rules.indexOf(rule), 1); // a one-shot answer: later identical requests see the next rule
    const status = rule?.status ?? 404;
    return new Response(rule?.body === undefined ? null : JSON.stringify(rule.body), { status, headers: rule?.headers });
  };
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}
const deletes = (calls: Array<{ method: string; url: string }>) => calls.filter((c) => c.method === "DELETE");

describe("cleanup: authentication and malformed responses", () => {
  it("REST 401 on the first read -> CLEANUP_BLOCKED_AUTH (exit 5), exactly one GET, nothing deleted, no fallback", async () => {
    const net = fakeNet([{ match: /rest\/v1\//, status: 401, body: { message: "Invalid API key" } }]);
    const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
    expect(r.code).toBe(5);
    expect(r.lines.join("\n")).toContain("CLEANUP_BLOCKED_AUTH");
    expect(r.lines.join("\n")).toContain("no cleanup was attempted");
    expect(net.calls).toHaveLength(1);
    expect(deletes(net.calls)).toEqual([]);
    expect(r.lines.join("\n")).not.toMatch(/TypeError|\.map is not a function/);
  });
  it("403 behaves like 401", async () => {
    const net = fakeNet([{ match: /rest\/v1\//, status: 403, body: { message: "forbidden" } }]);
    const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
    expect([r.code, deletes(net.calls).length]).toEqual([5, 0]);
  });
  it("a non-array JSON body (even with HTTP 200) -> CLEANUP_FAILED with a clear reason, no TypeError, nothing deleted", async () => {
    for (const body of [{ message: "JWT expired", code: "PGRST303" }, "oops", null, 42]) {
      const net = fakeNet([{ match: /rest\/v1\//, status: 200, body }]);
      const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
      expect(r.code, JSON.stringify(body)).toBe(1);
      expect(r.lines.join("\n")).toMatch(/CLEANUP_FAILED: unexpected non-array response/);
      expect(r.lines.join("\n")).not.toMatch(/TypeError|is not a function/);
      expect(deletes(net.calls)).toEqual([]);
    }
  });
  it("an error status with a JSON error object (400 / 500) is a clear failure too", async () => {
    for (const status of [400, 404, 500, 503]) {
      const net = fakeNet([{ match: /rest\/v1\//, status, body: { message: "boom" } }]);
      const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
      expect(r.code).toBe(1);
      expect(r.lines.join("\n")).toContain(`REST ${status}`);
      expect(deletes(net.calls)).toEqual([]);
    }
  });
  it("a delete that is rejected stops the run as blocked-auth without further deletes", async () => {
    const net = fakeNet([
      { match: /svc_requests\?select=id,customer_id/, status: 200, body: [{ id: "r1", customer_id: "c1" }] },
      { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [] },
      { match: /svc_requests\?description=like/, method: "DELETE", status: 401, body: {} },
    ]);
    const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
    expect(r.code).toBe(5);
    expect(deletes(net.calls)).toHaveLength(1); // the rejected one; nothing after it
  });
  it("learning Auth admin 401 -> blocked, no user deleted", async () => {
    const net = fakeNet([
      { match: /rest\/v1\/svc_requests\?select=id,customer_id/, status: 200, body: [] },
      { match: /rest\/v1\/svc_helpers\?select=id&display_name/, status: 200, body: [] },
      { match: /rest\/v1\/svc_helpers\?display_name/, method: "DELETE", status: 204 },
      { match: /auth\/v1\/admin\/users\?/, status: 401, body: { msg: "bad jwt" } },
    ]);
    const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
    expect(r.code).toBe(5);
    expect(deletes(net.calls).every((c) => c.url.includes("svc_helpers"))).toBe(true);
    expect(net.calls.some((c) => c.url.includes("/auth/v1/admin/users/") && c.method === "DELETE")).toBe(false);
  });
  it("scoping is intact: every delete carries this RUN_ID filter or a customer id owned by this run; residue and foreign rows are verified", async () => {
    const dir = mkdtempSync(join(tmpdir(), "stg-"));
    const baseline = join(dir, "b.json");
    writeFileSync(baseline, JSON.stringify({ counts: { svc_requests: 7, svc_helpers: 3 } }));
    const net = fakeNet([
      { match: /svc_requests\?select=id,customer_id&description=like/, status: 200, body: [{ id: "r1", customer_id: "c1" }] },
      { match: /svc_requests\?description=like/, method: "DELETE", status: 204 },
      { match: /svc_helpers\?display_name=like/, method: "DELETE", status: 204 },
      { match: /svc_requests\?select=id&customer_id=eq\.c1/, status: 200, body: [] },
      { match: /svc_customers\?id=eq\.c1/, method: "DELETE", status: 204 },
      { match: /auth\/v1\/admin\/users\?/, status: 200, once: true, body: { users: [{ id: "u1", email: `learn.${RUN.toLowerCase()}@example.test` }, { id: "u2", email: "someone@else.test" }] } },
      { match: /auth\/v1\/admin\/users\?/, status: 200, body: { users: [{ id: "u2", email: "someone@else.test" }] } }, // after the delete
      { match: /auth\/v1\/admin\/users\/u1/, method: "DELETE", status: 200 },
      { match: /svc_requests\?select=id&description=like/, status: 200, body: [] },
      { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [] },
      { match: /svc_requests\?select=\*/, method: "HEAD", status: 200, headers: { "content-range": "0-0/7" } },
      { match: /svc_helpers\?select=\*/, method: "HEAD", status: 200, headers: { "content-range": "0-0/3" } },
    ]);
    const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN, baselineFile: baseline });
    expect(r.lines.join(" | ")).toContain("CURRENT_RUN_RESIDUE = 0");
    expect(r.code).toBe(0);
    const urls = deletes(net.calls).map((c) => decodeURIComponent(c.url));
    for (const u of urls) expect(u.includes(RUN) || /customers\?id=eq\.c1$/.test(u) || /users\/u1$/.test(u), u).toBe(true);
    expect(urls.some((u) => u.includes("users/u2"))).toBe(false); // an unrelated Auth user is never touched
    expect(r.lines.join("\n")).toContain("CURRENT_RUN_RESIDUE = 0");
    expect(r.lines.join("\n")).toContain("FOREIGN_ROWS_UNTOUCHED = PASS");
  });
  it("changed foreign row counts fail the run; residue fails the run", async () => {
    const dir = mkdtempSync(join(tmpdir(), "stg-"));
    const baseline = join(dir, "b.json");
    writeFileSync(baseline, JSON.stringify({ counts: { svc_requests: 7 } }));
    const base = [
      { match: /svc_requests\?select=id,customer_id/, status: 200, body: [] as unknown[] },
      { match: /svc_helpers\?display_name=like/, method: "DELETE", status: 204 },
      { match: /auth\/v1\/admin\/users\?/, status: 200, body: { users: [] } },
      { match: /svc_requests\?select=id&description=like/, status: 200, body: [] },
      { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [] },
    ];
    const moved = fakeNet([...base, { match: /svc_requests\?select=\*/, method: "HEAD", status: 200, headers: { "content-range": "0-0/9" } }]);
    const r1 = await runCleanup({ fetchImpl: moved.fetchImpl, env: env(), runId: RUN, baselineFile: baseline });
    expect(r1.code).toBe(1);
    expect(r1.lines.join("\n")).toContain("FOREIGN_ROWS_UNTOUCHED = FAIL");
    const left = fakeNet([...base.slice(0, 4), { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [{ id: "h1" }] }]);
    const r2 = await runCleanup({ fetchImpl: left.fetchImpl, env: env(), runId: RUN });
    expect(r2.code).toBe(1);
    expect(r2.lines.join("\n")).toContain("CURRENT_RUN_RESIDUE = 1");
  });
  it("identity guards still fail closed: production URL / wrong ref / bad run id make zero network calls", async () => {
    for (const bad of [{ ...env(), SERVICE_CORE_SUPABASE_URL: `https://${C.PRODUCTION_REF}.supabase.co` }, { ...env(), SERVICE_CORE_SUPABASE_URL: "https://otherrefaaaaaaaaaaaa.supabase.co" }]) {
      const net = fakeNet([]);
      const r = await runCleanup({ fetchImpl: net.fetchImpl, env: bad, runId: RUN });
      expect([r.code, net.calls.length]).toEqual([2, 0]);
    }
    const net = fakeNet([]);
    expect((await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: "x'; drop" })).code).toBe(2);
    expect((await runCleanup({ fetchImpl: net.fetchImpl, env: {}, runId: RUN })).code).toBe(3);
    expect(net.calls).toHaveLength(0);
  });
});

describe("runner: failure classification", () => {
  const ok = async () => 0;
  /** run() that returns the scripted exit status per step id; records which steps actually executed */
  const scripted = (codes: Record<string, number>) => {
    const ran: string[] = [];
    return { ran, run: async (step: { id: string }) => { ran.push(step.id); return codes[step.id] ?? 0; } };
  };
  const live = async () => ({ deployed: true });
  const notDeployed = async () => ({ deployed: false, why: "BLOCKED_NOT_DEPLOYED" });

  it("post-smoke (and every browser step) is BLOCKED_NOT_DEPLOYED, never a failure, when the integrated Worker was never deployed", async () => {
    const s = scripted({});
    const r = await executePlan({ steps: STEPS, run: s.run, probe: notDeployed });
    const by = Object.fromEntries(r.results);
    for (const id of ["service-journey", "main-locale-smoke", "learning-suite", "entitlements", "post-smoke"]) expect(by[id], id).toBe("BLOCKED_NOT_DEPLOYED");
    expect(s.ran.filter((id: string) => ["service-journey", "main-locale-smoke", "learning-suite", "entitlements", "post-smoke"].includes(id))).toEqual([]);
    expect(by["service-core-harness"]).toBe("PASS"); // DB-level gates do not need the Worker
    expect(by.cleanup).toBe("PASS");
    expect(r.failed).toEqual([]);
    expect(r.final).toBe("BLOCKED_NOT_DEPLOYED"); // fail-closed: never VALIDATED
  });
  it("after an earlier hard failure on a never-deployed Worker, post-smoke is still not a product failure", async () => {
    const s = scripted({ "service-core-harness": 1 });
    const r = await executePlan({ steps: STEPS, run: s.run, probe: notDeployed });
    const by = Object.fromEntries(r.results);
    expect(by["service-core-harness"]).toMatch(/^FAIL/);
    expect(by["post-smoke"]).toBe("BLOCKED_NOT_DEPLOYED");
    expect(r.failed).toEqual(["service-core-harness"]);
    expect(s.ran).toContain("cleanup"); // cleanup is still attempted
  });
  it("a rejected DB credential stops as BLOCKED_AUTH, later hard gates are NOT_RUN, cleanup is still attempted", async () => {
    const s = scripted({ "db-gate": 6 });
    const r = await executePlan({ steps: STEPS, run: s.run, probe: live });
    const by = Object.fromEntries(r.results);
    expect(by["db-gate"]).toBe("BLOCKED_AUTH");
    expect(by["service-core-harness"]).toMatch(/NOT_RUN/);
    expect(s.ran).toContain("cleanup");
    expect(r.failed).toEqual([]);
    expect(r.final).toBe("BLOCKED_AUTH");
  });
  it("a cleanup that cannot authenticate is CLEANUP_BLOCKED_AUTH (not FAIL) and prevents VALIDATED", async () => {
    const s = scripted({ cleanup: 5 });
    const r = await executePlan({ steps: STEPS, run: s.run, probe: live });
    expect(Object.fromEntries(r.results).cleanup).toBe("CLEANUP_BLOCKED_AUTH");
    expect(r.final).toBe("CLEANUP_BLOCKED_AUTH");
  });
  it("pending migrations stay BLOCKED_MIGRATIONS_PENDING and later hard gates do not run", async () => {
    const s = scripted({ "db-gate": 4 });
    const r = await executePlan({ steps: STEPS, run: s.run, probe: live });
    expect(r.final).toBe("BLOCKED_MIGRATIONS_PENDING");
    expect(s.ran).not.toContain("service-core-harness");
  });
  it("a deployed Worker with a product failure is a real FAIL; later hard gates stop, cleanup runs, post-smoke still runs", async () => {
    const s = scripted({ "main-locale-smoke": 1 });
    const r = await executePlan({ steps: STEPS, run: s.run, probe: live });
    const by = Object.fromEntries(r.results);
    expect(by["main-locale-smoke"]).toMatch(/^FAIL/);
    expect(by["learning-suite"]).toMatch(/NOT_RUN/);
    expect(s.ran).toContain("cleanup");
    expect(s.ran).toContain("post-smoke");
    expect(r.final).toBe("BLOCKED");
  });
  it("only an all-green, deployed run is VALIDATED", async () => {
    const s = scripted({});
    const r = await executePlan({ steps: STEPS, run: s.run, probe: live });
    expect(r.final).toBe("VALIDATED");
    expect(r.results.every((x: string[]) => x[1] === "PASS")).toBe(true);
    void ok;
  });
  it("the deployment probe: 404 = not deployed; 403/503 = deployed (a broken deployment stays a visible failure); network error = unreachable", async () => {
    const probe = (status: number | "throw") => probeDeployed((async () => { if (status === "throw") throw new Error("down"); return new Response(null, { status }); }) as unknown as typeof fetch);
    expect(await probe(404)).toMatchObject({ deployed: false, why: "BLOCKED_NOT_DEPLOYED" });
    expect(await probe(403)).toEqual({ deployed: true });
    expect(await probe(503)).toEqual({ deployed: true });
    expect(await probe("throw")).toMatchObject({ deployed: false, why: "BLOCKED_STAGING_UNREACHABLE" });
  });
});

describe("cleanup: svc_audit is append-only", async () => {
  const { auditBaseline, compareAudit, rowHash } = await import("../../scripts/staging/audit.mjs");
  const audit = (id: number, over: Record<string, unknown> = {}) => ({ id, actor_kind: "ADMIN", actor_id: "a1", action: "HELPER_STATUS", entity: "helper", entity_id: `h${id}`, metadata: {}, created_at: "2026-10-11T00:00:00Z", ...over });
  const BASE_ROWS = [audit(1), audit(2), audit(3, { entity: "request", entity_id: "r-old" })];

  const net = (nowRows: unknown[], extra: Array<{ match: RegExp; method?: string; status: number; body?: unknown; headers?: Record<string, string> }> = []) =>
    fakeNet([
      ...extra,
      { match: /svc_requests\?select=id,customer_id&description=like/, status: 200, body: [{ id: "r-run", customer_id: "c1" }] },
      { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [{ id: "h-run" }], once: true },
      { match: /svc_requests\?description=like/, method: "DELETE", status: 204 },
      { match: /svc_helpers\?display_name=like/, method: "DELETE", status: 204 },
      { match: /svc_requests\?select=id&customer_id=eq\.c1/, status: 200, body: [] },
      { match: /svc_customers\?id=eq\.c1/, method: "DELETE", status: 204 },
      { match: /auth\/v1\/admin\/users\?/, status: 200, body: { users: [] } },
      { match: /svc_requests\?select=id&description=like/, status: 200, body: [] },
      { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [] },
      { match: /svc_audit\?select=/, status: 200, body: nowRows },
      { match: /svc_requests\?select=\*/, method: "HEAD", status: 200, headers: { "content-range": "0-0/7" } },
    ]);
  const baselineFile = (rows: unknown[], counts: Record<string, number> = { svc_requests: 7 }) => {
    const f = join(mkdtempSync(join(tmpdir(), "stg-")), "b.json");
    writeFileSync(f, JSON.stringify({ counts, audit: auditBaseline(rows) }));
    return f;
  };
  const go = (n: ReturnType<typeof fakeNet>, file: string, manifest = "") => runCleanup({ fetchImpl: n.fetchImpl, env: env(), runId: RUN, baselineFile: file, manifestFile: manifest });

  it("baseline audit rows unchanged + new rows that belong to this run => PASS (append-only growth allowed, reported)", async () => {
    const grown = [...BASE_ROWS, audit(4, { entity: "request", entity_id: "r-run", action: "REQUEST_ASSIGNED" }), audit(5, { entity: "helper", entity_id: "h-run", action: "HELPER_REGISTERED" })];
    const n = net(grown);
    const r = await go(n, baselineFile(BASE_ROWS));
    expect(r.code).toBe(0);
    const text = r.lines.join("\n");
    expect(text).toContain("APPEND_ONLY_AUDIT_PRESERVED = PASS (baseline rows 3)");
    expect(text).toContain("NEW_AUDIT_ROWS = 2 (attributed to this run 2, unattributed 0)");
    expect(text).toContain("CURRENT_RUN_RESIDUE = 0");
    expect(text).toContain("FOREIGN_ROWS_UNTOUCHED = PASS");
    expect(n.calls.some((c) => c.url.includes("svc_audit") && c.method !== "GET")).toBe(false); // never a DELETE / PATCH on the audit table
  });
  it("rows of requests/helpers this run created and already removed (recorded in the run manifest) are attributed too", async () => {
    const dir = mkdtempSync(join(tmpdir(), "stg-"));
    const manifest = join(dir, "m.ndjson");
    writeFileSync(manifest, `${JSON.stringify({ kind: "requests", id: "r-harness" })}\n${JSON.stringify({ kind: "helpers", id: "h-harness" })}\ntorn-line`);
    const grown = [...BASE_ROWS, audit(4, { entity: "request", entity_id: "r-harness" }), audit(5, { entity: "helper", entity_id: "h-harness" })];
    const r = await go(net(grown), baselineFile(BASE_ROWS), manifest);
    expect(r.code).toBe(0);
    expect(r.lines.join("\n")).toContain("attributed to this run 2, unattributed 0");
  });
  it("a baseline audit row that disappeared => FAIL", async () => {
    const r = await go(net([BASE_ROWS[0], BASE_ROWS[2]]), baselineFile(BASE_ROWS));
    expect(r.code).toBe(1);
    expect(r.lines.join("\n")).toContain("APPEND_ONLY_AUDIT_PRESERVED = FAIL (missing 1, modified 0)");
  });
  it("a baseline audit row that was modified => FAIL (detected by content hash)", async () => {
    const r = await go(net([BASE_ROWS[0], audit(2, { action: "TAMPERED" }), BASE_ROWS[2]]), baselineFile(BASE_ROWS));
    expect(r.code).toBe(1);
    expect(r.lines.join("\n")).toContain("APPEND_ONLY_AUDIT_PRESERVED = FAIL (missing 0, modified 1)");
  });
  it("new audit rows that do not belong to this run are reported and fail (never silently ignored)", async () => {
    const r = await go(net([...BASE_ROWS, audit(9, { entity: "request", entity_id: "someone-elses", action: "REQUEST_CANCELLED" })]), baselineFile(BASE_ROWS));
    expect(r.code).toBe(1);
    expect(r.lines.join("\n")).toContain("NEW_AUDIT_ROWS = 1 (attributed to this run 0, unattributed 1: 9/REQUEST_CANCELLED/request)");
  });
  it("mutable foreign tables keep exact protection: a changed count fails even when the audit is fine", async () => {
    const r = await go(net(BASE_ROWS), baselineFile(BASE_ROWS, { svc_requests: 5 }));
    expect(r.code).toBe(1);
    expect(r.lines.join("\n")).toContain("FOREIGN_ROWS_UNTOUCHED = FAIL (svc_requests: 5 -> 7)");
    expect(r.lines.join("\n")).toContain("APPEND_ONLY_AUDIT_PRESERVED = PASS");
  });
  it("current-run mutable residue fails even when the audit is fine; zero residue + audit growth passes", async () => {
    const left = fakeNet([
      { match: /svc_requests\?select=id,customer_id&description=like/, status: 200, body: [] },
      { match: /svc_helpers\?select=id&display_name=like/, status: 200, body: [] },
      { match: /svc_helpers\?display_name=like/, method: "DELETE", status: 204 },
      { match: /auth\/v1\/admin\/users\?/, status: 200, body: { users: [] } },
      { match: /svc_requests\?select=id&description=like/, status: 200, body: [{ id: "still-here" }] },
      { match: /svc_audit\?select=/, status: 200, body: BASE_ROWS },
      { match: /svc_requests\?select=\*/, method: "HEAD", status: 200, headers: { "content-range": "0-0/7" } },
    ]);
    const r = await go(left, baselineFile(BASE_ROWS));
    expect(r.code).toBe(1);
    expect(r.lines.join("\n")).toContain("CURRENT_RUN_RESIDUE = 1");
  });
  it("cleanup never issues a DELETE against svc_audit, and refuses if asked to", async () => {
    const n = net([...BASE_ROWS]);
    await go(n, baselineFile(BASE_ROWS));
    expect(n.calls.filter((c) => c.method === "DELETE").some((c) => c.url.includes("svc_audit"))).toBe(false);
    const src = readFileSync("scripts/staging/cleanup.mjs", "utf8");
    expect(src).toContain("refusing to delete from the append-only svc_audit");
  });
  it("a baseline without audit data is reported explicitly as NOT_CHECKED (never silently skipped)", async () => {
    const f = join(mkdtempSync(join(tmpdir(), "stg-")), "b.json");
    writeFileSync(f, JSON.stringify({ counts: { svc_requests: 7 } }));
    const r = await go(net(BASE_ROWS), f);
    expect(r.lines.join("\n")).toContain("APPEND_ONLY_AUDIT_PRESERVED = NOT_CHECKED");
  });
  it("an audit read that is rejected is CLEANUP_BLOCKED_AUTH, a non-array answer is CLEANUP_FAILED", async () => {
    const a = await go(net([], [{ match: /svc_audit\?select=/, status: 401, body: {} }]), baselineFile(BASE_ROWS));
    expect(a.code).toBe(5);
    const b = await go(net([], [{ match: /svc_audit\?select=/, status: 200, body: { message: "x" } }]), baselineFile(BASE_ROWS));
    expect(b.code).toBe(1);
    expect(b.lines.join("\n")).toContain("CLEANUP_FAILED");
  });
  it("audit schema facts the invariant relies on: no foreign key, identity key, only INSERTs anywhere in the SQL", () => {
    const sql = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).map((f) => readFileSync(`supabase/migrations/${f}`, "utf8")).join("\n");
    expect(sql).toMatch(/create table public\.svc_audit \(\s*id bigint generated always as identity primary key/);
    expect(sql).not.toMatch(/update public\.svc_audit|delete from public\.svc_audit|truncate[^;]*svc_audit/i);
    expect(sql).not.toMatch(/references public\.svc_audit/);
    expect(rowHash(audit(1))).toBe(rowHash(audit(1)));
    expect(rowHash(audit(1))).not.toBe(rowHash(audit(1, { action: "X" })));
  });
});

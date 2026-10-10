import { mkdtempSync, writeFileSync } from "node:fs";
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
      { match: /svc_requests\?description=like/, method: "DELETE", status: 401, body: {} },
    ]);
    const r = await runCleanup({ fetchImpl: net.fetchImpl, env: env(), runId: RUN });
    expect(r.code).toBe(5);
    expect(deletes(net.calls)).toHaveLength(1); // the rejected one; nothing after it
  });
  it("learning Auth admin 401 -> blocked, no user deleted", async () => {
    const net = fakeNet([
      { match: /rest\/v1\/svc_requests\?select=id,customer_id/, status: 200, body: [] },
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

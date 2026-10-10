import { describe, expect, it } from "vitest";
import * as C from "../../scripts/staging/contract.cjs";
import { REQUIRED, keyHeaders, objectsOf, runDbGate } from "../../scripts/staging/db-gate.mjs";

const STAGING = `https://${C.STAGING_REF}.supabase.co`;
const PUB = "sb_publishable_TESTONLY_not_a_real_key";
const SECRET = "sb_secret_TESTONLY_not_a_real_key";
const env = (over: Record<string, string> = {}) =>
  ({ ...Object.fromEntries(C.ALL_ENV_NAMES.map((n) => [n, C.URL_NAMES.includes(n) ? STAGING : n.includes("CONFIRM") || n.includes("EXPECTED") ? C.STAGING_REF : `x-${n}`])), SERVICE_CORE_SUPABASE_SECRET_KEY: SECRET, SERVICE_CORE_STAGING_ANON_KEY: PUB, ...over }) as Record<string, string>;

const files = REQUIRED.map((f: string) => ({ f, ...objectsOf(f) }));
const allTables: string[] = files.flatMap((x: { tables: string[] }) => x.tables);
const allFns = new Map<string, string[]>(files.flatMap((x: { fns: Map<string, string[]> }) => [...x.fns]));
// the denial surface = the service-core and entitlement migrations (028 is learning content, not guarded here)
const guarded = files.filter((x: { f: string }) => /service|entitle/.test(x.f));
const guardedTables: string[] = guarded.flatMap((x: { tables: string[] }) => x.tables);
const guardedFns = new Map<string, string[]>(guarded.flatMap((x: { fns: Map<string, string[]> }) => [...x.fns]));

interface Opts {
  authSettings?: (key: string | undefined) => number;
  table?: (t: string) => Response | "throw";
  rpc?: (fn: string, body: Record<string, unknown>) => Response | "throw";
  hide?: string[];            // objects missing from the elevated OpenAPI (pending migration)
  exposeInternals?: boolean;  // internals visible to service_role (a grants bug)
  secretStatus?: number;      // answer to the elevated OpenAPI call
}
const json = (status: number, body: unknown, headers?: Record<string, string>) => new Response(JSON.stringify(body), { status, headers });
const denied = (what: string) => json(401, { code: "42501", message: `permission denied for ${what}` });

/** A miniature PostgREST + Auth: the elevated key sees the schema, the publishable key gets what `opts` say. Records every call. */
function mini(o: Opts = {}) {
  const calls: Array<{ method: string; url: string; headers: Record<string, string>; body?: string }> = [];
  const spec = {
    paths: Object.fromEntries([
      ...allTables.map((t) => [`/${t}`, {}]),
      ...[...allFns.keys()].filter((n) => !n.startsWith("svc__") || o.exposeInternals).map((n) => [`/rpc/${n}`, {}]),
    ].filter(([p]) => !(o.hide ?? []).includes(String(p).replace(/^\/(rpc\/)?/, "")))),
    definitions: Object.fromEntries([...allFns].map(([n, params]) => [`(rpc) ${n}`, { properties: Object.fromEntries(params.map((p) => [p, {}])) }])),
  };
  const fetchImpl = (async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) => {
    const method = init.method ?? "GET";
    const headers = init.headers ?? {};
    calls.push({ method, url, headers, body: init.body });
    const u = new URL(url);
    const elevated = headers.apikey === SECRET;
    if (u.pathname === "/rest/v1/" && method === "GET") return elevated ? json(o.secretStatus ?? 200, o.secretStatus && o.secretStatus >= 400 ? { message: "no" } : spec) : json(401, { message: "Invalid API key" }); // the public key can NEVER read the OpenAPI root
    if (u.pathname === "/auth/v1/settings") return json((o.authSettings ?? ((k) => (k === PUB ? 200 : 401)))(headers.apikey), {});
    if (u.pathname.startsWith("/rest/v1/rpc/")) {
      const fn = u.pathname.split("/").pop()!;
      if (elevated) return json(200, null);
      const r = (o.rpc ?? ((f) => denied(`function ${f}`)))(fn, JSON.parse(init.body ?? "{}"));
      if (r === "throw") throw new TypeError("fetch failed");
      return r;
    }
    if (u.pathname.startsWith("/rest/v1/")) {
      const t = u.pathname.split("/").pop()!;
      if (elevated) return method === "HEAD" ? new Response(null, { status: 200, headers: { "content-range": "0-0/5" } }) : json(200, []);
      const r = (o.table ?? ((x) => denied(`table ${x}`)))(t);
      if (r === "throw") throw new TypeError("fetch failed");
      return r;
    }
    return json(404, {});
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}
const run = (o: Opts = {}, e = env()) => { const net = mini(o); return runDbGate({ fetchImpl: net.fetchImpl, env: e }).then((r: { code: number; lines: string[] }) => ({ ...r, calls: net.calls, text: r.lines.join("\n") })); };

describe("db gate with modern Supabase keys", () => {
  it("valid sb_publishable with the OpenAPI root unavailable to it: PASS (the public key is validated via Auth settings, never via /rest/v1/)", async () => {
    const r = await run();
    expect(r.code).toBe(0);
    expect(r.text).toContain("INTEGRATED_STAGING_DB_GATE = PASS");
    expect(r.text).toContain("publishable key is valid for the staging project (Auth settings)");
    const root = r.calls.filter((c) => new URL(c.url).pathname === "/rest/v1/");
    expect(root.length).toBe(1);
    expect(root.every((c) => c.headers.apikey === SECRET)).toBe(true); // only the elevated key inspects the schema
    expect(r.calls.some((c) => c.url.endsWith("/auth/v1/settings") && c.headers.apikey === PUB)).toBe(true);
  });
  it("the publishable key travels in `apikey` only, never as Authorization: Bearer; no call carries the secret key to the public checks", async () => {
    const r = await run();
    for (const c of r.calls) {
      if (c.headers.apikey === PUB) expect(c.headers.Authorization, c.url).toBeUndefined();
      expect(JSON.stringify(c.headers)).not.toContain(`Bearer ${PUB}`);
    }
    expect(keyHeaders(PUB)).toEqual({ apikey: PUB });
    expect(keyHeaders("eyJlegacy.jwt.value")).toEqual({ apikey: "eyJlegacy.jwt.value", Authorization: "Bearer eyJlegacy.jwt.value" }); // legacy JWT keys keep working
  });
  it("an invalid or wrong-project publishable key is a HARD FAIL (never a pass, never inferred from a denial)", async () => {
    const r = await run({ authSettings: () => 401 });
    expect(r.code).toBe(1);
    expect(r.text).toContain("PUBLISHABLE_KEY_INVALID");
    expect(r.calls.some((c) => c.url.includes("/rest/v1/svc_") && c.headers.apikey === PUB)).toBe(false); // no denial test is run with an unproven key
    // a key the server rejects on every call: 401 "Invalid API key" is not an authorization denial
    const bad = await run({ table: () => json(401, { message: "Invalid API key" }), rpc: () => json(401, { message: "Invalid API key" }) });
    expect(bad.code).toBe(1);
  });
  it("a secret key supplied in the public slot is refused (it would make every denial test meaningless)", async () => {
    expect((await run({}, env({ SERVICE_CORE_STAGING_ANON_KEY: "sb_secret_other" }))).code).toBe(1);
    expect((await run({}, env({ SERVICE_CORE_STAGING_ANON_KEY: SECRET }))).code).toBe(1);
  });
});

describe("anonymous denial is proven by direct calls", () => {
  it("every service-core / entitlement table is called and refused", async () => {
    const r = await run();
    const tableCalls = r.calls.filter((c) => c.headers.apikey === PUB && /\/rest\/v1\/(svc_|learn_entitlements)/.test(c.url) && c.method === "GET");
    expect(tableCalls.length).toBe(guardedTables.length);
    expect(allTables).toEqual(expect.arrayContaining(["svc_requests", "svc_helpers", "svc_audit", "svc_outbox", "svc_request_sessions", "learn_entitlements"]));
    expect(r.text).toMatch(/PASS anon cannot read any of the \d+ service-core/);
  });
  it("a table that answers 200 (even an empty array through RLS) is NOT a pass; rows are a failure", async () => {
    for (const body of [[], [{ id: 1 }]]) {
      const r = await run({ table: (t) => (t === "svc_requests" ? json(200, body) : denied(`table ${t}`)) });
      expect(r.code).toBe(1);
      expect(r.text).toMatch(/FAIL anon cannot read any[^\n]*svc_requests: HTTP 200 \(access NOT denied\)/);
    }
  });
  it("a table error that is not a permission error (server error, 404, wrong shape) is not a pass", async () => {
    for (const bad of [json(500, { message: "boom" }), json(404, { code: "PGRST205", message: "not found" }), json(401, { message: "JWT expired" }), json(401, null), new Response("<html>", { status: 403 })]) {
      expect((await run({ table: (t) => (t === "svc_helpers" ? bad : denied(`table ${t}`)) })).code).toBe(1);
    }
  });
  it("every svc_h_* / svc_a_* function and the other API functions are called with their real argument names and refused", async () => {
    const r = await run();
    const rpcCalls = r.calls.filter((c) => c.headers.apikey === PUB && c.url.includes("/rest/v1/rpc/"));
    expect(rpcCalls.length).toBe(guardedFns.size);
    for (const c of rpcCalls) {
      const fn = c.url.split("/").pop()!;
      expect(Object.keys(JSON.parse(c.body!)).sort(), fn).toEqual([...guardedFns.get(fn)!].sort());
    }
    expect(r.text).toMatch(/PASS anon cannot invoke the \d+ privileged svc_h_\* \/ svc_a_\* functions/);
    expect(r.text).toMatch(/PASS anon cannot invoke the \d+ internal svc__ functions/);
    expect(allFns.get("svc_c_create_request")).toContain("p_session"); // the latest definition (041) is the one used
    expect([...allFns.keys()].some((n) => n.startsWith("svc_a_"))).toBe(true);
  });
  it("a privileged RPC that executes (200) is a failure, whichever family it belongs to", async () => {
    for (const fn of ["svc_a_list_requests", "svc_h_accept", "svc_c_claim", "svc__customer_request", "learn_grant_entitlement"]) {
      const r = await run({ rpc: (f) => (f === fn ? json(200, []) : denied(`function ${f}`)) });
      expect(r.code, fn).toBe(1);
      expect(r.text, fn).toContain(`${fn}: HTTP 200 (access NOT denied)`);
    }
  });
  it("network failure while testing denial is never a pass", async () => {
    expect((await run({ table: (t) => (t === "svc_requests" ? "throw" : denied(`table ${t}`)) })).code).toBe(1);
    expect((await run({ rpc: (f) => (f === "svc_a_assign" ? "throw" : denied(`function ${f}`)) })).code).toBe(1);
  });
  it("404 'not in the schema cache' counts as denial only when the call shape is provably right", async () => {
    const notFound = json(404, { code: "PGRST202", message: "Could not find the function in the schema cache" });
    expect((await run({ rpc: (f, b) => (f === "svc_a_assign" ? notFound : denied(`function ${f}`)) })).code).toBe(0); // shape matches the elevated OpenAPI
    // an API function whose OpenAPI parameters differ from what was sent cannot prove anything
    const net = mini({ rpc: (f) => (f === "svc_a_assign" ? notFound : denied(`function ${f}`)) });
    const wrongShape = async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string }) => (url.endsWith("/rest/v1/") ? json(200, { paths: Object.fromEntries([...allTables.map((t) => [`/${t}`, {}]), ...[...allFns.keys()].filter((n) => !n.startsWith("svc__")).map((n) => [`/rpc/${n}`, {}])]), definitions: {} }) : (net.fetchImpl as unknown as (u: string, i: unknown) => Promise<Response>)(url, init));
    const r = await runDbGate({ fetchImpl: wrongShape as unknown as typeof fetch, env: env() });
    expect(r.code).toBe(1);
  });
});

describe("elevated structural inspection", () => {
  it("reports what is applied and what is pending, and stops at BLOCKED_MIGRATIONS_PENDING (exit 4) before any anonymous test", async () => {
    const r = await run({ hide: ["svc_request_sessions", "svc_c_claim"] });
    expect(r.code).toBe(4);
    expect(r.text).toContain("MIGRATIONS_PENDING = 202610100041_service_request_access.sql");
    expect(r.text).toContain("MIGRATIONS_ALREADY_APPLIED = 202610070028_learning_korean_study.sql, 202610080029_learning_entitlements.sql, 202610090040_service_core.sql, 202610110042_service_core_internal_rpc_lockdown.sql");
    expect(r.calls.some((c) => c.headers.apikey === PUB)).toBe(false);
  });
  it("migration 042 is REQUIRED: until its marker is visible the gate reports it pending (exit 4) - even while internals are still exposed", async () => {
    expect(REQUIRED).toContain("202610110042_service_core_internal_rpc_lockdown.sql");
    const before = await run({ hide: ["svc_core_schema_version"], exposeInternals: true }); // the staging situation before 042 is applied
    expect(before.code).toBe(4);
    expect(before.text).toContain("MIGRATIONS_PENDING = 202610110042_service_core_internal_rpc_lockdown.sql");
    expect(before.text).not.toContain("FAIL");
    expect(before.calls.some((c) => c.headers.apikey === PUB)).toBe(false);
  });
  it("once 042 is applied the gate expects ZERO internal exposure for service_role (and still all intended API objects)", async () => {
    const applied = await run();
    expect(applied.code).toBe(0);
    expect(applied.text).toMatch(/PASS service_role can reach every API object/);
    expect(applied.text).toMatch(/PASS nobody can reach the svc__ internals through the API \(17\)/);
    const stillExposed = await run({ exposeInternals: true });
    expect(stillExposed.code).toBe(1);
    expect(stillExposed.text).toMatch(/FAIL nobody can reach the svc__ internals through the API \(17\) :: svc__/);
  });
  it("the API object set never requires an internal to be exposed (internals are excluded from 'all API functions')", async () => {
    const r = await run({ hide: [...allFns.keys()].filter((n) => n.startsWith("svc__")) }); // internals absent from the elevated OpenAPI
    expect(r.code).toBe(0);
  });
  it("internals visible to service_role are a failure (service-role isolation)", async () => {
    const r = await run({ exposeInternals: true });
    expect(r.code).toBe(1);
    expect(r.text).toMatch(/FAIL nobody can reach the svc__ internals/);
  });
  it("a rejected elevated credential is DB_GATE_BLOCKED_AUTH (exit 6), not a failure and not a pass; 5xx / non-JSON / unreachable fail", async () => {
    expect((await run({ secretStatus: 401 })).code).toBe(6);
    expect((await run({ secretStatus: 500 })).code).toBe(1);
    const down = await runDbGate({ fetchImpl: (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch, env: env() });
    expect(down.code).toBe(1);
  });
  it("the elevated key is used for the schema and the positive control only", async () => {
    const r = await run();
    expect(r.calls.filter((c) => c.headers.apikey === SECRET).map((c) => new URL(c.url).pathname)).toEqual(["/rest/v1/", "/rest/v1/svc_requests"]);
    expect(r.text).toContain("positive control: elevated key reads svc_requests");
  });
});

describe("identity guards are unchanged", () => {
  it("production URL, other project, missing env: zero network calls", async () => {
    for (const [e, code] of [
      [env({ SERVICE_CORE_SUPABASE_URL: `https://${C.PRODUCTION_REF}.supabase.co` }), 2],
      [env({ SERVICE_CORE_SUPABASE_URL: "https://otherprojectrefaaaaaa.supabase.co" }), 2],
      [env({ SERVICE_CORE_STAGING_ANON_KEY: `sb_publishable_${C.PRODUCTION_REF}` }), 2],
      [{}, 3],
    ] as Array<[Record<string, string>, number]>) {
      const net = mini();
      const r = await runDbGate({ fetchImpl: net.fetchImpl, env: e });
      expect([r.code, net.calls.length]).toEqual([code, 0]);
    }
  });
});

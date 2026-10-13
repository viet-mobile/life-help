import { describe, expect, it } from "vitest";
import * as C from "../../scripts/staging/contract.cjs";
import { REQUIRED, CATALOG_ONLY, keyHeaders, objectsOf, runDbGate } from "../../scripts/staging/db-gate.mjs";

const STAGING = `https://${C.STAGING_REF}.supabase.co`;
const PUB = "sb_publishable_TESTONLY_not_a_real_key";
const SECRET = "sb_secret_TESTONLY_not_a_real_key";
const env = (over: Record<string, string> = {}) =>
  ({ ...Object.fromEntries(C.ALL_ENV_NAMES.map((n) => [n, C.URL_NAMES.includes(n) ? STAGING : n.includes("CONFIRM") || n.includes("EXPECTED") ? C.STAGING_REF : `x-${n}`])), SERVICE_CORE_SUPABASE_SECRET_KEY: SECRET, SERVICE_CORE_STAGING_ANON_KEY: PUB, ...over }) as Record<string, string>;

const files = REQUIRED.map((f: string) => ({ f, ...objectsOf(f) }));
const allTables: string[] = files.flatMap((x: { tables: string[] }) => x.tables);
const allFns = new Map<string, string[]>(files.flatMap((x: { fns: Map<string, string[]> }) => [...x.fns]));
// Table denial covers the full learning/service surface; RPC denial retains the service/entitlement surface.
const guarded = files.filter((x: { f: string }) => /service|entitle/.test(x.f));
const guardedTables: string[] = [...new Set(allTables)];
const guardedFns = new Map<string, string[]>(guarded.flatMap((x: { fns: Map<string, string[]> }) => [...x.fns]));

interface Opts {
  authSettings?: (key: string | undefined) => number;
  table?: (t: string) => Response | "throw";
  rpc?: (fn: string, body: Record<string, unknown>) => Response | "throw";
  hide?: string[];            // objects missing from the elevated OpenAPI (pending migration)
  exposeInternals?: boolean;  // internals LISTED in the elevated OpenAPI (PostgREST lists them whatever EXECUTE says)
  internalRpc?: (fn: string, body: Record<string, unknown>) => Response | "throw"; // what service_role gets when it calls an internal
  schemaVersion?: Response | "throw"; // the external positive-control RPC
  missingColumns?: Array<[string, string]>;
  learningReadStatus?: number;
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
    definitions: { ...Object.fromEntries(allTables.map(t => [t, { properties: Object.fromEntries((t === "learn_questions" ? ["id", "figure"] : t === "learn_courses" ? ["id", "elective"] : ["id"]).filter(c => !(o.missingColumns ?? []).some(([table, column]) => table === t && column === c)).map(c => [c, {}])) }])), ...Object.fromEntries([...allFns].map(([n, params]) => [`(rpc) ${n}`, { properties: Object.fromEntries(params.map((p) => [p, {}])) }])) },
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
      if (elevated && fn === "svc_core_schema_version") { if (o.schemaVersion === "throw") throw new TypeError("fetch failed"); return o.schemaVersion ?? json(200, 42); }
      if (elevated && fn.startsWith("svc__")) {
        const r = (o.internalRpc ?? ((f) => json(403, { code: "42501", message: `permission denied for function ${f}` })))(fn, JSON.parse(init.body ?? "{}"));
        if (r === "throw") throw new TypeError("fetch failed");
        return r;
      }
      if (elevated) return json(200, null);
      const r = (o.rpc ?? ((f) => denied(`function ${f}`)))(fn, JSON.parse(init.body ?? "{}"));
      if (r === "throw") throw new TypeError("fetch failed");
      return r;
    }
    if (u.pathname.startsWith("/rest/v1/")) {
      const t = u.pathname.split("/").pop()!;
      if (elevated && t === "learn_questions" && o.learningReadStatus) return json(o.learningReadStatus, { message: "denied" });
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
  it("every learning / service-core / entitlement table is called and refused", async () => {
    const r = await run();
    const tableCalls = r.calls.filter((c) => c.headers.apikey === PUB && /\/rest\/v1\/(svc_|learn_)/.test(c.url) && c.method === "GET");
    expect(tableCalls.length).toBe(guardedTables.length);
    expect(allTables).toEqual(expect.arrayContaining(["svc_requests", "svc_helpers", "svc_audit", "svc_outbox", "svc_request_sessions", "learn_entitlements"]));
    expect(r.text).toMatch(/PASS anon cannot read any of the \d+ learning \/ service-core/);
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
    const wrongShape = async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string }) => (url.endsWith("/rest/v1/") ? json(200, { paths: Object.fromEntries([...allTables.map((t) => [`/${t}`, {}]), ...[...allFns.keys()].filter((n) => !n.startsWith("svc__")).map((n) => [`/rpc/${n}`, {}])]), definitions: { learn_questions: { properties: { figure: {} } }, learn_courses: { properties: { elective: {} } } } }) : (net.fetchImpl as unknown as (u: string, i: unknown) => Promise<Response>)(url, init));
    const r = await runDbGate({ fetchImpl: wrongShape as unknown as typeof fetch, env: env() });
    expect(r.code).toBe(1);
  });
});

describe("elevated structural inspection", () => {
  it("reports visible and missing API postconditions, and stops at BLOCKED_MIGRATIONS_PENDING (exit 4) before any anonymous test", async () => {
    const r = await run({ hide: ["svc_request_sessions", "svc_c_claim"] });
    expect(r.code).toBe(4);
    expect(r.text).toContain("MIGRATIONS_PENDING = 202610100041_service_request_access.sql");
    expect(r.text).toContain(`MIGRATION_OBJECTS_VISIBLE = ${REQUIRED.filter((f: string) => f !== "202610100041_service_request_access.sql").join(", ")}`);
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
  it("once 042 is applied: intended external APIs are reachable and every internal is refused on direct execution - OpenAPI listing is irrelevant", async () => {
    const applied = await run();
    expect(applied.code).toBe(0);
    expect(applied.text).toMatch(/PASS service_role can reach every API object/);
    expect(applied.text).toMatch(/PASS service_role cannot EXECUTE any of the 17 svc__ internals/);
    expect(applied.text).toContain("positive control: elevated key executes the external server API (svc_core_schema_version)");
  });
  it("OpenAPI is not authority: internals LISTED in the spec + direct service_role call refused => PASS; absent from the spec + refused => PASS", async () => {
    expect((await run({ exposeInternals: true })).code).toBe(0);
    expect((await run({ exposeInternals: false })).code).toBe(0);
  });
  it("a successful direct service_role call to ANY internal fails the gate and names it (whether or not the spec lists it)", async () => {
    for (const fn of [...allFns.keys()].filter((n) => n.startsWith("svc__"))) {
      for (const exposeInternals of [true, false]) {
        const r = await run({ exposeInternals, internalRpc: (f) => (f === fn ? json(200, null) : json(403, { code: "42501", message: `permission denied for function ${f}` })) });
        expect(r.code, fn).toBe(1);
        expect(r.text, fn).toContain(`${fn}: HTTP 200 (EXECUTED)`);
      }
    }
  });
  it("only an unambiguous permission denial passes: invalid key, malformed bodies, wrong call shape (404), table-level denial, server errors and network failures all fail", async () => {
    const bad: Array<[string, Response | "throw"]> = [
      ["invalid API key", json(401, { message: "Invalid API key" })],
      ["wrong call shape / unknown RPC", json(404, { code: "PGRST202", message: "Could not find the function public.svc__fail(wrong) in the schema cache" })],
      ["malformed (not JSON)", new Response("<html>denied</html>", { status: 403 })],
      ["malformed (null body)", json(403, null)],
      ["permission error that is not about EXECUTE", json(403, { code: "42501", message: "permission denied for table svc_requests" })],
      ["unrelated 403", json(403, { message: "forbidden" })],
      ["server error", json(500, { message: "boom" })],
      ["network failure", "throw"],
    ];
    for (const [label, res] of bad) {
      const r = await run({ internalRpc: (f) => (f === "svc__emit" ? res : json(403, { code: "42501", message: `permission denied for function ${f}` })) });
      expect(r.code, label).toBe(1);
      expect(r.text, label).toMatch(/FAIL service_role cannot EXECUTE[^\n]*svc__emit/);
    }
  });
  it("each internal is called with the exact parameter names (null values) so that a granted EXECUTE would really enter the function", async () => {
    const r = await run();
    const internalCalls = r.calls.filter((c) => c.headers.apikey === SECRET && /\/rpc\/svc__/.test(c.url));
    expect(internalCalls.length).toBe([...allFns.keys()].filter((n) => n.startsWith("svc__")).length);
    for (const c of internalCalls) {
      const fn = c.url.split("/").pop()!;
      const body = JSON.parse(c.body!);
      expect(Object.keys(body).sort(), fn).toEqual([...allFns.get(fn)!].sort());
      expect(Object.values(body).every((v) => v === null), fn).toBe(true);
      expect(c.headers.Authorization, fn).toBeUndefined(); // sb_secret_* in apikey only
    }
  });
  it("the external positive control must still succeed: a failing or wrong answer from svc_core_schema_version fails the gate", async () => {
    for (const schemaVersion of [json(401, { message: "Invalid API key" }), json(200, 7), json(404, { code: "PGRST202" }), "throw" as const]) {
      expect((await run({ schemaVersion })).code).toBe(1);
    }
  });
  it("a rejected elevated credential is DB_GATE_BLOCKED_AUTH (exit 6), not a failure and not a pass; 5xx / non-JSON / unreachable fail", async () => {
    expect((await run({ secretStatus: 401 })).code).toBe(6);
    expect((await run({ secretStatus: 500 })).code).toBe(1);
    const down = await runDbGate({ fetchImpl: (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch, env: env() });
    expect(down.code).toBe(1);
  });
  it("the elevated key is used for: the schema, the positive controls, the structural reads/counts and the direct internal-execution probes - nothing else", async () => {
    const r = await run();
    const paths = r.calls.filter((c) => c.headers.apikey === SECRET).map((c) => new URL(c.url).pathname);
    expect(paths.slice(0, 4)).toEqual(["/rest/v1/", "/rest/v1/svc_requests", "/rest/v1/rpc/svc_core_schema_version", "/rest/v1/learn_questions"]);
    expect(paths.slice(4).every((p) => /^\/rest\/v1\/rpc\/svc__[a-z_]+$/.test(p))).toBe(true);
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


describe("learning foundation and column postconditions", () => {
  it("requires the learning foundation and staff table before access probes", async () => {
    for (const name of ["learn_question_answers", "learn_xp_ledger", "learn_staff_users", "learn_load_content"]) {
      const r = await run({ hide: [name] });
      expect(r.code, name).toBe(4);
      expect(r.text, name).toContain(name);
      expect(r.calls.some(c => c.headers.apikey === PUB), name).toBe(false);
    }
  });
  it("requires both 043 columns even when the unchanged content RPC name is visible", async () => {
    for (const [table, column] of [["learn_questions", "figure"], ["learn_courses", "elective"]]) {
      const r = await run({ missingColumns: [[table, column]] });
      expect(r.code).toBe(4);
      expect(r.text).toContain(`${table}.${column}`);
      expect(r.text).toContain("MIGRATIONS_PENDING = 202610130043_learning_question_figure.sql");
      expect(r.calls.some(c => c.headers.apikey === PUB)).toBe(false);
    }
  });
  it("does not claim migration history or constraint proof from API visibility", async () => {
    const r = await run();
    expect(r.text).toContain("MIGRATION_HISTORY = NOT_VERIFIED");
    expect(r.text).toContain("CATALOG_REVIEW_REQUIRED");
    expect(CATALOG_ONLY).toEqual(["202609300023_learning_prereq_shim.sql", "202609300027_learning_elementary_grades.sql"]);
    expect(r.text).not.toContain("MIGRATIONS_ALREADY_APPLIED");
  });
  it("does not require a trigger-returning function in OpenAPI", async () => {
    expect((await run({ hide: ["learn_enforce_publish_flow"] })).code).toBe(0);
  });
  it("fails if answer keys, student history or staff data are readable through the public key", async () => {
    for (const name of ["learn_question_answers", "learn_xp_ledger", "learn_staff_users", "learn_student_profiles"]) {
      const r = await run({ table: t => t === name ? json(200, []) : denied(`table ${t}`) });
      expect(r.code, name).toBe(1);
      expect(r.text, name).toContain(`${name}: HTTP 200 (access NOT denied)`);
    }
  });
  it("uses zero-row GETs for learning table controls and denials", async () => {
    const r = await run();
    const learning = r.calls.filter(c => new URL(c.url).pathname.match(/^\/rest\/v1\/learn_/));
    expect(learning.filter(c => c.headers.apikey === PUB)).toHaveLength(26);
    expect(learning.every(c => c.method === "GET" && new URL(c.url).searchParams.get("limit") === "0")).toBe(true);
    expect(learning.some(c => c.headers.apikey === SECRET && c.url.includes("/learn_questions?"))).toBe(true);
  });
  it("a failed elevated learning-table read is a failure, not proof of denial", async () => {
    expect((await run({ learningReadStatus: 403 })).code).toBe(1);
  });
});

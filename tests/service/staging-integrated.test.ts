import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as C from "../../scripts/staging/contract.cjs";
import { COUNTRY_TO_DEFAULT_LANGUAGE } from "@/proxy";
import { locales } from "@/messages/registry";

const SENTINEL = "SENTINEL_VALUE_9f3c1d"; // stands in for a secret: it must never be printed
const full = (over: Record<string, string> = {}) => Object.fromEntries(C.ALL_ENV_NAMES.map((n) => [n, C.URL_NAMES.includes(n) ? `https://${C.STAGING_REF}.supabase.co` : n.includes("CONFIRM") || n.includes("EXPECTED") ? C.STAGING_REF : `${SENTINEL}_${n}`])) as Record<string, string> & typeof over;
const read = (f: string) => readFileSync(f, "utf8");
const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); // comments may talk about "47" or "checkout"; code may not
// every spawned CLI gets an env file path that does not exist: a test can never read the operator's real file or reach staging
const NOFILE = "/nonexistent/life-help-test.env";
const clean = { PATH: process.env.PATH, STAGING_ENV_FILE: NOFILE } as unknown as NodeJS.ProcessEnv;

describe("env example and gitignore", () => {
  const example = read(".env.staging.local.example");
  const names = [...example.matchAll(/^([A-Z][A-Z0-9_]+)=(.*)$/gm)];
  it("lists exactly the variables the harnesses read, names only (every value empty)", () => {
    expect(names.map((m) => m[1]).sort()).toEqual([...C.ALL_ENV_NAMES].sort());
    for (const m of names) expect(m[2].trim(), m[1]).toBe("");
    expect(example).not.toContain(C.PRODUCTION_REF);
  });
  it("every variable the staging code reads is in the contract (no hidden variable)", () => {
    const sources = [read("scripts/staging/service-core-staging.mjs"), ...readdirSync("tests/staging").filter((f) => f.endsWith(".ts")).map((f) => read(join("tests/staging", f)))];
    const used = new Set<string>();
    for (const s of sources) for (const m of s.matchAll(/(?:process\.env|env)\.((?:TEST|SERVICE_CORE|EXPECTED_SERVICE_CORE)_[A-Z0-9_]+)/g)) used.add(m[1]);
    for (const n of used) expect(C.ALL_ENV_NAMES, n).toContain(n);
  });
  it(".env.staging.local is gitignored and never tracked (the operator's file may exist locally), the example is neither", () => {
    expect(spawnSync("git", ["check-ignore", "-q", ".env.staging.local"]).status).toBe(0);
    expect(spawnSync("git", ["check-ignore", "-q", ".env.staging.local.example"]).status).toBe(1);
    expect(spawnSync("git", ["ls-files", "--error-unmatch", ".env.staging.local"]).status).not.toBe(0);
    expect(spawnSync("git", ["ls-files", "--error-unmatch", ".env.staging.local.example"]).status).toBe(0);
  });
  it("the canonical local file lives in the integration worktree root", () => {
    const saved = process.env.STAGING_ENV_FILE;
    delete process.env.STAGING_ENV_FILE;
    const fresh = spawnSync("node", ["-e", "console.log(require('./scripts/staging/contract.cjs').ENV_FILE)"], { encoding: "utf8", env: { PATH: process.env.PATH } as unknown as NodeJS.ProcessEnv }).stdout.trim();
    if (saved) process.env.STAGING_ENV_FILE = saved;
    expect(fresh).toBe(join(process.cwd(), ".env.staging.local"));
  });
});

describe("integrated preflight", () => {
  it("nothing set -> BLOCKED_MISSING_ENV (not a failure), listing names only", () => {
    const r = C.preflight({});
    expect(r.status).toBe("BLOCKED_MISSING_ENV");
    expect(r.missing).toHaveLength(C.ALL_ENV_NAMES.length);
    expect(r.lines.join("\n")).toContain("production project excluded = YES");
  });
  it("complete staging env -> READY, and no value is ever printed", () => {
    const env = full();
    const r = C.preflight(env);
    expect(r.status).toBe("READY");
    expect([...r.lines, ...r.problems].join("\n")).not.toContain(SENTINEL);
  });
  it("any production reference (even inside a key) or a wrong ref -> REFUSED", () => {
    expect(C.preflight({ ...full(), TEST_SUPABASE_URL: `https://${C.PRODUCTION_REF}.supabase.co` }).status).toBe("REFUSED");
    expect(C.preflight({ ...full(), TEST_SUPABASE_ANON_KEY: `sb_${C.PRODUCTION_REF}` }).status).toBe("REFUSED");
    expect(C.preflight({ ...full(), SERVICE_CORE_SUPABASE_URL: "https://someotherprojectref.supabase.co" }).status).toBe("REFUSED");
    expect(C.preflight({ ...full(), SERVICE_CORE_SUPABASE_URL: "http://localhost:54321" }).status).toBe("REFUSED");
    const r = C.preflight({ ...full(), TEST_SUPABASE_ANON_KEY: `x${C.PRODUCTION_REF}` });
    expect(r.lines.join("\n")).toContain("production project excluded = NO");
  });
  it("the CLIs print only names / SET / MISSING / refs even when secrets are present in the environment", () => {
    for (const script of ["preflight.mjs", "integrated.mjs"]) {
      const env = { ...clean, ...full(), STAGING_ENV_FILE: NOFILE, TEST_SUPABASE_URL: `https://${C.PRODUCTION_REF}.supabase.co` } as NodeJS.ProcessEnv; // identity problem: stops before any step
      const r = spawnSync("node", [join("scripts/staging", script)], { encoding: "utf8", env, cwd: process.cwd() });
      expect(r.status, script).toBe(2);
      expect(r.stdout + r.stderr, script).not.toContain(SENTINEL);
      expect(r.stdout).toContain("production project excluded = NO");
    }
  });
  it("the runner with no env reports BLOCKED_MISSING_ENV (exit 3), never FAIL, and runs no step", () => {
    const r = spawnSync("node", ["scripts/staging/integrated.mjs"], { encoding: "utf8", env: clean });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("INTEGRATED STAGING VALIDATION = BLOCKED_MISSING_ENV");
    expect(r.stdout).not.toMatch(/FAIL|===/);
  });
});

describe("integrated runner", () => {
  const src = read("scripts/staging/integrated.mjs");
  it("runs the required gates in the required order, cleanup always", () => {
    const order = [...src.matchAll(/\{ id: "([a-z-]+)"/g)].map((m) => m[1]);
    expect(order).toEqual(["preflight", "target-guard", "db-gate", "service-core-harness", "service-journey", "main-locale-smoke", "learning-suite", "entitlements", "cleanup", "post-smoke"]);
    expect(src).toMatch(/id: "cleanup"[^\n]*always: true/);
    expect(src).toContain("BLOCKED_MISSING_ENV");
  });
  it("--plan lists the steps without touching anything", () => {
    const out = execFileSync("node", ["scripts/staging/integrated.mjs", "--plan"], { encoding: "utf8", env: clean });
    expect(out).toContain("not executed");
    expect(out.match(/^\s+\d+\./gm)).toHaveLength(10);
  });
  it("is wired as npm run staging:integrated / staging:preflight", () => {
    const scripts = JSON.parse(read("package.json")).scripts;
    expect(scripts["staging:integrated"]).toBe("node scripts/staging/integrated.mjs");
    expect(scripts["staging:preflight"]).toBe("node scripts/staging/preflight.mjs");
  });
});

describe("service-core harness keeps every hard gate", () => {
  const h = read("scripts/staging/service-core-staging.mjs");
  it("true concurrency, races, replays, idempotency, outbox, request access, negative authorization", () => {
    for (const needle of [
      "length: 20", "20 helpers accept", "svc_a_assign", "svc_c_cancel_request", "svc_h_start_request", "svc_h_complete_request", "p_client_id", "HELPER_ACCEPTED",
      "expired link", "revoked link", "old link after rotation", "svc_c_revoke_all_access", "svc_c_rotate_link", "stranger customer", "forged helper credential", "bare request id", "client()",
    ]) expect(h, needle).toContain(needle);
    expect(h).toContain("created.requests");
    expect(h).not.toMatch(/\.delete\(\)\s*;|delete\(\)\.neq/); // never an unfiltered delete
    expect(h).toContain("process.env.STAGING_RUN_ID");
  });
  it("uses a separate client (HTTP connection) per racer", () => {
    expect(h).toMatch(/const client = \(\) => createClient/);
    expect(h).toMatch(/client: client\(\)/);
  });
});

describe("integrated staging specs", () => {
  const specs = readdirSync("tests/staging").filter((f) => /^(main-locales|country-defaults|learning-locales|service-journey|entitlement|post-smoke)\.staging\.spec\.ts$/.test(f));
  it("all six exist and take their locale list from the registry (never a typed count)", () => {
    expect(specs).toHaveLength(6);
    const target = read("tests/staging/target.ts");
    expect(target).toContain("registryLocales()");
    for (const f of specs) expect(code(join("tests/staging", f)), f).not.toMatch(/\b47\b|toHaveCount\(\s*4\d\s*\)/);
    expect(read("tests/staging/main-locales.staging.spec.ts")).toContain("for (const l of LOCALES)");
  });
  it("the representative matrices are registry locales and cover RTL, Indic, African, CJK and Latin", () => {
    const src = read("tests/staging/target.ts");
    const matrix = [...src.split("export const MATRIX = [")[1].split("]")[0].matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1]);
    for (const l of matrix) expect(locales as readonly string[], l).toContain(l);
    for (const l of ["ko", "en", "vi", "ur", "ar", "fr", "sw", "mr", "gu", "pa", "te", "kn", "ml", "ja", "zh-Hans"]) expect(matrix).toContain(l);
  });
  it("country defaults tested on staging equal the proxy's configuration (and name the four required ones)", () => {
    const src = read("tests/staging/country-defaults.staging.spec.ts");
    const pairs = [...src.matchAll(/\["([a-z]+)\.life\.help", "([A-Za-z-]+)"\]/g)].map((m) => [m[1], m[2]]);
    expect(pairs.length).toBeGreaterThanOrEqual(13);
    for (const [slug, lang] of pairs) expect(COUNTRY_TO_DEFAULT_LANGUAGE[slug], slug).toBe(lang);
    for (const need of [["pakistan", "ur"], ["centralafrica", "fr"], ["kenya", "sw"], ["korea", "ko"], ["romania", "en"], ["finland", "en"], ["czechia", "en"], ["hungary", "en"], ["zambia", "en"], ["uganda", "en"], ["congo", "fr"]]) expect(pairs).toContainEqual(need);
  });
  it("learning staging: all three sites, the required switching journeys, target-language and progress assertions", () => {
    const s = read("tests/staging/learning-locales.staging.spec.ts");
    for (const needle of ['["en", "mr", "ur"]', '["vi", "ur", "sw", "te"]', '["en", "vi", "ur", "sw", "mr"]', "안녕하세요.", "must not change the learner's stored progress", "Worker-only", "SITES"]) expect(s, needle).toContain(needle);
  });
  it("entitlement staging: free, locked, entitled, direct URL, locale switch, revoke, expiry, progress; run-scoped, no payment", () => {
    const s = read("tests/staging/entitlement.staging.spec.ts");
    for (const needle of ["free lesson is open", "premium locked in", "premium open with an entitlement", "premium locked after revoke", "premium locked after expiry", "progress", "learn_grant_entitlement", "learn_revoke_entitlement", "RUN_ID"]) expect(s, needle).toContain(needle);
    expect(code("tests/staging/entitlement.staging.spec.ts")).not.toMatch(/stripe|checkout|paymentIntent|crypto/i);
  });
  it("a dry run can only target localhost; the staging pin fails closed", () => {
    const t = read("tests/staging/target.ts");
    expect(t).toContain('process.env.STAGING_DRYRUN === "1"');
    expect(t).toContain("http:\\/\\/localhost");
    expect(t).toContain("staging pin failed");
  });
});

describe("staging Worker configuration audit", () => {
  const cfg = read("wrangler.staging.jsonc");
  const prod = read("wrangler.jsonc");
  const strip = (s: string) => JSON.parse(s.replace(/^\s*\/\/.*$/gm, ""));
  const staging = strip(cfg);
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const n of readdirSync(dir)) { const p = join(dir, n); if (n === "node_modules" || n === ".next") continue; if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(n)) out.push(p); }
    return out;
  };
  it("every Worker-side variable the source reads is classified", () => {
    const found = new Set<string>();
    for (const f of [...walk("app"), ...walk("lib"), ...walk("utils"), "proxy.ts"]) {
      const s = read(f);
      for (const m of s.matchAll(/\b((?:LEARN_SUPABASE|SERVICE_CORE|EXPECTED_LEARN|EXPECTED_SERVICE_CORE|LIFE_HELP_SYS|NEXT_PUBLIC_SUPABASE)_[A-Z_]+|APP_ENV|AUTH_ENFORCEMENT|LEARN_CONTENT_SOURCE)\b/g)) found.add(m[1]);
    }
    found.delete("SERVICE_CORE_MIGRATIONS"); found.delete("LEARN_SUPABASE_"); found.delete("SERVICE_CORE_SUPABASE_"); found.delete("NEXT_PUBLIC_SUPABASE_");
    const known = new Set(C.WORKER_BINDINGS.map((b) => b.name));
    for (const n of found) expect(known.has(n), `${n} is read by the source but not classified in WORKER_BINDINGS`).toBe(true);
  });
  it("DECLARED vars are really in wrangler.staging.jsonc; secrets are never written into any wrangler file", () => {
    for (const b of C.WORKER_BINDINGS) {
      if (b.class === "DECLARED_IN_WRANGLER_STAGING") expect(staging.vars[b.name], b.name).toBeTruthy();
      if (b.class === "MUST_BE_SET_AS_STAGING_SECRET") { expect(staging.vars?.[b.name], b.name).toBeUndefined(); expect(cfg).not.toMatch(new RegExp(`"${b.name}"\\s*:`)); }
    }
  });
  it("service core and learning point at the staging project only (never production)", () => {
    expect(staging.vars.SERVICE_CORE_SUPABASE_URL).toBe(`https://${C.STAGING_REF}.supabase.co`);
    expect(staging.vars.EXPECTED_SERVICE_CORE_SUPABASE_REF).toBe(C.STAGING_REF);
    expect(staging.vars.EXPECTED_LEARN_SUPABASE_REF).toBe(C.STAGING_REF);
    expect(staging.vars.APP_ENV).toBe("staging");
    expect(cfg).not.toContain(C.PRODUCTION_REF);
    expect(staging.vars.SERVICE_CORE_BACKEND).toBeUndefined(); // the embedded local database must never be selectable on staging
    expect(staging.name).toBe(C.STAGING_WORKER);
  });
  it("assets binding, populate_process_env flag and worker-first overlay path match what the code needs (and production)", () => {
    expect(staging.assets.binding).toBe("ASSETS");
    expect(staging.compatibility_flags).toContain("nodejs_compat_populate_process_env");
    expect(staging.assets.run_worker_first).toEqual(strip(prod).assets.run_worker_first);
  });
});

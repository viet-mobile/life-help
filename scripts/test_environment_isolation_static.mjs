// Deterministic environment-isolation tests (no network: every spawned child runs with fetch,
// WebSocket and socket connects disabled, so even a broken guard could not reach any host).
//
// Proves: staging/production/unknown project detection, E2E tripwires, build/dev env resolution
// (incl. the original .env.local -> staging leak), the reciprocal production guard, the output
// scanner (server + browser, plain refs, URLs and JWT ref claims), secret redaction and the
// package.json command architecture.
// Usage: node scripts/test_environment_isolation_static.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as guard from "./lib/envGuard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}
const throws = (fn) => { try { fn(); return null; } catch (error) { return error; } };

// ---------- fake credentials (shape only; never real) ----------
const { STAGING, PRODUCTION } = guard.REFS;
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const fakeJwt = (ref, role = "anon") => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: "supabase", ref, role, iat: 1, exp: 9999999999 })}.${"s".repeat(43)}`;
const STAGING_URL = `https://${STAGING}.supabase.co`, PRODUCTION_URL = `https://${PRODUCTION}.supabase.co`, UNKNOWN_URL = "https://abcdefghijklmnopqrst.supabase.co";
const SECRET_SERVICE = fakeJwt(PRODUCTION, "service_role"), STAGING_ANON = fakeJwt(STAGING), PRODUCTION_ANON = fakeJwt(PRODUCTION);
const SECRET_MARKER = "SUPERSECRETVALUE-do-not-print-1234567890";

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-envguard-"));
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), typeof content === "string" ? content : Object.entries(content).map(([k, v]) => `${k}=${v}`).join("\n"));
  }
  return dir;
}
const stagingEnvFile = { TEST_SUPABASE_URL: STAGING_URL, TEST_SUPABASE_ANON_KEY: STAGING_ANON, TEST_SUPABASE_SERVICE_ROLE_KEY: fakeJwt(STAGING, "service_role"), EXPECTED_STAGING_PROJECT_REF: STAGING, TEST_LIFE_HELP_SETTLEMENT_TOKEN: SECRET_MARKER };
const productionEnvLocal = { NEXT_PUBLIC_SUPABASE_URL: PRODUCTION_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: PRODUCTION_ANON };
const cleanup = [];
const fx = (files) => { const dir = fixture(files); cleanup.push(dir); return dir; };

// ---------- project detection ----------
check("projectRef parses staging/production/unknown/garbage", guard.projectRef(STAGING_URL) === STAGING && guard.projectRef(`${PRODUCTION_URL}/rest/v1/`) === PRODUCTION && guard.projectRef(UNKNOWN_URL) === "abcdefghijklmnopqrst" && guard.projectRef("https://evil.example") === null && guard.projectRef("") === null);
check("refsIn detects plain refs, URLs and JWT ref claims", guard.refsIn(PRODUCTION_URL).has("PRODUCTION") && guard.refsIn(PRODUCTION_ANON).has("PRODUCTION") && guard.refsIn(STAGING_ANON).has("STAGING") && guard.refsIn("nothing here").size === 0);

// ---------- staging guard ----------
check("Staging guard accepts the staging ref", guard.assertStagingUrl(STAGING_URL) === STAGING);
const prodErr = throws(() => guard.assertStagingUrl(PRODUCTION_URL, "TEST"));
check("Staging guard rejects the production ref", prodErr instanceof guard.EnvGuardError && prodErr.message.includes("PRODUCTION"));
const unknownErr = throws(() => guard.assertStagingUrl(UNKNOWN_URL, "TEST"));
check("Staging guard rejects an unknown ref", unknownErr instanceof guard.EnvGuardError && unknownErr.message.includes("UNKNOWN"));
check("Staging guard rejects a missing / non-Supabase URL", !!throws(() => guard.assertStagingUrl(undefined)) && !!throws(() => guard.assertStagingUrl("https://example.com")));
check("Guard messages never contain the URL itself", !prodErr.message.includes(PRODUCTION_URL) && !unknownErr.message.includes(UNKNOWN_URL));
check("Production guard accepts production, rejects staging and unknown", guard.assertProductionUrl(PRODUCTION_URL) === PRODUCTION && !!throws(() => guard.assertProductionUrl(STAGING_URL)) && !!throws(() => guard.assertProductionUrl(UNKNOWN_URL)));

const okDir = fx({ ".env.staging.local": stagingEnvFile, ".env.local": productionEnvLocal });
check("loadStagingEnv accepts a staging env file (even with production .env.local present)", guard.loadStagingEnv({ cwd: okDir }).TEST_SUPABASE_URL === STAGING_URL);
check("loadStagingEnv rejects a production TEST_SUPABASE_URL", !!throws(() => guard.loadStagingEnv({ cwd: fx({ ".env.staging.local": { ...stagingEnvFile, TEST_SUPABASE_URL: PRODUCTION_URL } }) })));
check("loadStagingEnv rejects an unknown project", !!throws(() => guard.loadStagingEnv({ cwd: fx({ ".env.staging.local": { ...stagingEnvFile, TEST_SUPABASE_URL: UNKNOWN_URL } }) })));
const mixedErr = throws(() => guard.loadStagingEnv({ cwd: fx({ ".env.staging.local": { ...stagingEnvFile, TEST_SUPABASE_SERVICE_ROLE_KEY: SECRET_SERVICE } }) }));
check("loadStagingEnv rejects a production key behind a staging URL (JWT ref claim)", mixedErr?.message.includes("TEST_SUPABASE_SERVICE_ROLE_KEY") && !mixedErr.message.includes(SECRET_SERVICE));
check("loadStagingEnv rejects EXPECTED_STAGING_PROJECT_REF = production", !!throws(() => guard.loadStagingEnv({ cwd: fx({ ".env.staging.local": { ...stagingEnvFile, EXPECTED_STAGING_PROJECT_REF: PRODUCTION } }) })));
check("loadStagingEnv refuses when .env.staging.local is missing (no fallback to .env.local)", !!throws(() => guard.loadStagingEnv({ cwd: fx({ ".env.local": productionEnvLocal }) })));
check("stagingTarget rejects a non-staging Worker host", !!throws(() => guard.stagingTarget({ cwd: okDir, base: "https://life-help.example.workers.dev" })) && guard.stagingTarget({ cwd: okDir }).base.includes(guard.STAGING_WORKER_HOST));

// ---------- the original leak, reproduced deterministically ----------
// 468e55c-era: deploy:staging ran a plain build, so Next resolved NEXT_PUBLIC_* from .env.local.
const legacy = guard.resolveBuildEnv({ cwd: okDir, target: "production", processEnv: {} });
check("Original leak reproduced: a plain build over this .env.local resolves to PRODUCTION", legacy.effectiveRef === PRODUCTION && Object.keys(legacy.overrides).length === 0);
const legacyOutput = fx({
  ".open-next/server-functions/default/chunk.js": `let r="${PRODUCTION_URL}/rest/v1/".replace(/x/,"")`,
  ".open-next/cloudflare/next-env.mjs": `export const production = {"NEXT_PUBLIC_SUPABASE_URL":"${PRODUCTION_URL}","NEXT_PUBLIC_SUPABASE_ANON_KEY":"${PRODUCTION_ANON}"};`,
  ".open-next/assets/_next/static/chunks/app.js": "console.log('clean browser chunk')",
});
const legacyScan = guard.scanOutput({ cwd: legacyOutput });
const legacyErrors = guard.verifyOutput(guard.inspectOutput(legacyOutput), "staging");
check("Original leak shape (prod URL in server chunks, browser clean) is caught", legacyScan.browser.PRODUCTION === 0 && legacyScan.server.PRODUCTION >= 3 && legacyErrors.some((e) => e.includes("server/Worker bundle contains")), JSON.stringify(legacyScan.server));

// ---------- staging / generic build env resolution ----------
const staged = guard.resolveBuildEnv({ cwd: okDir, target: "staging", processEnv: {} });
check("Staging build overrides NEXT_PUBLIC Supabase with staging values", staged.effectiveRef === STAGING && staged.overrides.NEXT_PUBLIC_SUPABASE_URL === STAGING_URL && staged.overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY === STAGING_ANON);
const extraProd = fx({ ".env.staging.local": stagingEnvFile, ".env.local": { ...productionEnvLocal, SUPABASE_SERVICE_ROLE_KEY: SECRET_SERVICE } });
const extraErr = throws(() => guard.resolveBuildEnv({ cwd: extraProd, target: "staging", processEnv: {} }));
check("Staging build fails on any other production-valued .env.local entry (next-env.mjs leak)", extraErr?.message.includes("SUPABASE_SERVICE_ROLE_KEY") && !extraErr.message.includes(SECRET_SERVICE));
check("Staging build fails on production values in .env.production(.local)", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.staging.local": stagingEnvFile, ".env.production": { SUPABASE_URL: PRODUCTION_URL } }), target: "staging", processEnv: {} })));
check("Staging build fails on a production SUPABASE_URL exported in the shell", !!throws(() => guard.resolveBuildEnv({ cwd: okDir, target: "staging", processEnv: { SUPABASE_URL: PRODUCTION_URL } })));
check("Staging build tolerates a production NEXT_PUBLIC_* in the shell (it is overridden)", guard.resolveBuildEnv({ cwd: okDir, target: "staging", processEnv: { NEXT_PUBLIC_SUPABASE_URL: PRODUCTION_URL } }).overrides.NEXT_PUBLIC_SUPABASE_URL === STAGING_URL);
check("Build without an explicit target is refused", !!throws(() => guard.resolveBuildEnv({ cwd: okDir, processEnv: {} })));
check("Generic build without .env.staging.local cannot fall back to production", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.local": productionEnvLocal }), target: "staging", processEnv: {} })));
check("Dev mode checks .env.development(.local) too", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.staging.local": stagingEnvFile, ".env.development.local": { SUPABASE_URL: PRODUCTION_URL } }), target: "staging", mode: "dev", processEnv: {} })));

// ---------- reciprocal production build guard (local only, never contacts production) ----------
check("Production build accepts a production-only configuration", guard.resolveBuildEnv({ cwd: fx({ ".env.local": productionEnvLocal }), target: "production", processEnv: {} }).effectiveRef === PRODUCTION);
check("Production build rejects a staging NEXT_PUBLIC_SUPABASE_URL", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.local": { ...productionEnvLocal, NEXT_PUBLIC_SUPABASE_URL: STAGING_URL } }), target: "production", processEnv: {} })));
check("Production build rejects a staging anon key behind a production URL", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.local": { ...productionEnvLocal, NEXT_PUBLIC_SUPABASE_ANON_KEY: STAGING_ANON } }), target: "production", processEnv: {} })));
check("Production build rejects any staging-valued entry (files or shell)", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.local": { ...productionEnvLocal, SUPABASE_URL: STAGING_URL } }), target: "production", processEnv: {} })) && !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.local": productionEnvLocal }), target: "production", processEnv: { EXTRA: STAGING_URL } })));
check("Production build rejects unknown / missing projects", !!throws(() => guard.resolveBuildEnv({ cwd: fx({ ".env.local": { NEXT_PUBLIC_SUPABASE_URL: UNKNOWN_URL } }), target: "production", processEnv: {} })) && !!throws(() => guard.resolveBuildEnv({ cwd: fx({}), target: "production", processEnv: {} })));
check("Production build never overrides env (deploy:production behaviour kept)", Object.keys(guard.resolveBuildEnv({ cwd: fx({ ".env.local": productionEnvLocal }), target: "production", processEnv: {} }).overrides).length === 0);

// ---------- output scanner ----------
const clean = fx({
  ".open-next/server-functions/default/chunk.js": `let r="${STAGING_URL}/rest/v1/"`,
  ".open-next/cloudflare/next-env.mjs": `export const production = {"NEXT_PUBLIC_SUPABASE_URL":"${STAGING_URL}"};`,
  ".open-next/assets/_next/static/chunks/app.js": "console.log('browser')",
  ".next/cache/stale.js": `"${PRODUCTION_URL}"`,
});
const cleanScan = guard.scanOutput({ cwd: clean });
check("Clean staging output passes (cache dirs ignored)", guard.verifyOutput(guard.inspectOutput(clean), "staging").length === 0 && cleanScan.server.STAGING > 0 && cleanScan.server.PRODUCTION === 0, JSON.stringify(cleanScan));
const inject = (files) => guard.verifyOutput(guard.inspectOutput(fx({ ".open-next/server-functions/default/chunk.js": `let r="${STAGING_URL}"`, ...files })), "staging");
check("Scanner catches a production URL injected into a server chunk", inject({ ".open-next/server-functions/default/x.js": `"${PRODUCTION_URL}"` }).some((e) => e.includes("server")));
check("Scanner catches a production ref injected into a browser chunk", inject({ ".open-next/assets/_next/static/chunks/x.js": `"${PRODUCTION}"` }).some((e) => e.includes("browser")));
check("Scanner catches a production anon key with no visible URL (JWT ref claim)", inject({ ".open-next/assets/_next/static/chunks/k.js": `k="${PRODUCTION_ANON}"` }).some((e) => e.includes("browser")));
check("Scanner catches production values in next-env.mjs / manifests / worker.js", inject({ ".open-next/cloudflare/next-env.mjs": `"${PRODUCTION_URL}"` }).length > 0 && inject({ ".next/required-server-files.json": `{"x":"${PRODUCTION}"}` }).length > 0 && inject({ ".open-next/worker.js": `"${PRODUCTION}"` }).length > 0);
check("Staging output without staging config fails", guard.verifyOutput(guard.inspectOutput(fx({ ".open-next/worker.js": "clean" })), "staging").some((e) => e.includes("no STAGING")));
check("A bare staging allow-list constant is not mistaken for staging config", guard.verifyOutput(guard.inspectOutput(fx({ ".open-next/worker.js": `const STAGING_REF = "${STAGING}";` })), "staging").some((e) => e.includes("no STAGING")));
const prodOut = fx({ ".open-next/server-functions/default/chunk.js": `let r="${PRODUCTION_URL}"; const STAGING_REF = "${STAGING}";` });
check("Production output: production config + staging allow-list constant passes", guard.verifyOutput(guard.inspectOutput(prodOut), "production").length === 0);
const prodLeak = fx({ ".open-next/server-functions/default/chunk.js": `let r="${PRODUCTION_URL}"; let s="${STAGING_URL}"; let k="${STAGING_ANON}"` });
check("Production output with a staging URL / key fails", guard.verifyOutput(guard.inspectOutput(prodLeak), "production").some((e) => e.includes("STAGING")));
check("Production output without production config fails", guard.verifyOutput(guard.inspectOutput(fx({ ".open-next/worker.js": `const STAGING_REF = "${STAGING}";` })), "production").some((e) => e.includes("no PRODUCTION")));

// ---------- redaction ----------
const redacted = guard.redact(`boom ${SECRET_MARKER} ${SECRET_SERVICE}`, [SECRET_MARKER]);
check("redact removes supplied secrets and any JWT", !redacted.includes(SECRET_MARKER) && !redacted.includes(SECRET_SERVICE) && redacted.includes("[REDACTED]"));

// ---------- entry points fail closed, offline, without printing secrets ----------
const offline = `data:text/javascript,${encodeURIComponent("import net from 'node:net'; const no = () => { throw new Error('NETWORK DISABLED IN TEST'); }; globalThis.fetch = no; globalThis.WebSocket = class { constructor() { no(); } }; net.Socket.prototype.connect = no;")}`;
function run(script, cwd, args = [], env = {}) {
  const result = spawnSync(process.execPath, ["--import", offline, path.join(root, script), ...args], { cwd, encoding: "utf8", env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...env }, timeout: 60000 });
  return { status: result.status, out: `${result.stdout}\n${result.stderr}` };
}
const secretLeaked = (out) => [SECRET_MARKER, SECRET_SERVICE, PRODUCTION_ANON, STAGING_ANON].some((s) => out.includes(s));
const badStaging = fx({ ".env.staging.local": { ...stagingEnvFile, TEST_SUPABASE_URL: PRODUCTION_URL }, ".env.local": { ...productionEnvLocal, EXTRA_SECRET: SECRET_MARKER } });
const unknownStaging = fx({ ".env.staging.local": { ...stagingEnvFile, TEST_SUPABASE_URL: UNKNOWN_URL } });
for (const script of ["scripts/test_full_staging_journey.mjs", "scripts/test_cleanup_retry_staging.mjs", "scripts/test_payout_authorization_staging.mjs", "scripts/test_web_push_staging.mjs", "scripts/test_ownership_rematch_staging.mjs", "scripts/test_staging_smoke.mjs", "scripts/test_rematch_exclusion_staging.mjs"]) {
  const prod = run(script, badStaging), unknown = run(script, unknownStaging);
  check(`${path.basename(script)}: production target stops before any mutation`, prod.status !== 0 && prod.out.includes("ENV GUARD FAIL") && prod.out.includes("PRODUCTION") && !prod.out.includes("NETWORK DISABLED") && !secretLeaked(prod.out), prod.out.slice(0, 300));
  check(`${path.basename(script)}: unknown project stops before any mutation`, unknown.status !== 0 && unknown.out.includes("UNKNOWN") && !unknown.out.includes("NETWORK DISABLED"), unknown.out.slice(0, 300));
}
const atomic = run("scripts/test_atomic_matching_concurrency.mjs", unknownStaging, [], { ALLOW_DESTRUCTIVE_STAGING_TESTS: "true" });
check("test_atomic_matching_concurrency.mjs: unknown project stops before any mutation", atomic.status !== 0 && atomic.out.includes("ENV GUARD FAIL") && !atomic.out.includes("NETWORK DISABLED"), atomic.out.slice(0, 300));
const live = read("scripts/test_request_api_live.mjs");
check("test_request_api_live.mjs: shared staging guard runs before any client/server is created", live.indexOf("assertStagingUrl(url") > 0 && live.indexOf("assertStagingUrl(url") < live.indexOf("createClient(") && live.indexOf("assertStagingUrl(url") < live.indexOf("function startServer"));

const buildFail = run("scripts/build.mjs", fx({ ".env.staging.local": stagingEnvFile, ".env.local": { ...productionEnvLocal, SUPABASE_SERVICE_ROLE_KEY: SECRET_SERVICE, OTHER: `${PRODUCTION_URL}?token=${SECRET_MARKER}` } }), ["--target=staging"]);
check("npm run build (staging target) refuses a production-wired env before building, printing no secrets", buildFail.status !== 0 && buildFail.out.includes("ENV GUARD FAIL") && !buildFail.out.includes("Creating an optimized") && !secretLeaked(buildFail.out), buildFail.out.slice(0, 300));
const noTarget = run("scripts/build.mjs", okDir);
check("build.mjs without --target is refused", noTarget.status !== 0 && noTarget.out.includes("explicitly"));
const prodBuildBad = run("scripts/build.mjs", fx({ ".env.local": { NEXT_PUBLIC_SUPABASE_URL: STAGING_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: STAGING_ANON } }), ["--target=production"]);
check("build:production refuses a staging-wired env (no build, no network)", prodBuildBad.status !== 0 && prodBuildBad.out.includes("STAGING") && !prodBuildBad.out.includes("NETWORK DISABLED") && !secretLeaked(prodBuildBad.out), prodBuildBad.out.slice(0, 300));
const devFail = run("scripts/dev.mjs", fx({ ".env.local": productionEnvLocal }));
check("npm run dev refuses without the staging env (never falls back to production .env.local)", devFail.status !== 0 && devFail.out.includes("ENV GUARD FAIL"), devFail.out.slice(0, 300));
const previewFail = run("scripts/preview.mjs", fx({ ".env.local": productionEnvLocal, ".dev.vars": productionEnvLocal }));
check("npm run preview refuses without the staging env", previewFail.status !== 0 && previewFail.out.includes("ENV GUARD FAIL"), previewFail.out.slice(0, 300));
const verifyLeak = run("scripts/verify-build.mjs", legacyOutput, ["--target=staging"]);
check("verify-build fails on the original leak shape and prints counts only", verifyLeak.status !== 0 && verifyLeak.out.includes("server PRODUCTION=") && !verifyLeak.out.includes(PRODUCTION_URL) && !secretLeaked(verifyLeak.out), verifyLeak.out.slice(0, 300));
const testsFail = run("scripts/run-tests.mjs", root, [], { NEXT_PUBLIC_SUPABASE_URL: PRODUCTION_URL });
check("npm test refuses a production-wired shell", testsFail.status !== 0 && testsFail.out.includes("ENV GUARD FAIL") && !testsFail.out.includes(PRODUCTION_URL));

// ---------- command architecture ----------
const scripts = JSON.parse(read("package.json")).scripts;
check("npm run build = staging target", scripts.build === "node scripts/build.mjs --target=staging" && scripts["build:staging"] === scripts.build && scripts["build:next"] === "node scripts/build.mjs --target=staging --next-only");
check("npm run dev / start / preview / test are guarded", scripts.dev === "node scripts/dev.mjs" && scripts.start === "node scripts/dev.mjs --start" && scripts.preview === "node scripts/preview.mjs" && scripts.test === "node scripts/run-tests.mjs");
check("Production build/deploy only via explicit production scripts", scripts["build:production"] === "node scripts/build.mjs --target=production" && scripts["deploy:production"] === "node scripts/build.mjs --target=production && node scripts/verify-build.mjs --target=production && wrangler deploy --name life-help");
check("deploy:staging = staging build + output verification + staging config", scripts["deploy:staging"] === "node scripts/build.mjs --target=staging && node scripts/verify-build.mjs --target=staging && wrangler deploy --config wrangler.staging.jsonc");
check("npm run deploy still refuses", scripts.deploy === "node scripts/refuse-ambiguous-deploy.mjs");
const raw = Object.entries(scripts).filter(([, cmd]) => /(^|&&\s*)(next (dev|build|start)|opennextjs-cloudflare build|wrangler dev)\b/.test(cmd)).map(([name]) => name);
check("No npm script runs next/opennext/wrangler dev unguarded", raw.length === 0, raw.join(","));
// No script may spawn the raw toolchain itself (only the guarded wrappers do), unless it refuses to run first.
const spawners = fs.readdirSync(path.join(root, "scripts")).filter((f) => /\.(mjs|js)$/.test(f) && !["dev.mjs", "build.mjs", "preview.mjs", "test_environment_isolation_static.mjs"].includes(f))
  .filter((f) => { const src = fs.readFileSync(path.join(root, "scripts", f), "utf8"); return /\[\s*"next"\s*,\s*"(dev|build|start)"|"wrangler"\s*,\s*\[\s*"dev"|opennextjs-cloudflare"\s*,\s*\[\s*"build"/.test(src) && !/process\.exit\(2\);/.test(src.split("\n").slice(0, 40).join("\n")); });
check("No script spawns raw next / wrangler dev / opennextjs build outside the guarded wrappers", spawners.length === 0, spawners.join(","));
const buildSrc = read("scripts/build.mjs");
check("build.mjs removes stale .next/.open-next before building", buildSrc.includes('for (const dir of [".next", ".open-next"]) fs.rmSync'));
check("preview never loads the project .dev.vars", read("scripts/preview.mjs").includes('"--config", path.join(dir, "wrangler.json")') && read("scripts/preview.mjs").includes('path.join(dir, ".dev.vars")'));

// ---------- runtime source + staging scripts ----------
const walk = (dir) => (fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`])) : []);
const runtimeFiles = [...["app", "lib", "utils", "components", "public"].flatMap(walk), "proxy.ts"].filter((f) => /\.(tsx?|m?js|json)$/.test(f));
const prodInRuntime = runtimeFiles.filter((f) => read(f).includes(PRODUCTION));
check("Runtime source embeds no production project ref (allow-list guards only)", prodInRuntime.length === 0, prodInRuntime.join(","));
const stagingScripts = fs.readdirSync(path.join(root, "scripts")).filter((f) => f.endsWith(".mjs") && read(`scripts/${f}`).includes(".env.staging.local"));
const unguarded = stagingScripts.filter((f) => !read(`scripts/${f}`).includes("envGuard.mjs") && !read(`scripts/${f}`).includes("stagingPushHarness.mjs"));
check("Every script that reads .env.staging.local uses the shared guard", unguarded.length === 0, unguarded.join(","));
const harness = read("scripts/lib/stagingPushHarness.mjs");
check("Push/ownership harness guards before exporting any fixture helper", harness.indexOf("stagingTarget()") > 0 && harness.indexOf("stagingTarget()") < harness.indexOf("export async function db("));

for (const dir of cleanup) fs.rmSync(dir, { recursive: true, force: true });
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

#!/usr/bin/env node
/**
 * ONE command for the integrated STAGING validation: `npm run staging:integrated`  (`-- --plan` lists the steps, touches nothing).
 *
 *   1 preflight            variable NAMES SET/MISSING only            missing env  -> BLOCKED_MISSING_ENV (exit 3), never FAIL
 *   2 target guard         staging identity proven, production refused identity problem -> REFUSED (exit 2)
 *   3 migration + DB gate  read-only audit, grants/RLS as exposed      pending migrations -> BLOCKED_MIGRATIONS_PENDING (exit 4)
 *   4 service-core harness 20-connection races, replay, idempotency, request-link expiry/revocation/rotation/revoke-all, negative auth
 *   5 service journey      customer / helper / admin in three browser contexts on the staging Worker
 *   6 main 47-locale smoke registry-derived picker/lang/dir for every locale + representative matrix + country defaults
 *   7 learning suite       math / english / study.korean pickers (registry count), switching, target-language rules, overlay assets
 *   8 entitlements         free / premium boundary with run-scoped entitlement fixtures (no checkout, no provider)
 *   9 cleanup + residue    run-scoped cleanup, CURRENT_RUN_RESIDUE = 0, FOREIGN_ROWS_UNTOUCHED     (runs even after a failure)
 *  10 post-smoke           main, request, helper portal, admin, math, english, study.korean still serve
 * A failed hard gate stops the remaining gates (never skipped silently) but cleanup is still attempted. Nothing is deployed or pushed here;
 * the Worker must already run the integrated build (see docs/staging-integrated.md). If the staging Worker does not serve the integrated
 * service API (never deployed / HEAD never activated) the browser steps are classified BLOCKED_NOT_DEPLOYED - a deployment state, not a
 * product failure - and the run can never end as VALIDATED. A rejected credential is BLOCKED_AUTH (db gate) / CLEANUP_BLOCKED_AUTH (cleanup).
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ROOT, STAGING_HOST, loadStagingEnv, preflight } from "./contract.cjs";

const PW = ["npx", "playwright", "test", "-c", "playwright.staging.config.ts"];

export const STEPS = [
  { id: "preflight", title: "preflight" },
  { id: "target-guard", title: "target-project guard" },
  { id: "db-gate", title: "migration audit + DB gate", cmd: ["node", "scripts/staging/db-gate.mjs", "--snapshot", "{baseline}"], blockedCodes: { 4: "BLOCKED_MIGRATIONS_PENDING", 3: "BLOCKED_MISSING_ENV", 6: "BLOCKED_AUTH" } },
  { id: "service-core-harness", title: "service-core staging harness (true concurrency)", cmd: ["node", "scripts/staging/service-core-staging.mjs"] },
  { id: "service-journey", title: "three-client service journey", browser: true, cmd: [...PW, "tests/staging/service-journey.staging.spec.ts"] },
  { id: "main-locale-smoke", title: "main site 47-locale smoke + country defaults", browser: true, cmd: [...PW, "tests/staging/main-locales.staging.spec.ts", "tests/staging/country-defaults.staging.spec.ts"] },
  { id: "learning-suite", title: "learning staging suite (47-locale aware)", browser: true, cmd: [...PW, "tests/staging/learning-locales.staging.spec.ts"] },
  { id: "entitlements", title: "free / premium entitlement gates", browser: true, cmd: [...PW, "tests/staging/entitlement.staging.spec.ts"] },
  { id: "cleanup", title: "run-scoped cleanup + residue verifier", cmd: ["node", "scripts/staging/cleanup.mjs", "--baseline", "{baseline}"], always: true, blockedCodes: { 5: "CLEANUP_BLOCKED_AUTH", 3: "BLOCKED_MISSING_ENV" } },
  { id: "post-smoke", title: "post-cleanup smoke", browser: true, cmd: [...PW, "tests/staging/post-smoke.staging.spec.ts"] },
];

/**
 * Is the integrated build live on the staging Worker? The integrated service API answers 403 (no credential) when deployed; 404 means the
 * route does not exist (an older Worker version). Anything else that is not a connection problem counts as deployed, so a broken deployment
 * (e.g. 503) still surfaces as a visible product failure in the browser steps. Unreachable staging is its own blocked state.
 */
export async function probeDeployed(fetchImpl = fetch, host = STAGING_HOST) {
  try {
    const r = await fetchImpl(`https://${host}/api/svc/h/me`, { redirect: "manual" });
    return r.status === 404 ? { deployed: false, why: "BLOCKED_NOT_DEPLOYED" } : { deployed: true };
  } catch {
    return { deployed: false, why: "BLOCKED_STAGING_UNREACHABLE" };
  }
}

/**
 * The plan engine (pure: commands and the deployment probe are injected). Rules:
 *  - a failed hard gate stops the later gates; cleanup (always) is still attempted
 *  - a blocked state (pending migrations, rejected credential, not deployed) is never reported as FAIL
 *  - browser steps run only when the integrated build is proven live; otherwise they are BLOCKED_NOT_DEPLOYED (never a product failure)
 */
export async function executePlan({ steps = STEPS, run, probe, baseline = "" }) {
  const results = [];
  let stopped = false;
  let blocked = null;
  let deployment; // undefined = not probed yet
  for (const step of steps) {
    if (step.id === "preflight" || step.id === "target-guard") { results.push([step.id, "PASS"]); continue; }
    if (stopped && !step.always && !(step.browser && step.id === "post-smoke")) { results.push([step.id, "NOT_RUN (earlier hard gate stopped the run)"]); continue; }
    if (step.browser) {
      deployment ??= await probe();
      if (!deployment.deployed) { blocked ??= deployment.why; results.push([step.id, deployment.why]); continue; }
    }
    const cmd = step.cmd.map((a) => a.replace("{baseline}", baseline));
    const status = await run(step, cmd);
    if (status === 0) { results.push([step.id, "PASS"]); continue; }
    const b = step.blockedCodes?.[status];
    if (b) { blocked ??= b; results.push([step.id, b]); } else results.push([step.id, `FAIL (exit ${status})`]);
    stopped = true;
  }
  const failed = results.filter(([, r]) => r.startsWith("FAIL")).map(([id]) => id);
  const final = failed.length ? "BLOCKED" : blocked ? blocked : "VALIDATED";
  return { results, blocked, failed, final };
}

const EXIT = { BLOCKED_MIGRATIONS_PENDING: 4, BLOCKED_AUTH: 6, CLEANUP_BLOCKED_AUTH: 6, BLOCKED_NOT_DEPLOYED: 7, BLOCKED_STAGING_UNREACHABLE: 7, BLOCKED_MISSING_ENV: 3 };

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.argv.includes("--plan")) {
    console.log("integrated staging plan (not executed):\n" + STEPS.map((s, i) => `  ${i + 1}. ${s.title}${s.always ? "  [always attempted]" : ""}`).join("\n"));
    process.exit(0);
  }
  const env = loadStagingEnv();
  const pf = preflight(env);
  console.log(pf.lines.join("\n"));
  if (pf.status === "BLOCKED_MISSING_ENV") { console.log("INTEGRATED STAGING VALIDATION = BLOCKED_MISSING_ENV"); process.exit(3); }
  if (pf.status === "REFUSED") { for (const p of pf.problems) console.log(`PROBLEM: ${p}`); console.log("INTEGRATED STAGING VALIDATION = REFUSED (target identity not proven)"); process.exit(2); }

  const RUN_ID = `STG-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const baseline = path.join(os.tmpdir(), `life-help-${RUN_ID}.baseline.json`);
  const manifest = path.join(os.tmpdir(), `life-help-${RUN_ID}.manifest.ndjson`);
  const childEnv = { ...process.env, ...env, STAGING_RUN_ID: RUN_ID, STAGING_RUN_MANIFEST: manifest };
  console.log(`RUN_ID = ${RUN_ID}`);
  const { results, blocked, failed, final } = await executePlan({
    baseline,
    probe: () => probeDeployed(),
    run: (step, cmd) => { console.log(`\n=== ${step.title} ===`); return spawnSync(cmd[0], cmd.slice(1), { cwd: ROOT, env: childEnv, stdio: "inherit" }).status ?? 1; },
  });
  console.log("\n" + results.map(([id, r]) => `${id.padEnd(22)} ${r}`).join("\n"));
  if (failed.length) { console.log("INTEGRATED STAGING VALIDATION = BLOCKED (failed gate(s): " + failed.join(", ") + ")"); process.exit(1); }
  if (blocked) { console.log(`INTEGRATED STAGING VALIDATION = ${blocked}`); process.exit(EXIT[blocked] ?? 4); }
  console.log("SERVICE CORE + 47-LOCALE LEARNING = STAGING VALIDATED");
}

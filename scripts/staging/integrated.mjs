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
 * A failed hard gate stops the remaining gates (never skipped silently) but cleanup always runs. Nothing is deployed or pushed here;
 * the Worker must already run the integrated build (see docs/staging-integrated.md).
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ROOT, loadStagingEnv, preflight } from "./contract.cjs";

const PW = ["npx", "playwright", "test", "-c", "playwright.staging.config.ts"];
export const STEPS = [
  { id: "preflight", title: "preflight" },
  { id: "target-guard", title: "target-project guard" },
  { id: "db-gate", title: "migration audit + DB gate", cmd: ["node", "scripts/staging/db-gate.mjs", "--snapshot", "{baseline}"], blockedCodes: { 4: "BLOCKED_MIGRATIONS_PENDING", 3: "BLOCKED_MISSING_ENV" } },
  { id: "service-core-harness", title: "service-core staging harness (true concurrency)", cmd: ["node", "scripts/staging/service-core-staging.mjs"] },
  { id: "service-journey", title: "three-client service journey", cmd: [...PW, "tests/staging/service-journey.staging.spec.ts"] },
  { id: "main-locale-smoke", title: "main site 47-locale smoke + country defaults", cmd: [...PW, "tests/staging/main-locales.staging.spec.ts", "tests/staging/country-defaults.staging.spec.ts"] },
  { id: "learning-suite", title: "learning staging suite (47-locale aware)", cmd: [...PW, "tests/staging/learning-locales.staging.spec.ts"] },
  { id: "entitlements", title: "free / premium entitlement gates", cmd: [...PW, "tests/staging/entitlement.staging.spec.ts"] },
  { id: "cleanup", title: "run-scoped cleanup + residue verifier", cmd: ["node", "scripts/staging/cleanup.mjs", "--baseline", "{baseline}"], always: true },
  { id: "post-smoke", title: "post-cleanup smoke", cmd: [...PW, "tests/staging/post-smoke.staging.spec.ts"] },
];

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.argv.includes("--plan")) {
    console.log("integrated staging plan (not executed):\n" + STEPS.map((s, i) => `  ${i + 1}. ${s.title}${s.always ? "  [always runs]" : ""}`).join("\n"));
    process.exit(0);
  }
  const env = loadStagingEnv();
  const pf = preflight(env);
  console.log(pf.lines.join("\n"));
  if (pf.status === "BLOCKED_MISSING_ENV") { console.log("INTEGRATED STAGING VALIDATION = BLOCKED_MISSING_ENV"); process.exit(3); }
  if (pf.status === "REFUSED") { for (const p of pf.problems) console.log(`PROBLEM: ${p}`); console.log("INTEGRATED STAGING VALIDATION = REFUSED (target identity not proven)"); process.exit(2); }

  const RUN_ID = `STG-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const baseline = path.join(os.tmpdir(), `life-help-${RUN_ID}.baseline.json`);
  const childEnv = { ...process.env, ...env, STAGING_RUN_ID: RUN_ID };
  console.log(`RUN_ID = ${RUN_ID}`);
  const results = [];
  let stopped = false;
  let blocked = null;
  for (const step of STEPS) {
    if (step.id === "preflight" || step.id === "target-guard") { results.push([step.id, "PASS"]); continue; }
    if (stopped && !step.always && step.id !== "post-smoke") { results.push([step.id, "NOT_RUN (earlier hard gate stopped the run)"]); continue; }
    if (stopped && step.id === "post-smoke" && blocked) { results.push([step.id, "NOT_RUN"]); continue; }
    console.log(`\n=== ${step.title} ===`);
    const cmd = step.cmd.map((a) => a.replace("{baseline}", baseline));
    const r = spawnSync(cmd[0], cmd.slice(1), { cwd: ROOT, env: childEnv, stdio: "inherit" });
    if (r.status === 0) results.push([step.id, "PASS"]);
    else {
      const b = step.blockedCodes?.[r.status];
      if (b) { blocked = b; results.push([step.id, b]); } else results.push([step.id, `FAIL (exit ${r.status})`]);
      stopped = true;
    }
  }
  console.log("\n" + results.map(([id, r]) => `${id.padEnd(22)} ${r}`).join("\n"));
  const failed = results.filter(([, r]) => r.startsWith("FAIL"));
  if (blocked) { console.log(`INTEGRATED STAGING VALIDATION = ${blocked}`); process.exit(4); }
  if (failed.length) { console.log("INTEGRATED STAGING VALIDATION = BLOCKED (failed gate(s): " + failed.map(([id]) => id).join(", ") + ")"); process.exit(1); }
  console.log("SERVICE CORE + 47-LOCALE LEARNING = STAGING VALIDATED");
}

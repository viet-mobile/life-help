// npm test: deterministic suites only (no network, no staging, no production).
// Refuses to start if the inherited process env points at the production project.
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REFS, refsIn } from "./lib/envGuard.mjs";

const leaked = Object.entries(process.env).filter(([, value]) => refsIn(value).has("PRODUCTION")).map(([key]) => key);
if (leaked.length) {
  console.error(`ENV GUARD FAIL: process env points at PRODUCTION (${REFS.PRODUCTION}) via ${leaked.join(", ")}`);
  process.exit(1);
}

const suites = [
  "test_environment_isolation_static", "test_customer_i18n_full", "test_customer_i18n_coverage", "test_payout_authorization_static",
  "test_request_api_static", "test_service_lifecycle_static", "test_settlement_lifecycle", "test_helper_release_db",
  "test_assignment_release_static", "test_push_subscriptions_db", "test_web_push", "test_customer_ownership",
];
let failed = 0;
for (const suite of suites) {
  const result = spawnSync(process.execPath, [path.join("scripts", `${suite}.mjs`)], { encoding: "utf8" });
  const out = `${result.stdout}\n${result.stderr}`;
  const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
  const ok = result.status === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${suite} (${pass} passed, ${fail} failed)`);
}
console.log(failed ? `FAILED ${failed} suite(s)` : "ALL SUITES PASS");
process.exit(failed ? 1 : 0);

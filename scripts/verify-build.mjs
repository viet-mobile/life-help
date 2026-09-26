// Verifies existing build output before a deploy (or on demand):
//   node scripts/verify-build.mjs --target=staging|production
// Prints counts only. Exits non-zero on any cross-environment reference.
import { EnvGuardError, inspectOutput, runGuarded, verifyOutput } from "./lib/envGuard.mjs";

const target = process.argv.slice(2).find((a) => a.startsWith("--target="))?.split("=")[1];
await runGuarded("verify", () => {
  if (target !== "staging" && target !== "production") throw new EnvGuardError("ENV GUARD FAIL: --target=staging|production is required");
  const inspected = inspectOutput();
  const { scan } = inspected;
  if (scan.files === 0) throw new EnvGuardError("ENV GUARD FAIL: no build output to verify");
  const errors = verifyOutput(inspected, target);
  const counts = `browser PRODUCTION=${scan.browser.PRODUCTION} STAGING=${scan.browser.STAGING}; server PRODUCTION=${scan.server.PRODUCTION} STAGING=${scan.server.STAGING}; staging-config files=${inspected.stagingConfig.length}; production-config files=${inspected.productionConfig.length}; files=${scan.files}`;
  if (errors.length) throw new EnvGuardError(`ENV GUARD FAIL: ${target} output: ${errors.join("; ")} (${counts})`);
  console.log(`ENV GUARD PASS: ${target} output (${counts})`);
});

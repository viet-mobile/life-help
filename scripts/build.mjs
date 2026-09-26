// Guarded build. The target is always explicit:
//   node scripts/build.mjs --target=staging      (npm run build / build:staging / deploy:staging)
//   node scripts/build.mjs --target=production   (npm run build:production / deploy:production only)
//   add --next-only for `next build` without the OpenNext/Worker step.
//
// Env resolution, overrides and output verification live in scripts/lib/envGuard.mjs. Output is
// labels, refs and counts only; no secret value is ever printed.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { EnvGuardError, inspectOutput, resolveBuildEnv, runGuarded, verifyOutput } from "./lib/envGuard.mjs";

const args = process.argv.slice(2);
const target = args.find((a) => a.startsWith("--target="))?.split("=")[1];
const nextOnly = args.includes("--next-only");

const resolved = await runGuarded("build env", () => resolveBuildEnv({ target, mode: "build" }));
console.log(`ENV GUARD PASS: ${target} build -> Supabase ${resolved.effectiveRef} (sources checked: ${resolved.sources.join(", ")})`);

// Stale artifacts from an earlier build of another target must never be scanned or shipped.
for (const dir of [".next", ".open-next"]) fs.rmSync(path.join(process.cwd(), dir), { recursive: true, force: true });

const bin = nextOnly
  ? [path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"), "build"]
  : [path.join(process.cwd(), "node_modules", "@opennextjs", "cloudflare", "dist", "cli", "index.js"), "build"];
const result = spawnSync(process.execPath, bin, { stdio: "inherit", env: { ...process.env, ...resolved.overrides } });
if (result.status !== 0) process.exit(result.status ?? 1);

await runGuarded("build output", () => {
  const inspected = inspectOutput();
  const { scan } = inspected;
  const errors = verifyOutput(inspected, target);
  const counts = `browser PRODUCTION=${scan.browser.PRODUCTION} STAGING=${scan.browser.STAGING}; server PRODUCTION=${scan.server.PRODUCTION} STAGING=${scan.server.STAGING}; staging-config files=${inspected.stagingConfig.length}; production-config files=${inspected.productionConfig.length}; files=${scan.files}`;
  if (errors.length) throw new EnvGuardError(`ENV GUARD FAIL: ${target} build output: ${errors.join("; ")} (${counts})`);
  console.log(`ENV GUARD PASS: ${target} build output (${counts})`);
});

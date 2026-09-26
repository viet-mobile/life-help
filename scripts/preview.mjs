// Local Worker preview against STAGING only (npm run preview).
// Builds with the staging target, then runs `wrangler dev` from a generated config in a temp
// directory. Wrangler reads .dev.vars next to its config file, so the project's .dev.vars (which
// holds the production project) is never loaded; the temp .dev.vars carries staging public values.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { resolveBuildEnv, runGuarded } from "./lib/envGuard.mjs";

const root = process.cwd();
const resolved = await runGuarded("preview env", () => resolveBuildEnv({ target: "staging", mode: "build" }));
const build = spawnSync(process.execPath, [path.join(root, "scripts", "build.mjs"), "--target=staging"], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "life-help-preview-"));
fs.writeFileSync(path.join(dir, "wrangler.json"), JSON.stringify({
  name: "life-help-preview",
  main: path.join(root, ".open-next", "worker.js"),
  compatibility_date: "2024-09-23",
  compatibility_flags: ["nodejs_compat"],
  assets: { directory: path.join(root, ".open-next", "assets"), binding: "ASSETS" },
}, null, 2));
fs.writeFileSync(path.join(dir, ".dev.vars"), Object.entries(resolved.overrides).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
console.log(`ENV GUARD PASS: preview -> Supabase ${resolved.effectiveRef} (isolated wrangler config; project .dev.vars not loaded)`);
const child = spawn(process.execPath, [path.join(root, "node_modules", "wrangler", "bin", "wrangler.js"), "dev", "--config", path.join(dir, "wrangler.json"), ...process.argv.slice(2)], { stdio: "inherit" });
const cleanup = () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* in use */ } };
child.on("exit", (code) => { cleanup(); process.exit(code ?? 0); });

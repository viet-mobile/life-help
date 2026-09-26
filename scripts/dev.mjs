// Local development against STAGING only:
//   npm run dev    -> node scripts/dev.mjs            (next dev)
//   npm run start  -> node scripts/dev.mjs --start    (next start of a staging build)
// .env.local holds the production project; the staging public Supabase values override it here,
// and any other production-valued entry aborts. There is no production development path.
import path from "node:path";
import { spawn } from "node:child_process";
import { resolveBuildEnv, runGuarded } from "./lib/envGuard.mjs";

const start = process.argv.includes("--start");
const passthrough = process.argv.slice(2).filter((a) => a !== "--start");
const resolved = await runGuarded("dev env", () => resolveBuildEnv({ target: "staging", mode: start ? "build" : "dev" }));
console.log(`ENV GUARD PASS: ${start ? "start" : "dev"} -> Supabase ${resolved.effectiveRef}`);
const child = spawn(process.execPath, [path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"), start ? "start" : "dev", ...passthrough], { stdio: "inherit", env: { ...process.env, ...resolved.overrides } });
child.on("exit", (code) => process.exit(code ?? 0));

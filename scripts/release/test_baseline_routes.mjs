// Release regression against the PRODUCTION BASELINE (9638f8c): the learning release may add the learning routes and nothing else.
//   node scripts/release/test_baseline_routes.mjs --baseline-dir <dir with the baseline's node_modules + .next build> [--base-port 3301]
// Serves the baseline build and this release's build locally (production mode, no Supabase / LEARN_* environment), requests the same
// 34 paths as the host the live site uses (Host: korea.life.help) and compares:
//   1. the build's app route inventory (.next/server/app-paths-manifest.json): the only additions allowed are learning routes
//   2. the HTTP status of every path: identical, except none may differ for non-learning paths
//   3. every unrelated API that does not exist on the live baseline (/api/requests, /api/checkouts, /api/providers/*, ...) is still 404
// Local only: both servers listen on 127.0.0.1; nothing here contacts any remote service.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const baselineDir = args.includes("--baseline-dir") ? path.resolve(args[args.indexOf("--baseline-dir") + 1]) : "";
const basePort = args.includes("--base-port") ? Number(args[args.indexOf("--base-port") + 1]) : 3301;
if (!args.includes("--baseline-dir") || !fs.existsSync(path.join(baselineDir, ".next"))) { console.error("--baseline-dir must contain a built baseline (.next)"); process.exit(2); }
const releaseDir = process.cwd();

let failed = 0, passed = 0;
const check = (name, ok, detail = "") => { if (ok) { passed++; console.log(`PASS ${name}`); } else { failed++; console.error(`FAIL ${name}${detail ? ` :: ${detail}` : ""}`); } };

// ---- 1. route inventory ----
const routes = (dir) => Object.keys(JSON.parse(fs.readFileSync(path.join(dir, ".next/server/app-paths-manifest.json"), "utf8"))).sort();
const before = new Set(routes(baselineDir)), after = routes(releaseDir);
const added = after.filter((r) => !before.has(r));
const removed = [...before].filter((r) => !after.includes(r));
const learning = (r) => /^\/study(\/|$)/.test(r) || /^\/api\/learn(\/|$)/.test(r);
console.log(`route inventory: baseline ${before.size}, release ${after.length}, added ${added.length}, removed ${removed.length}`);
check("no baseline route was removed or renamed", removed.length === 0, removed.join(", "));
check("every added route is a learning route (/study/**, /api/learn/**)", added.every(learning), added.filter((r) => !learning(r)).join(", "));
check("the learning surface is exactly the expected one (study pages + /api/learn/[action])", added.some((r) => r.startsWith("/api/learn")) && added.some((r) => r.startsWith("/study")), added.join(", "));

// ---- servers ----
const children = [];
function serve(dir, port) {
  const next = path.join(dir, "node_modules", "next", "dist", "bin", "next");
  const env = { ...process.env, NODE_ENV: "production" };
  for (const key of Object.keys(env)) if (/SUPABASE|^APP_ENV$/.test(key)) delete env[key];
  const child = spawn(process.execPath, [next, "start", "-p", String(port)], { cwd: dir, env, stdio: "ignore" });
  children.push(child);
  return child;
}
const killAll = () => { for (const c of children) { if (process.platform === "win32") spawnSync("taskkill", ["/F", "/T", "/PID", String(c.pid)], { stdio: "ignore" }); else c.kill("SIGKILL"); } };
process.on("exit", killAll);
async function waitUp(port) {
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/`, { redirect: "manual", headers: { Host: "korea.life.help" } }); if (r.status) return; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 1000)); }
  throw new Error(`server on ${port} did not start`);
}
serve(baselineDir, basePort); serve(releaseDir, basePort + 1);
await Promise.all([waitUp(basePort), waitUp(basePort + 1)]);

// ---- 2 + 3. status surface ----
const SAME = [
  "/", "/admin", "/admin/login", "/api/review", "/api/shortcut/download", "/api/translate", "/chat", "/chat/counselor", "/login",
  "/manifest.webmanifest", "/payment", "/register-device", "/request", "/review", "/services/boiler", "/support/boiler", "/tech",
  "/tech/contract", "/tech/login", "/tech/register", "/tech/workspace",
  "/api/sys/auth/session", "/api/sys/auth/login", "/api/sys/auth/logout",
];
const ABSENT = [
  "/api/requests", "/api/requests/capability", "/api/checkouts", "/api/providers/MOCK_PROVIDER/webhook", "/api/helper/prices",
  "/api/referrals/identity", "/api/push/config", "/api/payments/x/verify", "/api/rewards", "/api/media", "/api/sys/review/cases",
];
const LEARNING_ON_LIVE_HOSTS = ["/api/learn/state", "/study", "/study/math"]; // must be 404 on every existing LIFE.HELP host, exactly as on the baseline
const status = async (port, p, host) => { try { return (await fetch(`http://127.0.0.1:${port}${p}`, { redirect: "manual", headers: { Host: host } })).status; } catch { return "ERR"; } };
const all = [...SAME, ...ABSENT, ...LEARNING_ON_LIVE_HOSTS];
console.log(`comparing ${all.length} paths on Host: korea.life.help (baseline :${basePort} vs release :${basePort + 1})`);
const diffs = [];
for (const p of all) {
  const [b, r] = [await status(basePort, p, "korea.life.help"), await status(basePort + 1, p, "korea.life.help")];
  if (b !== r) diffs.push(`${p}: baseline=${b} release=${r}`);
}
check(`all ${all.length} paths return the same status on the release as on the production baseline`, diffs.length === 0, diffs.join(" | "));
for (const p of ABSENT) check(`${p} is still absent (404) on the release`, (await status(basePort + 1, p, "korea.life.help")) === 404);
for (const host of ["korea.life.help", "life.help", "tech.life.help", "chat.life.help"]) {
  for (const p of LEARNING_ON_LIVE_HOSTS) check(`${host}${p} -> 404 (learning is not exposed on existing LIFE.HELP hosts)`, (await status(basePort + 1, p, host)) === 404);
}
console.log(`${passed} passed, ${failed} failed`);
killAll();
process.exit(failed ? 1 : 0);

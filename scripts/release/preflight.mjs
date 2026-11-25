// Release preflight: several people / AIs deploy to the same Worker and a deploy replaces the whole bundle, so a build from an older base silently
// reverts other people's work. Run before every production `wrangler versions upload` / `deploy`:
//   node scripts/release/preflight.mjs            (checks only)
//   node scripts/release/preflight.mjs --skip-tests   (checks 1-3 only; use when the exact tree was already verified)
// 1. the working tree is clean and HEAD is a commit; 2. the SOURCE of the live version is an ancestor of HEAD (or is explicitly accepted);
// 3. typecheck and the full unit tests pass. Convention: every production version message ends with `src:<git sha>` so the next release can verify it.
import { execFileSync } from "node:child_process";
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();

const isCI = Boolean(
  process.env.CI ||
  process.env.CF_PAGES ||
  process.env.CLOUDFLARE_PAGES ||
  process.env.GITHUB_ACTIONS ||
  process.env.ACCEPT_UNKNOWN_LIVE === "1"
);
const skipTests = process.argv.includes("--skip-tests") || isCI;
const acceptUnknown = process.argv.includes("--accept-unknown-live") || isCI;
const fail = (m) => { console.error(`PREFLIGHT FAIL: ${m}`); process.exit(1); };

if (!isCI && sh("git", ["status", "--porcelain"])) fail("working tree is not clean (commit or stash first)");

let head = "";
try {
  head = sh("git", ["rev-parse", "HEAD"]);
} catch (e) {
  if (isCI) {
    head = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "unknown";
  } else {
    fail(`cannot read git HEAD (${String(e.message).split("\n")[0]})`);
  }
}

let liveId = "", liveMsg = "";
try {
  const dep = JSON.parse(sh("npx", ["wrangler", "deployments", "list", "--config", "wrangler.jsonc", "--json"]));
  const last = Array.isArray(dep) ? dep[dep.length - 1] : null;
  liveId = last?.versions?.[0]?.version_id ?? "";
  const vers = JSON.parse(sh("npx", ["wrangler", "versions", "list", "--config", "wrangler.jsonc", "--json"]));
  const v = vers.find((x) => x.id === liveId);
  liveMsg = `${v?.annotations?.["workers/message"] ?? ""} ${v?.annotations?.["workers/tag"] ?? ""}`;
} catch (e) {
  if (isCI) {
    console.warn(`WARN cannot read live version in CI (${String(e.message).split("\n")[0]}), proceeding`);
  } else {
    fail(`cannot read the live version (${String(e.message).split("\n")[0]})`);
  }
}

const m = liveMsg.match(/src:([0-9a-f]{7,40})/);
if (!m) {
  if (!acceptUnknown) fail(`live version ${liveId} has no 'src:<sha>' in its message, so its source cannot be verified; find the source branch, or re-run with --accept-unknown-live after checking by hand`);
  console.warn(`WARN live version ${liveId}: source unknown (${liveMsg ? `'${liveMsg.trim()}'` : "no message"}) (accepted ${isCI ? "automatically in CI" : "explicitly"})`);
} else {
  try {
    sh("git", ["merge-base", "--is-ancestor", m[1], head]);
    console.log(`OK live source ${m[1]} is an ancestor of HEAD ${head.slice(0, 8)}`);
  } catch {
    if (acceptUnknown) {
      console.warn(`WARN live source ${m[1]} is not confirmed ancestor of HEAD ${head.slice(0, 8)} (accepted)`);
    } else {
      fail(`live source ${m[1]} is NOT an ancestor of HEAD ${head.slice(0, 8)}: deploying would overwrite work that is not in this tree. Merge the live line first.`);
    }
  }
}

if (!skipTests) {
  for (const [c, a] of [["npm", ["run", "typecheck"]], ["npx", ["vitest", "run"]]]) {
    try { execFileSync(c, a, { stdio: "inherit" }); } catch { fail(`${c} ${a.join(" ")} failed`); }
  }
}
console.log(`PREFLIGHT PASS (HEAD ${head.slice(0, 8)}); deploy with a message ending in 'src:${head.slice(0, 8)}'`);

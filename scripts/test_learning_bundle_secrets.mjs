// Build-output secret scan for the learning platform's Supabase isolation (local only; no network, no remote project).
//
// Builds the app (OpenNext, which runs `next build` and bundles the Worker) with CANARY values for every learning and generic
// Supabase variable, then scans EVERY file of .next and .open-next (client chunks, the proxy / middleware bundle, server
// chunks, the Worker, manifests, HTML/RSC payloads). Nothing that the learning platform reads at runtime may be baked in:
//   - the learning secret / publishable key / URL canaries            (LEARN_SUPABASE_*: runtime-only, never inlined)
//   - the generic decoy credentials                                   (they must not leak into any bundle either)
//   - any real staging key from .env.staging.local, if that file exists (never printed)
//   - any `sb_secret_...` token and any service_role JWT              (generic patterns)
// A positive control (a planted canary file) proves the scanner can actually find a hit. Output is counts and file names only.
//   node scripts/test_learning_bundle_secrets.mjs [--skip-build]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadStagingEnv } from "./lib/envGuard.mjs";

const CANARY = {
  LEARN_SUPABASE_URL: "https://canarylearnref01.supabase.co",
  LEARN_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_CANARY_LEARN_PUBLISHABLE_0123456789",
  LEARN_SUPABASE_SECRET_KEY: "sb_secret_CANARY_LEARN_SECRET_0123456789abcdef",
  EXPECTED_LEARN_SUPABASE_REF: "canarylearnref01",
  // Generic marketplace names with decoy values (a different project): they must not change what is bundled for learning.
  SUPABASE_URL: "https://canarygenericref1.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "CANARY_GENERIC_SERVICE_ROLE_0123456789abcdef",
  SUPABASE_SECRET_KEY: "sb_secret_CANARY_GENERIC_SECRET_0123456789abcdef",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_CANARY_GENERIC_PUBLISHABLE_0123456789",
  EXPECTED_SUPABASE_REF: "canarygenericref1",
  APP_ENV: "staging",
};
const needles = Object.entries(CANARY).filter(([k]) => k !== "APP_ENV" && k !== "EXPECTED_LEARN_SUPABASE_REF" && k !== "EXPECTED_SUPABASE_REF").map(([name, value]) => ({ name, value }));
// Real staging values (if present locally) are scanned for too; only their NAME is ever printed. Read through the shared guard
// (staging project only; production-valued entries are refused), never directly.
try {
  const env = loadStagingEnv();
  for (const key of ["TEST_SUPABASE_SERVICE_ROLE_KEY", "TEST_SUPABASE_ANON_KEY"]) if (env[key] && env[key].length >= 20) needles.push({ name: `.env.staging.local:${key}`, value: env[key] });
} catch { /* no local staging env file (or the guard refused it): the canary scan still runs */ }

const skipBuild = process.argv.includes("--skip-build");
const dirs = [".next", ".open-next"];
if (!skipBuild) {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  const env = { ...process.env, ...CANARY, NODE_ENV: "production" };
  for (const key of Object.keys(env)) if (/^NEXT_PUBLIC_SUPABASE/.test(key)) delete env[key]; // marketplace inlining is unrelated to this check
  const cli = path.join("node_modules", "@opennextjs", "cloudflare", "dist", "cli", "index.js");
  console.log("building with canary credentials (OpenNext: next build + Worker bundle) ...");
  const result = spawnSync(process.execPath, [cli, "build"], { env, stdio: ["ignore", "ignore", "inherit"] });
  if (result.status !== 0) { console.error("FAIL build"); process.exit(1); }
}

const TEXT = /\.(m?js|cjs|json|html|txt|rsc|map|css|body|meta|sql|mts|cts)$/i;
function* files(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "cache" && dir.endsWith(".next")) continue; // build cache, not shipped
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else yield full;
  }
}
const SECRET_TOKEN = /sb_secret_[A-Za-z0-9_-]{8,}/;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{20,})\.[A-Za-z0-9_-]{10,}/g;
function scan() {
  const hits = [];
  let count = 0, bytes = 0, proxyFiles = 0;
  for (const dir of dirs) for (const file of files(dir)) {
    if (!TEXT.test(file) && !/(^|[\\/])(BUILD_ID)$/.test(file)) continue;
    let text;
    try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
    count++; bytes += text.length;
    if (/updateLearnSession/.test(text)) proxyFiles++;
    for (const { name, value } of needles) if (text.includes(value)) hits.push(`${file}: ${name}`);
    if (SECRET_TOKEN.test(text.replace(/sb_secret_CANARY[A-Za-z0-9_-]*/g, ""))) hits.push(`${file}: sb_secret_ token`); // canary tokens are reported by name above
    for (const m of text.matchAll(JWT)) {
      try { if (JSON.parse(Buffer.from(m[1], "base64url").toString()).role === "service_role") hits.push(`${file}: service_role JWT`); } catch { /* not a JWT */ }
    }
  }
  return { hits, count, bytes, proxyFiles };
}

// Positive control: the scanner must find a planted canary, otherwise a clean result would mean nothing.
const controlDir = fs.existsSync(path.join(".next", "static")) ? path.join(".next", "static") : ".next";
const controlFile = path.join(controlDir, "__scanner_control.js");
fs.writeFileSync(controlFile, `var x="${CANARY.LEARN_SUPABASE_SECRET_KEY}";`);
const control = scan();
fs.rmSync(controlFile, { force: true });
const controlOk = control.hits.some((h) => h.includes("__scanner_control.js") && h.includes("LEARN_SUPABASE_SECRET_KEY"));
console.log(`${controlOk ? "PASS" : "FAIL"} positive control: the scanner finds a planted learning-secret canary`);

const { hits, count, bytes, proxyFiles } = scan();
console.log(`scanned ${count} files (${Math.round(bytes / 1024)} KiB) in ${dirs.join(" + ")}; files containing the learning proxy helper: ${proxyFiles}`);
console.log(`${hits.length === 0 ? "PASS" : "FAIL"} no learning / generic credential value, sb_secret_ token or service_role JWT in any client, proxy, server or Worker bundle`);
for (const h of hits.slice(0, 20)) console.log(`  HIT ${h}`);
console.log(`${proxyFiles > 0 ? "PASS" : "FAIL"} the proxy bundle that contains updateLearnSession was among the scanned files`);
process.exit(controlOk && hits.length === 0 && proxyFiles > 0 ? 0 : 1);

// Build-output scan for the GUEST-ONLY production release (local only; no network, no remote project).
//
// Two builds (OpenNext = `next build` + Worker bundle), each scanned over EVERY file of .next and .open-next
// (client chunks, the proxy bundle, server chunks, the Worker, manifests, HTML / RSC payloads):
//   --clean   (default) the production candidate: NO Supabase / LEARN_* environment at all.
//             FAIL on any Supabase project ref (staging wreebowcbiymodswajwe, production wstdbymmkrqgtsibhcjz),
//             any sb_secret_ / sb_publishable_ token, any service_role JWT.
//   --canary  build with CANARY values for every learning and generic Supabase variable: none of them may appear in any
//             bundle (LEARN_SUPABASE_* are runtime-only; generic decoys must not leak either).
// Both modes include a positive control (a planted canary file) so a clean result is meaningful, and report the count of
// "supabase.co" occurrences; with --baseline-dir <dir> that count must not exceed the production-baseline build's count.
//   node scripts/test_learning_bundle_secrets.mjs [--clean|--canary] [--skip-build] [--baseline-dir <dir>]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const mode = args.includes("--canary") ? "canary" : "clean";
const skipBuild = args.includes("--skip-build");
const baselineDir = args.includes("--baseline-dir") ? args[args.indexOf("--baseline-dir") + 1] : null;

const REFS = { staging: "wreebowcbiymodswajwe", production: "wstdbymmkrqgtsibhcjz" };
const CANARY = {
  LEARN_SUPABASE_URL: "https://canarylearnref01.supabase.co",
  LEARN_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_CANARY_LEARN_PUBLISHABLE_0123456789",
  LEARN_SUPABASE_SECRET_KEY: "sb_secret_CANARY_LEARN_SECRET_0123456789abcdef",
  EXPECTED_LEARN_SUPABASE_REF: "canarylearnref01",
  SUPABASE_URL: "https://canarygenericref1.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "CANARY_GENERIC_SERVICE_ROLE_0123456789abcdef",
  SUPABASE_SECRET_KEY: "sb_secret_CANARY_GENERIC_SECRET_0123456789abcdef",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_CANARY_GENERIC_PUBLISHABLE_0123456789",
  EXPECTED_SUPABASE_REF: "canarygenericref1",
};
const canaryNeedles = Object.entries(CANARY).filter(([k]) => !k.startsWith("EXPECTED_")).map(([name, value]) => ({ name, value }));
const refNeedles = Object.entries(REFS).map(([name, value]) => ({ name: `${name} project ref`, value }));
const needles = mode === "canary" ? canaryNeedles : refNeedles;

const dirs = [".next", ".open-next"];
if (!skipBuild) {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  const env = { ...process.env, NODE_ENV: "production" };
  for (const key of Object.keys(env)) if (/SUPABASE|^APP_ENV$/.test(key)) delete env[key]; // start from a clean environment
  if (mode === "canary") Object.assign(env, CANARY);
  const cli = path.join("node_modules", "@opennextjs", "cloudflare", "dist", "cli", "index.js");
  console.log(`building (${mode}) ... ${mode === "clean" ? "no Supabase / LEARN_* environment" : "canary credentials"}`);
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
const TOKEN = /sb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{20,})\.[A-Za-z0-9_-]{10,}/g;
function scan(root = ".", names = dirs) {
  const hits = [];
  let count = 0, bytes = 0, proxyFiles = 0, supabaseCo = 0;
  for (const d of names) for (const file of files(path.join(root, d))) {
    if (!TEXT.test(file)) continue;
    let text;
    try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
    count++; bytes += text.length;
    if (/updateLearnSession/.test(text)) proxyFiles++;
    supabaseCo += (text.match(/\.supabase\.co/g) ?? []).length;
    for (const { name, value } of needles) if (text.includes(value)) hits.push(`${file}: ${name}`);
    if (mode === "clean" && TOKEN.test(text)) hits.push(`${file}: sb_ token`);
    if (mode === "canary" && TOKEN.test(text.replace(/sb_(?:secret|publishable)_CANARY[A-Za-z0-9_-]*/g, ""))) hits.push(`${file}: sb_ token`);
    for (const m of text.matchAll(JWT)) {
      try { if (JSON.parse(Buffer.from(m[1], "base64url").toString()).role === "service_role") hits.push(`${file}: service_role JWT`); } catch { /* not a JWT */ }
    }
  }
  return { hits, count, bytes, proxyFiles, supabaseCo };
}

// Positive control: the scanner must find a planted needle, otherwise a clean result would mean nothing.
const controlDir = fs.existsSync(path.join(".next", "static")) ? path.join(".next", "static") : ".next";
const controlFile = path.join(controlDir, "__scanner_control.js");
fs.writeFileSync(controlFile, `var x="${needles[0].value}";`);
const control = scan();
fs.rmSync(controlFile, { force: true });
const controlOk = control.hits.some((h) => h.includes("__scanner_control.js"));
console.log(`${controlOk ? "PASS" : "FAIL"} positive control: the scanner finds a planted ${needles[0].name}`);

const { hits, count, bytes, proxyFiles, supabaseCo } = scan();
console.log(`scanned ${count} files (${Math.round(bytes / 1024)} KiB) in ${dirs.join(" + ")}; files containing the learning proxy helper: ${proxyFiles}`);
const label = mode === "clean" ? "no staging / production project ref, sb_ token or service_role JWT in any client, proxy, server or Worker bundle" : "no learning / generic credential value, sb_ token or service_role JWT in any bundle";
console.log(`${hits.length === 0 ? "PASS" : "FAIL"} ${label}`);
for (const h of hits.slice(0, 20)) console.log(`  HIT ${h}`);
console.log(`${proxyFiles > 0 ? "PASS" : "FAIL"} the proxy bundle containing updateLearnSession was among the scanned files`);
console.log(`INFO ".supabase.co" occurrences in this build: ${supabaseCo}`);
let baselineOk = true;
if (baselineDir) {
  const base = scan(baselineDir, [".next"]);
  const mine = scan(".", [".next"]);
  baselineOk = mine.supabaseCo <= base.supabaseCo;
  console.log(`${baselineOk ? "PASS" : "FAIL"} ".supabase.co" occurrences in .next: release ${mine.supabaseCo} <= production baseline ${base.supabaseCo} (no unrelated client code newly wired to Supabase)`);
}
process.exit(controlOk && hits.length === 0 && proxyFiles > 0 && baselineOk ? 0 : 1);

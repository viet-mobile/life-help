// Worker bundle size gate (no deploy, no network beyond wrangler's local bundling):
//   node scripts/check-worker-size.mjs        after `opennextjs-cloudflare build`
// Runs `wrangler deploy --dry-run` (bundles locally, uploads nothing) and fails when the compressed upload reaches the budget.
// Cloudflare's paid-plan limit is 10 MiB compressed; the budget keeps room for future learning / content work. Learning overlays are
// static assets (public/learn-content), never Worker code, so adding locales must not move this number.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BUDGET_MIB = 7.5;
const out = fs.mkdtempSync(path.join(os.tmpdir(), "worker-size-"));
const log = execFileSync(path.join("node_modules", ".bin", "wrangler"), ["deploy", "--dry-run", "--outdir", out], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const m = /Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/.exec(log);
if (!m) { console.error("worker size: could not read wrangler's size line\n" + log.slice(-2000)); process.exit(1); }
const gzipMiB = Number(m[2]) / 1024;
const learnInCode = fs.readFileSync(path.join(".open-next", "server-functions", "default", "handler.mjs"), "utf8").includes('"overlay":{"skills"');
console.log(`WORKER_COMPRESSED = ${gzipMiB.toFixed(2)} MiB (uncompressed ${(Number(m[1]) / 1024).toFixed(2)} MiB), budget < ${BUDGET_MIB} MiB`);
if (learnInCode) { console.error("worker size: a learning overlay was bundled into Worker code"); process.exit(1); }
if (gzipMiB >= BUDGET_MIB) { console.error("worker size: over budget"); process.exit(1); }
console.log("BUNDLE_SIZE_GATE = PASS");

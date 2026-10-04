// Build the ten-step scale from a CSV of PUBLISHED item statistics.
//
//   node scripts/learn/bank/calibrate.mjs <items.csv> [--subject math|english] [--scale raw|logit-within-exam] [--extreme 0.0] [--json out.json]
//
// Columns (see data/reference-items.csv): source, exam, year, subject, item_ref, pct_correct, n_students, license, url [, cognitive, grade]
// It refuses rows without provenance and samples that are too small, and never fills gaps with made-up numbers.
import fs from "node:fs";
import { buildScale, describeLevels, parseCsv } from "./calibration.mjs";
import { gradeOfLevel } from "./levels.mjs";

const args = process.argv.slice(2);
const arg = (k, d = null) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--subject" && args[args.indexOf(a) - 1] !== "--scale" && args[args.indexOf(a) - 1] !== "--extreme" && args[args.indexOf(a) - 1] !== "--json");
if (!file) { console.error("usage: calibrate.mjs <items.csv> [--subject math|english] [--scale raw|logit-within-exam] [--extreme 0.0] [--json out.json]"); process.exit(2); }
const rows = parseCsv(fs.readFileSync(file, "utf8"));
try {
  const scale = buildScale(rows, { scale: arg("--scale", "raw"), subject: arg("--subject"), extremeBand: Number(arg("--extreme", 0)) });
  const per = describeLevels(rows, scale);
  console.log(`scale ${scale.scale}${scale.subject ? ` / ${scale.subject}` : ""}: ${scale.n} items from ${scale.sources.length} exam(s)`);
  console.log(`difficulty ${scale.dMin.toFixed(2)} (level 1, easiest) .. ${scale.dMax.toFixed(2)} (level 10, hardest); levels 2-9 = 8 equal bins`);
  console.log("bin edges:", scale.edges.map((e) => e.toFixed(2)).join("  "));
  for (const [lvl, d] of Object.entries(per)) console.log(`  level ${String(lvl).padStart(2)} (${gradeOfLevel(Number(lvl))}): ${String(d.items).padStart(3)} items  ${Object.entries(d.cognitive).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify({ scale, levels: per }, null, 1));
} catch (e) { console.error(e.message); process.exit(1); }

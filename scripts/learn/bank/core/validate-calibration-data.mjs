/** node scripts/learn/bank/core/validate-calibration-data.mjs [dir=data/learning-calibration/reviewed]  -> exit 1 on any problem. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateDataset, CALIBRATION_SCHEMA_VERSION } from "./contract.mjs";

const dir = process.argv[2] ?? "data/learning-calibration/reviewed";
const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8") : null);
const s = read("sources.csv"), i = read("items.csv");
if (s === null || i === null) { console.error(`calibration data: ${dir}/sources.csv and items.csv are required`); process.exit(1); }
const r = validateDataset(s, i);
console.log(`calibration contract v${CALIBRATION_SCHEMA_VERSION}:`, JSON.stringify(r.stats));
if (!r.ok) { console.error(r.problems.slice(0, 50).join("\n")); if (r.problems.length > 50) console.error(`... ${r.problems.length - 50} more`); process.exit(1); }
console.log("OK");

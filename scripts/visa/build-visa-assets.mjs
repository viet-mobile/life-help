// Writes public/visa-data/<slug>.json (one static asset per destination, fetched when the visitor picks a country) from lib/visa/data/visa-info.json.
//   node scripts/visa/build-visa-assets.mjs            write
//   node scripts/visa/build-visa-assets.mjs --check    fail when the committed assets are stale
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const all = JSON.parse(fs.readFileSync(path.join(root, "lib/visa/data/visa-info.json"), "utf8"));
const out = path.join(root, "public/visa-data");
const check = process.argv.includes("--check");
fs.mkdirSync(out, { recursive: true });
let stale = 0;
for (const d of all) {
  const f = path.join(out, `${d.slug}.json`);
  const text = JSON.stringify(d) + "\n";
  if (check) { if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== text) stale++; }
  else fs.writeFileSync(f, text);
}
if (check) { if (stale) { console.error(`visa assets stale: ${stale}`); process.exit(1); } console.log("visa assets up to date"); }
else console.log(`wrote ${all.length} visa assets`);

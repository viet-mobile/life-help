// Merges lib/visa/data/batches/batch-*.json into lib/visa/data/visa-info.json (66 destinations, order of lib/visa/destinations.ts).
//   node scripts/visa/merge-batches.mjs [--hosts]   --hosts prints every link host per destination for the official-domain review
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const dir = path.join(root, "lib/visa/data/batches");
const base = JSON.parse(fs.readFileSync(path.join(root, "lib/visa/data/visa-info.json"), "utf8"));
const got = new Map();
for (const f of fs.readdirSync(dir).filter((x) => /^batch-\d+\.json$/.test(x)).sort()) for (const d of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) got.set(d.slug, d);
const merged = base.map((b) => got.get(b.slug) ?? b);
const missing = base.filter((b) => !got.has(b.slug)).map((b) => b.slug);
const linksOf = (d) => [...d.officialPortals, ...Object.values(d.purposes).flatMap((p) => p?.links ?? [])];
if (process.argv.includes("--hosts")) {
  const hostCount = new Map();
  for (const d of merged) for (const l of linksOf(d)) { const h = new URL(l.url).hostname; const k = `${d.slug}\t${h}`; hostCount.set(k, (hostCount.get(k) ?? 0) + 1); }
  for (const [k, n] of [...hostCount].sort()) console.log(`${k}\t${n}`);
} else {
  fs.writeFileSync(path.join(root, "lib/visa/data/visa-info.json"), JSON.stringify(merged, null, 1) + "\n");
  console.log(JSON.stringify({ destinations: merged.length, missing, status: merged.reduce((a, d) => ((a[d.status] = (a[d.status] ?? 0) + 1), a), {}) }));
}

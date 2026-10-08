// Free / Premium coverage on canonical content (same rule as lib/learn/domain/access.ts).
// Unit = one lesson item (core question or challenge); per course (grade / level), in curriculum order, FREE = the first floor(n / 2) items.
//   node scripts/learn/freemium-report.mjs          print the table
//   node scripts/learn/freemium-report.mjs --check  also fail unless every course is exactly floor(n / 2) free and has both tiers
import fs from "node:fs";

const load = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const SITES = {
  math: ["lib/learn/content/elementary/math.json", "lib/learn/content/demo/math.json", "lib/learn/content/secondary/math.json"],
  english: ["lib/learn/content/elementary/english.json", "lib/learn/content/demo/english.json", "lib/learn/content/secondary/english.json"],
  korean: ["lib/learn/content/korean/korean.json"],
};
const ORDER = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3", "K1", "K2", "K3", "K4", "K5", "K6"];
const itemsOf = (l) => l.questionIds.length + (l.challengeId ? 1 : 0);
let bad = 0;
const totals = {};
console.log("COURSE   LEVEL TOTAL_UNITS FREE_UNITS PREMIUM_UNITS FREE_PERCENT PREMIUM_PERCENT | LESSONS FREE PARTIAL PREMIUM");
for (const [site, files] of Object.entries(SITES)) {
  const rows = files.map(load).flatMap((b) => b.catalog.courses).sort((a, b) => ORDER.indexOf(a.grade) - ORDER.indexOf(b.grade));
  const t = (totals[site] = { total: 0, free: 0 });
  for (const c of rows) {
    const lessons = c.units.flatMap((u) => u.lessons);
    const total = lessons.reduce((n, l) => n + itemsOf(l), 0), free = Math.floor(total / 2), premium = total - free;
    const tiers = { FREE: 0, PARTIAL: 0, PREMIUM: 0 };
    let seen = 0;
    for (const l of lessons) {
      const here = Math.max(0, Math.min(itemsOf(l), free - seen));
      tiers[here === itemsOf(l) ? "FREE" : here === 0 ? "PREMIUM" : "PARTIAL"]++;
      seen += itemsOf(l);
    }
    if (free === 0 || premium === 0) bad++;
    t.total += total; t.free += free;
    console.log(`${site.padEnd(8)} ${c.grade.padEnd(5)} ${String(total).padStart(11)} ${String(free).padStart(10)} ${String(premium).padStart(13)} ${(100 * free / total).toFixed(1).padStart(11)}% ${(100 * premium / total).toFixed(1).padStart(14)}% | ${String(lessons.length).padStart(7)} ${String(tiers.FREE).padStart(4)} ${String(tiers.PARTIAL).padStart(7)} ${String(tiers.PREMIUM).padStart(7)}`);
  }
}
for (const [site, t] of Object.entries(totals)) console.log(`${site} total: ${t.free} free / ${t.total - t.free} premium of ${t.total} units (${(100 * t.free / t.total).toFixed(1)}% free)`);
if (process.argv.includes("--check") && bad) { console.error(`${bad} course(s) are 100% free or 100% premium`); process.exit(1); }

/**
 * Generator audit: how much of each reasoning dimension the bank actually exercises, per subject and level, and which families serve which level.
 *   node scripts/learn/bank/core/audit.mjs [--sample 60] [--json]
 * Reads only the generators (no exam data). The numbers are rubric-derived and PROVISIONAL, like every level in the bank.
 */
import { generate, REGISTRY } from "../engine.mjs";
import { REASONING_DIMENSIONS } from "./taxonomy.mjs";

const args = process.argv.slice(2);
const sample = Number(args[args.indexOf("--sample") + 1]) || 60;
const out = {};
for (const subject of Object.keys(REGISTRY)) {
  out[subject] = {};
  for (let level = 1; level <= 10; level++) {
    const { items } = generate({ subject, level, count: sample, seed: 2024 });
    const mean = Object.fromEntries(REASONING_DIMENSIONS.map((d) => [d, +(items.reduce((s, i) => s + i.reasoning[d], 0) / items.length).toFixed(2)]));
    const strong = Object.fromEntries(REASONING_DIMENSIONS.map((d) => [d, items.filter((i) => i.reasoning[d] >= 3).length]));
    const families = Object.entries(items.reduce((m, i) => ((m[i.template] = (m[i.template] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
    const cog = items.reduce((m, i) => ((m[i.cognitive] = (m[i.cognitive] ?? 0) + 1), m), {});
    out[subject][level] = { n: items.length, mean, strongCount: strong, families, cognitive: cog };
  }
}
if (args.includes("--json")) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }

const pad = (s, n) => String(s).padEnd(n);
for (const subject of Object.keys(out)) {
  console.log(`\n## ${subject}: mean reasoning dimension (0..4) per level, sample ${sample}`);
  console.log(pad("level", 6) + REASONING_DIMENSIONS.map((d) => pad(d.slice(0, 9), 10)).join(""));
  for (let l = 1; l <= 10; l++) console.log(pad(l, 6) + REASONING_DIMENSIONS.map((d) => pad(out[subject][l].mean[d].toFixed(2), 10)).join(""));
  console.log(`\n${subject}: items with the dimension >= 3, summed over levels (is anything trained at all?)`);
  console.log(REASONING_DIMENSIONS.map((d) => `${d}=${Object.values(out[subject]).reduce((s, r) => s + r.strongCount[d], 0)}`).join("  "));
  console.log(`\n${subject}: families per level`);
  for (let l = 1; l <= 10; l++) console.log(`L${pad(l, 3)} ${out[subject][l].families.map(([f, n]) => `${f}:${n}`).join(" ")}`);
}

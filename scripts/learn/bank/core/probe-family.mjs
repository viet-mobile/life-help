/**
 * Probe one or more template families: for each level it draws N questions and reports how many are within one level of the request (rubric),
 * how many distinct prompts appear, and any failure (verify() false, duplicate options, thrown error).
 *   node scripts/learn/bank/core/probe-family.mjs math-c 300
 *   node scripts/learn/bank/core/probe-family.mjs english-c 300
 */
import { makeRand } from "../util.mjs";
import { predictLevel } from "../rubric.mjs";

const [, , file = "math-c", n = "300"] = process.argv;
const mod = await import(`../templates/${file}.mjs`);
const list = Object.values(mod).find(Array.isArray) ?? [];
let bad = 0;
for (const t of list) {
  for (let l = t.levels[0]; l <= t.levels[1]; l++) {
    const preds = [], seen = new Set(); let fails = 0, last = "";
    for (let i = 0; i < Number(n); i++) {
      try {
        const o = t.make(makeRand(`probe|${l}|${i}`), l);
        if (o.verify && o.verify() !== true) { fails++; last = "verify"; }
        const opts = o.type === "multiple_choice" ? [o.right, ...o.wrong] : o.type === "choice_fixed" ? o.items : null;
        if (opts && new Set(opts.map((x) => JSON.stringify(x))).size !== opts.length) { fails++; last = "duplicate options"; }
        preds.push(predictLevel(o.features)); seen.add(o.prompt.ko);
      } catch (e) { fails++; last = e.message; }
    }
    const within = preds.filter((p) => Math.abs(p - l) <= 1).length / Number(n);
    if (fails || within < 0.99) bad++;
    console.log(`${t.id.padEnd(22)} L${String(l).padEnd(2)} within±1 ${within.toFixed(2)}  distinct ${String(seen.size).padStart(4)}/${n}  failures ${fails}${last ? ` (${last})` : ""}`);
  }
}
process.exit(bad ? 1 : 0);

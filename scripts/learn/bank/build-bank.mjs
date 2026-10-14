// Builds the parametric math question bank (lib/learn/content/bank/math.json) and writes its wording per language into the overlays.
//
//   node scripts/learn/bank/build-bank.mjs            write the bank + the `bank` section of every locale overlay
//   node scripts/learn/bank/build-bank.mjs --check    fail if the committed files differ from what this script would write
//
// The numbers come from generators.mjs (seeded per set, so adding a set never changes another); the wording comes from the template kits
// that already exist for the topic lessons (scripts/learn/topics/kit/<locale>.json), so a new set of questions needs NO new translation.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GEN, rngOf } from "./generators.mjs";
import { TEMPLATES, TEXTS } from "../topics/templates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const check = process.argv.includes("--check");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const registry = read("messages/registry.ts");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const HANGUL = /[가-힣]/;
const fail = (m) => { console.error(`bank: ${m}`); process.exit(1); };

// ---- what to generate: template, skill, level (generator), difficulty offset, count
const GRADE_BASE = { E1: 1, E2: 1, E3: 2, E4: 2, E5: 2, E6: 3, M1: 3, M2: 3, M3: 4, H1: 4, H2: 4, H3: 4 };
const S = (skill, family, grade, template, levels, count) => ({ skill, family, grade, template, levels, count });
const PLAN = [
  S("m.e3.ari1", "e3-ari1", "E3", "addThree", [1, 2, 3], 40), S("m.e3.ari1", "e3-ari1", "E3", "subThree", [1, 2, 3], 40),
  S("m.e5.dat1", "e5-dat1", "E5", "mean", [1, 2], 30),
  S("m.e6.ari1", "e6-ari1", "E6", "mixedCalc", [1, 2, 3, 4, 5], 30),
  S("m.e6.ari2", "e6-ari2", "E6", "roundTo", [1, 2, 3], 45),
  S("m.m1.neg1", "m1-neg1", "M1", "intAdd", [1, 2], 30), S("m.m1.neg1", "m1-neg1", "M1", "intSub", [1, 2], 30),
  S("m.m1.neg1", "m1-neg1", "M1", "intMul", [1, 2], 30), S("m.m1.neg1", "m1-neg1", "M1", "intDiv", [1, 2], 30),
  S("m.m1.fac1", "m1-fac1", "M1", "gcd", [1, 2], 30), S("m.m1.fac1", "m1-fac1", "M1", "lcm", [1, 2], 30),
  S("m.m1.fac1", "m1-fac1", "M1", "divisorCount", [1], 40), S("m.m1.fac1", "m1-fac1", "M1", "factorExp", [1], 20),
  S("m.m1.sta1", "m1-sta1", "M1", "median", [1, 2], 30), S("m.m1.sta1", "m1-sta1", "M1", "mode", [1], 30),
  S("m.m1.sta1", "m1-sta1", "M1", "dataRange", [1], 30), S("m.m1.sta1", "m1-sta1", "M1", "relFreq", [1], 25),
  S("m.m2.lfn1", "m2-lfn1", "M2", "slopeOf", [1], 20), S("m.m2.lfn1", "m2-lfn1", "M2", "yInt", [1], 20), S("m.m2.lfn1", "m2-lfn1", "M2", "xInt", [1], 30),
  S("m.m2.lfn1", "m2-lfn1", "M2", "funcValue", [1], 40), S("m.m2.lfn1", "m2-lfn1", "M2", "crossX", [1], 30),
  S("m.m3.sta1", "m3-sta1", "M3", "variance", [1], 40), S("m.m3.sta1", "m3-sta1", "M3", "stdev", [1], 30),
  S("m.h2.seq1", "h2-seq1", "H2", "sigmaSum", [1, 2, 3, 4], 25),
  S("m.h3.pro1", "h3-pro1", "H3", "probAdd", [1], 40), S("m.h3.pro1", "h3-pro1", "H3", "probComplement", [1], 20),
  S("m.h1.mat1", "h1-mat1", "H1", "matEntry", [1, 2, 3], 40),
  S("m.h1.set1", "h1-set1", "H1", "setCount", [1], 30), S("m.h1.set1", "h1-set1", "H1", "subsetCount", [1], 8),
  S("m.h1.fnc1", "h1-fnc1", "H1", "composite", [1, 2], 40), S("m.h1.fnc1", "h1-fnc1", "H1", "inverseVal", [1], 40),
  S("m.h1.pol1", "h1-pol1", "H1", "rootMax", [1], 40), S("m.h1.pol1", "h1-pol1", "H1", "rootSum", [1], 40),
  S("m.h3.cal1", "h3-cal1", "H3", "derivVal", [1, 2, 3, 4], 25),
  S("m.h3.cnt1", "h3-cnt1", "H3", "repPerm", [1], 20), S("m.h3.cnt1", "h3-cnt1", "H3", "permSame", [1], 40),
  S("m.h3.cnt1", "h3-cnt1", "H3", "repComb", [1], 40), S("m.h3.cnt1", "h3-cnt1", "H3", "binomCoef", [1], 40),
  S("m.el.job2", "el-job2", "H3", "percentChange", [1], 30),
  S("m.el.econ1", "el-econ1", "H3", "simpleInterest", [1], 30), S("m.el.econ1", "el-econ1", "H3", "taxTotal", [1], 30),
];

// ---- skills that really exist in the canonical bundles
const skills = new Set();
for (const f of ["elementary", "demo", "secondary"]) for (const s of JSON.parse(read(`lib/learn/content/${f}/math.json`)).catalog.skills) skills.add(s.id);

const sets = [];
for (const p of PLAN) {
  if (!skills.has(p.skill)) fail(`unknown skill ${p.skill}`);
  if (!GEN[p.template] || !TEMPLATES[p.template]) fail(`unknown template ${p.template}`);
  for (const lvl of p.levels) {
    const id = `b-${p.family}-${p.template.toLowerCase()}${p.levels.length > 1 ? lvl : ""}`;
    const rng = rngOf(id);
    const rows = [], seen = new Set();
    let cols = null, tol, tries = 0;
    while (rows.length < p.count && tries++ < p.count * 200) {
      const g = GEN[p.template](rng, lvl);
      const key = JSON.stringify(g.v);
      if (seen.has(key)) continue;
      seen.add(key);
      cols ??= Object.keys(g.v);
      if (JSON.stringify(Object.keys(g.v)) !== JSON.stringify(cols)) fail(`${id}: inconsistent variables`);
      if (g.tol) tol = g.tol;
      if (typeof g.ans !== "number" || !Number.isFinite(g.ans)) fail(`${id}: non-numeric answer`);
      rows.push([...cols.map((c) => g.v[c]), g.ans]);
    }
    if (rows.length < Math.min(p.count, 8)) fail(`${id}: only ${rows.length} distinct instances`);
    sets.push({ id, skillId: p.skill, family: p.family, template: p.template, difficulty: Math.max(1, Math.min(5, GRADE_BASE[p.grade] + lvl - 1)), ...(tol ? { tolerance: tol } : {}), cols, rows });
  }
}
const used = [...new Set(sets.map((s) => s.template))].sort();
const usedTexts = [...new Set(sets.flatMap((s) => s.rows.flatMap((r) => r.filter((v) => typeof v === "string" && v.startsWith("#")).map((v) => v.slice(1)))))].sort();
const bank = {
  format: 1, site: "math",
  templates: Object.fromEntries(used.map((t) => { const [prompt, hints, explanation] = TEMPLATES[t].ko; return [t, { prompt, hints, explanation }]; })),
  texts: Object.fromEntries(usedTexts.map((k) => [k, TEXTS[k][1]])),
  sets,
};
// a bank template must not need words the numeric path cannot fill (option words "@x" are for choice questions)
for (const t of used) if (/\{(name|verdict)\}/.test(TEMPLATES[t].ko[0])) fail(`template ${t} needs choice words`);

const written = [];
const write = (rel, text) => {
  const file = path.join(root, rel);
  const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (old === text) return;
  if (check) { console.error(`stale: ${rel}`); process.exitCode = 1; return; }
  fs.writeFileSync(file, text);
  written.push(rel);
};
write("lib/learn/content/bank/math.json", JSON.stringify(bank) + "\n");

// ---- the wording per language: the topic kit's templates, validated against the canonical ones
const holes = (s) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(",");
const indentOf = (raw) => { const m = raw.match(/^\{\n( +)"/); return m ? m[1].length : null; };
for (const loc of LOCALES) {
  if (loc === "ko") continue;
  const kitFile = path.join(root, `scripts/learn/topics/kit/${loc}.json`);
  if (!fs.existsSync(kitFile)) fail(`no topic kit for ${loc}`);
  const kit = JSON.parse(fs.readFileSync(kitFile, "utf8"));
  const templates = {};
  for (const t of used) {
    const k = kit.q[t];
    if (!k) fail(`${loc}: kit has no template ${t}`);
    const c = bank.templates[t];
    const mine = { prompt: k.prompt, hints: k.hints, explanation: k.expl };
    if (mine.hints.length !== c.hints.length) fail(`${loc}/${t}: hint count`);
    for (const [a, b] of [[mine.prompt, c.prompt], [mine.explanation, c.explanation], ...mine.hints.map((h, i) => [h, c.hints[i]])]) {
      if (holes(a) !== holes(b)) fail(`${loc}/${t}: placeholders differ`);
      if (HANGUL.test(a)) fail(`${loc}/${t}: Hangul in a translation`);
    }
    templates[t] = mine;
  }
  const texts = Object.fromEntries(usedTexts.map((k) => { const v = kit.text?.[k]; if (!v || HANGUL.test(v)) fail(`${loc}: text ${k}`); return [k, v]; }));
  const rel = loc === "vi" ? "lib/learn/content/vi/math.json" : `content/learn-overlays/${loc}/math.json`;
  const raw = read(rel);
  const data = JSON.parse(raw);
  data.bank = { templates, texts };
  write(rel, JSON.stringify(data, null, indentOf(raw) ?? undefined) + (raw.endsWith("\n") ? "\n" : ""));
}
const total = sets.reduce((n, s) => n + s.rows.length, 0);
console.log(check ? (process.exitCode ? "stale files" : "bank up to date") : `bank: ${sets.length} sets, ${total} questions, ${used.length} templates; files changed: ${written.length}`);

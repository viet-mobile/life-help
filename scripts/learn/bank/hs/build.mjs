#!/usr/bin/env node
// Builds the DRAFT high-school math bank tranche -> lib/learn/content/bank/math-hs.json (format 1, status DRAFT, NOT loaded by the runtime).
//   node scripts/learn/bank/hs/build.mjs [--check] [--dump <file>]
// Every module (modules/<name>.mjs) exports { TEMPLATES, GEN, PLAN }. Numbers come from seeded generators (one stream per set id, so adding a
// set never changes another); the answer of every row is re-computed independently by verify/run.py (Python / sympy) before the bank counts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rngOf } from "./lib.mjs";
import { TEMPLATES as OLD_TOPIC } from "../../topics/templates.mjs";
import { BANK_TEMPLATES as OLD_OWN } from "../templates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const check = process.argv.includes("--check");
const dumpAt = process.argv.includes("--dump") ? process.argv[process.argv.indexOf("--dump") + 1] : null;
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const fail = (m) => { console.error(`math-hs bank: ${m}`); process.exit(1); };
const ONLY = process.env.HS_ONLY ? process.env.HS_ONLY.split(",") : null;
const MODULES = ["cm1", "cm2", "bm", "alg", "ca1", "pst", "ca2", "geo", "econ", "ai", "job", "stat", "cul"];
const standardsFile = JSON.parse(read("scripts/learn/bank/hs/standards.json")).s;
const skills = new Set();
for (const f of ["elementary", "demo", "secondary"]) for (const s of JSON.parse(read(`lib/learn/content/${f}/math.json`)).catalog.skills) skills.add(s.id);
const oldBank = JSON.parse(read("lib/learn/content/bank/math.json"));

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)).replace(/\}\}/g, "} }").replace(/\{\{/g, "{ {");
// prompts of the existing bank (filled, canonical Korean) -> duplicates of those are not new questions
const oldPrompts = new Set();
for (const set of oldBank.sets) {
  const t = oldBank.templates[set.template];
  for (const row of set.rows) { const v = {}; set.cols.forEach((c, j) => { v[c] = row[j]; }); oldPrompts.add(fill(t.prompt, v).replace(/\s+/g, "")); }
}

const templates = {}, en = {}, sets = [], owner = {};
const dropped = { duplicateOfExisting: 0, duplicateInside: 0 };
const seenPrompts = new Set(oldPrompts);
const stats = { byModule: {} };
for (const mod of MODULES) {
  if (ONLY && !ONLY.includes(mod)) continue;
  const file = path.join(here, "modules", `${mod}.mjs`);
  if (!fs.existsSync(file)) { if (!check) console.warn(`(module ${mod} not present yet)`); continue; }
  const { TEMPLATES, GEN, PLAN } = await import(file);
  for (const [k, t] of Object.entries(TEMPLATES)) {
    if (!k.startsWith(`${mod}_`)) fail(`${mod}: template key ${k} must start with "${mod}_"`);
    if (OLD_TOPIC[k] || OLD_OWN[k] || templates[k]) fail(`template key ${k} already exists`);
    if (!Array.isArray(t.ko) || !Array.isArray(t.en) || t.ko.length !== 3 || t.en.length !== 3 || t.ko[1].length !== 2 || t.en[1].length !== 2) fail(`${k}: ko / en must be [prompt, [hint1, hint2], explanation]`);
    templates[k] = { prompt: t.ko[0], hints: t.ko[1], explanation: t.ko[2] };
    en[k] = { prompt: t.en[0], hints: t.en[1], expl: t.en[2] };
  }
  for (const p of PLAN) {
    if (!skills.has(p.skill)) fail(`${mod}/${p.template}: unknown skill ${p.skill}`);
    if (!GEN[p.template] || !templates[p.template]) fail(`${mod}: unknown template ${p.template}`);
    if (!p.standards?.length || p.standards.some((c) => !(c in standardsFile))) fail(`${mod}/${p.template}: standards must be official high-school codes (${p.standards})`);
    if (!["calc", "concept", "application", "reverse", "counting", "representation"].includes(p.evidence)) fail(`${p.template}: evidence`);
    if (!p.strategy) fail(`${p.template}: strategy tag missing`);
    if (!Number.isInteger(p.d) || p.d < 1 || p.d > 5) fail(`${p.template}: d (base difficulty 1..5) missing`);
    for (const lvl of p.levels) {
      const id = `b-hs-${p.template.replace(/_/g, "-").toLowerCase()}${p.levels.length > 1 ? lvl : ""}`;
      if (owner[id]) fail(`duplicate set id ${id}`);
      owner[id] = mod;
      const rng = rngOf(id);
      const rows = [], seen = new Set();
      let cols = null, tol, tries = 0;
      const tpl = templates[p.template];
      while (rows.length < p.count && tries++ < p.count * 400) {
        const g = GEN[p.template](rng, lvl);
        const key = JSON.stringify(g.v);
        if (seen.has(key)) continue;
        seen.add(key);
        cols ??= Object.keys(g.v);
        if (JSON.stringify(Object.keys(g.v)) !== JSON.stringify(cols)) fail(`${id}: inconsistent variables`);
        if (typeof g.ans !== "number" || !Number.isFinite(g.ans) || Math.abs(g.ans) > 1e9) fail(`${id}: bad answer ${g.ans}`);
        for (const [k, val] of Object.entries(g.v)) if (/[가-힣]/.test(String(val))) fail(`${id}: Hangul in variable ${k}`);
        if (g.tol !== undefined) { if (tol !== undefined && tol !== g.tol) fail(`${id}: tolerance varies`); tol = g.tol; }
        const vars = { ...g.v, ans: g.ans };
        const text = fill(tpl.prompt, vars).replace(/\s+/g, "");
        if (/\{\w+\}/.test(text.replace(/\{\{[^}]*\}[^}]*\}/g, ""))) { /* unresolved placeholder check is done after the loop on the filled strings */ }
        if (oldPrompts.has(text)) { dropped.duplicateOfExisting++; continue; }
        if (seenPrompts.has(text)) { dropped.duplicateInside++; continue; }
        seenPrompts.add(text);
        rows.push([...cols.map((c) => g.v[c]), g.ans]);
      }
      if (rows.length < Math.min(p.count, 12)) fail(`${id}: only ${rows.length} distinct instances (need >= ${Math.min(p.count, 12)})`);
      sets.push({ id, module: mod, skillId: p.skill, family: `hs-${p.skill.split(".").slice(1).join("-")}`, template: p.template, difficulty: Math.max(1, Math.min(5, p.d + lvl - 1)), ...(tol ? { tolerance: tol } : {}), standards: p.standards, strategy: p.strategy, evidence: p.evidence, cols, rows });
    }
  }
}
// a placeholder that is neither a column nor "ans" is almost always a typo; one-letter / numeric brace groups are literal LaTeX ({3}, {x})
for (const set of sets) {
  const tpl = templates[set.template];
  const names = new Set([...set.cols, "ans"]);
  for (const s of [tpl.prompt, ...tpl.hints, tpl.explanation]) for (const m of s.matchAll(/\{([A-Za-z_]\w+)\}/g)) if (!names.has(m[1])) fail(`${set.id}: placeholder {${m[1]}} is not a column of the set (${[...names]})`);
}
// ---- fraction-format rule (review finding, all modules): the numeric checker accepts a typed number only within 1e-9 of the stored value.
// A template that lets the student write "a decimal or a fraction" is only honest when every answer it can produce terminates in a few decimals;
// otherwise the prompt asks for a fraction in lowest terms and the explanation prints that fraction (column ansf), never a raw double.
const ratOf = (x) => { // continued fraction -> [p, q] (q <= 1e6) or null
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, y = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(y);
    [h1, h0] = [a * h1 + h0, h1]; [k1, k0] = [a * k1 + k0, k1];
    if (k1 > 1e6) return null;
    if (Math.abs(x - h1 / k1) < 1e-12 * Math.max(1, Math.abs(x))) return [h1, k1];
    y = 1 / (y - a);
    if (!Number.isFinite(y)) break;
  }
  return null;
};
const decimalsOf = (q) => { let a = 0, b = 0; while (q % 2 === 0) { q /= 2; a++; } while (q % 5 === 0) { q /= 5; b++; } return q === 1 ? Math.max(a, b) : Infinity; };
const FRAC_KO = /\((?:소수로 써도 되고 3\/4 처럼 분수로 써도 돼요|소수로 쓰세요)\)\s*$/;
const flagged = new Set();
for (const set of sets) {
  if (!FRAC_KO.test(templates[set.template].prompt) || set.tolerance) continue;
  for (const r of set.rows) { const a = r[r.length - 1]; if (Number.isInteger(a)) continue; const f = ratOf(a); if (!f || decimalsOf(f[1]) > 4) { flagged.add(set.template); break; } }
}
const fmtAns = (a) => { if (Number.isInteger(a)) return String(a); const f = ratOf(a); if (f && decimalsOf(f[1]) <= 4) return String(a); return f ? `${f[0]}/${f[1]}` : String(a); };
for (const k of flagged) {
  const t = templates[k], e = en[k];
  t.prompt = t.prompt.replace(FRAC_KO, "(기약분수로 쓰세요. 정수이면 정수로 쓰세요. 예: 3/4)");
  e.prompt = e.prompt.replace(/\(([^()]*)\)\s*$/, "(write a fraction in lowest terms such as 3/4; an integer if the value is whole)");
  const swap = (x) => x.replace(/\{ans\}/g, "{ansf}");
  t.explanation = swap(t.explanation); t.hints = t.hints.map(swap); e.expl = swap(e.expl); e.hints = e.hints.map(swap);
  for (const set of sets) if (set.template === k) { set.rows = set.rows.map((r) => [...r.slice(0, -1), fmtAns(r[r.length - 1]), r[r.length - 1]]); set.cols = [...set.cols, "ansf"]; }
}
console.log(`fraction-format rule: ${flagged.size} templates now ask for a fraction in lowest terms`);

const used = new Set(sets.map((s) => s.template));
for (const k of Object.keys(templates)) if (!used.has(k)) fail(`template ${k} is not used by any plan entry`);
const bank = {
  format: 1, site: "math", status: "DRAFT",
  note: "DRAFT high-school tranche (scripts/learn/bank/hs). Not loaded by the runtime and not published; every row is re-computed by verify/run.py. AI-made, teacher review pending.",
  templates, texts: {}, sets,
};
const out = JSON.stringify(bank) + "\n";
const target = path.join(root, "lib/learn/content/bank/math-hs.json");
if (dumpAt) {
  fs.writeFileSync(dumpAt, JSON.stringify({ sets: sets.map((s) => ({ id: s.id, module: s.module, template: s.template, skillId: s.skillId, tolerance: s.tolerance ?? null, rows: s.rows.map((r) => ({ v: Object.fromEntries(s.cols.map((c, j) => [c, r[j]])), ans: r[s.cols.length] })) })) }));
  console.log(`dumped ${sets.length} sets`);
}
// kit (English reference wording)
fs.mkdirSync(path.join(here, "kit"), { recursive: true });
const enOut = JSON.stringify({ q: en }, null, 2) + "\n";
const koOut = JSON.stringify({ q: Object.fromEntries(Object.entries(templates).map(([k, t]) => [k, { prompt: t.prompt, hints: t.hints, expl: t.explanation }])) }, null, 2) + "\n";
const write = (file, text) => { const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null; if (old === text) return false; if (check) { console.error(`stale: ${path.relative(root, file)}`); process.exitCode = 1; return false; } fs.writeFileSync(file, text); return true; };
if (ONLY) { console.log(`(HS_ONLY=${ONLY}: shared files not written)`); }
const changed = ONLY ? 0 : [write(target, out), write(path.join(here, "kit/en.json"), enOut), write(path.join(here, "kit/ko.json"), koOut)].filter(Boolean).length;
const total = sets.reduce((n, s) => n + s.rows.length, 0);
const byMod = {};
for (const s of sets) { const o = (byMod[s.module] ??= { sets: 0, rows: 0, templates: new Set() }); o.sets++; o.rows += s.rows.length; o.templates.add(s.template); }
console.log(`math-hs: ${sets.length} sets, ${total} questions, ${used.size} structures; dropped ${dropped.duplicateOfExisting} duplicates of the existing bank, ${dropped.duplicateInside} inside; files changed ${changed}`);
for (const [m, o] of Object.entries(byMod)) console.log(`  ${m}: ${o.rows} questions, ${o.templates.size} structures, ${o.sets} sets`);

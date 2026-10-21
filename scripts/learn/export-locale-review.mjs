#!/usr/bin/env node
// Exports the learner-facing texts of low-resource locales as review sheets for native speakers and teachers (CSV for spreadsheets, or JSON).
//
//   node scripts/learn/export-locale-review.mjs [--locales tet,am,km,my,kk,kn,ml] [--scope new|all] [--format csv|json] [--out <dir>]
//
//   scope new (default)  the UI keys + the 17 topic lessons added from the curriculum mapping + the 4 newest Korean-course lessons
//   scope all            the UI keys + every lesson / question / skill text of the three sites
//
// Per locale it writes <locale>-ui.csv (343 UI keys) and <locale>-content.csv, plus README.txt with counts and the automatic flags.
// Nothing is translated or sent anywhere; reviewers fill `reviewed_translation` / `status` / `notes`. Output holds public learner text only.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const LOCALES = arg("--locales", "tet,am,km,my,kk,kn,ml").split(",").map((s) => s.trim()).filter(Boolean);
const SCOPE = arg("--scope", "new");
const FORMAT = arg("--format", "csv");
const OUT = path.resolve(arg("--out", path.join(root, "locale-review-export")));
if (!["new", "all"].includes(SCOPE) || !["csv", "json"].includes(FORMAT)) { console.error("usage: --scope new|all --format csv|json"); process.exit(2); }

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const known = new Set([...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
for (const l of LOCALES) if (!known.has(l)) { console.error(`unknown locale: ${l}`); process.exit(2); }

const NEW_LESSONS = new Set([
  "math-h1-mat1", "math-h1-set1", "math-h1-fnc1", "math-h1-pol1", "math-h3-cal1", "math-h3-cnt1", "en-e3-abc1", "en-e3-snd1", "en-e6-seq1", "en-e6-pun1", "en-m2-sum1",
  "math-e3-ari1", "math-e6-ari1", "math-e6-ari2", "math-m3-sta1", "math-h2-seq1", "math-h3-pro1",
  "korean-k2-l10", "korean-k2-l11", "korean-k3-l10", "korean-k3-l11",
]);
const SITE_FILES = {
  math: ["elementary", "demo", "secondary"].map((t) => `lib/learn/content/${t}/math.json`),
  english: ["elementary", "demo", "secondary"].map((t) => `lib/learn/content/${t}/english.json`),
  korean: ["lib/learn/content/korean/korean.json"],
};

// ---- UI keys: Korean (canonical) from ko.ts, English reference and the locale from the locale dictionaries
const { ko } = await import(path.join(root, "lib/learn/i18n/ko.ts"));
const enUi = readJson(path.join(root, "lib/learn/i18n/locales/en.json"));

// ---- automatic flags: things a human should look at first
const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
// math must survive in any order and any splitting into $...$ spans: compare the sorted characters of all math, ignoring spaces and separators
const maths = (s) => [...(String(s).match(/\$[^$]*\$/g) ?? []).join("").replace(/[$\s,]|\\ /g, "")].sort().join("");
const prose = (s) => String(s).replace(/\$[^$]*\$/g, " ");
function flags(src, ref, tr) {
  const f = [];
  if (tr === undefined || tr === null || String(tr).trim() === "") return ["MISSING"];
  if (tr === ref && /[A-Za-z]{3,}/.test(prose(ref)) && ref !== src) f.push("IDENTICAL_TO_EN");
  if (holes(tr) !== holes(src)) f.push("PLACEHOLDER_DIFF");
  if (maths(src) && maths(tr) !== maths(src)) f.push("MATH_DIFF");
  if (/[가-힣]/.test(tr) && !/[가-힣]/.test(ref ?? "") && src !== tr) f.push("HANGUL_IN_TRANSLATION");
  return f;
}

// ---- content rows
const sites = {};
for (const [site, files] of Object.entries(SITE_FILES)) {
  const lessons = new Map(), questions = new Map(), skills = new Map();
  for (const rel of files) {
    const b = readJson(path.join(root, rel));
    for (const c of b.catalog.courses) for (const u of c.units) for (const l of u.lessons) lessons.set(l.id, l);
    for (const q of b.questions) questions.set(q.id, q);
    for (const s of b.catalog.skills) skills.set(s.id, s);
  }
  sites[site] = { lessons, questions, skills };
}
function selection(site) {
  const { lessons, questions, skills } = sites[site];
  if (SCOPE === "all") return { lessons: [...lessons.keys()], questions: [...questions.keys()], skills: [...skills.keys()] };
  const L = [...lessons.values()].filter((l) => NEW_LESSONS.has(l.id));
  const sk = new Set(L.flatMap((l) => l.skillIds));
  return { lessons: L.map((l) => l.id), skills: [...sk], questions: [...questions.values()].filter((q) => sk.has(q.skillId)).map((q) => q.id) };
}
const overlayOf = (loc, site) => { const p = path.join(root, `content/learn-overlays/${loc}/${site}.json`); return fs.existsSync(p) ? readJson(p) : {}; };

function contentRows(loc) {
  const rows = [];
  for (const site of Object.keys(sites)) {
    const { lessons, questions, skills } = sites[site];
    const sel = selection(site);
    const own = overlayOf(loc, site), en = overlayOf("en", site);
    // the Korean course is authored in English; the other two sites in Korean
    const canonical = (v, enV) => (site === "korean" ? v : v);
    const push = (kind, id, field, src, ref, tr) => rows.push({ site, kind, id, field, canonical: src, en_reference: ref ?? "", translation: tr ?? "", flags: flags(src, ref ?? src, tr).join(" "), reviewed_translation: "", status: "", notes: "" });
    for (const id of sel.skills) { const s = skills.get(id); push("skill", id, "title", canonical(s.title), en.skills?.[id], own.skills?.[id]); }
    for (const id of sel.lessons) {
      const l = lessons.get(id);
      for (const f of ["title", "concept", "example"]) push("lesson", id, f, canonical(l[f] ?? ""), en.lessons?.[id]?.[f], own.lessons?.[id]?.[f]);
    }
    for (const id of sel.questions) {
      const q = questions.get(id), eq = en.questions?.[id], oq = own.questions?.[id];
      push("question", id, "prompt", q.prompt, eq?.prompt, oq?.prompt);
      (q.hints ?? []).forEach((h, i) => push("question", id, `hint${i + 1}`, h, eq?.hints?.[i], oq?.hints?.[i]));
      push("question", id, "explanation", q.explanation ?? "", eq?.explanation, oq?.explanation);
      for (const o of q.options ?? []) if (oq?.options?.[o.id] !== undefined || eq?.options?.[o.id] !== undefined) push("question", id, `option ${o.id}`, o.text, eq?.options?.[o.id], oq?.options?.[o.id]);
    }
  }
  return rows;
}
function uiRows(loc) {
  const tr = readJson(path.join(root, `lib/learn/i18n/locales/${loc}.json`));
  return Object.keys(ko).map((key) => ({ key, canonical_ko: ko[key], en_reference: enUi[key] ?? "", translation: tr[key] ?? "", flags: flags(ko[key], enUi[key] ?? ko[key], tr[key]).join(" "), reviewed_translation: "", status: "", notes: "" }));
}

const csvCell = (v) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (rows) => "﻿" + Object.keys(rows[0]).join(",") + "\r\n" + rows.map((r) => Object.values(r).map(csvCell).join(",")).join("\r\n") + "\r\n";

fs.mkdirSync(OUT, { recursive: true });
const readme = [`Locale review export (scope ${SCOPE}, format ${FORMAT}). Generated by scripts/learn/export-locale-review.mjs. Public learner-facing text only.`,
  "Columns: canonical = the site's source text (Korean for math/english, English for the Korean course); en_reference = the English version; translation = the text currently in the app;",
  "flags = automatic hints (MISSING, IDENTICAL_TO_EN, PLACEHOLDER_DIFF, MATH_DIFF, HANGUL_IN_TRANSLATION); fill reviewed_translation, status (OK / FIX / UNSURE) and notes.",
  "Words in {braces} are placeholders and $...$ is math: keep them exactly. English words and sentences that are the thing being learned stay English.", ""];
for (const loc of LOCALES) {
  const ui = uiRows(loc), content = contentRows(loc);
  const count = (rows) => rows.reduce((a, r) => { for (const f of r.flags ? r.flags.split(" ") : []) a[f] = (a[f] ?? 0) + 1; return a; }, {});
  if (FORMAT === "csv") { fs.writeFileSync(path.join(OUT, `${loc}-ui.csv`), toCsv(ui)); fs.writeFileSync(path.join(OUT, `${loc}-content.csv`), toCsv(content)); }
  else fs.writeFileSync(path.join(OUT, `${loc}.json`), JSON.stringify({ locale: loc, scope: SCOPE, ui, content }, null, 2) + "\n");
  readme.push(`${loc}: ui ${ui.length} rows (flags ${JSON.stringify(count(ui))}); content ${content.length} rows (flags ${JSON.stringify(count(content))})`);
  console.log(readme[readme.length - 1]);
}
fs.writeFileSync(path.join(OUT, "README.txt"), readme.join("\n") + "\n");
console.log(`written to ${path.relative(root, OUT) || OUT}`);

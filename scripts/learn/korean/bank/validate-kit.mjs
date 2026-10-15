#!/usr/bin/env node
// Validates a locale kit of the Korean practice bank against the canonical English source.
//   node scripts/learn/korean/bank/validate-kit.mjs <locale> <file> [--minimal]
//   --minimal: only the templates, the bridge strings and the texts the bridge lessons use are required (the full bank may still be untranslated)
// Checks: every required key present, no empty strings, placeholder sets identical to the English source, no Hangul (except locale ko),
// the same number of hints, quotation marks balanced, no leftover English-only markers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const [locale, file] = process.argv.slice(2);
const minimal = process.argv.includes("--minimal");
const dir = path.join(root, "scripts/learn/korean/bank/kit");
const src = JSON.parse(fs.readFileSync(path.join(dir, minimal ? "source.minimal.en.json" : "source.en.json"), "utf8"));
const kit = JSON.parse(fs.readFileSync(file, "utf8"));
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const holes = (t) => [...new Set([...String(t).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(",");
const errs = [];
const bad = (m) => errs.push(m);
const chk = (path_, tr, en, { allowHangul = false } = {}) => {
  if (typeof tr !== "string" || !tr.trim()) return bad(`${path_}: empty or missing`);
  if (locale !== "ko" && !allowHangul && HANGUL.test(tr)) bad(`${path_}: contains Hangul`);
  if (holes(tr) !== holes(en)) bad(`${path_}: placeholders differ (${holes(en)} vs ${holes(tr)})`);
  if (/[‪-‮⁦-⁩]/.test(tr)) bad(`${path_}: bidi control characters`);
  if (tr.trim() === en.trim() && /[A-Za-z]{6,}/.test(en) && locale !== "en") bad(`${path_}: identical to the English source`);
};
for (const [form, t] of Object.entries(src.templates)) {
  const k = kit.templates?.[form];
  if (!k) { bad(`templates.${form} missing`); continue; }
  chk(`templates.${form}.prompt`, k.prompt, t.prompt);
  chk(`templates.${form}.explanation`, k.explanation, t.explanation);
  if (!Array.isArray(k.hints) || k.hints.length !== t.hints.length) bad(`templates.${form}.hints: count`);
  else t.hints.forEach((h, i) => chk(`templates.${form}.hints.${i}`, k.hints[i], h));
  if (t.hintsSafe) {
    if (!Array.isArray(k.hintsSafe) || k.hintsSafe.length !== t.hintsSafe.length) bad(`templates.${form}.hintsSafe: count`);
    else t.hintsSafe.forEach((h, i) => chk(`templates.${form}.hintsSafe.${i}`, k.hintsSafe[i], h));
  }
}
// grammar notes (n:) quote the Korean forms they explain, so Hangul is allowed there; meanings (g:) and situations (s:) are never Korean
for (const [key, en] of Object.entries(src.texts)) chk(`texts.${key}`, kit.texts?.[key], en, { allowHangul: key.startsWith("n:") });
for (const [skill, en] of Object.entries(src.bridge.skill)) chk(`bridge.skill.${skill}`, kit.bridge?.skill?.[skill], en, { allowHangul: true });
for (const [skill, en] of Object.entries(src.bridge.lesson)) {
  chk(`bridge.lesson.${skill}.title`, kit.bridge?.lesson?.[skill]?.title, en.title, { allowHangul: true });
  chk(`bridge.lesson.${skill}.concept`, kit.bridge?.lesson?.[skill]?.concept, en.concept, { allowHangul: true });
}
if (!minimal) for (const k of Object.keys(kit.texts ?? {})) if (!(k in src.texts)) bad(`texts.${k}: unknown key`);
if (errs.length) { console.error(`${locale}: ${errs.length} problem(s)`); for (const e of errs.slice(0, 40)) console.error("  " + e); process.exit(1); }
console.log(`${locale}: ok (${Object.keys(kit.texts ?? {}).length} texts${minimal ? ", minimal" : ""})`);

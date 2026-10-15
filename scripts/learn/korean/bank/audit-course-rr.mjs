#!/usr/bin/env node
// Read-only audit of the regular Korean course (all levels): romanizations quoted in the questions vs. the independent RR converter (hangul.mjs).
// Checks target.romanization, the correct option of read questions, "(rr)" in explanations and "read “rr”" in hints (cloze hints are checked against the correct option).
// Writes docs/learning/korean-bank/course-rr-findings.json. It never edits the course (the course is shared content owned elsewhere).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { romanize, normRR } from "./hangul.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const course = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/korean/korean.json"), "utf8"));
const trim = (s) => s.replace(/[.?!,]+$/, "");
const out = [];
const chk = (q, field, ko, rr) => {
  ko = trim(ko); rr = trim(rr);
  if (!ko || /[0-9A-Za-z_]/.test(ko)) return;
  const want = romanize(ko);
  if (normRR(want) !== normRR(rr)) out.push({ id: q.id, level: `K${q.skillId.split(".")[1].slice(1)}`, field, ko, current: rr, converter: want });
};
for (const q of course.questions) {
  const t = q.target;
  const cloze = !!t?.text?.includes("____");
  const ans = q.answer?.kind === "choice" ? q.options?.find((o) => o.id === q.answer.id)?.text : undefined;
  if (t?.text && t.romanization && !cloze) chk(q, "target.romanization", t.text, t.romanization);
  if (q.tags?.includes("read") && t?.text && ans) chk(q, "correct option", t.text, ans);
  for (const m of q.explanation.matchAll(/“([가-힣][^“”]*?)” \(([a-z][^)]*?)\)/g)) chk(q, "explanation", m[1], m[2]);
  for (const m of q.explanation.matchAll(/“([가-힣][^“”]*?)” is read “([^”]*)”/g)) chk(q, "explanation", m[1], m[2]);
  for (const h of q.hints) {
    const m = h.match(/read “([^”]*)”/);
    if (m && t?.text) chk(q, "hint", cloze ? ans ?? "" : t.text, m[1]);
  }
}
const seen = new Set();
const uniq = out.filter((o) => { const k = `${o.id}|${o.field}|${o.ko}`; return seen.has(k) ? false : (seen.add(k), true); });
fs.writeFileSync(path.join(root, "docs/learning/korean-bank/course-rr-findings.json"), JSON.stringify(uniq, null, 1) + "\n");
console.log(uniq.length, "mismatches");
for (const o of uniq) console.log(o.level, o.id, o.field, o.ko, "|", o.current, "|", o.converter);

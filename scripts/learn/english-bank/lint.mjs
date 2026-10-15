#!/usr/bin/env node
// Rule-based lint over the English bank (served + pending). Catches generator-level defects the independent reviewers kept finding, and cross-question answer leaks
// between questions that are served together (same skill = same lesson/session).   node scripts/learn/english-bank/lint.mjs [--json] [--served-only]
//   R1  key text of one question appears verbatim in the prompt of ANOTHER question of the same skill (answer exposed by a sibling question)
//   R2  explanation/hint refers to a position ("첫 문장", "첫 번째", "(A)" ...) although options are shuffled
//   R3  cloze: an article "a"/"an" directly before the blank singles out one option
//   R4  hint/explanation Korean particle errors the builder produced ("말는", "”예요" after a consonant name)
//   R5  duplicated option texts inside one question
// Exit code 1 if any finding (use as a regression gate for new questions).
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, "../../..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank", f), "utf8"));
const servedOnly = process.argv.includes("--served-only");
const qs = [...read("english-draft.json").questions, ...(servedOnly ? [] : read("english-pending.json").questions ?? [])];
const keyText = (q) => (q.type === "multiple_choice" ? q.options.find((o) => o.id === q.answer.id)?.text : null);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9가-힣 ]+/g, " ").replace(/\s+/g, " ").trim();
const out = [];
const bySkill = new Map(); for (const q of qs) (bySkill.get(q.skillId) ?? bySkill.set(q.skillId, []).get(q.skillId)).push(q);
const itemOf = (q) => q.id.split("-")[1];
for (const [skill, list] of bySkill) {
  const prompts = list.map((q) => ({ q, p: norm(q.prompt) }));
  for (const q of list) {
    const k = keyText(q); if (!k) continue; const nk = norm(k); if (nk.split(" ").length < 4) continue; // short keys appear in many prompts legitimately
    for (const { q: o, p } of prompts) {
      if (o === q || itemOf(o) === itemOf(q)) continue; // same learning item is one passage/sentence by design
      if (p.includes(nk)) { out.push({ rule: "R1", id: q.id, other: o.id, key: k }); break; }
    }
  }
}
const POS = /(첫|둘째|셋째|넷째|마지막)\s*(번째\s*)?(문장|보기|선택지)|\(([A-D])\)\s*가|위의?\s*표|위\s*그림/;
for (const q of qs) {
  const txt = `${q.explanation ?? ""} ${(q.hints ?? []).join(" ")}`;
  if (q.type === "multiple_choice" && /-(m|pick|cloze)$/.test(q.id) && POS.test(txt)) out.push({ rule: "R2", id: q.id, text: txt.match(POS)?.[0] });
  if (q.type === "multiple_choice") {
    const m = q.prompt.match(/\b(a|an)\s+_{2,}|\b(a|an)\s*___/i);
    if (m) { const art = (m[1] ?? m[2]).toLowerCase(); const opts = q.options.map((o) => o.text.trim()); const okVowel = (t) => /^[aeiou]/i.test(t); if (opts.some((t) => t.split(/\s+/).length > 3)) continue; // the blank belongs to the passage and the question asks something else
    const fit = opts.filter((t) => (art === "an") === okVowel(t)); if (fit.length === 1) out.push({ rule: "R3", id: q.id, article: art }); }
  }
  if (/말는|단어은|[A-Za-z]”예요/.test(txt)) out.push({ rule: "R4", id: q.id });
  if (q.options && q.type === "multiple_choice") { const t = q.options.map((o) => o.text.trim().toLowerCase()); if (new Set(t).size !== t.length) out.push({ rule: "R5", id: q.id }); }
}
const allow = new Set(JSON.parse(fs.readFileSync(path.join(here, "lint-allow.json"), "utf8")).allow.map((a) => `${a.rule}|${a.id}`));
for (let i = out.length - 1; i >= 0; i--) if (allow.has(`${out[i].rule}|${out[i].id}`)) out.splice(i, 1);
const by = {}; for (const f of out) by[f.rule] = (by[f.rule] ?? 0) + 1;
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 1)); else { console.log(`lint: ${qs.length} questions, findings ${out.length}`, JSON.stringify(by)); for (const f of out.slice(0, 40)) console.log(JSON.stringify(f)); }
process.exit(out.length ? 1 : 0);

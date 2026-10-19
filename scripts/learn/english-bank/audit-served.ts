// Reproducible audit of what the English practice bank serves per language and WHY the rest is not served.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/audit-served.ts        writes docs/learn/english-bank-served-audit.json (+ .md summary)
// Nothing here judges translation MEANING: "served" means the structural completeness gate of localizeEnglishBankQuestion passed
// (no Korean left, no empty values, no duplicate options). Meaning review needs a separate, recorded sample (ids, hashes, verdicts).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
import type { Question } from "../../../lib/learn/types";

const root = path.resolve(__dirname, "../../..");
const bankDir = path.join(root, "lib/learn/content/bank");
const draft = JSON.parse(fs.readFileSync(path.join(bankDir, "english-draft.json"), "utf8")).questions as Question[];
const kitDir = path.join(root, "scripts/learn/english-bank/kit");
const locales = fs.readdirSync(kitDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const HANGUL = /[가-힣ㄱ-ㆎ]/;

// file inventory (what each bank file really holds)
const inv: Record<string, unknown> = {};
for (const f of ["english-draft.json", "english-unlinked.json", "english-pending.json"]) {
  const p = path.join(bankDir, f);
  if (!fs.existsSync(p)) continue;
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  const qs = (d.questions ?? d) as Question[];
  const byStatus: Record<string, number> = {};
  for (const q of qs) byStatus[(q as unknown as { status?: string }).status ?? "none"] = (byStatus[(q as unknown as { status?: string }).status ?? "none"] ?? 0) + 1;
  inv[f] = { questions: qs.length, byStatus };
}

const NEEDS: Record<string, string> = {
  "w-gloss-missing": "g:<itemId> (gloss of the headword; itemId = second part of the question id)",
  "w-option-gloss-missing": "wo:<questionId>:<option> (gloss of a distractor)",
  "prompt-or-explanation-missing": "why:<questionId> (explanation text; its Korean form has no template)",
  "hint1-template-missing": "hint 1 pattern not handled by localizeHint1 or its kit key is missing (code or kit)",
  "rdm-question-untranslated": "reading / dialogue / mixed question whose English stem has no translation (key q:<questionId>); most of these ALSO lack an explanation template or hint-1 pattern, so the stem is only the first of several keys (stem, explanation why:<id>, hint 1)",
  "duplicate-options": "two options became identical after translation in this language (the question is dropped; fix the translation of the duplicated option)",
  "rdm-korean-in-source-stem-or-options": "stem/options contain Korean: needs code support for translating r/d/m stems and options, then translations (NOT translatable with the current kit keys)",
};
type Row = { served: number; excluded: Record<string, number>; duplicate: number; englishStemPassthrough: number; passthroughByForm: Record<string, number> };
const perLocale: Record<string, Row> = {};
const byKindForm: Record<string, Record<string, number>> = {}; // reason -> kind:form -> count (taken from the first locale that has a kit)
const examples: Record<string, Array<{ id: string; srcHash: string }>> = {};
const unservedQs: Array<{ q: Question; reason: string }> = [];
const handoff: Array<[string, string, string, string]> = []; // [id, reason, kind:form, srcHash]; the key each reason needs is in NEEDS // one row per unserved question (identical for every language: no kit-specific gap exists)
for (const loc of locales) {
  const kit = JSON.parse(fs.readFileSync(path.join(kitDir, `${loc}.json`), "utf8"));
  const row: Row = { served: 0, excluded: {}, duplicate: 0, englishStemPassthrough: 0, passthroughByForm: {} };
  const seen = new Set<string>();
  for (const q of draft) {
    const trace: { reason?: string } = {};
    const out = localizeEnglishBankQuestion(q, { templates: {}, texts: kit.texts }, loc, trace);
    const kf = `${q.tags?.[3]}:${q.tags?.[2]}`;
    if (!out) {
      const r = trace.reason ?? "unknown";
      row.excluded[r] = (row.excluded[r] ?? 0) + 1;
      if (loc === locales[0]) {
        (byKindForm[r] ??= {})[kf] = (byKindForm[r][kf] ?? 0) + 1;
        (examples[r] ??= []).length < 5 && examples[r].push({ id: q.id, srcHash: sha(q.prompt + "|" + q.explanation) });
        unservedQs.push({ q, reason: r });
        handoff.push([q.id, r, kf, sha([q.prompt, q.explanation, q.hints[0] ?? ""].join("|"))]);
      }
      continue;
    }
    const k = `${out.prompt.toLowerCase().replace(/\s+/g, " ")}|${(out.audioText ?? "").toLowerCase()}|${(out.options ?? []).map((o) => o.text.toLowerCase()).sort().join("|")}`;
    if (seen.has(k)) { row.duplicate++; continue; }
    seen.add(k);
    row.served++;
    // r / d / m questions keep their English stem as authored (only the explanation is localized): count them separately from fully localized ones
    if (["r", "d", "m"].includes(q.tags?.[3] ?? "") && out.prompt === q.prompt && !HANGUL.test(out.prompt)) { row.englishStemPassthrough++; row.passthroughByForm[kf] = (row.passthroughByForm[kf] ?? 0) + 1; }
  }
  perLocale[loc] = row;
}

const servedSet = new Set(Object.values(perLocale).map((r) => r.served));
const result = {
  generatedFrom: { bankQuestions: draft.length, locales: locales.length },
  fileInventory: inv,
  servedPerLocale: Object.fromEntries(Object.entries(perLocale).map(([l, r]) => [l, r.served])),
  servedIdenticalAcrossLocales: servedSet.size === 1,
  unservedPerLocale: draft.length - [...servedSet][0],
  reasonsFirstLocale: perLocale[locales[0]].excluded,
  duplicatesFirstLocale: perLocale[locales[0]].duplicate,
  reasonsByKindForm: byKindForm,
  englishStemPassthroughServed: perLocale[locales[0]].englishStemPassthrough,
  passthroughByForm: perLocale[locales[0]].passthroughByForm,
  reasonsDifferByLocale: locales.filter((l) => JSON.stringify(perLocale[l].excluded) !== JSON.stringify(perLocale[locales[0]].excluded)),
  examples,
};
fs.mkdirSync(path.join(root, "docs/learn"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/learn/english-bank-unserved-handoff.json"), JSON.stringify({ needsByReason: NEEDS, rows: handoff }) + "\n");
fs.writeFileSync(path.join(root, "docs/learn/english-bank-served-audit.json"), JSON.stringify(result, null, 1) + "\n");

// ---- next-work ranking: shared keys first (one translation recovers many questions) -------------------------------------------------------------
const norm = (t: string) => t.replace(/“[^”]*”/g, "“…”").replace(/\d+/g, "N").replace(/\s+/g, " ").trim().slice(0, 90);
const groups: Record<string, Map<string, { n: number; ex: string }>> = {};
const add = (reason: string, key: string, id: string) => { const m = (groups[reason] ??= new Map()); const g = m.get(key) ?? { n: 0, ex: id }; g.n++; m.set(key, g); };
for (const { q, reason } of unservedQs) {
  const item = q.id.split("-")[1] ?? "";
  if (reason === "w-gloss-missing") add(reason, `g:${item}`, q.id);
  else if (reason === "w-option-gloss-missing") add(reason, `options of ${q.tags?.[2]} (distractor glosses)`, q.id);
  else if (reason === "prompt-or-explanation-missing") add(reason, `${q.tags?.[3]}:${q.tags?.[2]} | ${norm(q.explanation)}`, q.id);
  else if (reason === "hint1-template-missing") add(reason, norm(q.hints[0] ?? ""), q.id);
  else add(reason, `${q.tags?.[3]}:${q.tags?.[2]}`, q.id);
}
let md = "# English bank: what is not served and what to do next (generated by audit-served.ts; do not edit by hand)\n\n";
const sv = Object.values(perLocale).map((r) => r.served);
md += `Served per language: ${Math.min(...sv)}..${Math.max(...sv)} of ${draft.length} across ${locales.length} languages (the small spread comes from translations that make two options or two questions identical in one language and are then dropped by the gate). Not served in the first language: ${draft.length - perLocale[locales[0]].served}.\n\n`;
md += "| reason | questions | distinct keys/families | needs |\n|---|---:|---:|---|\n";
for (const [reason, m] of Object.entries(groups)) md += `| ${reason} | ${[...m.values()].reduce((a, g) => a + g.n, 0)} | ${m.size} | ${NEEDS[reason] ?? ""} |\n`;
md += `\nDuplicates removed after localization: ${perLocale[locales[0]].duplicate}. Served r/d/m questions that keep an English stem: ${perLocale[locales[0]].englishStemPassthrough}.\n`;
for (const [reason, m] of Object.entries(groups)) {
  md += `\n## ${reason} - largest shared keys first (questions recovered per key)\n\n`;
  for (const [k, g] of [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 15)) md += `- ${g.n} x ${k}  (e.g. ${g.ex})\n`;
}
md += "\n## Verification after any change\n\n```bash\nnpx tsx --tsconfig tsconfig.json scripts/learn/english-bank/audit-served.ts   # regenerates this file and the json files\nnode scripts/learn/english-bank/build-kits.mjs                                     # rebuild kits from the sources\nnode scripts/learn/build-content-assets.mjs                                        # manifest + assets\nUPDATE_COVERAGE=1 npx vitest run tests/learn/coverage-table.test.ts                 # coverage from what the service really serves\nnpx vitest run\n```\n";
fs.writeFileSync(path.join(root, "docs/learn/english-bank-next-work.md"), md);
console.log(JSON.stringify({ served: [...servedSet], unserved: result.unservedPerLocale, reasons: result.reasonsFirstLocale, duplicates: result.duplicatesFirstLocale, passthrough: result.englishStemPassthroughServed, passthroughByForm: result.passthroughByForm, differByLocale: result.reasonsDifferByLocale.length, inv }, null, 1));

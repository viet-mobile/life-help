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
  "rdm-korean-in-source-stem-or-options": "stem/options contain Korean: needs code support for translating r/d/m stems and options, then translations (NOT translatable with the current kit keys)",
};
type Row = { served: number; excluded: Record<string, number>; duplicate: number; englishStemPassthrough: number; passthroughByForm: Record<string, number> };
const perLocale: Record<string, Row> = {};
const byKindForm: Record<string, Record<string, number>> = {}; // reason -> kind:form -> count (taken from the first locale that has a kit)
const examples: Record<string, Array<{ id: string; srcHash: string }>> = {};
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
console.log(JSON.stringify({ served: [...servedSet], unserved: result.unservedPerLocale, reasons: result.reasonsFirstLocale, duplicates: result.duplicatesFirstLocale, passthrough: result.englishStemPassthroughServed, passthroughByForm: result.passthroughByForm, differByLocale: result.reasonsDifferByLocale.length, inv }, null, 1));

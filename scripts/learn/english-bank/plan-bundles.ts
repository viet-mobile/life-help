// Dependency table and bundle plan for the remaining reading/dialogue/mixed bank questions (no model calls).
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/plan-bundles.ts <outDir>
// Per question: needed keys (q:/o:/h:/why:), which of them can reuse an existing translation (same source hash), new fields, recovered-question count when complete.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
type Q = { id: string; prompt: string; explanation: string; hints: string[]; tags: string[]; skillId: string; options?: Array<{ id: string; text: string }> };
const root = path.resolve(__dirname, "../../..");
const draft = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8")).questions as Q[];
const kit = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/english-bank/kit/th.json"), "utf8")).texts as Record<string, string>;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/english-bank/kit-extra/_manifest.json"), "utf8")) as Record<string, { srcHash: string }>;
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const rdm = (q: Q) => ["r", "d", "m"].includes(q.tags?.[3]);
const qPart = (q: Q) => (q.tags[3] === "m" ? q.prompt : q.prompt.slice(q.prompt.lastIndexOf("\n\n") + 2).trim());
const reusable = new Map<string, string>(); // question-text hash -> id that already has a translation
for (const [k, v] of Object.entries(manifest)) if (k.startsWith("q:")) reusable.set(v.srcHash, k.slice(2));
const probe = (texts: Record<string, string>, q: Q) => { const t: { reason?: string } = {}; const ok = localizeEnglishBankQuestion(q as never, { templates: {}, texts }, "th", t); return ok ? "served" : t.reason ?? "unknown"; };
const rows: Array<{ id: string; form: string; needs: Array<{ type: string; key: string; srcHash: string; reuse?: string }>; newFields: number; reuseFields: number }> = [];
const unservedNow = draft.filter((q) => rdm(q) && probe(kit, q) !== "served");
for (const q of unservedNow) {
  const needs: Array<{ type: string; key: string; srcHash: string; reuse?: string }> = [];
  const d: Record<string, string> = { ...kit };
  if (!kit[`q:${q.id}`]) { const h = sha(qPart(q)); needs.push({ type: "q", key: `q:${q.id}`, srcHash: h, reuse: reusable.get(h) }); d[`q:${q.id}`] = "x"; }
  for (const o of q.options ?? []) if (HANGUL.test(o.text)) { needs.push({ type: "o", key: `o:${q.id}:${o.id}`, srcHash: sha(o.text) }); d[`o:${q.id}:${o.id}`] = "x"; }
  let r = probe(d, q);
  if (r === "hint1-template-missing") { needs.push({ type: "h", key: `h:${q.id}`, srcHash: sha(q.hints[0] ?? "") }); d[`h:${q.id}`] = "x"; r = probe(d, q); }
  if (r === "prompt-or-explanation-missing") needs.push({ type: "why", key: `why:${q.id}`, srcHash: sha(q.explanation.trim()) });
  rows.push({ id: q.id, form: `${q.tags[3]}:${q.tags[2]}`, needs, newFields: needs.filter((n) => !n.reuse).length, reuseFields: needs.filter((n) => n.reuse).length });
}
// signature groups: which key types a question needs (an unserved question with only q: needs is cheap; with q+why needs two ...)
const sig = new Map<string, { questions: number; newFields: number; uniqueStrings: Set<string> }>();
for (const r of rows) { const k = `${r.form} | ${[...new Set(r.needs.map((n) => n.type))].sort().join("+") || "none"}`; const g = sig.get(k) ?? { questions: 0, newFields: 0, uniqueStrings: new Set() }; g.questions++; g.newFields += r.newFields; for (const n of r.needs) if (!n.reuse) g.uniqueStrings.add(`${n.type}|${n.srcHash}`); sig.set(k, g); }
const groups = [...sig.entries()].map(([k, g]) => ({ group: k, questions: g.questions, newFieldsPerLanguage: g.newFields, uniqueNewStringsPerLanguage: g.uniqueStrings.size, questionsPerNewString: +(g.questions / Math.max(1, g.uniqueStrings.size)).toFixed(2) })).sort((a, b) => b.questionsPerNewString - a.questionsPerNewString);
// source-string checks: question parts and explanations
const qs = unservedNow.filter((q) => !kit[`q:${q.id}`]).map((q) => qPart(q));
const qStat = { strings: qs.length, endWithQuestionMark: qs.filter((t) => /[?？]$/.test(t)).length, multiLine: qs.filter((t) => t.includes("\n")).length, withEnglishQuote: qs.filter((t) => /[“"']([A-Za-z][^”"']*)[”"']/.test(t)).length, koreanSource: qs.filter((t) => HANGUL.test(t)).length, over150chars: qs.filter((t) => t.length > 150).length };
const ex = rows.filter((r) => r.needs.some((n) => n.type === "why")).map((r) => draft.find((q) => q.id === r.id)!.explanation.trim());
const frame = (t: string) => t.replace(/[“"'][^”"']*[”"']/g, "“…”").replace(/\d+/g, "N");
const frames = new Map<string, number>(); for (const t of ex) frames.set(frame(t), (frames.get(frame(t)) ?? 0) + 1);
const exStat = { strings: ex.length, withEnglishQuote: ex.filter((t) => /[“"'][A-Za-z][^”"']*[”"']/.test(t)).length, pureKoreanRule: ex.filter((t) => !/[“"'][A-Za-z]/.test(t) && !/[A-Za-z]{3,}/.test(t)).length, uniqueFrames: frames.size, framesUsedMoreThanOnce: [...frames.values()].filter((n) => n > 1).length, questionsInRepeatedFrames: [...frames.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0) };
// pilot: 30 dialogue questions that need exactly q (+ why), grouped by dialogue so a dialogue is recovered completely
const byDialogue = new Map<string, typeof rows>();
for (const r of rows.filter((x) => x.form === "d:dq" && x.needs.every((n) => n.type === "q" || n.type === "why") && x.needs.some((n) => n.type === "why"))) { const k = r.id.split("-")[1]; (byDialogue.get(k) ?? byDialogue.set(k, []).get(k)!).push(r); }
const pilot: typeof rows = []; for (const [, v] of [...byDialogue.entries()].sort((a, b) => b[1].length - a[1].length)) { if (pilot.length + v.length > 30) continue; pilot.push(...v); if (pilot.length >= 30) break; }
const out = { unservedReadingMixedQuestions: rows.length, byGroup: groups.slice(0, 14), questionPartCheck: qStat, explanationCheck: exStat, pilot30: { questions: pilot.length, dialogues: new Set(pilot.map((p) => p.id.split("-")[1])).size, newFieldsPerLanguage: pilot.reduce((a, p) => a + p.newFields, 0), reuseFieldsPerLanguage: pilot.reduce((a, p) => a + p.reuseFields, 0) } };
fs.mkdirSync(process.argv[2], { recursive: true });
fs.writeFileSync(path.join(process.argv[2], "dependency-table.json"), JSON.stringify(rows));
fs.writeFileSync(path.join(root, "docs/learn/english-bank-pilot-30.json"), JSON.stringify({ note: "30 dialogue questions (complete dialogues) needing q: + why:; recovered only when ALL listed keys exist in the language", questions: pilot }, null, 1) + "\n");
fs.writeFileSync(path.join(root, "docs/learn/english-bank-bundle-plan.json"), JSON.stringify(out, null, 1) + "\n");
console.log(JSON.stringify(out, null, 1));

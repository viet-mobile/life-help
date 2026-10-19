// Real remaining translation work for the English bank, counted in UNIQUE source strings (not questions), by layering dummy keys over the real kit:
//   layer 1 q:/o: dummies -> what else blocks (hint 1 needs h:<id>, explanation needs why:<id>);  layer 2 adds h: dummies;  layer 3 adds why: dummies -> must reach 0.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/work-remaining.ts [outDir]     writes docs/learn/english-bank-remaining-scale.json (+ outDir/*.json work tables when given)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
type Q = { id: string; prompt: string; explanation: string; hints: string[]; tags: string[]; options?: Array<{ id: string; text: string }> };
const root = path.resolve(__dirname, "../../..");
const draft = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8")).questions as Q[];
const kit = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/english-bank/kit/th.json"), "utf8")).texts as Record<string, string>;
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const rdm = (q: Q) => ["r", "d", "m"].includes(q.tags?.[3]);
const run = (texts: Record<string, string>) => { const why = new Map<string, string[]>(); for (const q of draft) { if (!rdm(q)) continue; const t: { reason?: string } = {}; if (!localizeEnglishBankQuestion(q as never, { templates: {}, texts }, "th", t)) (why.get(t.reason ?? "unknown") ?? why.set(t.reason ?? "unknown", []).get(t.reason ?? "unknown")!).push(q.id); } return why; };
const byId = new Map(draft.map((q) => [q.id, q]));
const qPart = (q: Q) => (q.tags[3] === "m" ? q.prompt : q.prompt.slice(q.prompt.lastIndexOf("\n\n") + 2).trim());
// layer 1: every question gets q:, every Korean option gets o:
const d1: Record<string, string> = { ...kit };
for (const q of draft) { if (!rdm(q)) continue; d1[`q:${q.id}`] ??= "x"; for (const o of q.options ?? []) if (HANGUL.test(o.text)) d1[`o:${q.id}:${o.id}`] = "x"; }
const L1 = run(d1);
const needH = L1.get("hint1-template-missing") ?? [];
const d2 = { ...d1 }; for (const id of needH) d2[`h:${id}`] = "x";
const L2 = run(d2);
const needE = L2.get("prompt-or-explanation-missing") ?? [];
const d3 = { ...d2 }; for (const id of needE) d3[`why:${id}`] = "x";
const L3 = run(d3);
type Row = { text: string; n: number; ids: string[] };
const uniq = (ids: string[], get: (q: Q) => string[]) => { const m = new Map<string, Row>(); for (const id of ids) for (const text of get(byId.get(id)!)) { const r = m.get(text) ?? { text, n: 0, ids: [] }; r.n++; r.ids.push(id); m.set(text, r); } return [...m.values()]; };
const have = (id: string) => !!kit[`q:${id}`];
const needQ = draft.filter((q) => rdm(q) && !have(q.id));
const Qs = uniq(needQ.map((q) => q.id), (q) => [qPart(q)]);
const koOpt = draft.filter((q) => rdm(q) && (q.options ?? []).some((o) => HANGUL.test(o.text))).map((q) => q.id);
const Os = uniq(koOpt, (q) => (q.options ?? []).filter((o) => HANGUL.test(o.text)).map((o) => o.text));
const Hs = uniq(needH, (q) => [q.hints[0] ?? ""]);
const Es = uniq(needE, (q) => [q.explanation.trim()]);
const stat = (rows: Row[]) => ({ questionsAffected: new Set(rows.flatMap((r) => r.ids)).size, uniqueStrings: rows.length, sourceChars: rows.reduce((a, r) => a + r.text.length, 0), top: rows.sort((a, b) => b.n - a.n).slice(0, 3).map((r) => [r.n, r.text.slice(0, 50)]) });
const out = {
  questionsBlockedFirstReason: Object.fromEntries([...run(kit)].map(([k, v]) => [k, v.length])),
  afterLayers: { afterQandO: Object.fromEntries([...L1].map(([k, v]) => [k, v.length])), afterH: Object.fromEntries([...L2].map(([k, v]) => [k, v.length])), afterWhy: Object.fromEntries([...L3].map(([k, v]) => [k, v.length])) },
  keys: { "q:<id> question part (English or Korean source)": stat(Qs), "o:<id>:<opt> Korean option": stat(Os), "h:<id> individual hint 1": stat(Hs), "why:<id> explanation": stat(Es) },
  perLanguage: "the same unique strings must be translated into each of the 46 languages (en = definition-free copy for English-source strings); quoted English inside a source string stays English",
  note: "counts are over the reading/dialogue/mixed bank questions only; the w-form questions are covered by the gloss work (13 distractor glosses + 2 duplicate-option cases remain)",
};
fs.writeFileSync(path.join(root, "docs/learn/english-bank-remaining-scale.json"), JSON.stringify(out, null, 1) + "\n");
if (process.argv[2]) { fs.mkdirSync(process.argv[2], { recursive: true }); const tab = (rows: Row[], kind: string) => rows.map((r, n) => ({ n, kind, text: r.text, hash: sha(r.text), ids: r.ids })); fs.writeFileSync(path.join(process.argv[2], "remaining.json"), JSON.stringify({ q: tab(Qs, "q"), o: tab(Os, "o"), h: tab(Hs, "h"), e: tab(Es, "why") })); }
console.log(JSON.stringify(out, null, 1));

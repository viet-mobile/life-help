// Work table for the question stems of reading / dialogue / mixed bank questions that are served with an English instruction (stage: q:<id> keys).
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/work-stems.ts <outDir>      writes <outDir>/stems.json = {items:[{n,text,ctx,form,ids}]}
// One item per DISTINCT question text; every id with that text receives the same translation (same text, same role). Source hash = sha1(text).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
const root = path.resolve(__dirname, "../../..");
const draft = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8")).questions as Array<{ id: string; prompt: string; tags: string[]; options?: Array<{ text: string }> }>;
const HANGUL = /[가-힣ㄱ-ㆎ]/;
// Only the questions that would be served once their stem is translated (everything else is blocked by another reason first and is worked on later):
const kit = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/english-bank/kit/th.json"), "utf8"));
const probe = { templates: {}, texts: { ...kit.texts, ...Object.fromEntries(draft.map((q) => [`q:${q.id}`, "x"])) } };
const groups = new Map<string, { text: string; form: string; ctx: string; ids: string[] }>();
for (const q of draft) {
  const kind = q.tags?.[3];
  if (!["r", "d", "m"].includes(kind) || HANGUL.test(q.prompt) || (q.options ?? []).some((o) => HANGUL.test(o.text))) continue;
  if (!localizeEnglishBankQuestion(q as never, probe, "th")) continue;
  let text = q.prompt, ctx = "";
  if (kind !== "m") { const cut = q.prompt.lastIndexOf("\n\n"); if (cut < 0) continue; text = q.prompt.slice(cut + 2).trim(); ctx = q.prompt.slice(0, cut).replace(/\n/g, " / ").slice(0, 140); }
  const k = `${kind}|${text}`;
  const g = groups.get(k) ?? { text, form: `${kind}:${q.tags[2]}`, ctx, ids: [] };
  g.ids.push(q.id); groups.set(k, g);
}
const items = [...groups.values()].map((g, n) => ({ n, text: g.text, form: g.form, ctx: g.ctx, hash: crypto.createHash("sha1").update(g.text).digest("hex").slice(0, 10), ids: g.ids }));
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "stems.json"), JSON.stringify({ items }));
console.log(JSON.stringify({ questions: items.reduce((a, i) => a + i.ids.length, 0), distinctTexts: items.length, byForm: items.reduce((a: Record<string, number>, i) => ((a[i.form] = (a[i.form] ?? 0) + 1), a), {}) }));

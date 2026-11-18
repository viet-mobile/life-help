// Work table for the headword glosses the English bank still lacks (reason w-gloss-missing): key g:<itemId> = meaning of the English word in the learner's language.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/work-gloss.ts <outDir>     writes <outDir>/gloss.json = {items:[{n,key,en,pos,ko,ex,ids}]}
// One item per key. The Korean gloss + the example sentence fix the SENSE (homonyms stay apart: key = itemId, never the bare string).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
const root = path.resolve(__dirname, "../../..");
const draft = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8")).questions as Array<{ id: string; prompt: string; explanation: string; hints: string[]; tags: string[]; skillId: string }>;
const kit = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/english-bank/kit/th.json"), "utf8"));
const items = new Map<string, { key: string; en: string; pos: string; ko: string; ex: string; ids: string[] }>();
for (const q of draft) {
  if (q.tags?.[3] !== "w") continue;
  const trace: { reason?: string } = {};
  if (localizeEnglishBankQuestion(q as never, { templates: {}, texts: kit.texts }, "th", trace) || trace.reason !== "w-gloss-missing") continue;
  const item = q.id.split("-")[1];
  const m = q.explanation.match(/^“([^”]+)” → “([^”]+)”\. 예문: ([^\n]+?) \([^()]+\)(?: .*)?$/);
  if (!m) continue;
  const pos = q.hints[0]?.match(/^이 (?:단어는|말은) (\S+?)(?:예요|이에요)/)?.[1] ?? "";
  const it = items.get(item) ?? { key: `g:${item}`, en: m[1], pos, ko: m[2], ex: m[3], ids: [] };
  it.ids.push(q.id); items.set(item, it);
}
const out = [...items.values()].map((i, n) => ({ n, ...i, hash: crypto.createHash("sha1").update([i.en, i.pos, i.ko, i.ex].join("|")).digest("hex").slice(0, 10) }));
fs.mkdirSync(process.argv[2], { recursive: true });
fs.writeFileSync(path.join(process.argv[2], "gloss.json"), JSON.stringify({ items: out }));
console.log(JSON.stringify({ keys: out.length, questions: out.reduce((a, i) => a + i.ids.length, 0) }));

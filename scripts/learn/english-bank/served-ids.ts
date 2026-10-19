// Writes the ids the loader serves per locale (kit + kit-extra - kit-hold, as built into kit/) to the given file; used for before/after comparison.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/served-ids.ts <out.json>
import fs from "node:fs";
import path from "node:path";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
import type { Question } from "../../../lib/learn/types";
const root = path.resolve(__dirname, "../../..");
const draft = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8")).questions as Question[];
const kitDir = path.join(root, "scripts/learn/english-bank/kit");
const out: Record<string, Record<string, string>> = {};
for (const f of fs.readdirSync(kitDir).filter((x) => x.endsWith(".json"))) {
  const loc = f.slice(0, -5); const kit = JSON.parse(fs.readFileSync(path.join(kitDir, f), "utf8"));
  const m: Record<string, string> = {};
  for (const q of draft) { const o = localizeEnglishBankQuestion(q, { templates: {}, texts: kit.texts }, loc); if (o) m[q.id] = JSON.stringify([o.prompt, o.options, o.explanation, o.hints]); }
  out[loc] = m;
}
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(out).map(([l, m]) => [l, Object.keys(m).length])));

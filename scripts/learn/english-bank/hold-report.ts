// Reconciles kit-hold.json: global unique keys vs (language, key) pairs, and the questions that are really not served because of the hold.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/hold-report.ts      -> docs/learn/english-bank-hold-report.json
import fs from "node:fs";
import path from "node:path";
import { localizeEnglishBankQuestion } from "../../../lib/learn/content/english-bank";
const root = path.resolve(__dirname, "../../..");
const draft = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8")).questions;
const hold = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/english-bank/kit-hold.json"), "utf8")) as Record<string, { keys: string[]; items: Array<{ reviewId: string; verdict: string; keys: string[] }> }>;
const review = JSON.parse(fs.readFileSync(path.join(root, "docs/learn/english-bank-review-20261020.json"), "utf8")).items as Array<{ id: string; srcHash: string; trHash: string; verdict: string; held?: boolean }>;
const pairs: Array<[string, string]> = [];
const perLocale: Record<string, unknown> = {};
for (const [loc, h] of Object.entries(hold)) {
  if (loc.startsWith("_")) continue;
  const kit = JSON.parse(fs.readFileSync(path.join(root, `scripts/learn/english-bank/kit/${loc}.json`), "utf8")).texts as Record<string, string>;
  const extra = JSON.parse(fs.readFileSync(path.join(root, `scripts/learn/english-bank/kit-extra/${loc}.json`), "utf8")).texts as Record<string, string>;
  const full = { ...kit }; for (const k of h.keys) if (extra[k]) full[k] = extra[k];
  const served = (texts: Record<string, string>) => { const ids = new Set<string>(); const seen = new Set<string>(); for (const q of draft) { const o = localizeEnglishBankQuestion(q, { templates: {}, texts }, loc); if (!o) continue; const k = `${o.prompt.toLowerCase()}|${(o.audioText ?? "").toLowerCase()}|${(o.options ?? []).map((x: { text: string }) => x.text.toLowerCase()).sort().join("|")}`; if (seen.has(k)) continue; seen.add(k); ids.add(q.id); } return ids; };
  const a = served(full), b = served(kit);
  const lost = [...a].filter((id) => !b.has(id));
  for (const k of h.keys) pairs.push([loc, k]);
  perLocale[loc] = { heldKeys: h.keys.length, questionsNotServedBecauseOfHold: lost.length, questionIds: lost, reviewItems: h.items.map((i) => ({ reviewId: i.reviewId, verdict: i.verdict, srcHash: review.find((r) => r.id === i.reviewId)?.srcHash, trHash: review.find((r) => r.id === i.reviewId)?.trHash, keys: i.keys })) };
}
const out = { languageKeyPairs: pairs.length, globalUniqueKeys: new Set(pairs.map((p) => p[1])).size, reviewItemsHeld: review.filter((r) => r.held).length, explanation: "A held review item can hold several keys (a headword gloss holds g:<item> and w:<ko>); the same key text can be held in several languages. 'Pairs' counts (language,key); 'globalUniqueKeys' counts key text once. Release needs a recorded review of the translation (srcHash/trHash), not only deleting the key.", perLocale };
fs.writeFileSync(path.join(root, "docs/learn/english-bank-hold-report.json"), JSON.stringify(out, null, 1) + "\n");
console.log(JSON.stringify({ ...out, perLocale: Object.fromEntries(Object.entries(perLocale).map(([l, v]) => [l, { keys: (v as { heldKeys: number }).heldKeys, questions: (v as { questionsNotServedBecauseOfHold: number }).questionsNotServedBecauseOfHold }])) }));

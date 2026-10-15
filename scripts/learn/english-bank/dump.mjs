#!/usr/bin/env node
// Readable dump of the expanded questions of one packet (for reviewers):  node scripts/learn/english-bank/dump.mjs <packetId>
// (run `node scripts/learn/english-bank/build.mjs` first; it writes lib/learn/content/bank/english-draft.json)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const bank = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8"));
const packet = process.argv[2];
let lastItem = "";
for (const q of bank.questions.filter((x) => !packet || x.packet === packet)) {
  const item = q.id.replace(/^eb-/, "").split("-")[0];
  if (item !== lastItem) { console.log(`\n=== item ${item} [${q.skillId}] kind ${q.tags[3]}${q.standards ? ` std ${q.standards.join(",")}` : ""}`); lastItem = item; }
  console.log(`-- ${q.id} (${q.tags[2]}, d${q.difficulty})`);
  console.log(q.prompt);
  if (q.type === "ordering") console.log("   tiles: " + q.options.map((o) => `${o.id}=${o.text}`).join(" | ") + "  ANSWER: " + q.answer.ids.map((id) => q.options.find((o) => o.id === id).text).join(" "));
  else for (const o of q.options) console.log(`   ${o.id === q.answer.id ? "✓" : " "} ${o.id}. ${o.text}`);
  console.log(`   hints: ${q.hints.join(" / ")}`);
  console.log(`   expl: ${q.explanation}`);
}

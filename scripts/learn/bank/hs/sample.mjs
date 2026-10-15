#!/usr/bin/env node
// Prints readable samples (the filled Korean prompt, hints, explanation and answer) of the draft bank for a human / reviewer:
//   node scripts/learn/bank/hs/sample.mjs <module> [perSet=4]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const bank = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/math-hs.json"), "utf8"));
const [mod, perArg] = process.argv.slice(2);
const per = Number(perArg ?? 4);
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m)).replace(/\}\}/g, "} }").replace(/\{\{/g, "{ {");
for (const set of bank.sets.filter((s) => !mod || s.module === mod)) {
  const t = bank.templates[set.template];
  console.log(`\n### ${set.id}  [${set.skillId}] standards ${set.standards.join(",")} · ${set.strategy} · ${set.evidence} · d${set.difficulty}${set.tolerance ? ` · tol ${set.tolerance}` : ""} · ${set.rows.length} rows`);
  const idx = [...new Set([0, 1, Math.floor(set.rows.length / 2), set.rows.length - 1])].slice(0, per);
  for (const i of idx) {
    const row = set.rows[i], v = {};
    set.cols.forEach((c, j) => { v[c] = row[j]; });
    v.ans = row[set.cols.length];
    console.log(`- (#${i + 1}) ${fill(t.prompt, v)}\n    힌트1: ${fill(t.hints[0], v)}\n    힌트2: ${fill(t.hints[1], v)}\n    해설: ${fill(t.explanation, v)}\n    정답: ${v.ans}`);
  }
}

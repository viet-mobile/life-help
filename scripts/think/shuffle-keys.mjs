#!/usr/bin/env node
// Moves the keyed option of single-choice steps to a position derived from the task+step id (deterministic, idempotent) and relabels the
// option ids a, b, c... in the new order, so that a batch never keeps the same key letter everywhere (a guessable cue found in review).
// Tasks whose text refers to an option letter ("보기 C", "C)") are left alone. Only lib/think/data/extra/*.json are touched.
import fs from "node:fs";
import crypto from "node:crypto";
const dir = "lib/think/data/extra";
const REF = /(보기|선택지|option|Option|choice)\s*[a-fA-F]\b|(^|[^\w])[A-Fa-f]\)/;
let moved = 0, skipped = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const p = `${dir}/${f}`;
  const tasks = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const t of tasks) {
    const stepsText = JSON.stringify(t);
    const hasRef = REF.test(stepsText.replace(/"id":"[a-z0-9]+"/g, ""));
    for (const s of t.steps) {
      if (s.kind !== "choose" || s.multi || s.correct.length !== 1) continue;
      if (hasRef) { skipped++; continue; }
      const n = s.options.length;
      const pos = crypto.createHash("sha1").update(`${t.id}/${s.id}`).digest().readUInt16BE(0) % n;
      const key = s.options.find((o) => o.id === s.correct[0]);
      const rest = s.options.filter((o) => o !== key);
      const next = [...rest.slice(0, pos), key, ...rest.slice(pos)];
      const map = new Map(next.map((o, i) => [o.id, String.fromCharCode(97 + i)]));
      s.options = next.map((o) => ({ ...o, id: map.get(o.id) }));
      s.correct = [map.get(s.correct[0])];
      if (s.acceptable) s.acceptable = s.acceptable.map((a) => ({ ...a, ids: a.ids.map((i) => map.get(i)) }));
      moved++;
    }
  }
  fs.writeFileSync(p, JSON.stringify(tasks, null, 1));
}
console.log(`single-choice steps repositioned: ${moved}, skipped (letter references in text): ${skipped}`);

#!/usr/bin/env node
// Applies an independent reviewer's patch file to the authored pools:  node scripts/learn/english-bank/apply-review.mjs reviews/<packet>.json
// Patch file: { "packet": "...", "reviewer": "...", "scope": {...}, "patches": [ { "item": "<8-hex item id from the question id>", "op": "drop"|"set", "set": {field: value, ...}, "why": "...", "severity": "blocker|major|minor" } ], "ok": N }
// "set" replaces whole fields of the item (e.g. {"bad":[...]}, {"o":[...]} for a standalone item, or {"qs": [...]} for a passage).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
const rev = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const poolFile = path.join(here, "pools", `${rev.packet}.json`);
const pool = JSON.parse(fs.readFileSync(poolFile, "utf8"));
const idOf = (skill, it) => sha(`${skill}|${it.k}|${it.k === "m" ? `${it.q}|${it.o.join("|")}` : (it.en ?? it.good ?? it.title)}`);
const log = { applied: 0, dropped: 0, set: 0, missing: [] };
for (const p of rev.patches) {
  let done = false;
  for (const sec of pool.sections ?? [{ skill: pool.skill, items: pool.items }]) {
    const i = sec.items.findIndex((it) => idOf(sec.skill, it) === p.item);
    if (i < 0) continue;
    if (p.op === "drop") { sec.items.splice(i, 1); log.dropped++; }
    else if (p.op === "set") { Object.assign(sec.items[i], p.set); log.set++; }
    else throw new Error(`unknown op ${p.op}`);
    log.applied++; done = true; break;
  }
  if (!done) log.missing.push(p.item);
}
fs.writeFileSync(poolFile, JSON.stringify(pool, null, 1) + "\n");
console.log(JSON.stringify(log));

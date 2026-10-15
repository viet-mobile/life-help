#!/usr/bin/env node
// Applies independent-review patches (review_NN.json: {patches:[{skill, ko, action: remove|edit, edit:{...}, reason, severity}]}) to the authored pools.
//   node scripts/learn/korean/bank/apply-patches.mjs <dir with review_*.json> [--dry]
// Writes the audit trail docs/learning/korean-bank/review-log.json (what was removed / edited, why, by which packet).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const dir = process.argv[2];
const dry = process.argv.includes("--dry");
const POOLS = path.join(root, "scripts/learn/korean/bank/pools");
const pools = new Map(); // file -> json
for (const f of fs.readdirSync(POOLS).filter((x) => x.endsWith(".json"))) pools.set(f, JSON.parse(fs.readFileSync(path.join(POOLS, f), "utf8")));
const find = (skill) => { for (const [f, p] of pools) if (p.skills[skill]) return p.skills[skill]; return null; };

const log = [];
const unmatched = [];
for (const rf of fs.readdirSync(dir).filter((x) => /^v?review_\d+\.json$/.test(x)).sort()) {
  const rv = JSON.parse(fs.readFileSync(path.join(dir, rf), "utf8"));
  for (const p of rv.patches ?? []) {
    const sk = find(p.skill);
    const idx = sk ? sk.entries.findIndex((e) => e.ko.trim().replace(/\s+/g, " ") === String(p.ko).trim().replace(/\s+/g, " ")) : -1;
    if (idx < 0) { unmatched.push({ packet: rf, skill: p.skill, ko: p.ko, action: p.action, reason: p.reason }); continue; }
    const e = sk.entries[idx];
    const rec = { packet: rf, skill: p.skill, ko: e.ko, action: p.action, severity: p.severity, reason: p.reason };
    if (p.action === "remove") { sk.entries.splice(idx, 1); log.push(rec); continue; }
    const ed = p.edit ?? {};
    const applied = [];
    for (const k of ed.drop ?? []) { if (k === "read") delete e.read; else delete e[k]; applied.push(`drop ${k}`); }
    if (typeof ed.g === "string" && ed.g.trim() && ed.g !== e.g) { e.g = ed.g.trim(); applied.push("g"); }
    if (typeof ed.s === "string" && ed.s.trim()) { e.s = ed.s.trim(); applied.push("s"); }
    if (ed.cloze && typeof ed.cloze === "object") {
      const c = ed.cloze; const blank = c.blank ?? c.b, ans = c.ans ?? c.a, w = c.w;
      if (typeof blank === "string" && typeof ans === "string" && Array.isArray(w)) { e.cloze = { blank, ans, w }; applied.push("cloze"); }
    }
    if (ed.choose && Array.isArray(ed.choose.w)) { e.choose = { w: ed.choose.w }; applied.push("choose"); }
    if (ed.order && Array.isArray(ed.order.parts)) { e.order = { parts: ed.order.parts }; applied.push("order"); }
    if (ed.read && typeof ed.read === "object") { e.read = ed.read; applied.push("read"); }
    // Notes appear only in the explanation (after the answer is submitted), so "the note gives the answer away" is not a reason to clear one;
    // a note that does not fit the sentence is.
    if (ed.note === "" && !/give|reveal|hint|away/i.test(p.reason ?? "") && e.note) { delete e.note; applied.push("note cleared"); }
    if (typeof ed.note === "string" && ed.note.trim()) {
      if (sk.notes[ed.note]) { e.note = ed.note; applied.push("note key"); }
      else if (e.note) { sk.notes[e.note] = ed.note.trim(); applied.push("note text"); }
      else { const key = `n${Math.abs([...ed.note].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36)}`; sk.notes[key] = ed.note.trim(); e.note = key; applied.push("note new"); }
    }
    rec.applied = applied;
    log.push(rec);
  }
}
if (!dry) {
  for (const [f, p] of pools) fs.writeFileSync(path.join(POOLS, f), JSON.stringify(p, null, 1) + "\n");
  const out = path.join(root, "docs/learning/korean-bank");
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, "review-log.json");
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { applied: [], unmatched: [] };
  const rounds = new Set(log.map((r) => (r.packet.startsWith("v") ? 2 : 1)));
  const round = rounds.has(2) ? 2 : 1;
  const tag = (arr) => arr.map((r) => ({ round, ...r }));
  fs.writeFileSync(file, JSON.stringify({ note: "AI independent review (not native-speaker or teacher review). Round 1: 22 packets over every non-syllable entry. Round 2: second independent review of every entry round 1 edited. Patches are applied to the authored pools; unmatched = a patch whose entry text was not found.", applied: [...prev.applied, ...tag(log)], unmatched: [...prev.unmatched, ...tag(unmatched)] }, null, 1) + "\n");
}
const c = { remove: 0, edit: 0 };
for (const r of log) c[r.action]++;
console.log(`patches applied: ${log.length} (remove ${c.remove}, edit ${c.edit}); unmatched ${unmatched.length}${dry ? " [dry run]" : ""}`);
for (const u of unmatched.slice(0, 20)) console.log("  unmatched:", u.packet, u.skill, u.ko);

#!/usr/bin/env node
// Removes duplicate learning items from the authored pools:
//   1. the same Korean string in more than one bank skill (the earliest level / skill keeps it),
//   2. a Korean string that the regular course (lib/learn/content/korean/korean.json, K1..K10 targets, options and lesson examples) already teaches.
// Entries the K7 bridge lessons use (course-bridge.mjs) are protected: in a clash the other copy goes.
//   node scripts/learn/korean/bank/dedupe.mjs [--dry]       writes docs/learning/korean-bank/dedupe-log.json
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { BRIDGE_USED_IDS } from "../course-bridge.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const dry = process.argv.includes("--dry");
const POOLS = path.join(root, "scripts/learn/korean/bank/pools");
const hid = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const protectedIds = new Set(BRIDGE_USED_IDS);
const levelNum = (sid) => Number(sid.split(".")[1].slice(1));

const course = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/korean/korean.json"), "utf8"));
const courseKo = new Set();
const addKo = (t) => { const s = String(t ?? "").trim().replace(/\s+/g, " "); if (/[가-힣]/.test(s)) courseKo.add(s); };
for (const q of course.questions) { addKo(q.target?.text); for (const o of q.options ?? []) addKo(o.text); }
for (const c of course.catalog.courses) for (const u of c.units) for (const l of u.lessons) for (const m of String(l.example).matchAll(/[가-힣][가-힣 ,.?!']*/g)) addKo(m[0]);

const files = fs.readdirSync(POOLS).filter((f) => f.endsWith(".json")).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
const pools = new Map(files.map((f) => [f, JSON.parse(fs.readFileSync(path.join(POOLS, f), "utf8"))]));
const norm = (ko) => ko.trim().replace(/\s+/g, " ");
const all = [];
for (const [f, p] of pools) for (const [sid, sk] of Object.entries(p.skills)) sk.entries.forEach((e) => all.push({ f, sid, sk, e, ko: norm(e.ko), id: hid(`${sid}|${e.ko.trim()}`) }));
all.sort((a, b) => levelNum(a.sid) - levelNum(b.sid));

const keep = new Map(); // ko -> record kept
const drop = [];
for (const r of all) {
  if (r.e.cat === "passage") continue;
  if (courseKo.has(r.ko) && !protectedIds.has(r.id)) { drop.push({ ...r, why: "already taught by the regular course" }); continue; }
  const prev = keep.get(r.ko);
  if (!prev) { keep.set(r.ko, r); continue; }
  if (protectedIds.has(r.id) && !protectedIds.has(prev.id)) { drop.push({ ...prev, why: `duplicate of ${r.sid} (protected bridge entry)` }); keep.set(r.ko, r); continue; }
  drop.push({ ...r, why: `same Korean as ${prev.sid}` });
}
const dropSet = new Set(drop.map((d) => d.e));
for (const [, p] of pools) for (const sk of Object.values(p.skills)) sk.entries = sk.entries.filter((e) => !dropSet.has(e));
const log = drop.map((d) => ({ skill: d.sid, ko: d.ko, gloss: d.e.g, why: d.why }));
if (!dry) {
  for (const [f, p] of pools) fs.writeFileSync(path.join(POOLS, f), JSON.stringify(p, null, 1) + "\n");
  fs.mkdirSync(path.join(root, "docs/learning/korean-bank"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/learning/korean-bank/dedupe-log.json"), JSON.stringify({ note: "Duplicate learning items removed from the pools (same Korean in several skills, or already taught by the regular course).", removed: log }, null, 1) + "\n");
}
const short = {};
for (const [, p] of pools) for (const [sid, sk] of Object.entries(p.skills)) if (sk.entries.length < 20) short[sid] = sk.entries.length;
console.log(`removed ${log.length} duplicate entries${dry ? " [dry run]" : ""}; skills now under 20 entries:`, short);

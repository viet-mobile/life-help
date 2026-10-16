#!/usr/bin/env node
// Applies one reviewed Korean batch:  node scripts/learn/korean/bank/review-collect.mjs <dir> <n> [--apply] [--accept id,id]
// Validates blind vs key, coverage, canaries (none here); with --apply patches the additions files, updates review-ledger.json and item-grades.json.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../../../..");
const [dir, nStr] = process.argv.slice(2); const n = Number(nStr);
const apply = process.argv.includes("--apply");
const accept = new Set((process.argv.includes("--accept") ? process.argv[process.argv.indexOf("--accept") + 1] : "").split(",").filter(Boolean));
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const hid = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const full = read(path.join(dir, `full-${n}.json`)), blind = read(path.join(dir, `blind-${n}.out.json`)), rev = read(path.join(dir, `review-${n}.out.json`));
const itemOf = (qid) => qid.match(/-([0-9a-f]{8})-[a-z]+$/)[1];
const problems = [];
for (const q of full.questions) if (!(q.id in blind.answers)) problems.push(`blind missing ${q.id}`); else if (!(q.id in rev.verdicts)) problems.push(`verdict missing ${q.id}`);
for (const it of Object.keys(full.items)) if (!rev.grades?.[it]) problems.push(`grade missing ${it}`);
if (problems.length) { console.error(problems.slice(0, 10).join("\n")); process.exit(2); }
const mismatch = [], alts = new Set(Object.keys(blind.alt ?? {}));
for (const q of full.questions) {
  const key = q.answer.kind === "order" ? q.answer.ids : q.answer.id, got = blind.answers[q.id];
  if (JSON.stringify(key) !== JSON.stringify(got)) mismatch.push(q.id);
}
const defective = new Set(Object.entries(rev.verdicts).filter(([, v]) => v === "defect").map(([k]) => k));
const patched = new Map((rev.patches ?? []).map((p) => [p.item, p]));
const flagged = new Set([...mismatch, ...alts, ...defective].map(itemOf));
const unresolved = [...flagged].filter((i) => !patched.has(i) && !accept.has(i));
const summary = { batch: n, packet: full.packet, questions: full.questions.length, blindMismatch: mismatch.length, blindAlt: alts.size, defects: (rev.defects ?? []).length, patches: patched.size, unresolved, mismatch };
console.log(JSON.stringify(summary));
if (!apply) process.exit(unresolved.length ? 3 : 0);
if (unresolved.length) { console.error("unresolved flagged items: use --accept after reading them"); process.exit(3); }
// ---- apply patches to the additions files
const addDir = path.join(here, "additions"), files = fs.readdirSync(addDir).filter((f) => f.endsWith(".json"));
const docs = Object.fromEntries(files.map((f) => [f, read(path.join(addDir, f))]));
const ledgerPath = path.join(here, "review-ledger.json"), ledger = fs.existsSync(ledgerPath) ? read(ledgerPath) : { note: "Korean bank supplementary entries that passed independent AI review (blind solve + informed review); NOT teacher/native review. Keyed by item id = sha1(skill|ko)[0:8].", reviewed: {} };
const gradesPath = path.join(root, "lib/learn/content/korean/item-grades.json"), grades = fs.existsSync(gradesPath) ? read(gradesPath) : { _note: "Item-level grade/area/standard judgement of the supplementary Korean entries: author claim + independent AI reviewer judgement. AI classification, not teacher/native review, not TOPIK.", items: {} };
const when = new Date().toISOString().slice(0, 10);
let applied = 0, dropped = 0;
for (const [item, info] of Object.entries(full.items)) {
  const doc = Object.values(docs).find((d) => d.skills?.[info.skill]?.entries?.some((e) => hid(`${info.skill}|${String(e.ko).trim()}`) === item));
  const entries = doc?.skills?.[info.skill]?.entries; const idx = entries?.findIndex((e) => hid(`${info.skill}|${String(e.ko).trim()}`) === item) ?? -1;
  if (idx < 0) { console.error(`entry for ${item} not found`); continue; }
  const p = patched.get(item), g = rev.grades[item];
  let entry = entries[idx];
  if (p?.op === "drop") { entries.splice(idx, 1); dropped++; continue; }
  if (p?.op === "set") { for (const [k, v] of Object.entries(p.set)) { if (v === null) delete entry[k]; else entry[k] = v; } applied++; }
  const id = hid(`${info.skill}|${String(entry.ko).trim()}`);
  ledger.reviewed[id] = { batch: n, verdict: p ? "patched" : "ok", at: when };
  if (id !== item) delete ledger.reviewed[item];
  const claimed = Number(entry.grade ?? info.entry.grade);
  grades.items[id] = { skill: info.skill, packet: full.packet, authorGrade: claimed, reviewerGrade: g.grade, agree: claimed === g.grade, area: entry.area ?? null, std: entry.std ?? null, reviewerStd: g.std ?? null, note: g.note ?? "" };
}
for (const f of files) fs.writeFileSync(path.join(addDir, f), JSON.stringify(docs[f], null, 1) + "\n");
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 1) + "\n");
fs.mkdirSync(path.dirname(gradesPath), { recursive: true });
fs.writeFileSync(gradesPath, JSON.stringify(grades, null, 1) + "\n");
console.log(JSON.stringify({ applied, dropped }));

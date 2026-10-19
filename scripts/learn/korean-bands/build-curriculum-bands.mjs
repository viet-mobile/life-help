#!/usr/bin/env node
// Builds lib/learn/content/korean/curriculum-bands.json (lesson -> curriculum band) from scripts/learn/korean-bands/placement.json,
// the reviewed placement table (ChatGPT draft 2026-10-19 + the user-approved boundary decisions).
//   node scripts/learn/korean-bands/build-curriculum-bands.mjs          write
//   node scripts/learn/korean-bands/build-curriculum-bands.mjs --check  fail when the committed file differs
//
// The bands are DISPLAY / guidance only. K1~K10, lesson ids, question ids and every progress ledger stay as they are; a band is a label
// on a lesson, never a lock (no band must be finished before the next opens). "Introduction" (intro) is not an official grade 0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const src = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/korean-bands/placement.json"), "utf8"));
const bundle = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/korean/korean.json"), "utf8"));
const ORDER = ["intro", "grade-1", "grade-2", "grade-3", "grade-4", "grade-5", "grade-6"];
const lessonIds = bundle.catalog.courses.flatMap((c) => c.units.flatMap((u) => u.lessons.map((l) => l.id)));
const placed = new Map(src.lessons.map((l) => [l.lessonId, l]));
const problems = [];
for (const id of lessonIds) if (!placed.has(id)) problems.push(`lesson without a band: ${id}`);
for (const id of placed.keys()) if (!lessonIds.includes(id)) problems.push(`placement for an unknown lesson: ${id}`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

const lessons = {};
for (const id of lessonIds) {
  const p = placed.get(id);
  lessons[id] = {
    band: p.proposedBand,
    ...(p.boundaryReview ? { boundary: p.boundaryDecision ?? "unreviewed" } : {}),
    ...(p.proposedBand === "grade-5" && /supplement/.test(p.boundaryDecision ?? "") ? { supplement: true } : {}),
  };
}
// the internal course a learner of a band starts in: the lowest course holding at least a quarter of the band's lessons
const levelOf = (id) => id.match(/^korean-(k\d+)-/)[1].toUpperCase();
const start = {};
for (const b of ORDER) {
  const ids = lessonIds.filter((id) => lessons[id].band === b);
  if (!ids.length) continue;
  const count = {};
  for (const id of ids) count[levelOf(id)] = (count[levelOf(id)] ?? 0) + 1;
  start[b] = Object.keys(count).sort((a, c) => Number(a.slice(1)) - Number(c.slice(1))).find((k) => count[k] / ids.length >= 0.25);
}
const out = {
  version: 1,
  note: "Display and guidance labels only: not an official certification, not TOPIK. Placement is an AI-assisted draft with user-approved boundary decisions; no teacher or native-speaker review. Grade 6 has no lessons yet and is not offered.",
  order: ORDER,
  published: ["intro", "grade-1", "grade-2", "grade-3", "grade-4", "grade-5"],
  start,
  lessons,
};
const file = path.join(root, "lib/learn/content/korean/curriculum-bands.json");
const text = JSON.stringify(out, null, 1) + "\n";
if (process.argv.includes("--check")) {
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) { console.error("curriculum-bands.json is out of date"); process.exit(1); }
} else fs.writeFileSync(file, text);
console.log(`curriculum bands: ${lessonIds.length} lessons, start levels ${JSON.stringify(start)}`);

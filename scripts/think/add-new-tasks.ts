// Adds newly authored (and reviewed / repaired) tasks to the data as new extra files, one file per grade batch.
//   npx tsx --tsconfig tsconfig.json scripts/think/add-new-tasks.ts <inputDir> <fileKeyPrefix> <reviewedIds.json> <removeIds.json>
// <inputDir>/*.json = {taskId: task}. Tasks whose id is in removeIds are dropped. A task is written with status "reviewed-ai" ONLY when its
// id is in reviewedIds (its CURRENT text passed an independent blind AI review); every other task is "draft". Output files:
// lib/think/data/extra/<prefix>-<grade>.json (e.g. math-h1-n1). Run `node scripts/think/gen-extra-index.mjs` afterwards.
import fs from "node:fs";
import path from "node:path";
import { validateTask } from "../../lib/think/validate";
import type { ThinkTask } from "../../lib/think/types";

const [dir, prefix, reviewedFile, removeFile] = process.argv.slice(2);
if (!dir || !prefix || !reviewedFile || !removeFile) throw new Error("usage: add-new-tasks.ts <inputDir> <prefix> <reviewedIds.json> <removeIds.json>");
const reviewed = new Set<string>(JSON.parse(fs.readFileSync(reviewedFile, "utf8")));
const remove = new Set<string>(JSON.parse(fs.readFileSync(removeFile, "utf8")));
const all: Record<string, ThinkTask> = {};
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) Object.assign(all, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const byGrade: Record<string, ThinkTask[]> = {};
const problems: string[] = [];
for (const [id, t] of Object.entries(all)) {
  if (remove.has(id)) continue;
  problems.push(...validateTask(t));
  (byGrade[t.grade ?? "x"] ??= []).push({ ...t, status: reviewed.has(id) ? "reviewed-ai" : "draft" } as ThinkTask);
}
if (problems.length) { console.log(problems.join("\n")); throw new Error("validation failed; nothing written"); }
const out = path.resolve(__dirname, "../../lib/think/data/extra");
let n = 0;
for (const [g, list] of Object.entries(byGrade)) {
  list.sort((a, b) => (a.id < b.id ? -1 : 1));
  fs.writeFileSync(path.join(out, `${prefix}-${g.toLowerCase()}-n1.json`), JSON.stringify(list, null, 1));
  n += list.length;
}
console.log(JSON.stringify({ written: n, grades: Object.fromEntries(Object.entries(byGrade).map(([g, l]) => [g, l.length])) }));

// Applies reviewed fixes to the task data and invalidates exactly the translated strings that changed.
//   npx tsx --tsconfig tsconfig.json scripts/think/apply-fixes.ts <fixesDir> <pendingOut.json>
// <fixesDir>/*.json = {taskId: fixedTask | null}  (null = remove the task). Each fixed task must pass validateTask.
// Task data live in lib/think/data/{math,english,korean}.json and lib/think/data/extra/<key>.json; overlays in lib/think/i18n/<lang>/<key>.json
// (taskId -> flat path -> string, see lib/think/flat.ts). Changed or removed flat paths are deleted from every overlay and listed in <pendingOut.json>
// as {taskId: {lang: [paths]}} so only those strings are translated again. A fixed task stays status "draft" until a second blind review passes it.
import fs from "node:fs";
import path from "node:path";
import { flatten } from "../../lib/think/flat";
import { validateTask } from "../../lib/think/validate";
import type { ThinkTask } from "../../lib/think/types";

const root = path.resolve(__dirname, "../..");
const dataDir = path.join(root, "lib/think/data");
const LANGS = ["en", "ja", "ko", "vi", "zh-Hans", "zh-Hant"];
const fileFor = (key: string) => (key.startsWith("pilot-") ? path.join(dataDir, `${key.slice(6)}.json`) : path.join(dataDir, "extra", `${key}.json`));
const keys = fs.readdirSync(path.join(dataDir, "extra")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).concat(["pilot-math", "pilot-english", "pilot-korean"]);

const fixesDir = process.argv[2], pendingOut = process.argv[3];
if (!fixesDir || !pendingOut) throw new Error("usage: apply-fixes.ts <fixesDir> <pendingOut.json>");
const fixes: Record<string, ThinkTask | null> = {};
for (const f of fs.readdirSync(fixesDir).filter((x) => x.endsWith(".json"))) Object.assign(fixes, JSON.parse(fs.readFileSync(path.join(fixesDir, f), "utf8")));

const problems: string[] = [];
for (const [id, t] of Object.entries(fixes)) if (t) { if (t.id !== id) problems.push(`${id}: id mismatch`); problems.push(...validateTask(t)); }
if (problems.length) { console.log(problems.join("\n")); throw new Error(`${problems.length} validation problems, nothing applied`); }

const pending: Record<string, Record<string, string[]>> = {};
const applied = { replaced: 0, removed: 0, missing: [] as string[] };
const left = new Set(Object.keys(fixes));
for (const key of keys) {
  const file = fileFor(key);
  if (!fs.existsSync(file)) continue;
  const list: ThinkTask[] = JSON.parse(fs.readFileSync(file, "utf8"));
  let changed = false;
  const next: ThinkTask[] = [];
  for (const old of list) {
    if (!(old.id in fixes)) { next.push(old); continue; }
    left.delete(old.id);
    const fx = fixes[old.id];
    const before = flatten(old);
    const after = fx ? flatten({ ...old, ...fx }) : {};
    const stale = Object.keys(before).filter((p) => !(p in after) || after[p] !== before[p]).concat(Object.keys(after).filter((p) => !(p in before)));
    const uniq = [...new Set(stale)];
    if (fx) { next.push({ ...old, ...fx, status: "draft" } as ThinkTask); applied.replaced++; } else applied.removed++;
    changed = true;
    for (const lang of LANGS) {
      const of = path.join(root, "lib/think/i18n", lang, `${key}.json`);
      if (!fs.existsSync(of)) continue;
      const ov: Record<string, Record<string, string>> = JSON.parse(fs.readFileSync(of, "utf8"));
      if (!ov[old.id]) continue;
      if (!fx) delete ov[old.id];
      else for (const p of uniq) delete ov[old.id][p];
      fs.writeFileSync(of, JSON.stringify(ov));
      if (fx && uniq.length) ((pending[old.id] ??= {})[lang] ??= []).push(...uniq.filter((p) => p in after));
    }
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(next, null, 1));
}
applied.missing = [...left];
fs.writeFileSync(pendingOut, JSON.stringify(pending));
console.log(JSON.stringify({ ...applied, pendingTasks: Object.keys(pending).length }));

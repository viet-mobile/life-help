// Prepares translation work: splits the learner-facing strings of every task into chunks (~25 tasks) for translators.
//   npx tsx --tsconfig tsconfig.json scripts/think/tr-prepare.ts <outDir>
// Writes <outDir>/src/chunk-NN.json = { chunk, subject, from: "ko"|"en", files: [fileKey...], tasks: [{ id, items: [[idx, text], ...] }] }
// Options: --prefix <idPrefix>  only tasks whose id starts with it (e.g. y-m-);  --size N  tasks per chunk (default 24);  --start N  first chunk number.
// Only strings that need translation are listed (the rest - target-language English / Korean text, formulas - stay as authored).
import fs from "node:fs";
import path from "node:path";
import { FILE_META, TASK_LOADERS } from "../../lib/think/data/files";
import { flatten } from "../../lib/think/flat";
import { baseLang } from "../../lib/think/lang";
import type { Subject } from "../../lib/think/types";

const needs = (subject: Subject, s: string): boolean => {
  if (subject === "korean") return (s.match(/[A-Za-z]{3,}/g) ?? []).length >= 2; // English instruction text; pure Korean is the learning target
  return /[가-힣]/.test(s); // math / english: Korean instruction text; English target text and formulas stay
};

async function main() {
  const out = process.argv[2];
  const arg = (k: string, d: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const prefix = arg("--prefix", ""), size = Number(arg("--size", "24"));
  if (!out) throw new Error("usage: tr-prepare.ts <outDir>");
  fs.mkdirSync(path.join(out, "src"), { recursive: true });
  let n = Number(arg("--start", "1")) - 1;
  for (const subject of ["math", "english", "korean"] as const) {
    const metas = FILE_META.filter((m) => m.subject === subject);
    let cur: { files: string[]; tasks: Array<{ id: string; items: Array<[number, string]> }> } = { files: [], tasks: [] };
    const flush = () => {
      if (!cur.tasks.length) return;
      n++;
      fs.writeFileSync(path.join(out, "src", `chunk-${String(n).padStart(2, "0")}.json`), JSON.stringify({ chunk: n, subject, from: baseLang(subject), files: cur.files, tasks: cur.tasks }));
      cur = { files: [], tasks: [] };
    };
    for (const m of metas) {
      const tasks = await TASK_LOADERS[m.key]();
      cur.files.push(m.key);
      for (const t of tasks) {
        if (prefix && !t.id.startsWith(prefix)) continue;
        const items = Object.values(flatten(t)).map((v, i) => [i, v] as [number, string]).filter(([, v]) => needs(subject, v));
        cur.tasks.push({ id: t.id, items });
      }
      if (cur.tasks.length >= size) flush();
    }
    flush();
  }
  const sizes = fs.readdirSync(path.join(out, "src")).map((f) => `${f}:${(fs.statSync(path.join(out, "src", f)).size / 1024).toFixed(0)}K`);
  console.log(`${n} chunks`, sizes.join(" "));
}
void main();

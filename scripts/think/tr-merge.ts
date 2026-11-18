// Merges translator output into per-file overlays and validates it.
//   npx tsx --tsconfig tsconfig.json scripts/think/tr-merge.ts <workDir> [--langs en,zh-Hans,...]
// Reads <workDir>/src/chunk-NN.json and <workDir>/out/<lang>/chunk-NN.json ({ taskId: { idx: translation } }),
// writes lib/think/i18n/<lang>/<fileKey>.json ({ taskId: { path: translation } }) and prints a report.
import fs from "node:fs";
import path from "node:path";
import { TASK_LOADERS } from "../../lib/think/data/files";
import { flatten } from "../../lib/think/flat";

const work = process.argv[2];
const langArg = process.argv.indexOf("--langs");
const langs = langArg > 0 ? process.argv[langArg + 1].split(",") : ["en", "zh-Hans", "zh-Hant", "ja", "vi"];
const digits = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", ".")).sort().join("|");

async function main() {
  const report: string[] = [];
  for (const lang of langs) {
    const perFile: Record<string, Record<string, Record<string, string>>> = {};
    let have = 0, want = 0, badDigits = 0, hangul = 0, empty = 0;
    for (const f of fs.readdirSync(path.join(work, "src")).sort()) {
      const src = JSON.parse(fs.readFileSync(path.join(work, "src", f), "utf8")) as { subject: string; from: string; files: string[]; tasks: Array<{ id: string; items: Array<[number, string]> }> };
      // a translator may split its output into parts: chunk-NN.json, chunk-NN.part-1.json, ...
      const base = f.replace(/\.json$/, "");
      const langDir = path.join(work, "out", lang);
      const parts = fs.existsSync(langDir) ? fs.readdirSync(langDir).filter((x) => x === f || (x.startsWith(`${base}.part-`) && x.endsWith(".json"))).sort() : [];
      const out: Record<string, Record<string, string>> = {};
      for (const pf of parts) for (const [tid, m] of Object.entries(JSON.parse(fs.readFileSync(path.join(langDir, pf), "utf8")) as Record<string, Record<string, string>>)) out[tid] = { ...(out[tid] ?? {}), ...m };
      for (const key of src.files) {
        const tasks = await TASK_LOADERS[key]();
        for (const t of tasks) {
          const st = src.tasks.find((x) => x.id === t.id);
          if (!st) continue;
          const keys = Object.keys(flatten(t));
          const tr = out[t.id] ?? {};
          const m: Record<string, string> = {};
          for (const [idx, text] of st.items) {
            want++;
            const v = tr[String(idx)];
            if (typeof v !== "string") continue;
            if (!v.trim()) { empty++; continue; }
            if (digits(text) !== digits(v)) badDigits++; // numbers must survive translation
            if (src.subject !== "korean" && /[가-힣]/.test(v) && !/[가-힣]/.test(text.replace(/[^가-힣]/g, "").slice(0, 0))) hangul++;
            m[keys[idx]] = v; have++;
          }
          if (Object.keys(m).length) ((perFile[key] ??= {})[t.id] = m);
        }
      }
    }
    const dir = path.join("lib/think/i18n", lang);
    fs.mkdirSync(dir, { recursive: true });
    for (const [k, v] of Object.entries(perFile)) fs.writeFileSync(path.join(dir, `${k}.json`), JSON.stringify(v));
    report.push(`${lang}: ${have}/${want} strings, files ${Object.keys(perFile).length}, digit-mismatch ${badDigits}, hangul-left ${hangul}, empty ${empty}`);
  }
  console.log(report.join("\n"));
}
void main();

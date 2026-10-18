// Lists exactly the learner-facing strings that still have no translation, per language, and merges finished translations back.
//   npx tsx --tsconfig tsconfig.json scripts/think/tr-gaps.ts out <dir> [--size N]    write <dir>/<lang>-NN.json = {lang, from, items:[{id,path,text}]}
//   npx tsx --tsconfig tsconfig.json scripts/think/tr-gaps.ts merge <dir>             merge <dir>/done/<lang>-NN.json = {"<id>|<path>": translation}
// A string needs a translation when lib/think/flat.ts needsTranslation says so. Source language = the task's authored language
// (math / English tasks: Korean; Korean tasks: English). The English overlay exists for math / English tasks; the Korean overlay for Korean tasks only.
import fs from "node:fs";
import path from "node:path";
import { flatten, needsTranslation } from "../../lib/think/flat";
import { FILE_META, TASK_LOADERS } from "../../lib/think/data/files";
import type { ThinkTask } from "../../lib/think/types";

const root = path.resolve(__dirname, "../..");
const LANGS = ["en", "ja", "ko", "vi", "zh-Hans", "zh-Hant"] as const;
const ovPath = (lang: string, key: string) => path.join(root, "lib/think/i18n", lang, `${key}.json`);
const applies = (lang: string, subject: string) => !(lang === "en" && subject === "korean") && !(lang === "ko" && subject !== "korean");
const [mode, dir] = [process.argv[2], process.argv[3]];
const sizeArg = process.argv.indexOf("--size");
const SIZE = sizeArg > 0 ? Number(process.argv[sizeArg + 1]) : 800;

async function main() {
  if (!dir) throw new Error("usage: tr-gaps.ts out|merge <dir>");
  if (mode === "out") {
    fs.mkdirSync(dir, { recursive: true });
    const per: Record<string, Array<{ id: string; path: string; text: string; ctx: string }>> = {};
    for (const m of FILE_META) {
      const tasks: ThinkTask[] = await TASK_LOADERS[m.key]();
      for (const lang of LANGS) {
        const f = ovPath(lang, m.key);
        const ov: Record<string, Record<string, string>> = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
        for (const t of tasks) {
          if (!applies(lang, t.subject)) continue;
          const flat = flatten(t);
          for (const [p, s] of Object.entries(flat)) {
            if (!needsTranslation(t.subject, s)) continue;
            if (typeof ov[t.id]?.[p] === "string" && ov[t.id][p].trim()) continue;
            (per[lang] ??= []).push({ id: t.id, path: p, text: s, ctx: `${t.subject} ${t.grade ?? ""} ${t.title}`.trim() });
          }
        }
      }
    }
    const summary: Record<string, number> = {};
    for (const [lang, items] of Object.entries(per)) {
      summary[lang] = items.length;
      const chunks = Math.max(1, Math.ceil(items.length / SIZE));
      const each = Math.ceil(items.length / chunks);
      for (let i = 0; i < chunks; i++) fs.writeFileSync(path.join(dir, `${lang}-${String(i + 1).padStart(2, "0")}.json`), JSON.stringify({ lang, items: items.slice(i * each, (i + 1) * each) }));
    }
    console.log(JSON.stringify(summary));
  } else if (mode === "merge") {
    const done = path.join(dir, "done");
    const fileOf = new Map<string, string>();
    for (const m of FILE_META) for (const t of await TASK_LOADERS[m.key]()) fileOf.set(t.id, m.key);
    let n = 0, bad = 0;
    for (const f of fs.readdirSync(done).filter((x) => x.endsWith(".json")).sort()) {
      const lang = f.split("-").slice(0, -1).join("-");
      const tr: Record<string, string> = JSON.parse(fs.readFileSync(path.join(done, f), "utf8"));
      const byFile = new Map<string, Record<string, Record<string, string>>>();
      for (const [k, v] of Object.entries(tr)) {
        const [id, ...rest] = k.split("|"); const p = rest.join("|");
        const key = fileOf.get(id);
        if (!key || typeof v !== "string" || !v.trim()) { bad++; continue; }
        const of = ovPath(lang, key);
        const ov = byFile.get(of) ?? (fs.existsSync(of) ? JSON.parse(fs.readFileSync(of, "utf8")) : {});
        (ov[id] ??= {})[p] = v; byFile.set(of, ov); n++;
      }
      for (const [of, ov] of byFile) fs.writeFileSync(of, JSON.stringify(ov));
    }
    console.log(JSON.stringify({ merged: n, rejected: bad }));
  } else throw new Error("mode must be out or merge");
}
void main();

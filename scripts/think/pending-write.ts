// Rewrites tests/think/translation-pending.json = tasks that exist but have no overlay entry yet, per language (hidden from that language's learners).
//   npx tsx --tsconfig tsconfig.json scripts/think/pending-write.ts
import fs from "node:fs";
import path from "node:path";
import { FILE_META, TASK_LOADERS } from "../../lib/think/data/files";

const root = path.resolve(__dirname, "../..");
const LANGS = ["en", "zh-Hans", "zh-Hant", "ja", "vi", "ko"] as const;
async function main() {
  const out: Record<string, string[]> = Object.fromEntries(LANGS.map((l) => [l, []]));
  for (const m of FILE_META) {
    const tasks = await TASK_LOADERS[m.key]();
    for (const lang of LANGS) {
      const f = path.join(root, "lib/think/i18n", lang, `${m.key}.json`);
      const ov: Record<string, unknown> = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
      for (const t of tasks) {
        if (lang === "en" && t.subject === "korean") continue;
        if (lang === "ko" && t.subject !== "korean") continue;
        if (!ov[t.id]) out[lang].push(t.id);
      }
    }
  }
  for (const l of LANGS) out[l].sort();
  fs.writeFileSync(path.join(root, "tests/think/translation-pending.json"), JSON.stringify(out));
  console.log(JSON.stringify(Object.fromEntries(LANGS.map((l) => [l, out[l].length]))));
}
void main();

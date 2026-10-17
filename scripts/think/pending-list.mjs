// Regenerates tests/think/translation-pending.json: per language, the task ids that have no translation overlay yet.
//   npx tsx --tsconfig tsconfig.json scripts/think/pending-list.mjs
import fs from "node:fs";
import { TASK_LOADERS } from "../../lib/think/data/files";
import { loadOverlay } from "../../lib/think/localize";
const tasks = []; for (const k of Object.keys(TASK_LOADERS)) tasks.push(...(await TASK_LOADERS[k]()));
const out = {};
for (const lang of ["en", "zh-Hans", "zh-Hant", "ja", "vi"]) {
  const ov = await loadOverlay(lang);
  out[lang] = tasks.filter((t) => !(lang === "en" && t.subject === "korean") && !ov[t.id]).map((t) => t.id).sort();
}
fs.writeFileSync("tests/think/translation-pending.json", JSON.stringify(out));
console.log(Object.entries(out).map(([l, v]) => `${l}: ${v.length}`).join("  "));

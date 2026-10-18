// Measures, per subject and display language, how much of what the learner reads is in their language.
//   npx tsx --tsconfig tsconfig.json scripts/think/i18n-audit.ts [--list]
// Strings are classified by their flat path:
//   guide  = instructions, hints, explanations, "what this choice shows", goals, prerequisites, self-checks   -> must be in the learner's language
//   target = material, quoted lines, options, model answers, placeholders (may legitimately be the language being learned)
// For each (subject, language): strings authored in that language, strings supplied by a translation overlay, guide strings that are MISSING
// from the overlay (shown in the authored language instead) and guide strings that still read as Korean although the learner language is not Korean.
import { TASK_LOADERS } from "../../lib/think/data/files";
import { flatten } from "../../lib/think/flat";
import { loadOverlay } from "../../lib/think/localize";
import { baseLang } from "../../lib/think/lang";
import type { ThinkTask } from "../../lib/think/types";

const GUIDE = /^(title|topic|goal|thinking\.|prereq\.|s\.[^.]+\.(prompt|hint\.|explain|acc\.|selfAssess\.|modelNote\.|var\.|ok\.|fail\.|r\.|because\.(prompt|hint\.))|s\.[^.]+\.st\.\d+\.(ask|after|r\.)|s\.[^.]+\.reflect)/;
const hangulShare = (s: string) => { const h = (s.match(/[가-힣]/g) ?? []).length; const o = (s.match(/[A-Za-z぀-ヿ一-鿿À-ỹ]/g) ?? []).length; return h + o ? h / (h + o) : 0; };
/** a string with no word-like text (symbols, digits, a lone variable name) needs no translation */
const needsTranslation = (s: string) => /[가-힣]|[A-Za-z]{2,}/.test(s.replace(/[A-Za-z]\d*\s*[=≈<>]/g, ""));
const LANGS = ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi"] as const;

async function main() {
  const tasks: ThinkTask[] = [];
  for (const k of Object.keys(TASK_LOADERS)) tasks.push(...(await TASK_LOADERS[k]()));
  const rows: string[] = [];
  const list: string[] = [];
  const missingFull: Array<{ subject: string; id: string; path: string; text: string }> = [];
  for (const subject of ["math", "english", "korean"] as const) {
    const ts = tasks.filter((t) => t.subject === subject);
    for (const lang of LANGS) {
      const ov = lang === baseLang(subject) ? {} : await loadOverlay(lang);
      let notNeeded = 0, guide = 0, authored = 0, overlay = 0, missing = 0, korean = 0, tasksMissing = 0;
      for (const t of ts) {
        const flat = flatten(t); let miss = 0;
        const m = ov[t.id] ?? {};
        for (const [path, text] of Object.entries(flat)) {
          if (!GUIDE.test(path) || !text.trim()) continue;
          guide++;
          if (lang === baseLang(subject)) { authored++; if (lang !== "ko" && hangulShare(text) > 0.7) { korean++; list.push(`${lang} ${t.id} ${path}: ${text.slice(0, 60)}`); } continue; }
          const tr = m[path];
          if (typeof tr === "string" && tr.trim()) { overlay++; if (hangulShare(tr) > 0.7) { korean++; list.push(`${lang} ${t.id} ${path}: ${tr.slice(0, 60)}`); } }
          else if (!needsTranslation(text)) { notNeeded++; }
          else { missing++; miss++; if (lang === "vi") { list.push(`MISSING ${lang} ${t.id} ${path}: ${text.slice(0, 50)}`); missingFull.push({ subject, id: t.id, path, text }); } }
        }
        if (miss) tasksMissing++;
      }
      rows.push(`${subject.padEnd(8)} ${lang.padEnd(8)} tasks ${String(ts.length).padStart(4)} guide ${String(guide).padStart(6)} authored ${String(authored).padStart(6)} overlay ${String(overlay).padStart(6)} not-needed ${String(notNeeded).padStart(4)} MISSING ${String(missing).padStart(5)} (tasks ${tasksMissing}) mostly-Korean-guide ${korean}`);
    }
  }
  console.log(rows.join("\n"));
  if (process.argv.includes("--missing-json")) console.log(JSON.stringify(missingFull));
  if (process.argv.includes("--list")) console.log(list.slice(0, 80).join("\n"));
}
void main();

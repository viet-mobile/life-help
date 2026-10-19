// Per-language translation coverage and what a learner of that language is actually served.
//   npx tsx --tsconfig tsconfig.json scripts/learn/translation-coverage.ts [--write]   -> docs/learn/translation-coverage.md
// Counts only. Every translation is an AI translation; nothing here means a native speaker reviewed it.
import fs from "node:fs";
import path from "node:path";
import { ko } from "@/lib/learn/i18n/ko";
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";

const root = process.cwd();
const keys = Object.keys(ko) as (keyof typeof ko)[];
const groups: [string, (k: string) => boolean][] = [
  ["UI (all other)", (k) => !/^(tts\.|modes\.|korean\.official|pron\.)/.test(k)],
  ["TTS & device help", (k) => k.startsWith("tts.")],
  ["review modes", (k) => k.startsWith("modes.")],
  ["official grades", (k) => k.startsWith("korean.official")],
  ["pronunciation help", (k) => k.startsWith("pron.")],
];
const locales = [...LOCALES].filter((l) => l !== "ko");
const rows: string[] = [];
const head = ["lang", ...groups.map(([n]) => n), "korean course Q", "korean bank Q", "english bank Q"];
const total = (g: (k: string) => boolean) => keys.filter((k) => g(k)).length;
rows.push(`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`);
const tot = ["ko (source)", ...groups.map(([, g]) => `${total(g)}/${total(g)}`)];
const served = async (site: "korean" | "english", locale: string) => {
  try { const { bundle } = await loadIndex(site, { locale: locale as never }); return { course: bundle.questions.filter((q) => !q.id.startsWith("kb-") && !q.id.startsWith("eb-")).length, bank: bundle.questions.filter((q) => q.id.startsWith(site === "korean" ? "kb-" : "eb-")).length }; } catch { return { course: -1, bank: -1 }; }
};
async function main() {
const kS = await served("korean", "ko"), eS = await served("english", "ko");
rows.push(`| ${[...tot, kS.course, kS.bank, eS.bank].join(" | ")} |`);
for (const l of locales) {
  const f = path.join(root, "lib/learn/i18n/locales", `${l}.json`);
  const m: Record<string, string> = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  const cells = groups.map(([, g]) => { const ks = keys.filter((k) => g(k)); return `${ks.filter((k) => typeof m[k] === "string" && m[k].trim()).length}/${ks.length}`; });
  const k = await served("korean", l), e = await served("english", l);
  rows.push(`| ${[l, ...cells, k.course, k.bank, e.bank].join(" | ")} |`);
}
const md = `# Translation coverage (generated)\n\nAI translations only; no language has had a native-speaker review. "Q" columns are what \`loadIndex(site, {locale})\` really serves (no silent substitution: a language that lacks a text for a bank form or item does not get that item). The English bank serves every item whose prompt, options, hint 1, and explanation are completely localized and Hangul-free in the learner's language.\n\n${rows.join("\n")}\n`;
if (process.argv.includes("--write")) { fs.mkdirSync("docs/learn", { recursive: true }); fs.writeFileSync("docs/learn/translation-coverage.md", md); }
console.log(md.split("\n").slice(4, 12).join("\n"));
}
main().catch((e) => { console.error(e); process.exit(1); });

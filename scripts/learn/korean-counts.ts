// Korean bank counts, recomputed from the real learner loading path (loadIndex) per language. Nothing is hard-coded.
//   npx tsx --tsconfig tsconfig.json scripts/learn/korean-counts.ts [--write]   -> docs/learn/korean-counts.md
import fs from "node:fs";
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";
import type { Question } from "@/lib/learn/types";

const norm = (s: string) => s.toLowerCase().normalize("NFC").replace(/[\s.,!?'"“”‘’·…\-()]/g, "");
const itemOf = (q: Question) => q.id.match(/^kb-.+-([0-9a-f]{8})-[a-z]+$/)?.[1] ?? q.id;
const answerText = (q: Question): string => {
  const a = q.answer as { kind: string; id?: string; ids?: string[]; accepted?: string[] };
  if (a.kind === "choice") return q.type === "true_false" ? `${q.prompt}|${a.id}` : (q.options?.find((o) => o.id === a.id)?.text ?? "");
  if (a.kind === "text") return (a.accepted ?? []).join("|");
  return (a.ids ?? []).join(",");
};
const stat = (qs: Question[]) => {
  const ids = new Set(qs.map((q) => q.id));
  const nu = new Set(qs.map((q) => norm(`${q.skillId}|${q.target?.text ?? q.audioText ?? q.prompt}|${answerText(q)}`)));
  const items = new Set(qs.map((q) => `${q.skillId}|${itemOf(q)}`));
  const byForm: Record<string, number> = {};
  for (const q of qs) byForm[q.tags?.[2] ?? "?"] = (byForm[q.tags?.[2] ?? "?"] ?? 0) + 1;
  return { ids: ids.size, normalizedUnique: nu.size, items: items.size, byForm };
};
async function main() {
  const rows: string[] = [];
  let ref: ReturnType<typeof stat> | null = null;
  const per: Record<string, { served: number; dict: number }> = {};
  for (const l of [...LOCALES]) {
    const { bundle } = await loadIndex("korean", { locale: l as never });
    const kb = bundle.questions.filter((q) => q.id.startsWith("kb-"));
    per[l] = { served: kb.length, dict: kb.filter((q) => q.tags?.[2] === "dict").length };
    if (l === "en") ref = stat(kb);
  }
  const served = Object.entries(per).filter(([, v]) => v.served > 0);
  const md = `# Korean bank counts (generated from loadIndex per language)\n\nReference language en: ${ref!.ids} question ids, ${ref!.normalizedUnique} normalized-unique (skill + target + answer, spaces/punctuation/case removed), ${ref!.items} independent learning items (a word/sentence/passage asked in several forms is one item).\n\nBy form (format variants of the same items, not independent items): ${Object.entries(ref!.byForm).map(([k, v]) => `${k} ${v}`).join(", ")}.\n\nLanguages that receive the Korean bank: ${served.length} of ${LOCALES.length} (${served.map(([l, v]) => `${l} ${v.served}${v.dict ? `/${v.dict} dict` : ""}`).join(", ")}).\nLanguages with 0: ${Object.entries(per).filter(([, v]) => !v.served).map(([l]) => l).join(", ")}.\n\nAll translations are AI translations; no teacher or native review.\n`;
  if (process.argv.includes("--write")) fs.writeFileSync("docs/learn/korean-counts.md", md);
  console.log(md);
}
main().catch((e) => { console.error(e); process.exit(1); });

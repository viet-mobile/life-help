// Follow-up audit (not part of the release candidate): Korean question forms per grade band and per language scope.
//   npx tsx --tsconfig tsconfig.json scripts/learn/followup/korean-skill-coverage.ts
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";

const AREA: Record<string, string> = { read: "reading", passage: "reading", cloze: "reading", sit: "reading", choose: "reading", meaning: "vocabulary", toko: "vocabulary", fromrr: "vocabulary", tf: "vocabulary", listen: "listening", dict: "writing(dictation)", order: "writing(word order)" };
(async () => {
  const { bundle } = await loadIndex("korean", { locale: "en" });
  const kb = bundle.questions.filter((q) => q.id.startsWith("kb-"));
  const grade = (s: string) => s.split(".")[1];
  const t: Record<string, Record<string, number>> = {};
  for (const q of kb) { const g = grade(q.skillId); const a = AREA[q.tags?.[2] ?? "?"] ?? "other"; (t[g] ??= {})[a] = (t[g][a] ?? 0) + 1; }
  const areas = ["reading", "vocabulary", "listening", "writing(dictation)", "writing(word order)", "speaking", "conversation"];
  console.log(["grade", ...areas].join("\t"));
  for (const g of Object.keys(t).sort()) console.log([g, ...areas.map((a) => t[g][a] ?? 0)].join("\t"));
  const have: string[] = [];
  for (const l of LOCALES) { const r = await loadIndex("korean", { locale: l as never }); if (r.bundle.questions.some((q) => q.id.startsWith("kb-"))) have.push(l); }
  console.log(`\nlocales with the Korean bank: ${have.length}/${LOCALES.length}: ${have.join(",")}`);
  console.log(`locales without: ${LOCALES.filter((l) => !have.includes(l)).join(",")}`);
})();

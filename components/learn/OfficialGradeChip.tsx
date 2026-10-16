import { officialGradeOf } from "@/lib/learn/korean-grades";
import type { Translator } from "@/lib/learn/i18n";

/** "Official level 3~4" next to an internal K level. The title carries the honesty note (AI classification, not teacher/native review, not TOPIK). */
export function OfficialGradeChip({ level, t }: { level: string; t: Translator }) {
  const g = officialGradeOf(level);
  if (!g) return null;
  const [from, to] = g.range;
  const label = from === to ? t("korean.official", { grade: g.primary }) : t("korean.official.range", { from, to });
  return (
    <span className="l-chip" title={t("korean.official.note")} data-testid={`official-${level}`} data-official={g.primary}>
      {label}
    </span>
  );
}

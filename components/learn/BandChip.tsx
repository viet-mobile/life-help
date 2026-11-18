import { bandLabel, bandOfLesson, isSupplement } from "@/lib/learn/korean-bands";
import type { Translator } from "@/lib/learn/i18n";

/** The curriculum band of a Korean lesson ("2급", "입문", ...), with "supplement" for lessons held back from the next level. A label, never a lock. */
export function BandChip({ lessonId, t }: { lessonId: string; t: Translator }) {
  const band = bandOfLesson(lessonId);
  if (!band) return null;
  return (
    <span className="l-chip" title={t("korean.band.note")} data-testid={`band-${lessonId}`} data-band={band}>
      {bandLabel(band, t)}{isSupplement(lessonId) ? ` · ${t("korean.band.supplement")}` : ""}
    </span>
  );
}

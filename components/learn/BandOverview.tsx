"use client";

import { BANDS, bandLabel, bandOfLesson, isPublishedBand, lessonsOfBand, startLevelOfBand } from "@/lib/learn/korean-bands";
import { useLearner } from "./LearnerProvider";

/**
 * study.korean: progress by curriculum band (Introduction + levels 1~6) across all courses. Bands are labels on lessons: nothing here locks or
 * unlocks anything, and level 6 is shown as "in preparation" (it has no lessons yet).
 */
export function BandOverview() {
  const { state, t } = useLearner();
  const done = (id: string) => { const p = state.lessons[id]; return !!p && (p.completions > 0 || p.placedOut); };
  const current = Object.keys(state.lessons).length ? BANDS.find((b) => lessonsOfBand(b).some((id) => !done(id)) && lessonsOfBand(b).length > 0) : undefined;
  return (
    <section className="l-card l-stack" aria-labelledby="band-title" data-testid="band-overview">
      <h2 id="band-title" className="l-h2">{t("korean.band.title")}</h2>
      <ul className="l-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {BANDS.map((b) => {
          const ids = lessonsOfBand(b);
          const n = ids.filter(done).length;
          return (
            <li key={b} data-testid={`band-row-${b}`} data-band={b} data-current={current === b ? "true" : undefined} data-published={isPublishedBand(b) ? "true" : "false"}>
              <strong>{bandLabel(b, t)}</strong>{" "}
              {isPublishedBand(b) ? (
                <span className="l-muted">{t("korean.band.progress", { done: n, total: ids.length })}{startLevelOfBand(b) ? ` · ${t("korean.band.start", { level: t(`grade.${startLevelOfBand(b)}` as never) })}` : ""}</span>
              ) : (
                <span className="l-muted">{t("korean.band.preparing")}</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="l-muted" style={{ fontSize: "0.85rem" }}>{t("korean.band.note")}</p>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useLearner } from "./LearnerProvider";
import { NEEDS_AUDIO, REVIEW_MODES, type ReviewMode } from "@/lib/learn/reviewModes";

/**
 * Review modes hub: the same shared questions, asked in four ways. Each card starts a normal practice session limited to that mode
 * (progress, SRS and rewards are the ordinary ones: a wrong answer, hint or retry earns what it always earns). Modes that need sound say so.
 */
export function ModesPage() {
  const { t, href } = useLearner();
  return (
    <main className="l-stack">
      <h1 className="l-h1">{t("modes.title")}</h1>
      <p className="l-muted">{t("modes.intro")}</p>
      <ul className="l-stack" style={{ listStyle: "none", padding: 0 }}>
        {REVIEW_MODES.map((m: ReviewMode) => (
          <li key={m} className="l-card l-stack">
            <h2 className="l-h2">{t(`modes.${m}`)}</h2>
            <p>{t(`modes.${m}.desc`)}</p>
            {NEEDS_AUDIO.includes(m) && <p className="l-muted">🔊 {t("modes.needsSound")}</p>}
            <Link className="l-btn" href={href(`/practice?kind=practice&mode=${m}`)}>{t("modes.start")}</Link>
          </li>
        ))}
        <li className="l-card l-stack">
          <h2 className="l-h2">{t("modes.cards")}</h2>
          <p>{t("modes.cards.desc")}</p>
          <Link className="l-btn" href={href("/cards")}>{t("modes.start")}</Link>
        </li>
      </ul>
      <p className="l-muted">{t("modes.noSound")}</p>
    </main>
  );
}

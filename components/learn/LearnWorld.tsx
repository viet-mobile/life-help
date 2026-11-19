"use client";

import { BandOverview } from "./BandOverview";
import { CoursePath } from "./CoursePath";
import { LevelUnavailable } from "./LevelUnavailable";
import { SituationalDialoguesHub } from "./SituationalDialoguesHub";
import { useLearner } from "./LearnerProvider";

/** The learning world of THIS student: the courses of their grade (the context's index is already grade-scoped and localised). */
export function LearnWorld() {
  const { index, t, site } = useLearner();
  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <h1 className="l-h1">🗺️ {t("learn.title")}</h1>
      {site === "korean" && <BandOverview />}
      {(site === "korean" || site === "english") && <SituationalDialoguesHub />}
      {index.bundle.catalog.courses.length === 0 && <LevelUnavailable />}
      {index.bundle.catalog.courses.map((c) => (
        <CoursePath key={c.id} course={c} />
      ))}
    </div>
  );
}

"use client";

import { CoursePath } from "./CoursePath";
import { useLearner } from "./LearnerProvider";

/** The learning world of THIS student: the courses of their grade (the context's index is already grade-scoped and localised). */
export function LearnWorld() {
  const { index, t } = useLearner();
  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <h1 className="l-h1">🗺️ {t("learn.title")}</h1>
      {index.bundle.catalog.courses.map((c) => (
        <CoursePath key={c.id} course={c} />
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useLearner } from "./LearnerProvider";

/** Shown instead of an empty course when the learner's level has no published lessons (Korean K7~K10 while they are in review). */
export function LevelUnavailable() {
  const { t, href } = useLearner();
  return (
    <section className="l-card l-stack" role="status" data-testid="level-unavailable">
      <p>ℹ️ {t("onboarding.korean.account_limit")}</p>
      <Link className="l-btn l-btn-block" href={href("/onboarding")}>{t("profile.edit")}</Link>
    </section>
  );
}

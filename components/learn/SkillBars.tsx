"use client";

import { effectiveMastery, masteryLabel } from "@/lib/learn/domain/mastery";
import { useLearner } from "./LearnerProvider";

/** Skill map: bars + a text label (never colour alone) using growth-oriented wording. */
export function SkillBars({ skillIds }: { skillIds?: string[] }) {
  const { index, state, t } = useLearner();
  const now = new Date();
  const ids = skillIds ?? [...index.skills.keys()];
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
      {ids.map((id) => {
        const skill = index.skills.get(id);
        if (!skill) return null;
        const score = Math.round(effectiveMastery(state.mastery[id], now));
        const label = masteryLabel(score);
        return (
          <li key={id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>{skill.title}</span>
              <span>{score}% · {t(`mastery.${label}` as never)}</span>
            </div>
            <div className="l-bar" role="progressbar" aria-label={skill.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
              <span style={{ width: `${score}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { effectiveMastery, masteryLabel } from "@/lib/learn/domain/mastery";
import { useLearner } from "./LearnerProvider";

/** Skill map: bars + a text label (never colour alone) using growth-oriented wording. */
export function SkillBars({ skillIds }: { skillIds?: string[] }) {
  const { index, secondaryIndex, secondaryIndices, secondaryTranslators, isBilingual, state, t, tSecondary } = useLearner();
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
              <div>
                <span>{skill.title}</span>
                {isBilingual && secondaryIndices && secondaryIndices.length > 0 ? (
                  secondaryIndices.map(({ locale: secLoc, index: secIdx }) => {
                    const secTitle = secIdx.skills.get(id)?.title;
                    if (!secTitle || secTitle === skill.title) return null;
                    return (
                      <span key={secLoc} style={{ display: "block", fontSize: "0.85em", fontWeight: 400, opacity: 0.85 }}>
                        {secTitle}
                      </span>
                    );
                  })
                ) : isBilingual && secondaryIndex?.skills.get(id)?.title && secondaryIndex.skills.get(id)!.title !== skill.title ? (
                  <span style={{ display: "block", fontSize: "0.85em", fontWeight: 400, opacity: 0.85 }}>
                    {secondaryIndex.skills.get(id)!.title}
                  </span>
                ) : null}
              </div>
              <div style={{ textAlign: "right" }}>
                <span>{score}% · {t(`mastery.${label}` as never)}</span>
                {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
                  secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                    <span key={secLoc} style={{ display: "block", fontSize: "0.85em", fontWeight: 400, opacity: 0.85 }}>
                      {score}% · {secT(`mastery.${label}` as never)}
                    </span>
                  ))
                ) : isBilingual ? (
                  <span style={{ display: "block", fontSize: "0.85em", fontWeight: 400, opacity: 0.85 }}>
                    {score}% · {tSecondary(`mastery.${label}` as never)}
                  </span>
                ) : null}
              </div>
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

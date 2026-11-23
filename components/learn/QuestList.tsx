"use client";

import Link from "next/link";
import type { DailyQuest, QuestItem } from "@/lib/learn/types";
import { useLearner } from "./LearnerProvider";

export function QuestList({ quest, compact = false }: { quest: DailyQuest; compact?: boolean }) {
  const { t, tSecondary, isBilingual, href, state, index } = useLearner();

  const target = (it: QuestItem): string => {
    if (it.kind === "lesson") {
      const rec = [...index.lessonOrder].find((id) => !(state.lessons[id]?.completions || state.lessons[id]?.placedOut));
      return rec ? href(`/lesson/${rec}`) : href("/learn");
    }
    if (it.kind === "review") return href("/practice?kind=review");
    return href(`/practice?kind=practice&skill=${encodeURIComponent(it.skillId ?? [...index.skills.keys()][0])}`);
  };

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
      {quest.items.map((it) => {
        const done = it.progress >= it.target;
        return (
          <li key={it.id} className={compact ? "" : "l-card"}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontWeight: 700 }}>
              <div>
                <div>
                  <span aria-hidden="true">{done ? "✅" : "⬜"}</span> {t(`quest.item.${it.kind}` as never, { n: it.target })}
                </div>
                {isBilingual && (
                  <div style={{ fontSize: "0.85em", fontWeight: 400, opacity: 0.85, paddingLeft: "1.4rem" }}>
                    {tSecondary(`quest.item.${it.kind}` as never, { n: it.target })}
                  </div>
                )}
              </div>
              <span style={{ textAlign: "right" }}>
                <span>{done ? t("quest.complete") : `${it.progress}/${it.target}`}</span>
                {isBilingual && done && (
                  <span style={{ display: "block", fontSize: "0.85em", fontWeight: 400, opacity: 0.85 }}>
                    {tSecondary("quest.complete")}
                  </span>
                )}
              </span>
            </div>
            <div className="l-bar" role="progressbar" aria-label={t(`quest.item.${it.kind}` as never, { n: it.target })} aria-valuemin={0} aria-valuemax={it.target} aria-valuenow={it.progress}>
              <span style={{ width: `${(it.progress / it.target) * 100}%` }} />
            </div>
            {!compact && !done && (
              <Link className="l-btn l-btn-ghost" style={{ marginTop: 10 }} href={target(it)}>
                <span>{t("quest.go")}</span>
                {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("quest.go")}</span>}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

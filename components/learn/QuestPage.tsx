"use client";

import Link from "next/link";
import { dayKey } from "@/lib/learn/domain/dates";
import { ensureQuest } from "@/lib/learn/domain/quests";
import { weakestSkills } from "@/lib/learn/domain/path";
import { useLearner } from "./LearnerProvider";
import { QuestList } from "./QuestList";

export function QuestPage() {
  const { state, index, t, href } = useLearner();
  const now = new Date();
  const quest = ensureQuest(state, index, dayKey(now), now);
  const weak = weakestSkills(state, index, now, 1)[0];
  return (
    <div className="l-wrap l-stack">
      <h1 className="l-h1">📜 {t("quest.title")}</h1>
      <p className="l-muted">{t("quest.subtitle")}</p>
      <QuestList quest={quest} />
      {quest.completedAt && (
        <div className="l-card l-pop" style={{ background: "var(--l-good-soft)" }} role="status">
          <p><strong>🎉 {t("quest.allDone")}</strong></p>
          <p className="l-muted">{t("quest.more")}</p>
          {weak && <Link className="l-btn l-btn-ghost" href={href(`/practice?kind=practice&skill=${encodeURIComponent(weak.id)}`)}>{t("lesson.begin")}</Link>}
        </div>
      )}
    </div>
  );
}

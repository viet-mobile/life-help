"use client";

import Link from "next/link";
import { levelProgress } from "@/lib/learn/domain/level";
import type { Lesson, PlayerState } from "@/lib/learn/types";
import { useLearner } from "./LearnerProvider";
import { SkillBars } from "./SkillBars";

export interface SessionResult {
  kind: "lesson" | "review" | "practice";
  lessonId: string | null;
  stars: number;
  firstTryCorrect: number;
  total: number;
  xp: number;
  coins: number;
  achievements: string[];
  questCompleted: boolean;
  levelBefore: number;
  finalState: PlayerState | null;
}

export function ResultScreen({ result, nextLesson, onAgain }: { result: SessionResult; nextLesson: Lesson | null; onAgain: () => void }) {
  const { t, href, state, index } = useLearner();
  const level = levelProgress(state.totalXp);
  const leveledUp = level.level > result.levelBefore;
  const lessonSkillIds = result.lessonId ? index.lessons.get(result.lessonId)?.lesson.skillIds : undefined;

  return (
    <div className="l-wrap l-stack" role="region" aria-label={t("result.title.session")}>
      <div className="l-card l-card-accent l-pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }} aria-hidden="true">{result.kind === "lesson" ? "🏆" : "🎯"}</div>
        <h1 className="l-h1">{result.kind === "lesson" ? t("result.title.lesson") : t("result.title.session")}</h1>
        {result.kind === "lesson" && (
          <p aria-label={t("learn.lesson.stars", { n: result.stars })} style={{ fontSize: "2rem" }}>
            {"★".repeat(result.stars)}
            <span style={{ opacity: 0.4 }}>{"★".repeat(3 - result.stars)}</span>
          </p>
        )}
        <p>{t("result.accuracy", { n: result.firstTryCorrect, total: result.total })}</p>
      </div>

      <div className="l-grid l-grid-2">
        <div className="l-card"><div className="l-muted">{t("result.xp")}</div><div className="l-h1">+{result.xp} XP</div></div>
        <div className="l-card"><div className="l-muted">{t("result.coins")}</div><div className="l-h1">🪙 +{result.coins}</div></div>
      </div>

      {leveledUp && (
        <div className="l-card l-pop" style={{ background: "var(--l-gold-soft)", borderColor: "#f0cf7a" }} role="status">
          🎉 <strong>{t("result.levelUp", { level: level.level, title: t(`level.${level.titleKey}` as never) })}</strong>
        </div>
      )}
      {result.achievements.map((code) => (
        <div key={code} className="l-card l-pop" role="status">
          🏅 <strong>{t("result.badge")}</strong> · {t(`ach.${code}.title` as never)}
        </div>
      ))}
      {state.streak.current > 0 && <div className="l-card">{t("result.streak", { n: state.streak.current })}</div>}
      {result.questCompleted && <div className="l-card" style={{ background: "var(--l-good-soft)" }} role="status">📜 {t("result.quest")}</div>}

      {lessonSkillIds && (
        <section className="l-card l-stack">
          <h2 className="l-h2">{t("result.mastery")}</h2>
          <SkillBars skillIds={lessonSkillIds} />
        </section>
      )}

      <div className="l-stack">
        {result.kind === "lesson" && nextLesson ? (
          <Link className="l-btn l-btn-block" href={href(`/lesson/${nextLesson.id}`)}>
            ▶ {t("result.next", { title: nextLesson.title })}
          </Link>
        ) : result.kind === "lesson" ? (
          <p className="l-muted">{t("result.noNext")}</p>
        ) : null}
        <Link className="l-btn l-btn-ghost l-btn-block" href={href("/quest")}>📜 {t("nav.quest")}</Link>
        <button className="l-btn l-btn-ghost l-btn-block" onClick={onAgain}>{t("result.again")}</button>
        <Link className="l-link" href={href("/dashboard")}>{t("result.home")}</Link>
      </div>
    </div>
  );
}

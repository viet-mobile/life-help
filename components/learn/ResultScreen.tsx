"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEnterToContinue } from "./useEnterToContinue";
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
  const { t, tSecondary, isBilingual, href, state, index, secondaryIndex } = useLearner();
  const router = useRouter();
  useEnterToContinue(result.kind === "lesson" && !!nextLesson, () => { if (nextLesson) router.push(href(`/lesson/${nextLesson.id}`)); });
  const level = levelProgress(state.totalXp);
  const leveledUp = level.level > result.levelBefore;
  const lessonSkillIds = result.lessonId ? index.lessons.get(result.lessonId)?.lesson.skillIds : undefined;

  return (
    <div className="l-wrap l-stack" role="region" aria-label={t("result.title.session")}>
      <div className="l-card l-card-accent l-pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }} aria-hidden="true">{result.kind === "lesson" ? "🏆" : "🎯"}</div>
        <h1 className="l-h1">
          <div>{result.kind === "lesson" ? t("result.title.lesson") : t("result.title.session")}</div>
          {isBilingual && (
            <div style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.85, marginTop: "0.25rem" }}>
              {result.kind === "lesson" ? tSecondary("result.title.lesson") : tSecondary("result.title.session")}
            </div>
          )}
        </h1>
        {result.kind === "lesson" && (
          <p aria-label={t("learn.lesson.stars", { n: result.stars })} style={{ fontSize: "2rem" }}>
            {"★".repeat(result.stars)}
            <span style={{ opacity: 0.4 }}>{"★".repeat(3 - result.stars)}</span>
          </p>
        )}
        <p>
          <span>{t("result.accuracy", { n: result.firstTryCorrect, total: result.total })}</span>
          {isBilingual && (
            <span style={{ display: "block", fontSize: "0.85em", opacity: 0.85, marginTop: "0.15rem" }}>
              {tSecondary("result.accuracy", { n: result.firstTryCorrect, total: result.total })}
            </span>
          )}
        </p>
      </div>

      <div className="l-grid l-grid-2">
        <div className="l-card">
          <div className="l-muted">
            {t("result.xp")}
            {isBilingual && <span style={{ marginLeft: "0.3rem", opacity: 0.85 }}>({tSecondary("result.xp")})</span>}
          </div>
          <div className="l-h1">+{result.xp} XP</div>
        </div>
        <div className="l-card">
          <div className="l-muted">
            {t("result.coins")}
            {isBilingual && <span style={{ marginLeft: "0.3rem", opacity: 0.85 }}>({tSecondary("result.coins")})</span>}
          </div>
          <div className="l-h1">🪙 +{result.coins}</div>
        </div>
      </div>

      {leveledUp && (
        <div className="l-card l-pop" style={{ background: "var(--l-gold-soft)", borderColor: "#f0cf7a" }} role="status">
          <div>🎉 <strong>{t("result.levelUp", { level: level.level, title: t(`level.${level.titleKey}` as never) })}</strong></div>
          {isBilingual && (
            <div style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "0.15rem" }}>
              🎉 {tSecondary("result.levelUp", { level: level.level, title: tSecondary(`level.${level.titleKey}` as never) })}
            </div>
          )}
        </div>
      )}
      {result.achievements.map((code) => (
        <div key={code} className="l-card l-pop" role="status">
          <div>🏅 <strong>{t("result.badge")}</strong> · {t(`ach.${code}.title` as never)}</div>
          {isBilingual && (
            <div style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "0.15rem" }}>
              🏅 {tSecondary("result.badge")} · {tSecondary(`ach.${code}.title` as never)}
            </div>
          )}
        </div>
      ))}
      {state.streak.current > 0 && (
        <div className="l-card">
          <div>{t("result.streak", { n: state.streak.current })}</div>
          {isBilingual && (
            <div style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "0.15rem" }}>
              {tSecondary("result.streak", { n: state.streak.current })}
            </div>
          )}
        </div>
      )}
      {result.questCompleted && (
        <div className="l-card" style={{ background: "var(--l-good-soft)" }} role="status">
          <div>📜 {t("result.quest")}</div>
          {isBilingual && (
            <div style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "0.15rem" }}>
              📜 {tSecondary("result.quest")}
            </div>
          )}
        </div>
      )}

      {lessonSkillIds && (
        <section className="l-card l-stack">
          <h2 className="l-h2">
            <span>{t("result.mastery")}</span>
            {isBilingual && <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("result.mastery")})</span>}
          </h2>
          <SkillBars skillIds={lessonSkillIds} />
        </section>
      )}

      <div className="l-stack">
        {result.kind === "lesson" && nextLesson ? (
          <Link className="l-btn l-btn-block" href={href(`/lesson/${nextLesson.id}`)}>
            <span className="l-arrow">▶</span> {t("result.next", { title: nextLesson.title })}
            {isBilingual && secondaryIndex?.lessons.get(nextLesson.id) && (
              <span style={{ display: "block", fontSize: "0.85em", opacity: 0.85, marginTop: "0.15rem" }}>
                {tSecondary("result.next", { title: secondaryIndex.lessons.get(nextLesson.id)?.lesson.title ?? nextLesson.title })}
              </span>
            )}
          </Link>
        ) : result.kind === "lesson" ? (
          <p className="l-muted">{t("result.noNext")}</p>
        ) : null}
        <Link className="l-btn l-btn-ghost l-btn-block" href={href("/quest")}>
          <span>📜 {t("nav.quest")}</span>
          {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("nav.quest")}</span>}
        </Link>
        <button className="l-btn l-btn-ghost l-btn-block" onClick={onAgain}>
          <span>{t("result.again")}</span>
          {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("result.again")}</span>}
        </button>
        <Link className="l-link" href={href("/dashboard")}>
          <span>{t("result.home")}</span>
          {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("result.home")}</span>}
        </Link>
      </div>
    </div>
  );
}

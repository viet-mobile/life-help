"use client";

import Link from "next/link";
import { ACHIEVEMENTS } from "@/lib/learn/domain/achievements";
import { dayKey } from "@/lib/learn/domain/dates";
import { levelProgress } from "@/lib/learn/domain/level";
import { recommendNext, weakestSkills } from "@/lib/learn/domain/path";
import { ensureQuest } from "@/lib/learn/domain/quests";
import { displayStreak } from "@/lib/learn/domain/streak";
import { avatarEmoji } from "@/lib/learn/avatars";
import { useLearner } from "./LearnerProvider";
import { QuestList } from "./QuestList";
import { SkillBars } from "./SkillBars";

export function Dashboard() {
  const { state, index, t, href, mode, accountsEnabled, site } = useLearner();
  const now = new Date();
  const level = levelProgress(state.totalXp);
  const rec = recommendNext(state, index, now);
  const quest = ensureQuest(state, index, dayKey(now), now);
  const streak = displayStreak(state.streak, dayKey(now));
  const weak = weakestSkills(state, index, now, 1)[0];
  const lastBadge = state.achievements[state.achievements.length - 1];
  const badgeDef = ACHIEVEMENTS.find((a) => a.code === lastBadge);

  let ctaLabel = t("dash.continue.done");
  let ctaHref = href(weak ? `/practice?kind=practice&skill=${encodeURIComponent(weak.id)}` : "/learn");
  if (rec.kind === "lesson") {
    ctaLabel = t("dash.continue.lesson", { title: index.lessons.get(rec.lessonId)?.lesson.title ?? "" });
    ctaHref = href(`/lesson/${rec.lessonId}`);
  } else if (rec.kind === "review") {
    ctaLabel = t("dash.continue.review");
    ctaHref = href("/practice?kind=review");
  } else if (rec.kind === "practice") {
    ctaLabel = t("dash.continue.practice", { title: index.skills.get(rec.skillId)?.title ?? "" });
    ctaHref = href(`/practice?kind=practice&skill=${encodeURIComponent(rec.skillId)}`);
  }

  const questDone = !!quest.completedAt;
  const recommended = weak ? index.skills.get(weak.id) : null;
  const practicedSkillIds = Object.keys(state.mastery);

  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <h1 className="l-h1">
        <span aria-hidden="true">{avatarEmoji(state.profile?.avatar)}</span> {t("dash.hello", { name: state.profile?.nickname ?? "" })}
      </h1>

      <section className="l-card l-card-accent l-stack" aria-labelledby="cta-h">
        <h2 id="cta-h" className="l-h2">{t("dash.continue")}</h2>
        <p>{ctaLabel}</p>
        <Link className="l-btn l-btn-light l-btn-block" href={ctaHref}>▶ {t("dash.continue")}</Link>
      </section>

      {!state.diagnosticDone && (
        <Link className="l-card" href={href("/diagnostic")} style={{ textDecoration: "none", color: "inherit", display: "block", borderColor: "var(--l-accent)" }}>
          🧭 <strong>{t("dash.diagnostic.cta")}</strong>
        </Link>
      )}

      <div className="l-grid l-grid-2">
        <section className="l-card l-stack" aria-labelledby="lv-h">
          <h2 id="lv-h" className="l-h2">{t("dash.level")} {level.level} · {t(`level.${level.titleKey}` as never)}</h2>
          <div className="l-bar l-bar-gold" role="progressbar" aria-label="XP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.ratio * 100)}>
            <span style={{ width: `${level.ratio * 100}%` }} />
          </div>
          <p className="l-muted">{state.totalXp} XP · {level.isMax ? t("dash.maxLevel") : t("dash.toNext", { n: level.xpForNext - level.xpIntoLevel })}</p>
          <p><strong>🔥 {streak > 0 ? t("dash.streak", { n: streak }) : t("dash.streak.none")}</strong>
            {state.streak.freezes > 0 && <span className="l-muted"> · ❄️ {t("dash.streak.freeze", { n: state.streak.freezes })}</span>}</p>
        </section>

        <section className="l-card l-stack" aria-labelledby="q-h">
          <h2 id="q-h" className="l-h2">📜 {t("dash.quest")}</h2>
          <QuestList quest={quest} compact />
          <Link className="l-btn l-btn-block" href={href("/quest")}>{questDone ? t("dash.quest.done") : t("dash.quest.start")}</Link>
        </section>

        {site === "english" && (
          <section className="l-card l-stack" aria-labelledby="w-h">
            <h2 id="w-h" className="l-h2">📇 {t("words.title")}</h2>
            <Link className="l-btn l-btn-ghost l-btn-block" data-testid="words-link" href={href("/words")}>{t("words.open")}</Link>
          </section>
        )}
      </div>

      <section className="l-card l-stack" aria-labelledby="sk-h">
        <h2 id="sk-h" className="l-h2">{t("dash.skills")}</h2>
        {practicedSkillIds.length === 0 ? <p className="l-muted">{t("dash.skills.empty")}</p> : null}
        <SkillBars />
      </section>

      <div className="l-grid l-grid-2">
        <section className="l-card l-stack" aria-labelledby="rc-h">
          <h2 id="rc-h" className="l-h2">🎖️ {t("dash.recent")}</h2>
          {badgeDef ? (
            <p><span aria-hidden="true" style={{ fontSize: "1.6rem" }}>{badgeDef.emoji}</span> <strong>{t(`ach.${badgeDef.code}.title` as never)}</strong></p>
          ) : (
            <p className="l-muted">{t("dash.recent.empty")}</p>
          )}
        </section>
        {recommended && (
          <section className="l-card l-stack" aria-labelledby="rec-h">
            <h2 id="rec-h" className="l-h2">✨ {t("dash.recommended")}</h2>
            <p>{recommended.title}</p>
            <Link className="l-btn l-btn-ghost l-btn-block" href={href(`/practice?kind=practice&skill=${encodeURIComponent(recommended.id)}`)}>{t("lesson.begin")}</Link>
          </section>
        )}
      </div>

      {mode === "guest" && (
        <section className="l-card l-stack">
          <p className="l-muted">{t("dash.guest")}</p>
          {accountsEnabled && <Link className="l-btn l-btn-ghost" href={href("/login")}>{t("dash.guest.cta")}</Link>}
        </section>
      )}
    </div>
  );
}

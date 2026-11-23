"use client";

import Link from "next/link";
import { ACHIEVEMENTS } from "@/lib/learn/domain/achievements";
import { dayKey } from "@/lib/learn/domain/dates";
import { levelProgress } from "@/lib/learn/domain/level";
import { recommendNext, weakestSkills } from "@/lib/learn/domain/path";
import { BandChip } from "./BandChip";
import { ensureQuest } from "@/lib/learn/domain/quests";
import { displayStreak } from "@/lib/learn/domain/streak";
import { avatarEmoji } from "@/lib/learn/avatars";
import { useLearner } from "./LearnerProvider";
import { LevelUnavailable } from "./LevelUnavailable";
import { thinkLangFor } from "@/lib/think/lang";
import { hubLabels } from "@/components/think/hubLabels";
import { CADENCE_TEXT, getCadenceString } from "@/lib/think/cadence";
import { flowView } from "@/lib/think/flow";
import { ThinkQuickEntry } from "../think/ThinkQuickEntry";
import { coverageFor, hasGap } from "@/lib/learn/coverage";
import { readLedger } from "../think/ThinkOffer";
import { QuestList } from "./QuestList";
import { SkillBars } from "./SkillBars";
import { MathMotionEntry } from "./MathMotion";

export function Dashboard() {
  const { state, index, t, href, mode, accountsEnabled, site, locale, secondaryIndex, secondaryIndices, secondaryTranslators, secondaryLocales, tSecondary, isBilingual } = useLearner();
  const thinkLang = thinkLangFor(locale, site);
  const thinkText = hubLabels(t);
  const cadence = flowView(readLedger(site)); // counted per distinct solved / revealed question, retries never count (lib/think/flow.ts)
  const coverage = coverageFor(site, locale);
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

  let secCtaLabel = isBilingual ? tSecondary("dash.continue.done") : "";
  if (isBilingual) {
    if (rec.kind === "lesson") {
      secCtaLabel = tSecondary("dash.continue.lesson", { title: secondaryIndex?.lessons.get(rec.lessonId)?.lesson.title ?? "" });
    } else if (rec.kind === "review") {
      secCtaLabel = tSecondary("dash.continue.review");
    } else if (rec.kind === "practice") {
      secCtaLabel = tSecondary("dash.continue.practice", { title: secondaryIndex?.skills.get(rec.skillId)?.title ?? "" });
    }
  }

  const questDone = !!quest.completedAt;
  const recommended = weak ? index.skills.get(weak.id) : null;
  const practicedSkillIds = Object.keys(state.mastery);

  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <h1 className="l-h1">
        <div>
          <span aria-hidden="true">{avatarEmoji(state.profile?.avatar)}</span> {t("dash.hello", { name: state.profile?.nickname ?? "" })}
        </div>
        {isBilingual && (
          <div style={{ fontSize: "0.65em", fontWeight: 400, opacity: 0.85, marginTop: "0.2rem" }}>
            {tSecondary("dash.hello", { name: state.profile?.nickname ?? "" })}
          </div>
        )}
      </h1>

      {index.lessons.size === 0 && <LevelUnavailable />}

      <section className="l-card l-card-accent l-stack" aria-labelledby="cta-h">
        <h2 id="cta-h" className="l-h2">
          <span>{t("dash.continue")}</span>
          {isBilingual && <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("dash.continue")})</span>}
        </h2>
        <p>
          <span>{ctaLabel}</span>
          {isBilingual && secCtaLabel && (
            <span style={{ display: "block", fontSize: "0.9em", opacity: 0.85, marginTop: "0.2rem" }}>
              {secCtaLabel}
            </span>
          )}
          {site === "korean" && rec.kind === "lesson" && <> <BandChip lessonId={rec.lessonId} t={t} /></>}
        </p>
        <Link className="l-btn l-btn-light l-btn-block" href={ctaHref}>
          <span className="l-arrow">▶</span> {t("dash.continue")}
          {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("dash.continue")}</span>}
        </Link>
        <Link className="l-btn l-btn-ghost l-btn-block" href={href("/modes")}>
          <span>{t("modes.title")}</span>
          {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("modes.title")}</span>}
        </Link>
      </section>

      {hasGap(coverage) && <div className="l-panel l-panel-hint" role="note" data-testid="coverage-notice">{t("dash.coverage", { served: coverage.served.toLocaleString(locale), total: coverage.total.toLocaleString(locale) })}</div>}

      <Link className="l-card l-stack" data-testid="think-card" href={href("/think")} style={{ textDecoration: "none", color: "inherit" }}>
        <h2 className="l-h2">
          <span>🧠 {thinkText.title}</span>
          {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
            <span key={secLoc} style={{ display: "block", fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginTop: "0.2rem" }}>
              🧠 {hubLabels(secT).title}
            </span>
          ))}
        </h2>
        <p className="l-muted">
          <span>{thinkText.intro}</span>
          {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
            <span key={secLoc} style={{ display: "block", fontSize: "0.85em", opacity: 0.85, marginTop: "0.2rem" }}>
              {hubLabels(secT).intro}
            </span>
          ))}
        </p>
        <p data-testid="think-cadence" style={cadence.owed > 0 ? { fontWeight: 600 } : undefined} className={cadence.owed > 0 ? undefined : "l-muted"}>
          <span>{getCadenceString(thinkLang, cadence.owed > 0 ? cadence.owed : cadence.toNext, cadence.owed > 0)}</span>
          {isBilingual && secondaryLocales && secondaryLocales.map((secLoc) => {
            if (secLoc === locale) return null;
            return (
              <span key={secLoc} style={{ display: "block", fontSize: "0.85em", opacity: 0.85, marginTop: "0.2rem" }}>
                {getCadenceString(secLoc, cadence.owed > 0 ? cadence.owed : cadence.toNext, cadence.owed > 0)}
              </span>
            );
          })}
        </p>
        <span className="l-btn l-btn-ghost l-btn-block">
          <span>{thinkText.tryOne}</span>
          {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
            <span key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>
              · {hubLabels(secT).tryOne}
            </span>
          ))}
        </span>
      </Link>

      <ThinkQuickEntry />
      {site === "math" && <MathMotionEntry />}

      {!state.diagnosticDone && (
        <Link className="l-card" href={href("/diagnostic")} style={{ textDecoration: "none", color: "inherit", display: "block", borderColor: "var(--l-accent)" }}>
          <div>🧭 <strong>{t("dash.diagnostic.cta")}</strong></div>
          {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
            <div key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "0.2rem" }}>
              🧭 <strong>{secT("dash.diagnostic.cta")}</strong>
            </div>
          ))}
        </Link>
      )}

      <div className="l-grid l-grid-2">
        <section className="l-card l-stack" aria-labelledby="lv-h">
          <h2 id="lv-h" className="l-h2">
            <div>{t("dash.level")} {level.level} · {t(`level.${level.titleKey}` as never)}</div>
            {isBilingual && (
              <div style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.85, marginTop: "0.15rem" }}>
                {tSecondary("dash.level")} {level.level} · {tSecondary(`level.${level.titleKey}` as never)}
              </div>
            )}
          </h2>
          <div className="l-bar l-bar-gold" role="progressbar" aria-label="XP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.ratio * 100)}>
            <span style={{ width: `${level.ratio * 100}%` }} />
          </div>
          <p className="l-muted">{state.totalXp} XP · {level.isMax ? t("dash.maxLevel") : t("dash.toNext", { n: level.xpForNext - level.xpIntoLevel })}</p>
          {isBilingual && (
            <p className="l-muted" style={{ fontSize: "0.85em", marginTop: "-0.25rem" }}>
              {state.totalXp} XP · {level.isMax ? tSecondary("dash.maxLevel") : tSecondary("dash.toNext", { n: level.xpForNext - level.xpIntoLevel })}
            </p>
          )}
          <p>
            <strong>🔥 {streak > 0 ? t("dash.streak", { n: streak }) : t("dash.streak.none")}</strong>
            {isBilingual && (
              <span style={{ display: "block", fontSize: "0.85em", opacity: 0.85, fontWeight: 400 }}>
                🔥 {streak > 0 ? tSecondary("dash.streak", { n: streak }) : tSecondary("dash.streak.none")}
              </span>
            )}
            {state.streak.freezes > 0 && <span className="l-muted"> · ❄️ {t("dash.streak.freeze", { n: state.streak.freezes })}</span>}
          </p>
        </section>

        <section className="l-card l-stack" aria-labelledby="q-h">
          <h2 id="q-h" className="l-h2">
            <span>📜 {t("dash.quest")}</span>
            {isBilingual && <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("dash.quest")})</span>}
          </h2>
          <QuestList quest={quest} compact />
          <Link className="l-btn l-btn-block" href={href("/quest")}>
            <span>{questDone ? t("dash.quest.done") : t("dash.quest.start")}</span>
            {isBilingual && (
              <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>
                · {tSecondary(questDone ? "dash.quest.done" : "dash.quest.start")}
              </span>
            )}
          </Link>
        </section>

        {site === "english" && (
          <section className="l-card l-stack" aria-labelledby="w-h">
            <h2 id="w-h" className="l-h2">
              <span>📇 {t("words.title")}</span>
              {isBilingual && <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("words.title")})</span>}
            </h2>
            <Link className="l-btn l-btn-ghost l-btn-block" data-testid="words-link" href={href("/words")}>
              <span>{t("words.open")}</span>
              {isBilingual && <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("words.open")}</span>}
            </Link>
          </section>
        )}
      </div>

      <section className="l-card l-stack" aria-labelledby="sk-h">
        <h2 id="sk-h" className="l-h2">
          <span>{t("dash.skills")}</span>
          {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
            secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
              <span key={secLoc} style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>
                ({secT("dash.skills")})
              </span>
            ))
          ) : isBilingual ? (
            <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("dash.skills")})</span>
          ) : null}
        </h2>
        {practicedSkillIds.length === 0 ? (
          <div>
            <p className="l-muted">{t("dash.skills.empty")}</p>
            {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
              <p key={secLoc} className="l-muted" style={{ fontSize: "0.85em", marginTop: "-0.25rem" }}>
                {secT("dash.skills.empty")}
              </p>
            ))}
          </div>
        ) : null}
        <SkillBars />
      </section>

      <div className="l-grid l-grid-2">
        <section className="l-card l-stack" aria-labelledby="rc-h">
          <h2 id="rc-h" className="l-h2">
            <span>🎖️ {t("dash.recent")}</span>
            {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
              secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                <span key={secLoc} style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>
                  ({secT("dash.recent")})
                </span>
              ))
            ) : isBilingual ? (
              <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("dash.recent")})</span>
            ) : null}
          </h2>
          {badgeDef ? (
            <div>
              <p><span aria-hidden="true" style={{ fontSize: "1.6rem" }}>{badgeDef.emoji}</span> <strong>{t(`ach.${badgeDef.code}.title` as never)}</strong></p>
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
                secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                  <p key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85 }}><strong>{secT(`ach.${badgeDef.code}.title` as never)}</strong></p>
                ))
              ) : isBilingual ? (
                <p style={{ fontSize: "0.85em", opacity: 0.85 }}><strong>{tSecondary(`ach.${badgeDef.code}.title` as never)}</strong></p>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="l-muted">{t("dash.recent.empty")}</p>
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
                secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                  <p key={secLoc} className="l-muted" style={{ fontSize: "0.85em" }}>{secT("dash.recent.empty")}</p>
                ))
              ) : isBilingual ? (
                <p className="l-muted" style={{ fontSize: "0.85em" }}>{tSecondary("dash.recent.empty")}</p>
              ) : null}
            </div>
          )}
        </section>
        {recommended && (
          <section className="l-card l-stack" aria-labelledby="rec-h">
            <h2 id="rec-h" className="l-h2">
              <span>✨ {t("dash.recommended")}</span>
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
                secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                  <span key={secLoc} style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>
                    ({secT("dash.recommended")})
                  </span>
                ))
              ) : isBilingual ? (
                <span style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>({tSecondary("dash.recommended")})</span>
              ) : null}
            </h2>
            <p>{recommended.title}</p>
            {isBilingual && secondaryIndices && secondaryIndices.length > 0 ? (
              secondaryIndices.map(({ locale: secLoc, index: secIdx }) => {
                const secTitle = secIdx.skills.get(recommended.id)?.title;
                if (!secTitle || secTitle === recommended.title) return null;
                return (
                  <p key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "-0.25rem" }}>{secTitle}</p>
                );
              })
            ) : isBilingual && secondaryIndex?.skills.get(recommended.id) ? (
              <p style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "-0.25rem" }}>{secondaryIndex.skills.get(recommended.id)?.title}</p>
            ) : null}
            <Link className="l-btn l-btn-ghost l-btn-block" href={href(`/practice?kind=practice&skill=${encodeURIComponent(recommended.id)}`)}>
              <span>{t("lesson.begin")}</span>
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
                secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                  <span key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {secT("lesson.begin")}</span>
                ))
              ) : isBilingual ? (
                <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("lesson.begin")}</span>
              ) : null}
            </Link>
          </section>
        )}
      </div>

      {mode === "guest" && (
        <section className="l-card l-stack">
          <p className="l-muted">{t("dash.guest")}</p>
          {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
            secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
              <p key={secLoc} className="l-muted" style={{ fontSize: "0.85em", marginTop: "-0.25rem" }}>{secT("dash.guest")}</p>
            ))
          ) : isBilingual ? (
            <p className="l-muted" style={{ fontSize: "0.85em", marginTop: "-0.25rem" }}>{tSecondary("dash.guest")}</p>
          ) : null}
          {accountsEnabled && (
            <Link className="l-btn l-btn-ghost" href={href("/login")}>
              <span>{t("dash.guest.cta")}</span>
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 ? (
                secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
                  <span key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {secT("dash.guest.cta")}</span>
                ))
              ) : isBilingual ? (
                <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>· {tSecondary("dash.guest.cta")}</span>
              ) : null}
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

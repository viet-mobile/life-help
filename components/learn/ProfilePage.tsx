"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ACHIEVEMENTS } from "@/lib/learn/domain/achievements";
import { levelProgress } from "@/lib/learn/domain/level";
import { avatarEmoji } from "@/lib/learn/avatars";
import { useLearner } from "./LearnerProvider";

export function ProfilePage({ signOutAction }: { signOutAction?: () => Promise<void> }) {
  const { state, t, href, mode, accountsEnabled, resetGuest } = useLearner();
  const [pending, start] = useTransition();
  const level = levelProgress(state.totalXp);
  const c = state.counters;
  return (
    <div className="l-wrap l-stack">
      <div className="l-card l-card-accent" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.4rem" }} aria-hidden="true">{avatarEmoji(state.profile?.avatar)}</div>
        <h1 className="l-h1">{state.profile?.nickname}</h1>
        <p>{state.profile && `${t(`grade.${state.profile.grade}` as never)} · ${t(`goal.${state.profile.goal}` as never)}`}</p>
        <p>{t("profile.level", { level: level.level, title: t(`level.${level.titleKey}` as never) })} · {state.totalXp} XP</p>
        <Link className="l-link" style={{ color: "#fff" }} href={href("/onboarding")}>{t("profile.edit")}</Link>
      </div>

      <section className="l-card l-stack" aria-labelledby="st-h">
        <h2 id="st-h" className="l-h2">{t("profile.stats")}</h2>
        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: 0 }}>
          {[
            [t("profile.stat.solved"), c.questionsSolved],
            [t("profile.stat.correct"), c.correctAnswers],
            [t("profile.stat.lessons"), c.lessonsCompleted],
            [t("profile.stat.bestStreak"), state.streak.best],
          ].map(([label, val]) => (
            <div key={String(label)}><dt className="l-muted">{label}</dt><dd style={{ margin: 0, fontWeight: 900, fontSize: "1.4rem" }}>{val}</dd></div>
          ))}
        </dl>
      </section>

      <section className="l-card l-stack" aria-labelledby="ach-h">
        <h2 id="ach-h" className="l-h2">{t("profile.achievements")}</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {ACHIEVEMENTS.map((a) => {
            const earned = state.achievements.includes(a.code);
            return (
              <li key={a.code} style={{ display: "flex", gap: 12, alignItems: "center", opacity: earned ? 1 : 0.55 }}>
                <span style={{ fontSize: "1.6rem" }} aria-hidden="true">{earned ? a.emoji : "🔒"}</span>
                <span>
                  <strong>{t(`ach.${a.code}.title` as never)}</strong>
                  <br />
                  <span className="l-muted">{t(`ach.${a.code}.desc` as never)}</span>
                  <span className="l-sr">{earned ? t("common.correct") : ""}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="l-card l-stack" aria-labelledby="ac-h">
        <h2 id="ac-h" className="l-h2">{t("profile.account")}</h2>
        <p>{mode === "guest" ? t("profile.account.guest") : t("profile.account.user")}</p>
        {mode === "guest" ? (
          <>
            {accountsEnabled && <Link className="l-btn l-btn-block" href={href("/login")}>{t("profile.login")}</Link>}
            <button className="l-btn l-btn-ghost l-btn-block" onClick={() => window.confirm(t("profile.reset.confirm")) && resetGuest()}>{t("profile.reset")}</button>
          </>
        ) : (
          signOutAction && (
            <button className="l-btn l-btn-ghost l-btn-block" disabled={pending} onClick={() => start(() => signOutAction())}>{t("profile.logout")}</button>
          )
        )}
        <p className="l-muted">{t("profile.privacy")}</p>
      </section>
    </div>
  );
}

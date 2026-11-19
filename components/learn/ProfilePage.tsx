"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ACHIEVEMENTS } from "@/lib/learn/domain/achievements";
import { levelProgress } from "@/lib/learn/domain/level";
import { avatarEmoji } from "@/lib/learn/avatars";
import { OfficialGradeChip } from "./OfficialGradeChip";
import { TtsSettingsPanel } from "./TtsSettings";
import { useLearner } from "./LearnerProvider";
import { learnConfig } from "@/lib/learn/config";

export function ProfilePage({
  signOutAction,
  deleteAccountAction,
  signupEnabled = false,
}: {
  signOutAction?: () => Promise<void>;
  deleteAccountAction?: () => Promise<void>;
  signupEnabled?: boolean;
}) {
  const { state, t, href, mode, accountsEnabled, resetGuest, site } = useLearner();
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const storageKey = `${learnConfig.guestStorageKey}:${site}`;
  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${site}-progress.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importProgress = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || parsed.site !== site || file.size > 2_000_000) throw new Error("bad");
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
      setNote(t("profile.import.ok"));
      window.location.reload();
    } catch {
      setNote(t("profile.import.bad"));
    }
  };
  const level = levelProgress(state.totalXp);
  const c = state.counters;
  return (
    <div className="l-wrap l-stack">
      <div className="l-card l-card-accent" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.4rem" }} aria-hidden="true">{avatarEmoji(state.profile?.avatar)}</div>
        <h1 className="l-h1">{state.profile?.nickname}</h1>
        <p>{state.profile && `${t(`grade.${state.profile.grade}` as never)} · ${t(`goal.${state.profile.goal}` as never)}`}</p>
        {site === "korean" && state.profile && <p><OfficialGradeChip level={state.profile.grade} t={t} /></p>}
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

      {(site === "korean" || site === "english") && (
        <section className="l-card l-stack" aria-labelledby="tts-h">
          <h2 id="tts-h" className="l-h2">{t("tts.title")}</h2>
          <TtsSettingsPanel t={t} code={site === "korean" ? "ko" : "en"} speech={site === "korean" ? "ko-KR" : "en-US"} />
        </section>
      )}

      <section className="l-card l-stack" aria-labelledby="ac-h">
        <h2 id="ac-h" className="l-h2">{t("profile.account")}</h2>
        <p>{mode === "guest" ? t("profile.account.guest") : t("profile.account.user")}</p>
        {mode === "guest" ? (
          <>
            {accountsEnabled && <Link className="l-btn l-btn-block" href={href("/login")}>{t(signupEnabled ? "profile.login" : "auth.submit.login")}</Link>}
            <p className="l-muted">{t("profile.backup.hint")}</p>
            <button className="l-btn l-btn-ghost l-btn-block" onClick={exportProgress}>{t("profile.export")}</button>
            <button className="l-btn l-btn-ghost l-btn-block" onClick={() => fileRef.current?.click()}>{t("profile.import")}</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importProgress(e.target.files?.[0])} />
            <p role="status" className="l-muted">{note}</p>
            <button className="l-btn l-btn-ghost l-btn-block" onClick={() => window.confirm(t("profile.reset.confirm")) && resetGuest()}>{t("profile.reset")}</button>
          </>
        ) : (
          signOutAction && (
            <button className="l-btn l-btn-ghost l-btn-block" disabled={pending} onClick={() => start(() => signOutAction())}>{t("profile.logout")}</button>
          )
        )}
        <p className="l-muted">{t("profile.privacy")}</p>
      </section>

      {/* Apple App Store Guideline 5.1.1(v) Compliant Account & Data Deletion Section */}
      <section className="l-card l-stack" style={{ borderColor: "#fecaca", backgroundColor: "#fff5f5" }} aria-labelledby="del-h">
        <h2 id="del-h" className="l-h2" style={{ color: "#b91c1c" }}>
          ⚠️ {t("profile.deleteAccount")}
        </h2>
        <p className="l-muted" style={{ fontSize: "0.85rem", color: "#991b1b" }}>
          {t("profile.deleteAccount.desc")}
        </p>
        <button
          type="button"
          className="l-btn l-btn-block"
          style={{ backgroundColor: "#dc2626", color: "#ffffff", borderColor: "#b91c1c", fontWeight: 700 }}
          disabled={pending}
          onClick={() => {
            const confirmed = window.confirm(t("profile.deleteAccount.confirm"));
            if (!confirmed) return;
            start(async () => {
              try {
                window.localStorage.removeItem(storageKey);
                window.sessionStorage.clear();
              } catch {}
              if (deleteAccountAction) {
                await deleteAccountAction();
              } else {
                resetGuest();
              }
              window.alert(t("profile.deleteAccount.done"));
              window.location.href = href("/");
            });
          }}
        >
          {pending ? "삭제 처리 중..." : `🗑️ ${t("profile.deleteAccount")}`}
        </button>
      </section>
    </div>
  );
}

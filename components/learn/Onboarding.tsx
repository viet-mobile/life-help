"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { learnConfig } from "@/lib/learn/config";
import { AVATARS } from "@/lib/learn/avatars";
import { GOALS, GRADES, type Goal, type Grade } from "@/lib/learn/types";
import { ApiError, useLearner } from "./LearnerProvider";

const TOTAL = 4;

const subscribe = () => () => {};
/** Profile fields (only) of this device's guest session; used to pre-fill a new account's onboarding. */
function guestProfileJson(site: string): string | null {
  try {
    const raw = window.localStorage.getItem(`${learnConfig.guestStorageKey}:${site}`);
    const p = raw ? JSON.parse(raw)?.profile : null;
    return p ? JSON.stringify({ nickname: p.nickname, grade: p.grade, goal: p.goal, avatar: p.avatar }) : null;
  } catch {
    return null;
  }
}

export function Onboarding() {
  const { t, api, href, ready, state, mode, site } = useLearner();
  // Progress (XP, mastery, lessons) is never carried over from a guest session: it is
  // client-held and unverifiable. Only the harmless profile choices are offered as defaults.
  const guestJson = useSyncExternalStore(subscribe, () => (mode === "account" && !state.profile ? guestProfileJson(site) : null), () => null);
  const guest = guestJson ? (JSON.parse(guestJson) as { nickname?: string; grade?: Grade; goal?: Goal; avatar?: string }) : null;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nicknameInput, setNickname] = useState<string | null>(null);
  const [gradeInput, setGrade] = useState<Grade | null>(null);
  const [goalInput, setGoal] = useState<Goal | null>(null);
  const [avatarInput, setAvatar] = useState<string | null>(null);
  const nickname = nicknameInput ?? state.profile?.nickname ?? guest?.nickname ?? "";
  const grade = gradeInput ?? state.profile?.grade ?? guest?.grade ?? null;
  const goal = goalInput ?? state.profile?.goal ?? guest?.goal ?? null;
  const avatar = avatarInput ?? state.profile?.avatar ?? guest?.avatar ?? "fox";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nickOk = nickname.trim().length >= 2 && nickname.trim().length <= 16 && !/[<>&"'`\\]/.test(nickname);
  const canNext = step === 1 ? nickOk : step === 2 ? !!grade : step === 3 ? !!goal : true;

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await api("onboard", { nickname: nickname.trim(), grade, goal, avatar });
      router.replace(href(state.diagnosticDone ? "/dashboard" : "/diagnostic"));
    } catch (e) {
      setSaving(false);
      setError(e instanceof ApiError && e.code === "invalid_nickname" ? t("onboarding.nickname.hint") : t("lesson.error"));
    }
  };

  if (!ready) return <div className="l-wrap" role="status">{t("common.loading")}</div>;

  return (
    <div className="l-wrap l-stack">
      <p className="l-muted" aria-live="polite">{t("onboarding.step", { n: step, total: TOTAL })}</p>
      <div className="l-bar" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} aria-label={t("onboarding.step", { n: step, total: TOTAL })}>
        <span style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="l-stack">
          <h1 className="l-h1">{t("onboarding.nickname.title")}</h1>
          <label htmlFor="nick" className="l-muted">{t("onboarding.nickname.label")} · {t("onboarding.nickname.hint")}</label>
          <input id="nick" className="l-input" value={nickname} maxLength={16} autoComplete="off" onChange={(e) => setNickname(e.target.value)} />
        </section>
      )}

      {step === 2 && (
        <section className="l-stack">
          <h1 className="l-h1">{t("onboarding.grade.title")}</h1>
          <div role="radiogroup" aria-label={t("onboarding.grade.title")} className="l-options" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {GRADES.map((g) => (
              <button key={g} type="button" role="radio" aria-checked={grade === g} data-selected={grade === g} className="l-option" onClick={() => setGrade(g)}>
                {t(`grade.${g}` as never)}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="l-stack">
          <h1 className="l-h1">{t("onboarding.goal.title")}</h1>
          <div role="radiogroup" aria-label={t("onboarding.goal.title")} className="l-options">
            {GOALS.map((g) => (
              <button key={g} type="button" role="radio" aria-checked={goal === g} data-selected={goal === g} className="l-option" onClick={() => setGoal(g)}>
                {t(`goal.${g}` as never)}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="l-stack">
          <h1 className="l-h1">{t("onboarding.avatar.title")}</h1>
          <div role="radiogroup" aria-label={t("onboarding.avatar.title")} className="l-options" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {AVATARS.map((a) => (
              <button key={a.id} type="button" role="radio" aria-checked={avatar === a.id} data-selected={avatar === a.id} className="l-option" style={{ flexDirection: "column", justifyContent: "center", minHeight: 96 }} onClick={() => setAvatar(a.id)}>
                <span style={{ fontSize: "2.2rem" }} aria-hidden="true">{a.emoji}</span>
                <span>{t(`avatar.${a.id}` as never)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {error && <div className="l-panel l-panel-reveal" role="alert">{error}</div>}

      <div className="l-stack">
        {step < TOTAL ? (
          <button className="l-btn l-btn-block" disabled={!canNext} onClick={() => setStep(step + 1)}>{t("onboarding.next")}</button>
        ) : (
          <button className="l-btn l-btn-block" disabled={saving} onClick={finish}>{saving ? t("onboarding.saving") : t("onboarding.finish")}</button>
        )}
        {step > 1 && <button className="l-btn l-btn-ghost l-btn-block" onClick={() => setStep(step - 1)}>{t("onboarding.back")}</button>}
      </div>
    </div>
  );
}

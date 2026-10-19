"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { learnConfig } from "@/lib/learn/config";
import { AVATARS } from "@/lib/learn/avatars";
import { siteConfig, isLevelOf } from "@/lib/learn/sites";
import { UNAVAILABLE_KOREAN_LEVELS } from "@/lib/learn/korean-availability";
import { BANDS, bandLabel, courseTopic, bandOfLevel, isPublishedBand, startLevelOfBand, type Band } from "@/lib/learn/korean-bands";
import { GOALS, type Goal, type Grade } from "@/lib/learn/types";
import { useEnterToContinue } from "./useEnterToContinue";
import { LocaleSwitch } from "./LocaleSwitch";
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
  const [bandPick, setBandPick] = useState<Band | null>(null);
  const [goalInput, setGoal] = useState<Goal | null>(null);
  const [avatarInput, setAvatar] = useState<string | null>(null);
  const nickname = nicknameInput ?? state.profile?.nickname ?? guest?.nickname ?? "";
  // a level from another site (e.g. a school grade carried by a guest profile) is never offered on a language site, and vice versa
  const grade = [gradeInput, state.profile?.grade, guest?.grade].find((g): g is Grade => isLevelOf(site, g)) ?? null;
  const bandSelected: Band | null = bandPick ?? (site === "korean" && grade ? bandOfLevel(grade) : null);
  const goal = goalInput ?? state.profile?.goal ?? guest?.goal ?? null;
  const avatar = avatarInput ?? state.profile?.avatar ?? guest?.avatar ?? "fox";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlockedLevel = site === "korean" && !!grade && UNAVAILABLE_KOREAN_LEVELS.includes(grade);
  const nickOk = nickname.trim().length >= 2 && nickname.trim().length <= 16 && !/[<>&"'`\\]/.test(nickname);
  const canNext = step === 1 ? nickOk : step === 2 ? (!!grade && !isBlockedLevel) : step === 3 ? !!goal : true;

  const next = () => {
    if (canNext && step < TOTAL) setStep(step + 1);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await api("onboard", { nickname: nickname.trim(), grade, goal, avatar });
      router.replace(href(state.diagnosticDone ? "/dashboard" : "/diagnostic"));
    } catch (e) {
      setSaving(false);
      setError(
        e instanceof ApiError && e.code === "invalid_nickname"
          ? t("onboarding.nickname.hint")
          : e instanceof ApiError && e.code === "level_requires_db_upgrade"
            ? (site === "korean" ? t("onboarding.korean.account_limit") : t("lesson.error"))
            : t("lesson.error"),
      );
    }
  };

  useEnterToContinue(ready && canNext && !saving, () => { if (step < TOTAL) next(); else void finish(); }, step);

  if (!ready) return <div className="l-wrap" role="status">{t("common.loading")}</div>;

  return (
    <div className="l-wrap l-stack">
      <LocaleSwitch compact />
      <p className="l-muted" aria-live="polite">{t("onboarding.step", { n: step, total: TOTAL })}</p>
      <div className="l-bar" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} aria-label={t("onboarding.step", { n: step, total: TOTAL })}>
        <span style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="l-stack">
          <h1 className="l-h1">{t("onboarding.nickname.title")}</h1>
          <label htmlFor="nick" className="l-muted">{t("onboarding.nickname.label")} · {t("onboarding.nickname.hint")}</label>
          <input id="nick" className="l-input" value={nickname} maxLength={16} autoComplete="off" onChange={(e) => setNickname(e.target.value)} onKeyDown={(e) => {
            if (e.key !== "Enter" || e.repeat || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
            e.preventDefault();
            next();
          }} />
        </section>
      )}

      {step === 2 && (
        <section className="l-stack">
          <h1 className="l-h1">{t(site === "korean" ? "onboarding.level.title" : "onboarding.grade.title")}</h1>
          {site === "korean" && (
            <div role="radiogroup" aria-label={t("korean.band.pick")} className="l-stack" data-testid="band-picker">
              <p className="l-muted" style={{ fontSize: "0.9rem" }}>{t("korean.band.pick.hint")}</p>
              <div className="l-options l-grades" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))" }}>
                {BANDS.map((b) => {
                  const open = isPublishedBand(b);
                  return (
                    <button key={b} type="button" role="radio" aria-checked={bandSelected === b} aria-disabled={!open} disabled={!open} data-selected={bandSelected === b} data-testid={`band-pick-${b}`} data-grade={startLevelOfBand(b) ?? undefined} className="l-option l-grade" style={open ? undefined : { opacity: 0.55 }}
                      onClick={() => { setBandPick(b); const lv = startLevelOfBand(b); if (lv) setGrade(lv); }}>
                      {bandLabel(b, t)}{open ? "" : " 🔒"}
                    </button>
                  );
                })}
              </div>
              {grade && <p className="l-panel" role="status" style={{ fontSize: "0.9rem" }}>{t("korean.band.start", { level: courseTopic(t(`grade.${grade}` as never)) })}</p>}
              <p className="l-muted" style={{ fontSize: "0.85rem" }}>{t("korean.band.preparing")}</p>
            </div>
          )}
          {site !== "korean" && siteConfig(site).levelGroups.map(({ key: level, levels: list }) => (
            <div key={level} role="radiogroup" aria-label={t(`grade.group.${level}` as never)} className="l-stack">
              <p className="l-muted" style={{ fontWeight: 800 }}>{t(`grade.group.${level}` as never)}</p>
              <div className="l-options l-grades">
                {list.map((g) => (
                  <button key={g} type="button" role="radio" aria-checked={grade === g} data-selected={grade === g} data-grade={g} className="l-option l-grade" onClick={() => setGrade(g)}>
                    {t(`grade.${g}` as never)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {isBlockedLevel && (
            <p className="l-panel" style={{ fontSize: "0.9rem", color: "var(--l-accent, #c2410c)" }} role="status">
              ℹ️ {t("onboarding.korean.account_limit")}
            </p>
          )}
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
          <button className="l-btn l-btn-block" disabled={!canNext} onClick={next}>{t("onboarding.next")}</button>
        ) : (
          <button className="l-btn l-btn-block" disabled={saving} onClick={finish}>{saving ? t("onboarding.saving") : t("onboarding.finish")}</button>
        )}
        {step > 1 && <button className="l-btn l-btn-ghost l-btn-block" onClick={() => setStep(step - 1)}>{t("onboarding.back")}</button>}
      </div>
    </div>
  );
}

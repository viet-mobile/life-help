"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { authenticate, type AuthFormState } from "@/app/study/[site]/actions";
import { useSite } from "./LearnerProvider";

export function AuthForm({ enabled }: { enabled: boolean }) {
  const { site, t, href } = useSite();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState<AuthFormState | null, FormData>(authenticate, null);

  return (
    <div className="l-wrap l-stack">
      <h1 className="l-h1">{t(mode === "login" ? "auth.title.login" : "auth.title.signup")}</h1>
      {!enabled && <div className="l-panel l-panel-hint" role="status">{t("auth.unavailable")}</div>}
      <form action={action} className="l-stack">
        <input type="hidden" name="site" value={site} />
        <input type="hidden" name="mode" value={mode} />
        <div>
          <label htmlFor="email" className="l-muted">{t("auth.email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="l-input" disabled={!enabled} />
        </div>
        <div>
          <label htmlFor="password" className="l-muted">{t("auth.password")}</label>
          <input id="password" name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} className="l-input" disabled={!enabled} />
        </div>
        {mode === "signup" && (
          <fieldset className="l-stack" style={{ border: 0, padding: 0 }} disabled={!enabled}>
            <legend className="l-muted">만 14세 이상 확인 · Age confirmation</legend>
            <label className="l-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="radio" name="ageBasis" value="14plus" required />
              <span>저는 만 14세 이상입니다. · I am 14 or older.</span>
            </label>
            <label className="l-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="radio" name="ageBasis" value="guardian" required />
              <span>저는 만 14세 미만 아동의 법정대리인이며, 아동을 위해 직접 가입합니다. · I am the parent / legal guardian of a child under 14 and am signing up for the child.</span>
            </label>
            <label className="l-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="checkbox" name="agree" required />
              <span>
                <Link className="l-link" href={href("/terms")} target="_blank">이용약관 · Terms</Link> 및 <Link className="l-link" href={href("/privacy")} target="_blank">개인정보처리방침 · Privacy Policy</Link>에 동의합니다. · I agree.
              </span>
            </label>
          </fieldset>
        )}
        {state?.error === "consent" && <div className="l-panel l-panel-reveal" role="alert">가입하려면 나이 확인과 약관 동의가 필요합니다. · Please confirm your age and accept the terms to sign up.</div>}
        {state?.error && state.error !== "unavailable" && state.error !== "consent" && <div className="l-panel l-panel-reveal" role="alert">{t("auth.error")}</div>}
        {state?.confirm && <div className="l-panel l-panel-good" role="status">{t("auth.confirm")}</div>}
        <button className="l-btn l-btn-block" disabled={!enabled || pending}>{t(mode === "login" ? "auth.submit.login" : "auth.submit.signup")}</button>
      </form>
      <button className="l-link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{t(mode === "login" ? "auth.switch.signup" : "auth.switch.login")}</button>
      <Link className="l-btn l-btn-ghost l-btn-block" href={href("/onboarding")}>{t("auth.guest")}</Link>
      <p className="l-muted">{t("auth.note")}</p>
      <p className="l-muted" style={{ fontSize: "0.85rem" }}>
        <Link className="l-link" href={href("/privacy")}>개인정보처리방침 · Privacy Policy</Link> · <Link className="l-link" href={href("/terms")}>이용약관 · Terms</Link>
      </p>
    </div>
  );
}

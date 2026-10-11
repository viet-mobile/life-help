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
            <legend className="l-muted">{t("auth.age.title")}</legend>
            <label className="l-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="radio" name="ageBasis" value="14plus" required />
              <span>{t("auth.age.adult")}</span>
            </label>
            <label className="l-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="radio" name="ageBasis" value="guardian" required />
              <span>{t("auth.age.guardian")}</span>
            </label>
            <label className="l-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="checkbox" name="agree" required />
              <span>
                {t("auth.agree")}{" "}
                <Link className="l-link" href={href("/terms")} target="_blank">{t("legal.terms")}</Link> · <Link className="l-link" href={href("/privacy")} target="_blank">{t("legal.privacy")}</Link>
              </span>
            </label>
          </fieldset>
        )}
        {state?.error === "consent" && <div className="l-panel l-panel-reveal" role="alert">{t("auth.consent.error")}</div>}
        {state?.error && state.error !== "unavailable" && state.error !== "consent" && <div className="l-panel l-panel-reveal" role="alert">{t("auth.error")}</div>}
        {state?.confirm && <div className="l-panel l-panel-good" role="status">{t("auth.confirm")}</div>}
        <button className="l-btn l-btn-block" disabled={!enabled || pending}>{t(mode === "login" ? "auth.submit.login" : "auth.submit.signup")}</button>
      </form>
      <button className="l-link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{t(mode === "login" ? "auth.switch.signup" : "auth.switch.login")}</button>
      <Link className="l-btn l-btn-ghost l-btn-block" href={href("/onboarding")}>{t("auth.guest")}</Link>
      <p className="l-muted">{t("auth.note")}</p>
      <p className="l-muted" style={{ fontSize: "0.85rem" }}>
        <Link className="l-link" href={href("/privacy")}>{t("legal.privacy")}</Link> · <Link className="l-link" href={href("/terms")}>{t("legal.terms")}</Link>
      </p>
    </div>
  );
}

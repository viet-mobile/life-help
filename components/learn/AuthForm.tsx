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
        {state?.error && state.error !== "unavailable" && <div className="l-panel l-panel-reveal" role="alert">{t("auth.error")}</div>}
        {state?.confirm && <div className="l-panel l-panel-good" role="status">{t("auth.confirm")}</div>}
        <button className="l-btn l-btn-block" disabled={!enabled || pending}>{t(mode === "login" ? "auth.submit.login" : "auth.submit.signup")}</button>
      </form>
      <button className="l-link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{t(mode === "login" ? "auth.switch.signup" : "auth.switch.login")}</button>
      <Link className="l-btn l-btn-ghost l-btn-block" href={href("/onboarding")}>{t("auth.guest")}</Link>
      <p className="l-muted">{t("auth.note")}</p>
    </div>
  );
}

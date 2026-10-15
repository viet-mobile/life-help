"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createLearnRecoveryBrowserClient } from "@/lib/learn/server/supabase/browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recoveryToken, recoverySession } from "@/lib/learn/review/recovery";

export function ReviewPasswordReset({ url, publishableKey }: { url: string; publishableKey: string }) {
  const client = useRef<SupabaseClient | null>(null);
  const started = useRef(false);
  const [phase, setPhase] = useState<"checking" | "ready" | "saving" | "done" | "invalid">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = recoveryToken(window.location.hash);
    const session = recoverySession(window.location.hash);
    window.history.replaceState(null, "", window.location.pathname);
    if (!token && !session) { setPhase("invalid"); return; }
    const supabase = createLearnRecoveryBrowserClient(url, publishableKey);
    client.current = supabase;
    const verification = token
      ? supabase.auth.verifyOtp({ token_hash: token, type: "recovery" })
      : supabase.auth.setSession(session!);
    void verification.then(({ data, error }) => {
      setPhase(!error && data.session && data.user ? "ready" : "invalid");
    }).catch(() => setPhase("invalid"));
  }, [url, publishableKey]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "ready" || !client.current) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password.length < 8 || password.length > 128 || password !== data.get("confirm")) {
      setMessage("8자 이상 비밀번호를 두 칸에 동일하게 입력해 주세요."); return;
    }
    setPhase("saving"); setMessage("");
    try {
      const { error } = await client.current.auth.updateUser({ password });
      if (error) { setPhase("ready"); setMessage("변경하지 못했습니다. 다른 비밀번호로 다시 시도해 주세요."); return; }
      await client.current.auth.signOut({ scope: "local" });
      setPhase("done");
    } catch { setPhase("ready"); setMessage("연결을 확인한 뒤 다시 시도해 주세요."); }
  }

  return <div className="l-wrap l-stack" lang="ko">
    <h1 className="l-h1">검토 계정 비밀번호 재설정</h1>
    {phase === "checking" && <p role="status">복구 링크를 확인하고 있습니다.</p>}
    {phase === "invalid" && <p role="alert">복구 링크가 만료됐거나 이미 사용됐습니다. 새 복구 메일을 요청해 주세요.</p>}
    {(phase === "ready" || phase === "saving") && <form onSubmit={save} className="l-stack">
      <label>새 비밀번호<input className="l-input" type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={phase === "saving"} /></label>
      <label>새 비밀번호 확인<input className="l-input" type="password" name="confirm" autoComplete="new-password" required minLength={8} maxLength={128} disabled={phase === "saving"} /></label>
      {message && <p role="alert">{message}</p>}
      <button className="l-btn" disabled={phase === "saving"}>{phase === "saving" ? "변경 중…" : "비밀번호 변경"}</button>
    </form>}
    {phase === "done" && <p role="status">비밀번호를 변경했습니다. 새 비밀번호로 로그인한 뒤 검토 페이지를 열어 주세요.</p>}
    <a className="l-link" href="/study/korean/login">로그인 화면</a>
    <a className="l-link" href="/study/korean/review">한국어 검토 페이지</a>
  </div>;
}

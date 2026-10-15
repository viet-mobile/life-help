import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { reviewAccess } from "@/lib/learn/review/access";

export async function reviewBase(): Promise<string> {
  const base = (await headers()).get("x-learn-base") ?? "";
  return base.startsWith("/study/korean") ? "/study/korean" : "";
}

/**
 * Server-side gate + frame of every review page. Disabled environment -> 404 (the console does not exist there); not signed in -> sign-in
 * link; signed in but not a reviewer -> refusal. The persistent banner says what this material is NOT: reviewed, native-checked or published.
 */
export async function ReviewFrame({ children }: { children: (ctx: { base: string; email: string }) => Promise<ReactNode> | ReactNode }) {
  const access = await reviewAccess();
  if (access.state === "disabled") notFound();
  const base = await reviewBase();
  if (access.state === "login") {
    return (
      <div className="l-wrap l-stack" data-testid="review-login">
        <h1 className="l-h1">한국어 검토 환경 / Korean review environment</h1>
        <p>검토자 계정으로 로그인해야 합니다. / Sign in with a reviewer account.</p>
        <Link className="l-btn" href={`${base}/login`}>로그인 / sign in</Link>
      </div>
    );
  }
  if (access.state === "forbidden") {
    return (
      <div className="l-wrap l-stack" data-testid="review-forbidden">
        <div className="l-panel l-panel-reveal" role="alert">이 계정은 검토 권한이 없습니다. / This account has no reviewer access.</div>
      </div>
    );
  }
  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <div className="l-panel l-panel-hint" role="status" data-testid="review-banner" style={{ borderWidth: 2 }}>
        <strong>검토 환경 · REVIEW ENVIRONMENT</strong> — 비공개 자료입니다. 번역은 AI 번역이며 원어민·교사 검토와 품질 검토가 <strong>끝나지 않았습니다</strong>. 일반 학습자에게 공개되지 않습니다. 진도는 저장되지 않고 기록은 이 브라우저에만 남습니다.
        {" "}<span className="l-muted">Unpublished material: AI translations, no native-speaker or teacher review completed, not offered to learners. No progress is saved; notes stay in this browser. ({access.email})</span>
      </div>
      {await children({ base, email: access.email })}
    </div>
  );
}

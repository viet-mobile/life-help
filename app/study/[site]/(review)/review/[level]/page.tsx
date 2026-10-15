import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewFrame } from "@/components/learn/review/ReviewFrame";
import { ReviewList } from "@/components/learn/review/ReviewList";
import { isLocale, isReviewLevel, loadReviewLevel } from "@/lib/learn/review/korean";

export const metadata: Metadata = { title: "한국어 검토", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function Page({ params, searchParams }: { params: Promise<{ site: string; level: string }>; searchParams: Promise<{ lang?: string; skill?: string; page?: string }> }) {
  const { site, level } = await params;
  if (site !== "korean" || !isReviewLevel(level)) notFound();
  const sp = await searchParams;
  return (
    <ReviewFrame>
      {async ({ base }) => {
        if (sp.lang !== undefined && !isLocale(sp.lang)) {
          return <div className="l-panel l-panel-reveal" role="alert" data-testid="review-bad-lang">알 수 없는 언어입니다 / unknown language: {String(sp.lang).slice(0, 12)}. <Link href={`${base}/review`}>← 처음으로 / back</Link></div>;
        }
        const locale = isLocale(sp.lang) ? sp.lang : "en";
        const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
        const data = await loadReviewLevel(level, locale, { skill: sp.skill, offset: (page - 1) * PAGE, limit: PAGE });
        if (sp.skill && !data.skills.some((s) => s.id === sp.skill)) {
          return <div className="l-panel l-panel-reveal" role="alert" data-testid="review-bad-skill">이 레벨에 없는 스킬입니다 / unknown skill. <Link href={`${base}/review/${level}?lang=${locale}`}>← {level}</Link></div>;
        }
        const pages = Math.max(1, Math.ceil(data.total / PAGE));
        const q = (over: Record<string, string | undefined>) => {
          const p = new URLSearchParams({ lang: locale, ...(sp.skill ? { skill: sp.skill } : {}) });
          for (const [k, v] of Object.entries(over)) v === undefined ? p.delete(k) : p.set(k, v);
          return `${base}/review/${level}?${p}`;
        };
        return (
          <>
            <p><Link href={`${base}/review`}>← 검토 시작 / start</Link></p>
            <h1 className="l-h1">{level} · {locale}</h1>
            {data.error && <div className="l-panel l-panel-reveal" role="alert" data-testid="review-load-error">{data.error}</div>}
            <p className="l-muted">{data.total} questions{sp.skill ? ` in ${sp.skill}` : ""} · page {Math.min(page, pages)} / {pages}</p>
            <nav aria-label="skills" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Link href={q({ skill: undefined, page: undefined })} style={{ fontWeight: sp.skill ? 400 : 800 }}>all</Link>
              {data.skills.map((s) => <Link key={s.id} href={q({ skill: s.id, page: undefined })} style={{ fontWeight: sp.skill === s.id ? 800 : 400 }}>{s.id.split(".").slice(2).join(".")} ({s.count})</Link>)}
            </nav>
            <nav aria-label="languages" className="l-muted" style={{ fontSize: "0.85rem" }}>language: <Link href={`${base}/review`}>choose another language</Link></nav>
            <ReviewList rows={data.rows} locale={locale} />
            <nav style={{ display: "flex", gap: 16 }} aria-label="pages">
              {page > 1 && <Link href={q({ page: String(page - 1) })}>← prev</Link>}
              {page < pages && <Link href={q({ page: String(page + 1) })}>next →</Link>}
            </nav>
          </>
        );
      }}
    </ReviewFrame>
  );
}

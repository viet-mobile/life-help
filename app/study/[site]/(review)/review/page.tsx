import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewFrame } from "@/components/learn/review/ReviewFrame";
import status from "@/lib/learn/review/korean-locale-status.json";
import { LOCALES, reviewCounts, reviewLevels } from "@/lib/learn/review/korean";
import { nativeName } from "@/lib/learn/i18n";

export const metadata: Metadata = { title: "한국어 검토 환경", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Rec = { tier: string; course: string; templates: number; g: number; s: number; n: number; missing: number };

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  if ((await params).site !== "korean") notFound();
  return (
    <ReviewFrame>
      {({ base }) => {
        const counts = reviewCounts();
        const req = status.required;
        const locs = status.locales as Record<string, Rec>;
        return (
          <>
            <h1 className="l-h1">한국어 검토 환경 / Korean review</h1>
            <section className="l-card l-stack">
              <h2 className="l-h2">점검 순서 / checklist</h2>
              <ol style={{ paddingLeft: "1.4rem" }}>
                <li>레벨(K1~K10)과 언어를 고르면 해당 문항이 ID·스킬과 함께 나옵니다. 정답은 ✓로 표시됩니다.</li>
                <li>정답이 하나인지, 한국어·맞춤법·로마자가 맞는지, 오답이 자연스러운지 확인합니다.</li>
                <li>힌트가 정답을 알려 주지 않는지, 해설이 맞는지 확인합니다. 번역 줄의 <em>fallback to English</em>는 그 언어 번역이 없다는 뜻입니다.</li>
                <li>문제를 찾으면 문항의 <em>문제 기록</em>에 남기고, 끝나면 JSON/CSV로 내보냅니다.</li>
                <li>이 화면의 모든 자료는 검토 전입니다. 이 화면에는 “검토됨”으로 표시하는 기능이 없습니다.</li>
              </ol>
            </section>
            <section className="l-card" style={{ overflowX: "auto" }}>
              <h2 className="l-h2">레벨별 규모 / size per level</h2>
              <table style={{ width: "100%", fontSize: "0.9rem" }}>
                <thead><tr><th align="left">level</th><th align="right">course</th><th align="right">bridge</th><th align="right">bank questions</th><th align="right">bank items</th></tr></thead>
                <tbody>{reviewLevels.map((l) => <tr key={l}><td>{l}</td><td align="right">{counts[l].course}</td><td align="right">{counts[l].bridge}</td><td align="right">{counts[l].bank}</td><td align="right">{counts[l].items}</td></tr>)}</tbody>
              </table>
            </section>
            <section className="l-card" style={{ overflowX: "auto" }}>
              <h2 className="l-h2">언어별 번역 상태 / translation status per language</h2>
              <p className="l-muted">bank texts required: meanings {req.g}, situations {req.s}, notes {req.n}, templates {req.templates}. complete = all present · partial = missing texts show the English source · canonical = English source. 모든 번역은 AI 번역(미검수).</p>
              <table style={{ width: "100%", fontSize: "0.85rem" }}>
                <thead><tr><th align="left">language</th><th align="left">status</th><th align="right">missing</th><th align="left">start</th></tr></thead>
                <tbody>
                  {LOCALES.map((loc) => {
                    const r = locs[loc];
                    return (
                      <tr key={loc} data-locale={loc} data-tier={r?.tier}>
                        <td>{loc} · {nativeName(loc)}</td>
                        <td>{r?.tier ?? "no overlay"}</td>
                        <td align="right">{r ? r.missing : "-"}</td>
                        <td>{reviewLevels.map((l) => <Link key={l} href={`${base}/review/${l}?lang=${loc}`} style={{ marginRight: 8 }}>{l}</Link>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        );
      }}
    </ReviewFrame>
  );
}

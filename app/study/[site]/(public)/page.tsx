import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/learn/BrandLogo";
import { LocaleSwitch } from "@/components/learn/LocaleSwitch";
import { StartCta } from "@/components/learn/StartCta";
import { getServerT, getSecondaryLocales } from "@/lib/learn/i18n/server";
import { loadContent, accountsEnabled, SIGNUP_ENABLED, getLearnService, getUserId } from "@/lib/learn/server/runtime";
import { learnHost, parseLearnHost, buildMainPortalUrl } from "@/lib/learn/hosts";
import { siteConfig } from "@/lib/learn/sites";
import { SITES, isSite, schoolLevel } from "@/lib/learn/types";
import { hubLabels } from "@/components/think/hubLabels";
import { getDailyInsight, DomainType } from "@/lib/learn/dailyInsights";
import { DailyInsightCard } from "@/components/learn/DailyInsightCard";

export default async function Landing({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const h = await headers();
  const base = h.get("x-learn-base") ?? `/study/${site}`;
  const { t, locale } = await getServerT();
  const secondaryLocales = await getSecondaryLocales();
  const rawHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const mainHomeUrl = buildMainPortalUrl(rawHost, locale, secondaryLocales);
  const { bundle } = await loadContent(site, locale);
  const userId = await getUserId();
  const hasProfile = userId ? !!(await getLearnService().getState({ userId }, site)).profile : false;
  const dailyInsight = getDailyInsight(site, new Date(), locale);
  const secondaryWorldsTitles = await Promise.all(
    secondaryLocales.map(async (sec) => {
      const { t: secT } = await getServerT(sec);
      return { locale: sec, text: secT("landing.worldsTitle" as never) };
    })
  );
  // Navigation for all 5 study sites in one single row: Korean, English, Math, Physics, Chemistry
  const stage = parseLearnHost(rawHost)?.stage;
  const urlLocalePrefix = base.startsWith(`/study/${site}`)
    ? base.slice(`/study/${site}`.length)
    : (base.startsWith("/") ? base : "");
  const subjects = SITES.map((s) => ({
    site: s,
    href: stage && stage !== "local"
      ? `https://${learnHost(s, stage)}${urlLocalePrefix}`
      : `/study/${s}${urlLocalePrefix}`,
    isCurrent: s === site,
    label: t(`site.${s}.name` as never),
  }));

  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <a className="l-skip" href="#main">{t("nav.skip")}</a>
      <header className="l-landing-head" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <a
            href={mainHomeUrl}
            className="droplet-pill inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs transition shadow-sm cursor-pointer"
            title={locale === "ko" ? "LIFE.HELP 메인 홈으로 이동" : "Return to LIFE.HELP Main Portal"}
          >
            <span className="text-sm">🏠</span>
            <span>LIFE.HELP</span>
          </a>
          <span className="l-brand"><BrandLogo site={site} name={t(siteConfig(site).brandKey)} size={56} /></span>
          <LocaleSwitch />
        </div>
        <nav
          aria-label="Subjects Navigation"
          style={{
            display: "inline-flex",
            flexWrap: "nowrap",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            padding: "2px 0",
          }}
        >
          {subjects.map((sub) => (
            <Link
              key={sub.site}
              href={sub.href}
              className={`l-link ${sub.isCurrent ? "l-link-active" : ""}`}
              style={{
                fontSize: "0.92rem",
                padding: "6px 12px",
                borderRadius: "9999px",
                textDecoration: "none",
                fontWeight: sub.isCurrent ? 800 : 600,
                color: sub.isCurrent ? "#ffffff" : "inherit",
                backgroundColor: sub.isCurrent ? "var(--l-brand, #2563eb)" : "rgba(241, 245, 249, 0.9)",
                border: sub.isCurrent ? "1px solid var(--l-brand, #2563eb)" : "1px solid rgba(203, 213, 225, 0.7)",
                boxShadow: sub.isCurrent ? "0 2px 6px rgba(37, 99, 235, 0.25)" : "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              data-testid={`subject-nav-${sub.site}`}
            >
              {sub.label}
            </Link>
          ))}
        </nav>
      </header>

      <main id="main" className="l-stack">
      <section className="l-card l-card-accent l-stack" style={{ padding: "clamp(18px, 4vw, 32px)" }}>
        <p style={{ fontWeight: 800 }}>{t("landing.eyebrow")}</p>
        <h1 className="l-h1">{t(`site.${site}.tagline` as never)}</h1>
        <p>{t(`site.${site}.description` as never)}</p>
        <StartCta accountHasProfile={hasProfile} accountsEnabled={accountsEnabled()} signupEnabled={SIGNUP_ENABLED} />
        <Link className="l-btn l-btn-light l-btn-block" data-testid="landing-think" href={`${base}/think`}>🧠 {hubLabels(t).title}</Link>
        <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>{t("landing.privacy")}</p>
        <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
          <Link className="l-link" href={`${base}/privacy`}>{t("legal.privacy")}</Link> · <Link className="l-link" href={`${base}/terms`}>{t("legal.terms")}</Link>
        </p>
      </section>

      {/* 실전 인생 도움 데일리 팁 카드 */}
      <section className="l-stack">
        <DailyInsightCard domain={site as DomainType} insight={dailyInsight} locale={locale} secondaryLocales={secondaryLocales} />
      </section>

      <section className="l-stack" aria-labelledby="how-h">
        <h2 id="how-h" className="l-h2">{t("landing.howTitle")}</h2>
        <div className="l-grid-how">
          {(["1", "2", "3"] as const).map((n) => (
            <div key={n} className="l-card">
              <h3 className="l-h2">{t(`landing.how${n}.title` as never)}</h3>
              <p className="l-muted">{t(`landing.how${n}.body` as never)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-stack" aria-labelledby="worlds-h">
        <h2 id="worlds-h" className="l-h2">
          <div>{t("landing.worldsTitle")}</div>
          {secondaryWorldsTitles.map((st) => (
            <div key={st.locale} className="text-base sm:text-lg font-normal text-slate-500 mt-1">
              {st.text}
            </div>
          ))}
        </h2>
        {site !== "korean" ? (
          <div className="l-grid-courses">
            {bundle.catalog.courses.map((c) => {
              const isSpecial = c.id.includes("situational");
              return (
                <Link
                  key={c.id}
                  href={`${base}/course/${c.id}`}
                  className={`l-card ${isSpecial ? "l-card-accent" : ""}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  data-testid={`world-card-${c.id}`}
                >
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: "2.4rem" }} aria-hidden="true">{c.world.emoji}</span>
                    </div>
                    <h3 className="l-h2" style={{ margin: "4px 0 6px 0" }}>{c.world.name}</h3>
                    <p className="l-muted" style={{ fontWeight: 600, fontSize: "1rem" }}>{c.title}</p>
                    {c.world.tagline && <p style={{ fontSize: "0.88rem", opacity: 0.85, marginTop: 6, lineHeight: 1.45 }}>{c.world.tagline}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          siteConfig(site).levelGroups.map(({ key: level }) => {
            const courses = bundle.catalog.courses.filter((c) => schoolLevel(c.grade) === level);
            if (courses.length === 0) return null;
            return (
              <div key={level} className="l-stack">
                <h3 className="l-h2">{t(`grade.group.${level}` as never)}</h3>
                <div className="l-grid-courses">
                  {courses.map((c) => {
                    const isSpecial = c.id.includes("situational");
                    return (
                      <Link
                        key={c.id}
                        href={`${base}/course/${c.id}`}
                        className={`l-card ${isSpecial ? "l-card-accent" : ""}`}
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                        data-testid={`world-card-${c.id}`}
                      >
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: "2.4rem" }} aria-hidden="true">{c.world.emoji}</span>
                          </div>
                          <h3 className="l-h2" style={{ margin: "4px 0 6px 0" }}>{c.world.name}</h3>
                          <p className="l-muted" style={{ fontWeight: 600, fontSize: "1rem" }}>{c.title}</p>
                          {c.world.tagline && <p style={{ fontSize: "0.88rem", opacity: 0.85, marginTop: 6, lineHeight: 1.45 }}>{c.world.tagline}</p>}
                        </div>
                      </Link>
                    );
                  })}
                  {site === "korean" && (
                    <Link
                      href={`${base}/standards`}
                      className="l-card l-card-accent"
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
                      }}
                      data-testid="world-card-standards"
                    >
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: "2.4rem" }} aria-hidden="true">📜</span>
                        </div>
                        <h3 className="l-h2" style={{ margin: "4px 0 6px 0", color: "#ffffff" }}>한국어 표준어 규정 전체</h3>
                        <p className="l-muted" style={{ fontWeight: 600, fontSize: "1rem", color: "#e0e7ff" }}>국립국어원 공식 어문 규범</p>
                        <p style={{ fontSize: "0.88rem", opacity: 0.9, marginTop: 6, lineHeight: 1.45, color: "#c7d2fe" }}>
                          제1부 표준어 사정 원칙(26항) 및 제2부 표준 발음법(30항) 전 56개 조항 다국어 병기 학습
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
      </main>
      <span hidden data-base={base} />
    </div>
  );
}

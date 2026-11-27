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
import { getKoreanCourseTheme } from "@/lib/learn/korean-themes";
import { ResponsiveSubjectNav } from "@/components/learn/ResponsiveSubjectNav";
import { KoreanTraditionalPattern } from "@/components/learn/KoreanTraditionalPattern";
import { HangeulCalligraphyIcon } from "@/components/learn/HangeulCalligraphyIcon";

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
      <header className="l-landing-head flex flex-wrap items-center justify-between gap-2.5 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 shrink-0 max-w-full flex-wrap">
          <a
            href={mainHomeUrl}
            className="droplet-pill inline-flex items-center justify-center gap-1.5 px-3 h-[34px] bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
            title={locale === "ko" ? "LIFE.HELP 메인 홈으로 이동" : "Return to LIFE.HELP Main Portal"}
          >
            <span className="text-sm">🏠</span>
            <span>LIFE.HELP</span>
          </a>
          <span className="l-brand inline-flex items-center h-[34px] shrink-0">
            <BrandLogo site={site} name={t(siteConfig(site).brandKey)} size={34} />
          </span>
          <LocaleSwitch compact />
        </div>
        <ResponsiveSubjectNav
          currentSite={site}
          subjects={subjects}
        />
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
                    const theme = site === "korean" ? getKoreanCourseTheme(c.id) : undefined;
                    return (
                      <Link
                        key={c.id}
                        href={`${base}/course/${c.id}`}
                        className={`l-card ${isSpecial ? "l-card-accent" : ""}`}
                        style={{
                          textDecoration: "none",
                          color: theme ? "#ffffff" : "inherit",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          background: theme ? theme.bg : undefined,
                          borderColor: theme ? theme.borderColor : undefined,
                          boxShadow: theme ? "0 4px 16px -2px rgba(0, 0, 0, 0.12)" : undefined,
                          position: "relative",
                          overflow: "hidden",
                        }}
                        data-testid={`world-card-${c.id}`}
                      >
                        {theme?.patternType && <KoreanTraditionalPattern type={theme.patternType} />}
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            {site === "korean" && c.id === "korean-k1" ? (
                              <span className="inline-flex items-center justify-center w-11 h-11 rounded-[12px_3px_12px_3px] bg-white/20 border border-white/30 backdrop-blur-xs shadow-xs" title="훈민정음 한글">
                                <HangeulCalligraphyIcon size={30} className="w-7 h-7 object-contain drop-shadow" />
                              </span>
                            ) : (
                              <span style={{ fontSize: "2.4rem" }} aria-hidden="true">{c.world.emoji}</span>
                            )}
                            {theme && (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "10px 3px 10px 3px",
                                  background: theme.badgeBg,
                                  color: theme.badgeText,
                                  backdropFilter: "blur(4px)",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                {theme.koreanTag}
                              </span>
                            )}
                          </div>
                          <h3 className="l-h2" style={{ margin: "4px 0 6px 0", color: theme ? theme.titleColor : undefined }}>{c.world.name}</h3>
                          <p style={{ fontWeight: 600, fontSize: "1rem", color: theme ? theme.subColor : undefined, margin: 0 }}>{c.title}</p>
                          {c.world.tagline && (
                            <p style={{ fontSize: "0.88rem", opacity: 0.95, marginTop: 6, lineHeight: 1.45, color: theme ? theme.taglineColor : undefined }}>
                              {c.world.tagline}
                            </p>
                          )}
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
                        color: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
                        boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.16)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      data-testid="world-card-standards"
                    >
                      <KoreanTraditionalPattern type="hunminjeongeum" />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: "2.4rem" }} aria-hidden="true">📜</span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "10px 3px 10px 3px",
                              background: "rgba(255, 255, 255, 0.2)",
                              color: "#ffffff",
                              backdropFilter: "blur(4px)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            어문 규범 · 56개 전 조항
                          </span>
                        </div>
                        <h3 className="l-h2" style={{ margin: "4px 0 6px 0", color: "#ffffff" }}>한국어 표준어 규정 전체</h3>
                        <p style={{ fontWeight: 600, fontSize: "1rem", color: "#e0e7ff", margin: 0 }}>국립국어원 공식 어문 규범</p>
                        <p style={{ fontSize: "0.88rem", opacity: 0.95, marginTop: 6, lineHeight: 1.45, color: "#c7d2fe" }}>
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

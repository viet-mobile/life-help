"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { dayKey } from "@/lib/learn/domain/dates";
import { levelProgress } from "@/lib/learn/domain/level";
import { displayStreak } from "@/lib/learn/domain/streak";
import { siteConfig } from "@/lib/learn/sites";
import { buildMainPortalUrl } from "@/lib/learn/hosts";
import { BrandLogo } from "./BrandLogo";
import { LocaleSwitch } from "./LocaleSwitch";
import { SubjectSwitch } from "./SubjectSwitch";
import { ThinkOffer } from "../think/ThinkOffer";
import { useLearner } from "./LearnerProvider";
import { hubLabels } from "../think/hubLabels";

const FOCUS_PATHS = ["/lesson/", "/onboarding", "/diagnostic", "/practice"]; // /think keeps the tab bar (its hub), the player is part of it

export function PlayShell({ children }: { children: ReactNode }) {
  const { t, tSecondary, secondaryTranslators = [], isBilingual, href, site, state, ready, locale, secondaryLocales } = useLearner();
  const pathname = usePathname();
  const focus = FOCUS_PATHS.some((p) => pathname.includes(p));
  const level = levelProgress(state.totalXp);
  const streak = ready ? displayStreak(state.streak, dayKey(new Date())) : 0;
  const rawHost = typeof window !== "undefined" ? window.location.host : "";
  const mainHomeUrl = buildMainPortalUrl(rawHost, locale, secondaryLocales);

  const tabs = [
    { path: "/dashboard", icon: "🏠", key: "nav.home" as const },
    { path: "/learn", icon: "🗺️", key: "nav.learn" as const },
    { path: "/quest", icon: "📜", key: "nav.quest" as const },
    { path: "/think", icon: "🧠", key: "think" as const },
    { path: "/profile", icon: "🙂", key: "nav.profile" as const },
  ];

  if (focus) return <><main id="main" className="l-main">{children}</main><ThinkOffer /></>;

  return (
    <>
      <a className="l-skip" href="#main">{t("nav.skip")}</a>
      <header className="l-topbar">
        <div className="l-topbar-inner">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <a
              href={mainHomeUrl}
              className="droplet-pill inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 h-[34px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs transition border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 cursor-pointer"
              title={locale === "ko" ? "LIFE.HELP 메인 홈으로 이동" : "Return to LIFE.HELP Main Portal"}
            >
              <span>🏠</span>
              <span className="hidden sm:inline">LIFE.HELP</span>
            </a>
            <Link className="l-brand shrink-0 inline-flex items-center" href={href("/dashboard")}>
              <BrandLogo site={site} name={t(siteConfig(site).brandKey)} size={34} />
            </Link>
            <LocaleSwitch compact />
            <SubjectSwitch currentSite={site} />
            {site === "korean" && (
              <Link
                href={href("/standards")}
                className="droplet-pill inline-flex items-center justify-center gap-1 px-3 h-[34px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs transition shrink-0"
                title="국립국어원 한국어 표준어 규정 (56개 항)"
              >
                <span>📜</span>
                <span className="hidden md:inline">표준어 규정</span>
              </Link>
            )}
          </div>
          <div className="l-stats" aria-label="status">
            <span className="l-stat" title={t("dash.streak", { n: streak })}>🔥 {streak}</span>
            <span className="l-stat">Lv.{level.level}</span>
            <span className="l-stat">🪙 {state.coins}</span>
          </div>
        </div>
      </header>
      <nav className="l-tabs" aria-label={t("nav.main")}>
        {tabs.map((tab) => {
          const mainLabel = tab.key === "think" ? hubLabels(t).title : t(tab.key);
          return (
            <Link key={tab.path} className="l-tab" href={href(tab.path)} aria-current={pathname.endsWith(tab.path) ? "page" : undefined}>
              <span className="l-tab-ico" aria-hidden="true">{tab.icon}</span>
              <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                <span>{mainLabel}</span>
                {isBilingual && (
                  secondaryTranslators && secondaryTranslators.length > 0 ? (
                    secondaryTranslators.map((st) => {
                      const secText = tab.key === "think" ? hubLabels(st.t).title : st.t(tab.key);
                      return (
                        <span key={st.locale} style={{ fontSize: "0.75em", opacity: 0.85, lineHeight: 1, marginTop: "1px" }}>
                          
                          {secText}
                        </span>
                      );
                    })
                  ) : tSecondary ? (
                    <span style={{ fontSize: "0.75em", opacity: 0.85, lineHeight: 1 }}>
                      {tab.key === "think" ? hubLabels(tSecondary).title : tSecondary(tab.key)}
                    </span>
                  ) : null
                )}
              </span>
            </Link>
          );
        })}
      </nav>
      <main id="main" className="l-main">{ready ? children : <div className="l-wrap" role="status">{t("common.loading")}</div>}</main>
      <ThinkOffer />
    </>
  );
}

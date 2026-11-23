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
import { ThinkOffer } from "../think/ThinkOffer";
import { useLearner } from "./LearnerProvider";
import { hubLabels } from "../think/hubLabels";

const FOCUS_PATHS = ["/lesson/", "/onboarding", "/diagnostic", "/practice"]; // /think keeps the tab bar (its hub), the player is part of it

export function PlayShell({ children }: { children: ReactNode }) {
  const { t, tSecondary, isBilingual, href, site, state, ready, locale, secondaryLocales } = useLearner();
  const pathname = usePathname();
  const focus = FOCUS_PATHS.some((p) => pathname.includes(p));
  const level = levelProgress(state.totalXp);
  const streak = ready ? displayStreak(state.streak, dayKey(new Date())) : 0;
  const rawHost = typeof window !== "undefined" ? window.location.host : "";
  const mainHomeUrl = buildMainPortalUrl(rawHost, locale, secondaryLocales);

  const tabs = [
    { path: "/dashboard", icon: "🏠", label: t("nav.home"), secLabel: isBilingual ? tSecondary("nav.home") : undefined },
    { path: "/learn", icon: "🗺️", label: t("nav.learn"), secLabel: isBilingual ? tSecondary("nav.learn") : undefined },
    { path: "/quest", icon: "📜", label: t("nav.quest"), secLabel: isBilingual ? tSecondary("nav.quest") : undefined },
    { path: "/think", icon: "🧠", label: hubLabels(t).title, secLabel: isBilingual ? hubLabels(tSecondary).title : undefined },
    { path: "/profile", icon: "🙂", label: t("nav.profile"), secLabel: isBilingual ? tSecondary("nav.profile") : undefined },
  ];

  if (focus) return <><main id="main" className="l-main">{children}</main><ThinkOffer /></>;

  return (
    <>
      <a className="l-skip" href="#main">{t("nav.skip")}</a>
      <header className="l-topbar">
        <div className="l-topbar-inner">
          <a
            href={mainHomeUrl}
            className="droplet-pill inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 rounded-full font-black text-xs transition border border-slate-200 shadow-2xs mr-1 shrink-0"
            title={locale === "ko" ? "LIFE.HELP 메인 홈으로 이동" : "Return to LIFE.HELP Main Portal"}
          >
            <span>🏠</span>
            <span className="hidden sm:inline">LIFE.HELP</span>
          </a>
          <Link className="l-brand" href={href("/dashboard")}><BrandLogo site={site} name={t(siteConfig(site).brandKey)} /></Link>
          <LocaleSwitch compact />
          <div className="l-stats" aria-label="status">
            <span className="l-stat" title={t("dash.streak", { n: streak })}>🔥 {streak}</span>
            <span className="l-stat">Lv.{level.level}</span>
            <span className="l-stat">🪙 {state.coins}</span>
          </div>
        </div>
      </header>
      <nav className="l-tabs" aria-label={t("nav.main")}>
        {tabs.map((tab) => (
          <Link key={tab.path} className="l-tab" href={href(tab.path)} aria-current={pathname.endsWith(tab.path) ? "page" : undefined}>
            <span className="l-tab-ico" aria-hidden="true">{tab.icon}</span>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              <span>{tab.label}</span>
              {tab.secLabel && <span style={{ fontSize: "0.75em", opacity: 0.85, lineHeight: 1 }}>{tab.secLabel}</span>}
            </span>
          </Link>
        ))}
      </nav>
      <main id="main" className="l-main">{ready ? children : <div className="l-wrap" role="status">{t("common.loading")}</div>}</main>
      <ThinkOffer />
    </>
  );
}

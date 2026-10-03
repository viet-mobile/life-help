"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { dayKey } from "@/lib/learn/domain/dates";
import { levelProgress } from "@/lib/learn/domain/level";
import { displayStreak } from "@/lib/learn/domain/streak";
import { BrandLogo } from "./BrandLogo";
import { LocaleSwitch } from "./LocaleSwitch";
import { useLearner } from "./LearnerProvider";

const FOCUS_PATHS = ["/lesson/", "/onboarding", "/diagnostic", "/practice"];

export function PlayShell({ children }: { children: ReactNode }) {
  const { t, href, site, state, ready } = useLearner();
  const pathname = usePathname();
  const focus = FOCUS_PATHS.some((p) => pathname.includes(p));
  const level = levelProgress(state.totalXp);
  const streak = ready ? displayStreak(state.streak, dayKey(new Date())) : 0;

  const tabs = [
    { path: "/dashboard", icon: "🏠", label: t("nav.home") },
    { path: "/learn", icon: "🗺️", label: t("nav.learn") },
    { path: "/quest", icon: "📜", label: t("nav.quest") },
    { path: "/profile", icon: "🙂", label: t("nav.profile") },
  ];

  if (focus) return <main id="main" className="l-main">{children}</main>;

  return (
    <>
      <a className="l-skip" href="#main">{t("nav.skip")}</a>
      <header className="l-topbar">
        <div className="l-topbar-inner">
          <Link className="l-brand" href={href("/dashboard")}><BrandLogo site={site} name={site === "math" ? t("brand.math") : t("brand.english")} /></Link>
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
            {tab.label}
          </Link>
        ))}
      </nav>
      <main id="main" className="l-main">{ready ? children : <div className="l-wrap" role="status">{t("common.loading")}</div>}</main>
    </>
  );
}

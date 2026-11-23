"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DailyInsight, DomainType, getInsightLocaleData, getDailyInsight, resolveActionLink } from "@/lib/learn/dailyInsights";
import { buildLearnUrl } from "@/lib/learn/hosts";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { useOptionalSite } from "./LearnerProvider";
import type { Locale } from "@/messages/registry";
import type { Site } from "@/lib/learn/types";
import { HangeulCalligraphyIcon } from "./HangeulCalligraphyIcon";
import { getOfficialWebsiteBadge } from "@/lib/learn/dailyInsights/officialWebsiteI18n";

interface DailyInsightCardProps {
  domain: DomainType;
  insight: DailyInsight;
  locale?: string;
  secondaryLocales?: string[];
  className?: string;
}

const DOMAIN_SLOGANS: Record<DomainType, { labelKo: string; labelEn: string; icon: React.ReactNode; themeColor: string; bgSoft: string; borderSoft: string }> = {
  math: {
    labelKo: "당신의 인생에 도움이 되는 수학",
    labelEn: "Math that helps your life",
    icon: "➗",
    themeColor: "text-emerald-700",
    bgSoft: "bg-emerald-50/90",
    borderSoft: "border-emerald-200",
  },
  english: {
    labelKo: "당신의 인생에 도움이 되는 영어",
    labelEn: "English that helps your life",
    icon: "🔤",
    themeColor: "text-sky-700",
    bgSoft: "bg-sky-50/90",
    borderSoft: "border-sky-200",
  },
  korean: {
    labelKo: "당신의 인생에 도움이 되는 한국어",
    labelEn: "Korean that helps your life",
    icon: <HangeulCalligraphyIcon className="w-5 h-5" />,
    themeColor: "text-violet-700",
    bgSoft: "bg-violet-50/90",
    borderSoft: "border-violet-200",
  },
  life: {
    labelKo: "당신의 인생에 도움이 되는 생활정보",
    labelEn: "Life information that helps your life",
    icon: "💡",
    themeColor: "text-amber-700",
    bgSoft: "bg-amber-50/90",
    borderSoft: "border-amber-200",
  },
  physics: {
    labelKo: "당신의 인생에 도움이 되는 물리",
    labelEn: "Physics that helps your life",
    icon: "🔬",
    themeColor: "text-indigo-700",
    bgSoft: "bg-indigo-50/90",
    borderSoft: "border-indigo-200",
  },
  chemistry: {
    labelKo: "당신의 인생에 도움이 되는 화학",
    labelEn: "Chemistry that helps your life",
    icon: "🧪",
    themeColor: "text-teal-700",
    bgSoft: "bg-teal-50/90",
    borderSoft: "border-teal-200",
  },
};

function getClientSecondaryLocales(pathOverride?: string): { isBilingual: boolean; secondaryLocale: string | null; secondaryLocales: string[] } {
  if (typeof window === "undefined") return { isBilingual: false, secondaryLocale: null, secondaryLocales: [] };
  const path = pathOverride || window.location.pathname;
  const fromPath = splitLocalePrefix(path).secondaryLocales || [];
  if (fromPath.length > 0) {
    return { isBilingual: true, secondaryLocale: fromPath[0], secondaryLocales: fromPath };
  }
  const mode = document.cookie.match(/life_help_display_mode=([^;]+)/)?.[1];
  const sec = document.cookie.match(/life_help_secondary_locale=([^;]+)/)?.[1] ?? null;
  const multiStr = document.cookie.match(/life_help_secondary_locales=([^;]+)/)?.[1];
  const multi = multiStr ? multiStr.split(/[,+]/).filter(Boolean) : (sec ? [sec] : []);
  return {
    isBilingual: mode === "bilingual" || mode === "multilingual" || multi.length > 0 || !!sec,
    secondaryLocale: sec || (multi[0] ?? null),
    secondaryLocales: multi,
  };
}

export function DailyInsightCard({
  domain,
  insight: initialInsight,
  locale: propLocale = "ko",
  secondaryLocales: propSecondaryLocales,
  className = "",
}: DailyInsightCardProps) {
  const optionalSite = useOptionalSite();
  const [mounted, setMounted] = useState(false);
  const [clientSec, setClientSec] = useState(() => getClientSecondaryLocales());
  const [copied, setCopied] = useState(false);
  const [randomSeed, setRandomSeed] = useState<number | null>(null);
  const [tipOverlays, setTipOverlays] = useState<Record<string, Record<string, { title?: string; summary?: string; principle?: string; example?: string; actionItem?: string }>>>({});

  useEffect(() => {
    setMounted(true);
    setClientSec(getClientSecondaryLocales());
    // Every visit and subject tab switch selects a fresh randomized topic
    setRandomSeed(Math.floor(Math.random() * 366));

    const handleSync = () => {
      setClientSec(getClientSecondaryLocales());
    };
    window.addEventListener("life_help_secondary_locale_change", handleSync);
    window.addEventListener("life_help_display_mode_change", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("life_help_secondary_locale_change", handleSync);
      window.removeEventListener("life_help_display_mode_change", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [domain]);



  // During SSR and first client frame, use propLocale to ensure 0 hydration mismatch.
  // Immediately after mounting, use live propLocale and randomized seed.
  const activeLocale = propLocale;
  const isKo = activeLocale === "ko";
  const locData = getInsightLocaleData(activeLocale);
  const domainMeta = DOMAIN_SLOGANS[domain] || DOMAIN_SLOGANS.life;

  const baseInsight = mounted && randomSeed !== null
    ? getDailyInsight(domain, randomSeed, activeLocale)
    : initialInsight;

  const activeOverlay = (domain === "physics" || domain === "chemistry") ? tipOverlays[activeLocale]?.[baseInsight.id] : null;
  const insight = activeOverlay
    ? {
        ...baseInsight,
        title: activeOverlay.title || baseInsight.title,
        summary: activeOverlay.summary || baseInsight.summary,
        principle: activeOverlay.principle || baseInsight.principle,
        example: activeOverlay.example || baseInsight.example,
        actionItem: activeOverlay.actionItem || baseInsight.actionItem,
      }
    : baseInsight;

  const officialLink = resolveActionLink(insight);

  const effectiveSecondaryLocales: Locale[] = useMemo(() => {
    const list = propSecondaryLocales && propSecondaryLocales.length > 0
      ? (propSecondaryLocales as Locale[])
      : (optionalSite?.secondaryLocales && optionalSite.secondaryLocales.length > 0
          ? (optionalSite.secondaryLocales as Locale[])
          : (clientSec.secondaryLocales as Locale[]));

    if (list && list.length > 0) {
      const filtered = list.filter((l): l is Locale => l !== activeLocale);
      if (filtered.length > 0) return filtered;
    }
    if (clientSec.secondaryLocale && clientSec.secondaryLocale !== activeLocale) {
      return [clientSec.secondaryLocale as Locale];
    }
    if (clientSec.isBilingual && !isKo) {
      return ["ko" as Locale];
    }
    return [];
  }, [propSecondaryLocales, optionalSite, clientSec, activeLocale, isKo]);

  // Dynamically load static 88-language daily tips overlay for physics and chemistry
  useEffect(() => {
    if (!mounted) return;
    const neededLocales = [activeLocale, ...effectiveSecondaryLocales].filter(Boolean);
    neededLocales.forEach((loc) => {
      if (tipOverlays[loc]) return;
      fetch(`/daily-tips/${loc}.json`).then((r) => r.ok ? r : fetch(`/learn-content/daily-tips/${loc}.json`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data === "object") {
            setTipOverlays((prev) => ({ ...prev, [loc]: data }));
          }
        })
        .catch(() => {});
    });
  }, [mounted, activeLocale, effectiveSecondaryLocales]);

  const isBilingual = clientSec.isBilingual || effectiveSecondaryLocales.length > 0;

  const secondaryInsights: { locale: Locale; insight: DailyInsight }[] = useMemo(() => {
    if (!mounted || effectiveSecondaryLocales.length === 0) return [];
    return effectiveSecondaryLocales.map((loc: Locale) => {
      const rawSec = getDailyInsight(domain, baseInsight.id, loc);
      const secOv = (domain === "physics" || domain === "chemistry") ? tipOverlays[loc]?.[rawSec.id] : null;
      const mergedSec = secOv
        ? {
            ...rawSec,
            title: secOv.title || rawSec.title,
            summary: secOv.summary || rawSec.summary,
            principle: secOv.principle || rawSec.principle,
            example: secOv.example || rawSec.example,
            actionItem: secOv.actionItem || rawSec.actionItem,
          }
        : rawSec;
      return { locale: loc, insight: mergedSec };
    });
  }, [mounted, effectiveSecondaryLocales, domain, baseInsight.id, randomSeed, tipOverlays]);

  // Tagline from locale data (covers 89 languages) or fallback
  const domainTagline = locData?.brand_taglines?.[domain]?.tagline;
  const displayDomainLabel =
    domainTagline ||
    (isKo ? domainMeta.labelKo : (domainMeta.labelEn || domainMeta.labelKo));

  const displayCategory = insight.categoryLabel || locData?.ui_labels?.categories?.[insight.category as keyof typeof locData.ui_labels.categories] || insight.categoryLabelKo;

  const uiCardTitle = locData?.ui_labels?.card_title || (isKo ? "오늘의 추천" : "Today's Pick");
  const uiPrincipleTitle = locData?.ui_labels?.principle_title || (isKo ? "핵심 원리 & 실천 공식" : "Core Principle & Practical Formula");
  const uiActionTitle = locData?.ui_labels?.action_title || (isKo ? "오늘 바로 실천할 행동 (Action Item)" : "One Action for Today (Action Item)");
  const uiLearnMore = locData?.ui_labels?.btn_learn_more || (isKo ? "관련 탐험 바로가기" : "Explore Subject");
  const uiCopied = locData?.ui_labels?.btn_copied || (isKo ? "✓ 복사됨" : "✓ Copied");
  const uiCopy = locData?.ui_labels?.btn_copy || (isKo ? "📋 팁 공유" : "📋 Share Tip");
  const uiOfficialWebsite = locData?.ui_labels?.btn_official_website || getOfficialWebsiteBadge(activeLocale);

  const getDomainRelatedText = () => {
    if (domain === "life") {
      if (isKo) return "생활 지원 서비스 둘러보기";
      if (activeLocale === "vi") return "Khám phá dịch vụ đời sống";
      if (activeLocale === "zh-Hans" || activeLocale === "zs") return "探索生活支持服务";
      if (activeLocale === "zh-Hant" || activeLocale === "zt") return "探索生活支持服務";
      if (activeLocale === "ja") return "生活サポートサービスを見る";
      if (activeLocale === "ru") return "Службы бытовой поддержки";
      if (activeLocale === "uz") return "Hayotiy yordam xizmatlari";
      return locData?.ui_labels?.btn_learn_more || "Explore Life Support Services";
    }
    return locData?.ui_labels?.btn_learn_more || insight.relatedServiceOrWorld || (isKo ? "관련 탐험 바로가기" : "Explore Subject");
  };
  const displayRelatedText = getDomainRelatedText();

  const catalogHref = activeLocale && activeLocale !== "ko"
    ? `/${activeLocale}/insights/${domain}`
    : `/insights/${domain}`;

  let targetHref = "/services";
  if (domain === "life") {
    targetHref = activeLocale && activeLocale !== "ko" ? `/${activeLocale}/services` : "/services";
  } else {
    if (insight.relatedHref && insight.relatedHref !== "/services") {
      targetHref = activeLocale && activeLocale !== "ko" ? `/${activeLocale}${insight.relatedHref}` : insight.relatedHref;
    } else {
      if (typeof window !== "undefined") {
        targetHref = buildLearnUrl(domain as Site, window.location.host, activeLocale);
      } else {
        targetHref = `/study/${domain}`;
      }
    }
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = domain === "life" ? "https://life.help" : `https://${domain}.life.help`;
      const shareText = `[${displayDomainLabel}] ${insight.title}\n\n${insight.summary}\n${uiPrincipleTitle}: ${insight.principle}\n${uiActionTitle}: ${insight.actionItem}\n\n👉 ${shareUrl}`;
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <article
      data-testid={`daily-insight-${domain}`}
      suppressHydrationWarning
      className={`droplet-card border ${domainMeta.borderSoft} ${domainMeta.bgSoft} p-4 sm:p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      {/* Header Badge & Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <Link
          href={catalogHref}
          className="group flex items-center gap-2 transition hover:opacity-85 cursor-pointer"
          title={isKo ? `${displayDomainLabel} 전체 정보 바로가기` : `Explore all of ${displayDomainLabel}`}
        >
          <span className="flex h-7 w-7 items-center justify-center droplet-icon bg-white shadow-2xs text-base group-hover:scale-110 transition-transform" aria-hidden="true">
            {domainMeta.icon}
          </span>
          <span suppressHydrationWarning className={`text-xs sm:text-sm font-black ${domainMeta.themeColor} group-hover:underline flex items-center gap-1`}>
            <span>{displayDomainLabel}</span>
            <span className="text-[11px] text-slate-400 group-hover:text-blue-600 transition" aria-hidden="true">→</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 droplet-pill bg-white/95 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
            <span>{insight.categoryIcon}</span>
            <span suppressHydrationWarning>{displayCategory}</span>
          </span>
          <span suppressHydrationWarning className="text-[11px] font-semibold text-slate-500 hidden xs:inline">
            {uiCardTitle}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-3.5 space-y-2.5">
        <div>
          <h3 suppressHydrationWarning className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {insight.title}
          </h3>
          {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
            secInsight?.title && (secInsight.title !== insight.title || secLoc !== activeLocale) ? (
              <p key={secLoc} suppressHydrationWarning className="mt-1 text-xs sm:text-sm font-bold text-slate-500 flex items-baseline gap-1.5">
                {effectiveSecondaryLocales.length > 1 && (
                  <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {secLoc}
                  </span>
                )}
                <span>{secInsight.title}</span>
              </p>
            ) : null
          ))}
        </div>

        <div>
          <p suppressHydrationWarning className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
            {insight.summary}
          </p>
          {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
            secInsight?.summary && (secInsight.summary !== insight.summary || secLoc !== activeLocale) ? (
              <p key={secLoc} suppressHydrationWarning className="mt-1 text-xs text-slate-500 font-medium leading-relaxed flex items-baseline gap-1.5">
                {effectiveSecondaryLocales.length > 1 && (
                  <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {secLoc}
                  </span>
                )}
                <span>{secInsight.summary}</span>
              </p>
            ) : null
          ))}
        </div>

        {/* Principle / Formula Box */}
        <div className="droplet-card border border-white/80 bg-white/90 p-3 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>📌</span>
            <span suppressHydrationWarning>{uiPrincipleTitle}</span>
            {isBilingual && effectiveSecondaryLocales.length > 0 && (
              <span className="text-[10px] text-slate-400 font-normal">
                · {effectiveSecondaryLocales.includes("ko") ? "핵심 원리" : "Core Principle"}
              </span>
            )}
          </div>
          <div suppressHydrationWarning className="text-xs sm:text-sm font-extrabold text-slate-900">
            {insight.principle}
          </div>
          {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
            secInsight?.principle && (secInsight.principle !== insight.principle || secLoc !== activeLocale) ? (
              <p key={secLoc} suppressHydrationWarning className="text-xs font-semibold text-slate-500 flex items-baseline gap-1.5">
                {effectiveSecondaryLocales.length > 1 && (
                  <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {secLoc}
                  </span>
                )}
                <span>{secInsight.principle}</span>
              </p>
            ) : null
          ))}
          <p suppressHydrationWarning className="text-xs text-slate-600 font-medium">
            {insight.example}
          </p>
          {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
            secInsight?.example && (secInsight.example !== insight.example || secLoc !== activeLocale) ? (
              <p key={`${secLoc}-example`} suppressHydrationWarning className="text-xs font-normal text-slate-500 flex items-baseline gap-1.5">
                {effectiveSecondaryLocales.length > 1 && (
                  <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {secLoc}
                  </span>
                )}
                <span>{secInsight.example}</span>
              </p>
            ) : null
          ))}
        </div>

        {/* Action Item Box */}
        {officialLink ? (
          <a
            href={officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="droplet-card group block bg-slate-900 p-3 text-white shadow-sm transition hover:bg-slate-800 hover:ring-2 hover:ring-blue-400 cursor-pointer active:scale-[0.99]"
            title={isKo ? "공식 사이트로 이동" : "Visit official authoritative website"}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-sm shrink-0 mt-0.5">🎯</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span suppressHydrationWarning className="block text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    {uiActionTitle}
                    {isBilingual && effectiveSecondaryLocales.length > 0 && (
                      <span className="ml-1 text-[9px] text-amber-400/80 font-normal">
                        · {effectiveSecondaryLocales.includes("ko") ? "오늘 실천 행동" : "Action Item"}
                      </span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-blue-600/90 group-hover:bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white transition shrink-0 shadow-2xs">
                    <span suppressHydrationWarning>{uiOfficialWebsite}</span>
                    <span aria-hidden="true">↗</span>
                  </span>
                </div>
                <span suppressHydrationWarning className="block text-xs sm:text-sm font-semibold text-slate-100 mt-1 group-hover:text-blue-100 transition">
                  {insight.actionItem}
                </span>
                {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
                  secInsight?.actionItem && (secInsight.actionItem !== insight.actionItem || secLoc !== activeLocale) ? (
                    <span key={secLoc} suppressHydrationWarning className="block text-xs font-medium text-amber-200/90 mt-1 flex items-baseline gap-1.5">
                      {effectiveSecondaryLocales.length > 1 && (
                        <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30 shrink-0">
                          {secLoc}
                        </span>
                      )}
                      <span>{secInsight.actionItem}</span>
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          </a>
        ) : (
          <div className="droplet-card bg-slate-900 p-3 text-white flex items-start gap-2.5 shadow-sm">
            <span className="text-sm shrink-0 mt-0.5">🎯</span>
            <div className="min-w-0 flex-1">
              <span suppressHydrationWarning className="block text-[10px] font-black uppercase text-amber-300 tracking-wider">
                {uiActionTitle}
                {isBilingual && effectiveSecondaryLocales.length > 0 && (
                  <span className="ml-1 text-[9px] text-amber-400/80 font-normal">
                    · {effectiveSecondaryLocales.includes("ko") ? "오늘 실천 행동" : "Action Item"}
                  </span>
                )}
              </span>
              <span suppressHydrationWarning className="block text-xs sm:text-sm font-semibold text-slate-100 mt-0.5">
                {insight.actionItem}
              </span>
              {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
                secInsight?.actionItem && (secInsight.actionItem !== insight.actionItem || secLoc !== activeLocale) ? (
                  <span key={secLoc} suppressHydrationWarning className="block text-xs font-medium text-amber-200/90 mt-1 flex items-baseline gap-1.5">
                    {effectiveSecondaryLocales.length > 1 && (
                      <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30 shrink-0">
                        {secLoc}
                      </span>
                    )}
                    <span>{secInsight.actionItem}</span>
                  </span>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
        {targetHref ? (
          <Link
            href={targetHref}
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer"
          >
            <span suppressHydrationWarning>{displayRelatedText}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleShare}
          className="droplet-btn inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
        >
          <span suppressHydrationWarning>{copied ? uiCopied : uiCopy}</span>
        </button>
      </div>
    </article>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DailyInsight, DomainType, getInsightLocaleData, getDailyInsight } from "@/lib/learn/dailyInsights";
import { studyUrl, StudySubject } from "@/lib/home/studyHosts";
import type { Locale } from "@/messages/registry";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface DailyInsightCardProps {
  domain: DomainType;
  insight: DailyInsight;
  locale?: string;
  className?: string;
}

const DOMAIN_SLOGANS: Record<DomainType, { labelKo: string; labelEn: string; icon: string; themeColor: string; bgSoft: string; borderSoft: string }> = {
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
    icon: "🇰🇷",
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

export function DailyInsightCard({ domain, insight: initialInsight, locale: propLocale = "ko", className = "" }: DailyInsightCardProps) {
  const { locale: contextLocale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and first client frame, use propLocale to ensure 0 hydration mismatch.
  // Immediately after mounting, use live contextLocale from the user's active UI selection.
  const activeLocale = mounted ? (contextLocale || propLocale) : propLocale;
  const isKo = activeLocale === "ko";
  const locData = getInsightLocaleData(activeLocale);
  const domainMeta = DOMAIN_SLOGANS[domain] || DOMAIN_SLOGANS.life;

  const insight = mounted
    ? getDailyInsight(domain, new Date(), activeLocale)
    : initialInsight;

  // Tagline from locale data (covers 89 languages) or fallback
  const domainTagline = locData?.brand_taglines?.[domain]?.tagline;
  const displayDomainLabel =
    domainTagline ||
    (isKo ? domainMeta.labelKo : (domainMeta.labelEn || domainMeta.labelKo));

  const displayCategory = insight.categoryLabel || locData?.ui_labels?.categories?.[insight.category as keyof typeof locData.ui_labels.categories] || insight.categoryLabelKo;

  const uiCardTitle = locData?.ui_labels?.card_title || (isKo ? "오늘의 추천" : "Today's Pick");
  const uiPrincipleTitle = locData?.ui_labels?.principle_title || (isKo ? "핵심 원리 & 실천 공식" : "Core Principle & Practical Formula");
  const uiActionTitle = locData?.ui_labels?.action_title || (isKo ? "오늘 바로 실천할 행동 (Action Item)" : "One Action for Today (Action Item)");
  const uiLearnMore = locData?.ui_labels?.btn_learn_more || (isKo ? "자세히 알아보기" : "Learn more");
  const uiCopied = locData?.ui_labels?.btn_copied || (isKo ? "✓ 복사됨" : "✓ Copied");
  const uiCopy = locData?.ui_labels?.btn_copy || (isKo ? "📋 팁 공유" : "📋 Share Tip");

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
    return insight.relatedServiceOrWorld || locData?.ui_labels?.btn_learn_more || (isKo ? "자세히 알아보기" : "Learn more");
  };
  const displayRelatedText = getDomainRelatedText();

  const targetHref =
    domain === "life"
      ? (activeLocale && activeLocale !== "ko" ? `/${activeLocale}/services` : "/services")
      : (activeLocale && activeLocale !== "ko" ? `/${activeLocale}${insight.relatedHref}` : (insight.relatedHref || "/services"));

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareText = `[${displayDomainLabel}] ${insight.title}\n\n${insight.summary}\n${uiPrincipleTitle}: ${insight.principle}\n${uiActionTitle}: ${insight.actionItem}\nLIFE.HELP`;
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
      className={`rounded-2xl border ${domainMeta.borderSoft} ${domainMeta.bgSoft} p-4 sm:p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      {/* Header Badge & Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs text-base" aria-hidden="true">
            {domainMeta.icon}
          </span>
          <span suppressHydrationWarning className={`text-xs sm:text-sm font-black ${domainMeta.themeColor}`}>
            {displayDomainLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
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
        <h3 suppressHydrationWarning className="text-base sm:text-lg font-black text-slate-900 leading-snug">
          {insight.title}
        </h3>
        <p suppressHydrationWarning className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
          {insight.summary}
        </p>

        {/* Principle / Formula Box */}
        <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>📌</span>
            <span suppressHydrationWarning>{uiPrincipleTitle}</span>
          </div>
          <div suppressHydrationWarning className="text-xs sm:text-sm font-extrabold text-slate-900">
            {insight.principle}
          </div>
          <p suppressHydrationWarning className="text-xs text-slate-600 font-medium">
            {insight.example}
          </p>
        </div>

        {/* Action Item Box */}
        <div className="rounded-xl bg-slate-900 p-3 text-white flex items-start gap-2.5 shadow-sm">
          <span className="text-sm shrink-0 mt-0.5">🎯</span>
          <div className="min-w-0 flex-1">
            <span suppressHydrationWarning className="block text-[10px] font-black uppercase text-amber-300 tracking-wider">
              {uiActionTitle}
            </span>
            <span suppressHydrationWarning className="block text-xs sm:text-sm font-semibold text-slate-100 mt-0.5">
              {insight.actionItem}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
        {targetHref ? (
          <Link
            href={targetHref}
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
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
        >
          <span suppressHydrationWarning>{copied ? uiCopied : uiCopy}</span>
        </button>
      </div>
    </article>
  );
}

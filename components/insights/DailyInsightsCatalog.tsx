"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { HangeulCalligraphyIcon } from "@/components/shared/HangeulCalligraphyIcon";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { DomainType, DailyInsight } from "@/lib/learn/dailyInsights/types";
import { getDailyInsight } from "@/lib/learn/dailyInsights/engine";
import { resolveActionLink } from "@/lib/learn/dailyInsights/actionLinkMap";
import { getOfficialWebsiteBadge } from "@/lib/learn/dailyInsights/officialWebsiteI18n";
import { getInsightLocaleData } from "@/lib/learn/dailyInsights/localesData";
import { getCatalogI18n } from "@/lib/learn/dailyInsights/catalogI18n";
import type { Locale } from "@/messages/registry";

interface DailyInsightsCatalogProps {
  initialDomain?: DomainType;
}

const DOMAIN_CONFIG: {
  id: DomainType;
  labelKo: string;
  labelEn: string;
  icon: React.ReactNode;
  themeColor: string;
  badgeBg: string;
}[] = [
  {
    id: "korean",
    labelKo: "한국어",
    labelEn: "Korean",
    icon: <HangeulCalligraphyIcon className="w-4 h-4" />,
    themeColor: "text-violet-700",
    badgeBg: "bg-violet-100 text-violet-800",
  },
  {
    id: "english",
    labelKo: "영어",
    labelEn: "English",
    icon: "🔤",
    themeColor: "text-sky-700",
    badgeBg: "bg-sky-100 text-sky-800",
  },
  {
    id: "math",
    labelKo: "수학",
    labelEn: "Math",
    icon: "➗",
    themeColor: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "physics",
    labelKo: "물리",
    labelEn: "Physics",
    icon: "🔬",
    themeColor: "text-indigo-700",
    badgeBg: "bg-indigo-100 text-indigo-800",
  },
  {
    id: "chemistry",
    labelKo: "화학",
    labelEn: "Chemistry",
    icon: "🧪",
    themeColor: "text-teal-700",
    badgeBg: "bg-teal-100 text-teal-800",
  },
  {
    id: "life",
    labelKo: "생활정보",
    labelEn: "Life Info",
    icon: "💡",
    themeColor: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-800",
  },
];

export function DailyInsightsCatalog({ initialDomain = "korean" }: DailyInsightsCatalogProps) {
  const { locale, t, isBilingual, secondaryLocale, secondaryLocales } = useLocale();
  const [selectedDomain, setSelectedDomain] = useState<DomainType>(initialDomain);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isKo = locale === "ko";
  const locData = getInsightLocaleData(locale);
  const catalogI18n = getCatalogI18n(locale);

  const effectiveSecondaryLocales: Locale[] = useMemo(() => {
    if (!isBilingual) return [];
    if (secondaryLocales && secondaryLocales.length > 0) {
      return secondaryLocales.filter((l): l is Locale => l !== locale);
    }
    if (secondaryLocale && secondaryLocale !== locale) {
      return [secondaryLocale];
    }
    if (!isKo) {
      return ["ko" as Locale];
    }
    return [];
  }, [isBilingual, secondaryLocales, secondaryLocale, locale, isKo]);

  // Load all 366 insights for the selected domain
  const domainItems: { index: number; insight: DailyInsight; secondaryInsights: { locale: Locale; insight: DailyInsight }[] }[] = useMemo(() => {
    const list = [];
    for (let i = 0; i < 366; i++) {
      const insight = getDailyInsight(selectedDomain, i, locale);
      const secList = effectiveSecondaryLocales.map((secLoc) => ({
        locale: secLoc,
        insight: getDailyInsight(selectedDomain, i, secLoc),
      }));
      list.push({ index: i, insight, secondaryInsights: secList });
    }
    return list;
  }, [selectedDomain, locale, effectiveSecondaryLocales]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    domainItems.forEach(({ insight }) => {
      if (insight.category) set.add(insight.category);
    });
    return Array.from(set);
  }, [domainItems]);

  // Filtered insights based on search query and category
  const filteredItems = useMemo(() => {
    return domainItems.filter(({ insight, index }) => {
      if (selectedCategory !== "all" && insight.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const dayNum = String(index + 1);
      return (
        dayNum.includes(q) ||
        insight.title.toLowerCase().includes(q) ||
        insight.summary.toLowerCase().includes(q) ||
        insight.principle.toLowerCase().includes(q) ||
        insight.actionItem.toLowerCase().includes(q) ||
        (insight.categoryLabel && insight.categoryLabel.toLowerCase().includes(q))
      );
    });
  }, [domainItems, selectedCategory, searchQuery]);

  const handleCopy = (item: DailyInsight, index: number) => {
    const shareText = `[Day ${index + 1} · ${item.title}]\n\n${item.summary}\n📌 ${item.principle}\n🎯 ${item.actionItem}\n\n👉 https://life.help/insights/${selectedDomain}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const currentDomainMeta = DOMAIN_CONFIG.find((d) => d.id === selectedDomain) || DOMAIN_CONFIG[0];
  const uiOfficialWebsite = locData?.ui_labels?.btn_official_website || getOfficialWebsiteBadge(locale);

  const catalogTitle = catalogI18n.catalogTitle;
  const catalogSubtitle = catalogI18n.catalogSubtitle;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-85 transition">
              <BrandLogo size="sm" />
              <span className="text-base font-black tracking-tight text-slate-900">LIFE.HELP</span>
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-slate-300" />
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
            >
              <span>←</span>
              <span>{catalogI18n.home.replace("←", "").trim()}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-slate-200 bg-linear-to-b from-white to-slate-100/60 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white shadow-2xs mb-3">
            <span>✨</span>
            <span>{catalogI18n.catalogBadge}</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {catalogTitle}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium max-w-3xl leading-relaxed">
            {catalogSubtitle}
          </p>

          {/* 6-Domain Selection Tabs */}
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1">
            {DOMAIN_CONFIG.map((d) => {
              const isSelected = selectedDomain === d.id;
              const label = isKo
                ? d.labelKo
                : (d.id === "korean" ? (t("customer.domain_korean") || d.labelEn)
                  : d.id === "english" ? (t("customer.domain_english") || d.labelEn)
                  : d.id === "math" ? (t("customer.domain_math") || d.labelEn)
                  : d.id === "physics" ? (t("customer.domain_physics") || d.labelEn)
                  : d.id === "chemistry" ? (t("customer.domain_chemistry") || d.labelEn)
                  : (t("customer.domain_life") || d.labelEn));
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDomain(d.id);
                    setSelectedCategory("all");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap shadow-2xs ${
                    isSelected
                      ? "bg-slate-900 text-white ring-2 ring-slate-900"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    366
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Search & Filter Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={catalogI18n.searchPlaceholder}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pl-9 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-hidden shadow-2xs"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {catalogI18n.allCategories} ({domainItems.length})
            </button>
            {categories.map((cat) => {
              const catLabel = catalogI18n.categories[cat] || cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {catLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>
            {catalogI18n.formatTipsFound(
              filteredItems.length,
              isKo ? currentDomainMeta.labelKo : (t(`customer.domain_${currentDomainMeta.id}`) || currentDomainMeta.labelEn)
            )}
          </span>
        </div>

        {/* Catalog Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(({ index, insight, secondaryInsights }) => {
            const officialLink = resolveActionLink(insight);
            const isCopied = copiedId === insight.id;

            return (
              <div
                key={insight.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md transition"
              >
                <div>
                  {/* Top Header: Day Number & Category */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white">
                      <span>{catalogI18n.dayLabel(index + 1)}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      <span>{insight.categoryIcon || "💡"}</span>
                      <span>{catalogI18n.categories[insight.category] || insight.categoryLabel || insight.categoryLabelKo || insight.category}</span>
                    </span>
                  </div>

                  {/* Title & Secondary Title */}
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    {insight.title}
                  </h3>
                  {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
                    secInsight?.title && secInsight.title !== insight.title ? (
                      <p key={secLoc} className="mt-0.5 text-xs font-bold text-slate-500">
                        {secInsight.title}
                      </p>
                    ) : null
                  ))}

                  {/* Summary */}
                  <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                    {insight.summary}
                  </p>

                  {/* Principle Box */}
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      📌 {catalogI18n.corePrinciple}
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {insight.principle}
                    </div>
                    {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
                      secInsight?.principle && secInsight.principle !== insight.principle ? (
                        <p key={secLoc} className="text-[11px] font-medium text-slate-500">
                          {secInsight.principle}
                        </p>
                      ) : null
                    ))}
                    {insight.example && (
                      <p className="text-[11px] text-slate-500 font-normal">
                        {insight.example}
                      </p>
                    )}
                  </div>

                  {/* Action Item Box */}
                  <div className="mt-2.5 rounded-xl border border-slate-800/10 bg-slate-900 p-2.5 text-white">
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      🎯 {catalogI18n.actionItem}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-100 leading-snug">
                      {insight.actionItem}
                    </div>
                    {isBilingual && secondaryInsights.map(({ locale: secLoc, insight: secInsight }) => (
                      secInsight?.actionItem && secInsight.actionItem !== insight.actionItem ? (
                        <p key={secLoc} className="mt-0.5 text-[11px] font-medium text-slate-300">
                          {secInsight.actionItem}
                        </p>
                      ) : null
                    ))}
                  </div>
                </div>

                {/* Footer Buttons: Official Link & Copy */}
                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  {officialLink ? (
                    <a
                      href={officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      <span>🏛️</span>
                      <span>{uiOfficialWebsite}</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopy(insight, index)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>{isCopied ? "✓" : "📋"}</span>
                    <span>{isCopied ? catalogI18n.copied : catalogI18n.share}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <p className="text-sm font-bold">
              {catalogI18n.noResults}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

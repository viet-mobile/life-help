"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { getRegionUIText } from "@/lib/region/regionLocalization";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { DesktopShortcutButton } from "@/components/shared/DesktopShortcutButton";

export interface ServiceItem {
  id: string;
  category: "repair" | "support";
  icon: string;
  key: string;
  slug: string;
  pathPrefix: "services" | "support";
  ko: string;
  colorName: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  textColor: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  badgeLabelKo: string;
}

// 10 Core Services with distinct subtle pastel color codes (순서: 자주-분홍-주황-노랑-연두-민트-하늘-파랑-네이비-보라)
const allServices: ServiceItem[] = [
  // 1. 자주 (Pastel Magenta / Plum) - 구인/주거계약
  {
    id: "jobHelp",
    category: "support",
    icon: "💼",
    key: "jobHelp",
    slug: "job-help",
    pathPrefix: "support",
    ko: "구인/구직 도움",
    colorName: "자주",
    cardBg: "bg-fuchsia-50/85",
    cardBorder: "border-fuchsia-200/90",
    cardHover: "hover:border-fuchsia-400 hover:bg-fuchsia-100/90",
    textColor: "text-fuchsia-950",
    iconBg: "bg-fuchsia-100/80 text-fuchsia-700",
    badgeBg: "bg-fuchsia-100/90",
    badgeText: "text-fuchsia-900",
    btnBg: "bg-fuchsia-700 hover:bg-fuchsia-800",
    badgeLabelKo: "구인·구직",
  },
  // 2. 분홍 (Pastel Pink / Rose) - 통신/휴대폰
  {
    id: "mobileHelp",
    category: "support",
    icon: "📱",
    key: "mobileHelp",
    slug: "mobile-help",
    pathPrefix: "support",
    ko: "이동전화 개통 도움",
    colorName: "분홍",
    cardBg: "bg-pink-50/85",
    cardBorder: "border-pink-200/90",
    cardHover: "hover:border-pink-400 hover:bg-pink-100/90",
    textColor: "text-pink-950",
    iconBg: "bg-pink-100/80 text-pink-700",
    badgeBg: "bg-pink-100/90",
    badgeText: "text-pink-900",
    btnBg: "bg-pink-600 hover:bg-pink-700",
    badgeLabelKo: "휴대폰 개통",
  },
  // 3. 주황 (Pastel Orange / Peach) - 보일러
  {
    id: "boiler",
    category: "repair",
    icon: "♨️",
    key: "boiler",
    slug: "boiler",
    pathPrefix: "services",
    ko: "보일러 설치, 시공, 수리",
    colorName: "주황",
    cardBg: "bg-orange-50/85",
    cardBorder: "border-orange-200/90",
    cardHover: "hover:border-orange-400 hover:bg-orange-100/90",
    textColor: "text-orange-950",
    iconBg: "bg-orange-100/80 text-orange-700",
    badgeBg: "bg-orange-100/90",
    badgeText: "text-orange-900",
    btnBg: "bg-orange-600 hover:bg-orange-700",
    badgeLabelKo: "난방·온수",
  },
  // 4. 노랑 (Pastel Yellow / Cream) - 주거/원룸
  {
    id: "housing",
    category: "repair",
    icon: "🏠",
    key: "housing",
    slug: "housing",
    pathPrefix: "services",
    ko: "원룸/투룸 맞춤 방 구하기",
    colorName: "노랑",
    cardBg: "bg-amber-50/85",
    cardBorder: "border-amber-200/90",
    cardHover: "hover:border-amber-400 hover:bg-amber-100/90",
    textColor: "text-amber-950",
    iconBg: "bg-amber-100/80 text-amber-700",
    badgeBg: "bg-amber-100/90",
    badgeText: "text-amber-900",
    btnBg: "bg-amber-600 hover:bg-amber-700",
    badgeLabelKo: "방 구하기",
  },
  // 5. 연두 (Pastel Lime / Light Green) - 청소
  {
    id: "cleaning",
    category: "repair",
    icon: "🧹",
    key: "cleaning",
    slug: "cleaning",
    pathPrefix: "services",
    ko: "전문 청소 (입주/특수/청결)",
    colorName: "연두",
    cardBg: "bg-lime-50/85",
    cardBorder: "border-lime-200/90",
    cardHover: "hover:border-lime-400 hover:bg-lime-100/90",
    textColor: "text-lime-950",
    iconBg: "bg-lime-100/80 text-lime-800",
    badgeBg: "bg-lime-100/90",
    badgeText: "text-lime-900",
    btnBg: "bg-lime-700 hover:bg-lime-800",
    badgeLabelKo: "정밀 청소",
  },
  // 6. 민트 (Pastel Mint / Teal) - 병원 통역
  {
    id: "hospitalHelp",
    category: "support",
    icon: "🏥",
    key: "hospitalHelp",
    slug: "hospital-help",
    pathPrefix: "support",
    ko: "병원 동행, 통역 도움",
    colorName: "민트",
    cardBg: "bg-teal-50/85",
    cardBorder: "border-teal-200/90",
    cardHover: "hover:border-teal-400 hover:bg-teal-100/90",
    textColor: "text-teal-950",
    iconBg: "bg-teal-100/80 text-teal-700",
    badgeBg: "bg-teal-100/90",
    badgeText: "text-teal-900",
    btnBg: "bg-teal-600 hover:bg-teal-700",
    badgeLabelKo: "병원·통역",
  },
  // 7. 하늘 (Pastel Sky) - 막힘
  {
    id: "clog",
    category: "repair",
    icon: "🚽",
    key: "clog",
    slug: "clog-clearing",
    pathPrefix: "services",
    ko: "변기, 싱크대, 하수구 등 각종 막힘 해결",
    colorName: "하늘",
    cardBg: "bg-sky-50/85",
    cardBorder: "border-sky-200/90",
    cardHover: "hover:border-sky-400 hover:bg-sky-100/90",
    textColor: "text-sky-950",
    iconBg: "bg-sky-100/80 text-sky-700",
    badgeBg: "bg-sky-100/90",
    badgeText: "text-sky-900",
    btnBg: "bg-sky-600 hover:bg-sky-700",
    badgeLabelKo: "긴급 출동",
  },
  // 8. 파랑 (Pastel Blue) - 누수
  {
    id: "leakPlumbing",
    category: "repair",
    icon: "💧",
    key: "leakPlumbing",
    slug: "leak-plumbing",
    pathPrefix: "services",
    ko: "누수 방지, 누수 탐지, 수도 배관 공사 등",
    colorName: "파랑",
    cardBg: "bg-blue-50/85",
    cardBorder: "border-blue-200/90",
    cardHover: "hover:border-blue-400 hover:bg-blue-100/90",
    textColor: "text-blue-950",
    iconBg: "bg-blue-100/80 text-blue-700",
    badgeBg: "bg-blue-100/90",
    badgeText: "text-blue-900",
    btnBg: "bg-blue-600 hover:bg-blue-700",
    badgeLabelKo: "누수 탐지",
  },
  // 9. 네이비 (Pastel Navy / Indigo) - 은행
  {
    id: "bankHelp",
    category: "support",
    icon: "🏦",
    key: "bankHelp",
    slug: "bank-help",
    pathPrefix: "support",
    ko: "은행 계좌 개설 도움",
    colorName: "네이비",
    cardBg: "bg-indigo-50/85",
    cardBorder: "border-indigo-200/90",
    cardHover: "hover:border-indigo-400 hover:bg-indigo-100/90",
    textColor: "text-indigo-950",
    iconBg: "bg-indigo-100/80 text-indigo-700",
    badgeBg: "bg-indigo-100/90",
    badgeText: "text-indigo-900",
    btnBg: "bg-indigo-600 hover:bg-indigo-700",
    badgeLabelKo: "계좌 개설",
  },
  // 10. 보라 (Pastel Purple / Lavender) - 외국인등록/보험
  {
    id: "insuranceHelp",
    category: "support",
    icon: "📑",
    key: "insuranceHelp",
    slug: "insurance-help",
    pathPrefix: "support",
    ko: "보험 가입 도움",
    colorName: "보라",
    cardBg: "bg-purple-50/85",
    cardBorder: "border-purple-200/90",
    cardHover: "hover:border-purple-400 hover:bg-purple-100/90",
    textColor: "text-purple-950",
    iconBg: "bg-purple-100/80 text-purple-700",
    badgeBg: "bg-purple-100/90",
    badgeText: "text-purple-900",
    btnBg: "bg-purple-600 hover:bg-purple-700",
    badgeLabelKo: "보험·체류",
  },
];

const benefits = [
  ["💬", "consultation"],
  ["🛡️", "verified"],
  ["💳", "payment"],
  ["⭐", "review"],
] as const;

export function CustomerHome() {
  const { locale, setLocale, t, tKo, tBilingual, isBilingual, formatBilingual } = useLocale();
  const { formattedRegion, shortRegionText, openModal } = useRegion();
  const headingWeight = locale === "vi" ? "font-bold" : "font-extrabold";

  // Mobile smart tabs: default "all" so that all 10 services are visible on the first screen
  const [activeTab, setActiveTab] = useState<"all" | "repair" | "support">("all");

  const displayedServices =
    activeTab === "all"
      ? allServices
      : allServices.filter((s) => s.category === activeTab);

  const getBadgeText = (key: string, fallback: string) => {
    const badge = t(`serviceBadge.${key}`);
    return badge && !badge.startsWith("serviceBadge.") ? badge : fallback;
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50/45 via-amber-50/25 via-pink-50/25 to-indigo-50/35 text-slate-900 overflow-x-hidden relative selection:bg-blue-100">
      {/* Soft translucent pastel ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-amber-200/25 blur-3xl" />
      </div>

      {/* ① Ultra-Compact Frosted Glass Header (Height ~48px) */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md transition-colors shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2">
          {/* Brand Logo & Region */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center shrink-0 transition-transform active:scale-95"
              title="LIFE.HELP Home"
            >
              <BrandLogo size="sm" priority />
            </Link>

            {/* Compact Region Droplet Pill Button */}
            <button
              type="button"
              onClick={openModal}
              className="droplet-pill inline-flex items-center gap-1 border border-slate-200/90 bg-white/90 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer max-w-[100px] xs:max-w-[130px] sm:max-w-[180px] truncate shadow-2xs"
              title={formatBilingual(getRegionUIText("changeLocation", locale, isBilingual), "지역 변경")}
            >
              <span className="text-xs shrink-0">📍</span>
              <span className="truncate font-extrabold text-slate-800">{shortRegionText}</span>
              <span className="text-slate-400 text-[9px] shrink-0">▾</span>
            </button>
          </div>

          {/* Right Action Icons & Language Selector */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live Chat Droplet Pill */}
            <Link
              href="/chat"
              className="droplet-pill inline-flex items-center gap-1 border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-indigo-700 transition shrink-0"
              title={formatBilingual(t("common.nativeConsultationCenter"), "모국어 실시간 상담 센터")}
            >
              <span className="shrink-0 text-xs">💬</span>
              <span className="hidden xs:inline">
                {formatBilingual(t("common.nativeConsultation"), "상담")}
              </span>
            </Link>

            {/* Quick Emergency Droplet Pill */}
            <Link
              href="/request"
              className="droplet-pill hidden md:inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-3 py-1 text-xs font-bold text-white shadow-2xs transition shrink-0"
            >
              <span>🚨</span>
              <span>{locale === "ko" ? "빠른 신청" : t("request.title")}</span>
            </Link>

            {/* Desktop Shortcut Pill */}
            <DesktopShortcutButton variant="header" />

            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      {/* ② Compact Mobile Hero & One-Touch Action Bar (Above the Fold) */}
      <section className="px-3 pt-2.5 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
        <div className="mx-auto max-w-6xl">
          {/* Headline & Emergency Bar in Compact Space */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="droplet-pill inline-flex items-center gap-1.5 border border-blue-200/80 bg-white/90 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-blue-900 shadow-2xs mb-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  {locale === "ko"
                    ? "38개 언어 지원 · 100% 개인정보 안심 대화"
                    : `${t("customer.consultation")} · ${t("customer.safe050Tag") || "안심 연결"}`}
                </span>
              </div>

              <h1 className={`text-sm xs:text-base sm:text-2xl lg:text-3xl ${headingWeight} tracking-tight text-slate-900 leading-snug`}>
                {t("customer.tagline")}
                {isBilingual && locale !== "ko" && (
                  <span className="block mt-0.5 text-xs sm:text-sm font-bold text-slate-500">
                    {tKo("customer.tagline")}
                  </span>
                )}
              </h1>
            </div>

            {/* One-Touch Instant Emergency Dispatch Droplet Button */}
            <Link
              href="/request"
              className="droplet-btn-lg shrink-0 flex items-center justify-center gap-1.5 bg-linear-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-red-700 px-4 py-2 sm:py-2.5 text-white font-black shadow-md shadow-red-600/20 active:scale-98 transition text-center cursor-pointer"
            >
              <span className="text-sm">🚨</span>
              <span className="text-xs sm:text-sm leading-tight">{t("customer.emergency")}</span>
              <span className="text-[10px] text-red-100 font-bold hidden xs:inline">
                {locale === "ko" ? "(1초 연결 →)" : "→"}
              </span>
            </Link>
          </div>

          {/* ③ Smart Category Filter Switcher Droplets (전체 10 / 수리 5 / 생활지원 5) - Zero Horizontal Scroll Guaranteed */}
          <div className="mt-2.5 border-b border-slate-200/60 pb-2">
            <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`droplet-pill flex items-center justify-center gap-1 px-1 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-2xs min-w-0 ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80"
                }`}
              >
                <span className="shrink-0">🌈</span>
                <span className="truncate">{t("customer.allView") || (locale === "ko" ? "전체 보기" : "All")}</span>
                <span
                  className={`droplet-pill px-1 sm:px-1.5 py-0.2 text-[9px] sm:text-[10px] shrink-0 ${
                    activeTab === "all" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  10
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("repair")}
                className={`droplet-pill flex items-center justify-center gap-1 px-1 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-2xs min-w-0 ${
                  activeTab === "repair"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80"
                }`}
              >
                <span className="shrink-0">🔧</span>
                <span className="truncate">{t("customer.repairView") || (locale === "ko" ? "긴급 수리" : "Repair")}</span>
                <span
                  className={`droplet-pill px-1 sm:px-1.5 py-0.2 text-[9px] sm:text-[10px] shrink-0 ${
                    activeTab === "repair" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  5
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={`droplet-pill flex items-center justify-center gap-1 px-1 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-2xs min-w-0 ${
                  activeTab === "support"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80"
                }`}
              >
                <span className="shrink-0">🤝</span>
                <span className="truncate">{t("customer.supportView") || (locale === "ko" ? "생활 지원" : "Support")}</span>
                <span
                  className={`droplet-pill px-1 sm:px-1.5 py-0.2 text-[9px] sm:text-[10px] shrink-0 ${
                    activeTab === "support" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  5
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ④ 10 Pastel Services Mobile App Grid (Fit Above-The-Fold on Mobile Screen!) */}
      <section className="px-3 py-1 sm:px-4 sm:py-2">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {displayedServices.map((svc) => (
              <Link
                key={svc.id}
                href={`/services/${svc.slug}`}
                className={`droplet-card group relative border ${svc.cardBorder} ${svc.cardBg} ${svc.cardHover} p-3 sm:p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none`}
              >
                {/* Top: Large Icon + Badge */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`droplet-icon flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center ${svc.iconBg} text-2xl sm:text-3xl shadow-2xs group-hover:scale-110 transition-transform shrink-0`}
                    >
                      {svc.icon}
                    </span>

                    {/* Pastel Tag */}
                    <span
                      className={`droplet-pill ${svc.badgeBg} ${svc.badgeText} px-2.5 py-0.5 text-[10px] sm:text-xs font-black shrink-0 tracking-wide`}
                    >
                      {getBadgeText(svc.key, svc.badgeLabelKo)}
                    </span>
                  </div>

                  {/* Title & Bilingual Subtitle */}
                  <div>
                    <h3
                      className={`text-[15px] sm:text-[17px] font-black ${svc.textColor} leading-snug line-clamp-2 min-h-[42px] sm:min-h-[48px] flex items-center`}
                    >
                      {t(`service.${svc.key}`)}
                    </h3>

                    {isBilingual && locale !== "ko" && (
                      <p className="mt-1 text-xs sm:text-[13px] font-bold text-slate-500 truncate">
                        {svc.ko}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Floating Trust Metrics Bar */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-600">
            <div className="droplet-pill inline-flex items-center gap-1 bg-white/80 border border-slate-200/80 px-2.5 py-0.5 shadow-2xs backdrop-blur-xs">
              <span>🌐</span>
              <span>{t("trustMetrics.languages") || "38개국 언어 실시간 통역"}</span>
            </div>
            <div className="droplet-pill inline-flex items-center gap-1 bg-white/80 border border-slate-200/80 px-2.5 py-0.5 shadow-2xs backdrop-blur-xs">
              <span>⚡</span>
              <span>{t("trustMetrics.dispatch") || "평균 15분 내 헬퍼 배정"}</span>
            </div>
            <div className="droplet-pill inline-flex items-center gap-1 bg-white/80 border border-slate-200/80 px-2.5 py-0.5 shadow-2xs backdrop-blur-xs">
              <span>🔒</span>
              <span>{t("trustMetrics.safeNumber") || "전화번호 수집 제로 · 안심 대화"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ⑤ Helper Master Registration Banner (Dark Contrast, Sleek Droplet Banner) */}
      <section className="mx-auto max-w-6xl px-3 pt-5 pb-3 sm:px-4 sm:pt-7 sm:pb-5">
        <div className="droplet-banner relative overflow-hidden bg-slate-950 border border-slate-800 p-4 sm:p-6 shadow-xl text-white">
          <div
            className="pointer-events-none absolute -right-10 -top-10 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="droplet-pill inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-amber-300 mb-1">
                <span>🎖️</span>
                <span>{t("customer.partnerTitle") || "LIFE.HELP 공식 헬퍼 파트너십"}</span>
              </div>

              <h2 className="text-sm sm:text-lg font-black text-white leading-tight">
                {t("customer.helperMasterBanner")}
              </h2>
              {isBilingual && locale !== "ko" && (
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-amber-300">
                  {tKo("customer.helperMasterBanner")}
                </p>
              )}

              <p className="mt-0.5 text-xs text-slate-300 font-normal">
                {t("customer.partnerDesc") || "100% 자율 일정으로 원하는 지역에서 활동하며 투명한 수익을 창출하세요."}
              </p>
            </div>

            <div className="shrink-0 flex justify-end">
              <Link
                href="/services/job-help?tab=provider"
                className="droplet-btn-lg inline-flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-98 transition text-center cursor-pointer"
              >
                <span>{t("customer.helperRegisterBtn") || "헬퍼 등록 신청하기 →"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ⑥ Privacy & Safety Spotlight (3 Glass Droplet Cards) */}
      <section className="border-t border-slate-200/70 bg-white/70 backdrop-blur-xs px-3 py-6 sm:px-4 sm:py-8">
        <div className="mx-auto max-w-6xl text-center">
          <div className="droplet-pill inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-[10px] sm:text-[11px] font-black text-emerald-800 mb-1.5">
            <span>🔒</span>
            <span>{t("privacy.badge") || "사생활 보호 안심 시스템"}</span>
          </div>

          <h2 className="text-sm sm:text-xl font-black text-slate-900 leading-tight">
            {t("privacy.title") || "고객님의 개인 전화번호를 절대 수집하거나 저장하지 않습니다"}
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <div className="droplet-card border border-slate-200/90 bg-white/90 p-3.5 shadow-2xs">
              <span className="text-xl">🚫</span>
              <h3 className="mt-1 text-xs sm:text-sm font-black text-slate-900">{t("privacy.cardZeroPhoneTitle") || "전화번호 수집 제로"}</h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                {t("privacy.cardZeroPhoneDesc") || "고객님의 실제 휴대폰 번호를 수집·저장하지 않아 스팸 및 유출 걱정이 없습니다."}
              </p>
            </div>

            <div className="droplet-card border border-slate-200/90 bg-white/90 p-3.5 shadow-2xs">
              <span className="text-xl">💬</span>
              <h3 className="mt-1 text-xs sm:text-sm font-black text-slate-900">{t("privacy.cardRealtimeChatTitle") || "1:1 실시간 모국어 번역 대화"}</h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                {t("privacy.cardRealtimeChatDesc") || "모국어로 메시지를 보내면 헬퍼에게 자동 번역되어 막힘없이 소통합니다."}
              </p>
            </div>

            <div className="droplet-card border border-slate-200/90 bg-white/90 p-3.5 shadow-2xs">
              <span className="text-xl">🛡️</span>
              <h3 className="mt-1 text-xs sm:text-sm font-black text-slate-900">{t("privacy.cardVerifiedHelperTitle") || "신원 검증된 공식 헬퍼"}</h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                {t("privacy.cardVerifiedHelperDesc") || "신원과 기술력이 철저히 검증된 지역 헬퍼만이 방문하여 안전하고 신뢰할 수 있습니다."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ⑦ Core Trust Benefits (4 Compact Droplet Cards) */}
      <section className="border-t border-slate-200/70 bg-white/90">
        <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4 gap-2 px-3 py-5 sm:px-4 sm:py-6">
          {benefits.map(([icon, key]) => {
            const href =
              key === "consultation"
                ? "/chat"
                : key === "verified"
                ? "/tech"
                : key === "payment"
                ? "/payment"
                : key === "review"
                ? "/review"
                : undefined;

            const cardBody = (
              <div className="droplet-card flex h-full flex-col items-center justify-center text-center bg-slate-50/80 p-3 border border-slate-200/80 hover:bg-white hover:border-blue-300 transition cursor-pointer">
                <span className="text-2xl mb-1">{icon}</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  {t(`customer.${key}`)}
                </span>
                {isBilingual && locale !== "ko" && (
                  <span className="mt-0.5 text-[10px] font-bold text-blue-700 truncate">
                    {tKo(`customer.${key}`)}
                  </span>
                )}
              </div>
            );

            return href ? (
              <Link key={key} href={href} className="block">
                {cardBody}
              </Link>
            ) : (
              <div key={key}>{cardBody}</div>
            );
          })}
        </div>
      </section>

      {/* ⑧ Bottom Legal & Privacy Notice Footer */}
      <PrivacyNotice />
    </main>
  );
}

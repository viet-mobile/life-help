"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { getRegionUIText, getLocalizedGunguList } from "@/lib/region/regionLocalization";
import { dictionaries } from "@/messages";
import {
  SUPPORT_CATEGORIES,
  saveSupportRequest,
  registerSupportPartner,
  type SupportRequest,
  type SupportCategoryMeta,
} from "@/lib/support/supportStore";
import { getProblemOptionsForService } from "@/lib/request/problemChecklists";
import { getServiceBadge } from "@/lib/services";
import { DesktopShortcutButton } from "@/components/shared/DesktopShortcutButton";
import {
  getOrCreateCustomerId,
  getOrCreateHelperId,
  formatCustomerDisplayName,
  formatHelperIdentifier,
} from "@/lib/id/userIdentifier";

// 10 Services Exact Color Codes Order:
// 자주(1) - 분홍(2) - 주황(3) - 노랑(4) - 연두(5) - 민트(6) - 하늘(7) - 파랑(8) - 네이비(9) - 보라(10)
export interface ServiceTheme {
  colorName: string;
  heroGradient: string;
  btnBg: string;
  btnHover: string;
  selectedBg: string;
  selectedBorder: string;
  textColor: string;
  checkboxColor: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
}

export const SERVICE_THEMES: Record<string, ServiceTheme> = {
  // 1. 자주 (Fuchsia / Magenta) - 구인/구직
  "job-help": {
    colorName: "자주",
    heroGradient: "from-fuchsia-950 via-purple-950 to-slate-950",
    btnBg: "bg-fuchsia-700 hover:bg-fuchsia-800",
    btnHover: "hover:bg-fuchsia-800",
    selectedBg: "bg-fuchsia-50/85",
    selectedBorder: "border-fuchsia-600",
    textColor: "text-fuchsia-950",
    checkboxColor: "text-fuchsia-600 focus:ring-fuchsia-500",
    badgeBg: "bg-fuchsia-100/90",
    badgeText: "text-fuchsia-900",
    iconBg: "bg-fuchsia-100 text-fuchsia-700",
  },
  // 2. 분홍 (Pink / Rose) - 휴대폰 개통
  "mobile-help": {
    colorName: "분홍",
    heroGradient: "from-pink-950 via-rose-950 to-slate-950",
    btnBg: "bg-pink-600 hover:bg-pink-700",
    btnHover: "hover:bg-pink-700",
    selectedBg: "bg-pink-50/85",
    selectedBorder: "border-pink-600",
    textColor: "text-pink-950",
    checkboxColor: "text-pink-600 focus:ring-pink-500",
    badgeBg: "bg-pink-100/90",
    badgeText: "text-pink-900",
    iconBg: "bg-pink-100 text-pink-700",
  },
  // 3. 주황 (Orange / Peach) - 보일러
  "boiler": {
    colorName: "주황",
    heroGradient: "from-orange-950 via-amber-950 to-slate-950",
    btnBg: "bg-orange-600 hover:bg-orange-700",
    btnHover: "hover:bg-orange-700",
    selectedBg: "bg-orange-50/85",
    selectedBorder: "border-orange-600",
    textColor: "text-orange-950",
    checkboxColor: "text-orange-600 focus:ring-orange-500",
    badgeBg: "bg-orange-100/90",
    badgeText: "text-orange-900",
    iconBg: "bg-orange-100 text-orange-700",
  },
  // 4. 노랑 (Amber / Yellow) - 방 구하기
  "housing": {
    colorName: "노랑",
    heroGradient: "from-amber-950 via-yellow-950 to-slate-950",
    btnBg: "bg-amber-600 hover:bg-amber-700",
    btnHover: "hover:bg-amber-700",
    selectedBg: "bg-amber-50/85",
    selectedBorder: "border-amber-600",
    textColor: "text-amber-950",
    checkboxColor: "text-amber-600 focus:ring-amber-500",
    badgeBg: "bg-amber-100/90",
    badgeText: "text-amber-900",
    iconBg: "bg-amber-100 text-amber-700",
  },
  // 5. 연두 (Lime / Green) - 전문 청소
  "cleaning": {
    colorName: "연두",
    heroGradient: "from-lime-950 via-emerald-950 to-slate-950",
    btnBg: "bg-lime-700 hover:bg-lime-800",
    btnHover: "hover:bg-lime-800",
    selectedBg: "bg-lime-50/85",
    selectedBorder: "border-lime-600",
    textColor: "text-lime-950",
    checkboxColor: "text-lime-600 focus:ring-lime-500",
    badgeBg: "bg-lime-100/90",
    badgeText: "text-lime-900",
    iconBg: "bg-lime-100 text-lime-800",
  },
  // 6. 민트 (Teal / Mint) - 병원 동행·통역
  "hospital-help": {
    colorName: "민트",
    heroGradient: "from-teal-950 via-cyan-950 to-slate-950",
    btnBg: "bg-teal-600 hover:bg-teal-700",
    btnHover: "hover:bg-teal-700",
    selectedBg: "bg-teal-50/85",
    selectedBorder: "border-teal-600",
    textColor: "text-teal-950",
    checkboxColor: "text-teal-600 focus:ring-teal-500",
    badgeBg: "bg-teal-100/90",
    badgeText: "text-teal-900",
    iconBg: "bg-teal-100 text-teal-700",
  },
  // 7. 하늘 (Sky) - 막힘 해결
  "clog-clearing": {
    colorName: "하늘",
    heroGradient: "from-sky-950 via-blue-950 to-slate-950",
    btnBg: "bg-sky-600 hover:bg-sky-700",
    btnHover: "hover:bg-sky-700",
    selectedBg: "bg-sky-50/85",
    selectedBorder: "border-sky-600",
    textColor: "text-sky-950",
    checkboxColor: "text-sky-600 focus:ring-sky-500",
    badgeBg: "bg-sky-100/90",
    badgeText: "text-sky-900",
    iconBg: "bg-sky-100 text-sky-700",
  },
  // 8. 파랑 (Blue) - 누수·배관
  "leak-plumbing": {
    colorName: "파랑",
    heroGradient: "from-blue-950 via-indigo-950 to-slate-950",
    btnBg: "bg-blue-600 hover:bg-blue-700",
    btnHover: "hover:bg-blue-700",
    selectedBg: "bg-blue-50/85",
    selectedBorder: "border-blue-600",
    textColor: "text-blue-950",
    checkboxColor: "text-blue-600 focus:ring-blue-500",
    badgeBg: "bg-blue-100/90",
    badgeText: "text-blue-900",
    iconBg: "bg-blue-100 text-blue-700",
  },
  // 9. 네이비 (Indigo / Navy) - 은행 계좌
  "bank-help": {
    colorName: "네이비",
    heroGradient: "from-indigo-950 via-slate-900 to-slate-950",
    btnBg: "bg-indigo-600 hover:bg-indigo-700",
    btnHover: "hover:bg-indigo-700",
    selectedBg: "bg-indigo-50/85",
    selectedBorder: "border-indigo-600",
    textColor: "text-indigo-950",
    checkboxColor: "text-indigo-600 focus:ring-indigo-500",
    badgeBg: "bg-indigo-100/90",
    badgeText: "text-indigo-900",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  // 10. 보라 (Purple) - 보험 가입
  "insurance-help": {
    colorName: "보라",
    heroGradient: "from-purple-950 via-violet-950 to-slate-950",
    btnBg: "bg-purple-600 hover:bg-purple-700",
    btnHover: "hover:bg-purple-700",
    selectedBg: "bg-purple-50/85",
    selectedBorder: "border-purple-600",
    textColor: "text-purple-950",
    checkboxColor: "text-purple-600 focus:ring-purple-500",
    badgeBg: "bg-purple-100/90",
    badgeText: "text-purple-900",
    iconBg: "bg-purple-100 text-purple-700",
  },
};

// Aliases for legacy repair slugs
SERVICE_THEMES["toilet-clog"] = SERVICE_THEMES["clog-clearing"];
SERVICE_THEMES["sink-clog"] = SERVICE_THEMES["clog-clearing"];
SERVICE_THEMES["drain-clog"] = SERVICE_THEMES["clog-clearing"];
SERVICE_THEMES["leak"] = SERVICE_THEMES["leak-plumbing"];
SERVICE_THEMES["leak-detection"] = SERVICE_THEMES["leak-plumbing"];
SERVICE_THEMES["water-pipe"] = SERVICE_THEMES["leak-plumbing"];
SERVICE_THEMES["plumbing"] = SERVICE_THEMES["leak-plumbing"];
SERVICE_THEMES["room-cleaning"] = SERVICE_THEMES["cleaning"];
SERVICE_THEMES["move-in-cleaning"] = SERVICE_THEMES["cleaning"];

export function SupportServiceView({
  slug,
  initialTab = "seeker",
}: {
  slug: string;
  initialTab?: "seeker" | "provider";
}) {
  const { locale, isBilingual, t, formatBilingual } = useLocale();
  const { selectedRegion, formattedRegion, shortRegionText, openModal } = useRegion();
  const country = selectedRegion?.country || "KR";
  const sido = selectedRegion?.sido || "";
  const gungu = selectedRegion?.gungu || "";
  const dong = selectedRegion?.dong || "";

  const categoryMeta = SUPPORT_CATEGORIES[slug] || SUPPORT_CATEGORIES["job-help"] || SUPPORT_CATEGORIES["bank-help"];
  const theme = SERVICE_THEMES[slug] || SERVICE_THEMES["job-help"];

  // Active Tab: "seeker" (도움 신청하기) vs "provider" (헬퍼 등록)
  const [activeTab, setActiveTab] = useState<"seeker" | "provider">(initialTab);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "provider" || window.location.pathname.includes("/register")) {
        setActiveTab("provider");
      }
    }
  }, []);

  // Seeker State (Zero Phone Collection!)
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [seekerMemo, setSeekerMemo] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<SupportRequest | null>(null);
  const [seekerError, setSeekerError] = useState("");

  // Helper State (Zero Phone & Zero Name Collection! Multi-Region Selection!)
  const [providerBio, setProviderBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([categoryMeta.slug]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([formattedRegion]);
  const [agreedToFee, setAgreedToFee] = useState(false);
  const [isProviderRegistered, setIsProviderRegistered] = useState(false);
  const [registeredHelperId, setRegisteredHelperId] = useState<string>("");
  const [providerError, setProviderError] = useState("");

  // Keep selectedRegions up to date if currently empty
  useEffect(() => {
    if (formattedRegion && selectedRegions.length === 0) {
      setSelectedRegions([formattedRegion]);
    }
  }, [formattedRegion, selectedRegions.length]);

  const checklistOptions = useMemo(() => {
    const problemOpts = getProblemOptionsForService(slug, locale);
    if (problemOpts && problemOpts.length > 0) {
      return problemOpts.map((o) => o.label);
    }
    const fromDict = (dictionaries[locale] as Record<string, unknown> | undefined)?.supportChecklist as Record<string, string[]> | undefined;
    const catList = fromDict?.[categoryMeta.key];
    if (Array.isArray(catList) && catList.length > 0) {
      return catList;
    }
    if (locale === "vi") return categoryMeta.checklistOptionsVi;
    if (locale === "en") return categoryMeta.checklistOptionsEn;
    return categoryMeta.checklistOptionsKo;
  }, [categoryMeta, slug, locale]);

  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: SupportCategoryMeta[] = [];
    for (const cat of Object.values(SUPPORT_CATEGORIES)) {
      if (!seen.has(cat.key)) {
        seen.add(cat.key);
        list.push(cat);
      }
    }
    return list;
  }, []);

  // Quick district options for the currently selected province
  const currentGunguOptions = useMemo(() => {
    return getLocalizedGunguList(sido, locale, isBilingual, country);
  }, [sido, locale, isBilingual, country]);

  // Dynamic Hero Information based on active tab
  const isProviderTab = activeTab === "provider";
  const categoryTitle = t(`service.${categoryMeta.key}`) || categoryMeta.nameKo;
  const categoryDesc = t(`serviceDesc.${categoryMeta.key}`) || categoryMeta.descriptionKo;

  const heroIcon = isProviderTab ? "🎖️" : categoryMeta.icon;
  const heroBadge = isProviderTab
    ? formatBilingual(t("tech.officialPartners"), "공식 헬퍼 파트너")
    : (getServiceBadge(categoryMeta.key, locale) || categoryMeta.nameKo);
  const heroTitle = isProviderTab
    ? (locale === "ko" ? "헬퍼 등록" : formatBilingual(t("support.partnerTab"), "헬퍼 등록"))
    : categoryTitle;
  const heroSubtitleKo = isProviderTab ? "공식 헬퍼 등록" : categoryMeta.nameKo;
  const heroDesc = isProviderTab
    ? formatBilingual(
        t("support.providerDesc"),
        "100% 자율 일정으로 원하는 지역에서 활동하며 10대 생활·수리 전 분야에서 투명한 수익을 창출하세요."
      )
    : categoryDesc;

  const toggleNeed = (need: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const toggleCategory = (catSlug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catSlug) ? prev.filter((c) => c !== catSlug) : [...prev, catSlug]
    );
  };

  const addCurrentRegion = () => {
    if (formattedRegion && !selectedRegions.includes(formattedRegion)) {
      setSelectedRegions((prev) => [...prev, formattedRegion]);
    }
  };

  const toggleDistrictRegion = (districtDisplay: string) => {
    const fullDistrictName = sido ? `${sido} ${districtDisplay}` : districtDisplay;
    setSelectedRegions((prev) => {
      const exists = prev.some(
        (r) => r === fullDistrictName || r === districtDisplay || r.includes(districtDisplay)
      );
      if (exists) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(
          (r) => r !== fullDistrictName && r !== districtDisplay && !r.includes(districtDisplay)
        );
      } else {
        return [...prev, fullDistrictName];
      }
    });
  };

  const removeRegion = (regionToRemove: string) => {
    setSelectedRegions((prev) => prev.filter((r) => r !== regionToRemove));
  };

  // Seeker Submit: Zero Phone Collection! Auto Customer Identifier!
  const handleSeekerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSeekerError("");

    if (selectedNeeds.length === 0) {
      setSeekerError(
        t("support.needsError") || (locale === "ko" ? "필요한 도움 항목을 1개 이상 선택해 주세요." : "Please select at least one item.")
      );
      return;
    }

    const customerId = getOrCreateCustomerId();
    const customerDisplayName = formatCustomerDisplayName(customerId, locale);

    const newReq = saveSupportRequest({
      category: slug,
      country,
      sido,
      gungu,
      dong,
      customerId,
      customerDisplayName,
      customerRealPhone: "ZERO-COLLECT · 전화번호 수집 제로",
      selectedNeeds,
      memo: seekerMemo,
    });

    setSubmittedRequest(newReq);
  };

  // Provider Submit: Zero Phone & Zero Name Collection! Auto Helper Identifier!
  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError("");

    if (selectedCategories.length === 0) {
      setProviderError(
        locale === "ko"
          ? "지원 가능한 카테고리를 1개 이상 선택해 주세요."
          : "Please select at least one support category."
      );
      return;
    }

    if (selectedRegions.length === 0) {
      setProviderError(
        locale === "ko"
          ? "활동 희망 지역을 1개 이상 선택해 주세요."
          : "Please select at least one activity region."
      );
      return;
    }

    if (!agreedToFee) {
      setProviderError(
        locale === "ko"
          ? "플랫폼 광고 및 연결 알선 수수료 정책에 동의해 주세요."
          : "Please agree to the platform advertising and matchmaking fee policy."
      );
      return;
    }

    const newHelperId = getOrCreateHelperId();
    setRegisteredHelperId(newHelperId);
    const helperName = formatHelperIdentifier(newHelperId, locale);

    registerSupportPartner({
      helperId: newHelperId,
      name: helperName,
      phone: "ZERO-COLLECT",
      categories: selectedCategories,
      country,
      regions: selectedRegions,
      agreedToFee: true,
      bio: providerBio.trim(),
    });

    setIsProviderRegistered(true);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center" title="LIFE.HELP Home">
              <BrandLogo size="md" priority />
            </Link>

            {/* Region badge */}
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800 transition hover:bg-slate-100 cursor-pointer"
            >
              <span>📍</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{shortRegionText}</span>
              <span className="text-slate-400 text-[10px]">▾</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <DesktopShortcutButton variant="header" />
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              ← {formatBilingual(t("common.home"), "홈으로")}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      {/* Hero Banner with Service Specific Color Code Gradient! */}
      <section className={`bg-gradient-to-r ${theme.heroGradient} px-4 py-8 text-white sm:py-12 border-b border-white/10`}>
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-inner backdrop-blur-xs border border-white/20">
              {heroIcon}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold text-white/90 border border-white/25">
                  <span>🔒 {t("support.badge050")}</span>
                </span>
                <span className={`inline-flex items-center rounded-full ${theme.badgeBg} ${theme.badgeText} px-3 py-0.5 text-xs font-black shadow-2xs`}>
                  {heroBadge}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-black sm:text-3xl lg:text-4xl text-white">
                {heroTitle}
              </h1>
              {isBilingual && locale !== "ko" && (
                <p className="mt-0.5 text-sm font-bold text-white/80">{heroSubtitleKo}</p>
              )}
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-white/90 leading-relaxed font-medium">
            {heroDesc}
          </p>

          {/* Dual Action Tab Selector (Service Color Themed) */}
          <div className="mt-8 flex rounded-2xl bg-black/25 p-1.5 max-w-md border border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab("seeker")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-black transition cursor-pointer text-center ${
                activeTab === "seeker"
                  ? "bg-white text-slate-950 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              💡 {(t("support.requestTab") || (locale === "ko" ? "도움 신청하기 · 수요자" : "Request Help")).replace(/^[💡\s]+/, "").trim()}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("provider")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-black transition cursor-pointer text-center ${
                activeTab === "provider"
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🤝 {(t("support.partnerTab") || (locale === "ko" ? "헬퍼 등록 · 전문가" : "Helper Registration")).replace(/^[🤝\s]+/, "").trim()}
            </button>
          </div>
        </div>
      </section>

      {/* Main Form Body */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {activeTab === "seeker" ? (
          /* ========================================================================= */
          /* SEEKER WORKFLOW (수요자: 체크리스트 + 개인 전화번호 수집 제로 + 1:1 안심 대화) */
          /* ========================================================================= */
          submittedRequest ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white">
                  ✓
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
                    {t("support.successTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    {t("support.successDesc")}
                  </p>
                </div>
              </div>

              {/* Zero-Phone Safe Connect & Real-time Chat Open Card */}
              <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>전화번호 수집 제로 · 안심 연결 완료</span>
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                    접수 완료
                  </span>
                </div>
                <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
                  💬 1:1 실시간 모국어 번역 대화방 개설
                </div>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  고객님의 실제 휴대폰 번호는 수집·저장되지 않았습니다. 선택하신 지역의 공식 인증 헬퍼와 1:1 실시간 자동 번역 채팅으로 안전하게 소통하실 수 있습니다.
                </p>

                {/* Auto Customer Identifier Badge */}
                <div className="mt-3.5 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-300 p-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">발급된 고객 안심 식별자:</span>
                    <span className="text-[11px] text-emerald-700 font-medium">실명 및 전화번호 없이 본 식별자로 안전하게 소통합니다.</span>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-950 bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                    {submittedRequest.customerDisplayName || `고객 · ${submittedRequest.customerId || "CST-AUTO"}`}
                  </span>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/chat?service=${slug}`}
                    className={`w-full droplet-btn-lg ${theme.btnBg} text-white font-black text-sm py-3.5 flex items-center justify-center gap-2 shadow-md transition text-center`}
                  >
                    <span>💬</span>
                    <span>1:1 실시간 번역 대화 시작하기 →</span>
                  </Link>
                </div>
              </div>

              {/* Summary Details */}
              <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-5 text-xs sm:text-sm border border-emerald-100">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t("support.serviceLabel")}</span>
                  <span className="font-bold text-slate-900">{categoryTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">
                    {locale === "ko" ? "서비스 받을 곳" : formatBilingual("Service Location", "서비스 받을 곳")}
                  </span>
                  <span className="font-bold text-slate-900">{formattedRegion}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">{t("support.selectedNeedsLabel")}</span>
                  <ul className="list-disc list-inside space-y-1 font-semibold text-slate-800">
                    {submittedRequest.selectedNeeds.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                {submittedRequest.memo && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block mb-0.5">{t("support.memoLabel")}</span>
                    <p className="text-slate-700 italic">{submittedRequest.memo}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRequest(null);
                    setSelectedNeeds([]);
                    setSeekerMemo("");
                  }}
                  className={`rounded-xl ${theme.btnBg} px-5 py-3 text-xs sm:text-sm font-bold text-white transition cursor-pointer`}
                >
                  {t("support.submitAnother")}
                </button>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 text-center hover:bg-slate-100 transition"
                >
                  {t("support.backHome")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSeekerSubmit} className="space-y-6">
              {/* Region confirmation card (서비스 받을 곳 with service theme accent) */}
              <div className={`rounded-3xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} text-xl`}>
                    📍
                  </span>
                  <div>
                    <span className={`text-xs font-black uppercase ${theme.textColor}`}>
                      {locale === "ko" ? "서비스 받을 곳" : formatBilingual("Service Location", "서비스 받을 곳")}
                    </span>
                    <p className="text-base sm:text-lg font-black text-slate-900">
                      {formattedRegion}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openModal}
                  className="rounded-xl bg-slate-50 border border-slate-300 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition cursor-pointer self-start sm:self-auto"
                >
                  {getRegionUIText("changeLocation", locale, false)} ▾
                </button>
              </div>

              {/* Questionnaire Checklist (Themed on Selection) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>☑️</span>
                  <span>
                    {t("support.whatHelpTitle")}
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t("support.whatHelpDesc")}
                </p>

                <div className="mt-4 space-y-2.5">
                  {checklistOptions.map((opt, idx) => {
                    const isChecked = selectedNeeds.includes(opt);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 rounded-2xl border p-3.5 transition cursor-pointer ${
                          isChecked
                            ? `${theme.selectedBorder} ${theme.selectedBg} shadow-xs`
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNeed(opt)}
                          className={`mt-0.5 h-4 w-4 rounded-md border-slate-300 ${theme.checkboxColor} cursor-pointer`}
                        />
                        <span className={`text-xs sm:text-sm font-bold leading-snug ${isChecked ? theme.textColor : "text-slate-800"}`}>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Zero-Phone Safe Connect & Real-time Chat Guarantee (NO phone number collected!) */}
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm sm:text-base">
                  <span>🔒</span>
                  <span>
                    {t("privacy.cardZeroPhoneTitle") || "전화번호 수집 제로"} · {t("privacy.cardRealtimeChatTitle") || "1:1 실시간 모국어 번역 대화"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
                  {t("privacy.cardZeroPhoneDesc") || "고객님의 실제 휴대폰 번호를 수집·저장하지 않아 스팸 및 유출 걱정이 없습니다."}{" "}
                  {t("privacy.cardRealtimeChatDesc") || "모국어로 메시지를 보내면 헬퍼에게 자동 번역되어 막힘없이 소통합니다."}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-900 pt-2 border-t border-emerald-200/60">
                  <span className="droplet-pill bg-emerald-100 text-emerald-900 px-2.5 py-0.5">✓ 개인 연락처 수집 0%</span>
                  <span className="droplet-pill bg-emerald-100 text-emerald-900 px-2.5 py-0.5">✓ 1:1 실시간 안심 대화</span>
                  <span className="droplet-pill bg-emerald-100 text-emerald-900 px-2.5 py-0.5">✓ 지역 전담 헬퍼 직결</span>
                </div>
              </div>

              {/* Additional Memo Input */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <label className="block text-xs sm:text-sm font-black text-slate-800">
                  📝 {t("support.memoInputLabel")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("support.memoPlaceholder")}
                  value={seekerMemo}
                  onChange={(e) => setSeekerMemo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              {seekerError && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                  ⚠️ {seekerError}
                </div>
              )}

              <button
                type="submit"
                className={`w-full rounded-2xl ${theme.btnBg} py-4 text-center text-sm sm:text-base font-black text-white shadow-lg transition active:scale-[0.99] cursor-pointer`}
              >
                🤝 {formatBilingual(t("common.apply"), "도움 신청하기")}
              </button>
            </form>
          )
        ) : (
          /* ========================================================================= */
          /* HELPER WORKFLOW (헬퍼 가입 신청: 성함·연락처 수집 제로 + 다중 지역 선택) */
          /* ========================================================================= */
          isProviderRegistered ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8 shadow-md text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500 text-3xl text-white shadow-md">
                🎖️
              </span>
              <h3 className="mt-4 text-xl sm:text-2xl font-black text-amber-950">
                {t("support.providerSuccessTitle")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
                {t("support.providerSuccessDesc")}
              </p>

              {/* Auto Helper Identifier Badge */}
              <div className="mt-4 max-w-md mx-auto flex items-center justify-between rounded-2xl bg-amber-100 border border-amber-300 p-3.5 text-left">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">발급된 안심 헬퍼 식별자:</span>
                  <span className="text-[11px] text-amber-700 font-medium">실명과 전화번호 없이 시스템 자동 식별자로 활동합니다.</span>
                </div>
                <span className="font-mono text-sm font-black text-amber-950 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-2xs">
                  {registeredHelperId ? `헬퍼 · ${registeredHelperId}` : "헬퍼 · HLP-AUTO"}
                </span>
              </div>

              {/* Registered Regions & Categories Summary */}
              <div className="mt-4 max-w-md mx-auto text-left rounded-2xl bg-white/80 p-4 border border-amber-200 text-xs text-slate-700 space-y-2">
                <div>
                  <span className="font-bold text-slate-500 block">선택하신 활동 희망 지역:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRegions.map((reg, idx) => (
                      <span key={idx} className="droplet-pill bg-amber-100 text-amber-950 font-bold px-2 py-0.5">
                        📍 {reg}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-100">
                  <span className="font-bold text-slate-500 block">등록 분야 ({selectedCategories.length}개):</span>
                  <span className="font-bold text-slate-900">
                    {selectedCategories.map((c) => t(`service.${c}`) || c).join(", ")}
                  </span>
                </div>
              </div>

              <div className="mt-6 inline-flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="rounded-xl bg-amber-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-amber-700 transition"
                >
                  {t("support.backHome")}
                </Link>
                <Link
                  href="/tech"
                  className="rounded-xl border border-amber-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-amber-900 hover:bg-amber-50 transition"
                >
                  {t("support.helperPortal")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProviderSubmit} className="space-y-6">
              <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
                <h3 className="text-lg font-black text-amber-950 flex items-center gap-2">
                  <span>🎖️</span>
                  <span>{t("support.providerTitle")}</span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
                  {t("support.providerDesc")}
                </p>
              </div>

              {/* Zero Personal Info & Anonymity Guarantee for Helpers */}
              <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <span>🛡️</span>
                  <span>헬퍼 개인정보 및 전화번호 수집 제로 (안심 활동)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  헬퍼님의 실제 이름이나 개인 휴대폰 번호를 수집·저장하지 않습니다. 고객과의 모든 상담 및 매칭은 1:1 실시간 모국어 자동 번역 대화 시스템을 통해 안전하게 이루어집니다.
                </p>
              </div>

              {/* Category Selection (10 Services with Individual Color Accents!) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1">
                    {t("support.providerCatLabel")} *
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    활동을 희망하시는 전문 서비스 분야를 1개 이상 선택해 주세요. (다중 선택 가능)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableCategories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat.slug);
                      const catTheme = SERVICE_THEMES[cat.slug] || theme;
                      return (
                        <label
                          key={cat.slug}
                          className={`flex items-center gap-3 rounded-2xl border p-3 transition cursor-pointer ${
                            isChecked
                              ? `${catTheme.selectedBorder} ${catTheme.selectedBg} shadow-2xs font-bold`
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.slug)}
                            className={`h-4 w-4 rounded-md border-slate-300 ${catTheme.checkboxColor} cursor-pointer`}
                          />
                          <span className="text-lg">{cat.icon}</span>
                          <span className={`text-xs sm:text-sm font-bold ${isChecked ? catTheme.textColor : "text-slate-800"}`}>
                            {t(`service.${cat.key}`) || cat.nameKo}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Multiple Activity Regions Selection (활동 희망 지역 다중 선택) */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-black text-slate-800">
                      📍 활동 희망 지역 선택 (복수 선택 가능) *
                    </label>
                    <span className="text-xs font-bold text-amber-800">
                      총 {selectedRegions.length}개 지역 선택됨
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    호출을 받고자 하시는 활동 지역을 여러 개 추가해 주세요.
                  </p>

                  {/* Selected Regions Chips */}
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[38px] p-2 rounded-2xl bg-amber-50/50 border border-amber-200">
                    {selectedRegions.map((reg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-white px-3 py-1 text-xs font-bold text-amber-950 shadow-2xs"
                      >
                        <span>📍 {reg}</span>
                        {selectedRegions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRegion(reg)}
                            className="hover:text-red-600 text-slate-400 font-black ml-1 cursor-pointer transition-colors"
                            title="삭제"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Region Controls */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={addCurrentRegion}
                      disabled={selectedRegions.includes(formattedRegion)}
                      className="rounded-xl border border-amber-300 bg-amber-100/60 hover:bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-900 transition disabled:opacity-50 cursor-pointer"
                    >
                      + 현재 탐색 지역 추가 ({shortRegionText})
                    </button>
                    <button
                      type="button"
                      onClick={openModal}
                      className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      🔍 다른 시·도/도시 찾기 ▾
                    </button>
                  </div>

                  {/* Quick District Pills for Current Province */}
                  {currentGunguOptions.length > 0 && (
                    <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                        ⚡ {sido || "현재 도·시"} 내 구역 빠른 원터치 추가/해제:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentGunguOptions.map((g) => {
                          const isDistrictSelected = selectedRegions.some(
                            (r) => r === g.display || r.includes(g.key) || (sido && r === `${sido} ${g.display}`)
                          );
                          return (
                            <button
                              key={g.key}
                              type="button"
                              onClick={() => toggleDistrictRegion(g.display)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                                isDistrictSelected
                                  ? "bg-amber-500 text-slate-950 shadow-2xs font-black"
                                  : "bg-white border border-slate-200 text-slate-700 hover:border-amber-300"
                              }`}
                            >
                              {isDistrictSelected ? "✓ " : "+ "}
                              {g.display}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience & Bio */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1">
                    🛠️ {t("support.providerBioLabel")} (선택 사항)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t("support.providerBioPlaceholder")}
                    value={providerBio}
                    onChange={(e) => setProviderBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Platform Fee & Commission Agreement */}
              <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-xs space-y-3">
                <h4 className="text-sm font-black text-slate-900">
                  {t("support.feeAgreementTitle")} *
                </h4>
                <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed border border-slate-200">
                  <p className="font-semibold text-slate-800">
                    {t("support.feeRuleTitle")}
                  </p>
                  <p className="mt-1">
                    {t("support.feeRule1")}
                  </p>
                  <p className="mt-0.5">
                    {t("support.feeRule2")}
                  </p>
                  <p className="mt-0.5">
                    {t("support.feeRule3")}
                  </p>
                </div>

                <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToFee}
                    onChange={(e) => setAgreedToFee(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {t("support.feeAgreeCheck")}
                  </span>
                </label>
              </div>

              {providerError && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                  ⚠️ {providerError}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 py-4 text-center text-sm sm:text-base font-black text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-[0.99] cursor-pointer"
              >
                🤝 {t("support.providerSubmitBtn")}
              </button>
            </form>
          )
        )}
      </section>
    </main>
  );
}

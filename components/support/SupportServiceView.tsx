"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { getRegionUIText, getLocalizedGunguList } from "@/lib/region/regionLocalization";
import { dictionaries } from "@/messages";
import { SUPPORT_CATEGORIES } from "@/lib/support/supportStore";
import { getProblemOptionsForService, fetchProblemOptions } from "@/lib/request/problemChecklists";
import { getServiceBadge } from "@/lib/services";

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
  const [notSent, setNotSent] = useState(false);
  const [seekerError, setSeekerError] = useState("");
  const [optionsTick, setOptionsTick] = useState(0);

  useEffect(() => {
    if (locale !== "ko" && locale !== "en" && locale !== "vi" && locale !== "zh-Hans" && locale !== "zh-Hant" && locale !== "yue") {
      fetchProblemOptions(locale).then((data) => {
        if (data) setOptionsTick((t) => t + 1);
      });
    }
  }, [locale]);

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
  }, [categoryMeta, slug, locale, optionsTick]);

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

    // Nothing is stored or sent from this form: the real request flow is /request.
    setNotSent(true);
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
          notSent ? (
            <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 sm:p-8 shadow-md" role="status">
              <h3 className="text-xl sm:text-2xl font-black text-amber-950">{t("support.notSentTitle")}</h3>
              <p className="mt-2 text-sm text-amber-900 leading-relaxed">{t("support.notSentDesc")}</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/request?service=${encodeURIComponent(slug)}`}
                  className={`rounded-xl ${theme.btnBg} px-5 py-3 text-sm font-black text-white text-center transition`}
                >
                  {t("support.notSentCta")}
                </Link>
                <button
                  type="button"
                  onClick={() => setNotSent(false)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {t("support.notSentBack")}
                </button>
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
                    {t("privacy.cardZeroPhoneTitle") || "전화번호 수집 제로"} · {t("privacy.cardRealtimeChatTitle") || "헬퍼와 1:1 번역 채팅"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
                  {t("privacy.cardZeroPhoneDesc") || "고객님의 실제 휴대폰 번호를 수집·저장하지 않아 스팸 및 유출 걱정이 없습니다."}{" "}
                  {t("privacy.cardRealtimeChatDesc") || "모국어로 메시지를 보내면 헬퍼에게 자동 번역되어 막힘없이 소통합니다."}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-900 pt-2 border-t border-emerald-200/60">
                  <span className="droplet-pill bg-emerald-100 text-emerald-900 px-2.5 py-0.5">✓ 개인 연락처 수집 0%</span>
                  <span className="droplet-pill bg-emerald-100 text-emerald-900 px-2.5 py-0.5">✓ 1:1 안심 대화</span>
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
          <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 sm:p-8 shadow-md" role="status">
            <h3 className="text-xl sm:text-2xl font-black text-amber-950">{t("support.providerNoticeTitle")}</h3>
            <p className="mt-2 text-sm text-amber-900 leading-relaxed">{t("support.providerNoticeDesc")}</p>
            <Link
              href="/tech/register"
              className="mt-6 inline-block rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-400 transition"
            >
              {t("support.providerNoticeCta")}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

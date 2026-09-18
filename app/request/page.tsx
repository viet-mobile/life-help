"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { getService, services } from "@/lib/services";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import {
  getLocalizedDongList,
  getLocalizedAddress,
  getLocalizedGunguList,
  romanizeKoreanRegion,
} from "@/lib/region/regionLocalization";
import { saveServiceRequest } from "@/lib/request/requestStore";
import { getProblemOptionsForService } from "@/lib/request/problemChecklists";
import { createProviderChatSession } from "@/lib/chat/providerChatStore";
import { getOrCreateCustomerId, formatCustomerDisplayName } from "@/lib/id/userIdentifier";
import { languages } from "@/messages";

// 10 Services in exact requested order: 자주-분홍-주황-노랑-연두-민트-하늘-파랑-네이비-보라
const ORDERED_SERVICE_SLUGS = [
  "job-help",
  "mobile-help",
  "boiler",
  "housing",
  "cleaning",
  "hospital-help",
  "clog-clearing",
  "leak-plumbing",
  "bank-help",
  "insurance-help",
] as const;

interface ServiceTheme {
  colorName: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  selectedOptionBg: string;
  selectedOptionBorder: string;
  selectedOptionText: string;
  badgeLabelKo: string;
}

const SERVICE_THEMES: Record<string, ServiceTheme> = {
  // 1. 자주 (Pastel Magenta / Plum)
  "job-help": {
    colorName: "자주",
    cardBg: "bg-fuchsia-50/85",
    cardBorder: "border-fuchsia-200/90",
    textColor: "text-fuchsia-950",
    iconBg: "bg-fuchsia-100/80 text-fuchsia-700",
    badgeBg: "bg-fuchsia-100/90",
    badgeText: "text-fuchsia-900",
    btnBg: "bg-fuchsia-700 hover:bg-fuchsia-800",
    selectedOptionBg: "bg-fuchsia-50/90",
    selectedOptionBorder: "border-fuchsia-600",
    selectedOptionText: "text-fuchsia-950",
    badgeLabelKo: "구인·구직",
  },
  // 2. 분홍 (Pastel Pink / Rose)
  "mobile-help": {
    colorName: "분홍",
    cardBg: "bg-pink-50/85",
    cardBorder: "border-pink-200/90",
    textColor: "text-pink-950",
    iconBg: "bg-pink-100/80 text-pink-700",
    badgeBg: "bg-pink-100/90",
    badgeText: "text-pink-900",
    btnBg: "bg-pink-600 hover:bg-pink-700",
    selectedOptionBg: "bg-pink-50/90",
    selectedOptionBorder: "border-pink-600",
    selectedOptionText: "text-pink-950",
    badgeLabelKo: "휴대폰 개통",
  },
  // 3. 주황 (Pastel Orange / Peach)
  "boiler": {
    colorName: "주황",
    cardBg: "bg-orange-50/85",
    cardBorder: "border-orange-200/90",
    textColor: "text-orange-950",
    iconBg: "bg-orange-100/80 text-orange-700",
    badgeBg: "bg-orange-100/90",
    badgeText: "text-orange-900",
    btnBg: "bg-orange-600 hover:bg-orange-700",
    selectedOptionBg: "bg-orange-50/90",
    selectedOptionBorder: "border-orange-600",
    selectedOptionText: "text-orange-950",
    badgeLabelKo: "난방·온수",
  },
  // 4. 노랑 (Pastel Yellow / Cream)
  "housing": {
    colorName: "노랑",
    cardBg: "bg-amber-50/85",
    cardBorder: "border-amber-200/90",
    textColor: "text-amber-950",
    iconBg: "bg-amber-100/80 text-amber-700",
    badgeBg: "bg-amber-100/90",
    badgeText: "text-amber-900",
    btnBg: "bg-amber-600 hover:bg-amber-700",
    selectedOptionBg: "bg-amber-50/90",
    selectedOptionBorder: "border-amber-600",
    selectedOptionText: "text-amber-950",
    badgeLabelKo: "방 구하기",
  },
  // 5. 연두 (Pastel Lime / Light Green)
  "cleaning": {
    colorName: "연두",
    cardBg: "bg-lime-50/85",
    cardBorder: "border-lime-200/90",
    textColor: "text-lime-950",
    iconBg: "bg-lime-100/80 text-lime-800",
    badgeBg: "bg-lime-100/90",
    badgeText: "text-lime-900",
    btnBg: "bg-lime-700 hover:bg-lime-800",
    selectedOptionBg: "bg-lime-50/90",
    selectedOptionBorder: "border-lime-600",
    selectedOptionText: "text-lime-950",
    badgeLabelKo: "정밀 청소",
  },
  // 6. 민트 (Pastel Mint / Teal)
  "hospital-help": {
    colorName: "민트",
    cardBg: "bg-teal-50/85",
    cardBorder: "border-teal-200/90",
    textColor: "text-teal-950",
    iconBg: "bg-teal-100/80 text-teal-700",
    badgeBg: "bg-teal-100/90",
    badgeText: "text-teal-900",
    btnBg: "bg-teal-600 hover:bg-teal-700",
    selectedOptionBg: "bg-teal-50/90",
    selectedOptionBorder: "border-teal-600",
    selectedOptionText: "text-teal-950",
    badgeLabelKo: "병원·통역",
  },
  // 7. 하늘 (Pastel Sky)
  "clog-clearing": {
    colorName: "하늘",
    cardBg: "bg-sky-50/85",
    cardBorder: "border-sky-200/90",
    textColor: "text-sky-950",
    iconBg: "bg-sky-100/80 text-sky-700",
    badgeBg: "bg-sky-100/90",
    badgeText: "text-sky-900",
    btnBg: "bg-sky-600 hover:bg-sky-700",
    selectedOptionBg: "bg-sky-50/90",
    selectedOptionBorder: "border-sky-600",
    selectedOptionText: "text-sky-950",
    badgeLabelKo: "긴급 출동",
  },
  // 8. 파랑 (Pastel Blue)
  "leak-plumbing": {
    colorName: "파랑",
    cardBg: "bg-blue-50/85",
    cardBorder: "border-blue-200/90",
    textColor: "text-blue-950",
    iconBg: "bg-blue-100/80 text-blue-700",
    badgeBg: "bg-blue-100/90",
    badgeText: "text-blue-900",
    btnBg: "bg-blue-600 hover:bg-blue-700",
    selectedOptionBg: "bg-blue-50/90",
    selectedOptionBorder: "border-blue-600",
    selectedOptionText: "text-blue-950",
    badgeLabelKo: "누수 탐지",
  },
  // 9. 네이비 (Pastel Navy / Indigo)
  "bank-help": {
    colorName: "네이비",
    cardBg: "bg-indigo-50/85",
    cardBorder: "border-indigo-200/90",
    textColor: "text-indigo-950",
    iconBg: "bg-indigo-100/80 text-indigo-700",
    badgeBg: "bg-indigo-100/90",
    badgeText: "text-indigo-900",
    btnBg: "bg-indigo-600 hover:bg-indigo-700",
    selectedOptionBg: "bg-indigo-50/90",
    selectedOptionBorder: "border-indigo-600",
    selectedOptionText: "text-indigo-950",
    badgeLabelKo: "계좌 개설",
  },
  // 10. 보라 (Pastel Purple / Lavender)
  "insurance-help": {
    colorName: "보라",
    cardBg: "bg-purple-50/85",
    cardBorder: "border-purple-200/90",
    textColor: "text-purple-950",
    iconBg: "bg-purple-100/80 text-purple-700",
    badgeBg: "bg-purple-100/90",
    badgeText: "text-purple-900",
    btnBg: "bg-purple-600 hover:bg-purple-700",
    selectedOptionBg: "bg-purple-50/90",
    selectedOptionBorder: "border-purple-600",
    selectedOptionText: "text-purple-950",
    badgeLabelKo: "보험·체류",
  },
};

// Normalization helper for legacy slugs
function getNormalizedSlug(rawSlug: string): string {
  if (["toilet-clog", "sink-clog", "drain-clog"].includes(rawSlug)) {
    return "clog-clearing";
  }
  if (["leak", "detection", "water", "plumbing"].includes(rawSlug)) {
    return "leak-plumbing";
  }
  return rawSlug || "job-help";
}

function RequestPageContent() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get("service") ?? "";
  const { locale, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const currentMeta = languages.find((l) => l.code === locale);

  const { selectedRegion, setRegion, formattedRegion, shortRegionText, openModal } = useRegion();

  const [userSelectedSlug, setUserSelectedSlug] = useState<string | null>(null);
  const rawSlug = userSelectedSlug ?? (slugFromUrl || "job-help");
  const selectedSlug = getNormalizedSlug(rawSlug);
  const setSelectedSlug = (slug: string) => {
    setUserSelectedSlug(slug);
    setSelectedProblemOptions([]);
  };

  const [submitted, setSubmitted] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [address, setAddress] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [selectedProblemOptions, setSelectedProblemOptions] = useState<string[]>([]);
  const [translatedResult, setTranslatedResult] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  // Active service and its assigned pastel theme
  const service = getService(selectedSlug);
  const theme = SERVICE_THEMES[selectedSlug] || SERVICE_THEMES["job-help"];
  const isHousing = selectedSlug === "housing" || service?.key === "housing";

  const getBadgeText = (key: string, fallback: string) => {
    const badge = t(`serviceBadge.${key}`);
    return badge && !badge.startsWith("serviceBadge.") ? badge : fallback;
  };

  const problemOptions = useMemo(
    () => getProblemOptionsForService(selectedSlug, locale),
    [selectedSlug, locale]
  );

  const toggleProblemOption = (label: string) => {
    setSelectedProblemOptions((prev) =>
      prev.includes(label) ? prev.filter((o) => o !== label) : [...prev, label]
    );
  };

  // Sorted and localized neighbor dongs for current gungu
  const localizedNeighborDongs = useMemo(
    () => getLocalizedDongList(selectedRegion.sido, selectedRegion.gungu, locale),
    [selectedRegion.sido, selectedRegion.gungu, locale],
  );

  // Localized Gungu name for current locale
  const localizedGunguName = useMemo(() => {
    if (locale === "ko") return selectedRegion.gungu;
    const gList = getLocalizedGunguList(selectedRegion.sido, locale, false, selectedRegion.country);
    const found = gList.find((g) => g.ko === selectedRegion.gungu);
    return found ? found.display : romanizeKoreanRegion(selectedRegion.gungu);
  }, [selectedRegion.sido, selectedRegion.gungu, selectedRegion.country, locale]);

  // Dynamic problem placeholder based on the currently selected service
  const getProblemPlaceholder = () => {
    const key = service?.key || "toilet";
    const currentText = t(`serviceProblems.${key}`);
    const koText = tKo(`serviceProblems.${key}`);
    return formatBilingual(currentText, koText);
  };

  const handleApplyCurrentRegionToAddress = () => {
    const localized = getLocalizedAddress(selectedRegion, locale);
    setAddress(localized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    let translatedText = problemDescription.trim();
    if (problemDescription.trim() && locale !== "ko") {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: problemDescription.trim(),
            from: locale,
            to: "ko",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translatedText) {
            translatedText = data.translatedText;
          }
        }
      } catch (err) {
        console.error("Translation request failed:", err);
      }
    }
    setTranslatedResult(translatedText);

    const serviceName = service
      ? isKorean
        ? tKo(`service.${service.key}`)
        : t(`service.${service.key}`)
      : "일반 서비스";

    saveServiceRequest({
      serviceSlug: selectedSlug,
      serviceName,
      serviceIcon: service?.icon || "🛠️",
      description: problemDescription.trim() || (isHousing ? "주거/원룸 탐색 요청" : "긴급 수리 요청"),
      translatedDescription: translatedText,
      selectedOptions: selectedProblemOptions,
      sido: selectedRegion.sido,
      gungu: selectedRegion.gungu,
      address: address.trim(),
      phone: "",
      fileNames: selectedFileNames,
    });

    // Immediately connect the customer with the matching on-duty helper via real-time 1:1 chat
    try {
      const customerId = getOrCreateCustomerId();
      const chatSession = await createProviderChatSession({
        serviceSlug: selectedSlug,
        serviceName,
        country: selectedRegion.country || "KR",
        sido: selectedRegion.sido,
        gungu: selectedRegion.gungu,
        customerName: formatCustomerDisplayName(customerId, locale),
        customerLocale: locale,
        initialMessage: problemDescription.trim() || undefined,
        selectedOptions: selectedProblemOptions,
      });
      setChatSessionId(chatSession.id);
    } catch (err) {
      console.error("Failed to create real-time chat session:", err);
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-linear-to-b from-sky-50/40 via-amber-50/20 to-indigo-50/30">
        <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2 sm:px-5 sm:py-3 gap-2">
            <Link href="/" className="inline-flex items-center shrink-0" title="LIFE.HELP Home">
              <BrandLogo size="md" priority />
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-4 sm:px-5 py-8 sm:py-10">
          <div className="droplet-card bg-white p-6 sm:p-8 text-center shadow-sm border border-slate-200/90">
            <div className="text-5xl">✅</div>
            {locale === "ko" ? (
              <h1 className="mt-4 text-2xl font-bold text-slate-900 leading-snug">
                서비스 신청이
                <br />
                접수되었습니다.
              </h1>
            ) : isBilingual ? (
              <h1 className="mt-4 text-2xl font-bold text-slate-900 leading-snug">
                <span>{t("request.successTitle")}</span>
                <span className="mt-2 block text-lg font-semibold text-slate-600">
                  서비스 신청이 접수되었습니다.
                </span>
              </h1>
            ) : (
              <h1 className="mt-4 text-2xl font-bold text-slate-900 leading-snug">
                {t("request.successTitle")}
              </h1>
            )}
            <div className="mt-3 text-sm sm:text-base leading-relaxed font-medium text-slate-600">
              {isBilingual ? (
                <>
                  <span>{t("request.successNotice")}</span>
                  <span className="block mt-1 opacity-80">
                    작성하신 문제 상황이 헬퍼님의 언어인 한국어로 정확히 번역되어 원문과 함께 전달되었습니다.
                  </span>
                </>
              ) : (
                <span>
                  {locale === "ko"
                    ? "작성하신 문제 상황이 헬퍼님의 언어인 한국어로 정확히 번역되어 원문과 함께 전달되었습니다."
                    : t("request.successNotice")}
                </span>
              )}
            </div>

            {/* Selected Options Summary */}
            {selectedProblemOptions.length > 0 && (
              <div className="droplet-card mt-5 border border-blue-200 bg-blue-50/60 p-4 text-left">
                <p className="text-xs font-black text-blue-950 mb-2">
                  📋 {t("request.selectedChecklistItems") ? t("request.selectedChecklistItems").replace("{count}", String(selectedProblemOptions.length)) : `선택하신 문제 상황 예시 ${selectedProblemOptions.length}건:`}
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs font-semibold text-blue-900">
                  {selectedProblemOptions.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Self-described Problem & Translation Display */}
            {problemDescription.trim() && (
              <div className="droplet-card mt-4 border border-slate-200 bg-slate-50 p-4 text-left space-y-2">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 block uppercase">
                    📝 {t("request.customerOriginalText") || "고객 작성 원문"} · {currentMeta?.nativeName || locale}:
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 break-words">
                    {problemDescription.trim()}
                  </p>
                </div>
                {translatedResult && locale !== "ko" && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-extrabold text-emerald-700 block uppercase">
                      💡 {t("request.providerTranslatedText") || "담당 헬퍼 전달 번역문 한국어"}:
                    </span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5 break-words">
                      {translatedResult}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Protection Guarantee */}
            <div className="droplet-card mt-4 border border-emerald-200 bg-emerald-50/80 p-3.5 text-left">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🔒</span>
                <span>{formatBilingual(t("request.privacyGuaranteeTitle") || "개인정보 완벽 보호", "개인정보 완벽 보호")}</span>
              </p>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                {formatBilingual(
                  t("request.privacyNoPhoneNote"),
                  "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 헬퍼님과 안전하게 직접 연결됩니다."
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={chatSessionId ? `/chat?session=${chatSessionId}` : "/chat"}
                className="droplet-btn-lg w-full sm:w-auto bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-7 py-3.5 text-base font-black text-white shadow-md hover:shadow-lg active:scale-[0.98] transition cursor-pointer text-center"
              >
                💬 {formatBilingual(t("request.startLiveChat") || "실시간 1:1 대화 연결", "실시간 1:1 대화 연결")}
              </Link>
              <Link
                href="/"
                className="droplet-btn-lg w-full sm:w-auto border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition cursor-pointer text-center"
              >
                {formatBilingual(t("request.backHome"), "홈으로 돌아가기")}
              </Link>
            </div>
          </div>
        </section>

        <PrivacyNotice />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50/40 via-amber-50/20 to-indigo-50/30 overflow-x-hidden">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2 sm:px-5 sm:py-3 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <Link href="/" className="inline-flex items-center shrink-0" title="LIFE.HELP Home">
              <BrandLogo size="md" priority />
            </Link>
            <button
              type="button"
              onClick={openModal}
              className="droplet-pill inline-flex items-center gap-1 border border-slate-200 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 max-w-[85px] xs:max-w-[115px] sm:max-w-[160px] md:max-w-none shadow-2xs"
            >
              <span className="shrink-0">📍</span>
              <span className="truncate">{shortRegionText}</span>
              <span className="text-[9px] text-slate-400 shrink-0">▾</span>
            </button>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-3 sm:px-5 py-5 sm:py-7">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 break-words">
            {formatBilingual(t("request.title"), "서비스 신청")}
          </h1>
          <Link
            href="/"
            className="droplet-pill text-xs font-bold text-slate-700 hover:text-slate-900 bg-white/80 border border-slate-200/90 px-2.5 py-1 shadow-2xs shrink-0"
          >
            ← {formatBilingual(t("common.back"), "홈으로")}
          </Link>
        </div>

        {/* Selected Service Card dynamically styled with the active service's pastel theme */}
        <div className={`droplet-banner mt-4 sm:mt-5 border ${theme.cardBorder} ${theme.cardBg} p-4 sm:p-5 shadow-xs transition-colors duration-200`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`droplet-pill ${theme.badgeBg} ${theme.badgeText} px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider`}>
              {formatBilingual(t("request.selectedService"), "선택한 서비스")} · {getBadgeText(service?.key || selectedSlug, theme.badgeLabelKo)}
            </span>
            {service && (
              <Link
                href={`/${selectedSlug.includes("-help") ? "support" : "services"}/${service.slug}`}
                className={`text-xs font-bold ${theme.textColor} hover:underline shrink-0`}
              >
                {formatBilingual(t("common.detail"), "안내 보기 →")}
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`droplet-icon flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center ${theme.iconBg} text-2xl sm:text-3xl shrink-0 shadow-2xs`}>
                {service?.icon || "🛠️"}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-base sm:text-lg font-black ${theme.textColor} leading-snug break-words whitespace-pre-line`}>
                  {service
                    ? formatBilingual(t(`service.${service.key}`), tKo(`service.${service.key}`))
                    : formatBilingual(t("customer.servicesTitle"), "서비스를 선택해 주세요")}
                </p>
              </div>
            </div>

            {/* Dropdown ordered: 자주-분홍-주황-노랑-연두-민트-하늘-파랑-네이비-보라 */}
            <div className="w-full md:w-auto shrink-0 min-w-0">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className={`droplet-pill w-full md:w-auto md:max-w-[280px] lg:max-w-xs border ${theme.cardBorder} bg-white px-3 py-2 text-xs font-black text-slate-800 outline-none shadow-2xs cursor-pointer truncate`}
                aria-label="Change service"
              >
                {ORDERED_SERVICE_SLUGS.map((slug) => {
                  const s = services.find((item) => item.slug === slug);
                  if (!s) return null;
                  return (
                    <option key={s.slug} value={s.slug}>
                      {s.icon} {isKorean ? tKo(`service.${s.key}`) : t(`service.${s.key}`)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Question 1: Problem description OR Housing requirements */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-slate-900 whitespace-pre-line">
              {isHousing
                ? formatBilingual(t("request.housingLabel"), "어떤 집을 찾으시나요?")
                : formatBilingual(t("request.problemLabel"), "어떤 문제가 있나요?")}
            </label>

            <textarea
              required
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="droplet-card mt-2.5 min-h-28 w-full border-2 border-slate-300 bg-white p-3.5 text-sm sm:text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 shadow-2xs"
              placeholder={getProblemPlaceholder()}
            />

            {/* 10~15 Common problem checklist options styled with water droplet cards */}
            {problemOptions.length > 0 && (
              <div className="droplet-card mt-3.5 border border-slate-200/90 bg-slate-50/90 p-3.5 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1">
                      <span className="shrink-0">📋</span>
                      <span className="break-words whitespace-pre-line">
                        {formatBilingual(
                          t("request.checklistTitle"),
                          tKo("request.checklistTitle") || "자주 발생하는 주요 증상/요청 예시 (선택 가능)"
                        )}
                      </span>
                    </p>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5 break-words whitespace-pre-line">
                      {formatBilingual(
                        t("request.checklistSubtitle"),
                        tKo("request.checklistSubtitle") || "해당하는 증상을 선택하시면 헬퍼님께 정확히 전달됩니다."
                      )}
                    </p>
                  </div>
                  {selectedProblemOptions.length > 0 && (
                    <span className={`droplet-pill ${theme.badgeBg} ${theme.badgeText} px-2.5 py-0.5 text-xs font-black shrink-0`}>
                      {t("request.checklistSelectedCount") ? t("request.checklistSelectedCount").replace("{count}", String(selectedProblemOptions.length)) : `${selectedProblemOptions.length}개 선택`}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {problemOptions.map((opt) => {
                    const isSelected = selectedProblemOptions.includes(opt.translated);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleProblemOption(opt.translated)}
                        className={`droplet-card flex items-start gap-2.5 p-2.5 text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? `${theme.selectedOptionBorder} ${theme.selectedOptionBg} ${theme.selectedOptionText} font-bold shadow-xs ring-1 ring-black/10`
                            : "border-slate-200/90 bg-white/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 font-medium"
                        }`}
                      >
                        <span
                          className={`droplet-checkbox mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] font-black ${
                            isSelected
                              ? `${theme.btnBg} border-transparent text-white`
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug break-words">{opt.translated}</p>
                          {locale !== "ko" && isBilingual && opt.translated !== opt.ko && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug break-words">
                              한국어: {opt.ko}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Question 2: Housing Region Selector OR Photos */}
          {isHousing ? (
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                {formatBilingual(t("request.housingRegionLabel"), "이사하시기 원하는 지역을 선택해 주세요")}
              </label>

              <div className="droplet-card mt-2.5 border border-amber-200 bg-amber-50/80 p-3.5 sm:p-4 shadow-xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-amber-800">
                        {formatBilingual(t("request.targetSearchRegion"), tKo("request.targetSearchRegion"))}
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-slate-900">
                        {formattedRegion}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openModal}
                    className="droplet-btn self-start bg-white px-3 py-1.5 text-xs font-black text-amber-900 shadow-2xs hover:bg-amber-100 border border-amber-300 active:scale-98 transition cursor-pointer sm:self-auto"
                  >
                    {formatBilingual(t("request.changeRegion"), tKo("request.changeRegion"))}
                  </button>
                </div>

                {/* Quick Dong selection */}
                <div className="mt-3 border-t border-amber-200/80 pt-2.5">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">
                    {formatBilingual(
                      `${localizedGunguName} ${t("request.selectTownIn")}`,
                      `${selectedRegion.gungu} 내 상세 지역 바로 선택:`
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                    {localizedNeighborDongs.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          setRegion({ ...selectedRegion, dong: d.ko });
                          setAddress(getLocalizedAddress({ ...selectedRegion, dong: d.ko }, locale));
                        }}
                        className={`droplet-pill px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                          selectedRegion.dong === d.ko
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {d.display}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                {formatBilingual(t("request.photosLabel"), "사진을 첨부해 주세요")}
              </label>

              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={({ target }) =>
                  setSelectedFileNames(Array.from(target.files ?? [], ({ name }) => name))
                }
              />

              <label
                htmlFor="photos"
                className="droplet-card mt-2.5 flex cursor-pointer items-center gap-3 border-2 border-slate-300 bg-white p-3 text-sm font-medium text-slate-900 transition hover:border-blue-400 shadow-2xs"
              >
                <span className="droplet-btn bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-800 shadow-2xs border border-slate-200">
                  {formatBilingual(t("request.chooseFile"), "파일 선택")}
                </span>
                <span className="truncate text-slate-500 text-xs sm:text-sm">
                  {selectedFileNames.length > 0
                    ? selectedFileNames.join(", ")
                    : formatBilingual(t("request.noFileChosen"), "선택된 파일 없음")}
                </span>
              </label>

              <div className="mt-1.5 text-xs font-medium text-slate-600">
                {isBilingual ? (
                  <>
                    <span>{t("request.photosHint")}</span>
                    <span className="block opacity-80 mt-0.5">
                      {tKo("request.photoHintText") || "사진을 보내주시면 문제를 파악하는 데 도움이 됩니다."}
                    </span>
                  </>
                ) : (
                  <span>{isKorean ? "사진을 보내주시면 문제를 파악하는 데 도움이 됩니다." : t("request.photosHint")}</span>
                )}
              </div>
            </div>
          )}

          {/* Address with Region Auto-fill helper */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                {formatBilingual(t("request.addressLabel"), "주소")}
              </label>
              <button
                type="button"
                onClick={handleApplyCurrentRegionToAddress}
                className="droplet-pill bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer shadow-2xs"
              >
                📍 {formatBilingual(
                  `${t("request.fillWithMyLocation")} · ${shortRegionText}`,
                  `내 지역 ${shortRegionText} 자동 입력`,
                )}
              </button>
            </div>

            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="droplet-card mt-2 w-full border-2 border-slate-300 bg-white p-3.5 text-sm sm:text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 shadow-2xs"
              placeholder={
                formatBilingual(
                  t("request.addressPlaceholder"),
                  `예: ${formattedRegion} 번지/아파트 동호수`
                )
              }
            />
          </div>

          {/* Privacy Guarantee Card: No Phone Number Collected */}
          <div className="droplet-card border border-emerald-200 bg-emerald-50/80 p-3.5 sm:p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 select-none">🔒</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black text-emerald-950 whitespace-pre-line">
                  {formatBilingual(
                    t("request.privacyNoPhoneTitle") || "개인정보 보호 안심 시스템 · 휴대폰 번호 수집 없음",
                    "개인정보 보호 안심 시스템 · 휴대폰 번호 수집 없음"
                  )}
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 mt-1 leading-relaxed whitespace-pre-line">
                  {formatBilingual(
                    t("request.privacyNoPhoneNote") || "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 헬퍼님과 안전하게 직접 연결됩니다.",
                    "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 헬퍼님과 안전하게 직접 연결됩니다."
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`droplet-btn-lg w-full ${theme.btnBg} px-6 py-3.5 sm:py-4 text-base sm:text-lg font-black text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{formatBilingual(t("request.translatingAndSubmitting") || "번역 및 접수 중...", "번역 및 접수 중...")}</span>
              </>
            ) : (
              formatBilingual(t("request.submitButton"), "서비스 신청하기")
            )}
          </button>
        </form>
      </section>

      <PrivacyNotice />
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <RequestPageContent />
    </Suspense>
  );
}

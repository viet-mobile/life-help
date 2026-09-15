"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { getRegionUIText } from "@/lib/region/regionLocalization";
import { dictionaries } from "@/messages";
import {
  SUPPORT_CATEGORIES,
  saveSupportRequest,
  registerSupportPartner,
  type SupportRequest,
} from "@/lib/support/supportStore";

export function SupportServiceView({ slug }: { slug: string }) {
  const { locale, isBilingual, t, formatBilingual } = useLocale();
  const { selectedRegion, formattedRegion, shortRegionText, openModal } = useRegion();
  const country = selectedRegion?.country || "KR";
  const sido = selectedRegion?.sido || "";
  const gungu = selectedRegion?.gungu || "";
  const dong = selectedRegion?.dong || "";

  const categoryMeta = SUPPORT_CATEGORIES[slug] || SUPPORT_CATEGORIES["bank-help"];

  // Active Tab: "seeker" (수요자 신청) vs "provider" (헬퍼 파트너 등록)
  const [activeTab, setActiveTab] = useState<"seeker" | "provider">("seeker");

  // Seeker State
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [seekerMemo, setSeekerMemo] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<SupportRequest | null>(null);
  const [seekerError, setSeekerError] = useState("");

  // Provider (헬퍼 파트너) State
  const [providerName, setProviderName] = useState("");
  const [providerPhone, setProviderPhone] = useState("");
  const [providerBio, setProviderBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([slug]);
  const [agreedToFee, setAgreedToFee] = useState(false);
  const [isProviderRegistered, setIsProviderRegistered] = useState(false);
  const [providerError, setProviderError] = useState("");

  const checklistOptions = useMemo(() => {
    const fromDict = (dictionaries[locale] as Record<string, unknown> | undefined)?.supportChecklist as Record<string, string[]> | undefined;
    const catList = fromDict?.[categoryMeta.key];
    if (Array.isArray(catList) && catList.length > 0) {
      return catList;
    }
    if (locale === "vi") return categoryMeta.checklistOptionsVi;
    if (locale === "en") return categoryMeta.checklistOptionsEn;
    return categoryMeta.checklistOptionsKo;
  }, [categoryMeta, locale]);

  const categoryTitle = t(`service.${categoryMeta.key}`) || categoryMeta.nameKo;
  const categoryDesc = t(`serviceDesc.${categoryMeta.key}`) || categoryMeta.descriptionKo;

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

  const handleSeekerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSeekerError("");

    const phoneClean = customerPhone.replace(/\s+/g, "").trim();
    if (!phoneClean || phoneClean.length < 9) {
      setSeekerError(t("support.phoneError"));
      return;
    }

    if (selectedNeeds.length === 0) {
      setSeekerError(t("support.needsError"));
      return;
    }

    const newReq = saveSupportRequest({
      category: slug,
      country,
      sido,
      gungu,
      dong,
      customerRealPhone: phoneClean,
      selectedNeeds,
      memo: seekerMemo,
    });

    setSubmittedRequest(newReq);
  };

  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError("");

    if (!providerName.trim()) {
      setProviderError(
        locale === "ko"
          ? "이름 또는 업체명을 입력해 주세요."
          : "Please enter your name or company name."
      );
      return;
    }

    const phoneClean = providerPhone.replace(/\s+/g, "").trim();
    if (!phoneClean || phoneClean.length < 9) {
      setProviderError(
        locale === "ko"
          ? "올바른 연락처 번호를 입력해 주세요."
          : "Please enter a valid phone number."
      );
      return;
    }

    if (selectedCategories.length === 0) {
      setProviderError(
        locale === "ko"
          ? "지원 가능한 카테고리를 1개 이상 선택해 주세요."
          : "Please select at least one support category."
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

    registerSupportPartner({
      name: providerName.trim(),
      phone: phoneClean,
      categories: selectedCategories,
      country,
      regions: [formattedRegion],
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
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-900 transition hover:bg-blue-100"
            >
              <span>📍</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{shortRegionText}</span>
              <span className="text-blue-500 text-[10px]">▾</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              {locale === "ko" ? "← 메인으로" : "← Home"}
            </Link>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      {/* Hero Banner with Category Info */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-4 py-8 text-white sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-4xl shadow-inner backdrop-blur-xs">
              {categoryMeta.icon}
            </span>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-bold text-blue-200 border border-blue-400/30">
                <span>🔒 {t("support.badge050")}</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-black sm:text-3xl lg:text-4xl text-white">
                {categoryTitle}
              </h1>
              {isBilingual && locale !== "ko" && (
                <p className="mt-0.5 text-sm font-bold text-blue-200">{categoryMeta.nameKo}</p>
              )}
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-blue-100/90 leading-relaxed">
            {categoryDesc}
          </p>

          {/* Dual Action Tab Selector */}
          <div className="mt-8 flex rounded-2xl bg-white/10 p-1.5 max-w-md border border-white/20">
            <button
              type="button"
              onClick={() => setActiveTab("seeker")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition cursor-pointer text-center ${
                activeTab === "seeker"
                  ? "bg-white text-blue-950 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              💡 {t("support.requestTab")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("provider")}
              className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition cursor-pointer text-center ${
                activeTab === "provider"
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🤝 {t("support.partnerTab")}
            </button>
          </div>
        </div>
      </section>

      {/* Main Form Body */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {activeTab === "seeker" ? (
          /* ========================================================================= */
          /* SEEKER WORKFLOW (수요자: 체크리스트 + 050 안심번호 발급) */
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

              {/* Direct Phone Contact Card */}
              <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    📞 신청자 연락처
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                    접수 완료
                  </span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-900 tracking-wider">
                  {submittedRequest.customerRealPhone}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  선택하신 지역의 근무 중인 전담 헬퍼에게 신청 내역이 즉시 전달됩니다.
                </p>
              </div>

              {/* Summary Details */}
              <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-5 text-xs sm:text-sm border border-emerald-100">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t("support.serviceLabel")}</span>
                  <span className="font-bold text-slate-900">{categoryTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t("support.regionLabel")}</span>
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
                    setCustomerPhone("");
                    setSeekerMemo("");
                  }}
                  className="rounded-xl bg-blue-700 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-800 transition"
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
              {/* Region confirmation card */}
              <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
                    📍
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase">
                      {getRegionUIText("yourLocation", locale, isBilingual)}
                    </span>
                    <p className="text-base sm:text-lg font-black text-blue-950">
                      {formattedRegion}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openModal}
                  className="rounded-xl bg-white border border-blue-300 px-4 py-2 text-xs font-extrabold text-blue-900 hover:bg-blue-100 transition cursor-pointer self-start sm:self-auto"
                >
                  {getRegionUIText("changeLocation", locale, false)} ▾
                </button>
              </div>

              {/* Questionnaire Checklist */}
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
                            ? "border-blue-600 bg-blue-50/60 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNeed(opt)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Phone & Direct Helper Match Notice */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📞</span>
                  <span>{t("support.contactPhoneLabel")}</span>
                </h3>

                {/* Direct Helper Connection Notice */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-extrabold text-sm">
                    <span>🤝</span>
                    <span>지역 전문 헬퍼 1:1 직결</span>
                  </div>
                  <p className="mt-1 text-blue-800 leading-relaxed font-medium">
                    고객님이 요청하신 지역과 서비스에 맞춰 현재 활동 가능한 인증 헬퍼에게 안전하게 전달됩니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("support.phoneInputLabel")}
                  </label>
                  <input
                    type="tel"
                    placeholder="예: 010-1234-5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("support.memoInputLabel")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t("support.memoPlaceholder")}
                    value={seekerMemo}
                    onChange={(e) => setSeekerMemo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {seekerError && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                  ⚠️ {seekerError}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-700 py-4 text-center text-sm sm:text-base font-black text-white shadow-lg hover:bg-blue-800 transition active:scale-[0.99] cursor-pointer"
              >
                🤝 {formatBilingual(t("common.apply"), "도움 신청하기")}
              </button>
            </form>
          )
        ) : (
          /* ========================================================================= */
          /* PROVIDER WORKFLOW (제공자 - 헬퍼 파트너 가입 신청) */
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
                <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-relaxed">
                  {t("support.providerDesc")}
                </p>
              </div>

              {/* Provider Info Input */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("support.providerNameLabel")} *
                  </label>
                  <input
                    type="text"
                    placeholder="예: 글로벌 비자·행정 지원센터 (홍길동)"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("support.providerPhoneLabel")} *
                  </label>
                  <input
                    type="tel"
                    placeholder="예: 010-1234-5678"
                    value={providerPhone}
                    onChange={(e) => setProviderPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t("support.providerCatLabel")} *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.values(SUPPORT_CATEGORIES).map((cat) => {
                      const isChecked = selectedCategories.includes(cat.slug);
                      return (
                        <label
                          key={cat.slug}
                          className={`flex items-center gap-3 rounded-2xl border p-3 transition cursor-pointer ${
                            isChecked
                              ? "border-amber-500 bg-amber-50/70"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.slug)}
                            className="h-4 w-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800">
                            {t(`service.${cat.key}`) || cat.nameKo}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Region */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("support.providerRegionLabel")}
                  </label>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs font-bold text-slate-800">
                    <span>📍 {formattedRegion}</span>
                    <button
                      type="button"
                      onClick={openModal}
                      className="ml-auto text-blue-700 hover:underline cursor-pointer"
                    >
                      {getRegionUIText("changeLocation", locale, false)} ▾
                    </button>
                  </div>
                </div>

                {/* Experience & Bio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("support.providerBioLabel")}
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
                className="w-full rounded-2xl bg-amber-500 py-4 text-center text-sm sm:text-base font-black text-slate-950 shadow-lg hover:bg-amber-400 transition active:scale-[0.99] cursor-pointer"
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


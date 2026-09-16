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
import { languages } from "@/messages";

function RequestPageContent() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get("service") ?? "";
  const { locale, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const currentMeta = languages.find((l) => l.code === locale);

  const { selectedRegion, setRegion, formattedRegion, shortRegionText, openModal } = useRegion();

  const [userSelectedSlug, setUserSelectedSlug] = useState<string | null>(null);
  const selectedSlug = userSelectedSlug ?? (slugFromUrl || "toilet-clog");
  const setSelectedSlug = (slug: string) => setUserSelectedSlug(slug);

  const [submitted, setSubmitted] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [selectedProblemOptions, setSelectedProblemOptions] = useState<string[]>([]);
  const [translatedResult, setTranslatedResult] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problemOptions = useMemo(
    () => getProblemOptionsForService(selectedSlug, locale),
    [selectedSlug, locale]
  );

  const toggleProblemOption = (label: string) => {
    setSelectedProblemOptions((prev) =>
      prev.includes(label) ? prev.filter((o) => o !== label) : [...prev, label]
    );
  };

  const service = getService(selectedSlug);
  const isHousing = selectedSlug === "housing" || service?.key === "housing";

  // Sorted and localized neighbor dongs for current gungu
  const localizedNeighborDongs = useMemo(
    () => getLocalizedDongList(selectedRegion.sido, selectedRegion.gungu, locale),
    [selectedRegion.sido, selectedRegion.gungu, locale],
  );

  // Localized Gungu name for current locale (prevents Korean leakage in monolingual mode)
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

    saveServiceRequest({
      serviceSlug: selectedSlug,
      serviceName: service
        ? isKorean
          ? tKo(`service.${service.key}`)
          : t(`service.${service.key}`)
        : "일반 서비스",
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

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2.5 sm:px-5 sm:py-4 gap-2">
            <Link href="/" className="inline-flex items-center shrink-0" title="LIFE.HELP Home">
              <BrandLogo size="md" priority />
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-5 py-10">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <div className="text-5xl">✅</div>
            {locale === "ko" ? (
              <h1 className="mt-5 text-2xl font-bold text-slate-900 leading-snug">
                서비스 신청이
                <br />
                접수되었습니다.
              </h1>
            ) : isBilingual ? (
              <h1 className="mt-5 text-2xl font-bold text-slate-900 leading-snug">
                <span>{t("request.successTitle")}</span>
                <span className="mt-2 block text-lg font-semibold text-slate-600">
                  서비스 신청이
                  <br />
                  접수되었습니다.
                </span>
              </h1>
            ) : (
              <h1 className="mt-5 text-2xl font-bold text-slate-900 leading-snug">
                {t("request.successTitle")}
              </h1>
            )}
            <div className="mt-4 text-base leading-7 font-medium text-slate-600">
              {isBilingual ? (
                <>
                  <span>{t("request.successNotice")}</span>
                  <span className="block mt-1 opacity-80">
                    작성하신 문제 상황이 서비스 제공자의 언어로 정확히 번역되어 원문과 함께 전달되었습니다.
                  </span>
                </>
              ) : (
                <span>
                  {locale === "ko"
                    ? "작성하신 문제 상황이 서비스 제공자의 언어로 정확히 번역되어 원문과 함께 전달되었습니다."
                    : t("request.successNotice")}
                </span>
              )}
            </div>

            {/* Selected Options Summary */}
            {selectedProblemOptions.length > 0 && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-left">
                <p className="text-xs font-black text-blue-950 mb-2">
                  📋 {t("request.selectedChecklistItems") ? t("request.selectedChecklistItems").replace("{count}", String(selectedProblemOptions.length)) : `선택하신 문제 상황 예시 (${selectedProblemOptions.length}건):`}
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
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2.5">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 block uppercase">
                    📝 {t("request.customerOriginalText") || "고객 작성 원문"} ({currentMeta?.nativeName || locale}):
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 break-words">
                    {problemDescription.trim()}
                  </p>
                </div>
                {translatedResult && locale !== "ko" && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-extrabold text-emerald-700 block uppercase">
                      💡 {t("request.providerTranslatedText") || "서비스 제공자(헬퍼) 전달 번역문 (한국어)"}:
                    </span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5 break-words">
                      {translatedResult}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Protection Guarantee */}
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-left">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🔒</span>
                <span>{formatBilingual(t("request.privacyGuaranteeTitle") || "개인정보 완벽 보호", "개인정보 완벽 보호")}</span>
              </p>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                {formatBilingual(
                  t("request.privacyNoPhoneNote"),
                  "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 서비스 제공자(헬퍼)와 안전하게 직접 연결됩니다."
                )}
              </p>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/chat"
                className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-7 py-3.5 text-base font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition cursor-pointer text-center"
              >
                💬 {formatBilingual(t("request.startLiveChat") || "실시간 1:1 대화 연결", "실시간 1:1 대화 연결")}
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto rounded-2xl border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition cursor-pointer text-center"
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
    <main className="min-h-screen bg-slate-50 overflow-x-hidden">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-2xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2 sm:px-5 sm:py-3 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <Link href="/" className="inline-flex items-center shrink-0" title="LIFE.HELP Home">
              <BrandLogo size="md" priority />
            </Link>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 max-w-[75px] xs:max-w-[105px] sm:max-w-[160px] md:max-w-none"
            >
              <span className="shrink-0">📍</span>
              <span className="truncate">{shortRegionText}</span>
              <span className="text-[9px] text-slate-400 shrink-0">▾</span>
            </button>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 sm:px-5 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
            {formatBilingual(t("request.title"), "서비스 신청")}
          </h1>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-700 hover:underline shrink-0"
          >
            ← {formatBilingual(t("common.back"), "홈으로")}
          </Link>
        </div>

        {/* Service selection card with link to service detail page */}
        <div className="mt-5 sm:mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
              {formatBilingual(t("request.selectedService"), "선택한 서비스")}
            </span>
            {service && (
              <Link
                href={`/services/${service.slug}`}
                className="text-xs font-bold text-blue-700 hover:underline shrink-0"
              >
                {formatBilingual(t("common.detail"), "서비스 안내 보기 →")}
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-3xl sm:text-4xl shrink-0 select-none">{service?.icon || "🛠️"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug break-words whitespace-pre-line">
                  {service
                    ? formatBilingual(t(`service.${service.key}`), tKo(`service.${service.key}`))
                    : formatBilingual(t("customer.servicesTitle"), "서비스를 선택해 주세요")}
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 min-w-0">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full md:w-auto md:max-w-[280px] lg:max-w-xs rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none hover:border-blue-500 focus:border-blue-600 shadow-2xs cursor-pointer truncate"
                aria-label="Change service"
              >
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.icon} {isKorean ? tKo(`service.${s.key}`) : t(`service.${s.key}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Question 1: Problem description OR Housing requirements */}
          <div>
            <label className="block text-base font-bold text-slate-900 whitespace-pre-line">
              {isHousing
                ? formatBilingual(t("request.housingLabel"), "어떤 집을 찾으시나요?")
                : formatBilingual(t("request.problemLabel"), "어떤 문제가 있나요?")}
            </label>

            <textarea
              required
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="mt-3 min-h-32 w-full rounded-2xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 shadow-2xs"
              placeholder={getProblemPlaceholder()}
            />

            {/* 10~15 Common problem checklist options */}
            {problemOptions.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <span className="shrink-0">📋</span>
                      <span className="break-words whitespace-pre-line">
                        {formatBilingual(
                          t("request.checklistTitle"),
                          tKo("request.checklistTitle") || "자주 발생하는 주요 증상/요청 예시 (선택 가능)"
                        )}
                      </span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 break-words whitespace-pre-line">
                      {formatBilingual(
                        t("request.checklistSubtitle"),
                        tKo("request.checklistSubtitle") || "해당하는 증상을 선택하시면 서비스 제공자에게 정확히 전달됩니다."
                      )}
                    </p>
                  </div>
                  {selectedProblemOptions.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 shrink-0">
                      {t("request.checklistSelectedCount") ? t("request.checklistSelectedCount").replace("{count}", String(selectedProblemOptions.length)) : `${selectedProblemOptions.length}개 선택`}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {problemOptions.map((opt) => {
                    const isSelected = selectedProblemOptions.includes(opt.translated);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleProblemOption(opt.translated)}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 text-blue-950 font-bold shadow-xs ring-1 ring-blue-600/30"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60 font-medium"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-black ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug break-words">{opt.translated}</p>
                          {locale !== "ko" && isBilingual && opt.translated !== opt.ko && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug break-words">
                              (한국어: {opt.ko})
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
              <label className="block text-base font-bold text-slate-900">
                {formatBilingual(t("request.housingRegionLabel"), "이사하시기 원하는 지역을 선택해 주세요")}
              </label>

              {/* Synchronized Region Card for Housing */}
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-xs font-bold uppercase text-blue-800">
                        {formatBilingual(t("request.targetSearchRegion"), tKo("request.targetSearchRegion"))}
                      </p>
                      <p className="text-base font-extrabold text-slate-900">
                        {formattedRegion}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openModal}
                    className="self-start rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-blue-700 shadow-2xs hover:bg-blue-50 hover:shadow-xs border border-blue-200/80 active:scale-98 transition-all duration-150 cursor-pointer sm:self-auto"
                  >
                    {formatBilingual(t("request.changeRegion"), tKo("request.changeRegion"))}
                  </button>
                </div>

                {/* Quick Dong selection in the same Gungu */}
                <div className="mt-3 border-t border-blue-200/70 pt-3">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    {formatBilingual(
                      `${localizedGunguName} ${t("request.selectTownIn")}`,
                      `${selectedRegion.gungu} 내 상세 지역 바로 선택:`,
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {localizedNeighborDongs.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          setRegion({ ...selectedRegion, dong: d.ko });
                          setAddress(getLocalizedAddress({ ...selectedRegion, dong: d.ko }, locale));
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                          selectedRegion.dong === d.ko
                            ? "bg-blue-700 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
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
              <label className="block text-base font-bold text-slate-900">
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
                className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-300 bg-white p-3 text-base font-medium text-slate-900 transition hover:border-blue-400 shadow-2xs"
              >
                <span className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-extrabold text-slate-800 shadow-2xs border border-slate-200">
                  {formatBilingual(t("request.chooseFile"), "파일 선택")}
                </span>
                <span className="truncate text-slate-500 text-xs sm:text-sm">
                  {selectedFileNames.length > 0
                    ? selectedFileNames.join(", ")
                    : formatBilingual(t("request.noFileChosen"), "선택된 파일 없음")}
                </span>
              </label>

              <div className="mt-2 text-xs sm:text-sm font-medium text-slate-600">
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
              <label className="block text-base font-bold text-slate-900">
                {formatBilingual(t("request.addressLabel"), "주소")}
              </label>
              <button
                type="button"
                onClick={handleApplyCurrentRegionToAddress}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
              >
                📍 {formatBilingual(
                  `${t("request.fillWithMyLocation")} (${shortRegionText})`,
                  `내 지역(${shortRegionText}) 자동 입력`,
                )}
              </button>
            </div>

            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-3 w-full rounded-2xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 shadow-2xs"
              placeholder={
                formatBilingual(
                  t("request.addressPlaceholder"),
                  `예: ${formattedRegion} 번지/아파트 동호수`
                )
              }
            />
          </div>

          {/* Privacy Guarantee Card: No Phone Number Collected */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 select-none">🔒</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-emerald-950 whitespace-pre-line">
                  {formatBilingual(
                    t("request.privacyNoPhoneTitle") || "개인정보 보호 안심 시스템 (휴대폰 번호 수집 없음)",
                    "개인정보 보호 안심 시스템 (휴대폰 번호 수집 없음)"
                  )}
                </p>
                <p className="text-xs font-semibold text-emerald-800 mt-1 leading-relaxed whitespace-pre-line">
                  {formatBilingual(
                    t("request.privacyNoPhoneNote") || "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 서비스 제공자(헬퍼)와 안전하게 직접 연결됩니다.",
                    "저희 시스템은 고객님의 개인정보 보호를 위해 휴대폰 번호를 기입받지 않습니다. 본 웹사이트 또는 LIFE.HELP 앱의 실시간 대화방을 통해 서비스 제공자(헬퍼)와 안전하게 직접 연결됩니다."
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 text-lg font-black text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] border border-blue-500/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
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

function RequestPageContent() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get("service") ?? "";
  const { locale, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";

  const { selectedRegion, setRegion, formattedRegion, shortRegionText, openModal } = useRegion();

  const [userSelectedSlug, setUserSelectedSlug] = useState<string | null>(null);
  const selectedSlug = userSelectedSlug ?? (slugFromUrl || "toilet-clog");
  const setSelectedSlug = (slug: string) => setUserSelectedSlug(slug);

  const [submitted, setSubmitted] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState<string>("");

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

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-extrabold text-blue-700 text-lg sm:text-xl">
              LIFE.HELP
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
                  <span className="block mt-1 opacity-80">현재는 테스트 접수 단계입니다.</span>
                </>
              ) : (
                <span>{locale === "ko" ? "현재는 테스트 접수 단계입니다." : t("request.successNotice")}</span>
              )}
            </div>
            <Link
              href="/"
              className="mt-7 inline-block rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-4 text-lg font-black text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] border border-blue-500/30 cursor-pointer"
            >
              {formatBilingual(t("request.backHome"), "홈으로 돌아가기")}
            </Link>
          </div>
        </section>

        <PrivacyNotice />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-blue-700 text-lg sm:text-xl">
              LIFE.HELP
            </Link>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>📍</span>
              <span className="max-w-[120px] truncate sm:max-w-none">{shortRegionText}</span>
              <span className="text-[9px] text-slate-400">▾</span>
            </button>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            {formatBilingual(t("request.title"), "서비스 신청")}
          </h1>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            ← {formatBilingual(t("common.back"), "홈으로")}
          </Link>
        </div>

        {/* Service selection card with link to service detail page */}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              {formatBilingual(t("request.selectedService"), "선택한 서비스")}
            </span>
            {service && (
              <Link
                href={`/services/${service.slug}`}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                {formatBilingual(t("common.detail"), "서비스 안내 보기 →")}
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{service?.icon || "🛠️"}</span>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {service
                    ? formatBilingual(t(`service.${service.key}`), tKo(`service.${service.key}`))
                    : formatBilingual(t("customer.servicesTitle"), "서비스를 선택해 주세요")}
                </p>
              </div>
            </div>

            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded-xl border border-blue-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-blue-500 focus:border-blue-600 sm:text-sm shadow-2xs cursor-pointer"
              aria-label="Change service"
            >
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.icon} {isKorean ? tKo(`service.${s.key}`) : isBilingual ? `${t(`service.${s.key}`)} (${tKo(`service.${s.key}`)})` : t(`service.${s.key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            saveServiceRequest({
              serviceSlug: selectedSlug,
              serviceName: service
                ? isKorean
                  ? tKo(`service.${service.key}`)
                  : t(`service.${service.key}`)
                : "일반 서비스",
              serviceIcon: service?.icon || "🛠️",
              description: problemDescription.trim() || (isHousing ? "주거/원룸 탐색 요청" : "긴급 수리 요청"),
              sido: selectedRegion.sido,
              gungu: selectedRegion.gungu,
              address: address.trim(),
              phone: phone.trim(),
              fileNames: selectedFileNames,
            });
            setSubmitted(true);
          }}
        >
          {/* Question 1: Problem description OR Housing requirements */}
          <div>
            <label className="block text-base font-bold text-slate-900">
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

          {/* Phone */}
          <div>
            <label className="block text-base font-bold text-slate-900">
              {formatBilingual(t("request.phoneLabel"), "연락처")}
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-3 w-full rounded-2xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 shadow-2xs font-mono"
              placeholder="010-0000-0000"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 text-lg font-black text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] border border-blue-500/30 cursor-pointer"
          >
            {formatBilingual(t("request.submitButton"), "서비스 신청하기")}
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

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { getService, services } from "@/lib/services";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { getLocalizedDongList, getLocalizedAddress } from "@/lib/region/regionLocalization";

function RequestPageContent() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get("service") ?? "";
  const { locale, t, tKo } = useLocale();
  const isKorean = locale === "ko";

  const { selectedRegion, setRegion, formattedRegion, shortRegionText, openModal } = useRegion();

  const [userSelectedSlug, setUserSelectedSlug] = useState<string | null>(null);
  const selectedSlug = userSelectedSlug ?? (slugFromUrl || "toilet-clog");
  const setSelectedSlug = (slug: string) => setUserSelectedSlug(slug);

  const [submitted, setSubmitted] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const service = getService(selectedSlug);
  const isHousing = selectedSlug === "housing" || service?.key === "housing";

  // Sorted and localized neighbor dongs for current gungu
  const localizedNeighborDongs = useMemo(
    () => getLocalizedDongList(selectedRegion.sido, selectedRegion.gungu, locale),
    [selectedRegion.sido, selectedRegion.gungu, locale],
  );

  // Dynamic problem placeholder based on the currently selected service
  const getProblemPlaceholder = () => {
    const key = service?.key || "toilet";
    const currentText = t(`serviceProblems.${key}`);
    const koText = tKo(`serviceProblems.${key}`);

    if (isKorean) {
      return `예: ${koText}`;
    }
    return `${currentText}\n예: ${koText}`;
  };

  const handleApplyCurrentRegionToAddress = () => {
    setAddress(formattedRegion);
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
            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              {isKorean
                ? "서비스 신청이 접수되었습니다."
                : `${t("request.successTitle")} · 서비스 신청이 접수되었습니다.`}
            </h1>
            <div className="mt-4 text-base leading-7 font-medium text-slate-600">
              {isKorean ? (
                "현재는 테스트 접수 단계입니다."
              ) : (
                <>
                  <span>{t("request.successNotice")}</span>
                  <span className="block mt-1 opacity-80">현재는 테스트 접수 단계입니다.</span>
                </>
              )}
            </div>
            <Link
              href="/"
              className="mt-7 inline-block rounded-xl bg-blue-700 px-6 py-4 text-lg font-bold text-white transition hover:bg-blue-800"
            >
              {isKorean ? "홈으로 돌아가기" : `${t("request.backHome")} · 홈으로 돌아가기`}
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
            {isKorean ? "서비스 신청" : `${t("request.title")} · 서비스 신청`}
          </h1>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            ← {isKorean ? "홈으로" : `${t("common.back")} · 홈`}
          </Link>
        </div>

        {/* Service selection card with link to service detail page */}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              {isKorean ? "선택한 서비스" : `${t("request.selectedService")} · 선택한 서비스`}
            </span>
            {service && (
              <Link
                href={`/services/${service.slug}`}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                {isKorean ? "서비스 안내 보기 →" : `${t("common.detail")} · 상세 안내 →`}
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{service?.icon || "🛠️"}</span>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {service
                    ? isKorean
                      ? tKo(`service.${service.key}`)
                      : `${t(`service.${service.key}`)} · ${tKo(`service.${service.key}`)}`
                    : isKorean
                      ? "서비스를 선택해 주세요"
                      : `${t("customer.servicesTitle")} · 서비스 선택`}
                </p>
              </div>
            </div>

            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none hover:border-blue-500 focus:border-blue-600 sm:text-sm"
              aria-label="Change service"
            >
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.icon} {isKorean ? tKo(`service.${s.key}`) : `${t(`service.${s.key}`)} (${tKo(`service.${s.key}`)})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          {/* Question 1: Problem description OR Housing requirements */}
          <div>
            <label className="block text-base font-bold text-slate-900">
              {isHousing
                ? isKorean
                  ? "어떤 집을 찾으시나요?"
                  : `${t("request.housingLabel")} · 어떤 집을 찾으시나요?`
                : isKorean
                  ? "어떤 문제가 있나요?"
                  : `${t("request.problemLabel")} · 어떤 문제가 있나요?`}
            </label>

            <textarea
              required
              rows={4}
              className="mt-3 min-h-32 w-full rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600"
              placeholder={getProblemPlaceholder()}
            />
          </div>

          {/* Question 2: Housing Region Selector OR Photos */}
          {isHousing ? (
            <div>
              <label className="block text-base font-bold text-slate-900">
                {isKorean
                  ? "이사하시기 원하는 지역을 선택해 주세요"
                  : `${t("request.housingRegionLabel")} · 이사하시기 원하는 지역을 선택해 주세요`}
              </label>

              {/* Synchronized Region Card for Housing */}
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-xs font-bold uppercase text-blue-800">
                        {isKorean ? "메인 설정 기반 희망 지역" : "Target Search Region · 설정 지역"}
                      </p>
                      <p className="text-base font-extrabold text-slate-900">
                        {formattedRegion}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openModal}
                    className="self-start rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 sm:self-auto"
                  >
                    {isKorean ? "다른 시·도/구·군 변경 ▾" : "Change Province/City · 지역 변경 ▾"}
                  </button>
                </div>

                {/* Quick Dong selection in the same Gungu */}
                <div className="mt-3 border-t border-blue-200/70 pt-3">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    {isKorean
                      ? `${selectedRegion.gungu} 내 상세 동/읍/면 바로 선택:`
                      : `Select town in ${selectedRegion.gungu}:`}
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
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          selectedRegion.dong === d.ko
                            ? "bg-blue-700 text-white shadow-xs"
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
              <label className="block text-base font-bold text-slate-900">
                {isKorean
                  ? "사진을 첨부해 주세요"
                  : `${t("request.photosLabel")} · 사진을 첨부해 주세요`}
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
                className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-300 bg-white p-3 text-base font-medium text-slate-900 transition hover:border-slate-400"
              >
                <span className="rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-800">
                  {isKorean ? "파일 선택" : `${t("request.chooseFile")} · 파일 선택`}
                </span>
                <span className="truncate text-slate-500 text-sm">
                  {selectedFileNames.length > 0
                    ? selectedFileNames.join(", ")
                    : isKorean
                      ? "선택된 파일 없음"
                      : `${t("request.noFileChosen")} · 선택된 파일 없음`}
                </span>
              </label>

              <div className="mt-2 text-sm font-medium text-slate-600">
                {isKorean ? (
                  "사진을 보내주시면 문제를 파악하는 데 도움이 됩니다."
                ) : (
                  <>
                    <span>{t("request.photosHint")}</span>
                    <span className="block opacity-80">사진을 보내주시면 문제를 파악하는 데 도움이 됩니다.</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Address with Region Auto-fill helper */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-base font-bold text-slate-900">
                {isKorean ? "주소" : `${t("request.addressLabel")} · 주소`}
              </label>
              <button
                type="button"
                onClick={handleApplyCurrentRegionToAddress}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                📍 {isKorean ? `내 지역(${shortRegionText}) 자동 입력` : `Fill with my location (${shortRegionText})`}
              </button>
            </div>

            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-3 w-full rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600"
              placeholder={
                isKorean
                  ? `예: ${formattedRegion} 번지/아파트 동호수`
                  : `${t("request.addressPlaceholder")} · 예: ${formattedRegion}`
              }
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-base font-bold text-slate-900">
              {isKorean ? "연락처" : `${t("request.phoneLabel")} · 연락처`}
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-3 w-full rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600"
              placeholder="010-0000-0000"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-700 px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            {isKorean
              ? "서비스 신청하기"
              : `${t("request.submitButton")} · 서비스 신청하기`}
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

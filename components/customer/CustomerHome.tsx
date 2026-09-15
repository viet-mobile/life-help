"use client";

import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { getRegionUIText } from "@/lib/region/regionLocalization";
import PrivacyNotice from "@/components/customer/PrivacyNotice";

const mainConsolidatedServices = [
  {
    icons: ["🚽", "🚰", "🕳️"],
    key: "clog",
    slug: "clog-clearing",
    ko: "변기, 싱크대, 하수구 등 각종 막힘 해결",
    descKo: "변기·싱크대·하수구 역류, 고압세척, 배관 내시경 정밀 통경",
  },
  {
    icons: ["💧", "🔎", "🚿", "🔧"],
    key: "leakPlumbing",
    slug: "leak-plumbing",
    ko: "누수 방지, 누수 탐지, 수도 배관 공사 등",
    descKo: "첨단 누수 탐지, 수도 동파 수리, 노후 배관 교체 및 방수 공사",
  },
] as const;

const standardServices = [
  ["♨️", "boiler", "boiler"],
  ["🧹", "cleaning", "cleaning"],
  ["🏠", "housing", "housing"],
] as const;

const lifeSupportServices = [
  ["🏦", "bankHelp", "bank-help"],
  ["📑", "insuranceHelp", "insurance-help"],
  ["💼", "jobHelp", "job-help"],
  ["🏥", "hospitalHelp", "hospital-help"],
  ["📱", "mobileHelp", "mobile-help"],
] as const;

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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-1.5 px-3 py-2 sm:gap-4 sm:px-5 sm:py-2.5 md:py-3">
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center shrink-0"
              title="LIFE.HELP Home"
            >
              <BrandLogo size="md" priority />
            </Link>

            {/* Region quick badge in header */}
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50/70 px-2 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-blue-900 transition hover:bg-blue-100 max-w-[90px] sm:max-w-none"
              title={formatBilingual(getRegionUIText("changeLocation", locale, isBilingual), "지역 변경")}
            >
              <span className="shrink-0">📍</span>
              <span className="truncate">{shortRegionText}</span>
              <span className="text-blue-500 text-[10px] shrink-0">▾</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Chat Link in Header */}
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shrink-0"
              title={formatBilingual(t("common.nativeConsultationCenter"), "모국어 실시간 상담 센터")}
            >
              <span className="shrink-0">💬</span>
              <span className="hidden sm:inline">
                {formatBilingual(t("common.nativeConsultation"), "모국어 상담")}
              </span>
            </Link>

            <Link
              href="/request"
              className="hidden rounded-xl bg-blue-50 px-3.5 py-1.5 text-center text-blue-700 hover:bg-blue-100 md:inline-flex md:flex-col md:items-center font-bold transition shrink-0"
            >
              {isBilingual ? (
                <>
                  <span className="text-xs font-bold leading-tight">{t("request.title")}</span>
                  <span className="text-[10px] font-semibold text-blue-500">서비스 신청</span>
                </>
              ) : (
                <span className="text-xs font-bold py-0.5">{locale === "ko" ? "서비스 신청" : t("request.title")}</span>
              )}
            </Link>

            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-800 via-blue-700 to-indigo-800 px-5 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-3xl text-3xl leading-tight ${headingWeight} sm:text-4xl lg:text-5xl`}>
            {t("customer.tagline")}
            {isBilingual && (
              <span className="mt-2.5 block text-xl font-bold text-blue-200 sm:text-2xl">
                {tKo("customer.tagline")}
              </span>
            )}
          </h1>

          {/* Region Selection Banner on Main Screen */}
          <div className="mt-8 max-w-3xl rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                  📍
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                    {getRegionUIText("yourLocation", locale, isBilingual)}
                  </p>
                  <p className="mt-0.5 text-lg font-black text-white sm:text-xl">
                    {formattedRegion}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="shrink-0 rounded-2xl bg-white px-5 py-2.5 text-center shadow-sm transition hover:bg-blue-50 active:scale-98 flex flex-col items-center justify-center"
              >
                {isBilingual ? (
                  <>
                    <span className="text-xs sm:text-sm font-black text-blue-900 leading-snug">
                      {getRegionUIText("changeLocation", locale, false)} ▾
                    </span>
                    <span className="mt-0.5 text-[11px] font-bold text-blue-600">
                      지역 변경
                    </span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base font-black text-blue-900 py-1">
                    {locale === "ko" ? "지역 변경 ▾" : `${getRegionUIText("changeLocation", locale, false)} ▾`}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Hero Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Direct link to request/page.tsx */}
            <Link href="/request" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto flex flex-col items-center justify-center rounded-2xl bg-red-600 hover:bg-red-700 px-6 py-3 text-white shadow-md transition active:scale-98 cursor-pointer">
                {isBilingual ? (
                  <>
                    <span className="text-base sm:text-lg font-black leading-snug">
                      🚨 {t("customer.emergency")}
                    </span>
                    <span className="mt-0.5 text-xs sm:text-sm font-bold text-red-100">
                      긴급 지원 신청
                    </span>
                  </>
                ) : (
                  <span className="text-base sm:text-lg font-black py-1">
                    🚨 {t("customer.emergency")}
                  </span>
                )}
              </div>
            </Link>

            <Link href="/services/clog-clearing" className="w-full sm:w-auto">
              <div className="w-full sm:w-auto flex flex-col items-center justify-center rounded-2xl bg-white/15 hover:bg-white/25 px-6 py-3 text-white backdrop-blur-xs transition active:scale-98 border border-white/20 cursor-pointer">
                {isBilingual ? (
                  <>
                    <span className="text-base sm:text-lg font-extrabold leading-snug">
                      {t("customer.servicesTitle")}
                    </span>
                    <span className="mt-0.5 text-xs sm:text-sm font-semibold text-blue-100">
                      서비스 목록 둘러보기
                    </span>
                  </>
                ) : (
                  <span className="text-base sm:text-lg font-extrabold py-1">
                    {locale === "ko" ? "서비스 목록 둘러보기" : t("customer.servicesTitle")}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Helper Master Registration Banner linking to tech.life.help */}
      <section className="mx-auto max-w-6xl px-5 pt-8">
        <Link
          href="/tech"
          className="group block rounded-2xl border-2 border-amber-300 bg-linear-to-r from-amber-50 via-orange-50 to-amber-100 p-5 sm:p-6 shadow-xs transition hover:border-amber-500 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-2xl group-hover:scale-110 transition shadow-xs">
                🎖️
              </span>
              <div>
                <p className="text-sm sm:text-base lg:text-lg font-black text-amber-950 leading-snug">
                  {t("customer.helperMasterBanner")}
                </p>
                {isBilingual && (
                  <p className="mt-1 text-xs sm:text-sm font-bold text-amber-800">
                    {tKo("customer.helperMasterBanner")}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 flex justify-center">
              {isBilingual ? (
                <span className="flex flex-col items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-white group-hover:bg-amber-700 transition shadow-sm text-center">
                  <span className="text-xs sm:text-sm font-black leading-snug">
                    {t("customer.helperRegisterBtn")}
                  </span>
                  <span className="mt-1 text-[11px] sm:text-xs font-bold text-amber-200">
                    달인 헬퍼 등록 바로가기 →
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-6 py-3.5 text-sm sm:text-base font-black text-white group-hover:bg-amber-700 transition shadow-sm text-center">
                  {locale === "ko" ? "달인 헬퍼 등록 바로가기 →" : t("customer.helperRegisterBtn")}
                </span>
              )}
            </div>
          </div>
        </Link>
      </section>

      {/* Services Grid Section */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className={`text-2xl ${headingWeight} text-slate-900`}>
              {tBilingual("customer.servicesTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {locale === "ko"
                ? `현재 선택 지역: ${formattedRegion}`
                : `${getRegionUIText("activeArea", locale, isBilingual)}: ${formattedRegion}`}
            </p>
          </div>

          <Link
            href="/request"
            className="text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline"
          >
            {locale === "ko"
              ? "원하는 서비스 직접 신청하기 →"
              : isBilingual
              ? `${t("request.title")} · 직접 신청 →`
              : `${t("request.title")} →`}
          </Link>
        </div>

        {/* 1. Large Consolidated Major Service Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {mainConsolidatedServices.map((svc) => (
            <Card
              key={svc.key}
              className="group relative flex flex-col justify-between p-5 sm:p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg border-2 border-blue-100 bg-white"
            >
              <Link href={`/services/${svc.slug}`} className="block">
                {/* Multi-icons displayed together */}
                <div className="flex items-center gap-2 text-3xl sm:text-4xl bg-blue-50/80 p-2.5 rounded-2xl w-fit border border-blue-100">
                  {svc.icons.map((ic, i) => (
                    <span key={i} className="hover:scale-110 transition-transform">
                      {ic}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-black text-blue-800 mb-1.5">
                    {t("customer.priorityEmergency")}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-blue-700 leading-snug">
                    {t(`service.${svc.key}`)}
                  </h3>
                  {isBilingual && locale !== "ko" && (
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {svc.ko}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-medium">
                    {t(`serviceDesc.${svc.key}`)}
                  </p>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4">
                <Link
                  href={`/services/${svc.slug}`}
                  className="flex flex-col items-center justify-center rounded-xl bg-slate-100 px-3 py-2.5 text-center transition hover:bg-slate-200"
                  title={formatBilingual(t("common.detail"), "상세")}
                >
                  {isBilingual ? (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        {t("common.detail")}
                      </span>
                      <span className="mt-0.5 text-[10px] font-semibold text-slate-500">
                        상세 안내
                      </span>
                    </>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-800 py-1">
                      {t("common.detail")}
                    </span>
                  )}
                </Link>

                <Link
                  href={`/request?service=${svc.slug}`}
                  className="flex flex-col items-center justify-center rounded-xl bg-blue-700 px-3 py-2.5 text-center text-white transition hover:bg-blue-800 shadow-md shadow-blue-700/20"
                  title={formatBilingual(t("common.apply"), "신청")}
                >
                  {isBilingual ? (
                    <>
                      <span className="text-xs sm:text-sm font-black leading-snug">
                        {t("common.apply")}
                      </span>
                      <span className="mt-0.5 text-[10px] font-bold text-blue-200">
                        즉시 신청
                      </span>
                    </>
                  ) : (
                    <span className="text-xs sm:text-sm font-black py-1">
                      {t("common.apply")}
                    </span>
                  )}
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* 2. Standard Services (Boiler, Cleaning, Housing) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {standardServices.map(([icon, key, slug]) => (
            <Card
              key={key}
              className="group flex flex-col justify-between p-4 transition duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md border border-slate-200 bg-white"
            >
              <Link href={`/services/${slug}`} className="block">
                <span className="text-3xl sm:text-4xl">{icon}</span>
                <div className="mt-3">
                  <p className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 sm:text-base leading-snug">
                    {t(`service.${key}`)}
                  </p>
                  {isBilingual && locale !== "ko" && (
                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                      {tKo(`service.${key}`)}
                    </p>
                  )}
                </div>
              </Link>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={`/services/${slug}`}
                  className="flex flex-col items-center justify-center rounded-xl bg-slate-100 px-2 py-2 text-center transition hover:bg-slate-200"
                >
                  {isBilingual ? (
                    <>
                      <span className="text-xs font-bold text-slate-800 leading-snug">{t("common.detail")}</span>
                      <span className="text-[10px] font-semibold text-slate-500">상세 안내</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-800">{t("common.detail")}</span>
                  )}
                </Link>
                <Link
                  href={`/request?service=${slug}`}
                  className="flex flex-col items-center justify-center rounded-xl bg-blue-700 px-2 py-2 text-center text-white transition hover:bg-blue-800 shadow-xs"
                >
                  {isBilingual ? (
                    <>
                      <span className="text-xs font-extrabold leading-snug">{t("common.apply")}</span>
                      <span className="text-[10px] font-bold text-blue-200">즉시 신청</span>
                    </>
                  ) : (
                    <span className="text-xs font-extrabold">{t("common.apply")}</span>
                  )}
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* 3. 5 New Life Assistance Support Services */}
        <div className="mt-12">
          <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
                  <span>🤝</span>
                  <span>{formatBilingual(t("customer.lifeSupportBadge") || "1:1 매칭 지원", "1:1 매칭 지원")}</span>
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
                  {t("customer.lifeSupportTitle")}
                  {isBilingual && locale !== "ko" && (
                    <span className="block mt-1 text-base font-bold text-indigo-900">
                      {tKo("customer.lifeSupportTitle")}
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {t("customer.lifeSupportDesc")}
                  {isBilingual && locale !== "ko" && (
                    <span className="block mt-1 text-xs text-slate-500 font-medium">
                      {tKo("customer.lifeSupportDesc")}
                    </span>
                  )}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/support/bank-help"
                  className="inline-flex flex-col items-center justify-center rounded-2xl bg-indigo-700 px-4 py-2.5 text-xs sm:text-sm font-black text-white hover:bg-indigo-800 transition shadow-sm text-center"
                >
                  <span>{t("customer.partnerRegisterLink")}</span>
                  {isBilingual && locale !== "ko" && (
                    <span className="text-[10px] text-indigo-200 font-bold">
                      {tKo("customer.partnerRegisterLink")}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {lifeSupportServices.map(([icon, key, slug]) => (
              <Card
                key={key}
                className="group flex flex-col justify-between p-4 transition duration-200 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-lg border-2 border-indigo-100 bg-white"
              >
                <Link href={`/support/${slug}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl">{icon}</span>
                    <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-extrabold text-indigo-800">
                      🤝 {formatBilingual(t("customer.directMatch") || "헬퍼 매칭", "헬퍼 매칭")}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 sm:text-base leading-snug">
                      {t(`service.${key}`)}
                    </p>
                    {isBilingual && locale !== "ko" && (
                      <p className="mt-0.5 text-xs font-bold text-slate-500">
                        {tKo(`service.${key}`)}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/support/${slug}`}
                    className="flex flex-col items-center justify-center rounded-xl bg-slate-100 px-2 py-2 text-center transition hover:bg-slate-200"
                    title={t("common.detail")}
                  >
                    {isBilingual ? (
                      <>
                        <span className="text-xs font-bold text-slate-800 leading-snug">{t("common.detail")}</span>
                        <span className="text-[10px] font-semibold text-slate-500">상세 안내</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-800">{t("common.detail")}</span>
                    )}
                  </Link>

                  <Link
                    href={`/support/${slug}`}
                    className="flex flex-col items-center justify-center rounded-xl bg-indigo-700 px-2 py-2 text-center text-white transition hover:bg-indigo-800 shadow-xs"
                    title={t("common.safeApply")}
                  >
                    {isBilingual ? (
                      <>
                        <span className="text-xs font-extrabold text-white leading-snug">{t("common.safeApply")}</span>
                        <span className="text-[10px] font-bold text-indigo-200">신청</span>
                      </>
                    ) : (
                      <span className="text-xs font-extrabold text-white">{t("common.safeApply")}</span>
                    )}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Bottom Benefit Cards - Icon on top, 2-line centered, larger typography */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="flex h-full flex-col items-center justify-center text-center rounded-2xl bg-slate-50 p-6 border border-slate-200/80 transition duration-200 hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md cursor-pointer">
                <span className="text-4xl sm:text-5xl mb-3.5 drop-shadow-xs">{icon}</span>
                {isBilingual ? (
                  <>
                    <span className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {t(`customer.${key}`)}
                    </span>
                    <span className="mt-1.5 text-xs sm:text-sm font-bold text-blue-700">
                      {tKo(`customer.${key}`)}
                    </span>
                  </>
                ) : (
                  <span className="text-base sm:text-lg font-black text-slate-900 leading-snug py-1">
                    {t(`customer.${key}`)}
                  </span>
                )}
                {href && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                    {key === "consultation"
                      ? formatBilingual(t("common.nativeConsultation"), "실시간 상담 →")
                      : key === "verified"
                      ? formatBilingual(t("tech.register"), "헬퍼 등록 및 확인 →")
                      : key === "payment"
                      ? formatBilingual(t("customer.paymentLink"), "계좌이체 안내 →")
                      : key === "review"
                      ? formatBilingual(t("customer.reviewLink"), "자유 리뷰 남기기 →")
                      : ""}
                  </span>
                )}
              </div>
            );

            return href ? (
              <Link key={key} href={href} className="block group">
                {cardBody}
              </Link>
            ) : (
              <div key={key}>
                {cardBody}
              </div>
            );
          })}
        </div>
      </section>

      <PrivacyNotice />
    </main>
  );
}

"use client";

import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { getService, services } from "@/lib/services";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";

export function ServiceDetailView({ slug }: { slug: string }) {
  const { locale, t, tKo, tBilingual, formatBilingual, isBilingual } = useLocale();
  const { formattedRegion, shortRegionText, openModal } = useRegion();
  const service = getService(slug);

  const isKorean = locale === "ko";

  if (!service) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <header className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-2">
          <Link href="/" className="inline-flex items-center shrink-0" title="LIFE.HELP Home">
            <BrandLogo size="md" priority />
          </Link>
          <LanguageSwitcher />
        </header>

        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {formatBilingual(t("serviceDetail.notFound"), "서비스를 찾을 수 없습니다.")}
          </h1>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            {formatBilingual(t("serviceDetail.backHome"), "홈으로 돌아가기")}
          </Link>
        </div>
      </main>
    );
  }

  const isHousing = service.key === "housing";
  const serviceName = t(`service.${service.key}`);
  const serviceNameKo = tKo(`service.${service.key}`);

  // Housing specific descriptions vs regular repair descriptions
  const servicePromptTitle = isHousing
    ? formatBilingual(t("request.housingLabel"), "어떤 집을 찾으시나요?")
    : formatBilingual(t("serviceDetail.applyTitle"), "서비스를 신청하시겠습니까?");

  const servicePromptDesc = isHousing ? (
    isBilingual ? (
      <>
        <span>{t("serviceDetail.applyDesc")}</span>
        <span className="mt-1 block text-slate-500 font-normal">
          현재 설정된 지역({formattedRegion})을 중심으로 원하시는 주거 조건(보증금, 월세, 원룸/투룸)을 알려주시면 가장 알맞은 방을 찾아 연결해 드립니다.
        </span>
      </>
    ) : (
      <span>
        {isKorean
          ? `현재 설정된 지역(${formattedRegion})을 중심으로 원하시는 주거 조건(보증금, 월세, 원룸/투룸)을 알려주시면 가장 알맞은 방을 찾아 연결해 드립니다.`
          : t("serviceDetail.applyDesc")}
      </span>
    )
  ) : isBilingual ? (
    <>
      <span>{t("serviceDetail.applyDesc")}</span>
      <span className="mt-1 block text-slate-500 font-normal">
        문제 상황과 사진을 알려주시면 가까운 전문 헬퍼를 연결해 드립니다.
      </span>
    </>
  ) : (
    <span>
      {isKorean
        ? "문제 상황과 사진을 알려주시면 가까운 전문 헬퍼를 연결해 드립니다."
        : t("serviceDetail.applyDesc")}
    </span>
  );

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

      {/* Hero Banner for specific service */}
      <section className="bg-blue-700 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-xs font-semibold text-blue-100 hover:text-white"
          >
            ← {formatBilingual(t("serviceDetail.backHome"), "전체 서비스 목록으로 돌아가기")}
          </Link>

          <div className="text-5xl">{service.icon}</div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-bold whitespace-pre-line leading-snug">
            {formatBilingual(serviceName, serviceNameKo)}
          </h1>

          <p className="mt-4 text-base leading-7 font-medium text-white/95">
            {isBilingual ? (
              <>
                <span>{t("serviceDetail.needService")}</span>
                <span className="block mt-1 text-blue-100 font-normal">
                  {serviceNameKo} 서비스가 필요하신 경우 신청해 주세요.
                </span>
              </>
            ) : (
              <span>
                {isKorean
                  ? `${serviceNameKo} 서비스가 필요하신 경우 신청해 주세요.`
                  : t("serviceDetail.needService")}
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Main Action Box */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        {/* Housing Active Region Card */}
        {isHousing && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs font-bold text-blue-800">
                  {formatBilingual(
                    t("serviceDetail.targetHousingArea"),
                    tKo("serviceDetail.targetHousingArea"),
                  )}
                </p>
                <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                  {formattedRegion}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-blue-700 shadow-2xs hover:bg-blue-50 hover:shadow-xs border border-blue-200 active:scale-98 transition-all duration-150 cursor-pointer"
            >
              {formatBilingual(
                t("serviceDetail.changeRegion"),
                tKo("serviceDetail.changeRegion"),
              )}
            </button>
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">{servicePromptTitle}</h2>

          <div className="mt-4 text-base leading-7 font-medium text-slate-700">
            {servicePromptDesc}
          </div>

          {/* Primary Action Button directly connected to request/page.tsx */}
          <Link
            href={`/request?service=${service.slug}`}
            className="mt-6 block rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 text-center text-lg font-black text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] border border-blue-500/30 cursor-pointer"
          >
            {formatBilingual(t("serviceDetail.applyButton"), "서비스 신청하기")}
          </Link>
        </div>

        {/* Other Services Navigation */}
        <div className="mt-8 rounded-3xl bg-slate-100/80 border border-slate-200/70 p-6">
          <p className="text-sm font-extrabold text-slate-800">
            {formatBilingual(t("customer.servicesTitle"), "다른 서비스 둘러보기")}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {services
              .filter((s) => s.slug !== service.slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-blue-400 hover:text-blue-700 hover:shadow-xs border border-slate-200/80 transition-all duration-150 cursor-pointer"
                >
                  <span className="text-base shrink-0">{s.icon}</span>
                  <span className="whitespace-pre-line text-left leading-tight">{formatBilingual(t(`service.${s.key}`), tKo(`service.${s.key}`))}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <PrivacyNotice />
    </main>
  );
}

"use client";

import Link from "next/link";
import PrivacyNotice from "@/components/customer/PrivacyNotice";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { getService, services } from "@/lib/services";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";

export function ServiceDetailView({ slug }: { slug: string }) {
  const { locale, t, tKo, tBilingual } = useLocale();
  const { formattedRegion, shortRegionText, openModal } = useRegion();
  const service = getService(slug);

  const isKorean = locale === "ko";

  if (!service) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <header className="mx-auto mb-6 flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-blue-700">
            LIFE.HELP
          </Link>
          <LanguageSwitcher />
        </header>

        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {isKorean
              ? "서비스를 찾을 수 없습니다."
              : `${t("serviceDetail.notFound")} · 서비스를 찾을 수 없습니다.`}
          </h1>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            {isKorean
              ? "홈으로 돌아가기"
              : `${t("serviceDetail.backHome")} · 홈으로 돌아가기`}
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
    ? isKorean
      ? "어떤 집을 찾으시나요?"
      : `${t("request.housingLabel")} · 어떤 집을 찾으시나요?`
    : isKorean
      ? "서비스를 신청하시겠습니까?"
      : `${t("serviceDetail.applyTitle")} · 서비스를 신청하시겠습니까?`;

  const servicePromptDesc = isHousing
    ? isKorean
      ? `현재 설정된 지역(${formattedRegion})을 중심으로 원하시는 주거 조건(보증금, 월세, 원룸/투룸)을 알려주시면 가장 알맞은 방을 찾아 연결해 드립니다.`
      : (
        <>
          <span>{t("serviceDetail.applyDesc")}</span>
          <span className="mt-1 block">
            현재 설정된 지역({formattedRegion})을 중심으로 원하시는 주거 조건(보증금, 월세, 원룸/투룸)을 알려주시면 가장 알맞은 방을 찾아 연결해 드립니다.
          </span>
        </>
      )
    : isKorean
      ? "문제 상황과 사진을 알려주시면 가까운 전문 헬퍼를 연결해 드립니다."
      : (
        <>
          <span>{t("serviceDetail.applyDesc")}</span>
          <span className="mt-1 block">
            문제 상황과 사진을 알려주시면 가까운 전문 헬퍼를 연결해 드립니다.
          </span>
        </>
      );

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

      {/* Hero Banner for specific service */}
      <section className="bg-blue-700 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-xs font-semibold text-blue-100 hover:text-white"
          >
            ← {isKorean ? "전체 서비스 목록으로 돌아가기" : `${t("serviceDetail.backHome")} · 홈으로`}
          </Link>

          <div className="text-5xl">{service.icon}</div>

          <h1 className="mt-4 text-3xl font-bold">
            {isKorean ? serviceNameKo : `${serviceName} · ${serviceNameKo}`}
          </h1>

          <p className="mt-4 text-base leading-7 font-medium text-white/95">
            {isKorean ? (
              `${serviceNameKo} 서비스가 필요하신 경우 신청해 주세요.`
            ) : (
              <>
                <span>{t("serviceDetail.needService")}</span>
                <span className="block mt-1 text-blue-100 font-normal">
                  {serviceNameKo} 서비스가 필요하신 경우 신청해 주세요.
                </span>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Main Action Box */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        {/* Housing Active Region Card */}
        {isHousing && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs font-bold text-blue-800">
                  {isKorean ? "현재 설정된 방 구하기 희망 지역" : "Target Housing Search Area · 희망 지역"}
                </p>
                <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                  {formattedRegion}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100"
            >
              {isKorean ? "지역 변경" : "Change · 변경"}
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{servicePromptTitle}</h2>

          <div className="mt-4 text-base leading-7 font-medium text-slate-700">
            {servicePromptDesc}
          </div>

          {/* Primary Action Button directly connected to request/page.tsx */}
          <Link
            href={`/request?service=${service.slug}`}
            className="mt-6 block rounded-xl bg-blue-700 px-5 py-4 text-center text-lg font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            {isKorean
              ? "서비스 신청하기"
              : `${t("serviceDetail.applyButton")} · 서비스 신청하기`}
          </Link>
        </div>

        {/* Other Services Navigation */}
        <div className="mt-8 rounded-2xl bg-slate-100 p-5">
          <p className="text-sm font-bold text-slate-700">
            {isKorean ? "다른 서비스 둘러보기" : `${t("customer.servicesTitle")} · 다른 서비스`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {services
              .filter((s) => s.slug !== service.slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-blue-300 hover:text-blue-700"
                >
                  <span>{s.icon}</span>
                  <span>{isKorean ? tKo(`service.${s.key}`) : tBilingual(`service.${s.key}`)}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <PrivacyNotice />
    </main>
  );
}

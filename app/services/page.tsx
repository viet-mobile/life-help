"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { services } from "@/lib/services";
import { SERVICE_THEMES } from "@/components/support/SupportServiceView";

export default function ServicesPage() {
  const { locale, t } = useLocale();
  const [filter, setFilter] = useState<"all" | "repair" | "support">("all");
  const isKo = locale === "ko";

  // Filter 10 services
  const displayedServices = services.filter((s) => {
    if (filter === "all") return true;
    const isRepair = ["clog-clearing", "leak-plumbing", "boiler", "cleaning"].includes(s.slug);
    return filter === "repair" ? isRepair : !isRepair;
  });

  const getServiceTitle = (s: (typeof services)[number]) => {
    if (isKo) return s.ko;
    if (locale === "vi" && s.vi) return s.vi;
    const trans = t(`service.${s.key}`);
    return trans && !trans.startsWith("service.") ? trans : s.ko;
  };

  const homeLabel = t("servicesDirectory.home") || (isKo ? "홈으로" : "Home");
  const badgeLabel = t("servicesDirectory.badge") || (isKo ? "외국인을 위한 안심 생활 솔루션" : "Reliable Life Solutions");
  const titleLabel = t("servicesDirectory.title") || (isKo ? "LIFE.HELP 10대 생활 지원 서비스" : "10 Essential Life Support Services");
  const descLabel = t("servicesDirectory.desc") || (isKo
    ? "한국 거주 외국인을 위한 주거·수리·금융·의료 등 필수 생활 문제를 모국어로 상담하고 검증된 헬퍼와 연결해 드립니다."
    : "Connect with verified local helpers for housing, repairs, banking, and medical support in your native language.");

  const tabAllLabel = t("servicesDirectory.tabAll") || (isKo ? "전체 서비스 (10)" : "All (10)");
  const tabRepairLabel = t("servicesDirectory.tabRepair") || (isKo ? "긴급 수리 (4)" : "Emergency Repair (4)");
  const tabSupportLabel = t("servicesDirectory.tabSupport") || (isKo ? "생활 편의 지원 (6)" : "Life Support (6)");

  const tagRepairLabel = t("servicesDirectory.tagRepair") || (isKo ? "긴급 수리" : "Emergency Repair");
  const tagSupportLabel = t("servicesDirectory.tagSupport") || (isKo ? "생활 지원" : "Life Support");

  const detailsLabel = t("servicesDirectory.details") || (isKo ? "상세 보기" : "Details");
  const applyLabel = t("servicesDirectory.apply") || (isKo ? "신청하기" : "Apply");

  const consultBadge = t("servicesDirectory.consultationBadge") || (isKo ? "💬 24시간 실시간 모국어 상담" : "💬 24/7 Consultation");
  const consultTitle = t("servicesDirectory.consultationTitle") || (isKo ? "원하는 서비스나 도움이 필요하신가요?" : "Need help with any service?");
  const consultDesc = t("servicesDirectory.consultationDesc") || (isKo ? "모국어로 언제든지 편하게 1:1 상담을 요청하세요." : "Chat 1:1 in your native language anytime.");
  const consultBtn = t("servicesDirectory.startConsultation") || (isKo ? "모국어 상담 시작하기 →" : "Start Consultation →");

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50/45 via-amber-50/25 via-pink-50/25 to-indigo-50/35 text-slate-900 pb-16 selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md transition-colors shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Link
              href={locale !== "ko" ? `/${locale}` : "/"}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              <span>←</span>
              <span>{homeLabel}</span>
            </Link>
            <BrandLogo size="sm" priority />
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-3 py-6 sm:px-4 sm:py-8 text-center max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800 mb-3 shadow-2xs">
          <span>🛠️</span>
          <span>{badgeLabel}</span>
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          {titleLabel}
        </h1>
        <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 font-medium max-w-2xl mx-auto">
          {descLabel}
        </p>

        {/* Filter Tabs */}
        <div className="mt-5 flex items-center justify-center gap-1.5 sm:gap-2">
          {[
            { id: "all", label: tabAllLabel },
            { id: "repair", label: tabRepairLabel },
            { id: "support", label: tabSupportLabel },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                filter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-3 sm:px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {displayedServices.map((svc) => {
            const serviceUrl = locale !== "ko" ? `/${locale}/services/${svc.slug}` : `/services/${svc.slug}`;
            const requestUrl = locale !== "ko" ? `/${locale}/request?service=${svc.slug}` : `/request?service=${svc.slug}`;
            const isRepairService = ["clog-clearing", "leak-plumbing", "boiler", "cleaning"].includes(svc.slug);

            return (
              <div
                key={svc.slug}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-2xl select-none" aria-hidden="true">{svc.icon}</span>
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {isRepairService ? tagRepairLabel : tagSupportLabel}
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                    {getServiceTitle(svc)}
                  </h2>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <Link
                    href={serviceUrl}
                    className="flex-1 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 text-xs font-bold transition"
                  >
                    {detailsLabel}
                  </Link>
                  <Link
                    href={requestUrl}
                    className="flex-1 text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-1.5 text-xs font-bold transition"
                  >
                    {applyLabel}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Consultation Banner */}
      <section className="mt-12 px-3 sm:px-4 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-300 mb-1">
              {consultBadge}
            </span>
            <h3 className="text-lg sm:text-xl font-black">
              {consultTitle}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              {consultDesc}
            </p>
          </div>
          <Link
            href={locale !== "ko" ? `/${locale}/chat` : "/chat"}
            className="shrink-0 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-blue-950 hover:bg-blue-50 active:scale-95 transition shadow-md"
          >
            {consultBtn}
          </Link>
        </div>
      </section>
    </main>
  );
}

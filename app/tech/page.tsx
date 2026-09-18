"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useHelper } from "@/lib/helper/HelperContext";
import { navigateToMainHome } from "@/lib/navigation";
import { getLocalizedAddress } from "@/lib/region/regionLocalization";
import { formatHelperDisplayName } from "@/lib/helper/helperFormat";

export default function TechPage() {
  const router = useRouter();
  const { locale, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const { helper, isLoggedIn, remainingDays, toggleActiveStatus, logout } = useHelper();

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-6 text-white flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between py-2 sm:py-3 font-extrabold border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="text-lg sm:text-xl text-blue-400 hover:text-blue-300 transition flex items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0"
            title={formatBilingual("Go to LIFE.HELP Home", "LIFE.HELP 메인 홈으로 이동")}
          >
            <BrandLogo portal="tech" size="md" priority />
            <span className="droplet-pill bg-blue-900/60 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white border border-blue-700/50 group-hover:bg-blue-800 transition shrink-0">
              {formatBilingual(t("tech.helper"), "헬퍼")}
            </span>
          </Link>
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="hidden sm:inline-flex items-center gap-1 droplet-btn border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-blue-500 hover:text-white transition cursor-pointer shrink-0"
            title={formatBilingual(t("common.home"), "홈")}
          >
            <span>🏠</span>
            <span>{formatBilingual(t("common.home"), "홈")}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageSwitcher />
          {isLoggedIn && (
            <Link href="/tech/workspace">
              <Button variant="primary" className="droplet-btn text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-3.5 shrink-0">
                <span className="sm:hidden">{t("tech.workspace") || "워크스페이스"} →</span>
                <span className="hidden sm:inline">{formatBilingual(t("tech.openWorkspaceBtn"), "내 워크스페이스 관리하기")} →</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Section */}
      <section className="mx-auto w-full max-w-5xl py-8 sm:py-12">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="droplet-pill bg-blue-900/60 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-700/50">
            {formatBilingual(
              t("tech.officialPartners"),
              "LIFE.HELP 공식 헬퍼 Helper",
            )}
          </span>
          {isLoggedIn && (
            <>
              <button
                type="button"
                onClick={toggleActiveStatus}
                className={`droplet-pill px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                  helper?.isActive
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                    : "bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900"
                }`}
              >
                <span>
                  {helper?.isActive
                    ? formatBilingual(t("tech.statusActiveShort"), "🟢 즉시 출동 가능")
                    : formatBilingual(t("tech.statusPausedShort"), "⏸ 일시 업무 중단")}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  · {formatBilingual(t("tech.clickToToggle"), "클릭하여 변경")}
                </span>
              </button>

              {remainingDays > 0 && (
                <span className="droplet-pill bg-blue-950 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-800">
                  🛡️ {formatBilingual(t("workspace.securitySessionBadge"), "3개월 보안 세션")} · {remainingDays} {formatBilingual(t("workspace.daysRemaining"), "일 남음")}
                </span>
              )}
            </>
          )}
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            {isKorean ? (
              <>
                <span>{t("tech.headlineLead")}</span>
                <span className="block mt-1 text-blue-400">
                  {t("tech.actAsHelper")}
                </span>
              </>
            ) : !isBilingual ? (
              <>
                <span>{t("tech.headlineLead")}</span>
                <span className="block mt-1 text-blue-400">
                  {t("tech.actAsHelper")}
                </span>
              </>
            ) : (
              <>
                <span>{t("tech.headlineLead")}</span>
                <span className="block mt-0.5 text-base sm:text-lg font-medium text-slate-400">
                  {tKo("tech.headlineLead")}
                </span>
                <span className="block mt-2 text-2xl sm:text-3xl font-black text-blue-400">
                  {t("tech.actAsHelper")}
                </span>
                <span className="block mt-0.5 text-base sm:text-lg font-bold text-blue-300/80">
                  {tKo("tech.actAsHelper")}
                </span>
              </>
            )}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            {formatBilingual(
              t("tech.subheadline"),
              "복잡한 서류나 주민등록번호 입력 없이, 이동전화번호 하나로 3개월 보안 코드를 발급받아 자유롭고 안전하게 활동하세요.",
            )}
          </p>
        </div>

        {/* Dynamic Content: If Logged In show Workspace Card, else show HelperAuthCard */}
        <div className="mt-8">
          {isLoggedIn ? (
            <div className="droplet-card border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">
                      {formatHelperDisplayName(
                        helper?.contract?.name,
                        t("tech.helper"),
                        t("workspace.helperHonorific"),
                        formatBilingual,
                        isKorean,
                      )}
                    </span>
                    <span className="droplet-pill bg-blue-900/60 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                      {formatBilingual(t("workspace.verifiedHelper"), "인증 헬퍼")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    📱 {helper?.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/tech/workspace">
                    <Button variant="primary" className="droplet-btn-lg text-sm px-6 py-3">
                      {formatBilingual(t("tech.openWorkspaceBtn"), "내 워크스페이스 관리하기")} →
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="droplet-btn border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs font-bold text-red-300 hover:bg-red-900/60 transition"
                  >
                    {formatBilingual(t("workspace.logout"), "로그아웃")}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="droplet-card border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    {formatBilingual(t("tech.securitySessionExpiry"), "보안 세션 만료일")}
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">
                    {helper?.accessKeyExpiresAt
                      ? new Date(helper.accessKeyExpiresAt).toLocaleDateString(
                          isKorean ? "ko-KR" : locale,
                        )
                      : formatBilingual("90-day session", "90일 유지")}
                  </p>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {remainingDays}{" "}
                    {formatBilingual(t("tech.autoMaintainedDays"), "일간 자동 유지")}
                  </span>
                </div>

                <div className="droplet-card border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    {formatBilingual(t("tech.operatingRegions"), "활동 가능 지역")}
                  </span>
                  <p className="mt-1 text-sm font-bold text-white truncate">
                    {helper?.contract?.regions && helper.contract.regions.length > 0
                      ? helper.contract.regions
                          .map((r) => getLocalizedAddress({ ...r, dong: "" }, locale, isBilingual))
                          .join(", ")
                      : isKorean
                      ? "전북특별자치도 익산시"
                      : isBilingual
                      ? "Jeonbuk · Iksan · 전북 익산"
                      : "Jeonbuk · Iksan"}
                  </p>
                  <span className="text-[11px] text-blue-400 font-medium">
                    {formatBilingual(t("tech.instantDispatchConnected"), "고객 호출 즉시 연결")}
                  </span>
                </div>

                <div className="droplet-card border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    {formatBilingual(t("tech.registeredServices"), "등록 서비스")}
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">
                    {helper?.contract?.services?.length || 3}{" "}
                    {formatBilingual(t("tech.categoriesRegisteredCount"), "개 분야 등록")}
                  </p>
                  <span className="text-[11px] text-blue-400 font-medium">
                    {formatBilingual(t("tech.editableInWorkspace"), "워크스페이스에서 변경 가능")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl droplet-card border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎖️</span>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {formatBilingual(t("support.providerTitle"), "LIFE.HELP 공식 헬퍼 파트너")}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {formatBilingual(
                    t("support.providerDesc"),
                    "100% 자율 일정으로 원하는 지역에서 활동하며 10대 생활·수리 전 분야에서 투명한 수익을 창출하세요.",
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                {/* 1. 신규 헬퍼 등록 */}
                <Link
                  href="/services/job-help?tab=provider"
                  className="droplet-btn-lg flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black p-5 text-center shadow-lg shadow-amber-500/20 transition cursor-pointer rounded-2xl"
                >
                  <span className="text-2xl">📝</span>
                  <span className="text-base sm:text-lg font-black">
                    {formatBilingual(t("tech.registerTab"), "신규 헬퍼 등록")}
                  </span>
                  <span className="text-xs text-amber-950 font-bold">
                    {formatBilingual("Register as a new helper", "새로운 헬퍼로 활동 시작")} →
                  </span>
                </Link>

                {/* 2. 기존 헬퍼 로그인 */}
                <Link
                  href="/tech/login"
                  className="droplet-btn-lg flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black p-5 text-center shadow-lg shadow-blue-600/20 transition cursor-pointer rounded-2xl border border-blue-500/30"
                >
                  <span className="text-2xl">🔑</span>
                  <span className="text-base sm:text-lg font-black">
                    {formatBilingual(t("tech.loginTab"), "기존 헬퍼 로그인")}
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">
                    {formatBilingual("3-Month security access code", "3개월 보안 코드로 로그인")} →
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Hotline Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="droplet-card border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
            📞 {formatBilingual(t("tech.hotline"), "주 시스템 핫라인")}:{" "}
            <span className="font-bold text-blue-300">010-5757-5757</span> /{" "}
            <span className="font-bold text-blue-300">010-5959-5959</span>
          </div>
          <div className="droplet-card border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
            🛡️{" "}
            <span>
              {formatBilingual(
                t("tech.securitySessionNotice"),
                "3개월 보안 세션 시스템: 이동전화번호 기반 무작위 90자 보안 암호키 발급",
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl text-center text-xs text-slate-500 py-4 border-t border-slate-800/60">
        {isKorean
          ? "LIFE.HELP 헬퍼 포털 · 010-5757-5757 / 010-5959-5959"
          : `${t("tech.helperService")} · 010-5757-5757 / 010-5959-5959`}
      </footer>
    </main>
  );
}

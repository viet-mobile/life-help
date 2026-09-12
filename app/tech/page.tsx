"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useHelper } from "@/lib/helper/HelperContext";
import { navigateToMainHome } from "@/lib/navigation";
import { HelperAuthCard } from "@/components/tech/HelperAuthCard";

export default function TechPage() {
  const router = useRouter();
  const { locale, t, tKo } = useLocale();
  const isKorean = locale === "ko";
  const { helper, isLoggedIn, remainingDays, toggleActiveStatus, logout } = useHelper();

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-6 text-white flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between py-3 font-extrabold border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="text-xl text-blue-400 hover:text-blue-300 transition flex items-center gap-2 group cursor-pointer"
            title="LIFE.HELP 메인 홈으로 이동"
          >
            <span>LIFE.HELP</span>
            <span className="rounded-md bg-blue-900/60 px-2 py-0.5 text-xs font-bold text-white border border-blue-700/50 group-hover:bg-blue-800 transition">
              {isKorean ? "헬퍼" : "HELPER"}
            </span>
          </Link>
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-blue-500 hover:text-white transition cursor-pointer"
            title="메인 홈으로 이동"
          >
            <span>🏠</span>
            <span>{isKorean ? "메인 홈" : "Main Home"}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <Link href="/tech/workspace">
              <Button variant="primary" className="text-xs sm:text-sm py-2 px-3.5">
                {isKorean ? "내 워크스페이스 →" : "Workspace →"}
              </Button>
            </Link>
          ) : (
            <Link href="/tech/login">
              <Button variant="secondary" className="text-xs sm:text-sm py-2 px-3.5">
                {isKorean ? "헬퍼 로그인" : "Helper Login"}
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Section */}
      <section className="mx-auto w-full max-w-5xl py-8 sm:py-12">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="rounded-md bg-blue-900/60 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-700/50">
            {isKorean
              ? "LIFE.HELP 공식 헬퍼(Helper) 파트너스"
              : `${t("tech.officialPartners")} · 공식 헬퍼 파트너스`}
          </span>
          {isLoggedIn && (
            <>
              <button
                type="button"
                onClick={toggleActiveStatus}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                  helper?.isActive
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                    : "bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900"
                }`}
              >
                <span>{helper?.isActive ? "🟢 즉시 출동 가능" : "⏸ 일시 업무 중단"}</span>
                <span className="text-[10px] text-slate-400 font-normal">(클릭하여 변경)</span>
              </button>

              {remainingDays > 0 && (
                <span className="rounded-md bg-blue-950 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-800">
                  🛡️ 3개월 보안 세션 ({remainingDays}일 남음)
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
                <span>내 주변 고객과 바로 연결되는</span>
                <span className="block mt-1 text-blue-400">
                  전문 헬퍼(Helper)로 활동하세요.
                </span>
              </>
            ) : (
              <>
                <span>{t("tech.headline")}</span>
                <span className="block mt-1 text-2xl font-bold text-slate-400">
                  {tKo("tech.headline")}
                </span>
                <span className="block mt-1 text-2xl font-black text-blue-400">
                  전문 헬퍼로 활동하세요
                </span>
              </>
            )}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            {isKorean
              ? "복잡한 서류나 주민등록번호 입력 없이, 이동전화번호 하나로 3개월 보안 코드를 발급받아 자유롭고 안전하게 활동하세요."
              : t("tech.subheadline")}
          </p>
        </div>

        {/* Dynamic Content: If Logged In show Workspace Card, else show HelperAuthCard */}
        <div className="mt-8">
          {isLoggedIn ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">
                      {helper?.contract?.name || "헬퍼"} 님
                    </span>
                    <span className="rounded-md bg-blue-900/60 px-2 py-0.5 text-xs font-bold text-blue-300">
                      인증 헬퍼
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    📱 {helper?.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/tech/workspace">
                    <Button variant="primary" className="text-sm px-6 py-3">
                      {isKorean ? "내 워크스페이스 관리하기 →" : "Open Workspace →"}
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs font-bold text-red-300 hover:bg-red-900/60 transition"
                  >
                    {isKorean ? "로그아웃" : "Logout"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    보안 세션 만료일
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">
                    {helper?.accessKeyExpiresAt
                      ? new Date(helper.accessKeyExpiresAt).toLocaleDateString("ko-KR")
                      : "90일 유지"}
                  </p>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {remainingDays}일간 자동 유지
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    활동 가능 지역
                  </span>
                  <p className="mt-1 text-sm font-bold text-white truncate">
                    {helper?.contract?.regions?.map((r) => `${r.sido} ${r.gungu}`).join(", ") || "전북 익산시"}
                  </p>
                  <span className="text-[11px] text-blue-400 font-medium">
                    고객 호출 즉시 연결
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    등록 서비스
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">
                    {helper?.contract?.services?.length || 3}개 분야 등록
                  </p>
                  <span className="text-[11px] text-blue-400 font-medium">
                    워크스페이스에서 변경 가능
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl">
              <HelperAuthCard
                defaultTab="register"
                onSuccess={() => router.push("/tech/workspace")}
              />
            </div>
          )}
        </div>

        {/* Hotline Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
            📞 {isKorean ? t("tech.hotline") : `${t("tech.hotline")} · 주 시스템 핫라인`}:{" "}
            <span className="font-bold text-blue-300">010-5757-5757</span> /{" "}
            <span className="font-bold text-blue-300">010-5959-5959</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
            🛡️ <span>3개월 보안 세션 시스템: 이동전화번호 기반 무작위 90자 보안 암호키 발급</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl text-center text-xs text-slate-500 py-4 border-t border-slate-800/60">
        {isKorean
          ? "LIFE.HELP 헬퍼 파트너스 포털 · 010-5757-5757 / 010-5959-5959"
          : `${t("tech.helperService")} · 010-5757-5757 / 010-5959-5959`}
      </footer>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useHelper } from "@/lib/helper/HelperContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";
import { HelperAuthCard } from "@/components/tech/HelperAuthCard";

export default function TechRegisterPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const isKorean = locale === "ko";
  const { isLoggedIn } = useHelper();

  // If already logged in, redirect to workspace
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/tech/workspace");
    }
  }, [isLoggedIn, router]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white flex flex-col justify-between">
      {/* Top Bar */}
      <header className="mx-auto flex w-full max-w-xl items-center justify-between pb-4">
        <Link
          href="/"
          onClick={navigateToMainHome}
          className="text-xl font-extrabold text-blue-400 hover:text-blue-300 transition cursor-pointer flex items-center gap-2"
          title="LIFE.HELP 메인 홈으로 이동"
        >
          <span>LIFE.HELP</span>
          <span className="rounded-md bg-blue-900/60 px-2 py-0.5 text-xs font-bold text-white border border-blue-700/50">
            {isKorean ? "헬퍼 등록" : "HELPER REGISTER"}
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Register Auth Card Container */}
      <div className="mx-auto my-auto w-full max-w-xl py-6">
        <HelperAuthCard
          defaultTab="register"
          onSuccess={() => router.push("/tech/workspace")}
        />

        <div className="mt-6 text-center">
          <Link
            href="/tech"
            className="text-xs font-bold text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>{isKorean ? "헬퍼 메인 소개 페이지로 돌아가기" : "Back to Helper Home"}</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-xl text-center text-xs text-slate-500 py-4">
        {isKorean
          ? "LIFE.HELP 헬퍼 파트너스 · 핫라인: 010-5757-5757 / 010-5959-5959"
          : `${t("tech.helperService")} · Hotline: 010-5757-5757 / 010-5959-5959`}
      </footer>
    </main>
  );
}

"use client";

import Link from "next/link";
import { DbAssignmentPanel } from "@/components/tech/DbAssignmentPanel";
import { HelperPricingPanel } from "@/components/tech/HelperPricingPanel";
import { HelperOpenOffersPanel } from "@/components/tech/HelperOpenOffersPanel";
import { HelperPayoutsPanel } from "@/components/tech/HelperPayoutsPanel";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function HelperAssignmentsPage() {
  const { formatBilingual } = useLocale();
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/tech/login" className="inline-flex items-center gap-2">
            <BrandLogo portal="tech" size="md" priority />
            <span className="text-sm font-black">{formatBilingual("Helper assignments", "헬퍼 배정")}</span>
          </Link>
          <LanguageSwitcher />
        </header>
        <DbAssignmentPanel formatBilingual={formatBilingual} />
        <HelperOpenOffersPanel />
        <HelperPayoutsPanel />
        <HelperPricingPanel formatBilingual={formatBilingual} />
        <p className="text-center text-xs font-semibold text-slate-500">
          {formatBilingual("Sign in with your LIFE.HELP account to view assignments.", "LIFE.HELP 계정으로 로그인하면 배정 요청을 확인할 수 있습니다.")}
        </p>
      </div>
    </main>
  );
}

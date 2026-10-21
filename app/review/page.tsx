"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";

export default function ReviewPage() {
  const { locale, setLocale, t } = useLocale();
  const isKorean = locale === "ko";

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3.5">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="inline-flex items-center shrink-0 hover:opacity-80 transition cursor-pointer"
            title={t("review.backHome") || "LIFE.HELP Home"}
          >
            <BrandLogo size="md" priority />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/payment"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition active:scale-[0.98] hidden sm:inline-block cursor-pointer"
            >
              💳 {t("payment.title")}
            </Link>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      {/* Review submission is not available yet: nothing is stored or delivered, so the form stays disabled. */}
      <div className="mx-auto my-8 w-full max-w-2xl px-4 sm:px-6 space-y-8">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{t("review.title")}</h1>
          </div>
          <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 leading-relaxed">
            {t("review.pendingNotice")}
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4" aria-disabled="true">
            <fieldset disabled className="space-y-4">
              <textarea
                rows={4}
                placeholder={t("review.contentPlaceholder")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-500 resize-none leading-relaxed"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-300 py-4 text-xs sm:text-sm font-black text-white opacity-60 cursor-not-allowed"
              >
                {t("review.submitUnavailable")}
              </button>
            </fieldset>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">{t("review.recentReviewsTitle")}</h3>
          <p className="text-xs text-slate-500">{t("review.noReviewsYet")}</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        LIFE.HELP · {isKorean ? "관리자 문의 이메일" : "Admin Email"}: contact@life.help
      </footer>
    </main>
  );
}


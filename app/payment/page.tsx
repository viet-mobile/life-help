"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";

export default function PaymentPage() {
  const { locale, setLocale, t, tKo, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const [copied, setCopied] = useState(false);

  const accountNumber = "1002-080-001919";

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3.5">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="text-xl font-extrabold tracking-tight text-blue-800 hover:opacity-80 transition cursor-pointer"
            title={t("payment.backHome")}
          >
            LIFE.HELP
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition active:scale-[0.98] hidden sm:inline-block cursor-pointer"
            >
              💬 {t("payment.liveChatBtn")}
            </Link>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      {/* Main Payment Content */}
      <div className="mx-auto my-8 w-full max-w-2xl px-4 sm:px-6">
        {/* Toast Alert */}
        {copied && (
          <div className="fixed top-16 right-6 z-50 rounded-2xl border border-emerald-500 bg-slate-900 px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl animate-fade-in flex items-center gap-2">
            <span>✓</span>
            <span>{t("payment.copySuccessToast")}</span>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl space-y-6">
          {/* Top Title & Icon */}
          <div className="text-center space-y-2">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl shadow-xs border border-blue-100">
              💳
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {t("payment.title")}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-md mx-auto">
              {t("payment.subtitle")}
            </p>
          </div>

          {/* Primary Instruction Highlight Box */}
          <div className="rounded-2xl border-2 border-blue-500 bg-linear-to-br from-blue-50 via-indigo-50/50 to-blue-100/60 p-5 sm:p-6 text-center shadow-md space-y-2">
            <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black text-white uppercase tracking-wider shadow-xs">
              ACCOUNT TRANSFER
            </span>
            <h2 className="text-lg sm:text-xl font-black text-blue-950 leading-snug">
              &ldquo;{t("payment.bankTransferInstruction")}&rdquo;
            </h2>

            {/* Bilingual Korean subtitle for non-Korean users only in bilingual mode */}
            {!isKorean && isBilingual && (
              <p className="text-xs sm:text-sm font-extrabold text-blue-800/80 pt-1">
                &ldquo;우리은행 1002-080-001919로 계좌이체 해주세요&rdquo;
              </p>
            )}
          </div>

          {/* Account Detail Cards */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            {/* Bank Name */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 text-xs sm:text-sm">
              <span className="font-bold text-slate-500">{t("payment.bankNameLabel")}</span>
              <strong className="font-black text-slate-900 text-sm sm:text-base">
                {t("payment.bankName")}
              </strong>
            </div>

            {/* Account Number with Copy Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <span className="font-bold text-slate-500 text-xs sm:text-sm">
                {t("payment.accountNumberLabel")}
              </span>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="font-mono text-base sm:text-lg font-black text-blue-900 tracking-wider">
                  {accountNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition active:scale-[0.98] shadow-sm cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white shadow-emerald-600/20"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/20 hover:brightness-105"
                  }`}
                  title={t("payment.copyAccountBtn")}
                >
                  {copied ? "✓ " + t("payment.copiedToast") : "📋 " + t("payment.copyAccountBtn")}
                </button>
              </div>
            </div>

            {/* Account Holder */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-500">{t("payment.accountHolderLabel")}</span>
              <strong className="font-bold text-slate-800">
                {t("payment.accountHolder")}
              </strong>
            </div>
          </div>

          {/* Instructions & Notices */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>📌</span>
              <span>{t("payment.noticeTitle")}</span>
            </h3>
            <ul className="space-y-2 pl-4 list-disc text-slate-600">
              <li>{t("payment.notice1")}</li>
              <li>{t("payment.notice2")}</li>
              <li>{t("payment.notice3")}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/chat"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition text-center cursor-pointer border border-blue-500/30"
            >
              <span>💬</span>
              <span>{t("payment.liveChatBtn")}</span>
            </Link>

            <Link
              href="/"
              onClick={navigateToMainHome}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 text-xs sm:text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs hover:shadow-xs active:scale-[0.98] transition text-center cursor-pointer"
            >
              <span>🏠</span>
              <span>{t("payment.homeBtn")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        LIFE.HELP · {t("payment.supportCenter")} 010-4494-0694 / 010-5959-5959
      </footer>
    </main>
  );
}


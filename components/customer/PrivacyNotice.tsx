"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";

export default function PrivacyNotice() {
  const { locale, t, tKo } = useLocale();
  const isKorean = locale === "ko";

  return (
    <section className="border-t border-slate-200 bg-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-6">
        {isKorean ? (
          <div>
            <h3 className="text-base font-bold text-slate-800">{t("privacy.title")}</h3>
            <p className="mt-3 text-sm leading-6 font-medium text-slate-700">
              {t("privacy.content")}
            </p>
          </div>
        ) : (
          <div>
            {/* Target Language Block */}
            <h3 className="text-base font-bold text-slate-800">{t("privacy.title")}</h3>
            <p className="mt-2.5 text-sm leading-6 font-medium text-slate-700">
              {t("privacy.content")}
            </p>

            {/* Korean Accompanied Block */}
            <h3 className="mt-5 text-sm font-bold text-slate-600">{tKo("privacy.title")}</h3>
            <p className="mt-2 text-xs leading-5 font-medium text-slate-500">
              {tKo("privacy.content")}
            </p>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <a href="/payment" className="text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1">
              <span>💳</span>
              <span>{isKorean ? "계좌이체 결제 안내" : t("customer.paymentLink")}</span>
            </a>
            <a href="/review" className="hover:text-slate-800 font-bold flex items-center gap-1">
              <span>⭐</span>
              <span>{isKorean ? "자유 리뷰 남기기" : t("customer.reviewLink")}</span>
            </a>
            <a href="/chat" className="hover:text-slate-800">
              💬 {isKorean ? "실시간 고객 상담" : t("customer.consultation")}
            </a>
            <a href="/tech" className="hover:text-slate-800">
              🛠️ {isKorean ? "생활 도움 헬퍼" : t("customer.verified")}
            </a>
          </div>

          <div className="text-slate-400 font-normal">
            LIFE.HELP © 2026 · {isKorean ? "모국어 생활 서비스 플랫폼" : "Multilingual Living Service Platform"}
          </div>
        </div>
      </div>
    </section>
  );
}

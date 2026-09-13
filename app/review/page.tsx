"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";
import { saveReview, getStoredReviews, type CustomerReview } from "@/lib/review/reviewStore";

const SERVICE_OPTIONS = [
  { slug: "general", labelKey: "review.allServices", defaultLabel: "일반 서비스", icon: "✨" },
  { slug: "toilet", labelKey: "service.toilet", defaultLabel: "변기 막힘", icon: "🚽" },
  { slug: "sink", labelKey: "service.sink", defaultLabel: "싱크대 막힘", icon: "🚰" },
  { slug: "drain", labelKey: "service.drain", defaultLabel: "하수구 막힘", icon: "🕳️" },
  { slug: "leak", labelKey: "service.leak", defaultLabel: "누수 탐지/공사", icon: "💧" },
  { slug: "boiler", labelKey: "service.boiler", defaultLabel: "보일러/난방", icon: "🔥" },
  { slug: "housing", labelKey: "service.housing", defaultLabel: "방 구하기/임대차", icon: "🏠" },
  { slug: "cleaning", labelKey: "service.cleaning", defaultLabel: "전문 청소", icon: "🧹" },
];

const RATING_DESCRIPTIONS: Record<number, { ko: string; en: string }> = {
  5: { ko: "아주 만족해요 (최고예요!)", en: "Excellent (Very satisfied)" },
  4: { ko: "만족해요 (좋았어요)", en: "Good (Satisfied)" },
  3: { ko: "보통이에요", en: "Average" },
  2: { ko: "조금 아쉬워요", en: "Below Average" },
  1: { ko: "불만족해요 (개선이 필요해요)", en: "Dissatisfied" },
};

export default function ReviewPage() {
  const { locale, setLocale, t } = useLocale();
  const isKorean = locale === "ko";

  // Form State - ZERO personal info required!
  const [rating, setRating] = useState<number>(5);
  const [selectedService, setSelectedService] = useState<string>("general");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<CustomerReview | null>(null);

  // Recent reviews list
  const [recentReviews] = useState<CustomerReview[]>(() => getStoredReviews());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert(t("review.emptyContentAlert"));
      return;
    }

    setIsSubmitting(true);

    const serviceObj = SERVICE_OPTIONS.find((s) => s.slug === selectedService);
    const serviceLabel = serviceObj ? serviceObj.defaultLabel : selectedService;

    try {
      // 1. Send via API to contact@life.help
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          serviceCategory: serviceLabel,
          content: content.trim(),
          locale,
        }),
      });

      // 2. Save locally for instantaneous UI update and admin dashboard view
      const saved = saveReview({
        rating,
        serviceCategory: serviceLabel,
        content: content.trim(),
        locale,
      });

      setSubmittedReview(saved);
      setContent("");
    } catch (err) {
      console.error("Failed to submit review:", err);
      // Fallback: save locally
      const saved = saveReview({
        rating,
        serviceCategory: serviceLabel,
        content: content.trim(),
        locale,
      });
      setSubmittedReview(saved);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedReview(null);
    setRating(5);
    setSelectedService("general");
    setContent("");
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
            title={t("review.backHome") || "LIFE.HELP Home"}
          >
            LIFE.HELP
          </Link>

          <div className="flex items-center gap-3">
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

      {/* Main Review Form / Confirmation Screen */}
      <div className="mx-auto my-8 w-full max-w-2xl px-4 sm:px-6 space-y-8">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-xl space-y-6">
          {submittedReview ? (
            /* Submission Success View */
            <div className="text-center space-y-6 py-4 animate-fade-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-4xl shadow-sm animate-bounce">
                ✓
              </div>

              <div className="space-y-2">
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {t("review.deliveredBadge")}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {t("review.successTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {t("review.successDesc")}
                </p>
              </div>

              {/* Submitted Review Summary Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <span className="font-bold text-slate-500">{t("review.recipientEmailLabel")}</span>
                  <strong className="font-mono text-blue-700">contact@life.help</strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <span className="font-bold text-slate-500">{t("review.ratingEvalLabel")}</span>
                  <span className="font-black text-amber-500">
                    {"★".repeat(submittedReview.rating)}{"☆".repeat(5 - submittedReview.rating)} ({submittedReview.rating}/5)
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <span className="font-bold text-slate-500">{t("review.relatedServiceLabel")}</span>
                  <span className="font-bold text-slate-800">{submittedReview.serviceCategory}</span>
                </div>
                <div className="pt-1 text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-500 mb-1 text-[11px]">{t("review.writtenContentLabel")}</p>
                  <p className="italic whitespace-pre-wrap">&ldquo;{submittedReview.content}&rdquo;</p>
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  {t("review.sentTimeLabel")} {new Date(submittedReview.createdAt).toLocaleString()} {t("review.noPersonalInfoNote")}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 text-xs sm:text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs hover:shadow-xs active:scale-[0.98] transition cursor-pointer"
                >
                  ✏️ {t("review.writeAnotherBtn")}
                </button>
                <Link
                  href="/"
                  onClick={navigateToMainHome}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-500/30"
                >
                  <span>🏠</span>
                  <span>{t("review.homeBtn")}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Review Submission Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header Title & Anonymous Badge */}
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-xs">
                  {t("review.anonymousBadge")}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {t("review.title")}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                  {t("review.subtitle")}
                </p>
              </div>

              {/* Email Delivery Callout Banner */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-center gap-2.5">
                <span className="text-lg">📧</span>
                <span className="leading-snug font-medium">
                  {t("review.emailNotice")}
                </span>
              </div>

              {/* 1. Star Rating Selector */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center space-y-2">
                <label className="block text-xs sm:text-sm font-black text-slate-800">
                  {t("review.ratingLabel")}
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl sm:text-4xl transition transform hover:scale-125 active:scale-95 focus:outline-none"
                      title={`${star}점`}
                    >
                      <span className={star <= rating ? "text-amber-400 drop-shadow-xs" : "text-slate-300"}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-blue-800">
                  {rating}{t("review.starUnit")} - {t(`review.rating_${rating}`)}
                </p>
              </div>

              {/* 2. Service Category Chips (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  {t("review.categoryLabel")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_OPTIONS.map((srv) => {
                    const isSelected = selectedService === srv.slug;
                    return (
                      <button
                        key={srv.slug}
                        type="button"
                        onClick={() => setSelectedService(srv.slug)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition border cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm shadow-blue-600/20"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                        }`}
                      >
                        <span>{srv.icon}</span>
                        <span>{t(srv.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Review Content Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    {t("review.contentLabel")}
                  </label>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {t("review.anonymousBadge")}
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("review.contentPlaceholder")}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{t("review.noPersonalInfoNote") || (isKorean ? "※ 성함, 연락처 등 개인정보는 일절 수집되지 않습니다." : "※ No personal information is collected.")}</span>
                  <span>{content.length}{isKorean ? "자" : " chars"}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-4 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer border border-blue-500/30"
                >
                  <span>⭐</span>
                  <span>{isSubmitting ? t("review.submittingBtn") : t("review.submitBtn")}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recent Anonymous Reviews Preview Section */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>🌟</span>
              <span>{isKorean ? "최근 등록된 익명 고객 리뷰" : (t("review.recentReviewsTitle") || "Recent Anonymous Reviews")}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {recentReviews.length} {isKorean ? "개의 솔직한 후기" : "reviews"}
            </span>
          </div>

          <div className="space-y-3">
            {recentReviews.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-500">
                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                    </span>
                    <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                      {rev.serviceCategory}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isKorean ? "익명 고객" : "Anonymous"} · {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {rev.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        LIFE.HELP · {isKorean ? "관리자 문의 이메일" : "Admin Email"}: contact@life.help
      </footer>
    </main>
  );
}


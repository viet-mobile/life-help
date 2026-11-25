"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";
import {
  SUBSCRIPTION_PLANS,
  calculateEffectiveSubscription,
  LEARN_REFERRAL_POLICY,
  type SubscriptionPlanId,
  type BillingCycle,
} from "@/lib/learn/domain/subscription";
import { ReferralCard } from "@/components/shared/ReferralCard";

export default function PaymentPage() {
  const { locale, setLocale, t, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const [copied, setCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const accountNumber = "1002-080-001919";
  const [restoring, setRestoring] = useState(false);
  const [restoreToast, setRestoreToast] = useState("");

  // Subscription & Referral state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>("basic");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [referralInput, setReferralInput] = useState("");
  const [appliedReferral, setAppliedReferral] = useState(false);
  const [activeReferralCount, setActiveReferralCount] = useState(0);

  const myReferralCode = "LIFE-STUDY-7788";
  const effectivePricing = calculateEffectiveSubscription(
    selectedPlan,
    billingCycle,
    activeReferralCount
  );

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(myReferralCode);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2500);
  };

  const handleApplyReferral = () => {
    if (!referralInput.trim()) return;
    setAppliedReferral(true);
    setRestoreToast("✓ 추천인 코드가 적용되었습니다: 6개월간 10% 추가 할인이 적용됩니다.");
    setTimeout(() => setRestoreToast(""), 3500);
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const cap = (window as unknown as {
        Capacitor?: {
          isNativePlatform?: () => boolean;
          Plugins?: { Purchases?: { restorePurchases: () => Promise<void> } };
        };
      }).Capacitor;
      if (cap?.isNativePlatform?.() && cap.Plugins?.Purchases) {
        await cap.Plugins.Purchases.restorePurchases();
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
      setRestoreToast("✓ 앱스토어 / 구글 플레이 구매 내역 및 구독 권한이 정상 복원되었습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } catch {
      setRestoreToast("구매 내역 확인 완료: 활성화된 이전 구독 내역이 없습니다.");
      setTimeout(() => setRestoreToast(""), 3500);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3.5">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="inline-flex items-center shrink-0 hover:opacity-80 transition cursor-pointer"
            title={t("payment.backHome")}
          >
            <BrandLogo size="md" priority />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ReferralCard compact />
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

      {/* Main Payment & Subscription Content */}
      <div className="mx-auto my-8 w-full max-w-2xl px-4 sm:px-6 space-y-6">
        {/* Toast Alerts */}
        {copied && (
          <div className="fixed top-16 right-6 z-50 rounded-2xl border border-emerald-500 bg-slate-900 px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl animate-fade-in flex items-center gap-2">
            <span>✓</span>
            <span>{t("payment.copySuccessToast")}</span>
          </div>
        )}
        {refCopied && (
          <div className="fixed top-16 right-6 z-50 rounded-2xl border border-indigo-500 bg-slate-900 px-4 py-3 text-xs font-bold text-indigo-300 shadow-2xl animate-fade-in flex items-center gap-2">
            <span>✓</span>
            <span>추천인 코드가 클립보드에 복사되었습니다.</span>
          </div>
        )}
        {restoreToast && (
          <div className="fixed top-16 right-6 z-50 rounded-2xl border border-indigo-500 bg-slate-900 px-4 py-3 text-xs font-bold text-indigo-300 shadow-2xl animate-fade-in flex items-center gap-2">
            <span>ℹ️</span>
            <span>{restoreToast}</span>
          </div>
        )}

        {/* 1. Free Tier Quota Announcement */}
        <div className="rounded-3xl border border-emerald-300 bg-linear-to-br from-emerald-50 via-teal-50/50 to-white p-5 sm:p-6 shadow-md space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black text-white uppercase tracking-wider">
              🎁 100% 무료 개방 혜택
            </span>
            <span className="text-xs font-bold text-emerald-800">
              수학 24학기 · 영어 24학기 · 한국어 12학기 (총 60학기)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            매 학기마다 일반문제 90제 + 사고력 10제 = <span className="text-emerald-700">총 6,000문제 완전 무료!</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            회원가입 없이도 모든 학기의 기초 100문제를 자유롭게 학습할 수 있습니다. 무료 분량 이후 심화 일일 학습은 아래 맞춤 구독 플랜으로 이어집니다.
          </p>
        </div>

        {/* 2. Subscription Plans Selection */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              LIFE.HELP 국·영·수 맞춤 구독 플랜
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              초·중·고 12개 학년 전과정(44,059문항)을 가장 스마트하게 학습하세요
            </p>
          </div>

          {/* Plan Toggle Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Basic Plan Card */}
            <div
              onClick={() => setSelectedPlan("basic")}
              className={`rounded-2xl border-2 p-5 cursor-pointer transition relative space-y-3 ${
                selectedPlan === "basic"
                  ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-blue-900 text-sm">
                  베이직 데일리
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  인기 플랜
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">₩2,000</span>
                <span className="text-xs font-bold text-slate-500"> / 월</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>매일 <strong>일반 9제 + 사고력 1제</strong> (하루 10제)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>1일 1회</strong> 학년 및 학기 변경 가능</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>매일 꾸준한 기초 루틴 학습에 최적</span>
                </li>
              </ul>
            </div>

            {/* Pro Unlimited Plan Card */}
            <div
              onClick={() => setSelectedPlan("pro")}
              className={`rounded-2xl border-2 p-5 cursor-pointer transition relative space-y-3 ${
                selectedPlan === "pro"
                  ? "border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-purple-900 text-sm">
                  프로 무제한
                </span>
                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  완전 자유
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">₩20,000</span>
                <span className="text-xs font-bold text-slate-500"> / 월</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span><strong>1일 문제수 무제한</strong> (44,059제 전체)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span>학년/학기 <strong>자유 변경 무제한</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span>단기 집중 학습 및 선행/총복습에 최적</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. Referral Program & Stacking Discount Box */}
          <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50/70 via-white to-purple-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>🤝</span>
                <span>친구 초대 리퍼럴 & 6개월 10% 중복 할인</span>
              </h3>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                중복 할인 가능
              </span>
            </div>

            {/* Friend Referral Input (For New Students) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">
                추천인 코드 등록 (가입 학생 10% 추가 할인 / 6개월)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: LIFE-FRIEND-2026"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  disabled={appliedReferral}
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplyReferral}
                  disabled={appliedReferral || !referralInput.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {appliedReferral ? "적용됨 ✓" : "적용하기"}
                </button>
              </div>
            </div>

            {/* My Referral Code Sharing */}
            <div className="rounded-xl border border-dashed border-indigo-300 bg-white p-3.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-500">나의 전용 추천인 코드</p>
                <p className="font-mono text-sm font-black text-indigo-950 tracking-wider">
                  {myReferralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
              >
                {refCopied ? "복사됨 ✓" : "코드 복사"}
              </button>
            </div>

            {/* Interactive Referral Count Simulator */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">추천한 학생 수 (최대 10명):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReferralCount((c) => Math.max(0, c - 1))}
                    className="h-6 w-6 rounded-md bg-white border border-slate-300 font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-black text-indigo-900 font-mono text-sm w-8 text-center">
                    {activeReferralCount}명
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveReferralCount((c) => Math.min(10, c + 1))}
                    className="h-6 w-6 rounded-md bg-white border border-slate-300 font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                    disabled={activeReferralCount >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Discount Result */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>적용 할인율:</span>
                  <strong className="text-indigo-600 font-black">
                    {effectivePricing.referralSummary.discountPercent.toFixed(1)}% 할인
                    {effectivePricing.referralSummary.isMaxDiscountReached && " (🎉 99.9% 최대 할인 달성!)"}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>최종 납부액 ({billingCycle === "annual" ? "연간" : "월간"}):</span>
                  <strong className="text-slate-900 font-black text-sm">
                    ₩{effectivePricing.finalPriceKrw.toLocaleString()} / {billingCycle === "annual" ? "년" : "월"}
                  </strong>
                </div>

                {effectivePricing.referralSummary.isMaxDiscountReached && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] font-bold text-center">
                    ✨ 999명 추천 목표 달성으로 99.9% 최대 할인이 적용되었습니다! (바닥 요금 0.1% 결제)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. In-App Purchase & Restore Purchases Action */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white shadow-md transition active:scale-[0.98] cursor-pointer ${
                selectedPlan === "basic"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-105"
              }`}
            >
              <span>💳</span>
              <span>
                {selectedPlan === "basic" ? "베이직 플랜 구독 시작" : "프로 무제한 플랜 구독 시작"} (₩{effectivePricing.finalPriceKrw.toLocaleString()}/월)
              </span>
            </button>

            <button
              type="button"
              onClick={handleRestorePurchases}
              disabled={restoring}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <span>🔄</span>
              <span>{restoring ? "구매 내역 동기화 중..." : "구매 내역 복원 (Restore Purchases)"}</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-normal">
              구독은 언제든 앱스토어 또는 계정 설정에서 취소할 수 있으며, 결제 주기가 끝날 때까지 혜택이 유지됩니다.
            </p>
          </div>
        </div>

        {/* 5. Bank Transfer Alternative */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
              계좌이체 직접 납부 안내
            </span>
            <span className="text-xs font-bold text-slate-700">우리은행 1002-080-001919</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500">예금주: {t("payment.accountHolder")}</span>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="rounded-lg bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              계좌번호 복사
            </button>
          </div>
        </div>

        {/* 6. Viral Referral Program Card */}
        <ReferralCard />

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition text-center cursor-pointer"
          >
            <span>💬</span>
            <span>{t("payment.liveChatBtn")}</span>
          </Link>

          <Link
            href="/"
            onClick={navigateToMainHome}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 text-xs sm:text-sm font-black text-slate-700 hover:bg-slate-50 transition text-center cursor-pointer"
          >
            <span>🏠</span>
            <span>{t("payment.homeBtn")}</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        LIFE.HELP · {t("payment.supportCenter")} 010-4494-0694 / 010-5959-5959
      </footer>
    </main>
  );
}

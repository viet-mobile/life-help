"use client";

import { useState } from "react";
import type { ServicePaymentRecord, PaymentMethod } from "@/lib/service/paymentSettlement";
import { paymentApi } from "@/lib/service/client";

interface ServicePaymentCardProps {
  requestId: string;
  serviceSlug: string;
  initialPayment?: ServicePaymentRecord | null;
  canConfirmCompletion?: boolean;
  onPaymentUpdated?: (payment: ServicePaymentRecord) => void;
}

export function ServicePaymentCard({
  requestId,
  serviceSlug,
  initialPayment,
  canConfirmCompletion,
  onPaymentUpdated,
}: ServicePaymentCardProps) {
  const [payment, setPayment] = useState<ServicePaymentRecord | null>(initialPayment || null);
  const [referralInput, setReferralInput] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CARD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isPaid = payment?.paymentStatus === "PAID";
  const isSettled = payment?.paymentStatus === "SETTLED";

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const updated = await paymentApi.pay(requestId, selectedMethod, referralInput.trim() || undefined);
      setPayment(updated);
      onPaymentUpdated?.(updated);
      setToastMessage("✓ 안전 에스크로 결제가 완료되었습니다. 작업이 시작됩니다.");
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage("결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!window.confirm("헬퍼님의 서비스 작업이 만족스럽게 완료되었습니까?\n구매 확정 시 플랫폼 수수료(10%)가 정산되고 헬퍼님께 대금(90%)이 지급됩니다.")) {
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await paymentApi.confirm(requestId);
      setPayment(updated);
      onPaymentUpdated?.(updated);
      setToastMessage("✓ 구매 확정이 완료되었습니다. 플랫폼 수수료 및 헬퍼 정산이 완료되었습니다.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage("정산 확정 중 오류가 발생했습니다.");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  const basePrice = payment?.baseAmountKrw || 50000;
  const platformFee = payment?.platformFeeKrw || Math.round(basePrice * 0.10);
  const totalAmount = payment?.totalAmountKrw || basePrice;

  return (
    <section className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50/80 via-white to-slate-50 p-4 sm:p-5 shadow-xs space-y-4">
      {toastMessage && (
        <div className="rounded-xl border border-blue-400 bg-blue-900 px-4 py-2.5 text-xs font-bold text-blue-100 shadow-md">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm text-white font-black shadow-2xs">
            💳
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              안전 결제 & 수수료 정산 안내
            </h2>
            <p className="text-[11px] font-medium text-slate-500">
              플랫폼 안심 에스크로 보호로 작업 완료 승인 전까지 대금이 안전하게 보관됩니다
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
            isSettled
              ? "bg-purple-100 text-purple-800 border border-purple-300"
              : isPaid
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-amber-100 text-amber-800 border border-amber-300"
          }`}
        >
          {isSettled
            ? "✓ 정산 완료 (구매 확정)"
            : isPaid
            ? "🛡️ 에스크로 결제 완료"
            : "⏳ 결제 대기 중"}
        </span>
      </div>

      {/* Pricing Breakdown */}
      <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>기본 서비스 작업비</span>
          <span className="font-bold text-slate-900">₩{basePrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1">
            <span>플랫폼 안전 이용 수수료 ({payment?.feePercent ? `${payment.feePercent.toFixed(2)}%` : "10.00%"})</span>
            <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] text-slate-500">운영사 귀속</span>
          </span>
          <span className="font-bold text-blue-700">₩{platformFee.toLocaleString()}</span>
        </div>
        {payment?.discountKrw ? (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>친구 추천 리퍼럴 할인 (10%)</span>
            <span>-₩{payment.discountKrw.toLocaleString()}</span>
          </div>
        ) : null}
        <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-black text-slate-900">
          <span>최종 결제 금액</span>
          <span className="text-base text-blue-600">₩{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Action Area */}
      {!isPaid && !isSettled && (
        <div className="space-y-3 pt-1">
          {/* Referral Code Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="추천인 코드 (예: LIFE-1234, 10% 추가할인)"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod("CARD")}
              className={`rounded-xl border py-2 text-xs font-black transition cursor-pointer ${
                selectedMethod === "CARD"
                  ? "border-blue-600 bg-blue-50 text-blue-800 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              💳 카드 간편결제
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod("EASY_PAY")}
              className={`rounded-xl border py-2 text-xs font-black transition cursor-pointer ${
                selectedMethod === "EASY_PAY"
                  ? "border-blue-600 bg-blue-50 text-blue-800 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              🟡 카카오/토스
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod("TRANSFER")}
              className={`rounded-xl border py-2 text-xs font-black transition cursor-pointer ${
                selectedMethod === "TRANSFER"
                  ? "border-blue-600 bg-blue-50 text-blue-800 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              🏦 계좌 입금
            </button>
          </div>

          {selectedMethod === "TRANSFER" && (
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-extrabold">우리은행 1002-080-001919 (예금주: 이주복)</p>
              <p className="text-[11px] text-amber-700">입금 후 [결제 완료 확인] 버튼을 누르시면 플랫폼에서 즉시 승인됩니다.</p>
            </div>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={handlePay}
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 py-3 text-sm font-black text-white hover:from-blue-700 hover:to-indigo-700 shadow-md cursor-pointer transition active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? "결제 처리 중..." : `₩${totalAmount.toLocaleString()} 안전 결제하기`}
          </button>
        </div>
      )}

      {/* Escrow Protected & Confirm Completion Area */}
      {isPaid && !isSettled && (
        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
            <span className="text-base">🛡️</span>
            <span>결제 대금이 에스크로에 안전하게 보관 중입니다. (수수료 10% 홀드)</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            헬퍼님의 방문 및 작업이 모두 끝난 후 아래 버튼을 눌러 구매를 확정해 주세요. 고객 승인 즉시 헬퍼님께 대금(90%)이 정산됩니다.
          </p>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirmCompletion}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-black text-white shadow-sm cursor-pointer transition active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? "정산 처리 중..." : "✓ 서비스 완료 확인 및 구매 확정"}
          </button>
        </div>
      )}

      {/* Settled Confirmation */}
      {isSettled && (
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5 text-xs text-purple-900 space-y-1">
          <p className="font-black flex items-center gap-1.5 text-purple-950">
            <span>🎉</span>
            <span>구매 확정 및 정산이 완료되었습니다!</span>
          </p>
          <p className="text-[11px] text-purple-800">
            플랫폼 수수료(10%: ₩{platformFee.toLocaleString()})가 정산되었으며, 헬퍼님께 정산액(90%: ₩{(payment?.helperPayoutKrw || 0).toLocaleString()})이 지급 완료되었습니다.
          </p>
        </div>
      )}
    </section>
  );
}

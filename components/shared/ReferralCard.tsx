"use client";

import { useEffect, useState } from "react";
import { getCustomerDeviceId, getReferralParam } from "@/lib/referral/clientDeviceId";
import { calculatePlatformFeePercent, MAX_INVITE_GOAL, MIN_FEE_PERCENT, BASE_FEE_PERCENT } from "@/lib/referral/policy";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface ReferralData {
  referralId: string;
  referralLink: string;
  invitedCount: number;
  currentFeePercent: number;
  attribution?: string;
  tierBadge?: string;
  totalEarnedKrw?: number;
}

export function ReferralCard({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const deviceId = getCustomerDeviceId();
    const refParam = getReferralParam();

    fetch("/api/referrals/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, referralId: refParam }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success && json.referralId) {
          const count = json.invitedCount || 0;
          setData({
            referralId: json.referralId,
            referralLink: json.referralLink || `${window.location.origin}/?ref=${json.referralId}`,
            invitedCount: count,
            currentFeePercent: json.currentFeePercent ?? calculatePlatformFeePercent(count),
            attribution: json.attribution,
          });

          // Fetch detailed stats
          fetch(`/api/referrals/stats?id=${json.referralId}`)
            .then((r) => r.json())
            .then((stats) => {
              if (active && stats.success) {
                setData((prev) => (prev ? {
                  ...prev,
                  invitedCount: stats.invitedCount,
                  currentFeePercent: stats.currentFeePercent,
                  tierBadge: stats.tierBadge,
                  totalEarnedKrw: stats.totalEarnedKrw,
                } : null));
              }
            })
            .catch(() => undefined);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const copyCode = async () => {
    if (!data?.referralId) return;
    try {
      await navigator.clipboard.writeText(data.referralId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyLink = async () => {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (!data?.referralLink) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "LIFE.HELP - 생활 서비스 & 수수료 인하 리퍼럴 초대",
          text: `LIFE.HELP에서 생활 서비스 10% 할인과 함께 매 추천마다 수수료가 0.01%씩 인하되는 혜택을 누리세요! (추천 코드: ${data.referralId})`,
          url: data.referralLink,
        });
        return;
      } catch {
        // user cancelled or share failed
      }
    }
    await copyLink();
  };

  const inviteCount = data?.invitedCount || 0;
  const currentFee = data?.currentFeePercent ?? calculatePlatformFeePercent(inviteCount);
  const discountAmount = Math.max(0, Math.round((BASE_FEE_PERCENT - currentFee) * 100) / 100);
  const progressPercent = Math.min(100, Math.round((inviteCount / MAX_INVITE_GOAL) * 100));
  const remainingInvites = Math.max(0, MAX_INVITE_GOAL - inviteCount);

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpenModal((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-linear-to-r from-indigo-50 to-purple-50 px-3 py-1 text-xs font-bold text-indigo-900 shadow-2xs hover:shadow-xs transition cursor-pointer"
        >
          <span>🤝 수수료 인하</span>
          <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[10px] font-black text-white">
            {currentFee.toFixed(2)}%
          </span>
        </button>

        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-indigo-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🤝</span>
                  <span>친구 초대 수수료 단계적 인하</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Fee Reduction Display */}
              <div className="rounded-2xl bg-indigo-50/70 p-4 space-y-2 border border-indigo-100">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-indigo-950">현재 적용 수수료율</span>
                  <span className="text-lg font-black text-indigo-700">{currentFee.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>기준 10.00% 대비 인하 혜택</span>
                  <span className="font-extrabold text-emerald-600">-{discountAmount.toFixed(2)}%p</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-indigo-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${Math.max(2, progressPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {currentFee <= MIN_FEE_PERCENT ? (
                    <strong className="text-emerald-700">🎉 축하합니다! 최저 수수료 0.01%에 도달했습니다!</strong>
                  ) : (
                    <>1명 초대 시 <strong>9.99%</strong> 시작, 1명마다 <strong>0.01%p</strong>씩 내려가며 {remainingInvites}명을 더 초대하면 <strong>최저 {MIN_FEE_PERCENT}%</strong>에 도달합니다.</>
                  )}
                </p>
              </div>

              {/* Code & Link Box */}
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">내 고유 추천인 코드</p>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-base font-black text-indigo-700 tracking-wider">
                      {loading ? "생성 중..." : data?.referralId}
                    </code>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      {copied ? "✓ 복사됨" : "코드 복사"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex-1 rounded-xl border border-indigo-600 bg-indigo-50 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  >
                    🔗 초대 링크 복사
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-black text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    💬 카카오톡 / SNS 공유
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-indigo-200/90 bg-linear-to-br from-indigo-50/80 via-white to-purple-50/60 p-5 sm:p-6 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-sm">
            🤝
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              LIFE.HELP 친구 초대 수수료 인하 프로그램
            </h2>
            <p className="text-xs font-medium text-slate-500">
              1명 초대 시 <span className="font-bold text-indigo-700">9.99%</span>부터 시작하여 1명당 <span className="font-bold text-indigo-700">0.01%씩 영구 인하</span> (999명 초대 시 <span className="font-bold text-purple-700">최저 0.01%</span> 도달)
            </p>
          </div>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800 border border-indigo-200">
            내 수수료율: {currentFee.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Fee Progress Bar & Milestones */}
      <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <span>📉</span>
            <span>수수료 인하 진행도: <strong>{currentFee.toFixed(2)}%</strong> (최저 0.01% 목표)</span>
          </span>
          <span className="font-extrabold text-indigo-600">
            {inviteCount} / {MAX_INVITE_GOAL}명 완료 ({progressPercent}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-blue-500 via-indigo-600 to-purple-600 transition-all duration-700"
            style={{ width: `${Math.max(1, progressPercent)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>
            {currentFee <= MIN_FEE_PERCENT
              ? "🎉 최저 수수료 0.01% 달성 완료!"
              : `앞으로 ${remainingInvites}명 더 초대하면 최저 0.01%에 도달합니다.`}
          </span>
          <span>누적 적립 리워드: <strong className="text-indigo-700">₩{(data?.totalEarnedKrw || 0).toLocaleString()}</strong></span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-slate-100 text-center">
          <div className="rounded-lg bg-slate-50 p-1.5 border border-slate-200">
            <span className="block text-[10px] text-slate-400">0명 초대</span>
            <span className="text-xs font-black text-slate-700">10.00%</span>
          </div>
          <div className="rounded-lg bg-indigo-50/70 p-1.5 border border-indigo-200">
            <span className="block text-[10px] text-indigo-600 font-bold">1명 초대</span>
            <span className="text-xs font-black text-indigo-900">9.99%</span>
          </div>
          <div className="rounded-lg bg-indigo-50/70 p-1.5 border border-indigo-200">
            <span className="block text-[10px] text-indigo-600 font-bold">10명 초대</span>
            <span className="text-xs font-black text-indigo-900">9.90%</span>
          </div>
          <div className="rounded-lg bg-indigo-50/70 p-1.5 border border-indigo-200">
            <span className="block text-[10px] text-indigo-600 font-bold">100명 초대</span>
            <span className="text-xs font-black text-indigo-900">9.00%</span>
          </div>
          <div className="rounded-lg bg-purple-50/70 p-1.5 border border-purple-200">
            <span className="block text-[10px] text-purple-600 font-bold">500명 초대</span>
            <span className="text-xs font-black text-purple-900">5.00%</span>
          </div>
          <div className="rounded-lg bg-purple-100 p-1.5 border border-purple-300">
            <span className="block text-[10px] text-purple-700 font-black">999명 초대</span>
            <span className="text-xs font-black text-purple-950">최저 0.01%</span>
          </div>
        </div>
      </div>

      {/* Code & Link Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">내 추천인 코드</span>
            <code className="text-base font-black text-indigo-700 tracking-wider">
              {loading ? "생성 중..." : data?.referralId}
            </code>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-700 cursor-pointer transition active:scale-95"
          >
            {copied ? "✓ 복사됨" : "코드 복사"}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-2xl border border-indigo-200 bg-white py-3 px-3 text-xs font-black text-indigo-700 hover:bg-indigo-50 shadow-2xs cursor-pointer transition active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <span>🔗</span>
            <span>초대 링크 복사</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 px-3 text-xs font-black text-white hover:bg-indigo-700 shadow-sm cursor-pointer transition active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <span>💬</span>
            <span>공유하기</span>
          </button>
        </div>
      </div>
    </section>
  );
}

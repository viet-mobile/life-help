"use client";

import { useEffect, useState } from "react";
import { getCustomerDeviceId, getReferralParam } from "@/lib/referral/clientDeviceId";
import { calculatePlatformFeePercent, MAX_INVITE_GOAL, MIN_FEE_PERCENT, BASE_FEE_PERCENT } from "@/lib/referral/policy";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { getReferralI18n } from "./referralI18n";

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
  const { locale } = useLocale();
  const texts = getReferralI18n(locale);

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
          title: texts.shareTitle,
          text: texts.shareText.replace("{code}", data.referralId),
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

  // Format fee display: exactly "10%" initially, and automatically updates (e.g. "9.99%", "9.90%") as friends are invited
  const feeDisplay = currentFee >= 10 ? "10%" : `${currentFee.toFixed(2)}%`;

  if (compact) {
    return (
      <div className="relative inline-block shrink-0">
        <button
          type="button"
          onClick={() => setOpenModal((v) => !v)}
          className="droplet-pill inline-flex min-h-11 items-center justify-center gap-1 border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold text-indigo-800 transition shrink-0 cursor-pointer shadow-2xs"
          title={texts.title}
        >
          <span className="shrink-0 text-xs">🤝</span>
          <span className="sm:hidden font-black text-indigo-900">{feeDisplay}</span>
          <span className="hidden sm:inline">{texts.badgeLabel.replace("{fee}", feeDisplay)}</span>
        </button>

        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-indigo-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🤝</span>
                  <span>{texts.modalTitle}</span>
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
                  <span className="text-indigo-950">{texts.currentFeeLabel}</span>
                  <span className="text-lg font-black text-indigo-700">{feeDisplay}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>{texts.discountSavings}</span>
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
                    <strong className="text-emerald-700">{texts.congratsLowest}</strong>
                  ) : (
                    <>{texts.modalExplainer.replace("{remaining}", String(remainingInvites))}</>
                  )}
                </p>
              </div>

              {/* Code & Link Box */}
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">{texts.myCodeLabel}</p>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-base font-black text-indigo-700 tracking-wider">
                      {loading ? "..." : data?.referralId}
                    </code>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer transition active:scale-95"
                    >
                      {copied ? texts.copiedBtn : texts.copyCodeBtn}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex-1 rounded-xl border border-indigo-600 bg-indigo-50 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 cursor-pointer transition active:scale-95"
                  >
                    {texts.copyLinkBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-black text-white hover:bg-indigo-700 cursor-pointer transition active:scale-95"
                  >
                    {texts.shareBtn}
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-sm">
            🤝
          </span>
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 leading-snug">
              {texts.title}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {texts.subtitle}
            </p>
          </div>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3.5 py-1.5 text-xs sm:text-sm font-black text-indigo-800 border border-indigo-200 shadow-2xs">
            {texts.myFeeBadge.replace("{fee}", feeDisplay)}
          </span>
        </div>
      </div>

      {/* Fee Progress Bar & Milestones */}
      <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
          <span className="text-slate-800 flex items-center gap-1.5">
            <span>📉</span>
            <span>{texts.progressLabel.replace("{fee}", feeDisplay)}</span>
          </span>
          <span className="font-extrabold text-indigo-700">
            {texts.progressStatus
              .replace("{count}", String(inviteCount))
              .replace("{goal}", String(MAX_INVITE_GOAL))
              .replace("{percent}", String(progressPercent))}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-blue-500 via-indigo-600 to-purple-600 transition-all duration-700"
            style={{ width: `${Math.max(1, progressPercent)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-600 pt-1">
          <span>
            {currentFee <= MIN_FEE_PERCENT
              ? texts.congratsLowest
              : texts.remainingTip.replace("{remaining}", String(remainingInvites))}
          </span>
          <span>
            {texts.rewardsAccumulated.replace(
              "{amount}",
              `₩${(data?.totalEarnedKrw || 0).toLocaleString()}`
            )}
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2.5 border-t border-slate-100 text-center">
          <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
            <span className="block text-xs font-bold text-slate-500">{texts.milestone0}</span>
            <span className="text-xs sm:text-sm font-black text-slate-800">10.00%</span>
          </div>
          <div className="rounded-xl bg-indigo-50/70 p-2 border border-indigo-200">
            <span className="block text-xs font-bold text-indigo-700">{texts.milestone1}</span>
            <span className="text-xs sm:text-sm font-black text-indigo-950">9.99%</span>
          </div>
          <div className="rounded-xl bg-indigo-50/70 p-2 border border-indigo-200">
            <span className="block text-xs font-bold text-indigo-700">{texts.milestone10}</span>
            <span className="text-xs sm:text-sm font-black text-indigo-950">9.90%</span>
          </div>
          <div className="rounded-xl bg-indigo-50/70 p-2 border border-indigo-200">
            <span className="block text-xs font-bold text-indigo-700">{texts.milestone100}</span>
            <span className="text-xs sm:text-sm font-black text-indigo-950">9.00%</span>
          </div>
          <div className="rounded-xl bg-purple-50/70 p-2 border border-purple-200">
            <span className="block text-xs font-bold text-purple-700">{texts.milestone500}</span>
            <span className="text-xs sm:text-sm font-black text-purple-950">5.00%</span>
          </div>
          <div className="rounded-xl bg-purple-100 p-2 border border-purple-300">
            <span className="block text-xs font-black text-purple-800">{texts.milestone999}</span>
            <span className="text-xs sm:text-sm font-black text-purple-950">0.01%</span>
          </div>
        </div>
      </div>

      {/* Code & Link Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-500 block">{texts.myCodeLabel}</span>
            <code className="text-base sm:text-lg font-black text-indigo-700 tracking-wider">
              {loading ? "..." : data?.referralId}
            </code>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-slate-800 cursor-pointer transition active:scale-95"
          >
            {copied ? texts.copiedBtn : texts.copyCodeBtn}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-2xl border border-indigo-200 bg-white py-3 px-3 text-xs sm:text-sm font-black text-indigo-700 hover:bg-indigo-50 shadow-2xs cursor-pointer transition active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <span>{texts.copyLinkBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 px-3 text-xs sm:text-sm font-black text-white hover:bg-indigo-700 shadow-sm cursor-pointer transition active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <span>{texts.shareBtn}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

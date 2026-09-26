"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { DesktopShortcutButton } from "@/components/shared/DesktopShortcutButton";
import { getCustomerDeviceId } from "@/lib/referral/clientDeviceId";

export function ReferralCard({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useLocale();
  const [referralId, setReferralId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || undefined;
    void fetch("/api/referrals/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getCustomerDeviceId(), subjectType: "CUSTOMER", referralId: ref }),
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) setReferralId(data.referralId);
      else if (data?.code === "INVALID_REFERRAL_ID") setMessage("Referral ID is invalid or inactive.");
    });
  }, []);

  const link = referralId ? `https://life.help/?ref=${referralId}` : "";
  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (compact) {
    return (
      <div className="relative">
        <button type="button" onClick={() => setIsOpen((value) => !value)} className="droplet-pill inline-flex max-w-[132px] items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-900 sm:max-w-[160px] sm:text-xs" aria-expanded={isOpen}>
          <span className="shrink-0">ID ·</span><span className="truncate tracking-[0.12em]">{referralId || "--------"}</span><span aria-hidden="true">⌄</span>
        </button>
        {isOpen && <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,320px)] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-emerald-200 bg-white p-3 text-slate-900 shadow-xl max-sm:fixed max-sm:right-3 max-sm:top-12 max-sm:mt-0" role="dialog">
          <p className="text-[11px] font-bold text-slate-500">{locale === "vi" ? "ID LIFE.HELP" : "LIFE.HELP ID"}</p>
          <code className="mt-1 block max-w-full break-all text-base font-black tracking-[0.18em]">{referralId || "--------"}</code>
          <p className="mt-3 text-[11px] font-bold text-slate-500">{locale === "vi" ? "Liên kết giới thiệu" : "Referral link"}</p>
          <p className="mt-1 break-all text-xs text-slate-700">{link || "-"}</p>
          <button type="button" onClick={() => void copy()} className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">{copied ? t("common.copied") : t("common.copy")}</button>
          <DesktopShortcutButton variant="card" className="mt-3 w-full max-w-full overflow-hidden [overflow-wrap:break-word]" />
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-xs font-black text-slate-800">{t("common.referralRewards")}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{t("common.rewardInfo")}</p>
            <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-700"><p>{t("common.tierWlh")}</p><p>{t("common.tierClh")}</p><p>{t("common.tierGlh")}</p></div>
            <p className="mt-2 text-[11px] text-slate-500">{t("common.payoutNotConnected")}</p>
          </div>
        </div>}
      </div>
    );
  }

  return (
    <section className="mx-auto mt-6 max-w-6xl px-3 sm:px-4">
      <div className="droplet-card border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-emerald-950">LIFE.HELP ID</h2>
            <p className="mt-1 text-xs font-semibold text-emerald-800">{locale === "vi" ? "Chia sẻ liên kết giới thiệu của bạn." : "Share your LIFE.HELP link with someone you trust."}</p>
          </div>
          {referralId && <code className="text-lg font-black tracking-[0.18em] text-emerald-900">{referralId}</code>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="min-w-0 flex-1 border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900">{locale === "vi" ? "Liên kết giới thiệu" : "Referral link"}</div>
          <button type="button" onClick={() => void copy()} disabled={!link} className="droplet-btn bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{copied ? (locale === "vi" ? "Đã sao chép" : "Copied") : (locale === "vi" ? "Sao chép" : "Copy link")}</button>
        </div>
        {message && <p className="mt-2 text-xs font-bold text-rose-700">{message}</p>}
      </div>
    </section>
  );
}

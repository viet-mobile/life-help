"use client";

import { useEffect, useState } from "react";
import { getOrCreateCustomerId } from "@/lib/id/userIdentifier";
import { useLocale } from "@/lib/i18n/LocaleContext";

const DEVICE_KEY = "life_help_referral_device_id";

function getDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const value = `device-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_KEY, value);
  return value;
}

export function ReferralCard() {
  const { locale } = useLocale();
  const [referralId, setReferralId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualReferral, setManualReferral] = useState("");
  const [urlReferral, setUrlReferral] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || undefined;
    setUrlReferral(ref || null);
    void fetch("/api/referrals/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId(), subjectType: "CUSTOMER", subjectKey: getOrCreateCustomerId(), referralId: ref }),
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) setReferralId(data.referralId);
      else if (data?.code === "INVALID_REFERRAL_ID") setMessage("Referral ID is invalid or inactive.");
    });
  }, []);

  const applyManualReferral = async () => {
    const ref = manualReferral.trim().toUpperCase();
    const response = await fetch("/api/referrals/identity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: getDeviceId(), subjectType: "CUSTOMER", subjectKey: getOrCreateCustomerId(), referralId: ref }) });
    const data = await response.json().catch(() => null);
    setMessage(response.ok ? "Referral applied." : data?.code === "SELF_REFERRAL" ? "Self referral is not allowed." : "Referral ID is invalid or inactive.");
  };

  const link = referralId ? `https://life.help/?ref=${referralId}` : "";
  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

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
          <input value={urlReferral || manualReferral} onChange={(event) => setManualReferral(event.target.value.toUpperCase())} disabled={!!urlReferral} maxLength={8} pattern="[A-Z]{8}" placeholder="Referral ID" className="min-w-0 flex-1 border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase disabled:bg-slate-100" />
          {!urlReferral && <button type="button" onClick={() => void applyManualReferral()} className="droplet-btn border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-800">{locale === "vi" ? "Áp dụng" : "Apply"}</button>}
          <button type="button" onClick={() => void copy()} disabled={!link} className="droplet-btn bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{copied ? (locale === "vi" ? "Đã sao chép" : "Copied") : (locale === "vi" ? "Sao chép" : "Copy link")}</button>
        </div>
        {message && <p className="mt-2 text-xs font-bold text-rose-700">{message}</p>}
      </div>
    </section>
  );
}

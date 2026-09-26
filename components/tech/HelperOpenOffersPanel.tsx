"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { formatMoney } from "@/lib/pricing/pricingTerms";

type OpenOffer = {
  requestId: string; serviceCode: string; subitemCode: string; sido: string; gungu: string; currency: string; offeredAmount: number;
  pricingMode: string; materialsPolicy: string; materialsNote: string | null; publicNote: string | null; preferredWindow: string | null;
};

/**
 * Funded customer offers this Helper may take (authoritative feed; push is only a hint). The Helper
 * either accepts the customer's terms exactly, or declines (never shown again). No price field.
 */
export function HelperOpenOffersPanel() {
  const { t, locale } = useLocale();
  const [offers, setOffers] = useState<OpenOffer[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/helper/open-offers", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) { setOffers(null); return; }
    const data = await response.json().catch(() => null);
    setOffers(Array.isArray(data?.offers) ? data.offers : []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const act = async (requestId: string, action: "ACCEPT" | "DECLINE") => {
    setBusy(requestId);
    const response = await fetch(`/api/helper/open-offers/${requestId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setBusy(null);
    setMessage(data?.success ? (action === "ACCEPT" ? t("marketplace.acceptServiceRequest") : t("marketplace.notInterested")) : t("pricing.offerExpired"));
    await refresh();
  };

  if (offers === null) return null;
  return (
    <section data-testid="helper-open-offers" className="mt-6 droplet-card border border-slate-200 bg-white p-4 text-slate-900 shadow-xs">
      <h2 className="text-base font-black">{t("marketplace.openRequest")}</h2>
      <p data-testid="helper-media-notice" className="mt-1 text-[11px] font-semibold text-slate-600">{t("media.helperNotice")}</p>
      {message && <p className="mt-2 text-xs font-bold text-emerald-800">{message}</p>}
      {offers.length === 0 && <p className="mt-2 text-xs text-slate-600">{t("marketplace.noOpenOffers")}</p>}
      {offers.map((o) => (
        <article key={o.requestId} data-testid="open-offer-card" className="mt-3 rounded border border-slate-200 p-3">
          <p className="text-xs font-bold text-slate-600">{t(`serviceSubitems.${o.serviceCode}.${o.subitemCode}`)} · {o.sido} {o.gungu}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{t("marketplace.offeredAmount")}</p>
          <p data-testid="open-offer-amount" className="text-xl font-black text-blue-900">{formatMoney(o.offeredAmount, o.currency, locale)}</p>
          <p className="text-xs text-slate-700">{t(`pricing.mode.${o.pricingMode}`)} · {t(`pricing.materials.${o.materialsPolicy}`)}{o.materialsNote ? ` · ${o.materialsNote}` : ""}</p>
          {o.pricingMode === "DIAGNOSTIC_PLUS_QUOTE" && <p className="text-xs font-bold text-amber-800">{t("pricing.diagnosticNotice")}</p>}
          {o.preferredWindow && <p className="text-xs text-slate-700">{t("marketplace.preferredWindow")}: {o.preferredWindow}</p>}
          {o.publicNote && <p className="text-xs text-slate-700">{o.publicNote}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" data-testid="open-offer-accept" disabled={busy === o.requestId} onClick={() => void act(o.requestId, "ACCEPT")} className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50">{t("marketplace.acceptServiceRequest")}</button>
            <button type="button" data-testid="open-offer-decline" disabled={busy === o.requestId} onClick={() => void act(o.requestId, "DECLINE")} className="rounded border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50">{t("marketplace.notInterested")}</button>
          </div>
        </article>
      ))}
    </section>
  );
}

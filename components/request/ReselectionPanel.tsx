"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { IDEMPOTENCY_HEADER, createIdempotencyKey } from "@/lib/request/idempotencyKey";
import { formatMoney, initialPayableAmount, type PublicOffer } from "@/lib/pricing/pricingTerms";
import { OfferTerms } from "@/components/request/PriceOfferPicker";

const NOTICE: Record<string, string> = {
  PRICE_CHANGED: "pricing.priceChanged",
  HELPER_NO_LONGER_AVAILABLE: "pricing.helperUnavailable",
  HELPER_PREVIOUSLY_DECLINED: "pricing.helperUnavailable",
  OFFER_UNAVAILABLE: "pricing.offerExpired",
  OFFER_EXPIRED: "pricing.offerExpired",
  OFFER_INVALID: "pricing.offerExpired",
};

/**
 * CUSTOMER_RESELECTION_REQUIRED: the Helper the customer chose cannot take the request. The customer
 * loads FRESH offers for the same detailed service and explicitly confirms one; there is no automatic
 * replacement and no AUTO_MATCH switch. Only the opaque offer token and the request id are sent; the
 * server checks ownership (device-owner cookie) and re-reads the price.
 */
export function ReselectionPanel({ requestId, serviceCode, subitemCode, onReselected }: {
  requestId: string; serviceCode: string; subitemCode: string; onReselected?: (agreed: { currency: string; initialPayableAmount: number } | null) => void;
}) {
  const { t, locale } = useLocale();
  const [offers, setOffers] = useState<PublicOffer[] | null>(null);
  const [chosen, setChosen] = useState<PublicOffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // One idempotency key per confirmed offer: a retried confirmation of the same offer replays.
  const keys = useRef(new Map<string, string>());

  const loadOffers = useCallback(async () => {
    setChosen(null);
    const response = await fetch(`/api/requests/reselection/offers?requestId=${encodeURIComponent(requestId)}`, { cache: "no-store" }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setOffers(Array.isArray(data?.offers) ? data.offers : []);
  }, [requestId]);

  const confirm = async (offer: PublicOffer) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const key = keys.current.get(offer.offerToken) ?? createIdempotencyKey();
    keys.current.set(offer.offerToken, key);
    const response = await fetch("/api/requests/reselection", {
      method: "POST",
      headers: { "Content-Type": "application/json", [IDEMPOTENCY_HEADER]: key },
      body: JSON.stringify({ request_id: requestId, offer_token: offer.offerToken }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setBusy(false);
    if (data?.success === true) {
      setDone(true);
      onReselected?.(data.agreed ?? null);
      return;
    }
    // Stale / taken offer: show the reason and fresh offers; the customer must choose again.
    setNotice(t(NOTICE[String(data?.code)] ?? "pricing.offerExpired"));
    await loadOffers();
  };

  if (done) {
    return (
      <section data-testid="reselection-done" className="droplet-card border-2 border-emerald-500 bg-emerald-50 p-4 text-left">
        <p className="text-sm font-black text-emerald-900">{t("reselection.done")}</p>
      </section>
    );
  }

  return (
    <section data-testid="reselection-panel" className="droplet-card border-2 border-amber-400 bg-amber-50/70 p-4 text-left">
      <p className="text-base font-black text-amber-950">{t("reselection.title")}</p>
      <p className="mt-1 text-sm font-bold text-amber-900">{t("reselection.body")}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{t(`serviceSubitems.${serviceCode}.${subitemCode}`)}</p>
      {notice && <p data-testid="reselection-notice" className="mt-2 text-xs font-bold text-amber-800">{notice}</p>}
      {offers === null && (
        <button type="button" data-testid="reselection-open" onClick={() => void loadOffers()} className="mt-3 droplet-btn bg-blue-700 px-4 py-2 text-sm font-black text-white">
          {t("reselection.chooseButton")}
        </button>
      )}
      {offers !== null && !chosen && (
        <div className="mt-3">
          <p className="text-xs font-black text-slate-800">{t("reselection.offersTitle")}</p>
          {offers.length === 0 && (
            <div className="mt-1">
              <p data-testid="reselection-no-offers" className="text-xs text-slate-600">{t("reselection.noOffers")}</p>
              <button type="button" onClick={() => void loadOffers()} className="mt-2 droplet-btn border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">{t("reselection.refresh")}</button>
            </div>
          )}
          <div className="mt-2 space-y-2">
            {offers.map((offer) => (
              <article key={offer.offerToken} data-testid="reselection-offer-card" className="droplet-card border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold text-slate-600">
                  {offer.helperAlias}{offer.rating != null ? ` · ★${Number(offer.rating).toFixed(1)}` : ""}{offer.spokenLocales.length ? ` · ${offer.spokenLocales.join("/")}` : ""}
                </p>
                <OfferTerms offer={offer} />
                <button type="button" data-testid="reselection-offer-select" onClick={() => setChosen(offer)} className="mt-2 droplet-btn bg-blue-700 px-3 py-1.5 text-xs font-black text-white">
                  {t("pricing.select")}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
      {chosen && (
        <div data-testid="reselection-confirm" className="mt-3 droplet-card border-2 border-blue-600 bg-white p-3">
          <p className="text-sm font-black text-blue-950">{t("pricing.confirmTitle")}</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{t(`serviceSubitems.${chosen.serviceCode}.${chosen.subitemCode}`)} · {chosen.helperAlias}</p>
          <OfferTerms offer={chosen} />
          <p className="mt-2 text-sm font-black text-slate-900">
            {t("pricing.initialAmount")}: {formatMoney(initialPayableAmount({ ...chosen, pricing_mode: chosen.pricingMode }), chosen.currency, locale)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-700">{t("pricing.approvalNotice")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" data-testid="reselection-submit" disabled={busy} onClick={() => void confirm(chosen)} className="droplet-btn bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
              {t("pricing.confirmButton")}
            </button>
            <button type="button" disabled={busy} onClick={() => setChosen(null)} className="droplet-btn border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              {t("pricing.chooseAnother")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

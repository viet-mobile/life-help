"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { formatMoney, initialPayableAmount, unitKey, type PublicOffer } from "@/lib/pricing/pricingTerms";

type Subitem = { service_code: string; subitem_code: string };
const REFRESH_CODES: Record<string, string> = {
  PRICE_CHANGED: "pricing.priceChanged",
  HELPER_NO_LONGER_AVAILABLE: "pricing.helperUnavailable",
  OFFER_UNAVAILABLE: "pricing.offerExpired",
  OFFER_EXPIRED: "pricing.offerExpired",
  OFFER_INVALID: "pricing.offerExpired",
};

/** Terms of one offer, exactly as agreed if confirmed. Values come from the server offer only. */
export function OfferTerms({ offer }: { offer: PublicOffer }) {
  const { t, locale } = useLocale();
  const money = (n: number | null | undefined) => formatMoney(n == null ? null : Number(n), offer.currency, locale);
  const unit = unitKey(offer.pricingMode);
  const surcharges = [
    ["pricing.surchargeNight", offer.night_multiplier],
    ["pricing.surchargeWeekend", offer.weekend_multiplier],
    ["pricing.surchargeEmergency", offer.emergency_multiplier],
  ].filter(([, value]) => value != null) as Array<[string, number]>;
  return (
    <div className="mt-2 space-y-1 text-xs text-slate-700">
      <p className="text-sm font-black text-slate-900">
        {t(`pricing.mode.${offer.pricingMode}`)} · {money(offer.base_price)}{unit ? ` ${t(unit)}` : ""}
      </p>
      {offer.minimum_charge != null && <p>{t("pricing.minimumCharge")}: {money(offer.minimum_charge)}</p>}
      {offer.included_minutes != null && <p>{t("pricing.includedMinutes").replace("{minutes}", String(offer.included_minutes))}</p>}
      {offer.included_quantity != null && <p>{t("pricing.includedQuantity").replace("{quantity}", String(Number(offer.included_quantity)))}</p>}
      {offer.extra_hour_price != null && <p>{t("pricing.extraHour")}: {money(offer.extra_hour_price)}</p>}
      {offer.extra_unit_price != null && <p>{t("pricing.extraUnit")}: {money(offer.extra_unit_price)}</p>}
      {offer.materials_policy && (
        <p className="font-bold">{t(`pricing.materials.${offer.materials_policy}`)}{offer.materials_note ? ` · ${offer.materials_note}` : ""}</p>
      )}
      {surcharges.map(([key, value]) => <p key={key}>{t(key)}: ×{Number(value)}</p>)}
      <p>{t(offer.tax_included === false ? "pricing.taxExcluded" : "pricing.taxIncluded")}</p>
      {offer.pricingMode === "DIAGNOSTIC_PLUS_QUOTE" && <p className="font-bold text-amber-800">{t("pricing.diagnosticNotice")}</p>}
    </div>
  );
}

/**
 * Price preview + explicit helper choice BEFORE a request exists. Confirming hands only the opaque
 * offer token to the parent; the server re-reads and snapshots the terms.
 */
export function PriceOfferPicker({ serviceSlug, country, sido, gungu, disabled, errorCode, onConfirm }: {
  serviceSlug: string; country: string; sido: string; gungu: string; disabled: boolean; errorCode: string | null; onConfirm: (offerToken: string) => void;
}) {
  const { t, locale } = useLocale();
  const [subitems, setSubitems] = useState<Subitem[]>([]);
  const [subitem, setSubitem] = useState<string | null>(null);
  const [offers, setOffers] = useState<PublicOffer[] | null>(null);
  const [chosen, setChosen] = useState<PublicOffer | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const notice = errorCode && REFRESH_CODES[errorCode] ? t(REFRESH_CODES[errorCode]) : null;

  useEffect(() => {
    let active = true;
    void fetch(`/api/pricing/catalog?service=${encodeURIComponent(serviceSlug)}`, { cache: "no-store" })
      .then((r) => r.json()).then((data) => { if (active) { setSubitems(Array.isArray(data?.subitems) ? data.subitems : []); setSubitem(null); setChosen(null); setOffers(null); } })
      .catch(() => undefined);
    return () => { active = false; };
  }, [serviceSlug]);

  useEffect(() => {
    if (!subitem || !sido) return;
    let active = true;
    const params = new URLSearchParams({ service: serviceSlug, subitem, country: country || "KR", sido, gungu });
    void fetch(`/api/pricing/offers?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json()).then((data) => { if (active) { setOffers(Array.isArray(data?.offers) ? data.offers : []); setChosen(null); } })
      .catch(() => { if (active) setOffers([]); });
    return () => { active = false; };
  }, [serviceSlug, subitem, country, sido, gungu, reloadKey]);

  // A stale / taken offer came back from the server: show fresh offers so the customer re-chooses.
  useEffect(() => {
    if (!errorCode || !REFRESH_CODES[errorCode]) return;
    const timer = window.setTimeout(() => setReloadKey((n) => n + 1), 0);
    return () => window.clearTimeout(timer);
  }, [errorCode]);

  if (subitems.length === 0) return null;
  return (
    <section data-testid="price-offer-picker" className="droplet-card border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs">
      <p className="text-sm font-black text-slate-900">{t("pricing.chooseSubitem")}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {subitems.map((item) => (
          <button key={item.subitem_code} type="button" data-testid={`price-subitem-${item.subitem_code}`} onClick={() => setSubitem(item.subitem_code)}
            className={`droplet-pill border px-2.5 py-1 text-xs font-bold ${subitem === item.subitem_code ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-300 bg-white text-slate-700"}`}>
            {t(`serviceSubitems.${item.service_code}.${item.subitem_code}`)}
          </button>
        ))}
      </div>
      {notice && <p data-testid="price-offer-notice" className="mt-3 text-xs font-bold text-amber-800">{notice}</p>}
      {subitem && !chosen && (
        <div className="mt-3">
          <p className="text-xs font-black text-slate-800">{t("pricing.offersTitle")}</p>
          {offers !== null && offers.length === 0 && <p className="mt-1 text-xs text-slate-600">{t("pricing.noOffers")}</p>}
          <div className="mt-2 space-y-2">
            {(offers ?? []).map((offer) => (
              <article key={offer.offerToken} data-testid="price-offer-card" className="droplet-card border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-600">
                  {offer.helperAlias}{offer.rating != null ? ` · ★${Number(offer.rating).toFixed(1)}` : ""}{offer.completedJobs != null ? ` · ✔${offer.completedJobs}` : ""}
                  {offer.spokenLocales.length ? ` · ${offer.spokenLocales.join("/")}` : ""}
                </p>
                <OfferTerms offer={offer} />
                <button type="button" data-testid="price-offer-select" disabled={disabled} onClick={() => setChosen(offer)} className="mt-2 droplet-btn bg-blue-700 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50">
                  {t("pricing.select")}
                </button>
              </article>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{t("pricing.autoMatchNote")}</p>
        </div>
      )}
      {chosen && (
        <div data-testid="price-offer-confirm" className="mt-3 droplet-card border-2 border-blue-600 bg-blue-50/60 p-3">
          <p className="text-sm font-black text-blue-950">{t("pricing.confirmTitle")}</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{t(`serviceSubitems.${chosen.serviceCode}.${chosen.subitemCode}`)} · {chosen.helperAlias}</p>
          <OfferTerms offer={chosen} />
          <p data-testid="price-offer-initial" className="mt-2 text-sm font-black text-slate-900">
            {t("pricing.initialAmount")}: {formatMoney(initialPayableAmount({ ...chosen, pricing_mode: chosen.pricingMode }), chosen.currency, locale)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-700">{t("pricing.approvalNotice")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" data-testid="price-offer-submit" disabled={disabled} onClick={() => onConfirm(chosen.offerToken)} className="droplet-btn bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
              {t("pricing.confirmButton")}
            </button>
            <button type="button" disabled={disabled} onClick={() => setChosen(null)} className="droplet-btn border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              {t("pricing.chooseAnother")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

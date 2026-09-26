"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

type Subitem = { service_code: string; subitem_code: string; allowed_pricing_modes: string[] | string };
export type CustomerOfferInput = {
  subitemCode: string;
  offer: { pricing_mode: string; currency: string; offered_amount: string; materials_policy: string; public_note: string; preferred_window: string };
};

const OFFER_MODES = ["FIXED", "DIAGNOSTIC_PLUS_QUOTE"];
const modesOf = (s: Subitem) => (Array.isArray(s.allowed_pricing_modes) ? s.allowed_pricing_modes : String(s.allowed_pricing_modes).replace(/[{}]/g, "").split(",")).filter((m) => OFFER_MODES.includes(m));

/**
 * CUSTOMER_OFFER_OPEN: the customer proposes (and will prepay) an amount for one detailed service.
 * Only FIXED, or a prepaid diagnostic amount where the service is quote-based. The note is shown to
 * eligible Helpers, so contact details are refused. Nothing is published before verified payment.
 */
export function CustomerOfferForm({ serviceSlug, currency, disabled, onSubmit }: {
  serviceSlug: string; currency: string; disabled: boolean; onSubmit: (input: CustomerOfferInput) => void;
}) {
  const { t } = useLocale();
  const [subitems, setSubitems] = useState<Subitem[]>([]);
  const [subitem, setSubitem] = useState("");
  const [mode, setMode] = useState("FIXED");
  const [amount, setAmount] = useState("");
  const [materials, setMaterials] = useState("INCLUDED");
  const [note, setNote] = useState("");
  const [window, setWindow] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(`/api/pricing/catalog?service=${encodeURIComponent(serviceSlug)}`, { cache: "no-store" })
      .then((r) => r.json()).then((data) => { if (active) setSubitems(Array.isArray(data?.subitems) ? data.subitems : []); }).catch(() => undefined);
    return () => { active = false; };
  }, [serviceSlug]);

  const chosen = subitems.find((s) => s.subitem_code === subitem);
  const modes = chosen ? modesOf(chosen) : [];
  const effectiveMode = modes.includes(mode) ? mode : modes[0] ?? "";
  const materialsOptions = effectiveMode === "DIAGNOSTIC_PLUS_QUOTE" ? ["EXCLUDED", "PARTIALLY_INCLUDED", "QUOTE_REQUIRED"] : ["INCLUDED", "EXCLUDED", "PARTIALLY_INCLUDED", "QUOTE_REQUIRED"];
  const effectiveMaterials = materialsOptions.includes(materials) ? materials : materialsOptions[0];
  const valid = !!chosen && modes.length > 0 && Number(amount) > 0;

  if (subitems.length === 0) return null;
  return (
    <section data-testid="customer-offer-form" className="droplet-card border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs">
      <p className="text-sm font-black text-slate-900">{t("marketplace.customerOfferTitle")}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {subitems.map((s) => (
          <button key={s.subitem_code} type="button" data-testid={`offer-subitem-${s.subitem_code}`} onClick={() => setSubitem(s.subitem_code)}
            className={`droplet-pill border px-2.5 py-1 text-xs font-bold ${subitem === s.subitem_code ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-300 bg-white text-slate-700"}`}>
            {t(`serviceSubitems.${s.service_code}.${s.subitem_code}`)}
          </button>
        ))}
      </div>
      {chosen && modes.length === 0 && <p className="mt-2 text-xs font-bold text-slate-600">{t("marketplace.notAvailableForService")}</p>}
      {chosen && modes.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-bold">{t("marketplace.offeredAmount")} ({currency})
            <input data-testid="offer-amount" type="number" min={1} step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-sm font-black" />
          </label>
          <label className="text-[11px] font-bold">{t(`pricing.mode.${effectiveMode}`)}
            <select data-testid="offer-mode" value={effectiveMode} onChange={(e) => setMode(e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-xs">
              {modes.map((m) => <option key={m} value={m}>{t(`pricing.mode.${m}`)}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-bold">{t(`pricing.materials.${effectiveMaterials}`)}
            <select data-testid="offer-materials" value={effectiveMaterials} onChange={(e) => setMaterials(e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-xs">
              {materialsOptions.map((m) => <option key={m} value={m}>{t(`pricing.materials.${m}`)}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-bold">{t("marketplace.preferredWindow")}
            <input data-testid="offer-window" maxLength={120} value={window} onChange={(e) => setWindow(e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-xs" />
          </label>
          <label className="text-[11px] font-bold sm:col-span-2">{t("marketplace.publicNote")}
            <input data-testid="offer-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-xs" />
          </label>
          {effectiveMode === "DIAGNOSTIC_PLUS_QUOTE" && <p className="sm:col-span-2 text-xs font-bold text-amber-800">{t("pricing.diagnosticNotice")}</p>}
          <p className="sm:col-span-2 text-xs font-bold text-slate-700">{t("marketplace.publishedAfterPayment")}</p>
          <button type="button" data-testid="offer-submit" disabled={disabled || !valid}
            onClick={() => onSubmit({ subitemCode: subitem, offer: { pricing_mode: effectiveMode, currency, offered_amount: amount, materials_policy: effectiveMaterials, public_note: note, preferred_window: window } })}
            className="sm:col-span-2 droplet-btn bg-blue-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
            {t("marketplace.requestAtThisAmount")}
          </button>
        </div>
      )}
    </section>
  );
}

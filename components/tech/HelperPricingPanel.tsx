"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { MATERIALS_POLICIES, publishProblems, sanitizeTerms, type PriceTerms, type PricingMode } from "@/lib/pricing/pricingTerms";

type CatalogItem = { id: string; service_code: string; subitem_code: string; allowed_pricing_modes: PricingMode[] | string; default_pricing_mode: PricingMode };
type PriceRow = PriceTerms & { id: string; service_subitem_id: string; status: "DRAFT" | "ACTIVE" | "PAUSED"; revision: number };

const modesOf = (item: CatalogItem): PricingMode[] => (Array.isArray(item.allowed_pricing_modes) ? item.allowed_pricing_modes : String(item.allowed_pricing_modes).replace(/[{}]/g, "").split(",")) as PricingMode[];
const NUMBER_FIELDS: Array<[keyof PriceTerms, string, string, PricingMode[] | null]> = [
  ["base_price", "Price (see pricing method)", "가격 (요금 방식 기준)", null],
  ["minimum_charge", "Minimum charge", "최소 요금", ["FIXED", "HOURLY", "PER_UNIT", "PER_METER", "PER_AREA"]],
  ["included_minutes", "Minimum / included minutes", "최소·기본 포함 시간(분)", ["FIXED", "HOURLY"]],
  ["included_quantity", "Included quantity", "기본 포함 수량", ["PER_UNIT", "PER_METER", "PER_AREA"]],
  ["extra_hour_price", "Each extra hour", "추가 1시간 요금", ["FIXED", "HOURLY"]],
  ["extra_unit_price", "Each extra unit", "추가 1단위 요금", ["PER_UNIT", "PER_METER", "PER_AREA"]],
  ["night_multiplier", "Night multiplier (1–3)", "야간 배율 (1–3)", null],
  ["weekend_multiplier", "Weekend multiplier (1–3)", "주말 배율 (1–3)", null],
  ["emergency_multiplier", "Emergency multiplier (1–3)", "긴급 배율 (1–3)", null],
];

/**
 * Helper price management. Server-side identity only (Supabase session / Bearer): the helper id is
 * never sent from here. The database decides whether an offer can be published.
 */
export function HelperPricingPanel({ formatBilingual }: { formatBilingual: (en: string, ko: string) => string }) {
  const { t } = useLocale();
  const [available, setAvailable] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<PriceTerms | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/helper/prices", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) { setAvailable(false); return; }
    const data = await response.json();
    setAvailable(true);
    setCatalog(Array.isArray(data.catalog) ? data.catalog : []);
    setPrices(Array.isArray(data.prices) ? data.prices : []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const priceFor = (item: CatalogItem) => prices.find((p) => p.service_subitem_id === item.id) ?? null;
  const edit = (item: CatalogItem) => {
    const current = priceFor(item);
    setOpen(item.id);
    setMessage(null);
    setDraft(current ? { ...current } : { pricing_mode: item.default_pricing_mode, currency: "KRW", materials_policy: null, tax_included: true });
  };

  const save = async (item: CatalogItem, publish: boolean) => {
    const terms = sanitizeTerms(draft);
    if (!terms) { setMessage(formatBilingual("Please check the entered values.", "입력값을 확인해 주세요.")); return; }
    if (publish && publishProblems(terms).length) {
      setMessage(formatBilingual(`Complete these before publishing: ${publishProblems(terms).join(", ")}`, `게시 전에 입력해 주세요: ${publishProblems(terms).join(", ")}`));
      return;
    }
    setBusy(true);
    const response = await fetch("/api/helper/prices", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service_code: item.service_code, subitem_code: item.subitem_code, terms, publish }) });
    const data = await response.json().catch(() => null);
    setBusy(false);
    setMessage(response.ok
      ? (publish ? formatBilingual("Published. Customers can now see this price.", "게시되었습니다. 고객이 이 가격을 볼 수 있습니다.") : formatBilingual("Draft saved (not visible to customers).", "임시 저장되었습니다 (고객에게 표시되지 않음)."))
      : formatBilingual(`Not saved: ${data?.reason || data?.code || "error"}`, `저장하지 못했습니다: ${data?.reason || data?.code || "오류"}`));
    await refresh();
  };

  const setStatus = async (row: PriceRow, status: "ACTIVE" | "PAUSED") => {
    setBusy(true);
    const response = await fetch("/api/helper/prices/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price_id: row.id, status }) });
    setBusy(false);
    setMessage(response.ok ? formatBilingual(status === "PAUSED" ? "Paused." : "Published.", status === "PAUSED" ? "일시중지되었습니다." : "게시되었습니다.") : formatBilingual("The status could not be changed.", "상태를 변경하지 못했습니다."));
    await refresh();
  };

  if (!available) return null;
  const services = [...new Set(catalog.map((c) => c.service_code))];
  const statusLabel = (row: PriceRow | null) => !row ? formatBilingual("Not offered", "미제공") : row.status === "ACTIVE" ? formatBilingual("Published", "게시 중") : row.status === "PAUSED" ? formatBilingual("Paused", "일시중지") : formatBilingual("Draft", "임시 저장");

  return (
    <section data-testid="helper-pricing-panel" className="mt-6 droplet-card border border-slate-200 bg-white p-4 text-slate-900 shadow-xs">
      <h2 className="text-base font-black">{formatBilingual("My service prices", "내 서비스 가격")}</h2>
      <p className="mt-1 text-xs font-semibold text-slate-600">{formatBilingual("Set your own price for each detailed service you provide. Customers see published prices before requesting.", "제공하는 세부 서비스마다 직접 가격을 정하세요. 고객은 요청 전에 게시된 가격을 봅니다.")}</p>
      {message && <p className="mt-2 text-xs font-bold text-emerald-800">{message}</p>}
      {services.length === 0 && <p className="mt-2 text-xs text-slate-600">{formatBilingual("No qualified services yet.", "아직 등록된 서비스가 없습니다.")}</p>}
      {services.map((service) => (
        <div key={service} className="mt-3">
          <p className="text-sm font-black">{t(`service.${service === "clog-clearing" ? "clog" : service.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`) || service}</p>
          {catalog.filter((c) => c.service_code === service).map((item) => {
            const row = priceFor(item);
            return (
              <div key={item.id} className="mt-2 rounded border border-slate-200 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold">{t(`serviceSubitems.${item.service_code}.${item.subitem_code}`)}</span>
                  <span className="text-[11px] font-bold text-slate-500">{statusLabel(row)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => edit(item)} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-bold">{formatBilingual(row ? "Edit" : "Offer this service", row ? "수정" : "이 서비스 제공")}</button>
                  {row?.status === "ACTIVE" && <button type="button" disabled={busy} onClick={() => void setStatus(row, "PAUSED")} className="rounded border border-amber-400 px-2 py-1 text-[11px] font-bold text-amber-800">{formatBilingual("Pause", "일시중지")}</button>}
                  {row?.status === "PAUSED" && <button type="button" disabled={busy} onClick={() => void setStatus(row, "ACTIVE")} className="rounded border border-emerald-500 px-2 py-1 text-[11px] font-bold text-emerald-800">{formatBilingual("Resume", "재개")}</button>}
                </div>
                {open === item.id && draft && (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="text-[11px] font-bold">{formatBilingual("Pricing method", "요금 방식")}
                      <select value={draft.pricing_mode} onChange={(e) => setDraft({ ...draft, pricing_mode: e.target.value as PricingMode })} className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs">
                        {modesOf(item).map((mode) => <option key={mode} value={mode}>{t(`pricing.mode.${mode}`)}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold">{formatBilingual("Currency (ISO code)", "통화 (ISO 코드)")}
                      <input value={draft.currency ?? ""} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} maxLength={3} className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs" />
                    </label>
                    {NUMBER_FIELDS.filter(([, , , modes]) => !modes || modes.includes(draft.pricing_mode)).map(([key, en, ko]) => (
                      <label key={key} className="text-[11px] font-bold">{formatBilingual(en, ko)}
                        <input type="number" min={0} step="any" value={(draft[key] as number | null | undefined) ?? ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value === "" ? null : Number(e.target.value) })} className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs" />
                      </label>
                    ))}
                    <label className="text-[11px] font-bold">{formatBilingual("Materials", "자재비")}
                      <select value={draft.materials_policy ?? ""} onChange={(e) => setDraft({ ...draft, materials_policy: (e.target.value || null) as PriceTerms["materials_policy"] })} className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs">
                        <option value="">-</option>
                        {MATERIALS_POLICIES.map((policy) => <option key={policy} value={policy}>{t(`pricing.materials.${policy}`)}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold">{formatBilingual("Materials note", "자재 안내")}
                      <input value={draft.materials_note ?? ""} maxLength={300} onChange={(e) => setDraft({ ...draft, materials_note: e.target.value })} className="mt-0.5 w-full rounded border border-slate-300 p-1 text-xs" />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold">
                      <input type="checkbox" checked={draft.tax_included !== false} onChange={(e) => setDraft({ ...draft, tax_included: e.target.checked })} />
                      {formatBilingual("Tax included", "부가세 포함")}
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:col-span-2">
                      <button type="button" disabled={busy} onClick={() => void save(item, false)} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-bold">{formatBilingual("Save draft", "임시 저장")}</button>
                      <button type="button" disabled={busy} onClick={() => void save(item, true)} className="rounded bg-emerald-700 px-2.5 py-1 text-xs font-black text-white">{formatBilingual("Save and publish", "저장하고 게시")}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

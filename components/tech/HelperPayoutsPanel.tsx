"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { formatMoney } from "@/lib/pricing/pricingTerms";

type Payout = { id: string; currency: string; net_amount: number | string; fee_policy: string; status: string; submitted_at: string | null; paid_at: string | null };

/**
 * The Helper's own payout destination + payout status. Wording follows the ledger exactly:
 * CREATED -> release initiated, SUBMITTED -> sent but NOT yet confirmed, PAID -> confirmed on-chain.
 * "Paid" is never shown before the chain confirmation was verified by the server.
 */
export function HelperPayoutsPanel() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<{ destination: { masked_destination: string } | null; payouts: Payout[] } | null>(null);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/helper/payouts", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) { setData(null); return; }
    const body = await response.json().catch(() => null);
    setData({ destination: body?.destination ?? null, payouts: Array.isArray(body?.payouts) ? body.payouts : [] });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const save = async () => {
    const response = await fetch("/api/helper/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setMessage(body?.success ? t("payout.destinationSaved") : t("payment.unavailable"));
    setAddress("");
    await refresh();
  };

  const label = (status: string) => status === "PAID" ? t("payout.confirmed") : status === "SUBMITTED" ? t("payout.submitted") : status === "CREATED" ? t("payment.payoutStarted") : status;

  if (!data) return null;
  return (
    <section data-testid="helper-payouts" className="mt-6 droplet-card border border-slate-200 bg-white p-4 text-slate-900 shadow-xs">
      <h2 className="text-base font-black">{t("payout.title")}</h2>
      <p className="mt-1 text-xs font-semibold text-slate-600">{t("payout.destinationLabel")}: {data.destination?.masked_destination ?? "-"}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <input data-testid="payout-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("payout.addressPlaceholder")} className="min-w-0 flex-1 rounded border border-slate-300 p-1.5 text-xs" autoComplete="off" spellCheck={false} />
        <button type="button" data-testid="payout-address-save" disabled={!address.trim()} onClick={() => void save()} className="rounded bg-slate-900 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50">{t("payout.saveDestination")}</button>
      </div>
      {message && <p className="mt-2 text-xs font-bold text-emerald-800">{message}</p>}
      <ul className="mt-3 space-y-1.5">
        {data.payouts.map((p) => (
          <li key={p.id} data-testid="helper-payout-row" data-status={p.status} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 px-2.5 py-1.5 text-xs">
            <span className="font-black">{formatMoney(Number(p.net_amount), p.currency, locale)}</span>
            <span data-testid="helper-payout-status" className="font-bold text-slate-700">{label(p.status)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

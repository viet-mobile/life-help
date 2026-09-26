"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { formatMoney } from "@/lib/pricing/pricingTerms";

type Payment = { intentId: string; amountUsdc: string; network: string; recipient: string; reference: string; solanaPayUrl: string; expiresAt: string };

const STALE: Record<string, string> = {
  CHECKOUT_STALE: "pricing.priceChanged", PRICE_CHANGED: "pricing.priceChanged", RESERVATION_EXPIRED: "pricing.offerExpired",
  CHECKOUT_EXPIRED: "pricing.offerExpired", QUOTE_EXPIRED: "pricing.offerExpired", HELPER_NO_LONGER_AVAILABLE: "pricing.helperUnavailable",
};

/**
 * Prepaid checkout: nothing becomes a service request until the payment is verified by the server.
 * The customer's own wallet signs the Solana Pay transfer; LIFE.HELP never holds keys. Attached
 * photos / videos are uploaded to private storage for this checkout (in-app viewing only).
 */
export function CheckoutPanel({ checkoutId, mode, fiatCurrency, fiatAmount, files, onActivated }: {
  checkoutId: string; mode: "HELPER_PRICE_SELECTED" | "CUSTOMER_OFFER_OPEN"; fiatCurrency: string; fiatAmount: number; files: File[];
  onActivated: (result: { requestId: string; capability: string | null }) => void;
}) {
  const { t, locale } = useLocale();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [signature, setSignature] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("AWAITING_PAYMENT");
  const [busy, setBusy] = useState(false);
  const uploaded = useRef(false);

  // Attached media travel with the checkout (private bucket; failures never block payment).
  useEffect(() => {
    if (uploaded.current || files.length === 0) return;
    uploaded.current = true;
    void (async () => {
      for (const file of files.slice(0, 10)) {
        await fetch(`/api/checkouts/${checkoutId}/media`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }).catch(() => null);
      }
    })();
  }, [checkoutId, files]);

  const startPayment = async () => {
    setBusy(true);
    setNotice(null);
    const response = await fetch(`/api/checkouts/${checkoutId}/payment`, { method: "POST" }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setBusy(false);
    if (data?.success) setPayment(data as Payment);
    else setNotice(t(STALE[String(data?.code)] ?? "payment.unavailable"));
  };

  const verify = async () => {
    if (!payment || !signature.trim()) return;
    setBusy(true);
    setNotice(null);
    const response = await fetch(`/api/payments/${payment.intentId}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature: signature.trim() }) }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setBusy(false);
    if (typeof data?.paymentStatus === "string") setStatus(data.paymentStatus);
    if (!data?.success) { setNotice(t("payment.unavailable")); return; }
    // Activated server-side: read the checkout once more for the request id + chat capability.
    const checkout = await fetch(`/api/checkouts/${checkoutId}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (checkout?.requestId) onActivated({ requestId: checkout.requestId, capability: checkout.capability ?? null });
  };

  return (
    <section data-testid="checkout-panel" className="droplet-card border-2 border-blue-600 bg-white p-4 text-left">
      <p className="text-sm font-black text-slate-900">{mode === "CUSTOMER_OFFER_OPEN" ? t("marketplace.customerOfferTitle") : t("marketplace.acceptHelperOffer")}</p>
      <p data-testid="checkout-amount" className="mt-1 text-2xl font-black text-blue-900">{formatMoney(fiatAmount, fiatCurrency, locale)}</p>
      <p className="mt-1 text-xs font-bold text-slate-700">{t("marketplace.publishedAfterPayment")}</p>
      <p data-testid="checkout-status" className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-900">
        {status === "PAID_HELD" ? t("payment.held") : t("payment.awaiting")}
      </p>
      {notice && <p data-testid="checkout-notice" className="mt-2 text-xs font-bold text-red-800">{notice}</p>}
      {!payment ? (
        <button type="button" data-testid="checkout-pay" disabled={busy} onClick={() => void startPayment()} className="mt-3 droplet-btn bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
          {t("payment.payWithUsdc")}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <p data-testid="checkout-usdc" className="text-sm font-black text-slate-900">{payment.amountUsdc} USDC · {payment.network}</p>
          <a data-testid="checkout-wallet" href={payment.solanaPayUrl} className="inline-flex droplet-btn bg-slate-900 px-3 py-1.5 text-xs font-black text-white">{t("payment.openWallet")}</a>
          <label className="block text-[11px] font-bold text-slate-700">{t("payment.signatureLabel")}
            <input data-testid="checkout-signature" value={signature} onChange={(e) => setSignature(e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 p-1.5 text-xs" autoComplete="off" spellCheck={false} />
          </label>
          <button type="button" data-testid="checkout-verify" disabled={busy || !signature.trim()} onClick={() => void verify()} className="droplet-btn bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
            {t("payment.confirmed")}
          </button>
        </div>
      )}
    </section>
  );
}

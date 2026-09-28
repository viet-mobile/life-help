import type { NormalizedEventType, NormalizedProviderEvent, ProviderEnvironment, RawWebhook } from "@/lib/payments/provider/contract";
import { toMinor } from "@/lib/payments/provider/airwallex/money";

/**
 * Airwallex webhook verification (documented): x-timestamp (Unix ms) + x-signature; HMAC-SHA256 with the
 * notification URL's secret over x-timestamp concatenated with the EXACT raw request body; compare, then check
 * the timestamp against the configured tolerance. Verification happens BEFORE any JSON parsing. The tolerance
 * is provider configuration (server-side), never a request parameter.
 */
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const header = (headers: Record<string, string>, name: string) => Object.entries(headers).find(([k]) => k.toLowerCase() === name)?.[1] ?? "";

export async function verifyAirwallexSignature(webhook: RawWebhook, secret: string, config: { toleranceMs: number; nowMs?: number }): Promise<boolean> {
  if (!secret || !(config.toleranceMs > 0)) return false;
  const timestamp = header(webhook.headers, "x-timestamp").trim();
  const signature = header(webhook.headers, "x-signature").trim().toLowerCase();
  if (!/^\d{10,16}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}${webhook.rawBody}`)));
  if (!timingSafeEqualHex(expected, signature)) return false;
  return Math.abs((config.nowMs ?? Date.now()) - Number(timestamp)) <= config.toleranceMs;
}

/**
 * Documented Airwallex event names -> the LIFE.HELP normalized vocabulary. Deliberately:
 *   payout.transfer.paid     -> PAYOUT_REPORTED_PAID (Airwallex documents PAID -> FAILED; never final)
 *   payout.transfer.failed / .cancelled (FAILED is auto-cancelled; funds returned less fees) -> PAYOUT_FAILED
 *   refund.settled           -> REFUND_CONFIRMED (the documented completion state; no documented reversal)
 *   payment_intent.succeeded -> PAYMENT_HELD (documented: captured, funds guaranteed)
 * Informational events (created / pending / requires_*) map to nothing and are acknowledged without recording.
 */
const EVENT_MAP: Record<string, NormalizedEventType | null> = {
  "payment_intent.succeeded": "PAYMENT_HELD",
  "payment_intent.requires_capture": "PAYMENT_AUTHORIZED",
  "payment_intent.cancelled": "PAYMENT_CANCELLED",
  "payment_intent.created": null, "payment_intent.requires_payment_method": null, "payment_intent.requires_customer_action": null,
  "payment_intent.pending": null, "payment_intent.pending_review": null,
  "refund.received": "REFUND_SUBMITTED", "refund.accepted": "REFUND_SUBMITTED", "refund.settled": "REFUND_CONFIRMED", "refund.failed": "REFUND_FAILED",
  "payout.transfer.in_approval": "PAYOUT_SUBMITTED", "payout.transfer.scheduled": "PAYOUT_SUBMITTED", "payout.transfer.overdue": "PAYOUT_SUBMITTED",
  "payout.transfer.processing": "PAYOUT_SUBMITTED", "payout.transfer.sent": "PAYOUT_SUBMITTED",
  "payout.transfer.paid": "PAYOUT_REPORTED_PAID",
  "payout.transfer.failed": "PAYOUT_FAILED", "payout.transfer.cancelled": "PAYOUT_FAILED",
  "payout.transfer.approval_rejected": "PAYOUT_FAILED", "payout.transfer.approval_recalled": "PAYOUT_FAILED", "payout.transfer.approval_blocked": "PAYOUT_FAILED",
};

type AwxObject = Record<string, unknown> & { id?: string; request_id?: string; amount?: string | number; currency?: string; transfer_amount?: string | number; transfer_currency?: string; merchant_order_id?: string; metadata?: Record<string, unknown> };
type AwxEvent = { id?: string; name?: string; account_id?: string; created_at?: string; data?: { object?: AwxObject } };

/** Parse + map a VERIFIED body. null -> malformed (refuse the delivery); [] -> nothing to record (acknowledge). */
export function mapAirwallexEvent(rawBody: string, environment: ProviderEnvironment, providerCode: string): NormalizedProviderEvent[] | null {
  let e: AwxEvent;
  try { e = JSON.parse(rawBody); } catch { return null; }
  if (!e || typeof e.id !== "string" || typeof e.name !== "string" || !e.data?.object) return null;
  if (!(e.name in EVENT_MAP)) return [];
  const type = EVENT_MAP[e.name];
  if (!type) return [];
  const o = e.data.object;
  const isPayment = type.startsWith("PAYMENT_");
  const objectRef = isPayment ? o.id : o.request_id;
  if (typeof objectRef !== "string" || objectRef.length < 4) return null;
  const currency = typeof (isPayment || type.startsWith("REFUND_") ? o.currency : o.transfer_currency) === "string" ? String(isPayment || type.startsWith("REFUND_") ? o.currency : o.transfer_currency) : null;
  const rawAmount = isPayment || type.startsWith("REFUND_") ? o.amount : o.transfer_amount;
  let amount = null;
  if (currency && rawAmount !== undefined && rawAmount !== null) {
    try { amount = { amountMinor: toMinor(rawAmount as string | number, currency), currency }; } catch { return null; }
  }
  const reference = typeof o.metadata?.life_help_reference === "string" ? String(o.metadata.life_help_reference)
    : isPayment && typeof o.merchant_order_id === "string" ? o.merchant_order_id : null;
  return [{
    provider: providerCode, environment, providerAccount: typeof e.account_id === "string" ? e.account_id : null,
    providerEventId: e.id, providerEventType: e.name, eventType: type, objectRef, lifeHelpReference: reference, amount,
    occurredAt: typeof e.created_at === "string" ? e.created_at : null, sequence: null,
  }];
}

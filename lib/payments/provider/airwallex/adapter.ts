import type {
  NormalizedProviderEvent, PaymentProviderAdapter, PaymentSession, PaymentSessionInput, PaymentStatusResult, PayoutInput, ProviderEnvironment,
  RawWebhook, RefundInput, RefundQueryContext, TransferCreateResult, TransferStatusResult,
} from "@/lib/payments/provider/contract";
import { AirwallexApiError, type AirwallexHttpClient } from "@/lib/payments/provider/airwallex/client";
import { toMajorString, toMinor } from "@/lib/payments/provider/airwallex/money";
import { mapAirwallexEvent, verifyAirwallexSignature } from "@/lib/payments/provider/airwallex/webhook";

/**
 * Airwallex adapter for the provider-neutral contract. Everything commercial comes FROM the ledger:
 *   payment   POST /api/v1/pa/payment_intents/create  (request_id derived from the LIFE.HELP intent; the returned
 *             GET  /api/v1/pa/payment_intents/{id}     id is bound in provider_payment_links. Uncertain create:
 *                                                     repeat the create with the SAME request_id - the provider
 *                                                     returns the original intent instead of a duplicate)
 *   refund    POST /api/v1/pa/refunds/create           (request_id = the refund job's idempotency key; the
 *             GET  /api/v1/pa/refunds?payment_intent_id  provider payment id is the ledger's bound reference.
 *                                                     The refund list has no request_id filter: list EVERY page
 *                                                     (page_num / has_more) of that ledger-bound payment, then
 *                                                     match request_id exactly. No request_id dedupe window is
 *                                                     documented for refunds -> window null (fail closed))
 *   payout    POST /api/v1/transfers/create            (request_id = the payout job's idempotency key; amount,
 *             GET  /api/v1/transfers?request_id=&page=0  currency, beneficiary from the ledger / verified destination.
 *                                                     page=0 on the first request lifts the default 30-day list
 *                                                     window (complete history); page_after is followed to the end.
 *                                                     Create dedupes a reused request_id for 7 days (documented).)
 * Lookups classify 0 / 1 / >1 ONLY after complete pagination. A transport error, non-2xx, malformed body or an
 * unfinished pagination throws AirwallexLookupError (UNKNOWN) - never "zero", so it can never trigger a create.
 * No provider object id is stored or trusted: every lookup is derived from the LIFE.HELP key + ledger.
 * Status normalization (documented Airwallex lifecycles):
 *   PaymentIntent SUCCEEDED -> HELD; REQUIRES_CAPTURE -> AUTHORIZED; CANCELLED -> CANCELLED; others -> PENDING
 *   Refund RECEIVED / ACCEPTED -> PENDING; SETTLED -> CONFIRMED; FAILED -> FAILED
 *   Transfer IN_APPROVAL / SCHEDULED / OVERDUE / PROCESSING / SENT -> PENDING; PAID -> REPORTED_PAID (NOT final:
 *     "a transfer can still move to FAILED after PAID"); FAILED / CANCELLED / APPROVAL_* -> FAILED.
 *     The funding status is reported separately (fundingStatus) and never overrides the transfer status.
 * Nothing here is reachable at runtime yet: the registry never resolves AIRWALLEX (commercial gate).
 */
export const AIRWALLEX_PROVIDER_CODE = "AIRWALLEX";
/** Documented: "Payout creation requests with a request_id that has been used in the past 7 days are treated as duplicated". */
export const AIRWALLEX_TRANSFER_REQUEST_ID_WINDOW_MS = 7 * 24 * 3600 * 1000;
const MAX_LOOKUP_PAGES = 50;

/** A lookup whose outcome is not known (never to be read as "no object"). */
export class AirwallexLookupError extends Error {
  constructor(code: string) { super(`PROVIDER_LOOKUP_UNKNOWN_${code}`); this.name = "AirwallexLookupError"; }
}

type Json = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : null);

export class AirwallexAdapter implements PaymentProviderAdapter {
  readonly code = AIRWALLEX_PROVIDER_CODE;
  readonly kind = "PSP" as const;
  readonly createIdempotencyWindowMs = { REFUND: null, PAYOUT: AIRWALLEX_TRANSFER_REQUEST_ID_WINDOW_MS };
  readonly environment: ProviderEnvironment;
  private readonly http: AirwallexHttpClient;
  private readonly webhookToleranceMs: number;

  constructor(options: { environment: ProviderEnvironment; http: AirwallexHttpClient; webhookToleranceMs: number }) {
    if (!(options.webhookToleranceMs > 0)) throw new Error("AIRWALLEX_WEBHOOK_TOLERANCE_REQUIRED");
    this.environment = options.environment;
    this.http = options.http;
    this.webhookToleranceMs = options.webhookToleranceMs;
  }

  async createPaymentSession(input: PaymentSessionInput): Promise<PaymentSession> {
    const body = await this.http.request<Json>("POST", "/api/v1/pa/payment_intents/create", {
      request_id: `lh-pi-${input.intentId}`, amount: toMajorString(input.amount.amountMinor, input.amount.currency), currency: input.amount.currency,
      merchant_order_id: input.reference, metadata: { life_help_reference: input.reference, life_help_intent_id: input.intentId },
    });
    const id = str(body.id);
    if (!id) throw new Error("AIRWALLEX_PAYMENT_INTENT_ID_MISSING");
    return { providerPaymentId: id, redirectUrl: null };
  }

  async queryPayment(providerPaymentId: string): Promise<PaymentStatusResult> {
    let body: Json;
    try { body = await this.http.request<Json>("GET", `/api/v1/pa/payment_intents/${encodeURIComponent(providerPaymentId)}`); } catch (e) {
      if (e instanceof AirwallexApiError && e.status === 404) return { status: "NOT_FOUND", amount: null, statusVersion: "0" };
      throw e;
    }
    const status = str(body.status) ?? "";
    const mapped = status === "SUCCEEDED" ? "HELD" : status === "REQUIRES_CAPTURE" ? "AUTHORIZED" : status === "CANCELLED" ? "CANCELLED" : "PENDING";
    const currency = str(body.currency);
    return { status: mapped, amount: currency && body.amount !== undefined ? { amountMinor: toMinor(body.amount as string | number, currency), currency } : null, statusVersion: `${status}:${str(body.updated_at) ?? ""}` };
  }

  private async create(path: string, payload: Json): Promise<TransferCreateResult> {
    try {
      await this.http.request<Json>("POST", path, payload);
      return { accepted: true };
    } catch (e) {
      // A refused create is surfaced (never retried blindly); transport errors propagate as retryable.
      if (e instanceof AirwallexApiError && e.status >= 400 && e.status < 500 && e.status !== 429) return { accepted: false, code: e.message };
      throw e;
    }
  }

  async createRefund(input: RefundInput): Promise<TransferCreateResult> {
    return this.create("/api/v1/pa/refunds/create", {
      request_id: input.idempotencyKey, payment_intent_id: input.providerPaymentId, amount: toMajorString(input.amount.amountMinor, input.amount.currency),
      reason: "LIFE.HELP refund", metadata: { life_help_reference: input.reference },
    });
  }

  private transfer(input: PayoutInput, reason: string) {
    return this.create("/api/v1/transfers/create", {
      request_id: input.idempotencyKey, beneficiary_id: input.payeeToken, transfer_amount: toMajorString(input.amount.amountMinor, input.amount.currency),
      transfer_currency: input.amount.currency, source_currency: input.amount.currency, reason, reference: `LIFE.HELP ${input.reference.slice(0, 8)}`,
      metadata: { life_help_reference: input.reference, life_help_idempotency_key: input.idempotencyKey },
    });
  }
  createHelperPayout(input: PayoutInput) { return this.transfer(input, "service_payout"); }
  createReferralPayout(input: PayoutInput) { return this.transfer(input, "referral_reward"); }

  /** Objects whose request_id EXACTLY equals the LIFE.HELP key (a provider-side filter is never trusted alone). */
  private static exact(items: unknown, key: string): Json[] {
    return (Array.isArray(items) ? (items as Json[]) : []).filter((o) => o && str(o.request_id) === key);
  }

  /** GET a list page; anything but a well-formed 2xx list is UNKNOWN (never zero). */
  private async listPage(path: string): Promise<Json> {
    let body: Json | null;
    try { body = await this.http.request<Json>("GET", path); } catch (e) {
      throw new AirwallexLookupError(e instanceof AirwallexApiError ? `HTTP_${e.status}` : "TRANSPORT");
    }
    if (!body || typeof body !== "object" || !Array.isArray(body.items)) throw new AirwallexLookupError("MALFORMED");
    return body;
  }

  async queryRefund(key: string, context: RefundQueryContext): Promise<TransferStatusResult> {
    if (!context?.providerPaymentId) return { status: "AMBIGUOUS", amount: null, failureCode: "REFUND_PAYMENT_BINDING_MISSING" };
    const matches: Json[] = [];
    let complete = false;
    for (let page = 0; page < MAX_LOOKUP_PAGES; page += 1) {
      const body = await this.listPage(`/api/v1/pa/refunds?payment_intent_id=${encodeURIComponent(context.providerPaymentId)}&page_num=${page}&page_size=100`);
      matches.push(...AirwallexAdapter.exact(body.items, key));
      if (typeof body.has_more !== "boolean") throw new AirwallexLookupError("MALFORMED");
      if (!body.has_more) { complete = true; break; }
    }
    if (!complete) throw new AirwallexLookupError("PAGINATION_INCOMPLETE");
    if (matches.length === 0) return { status: "NOT_FOUND", amount: null, failureCode: null };
    if (matches.length > 1) return { status: "AMBIGUOUS", amount: null, failureCode: "MULTIPLE_REFUNDS_FOR_REQUEST_ID" };
    const b = matches[0];
    const s = str(b.status) ?? "";
    const currency = str(b.currency);
    return {
      status: s === "SETTLED" ? "CONFIRMED" : s === "FAILED" ? "FAILED" : "PENDING",
      amount: currency && b.amount !== undefined ? { amountMinor: toMinor(b.amount as string | number, currency), currency } : null,
      failureCode: s === "FAILED" ? str(b.failure_reason) ?? "AIRWALLEX_REFUND_FAILED" : null,
      target: str(b.payment_intent_id),
    };
  }

  async queryPayout(key: string): Promise<TransferStatusResult> {
    const matches: Json[] = [];
    const seen = new Set<string>();
    let cursor = "0"; // page=0 on the first request: complete history, not the default 30-day window
    let complete = false;
    for (let i = 0; i < MAX_LOOKUP_PAGES; i += 1) {
      const body = await this.listPage(`/api/v1/transfers?request_id=${encodeURIComponent(key)}&page=${encodeURIComponent(cursor)}&page_size=100`);
      matches.push(...AirwallexAdapter.exact(body.items, key));
      const next = body.page_after;
      if (next === undefined || next === null || next === "") { complete = true; break; }
      if (typeof next !== "string" || seen.has(next) || next === cursor) throw new AirwallexLookupError("PAGINATION_INVALID");
      seen.add(next);
      cursor = next;
    }
    if (!complete) throw new AirwallexLookupError("PAGINATION_INCOMPLETE");
    if (matches.length === 0) return { status: "NOT_FOUND", amount: null, failureCode: null };
    if (matches.length > 1) return { status: "AMBIGUOUS", amount: null, failureCode: "MULTIPLE_TRANSFERS_FOR_REQUEST_ID" };
    const b = matches[0];
    const s = str(b.status) ?? "";
    const currency = str(b.transfer_currency);
    const failed = ["FAILED", "CANCELLED", "APPROVAL_REJECTED", "APPROVAL_RECALLED", "APPROVAL_BLOCKED"].includes(s);
    return {
      status: s === "PAID" ? "REPORTED_PAID" : failed ? "FAILED" : "PENDING",
      amount: currency && b.transfer_amount !== undefined ? { amountMinor: toMinor(b.transfer_amount as string | number, currency), currency } : null,
      failureCode: failed ? str(b.failure_reason) ?? `AIRWALLEX_TRANSFER_${s}` : null,
      fundingStatus: str((b.funding as Json | undefined)?.status) ?? null,
      target: str(b.beneficiary_id),
    };
  }

  async verifyWebhook(webhook: RawWebhook, webhookSecret: string): Promise<NormalizedProviderEvent[] | null> {
    if (!(await verifyAirwallexSignature(webhook, webhookSecret, { toleranceMs: this.webhookToleranceMs }))) return null;
    return mapAirwallexEvent(webhook.rawBody, this.environment, this.code);
  }
}

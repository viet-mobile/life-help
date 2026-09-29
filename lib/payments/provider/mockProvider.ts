import type {
  Money, NormalizedEventType, NormalizedProviderEvent, PaymentProviderAdapter, PaymentSession, PaymentSessionInput, PaymentStatusResult,
  PayoutInput, ProviderEnvironment, RawWebhook, RefundInput, TransferStatusResult,
} from "@/lib/payments/provider/contract";

/**
 * Deterministic SANDBOX mock provider for the provider contract (tests only). It can never be production
 * financial authority: the constructor refuses any environment but SANDBOX, the ledger registry only
 * allows a MOCK provider in SANDBOX (payment_providers_mock_sandbox_only), and the provider registry
 * refuses it whenever the deployment environment is LIVE.
 *
 * Webhooks are signed like typical PSPs: header x-mock-signature: t=<unix seconds>,v1=<hex HMAC-SHA256
 * of "<t>.<raw body>" with the webhook secret>. Scripted outcomes let tests drive success / failure /
 * duplicates / out-of-order delivery / polling failures deterministically.
 */
export const MOCK_PROVIDER_CODE = "MOCK_PROVIDER";
const SIGNATURE_HEADER = "x-mock-signature";
const TOLERANCE_SECONDS = 300;

type TransferRecord = { kind: "REFUND" | "PAYOUT"; idempotencyKey: string; reference: string; amount: Money; target: string; status: TransferStatusResult["status"]; failureCode: string | null };
type PaymentRecord = { providerPaymentId: string; reference: string; amount: Money; status: PaymentStatusResult["status"]; version: number };

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const toJsonMoney = (m: Money | null) => (m ? { amount_minor: m.amountMinor.toString(), currency: m.currency } : null);

export type MockScript = {
  payment: "HELD" | "FAILED" | "AUTHORIZED_ONLY";
  refund: "CONFIRMED" | "FAILED" | "PENDING";
  payout: "CONFIRMED" | "FAILED" | "PENDING";
  pollFailure: boolean;
  /** Report a different amount than requested (provider fault / attack simulation). */
  misreportAmountBy: bigint;
};

export class MockPaymentProvider implements PaymentProviderAdapter {
  readonly code = MOCK_PROVIDER_CODE;
  readonly kind = "MOCK" as const;
  // The mock keeps every idempotency key forever (deterministic in-memory store).
  readonly createIdempotencyWindowMs = { REFUND: Number.POSITIVE_INFINITY, PAYOUT: Number.POSITIVE_INFINITY };
  readonly environment: ProviderEnvironment;
  readonly account: string;
  script: MockScript = { payment: "HELD", refund: "CONFIRMED", payout: "CONFIRMED", pollFailure: false, misreportAmountBy: BigInt(0) };
  readonly payments = new Map<string, PaymentRecord>();
  readonly transfers = new Map<string, TransferRecord>();
  readonly createCalls: string[] = [];
  private seq = 0;

  constructor(environment: ProviderEnvironment, account = "mock-account-1") {
    if (environment !== "SANDBOX") throw new Error("MOCK_PROVIDER_SANDBOX_ONLY");
    this.environment = environment;
    this.account = account;
  }

  private reported(amount: Money): Money { return { amountMinor: amount.amountMinor + this.script.misreportAmountBy, currency: amount.currency }; }

  async createPaymentSession(input: PaymentSessionInput): Promise<PaymentSession> {
    const providerPaymentId = `mockpay_${input.intentId.replace(/-/g, "").slice(0, 24)}`;
    if (!this.payments.has(providerPaymentId)) this.payments.set(providerPaymentId, { providerPaymentId, reference: input.reference, amount: input.amount, status: "PENDING", version: 0 });
    return { providerPaymentId, redirectUrl: `https://sandbox.mock-provider.invalid/pay/${providerPaymentId}` };
  }

  /** Test lever: the customer finishes (or fails) paying on the provider's page. */
  completePayment(providerPaymentId: string): PaymentRecord {
    const p = this.payments.get(providerPaymentId);
    if (!p) throw new Error("MOCK_UNKNOWN_PAYMENT");
    p.status = this.script.payment === "HELD" ? "HELD" : this.script.payment === "FAILED" ? "FAILED" : "AUTHORIZED";
    p.version += 1;
    return p;
  }

  async queryPayment(providerPaymentId: string): Promise<PaymentStatusResult> {
    if (this.script.pollFailure) throw new Error("HTTP_503 mock provider unavailable");
    const p = this.payments.get(providerPaymentId);
    if (!p) return { status: "NOT_FOUND", amount: null, statusVersion: "0" };
    return { status: p.status, amount: this.reported(p.amount), statusVersion: String(p.version) };
  }

  private createTransfer(kind: "REFUND" | "PAYOUT", idempotencyKey: string, reference: string, amount: Money, target: string) {
    this.createCalls.push(`${kind}:${idempotencyKey}`);
    if (!this.transfers.has(idempotencyKey)) {
      const outcome = kind === "REFUND" ? this.script.refund : this.script.payout;
      this.transfers.set(idempotencyKey, { kind, idempotencyKey, reference, amount, target, status: outcome === "PENDING" ? "PENDING" : outcome, failureCode: outcome === "FAILED" ? "MOCK_DECLINED" : null });
    }
    return { accepted: true };
  }
  async createRefund(input: RefundInput) { return this.createTransfer("REFUND", input.idempotencyKey, input.reference, input.amount, input.providerPaymentId); }
  async createHelperPayout(input: PayoutInput) { return this.createTransfer("PAYOUT", input.idempotencyKey, input.reference, input.amount, input.payeeToken); }
  async createReferralPayout(input: PayoutInput) { return this.createTransfer("PAYOUT", input.idempotencyKey, input.reference, input.amount, input.payeeToken); }
  private async queryTransfer(idempotencyKey: string): Promise<TransferStatusResult> {
    if (this.script.pollFailure) throw new Error("HTTP_503 mock provider unavailable");
    const t = this.transfers.get(idempotencyKey);
    if (!t) return { status: "NOT_FOUND", amount: null, failureCode: null };
    return { status: t.status, amount: this.reported(t.amount), failureCode: t.failureCode };
  }
  async queryRefund(idempotencyKey: string) { return this.queryTransfer(idempotencyKey); }
  async queryPayout(idempotencyKey: string) { return this.queryTransfer(idempotencyKey); }

  /** Test lever: settle a PENDING transfer later. */
  settleTransfer(idempotencyKey: string, status: "CONFIRMED" | "FAILED") {
    const t = this.transfers.get(idempotencyKey);
    if (t) { t.status = status; t.failureCode = status === "FAILED" ? "MOCK_DECLINED" : null; }
  }

  /** Build a signed webhook the way the provider would send it. */
  async webhook(secret: string, events: Array<{ id?: string; type: string; object: string; reference?: string | null; amount?: Money | null; sequence?: number; environment?: ProviderEnvironment; account?: string }>, opts: { timestamp?: number; tamper?: boolean } = {}): Promise<RawWebhook> {
    const body = JSON.stringify({
      livemode: false,
      data: events.map((e) => ({
        id: e.id ?? `evt_mock_${++this.seq}_${Date.now()}`, type: e.type, object: e.object, reference: e.reference ?? null,
        amount: toJsonMoney(e.amount ?? null), sequence: e.sequence ?? this.seq, environment: e.environment ?? this.environment,
        account: e.account ?? this.account, created: new Date().toISOString(),
      })),
    });
    const t = String(opts.timestamp ?? Math.floor(Date.now() / 1000));
    const signature = await hmac(secret, `${t}.${body}`);
    return { rawBody: opts.tamper ? body.replace("mock", "m0ck") : body, headers: { [SIGNATURE_HEADER]: `t=${t},v1=${signature}` } };
  }

  async verifyWebhook(webhook: RawWebhook, webhookSecret: string): Promise<NormalizedProviderEvent[] | null> {
    if (!webhookSecret) return null;
    const header = Object.entries(webhook.headers).find(([k]) => k.toLowerCase() === SIGNATURE_HEADER)?.[1] ?? "";
    const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=").map((s) => s.trim())));
    const t = Number(parts.t);
    if (!parts.v1 || !Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return null;
    const expected = await hmac(webhookSecret, `${parts.t}.${webhook.rawBody}`);
    if (!timingSafeEqualHex(expected, String(parts.v1))) return null;
    // Only now is the body trusted enough to parse.
    let parsed: { data?: Array<Record<string, unknown>> };
    try { parsed = JSON.parse(webhook.rawBody); } catch { return null; }
    const map: Record<string, NormalizedEventType> = {
      "payment.authorized": "PAYMENT_AUTHORIZED", "payment.held": "PAYMENT_HELD", "payment.failed": "PAYMENT_FAILED", "payment.cancelled": "PAYMENT_CANCELLED",
      "refund.submitted": "REFUND_SUBMITTED", "refund.succeeded": "REFUND_CONFIRMED", "refund.failed": "REFUND_FAILED",
      "payout.submitted": "PAYOUT_SUBMITTED", "payout.paid": "PAYOUT_CONFIRMED", "payout.failed": "PAYOUT_FAILED",
    };
    const events: NormalizedProviderEvent[] = [];
    for (const e of parsed.data ?? []) {
      const eventType = map[String(e.type)];
      if (!eventType) return null; // unknown event type: the whole delivery is refused (fail closed)
      const amount = e.amount as { amount_minor?: string; currency?: string } | null;
      events.push({
        provider: this.code, environment: e.environment === "LIVE" ? "LIVE" : "SANDBOX", providerAccount: String(e.account ?? ""),
        providerEventId: String(e.id), providerEventType: String(e.type), eventType, objectRef: String(e.object),
        lifeHelpReference: e.reference ? String(e.reference) : null,
        amount: amount?.amount_minor && amount.currency ? { amountMinor: BigInt(amount.amount_minor), currency: String(amount.currency) } : null,
        occurredAt: e.created ? String(e.created) : null, sequence: typeof e.sequence === "number" ? e.sequence : null,
      });
    }
    return events;
  }
}

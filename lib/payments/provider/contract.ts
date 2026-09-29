/**
 * Provider-neutral payment provider contract (migration 202609280020).
 *
 * A provider (licensed PSP / custody / escrow / payout provider, chosen later) only MOVES money and
 * reports evidence. LIFE.HELP's ledger stays the business authority:
 *   - amounts, currency, selected Helper, customer offer, price selection, reward amount: never taken
 *     from a provider; an adapter receives them FROM the ledger (open_provider_payment_intent,
 *     provider_transfer_target) and must report them back unchanged;
 *   - provider statuses are normalized HERE, inside the adapter, into the ledger's vocabulary; nothing
 *     outside an adapter interprets a provider-specific status;
 *   - evidence enters the ledger through exactly one authority: ingest_provider_event (webhooks and polls
 *     alike) for payments, and the money outbox (lease + record_money_attempt_result) for refunds / payouts.
 *
 * Environments: SANDBOX | LIVE. A sandbox event can never satisfy a live obligation (the environment is
 * part of every provider network / link / event), and LIVE cannot be enabled by the current schema.
 */

export type ProviderEnvironment = "SANDBOX" | "LIVE";
export type ProviderKind = "PSP" | "CUSTODY" | "PAYOUT" | "MOCK";

/** Money in integer minor units of an ISO 4217 currency (exponent from currency_minor_exponent). */
export type Money = { amountMinor: bigint; currency: string };

/** Normalized provider event types (the ONLY event vocabulary the ledger accepts). */
export const NORMALIZED_EVENT_TYPES = [
  "PAYMENT_AUTHORIZED", "PAYMENT_HELD", "PAYMENT_FAILED", "PAYMENT_CANCELLED",
  "REFUND_SUBMITTED", "REFUND_CONFIRMED", "REFUND_FAILED",
  "PAYOUT_SUBMITTED", "PAYOUT_REPORTED_PAID", "PAYOUT_CONFIRMED", "PAYOUT_FAILED",
] as const;
/**
 * PAYOUT_CONFIRMED = the provider's FINAL payout success (only for providers registered PROVIDER_FINAL_STATUS).
 * PAYOUT_REPORTED_PAID = the provider reports "paid" but documents that paid can still fail (no finality).
 * The database enforces this per provider (payment_providers.payout_finality, migration 022).
 */
export type NormalizedEventType = (typeof NORMALIZED_EVENT_TYPES)[number];

/**
 * One piece of provider evidence, already normalized by the adapter. `objectRef` is the provider payment id
 * (PAYMENT_*) or the LIFE.HELP idempotency key the adapter used for the refund / payout (REFUND_* / PAYOUT_*).
 * `lifeHelpReference` is the ledger reference the adapter attached as provider metadata (checked by the ledger).
 */
export type NormalizedProviderEvent = {
  provider: string;
  environment: ProviderEnvironment;
  providerAccount: string | null;
  providerEventId: string;
  providerEventType: string;
  eventType: NormalizedEventType;
  objectRef: string;
  lifeHelpReference: string | null;
  amount: Money | null;
  occurredAt: string | null;
  sequence: number | null;
};

/**
 * PAYMENT hold semantics: an adapter reports HELD only when the provider holds the customer's funds for
 * LIFE.HELP (captured, escrow-held, provider-held - whatever that provider calls it). AUTHORIZED means
 * "in flight, not yet secured". The ledger meaning (PAID_HELD) never changes with the provider.
 */
export type ProviderPaymentStatus = "PENDING" | "AUTHORIZED" | "HELD" | "FAILED" | "CANCELLED" | "NOT_FOUND";
/** AMBIGUOUS: the provider returned more than one object for one LIFE.HELP idempotency key (never guessed). */
export type ProviderTransferStatus = "SUBMITTED" | "PENDING" | "REPORTED_PAID" | "CONFIRMED" | "FAILED" | "NOT_FOUND" | "AMBIGUOUS";

export type PaymentSessionInput = { intentId: string; reference: string; amount: Money; customerRef: string };
export type PaymentSession = { providerPaymentId: string; redirectUrl: string | null };
export type PaymentStatusResult = { status: ProviderPaymentStatus; amount: Money | null; statusVersion: string };
/** Refund / payout requests carry the LIFE.HELP idempotency key; repeating a create call must be safe. */
export type RefundInput = { idempotencyKey: string; reference: string; amount: Money; providerPaymentId: string };
export type PayoutInput = { idempotencyKey: string; reference: string; amount: Money; payeeToken: string };
/**
 * target: when the adapter reports it, the counterparty the provider object actually points at (payout:
 * the payee token / beneficiary; refund: the original provider payment). Compared with the ledger; a
 * reported-but-different (or reported-as-missing: null) target fails closed.
 */
export type TransferStatusResult = { status: ProviderTransferStatus; amount: Money | null; failureCode: string | null; fundingStatus?: string | null; target?: string | null };
/** Create result: accepted = the provider took the request (or already had it under the same idempotency key). */
export type TransferCreateResult = { accepted: boolean; code?: string | null };
/** Ledger context for a refund lookup: the provider payment the refund obligation is bound to. */
export type RefundQueryContext = { providerPaymentId: string | null };

/** Raw webhook as received: the exact body bytes (as text) are needed for signature verification. */
export type RawWebhook = { rawBody: string; headers: Record<string, string> };

export interface PaymentProviderAdapter {
  readonly code: string;
  readonly environment: ProviderEnvironment;
  readonly kind: ProviderKind;
  /**
   * How long the provider DOCUMENTS that a reused idempotency key is deduplicated on create, per object kind
   * (ms). Recovery may re-send the persisted create under the same key only inside this window (measured from
   * the persisted LIFE.HELP attempt time); outside it - or when null (undocumented) - an unobserved create goes
   * to REVIEW instead. Infinity only for a provider whose dedupe is permanent by construction (the mock).
   */
  readonly createIdempotencyWindowMs: { REFUND: number | null; PAYOUT: number | null };
  /** Hosted payment for a ledger intent (amount / currency / reference come from the ledger). */
  createPaymentSession(input: PaymentSessionInput): Promise<PaymentSession>;
  queryPayment(providerPaymentId: string): Promise<PaymentStatusResult>;
  /**
   * Verify the webhook signature with the webhook secret and normalize its events. MUST return null for
   * any invalid / missing / stale signature; MUST NOT parse or trust anything before verifying.
   */
  verifyWebhook(webhook: RawWebhook, webhookSecret: string): Promise<NormalizedProviderEvent[] | null>;
  createRefund(input: RefundInput): Promise<TransferCreateResult>;
  /**
   * Lookups are keyed by the LIFE.HELP idempotency key (recovery after an uncertain create). A refund lookup
   * also receives the ledger-bound provider payment (some providers only list refunds per payment).
   */
  queryRefund(idempotencyKey: string, context: RefundQueryContext): Promise<TransferStatusResult>;
  createHelperPayout(input: PayoutInput): Promise<TransferCreateResult>;
  createReferralPayout(input: PayoutInput): Promise<TransferCreateResult>;
  queryPayout(idempotencyKey: string): Promise<TransferStatusResult>;
}

/** Network label the ledger uses for a provider rail (quotes, intents, attempts). */
export const providerNetwork = (code: string, environment: ProviderEnvironment) => `provider:${code}:${environment}`;

/** Server-side secrets per provider: never committed, never sent to the browser, never logged. */
export const providerSecretNames = (code: string) => ({
  webhookSecret: `LIFE_HELP_PROVIDER_${code}_WEBHOOK_SECRET`,
  apiCredential: `LIFE_HELP_PROVIDER_${code}_API_KEY`,
});

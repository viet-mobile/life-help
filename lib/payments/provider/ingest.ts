import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedProviderEvent, PaymentProviderAdapter, ProviderEnvironment, RawWebhook } from "@/lib/payments/provider/contract";

/**
 * Provider evidence -> ledger. Webhooks and polls take the SAME path: a normalized event goes to the single
 * database authority ingest_provider_event (unique per provider + provider event id; monotonic; reuses
 * activate_funded_checkout / the money outbox result authority). Order of checks for a webhook:
 *   1. deployment environment configured and equal to the adapter's environment (else WRONG_ENVIRONMENT)
 *   2. webhook secret configured (else refused - never "accept unsigned")
 *   3. signature verified by the adapter over the RAW body BEFORE any parsing / business mutation
 *   4. every event names this provider + environment (else refused)
 *   5. database ingestion (the database re-checks provider registry, environment, idempotency, amounts, targets)
 */

export type IngestOutcome = { httpStatus: number; code: string; results: Array<Record<string, unknown>> };

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function recordEvent(client: SupabaseClient, event: NormalizedProviderEvent, source: "WEBHOOK" | "POLL", payloadHash: string) {
  const { data, error } = await client.rpc("ingest_provider_event", {
    p_provider: event.provider, p_environment: event.environment, p_provider_account: event.providerAccount,
    p_provider_event_id: event.providerEventId, p_source: source, p_event_type: event.eventType, p_provider_event_type: event.providerEventType,
    p_object_ref: event.objectRef, p_life_help_reference: event.lifeHelpReference,
    p_amount_minor: event.amount ? event.amount.amountMinor.toString() : null, p_currency: event.amount?.currency ?? null,
    p_occurred_at: event.occurredAt, p_provider_sequence: event.sequence, p_payload_sha256: payloadHash,
    // Set ONLY after the adapter verified the signature (webhook) or the response came from the provider's
    // authenticated API (poll). The database refuses anything else.
    p_signature_verified: true,
  });
  if (error || !data) return { success: false, code: "INGEST_FAILED" };
  return data as Record<string, unknown>;
}

export async function ingestProviderWebhook(
  client: SupabaseClient, adapter: PaymentProviderAdapter, webhook: RawWebhook,
  config: { deploymentEnvironment: ProviderEnvironment | null; webhookSecret: string | null },
): Promise<IngestOutcome> {
  if (!config.deploymentEnvironment || config.deploymentEnvironment !== adapter.environment) return { httpStatus: 403, code: "WRONG_ENVIRONMENT", results: [] };
  if (!config.webhookSecret) return { httpStatus: 503, code: "WEBHOOK_SECRET_NOT_CONFIGURED", results: [] };
  const events = await adapter.verifyWebhook(webhook, config.webhookSecret);
  if (!events) return { httpStatus: 401, code: "INVALID_SIGNATURE", results: [] };
  if (events.some((e) => e.provider !== adapter.code)) return { httpStatus: 400, code: "WRONG_PROVIDER", results: [] };
  if (events.some((e) => e.environment !== adapter.environment)) return { httpStatus: 403, code: "WRONG_ENVIRONMENT", results: [] };
  const results = [];
  for (let i = 0; i < events.length; i += 1) {
    results.push(await recordEvent(client, events[i], "WEBHOOK", await sha256Hex(`${events[i].providerEventId}\n${webhook.rawBody}`)));
  }
  return { httpStatus: 200, code: "RECEIVED", results };
}

/**
 * Poll one provider payment and feed the SAME authority. The poll event id is derived from the provider's
 * status version, so repeated polls of an unchanged status are replays, and a webhook for the same
 * transition finds the ledger already there (one financial effect).
 */
export async function reconcileProviderPayment(client: SupabaseClient, adapter: PaymentProviderAdapter, providerPaymentId: string) {
  const status = await adapter.queryPayment(providerPaymentId);
  const type = ({ HELD: "PAYMENT_HELD", AUTHORIZED: "PAYMENT_AUTHORIZED", FAILED: "PAYMENT_FAILED", CANCELLED: "PAYMENT_CANCELLED" } as const)[status.status as "HELD"];
  if (!type) return { success: true, code: `NOTHING_TO_RECORD_${status.status}` };
  const event: NormalizedProviderEvent = {
    provider: adapter.code, environment: adapter.environment, providerAccount: null,
    providerEventId: `poll:${providerPaymentId}:${status.status}:${status.statusVersion}`, providerEventType: `poll.${status.status.toLowerCase()}`,
    eventType: type, objectRef: providerPaymentId, lifeHelpReference: null, amount: status.amount, occurredAt: null, sequence: null,
  };
  return recordEvent(client, event, "POLL", await sha256Hex(JSON.stringify({ ...event, amount: status.amount ? { m: status.amount.amountMinor.toString(), c: status.amount.currency } : null })));
}

/** Open a provider-hosted payment for a checkout: ledger intent first (amount from the checkout), then the session, then the binding. */
export async function openProviderPayment(client: SupabaseClient, adapter: PaymentProviderAdapter, checkoutId: string, customerId: string, reference: string) {
  const { data: opened, error } = await client.rpc("open_provider_payment_intent", {
    p_checkout_id: checkoutId, p_customer_id: customerId, p_provider: adapter.code, p_environment: adapter.environment,
    p_provider_account: `${adapter.code}-${adapter.environment}`.toLowerCase(), p_reference: reference, p_ttl_seconds: 900,
  });
  if (error || !opened?.success) return { ok: false as const, code: String(opened?.code ?? "INTENT_FAILED") };
  const session = await adapter.createPaymentSession({
    intentId: String(opened.intent_id), reference: String(opened.reference),
    amount: { amountMinor: BigInt(String(opened.amount_minor)), currency: String(opened.currency) }, customerRef: customerId,
  });
  const { data: linked } = await client.rpc("link_provider_payment", { p_intent_id: opened.intent_id, p_provider_payment_id: session.providerPaymentId });
  if (!linked?.success) return { ok: false as const, code: String(linked?.code ?? "LINK_FAILED") };
  return { ok: true as const, intentId: String(opened.intent_id), providerPaymentId: session.providerPaymentId, redirectUrl: session.redirectUrl };
}

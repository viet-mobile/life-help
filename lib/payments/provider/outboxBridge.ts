import type { SupabaseClient } from "@supabase/supabase-js";
import { MoneyMovementError, type AttemptView, type ClaimedJob, type MoneyAdapter, type Observation, type PlannedTransfer, type PreparedTransfer } from "@/lib/payments/moneyJobs";
import { providerNetwork, type PaymentProviderAdapter } from "@/lib/payments/provider/contract";

/**
 * A provider adapter seen through the money outbox (lib/payments/moneyJobs.ts): the SAME engine, lease and
 * record_money_attempt_result authority the devnet rail uses. Polling = the outbox reconciling a job;
 * webhooks = ingest_provider_event taking the same lease. Either one confirms; never both.
 *
 *   plan     provider_transfer_target(job): amount / currency / payee / original payment - from the ledger,
 *            with the capability + compliance eligibility hook; never from a browser or the provider.
 *   prepare  the LIFE.HELP idempotency key (external id) + the exact create request, persisted BEFORE submit.
 *   submit   idempotent create call with that key (safe to repeat after a crash).
 *   observe  provider status normalized: CONFIRMED only when amount + currency equal the attempt.
 *
 * Chain vocabulary of the engine maps as: FAILED_ONCHAIN = "terminal failure at the rail"; NOT_FOUND never
 * expires for an idempotent provider (the persisted request is simply re-submitted).
 */
/** Clock-skew margin: the create-retry boundary closes this much BEFORE the provider's documented window ends. */
export const IDEMPOTENCY_WINDOW_SAFETY_MARGIN_MS = 3600 * 1000;

type Request = { kind: "REFUND" | "HELPER_PAYOUT" | "REFERRAL_PAYOUT"; amountMinor: string; currency: string; reference: string; payeeToken: string | null; providerPaymentId: string | null };

export function providerMoneyAdapter(client: SupabaseClient, provider: PaymentProviderAdapter): MoneyAdapter & { readonly asset: string } {
  let currentAsset = "UNSET";
  const request = (attempt: AttemptView): Request => JSON.parse(String(attempt.signed_payload ?? "{}"));
  return {
    provider: provider.code,
    network: providerNetwork(provider.code, provider.environment),
    get asset() { return currentAsset; },

    async plan(job: ClaimedJob): Promise<PlannedTransfer> {
      const { data, error } = await client.rpc("provider_transfer_target", { p_job_id: job.job_id, p_provider: provider.code, p_environment: provider.environment });
      if (error || !data) throw new MoneyMovementError("TARGET_UNAVAILABLE", "RETRYABLE");
      if (!data.success) {
        const code = String(data.code);
        if (code === "PAYOUT_DESTINATION_MISSING") throw new MoneyMovementError(code, "WAITING", 6 * 3600);
        throw new MoneyMovementError(code, "REVIEW");
      }
      currentAsset = String(data.currency);
      return {
        destination: String(data.payee_token ?? data.provider_payment_id), amountBaseUnits: BigInt(String(data.amount_minor)), reference: String(data.reference),
        meta: { kind: job.obligation_type === "REFUND" ? "REFUND" : job.obligation_type, payeeToken: data.payee_token ?? null, providerPaymentId: data.provider_payment_id ?? null },
      };
    },

    async search(): Promise<Array<{ externalId: string; success: boolean }>> {
      // Idempotency keys make a blind second transfer impossible: every attempt's key is persisted before
      // submit, and the provider deduplicates on it. Earlier attempts are reconciled through observe().
      return [];
    },

    async prepare(job: ClaimedJob, plan: PlannedTransfer): Promise<PreparedTransfer> {
      const externalId = `lh_${job.job_id.replace(/-/g, "")}_${job.attempt_count + 1}`;
      const req: Request = {
        kind: job.obligation_type, amountMinor: plan.amountBaseUnits.toString(), currency: currentAsset, reference: plan.reference,
        payeeToken: (plan.meta?.payeeToken as string | null) ?? null, providerPaymentId: (plan.meta?.providerPaymentId as string | null) ?? null,
      };
      return { externalId, signedPayload: JSON.stringify(req), adapterPayload: { kind: req.kind } };
    },

    async submit(attempt: AttemptView): Promise<void> {
      const req = request(attempt);
      const amount = { amountMinor: BigInt(req.amountMinor), currency: req.currency };
      const created = req.kind === "REFUND" ? await provider.createRefund({ idempotencyKey: attempt.external_id, reference: req.reference, amount, providerPaymentId: String(req.providerPaymentId) })
        : req.kind === "HELPER_PAYOUT" ? await provider.createHelperPayout({ idempotencyKey: attempt.external_id, reference: req.reference, amount, payeeToken: String(req.payeeToken) })
          : await provider.createReferralPayout({ idempotencyKey: attempt.external_id, reference: req.reference, amount, payeeToken: String(req.payeeToken) });
      if (!created.accepted) throw new MoneyMovementError(created.code ?? "PROVIDER_REJECTED_CREATE", "REVIEW");
    },

    async observe(attempt: AttemptView): Promise<Observation> {
      // Recovery is keyed ONLY by the persisted LIFE.HELP idempotency key + the persisted request (ledger);
      // no provider object id is trusted from anywhere else. NOT_FOUND -> the same request is re-submitted
      // under the same key (the engine never mints a new key for it).
      const req = request(attempt);
      const isRefund = req.kind === "REFUND";
      let status;
      try {
        status = isRefund ? await provider.queryRefund(attempt.external_id, { providerPaymentId: req.providerPaymentId }) : await provider.queryPayout(attempt.external_id);
      } catch {
        // Lookup outcome UNKNOWN (transport / 5xx / malformed / unfinished pagination): never "zero", never a create.
        throw new MoneyMovementError("PROVIDER_LOOKUP_UNKNOWN", "RETRYABLE");
      }
      if (status.status === "NOT_FOUND") {
        // The provider already reported THIS attempt paid (migration 023 evidence): its object vanishing is
        // never a reason to re-send the create - an operator decides.
        if (attempt.provider_reported_paid_at) return { kind: "MISMATCH", code: "PROVIDER_OBJECT_MISSING_AFTER_REPORTED_PAID" };
        // Re-sending the persisted create under the SAME key is only safe while the provider still dedupes that
        // key. Boundary = the provider's documented window, measured from the attempt's prepared_at (persisted, immutable,
        // written BEFORE the first create call - the earliest authoritative create time).
        // This is a create-retry safety boundary only; it never makes anything final.
        const window = provider.createIdempotencyWindowMs[isRefund ? "REFUND" : "PAYOUT"];
        if (window !== Number.POSITIVE_INFINITY) {
          if (window === null) return { kind: "MISMATCH", code: "PROVIDER_IDEMPOTENCY_WINDOW_UNDOCUMENTED" };
          const { data: row } = await client.from("money_movement_attempts").select("prepared_at").eq("id", attempt.attempt_id).maybeSingle();
          const createdAt = row?.prepared_at ? Date.parse(String(row.prepared_at)) : NaN;
          if (!Number.isFinite(createdAt)) return { kind: "MISMATCH", code: "PROVIDER_CREATE_TIME_UNKNOWN" };
          if (Date.now() - createdAt >= window - IDEMPOTENCY_WINDOW_SAFETY_MARGIN_MS) return { kind: "MISMATCH", code: "PROVIDER_IDEMPOTENCY_WINDOW_EXPIRED" };
        }
        return { kind: "NOT_FOUND", expired: false };
      }
      if (status.status === "AMBIGUOUS") return { kind: "MISMATCH", code: "PROVIDER_OBJECT_AMBIGUOUS" };
      if (status.target !== undefined && status.target !== (isRefund ? req.providerPaymentId : req.payeeToken)) return { kind: "MISMATCH", code: "PROVIDER_TARGET_MISMATCH" };
      if (status.amount && (status.amount.amountMinor.toString() !== attempt.amount_base_units || status.amount.currency !== attempt.asset)) {
        return { kind: "MISMATCH", code: "PROVIDER_AMOUNT_MISMATCH" };
      }
      if (status.status === "CONFIRMED") return status.amount ? { kind: "CONFIRMED" } : { kind: "MISMATCH", code: "PROVIDER_AMOUNT_UNREPORTED" };
      if (status.status === "REPORTED_PAID") return status.amount ? { kind: "REPORTED_PAID" } : { kind: "MISMATCH", code: "PROVIDER_AMOUNT_UNREPORTED" };
      if (status.status === "FAILED") return { kind: "FAILED_ONCHAIN", code: status.failureCode ?? "PROVIDER_REPORTED_FAILED" };
      return { kind: "PENDING" };
    },
  };
}

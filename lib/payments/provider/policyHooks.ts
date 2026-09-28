import type { Money } from "@/lib/payments/provider/contract";

/**
 * Provider-neutral policy boundaries. Nothing here invents a number:
 *   - FEES: no fee policy exists. The commercial price (price selection / customer offer) and any provider
 *     fee stay separate values; the platform fee is 0 under the explicit policy UNCONFIGURED_ZERO (the same
 *     policy name payout_obligations.fee_policy records).
 *   - FX: no production FX source is connected. The production source answers "unavailable"; it NEVER falls
 *     back to the staging test rates (LIFE_HELP_TEST_FX_RATES), which only the staging devnet rail may read.
 */

export type FeeQuote = { policy: "UNCONFIGURED_ZERO"; platformFee: Money; providerFee: Money | null; commercialAmount: Money };
export function feeQuote(commercialAmount: Money): FeeQuote {
  return { policy: "UNCONFIGURED_ZERO", platformFee: { amountMinor: BigInt(0), currency: commercialAmount.currency }, providerFee: null, commercialAmount };
}

export type FxQuoteRequest = { sourceCurrency: string; targetCurrency: string };
export type FxQuoteResult = {
  sourceCurrency: string; targetCurrency: string; rate: string; rounding: "CEIL_TO_BASE_UNIT" | "EXACT_MINOR_UNIT" | "HALF_EVEN";
  quotedAt: string; expiresAt: string; provider: string; sourceRef: string;
};
export interface FxQuoteSource {
  readonly id: string;
  quote(request: FxQuoteRequest): Promise<FxQuoteResult | null>;
}

/** Production FX: not connected. Returns null (FX_UNAVAILABLE) - never a guessed or test rate. */
export const productionFxSource: FxQuoteSource = {
  id: "PRODUCTION_FX_NOT_CONNECTED",
  async quote() { return null; },
};

/**
 * The FX source for a deployment. Only the explicit staging devnet test mode may use the test rates (and
 * that path lives in lib/payments/paymentRail.ts, gated on the staging project + LIFE_HELP_PAYMENT_MODE);
 * every other environment gets the production source, which is unconnected.
 */
export function fxSourceFor(deployment: { paymentMode: string | undefined; stagingTestSource: FxQuoteSource | null }): FxQuoteSource {
  if (deployment.paymentMode === "STAGING_DEVNET_TEST" && deployment.stagingTestSource) return deployment.stagingTestSource;
  return productionFxSource;
}

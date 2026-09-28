/**
 * Airwallex availability + onboarding hook points. NOTHING here is inferred from public documentation:
 *
 *   Commercial gate: Airwallex production capability stays disabled until LIFE.HELP holds WRITTEN commercial
 *   confirmation that the required solution (Payments for Platforms and / or a PSP-agnostic holding account)
 *   is available to the actual contracting entity. Recorded here as data; the registry never resolves the
 *   adapter while it is false. Country / acquiring / holding-period / connected-account-type availability are
 *   provider-commercial policy data too - none is hardcoded (no Korean acquiring assumption, no holding period).
 *
 *   Payout finality: Airwallex documents that a transfer can move PAID -> FAILED and documents no later final
 *   status or period; the ledger therefore registers it NO_FINAL_SIGNAL (migration 022 default) and never
 *   completes a payout on PAID. Completing Airwallex payouts needs an explicit, contractual finality decision.
 */
export const AIRWALLEX_COMMERCIAL_AVAILABILITY = Object.freeze({
  approved: false as boolean,
  basis: "NONE - awaiting written confirmation for the LIFE.HELP contracting entity",
});

export function airwallexUsable(): { usable: boolean; code: string } {
  return AIRWALLEX_COMMERCIAL_AVAILABILITY.approved ? { usable: true, code: "COMMERCIALLY_APPROVED" } : { usable: false, code: "COMMERCIAL_AVAILABILITY_UNCONFIRMED" };
}

/** Connected account / onboarding state as a provider reports it (hook shape only; no KYC rules invented). */
export type ConnectedAccountSnapshot = {
  connectedAccountId: string;
  onboardingStatus: string | null;
  capabilities: Record<string, string>;
  actionRequired: boolean; // RFI / requested information outstanding
};

/**
 * Payout eligibility hook for a connected account. Until a production compliance policy exists this is
 * deny-by-default, exactly like the ledger's money_movement_eligibility() for LIVE.
 */
export function connectedAccountPayoutEligibility(_account: ConnectedAccountSnapshot | null): { eligible: boolean; code: string } {
  return { eligible: false, code: "COMPLIANCE_POLICY_UNCONFIGURED" };
}

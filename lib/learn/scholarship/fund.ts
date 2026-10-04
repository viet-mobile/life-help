/**
 * Scholarship FUND ledger: append-only, integer minor units, aggregate.
 *
 *   CONTRIBUTION_ACCRUED  floor(paid revenue of a period * share / 10000), the share coming from the policy version
 *   AWARD_COMMITTED       money set aside for one award (cannot exceed what is available)
 *   AWARD_RELEASED        a revoked award returns its commitment to the pool
 *   PAYOUT_RECORDED       a payout was made (by the payment provider, outside this code); never more than committed, never twice
 *   ADJUSTMENT            signed correction with a named approver
 *
 * Independence from payment: contributions are computed from AGGREGATE revenue of a period. No event carries a learner, account or plan, so an
 * individual's payment cannot raise or lower anybody's award, and awards reference only an award id. This is a bookkeeping record; the movement
 * of real funds belongs to the payment provider.
 */
export type FundEvent =
  | { seq: number; kind: "CONTRIBUTION_ACCRUED"; periodId: string; paidRevenueMinor: number; basisPoints: number; amountMinor: number; policyId: string; currency: string }
  | { seq: number; kind: "AWARD_COMMITTED"; awardId: string; amountMinor: number; currency: string }
  | { seq: number; kind: "AWARD_RELEASED"; awardId: string; amountMinor: number; currency: string }
  | { seq: number; kind: "PAYOUT_RECORDED"; awardId: string; amountMinor: number; currency: string; payoutRef: string }
  | { seq: number; kind: "ADJUSTMENT"; amountMinor: number; currency: string; reason: string; approvedBy: string };

export type FundDraft = FundEvent extends infer E ? (E extends { seq: number } ? Omit<E, "seq"> : never) : never;

/** floor(paidRevenueMinor * basisPoints / 10000) in exact integer arithmetic */
export function accrue(paidRevenueMinor: number, basisPoints: number): number {
  if (!Number.isSafeInteger(paidRevenueMinor) || paidRevenueMinor < 0) throw new Error("fund: paidRevenueMinor must be a non-negative safe integer");
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) throw new Error("fund: basisPoints must be an integer 0..10000");
  return Number((BigInt(paidRevenueMinor) * BigInt(basisPoints)) / BigInt(10000));
}

export interface FundState { currency: string | null; pool: number; committed: number; paid: number; available: number; commits: Record<string, number>; paidAwards: Record<string, number> }

export function reduceFund(events: readonly FundEvent[]): FundState {
  const s: FundState = { currency: null, pool: 0, committed: 0, paid: 0, available: 0, commits: {}, paidAwards: {} };
  for (const e of events) {
    if (s.currency === null) s.currency = e.currency; else if (e.currency !== s.currency) throw new Error("fund: mixed currencies");
    if (e.kind === "CONTRIBUTION_ACCRUED" || e.kind === "ADJUSTMENT") s.pool += e.amountMinor;
    else if (e.kind === "AWARD_COMMITTED") { s.commits[e.awardId] = (s.commits[e.awardId] ?? 0) + e.amountMinor; s.committed += e.amountMinor; }
    else if (e.kind === "AWARD_RELEASED") { s.commits[e.awardId] = (s.commits[e.awardId] ?? 0) - e.amountMinor; s.committed -= e.amountMinor; }
    else { s.paidAwards[e.awardId] = (s.paidAwards[e.awardId] ?? 0) + e.amountMinor; s.paid += e.amountMinor; }
  }
  s.available = s.pool - s.committed;
  return s;
}

/** Appends one event after checking the invariants; returns the new array (the input is never modified). */
export function appendFund(events: readonly FundEvent[], draft: FundDraft): FundEvent[] {
  const state = reduceFund(events);
  const bad = (m: string): never => { throw new Error(`fund: ${m}`); };
  if (!Number.isSafeInteger(draft.amountMinor)) bad("amountMinor must be a safe integer");
  if (state.currency !== null && draft.currency !== state.currency) bad("currency mismatch");
  switch (draft.kind) {
    case "CONTRIBUTION_ACCRUED":
      if (draft.amountMinor !== accrue(draft.paidRevenueMinor, draft.basisPoints)) bad("contribution amount does not match floor(revenue * share)");
      if (events.some((e) => e.kind === "CONTRIBUTION_ACCRUED" && e.periodId === draft.periodId && e.policyId === draft.policyId)) bad("period already accrued for this policy");
      break;
    case "AWARD_COMMITTED":
      if (draft.amountMinor <= 0) bad("commitment must be positive");
      if (state.commits[draft.awardId]) bad("award already committed");
      if (draft.amountMinor > state.available) bad(`insufficient available funds (${state.available})`);
      break;
    case "AWARD_RELEASED":
      if (draft.amountMinor !== (state.commits[draft.awardId] ?? 0) || draft.amountMinor <= 0) bad("release must equal the open commitment");
      if (state.paidAwards[draft.awardId]) bad("a paid award cannot be released");
      break;
    case "PAYOUT_RECORDED":
      if (!draft.payoutRef) bad("payout needs a provider reference");
      if (draft.amountMinor !== (state.commits[draft.awardId] ?? 0) || draft.amountMinor <= 0) bad("payout must equal the committed amount");
      if (state.paidAwards[draft.awardId]) bad("award already paid");
      break;
    case "ADJUSTMENT":
      if (!draft.approvedBy || !draft.reason) bad("adjustment needs a reason and an approver");
      if (draft.amountMinor === 0) bad("adjustment cannot be zero");
      if (state.pool + draft.amountMinor < state.committed) bad("adjustment would leave commitments uncovered");
      break;
  }
  return [...events, { ...draft, seq: events.length + 1 } as FundEvent];
}

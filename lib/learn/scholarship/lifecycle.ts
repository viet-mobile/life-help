/**
 * Scholarship lifecycle: academic criteria and the payout flow are different steps with different authorities.
 *
 *   NOT_ELIGIBLE <-> ELIGIBLE -> NOMINATED -> IDENTITY_VERIFICATION -> REVIEWED -> AWARDED -> PAID
 *   any state before PAID -> REVOKED          PAID is terminal
 *
 * SYSTEM computes eligibility and nominations from verified credentials, REVIEWER verifies identity outcomes and decides, FINANCE alone records a
 * payout (the actual money movement happens at the payment provider, outside this code; here is only the record). Practice XP is not an input
 * anywhere in this file.
 */
export const SCHOLARSHIP_STATES = ["NOT_ELIGIBLE", "ELIGIBLE", "NOMINATED", "IDENTITY_VERIFICATION", "REVIEWED", "AWARDED", "PAID", "REVOKED"] as const;
export type ScholarshipState = (typeof SCHOLARSHIP_STATES)[number];
export type ScholarshipActor = "SYSTEM" | "REVIEWER" | "FINANCE";

export const SCHOLARSHIP_TRANSITIONS: Record<ScholarshipState, Partial<Record<ScholarshipState, readonly ScholarshipActor[]>>> = {
  NOT_ELIGIBLE: { ELIGIBLE: ["SYSTEM"] },
  ELIGIBLE: { NOMINATED: ["SYSTEM"], NOT_ELIGIBLE: ["SYSTEM"], REVOKED: ["REVIEWER"] },
  NOMINATED: { IDENTITY_VERIFICATION: ["SYSTEM"], NOT_ELIGIBLE: ["SYSTEM"], REVOKED: ["REVIEWER"] },
  IDENTITY_VERIFICATION: { REVIEWED: ["REVIEWER"], REVOKED: ["REVIEWER"] },
  REVIEWED: { AWARDED: ["REVIEWER"], REVOKED: ["REVIEWER"] },
  AWARDED: { PAID: ["FINANCE"], REVOKED: ["REVIEWER"] },
  PAID: {},
  REVOKED: {},
};

export interface ScholarshipAward {
  awardId: string;
  programId: string;
  policyId: string;
  /** pseudonymous subject id from the credential: never an account id, e-mail or name */
  pseudonymousSubjectId: string;
  credentialId: string;
  state: ScholarshipState;
  amountMinor: number;
  currency: string;
  identityVerified: boolean;
  payoutRef: string | null;
  history: readonly { from: ScholarshipState | null; to: ScholarshipState; at: string; actor: ScholarshipActor }[];
}

export type LifecycleError = "ILLEGAL_TRANSITION" | "ACTOR_NOT_ALLOWED" | "IDENTITY_NOT_VERIFIED" | "PAYOUT_REF_REQUIRED" | "FUNDS_NOT_COMMITTED";
export type LifecycleResult = { ok: true; award: ScholarshipAward } | { ok: false; error: LifecycleError };

export function advance(a: ScholarshipAward, to: ScholarshipState, actor: ScholarshipActor, at: string, ctx: { identityVerified?: boolean; payoutRef?: string; fundsCommitted?: boolean } = {}): LifecycleResult {
  const allowed = SCHOLARSHIP_TRANSITIONS[a.state][to];
  if (!allowed) return { ok: false, error: "ILLEGAL_TRANSITION" };
  if (!allowed.includes(actor)) return { ok: false, error: "ACTOR_NOT_ALLOWED" };
  if (to === "REVIEWED" && !ctx.identityVerified) return { ok: false, error: "IDENTITY_NOT_VERIFIED" };
  if (to === "AWARDED" && !ctx.fundsCommitted) return { ok: false, error: "FUNDS_NOT_COMMITTED" };
  if (to === "PAID" && !ctx.payoutRef) return { ok: false, error: "PAYOUT_REF_REQUIRED" };
  return { ok: true, award: { ...a, state: to, identityVerified: to === "REVIEWED" ? true : a.identityVerified, payoutRef: to === "PAID" ? ctx.payoutRef! : a.payoutRef, history: [...a.history, { from: a.state, to, at, actor }] } };
}

/** one award per (subject, program, policy period): a duplicate nomination for the same credential or subject is refused */
export function findDuplicate(existing: readonly ScholarshipAward[], candidate: { programId: string; policyId: string; pseudonymousSubjectId: string; credentialId: string }): ScholarshipAward | undefined {
  return existing.find((a) => a.state !== "REVOKED" && a.programId === candidate.programId && (a.credentialId === candidate.credentialId || (a.policyId === candidate.policyId && a.pseudonymousSubjectId === candidate.pseudonymousSubjectId)));
}

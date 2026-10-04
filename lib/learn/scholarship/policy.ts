/**
 * Scholarship policy (versioned, immutable) and eligibility.
 *
 * Principles fixed by the types:
 *  - achievement only: the eligibility input is a CERTIFIED credential (see lib/learn/certification). It has no field for the plan, for any payment
 *    amount, or for practice XP, so none of them can influence the outcome. Free learners are eligible on the same terms as paying ones.
 *  - not a lottery: ranking is deterministic from achievement (level, score band, earlier issue date, then id); there is no random draw.
 *  - the fund share is a POLICY value in basis points (0..10000) chosen per policy version, never a constant in code.
 *  - a policy version is immutable; a change is a new version whose hash is recorded in the transparency ledger.
 */
import { canonicalize } from "../transparency/canonical";
import { DOMAINS, domainMessage, sha256Hex } from "../transparency/crypto";

export interface ScholarshipProgram { programId: string; name: string; status: "DRAFT" | "ACTIVE" | "CLOSED" }

export type AwardRule =
  | { kind: "THRESHOLD"; /** every eligible candidate at or above this ladder level is awarded while funds last (ranked order) */ minLevel: number }
  | { kind: "TOP_N"; n: number };

export interface ScholarshipPolicyVersion {
  policyId: string;
  programId: string;
  version: number;
  supersedes: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  /** share of PAID REVENUE (aggregate, per period) that is added to the fund, in basis points: 100 = 1 % */
  fundShareBasisPoints: number;
  eligibility: { minAchievementLevel: number; products: readonly ("SCHOOL" | "ADULT_LANGUAGE")[]; subjectsOrLanguages: readonly string[]; periodStart: string; periodEnd: string };
  award: { rule: AwardRule; amountMinorPerAward: number; currency: string };
}

export function validatePolicy(p: ScholarshipPolicyVersion): void {
  const bad = (m: string): never => { throw new Error(`scholarship policy: ${m}`); };
  if (!Number.isInteger(p.fundShareBasisPoints) || p.fundShareBasisPoints < 0 || p.fundShareBasisPoints > 10000) bad("fundShareBasisPoints must be an integer 0..10000");
  if (!Number.isInteger(p.version) || p.version < 1) bad("version must be a positive integer");
  if (p.version > 1 && !p.supersedes) bad("version > 1 must name the policy it supersedes");
  if (!Number.isInteger(p.eligibility.minAchievementLevel) || p.eligibility.minAchievementLevel < 1 || p.eligibility.minAchievementLevel > 10) bad("minAchievementLevel 1..10");
  if (Date.parse(p.eligibility.periodEnd) <= Date.parse(p.eligibility.periodStart)) bad("periodEnd must be after periodStart");
  if (!p.eligibility.products.length) bad("at least one product");
  if (!Number.isSafeInteger(p.award.amountMinorPerAward) || p.award.amountMinorPerAward <= 0) bad("amountMinorPerAward must be a positive integer in minor units");
  if (!/^[A-Z]{3}$/.test(p.award.currency)) bad("currency must be an ISO-4217 code");
  if (p.award.rule.kind === "TOP_N" && (!Number.isInteger(p.award.rule.n) || p.award.rule.n < 1)) bad("TOP_N needs n >= 1");
  if (p.award.rule.kind === "THRESHOLD" && (!Number.isInteger(p.award.rule.minLevel) || p.award.rule.minLevel < 1 || p.award.rule.minLevel > 10)) bad("THRESHOLD minLevel 1..10");
}

export const policyHash = (p: ScholarshipPolicyVersion) => sha256Hex(domainMessage(DOMAINS.policy, canonicalize(p)));

/** What eligibility is allowed to know. NOTE what is absent: plan, payments, XP, anything about money. */
export interface EligibilityInput {
  pseudonymousSubjectId: string;
  credential: { credentialId: string; product: "SCHOOL" | "ADULT_LANGUAGE"; subjectOrTargetLanguage: string; achievementLevel: number; scoreBand: string; issuedAt: string; /** derived from the ledger, true only if signed, verified and not revoked */ certifiedAndValid: boolean };
}
export type IneligibleReason = "CREDENTIAL_NOT_VALID" | "LEVEL_TOO_LOW" | "PRODUCT_NOT_COVERED" | "SUBJECT_NOT_COVERED" | "OUTSIDE_PERIOD";
export type EligibilityResult = { eligible: true } | { eligible: false; reasons: IneligibleReason[] };

export function evaluateEligibility(input: EligibilityInput, policy: ScholarshipPolicyVersion): EligibilityResult {
  const c = input.credential, e = policy.eligibility, reasons: IneligibleReason[] = [];
  if (!c.certifiedAndValid) reasons.push("CREDENTIAL_NOT_VALID");
  if (c.achievementLevel < e.minAchievementLevel) reasons.push("LEVEL_TOO_LOW");
  if (!e.products.includes(c.product)) reasons.push("PRODUCT_NOT_COVERED");
  if (e.subjectsOrLanguages.length && !e.subjectsOrLanguages.includes(c.subjectOrTargetLanguage)) reasons.push("SUBJECT_NOT_COVERED");
  const t = Date.parse(c.issuedAt);
  if (!(t >= Date.parse(e.periodStart) && t < Date.parse(e.periodEnd))) reasons.push("OUTSIDE_PERIOD");
  return reasons.length ? { eligible: false, reasons } : { eligible: true };
}

const bandLow = (band: string) => Number(band.split("-")[0]);

/** Deterministic ranking by achievement only: level desc, score band desc, earlier issue first, then id. No randomness anywhere. */
export function rankCandidates<T extends EligibilityInput>(candidates: readonly T[], policy: ScholarshipPolicyVersion): T[] {
  return candidates
    .filter((c) => evaluateEligibility(c, policy).eligible)
    .sort((a, b) =>
      b.credential.achievementLevel - a.credential.achievementLevel ||
      bandLow(b.credential.scoreBand) - bandLow(a.credential.scoreBand) ||
      Date.parse(a.credential.issuedAt) - Date.parse(b.credential.issuedAt) ||
      (a.pseudonymousSubjectId < b.pseudonymousSubjectId ? -1 : a.pseudonymousSubjectId > b.pseudonymousSubjectId ? 1 : 0));
}

/** The ranked candidates that the award rule selects (the fund may allow fewer; see fund.ts). */
export function selectAwardees<T extends EligibilityInput>(candidates: readonly T[], policy: ScholarshipPolicyVersion): T[] {
  const ranked = rankCandidates(candidates, policy);
  const r = policy.award.rule;
  return r.kind === "TOP_N" ? ranked.slice(0, r.n) : ranked.filter((c) => c.credential.achievementLevel >= r.minLevel);
}

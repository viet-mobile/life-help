import { describe, expect, it } from "vitest";
import { evaluateEligibility, policyHash, rankCandidates, selectAwardees, validatePolicy, type EligibilityInput, type ScholarshipPolicyVersion } from "@/lib/learn/scholarship/policy";
import { SCHOLARSHIP_STATES, SCHOLARSHIP_TRANSITIONS, advance, findDuplicate, type ScholarshipAward } from "@/lib/learn/scholarship/lifecycle";
import { accrue, appendFund, reduceFund, type FundEvent } from "@/lib/learn/scholarship/fund";

const POLICY: ScholarshipPolicyVersion = {
  policyId: "pol-1", programId: "prog-1", version: 1, supersedes: null, effectiveFrom: "2030-01-01T00:00:00Z", effectiveUntil: null,
  fundShareBasisPoints: 250,
  eligibility: { minAchievementLevel: 5, products: ["SCHOOL", "ADULT_LANGUAGE"], subjectsOrLanguages: [], periodStart: "2030-01-01T00:00:00Z", periodEnd: "2031-01-01T00:00:00Z" },
  award: { rule: { kind: "TOP_N", n: 2 }, amountMinorPerAward: 100_000, currency: "USD" },
};
const cand = (id: string, level: number, band: string, issuedAt = "2030-06-01T00:00:00Z", over: Partial<EligibilityInput["credential"]> = {}): EligibilityInput => ({
  pseudonymousSubjectId: id, credential: { credentialId: `cred-${id}`, product: "SCHOOL", subjectOrTargetLanguage: "math", achievementLevel: level, scoreBand: band, issuedAt, certifiedAndValid: true, ...over },
});
const award = (state: ScholarshipAward["state"] = "ELIGIBLE", over: Partial<ScholarshipAward> = {}): ScholarshipAward => ({ awardId: "aw-1", programId: "prog-1", policyId: "pol-1", pseudonymousSubjectId: "p1", credentialId: "cred-p1", state, amountMinor: 100_000, currency: "USD", identityVerified: false, payoutRef: null, history: [], ...over });

describe("scholarship policy", () => {
  it("keeps the fund share as a validated policy value in basis points, never a constant", () => {
    expect(() => validatePolicy(POLICY)).not.toThrow();
    for (const bp of [-1, 10001, 2.5, NaN]) expect(() => validatePolicy({ ...POLICY, fundShareBasisPoints: bp })).toThrow(/basis/i);
    expect(accrue(1_000_000, 250)).toBe(25_000);
    expect(accrue(1_000_000, 500)).toBe(50_000);
    expect(accrue(1_000_000, 0)).toBe(0);
  });
  it("validates versions, periods, amounts and rules", () => {
    expect(() => validatePolicy({ ...POLICY, version: 2, supersedes: null })).toThrow(/supersedes/);
    expect(() => validatePolicy({ ...POLICY, eligibility: { ...POLICY.eligibility, periodEnd: POLICY.eligibility.periodStart } })).toThrow(/periodEnd/);
    expect(() => validatePolicy({ ...POLICY, award: { ...POLICY.award, amountMinorPerAward: 10.5 } })).toThrow(/minor units/);
    expect(() => validatePolicy({ ...POLICY, award: { ...POLICY.award, currency: "usd" } })).toThrow(/ISO-4217/);
    expect(() => validatePolicy({ ...POLICY, award: { ...POLICY.award, rule: { kind: "TOP_N", n: 0 } } })).toThrow();
  });
  it("is immutable by hash: any change is a different version with a different hash", async () => {
    const h = await policyHash(POLICY);
    expect(h).toBe(await policyHash({ ...POLICY }));
    expect(h).not.toBe(await policyHash({ ...POLICY, fundShareBasisPoints: 251 }));
    expect(h).not.toBe(await policyHash({ ...POLICY, award: { ...POLICY.award, amountMinorPerAward: 100_001 } }));
    expect(h).not.toBe(await policyHash({ ...POLICY, eligibility: { ...POLICY.eligibility, minAchievementLevel: 6 } }));
  });
});

describe("eligibility depends on achievement only", () => {
  it("accepts a valid certified credential and gives reasons otherwise", () => {
    expect(evaluateEligibility(cand("a", 6, "80-89"), POLICY)).toEqual({ eligible: true });
    expect(evaluateEligibility(cand("a", 4, "80-89"), POLICY)).toEqual({ eligible: false, reasons: ["LEVEL_TOO_LOW"] });
    expect(evaluateEligibility(cand("a", 6, "80-89", undefined, { certifiedAndValid: false }), POLICY)).toEqual({ eligible: false, reasons: ["CREDENTIAL_NOT_VALID"] });
    expect(evaluateEligibility(cand("a", 6, "80-89", "2029-12-31T23:59:59Z"), POLICY)).toEqual({ eligible: false, reasons: ["OUTSIDE_PERIOD"] });
    expect(evaluateEligibility(cand("a", 6, "80-89", "2031-01-01T00:00:00Z"), POLICY)).toEqual({ eligible: false, reasons: ["OUTSIDE_PERIOD"] });
    expect(evaluateEligibility(cand("a", 6, "80-89"), { ...POLICY, eligibility: { ...POLICY.eligibility, products: ["ADULT_LANGUAGE"] } })).toMatchObject({ eligible: false });
    expect(evaluateEligibility(cand("a", 6, "80-89"), { ...POLICY, eligibility: { ...POLICY.eligibility, subjectsOrLanguages: ["english"] } })).toMatchObject({ eligible: false });
  });
  it("is blind to plan, payment and practice XP: extra inputs change nothing, free learners qualify on equal terms", () => {
    const plain = cand("free-learner", 7, "90-99");
    const noisy = { ...plain, plan: "INSTITUTION", paidTotalMinor: 9_999_999, practiceXp: 1_000_000, isPaying: true } as unknown as EligibilityInput;
    expect(evaluateEligibility(noisy, POLICY)).toEqual(evaluateEligibility(plain, POLICY));
    expect(Object.keys(plain).sort()).toEqual(["credential", "pseudonymousSubjectId"]);
    expect(Object.keys(plain.credential).join()).not.toMatch(/plan|paid|payment|xp|price/i);
  });
  it("ranks by achievement deterministically with no randomness and no payment input", () => {
    const list = [cand("c", 6, "70-79"), cand("a", 8, "80-89"), cand("b", 8, "90-99"), cand("d", 8, "90-99", "2030-05-01T00:00:00Z"), cand("e", 3, "99-100")];
    const ranked = rankCandidates(list, POLICY).map((c) => c.pseudonymousSubjectId);
    expect(ranked).toEqual(["d", "b", "a", "c"]);
    expect(rankCandidates([...list].reverse(), POLICY).map((c) => c.pseudonymousSubjectId)).toEqual(ranked);
    for (let i = 0; i < 20; i++) expect(rankCandidates(list, POLICY).map((c) => c.pseudonymousSubjectId)).toEqual(ranked);
    expect(selectAwardees(list, POLICY).map((c) => c.pseudonymousSubjectId)).toEqual(["d", "b"]);
    expect(selectAwardees(list, { ...POLICY, award: { ...POLICY.award, rule: { kind: "THRESHOLD", minLevel: 7 } } }).map((c) => c.pseudonymousSubjectId)).toEqual(["d", "b", "a"]);
    expect(rankCandidates([cand("z", 6, "80-89"), cand("y", 6, "80-89")], POLICY).map((c) => c.pseudonymousSubjectId)).toEqual(["y", "z"]);
  });
});

describe("lifecycle: academic criteria and payout are separate authorities", () => {
  const AT = "2030-07-01T00:00:00Z";
  it("follows the documented path with the documented actors", () => {
    let a = award("NOT_ELIGIBLE");
    const step = (to: ScholarshipAward["state"], actor: Parameters<typeof advance>[2], ctx = {}) => { const r = advance(a, to, actor, AT, ctx); if (!r.ok) throw new Error(`${a.state}->${to}: ${r.error}`); a = r.award; };
    step("ELIGIBLE", "SYSTEM"); step("NOMINATED", "SYSTEM"); step("IDENTITY_VERIFICATION", "SYSTEM");
    step("REVIEWED", "REVIEWER", { identityVerified: true }); step("AWARDED", "REVIEWER", { fundsCommitted: true }); step("PAID", "FINANCE", { payoutRef: "prov-1" });
    expect(a).toMatchObject({ state: "PAID", identityVerified: true, payoutRef: "prov-1" });
    expect(a.history.map((h) => h.to)).toEqual(["ELIGIBLE", "NOMINATED", "IDENTITY_VERIFICATION", "REVIEWED", "AWARDED", "PAID"]);
  });
  it("nobody but FINANCE records a payout; nobody but a reviewer awards; the learner has no actor at all", () => {
    expect(advance(award("AWARDED"), "PAID", "REVIEWER", AT, { payoutRef: "p" })).toEqual({ ok: false, error: "ACTOR_NOT_ALLOWED" });
    expect(advance(award("AWARDED"), "PAID", "SYSTEM", AT, { payoutRef: "p" })).toEqual({ ok: false, error: "ACTOR_NOT_ALLOWED" });
    expect(advance(award("REVIEWED"), "AWARDED", "SYSTEM", AT, { fundsCommitted: true })).toEqual({ ok: false, error: "ACTOR_NOT_ALLOWED" });
    expect(advance(award("AWARDED"), "PAID", "FINANCE", AT)).toEqual({ ok: false, error: "PAYOUT_REF_REQUIRED" });
    expect(["LEARNER", "CANDIDATE", "CLIENT"].some((x) => Object.values(SCHOLARSHIP_TRANSITIONS).some((m) => Object.values(m).some((acts) => (acts as readonly string[]).includes(x))))).toBe(false);
  });
  it("cannot skip steps: no award without identity verification, review or committed funds; practice XP is not an input", () => {
    expect(advance(award("IDENTITY_VERIFICATION"), "REVIEWED", "REVIEWER", AT)).toEqual({ ok: false, error: "IDENTITY_NOT_VERIFIED" });
    expect(advance(award("REVIEWED"), "AWARDED", "REVIEWER", AT)).toEqual({ ok: false, error: "FUNDS_NOT_COMMITTED" });
    for (const to of ["REVIEWED", "AWARDED", "PAID"] as const) expect(advance(award("ELIGIBLE"), to, "REVIEWER", AT, { identityVerified: true, fundsCommitted: true, payoutRef: "p" })).toEqual({ ok: false, error: "ILLEGAL_TRANSITION" });
    expect(advance(award("NOT_ELIGIBLE"), "AWARDED", "REVIEWER", AT, { fundsCommitted: true, practiceXp: 10_000 } as never)).toEqual({ ok: false, error: "ILLEGAL_TRANSITION" });
  });
  it("can be revoked before payout; PAID and REVOKED are terminal", () => {
    for (const s of ["ELIGIBLE", "NOMINATED", "IDENTITY_VERIFICATION", "REVIEWED", "AWARDED"] as const) expect(advance(award(s), "REVOKED", "REVIEWER", AT).ok, s).toBe(true);
    for (const s of ["PAID", "REVOKED"] as const) for (const to of SCHOLARSHIP_STATES) for (const actor of ["SYSTEM", "REVIEWER", "FINANCE"] as const) expect(advance(award(s), to, actor, AT, { identityVerified: true, fundsCommitted: true, payoutRef: "p" }).ok).toBe(false);
  });
  it("refuses a duplicate award for the same credential or the same subject in a policy period", () => {
    const existing = [award("NOMINATED")];
    expect(findDuplicate(existing, { programId: "prog-1", policyId: "pol-1", pseudonymousSubjectId: "p1", credentialId: "cred-other" })).toBeDefined();
    expect(findDuplicate(existing, { programId: "prog-1", policyId: "pol-1", pseudonymousSubjectId: "p2", credentialId: "cred-p1" })).toBeDefined();
    expect(findDuplicate(existing, { programId: "prog-1", policyId: "pol-2", pseudonymousSubjectId: "p1", credentialId: "cred-new" })).toBeUndefined();
    expect(findDuplicate([award("REVOKED")], { programId: "prog-1", policyId: "pol-1", pseudonymousSubjectId: "p1", credentialId: "cred-p1" })).toBeUndefined();
  });
});

describe("fund ledger", () => {
  const accrued = (rev: number, bp = 250, period = "2030-Q1"): FundEvent[] => appendFund([], { kind: "CONTRIBUTION_ACCRUED", periodId: period, paidRevenueMinor: rev, basisPoints: bp, amountMinor: accrue(rev, bp), policyId: "pol-1", currency: "USD" });
  it("accrues floor(revenue * share) in exact integer arithmetic, also for very large revenue", () => {
    expect(accrue(999, 250)).toBe(24);
    expect(accrue(Number.MAX_SAFE_INTEGER, 10000)).toBe(Number.MAX_SAFE_INTEGER);
    expect(accrue(Number.MAX_SAFE_INTEGER, 1)).toBe(Math.floor(Number.MAX_SAFE_INTEGER / 10000));
    expect(() => accrue(-1, 100)).toThrow();
    expect(() => accrue(1.5, 100)).toThrow();
    expect(() => accrue(1000, 10001)).toThrow();
  });
  it("rejects a contribution whose amount does not match the formula, and accruing a period twice", () => {
    expect(() => appendFund([], { kind: "CONTRIBUTION_ACCRUED", periodId: "p", paidRevenueMinor: 1000, basisPoints: 250, amountMinor: 26, policyId: "pol-1", currency: "USD" })).toThrow(/does not match/);
    expect(() => appendFund(accrued(1_000_000), { kind: "CONTRIBUTION_ACCRUED", periodId: "2030-Q1", paidRevenueMinor: 1, basisPoints: 250, amountMinor: 0, policyId: "pol-1", currency: "USD" })).toThrow(/already accrued/);
  });
  it("commits within the available balance only, pays exactly what was committed, and never twice", () => {
    let ev = accrued(1_000_000); // 25_000
    expect(reduceFund(ev).available).toBe(25_000);
    expect(() => appendFund(ev, { kind: "AWARD_COMMITTED", awardId: "aw-1", amountMinor: 25_001, currency: "USD" })).toThrow(/insufficient/);
    ev = appendFund(ev, { kind: "AWARD_COMMITTED", awardId: "aw-1", amountMinor: 20_000, currency: "USD" });
    expect(reduceFund(ev)).toMatchObject({ pool: 25_000, committed: 20_000, available: 5_000, paid: 0 });
    expect(() => appendFund(ev, { kind: "AWARD_COMMITTED", awardId: "aw-1", amountMinor: 1, currency: "USD" })).toThrow(/already committed/);
    expect(() => appendFund(ev, { kind: "AWARD_COMMITTED", awardId: "aw-2", amountMinor: 5_001, currency: "USD" })).toThrow(/insufficient/);
    expect(() => appendFund(ev, { kind: "PAYOUT_RECORDED", awardId: "aw-1", amountMinor: 19_999, currency: "USD", payoutRef: "p" })).toThrow(/committed amount/);
    expect(() => appendFund(ev, { kind: "PAYOUT_RECORDED", awardId: "aw-9", amountMinor: 1, currency: "USD", payoutRef: "p" })).toThrow();
    expect(() => appendFund(ev, { kind: "PAYOUT_RECORDED", awardId: "aw-1", amountMinor: 20_000, currency: "USD", payoutRef: "" })).toThrow(/reference/);
    ev = appendFund(ev, { kind: "PAYOUT_RECORDED", awardId: "aw-1", amountMinor: 20_000, currency: "USD", payoutRef: "prov-1" });
    expect(reduceFund(ev)).toMatchObject({ paid: 20_000, committed: 20_000, available: 5_000 });
    expect(() => appendFund(ev, { kind: "PAYOUT_RECORDED", awardId: "aw-1", amountMinor: 20_000, currency: "USD", payoutRef: "prov-2" })).toThrow(/already paid/);
    expect(() => appendFund(ev, { kind: "AWARD_RELEASED", awardId: "aw-1", amountMinor: 20_000, currency: "USD" })).toThrow(/paid/);
  });
  it("releases the commitment of a revoked award back to the pool, exactly once", () => {
    let ev = appendFund(accrued(1_000_000), { kind: "AWARD_COMMITTED", awardId: "aw-1", amountMinor: 20_000, currency: "USD" });
    expect(() => appendFund(ev, { kind: "AWARD_RELEASED", awardId: "aw-1", amountMinor: 19_000, currency: "USD" })).toThrow(/open commitment/);
    ev = appendFund(ev, { kind: "AWARD_RELEASED", awardId: "aw-1", amountMinor: 20_000, currency: "USD" });
    expect(reduceFund(ev).available).toBe(25_000);
    expect(() => appendFund(ev, { kind: "AWARD_RELEASED", awardId: "aw-1", amountMinor: 20_000, currency: "USD" })).toThrow();
  });
  it("adjustments need a reason and an approver and cannot leave commitments uncovered", () => {
    const ev = appendFund(accrued(1_000_000), { kind: "AWARD_COMMITTED", awardId: "aw-1", amountMinor: 20_000, currency: "USD" });
    expect(() => appendFund(ev, { kind: "ADJUSTMENT", amountMinor: -6_000, currency: "USD", reason: "correction", approvedBy: "finance-lead" })).toThrow(/uncovered/);
    expect(() => appendFund(ev, { kind: "ADJUSTMENT", amountMinor: 100, currency: "USD", reason: "", approvedBy: "x" })).toThrow();
    expect(reduceFund(appendFund(ev, { kind: "ADJUSTMENT", amountMinor: -5_000, currency: "USD", reason: "correction", approvedBy: "finance-lead" })).available).toBe(0);
  });
  it("is append-only (the input array is never modified), single currency, and carries no learner, account or plan", () => {
    const before = accrued(1_000_000), snapshot = JSON.stringify(before);
    const after = appendFund(before, { kind: "AWARD_COMMITTED", awardId: "aw-1", amountMinor: 1, currency: "USD" });
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(after.map((e) => e.seq)).toEqual([1, 2]);
    expect(() => appendFund(before, { kind: "AWARD_COMMITTED", awardId: "aw-2", amountMinor: 1, currency: "EUR" })).toThrow(/currency/);
    expect(JSON.stringify(after)).not.toMatch(/learner|account|email|plan|pseudonym|subject/i);
  });
});

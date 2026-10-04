import { describe, expect, it } from "vitest";
import { CAPABILITIES, PLANS, PLAN_CAPABILITIES, activeGrants, assertCapability, capabilitiesOf, hasCapability, validateEntitlementEvent, EntitlementError, type EntitlementEvent } from "@/lib/learn/products/entitlement";
import { ATTEMPT_STATES, TRANSITIONS, isTerminal, transition, type Actor, type Attempt } from "@/lib/learn/certification/state";
import { beginAttempt, finalizeScore, grantEligibility, reviewIntegrity, revokeCertification, scoreAttempt, submitAttempt, type CertificationPolicy } from "@/lib/learn/certification/attempt";
import { selectItems, signManifest, verifyManifest, type AssessmentManifest } from "@/lib/learn/certification/manifest";
import { generateSigner } from "@/lib/learn/transparency/crypto";

const T0 = "2030-03-01T00:00:00Z";
const at = (s: number) => new Date(Date.parse(T0) + s * 1000).toISOString();
const POLICY: CertificationPolicy = { version: "cert-1", maxAttempts: 3, cooldownSec: 3600, windowSec: 3600, minPlausibleSec: 120, passMark: 70 };
const grant = (over: Partial<Extract<EntitlementEvent, { kind: "GRANT" }>> = {}): EntitlementEvent => ({ seq: 1, kind: "GRANT", grantId: "g1", accountId: "acc-1", plan: "CERTIFICATION", source: "PAYMENT", externalRef: "provider-ref-1", validFrom: T0, validUntil: null, ...over });
const NONCE = "n".repeat(32);

describe("entitlement ledger", () => {
  it("everybody has FREE practice and nothing else without a grant", () => {
    expect([...capabilitiesOf([], "acc-1", T0)]).toEqual(["PRACTICE"]);
    expect(hasCapability([], "acc-1", "CERTIFICATION_ATTEMPT", T0)).toBe(false);
    expect(() => assertCapability([], "acc-1", "CERTIFICATION_ATTEMPT", T0)).toThrow(EntitlementError);
  });
  it("plans are cumulative and only INSTITUTION holds the roster capability", () => {
    expect(PLANS).toEqual(["FREE", "PLUS", "CERTIFICATION", "INSTITUTION"]);
    for (let i = 1; i < PLANS.length; i++) for (const c of PLAN_CAPABILITIES[PLANS[i - 1]]) expect(PLAN_CAPABILITIES[PLANS[i]]).toContain(c);
    expect(CAPABILITIES.filter((c) => PLAN_CAPABILITIES.CERTIFICATION.includes(c) && c === "INSTITUTION_ROSTER")).toEqual([]);
    expect(hasCapability([grant({ plan: "PLUS" })], "acc-1", "ADAPTIVE_PRACTICE", T0)).toBe(true);
    expect(hasCapability([grant({ plan: "PLUS" })], "acc-1", "CERTIFICATION_ATTEMPT", T0)).toBe(false);
    expect(hasCapability([grant({ plan: "INSTITUTION", source: "INSTITUTION" })], "acc-1", "INSTITUTION_ROSTER", T0)).toBe(true);
  });
  it("respects validity windows, revocation and other accounts", () => {
    const ev = [grant({ validFrom: at(100), validUntil: at(1000) })];
    expect(hasCapability(ev, "acc-1", "CERTIFICATION_ATTEMPT", at(50))).toBe(false);
    expect(hasCapability(ev, "acc-1", "CERTIFICATION_ATTEMPT", at(500))).toBe(true);
    expect(hasCapability(ev, "acc-1", "CERTIFICATION_ATTEMPT", at(1000))).toBe(false);
    expect(hasCapability(ev, "acc-2", "CERTIFICATION_ATTEMPT", at(500))).toBe(false);
    const revoked: EntitlementEvent[] = [...ev, { seq: 2, kind: "REVOKE", grantId: "g1", accountId: "acc-1", at: at(300), reason: "refund" }];
    expect(hasCapability(revoked, "acc-1", "CERTIFICATION_ATTEMPT", at(200))).toBe(true);
    expect(hasCapability(revoked, "acc-1", "CERTIFICATION_ATTEMPT", at(400))).toBe(false);
    expect(activeGrants(revoked, "acc-1", at(400))).toHaveLength(0);
  });
  it("a free learner reaches certification through a scholarship waiver without any payment", () => {
    const waiver = grant({ source: "SCHOLARSHIP_WAIVER", externalRef: "waiver-2030-01" });
    expect(hasCapability([waiver], "acc-1", "CERTIFICATION_ATTEMPT", T0)).toBe(true);
    expect(JSON.stringify(waiver)).not.toMatch(/PAYMENT/);
  });
  it("validates events: a grant needs a reference, FREE is never granted, windows must be ordered", () => {
    expect(() => validateEntitlementEvent(grant({ externalRef: "" }))).toThrow(/external reference/);
    expect(() => validateEntitlementEvent(grant({ plan: "FREE" }))).toThrow(/never granted/);
    expect(() => validateEntitlementEvent(grant({ validUntil: T0 }))).toThrow(/after validFrom/);
    expect(() => validateEntitlementEvent(grant())).not.toThrow();
  });
  it("has no entry point that takes a client-supplied plan or paid flag", () => {
    for (const fn of [capabilitiesOf, hasCapability, assertCapability, activeGrants]) expect(fn.length).toBeGreaterThanOrEqual(3);
    // the only inputs are the server-held event list, an account id, (a capability) and a time
    expect((hasCapability as (...a: unknown[]) => boolean)([], "acc-1", "CERTIFICATION_ATTEMPT", T0, { isPaid: true })).toBe(false);
  });
});

describe("certification state machine and authority", () => {
  const base: Attempt = { attemptId: "a1", accountId: "acc-1", manifestHash: "h".repeat(64), state: "ELIGIBLE", attemptNo: 1, nonceHash: null, startedAt: null, expiresAt: null, submittedAt: null, score: null, result: null, integrityFlags: [], history: [] };
  const ACTORS: Actor[] = ["LEARNER", "SERVER", "REVIEWER"];
  it("the transition table is exactly the documented machine", () => {
    expect(ATTEMPT_STATES).toEqual(["ELIGIBLE", "STARTED", "SUBMITTED", "SCORED", "INTEGRITY_REVIEW", "CERTIFIED", "REVOKED", "EXPIRED"]);
    expect(Object.keys(TRANSITIONS.SCORED).sort()).toEqual(["CERTIFIED", "INTEGRITY_REVIEW"]);
    expect(isTerminal("REVOKED") && isTerminal("EXPIRED") && !isTerminal("CERTIFIED")).toBe(true);
  });
  it("a learner (the browser) can never score, certify, review or revoke: no state accepts LEARNER except start and submit", () => {
    for (const from of ATTEMPT_STATES) for (const to of ATTEMPT_STATES) {
      const r = transition({ ...base, state: from }, to, "LEARNER", T0);
      const allowed = (from === "ELIGIBLE" && to === "STARTED") || (from === "STARTED" && to === "SUBMITTED");
      expect(r.ok, `${from}->${to}`).toBe(allowed);
    }
    expect(transition({ ...base, state: "SUBMITTED" }, "CERTIFIED", "LEARNER", T0)).toEqual({ ok: false, error: "ILLEGAL_TRANSITION" });
    expect(transition({ ...base, state: "SCORED" }, "CERTIFIED", "LEARNER", T0)).toEqual({ ok: false, error: "ACTOR_NOT_ALLOWED" });
  });
  it("only a reviewer clears an integrity review; terminal states accept nobody", () => {
    expect(transition({ ...base, state: "INTEGRITY_REVIEW" }, "CERTIFIED", "SERVER", T0)).toEqual({ ok: false, error: "ACTOR_NOT_ALLOWED" });
    expect(transition({ ...base, state: "INTEGRITY_REVIEW" }, "CERTIFIED", "REVIEWER", T0).ok).toBe(true);
    for (const s of ["REVOKED", "EXPIRED"] as const) for (const to of ATTEMPT_STATES) for (const a of ACTORS) expect(transition({ ...base, state: s }, to, a, T0).ok).toBe(false);
  });
  it("records every transition in the history without mutating the input", () => {
    const r = transition(base, "STARTED", "SERVER", T0);
    if (!r.ok) throw new Error("x");
    expect(base.state).toBe("ELIGIBLE");
    expect(r.attempt.history).toEqual([{ from: "ELIGIBLE", to: "STARTED", at: T0, actor: "SERVER" }]);
  });
});

describe("attempt lifecycle on the server", () => {
  const paid = [grant()];
  const eligible = (over: Partial<Parameters<typeof grantEligibility>[0]> = {}) => grantEligibility({ policy: POLICY, events: paid, accountId: "acc-1", prior: [], manifestHash: "h".repeat(64), attemptId: "a1", now: T0, ...over });
  const must = <T extends { ok: boolean }>(r: T) => { if (!r.ok) throw new Error(JSON.stringify(r)); return r as Extract<T, { ok: true }>; };
  const started = async () => beginAttempt(must(eligible()).attempt, POLICY, NONCE, at(10));

  it("requires the server entitlement; a learner without it never gets an attempt", () => {
    expect(eligible({ events: [] })).toEqual({ ok: false, error: "NOT_ENTITLED" });
    expect(eligible({ events: [grant({ plan: "PLUS" })] })).toEqual({ ok: false, error: "NOT_ENTITLED" });
    expect(eligible({ events: [grant({ source: "SCHOLARSHIP_WAIVER", externalRef: "w1" })] }).ok).toBe(true);
  });
  it("enforces one open sitting, the attempt limit and the cooldown", async () => {
    const a1 = must(eligible()).attempt;
    expect(eligible({ prior: [a1], attemptId: "a2" })).toEqual({ ok: false, error: "ACTIVE_ATTEMPT_EXISTS" });
    const done = (n: number, submittedAt: string): Attempt => ({ ...a1, attemptId: `d${n}`, attemptNo: n, state: "SCORED", startedAt: submittedAt, submittedAt });
    expect(eligible({ prior: [done(1, at(-100))], now: T0 })).toEqual({ ok: false, error: "COOLDOWN" });
    expect(must(eligible({ prior: [done(1, at(-7200))] })).attempt.attemptNo).toBe(2);
    expect(eligible({ prior: [done(1, at(-9000)), done(2, at(-8000)), done(3, at(-7200))] })).toEqual({ ok: false, error: "ATTEMPT_LIMIT" });
  });
  it("binds a one-time nonce (only its hash is stored) and a time window", async () => {
    const a = await started();
    expect(a.state).toBe("STARTED");
    expect(a.nonceHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(a)).not.toContain(NONCE);
    expect(a.expiresAt).toBe(at(10 + POLICY.windowSec));
    await expect(beginAttempt(must(eligible()).attempt, POLICY, "short", T0)).rejects.toThrow(/nonce/);
  });
  it("accepts one submission; a replay is refused and changes nothing", async () => {
    const a = await started();
    const s1 = await submitAttempt(a, POLICY, { nonce: NONCE, now: at(400) });
    const ok = must(s1);
    expect(ok.attempt.state).toBe("SUBMITTED");
    const s2 = await submitAttempt(ok.attempt, POLICY, { nonce: NONCE, now: at(500) });
    expect(s2).toMatchObject({ ok: false, error: "REPLAY" });
    expect(s2.attempt).toEqual(ok.attempt);
    expect(await submitAttempt(must(eligible()).attempt, POLICY, { nonce: NONCE, now: at(5) })).toMatchObject({ ok: false, error: "NOT_STARTED" });
  });
  it("a wrong nonce is refused and flagged; a submission after the window expires the attempt", async () => {
    const a = await started();
    const bad = await submitAttempt(a, POLICY, { nonce: "x".repeat(32), now: at(400) });
    expect(bad).toMatchObject({ ok: false, error: "BAD_NONCE" });
    expect(bad.attempt.state).toBe("STARTED");
    expect(bad.attempt.integrityFlags).toContain("NONCE_MISMATCH");
    const late = await submitAttempt(a, POLICY, { nonce: NONCE, now: at(10 + POLICY.windowSec + 1) });
    expect(late.ok).toBe(false);
    expect(late.attempt.state).toBe("EXPIRED");
  });
  it("a clean pass is certified by the server; a fail stays SCORED and is never certified", async () => {
    const sub = must(await submitAttempt(await started(), POLICY, { nonce: NONCE, now: at(900) })).attempt;
    const pass = finalizeScore(scoreAttempt(sub, POLICY, 82, at(950)), at(951));
    expect(pass).toMatchObject({ state: "CERTIFIED", result: "PASSED", score: 82 });
    const fail = finalizeScore(scoreAttempt(sub, POLICY, 41, at(950)), at(951));
    expect(fail).toMatchObject({ state: "SCORED", result: "NOT_PASSED" });
    expect(() => scoreAttempt(sub, POLICY, 101, at(950))).toThrow();
    expect(() => scoreAttempt(sub, POLICY, 70.5, at(950))).toThrow();
    expect(() => scoreAttempt(must(eligible()).attempt, POLICY, 80, at(950))).toThrow(/cannot score/);
  });
  it("an implausibly fast sitting or an anomaly goes to integrity review, and only a reviewer decides", async () => {
    const fast = must(await submitAttempt(await started(), POLICY, { nonce: NONCE, now: at(60) })).attempt;
    expect(fast.integrityFlags).toEqual(["TOO_FAST"]);
    const review = finalizeScore(scoreAttempt(fast, POLICY, 95, at(70)), at(71));
    expect(review.state).toBe("INTEGRITY_REVIEW");
    expect(reviewIntegrity(review, "CLEARED", at(100)).state).toBe("CERTIFIED");
    expect(reviewIntegrity(review, "VOID", at(100)).state).toBe("REVOKED");
    const slow = must(await submitAttempt(await started(), POLICY, { nonce: NONCE, now: at(900) })).attempt;
    expect(finalizeScore(scoreAttempt(slow, POLICY, 90, at(910), true), at(911)).state).toBe("INTEGRITY_REVIEW");
  });
  it("a certified attempt can be revoked, then nothing moves it again", async () => {
    const sub = must(await submitAttempt(await started(), POLICY, { nonce: NONCE, now: at(900) })).attempt;
    const cert = finalizeScore(scoreAttempt(sub, POLICY, 90, at(910)), at(911));
    const revoked = revokeCertification(cert, "REVIEWER", at(2000));
    expect(revoked.state).toBe("REVOKED");
    expect(() => revokeCertification(revoked, "SERVER", at(3000))).toThrow();
    expect(() => reviewIntegrity(revoked, "CLEARED", at(3000))).toThrow();
  });
});

describe("assessment manifest", () => {
  const m: AssessmentManifest = { manifestId: "m1", version: "english-adult-L6-v3", product: "ADULT_LANGUAGE", subjectOrTargetLanguage: "en", level: 6, itemIds: ["q1", "q2", "q3"], blueprintVersion: "bp-1", calibrationVersion: "provisional-1", timeLimitSec: 3600, passMark: 70, createdAt: T0 };
  it("signs, verifies, and fails when any part changes", async () => {
    const s = await generateSigner(), keys = { [s.keyId]: s.publicKeyHex };
    const signed = await signManifest(m, s);
    expect(await verifyManifest(signed, keys)).toBe(true);
    for (const edit of [{ itemIds: ["q1", "q2", "q4"] }, { level: 7 }, { passMark: 50 }, { timeLimitSec: 99999 }, { version: "english-adult-L6-v4" }] as Partial<AssessmentManifest>[])
      expect(await verifyManifest({ ...signed, manifest: { ...m, ...edit } }, keys), JSON.stringify(edit)).toBe(false);
    expect(await verifyManifest({ ...signed, hash: "0".repeat(64) }, keys)).toBe(false);
    expect(await verifyManifest(signed, {})).toBe(false);
  });
  it("refuses an empty, duplicated or out-of-range manifest", async () => {
    const s = await generateSigner();
    await expect(signManifest({ ...m, itemIds: [] }, s)).rejects.toThrow();
    await expect(signManifest({ ...m, itemIds: ["a", "a"] }, s)).rejects.toThrow();
    await expect(signManifest({ ...m, level: 11 }, s)).rejects.toThrow();
    await expect(signManifest({ ...m, passMark: 0 }, s)).rejects.toThrow();
  });
  it("selects items on the server: deterministic for one secret and salt, different otherwise, no duplicates", async () => {
    const pool = Array.from({ length: 60 }, (_, i) => `q${i}`);
    const a = await selectItems(pool, 20, "secret-1", "attempt-1");
    expect(a).toEqual(await selectItems(pool, 20, "secret-1", "attempt-1"));
    expect(a).not.toEqual(await selectItems(pool, 20, "secret-2", "attempt-1"));
    expect(a).not.toEqual(await selectItems(pool, 20, "secret-1", "attempt-2"));
    expect(new Set(a).size).toBe(20);
    expect(a.every((id) => pool.includes(id))).toBe(true);
    await expect(selectItems(pool, 61, "s", "a")).rejects.toThrow();
    await expect(selectItems(pool, 5, "", "a")).rejects.toThrow();
    await expect(selectItems(["a", "a"], 1, "s", "a")).rejects.toThrow();
  });
});

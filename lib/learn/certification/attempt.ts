/**
 * Server-side attempt operations (pure: `now`, ids and nonces are injected so they can be tested and replayed).
 * Each function returns a new Attempt; nothing mutates. None of them reads a value that came from the browser except the one-time nonce
 * and the submitted answers (which are scored by the server elsewhere).
 */
import { sha256Hex } from "../transparency/crypto";
import { assertCapability, EntitlementError, type EntitlementEvent } from "../products/entitlement";
import { transition, type Attempt, type IntegrityFlag } from "./state";

export interface CertificationPolicy {
  version: string;
  /** attempts per (account, assessment family); 0 = unlimited */
  maxAttempts: number;
  cooldownSec: number;
  windowSec: number;
  /** faster than this is not plausible for the whole sitting */
  minPlausibleSec: number;
  passMark: number;
}

export type StartError = "NOT_ENTITLED" | "ATTEMPT_LIMIT" | "COOLDOWN" | "ACTIVE_ATTEMPT_EXISTS";
export type StartResult = { ok: true; attempt: Attempt } | { ok: false; error: StartError };

const sec = (iso: string) => Date.parse(iso) / 1000;
const iso = (s: number) => new Date(s * 1000).toISOString();

/** ELIGIBLE: created only when the server's entitlement ledger says CERTIFICATION_ATTEMPT, the limits allow it and no sitting is open. */
export function grantEligibility(args: { policy: CertificationPolicy; events: readonly EntitlementEvent[]; accountId: string; prior: readonly Attempt[]; manifestHash: string; attemptId: string; now: string }): StartResult {
  const { policy, events, accountId, prior, manifestHash, attemptId, now } = args;
  try { assertCapability(events, accountId, "CERTIFICATION_ATTEMPT", now); } catch (e) { if (e instanceof EntitlementError) return { ok: false, error: "NOT_ENTITLED" }; throw e; }
  const mine = prior.filter((a) => a.accountId === accountId && a.manifestHash === manifestHash);
  if (mine.some((a) => a.state === "ELIGIBLE" || a.state === "STARTED" || a.state === "SUBMITTED")) return { ok: false, error: "ACTIVE_ATTEMPT_EXISTS" };
  if (policy.maxAttempts > 0 && mine.length >= policy.maxAttempts) return { ok: false, error: "ATTEMPT_LIMIT" };
  const last = mine.map((a) => a.submittedAt ?? a.startedAt).filter((x): x is string => !!x).sort().pop();
  if (last && sec(now) - sec(last) < policy.cooldownSec) return { ok: false, error: "COOLDOWN" };
  return { ok: true, attempt: { attemptId, accountId, manifestHash, state: "ELIGIBLE", attemptNo: mine.length + 1, nonceHash: null, startedAt: null, expiresAt: null, submittedAt: null, score: null, result: null, integrityFlags: [], history: [{ from: null, to: "ELIGIBLE", at: now, actor: "SERVER" }] } };
}

/** ELIGIBLE -> STARTED: binds a one-time nonce (only its hash is stored) and the time window. Returns the attempt; the caller hands the nonce to the learner's session. */
export async function beginAttempt(a: Attempt, policy: CertificationPolicy, nonce: string, now: string): Promise<Attempt> {
  if (nonce.length < 16) throw new Error("nonce must be at least 16 characters of server randomness");
  const t = transition(a, "STARTED", "SERVER", now);
  if (!t.ok) throw new Error(`cannot start: ${t.error}`);
  return { ...t.attempt, nonceHash: await sha256Hex(nonce), startedAt: now, expiresAt: iso(sec(now) + policy.windowSec) };
}

export type SubmitError = "REPLAY" | "BAD_NONCE" | "NOT_STARTED";
export type SubmitResult = { ok: true; attempt: Attempt } | { ok: false; error: SubmitError; attempt: Attempt };

/**
 * STARTED -> SUBMITTED. Replay protection: a second submission of the same attempt is refused (state is no longer STARTED) and never overwrites.
 * A wrong nonce is refused and recorded as a flag. A submission after the window expires the attempt instead.
 */
export async function submitAttempt(a: Attempt, policy: CertificationPolicy, args: { nonce: string; now: string }): Promise<SubmitResult> {
  if (a.state === "SUBMITTED" || a.state === "SCORED" || a.state === "CERTIFIED" || a.state === "INTEGRITY_REVIEW" || a.state === "REVOKED") return { ok: false, error: "REPLAY", attempt: a };
  if (a.state !== "STARTED" || !a.nonceHash || !a.expiresAt || !a.startedAt) return { ok: false, error: "NOT_STARTED", attempt: a };
  if ((await sha256Hex(args.nonce)) !== a.nonceHash) return { ok: false, error: "BAD_NONCE", attempt: { ...a, integrityFlags: addFlag(a.integrityFlags, "NONCE_MISMATCH") } };
  if (sec(args.now) > sec(a.expiresAt)) {
    const t = transition(a, "EXPIRED", "SERVER", args.now);
    return { ok: false, error: "NOT_STARTED", attempt: t.ok ? t.attempt : a };
  }
  const t = transition(a, "SUBMITTED", "LEARNER", args.now);
  if (!t.ok) return { ok: false, error: "NOT_STARTED", attempt: a };
  const tooFast = sec(args.now) - sec(a.startedAt) < policy.minPlausibleSec;
  return { ok: true, attempt: { ...t.attempt, submittedAt: args.now, integrityFlags: tooFast ? addFlag(t.attempt.integrityFlags, "TOO_FAST") : t.attempt.integrityFlags } };
}

const addFlag = (flags: readonly IntegrityFlag[], f: IntegrityFlag): readonly IntegrityFlag[] => (flags.includes(f) ? flags : [...flags, f]);

/** SUBMITTED -> SCORED (server only). `score` is the server's integer 0..100; `externalAnomaly` is the verdict of the anomaly checks. */
export function scoreAttempt(a: Attempt, policy: CertificationPolicy, score: number, now: string, externalAnomaly = false): Attempt {
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("score must be an integer 0..100");
  const t = transition(a, "SCORED", "SERVER", now);
  if (!t.ok) throw new Error(`cannot score: ${t.error}`);
  return { ...t.attempt, score, result: score >= policy.passMark ? "PASSED" : "NOT_PASSED", integrityFlags: externalAnomaly ? addFlag(t.attempt.integrityFlags, "EXTERNAL_ANOMALY") : t.attempt.integrityFlags };
}

/** SCORED -> CERTIFIED (clean pass) or INTEGRITY_REVIEW (any flag). A failed attempt stays SCORED and is never certified. */
export function finalizeScore(a: Attempt, now: string): Attempt {
  if (a.state !== "SCORED") throw new Error("finalize: attempt is not SCORED");
  if (a.result !== "PASSED") return a;
  const to = a.integrityFlags.length ? "INTEGRITY_REVIEW" : "CERTIFIED";
  const t = transition(a, to, "SERVER", now);
  if (!t.ok) throw new Error(`cannot finalize: ${t.error}`);
  return t.attempt;
}

/** INTEGRITY_REVIEW -> CERTIFIED | REVOKED, decided by a human reviewer only. */
export function reviewIntegrity(a: Attempt, verdict: "CLEARED" | "VOID", now: string): Attempt {
  const t = transition(a, verdict === "CLEARED" ? "CERTIFIED" : "REVOKED", "REVIEWER", now);
  if (!t.ok) throw new Error(`cannot review: ${t.error}`);
  return t.attempt;
}
export function revokeCertification(a: Attempt, actor: "SERVER" | "REVIEWER", now: string): Attempt {
  const t = transition(a, "REVOKED", actor, now);
  if (!t.ok) throw new Error(`cannot revoke: ${t.error}`);
  return t.attempt;
}

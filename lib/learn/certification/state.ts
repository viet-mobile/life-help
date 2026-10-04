/**
 * Certification state machine. Practice XP and mastery live elsewhere and NEVER feed this: certification is a separate, high-trust path.
 *
 *   ELIGIBLE -> STARTED -> SUBMITTED -> SCORED -> CERTIFIED
 *                   |                      \-> INTEGRITY_REVIEW -> CERTIFIED | REVOKED
 *                   \-> EXPIRED            CERTIFIED -> REVOKED | INTEGRITY_REVIEW
 *
 * AUTHORITY: the learner may only ask to start and to submit; everything that creates a result (scoring, certifying, revoking) is SERVER or
 * REVIEWER. A request from the browser can therefore never move an attempt into SCORED / CERTIFIED: the transition table refuses the actor.
 * Real database tables and migrations are a later step; this file fixes the states and who may move them.
 */
export const ATTEMPT_STATES = ["ELIGIBLE", "STARTED", "SUBMITTED", "SCORED", "INTEGRITY_REVIEW", "CERTIFIED", "REVOKED", "EXPIRED"] as const;
export type AttemptState = (typeof ATTEMPT_STATES)[number];
export type Actor = "LEARNER" | "SERVER" | "REVIEWER";
export type IntegrityFlag = "TOO_FAST" | "NONCE_MISMATCH" | "EXTERNAL_ANOMALY";

export const TRANSITIONS: Record<AttemptState, Partial<Record<AttemptState, readonly Actor[]>>> = {
  ELIGIBLE: { STARTED: ["LEARNER", "SERVER"] },
  STARTED: { SUBMITTED: ["LEARNER", "SERVER"], EXPIRED: ["SERVER"] },
  SUBMITTED: { SCORED: ["SERVER"] },
  SCORED: { CERTIFIED: ["SERVER"], INTEGRITY_REVIEW: ["SERVER"] },
  INTEGRITY_REVIEW: { CERTIFIED: ["REVIEWER"], REVOKED: ["REVIEWER"] },
  CERTIFIED: { REVOKED: ["REVIEWER", "SERVER"], INTEGRITY_REVIEW: ["SERVER", "REVIEWER"] },
  REVOKED: {},
  EXPIRED: {},
};
export const isTerminal = (s: AttemptState) => Object.keys(TRANSITIONS[s]).length === 0;

export interface Attempt {
  attemptId: string;
  accountId: string;
  /** which assessment (SHA-256 of the signed manifest) the attempt is bound to */
  manifestHash: string;
  state: AttemptState;
  /** 1-based number of this attempt for (account, assessment family) */
  attemptNo: number;
  /** SHA-256 of the one-time nonce; the nonce itself is only ever held by the learner's session */
  nonceHash: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  /** server score 0..100 (integer), set only by the server */
  score: number | null;
  result: "PASSED" | "NOT_PASSED" | null;
  integrityFlags: readonly IntegrityFlag[];
  history: readonly { from: AttemptState | null; to: AttemptState; at: string; actor: Actor }[];
}

export type TransitionError = "ILLEGAL_TRANSITION" | "ACTOR_NOT_ALLOWED";
export type TransitionResult = { ok: true; attempt: Attempt } | { ok: false; error: TransitionError };

/** the only way a state changes */
export function transition(a: Attempt, to: AttemptState, actor: Actor, at: string): TransitionResult {
  const allowed = TRANSITIONS[a.state][to];
  if (!allowed) return { ok: false, error: "ILLEGAL_TRANSITION" };
  if (!allowed.includes(actor)) return { ok: false, error: "ACTOR_NOT_ALLOWED" };
  return { ok: true, attempt: { ...a, state: to, history: [...a.history, { from: a.state, to, at, actor }] } };
}

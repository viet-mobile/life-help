/**
 * Learning ENTITLEMENT ledger: the single source of truth for "what may this account do".
 *
 *   FREE            practice
 *   PLUS            practice + adaptive practice
 *   CERTIFICATION   adds certification attempts
 *   INSTITUTION     everything, for a managed roster
 *
 * Rules that are enforced by the shape of this API:
 *  - entitlements are DERIVED from server-held, append-only grant / revoke events. There is no function that accepts a client-supplied
 *    "isPaid" / "plan" value, and the client never sends one.
 *  - a payment provider only MOVES FUNDS. A provider event is turned into a GRANT by the server (source PAYMENT, with the provider reference for
 *    audit); the provider's webhook never writes a plan directly.
 *  - a free learner can still reach certification: a GRANT with source SCHOLARSHIP_WAIVER (or INSTITUTION / ADMIN) carries the same capability
 *    without any payment, so scholarship eligibility never depends on money (see lib/learn/scholarship).
 * Which capabilities each plan holds is a versioned POLICY (PLAN_POLICY_VERSION), not a price list: no price lives here.
 */
export const PLANS = ["FREE", "PLUS", "CERTIFICATION", "INSTITUTION"] as const;
export type Plan = (typeof PLANS)[number];
export const CAPABILITIES = ["PRACTICE", "ADAPTIVE_PRACTICE", "CERTIFICATION_ATTEMPT", "INSTITUTION_ROSTER"] as const;
export type Capability = (typeof CAPABILITIES)[number];
export const PLAN_POLICY_VERSION = "plans-1";

export const PLAN_CAPABILITIES: Record<Plan, readonly Capability[]> = {
  FREE: ["PRACTICE"],
  PLUS: ["PRACTICE", "ADAPTIVE_PRACTICE"],
  CERTIFICATION: ["PRACTICE", "ADAPTIVE_PRACTICE", "CERTIFICATION_ATTEMPT"],
  INSTITUTION: ["PRACTICE", "ADAPTIVE_PRACTICE", "CERTIFICATION_ATTEMPT", "INSTITUTION_ROSTER"],
};

export type GrantSource = "PAYMENT" | "INSTITUTION" | "SCHOLARSHIP_WAIVER" | "ADMIN";

export type EntitlementEvent =
  | { seq: number; kind: "GRANT"; grantId: string; accountId: string; plan: Plan; source: GrantSource; /** provider / contract / waiver reference, required for audit */ externalRef: string; validFrom: string; /** null = until revoked */ validUntil: string | null }
  | { seq: number; kind: "REVOKE"; grantId: string; accountId: string; at: string; reason: string };

export class EntitlementError extends Error {
  constructor(readonly capability: Capability) { super(`not entitled to ${capability}`); }
}

const ms = (iso: string) => { const t = Date.parse(iso); if (Number.isNaN(t)) throw new Error(`invalid time ${iso}`); return t; };

/** Validates an event before it is appended (the server's INSERT-only writer calls this). */
export function validateEntitlementEvent(e: EntitlementEvent): void {
  if (!e.grantId || !e.accountId) throw new Error("entitlement: grantId and accountId required");
  if (e.kind === "GRANT") {
    if (!PLANS.includes(e.plan)) throw new Error(`entitlement: unknown plan ${e.plan}`);
    if (!e.externalRef) throw new Error("entitlement: a grant needs an external reference (provider / contract / waiver id)");
    if (e.plan === "FREE") throw new Error("entitlement: FREE is the default and is never granted");
    if (e.validUntil !== null && ms(e.validUntil) <= ms(e.validFrom)) throw new Error("entitlement: validUntil must be after validFrom");
  }
}

/** grants of the account that are in force at `at` (not revoked before `at`, inside their validity window), replayed from the events */
export function activeGrants(events: readonly EntitlementEvent[], accountId: string, at: string): Extract<EntitlementEvent, { kind: "GRANT" }>[] {
  const t = ms(at);
  const revokedAt = new Map<string, number>();
  for (const e of events) if (e.kind === "REVOKE" && e.accountId === accountId) revokedAt.set(e.grantId, Math.min(revokedAt.get(e.grantId) ?? Infinity, ms(e.at)));
  return events.filter((e): e is Extract<EntitlementEvent, { kind: "GRANT" }> =>
    e.kind === "GRANT" && e.accountId === accountId && ms(e.validFrom) <= t && (e.validUntil === null || t < ms(e.validUntil)) && !(revokedAt.has(e.grantId) && revokedAt.get(e.grantId)! <= t));
}

export function capabilitiesOf(events: readonly EntitlementEvent[], accountId: string, at: string): Set<Capability> {
  const out = new Set<Capability>(PLAN_CAPABILITIES.FREE);
  for (const g of activeGrants(events, accountId, at)) for (const c of PLAN_CAPABILITIES[g.plan]) out.add(c);
  return out;
}
export const hasCapability = (events: readonly EntitlementEvent[], accountId: string, cap: Capability, at: string) => capabilitiesOf(events, accountId, at).has(cap);
export function assertCapability(events: readonly EntitlementEvent[], accountId: string, cap: Capability, at: string): void {
  if (!hasCapability(events, accountId, cap, at)) throw new EntitlementError(cap);
}

// lib/request/idempotencyKey.ts
// Environment-neutral idempotency key helpers for POST /api/requests.
//
// The idempotency key only de-duplicates one logical submission (double click, network retry).
// It is not a customer identifier (that is the CST-XXXX pseudonym) and not an access credential.

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

/** Canonical RFC 9562 version-4 UUID, as produced by crypto.randomUUID(). */
export const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Generates a fresh 122-bit random key for a new logical submission. */
export function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  // Non-secure contexts (e.g. plain-http LAN testing) lack randomUUID but still have getRandomValues.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

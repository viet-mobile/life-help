import "server-only";

import { getRuntimeServiceRoleConfig } from "@/lib/supabase/serviceRole";

/**
 * Opaque customer offer token (AES-GCM, key derived server-side). It answers only "which public
 * offer was selected": price row, its revision, helper and sub-item, plus an expiry. It is NOT
 * customer authorization (ownership comes from the device-owner cookie) and carries no secret.
 *
 * Stale-offer policy: the token pins the offer REVISION. At request creation the database
 * re-reads the ACTIVE offer and rejects with PRICE_CHANGED if the helper changed any term since the
 * customer saw it; the customer must review the new terms. Tokens also expire after 15 minutes
 * (OFFER_EXPIRED) so abandoned screens are refreshed.
 */
export const OFFER_TOKEN_TTL_MS = 15 * 60 * 1000;
const PURPOSE = "life.help/customer-offer/v1:";

/**
 * `requestId` is present only on re-selection offers: such a token is bound to that one request and
 * is refused by the new-request route (and a new-request token is refused by re-selection).
 */
export type OfferClaims = { priceId: string; revision: number; helperId: string; serviceCode: string; subitemCode: string; requestId?: string; exp: number };

const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4)), (c) => c.charCodeAt(0));

async function key(): Promise<CryptoKey | null> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config) return null;
  const material = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(PURPOSE + config.key));
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function issueOfferToken(claims: Omit<OfferClaims, "exp">, now = Date.now()): Promise<string | null> {
  const k = await key();
  if (!k) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = new TextEncoder().encode(JSON.stringify({ ...claims, exp: now + OFFER_TOKEN_TTL_MS }));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, body));
  const out = new Uint8Array(iv.length + sealed.length);
  out.set(iv); out.set(sealed, iv.length);
  return b64u(out);
}

export async function readOfferToken(token: unknown, now = Date.now()): Promise<{ ok: true; claims: OfferClaims } | { ok: false; code: "OFFER_INVALID" | "OFFER_EXPIRED" }> {
  if (typeof token !== "string" || token.length < 40 || token.length > 2000) return { ok: false, code: "OFFER_INVALID" };
  const k = await key();
  if (!k) return { ok: false, code: "OFFER_INVALID" };
  try {
    const raw = fromB64u(token);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, k, raw.slice(12));
    const claims = JSON.parse(new TextDecoder().decode(plain)) as OfferClaims;
    if (typeof claims.priceId !== "string" || !Number.isInteger(claims.revision) || typeof claims.exp !== "number") return { ok: false, code: "OFFER_INVALID" };
    if (claims.requestId !== undefined && typeof claims.requestId !== "string") return { ok: false, code: "OFFER_INVALID" };
    if (claims.exp < now) return { ok: false, code: "OFFER_EXPIRED" };
    return { ok: true, claims };
  } catch {
    return { ok: false, code: "OFFER_INVALID" };
  }
}

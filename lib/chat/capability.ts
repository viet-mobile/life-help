import "server-only";

import { getRuntimeServiceRoleConfig } from "@/lib/supabase/serviceRole";

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export async function issueConversationCapability(requestId: string, customerId: string): Promise<string | null> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config) return null;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ requestId, customerId, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })));
  return `${payload}.${await sign(payload, config.key)}`;
}

export async function verifyConversationCapability(token: string, requestId: string): Promise<{ customerId: string } | null> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  const expected = await sign(payload, config.key);
  if (!constantTimeEqual(encoder.encode(supplied), encoder.encode(expected))) return null;
  try {
    const value = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { requestId?: string; customerId?: string; expiresAt?: number };
    if (value.requestId !== requestId || !value.customerId || !value.expiresAt || value.expiresAt < Date.now()) return null;
    return { customerId: value.customerId };
  } catch {
    return null;
  }
}

export async function issuePayoutManagementCapability(ownerPublicId: string): Promise<string | null> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config) return null;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ purpose: "PAYOUT_MANAGEMENT", ownerPublicId, expiresAt: Date.now() + 60 * 60 * 1000, nonce: crypto.randomUUID() })));
  return `${payload}.${await sign(payload, config.key)}`;
}

export async function verifyPayoutManagementCapability(token: string, ownerPublicId: string): Promise<boolean> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config) return false;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return false;
  const expected = await sign(payload, config.key);
  if (!constantTimeEqual(encoder.encode(supplied), encoder.encode(expected))) return false;
  try {
    const value = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { purpose?: string; ownerPublicId?: string; expiresAt?: number };
    return value.purpose === "PAYOUT_MANAGEMENT" && value.ownerPublicId === ownerPublicId && typeof value.expiresAt === "number" && value.expiresAt >= Date.now();
  } catch {
    return false;
  }
}

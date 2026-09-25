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
  if (!payload || !supplied || !(await sign(payload, config.key)).length || supplied !== await sign(payload, config.key)) return null;
  try {
    const value = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { requestId?: string; customerId?: string; expiresAt?: number };
    if (value.requestId !== requestId || !value.customerId || !value.expiresAt || value.expiresAt < Date.now()) return null;
    return { customerId: value.customerId };
  } catch {
    return null;
  }
}

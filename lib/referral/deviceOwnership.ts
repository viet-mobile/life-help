import "server-only";

import { getRuntimeServiceRoleConfig } from "@/lib/supabase/serviceRole";

export const DEVICE_OWNER_COOKIE = "life_help_device_owner";
const encoder = new TextEncoder();

function encode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string) {
  return atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4));
}

async function mac(value: string, keyValue: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(keyValue), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)))));
}

function equal(a: string, b: string) {
  const left = encoder.encode(a); const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function issueDeviceOwnerCookie(deviceHash: string): Promise<string | null> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config) return null;
  const payload = encode(JSON.stringify({ deviceHash, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  return `${payload}.${await mac(payload, config.key)}`;
}

export async function verifyDeviceOwnerCookie(cookieValue: string | null): Promise<string | null> {
  const config = await getRuntimeServiceRoleConfig();
  if (!config || !cookieValue) return null;
  const [payload, supplied] = cookieValue.split(".");
  if (!payload || !supplied || !equal(supplied, await mac(payload, config.key))) return null;
  try {
    const value = JSON.parse(decode(payload)) as { deviceHash?: string; expiresAt?: number };
    return value.deviceHash && value.expiresAt && value.expiresAt >= Date.now() ? value.deviceHash : null;
  } catch { return null; }
}

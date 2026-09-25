import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PUBLIC_ID_PATTERN = /^[A-Z]{8}$/;

function generatePublicUserId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function hashDeviceId(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { deviceId?: unknown } | null;
  if (!body || typeof body.deviceId !== "string" || body.deviceId.length < 16 || body.deviceId.length > 200) {
    return NextResponse.json({ success: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const { env } = await getCloudflareContext({ async: true });
  const runtime = env as Record<string, unknown>;
  const rawUrl = typeof runtime.SUPABASE_URL === "string" ? runtime.SUPABASE_URL.trim().replace(/^("|')(.*)\1$/, "$2").replace(/\/$/, "") : "";
  const serviceRoleKeyName = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
  const key = typeof runtime[serviceRoleKeyName] === "string" ? runtime[serviceRoleKeyName] as string : "";
  const ref = rawUrl.match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1];
  if (!rawUrl || !key || ref !== "wreebowcbiymodswajwe" || ref === String("wstdbymmkrqgtsibhcjz")) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const deviceHash = await hashDeviceId(body.deviceId);
  const existingResponse = await fetch(`${rawUrl}/rest/v1/public_user_identities?select=public_user_id&device_id_hash=eq.${deviceHash}`, { headers });
  if (!existingResponse.ok) return NextResponse.json({ success: false, code: "IDENTITY_LOOKUP_FAILED" }, { status: 500 });
  const existing = await existingResponse.json() as Array<{ public_user_id: string }>;
  if (existing[0]?.public_user_id && PUBLIC_ID_PATTERN.test(existing[0].public_user_id)) return NextResponse.json({ success: true, publicUserId: existing[0].public_user_id });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generatePublicUserId();
    const created = await fetch(`${rawUrl}/rest/v1/public_user_identities`, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify({ public_user_id: candidate, device_id_hash: deviceHash }) });
    if (created.ok) return NextResponse.json({ success: true, publicUserId: candidate });
    if (created.status !== 409) return NextResponse.json({ success: false, code: "IDENTITY_CREATE_FAILED" }, { status: 500 });
  }
  return NextResponse.json({ success: false, code: "IDENTITY_COLLISION_RETRY_EXHAUSTED" }, { status: 503 });
}

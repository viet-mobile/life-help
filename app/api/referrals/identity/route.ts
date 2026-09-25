import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const REFERRAL_PATTERN = /^[A-Z]{8}$/;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]{16,200}$/;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type SubjectType = "CUSTOMER" | "HELPER" | "ADMIN";

function randomReferralId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function hashDeviceId(deviceId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deviceId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: { deviceId?: unknown; subjectType?: unknown; referralId?: unknown; subjectKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ success: false, code: "INVALID_JSON" }, 400);
  }

  const deviceId = body.deviceId;
  const subjectType = body.subjectType;
  const referralId = body.referralId;
  const subjectKey = typeof body.subjectKey === "string" ? body.subjectKey.trim() : undefined;
  if (typeof deviceId !== "string" || !DEVICE_ID_PATTERN.test(deviceId) || !["CUSTOMER", "HELPER", "ADMIN"].includes(String(subjectType))) {
    return response({ success: false, code: "VALIDATION_ERROR" }, 400);
  }
  if (referralId !== undefined && (typeof referralId !== "string" || !REFERRAL_PATTERN.test(referralId))) {
    return response({ success: false, code: "INVALID_REFERRAL_ID" }, 400);
  }

  const { env } = await getCloudflareContext({ async: true });
  const runtimeEnv = env as Record<string, unknown>;
  const rawUrl = typeof runtimeEnv.SUPABASE_URL === "string" ? runtimeEnv.SUPABASE_URL : "";
  const serviceRoleKeyName = "SUPABASE_" + "SERVICE_ROLE_KEY";
  const serviceRoleKey = typeof runtimeEnv[serviceRoleKeyName] === "string" ? runtimeEnv[serviceRoleKeyName] as string : "";
  if (!rawUrl || !serviceRoleKey) return response({ success: false, code: "SERVICE_UNAVAILABLE" }, 503);
  const config = { url: rawUrl.trim().replace(/^(["'])(.*)\1$/, "$2").replace(/\/$/, ""), key: serviceRoleKey };
  const headers = { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" };
  const deviceHash = await hashDeviceId(deviceId);
  let lookup: Response;
  try {
    lookup = await fetch(`${config.url}/rest/v1/referral_identities?select=id,referral_id,status&device_id_hash=eq.${deviceHash}&status=eq.ACTIVE`, { headers });
  } catch {
    return response({ success: false, code: "REFERRAL_FETCH_FAILED" }, 500);
  }
  if (!lookup.ok) return response({ success: false, code: "REFERRAL_LOOKUP_FAILED" }, 500);
  const existingRows = await lookup.json() as Array<{ id: string; referral_id: string; status: string }>;
  const existing = existingRows[0] || null;

  let identity = existing;
  if (!identity) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = randomReferralId();
      const create = await fetch(`${config.url}/rest/v1/referral_identities?select=id,referral_id,status`, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify({ referral_id: candidate, subject_type: subjectType as SubjectType, device_id_hash: deviceHash, ...(subjectKey ? { subject_key: subjectKey } : {}) }) });
      const rows = create.ok ? await create.json() as Array<{ id: string; referral_id: string; status: string }> : [];
      if (create.ok && rows[0]) {
        identity = rows[0];
        break;
      }
      if (create.status !== 409) return response({ success: false, code: "REFERRAL_CREATE_FAILED" }, 500);
    }
  } else {
    await fetch(`${config.url}/rest/v1/referral_identities?id=eq.${identity.id}`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ last_seen_at: new Date().toISOString(), ...(subjectKey ? { subject_key: subjectKey } : {}) }) });
  }
  if (!identity) return response({ success: false, code: "REFERRAL_CREATE_FAILED" }, 500);

  if (referralId && referralId !== identity.referral_id) {
    const referrerResponse = await fetch(`${config.url}/rest/v1/referral_identities?select=id,status&referral_id=eq.${referralId}&status=eq.ACTIVE`, { headers });
    const referrerRows = referrerResponse.ok ? await referrerResponse.json() as Array<{ id: string; status: string }> : [];
    const referrer = referrerRows[0];
    if (!referrer) return response({ success: false, code: "INVALID_REFERRAL_ID" }, 400);
    if (referrer.id === identity.id) return response({ success: false, code: "SELF_REFERRAL" }, 409);
    const attribution = await fetch(`${config.url}/rest/v1/referral_attributions`, { method: "POST", headers: { ...headers, Prefer: "return=minimal,resolution=ignore-duplicates" }, body: JSON.stringify({ referred_identity_id: identity.id, referrer_identity_id: referrer.id, status: "ACTIVE" }) });
    if (!attribution.ok) return response({ success: false, code: "ATTRIBUTION_FAILED" }, 409);
  }

  return response({ success: true, referralId: identity.referral_id, referralLink: `https://life.help/?ref=${identity.referral_id}` });
}

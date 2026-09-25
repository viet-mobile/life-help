import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

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
  let body: { deviceId?: unknown; subjectType?: unknown; referralId?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ success: false, code: "INVALID_JSON" }, 400);
  }

  const deviceId = body.deviceId;
  const subjectType = body.subjectType;
  const referralId = body.referralId;
  if (typeof deviceId !== "string" || !DEVICE_ID_PATTERN.test(deviceId) || !["CUSTOMER", "HELPER", "ADMIN"].includes(String(subjectType))) {
    return response({ success: false, code: "VALIDATION_ERROR" }, 400);
  }
  if (referralId !== undefined && (typeof referralId !== "string" || !REFERRAL_PATTERN.test(referralId))) {
    return response({ success: false, code: "INVALID_REFERRAL_ID" }, 400);
  }

  const client = await createRuntimeServiceRoleClient();
  if (!client) return response({ success: false, code: "SERVICE_UNAVAILABLE" }, 503);
  const deviceHash = await hashDeviceId(deviceId);
  const { data: existing, error: existingError } = await client.from("referral_identities").select("id, referral_id, status").eq("device_id_hash", deviceHash).eq("status", "ACTIVE").maybeSingle();
  if (existingError) return response({ success: false, code: "REFERRAL_LOOKUP_FAILED" }, 500);

  let identity = existing;
  if (!identity) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = randomReferralId();
      const { data, error } = await client.from("referral_identities").insert({ referral_id: candidate, subject_type: subjectType as SubjectType, device_id_hash: deviceHash }).select("id, referral_id, status").maybeSingle();
      if (!error && data) {
        identity = data;
        break;
      }
      if (error?.code !== "23505") return response({ success: false, code: "REFERRAL_CREATE_FAILED" }, 500);
    }
  } else {
    await client.from("referral_identities").update({ last_seen_at: new Date().toISOString() }).eq("id", identity.id);
  }
  if (!identity) return response({ success: false, code: "REFERRAL_CREATE_FAILED" }, 500);

  if (referralId && referralId !== identity.referral_id) {
    const { data: referrer } = await client.from("referral_identities").select("id, status").eq("referral_id", referralId).eq("status", "ACTIVE").maybeSingle();
    if (!referrer) return response({ success: false, code: "INVALID_REFERRAL_ID" }, 400);
    if (referrer.id === identity.id) return response({ success: false, code: "SELF_REFERRAL" }, 409);
    const { error: attributionError } = await client.from("referral_attributions").upsert({ referred_identity_id: identity.id, referrer_identity_id: referrer.id, status: "ACTIVE" }, { onConflict: "referred_identity_id", ignoreDuplicates: true });
    if (attributionError) return response({ success: false, code: "ATTRIBUTION_FAILED" }, 409);
  }

  return response({ success: true, referralId: identity.referral_id, referralLink: `https://life.help/?ref=${identity.referral_id}` });
}

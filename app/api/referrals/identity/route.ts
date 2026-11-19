import { NextResponse } from "next/server";
import { getOrCreateReferralUser } from "@/lib/referral/referralStore";
import { calculatePlatformFeePercent } from "@/lib/referral/policy";

async function hashDeviceId(deviceId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deviceId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  let body: { deviceId?: unknown; referralId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const rawDeviceId = typeof body.deviceId === "string" && body.deviceId ? body.deviceId : "guest-device";
  const deviceHash = await hashDeviceId(rawDeviceId);
  const referredBy = typeof body.referralId === "string" ? body.referralId.trim().toUpperCase() : null;

  const { user, attributionOutcome } = getOrCreateReferralUser(deviceHash, referredBy);

  const url = new URL(request.url);
  const origin = url.origin;
  const referralLink = `${origin}/?ref=${user.referralId}`;

  return NextResponse.json({
    success: true,
    referralId: user.referralId,
    referralLink,
    invitedCount: user.invitedCount,
    currentFeePercent: calculatePlatformFeePercent(user.invitedCount),
    attribution: attributionOutcome,
  });
}

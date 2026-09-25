import { NextResponse } from "next/server";
import { issuePayoutManagementCapability } from "@/lib/chat/capability";
import { cookies } from "next/headers";
import { DEVICE_OWNER_COOKIE, verifyDeviceOwnerCookie } from "@/lib/referral/deviceOwnership";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function POST() {
  const deviceHash = await verifyDeviceOwnerCookie((await cookies()).get(DEVICE_OWNER_COOKIE)?.value || null);
  if (!deviceHash) return NextResponse.json({ success: false, code: "DEVICE_AUTH_REQUIRED" }, { status: 401 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: identity } = await client.from("referral_identities").select("id").eq("device_id_hash", deviceHash).eq("status", "ACTIVE").maybeSingle();
  if (!identity) return NextResponse.json({ success: false, code: "IDENTITY_NOT_FOUND" }, { status: 404 });
  const payoutCapability = await issuePayoutManagementCapability(identity.id);
  if (!payoutCapability) return NextResponse.json({ success: false, code: "CAPABILITY_UNAVAILABLE" }, { status: 503 });
  return NextResponse.json({ success: true, payoutCapability, expiresInSeconds: 3600 }, { headers: { "Cache-Control": "no-store" } });
}

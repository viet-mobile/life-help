import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { verifyPayoutManagementCapability } from "@/lib/chat/capability";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payoutCapability = url.searchParams.get("payoutCapability") || "";
  const ownerPublicId = url.searchParams.get("ownerPublicId") || "";
  const verified = await verifyPayoutManagementCapability(payoutCapability, ownerPublicId);
  if (!verified) return NextResponse.json({ success: false, code: "INVALID_PAYOUT_CAPABILITY" }, { status: 403 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: identity } = await client.from("referral_identities").select("id").eq("subject_type", "CUSTOMER").eq("subject_key", ownerPublicId).maybeSingle();
  if (!identity) return NextResponse.json({ success: true, destination: null, providerConnected: false });
  const { data, error } = await client.from("payout_destinations").select("id, country, currency, payout_method, provider, masked_destination, account_holder, status, consent_at, updated_at").eq("owner_identity_id", identity.id).neq("status", "REVOKED").maybeSingle();
  if (error) return NextResponse.json({ success: false, code: "PAYOUT_LOOKUP_FAILED" }, { status: 500 });
  return NextResponse.json({ success: true, destination: data, providerConnected: false }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { ownerPublicId?: unknown; payoutCapability?: unknown; country?: unknown; currency?: unknown; payoutMethod?: unknown; accountHolder?: unknown; consent?: unknown } | null;
  if (!body || typeof body.ownerPublicId !== "string" || typeof body.payoutCapability !== "string" || typeof body.country !== "string" || typeof body.currency !== "string" || typeof body.payoutMethod !== "string" || body.consent !== true) return NextResponse.json({ success: false, code: "VALIDATION_ERROR" }, { status: 400 });
  if (!await verifyPayoutManagementCapability(body.payoutCapability, body.ownerPublicId)) return NextResponse.json({ success: false, code: "INVALID_PAYOUT_CAPABILITY" }, { status: 403 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: identity } = await client.from("referral_identities").select("id").eq("subject_type", "CUSTOMER").eq("subject_key", body.ownerPublicId).maybeSingle();
  if (!identity) return NextResponse.json({ success: false, code: "OWNER_IDENTITY_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ success: false, code: "PAYOUT_PROVIDER_NOT_CONNECTED" }, { status: 503 });
}

import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { verifyConversationCapability } from "@/lib/chat/capability";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId") || "";
  const capability = url.searchParams.get("capability") || "";
  const verified = await verifyConversationCapability(capability, requestId);
  if (!verified) return NextResponse.json({ success: false, code: "INVALID_CAPABILITY" }, { status: 403 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data, error } = await client.from("payout_destinations").select("id, country, currency, payout_method, provider, masked_destination, account_holder, status, consent_at, updated_at").eq("owner_public_id", verified.customerId).eq("request_id", requestId).neq("status", "REVOKED").maybeSingle();
  if (error) return NextResponse.json({ success: false, code: "PAYOUT_LOOKUP_FAILED" }, { status: 500 });
  return NextResponse.json({ success: true, destination: data, providerConnected: false }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { requestId?: unknown; capability?: unknown; country?: unknown; currency?: unknown; payoutMethod?: unknown; providerPayeeToken?: unknown; maskedDestination?: unknown; accountHolder?: unknown; consent?: unknown } | null;
  if (!body || typeof body.requestId !== "string" || typeof body.capability !== "string" || typeof body.country !== "string" || typeof body.currency !== "string" || typeof body.payoutMethod !== "string" || typeof body.providerPayeeToken !== "string" || typeof body.maskedDestination !== "string" || body.consent !== true) return NextResponse.json({ success: false, code: "VALIDATION_ERROR" }, { status: 400 });
  const verified = await verifyConversationCapability(body.capability, body.requestId);
  if (!verified) return NextResponse.json({ success: false, code: "INVALID_CAPABILITY" }, { status: 403 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data, error } = await client.from("payout_destinations").upsert({ owner_public_id: verified.customerId, request_id: body.requestId, country: body.country, currency: body.currency, payout_method: body.payoutMethod, provider: null, provider_payee_token: body.providerPayeeToken, masked_destination: body.maskedDestination, account_holder: typeof body.accountHolder === "string" ? body.accountHolder : null, status: "NOT_VERIFIED", consent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "request_id" }).select("id, country, currency, payout_method, masked_destination, account_holder, status, consent_at, updated_at").single();
  if (error) return NextResponse.json({ success: false, code: "PAYOUT_SAVE_FAILED" }, { status: 409 });
  return NextResponse.json({ success: true, destination: data, providerConnected: false }, { headers: { "Cache-Control": "no-store" } });
}

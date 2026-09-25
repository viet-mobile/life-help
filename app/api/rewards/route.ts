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
  const { data: identity } = await client.from("referral_identities").select("id, referral_id").eq("subject_type", "CUSTOMER").eq("subject_key", verified.customerId).maybeSingle();
  if (!identity) return NextResponse.json({ success: true, tier: "WLH", rewards: [] });
  const { data: rewards, error } = await client.from("referral_rewards").select("id, tier, reward_amount_krw, first_service_discount_krw, state, settled_at, created_at, qualifying_request_id").eq("referrer_identity_id", identity.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, code: "REWARD_LOOKUP_FAILED" }, { status: 500 });
  const { count } = await client.from("service_requests").select("id", { count: "exact", head: true }).eq("customer_id", verified.customerId).eq("status", "SETTLED");
  const settled = count || 0;
  return NextResponse.json({ success: true, tier: settled >= 5 ? "GLH" : settled >= 1 ? "CLH" : "WLH", rewards: rewards ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

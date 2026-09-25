import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { deriveRequestIdFromIdempotencyKey, validateIdempotencyKey } from "@/lib/request/serverRequest";
import { issueConversationCapability } from "@/lib/chat/capability";

export async function POST(request: Request) {
  const key = validateIdempotencyKey(request.headers.get("Idempotency-Key"));
  if (!key.ok) return NextResponse.json(key.error.body, { status: key.error.httpStatus });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const requestId = await deriveRequestIdFromIdempotencyKey(key.value);
  const { data, error } = await client.from("service_requests").select("id, customer_id, status").eq("id", requestId).maybeSingle();
  if (error || !data) return NextResponse.json({ success: false, code: "REQUEST_NOT_FOUND" }, { status: 404 });
  if (["CANCELLED", "EXPIRED", "CLOSED"].includes(data.status)) return NextResponse.json({ success: false, code: "REQUEST_NOT_AVAILABLE" }, { status: 409 });
  const capability = await issueConversationCapability(data.id, data.customer_id);
  if (!capability) return NextResponse.json({ success: false, code: "CAPABILITY_UNAVAILABLE" }, { status: 503 });
  return NextResponse.json({ success: true, requestId: data.id, capability }, { headers: { "Cache-Control": "no-store" } });
}

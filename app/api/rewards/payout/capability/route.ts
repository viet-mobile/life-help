import { NextResponse } from "next/server";
import { verifyConversationCapability, issuePayoutManagementCapability } from "@/lib/chat/capability";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { requestId?: unknown; capability?: unknown } | null;
  if (!body || typeof body.requestId !== "string" || typeof body.capability !== "string") return NextResponse.json({ success: false, code: "VALIDATION_ERROR" }, { status: 400 });
  const verified = await verifyConversationCapability(body.capability, body.requestId);
  if (!verified) return NextResponse.json({ success: false, code: "INVALID_CAPABILITY" }, { status: 403 });
  const payoutCapability = await issuePayoutManagementCapability(verified.customerId);
  if (!payoutCapability) return NextResponse.json({ success: false, code: "CAPABILITY_UNAVAILABLE" }, { status: 503 });
  return NextResponse.json({ success: true, payoutCapability, expiresInSeconds: 3600 }, { headers: { "Cache-Control": "no-store" } });
}

import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { verifyConversationCapability } from "@/lib/chat/capability";
import { loadCurrentAgreedPrice, loadPriceHistory } from "@/lib/pricing/requestPrice";

function fail(status: number, code: string) {
  return NextResponse.json({ success: false, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId") || "";
  const capability = url.searchParams.get("capability") || "";
  if (!/^[0-9a-f-]{36}$/.test(requestId) || !capability) return fail(400, "CAPABILITY_REQUIRED");
  const verified = await verifyConversationCapability(capability, requestId);
  if (!verified) return fail(403, "INVALID_CAPABILITY");
  const client = await createRuntimeServiceRoleClient();
  if (!client) return fail(503, "SERVICE_UNAVAILABLE");
  const { data: row, error } = await client.from("service_requests").select("id, customer_id, status, updated_at, selection_mode").eq("id", requestId).eq("customer_id", verified.customerId).maybeSingle();
  if (error || !row) return fail(404, "REQUEST_NOT_FOUND");
  // Customer-selected requests: the CURRENT accepted price is authoritative; earlier versions are history.
  const selected = row.selection_mode === "CUSTOMER_SELECTED";
  const [agreedPrice, priceHistory] = selected ? await Promise.all([loadCurrentAgreedPrice(client, row.id), loadPriceHistory(client, row.id)]) : [null, []];
  return NextResponse.json({ success: true, requestId: row.id, status: row.status, updatedAt: row.updated_at, selectionMode: row.selection_mode, agreedPrice, priceHistory }, { headers: { "Cache-Control": "no-store" } });
}
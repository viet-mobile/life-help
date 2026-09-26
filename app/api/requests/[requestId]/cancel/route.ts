import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * POST /api/requests/{requestId}/cancel: the owner cancels a FUNDED request no Helper has taken
 * (open customer offer, or waiting for re-selection). The database cancels it and creates exactly one
 * full refund obligation; the payment record and history are kept. Owner = device-owner cookie only.
 */
export async function POST(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ success: false, code: "REQUEST_NOT_FOUND" }, { status: 404 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return NextResponse.json({ success: false, code: owner.code }, { status: owner.status });
  const { data, error } = await client.rpc("cancel_funded_request", { p_request_id: requestId, p_customer_id: owner.owner.customerId });
  if (error || !data) return NextResponse.json({ success: false, code: "CANCEL_FAILED" }, { status: 502 });
  if (!data.success) return NextResponse.json({ success: false, code: data.code }, { status: data.code === "REQUEST_NOT_FOUND" ? 404 : 409 });
  return NextResponse.json({ success: true, replayed: data.replayed === true, status: data.status, paymentStatus: data.payment_status, refundId: data.refund_id },
    { headers: { "Cache-Control": "no-store" } });
}

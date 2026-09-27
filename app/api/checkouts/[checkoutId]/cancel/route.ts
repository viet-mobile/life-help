import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * POST /api/checkouts/{checkoutId}/cancel: the owner abandons an UNPAID checkout. The database ends it
 * (CANCELLED), releases any Helper reservation and queues its photos / videos for permanent deletion
 * in the same transaction. Refused once a payment is on its way (that follows the payment path).
 * Owner = device-owner cookie only.
 */
export async function POST(_request: Request, context: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId)) return NextResponse.json({ success: false, code: "CHECKOUT_NOT_FOUND" }, { status: 404 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return NextResponse.json({ success: false, code: owner.code }, { status: owner.status });
  const { data, error } = await client.rpc("cancel_open_checkout", { p_checkout_id: checkoutId, p_customer_id: owner.owner.customerId });
  if (error || !data) return NextResponse.json({ success: false, code: "CANCEL_FAILED" }, { status: 502 });
  if (!data.success) return NextResponse.json({ success: false, code: data.code }, { status: data.code === "CHECKOUT_NOT_FOUND" ? 404 : 409 });
  return NextResponse.json({ success: true, replayed: data.replayed === true, status: data.status }, { headers: { "Cache-Control": "no-store" } });
}

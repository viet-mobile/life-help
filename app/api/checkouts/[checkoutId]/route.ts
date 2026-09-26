import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { issueConversationCapability } from "@/lib/chat/capability";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * GET /api/checkouts/{checkoutId}: the owner's checkout + payment status. Once verified payment
 * activated the request, the owner also gets the request id and its conversation capability.
 */
export async function GET(_request: Request, context: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId)) return respond(404, { success: false, code: "CHECKOUT_NOT_FOUND" });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return respond(owner.status, { success: false, code: owner.code });
  const { data: checkout } = await client.from("service_checkouts").select("id, request_mode, status, fiat_currency, fiat_amount, expires_at, request_id")
    .eq("id", checkoutId).eq("customer_id", owner.owner.customerId).maybeSingle();
  if (!checkout) return respond(404, { success: false, code: "CHECKOUT_NOT_FOUND" });
  const { data: intent } = await client.from("payment_intents").select("id, status, amount_base_units, network, expires_at").eq("checkout_id", checkoutId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  let capability: string | null = null;
  if (checkout.request_id) {
    const { data: row } = await client.from("service_requests").select("status").eq("id", checkout.request_id).maybeSingle();
    if (row && !["CANCELLED", "CLOSED"].includes(row.status)) capability = await issueConversationCapability(checkout.request_id, owner.owner.customerId);
  }
  return respond(200, {
    success: true, checkoutId, mode: checkout.request_mode, status: checkout.status, fiatCurrency: checkout.fiat_currency, fiatAmount: Number(checkout.fiat_amount),
    expiresAt: checkout.expires_at, requestId: checkout.request_id, capability,
    payment: intent ? { intentId: intent.id, status: intent.status, amountBaseUnits: String(intent.amount_base_units), network: intent.network, expiresAt: intent.expires_at } : null,
  });
}

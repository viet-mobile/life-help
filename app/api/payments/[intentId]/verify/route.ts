import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { devnetTransactionFetcher, verifyPaymentSignature } from "@/lib/payments/paymentRail";
import { dispatchPushInBackground, pushHelperAssignment, pushHelpers } from "@/lib/push/pushDelivery";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/payments/{intentId}/verify  { signature }
 * The customer tells us WHICH transaction to look at; the server reads it from the chain and the
 * database decides (exact native USDC to our recipient with our reference, successful, finalized,
 * never seen before). Only then: PAID_HELD + request activation in one transaction, then push.
 * "The browser says paid", a wallet callback or a bare signature never mark anything paid.
 */
export async function POST(request: Request, context: { params: Promise<{ intentId: string }> }) {
  const { intentId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(intentId)) return respond(404, { success: false, code: "INTENT_NOT_FOUND" });
  const body = await request.json().catch(() => null) as { signature?: unknown } | null;
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return respond(owner.status, { success: false, code: owner.code });
  const { data: intent } = await client.from("payment_intents").select("id, recipient, mint, reference, network, status")
    .eq("id", intentId).eq("customer_id", owner.owner.customerId).maybeSingle();
  if (!intent) return respond(404, { success: false, code: "INTENT_NOT_FOUND" });
  const fetchTx = await devnetTransactionFetcher();
  if (!fetchTx) return respond(503, { success: false, code: "PAYMENT_RAIL_DISABLED" });
  const verified = await verifyPaymentSignature(client, intent, typeof body?.signature === "string" ? body.signature : "", fetchTx);
  if (!verified.ok) return respond(verified.httpStatus, { success: false, code: verified.code });
  const result = verified.result as { success?: boolean; code?: string; status?: string; classification?: string; replayed?: boolean; request_id?: string | null; activation?: { request_id?: string; request_mode?: string; assignment_id?: string | null } };
  // New activation only (never on a replay): best-effort push to the Helper(s) concerned.
  const activation = result.activation;
  if (result.success && !result.replayed && activation?.request_id) {
    if (activation.request_mode === "HELPER_PRICE_SELECTED" && activation.assignment_id) {
      await dispatchPushInBackground(() => pushHelperAssignment(client, activation.request_id as string));
    } else if (activation.request_mode === "CUSTOMER_OFFER_OPEN") {
      const { data: notified } = await client.from("app_notifications").select("recipient_id").eq("type", "OPEN_CUSTOMER_OFFER").eq("payload->>request_id", activation.request_id).limit(50);
      const publicIds = (notified ?? []).map((n) => n.recipient_id as string);
      const { data: helpers } = publicIds.length ? await client.from("helpers").select("id").in("helper_id", publicIds) : { data: [] };
      await dispatchPushInBackground(() => pushHelpers(client, (helpers ?? []).map((h) => h.id as string), "OPEN_CUSTOMER_OFFER"));
    }
  }
  return respond(result.success ? 200 : 409, {
    success: result.success === true, code: result.code ?? null, paymentStatus: result.status ?? null, classification: result.classification ?? null,
    replayed: result.replayed === true, requestId: activation?.request_id ?? result.request_id ?? null,
  });
}

import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { dispatchHelperPayout } from "@/lib/payments/paymentRail";
import { dispatchPushInBackground, pushHelpers } from "@/lib/push/pushDelivery";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

const CONFLICT = new Set(["SERVICE_NOT_COMPLETED", "PAYMENT_NOT_HELD", "PRICE_AGREEMENT_MISSING", "HELPER_COMPLETION_MISSING", "REVIEW_REQUIRED"]);

/**
 * POST /api/requests/{requestId}/complete: the customer's "서비스 완료".
 *
 * Owner ONLY: the private device-owner cookie must own the request. A public 8-letter ID, ?ref=,
 * the request id, a conversation capability or a Helper session never authorizes this.
 * The database, atomically and exactly once: confirmation + RELEASE_AUTHORIZED + one Helper payout
 * obligation (+ any price-difference refund) + media deletion scheduling. Repeats return the same
 * result. The payout instruction is dispatched immediately; it is never reported as paid until the
 * payout rail confirms.
 */
export async function POST(_request: Request, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ success: false, code: "REQUEST_NOT_FOUND" }, { status: 404 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return NextResponse.json({ success: false, code: owner.code }, { status: owner.status });
  const { data, error } = await client.rpc("confirm_service_completion", { p_request_id: requestId, p_customer_id: owner.owner.customerId });
  if (error || !data) return NextResponse.json({ success: false, code: "CONFIRMATION_FAILED" }, { status: 502 });
  if (!data.success) {
    const code = String(data.code);
    return NextResponse.json({ success: false, code }, { status: code === "REQUEST_NOT_FOUND" ? 404 : CONFLICT.has(code) ? 409 : 400 });
  }
  let payout: Awaited<ReturnType<typeof dispatchHelperPayout>> | null = null;
  if (!data.replayed && data.payout_obligation_id) {
    payout = await dispatchHelperPayout(client, String(data.payout_obligation_id));
    const { data: obligation } = await client.from("payout_obligations").select("helper_id").eq("id", data.payout_obligation_id).maybeSingle();
    if (obligation?.helper_id) await dispatchPushInBackground(() => pushHelpers(client, [obligation.helper_id as string], "PAYOUT_UPDATE"));
  }
  return NextResponse.json({
    success: true, replayed: data.replayed === true, requestId, paymentStatus: data.payment_status, requestStatus: data.request_status,
    payoutObligationId: data.payout_obligation_id ?? null, payoutSubmitted: payout?.submitted ?? false,
  }, { headers: { "Cache-Control": "no-store" } });
}

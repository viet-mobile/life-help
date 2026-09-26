import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { dispatchPushInBackground, pushCustomerStatus } from "@/lib/push/pushDelivery";

const CONFLICT = new Set(["REQUEST_ALREADY_ACCEPTED", "REQUEST_NOT_OPEN", "HELPER_NOT_ELIGIBLE", "REQUEST_NOT_AVAILABLE"]);

/**
 * POST /api/helper/open-offers/{requestId}  { action: "ACCEPT" | "DECLINE" }
 * ACCEPT: the Helper voluntarily takes the customer's FUNDED terms exactly as offered (the database
 * serializes concurrent acceptances on the request row: exactly one wins; the rest get
 * REQUEST_ALREADY_ACCEPTED with nothing written). DECLINE: the Helper never sees this request again;
 * it stays open for others, the customer's payment stays held. There is no price field: a Helper
 * cannot change the customer's offer.
 */
export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return NextResponse.json({ success: false, code: resolved.code }, { status: resolved.status });
  const { requestId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ success: false, code: "REQUEST_NOT_FOUND" }, { status: 404 });
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  const action = body?.action;
  if (action !== "ACCEPT" && action !== "DECLINE") return NextResponse.json({ success: false, code: "VALIDATION_ERROR" }, { status: 400 });
  const { client, helper } = resolved.value;
  const { data, error } = await client.rpc(action === "ACCEPT" ? "accept_customer_offer_request" : "decline_customer_offer_request", { p_helper_id: helper.id, p_request_id: requestId });
  if (error || !data) return NextResponse.json({ success: false, code: "OFFER_ACTION_FAILED" }, { status: 502 });
  if (!data.success) {
    const code = String(data.code);
    return NextResponse.json({ success: false, code }, { status: code === "REQUEST_NOT_FOUND" ? 404 : CONFLICT.has(code) ? 409 : 400 });
  }
  // The customer learns a Helper took the request (in-app record written by the database; push best effort).
  if (action === "ACCEPT" && !data.replayed) await dispatchPushInBackground(() => pushCustomerStatus(client, requestId));
  return NextResponse.json({
    success: true, replayed: data.replayed === true, requestId,
    ...(action === "ACCEPT" ? { status: data.status ?? "MATCHED", assignmentId: data.assignment_id ?? null, agreed: data.currency ? { currency: data.currency, amount: Number(data.agreed_amount) } : null } : {}),
  }, { headers: { "Cache-Control": "no-store" } });
}

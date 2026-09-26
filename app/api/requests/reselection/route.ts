import { NextResponse } from "next/server";
import { IDEMPOTENCY_HEADER } from "@/lib/request/idempotencyKey";
import { MAX_REQUEST_BODY_BYTES, validateIdempotencyKey } from "@/lib/request/serverRequest";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { listOwnedReselections, loadOwnedReselection } from "@/lib/request/reselection";
import { readOfferToken } from "@/lib/pricing/offerToken";
import { dispatchPushInBackground, pushHelperAssignment } from "@/lib/push/pushDelivery";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const CONFLICT_CODES = new Set(["PRICE_CHANGED", "HELPER_NO_LONGER_AVAILABLE", "OFFER_UNAVAILABLE", "HELPER_PREVIOUSLY_DECLINED", "REQUEST_NOT_RESELECTABLE"]);

/** GET: the owner's requests waiting for a new Helper choice (device-owner cookie only). */
export async function GET() {
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return respond(owner.status, { success: false, code: owner.code });
  return respond(200, { success: true, requests: await listOwnedReselections(client, owner.owner.customerId) });
}

/**
 * POST /api/requests/reselection  { request_id, offer_token }  + Idempotency-Key
 *
 * The owner explicitly accepts one fresh offer for a CUSTOMER_RESELECTION_REQUIRED request.
 * Authority, all server-side:
 *   owner    -> HttpOnly device-owner cookie (never a public ID, ?ref= or body customer id)
 *   request  -> must be owned by that customer AND named inside the offer token
 *   offer    -> opaque token for the SAME service / detailed service (price row + revision + helper)
 *   terms    -> re-read from the ACTIVE offer by reselect_customer_helper
 * The database atomically writes the new price-selection version, the new assignment and MATCHED,
 * or nothing. Replaying the same accepted offer returns the same result without new rows or push;
 * any other offer once the request is MATCHED is refused (REQUEST_NOT_RESELECTABLE).
 */
export async function POST(request: Request) {
  const key = validateIdempotencyKey(request.headers.get(IDEMPOTENCY_HEADER));
  if (!key.ok) return respond(key.error.httpStatus, key.error.body as Record<string, unknown>);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_REQUEST_BODY_BYTES) return respond(413, { success: false, code: "PAYLOAD_TOO_LARGE" });
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return respond(400, { success: false, code: "INVALID_JSON" });
  }

  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return respond(owner.status, { success: false, code: owner.code });

  const offer = await readOfferToken(body.offer_token);
  if (!offer.ok) return respond(offer.code === "OFFER_EXPIRED" ? 409 : 400, { success: false, code: offer.code });
  const requestId = typeof body.request_id === "string" ? body.request_id : "";
  // The token must have been issued for exactly this request (a new-request offer never re-selects).
  if (!offer.claims.requestId || offer.claims.requestId !== requestId) return respond(400, { success: false, code: "OFFER_INVALID" });

  const lookup = await loadOwnedReselection(client, owner.owner.customerId, requestId, { allowMatched: true });
  if (!lookup.ok) return respond(lookup.httpStatus, { success: false, code: lookup.code });
  if (offer.claims.serviceCode !== lookup.value.serviceCode || offer.claims.subitemCode !== lookup.value.subitemCode) {
    return respond(400, { success: false, code: "OFFER_SERVICE_MISMATCH" });
  }

  const { data, error } = await client.rpc("reselect_customer_helper", {
    p_request_id: requestId,
    p_customer_id: owner.owner.customerId,
    p_price_id: offer.claims.priceId,
    p_price_revision: offer.claims.revision,
  });
  if (error || !data) {
    console.error("[api/requests/reselection] reselection failed", { code: error?.code });
    return respond(502, { success: false, code: "RESELECTION_FAILED" });
  }
  if (!data.success) {
    const code = String(data.code || "RESELECTION_REJECTED");
    return respond(code === "REQUEST_NOT_FOUND" ? 404 : CONFLICT_CODES.has(code) ? 409 : 400, { success: false, code });
  }
  // New assignment only: push the newly selected Helper once (never on a replay).
  if (!data.replayed) await dispatchPushInBackground(() => pushHelperAssignment(client, requestId));
  return respond(data.replayed ? 200 : 201, {
    success: true,
    requestId,
    status: data.status,
    selectionVersion: data.selection_version,
    ...(data.replayed ? { replayed: true } : { agreed: { currency: data.currency, initialPayableAmount: Number(data.initial_payable_amount) } }),
  });
}

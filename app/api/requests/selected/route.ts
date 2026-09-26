import { NextResponse } from "next/server";
import { IDEMPOTENCY_HEADER } from "@/lib/request/idempotencyKey";
import { MAX_REQUEST_BODY_BYTES, deriveRequestIdFromIdempotencyKey, validateCreateServiceRequest, validateIdempotencyKey } from "@/lib/request/serverRequest";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { formatCustomerDisplayName } from "@/lib/id/customerDisplayName";
import { readOfferToken } from "@/lib/pricing/offerToken";
import { dispatchPushInBackground, pushHelperAssignment } from "@/lib/push/pushDelivery";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { refuseUnlessLegacyTestCompat } from "@/lib/request/prepaidGate";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const CONFLICT_CODES = new Set(["PRICE_CHANGED", "HELPER_NO_LONGER_AVAILABLE", "OFFER_UNAVAILABLE", "IDEMPOTENCY_KEY_CONFLICT"]);

/**
 * POST /api/requests/selected  (CUSTOMER_SELECTED_HELPER path)
 *
 * The customer confirmed one displayed offer. Authority, all server-side:
 *   owner   -> HttpOnly device-owner cookie (resolveCustomerOwner); never a public ID / ?ref=
 *   offer   -> opaque offer_token (price row + revision + helper + sub-item + expiry)
 *   terms   -> re-read from the ACTIVE offer inside create_customer_selected_request
 * Any helper id, amount, currency, pricing mode, materials or surcharge sent by the client is
 * ignored. The database atomically creates the request, the immutable price snapshot and the
 * assignment to exactly that helper, or writes nothing (PRICE_CHANGED / HELPER_NO_LONGER_AVAILABLE
 * / OFFER_UNAVAILABLE). No other helper is ever substituted.
 */
export async function POST(request: Request) {
  // Prepaid invariant: customers now go through /api/checkouts (payment first). This unpaid path is
  // internal legacy test compatibility only (operator token; rows marked legacy_unfunded).
  const refused = await refuseUnlessLegacyTestCompat(request);
  if (refused) return refused;
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
  // A re-selection offer is bound to its request and can never open a new one.
  if (offer.claims.requestId) return respond(400, { success: false, code: "OFFER_INVALID" });

  // The request's service always comes from the offer, and the owner from the cookie.
  const validation = validateCreateServiceRequest({ ...body, customer_id: owner.owner.customerId, service_slug: offer.claims.serviceCode });
  if (!validation.ok) return respond(validation.error.httpStatus, validation.error.body as Record<string, unknown>);
  const input = validation.value;
  const requestId = await deriveRequestIdFromIdempotencyKey(key.value);

  const { data, error } = await client.rpc("create_customer_selected_request", {
    p_request_id: requestId,
    p_customer_id: input.customer_id,
    p_customer_display_name: formatCustomerDisplayName(input.customer_id, input.customer_locale),
    p_customer_locale: input.customer_locale,
    p_country: input.country,
    p_sido: input.sido,
    p_gungu: input.gungu,
    p_dong: input.dong,
    p_address: input.address,
    p_description: input.description,
    p_selected_options: input.selected_options,
    p_price_id: offer.claims.priceId,
    p_price_revision: offer.claims.revision,
  });
  if (error || !data) {
    console.error("[api/requests/selected] selection failed", { code: error?.code });
    return respond(502, { success: false, code: "SELECTION_FAILED" });
  }
  if (!data.success) {
    const code = String(data.code || "SELECTION_REJECTED");
    return respond(CONFLICT_CODES.has(code) ? 409 : 400, { success: false, code });
  }

  // Best-effort helper push, only when this call created the assignment (never on a replay).
  if (!data.replayed) await dispatchPushInBackground(() => pushHelperAssignment(client, requestId));
  return respond(data.replayed ? 200 : 201, {
    success: true,
    requestId,
    status: data.status,
    ...(data.replayed ? { replayed: true } : { assignmentId: data.assignment_id, conversationId: data.conversation_id, agreed: { currency: data.currency, initialPayableAmount: Number(data.initial_payable_amount) } }),
  });
}

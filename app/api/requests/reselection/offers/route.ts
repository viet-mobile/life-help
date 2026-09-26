import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { loadOwnedReselection } from "@/lib/request/reselection";
import { toPublicOffers, type OfferRow } from "@/lib/pricing/publicOffers";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * GET /api/requests/reselection/offers?requestId=
 * Fresh offers for the owner's CUSTOMER_RESELECTION_REQUIRED request: same service and detailed
 * service, request region, ACTIVE prices of available Helpers (on duty, qualified, not busy), minus
 * every Helper who declined / timed out on this request. Loaded fresh on every call; each offer
 * token is bound to this request. The request id alone authorizes nothing: the device-owner cookie
 * must own the request.
 */
export async function GET(request: Request) {
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return respond(owner.status, { success: false, code: owner.code });
  const lookup = await loadOwnedReselection(client, owner.owner.customerId, new URL(request.url).searchParams.get("requestId") ?? "");
  if (!lookup.ok) return respond(lookup.httpStatus, { success: false, code: lookup.code });
  const ctx = lookup.value;
  const { data, error } = await client.rpc("list_customer_offers", { p_service_code: ctx.serviceCode, p_subitem_code: ctx.subitemCode, p_country: ctx.country, p_sido: ctx.sido, p_gungu: ctx.gungu });
  if (error) return respond(502, { success: false, code: "OFFERS_UNAVAILABLE" });
  const rows = ((data ?? []) as OfferRow[]).filter((row) => !ctx.excludedHelperIds.includes(row.helper_id));
  const offers = await toPublicOffers(rows, { requestId: ctx.requestId });
  if (!offers) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  return respond(200, { success: true, requestId: ctx.requestId, serviceCode: ctx.serviceCode, subitemCode: ctx.subitemCode, offers });
}

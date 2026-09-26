import { NextResponse } from "next/server";
import { CORE_SERVICE_SLUGS } from "@/lib/request/serverRequest";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { toPublicOffers, type OfferRow } from "@/lib/pricing/publicOffers";

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * GET /api/pricing/offers?service=&subitem=&country=&sido=&gungu=
 * Customer price preview BEFORE any request exists: helpers that are active, on duty, qualified,
 * in the region, not busy, with an ACTIVE price for the detailed service. Internal ids are replaced
 * by an opaque offer token; no names, emails, auth ids or payout data are returned.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const service = params.get("service") ?? "", subitem = params.get("subitem") ?? "";
  const country = params.get("country") ?? "", sido = params.get("sido") ?? "", gungu = params.get("gungu") ?? "";
  if (!(CORE_SERVICE_SLUGS as readonly string[]).includes(service) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(subitem) || !/^[A-Z]{2}$/.test(country) || !sido || sido.length > 100 || gungu.length > 100) {
    return respond({ success: false, code: "VALIDATION_ERROR" }, 400);
  }
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond({ success: false, code: "SERVICE_UNAVAILABLE" }, 503);
  const { data, error } = await client.rpc("list_customer_offers", { p_service_code: service, p_subitem_code: subitem, p_country: country, p_sido: sido, p_gungu: gungu });
  if (error) return respond({ success: false, code: "OFFERS_UNAVAILABLE" }, 502);
  const offers = await toPublicOffers((data ?? []) as OfferRow[]);
  if (!offers) return respond({ success: false, code: "SERVICE_UNAVAILABLE" }, 503);
  return respond({ success: true, offers });
}

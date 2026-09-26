import { NextResponse } from "next/server";
import { CORE_SERVICE_SLUGS } from "@/lib/request/serverRequest";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { issueOfferToken } from "@/lib/pricing/offerToken";
import type { PublicOffer } from "@/lib/pricing/pricingTerms";

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

type OfferRow = {
  price_id: string; revision: number; helper_id: string; helper_alias: string; rating: number | null; completed_jobs: number | null;
  spoken_locales: string[] | null; service_code: string; subitem_code: string; pricing_mode: PublicOffer["pricingMode"];
} & Omit<PublicOffer, "offerToken" | "helperAlias" | "rating" | "completedJobs" | "spokenLocales" | "serviceCode" | "subitemCode" | "pricingMode">;

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
  const offers: PublicOffer[] = [];
  for (const row of (data ?? []) as OfferRow[]) {
    const offerToken = await issueOfferToken({ priceId: row.price_id, revision: row.revision, helperId: row.helper_id, serviceCode: row.service_code, subitemCode: row.subitem_code });
    if (!offerToken) return respond({ success: false, code: "SERVICE_UNAVAILABLE" }, 503);
    offers.push({
      offerToken,
      helperAlias: row.helper_alias,
      rating: row.rating,
      completedJobs: row.completed_jobs,
      spokenLocales: row.spoken_locales ?? [],
      serviceCode: row.service_code,
      subitemCode: row.subitem_code,
      pricingMode: row.pricing_mode,
      currency: row.currency,
      base_price: row.base_price,
      minimum_charge: row.minimum_charge,
      included_quantity: row.included_quantity,
      included_minutes: row.included_minutes,
      extra_unit_price: row.extra_unit_price,
      extra_hour_price: row.extra_hour_price,
      materials_policy: row.materials_policy,
      materials_note: row.materials_note,
      emergency_multiplier: row.emergency_multiplier,
      night_multiplier: row.night_multiplier,
      weekend_multiplier: row.weekend_multiplier,
      tax_included: row.tax_included,
    });
  }
  return respond({ success: true, offers });
}

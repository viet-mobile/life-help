import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";

/**
 * GET /api/helper/open-offers: funded customer offers (CUSTOMER_OFFER_OPEN, OPEN_FOR_HELPERS) this
 * authenticated Helper may accept: qualified service + detailed service, region, on duty, not busy,
 * not previously declined / released. Coarse region and customer terms only (no customer identity,
 * address, contact, description or payment data). Helper identity: Supabase Auth only.
 */
export async function GET(request: Request) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return NextResponse.json({ success: false, code: resolved.code }, { status: resolved.status });
  const { data, error } = await resolved.value.client.rpc("list_open_customer_offers", { p_helper_id: resolved.value.helper.id });
  if (error) return NextResponse.json({ success: false, code: "OFFERS_UNAVAILABLE" }, { status: 502 });
  const offers = (Array.isArray(data) ? data : []).map((o: Record<string, unknown>) => ({
    requestId: o.request_id, serviceCode: o.service_code, subitemCode: o.subitem_code, sido: o.sido, gungu: o.gungu,
    currency: o.currency, offeredAmount: Number(o.offered_amount), pricingMode: o.pricing_mode,
    includedQuantity: o.included_quantity, includedMinutes: o.included_minutes, materialsPolicy: o.materials_policy,
    materialsNote: o.materials_note, publicNote: o.public_note, preferredWindow: o.preferred_window, fundedAt: o.funded_at,
  }));
  return NextResponse.json({ success: true, offers }, { headers: { "Cache-Control": "no-store" } });
}

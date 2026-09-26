import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { sanitizeTerms } from "@/lib/pricing/pricingTerms";

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Helper price management (authenticated helper only: Supabase Auth -> helpers.auth_user_id).
 * A helper only ever reads and writes its own offers; no helper id is accepted from the client.
 *
 * GET: qualified services, their detailed-service catalog, and the helper's own offers.
 */
export async function GET(request: Request) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return respond({ success: false, code: resolved.code }, resolved.status);
  const { helper, client } = resolved.value;
  const [{ data: qualified }, { data: catalog }, { data: prices }] = await Promise.all([
    client.from("helper_services").select("service_slug").eq("helper_id", helper.id),
    client.from("service_subitems").select("id, service_code, subitem_code, allowed_pricing_modes, default_pricing_mode, sort_order").eq("active", true).order("sort_order"),
    client.from("helper_service_prices").select("id, service_subitem_id, pricing_mode, currency, base_price, minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note, emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, status, revision, updated_at").eq("helper_id", helper.id),
  ]);
  const services = (qualified ?? []).map((row) => row.service_slug);
  return respond({
    success: true,
    services,
    catalog: (catalog ?? []).filter((item) => services.includes(item.service_code)),
    prices: prices ?? [],
  });
}

/**
 * PUT: save terms for one detailed service. Body: { service_code, subitem_code, terms, publish }.
 * publish=false saves a DRAFT (offer goes offline); publish=true saves and publishes, which the
 * database accepts only when the terms are complete for the pricing mode.
 */
export async function PUT(request: Request) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return respond({ success: false, code: resolved.code }, resolved.status);
  const body = await request.json().catch(() => null) as { service_code?: unknown; subitem_code?: unknown; terms?: unknown; publish?: unknown } | null;
  const terms = sanitizeTerms(body?.terms);
  if (typeof body?.service_code !== "string" || typeof body?.subitem_code !== "string" || !terms) return respond({ success: false, code: "VALIDATION_ERROR" }, 400);
  const { data, error } = await resolved.value.client.rpc("upsert_helper_service_price", {
    p_helper_id: resolved.value.helper.id,
    p_service_code: body.service_code,
    p_subitem_code: body.subitem_code,
    p_terms: terms,
    p_publish: body.publish === true,
  });
  if (error || !data) return respond({ success: false, code: "SAVE_FAILED" }, 502);
  if (!data.success) return respond({ success: false, code: data.code, reason: data.reason ?? null }, 422);
  return respond({ success: true, priceId: data.price_id, status: data.status, revision: data.revision });
}

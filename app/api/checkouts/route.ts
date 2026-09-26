import { NextResponse } from "next/server";
import { MAX_REQUEST_BODY_BYTES, validateCreateServiceRequest } from "@/lib/request/serverRequest";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { formatCustomerDisplayName } from "@/lib/id/customerDisplayName";
import { readOfferToken } from "@/lib/pricing/offerToken";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isStagingTestOperator } from "@/lib/request/prepaidGate";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const CONFLICT = new Set(["PRICE_CHANGED", "HELPER_NO_LONGER_AVAILABLE", "OFFER_UNAVAILABLE"]);
const OFFER_FIELDS = ["pricing_mode", "currency", "offered_amount", "included_quantity", "included_minutes", "materials_policy", "materials_note", "public_note", "preferred_window"] as const;
// Contact data never belongs in a note shown to Helpers.
const CONTACT_PATTERN = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?\d[\d\s-]{7,}\d)|https?:\/\//i;

/**
 * POST /api/checkouts: the ONLY way a customer starts a service request (prepaid invariant).
 * Nothing becomes a request here: a checkout is activated only after verified payment.
 *
 *   { mode: "HELPER_PRICE_SELECTED", offer_token, ...form }   customer accepts a Helper's price
 *   { mode: "CUSTOMER_OFFER_OPEN", service_slug, subitem_code, offer: {...}, ...form }
 *                                                              customer proposes (and will prepay) a price
 * Owner = device-owner cookie. Helper / price / revision come from the opaque token; customer offer
 * terms are validated by the database and become immutable; amounts / currency / Helper sent any
 * other way are ignored.
 */
export async function POST(request: Request) {
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
  const customerId = owner.owner.customerId;
  // Staging harness only (operator token on the staging project): purgeable test fixture.
  const testFixture = await isStagingTestOperator(request);

  if (body.mode === "HELPER_PRICE_SELECTED") {
    const offer = await readOfferToken(body.offer_token);
    if (!offer.ok) return respond(offer.code === "OFFER_EXPIRED" ? 409 : 400, { success: false, code: offer.code });
    if (offer.claims.requestId) return respond(400, { success: false, code: "OFFER_INVALID" });
    const form = validateCreateServiceRequest({ ...body, customer_id: customerId, service_slug: offer.claims.serviceCode });
    if (!form.ok) return respond(form.error.httpStatus, form.error.body as Record<string, unknown>);
    const input = form.value;
    const { data, error } = await client.rpc("create_helper_price_checkout", {
      p_customer_id: customerId, p_customer_display_name: formatCustomerDisplayName(customerId, input.customer_locale), p_customer_locale: input.customer_locale,
      p_country: input.country, p_sido: input.sido, p_gungu: input.gungu, p_dong: input.dong, p_address: input.address, p_description: input.description,
      p_selected_options: input.selected_options, p_price_id: offer.claims.priceId, p_price_revision: offer.claims.revision, p_test_fixture: testFixture,
    });
    if (error || !data) return respond(502, { success: false, code: "CHECKOUT_FAILED" });
    if (!data.success) return respond(CONFLICT.has(String(data.code)) ? 409 : 400, { success: false, code: String(data.code) });
    return respond(201, { success: true, checkoutId: data.checkout_id, mode: data.request_mode, fiatCurrency: data.fiat_currency, fiatAmount: Number(data.fiat_amount), expiresAt: data.expires_at });
  }

  if (body.mode === "CUSTOMER_OFFER_OPEN") {
    const form = validateCreateServiceRequest({ ...body, customer_id: customerId });
    if (!form.ok) return respond(form.error.httpStatus, form.error.body as Record<string, unknown>);
    const input = form.value;
    const rawOffer = (typeof body.offer === "object" && body.offer !== null ? body.offer : {}) as Record<string, unknown>;
    const offer = Object.fromEntries(OFFER_FIELDS.filter((k) => rawOffer[k] !== undefined && rawOffer[k] !== null).map((k) => [k, String(rawOffer[k]).trim()]));
    if ([offer.public_note, offer.preferred_window, offer.materials_note].some((v) => v && CONTACT_PATTERN.test(v))) return respond(400, { success: false, code: "CONTACT_DETAILS_NOT_ALLOWED" });
    const { data, error } = await client.rpc("create_customer_offer_checkout", {
      p_customer_id: customerId, p_customer_display_name: formatCustomerDisplayName(customerId, input.customer_locale), p_customer_locale: input.customer_locale,
      p_country: input.country, p_sido: input.sido, p_gungu: input.gungu, p_dong: input.dong, p_address: input.address, p_description: input.description,
      p_selected_options: input.selected_options, p_service_code: input.service_slug, p_subitem_code: typeof body.subitem_code === "string" ? body.subitem_code : "",
      p_offer: offer, p_test_fixture: testFixture,
    });
    if (error || !data) return respond(502, { success: false, code: "CHECKOUT_FAILED" });
    if (!data.success) return respond(400, { success: false, code: String(data.code), reason: data.reason ?? null });
    return respond(201, { success: true, checkoutId: data.checkout_id, mode: data.request_mode, fiatCurrency: data.fiat_currency, fiatAmount: Number(data.fiat_amount), expiresAt: data.expires_at });
  }
  return respond(400, { success: false, code: "INVALID_MODE" });
}

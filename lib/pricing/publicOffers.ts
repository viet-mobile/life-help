import "server-only";
import { issueOfferToken } from "@/lib/pricing/offerToken";
import type { PublicOffer } from "@/lib/pricing/pricingTerms";

/** One row of list_customer_offers (service-role RPC). Internal ids never leave the server. */
export type OfferRow = {
  price_id: string; revision: number; helper_id: string; helper_alias: string; rating: number | null; completed_jobs: number | null;
  spoken_locales: string[] | null; service_code: string; subitem_code: string; pricing_mode: PublicOffer["pricingMode"];
} & Omit<PublicOffer, "offerToken" | "helperAlias" | "rating" | "completedJobs" | "spokenLocales" | "serviceCode" | "subitemCode" | "pricingMode">;

/**
 * Maps offer rows to the public shape: internal ids replaced by an opaque offer token (optionally
 * bound to one request for re-selection). No names, emails, auth ids or payout data. Null when the
 * token key is unavailable.
 */
export async function toPublicOffers(rows: OfferRow[], binding: { requestId?: string } = {}): Promise<PublicOffer[] | null> {
  const offers: PublicOffer[] = [];
  for (const row of rows) {
    const offerToken = await issueOfferToken({ priceId: row.price_id, revision: row.revision, helperId: row.helper_id, serviceCode: row.service_code, subitemCode: row.subitem_code, ...(binding.requestId ? { requestId: binding.requestId } : {}) });
    if (!offerToken) return null;
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
  return offers;
}

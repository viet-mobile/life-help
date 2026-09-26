// Helper-defined pricing: shared vocabulary, client-side validation (mirrors the DB constraints in
// 202609260012_helper_service_pricing.sql, which remain authoritative) and customer-facing
// formatting. No imports: used by server routes, client components and deterministic tests.

export const PRICING_MODES = ["FIXED", "HOURLY", "PER_UNIT", "PER_METER", "PER_AREA", "DIAGNOSTIC_PLUS_QUOTE"] as const;
export const MATERIALS_POLICIES = ["INCLUDED", "EXCLUDED", "PARTIALLY_INCLUDED", "QUOTE_REQUIRED"] as const;
export const PRICE_STATUSES = ["DRAFT", "ACTIVE", "PAUSED"] as const;

export type PricingMode = (typeof PRICING_MODES)[number];
export type MaterialsPolicy = (typeof MATERIALS_POLICIES)[number];

/** Terms as edited by a helper (all optional while DRAFT). */
export type PriceTerms = {
  pricing_mode: PricingMode;
  currency?: string | null;
  base_price?: number | null;
  minimum_charge?: number | null;
  included_quantity?: number | null;
  included_minutes?: number | null;
  extra_unit_price?: number | null;
  extra_hour_price?: number | null;
  materials_policy?: MaterialsPolicy | null;
  materials_note?: string | null;
  emergency_multiplier?: number | null;
  night_multiplier?: number | null;
  weekend_multiplier?: number | null;
  tax_included?: boolean | null;
};

/** Customer-visible offer (no internal ids; `offerToken` is opaque). */
export type PublicOffer = Omit<PriceTerms, "pricing_mode"> & {
  offerToken: string;
  helperAlias: string;
  rating: number | null;
  completedJobs: number | null;
  spokenLocales: string[];
  serviceCode: string;
  subitemCode: string;
  pricingMode: PricingMode;
};

const TERM_NUMBERS = ["base_price", "minimum_charge", "included_quantity", "included_minutes", "extra_unit_price", "extra_hour_price", "emergency_multiplier", "night_multiplier", "weekend_multiplier"] as const;

/** Keeps only known term fields with sane types; everything else from the client is dropped. */
export function sanitizeTerms(input: unknown): PriceTerms | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (!PRICING_MODES.includes(raw.pricing_mode as PricingMode)) return null;
  const out: PriceTerms = { pricing_mode: raw.pricing_mode as PricingMode };
  for (const key of TERM_NUMBERS) {
    const value = raw[key];
    if (value === undefined || value === null || value === "") continue;
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return null;
    (out as Record<string, unknown>)[key] = key === "included_minutes" ? Math.trunc(num) : num;
  }
  if (typeof raw.currency === "string" && raw.currency.trim()) out.currency = raw.currency.trim().toUpperCase();
  if (MATERIALS_POLICIES.includes(raw.materials_policy as MaterialsPolicy)) out.materials_policy = raw.materials_policy as MaterialsPolicy;
  if (typeof raw.materials_note === "string" && raw.materials_note.trim()) out.materials_note = raw.materials_note.trim().slice(0, 300);
  if (typeof raw.tax_included === "boolean") out.tax_included = raw.tax_included;
  return out;
}

/** Problems that would block publication (empty = publishable). Mirrors helper_price_active_complete. */
export function publishProblems(terms: PriceTerms): string[] {
  const problems: string[] = [];
  const nonNegative = ["base_price", "minimum_charge", "extra_unit_price", "extra_hour_price"] as const;
  if (!terms.currency || !/^[A-Z]{3}$/.test(terms.currency)) problems.push("currency");
  if (!terms.materials_policy) problems.push("materials_policy");
  if (!(Number(terms.base_price) > 0)) problems.push("base_price");
  for (const key of nonNegative) if (terms[key] != null && Number(terms[key]) < 0) problems.push(key);
  if (terms.pricing_mode === "HOURLY" && !(Number(terms.included_minutes) >= 15 && Number(terms.included_minutes) <= 1440)) problems.push("included_minutes");
  if (terms.included_quantity != null && !(Number(terms.included_quantity) > 0)) problems.push("included_quantity");
  if (terms.included_minutes != null && !(Number(terms.included_minutes) >= 1 && Number(terms.included_minutes) <= 1440)) problems.push("included_minutes");
  for (const key of ["emergency_multiplier", "night_multiplier", "weekend_multiplier"] as const) {
    if (terms[key] != null && !(Number(terms[key]) >= 1 && Number(terms[key]) <= 3)) problems.push(key);
  }
  if (terms.pricing_mode === "DIAGNOSTIC_PLUS_QUOTE" && terms.materials_policy === "INCLUDED") problems.push("materials_policy");
  if (terms.pricing_mode === "DIAGNOSTIC_PLUS_QUOTE" && terms.minimum_charge != null) problems.push("minimum_charge");
  return [...new Set(problems)];
}

/** Initial agreed amount (same rule as create_customer_selected_request). Surcharges excluded. */
export function initialPayableAmount(terms: PriceTerms): number | null {
  const base = Number(terms.base_price);
  if (!(base > 0)) return null;
  const min = Number(terms.minimum_charge ?? 0);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  switch (terms.pricing_mode) {
    case "HOURLY": return Number(terms.included_minutes) > 0 ? Math.max(min, round2((base * Number(terms.included_minutes)) / 60)) : null;
    case "PER_UNIT":
    case "PER_METER":
    case "PER_AREA": return Math.max(min, round2(base * Number(terms.included_quantity ?? 1)));
    default: return base; // FIXED price, or the DIAGNOSTIC_PLUS_QUOTE diagnostic fee only
  }
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined, locale = "en"): string {
  if (amount == null || !currency) return "-";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** i18n key for the unit shown after base_price. */
export function unitKey(mode: PricingMode): string | null {
  return ({ HOURLY: "pricing.perHour", PER_UNIT: "pricing.perUnit", PER_METER: "pricing.perMeter", PER_AREA: "pricing.perArea" } as Record<string, string>)[mode] ?? null;
}

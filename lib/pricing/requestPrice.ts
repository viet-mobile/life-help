import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Commercial price authority for a service request (migration 013).
 *
 *   CUSTOMER_SELECTED request -> its CURRENT accepted request_price_selections row (status ACCEPTED).
 *     Ended versions (declined / timed-out Helpers) are history only and never the final price.
 *   request_price_snapshots (migration 012) is a frozen legacy record: every 012 snapshot was
 *     backfilled as selection v1, so it is read only as a fallback for a request that has no
 *     selection rows at all (none exist after the 013 backfill).
 *   AUTO_MATCH request -> no agreed price (no Helper price was selected).
 *
 * No payment provider exists: this is the agreed amount only, never a payment record.
 */
export type AgreedPrice = {
  source: "SELECTION" | "LEGACY_SNAPSHOT";
  selectionVersion: number | null;
  currency: string;
  initialPayableAmount: number;
  pricingMode: string;
  quoteRequired: boolean;
  serviceCode: string;
  subitemCode: string;
  acceptedAt: string | null;
};

export type PriceHistoryEntry = {
  version: number;
  status: "ACCEPTED" | "ENDED";
  endedReason: string | null;
  currency: string;
  initialPayableAmount: number;
  pricingMode: string;
  acceptedAt: string;
  endedAt: string | null;
};

const SELECTION_FIELDS = "selection_version, status, ended_reason, currency, initial_payable_amount, pricing_mode, quote_required, service_code, subitem_code, accepted_at, ended_at";

type SelectionRow = {
  selection_version: number; status: "ACCEPTED" | "ENDED"; ended_reason: string | null; currency: string; initial_payable_amount: number | string;
  pricing_mode: string; quote_required: boolean; service_code: string; subitem_code: string; accepted_at: string; ended_at: string | null;
};

/** The current agreed price, or null (AUTO_MATCH, or a customer-selected request awaiting re-selection). */
export async function loadCurrentAgreedPrice(client: SupabaseClient, requestId: string): Promise<AgreedPrice | null> {
  const { data: rows } = await client.from("request_price_selections").select(SELECTION_FIELDS).eq("request_id", requestId).order("selection_version", { ascending: false });
  const selections = (rows ?? []) as SelectionRow[];
  const current = selections.find((row) => row.status === "ACCEPTED");
  if (current) {
    return {
      source: "SELECTION", selectionVersion: current.selection_version, currency: current.currency, initialPayableAmount: Number(current.initial_payable_amount),
      pricingMode: current.pricing_mode, quoteRequired: current.quote_required, serviceCode: current.service_code, subitemCode: current.subitem_code, acceptedAt: current.accepted_at,
    };
  }
  if (selections.length) return null; // every version ended: no current agreement
  const { data: legacy } = await client.from("request_price_snapshots").select("currency, initial_payable_amount, pricing_mode, quote_required, service_code, subitem_code, agreed_at").eq("request_id", requestId).maybeSingle();
  if (!legacy) return null;
  return {
    source: "LEGACY_SNAPSHOT", selectionVersion: null, currency: legacy.currency, initialPayableAmount: Number(legacy.initial_payable_amount),
    pricingMode: legacy.pricing_mode, quoteRequired: legacy.quote_required, serviceCode: legacy.service_code, subitemCode: legacy.subitem_code, acceptedAt: legacy.agreed_at,
  };
}

/** Every accepted agreement of the request, oldest first (no Helper identity). */
export async function loadPriceHistory(client: SupabaseClient, requestId: string): Promise<PriceHistoryEntry[]> {
  const { data: rows } = await client.from("request_price_selections").select(SELECTION_FIELDS).eq("request_id", requestId).order("selection_version", { ascending: true });
  return ((rows ?? []) as SelectionRow[]).map((row) => ({
    version: row.selection_version, status: row.status, endedReason: row.ended_reason, currency: row.currency, initialPayableAmount: Number(row.initial_payable_amount),
    pricingMode: row.pricing_mode, acceptedAt: row.accepted_at, endedAt: row.ended_at,
  }));
}

/** Audit form of the agreed price (settlement records). */
export function agreedPriceAudit(price: AgreedPrice | null): Record<string, unknown> | null {
  return price ? { source: price.source, selection_version: price.selectionVersion, currency: price.currency, initial_payable_amount: price.initialPayableAmount, pricing_mode: price.pricingMode, quote_required: price.quoteRequired } : null;
}

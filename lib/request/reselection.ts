import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Customer re-selection (migration 013). A CUSTOMER_SELECTED request whose selected Helper
 * declined / timed out is CUSTOMER_RESELECTION_REQUIRED; only its owner (device-owner cookie ->
 * server-derived customer id) may see fresh offers for it and explicitly pick one.
 *
 * The detailed service (sub-item) is fixed by the request's price history: re-selection offers are
 * always for the SAME service and sub-item, in the request's region. Helpers who already declined
 * or timed out on this request are never offered again (the database refuses them too).
 */
export const RESELECTION_STATUS = "CUSTOMER_RESELECTION_REQUIRED";

export type ReselectionContext = {
  requestId: string;
  status: string;
  serviceCode: string;
  subitemCode: string;
  country: string;
  sido: string;
  gungu: string;
  excludedHelperIds: string[];
};

export type ReselectionLookup = { ok: true; value: ReselectionContext } | { ok: false; httpStatus: number; code: string };

/**
 * Loads a request owned by `customerId`. `allowMatched` lets the POST route pass a re-selection that
 * already succeeded through to the database, which answers an exact replay with the same result.
 */
export async function loadOwnedReselection(client: SupabaseClient, customerId: string, requestId: string, { allowMatched = false } = {}): Promise<ReselectionLookup> {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false, httpStatus: 404, code: "REQUEST_NOT_FOUND" };
  const { data: row } = await client.from("service_requests").select("id, status, selection_mode, country, sido, gungu").eq("id", requestId).eq("customer_id", customerId).maybeSingle();
  // A request owned by someone else looks exactly like a missing one.
  if (!row) return { ok: false, httpStatus: 404, code: "REQUEST_NOT_FOUND" };
  const reselectable = row.status === RESELECTION_STATUS || (allowMatched && row.status === "MATCHED");
  if (row.selection_mode !== "CUSTOMER_SELECTED" || !reselectable) return { ok: false, httpStatus: 409, code: "REQUEST_NOT_RESELECTABLE" };
  const { data: latest } = await client.from("request_price_selections").select("service_code, subitem_code").eq("request_id", requestId).order("selection_version", { ascending: false }).limit(1).maybeSingle();
  if (!latest) return { ok: false, httpStatus: 409, code: "REQUEST_NOT_RESELECTABLE" };
  const { data: released } = await client.from("request_assignments").select("helper_id").eq("request_id", requestId).in("status", ["DECLINED", "TIMEOUT"]);
  return {
    ok: true,
    value: {
      requestId, status: row.status, serviceCode: latest.service_code, subitemCode: latest.subitem_code, country: row.country, sido: row.sido, gungu: row.gungu,
      excludedHelperIds: [...new Set((released ?? []).map((r) => r.helper_id as string))],
    },
  };
}

/** The owner's requests waiting for a re-selection (newest first). */
export async function listOwnedReselections(client: SupabaseClient, customerId: string): Promise<Array<{ requestId: string; serviceCode: string; subitemCode: string }>> {
  const { data: rows } = await client.from("service_requests").select("id").eq("customer_id", customerId).eq("selection_mode", "CUSTOMER_SELECTED").eq("status", RESELECTION_STATUS).order("updated_at", { ascending: false }).limit(5);
  const out: Array<{ requestId: string; serviceCode: string; subitemCode: string }> = [];
  for (const row of rows ?? []) {
    const { data: latest } = await client.from("request_price_selections").select("service_code, subitem_code").eq("request_id", row.id).order("selection_version", { ascending: false }).limit(1).maybeSingle();
    if (latest) out.push({ requestId: row.id, serviceCode: latest.service_code, subitemCode: latest.subitem_code });
  }
  return out;
}

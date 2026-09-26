import "server-only";

import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CUSTOMER_ID_PATTERN } from "@/lib/id/customerDisplayName";
import { DEVICE_OWNER_COOKIE, verifyDeviceOwnerCookie } from "@/lib/referral/deviceOwnership";

export type CustomerOwner = { identityId: string; customerId: string };

/**
 * The customer who owns this browser, derived only from server-held proof:
 *
 *   HttpOnly signed device-owner cookie -> verified device hash
 *   -> ACTIVE CUSTOMER referral identity -> subject_key (the service_requests.customer_id value)
 *
 * Nothing the client sends (customer_id, public 8-letter ID, ?ref=, request id, capability) can
 * choose the owner. Customers have no accounts; the cookie is the only proof.
 */
export async function resolveCustomerOwner(client: SupabaseClient): Promise<{ ok: true; owner: CustomerOwner } | { ok: false; status: number; code: string }> {
  const deviceHash = await verifyDeviceOwnerCookie((await cookies()).get(DEVICE_OWNER_COOKIE)?.value || null);
  if (!deviceHash) return { ok: false, status: 401, code: "DEVICE_OWNER_REQUIRED" };
  const { data: identity, error } = await client
    .from("referral_identities")
    .select("id, subject_key")
    .eq("device_id_hash", deviceHash)
    .eq("subject_type", "CUSTOMER")
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (error || !identity) return { ok: false, status: 401, code: "DEVICE_OWNER_REQUIRED" };
  if (typeof identity.subject_key !== "string" || !CUSTOMER_ID_PATTERN.test(identity.subject_key)) {
    return { ok: false, status: 409, code: "CUSTOMER_OWNER_INVALID" };
  }
  return { ok: true, owner: { identityId: identity.id, customerId: identity.subject_key } };
}

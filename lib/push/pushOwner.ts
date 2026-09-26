import "server-only";

import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { DEVICE_OWNER_COOKIE, verifyDeviceOwnerCookie } from "@/lib/referral/deviceOwnership";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

export type PushOwner =
  | { ownerType: "HELPER"; helperId: string; customerIdentityId: null; client: SupabaseClient }
  | { ownerType: "CUSTOMER"; helperId: null; customerIdentityId: string; client: SupabaseClient };

/**
 * Resolves the owner of a push subscription from server-side credentials only.
 *
 *   helper   -> Supabase Auth (session cookie or Bearer JWT) -> helpers.auth_user_id -> helpers.id
 *   customer -> HttpOnly signed device-owner cookie -> device hash -> ACTIVE CUSTOMER referral identity
 *
 * Nothing in the request body or query (helper_id, public 8-letter ID, ?ref=, request id,
 * capability) is ever used to choose the owner.
 */
export async function resolvePushOwner(request: Request, audience: unknown): Promise<{ ok: true; owner: PushOwner } | { ok: false; status: number; code: string }> {
  if (audience === "helper") {
    const resolved = await resolveAuthenticatedHelper(request);
    if (!resolved.ok) return { ok: false, status: resolved.status, code: resolved.code };
    return { ok: true, owner: { ownerType: "HELPER", helperId: resolved.value.helper.id, customerIdentityId: null, client: resolved.value.client } };
  }
  if (audience === "customer") {
    const deviceHash = await verifyDeviceOwnerCookie((await cookies()).get(DEVICE_OWNER_COOKIE)?.value || null);
    if (!deviceHash) return { ok: false, status: 401, code: "DEVICE_OWNER_REQUIRED" };
    const client = await createRuntimeServiceRoleClient();
    if (!client) return { ok: false, status: 503, code: "SERVICE_UNAVAILABLE" };
    const { data: identity } = await client.from("referral_identities").select("id").eq("device_id_hash", deviceHash).eq("subject_type", "CUSTOMER").eq("status", "ACTIVE").maybeSingle();
    if (!identity) return { ok: false, status: 401, code: "DEVICE_OWNER_REQUIRED" };
    return { ok: true, owner: { ownerType: "CUSTOMER", helperId: null, customerIdentityId: identity.id, client } };
  }
  return { ok: false, status: 400, code: "INVALID_AUDIENCE" };
}

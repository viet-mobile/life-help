import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { BASE58_ADDRESS } from "@/lib/payments/solana";
import { RAIL_NETWORK, RAIL_PROVIDER } from "@/lib/payments/paymentRail";
import { dispatchHelperPayout, getDevnetRail, reconcileHelperPayout } from "@/lib/payments/transfers";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const mask = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

/**
 * Authenticated Helper's own payout destination + payout status (Supabase Auth only; a Helper never
 * sees or manages another Helper's destination). Status wording follows the ledger exactly:
 * CREATED = release initiated, SUBMITTED = transfer sent (not yet confirmed), PAID = confirmed on-chain.
 * GET also advances this Helper's in-flight payouts (dispatch if a destination now exists; reconcile).
 */
export async function GET(request: Request) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return respond(resolved.status, { success: false, code: resolved.code });
  const { client, helper } = resolved.value;
  const { data: destination } = await client.from("payout_destinations").select("masked_destination, payout_method, status").eq("owner_helper_id", helper.id).eq("status", "ACTIVE").maybeSingle();
  const rail = await getDevnetRail();
  const { data: open } = await client.from("payout_obligations").select("id, status").eq("helper_id", helper.id).in("status", ["CREATED", "SUBMITTED"]).limit(10);
  for (const ob of open ?? []) {
    if (!rail) break;
    if (ob.status === "CREATED" && destination) await dispatchHelperPayout(client, ob.id, rail).catch(() => null);
    await reconcileHelperPayout(client, ob.id, rail).catch(() => null);
  }
  const { data: rows } = await client.from("payout_obligations").select("id, request_id, currency, gross_amount, platform_fee_amount, net_amount, fee_policy, payout_rail, status, created_at, submitted_at, paid_at")
    .eq("helper_id", helper.id).order("created_at", { ascending: false }).limit(20);
  return respond(200, { success: true, destination: destination ?? null, payouts: rows ?? [] });
}

/** POST { address }: register this Helper's own devnet USDC payout address (public address only). */
export async function POST(request: Request) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return respond(resolved.status, { success: false, code: resolved.code });
  const { client, helper } = resolved.value;
  const body = await request.json().catch(() => null) as { address?: unknown } | null;
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!BASE58_ADDRESS.test(address)) return respond(400, { success: false, code: "INVALID_ADDRESS" });
  const { data: helperRow } = await client.from("helpers").select("country").eq("id", helper.id).maybeSingle();
  const country = typeof helperRow?.country === "string" && /^[A-Z]{2}$/.test(helperRow.country) ? helperRow.country : "KR";
  const { data: enabled } = await client.rpc("payment_rail_enabled", { p_country: country, p_capability: "USDC_HELPER_PAYOUT", p_network: RAIL_NETWORK, p_provider: RAIL_PROVIDER });
  if (enabled !== true) return respond(409, { success: false, code: "PAYMENT_RAIL_DISABLED" });
  await client.from("payout_destinations").update({ status: "REVOKED", revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("owner_helper_id", helper.id).in("status", ["PENDING", "NOT_VERIFIED", "ACTIVE"]);
  const { error } = await client.from("payout_destinations").insert({
    owner_helper_id: helper.id, country, currency: "USDC", payout_method: "USDC_SOLANA", provider: RAIL_PROVIDER,
    provider_payee_token: address, masked_destination: mask(address), status: "ACTIVE",
  });
  if (error) return respond(502, { success: false, code: "DESTINATION_SAVE_FAILED" });
  return respond(201, { success: true, destination: { masked_destination: mask(address), payout_method: "USDC_SOLANA", status: "ACTIVE" } });
}

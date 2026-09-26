import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { dispatchReferralPayout, reconcileHelperPayout } from "@/lib/payments/transfers";

/**
 * POST /api/sys/rewards/{rewardId}/payout  { country, reconcileOnly? } (platform operator, staging only)
 * Referral reward lifecycle is unchanged: only a PAYABLE reward gets exactly one USDC payout
 * obligation (-> PAYOUT_PROCESSING), submitted once; PAID only after finalized chain proof.
 */
export async function POST(request: Request, context: { params: Promise<{ rewardId: string }> }) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const { rewardId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(rewardId)) return NextResponse.json({ success: false, code: "REWARD_NOT_FOUND" }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { country?: unknown; reconcileOnly?: unknown };
  const country = typeof body.country === "string" && /^[A-Z]{2}$/.test(body.country) ? body.country : "KR";
  const { data: existing } = await client.from("payout_obligations").select("id").eq("referral_reward_id", rewardId).maybeSingle();
  const dispatch = body.reconcileOnly === true && existing ? { status: "SKIPPED", obligationId: existing.id as string } : await dispatchReferralPayout(client, rewardId, country);
  const obligationId = dispatch.obligationId ?? existing?.id;
  const reconciled = obligationId ? await reconcileHelperPayout(client, obligationId) : null;
  const { data: reward } = await client.from("referral_rewards").select("state").eq("id", rewardId).maybeSingle();
  return NextResponse.json({ success: true, dispatch, reconciled, rewardState: reward?.state ?? null }, { headers: { "Cache-Control": "no-store" } });
}

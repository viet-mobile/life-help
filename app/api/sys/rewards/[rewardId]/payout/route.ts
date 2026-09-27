import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { processHelperPayout, processReferralPayout } from "@/lib/payments/transfers";

/**
 * POST /api/sys/rewards/{rewardId}/payout  { country } (platform operator, staging only)
 * Referral reward lifecycle is unchanged: only a PAYABLE reward gets exactly one USDC payout
 * obligation (-> PAYOUT_PROCESSING) and exactly one money job; PAID only after finalized chain proof.
 */
export async function POST(request: Request, context: { params: Promise<{ rewardId: string }> }) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const { rewardId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(rewardId)) return NextResponse.json({ success: false, code: "REWARD_NOT_FOUND" }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { country?: unknown };
  const country = typeof body.country === "string" && /^[A-Z]{2}$/.test(body.country) ? body.country : "KR";
  const { data: existing } = await client.from("payout_obligations").select("id").eq("referral_reward_id", rewardId).maybeSingle();
  // Existing obligation: its job is reconciled / retried; otherwise the obligation (+ job) is created.
  const dispatch = existing ? await processHelperPayout(client, existing.id as string) : await processReferralPayout(client, rewardId, country);
  const { data: reward } = await client.from("referral_rewards").select("state").eq("id", rewardId).maybeSingle();
  return NextResponse.json({ success: true, dispatch, rewardState: reward?.state ?? null }, { headers: { "Cache-Control": "no-store" } });
}

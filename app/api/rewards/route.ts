import { NextResponse } from "next/server";
import { getReferralStats } from "@/lib/referral/referralStore";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const referralId = url.searchParams.get("id")?.trim().toUpperCase() || "DEFAULT";

  const stats = getReferralStats(referralId);
  return NextResponse.json({
    success: true,
    tier: stats.tier,
    nextRewardAmountKrw: stats.nextRewardKrw,
    settledServices: stats.settledServicesCount,
    rewards: stats.rewards,
  });
}

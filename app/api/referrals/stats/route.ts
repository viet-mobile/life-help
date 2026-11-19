import { NextResponse } from "next/server";
import { getReferralStats } from "@/lib/referral/referralStore";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const referralId = url.searchParams.get("id")?.trim().toUpperCase();

  if (!referralId) {
    return NextResponse.json({ success: false, error: "MISSING_ID" }, { status: 400 });
  }

  const stats = getReferralStats(referralId);
  return NextResponse.json({ success: true, ...stats });
}

import { NextResponse } from "next/server";
import { getReferralStats } from "@/lib/referral/referralStore";
import { clientIp, createLimiter, isSameOrigin } from "@/lib/security/guards";

const allow = createLimiter();

export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "BAD_ORIGIN" }, { status: 403 });
  }

  const ip = clientIp(request);
  if (!allow(`ref_stats:${ip}`, 60, 60_000)) {
    return NextResponse.json({ success: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  const url = new URL(request.url);
  const referralId = url.searchParams.get("id")?.trim().toUpperCase().slice(0, 32);

  if (!referralId) {
    return NextResponse.json({ success: false, error: "MISSING_ID" }, { status: 400 });
  }

  const stats = getReferralStats(referralId);
  return NextResponse.json({ success: true, ...stats });
}

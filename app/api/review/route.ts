import { NextResponse } from "next/server";
import { clientIp, createLimiter, isSameOrigin } from "@/lib/security/guards";

const allow = createLimiter();

/**
 * Review intake is NOT available yet: there is no table or mail transport that stores or delivers a review.
 * The endpoint therefore stores nothing, logs nothing of the content, and answers 503 `not_available` so no client can show a success state.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: "bad_origin" }, { status: 403 });
  if (!allow(`review:${clientIp(request)}`, 10, 60_000)) return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
  return NextResponse.json({ success: false, error: "not_available", delivered: false }, { status: 503 });
}

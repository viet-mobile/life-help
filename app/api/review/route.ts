import { NextResponse } from "next/server";
import { clientIp, createLimiter, isSameOrigin } from "@/lib/security/guards";

const MAX_CONTENT = 2000;
const allow = createLimiter();
const str = (v: unknown, max: number, fallback: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback);

/**
 * Anonymous review intake. There is no mail transport configured, so the review is validated and written to the server log only;
 * the response says so (`delivered: false`) instead of claiming that it reached contact@life.help.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: "bad_origin" }, { status: 403 });
  if (!allow(`review:${clientIp(request)}`, 10, 60_000)) return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 16 * 1024) return NextResponse.json({ success: false, error: "too_large" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ success: false, error: "리뷰 내용을 입력해 주세요." }, { status: 400 });
  if (content.length > MAX_CONTENT) return NextResponse.json({ success: false, error: "too_long" }, { status: 413 });
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ success: false, error: "invalid_rating" }, { status: 400 });

  const reviewId = `rev-${crypto.randomUUID()}`;
  const timestamp = new Date().toISOString();
  console.log("[review]", JSON.stringify({ reviewId, timestamp, rating, serviceCategory: str(body.serviceCategory, 80, "general"), locale: str(body.locale, 12, "ko"), length: content.length }));
  return NextResponse.json({ success: true, reviewId, timestamp, delivered: false });
}

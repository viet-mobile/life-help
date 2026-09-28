import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { listProviderEventsNeedingReview, listReviewCases } from "@/lib/admin/reviewCases";

/**
 * GET /api/sys/review/cases?caseType=&status=&reason=&includeClosed=1  (platform operator only; fails closed)
 * Financial review queue: REVIEW_REQUIRED payments (with what the chain showed) and REVIEW_REQUIRED /
 * stuck money jobs, with the actions currently allowed. Never includes secrets or signed bytes.
 */
export async function GET(request: Request) {
  if (!(await authorizePlatformOperator(request))) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const cases = await listReviewCases(client, { caseType: params.get("caseType") ?? undefined, status: params.get("status") ?? undefined, reason: params.get("reason") ?? undefined, includeClosed: params.get("includeClosed") === "1" });
  // Provider evidence needing an operator (read-only here; affected intents / jobs are cases above).
  const providerEvents = await listProviderEventsNeedingReview(client);
  return NextResponse.json({ success: true, cases, providerEvents }, { headers: { "Cache-Control": "no-store" } });
}

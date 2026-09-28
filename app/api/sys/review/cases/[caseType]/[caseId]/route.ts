import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { reviewCaseDetail } from "@/lib/admin/reviewCases";

/** GET /api/sys/review/cases/{PAYMENT|MONEY_JOB}/{id}  (platform operator only): facts / system decisions / operator actions. */
export async function GET(request: Request, context: { params: Promise<{ caseType: string; caseId: string }> }) {
  if (!(await authorizePlatformOperator(request))) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const { caseType, caseId } = await context.params;
  if ((caseType !== "PAYMENT" && caseType !== "MONEY_JOB") || !/^[0-9a-f-]{36}$/i.test(caseId)) return NextResponse.json({ success: false, code: "CASE_NOT_FOUND" }, { status: 404 });
  const detail = await reviewCaseDetail(client, caseType, caseId);
  if (!detail) return NextResponse.json({ success: false, code: "CASE_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ success: true, case: detail }, { headers: { "Cache-Control": "no-store" } });
}

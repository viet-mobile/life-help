import { NextResponse } from "next/server";
import { authorizePlatformOperatorIdentity, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { MONEY_ACTIONS, REVIEW_ACTIONS, moneyActionSummary, type ReviewAction } from "@/lib/admin/reviewCases";

/**
 * POST /api/sys/review/cases/{PAYMENT|MONEY_JOB}/{id}/actions
 *   { action, reason, idempotencyKey, signature?, confirm? }   (platform operator only; fails closed)
 * The database decides eligibility, serializes concurrent operators, writes the immutable audit row and
 * replays a repeated idempotency key. Actions that may move money need confirm: true; without it the
 * route only answers the confirmation summary (case, amount, token, network / provider, destination
 * SOURCE - never a typed destination - and the action). There is no status-editing action.
 */
function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ caseType: string; caseId: string }> }) {
  const operator = await authorizePlatformOperatorIdentity(request);
  if (!operator) return respond(401, { success: false, code: "UNAUTHORIZED" });
  const client = await createStagingSettlementClient();
  if (!client) return respond(503, { success: false, code: "STAGING_ONLY" });
  const { caseType, caseId } = await context.params;
  if ((caseType !== "PAYMENT" && caseType !== "MONEY_JOB") || !/^[0-9a-f-]{36}$/i.test(caseId)) return respond(404, { success: false, code: "CASE_NOT_FOUND" });
  const body = await request.json().catch(() => null) as { action?: unknown; reason?: unknown; idempotencyKey?: unknown; signature?: unknown; confirm?: unknown } | null;
  const action = body?.action as ReviewAction;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" && /^[0-9a-f-]{36}$/i.test(body.idempotencyKey) ? body.idempotencyKey : "";
  const signature = typeof body?.signature === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,128}$/.test(body.signature) ? body.signature : null;
  if (!REVIEW_ACTIONS.includes(action) || !reason || reason.length > 1000 || !idempotencyKey) return respond(400, { success: false, code: "INVALID_REQUEST" });
  if (action === "INITIATE_REFUND" && (caseType !== "PAYMENT" || !signature)) return respond(400, { success: false, code: "SOURCE_SIGNATURE_REQUIRED" });
  if (MONEY_ACTIONS.includes(action) && body?.confirm !== true) {
    return respond(428, { success: false, code: "CONFIRMATION_REQUIRED", confirmation: await moneyActionSummary(client, caseType, caseId, action, signature ?? undefined) });
  }
  const { data, error } = await client.rpc("operator_review_action", {
    p_case_type: caseType, p_case_id: caseId, p_action: action, p_operator_id: operator.id, p_operator_kind: operator.kind,
    p_reason: reason, p_idempotency_key: idempotencyKey, p_signature: signature,
  });
  if (error) {
    // Two operators racing with the SAME key: the loser re-reads the committed result.
    if (/IDEMPOTENCY_RACE/.test(error.message ?? "")) return respond(409, { success: false, code: "CONCURRENT_DUPLICATE" });
    return respond(502, { success: false, code: "ACTION_FAILED" });
  }
  if (!data?.success) return respond(data?.code === "CASE_NOT_FOUND" ? 404 : 409, { success: false, code: data?.code ?? "ACTION_REJECTED", allowed: data?.allowed ?? null });
  return respond(200, { success: true, replayed: data.replayed === true, previousState: data.previous_state ?? null, resultingState: data.resulting_state, refs: data.refs ?? null });
}

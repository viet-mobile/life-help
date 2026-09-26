import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { dispatchPushInBackground, pushCustomerStatus } from "@/lib/push/pushDelivery";
import { applyOperationalTransition, closeServiceRequest, markPaymentPending, runConversationCleanup, settleServiceRequest, type LifecycleResult } from "@/lib/settlement/serviceSettlement";

const TARGETS = ["IN_PROGRESS", "COMPLETED", "PAYMENT_PENDING", "SETTLED", "CLOSED"] as const;
type Target = (typeof TARGETS)[number];

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return respond({ success: false, code: "UNAUTHORIZED" }, 401);
  const client = await createStagingSettlementClient();
  if (!client) return respond({ success: false, code: "STAGING_ONLY" }, 503);
  const body = await request.json().catch(() => ({})) as { status?: unknown };
  const target = (typeof body.status === "string" ? body.status : "") as Target;
  const { requestId } = await context.params;
  if (!TARGETS.includes(target)) return respond({ success: false, code: "INVALID_STATUS" }, 400);
  if (!/^[0-9a-f-]{36}$/.test(requestId)) return respond({ success: false, code: "REQUEST_NOT_FOUND" }, 404);

  let result: LifecycleResult;
  let cleanup: Awaited<ReturnType<typeof runConversationCleanup>> | undefined;
  if (target === "PAYMENT_PENDING") result = await markPaymentPending(client, requestId, actor);
  else if (target === "CLOSED") result = await closeServiceRequest(client, requestId, actor);
  else if (target === "SETTLED") {
    result = await settleServiceRequest(client, requestId, actor);
    if (result.ok) {
      // Execute the scheduled cleanup immediately; the cleanup endpoint retries anything left over.
      cleanup = await runConversationCleanup(client, { requestId });
      const closed = await closeServiceRequest(client, requestId, "CLEANUP_RUNNER");
      if (closed.ok) result = { ...result, status: closed.status };
    }
  } else result = await applyOperationalTransition(client, requestId, target);

  if (!result.ok) return respond({ success: false, code: result.code, currentStatus: result.currentStatus }, result.httpStatus);
  // The lifecycle functions already wrote the in-app notification; add best-effort Web Push.
  if (!result.idempotent && ["COMPLETED", "PAYMENT_PENDING", "SETTLED"].includes(target)) await dispatchPushInBackground(() => pushCustomerStatus(client, requestId));
  const { ok: _ok, ...payload } = result;
  return respond({ success: true, ...payload, ...(cleanup ? { cleanup } : {}) });
}

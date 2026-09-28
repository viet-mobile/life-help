import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { deliverPush, type PushTarget } from "@/lib/push/pushDelivery";
import { appendAuditLog } from "@/lib/admin/auditLog";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * STAGING-only test delivery for platform operators.
 * Sends the fixed STAGING_TEST notification (generic localized title/body) to one owner's active
 * subscriptions. Callers choose only the recipient; title, body and route cannot be supplied.
 * Body: { target: { type: "HELPER", helperId } | { type: "CUSTOMER", customerIdentityId }, locale? }
 */
export async function POST(request: Request) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return respond({ success: false, code: "UNAUTHORIZED" }, 401);
  const client = await createStagingSettlementClient();
  if (!client) return respond({ success: false, code: "STAGING_ONLY" }, 503);
  const body = await request.json().catch(() => null) as { target?: { type?: unknown; helperId?: unknown; customerIdentityId?: unknown }; locale?: unknown } | null;
  let target: PushTarget | null = null;
  if (body?.target?.type === "HELPER" && typeof body.target.helperId === "string" && UUID.test(body.target.helperId)) target = { ownerType: "HELPER", helperId: body.target.helperId };
  if (body?.target?.type === "CUSTOMER" && typeof body.target.customerIdentityId === "string" && UUID.test(body.target.customerIdentityId)) target = { ownerType: "CUSTOMER", customerIdentityId: body.target.customerIdentityId };
  if (!target) return respond({ success: false, code: "INVALID_TARGET" }, 400);
  const report = await deliverPush(client, target, "STAGING_TEST", typeof body?.locale === "string" ? body.locale : "en");
  await appendAuditLog(client, "WEB_PUSH_TEST_SENT", "push_subscription_owner", target.ownerType === "HELPER" ? target.helperId : target.customerIdentityId, { actor_kind: actor, owner_type: target.ownerType, ...report });
  return respond({ success: true, ...report });
}

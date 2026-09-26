import { NextResponse } from "next/server";
import { getVapidConfig } from "@/lib/push/pushDelivery";
import { resolvePushOwner } from "@/lib/push/pushOwner";
import { isAllowedPushEndpoint, parseSubscription } from "@/lib/push/webPushCrypto";

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const raw = await request.text().catch(() => "");
  if (raw.length > 4096) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/**
 * Subscribe this browser for the caller's own notifications.
 * Body: { audience: "customer" | "helper", subscription: PushSubscription.toJSON() }
 * Idempotent: re-subscribing the same endpoint refreshes the existing row.
 */
export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body) return respond({ success: false, code: "INVALID_JSON" }, 400);
  const resolved = await resolvePushOwner(request, body.audience);
  if (!resolved.ok) return respond({ success: false, code: resolved.code }, resolved.status);
  if (!(await getVapidConfig())) return respond({ success: false, code: "PUSH_DISABLED" }, 503);
  const subscription = parseSubscription(body.subscription);
  if (!subscription) return respond({ success: false, code: "INVALID_SUBSCRIPTION" }, 400);
  const { owner } = resolved;
  const { data, error } = await owner.client.rpc("upsert_push_subscription", {
    p_owner_type: owner.ownerType,
    p_customer_identity_id: owner.customerIdentityId,
    p_helper_id: owner.helperId,
    p_endpoint: subscription.endpoint,
    p_p256dh: subscription.p256dh,
    p_auth: subscription.auth,
  });
  if (error || !data?.success) return respond({ success: false, code: "SUBSCRIBE_FAILED" }, 502);
  return respond({ success: true, subscribed: true, created: data.created === true });
}

/**
 * Unsubscribe this browser from the caller's own notifications.
 * Body: { audience: "customer" | "helper", endpoint }
 * Only the resolved owner's row can match; another owner's subscription is never touched.
 */
export async function DELETE(request: Request) {
  const body = await readBody(request);
  if (!body) return respond({ success: false, code: "INVALID_JSON" }, 400);
  const resolved = await resolvePushOwner(request, body.audience);
  if (!resolved.ok) return respond({ success: false, code: resolved.code }, resolved.status);
  if (!isAllowedPushEndpoint(body.endpoint)) return respond({ success: false, code: "INVALID_SUBSCRIPTION" }, 400);
  const { owner } = resolved;
  const { data, error } = await owner.client.rpc("revoke_push_subscription", {
    p_owner_type: owner.ownerType,
    p_customer_identity_id: owner.customerIdentityId,
    p_helper_id: owner.helperId,
    p_endpoint: body.endpoint,
  });
  if (error || !data?.success) return respond({ success: false, code: "UNSUBSCRIBE_FAILED" }, 502);
  return respond({ success: true, revoked: Number(data.revoked) || 0 });
}

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidLocale, translate, type Locale } from "@/messages";
import { sendWebPush, type VapidKeys } from "@/lib/push/webPushCrypto";

/**
 * Best-effort Web Push delivery. Web Push is an additional channel next to app_notifications:
 * nothing here is awaited by lifecycle code for correctness, every error is swallowed, and one
 * failing subscription never blocks the others.
 *
 * Payloads are minimal: event type, a generic localized title/body and a fixed same-origin route.
 * No names, addresses, conversation text, capabilities, tokens or database ids are sent.
 *
 * STAGING only for now: disabled unless the Worker has VAPID secrets AND talks to the staging
 * Supabase project.
 */

const STAGING_REF: string = "wreebowcbiymodswajwe";
const PRODUCTION_REF: string = "wstdbymmkrqgtsibhcjz";
const DEFAULT_SUBJECT = "https://life.help";

export type PushEvent = "HELPER_ASSIGNED" | "SERVICE_STATUS" | "STAGING_TEST";
export type PushTarget = { ownerType: "HELPER"; helperId: string } | { ownerType: "CUSTOMER"; customerIdentityId: string };
export type PushReport = { attempted: number; delivered: number; invalidated: number; failed: number };

const EVENT_TEXT: Record<PushEvent, { title: string; body: string }> = {
  HELPER_ASSIGNED: { title: "push.helperAssignedTitle", body: "push.helperAssignedBody" },
  SERVICE_STATUS: { title: "push.customerUpdateTitle", body: "push.customerUpdateBody" },
  STAGING_TEST: { title: "push.testTitle", body: "push.testBody" },
};

async function runtimeEnv(): Promise<Record<string, string | undefined>> {
  try {
    return (await getCloudflareContext({ async: true })).env as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

/** VAPID keys from Worker secrets; null (push disabled) outside staging or when unconfigured. */
export async function getVapidConfig(): Promise<VapidKeys | null> {
  const env = await runtimeEnv();
  const ref = (env.SUPABASE_URL || "").match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1];
  if (ref !== STAGING_REF || ref === PRODUCTION_REF) return null;
  const publicKey = env.LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.LIFE_HELP_WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: env.LIFE_HELP_WEB_PUSH_VAPID_SUBJECT?.trim() || DEFAULT_SUBJECT };
}

/** Public, safe-to-expose part of the configuration. */
export async function getPublicPushConfig(): Promise<{ enabled: boolean; publicKey: string | null }> {
  const vapid = await getVapidConfig();
  return { enabled: !!vapid, publicKey: vapid?.publicKey ?? null };
}

export function buildPushPayload(event: PushEvent, locale: string | null | undefined): string {
  const lang: Locale = isValidLocale(locale) ? locale : "en";
  const text = EVENT_TEXT[event];
  const audience = event === "HELPER_ASSIGNED" ? "helper" : event === "SERVICE_STATUS" ? "customer" : "any";
  const url = audience === "helper" ? "/tech/assignments" : "/request";
  return JSON.stringify({ v: 1, type: event, audience, title: translate(lang, text.title), body: translate(lang, text.body), url, tag: `life-help-${event.toLowerCase()}` });
}

/** Sends to every ACTIVE subscription of the target and records each result. Never throws. */
export async function deliverPush(client: SupabaseClient, target: PushTarget, event: PushEvent, locale: string | null | undefined): Promise<PushReport> {
  const report: PushReport = { attempted: 0, delivered: 0, invalidated: 0, failed: 0 };
  try {
    const vapid = await getVapidConfig();
    if (!vapid) return report;
    let query = client.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("status", "ACTIVE").eq("owner_type", target.ownerType).limit(10);
    query = target.ownerType === "HELPER" ? query.eq("helper_id", target.helperId) : query.eq("customer_identity_id", target.customerIdentityId);
    const { data: subscriptions } = await query;
    const payload = buildPushPayload(event, locale);
    await Promise.allSettled((subscriptions ?? []).map(async (subscription) => {
      report.attempted += 1;
      let status = 0;
      try {
        status = await sendWebPush({ endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth }, payload, vapid, { urgency: event === "HELPER_ASSIGNED" ? "high" : "normal" });
      } catch {
        status = 0;
      }
      if (status >= 200 && status < 300) report.delivered += 1;
      else if (status === 404 || status === 410) report.invalidated += 1;
      else report.failed += 1;
      await client.rpc("record_push_delivery_result", { p_subscription_id: subscription.id, p_http_status: status });
    }));
  } catch {
    // Push is best effort; the caller's operation already succeeded.
  }
  return report;
}

/** Helper assignment: push to the helper holding the request's active assignment. */
export async function pushHelperAssignment(client: SupabaseClient, requestId: string): Promise<PushReport | null> {
  try {
    const { data: assignment } = await client.from("request_assignments").select("helper_id").eq("request_id", requestId).in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]).maybeSingle();
    if (!assignment?.helper_id) return null;
    const { data: helper } = await client.from("helpers").select("id, primary_locale").eq("id", assignment.helper_id).maybeSingle();
    if (!helper) return null;
    return await deliverPush(client, { ownerType: "HELPER", helperId: helper.id }, "HELPER_ASSIGNED", helper.primary_locale);
  } catch {
    return null;
  }
}

/**
 * Customer lifecycle update: push to the device identity that owns the request's customer id.
 * The identity is looked up server-side; the client never names the recipient.
 */
export async function pushCustomerStatus(client: SupabaseClient, requestId: string): Promise<PushReport | null> {
  try {
    const { data: request } = await client.from("service_requests").select("customer_id, customer_locale").eq("id", requestId).maybeSingle();
    if (!request?.customer_id) return null;
    const { data: identity } = await client.from("referral_identities").select("id").eq("subject_type", "CUSTOMER").eq("subject_key", request.customer_id).eq("status", "ACTIVE").maybeSingle();
    if (!identity) return null;
    return await deliverPush(client, { ownerType: "CUSTOMER", customerIdentityId: identity.id }, "SERVICE_STATUS", request.customer_locale);
  } catch {
    return null;
  }
}

/** Runs push after the response when the Worker context allows it; errors never propagate. */
export async function dispatchPushInBackground(work: () => Promise<unknown>): Promise<void> {
  const task = work().catch(() => undefined);
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(task);
  } catch {
    await task;
  }
}

/**
 * Helper-driven status change with no in-app record yet (Helper COMPLETE): writes the same
 * SERVICE_STATUS_CHANGED app_notification the admin override path writes, then pushes.
 * Never throws; the status change itself has already been committed by the caller.
 */
export async function notifyCustomerStatusChange(client: SupabaseClient, requestId: string, status: "COMPLETED"): Promise<void> {
  try {
    const { data: request } = await client.from("service_requests").select("customer_id").eq("id", requestId).maybeSingle();
    if (request?.customer_id) {
      await client.from("app_notifications").insert({ recipient_type: "CUSTOMER", recipient_id: request.customer_id, type: "SERVICE_STATUS_CHANGED", title: "Service status changed", body: `Service status is now ${status}.`, payload: { request_id: requestId, status } });
    }
  } catch {
    // In-app record is best effort here, like the push that follows.
  }
  await dispatchPushInBackground(() => pushCustomerStatus(client, requestId));
}

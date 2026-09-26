import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { IDEMPOTENCY_HEADER } from "@/lib/request/idempotencyKey";
import { dispatchPushInBackground, pushHelperAssignment } from "@/lib/push/pushDelivery";
import {
  MAX_REQUEST_BODY_BYTES,
  submitServiceRequest,
  validateCreateServiceRequest,
  validateIdempotencyKey,
  type CreateRequestApiResponse,
} from "@/lib/request/serverRequest";

function respond(httpStatus: number, body: CreateRequestApiResponse, replayed = false) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (replayed) headers["Idempotent-Replayed"] = "true";
  return NextResponse.json(body, { status: httpStatus, headers });
}

/**
 * POST /api/requests
 * Creates a customer service request and runs the authoritative DB matching RPC.
 * Only creation and the immediate matching result are handled here; the pseudonymous
 * customer_id grants no read access to requests or conversations.
 *
 * Requires an Idempotency-Key header (v4 UUID). Repeating a call with the same key and the same
 * payload never creates a second request; it returns the request's current result
 * (see submitServiceRequest for the exact semantics).
 */
export async function POST(request: Request) {
  const key = validateIdempotencyKey(request.headers.get(IDEMPOTENCY_HEADER));
  if (!key.ok) {
    return respond(key.error.httpStatus, key.error.body);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_REQUEST_BODY_BYTES) {
      return respond(413, { success: false, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." });
    }
    body = JSON.parse(raw);
  } catch {
    return respond(400, { success: false, code: "INVALID_JSON", message: "Request body must be valid JSON." });
  }

  const validation = validateCreateServiceRequest(body);
  if (!validation.ok) {
    return respond(validation.error.httpStatus, validation.error.body);
  }

  const client = await createRuntimeServiceRoleClient();
  if (!client) {
    console.error("[api/requests] Supabase service environment is not configured");
    return respond(503, {
      success: false,
      code: "SERVICE_UNAVAILABLE",
      message: "The request service is temporarily unavailable.",
    });
  }

  try {
    const result = await submitServiceRequest(client, validation.value, key.value);
    // Web Push to the matched helper, after the response and best effort: the in-app
    // NEW_SERVICE_REQUEST notification was already written by match_and_assign_helper.
    if (!result.replayed && result.body.success && result.body.status === "MATCHED") {
      const requestId = result.body.requestId;
      await dispatchPushInBackground(() => pushHelperAssignment(client, requestId));
    }
    return respond(result.httpStatus, result.body, result.replayed);
  } catch (err: unknown) {
    console.error("[api/requests] unexpected failure", err instanceof Error ? err.message : String(err));
    return respond(500, {
      success: false,
      code: "INTERNAL_ERROR",
      message: "The service request could not be processed.",
    });
  }
}

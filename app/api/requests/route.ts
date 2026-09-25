import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import {
  MAX_REQUEST_BODY_BYTES,
  createServiceRequestAndMatch,
  validateCreateServiceRequest,
  type CreateRequestApiResponse,
} from "@/lib/request/serverRequest";

function respond(httpStatus: number, body: CreateRequestApiResponse) {
  return NextResponse.json(body, { status: httpStatus, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/requests
 * Creates a customer service request and runs the authoritative DB matching RPC.
 * Only creation and the immediate matching result are handled here; the pseudonymous
 * customer_id grants no read access to requests or conversations.
 */
export async function POST(request: Request) {
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

  const client = createServiceRoleClient();
  if (!client) {
    console.error("[api/requests] Supabase service environment is not configured");
    return respond(503, {
      success: false,
      code: "SERVICE_UNAVAILABLE",
      message: "The request service is temporarily unavailable.",
    });
  }

  try {
    const result = await createServiceRequestAndMatch(client, validation.value);
    return respond(result.httpStatus, result.body);
  } catch (err: unknown) {
    console.error("[api/requests] unexpected failure", err instanceof Error ? err.message : String(err));
    return respond(500, {
      success: false,
      code: "INTERNAL_ERROR",
      message: "The service request could not be processed.",
    });
  }
}

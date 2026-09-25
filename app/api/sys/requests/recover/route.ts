import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { authorizeRecoveryRequest } from "@/lib/request/recoveryAuth";
import {
  RECOVERY_DEFAULT_LIMIT,
  RECOVERY_DEFAULT_MIN_AGE_SECONDS,
  RECOVERY_MAX_LIMIT,
  RECOVERY_MAX_MIN_AGE_SECONDS,
  RECOVERY_MIN_AGE_FLOOR_SECONDS,
  recoverOrphanRequest,
  recoverOrphanRequests,
} from "@/lib/request/requestRecovery";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function readBoundedInt(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

/**
 * POST /api/sys/requests/recover  (admin / server only)
 *
 * Re-runs match_and_assign_helper once for SEARCHING orphans (see lib/request/requestRecovery.ts).
 * Body (all optional):
 *   { "request_id": "<uuid>" }                   recover one request
 *   { "limit": 1-50, "min_age_seconds": 30-604800 }  batch scan of the oldest orphans
 * Safe to call concurrently and repeatedly: the RPC's row lock and status guard allow at most one match.
 */
export async function POST(request: Request) {
  if (!(await authorizeRecoveryRequest(request))) {
    return respond(401, { success: false, code: "UNAUTHORIZED", message: "Authorization required." });
  }

  let body: Record<string, unknown> = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      body = parsed;
    } catch {
      return respond(400, { success: false, code: "INVALID_JSON", message: "Body must be a JSON object." });
    }
  }

  const limit = readBoundedInt(body.limit, RECOVERY_DEFAULT_LIMIT, 1, RECOVERY_MAX_LIMIT);
  const minAgeSeconds = readBoundedInt(
    body.min_age_seconds,
    RECOVERY_DEFAULT_MIN_AGE_SECONDS,
    RECOVERY_MIN_AGE_FLOOR_SECONDS,
    RECOVERY_MAX_MIN_AGE_SECONDS
  );
  if (limit === null || minAgeSeconds === null) {
    return respond(400, { success: false, code: "VALIDATION_ERROR", message: "Invalid limit or min_age_seconds." });
  }
  const requestId = body.request_id;
  if (requestId !== undefined && (typeof requestId !== "string" || !UUID_PATTERN.test(requestId))) {
    return respond(400, { success: false, code: "VALIDATION_ERROR", message: "Invalid request_id." });
  }

  const client = createServiceRoleClient();
  if (!client) {
    console.error("[api/sys/requests/recover] Supabase service environment is not configured");
    return respond(503, { success: false, code: "SERVICE_UNAVAILABLE", message: "Recovery is unavailable." });
  }

  try {
    if (typeof requestId === "string") {
      const result = await recoverOrphanRequest(client, requestId, { minAgeMs: minAgeSeconds * 1000 });
      return respond(200, { success: true, scanned: 1, results: [result] });
    }
    const batch = await recoverOrphanRequests(client, { limit, minAgeSeconds });
    if (!batch.ok) {
      return respond(500, { success: false, code: "RECOVERY_SCAN_FAILED", message: "Orphan scan failed." });
    }
    return respond(200, { success: true, scanned: batch.scanned, results: batch.results });
  } catch (err: unknown) {
    console.error("[api/sys/requests/recover] unexpected failure", err instanceof Error ? err.message : String(err));
    return respond(500, { success: false, code: "INTERNAL_ERROR", message: "Recovery failed." });
  }
}

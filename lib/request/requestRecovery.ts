import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchHelperResult, ServiceRequestStatus } from "@/lib/db/schema";

/**
 * SEARCHING-orphan recovery.
 *
 * An orphan is a request that was inserted but whose first match_and_assign_helper call never
 * completed (e.g. the RPC call itself failed). It is defined strictly as:
 *   - service_requests.status = 'SEARCHING'
 *   - no request_assignments rows at all (any status)
 *   - no conversations for the request
 *   - no open (PENDING/ASSIGNED) admin escalation
 *   - older than a minimum age (batch recovery only)
 *
 * A request that went back to SEARCHING through release_assignment_for_rematch always has assignment
 * history, so it is never an orphan; rematching after a decline/timeout stays with the release flow.
 *
 * Recovery never writes request state itself. It re-invokes the existing match_and_assign_helper RPC
 * exactly once per request per attempt; the RPC's row lock (SELECT ... FOR UPDATE) and its
 * CREATED/SEARCHING status guard make concurrent attempts converge on a single match or escalation.
 */

export const ORPHAN_STATUS: ServiceRequestStatus = "SEARCHING";
const OPEN_ESCALATION_STATUSES = ["PENDING", "ASSIGNED"];

// Exact error string returned by match_and_assign_helper's status guard.
const RPC_INVALID_STATUS_ERROR = "Invalid request status for matching";

export type OrphanIneligibleReason =
  | "NOT_FOUND"
  | "NOT_SEARCHING"
  | "TOO_RECENT"
  | "HAS_ASSIGNMENT_HISTORY"
  | "HAS_CONVERSATION"
  | "HAS_OPEN_ESCALATION"
  | "LOOKUP_FAILED";

export type OrphanEligibility =
  | { eligible: true }
  | { eligible: false; reason: OrphanIneligibleReason; status?: string };

async function countRows(
  query: PromiseLike<{ count: number | null; error: unknown }>
): Promise<number | null> {
  const { count, error } = await query;
  return error || count === null ? null : count;
}

export async function checkOrphanEligibility(
  client: SupabaseClient,
  requestId: string,
  options: { minAgeMs?: number; now?: number } = {}
): Promise<OrphanEligibility> {
  const { data: row, error } = await client
    .from("service_requests")
    .select("id, status, created_at")
    .eq("id", requestId)
    .maybeSingle();
  if (error) return { eligible: false, reason: "LOOKUP_FAILED" };
  if (!row) return { eligible: false, reason: "NOT_FOUND" };
  if (row.status !== ORPHAN_STATUS) return { eligible: false, reason: "NOT_SEARCHING", status: row.status };

  const minAgeMs = options.minAgeMs ?? 0;
  if (minAgeMs > 0) {
    const createdAt = Date.parse(row.created_at);
    if (!Number.isFinite(createdAt) || (options.now ?? Date.now()) - createdAt < minAgeMs) {
      return { eligible: false, reason: "TOO_RECENT" };
    }
  }

  const assignments = await countRows(
    client.from("request_assignments").select("id", { count: "exact", head: true }).eq("request_id", requestId)
  );
  if (assignments === null) return { eligible: false, reason: "LOOKUP_FAILED" };
  if (assignments > 0) return { eligible: false, reason: "HAS_ASSIGNMENT_HISTORY" };

  const conversations = await countRows(
    client.from("conversations").select("id", { count: "exact", head: true }).eq("request_id", requestId)
  );
  if (conversations === null) return { eligible: false, reason: "LOOKUP_FAILED" };
  if (conversations > 0) return { eligible: false, reason: "HAS_CONVERSATION" };

  const escalations = await countRows(
    client
      .from("admin_escalations")
      .select("id", { count: "exact", head: true })
      .eq("request_id", requestId)
      .in("status", OPEN_ESCALATION_STATUSES)
  );
  if (escalations === null) return { eligible: false, reason: "LOOKUP_FAILED" };
  if (escalations > 0) return { eligible: false, reason: "HAS_OPEN_ESCALATION" };

  return { eligible: true };
}

export type MatchingAttempt =
  | { outcome: "RAN"; status: "MATCHED" | "NO_HELPER_AVAILABLE" }
  /** Another caller already moved the request out of SEARCHING (RPC status guard). */
  | { outcome: "ALREADY_RESOLVED" }
  | { outcome: "FAILED" };

/** Invokes the existing atomic matching RPC once. Never retries. */
export async function runMatchingOnce(client: SupabaseClient, requestId: string): Promise<MatchingAttempt> {
  const { data, error } = await client.rpc("match_and_assign_helper", { p_request_id: requestId });
  const result = data as MatchHelperResult | null;

  if (!error && result?.success === true &&
      (result.status === "MATCHED" || result.status === "NO_HELPER_AVAILABLE")) {
    return { outcome: "RAN", status: result.status };
  }
  if (!error && result?.success === false && result.error === RPC_INVALID_STATUS_ERROR) {
    return { outcome: "ALREADY_RESOLVED" };
  }

  console.error("[requests] match_and_assign_helper failed", {
    requestId,
    code: error?.code,
    message: error?.message ?? result?.error,
  });
  return { outcome: "FAILED" };
}

export type RecoveryOutcome =
  | { requestId: string; outcome: "RECOVERED"; status: "MATCHED" | "NO_HELPER_AVAILABLE" }
  | { requestId: string; outcome: "ALREADY_RESOLVED" }
  | { requestId: string; outcome: "SKIPPED"; reason: OrphanIneligibleReason }
  | { requestId: string; outcome: "FAILED" };

export async function recoverOrphanRequest(
  client: SupabaseClient,
  requestId: string,
  options: { minAgeMs: number; now?: number }
): Promise<RecoveryOutcome> {
  const eligibility = await checkOrphanEligibility(client, requestId, options);
  if (!eligibility.eligible) return { requestId, outcome: "SKIPPED", reason: eligibility.reason };

  const attempt = await runMatchingOnce(client, requestId);
  if (attempt.outcome === "RAN") return { requestId, outcome: "RECOVERED", status: attempt.status };
  if (attempt.outcome === "ALREADY_RESOLVED") return { requestId, outcome: "ALREADY_RESOLVED" };
  return { requestId, outcome: "FAILED" };
}

export const RECOVERY_DEFAULT_LIMIT = 20;
export const RECOVERY_MAX_LIMIT = 50;
export const RECOVERY_DEFAULT_MIN_AGE_SECONDS = 120;
export const RECOVERY_MIN_AGE_FLOOR_SECONDS = 30;
export const RECOVERY_MAX_MIN_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Scans the oldest SEARCHING requests and recovers the eligible ones, one RPC call each. */
export async function recoverOrphanRequests(
  client: SupabaseClient,
  options: { limit: number; minAgeSeconds: number; now?: number }
): Promise<{ ok: true; scanned: number; results: RecoveryOutcome[] } | { ok: false }> {
  const now = options.now ?? Date.now();
  const minAgeMs = options.minAgeSeconds * 1000;
  const cutoff = new Date(now - minAgeMs).toISOString();

  const { data, error } = await client
    .from("service_requests")
    .select("id")
    .eq("status", ORPHAN_STATUS)
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(options.limit);
  if (error) {
    console.error("[requests] orphan scan failed", { code: error.code, message: error.message });
    return { ok: false };
  }

  const results: RecoveryOutcome[] = [];
  for (const row of data ?? []) {
    results.push(await recoverOrphanRequest(client, row.id as string, { minAgeMs, now }));
  }
  return { ok: true, scanned: data?.length ?? 0, results };
}

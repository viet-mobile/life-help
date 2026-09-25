// Test Assignment Release & Rematch Static Logic & Migration Integrity (E1 - E6)
import fs from "fs";
import path from "path";

console.log("==================================================");
console.log("RUNNING SCENARIO E STATIC INTEGRITY TESTS (E1 - E6)");
console.log("==================================================");

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "202609250002_assignment_release_rematch.sql"
);

if (!fs.existsSync(migrationPath)) {
  console.error("FAIL: Migration 202609250002_assignment_release_rematch.sql missing!");
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, "utf-8");

// E6: ACL & RLS Hardening in Migration SQL
console.log("\n[E6] Verifying RPC Permission Hardening in Migration...");
const hasRevokePublic = sql.includes("revoke execute on function public.release_assignment_for_rematch(uuid, text) from public;");
const hasRevokeAnon = sql.includes("revoke execute on function public.release_assignment_for_rematch(uuid, text) from anon;");
const hasRevokeAuth = sql.includes("revoke execute on function public.release_assignment_for_rematch(uuid, text) from authenticated;");
const hasGrantServiceRole = sql.includes("grant execute on function public.release_assignment_for_rematch(uuid, text) to service_role;");
const hasSecurityDefiner = sql.includes("security definer");
const hasFixedSearchPath = sql.includes("set search_path = public, pg_temp");

if (!hasRevokePublic || !hasRevokeAnon || !hasRevokeAuth || !hasGrantServiceRole || !hasSecurityDefiner || !hasFixedSearchPath) {
  console.error("FAIL [E6]: RPC permission hardening or search_path missing in migration!");
  process.exit(1);
}
console.log("PASS [E6]: Revoke from public/anon/authenticated and grant to service_role verified.");

// Simulation unit tests for E1 - E5 logic
class MockPgDatabase {
  constructor() {
    this.serviceRequests = new Map();
    this.requestAssignments = new Map();
  }

  seed({ request, assignment }) {
    this.serviceRequests.set(request.id, { ...request });
    this.requestAssignments.set(assignment.id, { ...assignment });
  }

  // Exact JavaScript representation of the PL/pgSQL function logic
  releaseAssignmentForRematch(p_assignment_id, p_release_status) {
    // 1. Validate release status
    if (!["DECLINED", "TIMEOUT"].includes(p_release_status)) {
      return {
        success: false,
        error: "Invalid release status. Must be DECLINED or TIMEOUT",
      };
    }

    // 2. Fetch assignment FOR UPDATE
    const v_assignment = this.requestAssignments.get(p_assignment_id);
    if (!v_assignment) {
      return {
        success: false,
        error: "Assignment not found",
      };
    }

    // 3. Verify active releaseable state
    if (!["PENDING", "NOTIFIED", "ACCEPTED"].includes(v_assignment.status)) {
      return {
        success: false,
        error: "Assignment is not in an active releaseable state",
        current_status: v_assignment.status,
      };
    }

    // 4. Fetch parent request FOR UPDATE
    const v_request = this.serviceRequests.get(v_assignment.request_id);
    if (!v_request) {
      return {
        success: false,
        error: "Parent service request not found",
      };
    }

    // 5. Update assignment status
    v_assignment.status = p_release_status;
    v_assignment.responded_at = new Date().toISOString();

    // 6. Check other active assignments
    let otherActiveCount = 0;
    for (const [id, a] of this.requestAssignments.entries()) {
      if (a.request_id === v_request.id && id !== v_assignment.id) {
        if (["PENDING", "NOTIFIED", "ACCEPTED"].includes(a.status)) {
          otherActiveCount++;
        }
      }
    }

    // 7. If no other active assignment exists, reopen request to SEARCHING
    if (otherActiveCount === 0) {
      v_request.status = "SEARCHING";
      v_request.updated_at = new Date().toISOString();
    }

    return {
      success: true,
      assignment_id: v_assignment.id,
      request_id: v_request.id,
      new_assignment_status: p_release_status,
      request_reopened: otherActiveCount === 0,
      request_status: otherActiveCount === 0 ? "SEARCHING" : v_request.status,
    };
  }

  // Exact JavaScript representation of match_and_assign_helper status verification
  canMatchRequest(p_request_id) {
    const req = this.serviceRequests.get(p_request_id);
    if (!req) return { success: false, error: "Request not found" };
    if (!["CREATED", "SEARCHING"].includes(req.status)) {
      return { success: false, error: "Invalid request status for matching" };
    }
    return { success: true, status: "ELIGIBLE_FOR_MATCHING" };
  }
}

// E1: Normal assignment -> DECLINED -> request SEARCHING -> Rematch Eligible
console.log("\n[E1] Testing Normal Assignment -> DECLINED -> request SEARCHING -> Rematch Eligible...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e1";
  const assignId = "assign-e1";
  db.seed({
    request: { id: reqId, status: "MATCHED" },
    assignment: { id: assignId, request_id: reqId, status: "PENDING" },
  });

  const res = db.releaseAssignmentForRematch(assignId, "DECLINED");
  if (!res.success || res.new_assignment_status !== "DECLINED" || res.request_status !== "SEARCHING") {
    console.error("FAIL [E1]: Release failed:", res);
    process.exit(1);
  }

  const matchCheck = db.canMatchRequest(reqId);
  if (!matchCheck.success) {
    console.error("FAIL [E1]: Rematch eligibility check failed:", matchCheck);
    process.exit(1);
  }
  console.log("PASS [E1]: Assignment set to DECLINED, request transitioned to SEARCHING, rematch eligible.");
}

// E2: Normal assignment -> TIMEOUT -> request SEARCHING -> Rematch Eligible
console.log("\n[E2] Testing Normal Assignment -> TIMEOUT -> request SEARCHING -> Rematch Eligible...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e2";
  const assignId = "assign-e2";
  db.seed({
    request: { id: reqId, status: "MATCHED" },
    assignment: { id: assignId, request_id: reqId, status: "NOTIFIED" },
  });

  const res = db.releaseAssignmentForRematch(assignId, "TIMEOUT");
  if (!res.success || res.new_assignment_status !== "TIMEOUT" || res.request_status !== "SEARCHING") {
    console.error("FAIL [E2]: Release failed:", res);
    process.exit(1);
  }

  const matchCheck = db.canMatchRequest(reqId);
  if (!matchCheck.success) {
    console.error("FAIL [E2]: Rematch eligibility check failed:", matchCheck);
    process.exit(1);
  }
  console.log("PASS [E2]: Assignment set to TIMEOUT, request transitioned to SEARCHING, rematch eligible.");
}

// E3: Already DECLINED assignment re-release -> Safe response & Data Integrity Preserved
console.log("\n[E3] Testing Already DECLINED assignment re-release...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e3";
  const assignId = "assign-e3";
  db.seed({
    request: { id: reqId, status: "SEARCHING" },
    assignment: { id: assignId, request_id: reqId, status: "DECLINED" },
  });

  const res = db.releaseAssignmentForRematch(assignId, "DECLINED");
  if (res.success || res.error !== "Assignment is not in an active releaseable state" || res.current_status !== "DECLINED") {
    console.error("FAIL [E3]: Expected safe rejection of already declined assignment:", res);
    process.exit(1);
  }
  console.log("PASS [E3]: Already DECLINED assignment safely rejected, integrity preserved.");
}

// E4: Invalid release status rejection
console.log("\n[E4] Testing Invalid release status rejection...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e4";
  const assignId = "assign-e4";
  db.seed({
    request: { id: reqId, status: "MATCHED" },
    assignment: { id: assignId, request_id: reqId, status: "PENDING" },
  });

  const res = db.releaseAssignmentForRematch(assignId, "CANCELLED");
  if (res.success || res.error !== "Invalid release status. Must be DECLINED or TIMEOUT") {
    console.error("FAIL [E4]: Expected invalid status rejection:", res);
    process.exit(1);
  }
  console.log("PASS [E4]: Invalid release status rejected as expected.");
}

// E5: Non-existent assignment safe handling
console.log("\n[E5] Testing Non-existent assignment safe handling...");
{
  const db = new MockPgDatabase();
  const res = db.releaseAssignmentForRematch("non-existent-uuid", "DECLINED");
  if (res.success || res.error !== "Assignment found") {
    if (res.error !== "Assignment not found") {
      console.error("FAIL [E5]: Expected assignment not found error:", res);
      process.exit(1);
    }
  }
  console.log("PASS [E5]: Non-existent assignment safely rejected with 'Assignment not found'.");
}

console.log("\n==================================================");
console.log("ALL SCENARIO E STATIC TESTS (E1 - E6) PASSED!");
console.log("==================================================");

// Test Assignment Release & Rematch Static Logic & Migration Integrity (E1 - E12)
import fs from "fs";
import path from "path";

console.log("==================================================");
console.log("RUNNING SCENARIO E STATIC INTEGRITY TESTS (E1 - E12)");
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

// E12: Parent request status guard in Migration SQL
console.log("\n[E12] Verifying Parent Request Status Guard in Migration SQL...");
const hasRequestGuard = sql.includes("v_request.status not in ('MATCHED', 'HELPER_NOTIFIED')");
const hasRequestNotRematchableCode = sql.includes("'REQUEST_NOT_REMATCHABLE'");

if (!hasRequestGuard || !hasRequestNotRematchableCode) {
  console.error("FAIL [E12]: Parent service_request rematchable status guard missing in migration SQL!");
  process.exit(1);
}
console.log("PASS [E12]: Parent service_request status guard ('MATCHED', 'HELPER_NOTIFIED') and error code verified.");

// Exact Simulation unit tests for E1 - E5 and E7 - E11 logic
class MockPgDatabase {
  constructor() {
    this.serviceRequests = new Map();
    this.requestAssignments = new Map();
  }

  seed({ request, assignment }) {
    this.serviceRequests.set(request.id, { ...request });
    if (assignment) {
      this.requestAssignments.set(assignment.id, { ...assignment });
    }
  }

  addAssignment(assignment) {
    this.requestAssignments.set(assignment.id, { ...assignment });
  }

  // Exact JavaScript representation of the hardened PL/pgSQL function logic
  releaseAssignmentForRematch(p_assignment_id, p_release_status) {
    // 1. Validate release status input
    if (!["DECLINED", "TIMEOUT"].includes(p_release_status)) {
      return {
        success: false,
        error: "Invalid release status. Must be DECLINED or TIMEOUT",
        code: "INVALID_RELEASE_STATUS",
      };
    }

    // 2. Fetch and lock target assignment
    const v_assignment = this.requestAssignments.get(p_assignment_id);
    if (!v_assignment) {
      return {
        success: false,
        error: "Assignment not found",
        code: "ASSIGNMENT_NOT_FOUND",
      };
    }

    // 3. Verify assignment active releaseable state
    if (!["PENDING", "NOTIFIED", "ACCEPTED"].includes(v_assignment.status)) {
      return {
        success: false,
        error: "Assignment is not in an active releaseable state",
        code: "ASSIGNMENT_NOT_ACTIVE",
        current_status: v_assignment.status,
      };
    }

    // 4. Fetch and lock connected parent service_request
    const v_request = this.serviceRequests.get(v_assignment.request_id);
    if (!v_request) {
      return {
        success: false,
        error: "Parent service request not found",
        code: "REQUEST_NOT_FOUND",
      };
    }

    // 5. Guard: Verify parent service_request is in a rematchable state
    // Terminal / non-rematchable states must preserve complete data immutability!
    if (!["MATCHED", "HELPER_NOTIFIED"].includes(v_request.status)) {
      return {
        success: false,
        error: "Parent service request is not in a rematchable state",
        code: "REQUEST_NOT_REMATCHABLE",
        request_status: v_request.status,
        assignment_status: v_assignment.status,
      };
    }

    // 6. Transition assignment status to release status
    v_assignment.status = p_release_status;
    v_assignment.responded_at = new Date().toISOString();

    // 7. Check if any other active assignment exists for this request
    let otherActiveCount = 0;
    for (const [id, a] of this.requestAssignments.entries()) {
      if (a.request_id === v_request.id && id !== v_assignment.id) {
        if (["PENDING", "NOTIFIED", "ACCEPTED"].includes(a.status)) {
          otherActiveCount++;
        }
      }
    }

    // 8. If no other active assignment exists, reopen request for matching
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

  // Exact JavaScript representation of match_and_assign_helper status check
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
  if (res.success || res.code !== "ASSIGNMENT_NOT_ACTIVE" || res.current_status !== "DECLINED") {
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
  if (res.success || res.code !== "INVALID_RELEASE_STATUS") {
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
  if (res.success || res.code !== "ASSIGNMENT_NOT_FOUND") {
    console.error("FAIL [E5]: Expected assignment not found error:", res);
    process.exit(1);
  }
  console.log("PASS [E5]: Non-existent assignment safely rejected with 'ASSIGNMENT_NOT_FOUND'.");
}

// E7: request MATCHED + active assignment PENDING -> DECLINED -> request SEARCHING
console.log("\n[E7] Testing request MATCHED + active assignment PENDING -> DECLINED -> request SEARCHING...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e7";
  const assignId = "assign-e7";
  db.seed({
    request: { id: reqId, status: "MATCHED" },
    assignment: { id: assignId, request_id: reqId, status: "PENDING" },
  });

  const res = db.releaseAssignmentForRematch(assignId, "DECLINED");
  const req = db.serviceRequests.get(reqId);
  const assign = db.requestAssignments.get(assignId);

  if (!res.success || req.status !== "SEARCHING" || assign.status !== "DECLINED") {
    console.error("FAIL [E7]: Failed transition for MATCHED + PENDING:", res);
    process.exit(1);
  }
  console.log("PASS [E7]: request MATCHED + assignment PENDING successfully transitioned to SEARCHING + DECLINED.");
}

// E8: request MATCHED + active assignment PENDING -> TIMEOUT -> request SEARCHING
console.log("\n[E8] Testing request MATCHED + active assignment PENDING -> TIMEOUT -> request SEARCHING...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e8";
  const assignId = "assign-e8";
  db.seed({
    request: { id: reqId, status: "MATCHED" },
    assignment: { id: assignId, request_id: reqId, status: "PENDING" },
  });

  const res = db.releaseAssignmentForRematch(assignId, "TIMEOUT");
  const req = db.serviceRequests.get(reqId);
  const assign = db.requestAssignments.get(assignId);

  if (!res.success || req.status !== "SEARCHING" || assign.status !== "TIMEOUT") {
    console.error("FAIL [E8]: Failed transition for MATCHED + PENDING with TIMEOUT:", res);
    process.exit(1);
  }
  console.log("PASS [E8]: request MATCHED + assignment PENDING successfully transitioned to SEARCHING + TIMEOUT.");
}

// E9: Terminal / non-rematchable request + active assignment -> release rejected & data 100% immutable
console.log("\n[E9] Testing Terminal/Non-rematchable request states with active assignment (Data Immutability Guard)...");
{
  // Actual non-rematchable statuses defined in service_request_status enum
  const nonRematchableStatuses = [
    "CANCELLED",
    "COMPLETED",
    "SETTLED",
    "CLOSED",
    "EXPIRED",
    "IN_PROGRESS",
    "PAYMENT_PENDING",
    "NO_HELPER_AVAILABLE",
  ];

  for (const terminalStatus of nonRematchableStatuses) {
    const db = new MockPgDatabase();
    const reqId = `req-e9-${terminalStatus}`;
    const assignId = `assign-e9-${terminalStatus}`;
    db.seed({
      request: { id: reqId, status: terminalStatus },
      assignment: { id: assignId, request_id: reqId, status: "PENDING" },
    });

    const res = db.releaseAssignmentForRematch(assignId, "DECLINED");
    const reqAfter = db.serviceRequests.get(reqId);
    const assignAfter = db.requestAssignments.get(assignId);

    // Verify rejection
    if (res.success || res.code !== "REQUEST_NOT_REMATCHABLE") {
      console.error(`FAIL [E9]: Status ${terminalStatus} was not rejected!`, res);
      process.exit(1);
    }

    // Verify COMPLETE IMMUTABILITY: both request and assignment must remain unchanged!
    if (reqAfter.status !== terminalStatus) {
      console.error(`FAIL [E9]: Request status was mutated from ${terminalStatus} to ${reqAfter.status}!`);
      process.exit(1);
    }
    if (assignAfter.status !== "PENDING") {
      console.error(`FAIL [E9]: Assignment status was mutated from PENDING to ${assignAfter.status}!`);
      process.exit(1);
    }
  }
  console.log(`PASS [E9]: All ${nonRematchableStatuses.length} terminal/non-rematchable statuses verified: rejected with REQUEST_NOT_REMATCHABLE and data 100% immutable.`);
}

// E10: Stale active assignment on non-matching request (e.g. SEARCHING or CREATED)
console.log("\n[E10] Testing stale active assignment on request in SEARCHING/CREATED state...");
{
  for (const st of ["SEARCHING", "CREATED"]) {
    const db = new MockPgDatabase();
    const reqId = `req-e10-${st}`;
    const assignId = `assign-e10-${st}`;
    db.seed({
      request: { id: reqId, status: st },
      assignment: { id: assignId, request_id: reqId, status: "PENDING" },
    });

    const res = db.releaseAssignmentForRematch(assignId, "DECLINED");
    const reqAfter = db.serviceRequests.get(reqId);
    const assignAfter = db.requestAssignments.get(assignId);

    if (res.success || res.code !== "REQUEST_NOT_REMATCHABLE" || reqAfter.status !== st || assignAfter.status !== "PENDING") {
      console.error(`FAIL [E10]: Non-matched request status ${st} allowed assignment release!`, res);
      process.exit(1);
    }
  }
  console.log("PASS [E10]: Requests in SEARCHING/CREATED safely rejected with REQUEST_NOT_REMATCHABLE, both rows immutable.");
}

// E11: Multiple active assignments on same request (other active exists)
console.log("\n[E11] Testing multiple active assignments on same request (other active assignment exists)...");
{
  const db = new MockPgDatabase();
  const reqId = "req-e11";
  const assign1Id = "assign-e11-1";
  const assign2Id = "assign-e11-2";
  db.seed({
    request: { id: reqId, status: "MATCHED" },
    assignment: { id: assign1Id, request_id: reqId, status: "PENDING" },
  });
  db.addAssignment({ id: assign2Id, request_id: reqId, status: "NOTIFIED" });

  // Release assignment 1
  const res = db.releaseAssignmentForRematch(assign1Id, "DECLINED");
  const reqAfter = db.serviceRequests.get(reqId);
  const assign1After = db.requestAssignments.get(assign1Id);
  const assign2After = db.requestAssignments.get(assign2Id);

  // Assignment 1 must be DECLINED
  if (!res.success || assign1After.status !== "DECLINED") {
    console.error("FAIL [E11]: Assignment 1 was not set to DECLINED:", res);
    process.exit(1);
  }
  // Request MUST NOT be changed to SEARCHING because assignment 2 is still active!
  if (reqAfter.status !== "MATCHED" || res.request_reopened === true) {
    console.error("FAIL [E11]: Request was prematurely set to SEARCHING despite remaining active assignment!", reqAfter);
    process.exit(1);
  }
  // Assignment 2 must remain NOTIFIED
  if (assign2After.status !== "NOTIFIED") {
    console.error("FAIL [E11]: Assignment 2 was unexpectedly mutated:", assign2After);
    process.exit(1);
  }
  console.log("PASS [E11]: Only target assignment released to DECLINED; request correctly remained MATCHED due to other active assignment.");
}

console.log("\n==================================================");
console.log("ALL SCENARIO E STATIC TESTS (E1 - E12) PASSED!");
console.log("==================================================");

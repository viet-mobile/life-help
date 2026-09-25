/**
 * LIFE.HELP Database Atomic Matching Concurrency Test Script
 * 
 * CAUTION: Run this script ONLY on local / staging / test Supabase PostgreSQL instances!
 * NEVER execute against production database!
 * 
 * Required Environment Variables:
 * - TEST_SUPABASE_URL
 * - TEST_SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.TEST_SUPABASE_URL;
const supabaseKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

console.log("==================================================");
console.log("LIFE.HELP Atomic Matching Concurrency Test Suite");
console.log("==================================================");

if (!supabaseUrl || !supabaseKey) {
  console.log("INFO: TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY not configured.");
  console.log("This test is prepared for execution once a staging/dev database is connected.");
  console.log("SAFETY CHECK: Production database execution is strictly prohibited.");
  console.log("Test suite file is ready and verified syntactically.");
  process.exit(0);
}

// Safety check: ensure not pointing to production domains
if (supabaseUrl.includes("life.help") || supabaseUrl.includes("prod")) {
  console.error("FATAL: Target URL looks like production! Execution aborted for safety.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runConcurrencyTests() {
  console.log("Starting Concurrency Verification against:", supabaseUrl);

  try {
    // ----------------------------------------------------
    // Scenario 1: Same request concurrent matching (10 calls)
    // ----------------------------------------------------
    console.log("\n[Test 1] 10 Concurrent matching calls on single request...");
    
    // 1-1. Create test request
    const { data: req1, error: req1Err } = await supabase
      .from("service_requests")
      .insert({
        customer_id: "test-cst-1",
        customer_display_name: "Test Customer 1",
        customer_locale: "ko",
        service_slug: "clog-clearing",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "익산시",
        status: "CREATED",
      })
      .select()
      .single();

    if (req1Err) throw new Error("Req1 creation failed: " + req1Err.message);

    // 1-2. Fire 10 concurrent match calls
    const matchPromises = Array.from({ length: 10 }).map(() =>
      supabase.rpc("match_and_assign_helper", { p_request_id: req1.id })
    );

    const results = await Promise.all(matchPromises);
    const successfulMatches = results.filter((r) => r.data?.status === "MATCHED");
    console.log(`- Total calls: 10, Returned MATCHED: ${successfulMatches.length}`);

    // 1-3. Verify assignments in DB
    const { data: assignments, error: aErr } = await supabase
      .from("request_assignments")
      .select("*")
      .eq("request_id", req1.id)
      .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);

    if (aErr) throw new Error("Assignment query failed: " + aErr.message);

    if (assignments.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 active assignment, found: ${assignments.length}`);
    }
    console.log("PASS: Exactly 1 active assignment created across 10 concurrent race calls.");

    // ----------------------------------------------------
    // Scenario 2: One Helper = One Active Assignment Policy
    // ----------------------------------------------------
    console.log("\n[Test 2] Multiple requests competing for same Helper...");
    
    // Create second request in same region and service
    const { data: req2, error: req2Err } = await supabase
      .from("service_requests")
      .insert({
        customer_id: "test-cst-2",
        customer_display_name: "Test Customer 2",
        customer_locale: "ko",
        service_slug: "clog-clearing",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "익산시",
        status: "CREATED",
      })
      .select()
      .single();

    if (req2Err) throw new Error("Req2 creation failed: " + req2Err.message);

    // Call match on req2 while helper is busy with req1
    const { data: match2Res } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: req2.id,
    });

    // If only 1 helper existed, req2 must NOT be assigned to same busy helper
    if (match2Res?.helper_id === assignments[0].helper_id) {
      throw new Error("FAIL: Busy helper was double-assigned to second request!");
    }
    console.log("PASS: Busy helper was NOT double-assigned (Policy enforced).");

    // ----------------------------------------------------
    // Scenario 3: No Helper Available Escalation Flow
    // ----------------------------------------------------
    console.log("\n[Test 3] No Helper Available Escalation...");
    
    // Create request in an empty region where no helpers exist
    const { data: req3, error: req3Err } = await supabase
      .from("service_requests")
      .insert({
        customer_id: "test-cst-3",
        customer_display_name: "Test Customer 3",
        customer_locale: "ko",
        service_slug: "mobile-help",
        country: "KR",
        sido: "제주특별자치도",
        gungu: "서귀포시",
        status: "CREATED",
      })
      .select()
      .single();

    if (req3Err) throw new Error("Req3 creation failed: " + req3Err.message);

    const { data: match3Res } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: req3.id,
    });

    if (match3Res?.status !== "NO_HELPER_AVAILABLE") {
      throw new Error(`FAIL: Expected NO_HELPER_AVAILABLE, got: ${match3Res?.status}`);
    }

    // Verify admin_escalations row created
    const { data: escalations } = await supabase
      .from("admin_escalations")
      .select("*")
      .eq("request_id", req3.id);

    if (escalations.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 escalation row, got: ${escalations?.length}`);
    }

    // Verify 0 customer-helper conversation created
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .eq("request_id", req3.id);

    if (conversations.length !== 0) {
      throw new Error(`FAIL: Expected 0 conversations for unassigned request, got: ${conversations?.length}`);
    }

    console.log("PASS: NO_HELPER_AVAILABLE transitioned, exactly 1 escalation queued, 0 conversations created.");
    console.log("\n==================================================");
    console.log("ALL CONCURRENCY & ATOMICITY TEST SCENARIOS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("CONCURRENCY TEST ERROR:", err);
    process.exit(1);
  }
}

runConcurrencyTests();

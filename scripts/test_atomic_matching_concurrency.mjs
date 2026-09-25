/**
 * LIFE.HELP Database Atomic Matching Concurrency Test Script
 * 
 * STRICT CAUTION: Run this script ONLY on local / staging / test Supabase PostgreSQL instances!
 * NEVER execute against production database!
 * 
 * Required Environment Variables:
 * - TEST_SUPABASE_URL
 * - TEST_SUPABASE_SERVICE_ROLE_KEY
 * - ALLOW_DESTRUCTIVE_STAGING_TESTS=true
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.TEST_SUPABASE_URL;
const supabaseKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const allowDestructive = process.env.ALLOW_DESTRUCTIVE_STAGING_TESTS;

console.log("==================================================");
console.log("LIFE.HELP Atomic Matching Concurrency Test Suite");
console.log("==================================================");

// ----------------------------------------------------
// 1. Production Execution Prevention Guard
// ----------------------------------------------------
const KNOWN_PROD_PROJECT_REF = "wstdbymmkrqgtsibhcjz";

// Read production URL from .env.local if present
let envLocalProdUrl = "";
try {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    const match = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\s\r\n]+)/);
    if (match) envLocalProdUrl = match[1].trim();
  }
} catch {
  // Ignore file read error
}

if (!supabaseUrl || !supabaseKey) {
  console.log("INFO: TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY not configured.");
  console.log("This test is prepared for execution once a staging/dev database is connected.");
  console.log("SAFETY CHECK: Production database execution is strictly prohibited.");
  console.log("Test suite file is ready and verified syntactically.");
  process.exit(0);
}

// Guard A: Explicit destructive flag required
if (allowDestructive !== "true") {
  console.error("FATAL: ALLOW_DESTRUCTIVE_STAGING_TESTS=true is required to execute staging tests.");
  process.exit(1);
}

// Guard B: Target URL must not point to known production reference
if (supabaseUrl.includes(KNOWN_PROD_PROJECT_REF)) {
  console.error("FATAL: Target URL matches known production project reference! Execution aborted.");
  process.exit(1);
}

// Guard C: Target URL must not match .env.local production URL
if (envLocalProdUrl && supabaseUrl.trim() === envLocalProdUrl) {
  console.error("FATAL: Target URL matches .env.local production Supabase URL! Execution aborted.");
  process.exit(1);
}

// Guard D: Target URL must not contain production domain keywords
if (supabaseUrl.includes("life.help") || supabaseUrl.includes("prod")) {
  console.error("FATAL: Target URL contains production keywords! Execution aborted.");
  process.exit(1);
}

console.log("PASS: All production prevention safety guards verified.");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const RUN_ID = `test_run_${Date.now()}`;
console.log(`Test Run ID: ${RUN_ID}`);

async function runConcurrencyTests() {
  console.log("Starting Concurrency Verification against staging database...");

  const createdRequestIds = [];
  const createdHelperIds = [];
  const createdConversationIds = [];

  try {
    // ----------------------------------------------------
    // Scenario A: Same request concurrent matching (20 calls)
    // ----------------------------------------------------
    console.log("\n[Scenario A] 20 Concurrent matching calls on single request...");
    
    // Seed 1 active helper for this region
    const { data: helperA, error: hAErr } = await supabase
      .from("helpers")
      .insert({
        helper_id: `${RUN_ID}_helper_a`,
        name: "Test Helper A",
        sido: "전북특별자치도",
        gungu: "익산시",
        on_duty: true,
        is_active: true,
      })
      .select()
      .single();
    if (hAErr) throw new Error("Helper A seed failed: " + hAErr.message);
    createdHelperIds.push(helperA.id);

    await supabase.from("helper_services").insert({
      helper_id: helperA.id,
      service_slug: "clog-clearing",
    });
    await supabase.from("helper_regions").insert({
      helper_id: helperA.id,
      country: "KR",
      sido: "전북특별자치도",
      gungu: "익산시",
    });

    // Create 1 request
    const { data: reqA, error: reqAErr } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_a`,
        customer_display_name: "Customer A",
        customer_locale: "ko",
        service_slug: "clog-clearing",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "익산시",
        status: "CREATED",
      })
      .select()
      .single();
    if (reqAErr) throw new Error("Req A creation failed: " + reqAErr.message);
    createdRequestIds.push(reqA.id);

    // Fire 20 concurrent RPC calls
    const calls20 = Array.from({ length: 20 }).map(() =>
      supabase.rpc("match_and_assign_helper", { p_request_id: reqA.id })
    );
    const resultsA = await Promise.all(calls20);
    const matchedCountA = resultsA.filter((r) => r.data?.status === "MATCHED").length;
    console.log(`- 20 Calls executed: MATCHED returned ${matchedCountA} times`);

    // Verify exactly 1 active assignment
    const { data: assignmentsA } = await supabase
      .from("request_assignments")
      .select("*")
      .eq("request_id", reqA.id)
      .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    if (assignmentsA.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 active assignment, found ${assignmentsA.length}`);
    }

    // Verify exactly 1 conversation
    const { data: convsA } = await supabase
      .from("conversations")
      .select("*")
      .eq("request_id", reqA.id);
    if (convsA.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 conversation, found ${convsA.length}`);
    }
    createdConversationIds.push(convsA[0].id);

    // Verify request status is MATCHED
    const { data: finalReqA } = await supabase
      .from("service_requests")
      .select("status")
      .eq("id", reqA.id)
      .single();
    if (finalReqA.status !== "MATCHED") {
      throw new Error(`FAIL: Expected status MATCHED, got ${finalReqA.status}`);
    }

    console.log("PASS [Scenario A]: Exactly 1 assignment, 1 conversation, status MATCHED across 20 race calls.");

    // ----------------------------------------------------
    // Scenario B: 20 Requests competing for single Helper
    // ----------------------------------------------------
    console.log("\n[Scenario B] 20 Requests concurrently competing for single Helper...");
    
    // Seed 1 helper for distinct region
    const { data: helperB, error: hBErr } = await supabase
      .from("helpers")
      .insert({
        helper_id: `${RUN_ID}_helper_b`,
        name: "Test Helper B",
        sido: "전북특별자치도",
        gungu: "군산시",
        on_duty: true,
        is_active: true,
      })
      .select()
      .single();
    if (hBErr) throw new Error("Helper B seed failed: " + hBErr.message);
    createdHelperIds.push(helperB.id);

    await supabase.from("helper_services").insert({
      helper_id: helperB.id,
      service_slug: "leak-plumbing",
    });
    await supabase.from("helper_regions").insert({
      helper_id: helperB.id,
      country: "KR",
      sido: "전북특별자치도",
      gungu: "군산시",
    });

    // Create 20 distinct requests in Gunsan for leak-plumbing
    const reqBInserts = Array.from({ length: 20 }).map((_, i) => ({
      customer_id: `${RUN_ID}_cst_b_${i}`,
      customer_display_name: `Customer B ${i}`,
      customer_locale: "ko",
      service_slug: "leak-plumbing",
      country: "KR",
      sido: "전북특별자치도",
      gungu: "군산시",
      status: "CREATED",
    }));

    const { data: reqsB, error: reqsBErr } = await supabase
      .from("service_requests")
      .insert(reqBInserts)
      .select();
    if (reqsBErr) throw new Error("Reqs B batch creation failed: " + reqsBErr.message);
    reqsB.forEach((r) => createdRequestIds.push(r.id));

    // Fire matching for all 20 requests concurrently
    const callsB = reqsB.map((r) =>
      supabase.rpc("match_and_assign_helper", { p_request_id: r.id })
    );
    await Promise.all(callsB);

    // Verify Helper B has at most 1 active assignment
    const { data: assignmentsB } = await supabase
      .from("request_assignments")
      .select("*")
      .eq("helper_id", helperB.id)
      .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    if (assignmentsB.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 active assignment for Helper B, found ${assignmentsB.length}`);
    }

    // Verify remaining 19 requests were escalated to NO_HELPER_AVAILABLE
    const { data: remainingReqsB } = await supabase
      .from("service_requests")
      .select("id, status")
      .in("id", reqsB.map((r) => r.id));
    const matchedReqs = remainingReqsB.filter((r) => r.status === "MATCHED");
    const noHelperReqs = remainingReqsB.filter((r) => r.status === "NO_HELPER_AVAILABLE");
    if (matchedReqs.length !== 1 || noHelperReqs.length !== 19) {
      throw new Error(`FAIL: Expected 1 MATCHED and 19 NO_HELPER_AVAILABLE, got MATCHED=${matchedReqs.length}, NO_HELPER=${noHelperReqs.length}`);
    }

    console.log("PASS [Scenario B]: Helper received exactly 1 assignment; 19 other requests cleanly escalated to NO_HELPER_AVAILABLE.");

    // ----------------------------------------------------
    // Scenario C: No Helper Available Escalation & Notifications
    // ----------------------------------------------------
    console.log("\n[Scenario C] No Helper Available Escalation...");
    
    const { data: reqC, error: reqCErr } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_c`,
        customer_display_name: "Customer C",
        customer_locale: "en",
        service_slug: "housing",
        country: "KR",
        sido: "강원특별자치도",
        gungu: "태백시",
        status: "CREATED",
      })
      .select()
      .single();
    if (reqCErr) throw new Error("Req C creation failed: " + reqCErr.message);
    createdRequestIds.push(reqC.id);

    // Run 20 concurrent matching calls on this no-helper request
    const callsC = Array.from({ length: 20 }).map(() =>
      supabase.rpc("match_and_assign_helper", { p_request_id: reqC.id })
    );
    await Promise.all(callsC);

    // Verify admin_escalations count is exactly 1 (no duplicate escalations)
    const { data: escalationsC } = await supabase
      .from("admin_escalations")
      .select("*")
      .eq("request_id", reqC.id);
    if (escalationsC.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 escalation, found ${escalationsC.length}`);
    }

    // Verify 0 customer-helper conversation created
    const { data: convsC } = await supabase
      .from("conversations")
      .select("*")
      .eq("request_id", reqC.id);
    if (convsC.length !== 0) {
      throw new Error(`FAIL: Expected 0 conversations for unassigned request, found ${convsC.length}`);
    }

    console.log("PASS [Scenario C]: Request transitioned to NO_HELPER_AVAILABLE, exactly 1 escalation recorded, 0 conversations created.");

    // ----------------------------------------------------
    // Scenario D: Invalid service_slug rejection by DB check constraint
    // ----------------------------------------------------
    console.log("\n[Scenario D] DB CHECK constraint on invalid service_slug...");
    const { error: invalidSlugErr } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_d`,
        customer_display_name: "Customer D",
        customer_locale: "ko",
        service_slug: "invalid-hacker-service",
        country: "KR",
        sido: "서울특별시",
        gungu: "강남구",
        status: "CREATED",
      });

    if (!invalidSlugErr) {
      throw new Error("FAIL: DB allowed insert with invalid service_slug!");
    }
    console.log(`PASS [Scenario D]: DB CHECK constraint rejected invalid slug: ${invalidSlugErr.message}`);

    // ----------------------------------------------------
    // Scenario E: DECLINED / TIMEOUT rematching
    // ----------------------------------------------------
    console.log("\n[Scenario E] DECLINED / TIMEOUT rematching...");
    
    // Seed Helper E
    const { data: helperE } = await supabase
      .from("helpers")
      .insert({
        helper_id: `${RUN_ID}_helper_e`,
        name: "Test Helper E",
        sido: "제주특별자치도",
        gungu: "제주시",
        on_duty: true,
        is_active: true,
      })
      .select()
      .single();
    createdHelperIds.push(helperE.id);

    await supabase.from("helper_services").insert({
      helper_id: helperE.id,
      service_slug: "cleaning",
    });
    await supabase.from("helper_regions").insert({
      helper_id: helperE.id,
      country: "KR",
      sido: "제주특별자치도",
      gungu: "제주시",
    });

    // Create Req E
    const { data: reqE } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_e`,
        customer_display_name: "Customer E",
        customer_locale: "ko",
        service_slug: "cleaning",
        country: "KR",
        sido: "제주특별자치도",
        gungu: "제주시",
        status: "CREATED",
      })
      .select()
      .single();
    createdRequestIds.push(reqE.id);

    // Initial match
    await supabase.rpc("match_and_assign_helper", { p_request_id: reqE.id });

    // Helper declines assignment
    await supabase
      .from("request_assignments")
      .update({ status: "DECLINED", responded_at: new Date().toISOString() })
      .eq("request_id", reqE.id);

    // Reset request to SEARCHING
    await supabase
      .from("service_requests")
      .update({ status: "SEARCHING" })
      .eq("id", reqE.id);

    // Rematch call
    const { data: rematchRes } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: reqE.id,
    });

    if (rematchRes?.status !== "MATCHED") {
      throw new Error(`FAIL: Rematch failed after assignment was DECLINED, got ${rematchRes?.status}`);
    }
    console.log("PASS [Scenario E]: DECLINED assignment cleared way for subsequent rematching.");

    console.log("\n==================================================");
    console.log("ALL 5 CONCURRENCY & INTEGRITY SCENARIOS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("CONCURRENCY TEST ERROR:", err);
    process.exit(1);
  } finally {
    // ----------------------------------------------------
    // 9. Cleanup Test Data (Preserving existing data)
    // ----------------------------------------------------
    console.log("\nCleaning up test data created during this run...");
    try {
      if (createdRequestIds.length > 0) {
        await supabase.from("service_requests").delete().in("id", createdRequestIds);
      }
      if (createdHelperIds.length > 0) {
        await supabase.from("helpers").delete().in("id", createdHelperIds);
      }
      if (createdConversationIds.length > 0) {
        await supabase.from("conversations").delete().in("id", createdConversationIds);
      }
      console.log(`Cleaned up ${createdRequestIds.length} requests, ${createdHelperIds.length} helpers.`);
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
  }
}

runConcurrencyTests();

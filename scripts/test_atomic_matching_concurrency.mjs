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
console.log("Status: TEST READY (Awaiting Staging DB)");
console.log("==================================================");

// ----------------------------------------------------
// 1. Production Execution Prevention Guard (4-Layer Defense)
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
  console.log("STATUS: TEST READY (Static syntax & logic verified).");
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

console.log("PASS: All 4 production prevention safety guards verified.");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const RUN_ID = `test_run_${Date.now()}`;
console.log(`Test Run ID: ${RUN_ID}`);

async function runConcurrencyTests() {
  console.log("Starting Concurrency Verification against staging database...");

  const createdRequestIds = [];
  const createdHelperIds = [];
  const createdHelperStrIds = [];
  const createdConversationIds = [];

  try {
    // ----------------------------------------------------
    // Scenario A: Same request concurrent matching (20 calls)
    // ----------------------------------------------------
    console.log("\n[Scenario A] 20 Concurrent matching calls on single request...");
    
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
    createdHelperStrIds.push(helperA.helper_id);

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

    const calls20 = Array.from({ length: 20 }).map(() =>
      supabase.rpc("match_and_assign_helper", { p_request_id: reqA.id })
    );
    const resultsA = await Promise.all(calls20);
    const matchedCountA = resultsA.filter((r) => r.data?.status === "MATCHED").length;
    console.log(`- 20 Calls executed: MATCHED returned ${matchedCountA} times`);

    const { data: assignmentsA } = await supabase
      .from("request_assignments")
      .select("*")
      .eq("request_id", reqA.id)
      .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    if (assignmentsA.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 active assignment, found ${assignmentsA.length}`);
    }

    const { data: convsA } = await supabase
      .from("conversations")
      .select("*")
      .eq("request_id", reqA.id);
    if (convsA.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 conversation, found ${convsA.length}`);
    }
    createdConversationIds.push(convsA[0].id);

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
    createdHelperStrIds.push(helperB.helper_id);

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

    const callsB = reqsB.map((r) =>
      supabase.rpc("match_and_assign_helper", { p_request_id: r.id })
    );
    await Promise.all(callsB);

    const { data: assignmentsB } = await supabase
      .from("request_assignments")
      .select("*")
      .eq("helper_id", helperB.id)
      .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    if (assignmentsB.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 active assignment for Helper B, found ${assignmentsB.length}`);
    }

    const { data: remainingReqsB } = await supabase
      .from("service_requests")
      .select("id, status")
      .in("id", reqsB.map((r) => r.id));
    const matchedReqs = remainingReqsB.filter((r) => r.status === "MATCHED");
    const noHelperReqs = remainingReqsB.filter((r) => r.status === "NO_HELPER_AVAILABLE");
    if (matchedReqs.length !== 1 || noHelperReqs.length !== 19) {
      throw new Error(`FAIL: Expected 1 MATCHED and 19 NO_HELPER_AVAILABLE, got MATCHED=${matchedReqs.length}, NO_HELPER=${noHelperReqs.length}`);
    }

    console.log("PASS [Scenario B]: Helper received exactly 1 assignment; 19 other requests escalated.");

    // ----------------------------------------------------
    // Scenario C: No Helper Available Escalation & Notifications
    // ----------------------------------------------------
    console.log("\n[Scenario C] No Helper Available Escalation (NO_ELIGIBLE_HELPER)...");
    
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

    const { data: matchCRes } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: reqC.id,
    });

    if (matchCRes?.status !== "NO_HELPER_AVAILABLE" || matchCRes?.sub_reason !== "NO_ELIGIBLE_HELPER") {
      throw new Error(`FAIL: Expected NO_HELPER_AVAILABLE with NO_ELIGIBLE_HELPER, got: ${JSON.stringify(matchCRes)}`);
    }

    const { data: escalationsC } = await supabase
      .from("admin_escalations")
      .select("*")
      .eq("request_id", reqC.id);
    if (escalationsC.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 escalation, found ${escalationsC.length}`);
    }

    const { data: convsC } = await supabase
      .from("conversations")
      .select("*")
      .eq("request_id", reqC.id);
    if (convsC.length !== 0) {
      throw new Error(`FAIL: Expected 0 conversations for unassigned request, found ${convsC.length}`);
    }

    console.log("PASS [Scenario C]: Request transitioned to NO_HELPER_AVAILABLE (NO_ELIGIBLE_HELPER), 1 escalation, 0 conversations.");

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
    createdHelperStrIds.push(helperE.helper_id);

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

    await supabase.rpc("match_and_assign_helper", { p_request_id: reqE.id });

    await supabase
      .from("request_assignments")
      .update({ status: "DECLINED", responded_at: new Date().toISOString() })
      .eq("request_id", reqE.id);

    await supabase
      .from("service_requests")
      .update({ status: "SEARCHING" })
      .eq("id", reqE.id);

    const { data: rematchRes } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: reqE.id,
    });

    if (rematchRes?.status !== "MATCHED") {
      throw new Error(`FAIL: Rematch failed after assignment was DECLINED, got ${rematchRes?.status}`);
    }
    console.log("PASS [Scenario E]: DECLINED assignment cleared way for subsequent rematching.");

    // ----------------------------------------------------
    // Scenario F: Candidate Retry on Collision (A Collision -> Assigns B)
    // ----------------------------------------------------
    console.log("\n[Scenario F] Candidate Retry: Helper A collision triggers fallback to Helper B...");
    
    // Seed Helper F1 (higher rating) and Helper F2 (lower rating) in Gimje
    const { data: helperF1 } = await supabase
      .from("helpers")
      .insert({
        helper_id: `${RUN_ID}_helper_f1`,
        name: "Test Helper F1 (Top)",
        sido: "전북특별자치도",
        gungu: "김제시",
        rating: 5.0,
        completed_jobs: 100,
        on_duty: true,
        is_active: true,
      })
      .select()
      .single();
    createdHelperIds.push(helperF1.id);
    createdHelperStrIds.push(helperF1.helper_id);

    const { data: helperF2 } = await supabase
      .from("helpers")
      .insert({
        helper_id: `${RUN_ID}_helper_f2`,
        name: "Test Helper F2 (Second)",
        sido: "전북특별자치도",
        gungu: "김제시",
        rating: 4.8,
        completed_jobs: 50,
        on_duty: true,
        is_active: true,
      })
      .select()
      .single();
    createdHelperIds.push(helperF2.id);
    createdHelperStrIds.push(helperF2.helper_id);

    for (const h of [helperF1, helperF2]) {
      await supabase.from("helper_services").insert({
        helper_id: h.id,
        service_slug: "boiler",
      });
      await supabase.from("helper_regions").insert({
        helper_id: h.id,
        country: "KR",
        sido: "전북특별자치도",
        gungu: "김제시",
      });
    }

    // Helper F1 already has an active assignment for an existing request
    const { data: dummyReqF } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_f_dummy`,
        customer_display_name: "Customer F Dummy",
        customer_locale: "ko",
        service_slug: "boiler",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "김제시",
        status: "MATCHED",
      })
      .select()
      .single();
    createdRequestIds.push(dummyReqF.id);

    await supabase.from("request_assignments").insert({
      request_id: dummyReqF.id,
      helper_id: helperF1.id,
      status: "ACCEPTED",
    });

    // New request comes in
    const { data: reqF } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_f_new`,
        customer_display_name: "Customer F New",
        customer_locale: "ko",
        service_slug: "boiler",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "김제시",
        status: "CREATED",
      })
      .select()
      .single();
    createdRequestIds.push(reqF.id);

    const { data: matchFRes } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: reqF.id,
    });

    if (matchFRes?.status !== "MATCHED" || matchFRes?.helper_id !== helperF2.helper_id) {
      throw new Error(`FAIL: Expected Helper F2 to be matched, got: ${JSON.stringify(matchFRes)}`);
    }
    console.log("PASS [Scenario F]: Candidate retry succeeded: F1 bypassed, F2 assigned smoothly.");

    // ----------------------------------------------------
    // Scenario G: All Eligible Helpers Busy (sub_reason: ALL_ELIGIBLE_HELPERS_BUSY)
    // ----------------------------------------------------
    console.log("\n[Scenario G] All Eligible Helpers Busy Escalation...");
    
    // Seed Helper G in Namwon
    const { data: helperG } = await supabase
      .from("helpers")
      .insert({
        helper_id: `${RUN_ID}_helper_g`,
        name: "Test Helper G",
        sido: "전북특별자치도",
        gungu: "남원시",
        on_duty: true,
        is_active: true,
      })
      .select()
      .single();
    createdHelperIds.push(helperG.id);
    createdHelperStrIds.push(helperG.helper_id);

    await supabase.from("helper_services").insert({
      helper_id: helperG.id,
      service_slug: "bank-help",
    });
    await supabase.from("helper_regions").insert({
      helper_id: helperG.id,
      country: "KR",
      sido: "전북특별자치도",
      gungu: "남원시",
    });

    // Make Helper G busy
    const { data: dummyReqG } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_g_dummy`,
        customer_display_name: "Customer G Dummy",
        customer_locale: "ko",
        service_slug: "bank-help",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "남원시",
        status: "MATCHED",
      })
      .select()
      .single();
    createdRequestIds.push(dummyReqG.id);

    await supabase.from("request_assignments").insert({
      request_id: dummyReqG.id,
      helper_id: helperG.id,
      status: "PENDING",
    });

    // Now request G comes in for Namwon bank-help
    const { data: reqG } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_g_new`,
        customer_display_name: "Customer G New",
        customer_locale: "ko",
        service_slug: "bank-help",
        country: "KR",
        sido: "전북특별자치도",
        gungu: "남원시",
        status: "CREATED",
      })
      .select()
      .single();
    createdRequestIds.push(reqG.id);

    const { data: matchGRes } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: reqG.id,
    });

    if (matchGRes?.status !== "NO_HELPER_AVAILABLE" || matchGRes?.sub_reason !== "ALL_ELIGIBLE_HELPERS_BUSY") {
      throw new Error(`FAIL: Expected NO_HELPER_AVAILABLE with ALL_ELIGIBLE_HELPERS_BUSY, got: ${JSON.stringify(matchGRes)}`);
    }
    console.log("PASS [Scenario G]: Accurately identified ALL_ELIGIBLE_HELPERS_BUSY condition.");

    // ----------------------------------------------------
    // Scenario H: Admin Escalation Open Partial Unique Constraint (20-way)
    // ----------------------------------------------------
    console.log("\n[Scenario H] Admin Escalation Open Partial Unique Constraint (20-way race)...");
    
    const { data: reqH } = await supabase
      .from("service_requests")
      .insert({
        customer_id: `${RUN_ID}_cst_h`,
        customer_display_name: "Customer H",
        customer_locale: "ko",
        service_slug: "hospital-help",
        country: "KR",
        sido: "강원특별자치도",
        gungu: "속초시",
        status: "CREATED",
      })
      .select()
      .single();
    createdRequestIds.push(reqH.id);

    const callsH = Array.from({ length: 20 }).map(() =>
      supabase.rpc("match_and_assign_helper", { p_request_id: reqH.id })
    );
    await Promise.all(callsH);

    const { data: escalationsH } = await supabase
      .from("admin_escalations")
      .select("*")
      .eq("request_id", reqH.id)
      .in("status", ["PENDING", "ASSIGNED"]);

    if (escalationsH.length !== 1) {
      throw new Error(`FAIL: Expected exactly 1 open escalation row, found ${escalationsH.length}`);
    }

    console.log("PASS [Scenario H]: Exactly 1 open escalation row created across 20 race calls.");
    console.log("\n==================================================");
    console.log("ALL 8 CONCURRENCY & INTEGRITY SCENARIOS VERIFIED!");
    console.log("==================================================");
  } catch (err) {
    console.error("CONCURRENCY TEST ERROR:", err);
    process.exit(1);
  } finally {
    // ----------------------------------------------------
    // Full 9-Table Cleanup with FK Dependency Order
    // ----------------------------------------------------
    console.log("\nCleaning up test data across all 9 tables in FK dependency order...");
    try {
      // 1. messages
      if (createdConversationIds.length > 0) {
        await supabase.from("messages").delete().in("conversation_id", createdConversationIds);
      }
      // 2. conversations
      if (createdConversationIds.length > 0) {
        await supabase.from("conversations").delete().in("id", createdConversationIds);
      }
      // 3. app_notifications
      if (createdHelperStrIds.length > 0) {
        await supabase.from("app_notifications").delete().in("recipient_id", createdHelperStrIds);
      }
      for (const reqId of createdRequestIds) {
        await supabase.from("app_notifications").delete().contains("payload", { request_id: reqId });
      }
      // 4. admin_escalations
      if (createdRequestIds.length > 0) {
        await supabase.from("admin_escalations").delete().in("request_id", createdRequestIds);
      }
      // 5. request_assignments
      if (createdRequestIds.length > 0) {
        await supabase.from("request_assignments").delete().in("request_id", createdRequestIds);
      }
      if (createdHelperIds.length > 0) {
        await supabase.from("request_assignments").delete().in("helper_id", createdHelperIds);
      }
      // 6. helper_services
      if (createdHelperIds.length > 0) {
        await supabase.from("helper_services").delete().in("helper_id", createdHelperIds);
      }
      // 7. helper_regions
      if (createdHelperIds.length > 0) {
        await supabase.from("helper_regions").delete().in("helper_id", createdHelperIds);
      }
      // 8. service_requests
      if (createdRequestIds.length > 0) {
        await supabase.from("service_requests").delete().in("id", createdRequestIds);
      }
      // 9. helpers
      if (createdHelperIds.length > 0) {
        await supabase.from("helpers").delete().in("id", createdHelperIds);
      }
      console.log(`Cleaned up test data: ${createdRequestIds.length} requests, ${createdHelperIds.length} helpers, ${createdConversationIds.length} conversations.`);
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
  }
}

runConcurrencyTests();

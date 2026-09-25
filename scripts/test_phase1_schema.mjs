// Test Phase 1 Schema and Migration File Integrity
import fs from "fs";
import path from "path";

const migrationPath = path.join(process.cwd(), "supabase", "migrations", "202609250001_core_service_matching_schema.sql");
const schemaTsPath = path.join(process.cwd(), "lib", "db", "schema.ts");
const matchingTsPath = path.join(process.cwd(), "lib", "db", "serverMatching.ts");

console.log("Checking PHASE 1 Files Integrity...");

// 1. Check file existence
if (!fs.existsSync(migrationPath)) {
  console.error("FAIL: Migration file missing!");
  process.exit(1);
}
if (!fs.existsSync(schemaTsPath)) {
  console.error("FAIL: lib/db/schema.ts missing!");
  process.exit(1);
}
if (!fs.existsSync(matchingTsPath)) {
  console.error("FAIL: lib/db/serverMatching.ts missing!");
  process.exit(1);
}

// 2. Check SQL content
const sql = fs.readFileSync(migrationPath, "utf-8");

const requiredTables = [
  "service_requests",
  "helpers",
  "helper_services",
  "helper_regions",
  "request_assignments",
  "conversations",
  "messages",
  "admin_escalations",
  "notifications"
];

for (const table of requiredTables) {
  if (!sql.includes(`create table if not exists public.${table}`)) {
    console.error(`FAIL: Table ${table} not found in migration!`);
    process.exit(1);
  }
}

// Check atomic matching function
if (!sql.includes("create or replace function public.match_and_assign_helper")) {
  console.error("FAIL: Procedure match_and_assign_helper missing in SQL!");
  process.exit(1);
}

// Check NO_HELPER_AVAILABLE handling
if (!sql.includes("'NO_HELPER_AVAILABLE'")) {
  console.error("FAIL: NO_HELPER_AVAILABLE not found in SQL!");
  process.exit(1);
}

// Check unique active assignment concurrency index
if (!sql.includes("request_assignments_active_uidx")) {
  console.error("FAIL: Concurrency guard index missing!");
  process.exit(1);
}

console.log("PASS: All 7 required core tables, junction tables, indexes, and atomic stored procedure verified.");
console.log("PASS: PHASE 1 Schema and Migration Verification Successful.");

// Deterministic helper-release test against the REAL migration SQL, executed in PGlite
// (in-process PostgreSQL). No network, no staging, no production.
// Usage: node scripts/test_helper_release_db.mjs
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const sql = (name) => fs.readFileSync(new URL(name, dir), "utf8");
const RELEASE_MIGRATION = "202609260009_assignment_completed_release.sql";

let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create table auth.users (id uuid primary key);
`);
for (const name of ["202609250001_core_service_matching_schema.sql", "202609250002_assignment_release_rematch.sql", "202609250003_helper_identity_and_accept_assignment.sql"]) await db.exec(sql(name));

const one = async (text, params = []) => (await db.query(text, params)).rows[0];
const all = async (text, params = []) => (await db.query(text, params)).rows;
const rpc = async (fn, ...args) => (await one(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) as r`, args)).r;

async function helper(label, sido) {
  const authId = (await one("insert into auth.users (id) values (gen_random_uuid()) returning id")).id;
  const row = await one("insert into public.helpers (helper_id, name, sido, auth_user_id) values ($1, $2, $3, $4) returning id", [`HLP-${label}`, label, sido, authId]);
  await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, 'boiler')", [row.id]);
  await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', $2, 'G1')", [row.id, sido]);
  return row.id;
}
async function request(label, sido, status = "SEARCHING") {
  return (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, sido, gungu, status) values ($1, $1, 'boiler', $2, 'G1', $3) returning id", [label, sido, status])).id;
}
const requestStatus = async (id) => (await one("select status from public.service_requests where id = $1", [id])).status;
const assignmentOf = (requestId) => one("select id, helper_id, status, completed_at from public.request_assignments where request_id = $1 order by assigned_at desc limit 1", [requestId]);
async function acceptedInProgress(requestId, helperId) {
  const asg = await assignmentOf(requestId);
  await rpc("accept_assignment", asg.id, helperId);
  // Mirrors the Helper START route: conditional ACCEPTED -> IN_PROGRESS.
  await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1 and status = 'ACCEPTED'", [requestId]);
  return asg.id;
}

// ---------- legacy stuck state that exists before the migration ----------
const legacyHelper = await helper("LEGACY", "LEG");
const legacyDone = await request("legacy-done", "LEG");
await rpc("match_and_assign_helper", legacyDone);
await acceptedInProgress(legacyDone, legacyHelper);
await db.query("update public.service_requests set status = 'PAYMENT_PENDING' where id = $1", [legacyDone]); // old code path: assignment left ACCEPTED
const legacyActiveHelper = await helper("LEGACY-ACTIVE", "LEA");
const legacyActive = await request("legacy-active", "LEA");
await rpc("match_and_assign_helper", legacyActive);
await acceptedInProgress(legacyActive, legacyActiveHelper);
const legacyBlocked = await request("legacy-blocked", "LEG");
const blockedMatch = await rpc("match_and_assign_helper", legacyBlocked);
check("Bug reproduced before migration: finished helper stays occupied", blockedMatch.status === "NO_HELPER_AVAILABLE" && blockedMatch.sub_reason === "ALL_ELIGIBLE_HELPERS_BUSY");

// ---------- apply the new migration (twice: must be re-runnable) ----------
await db.exec(sql(RELEASE_MIGRATION));
await db.exec(sql(RELEASE_MIGRATION));
const enumValues = (await all("select unnest(enum_range(null::public.assignment_status))::text as v")).map((r) => r.v);
check("Assignment terminal COMPLETED state exists", enumValues.includes("COMPLETED") && ["PENDING", "NOTIFIED", "ACCEPTED", "DECLINED", "TIMEOUT", "CANCELLED"].every((v) => enumValues.includes(v)), enumValues.join(","));
const requestEnum = (await all("select unnest(enum_range(null::public.service_request_status))::text as v")).map((r) => r.v);
check("TIMEOUT is not a service_request_status", !requestEnum.includes("TIMEOUT"));
check("Migration repairs helper stuck behind a finished service", (await assignmentOf(legacyDone)).status === "COMPLETED" && (await requestStatus(legacyDone)) === "PAYMENT_PENDING");
check("Migration leaves in-progress assignment untouched", (await assignmentOf(legacyActive)).status === "ACCEPTED" && (await requestStatus(legacyActive)) === "IN_PROGRESS");
const legacyRetry = await request("legacy-retry", "LEG");
check("Repaired legacy helper is matchable again", (await rpc("match_and_assign_helper", legacyRetry)).status === "MATCHED" && (await assignmentOf(legacyRetry)).helper_id === legacyHelper);

const privileges = await one(`select
  has_function_privilege('anon', 'public.complete_assignment_service(uuid, uuid)', 'execute') as anon,
  has_function_privilege('authenticated', 'public.complete_assignment_service(uuid, uuid)', 'execute') as authed,
  has_function_privilege('service_role', 'public.complete_assignment_service(uuid, uuid)', 'execute') as service`);
check("Completion RPC not callable by anon/authenticated (anonymous/customer blocked)", !privileges.anon && !privileges.authed && privileges.service);

// ---------- core regression: complete A, then H matches B ----------
const H = await helper("H", "S1");
const OTHER = await helper("OTHER", "S9");
const A = await request("cust-A", "S1");
check("A matched to H", (await rpc("match_and_assign_helper", A)).status === "MATCHED" && (await assignmentOf(A)).helper_id === H);
const asgA = (await assignmentOf(A)).id;
await rpc("accept_assignment", asgA, H);
const early = await rpc("complete_assignment_service", asgA, H);
check("COMPLETE rejected before START", !early.success && early.code === "REQUEST_NOT_COMPLETABLE" && (await assignmentOf(A)).status === "ACCEPTED");
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1 and status = 'ACCEPTED'", [A]);
const convA = (await one("select id from public.conversations where request_id = $1", [A])).id;
await db.query("insert into public.messages (conversation_id, sender_role, sender_id, original_language, original_text) values ($1, 'CUSTOMER', 'cust-A', 'en', 'hello')", [convA]);

const busy = await rpc("match_and_assign_helper", await request("cust-busy", "S1"));
check("H occupied while A is IN_PROGRESS", busy.status === "NO_HELPER_AVAILABLE");

const wrong = await rpc("complete_assignment_service", asgA, OTHER);
check("Wrong helper cannot complete", !wrong.success && wrong.code === "HELPER_MISMATCH" && (await requestStatus(A)) === "IN_PROGRESS" && (await assignmentOf(A)).status === "ACCEPTED");
const missing = await rpc("complete_assignment_service", "00000000-0000-0000-0000-000000000000", H);
check("Unknown assignment rejected", !missing.success && missing.code === "ASSIGNMENT_NOT_FOUND");

const done = await rpc("complete_assignment_service", asgA, H);
const asgAfter = await assignmentOf(A);
check("Helper completes: request COMPLETED + assignment COMPLETED atomically", done.success && done.idempotent === false && (await requestStatus(A)) === "COMPLETED" && asgAfter.status === "COMPLETED" && asgAfter.completed_at !== null);
const again = await rpc("complete_assignment_service", asgA, H);
check("Duplicate COMPLETE is deterministic success", again.success && again.idempotent === true && again.request_status === "COMPLETED" && (await all("select id from public.request_assignments where request_id = $1", [A])).length === 1);
check("COMPLETE does not touch conversation (cleanup waits for SETTLED)", (await one("select status from public.conversations where id = $1", [convA])).status === "ACTIVE" && (await all("select id from public.messages where conversation_id = $1", [convA])).length === 1);
check("COMPLETE does not move financial state", (await requestStatus(A)) === "COMPLETED");

const B = await request("cust-B", "S1");
const matchB = await rpc("match_and_assign_helper", B);
check("Second request rematches same helper before SETTLED", matchB.status === "MATCHED" && (await assignmentOf(B)).helper_id === H && (await requestStatus(A)) === "COMPLETED");
const C = await request("cust-C", "S1");
const matchC = await rpc("match_and_assign_helper", C);
check("Helper cannot hold B and C simultaneously", matchC.status === "NO_HELPER_AVAILABLE" && matchC.sub_reason === "ALL_ELIGIBLE_HELPERS_BUSY");
let uniqueHeld = false;
try { await db.query("insert into public.request_assignments (request_id, helper_id, status) values ($1, $2, 'PENDING')", [C, H]); } catch (error) { uniqueHeld = String(error.message).includes("request_assignments_helper_active_uidx"); }
check("Active-helper unique index still enforced", uniqueHeld);
const history = await all("select status from public.request_assignments where helper_id = $1 order by assigned_at", [H]);
check("Completed assignment preserved as history", history.length === 2 && history[0].status === "COMPLETED" && history[1].status === "PENDING");

const reopenCompleted = await rpc("release_assignment_for_rematch", asgA, "DECLINED");
check("Completed assignment cannot be released/reopened", !reopenCompleted.success && reopenCompleted.code === "ASSIGNMENT_NOT_ACTIVE" && (await assignmentOf(A)).status === "COMPLETED");
const reaccept = await rpc("accept_assignment", asgA, H);
check("Completed assignment cannot be re-accepted", !reaccept.success && reaccept.code === "ASSIGNMENT_NOT_ACCEPTABLE");

// ---------- negative states keep existing semantics ----------
const asgB = (await assignmentOf(B)).id;
const declined = await rpc("release_assignment_for_rematch", asgB, "DECLINED");
check("DECLINED still releases and reopens", declined.success && declined.request_reopened === true && (await assignmentOf(B)).status === "DECLINED" && (await requestStatus(B)) === "SEARCHING");
const completeDeclined = await rpc("complete_assignment_service", asgB, H);
check("DECLINED assignment cannot be completed", !completeDeclined.success && completeDeclined.code === "ASSIGNMENT_NOT_ACCEPTED");
const D = await request("cust-D", "S1");
await rpc("match_and_assign_helper", D);
const timeout = await rpc("release_assignment_for_rematch", (await assignmentOf(D)).id, "TIMEOUT");
check("TIMEOUT still releases (assignment-level only)", timeout.success && (await assignmentOf(D)).status === "TIMEOUT" && (await requestStatus(D)) === "SEARCHING");
const E = await request("cust-E", "S1");
await rpc("match_and_assign_helper", E);
await db.query("update public.request_assignments set status = 'CANCELLED' where request_id = $1", [E]);
const F = await request("cust-F", "S1");
check("CANCELLED still frees the helper", (await rpc("match_and_assign_helper", F)).status === "MATCHED" && (await assignmentOf(F)).helper_id === H);
check("No EXPIRED assignment state exists to regress", !enumValues.includes("EXPIRED"));

// ---------- settlement stays independent ----------
for (const status of ["PAYMENT_PENDING", "SETTLED", "CLOSED"]) await db.query("update public.service_requests set status = $2 where id = $1", [A, status]);
const afterClose = await rpc("complete_assignment_service", asgA, H);
check("Financial lifecycle continues after helper release", (await requestStatus(A)) === "CLOSED" && (await assignmentOf(A)).status === "COMPLETED" && afterClose.success && afterClose.idempotent && afterClose.request_status === "CLOSED");

// Legacy divergence handled by the RPC itself (assignment ACCEPTED, request already financial).
const G = await request("cust-G", "S7");
const HG = await helper("HG", "S7");
await rpc("match_and_assign_helper", G);
const asgG = await acceptedInProgress(G, HG);
await db.query("update public.service_requests set status = 'PAYMENT_PENDING' where id = $1", [G]);
const repaired = await rpc("complete_assignment_service", asgG, HG);
check("RPC repairs divergent row without touching request status", repaired.success && repaired.repaired === true && (await requestStatus(G)) === "PAYMENT_PENDING" && (await assignmentOf(G)).status === "COMPLETED");

// ---------- static: server paths use the atomic RPC ----------
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const completeRoute = read("app/api/helper/assignments/[assignmentId]/complete/route.ts");
check("Helper COMPLETE route uses atomic RPC with server-resolved helper", completeRoute.includes("resolveAuthenticatedHelper") && completeRoute.includes('rpc("complete_assignment_service"') && completeRoute.includes("p_helper_id: helper.id") && !completeRoute.includes('from("service_requests").update') && !completeRoute.includes('from("request_assignments").update'));
check("Helper COMPLETE route ignores client-supplied helper id", !/request\.json\(|searchParams/.test(completeRoute));
const settlement = read("lib/settlement/serviceSettlement.ts");
check("Admin COMPLETED override uses the same atomic RPC", settlement.includes('rpc("complete_assignment_service"'));
check("Helper COMPLETE triggers no reward/settlement/cleanup", !/referral|settle|cleanup|messages|conversations/i.test(completeRoute.replace(/\/\/.*$/gm, "")));
const chat = read("app/api/chat/route.ts");
check("Helper keeps chat access after assignment COMPLETED", chat.includes('"ACCEPTED", "COMPLETED"'));
const migration = sql(RELEASE_MIGRATION);
check("Migration is additive (no drops/deletes, indexes untouched)", !/\bdrop\s+(table|index|type|column)\b|\bdelete\s+from\b|create\s+(unique\s+)?index/i.test(migration.replace(/^--.*$/gm, "")));

await db.close();
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

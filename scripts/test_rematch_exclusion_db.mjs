// Deterministic rematch-exclusion test against the REAL migration SQL, executed in PGlite
// (in-process PostgreSQL). No network, no staging, no production.
//   * Reproduces the bug on the pre-011 matcher (declined / timed-out helper re-picked).
//   * Proves 202609260011: same-request DECLINED/TIMEOUT exclusion, request-specific only,
//     ranking / region / active-assignment behaviour unchanged.
// Usage: node scripts/test_rematch_exclusion_db.mjs
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const sql = (name) => fs.readFileSync(new URL(name, dir), "utf8");
const BASE = ["202609250001_core_service_matching_schema.sql", "202609250002_assignment_release_rematch.sql", "202609250003_helper_identity_and_accept_assignment.sql", "202609260009_assignment_completed_release.sql"];
const MIGRATION = "202609260011_exclude_declined_timeout_from_rematch.sql";

let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

async function database(withFix) {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key);");
  for (const name of BASE) await db.exec(sql(name));
  if (withFix) await db.exec(sql(MIGRATION));
  const one = async (text, params = []) => (await db.query(text, params)).rows[0];
  const all = async (text, params = []) => (await db.query(text, params)).rows;
  const rpc = async (fn, ...args) => (await one(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) as r`, args)).r;
  async function helper(label, sido, { rating = 5, jobs = 0, gungu = "G1", onDuty = true } = {}) {
    const row = await one("insert into public.helpers (helper_id, name, sido, rating, completed_jobs, on_duty, is_active) values ($1, $1, $2, $3, $4, $5, true) returning id", [`HLP-${label}`, sido, rating, jobs, onDuty]);
    await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, 'boiler')", [row.id]);
    await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', $2, $3)", [row.id, sido, gungu]);
    return row.id;
  }
  const request = async (label, sido, gungu = "G1") => (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, sido, gungu, status) values ($1, $1, 'boiler', $2, $3, 'SEARCHING') returning id", [label, sido, gungu])).id;
  const active = (requestId) => one("select id, helper_id from public.request_assignments where request_id = $1 and status in ('PENDING','NOTIFIED','ACCEPTED')", [requestId]);
  const match = async (requestId) => { const r = await rpc("match_and_assign_helper", requestId); return { ...r, assigned: (await active(requestId))?.helper_id ?? null }; };
  /** Existing release path: DECLINED / TIMEOUT + reopen, then the same RPC the decline route calls. */
  async function releaseAndRematch(requestId, status) {
    const asg = await active(requestId);
    const release = await rpc("release_assignment_for_rematch", asg.id, status);
    return { release, rematch: release.request_reopened ? await match(requestId) : null };
  }
  return { db, one, all, rpc, helper, request, active, match, releaseAndRematch };
}

// ================= bug reproduction on the pre-011 matcher =================
{
  const t = await database(false);
  const h1 = await t.helper("BUG1", "BUG");
  const r1 = await t.request("bug-declined", "BUG");
  await t.match(r1);
  const declined = await t.releaseAndRematch(r1, "DECLINED");
  check("BUG reproduced (pre-011): helper who DECLINED is re-picked for the same request", declined.rematch?.status === "MATCHED" && declined.rematch.assigned === h1, JSON.stringify(declined.rematch));
  const h2 = await t.helper("BUG2", "BUG-T");
  const r2 = await t.request("bug-timeout", "BUG-T");
  await t.match(r2);
  const timedOut = await t.releaseAndRematch(r2, "TIMEOUT");
  check("BUG reproduced (pre-011): helper who TIMED OUT is re-picked for the same request", timedOut.rematch?.status === "MATCHED" && timedOut.rematch.assigned === h2, JSON.stringify(timedOut.rematch));
}

// ================= with migration 011 =================
const t = await database(true);

// A / B / C: declined helper excluded for the same request only
{
  const h1 = await t.helper("A1", "SA", { rating: 5 });
  const h2 = await t.helper("A2", "SA", { rating: 4 });
  const r1 = await t.request("a-r1", "SA");
  const first = await t.match(r1);
  check("A0. initial match picks highest-rated H1", first.status === "MATCHED" && first.assigned === h1);
  const { release, rematch } = await t.releaseAndRematch(r1, "DECLINED");
  check("A. declined H1 is NOT re-selected for R1", release.success && rematch.assigned !== h1);
  check("B. R1 goes to the next eligible helper H2", rematch.status === "MATCHED" && rematch.assigned === h2);
  const history = await t.all("select helper_id, status from public.request_assignments where request_id = $1 order by assigned_at", [r1]);
  check("B2. history kept: H1 DECLINED row + H2 PENDING row", history.length === 2 && history[0].status === "DECLINED" && history[0].helper_id === h1 && history[1].status === "PENDING" && history[1].helper_id === h2);
  const r2 = await t.request("a-r2", "SA");
  const other = await t.match(r2);
  check("C. declined H1 is still eligible for a different request R2", other.status === "MATCHED" && other.assigned === h1);
  const notes = await t.all("select recipient_id from public.app_notifications where type = 'NEW_SERVICE_REQUEST' and payload->>'request_id' = $1 order by created_at", [r1]);
  check("Push/in-app target after rematch: exactly one new-assignment notification per assignment (H1, then H2)", notes.length === 2 && notes[0].recipient_id === "HLP-A1" && notes[1].recipient_id === "HLP-A2");
  check("Push target helper = the active assignment's helper (H2, not H1)", (await t.active(r1)).helper_id === h2);
}

// D / E: TIMEOUT behaves the same
{
  const h1 = await t.helper("D1", "SD", { rating: 5 });
  const h2 = await t.helper("D2", "SD", { rating: 4 });
  const r1 = await t.request("d-r1", "SD");
  await t.match(r1);
  const { rematch } = await t.releaseAndRematch(r1, "TIMEOUT");
  check("D. timed-out H1 excluded; R1 goes to H2", rematch.status === "MATCHED" && rematch.assigned === h2);
  const r2 = await t.request("d-r2", "SD");
  check("E. timed-out H1 still eligible for a different request R2", (await t.match(r2)).assigned === h1);
}

// F / G: the only helper declined / timed out -> normal no-helper path, no re-pick
for (const [label, status] of [["F", "DECLINED"], ["G", "TIMEOUT"]]) {
  const h1 = await t.helper(`${label}1`, `S${label}`);
  const r1 = await t.request(`${label}-r1`, `S${label}`);
  await t.match(r1);
  const { rematch } = await t.releaseAndRematch(r1, status);
  const rows = await t.all("select helper_id, status from public.request_assignments where request_id = $1", [r1]);
  const request = await t.one("select status from public.service_requests where id = $1", [r1]);
  const escalations = await t.all("select reason from public.admin_escalations where request_id = $1", [r1]);
  check(`${label}. only helper ${status} -> R1 does NOT reacquire H1; NO_HELPER_AVAILABLE + escalation`, rematch.status === "NO_HELPER_AVAILABLE" && rematch.assigned === null && rows.length === 1 && rows[0].status === status && rows[0].helper_id === h1 && request.status === "NO_HELPER_AVAILABLE" && escalations.length === 1, JSON.stringify({ rematch, rows, request }));
}

// H: COMPLETED history on an unrelated request never excludes
{
  const h1 = await t.helper("H1", "SH");
  const r0 = await t.request("h-r0", "SH");
  await t.match(r0);
  const asg = await t.active(r0);
  await t.rpc("accept_assignment", asg.id, h1);
  await t.db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [r0]);
  const done = await t.rpc("complete_assignment_service", asg.id, h1);
  const r3 = await t.request("h-r3", "SH");
  check("H. COMPLETED history on another request does not make H1 unavailable", done.success && (await t.match(r3)).assigned === h1);
}

// I: global active-assignment protection unchanged
{
  const h1 = await t.helper("I1", "SI");
  const r1 = await t.request("i-r1", "SI"), r2 = await t.request("i-r2", "SI");
  const [m1, m2] = [await t.match(r1), await t.match(r2)];
  check("I. one helper cannot hold two active assignments (second request gets no helper)", m1.assigned === h1 && m2.status === "NO_HELPER_AVAILABLE" && m2.assigned === null);
  let violation = null;
  try { await t.db.query("insert into public.request_assignments (request_id, helper_id, status) values ($1, $2, 'PENDING')", [r2, h1]); } catch (error) { violation = error.code; }
  check("I2. request_assignments_helper_active_uidx still rejects a second active row (23505)", violation === "23505");
  const busy = await t.one("select sub_reason from (select payload->>'sub_reason' as sub_reason from public.app_notifications where type = 'NO_HELPER_AVAILABLE' and payload->>'request_id' = $1) s", [r2]);
  check("I3. existing no-helper sub_reason logic unchanged (ALL_ELIGIBLE_HELPERS_BUSY)", busy?.sub_reason === "ALL_ELIGIBLE_HELPERS_BUSY");
}

// Ranking / region regression among still-eligible helpers
{
  const h1 = await t.helper("K1", "SK", { rating: 5, jobs: 99 });
  const h2 = await t.helper("K2", "SK", { rating: 4.5, jobs: 1 });
  const h3 = await t.helper("K3", "SK", { rating: 4.5, jobs: 7 });
  await t.helper("K4", "SK-OTHER", { rating: 5 });
  const wildcard = await t.helper("K5", "SK", { rating: 4, gungu: "전체" });
  const r = await t.request("k-r", "SK");
  check("Ranking: highest-rated H1 matched first", (await t.match(r)).assigned === h1);
  const second = (await t.releaseAndRematch(r, "DECLINED")).rematch;
  check("Ranking: H1 declined -> next by rating, completed_jobs tiebreak (H3 before H2)", second.assigned === h3);
  const third = (await t.releaseAndRematch(r, "DECLINED")).rematch;
  check("Ranking: H3 declined -> H2 (both earlier decliners excluded)", third.assigned === h2);
  const fourth = (await t.releaseAndRematch(r, "TIMEOUT")).rematch;
  check("Region: gungu wildcard ('전체') helper still eligible; other-sido helper never", fourth.assigned === wildcard);
  const fifth = (await t.releaseAndRematch(r, "DECLINED")).rematch;
  check("Chain end: every same-request decliner excluded -> NO_HELPER_AVAILABLE", fifth.status === "NO_HELPER_AVAILABLE");
}

// Off-duty / other statuses unchanged; CANCELLED/COMPLETED on the same request are not exclusions
{
  const h1 = await t.helper("L1", "SL");
  const r = await t.request("l-r", "SL");
  await t.db.query("insert into public.request_assignments (request_id, helper_id, status) values ($1, $2, 'CANCELLED')", [r, h1]);
  check("CANCELLED history on the same request is NOT an exclusion (rule not expanded)", (await t.match(r)).assigned === h1);
}

// ================= static: 011 = 0001 body + exactly the one added filter =================
const body = (text) => text.slice(text.indexOf("create or replace function public.match_and_assign_helper"), text.indexOf("$$;", text.indexOf("create or replace function public.match_and_assign_helper")) + 3);
const original = body(sql(BASE[0]));
const replaced = body(sql(MIGRATION));
const added = `      -- 202609260011: a helper who declined / timed out on THIS request is never re-picked for it.
      and not exists (
        select 1 from public.request_assignments previous
        where previous.request_id = v_req.id
          and previous.helper_id = h.id
          and previous.status in ('DECLINED', 'TIMEOUT')
      )
`;
check("011 function body = 0001 body + only the same-request DECLINED/TIMEOUT filter", replaced.includes(added) && replaced.replace(added, "") === original, `${replaced.length} vs ${original.length}`);
check("Signature, security definer and grants preserved", replaced.startsWith("create or replace function public.match_and_assign_helper(p_request_id uuid)\nreturns jsonb\nlanguage plpgsql\nsecurity definer") && sql(MIGRATION).includes("grant execute on function public.match_and_assign_helper(uuid) to service_role;") && sql(MIGRATION).includes("revoke execute on function public.match_and_assign_helper(uuid) from anon;"));
check("Migration 011 changes no table, index or data", !/\b(alter|drop|create)\s+(table|index|unique|type)\b|\b(delete|update|insert)\b[^;]*\bpublic\.(helpers|request_assignments|service_requests)\b(?![^;]*\$\$)/i.test(sql(MIGRATION).replace(original, "").replace(replaced, "").replace(/^--.*$/gm, "")));
check("No later migration redefines the matcher (011 is the only replacement)", fs.readdirSync(dir).filter((f) => f.endsWith(".sql") && /function public\.match_and_assign_helper\(p_request_id uuid\)/.test(sql(f))).sort().join() === [BASE[0], MIGRATION].join());

if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

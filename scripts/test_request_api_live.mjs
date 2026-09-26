/**
 * LIFE.HELP P2-1/P2-2 STAGING LIVE tests for POST /api/requests.
 *
 * STRICT CAUTION: staging only. Production is unconditionally refused.
 *
 * Spawns its own `next dev` server whose Supabase env is injected from .env.staging.local
 * (process env takes precedence over .env.local), seeds RUN_ID-scoped helpers in RUN_ID-unique
 * regions, exercises the HTTP API, verifies DB state with the service role, and cleans up only
 * this RUN_ID's rows (FK-safe).
 *
 * Required (.env.staging.local or env):
 *   TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY,
 *   ALLOW_DESTRUCTIVE_STAGING_TESTS=true, EXPECTED_STAGING_PROJECT_REF
 *
 * Usage: node scripts/test_request_api_live.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { spawn, execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { assertStagingUrl, runGuarded } from "./lib/envGuard.mjs";

const root = process.cwd();
const KNOWN_PROD_PROJECT_REF = "wstdbymmkrqgtsibhcjz";
const KNOWN_STAGING_PROJECT_REF = "wreebowcbiymodswajwe";
const PORT = Number(process.env.LIVE_TEST_PORT || 3217);
const BASE = `http://localhost:${PORT}`;
const RECOVERY_TOKEN = `live-recovery-${crypto.randomUUID()}-${crypto.randomUUID()}`;

// ---------------------------------------------------------------------------
// Env + guards
// ---------------------------------------------------------------------------
const stagingEnvPath = path.resolve(root, ".env.staging.local");
if (fs.existsSync(stagingEnvPath)) {
  for (const line of fs.readFileSync(stagingEnvPath, "utf-8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const url = process.env.TEST_SUPABASE_URL || "";
// Shared tripwire (in addition to the checks below): only the staging project, never unknown.
await runGuarded("staging target", () => assertStagingUrl(url, "TEST_SUPABASE_URL"));
const anonKey = process.env.TEST_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || "";
const expectedRef = process.env.EXPECTED_STAGING_PROJECT_REF || "";

function abort(msg) {
  console.error(`FATAL: ${msg} Execution aborted.`);
  process.exit(1);
}
if (url.includes(KNOWN_PROD_PROJECT_REF) || expectedRef === KNOWN_PROD_PROJECT_REF) {
  abort("Production project ref detected.");
}
if (!url || !anonKey || !serviceKey) abort("TEST_SUPABASE_URL / ANON / SERVICE_ROLE keys are required.");
if (process.env.ALLOW_DESTRUCTIVE_STAGING_TESTS !== "true") abort("ALLOW_DESTRUCTIVE_STAGING_TESTS=true is required.");
const actualRef = (url.match(/^https?:\/\/([^.]+)\.supabase\.(?:co|in)/) || [])[1] || "";
if (!actualRef || actualRef !== expectedRef || actualRef !== KNOWN_STAGING_PROJECT_REF) {
  abort(`Project ref mismatch (actual=${actualRef}, expected=${expectedRef}).`);
}
console.log(`Target project ref verified: ${actualRef} (staging)`);

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const RUN_ID = `P2REQ${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
console.log(`RUN_ID=${RUN_ID}`);

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const randomCustomerId = () =>
  `CST-${Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("")}`;

let passed = 0;
let failed = 0;
const results = {};
function check(test, name, cond, detail = "") {
  results[test] = results[test] !== false && cond;
  if (cond) { passed++; console.log(`PASS  [${test}] ${name}`); }
  else { failed++; console.log(`FAIL  [${test}] ${name}${detail ? ` :: ${detail}` : ""}`); }
}

const created = { requestIds: new Set(), helperUuids: new Set() };
const TABLES = ["service_requests", "helpers", "helper_services", "helper_regions", "request_assignments",
  "conversations", "messages", "admin_escalations", "app_notifications"];

async function tableCounts() {
  const out = {};
  for (const t of TABLES) {
    const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) throw new Error(`count ${t}: ${error.message}`);
    out[t] = count;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dev server
// ---------------------------------------------------------------------------
const logPath = path.join(os.tmpdir(), `lifehelp-live-${RUN_ID}.log`);
let server;
function startServer() {
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    LIFE_HELP_RECOVERY_TOKEN: RECOVERY_TOKEN,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  const log = fs.openSync(logPath, "w");
  server = spawn("npx", ["next", "dev", "-p", String(PORT)], { cwd: root, env, shell: true, stdio: ["ignore", log, log] });
}
function stopServer() {
  if (!server?.pid) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-server.pid, "SIGTERM");
  } catch { /* already exited */ }
}
async function waitForServer(timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/requests`, { method: "GET" });
      if (r.status === 405) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("dev server did not become ready");
}

async function postRequest(body, idempotencyKey = crypto.randomUUID()) {
  const r = await fetch(`${BASE}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const json = await r.json().catch(() => null);
  if (json?.requestId) created.requestIds.add(json.requestId);
  return { status: r.status, json, idempotencyKey };
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------
async function seedHelper(suffix, sido, gungu, service, rating) {
  const { data, error } = await db.from("helpers").insert({
    helper_id: `HLP-${RUN_ID}-${suffix}`,
    name: `LIVE ${RUN_ID} ${suffix}`,
    country: "KR",
    sido,
    gungu,
    primary_locale: "ko",
    spoken_locales: ["ko"],
    on_duty: true,
    is_active: true,
    rating,
  }).select("id").single();
  if (error) throw new Error(`seed helper: ${error.message}`);
  created.helperUuids.add(data.id);
  const s = await db.from("helper_services").insert({ helper_id: data.id, service_slug: service });
  if (s.error) throw new Error(`seed helper_services: ${s.error.message}`);
  const g = await db.from("helper_regions").insert({ helper_id: data.id, country: "KR", sido, gungu });
  if (g.error) throw new Error(`seed helper_regions: ${g.error.message}`);
  return data.id;
}

const REGION_A = { sido: `LIVE-${RUN_ID}-A`, gungu: "G1" }; // 1 helper
const REGION_B = { sido: `LIVE-${RUN_ID}-B`, gungu: "G1" }; // no helper
const REGION_C = { sido: `LIVE-${RUN_ID}-C`, gungu: "G1" }; // 2 helpers
const REGION_D = { sido: `LIVE-${RUN_ID}-D`, gungu: "G1" }; // no helper, idempotency tests

const makeBody = (region, overrides = {}) => ({
  service_slug: "boiler",
  customer_id: randomCustomerId(),
  customer_locale: "vi",
  country: "KR",
  sido: region.sido,
  gungu: region.gungu,
  dong: "D1",
  address: `${RUN_ID} test address`,
  description: `  Bình nóng lạnh bị hỏng ${RUN_ID}\n보일러 고장 `,
  selected_options: ["온수가 나오지 않음"],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Cleanup (FK-safe, RUN_ID scoped)
// ---------------------------------------------------------------------------
async function cleanup() {
  const reqIds = [...created.requestIds];
  // Also sweep any request rows carrying this RUN_ID (e.g. created before a response was read).
  const { data: sweep } = await db.from("service_requests").select("id").like("address", `%${RUN_ID}%`);
  for (const r of sweep || []) reqIds.push(r.id);
  const { data: hs } = await db.from("helpers").select("id").like("helper_id", `%${RUN_ID}%`);
  const helperUuids = [...new Set([...created.helperUuids, ...(hs || []).map((h) => h.id)])];
  const uniqReqIds = [...new Set(reqIds)];

  const errors = [];
  const run = async (label, p) => { const { error } = await p; if (error) errors.push(`${label}: ${error.message}`); };

  if (uniqReqIds.length) {
    const { data: convs } = await db.from("conversations").select("id").in("request_id", uniqReqIds);
    const convIds = (convs || []).map((c) => c.id);
    if (convIds.length) await run("messages", db.from("messages").delete().in("conversation_id", convIds));
    await run("conversations", db.from("conversations").delete().in("request_id", uniqReqIds));
    for (const id of uniqReqIds) {
      await run("app_notifications", db.from("app_notifications").delete().eq("payload->>request_id", id));
    }
    await run("admin_escalations", db.from("admin_escalations").delete().in("request_id", uniqReqIds));
    await run("request_assignments", db.from("request_assignments").delete().in("request_id", uniqReqIds));
  }
  if (helperUuids.length) {
    await run("helper_services", db.from("helper_services").delete().in("helper_id", helperUuids));
    await run("helper_regions", db.from("helper_regions").delete().in("helper_id", helperUuids));
  }
  if (uniqReqIds.length) await run("service_requests", db.from("service_requests").delete().in("id", uniqReqIds));
  if (helperUuids.length) await run("helpers", db.from("helpers").delete().in("id", helperUuids));
  return { errors, reqIds: uniqReqIds, helperUuids };
}

async function residue(reqIds, helperUuids) {
  const counts = {};
  const c = async (label, q) => { const { count, error } = await q; counts[label] = error ? `ERR ${error.message}` : count; };
  await c("service_requests(run)", db.from("service_requests").select("*", { count: "exact", head: true }).like("address", `%${RUN_ID}%`));
  await c("helpers(run)", db.from("helpers").select("*", { count: "exact", head: true }).like("helper_id", `%${RUN_ID}%`));
  if (reqIds.length) {
    await c("service_requests(ids)", db.from("service_requests").select("*", { count: "exact", head: true }).in("id", reqIds));
    await c("request_assignments", db.from("request_assignments").select("*", { count: "exact", head: true }).in("request_id", reqIds));
    await c("conversations", db.from("conversations").select("*", { count: "exact", head: true }).in("request_id", reqIds));
    await c("admin_escalations", db.from("admin_escalations").select("*", { count: "exact", head: true }).in("request_id", reqIds));
    let notif = 0;
    for (const id of reqIds) {
      const { count } = await db.from("app_notifications").select("*", { count: "exact", head: true }).eq("payload->>request_id", id);
      notif += count || 0;
    }
    counts.app_notifications = notif;
  }
  if (helperUuids.length) {
    await c("helper_services", db.from("helper_services").select("*", { count: "exact", head: true }).in("helper_id", helperUuids));
    await c("helper_regions", db.from("helper_regions").select("*", { count: "exact", head: true }).in("helper_id", helperUuids));
  }
  await c("app_notifications(helper run)", db.from("app_notifications").select("*", { count: "exact", head: true }).like("recipient_id", `%${RUN_ID}%`));
  return counts;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
async function main() {
  const before = await tableCounts();
  console.log("Pre-test table counts:", JSON.stringify(before));

  const helperA = await seedHelper("A1", REGION_A.sido, REGION_A.gungu, "boiler", 4.5);
  const helperC1 = await seedHelper("C1", REGION_C.sido, REGION_C.gungu, "cleaning", 4.9);
  const helperC2 = await seedHelper("C2", REGION_C.sido, REGION_C.gungu, "cleaning", 4.1);

  startServer();
  await waitForServer();
  console.log("Dev server ready (staging env injected).");

  // LIVE-1: eligible helper -> MATCHED
  {
    const body = makeBody(REGION_A);
    const { status, json } = await postRequest(body);
    check("LIVE-1", "HTTP 201 + MATCHED", status === 201 && json?.success === true && json?.status === "MATCHED", JSON.stringify(json));
    check("LIVE-1", "response contract keys exact",
      json && JSON.stringify(Object.keys(json).sort()) === JSON.stringify(["assignmentId", "conversationId", "requestId", "status", "success"]));
    const { data: req } = await db.from("service_requests").select("*").eq("id", json?.requestId).maybeSingle();
    check("LIVE-1", "service_requests row inserted", !!req);
    check("LIVE-1", "request status MATCHED", req?.status === "MATCHED", req?.status);
    check("LIVE-1", "original description preserved exactly", req?.description === body.description);
    check("LIVE-1", "customer_id / locale / display name stored",
      req?.customer_id === body.customer_id && req?.customer_locale === "vi" && req?.customer_display_name === `Khách hàng · ${body.customer_id}`);
    const { data: asg } = await db.from("request_assignments").select("*").eq("request_id", json?.requestId)
      .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    check("LIVE-1", "exactly 1 active assignment", asg?.length === 1, String(asg?.length));
    check("LIVE-1", "assignmentId matches DB active assignment + eligible helper",
      asg?.[0]?.id === json?.assignmentId && asg?.[0]?.helper_id === helperA);
    const { data: convs } = await db.from("conversations").select("*").eq("request_id", json?.requestId);
    check("LIVE-1", "exactly 1 conversation, id matches response", convs?.length === 1 && convs[0].id === json?.conversationId);
    check("LIVE-1", "conversation bound to customer + helper", convs?.[0]?.customer_id === body.customer_id && convs?.[0]?.helper_id === helperA);
    check("LIVE-1", "no helper personal data in response", !JSON.stringify(json).includes(`HLP-${RUN_ID}`) && !JSON.stringify(json).includes(`LIVE ${RUN_ID}`));
    const { count: esc } = await db.from("admin_escalations").select("*", { count: "exact", head: true }).eq("request_id", json?.requestId);
    check("LIVE-1", "no admin escalation", esc === 0);
  }

  // LIVE-2: no helper -> NO_HELPER_AVAILABLE
  {
    const body = makeBody(REGION_B);
    const { status, json } = await postRequest(body);
    check("LIVE-2", "HTTP 201 + NO_HELPER_AVAILABLE", status === 201 && json?.success === true && json?.status === "NO_HELPER_AVAILABLE", JSON.stringify(json));
    check("LIVE-2", "subReason NO_ELIGIBLE_HELPER", json?.subReason === "NO_ELIGIBLE_HELPER");
    check("LIVE-2", "response contract keys exact",
      json && JSON.stringify(Object.keys(json).sort()) === JSON.stringify(["requestId", "status", "subReason", "success"]));
    const id = json?.requestId;
    const { data: req } = await db.from("service_requests").select("status, description").eq("id", id).maybeSingle();
    check("LIVE-2", "request status NO_HELPER_AVAILABLE", req?.status === "NO_HELPER_AVAILABLE", req?.status);
    check("LIVE-2", "original description preserved", req?.description === body.description);
    const { count: a } = await db.from("request_assignments").select("*", { count: "exact", head: true }).eq("request_id", id);
    check("LIVE-2", "assignment 0", a === 0, String(a));
    const { count: cv } = await db.from("conversations").select("*", { count: "exact", head: true }).eq("request_id", id);
    check("LIVE-2", "conversation 0", cv === 0, String(cv));
    const { data: esc } = await db.from("admin_escalations").select("*").eq("request_id", id);
    check("LIVE-2", "admin escalation 1 (PENDING, NO_HELPER_AVAILABLE)",
      esc?.length === 1 && esc[0].status === "PENDING" && esc[0].reason === "NO_HELPER_AVAILABLE");
    const { data: notif } = await db.from("app_notifications").select("*").eq("payload->>request_id", id);
    check("LIVE-2", "admin notification 1", notif?.length === 1 && notif[0].recipient_type === "ADMIN" && notif[0].type === "NO_HELPER_AVAILABLE");
  }

  // LIVE-3: invalid input -> 400, no DB residue
  {
    const marker = `${RUN_ID}-L3`;
    const cases = [
      ["invalid service slug", makeBody(REGION_A, { service_slug: "toilet-clog", address: marker })],
      ["invalid locale", makeBody(REGION_A, { customer_locale: "xx", address: marker })],
      ["empty description", makeBody(REGION_A, { description: "   ", address: marker })],
      ["invalid customer_id", makeBody(REGION_A, { customer_id: "HLP-1001", address: marker })],
      ["malformed JSON", "{not json"],
    ];
    for (const [label, body] of cases) {
      const { status, json } = await postRequest(body);
      check("LIVE-3", `${label} -> 400`, status === 400 && json?.success === false && typeof json?.code === "string", `${status} ${JSON.stringify(json)}`);
    }
    const { count } = await db.from("service_requests").select("*", { count: "exact", head: true }).like("address", `%${marker}%`);
    check("LIVE-3", "DB residue 0 for invalid requests", count === 0, String(count));
  }

  // LIVE-4: same customer, two valid requests -> distinct UUIDs, no cross-contamination
  {
    const customerId = randomCustomerId();
    const b1 = makeBody(REGION_C, { customer_id: customerId, service_slug: "cleaning", description: `first ${RUN_ID}` });
    const b2 = makeBody(REGION_C, { customer_id: customerId, service_slug: "cleaning", description: `second ${RUN_ID}` });
    const r1 = await postRequest(b1);
    const r2 = await postRequest(b2);
    check("LIVE-4", "both MATCHED", r1.json?.status === "MATCHED" && r2.json?.status === "MATCHED", `${JSON.stringify(r1.json)} ${JSON.stringify(r2.json)}`);
    check("LIVE-4", "distinct request UUIDs", r1.json?.requestId && r1.json.requestId !== r2.json?.requestId);
    check("LIVE-4", "distinct assignment + conversation ids",
      r1.json?.assignmentId !== r2.json?.assignmentId && r1.json?.conversationId !== r2.json?.conversationId);
    const { data: rows } = await db.from("service_requests").select("id, description, customer_id").in("id", [r1.json?.requestId, r2.json?.requestId]);
    const byId = Object.fromEntries((rows || []).map((r) => [r.id, r]));
    check("LIVE-4", "each request keeps its own description",
      byId[r1.json?.requestId]?.description === b1.description && byId[r2.json?.requestId]?.description === b2.description);
    const { data: c1 } = await db.from("conversations").select("id, request_id, customer_id, helper_id").eq("id", r1.json?.conversationId).maybeSingle();
    const { data: c2 } = await db.from("conversations").select("id, request_id, customer_id, helper_id").eq("id", r2.json?.conversationId).maybeSingle();
    check("LIVE-4", "conversations point at their own request",
      c1?.request_id === r1.json?.requestId && c2?.request_id === r2.json?.requestId);
    check("LIVE-4", "same customer on both, different helpers (one active job per helper)",
      c1?.customer_id === customerId && c2?.customer_id === customerId && c1?.helper_id !== c2?.helper_id &&
        [helperC1, helperC2].includes(c1?.helper_id) && [helperC1, helperC2].includes(c2?.helper_id));
    check("LIVE-4", "higher-rated helper matched first", c1?.helper_id === helperC1);
  }

  // LIVE-5: duplicate POST convergence and payload collision protection
  {
    const key = crypto.randomUUID();
    const body = makeBody(REGION_D, { customer_id: randomCustomerId(), description: `${RUN_ID} duplicate payload` });
    const all = await Promise.all(Array.from({ length: 20 }, () => postRequest(body, key)));
    const ids = new Set(all.map((r) => r.json?.requestId));
    const requestId = all[0].json?.requestId;
    check("LIVE-5", "20 concurrent identical POSTs converge to one request",
      all.every((r) => r.status === 201 || r.status === 200) && ids.size === 1 && !!requestId, JSON.stringify(all.map((r) => [r.status, r.json?.code])));
    const { count: requestCount } = await db.from("service_requests").select("*", { count: "exact", head: true }).eq("id", requestId);
    const { count: activeAssignments } = await db.from("request_assignments").select("*", { count: "exact", head: true })
      .eq("request_id", requestId).in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    const { count: conversations } = await db.from("conversations").select("*", { count: "exact", head: true }).eq("request_id", requestId);
    check("LIVE-5", "one request, at most one active assignment, at most one conversation",
      requestCount === 1 && activeAssignments <= 1 && conversations <= 1, JSON.stringify({ requestCount, activeAssignments, conversations }));
    const replay = await postRequest(body, key);
    check("LIVE-5", "same key and payload replays the same request", replay.status === 200 && replay.json?.requestId === requestId && replay.json?.status === all[0].json?.status);
    const conflict = await postRequest({ ...body, description: `${RUN_ID} changed payload` }, key);
    check("LIVE-5", "same key with different payload is rejected and row is unchanged",
      conflict.status === 409 && conflict.json?.code === "IDEMPOTENCY_KEY_CONFLICT" && !conflict.json?.requestId);
    const { data: unchanged } = await db.from("service_requests").select("description").eq("id", requestId).maybeSingle();
    check("LIVE-5", "collision attempt did not mutate original row", unchanged?.description === body.description);
  }

  // LIVE-6: authenticated orphan recovery and terminal-state protection
  {
    const orphanBody = makeBody(REGION_D, { customer_id: randomCustomerId(), description: `${RUN_ID} recovery orphan` });
    const createdOrphan = await postRequest(orphanBody);
    const orphanId = createdOrphan.json?.requestId;
    created.requestIds.add(orphanId);
    await db.from("app_notifications").delete().eq("payload->>request_id", orphanId);
    await db.from("admin_escalations").delete().eq("request_id", orphanId);
    await db.from("service_requests").update({ status: "SEARCHING", created_at: new Date(Date.now() - 120000).toISOString() }).eq("id", orphanId);
    const recover = async (requestId) => fetch(`${BASE}/api/sys/requests/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RECOVERY_TOKEN}` },
      body: JSON.stringify({ request_id: requestId, min_age_seconds: 30 }),
    }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));
    const recoveries = await Promise.all(Array.from({ length: 20 }, () => recover(orphanId)));
    check("LIVE-6", "20 concurrent orphan recoveries are authorized and converge",
      recoveries.every((r) => r.status === 200) && recoveries.some((r) => r.json?.results?.[0]?.outcome === "RECOVERED"));
    const { data: recoveredRow } = await db.from("service_requests").select("status").eq("id", orphanId).maybeSingle();
    const { count: recoveredAssignments } = await db.from("request_assignments").select("*", { count: "exact", head: true })
      .eq("request_id", orphanId).in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]);
    const { count: recoveredConversations } = await db.from("conversations").select("*", { count: "exact", head: true }).eq("request_id", orphanId);
    check("LIVE-6", "recovered orphan has one terminal matching result and no duplicate children",
      ["MATCHED", "NO_HELPER_AVAILABLE"].includes(recoveredRow?.status) && recoveredAssignments <= 1 && recoveredConversations <= 1,
      JSON.stringify({ status: recoveredRow?.status, recoveredAssignments, recoveredConversations }));

    const terminalBody = makeBody(REGION_D, { customer_id: randomCustomerId(), description: `${RUN_ID} terminal recovery guard` });
    const terminalCreated = await postRequest(terminalBody);
    const terminalId = terminalCreated.json?.requestId;
    created.requestIds.add(terminalId);
    await db.from("service_requests").update({ status: "CANCELLED" }).eq("id", terminalId);
    const terminalRecovery = await recover(terminalId);
    const { data: terminalRow } = await db.from("service_requests").select("status").eq("id", terminalId).maybeSingle();
    check("LIVE-6", "terminal request recovery is rejected without mutation",
      terminalRecovery.status === 200 && terminalRecovery.json?.results?.[0]?.reason === "NOT_SEARCHING" && terminalRow?.status === "CANCELLED");
    const anonymous = await fetch(`${BASE}/api/sys/requests/recover`, { method: "POST", body: JSON.stringify({ request_id: terminalId }) });
    check("LIVE-6", "anonymous recovery is unauthorized", anonymous.status === 401);
  }

  console.log("LIVE-7: matching RPC transport failure remains STATIC ONLY (covered by static test 10d) because altering Phase 1 DB objects is prohibited.");
  return before;
}

let before;
let exitCode = 0;
try {
  before = await main();
} catch (err) {
  exitCode = 1;
  console.error("LIVE test error:", err instanceof Error ? err.message : String(err));
} finally {
  stopServer();
  const { errors, reqIds, helperUuids } = await cleanup();
  if (errors.length) console.log("Cleanup errors:", errors);
  const res = await residue(reqIds, helperUuids);
  const zero = Object.values(res).every((v) => v === 0);
  console.log("RUN_ID residue:", JSON.stringify(res));
  check("CLEANUP", "RUN_ID residue 0 across all tables", zero && errors.length === 0);
  if (before) {
    const after = await tableCounts();
    console.log("Post-cleanup table counts:", JSON.stringify(after));
    check("CLEANUP", "table counts restored to pre-test values (no other staging data touched)",
      JSON.stringify(after) === JSON.stringify(before));
  }
  console.log(`\nRUN_ID=${RUN_ID}`);
  console.log(`Dev server log: ${logPath}`);
  console.log(`${passed} passed, ${failed} failed`);
  for (const [k, v] of Object.entries(results)) console.log(`${k}: ${v ? "PASS" : "FAIL"}`);
  process.exit(exitCode || (failed === 0 ? 0 : 1));
}

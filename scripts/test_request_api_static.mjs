/**
 * LIFE.HELP P2-1/P2-2 + P2-2.5 static tests: POST /api/requests validation, response contract,
 * idempotency, SEARCHING-orphan recovery, and client-side matching removal.
 *
 * No network or database access. The server modules are bundled with esbuild ("server-only" and the
 * Cloudflare context stubbed) and exercised against an in-memory fake Supabase that models:
 *   - service_requests primary-key uniqueness (23505 on duplicate id)
 *   - match_and_assign_helper's row lock + CREATED/SEARCHING status guard (atomic per call)
 *
 * Usage: node scripts/test_request_api_static.mjs
 */

import { build } from "esbuild";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf-8");

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

// ---------------------------------------------------------------------------
// Bundle the server modules
// ---------------------------------------------------------------------------
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "lifehelp-req-test-"));
const outFile = path.join(outDir, "bundle.mjs");
await build({
  stdin: {
    contents: [
      'export * from "@/lib/request/serverRequest";',
      'export * from "@/lib/request/requestRecovery";',
      'export * from "@/lib/request/recoveryAuth";',
      'export * from "@/lib/request/idempotencyKey";',
    ].join("\n"),
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: outFile,
  logLevel: "silent",
  alias: { "@": root },
  external: ["@supabase/supabase-js"],
  plugins: [
    {
      name: "stubs",
      setup(b) {
        b.onResolve({ filter: /^(server-only|@opennextjs\/cloudflare)$/ }, (a) => ({ path: a.path, namespace: "stub" }));
        b.onLoad({ filter: /^server-only$/, namespace: "stub" }, () => ({ contents: "", loader: "js" }));
        b.onLoad({ filter: /^@opennextjs\/cloudflare$/, namespace: "stub" }, () => ({
          contents: "export async function getCloudflareContext() { throw new Error('no cloudflare context in tests'); }",
          loader: "js",
        }));
      },
    },
  ],
});
const mod = await import(pathToFileURL(outFile).href);
const {
  validateCreateServiceRequest, validateIdempotencyKey, deriveRequestIdFromIdempotencyKey, submitServiceRequest,
  isSameLogicalRequest, CORE_SERVICE_SLUGS, checkOrphanEligibility, recoverOrphanRequest, recoverOrphanRequests,
  authorizeRecoveryRequest, createIdempotencyKey, IDEMPOTENCY_KEY_PATTERN,
} = mod;

const EXPECTED_SLUGS = [
  "clog-clearing", "leak-plumbing", "boiler", "cleaning", "housing",
  "bank-help", "insurance-help", "job-help", "hospital-help", "mobile-help",
];

const base = () => ({
  service_slug: "boiler",
  customer_id: "KQJMWXPA",
  customer_locale: "vi",
  country: "KR",
  sido: "전북특별자치도",
  gungu: "익산시",
  dong: "신동",
  address: "전북특별자치도 익산시 신동 대학로 123",
  description: "  Bình nóng lạnh bị hỏng.\n보일러 고장 ",
  selected_options: ["온수가 나오지 않음"],
});
const input = (o = {}) => validateCreateServiceRequest({ ...base(), ...o }).value;

// ---------------------------------------------------------------------------
// 1-4. Payload validation (P2-1/P2-2 regression)
// ---------------------------------------------------------------------------
check("1a. CORE_SERVICE_SLUGS is exactly the 10 services",
  JSON.stringify([...CORE_SERVICE_SLUGS].sort()) === JSON.stringify([...EXPECTED_SLUGS].sort()));
for (const slug of EXPECTED_SLUGS) {
  check(`1b. valid slug accepted: ${slug}`, validateCreateServiceRequest({ ...base(), service_slug: slug }).ok === true);
}
for (const slug of ["toilet-clog", "sink-clog", "BOILER", "", " boiler", "plumbing", 42, null, undefined]) {
  const r = validateCreateServiceRequest({ ...base(), service_slug: slug });
  check(`2. invalid slug rejected: ${JSON.stringify(slug)}`,
    r.ok === false && r.error.httpStatus === 400 && r.error.body.field === "service_slug");
}
for (const loc of ["xx", "zh", "KO", "ur", "lo", "", null, 1]) {
  const r = validateCreateServiceRequest({ ...base(), customer_locale: loc });
  check(`3. invalid locale rejected: ${JSON.stringify(loc)}`,
    r.ok === false && r.error.httpStatus === 400 && r.error.body.field === "customer_locale");
}
const localeBlock = read("messages/index.ts").match(/export const locales = \[([\s\S]*?)\] as const/)[1];
const allLocales = [...localeBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
check("3b. project defines exactly 38 locales", allLocales.length === 38, `found ${allLocales.length}`);
check("3c. all 38 locales accepted",
  allLocales.every((l) => validateCreateServiceRequest({ ...base(), customer_locale: l }).ok === true));
for (const d of ["", "   ", "\n\t ", undefined, null, 5]) {
  const r = validateCreateServiceRequest({ ...base(), description: d });
  check(`4. empty/invalid description rejected: ${JSON.stringify(d)}`,
    r.ok === false && r.error.httpStatus === 400 && r.error.body.field === "description");
}
for (const [field, value] of [
  ["customer_id", "CST-0000"], ["customer_id", "HLP-1001"], ["customer_id", "kqjmw xpa"], ["customer_id", ""],
  ["country", "kr"], ["country", "KOR"], ["sido", ""], ["gungu", "   "], ["address", ""],
  ["selected_options", "not-array"], ["selected_options", [""]], ["selected_options", [1]],
  ["description", "a\u0000b"], ["sido", "x".repeat(101)], ["description", "x".repeat(5001)],
]) {
  const r = validateCreateServiceRequest({ ...base(), [field]: value });
  check(`4b. invalid ${field} rejected: ${JSON.stringify(value).slice(0, 30)}`,
    r.ok === false && r.error.httpStatus === 400 && r.error.body.field === field);
}
check("4c. non-object body rejected", validateCreateServiceRequest([]).ok === false &&
  validateCreateServiceRequest("x").ok === false && validateCreateServiceRequest(null).ok === false);

// ---------------------------------------------------------------------------
// I1. Idempotency key validation + derivation
// ---------------------------------------------------------------------------
const K1 = "0f8fad5b-d9cb-469f-a165-70867728950e";
for (const good of [K1, createIdempotencyKey(), createIdempotencyKey()]) {
  check(`I1a. valid v4 key accepted: ${good}`, validateIdempotencyKey(good).ok === true);
}
for (const bad of [null, undefined, "", K1.toUpperCase(), "0f8fad5b-d9cb-169f-a165-70867728950e" /* v1 */,
  "0f8fad5b-d9cb-469f-c165-70867728950e" /* bad variant */, "CST-7A29", "CST-7A29-1727222400000",
  `${K1} `, K1.replace(/-/g, ""), "x".repeat(36)]) {
  const r = validateIdempotencyKey(bad);
  check(`I1b. invalid key rejected: ${JSON.stringify(bad)}`,
    r.ok === false && r.error.httpStatus === 400 && r.error.body.field === "Idempotency-Key" &&
      !JSON.stringify(r.error.body).includes(String(bad || "§")));
}
const id1 = await deriveRequestIdFromIdempotencyKey(K1);
const id1b = await deriveRequestIdFromIdempotencyKey(K1);
const id2 = await deriveRequestIdFromIdempotencyKey(createIdempotencyKey());
check("I1c. derivation deterministic", id1 === id1b);
check("I1d. derived id is a version-8 RFC 9562 UUID (disjoint from DB-default v4 ids)",
  /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id1), id1);
check("I1e. different keys -> different ids", id1 !== id2);
check("I1f. derived id does not contain the key", !id1.includes(K1.slice(0, 8)) && !id1.includes(K1.slice(-12)));
check("I1g. client key generator produces 50 unique valid v4 keys",
  new Set(Array.from({ length: 50 }, () => createIdempotencyKey())).size === 50 &&
    Array.from({ length: 20 }, () => createIdempotencyKey()).every((k) => IDEMPOTENCY_KEY_PATTERN.test(k)));

// ---------------------------------------------------------------------------
// In-memory fake Supabase
// ---------------------------------------------------------------------------
function fakeDb() {
  const db = {
    tables: { service_requests: [], request_assignments: [], conversations: [], admin_escalations: [], app_notifications: [], helpers: [] },
    rpcMode: "match", // match | nohelper | fail-transport | fail-sql
    rpcCalls: 0,
    insertFailure: null,
    seq: 0,
  };
  const uid = () => `00000000-0000-4000-8000-${String(++db.seq).padStart(12, "0")}`;
  const colValue = (row, col) => {
    const m = col.match(/^(\w+)->>(\w+)$/);
    return m ? (row[m[1]] ?? {})[m[2]] : row[col];
  };
  const tick = () => new Promise((r) => setImmediate(r));

  function builder(table) {
    const q = { filters: [], order: null, limit: null, head: false, count: false, cols: "*" };
    const exec = async () => {
      await tick();
      let rows = db.tables[table].filter((row) => q.filters.every(([op, c, v]) => {
        const x = colValue(row, c);
        if (op === "eq") return x === v;
        if (op === "in") return v.includes(x);
        if (op === "lte") return x <= v;
        return true;
      }));
      if (q.order) rows = [...rows].sort((a, b) => (a[q.order.col] < b[q.order.col] ? -1 : 1) * (q.order.asc ? 1 : -1));
      if (q.limit !== null) rows = rows.slice(0, q.limit);
      return rows.map((r) => ({ ...r }));
    };
    const b = {
      select(cols, opts) { q.cols = cols; if (opts?.head) q.head = true; if (opts?.count) q.count = true; return b; },
      eq(c, v) { q.filters.push(["eq", c, v]); return b; },
      in(c, v) { q.filters.push(["in", c, v]); return b; },
      lte(c, v) { q.filters.push(["lte", c, v]); return b; },
      order(col, o) { q.order = { col, asc: o?.ascending !== false }; return b; },
      limit(n) { q.limit = n; return b; },
      async maybeSingle() {
        const rows = await exec();
        if (rows.length > 1) return { data: null, error: { code: "PGRST116", message: "multiple rows" } };
        return { data: rows[0] ?? null, error: null };
      },
      then(resolve, reject) {
        return exec().then((rows) => (q.head ? { data: null, count: rows.length, error: null } : { data: rows, count: rows.length, error: null }))
          .then(resolve, reject);
      },
      insert(row) {
        const p = (async () => {
          await tick();
          if (table === "service_requests" && db.insertFailure) return { error: db.insertFailure };
          const full = { id: uid(), created_at: new Date(Date.now()).toISOString(), ...row };
          if (db.tables[table].some((r) => r.id === full.id)) {
            return { error: { code: "23505", message: `duplicate key value violates unique constraint "${table}_pkey"` } };
          }
          db.tables[table].push(full);
          return { error: null, data: full };
        })();
        return p;
      },
    };
    return b;
  }

  // Atomic model of match_and_assign_helper: lock + guard + writes happen with no interleaving.
  async function rpc(name, args) {
    if (name !== "match_and_assign_helper") throw new Error(`unexpected rpc ${name}`);
    db.rpcCalls++;
    await tick();
    if (db.rpcMode === "fail-transport") return { data: null, error: { code: "PGRST000", message: "connection reset internal-detail" } };
    const req = db.tables.service_requests.find((r) => r.id === args.p_request_id);
    if (!req) return { data: { success: false, error: "Request not found" }, error: null };
    if (!["CREATED", "SEARCHING"].includes(req.status)) {
      return { data: { success: false, error: "Invalid request status for matching" }, error: null };
    }
    if (db.rpcMode === "match") {
      const helper = db.tables.helpers.find((h) => !db.tables.request_assignments.some(
        (a) => a.helper_id === h.id && ["PENDING", "NOTIFIED", "ACCEPTED"].includes(a.status)));
      if (helper) {
        const asg = { id: uid(), request_id: req.id, helper_id: helper.id, status: "PENDING" };
        if (db.tables.request_assignments.some((a) => a.request_id === req.id && ["PENDING", "NOTIFIED", "ACCEPTED"].includes(a.status))) {
          throw new Error("unique violation request active");
        }
        db.tables.request_assignments.push(asg);
        req.status = "MATCHED";
        const conv = { id: uid(), request_id: req.id, helper_id: helper.id, customer_id: req.customer_id,
          conversation_type: "CUSTOMER_HELPER", created_at: new Date().toISOString() };
        db.tables.conversations.push(conv);
        db.tables.app_notifications.push({ id: uid(), recipient_type: "HELPER", type: "NEW_SERVICE_REQUEST",
          payload: { request_id: req.id, conversation_id: conv.id }, created_at: new Date().toISOString() });
        return { data: { success: true, status: "MATCHED", helper_id: helper.helper_id, helper_name: helper.name, conversation_id: conv.id }, error: null };
      }
    }
    const sub = db.tables.helpers.length ? "ALL_ELIGIBLE_HELPERS_BUSY" : "NO_ELIGIBLE_HELPER";
    req.status = "NO_HELPER_AVAILABLE";
    const esc = { id: uid(), request_id: req.id, reason: "NO_HELPER_AVAILABLE", status: "PENDING" };
    db.tables.admin_escalations.push(esc);
    db.tables.app_notifications.push({ id: uid(), recipient_type: "ADMIN", type: "NO_HELPER_AVAILABLE",
      payload: { request_id: req.id, escalation_id: esc.id, sub_reason: sub }, created_at: new Date().toISOString() });
    return { data: { success: true, status: "NO_HELPER_AVAILABLE", sub_reason: sub, escalation_id: esc.id }, error: null };
  }

  db.client = { from: (t) => builder(t), rpc };
  db.addHelper = (n = 1) => { for (let i = 0; i < n; i++) db.tables.helpers.push({ id: uid(), helper_id: `HLP-T${i}`, name: `Secret Name ${i}` }); };
  db.count = (t, f = () => true) => db.tables[t].filter(f).length;
  return db;
}

const origError = console.error;
console.error = () => {}; // silence expected server-side logs
const keys = () => createIdempotencyKey();
const exactKeys = (obj, list) => JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...list].sort());

// ---------------------------------------------------------------------------
// 8-11. Contract (fresh submissions)
// ---------------------------------------------------------------------------
{
  const db = fakeDb(); db.addHelper();
  const key = keys();
  const res = await submitServiceRequest(db.client, input(), key);
  const reqId = await deriveRequestIdFromIdempotencyKey(key);
  check("8a. MATCHED http 201, not replayed", res.httpStatus === 201 && !res.replayed);
  check("8b. MATCHED body contract exact", exactKeys(res.body, ["success", "requestId", "status", "assignmentId", "conversationId"]) &&
    res.body.status === "MATCHED" && res.body.requestId === reqId &&
    res.body.assignmentId === db.tables.request_assignments[0].id && res.body.conversationId === db.tables.conversations[0].id,
    JSON.stringify(res.body));
  check("8c. MATCHED exposes no helper personal data or key",
    !/Secret Name|HLP-T0/.test(JSON.stringify(res.body)) && !JSON.stringify(res.body).includes(key));
  const ins = db.tables.service_requests[0];
  check("11a. description stored byte-for-byte", ins.description === base().description);
  check("11b. insert status SEARCHING then MATCHED by RPC", ins.status === "MATCHED");
  check("11c. public user display label rule", ins.customer_display_name === "ID người dùng · KQJMWXPA");
  check("11d. insert uses only real service_requests columns (+ id)", exactKeys(
    Object.fromEntries(Object.entries(ins).filter(([k]) => k !== "created_at")),
    ["id", "address", "country", "customer_display_name", "customer_id", "customer_locale", "description",
      "dong", "gungu", "selected_options", "service_slug", "sido", "status"]));
  check("11e. RPC called exactly once", db.rpcCalls === 1);
}
for (const [label, helpers, sub] of [["no helpers", 0, "NO_ELIGIBLE_HELPER"]]) {
  const db = fakeDb(); db.addHelper(helpers);
  const res = await submitServiceRequest(db.client, input(), keys());
  check(`9a. NO_HELPER_AVAILABLE (${label}) contract exact`, res.httpStatus === 201 &&
    exactKeys(res.body, ["success", "requestId", "status", "subReason"]) && res.body.subReason === sub, JSON.stringify(res.body));
  check("9b. API creates no escalation/notification itself (RPC-only: 1 each)",
    db.count("admin_escalations") === 1 && db.count("app_notifications") === 1);
}
{
  const db = fakeDb(); db.insertFailure = { code: "23514", message: "violates check constraint secret_detail" };
  const res = await submitServiceRequest(db.client, input(), keys());
  check("10a. INSERT failure -> 500 REQUEST_CREATE_FAILED", res.httpStatus === 500 && res.body.code === "REQUEST_CREATE_FAILED");
  check("10b. INSERT failure -> RPC not called", db.rpcCalls === 0);
  check("10c. INSERT failure -> no DB detail leaked", !JSON.stringify(res.body).includes("secret_detail"));
}
{
  const db = fakeDb(); db.addHelper(); db.rpcMode = "fail-transport";
  const key = keys();
  const res = await submitServiceRequest(db.client, input(), key);
  check("10d. RPC failure -> 502 MATCHING_FAILED with requestId, no internals", res.httpStatus === 502 &&
    res.body.code === "MATCHING_FAILED" && res.body.requestId === (await deriveRequestIdFromIdempotencyKey(key)) &&
    !JSON.stringify(res.body).includes("internal-detail"));
  check("10e. request left SEARCHING (orphan)", db.tables.service_requests[0].status === "SEARCHING");
}

// ---------------------------------------------------------------------------
// I2. Duplicate POST semantics
// ---------------------------------------------------------------------------
{
  const db = fakeDb(); db.addHelper(3);
  const key = keys();
  const first = await submitServiceRequest(db.client, input(), key);
  const again = await submitServiceRequest(db.client, input(), key);
  check("I2a. same key replay -> 200 replayed, identical ids", again.httpStatus === 200 && again.replayed === true &&
    JSON.stringify(again.body) === JSON.stringify(first.body), JSON.stringify(again.body));
  check("I2b. same key -> 1 request, 1 assignment, 1 conversation, RPC once",
    db.count("service_requests") === 1 && db.count("request_assignments") === 1 && db.count("conversations") === 1 && db.rpcCalls === 1);
  const other = await submitServiceRequest(db.client, input(), keys());
  check("I2c. same customer + same payload + NEW key -> new logical request",
    other.httpStatus === 201 && other.body.requestId !== first.body.requestId && db.count("service_requests") === 2);
  const conflict = await submitServiceRequest(db.client, input({ description: "different text" }), key);
  check("I2d. same key + different payload -> 409 IDEMPOTENCY_KEY_CONFLICT, no requestId leak",
    conflict.httpStatus === 409 && conflict.body.code === "IDEMPOTENCY_KEY_CONFLICT" && !("requestId" in conflict.body) &&
      db.count("service_requests") === 2);
  const otherCustomer = await submitServiceRequest(db.client, input({ customer_id: "KQJMWXPB" }), key);
  check("I2e. same key + different customer_id -> 409 (key is not bound to CST id alone)",
    otherCustomer.httpStatus === 409 && otherCustomer.body.code === "IDEMPOTENCY_KEY_CONFLICT");
  check("I2f. isSameLogicalRequest compares selected_options order-sensitively",
    !isSameLogicalRequest({ ...input(), selected_options: ["a", "b"] }, input({ selected_options: ["b", "a"] })));
}
{
  const db = fakeDb();
  const key = keys();
  await submitServiceRequest(db.client, input(), key);
  const again = await submitServiceRequest(db.client, input(), key);
  check("I2g. NO_HELPER replay returns same subReason from DB, no duplicate escalation",
    again.httpStatus === 200 && again.body.status === "NO_HELPER_AVAILABLE" && again.body.subReason === "NO_ELIGIBLE_HELPER" &&
      db.count("admin_escalations") === 1 && db.count("app_notifications") === 1 && db.rpcCalls === 1);
}
{
  // In-band bounded recovery: first call's RPC fails, retry with same key re-runs RPC once.
  const db = fakeDb(); db.addHelper(); db.rpcMode = "fail-transport";
  const key = keys();
  await submitServiceRequest(db.client, input(), key);
  const stillFailing = await submitServiceRequest(db.client, input(), key);
  check("I2h. replay while RPC still failing -> 502 MATCHING_FAILED, exactly one RPC per call",
    stillFailing.httpStatus === 502 && stillFailing.body.code === "MATCHING_FAILED" && db.rpcCalls === 2 && db.count("service_requests") === 1);
  db.rpcMode = "match";
  const recovered = await submitServiceRequest(db.client, input(), key);
  check("I2i. replay after RPC recovers -> MATCHED 200 on the same request",
    recovered.httpStatus === 200 && recovered.body.status === "MATCHED" && db.count("service_requests") === 1 &&
      db.count("request_assignments") === 1 && db.rpcCalls === 3);
}
{
  // Helper push boundary: matchedByThisCall is true only for the call whose RPC created the assignment.
  const db = fakeDb(); db.addHelper();
  const key = keys();
  const first = await submitServiceRequest(db.client, input(), key);
  const replay = await submitServiceRequest(db.client, input(), key);
  check("M1. first MATCHED submission -> matchedByThisCall (push once)", first.body.status === "MATCHED" && first.matchedByThisCall === true);
  check("M2. replay of a matched request -> no second push", replay.replayed === true && replay.matchedByThisCall === false);
  const none = fakeDb();
  const noHelper = await submitServiceRequest(none.client, input(), keys());
  check("M3. NO_HELPER_AVAILABLE -> no helper push", noHelper.body.status === "NO_HELPER_AVAILABLE" && noHelper.matchedByThisCall === false);
  const orphan = fakeDb(); orphan.addHelper(); orphan.rpcMode = "fail-transport";
  const orphanKey = keys();
  const failed = await submitServiceRequest(orphan.client, input(), orphanKey);
  orphan.rpcMode = "match";
  const recoveredReplay = await submitServiceRequest(orphan.client, input(), orphanKey);
  const afterRecovery = await submitServiceRequest(orphan.client, input(), orphanKey);
  check("M4. orphan recovered on replay -> that replay pushes once, later replays do not",
    !failed.matchedByThisCall && recoveredReplay.body.status === "MATCHED" && recoveredReplay.matchedByThisCall === true && afterRecovery.matchedByThisCall === false, JSON.stringify([failed.matchedByThisCall, recoveredReplay.httpStatus, recoveredReplay.body.status, recoveredReplay.matchedByThisCall, afterRecovery.matchedByThisCall]));
}
{
  // Released-for-rematch request (SEARCHING with assignment history) is not an orphan: no RPC on replay.
  const db = fakeDb(); db.addHelper();
  const key = keys();
  const first = await submitServiceRequest(db.client, input(), key);
  db.tables.request_assignments[0].status = "DECLINED";
  db.tables.service_requests[0].status = "SEARCHING";
  const calls = db.rpcCalls;
  const replay = await submitServiceRequest(db.client, input(), key);
  check("I2j. replay on released SEARCHING request -> 202 REQUEST_PROCESSING, RPC not called",
    replay.httpStatus === 202 && replay.body.code === "REQUEST_PROCESSING" && replay.body.requestId === first.body.requestId &&
      db.rpcCalls === calls);
}
{
  const db = fakeDb(); db.addHelper();
  const key = keys();
  await submitServiceRequest(db.client, input(), key);
  for (const status of ["ACCEPTED", "CANCELLED", "COMPLETED"]) {
    db.tables.service_requests[0].status = status;
    const r = await submitServiceRequest(db.client, input(), key);
    check(`I2k. replay on ${status} -> 409 REQUEST_STATE_CHANGED, status untouched`,
      r.httpStatus === 409 && r.body.code === "REQUEST_STATE_CHANGED" && db.tables.service_requests[0].status === status);
  }
}

// ---------------------------------------------------------------------------
// C1. 20 concurrent identical POSTs (fake DB; real DB version is in the LIVE suite)
// ---------------------------------------------------------------------------
for (const mode of ["match", "nohelper"]) {
  const db = fakeDb(); if (mode === "match") db.addHelper(5);
  const key = keys();
  const all = await Promise.all(Array.from({ length: 20 }, () => submitServiceRequest(db.client, input(), key)));
  const ids = new Set(all.map((r) => r.body.requestId));
  check(`C1a. [${mode}] 20 concurrent same-key POSTs -> exactly 1 service_request`, db.count("service_requests") === 1);
  check(`C1b. [${mode}] all 20 responses name the same request and same result`,
    ids.size === 1 && all.every((r) => r.body.success === true && r.body.status === all[0].body.status &&
      r.body.assignmentId === all[0].body.assignmentId && r.body.conversationId === all[0].body.conversationId),
    JSON.stringify(all.map((r) => [r.httpStatus, r.body.code ?? r.body.status])));
  check(`C1c. [${mode}] exactly one 201, nineteen replayed 200s`,
    all.filter((r) => r.httpStatus === 201).length === 1 && all.filter((r) => r.httpStatus === 200 && r.replayed).length === 19);
  check(`C1d. [${mode}] active assignment <= 1, conversation <= 1, escalation <= 1, notification == 1`,
    db.count("request_assignments") <= 1 && db.count("conversations") <= 1 && db.count("admin_escalations") <= 1 &&
      db.count("app_notifications") === 1);
}

// ---------------------------------------------------------------------------
// R. Recovery eligibility + terminal state protection
// ---------------------------------------------------------------------------
function seedRequest(db, overrides = {}) {
  const row = { id: `11111111-1111-4111-8111-${String(db.tables.service_requests.length + 1).padStart(12, "0")}`,
    status: "SEARCHING", customer_id: "KQJMWXPA", created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), ...overrides };
  db.tables.service_requests.push(row);
  return row;
}
const TERMINAL = ["CREATED", "MATCHED", "HELPER_NOTIFIED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED",
  "PAYMENT_PENDING", "SETTLED", "CLOSED", "CANCELLED", "EXPIRED", "NO_HELPER_AVAILABLE"];
for (const status of TERMINAL) {
  const db = fakeDb(); db.addHelper();
  const row = seedRequest(db, { status });
  const r = await recoverOrphanRequest(db.client, row.id, { minAgeMs: 0 });
  check(`R1. ${status} is not recoverable, status untouched, RPC not called`,
    r.outcome === "SKIPPED" && r.reason === "NOT_SEARCHING" && row.status === status && db.rpcCalls === 0);
}
{
  const cases = [
    ["HAS_ASSIGNMENT_HISTORY", (db, row) => db.tables.request_assignments.push({ id: "a", request_id: row.id, status: "TIMEOUT" })],
    ["HAS_CONVERSATION", (db, row) => db.tables.conversations.push({ id: "c", request_id: row.id })],
    ["HAS_OPEN_ESCALATION", (db, row) => db.tables.admin_escalations.push({ id: "e", request_id: row.id, status: "PENDING" })],
  ];
  for (const [reason, mutate] of cases) {
    const db = fakeDb(); db.addHelper();
    const row = seedRequest(db); mutate(db, row);
    const r = await recoverOrphanRequest(db.client, row.id, { minAgeMs: 0 });
    check(`R2. SEARCHING with ${reason} is skipped, RPC not called`,
      r.outcome === "SKIPPED" && r.reason === reason && row.status === "SEARCHING" && db.rpcCalls === 0);
  }
  const db = fakeDb();
  const fresh = seedRequest(db, { created_at: new Date().toISOString() });
  const tooRecent = await recoverOrphanRequest(db.client, fresh.id, { minAgeMs: 60000 });
  check("R3. orphan younger than min age is skipped (TOO_RECENT)", tooRecent.outcome === "SKIPPED" && tooRecent.reason === "TOO_RECENT");
  const missing = await recoverOrphanRequest(db.client, "99999999-9999-4999-8999-999999999999", { minAgeMs: 0 });
  check("R4. unknown request -> SKIPPED NOT_FOUND", missing.outcome === "SKIPPED" && missing.reason === "NOT_FOUND");
  const closedEsc = fakeDb();
  const r5 = seedRequest(closedEsc);
  closedEsc.tables.admin_escalations.push({ id: "e", request_id: r5.id, status: "RESOLVED" });
  check("R5. resolved (closed) escalation does not block eligibility",
    (await checkOrphanEligibility(closedEsc.client, r5.id)).eligible === true);
}
{
  const db = fakeDb(); db.addHelper();
  const row = seedRequest(db);
  const r = await recoverOrphanRequest(db.client, row.id, { minAgeMs: 60000 });
  check("R6. eligible orphan recovered via RPC -> MATCHED", r.outcome === "RECOVERED" && r.status === "MATCHED" && row.status === "MATCHED");
  const again = await recoverOrphanRequest(db.client, row.id, { minAgeMs: 60000 });
  check("R7. recovering an already-recovered request is a no-op", again.outcome === "SKIPPED" && again.reason === "NOT_SEARCHING" && db.rpcCalls === 1);
}
for (const mode of ["match", "nohelper"]) {
  const db = fakeDb(); if (mode === "match") db.addHelper(5);
  const row = seedRequest(db);
  const all = await Promise.all(Array.from({ length: 20 }, () => recoverOrphanRequest(db.client, row.id, { minAgeMs: 0 })));
  const recovered = all.filter((r) => r.outcome === "RECOVERED").length;
  check(`C2a. [${mode}] 20 concurrent recoveries -> exactly 1 RECOVERED, rest ALREADY_RESOLVED/SKIPPED`,
    recovered === 1 && all.every((r) => ["RECOVERED", "ALREADY_RESOLVED", "SKIPPED"].includes(r.outcome)),
    JSON.stringify(all.map((r) => r.outcome)));
  check(`C2b. [${mode}] active assignment <= 1, conversation <= 1, escalation <= 1`,
    db.count("request_assignments") <= 1 && db.count("conversations") <= 1 && db.count("admin_escalations") <= 1);
}
{
  const db = fakeDb();
  const old1 = seedRequest(db);
  const old2 = seedRequest(db, { status: "MATCHED" });
  const young = seedRequest(db, { created_at: new Date().toISOString() });
  const res = await recoverOrphanRequests(db.client, { limit: 10, minAgeSeconds: 120 });
  check("R8. batch scan recovers only old SEARCHING orphans",
    res.ok && res.scanned === 1 && res.results[0].requestId === old1.id && old2.status === "MATCHED" && young.status === "SEARCHING");
  const limited = fakeDb();
  for (let i = 0; i < 5; i++) seedRequest(limited);
  const lim = await recoverOrphanRequests(limited.client, { limit: 2, minAgeSeconds: 120 });
  check("R9. batch respects limit", lim.ok && lim.scanned === 2 && limited.rpcCalls === 2);
}

// ---------------------------------------------------------------------------
// A. Recovery authorization (fail-closed)
// ---------------------------------------------------------------------------
{
  const mk = (headers) => new Request("http://x/api/sys/requests/recover", { method: "POST", headers });
  const saved = process.env.LIFE_HELP_RECOVERY_TOKEN;
  delete process.env.LIFE_HELP_RECOVERY_TOKEN;
  check("A1. no token configured -> bearer rejected", (await authorizeRecoveryRequest(mk({ authorization: "Bearer anything" }))) === null);
  process.env.LIFE_HELP_RECOVERY_TOKEN = "short-token";
  check("A2. token shorter than 32 chars is disabled", (await authorizeRecoveryRequest(mk({ authorization: "Bearer short-token" }))) === null);
  const good = "r".repeat(20) + "ecovery-token-0123456789";
  process.env.LIFE_HELP_RECOVERY_TOKEN = good;
  check("A3. correct bearer accepted", (await authorizeRecoveryRequest(mk({ authorization: `Bearer ${good}` }))) === "TOKEN");
  check("A4. wrong bearer rejected", (await authorizeRecoveryRequest(mk({ authorization: `Bearer ${good}x` }))) === null);
  check("A5. no credentials rejected", (await authorizeRecoveryRequest(mk({}))) === null);
  check("A6. forged sys cookie rejected (fails closed without Cloudflare context)",
    (await authorizeRecoveryRequest(mk({ cookie: "life_help_sys_session=admin|9999999999999|deadbeef" }))) === null);
  if (saved === undefined) delete process.env.LIFE_HELP_RECOVERY_TOKEN; else process.env.LIFE_HELP_RECOVERY_TOKEN = saved;
}
console.error = origError;

// ---------------------------------------------------------------------------
// S. Source-level checks (security, legacy regression, Phase 1 protection)
// ---------------------------------------------------------------------------
const page = read("app/request/page.tsx");
const route = read("app/api/requests/route.ts");
const recoverRoute = read("app/api/sys/requests/recover/route.ts");
const serverReq = read("lib/request/serverRequest.ts");
const recovery = read("lib/request/requestRecovery.ts");
const recoveryAuth = read("lib/request/recoveryAuth.ts");
const serviceRole = read("lib/supabase/serviceRole.ts");

for (const [name, src] of [["serviceRole.ts", serviceRole], ["serverRequest.ts", serverReq], ["requestRecovery.ts", recovery], ["recoveryAuth.ts", recoveryAuth]]) {
  check(`S1. ${name} imports server-only`, /^import "server-only";/m.test(src));
}
check("S2. service role key read only from non-public env var",
  serviceRole.includes("process.env.SUPABASE_SERVICE_ROLE_KEY") && !/NEXT_PUBLIC_[A-Z_]*SERVICE/.test(serviceRole));

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".open-next", "out", ".git"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const sourceFiles = ["app", "lib", "components", "utils"].flatMap((d) => walk(path.join(root, d)));
const rel = (f) => path.relative(root, f).replace(/\\/g, "/");
const clientImporters = sourceFiles.filter((f) => {
  const src = fs.readFileSync(f, "utf-8");
  return /^\s*["']use client["']/.test(src) &&
    /from ["']@\/lib\/(supabase\/serviceRole|request\/serverRequest|request\/requestRecovery|request\/recoveryAuth)["']/.test(src);
});
check("S3. no client component imports server-only request/recovery modules", clientImporters.length === 0, clientImporters.map(rel).join(", "));
check("S4. no NEXT_PUBLIC_* secret variables",
  !sourceFiles.some((f) => /NEXT_PUBLIC_[A-Z_]*(SERVICE|RECOVERY|SECRET)/.test(fs.readFileSync(f, "utf-8"))));
const keyRefs = sourceFiles.filter((f) => fs.readFileSync(f, "utf-8").includes("SUPABASE_SERVICE_ROLE_KEY")).map(rel);
check("S5. SUPABASE_SERVICE_ROLE_KEY referenced only in lib/supabase/serviceRole.ts",
  keyRefs.length === 1 && keyRefs[0] === "lib/supabase/serviceRole.ts", keyRefs.join(", "));
const tokenRefs = sourceFiles.filter((f) => fs.readFileSync(f, "utf-8").includes("LIFE_HELP_RECOVERY_TOKEN")).map(rel);
check("S6. LIFE_HELP_RECOVERY_TOKEN referenced only in lib/request/recoveryAuth.ts",
  tokenRefs.length === 1 && tokenRefs[0] === "lib/request/recoveryAuth.ts", tokenRefs.join(", "));
const logCalls = [...(serverReq + recovery + route + recoverRoute).matchAll(/console\.error\(([\s\S]*?)\);/g)].map((m) => m[1]);
check("S7. no log statement references the idempotency key or tokens",
  logCalls.every((c) => !/idempotencyKey|key\.value|IDEMPOTENCY|token|Bearer/i.test(c)), logCalls.join(" | "));
check("S8. recovery route authorizes before any other work",
  recoverRoute.indexOf("authorizeRecoveryRequest(request)") > 0 &&
    recoverRoute.indexOf("authorizeRecoveryRequest(request)") < recoverRoute.indexOf("request.text()") &&
    recoverRoute.indexOf("authorizeRecoveryRequest(request)") < Math.max(recoverRoute.indexOf("createServiceRoleClient()"), recoverRoute.indexOf("createRuntimeServiceRoleClient()")));
check("S9. /api/requests requires Idempotency-Key before parsing body",
  route.indexOf("validateIdempotencyKey(") > 0 && route.indexOf("validateIdempotencyKey(") < route.indexOf("request.text()"));
check("S10. client sends the Idempotency-Key header", /\[IDEMPOTENCY_HEADER\]: (?:pendingSubmissionRef\.current\.key|submissionKey)/.test(page));
check("S11. client key is random (createIdempotencyKey), not derived from CST id/timestamp",
  /createIdempotencyKey\(\)/.test(page) && !/Idempotency[^\n]*(customer_id|CustomerId|Date\.now)/.test(page));
check("S12. recovery re-uses match_and_assign_helper (no duplicated matching SQL/logic)",
  /rpc\("match_and_assign_helper"/.test(recovery) && !/helper_services|helper_regions|\.insert\(|\.update\(|\.delete\(/.test(recovery));
check("S13. recovery never calls release_assignment_for_rematch",
  !/\.rpc\(\s*["']release_assignment_for_rematch["']/.test(recovery + recoverRoute + serverReq));
check("S14. API/recovery never write escalations/notifications and never set TIMEOUT on requests",
  !/from\("admin_escalations"\)\s*\.(insert|update)|from\("app_notifications"\)\s*\.(insert|update)/.test(serverReq + recovery) &&
    !/status:\s*["']TIMEOUT["']/.test(serverReq + recovery + route + recoverRoute + page));
check("S15. no self-call to /api/translate", !/api\/translate/.test(serverReq + route + recovery));

for (const banned of ["saveServiceRequest", "createProviderChatSession", "findMatchingOnDutyProvider",
  "SEED_SERVICE_PROVIDERS", "providerChatStore", "requestStore", "onDutyList", "serverMatching", "matchAndAssignHelper"]) {
  check(`L. request path does not use ${banned}`,
    ![page, route, serverReq, recovery, recoverRoute].some((src) => src.includes(banned)));
}
check("L2. request page submits via POST /api/requests", /fetch\("\/api\/requests"/.test(page) && /method: "POST"/.test(page));
check("L3. request page sends original description unmodified", /description: problemDescription,/.test(page));
check("L4. no legacy /chat?session link on request page", !/\/chat\?session=/.test(page));

const phase1Diff = execSync("git diff --name-only HEAD -- supabase lib/db utils lib/auth", { cwd: root }).toString().trim();
const allowedMigration = "supabase/migrations/202609260008_payout_destinations.sql";
const phase1Untracked = execSync("git ls-files --others --exclude-standard -- supabase lib/db utils lib/auth", { cwd: root })
  .toString().trim().split(/\r?\n/).filter(Boolean)
  .filter((file) => !["supabase/migrations/202609250003_helper_identity_and_accept_assignment.sql", "supabase/migrations/202609250004_referral_core.sql", "supabase/migrations/202609250005_referral_rewards.sql", "supabase/migrations/202609260006_public_user_identity.sql", "supabase/migrations/202609260007_remove_redundant_public_user_identity.sql", "supabase/migrations/202609260008_payout_destinations.sql", "supabase/migrations/202609260009_assignment_completed_release.sql", "supabase/migrations/202609260010_web_push_subscriptions.sql", "supabase/migrations/202609260011_exclude_declined_timeout_from_rematch.sql", "supabase/migrations/202609260012_helper_service_pricing.sql"].includes(file));
check("P1. no changes to migrations, lib/db, utils, lib/auth (Phase 1 + admin auth baseline)",
  phase1Diff.split(/\r?\n/).filter((file) => file && file !== allowedMigration).length === 0 && phase1Untracked.length === 0, `${phase1Diff} ${phase1Untracked.join(" ")}`);

fs.rmSync(outDir, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

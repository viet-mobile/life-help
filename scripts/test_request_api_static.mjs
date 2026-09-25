/**
 * LIFE.HELP P2-1/P2-2 static tests: POST /api/requests validation, response contract,
 * matching error handling, and client-side matching removal.
 *
 * No network or database access. lib/request/serverRequest.ts is bundled with esbuild
 * ("server-only" stubbed) and exercised with an in-memory fake Supabase client.
 *
 * Usage: node scripts/test_request_api_static.mjs
 */

import { build } from "esbuild";
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
// Bundle the server module
// ---------------------------------------------------------------------------
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "lifehelp-req-test-"));
const outFile = path.join(outDir, "serverRequest.mjs");
await build({
  entryPoints: [path.join(root, "lib/request/serverRequest.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: outFile,
  logLevel: "silent",
  alias: { "@": root },
  external: ["@supabase/supabase-js"],
  plugins: [
    {
      name: "stub-server-only",
      setup(b) {
        b.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "stub" }));
        b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "", loader: "js" }));
      },
    },
  ],
});
const mod = await import(pathToFileURL(outFile).href);
const { validateCreateServiceRequest, createServiceRequestAndMatch, CORE_SERVICE_SLUGS } = mod;

const EXPECTED_SLUGS = [
  "clog-clearing", "leak-plumbing", "boiler", "cleaning", "housing",
  "bank-help", "insurance-help", "job-help", "hospital-help", "mobile-help",
];

const base = () => ({
  service_slug: "boiler",
  customer_id: "CST-7A29",
  customer_locale: "vi",
  country: "KR",
  sido: "전북특별자치도",
  gungu: "익산시",
  dong: "신동",
  address: "전북특별자치도 익산시 신동 대학로 123",
  description: "  Bình nóng lạnh bị hỏng.\n보일러 고장 ",
  selected_options: ["온수가 나오지 않음"],
});

// ---------------------------------------------------------------------------
// 1-4. Validation
// ---------------------------------------------------------------------------
check("1a. CORE_SERVICE_SLUGS is exactly the 10 services",
  JSON.stringify([...CORE_SERVICE_SLUGS].sort()) === JSON.stringify([...EXPECTED_SLUGS].sort()));
for (const slug of EXPECTED_SLUGS) {
  const r = validateCreateServiceRequest({ ...base(), service_slug: slug });
  check(`1b. valid slug accepted: ${slug}`, r.ok === true);
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
const messagesIndex = read("messages/index.ts");
const localeBlock = messagesIndex.match(/export const locales = \[([\s\S]*?)\] as const/)[1];
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
  ["customer_id", "CST-0000"], ["customer_id", "HLP-1001"], ["customer_id", "cst-7a29"], ["customer_id", ""],
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
// Fake Supabase client
// ---------------------------------------------------------------------------
function fakeClient({ insertResult, rpcResult, assignmentResult }) {
  const calls = { inserts: [], rpcs: [], assignmentQueries: [] };
  const client = {
    from(table) {
      if (table === "service_requests") {
        return {
          insert(payload) {
            calls.inserts.push(payload);
            return { select: () => ({ single: async () => insertResult }) };
          },
        };
      }
      if (table === "request_assignments") {
        const q = { table, filters: [] };
        const chain = {
          select(cols) { q.cols = cols; return chain; },
          eq(c, v) { q.filters.push(["eq", c, v]); return chain; },
          in(c, v) { q.filters.push(["in", c, v]); return chain; },
          maybeSingle: async () => { calls.assignmentQueries.push(q); return assignmentResult; },
        };
        return chain;
      }
      throw new Error(`unexpected table ${table}`);
    },
    async rpc(name, args) {
      calls.rpcs.push({ name, args });
      return rpcResult;
    },
  };
  return { client, calls };
}

const REQ_ID = "11111111-1111-4111-8111-111111111111";
const ASG_ID = "22222222-2222-4222-8222-222222222222";
const CONV_ID = "33333333-3333-4333-8333-333333333333";
const origError = console.error;
console.error = () => {}; // silence expected server-side logs

// 8. MATCHED
{
  const input = validateCreateServiceRequest(base()).value;
  const { client, calls } = fakeClient({
    insertResult: { data: { id: REQ_ID }, error: null },
    rpcResult: {
      data: { success: true, status: "MATCHED", helper_id: "HLP-9999", helper_name: "Secret Name", conversation_id: CONV_ID },
      error: null,
    },
    assignmentResult: { data: { id: ASG_ID }, error: null },
  });
  const res = await createServiceRequestAndMatch(client, input);
  check("8a. MATCHED http 201", res.httpStatus === 201);
  check("8b. MATCHED body contract exact",
    JSON.stringify(Object.keys(res.body).sort()) ===
      JSON.stringify(["assignmentId", "conversationId", "requestId", "status", "success"]) &&
      res.body.success === true && res.body.status === "MATCHED" && res.body.requestId === REQ_ID &&
      res.body.assignmentId === ASG_ID && res.body.conversationId === CONV_ID,
    JSON.stringify(res.body));
  check("8c. MATCHED exposes no helper personal data",
    !JSON.stringify(res.body).includes("Secret Name") && !JSON.stringify(res.body).includes("HLP-9999"));
  check("8d. RPC called once with inserted request id",
    calls.rpcs.length === 1 && calls.rpcs[0].name === "match_and_assign_helper" && calls.rpcs[0].args.p_request_id === REQ_ID);
  const aq = calls.assignmentQueries[0];
  check("8e. assignment looked up by request_id + active statuses",
    aq && aq.filters.some((f) => f[0] === "eq" && f[1] === "request_id" && f[2] === REQ_ID) &&
      aq.filters.some((f) => f[0] === "in" && f[1] === "status" &&
        JSON.stringify(f[2]) === JSON.stringify(["PENDING", "NOTIFIED", "ACCEPTED"])));

  // 11. original description preservation + insert payload
  const ins = calls.inserts[0];
  check("11a. description stored byte-for-byte as submitted", ins.description === base().description);
  check("11b. insert status is SEARCHING", ins.status === "SEARCHING");
  check("11c. customer_display_name follows formatCustomerDisplayName", ins.customer_display_name === "Khách hàng · CST-7A29");
  const ALLOWED_COLS = ["address", "country", "customer_display_name", "customer_id", "customer_locale", "description",
    "dong", "gungu", "selected_options", "service_slug", "sido", "status"];
  check("11d. insert uses only real service_requests columns",
    JSON.stringify(Object.keys(ins).sort()) === JSON.stringify(ALLOWED_COLS), JSON.stringify(Object.keys(ins)));
  const koIns = fakeClient({ insertResult: { data: { id: REQ_ID }, error: null }, rpcResult: { data: null, error: { message: "x" } } });
  await createServiceRequestAndMatch(koIns.client, validateCreateServiceRequest({ ...base(), customer_locale: "ko" }).value);
  check("11e. ko display name", koIns.calls.inserts[0].customer_display_name === "고객 · CST-7A29");
}

// 9. NO_HELPER_AVAILABLE
for (const sub of ["NO_ELIGIBLE_HELPER", "ALL_ELIGIBLE_HELPERS_BUSY"]) {
  const { client, calls } = fakeClient({
    insertResult: { data: { id: REQ_ID }, error: null },
    rpcResult: { data: { success: true, status: "NO_HELPER_AVAILABLE", sub_reason: sub, escalation_id: "esc" }, error: null },
  });
  const res = await createServiceRequestAndMatch(client, validateCreateServiceRequest(base()).value);
  check(`9a. NO_HELPER_AVAILABLE (${sub}) contract exact`,
    res.httpStatus === 201 &&
      JSON.stringify(Object.keys(res.body).sort()) === JSON.stringify(["requestId", "status", "subReason", "success"]) &&
      res.body.status === "NO_HELPER_AVAILABLE" && res.body.subReason === sub && res.body.requestId === REQ_ID,
    JSON.stringify(res.body));
  check(`9b. NO_HELPER_AVAILABLE (${sub}) API writes nothing beyond request insert`,
    calls.inserts.length === 1 && calls.assignmentQueries.length === 0);
}

// 10. Error handling
{
  const { client, calls } = fakeClient({
    insertResult: { data: null, error: { code: "23514", message: "violates check constraint secret_detail" } },
    rpcResult: { data: null, error: null },
  });
  const res = await createServiceRequestAndMatch(client, validateCreateServiceRequest(base()).value);
  check("10a. INSERT failure -> 5xx REQUEST_CREATE_FAILED", res.httpStatus === 500 && res.body.code === "REQUEST_CREATE_FAILED");
  check("10b. INSERT failure -> matching RPC not called", calls.rpcs.length === 0);
  check("10c. INSERT failure -> no DB detail leaked", !JSON.stringify(res.body).includes("secret_detail"));
}
for (const [label, rpcResult] of [
  ["rpc transport error", { data: null, error: { code: "PGRST202", message: "internal function detail" } }],
  ["rpc success:false", { data: { success: false, error: "Invalid request status for matching" }, error: null }],
  ["rpc unknown status", { data: { success: true, status: "WHATEVER" }, error: null }],
  ["rpc MATCHED without conversation", { data: { success: true, status: "MATCHED" }, error: null }],
  ["rpc NO_HELPER bad sub_reason", { data: { success: true, status: "NO_HELPER_AVAILABLE", sub_reason: "X" }, error: null }],
]) {
  const { client } = fakeClient({ insertResult: { data: { id: REQ_ID }, error: null }, rpcResult });
  const res = await createServiceRequestAndMatch(client, validateCreateServiceRequest(base()).value);
  check(`10d. ${label} -> 502 MATCHING_FAILED with requestId, no internals`,
    res.httpStatus === 502 && res.body.success === false && res.body.code === "MATCHING_FAILED" &&
      res.body.requestId === REQ_ID && typeof res.body.message === "string" &&
      !JSON.stringify(res.body).includes("internal function detail") &&
      !JSON.stringify(res.body).includes("Invalid request status"),
    JSON.stringify(res.body));
}
{
  const { client } = fakeClient({
    insertResult: { data: { id: REQ_ID }, error: null },
    rpcResult: { data: { success: true, status: "MATCHED", conversation_id: CONV_ID }, error: null },
    assignmentResult: { data: null, error: null },
  });
  const res = await createServiceRequestAndMatch(client, validateCreateServiceRequest(base()).value);
  check("10e. MATCHED but assignment missing -> 502 MATCH_RESULT_UNAVAILABLE",
    res.httpStatus === 502 && res.body.code === "MATCH_RESULT_UNAVAILABLE" && res.body.requestId === REQ_ID);
}
console.error = origError;

// ---------------------------------------------------------------------------
// 5-7. Source-level checks
// ---------------------------------------------------------------------------
const page = read("app/request/page.tsx");
const route = read("app/api/requests/route.ts");
const serverReq = read("lib/request/serverRequest.ts");
const serviceRole = read("lib/supabase/serviceRole.ts");

check("5a. serviceRole.ts imports server-only", /^import "server-only";/m.test(serviceRole));
check("5b. serverRequest.ts imports server-only", /^import "server-only";/m.test(serverReq));
check("5c. service role key read only from non-public env var",
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
const clientImporters = sourceFiles.filter((f) => {
  const src = fs.readFileSync(f, "utf-8");
  return /^\s*["']use client["']/.test(src) &&
    /from ["']@\/lib\/(supabase\/serviceRole|request\/serverRequest)["']/.test(src);
});
check("5d. no client component imports serviceRole/serverRequest", clientImporters.length === 0, clientImporters.join(", "));
const publicServiceKeyRefs = sourceFiles.filter((f) => /NEXT_PUBLIC_SUPABASE_SERVICE/.test(fs.readFileSync(f, "utf-8")));
check("5e. no NEXT_PUBLIC_* service role variable anywhere", publicServiceKeyRefs.length === 0, publicServiceKeyRefs.join(", "));
const serviceKeyRefs = sourceFiles.filter((f) => fs.readFileSync(f, "utf-8").includes("SUPABASE_SERVICE_ROLE_KEY"))
  .map((f) => path.relative(root, f).replace(/\\/g, "/"));
check("5f. SUPABASE_SERVICE_ROLE_KEY referenced only in lib/supabase/serviceRole.ts",
  serviceKeyRefs.length === 1 && serviceKeyRefs[0] === "lib/supabase/serviceRole.ts", serviceKeyRefs.join(", "));

for (const banned of ["saveServiceRequest", "createProviderChatSession", "findMatchingOnDutyProvider",
  "SEED_SERVICE_PROVIDERS", "providerChatStore", "requestStore", "onDutyList"]) {
  check(`6/7. request page does not use ${banned}`, !page.includes(banned));
  check(`6/7. API route/server module do not use ${banned}`, !route.includes(banned) && !serverReq.includes(banned));
}
check("6b. request page submits via POST /api/requests",
  /fetch\("\/api\/requests"/.test(page) && /method: "POST"/.test(page));
check("6c. request page sends original description unmodified", /description: problemDescription,/.test(page));
check("6d. request page does not mix DB conversation id into legacy /chat?session link", !/\/chat\?session=/.test(page));

check("12a. server code never sets service_requests.status TIMEOUT",
  !/status:\s*["']TIMEOUT["']/.test(serverReq) && !/TIMEOUT/.test(route) && !/TIMEOUT/.test(page));
check("12b. API does not create escalations/notifications itself",
  !/admin_escalations|app_notifications/.test(serverReq + route));
check("12c. API does not self-call /api/translate", !/api\/translate/.test(serverReq + route));

fs.rmSync(outDir, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

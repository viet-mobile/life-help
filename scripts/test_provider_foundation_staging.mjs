// Live STAGING verification of migration 202609280020 (provider payment foundation).
//   --phase=gate   (020 applied, OLD Worker): DB / privilege / authority gate only. Mock provider must be DISABLED.
// Uses the app role (service key), anon and a real Helper session exactly as the deployed Worker / a caller would.
// Never touches retained financial history (probes use non-existent ids or this run's disposable fixtures).
// Usage: node scripts/test_provider_foundation_staging.mjs --phase=gate
import crypto from "node:crypto";
import fs from "node:fs";
import { base, db, env, fixtures, readResponse, recorder, serviceKey, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const phase = process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "gate";
const runId = `PF${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const svc = hdr(serviceKey);
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const rpcAs = (name, args, headers = svc) => rest(`rpc/${name}`, headers, "POST", args);
const tableDenied = (r) => r.status === 403 && r.body?.code === "42501";
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const ZERO = "00000000-0000-0000-0000-000000000000";
const fmt = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, `${v.status}/${v.body?.code ?? ""}`]));
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const ingestArgs = (o) => ({
  p_provider: o.provider ?? "MOCK_PROVIDER", p_environment: o.environment ?? "SANDBOX", p_provider_account: "gate", p_provider_event_id: o.id ?? `gate_${runId}_${crypto.randomUUID().slice(0, 8)}`,
  p_source: "WEBHOOK", p_event_type: o.type ?? "PAYMENT_HELD", p_provider_event_type: "gate.probe", p_object_ref: o.object ?? `gatepay_${runId}`,
  p_life_help_reference: null, p_amount_minor: 1000, p_currency: "KRW", p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: sha(runId), p_signature_verified: o.verified ?? true,
});

async function gate() {
  // ---------- 1. objects exist ----------
  const tables = {};
  for (const t of ["payment_providers", "payment_capability_policies", "provider_events", "provider_payment_links"]) tables[t] = await rest(`${t}?select=*&limit=50`, svc);
  const cols = await rest("payout_destinations?select=destination_kind,provider_environment&limit=1", svc);
  const fns = {
    eligibility: await rpcAs("money_movement_eligibility", { p_capability: "CUSTOMER_PAYMENT", p_country: "KR", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_subject_kind: "CUSTOMER", p_subject_ref: "GATE" }),
    capability: await rpcAs("provider_capability_enabled", { p_country: "KR", p_capability: "CUSTOMER_PAYMENT", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX" }),
    ingest: await rpcAs("ingest_provider_event", ingestArgs({ verified: false })),
    open: await rpcAs("open_provider_payment_intent", { p_checkout_id: ZERO, p_customer_id: "GATEXXXX", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_provider_account: "gate", p_reference: "11111111111111111111111111111111", p_ttl_seconds: 900 }),
    link: await rpcAs("link_provider_payment", { p_intent_id: ZERO, p_provider_payment_id: "gatepay_x" }),
    target: await rpcAs("provider_transfer_target", { p_job_id: ZERO, p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX" }),
    exponent: await rpcAs("currency_minor_exponent", { p_currency: "KRW" }),
    leaseInternal: await rpcAs("provider_event_job_lease", { p_job_id: ZERO }),
  };
  expect("1. 020 objects present: registry, capability policies, provider evidence, payment links, destination kind / environment columns; eligibility, ingestion, open-intent, link, transfer-target authorities callable by the app role; internal lease helper NOT callable",
    Object.values(tables).every((r) => r.status === 200) && cols.status === 200 && fns.eligibility.status === 200 && fns.capability.status === 200 && fns.ingest.status === 200 && fns.open.status === 200 && fns.link.status === 200 && fns.target.status === 200 && fns.exponent.body === 0 && denied(fns.leaseInternal),
    { tables: fmt(tables), cols: cols.status, fns: fmt(fns) });

  // ---------- 4 / 9. deny by default, mock disabled ----------
  const providers = tables.payment_providers.body;
  const policies = tables.payment_capability_policies.body;
  expect("4a. registry: MOCK_PROVIDER / SANDBOX (kind MOCK) and SOLANA_DIRECT_DEVNET / SANDBOX present, BOTH disabled; no LIVE row enabled", providers.some((p) => p.code === "MOCK_PROVIDER" && p.environment === "SANDBOX" && p.kind === "MOCK" && p.enabled === false) && providers.every((p) => p.enabled === false) && !providers.some((p) => p.environment === "LIVE" && p.enabled), providers.map((p) => `${p.code}/${p.environment}/${p.kind}/${p.enabled}`));
  expect("4b. no capability policy exists / is enabled (CUSTOMER_PAYMENT, HELPER_PAYOUT, REFERRAL_PAYOUT, REFUND all disabled)", policies.length === 0 || policies.every((p) => p.enabled === false), policies);
  const elig = {};
  for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT", "REFERRAL_PAYOUT", "REFUND"]) for (const e of ["SANDBOX", "LIVE"]) {
    elig[`${cap}/${e}`] = (await rpcAs("money_movement_eligibility", { p_capability: cap, p_country: "KR", p_provider: "MOCK_PROVIDER", p_environment: e, p_subject_kind: cap === "REFERRAL_PAYOUT" ? "REFERRAL_RECIPIENT" : cap === "HELPER_PAYOUT" ? "HELPER_PAYEE" : "CUSTOMER", p_subject_ref: "GATE" })).body;
  }
  expect("9. every capability x environment ineligible (CAPABILITY_DISABLED); provider_capability_enabled false", Object.values(elig).every((x) => x?.eligible === false && x.code === "CAPABILITY_DISABLED") && fns.capability.body === false, elig);
  const regWrites = {
    enableMock: await rest("payment_providers?code=eq.MOCK_PROVIDER", svc, "PATCH", { enabled: true }),
    insertLive: await rest("payment_providers", svc, "POST", { code: "GATE_PSP", environment: "LIVE", kind: "PSP", enabled: true }),
    insertPolicy: await rest("payment_capability_policies", svc, "POST", { country: "KR", capability: "CUSTOMER_PAYMENT", provider: "MOCK_PROVIDER", environment: "SANDBOX", rail: "X", enabled: true, approved_by: "x", approved_at: new Date().toISOString() }),
    deleteRegistry: await rest("payment_providers?code=eq.MOCK_PROVIDER", svc, "DELETE"),
    anonEnable: await rest("payment_providers?code=eq.MOCK_PROVIDER", hdr(anonKey), "PATCH", { enabled: true }),
  };
  expect("4c. the app role / anon cannot enable a provider, add a LIVE provider, add a policy or delete the registry (grant level)", Object.values(regWrites).every(denied), fmt(regWrites));
  record("INFO", "4d. LIVE-enable / MOCK-LIVE are also refused by table constraints (payment_providers_live_disabled, payment_providers_mock_sandbox_only, payment_capability_policies_live_disabled) - verified as owner in PGlite (test_provider_foundation_db 2a/2c); owner DDL is not reachable through the app role here");

  // ---------- 5 / 8. ingestion gates, environment, public reachability ----------
  const gates = {
    unsigned: (await rpcAs("ingest_provider_event", ingestArgs({ verified: false }))).body?.code,
    unknownProvider: (await rpcAs("ingest_provider_event", ingestArgs({ provider: "GATE_UNKNOWN_PSP" }))).body?.code,
    mockSandboxDisabled: (await rpcAs("ingest_provider_event", ingestArgs({}))).body?.code,
    liveEnvironment: (await rpcAs("ingest_provider_event", ingestArgs({ environment: "LIVE" }))).body?.code,
    devnetAsProvider: (await rpcAs("ingest_provider_event", ingestArgs({ provider: "SOLANA_DIRECT_DEVNET" }))).body?.code,
  };
  const eventsAfter = await rest(`provider_events?provider_event_id=like.gate_${runId}*&select=id`, svc);
  expect("5 / 8a. ingestion fails closed before recording: unsigned -> SIGNATURE_NOT_VERIFIED; unknown provider -> UNKNOWN_PROVIDER; disabled mock SANDBOX, LIVE, disabled devnet registry row -> PROVIDER_ENVIRONMENT_NOT_ENABLED; nothing stored",
    gates.unsigned === "SIGNATURE_NOT_VERIFIED" && gates.unknownProvider === "UNKNOWN_PROVIDER" && gates.mockSandboxDisabled === "PROVIDER_ENVIRONMENT_NOT_ENABLED" && gates.liveEnvironment === "PROVIDER_ENVIRONMENT_NOT_ENABLED" && gates.devnetAsProvider === "PROVIDER_ENVIRONMENT_NOT_ENABLED" && eventsAfter.status === 200 && eventsAfter.body.length === 0, gates);
  const helper = await fx.createHelper("G", { service: "clog-clearing" });
  const helperHdr = hdr(anonKey, helper.token);
  const publicCalls = {
    anonIngest: await rpcAs("ingest_provider_event", ingestArgs({}), hdr(anonKey)),
    helperIngest: await rpcAs("ingest_provider_event", ingestArgs({}), helperHdr),
    anonOpen: await rpcAs("open_provider_payment_intent", { p_checkout_id: ZERO, p_customer_id: "X", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_provider_account: "x", p_reference: "11111111111111111111111111111111", p_ttl_seconds: 900 }, hdr(anonKey)),
    anonLink: await rpcAs("link_provider_payment", { p_intent_id: ZERO, p_provider_payment_id: "x_x_x" }, hdr(anonKey)),
    anonTarget: await rpcAs("provider_transfer_target", { p_job_id: ZERO, p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX" }, helperHdr),
    anonEligibility: await rpcAs("money_movement_eligibility", { p_capability: "REFUND", p_country: "KR", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_subject_kind: "CUSTOMER", p_subject_ref: "X" }, hdr(anonKey)),
  };
  const repo = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  const callers = [];
  const walk = (dir) => { for (const e of fs.readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(rel); else if (/\.tsx?$/.test(e.name) && /ingest_provider_event|recordEvent\(|ingestProviderWebhook\(/.test(repo(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^\s*\*.*$/gm, ""))) callers.push(rel); } };
  walk("app"); walk("lib");
  expect("8b. the ingestion authority is unreachable publicly (anon / Helper refused for every provider function); in code only the signed-webhook route and the provider ingestion module reach it",
    Object.values(publicCalls).every(denied) && callers.sort().join() === ["app/api/providers/[provider]/webhook/route.ts", "lib/payments/provider/ingest.ts"].sort().join(), { calls: fmt(publicCalls), callers });

  // ---------- 2. payment_events ----------
  const pe = {
    insert: await rest("payment_events", svc, "POST", { provider: "GATE", provider_event_id: `gate_${runId}`, event_type: "GATE" }),
    update: await rest(`payment_events?id=eq.${ZERO}`, svc, "PATCH", { event_type: "X" }),
    delete: await rest(`payment_events?id=eq.${ZERO}`, svc, "DELETE"),
    anonInsert: await rest("payment_events", hdr(anonKey), "POST", { provider: "GATE", provider_event_id: `gate_a_${runId}`, event_type: "GATE" }),
    helperUpdate: await rest(`payment_events?id=eq.${ZERO}`, helperHdr, "PATCH", { event_type: "X" }),
  };
  const peSelect = await rest("payment_events?select=id&limit=1", svc);
  const directWriters = [];
  const walk2 = (dir) => { for (const e of fs.readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk2(rel); else if (/\.tsx?$/.test(e.name) && /from\("payment_events"\)\s*\.(insert|update|upsert|delete)/.test(repo(rel))) directWriters.push(rel); } };
  walk2("app"); walk2("lib");
  expect("2. payment_events: app role SELECT only (INSERT / UPDATE / DELETE -> 42501 at grant level; TRUNCATE not reachable via PostgREST, privilege revoked + trigger); anon / Helper no mutation; no app code writes it directly (ledger functions only)",
    tableDenied(pe.insert) && tableDenied(pe.update) && tableDenied(pe.delete) && denied(pe.anonInsert) && denied(pe.helperUpdate) && peSelect.status === 200 && directWriters.length === 0, { pe: fmt(pe), directWriters });

  // ---------- 6. provider evidence tables ----------
  const ev = {
    insertEvent: await rest("provider_events", svc, "POST", { provider: "MOCK_PROVIDER", environment: "SANDBOX", provider_event_id: `gate_forged_${runId}`, source: "WEBHOOK", event_type: "PAYMENT_HELD", provider_event_type: "x", object_ref: "gatepay_x", payload_sha256: sha("x"), signature_verified: true }),
    updateEvent: await rest(`provider_events?id=eq.${ZERO}`, svc, "PATCH", { processing_result: "X" }),
    deleteEvent: await rest(`provider_events?id=eq.${ZERO}`, svc, "DELETE"),
    insertLink: await rest("provider_payment_links", svc, "POST", { payment_intent_id: ZERO, provider: "MOCK_PROVIDER", environment: "SANDBOX", provider_payment_id: "gatepay_forged" }),
    updateLink: await rest(`provider_payment_links?id=eq.${ZERO}`, svc, "PATCH", { provider_payment_id: "x" }),
    deleteLink: await rest(`provider_payment_links?id=eq.${ZERO}`, svc, "DELETE"),
  };
  expect("6. provider_events + provider_payment_links: app role cannot INSERT / UPDATE / DELETE (42501) - evidence can never become authority by a direct row write; uniqueness (provider, provider_event_id) and (provider, environment, provider_payment_id) enforced in the table", Object.values(ev).every(tableDenied), fmt(ev));

  // ---------- 3. payout_destinations (disposable fixture Helper; legitimate route path) ----------
  const addr = () => { const bytes = crypto.randomBytes(32); let n = BigInt("0x" + bytes.toString("hex")), s = ""; const B = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; while (n > 0n) { s = B[Number(n % 58n)] + s; n /= 58n; } return s; };
  const reg = async (address) => { const r = await fetch(`${base}/api/helper/payouts`, { method: "POST", headers: { ...helper.auth, "Content-Type": "application/json" }, body: JSON.stringify({ address }) }); return { status: r.status, body: await readResponse(r) }; };
  const [a1, a2] = [addr(), addr()];
  const r1 = await reg(a1);
  const r2 = await reg(a2);
  const dests = await db(`payout_destinations?owner_helper_id=eq.${helper.helper.id}&select=id,status,provider_payee_token,destination_kind,payout_method&order=created_at`);
  const [d1, d2] = [dests.find((d) => d.provider_payee_token === a1), dests.find((d) => d.provider_payee_token === a2)];
  expect("3a. legitimate paths still work (deployed route): register -> ACTIVE (kind BLOCKCHAIN_WALLET derived); re-register -> previous REVOKED, new ACTIVE", r1.status === 201 && r2.status === 201 && d1?.status === "REVOKED" && d2?.status === "ACTIVE" && d2.destination_kind === "BLOCKCHAIN_WALLET" && d1.destination_kind === "BLOCKCHAIN_WALLET", { r1: r1.status, r2: r2.status, dests: dests.map((d) => [d.status, d.destination_kind]) });
  const pd = {
    delete: await rest(`payout_destinations?id=eq.${d2?.id}`, svc, "DELETE"),
    token: await rest(`payout_destinations?id=eq.${d2?.id}`, svc, "PATCH", { provider_payee_token: addr() }),
    method: await rest(`payout_destinations?id=eq.${d2?.id}`, svc, "PATCH", { payout_method: "BANK_PROVIDER" }),
    provider: await rest(`payout_destinations?id=eq.${d2?.id}`, svc, "PATCH", { provider: "OTHER" }),
    owner: await rest(`payout_destinations?id=eq.${d2?.id}`, svc, "PATCH", { owner_helper_id: ZERO }),
    kind: await rest(`payout_destinations?id=eq.${d2?.id}`, svc, "PATCH", { destination_kind: "PROVIDER_PAYEE" }),
    reactivate: await rest(`payout_destinations?id=eq.${d1?.id}`, svc, "PATCH", { status: "ACTIVE" }),
    anonUpdate: await rest(`payout_destinations?id=eq.${d2?.id}`, hdr(anonKey), "PATCH", { status: "REVOKED" }),
  };
  const after = await db(`payout_destinations?owner_helper_id=eq.${helper.helper.id}&select=id,status,provider_payee_token,payout_method,provider&order=created_at`);
  const guardRefused = (r) => r.status >= 400 && (r.body?.code === "P0001" || r.body?.code === "42501");
  expect("3b. payout_destinations: DELETE refused (42501); owner / method / provider / payee token / kind immutable; REVOKED cannot be reactivated; anon no mutation; rows unchanged", tableDenied(pd.delete) && ["token", "method", "provider", "owner", "kind", "reactivate"].every((k) => guardRefused(pd[k])) && denied(pd.anonUpdate) && JSON.stringify(after) === JSON.stringify(dests.map((d) => ({ id: d.id, status: d.status, provider_payee_token: d.provider_payee_token, payout_method: d.payout_method, provider: after.find((x) => x.id === d.id)?.provider }))), fmt(pd));
}

try {
  if (phase === "gate") await gate();
  else throw new Error(`unknown phase ${phase}`);
} catch (error) {
  record("FAIL", "provider foundation harness", String(error?.stack || error).slice(0, 700));
} finally {
  const out = await fx.cleanup();
  const leftDest = (await db(`payout_destinations?owner_helper_id=in.(${[...fx.created.helperIds, ZERO].join(",")})&select=id`)).length;
  expect("Fixture cleanup (helper / auth user removed; its destinations removed with it by the owner FK cascade)", Object.values(out).every((n) => n === 0) && leftDest === 0, { ...out, leftDest });
}
if (summary().FAIL > 0) process.exit(1);

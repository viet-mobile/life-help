// Airwallex adapter, offline: the REAL adapter / webhook verifier / ingestion / outbox bridge / engine against the
// REAL migration chain (PGlite) with a deterministic FAKE Airwallex HTTP server (documented endpoints only).
// No network, no credentials, no Airwallex API (live or sandbox). AIRWALLEX is registered only in this local DB,
// with the migration-022 default payout_finality = NO_FINAL_SIGNAL.
// Usage: node scripts/test_airwallex_adapter_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const root = new URL("..", import.meta.url);
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-awx-"));
fs.writeFileSync(path.join(stubDir, "cf.mjs"), "export async function getCloudflareContext() { return { env: {}, ctx: { waitUntil() {} } }; }");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(path.join(stubDir, "cf.mjs")).href, shortCircuit: true };
    if (specifier.startsWith("@/")) { const file = new URL(specifier.slice(2) + ".ts", root); return nextResolve((fs.existsSync(file) ? file : new URL(specifier.slice(2) + "/index.ts", root)).href, context); }
    return nextResolve(specifier, context);
  },
});
const { AirwallexAdapter } = await import(new URL("lib/payments/provider/airwallex/adapter.ts", root).href);
const { AirwallexHttpClient } = await import(new URL("lib/payments/provider/airwallex/client.ts", root).href);
const money = await import(new URL("lib/payments/provider/airwallex/money.ts", root).href);
const availability = await import(new URL("lib/payments/provider/airwallex/availability.ts", root).href);
const registry = await import(new URL("lib/payments/provider/registry.ts", root).href);
const ingest = await import(new URL("lib/payments/provider/ingest.ts", root).href);
const { providerMoneyAdapter } = await import(new URL("lib/payments/provider/outboxBridge.ts", root).href);
const engine = await import(new URL("lib/payments/moneyJobs.ts", root).href);

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one } = f;
await f.enablePolicies();
const client = {
  async rpc(fn, args = {}) {
    const keys = Object.keys(args);
    try { const res = await db.query(`select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`, keys.map((k) => (args[k] !== null && typeof args[k] === "object" ? JSON.stringify(args[k]) : args[k]))); return { data: res.rows[0].r, error: null }; }
    catch (e) { return { data: null, error: { code: e.code, message: e.message } }; }
  },
  from(table) {
    const filters = [];
    const q = { select() { return q; }, eq(c, v) { filters.push([c, v]); return q; }, in() { return q; }, order() { return q; }, limit() { return q; },
      async maybeSingle() { const r = await db.query(`select * from public.${table} where ${filters.map(([c], i) => `${c} = $${i + 1}`).join(" and ")} limit 1`, filters.map((x) => x[1])); return { data: r.rows[0] ?? null, error: null }; } };
    return q;
  },
};

// ---------------- local-only registry enablement (this test DB) ----------------
await db.query("insert into public.payment_providers (code, environment, kind, enabled, approved_by, approved_at) values ('AIRWALLEX', 'SANDBOX', 'PSP', true, 'test', now())");
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT", "REFUND"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, 'AIRWALLEX', 'SANDBOX', 'AIRWALLEX_RAIL', true, 'test', now())", [cap]);
const finality = (await one("select payout_finality from public.payment_providers where code = 'AIRWALLEX' and environment = 'SANDBOX'")).payout_finality;

// ---------------- fake Airwallex (documented endpoints only) ----------------
const awx = { fault: null, filterBroken: false, listFault: null, pageSize: 100, refundPageSize: 100, refundFaultFromPage: null, urls: [], createdRequestIds: [], logins: 0, calls: [], intents: new Map(), refunds: new Map(), transfers: new Map(), byRequest: new Map(), tokens: new Set(), clock: Date.parse("2026-09-29T00:00:00Z") };
const reply = (status, body) => ({ status, json: async () => body });
async function fakeFetch(url, init) {
  const u = new URL(url);
  awx.calls.push(`${init.method} ${u.pathname}`);
  if (init.method === "GET") awx.urls.push(`${u.pathname}${u.search}`);
  if (u.pathname === "/api/v1/authentication/login") {
    if (init.headers["x-client-id"] !== "test-client" || init.headers["x-api-key"] !== "test-key") return reply(401, { code: "unauthorized" });
    awx.logins += 1;
    const token = `tok_${awx.logins}`;
    awx.tokens.add(token);
    return reply(201, { token, expires_at: new Date(awx.clock + 30 * 60_000).toISOString() });
  }
  if (!awx.tokens.has(String(init.headers.Authorization).replace("Bearer ", ""))) return reply(401, { code: "unauthorized" });
  const body = init.body ? JSON.parse(init.body) : {};
  const create = (store, prefix, obj) => {
    // Fault injection for uncertain creates: "before" = the request never reached Airwallex; "after" = it was
    // processed but the response was lost. Both surface to the client as a transport error.
    if (awx.fault === "before") { awx.fault = null; throw new Error("ECONNRESET"); }
    const prior = awx.byRequest.get(body.request_id);
    // Documented for transfers: a reused request_id is a duplicate only within 7 days - after that the fake
    // (like Airwallex) would happily create a SECOND object. Recovery must never get here after 7 days.
    if (prior && (prefix !== "trf" || awx.clock - Date.parse(prior.created_at) < 7 * 86400_000)) return reply(201, prior);
    awx.createdRequestIds.push(body.request_id);
    const created = { id: `${prefix}_${crypto.randomBytes(6).toString("hex")}`, created_at: new Date(awx.clock).toISOString(), ...obj };
    store.set(created.id, created); awx.byRequest.set(body.request_id, created);
    if (awx.fault === "after") { awx.fault = null; throw new Error("ETIMEDOUT"); }
    return reply(201, created);
  };
  const lookupFault = () => {
    if (awx.listFault === "network") throw new Error("ECONNRESET");
    if (awx.listFault === "5xx") return reply(503, { code: "service_unavailable" });
    if (awx.listFault === "malformed") return reply(200, { data: "not a list" });
    return null;
  };
  if (init.method === "GET" && u.pathname === "/api/v1/transfers") {
    const bad = lookupFault(); if (bad) return bad;
    const rid = u.searchParams.get("request_id");
    // Documented: without page, only the last 30 days; page=0 on the first request = complete history.
    const page = u.searchParams.get("page");
    const all = [...awx.transfers.values()].filter((t) => (awx.filterBroken || t.request_id === rid) && (page !== null || awx.clock - Date.parse(t.created_at) <= 30 * 86400_000));
    const start = page === null ? 0 : Number(page);
    const end = start + awx.pageSize;
    if (awx.listFault === "loop") return reply(200, { items: all.slice(0, awx.pageSize), page_after: "1" });
    return reply(200, { items: all.slice(start, end), page_after: end < all.length ? String(end) : "" });
  }
  if (init.method === "GET" && u.pathname === "/api/v1/pa/refunds") {
    const num = Number(u.searchParams.get("page_num"));
    if (awx.refundFaultFromPage !== null && num >= awx.refundFaultFromPage) throw new Error("ECONNRESET");
    const bad = lookupFault(); if (bad) return bad;
    const pid = u.searchParams.get("payment_intent_id");
    const all = [...awx.refunds.values()].filter((r) => r.payment_intent_id === pid);
    const size = Math.min(Number(u.searchParams.get("page_size")), awx.refundPageSize);
    return reply(200, { items: all.slice(num * size, (num + 1) * size), has_more: (num + 1) * size < all.length });
  }
  if (u.pathname === "/api/v1/pa/payment_intents/create") return create(awx.intents, "int", { request_id: body.request_id, amount: Number(body.amount), currency: body.currency, merchant_order_id: body.merchant_order_id, metadata: body.metadata, status: "REQUIRES_PAYMENT_METHOD" });
  if (u.pathname === "/api/v1/pa/refunds/create") return create(awx.refunds, "rfd", { request_id: body.request_id, payment_intent_id: body.payment_intent_id, amount: Number(body.amount), currency: awx.intents.get(body.payment_intent_id)?.currency, metadata: body.metadata, status: "RECEIVED" });
  if (u.pathname === "/api/v1/transfers/create") return create(awx.transfers, "trf", { request_id: body.request_id, beneficiary_id: body.beneficiary_id, transfer_amount: Number(body.transfer_amount), transfer_currency: body.transfer_currency, metadata: body.metadata, status: "SCHEDULED", funding: { status: "SCHEDULED" } });
  const get = (store, id) => (store.has(id) ? reply(200, store.get(id)) : reply(404, { code: "not_found" }));
  let m;
  if ((m = u.pathname.match(/^\/api\/v1\/pa\/payment_intents\/(.+)$/))) return get(awx.intents, m[1]);
  if ((m = u.pathname.match(/^\/api\/v1\/pa\/refunds\/(.+)$/))) return get(awx.refunds, m[1]);
  if ((m = u.pathname.match(/^\/api\/v1\/transfers\/(.+)$/))) return get(awx.transfers, m[1]);
  return reply(404, { code: "unknown_endpoint" });
}
const http = new AirwallexHttpClient({ environment: "SANDBOX", credentials: { clientId: "test-client", apiKey: "test-key" }, fetch: fakeFetch, nowMs: () => awx.clock });
const adapter = new AirwallexAdapter({ environment: "SANDBOX", http, webhookToleranceMs: 5 * 60_000 });
const bridge = providerMoneyAdapter(client, adapter);
const SECRET = crypto.randomBytes(24).toString("hex");
const cfg = { deploymentEnvironment: "SANDBOX", webhookSecret: SECRET };
let evn = 0;
function webhook(name, object, { id, ts = Date.now(), secret = SECRET, tamper = false, reserialize = false } = {}) {
  const payload = { id: id ?? `evt_${++evn}_${crypto.randomBytes(4).toString("hex")}`, name, account_id: "acct_test", data: { object }, created_at: new Date().toISOString(), version: "2025-01-01" };
  const raw = JSON.stringify(payload, null, reserialize ? 0 : 1);
  const signature = crypto.createHmac("sha256", secret).update(`${ts}${raw}`).digest("hex");
  const body = tamper ? raw.replace(/"amount": (\d+)/, (_, n) => `"amount": ${Number(n) + 1}`) : reserialize ? JSON.stringify(JSON.parse(raw)) + " " : raw;
  return { rawBody: body, headers: { "x-timestamp": String(ts), "x-signature": signature } };
}
const post = (hook) => ingest.ingestProviderWebhook(client, adapter, hook, cfg);
const intentRow = (id) => one("select status::text s, request_id, amount_base_units, reference from public.payment_intents where id = $1", [id]);
let n = 0;
async function airwallexPayment(label, amount = 60000) {
  n += 1;
  const sido = `AW${label}${n}`;
  const h = await f.helper(`AW${label}${n}`, { sido });
  const price = await f.rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: amount, materials_policy: "INCLUDED" }), true);
  const customer = `W${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const co = await f.helperCheckout(price, customer, sido);
  const opened = await ingest.openProviderPayment(client, adapter, co.checkout_id, customer, b58());
  const intent = opened.ok ? await intentRow(opened.intentId) : null;
  return { h, customer, co, opened, intent, pi: opened.ok ? awx.intents.get(opened.providerPaymentId) : null };
}
const succeeded = (p, extra = {}) => { p.pi.status = "SUCCEEDED"; return { ...p.pi, ...extra }; };

// ================= money + client =================
check("M. exact major/minor conversion: 60000 KRW <-> \"60000\", 1050 USD <-> \"10.50\"; 10.555 USD and unknown currencies refused (never rounded / guessed)",
  money.toMajorString(60000n, "KRW") === "60000" && money.toMajorString(1050n, "USD") === "10.50" && money.toMinor("10.5", "USD") === 1050n && money.toMinor(60000, "KRW") === 60000n
  && (() => { try { money.toMinor("10.555", "USD"); return false; } catch { return true; } })() && (() => { try { money.toMajorString(1n, "XYZ"); return false; } catch { return true; } })());

// ================= payment =================
const a = await airwallexPayment("A");
check("P0. payment intent created with ledger values only: request_id derived from the LIFE.HELP intent, amount from the checkout (60000 KRW), merchant_order_id / metadata = ledger reference; provider payment id bound once", a.opened.ok && a.pi.request_id === `lh-pi-${a.opened.intentId}` && a.pi.amount === 60000 && a.pi.currency === "KRW" && a.pi.merchant_order_id === a.intent.reference && (await one("select provider_payment_id from public.provider_payment_links where payment_intent_id = $1", [a.opened.intentId])).provider_payment_id === a.opened.providerPaymentId);
const good = webhook("payment_intent.succeeded", succeeded(a), { id: "evt_pay_A" });
const invalid = { ...good, headers: { ...good.headers, "x-signature": "0".repeat(64) } };
const wrongSecret = webhook("payment_intent.succeeded", succeeded(a), { secret: "not-the-secret-not-the-secret" });
const tampered = webhook("payment_intent.succeeded", succeeded(a), { tamper: true });
const reserialized = webhook("payment_intent.succeeded", succeeded(a), { reserialize: true });
const old = webhook("payment_intent.succeeded", succeeded(a), { ts: Date.now() - 60 * 60_000 });
const badVerifications = { invalid: await post(invalid), wrongSecret: await post(wrongSecret), tampered: await post(tampered), reserialized: await post(reserialized), oldTimestamp: await post(old) };
check("W1-W4. signature over x-timestamp + EXACT raw body, constant-time compare, verified before parsing: invalid signature, wrong secret, tampered body, re-serialized body (same JSON, different bytes), old timestamp -> 401, nothing recorded, intent untouched", Object.values(badVerifications).every((r) => r.httpStatus === 401 && r.code === "INVALID_SIGNATURE") && (await one("select count(*)::int n from public.provider_events where provider = 'AIRWALLEX'")).n === 0 && (await intentRow(a.opened.intentId)).s === "AWAITING_PAYMENT", Object.fromEntries(Object.entries(badVerifications).map(([k, v]) => [k, v.code])));
const [w1, w2] = await Promise.all([post(good), post(good)]);
const aNow = await intentRow(a.opened.intentId);
check("W5 / P1. valid signed payment_intent.succeeded -> PAID_HELD + request activated; the same event twice (in parallel) -> one effect + safe replay (provider_events unique id)", w1.httpStatus === 200 && [w1.results[0], w2.results[0]].filter((r) => r.result === "APPLIED" && !r.replayed).length === 1 && [w1.results[0], w2.results[0]].some((r) => r.replayed) && aNow.s === "PAID_HELD" && !!aNow.request_id, [w1.results[0], w2.results[0]]);
const pollA = await ingest.reconcileProviderPayment(client, adapter, a.opened.providerPaymentId);
check("P2. poll of the same success after the webhook -> REPLAY_NO_CHANGE; still one request; a successful customer payment creates NO payout obligation", pollA.result === "REPLAY_NO_CHANGE" && (await one("select count(*)::int n from public.service_requests where funding_payment_intent_id = $1", [a.opened.intentId])).n === 1 && (await one("select count(*)::int n from public.payout_obligations where payment_intent_id = $1", [a.opened.intentId])).n === 0);
const b = await airwallexPayment("B");
const bAmt = await post(webhook("payment_intent.succeeded", succeeded(b, { amount: 59999 })));
const c = await airwallexPayment("C");
const cCur = await post(webhook("payment_intent.succeeded", succeeded(c, { currency: "USD", amount: 60000 })));
const d = await airwallexPayment("D");
const dTarget = await post(webhook("payment_intent.succeeded", succeeded(d, { merchant_order_id: a.intent.reference, metadata: { life_help_reference: a.intent.reference } })));
check("P3. provider amount / currency never override the checkout: 59999 -> REVIEW AMOUNT_MISMATCH; USD -> REVIEW CURRENCY_MISMATCH (intents REVIEW_REQUIRED); success carrying ANOTHER intent's ledger reference -> REVIEW TARGET_MISMATCH; none activated", bAmt.results[0]?.code === "AMOUNT_MISMATCH" && (await intentRow(b.opened.intentId)).s === "REVIEW_REQUIRED" && cCur.results[0]?.code === "CURRENCY_MISMATCH" && (await intentRow(c.opened.intentId)).s === "REVIEW_REQUIRED" && dTarget.results[0]?.code === "TARGET_MISMATCH" && (await intentRow(d.opened.intentId)).request_id === null, [bAmt.results[0], cCur.results[0], dTarget.results[0]]);
const e = await airwallexPayment("E");
const replayRef = (await client.rpc("link_provider_payment", { p_intent_id: e.opened.intentId, p_provider_payment_id: a.opened.providerPaymentId })).data;
check("P4. provider reference replay: A's Airwallex payment id cannot be bound to another intent", replayRef?.code === "INTENT_ALREADY_LINKED");
const liveAdapter = new AirwallexAdapter({ environment: "LIVE", http, webhookToleranceMs: 300000 });
const wrongEnv = await ingest.ingestProviderWebhook(client, liveAdapter, webhook("payment_intent.succeeded", succeeded(e)), cfg);
const liveDirect = (await client.rpc("ingest_provider_event", { p_provider: "AIRWALLEX", p_environment: "LIVE", p_provider_account: "x", p_provider_event_id: "evt_live_x", p_source: "WEBHOOK", p_event_type: "PAYMENT_HELD", p_provider_event_type: "payment_intent.succeeded", p_object_ref: e.opened.providerPaymentId, p_life_help_reference: null, p_amount_minor: 60000, p_currency: "KRW", p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: "a".repeat(64), p_signature_verified: true })).data;
check("P5. wrong environment: a LIVE adapter on the SANDBOX deployment -> 403; LIVE evidence at the ledger -> PROVIDER_ENVIRONMENT_NOT_ENABLED; SANDBOX intent untouched", wrongEnv.httpStatus === 403 && liveDirect?.code === "PROVIDER_ENVIRONMENT_NOT_ENABLED" && (await intentRow(e.opened.intentId)).s === "AWAITING_PAYMENT");
const ignorable = await post(webhook("payment_intent.requires_customer_action", { ...a.pi, status: "REQUIRES_CUSTOMER_ACTION" }));
check("P6. documented informational events (requires_customer_action) are verified + acknowledged, nothing recorded", ignorable.httpStatus === 200 && ignorable.results.length === 0);

// ================= payout (finality) =================
await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', 'AIRWALLEX', 'SANDBOX', 'benef_test_A', 'awx ****', 'ACTIVE')", [a.h.id]);
const transfersBefore = awx.transfers.size;
const [asg] = await f.activeAssignments(aNow.request_id);
await f.rpc("accept_assignment", asg.id, a.h.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [aNow.request_id]);
await f.rpc("complete_assignment_service", asg.id, a.h.id);
check("T0. no customer completion -> no payout obligation -> no Airwallex transfer", (await one("select count(*)::int n from public.payout_obligations where request_id = $1", [aNow.request_id])).n === 0 && awx.transfers.size === transfersBefore);
await f.rpc("confirm_service_completion", aNow.request_id, a.customer);
const ob = await one("select * from public.payout_obligations where request_id = $1", [aNow.request_id]);
const job = await f.jobFor({ obligationId: ob.id });
const run1 = await engine.runMoneyJob(client, bridge, job.id);
const att = await one("select * from public.money_movement_attempts where job_id = $1", [job.id]);
const trf = [...awx.transfers.values()].find((x) => x.request_id === att.external_id);
check("T1. customer completion -> one obligation -> transfer created with request_id = the job's idempotency key, beneficiary / amount / currency from the ledger (benef_test_A, 60000 KRW); status looked up by GET /api/v1/transfers?request_id=<key> (no provider object id stored); SCHEDULED -> job CONFIRMING", run1.status === "CONFIRMING" && trf?.beneficiary_id === "benef_test_A" && trf.transfer_amount === 60000 && trf.transfer_currency === "KRW" && awx.calls.includes("GET /api/v1/transfers") && !awx.calls.some((c) => c.startsWith("GET /api/v1/transfers/")), { run1, trf });
const noted = [];
for (const s of ["processing", "sent"]) { trf.status = s.toUpperCase(); noted.push((await post(webhook(`payout.transfer.${s}`, { ...trf }))).results[0]); }
check("T2. scheduled / processing / sent -> NOTED (progress evidence only)", noted.every((r) => r.result === "NOTED"), noted);
trf.status = "PAID";
const paidEvt = webhook("payout.transfer.paid", { ...trf }, { id: "evt_trf_paid_A" });
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [job.id]);
const [pw, pp] = await Promise.all([post(paidEvt), engine.runMoneyJob(client, bridge, job.id)]);
const obPaid = await one("select status from public.payout_obligations where id = $1", [ob.id]);
const jobPaid = await one("select status, last_error_code from public.money_movement_jobs where id = $1", [job.id]);
const attPaid = await one("select state from public.money_movement_attempts where id = $1", [att.id]);
const intentPaid = await intentRow(a.opened.intentId);
check("T3. payout.transfer.paid (webhook) racing the poll: NOT terminal - attempt SUBMITTED, obligation SUBMITTED (not PAID), job CONFIRMING / PROVIDER_PAID_AWAITING_FINALITY, payment NOT settled; exactly one provider transfer",
  obPaid.status === "SUBMITTED" && jobPaid.status === "CONFIRMING" && jobPaid.last_error_code === "PROVIDER_PAID_AWAITING_FINALITY" && attPaid.state === "SUBMITTED" && intentPaid.s !== "SETTLED" && [...awx.transfers.values()].filter((x) => x.request_id === att.external_id).length === 1, { pw: pw.results[0], pp, obPaid, jobPaid, attPaid, intent: intentPaid.s });
const dupPaid = await post(webhook("payout.transfer.paid", { ...trf }));
const dupSame = await post(paidEvt);
check("T4. duplicate PAID (new event id) -> REPLAY_NO_CHANGE (ALREADY_REPORTED_PAID); same event id -> replay", dupPaid.results[0]?.result === "REPLAY_NO_CHANGE" && dupPaid.results[0].code === "ALREADY_REPORTED_PAID" && dupSame.results[0]?.replayed === true);
const forcedConfirm = (await client.rpc("ingest_provider_event", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_provider_account: "x", p_provider_event_id: "evt_misconfigured_confirm", p_source: "WEBHOOK", p_event_type: "PAYOUT_CONFIRMED", p_provider_event_type: "misconfigured", p_object_ref: att.external_id, p_life_help_reference: null, p_amount_minor: 60000, p_currency: "KRW", p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: "b".repeat(64), p_signature_verified: true })).data;
check("T5. defense in depth: even a PAYOUT_CONFIRMED claim for AIRWALLEX (registry NO_FINAL_SIGNAL) is only 'reported paid' - obligation still SUBMITTED, never PAID", finality === "NO_FINAL_SIGNAL" && forcedConfirm?.result === "REPLAY_NO_CHANGE" && (await one("select status from public.payout_obligations where id = $1", [ob.id])).status === "SUBMITTED", forcedConfirm);
trf.status = "FAILED"; trf.failure_reason = "BENEFICIARY_BANK_REJECTED";
const failedAfterPaid = await post(webhook("payout.transfer.failed", { ...trf }));
const jobFailed = await one("select status, last_error_code from public.money_movement_jobs where id = $1", [job.id]);
const obFailed = await one("select status from public.payout_obligations where id = $1", [ob.id]);
const rules = await f.rpc("review_case_actions", "MONEY_JOB", job.id);
check("T6. PAID -> FAILED (documented): applied, never ignored - attempt FAILED, job REVIEW_REQUIRED (PROVIDER_FAILED_AFTER_REPORTED_PAID), obligation NOT PAID, no automatic blind re-send; actionable in the existing 017 review", failedAfterPaid.results[0]?.result === "APPLIED" && jobFailed.status === "REVIEW_REQUIRED" && jobFailed.last_error_code === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && (await one("select state from public.money_movement_attempts where id = $1", [att.id])).state === "FAILED_ONCHAIN" && obFailed.status !== "PAID" && [...awx.transfers.values()].filter((x) => x.beneficiary_id === "benef_test_A").length === 1 && Array.isArray(rules?.actions) && rules.actions.length > 0, { failedAfterPaid: failedAfterPaid.results[0], jobFailed, rules });
trf.status = "PAID";
const paidAfterFailed = await post(webhook("payout.transfer.paid", { ...trf }));
const cancelledAfter = await post(webhook("payout.transfer.cancelled", { ...trf, status: "CANCELLED" }));
check("T7. out of order after the failure: a (delayed) PAID -> REVIEW (never resurrects a failed attempt); CANCELLED (auto after FAILED) -> REPLAY_NO_CHANGE", paidAfterFailed.results[0]?.result === "REVIEW" && cancelledAfter.results[0]?.result === "REPLAY_NO_CHANGE", [paidAfterFailed.results[0], cancelledAfter.results[0]]);
const settleBlocked = (await one("select status from public.service_requests where id = $1", [aNow.request_id])).status;
check("T8. settlement authority untouched: the request stays PAYMENT_PENDING (settlement needs a PAID obligation; a reported-paid or failed Airwallex transfer never provides it)", settleBlocked === "PAYMENT_PENDING");
// FAILED before PAID on another payout -> normal bounded retry path (no paid ever reported)
const g = await airwallexPayment("G");
const gHeld = await post(webhook("payment_intent.succeeded", succeeded(g)));
const gReq = (await intentRow(g.opened.intentId)).request_id;
await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', 'AIRWALLEX', 'SANDBOX', 'benef_test_G', 'awx ****', 'ACTIVE')", [g.h.id]);
const [gasg] = await f.activeAssignments(gReq);
await f.rpc("accept_assignment", gasg.id, g.h.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [gReq]);
await f.rpc("complete_assignment_service", gasg.id, g.h.id);
await f.rpc("confirm_service_completion", gReq, g.customer);
const gJob = await f.jobFor({ obligationId: (await one("select id from public.payout_obligations where request_id = $1", [gReq])).id });
await engine.runMoneyJob(client, bridge, gJob.id);
const gAtt = await one("select * from public.money_movement_attempts where job_id = $1", [gJob.id]);
const gTrf = [...awx.transfers.values()].find((x) => x.request_id === gAtt.external_id);
gTrf.status = "FAILED";
const gFail = await post(webhook("payout.transfer.failed", { ...gTrf, transfer_amount: undefined }));
check("T9. FAILED before any PAID (failure event without an amount): applied as an ordinary provider failure - attempt FAILED, job RETRYABLE (bounded), obligation not PAID", gHeld.results[0]?.result === "APPLIED" && gFail.results[0]?.result === "APPLIED" && (await one("select status from public.money_movement_jobs where id = $1", [gJob.id])).status === "RETRYABLE" && (await one("select state from public.money_movement_attempts where id = $1", [gAtt.id])).state === "FAILED_ONCHAIN", gFail.results[0]);
const wrongObligation = await post(webhook("payout.transfer.paid", { ...gTrf, request_id: "lh_not_our_key_000001", status: "PAID" }));
check("T10. a transfer event for an unknown LIFE.HELP obligation / key -> UNMATCHED (never creates payout authority)", wrongObligation.results[0]?.result === "UNMATCHED");

// ================= payout recovery by request_id (uncertain create) =================
async function awxPayoutJob(label, benef) {
  const p = await airwallexPayment(label);
  await post(webhook("payment_intent.succeeded", succeeded(p)));
  const req = (await intentRow(p.opened.intentId)).request_id;
  await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', 'AIRWALLEX', 'SANDBOX', $2, 'awx ****', 'ACTIVE')", [p.h.id, benef]);
  const [x] = await f.activeAssignments(req);
  await f.rpc("accept_assignment", x.id, p.h.id);
  await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [req]);
  await f.rpc("complete_assignment_service", x.id, p.h.id);
  await f.rpc("confirm_service_completion", req, p.customer);
  const obl = await one("select * from public.payout_obligations where request_id = $1", [req]);
  return { req, ob: obl, job: await f.jobFor({ obligationId: obl.id }) };
}
const transfersFor = (key) => [...awx.transfers.values()].filter((t) => t.request_id === key);
const creates = () => awx.calls.filter((c) => c === "POST /api/v1/transfers/create").length;
const jobRow = (id) => one("select status, last_error_code, attempt_count from public.money_movement_jobs where id = $1", [id]);
const attemptsOf = (id) => db.query("select state, external_id from public.money_movement_attempts where job_id = $1", [id]).then((r) => r.rows);
const rerun = async (id) => { await f.makeDue(id); await f.expireLease(id); return engine.runMoneyJob(client, bridge, id); };

const u1 = await awxPayoutJob("U1", "benef_U1");
awx.fault = "after";
const c0 = creates();
const u1a = await engine.runMoneyJob(client, bridge, u1.job.id);
const u1Key = (await attemptsOf(u1.job.id))[0].external_id;
const u1b = await rerun(u1.job.id);
check("U1. uncertain create (processed, response lost) -> the job is NOT failed and no new key is minted; recovery GET /api/v1/transfers?request_id=<key> finds exactly one transfer -> validated -> job CONFIRMING; one create call, one transfer, one attempt",
  u1a.status !== "CONFIRMING" && transfersFor(u1Key).length === 1 && u1b.status === "CONFIRMING" && creates() === c0 + 1 && (await attemptsOf(u1.job.id)).length === 1 && (await attemptsOf(u1.job.id))[0].state === "SUBMITTED", { u1a, u1b });
const u2 = await awxPayoutJob("U2", "benef_U2");
awx.fault = "before";
const u2a = await engine.runMoneyJob(client, bridge, u2.job.id);
const u2Key = (await attemptsOf(u2.job.id))[0].external_id;
const u2none = transfersFor(u2Key).length;
const u2b = await rerun(u2.job.id);
check("U2. uncertain create that never reached Airwallex -> lookup by request_id returns none -> the SAME persisted request is re-submitted under the SAME request_id (engine re-send branch, AWAITING_NETWORK); exactly one transfer, one attempt, now SUBMITTED",
  u2a.status !== "CONFIRMING" && u2none === 0 && u2b.status === "WAITING" && u2b.code === "AWAITING_NETWORK" && transfersFor(u2Key).length === 1 && (await attemptsOf(u2.job.id)).length === 1 && (await attemptsOf(u2.job.id))[0].state === "SUBMITTED", { u2a, u2b });
const u1t = transfersFor(u1Key)[0];
awx.transfers.set("trf_dup_U1", { ...u1t, id: "trf_dup_U1" });
const u3 = await rerun(u1.job.id);
check("U3. lookup returns more than one transfer for one request_id -> REVIEW_REQUIRED (PROVIDER_OBJECT_AMBIGUOUS); nothing guessed, obligation not PAID", (await jobRow(u1.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(u1.job.id)).last_error_code === "PROVIDER_OBJECT_AMBIGUOUS" && (await one("select status from public.payout_obligations where id = $1", [u1.ob.id])).status !== "PAID", u3);
transfersFor(u2Key)[0].transfer_amount = 59999;
await rerun(u2.job.id);
check("U4. returned transfer amount mismatch -> REVIEW (PROVIDER_AMOUNT_MISMATCH)", (await jobRow(u2.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(u2.job.id)).last_error_code === "PROVIDER_AMOUNT_MISMATCH");
const u5 = await awxPayoutJob("U5", "benef_U5");
await engine.runMoneyJob(client, bridge, u5.job.id);
const u5t = transfersFor((await attemptsOf(u5.job.id))[0].external_id)[0];
u5t.transfer_currency = "USD";
await rerun(u5.job.id);
check("U5. returned transfer currency mismatch -> REVIEW (PROVIDER_AMOUNT_MISMATCH: amount + currency must both equal the ledger)", (await jobRow(u5.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(u5.job.id)).last_error_code === "PROVIDER_AMOUNT_MISMATCH");
const u6 = await awxPayoutJob("U6", "benef_U6");
await engine.runMoneyJob(client, bridge, u6.job.id);
const u6t = transfersFor((await attemptsOf(u6.job.id))[0].external_id)[0];
u6t.beneficiary_id = "benef_someone_else";
u6t.status = "PAID";
await rerun(u6.job.id);
check("U6. returned beneficiary differs from the ledger destination -> REVIEW (PROVIDER_TARGET_MISMATCH) even when Airwallex says PAID; obligation not PAID", (await jobRow(u6.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(u6.job.id)).last_error_code === "PROVIDER_TARGET_MISMATCH" && (await one("select status from public.payout_obligations where id = $1", [u6.ob.id])).status !== "PAID");
const u7 = await awxPayoutJob("U7", "benef_U7");
await engine.runMoneyJob(client, bridge, u7.job.id);
awx.filterBroken = true; // the provider returns every transfer, including other obligations' objects
const u7b = await rerun(u7.job.id);
awx.filterBroken = false;
check("U7. no borrowing across obligations: even if the provider-side filter returned other transfers, only the object whose request_id EXACTLY equals this job's persisted key is used (job stays CONFIRMING, not ambiguous / not matched to another obligation)", u7b.status === "CONFIRMING" && (await jobRow(u7.job.id)).status === "CONFIRMING", u7b);
awx.transfers.delete("trf_dup_U1");

// ================= refund =================
const offer = await f.offerCheckout("AWREFUND", 50000);
const offOpen = await ingest.openProviderPayment(client, adapter, offer.checkout_id, "AWREFUND", b58());
const offPi = awx.intents.get(offOpen.providerPaymentId);
offPi.status = "SUCCEEDED";
await post(webhook("payment_intent.succeeded", { ...offPi }));
const offReq = (await intentRow(offOpen.intentId)).request_id;
const cancel = await f.rpc("cancel_funded_request", offReq, "AWREFUND");
const rJob = await f.jobFor({ refundId: cancel.refund_id });
await engine.runMoneyJob(client, bridge, rJob.id);
const rAtt = await one("select * from public.money_movement_attempts where job_id = $1", [rJob.id]);
const rfd = [...awx.refunds.values()].find((x) => x.request_id === rAtt.external_id);
check("R1. refund consumes the existing LIFE.HELP refund obligation: request_id = its idempotency key, payment_intent_id = the ledger-bound Airwallex payment, amount from the ledger (50000 KRW); RECEIVED -> pending", rfd?.payment_intent_id === offOpen.providerPaymentId && rfd.amount === 50000 && rfd.currency === "KRW" && awx.calls.includes("GET /api/v1/pa/refunds") && !awx.calls.some((c) => c.startsWith("GET /api/v1/pa/refunds/")));
const rNoted = [];
for (const s of ["received", "accepted"]) { rfd.status = s.toUpperCase(); rNoted.push((await post(webhook(`refund.${s}`, { ...rfd }))).results[0]?.result); }
rfd.status = "SETTLED";
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [rJob.id]);
const [rw, rp] = await Promise.all([post(webhook("refund.settled", { ...rfd })), engine.runMoneyJob(client, bridge, rJob.id)]);
const refundRow = await one("select status from public.service_refunds where id = $1", [cancel.refund_id]);
const rFailLate = await post(webhook("refund.failed", { ...rfd, status: "FAILED" }));
check("R2. refund received / accepted -> NOTED; settled (webhook vs poll race) -> exactly one completion: refund COMPLETED, intent REFUNDED; a later refund.failed -> REVIEW (PROVIDER_FAILED_AFTER_CONFIRMED), never silently ignored", rNoted.every((x) => x === "NOTED") && refundRow.status === "COMPLETED" && (await intentRow(offOpen.intentId)).s === "REFUNDED" && ((rw.results[0]?.result === "APPLIED") !== (rp.status === "CONFIRMED")) && rFailLate.results[0]?.code === "PROVIDER_FAILED_AFTER_CONFIRMED", { rw: rw.results[0], rp, rFailLate: rFailLate.results[0] });

// ================= refund recovery (list by the ledger-bound payment, exact request_id) =================
async function awxRefundJob(label) {
  const cust = `RF${label}`.padEnd(8, "Z").slice(0, 8).toUpperCase();
  const o = await f.offerCheckout(cust, 50000);
  const op = await ingest.openProviderPayment(client, adapter, o.checkout_id, cust, b58());
  const pi = awx.intents.get(op.providerPaymentId);
  pi.status = "SUCCEEDED";
  await post(webhook("payment_intent.succeeded", { ...pi }));
  const rq = (await intentRow(op.intentId)).request_id;
  const cn = await f.rpc("cancel_funded_request", rq, cust);
  return { payId: op.providerPaymentId, job: await f.jobFor({ refundId: cn.refund_id }), refundId: cn.refund_id };
}
const refundCreates = () => awx.calls.filter((c) => c === "POST /api/v1/pa/refunds/create").length;
const v1 = await awxRefundJob("V1");
awx.refunds.set("rfd_foreign_V1", { id: "rfd_foreign_V1", request_id: "someone_elses_request", payment_intent_id: v1.payId, amount: 50000, currency: "KRW", status: "SETTLED" });
awx.fault = "after";
const rc0 = refundCreates();
await engine.runMoneyJob(client, bridge, v1.job.id);
const v1b = await rerun(v1.job.id);
const v1Key = (await attemptsOf(v1.job.id))[0].external_id;
check("V1. refund uncertain create -> recovered by listing refunds of the ledger-bound payment (no request_id filter exists) and matching request_id exactly: one refund, one create call, a foreign SETTLED refund on the same payment is NOT taken as ours (job CONFIRMING, refund not completed by it)",
  v1b.status === "CONFIRMING" && [...awx.refunds.values()].filter((r) => r.request_id === v1Key).length === 1 && refundCreates() === rc0 + 1 && (await one("select status from public.service_refunds where id = $1", [v1.refundId])).status !== "COMPLETED", v1b);
const v1r = [...awx.refunds.values()].find((r) => r.request_id === v1Key);
awx.refunds.set("rfd_dup_V1", { ...v1r, id: "rfd_dup_V1" });
await rerun(v1.job.id);
check("V2. two refunds for one request_id -> REVIEW (PROVIDER_OBJECT_AMBIGUOUS)", (await jobRow(v1.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(v1.job.id)).last_error_code === "PROVIDER_OBJECT_AMBIGUOUS");
const noCtx = await adapter.queryRefund("lh_some_key_000001", { providerPaymentId: null });
check("V3. a refund lookup without the ledger payment binding fails closed (AMBIGUOUS -> REVIEW), never a blind re-create", noCtx.status === "AMBIGUOUS");

// ================= recovery hardening: complete history, pagination, UNKNOWN != zero, 7-day boundary =================
const backdateAttempt = async (jobId, ms) => {
  await db.exec("alter table public.money_movement_attempts disable trigger user");
  await db.query("update public.money_movement_attempts set prepared_at = prepared_at - ($2 || ' milliseconds')::interval where job_id = $1", [jobId, String(ms)]);
  await db.exec("alter table public.money_movement_attempts enable trigger user");
};
const DAY = 86400_000;
const lostBefore = async (label) => { const j = await awxPayoutJob(label, `benef_${label}`); awx.fault = "before"; await engine.runMoneyJob(client, bridge, j.job.id); return { ...j, key: (await attemptsOf(j.job.id))[0].external_id }; };

const rw1 = await awxPayoutJob("W1", "benef_W1");
await engine.runMoneyJob(client, bridge, rw1.job.id);
const rw1Key = (await attemptsOf(rw1.job.id))[0].external_id;
transfersFor(rw1Key)[0].created_at = new Date(awx.clock - 40 * DAY).toISOString(); // older than the default 30-day list window
await backdateAttempt(rw1.job.id, 40 * DAY);
const rw1c = creates(), rw1urls = awx.urls.length;
const rw1b = await rerun(rw1.job.id);
const rw1first = awx.urls.slice(rw1urls).find((x) => x.startsWith("/api/v1/transfers?"));
check("H1. complete-history lookup: the first transfers lookup sends request_id + page=0 (lifts the default 30-day window); a 40-day-old matching transfer is FOUND and validated - not treated as missing, not recreated (even though its 7-day window has passed)",
  /request_id=/.test(rw1first ?? "") && /[?&]page=0(&|$)/.test(rw1first ?? "") && rw1b.status === "CONFIRMING" && creates() === rw1c && transfersFor(rw1Key).length === 1, { rw1first, rw1b });

awx.pageSize = 1; awx.filterBroken = true; // provider returns every transfer, one per page: the match is deep in the history
const rw2urls = awx.urls.length;
const rw2 = await rerun(rw1.job.id);
const rw2pages = awx.urls.slice(rw2urls).filter((x) => x.startsWith("/api/v1/transfers?")).length;
awx.transfers.set("trf_dup_W1", { ...transfersFor(rw1Key)[0], id: "trf_dup_W1" });
const rw2dup = await rerun(rw1.job.id);
awx.pageSize = 100; awx.filterBroken = false; awx.transfers.delete("trf_dup_W1");
check("H2. pagination followed to completion (page_after): with one object per page the single match is found across " + rw2pages + " pages; a duplicate on a later page is seen -> REVIEW (PROVIDER_OBJECT_AMBIGUOUS)",
  rw2.status === "CONFIRMING" && rw2pages > 3 && (await jobRow(rw1.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(rw1.job.id)).last_error_code === "PROVIDER_OBJECT_AMBIGUOUS", { rw2, rw2dup, rw2pages });

const unknownCases = {};
for (const fault of ["network", "5xx", "malformed", "loop"]) {
  const j = await lostBefore(`W3${fault.slice(0, 3)}`);
  awx.listFault = fault;
  const c = creates();
  const r = await rerun(j.job.id);
  awx.listFault = null;
  unknownCases[fault] = { status: r.status, code: r.code, created: creates() - c, transfers: transfersFor(j.key).length, attempt: (await attemptsOf(j.job.id))[0].state, attempts: (await attemptsOf(j.job.id)).length };
}
check("H3. lookup network failure / 5xx / malformed body / never-ending pagination are UNKNOWN, not zero: job RETRYABLE (PROVIDER_LOOKUP_UNKNOWN), attempt still live, NO create call, no transfer, no new attempt",
  Object.values(unknownCases).every((x) => x.status === "RETRYABLE" && x.code === "PROVIDER_LOOKUP_UNKNOWN" && x.created === 0 && x.transfers === 0 && x.attempt === "PREPARED" && x.attempts === 1), unknownCases);

const rw4 = await lostBefore("W4");
await backdateAttempt(rw4.job.id, 6 * DAY);
const rw4c = creates();
const rw4r = await rerun(rw4.job.id);
check("H4. zero transfers + attempt age 6 days (< 7-day request_id window) -> the SAME stored request_id is re-sent once; one transfer under that key; still one attempt",
  rw4r.code === "AWAITING_NETWORK" && creates() === rw4c + 1 && transfersFor(rw4.key).length === 1 && (await attemptsOf(rw4.job.id)).length === 1, rw4r);

const rw5 = await lostBefore("W5");
await backdateAttempt(rw5.job.id, 7 * DAY);
const rw5c = creates();
const rw5r = await rerun(rw5.job.id);
const rw5b = await rerun(rw5.job.id);
const rw5ok = (await jobRow(rw5.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(rw5.job.id)).last_error_code === "PROVIDER_IDEMPOTENCY_WINDOW_EXPIRED" && creates() === rw5c && transfersFor(rw5.key).length === 0;
const rw6 = await lostBefore("W6");
await backdateAttempt(rw6.job.id, 7 * DAY - 30 * 60_000); // inside the 1-hour safety margin before day 7
const rw6c = creates();
await rerun(rw6.job.id);
check("H5. zero transfers + attempt age >= 7 days -> REVIEW_REQUIRED (PROVIDER_IDEMPOTENCY_WINDOW_EXPIRED), NO create; the clock-skew margin closes the window 1 hour early (6d23h30m -> REVIEW as well); a later run does not create either",
  rw5ok && transfersFor(rw5.key).length === 0
  && (await jobRow(rw6.job.id)).last_error_code === "PROVIDER_IDEMPOTENCY_WINDOW_EXPIRED" && creates() === rw6c, { rw5r, rw5b, rw6: await jobRow(rw6.job.id), c: creates() - rw6c, a: await attemptsOf(rw6.job.id) });

const rw7 = await lostBefore("W7");
const blindClient = { rpc: client.rpc, from: (t) => (t === "money_movement_attempts" ? { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: null, error: null }; } } : client.from(t)) };
const blindBridge = providerMoneyAdapter(blindClient, adapter);
await f.makeDue(rw7.job.id); await f.expireLease(rw7.job.id);
const rw7c = creates();
await engine.runMoneyJob(client, blindBridge, rw7.job.id);
check("H6. missing authoritative attempt timestamp -> REVIEW_REQUIRED (PROVIDER_CREATE_TIME_UNKNOWN), NO create", (await jobRow(rw7.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(rw7.job.id)).last_error_code === "PROVIDER_CREATE_TIME_UNKNOWN" && creates() === rw7c);

// ---- refunds ----
const x1 = await awxRefundJob("X1");
for (let i = 0; i < 3; i += 1) awx.refunds.set(`rfd_other_X1_${i}`, { id: `rfd_other_X1_${i}`, request_id: `other_req_${i}`, payment_intent_id: x1.payId, amount: 1, currency: "KRW", status: "SETTLED" });
awx.refundPageSize = 2;
const x1r = await engine.runMoneyJob(client, bridge, x1.job.id);
const x1Key = (await attemptsOf(x1.job.id))[0].external_id;
const x1pages = awx.urls.filter((x) => x.startsWith("/api/v1/pa/refunds?") && x.includes(encodeURIComponent(x1.payId))).map((x) => new URL(`https://x${x}`).searchParams.get("page_num"));
check("X1. refund on page 2: refunds of the ledger-bound payment listed page by page until has_more=false; the exact request_id match on page 2 is found (job CONFIRMING, no second refund)",
  x1r.status === "CONFIRMING" && x1pages.includes("1") && [...awx.refunds.values()].filter((r) => r.request_id === x1Key).length === 1, { x1r, x1pages });

const x2 = await awxRefundJob("X2");
for (let i = 0; i < 3; i += 1) awx.refunds.set(`rfd_other_X2_${i}`, { id: `rfd_other_X2_${i}`, request_id: `other2_req_${i}`, payment_intent_id: x2.payId, amount: 1, currency: "KRW", status: "SETTLED" });
awx.fault = "before";
await engine.runMoneyJob(client, bridge, x2.job.id);
const x2Key = (await attemptsOf(x2.job.id))[0].external_id;
awx.refundFaultFromPage = 1; // page 0 answers has_more=true, page 1 fails
const rcX2 = refundCreates();
const x2r = await rerun(x2.job.id);
awx.refundFaultFromPage = 0; // the very first page fails
const x3r = await rerun(x2.job.id);
awx.refundFaultFromPage = null;
check("X2 / X3. has_more=true first page + failing page 2, and a failing first page: UNKNOWN (RETRYABLE, PROVIDER_LOOKUP_UNKNOWN) - a partial page is never zero, no refund create",
  x2r.status === "RETRYABLE" && x2r.code === "PROVIDER_LOOKUP_UNKNOWN" && x3r.code === "PROVIDER_LOOKUP_UNKNOWN" && refundCreates() === rcX2 && [...awx.refunds.values()].filter((r) => r.request_id === x2Key).length === 0, { x2r, x3r });
const x4r = await rerun(x2.job.id);
awx.refundPageSize = 100;
check("X4. refund: zero matches after COMPLETE pagination -> REVIEW (PROVIDER_IDEMPOTENCY_WINDOW_UNDOCUMENTED): Airwallex documents no refund request_id dedupe window, so the refund is never re-sent blind", (await jobRow(x2.job.id)).status === "REVIEW_REQUIRED" && (await jobRow(x2.job.id)).last_error_code === "PROVIDER_IDEMPOTENCY_WINDOW_UNDOCUMENTED" && refundCreates() === rcX2, x4r);

const allKeys = new Set((await db.query("select external_id from public.money_movement_attempts where network = 'provider:AIRWALLEX:SANDBOX'")).rows.map((r) => r.external_id));
const multiAttempt = (await one("select count(*)::int n from (select job_id from public.money_movement_attempts where network = 'provider:AIRWALLEX:SANDBOX' group by job_id having count(*) > 1) x")).n;
check("H7. no new request_id is ever generated during recovery: every transfer / refund create carried a persisted attempt key, and no Airwallex job ever got a second attempt",
  awx.createdRequestIds.filter((r) => !r.startsWith("lh-pi-")).every((r) => allKeys.has(r)) && multiAttempt === 0, { multiAttempt });

// ================= auth / gates / static =================
const loginsSoFar = awx.logins;
awx.clock += 40 * 60_000;
await adapter.queryPayment(a.opened.providerPaymentId);
check("A1. access token reused across calls (one login for the whole run), refreshed only after expiry", loginsSoFar === 1 && awx.logins === 2);
awx.tokens.clear();
await adapter.queryPayment(a.opened.providerPaymentId);
const badHttp = new AirwallexHttpClient({ environment: "SANDBOX", credentials: { clientId: "test-client", apiKey: "wrong-key-SECRETVALUE" }, fetch: fakeFetch });
const authErr = await badHttp.request("GET", "/api/v1/pa/payment_intents/x").then(() => null, (err) => err);
check("A1b. a revoked token -> exactly one re-login on 401 then success; failed login -> AirwallexApiError that never echoes the credentials", awx.logins === 3 && authErr?.status === 401 && !String(authErr.message + JSON.stringify(authErr)).includes("SECRETVALUE") && !String(authErr.message).includes("test-client"));
check("A2. commercial gate: AIRWALLEX_COMMERCIAL_AVAILABILITY.approved = false; the registry never resolves AIRWALLEX (not even on staging SANDBOX with every flag); connected-account payout eligibility deny-by-default (COMPLIANCE_POLICY_UNCONFIGURED)", availability.AIRWALLEX_COMMERCIAL_AVAILABILITY.approved === false && availability.airwallexUsable().usable === false
  && registry.resolveProviderAdapter("AIRWALLEX", { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", LIFE_HELP_PROVIDER_ENVIRONMENT: "SANDBOX", LIFE_HELP_MOCK_PROVIDER: "ENABLED" }) === null && availability.connectedAccountPayoutEligibility(null).code === "COMPLIANCE_POLICY_UNCONFIGURED");
const read = (p) => fs.readFileSync(new URL(p, root), "utf8");
const awxSrc = ["adapter.ts", "client.ts", "webhook.ts", "money.ts", "availability.ts"].map((x) => read(`lib/payments/provider/airwallex/${x}`)).join("\n");
check("S1. static: no credentials / tokens in the adapter; PAID never mapped to a final confirmation; signature verified before JSON.parse; no Korean acquiring / holding-period / country assumptions",
  !/(x-api-key|x-client-id)["']?\s*:\s*["'][A-Za-z0-9]{8,}|sk_|Bearer [A-Za-z0-9]{12,}/.test(awxSrc) && /"payout\.transfer\.paid": "PAYOUT_REPORTED_PAID"/.test(awxSrc) && !/"payout\.transfer\.paid": "PAYOUT_CONFIRMED"/.test(awxSrc) && !/PAID"\s*\?\s*"CONFIRMED"/.test(awxSrc)
  && read("lib/payments/provider/airwallex/adapter.ts").indexOf("verifyAirwallexSignature(") < read("lib/payments/provider/airwallex/adapter.ts").indexOf("mapAirwallexEvent(") && read("lib/payments/provider/airwallex/webhook.ts").indexOf("timingSafeEqualHex(expected") < read("lib/payments/provider/airwallex/webhook.ts").indexOf("JSON.parse(rawBody)")
  && !/\bKR\b|KOREA|holding_?period|max_?hold/i.test(awxSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")));
check("S2. no outbound call to a real Airwallex host happened (every request went to the injected offline fake)", awx.calls.length > 0 && awx.calls.every((c) => /^(GET|POST) \/api\/v1\//.test(c)));

done();

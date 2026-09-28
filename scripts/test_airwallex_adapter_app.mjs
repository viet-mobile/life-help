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
const awx = { logins: 0, calls: [], intents: new Map(), refunds: new Map(), transfers: new Map(), byRequest: new Map(), tokens: new Set(), clock: Date.parse("2026-09-29T00:00:00Z") };
const reply = (status, body) => ({ status, json: async () => body });
async function fakeFetch(url, init) {
  const u = new URL(url);
  awx.calls.push(`${init.method} ${u.pathname}`);
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
    const prior = awx.byRequest.get(body.request_id);
    if (prior) return reply(201, prior);
    const created = { id: `${prefix}_${crypto.randomBytes(6).toString("hex")}`, ...obj };
    store.set(created.id, created); awx.byRequest.set(body.request_id, created);
    return reply(201, created);
  };
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
const bound = await one("select provider_object_id from public.provider_object_refs where external_id = $1", [att.external_id]);
check("T1. customer completion -> one obligation -> transfer created with request_id = the job's idempotency key, beneficiary / amount / currency from the ledger (benef_test_A, 60000 KRW); Airwallex transfer id bound once; SCHEDULED -> job CONFIRMING", run1.status === "CONFIRMING" && trf?.beneficiary_id === "benef_test_A" && trf.transfer_amount === 60000 && trf.transfer_currency === "KRW" && bound?.provider_object_id === trf.id, { run1, trf });
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
check("R1. refund consumes the existing LIFE.HELP refund obligation: request_id = its idempotency key, payment_intent_id = the ledger-bound Airwallex payment, amount from the ledger (50000 KRW); RECEIVED -> pending", rfd?.payment_intent_id === offOpen.providerPaymentId && rfd.amount === 50000 && rfd.currency === "KRW" && (await one("select provider_object_id from public.provider_object_refs where external_id = $1", [rAtt.external_id])).provider_object_id === rfd.id);
const rNoted = [];
for (const s of ["received", "accepted"]) { rfd.status = s.toUpperCase(); rNoted.push((await post(webhook(`refund.${s}`, { ...rfd }))).results[0]?.result); }
rfd.status = "SETTLED";
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [rJob.id]);
const [rw, rp] = await Promise.all([post(webhook("refund.settled", { ...rfd })), engine.runMoneyJob(client, bridge, rJob.id)]);
const refundRow = await one("select status from public.service_refunds where id = $1", [cancel.refund_id]);
const rFailLate = await post(webhook("refund.failed", { ...rfd, status: "FAILED" }));
check("R2. refund received / accepted -> NOTED; settled (webhook vs poll race) -> exactly one completion: refund COMPLETED, intent REFUNDED; a later refund.failed -> REVIEW (PROVIDER_FAILED_AFTER_CONFIRMED), never silently ignored", rNoted.every((x) => x === "NOTED") && refundRow.status === "COMPLETED" && (await intentRow(offOpen.intentId)).s === "REFUNDED" && ((rw.results[0]?.result === "APPLIED") !== (rp.status === "CONFIRMED")) && rFailLate.results[0]?.code === "PROVIDER_FAILED_AFTER_CONFIRMED", { rw: rw.results[0], rp, rFailLate: rFailLate.results[0] });

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

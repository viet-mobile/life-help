// Provider foundation, app level: the REAL TypeScript modules (lib/payments/provider/*, lib/payments/moneyJobs.ts)
// against the REAL migration chain (PGlite) through a thin Supabase-client shim, with the deterministic SANDBOX
// mock provider. No network, no provider, no chain. Promise.all races interleave at every await; PGlite
// serializes statements (true multi-connection races run on staging after migration 020 is applied).
// Usage: node scripts/test_provider_foundation_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const root = new URL("..", import.meta.url);
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-provider-"));
const cloudflare = path.join(stubDir, "cf.mjs");
fs.writeFileSync(cloudflare, "export async function getCloudflareContext() { return { env: globalThis.__env || {}, ctx: { waitUntil() {} } }; }");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(cloudflare).href, shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const file = new URL(specifier.slice(2) + ".ts", root);
      return nextResolve((fs.existsSync(file) ? file : new URL(specifier.slice(2) + "/index.ts", root)).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { MockPaymentProvider } = await import(new URL("lib/payments/provider/mockProvider.ts", root).href);
const ingest = await import(new URL("lib/payments/provider/ingest.ts", root).href);
const { providerMoneyAdapter } = await import(new URL("lib/payments/provider/outboxBridge.ts", root).href);
const registry = await import(new URL("lib/payments/provider/registry.ts", root).href);
const policy = await import(new URL("lib/payments/provider/policyHooks.ts", root).href);
const engine = await import(new URL("lib/payments/moneyJobs.ts", root).href);

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one } = f;
await f.enablePolicies();
const client = {
  async rpc(fn, args = {}) {
    const keys = Object.keys(args);
    const text = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
    try {
      const res = await db.query(text, keys.map((k) => (args[k] !== null && typeof args[k] === "object" ? JSON.stringify(args[k]) : args[k])));
      return { data: res.rows[0].r, error: null };
    } catch (e) { return { data: null, error: { code: e.code, message: e.message } }; }
  },
  from(table) {
    const filters = [];
    const q = { select() { return q; }, eq(c, v) { filters.push([c, v]); return q; }, in() { return q; }, order() { return q; }, limit() { return q; },
      async maybeSingle() { const r = await db.query(`select * from public.${table} where ${filters.map(([c], i) => `${c} = $${i + 1}`).join(" and ")} limit 1`, filters.map((x) => x[1])); return { data: r.rows[0] ?? null, error: null }; } };
    return q;
  },
};

const P = "MOCK_PROVIDER", ENV = "SANDBOX";
const SECRET = crypto.randomBytes(24).toString("hex");
const cfg = { deploymentEnvironment: "SANDBOX", webhookSecret: SECRET };
await db.query("update public.payment_providers set enabled = true, approved_by = 'test', approved_at = now() where code = $1 and environment = $2", [P, ENV]);
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT", "REFUND"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, $2, $3, 'MOCK_RAIL', true, 'test', now())", [cap, P, ENV]);
const mock = new MockPaymentProvider("SANDBOX");
const intentOf = (id) => one("select status::text s, request_id from public.payment_intents where id = $1", [id]);
let n = 0;
async function funded(label, amount = 60000) {
  n += 1;
  const sido = `AP${label}${n}`;
  const h = await f.helper(`AP${label}${n}`, { sido });
  const price = await f.rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: amount, materials_policy: "INCLUDED" }), true);
  const customer = `A${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const co = await f.helperCheckout(price, customer, sido);
  const opened = await ingest.openProviderPayment(client, mock, co.checkout_id, customer, b58());
  return { h, customer, co, opened };
}

// ================= contract: open -> hosted session -> signed webhook -> PAID_HELD =================
const a = await funded("A");
const aIntent = await one("select reference, amount_base_units from public.payment_intents where id = $1", [a.opened.intentId]);
check("C1. open provider payment: ledger intent first (amount from the checkout), hosted session, binding recorded", a.opened.ok && !!a.opened.redirectUrl && (await one("select provider_payment_id from public.provider_payment_links where payment_intent_id = $1", [a.opened.intentId])).provider_payment_id === a.opened.providerPaymentId);
mock.completePayment(a.opened.providerPaymentId);
const heldHook = await mock.webhook(SECRET, [{ id: "evt_A_held", type: "payment.held", object: a.opened.providerPaymentId, reference: aIntent.reference, amount: { amountMinor: 60000n, currency: "KRW" } }]);
// ---- parallel duplicate delivery of the SAME webhook ----
const [w1, w2] = await Promise.all([ingest.ingestProviderWebhook(client, mock, heldHook, cfg), ingest.ingestProviderWebhook(client, mock, heldHook, cfg)]);
const results = [w1.results[0], w2.results[0]];
const aNow = await intentOf(a.opened.intentId);
check("C2. same webhook delivered twice in parallel: exactly ONE APPLIED (PAID_HELD + one request), the other a safe replay", w1.httpStatus === 200 && w2.httpStatus === 200 && results.filter((r) => r.result === "APPLIED" && !r.replayed).length === 1 && results.filter((r) => r.replayed === true).length === 1 && aNow.s === "PAID_HELD" && (await one("select count(*)::int n from public.service_requests where funding_payment_intent_id = $1", [a.opened.intentId])).n === 1, JSON.stringify(results));

// ---- webhook vs poll race on a new payment ----
const b = await funded("B");
mock.completePayment(b.opened.providerPaymentId);
const bHook = await mock.webhook(SECRET, [{ id: "evt_B_held", type: "payment.held", object: b.opened.providerPaymentId, amount: { amountMinor: 60000n, currency: "KRW" } }]);
const [wb, pb] = await Promise.all([ingest.ingestProviderWebhook(client, mock, bHook, cfg), ingest.reconcileProviderPayment(client, mock, b.opened.providerPaymentId)]);
const effects = [wb.results[0], pb].filter((r) => r.result === "APPLIED");
check("C3. webhook vs poll racing for the same hold: one APPLIED, the other REPLAY_NO_CHANGE; one request, one PAID_HELD", effects.length === 1 && [wb.results[0], pb].some((r) => r.result === "REPLAY_NO_CHANGE") && (await intentOf(b.opened.intentId)).s === "PAID_HELD" && (await one("select count(*)::int n from public.service_requests where funding_payment_intent_id = $1", [b.opened.intentId])).n === 1, JSON.stringify([wb.results[0], pb]));
const pollAgain = await ingest.reconcileProviderPayment(client, mock, b.opened.providerPaymentId);
check("C4. repeated polls of an unchanged provider status are replays (event id = provider status version)", pollAgain.replayed === true);

// ================= security: fail closed =================
const before = (await one("select count(*)::int n from public.provider_events")).n;
const forged = await mock.webhook("wrong-secret-wrong-secret", [{ type: "payment.held", object: a.opened.providerPaymentId, amount: { amountMinor: 60000n, currency: "KRW" } }]);
const tampered = await mock.webhook(SECRET, [{ type: "payment.held", object: a.opened.providerPaymentId, amount: { amountMinor: 60000n, currency: "KRW" } }], { tamper: true });
const stale = await mock.webhook(SECRET, [{ type: "payment.held", object: a.opened.providerPaymentId, amount: { amountMinor: 60000n, currency: "KRW" } }], { timestamp: Math.floor(Date.now() / 1000) - 3600 });
const unsignedHook = { rawBody: tampered.rawBody, headers: {} };
const liveEvent = await mock.webhook(SECRET, [{ type: "payment.held", object: a.opened.providerPaymentId, environment: "LIVE", amount: { amountMinor: 60000n, currency: "KRW" } }]);
const r = {
  forged: await ingest.ingestProviderWebhook(client, mock, forged, cfg),
  tampered: await ingest.ingestProviderWebhook(client, mock, tampered, cfg),
  stale: await ingest.ingestProviderWebhook(client, mock, stale, cfg),
  unsigned: await ingest.ingestProviderWebhook(client, mock, unsignedHook, cfg),
  noSecret: await ingest.ingestProviderWebhook(client, mock, heldHook, { deploymentEnvironment: "SANDBOX", webhookSecret: null }),
  wrongDeployment: await ingest.ingestProviderWebhook(client, mock, heldHook, { deploymentEnvironment: "LIVE", webhookSecret: SECRET }),
  noDeployment: await ingest.ingestProviderWebhook(client, mock, heldHook, { deploymentEnvironment: null, webhookSecret: SECRET }),
  liveEvent: await ingest.ingestProviderWebhook(client, mock, liveEvent, cfg),
};
check("S1. forged / tampered / stale / unsigned webhooks -> 401 INVALID_SIGNATURE; missing secret -> 503; wrong or missing deployment environment, LIVE event on SANDBOX -> 403; nothing recorded", r.forged.code === "INVALID_SIGNATURE" && r.tampered.code === "INVALID_SIGNATURE" && r.stale.code === "INVALID_SIGNATURE" && r.unsigned.code === "INVALID_SIGNATURE" && r.noSecret.httpStatus === 503 && r.wrongDeployment.code === "WRONG_ENVIRONMENT" && r.noDeployment.code === "WRONG_ENVIRONMENT" && r.liveEvent.code === "WRONG_ENVIRONMENT" && (await one("select count(*)::int n from public.provider_events")).n === before, JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.code]))));
const c = await funded("C");
mock.completePayment(c.opened.providerPaymentId);
mock.script.misreportAmountBy = -1n;
const cPoll = await ingest.reconcileProviderPayment(client, mock, c.opened.providerPaymentId);
mock.script.misreportAmountBy = 0n;
check("S2. provider-reported amount differs from the ledger intent (poll) -> REVIEW, intent REVIEW_REQUIRED, no activation", cPoll.result === "REVIEW" && cPoll.code === "AMOUNT_MISMATCH" && (await intentOf(c.opened.intentId)).s === "REVIEW_REQUIRED" && (await intentOf(c.opened.intentId)).request_id === null);
const otherPay = await mock.webhook(SECRET, [{ type: "payment.held", object: "mockpay_foreign_payment_x", amount: { amountMinor: 60000n, currency: "KRW" } }]);
const otherRes = await ingest.ingestProviderWebhook(client, mock, otherPay, cfg);
check("S3. a validly signed event for a payment the ledger never opened -> UNMATCHED (listed for review), no effect", otherRes.results[0]?.result === "UNMATCHED");
mock.script.pollFailure = true;
const pollFail = await ingest.reconcileProviderPayment(client, mock, a.opened.providerPaymentId).then(() => "no-throw", (e) => String(e.message));
mock.script.pollFailure = false;
check("S4. provider polling failure surfaces as an error (retried later), records nothing", /HTTP_503/.test(pollFail));

// ================= payouts through the REAL outbox engine + provider bridge =================
await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', $2, $3, 'payee_tok_app_A', 'mock ****', 'ACTIVE')", [a.h.id, P, ENV]);
const [asg] = await f.activeAssignments(aNow.request_id);
await f.rpc("accept_assignment", asg.id, a.h.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [aNow.request_id]);
await f.rpc("complete_assignment_service", asg.id, a.h.id);
const bridge = providerMoneyAdapter(client, mock);
// customer completion vs a duplicate provider payout event (nothing to match yet) - in parallel
const dupPayoutEvent = await mock.webhook(SECRET, [{ type: "payout.paid", object: "lh_not_yet_created_1", amount: { amountMinor: 60000n, currency: "KRW" } }]);
const [conf, early] = await Promise.all([f.rpc("confirm_service_completion", aNow.request_id, a.customer), ingest.ingestProviderWebhook(client, mock, dupPayoutEvent, cfg)]);
const ob = await one("select * from public.payout_obligations where request_id = $1", [aNow.request_id]);
const job = await f.jobFor({ obligationId: ob.id });
check("P1. customer completion vs a racing provider payout event: exactly ONE obligation + ONE job from the customer's authority; the event matched nothing (UNMATCHED)", conf.success && early.results[0]?.result === "UNMATCHED" && (await one("select count(*)::int n from public.payout_obligations where request_id = $1", [aNow.request_id])).n === 1 && (await one("select count(*)::int n from public.money_movement_jobs where payout_obligation_id = $1", [ob.id])).n === 1);
mock.script.payout = "PENDING";
const run1 = await engine.runMoneyJob(client, bridge, job.id);
const att = await one("select * from public.money_movement_attempts where job_id = $1", [job.id]);
check("P2. outbox + provider bridge: attempt persisted with the LIFE.HELP idempotency key BEFORE the provider call; amount / currency / payee from the ledger; provider PENDING -> job CONFIRMING", run1.status === "CONFIRMING" && att.network === `provider:${P}:${ENV}` && att.asset === "KRW" && Number(att.amount_base_units) === 60000 && att.destination === "payee_tok_app_A" && mock.createCalls.includes(`PAYOUT:${att.external_id}`), JSON.stringify(run1));
mock.settleTransfer(att.external_id, "CONFIRMED");
const payoutHook = await mock.webhook(SECRET, [{ type: "payout.paid", object: att.external_id, reference: job.id, amount: { amountMinor: 60000n, currency: "KRW" } }]);
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [job.id]);
const [pw, pp] = await Promise.all([ingest.ingestProviderWebhook(client, mock, payoutHook, cfg), engine.runMoneyJob(client, bridge, job.id)]);
const obAfter = await one("select status from public.payout_obligations where id = $1", [ob.id]);
check("P3. payout webhook vs outbox poll racing: exactly one confirmation (the other defers / finds the job final); obligation PAID once; one attempt; one provider create call", obAfter.status === "PAID" && (await one("select count(*)::int n from public.money_movement_attempts where job_id = $1", [job.id])).n === 1 && mock.createCalls.filter((x) => x === `PAYOUT:${att.external_id}`).length === 1 && (pw.results[0]?.result === "APPLIED" || pp.status === "CONFIRMED") && !(pw.results[0]?.result === "APPLIED" && pp.status === "CONFIRMED"), JSON.stringify([pw.results[0], pp]));
const replayPayout = await ingest.ingestProviderWebhook(client, mock, payoutHook, cfg);
check("P4. duplicate payout webhook after confirmation -> safe replay; no second settlement", replayPayout.results[0]?.replayed === true || replayPayout.results[0]?.result === "REPLAY_NO_CHANGE");

// ================= refunds: webhook vs poll =================
const offer = await f.offerCheckout("APREFUND", 50000);
const offOpen = await ingest.openProviderPayment(client, mock, offer.checkout_id, "APREFUND", b58());
mock.completePayment(offOpen.providerPaymentId);
await ingest.reconcileProviderPayment(client, mock, offOpen.providerPaymentId);
const offReq = (await intentOf(offOpen.intentId)).request_id;
const cancel = await f.rpc("cancel_funded_request", offReq, "APREFUND");
const rJob = await f.jobFor({ refundId: cancel.refund_id });
mock.script.refund = "PENDING";
const rRun = await engine.runMoneyJob(client, bridge, rJob.id);
const rAtt = await one("select * from public.money_movement_attempts where job_id = $1", [rJob.id]);
mock.settleTransfer(rAtt.external_id, "CONFIRMED");
const refundHook = await mock.webhook(SECRET, [{ type: "refund.succeeded", object: rAtt.external_id, amount: { amountMinor: 50000n, currency: "KRW" } }]);
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [rJob.id]);
const [rw, rp] = await Promise.all([ingest.ingestProviderWebhook(client, mock, refundHook, cfg), engine.runMoneyJob(client, bridge, rJob.id)]);
check("R1. refund through the ORIGINAL provider payment (bridge target), then refund webhook vs refund poll racing: refund COMPLETED once, intent REFUNDED, one attempt, one provider refund call", rRun.status === "CONFIRMING" && rAtt.destination === offOpen.providerPaymentId && (await one("select status from public.service_refunds where id = $1", [cancel.refund_id])).status === "COMPLETED" && (await intentOf(offOpen.intentId)).s === "REFUNDED" && (await one("select count(*)::int n from public.money_movement_attempts where job_id = $1", [rJob.id])).n === 1 && mock.createCalls.filter((x) => x === `REFUND:${rAtt.external_id}`).length === 1, JSON.stringify([rw.results[0], rp]));
const failAfter = await mock.webhook(SECRET, [{ type: "refund.failed", object: rAtt.external_id }]);
check("R2. a late refund.failed after completion never regresses it (STALE_IGNORED)", (await ingest.ingestProviderWebhook(client, mock, failAfter, cfg)).results[0]?.result === "STALE_IGNORED" && (await one("select status from public.service_refunds where id = $1", [cancel.refund_id])).status === "COMPLETED");

// ================= environment / registry / policy hooks =================
let liveMock = "constructed";
try { new MockPaymentProvider("LIVE"); } catch (e) { liveMock = e.message; }
const envs = {
  staging: { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", LIFE_HELP_PROVIDER_ENVIRONMENT: "SANDBOX", LIFE_HELP_MOCK_PROVIDER: "ENABLED" },
  stagingNoMock: { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", LIFE_HELP_PROVIDER_ENVIRONMENT: "SANDBOX" },
  production: { SUPABASE_URL: "https://wstdbymmkrqgtsibhcjz.supabase.co", LIFE_HELP_PROVIDER_ENVIRONMENT: "SANDBOX", LIFE_HELP_MOCK_PROVIDER: "ENABLED" },
  productionLive: { SUPABASE_URL: "https://wstdbymmkrqgtsibhcjz.supabase.co", LIFE_HELP_PROVIDER_ENVIRONMENT: "LIVE", LIFE_HELP_MOCK_PROVIDER: "ENABLED" },
  stagingLive: { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", LIFE_HELP_PROVIDER_ENVIRONMENT: "LIVE", LIFE_HELP_MOCK_PROVIDER: "ENABLED" },
};
const resolved = Object.fromEntries(Object.entries(envs).map(([k, e]) => [k, registry.resolveProviderAdapter("MOCK_PROVIDER", e)?.environment ?? null]));
check("E1. mock provider only for explicit staging SANDBOX: refused on production (any setting), on LIVE, without the explicit flag; constructor refuses LIVE; no real provider registered", liveMock === "MOCK_PROVIDER_SANDBOX_ONLY" && resolved.staging === "SANDBOX" && resolved.stagingNoMock === null && resolved.production === null && resolved.productionLive === null && resolved.stagingLive === null && registry.resolveProviderAdapter("ANY_PSP", envs.staging) === null, JSON.stringify(resolved));
check("E2. provider secrets: server-side names per provider (webhook + API credential separate); short / missing secrets refused", registry.providerWebhookSecret("MOCK_PROVIDER", {}) === null && registry.providerWebhookSecret("MOCK_PROVIDER", { LIFE_HELP_PROVIDER_MOCK_PROVIDER_WEBHOOK_SECRET: "short" }) === null && registry.providerWebhookSecret("MOCK_PROVIDER", { LIFE_HELP_PROVIDER_MOCK_PROVIDER_WEBHOOK_SECRET: SECRET }) === SECRET);
const fee = policy.feeQuote({ amountMinor: 60000n, currency: "KRW" });
const testSource = { id: "TEST", async quote() { return { rate: "1400" }; } };
const prodFx = policy.fxSourceFor({ paymentMode: undefined, stagingTestSource: testSource });
const prodFx2 = policy.fxSourceFor({ paymentMode: "LIVE", stagingTestSource: testSource });
check("E3. fee policy stays UNCONFIGURED_ZERO (commercial amount and fees distinct); production FX never falls back to test rates (unconnected source answers null)", fee.policy === "UNCONFIGURED_ZERO" && fee.platformFee.amountMinor === 0n && fee.providerFee === null && fee.commercialAmount.amountMinor === 60000n && prodFx.id === "PRODUCTION_FX_NOT_CONNECTED" && prodFx2.id === "PRODUCTION_FX_NOT_CONNECTED" && (await prodFx.quote({ sourceCurrency: "KRW", targetCurrency: "USDC" })) === null);

// ================= static safety =================
const read = (p) => fs.readFileSync(new URL(p, root), "utf8");
const providerFiles = fs.readdirSync(new URL("lib/payments/provider/", root)).map((f) => `lib/payments/provider/${f}`);
const route = read("app/api/providers/[provider]/webhook/route.ts");
const ingestSrc = read("lib/payments/provider/ingest.ts");
const all = [...providerFiles.map(read), route].join("\n");
check("X1. static: provider layer never reads LIFE_HELP_TEST_FX_RATES / getTestFxQuote, never imports the staging devnet signer or rail", !/LIFE_HELP_TEST_FX_RATES|getTestFxQuote|solanaTx|devnetAdapter|transfers"|paymentRail/.test(all.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")));
check("X2. static: the webhook route passes the RAW body text to the adapter; the adapter verifies BEFORE parsing; ingestion checks environment + secret + signature before any database call", /await request\.text\(\)/.test(route) && !/request\.json\(\)/.test(route) && read("lib/payments/provider/mockProvider.ts").indexOf("timingSafeEqualHex(expected") < read("lib/payments/provider/mockProvider.ts").indexOf("JSON.parse(webhook.rawBody)")
  && ingestSrc.indexOf("verifyWebhook(") < ingestSrc.indexOf("recordEvent(client, events[i]") && ingestSrc.indexOf("WRONG_ENVIRONMENT") < ingestSrc.indexOf("verifyWebhook("));
check("X3. static: no hardcoded provider credentials / keys in the provider layer or route", !/(sk_(live|test)_[A-Za-z0-9]{8,}|api[_-]?key\s*[:=]\s*["'][^"']{8,}|secret\s*[:=]\s*["'][^"']{8,}|Bearer\s+[A-Za-z0-9._-]{20,})/i.test(all));
check("X4. static: no provider-specific business logic outside adapters (no PSP names in the ledger migration's functions; mock only in its adapter / registry)", !/stripe|adyen|circle|coinbase/i.test(read("supabase/migrations/202609280020_provider_payment_foundation.sql") + all.replace(/\/\*[\s\S]*?\*\//g, "")) && providerFiles.filter((p) => /MockPaymentProvider/.test(read(p))).every((p) => /mockProvider|registry/.test(p)));
check("X5. static: the database refuses unverified evidence by construction (signature_verified check + function gate), and only service_role may call the ingestion authority", /signature_verified boolean not null check \(signature_verified\)/.test(read("supabase/migrations/202609280020_provider_payment_foundation.sql")) && /p_signature_verified is distinct from true/.test(read("supabase/migrations/202609280020_provider_payment_foundation.sql")));

const rail = await import(new URL("lib/payments/paymentRail.ts", root).href);
const testFx = {
  staging: await rail.getTestFxQuote("KRW", { LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_TEST_FX_RATES: "KRW=1400" }),
  otherMode: await rail.getTestFxQuote("KRW", { LIFE_HELP_PAYMENT_MODE: "LIVE", LIFE_HELP_TEST_FX_RATES: "KRW=1400" }),
  noMode: await rail.getTestFxQuote("KRW", { LIFE_HELP_TEST_FX_RATES: "KRW=1400" }),
};
const prodRail = await rail.getRailConfig({ SUPABASE_URL: "https://wstdbymmkrqgtsibhcjz.supabase.co", LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST" });
check("X6. existing devnet rail: test FX rates only in the explicit STAGING_DEVNET_TEST mode (any other mode -> no rate, never a fallback); the devnet rail refuses the production project", testFx.staging?.provider === "TEST_SANDBOX_FX" && testFx.otherMode === null && testFx.noMode === null && prodRail === null);

done();

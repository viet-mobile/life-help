// Live STAGING mock-provider E2E for migration 020 (deployed Worker + staging DB). NO real PSP, NO chain, NO money.
//
// Roles: the DEPLOYED WORKER serves checkouts, the signed webhook route (/api/providers/MOCK_PROVIDER/webhook),
// customer completion / cancel, Helper actions, settlement and the operator review queue. This harness plays the
// PROVIDER (deterministic SANDBOX mock: signs webhooks, holds provider-side state) and runs the same provider
// library code (lib/payments/provider/*) for the steps the runtime does not expose yet: opening a provider
// payment session and the provider outbox bridge (payout / refund processing). Both write through the SAME
// database authorities (open_provider_payment_intent / link_provider_payment / ingest_provider_event / money outbox).
//
// Configuration lifecycle (all staging-only): requires MOCK_PROVIDER/SANDBOX + KR policies enabled in the DB by
// the owner beforehand; this run sets three Cloudflare STAGING secrets (provider environment flag, mock flag,
// webhook secret generated in memory - never printed / written) and DELETES them again at the end.
// Usage: node scripts/test_provider_mock_e2e_staging.mjs [--keep-config]   (--keep-config: leave the staging flags + secret for review)
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { base, db, fixtures, readResponse, recorder, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const root = new URL("..", import.meta.url);
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-mock-e2e-"));
fs.writeFileSync(path.join(stubDir, "cf.mjs"), "export async function getCloudflareContext() { return { env: {}, ctx: { waitUntil() {} } }; }");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(path.join(stubDir, "cf.mjs")).href, shortCircuit: true };
    if (specifier.startsWith("@/")) { const file = new URL(specifier.slice(2) + ".ts", root); return nextResolve((fs.existsSync(file) ? file : new URL(specifier.slice(2) + "/index.ts", root)).href, context); }
    return nextResolve(specifier, context);
  },
});
const { MockPaymentProvider } = await import(new URL("lib/payments/provider/mockProvider.ts", root).href);
const ingest = await import(new URL("lib/payments/provider/ingest.ts", root).href);
const { providerMoneyAdapter } = await import(new URL("lib/payments/provider/outboxBridge.ts", root).href);
const engine = await import(new URL("lib/payments/moneyJobs.ts", root).href);

const runId = `PM${Date.now()}`;
const { expect, record, notTestable, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const operator = { Authorization: `Bearer ${settlementToken}` };
const SECRET = crypto.randomBytes(32).toString("hex");
const SECRETS = { LIFE_HELP_PROVIDER_ENVIRONMENT: "SANDBOX", LIFE_HELP_MOCK_PROVIDER: "ENABLED", LIFE_HELP_PROVIDER_MOCK_PROVIDER_WEBHOOK_SECRET: SECRET };
const mock = new MockPaymentProvider("SANDBOX");
const bridge = providerMoneyAdapter(client, mock);
const b58 = () => { const B = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let n = BigInt("0x" + crypto.randomBytes(32).toString("hex")), s = ""; while (n > 0n) { s = B[Number(n % 58n)] + s; n /= 58n; } return s; };
const api = async (pathname, { method = "GET", headers = {}, body } = {}) => { const r = await fetch(`${base}${pathname}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const post = async (hook, provider = "MOCK_PROVIDER") => { const r = await fetch(`${base}/api/providers/${provider}/webhook`, { method: "POST", headers: { "Content-Type": "application/json", ...hook.headers }, body: hook.rawBody }); return { status: r.status, body: await readResponse(r) }; };
const wrangler = (args, input) => spawnSync("npx", ["wrangler", ...args, "--config", "wrangler.staging.jsonc"], { cwd: new URL("..", import.meta.url), input, encoding: "utf8", shell: process.platform === "win32" });
const intentOf = async (id) => (await db(`payment_intents?id=eq.${id}&select=status,request_id,fiat_amount,fiat_currency,amount_base_units,network,quote_id`))[0];
const eventsFor = (object) => db(`provider_events?object_ref=eq.${encodeURIComponent(object)}&select=provider_event_id,processing_result,result_code,source`);
const configured = { secrets: false };

let n = 0;
async function priced(label, basePrice = 60000) {
  const h = await fx.createHelper(label, { service: "clog-clearing" });
  await api("/api/helper/prices", { method: "PUT", headers: h.auth, body: { service_code: "clog-clearing", subitem_code: "toilet-simple", terms: { pricing_mode: "FIXED", currency: "KRW", base_price: basePrice, materials_policy: "INCLUDED" }, publish: true } });
  return { ...h, basePrice };
}
/** Commercial terms chosen through the DEPLOYED checkout API (test fixture), then a mock-provider session via the provider library. */
async function providerPayment(label, { mode = "A", amount = 60000 } = {}) {
  n += 1;
  const device = await fx.customerDevice(`${label}${n}`);
  let checkout;
  let helper = null;
  if (mode === "A") {
    helper = await priced(`${label}${n}`, amount);
    const offers = await api(`/api/pricing/offers?service=clog-clearing&subitem=toilet-simple&country=KR&sido=${encodeURIComponent(fx.sido)}&gungu=G1`);
    const token = offers.body?.offers?.find((o) => Number(o.base_price) === amount)?.offerToken;
    checkout = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: device.cookie }, body: { mode: "HELPER_PRICE_SELECTED", offer_token: token, amount: 1, fiat_amount: 1, currency: "USD", ...fx.requestPayload(undefined, "en", `${label}${n}`), service_slug: "clog-clearing" } });
  } else {
    checkout = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: device.cookie }, body: { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: String(amount), materials_policy: "INCLUDED" }, ...fx.requestPayload(undefined, "en", `${label}${n}`), service_slug: "clog-clearing" } });
  }
  if (checkout.body?.checkoutId) mf.checkouts.add(checkout.body.checkoutId);
  const opened = await ingest.openProviderPayment(client, mock, checkout.body?.checkoutId, device.publicId, b58());
  const intent = opened.ok ? await intentOf(opened.intentId) : null;
  const reference = opened.ok ? (await db(`payment_intents?id=eq.${opened.intentId}&select=reference`))[0].reference : null;
  return { device, helper, checkout, opened, intent, reference, payId: opened.providerPaymentId };
}
const held = (p, extra = {}) => mock.webhook(SECRET, [{ type: "payment.held", object: p.payId, reference: p.reference, amount: { amountMinor: BigInt(p.intent.amount_base_units), currency: "KRW" }, ...extra }]);

try {
  // ================= 0. preconditions (DB enablement by the owner) =================
  const providers = await db("payment_providers?select=code,environment,kind,enabled");
  const policies = await db("payment_capability_policies?select=country,capability,provider,environment,rail,enabled");
  const mockRow = providers.find((p) => p.code === "MOCK_PROVIDER" && p.environment === "SANDBOX");
  const enabledCaps = policies.filter((p) => p.enabled).map((p) => `${p.country}/${p.capability}/${p.provider}/${p.environment}`).sort();
  expect("12a. DB configuration: MOCK_PROVIDER/SANDBOX enabled (kind MOCK); no LIVE row enabled; only KR CUSTOMER_PAYMENT / HELPER_PAYOUT / REFUND enabled for MOCK_PROVIDER/SANDBOX (no REFERRAL_PAYOUT)", mockRow?.enabled === true && mockRow.kind === "MOCK" && !providers.some((p) => p.environment === "LIVE" && p.enabled) && enabledCaps.join() === ["KR/CUSTOMER_PAYMENT/MOCK_PROVIDER/SANDBOX", "KR/HELPER_PAYOUT/MOCK_PROVIDER/SANDBOX", "KR/REFUND/MOCK_PROVIDER/SANDBOX"].join(), { providers, enabledCaps });
  if (mockRow?.enabled !== true) throw new Error("MOCK_PROVIDER/SANDBOX is not enabled in the staging DB (owner SQL required) - stopping before any configuration");

  // ================= 11. Cloudflare staging secrets (flags + webhook secret), never printed =================
  for (const [name, value] of Object.entries(SECRETS)) {
    const r = wrangler(["secret", "put", name], value);
    if (r.status !== 0) throw new Error(`wrangler secret put ${name} failed`);
  }
  configured.secrets = true;
  let ready = null;
  for (let i = 0; i < 30 && !ready; i += 1) { const r = await api("/api/providers/MOCK_PROVIDER/webhook", { method: "POST", body: {} }); if (r.status === 401) ready = r; else await sleep(4000); }
  // A secret rotation rolls out as a new Worker version: until EVERY serving isolate has it, a correctly
  // signed webhook can still hit the previous secret. Require 12 consecutive accepted signed probes
  // (each recorded as immutable UNMATCHED evidence, object tagged with this run id).
  let streak = 0;
  for (let i = 0; i < 90 && streak < 12; i += 1) {
    const probe = await post(await mock.webhook(SECRET, [{ type: "payment.held", object: `mockpay_ready_${runId}_${i}`, amount: { amountMinor: 1000n, currency: "KRW" } }]));
    streak = probe.status === 200 ? streak + 1 : 0;
    if (streak === 0) await sleep(3000);
  }
  record("INFO", `secret rollout: ${streak} consecutive signed probes accepted`);
  if (streak < 12) throw new Error("rotated webhook secret did not reach every serving Worker isolate");
  const listed = wrangler(["secret", "list"]).stdout || "";
  expect("11/12b. staging-only mock configuration live: route now verifies signatures (unsigned -> 401); the three secrets exist only as Cloudflare staging secrets (names listed, values never output); not in the repo / wrangler config", !!ready && ready.body?.code === "INVALID_SIGNATURE" && Object.keys(SECRETS).every((k) => listed.includes(k)) && !listed.includes(SECRET) && !fs.readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8").includes("LIFE_HELP_PROVIDER"), ready?.body);
  const other = await api("/api/providers/OTHER_PSP/webhook", { method: "POST", body: {} });
  expect("12c. only the mock is selectable (any other provider -> 404 UNKNOWN_PROVIDER); no real provider endpoint exists", other.status === 404 && other.body?.code === "UNKNOWN_PROVIDER");

  // ================= 18. mock customer payment E2E =================
  const p1 = await providerPayment("P1");
  const q1 = p1.intent ? (await db(`payment_quotes?id=eq.${p1.intent.quote_id}&select=fx_rate,fx_provider,rounding,decimals,asset`))[0] : null;
  expect("18a. commercial terms from the checkout (spoofed amount / currency in the checkout body ignored): 60,000 KRW -> provider intent 60000 minor units, same currency, no FX (fx_rate 1, NONE_SAME_CURRENCY, EXACT_MINOR_UNIT); provider reference bound once", p1.checkout.status === 201 && p1.checkout.body.fiatAmount === 60000 && p1.opened.ok && p1.intent.network === "provider:MOCK_PROVIDER:SANDBOX" && Number(p1.intent.amount_base_units) === 60000 && p1.intent.fiat_currency === "KRW" && Number(q1?.fx_rate) === 1 && q1.fx_provider === "NONE_SAME_CURRENCY" && q1.rounding === "EXACT_MINOR_UNIT" && (await db(`provider_payment_links?payment_intent_id=eq.${p1.opened.intentId}&select=provider_payment_id`)).length === 1, { checkout: p1.checkout.body, opened: p1.opened, q1 });
  mock.completePayment(p1.payId);
  const w1 = await post(await held(p1));
  const i1 = await intentOf(p1.opened.intentId);
  const r1 = i1?.request_id ? (await db(`service_requests?id=eq.${i1.request_id}&select=id,status,funding_payment_intent_id`))[0] : null;
  if (r1) fx.created.requestIds.add(r1.id);
  expect("18b. signed sandbox webhook through the DEPLOYED route -> provider evidence validated -> existing activation -> PAID_HELD + request MATCHED (funded by this intent)", w1.status === 200 && w1.body.results?.[0]?.result === "APPLIED" && i1.status === "PAID_HELD" && r1?.status === "MATCHED" && r1.funding_payment_intent_id === p1.opened.intentId, { w1: w1.body, i1 });

  // ================= 13. webhook security through the deployed route =================
  const sec = {
    wrongSecret: await post(await mock.webhook(crypto.randomBytes(32).toString("hex"), [{ type: "payment.held", object: p1.payId, amount: { amountMinor: 60000n, currency: "KRW" } }])),
    tampered: await post(await mock.webhook(SECRET, [{ type: "payment.held", object: `mockpay_tamper_${runId}`, amount: { amountMinor: 60000n, currency: "KRW" } }], { tamper: true })),
    stale: await post(await mock.webhook(SECRET, [{ type: "payment.held", object: `mockpay_stale_${runId}`, amount: { amountMinor: 60000n, currency: "KRW" } }], { timestamp: Math.floor(Date.now() / 1000) - 3600 })),
    wrongEnvironment: await post(await mock.webhook(SECRET, [{ type: "payment.held", object: `mockpay_live_${runId}`, environment: "LIVE", amount: { amountMinor: 60000n, currency: "KRW" } }])),
    unknownType: await post(await mock.webhook(SECRET, [{ type: "payment.teleported", object: `mockpay_unknown_${runId}` }])),
    wrongProvider: await post(await mock.webhook(SECRET, [{ type: "payment.held", object: `mockpay_wp_${runId}` }]), "OTHER_PSP"),
  };
  const refusedStored = [...(await eventsFor(`mockpay_tamper_${runId}`)), ...(await eventsFor(`mockpay_stale_${runId}`)), ...(await eventsFor(`mockpay_live_${runId}`)), ...(await eventsFor(`mockpay_unknown_${runId}`)), ...(await eventsFor(`mockpay_wp_${runId}`))];
  const validUnmatched = await post(await mock.webhook(SECRET, [{ type: "payment.held", object: `mockpay_unmatched_${runId}`, amount: { amountMinor: 60000n, currency: "KRW" } }]));
  expect("13. deployed route: valid signature accepted; wrong secret / body tampered after signing / stale timestamp -> 401 before any business mutation (raw body is what is verified); LIVE event on the SANDBOX deployment -> 403; unknown event type -> refused (401, whole delivery); wrong provider -> 404; refused deliveries record nothing",
    sec.wrongSecret.status === 401 && sec.tampered.status === 401 && sec.stale.status === 401 && sec.wrongEnvironment.status === 403 && sec.unknownType.status === 401 && sec.wrongProvider.status === 404 && refusedStored.length === 0 && validUnmatched.status === 200 && validUnmatched.body.results?.[0]?.result === "UNMATCHED" && i1.status === "PAID_HELD",
    Object.fromEntries(Object.entries(sec).map(([k, v]) => [k, `${v.status}/${v.body?.code}`])));

  // ================= 14. same webhook x10, truly parallel HTTP =================
  const p2 = await providerPayment("P2");
  mock.completePayment(p2.payId);
  const hook2 = await held(p2, { id: `evt_x10_${runId}` });
  const ten = await Promise.all(Array.from({ length: 10 }, () => post(hook2)));
  const applied = ten.filter((r) => r.body?.results?.[0]?.result === "APPLIED" && !r.body.results[0].replayed).length;
  const i2 = await intentOf(p2.opened.intentId);
  if (i2?.request_id) fx.created.requestIds.add(i2.request_id);
  expect("14. same signed webhook x10 in parallel (independent HTTP requests): ONE effective ingestion, 9 safe replays; one provider event row; one PAID_HELD; one request", ten.every((r) => r.status === 200) && applied === 1 && ten.filter((r) => r.body?.results?.[0]?.replayed === true).length === 9 && (await db(`provider_events?provider_event_id=eq.evt_x10_${runId}&select=id`)).length === 1 && i2.status === "PAID_HELD" && (await db(`service_requests?funding_payment_intent_id=eq.${p2.opened.intentId}&select=id`)).length === 1, ten.map((r) => r.body?.results?.[0]?.result + (r.body?.results?.[0]?.replayed ? "/replay" : "")));

  // ================= 15a. webhook vs poll =================
  const p3 = await providerPayment("P3");
  mock.completePayment(p3.payId);
  const [wh3, poll3] = await Promise.all([post(await held(p3)), ingest.reconcileProviderPayment(client, mock, p3.payId)]);
  const i3 = await intentOf(p3.opened.intentId);
  if (i3?.request_id) fx.created.requestIds.add(i3.request_id);
  const outcomes3 = [wh3.body?.results?.[0]?.result, poll3?.result];
  expect("15a. webhook (Worker) vs poll (provider API) truly parallel on the same payment: one APPLIED, one REPLAY_NO_CHANGE; one PAID_HELD, one request", outcomes3.filter((x) => x === "APPLIED").length === 1 && outcomes3.includes("REPLAY_NO_CHANGE") && i3.status === "PAID_HELD" && (await db(`service_requests?funding_payment_intent_id=eq.${p3.opened.intentId}&select=id`)).length === 1, outcomes3);

  // ================= 16. out-of-order =================
  const p4 = await providerPayment("P4");
  const f4 = await post(await mock.webhook(SECRET, [{ type: "payment.failed", object: p4.payId, sequence: 1 }]));
  const h4 = await post(await held(p4, { sequence: 2 }));
  const late1 = await post(await mock.webhook(SECRET, [{ type: "payment.failed", object: p1.payId, sequence: 0 }]));
  expect("16a. PAYMENT_FAILED then HELD -> FAILED stays, the hold goes to REVIEW (money for an unpayable intent, never silent activation); HELD then an older FAILED -> STALE_IGNORED, PAID_HELD kept", f4.body.results?.[0]?.result === "APPLIED" && h4.body.results?.[0]?.result === "REVIEW" && /HELD_FOR_UNPAYABLE_INTENT_FAILED/.test(h4.body.results[0].code) && (await intentOf(p4.opened.intentId)).status === "FAILED" && late1.body.results?.[0]?.result === "STALE_IGNORED" && (await intentOf(p1.opened.intentId)).status === "PAID_HELD", [f4.body.results?.[0], h4.body.results?.[0], late1.body.results?.[0]]);

  // ================= 17. mismatches =================
  const p5 = await providerPayment("P5");
  const m5 = await post(await mock.webhook(SECRET, [{ type: "payment.held", object: p5.payId, amount: { amountMinor: 59999n, currency: "KRW" } }]));
  const p6 = await providerPayment("P6");
  const m6 = await post(await mock.webhook(SECRET, [{ type: "payment.held", object: p6.payId, amount: { amountMinor: 60000n, currency: "USD" } }]));
  const p7 = await providerPayment("P7");
  const m7 = await post(await mock.webhook(SECRET, [{ type: "payment.held", object: p7.payId, reference: p1.reference, amount: { amountMinor: 60000n, currency: "KRW" } }]));
  const [i5, i6, i7] = [await intentOf(p5.opened.intentId), await intentOf(p6.opened.intentId), await intentOf(p7.opened.intentId)];
  expect("17. wrong amount -> REVIEW (intent REVIEW_REQUIRED); wrong currency -> REVIEW (REVIEW_REQUIRED); event carrying ANOTHER intent's ledger reference (wrong request / customer binding) -> REVIEW TARGET_MISMATCH, no transition; none activated, no PAID_HELD", m5.body.results?.[0]?.code === "AMOUNT_MISMATCH" && i5.status === "REVIEW_REQUIRED" && m6.body.results?.[0]?.code === "CURRENCY_MISMATCH" && i6.status === "REVIEW_REQUIRED" && m7.body.results?.[0]?.code === "TARGET_MISMATCH" && i7.status === "AWAITING_PAYMENT" && [i5, i6, i7].every((i) => i.request_id === null), [m5.body.results?.[0], m6.body.results?.[0], m7.body.results?.[0]]);
  const reuse = (await client.rpc("link_provider_payment", { p_intent_id: p7.opened.intentId, p_provider_payment_id: p1.payId })).data;
  const p8 = await providerPayment("P8");
  const reuse2 = (await client.rpc("link_provider_payment", { p_intent_id: p8.opened.intentId, p_provider_payment_id: p1.payId })).data;
  expect("7 / 17b. provider reference replay: binding p1's provider payment to another intent -> refused (INTENT_ALREADY_LINKED / PROVIDER_REFERENCE_REUSED)", reuse?.code === "INTENT_ALREADY_LINKED" && reuse2?.code === "INTENT_ALREADY_LINKED", [reuse, reuse2]);

  // ================= 24. review integration (existing 017 queue / detail) =================
  const queue = await api("/api/sys/review/cases", { headers: operator });
  const detail5 = await api(`/api/sys/review/cases/PAYMENT/${p5.opened.intentId}`, { headers: operator });
  const pe = queue.body?.providerEvents ?? [];
  const evidence5 = detail5.body?.case?.facts?.providerEvidence ?? [];
  expect("24. existing 017 review API: mismatched intents are PAYMENT cases; provider evidence needing review listed with provider / environment / event id / provider reference / result code; case detail shows the evidence; no secret anywhere", queue.status === 200 && (queue.body.cases || []).some((c) => c.caseId === p5.opened.intentId) && (queue.body.cases || []).some((c) => c.caseId === p6.opened.intentId) && pe.some((e) => e.object_ref === p7.payId && e.result_code === "TARGET_MISMATCH" && e.provider === "MOCK_PROVIDER" && e.environment === "SANDBOX" && !!e.provider_event_id) && pe.some((e) => e.object_ref === `mockpay_unmatched_${runId}` && e.processing_result === "UNMATCHED") && JSON.stringify(evidence5).includes("AMOUNT_MISMATCH") && !JSON.stringify([queue.body, detail5.body]).includes(SECRET), { queue: queue.status, pe: pe.length, detail: detail5.status });

  // ================= 19 / 20 / 23. customer completion authority + mock Helper payout =================
  const before19 = await post(await mock.webhook(SECRET, [{ type: "payout.paid", object: `lh_invented_${runId}_1`, amount: { amountMinor: 60000n, currency: "KRW" } }]));
  expect("19a. before customer completion: a provider payout confirmation without a legitimate obligation -> UNMATCHED; no obligation exists", before19.body.results?.[0]?.result === "UNMATCHED" && (await db(`payout_obligations?request_id=eq.${r1.id}&select=id`)).length === 0);
  await db("payout_destinations", "POST", { owner_helper_id: p1.helper.helper.id, country: "KR", currency: "KRW", payout_method: "PROVIDER_PAYEE", provider: "MOCK_PROVIDER", provider_environment: "SANDBOX", provider_payee_token: `mockpayee_${runId}`, masked_destination: "mock ****", status: "ACTIVE" });
  const [dest] = await db(`payout_destinations?owner_helper_id=eq.${p1.helper.helper.id}&status=eq.ACTIVE&select=id,destination_kind,provider_payee_token`);
  const tokenMut = await fetch(`${supabaseUrl}/rest/v1/payout_destinations?id=eq.${dest.id}`, { method: "PATCH", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ provider_payee_token: "attacker" }) });
  expect("28. provider payee destination: kind PROVIDER_PAYEE (distinct from BLOCKCHAIN_WALLET / BANK_RECIPIENT_TOKEN), only a provider token + masked text, token immutable after creation", dest.destination_kind === "PROVIDER_PAYEE" && tokenMut.status >= 400 && (await db(`payout_destinations?id=eq.${dest.id}&select=provider_payee_token`))[0].provider_payee_token === `mockpayee_${runId}`);
  const [asg] = await db(`request_assignments?request_id=eq.${r1.id}&status=eq.PENDING&select=id`);
  const steps = [];
  for (const a of ["accept", "start", "complete"]) steps.push((await api(`/api/helper/assignments/${asg.id}/${a}`, { method: "POST", headers: p1.helper.auth })).status);
  const dupPayoutEvidence = await mock.webhook(SECRET, [{ type: "payout.paid", object: `lh_dup_${runId}_1`, amount: { amountMinor: 60000n, currency: "KRW" } }]);
  const [c1, c2, e1] = await Promise.all([api(`/api/requests/${r1.id}/complete`, { method: "POST", headers: { Cookie: p1.device.cookie } }), api(`/api/requests/${r1.id}/complete`, { method: "POST", headers: { Cookie: p1.device.cookie } }), post(dupPayoutEvidence)]);
  await sleep(3000);
  const obs = await db(`payout_obligations?request_id=eq.${r1.id}&select=id,status,payout_rail,gross_amount,platform_fee_amount,fee_policy`);
  const jobs = obs.length ? await db(`money_movement_jobs?payout_obligation_id=eq.${obs[0].id}&select=id,status,rail,last_error_code,attempt_count`) : [];
  expect("19b / 23. Helper completion releases nothing; customer completion x2 (parallel) vs duplicate provider payout evidence: exactly ONE obligation (PROVIDER_PAYEE, 60,000) + ONE job; the evidence matched nothing; the deployed devnet runtime did not touch the provider job (no attempt, not WAITING / failed)", steps.every((s) => s === 200) && [c1, c2].filter((c) => c.status === 200).length >= 1 && e1.body.results?.[0]?.result === "UNMATCHED" && obs.length === 1 && obs[0].payout_rail === "PROVIDER_PAYEE" && Number(obs[0].gross_amount) === 60000 && jobs.length === 1 && jobs[0].attempt_count === 0 && !["FAILED_PERMANENT", "REVIEW_REQUIRED"].includes(jobs[0].status) && jobs[0].last_error_code === null, { c: [c1.status, c2.status], steps, obs, jobs });
  expect("26. fee policy UNCONFIGURED_ZERO: platform fee 0, commercial amount unchanged; no percentage anywhere", obs[0].fee_policy === "UNCONFIGURED_ZERO" && Number(obs[0].platform_fee_amount) === 0);
  mock.script.payout = "PENDING";
  const run1 = await engine.runMoneyJob(client, bridge, jobs[0].id);
  const [att] = await db(`money_movement_attempts?job_id=eq.${jobs[0].id}&select=id,external_id,amount_base_units,asset,destination,network,state`);
  expect("20a. existing obligation -> money job -> provider bridge: attempt persisted with the LIFE.HELP idempotency key before the provider call; amount / currency / payee from the ledger; provider pending -> CONFIRMING", run1.status === "CONFIRMING" && att?.network === "provider:MOCK_PROVIDER:SANDBOX" && Number(att.amount_base_units) === 60000 && att.asset === "KRW" && att.destination === `mockpayee_${runId}`, { run1, att });
  mock.settleTransfer(att.external_id, "CONFIRMED");
  await sleep(16000);
  const confirmA = await mock.webhook(SECRET, [{ type: "payout.paid", object: att.external_id, reference: jobs[0].id, amount: { amountMinor: 60000n, currency: "KRW" } }]);
  const confirmB = await mock.webhook(SECRET, [{ type: "payout.paid", object: att.external_id, amount: { amountMinor: 60000n, currency: "KRW" } }]);
  const [pa, pb, pp] = await Promise.all([post(confirmA), post(confirmB), engine.runMoneyJob(client, bridge, jobs[0].id)]);
  const obAfter = (await db(`payout_obligations?id=eq.${obs[0].id}&select=status`))[0];
  const effects = [pa.body.results?.[0]?.result, pb.body.results?.[0]?.result].filter((x) => x === "APPLIED").length + (pp.status === "CONFIRMED" ? 1 : 0);
  expect("15b / 20b / 23. two payout confirmation webhooks + the outbox poll, truly parallel: exactly ONE confirmation (others DEFERRED / REPLAY / job final); obligation PAID; one attempt; one provider payout call", effects === 1 && obAfter.status === "PAID" && (await db(`money_movement_attempts?job_id=eq.${jobs[0].id}&select=id`)).length === 1 && mock.createCalls.filter((x) => x === `PAYOUT:${att.external_id}`).length === 1, { a: pa.body.results?.[0], b: pb.body.results?.[0], poll: pp });
  const dupConfirm = await post(confirmA);
  const payoutSubmittedLate = await post(await mock.webhook(SECRET, [{ type: "payout.submitted", object: att.external_id }]));
  expect("16b / 20c. duplicate confirmation -> safe replay; SUBMITTED arriving after CONFIRMED -> NOTED (no change); still PAID once", dupConfirm.body.results?.[0]?.replayed === true && payoutSubmittedLate.body.results?.[0]?.result === "NOTED" && (await db(`payout_obligations?request_id=eq.${r1.id}&select=status`)).map((o) => o.status).join() === "PAID");
  const settle = await api(`/api/sys/requests/${r1.id}/status`, { method: "POST", headers: operator, body: { status: "SETTLED" } });
  const [audit] = await db(`admin_audit_logs?entity_id=eq.${r1.id}&action=eq.SERVICE_SETTLED&select=metadata`);
  record("INFO", `leak A evidence - settlement of a mock-provider-funded request: HTTP ${settle.status}, settlement_method=${audit?.metadata?.settlement_method}, external_payment_provider=${audit?.metadata?.external_payment_provider}, external_payment_verified=${audit?.metadata?.external_payment_verified}`);

  // ================= 21. mock refund E2E =================
  const pr = await providerPayment("PR", { mode: "B", amount: 50000 });
  mock.completePayment(pr.payId);
  const hr = await post(await held(pr));
  const ir = await intentOf(pr.opened.intentId);
  if (ir?.request_id) fx.created.requestIds.add(ir.request_id);
  const cancel = await api(`/api/requests/${ir.request_id}/cancel`, { method: "POST", headers: { Cookie: pr.device.cookie } });
  await sleep(3000);
  const [refund] = await db(`service_refunds?payment_intent_id=eq.${pr.opened.intentId}&select=id,status,amount,currency,reason`);
  const [rjob] = refund ? await db(`money_movement_jobs?service_refund_id=eq.${refund.id}&select=id,status,attempt_count,last_error_code`) : [];
  expect("21a. provider-paid customer offer: OPEN_FOR_HELPERS after the signed webhook; customer cancel (deployed route) -> ONE full refund obligation (50,000 KRW) + job; the deployed devnet runtime left the provider refund job alone (no attempt, not FAILED_PERMANENT)", hr.body.results?.[0]?.result === "APPLIED" && cancel.status === 200 && refund?.reason === "CUSTOMER_CANCELLED_UNMATCHED" && Number(refund.amount) === 50000 && rjob && rjob.attempt_count === 0 && !["FAILED_PERMANENT", "REVIEW_REQUIRED"].includes(rjob.status), { cancel: cancel.body, refund, rjob });
  const target = (await client.rpc("provider_transfer_target", { p_job_id: rjob.id, p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX" })).data;
  expect("21b. refund authority derived from the ledger: amount 50000 minor KRW + the ORIGINAL provider payment reference; no browser / operator input", target?.success && target.kind === "REFUND" && target.provider_payment_id === pr.payId && Number(target.amount_minor) === 50000 && target.currency === "KRW", target);
  mock.script.refund = "PENDING";
  const rr = await engine.runMoneyJob(client, bridge, rjob.id);
  const [ratt] = await db(`money_movement_attempts?job_id=eq.${rjob.id}&select=external_id`);
  mock.settleTransfer(ratt.external_id, "CONFIRMED");
  await sleep(16000);
  const [rw, rp] = await Promise.all([post(await mock.webhook(SECRET, [{ type: "refund.succeeded", object: ratt.external_id, amount: { amountMinor: 50000n, currency: "KRW" } }])), engine.runMoneyJob(client, bridge, rjob.id)]);
  const refundAfter = (await db(`service_refunds?id=eq.${refund.id}&select=status`))[0];
  const rEffects = (rw.body.results?.[0]?.result === "APPLIED" ? 1 : 0) + (rp.status === "CONFIRMED" ? 1 : 0);
  const again = await post(await mock.webhook(SECRET, [{ type: "refund.succeeded", object: ratt.external_id, amount: { amountMinor: 50000n, currency: "KRW" } }]));
  expect("15c / 21c / 23. refund webhook vs refund poll, truly parallel: exactly ONE completion; refund COMPLETED, intent REFUNDED; REFUND_CONFIRMED repeated after completion -> REPLAY_NO_CHANGE", rr.status === "CONFIRMING" && rEffects === 1 && refundAfter.status === "COMPLETED" && (await intentOf(pr.opened.intentId)).status === "REFUNDED" && again.body.results?.[0]?.result === "REPLAY_NO_CHANGE" && mock.createCalls.filter((x) => x === `REFUND:${ratt.external_id}`).length === 1, { rw: rw.body.results?.[0], rp, again: again.body.results?.[0] });

  // ================= 22 / 25 / 27. referral, compliance, FX =================
  const migration = fs.readFileSync(new URL("../supabase/migrations/202609270014_marketplace_prepay_usdc_foundation.sql", import.meta.url), "utf8");
  const referralRail = /if p_rail not in \('USDC_SOLANA', 'BANK_PROVIDER'\)/.test(migration);
  notTestable("22. Mock Referral payout", `REFERRAL_PROVIDER_PATH: NOT WIRED - create_referral_payout_obligation accepts only USDC_SOLANA / BANK_PROVIDER (${referralRail ? "confirmed" : "check"}); the referral authority was not weakened; REFERRAL_PAYOUT capability left disabled`);
  const liveElig = (await client.rpc("money_movement_eligibility", { p_capability: "HELPER_PAYOUT", p_country: "KR", p_provider: "MOCK_PROVIDER", p_environment: "LIVE", p_subject_kind: "HELPER_PAYEE", p_subject_ref: "X" })).data;
  const sandboxElig = (await client.rpc("money_movement_eligibility", { p_capability: "HELPER_PAYOUT", p_country: "KR", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_subject_kind: "HELPER_PAYEE", p_subject_ref: "X" })).data;
  expect("25. LIVE money movement refused (no LIVE provider / policy can exist -> CAPABILITY_DISABLED before the compliance hook, which answers COMPLIANCE_POLICY_UNCONFIGURED for any non-SANDBOX environment); SANDBOX mock uses only the explicit capability policy (SANDBOX_NO_COMPLIANCE_REQUIRED)", liveElig?.eligible === false && liveElig.code === "CAPABILITY_DISABLED" && sandboxElig?.eligible === true && sandboxElig.code === "SANDBOX_NO_COMPLIANCE_REQUIRED", { liveElig, sandboxElig });
} catch (error) {
  record("FAIL", "mock provider E2E harness", String(error?.stack || error).slice(0, 800));
} finally {
  // Cloudflare: remove the staging flags + secret (no automatic mock authority remains).
  if (configured.secrets && process.argv.includes("--keep-config")) {
    record("INFO", "31a. --keep-config: the staging flags + rotated webhook secret stay configured (report first; teardown after approval)");
  } else if (configured.secrets) {
    for (const name of Object.keys(SECRETS)) wrangler(["secret", "delete", name], "y\n");
    let off = null;
    for (let i = 0; i < 30 && !off; i += 1) { const r = await api("/api/providers/MOCK_PROVIDER/webhook", { method: "POST", body: {} }); if (r.status === 404) off = r; else await sleep(4000); }
    const listed = wrangler(["secret", "list"]).stdout || "";
    expect("31a. Cloudflare mock configuration removed: route back to 404 UNKNOWN_PROVIDER; no provider secret / flag left", !!off && !Object.keys(SECRETS).some((k) => listed.includes(k)));
  }
  // Fixtures: every checkout of this run is a staging test fixture -> purge (requests, intents, quotes, links, obligations, refunds, jobs).
  for (const row of await db(`service_checkouts?description=like.${runId}*&select=id`).catch(() => [])) mf.checkouts.add(row.id);
  const out = await mf.cleanup();
  const evidence = (await db(`provider_events?or=(object_ref.like.*${runId}*,object_ref.like.mockpay_*)&received_at=gte.${new Date(Date.now() - 3 * 3600e3).toISOString()}&select=id`).catch(() => [])).length;
  record("INFO", `provider evidence retained (immutable, provider=MOCK_PROVIDER environment=SANDBOX): ~${evidence} rows from this run`);
  expect("32. Fixture cleanup: all run checkouts purged (requests, intents, links, obligations, refunds, money jobs); helpers / devices removed", out.purged.every(Boolean) && Object.values(out.leftovers).every((v) => v === 0) && (await db(`service_checkouts?description=like.${runId}*&select=id`)).length === 0, out);
}
if (summary().FAIL > 0) process.exit(1);

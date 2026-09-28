// Deterministic test of migration 202609280020 (provider payment foundation) on the REAL chain in PGlite.
// The app role is exercised explicitly (SET ROLE service_role, BYPASSRLS as on Supabase) where privileges matter.
// PGlite has one connection: "parallel" cases here are sequential interleavings; the Promise.all variants run
// in test_provider_foundation_app.mjs and truly parallel on staging after the migration is applied.
// Usage: node scripts/test_provider_foundation_db.mjs
import crypto from "node:crypto";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one, all, fails } = f;
await f.enablePolicies();
await db.exec("alter role service_role bypassrls");
const named = async (fn, args) => {
  const keys = Object.keys(args);
  return (await one(`select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`, keys.map((k) => args[k]))).r;
};
const asApp = async (sql, params = []) => { await db.exec("set role service_role"); try { return await fails(sql, params); } finally { await db.exec("reset role"); } };
const denied = (e) => /permission denied/i.test(String(e?.message));
const P = "MOCK_PROVIDER", ENV = "SANDBOX", NET = `provider:${P}:${ENV}`;
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
let evn = 0;
const ingest = (o) => named("ingest_provider_event", {
  p_provider: o.provider ?? P, p_environment: o.environment ?? ENV, p_provider_account: "acct", p_provider_event_id: o.id ?? `evt_${++evn}_${crypto.randomUUID().slice(0, 8)}`,
  p_source: o.source ?? "WEBHOOK", p_event_type: o.type, p_provider_event_type: o.rawType ?? o.type.toLowerCase(), p_object_ref: o.object,
  p_life_help_reference: o.reference ?? null, p_amount_minor: o.amount ?? null, p_currency: o.currency ?? null, p_occurred_at: null, p_provider_sequence: o.seq ?? null,
  p_payload_sha256: o.hash ?? sha(`${o.id ?? evn}${o.type}${o.object}${o.amount}${o.currency}`), p_signature_verified: o.verified ?? true,
});
const intentStatus = async (id) => (await one("select status::text s from public.payment_intents where id = $1", [id])).s;

// ================= 1. hardening =================
const peGrants = await one("select has_table_privilege('service_role', 'public.payment_events', 'INSERT') i, has_table_privilege('service_role', 'public.payment_events', 'UPDATE') u, has_table_privilege('service_role', 'public.payment_events', 'DELETE') d, has_table_privilege('service_role', 'public.payment_events', 'SELECT') s");
await db.query("select public.log_payment_event(null, 'TEST_EVENT', '{}'::jsonb)");
const peOwnerUpd = await fails("update public.payment_events set event_type = 'X' where event_type = 'TEST_EVENT'");
const peOwnerDel = await fails("delete from public.payment_events where event_type = 'TEST_EVENT'");
const peTrunc = await fails("truncate public.payment_events");
check("1a. payment_events: app role SELECT only; even the owner cannot update / delete (outside the fixture purge) / truncate; ledger logging still works", peGrants.s && !peGrants.i && !peGrants.u && !peGrants.d && /never modified/.test(peOwnerUpd?.message) && /never deleted/.test(peOwnerDel?.message) && !!peTrunc, JSON.stringify(peGrants));
const h0 = await f.helper("DEST");
const destIns = await one("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_payee_token, masked_destination, status) values ($1, 'KR', 'USDC', 'USDC_SOLANA', 'SOLANA_DIRECT_DEVNET', $2, 'xxxx', 'ACTIVE') returning id, destination_kind", [h0.id, b58()]);
const destDel = await asApp("delete from public.payout_destinations where id = $1", [destIns.id]);
const destTok = await fails("update public.payout_destinations set provider_payee_token = 'attacker' where id = $1", [destIns.id]);
await db.query("update public.payout_destinations set status = 'REVOKED', revoked_at = now() where id = $1", [destIns.id]);
const destRevive = await fails("update public.payout_destinations set status = 'ACTIVE' where id = $1", [destIns.id]);
check("1b. payout_destinations: app role cannot DELETE; payee token / method / owner immutable; REVOKED is terminal; the existing insert path derives destination_kind (BLOCKCHAIN_WALLET)", destIns.destination_kind === "BLOCKCHAIN_WALLET" && denied(destDel) && /immutable/.test(destTok?.message) && /stays revoked/.test(destRevive?.message));
const payeeNoProvider = await fails("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', 'payee_x', 'x', 'ACTIVE')", [h0.id]);
check("1c. PROVIDER_PAYEE destinations require provider + provider environment (a wallet is not a universal payout identity)", !!payeeNoProvider);

// ================= 2. registry + capability policies (deny by default) =================
const regDefaults = await all("select code, environment, enabled from public.payment_providers order by code");
const liveEnable = await fails("insert into public.payment_providers (code, environment, kind, enabled) values ('SOME_PSP', 'LIVE', 'PSP', true)");
const mockLive = await fails("insert into public.payment_providers (code, environment, kind) values ('MOCK_TWO', 'LIVE', 'MOCK')");
check("2a. registry deny-by-default: every provider disabled; a LIVE provider cannot be enabled; a MOCK provider can never be LIVE", regDefaults.every((r) => !r.enabled) && /live_disabled/.test(liveEnable?.message) && /mock_sandbox_only/.test(mockLive?.message), JSON.stringify(regDefaults));
check("2b. app role cannot change the registry or the policies", denied(await asApp("update public.payment_providers set enabled = true")) && denied(await asApp("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled) values ('KR', 'CUSTOMER_PAYMENT', 'MOCK_PROVIDER', 'SANDBOX', 'CARD', true)")));
const eligBefore = await named("money_movement_eligibility", { p_capability: "CUSTOMER_PAYMENT", p_country: "KR", p_provider: P, p_environment: ENV, p_subject_kind: "CUSTOMER", p_subject_ref: "C1" });
await db.query("insert into public.payment_providers (code, environment, kind) values ('SOME_PSP', 'LIVE', 'PSP')");
const livePolicy = await fails("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', 'CUSTOMER_PAYMENT', 'SOME_PSP', 'LIVE', 'CARD', true, 'x', now())");
await db.query("update public.payment_providers set enabled = true, approved_by = 'test', approved_at = now() where code = $1 and environment = $2", [P, ENV]);
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT", "REFUND"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, $2, $3, 'MOCK_RAIL', true, 'test', now())", [cap, P, ENV]);
const eligAfter = await named("money_movement_eligibility", { p_capability: "CUSTOMER_PAYMENT", p_country: "KR", p_provider: P, p_environment: ENV, p_subject_kind: "CUSTOMER", p_subject_ref: "C1" });
const eligOther = [
  await named("money_movement_eligibility", { p_capability: "REFERRAL_PAYOUT", p_country: "KR", p_provider: P, p_environment: ENV, p_subject_kind: "REFERRAL_RECIPIENT", p_subject_ref: "R1" }),
  await named("money_movement_eligibility", { p_capability: "CUSTOMER_PAYMENT", p_country: "JP", p_provider: P, p_environment: ENV, p_subject_kind: "CUSTOMER", p_subject_ref: "C1" }),
  await named("money_movement_eligibility", { p_capability: "CUSTOMER_PAYMENT", p_country: "KR", p_provider: "SOME_PSP", p_environment: "LIVE", p_subject_kind: "CUSTOMER", p_subject_ref: "C1" }),
];
check("2c. capabilities are independent per country x capability x provider x environment: disabled until explicitly enabled; LIVE policy cannot be enabled; enabling CUSTOMER_PAYMENT enables nothing else", eligBefore.code === "CAPABILITY_DISABLED" && /live_disabled/.test(livePolicy?.message) && eligAfter.eligible === true && eligOther.every((e) => e.eligible === false && e.code === "CAPABILITY_DISABLED"), JSON.stringify([eligBefore, eligAfter, eligOther]));

// ================= 3. provider-hosted payment intent + provider references =================
let n = 0;
async function providerCheckout(label, { amount = 60000 } = {}) {
  n += 1;
  const sido = `PV${label}${n}`;
  const h = await f.helper(`PV${label}${n}`, { sido });
  const price = await f.rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: amount, materials_policy: "INCLUDED" }), true);
  const customer = `C${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const co = await f.helperCheckout(price, customer, sido);
  const opened = await named("open_provider_payment_intent", { p_checkout_id: co.checkout_id, p_customer_id: customer, p_provider: P, p_environment: ENV, p_provider_account: "mock-account-1", p_reference: b58(), p_ttl_seconds: 900 });
  return { h, customer, co, opened, payId: `mockpay_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}` };
}
const a = await providerCheckout("A");
const aIntent = await one("select * from public.payment_intents where id = $1", [a.opened.intent_id]);
const aQuote = await one("select * from public.payment_quotes where id = $1", [aIntent.quote_id]);
check("3a. provider intent: amount / currency from the checkout (60,000 KRW = 60000 minor units, exponent 0), no FX, provider network, no chain fields", a.opened.success && aIntent.network === NET && aIntent.provider === P && aIntent.asset === "KRW" && aIntent.mint === "" && Number(aIntent.amount_base_units) === 60000 && Number(aIntent.fiat_amount) === 60000 && aQuote.fx_rate == 1 && aQuote.rounding === "EXACT_MINOR_UNIT" && aQuote.decimals === 0, JSON.stringify(a.opened));
const link1 = await named("link_provider_payment", { p_intent_id: a.opened.intent_id, p_provider_payment_id: a.payId });
const link1again = await named("link_provider_payment", { p_intent_id: a.opened.intent_id, p_provider_payment_id: a.payId });
const linkOther = await named("link_provider_payment", { p_intent_id: a.opened.intent_id, p_provider_payment_id: "mockpay_other_0001" });
const b = await providerCheckout("B");
const reuse = await named("link_provider_payment", { p_intent_id: b.opened.intent_id, p_provider_payment_id: a.payId });
check("3b. provider payment reference bound once: replay OK; a second id for the intent refused; the same provider reference for ANOTHER intent refused (PROVIDER_REFERENCE_REUSED)", link1.success && link1again.replayed === true && linkOther.code === "INTENT_ALREADY_LINKED" && reuse.code === "PROVIDER_REFERENCE_REUSED");
await named("link_provider_payment", { p_intent_id: b.opened.intent_id, p_provider_payment_id: b.payId });
const chainQuoteForged = await fails("insert into public.payment_quotes (checkout_id, source_currency, source_amount, asset, network, mint, decimals, asset_amount_base_units, fx_rate, fx_provider, rounding, expires_at) values ($1, 'KRW', 60000, 'USDC', $2, '', 0, 60000, 1, 'X', 'EXACT_MINOR_UNIT', now() + interval '1 hour')", [a.co.checkout_id, NET]);
check("3c. rail shape enforced: a provider quote cannot claim USDC; chain quotes keep the pinned native mint", !!chainQuoteForged);

// ================= 4. ingestion: gates, idempotency, hold, security =================
const unsigned = await ingest({ type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW", verified: false });
const unknownP = await ingest({ provider: "NOPE_PSP", type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW" });
const liveEnv = await ingest({ environment: "LIVE", type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW" });
const liveKnown = await ingest({ provider: "SOME_PSP", environment: "LIVE", type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW" });
const stored0 = (await one("select count(*)::int n from public.provider_events")).n;
check("4a. fail closed BEFORE recording: unsigned (SIGNATURE_NOT_VERIFIED), unknown provider, an environment that is not enabled (LIVE) - nothing stored, intent untouched", unsigned.code === "SIGNATURE_NOT_VERIFIED" && unknownP.code === "UNKNOWN_PROVIDER" && liveEnv.code === "PROVIDER_ENVIRONMENT_NOT_ENABLED" && liveKnown.code === "PROVIDER_ENVIRONMENT_NOT_ENABLED" && stored0 === 0 && (await intentStatus(a.opened.intent_id)) === "AWAITING_PAYMENT");
const held = await ingest({ id: "evt_hold_A", type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW", reference: aIntent.reference, hash: sha("hold-A") });
const aAfter = await one("select status::text s, verified_signature, request_id from public.payment_intents where id = $1", [a.opened.intent_id]);
const aReq = aAfter.request_id ? await one("select status, funding_payment_intent_id from public.service_requests where id = $1", [aAfter.request_id]) : null;
check("4b. PAYMENT_HELD (verified provider evidence) -> PAID_HELD + request activated atomically by the existing authority (activate_funded_checkout); evidence = provider reference, not a chain signature", held.result === "APPLIED" && aAfter.s === "PAID_HELD" && aAfter.verified_signature === `provider:${P}:${a.payId}` && aReq?.status === "MATCHED" && aReq.funding_payment_intent_id === a.opened.intent_id, JSON.stringify(held));
const dup = await ingest({ id: "evt_hold_A", type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW", reference: aIntent.reference, hash: sha("hold-A") });
const reused = await ingest({ id: "evt_hold_A", type: "PAYMENT_HELD", object: b.payId, amount: 60000, currency: "KRW", hash: sha("different") });
check("4c. duplicate webhook -> safe replay (stored result, no second effect); same event id with different content -> EVENT_ID_REUSED", dup.replayed === true && dup.result === "APPLIED" && reused.code === "EVENT_ID_REUSED" && (await one("select count(*)::int n from public.service_requests where funding_payment_intent_id = $1", [a.opened.intent_id])).n === 1 && (await intentStatus(b.opened.intent_id)) === "AWAITING_PAYMENT");
const secondHold = await ingest({ id: "evt_hold_A_poll", source: "POLL", type: "PAYMENT_HELD", object: a.payId, amount: 60000, currency: "KRW" });
const lateFail = await ingest({ type: "PAYMENT_FAILED", object: a.payId, seq: 1 });
check("4d. out-of-order / cross-channel: a poll of the same hold -> REPLAY_NO_CHANGE; an older PAYMENT_FAILED arriving after the hold -> STALE_IGNORED, never regresses PAID_HELD", secondHold.result === "REPLAY_NO_CHANGE" && lateFail.result === "STALE_IGNORED" && (await intentStatus(a.opened.intent_id)) === "PAID_HELD");
const mism = await ingest({ type: "PAYMENT_HELD", object: b.payId, amount: 59999, currency: "KRW" });
check("4e. amount mismatch -> REVIEW, intent REVIEW_REQUIRED (existing 017 PAYMENT case), no activation", mism.result === "REVIEW" && mism.code === "AMOUNT_MISMATCH" && (await intentStatus(b.opened.intent_id)) === "REVIEW_REQUIRED" && (await one("select request_id from public.payment_intents where id = $1", [b.opened.intent_id])).request_id === null);
const c = await providerCheckout("C");
await named("link_provider_payment", { p_intent_id: c.opened.intent_id, p_provider_payment_id: c.payId });
const cur = await ingest({ type: "PAYMENT_HELD", object: c.payId, amount: 60000, currency: "USD" });
const d = await providerCheckout("D");
await named("link_provider_payment", { p_intent_id: d.opened.intent_id, p_provider_payment_id: d.payId });
const target = await ingest({ type: "PAYMENT_HELD", object: d.payId, amount: 60000, currency: "KRW", reference: b58() });
const unknownPay = await ingest({ type: "PAYMENT_HELD", object: "mockpay_never_linked_01", amount: 60000, currency: "KRW" });
check("4f. currency mismatch -> REVIEW (CURRENCY_MISMATCH); event for another request / customer (ledger reference differs) -> REVIEW, no transition; unknown provider payment -> UNMATCHED", cur.code === "CURRENCY_MISMATCH" && (await intentStatus(c.opened.intent_id)) === "REVIEW_REQUIRED" && target.result === "REVIEW" && target.code === "TARGET_MISMATCH" && (await intentStatus(d.opened.intent_id)) === "AWAITING_PAYMENT" && unknownPay.result === "UNMATCHED");
const failD = await ingest({ type: "PAYMENT_FAILED", object: d.payId });
const heldAfterFail = await ingest({ type: "PAYMENT_HELD", object: d.payId, amount: 60000, currency: "KRW" });
check("4g. a hold arriving for a FAILED intent never silently activates it -> REVIEW (money held for an unpayable intent)", failD.result === "APPLIED" && (await intentStatus(d.opened.intent_id)) === "FAILED" && heldAfterFail.result === "REVIEW" && /HELD_FOR_UNPAYABLE_INTENT/.test(heldAfterFail.code));

// ================= 5. evidence immutability =================
const evRow = await one("select id from public.provider_events where provider_event_id = 'evt_hold_A'");
check("5. provider_events immutable: app role cannot UPDATE / DELETE / INSERT; owner cannot rewrite a processed row, delete or truncate", denied(await asApp("update public.provider_events set processing_result = 'X' where id = $1", [evRow.id])) && denied(await asApp("delete from public.provider_events where id = $1", [evRow.id])) && denied(await asApp("insert into public.provider_events (provider, environment, provider_event_id, source, event_type, provider_event_type, object_ref, payload_sha256, signature_verified) values ('MOCK_PROVIDER','SANDBOX','evt_forged_1','WEBHOOK','PAYMENT_HELD','x','mockpay_x', repeat('a', 64), true)"))
  && /immutable/.test((await fails("update public.provider_events set processing_result = 'X' where id = $1", [evRow.id]))?.message) && !!(await fails("delete from public.provider_events where id = $1", [evRow.id])) && !!(await fails("truncate public.provider_events")));

// ================= 6. payouts: customer completion authority + provider evidence through the outbox =================
await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', $2, $3, 'payee_tok_A', 'mock ****', 'ACTIVE')", [a.h.id, P, ENV]);
const noOblYet = (await one("select count(*)::int n from public.payout_obligations where request_id = $1", [aAfter.request_id])).n;
const inventPayout = await ingest({ type: "PAYOUT_CONFIRMED", object: "lh_invented_payout_0001", amount: 60000, currency: "KRW" });
check("6a. a payout webhook can never invent an obligation: before customer completion none exists; an unknown payout event -> UNMATCHED, still none", noOblYet === 0 && inventPayout.result === "UNMATCHED" && (await one("select count(*)::int n from public.payout_obligations where request_id = $1", [aAfter.request_id])).n === 0);
const [asg] = await f.activeAssignments(aAfter.request_id);
await f.rpc("accept_assignment", asg.id, a.h.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [aAfter.request_id]);
await f.rpc("complete_assignment_service", asg.id, a.h.id);
const helperOnly = (await one("select count(*)::int n from public.payout_obligations where request_id = $1", [aAfter.request_id])).n;
const conf = await f.rpc("confirm_service_completion", aAfter.request_id, a.customer);
const conf2 = await f.rpc("confirm_service_completion", aAfter.request_id, a.customer);
const ob = await one("select * from public.payout_obligations where request_id = $1", [aAfter.request_id]);
const job = await f.jobFor({ obligationId: ob.id });
check("6b. Helper completion releases nothing; customer completion -> exactly ONE payout obligation (PROVIDER_PAYEE rail, 60,000 KRW) + ONE job; replay creates nothing", helperOnly === 0 && conf.success && conf2.replayed === true && ob.payout_rail === "PROVIDER_PAYEE" && Number(ob.gross_amount) === 60000 && job?.obligation_type === "HELPER_PAYOUT" && (await one("select count(*)::int n from public.money_movement_jobs where payout_obligation_id = $1", [ob.id])).n === 1);
const tgt = await named("provider_transfer_target", { p_job_id: job.id, p_provider: P, p_environment: ENV });
const tgtLive = await named("provider_transfer_target", { p_job_id: job.id, p_provider: P, p_environment: "LIVE" });
check("6c. provider payout target derived from the ledger: payee token of the Helper's ACTIVE provider destination, 60000 minor units KRW; other environment -> no destination", tgt.success && tgt.payee_token === "payee_tok_A" && Number(tgt.amount_minor) === 60000 && tgt.currency === "KRW" && tgt.reference === job.id && tgtLive.code === "PAYOUT_DESTINATION_MISSING", JSON.stringify(tgt));
const claim = await f.rpc("claim_money_job", job.id, 60);
const extId = `lh_${job.id.replace(/-/g, "")}_1`;
const prep = await f.rpc("prepare_money_attempt", job.id, claim.job.lease_token, P, NET, "KRW", 60000, "payee_tok_A", extId, JSON.stringify({ kind: "HELPER_PAYOUT", reference: job.id }), "{}");
const deferred = await ingest({ type: "PAYOUT_CONFIRMED", object: extId, amount: 60000, currency: "KRW" });
check("6d. webhook vs poller: while the poller holds the job lease the webhook defers (DEFERRED_TO_RECONCILE) - one authority, no second effect", prep.success && deferred.result === "DEFERRED_TO_RECONCILE" && ob.status !== "PAID" && (await one("select status from public.payout_obligations where id = $1", [ob.id])).status !== "PAID");
await db.query("update public.money_movement_jobs set claim_expires_at = now() - interval '1 second' where id = $1", [job.id]); // poller died mid-flight (attempt still PREPARED)
const confirmed = await ingest({ type: "PAYOUT_CONFIRMED", object: extId, amount: 60000, currency: "KRW", reference: job.id });
const obAfter = await one("select status, chain_network, chain_signature from public.payout_obligations where id = $1", [ob.id]);
check("6e. PAYOUT_CONFIRMED arriving before any SUBMITTED (attempt still PREPARED) -> applied through record_money_attempt_result: attempt CONFIRMED, obligation PAID, job CONFIRMED", confirmed.result === "APPLIED" && confirmed.code === "CONFIRMED" && obAfter.status === "PAID" && obAfter.chain_signature === extId && (await one("select status from public.money_movement_jobs where id = $1", [job.id])).status === "CONFIRMED", JSON.stringify(confirmed));
const replayConfirm = await ingest({ type: "PAYOUT_CONFIRMED", object: extId, amount: 60000, currency: "KRW" });
const lateFailPayout = await ingest({ type: "PAYOUT_FAILED", object: extId });
const lateSubmitted = await ingest({ type: "PAYOUT_SUBMITTED", object: extId });
check("6f. confirmed payout is final: replayed confirmation -> REPLAY_NO_CHANGE; later FAILED -> STALE_IGNORED; late SUBMITTED -> NOTED; still exactly one obligation, PAID", replayConfirm.result === "REPLAY_NO_CHANGE" && lateFailPayout.result === "STALE_IGNORED" && lateSubmitted.result === "NOTED" && (await one("select status from public.payout_obligations where id = $1", [ob.id])).status === "PAID" && (await one("select count(*)::int n from public.payout_obligations where request_id = $1", [aAfter.request_id])).n === 1);
const wrongEnvEvent = await ingest({ environment: "SANDBOX", provider: P, type: "PAYOUT_CONFIRMED", object: extId.replace(/_1$/, "_9"), amount: 60000, currency: "KRW" });
check("6g. provider transfer ids are scoped by provider + environment: an unknown / other-environment transfer id never matches (UNMATCHED)", wrongEnvEvent.result === "UNMATCHED");

// ================= 7. amount mismatch on a payout -> 017 review; refunds through the original provider payment =================
const e = await providerCheckout("E", { amount: 70000 });
await named("link_provider_payment", { p_intent_id: e.opened.intent_id, p_provider_payment_id: e.payId });
await ingest({ type: "PAYMENT_HELD", object: e.payId, amount: 70000, currency: "KRW" });
const eReq = (await one("select request_id from public.payment_intents where id = $1", [e.opened.intent_id])).request_id;
await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', $2, $3, 'payee_tok_E', 'mock ****', 'ACTIVE')", [e.h.id, P, ENV]);
const [asgE] = await f.activeAssignments(eReq);
await f.rpc("accept_assignment", asgE.id, e.h.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [eReq]);
await f.rpc("complete_assignment_service", asgE.id, e.h.id);
await f.rpc("confirm_service_completion", eReq, e.customer);
const obE = await one("select id from public.payout_obligations where request_id = $1", [eReq]);
const jobE = await f.jobFor({ obligationId: obE.id });
const clE = await f.rpc("claim_money_job", jobE.id, 60);
const extE = `lh_${jobE.id.replace(/-/g, "")}_1`;
await f.rpc("prepare_money_attempt", jobE.id, clE.job.lease_token, P, NET, "KRW", 70000, "payee_tok_E", extE, JSON.stringify({ kind: "HELPER_PAYOUT", reference: jobE.id }), "{}");
await db.query("update public.money_movement_jobs set claim_expires_at = now() - interval '1 second' where id = $1", [jobE.id]);
const mismPayout = await ingest({ type: "PAYOUT_CONFIRMED", object: extE, amount: 7000, currency: "KRW" });
const rules = await f.rpc("review_case_actions", "MONEY_JOB", jobE.id);
check("7a. provider-reported payout amount differs from the attempt -> REVIEW: job REVIEW_REQUIRED (PROVIDER_AMOUNT_MISMATCH), obligation NOT paid, case actionable in the existing 017 review", mismPayout.result === "REVIEW" && (await one("select status, last_error_code from public.money_movement_jobs where id = $1", [jobE.id])).last_error_code === "PROVIDER_AMOUNT_MISMATCH" && (await one("select status from public.payout_obligations where id = $1", [obE.id])).status !== "PAID" && Array.isArray(rules?.actions) && rules.actions.length > 0, JSON.stringify(rules));
// refund: customer offer paid through the provider, cancelled while unmatched -> full refund obligation
const offer = await f.offerCheckout("OFFREFND", 50000);
const offOpen = await named("open_provider_payment_intent", { p_checkout_id: offer.checkout_id, p_customer_id: "OFFREFND", p_provider: P, p_environment: ENV, p_provider_account: "mock-account-1", p_reference: b58(), p_ttl_seconds: 900 });
const offPay = "mockpay_offer_refund_01";
await named("link_provider_payment", { p_intent_id: offOpen.intent_id, p_provider_payment_id: offPay });
const offHeld = await ingest({ type: "PAYMENT_HELD", object: offPay, amount: 50000, currency: "KRW" });
const offReq = (await one("select request_id from public.payment_intents where id = $1", [offOpen.intent_id])).request_id;
const cancel = await f.rpc("cancel_funded_request", offReq, "OFFREFND");
const rJob = await f.jobFor({ refundId: cancel.refund_id });
const rTgt = await named("provider_transfer_target", { p_job_id: rJob.id, p_provider: P, p_environment: ENV });
check("7b. refund authority: the refund obligation (existing ledger row) decides amount + currency; the provider target is the ORIGINAL provider payment (no wallet payer address, nothing from a browser)", offHeld.result === "APPLIED" && cancel.success && rTgt.success && rTgt.kind === "REFUND" && rTgt.provider_payment_id === offPay && Number(rTgt.amount_minor) === 50000 && rTgt.currency === "KRW" && rTgt.payee_token === null, JSON.stringify(rTgt));
const rCl = await f.rpc("claim_money_job", rJob.id, 60);
const rExt = `lh_${rJob.id.replace(/-/g, "")}_1`;
await f.rpc("prepare_money_attempt", rJob.id, rCl.job.lease_token, P, NET, "KRW", 50000, offPay, rExt, JSON.stringify({ kind: "REFUND", reference: rJob.id }), "{}");
await db.query("update public.money_movement_jobs set claim_expires_at = now() - interval '1 second' where id = $1", [rJob.id]);
const wrongKind = await ingest({ type: "PAYOUT_CONFIRMED", object: rExt, amount: 50000, currency: "KRW" });
const rConf = await ingest({ type: "REFUND_CONFIRMED", object: rExt, amount: 50000, currency: "KRW" });
const rConf2 = await ingest({ type: "REFUND_CONFIRMED", object: rExt, amount: 50000, currency: "KRW" });
const refundRow = await one("select status from public.service_refunds where id = $1", [cancel.refund_id]);
check("7c. refund evidence: a PAYOUT event for a refund transfer -> REVIEW (kind mismatch); REFUND_CONFIRMED -> refund COMPLETED, intent REFUNDED; replay -> no second effect", wrongKind.code === "OBJECT_KIND_MISMATCH" && rConf.result === "APPLIED" && refundRow.status === "COMPLETED" && (await intentStatus(offOpen.intent_id)) === "REFUNDED" && rConf2.result === "REPLAY_NO_CHANGE", JSON.stringify([wrongKind, rConf, refundRow]));

// ================= 8. fixture purge still works with provider links (evidence stays) =================
const evBefore = (await one("select count(*)::int n from public.provider_events")).n;
const purge = await f.rpc("purge_payment_fixture", b.co.checkout_id);
check("8. purge_payment_fixture (staging test fixtures) also removes provider payment links; provider evidence is kept", purge.success && purge.purged === true && (await one("select count(*)::int n from public.provider_payment_links where payment_intent_id = $1", [b.opened.intent_id])).n === 0 && (await one("select count(*)::int n from public.provider_events")).n === evBefore, JSON.stringify(purge));

done();

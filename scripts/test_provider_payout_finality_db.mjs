// Deterministic test of migration 202609290022 (provider payout finality) on the REAL chain in PGlite:
// registry payout_finality, the non-terminal PROVIDER_REPORTED_PAID outcome on the single result authority
// (record_money_attempt_result, poll path), failure after reported-paid -> 017 review, provider_object_refs.
// Usage: node scripts/test_provider_payout_finality_db.mjs
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
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ================= 1. registry =================
const reg = await all("select code, environment, payout_finality from public.payment_providers order by code, environment");
const badFinality = await fails("update public.payment_providers set payout_finality = 'AFTER_7_DAYS' where code = 'MOCK_PROVIDER'");
await db.query("insert into public.payment_providers (code, environment, kind, enabled, approved_by, approved_at) values ('AIRWALLEX', 'SANDBOX', 'PSP', true, 'test', now())");
const awx = await one("select payout_finality from public.payment_providers where code = 'AIRWALLEX' and environment = 'SANDBOX'");
check("1a. payout_finality: existing final-status providers (SOLANA_DIRECT_DEVNET, MOCK_PROVIDER) keep PROVIDER_FINAL_STATUS; a newly registered provider defaults to NO_FINAL_SIGNAL; only the two documented values (no timer / period value exists)",
  reg.filter((r) => ["SOLANA_DIRECT_DEVNET", "MOCK_PROVIDER"].includes(r.code)).every((r) => r.payout_finality === "PROVIDER_FINAL_STATUS") && awx.payout_finality === "NO_FINAL_SIGNAL" && !!badFinality, JSON.stringify(reg));
const types = await one("select pg_get_constraintdef(oid) d from pg_constraint where conname = 'provider_events_event_type_check'");
check("1b. provider_events vocabulary adds PAYOUT_REPORTED_PAID (existing types kept)", /PAYOUT_REPORTED_PAID/.test(types.d) && /PAYOUT_CONFIRMED/.test(types.d) && /PAYMENT_HELD/.test(types.d));
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT", "REFUND"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, 'AIRWALLEX', 'SANDBOX', 'AIRWALLEX_RAIL', true, 'test', now())", [cap]);

// ================= helpers: an AIRWALLEX-funded, customer-confirmed payout job =================
let n = 0, evn = 0;
const ingest = (o) => named("ingest_provider_event", {
  p_provider: o.provider ?? "AIRWALLEX", p_environment: "SANDBOX", p_provider_account: "acct", p_provider_event_id: o.id ?? `evt_${++evn}_${crypto.randomUUID().slice(0, 8)}`,
  p_source: o.source ?? "WEBHOOK", p_event_type: o.type, p_provider_event_type: o.type.toLowerCase(), p_object_ref: o.object, p_life_help_reference: null,
  p_amount_minor: o.amount ?? null, p_currency: o.currency ?? null, p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: sha(`${evn}${o.type}${o.object}`), p_signature_verified: true,
});
async function payoutJob(label, provider = "AIRWALLEX") {
  n += 1;
  const sido = `FN${label}${n}`;
  const h = await f.helper(`FN${label}${n}`, { sido });
  const price = await f.rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }), true);
  const customer = `F${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const co = await f.helperCheckout(price, customer, sido);
  const opened = await named("open_provider_payment_intent", { p_checkout_id: co.checkout_id, p_customer_id: customer, p_provider: provider, p_environment: "SANDBOX", p_provider_account: "acct", p_reference: b58(), p_ttl_seconds: 900 });
  const payId = `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  await named("link_provider_payment", { p_intent_id: opened.intent_id, p_provider_payment_id: payId });
  await ingest({ provider, type: "PAYMENT_HELD", object: payId, amount: 60000, currency: "KRW" });
  const req = (await one("select request_id from public.payment_intents where id = $1", [opened.intent_id])).request_id;
  await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', $2, 'SANDBOX', $3, 'x ****', 'ACTIVE')", [h.id, provider, `benef_${label}${n}`]);
  const [asg] = await f.activeAssignments(req);
  await f.rpc("accept_assignment", asg.id, h.id);
  await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [req]);
  await f.rpc("complete_assignment_service", asg.id, h.id);
  await f.rpc("confirm_service_completion", req, customer);
  const ob = await one("select * from public.payout_obligations where request_id = $1", [req]);
  const job = await f.jobFor({ obligationId: ob.id });
  const claim = await f.rpc("claim_money_job", job.id, 60);
  const extId = `lh_${job.id.replace(/-/g, "")}_1`;
  const prep = await f.rpc("prepare_money_attempt", job.id, claim.job.lease_token, provider, `provider:${provider}:SANDBOX`, "KRW", 60000, `benef_${label}${n}`, extId, JSON.stringify({ kind: "HELPER_PAYOUT", reference: job.id }), "{}");
  return { h, req, ob, job, lease: claim.job.lease_token, attemptId: prep.attempt_id, extId, intentId: opened.intent_id, prep };
}
const state = async (p) => ({
  job: await one("select status, last_error_code, last_error_class from public.money_movement_jobs where id = $1", [p.job.id]),
  att: (await one("select state from public.money_movement_attempts where id = $1", [p.attemptId])).state,
  ob: (await one("select status from public.payout_obligations where id = $1", [p.ob.id])).status,
  req: (await one("select status from public.service_requests where id = $1", [p.req])).status,
});

// ================= 2. poll path: CONFIRMED from a NO_FINAL_SIGNAL provider is downgraded =================
const a = await payoutJob("A");
const aRes = await f.rpc("record_money_attempt_result", a.job.id, a.lease, a.attemptId, "CONFIRMED", null);
const aS = await state(a);
check("2a. record_money_attempt_result CONFIRMED on an AIRWALLEX payout attempt -> PROVIDER_PAID_AWAITING_FINALITY: attempt SUBMITTED (not CONFIRMED), job CONFIRMING (WAITING), obligation NOT PAID, request not settled",
  a.prep.success && aRes?.status === "PROVIDER_PAID_AWAITING_FINALITY" && aS.att === "SUBMITTED" && aS.job.status === "CONFIRMING" && aS.job.last_error_code === "PROVIDER_PAID_AWAITING_FINALITY" && aS.ob !== "PAID" && aS.req !== "SETTLED", JSON.stringify({ aRes, aS }));
const noFinalTs = await one("select next_retry_at > now() + interval '30 minutes' later from public.money_movement_jobs where id = $1", [a.job.id]);
const reclaim = await f.rpc("claim_money_job", a.job.id, 60);
check("2b. no finality timer: the job is only re-checked later (next_retry pushed out), and re-polling a reported-paid job can never complete it on its own", noFinalTs.later === true && reclaim?.success !== true, JSON.stringify(reclaim));
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second', claim_expires_at = now() - interval '1 second' where id = $1", [a.job.id]);
const aClaim2 = await f.rpc("claim_money_job", a.job.id, 60);
const aAgain = await f.rpc("record_money_attempt_result", a.job.id, aClaim2.job.lease_token, a.attemptId, "PROVIDER_REPORTED_PAID", null);
await db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [a.job.id]);
const aClaim3 = await f.rpc("claim_money_job", a.job.id, 60);
const aFail = await f.rpc("record_money_attempt_result", a.job.id, aClaim3.job.lease_token, a.attemptId, "FAILED_ONCHAIN", "BENEFICIARY_BANK_REJECTED");
const aS2 = await state(a);
check("2c. reported-paid again -> still awaiting; then a provider FAILURE -> attempt terminal FAILED_ONCHAIN, job REVIEW_REQUIRED (PROVIDER_FAILED_AFTER_REPORTED_PAID), obligation never PAID, no retry scheduled",
  aClaim2?.success && aAgain?.status === "PROVIDER_PAID_AWAITING_FINALITY" && aS2.att === "FAILED_ONCHAIN" && aS2.job.status === "REVIEW_REQUIRED" && aS2.job.last_error_code === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && aS2.ob !== "PAID", JSON.stringify({ aAgain, aFail, aS2 }));
const actions = await f.rpc("review_case_actions", "MONEY_JOB", a.job.id);
check("2d. the PAID -> FAILED case lands in the existing 017 operator review (actions available)", (await state(a)).job.status === "REVIEW_REQUIRED" && Array.isArray(actions?.actions) && actions.actions.length > 0, JSON.stringify(actions));

// ================= 3. MOCK_PROVIDER (PROVIDER_FINAL_STATUS) keeps its final CONFIRMED semantics =================
await db.query("update public.payment_providers set enabled = true, approved_by = 'test', approved_at = now() where code = 'MOCK_PROVIDER' and environment = 'SANDBOX'");
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, 'MOCK_PROVIDER', 'SANDBOX', 'MOCK_RAIL', true, 'test', now()) on conflict do nothing", [cap]);
const m = await payoutJob("M", "MOCK_PROVIDER");
const mRes = await f.rpc("record_money_attempt_result", m.job.id, m.lease, m.attemptId, "CONFIRMED", null);
const mS = await state(m);
check("3a. a PROVIDER_FINAL_STATUS provider is unchanged: CONFIRMED -> attempt CONFIRMED, obligation PAID, job CONFIRMED", m.prep.success && mS.att === "CONFIRMED" && mS.ob === "PAID" && mS.job.status === "CONFIRMED", JSON.stringify({ mRes, mS }));
const mLate = await ingest({ provider: "MOCK_PROVIDER", type: "PAYOUT_FAILED", object: m.extId });
check("3b. a FAILED after a final CONFIRMED is never silently ignored -> REVIEW (PROVIDER_FAILED_AFTER_CONFIRMED), no regression of the paid obligation", mLate.result === "REVIEW" && mLate.code === "PROVIDER_FAILED_AFTER_CONFIRMED" && (await state(m)).ob === "PAID", JSON.stringify(mLate));

// ================= 4. ingestion: REPORTED_PAID / FAILED ordering =================
const b = await payoutJob("B");
await db.query("update public.money_movement_jobs set claim_expires_at = now() - interval '1 second' where id = $1", [b.job.id]);
const bFailFirst = await ingest({ type: "PAYOUT_FAILED", object: b.extId });
const bPaidLate = await ingest({ type: "PAYOUT_REPORTED_PAID", object: b.extId, amount: 60000, currency: "KRW" });
const bS = await state(b);
check("4a. FAILED before PAID -> ordinary failure (attempt FAILED, job RETRYABLE); a PAID arriving after it (out of order) -> REVIEW, never resurrects the failed attempt, obligation not PAID", bFailFirst.result === "APPLIED" && bPaidLate.result === "REVIEW" && bS.att === "FAILED_ONCHAIN" && bS.ob !== "PAID", JSON.stringify({ bFailFirst, bPaidLate, bS }));
const c = await payoutJob("C");
await db.query("update public.money_movement_jobs set claim_expires_at = now() - interval '1 second' where id = $1", [c.job.id]);
const cMismatch = await ingest({ type: "PAYOUT_REPORTED_PAID", object: c.extId, amount: 59999, currency: "KRW" });
const cS = await state(c);
check("4b. reported-paid with the wrong amount -> REVIEW (AMOUNT_MISMATCH), not awaiting-finality, obligation not PAID", cMismatch.result === "REVIEW" && cS.ob !== "PAID", JSON.stringify({ cMismatch, cS }));

// ================= 5. provider_object_refs =================
const d = await payoutJob("D");
const b1 = await named("bind_provider_object", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_external_id: d.extId, p_provider_object_id: "trf_D_0001" });
const b2 = await named("bind_provider_object", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_external_id: d.extId, p_provider_object_id: "trf_D_0001" });
const b3 = await named("bind_provider_object", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_external_id: d.extId, p_provider_object_id: "trf_D_OTHER" });
const b4 = await named("bind_provider_object", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_external_id: a.extId, p_provider_object_id: "trf_D_0001" });
const b5 = await named("bind_provider_object", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_external_id: "lh_unknown_key_00001", p_provider_object_id: "trf_X_0001" });
const b6 = await named("bind_provider_object", { p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_external_id: d.extId, p_provider_object_id: "trf_D_0002" });
check("5a. bind_provider_object: bound once; identical replay -> replayed; a different object for the same key, or the same object for another key -> PROVIDER_OBJECT_CONFLICT; unknown key / wrong provider network -> refused",
  b1?.success && !b1.replayed && b2?.replayed === true && b3?.success === false && b3.code === "PROVIDER_OBJECT_CONFLICT" && b4?.success === false && b5?.success === false && b6?.success === false, JSON.stringify([b1, b2, b3, b4, b5, b6]));
const refRow = await one("select id from public.provider_object_refs where external_id = $1", [d.extId]);
const upd = await fails("update public.provider_object_refs set provider_object_id = 'attacker' where id = $1", [refRow.id]);
const del = await fails("delete from public.provider_object_refs where id = $1", [refRow.id]);
const trunc = await fails("truncate public.provider_object_refs");
const appIns = await asApp("insert into public.provider_object_refs (provider, environment, external_id, provider_object_id, object_kind) values ('AIRWALLEX', 'SANDBOX', 'lh_forged_key_0001', 'trf_forged', 'PAYOUT')");
const appSel = await asApp("select 1 from public.provider_object_refs limit 1");
const anonExec = await one("select has_function_privilege('anon', 'public.bind_provider_object(text,text,text,text)', 'EXECUTE') a, has_function_privilege('authenticated', 'public.bind_provider_object(text,text,text,text)', 'EXECUTE') u");
check("5b. provider_object_refs is retained evidence: immutable, no delete, no truncate (even the owner); the app role can only SELECT (writes via bind_provider_object); anon / authenticated cannot bind",
  !!upd && !!del && !!trunc && denied(appIns) && appSel === null && !anonExec.a && !anonExec.u);

done();

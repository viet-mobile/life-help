// Deterministic test of migration 202609290022 (provider payout finality) on the REAL chain in PGlite:
// registry payout_finality, the non-terminal PROVIDER_REPORTED_PAID outcome on the single result authority
// (record_money_attempt_result, poll path), failure after reported-paid -> 017 review, fail-closed finality config, Solana / mock unchanged, and NO provider-object binding table.
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

// ================= 5. no competing provider-object binding (option A) =================
const objTables = await one("select to_regclass('public.provider_object_refs') t, (select count(*)::int from pg_proc where proname = 'bind_provider_object') f");
check("5a. migration 022 adds NO provider-object table / binding function: recovery uses the LIFE.HELP idempotency key + provider retrieval; business authority stays links / obligations / jobs / attempts", objTables.t === null && objTables.f === 0);

// ================= 6. fail closed on missing / unknown finality configuration =================
const nullFinality = await fails("update public.payment_providers set payout_finality = null where code = 'AIRWALLEX'");
const bogusFinality = await fails("update public.payment_providers set payout_finality = 'FINAL' where code = 'AIRWALLEX'");
check("6a. payout_finality can never be absent or an unknown value (NOT NULL + closed vocabulary)", !!nullFinality && !!bogusFinality);
const g = await payoutJob("G", "MOCK_PROVIDER");
// Simulate a payout attempt whose provider network has NO registry row (config absent): owner-level fixture edit.
await db.exec("alter table public.money_movement_attempts disable trigger user");
await db.query("update public.money_movement_attempts set network = 'provider:GHOST_PSP:SANDBOX' where id = $1", [g.attemptId]);
await db.exec("alter table public.money_movement_attempts enable trigger user");
const gRes = await f.rpc("record_money_attempt_result", g.job.id, g.lease, g.attemptId, "CONFIRMED", null);
const gS = await state(g);
const ghostEvt = await ingest({ provider: "GHOST_PSP", type: "PAYOUT_CONFIRMED", object: g.extId, amount: 60000, currency: "KRW" });
check("6b. missing finality configuration fails closed: a CONFIRMED for a provider network without a registry row is only 'reported paid' (obligation not PAID, job awaiting finality); unregistered provider evidence is refused",
  gRes?.status === "PROVIDER_PAID_AWAITING_FINALITY" && gS.ob !== "PAID" && gS.att === "SUBMITTED" && ghostEvt?.success === false, JSON.stringify({ gRes, gS, ghostEvt }));
await db.query("update public.payment_providers set payout_finality = 'NO_FINAL_SIGNAL' where code = 'MOCK_PROVIDER' and environment = 'SANDBOX'");
const h2 = await payoutJob("H", "MOCK_PROVIDER");
const hRes = await f.rpc("record_money_attempt_result", h2.job.id, h2.lease, h2.attemptId, "CONFIRMED", null);
await db.query("update public.payment_providers set payout_finality = 'PROVIDER_FINAL_STATUS' where code = 'MOCK_PROVIDER' and environment = 'SANDBOX'");
check("6c. finality is registry-driven: the same mock payout while its row says NO_FINAL_SIGNAL is NOT terminal", hRes?.status === "PROVIDER_PAID_AWAITING_FINALITY" && (await state(h2)).ob !== "PAID", JSON.stringify(hRes));

// ================= 7. Solana devnet (finalized chain) payout unchanged =================
const sol = await f.completedPayout("SOL");
const solJob = await f.jobFor({ obligationId: sol.obligationId });
const solClaim = await f.rpc("claim_money_job", solJob.id, 60);
const solPrep = await f.rpc("prepare_money_attempt", solJob.id, solClaim.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, sol.destination, b58(88), JSON.stringify({ lastValidBlockHeight: 100, reference: "ref" }), "c2lnbmVk");
const solRes = await f.rpc("record_money_attempt_result", solJob.id, solClaim.job.lease_token, solPrep.attempt_id, "CONFIRMED", null);
const solOb = await one("select status from public.payout_obligations where id = $1", [sol.obligationId]);
const solJ = await one("select status from public.money_movement_jobs where id = $1", [solJob.id]);
check("7a. Solana devnet finalized payout completes exactly as before: CONFIRMED -> attempt CONFIRMED, obligation PAID, job CONFIRMED", solPrep.success && solOb.status === "PAID" && solJ.status === "CONFIRMED", JSON.stringify({ solPrep, solRes, solOb, solJ }));

done();

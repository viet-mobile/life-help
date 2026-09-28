// Compact live regression of the money outbox against the DEPLOYED staging Worker + migration 015.
// Creates NO new immutable financial history: Referral behaviour is verified on the retained
// TEST_FIXTURE_* Referral sets; everything else uses purgeable test_fixture checkouts. No chain
// transaction is sent (FIXTURE external ids / payloads only). Must not run concurrently with another
// suite that calls the cleanup / reconcile routes.
// Usage: node scripts/test_outbox_regression_staging.mjs
import fs from "node:fs";
import { base, db, env, fixtures, readResponse, recorder, rpc, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, fixtureSignature, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `OX${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const readAs = async (pathname, headers) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { headers }); return { status: r.status, body: await readResponse(r) }; };
const PAYLOAD = `FIXTURE-NOT-A-SIGNED-TRANSACTION-${runId}`;
const job = async (id) => (await db(`money_movement_jobs?id=eq.${id}&select=*`))[0];
const queueSweep = async (n = 3) => {
  const picked = [];
  for (let i = 0; i < n; i += 1) {
    const r = (await rpc("claim_money_job", { p_job_id: null, p_lease_seconds: 15 })).data;
    picked.push(r?.job?.job_id ?? null);
    if (r?.job) await call("release_money_job", { p_job_id: r.job.job_id, p_lease: r.job.lease_token, p_class: "WAITING", p_code: "REGRESSION_SWEEP", p_delay_seconds: 15 });
  }
  return picked;
};

try {
  // ================= one job per obligation =================
  const payout = await mf.payoutObligation("PAY");
  const refund1 = await mf.refundObligation("R1");
  const refund2 = await mf.refundObligation("R2");
  const [pj] = await mf.jobFor({ obligationId: payout.obligationId });
  const [r1j] = await mf.jobFor({ refundId: refund1.refundId });
  const [r2j] = await mf.jobFor({ refundId: refund2.refundId });
  const confAgain = await call("confirm_service_completion", { p_request_id: payout.requestId, p_customer_id: payout.customer });
  const cancelAgain = await call("cancel_funded_request", { p_request_id: refund1.requestId, p_customer_id: refund1.customer });
  expect("1. Helper payout obligation -> exactly one job; duplicate '서비스 완료' -> no duplicate job", payout.steps.every((s) => s === 200) && pj?.status === "PENDING" && confAgain?.replayed === true && (await mf.jobFor({ obligationId: payout.obligationId })).length === 1, payout.steps);
  expect("2. refund obligations -> exactly one job each; duplicate cancel -> no duplicate job", r1j?.obligation_type === "REFUND" && r2j?.obligation_type === "REFUND" && cancelAgain?.replayed === true && (await mf.jobFor({ refundId: refund1.refundId })).length === 1);

  // ================= retained Referral fixtures (immutable history) =================
  const kept = await db("money_movement_jobs?obligation_type=eq.REFERRAL_PAYOUT&last_error_code=like.TEST_FIXTURE_*&select=*");
  const keptDetail = [];
  for (const k of kept) {
    const [ob] = await db(`payout_obligations?id=eq.${k.payout_obligation_id}&select=status,referral_reward_id`);
    const [reward] = await db(`referral_rewards?id=eq.${ob.referral_reward_id}&select=id,state`);
    const replay = await call("create_referral_payout_obligation", { p_reward_id: reward.id, p_rail: "USDC_SOLANA", p_country: "KR" });
    const claim = await call("claim_money_job", { p_job_id: k.id, p_lease_seconds: 15 });
    const after = await job(k.id);
    keptDetail.push({ job: k.id, code: k.last_error_code, status: after.status, lease: after.lease_token, jobs: (await mf.jobFor({ obligationId: k.payout_obligation_id })).length, replayed: replay?.replayed === true && replay.payout_obligation_id === k.payout_obligation_id, claim: claim?.code, obligation: ob.status, reward: reward.state, attempts: (await mf.attemptsOf(k.id)).length });
  }
  record("INFO", `Retained Referral fixture sets: ${JSON.stringify(keptDetail)}`);
  expect("3. Referral obligation -> exactly one job; duplicate creation on the retained sets replays (same obligation, still one job; >= 2 retained sets, immutable history grows)", kept.length >= 2 && keptDetail.every((d) => d.jobs === 1 && d.replayed), keptDetail);
  expect("3b. retained Referral sets stay isolated: REVIEW_REQUIRED, no lease, not claimable (JOB_FINAL), reward never PAID", keptDetail.every((d) => d.status === "REVIEW_REQUIRED" && d.lease === null && d.claim === "JOB_FINAL" && d.reward !== "PAID" && d.obligation !== "PAID"), keptDetail);

  // ================= concurrent claim races (parallel HTTP) =================
  const race2 = await Promise.all([rpc("claim_money_job", { p_job_id: r1j.id, p_lease_seconds: 60 }), rpc("claim_money_job", { p_job_id: r1j.id, p_lease_seconds: 60 })]);
  const race10 = await Promise.all(Array.from({ length: 10 }, () => rpc("claim_money_job", { p_job_id: r2j.id, p_lease_seconds: 60 })));
  const w2 = race2.filter((r) => r.data?.success), w10 = race10.filter((r) => r.data?.success);
  expect("4. claim race: 2 parallel workers -> 1 winner; 10 parallel workers -> 1 winner; lease stored once; no attempt rows", w2.length === 1 && w10.length === 1 && (await job(r1j.id)).lease_token === w2[0].data.job.lease_token && (await job(r2j.id)).lease_token === w10[0].data.job.lease_token && (await mf.attemptsOf(r1j.id)).length === 0 && (await mf.attemptsOf(r2j.id)).length === 0, [race2.map((r) => r.data?.code ?? "WIN"), race10.map((r) => r.data?.code ?? "WIN")]);

  // ================= lease recovery + stale token =================
  const A = await call("claim_money_job", { p_job_id: pj.id, p_lease_seconds: 15 });
  const steal = await call("claim_money_job", { p_job_id: pj.id, p_lease_seconds: 15 });
  await sleep(16500);
  const B = await call("claim_money_job", { p_job_id: pj.id, p_lease_seconds: 60 });
  const staleRelease = await call("release_money_job", { p_job_id: pj.id, p_lease: A.job.lease_token, p_class: "REVIEW", p_code: "STALE", p_delay_seconds: null });
  const stalePrepare = await call("prepare_money_attempt", { p_job_id: pj.id, p_lease: A.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 1, p_destination: "FIXTURE-DESTINATION", p_external_id: fixtureSignature(), p_adapter_payload: { fixture: true }, p_signed_payload: PAYLOAD });
  expect("5. lease recovery: steal refused before expiry (LEASE_HELD); reclaim after expiry (recovered_lease)", A?.success && steal?.code === "LEASE_HELD" && B?.success && B.job.recovered_lease === true, { steal: steal?.code, B: B?.code });
  expect("6. stale worker token blocked (release + prepare -> LEASE_LOST; no attempt)", staleRelease?.code === "LEASE_LOST" && stalePrepare?.code === "LEASE_LOST" && (await mf.attemptsOf(pj.id)).length === 0);

  // ================= retry scheduling =================
  const rel = await call("release_money_job", { p_job_id: r1j.id, p_lease: w2[0].data.job.lease_token, p_class: "RETRYABLE", p_code: "RPC_TIMEOUT", p_delay_seconds: null });
  const r1after = await job(r1j.id);
  expect("7. retryable failure schedules next_retry_at (+15 s, failure_count 1); not reclaimable before due (NOT_DUE)", rel?.status === "RETRYABLE" && rel.next_retry_in_seconds === 15 && r1after.failure_count === 1 && new Date(r1after.next_retry_at) > new Date() && (await call("claim_money_job", { p_job_id: r1j.id, p_lease_seconds: 15 }))?.code === "NOT_DUE");

  // ================= REVIEW_REQUIRED re-sweep =================
  const toReview = await call("release_money_job", { p_job_id: pj.id, p_lease: B.job.lease_token, p_class: "PERMANENT", p_code: "REGRESSION_REVIEW", p_delay_seconds: null });
  const beforeSweep = await job(pj.id);
  const picked = await queueSweep(3);
  const targeted = await call("claim_money_job", { p_job_id: pj.id, p_lease_seconds: 15 });
  const afterSweep = await job(pj.id);
  expect("8. REVIEW_REQUIRED job: queue sweeps never pick it, targeted claim JOB_FINAL, no attempt, no lease, no state regression", toReview?.status === "REVIEW_REQUIRED" && !picked.includes(pj.id) && targeted?.code === "JOB_FINAL" && afterSweep.status === "REVIEW_REQUIRED" && afterSweep.lease_token === null && afterSweep.updated_at === beforeSweep.updated_at && (await mf.attemptsOf(pj.id)).length === 0, { picked, targeted: targeted?.code });

  // ================= no external confirmation -> no PAID / REFUNDED; signed bytes =================
  const forced = await call("record_payout_result", { p_obligation_id: payout.obligationId, p_provider: "SOLANA_DIRECT_DEVNET", p_provider_payout_id: pj.id, p_success: true });
  expect("9. no PAID without a confirmed external result (direct result refused; obligation CREATED; payment RELEASE_AUTHORIZED)", forced?.success === false && (await db(`payout_obligations?id=eq.${payout.obligationId}&select=status`))[0].status === "CREATED" && (await db(`payment_intents?id=eq.${payout.intentId}&select=status`))[0].status === "RELEASE_AUTHORIZED");
  const L2 = w10[0].data.job.lease_token;
  const attSig = fixtureSignature();
  const att = await call("prepare_money_attempt", { p_job_id: r2j.id, p_lease: L2, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 50000000, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: attSig, p_adapter_payload: { fixture: true }, p_signed_payload: PAYLOAD });
  await call("mark_money_attempt_submitted", { p_job_id: r2j.id, p_lease: L2, p_attempt_id: att.attempt_id });
  const pend = await call("record_money_attempt_result", { p_job_id: r2j.id, p_lease: L2, p_attempt_id: att.attempt_id, p_outcome: "PENDING", p_code: null });
  expect("10. SUBMITTED / CONFIRMING refund is not REFUNDED (refund SUBMITTED, payment REFUND_PENDING)", pend?.status === "CONFIRMING" && (await db(`service_refunds?id=eq.${refund2.refundId}&select=status`))[0].status === "SUBMITTED" && (await db(`payment_intents?id=eq.${refund2.intentId}&select=status`))[0].status === "REFUND_PENDING");
  // Signed bytes exist right now (live attempt): check every read path while they do.
  const reads = {
    anon: await readAs(`money_movement_attempts?job_id=eq.${r2j.id}&select=signed_payload`, hdr(anonKey)),
    helper: await readAs(`money_movement_attempts?job_id=eq.${r2j.id}&select=signed_payload`, hdr(anonKey, payout.helper.token)),
  };
  const helperApi = await fetch(`${base}/api/helper/payouts`, { headers: payout.helper.auth });
  const helperApiText = await helperApi.text();
  const reconcile = await fetch(`${base}/api/sys/payments/reconcile`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}` } });
  const reconcileText = await reconcile.text();
  const svcSees = (await db(`money_movement_attempts?id=eq.${att.attempt_id}&select=signed_payload`))[0]?.signed_payload === PAYLOAD;
  const recentAudit = await db("admin_audit_logs?select=metadata&order=created_at.desc&limit=200");
  const intentEvents = await db(`payment_events?payment_intent_id=eq.${refund2.intentId}&select=payload`);
  const auditHits = recentAudit.filter((r) => JSON.stringify(r.metadata ?? {}).includes(PAYLOAD)).length;
  const eventHits = intentEvents.filter((r) => JSON.stringify(r.payload ?? {}).includes(PAYLOAD)).length;
  const assetsDir = new URL("../.open-next/assets/", import.meta.url);
  const assetHit = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir, { recursive: true }).some((f) => /\.(js|html|json)$/.test(String(f)) && /signed_payload|signedPayload/.test(fs.readFileSync(new URL(String(f).split("\\").join("/"), assetsDir), "utf8")));
  expect("11. signed bytes (live attempt) exposed nowhere: anon + Helper DB reads denied; Helper payout API, operator reconcile API, audit logs, payment events and browser assets carry none (service_role only)",
    svcSees && denied(reads.anon) && (denied(reads.helper) || (Array.isArray(reads.helper.body) && reads.helper.body.length === 0)) && helperApi.status === 200 && !helperApiText.includes(PAYLOAD) && !/signed_payload/.test(helperApiText)
    && reconcile.status === 200 && !reconcileText.includes(PAYLOAD) && !/signed_payload/.test(reconcileText) && auditHits === 0 && eventHits === 0 && !assetHit,
    { anon: reads.anon.status, helper: reads.helper.status, helperApi: helperApi.status, reconcile: reconcile.status, auditHits, eventHits, assetHit });
  await sleep(16000);
  const c2 = await call("claim_money_job", { p_job_id: r2j.id, p_lease_seconds: 60 });
  const done = c2?.success ? await call("record_money_attempt_result", { p_job_id: r2j.id, p_lease: c2.job.lease_token, p_attempt_id: att.attempt_id, p_outcome: "FAILED_ONCHAIN", p_code: "FIXTURE" }) : null;
  const finalAtt = (await mf.attemptsOf(r2j.id))[0];
  expect("12. terminal attempt: raw signed bytes cleared; public external id + history kept; refund not COMPLETED", done?.status === "RETRYABLE" && finalAtt.state === "FAILED_ONCHAIN" && finalAtt.signed_payload === null && finalAtt.external_id === attSig && (await db(`service_refunds?id=eq.${refund2.refundId}&select=status`))[0].status !== "COMPLETED", { done, state: finalAtt?.state });
} catch (error) {
  record("FAIL", "outbox regression harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (purgeable fixtures only: checkouts, obligations, refunds, jobs, attempts; helpers, users, requests)", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

// Live STAGING outbox retry limits on the REAL backoff schedule (no chain, no clock tricks): ~35 min.
//   refund job:  8 retryable failures (15, 30, 60, ... s backoff) -> REVIEW_REQUIRED; NOT_DUE before each due time
//   payout job:  3 terminal FIXTURE attempts (60 s, 120 s backoff) -> REVIEW_REQUIRED (MAX_ATTEMPTS)
// Business ledger never moves to PAID / REFUNDED. Fixtures are purged afterwards.
// Must not overlap a deployed outbox run touching these fixtures (run before deploying / outside cron).
// Usage: node scripts/test_outbox_retry_limits_staging.mjs
import { db, fixtures, recorder, sleep } from "./lib/stagingPushHarness.mjs";
import { call, fixtureSignature, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `OR${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const jobRow = async (id) => (await db(`money_movement_jobs?id=eq.${id}&select=*`))[0];
async function claimWhenDue(jobId) {
  const row = await jobRow(jobId);
  const wait = new Date(row.next_retry_at).getTime() - Date.now();
  const early = wait > 1500 ? await call("claim_money_job", { p_job_id: jobId, p_lease_seconds: 60 }) : null;
  if (wait > 0) await sleep(wait + 1500);
  return { early, claim: await call("claim_money_job", { p_job_id: jobId, p_lease_seconds: 60 }) };
}

async function refundLimit() {
  const refund = await mf.refundObligation("LIMIT");
  const [job] = await mf.jobFor({ refundId: refund.refundId });
  const delays = [], earlyRefused = [];
  let last = null;
  for (let n = 1; n <= 8; n += 1) {
    const { early, claim } = n === 1 ? { early: null, claim: await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 60 }) } : await claimWhenDue(job.id);
    if (early) earlyRefused.push(early.code);
    if (!claim?.success) { record("FAIL", `refund retry ${n}: claim`, JSON.stringify(claim)); return; }
    last = await call("release_money_job", { p_job_id: job.id, p_lease: claim.job.lease_token, p_class: "RETRYABLE", p_code: n % 2 ? "RPC_TIMEOUT" : "RPC_HTTP_503", p_delay_seconds: null });
    if (last?.next_retry_in_seconds) delays.push(last.next_retry_in_seconds);
    record("INFO", `refund retry ${n}: ${last?.status} ${last?.next_retry_in_seconds ?? ""}`);
  }
  const final = await jobRow(job.id);
  expect("R1. refund: exponential backoff 15 / 30 / 60 / 120 / 240 / 480 / 960 s on the live schedule", delays.join() === "15,30,60,120,240,480,960", delays);
  expect("R2. refund: never reclaimed before its due time (NOT_DUE every time)", earlyRefused.length === 7 && earlyRefused.every((c) => c === "NOT_DUE"), earlyRefused);
  expect("R3. refund: 8th retryable failure -> REVIEW_REQUIRED (failure_count 8), no longer claimable", last?.status === "REVIEW_REQUIRED" && final.status === "REVIEW_REQUIRED" && final.failure_count === 8 && (await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 }))?.code === "JOB_FINAL");
  expect("R4. refund: no fake REFUNDED, one refund row, no attempt", (await db(`service_refunds?id=eq.${refund.refundId}&select=status`))[0].status === "PENDING" && (await db(`payment_intents?id=eq.${refund.intentId}&select=status`))[0].status === "REFUND_PENDING" && (await db(`service_refunds?payment_intent_id=eq.${refund.intentId}&select=id`)).length === 1 && (await mf.attemptsOf(job.id)).length === 0);
}

async function payoutAttempts() {
  const payout = await mf.payoutObligation("ATT");
  const [job] = await mf.jobFor({ obligationId: payout.obligationId });
  const outcomes = [];
  for (let n = 1; n <= 3; n += 1) {
    const { claim } = n === 1 ? { claim: await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 60 }) } : await claimWhenDue(job.id);
    if (!claim?.success) { record("FAIL", `payout attempt ${n}: claim`, JSON.stringify(claim)); return; }
    const prep = await call("prepare_money_attempt", { p_job_id: job.id, p_lease: claim.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 42857142, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: fixtureSignature(), p_adapter_payload: { fixture: true }, p_signed_payload: "FIXTURE-NOT-A-SIGNED-TRANSACTION" });
    await call("mark_money_attempt_submitted", { p_job_id: job.id, p_lease: claim.job.lease_token, p_attempt_id: prep.attempt_id });
    const r = await call("record_money_attempt_result", { p_job_id: job.id, p_lease: claim.job.lease_token, p_attempt_id: prep.attempt_id, p_outcome: n === 2 ? "FAILED_ONCHAIN" : "EXPIRED_NOT_LANDED", p_code: "FIXTURE" });
    outcomes.push(`${r?.status}:${r?.next_retry_in_seconds ?? ""}`);
    if (n === 1) expect("P1. SUBMITTED payout is not PAID (obligation SUBMITTED, payment PAYOUT_PROCESSING)", (await db(`payout_obligations?id=eq.${payout.obligationId}&select=status`))[0].status === "SUBMITTED" && (await db(`payment_intents?id=eq.${payout.intentId}&select=status`))[0].status === "PAYOUT_PROCESSING");
  }
  const final = await jobRow(job.id);
  const attempts = await mf.attemptsOf(job.id);
  expect("P2. payout: 3 terminal attempts with growing backoff (60 s, 120 s) then REVIEW_REQUIRED (MAX_ATTEMPTS)", outcomes.join() === "RETRYABLE:60,RETRYABLE:120,REVIEW_REQUIRED:" && final.status === "REVIEW_REQUIRED" && final.last_error_code === "MAX_ATTEMPTS", outcomes);
  expect("P3. payout: every attempt kept (3 rows, distinct ids), all terminal, all signed bytes cleared", attempts.length === 3 && new Set(attempts.map((a) => a.external_id)).size === 3 && attempts.every((a) => a.signed_payload === null && ["FAILED_ONCHAIN", "EXPIRED_NOT_LANDED"].includes(a.state)));
  expect("P4. payout: REVIEW_REQUIRED never marks the obligation PAID; payment never SETTLED", (await db(`payout_obligations?id=eq.${payout.obligationId}&select=status`))[0].status === "SUBMITTED" && (await db(`payment_intents?id=eq.${payout.intentId}&select=status`))[0].status === "PAYOUT_PROCESSING");
}

try {
  await Promise.all([refundLimit(), payoutAttempts()]);
} catch (error) {
  record("FAIL", "retry-limit harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (purged: checkouts, obligations, refunds, jobs, attempts; helpers, users, requests)", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

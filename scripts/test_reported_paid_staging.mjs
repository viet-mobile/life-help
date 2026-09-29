// Live STAGING gate for migration 202609290023 (provider-reported-paid authority) on top of 022.
// Uses ONLY trusted authorities: the app role's RPCs (claim / prepare / record / release - exactly what the
// outbox engine calls) and the DEPLOYED operator review routes. No direct write to a financial table, no
// provider enablement, no chain transaction, no Airwallex contact.
// Fixtures: purgeable test_fixture checkouts funded by FIXTURE observations; payout fixtures get a clearly
// labelled PROVIDER_PAYEE destination of an UNREGISTERED fixture provider (LHFIXTURE) so the deployed devnet
// runtime never serves their jobs. Operator review rows stay (immutable history), labelled with the run id.
// Usage: node scripts/test_reported_paid_staging.mjs [--phase=gate|runtime]
import crypto from "node:crypto";
import { base, db, fixtures, recorder, rpc, settlementToken, sleep } from "./lib/stagingPushHarness.mjs";
import { call, fixtureSignature, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const phase = process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "gate";
const runId = `RP${Date.now()}`;
const { expect, record, notTestable, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const operator = { Authorization: `Bearer ${settlementToken}` };
const api = async (pathname, { method = "GET", body } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, headers: { ...operator, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, json, text };
};
const act = async (jobId, action, { confirm = false } = {}) => api(`/api/sys/review/cases/MONEY_JOB/${jobId}/actions`, { method: "POST", body: { action, reason: `${runId} reported-paid gate`, idempotencyKey: crypto.randomUUID(), ...(confirm ? { confirm: true } : {}) } });
const opAct = async (jobId, action) => { const first = await act(jobId, action); return first.status === 428 ? act(jobId, action, { confirm: true }) : first; };
const job = async (id) => (await db(`money_movement_jobs?id=eq.${id}&select=*`))[0];
const attempts = (jobId) => db(`money_movement_attempts?job_id=eq.${jobId}&select=id,attempt_number,state,external_id,network,provider_reported_paid_at,signed_payload&order=attempt_number`);
const claim = async (jobId) => (await rpc("claim_money_job", { p_job_id: jobId, p_lease_seconds: 60 })).data;
const record_ = (jobId, lease, attemptId, outcome, code = null) => call("record_money_attempt_result", { p_job_id: jobId, p_lease: lease, p_attempt_id: attemptId, p_outcome: outcome, p_code: code });
const release = (jobId, lease, cls, code, delay = null) => call("release_money_job", { p_job_id: jobId, p_lease: lease, p_class: cls, p_code: code, p_delay_seconds: delay });
const destinations = [];
const cronSafe = () => { const d = new Date(); const minsToTick = ((6 - (d.getUTCHours() % 6)) % 6) * 60 + (17 - d.getUTCMinutes()); return !(minsToTick >= -5 && minsToTick <= 20); };

/** Customer-confirmed Helper payout obligation (fixture-funded) whose job belongs to a provider-payee rail. */
async function providerPayoutFixture(label) {
  const h = await mf.helperWithPrice(label);
  const payee = `fx_${runId}_${label}`.toLowerCase();
  const [dest] = await db("payout_destinations", "POST", { owner_helper_id: h.helper.id, country: "KR", currency: "KRW", payout_method: "PROVIDER_PAYEE", provider: "LHFIXTURE", provider_environment: "SANDBOX", provider_payee_token: payee, masked_destination: `FIXTURE ${runId}`, status: "ACTIVE" });
  if (dest?.id) destinations.push(dest.id);
  const customer = `RP${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const checkout = await mf.helperCheckout(h, customer, `reported-paid ${label}`);
  const funded = await mf.fixtureFund(checkout.checkout_id, customer);
  const [asg] = await db(`request_assignments?request_id=eq.${funded.requestId}&status=eq.PENDING&select=id`);
  for (const step of ["accept", "start", "complete"]) await fetch(`${base}/api/helper/assignments/${asg?.id}/${step}`, { method: "POST", headers: h.auth });
  const confirmation = await call("confirm_service_completion", { p_request_id: funded.requestId, p_customer_id: customer });
  const [j] = await mf.jobFor({ obligationId: confirmation?.payout_obligation_id });
  return { h, payee, dest, customer, checkout, funded, obligationId: confirmation?.payout_obligation_id, requestId: funded.requestId, job: j, key: (n) => `lh_${j?.id?.replace(/-/g, "")}_${n}` };
}
/** Claim + prepare attempt 1 on the given provider network (exactly what the outbox bridge persists). */
async function prepared(p, network) {
  const c = await claim(p.job.id);
  const prep = await call("prepare_money_attempt", { p_job_id: p.job.id, p_lease: c.job.lease_token, p_provider: network.split(":")[1], p_network: network, p_asset: "KRW", p_amount_base_units: 60000, p_destination: p.payee, p_external_id: p.key(1), p_adapter_payload: { kind: "HELPER_PAYOUT", reference: p.job.id, fixture: runId }, p_signed_payload: JSON.stringify({ fixture: runId }) });
  return { lease: c.job.lease_token, attemptId: prep?.attempt_id, prep, claim: c };
}
/** Make a reported-paid job claimable NOW through operator authority (MARK_NO_FURTHER_AUTOMATION -> RETRY_RECONCILIATION). */
async function viaOperator(jobId) {
  const hold = await opAct(jobId, "MARK_NO_FURTHER_AUTOMATION");
  const afterHold = await job(jobId);
  const rec = await opAct(jobId, "RETRY_RECONCILIATION");
  return { hold: hold.status, holdCode: afterHold.last_error_code, rec: rec.status };
}

async function gate() {
  // ---------------- 1. schema / privileges / history ----------------
  const before = await db("money_movement_attempts?select=id,provider_reported_paid_at&provider_reported_paid_at=not.is.null");
  const colProbe = await db("money_movement_attempts?select=provider_reported_paid_at&limit=1");
  const extraParam = await rpc("record_money_attempt_result", { p_job_id: crypto.randomUUID(), p_lease: crypto.randomUUID(), p_attempt_id: crypto.randomUUID(), p_outcome: "PROVIDER_REPORTED_PAID", p_code: null, p_reported_paid_at: "2020-01-01T00:00:00Z" });
  expect("1a. provider_reported_paid_at exists on staging; no historical attempt carries it (not rewritten, no backfill); record_money_attempt_result has NO timestamp parameter (a caller-supplied time is not even callable)",
    Array.isArray(colProbe) && before.length === 0 && extraParam.status === 404, { before: before.length, extraParam: extraParam.status });

  const A = await providerPayoutFixture("A");
  expect("fixture A: customer-confirmed payout obligation on the PROVIDER_PAYEE rail (never served by the devnet runtime)", !!A.job && A.job.rail === "PROVIDER_PAYEE", { job: A.job?.rail, dest: !!A.dest });
  const a1 = await prepared(A, "provider:LHFIXTURE:SANDBOX");
  const [aAtt0] = await attempts(A.job.id);
  const direct = {
    set: await fetch(`${(await import("./lib/stagingPushHarness.mjs")).supabaseUrl}/rest/v1/money_movement_attempts?id=eq.${aAtt0?.id}`, { method: "PATCH", headers: { apikey: (await import("./lib/stagingPushHarness.mjs")).serviceKey, Authorization: `Bearer ${(await import("./lib/stagingPushHarness.mjs")).serviceKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ provider_reported_paid_at: new Date().toISOString() }) }).then((r) => r.status),
  };
  const aPaid = await record_(A.job.id, a1.lease, a1.attemptId, "PROVIDER_REPORTED_PAID");
  const [aAtt1] = await attempts(A.job.id);
  const svcHdr = async () => { const h = await import("./lib/stagingPushHarness.mjs"); return { url: h.supabaseUrl, headers: { apikey: h.serviceKey, Authorization: `Bearer ${h.serviceKey}`, "Content-Type": "application/json" } }; };
  const { url, headers } = await svcHdr();
  const patch = (body) => fetch(`${url}/rest/v1/money_movement_attempts?id=eq.${aAtt1.id}`, { method: "PATCH", headers, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, code: (await r.json().catch(() => ({}))).code }));
  const mut = { clear: await patch({ provider_reported_paid_at: null }), change: await patch({ provider_reported_paid_at: "2020-01-01T00:00:00Z" }) };
  const insertForged = await fetch(`${url}/rest/v1/money_movement_attempts`, { method: "POST", headers, body: JSON.stringify({ job_id: A.job.id, attempt_number: 2, provider: "LHFIXTURE", network: "provider:LHFIXTURE:SANDBOX", asset: "KRW", amount_base_units: 60000, destination: A.payee, external_id: A.key(2) }) }).then(async (r) => ({ status: r.status, code: (await r.json().catch(() => ({}))).code }));
  expect("1b. evidence starts NULL; set ONLY by record_money_attempt_result(PROVIDER_REPORTED_PAID) with database time; the app role cannot set / change / clear it or insert an attempt (42501 - no mutation surface; the owner-level trigger guard is proven on the real chain locally)",
    aAtt0?.provider_reported_paid_at === null && aPaid?.status === "PROVIDER_PAID_AWAITING_FINALITY" && !!aPaid.reported_paid_at && aAtt1.provider_reported_paid_at !== null
    && Math.abs(Date.now() - Date.parse(aAtt1.provider_reported_paid_at)) < 5 * 60_000 && [direct.set, mut.clear.status, mut.change.status, insertForged.status].every((s) => s === 401 || s === 403) && mut.clear.code === "42501",
    { direct, mut, insertForged, aPaid });
  const aJob1 = await job(A.job.id);
  const aOb1 = (await db(`payout_obligations?id=eq.${A.obligationId}&select=status`))[0]?.status;
  const aReq1 = (await db(`service_requests?id=eq.${A.requestId}&select=status`))[0]?.status;
  expect("2a. reported paid is not terminal: attempt SUBMITTED, obligation SUBMITTED (not PAID), request not SETTLED, job CONFIRMING awaiting finality (hourly re-check, no timer)", aAtt1.state === "SUBMITTED" && aOb1 === "SUBMITTED" && aReq1 !== "SETTLED" && aJob1.status === "CONFIRMING" && aJob1.last_error_code === "PROVIDER_PAID_AWAITING_FINALITY", { state: aAtt1.state, aOb1, aReq1, job: aJob1.status });
  const settleTry = await fetch(`${base}/api/sys/requests/${A.requestId}/status`, { method: "POST", headers: { ...operator, "Content-Type": "application/json" }, body: JSON.stringify({ status: "SETTLED" }) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
  expect("2b. settlement authority stays closed: the deployed settlement route refuses (409 PAYOUT_NOT_CONFIRMED); request unchanged", settleTry.status === 409 && settleTry.body?.code === "PAYOUT_NOT_CONFIRMED" && (await db(`service_requests?id=eq.${A.requestId}&select=status`))[0]?.status === aReq1, settleTry);

  // ---------------- 2. exact defect sequence (lookup unknown) ----------------
  const aOps = await viaOperator(A.job.id);
  const aAfterOps = await job(A.job.id);
  const ac = await claim(A.job.id);
  const aRel = await release(A.job.id, ac.job.lease_token, "RETRYABLE", "PROVIDER_LOOKUP_UNKNOWN");
  const aCode = (await job(A.job.id)).last_error_code;
  await sleep(17000);
  const ac2 = await claim(A.job.id);
  const aFail = await record_(A.job.id, ac2?.job?.lease_token, a1.attemptId, "FAILED_ONCHAIN", "BENEFICIARY_BANK_REJECTED");
  const aJob2 = await job(A.job.id);
  const aAtts2 = await attempts(A.job.id);
  expect("3a. legitimate operational overwrites of the job code (operator hold -> OPERATOR_HOLD; reconciliation; RETRYABLE PROVIDER_LOOKUP_UNKNOWN) leave the attempt evidence intact",
    aOps.hold === 200 && aOps.holdCode === "OPERATOR_HOLD" && aOps.rec === 200 && aAfterOps.automation_policy === "RECONCILE_ONLY" && aRel?.status === "RETRYABLE" && aCode === "PROVIDER_LOOKUP_UNKNOWN" && aAtts2[0].provider_reported_paid_at === aAtt1.provider_reported_paid_at, { aOps, aRel, aCode });
  expect("3b. provider FAILED on the SAME attempt -> REVIEW_REQUIRED / PROVIDER_FAILED_AFTER_REPORTED_PAID (decided by the attempt evidence; 022 alone would have said RECONCILED_NOT_LANDED / RETRYABLE here); evidence still present",
    aFail?.status === "REVIEW_REQUIRED" && aFail.code === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && aJob2.status === "REVIEW_REQUIRED" && aJob2.last_error_code === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && aAtts2[0].state === "FAILED_ONCHAIN" && aAtts2[0].provider_reported_paid_at !== null, { aFail, job: [aJob2.status, aJob2.last_error_code] });

  // ---------------- review queue / detail (017), right after the failure (before later operator steps change the reason) ----------------
  const list = await api(`/api/sys/review/cases?reason=PROVIDER_FAILED_AFTER_REPORTED_PAID&includeClosed=1`);
  const row = (list.json?.cases ?? []).find((c) => c.caseId === A.job.id);
  const detail = await api(`/api/sys/review/cases/MONEY_JOB/${A.job.id}`);
  const dText = detail.text;
  expect("8a. the 017 review queue lists the reported-paid failure (job, reason PROVIDER_FAILED_AFTER_REPORTED_PAID, provider network) and the detail shows job + attempt (provider, network, state, key) + error code; no secret / signed bytes",
    list.status === 200 && !!row && row.reason === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && detail.status === 200 && dText.includes(A.key(1)) && dText.includes("provider:LHFIXTURE:SANDBOX") && dText.includes("PROVIDER_FAILED_AFTER_REPORTED_PAID")
    && !dText.includes(settlementToken) && !/signed_payload|signedPayload/.test(dText), { list: list.status, row: !!row, detail: detail.status });
  const ev = detail.json?.case?.payoutEvidence;
  const hdrs = async () => (await import("./lib/stagingPushHarness.mjs")).env.TEST_SUPABASE_ANON_KEY;
  const anonKey = await hdrs();
  const unauth = {
    none: (await fetch(`${base}/api/sys/review/cases/MONEY_JOB/${A.job.id}`)).status,
    anonKey: (await fetch(`${base}/api/sys/review/cases/MONEY_JOB/${A.job.id}`, { headers: { Authorization: `Bearer ${anonKey}` } })).status,
    helper: (await fetch(`${base}/api/sys/review/cases/MONEY_JOB/${A.job.id}`, { headers: A.h.auth })).status,
  };
  expect("8b. review detail shows the attempt evidence read-only: payoutEvidence.attempts[0].providerReportedPaidAt === the attempt row's provider_reported_paid_at (also in systemDecisions.attempts), reason PROVIDER_FAILED_AFTER_REPORTED_PAID, not a final confirmation; anonymous / anon-key / Helper session -> 401",
    !!ev && new Date(ev.attempts?.[0]?.providerReportedPaidAt ?? 0).toISOString() === new Date(aAtts2[0].provider_reported_paid_at).toISOString() && ev.attempts[0].finalConfirmation === false && ev.reviewReason === "PROVIDER_FAILED_AFTER_REPORTED_PAID"
    && detail.json.case.systemDecisions.attempts[0].provider_reported_paid_at !== null && Object.values(unauth).every((s) => s === 401), { ev, unauth });
  // ---------------- 3. every accessible route to a new attempt ----------------
  const aWorker = await claim(A.job.id);
  const aSweep = (await rpc("claim_money_job", { p_job_id: null, p_lease_seconds: 5 })).data;
  if (aSweep?.job) await release(aSweep.job.job_id, aSweep.job.lease_token, "WAITING", "REPORTED_PAID_GATE_SWEEP", 15);
  const rules = (await api(`/api/sys/review/cases/MONEY_JOB/${A.job.id}`)).json;
  const requeue = await opAct(A.job.id, "REQUEUE_SAFE");
  const reconcile = await opAct(A.job.id, "RETRY_RECONCILIATION");
  const rc = await claim(A.job.id);
  const recPrep = rc?.success ? await call("prepare_money_attempt", { p_job_id: A.job.id, p_lease: rc.job.lease_token, p_provider: "LHFIXTURE", p_network: "provider:LHFIXTURE:SANDBOX", p_asset: "KRW", p_amount_base_units: 60000, p_destination: A.payee, p_external_id: A.key(2), p_adapter_payload: { fixture: runId }, p_signed_payload: null }) : null;
  const note = await opAct(A.job.id, "NOTE");
  const escalate = await opAct(A.job.id, "ESCALATE");
  const close = await opAct(A.job.id, "CLOSE_AS_REVIEWED");
  const aAtts3 = await attempts(A.job.id);
  const allowed = rules?.case?.actions ?? rules?.actions ?? rules?.rules?.actions ?? null;
  expect("4a. retry worker / outbox sweep: targeted claim of the REVIEW job -> JOB_FINAL; a queue sweep never picks it", aWorker?.code === "JOB_FINAL" && aSweep?.job?.job_id !== A.job.id, { aWorker: aWorker?.code, sweptOther: aSweep?.job?.job_id ?? null });
  expect("4b. operator: REQUEUE_SAFE refused (409 ACTION_NOT_ALLOWED); RETRY_RECONCILIATION allowed but reconciles only - prepare answers RECONCILE_ONLY_NO_NEW_ATTEMPT; NOTE / ESCALATE / CLOSE_AS_REVIEWED allowed; CLOSE does not erase the evidence",
    requeue.status === 409 && requeue.json?.code === "ACTION_NOT_ALLOWED" && !(requeue.json?.allowed ?? []).includes("REQUEUE_SAFE") && reconcile.status === 200 && recPrep?.success === false && recPrep.code === "RECONCILE_ONLY_NO_NEW_ATTEMPT"
    && note.status === 200 && escalate.status === 200 && close.status === 200 && aAtts3.length === 1 && aAtts3[0].provider_reported_paid_at === aAtt1.provider_reported_paid_at,
    { requeue: [requeue.status, requeue.json?.code, requeue.json?.allowed], reconcile: reconcile.status, recPrep, note: note.status, escalate: escalate.status, close: close.status, allowed });
  expect("4c. no attempt 2, no new provider request key, no signed bytes left: exactly one attempt (key _1), terminal", aAtts3.length === 1 && aAtts3[0].external_id === A.key(1) && aAtts3[0].signed_payload === null && (await db(`money_movement_attempts?external_id=eq.${A.key(2)}&select=id`)).length === 0);

  // ---------------- 4. waiting / network state path ----------------
  const B = await providerPayoutFixture("B");
  const b1 = await prepared(B, "provider:LHFIXTURE:SANDBOX");
  await record_(B.job.id, b1.lease, b1.attemptId, "PROVIDER_REPORTED_PAID");
  const bOps = await viaOperator(B.job.id);
  const bc = await claim(B.job.id);
  const bWait = await release(B.job.id, bc.job.lease_token, "WAITING", "AWAITING_NETWORK", 15);
  const bAfterWait = await job(B.job.id);
  const bRec = await opAct(B.job.id, "RETRY_RECONCILIATION");
  const bc2 = await claim(B.job.id);
  const bFail = await record_(B.job.id, bc2?.job?.lease_token, b1.attemptId, "FAILED_ONCHAIN", "PROVIDER_REPORTED_FAILED");
  const bAtts = await attempts(B.job.id);
  expect("5. reported paid -> waiting / network state (AWAITING_NETWORK; under reconciliation it returns to review as RECONCILE_ONLY_AWAITING_NETWORK) -> FAILED: REVIEW_REQUIRED / PROVIDER_FAILED_AFTER_REPORTED_PAID; no retryable transition; one attempt",
    bOps.hold === 200 && bWait?.success && /AWAITING_NETWORK/.test(bAfterWait.last_error_code ?? "") && bRec.status === 200 && bFail?.status === "REVIEW_REQUIRED" && bFail.code === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && bAtts.length === 1 && bAtts[0].provider_reported_paid_at !== null,
    { bWait, code: bAfterWait.last_error_code, bFail });

  // ---------------- 5. duplicate reported-paid x10 + replay after overwrite; Airwallex no-final ----------------
  const C = await providerPayoutFixture("C");
  const c1 = await prepared(C, "provider:AIRWALLEX:SANDBOX");
  const tenfold = await Promise.all(Array.from({ length: 10 }, () => record_(C.job.id, c1.lease, c1.attemptId, "PROVIDER_REPORTED_PAID")));
  const [cAtt] = await attempts(C.job.id);
  const cOps = await viaOperator(C.job.id);
  const cc = await claim(C.job.id);
  await release(C.job.id, cc.job.lease_token, "RETRYABLE", "UNRELATED_TIMEOUT");
  await sleep(17000);
  const cc2 = await claim(C.job.id);
  const cReplay = await record_(C.job.id, cc2?.job?.lease_token, c1.attemptId, "CONFIRMED"); // no-final provider: a "confirmed" claim is still only reported paid
  const cAtts = await attempts(C.job.id);
  const cOb = (await db(`payout_obligations?id=eq.${C.obligationId}&select=status`))[0]?.status;
  expect("6a. reported paid x10 on one lease (truly parallel): exactly one recorded, the rest LEASE_LOST; one attempt, one evidence timestamp",
    tenfold.filter((r) => r?.status === "PROVIDER_PAID_AWAITING_FINALITY").length === 1 && tenfold.filter((r) => r?.code === "LEASE_LOST").length === 9 && cAtt.provider_reported_paid_at !== null, tenfold.map((r) => r?.status ?? r?.code));
  expect("6b. after the job code was overwritten (operator hold + RETRYABLE UNRELATED_TIMEOUT), a replayed report on the same attempt is a safe replay: SAME evidence timestamp; AIRWALLEX network (no registry row -> NO_FINAL_SIGNAL, fail closed): a CONFIRMED claim stays non-terminal; obligation not PAID; one attempt",
    cOps.hold === 200 && cReplay?.status === "PROVIDER_PAID_AWAITING_FINALITY" && new Date(cReplay.reported_paid_at).toISOString() === new Date(cAtt.provider_reported_paid_at).toISOString() && cAtts.length === 1 && cOb !== "PAID",
    { cReplay, cOb });

  // ---------------- 6. final providers on the SAME attempt; Solana (PAID fixtures purged immediately) ----------------
  if (!cronSafe()) {
    notTestable("7. final confirmation fixtures", "too close to the staging cron tick (a PAID fixture could be settled by the reconciler); rerun later");
  } else {
    const M = await providerPayoutFixture("M");
    const m1 = await prepared(M, "provider:MOCK_PROVIDER:SANDBOX");
    await record_(M.job.id, m1.lease, m1.attemptId, "PROVIDER_REPORTED_PAID");
    await viaOperator(M.job.id);
    const mc = await claim(M.job.id);
    const mFinal = await record_(M.job.id, mc?.job?.lease_token, m1.attemptId, "CONFIRMED");
    const mAtts = await attempts(M.job.id);
    const mOb = (await db(`payout_obligations?id=eq.${M.obligationId}&select=status`))[0]?.status;
    const mPurged = (await rpc("purge_payment_fixture", { p_checkout_id: M.checkout.checkout_id })).data?.success === true;
    expect("7a. a PROVIDER_FINAL_STATUS configuration (MOCK_PROVIDER row, provider itself DISABLED - no adapter, no traffic) completes on the SAME attempt after a reported paid: CONFIRMED, obligation PAID, evidence kept, one attempt (fixture purged immediately)",
      mFinal?.status === "CONFIRMED" && mAtts.length === 1 && mAtts[0].state === "CONFIRMED" && mAtts[0].provider_reported_paid_at !== null && mOb === "PAID" && mPurged, { mFinal: mFinal?.status ?? mFinal, mOb, mPurged });
    const sp = await mf.payoutObligation("SOL");
    const [sj] = await mf.jobFor({ obligationId: sp.obligationId });
    const sc = await claim(sj.id);
    const sPrep = await call("prepare_money_attempt", { p_job_id: sj.id, p_lease: sc.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: Number(sp.funded.intent.amount_base_units), p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: fixtureSignature(), p_adapter_payload: { fixture: runId }, p_signed_payload: null });
    const sConf = await record_(sj.id, sc.job.lease_token, sPrep.attempt_id, "CONFIRMED");
    const sAtts = await attempts(sj.id);
    const sOb = (await db(`payout_obligations?id=eq.${sp.obligationId}&select=status`))[0]?.status;
    const sPurged = (await rpc("purge_payment_fixture", { p_checkout_id: sp.checkout.checkout_id })).data?.success === true;
    expect("7b. SOLANA_DIRECT_DEVNET finalized-chain semantics unchanged (DB authority, FIXTURE signature, no chain tx): CONFIRMED -> obligation PAID, no reported-paid evidence (fixture purged immediately)", sConf?.status === "CONFIRMED" && sOb === "PAID" && sAtts[0]?.provider_reported_paid_at === null && sPurged, { sConf: sConf?.status ?? sConf, sOb, sPurged });
  }

  const retained = { opActions: (await db(`operator_review_actions?case_id=in.(${[A.job.id, B.job.id, C.job.id].join(",")})&select=id`)).length };
  return { A, B, C, retained };
}

let state = null;
try {
  if (phase !== "gate") throw new Error(`unknown phase ${phase}`);
  state = await gate();
} catch (error) {
  record("FAIL", "reported-paid gate harness", String(error?.stack || error).slice(0, 600));
} finally {
  for (const id of destinations) await db(`payout_destinations?id=eq.${id}`, "PATCH", { status: "REVOKED", revoked_at: new Date().toISOString() }).catch(() => null);
  const out = await mf.cleanup();
  const ids = state ? [state.A.job.id, state.B.job.id, state.C.job.id] : [];
  const leftJobs = ids.length ? (await db(`money_movement_jobs?id=in.(${ids.join(",")})&select=id`)).length : 0;
  const leftAtts = ids.length ? (await db(`money_movement_attempts?job_id=in.(${ids.join(",")})&select=id,signed_payload`)) : [];
  const conv = (await db(`conversations?select=id&request_id=in.(${[...(state ? [state.A.requestId, state.B.requestId, state.C.requestId] : []), "00000000-0000-0000-0000-000000000000"].join(",")})`)).length;
  const reservations = (await db(`helper_checkout_reservations?select=id&checkout_id=in.(${[...mf.checkouts, "00000000-0000-0000-0000-000000000000"].join(",")})`)).length;
  const activeDest = (await db(`payout_destinations?id=in.(${[...destinations, "00000000-0000-0000-0000-000000000000"].join(",")})&status=eq.ACTIVE&select=id`)).length;
  expect("9. cleanup: fixture checkouts purged (requests / assignments / intents / obligations / jobs / attempts), fixture destinations REVOKED; 0 runnable fixture jobs, 0 attempts / signed bytes, 0 conversations, 0 reservations. Retained immutable: operator_review_actions of this run (labelled) + admin audit rows",
    out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0) && leftJobs === 0 && leftAtts.length === 0 && conv === 0 && reservations === 0 && activeDest === 0,
    { purged: out.purged, leftovers: out.leftovers, leftJobs, leftAtts: leftAtts.length, conv, reservations, activeDest, retained: state?.retained });
  console.log(`RUN ${runId} retained operator_review_actions: ${state?.retained?.opActions ?? "n/a"}`);
}
if (summary().FAIL > 0) process.exit(1);

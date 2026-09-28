// Live STAGING operator review console (migration 017 + deployed Worker), true parallel HTTP.
// PRECONDITION: migration 202609280017 applied to staging AND the current HEAD deployed.
// Read-only on the retained financial history (wrong-payment intents, TEST_FIXTURE Referral sets);
// every mutating check uses PURGEABLE fixtures (test_fixture checkouts; valid-format signatures of
// transactions that do not exist): the deployed adapter can never find a payer / land a transfer.
// Usage: node scripts/test_operator_review_staging.mjs
import crypto from "node:crypto";
import { base, db, fixtures, recorder, rpc, settlementToken, sleep } from "./lib/stagingPushHarness.mjs";
import { DEVNET_USDC, STAGING_RECIPIENT, base58Of32, call, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `OP${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const operator = { Authorization: `Bearer ${settlementToken}` };
const api = async (pathname, { method = "GET", headers = {}, body, redirect = "follow" } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, redirect, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, text: await r.text(), location: r.headers.get("location") };
};
const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
const act = (caseType, caseId, body, headers = operator) => api(`/api/sys/review/cases/${caseType}/${caseId}/actions`, { method: "POST", headers, body });
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const sig64 = () => { const bytes = crypto.randomBytes(64); let n = BigInt("0x" + bytes.toString("hex")), s = ""; while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; } return s; };
const reconcile = () => api("/api/sys/payments/reconcile", { method: "POST", headers: operator });
async function waitJob(jobId, predicate, ms = 60000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const [j] = await db(`money_movement_jobs?id=eq.${jobId}&select=*`);
    if (predicate(j) || Date.now() > deadline) return j;
    if (new Date(j.next_retry_at) <= new Date()) await reconcile();
    await sleep(3000);
  }
}

try {
  // ================= 16. authorization matrix =================
  const helper = await fx.createHelper("H", { service: "clog-clearing" });
  const customer = await fx.customerDevice("C");
  const someJob = (await db("money_movement_jobs?select=id&limit=1"))[0]?.id ?? crypto.randomUUID();
  const who = {
    anonymous: {}, helper: helper.auth, customer: { Cookie: customer.cookie }, publicIdBearer: { Authorization: `Bearer ${customer.publicId}` },
    forgedSession: { Cookie: `life_help_sys_session=${encodeURIComponent(`ops|${Date.now() + 3600e3}|forged-signature`)}` },
    expiredSession: { Cookie: `life_help_sys_session=${encodeURIComponent(`ops|${Date.now() - 1000}|x`)}` },
  };
  const matrix = {};
  for (const [name, headers] of Object.entries(who)) {
    matrix[`${name}:list`] = (await api("/api/sys/review/cases", { headers })).status;
    matrix[`${name}:detail`] = (await api(`/api/sys/review/cases/MONEY_JOB/${someJob}`, { headers })).status;
    matrix[`${name}:action`] = (await act("MONEY_JOB", someJob, { action: "NOTE", reason: "x", idempotencyKey: crypto.randomUUID() }, headers)).status;
  }
  matrix["ref:list"] = (await api(`/api/sys/review/cases?ref=${customer.publicId}`)).status;
  expect("16. anonymous / customer / Helper / public ID / ?ref= / forged session / expired session: no queue, detail or action (401)", Object.values(matrix).every((s) => s === 401), matrix);
  const page = await api("/admin/review", { redirect: "manual" });
  expect("17a. /admin/review without a SYS session redirects to /admin/login (the console never renders without one)", [302, 303, 307, 308].includes(page.status) && /\/admin\/login/.test(page.location ?? ""), [page.status, page.location]);

  // ================= 3/4. queue + detail on retained history (read-only) =================
  const list = json(await api("/api/sys/review/cases?includeClosed=1", { headers: operator }));
  const wrong = (list?.cases ?? []).filter((c) => c.caseType === "PAYMENT");
  const fixtureJobs = (list?.cases ?? []).filter((c) => c.caseType === "MONEY_JOB" && /^TEST_FIXTURE_/.test(c.reason ?? ""));
  expect("3. queue lists the retained wrong-payment cases and the retained TEST_FIXTURE Referral jobs (>= 2; immutable history grows with each referral fixture run) with their allowed actions", list?.success && wrong.length >= 4 && fixtureJobs.length >= 2 && wrong.every((c) => Array.isArray(c.allowedActions)), { payments: wrong.length, fixtureJobs: fixtureJobs.length });
  const filtered = json(await api("/api/sys/review/cases?caseType=PAYMENT&reason=UNDERPAID&includeClosed=1", { headers: operator }));
  expect("17b. filters (case type + reason) narrow the queue", filtered?.success && filtered.cases.length >= 1 && filtered.cases.every((c) => c.caseType === "PAYMENT" && /UNDERPAID/.test(c.reason)));
  const wr = wrong.find((c) => /WRONG_RECIPIENT/.test(c.reason ?? ""));
  expect("11a. retained WRONG_RECIPIENT case: no refund action offered", !!wr && !wr.allowedActions.includes("INITIATE_REFUND"), wr?.allowedActions);
  const up = filtered.cases.find((c) => c.status === "REVIEW_REQUIRED");
  const detail = json(await api(`/api/sys/review/cases/PAYMENT/${up?.caseId}`, { headers: operator }));
  const fact = detail?.case?.facts?.observedOnChain?.[0] ?? {};
  expect("4. detail: CHAIN FACTS (amount, recipient, mint, network, signature, classification) / SYSTEM DECISIONS (intent status) / OPERATOR ACTIONS / UNRESOLVED", detail?.success && fact.amount_base_units && fact.recipient && fact.mint && fact.network && fact.signature && fact.classification === "UNDERPAID" && detail.case.systemDecisions.intent.status === "REVIEW_REQUIRED" && Array.isArray(detail.case.operatorActions) && detail.case.unresolved === true);
  record("INFO", "observed sender: not stored as a chain fact; the refund adapter derives it from the transaction at execution (unknown sender -> REVIEW, see 11c)");
  const everything = JSON.stringify(list) + JSON.stringify(detail);
  expect("5. no secret material in queue / detail (signed bytes, keys, RPC URL, session secrets)", !/signed_payload|signedPayload|secret|alchemy|\/v2\/|PRIVATE KEY|life_help_sys_session/i.test(everything));

  // ================= 5/6/7/11/12. refund: confirmation, double click, parallel operators, destination =================
  const co = await mf.offerCheckout("OPCUSTAA", "operator refund");
  const q = await call("create_payment_quote", { p_checkout_id: co.checkout_id, p_customer_id: "OPCUSTAA", p_network: "solana-devnet", p_mint: DEVNET_USDC, p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: "fixture-no-chain", p_ttl_seconds: 600 });
  const i = await call("create_payment_intent", { p_quote_id: q.quote_id, p_customer_id: "OPCUSTAA", p_recipient: STAGING_RECIPIENT, p_reference: base58Of32() });
  const sourceSig = sig64();
  await call("record_payment_observation", { p_intent_id: i.intent_id, p_network: "solana-devnet", p_signature: sourceSig, p_slot: 1, p_mint: DEVNET_USDC, p_recipient: STAGING_RECIPIENT, p_amount_base_units: 1000, p_reference_matched: true, p_tx_success: true, p_confirmation: "finalized" });
  const noConfirm = await act("PAYMENT", i.intent_id, { action: "INITIATE_REFUND", reason: "fixture refund", idempotencyKey: crypto.randomUUID(), signature: sourceSig });
  const conf = json(noConfirm)?.confirmation;
  expect("5. money action without confirmation -> 428 summary only (case, amount, token, network, destination SOURCE, action); nothing executed", noConfirm.status === 428 && conf.amount === "0.001000" && conf.token === "USDC" && conf.network === "solana-devnet" && /sent this transaction/.test(conf.destinationSource) && conf.action === "INITIATE_REFUND" && (await db(`service_refunds?payment_intent_id=eq.${i.intent_id}&select=id`)).length === 0);
  const evil = { destination: base58Of32(), wallet: base58Of32(), recipient: base58Of32(), refund_address: base58Of32(), amount: 999999999, status: "REFUNDED" };
  const keyA = crypto.randomUUID();
  const race = await Promise.all([
    act("PAYMENT", i.intent_id, { action: "INITIATE_REFUND", reason: "operator A", idempotencyKey: keyA, signature: sourceSig, confirm: true, ...evil }),
    act("PAYMENT", i.intent_id, { action: "INITIATE_REFUND", reason: "operator B", idempotencyKey: crypto.randomUUID(), signature: sourceSig, confirm: true, ...evil }),
    act("PAYMENT", i.intent_id, { action: "INITIATE_REFUND", reason: "operator A double click", idempotencyKey: keyA, signature: sourceSig, confirm: true }),
  ]);
  const refunds = await db(`service_refunds?payment_intent_id=eq.${i.intent_id}&select=id,asset_amount_base_units,source_signature,status`);
  const rjobs = refunds.length ? await db(`money_movement_jobs?service_refund_id=eq.${refunds[0].id}&select=id`) : [];
  const audits = await db(`operator_review_actions?case_id=eq.${i.intent_id}&action=eq.INITIATE_REFUND&select=operator_id,operator_kind,reason,safe_refs,previous_state,resulting_state,created_at`);
  record("INFO", `parallel operators: ${race.map((r) => `${r.status}:${json(r)?.code ?? (json(r)?.replayed ? "replayed" : "ok")}`).join(" | ")}`);
  expect("6/7. two operators + a double click in TRUE parallel: exactly ONE refund + ONE job + ONE audit row; the others replay or get a safe conflict", refunds.length === 1 && rjobs.length === 1 && audits.length === 1 && race.filter((r) => r.status === 200 && json(r)?.replayed !== true).length === 1 && race.every((r) => [200, 409].includes(r.status)), { refunds: refunds.length, jobs: rjobs.length, audits: audits.length });
  expect("12. supplied destination / wallet / recipient / refund_address / amount / status were ignored: refund = exact observed 1000 base units from the source signature; audit destination = PAYER_OF_SOURCE_SIGNATURE", Number(refunds[0]?.asset_amount_base_units) === 1000 && refunds[0].source_signature === sourceSig && audits[0]?.safe_refs.destination === "PAYER_OF_SOURCE_SIGNATURE" && !JSON.stringify(audits).includes(evil.destination));
  expect("15. audit: operator identity + kind, case, action, reason, previous / resulting state, timestamp, safe refs; no secrets", audits[0]?.operator_kind === "PLATFORM_TOKEN" && audits[0].operator_id === "platform-token" && audits[0].reason && audits[0].previous_state && audits[0].resulting_state && audits[0].created_at && !/secret|signed_payload|alchemy/i.test(JSON.stringify(audits)));
  const rj = await waitJob(rjobs[0].id, (j) => j.status === "REVIEW_REQUIRED");
  expect("11c. unknown sender: the deployed refund adapter cannot derive the payer from the chain -> REVIEW_REQUIRED (SOURCE_PAYER_NOT_FOUND), no attempt, nothing sent", rj.status === "REVIEW_REQUIRED" && rj.last_error_code === "SOURCE_PAYER_NOT_FOUND" && (await db(`money_movement_attempts?job_id=eq.${rjobs[0].id}&select=id`)).length === 0, [rj.status, rj.last_error_code]);
  expect("13. the underpaid intent never activated and stays REVIEW_REQUIRED (no manual PAID_HELD / REFUNDED)", (await db(`payment_intents?id=eq.${i.intent_id}&select=status,request_id`))[0].status === "REVIEW_REQUIRED");
  const close = await act("PAYMENT", i.intent_id, { action: "ESCALATE", reason: "sender unknown - escalate", idempotencyKey: crypto.randomUUID() });
  expect("14. ESCALATE is disposition only (no confirmation needed; chain facts / intent status unchanged)", close.status === 200 && (await db(`payment_chain_transactions?signature=eq.${sourceSig}&select=classification`))[0].classification === "UNDERPAID");

  // ================= 8/9/10. job actions through the API =================
  const pay = await mf.payoutObligation("RQ");
  const [job] = await mf.jobFor({ obligationId: pay.obligationId });
  const c1 = (await rpc("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 })).data;
  await call("release_money_job", { p_job_id: job.id, p_lease: c1.job.lease_token, p_class: "REVIEW", p_code: "FIXTURE_REVIEW", p_delay_seconds: null });
  const rq0 = await act("MONEY_JOB", job.id, { action: "REQUEUE_SAFE", reason: "requeue", idempotencyKey: crypto.randomUUID() });
  const rq1 = await act("MONEY_JOB", job.id, { action: "REQUEUE_SAFE", reason: "requeue", idempotencyKey: crypto.randomUUID(), confirm: true });
  const afterRq = (await db(`money_movement_jobs?id=eq.${job.id}&select=status,automation_policy,max_attempts`))[0];
  expect("9. REQUEUE_SAFE: 428 first; confirmed -> one more processing opportunity (RETRYABLE, AUTO), same job", rq0.status === 428 && rq1.status === 200 && afterRq.status === "RETRYABLE" && afterRq.automation_policy === "AUTO" && (await mf.jobFor({ obligationId: pay.obligationId })).length === 1);
  const hold = await act("MONEY_JOB", job.id, { action: "MARK_NO_FURTHER_AUTOMATION", reason: "hold", idempotencyKey: crypto.randomUUID() });
  const held = (await db(`money_movement_jobs?id=eq.${job.id}&select=status,lease_token,last_error_code`))[0];
  const sweep = await reconcile();
  const stillHeld = (await db(`money_movement_jobs?id=eq.${job.id}&select=status,last_error_code`))[0];
  expect("10. MARK_NO_FURTHER_AUTOMATION (non-money, no confirmation): REVIEW_REQUIRED, no lease; the outbox run skips it; targeted claim refused", hold.status === 200 && held.status === "REVIEW_REQUIRED" && held.lease_token === null && sweep.status === 200 && !JSON.stringify(json(sweep)).includes(job.id) && stillHeld.last_error_code === "OPERATOR_HOLD" && (await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 15 }))?.code === "JOB_FINAL");
  // live attempt that never landed (valid-format signature of a non-existent tx, expired blockhash metadata)
  const pay2 = await mf.payoutObligation("RC");
  const [job2] = await mf.jobFor({ obligationId: pay2.obligationId });
  const c2 = (await rpc("claim_money_job", { p_job_id: job2.id, p_lease_seconds: 30 })).data;
  const liveSig = sig64();
  const live = await call("prepare_money_attempt", { p_job_id: job2.id, p_lease: c2.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 42857142, p_destination: base58Of32(), p_external_id: liveSig, p_adapter_payload: { lastValidBlockHeight: 1, reference: base58Of32(), fixture: true }, p_signed_payload: null });
  await call("mark_money_attempt_submitted", { p_job_id: job2.id, p_lease: c2.job.lease_token, p_attempt_id: live.attempt_id });
  await call("release_money_job", { p_job_id: job2.id, p_lease: c2.job.lease_token, p_class: "REVIEW", p_code: "FIXTURE_REVIEW", p_delay_seconds: null });
  const rc0 = await act("MONEY_JOB", job2.id, { action: "RETRY_RECONCILIATION", reason: "reconcile", idempotencyKey: crypto.randomUUID() });
  const rc1 = await act("MONEY_JOB", job2.id, { action: "RETRY_RECONCILIATION", reason: "reconcile", idempotencyKey: crypto.randomUUID(), confirm: true });
  const reconciled = await waitJob(job2.id, (j) => j.status === "REVIEW_REQUIRED");
  const attempts2 = await db(`money_movement_attempts?job_id=eq.${job2.id}&select=state,external_id`);
  expect("8. RETRY_RECONCILIATION (428, then confirmed): the deployed outbox reconciled ONLY the existing signature (not on chain, blockhash expired) -> REVIEW_REQUIRED (RECONCILED_NOT_LANDED); no fresh attempt; obligation not PAID", rc0.status === 428 && rc1.status === 200 && reconciled.status === "REVIEW_REQUIRED" && reconciled.last_error_code === "RECONCILED_NOT_LANDED" && attempts2.length === 1 && attempts2[0].external_id === liveSig && attempts2[0].state === "EXPIRED_NOT_LANDED" && (await db(`payout_obligations?id=eq.${pay2.obligationId}&select=status`))[0].status !== "PAID", [reconciled.status, reconciled.last_error_code, attempts2.length]);
  const [q1, q2] = await Promise.all([0, 1].map(() => act("MONEY_JOB", job2.id, { action: "MARK_NO_FURTHER_AUTOMATION", reason: "race", idempotencyKey: crypto.randomUUID() })));
  expect("an action not allowed for the case state is refused (409) - a REVIEW job cannot be 'held' again", [q1, q2].every((r) => r.status === 409), [q1.status, q2.status]);
} catch (error) {
  record("FAIL", "operator review harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (purgeable checkouts + intents / refunds / jobs / attempts; helpers, users, requests). Operator audit rows remain (immutable history).", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

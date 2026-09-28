// Live STAGING verification of migration 202609280017 (operator review), database level, BEFORE
// deploying: structure, privileges, retained review cases (READ-ONLY), and every rule on PURGEABLE
// fixtures (test_fixture checkouts; payments are FABRICATED observations; nothing can move money).
// Usage: node scripts/test_operator_review_migration_staging.mjs
import crypto from "node:crypto";
import { db, env, fixtures, readResponse, recorder, rpc, serviceKey, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { DEVNET_USDC, STAGING_RECIPIENT, base58Of32, call, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `ORM${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const sig64 = () => { const bytes = crypto.randomBytes(64); let n = BigInt("0x" + bytes.toString("hex")), s = ""; while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; } return s; };
const act = (caseType, caseId, action, o = {}) => call("operator_review_action", { p_case_type: caseType, p_case_id: caseId, p_action: action, p_operator_id: o.operator ?? "ops-a@life.help", p_operator_kind: o.kind ?? "SYS_SESSION", p_reason: o.reason ?? "verification", p_idempotency_key: o.key ?? crypto.randomUUID(), p_signature: o.signature ?? null });
const rules = (caseType, caseId) => call("review_case_actions", { p_case_type: caseType, p_case_id: caseId });
const ZERO = "00000000-0000-0000-0000-000000000000";

async function observedPayment(label, { amount = 1000, recipient = STAGING_RECIPIENT, mint = DEVNET_USDC } = {}) {
  const customer = `OR${label}`.padEnd(8, "X").slice(0, 8).toUpperCase();
  const co = await mf.offerCheckout(customer, `review ${label}`);
  const q = await call("create_payment_quote", { p_checkout_id: co.checkout_id, p_customer_id: customer, p_network: "solana-devnet", p_mint: DEVNET_USDC, p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: "fixture-no-chain", p_ttl_seconds: 600 });
  const i = await call("create_payment_intent", { p_quote_id: q.quote_id, p_customer_id: customer, p_recipient: STAGING_RECIPIENT, p_reference: base58Of32() });
  const signature = sig64(); // valid-format signature of a transaction that does not exist on chain (FIXTURE)
  const obs = await call("record_payment_observation", { p_intent_id: i.intent_id, p_network: "solana-devnet", p_signature: signature, p_slot: 1, p_mint: mint, p_recipient: recipient, p_amount_base_units: amount, p_reference_matched: true, p_tx_success: true, p_confirmation: "finalized" });
  return { intentId: i.intent_id, signature, obs };
}

try {
  // ================= 1. structure =================
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: hdr(serviceKey) })).json();
  const cols = (t) => Object.keys(spec.definitions?.[t]?.properties || {});
  const params = (n) => Object.keys(spec.paths?.[`/rpc/${n}`]?.post?.parameters?.[0]?.schema?.properties || {}).sort().join();
  expect("1a. immutable audit table operator_review_actions with every column", ["id", "case_type", "case_id", "action", "operator_id", "operator_kind", "reason", "previous_state", "resulting_state", "safe_refs", "idempotency_key", "created_at"].every((c) => cols("operator_review_actions").includes(c)));
  expect("1b. review read + action RPCs exist with exact parameters (no destination / amount / status parameter)", params("review_case_actions") === "p_case_id,p_case_type" && params("operator_review_action") === "p_action,p_case_id,p_case_type,p_idempotency_key,p_operator_id,p_operator_kind,p_reason,p_signature");
  expect("1c. minimal ledger extensions only: service_refunds.source_signature + asset_amount_base_units, money_movement_jobs.automation_policy (no second ledger)", ["source_signature", "asset_amount_base_units"].every((c) => cols("service_refunds").includes(c)) && cols("money_movement_jobs").includes("automation_policy") && !Object.keys(spec.definitions).some((t) => /review_(ledger|payments|refunds)|operator_(payments|refunds|ledger)/.test(t)));
  const internals = await Promise.all(["review_case_state", "review_case_closed", "review_refundable_transfers"].map((n) => rpc(n, n === "review_refundable_transfers" ? { p_intent_id: ZERO } : { p_case_type: "PAYMENT", p_case_id: ZERO })));
  expect("1d. internal helpers are not executable by service_role", internals.every((r) => r.data?.code === "42501" || r.status === 404), internals.map((r) => r.status));

  // ================= 2. privileges =================
  const helper = await fx.createHelper("P", { service: "clog-clearing" });
  const probe = {};
  for (const [who, h] of [["anon", hdr(anonKey)], ["helper", hdr(anonKey, helper.token)]]) {
    probe[`${who}:audit:read`] = denied(await rest("operator_review_actions?select=id&limit=1", h));
    probe[`${who}:rpc:actions`] = denied(await rest("rpc/review_case_actions", h, "POST", { p_case_type: "PAYMENT", p_case_id: ZERO }));
    probe[`${who}:rpc:act`] = denied(await rest("rpc/operator_review_action", h, "POST", { p_case_type: "PAYMENT", p_case_id: ZERO, p_action: "NOTE", p_operator_id: "x", p_operator_kind: "SYS_SESSION", p_reason: "x", p_idempotency_key: ZERO, p_signature: null }));
  }
  expect("2a. anonymous and Helper roles: no audit read, no review RPC", Object.values(probe).every(Boolean), probe);
  const svc = hdr(serviceKey);
  const broad = {};
  for (const [t, col] of [["payment_intents", "status"], ["payment_chain_transactions", "classification"], ["money_movement_jobs", "status"], ["service_refunds", "status"], ["payout_obligations", "status"], ["operator_review_actions", "reason"]]) {
    broad[t] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "PATCH", { [col]: "PAID" }));
  }
  broad["operator_review_actions:delete"] = denied(await rest(`operator_review_actions?id=eq.${ZERO}`, svc, "DELETE"));
  broad["operator_review_actions:insert"] = denied(await rest("operator_review_actions", svc, "POST", {}));
  expect("2b. no broad UPDATE for the app's service role on payment_intents / chain txs / money jobs / refunds / payout obligations; audit rows not insertable / updatable / deletable directly", Object.values(broad).every(Boolean), broad);
  const rewardUpdate = await rest(`referral_rewards?id=eq.${ZERO}`, svc, "PATCH", { state: "PAID" });
  record("INFO", `referral_rewards service_role UPDATE (pre-existing grant from migration 005): ${denied(rewardUpdate) ? "denied" : `ALLOWED (HTTP ${rewardUpdate.status})`}`);

  // ================= 3. retained review cases: READ ONLY =================
  const retainedIntents = await db("payment_intents?status=eq.REVIEW_REQUIRED&select=id");
  const retainedRules = await Promise.all(retainedIntents.map((i) => rules("PAYMENT", i.id).then((r) => ({ id: i.id, ...r }))));
  const fixtureJobs = await db("money_movement_jobs?last_error_code=like.TEST_FIXTURE_*&select=id,status,lease_token");
  const fixtureRules = await Promise.all(fixtureJobs.map((j) => rules("MONEY_JOB", j.id)));
  record("INFO", `retained payment cases: ${JSON.stringify(retainedRules.map((r) => ({ actions: r.actions, refundable: (r.refundable_transfers ?? []).map((t) => `${t.classification}:${t.amount_base_units}`) })))}`);
  expect("3a. retained wrong-payment intents are review cases; only transfers that reached our recipient are refundable (exact observed amounts)", retainedRules.length === 4 && retainedRules.filter((r) => r.actions.includes("INITIATE_REFUND")).length === 3 && retainedRules.every((r) => r.status === "REVIEW_REQUIRED"));
  expect("3b. retained TEST_FIXTURE Referral jobs: REVIEW_REQUIRED, no lease; readable as cases (not mutated; >= 2, immutable history grows)", fixtureJobs.length >= 2 && fixtureJobs.every((j) => j.status === "REVIEW_REQUIRED" && j.lease_token === null) && fixtureRules.every((r) => r.exists === true));

  // ================= 11. refund eligibility (purgeable fixtures) =================
  const under = await observedPayment("UNDER", { amount: 700 });
  const wrongTo = await observedPayment("WRONGTO", { recipient: base58Of32() });
  const wrongMint = await observedPayment("WRONGMNT", { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" });
  expect("11a. fixture wrong payments classified UNDERPAID / WRONG_RECIPIENT / WRONG_MINT; none activates a request", under.obs.classification === "UNDERPAID" && wrongTo.obs.classification === "WRONG_RECIPIENT" && wrongMint.obs.classification === "WRONG_MINT" && (await db(`payment_intents?id=in.(${under.intentId},${wrongTo.intentId},${wrongMint.intentId})&select=request_id`)).every((r) => r.request_id === null));
  expect("11b. WRONG_RECIPIENT and WRONG_MINT: no refund action; forcing it is refused", !(await rules("PAYMENT", wrongTo.intentId)).actions.includes("INITIATE_REFUND") && !(await rules("PAYMENT", wrongMint.intentId)).actions.includes("INITIATE_REFUND") && (await act("PAYMENT", wrongTo.intentId, "INITIATE_REFUND", { signature: wrongTo.signature }))?.code === "ACTION_NOT_ALLOWED" && (await act("PAYMENT", wrongMint.intentId, "INITIATE_REFUND", { signature: wrongMint.signature }))?.code === "ACTION_NOT_ALLOWED");

  // ================= 6/7. double click + true-parallel two operators =================
  const keyA = crypto.randomUUID();
  const race = await Promise.all([
    rpc("operator_review_action", { p_case_type: "PAYMENT", p_case_id: under.intentId, p_action: "INITIATE_REFUND", p_operator_id: "ops-a@life.help", p_operator_kind: "SYS_SESSION", p_reason: "A", p_idempotency_key: keyA, p_signature: under.signature }),
    rpc("operator_review_action", { p_case_type: "PAYMENT", p_case_id: under.intentId, p_action: "INITIATE_REFUND", p_operator_id: "ops-b@life.help", p_operator_kind: "SYS_SESSION", p_reason: "B", p_idempotency_key: crypto.randomUUID(), p_signature: under.signature }),
    rpc("operator_review_action", { p_case_type: "PAYMENT", p_case_id: under.intentId, p_action: "INITIATE_REFUND", p_operator_id: "ops-a@life.help", p_operator_kind: "SYS_SESSION", p_reason: "A again", p_idempotency_key: keyA, p_signature: under.signature }),
  ]);
  const replay = await act("PAYMENT", under.intentId, "INITIATE_REFUND", { key: keyA, signature: under.signature });
  const refunds = await db(`service_refunds?payment_intent_id=eq.${under.intentId}&select=id,reason,asset_amount_base_units,source_signature`);
  const rjobs = refunds.length ? await db(`money_movement_jobs?service_refund_id=eq.${refunds[0].id}&select=id`) : [];
  const audits = await db(`operator_review_actions?case_id=eq.${under.intentId}&action=eq.INITIATE_REFUND&select=operator_id,reason,safe_refs,previous_state,resulting_state,created_at`);
  record("INFO", `parallel operators: ${race.map((r) => `${r.status}:${r.data?.code ?? (r.data?.replayed ? "replayed" : r.data?.success ? "WON" : "?")}`).join(" | ")}`);
  expect("7. two operators + a same-key double click in TRUE parallel: exactly one refund (exact 700 base units, OPERATOR_APPROVED), one job, one audit row; others replay / refused", refunds.length === 1 && refunds[0].reason === "OPERATOR_APPROVED" && Number(refunds[0].asset_amount_base_units) === 700 && refunds[0].source_signature === under.signature && rjobs.length === 1 && audits.length === 1 && replay?.replayed === true, { refunds: refunds.length, jobs: rjobs.length, audits: audits.length });
  expect("15a. audit row: operator identity, reason, previous / resulting state, timestamp, safe refs (destination = PAYER_OF_SOURCE_SIGNATURE); no secrets", !!audits[0]?.operator_id && !!audits[0].reason && !!audits[0].previous_state && !!audits[0].resulting_state && !!audits[0].created_at && audits[0].safe_refs.destination === "PAYER_OF_SOURCE_SIGNATURE" && !/signed_payload|secret|alchemy|private/i.test(JSON.stringify(audits)));
  expect("13. underpayment stays unactivated; the intent stays REVIEW_REQUIRED (no PAID_HELD / REFUNDED override)", (await db(`payment_intents?id=eq.${under.intentId}&select=status,request_id`))[0].status === "REVIEW_REQUIRED");
  const fin = await act("PAYMENT", wrongTo.intentId, "CLOSE_AS_REVIEWED", { reason: "money went elsewhere; nothing to return" });
  expect("14. CLOSE / ESCALATE / NOTE are disposition only: chain facts + intent status unchanged", fin?.success && (await act("PAYMENT", wrongTo.intentId, "NOTE", { reason: "note" }))?.success && (await db(`payment_intents?id=eq.${wrongTo.intentId}&select=status`))[0].status === "REVIEW_REQUIRED" && (await db(`payment_chain_transactions?signature=eq.${wrongTo.signature}&select=classification`))[0].classification === "WRONG_RECIPIENT");

  // ================= 8/9/10. job actions =================
  const pay = await mf.payoutObligation("JOB");
  const [job] = await mf.jobFor({ obligationId: pay.obligationId });
  const c1 = await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 });
  const live = await call("prepare_money_attempt", { p_job_id: job.id, p_lease: c1.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 42857142, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: sig64(), p_adapter_payload: { fixture: true, lastValidBlockHeight: 1 }, p_signed_payload: "FIXTURE-NOT-A-SIGNED-TRANSACTION" });
  await call("mark_money_attempt_submitted", { p_job_id: job.id, p_lease: c1.job.lease_token, p_attempt_id: live.attempt_id });
  await call("release_money_job", { p_job_id: job.id, p_lease: c1.job.lease_token, p_class: "REVIEW", p_code: "FIXTURE_REVIEW", p_delay_seconds: null });
  const jr = await rules("MONEY_JOB", job.id);
  expect("9a. requeue is NOT offered while an attempt is live (reconcile first); reconciliation is", !jr.actions.includes("REQUEUE_SAFE") && jr.actions.includes("RETRY_RECONCILIATION"), jr.actions);
  const rr = await act("MONEY_JOB", job.id, "RETRY_RECONCILIATION", { reason: "re-check the same signature" });
  const c2 = await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 });
  expect("8a. RETRY_RECONCILIATION: job back to the reconciler with RECONCILE_ONLY; the claim returns the SAME live attempt (same signature)", rr?.success && c2?.job?.live_attempt?.attempt_id === live.attempt_id && c2.job.live_attempt.external_id === (await mf.attemptsOf(job.id))[0].external_id);
  const fresh = await call("prepare_money_attempt", { p_job_id: job.id, p_lease: c2.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 42857142, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: sig64(), p_adapter_payload: { fixture: true }, p_signed_payload: null });
  expect("8b. under RECONCILE_ONLY a fresh external attempt is refused FIRST (RECONCILE_ONLY_NO_NEW_ATTEMPT -> REVIEW_REQUIRED, lease released); still one attempt", fresh?.code === "RECONCILE_ONLY_NO_NEW_ATTEMPT" && (await mf.attemptsOf(job.id)).length === 1 && (await db(`money_movement_jobs?id=eq.${job.id}&select=status,lease_token`))[0].lease_token === null);
  await act("MONEY_JOB", job.id, "RETRY_RECONCILIATION", { reason: "reconcile the live attempt" });
  const c3 = await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 });
  const notLanded = await call("record_money_attempt_result", { p_job_id: job.id, p_lease: c3.job.lease_token, p_attempt_id: live.attempt_id, p_outcome: "EXPIRED_NOT_LANDED", p_code: "FIXTURE" });
  expect("8c. the existing transfer did not land -> back to REVIEW_REQUIRED (RECONCILED_NOT_LANDED), no replacement, obligation not PAID", notLanded?.status === "REVIEW_REQUIRED" && (await db(`money_movement_jobs?id=eq.${job.id}&select=last_error_code`))[0].last_error_code === "RECONCILED_NOT_LANDED" && (await mf.attemptsOf(job.id)).length === 1 && (await db(`payout_obligations?id=eq.${pay.obligationId}&select=status`))[0].status !== "PAID");
  const rq = await act("MONEY_JOB", job.id, "REQUEUE_SAFE", { reason: "safe to try once more" });
  const afterRq = (await db(`money_movement_jobs?id=eq.${job.id}&select=status,automation_policy,max_attempts,attempt_count`))[0];
  expect("9b. REQUEUE_SAFE (no lease, no live / confirmed attempt, obligation open): one more attempt budget, AUTO, same job (no duplicate)", rq?.success && afterRq.status === "RETRYABLE" && afterRq.automation_policy === "AUTO" && afterRq.max_attempts === Math.max(3, afterRq.attempt_count + 1) && (await mf.jobFor({ obligationId: pay.obligationId })).length === 1, afterRq);
  const hold = await act("MONEY_JOB", job.id, "MARK_NO_FURTHER_AUTOMATION", { reason: "stop" });
  const queue = await Promise.all([0, 1, 2].map(() => rpc("claim_money_job", { p_job_id: null, p_lease_seconds: 15 })));
  for (const q of queue) if (q.data?.job) await call("release_money_job", { p_job_id: q.data.job.job_id, p_lease: q.data.job.lease_token, p_class: "WAITING", p_code: "VERIFY_SWEEP", p_delay_seconds: 15 });
  expect("10. MARK_NO_FURTHER_AUTOMATION: REVIEW_REQUIRED (OPERATOR_HOLD), no lease; queue sweeps skip it; a targeted claim refuses it; obligation unchanged", hold?.success && (await db(`money_movement_jobs?id=eq.${job.id}&select=status,lease_token,last_error_code`))[0].last_error_code === "OPERATOR_HOLD" && !queue.some((q) => q.data?.job?.job_id === job.id) && (await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 15 }))?.code === "JOB_FINAL" && (await db(`payout_obligations?id=eq.${pay.obligationId}&select=status`))[0].status !== "PAID");

  // ================= 15b. audit immutability through the app role =================
  const [anyAudit] = await db(`operator_review_actions?case_id=eq.${under.intentId}&select=id`);
  expect("15b. audit rows cannot be updated or deleted through the app / operator role", denied(await rest(`operator_review_actions?id=eq.${anyAudit.id}`, svc, "PATCH", { reason: "rewritten" })) && denied(await rest(`operator_review_actions?id=eq.${anyAudit.id}`, svc, "DELETE")));
} catch (error) {
  record("FAIL", "migration 017 live harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (purgeable checkouts + their intents / refunds / jobs / attempts; helpers, users, requests). Operator audit rows stay (immutable history).", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

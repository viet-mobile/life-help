// Live STAGING verification of migration 202609280018 (financial authority hardening) on the deployed
// Worker. Purgeable fixtures only; reward-state probes use writes that are REFUSED (no row is created)
// plus ONE valid QUALIFIED reward (retained: referral rewards are not deletable by the app role).
// POINT-IN-TIME (018): it found two open gaps - the app role could DELETE referral_rewards and INSERT a
// reward directly as PAYABLE (check 12 red for referral_rewards:delete). Migration 019 closes both; after
// 019 checks 2a / 2b (direct app-role reward inserts) are superseded: every direct insert is refused and
// rewards are created only by create_referral_reward_for_settled_request(). Verify 019 with its own live suite.
// Usage: node scripts/test_financial_authority_staging.mjs
import crypto from "node:crypto";
import { base, db, env, fixtures, readResponse, recorder, rpc, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, letters, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `FA${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const svc = hdr(serviceKey);
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const ZERO = "00000000-0000-0000-0000-000000000000";
let probe = null;
const operatorAct = (caseType, caseId, body) => fetch(`${base}/api/sys/review/cases/${caseType}/${caseId}/actions`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

try {
  // ================= 1/11. referral_rewards: no direct UPDATE for anyone outside the ledger functions =================
  const [reward] = await db("referral_rewards?state=eq.PAID&select=id,state,reward_amount_krw,referrer_identity_id&limit=1");
  const target = reward?.id ?? ZERO;
  const helper = await fx.createHelper("P", { service: "clog-clearing" });
  const upd = {
    "service_role:QUALIFIED->PAID": await rest(`referral_rewards?id=eq.${target}`, svc, "PATCH", { state: "PAID" }),
    "service_role:->PAYOUT_PROCESSING": await rest(`referral_rewards?id=eq.${target}`, svc, "PATCH", { state: "PAYOUT_PROCESSING" }),
    "service_role:->FAILED": await rest(`referral_rewards?id=eq.${target}`, svc, "PATCH", { state: "FAILED" }),
    "service_role:amount": await rest(`referral_rewards?id=eq.${target}`, svc, "PATCH", { reward_amount_krw: 999999 }),
    "service_role:recipient": await rest(`referral_rewards?id=eq.${target}`, svc, "PATCH", { referrer_identity_id: ZERO }),
    "anon:state": await rest(`referral_rewards?id=eq.${target}`, hdr(anonKey), "PATCH", { state: "PAID" }),
    "helper:state": await rest(`referral_rewards?id=eq.${target}`, hdr(anonKey, helper.token), "PATCH", { state: "PAID" }),
  };
  const after = reward ? (await db(`referral_rewards?id=eq.${reward.id}&select=state,reward_amount_krw,referrer_identity_id`))[0] : null;
  expect("1/11. direct UPDATE of referral_rewards refused for the app role (state -> PAID / PAYOUT_PROCESSING / FAILED, amount, recipient), anon and Helper; the row is unchanged", Object.values(upd).every(denied) && (!reward || (after.state === reward.state && after.reward_amount_krw === reward.reward_amount_krw && after.referrer_identity_id === reward.referrer_identity_id)), Object.fromEntries(Object.entries(upd).map(([k, v]) => [k, v.status])));

  // ================= 2. inserts by the app role =================
  const [ra, rb] = [letters(), letters()];
  const [referrer] = await db("referral_identities", "POST", { referral_id: ra, subject_type: "CUSTOMER", device_id_hash: crypto.createHash("sha256").update(`${runId}-a`).digest("hex"), subject_key: ra });
  const [referred] = await db("referral_identities", "POST", { referral_id: rb, subject_type: "CUSTOMER", device_id_hash: crypto.createHash("sha256").update(`${runId}-b`).digest("hex"), subject_key: rb });
  const [attribution] = await db("referral_attributions", "POST", { referred_identity_id: referred.id, referrer_identity_id: referrer.id });
  const [request] = await db("service_requests", "POST", { request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true, customer_id: rb, customer_display_name: "AUTHORITY FIXTURE", service_slug: "boiler", country: "KR", sido: `${runId}-REF`, gungu: "G1", description: `${runId} authority probe (retained: referenced by a reward)`, status: "CANCELLED" });
  const row = (state) => ({ attribution_id: attribution.id, qualifying_request_id: request.id, referrer_identity_id: referrer.id, referred_identity_id: referred.id, tier: "WLH", reward_amount_krw: 1000, first_service_discount_krw: 1000, state });
  const insPaid = await rest("referral_rewards", svc, "POST", row("PAID"));
  const insProc = await rest("referral_rewards", svc, "POST", row("PAYOUT_PROCESSING"));
  expect("2a. app-role insert of a reward already PAID / PAYOUT_PROCESSING is refused (no row)", insPaid.status >= 400 && insProc.status >= 400 && /payout path/.test(JSON.stringify(insPaid.body) + JSON.stringify(insProc.body)) && (await db(`referral_rewards?qualifying_request_id=eq.${request.id}&select=id`)).length === 0);
  const insQualified = await rest("referral_rewards", svc, "POST", row("QUALIFIED"));
  expect("2b. the application's real initial insert (QUALIFIED, as at settlement) still works", insQualified.status === 201 && insQualified.body?.[0]?.state === "QUALIFIED", insQualified.status);
  const probeRewardId = insQualified.body?.[0]?.id;
  const payNotPayable = await call("create_referral_payout_obligation", { p_reward_id: insQualified.body?.[0]?.id, p_rail: "USDC_SOLANA", p_country: "KR" });
  expect("3a. a QUALIFIED reward cannot be paid out (REWARD_NOT_PAYABLE): no obligation, no job", payNotPayable?.code === "REWARD_NOT_PAYABLE" && (await db(`payout_obligations?referral_reward_id=eq.${probeRewardId}&select=id`)).length === 0);
  // Probe cleanup (the probe row is ours; while the DELETE gap exists the app role can remove it).
  probe = { rewardId: probeRewardId, requestId: request.id, identityIds: [referrer.id, referred.id] };

  // ================= 12. grants on every financial table (broad write by the app role) =================
  const grants = {};
  for (const [t, col] of [["payment_intents", "status"], ["payment_chain_transactions", "classification"], ["service_refunds", "status"], ["payout_obligations", "status"], ["money_movement_jobs", "status"], ["money_movement_attempts", "state"], ["referral_rewards", "state"], ["operator_review_actions", "reason"], ["payment_quotes", "fx_rate"], ["service_checkouts", "status"]]) {
    grants[`${t}:update`] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "PATCH", { [col]: "X" }));
    grants[`${t}:delete`] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "DELETE"));
  }
  expect("12. no broad UPDATE / DELETE for the app role on payment_intents, chain txs, quotes, checkouts, refunds, payout obligations, money jobs / attempts, referral_rewards, operator audit", Object.values(grants).every(Boolean), Object.entries(grants).filter(([, v]) => !v));

  // ================= 5/6. operator races (same key -> replayed; different keys -> one winner) =================
  const pay = await mf.payoutObligation("RACE");
  const [job] = await mf.jobFor({ obligationId: pay.obligationId });
  const c = (await rpc("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 })).data;
  await call("release_money_job", { p_job_id: job.id, p_lease: c.job.lease_token, p_class: "REVIEW", p_code: "FIXTURE_REVIEW", p_delay_seconds: null });
  const sameKey = crypto.randomUUID();
  const same = await Promise.all([0, 1, 2].map((n) => operatorAct("MONEY_JOB", job.id, { action: "REQUEUE_SAFE", reason: `same key ${n}`, idempotencyKey: sameKey, confirm: true })));
  const sameAudits = await db(`operator_review_actions?case_id=eq.${job.id}&action=eq.REQUEUE_SAFE&select=id`);
  const jobAfter = (await db(`money_movement_jobs?id=eq.${job.id}&select=status,max_attempts`))[0];
  record("INFO", `same-key race: ${same.map((r) => `${r.status}:${r.body?.code ?? (r.body?.replayed ? "replayed" : "executed")}`).join(" | ")}`);
  expect("5. three parallel requests with the SAME key: one execution, the others REPLAYED (not ACTION_NOT_ALLOWED); one audit row; one requeue (max_attempts +1 once); one job", same.filter((r) => r.status === 200 && r.body?.replayed === false).length === 1 && same.filter((r) => r.status === 200 && r.body?.replayed === true).length === 2 && sameAudits.length === 1 && jobAfter.status === "RETRYABLE" && jobAfter.max_attempts === 3 && (await mf.jobFor({ obligationId: pay.obligationId })).length === 1, { same: same.map((r) => r.body?.code ?? r.body?.replayed), audits: sameAudits.length, jobAfter });
  await operatorAct("MONEY_JOB", job.id, { action: "MARK_NO_FURTHER_AUTOMATION", reason: "back to review", idempotencyKey: crypto.randomUUID() });
  const diff = await Promise.all([0, 1].map((n) => operatorAct("MONEY_JOB", job.id, { action: "REQUEUE_SAFE", reason: `operator ${n}`, idempotencyKey: crypto.randomUUID(), confirm: true })));
  record("INFO", `different-key race: ${diff.map((r) => `${r.status}:${r.body?.code ?? "executed"}`).join(" | ")}`);
  expect("6. two operators with DIFFERENT keys: exactly one requeue, the other a safe conflict (409 ACTION_NOT_ALLOWED)", diff.filter((r) => r.status === 200).length === 1 && diff.filter((r) => r.status === 409 && r.body?.code === "ACTION_NOT_ALLOWED").length === 1 && (await db(`operator_review_actions?case_id=eq.${job.id}&action=eq.REQUEUE_SAFE&select=id`)).length === 2);
  await operatorAct("MONEY_JOB", job.id, { action: "MARK_NO_FURTHER_AUTOMATION", reason: "park", idempotencyKey: crypto.randomUUID() });

  // ================= 7. RECONCILE_ONLY with nothing live (no destination -> WAITING) =================
  const nd = await mf.payoutObligation("EMPTY");
  const [ej] = await mf.jobFor({ obligationId: nd.obligationId });
  const ec = (await rpc("claim_money_job", { p_job_id: ej.id, p_lease_seconds: 30 })).data;
  await call("release_money_job", { p_job_id: ej.id, p_lease: ec.job.lease_token, p_class: "REVIEW", p_code: "FIXTURE_REVIEW", p_delay_seconds: null });
  const rr = await operatorAct("MONEY_JOB", ej.id, { action: "RETRY_RECONCILIATION", reason: "nothing live - check", idempotencyKey: crypto.randomUUID(), confirm: true });
  let ejAfter;
  for (let n = 0; n < 12; n += 1) {
    await fetch(`${base}/api/sys/payments/reconcile`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}` } });
    ejAfter = (await db(`money_movement_jobs?id=eq.${ej.id}&select=status,last_error_code,lease_token,next_retry_at,automation_policy`))[0];
    if (ejAfter.status === "REVIEW_REQUIRED") break;
    await sleep(3000);
  }
  const sweep = await fetch(`${base}/api/sys/payments/reconcile`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}` } }).then((r) => r.json());
  expect("7. RECONCILE_ONLY job with nothing live (no destination): the deployed outbox returns it to REVIEW_REQUIRED (RECONCILE_ONLY_PAYOUT_DESTINATION_MISSING) - no attempt, no lease, and a further sweep skips it", rr.status === 200 && ejAfter.status === "REVIEW_REQUIRED" && ejAfter.last_error_code === "RECONCILE_ONLY_PAYOUT_DESTINATION_MISSING" && ejAfter.lease_token === null && (await mf.attemptsOf(ej.id)).length === 0 && !JSON.stringify(sweep).includes(ej.id) && (await call("claim_money_job", { p_job_id: ej.id, p_lease_seconds: 15 }))?.code === "JOB_FINAL", ejAfter);
} catch (error) {
  record("FAIL", "financial authority harness", String(error?.stack || error).slice(0, 600));
} finally {
  if (probe) {
    await rest(`referral_rewards?id=eq.${probe.rewardId}`, svc, "DELETE");
    if (!(await db(`referral_rewards?id=eq.${probe.rewardId}&select=id`)).length) {
      await rest(`service_requests?id=eq.${probe.requestId}`, svc, "DELETE");
      for (const id of probe.identityIds) await rest(`referral_attributions?or=(referred_identity_id.eq.${id},referrer_identity_id.eq.${id})`, svc, "DELETE");
      for (const id of probe.identityIds) await rest(`referral_identities?id=eq.${id}`, svc, "DELETE");
    } else record("INFO", `probe reward ${probe.rewardId} retained (not deletable by the app role)`);
  }
  const out = await mf.cleanup();
  expect("Fixture cleanup (purgeable money fixtures; helpers, users, requests; the probe reward only if deletable)", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

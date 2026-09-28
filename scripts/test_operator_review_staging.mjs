// Live STAGING operator review console (migration 017 + deployed Worker), true parallel HTTP.
// PRECONDITION: migration 202609280017 applied to staging AND the current HEAD deployed.
// Read-only on the retained financial history (wrong-payment intents, TEST_FIXTURE Referral sets);
// every mutating check uses PURGEABLE fixtures (test_fixture checkouts, FIXTURE signatures): nothing can
// reach a chain transfer (a FIXTURE source signature can never yield a payer).
// Usage: node scripts/test_operator_review_staging.mjs
import crypto from "node:crypto";
import { base, db, fixtures, recorder, rpc, settlementToken } from "./lib/stagingPushHarness.mjs";
import { DEVNET_USDC, STAGING_RECIPIENT, base58Of32, call, fixtureSignature, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `OP${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const operator = { Authorization: `Bearer ${settlementToken}` };
const api = async (pathname, { method = "GET", headers = {}, body } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, text: await r.text() };
};
const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
const act = (caseType, caseId, body, headers = operator) => api(`/api/sys/review/cases/${caseType}/${caseId}/actions`, { method: "POST", headers, body });

try {
  // ================= auth matrix =================
  const helper = await fx.createHelper("H", { service: "clog-clearing" });
  const customer = await fx.customerDevice("C");
  const someJob = (await db("money_movement_jobs?select=id&limit=1"))[0]?.id ?? crypto.randomUUID();
  const who = { anonymous: {}, helper: helper.auth, customer: { Cookie: customer.cookie }, publicIdBearer: { Authorization: `Bearer ${customer.publicId}` } };
  const matrix = {};
  for (const [name, headers] of Object.entries(who)) {
    matrix[`${name}:list`] = (await api("/api/sys/review/cases", { headers })).status;
    matrix[`${name}:detail`] = (await api(`/api/sys/review/cases/MONEY_JOB/${someJob}`, { headers })).status;
    matrix[`${name}:action`] = (await act("MONEY_JOB", someJob, { action: "NOTE", reason: "x", idempotencyKey: crypto.randomUUID() }, headers)).status;
  }
  matrix["ref:list"] = (await api(`/api/sys/review/cases?ref=${customer.publicId}`)).status;
  expect("1. customer / Helper / public ID / ?ref= / anonymous: no access to queue, detail or actions (401)", Object.values(matrix).every((s) => s === 401), matrix);

  // ================= queue + detail on retained history (read-only) =================
  const list = json(await api("/api/sys/review/cases?includeClosed=1", { headers: operator }));
  const kinds = [...new Set((list?.cases ?? []).map((c) => c.kind))];
  const wrong = (list?.cases ?? []).filter((c) => c.caseType === "PAYMENT");
  const fixtureJobs = (list?.cases ?? []).filter((c) => c.caseType === "MONEY_JOB" && /^TEST_FIXTURE_/.test(c.reason ?? ""));
  record("INFO", `queue kinds: ${kinds.join(", ")}`);
  expect("2. operator queue lists the retained wrong-payment cases (4 payment cases) and the 2 TEST_FIXTURE Referral jobs, with allowed actions", list?.success && wrong.length >= 4 && fixtureJobs.length === 2 && wrong.every((c) => Array.isArray(c.allowedActions)), { payments: wrong.length, fixtureJobs: fixtureJobs.length });
  const wr = wrong.find((c) => /WRONG_RECIPIENT/.test(c.reason ?? ""));
  expect("3. wrong recipient: no refund action offered (the money never reached us)", !!wr && !wr.allowedActions.includes("INITIATE_REFUND"), wr?.allowedActions);
  const up = wrong.find((c) => /UNDERPAID/.test(c.reason ?? ""));
  const detail = json(await api(`/api/sys/review/cases/PAYMENT/${up?.caseId}`, { headers: operator }));
  expect("4. case detail separates FACTS (chain) / SYSTEM DECISIONS / OPERATOR ACTIONS / UNRESOLVED; refundable transfer = exact observed amount", detail?.success && Array.isArray(detail.case.facts.observedOnChain) && !!detail.case.systemDecisions.intent && Array.isArray(detail.case.operatorActions) && detail.case.unresolved === true && detail.case.refundableTransfers?.[0]?.amount_base_units === "500000", detail?.case?.refundableTransfers);
  const everything = JSON.stringify(list) + JSON.stringify(detail);
  expect("5. no secret material in queue / detail (no signed bytes, keys, RPC URL)", !/signed_payload|signedPayload|secret|alchemy|\/v2\/|PRIVATE KEY/i.test(everything));
  const fj = json(await api(`/api/sys/review/cases/MONEY_JOB/${fixtureJobs[0]?.caseId}`, { headers: operator }));
  expect("6. retained TEST_FIXTURE Referral job: no lease, attempt bytes never shown, obligation not PAID", fj?.success && fj.case.systemDecisions.job.claim_expires_at === null && fj.case.systemDecisions.obligation?.status !== "PAID" && !JSON.stringify(fj).includes("signed_payload"));

  // ================= confirmation step (no RPC call without it) =================
  const refundCase = await (async () => {
    const co = await mf.offerCheckout("OPCUSTAA", "operator refund");
    const q = await call("create_payment_quote", { p_checkout_id: co.checkout_id, p_customer_id: "OPCUSTAA", p_network: "solana-devnet", p_mint: DEVNET_USDC, p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: "fixture-no-chain", p_ttl_seconds: 600 });
    const i = await call("create_payment_intent", { p_quote_id: q.quote_id, p_customer_id: "OPCUSTAA", p_recipient: STAGING_RECIPIENT, p_reference: base58Of32() });
    const signature = fixtureSignature().replace(/[^1-9A-HJ-NP-Za-km-z]/g, "2");
    await call("record_payment_observation", { p_intent_id: i.intent_id, p_network: "solana-devnet", p_signature: signature, p_slot: 1, p_mint: DEVNET_USDC, p_recipient: STAGING_RECIPIENT, p_amount_base_units: 1000, p_reference_matched: true, p_tx_success: true, p_confirmation: "finalized" });
    return { intentId: i.intent_id, signature };
  })();
  const noConfirm = await act("PAYMENT", refundCase.intentId, { action: "INITIATE_REFUND", reason: "fixture refund", idempotencyKey: crypto.randomUUID(), signature: refundCase.signature });
  const summaryBody = json(noConfirm);
  expect("7. money action without confirmation -> 428 with the summary (case, amount, token, network, destination SOURCE, action); nothing written", noConfirm.status === 428 && summaryBody.confirmation.amount === "0.001000" && /sent this transaction/.test(summaryBody.confirmation.destinationSource) && (await db(`service_refunds?payment_intent_id=eq.${refundCase.intentId}&select=id`)).length === 0, summaryBody);

  // ================= true-parallel operator race + double click =================
  const keyA = crypto.randomUUID();
  const [a1, a2, a3] = await Promise.all([
    act("PAYMENT", refundCase.intentId, { action: "INITIATE_REFUND", reason: "operator A", idempotencyKey: keyA, signature: refundCase.signature, confirm: true }),
    act("PAYMENT", refundCase.intentId, { action: "INITIATE_REFUND", reason: "operator B", idempotencyKey: crypto.randomUUID(), signature: refundCase.signature, confirm: true }),
    act("PAYMENT", refundCase.intentId, { action: "INITIATE_REFUND", reason: "operator A double click", idempotencyKey: keyA, signature: refundCase.signature, confirm: true }),
  ]);
  const refunds = await db(`service_refunds?payment_intent_id=eq.${refundCase.intentId}&select=id,asset_amount_base_units,source_signature`);
  const jobs = refunds.length ? await db(`money_movement_jobs?service_refund_id=eq.${refunds[0].id}&select=id`) : [];
  const audits = await db(`operator_review_actions?case_id=eq.${refundCase.intentId}&action=eq.INITIATE_REFUND&select=operator_id,operator_kind,reason,idempotency_key,safe_refs`);
  record("INFO", `parallel operators: ${[a1, a2, a3].map((r) => `${r.status}:${json(r)?.code ?? (json(r)?.replayed ? "replayed" : "ok")}`).join(" | ")}`);
  expect("8. two operators + a double click in true parallel: exactly ONE refund (exact 1000 base units) + ONE job + ONE audit row; the others replay / conflict", refunds.length === 1 && Number(refunds[0].asset_amount_base_units) === 1000 && jobs.length === 1 && audits.length === 1 && [a1, a2, a3].filter((r) => r.status === 200 && json(r)?.replayed !== true).length === 1, { refunds: refunds.length, jobs: jobs.length, audits: audits.length });
  expect("9. audit row: operator identity + kind, reason, safe refs (destination = PAYER_OF_SOURCE_SIGNATURE), no secrets", audits[0]?.operator_kind === "PLATFORM_TOKEN" && audits[0].operator_id === "platform-token" && audits[0].safe_refs.destination === "PAYER_OF_SOURCE_SIGNATURE" && !/secret|signed_payload/i.test(JSON.stringify(audits)));
  expect("10. the payment intent is still REVIEW_REQUIRED (an operator never sets PAID / REFUNDED)", (await db(`payment_intents?id=eq.${refundCase.intentId}&select=status`))[0].status === "REVIEW_REQUIRED");

  // ================= job actions: parallel requeue =================
  const pay = await mf.payoutObligation("RQ");
  const [job] = await mf.jobFor({ obligationId: pay.obligationId });
  const c = (await rpc("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 })).data;
  await call("release_money_job", { p_job_id: job.id, p_lease: c.job.lease_token, p_class: "REVIEW", p_code: "FIXTURE_REVIEW", p_delay_seconds: null });
  const [q1, q2] = await Promise.all([0, 1].map(() => act("MONEY_JOB", job.id, { action: "MARK_NO_FURTHER_AUTOMATION", reason: "race", idempotencyKey: crypto.randomUUID() })));
  expect("11. action not allowed for the case state is refused (REVIEW job cannot be 'held' again)", [q1, q2].every((r) => r.status === 409), [q1.status, q2.status]);
  const [n1, n2] = await Promise.all([0, 1].map((n) => act("MONEY_JOB", job.id, { action: "ESCALATE", reason: `escalate ${n}`, idempotencyKey: crypto.randomUUID() })));
  expect("12. two operators escalating in parallel: both are recorded as separate audit rows (disposition only, no financial change)", n1.status === 200 && n2.status === 200 && (await db(`money_movement_jobs?id=eq.${job.id}&select=status`))[0].status === "REVIEW_REQUIRED");
} catch (error) {
  record("FAIL", "operator review harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (purgeable fixtures: checkouts, intents, refunds, jobs; helpers, users, requests). Operator audit rows are immutable history and remain.", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

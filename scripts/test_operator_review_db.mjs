// Deterministic test of migration 202609280017 (operator REVIEW_REQUIRED workflow) against the REAL
// migration chain in PGlite: real review cases are produced on 001-016 (wrong payments, stuck / review
// money jobs), then 017 is applied and every rule is exercised. No network, no staging, no chain.
// PGlite is one connection: concurrent operators are exercised as ordered interleavings around the same
// row lock + unique keys; the true-parallel variant runs live on staging once 017 is applied.
// Usage: node scripts/test_operator_review_db.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import { MINT, b58, checker, createDb, fixtures, sqlOf } from "./lib/prepayFixtures.mjs";

const MIGRATION = "202609280017_operator_financial_review.sql";
const { check, done } = checker();
const db = await createDb({ until: MIGRATION });
const f = fixtures(db);
const { one, all, rpc, fails } = f;
await f.enablePolicies();
const key = () => crypto.randomUUID();
const act = (caseType, caseId, action, opts = {}) => rpc("operator_review_action", caseType, caseId, action, opts.operator ?? "ops@life.help", opts.kind ?? "SYS_SESSION", opts.reason ?? "reviewed", opts.key ?? key(), opts.signature ?? null);
const actions = async (caseType, caseId) => (await rpc("review_case_actions", caseType, caseId)).actions;

// ================= review cases produced on 001-016 =================
async function wrongPayment(label, { amount, recipient, reference = true }) {
  const customer = `WP${label}`.padEnd(8, "X").slice(0, 8).toUpperCase();
  const checkout = await f.offerCheckout(customer);
  const q = await rpc("create_payment_quote", checkout.checkout_id, customer, "solana-devnet", MINT, 1400, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
  const i = await rpc("create_payment_intent", q.quote_id, customer, f.recipient, b58());
  const signature = b58(88);
  const obs = await rpc("record_payment_observation", i.intent_id, "solana-devnet", signature, 1, MINT, recipient ?? f.recipient, amount ?? Number(i.amount_base_units), reference, true, "finalized");
  return { intentId: i.intent_id, signature, obs, amountBaseUnits: Number(i.amount_base_units) };
}
const under = await wrongPayment("U", { amount: 25000000 });
const over = await wrongPayment("O", { amount: 60000000 });
const wrongTo = await wrongPayment("W", { amount: 1000, recipient: b58() });
const noRef = await wrongPayment("M", { reference: false });
check("Setup: wrong payments on 001-016 are REVIEW_REQUIRED with their chain classification (no activation)", under.obs.classification === "UNDERPAID" && over.obs.classification === "OVERPAID" && wrongTo.obs.classification === "WRONG_RECIPIENT" && noRef.obs.classification === "MISSING_REFERENCE"
  && (await all("select status::text s from public.payment_intents where id = any($1)", [[under.intentId, over.intentId, wrongTo.intentId, noRef.intentId]])).every((r) => r.s === "REVIEW_REQUIRED"));
// extra payment on an already activated (PAID_HELD) intent
const paid = await f.completedPayout("XTRA");
const extraSig = b58(88);
const extra = await rpc("record_payment_observation", paid.intentId, "solana-devnet", extraSig, 2, MINT, f.recipient, 7000000, true, true, "finalized");
check("Setup: a second payment on a paid intent is recorded EXTRA_PAYMENT (review), the request is untouched", extra.classification === "EXTRA_PAYMENT");
// money jobs: one exhausted (MAX_ATTEMPTS), one stuck in review with a live attempt
const exhausted = await f.completedPayout("EXH");
const jobE = await f.jobFor({ obligationId: exhausted.obligationId });
for (let n = 0; n < 3; n += 1) {
  await f.makeDue(jobE.id);
  const c = await rpc("claim_money_job", jobE.id, 60);
  const a = await rpc("prepare_money_attempt", jobE.id, c.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, exhausted.destination, b58(88), JSON.stringify({ lastValidBlockHeight: 1 }), "cGF5");
  await rpc("mark_money_attempt_submitted", jobE.id, c.job.lease_token, a.attempt_id);
  await rpc("record_money_attempt_result", jobE.id, c.job.lease_token, a.attempt_id, "EXPIRED_NOT_LANDED", "EXPIRED");
}
const liveCase = await f.cancelledRefund("LIVE");
const jobL = await f.jobFor({ refundId: liveCase.refundId });
const cl = await rpc("claim_money_job", jobL.id, 60);
const liveAttempt = await rpc("prepare_money_attempt", jobL.id, cl.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 50000000, b58(), b58(88), JSON.stringify({ lastValidBlockHeight: 1 }), "cmVm");
await rpc("mark_money_attempt_submitted", jobL.id, cl.job.lease_token, liveAttempt.attempt_id);
await rpc("release_money_job", jobL.id, cl.job.lease_token, "REVIEW", "UNKNOWN_TRANSFER_FOR_REFERENCE", null);
check("Setup: an exhausted payout job (MAX_ATTEMPTS) and a refund job in review with a live SUBMITTED attempt", (await one("select status, last_error_code from public.money_movement_jobs where id = $1", [jobE.id])).last_error_code === "MAX_ATTEMPTS" && (await one("select status from public.money_movement_jobs where id = $1", [jobL.id])).status === "REVIEW_REQUIRED");

await db.exec(sqlOf(MIGRATION));
check("017 applies on top of the full real chain (0001 -> 016) with existing review cases", true);

// ================= privileges =================
const priv = await one(`select has_function_privilege('anon', 'public.operator_review_action(text, uuid, text, text, text, text, uuid, text)', 'execute') a,
  has_function_privilege('authenticated', 'public.review_case_actions(text, uuid)', 'execute') b,
  has_function_privilege('service_role', 'public.operator_review_action(text, uuid, text, text, text, text, uuid, text)', 'execute') c,
  has_function_privilege('service_role', 'public.review_case_state(text, uuid)', 'execute') d,
  has_table_privilege('service_role', 'public.operator_review_actions', 'insert') e, has_table_privilege('service_role', 'public.operator_review_actions', 'select') g,
  has_table_privilege('anon', 'public.operator_review_actions', 'select') h`);
check("Privileges: only service_role (operator-authenticated Worker) runs the action RPC; anon / authenticated nothing; audit table SELECT-only; internals private", !priv.a && !priv.b && priv.c && !priv.d && !priv.e && priv.g && !priv.h, priv);
const args = (await one("select pg_get_function_arguments('public.operator_review_action(text, uuid, text, text, text, text, uuid, text)'::regprocedure) a")).a;
check("There is no destination / wallet / amount / status parameter anywhere in the operator write path", !/destination|wallet|address|amount|status/i.test(args), args);
const allActions = (await one("select pg_get_constraintdef(oid) d from pg_constraint where conname = 'operator_review_actions_action_check'")).d;
check("No action exists that sets PAID / SETTLED / REFUNDED / PAID_HELD", !/PAID|SETTLED|REFUNDED|MARK_PAID|SET_STATUS/.test(allActions), allActions);

// ================= PAYMENT cases =================
const ua = await rpc("review_case_actions", "PAYMENT", under.intentId);
check("P1. underpayment: refund available for the exact observed transfer (25.000000 USDC, UNDERPAID); close / escalate / note", ua.actions.join() === "INITIATE_REFUND,CLOSE_AS_REVIEWED,ESCALATE,NOTE" && ua.refundable_transfers.length === 1 && ua.refundable_transfers[0].amount_base_units === "25000000", ua);
check("P2. wrong recipient: the money never reached us -> NO refund action (nothing to return); close / escalate / note only", (await actions("PAYMENT", wrongTo.intentId)).join() === "CLOSE_AS_REVIEWED,ESCALATE,NOTE");
const forcedWrong = await act("PAYMENT", wrongTo.intentId, "INITIATE_REFUND", { signature: wrongTo.signature });
check("P3. refund forced on the wrong-recipient case is refused by the database", forcedWrong.code === "ACTION_NOT_ALLOWED", forcedWrong);
const k1 = key();
const r1 = await act("PAYMENT", under.intentId, "INITIATE_REFUND", { signature: under.signature, key: k1, reason: "customer underpaid; return funds" });
const refundRow = await one("select * from public.service_refunds where source_signature = $1", [under.signature]);
check("P4. INITIATE_REFUND: one OPERATOR_APPROVED refund of EXACTLY the observed base units from that source transfer + one money job; destination = payer of the source (never typed)", r1.success && refundRow.reason === "OPERATOR_APPROVED" && Number(refundRow.asset_amount_base_units) === 25000000 && r1.refs.destination === "PAYER_OF_SOURCE_SIGNATURE" && (await one("select count(*)::int n from public.money_movement_jobs where service_refund_id = $1", [refundRow.id])).n === 1, r1);
check("P5. the payment intent stays REVIEW_REQUIRED (never REFUNDED / PAID_HELD by an operator); event logged", (await one("select status::text s from public.payment_intents where id = $1", [under.intentId])).s === "REVIEW_REQUIRED" && (await one("select count(*)::int n from public.payment_events where payment_intent_id = $1 and event_type = 'OPERATOR_REFUND_REQUESTED'", [under.intentId])).n === 1);
const r1replay = await act("PAYMENT", under.intentId, "INITIATE_REFUND", { signature: under.signature, key: k1 });
const r1dup = await act("PAYMENT", under.intentId, "INITIATE_REFUND", { signature: under.signature });
check("P6. double click (same key) replays; a second operator (new key) is refused; still ONE refund / ONE job", r1replay.replayed === true && r1dup.code === "ACTION_NOT_ALLOWED" && (await one("select count(*)::int n from public.service_refunds where source_signature = $1", [under.signature])).n === 1);
check("P7. an idempotency key cannot be reused for another action", (await act("PAYMENT", under.intentId, "NOTE", { key: k1 })).code === "IDEMPOTENCY_KEY_REUSED");
check("P8. close is refused while the refund is in flight", !(await actions("PAYMENT", under.intentId)).includes("CLOSE_AS_REVIEWED") && (await act("PAYMENT", under.intentId, "CLOSE_AS_REVIEWED")).code === "ACTION_NOT_ALLOWED");
// the refund completes ONLY through the outbox + external confirmation path
const jr = await f.jobFor({ refundId: refundRow.id });
const cr = await rpc("claim_money_job", jr.id, 60);
check("P9. the refund job context carries the source signature + exact amount (payer is derived by the adapter)", cr.job.context.source_signature === under.signature && cr.job.context.asset_amount_base_units === "25000000");
const ra = await rpc("prepare_money_attempt", jr.id, cr.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 25000000, b58(), b58(88), "{}", "cmVm");
await rpc("mark_money_attempt_submitted", jr.id, cr.job.lease_token, ra.attempt_id);
await rpc("record_money_attempt_result", jr.id, cr.job.lease_token, ra.attempt_id, "CONFIRMED", null);
check("P10. confirmed refund -> refund COMPLETED; the intent stays REVIEW_REQUIRED (history); now the case can be closed", (await one("select status from public.service_refunds where id = $1", [refundRow.id])).status === "COMPLETED" && (await one("select status::text s from public.payment_intents where id = $1", [under.intentId])).s === "REVIEW_REQUIRED" && (await actions("PAYMENT", under.intentId)).includes("CLOSE_AS_REVIEWED"));
const closed = await act("PAYMENT", under.intentId, "CLOSE_AS_REVIEWED", { reason: "refunded in full; closing" });
check("P11. CLOSE_AS_REVIEWED: case closed; afterwards only NOTE remains", closed.success && closed.resulting_state.closed === true && (await actions("PAYMENT", under.intentId)).join() === "NOTE");
check("P12. overpayment: the refund is the exact observed amount (60.000000 USDC), never an inferred excess", (await rpc("review_case_actions", "PAYMENT", over.intentId)).refundable_transfers[0].amount_base_units === "60000000");
check("P13. missing reference (money reached us): refundable", (await actions("PAYMENT", noRef.intentId)).includes("INITIATE_REFUND"));
const xa = await rpc("review_case_actions", "PAYMENT", paid.intentId);
check("P14. extra payment on a paid intent: only the extra transfer is refundable (7.000000 USDC); the activated request is untouched", xa.actions.includes("INITIATE_REFUND") && xa.refundable_transfers.length === 1 && xa.refundable_transfers[0].signature === extraSig);
check("P15. a signature that is not a refundable transfer of THIS case is refused", (await act("PAYMENT", over.intentId, "INITIATE_REFUND", { signature: under.signature })).code === "TRANSFER_NOT_REFUNDABLE");

// ================= MONEY_JOB cases =================
check("J1. exhausted job (no live attempt): reconcile, requeue, close, escalate, note", (await actions("MONEY_JOB", jobE.id)).join() === "RETRY_RECONCILIATION,REQUEUE_SAFE,CLOSE_AS_REVIEWED,ESCALATE,NOTE");
const qk = key();
const rq = await act("MONEY_JOB", jobE.id, "REQUEUE_SAFE", { key: qk, reason: "provider outage over" });
const jobE2 = await one("select status, automation_policy, max_attempts, attempt_count, failure_count from public.money_movement_jobs where id = $1", [jobE.id]);
check("J2. REQUEUE_SAFE: back to automation with exactly one more attempt budget; failure counter reset; SAME job (no duplicate)", rq.success && jobE2.status === "RETRYABLE" && jobE2.automation_policy === "AUTO" && jobE2.max_attempts === 4 && jobE2.failure_count === 0 && (await one("select count(*)::int n from public.money_movement_jobs where payout_obligation_id = $1", [exhausted.obligationId])).n === 1, jobE2);
check("J3. requeue replay (same key) is a no-op; a second operator's requeue is refused", (await act("MONEY_JOB", jobE.id, "REQUEUE_SAFE", { key: qk })).replayed === true && (await act("MONEY_JOB", jobE.id, "REQUEUE_SAFE")).code === "ACTION_NOT_ALLOWED" && (await one("select max_attempts from public.money_movement_jobs where id = $1", [jobE.id])).max_attempts === 4);
const hold = await act("MONEY_JOB", jobE.id, "MARK_NO_FURTHER_AUTOMATION", { reason: "hold while investigating" });
check("J4. MARK_NO_FURTHER_AUTOMATION on an automated job -> REVIEW_REQUIRED (OPERATOR_HOLD), nothing else changes", hold.success && (await one("select status, last_error_code from public.money_movement_jobs where id = $1", [jobE.id])).last_error_code === "OPERATOR_HOLD");
check("J5. job with a LIVE attempt: requeue is NOT offered (reconcile first); reconciliation is", (await actions("MONEY_JOB", jobL.id)).join() === "RETRY_RECONCILIATION,CLOSE_AS_REVIEWED,ESCALATE,NOTE");
const rr = await act("MONEY_JOB", jobL.id, "RETRY_RECONCILIATION", { reason: "check the same signature again" });
check("J6. RETRY_RECONCILIATION: job due again with automation_policy RECONCILE_ONLY", rr.success && (await one("select status, automation_policy from public.money_movement_jobs where id = $1", [jobL.id])).automation_policy === "RECONCILE_ONLY");
const c2 = await rpc("claim_money_job", jobL.id, 60);
check("J7. the reconciler gets the SAME live attempt (same signature) back", c2.job.live_attempt?.attempt_id === liveAttempt.attempt_id);
const notLanded = await rpc("record_money_attempt_result", jobL.id, c2.job.lease_token, liveAttempt.attempt_id, "EXPIRED_NOT_LANDED", "EXPIRED");
check("J8. reconciliation proves non-landing -> back to REVIEW_REQUIRED (RECONCILED_NOT_LANDED), NOT an automatic replacement", notLanded.status === "REVIEW_REQUIRED" && (await one("select last_error_code from public.money_movement_jobs where id = $1", [jobL.id])).last_error_code === "RECONCILED_NOT_LANDED");
await act("MONEY_JOB", jobL.id, "RETRY_RECONCILIATION", { reason: "reconcile again (no live attempt now)" });
const c3 = await rpc("claim_money_job", jobL.id, 60);
const refusedPrep = await rpc("prepare_money_attempt", jobL.id, c3.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 50000000, b58(), b58(88), "{}", "cmVm");
check("J9. under RECONCILE_ONLY a NEW external attempt can never be prepared (database refuses -> REVIEW_REQUIRED)", refusedPrep.code === "RECONCILE_ONLY_NO_NEW_ATTEMPT" && (await one("select count(*)::int n from public.money_movement_attempts where job_id = $1", [jobL.id])).n === 1);
const lease = await rpc("claim_money_job", (await f.jobFor({ obligationId: (await f.completedPayout("LSE")).obligationId })).id, 60);
check("J10. a job whose lease is held offers no reconcile / requeue / hold", !(await actions("MONEY_JOB", lease.job.job_id)).some((a) => ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "MARK_NO_FURTHER_AUTOMATION"].includes(a)));
const paidJob = await f.jobFor({ obligationId: paid.obligationId });
const cp = await rpc("claim_money_job", paidJob.id, 60);
const pa = await rpc("prepare_money_attempt", paidJob.id, cp.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, paid.destination, b58(88), "{}", "cGF5");
await rpc("mark_money_attempt_submitted", paidJob.id, cp.job.lease_token, pa.attempt_id);
await rpc("record_money_attempt_result", paidJob.id, cp.job.lease_token, pa.attempt_id, "CONFIRMED", null);
check("J11. a CONFIRMED job whose obligation is PAID offers only escalate / note (no reconcile / requeue / close)", (await one("select status from public.payout_obligations where id = $1", [paid.obligationId])).status === "PAID" && (await actions("MONEY_JOB", paidJob.id)).join() === "ESCALATE,NOTE");
check("J12. invalid requests: empty reason / unknown operator kind -> INVALID_REQUEST; unknown case -> CASE_NOT_FOUND", (await act("MONEY_JOB", jobE.id, "NOTE", { reason: " " })).code === "INVALID_REQUEST" && (await act("MONEY_JOB", jobE.id, "NOTE", { kind: "CUSTOMER" })).code === "INVALID_REQUEST" && (await act("MONEY_JOB", crypto.randomUUID(), "NOTE")).code === "CASE_NOT_FOUND");

// ================= audit =================
const audit = await all("select * from public.operator_review_actions order by created_at");
check("A1. every successful action wrote exactly one audit row (operator, kind, case, action, previous / resulting state, reason, refs)", audit.length === 6 && audit.every((a) => a.operator_id && a.operator_kind && a.reason && a.previous_state && a.resulting_state && a.idempotency_key));
check("A2. audit is immutable (no update / delete) and carries no secret material", !!(await fails("update public.operator_review_actions set reason = 'x' where id = $1", [audit[0].id])) && !!(await fails("delete from public.operator_review_actions where id = $1", [audit[0].id])) && !/signed_payload|secret|private|api[_-]?key/i.test(JSON.stringify(audit)));

// ================= static: routes / console =================
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const listRoute = read("app/api/sys/review/cases/route.ts"), detailRoute = read("app/api/sys/review/cases/[caseType]/[caseId]/route.ts"), actionRoute = read("app/api/sys/review/cases/[caseType]/[caseId]/actions/route.ts"), lib = read("lib/admin/reviewCases.ts");
check("S1. every operator route fails closed on the platform-operator check (SYS session / operator token) and is staging-only", [listRoute, detailRoute].every((r) => r.includes("authorizePlatformOperator(request)")) && actionRoute.includes("authorizePlatformOperatorIdentity(request)") && [listRoute, detailRoute, actionRoute].every((r) => r.includes("createStagingSettlementClient()")));
check("S2. money actions need an explicit second confirmation (428 + summary) before the RPC is called", actionRoute.indexOf("CONFIRMATION_REQUIRED") < actionRoute.indexOf('client.rpc("operator_review_action"') && lib.includes('MONEY_ACTIONS: ReviewAction[] = ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "INITIATE_REFUND"]'));
check("S3. the action route accepts no destination / amount / status from the operator", !/body\?\.(destination|amount|status|wallet|address)/.test(actionRoute));
check("S4. the console data layer never selects signed bytes (explicit column lists only)", !/signed_payload|select\("\*"\)|select\('\*'\)/.test(lib));
check("S5. console page is SYS-session gated", read("app/admin/review/page.tsx").includes("verifySysSessionToken") && read("app/admin/review/page.tsx").includes('redirect("/admin/login")'));

done();

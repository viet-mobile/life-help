// Deterministic test of migration 202609290023 (provider-reported-paid authority) on the REAL chain in PGlite.
// The exact sequence that exposed the 022 defect is run twice: on 001-022 (the defect reproduces: attempt #2)
// and on 001-023 (REVIEW_REQUIRED, no attempt #2, no new provider key).
// PGlite has one connection: "races" here are every sequential interleaving of the competing operations; truly
// parallel variants run on staging after the migration is applied.
// Usage: node scripts/test_provider_reported_paid_db.mjs
import crypto from "node:crypto";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const MIGRATION_023 = "202609290023_provider_reported_paid_authority.sql";

async function world({ until } = {}) {
  const db = await createDb({ until });
  const f = fixtures(db);
  await f.enablePolicies();
  await db.exec("alter role service_role bypassrls");
  const named = async (fn, args) => { const k = Object.keys(args); return (await f.one(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(", ")}) as r`, k.map((x) => args[x]))).r; };
  for (const [code, kind] of [["AIRWALLEX", "PSP"]]) await db.query("insert into public.payment_providers (code, environment, kind, enabled, approved_by, approved_at) values ($1, 'SANDBOX', $2, true, 'test', now())", [code, kind]);
  await db.query("update public.payment_providers set enabled = true, approved_by = 'test', approved_at = now() where code = 'MOCK_PROVIDER' and environment = 'SANDBOX'");
  for (const [p, rail] of [["AIRWALLEX", "AIRWALLEX_RAIL"], ["MOCK_PROVIDER", "MOCK_RAIL"]]) for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT"]) {
    await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, $2, 'SANDBOX', $3, true, 'test', now()) on conflict do nothing", [cap, p, rail]);
  }
  let n = 0, evn = 0;
  const ingest = (o) => named("ingest_provider_event", {
    p_provider: o.provider ?? "AIRWALLEX", p_environment: "SANDBOX", p_provider_account: "acct", p_provider_event_id: o.id ?? `evt_${++evn}_${crypto.randomUUID().slice(0, 8)}`,
    p_source: "WEBHOOK", p_event_type: o.type, p_provider_event_type: o.type.toLowerCase(), p_object_ref: o.object, p_life_help_reference: null,
    p_amount_minor: o.amount ?? null, p_currency: o.currency ?? null, p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: crypto.createHash("sha256").update(`${evn}${o.type}${o.object}${Math.random()}`).digest("hex"), p_signature_verified: true,
  });
  /** A provider-funded, customer-confirmed Helper payout job with attempt #1 prepared under a fresh lease. */
  async function payoutJob(label, provider = "AIRWALLEX") {
    n += 1;
    const sido = `RP${label}${n}`;
    const h = await f.helper(`RP${label}${n}`, { sido });
    const price = await f.rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }), true);
    const customer = `R${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
    const co = await f.helperCheckout(price, customer, sido);
    const opened = await named("open_provider_payment_intent", { p_checkout_id: co.checkout_id, p_customer_id: customer, p_provider: provider, p_environment: "SANDBOX", p_provider_account: "acct", p_reference: b58(), p_ttl_seconds: 900 });
    const payId = `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    await named("link_provider_payment", { p_intent_id: opened.intent_id, p_provider_payment_id: payId });
    await ingest({ provider, type: "PAYMENT_HELD", object: payId, amount: 60000, currency: "KRW" });
    const req = (await f.one("select request_id from public.payment_intents where id = $1", [opened.intent_id])).request_id;
    await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', $2, 'SANDBOX', $3, 'x ****', 'ACTIVE')", [h.id, provider, `benef_${label}${n}_x`]);
    const [asg] = await f.activeAssignments(req);
    await f.rpc("accept_assignment", asg.id, h.id);
    await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [req]);
    await f.rpc("complete_assignment_service", asg.id, h.id);
    await f.rpc("confirm_service_completion", req, customer);
    const ob = await f.one("select * from public.payout_obligations where request_id = $1", [req]);
    const job = await f.jobFor({ obligationId: ob.id });
    const claim = await f.rpc("claim_money_job", job.id, 60);
    const key = (i) => `lh_${job.id.replace(/-/g, "")}_${i}`;
    const prep = await f.rpc("prepare_money_attempt", job.id, claim.job.lease_token, provider, `provider:${provider}:SANDBOX`, "KRW", 60000, `benef_${label}${n}_x`, key(1), JSON.stringify({ kind: "HELPER_PAYOUT", reference: job.id }), "{}");
    return { req, ob, job, lease: claim.job.lease_token, attemptId: prep.attempt_id, extId: key(1), key, provider, dest: `benef_${label}${n}_x` };
  }
  /** Due + free (test clock only): the NEXT trusted claim may run now instead of in an hour. */
  const due = (id) => db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second', claim_expires_at = null where id = $1", [id]);
  const claim = async (id) => { await due(id); return f.rpc("claim_money_job", id, 60); };
  const jobRow = (id) => f.one("select status, last_error_code, attempt_count, automation_policy from public.money_movement_jobs where id = $1", [id]);
  const hasMarker = !!(await f.one("select 1 x from information_schema.columns where table_name = 'money_movement_attempts' and column_name = 'provider_reported_paid_at'"));
  const attempts = (id) => f.all(`select id, attempt_number, state, external_id${hasMarker ? ", provider_reported_paid_at" : ""} from public.money_movement_attempts where job_id = $1 order by attempt_number`, [id]);
  return { db, f, named, ingest, payoutJob, due, claim, jobRow, attempts };
}

/** The exact 022 defect sequence. Returns what happened at every step. */
async function defectSequence(w) {
  const p = await w.payoutJob("DEF");
  const paid = await w.f.rpc("record_money_attempt_result", p.job.id, p.lease, p.attemptId, "PROVIDER_REPORTED_PAID", null);
  const c2 = await w.claim(p.job.id);
  const rel1 = await w.f.rpc("release_money_job", p.job.id, c2.job.lease_token, "RETRYABLE", "PROVIDER_LOOKUP_UNKNOWN", null);
  const afterLookup = await w.jobRow(p.job.id);
  const c3 = await w.claim(p.job.id);
  const rel2 = await w.f.rpc("release_money_job", p.job.id, c3.job.lease_token, "WAITING", "AWAITING_NETWORK", 15);
  const c4 = await w.claim(p.job.id);
  const failed = await w.f.rpc("record_money_attempt_result", p.job.id, c4.job.lease_token, p.attemptId, "FAILED_ONCHAIN", "BENEFICIARY_BANK_REJECTED");
  const afterFail = await w.jobRow(p.job.id);
  const c5 = await w.claim(p.job.id);
  const second = c5?.success ? await w.f.rpc("prepare_money_attempt", p.job.id, c5.job.lease_token, p.provider, `provider:${p.provider}:SANDBOX`, "KRW", 60000, p.dest, p.key(2), "{}", "{}") : null;
  const atts = await w.attempts(p.job.id);
  return { p, paid, rel1, rel2, afterLookup, failed, afterFail, reclaim: c5, second, atts, ob: (await w.f.one("select status from public.payout_obligations where id = $1", [p.ob.id])).status };
}

// ================= 0. the defect: 022 only vs 022 + 023 =================
const old = await world({ until: MIGRATION_023 });
const bug = await defectSequence(old);
check("0a. on 001-022 the defect REPRODUCES (baseline): reported paid -> lookup-unknown + awaiting-network releases overwrite the job marker -> FAILED becomes RETRYABLE -> attempt #2 with a NEW provider key is accepted",
  bug.paid?.status === "PROVIDER_PAID_AWAITING_FINALITY" && bug.afterLookup.last_error_code === "PROVIDER_LOOKUP_UNKNOWN" && bug.failed?.status === "RETRYABLE" && bug.second?.success === true && bug.atts.length === 2,
  { failed: bug.failed, second: bug.second, attempts: bug.atts.length });

const w = await world();
const { db, f } = w;
const fixed = await defectSequence(w);
check("0b. on 001-023 the same sequence: evidence set on reported paid and SURVIVES both releases; FAILED -> REVIEW_REQUIRED (PROVIDER_FAILED_AFTER_REPORTED_PAID); re-claim refused (JOB_FINAL); NO attempt #2, no new provider key; obligation never PAID",
  fixed.paid?.status === "PROVIDER_PAID_AWAITING_FINALITY" && !!fixed.paid.reported_paid_at && fixed.afterLookup.last_error_code === "PROVIDER_LOOKUP_UNKNOWN" && fixed.atts[0].provider_reported_paid_at !== null
  && fixed.failed?.status === "REVIEW_REQUIRED" && fixed.failed.code === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && fixed.afterFail.status === "REVIEW_REQUIRED"
  && fixed.reclaim?.code === "JOB_FINAL" && fixed.second === null && fixed.atts.length === 1 && fixed.atts.every((a) => a.external_id === fixed.p.key(1)) && fixed.ob !== "PAID",
  { failed: fixed.failed, reclaim: fixed.reclaim, attempts: fixed.atts.length });

// ================= 1. schema / immutability / privileges =================
const col = await f.one("select data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'money_movement_attempts' and column_name = 'provider_reported_paid_at'");
const priv = await f.one("select has_column_privilege('service_role', 'public.money_movement_attempts', 'provider_reported_paid_at', 'UPDATE') u, has_table_privilege('service_role', 'public.money_movement_attempts', 'INSERT') i, has_table_privilege('service_role', 'public.money_movement_attempts', 'SELECT') s, has_table_privilege('anon', 'public.money_movement_attempts', 'SELECT') a");
check("1a. provider_reported_paid_at: nullable timestamptz; app role SELECT only (no UPDATE / INSERT), anon nothing - no new mutation surface", col?.data_type === "timestamp with time zone" && col.is_nullable === "YES" && !priv.u && !priv.i && priv.s && !priv.a, { col, priv });
const marked = fixed.atts[0];
const tryUpd = async (sql, params) => { try { await db.query(sql, params); return null; } catch (e) { return e.message; } };
const clear = await tryUpd("update public.money_movement_attempts set provider_reported_paid_at = null where id = $1", [marked.id]);
const change = await tryUpd("update public.money_movement_attempts set provider_reported_paid_at = now() - interval '1 day' where id = $1", [marked.id]);
const q = await w.payoutJob("IMM");
const noAuthority = await tryUpd("update public.money_movement_attempts set provider_reported_paid_at = now() where id = $1", [q.attemptId]);
const qt = await w.payoutJob("TERM");
await f.rpc("record_money_attempt_result", qt.job.id, qt.lease, qt.attemptId, "FAILED_ONCHAIN", "X"); // terminal, never reported paid
await db.exec("begin; select set_config('life_help.reported_paid_authority', 'on', true);");
const terminalSet = await tryUpd("update public.money_movement_attempts set provider_reported_paid_at = now() where id = $1", [qt.attemptId]);
await db.exec("rollback;");
const insertMarked = await tryUpd("insert into public.money_movement_attempts (job_id, attempt_number, provider, network, asset, amount_base_units, destination, external_id, provider_reported_paid_at) values ($1, 9, 'AIRWALLEX', 'provider:AIRWALLEX:SANDBOX', 'KRW', 60000, 'benef_forged_x', 'lh_forged_key_0001', now())", [q.job.id]);
const insertAfter = await tryUpd("insert into public.money_movement_attempts (job_id, attempt_number, provider, network, asset, amount_base_units, destination, external_id) values ($1, 2, 'AIRWALLEX', 'provider:AIRWALLEX:SANDBOX', 'KRW', 60000, 'benef_forged_x', 'lh_forged_key_0002')", [fixed.p.job.id]);
await db.exec("set role service_role");
const appUpd = await tryUpd("update public.money_movement_attempts set provider_reported_paid_at = now() where id = $1", [q.attemptId]);
await db.exec("reset role");
check("1b. database-enforced evidence (even the table owner): cannot be cleared or changed; cannot be set outside record_money_attempt_result's authority; cannot be set on a terminal attempt; an attempt can never be INSERTed carrying it; no attempt can be INSERTed into a job that has it; the app role cannot UPDATE at all",
  /immutable/.test(clear ?? "") && /immutable/.test(change ?? "") && /only by record_money_attempt_result/.test(noAuthority ?? "") && /only on a live attempt/.test(terminalSet ?? "")
  && /never starts with/.test(insertMarked ?? "") && /no new attempt/.test(insertAfter ?? "") && /permission denied/.test(appUpd ?? ""),
  { clear, change, noAuthority, terminalSet, insertMarked, insertAfter, appUpd });
check("1c. the caller cannot choose the timestamp: record_money_attempt_result takes no time argument; the evidence is database time", /^\d{4}-/.test(new Date(fixed.paid.reported_paid_at).toISOString()) && Math.abs(Date.now() - Date.parse(fixed.paid.reported_paid_at)) < 10 * 60_000);

// ================= 2. idempotency / replay =================
const r = await w.payoutJob("DUP");
const first = await f.rpc("record_money_attempt_result", r.job.id, r.lease, r.attemptId, "PROVIDER_REPORTED_PAID", null);
const stamps = [];
for (let i = 0; i < 10; i += 1) {
  const c = await w.claim(r.job.id);
  if (i % 3 === 0) await f.rpc("release_money_job", r.job.id, c.job.lease_token, "RETRYABLE", "UNRELATED_TIMEOUT", null);
  else stamps.push((await f.rpc("record_money_attempt_result", r.job.id, c.job.lease_token, r.attemptId, i % 2 ? "PROVIDER_REPORTED_PAID" : "CONFIRMED", null))?.reported_paid_at);
}
const dupWebhook = await w.ingest({ type: "PAYOUT_REPORTED_PAID", object: r.extId, amount: 60000, currency: "KRW" });
const dupConfirm = await w.ingest({ type: "PAYOUT_CONFIRMED", object: r.extId, amount: 60000, currency: "KRW" });
const rAtt = (await w.attempts(r.job.id))[0];
check("2a. duplicate reported-paid x10 (poll results, NO_FINAL CONFIRMED claims, interleaved unrelated retryable releases) + webhook duplicates: the evidence keeps its FIRST timestamp; webhook replay -> REPLAY_NO_CHANGE (ALREADY_REPORTED_PAID) decided by the ATTEMPT evidence although the job code was overwritten; one attempt; obligation not PAID",
  stamps.length > 0 && stamps.every((s) => s === first.reported_paid_at) && new Date(rAtt.provider_reported_paid_at).toISOString() === new Date(first.reported_paid_at).toISOString()
  && dupWebhook.result === "REPLAY_NO_CHANGE" && dupWebhook.code === "ALREADY_REPORTED_PAID" && dupConfirm.result === "REPLAY_NO_CHANGE" && (await w.attempts(r.job.id)).length === 1
  && (await f.one("select status from public.payout_obligations where id = $1", [r.ob.id])).status !== "PAID", { dupWebhook, dupConfirm, stamps: new Set(stamps).size });
const c9 = await w.claim(r.job.id);
await f.rpc("release_money_job", r.job.id, c9.job.lease_token, "RETRYABLE", "PROVIDER_LOOKUP_UNKNOWN", null);
await db.query("update public.money_movement_jobs set claim_expires_at = null where id = $1", [r.job.id]);
const failWebhook = await w.ingest({ type: "PAYOUT_FAILED", object: r.extId });
check("2b. webhook FAILED after reported paid (job code overwritten meanwhile, job not even due) -> APPLIED -> REVIEW_REQUIRED (PROVIDER_FAILED_AFTER_REPORTED_PAID)", failWebhook.result === "APPLIED" && (await w.jobRow(r.job.id)).status === "REVIEW_REQUIRED" && (await w.jobRow(r.job.id)).last_error_code === "PROVIDER_FAILED_AFTER_REPORTED_PAID", failWebhook);

// ================= 3. every attempt-creation path is closed =================
const s = await w.payoutJob("PATHS");
await f.rpc("record_money_attempt_result", s.job.id, s.lease, s.attemptId, "PROVIDER_REPORTED_PAID", null);
const sLive = await w.claim(s.job.id);
const whileLive = await f.rpc("prepare_money_attempt", s.job.id, sLive.job.lease_token, s.provider, `provider:${s.provider}:SANDBOX`, "KRW", 60000, s.dest, s.key(2), "{}", "{}");
await f.rpc("release_money_job", s.job.id, sLive.job.lease_token, "WAITING", "AWAITING_NETWORK", 15);
const cF = await w.claim(s.job.id);
await f.rpc("record_money_attempt_result", s.job.id, cF.job.lease_token, s.attemptId, "EXPIRED_NOT_LANDED", "EXPIRED");
const afterExpire = await w.jobRow(s.job.id);
// Accidental / operational state change (owner-level, simulating any bug): the job is made RETRYABLE + AUTO again.
await db.query("update public.money_movement_jobs set status = 'RETRYABLE', automation_policy = 'AUTO', last_error_code = 'SOMETHING_ELSE', next_retry_at = now() - interval '1 second', claim_expires_at = null where id = $1", [s.job.id]);
const cWorker = await f.rpc("claim_money_job", null, 60); // retry worker (queue sweep) path
const sweptOurs = cWorker?.job?.job_id === s.job.id;
const cAgain = sweptOurs ? cWorker : await f.rpc("claim_money_job", s.job.id, 60);
const workerPrep = await f.rpc("prepare_money_attempt", s.job.id, cAgain.job.lease_token, s.provider, `provider:${s.provider}:SANDBOX`, "KRW", 60000, s.dest, s.key(2), "{}", "{}");
const sAfter = await w.jobRow(s.job.id);
const actions = await f.rpc("review_case_actions", "MONEY_JOB", s.job.id);
const opKey = crypto.randomUUID();
const requeue = await f.rpc("operator_review_action", "MONEY_JOB", s.job.id, "REQUEUE_SAFE", "op-test", "PLATFORM_TOKEN", "try requeue", opKey, null);
const reconcile = await f.rpc("operator_review_action", "MONEY_JOB", s.job.id, "RETRY_RECONCILIATION", "op-test", "PLATFORM_TOKEN", "reconcile existing object", crypto.randomUUID(), null);
const cRec = await f.rpc("claim_money_job", s.job.id, 60);
const recPrep = cRec?.success ? await f.rpc("prepare_money_attempt", s.job.id, cRec.job.lease_token, s.provider, `provider:${s.provider}:SANDBOX`, "KRW", 60000, s.dest, s.key(2), "{}", "{}") : null;
const sAtts = await w.attempts(s.job.id);
check("3a. prepare while the reported-paid attempt is live -> LIVE_ATTEMPT_EXISTS (reconcile THAT attempt; no new attempt)", whileLive?.code === "LIVE_ATTEMPT_EXISTS", whileLive);
check("3b. EXPIRED_NOT_LANDED after reported paid is a failure too -> REVIEW_REQUIRED (PROVIDER_FAILED_AFTER_REPORTED_PAID)", afterExpire.status === "REVIEW_REQUIRED" && afterExpire.last_error_code === "PROVIDER_FAILED_AFTER_REPORTED_PAID", afterExpire);
check("3c. even if the job is operationally/accidentally made RETRYABLE + AUTO again, the retry worker's claim -> prepare refuses (PROVIDER_REPORTED_PAID_REQUIRES_REVIEW) and returns the job to REVIEW_REQUIRED - no endless retry", workerPrep?.success === false && workerPrep.code === "PROVIDER_REPORTED_PAID_REQUIRES_REVIEW" && sAfter.status === "REVIEW_REQUIRED" && sAfter.last_error_code === "PROVIDER_REPORTED_PAID_REQUIRES_REVIEW", { workerPrep, sAfter });
check("3d. operator review: REQUEUE_SAFE is not offered and is refused (ACTION_NOT_ALLOWED); RETRY_RECONCILIATION (the EXISTING object) stays available but never creates a new attempt (RECONCILE_ONLY_NO_NEW_ATTEMPT); NOTE / ESCALATE / CLOSE remain",
  actions.provider_reported_paid === true && !actions.actions.includes("REQUEUE_SAFE") && actions.actions.includes("RETRY_RECONCILIATION") && actions.actions.includes("NOTE") && actions.actions.includes("ESCALATE") && actions.actions.includes("CLOSE_AS_REVIEWED")
  && requeue?.code === "ACTION_NOT_ALLOWED" && reconcile?.success === true && recPrep?.success === false && recPrep.code === "RECONCILE_ONLY_NO_NEW_ATTEMPT", { actions: actions.actions, requeue: requeue?.code, recPrep });
check("3e. across every path: still exactly ONE attempt, evidence intact, obligation not PAID", sAtts.length === 1 && sAtts[0].provider_reported_paid_at !== null && (await f.one("select status from public.payout_obligations where id = $1", [s.ob.id])).status !== "PAID", sAtts.length);

// ================= 4. races (every sequential interleaving; one connection) =================
const r1 = await w.payoutJob("RACE1");
const relFirst = await f.rpc("release_money_job", r1.job.id, r1.lease, "RETRYABLE", "PROVIDER_LOOKUP_UNKNOWN", null);
const paidAfterRelease = await f.rpc("record_money_attempt_result", r1.job.id, r1.lease, r1.attemptId, "PROVIDER_REPORTED_PAID", null);
const r1b = await w.claim(r1.job.id);
const paidAfterReclaim = await f.rpc("record_money_attempt_result", r1.job.id, r1b.job.lease_token, r1.attemptId, "PROVIDER_REPORTED_PAID", null);
const relAfterPaid = await f.rpc("release_money_job", r1.job.id, r1b.job.lease_token, "RETRYABLE", "PROVIDER_LOOKUP_UNKNOWN", null);
check("4a. reported-paid vs retryable release (both orders): release first -> the stale lease cannot record (LEASE_LOST), the next claim records it; paid first -> the later release on the same (now released) lease is refused (LEASE_LOST); evidence set once",
  relFirst?.success && paidAfterRelease?.code === "LEASE_LOST" && paidAfterReclaim?.status === "PROVIDER_PAID_AWAITING_FINALITY" && relAfterPaid?.code === "LEASE_LOST" && (await w.attempts(r1.job.id))[0].provider_reported_paid_at !== null);
const r2 = await w.payoutJob("RACE2");
const prepFirst = await f.rpc("prepare_money_attempt", r2.job.id, r2.lease, r2.provider, `provider:${r2.provider}:SANDBOX`, "KRW", 60000, r2.dest, r2.key(2), "{}", "{}");
await f.rpc("record_money_attempt_result", r2.job.id, r2.lease, r2.attemptId, "PROVIDER_REPORTED_PAID", null);
const r2c = await w.claim(r2.job.id);
const prepAfter = await f.rpc("prepare_money_attempt", r2.job.id, r2c.job.lease_token, r2.provider, `provider:${r2.provider}:SANDBOX`, "KRW", 60000, r2.dest, r2.key(2), "{}", "{}");
check("4b. reported-paid vs prepare-next-attempt (both orders): before -> LIVE_ATTEMPT_EXISTS; after -> LIVE_ATTEMPT_EXISTS while live (and REVIEW once terminal, 3c); never attempt #2", prepFirst?.code === "LIVE_ATTEMPT_EXISTS" && prepAfter?.code === "LIVE_ATTEMPT_EXISTS" && (await w.attempts(r2.job.id)).length === 1);
const r3 = await w.payoutJob("RACE3");
await f.rpc("release_money_job", r3.job.id, r3.lease, "REVIEW", "SOME_REVIEW", null);
const opBefore = await f.rpc("review_case_actions", "MONEY_JOB", r3.job.id);
const opQueue = await f.rpc("operator_review_action", "MONEY_JOB", r3.job.id, "RETRY_RECONCILIATION", "op-test", "PLATFORM_TOKEN", "reconcile", crypto.randomUUID(), null);
const r3c = await w.claim(r3.job.id);
const r3paid = await f.rpc("record_money_attempt_result", r3.job.id, r3c.job.lease_token, r3.attemptId, "PROVIDER_REPORTED_PAID", null);
await db.query("update public.money_movement_jobs set status = 'REVIEW_REQUIRED', claim_expires_at = null where id = $1", [r3.job.id]);
const opAfter = await f.rpc("review_case_actions", "MONEY_JOB", r3.job.id);
check("4c. reported-paid vs operator requeue: with a live attempt REQUEUE_SAFE is never offered (reconcile only); once the evidence exists REQUEUE_SAFE stays unavailable in any status", !opBefore.actions.includes("REQUEUE_SAFE") && opQueue?.success && r3paid?.status === "PROVIDER_PAID_AWAITING_FINALITY" && !opAfter.actions.includes("REQUEUE_SAFE"), { before: opBefore.actions, after: opAfter.actions });
const r4 = await w.payoutJob("RACE4");
await f.rpc("record_money_attempt_result", r4.job.id, r4.lease, r4.attemptId, "PROVIDER_REPORTED_PAID", null);
const r4c = await w.claim(r4.job.id);
const r4fail = await f.rpc("record_money_attempt_result", r4.job.id, r4c.job.lease_token, r4.attemptId, "FAILED_ONCHAIN", "X");
const r4worker = await w.claim(r4.job.id);
const r4webhookFail = await w.ingest({ type: "PAYOUT_FAILED", object: r4.extId });
check("4d. FAILED vs retry worker after reported paid: FAILED -> REVIEW; the worker's claim -> JOB_FINAL; a racing duplicate FAILED webhook -> REPLAY (ALREADY_TERMINAL)", r4fail?.status === "REVIEW_REQUIRED" && r4worker?.code === "JOB_FINAL" && r4webhookFail.result === "REPLAY_NO_CHANGE", { r4fail, r4worker: r4worker?.code, r4webhookFail });
const r5 = await w.payoutJob("RACE5");
await db.query("update public.money_movement_jobs set claim_expires_at = now() + interval '60 seconds' where id = $1", [r5.job.id]); // poller holds the lease
const r5hook = await w.ingest({ type: "PAYOUT_REPORTED_PAID", object: r5.extId, amount: 60000, currency: "KRW" });
const r5poll = await f.rpc("record_money_attempt_result", r5.job.id, r5.lease, r5.attemptId, "PROVIDER_REPORTED_PAID", null);
const r5hook2 = await w.ingest({ type: "PAYOUT_REPORTED_PAID", object: r5.extId, amount: 60000, currency: "KRW" });
check("4e. reported-paid webhook vs poll: webhook defers while the poller holds the lease; the poll records it once; the later webhook replays (ALREADY_REPORTED_PAID); one attempt, evidence once", r5hook.result === "DEFERRED_TO_RECONCILE" && r5poll?.status === "PROVIDER_PAID_AWAITING_FINALITY" && r5hook2.code === "ALREADY_REPORTED_PAID" && (await w.attempts(r5.job.id)).length === 1, { r5hook, r5hook2 });

// ================= 5. final providers / Solana unchanged =================
const m = await w.payoutJob("MOCKF", "MOCK_PROVIDER");
const mPlain = await f.rpc("record_money_attempt_result", m.job.id, m.lease, m.attemptId, "CONFIRMED", null);
const mAtt = (await w.attempts(m.job.id))[0];
check("5a. MOCK_PROVIDER (PROVIDER_FINAL_STATUS) plain final confirmation unchanged: attempt CONFIRMED, obligation PAID, job CONFIRMED, no reported-paid evidence", mPlain?.status === "CONFIRMED" && mAtt.state === "CONFIRMED" && mAtt.provider_reported_paid_at === null && (await f.one("select status from public.payout_obligations where id = $1", [m.ob.id])).status === "PAID");
const m2 = await w.payoutJob("MOCKRP", "MOCK_PROVIDER");
await f.rpc("record_money_attempt_result", m2.job.id, m2.lease, m2.attemptId, "PROVIDER_REPORTED_PAID", null);
const m2c = await w.claim(m2.job.id);
const m2final = await f.rpc("record_money_attempt_result", m2.job.id, m2c.job.lease_token, m2.attemptId, "CONFIRMED", null);
const m2Att = await w.attempts(m2.job.id);
check("5b. defined: a FINAL provider that first reports paid and later sends its explicit final confirmation completes on the SAME attempt (no second attempt needed): CONFIRMED, obligation PAID, evidence kept as history", m2final?.status === "CONFIRMED" && m2Att.length === 1 && m2Att[0].state === "CONFIRMED" && m2Att[0].provider_reported_paid_at !== null && (await f.one("select status from public.payout_obligations where id = $1", [m2.ob.id])).status === "PAID", m2final);
const a2 = await w.payoutJob("AWXRP");
await f.rpc("record_money_attempt_result", a2.job.id, a2.lease, a2.attemptId, "PROVIDER_REPORTED_PAID", null);
const a2c = await w.claim(a2.job.id);
const a2conf = await f.rpc("record_money_attempt_result", a2.job.id, a2c.job.lease_token, a2.attemptId, "CONFIRMED", null);
check("5c. NO_FINAL_SIGNAL (Airwallex) after reported paid: a CONFIRMED claim is still only reported-paid (022 unchanged, no timer); obligation not PAID", a2conf?.status === "PROVIDER_PAID_AWAITING_FINALITY" && (await f.one("select status from public.payout_obligations where id = $1", [a2.ob.id])).status !== "PAID");
const sol = await f.completedPayout("SOL23");
const solJob = await f.jobFor({ obligationId: sol.obligationId });
const solClaim = await f.rpc("claim_money_job", solJob.id, 60);
const solPrep = await f.rpc("prepare_money_attempt", solJob.id, solClaim.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, sol.destination, b58(88), JSON.stringify({ lastValidBlockHeight: 100, reference: "ref" }), "c2lnbmVk");
const solConf = await f.rpc("record_money_attempt_result", solJob.id, solClaim.job.lease_token, solPrep.attempt_id, "CONFIRMED", null);
const sol2 = await f.completedPayout("SOL23F");
const sol2Job = await f.jobFor({ obligationId: sol2.obligationId });
const s2c = await f.rpc("claim_money_job", sol2Job.id, 60);
const s2p = await f.rpc("prepare_money_attempt", sol2Job.id, s2c.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, sol2.destination, b58(88), JSON.stringify({ lastValidBlockHeight: 100, reference: "ref" }), "c2lnbmVk");
const s2exp = await f.rpc("record_money_attempt_result", sol2Job.id, s2c.job.lease_token, s2p.attempt_id, "EXPIRED_NOT_LANDED", "EXPIRED");
const s2c2 = await w.claim(sol2Job.id);
const s2p2 = await f.rpc("prepare_money_attempt", sol2Job.id, s2c2.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, sol2.destination, b58(88), JSON.stringify({ lastValidBlockHeight: 200, reference: "ref" }), "c2lnbmVk");
check("5d. Solana devnet unchanged: finalized CONFIRMED -> PAID; an expired (never reported-paid) attempt is still legitimately replaced by attempt #2 (the new guard only blocks reported-paid jobs)",
  solConf?.status === "CONFIRMED" && (await f.one("select status from public.payout_obligations where id = $1", [sol.obligationId])).status === "PAID" && s2exp?.status === "RETRYABLE" && s2p2?.success === true && s2p2.attempt_number === 2, { solConf: solConf?.status, s2exp, s2p2 });

// ================= 6. no backfill / no history rewrite =================
const pre = await createDb({ until: MIGRATION_023 });
const preF = fixtures(pre);
await preF.enablePolicies();
const legacy = await preF.completedPayout("LEG");
const legacyJob = await preF.jobFor({ obligationId: legacy.obligationId });
const cleanApply = await (async () => { const probe = await createDb({ until: MIGRATION_023 }); try { await probe.exec((await import("./lib/prepayFixtures.mjs")).sqlOf(MIGRATION_023)); return null; } catch (e) { return e.message; } })();
await pre.query("update public.money_movement_jobs set last_error_code = 'PROVIDER_PAID_AWAITING_FINALITY' where id = $1", [legacyJob.id]);
let refused = null;
try { await pre.exec((await import("./lib/prepayFixtures.mjs")).sqlOf(MIGRATION_023)); } catch (e) { refused = e.message; }
check("6a. no backfill needed and none performed: 023 applies cleanly on a 022 database without reported-paid state; if any 022 reported-paid state existed, the migration REFUSES (explicit reviewed backfill) instead of leaving unmarked evidence", cleanApply === null && /backfill is required/.test(refused ?? ""), { cleanApply, refused });
const existingAtts = await createDb({ until: MIGRATION_023 });
const eF = fixtures(existingAtts);
await eF.enablePolicies();
const e1 = await eF.completedPayout("HIST");
const eJob = await eF.jobFor({ obligationId: e1.obligationId });
const eClaim = await eF.rpc("claim_money_job", eJob.id, 60);
await eF.rpc("prepare_money_attempt", eJob.id, eClaim.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, e1.destination, b58(88), "{}", "c2lnbmVk");
const beforeRows = await eF.all("select id, state, external_id, prepared_at from public.money_movement_attempts order by id");
await existingAtts.exec((await import("./lib/prepayFixtures.mjs")).sqlOf(MIGRATION_023));
const afterRows = await eF.all("select id, state, external_id, prepared_at, provider_reported_paid_at from public.money_movement_attempts order by id");
check("6b. existing attempts are not rewritten: same rows / state / key / prepared_at, evidence NULL", JSON.stringify(beforeRows) === JSON.stringify(afterRows.map(({ provider_reported_paid_at, ...rest }) => rest)) && afterRows.every((x) => x.provider_reported_paid_at === null));

done();

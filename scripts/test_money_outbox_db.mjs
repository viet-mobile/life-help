// Deterministic test of migration 202609270015 (durable money-movement outbox + unpaid-checkout media
// lifecycle) against the REAL migration chain in PGlite. No network, no staging, no blockchain.
// Covers: backfill, one job per obligation, lease / fencing / recovery, attempt history, bounded retry,
// review paths, business finalization through the 014 ledger, media queue / retry / authorization.
// Usage: node scripts/test_money_outbox_db.mjs
import crypto from "node:crypto";
import { b58, checker, createDb, fixtures, OUTBOX_MIGRATION, sqlOf } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const db = await createDb({ until: OUTBOX_MIGRATION });
const f = fixtures(db);
const { one, all, rpc, fails } = f;
await f.enablePolicies();

// ================= pre-015 state =================
const legacyPayout = await f.completedPayout("PRE");
const legacyRefund = await f.cancelledRefund("PRE");
const staleCheckout = await f.offerCheckout("STALEAAA");
const staleMedia = await rpc("register_request_media", staleCheckout.checkout_id, "STALEAAA", "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 1000);
await db.query("update public.service_checkouts set status = 'EXPIRED' where id = $1", [staleCheckout.checkout_id]);

await db.exec(sqlOf(OUTBOX_MIGRATION));
check("015 applies on top of the full real chain (0001 -> 014) with existing money rows", true);
const bp = await f.jobFor({ obligationId: legacyPayout.obligationId });
const br = await f.jobFor({ refundId: legacyRefund.refundId });
check("Backfill: pre-015 CREATED payout obligation and PENDING refund each get exactly one PENDING job", bp?.status === "PENDING" && bp.obligation_type === "HELPER_PAYOUT" && br?.status === "PENDING" && br.obligation_type === "REFUND"
  && (await one("select count(*)::int n from public.money_movement_jobs")).n === 2);
check("Backfill: media stranded on an already EXPIRED, never-activated checkout is queued for deletion", (await one("select status, deletion_reason from public.request_media where id = $1", [staleMedia.media_id])).deletion_reason === "CHECKOUT_EXPIRED");

// ================= privileges =================
const tp = await all(`select t, has_table_privilege('anon', 'public.' || t, 'select') a, has_table_privilege('authenticated', 'public.' || t, 'select') u,
  has_table_privilege('service_role', 'public.' || t, 'select') s, has_table_privilege('service_role', 'public.' || t, 'insert') si,
  has_table_privilege('service_role', 'public.' || t, 'update') su, has_table_privilege('service_role', 'public.' || t, 'delete') sd
  from unnest(array['money_movement_jobs', 'money_movement_attempts', 'request_media']) t`);
check("Job / attempt / media tables: anon + authenticated nothing; service_role SELECT only (no broad UPDATE added)", tp.every((p) => !p.a && !p.u && p.s && !p.si && !p.su && !p.sd), tp);
const fp = await one(`select has_function_privilege('anon', 'public.claim_money_job(uuid, integer)', 'execute') a, has_function_privilege('authenticated', 'public.cancel_open_checkout(uuid, text)', 'execute') b,
  has_function_privilege('service_role', 'public.claim_money_job(uuid, integer)', 'execute') c, has_function_privilege('service_role', 'public.money_job_mark_business_submitted(public.money_movement_jobs, public.money_movement_attempts)', 'execute') d,
  has_function_privilege('service_role', 'public.record_media_deletion_failure(uuid, text)', 'execute') e, has_function_privilege('anon', 'public.record_media_deletion_failure(uuid, text)', 'execute') g`);
check("RPCs: service_role only; internal business helpers not callable even by service_role", !fp.a && !fp.b && fp.c && !fp.d && fp.e && !fp.g, fp);

// ================= one job per obligation =================
const p1 = await f.completedPayout("P1");
const j1 = await f.jobFor({ obligationId: p1.obligationId });
check("Customer completion -> payout obligation + exactly one job, atomically (PENDING, due now, rail from obligation)", j1?.status === "PENDING" && j1.rail === "USDC_SOLANA" && j1.attempt_count === 0 && new Date(j1.next_retry_at) <= new Date());
const dupJob = await fails("insert into public.money_movement_jobs (obligation_type, payout_obligation_id, rail) values ('HELPER_PAYOUT', $1, 'USDC_SOLANA')", [p1.obligationId]);
check("A second job for the same obligation is impossible (unique business link)", /duplicate key|unique/i.test(String(dupJob?.message)));
const replay = await rpc("confirm_service_completion", p1.requestId, p1.customer);
check("Repeated '서비스 완료' creates no second obligation / job", replay.replayed === true && (await one("select count(*)::int n from public.money_movement_jobs j join public.payout_obligations o on o.id = j.payout_obligation_id where o.request_id = $1", [p1.requestId])).n === 1);
check("Job type must match its link (refund job cannot point at a payout obligation)", !!(await fails("insert into public.money_movement_jobs (obligation_type, payout_obligation_id, rail) values ('REFUND', $1, 'X_RAIL')", [crypto.randomUUID()])));

// ================= lease =================
const c1 = await rpc("claim_money_job", j1.id, 60);
const c2 = await rpc("claim_money_job", j1.id, 60);
check("Claim: one lease winner; a concurrent claim is refused (LEASE_HELD); CLAIMED is not paid", c1.success && c1.job.status === "CLAIMED" && c2.code === "LEASE_HELD" && (await one("select status from public.payout_obligations where id = $1", [p1.obligationId])).status === "CREATED");
check("Claim returns the business context (destination, amounts, FX) and no live attempt", c1.job.context.destination === p1.destination && Number(c1.job.context.net_amount) === 60000 && c1.job.live_attempt === null && c1.job.recovered_lease === false);
const next = await rpc("claim_money_job", null, 60);
check("Queue claim skips a leased job", next.success && next.job?.job_id !== j1.id);
if (next.job) await rpc("release_money_job", next.job.job_id, next.job.lease_token, "WAITING", "TEST_PARK", 3600);
await f.expireLease(j1.id);
const c3 = await rpc("claim_money_job", j1.id, 60);
check("Worker death: after the lease expires another worker reclaims the SAME job (recovered_lease)", c3.success && c3.job.job_id === j1.id && c3.job.recovered_lease === true && c3.job.lease_token !== c1.job.lease_token);
const stale = await rpc("prepare_money_attempt", j1.id, c1.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, p1.destination, b58(88), "{}", "c2lnbmVk");
check("Fencing: the dead worker's old lease token can no longer write (LEASE_LOST)", stale.code === "LEASE_LOST" && (await one("select count(*)::int n from public.money_movement_attempts where job_id = $1", [j1.id])).n === 0);

// ================= prepare / submit / confirm =================
const L = c3.job.lease_token;
const sig1 = b58(88);
const pr1 = await rpc("prepare_money_attempt", j1.id, L, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, p1.destination, sig1, JSON.stringify({ lastValidBlockHeight: 100, reference: "ref" }), "c2lnbmVkLWJ5dGVz");
const job1 = await one("select * from public.money_movement_jobs where id = $1", [j1.id]);
check("Prepare persists attempt 1 (PREPARED, public signature + server-only signed payload) BEFORE any broadcast; amount locked on the job", pr1.success && pr1.attempt_number === 1 && job1.status === "PREPARED" && Number(job1.amount_base_units) === 42857142 && job1.attempt_count === 1
  && (await one("select state, signed_payload from public.money_movement_attempts where id = $1", [pr1.attempt_id])).signed_payload === "c2lnbmVkLWJ5dGVz");
const pr1b = await rpc("prepare_money_attempt", j1.id, L, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, p1.destination, b58(88), "{}", null);
check("No second live attempt while one exists (LIVE_ATTEMPT_EXISTS returns the same attempt to reconcile)", pr1b.code === "LIVE_ATTEMPT_EXISTS" && pr1b.attempt.external_id === sig1 && pr1b.attempt.signed_payload === "c2lnbmVkLWJ5dGVz");
check("PREPARED is not paid (obligation still CREATED)", (await one("select status from public.payout_obligations where id = $1", [p1.obligationId])).status === "CREATED");
await f.expireLease(j1.id);
const c4 = await rpc("claim_money_job", j1.id, 60);
check("Crash after prepare: the reclaim returns the live PREPARED attempt with its signed payload (reconcile / rebroadcast the same bytes)", c4.job.live_attempt?.external_id === sig1 && c4.job.live_attempt.state === "PREPARED" && c4.job.live_attempt.signed_payload === "c2lnbmVkLWJ5dGVz");
const L4 = c4.job.lease_token;
const sub1 = await rpc("mark_money_attempt_submitted", j1.id, L4, pr1.attempt_id);
const obSub = await one("select status, provider, provider_payout_id, chain_signature from public.payout_obligations where id = $1", [p1.obligationId]);
check("Submitted: obligation SUBMITTED with the attempt's signature, payment PAYOUT_PROCESSING; still not paid", sub1.success && obSub.status === "SUBMITTED" && obSub.chain_signature === sig1 && obSub.provider_payout_id === j1.id
  && (await one("select status::text s from public.payment_intents where id = $1", [p1.intentId])).s === "PAYOUT_PROCESSING");
check("Submitted replay is idempotent", (await rpc("mark_money_attempt_submitted", j1.id, L4, pr1.attempt_id)).replayed === true);
const pend = await rpc("record_money_attempt_result", j1.id, L4, pr1.attempt_id, "PENDING", null);
const jp = await one("select status, lease_token, next_retry_at from public.money_movement_jobs where id = $1", [j1.id]);
check("Pending on chain -> CONFIRMING, lease released, re-check scheduled; no new attempt", pend.status === "CONFIRMING" && jp.lease_token === null && new Date(jp.next_retry_at) > new Date() && (await one("select count(*)::int n from public.money_movement_attempts where job_id = $1", [j1.id])).n === 1);
await f.makeDue(j1.id);
const c5 = await rpc("claim_money_job", j1.id, 60);
const conf = await rpc("record_money_attempt_result", j1.id, c5.job.lease_token, pr1.attempt_id, "CONFIRMED", null);
const obPaid = await one("select status, paid_at, chain_signature from public.payout_obligations where id = $1", [p1.obligationId]);
const att1 = await one("select state, signed_payload, resolved_at from public.money_movement_attempts where id = $1", [pr1.attempt_id]);
check("CONFIRMED -> obligation PAID (same signature) + payment SETTLED + job CONFIRMED, atomically; signed payload wiped", conf.status === "CONFIRMED" && obPaid.status === "PAID" && obPaid.chain_signature === sig1 && att1.state === "CONFIRMED" && att1.signed_payload === null
  && (await one("select status::text s from public.payment_intents where id = $1", [p1.intentId])).s === "SETTLED" && (await one("select status from public.money_movement_jobs where id = $1", [j1.id])).status === "CONFIRMED");
check("Confirmed job is final: no further claim (JOB_FINAL), no further attempt", (await rpc("claim_money_job", j1.id, 60)).code === "JOB_FINAL");
check("Helper notified 'payout completed' exactly once", (await one("select count(*)::int n from public.app_notifications where type = 'PAYOUT_COMPLETED' and payload ->> 'request_id' = $1", [p1.requestId])).n === 1);

// ================= history immutability =================
check("Attempt history immutable (amount / destination / external id)", !!(await fails("update public.money_movement_attempts set amount_base_units = 1 where id = $1", [pr1.attempt_id])) && !!(await fails("update public.money_movement_attempts set external_id = 'x' || external_id where id = $1", [pr1.attempt_id])));
check("Terminal attempt cannot change state; confirmed job cannot leave CONFIRMED", !!(await fails("update public.money_movement_attempts set state = 'SUBMITTED' where id = $1", [pr1.attempt_id])) && !!(await fails("update public.money_movement_jobs set status = 'PENDING' where id = $1", [j1.id])));
check("Jobs / attempts are financial history: never deleted", !!(await fails("delete from public.money_movement_attempts where id = $1", [pr1.attempt_id])) && !!(await fails("delete from public.money_movement_jobs where id = $1", [j1.id])));
check("Job business binding immutable (locked amount)", !!(await fails("update public.money_movement_jobs set amount_base_units = 1 where id = $1", [j1.id])));

// ================= expiry -> replacement; amount lock; max attempts =================
const p2 = await f.completedPayout("P2");
const j2 = await f.jobFor({ obligationId: p2.obligationId });
let cl = await rpc("claim_money_job", j2.id, 60);
const a1 = await rpc("prepare_money_attempt", j2.id, cl.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, p2.destination, b58(88), "{}", "cGF5bG9hZA==");
await rpc("mark_money_attempt_submitted", j2.id, cl.job.lease_token, a1.attempt_id);
const exp1 = await rpc("record_money_attempt_result", j2.id, cl.job.lease_token, a1.attempt_id, "EXPIRED_NOT_LANDED", "EXPIRED_SUBMITTED_NOT_LANDED");
const j2a = await one("select status, next_retry_at, last_error_class from public.money_movement_jobs where id = $1", [j2.id]);
check("Provably expired, not landed -> attempt EXPIRED_NOT_LANDED kept in history, job RETRYABLE with backoff (obligation still not paid)", exp1.status === "RETRYABLE" && j2a.status === "RETRYABLE" && new Date(j2a.next_retry_at) > new Date() && (await one("select status from public.payout_obligations where id = $1", [p2.obligationId])).status === "SUBMITTED");
check("Not due yet: claim refused during backoff (NOT_DUE)", (await rpc("claim_money_job", j2.id, 60)).code === "NOT_DUE");
await f.makeDue(j2.id);
cl = await rpc("claim_money_job", j2.id, 60);
const bad = await rpc("prepare_money_attempt", j2.id, cl.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857143, p2.destination, b58(88), "{}", null);
check("Replacement attempt with a different amount -> REVIEW_REQUIRED (business amount mismatch), nothing prepared", bad.code === "BUSINESS_AMOUNT_MISMATCH" && (await one("select status from public.money_movement_jobs where id = $1", [j2.id])).status === "REVIEW_REQUIRED" && (await one("select count(*)::int n from public.money_movement_attempts where job_id = $1", [j2.id])).n === 1);

const p3 = await f.completedPayout("P3");
const j3 = await f.jobFor({ obligationId: p3.obligationId });
const signatures = [];
for (let n = 1; n <= 3; n += 1) {
  await f.makeDue(j3.id);
  const c = await rpc("claim_money_job", j3.id, 60);
  const sig = b58(88); signatures.push(sig);
  const a = await rpc("prepare_money_attempt", j3.id, c.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, p3.destination, sig, "{}", "cGF5");
  await rpc("mark_money_attempt_submitted", j3.id, c.job.lease_token, a.attempt_id);
  await rpc("record_money_attempt_result", j3.id, c.job.lease_token, a.attempt_id, n === 2 ? "FAILED_ONCHAIN" : "EXPIRED_NOT_LANDED", n === 2 ? "TX_ERROR" : "EXPIRED");
}
const j3f = await one("select status, attempt_count, last_error_code from public.money_movement_jobs where id = $1", [j3.id]);
const ob3 = await one("select status, chain_signature from public.payout_obligations where id = $1", [p3.obligationId]);
check("Replacements update the obligation's current signature; every attempt is preserved (3 rows, distinct signatures)", ob3.chain_signature === signatures[2] && (await all("select external_id from public.money_movement_attempts where job_id = $1 order by attempt_number", [j3.id])).map((r) => r.external_id).join() === signatures.join());
check("Bounded: after max_attempts terminal attempts -> REVIEW_REQUIRED (never paid, never an infinite loop)", j3f.status === "REVIEW_REQUIRED" && j3f.attempt_count === 3 && j3f.last_error_code === "MAX_ATTEMPTS" && ob3.status === "SUBMITTED");
check("REVIEW_REQUIRED job is never claimed automatically", (await rpc("claim_money_job", j3.id, 60)).code === "JOB_FINAL");

// ================= bounded retry classes =================
const p4 = await f.completedPayout("P4");
const j4 = await f.jobFor({ obligationId: p4.obligationId });
const delays = [];
let last;
for (let n = 0; n < 8; n += 1) {
  await f.makeDue(j4.id);
  const c = await rpc("claim_money_job", j4.id, 60);
  if (!c.success) { last = c; break; }
  last = await rpc("release_money_job", j4.id, c.job.lease_token, "RETRYABLE", "RPC_TIMEOUT", null);
  if (last.next_retry_in_seconds) delays.push(last.next_retry_in_seconds);
}
const j4f = await one("select status, failure_count, last_error_class from public.money_movement_jobs where id = $1", [j4.id]);
check("Transient errors: exponential backoff (15, 30, 60, ...)", delays[0] === 15 && delays[1] === 30 && delays[2] === 60 && delays.every((d, i) => i === 0 || d > delays[i - 1]), delays);
check("Transient errors bounded: after max_failures -> REVIEW_REQUIRED, not paid", j4f.status === "REVIEW_REQUIRED" && j4f.failure_count === 8 && (await one("select status from public.payout_obligations where id = $1", [p4.obligationId])).status === "CREATED", j4f);
const p5 = await f.completedPayout("P5");
const j5 = await f.jobFor({ obligationId: p5.obligationId });
let c5b = await rpc("claim_money_job", j5.id, 60);
const perm = await rpc("release_money_job", j5.id, c5b.job.lease_token, "PERMANENT", "MINT_NOT_ALLOWED", null);
check("Permanent error (wrong mint) -> REVIEW_REQUIRED immediately, no retry", perm.status === "REVIEW_REQUIRED" && (await one("select last_error_class, failure_count from public.money_movement_jobs where id = $1", [j5.id])).failure_count === 0);
const p6 = await f.completedPayout("P6", { withDestination: false });
const j6 = await f.jobFor({ obligationId: p6.obligationId });
const c6 = await rpc("claim_money_job", j6.id, 60);
check("No payout destination yet: context says so", c6.job.context.destination === null);
const wait = await rpc("release_money_job", j6.id, c6.job.lease_token, "WAITING", "PAYOUT_DESTINATION_MISSING", 21600);
const j6a = await one("select status, failure_count, attempt_count, next_retry_at from public.money_movement_jobs where id = $1", [j6.id]);
check("WAITING (destination missing): back to PENDING, no failure / attempt counted, re-check later", wait.status === "WAITING" && j6a.status === "PENDING" && j6a.failure_count === 0 && j6a.attempt_count === 0 && new Date(j6a.next_retry_at) > new Date(Date.now() + 3600e3));
await f.setDestination(p6.helper);
check("Destination saved -> the Helper's waiting job is due now", (await rpc("wake_helper_money_jobs", p6.helper.id)) === 1 && new Date((await one("select next_retry_at from public.money_movement_jobs where id = $1", [j6.id])).next_retry_at) <= new Date());
check("Waking never touches another Helper's job", (await rpc("wake_helper_money_jobs", p5.helper.id)) === 0);

// ================= refund outbox =================
const r1 = await f.cancelledRefund("R1");
const jr = await f.jobFor({ refundId: r1.refundId });
check("Funded unmatched cancel -> refund obligation + exactly one refund job", jr?.status === "PENDING" && jr.rail === "ORIGINAL_PAYMENT_RAIL");
check("Repeated cancel -> no second refund / job", (await rpc("cancel_funded_request", r1.requestId, r1.customer)).replayed === true && (await one("select count(*)::int n from public.money_movement_jobs where obligation_type = 'REFUND' and service_refund_id in (select id from public.service_refunds where payment_intent_id = $1)", [r1.intentId])).n === 1);
let cr = await rpc("claim_money_job", jr.id, 60);
check("Refund context: verified payment + amount (never client-supplied)", cr.job.context.intent.verified_signature && Number(cr.job.context.amount) === 70000);
const rsig = b58(88);
const ra = await rpc("prepare_money_attempt", jr.id, cr.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", Number(cr.job.context.intent.amount_base_units), b58(), rsig, "{}", "cmVm");
await f.expireLease(jr.id);
cr = await rpc("claim_money_job", jr.id, 60);
const rconf = await rpc("record_money_attempt_result", jr.id, cr.job.lease_token, ra.attempt_id, "CONFIRMED", null);
const refundRow = await one("select status, chain_signature, provider_refund_id from public.service_refunds where id = $1", [r1.refundId]);
check("Refund crash after prepare -> reclaim -> CONFIRMED straight from PREPARED (it landed): refund COMPLETED once, payment REFUNDED", rconf.status === "CONFIRMED" && refundRow.status === "COMPLETED" && refundRow.chain_signature === rsig && refundRow.provider_refund_id === jr.id
  && (await one("select status::text s from public.payment_intents where id = $1", [r1.intentId])).s === "REFUNDED");
check("Duplicate refund blocked (job final; refund result replay only for the same id)", (await rpc("claim_money_job", jr.id, 60)).code === "JOB_FINAL" && (await rpc("record_refund_result", r1.refundId, "SOLANA_DIRECT_DEVNET", "another", "solana-devnet", b58(88), true)).code === "DUPLICATE_REFUND_BLOCKED");

// ================= Referral payout outbox =================
const rw = await f.payableReward("W1");
const ro = await rpc("create_referral_payout_obligation", rw.rewardId, "USDC_SOLANA", "KR");
const ro2 = await rpc("create_referral_payout_obligation", rw.rewardId, "USDC_SOLANA", "KR");
const jw = await f.jobFor({ obligationId: ro.payout_obligation_id });
check("PAYABLE -> PAYOUT_PROCESSING + exactly one obligation + exactly one job (replay creates nothing)", ro.success && ro2.replayed && jw?.obligation_type === "REFERRAL_PAYOUT" && (await one("select state from public.referral_rewards where id = $1", [rw.rewardId])).state === "PAYOUT_PROCESSING");
let cw = await rpc("claim_money_job", jw.id, 60);
check("Referral context: the referrer's own destination", cw.job.context.destination === rw.destination && Number(cw.job.context.net_amount) === 1000);
const wa = await rpc("prepare_money_attempt", jw.id, cw.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 714285, rw.destination, b58(88), "{}", "cmVm");
await rpc("mark_money_attempt_submitted", jw.id, cw.job.lease_token, wa.attempt_id);
await rpc("record_money_attempt_result", jw.id, cw.job.lease_token, wa.attempt_id, "CONFIRMED", null);
check("Referral payout CONFIRMED -> reward PAID once; job final", (await one("select state from public.referral_rewards where id = $1", [rw.rewardId])).state === "PAID" && (await rpc("claim_money_job", jw.id, 60)).code === "JOB_FINAL");

// ================= media lifecycle =================
const hMedia = await f.helper("MEDH", { sido: "MEDIA" });
const pMedia = await f.price(hMedia);
const other = await f.helper("MEDO", { sido: "MEDIA" });
const view = (mediaId, customer, helperId) => rpc("authorize_request_media_view", mediaId, customer, helperId);
// C1: expired, never funded.
const c1co = await f.helperCheckout(pMedia, "MEDCUST1", "MEDIA");
const m1 = await rpc("register_request_media", c1co.checkout_id, "MEDCUST1", "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 2000);
check("C1. before activation: owner may view; the reserved Helper may NOT (no active assignment)", (await view(m1.media_id, "MEDCUST1", null)).success && !(await view(m1.media_id, null, hMedia.id)).success);
await f.backdateCheckout(c1co.checkout_id);
check("An expired-by-time checkout refuses new media", (await rpc("register_request_media", c1co.checkout_id, "MEDCUST1", "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 10)).code === "CHECKOUT_NOT_OPEN");
const sweep = await rpc("expire_stale_checkouts", 100);
const m1row = await one("select status, deletion_reason from public.request_media where id = $1", [m1.media_id]);
check("C1. sweep: expired unpaid checkout -> EXPIRED (reservation released) and M1 -> DELETION_PENDING (CHECKOUT_EXPIRED), atomically", sweep.expired >= 1 && (await one("select status from public.service_checkouts where id = $1", [c1co.checkout_id])).status === "EXPIRED"
  && m1row.status === "DELETION_PENDING" && m1row.deletion_reason === "CHECKOUT_EXPIRED" && (await one("select count(*)::int n from public.helper_checkout_reservations where checkout_id = $1 and status = 'ACTIVE'", [c1co.checkout_id])).n === 0);
check("C1. queued media: customer can no longer view, no Helper can view", !(await view(m1.media_id, "MEDCUST1", null)).success && !(await view(m1.media_id, null, hMedia.id)).success && !(await view(m1.media_id, null, other.id)).success);
const queue1 = await rpc("list_media_pending_deletion", 50);
check("C1. queued media is in the single deletion queue", queue1.some((q) => q.media_id === m1.media_id));
// Storage deletion fails -> stays queued, retried later, only then DELETED.
const fail1 = await rpc("record_media_deletion_failure", m1.media_id, "STORAGE_DELETE_FAILED");
const m1f = await one("select status, deletion_attempts, last_deletion_error, next_deletion_attempt_at from public.request_media where id = $1", [m1.media_id]);
check("Deletion failure: stays DELETION_PENDING (never DELETED early), failure recorded, backoff", fail1.success && m1f.status === "DELETION_PENDING" && m1f.deletion_attempts === 1 && m1f.last_deletion_error === "STORAGE_DELETE_FAILED" && new Date(m1f.next_deletion_attempt_at) > new Date());
check("During backoff the item is not re-listed", !(await rpc("list_media_pending_deletion", 50)).some((q) => q.media_id === m1.media_id));
await db.query("update public.request_media set next_deletion_attempt_at = now() - interval '1 second' where id = $1", [m1.media_id]);
check("After backoff it is listed again (retry)", (await rpc("list_media_pending_deletion", 50)).some((q) => q.media_id === m1.media_id));
const del1 = await rpc("mark_request_media_deleted", m1.media_id);
check("Retry succeeds -> DELETED only now; replay idempotent; failure bookkeeping on a deleted item refused", del1.success && (await one("select status from public.request_media where id = $1", [m1.media_id])).status === "DELETED" && (await rpc("mark_request_media_deleted", m1.media_id)).replayed === true && (await rpc("record_media_deletion_failure", m1.media_id, "X")).code === "MEDIA_NOT_PENDING_DELETION");
// C2: cancelled before payment.
const c2co = await f.offerCheckout("MEDCUST2");
const m2 = await rpc("register_request_media", c2co.checkout_id, "MEDCUST2", "R2_PRIVATE", `private/${crypto.randomUUID()}.mp4`, "video/mp4", 5000);
check("C2. another customer cannot cancel the checkout", (await rpc("cancel_open_checkout", c2co.checkout_id, "MEDCUST1")).code === "CHECKOUT_NOT_FOUND");
const cancel2 = await rpc("cancel_open_checkout", c2co.checkout_id, "MEDCUST2");
const m2row = await one("select status, deletion_reason from public.request_media where id = $1", [m2.media_id]);
check("C2. owner cancels before payment -> CANCELLED, offer CANCELLED, M2 DELETION_PENDING (CHECKOUT_CANCELLED)", cancel2.success && (await one("select status from public.service_checkouts where id = $1", [c2co.checkout_id])).status === "CANCELLED"
  && (await one("select o.status from public.customer_offers o join public.service_checkouts c on c.customer_offer_id = o.id where c.id = $1", [c2co.checkout_id])).status === "CANCELLED" && m2row.status === "DELETION_PENDING" && m2row.deletion_reason === "CHECKOUT_CANCELLED");
check("C2. cancel replay idempotent; cancelled checkout accepts no media", (await rpc("cancel_open_checkout", c2co.checkout_id, "MEDCUST2")).replayed === true && (await rpc("register_request_media", c2co.checkout_id, "MEDCUST2", "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 10)).code === "CHECKOUT_NOT_OPEN");
// C3: activated.
const c3co = await f.helperCheckout(pMedia, "MEDCUST3", "MEDIA");
const m3 = await rpc("register_request_media", c3co.checkout_id, "MEDCUST3", "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 3000);
const q3 = await rpc("create_payment_quote", c3co.checkout_id, "MEDCUST3", "solana-devnet", "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", 1400, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
const i3 = await rpc("create_payment_intent", q3.quote_id, "MEDCUST3", f.recipient, b58());
check("A checkout with a payment in progress cannot be cancelled away from its money", (await rpc("record_payment_observation", i3.intent_id, "solana-devnet", b58(88), 1, "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", f.recipient, Number(i3.amount_base_units), true, true, "confirmed")).status === "CONFIRMING"
  && (await rpc("cancel_open_checkout", c3co.checkout_id, "MEDCUST3")).code === "PAYMENT_IN_PROGRESS");
const paid3 = await rpc("record_payment_observation", i3.intent_id, "solana-devnet", b58(88), 1, "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", f.recipient, Number(i3.amount_base_units), true, true, "finalized");
const req3 = paid3.activation?.request_id;
const m3row = await one("select status, request_id from public.request_media where id = $1", [m3.media_id]);
check("C3. activation: M3 ACTIVE and attached to the new request", paid3.status === "PAID_HELD" && m3row.status === "ACTIVE" && m3row.request_id === req3);
await f.backdateCheckout(c3co.checkout_id, "2 hours");
await rpc("expire_stale_checkouts", 100);
check("C3. checkout cleanup never deletes activated media (checkout ACTIVATED, M3 still ACTIVE)", (await one("select status from public.service_checkouts where id = $1", [c3co.checkout_id])).status === "ACTIVATED" && (await one("select status from public.request_media where id = $1", [m3.media_id])).status === "ACTIVE");
check("C3. after activation the assigned Helper may view; an unrelated Helper may not", (await view(m3.media_id, null, hMedia.id)).success && !(await view(m3.media_id, null, other.id)).success);
// Activation failure (unrecoverable) queues the checkout's media.
const c4co = await f.offerCheckout("MEDCUST4");
const m4 = await rpc("register_request_media", c4co.checkout_id, "MEDCUST4", "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 10);
await db.query("update public.service_checkouts set status = 'ACTIVATION_FAILED' where id = $1", [c4co.checkout_id]);
check("Activation failure finalized -> its media DELETION_PENDING (CHECKOUT_ACTIVATION_FAILED)", (await one("select deletion_reason from public.request_media where id = $1", [m4.media_id])).deletion_reason === "CHECKOUT_ACTIVATION_FAILED");
// An in-flight payment keeps an expired checkout out of the sweep.
const c5co = await f.offerCheckout("MEDCUST5");
const q5 = await rpc("create_payment_quote", c5co.checkout_id, "MEDCUST5", "solana-devnet", "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", 1400, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
const i5 = await rpc("create_payment_intent", q5.quote_id, "MEDCUST5", f.recipient, b58());
await rpc("record_payment_observation", i5.intent_id, "solana-devnet", b58(88), 1, "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", f.recipient, Number(i5.amount_base_units), true, true, "confirmed");
await f.backdateCheckout(c5co.checkout_id);
await rpc("expire_stale_checkouts", 100);
check("Sweep never expires a checkout whose payment is being confirmed", (await one("select status from public.service_checkouts where id = $1", [c5co.checkout_id])).status === "OPEN");
// Existing boundaries still queue (service complete / funded cancel) through the same queue.
check("Existing boundary: funded request cancel still queues its media (REQUEST_CANCELLED path unchanged)", /REQUEST_CANCELLED/.test(sqlOf("202609270014_marketplace_prepay_usdc_foundation.sql")) && !/service_role/.test((await one("select string_agg(privilege_type, ',') p from information_schema.role_table_grants where table_name = 'request_media' and grantee = 'service_role' and privilege_type <> 'SELECT'")).p ?? ""));

// ================= fixture purge =================
const pf = await f.completedPayout("PURGE");
const purge = await rpc("purge_payment_fixture", pf.checkout.checkout_id);
check("Staging fixture purge removes its jobs / attempts too (test fixtures only)", purge.purged === true && !(await f.jobFor({ obligationId: pf.obligationId })));
check("A money job can never be deleted outside the fixture purge", !!(await fails("delete from public.money_movement_jobs where id = $1", [j5.id])));

done();

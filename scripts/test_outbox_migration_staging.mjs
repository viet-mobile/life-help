// Live STAGING verification of migration 202609270015 (durable money outbox + media lifecycle),
// database level: real staging PostgREST (service role / anon key / real Helper JWT), true parallel
// HTTP requests for the claim race. NO chain transaction is sent; attempts use FIXTURE external ids
// and FIXTURE signed payloads (not transactions). Proves outbox DB behaviour only, never money movement.
// Usage: node scripts/test_outbox_migration_staging.mjs
import { db, env, fixtures, readResponse, recorder, rpc, serviceKey, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, fixtureSignature, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `OV${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const ZERO = "00000000-0000-0000-0000-000000000000";
const job1 = async (link) => (await mf.jobFor(link))[0];
const OUTBOX_RPCS = {
  claim_money_job: "p_job_id,p_lease_seconds",
  prepare_money_attempt: "p_adapter_payload,p_amount_base_units,p_asset,p_destination,p_external_id,p_job_id,p_lease,p_network,p_provider,p_signed_payload",
  mark_money_attempt_submitted: "p_attempt_id,p_job_id,p_lease",
  record_money_attempt_result: "p_attempt_id,p_code,p_job_id,p_lease,p_outcome",
  release_money_job: "p_class,p_code,p_delay_seconds,p_job_id,p_lease",
  wake_helper_money_jobs: "p_helper_id",
  expire_stale_checkouts: "p_limit",
  cancel_open_checkout: "p_checkout_id,p_customer_id",
  record_media_deletion_failure: "p_error_code,p_media_id",
  list_media_pending_deletion: "p_limit",
  register_request_media: "p_byte_size,p_checkout_id,p_content_type,p_customer_id,p_object_key,p_storage_provider",
  purge_payment_fixture: "p_checkout_id",
};
let referral = null;

try {
  // ================= A. structure =================
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: hdr(serviceKey) })).json();
  const defs = spec.definitions || {};
  const cols = (t) => Object.keys(defs[t]?.properties || {});
  const jobCols = ["id", "obligation_type", "payout_obligation_id", "service_refund_id", "rail", "provider", "network", "asset", "amount_base_units", "status", "attempt_count", "max_attempts", "failure_count", "max_failures", "lease_token", "claimed_at", "claim_expires_at", "last_attempt_at", "next_retry_at", "last_error_code", "last_error_class", "confirmed_at", "created_at", "updated_at"];
  const attCols = ["id", "job_id", "attempt_number", "provider", "network", "asset", "amount_base_units", "destination", "external_id", "adapter_payload", "signed_payload", "state", "failure_category", "prepared_at", "submitted_at", "resolved_at"];
  expect("A1. money_movement_jobs + money_movement_attempts exist with every column (lease + bounded-retry fields)", jobCols.every((c) => cols("money_movement_jobs").includes(c)) && attCols.every((c) => cols("money_movement_attempts").includes(c)), { jobs: jobCols.filter((c) => !cols("money_movement_jobs").includes(c)), attempts: attCols.filter((c) => !cols("money_movement_attempts").includes(c)) });
  expect("A2. jobs reference the 014 obligation instead of copying business state (no helper / fiat / reward columns)", !["helper_id", "currency", "gross_amount", "net_amount", "request_id", "referral_reward_id", "customer_id"].some((c) => cols("money_movement_jobs").includes(c)));
  expect("A3. request_media gained deletion retry fields", ["deletion_attempts", "last_deletion_error", "next_deletion_attempt_at"].every((c) => cols("request_media").includes(c)));
  const params = (name) => Object.keys(spec.paths?.[`/rpc/${name}`]?.post?.parameters?.[0]?.schema?.properties || {}).sort().join();
  const badRpc = Object.entries(OUTBOX_RPCS).filter(([n, p]) => params(n) !== p).map(([n]) => `${n}:${params(n)}`);
  expect("A4. every 015 RPC exists with the exact parameters (claim / prepare / submitted / result / release / wake / sweep / cancel / media failure)", badRpc.length === 0, badRpc);
  const internal = await rpc("money_job_fenced", { p_job_id: ZERO, p_lease: ZERO });
  expect("A5. internal lease fence is not executable by service_role (42501)", internal.data?.code === "42501" || internal.status === 404, internal);

  // ================= B. access =================
  const helperA = await fx.createHelper("ACC", { service: "clog-clearing" });
  const who = { anon: hdr(anonKey), helper: hdr(anonKey, helperA.token) };
  const probe = {};
  for (const [name, h] of Object.entries(who)) {
    for (const t of ["money_movement_jobs", "money_movement_attempts"]) {
      const read = await rest(`${t}?select=id&limit=1`, h);
      probe[`${name}:${t}:read`] = denied(read) || (Array.isArray(read.body) && read.body.length === 0 && read.status === 200 ? "EMPTY" : false);
      probe[`${name}:${t}:insert`] = denied(await rest(t, h, "POST", {}));
      probe[`${name}:${t}:update`] = denied(await rest(`${t}?id=eq.${ZERO}`, h, "PATCH", t === "money_movement_attempts" ? { state: "CONFIRMED" } : { status: "CONFIRMED" }));
      probe[`${name}:${t}:delete`] = denied(await rest(`${t}?id=eq.${ZERO}`, h, "DELETE"));
    }
    for (const n of Object.keys(OUTBOX_RPCS)) {
      // Real parameter names (all null): a refusal must come from the privilege check, not from overload resolution.
      const args = Object.fromEntries(OUTBOX_RPCS[n].split(",").map((k) => [k, null]));
      const r = await fetch(`${supabaseUrl}/rest/v1/rpc/${n}`, { method: "POST", headers: h, body: JSON.stringify(args) });
      probe[`${name}:rpc:${n}`] = r.status === 401 || r.status === 403 || (await readResponse(r))?.code === "42501";
    }
  }
  expect("B1. anonymous + ordinary Helper: no read, no insert / update / delete on jobs / attempts; every 015 RPC refused", Object.values(probe).every((v) => v === true), Object.entries(probe).filter(([, v]) => v !== true));
  const svc = hdr(serviceKey);
  const svcWrites = {};
  for (const t of ["money_movement_jobs", "money_movement_attempts", "request_media"]) {
    svcWrites[`${t}:insert`] = denied(await rest(t, svc, "POST", {}));
    svcWrites[`${t}:update`] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "PATCH", t === "money_movement_attempts" ? { state: "CONFIRMED" } : { status: "DELETED" }));
    svcWrites[`${t}:delete`] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "DELETE"));
  }
  expect("B2. service_role: SELECT only on jobs / attempts / request_media - every write goes through the narrow RPCs (no broad UPDATE)", Object.values(svcWrites).every(Boolean), svcWrites);
  const fs = await import("node:fs");
  const clientFacing = ["app", "components"].flatMap((d) => fs.readdirSync(new URL(`../${d}/`, import.meta.url), { recursive: true }).filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => fs.readFileSync(new URL(`../${d}/${String(f).split("\\").join("/")}`, import.meta.url), "utf8")));
  expect("B3. customers act only through the Worker (anon key in the browser = B1); no route / component touches the outbox tables or signed bytes directly", clientFacing.every((c) => !/money_movement_(jobs|attempts)|signed_payload/.test(c)));

  // ================= C. one job per business obligation (live triggers) =================
  const payout = await mf.payoutObligation("PAY");
  const pj = await mf.jobFor({ obligationId: payout.obligationId });
  expect("C1. Helper payout obligation (fixture-funded, real Helper accept/start/complete API, customer confirm) -> exactly ONE job, PENDING, linked to the obligation", payout.obligationId && payout.steps.every((s) => s === 200) && pj.length === 1 && pj[0].obligation_type === "HELPER_PAYOUT" && pj[0].status === "PENDING" && pj[0].payout_obligation_id === payout.obligationId, { steps: payout.steps, conf: payout.confirmation, jobs: pj.length });
  const confAgain = await call("confirm_service_completion", { p_request_id: payout.requestId, p_customer_id: payout.customer });
  expect("C2. repeated '서비스 완료' -> same obligation, still ONE job", confAgain?.replayed === true && confAgain.payout_obligation_id === payout.obligationId && (await mf.jobFor({ obligationId: payout.obligationId })).length === 1);
  const refund = await mf.refundObligation("REF");
  const rj = await mf.jobFor({ refundId: refund.refundId });
  const cancelAgain = await call("cancel_funded_request", { p_request_id: refund.requestId, p_customer_id: refund.customer });
  expect("C3. refund obligation (fixture-funded open offer cancelled by owner) -> exactly ONE job; repeated cancel creates nothing", refund.refundId && rj.length === 1 && rj[0].obligation_type === "REFUND" && cancelAgain?.replayed === true && (await mf.jobFor({ refundId: refund.refundId })).length === 1, { cancel: refund.cancel });
  referral = await mf.referralObligation();
  const wj = referral.obligationId ? await mf.jobFor({ obligationId: referral.obligationId }) : [];
  const refAgain = await call("create_referral_payout_obligation", { p_reward_id: referral.reward.id, p_rail: "USDC_SOLANA", p_country: "KR" });
  expect("C4. Referral PAYABLE -> PAYOUT_PROCESSING + ONE obligation + ONE job; replay creates nothing", referral.created?.success && wj.length === 1 && wj[0].obligation_type === "REFERRAL_PAYOUT" && refAgain?.replayed === true && (await mf.jobFor({ obligationId: referral.obligationId })).length === 1 && (await db(`referral_rewards?id=eq.${referral.reward.id}&select=state`))[0]?.state === "PAYOUT_PROCESSING", referral.created);
  const ob = (await db(`payout_obligations?id=eq.${payout.obligationId}&select=status,net_amount,currency,fee_policy`))[0];
  const intent = (await db(`payment_intents?id=eq.${payout.intentId}&select=status`))[0];
  expect("C5. the 014 ledger stays the business source of truth (obligation CREATED 60,000 KRW fee UNCONFIGURED_ZERO; payment RELEASE_AUTHORIZED; refund PENDING)", ob?.status === "CREATED" && Number(ob.net_amount) === 60000 && ob.fee_policy === "UNCONFIGURED_ZERO" && intent?.status === "RELEASE_AUTHORIZED" && (await db(`service_refunds?id=eq.${refund.refundId}&select=status`))[0]?.status === "PENDING");

  // ================= D. lease / reclaim / fencing =================
  const A = await call("claim_money_job", { p_job_id: pj[0].id, p_lease_seconds: 15 });
  const Bearly = await call("claim_money_job", { p_job_id: pj[0].id, p_lease_seconds: 15 });
  const leased = (await db(`money_movement_jobs?id=eq.${pj[0].id}&select=status,lease_token,claim_expires_at`))[0];
  expect("D1. worker A claims: CLAIMED, lease token stored, expiry set; CLAIMED is not paid", A?.success && leased.status === "CLAIMED" && leased.lease_token === A.job.lease_token && new Date(leased.claim_expires_at) > new Date() && (await db(`payout_obligations?id=eq.${payout.obligationId}&select=status`))[0].status === "CREATED");
  expect("D2. worker A 'disappears'; before expiry worker B cannot steal it (LEASE_HELD)", Bearly?.code === "LEASE_HELD", Bearly);
  await sleep(16500);
  const B = await call("claim_money_job", { p_job_id: pj[0].id, p_lease_seconds: 120 });
  expect("D3. after lease expiry worker B reclaims the SAME job (recovered_lease, new token)", B?.success && B.job.job_id === pj[0].id && B.job.recovered_lease === true && B.job.lease_token !== A.job.lease_token, B);
  const staleRelease = await call("release_money_job", { p_job_id: pj[0].id, p_lease: A.job.lease_token, p_class: "REVIEW", p_code: "STALE", p_delay_seconds: null });
  const stalePrepare = await call("prepare_money_attempt", { p_job_id: pj[0].id, p_lease: A.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 1, p_destination: "FIXTURE-DESTINATION", p_external_id: fixtureSignature(), p_adapter_payload: { fixture: true }, p_signed_payload: "FIXTURE" });
  expect("D4. worker A's stale token can no longer mutate the job (release + prepare -> LEASE_LOST; no attempt, no status change)", staleRelease?.code === "LEASE_LOST" && stalePrepare?.code === "LEASE_LOST" && (await mf.attemptsOf(pj[0].id)).length === 0 && (await db(`money_movement_jobs?id=eq.${pj[0].id}&select=status`))[0].status === "CLAIMED");

  // ================= E. attempt persistence + signed bytes =================
  const sigE = fixtureSignature();
  const prep = await call("prepare_money_attempt", { p_job_id: pj[0].id, p_lease: B.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 42857142, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: sigE, p_adapter_payload: { fixture: true, note: "DB fixture - no transaction exists" }, p_signed_payload: "FIXTURE-NOT-A-SIGNED-TRANSACTION" });
  const second = await call("prepare_money_attempt", { p_job_id: pj[0].id, p_lease: B.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 42857142, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: fixtureSignature(), p_adapter_payload: { fixture: true }, p_signed_payload: null });
  const svcAttempt = (await db(`money_movement_attempts?job_id=eq.${pj[0].id}&select=state,signed_payload,external_id`))[0];
  expect("E1. attempt persisted (PREPARED, external id + server-only signed payload); a second live attempt refused (LIVE_ATTEMPT_EXISTS)", prep?.success && prep.attempt_number === 1 && second?.code === "LIVE_ATTEMPT_EXISTS" && svcAttempt?.state === "PREPARED" && svcAttempt.signed_payload === "FIXTURE-NOT-A-SIGNED-TRANSACTION");
  const anonRead = await rest(`money_movement_attempts?job_id=eq.${pj[0].id}&select=signed_payload`, who.anon);
  const helperRead = await rest(`money_movement_attempts?job_id=eq.${pj[0].id}&select=signed_payload`, who.helper);
  const payoutHelperRead = await rest(`money_movement_attempts?job_id=eq.${pj[0].id}&select=signed_payload`, hdr(anonKey, payout.helper.token));
  expect("E2. signed bytes unreadable by anonymous, an ordinary Helper, and even the payout's own Helper", [anonRead, helperRead, payoutHelperRead].every((r) => denied(r) || (Array.isArray(r.body) && r.body.length === 0)), [anonRead.status, helperRead.status, payoutHelperRead.status]);
  const expired = await call("record_money_attempt_result", { p_job_id: pj[0].id, p_lease: B.job.lease_token, p_attempt_id: prep.attempt_id, p_outcome: "EXPIRED_NOT_LANDED", p_code: "FIXTURE_EXPIRED" });
  const after = (await db(`money_movement_attempts?job_id=eq.${pj[0].id}&select=state,signed_payload,external_id,failure_category`))[0];
  const jobAfter = (await db(`money_movement_jobs?id=eq.${pj[0].id}&select=status,next_retry_at,attempt_count,lease_token`))[0];
  expect("E3. terminal attempt: signed bytes CLEARED, public external id + history KEPT; job RETRYABLE, retry scheduled, lease released", expired?.status === "RETRYABLE" && after.state === "EXPIRED_NOT_LANDED" && after.signed_payload === null && after.external_id === sigE && jobAfter.status === "RETRYABLE" && jobAfter.attempt_count === 1 && jobAfter.lease_token === null && new Date(jobAfter.next_retry_at) > new Date());
  const noAttemptAfter = await call("claim_money_job", { p_job_id: pj[0].id, p_lease_seconds: 30 });
  expect("E4. during backoff the job is not claimable (NOT_DUE)", noAttemptAfter?.code === "NOT_DUE", noAttemptAfter);
  const forced = await call("record_payout_result", { p_obligation_id: payout.obligationId, p_provider: "SOLANA_DIRECT_DEVNET", p_provider_payout_id: pj[0].id, p_success: true });
  expect("E5. no PAID without a confirmed external result: a direct 014 'paid' result on an unsubmitted obligation is refused; obligation CREATED, payment RELEASE_AUTHORIZED",
    forced?.success === false && (await db(`payout_obligations?id=eq.${payout.obligationId}&select=status`))[0].status === "CREATED" && (await db(`payment_intents?id=eq.${payout.intentId}&select=status`))[0].status === "RELEASE_AUTHORIZED", forced);

  // ================= F. true concurrent claim race (parallel HTTP -> separate DB connections) =================
  const race = await Promise.all([rpc("claim_money_job", { p_job_id: rj[0].id, p_lease_seconds: 60 }), rpc("claim_money_job", { p_job_id: rj[0].id, p_lease_seconds: 60 })]);
  const winners = race.filter((r) => r.data?.success === true);
  const rjRow = (await db(`money_movement_jobs?id=eq.${rj[0].id}&select=status,lease_token`))[0];
  expect("F1. two independent workers claim the same refund job concurrently: exactly ONE winner; the other gets no claim; one lease", winners.length === 1 && race.some((r) => r.data?.success === false) && rjRow.lease_token === winners[0].data.job.lease_token && (await mf.attemptsOf(rj[0].id)).length === 0, race.map((r) => r.data?.code ?? r.data?.success));
  const race10 = await Promise.all(Array.from({ length: 10 }, () => rpc("claim_money_job", { p_job_id: wj[0].id, p_lease_seconds: 60 })));
  const w10 = race10.filter((r) => r.data?.success === true);
  expect("F2. ten concurrent workers on the Referral job: exactly ONE winner, nine refused, no attempt rows", w10.length === 1 && race10.filter((r) => r.data?.success === false).length === 9 && (await mf.attemptsOf(wj[0].id)).length === 0, race10.map((r) => r.data?.code ?? r.data?.success));
  const qRace = await Promise.all([rpc("claim_money_job", { p_job_id: null, p_lease_seconds: 30 }), rpc("claim_money_job", { p_job_id: null, p_lease_seconds: 30 })]);
  const qJobs = qRace.map((r) => r.data?.job?.job_id).filter(Boolean);
  expect("F3. two concurrent queue workers never receive the same job", new Set(qJobs).size === qJobs.length, qJobs);
  for (const r of qRace) if (r.data?.job) await call("release_money_job", { p_job_id: r.data.job.job_id, p_lease: r.data.job.lease_token, p_class: "WAITING", p_code: "RACE_TEST_RELEASE", p_delay_seconds: 15 });

  // ================= G. refund retry scheduling (no chain) =================
  const rl = winners[0].data.job.lease_token;
  const r1 = await call("release_money_job", { p_job_id: rj[0].id, p_lease: rl, p_class: "RETRYABLE", p_code: "RPC_TIMEOUT", p_delay_seconds: null });
  const rAfter = (await db(`money_movement_jobs?id=eq.${rj[0].id}&select=status,failure_count,next_retry_at`))[0];
  expect("G1. retryable RPC-like failure: RETRYABLE, failure_count 1, next_retry_at ~15 s ahead", r1?.status === "RETRYABLE" && r1.next_retry_in_seconds === 15 && rAfter.status === "RETRYABLE" && rAfter.failure_count === 1 && new Date(rAfter.next_retry_at) > new Date(), { r1, rAfter });
  expect("G2. before the due time it is not reclaimed (NOT_DUE)", (await call("claim_money_job", { p_job_id: rj[0].id, p_lease_seconds: 30 }))?.code === "NOT_DUE");
  await sleep(16000);
  const rDue = await call("claim_money_job", { p_job_id: rj[0].id, p_lease_seconds: 30 });
  const r2 = rDue?.success ? await call("release_money_job", { p_job_id: rj[0].id, p_lease: rDue.job.lease_token, p_class: "RETRYABLE", p_code: "RPC_HTTP_503", p_delay_seconds: null }) : null;
  expect("G3. after the due time it is eligible again; the next failure doubles the backoff (30 s), failure_count 2", rDue?.success && r2?.next_retry_in_seconds === 30 && (await db(`money_movement_jobs?id=eq.${rj[0].id}&select=failure_count`))[0].failure_count === 2, { rDue: rDue?.code, r2 });
  expect("G4. no fake REFUNDED: refund still PENDING, payment REFUND_PENDING, one refund row", (await db(`service_refunds?id=eq.${refund.refundId}&select=status`))[0].status === "PENDING" && (await db(`payment_intents?id=eq.${refund.intentId}&select=status`))[0].status === "REFUND_PENDING" && (await db(`service_refunds?payment_intent_id=eq.${refund.intentId}&select=id`)).length === 1);

  // ================= H. referral: SUBMITTED / CONFIRMING are not PAID; REVIEW never pays =================
  const wl = w10[0].data.job.lease_token;
  const wa = await call("prepare_money_attempt", { p_job_id: wj[0].id, p_lease: wl, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 714285, p_destination: "FIXTURE-DESTINATION-NOT-AN-ADDRESS", p_external_id: fixtureSignature(), p_adapter_payload: { fixture: true }, p_signed_payload: "FIXTURE-NOT-A-SIGNED-TRANSACTION" });
  const ws = await call("mark_money_attempt_submitted", { p_job_id: wj[0].id, p_lease: wl, p_attempt_id: wa?.attempt_id });
  const wob = (await db(`payout_obligations?id=eq.${referral.obligationId}&select=status`))[0];
  expect("H1. SUBMITTED is not PAID: obligation SUBMITTED, reward still PAYOUT_PROCESSING", ws?.success && wob.status === "SUBMITTED" && (await db(`referral_rewards?id=eq.${referral.reward.id}&select=state`))[0].state === "PAYOUT_PROCESSING");
  const wp = await call("record_money_attempt_result", { p_job_id: wj[0].id, p_lease: wl, p_attempt_id: wa?.attempt_id, p_outcome: "PENDING", p_code: null });
  expect("H2. CONFIRMING (seen, not final) is not PAID", wp?.status === "CONFIRMING" && (await db(`referral_rewards?id=eq.${referral.reward.id}&select=state`))[0].state === "PAYOUT_PROCESSING" && (await db(`payout_obligations?id=eq.${referral.obligationId}&select=status`))[0].status === "SUBMITTED");
  await sleep(16000);
  const wc = await call("claim_money_job", { p_job_id: wj[0].id, p_lease_seconds: 60 });
  const wf = wc?.success ? await call("record_money_attempt_result", { p_job_id: wj[0].id, p_lease: wc.job.lease_token, p_attempt_id: wa.attempt_id, p_outcome: "FAILED_ONCHAIN", p_code: "FIXTURE_FAILED" }) : null;
  const wAtt = (await mf.attemptsOf(wj[0].id))[0];
  expect("H3. reclaim returns the live attempt to reconcile; landed-with-error attempt: terminal, signed bytes cleared, job RETRYABLE (bounded), reward not PAID", wc?.success && wc.job.live_attempt?.attempt_id === wa.attempt_id && wf?.status === "RETRYABLE" && wAtt.state === "FAILED_ONCHAIN" && wAtt.signed_payload === null && (await db(`referral_rewards?id=eq.${referral.reward.id}&select=state`))[0].state === "PAYOUT_PROCESSING", { wf, state: wAtt?.state });
} catch (error) {
  record("FAIL", "migration 015 live harness", String(error?.stack || error).slice(0, 700));
} finally {
  // Referral fixture: financial history (non-deletable) -> finalize to REVIEW_REQUIRED so nothing ever processes it.
  if (referral?.obligationId) {
    const [job] = await mf.jobFor({ obligationId: referral.obligationId });
    for (let i = 0; i < 12 && job; i += 1) {
      const c = await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 });
      if (c?.success) { await call("release_money_job", { p_job_id: job.id, p_lease: c.job.lease_token, p_class: "REVIEW", p_code: `TEST_FIXTURE_${runId}`, p_delay_seconds: null }); break; }
      if (c?.code === "JOB_FINAL") break;
      await sleep(10000);
    }
    const final = job ? (await db(`money_movement_jobs?id=eq.${job.id}&select=status,last_error_code`))[0] : null;
    record("INFO", `Referral fixture kept as immutable financial history: reward ${referral.reward.id}, obligation ${referral.obligationId}, job ${job?.id} -> ${final?.status} (${final?.last_error_code}); identities ${referral.referrer.referral_id}/${referral.referred.referral_id}; request ${referral.request.id}`);
    expect("Referral fixture finalized to REVIEW_REQUIRED (never processed; never PAID)", final?.status === "REVIEW_REQUIRED" && (await db(`referral_rewards?id=eq.${referral.reward.id}&select=state`))[0].state !== "PAID");
  }
  const out = await mf.cleanup();
  const ids = [...fx.created.helperIds, ZERO].join(",");
  // The Referral fixture's legacy qualifying request is referenced by the non-deletable reward (reported above).
  if (referral?.request?.id) out.leftovers.requests -= (await db(`service_requests?id=eq.${referral.request.id}&select=id`)).length;
  const leftovers = { ...out.leftovers, checkouts: out.checkouts.length ? (await db(`service_checkouts?id=in.(${out.checkouts.join(",")})&select=id`)).length : 0, prices: (await db(`helper_service_prices?helper_id=in.(${ids})&select=id`)).length, selections: (await db(`request_price_selections?helper_id=in.(${ids})&select=id`)).length };
  expect("Fixture cleanup (checkouts + their obligations / refunds / jobs / attempts purged; helpers, users, requests, notifications)", out.purged.every(Boolean) && Object.values(leftovers).every((n) => n === 0), { purged: out.purged, leftovers });
}
if (summary().FAIL > 0) process.exit(1);

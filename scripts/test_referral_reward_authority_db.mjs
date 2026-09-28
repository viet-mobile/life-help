// Deterministic test of migration 202609280019 (referral reward authority) on the REAL chain in PGlite,
// exercising the app role explicitly (SET ROLE service_role, BYPASSRLS as on Supabase).
// PGlite has a single connection: the concurrency checks run the competing calls through one session in
// both orders (and via Promise.all); the truly parallel variants run live on staging after the apply.
// Usage: node scripts/test_referral_reward_authority_db.mjs
import fs from "node:fs";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one, all, rpc, fails } = f;
await f.enablePolicies();
await db.exec("alter role service_role bypassrls");
const asApp = async (sql, params = []) => { await db.exec("set role service_role"); try { return await fails(sql, params); } finally { await db.exec("reset role"); } };
const appRpc = async (fn, ...args) => { await db.exec("set role service_role"); try { return await rpc(fn, ...args); } finally { await db.exec("reset role"); } };
const stateOf = async (id) => (await one("select state::text s from public.referral_rewards where id = $1", [id])).s;
const denied = (e) => /permission denied/i.test(String(e?.message));
const migration = fs.readFileSync(new URL("../supabase/migrations/202609280019_referral_reward_authority.sql", import.meta.url), "utf8");
const STATES = ["PENDING", "QUALIFIED", "HOLD", "PAYABLE", "PAYOUT_PROCESSING", "PAID", "FAILED", "REVERSED"];

// ---------------------------------------------------------------- privileges (service role matrix)
const priv = await one(`select
  has_table_privilege('service_role', 'public.referral_rewards', 'SELECT') sel,
  has_table_privilege('service_role', 'public.referral_rewards', 'INSERT') ins,
  has_table_privilege('service_role', 'public.referral_rewards', 'UPDATE') upd,
  has_table_privilege('service_role', 'public.referral_rewards', 'DELETE') del,
  has_table_privilege('service_role', 'public.referral_rewards', 'TRUNCATE') trn,
  has_table_privilege('anon', 'public.referral_rewards', 'SELECT') anon_sel,
  has_table_privilege('authenticated', 'public.referral_rewards', 'SELECT') auth_sel`);
check("1. service role: SELECT only on referral_rewards (no INSERT / UPDATE / DELETE / TRUNCATE); anon / authenticated nothing", priv.sel && !priv.ins && !priv.upd && !priv.del && !priv.trn && !priv.anon_sel && !priv.auth_sel, JSON.stringify(priv));
const fnPriv = await one(`select
  has_function_privilege('service_role', 'public.create_referral_reward_for_settled_request(uuid)', 'EXECUTE') c_svc,
  has_function_privilege('service_role', 'public.promote_referral_reward_payable(uuid)', 'EXECUTE') p_svc,
  has_function_privilege('anon', 'public.create_referral_reward_for_settled_request(uuid)', 'EXECUTE') c_anon,
  has_function_privilege('authenticated', 'public.promote_referral_reward_payable(uuid)', 'EXECUTE') p_auth`);
check("2. trusted functions: EXECUTE for service role only (not anon / authenticated)", fnPriv.c_svc && fnPriv.p_svc && !fnPriv.c_anon && !fnPriv.p_auth);
const args = await all("select p.proname, pg_get_function_identity_arguments(p.oid) a, p.prosecdef from pg_proc p where p.proname in ('create_referral_reward_for_settled_request', 'promote_referral_reward_payable')");
check("3. trusted functions take only the request / reward id (no caller-chosen state, amount, recipient, destination) and are security definer", args.length === 2 && args.every((r) => r.prosecdef && /^p_(request|reward)_id uuid$/.test(r.a)), JSON.stringify(args));

// ---------------------------------------------------------------- legitimate creation
const w = await f.qualifiedReward("BASE");
const row = await one("select * from public.referral_rewards where id = $1", [w.rewardId]);
check("4. creation derives every value server-side: QUALIFIED, referrer / referred / attribution / qualifying request from the settled request, WLH 1,000 KRW, settled_at set", w.created.code === "QUALIFIED" && row.state === "QUALIFIED" && row.attribution_id === w.attribution && row.referrer_identity_id === w.referrer && row.referred_identity_id === w.referred && row.qualifying_request_id === w.requestId && row.tier === "WLH" && row.reward_amount_krw === 1000 && row.first_service_discount_krw === 1000 && row.settled_at !== null, JSON.stringify(w.created));
const note = await one("select * from public.app_notifications where type = 'REFERRAL_REWARD_CONFIRMED' and payload->>'request_id' = $1", [w.requestId]);
check("5. creation notifies the referrer (REFERRAL_REWARD_CONFIRMED) exactly as settlement did", note?.recipient_id === w.referrerKey && note.payload.tier === "WLH" && Number(note.payload.reward_amount_krw) === 1000);
const dup = await appRpc("create_referral_reward_for_settled_request", w.requestId);
check("6. unique qualifying event: a second creation for the same request -> ALREADY_QUALIFIED, still one reward, one notification", dup.code === "ALREADY_QUALIFIED" && dup.reward_id === w.rewardId && (await one("select count(*)::int n from public.referral_rewards where qualifying_request_id = $1", [w.requestId])).n === 1 && (await one("select count(*)::int n from public.app_notifications where payload->>'request_id' = $1", [w.requestId])).n === 1);
check("7. the existing unique(qualifying_request_id) constraint is the uniqueness authority (reused, not duplicated)", (await all("select conname from pg_constraint where conrelid = 'public.referral_rewards'::regclass and contype = 'u'")).length === 2 && !/create unique index|add constraint/i.test(migration));
// tier derivation: referrer with 1 settled / 5 settled services
const addSettled = (key, n) => db.query(`insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) select $1, 'x', 'boiler', 'KR', 'TIER', 'G1', 'x', 'CLOSED', 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true from generate_series(1, ${n})`, [key]);
async function rewardFor(referrerKey) {
  const referrer = (await one("select id from public.referral_identities where subject_key = $1", [referrerKey])).id;
  const tag = `R${b58(7)}`.toUpperCase().replace(/[^A-Z]/g, "Q").slice(0, 8);
  const referred = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ($1, 'CUSTOMER', md5($1), $1) returning id", [tag])).id;
  await db.query("insert into public.referral_attributions (referred_identity_id, referrer_identity_id) values ($1, $2)", [referred, referrer]);
  const req = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) values ($1, 'x', 'boiler', 'KR', 'TIER', 'G1', 'x', 'SETTLED', 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true) returning id", [tag])).id;
  return appRpc("create_referral_reward_for_settled_request", req);
}
await addSettled(w.referrerKey, 1);
const clh = await rewardFor(w.referrerKey);
await addSettled(w.referrerKey, 4);
const glh = await rewardFor(w.referrerKey);
check("8. tier / amount derived from the referrer's settled services: 1 -> CLH 5,000; 5 -> GLH 10,000", clh.tier === "CLH" && clh.reward_amount_krw === 5000 && glh.tier === "GLH" && glh.reward_amount_krw === 10000);
const open = await f.qualifiedReward("OPEN", { status: "COMPLETED" });
const noRef = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) values ('NOREFXXX', 'x', 'boiler', 'KR', 'N', 'G1', 'x', 'SETTLED', 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true) returning id")).id;
const revoked = await f.qualifiedReward("REVK", { status: "COMPLETED" });
await db.query("update public.referral_attributions set status = 'REVOKED' where id = $1", [revoked.attribution]);
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [revoked.requestId]);
check("9. no reward without a SETTLED qualifying request, a referral or an ACTIVE attribution", open.created.code === "REQUEST_NOT_SETTLED" && !open.created.reward_id
  && (await appRpc("create_referral_reward_for_settled_request", noRef)).code === "NO_REFERRAL" && (await appRpc("create_referral_reward_for_settled_request", revoked.requestId)).code === "NO_REFERRAL"
  && (await appRpc("create_referral_reward_for_settled_request", "00000000-0000-0000-0000-000000000000")).code === "REQUEST_NOT_FOUND"
  && (await one("select count(*)::int n from public.referral_rewards where qualifying_request_id = any($1::uuid[])", [[open.requestId, noRef, revoked.requestId]])).n === 0);

// ---------------------------------------------------------------- direct writes refused
const target = await f.qualifiedReward("TGT", { status: "COMPLETED" });
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [target.requestId]);
const insertAs = (state) => asApp("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, $5)", [target.attribution, target.requestId, target.referrer, target.referred, state]);
const insertResults = {};
for (const s of STATES) insertResults[s] = await insertAs(s);
check("10. app role direct INSERT refused in EVERY state (PENDING, QUALIFIED, HOLD, PAYABLE, PAYOUT_PROCESSING, PAID, FAILED, REVERSED)", STATES.every((s) => denied(insertResults[s])) && (await one("select count(*)::int n from public.referral_rewards where qualifying_request_id = $1", [target.requestId])).n === 0);
const updates = [["state", "'PAYABLE'"], ["state", "'PAID'"], ["state", "'REVERSED'"], ["reward_amount_krw", "999999"], ["referrer_identity_id", "gen_random_uuid()"], ["tier", "'GLH'"]];
const updRes = [];
for (const [col, val] of updates) updRes.push(await asApp(`update public.referral_rewards set ${col} = ${val} where id = $1`, [w.rewardId]));
check("11. app role direct UPDATE refused (QUALIFIED -> PAYABLE / PAID / REVERSED, amount, recipient, tier)", updRes.every(denied) && (await stateOf(w.rewardId)) === "QUALIFIED");
check("12. app role DELETE and TRUNCATE refused; the row survives", denied(await asApp("delete from public.referral_rewards where id = $1", [w.rewardId])) && denied(await asApp("truncate public.referral_rewards")) && (await stateOf(w.rewardId)) === "QUALIFIED");
// Defence in depth: even the table owner (trigger guards, independent of grants)
const ownerIns = await fails("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, 'PAYABLE')", [target.attribution, target.requestId, target.referrer, target.referred]);
const ownerInsQ = await fails("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, 'QUALIFIED')", [target.attribution, target.requestId, target.referrer, target.referred]);
const ownerPromote = await fails("update public.referral_rewards set state = 'PAYABLE' where id = $1", [w.rewardId]);
const ownerSkip = await fails("update public.referral_rewards set state = 'PAID' where id = $1", [w.rewardId]);
const ownerAmount = await fails("update public.referral_rewards set reward_amount_krw = 5 where id = $1", [w.rewardId]);
const ownerDel = await fails("delete from public.referral_rewards where id = $1", [w.rewardId]);
const ownerTrunc = await fails("truncate public.referral_rewards");
check("13. guards hold even for the owner: no insert outside the trusted function, no QUALIFIED -> PAYABLE outside promotion, no skipped state, immutable amount, no delete, no truncate",
  /created only by/.test(ownerIns?.message) && /created only by/.test(ownerInsQ?.message) && /not allowed/.test(ownerPromote?.message) && /not allowed/.test(ownerSkip?.message) && /immutable/.test(ownerAmount?.message) && !!ownerDel && /never truncated|cannot truncate/.test(ownerTrunc?.message) && (await stateOf(w.rewardId)) === "QUALIFIED");
const flagLeak = await fails("select set_config('life_help.referral_reward_create', 'on', false)");
await db.exec("set role service_role");
const flagInsert = await fails("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, 'QUALIFIED')", [target.attribution, target.requestId, target.referrer, target.referred]);
await db.exec("reset role");
await db.exec("reset life_help.referral_reward_create");
check("14. setting the internal flag does not open a direct path for the app role (table privilege still refuses)", flagLeak === null && denied(flagInsert));
const createdTarget = await appRpc("create_referral_reward_for_settled_request", target.requestId);
check("15. the app role creates the reward through the trusted function (the only creation path)", createdTarget.code === "QUALIFIED" && (await stateOf(createdTarget.reward_id)) === "QUALIFIED");

// ---------------------------------------------------------------- promotion
const pr = await appRpc("promote_referral_reward_payable", w.rewardId);
const pr2 = await appRpc("promote_referral_reward_payable", w.rewardId);
check("16. trusted promotion: QUALIFIED -> PAYABLE for a legacy SETTLED request (no time hold); replay is idempotent", pr.success && pr.replayed === false && pr2.success && pr2.replayed === true && (await stateOf(w.rewardId)) === "PAYABLE");
const pRevoked = await f.qualifiedReward("PREV");
await db.query("update public.referral_attributions set status = 'REVOKED' where id = $1", [pRevoked.attribution]);
const pExpired = await f.qualifiedReward("PEXP");
await db.query("update public.referral_attributions set status = 'EXPIRED' where id = $1", [pExpired.attribution]);
check("17. promotion refused when the attribution is no longer ACTIVE (REVOKED / EXPIRED); reward stays QUALIFIED", (await appRpc("promote_referral_reward_payable", pRevoked.rewardId)).code === "ATTRIBUTION_NOT_VALID" && (await appRpc("promote_referral_reward_payable", pExpired.rewardId)).code === "ATTRIBUTION_NOT_VALID" && (await stateOf(pRevoked.rewardId)) === "QUALIFIED" && (await stateOf(pExpired.rewardId)) === "QUALIFIED");
const pNotSettled = await f.qualifiedReward("PNS");
await db.query("update public.service_requests set status = 'DISPUTED' where id = $1", [pNotSettled.requestId]).catch(async () => db.query("update public.service_requests set status = 'COMPLETED' where id = $1", [pNotSettled.requestId]));
check("18. promotion refused when the qualifying request is no longer SETTLED / CLOSED", (await appRpc("promote_referral_reward_payable", pNotSettled.rewardId)).code === "REQUEST_NOT_SETTLED" && (await stateOf(pNotSettled.rewardId)) === "QUALIFIED");
check("19. promotion refused for an unknown reward (non-QUALIFIED rewards: check 30)", (await appRpc("promote_referral_reward_payable", "00000000-0000-0000-0000-000000000000")).code === "REWARD_NOT_FOUND");

// Funded (prepaid) qualifying request: payment must be SETTLED and never refunded / reversed.
async function fundedReferral(label, { settlePayment = true } = {}) {
  const p = await f.completedPayout(label);
  if (settlePayment) {
    const job = await f.jobFor({ obligationId: p.obligationId });
    const c = await rpc("claim_money_job", job.id, 60);
    const a = await rpc("prepare_money_attempt", job.id, c.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 1000, p.destination, b58(88), "{}", "cmVm");
    await rpc("mark_money_attempt_submitted", job.id, c.job.lease_token, a.attempt_id);
    await rpc("record_money_attempt_result", job.id, c.job.lease_token, a.attempt_id, "CONFIRMED", null);
  }
  await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [p.requestId]).catch(() => undefined);
  const refTag = `F${label}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const referrer = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ($1, 'CUSTOMER', md5($1), $1) returning id", [refTag])).id;
  const referredId = `G${label}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const referred = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ($1, 'CUSTOMER', md5($1), $2) returning id", [referredId, p.customer])).id;
  await db.query("insert into public.referral_attributions (referred_identity_id, referrer_identity_id) values ($1, $2)", [referred, referrer]);
  return p;
}
const fundedOk = await fundedReferral("FOK");
const fOk = await appRpc("create_referral_reward_for_settled_request", fundedOk.requestId);
const fOkP = await appRpc("promote_referral_reward_payable", fOk.reward_id);
check("20. funded request: payment SETTLED, not refunded -> QUALIFIED at settlement, promotion to PAYABLE", fOk.code === "QUALIFIED" && fOkP.success && (await stateOf(fOk.reward_id)) === "PAYABLE", JSON.stringify([fOk, fOkP]));
const fundedUnpaid = await fundedReferral("FUP", { settlePayment: false });
const fUp = await appRpc("create_referral_reward_for_settled_request", fundedUnpaid.requestId);
check("21. funded request whose payment is not SETTLED -> no reward (PAYMENT_NOT_SETTLED)", fUp.code === "PAYMENT_NOT_SETTLED" || fUp.code === "REQUEST_NOT_SETTLED", JSON.stringify(fUp));
const refundRow = (p) => one("insert into public.service_refunds (payment_intent_id, checkout_id, request_id, currency, amount, reason, status) values ($1, (select checkout_id from public.payment_intents where id = $1), $2, 'KRW', 1000, 'OPERATOR_APPROVED', 'PENDING') returning id", [p.intentId, p.requestId]);
// reversal BEFORE promotion wins
const fundedRev = await fundedReferral("FRV");
const fRev = await appRpc("create_referral_reward_for_settled_request", fundedRev.requestId);
await refundRow(fundedRev);
check("22. refund / reversal of the qualifying payment blocks promotion (existing source of truth: service_refunds)", fRev.code === "QUALIFIED" && (await appRpc("promote_referral_reward_payable", fRev.reward_id)).code === "PAYMENT_REFUNDED_OR_REVERSED" && (await stateOf(fRev.reward_id)) === "QUALIFIED");
// stray-deposit return (source signature) is not a reversal of the service payment
const fundedStray = await fundedReferral("FST");
const fSt = await appRpc("create_referral_reward_for_settled_request", fundedStray.requestId);
await one("insert into public.service_refunds (payment_intent_id, checkout_id, request_id, currency, amount, reason, status, source_signature, asset_amount_base_units) values ($1, (select checkout_id from public.payment_intents where id = $1), $2, 'KRW', 1000, 'OPERATOR_APPROVED', 'PENDING', $3, 5) returning id", [fundedStray.intentId, fundedStray.requestId, b58(64)]);
check("23. the return of a stray extra deposit (source-signature refund) does not block promotion", (await appRpc("promote_referral_reward_payable", fSt.reward_id)).success === true);

// ---------------------------------------------------------------- concurrency
const race = await f.qualifiedReward("RACE");
const [ra, rb] = await Promise.all([appRpc("promote_referral_reward_payable", race.rewardId).catch((e) => ({ error: e.message })), rpc("promote_referral_reward_payable", race.rewardId).catch((e) => ({ error: e.message }))]);
check("24. parallel promotion race: exactly one promotion, the other is a replay; one PAYABLE reward, no error", [ra, rb].filter((r) => r.success && r.replayed === false).length === 1 && [ra, rb].filter((r) => r.success && r.replayed === true).length === 1 && (await stateOf(race.rewardId)) === "PAYABLE", JSON.stringify([ra, rb]));
const raceC = await f.qualifiedReward("RACEC", { status: "COMPLETED" });
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [raceC.requestId]);
const [c1, c2] = await Promise.all([appRpc("create_referral_reward_for_settled_request", raceC.requestId), rpc("create_referral_reward_for_settled_request", raceC.requestId)]);
check("25. parallel creation race (duplicate settlement): one QUALIFIED, one ALREADY_QUALIFIED, one reward", [c1, c2].map((r) => r.code).sort().join() === "ALREADY_QUALIFIED,QUALIFIED" && (await one("select count(*)::int n from public.referral_rewards where qualifying_request_id = $1", [raceC.requestId])).n === 1);
// reversal vs promotion, both orders; the serialisation points are the locks asserted below
const fundedRace = await fundedReferral("FRC");
const fRc = await appRpc("create_referral_reward_for_settled_request", fundedRace.requestId);
const [revFirst, promAfter] = [await refundRow(fundedRace), await appRpc("promote_referral_reward_payable", fRc.reward_id)];
check("26. reversal committed before promotion -> promotion refused (reward QUALIFIED)", !!revFirst && promAfter.code === "PAYMENT_REFUNDED_OR_REVERSED" && (await stateOf(fRc.reward_id)) === "QUALIFIED");
const promoteBody = migration.slice(migration.indexOf("create or replace function public.promote_referral_reward_payable"));
check("27. promotion serialises against settlement / reversal: reward FOR UPDATE, attribution / request / payment FOR SHARE, all re-checked under the locks before the write",
  /from public\.referral_rewards where id = p_reward_id for update/.test(promoteBody) && /referral_attributions where id = v_reward\.attribution_id for share/.test(promoteBody) && /service_requests where id = v_reward\.qualifying_request_id for share/.test(promoteBody) && /payment_intents where id = v_req\.funding_payment_intent_id for share/.test(promoteBody)
  && promoteBody.indexOf("for share") < promoteBody.indexOf("set state = 'PAYABLE'") && promoteBody.indexOf("service_refunds") < promoteBody.indexOf("set state = 'PAYABLE'"));

// ---------------------------------------------------------------- payout path unchanged
check("28. payout obligation refused for a QUALIFIED (not promoted) reward", (await appRpc("create_referral_payout_obligation", pRevoked.rewardId, "USDC_SOLANA", "KR")).code === "REWARD_NOT_PAYABLE");
const pay = await f.payableReward("PAY");
const ob = await appRpc("create_referral_payout_obligation", pay.rewardId, "USDC_SOLANA", "KR");
const pjob = await f.jobFor({ obligationId: ob.payout_obligation_id });
const pc = await rpc("claim_money_job", pjob.id, 60);
const pa = await rpc("prepare_money_attempt", pjob.id, pc.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 714285, pay.destination, b58(88), "{}", "cmVm");
await rpc("mark_money_attempt_submitted", pjob.id, pc.job.lease_token, pa.attempt_id);
const midState = await stateOf(pay.rewardId);
await rpc("record_money_attempt_result", pjob.id, pc.job.lease_token, pa.attempt_id, "CONFIRMED", null);
check("29. existing payout path: PAYABLE -> PAYOUT_PROCESSING (obligation) -> PAID (confirmed money job)", ob.success && midState === "PAYOUT_PROCESSING" && (await stateOf(pay.rewardId)) === "PAID");
check("30. PAID is final: no promotion, no second obligation, no state change even for the owner", (await appRpc("promote_referral_reward_payable", pay.rewardId)).code === "REWARD_NOT_QUALIFIED" && (await appRpc("create_referral_payout_obligation", pay.rewardId, "USDC_SOLANA", "KR")).replayed === true
  && /not allowed/.test((await fails("update public.referral_rewards set state = 'PAYABLE' where id = $1", [pay.rewardId]))?.message) && !!(await fails("delete from public.referral_rewards where id = $1", [pay.rewardId])) && (await stateOf(pay.rewardId)) === "PAID");

// ---------------------------------------------------------------- existing history / migration shape
check("31. the migration rewrites no existing reward (no UPDATE / DELETE of referral_rewards outside the trusted functions)", (() => {
  const outside = migration.replace(/create or replace function[\s\S]*?\$\$;/g, "").replace(/--[^\n]*/g, "");
  return !/update public\.referral_rewards|delete from public\.referral_rewards|truncate/i.test(outside.replace(/before truncate|never truncated|referral_rewards_no_truncate|revoke all[^;]*;/gi, ""));
})());
check("32. the 018 insert guard is replaced (no stale trigger); one guard, one no-delete, one no-truncate trigger", (await all("select tgname from pg_trigger where tgrelid = 'public.referral_rewards'::regclass and not tgisinternal order by 1")).map((r) => r.tgname).join() === "referral_rewards_guard,referral_rewards_no_delete,referral_rewards_no_truncate");
check("33. HOLD / REVERSED / FAILED / PENDING stay reserved: no function sets them", !/'(HOLD|REVERSED|FAILED|PENDING)'/.test(migration.slice(migration.indexOf("-- 3. Trusted creation")).replace(/status <> 'FAILED'/g, "")));

done();

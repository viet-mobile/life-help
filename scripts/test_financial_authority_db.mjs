// Deterministic test of migration 202609280018 (financial authority hardening) on the REAL chain in
// PGlite, exercising the app role explicitly (SET ROLE service_role) where privileges matter.
// Usage: node scripts/test_financial_authority_db.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one, rpc, fails } = f;
await f.enablePolicies();
await db.exec("alter role service_role bypassrls"); // as on Supabase: the app role bypasses RLS; grants + triggers still apply
const asApp = async (sql, params = []) => { await db.exec("set role service_role"); try { return await fails(sql, params); } finally { await db.exec("reset role"); } };

const w = await f.payableReward("AUTH");
const reward = await one("select attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id from public.referral_rewards where id = $1", [w.rewardId]);
check("1. the app role can no longer UPDATE referral rewards (e.g. force PAID)", /permission denied/i.test(String((await asApp("update public.referral_rewards set state = 'PAID' where id = $1", [w.rewardId]))?.message)) && (await one("select state::text s from public.referral_rewards where id = $1", [w.rewardId])).s === "PAYABLE");
const freshRequest = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) values ('AUTHREQX', 'x', 'boiler', 'KR', 'AUTH', 'G1', 'x', 'SEARCHING', 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true) returning id")).id;
const insertAs = (state, requestId) => asApp("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, $5)", [reward.attribution_id, requestId, reward.referrer_identity_id, reward.referred_identity_id, state]);
// Since migration 019 the app role has no INSERT at all (SELECT only); the 018 insert guard is superseded.
check("2. the app role cannot INSERT a reward already PAID / PAYOUT_PROCESSING", /permission denied/i.test(String((await insertAs("PAID", freshRequest))?.message)) && /permission denied/i.test(String((await insertAs("PAYOUT_PROCESSING", freshRequest))?.message)));
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [freshRequest]);
const viaTrusted = await rpc("create_referral_reward_for_settled_request", freshRequest);
check("3. the app's real creation at settlement (trusted function since 019) still works", /permission denied/i.test(String((await insertAs("QUALIFIED", freshRequest))?.message)) && viaTrusted.success === true, JSON.stringify(viaTrusted));
const created = await rpc("create_referral_payout_obligation", w.rewardId, "USDC_SOLANA", "KR");
const job = await f.jobFor({ obligationId: created.payout_obligation_id });
const c = await rpc("claim_money_job", job.id, 60);
const a = await rpc("prepare_money_attempt", job.id, c.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 714285, w.destination, b58(88), "{}", "cmVm");
await rpc("mark_money_attempt_submitted", job.id, c.job.lease_token, a.attempt_id);
await rpc("record_money_attempt_result", job.id, c.job.lease_token, a.attempt_id, "CONFIRMED", null);
check("4. the payout path (security-definer ledger functions) still moves PAYABLE -> PAYOUT_PROCESSING -> PAID", created.success && (await one("select state::text s from public.referral_rewards where id = $1", [w.rewardId])).s === "PAID");

// operator idempotency re-check after the case lock (sequential replay; the concurrent variant runs live)
const p = await f.completedPayout("IDEM");
const pj = await f.jobFor({ obligationId: p.obligationId });
const key = crypto.randomUUID();
const first = await rpc("operator_review_action", "MONEY_JOB", pj.id, "NOTE", "ops", "SYS_SESSION", "note", key, null);
const again = await rpc("operator_review_action", "MONEY_JOB", pj.id, "NOTE", "ops", "SYS_SESSION", "note", key, null);
const src = fs.readFileSync(new URL("../supabase/migrations/202609280018_financial_authority_hardening.sql", import.meta.url), "utf8");
const body = src.slice(src.indexOf("create or replace function public.operator_review_action("));
check("5. operator_review_action re-checks the idempotency key AFTER taking the case lock (same-key race answers as a replay)", first.success && again.replayed === true && body.indexOf("for update") < body.lastIndexOf("where idempotency_key = p_idempotency_key"));

// RECONCILE_ONLY + WAITING (nothing live; e.g. no destination yet) returns to review, never waits in automation
const nd = await f.completedPayout("NODEST", { withDestination: false });
const nj = await f.jobFor({ obligationId: nd.obligationId });
await db.query("update public.money_movement_jobs set automation_policy = 'RECONCILE_ONLY' where id = $1", [nj.id]);
const cn = await rpc("claim_money_job", nj.id, 60);
const rel = await rpc("release_money_job", nj.id, cn.job.lease_token, "WAITING", "PAYOUT_DESTINATION_MISSING", 21600);
check("6. RECONCILE_ONLY job released as WAITING -> REVIEW_REQUIRED (RECONCILE_ONLY_PAYOUT_DESTINATION_MISSING), no lease", rel.status === "REVIEW_REQUIRED" && (await one("select last_error_code from public.money_movement_jobs where id = $1", [nj.id])).last_error_code === "RECONCILE_ONLY_PAYOUT_DESTINATION_MISSING");
const auto = await f.completedPayout("AUTOWAIT", { withDestination: false });
const aj = await f.jobFor({ obligationId: auto.obligationId });
const ca = await rpc("claim_money_job", aj.id, 60);
check("7. a normal (AUTO) job released as WAITING still waits (unchanged)", (await rpc("release_money_job", aj.id, ca.job.lease_token, "WAITING", "PAYOUT_DESTINATION_MISSING", 21600)).status === "WAITING");

done();

// Live STAGING verification of migration 202609280019 (referral reward authority).
//   --phase=gate  (019 applied, OLD Worker still deployed): DB level only. No Worker settlement, no payout.
//                 One disposable probe reward is created through the trusted function (its qualifying
//                 request is a legacy fixture set SETTLED at DB level, never via the old Worker).
//   --phase=live  (runtime 929f438+ deployed): deployed settlement route, trusted creation / promotion,
//                 true-parallel races, payout path up to PAYOUT_PROCESSING (no destination -> no chain).
//   --phase=window --since=<iso> --until=<iso>: apply->deploy audit; backfills ONLY via the trusted function.
// Reward rows are immutable financial history: every reward this suite creates REMAINS (reported).
// Usage: node scripts/test_referral_authority_staging.mjs --phase=gate|live|window
import crypto from "node:crypto";
import fs from "node:fs";
import { base, db, env, fixtures, readResponse, recorder, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, letters } from "./lib/stagingMoneyFixtures.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const phase = arg("phase") ?? "gate";
const runId = `RRA${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const svc = hdr(serviceKey);
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const rawRpc = (name, args, headers = svc) => rest(`rpc/${name}`, headers, "POST", args);
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const ZERO = "00000000-0000-0000-0000-000000000000";
const STATES = ["QUALIFIED", "PENDING", "HOLD", "PAYABLE", "PAYOUT_PROCESSING", "PAID", "FAILED", "REVERSED"];
const retained = { rewards: [], requests: [], identities: [] };
const extraRequests = new Set();
const hash = (x) => crypto.createHash("sha256").update(`${runId}-${x}`).digest("hex");
const rewardsOf = (requestId) => db(`referral_rewards?qualifying_request_id=eq.${requestId}&select=*`);
const notesOf = (requestId) => db(`app_notifications?type=eq.REFERRAL_REWARD_CONFIRMED&payload->>request_id=eq.${requestId}&select=id,recipient_id,payload`);
const settleRoute = async (requestId, status) => { const r = await fetch(`${base}/api/sys/requests/${requestId}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status }) }); return { status: r.status, body: await readResponse(r) }; };

/** Referral basis from existing business records: two identities, ACTIVE attribution, a legacy request of the referred customer. */
async function basis(label, { status = "COMPLETED", attribution = true } = {}) {
  const [ra, rb] = [letters(), letters()];
  const [referrer] = await db("referral_identities", "POST", { referral_id: ra, subject_type: "CUSTOMER", device_id_hash: hash(`${label}-a`), subject_key: ra });
  const [referred] = await db("referral_identities", "POST", { referral_id: rb, subject_type: "CUSTOMER", device_id_hash: hash(`${label}-b`), subject_key: rb });
  const att = attribution ? (await db("referral_attributions", "POST", { referred_identity_id: referred.id, referrer_identity_id: referrer.id }))[0] : null;
  const [request] = await db("service_requests", "POST", { request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true, customer_id: rb, customer_display_name: "019 FIXTURE", service_slug: "boiler", country: "KR", sido: `${runId}-REF`, gungu: "G1", description: `${runId} ${label} 019 referral authority fixture (financial history, kept)`, status });
  return { referrer, referred, attribution: att, request, label };
}
const addAttribution = async (b) => { b.attribution = (await db("referral_attributions", "POST", { referred_identity_id: b.referred.id, referrer_identity_id: b.referrer.id }))[0]; return b; };
const keep = (b, reward) => { retained.rewards.push(reward.id); retained.requests.push(b.request.id); retained.identities.push(b.referrer.id, b.referred.id); };
/** Settlement through the DEPLOYED platform route (live phase only). */
async function settleViaRoute(b) {
  const p = await settleRoute(b.request.id, "PAYMENT_PENDING");
  const s = await settleRoute(b.request.id, "SETTLED");
  return { pending: p, settled: s };
}

async function privilegeMatrix(target) {
  const helper = await fx.createHelper("P", { service: "clog-clearing" });
  const helperHdr = hdr(anonKey, helper.token);
  const row = (state) => ({ attribution_id: target.attribution.id, qualifying_request_id: target.request.id, referrer_identity_id: target.referrer.id, referred_identity_id: target.referred.id, tier: "WLH", reward_amount_krw: 1000, first_service_discount_krw: 1000, state });
  const ins = {};
  for (const s of STATES) ins[`service_role:${s}`] = await rest("referral_rewards", svc, "POST", row(s));
  ins["anon:QUALIFIED"] = await rest("referral_rewards", hdr(anonKey), "POST", row("QUALIFIED"));
  ins["helper:PAYABLE"] = await rest("referral_rewards", helperHdr, "POST", row("PAYABLE"));
  expect("3. direct INSERT refused in EVERY state for the app role (QUALIFIED, PENDING, HOLD, PAYABLE, PAYOUT_PROCESSING, PAID, FAILED, REVERSED), anon and Helper; no row", Object.values(ins).every(denied) && (await rewardsOf(target.request.id)).length === 0, Object.fromEntries(Object.entries(ins).map(([k, v]) => [k, `${v.status}/${v.body?.code ?? ""}`])));
  return { helper, helperHdr };
}

async function immutability(reward, helperHdr) {
  const before = (await db(`referral_rewards?id=eq.${reward.id}&select=*`))[0];
  const upd = {
    "service_role:->PAYABLE": await rest(`referral_rewards?id=eq.${reward.id}`, svc, "PATCH", { state: "PAYABLE" }),
    "service_role:->PAID": await rest(`referral_rewards?id=eq.${reward.id}`, svc, "PATCH", { state: "PAID" }),
    "service_role:->REVERSED": await rest(`referral_rewards?id=eq.${reward.id}`, svc, "PATCH", { state: "REVERSED" }),
    "service_role:amount": await rest(`referral_rewards?id=eq.${reward.id}`, svc, "PATCH", { reward_amount_krw: 999999 }),
    "service_role:recipient": await rest(`referral_rewards?id=eq.${reward.id}`, svc, "PATCH", { referrer_identity_id: ZERO }),
    "anon:state": await rest(`referral_rewards?id=eq.${reward.id}`, hdr(anonKey), "PATCH", { state: "PAID" }),
    "helper:state": await rest(`referral_rewards?id=eq.${reward.id}`, helperHdr, "PATCH", { state: "PAID" }),
  };
  const del = {
    "service_role": await rest(`referral_rewards?id=eq.${reward.id}`, svc, "DELETE"),
    "service_role:bulk": await rest(`referral_rewards?id=neq.${ZERO}`, svc, "DELETE"),
    "anon": await rest(`referral_rewards?id=eq.${reward.id}`, hdr(anonKey), "DELETE"),
    "helper": await rest(`referral_rewards?id=eq.${reward.id}`, helperHdr, "DELETE"),
  };
  const after = (await db(`referral_rewards?id=eq.${reward.id}&select=*`))[0];
  expect("2a. direct UPDATE refused (state -> PAYABLE / PAID / REVERSED, amount, recipient) for app role, anon, Helper; probe row unchanged", Object.values(upd).every(denied) && JSON.stringify(after) === JSON.stringify(before), Object.fromEntries(Object.entries(upd).map(([k, v]) => [k, `${v.status}/${v.body?.code ?? ""}`])));
  expect("2b. direct DELETE refused (single row and bulk) for app role, anon, Helper; probe row survives", Object.values(del).every(denied) && !!after, Object.fromEntries(Object.entries(del).map(([k, v]) => [k, `${v.status}/${v.body?.code ?? ""}`])));
  // Privilege level (not trigger level): against a non-existent row the table privilege check is the only
  // thing that can refuse, so 42501 "permission denied for table" proves the grant itself is absent.
  // Control: the same PATCH on a table where service_role holds UPDATE succeeds (204).
  const priv = {
    insert: await rest("referral_rewards", svc, "POST", { attribution_id: ZERO, qualifying_request_id: ZERO, referrer_identity_id: ZERO, referred_identity_id: ZERO, tier: "WLH", reward_amount_krw: 1000, first_service_discount_krw: 1000, state: "QUALIFIED" }),
    update: await rest(`referral_rewards?id=eq.${ZERO}`, svc, "PATCH", { state: "PAID" }),
    delete: await rest(`referral_rewards?id=eq.${ZERO}`, svc, "DELETE"),
  };
  const select = await rest(`referral_rewards?id=eq.${ZERO}&select=id`, svc);
  const control = await rest(`helpers?id=eq.${ZERO}`, svc, "PATCH", { name: "x" });
  const tableDenied = (r) => r.status === 403 && r.body?.code === "42501" && /permission denied for table referral_rewards/.test(r.body?.message ?? "");
  expect("1. app role privileges on referral_rewards = SELECT only (INSERT / UPDATE / DELETE: 42501 permission denied for table, at grant level; SELECT 200; control table 2xx)", Object.values(priv).every(tableDenied) && select.status === 200 && control.status < 300, Object.fromEntries(Object.entries({ ...priv, select, control }).map(([k, v]) => [k, `${v.status}/${v.body?.code ?? ""}`])));
  record("INFO", "TRUNCATE: not reachable through PostgREST; privilege revoked for service_role and a BEFORE TRUNCATE trigger refuses it for any role (migration 019; exercised in PGlite check 12/13)");
}

async function gate() {
  // 4 (DB-level part): before settlement the trusted function refuses.
  const p = await basis("GATE");
  const early = await call("create_referral_reward_for_settled_request", { p_request_id: p.request.id });
  expect("4a. trusted creation refuses before settlement (REQUEST_NOT_SETTLED), no reward", early?.code === "REQUEST_NOT_SETTLED" && (await rewardsOf(p.request.id)).length === 0, early);
  const { helperHdr } = await privilegeMatrix(p);
  // Disposable probe: legacy fixture request settled at DB level (NOT through the old Worker), reward via the trusted function.
  await db(`service_requests?id=eq.${p.request.id}&status=eq.COMPLETED`, "PATCH", { status: "SETTLED" });
  const created = await call("create_referral_reward_for_settled_request", { p_request_id: p.request.id });
  const [reward] = await rewardsOf(p.request.id);
  keep(p, reward ?? { id: created?.reward_id });
  expect("4b. trusted creation after settlement: exactly one QUALIFIED reward, all values derived server-side (referrer, referred, ACTIVE attribution, qualifying request, WLH, 1,000 KRW)", created?.code === "QUALIFIED" && reward?.state === "QUALIFIED" && reward.referrer_identity_id === p.referrer.id && reward.referred_identity_id === p.referred.id && reward.attribution_id === p.attribution.id && reward.tier === "WLH" && reward.reward_amount_krw === 1000 && reward.first_service_discount_krw === 1000, created);
  const replay = await call("create_referral_reward_for_settled_request", { p_request_id: p.request.id });
  expect("4c. replay -> ALREADY_QUALIFIED (same reward), still one reward and one notification", replay?.code === "ALREADY_QUALIFIED" && replay.reward_id === reward?.id && (await rewardsOf(p.request.id)).length === 1 && (await notesOf(p.request.id)).length === 1, replay);
  const inject = await rawRpc("create_referral_reward_for_settled_request", { p_request_id: p.request.id, p_state: "PAID", p_reward_amount_krw: 999999, p_referrer_identity_id: ZERO, p_destination: "x" });
  expect("4d. caller cannot inject state / amount / recipient / destination (no such signature; nothing changes)", inject.status >= 400 && JSON.stringify((await rewardsOf(p.request.id))[0]) === JSON.stringify(reward), `${inject.status}/${inject.body?.code}`);
  const anonCreate = await rawRpc("create_referral_reward_for_settled_request", { p_request_id: p.request.id }, hdr(anonKey));
  const anonPromote = await rawRpc("promote_referral_reward_payable", { p_reward_id: reward?.id }, hdr(anonKey));
  const helperPromote = await rawRpc("promote_referral_reward_payable", { p_reward_id: reward?.id }, helperHdr);
  expect("1b. trusted functions not executable by anon / Helper (authenticated)", denied(anonCreate) && denied(anonPromote) && denied(helperPromote), [anonCreate.status, anonPromote.status, helperPromote.status]);
  if (reward) await immutability(reward, helperHdr);
}

async function live() {
  const helper = await fx.createHelper("L", { service: "clog-clearing" });
  const helperHdr = hdr(anonKey, helper.token);
  // ---------- 14 / 4: runtime settlement through the deployed route ----------
  const a = await basis("ROUTE");
  const early = await call("create_referral_reward_for_settled_request", { p_request_id: a.request.id });
  const sa = await settleViaRoute(a);
  const [ra] = await rewardsOf(a.request.id);
  if (ra) keep(a, ra);
  expect("14a. deployed settlement (referral-eligible): route SETTLED, trusted creation -> exactly one QUALIFIED reward (reward=QUALIFIED, no silent NO_REFERRAL)", early?.code === "REQUEST_NOT_SETTLED" && sa.pending.status === 200 && sa.settled.status === 200 && sa.settled.body?.reward === "QUALIFIED" && ra?.state === "QUALIFIED" && ra.referrer_identity_id === a.referrer.id && ra.referred_identity_id === a.referred.id && ra.attribution_id === a.attribution.id && ra.tier === "WLH" && ra.reward_amount_krw === 1000, { pending: sa.pending.status, settled: sa.settled.status, reward: sa.settled.body?.reward, code: sa.settled.body?.code });
  const notes = await notesOf(a.request.id);
  expect("4e. referrer notified exactly once (REFERRAL_REWARD_CONFIRMED, WLH 1,000)", notes.length === 1 && notes[0].recipient_id === a.referrer.subject_key && Number(notes[0].payload.reward_amount_krw) === 1000);
  const again = await settleRoute(a.request.id, "SETTLED");
  expect("4f. duplicate settlement via the route: idempotent, ALREADY_QUALIFIED, one reward, one notification", again.status === 200 && again.body?.reward === "ALREADY_QUALIFIED" && (await rewardsOf(a.request.id)).length === 1 && (await notesOf(a.request.id)).length === 1, again.body?.reward);
  const n = await basis("NOREF", { attribution: false });
  extraRequests.add(n.request.id); fx.created.identityIds.add(n.referrer.id); fx.created.identityIds.add(n.referred.id);
  const sn = await settleViaRoute(n);
  expect("14b. deployed settlement (not referral-eligible): SETTLED, NO_REFERRAL, no reward", sn.settled.status === 200 && sn.settled.body?.reward === "NO_REFERRAL" && (await rewardsOf(n.request.id)).length === 0, sn.settled.body?.reward);

  // ---------- 5: promotion ----------
  const r = await basis("REVOKED");
  await settleViaRoute(r);
  const [rr] = await rewardsOf(r.request.id);
  if (rr) keep(r, rr);
  await db(`referral_attributions?id=eq.${r.attribution.id}`, "PATCH", { status: "REVOKED" });
  const blocked = await call("promote_referral_reward_payable", { p_reward_id: rr?.id });
  expect("5a. promotion blocked when the qualifying authority is no longer valid (attribution REVOKED): reward stays QUALIFIED", blocked?.code === "ATTRIBUTION_NOT_VALID" && (await rewardsOf(r.request.id))[0]?.state === "QUALIFIED", blocked);
  const qPay = await call("create_referral_payout_obligation", { p_reward_id: rr?.id, p_rail: "USDC_SOLANA", p_country: "KR" });
  expect("13a. QUALIFIED reward cannot create a payout obligation (REWARD_NOT_PAYABLE), none created", qPay?.code === "REWARD_NOT_PAYABLE" && (await db(`payout_obligations?referral_reward_id=eq.${rr?.id}&select=id`)).length === 0, qPay);

  // ---------- 10: true-parallel creation (settled request without reward, attribution added after settlement) ----------
  const c = await basis("PARCREATE", { attribution: false });
  const sc = await settleViaRoute(c);
  await addAttribution(c);
  const creates = await Promise.all(Array.from({ length: 8 }, () => call("create_referral_reward_for_settled_request", { p_request_id: c.request.id })));
  const rc = await rewardsOf(c.request.id);
  if (rc[0]) keep(c, rc[0]);
  const codes = creates.map((x) => x?.code);
  expect("10. true-parallel creation (8 concurrent calls, same settled request): one QUALIFIED, 7 ALREADY_QUALIFIED, one reward, one notification", sc.settled.body?.reward === "NO_REFERRAL" && codes.filter((x) => x === "QUALIFIED").length === 1 && codes.filter((x) => x === "ALREADY_QUALIFIED").length === 7 && rc.length === 1 && (await notesOf(c.request.id)).length === 1, codes);

  // ---------- 11 / 13: true-parallel promotion, then parallel obligation creation ----------
  const promos = await Promise.all(Array.from({ length: 8 }, () => call("promote_referral_reward_payable", { p_reward_id: rc[0]?.id })));
  expect("11a. true-parallel promotion (8 concurrent): exactly one QUALIFIED -> PAYABLE, 7 safe replays, one reward", promos.filter((x) => x?.success && x.replayed === false).length === 1 && promos.filter((x) => x?.success && x.replayed === true).length === 7 && (await rewardsOf(c.request.id)).length === 1 && (await rewardsOf(c.request.id))[0].state === "PAYABLE", promos.map((x) => x?.replayed ?? x?.code));
  const obls = await Promise.all(Array.from({ length: 6 }, () => call("create_referral_payout_obligation", { p_reward_id: rc[0]?.id, p_rail: "USDC_SOLANA", p_country: "KR" })));
  const obRows = await db(`payout_obligations?referral_reward_id=eq.${rc[0]?.id}&select=id,status`);
  const jobs = obRows.length ? await db(`money_movement_jobs?payout_obligation_id=eq.${obRows[0].id}&select=id,status`) : [];
  expect("11b / 13b. PAYABLE -> payout obligation via the existing trusted function; 6 concurrent calls -> ONE obligation, ONE money job, reward PAYOUT_PROCESSING", obls.filter((x) => x?.success && x.replayed === false).length === 1 && obls.every((x) => x?.success) && obRows.length === 1 && jobs.length === 1 && (await rewardsOf(c.request.id))[0].state === "PAYOUT_PROCESSING", obls.map((x) => x?.replayed ?? x?.code));
  const forcePaid = await rest(`referral_rewards?id=eq.${rc[0]?.id}`, svc, "PATCH", { state: "PAID" });
  expect("13c. PAID still requires the confirmed external path: direct PAYOUT_PROCESSING -> PAID refused", denied(forcePaid) && (await rewardsOf(c.request.id))[0].state === "PAYOUT_PROCESSING", forcePaid.status);

  // ---------- 13d: deployed payout route (promotion replay + obligation); referrer has NO destination -> no chain ----------
  const payRoute = await fetch(`${base}/api/sys/rewards/${ra?.id}/payout`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ country: "KR" }) }).then(async (x) => ({ status: x.status, body: await readResponse(x) }));
  const raOb = await db(`payout_obligations?referral_reward_id=eq.${ra?.id}&select=id,status`);
  const raJobs = raOb.length ? await db(`money_movement_jobs?payout_obligation_id=eq.${raOb[0].id}&select=id,status,last_error_code`) : [];
  const raAtt = raJobs.length ? await db(`money_movement_attempts?job_id=eq.${raJobs[0].id}&select=id`) : [];
  expect("13d. deployed payout route: QUALIFIED -> trusted promotion -> PAYABLE -> one obligation + one job -> PAYOUT_PROCESSING; no destination -> no attempt, no chain", payRoute.status === 200 && payRoute.body?.rewardState === "PAYOUT_PROCESSING" && raOb.length === 1 && raJobs.length === 1 && raAtt.length === 0, { status: payRoute.status, dispatch: payRoute.body?.dispatch, rewardState: payRoute.body?.rewardState, job: raJobs[0] });
  for (const job of [...jobs, ...raJobs]) {
    for (let i = 0; i < 12; i += 1) {
      const cl = await call("claim_money_job", { p_job_id: job.id, p_lease_seconds: 30 });
      if (cl?.success) { await call("release_money_job", { p_job_id: job.id, p_lease: cl.job.lease_token, p_class: "REVIEW", p_code: `TEST_FIXTURE_${runId}`, p_delay_seconds: null }); break; }
      if (cl?.code === "JOB_FINAL" || cl?.code === "NOT_DUE") break;
      await sleep(5000);
    }
  }
  // A job the deployed outbox already ran (payout route) WAITS for a destination (NOT_DUE until its retry):
  // no destination -> it can never prepare / sign; it is left waiting, never forced.
  const finals = await Promise.all([...jobs, ...raJobs].map(async (j) => { const row = (await db(`money_movement_jobs?id=eq.${j.id}&select=id,status,last_error_code,next_retry_at`))[0]; return { ...row, attempts: (await db(`money_movement_attempts?job_id=eq.${j.id}&select=id`)).length }; }));
  record("INFO", `fixture payout jobs: ${JSON.stringify(finals)}`);
  expect("Fixture payout jobs safe: REVIEW_REQUIRED, or waiting on PAYOUT_DESTINATION_MISSING with 0 attempts (never processed to chain; rewards never PAID)", finals.every((j) => j.attempts === 0 && (j.status === "REVIEW_REQUIRED" || (j.status === "PENDING" && j.last_error_code === "PAYOUT_DESTINATION_MISSING"))), finals);

  // ---------- 12: invalidation vs promotion, true-parallel (attribution revocation is the authoritative invalidation available live) ----------
  const races = [];
  for (let i = 0; i < 3; i += 1) {
    const x = await basis(`RACE${i}`);
    await settleViaRoute(x);
    const [rx] = await rewardsOf(x.request.id);
    if (rx) keep(x, rx);
    const [rev, pro] = await Promise.all([db(`referral_attributions?id=eq.${x.attribution.id}`, "PATCH", { status: "REVOKED" }).then(() => "revoked"), call("promote_referral_reward_payable", { p_reward_id: rx?.id })]);
    const state = (await rewardsOf(x.request.id))[0]?.state;
    const attStatus = (await db(`referral_attributions?id=eq.${x.attribution.id}&select=status`))[0]?.status;
    races.push({ outcome: pro?.success ? "PROMOTED_FIRST" : pro?.code, state, attribution: attStatus, rev });
  }
  expect("12. revocation vs promotion (true-parallel, 3 trials): every outcome is consistent - either promotion committed first under still-valid authority (PAYABLE) or the revocation won (ATTRIBUTION_NOT_VALID, reward QUALIFIED); never an error / stale mix", races.every((o) => o.attribution === "REVOKED" && ((o.outcome === "PROMOTED_FIRST" && o.state === "PAYABLE") || (o.outcome === "ATTRIBUTION_NOT_VALID" && o.state === "QUALIFIED"))), races);
  record("INFO", "Refund / reversal vs promotion: no SETTLED funded request can carry a blocking refund today (no post-settlement refund path; creating one needs a fabricated confirmed payout) - covered deterministically in PGlite (test_referral_reward_authority_db 22, 23, 26, 27): full refund blocks, price-difference / stray-deposit return do not, reversal committed first blocks promotion");
  record("INFO", "Policy note: a reward promoted before a (future) post-settlement reversal stays PAYABLE; any future post-settlement refund feature must re-check reward authority before payout and define QUALIFIED / PAYABLE / PAYOUT_PROCESSING / PAID behaviour (not implemented now)");

  // ---------- 1-3 again on the deployed runtime + privilege re-audit ----------
  const p = await basis("MATRIX");
  await privilegeMatrix(p);
  extraRequests.add(p.request.id); fx.created.identityIds.add(p.referrer.id); fx.created.identityIds.add(p.referred.id);
  await immutability(ra ?? rc[0], helperHdr);
  const grants = {};
  for (const [t, col] of [["referral_rewards", "state"], ["payment_intents", "status"], ["payment_chain_transactions", "classification"], ["payment_quotes", "fx_rate"], ["service_checkouts", "status"], ["service_refunds", "status"], ["payout_obligations", "status"], ["money_movement_jobs", "status"], ["money_movement_attempts", "state"], ["operator_review_actions", "reason"]]) {
    grants[`${t}:update`] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "PATCH", { [col]: "X" }));
    grants[`${t}:delete`] = denied(await rest(`${t}?id=eq.${ZERO}`, svc, "DELETE"));
  }
  expect("17. privilege re-audit: no broad UPDATE / DELETE for the app role on referral_rewards, payment_intents, chain txs, quotes, checkouts, refunds, payout obligations, money jobs / attempts, operator review audit", Object.values(grants).every(Boolean), Object.entries(grants).filter(([, v]) => !v));

  // ---------- 15 / 16 / runtime static ----------
  const read = (f) => fs.readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
  const scripts = fs.readdirSync(new URL("./", import.meta.url)).filter((f) => f.endsWith(".mjs") && f.startsWith("test_") && f.includes("staging"));
  const writers = scripts.filter((f) => /db\(\s*["`]referral_rewards["`?][^)]*"POST"|referral_rewards\?[^`]*`,\s*"DELETE"/.test(read(f)) && f !== "test_referral_authority_staging.mjs" && f !== "test_financial_authority_staging.mjs");
  expect("15 / 16. staging drivers (incl. the real-chain E2E source, not run) never POST a reward or DELETE reward history", writers.length === 0 && !/referral_rewards", "POST"/.test(read("test_real_devnet_e2e_staging.mjs")) && /legitimatePayableReward/.test(read("test_real_devnet_e2e_staging.mjs")), writers);
}

async function windowAudit() {
  const since = arg("since"), until = arg("until");
  if (!since || !until) throw new Error("--since and --until are required");
  const audits = await db(`admin_audit_logs?action=eq.SERVICE_SETTLED&created_at=gte.${encodeURIComponent(since)}&created_at=lte.${encodeURIComponent(until)}&select=entity_id,created_at`);
  const ids = [...new Set(audits.map((x) => x.entity_id))];
  const eligible = [], missing = [], backfilled = [];
  for (const id of ids) {
    const [req] = await db(`service_requests?id=eq.${id}&select=id,customer_id,status,description`);
    const [identity] = req ? await db(`referral_identities?subject_type=eq.CUSTOMER&subject_key=eq.${encodeURIComponent(req.customer_id)}&select=id`) : [];
    const [att] = identity ? await db(`referral_attributions?referred_identity_id=eq.${identity.id}&status=eq.ACTIVE&select=id`) : [];
    if (!att) continue;
    eligible.push(id);
    if ((await rewardsOf(id)).length) continue;
    missing.push(id);
    const res = await call("create_referral_reward_for_settled_request", { p_request_id: id });
    if (res?.code === "QUALIFIED") backfilled.push({ id, reward: res.reward_id });
  }
  record("INFO", `apply->deploy window ${since} .. ${until}: settlements=${ids.length} referral-eligible=${eligible.length} missing=${missing.length} backfilled=${backfilled.length}`, JSON.stringify({ ids, eligible, missing, backfilled }));
  expect("9. apply->deploy window: every referral-eligible settlement has its reward (backfilled only via the trusted function)", missing.length === backfilled.length);
}

try {
  if (phase === "gate") await gate();
  else if (phase === "live") await live();
  else if (phase === "window") await windowAudit();
  else throw new Error(`unknown phase ${phase}`);
} catch (error) {
  record("FAIL", "referral authority harness", String(error?.stack || error).slice(0, 600));
} finally {
  for (const id of extraRequests) fx.created.requestIds.add(id);
  const out = await fx.cleanup();
  out.requests -= retained.requests.length; // rewarded qualifying requests are kept with their reward
  if (retained.rewards.length) record("INFO", `RETAINED (financial history, never deleted): rewards=${retained.rewards.join(",")} requests=${retained.requests.join(",")} identities=${[...new Set(retained.identities)].join(",")}`);
  expect("Fixture cleanup (helper / users / non-rewarded requests + identities removed; reward history retained)", Object.values(out).every((v) => v === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

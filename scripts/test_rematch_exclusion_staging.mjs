// Live STAGING verification of migration 202609260011 (rematch exclusion after DECLINED / TIMEOUT).
//
//   0. Matcher RPC exists with the same signature (p_request_id uuid -> jsonb).
//   1. Region/service eligibility + ranking on the real database.
//   2. Real API flow: customer B request -> H1 -> H1 DECLINES via the helper route -> rematch to H2,
//      with real Web Push delivery (Mozilla autopush) to H1 once and H2 once; retries create nothing.
//      Customer ownership (B, not referrer A) holds through decline, rematch and completion.
//   3. Declined H1 still eligible for an unrelated request.
//   4. Only-declined-helper -> no re-pick, existing no-helper path.
//   5. TIMEOUT (database behaviour via the existing release RPC; no timeout runner exists).
//   6. Ranking with same-request DECLINED history; CANCELLED history is not an exclusion.
//   7. True concurrent race (two Promise.all matcher calls for one free helper).
//
// Database-level scenarios use service-role fixtures in their own sido so they cannot interfere.
// Usage: node scripts/test_rematch_exclusion_staging.mjs
import crypto from "node:crypto";
import { Autopush, base, db, fixtures, minimalPayload, readResponse, recorder, rpc, sleep, subscribe, supabaseUrl, serviceKey, waitFor } from "./lib/stagingPushHarness.mjs";

const runId = `RX${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const autopush = new Autopush();
const S = (n) => `${runId}-${n}`;
const activeRows = (requestId) => db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id,status`);
const allRows = (requestId) => db(`request_assignments?request_id=eq.${requestId}&select=id,helper_id,status&order=assigned_at`);
const match = async (requestId) => { const r = await rpc("match_and_assign_helper", { p_request_id: requestId }); return { ...r, assigned: (await activeRows(requestId))[0]?.helper_id ?? null }; };
const release = async (requestId, status) => rpc("release_assignment_for_rematch", { p_assignment_id: (await activeRows(requestId))[0]?.id, p_release_status: status });
const helperAction = async (helper, assignmentId, action) => { const r = await fetch(`${base}/api/helper/assignments/${assignmentId}/${action}`, { method: "POST", headers: helper.auth }); return { status: r.status, body: await readResponse(r) }; };
// 120s: Mozilla autopush has been measured delivering >45s after accepting (201) a message.
const countAfter = async (channel, n, ms = 120000) => waitFor(async () => (autopush.received(channel).length >= n ? true : null), ms, 500);

try {
  // ================= 0. matcher exists, same signature =================
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })).json();
  const params = spec.paths?.["/rpc/match_and_assign_helper"]?.post?.parameters?.[0]?.schema?.properties || spec.definitions?.["(rpc) match_and_assign_helper"]?.properties || {};
  const unknown = await rpc("match_and_assign_helper", { p_request_id: crypto.randomUUID() });
  const badType = await rpc("match_and_assign_helper", { p_request_id: "not-a-uuid" });
  expect("A/B. match_and_assign_helper exists: single uuid parameter, returns a jsonb object", !!spec.paths?.["/rpc/match_and_assign_helper"] && Object.keys(params).join() === "p_request_id" && params.p_request_id?.format === "uuid" && unknown.status === 200 && unknown.data?.success === false && unknown.data?.error === "Request not found" && badType.status >= 400 && badType.data?.code === "22P02", { params, unknown, badType: badType.data?.code });

  // ================= 1. region / service eligibility + ranking =================
  const e1 = await fx.createHelper("E1", { sido: S("E"), rating: 5 });
  const e2 = await fx.createHelper("E2", { sido: S("E"), rating: 4 });
  await fx.createHelper("E3", { sido: S("E-OTHER"), rating: 5 });
  await fx.createHelper("E4", { sido: S("E"), rating: 5, service: "cleaning" });
  const rE = await fx.insertRequest("eligibility", { sido: S("E") });
  const mE = await match(rE);
  expect("C/E/F. initial matching: highest-rated eligible helper; other sido and other service excluded", mE.status === 200 && mE.data.status === "MATCHED" && mE.assigned === e1.helper.id, mE);
  const rE2 = await fx.insertRequest("eligibility-2", { sido: S("E") });
  const mE2 = await match(rE2);
  const rE3 = await fx.insertRequest("eligibility-3", { sido: S("E") });
  const mE3 = await match(rE3);
  expect("D. active-assignment protection: busy H1 skipped (-> H2), then nobody free", mE2.assigned === e2.helper.id && mE3.data.status === "NO_HELPER_AVAILABLE" && mE3.assigned === null, { mE2: mE2.assigned, mE3: mE3.data });

  // ================= 2. real API decline -> rematch with push + ownership =================
  const h1 = await fx.createHelper("H1", { rating: 5 });
  const h2 = await fx.createHelper("H2", { rating: 4 });
  const A = await fx.customerDevice("A");
  const B = await fx.customerDevice("B", A.publicId);
  await autopush.connect();
  const [h1Ch, h2Ch, aCh, bCh] = [await autopush.register(), await autopush.register(), await autopush.register(), await autopush.register()];
  const subs = [await subscribe("helper", h1Ch.subscription, h1.auth), await subscribe("helper", h2Ch.subscription, h2.auth), await subscribe("customer", aCh.subscription, { Cookie: A.cookie }), await subscribe("customer", bCh.subscription, { Cookie: B.cookie })];
  expect("Fixtures: H1 (rank 1), H2 (rank 2), referrer A, customer B, 4 real push channels", subs.every((s) => s.status === 200) && A.cookie && B.cookie, subs.map((s) => s.status));
  const R = await fx.createRequest(B, { claimedCustomerId: A.publicId, label: "decline" });
  const first = (await activeRows(R.body.requestId))[0];
  await countAfter(h1Ch, 1);
  expect("Initial match via API: R -> H1, H1 gets exactly one new-assignment push (real)", R.status === 201 && R.body.status === "MATCHED" && first?.helper_id === h1.helper.id && autopush.received(h1Ch).length === 1 && autopush.received(h1Ch)[0].type === "HELPER_ASSIGNED", { status: R.status, first, h1: autopush.received(h1Ch).length });
  const decline = await helperAction(h1, first?.id, "decline");
  const rows = await allRows(R.body.requestId);
  const active = rows.filter((r) => ["PENDING", "NOTIFIED", "ACCEPTED"].includes(r.status));
  expect("H1 DECLINES (still on duty) -> H1 NOT re-picked; R rematched to H2", decline.status === 200 && decline.body.release?.request_reopened === true && decline.body.matching?.status === "MATCHED" && active.length === 1 && active[0].helper_id === h2.helper.id, { decline: decline.body, rows });
  expect("History: H1 row DECLINED preserved, H2 row active, exactly one active row", rows.length === 2 && rows[0].helper_id === h1.helper.id && rows[0].status === "DECLINED" && rows[1].helper_id === h2.helper.id && rows[1].status === "PENDING");
  await countAfter(h2Ch, 1);
  const h2Push = autopush.received(h2Ch)[0];
  expect("H2 real rematch push: accepted by the push service and decrypted as HELPER_ASSIGNED", autopush.received(h2Ch).length === 1 && h2Push?.type === "HELPER_ASSIGNED" && minimalPayload(h2Push, [R.body.requestId, B.publicId, A.publicId]), h2Push);
  const h2Row = (await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(h2Ch.endpoint)}&select=last_success_at,failure_count`))[0];
  expect("Push provider accepted delivery to H2 (success recorded)", !!h2Row?.last_success_at && h2Row.failure_count === 0, h2Row);
  // Retries: the decline again, and the matcher again on the now-MATCHED request.
  const retryDecline = await helperAction(h1, first?.id, "decline");
  const retryMatch = await rpc("match_and_assign_helper", { p_request_id: R.body.requestId });
  await sleep(12000);
  expect("H1 receives no push for H2's assignment", autopush.received(h1Ch).length === 1, autopush.received(h1Ch).length);
  expect("Retried decline / matcher create no second assignment and no duplicate push", retryDecline.status === 409 && retryMatch.data?.success === false && (await allRows(R.body.requestId)).length === 2 && autopush.received(h2Ch).length === 1, { retry: retryDecline.status, match: retryMatch.data, h2: autopush.received(h2Ch).length });
  const inApp = await db(`app_notifications?type=eq.NEW_SERVICE_REQUEST&payload->>request_id=eq.${R.body.requestId}&select=recipient_id`);
  expect("In-app new-assignment records: H1 once, H2 once", inApp.length === 2 && inApp.filter((n) => n.recipient_id === h1.helper.helper_id).length === 1 && inApp.filter((n) => n.recipient_id === h2.helper.helper_id).length === 1, inApp);
  // Customer ownership through decline, rematch and completion.
  const steps = [];
  for (const action of ["accept", "start", "complete"]) steps.push((await helperAction(h2, active[0]?.id, action)).status);
  await countAfter(bCh, 1);
  await sleep(8000);
  const owner = (await db(`service_requests?id=eq.${R.body.requestId}&select=customer_id,status`))[0];
  const attribution = (await db(`referral_attributions?referred_identity_id=eq.${B.identityId}&select=referrer_identity_id`))[0];
  expect("Ownership after decline/rematch/completion: request stays B's (A's claimed id ignored)", owner?.customer_id === B.publicId && owner.status === "COMPLETED" && steps.every((s) => s === 200) && attribution?.referrer_identity_id === A.identityId, { owner, steps });
  expect("Lifecycle push only to B, never to referrer A", autopush.received(bCh).some((p) => p.type === "SERVICE_STATUS") && autopush.received(aCh).length === 0, { b: autopush.received(bCh).length, a: autopush.received(aCh).length });

  // ================= 3. declined H1 eligible for an unrelated request =================
  const R2 = await fx.createRequest(B, { label: "unrelated" });
  const r2Row = (await activeRows(R2.body.requestId))[0];
  await countAfter(h1Ch, 2);
  expect("DECLINED H1 is matched to unrelated R2 (exclusion is request-scoped) and pushed once", R2.body.status === "MATCHED" && r2Row?.helper_id === h1.helper.id && autopush.received(h1Ch).length === 2, { r2Row, h1: autopush.received(h1Ch).length });

  // ================= 4. only the declined helper available =================
  const o1 = await fx.createHelper("O1", { sido: S("O") });
  const R3 = await fx.insertRequest("only-declined", { sido: S("O") });
  const m3 = await match(R3);
  const rel3 = await release(R3, "DECLINED");
  const re3 = await match(R3);
  const rows3 = await allRows(R3);
  expect("Only declined helper: NOT re-picked; existing no-helper path", m3.assigned === o1.helper.id && rel3.data?.request_reopened === true && re3.data?.status === "NO_HELPER_AVAILABLE" && re3.assigned === null && rows3.length === 1 && rows3[0].status === "DECLINED", { re3: re3.data, rows3 });
  record("INFO", `No-helper reason after the only helper declined: ${re3.data?.sub_reason}`);
  const esc3 = await db(`admin_escalations?request_id=eq.${R3}&select=reason,status`);
  expect("Escalation recorded for the no-helper request", esc3.length === 1 && esc3[0].reason === "NO_HELPER_AVAILABLE", esc3);

  // ================= 5. TIMEOUT (database behaviour; no timeout runner exists) =================
  const t1 = await fx.createHelper("T1", { sido: S("T"), rating: 5 });
  const t2 = await fx.createHelper("T2", { sido: S("T"), rating: 4 });
  const R4 = await fx.insertRequest("timeout", { sido: S("T") });
  const m4 = await match(R4);
  const rel4 = await release(R4, "TIMEOUT");
  const re4 = await match(R4);
  const rows4 = await allRows(R4);
  expect("TIMEOUT (via existing release RPC): T1 not re-picked for R4; T2 selected", m4.assigned === t1.helper.id && rel4.data?.success === true && re4.assigned === t2.helper.id && rows4.some((r) => r.helper_id === t1.helper.id && r.status === "TIMEOUT"), { rel4: rel4.data, re4: re4.assigned, rows4 });
  const R5 = await fx.insertRequest("timeout-unrelated", { sido: S("T") });
  expect("TIMEOUT T1 still eligible for unrelated R5", (await match(R5)).assigned === t1.helper.id);

  // ================= 6. ranking with same-request DECLINED history; CANCELLED =================
  const k1 = await fx.createHelper("K1", { sido: S("K"), rating: 5 });
  const k2 = await fx.createHelper("K2", { sido: S("K"), rating: 4 });
  await fx.createHelper("K3", { sido: S("K"), rating: 3 });
  const R6 = await fx.insertRequest("ranking-declined", { sido: S("K") });
  await db("request_assignments", "POST", { request_id: R6, helper_id: k1.helper.id, status: "DECLINED" });
  expect("Ranking: K1 has DECLINED history for R6 -> next-ranked K2 (not K3)", (await match(R6)).assigned === k2.helper.id);
  const R7 = await fx.insertRequest("ranking-unrelated", { sido: S("K") });
  expect("Ranking: unrelated R7 -> K1 wins again (ahead of free K3)", (await match(R7)).assigned === k1.helper.id);
  const c1 = await fx.createHelper("C1", { sido: S("C") });
  const R8 = await fx.insertRequest("cancelled", { sido: S("C") });
  await db("request_assignments", "POST", { request_id: R8, helper_id: c1.helper.id, status: "CANCELLED" });
  expect("CANCELLED history alone does not exclude (rule not expanded)", (await match(R8)).assigned === c1.helper.id);

  // ================= 7. true concurrent race =================
  const x1 = await fx.createHelper("X1", { sido: S("X") });
  const [RA, RB] = [await fx.insertRequest("race-a", { sido: S("X") }), await fx.insertRequest("race-b", { sido: S("X") })];
  const results = await Promise.all([rpc("match_and_assign_helper", { p_request_id: RA }), rpc("match_and_assign_helper", { p_request_id: RB })]);
  const statuses = results.map((r) => r.data?.status).sort();
  const xActive = await db(`request_assignments?helper_id=eq.${x1.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=request_id`);
  const loserId = results[0].data?.status === "MATCHED" ? RB : RA;
  const loserRows = await allRows(loserId);
  const loserReq = (await db(`service_requests?id=eq.${loserId}&select=status`))[0];
  expect("True concurrent race: exactly one request acquires the helper", statuses.join() === "MATCHED,NO_HELPER_AVAILABLE" && xActive.length === 1, { statuses, xActive });
  expect("Race loser: no active, partial or historical assignment row", loserRows.length === 0 && loserReq?.status === "NO_HELPER_AVAILABLE", { loserRows, loserReq });
  record("INFO", `Active assignments for the raced helper after the race: ${xActive.length}`);
} catch (error) {
  record("FAIL", "E2E harness", String(error?.stack || error).slice(0, 500));
} finally {
  autopush.close();
  await sleep(500);
  const leftovers = await fx.cleanup();
  expect("Fixture cleanup", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

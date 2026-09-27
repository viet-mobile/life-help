// Live STAGING verification of migration 202609280016 (conversation lifecycle integrity), database
// level, BEFORE deploying: every invariant proven by behaviour on isolated fixtures through the same
// PostgREST message insert the app uses. Funding = FABRICATED observation on test_fixture checkouts
// (DB fixture, no chain transaction); all fixtures purged afterwards.
// Usage: node scripts/test_conversation_migration_staging.mjs
import fs from "node:fs";
import { base, db, fixtures, readResponse, recorder, rpc, serviceKey, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `CM${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
const rest = async (pathname, method, body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...svc, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const post = (conversationId, role, sender, text = "hi") => rest("messages", "POST", { conversation_id: conversationId, sender_role: role, sender_id: sender, original_language: "en", original_text: text });
const refused = (r) => r.status >= 400 && /CONVERSATION_NOT_WRITABLE/.test(JSON.stringify(r.body));
const conv = (requestId) => db(`conversations?request_id=eq.${requestId}&select=id,helper_id,status,closed_at&order=created_at`);
const reqStatus = async (id) => (await db(`service_requests?id=eq.${id}&select=status`))[0]?.status;
const current = async (id) => (await db(`request_assignments?request_id=eq.${id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id`))[0];
const helperAction = async (h, assignmentId, action) => (await fetch(`${base}/api/helper/assignments/${assignmentId}/${action}`, { method: "POST", headers: h.auth })).status;

try {
  // ================= A. Mode A: decline -> reselection =================
  const H1 = await mf.helperWithPrice("A1", 60000), H2 = await mf.helperWithPrice("A2", 55000);
  const customer = "CMCUSTAA";
  const coA = await mf.helperCheckout(H1, customer, "mode A");
  const mediaA = await call("register_request_media", { p_checkout_id: coA.checkout_id, p_customer_id: customer, p_storage_provider: "SUPABASE_STORAGE_PRIVATE", p_object_key: `requests/${coA.checkout_id}/${runId}-a.jpg`, p_content_type: "image/jpeg", p_byte_size: 10 });
  const fA = await mf.fixtureFund(coA.checkout_id, customer);
  const [c1] = await conv(fA.requestId);
  expect("A0. activation (DB fixture): exactly one ACTIVE conversation C1 with H1; customer and H1 can write (app insert path)", c1?.status === "ACTIVE" && c1.helper_id === H1.helper.id && (await post(c1.id, "CUSTOMER", customer)).status === 201 && (await post(c1.id, "HELPER", H1.helper.id)).status === 201);
  const rel = await call("release_assignment_for_rematch", { p_assignment_id: (await current(fA.requestId)).id, p_release_status: "DECLINED" });
  const [c1after] = await conv(fA.requestId);
  expect("A1. assignment-ending closure: H1 decline -> C1 CLOSED in the same transition; request CUSTOMER_RESELECTION_REQUIRED", rel?.customer_reselection_required === true && c1after.status === "CLOSED" && !!c1after.closed_at && (await reqStatus(fA.requestId)) === "CUSTOMER_RESELECTION_REQUIRED");
  expect("A2. message guard: customer -> stale C1 refused; old Helper H1 -> C1 refused", refused(await post(c1.id, "CUSTOMER", customer)) && refused(await post(c1.id, "HELPER", H1.helper.id)));
  const rs = await call("reselect_customer_helper", { p_request_id: fA.requestId, p_customer_id: customer, p_price_id: H2.price.price_id, p_price_revision: H2.price.revision });
  const convA = await conv(fA.requestId);
  const c2 = convA.find((c) => c.id !== c1.id);
  const sels = await db(`request_price_selections?request_id=eq.${fA.requestId}&select=selection_version,status,helper_id&order=selection_version`);
  expect("A3. reselection -> NEW conversation C2 with H2 (C1 != C2); C1 stays CLOSED; exactly one ACTIVE; v2 is the only ACCEPTED selection", rs?.success && c2?.helper_id === H2.helper.id && c2.status === "ACTIVE" && convA.find((c) => c.id === c1.id).status === "CLOSED" && convA.filter((c) => c.status === "ACTIVE").length === 1 && sels.length === 2 && sels[0].status === "ENDED" && sels[1].status === "ACCEPTED" && sels[1].helper_id === H2.helper.id, rs);
  expect("A4. new Helper H2 -> old C1 refused; H1 -> C2 refused; customer <-> H2 on C2 allowed", refused(await post(c1.id, "HELPER", H2.helper.id)) && refused(await post(c2.id, "HELPER", H1.helper.id)) && (await post(c2.id, "CUSTOMER", customer)).status === 201 && (await post(c2.id, "HELPER", H2.helper.id)).status === 201);
  const reopen = await rest(`conversations?id=eq.${c1.id}`, "PATCH", { status: "ACTIVE" });
  const swap = await rest(`conversations?id=eq.${c2.id}`, "PATCH", { helper_id: H1.helper.id });
  const dup = await rest("conversations", "POST", { request_id: fA.requestId, conversation_type: "CUSTOMER_HELPER", customer_id: customer, helper_id: H1.helper.id });
  expect("A5. forward-only (C1 cannot become ACTIVE), participants immutable, a second ACTIVE conversation is impossible (unique)", reopen.status >= 400 && swap.status >= 400 && dup.status === 409 && (await conv(fA.requestId)).filter((c) => c.status === "ACTIVE").length === 1, [reopen.status, swap.status, dup.status]);
  const view = async (helperId) => (await call("authorize_request_media_view", { p_media_id: mediaA.media_id, p_customer_id: null, p_helper_id: helperId }))?.success === true;
  expect("A6. media regression: released H1 denied, current H2 allowed, owner allowed", !(await view(H1.helper.id)) && await view(H2.helper.id) && (await call("authorize_request_media_view", { p_media_id: mediaA.media_id, p_customer_id: customer, p_helper_id: null }))?.success === true);

  // ================= E. Helper completion rule (continues on H2's request) =================
  const asg2 = await current(fA.requestId);
  const steps = [await helperAction(H2, asg2.id, "accept"), await helperAction(H2, asg2.id, "start"), await helperAction(H2, asg2.id, "complete")];
  expect("E1. Helper completion keeps the conversation writable by BOTH sides", steps.every((s) => s === 200) && (await conv(fA.requestId)).find((c) => c.id === c2.id).status === "ACTIVE" && (await post(c2.id, "CUSTOMER", customer)).status === 201 && (await post(c2.id, "HELPER", H2.helper.id)).status === 201, steps);
  expect("E2. Helper media access still ends at Helper completion (separate rule)", !(await view(H2.helper.id)));
  const done = await call("confirm_service_completion", { p_request_id: fA.requestId, p_customer_id: customer });
  expect("E3. after '서비스 완료' (PAYMENT_PENDING) still writable by both; payout obligation + one job created (financial path unchanged)", done?.success && (await reqStatus(fA.requestId)) === "PAYMENT_PENDING" && (await post(c2.id, "CUSTOMER", customer)).status === 201 && (await post(c2.id, "HELPER", H2.helper.id)).status === 201 && (await db(`money_movement_jobs?payout_obligation_id=eq.${done.payout_obligation_id}&select=id`)).length === 1);
  await db(`service_requests?id=eq.${fA.requestId}`, "PATCH", { status: "SETTLED" });
  expect("E4. settlement (SETTLED) closes the conversation; no write afterwards; content kept for the existing cleanup", (await conv(fA.requestId)).every((c) => c.status === "CLOSED") && refused(await post(c2.id, "CUSTOMER", customer)) && (await db(`messages?conversation_id=eq.${c2.id}&select=id`)).length === 6);

  // ================= B. Mode B reopen + funded cancel =================
  const [B1, B2] = [await mf.helperWithPrice("B1", 60000), await mf.helperWithPrice("B2", 61000)];
  const cb = await mf.offerCheckout("CMCUSTBB", "mode B");
  const fB = await mf.fixtureFund(cb.checkout_id, "CMCUSTBB");
  const acc1 = await call("accept_customer_offer_request", { p_helper_id: B1.helper.id, p_request_id: fB.requestId });
  const [cb1] = await conv(fB.requestId);
  await call("release_assignment_for_rematch", { p_assignment_id: (await current(fB.requestId)).id, p_release_status: "DECLINED" });
  const feedB1 = await call("list_open_customer_offers", { p_helper_id: B1.helper.id });
  expect("B1. Mode B: H1 accepts -> C1; declines -> C1 CLOSED, the SAME funded offer reopens, H1 excluded from it", acc1?.success && cb1?.helper_id === B1.helper.id && (await conv(fB.requestId))[0].status === "CLOSED" && (await reqStatus(fB.requestId)) === "OPEN_FOR_HELPERS" && !JSON.stringify(feedB1 ?? []).includes(fB.requestId) && refused(await post(cb1.id, "CUSTOMER", "CMCUSTBB")));
  const acc2 = await call("accept_customer_offer_request", { p_helper_id: B2.helper.id, p_request_id: fB.requestId });
  const convB = await conv(fB.requestId);
  expect("B2. H2 accepts -> NEW conversation C2 (no reuse), one ACTIVE, no second payment intent", acc2?.success && convB.length === 2 && convB[1].helper_id === B2.helper.id && convB.filter((c) => c.status === "ACTIVE").length === 1 && (await db(`payment_intents?checkout_id=eq.${cb.checkout_id}&select=id`)).length === 1);
  await call("release_assignment_for_rematch", { p_assignment_id: (await current(fB.requestId)).id, p_release_status: "DECLINED" });
  const k1 = await call("cancel_funded_request", { p_request_id: fB.requestId, p_customer_id: "CMCUSTBB" });
  const k2 = await call("cancel_funded_request", { p_request_id: fB.requestId, p_customer_id: "CMCUSTBB" });
  const refunds = await db(`service_refunds?payment_intent_id=eq.${fB.intent.intent_id}&select=id`);
  expect("B3. funded cancel: CANCELLED, every conversation CLOSED / unwritable, refund exactly once (1 obligation + 1 job), replay creates nothing", k1?.success && k2?.replayed === true && (await reqStatus(fB.requestId)) === "CANCELLED" && (await conv(fB.requestId)).every((c) => c.status === "CLOSED") && refused(await post(convB[1].id, "CUSTOMER", "CMCUSTBB")) && refunds.length === 1 && (await db(`money_movement_jobs?service_refund_id=eq.${refunds[0].id}&select=id`)).length === 1);

  // ================= C. request-leaving-service closure on other paths =================
  for (const [label, status] of [["operator CANCELLED", "CANCELLED"], ["EXPIRED", "EXPIRED"]]) {
    const H = await mf.helperWithPrice(`X${status.slice(0, 2)}`, status === "EXPIRED" ? 63000 : 62000);
    const cx = await mf.helperCheckout(H, `CM${status.slice(0, 6)}`.padEnd(8, "Z"), label);
    const fXx = await mf.fixtureFund(cx.checkout_id, `CM${status.slice(0, 6)}`.padEnd(8, "Z"));
    const [live] = await conv(fXx.requestId);
    await db(`service_requests?id=eq.${fXx.requestId}`, "PATCH", { status });
    expect(`C. ${label} on a request with a LIVE conversation closes it in the same statement; writes refused`, live?.status === "ACTIVE" && (await conv(fXx.requestId))[0].status === "CLOSED" && refused(await post(live.id, "CUSTOMER", `CM${status.slice(0, 6)}`.padEnd(8, "Z"))));
  }

  // ================= D. no financial object touched by 016 =================
  const m016 = fs.readFileSync(new URL("../supabase/migrations/202609280016_conversation_lifecycle_integrity.sql", import.meta.url), "utf8").replace(/^\s*--.*$/gm, "");
  expect("D. migration 016 references no financial table / function (payment_*, payout_*, refunds, money_*, checkouts, referral_*)", !/payment_|payout_|service_refunds|money_movement|service_checkouts|referral_|external_payment/.test(m016));
} catch (error) {
  record("FAIL", "migration 016 live harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (purged: checkouts + money rows; helpers, users, requests, conversations, messages)", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

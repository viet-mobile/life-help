// Live STAGING conversation lifecycle (migration 016 + current chat route), true parallel HTTP.
// PRECONDITION: migration 202609280016 applied to staging AND the current HEAD deployed.
// Funding is a FABRICATED observation on test_fixture checkouts (DB fixture, no chain transaction).
//   R1  decline vs customer message, in true parallel, repeated: no message after the relationship ends
//   R2  operator CANCELLED vs customer message on a live conversation, in true parallel
//   S   stale replay: customer / old Helper / new Helper / anonymous / public ID / ?ref= against the old relationship
//   N   new Helper gets a new conversation; current chat lookup returns only it
//   F   funded cancel after the last decline: refund exactly once, no writable conversation
// Usage: node scripts/test_conversation_lifecycle_staging.mjs
import { base, db, fixtures, recorder, rpc, serviceKey, settlementToken, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `CV${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const operator = { Authorization: `Bearer ${settlementToken}` };
const api = async (pathname, { method = "GET", headers = {}, body } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const conversations = (requestId) => db(`conversations?request_id=eq.${requestId}&select=id,helper_id,status,closed_at&order=created_at`);
const messagesIn = (conversationId) => db(`messages?conversation_id=eq.${conversationId}&select=id,original_text`);
const say = (requestId, auth, text, capability) => api("/api/chat", { method: "POST", headers: auth ?? {}, body: { requestId, originalLanguage: "en", originalText: text, ...(capability ? { capability } : {}) } });

try {
  const helpers = [];
  for (let i = 1; i <= 6; i += 1) helpers.push(await mf.helperWithPrice(`H${i}`, 60000 + i * 1000));
  const C = await fx.customerDevice("C");
  const checkout = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: C.cookie }, body: { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "70000", materials_policy: "INCLUDED" }, ...fx.requestPayload(undefined, "en", "conversation lifecycle"), service_slug: "clog-clearing" } });
  mf.checkouts.add(checkout.body.checkoutId);
  const funded = await mf.fixtureFund(checkout.body.checkoutId, C.publicId);
  const requestId = funded.requestId;
  const capability = (await api(`/api/checkouts/${checkout.body.checkoutId}`, { headers: { Cookie: C.cookie } })).body?.capability;
  expect("Setup: fixture-funded open offer (DB fixture, no chain), customer chat capability from the owner's checkout", !!requestId && !!capability);

  // ================= R1. decline vs customer message, true parallel, 3 rounds =================
  const rounds = [];
  for (let round = 0; round < 3; round += 1) {
    const h = helpers[round];
    const acc = await api(`/api/helper/open-offers/${requestId}`, { method: "POST", headers: h.auth, body: { action: "ACCEPT" } });
    const [asg] = await db(`request_assignments?request_id=eq.${requestId}&helper_id=eq.${h.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id`);
    const warm = await say(requestId, null, `round ${round} before`, capability);
    const [decline, ...msgs] = await Promise.all([
      api(`/api/helper/assignments/${asg.id}/decline`, { method: "POST", headers: h.auth }),
      ...[0, 1, 2, 3].map((n) => say(requestId, null, `round ${round} race ${n}`, capability)),
    ]);
    const all = await conversations(requestId);
    const mine = all.find((c) => c.helper_id === h.helper.id);
    const stored = (await messagesIn(mine.id)).map((m) => m.original_text);
    const accepted = msgs.filter((m) => m.status === 200).length, refused = msgs.filter((m) => m.status === 409).length;
    const consistent = msgs.every((m, n) => (m.status === 200) === stored.includes(`round ${round} race ${n}`));
    const after = await say(requestId, null, `round ${round} after`, capability);
    rounds.push({ acc: acc.status, warm: warm.status, decline: decline.status, accepted, refused, consistent, conv: mine.status, after: after.status });
  }
  record("INFO", `decline races: ${JSON.stringify(rounds)}`);
  expect("R1. decline vs parallel customer messages (3 rounds): every 200 message is stored and every refused one is not; the conversation ends CLOSED; any later write is refused (409 CONVERSATION_CLOSED)", rounds.every((r) => r.acc === 200 && r.warm === 200 && r.decline === 200 && r.accepted + r.refused === 4 && r.consistent && r.conv === "CLOSED" && r.after === 409), rounds);

  // ================= N / S. new Helper, new conversation; stale replay =================
  const h4 = helpers[3];
  await api(`/api/helper/open-offers/${requestId}`, { method: "POST", headers: h4.auth, body: { action: "ACCEPT" } });
  const convs = await conversations(requestId);
  const current = convs.filter((c) => c.status === "ACTIVE");
  expect("N1. the new Helper gets a NEW conversation; exactly one ACTIVE; every previous one CLOSED (no reuse)", current.length === 1 && current[0].helper_id === h4.helper.id && convs.length === 4 && convs.filter((c) => c.status === "CLOSED").length === 3, convs.map((c) => c.status));
  const toCurrent = await say(requestId, null, "to the current helper", capability);
  const lookup = await api(`/api/chat?requestId=${requestId}&capability=${encodeURIComponent(capability)}`);
  expect("N2. customer <-> current Helper works; the customer's chat lookup returns ONLY the current conversation", toCurrent.status === 200 && lookup.body?.conversation?.id === current[0].id && (await say(requestId, h4.auth, "helper reply")).status === 200, lookup.body?.conversation?.id);
  const old = convs[0];
  const stale = {
    oldHelper: (await say(requestId, helpers[0].auth, "old helper")).status,
    oldHelperRead: (await api(`/api/chat?requestId=${requestId}`, { headers: helpers[0].auth })).status,
    anonymous: (await say(requestId, null, "anon")).status,
    publicIdBearer: (await say(requestId, { Authorization: `Bearer ${C.publicId}` }, "public id")).status,
    ref: (await api(`/api/chat?ref=${C.publicId}`, { method: "POST", body: { requestId, originalLanguage: "en", originalText: "ref" } })).status,
  };
  const directInsert = (sender_role, sender_id, text) => fetch(`${supabaseUrl}/rest/v1/messages`, { method: "POST", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ conversation_id: old.id, sender_role, sender_id, original_language: "en", original_text: text }) });
  const directOld = await directInsert("CUSTOMER", C.publicId, "direct stale write");
  const directNewHelper = await directInsert("HELPER", h4.helper.id, "new helper into old");
  expect("S1. stale replay blocked: old Helper write 403 / read 403; anonymous 401; public ID bearer 401; ?ref= 401", stale.oldHelper === 403 && stale.oldHelperRead === 403 && stale.anonymous === 401 && stale.publicIdBearer === 401 && stale.ref === 401, stale);
  expect("S2. even a direct service-role write into the old conversation (customer or the NEW Helper) is refused by the database", directOld.status >= 400 && directNewHelper.status >= 400 && (await messagesIn(old.id)).every((m) => !/direct stale write|new helper into old/.test(m.original_text)), [directOld.status, directNewHelper.status]);

  // ================= R2. operator CANCELLED vs customer message on a LIVE conversation (own fixture) =================
  {
    const H = helpers[4];
    const D = await fx.customerDevice("D");
    const offers = await api(`/api/pricing/offers?service=clog-clearing&subitem=toilet-simple&country=KR&sido=${encodeURIComponent(fx.sido)}&gungu=G1`);
    const token = offers.body?.offers?.find((o) => Number(o.base_price) === 65000)?.offerToken;
    const co = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: D.cookie }, body: { mode: "HELPER_PRICE_SELECTED", offer_token: token, ...fx.requestPayload(undefined, "en", "cancel race"), service_slug: "clog-clearing" } });
    mf.checkouts.add(co.body.checkoutId);
    const fundedA = await mf.fixtureFund(co.body.checkoutId, D.publicId);
    const capD = (await api(`/api/checkouts/${co.body.checkoutId}`, { headers: { Cookie: D.cookie } })).body?.capability;
    const [liveConv] = (await conversations(fundedA.requestId)).filter((c) => c.status === "ACTIVE");
    const [cancelled, ...raced] = await Promise.all([
      db(`service_requests?id=eq.${fundedA.requestId}`, "PATCH", { status: "CANCELLED" }).then(() => 200, () => 500),
      ...[0, 1, 2, 3].map((n) => say(fundedA.requestId, null, `cancel race ${n}`, capD)),
    ]);
    const storedRace = (await messagesIn(liveConv.id)).map((m) => m.original_text);
    const consistentRace = raced.every((m, n) => (m.status === 200) === storedRace.includes(`cancel race ${n}`));
    const afterCancel = await say(fundedA.requestId, null, "after cancel", capD);
    record("INFO", `cancel race (operator CANCELLED vs messages): ${JSON.stringify(raced.map((m) => m.status))}`);
    expect("R2. CANCELLED vs parallel customer messages on a live conversation: stored == accepted, conversation CLOSED by the same transition, later writes refused", !!liveConv && cancelled === 200 && consistentRace && (await conversations(fundedA.requestId)).every((c) => c.status === "CLOSED") && afterCancel.status === 409, { cancelled, raced: raced.map((m) => m.status), after: afterCancel.status });
  }

  // ================= F. funded cancel (product path) after the relationship ended =================
  const [live] = await db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id`);
  if (live) await rpc("release_assignment_for_rematch", { p_assignment_id: live.id, p_release_status: "DECLINED" });
  const [k1, k2] = await Promise.all([call("cancel_funded_request", { p_request_id: requestId, p_customer_id: C.publicId }), say(requestId, null, "during funded cancel", capability)]);
  const refunds = await db(`service_refunds?payment_intent_id=eq.${funded.intent.intent_id}&select=id`);
  const jobs = refunds.length ? await db(`money_movement_jobs?service_refund_id=eq.${refunds[0].id}&select=id`) : [];
  expect("F1. funded cancel: CANCELLED, no ACTIVE conversation, message refused, refund exactly once (1 obligation, 1 job)", (k1?.success || k1?.code) && (await db(`service_requests?id=eq.${requestId}&select=status`))[0].status === "CANCELLED" && (await conversations(requestId)).every((c) => c.status === "CLOSED") && k2.status === 409 && refunds.length === 1 && jobs.length === 1, { k1, k2: k2.status, refunds: refunds.length });
} catch (error) {
  record("FAIL", "conversation lifecycle harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  expect("Fixture cleanup (checkouts purged; helpers, users, requests, conversations, messages, notifications)", out.purged.every(Boolean) && Object.values(out.leftovers).every((n) => n === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

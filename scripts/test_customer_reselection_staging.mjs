// Live STAGING E2E: customer re-selection after a customer-selected Helper declines (migration 013 +
// deployed Worker). Real services only: staging Worker + staging Supabase, a real Chrome customer,
// Mozilla autopush for real Web Push delivery.
//
//   A  browser: H1 / 60,000 selected -> H1 declines -> CUSTOMER_RESELECTION_REQUIRED (own UI, no
//      SEARCHING wording) -> fresh offers (H1 absent) -> H2 price changes before confirmation ->
//      PRICE_CHANGED + refreshed offers -> customer reconfirms H2 at the new price -> MATCHED
//   B  v1 (H1, ENDED) + v2 (H2, ACCEPTED) history; one current selection
//   C  H2 gets exactly one HELPER_ASSIGNED push; H1 gets none for it
//   D  customer gets the in-app notice + a generic RESELECTION_REQUIRED push
//   E  stale price rejected (above); idempotent replay; conflicting offer under the same key blocked;
//      offer tokens not interchangeable between new requests and re-selection
//   F  two re-selection requests race for one free Helper (Promise.all): exactly one winner
//   G/H/I  wrong customer, public ID, ?ref= all blocked
//   J  declined Helpers never offered again; multiple declines -> v1 ended, v2 ended, v3 current
//   K  full lifecycle after re-selection -> SETTLED -> cleanup -> CLOSED, settled at the CURRENT price;
//      history survives CLOSED; chat follows the current Helper
//   R  referral replay: same A->B again succeeds, C->B never overwrites, self-referral blocked
// Usage: node scripts/test_customer_reselection_staging.mjs [--headed]
import crypto from "node:crypto";
import fs from "node:fs";
import {
  Autopush, base, db, fixtures, launchChrome, minimalPayload, readResponse, recorder, rpc, settlementToken, sleep, subscribe, trustedClick, waitFor,
} from "./lib/stagingPushHarness.mjs";

const runId = `CR${Date.now()}`;
const headed = process.argv.includes("--headed");
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const sido = fx.sido;
const autopush = new Autopush();
const browsers = [];
const en = JSON.parse(fs.readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"));

const api = async (path, { method = "GET", headers = {}, body, key } = {}) => {
  const r = await fetch(`${base}${path}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await readResponse(r) };
};
const cookieOf = (device) => (device?.cookie ? { Cookie: device.cookie } : {});
const putPrice = (helper, subitem, base_price) => api("/api/helper/prices", { method: "PUT", headers: helper.auth, body: { service_code: "clog-clearing", subitem_code: subitem, terms: { pricing_mode: "FIXED", currency: "KRW", base_price, materials_policy: "INCLUDED" }, publish: true } });
const newOffers = (subitem) => api(`/api/pricing/offers?${new URLSearchParams({ service: "clog-clearing", subitem, country: "KR", sido, gungu: "G1" })}`).then((r) => r.body.offers || []);
const reselOffers = (device, requestId, extra = "") => api(`/api/requests/reselection/offers?requestId=${requestId}${extra}`, { headers: cookieOf(device) });
const reselect = (device, requestId, offerToken, key = crypto.randomUUID(), extra = {}) => api("/api/requests/reselection", { method: "POST", headers: cookieOf(device), key, body: { request_id: requestId, offer_token: offerToken, ...extra } });
const createSelected = async (device, offerToken, label) => {
  const key = crypto.randomUUID();
  const r = await api("/api/requests/selected", { method: "POST", headers: { ...cookieOf(device), Authorization: `Bearer ${settlementToken}` }, key, body: { ...fx.requestPayload(device.publicId, "en", label), service_slug: "clog-clearing", offer_token: offerToken } });
  if (r.body.requestId) fx.created.requestIds.add(r.body.requestId);
  return { ...r, key };
};
const activeOf = (requestId) => db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id,status`);
const helperActive = (helper) => db(`request_assignments?helper_id=eq.${helper.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,request_id`);
const statusOf = async (requestId) => (await db(`service_requests?id=eq.${requestId}&select=status`))[0]?.status;
const history = (requestId) => db(`request_price_selections?request_id=eq.${requestId}&select=selection_version,helper_id,base_price,initial_payable_amount,status,ended_reason&order=selection_version`);
const hist = async (requestId, helpers) => (await history(requestId)).map((h) => `v${h.selection_version}:${helpers.find(([, x]) => x.helper.id === h.helper_id)?.[0] ?? "?"}:${Number(h.base_price)}:${h.status}${h.ended_reason ? `/${h.ended_reason}` : ""}`).join(" ");
const decline = async (helper, requestId) => { const a = (await activeOf(requestId))[0]; return api(`/api/helper/assignments/${a?.id}/decline`, { method: "POST", headers: helper.auth }); };
const helperStep = async (helper, requestId, action) => { const a = (await db(`request_assignments?request_id=eq.${requestId}&helper_id=eq.${helper.helper.id}&select=id&order=assigned_at.desc&limit=1`))[0]; return (await api(`/api/helper/assignments/${a?.id}/${action}`, { method: "POST", headers: helper.auth })).status; };
const sys = (requestId, status) => api(`/api/sys/requests/${requestId}/status`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}` }, body: { status } });

// ---- browser helpers ----
const q = (testid) => `[data-testid="${testid}"]`;
const setValue = (b, selector, value) => b.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
const exists = (b, selector) => b.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);
const text = (b, selector) => b.evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? null`);
const cardsText = (b, testid) => b.evaluate(`[...document.querySelectorAll('${q(testid)}')].map((c) => c.innerText).join(" | ")`);
const pickCard = async (b, cardId, buttonId, contains, tag) => {
  const ok = await b.evaluate(`(() => { const card = [...document.querySelectorAll('${q(cardId)}')].find((c) => c.innerText.includes(${JSON.stringify(contains)})); if (!card) return false; card.querySelector('${q(buttonId)}').setAttribute("data-e2e", ${JSON.stringify(tag)}); return true; })()`);
  return ok && trustedClick(b, `[data-e2e="${tag}"]`);
};
const REGION = JSON.stringify({ country: "KR", sido, gungu: "G1", dong: "D1" });

try {
  // ================= fixtures =================
  const h1 = await fx.createHelper("H1", { service: "clog-clearing", rating: 5 });
  const h2 = await fx.createHelper("H2", { service: "clog-clearing", rating: 5 });
  const h3 = await fx.createHelper("H3", { service: "clog-clearing", rating: 5 });
  const names = [["H1", h1], ["H2", h2], ["H3", h3]];
  const prices = [await putPrice(h1, "toilet-simple", 60000), await putPrice(h2, "toilet-simple", 75000), await putPrice(h3, "toilet-simple", 90000)];
  await autopush.connect();
  const [h1Ch, h2Ch, h3Ch, cCh] = [await autopush.register(), await autopush.register(), await autopush.register(), await autopush.register()];
  const subs = [await subscribe("helper", h1Ch.subscription, h1.auth), await subscribe("helper", h2Ch.subscription, h2.auth), await subscribe("helper", h3Ch.subscription, h3.auth)];
  expect("Fixtures: H1 60,000 / H2 75,000 / H3 90,000 (same detailed service + region), real push channels", prices.every((p) => p.status === 200) && subs.every((s) => s.status === 200), [prices.map((p) => p.status), subs.map((s) => s.status)]);
  const aliasOf = Object.fromEntries((await newOffers("toilet-simple")).map((o) => [Number(o.base_price), o.helperAlias]));

  // ================= A: customer in a real browser =================
  const cb = await launchChrome({ headed });
  browsers.push(cb);
  if (!cb) throw new Error("Chrome not available");
  await cb.cdp("Page.addScriptToEvaluateOnNewDocument", { source: "(() => { window.__calls = []; const f = window.fetch.bind(window); window.fetch = async (input, init) => { const url = typeof input === 'string' ? input : input.url; const res = await f(input, init); if (/api\\/requests\\/(selected|reselection)$/.test(url) && init && init.method === 'POST') { let body = null; try { body = await res.clone().json(); } catch {} const h = init.headers || {}; window.__calls.push({ url, sent: init.body, key: h['Idempotency-Key'] || null, status: res.status, body }); } return res; }; })();" }, cb.sessionId);
  await cb.navigate(`${base}/`);
  await waitFor(() => cb.evaluate("document.readyState === 'complete'"), 20000, 300);
  await cb.evaluate(`(() => { localStorage.setItem("life_help_locale", "en"); localStorage.setItem("life_help_selected_region", ${JSON.stringify(REGION)}); localStorage.setItem("life_help_selected_region_KR", ${JSON.stringify(REGION)}); return true; })()`);
  await cb.navigate(`${base}/request?service=clog-clearing`);
  const deviceId = await waitFor(() => cb.evaluate("localStorage.getItem('life_help_referral_device_id')"), 20000, 500);
  const V = deviceId ? await waitFor(async () => (await db(`referral_identities?device_id_hash=eq.${crypto.createHash("sha256").update(deviceId).digest("hex")}&select=id,referral_id`))[0], 20000) : null;
  if (V) { fx.created.identityIds.add(V.id); fx.created.publicIds.add(V.referral_id); }
  await waitFor(() => exists(cb, q("price-subitem-toilet-simple")), 30000, 500);
  await cb.evaluate(`(() => { const el = [...document.querySelectorAll("input[required]")].find((i) => (i.placeholder || "").includes(${JSON.stringify(en.request.addressPlaceholder)})); if (el) el.setAttribute("data-e2e", "address"); return !!el; })()`);
  await setValue(cb, "textarea", `${runId} browser request`);
  await setValue(cb, '[data-e2e="address"]', `${runId} address`);
  await trustedClick(cb, q("price-subitem-toilet-simple"));
  await waitFor(async () => ((await cb.evaluate(`document.querySelectorAll('${q("price-offer-card")}').length`)) === 3 ? true : null), 20000, 500);
  await pickCard(cb, "price-offer-card", "price-offer-select", "60,000", "pick-h1");
  await waitFor(() => exists(cb, q("price-offer-confirm")), 10000, 300);
  await trustedClick(cb, q("price-offer-submit"));
  const R = await waitFor(async () => (await db(`service_requests?customer_id=eq.${V?.referral_id}&select=id,status,selection_mode`))[0], 30000, 1000);
  if (R) fx.created.requestIds.add(R.id);
  const cookies = (await cb.cdp("Storage.getCookies", {})).result?.cookies || [];
  const owner = cookies.find((c) => c.name === "life_help_device_owner");
  const C = { cookie: owner ? `life_help_device_owner=${owner.value}` : null, publicId: V?.referral_id };
  const selectedCall = await cb.evaluate("window.__calls.find((c) => c.url.endsWith('/api/requests/selected')) || null");
  const v1Hist = R ? await hist(R.id, names) : "";
  expect("A1. Browser customer selects H1 / 60,000 -> MATCHED, CUSTOMER_SELECTED, v1 ACCEPTED", R?.status === "MATCHED" && R.selection_mode === "CUSTOMER_SELECTED" && v1Hist === "v1:H1:60000:ACCEPTED" && !!C.cookie && selectedCall?.status === 201, { R, v1Hist });
  const h1First = await autopush.next(h1Ch, (p) => p.type === "HELPER_ASSIGNED");
  expect("A2. H1 receives its HELPER_ASSIGNED push", !!h1First, h1First);
  expect("A3. Customer push subscription (owner cookie)", (await subscribe("customer", cCh.subscription, { Cookie: C.cookie })).status === 200);
  const listBefore = await api("/api/requests/reselection", { headers: cookieOf(C) });
  const offersBefore = await reselOffers(C, R.id);
  expect("A4. Before any decline: nothing to re-select (list empty, offers 409 REQUEST_NOT_RESELECTABLE)", listBefore.status === 200 && listBefore.body.requests?.length === 0 && offersBefore.status === 409 && offersBefore.body.code === "REQUEST_NOT_RESELECTABLE", { listBefore: listBefore.body, offersBefore: offersBefore.body });

  // ---- H1 declines ----
  const d1 = await decline(h1, R.id);
  await sleep(2000);
  const afterDecline = await hist(R.id, names);
  const others = [...(await helperActive(h2)), ...(await helperActive(h3))];
  expect("A5. H1 DECLINES -> route signals CUSTOMER_RESELECTION_REQUIRED; request CUSTOMER_RESELECTION_REQUIRED (not SEARCHING)", d1.status === 200 && d1.body.matching?.code === "CUSTOMER_RESELECTION_REQUIRED" && d1.body.release?.customer_reselection_required === true && (await statusOf(R.id)) === "CUSTOMER_RESELECTION_REQUIRED", d1.body);
  expect("A6. No automatic H2 / H3 assignment, no price substitution; v1 ENDED / HELPER_DECLINED", others.length === 0 && (await activeOf(R.id)).length === 0 && afterDecline === "v1:H1:60000:ENDED/HELPER_DECLINED", { others, afterDecline });
  const m = await rpc("match_and_assign_helper", { p_request_id: R.id });
  expect("A7. Automatic matcher does not consume CUSTOMER_RESELECTION_REQUIRED", m.data?.success === false && (await activeOf(R.id)).length === 0, m.data);
  const notice = await db(`app_notifications?type=eq.CUSTOMER_RESELECTION_REQUIRED&payload->>request_id=eq.${R.id}&select=recipient_type,recipient_id,title,body,payload`);
  expect("D1. Customer in-app notice once (generic: no price / Helper / address)", notice.length === 1 && notice[0].recipient_id === C.publicId && !/\d{3}|HLP-|@|address/i.test(notice[0].title + notice[0].body), notice);
  const cPush = await autopush.next(cCh, (p) => p.type === "RESELECTION_REQUIRED");
  const secrets = [R.id, C.publicId, "60000", "60,000", "75,000", h1.helper.id, h1.helper.helper_id, h1.email, `${runId} address`, owner?.value];
  expect("D2. REAL Web Push to the customer: RESELECTION_REQUIRED, generic, minimal (no price / Helper / id / address / capability)", !!cPush && cPush.audience === "customer" && cPush.url === "/request" && cPush.title === en.push.reselectionTitle && minimalPayload(cPush, secrets), cPush);

  // ---- browser: own UI, fresh offers ----
  const panel = await waitFor(() => exists(cb, q("reselection-panel")), 40000, 1000);
  const pageText = await cb.evaluate("document.body.innerText");
  expect("A8. Browser shows the re-selection state (title, body, 'choose another Helper'), not SEARCHING / assigned / no-helper wording", panel && pageText.includes(en.reselection.title) && pageText.includes(en.reselection.body) && pageText.includes(en.reselection.chooseButton) && pageText.includes(en.request.statusReselectionRequired) && !pageText.includes("A helper has been assigned.") && !pageText.includes("No helper is available right now") && !pageText.includes(en.admin.statusPending), pageText.slice(0, 400));
  const list = await api("/api/requests/reselection", { headers: cookieOf(C) });
  expect("A9. Owner's pending re-selection list names this request and its detailed service", list.body.requests?.length === 1 && list.body.requests[0].requestId === R.id && list.body.requests[0].subitemCode === "toilet-simple", list.body);
  const apiOffers = await reselOffers(C, R.id);
  const aliases = (apiOffers.body.offers || []).map((o) => o.helperAlias);
  expect("J1. Fresh offers: same detailed service; H2 + H3 only; declined H1 NOT offered (though free and ACTIVE)", apiOffers.status === 200 && apiOffers.body.subitemCode === "toilet-simple" && aliases.length === 2 && aliases.includes(aliasOf[75000]) && aliases.includes(aliasOf[90000]) && !aliases.includes(aliasOf[60000]), { aliases, aliasOf });
  const rawOffers = JSON.stringify(apiOffers.body);
  expect("J2. Re-selection offers expose no internal ids / private data", ![h1, h2, h3].some((h) => rawOffers.includes(h.helper.id) || rawOffers.includes(h.email) || rawOffers.includes(h.helper.helper_id)) && !/price_id|helper_id|auth_user/.test(rawOffers));
  const h3Token = apiOffers.body.offers.find((o) => o.helperAlias === aliasOf[90000])?.offerToken;
  await trustedClick(cb, q("reselection-open"));
  await waitFor(async () => ((await cb.evaluate(`document.querySelectorAll('${q("reselection-offer-card")}').length`)) === 2 ? true : null), 20000, 500);
  const shown = await cardsText(cb, "reselection-offer-card");
  expect("J3. Browser lists the fresh offers (75,000 and 90,000), never the declined 60,000", /75,000/.test(shown) && /90,000/.test(shown) && !/60,000/.test(shown), shown);

  // ---- E: price changes before confirmation ----
  await pickCard(cb, "reselection-offer-card", "reselection-offer-select", "75,000", "pick-h2-v1");
  await waitFor(() => exists(cb, q("reselection-confirm")), 10000, 300);
  const confirmText = await text(cb, q("reselection-confirm"));
  const to85 = await putPrice(h2, "toilet-simple", 85000);
  await trustedClick(cb, q("reselection-submit"));
  const staleCall = await waitFor(() => cb.evaluate("window.__calls.filter((c) => c.url.endsWith('/api/requests/reselection')).pop() || null"), 20000, 500);
  const staleNotice = await waitFor(() => text(cb, q("reselection-notice")), 15000, 500);
  const refreshed = await waitFor(async () => { const t = await cardsText(cb, "reselection-offer-card"); return /85,000/.test(t) ? t : null; }, 20000, 500);
  expect("E1. Confirmation showed H2 at 75,000; old token after H2 -> 85,000 returns 409 PRICE_CHANGED", /75,000/.test(confirmText || "") && confirmText.includes(en.pricing.confirmTitle) && to85.status === 200 && staleCall?.status === 409 && staleCall.body?.code === "PRICE_CHANGED", { staleCall, confirmText });
  expect("E2. Request stays CUSTOMER_RESELECTION_REQUIRED; no assignment; no new selection; no silent repricing", (await statusOf(R.id)) === "CUSTOMER_RESELECTION_REQUIRED" && (await activeOf(R.id)).length === 0 && (await helperActive(h2)).length === 0 && (await hist(R.id, names)) === "v1:H1:60000:ENDED/HELPER_DECLINED");
  expect("E3. Customer sees the price-changed notice and refreshed offers (85,000) and must reconfirm", staleNotice === en.pricing.priceChanged && !!refreshed && !(await exists(cb, q("reselection-confirm"))), { staleNotice, refreshed });

  // ---- reconfirm H2 at 85,000 ----
  await pickCard(cb, "reselection-offer-card", "reselection-offer-select", "85,000", "pick-h2-v2");
  await waitFor(() => exists(cb, q("reselection-confirm")), 10000, 300);
  const confirm2 = await text(cb, q("reselection-confirm"));
  await trustedClick(cb, q("reselection-submit"));
  const okCall = await waitFor(() => cb.evaluate("window.__calls.filter((c) => c.url.endsWith('/api/requests/reselection') && c.status === 201).pop() || null"), 20000, 500);
  await sleep(1500);
  const bHist = await hist(R.id, names);
  const accepted = (await history(R.id)).filter((h) => h.status === "ACCEPTED");
  expect("A10. Customer explicitly reconfirms H2 at 85,000 -> 201, request MATCHED, new H2 assignment", /85,000/.test(confirm2 || "") && okCall?.status === 201 && okCall.body?.selectionVersion === 2 && okCall.body.agreed?.initialPayableAmount === 85000 && (await statusOf(R.id)) === "MATCHED" && (await activeOf(R.id)).map((a) => a.helper_id).join() === h2.helper.id, { okCall });
  expect("B1. History: v1 H1 / 60,000 ENDED (unchanged) + v2 H2 / 85,000 ACCEPTED; exactly one current selection", bHist === "v1:H1:60000:ENDED/HELPER_DECLINED v2:H2:85000:ACCEPTED" && accepted.length === 1, bHist);
  const h2Push = await autopush.next(h2Ch, (p) => p.type === "HELPER_ASSIGNED");
  expect("C1. REAL Web Push: H2 receives HELPER_ASSIGNED (minimal payload, no price)", !!h2Push && minimalPayload(h2Push, [R.id, C.publicId, "85000", "85,000"]), h2Push);
  const pageAfter = await waitFor(async () => { const t = await cb.evaluate("document.body.innerText"); return t.includes("A helper has been assigned.") && t.includes("85,000") ? t : null; }, 30000, 1000);
  expect("A11. Browser leaves the re-selection state and shows the agreed CURRENT price (85,000)", !!pageAfter && !(await exists(cb, q("reselection-panel"))) && /85,000/.test((await text(cb, q("agreed-price"))) || ""), (pageAfter || "").slice(0, 300));

  // ---- E: idempotency + token binding ----
  const sent = JSON.parse(okCall.sent);
  const replay = await reselect(C, R.id, sent.offer_token, okCall.key);
  const conflict = await reselect(C, R.id, h3Token, okCall.key);
  await sleep(12000);
  const h2Notes = await db(`app_notifications?type=eq.NEW_SERVICE_REQUEST&recipient_id=eq.${h2.helper.helper_id}&payload->>request_id=eq.${R.id}&select=id`);
  expect("E4. Exact replay -> 200 replayed (same version); no duplicate assignment / version / notification / push", replay.status === 200 && replay.body.replayed === true && replay.body.selectionVersion === 2 && (await history(R.id)).length === 2 && (await db(`request_assignments?request_id=eq.${R.id}&helper_id=eq.${h2.helper.id}&select=id`)).length === 1 && h2Notes.length === 1 && autopush.received(h2Ch).length === 1, { replay: replay.body, notes: h2Notes.length, pushes: autopush.received(h2Ch).length });
  expect("E5. Same idempotency key with a different offer (H3) -> blocked (409), nothing changed", conflict.status === 409 && conflict.body.code === "REQUEST_NOT_RESELECTABLE" && (await helperActive(h3)).length === 0 && (await hist(R.id, names)) === bHist, conflict.body);
  expect("C2. H1 receives no push for H2's assignment; H3 none at all", autopush.received(h1Ch).length === 1 && autopush.received(h3Ch).length === 0, { h1: autopush.received(h1Ch).length, h3: autopush.received(h3Ch).length });

  // ================= K: full lifecycle after re-selection =================
  const capability = await fx.capabilityFor(C.cookie, selectedCall.key);
  const custChat = await api(`/api/chat?requestId=${R.id}&capability=${encodeURIComponent(capability.capability || "")}`);
  const h2Chat = await api(`/api/chat?requestId=${R.id}`, { headers: h2.auth });
  const h1Chat = await api(`/api/chat?requestId=${R.id}`, { headers: h1.auth });
  expect("K1. Chat follows the current Helper: customer -> H2's conversation, H2 its own, declined H1 refused", custChat.status === 200 && custChat.body.conversation?.helper_id === h2.helper.id && h2Chat.status === 200 && h2Chat.body.conversation?.id === custChat.body.conversation.id && h1Chat.status === 403, { cust: custChat.status, h2: h2Chat.status, h1: h1Chat.status });
  const msg = await api("/api/chat", { method: "POST", body: { requestId: R.id, capability: capability.capability, originalLanguage: "en", originalText: `${runId} hello` } });
  const steps = [await helperStep(h2, R.id, "accept"), await helperStep(h2, R.id, "start"), await helperStep(h2, R.id, "complete")];
  const pp = await sys(R.id, "PAYMENT_PENDING");
  const st = await sys(R.id, "SETTLED");
  const audits = await db(`admin_audit_logs?entity_id=eq.${R.id}&action=in.(SERVICE_PAYMENT_PENDING,SERVICE_SETTLED)&select=action,metadata`);
  const convs = await db(`conversations?request_id=eq.${R.id}&select=status`);
  const msgs = await db(`messages?conversation_id=eq.${custChat.body.conversation?.id}&select=id`);
  expect("K2. MATCHED -> ACCEPTED -> IN_PROGRESS -> COMPLETED -> PAYMENT_PENDING -> SETTLED -> cleanup -> CLOSED", msg.status === 200 && steps.every((s) => s === 200) && pp.status === 200 && st.status === 200 && (await statusOf(R.id)) === "CLOSED" && convs.length === 2 && convs.every((c) => c.status === "DELETED") && msgs.length === 0, { steps, pp: pp.body.code, st: st.body.status, convs });
  expect("K3. Settlement uses the CURRENT selection (v2 85,000), never declined v1 60,000; no payment provider / transaction id", pp.body.agreedPrice?.initialPayableAmount === 85000 && pp.body.agreedPrice.selectionVersion === 2 && st.body.agreedPrice?.initialPayableAmount === 85000 && audits.length === 2 && audits.every((a) => a.metadata.agreed_price?.initial_payable_amount === 85000 && a.metadata.agreed_price.selection_version === 2 && a.metadata.external_payment_verified === false) && audits.find((a) => a.action === "SERVICE_SETTLED")?.metadata.external_payment_transaction_id === null, { pp: pp.body.agreedPrice, st: st.body.agreedPrice, audits });
  const statusView = await api(`/api/requests/status?requestId=${R.id}&capability=${encodeURIComponent(capability.capability || "")}`);
  expect("K4. After CLOSED: history preserved (v1 ended 60,000 + v2 final 85,000); customer view shows 85,000 as agreed", (await hist(R.id, names)) === "v1:H1:60000:ENDED/HELPER_DECLINED v2:H2:85000:ACCEPTED" && statusView.body.status === "CLOSED" && statusView.body.agreedPrice?.initialPayableAmount === 85000 && statusView.body.priceHistory?.map((h) => `${h.version}:${h.status}:${h.initialPayableAmount}`).join() === "1:ENDED:60000,2:ACCEPTED:85000" && !JSON.stringify(statusView.body).includes(h2.helper.id), statusView.body);

  // ================= J + G/H/I: second customer, multiple declines =================
  const E = await fx.customerDevice("E");
  const D = await fx.customerDevice("D");
  const Dref = await fx.customerDevice("DREF", E.publicId);
  const R2 = await createSelected(E, (await newOffers("toilet-simple")).find((o) => o.helperAlias === aliasOf[60000])?.offerToken, "multi");
  await decline(h1, R2.body.requestId);
  const eOffers = await reselOffers(E, R2.body.requestId);
  const r2 = R2.body.requestId;
  const wrong = [
    ["other customer GET offers", (await reselOffers(D, r2)).status, 404],
    ["other customer POST", (await reselect(D, r2, eOffers.body.offers?.[0]?.offerToken)).status, 404],
    ["no cookie GET", (await reselOffers(null, r2)).status, 401],
    ["no cookie POST", (await reselect(null, r2, eOffers.body.offers?.[0]?.offerToken)).status, 401],
  ];
  expect("G. Wrong customer blocked (404, indistinguishable from missing); no cookie 401", wrong.every(([, s, want]) => s === want), wrong);
  const pub = [
    ["public ID in body, no cookie", (await reselect(null, r2, eOffers.body.offers?.[0]?.offerToken, undefined, { customer_id: E.publicId, customerId: E.publicId })).status, 401],
    ["public ID in body, other cookie", (await reselect(D, r2, eOffers.body.offers?.[0]?.offerToken, undefined, { customer_id: E.publicId })).status, 404],
    ["public ID as bearer", (await api(`/api/requests/reselection/offers?requestId=${r2}`, { headers: { Authorization: `Bearer ${E.publicId}` } })).status, 401],
    ["public ID query", (await reselOffers(D, r2, `&customer_id=${E.publicId}`)).status, 404],
  ];
  expect("H. Public 8-letter ID never authorizes re-selection", pub.every(([, s, want]) => s === want), pub);
  const ref = [
    ["?ref=owner GET (referred device)", (await reselOffers(Dref, r2, `&ref=${E.publicId}`)).status, 404],
    ["?ref=owner POST (referred device)", (await api(`/api/requests/reselection?ref=${E.publicId}`, { method: "POST", headers: cookieOf(Dref), key: crypto.randomUUID(), body: { request_id: r2, offer_token: eOffers.body.offers?.[0]?.offerToken } })).status, 404],
    ["?ref= list", (await api(`/api/requests/reselection?ref=${E.publicId}`, { headers: cookieOf(Dref) })).body.requests?.length, 0],
  ];
  expect("I. ?ref= (even from a device referred by the owner) never grants access", ref.every(([, s, want]) => s === want), ref);
  const tokenSwap = [
    ["new-request token used for re-selection", (await reselect(E, r2, (await newOffers("toilet-simple"))[0]?.offerToken)).body.code, "OFFER_INVALID"],
    ["re-selection token used to open a new request", (await createSelected(E, eOffers.body.offers?.[0]?.offerToken, "swap")).body.code, "OFFER_INVALID"],
    ["token of another request (R2 token on a different request id)", (await reselect(E, R.id, eOffers.body.offers?.[0]?.offerToken)).body.code, "OFFER_INVALID"],
  ];
  expect("E6. Offer tokens are bound: new-request vs re-selection vs another request not interchangeable", tokenSwap.every(([, c, want]) => c === want) && (await history(r2)).length === 1, tokenSwap);
  const e2 = (eOffers.body.offers || []).find((o) => o.helperAlias === aliasOf[75000]);
  const sel2 = await reselect(E, r2, e2?.offerToken);
  await decline(h2, r2);
  const eOffers2 = await reselOffers(E, r2);
  const aliases2 = (eOffers2.body.offers || []).map((o) => o.helperAlias);
  const sel3 = await reselect(E, r2, eOffers2.body.offers?.[0]?.offerToken);
  const multi = await hist(r2, names);
  expect("J4. After H2 also declines, only H3 is offered (H1 and H2 excluded)", sel2.status === 201 && aliases2.length === 1 && aliases2[0] === aliasOf[90000], { sel2: sel2.body, aliases2 });
  expect("J5. Multiple declines: v1 H1 ENDED, v2 H2 ENDED, v3 H3 CURRENT; nothing overwritten", sel3.status === 201 && sel3.body.selectionVersion === 3 && multi === "v1:H1:60000:ENDED/HELPER_DECLINED v2:H2:85000:ENDED/HELPER_DECLINED v3:H3:90000:ACCEPTED" && (await statusOf(r2)) === "MATCHED" && (await activeOf(r2)).map((a) => a.helper_id).join() === h3.helper.id, multi);

  // ================= F: concurrent re-selection race =================
  const s1 = await fx.createHelper("S1", { service: "clog-clearing", rating: 5 });
  const x = await fx.createHelper("X", { service: "clog-clearing", rating: 5 });
  await putPrice(s1, "sink", 50000);
  const F1 = await fx.customerDevice("F1"), F2 = await fx.customerDevice("F2");
  const RF1 = await createSelected(F1, (await newOffers("sink"))[0]?.offerToken, "race-1");
  await decline(s1, RF1.body.requestId);
  const RF2 = await createSelected(F2, (await newOffers("sink"))[0]?.offerToken, "race-2");
  await decline(s1, RF2.body.requestId);
  await putPrice(x, "sink", 55000);
  const [o1, o2] = [(await reselOffers(F1, RF1.body.requestId)).body.offers || [], (await reselOffers(F2, RF2.body.requestId)).body.offers || []];
  expect("F1. Two requests in CUSTOMER_RESELECTION_REQUIRED see the same single free Helper X (S1 excluded)", o1.length === 1 && o2.length === 1 && o1[0].helperAlias === o2[0].helperAlias && (await statusOf(RF1.body.requestId)) === "CUSTOMER_RESELECTION_REQUIRED" && (await statusOf(RF2.body.requestId)) === "CUSTOMER_RESELECTION_REQUIRED", { o1: o1.length, o2: o2.length });
  const race = await Promise.all([reselect(F1, RF1.body.requestId, o1[0]?.offerToken), reselect(F2, RF2.body.requestId, o2[0]?.offerToken)]);
  const winners = race.filter((r) => r.status === 201);
  const loserIdx = race.findIndex((r) => r.status !== 201);
  const loserId = [RF1, RF2][loserIdx]?.body.requestId;
  const loserSel = loserId ? await history(loserId) : [];
  const loserConv = loserId ? await db(`conversations?request_id=eq.${loserId}&select=id`) : [];
  expect("F2. True concurrent re-selection: exactly ONE winner; loser 409 HELPER_NO_LONGER_AVAILABLE", winners.length === 1 && race[loserIdx]?.status === 409 && race[loserIdx].body.code === "HELPER_NO_LONGER_AVAILABLE" && (await helperActive(x)).length === 1, race.map((r) => [r.status, r.body.code]));
  expect("F3. Loser stays CUSTOMER_RESELECTION_REQUIRED: no assignment, no current selection, no extra conversation", loserId && (await statusOf(loserId)) === "CUSTOMER_RESELECTION_REQUIRED" && (await activeOf(loserId)).length === 0 && loserSel.length === 1 && loserSel[0].status === "ENDED" && loserConv.length === 1, { loserSel, loserConv: loserConv.length });
  record("INFO", `Race winners: ${winners.length}`);

  // ================= R: referral replay regression =================
  const identity = async (label, referralId) => {
    const r = await api("/api/referrals/identity", { method: "POST", body: { deviceId: `${runId}-ref-${label}-device-0000`, subjectType: "CUSTOMER", ...(referralId ? { referralId } : {}) } });
    if (r.body.referralId) { fx.created.publicIds.add(r.body.referralId); const row = (await db(`referral_identities?referral_id=eq.${r.body.referralId}&select=id`))[0]; if (row) fx.created.identityIds.add(row.id); }
    return r;
  };
  const rA = await identity("A"), rC = await identity("C");
  const b1 = await identity("B", rA.body.referralId);
  const b2 = await identity("B", rA.body.referralId);
  const b3 = await identity("B", rC.body.referralId);
  const self = await identity("A", rA.body.referralId);
  const bRow = (await db(`referral_identities?referral_id=eq.${b1.body.referralId}&select=id`))[0];
  const attributions = bRow ? await db(`referral_attributions?referred_identity_id=eq.${bRow.id}&select=referrer_identity_id`) : [];
  const aRow = (await db(`referral_identities?referral_id=eq.${rA.body.referralId}&select=id`))[0];
  expect("R1. First A->B attribution succeeds", b1.status === 200 && b1.body.attribution === "ATTRIBUTED", b1.body);
  expect("R2. Same A->B repeated: success / idempotent replay (same identity, still one attribution)", b2.status === 200 && b2.body.attribution === "ALREADY_ATTRIBUTED" && b2.body.referralId === b1.body.referralId, b2.body);
  expect("R3. Different C->B after A->B: overwrite blocked (A kept), device still gets its identity", b3.status === 200 && b3.body.attribution === "EXISTING_REFERRER_KEPT" && b3.body.referralId === b1.body.referralId && attributions.length === 1 && attributions[0].referrer_identity_id === aRow?.id, { b3: b3.body, attributions });
  expect("R4. Self-referral blocked", self.status === 409 && self.body.code === "SELF_REFERRAL", self.body);
} catch (error) {
  record("FAIL", "E2E harness", String(error?.stack || error).slice(0, 700));
} finally {
  autopush.close();
  for (const b of browsers) if (b) await b.close();
  await sleep(500);
  const leftovers = await fx.cleanup();
  const zero = "00000000-0000-0000-0000-000000000000";
  const helperIds = [...fx.created.helperIds, zero].join(",");
  const requestIds = [...fx.created.requestIds, zero].join(",");
  const identityIds = [...fx.created.identityIds, zero].join(",");
  leftovers.prices = (await db(`helper_service_prices?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.selections = (await db(`request_price_selections?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.snapshots = (await db(`request_price_snapshots?helper_id=in.(${helperIds})&select=request_id`)).length;
  leftovers.assignments = (await db(`request_assignments?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.conversations = (await db(`conversations?request_id=in.(${requestIds})&select=id`)).length;
  leftovers.rewards = (await db(`referral_rewards?or=(referred_identity_id.in.(${identityIds}),referrer_identity_id.in.(${identityIds}))&select=id`)).length;
  leftovers.attributions = (await db(`referral_attributions?or=(referred_identity_id.in.(${identityIds}),referrer_identity_id.in.(${identityIds}))&select=id`)).length;
  leftovers.audit = (await db(`admin_audit_logs?entity_id=in.(${[...fx.created.requestIds, ...fx.created.helperIds, ...fx.created.identityIds, zero].join(",")})&select=id`)).length;
  leftovers.authUsers = 0;
  for (const id of fx.created.authUserIds) if ((await fetch(`${(await import("./lib/stagingPushHarness.mjs")).supabaseUrl}/auth/v1/admin/users/${id}`, { headers: { apikey: (await import("./lib/stagingPushHarness.mjs")).serviceKey, Authorization: `Bearer ${(await import("./lib/stagingPushHarness.mjs")).serviceKey}` } })).status === 200) leftovers.authUsers += 1;
  expect("Fixture cleanup (auth users, helpers, prices, requests, assignments, selections, snapshots, conversations, messages, push, notifications, identities, rewards, audit)", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

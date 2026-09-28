// Live STAGING E2E: customer re-selection after a customer-selected Helper declines a FUNDED (prepaid)
// request - current product flow (migrations 013 / 014 / 016 + deployed Worker). Real services only:
// staging Worker + staging Supabase, a real Chrome customer, Mozilla autopush for real Web Push.
// NO chain funds: every checkout is a staging test fixture (operator header added to the page's own
// POST /api/checkouts by DevTools interception; API checkouts send it directly) and is activated by a
// FIXTURE payment observation on the product's own intent (never a chain payment); all purged afterwards.
//
// Funded re-selection rule (014): the SAME held payment stays authoritative - no second payment. A new
// Helper price above the held amount is refused (TOPUP_REQUIRED); a lower one is accepted and the
// difference is refunded at release (PRICE_DIFFERENCE).
//
//   A  browser: H1 / 75,000 selected -> checkout -> payment UI -> (fixture) activation -> H1 declines ->
//      CUSTOMER_RESELECTION_REQUIRED, old selection ENDED, old conversation CLOSED -> own re-selection
//      panel -> fresh offers (H1 absent) -> H2 price changes before confirmation -> PRICE_CHANGED +
//      refreshed offers -> customer reconfirms H2 at the new price -> MATCHED, new conversation
//   T  H3 above the held amount -> TOPUP_REQUIRED (no second payment, nothing changed)
//   B  v1 (H1, ENDED) + v2 (H2, ACCEPTED) history; one current selection; same funding intent
//   C  H2 gets exactly one HELPER_ASSIGNED push; H1 gets none for it
//   D  customer gets the in-app notice + a generic RESELECTION_REQUIRED push
//   E  stale price rejected (above); idempotent replay; conflicting offer under the same key blocked;
//      offer tokens not interchangeable between new checkouts and re-selection
//   F  two funded re-selection requests race for one free Helper (Promise.all): exactly one winner
//   G/H/I  wrong customer, public ID, ?ref= all blocked
//   J  declined Helpers never offered again; multiple declines -> v1 ended, v2 ended, v3 current
//   K  chat follows the current Helper (stale H1 blocked); service completed at the CURRENT price:
//      payout gross = v2, the difference refunded from the held payment (PRICE_DIFFERENCE)
//   P  public unpaid creation paths closed (402)
//   R  referral replay: same A->B again succeeds, C->B never overwrites, self-referral blocked
// Usage: node scripts/test_customer_reselection_staging.mjs [--headed]
import crypto from "node:crypto";
import fs from "node:fs";
import {
  Autopush, base, db, fixtures, launchChrome, markBrowserCheckoutsAsTestFixtures, minimalPayload, readResponse, recorder, serviceKey, settlementToken, sleep, subscribe, supabaseUrl, trustedClick, waitFor,
} from "./lib/stagingPushHarness.mjs";
import { fixtureObserveIntent, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";
import { rpc } from "./lib/stagingPushHarness.mjs";

const runId = `CR${Date.now()}`;
const headed = process.argv.includes("--headed");
const { expect, record, notTestable, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
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
/** Prepaid creation through the product API (test fixture) + FIXTURE activation: the funded request id. */
const checkoutApi = async (device, offerToken, label) => {
  const r = await api("/api/checkouts", { method: "POST", headers: { ...cookieOf(device), Authorization: `Bearer ${settlementToken}` }, body: { ...fx.requestPayload(device.publicId, "en", label), service_slug: "clog-clearing", mode: "HELPER_PRICE_SELECTED", offer_token: offerToken } });
  if (r.body?.checkoutId) mf.checkouts.add(r.body.checkoutId);
  return r;
};
const fundedSelected = async (device, offerToken, label) => {
  const co = await checkoutApi(device, offerToken, label);
  const funded = co.body?.checkoutId ? await mf.fixtureFund(co.body.checkoutId, device.publicId) : null;
  if (funded?.requestId) fx.created.requestIds.add(funded.requestId);
  return { checkout: co, funded, requestId: funded?.requestId ?? null };
};
const activeOf = (requestId) => db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id,status`);
const helperActive = (helper) => db(`request_assignments?helper_id=eq.${helper.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,request_id`);
const statusOf = async (requestId) => (await db(`service_requests?id=eq.${requestId}&select=status`))[0]?.status;
const history = (requestId) => db(`request_price_selections?request_id=eq.${requestId}&select=selection_version,helper_id,base_price,initial_payable_amount,status,ended_reason&order=selection_version`);
const hist = async (requestId, helpers) => (await history(requestId)).map((h) => `v${h.selection_version}:${helpers.find(([, x]) => x.helper.id === h.helper_id)?.[0] ?? "?"}:${Number(h.base_price)}:${h.status}${h.ended_reason ? `/${h.ended_reason}` : ""}`).join(" ");
const decline = async (helper, requestId) => { const a = (await activeOf(requestId))[0]; return api(`/api/helper/assignments/${a?.id}/decline`, { method: "POST", headers: helper.auth }); };
const helperStep = async (helper, requestId, action) => { const a = (await db(`request_assignments?request_id=eq.${requestId}&helper_id=eq.${helper.helper.id}&select=id&order=assigned_at.desc&limit=1`))[0]; return (await api(`/api/helper/assignments/${a?.id}/${action}`, { method: "POST", headers: helper.auth })).status; };
const convsOf = (requestId) => db(`conversations?request_id=eq.${requestId}&select=id,helper_id,status&order=created_at`);

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
  const prices = [await putPrice(h1, "toilet-simple", 75000), await putPrice(h2, "toilet-simple", 60000), await putPrice(h3, "toilet-simple", 90000)];
  await autopush.connect();
  const [h1Ch, h2Ch, h3Ch, cCh] = [await autopush.register(), await autopush.register(), await autopush.register(), await autopush.register()];
  const subs = [await subscribe("helper", h1Ch.subscription, h1.auth), await subscribe("helper", h2Ch.subscription, h2.auth), await subscribe("helper", h3Ch.subscription, h3.auth)];
  expect("Fixtures: H1 75,000 / H2 60,000 / H3 90,000 (same detailed service + region), real push channels", prices.every((p) => p.status === 200) && subs.every((s) => s.status === 200), [prices.map((p) => p.status), subs.map((s) => s.status)]);
  const aliasOf = Object.fromEntries((await newOffers("toilet-simple")).map((o) => [Number(o.base_price), o.helperAlias]));

  // ================= A: customer in a real browser =================
  const cb = await launchChrome({ headed });
  browsers.push(cb);
  if (!cb) throw new Error("Chrome not available");
  await markBrowserCheckoutsAsTestFixtures(cb, settlementToken);
  await cb.cdp("Page.addScriptToEvaluateOnNewDocument", { source: "(() => { window.__calls = []; const f = window.fetch.bind(window); window.fetch = async (input, init) => { const url = typeof input === 'string' ? input : input.url; const res = await f(input, init); if (/api\\/(checkouts(\\/[0-9a-f-]{36}\\/payment)?|requests\\/reselection)$/.test(url) && init && init.method === 'POST') { let body = null; try { body = await res.clone().json(); } catch {} const h = init.headers || {}; window.__calls.push({ url, sent: init.body || null, key: h['Idempotency-Key'] || null, status: res.status, body }); } return res; }; })();" }, cb.sessionId);
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
  await pickCard(cb, "price-offer-card", "price-offer-select", "75,000", "pick-h1");
  await waitFor(() => exists(cb, q("price-offer-confirm")), 10000, 300);
  await trustedClick(cb, q("price-offer-submit"));
  const coCall = await waitFor(() => cb.evaluate("window.__calls.find((c) => c.url.endsWith('/api/checkouts') && c.status === 201) || null"), 20000, 500);
  const coId = coCall?.body?.checkoutId;
  if (coId) mf.checkouts.add(coId);
  await waitFor(() => exists(cb, q("checkout-pay")), 15000, 500);
  await trustedClick(cb, q("checkout-pay"));
  const payCall = await waitFor(() => cb.evaluate("window.__calls.find((c) => c.url.endsWith('/payment')) || null"), 20000, 500);
  const act = payCall?.body?.intentId ? await fixtureObserveIntent(payCall.body.intentId) : null;
  const R = act?.activation?.request_id ? (await db(`service_requests?id=eq.${act.activation.request_id}&select=id,status,selection_mode,funding_payment_intent_id`))[0] : null;
  if (R) fx.created.requestIds.add(R.id);
  const cookies = (await cb.cdp("Storage.getCookies", {})).result?.cookies || [];
  const owner = cookies.find((c) => c.name === "life_help_device_owner");
  const C = { cookie: owner ? `life_help_device_owner=${owner.value}` : null, publicId: V?.referral_id };
  const v1Hist = R ? await hist(R.id, names) : "";
  expect("A1. Browser customer selects H1 / 75,000 -> prepaid checkout (75,000) -> payment UI -> (fixture) activation -> MATCHED, CUSTOMER_SELECTED, v1 ACCEPTED, funded by that intent", Number(coCall?.body?.fiatAmount) === 75000 && payCall?.status === 201 && act?.status === "PAID_HELD" && R?.status === "MATCHED" && R.selection_mode === "CUSTOMER_SELECTED" && R.funding_payment_intent_id === payCall.body.intentId && v1Hist === "v1:H1:75000:ACCEPTED" && !!C.cookie, { co: coCall?.body ?? null, pay: payCall?.status ?? null, act: act?.status ?? null, R, v1Hist, calls: await cb.evaluate("window.__calls.map((c) => [c.url.split('/api/')[1], c.status, c.body && c.body.code])"), notice: await cb.evaluate("[...document.querySelectorAll('[data-testid=\\\"price-offer-notice\\\"], [data-testid=\\\"checkout-notice\\\"]')].map((e) => e.innerText).join(' | ')") });
  notTestable("A2. H1 HELPER_ASSIGNED push on activation", "sent by the chain-verify route after a real payment; fixture activation bypasses the chain (no Devnet funds in this suite)");
  expect("A3. Customer push subscription (owner cookie)", (await subscribe("customer", cCh.subscription, { Cookie: C.cookie })).status === 200);
  const listBefore = await api("/api/requests/reselection", { headers: cookieOf(C) });
  const offersBefore = await reselOffers(C, R.id);
  expect("A4. Before any decline: nothing to re-select (list empty, offers 409 REQUEST_NOT_RESELECTABLE)", listBefore.status === 200 && listBefore.body.requests?.length === 0 && offersBefore.status === 409 && offersBefore.body.code === "REQUEST_NOT_RESELECTABLE", { listBefore: listBefore.body, offersBefore: offersBefore.body });
  const convBefore = await convsOf(R.id);

  // ---- H1 declines ----
  const d1 = await decline(h1, R.id);
  await sleep(2000);
  const afterDecline = await hist(R.id, names);
  const others = [...(await helperActive(h2)), ...(await helperActive(h3))];
  const convAfterDecline = await convsOf(R.id);
  expect("A5. H1 DECLINES -> route signals CUSTOMER_RESELECTION_REQUIRED; request CUSTOMER_RESELECTION_REQUIRED (not SEARCHING)", d1.status === 200 && d1.body.matching?.code === "CUSTOMER_RESELECTION_REQUIRED" && d1.body.release?.customer_reselection_required === true && (await statusOf(R.id)) === "CUSTOMER_RESELECTION_REQUIRED", d1.body);
  expect("A6. No automatic H2 / H3 assignment, no price substitution; v1 ENDED / HELPER_DECLINED", others.length === 0 && (await activeOf(R.id)).length === 0 && afterDecline === "v1:H1:75000:ENDED/HELPER_DECLINED", { others, afterDecline });
  expect("A6b. (016) H1's conversation CLOSED on decline", convBefore.length === 1 && convBefore[0].helper_id === h1.helper.id && convAfterDecline.length === 1 && convAfterDecline[0].status === "CLOSED", { convBefore, convAfterDecline });
  const m = await rpc("match_and_assign_helper", { p_request_id: R.id });
  expect("A7. Automatic matcher does not consume CUSTOMER_RESELECTION_REQUIRED", m.data?.success === false && (await activeOf(R.id)).length === 0, m.data);
  const notice = await db(`app_notifications?type=eq.CUSTOMER_RESELECTION_REQUIRED&payload->>request_id=eq.${R.id}&select=recipient_type,recipient_id,title,body,payload`);
  expect("D1. Customer in-app notice once (generic: no price / Helper / address)", notice.length === 1 && notice[0].recipient_id === C.publicId && !/\d{3}|HLP-|@|address/i.test(notice[0].title + notice[0].body), notice);
  const cPush = await autopush.next(cCh, (p) => p.type === "RESELECTION_REQUIRED");
  const secrets = [R.id, C.publicId, "75000", "75,000", "60,000", h1.helper.id, h1.helper.helper_id, h1.email, `${runId} address`, owner?.value];
  expect("D2. REAL Web Push to the customer: RESELECTION_REQUIRED, generic, minimal (no price / Helper / id / address / capability)", !!cPush && cPush.audience === "customer" && cPush.url === "/request" && cPush.title === en.push.reselectionTitle && minimalPayload(cPush, secrets), cPush);

  // ---- browser: the owner's pending re-selection panel, fresh offers ----
  await cb.navigate(`${base}/request?service=clog-clearing`);
  const panel = await waitFor(() => exists(cb, q("reselection-panel")), 40000, 1000);
  const pageText = await cb.evaluate("document.body.innerText");
  expect("A8. Browser shows the re-selection panel (title, body, 'choose another Helper'), no SEARCHING / assigned / no-helper wording", panel && pageText.includes(en.reselection.title) && pageText.includes(en.reselection.body) && pageText.includes(en.reselection.chooseButton) && !pageText.includes("A helper has been assigned.") && !pageText.includes("No helper is available right now"), pageText.slice(0, 400));
  const list = await api("/api/requests/reselection", { headers: cookieOf(C) });
  expect("A9. Owner's pending re-selection list names this request and its detailed service", list.body.requests?.length === 1 && list.body.requests[0].requestId === R.id && list.body.requests[0].subitemCode === "toilet-simple", list.body);
  const apiOffers = await reselOffers(C, R.id);
  const aliases = (apiOffers.body.offers || []).map((o) => o.helperAlias);
  expect("J1. Fresh offers: same detailed service; H2 + H3 only; declined H1 NOT offered (though free and ACTIVE)", apiOffers.status === 200 && apiOffers.body.subitemCode === "toilet-simple" && aliases.length === 2 && aliases.includes(aliasOf[60000]) && aliases.includes(aliasOf[90000]) && !aliases.includes(aliasOf[75000]), { aliases, aliasOf });
  const rawOffers = JSON.stringify(apiOffers.body);
  expect("J2. Re-selection offers expose no internal ids / private data", ![h1, h2, h3].some((h) => rawOffers.includes(h.helper.id) || rawOffers.includes(h.email) || rawOffers.includes(h.helper.helper_id)) && !/price_id|helper_id|auth_user/.test(rawOffers));
  const h3Token = apiOffers.body.offers.find((o) => o.helperAlias === aliasOf[90000])?.offerToken;

  // ---- T: above the held amount -> TOPUP_REQUIRED (no second payment) ----
  const checkoutsBefore = (await db(`service_checkouts?customer_id=eq.${C.publicId}&select=id`)).length;
  const topup = await reselect(C, R.id, h3Token);
  expect("T. H3 at 90,000 exceeds the held 75,000 -> 400 TOPUP_REQUIRED; nothing changed, no new checkout / payment", topup.status === 400 && topup.body.code === "TOPUP_REQUIRED" && (await statusOf(R.id)) === "CUSTOMER_RESELECTION_REQUIRED" && (await helperActive(h3)).length === 0 && (await hist(R.id, names)) === "v1:H1:75000:ENDED/HELPER_DECLINED" && (await db(`service_checkouts?customer_id=eq.${C.publicId}&select=id`)).length === checkoutsBefore, topup.body);

  await trustedClick(cb, q("reselection-open"));
  await waitFor(async () => ((await cb.evaluate(`document.querySelectorAll('${q("reselection-offer-card")}').length`)) === 2 ? true : null), 20000, 500);
  const shown = await cardsText(cb, "reselection-offer-card");
  expect("J3. Browser lists the fresh offers (60,000 and 90,000), never the declined 75,000", /60,000/.test(shown) && /90,000/.test(shown) && !/75,000/.test(shown), shown);

  // ---- E: price changes before confirmation ----
  await pickCard(cb, "reselection-offer-card", "reselection-offer-select", "60,000", "pick-h2-v1");
  await waitFor(() => exists(cb, q("reselection-confirm")), 10000, 300);
  const confirmText = await text(cb, q("reselection-confirm"));
  const to65 = await putPrice(h2, "toilet-simple", 65000);
  await trustedClick(cb, q("reselection-submit"));
  const staleCall = await waitFor(() => cb.evaluate("window.__calls.filter((c) => c.url.endsWith('/api/requests/reselection')).pop() || null"), 20000, 500);
  const staleNotice = await waitFor(() => text(cb, q("reselection-notice")), 15000, 500);
  const refreshed = await waitFor(async () => { const t = await cardsText(cb, "reselection-offer-card"); return /65,000/.test(t) ? t : null; }, 20000, 500);
  expect("E1. Confirmation showed H2 at 60,000; old token after H2 -> 65,000 returns 409 PRICE_CHANGED", /60,000/.test(confirmText || "") && confirmText.includes(en.pricing.confirmTitle) && to65.status === 200 && staleCall?.status === 409 && staleCall.body?.code === "PRICE_CHANGED", { staleCall, confirmText });
  expect("E2. Request stays CUSTOMER_RESELECTION_REQUIRED; no assignment; no new selection; no silent repricing", (await statusOf(R.id)) === "CUSTOMER_RESELECTION_REQUIRED" && (await activeOf(R.id)).length === 0 && (await helperActive(h2)).length === 0 && (await hist(R.id, names)) === "v1:H1:75000:ENDED/HELPER_DECLINED");
  expect("E3. Customer sees the price-changed notice and refreshed offers (65,000) and must reconfirm", staleNotice === en.pricing.priceChanged && !!refreshed && !(await exists(cb, q("reselection-confirm"))), { staleNotice, refreshed });

  // ---- reconfirm H2 at 65,000 ----
  await pickCard(cb, "reselection-offer-card", "reselection-offer-select", "65,000", "pick-h2-v2");
  await waitFor(() => exists(cb, q("reselection-confirm")), 10000, 300);
  const confirm2 = await text(cb, q("reselection-confirm"));
  await trustedClick(cb, q("reselection-submit"));
  const okCall = await waitFor(() => cb.evaluate("window.__calls.filter((c) => c.url.endsWith('/api/requests/reselection') && c.status === 201).pop() || null"), 20000, 500);
  await sleep(1500);
  const bHist = await hist(R.id, names);
  const accepted = (await history(R.id)).filter((h) => h.status === "ACCEPTED");
  expect("A10. Customer explicitly reconfirms H2 at 65,000 -> 201, request MATCHED, new H2 assignment", /65,000/.test(confirm2 || "") && okCall?.status === 201 && okCall.body?.selectionVersion === 2 && okCall.body.agreed?.initialPayableAmount === 65000 && (await statusOf(R.id)) === "MATCHED" && (await activeOf(R.id)).map((a) => a.helper_id).join() === h2.helper.id, { okCall });
  expect("B1. History: v1 H1 / 75,000 ENDED (unchanged) + v2 H2 / 65,000 ACCEPTED; exactly one current selection", bHist === "v1:H1:75000:ENDED/HELPER_DECLINED v2:H2:65000:ACCEPTED" && accepted.length === 1, bHist);
  const intentNow = (await db(`payment_intents?id=eq.${R.funding_payment_intent_id}&select=status,fiat_amount`))[0];
  expect("B2. No second payment: same funding intent (PAID_HELD, 75,000 held), one checkout, the request's funding unchanged", (await db(`service_requests?id=eq.${R.id}&select=funding_payment_intent_id`))[0].funding_payment_intent_id === R.funding_payment_intent_id && intentNow?.status === "PAID_HELD" && Number(intentNow.fiat_amount) === 75000 && (await db(`service_checkouts?customer_id=eq.${C.publicId}&select=id`)).length === checkoutsBefore, intentNow);
  const convAfter = await convsOf(R.id);
  expect("B3. (016) new conversation for H2 (ACTIVE); H1's stays CLOSED", convAfter.length === 2 && convAfter.some((c) => c.helper_id === h1.helper.id && c.status === "CLOSED") && convAfter.some((c) => c.helper_id === h2.helper.id && c.status === "ACTIVE"), convAfter);
  const h2Push = await autopush.next(h2Ch, (p) => p.type === "HELPER_ASSIGNED");
  expect("C1. REAL Web Push: H2 receives HELPER_ASSIGNED (minimal payload, no price)", !!h2Push && minimalPayload(h2Push, [R.id, C.publicId, "65000", "65,000"]), h2Push);
  await cb.navigate(`${base}/request?service=clog-clearing`);
  await sleep(4000);
  expect("A11. Browser leaves the re-selection state (no pending panel for this request)", !(await exists(cb, q("reselection-panel"))) && (await api("/api/requests/reselection", { headers: cookieOf(C) })).body.requests?.length === 0);

  // ---- E: idempotency + token binding ----
  const sent = JSON.parse(okCall.sent);
  const replay = await reselect(C, R.id, sent.offer_token, okCall.key);
  const conflict = await reselect(C, R.id, h3Token, okCall.key);
  await sleep(12000);
  const h2Notes = await db(`app_notifications?type=eq.NEW_SERVICE_REQUEST&recipient_id=eq.${h2.helper.helper_id}&payload->>request_id=eq.${R.id}&select=id`);
  expect("E4. Exact replay -> 200 replayed (same version); no duplicate assignment / version / notification / push", replay.status === 200 && replay.body.replayed === true && replay.body.selectionVersion === 2 && (await history(R.id)).length === 2 && (await db(`request_assignments?request_id=eq.${R.id}&helper_id=eq.${h2.helper.id}&select=id`)).length === 1 && h2Notes.length === 1 && autopush.received(h2Ch).length === 1, { replay: replay.body, notes: h2Notes.length, pushes: autopush.received(h2Ch).length });
  expect("E5. Same idempotency key with a different offer (H3) -> blocked (409), nothing changed", conflict.status === 409 && conflict.body.code === "REQUEST_NOT_RESELECTABLE" && (await helperActive(h3)).length === 0 && (await hist(R.id, names)) === bHist, conflict.body);
  expect("C2. H1 receives no push for H2's assignment; H3 none at all", autopush.received(h1Ch).length === 0 && autopush.received(h3Ch).length === 0, { h1: autopush.received(h1Ch).length, h3: autopush.received(h3Ch).length });

  // ================= K: chat follows the current Helper; completion at the CURRENT price =================
  const coRead = await api(`/api/checkouts/${coId}`, { headers: cookieOf(C) });
  const capability = coRead.body?.capability;
  const custChat = await api(`/api/chat?requestId=${R.id}&capability=${encodeURIComponent(capability || "")}`);
  const h2Chat = await api(`/api/chat?requestId=${R.id}`, { headers: h2.auth });
  const h1Chat = await api(`/api/chat?requestId=${R.id}`, { headers: h1.auth });
  expect("K1. Chat follows the current Helper: customer -> H2's conversation, H2 its own, declined H1 refused", coRead.body?.requestId === R.id && custChat.status === 200 && custChat.body.conversation?.helper_id === h2.helper.id && h2Chat.status === 200 && h2Chat.body.conversation?.id === custChat.body.conversation.id && h1Chat.status === 403, { cust: custChat.status, h2: h2Chat.status, h1: h1Chat.status });
  const msg = await api("/api/chat", { method: "POST", body: { requestId: R.id, capability, originalLanguage: "en", originalText: `${runId} hello` } });
  const h1Write = await api("/api/chat", { method: "POST", headers: h1.auth, body: { requestId: R.id, originalLanguage: "en", originalText: `${runId} stale` } });
  const oldConv = convAfter.find((c) => c.helper_id === h1.helper.id);
  const oldMsgs = await db(`messages?conversation_id=eq.${oldConv?.id}&original_text=like.${runId}*&select=id`);
  expect("K2. (016) Customer writes land in H2's conversation; stale H1 write refused; nothing written into the CLOSED H1 conversation", msg.status === 200 && h1Write.status >= 400 && oldMsgs.length === 0, { msg: msg.status, h1Write: h1Write.status });
  const steps = [await helperStep(h2, R.id, "accept"), await helperStep(h2, R.id, "start"), await helperStep(h2, R.id, "complete")];
  const done = await api(`/api/requests/${R.id}/complete`, { method: "POST", headers: cookieOf(C) });
  await sleep(1500);
  const ob = (await db(`payout_obligations?request_id=eq.${R.id}&kind=eq.HELPER_SERVICE&select=gross_amount,currency,helper_id,status`))[0];
  const diff = await db(`service_refunds?request_id=eq.${R.id}&select=reason,amount`);
  const obJobs = await db(`money_movement_jobs?obligation_type=eq.HELPER_PAYOUT&context->>request_id=eq.${R.id}&select=id`).catch(() => []);
  expect("K3. Completed + customer-confirmed at the CURRENT selection: payout gross 65,000 to H2 (never v1 75,000), 10,000 PRICE_DIFFERENCE refunded from the held payment; no chain transfer (no payout destination)", steps.every((s) => s === 200) && done.status === 200 && ob?.helper_id === h2.helper.id && Number(ob.gross_amount) === 65000 && ob.currency === "KRW" && ob.status !== "PAID" && diff.length === 1 && diff[0].reason === "PRICE_DIFFERENCE" && Number(diff[0].amount) === 10000 && (await statusOf(R.id)) === "PAYMENT_PENDING", { steps, done: done.body, ob, diff, obJobs: obJobs.length });
  record("INFO", "Settlement / CLOSED of a prepaid request requires a confirmed chain payout (not produced without Devnet funds); covered by the completed real-chain E2E");

  // ================= J + G/H/I: second customer, multiple declines =================
  const h4 = await fx.createHelper("H4", { service: "clog-clearing", rating: 5 });
  await putPrice(h4, "toilet-simple", 70000);
  names.push(["H4", h4]);
  const aliases4 = Object.fromEntries((await newOffers("toilet-simple")).map((o) => [Number(o.base_price), o.helperAlias]));
  const E = await fx.customerDevice("E");
  const D = await fx.customerDevice("D");
  const Dref = await fx.customerDevice("DREF", E.publicId);
  const R2 = await fundedSelected(E, (await newOffers("toilet-simple")).find((o) => Number(o.base_price) === 75000)?.offerToken, "multi");
  const r2 = R2.requestId;
  await decline(h1, r2);
  const eOffers = await reselOffers(E, r2);
  const wrong = [
    ["other customer GET offers", (await reselOffers(D, r2)).status, 404],
    ["other customer POST", (await reselect(D, r2, eOffers.body.offers?.[0]?.offerToken)).status, 404],
    ["no cookie GET", (await reselOffers(null, r2)).status, 401],
    ["no cookie POST", (await reselect(null, r2, eOffers.body.offers?.[0]?.offerToken)).status, 401],
  ];
  expect("G. Wrong customer blocked (404, indistinguishable from missing); no cookie 401", R2.funded?.paid?.status === "PAID_HELD" && wrong.every(([, s, want]) => s === want), wrong);
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
  const eCheckouts = (await db(`service_checkouts?customer_id=eq.${E.publicId}&select=id`)).length;
  const tokenSwap = [
    ["new-checkout token used for re-selection", (await reselect(E, r2, (await newOffers("toilet-simple"))[0]?.offerToken)).body.code, "OFFER_INVALID"],
    ["re-selection token used to open a new checkout", (await checkoutApi(E, eOffers.body.offers?.[0]?.offerToken, "swap")).body.code, "OFFER_INVALID"],
    ["token of another request (R2 token on a different request id)", (await reselect(E, R.id, eOffers.body.offers?.[0]?.offerToken)).body.code, "OFFER_INVALID"],
  ];
  expect("E6. Offer tokens are bound: new checkout vs re-selection vs another request not interchangeable", tokenSwap.every(([, c, want]) => c === want) && (await history(r2)).length === 1 && (await db(`service_checkouts?customer_id=eq.${E.publicId}&select=id`)).length === eCheckouts, tokenSwap);
  const e2 = (eOffers.body.offers || []).find((o) => o.helperAlias === aliases4[65000]);
  const sel2 = await reselect(E, r2, e2?.offerToken);
  await decline(h2, r2);
  const eOffers2 = await reselOffers(E, r2);
  const aliases2 = (eOffers2.body.offers || []).map((o) => o.helperAlias);
  const e3top = await reselect(E, r2, eOffers2.body.offers?.find((o) => o.helperAlias === aliases4[90000])?.offerToken);
  const sel3 = await reselect(E, r2, eOffers2.body.offers?.find((o) => o.helperAlias === aliases4[70000])?.offerToken);
  const multi = await hist(r2, names);
  expect("J4. After H2 also declines, H1 and H2 are excluded: only H3 (90,000) and H4 (70,000) offered; H3 above the held 75,000 -> TOPUP_REQUIRED", sel2.status === 201 && aliases2.length === 2 && aliases2.includes(aliases4[90000]) && aliases2.includes(aliases4[70000]) && e3top.status === 400 && e3top.body.code === "TOPUP_REQUIRED", { sel2: sel2.body, aliases2, e3top: e3top.body });
  expect("J5. Multiple declines: v1 H1 ENDED, v2 H2 ENDED, v3 H4 CURRENT; nothing overwritten", sel3.status === 201 && sel3.body.selectionVersion === 3 && multi === "v1:H1:75000:ENDED/HELPER_DECLINED v2:H2:65000:ENDED/HELPER_DECLINED v3:H4:70000:ACCEPTED" && (await statusOf(r2)) === "MATCHED" && (await activeOf(r2)).map((a) => a.helper_id).join() === h4.helper.id, multi);

  // ================= F: concurrent re-selection race (two funded requests) =================
  const s1 = await fx.createHelper("S1", { service: "clog-clearing", rating: 5 });
  const x = await fx.createHelper("X", { service: "clog-clearing", rating: 5 });
  await putPrice(s1, "sink", 50000);
  const F1 = await fx.customerDevice("F1"), F2 = await fx.customerDevice("F2");
  const RF1 = await fundedSelected(F1, (await newOffers("sink"))[0]?.offerToken, "race-1");
  await decline(s1, RF1.requestId);
  const RF2 = await fundedSelected(F2, (await newOffers("sink"))[0]?.offerToken, "race-2");
  await decline(s1, RF2.requestId);
  await putPrice(x, "sink", 45000);
  const [o1, o2] = [(await reselOffers(F1, RF1.requestId)).body.offers || [], (await reselOffers(F2, RF2.requestId)).body.offers || []];
  expect("F1. Two funded requests in CUSTOMER_RESELECTION_REQUIRED see the same single free Helper X (S1 excluded)", o1.length === 1 && o2.length === 1 && o1[0].helperAlias === o2[0].helperAlias && (await statusOf(RF1.requestId)) === "CUSTOMER_RESELECTION_REQUIRED" && (await statusOf(RF2.requestId)) === "CUSTOMER_RESELECTION_REQUIRED", { o1: o1.length, o2: o2.length });
  const race = await Promise.all([reselect(F1, RF1.requestId, o1[0]?.offerToken), reselect(F2, RF2.requestId, o2[0]?.offerToken)]);
  const winners = race.filter((r) => r.status === 201);
  const loserIdx = race.findIndex((r) => r.status !== 201);
  const loserId = [RF1, RF2][loserIdx]?.requestId;
  const loserSel = loserId ? await history(loserId) : [];
  const loserConv = loserId ? await convsOf(loserId) : [];
  expect("F2. True concurrent re-selection: exactly ONE winner; loser 409 HELPER_NO_LONGER_AVAILABLE", winners.length === 1 && race[loserIdx]?.status === 409 && race[loserIdx].body.code === "HELPER_NO_LONGER_AVAILABLE" && (await helperActive(x)).length === 1, race.map((r) => [r.status, r.body.code]));
  expect("F3. Loser stays CUSTOMER_RESELECTION_REQUIRED: no assignment, no current selection, no extra conversation", loserId && (await statusOf(loserId)) === "CUSTOMER_RESELECTION_REQUIRED" && (await activeOf(loserId)).length === 0 && loserSel.length === 1 && loserSel[0].status === "ENDED" && loserConv.length === 1, { loserSel, loserConv: loserConv.length });
  record("INFO", `Race winners: ${winners.length}`);

  // ================= P: public unpaid creation paths stay closed =================
  const pubReq = await api("/api/requests", { method: "POST", headers: cookieOf(E), key: crypto.randomUUID(), body: fx.requestPayload(E.publicId, "en", "bypass") });
  const pubSel = await api("/api/requests/selected", { method: "POST", headers: cookieOf(E), key: crypto.randomUUID(), body: { ...fx.requestPayload(E.publicId, "en", "bypass-selected"), service_slug: "clog-clearing", offer_token: (await newOffers("toilet-simple"))[0]?.offerToken } });
  expect("P. Public unpaid creation paths closed: POST /api/requests and /api/requests/selected -> 402 PREPAYMENT_REQUIRED", pubReq.status === 402 && pubReq.body.code === "PREPAYMENT_REQUIRED" && pubSel.status === 402 && pubSel.body.code === "PREPAYMENT_REQUIRED", [pubReq.status, pubSel.status]);

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
  // Every checkout of this run is a test fixture: purge them all (requests, intents, quotes, reservations,
  // obligations / refunds / money jobs, media rows); nothing of the run stays OPEN.
  for (const row of await db(`service_checkouts?description=like.${runId}*&select=id`).catch(() => [])) mf.checkouts.add(row.id);
  const out = await mf.cleanup();
  const leftovers = out.leftovers;
  const zero = "00000000-0000-0000-0000-000000000000";
  const helperIds = [...fx.created.helperIds, zero].join(",");
  const requestIds = [...fx.created.requestIds, zero].join(",");
  const identityIds = [...fx.created.identityIds, zero].join(",");
  leftovers.purgeRefused = out.purged.filter((ok) => !ok).length;
  leftovers.checkouts = (await db(`service_checkouts?description=like.${runId}*&select=id`)).length;
  leftovers.reservations = (await db(`helper_checkout_reservations?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.prices = (await db(`helper_service_prices?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.selections = (await db(`request_price_selections?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.snapshots = (await db(`request_price_snapshots?helper_id=in.(${helperIds})&select=request_id`)).length;
  leftovers.assignments = (await db(`request_assignments?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.conversations = (await db(`conversations?request_id=in.(${requestIds})&select=id`)).length;
  leftovers.obligations = (await db(`payout_obligations?request_id=in.(${requestIds})&select=id`)).length;
  leftovers.refunds = (await db(`service_refunds?request_id=in.(${requestIds})&select=id`)).length;
  leftovers.rewards = (await db(`referral_rewards?or=(referred_identity_id.in.(${identityIds}),referrer_identity_id.in.(${identityIds}))&select=id`)).length;
  leftovers.attributions = (await db(`referral_attributions?or=(referred_identity_id.in.(${identityIds}),referrer_identity_id.in.(${identityIds}))&select=id`)).length;
  leftovers.audit = (await db(`admin_audit_logs?entity_id=in.(${[...fx.created.requestIds, ...fx.created.helperIds, ...fx.created.identityIds, zero].join(",")})&select=id`)).length;
  leftovers.authUsers = 0;
  for (const id of fx.created.authUserIds) if ((await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })).status === 200) leftovers.authUsers += 1;
  expect("Fixture cleanup (all run checkouts purged - none OPEN; auth users, helpers, prices, reservations, requests, assignments, selections, conversations, messages, obligations / refunds / jobs, push, notifications, identities, audit; no reward history created)", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

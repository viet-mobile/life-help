// Live STAGING E2E for helper-defined pricing through the CURRENT prepaid product flow (migrations
// 012-014 + deployed Worker). Real services only; NO chain funds.
//
//   3. Helper price management in a real browser (Supabase Auth login -> /tech/assignments panel):
//      qualified services only, all term fields, DRAFT -> ACTIVE -> PAUSED -> ACTIVE; cross-helper and
//      customer / public writes blocked.
//   4. Customer offer discovery BEFORE a request (API + real browser): two Helpers, different prices;
//      only safe public data returned.
//   5. Customer selects H1 in the browser: confirmation shows every term -> prepaid CHECKOUT with the
//      server's authoritative terms (nothing is a request yet) -> payment UI (server USDC intent) ->
//      test activation (FIXTURE payment observation on that intent; test_fixture checkout, purged
//      afterwards, never a chain payment) -> request + assignment + selection v1; real Web Push to H1.
//   6. Immutable commercial snapshot: H1 60,000 -> 80,000 leaves selection AND checkout at 60,000.
//  11. H1 DECLINES the funded request: no automatic rematch / substitution; CUSTOMER_RESELECTION_REQUIRED.
//   7. Stale offer in the browser: checkout 409 PRICE_CHANGED, nothing created, refreshed offers, reconfirm.
//   8. True concurrent checkout race for one free Helper (reservation): exactly one winner.
//   9. Tampering: spoofed amount / currency / Helper / terms on the checkout ignored; authoritative after payment.
//   P. Public unpaid creation paths stay closed (402).
//  10. Market data separation.
// Browser checkouts become staging test fixtures through DevTools request interception (operator header
// on the page's own POST /api/checkouts; never exposed to page script). Every checkout of the run is
// purged afterwards; nothing is left OPEN.
// Usage: node scripts/test_helper_pricing_staging.mjs [--headed]
import crypto from "node:crypto";
import fs from "node:fs";
import {
  Autopush, base, db, env, fixtures, launchChrome, markBrowserCheckoutsAsTestFixtures, minimalPayload, readResponse, recorder, sleep, subscribe,
  supabaseUrl, serviceKey, trustedClick, waitFor,
} from "./lib/stagingPushHarness.mjs";
import { settlementToken } from "./lib/stagingPushHarness.mjs";
import { fixtureObserveIntent, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `HP${Date.now()}`;
const headed = process.argv.includes("--headed");
const { expect, record, notTestable, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const sido = fx.sido;
const autopush = new Autopush();
const browsers = [];
const en = JSON.parse(fs.readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"));
const anonKey = env.TEST_SUPABASE_ANON_KEY;

const api = async (path, { method = "GET", headers = {}, body, key } = {}) => {
  const r = await fetch(`${base}${path}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await readResponse(r) };
};
const offersApi = (subitem) => api(`/api/pricing/offers?${new URLSearchParams({ service: "clog-clearing", subitem, country: "KR", sido, gungu: "G1" })}`);
const putPrice = (helper, subitem, terms, publish = true) => api("/api/helper/prices", { method: "PUT", headers: helper.auth, body: { service_code: "clog-clearing", subitem_code: subitem, terms, publish } });
const priceOf = async (helper, subitem) => (await db(`helper_service_prices?helper_id=eq.${helper.helper.id}&select=*,service_subitems!inner(subitem_code)&service_subitems.subitem_code=eq.${subitem}`))[0];
/** API checkout as a device (owner cookie) with the operator header -> purgeable test fixture; client fields beyond the form are ignored by the server. */
const checkoutApi = async (device, offerToken, extra = {}, label = "checkout") => {
  const r = await api("/api/checkouts", { method: "POST", headers: { ...(device.cookie ? { Cookie: device.cookie } : {}), Authorization: `Bearer ${settlementToken}` }, body: { ...fx.requestPayload(device.publicId, "en", label), service_slug: "clog-clearing", mode: "HELPER_PRICE_SELECTED", offer_token: offerToken, ...extra } });
  if (r.body?.checkoutId) mf.checkouts.add(r.body.checkoutId);
  return r;
};
const track = (id) => { if (id) fx.created.requestIds.add(id); return id; };
const active = (helper) => db(`request_assignments?helper_id=eq.${helper.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,request_id,status`);

// ---- browser helpers (trusted clicks; React-safe value setting) ----
const q = (testid) => `[data-testid="${testid}"]`;
const setValue = (b, selector, value) => b.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true })); return true; })()`);
const exists = (b, selector) => b.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);
const text = (b, selector) => b.evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? null`);
const seed = (b, entries) => b.evaluate(`(() => { ${Object.entries(entries).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(" ")} return true; })()`);
const statusIs = (b, sub, status) => waitFor(() => b.evaluate(`document.querySelector('${q(`price-status-${sub}`)}')?.dataset.status === ${JSON.stringify(status)}`), 20000, 400);
const deviceIdentity = async (b) => {
  const device = await waitFor(() => b.evaluate("localStorage.getItem('life_help_referral_device_id')"), 20000, 500);
  const row = device ? await waitFor(async () => (await db(`referral_identities?device_id_hash=eq.${crypto.createHash("sha256").update(device).digest("hex")}&select=id,referral_id`))[0], 20000) : null;
  if (row) { fx.created.identityIds.add(row.id); fx.created.publicIds.add(row.referral_id); }
  return row;
};
const REGION = JSON.stringify({ country: "KR", sido, gungu: "G1", dong: "D1" });
// The request form's address field (prefilled from known regions; typed by the user otherwise).
const fillRequestForm = async (b, description) => {
  await b.evaluate(`(() => { const ph = ${JSON.stringify(en.request.addressPlaceholder)}; const el = [...document.querySelectorAll("input[required]")].find((i) => (i.placeholder || "").includes(ph)); if (el) el.setAttribute("data-e2e", "address"); return !!el; })()`);
  return [await setValue(b, "textarea", description), await setValue(b, '[data-e2e="address"]', `${runId} address`)];
};

try {
  // ================= fixtures =================
  const h1 = await fx.createHelper("H1", { service: "clog-clearing", rating: 5 });
  await db("helper_services", "POST", { helper_id: h1.helper.id, service_slug: "cleaning" });
  const h2 = await fx.createHelper("H2", { service: "clog-clearing", rating: 5 });
  await autopush.connect();
  const [h1Ch, h2Ch] = [await autopush.register(), await autopush.register()];
  const subs = [await subscribe("helper", h1Ch.subscription, h1.auth), await subscribe("helper", h2Ch.subscription, h2.auth)];
  expect("Fixtures: isolated Helpers H1 (clog-clearing + cleaning) and H2 (clog-clearing), real push channels", subs.every((s) => s.status === 200), subs.map((s) => s.status));

  // ================= 3. Helper price management in a real browser =================
  const hb = await launchChrome({ headed });
  browsers.push(hb);
  if (!hb) throw new Error("Chrome not available");
  await hb.navigate(`${base}/`);
  await waitFor(() => hb.evaluate("document.readyState === 'complete'"), 20000, 300);
  await seed(hb, { life_help_locale: "en" });
  await hb.navigate(`${base}/login`);
  await waitFor(() => hb.evaluate("!!document.querySelector('input[name=\"email\"]') && !!document.querySelector('input[name=\"password\"]')"), 20000, 500);
  await sleep(2000);
  for (const [name, value] of [["email", h1.email], ["password", h1.password]]) {
    await hb.evaluate(`document.querySelector('input[name="${name}"]').focus()`);
    await hb.cdp("Input.insertText", { text: value }, hb.sessionId);
  }
  await trustedClick(hb, 'form button[type="submit"]');
  await waitFor(() => hb.evaluate("!location.pathname.startsWith('/login')"), 20000, 500);
  await deviceIdentity(hb); // login lands on "/", whose referral card creates a device identity; cleaned up
  await hb.navigate(`${base}/tech/assignments`);
  const panel = await waitFor(() => exists(hb, q("price-edit-toilet-simple")), 30000, 500);
  const shownServices = await hb.evaluate("[...document.querySelectorAll('[data-testid^=\"price-service-\"]')].map((e) => e.dataset.testid.replace('price-service-', ''))");
  const shownItems = await hb.evaluate("[...document.querySelectorAll('[data-testid^=\"price-item-\"]')].map((e) => e.dataset.testid.replace('price-item-', ''))");
  expect("3a. Helper browser: pricing panel shows ONLY qualified services (clog-clearing, cleaning) and their detailed services", panel && JSON.stringify([...shownServices].sort()) === '["cleaning","clog-clearing"]' && shownItems.length === 7 && !shownItems.includes("boiler-diagnostic"), { shownServices, shownItems });

  await trustedClick(hb, q("price-edit-toilet-simple"));
  await waitFor(() => exists(hb, q("price-mode")), 10000, 300);
  const modes = await hb.evaluate(`[...document.querySelector('${q("price-mode")}').options].map((o) => o.value)`);
  const H1_TERMS = { currency: "KRW", base_price: "60000", minimum_charge: "50000", included_minutes: "60", extra_hour_price: "20000", night_multiplier: "1.3", weekend_multiplier: "1.2", emergency_multiplier: "1.5" };
  const typed = [await setValue(hb, q("price-currency"), "KRW")];
  for (const [k, v] of Object.entries(H1_TERMS)) if (k !== "currency") typed.push(await setValue(hb, q(`price-field-${k}`), v));
  typed.push(await setValue(hb, q("price-materials"), "PARTIALLY_INCLUDED"), await setValue(hb, q("price-materials-note"), `${runId} basic parts`));
  expect("3b. Editor: only allowed modes offered (FIXED); currency, price, minimum, time, extra hour, materials, note, night / weekend / emergency entered", modes.join() === "FIXED" && typed.every(Boolean), { modes, typed });
  await trustedClick(hb, q("price-save-draft"));
  const drafted = await statusIs(hb, "toilet-simple", "DRAFT");
  const draftRow = await priceOf(h1, "toilet-simple");
  const draftOffers = await offersApi("toilet-simple");
  expect("3c. Save draft -> DRAFT stored, not visible to customers", drafted && draftRow?.status === "DRAFT" && Number(draftRow.base_price) === 60000 && draftOffers.body.offers?.length === 0, { draftRow: draftRow?.status, offers: draftOffers.body.offers?.length });
  await trustedClick(hb, q("price-publish"));
  const published = await statusIs(hb, "toilet-simple", "ACTIVE");
  const pub = await priceOf(h1, "toilet-simple");
  expect("3d. Save and publish -> ACTIVE with exactly the entered terms", published && pub.status === "ACTIVE" && pub.pricing_mode === "FIXED" && pub.currency === "KRW" && Number(pub.base_price) === 60000 && Number(pub.minimum_charge) === 50000 && pub.included_minutes === 60 && Number(pub.extra_hour_price) === 20000 && pub.materials_policy === "PARTIALLY_INCLUDED" && pub.materials_note === `${runId} basic parts` && Number(pub.night_multiplier) === 1.3 && Number(pub.weekend_multiplier) === 1.2 && Number(pub.emergency_multiplier) === 1.5 && pub.tax_included === true, pub);
  await trustedClick(hb, q("price-pause-toilet-simple"));
  const pausedUi = await statusIs(hb, "toilet-simple", "PAUSED");
  const pausedOffers = (await offersApi("toilet-simple")).body.offers?.length;
  await trustedClick(hb, q("price-resume-toilet-simple"));
  const resumedUi = await statusIs(hb, "toilet-simple", "ACTIVE");
  const resumedOffers = (await offersApi("toilet-simple")).body.offers?.length;
  expect("3e. Pause (hidden from customers) -> reactivate (visible again)", pausedUi && pausedOffers === 0 && resumedUi && resumedOffers === 1, { pausedUi, pausedOffers, resumedUi, resumedOffers });
  // A second detailed service in another mode: included quantity + extra unit price.
  await trustedClick(hb, q("price-edit-appliance-cleaning"));
  await waitFor(() => hb.evaluate(`document.querySelector('${q("price-mode")}')?.value === "PER_UNIT"`), 10000, 300);
  const perUnitFields = await hb.evaluate("[...document.querySelectorAll('[data-testid^=\"price-field-\"]')].map((e) => e.dataset.testid.replace('price-field-', ''))");
  for (const [k, v] of [["base_price", "40000"], ["included_quantity", "2"], ["extra_unit_price", "35000"]]) await setValue(hb, q(`price-field-${k}`), v);
  await setValue(hb, q("price-materials"), "INCLUDED");
  await trustedClick(hb, q("price-publish"));
  const unitOk = await statusIs(hb, "appliance-cleaning", "ACTIVE");
  const unitRow = (await db(`helper_service_prices?helper_id=eq.${h1.helper.id}&pricing_mode=eq.PER_UNIT&select=*`))[0];
  expect("3f. PER_UNIT offer: mode-specific fields (included quantity, extra unit) entered and published", unitOk && perUnitFields.includes("included_quantity") && perUnitFields.includes("extra_unit_price") && !perUnitFields.includes("included_minutes") && Number(unitRow?.included_quantity) === 2 && Number(unitRow.extra_unit_price) === 35000, { perUnitFields, unitRow });
  // Incomplete publish is refused (client check mirrors the database); nothing stored.
  await trustedClick(hb, q("price-edit-sink"));
  await waitFor(() => exists(hb, q("price-publish")), 10000, 300);
  await trustedClick(hb, q("price-publish"));
  await sleep(1500);
  const refusedMsg = await text(hb, q("price-message"));
  expect("3g. Publishing incomplete terms is refused; nothing stored", /Complete these before publishing/.test(refusedMsg || "") && (await priceOf(h1, "sink")) === undefined, refusedMsg);

  // Cross-helper / customer / public writes (real Worker routes + PostgREST)
  const h1Price = await priceOf(h1, "toilet-simple");
  const crossStatus = await api("/api/helper/prices/status", { method: "POST", headers: h2.auth, body: { price_id: h1Price.id, status: "PAUSED" } });
  const crossPut = await putPrice(h2, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 1, materials_policy: "INCLUDED", helper_id: h1.helper.id }, true);
  const h2Own = await api("/api/helper/prices", { headers: h2.auth });
  const h1After = await priceOf(h1, "toilet-simple");
  expect("3h. Another Helper cannot edit H1's price (404 PRICE_NOT_FOUND; body helper_id ignored -> only H2's own row); H1 unchanged", crossStatus.status === 404 && crossStatus.body.code === "PRICE_NOT_FOUND" && crossPut.status === 200 && h2Own.body.prices?.length === 1 && h2Own.body.prices[0].id !== h1Price.id && h1After.status === "ACTIVE" && Number(h1After.base_price) === 60000 && h1After.revision === h1Price.revision, { crossStatus, crossPut: crossPut.body, h2: h2Own.body.prices?.map((p) => p.id) });
  const cust = await fx.customerDevice("WRITER");
  const publicWrites = [
    ["anon PUT", (await api("/api/helper/prices", { method: "PUT", body: { service_code: "clog-clearing", subitem_code: "toilet-simple", terms: { pricing_mode: "FIXED", base_price: 1 }, publish: true } })).status],
    ["customer PUT", (await api("/api/helper/prices", { method: "PUT", headers: { Cookie: cust.cookie }, body: { service_code: "clog-clearing", subitem_code: "toilet-simple", terms: { pricing_mode: "FIXED", base_price: 1 }, publish: true } })).status],
    ["customer status", (await api("/api/helper/prices/status", { method: "POST", headers: { Cookie: cust.cookie }, body: { price_id: h1Price.id, status: "PAUSED" } })).status],
    ["anon-key bearer PUT", (await api("/api/helper/prices", { method: "PUT", headers: { Authorization: `Bearer ${anonKey}` }, body: { service_code: "clog-clearing", subitem_code: "toilet-simple", terms: { pricing_mode: "FIXED", base_price: 1 }, publish: true } })).status],
    ["customer GET", (await api("/api/helper/prices", { headers: { Cookie: cust.cookie } })).status],
    ["PostgREST anon PATCH", (await fetch(`${supabaseUrl}/rest/v1/helper_service_prices?id=eq.${h1Price.id}`, { method: "PATCH", headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ base_price: 1 }) })).status],
  ];
  const h1Still = await priceOf(h1, "toilet-simple");
  expect("3i. Customer / public cannot read or write Helper pricing (401/403); H1 unchanged", publicWrites.every(([, s]) => s === 401 || s === 403) && Number(h1Still.base_price) === 60000 && h1Still.revision === h1Price.revision, publicWrites);

  // ================= 4. customer offer discovery before any request =================
  const h2Pub = await putPrice(h2, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 75000, materials_policy: "INCLUDED" }, true);
  const discovery = await offersApi("toilet-simple");
  const offers = discovery.body.offers || [];
  const raw = JSON.stringify(discovery.body);
  const secrets = [h1.helper.id, h2.helper.id, h1.helper.auth_user_id, h2.helper.auth_user_id, h1.email, h2.email, h1.helper.helper_id, h2.helper.helper_id, h1Price.id, "PUSH TEST", h1.token];
  const keys = [...new Set(offers.flatMap((o) => Object.keys(o)))].sort();
  expect("4a. Offers API: both Helpers, different prices (60,000 / 75,000), before any request exists", h2Pub.status === 200 && discovery.status === 200 && offers.length === 2 && offers.map((o) => Number(o.base_price)).sort().join() === "60000,75000", offers.map((o) => [o.helperAlias, o.base_price]));
  expect("4b. Only safe public data: no internal UUID, auth_user_id, email, public helper id, name, phone, bank / payout, price id or token", !secrets.some((s) => s && raw.includes(s)) && !keys.some((k) => /helper_?id|auth|email|phone|bank|payout|account|name|price_?id/i.test(k)), keys);
  const h1Offer = offers.find((o) => Number(o.base_price) === 60000);

  const cb = await launchChrome({ headed });
  browsers.push(cb);
  // The page's own POST /api/checkouts carries the operator header (DevTools interception, not page
  // script) -> the checkout the real UI creates is a purgeable staging test fixture.
  await markBrowserCheckoutsAsTestFixtures(cb, settlementToken);
  await cb.cdp("Page.addScriptToEvaluateOnNewDocument", { source: "(() => { window.__co = []; const f = window.fetch.bind(window); window.fetch = async (input, init) => { const url = typeof input === 'string' ? input : input.url; const res = await f(input, init); if (/\\/api\\/checkouts(\\/[0-9a-f-]{36}\\/payment)?$/.test(url) && init && init.method === 'POST') { let body = null; try { body = await res.clone().json(); } catch {} window.__co.push({ url, sent: init.body || null, status: res.status, body }); } return res; }; })();" }, cb.sessionId);
  await cb.navigate(`${base}/`);
  await waitFor(() => cb.evaluate("document.readyState === 'complete'"), 20000, 300);
  await seed(cb, { life_help_locale: "en", life_help_selected_region: REGION, life_help_selected_region_KR: REGION });
  await cb.navigate(`${base}/request?service=clog-clearing`);
  const V = await deviceIdentity(cb);
  await waitFor(() => exists(cb, q("price-subitem-toilet-simple")), 30000, 500);
  const form1 = await fillRequestForm(cb, `${runId} browser request 1`);
  await trustedClick(cb, q("price-subitem-toilet-simple"));
  const cards = await waitFor(async () => { const n = await cb.evaluate(`document.querySelectorAll('${q("price-offer-card")}').length`); return n === 2 ? n : null; }, 20000, 500);
  const cardText = await cb.evaluate(`[...document.querySelectorAll('${q("price-offer-card")}')].map((c) => c.innerText).join(" | ")`);
  const beforeRequests = V ? await db(`service_requests?customer_id=eq.${V.referral_id}&select=id`) : [1];
  expect("4c. Customer browser (region + service + detailed service): both offers shown BEFORE any request", cards === 2 && /60,000/.test(cardText) && /75,000/.test(cardText) && beforeRequests.length === 0, { cardText, beforeRequests: beforeRequests.length });

  // ================= 5. customer explicitly selects H1 -> prepaid checkout -> payment -> activation =================
  await cb.evaluate(`(() => { const card = [...document.querySelectorAll('${q("price-offer-card")}')].find((c) => c.innerText.includes("60,000")); card.querySelector('${q("price-offer-select")}').setAttribute("data-e2e", "pick-h1"); return true; })()`);
  await trustedClick(cb, '[data-e2e="pick-h1"]');
  await waitFor(() => exists(cb, q("price-offer-confirm")), 10000, 300);
  const confirmText = await text(cb, q("price-offer-confirm"));
  const P = en.pricing;
  const mustShow = [P.confirmTitle, en.serviceSubitems["clog-clearing"]["toilet-simple"], h1Offer.helperAlias, P.mode.FIXED, "₩60,000", `${P.minimumCharge}: ₩50,000`, P.includedMinutes.replace("{minutes}", "60"), `${P.extraHour}: ₩20,000`, P.materials.PARTIALLY_INCLUDED, `${runId} basic parts`, `${P.surchargeNight}: ×1.3`, `${P.surchargeWeekend}: ×1.2`, `${P.surchargeEmergency}: ×1.5`, P.taxIncluded, `${P.initialAmount}: ₩60,000`, P.approvalNotice];
  const missing = mustShow.filter((s) => !confirmText?.includes(s));
  expect("5a. Confirmation before submit shows detailed service, alias, mode, currency + price, minimum, included time, extra rate, materials rule, surcharges, agreed amount", missing.length === 0, { missing, confirmText });
  await trustedClick(cb, q("price-offer-submit"));
  const sent = await waitFor(() => cb.evaluate("window.__co.find((c) => c.url.endsWith('/api/checkouts')) || null"), 20000, 500);
  const sentKeys = sent?.sent ? Object.keys(JSON.parse(sent.sent)).sort() : [];
  const co1Id = sent?.body?.checkoutId;
  const co1 = co1Id ? (await db(`service_checkouts?id=eq.${co1Id}&select=*`))[0] : null;
  expect("5b. Browser starts a prepaid CHECKOUT (201) sending only the form + mode + opaque offer_token (no helper / amount / currency / price terms)", sent?.status === 201 && sentKeys.includes("offer_token") && sentKeys.includes("mode") && !sentKeys.some((k) => /helper|amount|price|currency|material|minimum|extra|multiplier/.test(k)), { status: sent?.status, sentKeys, body: sent?.body, form1 });
  expect("5c. Checkout = authoritative server terms: H1, current revision, 60,000 KRW, owner = this device; purgeable test fixture; H1 reserved", co1?.status === "OPEN" && co1.request_mode === "HELPER_PRICE_SELECTED" && co1.helper_id === h1.helper.id && co1.helper_price_id === h1Price.id && co1.helper_price_revision === h1Price.revision && Number(co1.fiat_amount) === 60000 && co1.fiat_currency === "KRW" && co1.customer_id === V?.referral_id && co1.test_fixture === true && (await db(`helper_checkout_reservations?checkout_id=eq.${co1Id}&status=eq.ACTIVE&helper_id=eq.${h1.helper.id}&select=id`)).length === 1, co1);
  const panelAmount = await waitFor(() => text(cb, q("checkout-amount")), 15000, 500);
  const noRequestYet = V ? await db(`service_requests?customer_id=eq.${V.referral_id}&select=id`) : [1];
  const noSelectionYet = await db(`request_price_selections?helper_id=eq.${h1.helper.id}&select=id`);
  expect("5d. Checkout panel shows the server amount (60,000); NOTHING is a request yet: no request, no selection, no assignment before payment", /60,000/.test(panelAmount || "") && noRequestYet.length === 0 && noSelectionYet.length === 0 && (await active(h1)).length === 0, { panelAmount, requests: noRequestYet.length, selections: noSelectionYet.length });
  await trustedClick(cb, q("checkout-pay"));
  const payCall = await waitFor(() => cb.evaluate("window.__co.find((c) => c.url.endsWith('/payment')) || null"), 20000, 500);
  const usdc = await waitFor(() => text(cb, q("checkout-usdc")), 15000, 500);
  const intent1 = payCall?.body?.intentId ? (await db(`payment_intents?id=eq.${payCall.body.intentId}&select=id,status,network,fiat_amount,fiat_currency,checkout_id`))[0] : null;
  expect("5e. Payment UI reached: server-side USDC intent (devnet) for exactly 60,000 KRW; browser sent no amount", payCall?.status === 201 && payCall.sent === null && /USDC/.test(usdc || "") && intent1?.status === "AWAITING_PAYMENT" && intent1.network === "solana-devnet" && Number(intent1.fiat_amount) === 60000 && intent1.checkout_id === co1Id, { pay: payCall?.status, usdc, intent1 });
  // Test activation: FIXTURE payment observation on the intent the product created (no chain funds).
  const act1 = intent1 ? await fixtureObserveIntent(intent1.id) : null;
  const r1 = act1?.activation?.request_id ? (await db(`service_requests?id=eq.${act1.activation.request_id}&select=id,status,selection_mode,service_slug,customer_id,description,funding_payment_intent_id`))[0] : null;
  track(r1?.id);
  const snap1 = r1 ? (await db(`request_price_selections?request_id=eq.${r1.id}&selection_version=eq.1&select=*`))[0] : null;
  const asg1 = r1 ? await db(`request_assignments?request_id=eq.${r1.id}&select=id,helper_id,status`) : [];
  const conv1 = r1 ? await db(`conversations?request_id=eq.${r1.id}&select=id`) : [];
  expect("5f. Fixture-activated (PAID_HELD): request MATCHED / CUSTOMER_SELECTED (owner = this device, funded by this intent) + one PENDING assignment to H1 + one conversation", act1?.status === "PAID_HELD" && r1?.status === "MATCHED" && r1.selection_mode === "CUSTOMER_SELECTED" && r1.customer_id === V.referral_id && r1.service_slug === "clog-clearing" && r1.funding_payment_intent_id === intent1.id && asg1.length === 1 && asg1[0].helper_id === h1.helper.id && asg1[0].status === "PENDING" && conv1.length === 1, { act1: act1?.status, r1, asg1, conv1: conv1.length });
  expect("5g. Selection v1 (authority only after activation) = H1's ACTIVE offer re-read by the server (60,000 KRW FIXED, all terms, revision)", snap1?.helper_id === h1.helper.id && snap1.pricing_mode === "FIXED" && snap1.currency === "KRW" && Number(snap1.base_price) === 60000 && Number(snap1.minimum_charge) === 50000 && snap1.included_minutes === 60 && Number(snap1.extra_hour_price) === 20000 && snap1.materials_policy === "PARTIALLY_INCLUDED" && snap1.materials_note === `${runId} basic parts` && Number(snap1.night_multiplier) === 1.3 && Number(snap1.weekend_multiplier) === 1.2 && Number(snap1.emergency_multiplier) === 1.5 && Number(snap1.initial_payable_amount) === 60000 && snap1.source_price_revision === h1Price.revision, snap1);
  const chainRows = intent1 ? await db(`payment_chain_transactions?payment_intent_id=eq.${intent1.id}&select=signature`) : [];
  expect("5h. Test activation is distinguishable from a real chain payment: test_fixture checkout, FIXTURE...NOTACHAINTX signature", co1?.test_fixture === true && chainRows.length >= 1 && chainRows.every((c) => /^FIXTURE.*NOTACHAINTX$/.test(c.signature)), chainRows);
  // The activation push is dispatched by the Worker's chain-verify route (/api/payments/{id}/verify) after a
  // REAL payment; a fixture activation deliberately bypasses the chain, so no push is expected here.
  notTestable("5i. Web Push to H1 on activation", "sent by the chain-verify route after a real payment; fixture activation bypasses the chain (no Devnet funds in this suite)");

  // ================= 6. immutable commercial snapshot =================
  const to80 = await putPrice(h1, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 80000, minimum_charge: 50000, included_minutes: 60, extra_hour_price: 20000, materials_policy: "PARTIALLY_INCLUDED", materials_note: `${runId} basic parts`, night_multiplier: 1.3, weekend_multiplier: 1.2, emergency_multiplier: 1.5 }, true);
  const h1Catalog = await api("/api/helper/prices", { headers: h1.auth });
  const snapAfter = (await db(`request_price_selections?request_id=eq.${r1.id}&selection_version=eq.1&select=base_price,initial_payable_amount,source_price_revision`))[0];
  const co1After = (await db(`service_checkouts?id=eq.${co1Id}&select=fiat_amount,helper_price_revision`))[0];
  expect("6a. H1 60,000 -> 80,000: H1's current catalog shows 80,000; the funded request's selection AND the checkout's commercial terms stay 60,000", to80.status === 200 && Number(h1Catalog.body.prices?.find((p) => p.id === h1Price.id)?.base_price) === 80000 && Number(snapAfter.base_price) === 60000 && Number(snapAfter.initial_payable_amount) === 60000 && snapAfter.source_price_revision === h1Price.revision && Number(co1After.fiat_amount) === 60000 && co1After.helper_price_revision === h1Price.revision, { to80: to80.body, snapAfter, co1After });
  const rest = (headers, method, body, table = "request_price_selections", filter = `request_id=eq.${r1.id}`) => fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, { method, headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => [r.status, (await readResponse(r))?.code]);
  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, anon = { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, helperJwt = { apikey: anonKey, Authorization: `Bearer ${h1.token}` };
  const attempts = {
    serviceRolePatch: await rest(svc, "PATCH", { base_price: 1 }), serviceRoleDelete: await rest(svc, "DELETE"),
    anonPatch: await rest(anon, "PATCH", { base_price: 1 }), anonDelete: await rest(anon, "DELETE"),
    helperPatch: await rest(helperJwt, "PATCH", { base_price: 1 }), helperDelete: await rest(helperJwt, "DELETE"),
    checkoutAmountPatch: await rest(svc, "PATCH", { fiat_amount: 1 }, "service_checkouts", `id=eq.${co1Id}`),
  };
  const snapStill = (await db(`request_price_selections?request_id=eq.${r1.id}&selection_version=eq.1&select=base_price`))[0];
  expect("6b. Selection and checkout commercial terms immutable on every non-authorized path (service_role, anon, Helper JWT)", Object.values(attempts).every(([s, c]) => s === 401 || s === 403 || c === "42501" || c === "P0001") && Number(snapStill?.base_price) === 60000 && Number((await db(`service_checkouts?id=eq.${co1Id}&select=fiat_amount`))[0].fiat_amount) === 60000, attempts);

  // ================= 11. selected H1 declines the funded request =================
  const h2PushesBefore = autopush.received(h2Ch).length;
  const decline = await api(`/api/helper/assignments/${asg1[0].id}/decline`, { method: "POST", headers: h1.auth });
  await sleep(3000);
  const rowsAfter = await db(`request_assignments?request_id=eq.${r1.id}&select=helper_id,status`);
  const reqAfter = (await db(`service_requests?id=eq.${r1.id}&select=status,selection_mode`))[0];
  const snapDecl = (await db(`request_price_selections?request_id=eq.${r1.id}&selection_version=eq.1&select=helper_id,base_price`))[0];
  expect("11a. H1 DECLINES the funded request: route returns CUSTOMER_RESELECTION_REQUIRED; H1 assignment DECLINED", decline.status === 200 && decline.body.matching?.code === "CUSTOMER_RESELECTION_REQUIRED" && rowsAfter.length === 1 && rowsAfter[0].status === "DECLINED", { decline: decline.body, rowsAfter });
  expect("11b. NO automatic match to free H2, NO new assignment, NO price substitution (selection still H1 / 60,000)", (await active(h2)).length === 0 && rowsAfter.every((r) => r.helper_id === h1.helper.id) && snapDecl.helper_id === h1.helper.id && Number(snapDecl.base_price) === 60000, { h2Active: (await active(h2)).length, snapDecl });
  await sleep(10000);
  expect("11c. H2 receives no assignment push", autopush.received(h2Ch).length === h2PushesBefore, autopush.received(h2Ch));
  expect("11d. The funded request waits for the customer: CUSTOMER_RESELECTION_REQUIRED (not SEARCHING)", reqAfter?.status === "CUSTOMER_RESELECTION_REQUIRED" && reqAfter.selection_mode === "CUSTOMER_SELECTED", reqAfter);

  // ================= 7. stale offer in the browser (checkout) =================
  const checkoutsOfV = async () => db(`service_checkouts?customer_id=eq.${V.referral_id}&select=id,status,fiat_amount`);
  await cb.navigate(`${base}/request?service=clog-clearing`);
  await waitFor(() => exists(cb, q("price-subitem-toilet-simple")), 30000, 500);
  await fillRequestForm(cb, `${runId} browser request 2`);
  await trustedClick(cb, q("price-subitem-toilet-simple"));
  await waitFor(async () => ((await cb.evaluate(`document.querySelectorAll('${q("price-offer-card")}').length`)) === 2 ? true : null), 20000, 500);
  await cb.evaluate(`(() => { const card = [...document.querySelectorAll('${q("price-offer-card")}')].find((c) => c.innerText.includes("80,000")); card.querySelector('${q("price-offer-select")}').setAttribute("data-e2e", "pick-h1-v1"); return true; })()`);
  await trustedClick(cb, '[data-e2e="pick-h1-v1"]');
  await waitFor(() => exists(cb, q("price-offer-confirm")), 10000, 300);
  const v1Confirm = await text(cb, q("price-offer-confirm"));
  const to85 = await putPrice(h1, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 85000, minimum_charge: 50000, included_minutes: 60, extra_hour_price: 20000, materials_policy: "PARTIALLY_INCLUDED", materials_note: `${runId} basic parts`, night_multiplier: 1.3, weekend_multiplier: 1.2, emergency_multiplier: 1.5 }, true);
  await trustedClick(cb, q("price-offer-submit"));
  const staleResp = await waitFor(() => cb.evaluate("window.__co.filter((c) => c.url.endsWith('/api/checkouts')).pop() || null"), 20000, 500);
  const notice = await waitFor(() => text(cb, q("price-offer-notice")), 15000, 500);
  const refreshed = await waitFor(async () => { const t = await cb.evaluate(`[...document.querySelectorAll('${q("price-offer-card")}')].map((c) => c.innerText).join(" | ")`); return /85,000/.test(t) ? t : null; }, 20000, 500);
  expect("7a. Old offer token after H1's price change -> checkout 409 PRICE_CHANGED", /80,000/.test(v1Confirm || "") && to85.status === 200 && staleResp?.status === 409 && staleResp.body?.code === "PRICE_CHANGED", { staleResp, to85: to85.status });
  expect("7b. Nothing created (no new checkout, no new request, no reservation), no silent price change", (await checkoutsOfV()).length === 1 && (await db(`service_requests?customer_id=eq.${V.referral_id}&select=id`)).length === 1 && (await active(h1)).length === 0 && (await db(`helper_checkout_reservations?customer_id=eq.${V.referral_id}&status=eq.ACTIVE&select=id`)).length === 0);
  expect("7c. Customer sees the price-changed notice and the refreshed offer list (85,000) and must reconfirm", notice === P.priceChanged && !!refreshed && !(await exists(cb, q("price-offer-confirm"))), { notice, refreshed });
  await cb.evaluate(`(() => { const card = [...document.querySelectorAll('${q("price-offer-card")}')].find((c) => c.innerText.includes("85,000")); card.querySelector('${q("price-offer-select")}').setAttribute("data-e2e", "pick-h1-v2"); return true; })()`);
  await trustedClick(cb, '[data-e2e="pick-h1-v2"]');
  await waitFor(() => exists(cb, q("price-offer-confirm")), 10000, 300);
  const v2Confirm = await text(cb, q("price-offer-confirm"));
  await trustedClick(cb, q("price-offer-submit"));
  const co2Call = await waitFor(() => cb.evaluate("window.__co.filter((c) => c.url.endsWith('/api/checkouts') && c.status === 201).pop() || null"), 20000, 500);
  const co2Id = co2Call?.body?.checkoutId ?? null;
  await waitFor(() => exists(cb, q("checkout-pay")), 15000, 500);
  await trustedClick(cb, q("checkout-pay"));
  const pay2 = co2Id ? await waitFor(() => cb.evaluate(`window.__co.find((c) => c.url.endsWith('/api/checkouts/${co2Id}/payment')) || null`), 20000, 500) : null;
  const act2 = pay2?.body?.intentId ? await fixtureObserveIntent(pay2.body.intentId) : null;
  const r2 = act2?.activation?.request_id ? (await db(`service_requests?id=eq.${act2.activation.request_id}&select=id,status`))[0] : null;
  track(r2?.id);
  const snap2 = r2 ? (await db(`request_price_selections?request_id=eq.${r2.id}&selection_version=eq.1&select=helper_id,base_price`))[0] : null;
  expect("7d. Reconfirmed at the new price -> checkout 85,000 -> payment -> activation: new request with its own selection (85,000); first request still 60,000", /85,000/.test(v2Confirm || "") && Number(co2Call?.body?.fiatAmount) === 85000 && act2?.status === "PAID_HELD" && r2?.status === "MATCHED" && snap2?.helper_id === h1.helper.id && Number(snap2.base_price) === 85000 && Number((await db(`request_price_selections?request_id=eq.${r1.id}&selection_version=eq.1&select=base_price`))[0].base_price) === 60000, { co2: co2Call?.body, act2: act2?.status, r2, snap2 });

  // ================= 8. concurrent checkout race for one free Helper =================
  const x = await fx.createHelper("X", { service: "clog-clearing", rating: 5 });
  const xPut = await putPrice(x, "sink", { pricing_mode: "FIXED", currency: "KRW", base_price: 50000, materials_policy: "INCLUDED" }, true);
  const [c2, c3] = [await fx.customerDevice("RACE1"), await fx.customerDevice("RACE2")];
  const [o2, o3] = [(await offersApi("sink")).body.offers || [], (await offersApi("sink")).body.offers || []];
  expect("8a. Both customers see the same free Helper X (one sink offer each)", xPut.status === 200 && o2.length === 1 && o3.length === 1 && o2[0].helperAlias === o3[0].helperAlias, { o2: o2.length, o3: o3.length });
  const race = await Promise.all([checkoutApi(c2, o2[0]?.offerToken, {}, "race-1"), checkoutApi(c3, o3[0]?.offerToken, {}, "race-2")]);
  const winners = race.filter((r) => r.status === 201), losers = race.filter((r) => r.status !== 201);
  const [winnerDevice, loserDevice] = race[0].status === 201 ? [c2, c3] : [c3, c2];
  const xReserved = await db(`helper_checkout_reservations?helper_id=eq.${x.helper.id}&status=eq.ACTIVE&select=checkout_id`);
  expect("8b. True concurrent checkout race: exactly ONE winner holds Helper X's reservation", winners.length === 1 && xReserved.length === 1 && xReserved[0].checkout_id === winners[0]?.body.checkoutId, race.map((r) => [r.status, r.body.code]));
  expect("8c. Loser gets 409 HELPER_NO_LONGER_AVAILABLE; loser has no checkout, no reservation, no request", losers.length === 1 && losers[0].status === 409 && losers[0].body.code === "HELPER_NO_LONGER_AVAILABLE" && (await db(`service_checkouts?customer_id=eq.${loserDevice.publicId}&select=id`)).length === 0 && (await db(`service_requests?customer_id=eq.${loserDevice.publicId}&select=id`)).length === 0, losers.map((r) => r.body));
  const cancelWin = await api(`/api/checkouts/${winners[0]?.body.checkoutId}/cancel`, { method: "POST", headers: { Cookie: winnerDevice.cookie } });
  expect("8d. The unpaid winner abandons via the product cancel route: CANCELLED, reservation released (no request, nothing left OPEN)", cancelWin.status === 200 && (await db(`service_checkouts?id=eq.${winners[0]?.body.checkoutId}&select=status`))[0]?.status === "CANCELLED" && (await db(`helper_checkout_reservations?helper_id=eq.${x.helper.id}&status=eq.ACTIVE&select=id`)).length === 0, cancelWin.body);

  // ================= 9. price tampering against the checkout =================
  const t = await fx.createHelper("T", { service: "clog-clearing", rating: 5 });
  await putPrice(t, "floor-drain", { pricing_mode: "FIXED", currency: "KRW", base_price: 45000, materials_policy: "EXCLUDED" }, true);
  const ct = await fx.customerDevice("TAMPER");
  const other = await fx.customerDevice("OTHER");
  const tOffer = ((await offersApi("floor-drain")).body.offers || [])[0];
  const tamper = { helper_id: h2.helper.id, helperId: h2.helper.id, helper_public_id: h2.helper.helper_id, amount: 1, price: 1, fiat_amount: 1, fiatAmount: 1, initial_payable_amount: 1, base_price: 1, currency: "USD", fiat_currency: "USD", pricing_mode: "HOURLY", materials_policy: "INCLUDED", minimum_charge: 1, extra_hour_price: 1, extra_unit_price: 1, night_multiplier: 3, weekend_multiplier: 3, emergency_multiplier: 3, price_revision: 999, service_slug: "boiler", customer_id: other.publicId, test_fixture: false };
  const tampered = await checkoutApi(ct, tOffer?.offerToken, tamper, "tamper");
  const tCo = tampered.body.checkoutId ? (await db(`service_checkouts?id=eq.${tampered.body.checkoutId}&select=*`))[0] : null;
  expect("9a. Spoofed amount / currency / Helper / mode / terms / service / customer on the checkout are ignored: server terms T / 45,000 KRW / FIXED / EXCLUDED, owner = cookie", tampered.status === 201 && tampered.body.fiatAmount === 45000 && tampered.body.fiatCurrency === "KRW" && tCo?.helper_id === t.helper.id && Number(tCo.fiat_amount) === 45000 && tCo.fiat_currency === "KRW" && tCo.terms?.pricing_mode === "FIXED" && tCo.terms?.materials_policy === "EXCLUDED" && tCo.service_code === "clog-clearing" && tCo.customer_id === ct.publicId && tCo.test_fixture === true, { body: tampered.body, tCo });
  const tAct = await mf.fixtureFund(tampered.body.checkoutId, ct.publicId);
  track(tAct.requestId);
  const tSnap = tAct.requestId ? (await db(`request_price_selections?request_id=eq.${tAct.requestId}&selection_version=eq.1&select=*`))[0] : null;
  const tAsg = tAct.requestId ? await db(`request_assignments?request_id=eq.${tAct.requestId}&select=helper_id`) : [];
  expect("9b. After (fixture) payment the authoritative selection is the server's: T, 45,000 KRW FIXED EXCLUDED, no spoofed surcharge / minimum / extra", tAct.paid?.status === "PAID_HELD" && tSnap?.helper_id === t.helper.id && tAsg.length === 1 && tAsg[0].helper_id === t.helper.id && tSnap.currency === "KRW" && tSnap.pricing_mode === "FIXED" && Number(tSnap.base_price) === 45000 && tSnap.materials_policy === "EXCLUDED" && tSnap.minimum_charge === null && tSnap.extra_hour_price === null && tSnap.extra_unit_price === null && tSnap.night_multiplier === null && tSnap.weekend_multiplier === null && tSnap.emergency_multiplier === null && Number(tSnap.initial_payable_amount) === 45000, tSnap);
  const tokenChars = tOffer.offerToken.split("");
  tokenChars[30] = tokenChars[30] === "A" ? "B" : "A";
  const ctBefore = (await db(`service_checkouts?customer_id=eq.${ct.publicId}&select=id`)).length;
  const forged = [
    ["modified token", await checkoutApi(ct, tokenChars.join(""))],
    ["forged token", await checkoutApi(ct, Buffer.from(JSON.stringify({ priceId: h1Price.id, revision: 1 })).toString("base64url"))],
    ["no token", await checkoutApi(ct, undefined)],
    ["no owner cookie", await checkoutApi({ publicId: ct.publicId }, tOffer.offerToken)],
  ];
  expect("9c. Modified / forged / missing offer token and missing owner cookie rejected; no checkout created", forged.slice(0, 3).every(([, r]) => r.status === 400 && r.body.code === "OFFER_INVALID") && forged[3][1].status === 401 && (await db(`service_checkouts?customer_id=eq.${ct.publicId}&select=id`)).length === ctBefore, forged.map(([n, r]) => [n, r.status, r.body.code]));

  // ================= P. public unpaid creation paths stay closed =================
  const pubReq = await api("/api/requests", { method: "POST", headers: { Cookie: ct.cookie }, key: crypto.randomUUID(), body: fx.requestPayload(ct.publicId, "en", "bypass") });
  const pubSel = await api("/api/requests/selected", { method: "POST", headers: { Cookie: ct.cookie }, key: crypto.randomUUID(), body: { ...fx.requestPayload(ct.publicId, "en", "bypass-selected"), service_slug: "clog-clearing", offer_token: tOffer.offerToken } });
  expect("P. Public unpaid creation paths closed: POST /api/requests and /api/requests/selected -> 402 PREPAYMENT_REQUIRED", pubReq.status === 402 && pubReq.body.code === "PREPAYMENT_REQUIRED" && pubSel.status === 402 && pubSel.body.code === "PREPAYMENT_REQUIRED", [pubReq.status, pubSel.status]);

  // ================= 10. market data separation =================
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })).json();
  const marketTables = Object.keys(spec.definitions || {}).filter((n) => /market|benchmark|reference_price|price_research/i.test(n));
  const ours = [h1, h2, x, t].map((h) => h.helper.id);
  const foreign = await db(`helper_service_prices?helper_id=not.in.(${ours.join(",")})&select=id,helper_id`);
  const repoFiles = ["supabase/migrations/202609260012_helper_service_pricing.sql", "lib/pricing/pricingTerms.ts", "app/api/helper/prices/route.ts", "app/api/pricing/offers/route.ts"].map((f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8").replace(/^\s*--.*$/gm, "")).join("\n");
  // Staging also holds prices of Helpers retained as financial history (real-chain E2E) and of concurrent
  // suites: every foreign row must still belong to a real Helper account (no ownerless / imported rows).
  const foreignOwners = foreign.length ? await db(`helpers?id=in.(${[...new Set(foreign.map((r) => r.helper_id))].join(",")})&select=id,helper_id`) : [];
  expect("10. No market / benchmark data source feeds Helper prices: no such table, no import path in code; every other price row belongs to a real Helper account", marketTables.length === 0 && new Set(foreign.map((r) => r.helper_id)).size === foreignOwners.length && foreignOwners.every((h) => /^HLP-/.test(h.helper_id)) && !/market|benchmark/i.test(repoFiles.replace(/Market research data is NOT imported here\./, "")), { marketTables, foreign: foreign.length, owners: foreignOwners.map((h) => h.helper_id) });
  const helperPricesAll = await db(`helper_service_prices?helper_id=in.(${ours.join(",")})&select=helper_id,base_price`);
  expect("10b. Every stored Helper price is exactly what that Helper entered", helperPricesAll.length === 5 && helperPricesAll.some((p) => p.helper_id === h1.helper.id && Number(p.base_price) === 85000), helperPricesAll);
} catch (error) {
  record("FAIL", "E2E harness", String(error?.stack || error).slice(0, 700));
} finally {
  autopush.close();
  for (const b of browsers) if (b) await b.close();
  await sleep(500);
  // Every checkout of this run (browser and API) is a test fixture: purge them all (requests, intents,
  // quotes, reservations, media rows, money jobs); nothing of the run stays OPEN.
  for (const row of await db(`service_checkouts?description=like.${runId}*&select=id`).catch(() => [])) mf.checkouts.add(row.id);
  const out = await mf.cleanup();
  const leftovers = out.leftovers;
  const zero = "00000000-0000-0000-0000-000000000000";
  const helperIds = [...fx.created.helperIds, zero].join(",");
  leftovers.purgeRefused = out.purged.filter((ok) => !ok).length;
  leftovers.checkouts = (await db(`service_checkouts?description=like.${runId}*&select=id`)).length;
  leftovers.reservations = (await db(`helper_checkout_reservations?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.prices = (await db(`helper_service_prices?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.snapshots = (await db(`request_price_snapshots?helper_id=in.(${helperIds})&select=request_id`)).length;
  leftovers.selections = (await db(`request_price_selections?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.assignments = (await db(`request_assignments?helper_id=in.(${helperIds})&select=id`)).length;
  leftovers.authUsers = 0;
  for (const id of fx.created.authUserIds) { const r = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }); if (r.status === 200) leftovers.authUsers += 1; }
  leftovers.attributions = (await db(`referral_attributions?or=(referred_identity_id.in.(${[...fx.created.identityIds, zero].join(",")}),referrer_identity_id.in.(${[...fx.created.identityIds, zero].join(",")}))&select=id`)).length;
  leftovers.rewards = (await db(`referral_rewards?or=(referred_identity_id.in.(${[...fx.created.identityIds, zero].join(",")}),referrer_identity_id.in.(${[...fx.created.identityIds, zero].join(",")}))&select=id`)).length;
  leftovers.audit = (await db(`admin_audit_logs?entity_id=in.(${[...fx.created.requestIds, ...fx.created.helperIds, zero].join(",")})&select=id`)).length;
  expect("Fixture cleanup (all run checkouts purged - none OPEN; helpers, auth users, prices, reservations, requests, assignments, selections, push, notifications, identities, audit; no reward history created)", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

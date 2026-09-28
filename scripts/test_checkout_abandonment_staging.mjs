// Live STAGING regression for ABANDONED unpaid checkouts (the two orphans left by crashed browser runs on
// 2026-09-28): a Mode A checkout is created and the "browser" goes away before any payment intent -
// no cancel, no payment. Two shapes:
//   O1 orphan: the Helper fixture is removed afterwards (as the crashed suite's cleanup did), so the
//      reservation disappears with it (cascade); checkout OPEN, no intent, no reservation, no request.
//   O2 plain abandonment: Helper + reservation stay until their own expiry.
// Both carry private media. Nothing is backdated: the test waits for the real expiry + the sweep's
// 15 min grace (~26 min), then runs the NORMAL cron cleanup route. Expected: EXPIRED, no request /
// intent / active reservation, media DELETION_PENDING -> storage object removed -> DELETED.
// Checkouts are staging test fixtures (operator token) and are purged afterwards.
// Usage: node scripts/test_checkout_abandonment_staging.mjs
import { base, db, fixtures, recorder, rpc, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call } from "./lib/stagingMoneyFixtures.mjs";

const runId = `AB${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const BUCKET = "life-help-staging-request-media";
const operator = { Authorization: `Bearer ${settlementToken}` };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const checkouts = new Set(), objectKeys = new Set();
const api = async (pathname, { method = "GET", headers = {}, body, raw } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const type = r.headers.get("content-type") || "";
  return { status: r.status, body: type.startsWith("application/json") ? await r.json() : null };
};
const storageHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const objectExists = async (key) => (await fetch(`${supabaseUrl}/storage/v1/object/info/${BUCKET}/${key}`, { headers: storageHeaders })).status === 200;
const mediaRow = async (id) => (await db(`request_media?id=eq.${id}&select=*`))[0];
const runCleanup = () => api("/api/sys/cleanup/conversations", { method: "POST", headers: operator, body: { limit: 50 } });
const checkoutRow = async (id) => (await db(`service_checkouts?id=eq.${id}&select=id,status,request_id,expires_at,test_fixture`))[0];
const shape = async (id) => ({
  intents: (await db(`payment_intents?checkout_id=eq.${id}&select=id`)).length,
  activeReservations: (await db(`helper_checkout_reservations?checkout_id=eq.${id}&status=eq.ACTIVE&select=id`)).length,
  reservations: (await db(`helper_checkout_reservations?checkout_id=eq.${id}&select=id`)).length,
  request: (await checkoutRow(id))?.request_id ?? null,
});

async function abandoned(label, basePrice) {
  const h = await fx.createHelper(label, { service: "clog-clearing" });
  await call("upsert_helper_service_price", { p_helper_id: h.helper.id, p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: basePrice, materials_policy: "INCLUDED" }, p_publish: true });
  const device = await fx.customerDevice(label);
  const offers = await api(`/api/pricing/offers?service=clog-clearing&subitem=toilet-simple&country=KR&sido=${encodeURIComponent(fx.sido)}&gungu=G1`);
  const token = offers.body?.offers?.find((o) => Number(o.base_price) === basePrice)?.offerToken;
  const c = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: device.cookie }, body: { mode: "HELPER_PRICE_SELECTED", offer_token: token, ...fx.requestPayload(undefined, "en", label), service_slug: "clog-clearing" } });
  const checkoutId = c.body?.checkoutId;
  if (checkoutId) checkouts.add(checkoutId);
  const up = await api(`/api/checkouts/${checkoutId}/media`, { method: "POST", headers: { "Content-Type": "image/png", Cookie: device.cookie }, raw: PNG });
  const media = up.body?.mediaId ? await mediaRow(up.body.mediaId) : null;
  if (media) objectKeys.add(media.object_key);
  return { h, device, checkoutId, created: c, upload: up, media };
}

try {
  const o1 = await abandoned("O1", 61000);
  const o2 = await abandoned("O2", 62000);
  const row1 = await checkoutRow(o1.checkoutId), row2 = await checkoutRow(o2.checkoutId);
  expect("Fixtures: two Mode A checkouts (test fixtures) with private media, abandoned before any payment intent", o1.created.status === 201 && o2.created.status === 201 && row1?.test_fixture && row2?.test_fixture && o1.upload.status === 201 && o2.upload.status === 201 && (await objectExists(o1.media.object_key)) && (await objectExists(o2.media.object_key)), { o1: o1.created.status, o2: o2.created.status, up: [o1.upload.status, o2.upload.status] });
  // O1: the crashed suite's cleanup removed its Helper -> the reservation cascades away with it.
  for (const p of ["helper_services", "helper_regions"]) await db(`${p}?helper_id=eq.${o1.h.helper.id}`, "DELETE").catch(() => null);
  await db(`helper_service_prices?helper_id=eq.${o1.h.helper.id}`, "DELETE").catch(() => null);
  const helperGone = await db(`helpers?id=eq.${o1.h.helper.id}`, "DELETE").then(() => true).catch((e) => String(e.message));
  const s1 = await shape(o1.checkoutId);
  expect("O1 orphan shape reproduced: checkout OPEN, no payment intent, no reservation at all, no request", helperGone === true && (await checkoutRow(o1.checkoutId)).status === "OPEN" && s1.intents === 0 && s1.reservations === 0 && s1.request === null, { helperGone, s1 });

  const expires = Math.max(new Date(row1.expires_at).getTime(), new Date(row2.expires_at).getTime());
  record("INFO", `waiting ${Math.round((expires + 15 * 60e3 - Date.now()) / 60e3)} min for expiry + 15 min grace (real time; nothing is backdated)`);
  const early = await runCleanup();
  expect("Before expiry + grace: the sweep leaves both OPEN checkouts and their media alone", early.status === 200 && (await checkoutRow(o1.checkoutId)).status === "OPEN" && (await checkoutRow(o2.checkoutId)).status === "OPEN" && (await mediaRow(o1.media.id)).status === "ACTIVE" && (await mediaRow(o2.media.id)).status === "ACTIVE");
  await sleep(Math.max(0, expires + 15 * 60e3 + 30e3 - Date.now()));
  const sweep = await runCleanup();
  for (const [name, o] of [["O1", o1], ["O2", o2]]) {
    const row = await checkoutRow(o.checkoutId);
    const s = await shape(o.checkoutId);
    const m = await mediaRow(o.media.id);
    expect(`${name}: abandoned checkout -> EXPIRED by the normal cron cleanup; no request, no payment intent, no active reservation`, sweep.status === 200 && row.status === "EXPIRED" && s.request === null && s.intents === 0 && s.activeReservations === 0, { sweep: sweep.body?.checkouts, row, s });
    expect(`${name}: its media -> storage object removed -> DELETED (CHECKOUT_EXPIRED), via the single 015 deletion lifecycle`, m.status === "DELETED" && m.deletion_reason === "CHECKOUT_EXPIRED" && !(await objectExists(o.media.object_key)), { media: m?.status, reason: m?.deletion_reason });
  }
} catch (error) {
  record("FAIL", "checkout abandonment harness", String(error?.stack || error).slice(0, 600));
} finally {
  await fx.cleanup();
  const purged = [];
  for (const id of checkouts) purged.push((await rpc("purge_payment_fixture", { p_checkout_id: id })).data?.success === true);
  const remaining = [];
  for (const key of objectKeys) if (await objectExists(key)) remaining.push(key);
  if (remaining.length) await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { ...storageHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: remaining }) });
  const leftovers = await fx.cleanup();
  leftovers.checkouts = checkouts.size ? (await db(`service_checkouts?id=in.(${[...checkouts].join(",")})&select=id`)).length : 0;
  leftovers.media = checkouts.size ? (await db(`request_media?checkout_id=in.(${[...checkouts].join(",")})&select=id`)).length : 0;
  leftovers.storage = 0;
  for (const key of objectKeys) if (await objectExists(key)) leftovers.storage += 1;
  expect("Fixture cleanup (checkouts purged; helpers / devices removed; zero media rows / storage objects)", purged.every(Boolean) && Object.values(leftovers).every((n) => n === 0), { purged, remainingBeforeCleanup: remaining.length, leftovers });
}
if (summary().FAIL > 0) process.exit(1);

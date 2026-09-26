// Live STAGING checks of the prepaid marketplace through the deployed Worker that need NO on-chain funds:
//   P  public unpaid bypass closed (/api/requests, /api/requests/selected -> 402)
//   A  MODE A checkout (Helper price) via the real offer token; client amount / Helper ignored
//   B  MODE B checkout (customer offer); nothing visible to Helpers before payment; contact data refused
//   R  payment intent follows the rail policy (disabled -> PAYMENT_RAIL_DISABLED; enabled -> devnet only)
//   M  private media: upload owner-only, view matrix (owner / anon / other customer / Helpers / public ID),
//      every successful view logged, no public bucket URL, protected inline headers
// Checkouts are created with the staging operator token so they are purgeable test fixtures.
// Usage: node scripts/test_prepaid_nonchain_staging.mjs
import crypto from "node:crypto";
import { base, db, fixtures, readResponse, recorder, rpc, serviceKey, settlementToken, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const runId = `PN${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const BUCKET = "life-help-staging-request-media";
const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const operator = { Authorization: `Bearer ${settlementToken}` };
const checkouts = new Set();
const objectKeys = new Set();
const call = async (pathname, { method = "GET", headers = {}, body, raw } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const type = r.headers.get("content-type") || "";
  const payload = type.startsWith("application/json") ? await r.json() : new Uint8Array(await r.arrayBuffer());
  return { status: r.status, body: payload, headers: r.headers };
};
const checkout = async (device, body) => {
  const r = await call("/api/checkouts", { method: "POST", headers: { ...operator, ...(device ? { Cookie: device.cookie } : {}) }, body });
  if (r.body?.checkoutId) checkouts.add(r.body.checkoutId);
  return r;
};
// 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

try {
  const h1 = await fx.createHelper("H1", { service: "clog-clearing" });
  const h2 = await fx.createHelper("H2", { service: "clog-clearing" });
  const A = await fx.customerDevice("A"), B = await fx.customerDevice("B");
  const price = (await rpc("upsert_helper_service_price", { p_helper_id: h1.helper.id, p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }, p_publish: true })).data;
  expect("Fixtures: 2 Helpers, 2 customer devices, 1 published price", !!(h1 && h2 && A.cookie && B.cookie && price?.price_id), price);
  const form = (label) => ({ ...fx.requestPayload(undefined, "en", label), service_slug: "clog-clearing" });

  // ---------------- P. public bypass ----------------
  const p1 = await call("/api/requests", { method: "POST", headers: { Cookie: A.cookie, "Idempotency-Key": crypto.randomUUID() }, body: fx.requestPayload(A.publicId, "en", "bypass") });
  const p2 = await call("/api/requests/selected", { method: "POST", headers: { Cookie: A.cookie, "Idempotency-Key": crypto.randomUUID() }, body: { ...form("bypass-selected"), offer_token: "x" } });
  const p3 = await call("/api/requests", { method: "POST", headers: { Cookie: A.cookie, "Idempotency-Key": crypto.randomUUID(), Authorization: `Bearer ${A.publicId}` }, body: fx.requestPayload(A.publicId, "en", "bypass-ref") });
  const rowsA = await db(`service_requests?customer_id=eq.${A.publicId}&select=id`);
  expect("P1. unpaid POST /api/requests (owner cookie, and public ID as bearer) -> 402 PREPAYMENT_REQUIRED", p1.status === 402 && p1.body.code === "PREPAYMENT_REQUIRED" && p3.status === 402, [p1.status, p3.status]);
  expect("P2. unpaid POST /api/requests/selected -> 402 PREPAYMENT_REQUIRED", p2.status === 402 && p2.body.code === "PREPAYMENT_REQUIRED", [p2.status, p2.body.code]);
  expect("P3. no service request exists for the customer after the bypass attempts", rowsA.length === 0, rowsA.length);

  // ---------------- A. MODE A ----------------
  const offers = await call(`/api/pricing/offers?service=clog-clearing&subitem=toilet-simple&country=KR&sido=${encodeURIComponent(fx.sido)}&gungu=G1`);
  const offer = offers.body?.offers?.[0];
  expect("A1. public offer list exposes an opaque token, never helper_id / price_id", offers.status === 200 && offers.body.offers.length === 1 && !!offer?.offerToken && !JSON.stringify(offers.body).includes(h1.helper.id) && !JSON.stringify(offers.body).includes(price.price_id), offers.body?.offers?.length);
  const noCookie = await checkout(null, { mode: "HELPER_PRICE_SELECTED", offer_token: offer?.offerToken, ...form("mode-a") });
  expect("A2. checkout without the device-owner cookie -> 401", noCookie.status === 401, [noCookie.status, noCookie.body?.code]);
  const ca = await checkout(A, { mode: "HELPER_PRICE_SELECTED", offer_token: offer?.offerToken, ...form("mode-a"), fiat_amount: 1, amount: 1, currency: "USD", helper_id: h2.helper.id, customer_id: B.publicId });
  const caRow = ca.body?.checkoutId ? (await db(`service_checkouts?id=eq.${ca.body.checkoutId}&select=*`))[0] : null;
  const resv = ca.body?.checkoutId ? await db(`helper_checkout_reservations?checkout_id=eq.${ca.body.checkoutId}&select=helper_id,status`) : [];
  expect("A3. MODE A checkout 201: amount / currency from the Helper's price (60,000 KRW), spoofed amount / helper / customer ignored", ca.status === 201 && ca.body.mode === "HELPER_PRICE_SELECTED" && ca.body.fiatCurrency === "KRW" && ca.body.fiatAmount === 60000 && caRow?.customer_id === A.publicId && resv.length === 1 && resv[0].helper_id === h1.helper.id, { ca: ca.body, owner: caRow?.customer_id, resv });
  expect("A4. checkout is a purgeable staging test fixture; no service request before payment", caRow?.test_fixture === true && caRow?.request_id === null && (await db(`service_requests?customer_id=eq.${A.publicId}&select=id`)).length === 0, { fixture: caRow?.test_fixture, request: caRow?.request_id });
  const peekB = await call(`/api/checkouts/${ca.body?.checkoutId}`, { headers: { Cookie: B.cookie } });
  const peekA = await call(`/api/checkouts/${ca.body?.checkoutId}`, { headers: { Cookie: A.cookie } });
  expect("A5. checkout readable by its owner only (other customer -> 404)", peekA.status === 200 && peekB.status === 404, [peekA.status, peekB.status]);

  // ---------------- B. MODE B ----------------
  const offerBody = { pricing_mode: "FIXED", currency: "KRW", offered_amount: "70000", materials_policy: "INCLUDED", public_note: "front door code at arrival" };
  const cb = await checkout(B, { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: offerBody, ...form("mode-b") });
  const feed = await call("/api/helper/open-offers", { headers: h1.auth });
  expect("B1. MODE B checkout 201 at the customer's own amount (70,000 KRW)", cb.status === 201 && cb.body.mode === "CUSTOMER_OFFER_OPEN" && cb.body.fiatAmount === 70000, cb.body);
  expect("B2. unpaid customer offer invisible to the eligible Helper feed", feed.status === 200 && Array.isArray(feed.body.offers) && !JSON.stringify(feed.body).includes(runId), [feed.status, feed.body?.offers?.length]);
  const contact = await checkout(B, { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { ...offerBody, public_note: "call me +82 10 1234 5678" }, ...form("mode-b-contact") });
  expect("B3. contact details in an offer note refused", contact.status === 400 && contact.body.code === "CONTACT_DETAILS_NOT_ALLOWED", [contact.status, contact.body?.code]);

  // ---------------- R. payment rail ----------------
  const policies = await db("payment_rail_policies?select=country,network,enabled,capability");
  const devnetOn = policies.some((p) => p.enabled && p.network === "solana-devnet" && p.capability === "USDC_CUSTOMER_PAYMENT");
  const payB = await call(`/api/checkouts/${ca.body?.checkoutId}/payment`, { method: "POST", headers: { Cookie: B.cookie } });
  const payA = await call(`/api/checkouts/${ca.body?.checkoutId}/payment`, { method: "POST", headers: { Cookie: A.cookie } });
  expect("R1. other customer cannot open the payment for A's checkout", payB.status === 404 || payB.status === 403, [payB.status, payB.body?.code]);
  expect(`R2. payment intent follows the rail policy (${devnetOn ? "enabled -> devnet USDC to the staging recipient" : "disabled -> PAYMENT_RAIL_DISABLED"})`,
    devnetOn ? payA.status === 201 && payA.body.network === "solana-devnet" && payA.body.mint === DEVNET_USDC && payA.body.recipient === "D89fnNdAMFSnd4Jc8NvHcAkGQfvhWFkhY84K5qALQE4" && !/mainnet/.test(JSON.stringify(payA.body))
      : payA.body?.code === "PAYMENT_RAIL_DISABLED" && (await db(`payment_intents?checkout_id=eq.${ca.body?.checkoutId}&select=id`)).length === 0,
    { policies: policies.length, status: payA.status, code: payA.body?.code, network: payA.body?.network });

  // ---------------- M. private media ----------------
  const cid = ca.body?.checkoutId;
  const upAnon = await call(`/api/checkouts/${cid}/media`, { method: "POST", headers: { "Content-Type": "image/png" }, raw: PNG });
  const upB = await call(`/api/checkouts/${cid}/media`, { method: "POST", headers: { "Content-Type": "image/png", Cookie: B.cookie }, raw: PNG });
  const upHtml = await call(`/api/checkouts/${cid}/media`, { method: "POST", headers: { "Content-Type": "text/html", Cookie: A.cookie }, raw: "<script>1</script>" });
  const up = await call(`/api/checkouts/${cid}/media`, { method: "POST", headers: { "Content-Type": "image/png", Cookie: A.cookie }, raw: PNG });
  const mediaId = up.body?.mediaId;
  const mediaRow = mediaId ? (await db(`request_media?id=eq.${mediaId}&select=*`))[0] : null;
  if (mediaRow?.object_key) objectKeys.add(mediaRow.object_key);
  expect("M1. upload: owner 201; anonymous 401; other customer 404; non-media type 415", up.status === 201 && upAnon.status === 401 && upB.status === 404 && upHtml.status === 415, [up.status, upAnon.status, upB.status, upHtml.status]);
  expect("M2. stored in the private bucket under a server-generated key; key never returned to the client", mediaRow?.status === "ACTIVE" && mediaRow.storage_provider === "SUPABASE_STORAGE_PRIVATE" && mediaRow.object_key.startsWith(`requests/${cid}/`) && !JSON.stringify(up.body).includes(mediaRow.object_key), { status: mediaRow?.status, keys: Object.keys(up.body || {}) });
  const viewA = await call(`/api/media/${mediaId}`, { headers: { Cookie: A.cookie } });
  expect("M3. owner view 200: same bytes, inline, no-store, sandbox CSP, nosniff", viewA.status === 200 && Buffer.from(viewA.body).equals(PNG) && viewA.headers.get("content-disposition") === "inline" && /no-store/.test(viewA.headers.get("cache-control")) && /sandbox/.test(viewA.headers.get("content-security-policy")) && viewA.headers.get("x-content-type-options") === "nosniff", [viewA.status, viewA.headers.get("cache-control")]);
  const denied = {
    anonymous: (await call(`/api/media/${mediaId}`)).status,
    otherCustomer: (await call(`/api/media/${mediaId}`, { headers: { Cookie: B.cookie } })).status,
    reservedHelperBeforeAssignment: (await call(`/api/media/${mediaId}`, { headers: h1.auth })).status,
    unrelatedHelper: (await call(`/api/media/${mediaId}`, { headers: h2.auth })).status,
    publicIdBearer: (await call(`/api/media/${mediaId}`, { headers: { Authorization: `Bearer ${A.publicId}` } })).status,
    refQuery: (await call(`/api/media/${mediaId}?ref=${A.publicId}`)).status,
    checkoutIdAsBearer: (await call(`/api/media/${mediaId}`, { headers: { Authorization: `Bearer ${cid}` } })).status,
  };
  expect("M4. view denied (404) to anonymous, other customer, Helpers without an active assignment, public ID / ?ref= / checkout ID", Object.values(denied).every((s) => s === 404), denied);
  const views = await db(`request_media_views?media_id=eq.${mediaId}&select=viewer_kind,viewer_ref`);
  expect("M5. every successful view logged (exactly 1 CUSTOMER view by A; denied attempts not logged as views)", views.length === 1 && views[0].viewer_kind === "CUSTOMER" && views[0].viewer_ref === A.publicId, views);
  const pub = await fetch(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/${mediaRow?.object_key}`);
  const anonKeyRead = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${mediaRow?.object_key}`);
  const bucket = await (await fetch(`${supabaseUrl}/storage/v1/bucket/${BUCKET}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })).json();
  expect("M6. bucket is private: public URL and unauthenticated object read both refused", bucket.public === false && pub.status >= 400 && anonKeyRead.status >= 400, { public: bucket.public, pub: pub.status, direct: anonKeyRead.status });
  const list = await call(`/api/media?requestId=${cid}`, { headers: { Cookie: B.cookie } });
  expect("M7. media list for someone else's id -> nothing", list.status === 404 || (list.status === 200 && (list.body.media || []).length === 0), [list.status, list.body?.media?.length]);
} catch (error) {
  record("FAIL", "prepaid non-chain harness", String(error?.stack || error));
} finally {
  const purged = [];
  for (const id of checkouts) purged.push((await rpc("purge_payment_fixture", { p_checkout_id: id })).data?.success === true);
  let removed = 0;
  if (objectKeys.size) {
    const r = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [...objectKeys] }) });
    removed = r.ok ? (await r.json()).length : 0;
  }
  const leftovers = await fx.cleanup();
  const left = checkouts.size ? (await db(`service_checkouts?id=in.(${[...checkouts].join(",")})&select=id`)).length : 0;
  expect("Fixture cleanup (checkouts purged via the test-fixture RPC, storage objects removed, helpers / identities)", purged.every(Boolean) && left === 0 && removed === objectKeys.size && Object.values(leftovers).every((n) => n === 0), { purged, left, removed, objects: objectKeys.size, leftovers });
  if (summary().FAIL) process.exitCode = 1;
}

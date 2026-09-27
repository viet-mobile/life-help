// Live STAGING media lifecycle for checkouts that never become requests, through the DEPLOYED Worker
// (real private bucket, real cleanup route) - migration 015 + current HEAD.
//   C1 expired unpaid checkout (product path: the customer's new Helper choice expires the previous one)
//   C2 owner-cancelled unpaid checkout (POST /api/checkouts/{id}/cancel; wrong customer / public ID / ?ref= blocked)
//   C3 activated checkout: media survives checkout cleanup, follows the request (assigned-Helper access)
//      Activation uses a FABRICATED payment observation on a test_fixture checkout (DB fixture - NOT a
//      chain payment; purged afterwards).
//   M4 storage-deletion failure: stays queued (never falsely DELETED), retried, then DELETED
// Set SWEEP=1 to also run the natural-expiry sweep case (waits ~26 min).
// Usage: node scripts/test_checkout_media_lifecycle_staging.mjs
import { base, db, fixtures, recorder, rpc, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, DEVNET_USDC, fixtureSignature, STAGING_RECIPIENT, base58Of32 } from "./lib/stagingMoneyFixtures.mjs";

const runId = `MC${Date.now()}`;
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
const objectExists = async (key) => (await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${key}`, { headers: storageHeaders })).status === 200;
const mediaRow = async (id) => (await db(`request_media?id=eq.${id}&select=*`))[0];
const runCleanup = async () => api("/api/sys/cleanup/conversations", { method: "POST", headers: operator, body: { limit: 20 } });
const form = (label) => ({ ...fx.requestPayload(undefined, "en", label), service_slug: "clog-clearing" });
async function priced(label, basePrice) {
  const h = await fx.createHelper(label, { service: "clog-clearing" });
  const price = await call("upsert_helper_service_price", { p_helper_id: h.helper.id, p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: basePrice, materials_policy: "INCLUDED" }, p_publish: true });
  return { ...h, price, basePrice };
}
async function offerTokenFor(helper) {
  const r = await api(`/api/pricing/offers?service=clog-clearing&subitem=toilet-simple&country=KR&sido=${encodeURIComponent(fx.sido)}&gungu=G1`);
  return r.body?.offers?.find((o) => Number(o.base_price) === helper.basePrice)?.offerToken;
}
async function modeA(device, helper, label) {
  const r = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: device.cookie }, body: { mode: "HELPER_PRICE_SELECTED", offer_token: await offerTokenFor(helper), ...form(label) } });
  if (r.body?.checkoutId) checkouts.add(r.body.checkoutId);
  return r;
}
async function modeB(device, label) {
  const r = await api("/api/checkouts", { method: "POST", headers: { ...operator, Cookie: device.cookie }, body: { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "70000", materials_policy: "INCLUDED" }, ...form(label) } });
  if (r.body?.checkoutId) checkouts.add(r.body.checkoutId);
  return r;
}
async function upload(device, checkoutId) {
  const r = await api(`/api/checkouts/${checkoutId}/media`, { method: "POST", headers: { "Content-Type": "image/png", Cookie: device.cookie }, raw: PNG });
  const row = r.body?.mediaId ? await mediaRow(r.body.mediaId) : null;
  if (row) objectKeys.add(row.object_key);
  return { status: r.status, mediaId: r.body?.mediaId, row };
}

try {
  const [H1, H2, H3] = [await priced("H1", 60000), await priced("H2", 61000), await priced("H3", 62000)];
  const A = await fx.customerDevice("A"), B = await fx.customerDevice("B"), C = await fx.customerDevice("C");
  expect("Fixtures: 3 priced Helpers, 3 customer devices", !!(H1.price?.price_id && H2.price?.price_id && H3.price?.price_id && A.cookie && B.cookie && C.cookie));

  // ================= C1. expired unpaid checkout =================
  const c1 = await modeA(A, H1, "C1");
  const m1 = await upload(A, c1.body?.checkoutId);
  expect("C1. unpaid checkout + private media uploaded (owner view 200, object in the private bucket)", c1.status === 201 && m1.status === 201 && (await api(`/api/media/${m1.mediaId}`, { headers: { Cookie: A.cookie } })).status === 200 && await objectExists(m1.row.object_key), { c1: c1.status, m1: m1.status });
  const c3 = await modeA(A, H2, "C3"); // the customer's new Helper choice ends the previous unpaid checkout
  const c1Row = (await db(`service_checkouts?id=eq.${c1.body.checkoutId}&select=status,request_id`))[0];
  const m1q = await mediaRow(m1.mediaId);
  expect("C1. checkout reaches terminal unpaid EXPIRED (no request); M1 DELETION_PENDING (CHECKOUT_EXPIRED) atomically", c3.status === 201 && c1Row.status === "EXPIRED" && c1Row.request_id === null && m1q.status === "DELETION_PENDING" && m1q.deletion_reason === "CHECKOUT_EXPIRED", { c1Row, m1: m1q?.status });
  expect("C1. customer no longer gets the media (404); object still physically present until the cleanup run", (await api(`/api/media/${m1.mediaId}`, { headers: { Cookie: A.cookie } })).status === 404 && await objectExists(m1.row.object_key));

  // ================= C2. owner-cancelled unpaid checkout =================
  const c2 = await modeB(B, "C2");
  const m2 = await upload(B, c2.body?.checkoutId);
  const c2id = c2.body?.checkoutId;
  const wrong = await api(`/api/checkouts/${c2id}/cancel`, { method: "POST", headers: { Cookie: A.cookie } });
  const anon = await api(`/api/checkouts/${c2id}/cancel`, { method: "POST" });
  const publicId = await api(`/api/checkouts/${c2id}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${B.publicId}` } });
  const refQuery = await api(`/api/checkouts/${c2id}/cancel?ref=${B.publicId}`, { method: "POST" });
  expect("C2. cancel blocked for the wrong customer (404), no cookie (401), public ID as bearer (401), ?ref= (401); checkout untouched", wrong.status === 404 && anon.status === 401 && publicId.status === 401 && refQuery.status === 401 && (await db(`service_checkouts?id=eq.${c2id}&select=status`))[0].status === "OPEN", [wrong.status, anon.status, publicId.status, refQuery.status]);
  const cancel = await api(`/api/checkouts/${c2id}/cancel`, { method: "POST", headers: { Cookie: B.cookie } });
  const replay = await api(`/api/checkouts/${c2id}/cancel`, { method: "POST", headers: { Cookie: B.cookie } });
  const m2q = await mediaRow(m2.mediaId);
  expect("C2. owner cancel: CANCELLED (replay idempotent), no request created, M2 DELETION_PENDING (CHECKOUT_CANCELLED)", cancel.status === 200 && cancel.body.status === "CANCELLED" && replay.body?.replayed === true && (await db(`service_requests?customer_id=eq.${B.publicId}&select=id`)).length === 0 && m2q.status === "DELETION_PENDING" && m2q.deletion_reason === "CHECKOUT_CANCELLED", { cancel: cancel.body, m2: m2q?.status });
  const late = await upload(B, c2id);
  expect("C2. a cancelled checkout accepts no new media (and leaves no orphan object)", late.status === 409 && !late.mediaId, late.status);

  // ================= M4. deletion failure -> retry =================
  const c4 = await modeB(C, "M4");
  const m4 = await upload(C, c4.body?.checkoutId);
  await api(`/api/checkouts/${c4.body?.checkoutId}/cancel`, { method: "POST", headers: { Cookie: C.cookie } });
  // Controlled failure: storage cannot be made to fail safely from outside, so the failure is recorded
  // through the SAME RPC the Worker calls when a delete fails / is not verified (object left in place).
  const failure = await call("record_media_deletion_failure", { p_media_id: m4.mediaId, p_error_code: "STORAGE_DELETE_FAILED" });
  const m4f = await mediaRow(m4.mediaId);
  expect("M4. failed delete: object still present, media stays DELETION_PENDING (not DELETED), failure metadata recorded, retry in ~60 s", failure?.success && m4f.status === "DELETION_PENDING" && m4f.deletion_attempts === 1 && m4f.last_deletion_error === "STORAGE_DELETE_FAILED" && new Date(m4f.next_deletion_attempt_at) > new Date() && await objectExists(m4.row.object_key));

  // ================= C3. activated checkout media survives =================
  const m3 = await upload(A, c3.body?.checkoutId);
  const q = await call("create_payment_quote", { p_checkout_id: c3.body.checkoutId, p_customer_id: A.publicId, p_network: "solana-devnet", p_mint: DEVNET_USDC, p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: "fixture-no-chain", p_ttl_seconds: 600 });
  const i = await call("create_payment_intent", { p_quote_id: q.quote_id, p_customer_id: A.publicId, p_recipient: STAGING_RECIPIENT, p_reference: base58Of32() });
  const paid = await call("record_payment_observation", { p_intent_id: i.intent_id, p_network: "solana-devnet", p_signature: fixtureSignature(), p_slot: 1, p_mint: DEVNET_USDC, p_recipient: STAGING_RECIPIENT, p_amount_base_units: Number(i.amount_base_units), p_reference_matched: true, p_tx_success: true, p_confirmation: "finalized" });
  const req3 = paid?.activation?.request_id;
  if (req3) fx.created.requestIds.add(req3);
  const m3row = await mediaRow(m3.mediaId);
  expect("C3. (DB fixture activation, not a chain payment) request MATCHED with H2; M3 ACTIVE and attached to the request", paid?.status === "PAID_HELD" && (await db(`service_requests?id=eq.${req3}&select=status`))[0]?.status === "MATCHED" && m3row.status === "ACTIVE" && m3row.request_id === req3, paid);
  const cancelActivated = await api(`/api/checkouts/${c3.body.checkoutId}/cancel`, { method: "POST", headers: { Cookie: A.cookie } });
  expect("C3. an activated checkout cannot be cancelled away (409 CHECKOUT_NOT_OPEN)", cancelActivated.status === 409 && cancelActivated.body.code === "CHECKOUT_NOT_OPEN", cancelActivated);

  // ================= cleanup run 1 (deployed route) =================
  const run1 = await runCleanup();
  expect("Cleanup run (deployed): all subsystems ran without error (conversations, checkout expiry, media, money outbox)", run1.status === 200 && run1.body.success === true && run1.body.subsystemErrors?.length === 0 && run1.body.checkouts && run1.body.media && run1.body.transfers, { status: run1.status, errors: run1.body?.subsystemErrors });
  const m1d = await mediaRow(m1.mediaId), m2d = await mediaRow(m2.mediaId);
  expect("C1/C2. storage objects physically removed; only then rows DELETED", !(await objectExists(m1.row.object_key)) && !(await objectExists(m2.row.object_key)) && m1d.status === "DELETED" && m1d.deleted_at && m2d.status === "DELETED");
  expect("M4. during its backoff the failed item is not retried: still DELETION_PENDING, object still present", (await mediaRow(m4.mediaId)).status === "DELETION_PENDING" && await objectExists(m4.row.object_key));
  expect("C3. checkout cleanup never touches activated media (M3 ACTIVE, object present)", (await mediaRow(m3.mediaId)).status === "ACTIVE" && await objectExists(m3row.object_key));
  const [asg] = await db(`request_assignments?request_id=eq.${req3}&status=eq.PENDING&select=id,helper_id`);
  const views = {
    assignedHelper: (await api(`/api/media/${m3.mediaId}`, { headers: H2.auth })).status,
    otherHelper: (await api(`/api/media/${m3.mediaId}`, { headers: H1.auth })).status,
    owner: (await api(`/api/media/${m3.mediaId}`, { headers: { Cookie: A.cookie } })).status,
    otherCustomer: (await api(`/api/media/${m3.mediaId}`, { headers: { Cookie: B.cookie } })).status,
  };
  expect("C3. assigned-Helper rules unchanged: assigned Helper 200, other Helper 404, owner 200, other customer 404", asg?.helper_id === H2.helper.id && views.assignedHelper === 200 && views.otherHelper === 404 && views.owner === 200 && views.otherCustomer === 404, views);

  // ================= M4 retry after backoff =================
  const wait = new Date((await mediaRow(m4.mediaId)).next_deletion_attempt_at).getTime() - Date.now();
  if (wait > 0) await sleep(wait + 2000);
  const run2 = await runCleanup();
  const m4d = await mediaRow(m4.mediaId);
  expect("M4. next retry succeeds: object gone, then DELETED (checkout stays CANCELLED; no lifecycle rollback)", run2.status === 200 && !(await objectExists(m4.row.object_key)) && m4d.status === "DELETED" && (await db(`service_checkouts?id=eq.${c4.body.checkoutId}&select=status`))[0].status === "CANCELLED");

  // ================= optional: natural expiry sweep =================
  if (process.env.SWEEP === "1") {
    const c5 = await modeA(C, H3, "C5");
    const m5 = await upload(C, c5.body?.checkoutId);
    const expires = new Date((await db(`service_checkouts?id=eq.${c5.body.checkoutId}&select=expires_at`))[0].expires_at).getTime();
    record("INFO", `sweep case: waiting ${Math.round((expires + 15 * 60e3 - Date.now()) / 60e3)} min for expiry + 15 min grace`);
    const early = await runCleanup();
    expect("S1. before expiry + grace the sweep leaves the OPEN checkout and its media alone", early.status === 200 && (await db(`service_checkouts?id=eq.${c5.body.checkoutId}&select=status`))[0].status === "OPEN" && (await mediaRow(m5.mediaId)).status === "ACTIVE");
    await sleep(expires + 15 * 60e3 + 20e3 - Date.now());
    const sweep = await runCleanup();
    const m5d = await mediaRow(m5.mediaId);
    expect("S2. natural expiry: the cron sweep ends the checkout (EXPIRED) and deletes its media in the same run (object gone, then DELETED)", sweep.status === 200 && sweep.body.checkouts?.expired >= 1 && (await db(`service_checkouts?id=eq.${c5.body.checkoutId}&select=status`))[0].status === "EXPIRED" && m5d.status === "DELETED" && m5d.deletion_reason === "CHECKOUT_EXPIRED" && !(await objectExists(m5.row.object_key)), { sweep: sweep.body?.checkouts, m5: m5d?.status });
  }
} catch (error) {
  record("FAIL", "checkout media lifecycle harness", String(error?.stack || error).slice(0, 600));
} finally {
  await fx.cleanup();
  const purged = [];
  for (const id of checkouts) purged.push((await rpc("purge_payment_fixture", { p_checkout_id: id })).data?.success === true);
  let removed = 0;
  if (objectKeys.size) {
    const r = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { ...storageHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [...objectKeys] }) });
    removed = r.ok ? (await r.json()).length : 0;
  }
  const remaining = [];
  for (const key of objectKeys) if (await objectExists(key)) remaining.push(key);
  const leftovers = await fx.cleanup();
  leftovers.checkouts = checkouts.size ? (await db(`service_checkouts?id=in.(${[...checkouts].join(",")})&select=id`)).length : 0;
  leftovers.media = checkouts.size ? (await db(`request_media?checkout_id=in.(${[...checkouts].join(",")})&select=id`)).length : 0;
  expect("Fixture cleanup (checkouts / requests / media rows purged; zero storage objects left)", purged.every(Boolean) && remaining.length === 0 && Object.values(leftovers).every((n) => n === 0), { purged, removed, remaining: remaining.length, leftovers });
}
if (summary().FAIL > 0) process.exit(1);

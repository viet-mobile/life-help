// Live cron failure isolation on the DEPLOYED staging Worker: the scheduled maintenance route
// (the same code the 17 */6 * * * handler calls in-process) runs conversation cleanup, the unpaid-
// checkout sweep, media deletion and the money outbox in one run with:
//   - a refund money job that genuinely FAILS inside the run (fixture payment -> the devnet payer
//     lookup errors; read-only devnet RPC, nothing is signed or sent)
//   - a media item whose delete failed earlier (recorded, in backoff, object still present)
//   - a healthy queued media item
// Thrown-exception isolation per subsystem is proven deterministically (test_cron_isolation_app).
// Usage: node scripts/test_cron_isolation_staging.mjs
import { base, db, fixtures, recorder, rpc, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";
import { call, moneyFixtures } from "./lib/stagingMoneyFixtures.mjs";

const runId = `CI${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const mf = moneyFixtures(fx, runId);
const BUCKET = "life-help-staging-request-media";
const operator = { Authorization: `Bearer ${settlementToken}` };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const storageHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const objectExists = async (key) => (await fetch(`${supabaseUrl}/storage/v1/object/info/${BUCKET}/${key}`, { headers: storageHeaders })).status === 200;
const mediaRow = async (id) => (await db(`request_media?id=eq.${id}&select=*`))[0];
const apiCheckouts = new Set(), keys = new Set();
const runCleanup = async () => { const r = await fetch(`${base}/api/sys/cleanup/conversations`, { method: "POST", headers: { ...operator, "Content-Type": "application/json" }, body: JSON.stringify({ limit: 20 }) }); return { status: r.status, body: await r.json() }; };
async function queuedMedia(device, label) {
  const c = await (await fetch(`${base}/api/checkouts`, { method: "POST", headers: { ...operator, Cookie: device.cookie, "Content-Type": "application/json" }, body: JSON.stringify({ mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "70000", materials_policy: "INCLUDED" }, ...fx.requestPayload(undefined, "en", label), service_slug: "clog-clearing" }) })).json();
  if (c.checkoutId) apiCheckouts.add(c.checkoutId);
  const up = await (await fetch(`${base}/api/checkouts/${c.checkoutId}/media`, { method: "POST", headers: { "Content-Type": "image/png", Cookie: device.cookie }, body: PNG })).json();
  const row = await mediaRow(up.mediaId);
  keys.add(row.object_key);
  await fetch(`${base}/api/checkouts/${c.checkoutId}/cancel`, { method: "POST", headers: { Cookie: device.cookie } });
  return { checkoutId: c.checkoutId, mediaId: up.mediaId, key: row.object_key };
}

try {
  const D = await fx.customerDevice("D");
  const healthy = await queuedMedia(D, "healthy");
  const failing = await queuedMedia(D, "failing");
  await call("record_media_deletion_failure", { p_media_id: failing.mediaId, p_error_code: "STORAGE_DELETE_FAILED" });
  const refund = await mf.refundObligation("CRON");
  const [rj] = await mf.jobFor({ refundId: refund.refundId });
  expect("Setup: healthy item queued; failing item queued with a recorded failure (backoff, object present); refund job PENDING and due",
    (await mediaRow(healthy.mediaId)).status === "DELETION_PENDING" && (await mediaRow(failing.mediaId)).deletion_attempts === 1 && await objectExists(failing.key) && rj?.status === "PENDING");

  const run1 = await runCleanup();
  const jobAfter = (await db(`money_movement_jobs?id=eq.${rj.id}&select=status,failure_count,last_error_code,last_error_class,lease_token`))[0];
  const processed = run1.body.transfers?.processed ?? [];
  record("INFO", `run 1: status ${run1.status}; errors ${JSON.stringify(run1.body.subsystemErrors)}; conversations scanned ${run1.body.scanned}; checkouts ${JSON.stringify(run1.body.checkouts)}; media ${JSON.stringify(run1.body.media)}; refund job -> ${JSON.stringify(jobAfter)}`);
  expect("A. conversation cleanup ran in the same run (report present)", typeof run1.body.scanned === "number");
  expect("B. unpaid-checkout sweep ran in the same run", run1.body.checkouts?.success === true && typeof run1.body.checkouts.expired === "number");
  expect("C+D. the outbox processed the refund job, which FAILED inside the run (contained: RETRYABLE/REVIEW, lease released, refund not REFUNDED)", processed.some((o) => o.jobId === rj.id) && ["RETRYABLE", "REVIEW_REQUIRED"].includes(jobAfter.status) && jobAfter.lease_token === null && !!jobAfter.last_error_code
    && (await db(`service_refunds?id=eq.${refund.refundId}&select=status`))[0].status === "PENDING" && (await db(`payment_intents?id=eq.${refund.intentId}&select=status`))[0].status === "REFUND_PENDING", processed);
  expect("C. while the outbox job failed, media cleanup still ran: healthy item physically deleted, then DELETED", !(await objectExists(healthy.key)) && (await mediaRow(healthy.mediaId)).status === "DELETED");
  expect("C. the earlier-failed item stays queued (not falsely DELETED) during its backoff; object still present", (await mediaRow(failing.mediaId)).status === "DELETION_PENDING" && await objectExists(failing.key));
  expect("The run completes 200 with no subsystem error (job / item failures are contained at their own level)", run1.status === 200 && run1.body.success === true && run1.body.subsystemErrors.length === 0, run1.body.subsystemErrors);

  const wait = new Date((await mediaRow(failing.mediaId)).next_deletion_attempt_at).getTime() - Date.now();
  if (wait > 0) await sleep(wait + 2000);
  const failuresBefore = (await db(`money_movement_jobs?id=eq.${rj.id}&select=failure_count,status`))[0];
  const run2 = await runCleanup();
  expect("C. retry succeeds on the next run: failed item physically deleted, then DELETED", run2.status === 200 && !(await objectExists(failing.key)) && (await mediaRow(failing.mediaId)).status === "DELETED");
  const failuresAfter = (await db(`money_movement_jobs?id=eq.${rj.id}&select=failure_count,status`))[0];
  record("INFO", `refund job across run 2: ${JSON.stringify(failuresBefore)} -> ${JSON.stringify(failuresAfter)}`);
  expect("D. a failing money job never blocks media deletion; it is retried only on its own bounded schedule (never REFUNDED)", failuresAfter.failure_count <= failuresBefore.failure_count + 1 && (await db(`service_refunds?id=eq.${refund.refundId}&select=status`))[0].status === "PENDING");
} catch (error) {
  record("FAIL", "cron isolation harness", String(error?.stack || error).slice(0, 600));
} finally {
  const out = await mf.cleanup();
  const purged = [];
  for (const id of apiCheckouts) purged.push((await rpc("purge_payment_fixture", { p_checkout_id: id })).data?.success === true);
  const remaining = [];
  for (const key of keys) if (await objectExists(key)) remaining.push(key);
  if (remaining.length) await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { ...storageHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: remaining }) });
  const leftovers = await fx.cleanup();
  expect("Fixture cleanup (money fixtures purged, API checkouts purged, no storage object left)", out.purged.every(Boolean) && purged.every(Boolean) && remaining.length === 0 && Object.values(leftovers).every((n) => n === 0), { out: out.purged, purged, remaining: remaining.length, leftovers });
}
if (summary().FAIL > 0) process.exit(1);

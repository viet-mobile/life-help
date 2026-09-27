// REAL Solana DEVNET end-to-end on the DEPLOYED staging Worker (never mainnet, never real assets).
// The customer's payment is a real devnet USDC transfer signed locally with the devnet TEST customer
// key (file path from LIFE_HELP_DEVNET_CUSTOMER_KEY_FILE; never printed / committed). Everything else
// runs inside the deployed Worker through its configured devnet RPC: verification, activation, payouts,
// refunds, reconciliation, settlement. Real-chain rows are NOT test fixtures: they are never purged
// (financial history), and are tagged with the run id.
// Usage: PHASE=A LIFE_HELP_DEVNET_CUSTOMER_KEY_FILE=... node scripts/test_real_devnet_e2e_staging.mjs
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { base, db, fixtures, recorder, rpc as dbRpc, serviceKey, settlementToken, sleep, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const root = new URL("..", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
    return nextResolve(specifier, context);
  },
});
const tx = await import(new URL("lib/payments/solanaTx.ts", root).href);
const solana = await import(new URL("lib/payments/solana.ts", root).href);

const PHASE = process.env.PHASE ?? "A";
const runId = `RC${PHASE}${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const MINT = solana.NATIVE_USDC_MINT["solana-devnet"];
const RECIPIENT = "D89fnNdAMFSnd4Jc8NvHcAkGQfvhWFkhY84K5qALQE4";
const HELPER1_DEST = "Gs7hdHrUTo1ZQPAbBJ3gUGUBDEU1T3uNSB3rcNWp6jp5";
const HELPER2_DEST = "AMqZnXRA73H9CDzBqs5DehH1aYXmnmThVRDVtuUyE64X";
const REFERRAL_DEST = "ExrUH84Gx35s6MAKMqBfofMJ9cKCEeYizjAeaY7BJM96";
const operator = { Authorization: `Bearer ${settlementToken}` };
const BUCKET = "life-help-staging-request-media";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

// ---- local devnet side (customer wallet only) ----
const localRpc = new tx.DevnetRpc(process.env.LIFE_HELP_LOCAL_DEVNET_RPC ?? "https://api.devnet.solana.com");
const keyFile = process.env.LIFE_HELP_DEVNET_CUSTOMER_KEY_FILE;
if (!keyFile) throw new Error("LIFE_HELP_DEVNET_CUSTOMER_KEY_FILE is required");
const customerSigner = await tx.signerFromSecret(JSON.parse(fs.readFileSync(keyFile, "utf8")).secretKeyBase58);
if (customerSigner.publicKey !== "6nHJ3yu1dyzTucnx59hBDxQe5RaY8jAd6QGawDRVCW6a") throw new Error("unexpected customer test wallet");
await localRpc.assertDevnet();

async function waitFinal(signature, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const s = await localRpc.status(signature).catch(() => null);
    if (s?.err) return "failed";
    if (s?.confirmationStatus === "finalized") return "finalized";
    if (Date.now() > deadline) return s?.confirmationStatus ?? "unseen";
    await sleep(3000);
  }
}
async function customerPays({ toOwner = RECIPIENT, amountBaseUnits, reference }) {
  const p = await tx.prepareUsdcTransfer(localRpc, customerSigner, { mint: MINT, toOwner, amountBaseUnits: BigInt(amountBaseUnits), reference });
  await localRpc.sendBase64(p.signedBase64);
  return p.signature;
}
const usdcOf = async (owner) => localRpc.tokenBaseUnits(await tx.associatedTokenAddress(owner, MINT));

// ---- Worker side ----
const api = async (pathname, { method = "GET", headers = {}, body, raw } = {}) => {
  const r = await fetch(`${base}${pathname}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const type = r.headers.get("content-type") || "";
  return { status: r.status, body: type.startsWith("application/json") ? await r.json() : null };
};
const objectExists = async (key) => (await fetch(`${supabaseUrl}/storage/v1/object/info/${BUCKET}/${key}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })).status === 200;
const one = async (p) => (await db(p))[0];
async function pricedHelper(label, basePrice = 1400) {
  const h = await fx.createHelper(label, { service: "clog-clearing" });
  const price = (await dbRpc("upsert_helper_service_price", { p_helper_id: h.helper.id, p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: basePrice, materials_policy: "INCLUDED" }, p_publish: true })).data;
  return { ...h, price, basePrice };
}
const form = (label) => ({ ...fx.requestPayload(undefined, "en", label), service_slug: "clog-clearing" });
async function offerToken(helper) {
  const r = await api(`/api/pricing/offers?service=clog-clearing&subitem=toilet-simple&country=KR&sido=${encodeURIComponent(fx.sido)}&gungu=G1`);
  return r.body?.offers?.find((o) => Number(o.base_price) === helper.basePrice)?.offerToken;
}
/** Drive the outbox until the job is final (operator reconcile = the same code the cron runs). */
async function settleJob(jobId, timeoutMs = 240000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const job = await one(`money_movement_jobs?id=eq.${jobId}&select=*`);
    if (["CONFIRMED", "REVIEW_REQUIRED", "FAILED_PERMANENT"].includes(job.status) || Date.now() > deadline) return job;
    if (new Date(job.next_retry_at) <= new Date() && (!job.claim_expires_at || new Date(job.claim_expires_at) <= new Date())) await api("/api/sys/payments/reconcile", { method: "POST", headers: operator });
    await sleep(5000);
  }
}
async function onchainTransfer(signature, owner, amount, reference) {
  const t = await localRpc.transaction(signature, "finalized");
  if (!t) return null;
  const seen = solana.observePayment(t, { recipient: owner, mint: MINT, reference });
  return { ok: seen.txSuccess && seen.recipient === owner && seen.mint === MINT && seen.amountBaseUnits === String(amount) && seen.referenceMatched, seen };
}

try {
  record("INFO", `run ${runId}; customer USDC before: ${Number(await usdcOf(customerSigner.publicKey)) / 1e6}; signer USDC before: ${Number(await usdcOf(RECIPIENT) ?? 0) / 1e6}`);

  if (PHASE === "A") {
    // ============ Mode A: real payment -> PAID_HELD -> service -> completion -> real payout -> CLOSED ============
    const H = await pricedHelper("A1");
    const other = await pricedHelper("A2", 2800);
    const dest = await api("/api/helper/payouts", { method: "POST", headers: H.auth, body: { address: HELPER1_DEST } });
    expect("A0. Helper registers its own devnet USDC payout address (public address only, masked)", dest.status === 201 && dest.body.destination.masked_destination !== HELPER1_DEST, dest.status);
    const C = await fx.customerDevice("A");
    const checkout = await api("/api/checkouts", { method: "POST", headers: { Cookie: C.cookie }, body: { mode: "HELPER_PRICE_SELECTED", offer_token: await offerToken(H), ...form("REAL-CHAIN mode A") } });
    const cid = checkout.body?.checkoutId;
    const media = await api(`/api/checkouts/${cid}/media`, { method: "POST", headers: { "Content-Type": "image/png", Cookie: C.cookie }, raw: PNG });
    const mediaRow = await one(`request_media?id=eq.${media.body?.mediaId}&select=*`);
    const pay = await api(`/api/checkouts/${cid}/payment`, { method: "POST", headers: { Cookie: C.cookie } });
    expect("A1. checkout at the authoritative Helper price (1,400 KRW) -> devnet USDC intent 1.000000 to the staging recipient, native devnet mint, unique reference", checkout.status === 201 && checkout.body.fiatAmount === 1400 && pay.status === 201 && pay.body.network === "solana-devnet" && pay.body.mint === MINT && pay.body.recipient === RECIPIENT && pay.body.amountBaseUnits === "1000000" && !!pay.body.reference, { checkout: checkout.body, pay: pay.body });
    expect("A1b. no request / assignment exists before payment", (await db(`service_requests?customer_id=eq.${C.publicId}&select=id`)).length === 0);
    const signature = await customerPays({ amountBaseUnits: pay.body.amountBaseUnits, reference: pay.body.reference });
    record("INFO", `A payment signature ${signature}`);
    const early = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature } });
    expect("A2. unconfirmed / not-yet-final transaction never activates (no PAID_HELD, no request)", early.body?.paymentStatus !== "PAID_HELD" && !early.body?.requestId && (await db(`service_requests?customer_id=eq.${C.publicId}&select=id`)).length === 0, early.body);
    const wrongCustomer = await fx.customerDevice("AX");
    const foreign = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: wrongCustomer.cookie }, body: { signature } });
    expect("A2b. another customer cannot verify / claim this payment (404)", foreign.status === 404, foreign.status);
    const fin = await waitFinal(signature);
    const verified = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature } });
    const requestId = verified.body?.requestId;
    const intent = await one(`payment_intents?id=eq.${pay.body.intentId}&select=*`);
    const reqRow = requestId ? await one(`service_requests?id=eq.${requestId}&select=*`) : null;
    const chainRow = await one(`payment_chain_transactions?signature=eq.${signature}&select=*`);
    expect("A3. finalized exact payment verified by the Worker through its devnet RPC -> PAID_HELD (signature recorded once, MATCHED classification)", fin === "finalized" && verified.status === 200 && verified.body.paymentStatus === "PAID_HELD" && intent.status === "PAID_HELD" && intent.verified_signature === signature && chainRow?.classification === "MATCHED" && chainRow.amount_base_units === 1000000, { fin, verified: verified.body });
    const [asg] = requestId ? await db(`request_assignments?request_id=eq.${requestId}&select=id,helper_id,status`) : [];
    const sel = requestId ? await one(`request_price_selections?request_id=eq.${requestId}&status=eq.ACCEPTED&select=*`) : null;
    const conv = requestId ? await db(`conversations?request_id=eq.${requestId}&select=id`) : [];
    const notified = requestId ? await db(`app_notifications?type=eq.NEW_SERVICE_REQUEST&payload->>request_id=eq.${requestId}&select=id`) : [];
    expect("A4. activation: request MATCHED (funded, HELPER_PRICE_SELECTED), current price selection = authority (1,400), selected Helper PENDING, conversation, Helper notified", reqRow?.status === "MATCHED" && reqRow.funding_payment_intent_id === intent.id && reqRow.request_mode === "HELPER_PRICE_SELECTED" && Number(sel?.initial_payable_amount) === 1400 && sel.helper_id === H.helper.id && asg?.helper_id === H.helper.id && asg.status === "PENDING" && conv.length === 1 && notified.length === 1);
    const replay = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature } });
    expect("A4b. re-verifying the same signature replays (no second activation / request)", replay.body?.replayed === true && (await db(`service_requests?customer_id=eq.${C.publicId}&select=id`)).length === 1, replay.body);
    expect("A5. paid-flow media: owner 200, assigned Helper 200, non-assigned Helper 404", (await api(`/api/media/${media.body.mediaId}`, { headers: { Cookie: C.cookie } })).status === 200 && (await api(`/api/media/${media.body.mediaId}`, { headers: H.auth })).status === 200 && (await api(`/api/media/${media.body.mediaId}`, { headers: other.auth })).status === 404);
    const steps = [];
    for (const action of ["accept", "start", "complete"]) steps.push((await api(`/api/helper/assignments/${asg.id}/${action}`, { method: "POST", headers: H.auth })).status);
    const afterHelper = await one(`payment_intents?id=eq.${intent.id}&select=status`);
    expect("A6. Helper completion does not pay: payment still PAID_HELD, no payout obligation; customer notified", steps.every((s) => s === 200) && afterHelper.status === "PAID_HELD" && (await db(`payout_obligations?request_id=eq.${requestId}&select=id`)).length === 0 && (await db(`app_notifications?recipient_id=eq.${C.publicId}&payload->>request_id=eq.${requestId}&select=type`)).length >= 1, steps);
    expect("A6b. Helper media access ends at Helper completion (404); owner still 200", (await api(`/api/media/${media.body.mediaId}`, { headers: H.auth })).status === 404 && (await api(`/api/media/${media.body.mediaId}`, { headers: { Cookie: C.cookie } })).status === 200);
    const [c1, c2] = await Promise.all([api(`/api/requests/${requestId}/complete`, { method: "POST", headers: { Cookie: C.cookie } }), api(`/api/requests/${requestId}/complete`, { method: "POST", headers: { Cookie: C.cookie } })]);
    const obligations = await db(`payout_obligations?request_id=eq.${requestId}&select=*`);
    const jobs = obligations.length ? await db(`money_movement_jobs?payout_obligation_id=eq.${obligations[0].id}&select=*`) : [];
    expect("A7. two parallel '서비스 완료' calls: exactly one completion authority, one payout obligation, one money job (the other call replays)", [c1, c2].every((c) => c.status === 200) && [c1, c2].filter((c) => c.body.replayed === true).length === 1 && obligations.length === 1 && jobs.length === 1 && Number(obligations[0].net_amount) === 1400 && obligations[0].fee_policy === "UNCONFIGURED_ZERO", [c1.body, c2.body]);
    expect("A7b. customer completion queues the request media for deletion", (await one(`request_media?id=eq.${media.body.mediaId}&select=status`)).status === "DELETION_PENDING");
    const job = await settleJob(jobs[0].id);
    const attempts = await db(`money_movement_attempts?job_id=eq.${jobs[0].id}&select=*&order=attempt_number`);
    const ob = await one(`payout_obligations?id=eq.${obligations[0].id}&select=*`);
    const proof = attempts[0] ? await onchainTransfer(attempts[0].external_id, HELPER1_DEST, 1000000, attempts[0].adapter_payload.reference) : null;
    record("INFO", `A payout job ${JSON.stringify({ status: job.status, attempts: attempts.map((a) => [a.state, a.external_id]) })}`);
    expect("A8. REAL Helper payout: one attempt signed by the staging signer, broadcast, finalized, re-verified -> job CONFIRMED, obligation PAID with that signature", job.status === "CONFIRMED" && attempts.length === 1 && attempts[0].state === "CONFIRMED" && ob.status === "PAID" && ob.chain_signature === attempts[0].external_id && proof?.ok === true, { job: job.status, ob: ob.status, proof });
    expect("A8b. signed bytes cleared at the terminal state; public signature + history kept", attempts[0]?.signed_payload === null && !!attempts[0]?.external_id);
    const settled = await one(`service_requests?id=eq.${requestId}&select=status`);
    const audit = await one(`admin_audit_logs?action=eq.SERVICE_SETTLED&entity_id=eq.${requestId}&select=metadata`);
    expect("A9. settlement through CLOSED; audit external_payment_verified = true with the real payment + payout signatures", ["CLOSED", "SETTLED"].includes(settled.status) && audit?.metadata?.external_payment_verified === true && audit.metadata.external_payment_transaction_id === signature && audit.metadata.external_payout_transaction_id === attempts[0]?.external_id, { status: settled.status, audit: audit?.metadata });
    const cleanupRun = await api("/api/sys/cleanup/conversations", { method: "POST", headers: operator, body: { limit: 20 } });
    const finalReq = await one(`service_requests?id=eq.${requestId}&select=status`);
    expect("A10. cleanup run: request CLOSED; paid-flow media physically deleted, then DELETED", cleanupRun.status === 200 && finalReq.status === "CLOSED" && !(await objectExists(mediaRow.object_key)) && (await one(`request_media?id=eq.${media.body.mediaId}&select=status`)).status === "DELETED", { status: finalReq.status });
    expect("A11. financial history retained after cleanup (intent SETTLED, obligation PAID, chain tx row, job + attempt)", (await one(`payment_intents?id=eq.${intent.id}&select=status`)).status === "SETTLED" && (await one(`payout_obligations?id=eq.${ob.id}&select=status`)).status === "PAID" && !!(await one(`payment_chain_transactions?signature=eq.${signature}&select=id`)) && (await db(`money_movement_attempts?job_id=eq.${jobs[0].id}&select=id`)).length === 1);
    record("INFO", `A ids: request ${requestId} intent ${intent.id} obligation ${ob.id} job ${jobs[0].id} payment ${signature} payout ${attempts[0]?.external_id}`);
  }
} catch (error) {
  record("FAIL", `real devnet phase ${PHASE} harness`, String(error?.stack || error).slice(0, 700));
} finally {
  record("INFO", `customer USDC after: ${Number(await usdcOf(customerSigner.publicKey).catch(() => null)) / 1e6}; signer USDC after: ${Number(await usdcOf(RECIPIENT).catch(() => null) ?? 0) / 1e6}`);
}
if (summary().FAIL > 0) process.exit(1);

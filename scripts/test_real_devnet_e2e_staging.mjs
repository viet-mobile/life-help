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
// The public devnet RPC used for LOCAL reads is occasionally slow: bounded retries for read-only calls.
for (const m of ["status", "transaction", "tokenBaseUnits", "lamports"]) {
  const original = localRpc[m].bind(localRpc);
  localRpc[m] = async (...args) => { for (let i = 0; ; i += 1) { try { return await original(...args); } catch (e) { if (i >= 4) throw e; await new Promise((r) => setTimeout(r, 2000)); } } };
}

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

/** Devnet USDC balances read by the deployed Worker through its configured devnet RPC (base units). */
async function workerBalances(addresses) {
  const j = await (await fetch(`${base}/api/sys/payments/rpc-health`, { method: "POST", headers: { ...operator, "Content-Type": "application/json" }, body: JSON.stringify({ addresses }) })).json();
  if (j.network !== "SOLANA_DEVNET") throw new Error(`worker rpc not devnet: ${j.network}`);
  return addresses.map((a) => BigInt(j.balances.find((b) => b.address === a)?.devnetUsdcBaseUnits ?? "0"));
}
const letters = () => Array.from({ length: 8 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
/** Isolated PAYABLE Referral reward whose referrer holds an ACTIVE devnet USDC destination (financial history: kept). */
async function payableReward(destination) {
  const [ra, rb] = [letters(), letters()];
  const [referrer] = await db("referral_identities", "POST", { referral_id: ra, subject_type: "CUSTOMER", device_id_hash: `${runId}-${ra}`.padEnd(64, "0").slice(0, 64), subject_key: ra });
  const [referred] = await db("referral_identities", "POST", { referral_id: rb, subject_type: "CUSTOMER", device_id_hash: `${runId}-${rb}`.padEnd(64, "0").slice(0, 64), subject_key: rb });
  const [attribution] = await db("referral_attributions", "POST", { referred_identity_id: referred.id, referrer_identity_id: referrer.id });
  const [request] = await db("service_requests", "POST", { request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true, customer_id: rb, customer_display_name: "REAL-CHAIN REFERRAL", service_slug: "boiler", country: "KR", sido: `${runId}-REF`, gungu: "G1", description: `${runId} REAL-CHAIN referral qualifying request (financial history, kept)`, status: "CANCELLED" });
  const [reward] = await db("referral_rewards", "POST", { attribution_id: attribution.id, qualifying_request_id: request.id, referrer_identity_id: referrer.id, referred_identity_id: referred.id, tier: "WLH", reward_amount_krw: 1000, first_service_discount_krw: 1000, state: "PAYABLE" });
  await db("payout_destinations", "POST", { owner_identity_id: referrer.id, country: "KR", currency: "USDC", payout_method: "USDC_SOLANA", provider: "SOLANA_DIRECT_DEVNET", provider_payee_token: destination, masked_destination: `${destination.slice(0, 4)}…${destination.slice(-4)}`, status: "ACTIVE" });
  return reward;
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
    // Devnet finalizes in ~1 s (solana-core 4.x), so "not yet final" cannot be observed reliably after a
    // broadcast; the unseen-signature case is exercised instead (confirmed-not-final is deterministic).
    const prepared = await tx.prepareUsdcTransfer(localRpc, customerSigner, { mint: MINT, toOwner: RECIPIENT, amountBaseUnits: BigInt(pay.body.amountBaseUnits), reference: pay.body.reference });
    const early = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature: prepared.signature } });
    expect("A2. a signature not yet on the network never activates (no PAID_HELD, no request)", early.body?.paymentStatus !== "PAID_HELD" && !early.body?.requestId && (await db(`service_requests?customer_id=eq.${C.publicId}&select=id`)).length === 0, early.body);
    await localRpc.sendBase64(prepared.signedBase64);
    const signature = prepared.signature;
    record("INFO", `A payment signature ${signature}`);
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
  if (PHASE === "B") {
    // ============ Mode B: funded offer -> visibility -> parallel accept -> decline / reopen -> refund ============
    const [B1, B2] = [await pricedHelper("B1"), await pricedHelper("B2", 1500)];
    const C = await fx.customerDevice("B");
    const note = `fixture note ${runId.replace(/[0-9]/g, (d) => "abcdefghij"[d])}`; // digits would trip the phone-number guard
    const checkout = await api("/api/checkouts", { method: "POST", headers: { Cookie: C.cookie }, body: { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "1400", materials_policy: "INCLUDED", public_note: note }, ...form("REAL-CHAIN mode B private description") } });
    const feed = async (h) => ((await api("/api/helper/open-offers", { headers: h.auth })).body?.offers ?? []).filter((o) => o.sido === fx.sido || JSON.stringify(o).includes(note));
    expect("B1. unpaid customer offer invisible to eligible Helpers", checkout.status === 201 && (await feed(B1)).length === 0 && (await feed(B2)).length === 0, checkout.body);
    const pay = await api(`/api/checkouts/${checkout.body.checkoutId}/payment`, { method: "POST", headers: { Cookie: C.cookie } });
    const prepared = await tx.prepareUsdcTransfer(localRpc, customerSigner, { mint: MINT, toOwner: RECIPIENT, amountBaseUnits: BigInt(pay.body.amountBaseUnits), reference: pay.body.reference });
    const unseen = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature: prepared.signature } });
    expect("B2. a signature not on the network (unconfirmed / unseen) never activates", unseen.body?.paymentStatus !== "PAID_HELD" && !unseen.body?.requestId && (await db(`service_requests?customer_id=eq.${C.publicId}&select=id`)).length === 0, unseen.body);
    await localRpc.sendBase64(prepared.signedBase64);
    const fin = await waitFinal(prepared.signature);
    const verified = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature: prepared.signature } });
    const requestId = verified.body?.requestId;
    const req = requestId ? await one(`service_requests?id=eq.${requestId}&select=status,request_mode,funding_payment_intent_id`) : null;
    expect("B3. real verified payment (1 USDC) -> PAID_HELD -> OPEN_FOR_HELPERS (funded customer offer)", fin === "finalized" && verified.body?.paymentStatus === "PAID_HELD" && req?.status === "OPEN_FOR_HELPERS" && req.request_mode === "CUSTOMER_OFFER_OPEN", { fin, verified: verified.body });
    const [o1] = (await feed(B1)).filter((o) => o.request_id === requestId || o.requestId === requestId);
    const offerText = JSON.stringify(o1 ?? {});
    record("INFO", `B feed item keys: ${Object.keys(o1 ?? {}).join(",")}`);
    expect("B4. eligible Helper feed: service, region, customer-funded amount (1,400 KRW), allowed terms; no address / description / customer identity", !!o1 && offerText.includes("clog-clearing") && offerText.includes(fx.sido) && offerText.includes("1400") && !offerText.includes("private description") && !offerText.includes(C.publicId) && !/"address"|street/i.test(offerText), o1);
    const [x1, x2] = await Promise.all([api(`/api/helper/open-offers/${requestId}`, { method: "POST", headers: B1.auth, body: { action: "ACCEPT" } }), api(`/api/helper/open-offers/${requestId}`, { method: "POST", headers: B2.auth, body: { action: "ACCEPT" } })]);
    const active1 = await db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id`);
    const winner = x1.body?.success ? B1 : B2, loser = winner === B1 ? B2 : B1;
    expect("B5. two Helpers accept in true parallel: exactly one winner, one active assignment, the loser refused", [x1, x2].filter((x) => x.body?.success === true).length === 1 && active1.length === 1 && active1[0].helper_id === winner.helper.id, [x1.status, x1.body?.code, x2.status, x2.body?.code]);
    const decline = await api(`/api/helper/assignments/${active1[0].id}/decline`, { method: "POST", headers: winner.auth });
    const reopened = await one(`service_requests?id=eq.${requestId}&select=status,funding_payment_intent_id`);
    const intentAfter = await one(`payment_intents?id=eq.${pay.body.intentId}&select=status`);
    expect("B6. winner declines before service: the SAME funded offer reopens (OPEN_FOR_HELPERS), same payment PAID_HELD, no substitution, no active assignment", decline.status === 200 && reopened.status === "OPEN_FOR_HELPERS" && reopened.funding_payment_intent_id === pay.body.intentId && intentAfter.status === "PAID_HELD" && (await db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id`)).length === 0, decline.body);
    const seenBy = async (h) => (await feed(h)).some((o) => (o.request_id ?? o.requestId) === requestId);
    expect("B7. the declined Helper is excluded for this request; the other Helper still sees it", !(await seenBy(winner)) && await seenBy(loser));
    const again = await api(`/api/helper/open-offers/${requestId}`, { method: "POST", headers: loser.auth, body: { action: "ACCEPT" } });
    const active2 = await db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id`);
    expect("B8. another Helper explicitly accepts the reopened offer at the same customer amount; no second customer payment", again.body?.success === true && active2.length === 1 && active2[0].helper_id === loser.helper.id && (await db(`payment_intents?checkout_id=eq.${checkout.body.checkoutId}&select=id`)).length === 1, again.body);
    await api(`/api/helper/assignments/${active2[0].id}/decline`, { method: "POST", headers: loser.auth });
    const before = BigInt(await usdcOf(customerSigner.publicKey));
    const [k1, k2] = await Promise.all([api(`/api/requests/${requestId}/cancel`, { method: "POST", headers: { Cookie: C.cookie } }), api(`/api/requests/${requestId}/cancel`, { method: "POST", headers: { Cookie: C.cookie } })]);
    const refunds = await db(`service_refunds?payment_intent_id=eq.${pay.body.intentId}&select=*`);
    const rjobs = refunds.length ? await db(`money_movement_jobs?service_refund_id=eq.${refunds[0].id}&select=*`) : [];
    expect("B9. customer cancels the unmatched funded offer (two parallel calls): exactly one refund obligation + one refund job", [k1, k2].every((k) => k.status === 200) && refunds.length === 1 && rjobs.length === 1 && refunds[0].reason === "CUSTOMER_CANCELLED_UNMATCHED", [k1.body, k2.body]);
    const rjob = await settleJob(rjobs[0].id);
    const ratt = await db(`money_movement_attempts?job_id=eq.${rjobs[0].id}&select=*&order=attempt_number`);
    const proof = ratt[0] ? await onchainTransfer(ratt[0].external_id, customerSigner.publicKey, 1000000, ratt[0].adapter_payload.reference) : null;
    const after = BigInt(await usdcOf(customerSigner.publicKey));
    const refundRow = await one(`service_refunds?id=eq.${refunds[0].id}&select=status,chain_signature`);
    expect("B10. REAL refund: one attempt, finalized + re-verified to the paying wallet (1.000000 USDC) -> refund COMPLETED, payment REFUNDED", rjob.status === "CONFIRMED" && ratt.length === 1 && proof?.ok === true && refundRow.status === "COMPLETED" && refundRow.chain_signature === ratt[0].external_id && (await one(`payment_intents?id=eq.${pay.body.intentId}&select=status`)).status === "REFUNDED" && after - before === 1000000n, { job: rjob.status, last: rjob.last_error_code, proof, delta: String(after - before) });
    const k3 = await api(`/api/requests/${requestId}/cancel`, { method: "POST", headers: { Cookie: C.cookie } });
    expect("B11. repeated cancel after the refund: replay only, no second refund / job / transfer", k3.body?.replayed === true && (await db(`service_refunds?payment_intent_id=eq.${pay.body.intentId}&select=id`)).length === 1 && (await db(`money_movement_attempts?job_id=eq.${rjobs[0].id}&select=id`)).length === 1);
    record("INFO", `B ids: request ${requestId} intent ${pay.body.intentId} payment ${prepared.signature} refund ${ratt[0]?.external_id}`);
  }
  if (PHASE === "C") {
    // ============ Mode A: selected Helper becomes unavailable during payment -> funds held, re-selection, refund ============
    const H = await pricedHelper("C1");
    const C = await fx.customerDevice("C");
    const checkout = await api("/api/checkouts", { method: "POST", headers: { Cookie: C.cookie }, body: { mode: "HELPER_PRICE_SELECTED", offer_token: await offerToken(H), ...form("REAL-CHAIN helper unavailable") } });
    const pay = await api(`/api/checkouts/${checkout.body.checkoutId}/payment`, { method: "POST", headers: { Cookie: C.cookie } });
    await db(`helpers?id=eq.${H.helper.id}`, "PATCH", { on_duty: false }); // the chosen Helper goes off duty mid-payment
    const signature = await customerPays({ amountBaseUnits: pay.body.amountBaseUnits, reference: pay.body.reference });
    await waitFinal(signature);
    const verified = await api(`/api/payments/${pay.body.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature } });
    const requestId = verified.body?.requestId;
    const req = requestId ? await one(`service_requests?id=eq.${requestId}&select=status`) : null;
    const sel = requestId ? await one(`request_price_selections?request_id=eq.${requestId}&select=status,ended_reason,helper_id,initial_payable_amount`) : null;
    expect("C1. paid while the selected Helper became unavailable: PAID_HELD, no silent substitution (no assignment), CUSTOMER_RESELECTION_REQUIRED", verified.body?.paymentStatus === "PAID_HELD" && req?.status === "CUSTOMER_RESELECTION_REQUIRED" && (await db(`request_assignments?request_id=eq.${requestId}&select=id`)).length === 0, verified.body);
    expect("C2. commercial history preserved: v1 selection (that Helper, 1,400) ENDED HELPER_UNAVAILABLE_AT_ACTIVATION; customer notified to re-select", sel?.status === "ENDED" && sel.ended_reason === "HELPER_UNAVAILABLE_AT_ACTIVATION" && sel.helper_id === H.helper.id && Number(sel.initial_payable_amount) === 1400 && (await db(`app_notifications?type=eq.CUSTOMER_RESELECTION_REQUIRED&payload->>request_id=eq.${requestId}&select=id`)).length === 1, sel);
    const before = await workerBalances([customerSigner.publicKey]);
    const cancel = await api(`/api/requests/${requestId}/cancel`, { method: "POST", headers: { Cookie: C.cookie } });
    const [refund] = await db(`service_refunds?payment_intent_id=eq.${pay.body.intentId}&select=*`);
    const [rj] = await db(`money_movement_jobs?service_refund_id=eq.${refund.id}&select=id`);
    const job = await settleJob(rj.id);
    const after = await workerBalances([customerSigner.publicKey]);
    expect("C3. customer cancels instead of re-selecting -> REAL refund confirmed on chain (+1.000000 USDC), payment REFUNDED", cancel.status === 200 && job.status === "CONFIRMED" && (await one(`service_refunds?id=eq.${refund.id}&select=status`)).status === "COMPLETED" && (await one(`payment_intents?id=eq.${pay.body.intentId}&select=status`)).status === "REFUNDED" && after[0] - before[0] === 1000000n, { job: job.status, delta: String(after[0] - before[0]) });
    await db(`helpers?id=eq.${H.helper.id}`, "PATCH", { on_duty: true });
  }

  if (PHASE === "D") {
    // ============ Referral payout: PAYABLE -> one obligation + one job -> real transfer -> PAID ============
    const reward = await payableReward(REFERRAL_DEST);
    const before = await workerBalances([REFERRAL_DEST]);
    const [d1, d2] = await Promise.all([api(`/api/sys/rewards/${reward.id}/payout`, { method: "POST", headers: operator, body: { country: "KR" } }), api(`/api/sys/rewards/${reward.id}/payout`, { method: "POST", headers: operator, body: { country: "KR" } })]);
    const obligations = await db(`payout_obligations?referral_reward_id=eq.${reward.id}&select=*`);
    const jobs = obligations.length ? await db(`money_movement_jobs?payout_obligation_id=eq.${obligations[0].id}&select=*`) : [];
    expect("D1. PAYABLE reward, two parallel payout calls: exactly one obligation (1,000 KRW) + one job; reward PAYOUT_PROCESSING", obligations.length === 1 && jobs.length === 1 && Number(obligations[0].net_amount) === 1000, [d1.body, d2.body]);
    const job = await settleJob(jobs[0].id);
    const attempts = await db(`money_movement_attempts?job_id=eq.${jobs[0].id}&select=*`);
    const after = await workerBalances([REFERRAL_DEST]);
    expect("D2. REAL Referral payout at the explicit TEST FX rate (1,000 KRW / 1400 = 0.714285 USDC): one attempt, confirmed -> obligation PAID, reward PAID", job.status === "CONFIRMED" && attempts.length === 1 && Number(attempts[0].amount_base_units) === 714285 && (await one(`payout_obligations?id=eq.${obligations[0].id}&select=status`)).status === "PAID" && (await one(`referral_rewards?id=eq.${reward.id}&select=state`)).state === "PAID" && after[0] - before[0] === 714285n, { job: job.status, delta: String(after[0] - before[0]) });
    const d3 = await api(`/api/sys/rewards/${reward.id}/payout`, { method: "POST", headers: operator, body: { country: "KR" } });
    expect("D3. repeated payout call: no second obligation / job / transfer", (await db(`payout_obligations?referral_reward_id=eq.${reward.id}&select=id`)).length === 1 && (await db(`money_movement_attempts?job_id=eq.${jobs[0].id}&select=id`)).length === 1, d3.body);
  }

  if (PHASE === "E") {
    // ============ wrong-payment matrix (real devnet transactions) ============
    const C = await fx.customerDevice("E");
    const intent = async (label) => {
      const checkout = await api("/api/checkouts", { method: "POST", headers: { Cookie: C.cookie }, body: { mode: "CUSTOMER_OFFER_OPEN", subitem_code: "toilet-simple", offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "1400", materials_policy: "INCLUDED" }, ...form(`REAL-CHAIN wrong payment ${label}`) } });
      return (await api(`/api/checkouts/${checkout.body.checkoutId}/payment`, { method: "POST", headers: { Cookie: C.cookie } })).body;
    };
    const verify = (i, signature) => api(`/api/payments/${i.intentId}/verify`, { method: "POST", headers: { Cookie: C.cookie }, body: { signature } });
    const noActivation = async (i) => (await one(`payment_intents?id=eq.${i.intentId}&select=status,request_id`));
    const cases = [];
    // underpayment / overpayment / wrong recipient: real transfers carrying the intent's reference
    for (const [label, amount, toOwner, expectClass] of [["underpaid", 500000, RECIPIENT, "UNDERPAID"], ["overpaid", 1200000, RECIPIENT, "OVERPAID"], ["wrong recipient", 10000, REFERRAL_DEST, "WRONG_RECIPIENT"]]) {
      const i = await intent(label);
      const sig = await customerPays({ toOwner, amountBaseUnits: amount, reference: i.reference });
      await waitFinal(sig);
      const v = await verify(i, sig);
      const row = await noActivation(i);
      cases.push([label, v.status, v.body?.classification, row.status, row.request_id]);
      expect(`E. ${label}: never PAID_HELD, no activation -> ${expectClass} / REVIEW_REQUIRED`, v.body?.paymentStatus !== "PAID_HELD" && v.body?.classification === expectClass && row.status === "REVIEW_REQUIRED" && row.request_id === null, v.body);
    }
    // missing reference: exact amount to the right recipient, but no reference key
    {
      const i = await intent("missing reference");
      const source = await tx.associatedTokenAddress(customerSigner.publicKey, MINT), destination = await tx.associatedTokenAddress(RECIPIENT, MINT);
      const latest = await localRpc.latestBlockhashWithHeight();
      const { message, signers } = tx.compileMessage(customerSigner.publicKey, [tx.transferCheckedInstruction(source, MINT, destination, customerSigner.publicKey, BigInt(i.amountBaseUnits), 6)], latest.blockhash);
      const signed = await tx.signTransaction(message, signers, [customerSigner]);
      await localRpc.send(signed.wire);
      await waitFinal(signed.signature);
      const v = await verify(i, signed.signature);
      expect("E. missing reference: exact amount to the right recipient without the intent's reference -> MISSING_REFERENCE / REVIEW_REQUIRED, no activation", v.body?.classification === "MISSING_REFERENCE" && (await noActivation(i)).request_id === null && v.body?.paymentStatus !== "PAID_HELD", v.body);
    }
    // failed transaction: lands with an error (more than the wallet holds; preflight skipped)
    {
      const i = await intent("failed tx");
      const p = await tx.prepareUsdcTransfer(localRpc, customerSigner, { mint: MINT, toOwner: RECIPIENT, amountBaseUnits: 1000000000n, reference: i.reference });
      await localRpc.call("sendTransaction", [p.signedBase64, { encoding: "base64", skipPreflight: true }]);
      const fin = await waitFinal(p.signature);
      const v = await verify(i, p.signature);
      expect("E. failed on-chain transaction -> FAILED_TX (PAYMENT_TX_FAILED), never PAID_HELD, no activation", fin === "failed" && v.body?.code === "PAYMENT_TX_FAILED" && (await noActivation(i)).request_id === null, { fin, v: v.body });
    }
    // duplicate signature: an already-used verified payment signature presented for another intent
    {
      const i = await intent("duplicate signature");
      const used = process.env.USED_SIGNATURE;
      const v = await verify(i, used);
      expect("E. a payment signature already recorded for another intent -> DUPLICATE_SIGNATURE, no activation", !!used && v.body?.code === "DUPLICATE_SIGNATURE" && (await noActivation(i)).request_id === null, v.body);
    }
    record("INFO", `E cases: ${JSON.stringify(cases)}`);
  }

  if (PHASE === "F") {
    // ============ REAL crash recovery on Referral payout jobs (worker = deployed outbox) ============
    // The "crashed worker" is this harness: it claims the job with a short lease, persists a PREPARED
    // attempt (a real devnet transfer signed by the customer TEST wallet to the job's destination with
    // the job's exact amount + reference) and then stops without acknowledging. The deployed Worker
    // must reconcile that SAME signature and never create a second economic payment.
    const crashJob = async (label, broadcast) => {
      const reward = await payableReward(REFERRAL_DEST);
      const created = (await dbRpc("create_referral_payout_obligation", { p_reward_id: reward.id, p_rail: "USDC_SOLANA", p_country: "KR" })).data;
      const [job] = await db(`money_movement_jobs?payout_obligation_id=eq.${created.payout_obligation_id}&select=id`);
      const claim = (await dbRpc("claim_money_job", { p_job_id: job.id, p_lease_seconds: 15 })).data;
      const reference = await tx.transferReference("referral-payout", created.payout_obligation_id);
      const p = await tx.prepareUsdcTransfer(localRpc, customerSigner, { mint: MINT, toOwner: REFERRAL_DEST, amountBaseUnits: 714285n, reference });
      const persisted = (await dbRpc("prepare_money_attempt", { p_job_id: job.id, p_lease: claim.job.lease_token, p_provider: "SOLANA_DIRECT_DEVNET", p_network: "solana-devnet", p_asset: "USDC", p_amount_base_units: 714285, p_destination: REFERRAL_DEST, p_external_id: p.signature, p_adapter_payload: { recentBlockhash: p.recentBlockhash, lastValidBlockHeight: p.lastValidBlockHeight, reference, crash_test: label }, p_signed_payload: p.signedBase64 })).data;
      if (broadcast) await localRpc.sendBase64(p.signedBase64);
      return { reward, obligationId: created.payout_obligation_id, jobId: job.id, signature: p.signature, attemptId: persisted.attempt_id, lastValidBlockHeight: p.lastValidBlockHeight };
    };
    // F1: broadcast, then crash before the DB learns of it.
    const before1 = await workerBalances([REFERRAL_DEST]);
    const f1 = await crashJob("after-broadcast", true);
    expect("F1. crash state: attempt PREPARED (DB never acknowledged the broadcast), obligation not paid", (await one(`money_movement_attempts?id=eq.${f1.attemptId}&select=state`)).state === "PREPARED" && (await one(`payout_obligations?id=eq.${f1.obligationId}&select=status`)).status === "CREATED");
    await sleep(17000);
    const j1 = await settleJob(f1.jobId);
    const a1 = await db(`money_movement_attempts?job_id=eq.${f1.jobId}&select=state,external_id`);
    const after1 = await workerBalances([REFERRAL_DEST]);
    expect("F1. REAL crash-after-broadcast: the deployed Worker reconciled the SAME signature -> CONFIRMED, obligation PAID; one attempt, one transfer (+0.714285 once)", j1.status === "CONFIRMED" && a1.length === 1 && a1[0].external_id === f1.signature && (await one(`payout_obligations?id=eq.${f1.obligationId}&select=status,chain_signature`)).chain_signature === f1.signature && after1[0] - before1[0] === 714285n, { job: j1.status, attempts: a1, delta: String(after1[0] - before1[0]) });
    // F2: persisted but the broadcast was lost.
    const before2 = after1;
    const f2 = await crashJob("broadcast-lost", false);
    await sleep(17000);
    const j2 = await settleJob(f2.jobId);
    const a2 = await db(`money_movement_attempts?job_id=eq.${f2.jobId}&select=state,external_id`);
    const after2 = await workerBalances([REFERRAL_DEST]);
    expect("F2. REAL same-signature rebroadcast: the Worker rebroadcast the persisted bytes (same signature, not a new payment) -> CONFIRMED; one attempt, +0.714285 once", j2.status === "CONFIRMED" && a2.length === 1 && a2[0].external_id === f2.signature && (await localRpc.status(f2.signature))?.confirmationStatus === "finalized" && after2[0] - before2[0] === 714285n, { job: j2.status, attempts: a2, delta: String(after2[0] - before2[0]) });
    // F3: persisted, never submitted, blockhash expires -> provable non-landing -> replacement by the Worker's own signer.
    const before3 = after2;
    const f3 = await crashJob("prepared-never-submitted", false);
    for (;;) { const h = await localRpc.finalizedBlockHeight(); if (h > f3.lastValidBlockHeight + 5) break; await sleep(5000); }
    const j3 = await settleJob(f3.jobId, 360000);
    const a3 = await db(`money_movement_attempts?job_id=eq.${f3.jobId}&select=state,external_id,failure_category&order=attempt_number`);
    const after3 = await workerBalances([REFERRAL_DEST]);
    expect("F3. REAL blockhash expiry: the unsent attempt is proven EXPIRED_NOT_LANDED (never seen + reference search empty), then ONE replacement by the staging signer -> CONFIRMED; exactly one landed transfer", j3.status === "CONFIRMED" && a3.length === 2 && a3[0].state === "EXPIRED_NOT_LANDED" && a3[0].failure_category === "EXPIRED_NEVER_SEEN" && a3[1].state === "CONFIRMED" && a3[1].external_id !== f3.signature && (await localRpc.status(f3.signature)) === null && after3[0] - before3[0] === 714285n, { job: j3.status, attempts: a3, delta: String(after3[0] - before3[0]) });
    record("INFO", `F ids: ${JSON.stringify([f1, f2, f3].map((f) => ({ job: f.jobId, obligation: f.obligationId, persistedSignature: f.signature })))}`);
  }
} catch (error) {
  record("FAIL", `real devnet phase ${PHASE} harness`, String(error?.stack || error).slice(0, 700));
} finally {
  record("INFO", `customer USDC after: ${Number(await usdcOf(customerSigner.publicKey).catch(() => null)) / 1e6}; signer USDC after: ${Number(await usdcOf(RECIPIENT).catch(() => null) ?? 0) / 1e6}`);
}
if (summary().FAIL > 0) process.exit(1);

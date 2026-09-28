// Live STAGING money fixtures for outbox verification (DB level, service role). NO chain transaction
// is ever sent: "funding" is a FABRICATED payment observation on a test_fixture checkout (signature
// prefixed FIXTURE, never a chain transaction), which the staging-only purge_payment_fixture() removes
// afterwards. These fixtures prove database / outbox behaviour only - never real money movement.
// Safety: fixtures never get a payout destination, so even the deployed outbox can never reach
// "prepare / sign" for them (Helper / Referral payouts WAIT; refunds stop at PAYER_NOT_FOUND).
import crypto from "node:crypto";
import { base, db, rpc, settlementToken } from "./stagingPushHarness.mjs";

export const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const STAGING_RECIPIENT = "D89fnNdAMFSnd4Jc8NvHcAkGQfvhWFkhY84K5qALQE4";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58Of32() {
  const bytes = crypto.randomBytes(32);
  let n = BigInt("0x" + bytes.toString("hex")), s = "";
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  return s;
}
export const letters = (n = 8) => Array.from(crypto.randomBytes(n), (x) => String.fromCharCode(65 + (x % 26))).join("");
export const fixtureSignature = () => `FIXTURE${crypto.randomUUID().replace(/-/g, "")}NOTACHAINTX`;
export const call = async (name, args) => (await rpc(name, args)).data;

/**
 * PAYABLE referral reward through the LEGITIMATE flow (migration 019; the app role cannot write rewards):
 * referral basis (identities + ACTIVE attribution + a legacy request of the referred customer, COMPLETED)
 * -> the deployed platform settlement route (PAYMENT_PENDING -> SETTLED), whose trusted DB function creates
 * the reward QUALIFIED -> trusted promotion to PAYABLE. Rewards / identities / the request are financial
 * history and REMAIN (tagged with the run id). Requires the runtime that calls the 019 functions.
 */
export async function legitimatePayableReward(runId, label, { description = "REFERRAL FIXTURE (financial history, kept)", displayName = "REFERRAL FIXTURE" } = {}) {
  const [ra, rb] = [letters(), letters()];
  const hash = (x) => crypto.createHash("sha256").update(`${runId}-${label}-${x}`).digest("hex");
  const [referrer] = await db("referral_identities", "POST", { referral_id: ra, subject_type: "CUSTOMER", device_id_hash: hash("a"), subject_key: ra });
  const [referred] = await db("referral_identities", "POST", { referral_id: rb, subject_type: "CUSTOMER", device_id_hash: hash("b"), subject_key: rb });
  const [attribution] = await db("referral_attributions", "POST", { referred_identity_id: referred.id, referrer_identity_id: referrer.id });
  const [request] = await db("service_requests", "POST", { request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true, customer_id: rb, customer_display_name: displayName, service_slug: "boiler", country: "KR", sido: `${runId}-REF`, gungu: "G1", description: `${runId} ${label} ${description}`, status: "COMPLETED" });
  const settle = async (status) => (await fetch(`${base}/api/sys/requests/${request.id}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status }) })).json().catch(() => ({}));
  const pending = await settle("PAYMENT_PENDING");
  const settled = await settle("SETTLED");
  const [reward] = await db(`referral_rewards?qualifying_request_id=eq.${request.id}&select=*`);
  if (reward?.state !== "QUALIFIED") throw new Error(`legitimatePayableReward: no QUALIFIED reward after settlement (${JSON.stringify({ pending: pending?.status ?? pending?.code, settled: settled?.status ?? settled?.code, reward: settled?.reward })})`);
  const promoted = await call("promote_referral_reward_payable", { p_reward_id: reward.id });
  if (!promoted?.success) throw new Error(`legitimatePayableReward: promotion refused (${promoted?.code})`);
  return { referrer, referred, attribution, request, reward: { ...reward, state: "PAYABLE" }, promoted };
}

/**
 * FABRICATED payment observation (DB fixture, NOT a chain payment) against an intent the product itself
 * created (e.g. the browser's own POST /api/checkouts/{id}/payment): same network / mint / recipient /
 * amount, signature prefixed FIXTURE. Only for test_fixture checkouts (refused otherwise, so a real
 * checkout can never be activated this way); purge_payment_fixture() removes everything afterwards.
 * Activation stays external_payment_verified=false (no chain payout ever exists for it).
 */
export async function fixtureObserveIntent(intentId) {
  const [intent] = await db(`payment_intents?id=eq.${intentId}&select=id,checkout_id,network,mint,recipient,amount_base_units,status`);
  const [checkout] = intent ? await db(`service_checkouts?id=eq.${intent.checkout_id}&select=test_fixture`) : [];
  if (!checkout?.test_fixture) throw new Error("fixtureObserveIntent: refused - not a test_fixture checkout");
  if (intent.network !== "solana-devnet") throw new Error("fixtureObserveIntent: refused - devnet only");
  return call("record_payment_observation", { p_intent_id: intent.id, p_network: intent.network, p_signature: fixtureSignature(), p_slot: 1, p_mint: intent.mint, p_recipient: intent.recipient, p_amount_base_units: Number(intent.amount_base_units), p_reference_matched: true, p_tx_success: true, p_confirmation: "finalized" });
}

export function moneyFixtures(fx, runId) {
  const checkouts = new Set();
  const form = (customer, label) => ({ p_customer_id: customer, p_customer_display_name: `FX · ${customer}`, p_customer_locale: "en", p_country: "KR", p_sido: fx.sido, p_gungu: "G1", p_dong: "", p_address: "fixture", p_description: `${runId} ${label}`, p_selected_options: [] });

  async function helperWithPrice(label, basePrice = 60000) {
    const h = await fx.createHelper(label, { service: "clog-clearing" });
    const price = await call("upsert_helper_service_price", { p_helper_id: h.helper.id, p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: basePrice, materials_policy: "INCLUDED" }, p_publish: true });
    return { ...h, price };
  }
  async function helperCheckout(h, customer, label) {
    const c = await call("create_helper_price_checkout", { ...form(customer, label), p_price_id: h.price.price_id, p_price_revision: h.price.revision, p_test_fixture: true });
    if (c?.checkout_id) checkouts.add(c.checkout_id);
    return c;
  }
  async function offerCheckout(customer, label, amount = 70000) {
    const c = await call("create_customer_offer_checkout", { ...form(customer, label), p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: amount, materials_policy: "INCLUDED" }, p_test_fixture: true });
    if (c?.checkout_id) checkouts.add(c.checkout_id);
    return c;
  }
  /** FABRICATED funding (DB fixture, not a chain payment): quote -> intent -> finalized observation. */
  async function fixtureFund(checkoutId, customer) {
    const q = await call("create_payment_quote", { p_checkout_id: checkoutId, p_customer_id: customer, p_network: "solana-devnet", p_mint: DEVNET_USDC, p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: "fixture-no-chain", p_ttl_seconds: 600 });
    const i = await call("create_payment_intent", { p_quote_id: q.quote_id, p_customer_id: customer, p_recipient: STAGING_RECIPIENT, p_reference: base58Of32() });
    const paid = await call("record_payment_observation", { p_intent_id: i.intent_id, p_network: "solana-devnet", p_signature: fixtureSignature(), p_slot: 1, p_mint: DEVNET_USDC, p_recipient: STAGING_RECIPIENT, p_amount_base_units: Number(i.amount_base_units), p_reference_matched: true, p_tx_success: true, p_confirmation: "finalized" });
    const requestId = paid?.activation?.request_id ?? null;
    if (requestId) fx.created.requestIds.add(requestId);
    return { quote: q, intent: i, paid, requestId };
  }
  const helperAction = async (h, assignmentId, action) => {
    const r = await fetch(`${base}/api/helper/assignments/${assignmentId}/${action}`, { method: "POST", headers: h.auth });
    return r.status;
  };
  /** Helper payout obligation: fixture-funded Mode A -> Helper accept / start / complete (real API) -> customer "서비스 완료" (RPC). */
  async function payoutObligation(label) {
    const h = await helperWithPrice(label);
    const customer = `OB${letters(6)}`;
    const checkout = await helperCheckout(h, customer, `payout ${label}`);
    const funded = await fixtureFund(checkout.checkout_id, customer);
    const [asg] = await db(`request_assignments?request_id=eq.${funded.requestId}&status=eq.PENDING&select=id`);
    const steps = [await helperAction(h, asg?.id, "accept"), await helperAction(h, asg?.id, "start"), await helperAction(h, asg?.id, "complete")];
    const confirmation = await call("confirm_service_completion", { p_request_id: funded.requestId, p_customer_id: customer });
    return { helper: h, customer, checkout, funded, steps, confirmation, obligationId: confirmation?.payout_obligation_id ?? null, requestId: funded.requestId, intentId: funded.intent.intent_id };
  }
  /** Refund obligation: fixture-funded open customer offer, cancelled by its owner (RPC). */
  async function refundObligation(label) {
    const customer = `RF${letters(6)}`;
    const checkout = await offerCheckout(customer, `refund ${label}`);
    const funded = await fixtureFund(checkout.checkout_id, customer);
    const cancel = await call("cancel_funded_request", { p_request_id: funded.requestId, p_customer_id: customer });
    return { customer, checkout, funded, cancel, refundId: cancel?.refund_id ?? null, requestId: funded.requestId, intentId: funded.intent.intent_id };
  }
  /**
   * Referral payout obligation. Financial history is non-deletable by schema, so this fixture's
   * reward / obligation / job (and the identities + legacy request they reference) REMAIN, tagged
   * with the run id; the job is finalized to REVIEW_REQUIRED so nothing ever processes it.
   * The reward follows the legitimate flow (settled request -> QUALIFIED -> promotion), never a direct write.
   */
  async function referralObligation() {
    const r = await legitimatePayableReward(runId, "OUTBOX", { description: "OUTBOX REFERRAL FIXTURE (financial history, kept)", displayName: "OUTBOX FIXTURE" });
    const created = await call("create_referral_payout_obligation", { p_reward_id: r.reward.id, p_rail: "USDC_SOLANA", p_country: "KR" });
    return { ...r, created, obligationId: created?.payout_obligation_id ?? null };
  }
  const jobFor = async (link) => (await db(`money_movement_jobs?${link.refundId ? "service_refund_id" : "payout_obligation_id"}=eq.${link.refundId ?? link.obligationId}&select=*`));
  const attemptsOf = (jobId) => db(`money_movement_attempts?job_id=eq.${jobId}&select=*&order=attempt_number`);

  /** Remove request children, purge fixture checkouts (money rows + their jobs), then helpers / users. */
  async function cleanup() {
    await fx.cleanup(); // request children (requests themselves are removed by the purge)
    const purged = [];
    for (const id of checkouts) purged.push((await rpc("purge_payment_fixture", { p_checkout_id: id })).data?.success === true);
    const leftovers = await fx.cleanup();
    return { purged, leftovers, checkouts: [...checkouts] };
  }
  return { checkouts, helperWithPrice, helperCheckout, offerCheckout, fixtureFund, payoutObligation, refundObligation, referralObligation, jobFor, attemptsOf, cleanup };
}

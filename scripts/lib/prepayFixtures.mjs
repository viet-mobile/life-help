// Shared PGlite fixtures for the prepaid marketplace / money outbox tests: the REAL migration chain,
// no network, no staging, no blockchain. Everything runs as the PGlite superuser (as migrations do);
// role privileges are checked explicitly with has_*_privilege where a test needs them.
import fs from "node:fs";
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../../supabase/migrations/", import.meta.url);
export const sqlOf = (name) => fs.readFileSync(new URL(name, dir), "utf8").replace(/create extension if not exists pgcrypto[^;]*;/gi, "");
export const MIGRATIONS = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
export const OUTBOX_MIGRATION = "202609270015_financial_outbox_media_cleanup.sql";
export const MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const b58 = (n = 44) => Array.from(crypto.randomBytes(n), (b) => B58[b % 58]).join("");
/** A real 32-byte public-key-shaped address (base58 of 32 random bytes). */
export function pubkey() {
  const bytes = crypto.randomBytes(32);
  let n = BigInt("0x" + bytes.toString("hex")), s = "";
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  for (const b of bytes) { if (b === 0) s = "1" + s; else break; }
  return s;
}

/** Fresh database with every migration strictly before `until` applied (default: all). */
export async function createDb({ until } = {}) {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key); create function auth.uid() returns uuid language sql as $$ select null::uuid $$;");
  for (const name of MIGRATIONS.filter((f) => !until || f < until)) await db.exec(sqlOf(name));
  return db;
}

export function fixtures(db) {
  const one = async (text, params = []) => (await db.query(text, params)).rows[0];
  const all = async (text, params = []) => (await db.query(text, params)).rows;
  const rpc = async (fn, ...args) => (await one(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) as r`, args)).r;
  const fails = async (text, params = []) => { try { await db.query(text, params); return null; } catch (error) { return error; } };
  const recipient = b58();
  let seq = 0;

  async function enablePolicies() {
    for (const cap of ["USDC_CUSTOMER_PAYMENT", "USDC_HELPER_PAYOUT", "USDC_REFERRAL_PAYOUT"]) {
      await db.query("insert into public.payment_rail_policies (country, capability, network, provider, enabled, approved_by, notes) values ('KR', $1, 'solana-devnet', 'SOLANA_DIRECT_DEVNET', true, 'test', 'deterministic test only') on conflict do nothing", [cap]);
    }
  }
  async function helper(label, { sido = "P" } = {}) {
    const row = await one("insert into public.helpers (helper_id, name, email, sido, rating, completed_jobs, is_active, on_duty, primary_locale) values ($1, $2, $3, $4, 5, 0, true, true, 'ko') returning id, helper_id", [`HLP-${label}`, `Name ${label}`, `${label.toLowerCase()}@example.test`, sido]);
    for (const s of ["clog-clearing", "boiler"]) await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, $2)", [row.id, s]);
    await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', $2, 'G1')", [row.id, sido]);
    return row;
  }
  const price = (h, base = 60000) => rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: base, materials_policy: "INCLUDED" }), true);
  const helperCheckout = (priceRow, customer, sido = "P") => rpc("create_helper_price_checkout", customer, `ID · ${customer}`, "en", "KR", sido, "G1", "D1", "street 1", "desc", [], priceRow.price_id, priceRow.revision, true);
  const offerCheckout = (customer, amount = 70000) => rpc("create_customer_offer_checkout", customer, `ID · ${customer}`, "en", "KR", "P", "G1", "D1", "street 9", "desc", [], "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", offered_amount: amount, materials_policy: "INCLUDED" }), true);
  async function fund(checkout, customer) {
    const q = await rpc("create_payment_quote", checkout.checkout_id, customer, "solana-devnet", MINT, 1400, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
    const i = await rpc("create_payment_intent", q.quote_id, customer, recipient, b58());
    const paid = await rpc("record_payment_observation", i.intent_id, "solana-devnet", b58() + b58(), 1, MINT, recipient, Number(i.amount_base_units), true, true, "finalized");
    return { q, i, paid, requestId: paid.activation?.request_id };
  }
  const activeAssignments = (requestId) => all("select id, helper_id, status from public.request_assignments where request_id = $1 and status in ('PENDING','NOTIFIED','ACCEPTED')", [requestId]);
  async function setDestination(h, address = pubkey()) {
    await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_payee_token, masked_destination, status) values ($1, 'KR', 'USDC', 'USDC_SOLANA', 'SOLANA_DIRECT_DEVNET', $2, 'xxxx', 'ACTIVE')", [h.id, address]);
    return address;
  }
  /** Funded Mode A request, completed by the Helper and confirmed by the customer -> one payout obligation. */
  async function completedPayout(label, { withDestination = true } = {}) {
    seq += 1;
    const sido = `S${label}${seq}`;
    const h = await helper(`${label}${seq}`, { sido });
    const destination = withDestination ? await setDestination(h) : null;
    const p = await price(h);
    const customer = `C${label}${seq}`.padEnd(8, "X").slice(0, 8).toUpperCase();
    const checkout = await helperCheckout(p, customer, sido);
    const funded = await fund(checkout, customer);
    const [asg] = await activeAssignments(funded.requestId);
    await rpc("accept_assignment", asg.id, h.id);
    await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [funded.requestId]);
    await rpc("complete_assignment_service", asg.id, h.id);
    const conf = await rpc("confirm_service_completion", funded.requestId, customer);
    return { helper: h, destination, customer, checkout, funded, requestId: funded.requestId, obligationId: conf.payout_obligation_id, intentId: funded.i.intent_id, conf };
  }
  /** Funded open customer offer, cancelled by its owner -> one full refund obligation. */
  async function cancelledRefund(label) {
    seq += 1;
    const customer = `R${label}${seq}`.padEnd(8, "X").slice(0, 8).toUpperCase();
    const checkout = await offerCheckout(customer);
    const funded = await fund(checkout, customer);
    const cancel = await rpc("cancel_funded_request", funded.requestId, customer);
    return { customer, checkout, funded, requestId: funded.requestId, refundId: cancel.refund_id, intentId: funded.i.intent_id };
  }
  /** PAYABLE referral reward with an ACTIVE USDC destination for the referrer. */
  async function payableReward(label) {
    seq += 1;
    const letters = () => Array.from(crypto.randomBytes(8), (x) => String.fromCharCode(65 + (x % 26))).join("");
    const tag = letters();
    const referrer = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ($1, 'CUSTOMER', md5($1), $1) returning id", [tag])).id;
    const referredTag = letters();
    const referred = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ($1, 'CUSTOMER', md5($1), $1) returning id", [referredTag])).id;
    const attribution = (await one("insert into public.referral_attributions (referred_identity_id, referrer_identity_id) values ($1, $2) returning id", [referred, referrer])).id;
    const request = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) values ($1, 'x', 'boiler', 'KR', 'LEG', 'G1', 'old', 'SEARCHING', 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true) returning id", [referredTag])).id;
    const reward = (await one("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, 'PAYABLE') returning id", [attribution, request, referrer, referred])).id;
    const destination = pubkey();
    await db.query("insert into public.payout_destinations (owner_identity_id, country, currency, payout_method, provider, provider_payee_token, masked_destination, status) values ($1, 'KR', 'USDC', 'USDC_SOLANA', 'SOLANA_DIRECT_DEVNET', $2, 'xxxx', 'ACTIVE')", [referrer, destination]);
    return { rewardId: reward, referrer, destination };
  }
  /** Superuser-only test lever: move a checkout's expiry (the guard makes it immutable to the app). */
  async function backdateCheckout(checkoutId, interval = "1 hour") {
    await db.exec("alter table public.service_checkouts disable trigger service_checkouts_guard");
    await db.query(`update public.service_checkouts set expires_at = now() - interval '${interval}' where id = $1`, [checkoutId]);
    await db.exec("alter table public.service_checkouts enable trigger service_checkouts_guard");
  }
  const jobFor = (link) => one(`select * from public.money_movement_jobs where ${link.refundId ? "service_refund_id" : "payout_obligation_id"} = $1`, [link.refundId ?? link.obligationId]);
  const expireLease = (jobId) => db.query("update public.money_movement_jobs set claim_expires_at = now() - interval '1 second' where id = $1", [jobId]);
  const makeDue = (jobId) => db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second' where id = $1", [jobId]);

  return { one, all, rpc, fails, recipient, enablePolicies, helper, price, helperCheckout, offerCheckout, fund, activeAssignments, setDestination, completedPayout, cancelledRefund, payableReward, backdateCheckout, jobFor, expireLease, makeDue };
}

export function checker() {
  let failed = 0, passed = 0;
  const check = (name, condition, detail = "") => {
    if (condition) { passed += 1; console.log(`PASS ${name}`); }
    else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`); }
  };
  const done = () => {
    console.log(`${passed} passed, ${failed} failed`);
    if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");
  };
  return { check, done };
}

// Deterministic test of the unpaid-checkout expiry invariant on the REAL migration chain (PGlite):
//   an OPEN checkout past expires_at (+ the sweep's 15 min grace for in-flight payments) with no payment
//   beyond "awaiting" ends EXPIRED - whether or not a payment intent was ever created, and whether or not
//   its Helper reservation still exists. Paid / activated / cancelled checkouts are never touched.
// Regression for the two orphan checkouts of 2026-09-28 (browser crashed before any intent; the suite's
// cleanup then removed the Helper and, by cascade, the reservation).
// Usage: node scripts/test_checkout_expiry_db.mjs
import crypto from "node:crypto";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one, rpc } = f;
await f.enablePolicies();
const status = async (id) => (await one("select status from public.service_checkouts where id = $1", [id])).status;
const sweep = () => rpc("expire_stale_checkouts", 100);
const media = (checkoutId, customer) => rpc("register_request_media", checkoutId, customer, "R2_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 10);
let n = 0;
async function modeA(label) {
  n += 1;
  const sido = `X${label}${n}`;
  const h = await f.helper(`${label}${n}`, { sido });
  const p = await f.price(h);
  const customer = `C${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const c = await f.helperCheckout(p, customer, sido);
  return { h, customer, checkoutId: c.checkout_id };
}

// ---- 1. the orphan shape: no intent, reservation gone with its Helper, no request ----
const o = await modeA("ORPH");
const om = await media(o.checkoutId, o.customer);
for (const t of ["helper_services", "helper_regions"]) await db.query(`delete from public.${t} where helper_id = $1`, [o.h.id]);
await db.query("delete from public.helpers where id = $1", [o.h.id]);
const oShape = await one("select (select count(*)::int from public.payment_intents where checkout_id = $1) intents, (select count(*)::int from public.helper_checkout_reservations where checkout_id = $1) reservations, (select request_id from public.service_checkouts where id = $1) request", [o.checkoutId]);
check("1a. orphan shape: OPEN, no payment intent, no reservation (cascaded with the Helper), no request", (await status(o.checkoutId)) === "OPEN" && oShape.intents === 0 && oShape.reservations === 0 && oShape.request === null, JSON.stringify(oShape));
await f.backdateCheckout(o.checkoutId, "5 minutes");
const inGrace = await sweep();
check("1b. inside the 15 min grace (payments may still be in flight) the sweep leaves it OPEN, media ACTIVE", inGrace.expired === 0 && (await status(o.checkoutId)) === "OPEN" && (await one("select status from public.request_media where id = $1", [om.media_id])).status === "ACTIVE");
await f.backdateCheckout(o.checkoutId, "16 minutes");
const past = await sweep();
const omRow = await one("select status, deletion_reason from public.request_media where id = $1", [om.media_id]);
check("1c. past expiry + grace: EXPIRED; its media DELETION_PENDING (CHECKOUT_EXPIRED) for the single 015 deletion lifecycle", past.expired === 1 && (await status(o.checkoutId)) === "EXPIRED" && omRow.status === "DELETION_PENDING" && omRow.deletion_reason === "CHECKOUT_EXPIRED" && past.media_queued === 1, JSON.stringify([past, omRow]));
check("1d. expiry is terminal: a later sweep changes nothing; no request was created", (await sweep()).expired === 0 && (await status(o.checkoutId)) === "EXPIRED" && (await one("select request_id from public.service_checkouts where id = $1", [o.checkoutId])).request_id === null);

// ---- 2. reservation expiry and checkout expiry are distinct ----
const r = await modeA("RSV");
await db.query("update public.helper_checkout_reservations set expires_at = now() - interval '1 second' where checkout_id = $1", [r.checkoutId]);
await db.query("select public.expire_helper_reservations()");
const quote = await rpc("create_payment_quote", r.checkoutId, r.customer, "solana-devnet", "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", 1400, "TEST_SANDBOX_FX", "fixed", 600);
check("2a. the reservation can expire first: reservation EXPIRED, checkout no longer payable (RESERVATION_EXPIRED) and ended by that payment attempt", (await one("select status from public.helper_checkout_reservations where checkout_id = $1", [r.checkoutId])).status === "EXPIRED" && quote.code === "RESERVATION_EXPIRED" && (await status(r.checkoutId)) === "EXPIRED", JSON.stringify(quote));
const r2 = await modeA("RSV2");
await db.query("update public.helper_checkout_reservations set expires_at = now() - interval '1 second' where checkout_id = $1", [r2.checkoutId]);
await db.query("select public.expire_helper_reservations()");
const stillOpen = (await status(r2.checkoutId)) === "OPEN";
await sweep();
const afterEarlySweep = await status(r2.checkoutId);
await f.backdateCheckout(r2.checkoutId, "16 minutes");
await sweep();
check("2b. without a payment attempt: reservation expired, checkout stays OPEN until its own expiry, then the sweep ends it - a missing reservation never makes a checkout immortal", stillOpen && afterEarlySweep === "OPEN" && (await status(r2.checkoutId)) === "EXPIRED");

// ---- 3. unpaid intents: a live one defers expiry, an expired one does not ----
const a = await modeA("INT");
const qa = await rpc("create_payment_quote", a.checkoutId, a.customer, "solana-devnet", "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", 1400, "TEST_SANDBOX_FX", "fixed", 600);
const ia = await rpc("create_payment_intent", qa.quote_id, a.customer, f.recipient, b58());
await f.backdateCheckout(a.checkoutId, "20 minutes");
const withLiveIntent = await sweep();
const liveStatus = await status(a.checkoutId);
// Superuser-only test lever (as backdateCheckout): the intent's expiry is immutable to the app.
await db.exec("alter table public.payment_intents disable trigger payment_intents_guard");
await db.query("update public.payment_intents set expires_at = now() - interval '20 minutes' where id = $1", [ia.intent_id]);
await db.exec("alter table public.payment_intents enable trigger payment_intents_guard");
await sweep();
check("3. an AWAITING intent still inside its window defers expiry (payment may land); once that intent is stale too, checkout EXPIRED and intent EXPIRED", ia.success && withLiveIntent.expired === 0 && liveStatus === "OPEN" && (await status(a.checkoutId)) === "EXPIRED" && (await one("select status::text s from public.payment_intents where id = $1", [ia.intent_id])).s === "EXPIRED", JSON.stringify([ia, withLiveIntent]));

// ---- 4. Mode B (customer offer) abandonment ----
const b = await f.offerCheckout("OFFERXXQ");
await f.backdateCheckout(b.checkout_id, "16 minutes");
await sweep();
check("4. abandoned customer-offer checkout -> EXPIRED, its offer EXPIRED (never visible to Helpers), no request", (await status(b.checkout_id)) === "EXPIRED" && (await one("select o.status from public.customer_offers o join public.service_checkouts c on c.customer_offer_id = o.id where c.id = $1", [b.checkout_id])).status === "EXPIRED" && (await one("select request_id from public.service_checkouts where id = $1", [b.checkout_id])).request_id === null);

// ---- 5. never touched: paid / activated, cancelled ----
const p = await modeA("PAID");
const funded = await f.fund({ checkout_id: p.checkoutId }, p.customer);
await f.backdateCheckout(p.checkoutId, "2 hours");
await sweep();
const req = await one("select status from public.service_requests where id = $1", [funded.requestId]);
check("5a. a paid (PAID_HELD) activated checkout is never expired; its funded request stays active", (await status(p.checkoutId)) === "ACTIVATED" && funded.paid?.status === "PAID_HELD" && !!req && !["CANCELLED", "CLOSED"].includes(req.status), JSON.stringify([funded.paid?.status, req]));
const c = await modeA("CANC");
await rpc("cancel_open_checkout", c.checkoutId, c.customer);
await f.backdateCheckout(c.checkoutId, "2 hours");
await sweep();
check("5b. a cancelled checkout stays CANCELLED (the sweep only ends OPEN checkouts)", (await status(c.checkoutId)) === "CANCELLED");

done();

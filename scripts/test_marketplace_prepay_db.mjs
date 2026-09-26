// Deterministic test of migration 202609270014 (two-sided marketplace + prepaid requests + payment
// hold / release ledger + USDC-on-Solana foundation + protected request media) against the REAL
// migration SQL of the whole chain in PGlite. No network, no staging, no blockchain, no production.
// PGlite is a single connection: "concurrent" cases are exercised as interleaved calls against the
// same row locks / unique indexes; true parallel races are a live staging test after 014 is applied.
// Usage: node scripts/test_marketplace_prepay_db.mjs
import fs from "node:fs";
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const sql = (name) => fs.readFileSync(new URL(name, dir), "utf8").replace(/create extension if not exists pgcrypto[^;]*;/gi, "");
const ALL = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const MIGRATION = "202609270014_marketplace_prepay_usdc_foundation.sql";

let failed = 0, passed = 0;
function check(name, condition, detail = "") {
  if (condition) { passed += 1; console.log(`PASS ${name}`); }
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const db = new PGlite();
await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key); create function auth.uid() returns uuid language sql as $$ select null::uuid $$;");
for (const name of ALL.filter((f) => f < MIGRATION)) await db.exec(sql(name));
const one = async (text, params = []) => (await db.query(text, params)).rows[0];
const all = async (text, params = []) => (await db.query(text, params)).rows;
const rpc = async (fn, ...args) => (await one(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) as r`, args)).r;
const fails = async (text, params = []) => { try { await db.query(text, params); return null; } catch (error) { return error; } };

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const b58 = () => Array.from(crypto.randomBytes(44), (b) => B58[b % 58]).join("");
const MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const RECIPIENT = b58();

async function helper(label, { sido = "P", rating = 5, services = ["clog-clearing", "boiler", "hospital-help"] } = {}) {
  const row = await one("insert into public.helpers (helper_id, name, email, sido, rating, completed_jobs, is_active, on_duty, primary_locale) values ($1, $2, $3, $4, $5, 0, true, true, 'ko') returning id, helper_id", [`HLP-${label}`, `Name ${label}`, `${label.toLowerCase()}@private.example`, sido, rating]);
  for (const s of services) await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, $2)", [row.id, s]);
  await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', $2, 'G1')", [row.id, sido]);
  return row;
}
const price = (h, subitem, base, service = "clog-clearing", extra = {}) => rpc("upsert_helper_service_price", h.id, service, subitem, JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: base, materials_policy: "INCLUDED", ...extra }), true);

// ================= pre-014 state (legacy rows) =================
const legacyH = await helper("LEG", { sido: "LEGACY" });
const legacyAuto = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status) values ('LEGACYAA', 'x', 'boiler', 'KR', 'LEGACY', 'G1', 'old', 'SEARCHING') returning id")).id;
const legacyPrice = await price(legacyH, "toilet-simple", 50000);
const legacySel = await rpc("create_customer_selected_request", crypto.randomUUID(), "LEGACYBB", "x", "en", "KR", "LEGACY", "G1", "", "", "old", [], legacyPrice.price_id, legacyPrice.revision);

await db.exec(sql(MIGRATION));
check("014 applies on top of the full real chain (0001 -> 013) with existing data", true);
const enumValues = (await all("select unnest(enum_range(null::public.service_request_status))::text v")).map((r) => r.v);
check("OPEN_FOR_HELPERS status exists (Part 1 committed separately)", enumValues.includes("OPEN_FOR_HELPERS") && enumValues.includes("CUSTOMER_RESELECTION_REQUIRED"));
const back = await all("select id, request_mode, selection_mode, legacy_unfunded from public.service_requests order by created_at");
check("Backfill: every pre-014 row explicit + legacy (auto -> LEGACY_AUTO_MATCH, selected -> HELPER_PRICE_SELECTED)", back.length === 2 && back.every((r) => r.legacy_unfunded) && back.find((r) => r.id === legacyAuto)?.request_mode === "LEGACY_AUTO_MATCH" && back.find((r) => r.id !== legacyAuto)?.request_mode === "HELPER_PRICE_SELECTED", JSON.stringify(back));

// ================= prepaid invariant at the database =================
check("Unpaid non-legacy request cannot exist (prepaid check)", /service_requests_prepaid_check/.test(String((await fails("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, status, request_mode, selection_mode) values ('X','x','boiler','KR','P','G1','MATCHED','HELPER_PRICE_SELECTED','CUSTOMER_SELECTED')"))?.message)));
check("Request mode is required (never inferred from nulls)", /request_mode/.test(String((await fails("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, status, legacy_unfunded) values ('X','x','boiler','KR','P','G1','SEARCHING', true)"))?.message)));
check("Unpaid open customer offer is impossible even when flagged legacy", !!(await fails("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, status, request_mode, selection_mode, legacy_unfunded) values ('X','x','boiler','KR','P','G1','OPEN_FOR_HELPERS','CUSTOMER_OFFER_OPEN','CUSTOMER_OFFER', true)")));
check("request_mode immutable; a legacy row cannot lose its legacy marker without funding", !!(await fails("update public.service_requests set request_mode = 'HELPER_PRICE_SELECTED' where id = $1", [legacyAuto])) && !!(await fails("update public.service_requests set legacy_unfunded = false where id = $1", [legacyAuto])));

// ================= access =================
const moneyTables = ["payment_intents", "payment_quotes", "service_checkouts", "customer_offers", "payout_obligations", "service_refunds", "payment_chain_transactions", "customer_completion_confirmations", "request_media", "payment_rail_policies", "helper_checkout_reservations"];
const priv = await all(`select t, has_table_privilege('anon', 'public.' || t, 'select') a_s, has_table_privilege('authenticated', 'public.' || t, 'select') u_s,
  has_table_privilege('service_role', 'public.' || t, 'select') s_s, has_table_privilege('service_role', 'public.' || t, 'insert') s_i,
  has_table_privilege('service_role', 'public.' || t, 'update') s_u, has_table_privilege('service_role', 'public.' || t, 'delete') s_d
  from unnest($1::text[]) t`, [moneyTables]);
check("Money + media tables: anon / authenticated nothing; service_role SELECT only (writes only via RPCs)", priv.every((p) => !p.a_s && !p.u_s && p.s_s && !p.s_i && !p.s_u && !p.s_d), JSON.stringify(priv.filter((p) => p.a_s || p.u_s || !p.s_s || p.s_i || p.s_u || p.s_d)));
const fnPriv = await one("select has_function_privilege('anon', 'public.confirm_service_completion(uuid, text)', 'execute') a, has_function_privilege('authenticated', 'public.accept_customer_offer_request(uuid, uuid)', 'execute') b, has_function_privilege('service_role', 'public.activate_funded_checkout(uuid)', 'execute') c, has_function_privilege('service_role', 'public.confirm_service_completion(uuid, text)', 'execute') d");
check("RPCs: anon / authenticated none; internal activation not callable even by service_role", !fnPriv.a && !fnPriv.b && !fnPriv.c && fnPriv.d, JSON.stringify(fnPriv));
check("service_role cannot directly write request funding / mode / completion columns", !(await one("select has_column_privilege('service_role', 'public.service_requests', 'funding_payment_intent_id', 'update') x")).x && !(await one("select has_column_privilege('service_role', 'public.service_requests', 'customer_completed_at', 'update') x")).x);

// ================= fixtures =================
const h1 = await helper("H1", { rating: 5 });
const h2 = await helper("H2", { rating: 4 });
const h3 = await helper("H3", { rating: 3 });
const far = await helper("FAR", { sido: "ELSEWHERE" });
const p1 = await price(h1, "toilet-simple", 60000);
const p2 = await price(h2, "toilet-simple", 75000);
await price(h3, "toilet-simple", 55000);
await price(far, "toilet-simple", 50000);
const statusOf = async (id) => (await one("select status::text from public.service_requests where id = $1", [id]))?.status;
const intentOf = async (id) => one("select * from public.payment_intents where id = $1", [id]);
const activeOf = (requestId) => all("select id, helper_id, status from public.request_assignments where request_id = $1 and status in ('PENDING','NOTIFIED','ACCEPTED')", [requestId]);
const helperA = (priceRow, customer, opts = {}) => rpc("create_helper_price_checkout", customer, `ID · ${customer}`, "en", "KR", opts.sido ?? "P", "G1", "D1", "secret street 1", "desc", [], priceRow.price_id, priceRow.revision, opts.fixture ?? true);
const offerB = (customer, offer, subitem = "toilet-simple", service = "clog-clearing") => rpc("create_customer_offer_checkout", customer, `ID · ${customer}`, "en", "KR", "P", "G1", "D1", "secret street 9", "private description", [], service, subitem, JSON.stringify(offer), true);
const quote = (checkoutId, customer, { network = "solana-devnet", mint = MINT, rate = 1400 } = {}) => rpc("create_payment_quote", checkoutId, customer, network, mint, rate, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
const intent = (quoteId, customer) => rpc("create_payment_intent", quoteId, customer, RECIPIENT, b58());
const observe = (intentRow, o = {}) => rpc("record_payment_observation", intentRow.intent_id ?? intentRow.id, o.network ?? "solana-devnet", o.signature ?? b58() + b58(), 1, o.mint ?? MINT, o.recipient ?? RECIPIENT, o.amount ?? Number(intentRow.amount_base_units), o.reference ?? true, o.success ?? true, o.confirmation ?? "finalized");
async function fundedCheckout(checkout, customer) {
  const q = await quote(checkout.checkout_id, customer);
  const i = await intent(q.quote_id, customer);
  const paid = await observe(i);
  return { q, i, paid, requestId: paid.activation?.request_id };
}

// ================= country / rail policy =================
const polCheckout = await helperA(p1, "POLICYCU");
check("Rail disabled by default: no quote without an enabled country / network policy", (await quote(polCheckout.checkout_id, "POLICYCU")).code === "PAYMENT_RAIL_DISABLED");
check("Mainnet quote refused; mainnet policy cannot even be enabled", (await quote(polCheckout.checkout_id, "POLICYCU", { network: "solana-mainnet", mint: MAINNET_MINT })).code === "MAINNET_DISABLED" && !!(await fails("insert into public.payment_rail_policies (country, capability, network, provider, enabled) values ('KR', 'USDC_CUSTOMER_PAYMENT', 'solana-mainnet', 'PSP_PENDING', true)")));
await db.query("insert into public.payment_rail_policies (country, capability, network, provider, enabled, approved_by, notes) values ('KR', 'USDC_CUSTOMER_PAYMENT', 'solana-devnet', 'SOLANA_DIRECT_DEVNET', true, 'test', 'deterministic test only')");
check("Non-native USDC mint refused (native USDC only)", (await quote(polCheckout.checkout_id, "POLICYCU", { mint: MAINNET_MINT })).code === "NATIVE_USDC_REQUIRED");
check("FX must come from an explicit provider (no rate -> FX_UNAVAILABLE)", (await rpc("create_payment_quote", polCheckout.checkout_id, "POLICYCU", "solana-devnet", MINT, 0, "TEST_SANDBOX_FX", null, 600)).code === "FX_UNAVAILABLE");
await db.query("update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where checkout_id = $1", [polCheckout.checkout_id]);

// ================= 49: MODE A =================
const ca = await helperA(p1, "CUSTA001");
const reqBefore = await one("select count(*)::int n from public.service_requests where customer_id = 'CUSTA001'");
const asgBefore = await one("select count(*)::int n from public.request_assignments where helper_id = $1", [h1.id]);
check("49a. MODE A checkout (H1 60,000): no request, no assignment, Helper reserved for the payment window", ca.success && Number(ca.fiat_amount) === 60000 && reqBefore.n === 0 && asgBefore.n === 0 && (await one("select status from public.helper_checkout_reservations where checkout_id = $1", [ca.checkout_id])).status === "ACTIVE", JSON.stringify(ca));
const others = await rpc("list_customer_offers", "clog-clearing", "toilet-simple", "KR", "P", "G1");
check("49b. Reserved H1 hidden from other customers' offer lists; another checkout for H1 refused", !others.some((o) => o.helper_id === h1.id) && (await helperA(p1, "CUSTA002")).code === "HELPER_NO_LONGER_AVAILABLE");
const qa = await quote(ca.checkout_id, "CUSTA001");
check("49c. Quote from the authoritative fiat amount: ceil(60,000 x 10^6 / 1,400) base units, native devnet USDC, explicit FX provider", qa.success && Number(qa.amount_base_units) === 42857143 && qa.mint === MINT && qa.fx_provider === "TEST_SANDBOX_FX", JSON.stringify(qa));
check("Quote row immutable", !!(await fails("update public.payment_quotes set fx_rate = 1 where id = $1", [qa.quote_id])));
const ia = await intent(qa.quote_id, "CUSTA001");
check("49d. Intent binds recipient / reference / mint / amount; wrong owner cannot use the quote", ia.success && ia.recipient === RECIPIENT && Number(ia.amount_base_units) === 42857143 && (await intent(qa.quote_id, "CUSTZZZZ")).code === "QUOTE_NOT_FOUND");
check("49e. One live intent per checkout (a second quote cannot open a parallel intent)", (await intent((await quote(ca.checkout_id, "CUSTA001")).quote_id, "CUSTA001")).code === "INTENT_ALREADY_OPEN");
const pending = await observe(ia, { confirmation: "confirmed" });
check("49f. Seen but not finalized -> CONFIRMING; still no request / assignment", pending.status === "CONFIRMING" && (await one("select count(*)::int n from public.service_requests where customer_id = 'CUSTA001'")).n === 0);
const sigA = b58() + b58();
const paidA = await observe(ia, { signature: sigA });
const rA = paidA.activation?.request_id;
const reqA = rA ? await one("select * from public.service_requests where id = $1", [rA]) : null;
const selA = rA ? await one("select * from public.request_price_selections where request_id = $1", [rA]) : null;
const asgA = rA ? await activeOf(rA) : [];
check("49g. Verified finalized exact payment -> atomically PAID_HELD + request MATCHED (HELPER_PRICE_SELECTED, funded)", paidA.status === "PAID_HELD" && reqA?.status === "MATCHED" && reqA.request_mode === "HELPER_PRICE_SELECTED" && reqA.funding_payment_intent_id === ia.intent_id && !reqA.legacy_unfunded && (await intentOf(ia.intent_id)).status === "PAID_HELD", JSON.stringify(paidA));
check("49h. + immutable v1 selection (H1 60,000, HELPER_PRICE source) + H1 PENDING assignment + reservation consumed + H1 notified", selA?.status === "ACCEPTED" && selA.helper_id === h1.id && Number(selA.initial_payable_amount) === 60000 && selA.source_kind === "HELPER_PRICE" && asgA.length === 1 && asgA[0].helper_id === h1.id && (await one("select status from public.helper_checkout_reservations where checkout_id = $1", [ca.checkout_id])).status === "CONSUMED" && (await all("select 1 from public.app_notifications where recipient_id = $1 and type = 'NEW_SERVICE_REQUEST' and payload->>'request_id' = $2", [h1.helper_id, rA])).length === 1);
check("Funded row cannot be re-flagged legacy; fabricated funding reference refused", !!(await fails("update public.service_requests set legacy_unfunded = true where id = $1", [rA])) && /FUNDING_NOT_VERIFIED/.test(String((await fails("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, status, request_mode, selection_mode, funding_payment_intent_id) values ('X','x','clog-clearing','KR','P','G1','MATCHED','HELPER_PRICE_SELECTED','CUSTOMER_SELECTED',$1)", [ia.intent_id]))?.message)));
check("49i. Replayed verification returns the same result; no second request", (await observe(ia, { signature: sigA })).replayed === true && (await one("select count(*)::int n from public.service_requests where customer_id = 'CUSTA001'")).n === 1);

// ================= 36/37: wrong payments =================
async function freshIntent(customer, priceRow = null) {
  const c = priceRow ? await helperA(priceRow, customer) : await offerB(customer, { pricing_mode: "FIXED", currency: "KRW", offered_amount: 30000, materials_policy: "INCLUDED" });
  const q = await quote(c.checkout_id, customer);
  const i = await intent(q.quote_id, customer);
  if (!i.success) throw new Error(`freshIntent ${customer}: ${JSON.stringify({ c, q, i })}`);
  return i;
}
const wrong = [];
for (const [label, o] of [["UNDERPAID", { amount: -1 }], ["OVERPAID", { amount: +1 }], ["WRONG_MINT", { mint: MAINNET_MINT }], ["WRONG_RECIPIENT", { recipient: b58() }], ["WRONG_NETWORK", { network: "solana-mainnet" }], ["MISSING_REFERENCE", { reference: false }]]) {
  const i = await freshIntent(`W${label.slice(0, 7)}`);
  const amount = o.amount ? Number(i.amount_base_units) + o.amount : undefined;
  const r = await observe(i, { ...o, amount });
  const st = await intentOf(i.intent_id);
  wrong.push([label, r.classification, st.status, (await one("select count(*)::int n from public.service_checkouts where id = $1 and status = 'ACTIVATED'", [st.checkout_id])).n]);
}
check("37a. Underpaid / overpaid / wrong mint / wrong recipient / wrong network / missing reference -> REVIEW_REQUIRED, never paid, never activated", wrong.every(([label, cls, status, activated]) => cls === label && status === "REVIEW_REQUIRED" && activated === 0), JSON.stringify(wrong));
const fi = await freshIntent("WFAILEDT");
const failedTx = await observe(fi, { success: false });
check("37b. Failed transaction recorded, intent still awaiting payment (nothing paid)", failedTx.code === "PAYMENT_TX_FAILED" && (await intentOf(fi.intent_id)).status === "AWAITING_PAYMENT");
const dupSig = b58() + b58();
const d1 = await freshIntent("WDUP0001");
await observe(d1, { signature: dupSig });
const d2 = await freshIntent("WDUP0002");
const dupResult = await observe(d2, { signature: dupSig });
check("37c. Duplicate signature (already credited to another intent) blocked; second intent stays unpaid", dupResult.code === "DUPLICATE_SIGNATURE" && (await intentOf(d2.intent_id)).status === "AWAITING_PAYMENT");
const extra = await observe(d1, {});
check("37d. A second payment for an already-paid intent -> REVIEW_REQUIRED, the paid intent is untouched", extra.code === "REVIEW_REQUIRED" && extra.classification === "EXTRA_PAYMENT" && (await intentOf(d1.intent_id)).status === "PAID_HELD");
const late = await freshIntent("WLATE001");
await db.exec("alter table public.payment_intents disable trigger payment_intents_guard");
await db.query("update public.payment_intents set expires_at = now() - interval '10 minutes' where id = $1", [late.intent_id]);
await db.exec("alter table public.payment_intents enable trigger payment_intents_guard");
const lateR = await observe(late, { amount: Number(late.amount_base_units) });
check("37e. Late transaction after the intent expired -> REVIEW_REQUIRED (expired quote requires a fresh quote)", lateR.classification === "LATE" && (await intentOf(late.intent_id)).status === "REVIEW_REQUIRED");

// ================= 57: tampering =================
const tamper = [];
for (const [label, stmt] of [
  ["fiat amount", "update public.payment_intents set fiat_amount = 1 where id = $1"],
  ["USDC amount", "update public.payment_intents set amount_base_units = 1 where id = $1"],
  ["mint", `update public.payment_intents set mint = '${MAINNET_MINT}' where id = $1`],
  ["recipient", `update public.payment_intents set recipient = '${b58()}' where id = $1`],
  ["network", "update public.payment_intents set network = 'solana-mainnet' where id = $1"],
  ["status skip to SETTLED", "update public.payment_intents set status = 'SETTLED' where id = $1"],
  ["status back to AWAITING", "update public.payment_intents set status = 'AWAITING_PAYMENT' where id = $1"],
]) tamper.push([label, !!(await fails(stmt, [ia.intent_id]))]);
const fresh = await freshIntent("WTAMPER1");
tamper.push(["PAID_HELD without verified tx", !!(await fails("update public.payment_intents set status = 'PAID_HELD' where id = $1", [fresh.intent_id]))]);
tamper.push(["FX rate on quote", !!(await fails("update public.payment_quotes set fx_rate = 0.01 where id = $1", [qa.quote_id]))]);
tamper.push(["checkout amount", !!(await fails("update public.service_checkouts set fiat_amount = 1 where id = $1", [ca.checkout_id]))]);
check("57. Payment tampering blocked even for the table owner: amounts / mint / recipient / network / FX / status transitions", tamper.every(([, blocked]) => blocked), JSON.stringify(tamper));

// ================= 58: price version binding (MODE A) =================
const cStale = await helperA(p2, "CUSTSTAL");
await price(h2, "toilet-simple", 80000);
const staleQuote = await quote(cStale.checkout_id, "CUSTSTAL");
check("58a. Helper price changed before payment -> CHECKOUT_STALE; checkout expired, reservation released", staleQuote.code === "CHECKOUT_STALE" && (await one("select status from public.service_checkouts where id = $1", [cStale.checkout_id])).status === "EXPIRED" && (await one("select status from public.helper_checkout_reservations where checkout_id = $1", [cStale.checkout_id])).status === "RELEASED");
const p2now = await one("select id as price_id, revision from public.helper_service_prices where helper_id = $1 and status = 'ACTIVE'", [h2.id]);
const cPinned = await helperA(p2now, "CUSTPIN1");
const qPinned = await quote(cPinned.checkout_id, "CUSTPIN1");
await price(h2, "toilet-simple", 99000);
check("58b. Price changed after the quote -> intent creation refused (CHECKOUT_STALE); customer must reconfirm", (await intent(qPinned.quote_id, "CUSTPIN1")).code === "CHECKOUT_STALE");
const p2latest = await one("select id as price_id, revision from public.helper_service_prices where helper_id = $1", [h2.id]);
const cHonor = await helperA(p2latest, "CUSTPIN2");
const qHonor = await quote(cHonor.checkout_id, "CUSTPIN2");
const iHonor = await intent(qHonor.quote_id, "CUSTPIN2");
await price(h2, "toilet-simple", 120000);
const honored = await observe(iHonor);
const honorSel = await one("select initial_payable_amount from public.request_price_selections where request_id = $1", [honored.activation?.request_id]);
check("58c. Payment already bound: the customer gets exactly the confirmed 99,000 terms (never the new price, never another Helper)", Number(honorSel?.initial_payable_amount) === 99000 && (await activeOf(honored.activation.request_id))[0]?.helper_id === h2.id);

// ================= Helper unavailable during payment =================
const h4 = await helper("H4");
const p4 = await price(h4, "sink", 40000);
const cGone = await helperA(p4, "CUSTGONE");
const iGone = await intent((await quote(cGone.checkout_id, "CUSTGONE")).quote_id, "CUSTGONE");
await db.query("update public.helpers set on_duty = false where id = $1", [h4.id]);
const gone = await observe(iGone);
const rGone = gone.activation?.request_id;
const goneSel = rGone ? await one("select status, ended_reason, helper_id from public.request_price_selections where request_id = $1", [rGone]) : null;
check("12. Chosen Helper unavailable at payment: funds held, request CUSTOMER_RESELECTION_REQUIRED, v1 ended (no silent H2 / price substitution)", gone.status === "PAID_HELD" && (await statusOf(rGone)) === "CUSTOMER_RESELECTION_REQUIRED" && goneSel?.status === "ENDED" && goneSel.ended_reason === "HELPER_UNAVAILABLE_AT_ACTIVATION" && (await activeOf(rGone)).length === 0 && (await all("select 1 from public.app_notifications where type = 'CUSTOMER_RESELECTION_REQUIRED' and payload->>'request_id' = $1", [rGone])).length === 1, JSON.stringify({ gone, goneSel }));
const h4back = await db.query("update public.helpers set on_duty = true where id = $1", [h4.id]);
void h4back;

// ================= reservation hygiene =================
const cR1 = await helperA(await one("select id as price_id, revision from public.helper_service_prices where helper_id = $1", [h3.id]), "CUSTRES1");
const cR2 = await helperA(await one("select id as price_id, revision from public.helper_service_prices where helper_id = $1", [h3.id]), "CUSTRES2");
await db.query("update public.helper_checkout_reservations set expires_at = now() - interval '1 second' where checkout_id = $1", [cR1.checkout_id]);
const cR3 = await helperA(await one("select id as price_id, revision from public.helper_service_prices where helper_id = $1", [h3.id]), "CUSTRES2");
check("Reservation: another customer blocked while active; expires by itself (10 min TTL, lazily) and never becomes an assignment", cR1.success && cR2.code === "HELPER_NO_LONGER_AVAILABLE" && cR3.success && (await one("select status from public.helper_checkout_reservations where checkout_id = $1", [cR1.checkout_id])).status === "EXPIRED" && (await all("select 1 from public.request_assignments where helper_id = $1", [h3.id])).length === 0);
const h5 = await helper("H5");
const p5 = await price(h5, "floor-drain", 30000);
const cSwitch = await helperA(p5, "CUSTRES2");
check("A customer holds one Helper at a time (a new choice releases the previous reservation)", cSwitch.success && (await one("select status from public.helper_checkout_reservations where checkout_id = $1", [cR3.checkout_id])).status === "RELEASED");
await db.query("update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where status = 'ACTIVE'");

// ================= 50: MODE B =================
// Fresh, free Helpers (the MODE A Helpers above are correctly busy with their funded requests).
const b1 = await helper("B1", { rating: 5 });
const b2 = await helper("B2", { rating: 4 });
const b3 = await helper("B3", { rating: 3 });
for (const [h, amount] of [[b1, 60000], [b2, 75000], [b3, 55000]]) await price(h, "toilet-simple", amount);
const offer70 = { pricing_mode: "FIXED", currency: "KRW", offered_amount: 70000, materials_policy: "INCLUDED", public_note: "Toilet blocked, 2nd floor", preferred_window: "Weekday evening" };
const feedBefore = [(await rpc("list_open_customer_offers", b1.id)).length, (await rpc("list_open_customer_offers", b2.id)).length];
const cb = await offerB("CUSTB001", offer70);
const feedAfter = [(await rpc("list_open_customer_offers", b1.id)).length, (await rpc("list_open_customer_offers", b2.id)).length];
check("50a. Customer offer checkout (70,000): nothing new visible to any Helper before payment", cb.success && Number(cb.fiat_amount) === 70000 && feedBefore.join() === feedAfter.join() && (await one("select count(*)::int n from public.service_requests where customer_id = 'CUSTB001'")).n === 0, JSON.stringify({ feedBefore, feedAfter }));
const offerRow = await one("select * from public.customer_offers where id = $1", [cb.customer_offer_id]);
check("50b. Customer offer immutable from creation (amount / currency / mode / region)", !!(await fails("update public.customer_offers set offered_amount = 1 where id = $1", [offerRow.id])) && !!(await fails("update public.customer_offers set sido = 'X' where id = $1", [offerRow.id])) && !!(await fails("update public.customer_offers set currency = 'USD' where id = $1", [offerRow.id])));
const fb = await fundedCheckout(cb, "CUSTB001");
const rB = fb.requestId;
const reqB = await one("select * from public.service_requests where id = $1", [rB]);
check("50c. After verified payment: request OPEN_FOR_HELPERS (CUSTOMER_OFFER_OPEN, funded), PAID_HELD, offer FUNDED, NO assignment", reqB?.status === "OPEN_FOR_HELPERS" && reqB.request_mode === "CUSTOMER_OFFER_OPEN" && reqB.funding_payment_intent_id === fb.i.intent_id && (await intentOf(fb.i.intent_id)).status === "PAID_HELD" && (await one("select status from public.customer_offers where id = $1", [cb.customer_offer_id])).status === "FUNDED" && (await activeOf(rB)).length === 0);
check("50d. Automatic matcher never consumes OPEN_FOR_HELPERS", (await rpc("match_and_assign_helper", rB)).success === false && (await activeOf(rB)).length === 0);
const feed1 = await rpc("list_open_customer_offers", b1.id);
const feedItem = feed1.find((f) => f.request_id === rB);
check("50e. Eligible Helpers (qualified service + detailed service + region + free) see it with the customer amount", !!feedItem && Number(feedItem.offered_amount) === 70000 && feedItem.currency === "KRW" && (await rpc("list_open_customer_offers", b2.id)).some((f) => f.request_id === rB), JSON.stringify(feed1));
check("50f. Feed exposes no customer identity, address, dong, description or payment data", feedItem && !/customer|address|dong|description|intent|payment|recipient|reference|CUSTB001|secret street|private description/i.test(JSON.stringify(Object.keys(feedItem)) + JSON.stringify(feedItem)), JSON.stringify(feedItem));
check("50g. Not shown to other-region / unqualified-subitem Helpers", !(await rpc("list_open_customer_offers", far.id)).some((f) => f.request_id === rB) && !(await rpc("list_open_customer_offers", h4.id)).some((f) => f.request_id === rB));
const notified = (await all("select recipient_id from public.app_notifications where type = 'OPEN_CUSTOMER_OFFER' and payload->>'request_id' = $1", [rB])).map((n) => n.recipient_id);
check("50h. In-app availability notice only to eligible Helpers (bounded fan-out): not other-region, not unqualified, not busy", notified.includes(b1.helper_id) && notified.includes(b2.helper_id) && ![far.helper_id, h4.helper_id, h1.helper_id, h2.helper_id].some((id) => notified.includes(id)) && notified.length <= 50, JSON.stringify(notified));
const accept1 = await rpc("accept_customer_offer_request", b1.id, rB);
const accept2 = await rpc("accept_customer_offer_request", b2.id, rB);
const selB = await all("select * from public.request_price_selections where request_id = $1", [rB]);
check("50i. First acceptance wins; the second Helper gets REQUEST_ALREADY_ACCEPTED with no assignment / selection / conversation", accept1.success && !accept1.replayed && accept2.code === "REQUEST_ALREADY_ACCEPTED" && (await activeOf(rB)).map((a) => a.helper_id).join() === b1.id && selB.length === 1 && (await all("select 1 from public.conversations where request_id = $1 and helper_id = $2", [rB, b2.id])).length === 0, JSON.stringify({ accept1, accept2 }));
check("50j. Winner accepted the customer's funded terms exactly (70,000, CUSTOMER_OFFER source), not B1's own 60,000 price", Number(selB[0].initial_payable_amount) === 70000 && selB[0].source_kind === "CUSTOMER_OFFER" && selB[0].source_customer_offer_id === cb.customer_offer_id && selB[0].helper_id === b1.id && (await statusOf(rB)) === "MATCHED");
check("50k. Accepting again is an idempotent replay for the winner", (await rpc("accept_customer_offer_request", b1.id, rB)).replayed === true);

// ================= 51: decline of an open offer =================
const cb2 = await offerB("CUSTB002", offer70);
const fb2 = await fundedCheckout(cb2, "CUSTB002");
const rB2 = fb2.requestId;
const dec = await rpc("decline_customer_offer_request", b2.id, rB2);
check("51. H2 declines: excluded (feed + accept), request stays OPEN_FOR_HELPERS at 70,000, funds PAID_HELD, H3 can accept", dec.success && !(await rpc("list_open_customer_offers", b2.id)).some((f) => f.request_id === rB2) && (await rpc("accept_customer_offer_request", b2.id, rB2)).code === "HELPER_NOT_ELIGIBLE" && (await statusOf(rB2)) === "OPEN_FOR_HELPERS" && (await intentOf(fb2.i.intent_id)).status === "PAID_HELD" && (await rpc("accept_customer_offer_request", b3.id, rB2)).success);

// ================= 52: accepted Helper later declines =================
const cb3 = await offerB("CUSTB003", offer70);
const fb3 = await fundedCheckout(cb3, "CUSTB003");
const rB3 = fb3.requestId;
await rpc("accept_customer_offer_request", b2.id, rB3);
const rel = await rpc("release_assignment_for_rematch", (await activeOf(rB3))[0].id, "DECLINED");
const hist3 = await all("select selection_version v, helper_id, status::text, ended_reason, initial_payable_amount::float8 amt from public.request_price_selections where request_id = $1 order by selection_version", [rB3]);
check("52a. Accepted H2 declines: SAME request re-opens (OPEN_FOR_HELPERS), H2 history kept + excluded, same 70,000, funds still held, no auto assignment", rel.customer_offer_reopened === true && rel.request_status === "OPEN_FOR_HELPERS" && (await statusOf(rB3)) === "OPEN_FOR_HELPERS" && hist3.length === 1 && hist3[0].status === "ENDED" && hist3[0].ended_reason === "HELPER_DECLINED" && (await intentOf(fb3.i.intent_id)).status === "PAID_HELD" && (await activeOf(rB3)).length === 0 && !(await rpc("list_open_customer_offers", b2.id)).some((f) => f.request_id === rB3), JSON.stringify({ rel, hist3 }));
check("52b. Not customer re-selection: no CUSTOMER_RESELECTION_REQUIRED, matcher does not touch it", rel.customer_reselection_required === false && (await rpc("match_and_assign_helper", rB3)).success === false && (await activeOf(rB3)).length === 0);
const h6 = await helper("H6");
await price(h6, "toilet-simple", 65000);
const acc3 = await rpc("accept_customer_offer_request", h6.id, rB3);
const hist3b = await all("select selection_version v, status::text, initial_payable_amount::float8 amt from public.request_price_selections where request_id = $1 order by selection_version", [rB3]);
check("52c. Another Helper explicitly accepts: v2 at the unchanged 70,000; v1 preserved", acc3.success && hist3b.map((h) => `${h.v}:${h.status}:${h.amt}`).join() === "1:ENDED:70000,2:ACCEPTED:70000");

// ================= 53 / 54 / 59: completion, release, exactly-once payout =================
// Protected media attached before payment travels with the request.
const cMedia = await offerB("CUSTB004", offer70);
const m1 = await rpc("register_request_media", cMedia.checkout_id, "CUSTB004", "SUPABASE_STORAGE_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 250000);
const mBad = await rpc("register_request_media", cMedia.checkout_id, "CUSTB004", "SUPABASE_STORAGE_PRIVATE", `private/${crypto.randomUUID()}.exe`, "application/x-msdownload", 10);
const mOther = await rpc("register_request_media", cMedia.checkout_id, "CUSTOTHR", "SUPABASE_STORAGE_PRIVATE", `private/${crypto.randomUUID()}.jpg`, "image/jpeg", 10);
check("Media: registered on the owner's open checkout only; executable / foreign-owner uploads rejected", m1.success && mBad.code === "MEDIA_REJECTED" && mOther.code === "CHECKOUT_NOT_FOUND");
const fm = await fundedCheckout(cMedia, "CUSTB004");
const rM = fm.requestId;
check("Media attached to the activated request", (await one("select request_id from public.request_media where id = $1", [m1.media_id])).request_id === rM);
check("Media: customer owner may view (logged); unassigned Helper / another customer may not", (await rpc("authorize_request_media_view", m1.media_id, "CUSTB004", null)).success && (await rpc("authorize_request_media_view", m1.media_id, null, h6.id)).code === "MEDIA_NOT_AVAILABLE" && (await rpc("authorize_request_media_view", m1.media_id, "CUSTOTHR", null)).code === "MEDIA_NOT_AVAILABLE");
const h7 = await helper("H7");
await price(h7, "toilet-simple", 50000);
await rpc("accept_customer_offer_request", h7.id, rM);
const asgM = (await activeOf(rM))[0];
const viewH = await rpc("authorize_request_media_view", m1.media_id, null, h7.id);
check("Media: the assigned Helper may view in-app (logged as HELPER, no download URL returned)", viewH.success && viewH.viewer_kind === "HELPER" && !("url" in viewH) && (await all("select viewer_kind from public.request_media_views where media_id = $1", [m1.media_id])).length === 2);
await rpc("accept_assignment", asgM.id, h7.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [rM]);
const earlyConfirm = await rpc("confirm_service_completion", rM, "CUSTB004");
const done = await rpc("complete_assignment_service", asgM.id, h7.id);
const afterHelper = await one("select status::text, helper_completed_at from public.service_requests where id = $1", [rM]);
check("53a. Customer cannot confirm before the Helper finished (SERVICE_NOT_COMPLETED)", earlyConfirm.code === "SERVICE_NOT_COMPLETED");
check("53b/54. Helper marks complete: COMPLETED + helper_completed_at, funds STILL PAID_HELD, no payout obligation, no timer", done.success && afterHelper.status === "COMPLETED" && !!afterHelper.helper_completed_at && (await intentOf(fm.i.intent_id)).status === "PAID_HELD" && (await all("select 1 from public.payout_obligations where request_id = $1", [rM])).length === 0);
check("Media: the Helper loses access once the work is completed", (await rpc("authorize_request_media_view", m1.media_id, null, h7.id)).code === "MEDIA_NOT_AVAILABLE");
check("56. Another customer cannot confirm completion (REQUEST_NOT_FOUND)", (await rpc("confirm_service_completion", rM, "CUSTB001")).code === "REQUEST_NOT_FOUND" && (await intentOf(fm.i.intent_id)).status === "PAID_HELD");
const conf = await rpc("confirm_service_completion", rM, "CUSTB004");
const ob = await all("select * from public.payout_obligations where request_id = $1", [rM]);
check("53c. Customer '서비스 완료' atomically: confirmation + RELEASE_AUTHORIZED + ONE Helper obligation (gross 70,000, fee 0 UNCONFIGURED_ZERO, net 70,000) + request PAYMENT_PENDING", conf.success && !conf.replayed && (await intentOf(fm.i.intent_id)).status === "RELEASE_AUTHORIZED" && ob.length === 1 && ob[0].helper_id === h7.id && Number(ob[0].gross_amount) === 70000 && Number(ob[0].platform_fee_amount) === 0 && Number(ob[0].net_amount) === 70000 && ob[0].fee_policy === "UNCONFIGURED_ZERO" && (await statusOf(rM)) === "PAYMENT_PENDING" && !!(await one("select customer_completed_at from public.service_requests where id = $1", [rM])).customer_completed_at, JSON.stringify(conf));
check("Media: '서비스 완료' schedules every photo / video for permanent deletion", (await one("select status, deletion_reason from public.request_media where id = $1", [m1.media_id])).status === "DELETION_PENDING" && (await rpc("authorize_request_media_view", m1.media_id, "CUSTB004", null)).code === "MEDIA_NOT_AVAILABLE");
const pendingDel = await rpc("list_media_pending_deletion", 50);
const del1 = await rpc("mark_request_media_deleted", m1.media_id);
const del2 = await rpc("mark_request_media_deleted", m1.media_id);
check("Media: storage worker lists, deletes and records DELETED exactly once", pendingDel.some((m) => m.media_id === m1.media_id) && del1.success && !del1.replayed && del2.replayed === true && (await one("select status from public.request_media where id = $1", [m1.media_id])).status === "DELETED");
const conf2 = await rpc("confirm_service_completion", rM, "CUSTB004");
check("25/59. Repeated / retried confirmation returns the existing result; still exactly one obligation", conf2.replayed === true && conf2.payout_obligation_id === conf.payout_obligation_id && (await all("select 1 from public.payout_obligations where request_id = $1", [rM])).length === 1);
check("59. A second Helper obligation for the request is impossible (unique index)", !!(await fails("insert into public.payout_obligations (kind, request_id, payment_intent_id, helper_id, currency, gross_amount) values ('HELPER_SERVICE', $1, $2, $3, 'KRW', 70000)", [rM, fm.i.intent_id, h7.id])));
const sub1 = await rpc("record_payout_submission", conf.payout_obligation_id, "SOLANA_DIRECT_DEVNET", "payout-1", "solana-devnet", "sigpayout1".padEnd(64, "x"));
const sub1r = await rpc("record_payout_submission", conf.payout_obligation_id, "SOLANA_DIRECT_DEVNET", "payout-1", "solana-devnet", "sigpayout1".padEnd(64, "x"));
const sub2 = await rpc("record_payout_submission", conf.payout_obligation_id, "SOLANA_DIRECT_DEVNET", "payout-2", "solana-devnet", "sigpayout2".padEnd(64, "x"));
check("41. Payout submitted once (PAYOUT_PROCESSING); worker retry replays; a second payout is blocked", sub1.success && sub1r.replayed === true && sub2.code === "DUPLICATE_PAYOUT_BLOCKED" && (await intentOf(fm.i.intent_id)).status === "PAYOUT_PROCESSING");
check("29. Helper told 'payment release initiated' (not 'paid') before the rail confirms", (await all("select type from public.app_notifications where recipient_id = $1 and payload->>'request_id' = $2 and type like 'PAYOUT%'", [h7.helper_id, rM])).map((n) => n.type).join() === "PAYOUT_RELEASE_INITIATED");
const res1 = await rpc("record_payout_result", conf.payout_obligation_id, "SOLANA_DIRECT_DEVNET", "payout-1", true);
const res1r = await rpc("record_payout_result", conf.payout_obligation_id, "SOLANA_DIRECT_DEVNET", "payout-1", true);
const resX = await rpc("record_payout_result", conf.payout_obligation_id, "SOLANA_DIRECT_DEVNET", "payout-2", true);
check("41/59. Rail confirmation -> obligation PAID, payment SETTLED, Helper 'payout completed'; repeated provider result replays; foreign payout id blocked", res1.status === "PAID" && res1r.replayed === true && resX.code === "DUPLICATE_PAYOUT_BLOCKED" && (await intentOf(fm.i.intent_id)).status === "SETTLED" && (await all("select 1 from public.app_notifications where recipient_id = $1 and type = 'PAYOUT_COMPLETED'", [h7.helper_id])).length === 1);

// Mode A completion: gross from the CURRENT Helper-price selection.
await rpc("accept_assignment", asgA[0].id, h1.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [rA]);
await rpc("complete_assignment_service", asgA[0].id, h1.id);
const confA = await rpc("confirm_service_completion", rA, "CUSTA001");
check("26. MODE A payout gross = current request_price_selection (60,000)", confA.success && Number(confA.gross_amount) === 60000 && Number((await one("select net_amount from public.payout_obligations where request_id = $1", [rA])).net_amount) === 60000);

// ================= 55: customer cancels an unmatched open request =================
const cb5 = await offerB("CUSTB005", offer70);
const m5 = await rpc("register_request_media", cb5.checkout_id, "CUSTB005", "R2_PRIVATE", `private/${crypto.randomUUID()}.mp4`, "video/mp4", 5000000);
const fb5 = await fundedCheckout(cb5, "CUSTB005");
const rB5 = fb5.requestId;
check("Cancel blocked for another customer", (await rpc("cancel_funded_request", rB5, "CUSTB001")).code === "REQUEST_NOT_FOUND");
const can = await rpc("cancel_funded_request", rB5, "CUSTB005");
const can2 = await rpc("cancel_funded_request", rB5, "CUSTB005");
const refunds5 = await all("select * from public.service_refunds where payment_intent_id = $1", [fb5.i.intent_id]);
check("55. Cancel unmatched open request: CANCELLED, ONE full refund obligation (70,000), REFUND_PENDING, no Helper payout, history kept", can.success && can2.replayed === true && (await statusOf(rB5)) === "CANCELLED" && refunds5.length === 1 && Number(refunds5[0].amount) === 70000 && refunds5[0].reason === "CUSTOMER_CANCELLED_UNMATCHED" && (await intentOf(fb5.i.intent_id)).status === "REFUND_PENDING" && (await all("select 1 from public.payout_obligations where payment_intent_id = $1", [fb5.i.intent_id])).length === 0 && (await one("select status from public.customer_offers where id = $1", [cb5.customer_offer_id])).status === "CANCELLED");
check("Cancelled request disappears from the Helper feed; media scheduled for deletion", !(await rpc("list_open_customer_offers", h1.id)).some((f) => f.request_id === rB5) && (await one("select deletion_reason from public.request_media where id = $1", [m5.media_id])).deletion_reason === "REQUEST_CANCELLED");
const rf1 = await rpc("record_refund_result", refunds5[0].id, "SOLANA_DIRECT_DEVNET", "refund-1", "solana-devnet", "sigrefund1".padEnd(64, "y"), true);
const rf2 = await rpc("record_refund_result", refunds5[0].id, "SOLANA_DIRECT_DEVNET", "refund-2", "solana-devnet", "sigrefund2".padEnd(64, "y"), true);
check("42. Refund completes once (REFUNDED); a second refund result is blocked; original payment row kept", rf1.status === "COMPLETED" && rf2.code === "DUPLICATE_REFUND_BLOCKED" && (await intentOf(fb5.i.intent_id)).status === "REFUNDED");
check("Matched request cannot be cancelled into a refund (Helper already committed)", (await rpc("cancel_funded_request", rB, "CUSTB001")).code === "REQUEST_NOT_CANCELLABLE");

// ================= MODE A re-selection with prepaid funds (013 semantics kept) =================
const rel2 = await rpc("release_assignment_for_rematch", (await activeOf(honored.activation.request_id))[0].id, "DECLINED");
const rH = honored.activation.request_id;
const hi = await price(h3, "toilet-simple", 150000);
const topup = await rpc("reselect_customer_helper", rH, "CUSTPIN2", hi.price_id, hi.revision);
const lo = await price(h3, "toilet-simple", 90000);
const cheaper = await rpc("reselect_customer_helper", rH, "CUSTPIN2", lo.price_id, lo.revision);
check("17. MODE A decline keeps 013 re-selection (CUSTOMER_RESELECTION_REQUIRED, funds held); higher price needs a top-up; lower price allowed", rel2.customer_reselection_required === true && topup.code === "TOPUP_REQUIRED" && cheaper.success && (await intentOf(iHonor.intent_id)).status === "PAID_HELD", JSON.stringify({ rel2, topup, cheaper }));
const asgH = (await activeOf(rH))[0];
await rpc("accept_assignment", asgH.id, h3.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [rH]);
await rpc("complete_assignment_service", asgH.id, h3.id);
const confH = await rpc("confirm_service_completion", rH, "CUSTPIN2");
const diff = await all("select amount::float8 a, reason from public.service_refunds where payment_intent_id = $1", [iHonor.intent_id]);
check("Held 99,000, final agreement 90,000: Helper gross 90,000 + ONE 9,000 price-difference refund", Number(confH.gross_amount) === 90000 && diff.length === 1 && diff[0].a === 9000 && diff[0].reason === "PRICE_DIFFERENCE");

// ================= customer-offer pricing modes =================
check("DIAGNOSTIC-only detailed service refuses a FIXED customer offer", (await offerB("CUSTDIAG", { pricing_mode: "FIXED", currency: "KRW", offered_amount: 30000, materials_policy: "INCLUDED" }, "boiler-diagnostic", "boiler")).code === "OFFER_MODE_NOT_ALLOWED");
check("DIAGNOSTIC offer cannot include materials (uncertain repair never becomes a fixed final amount)", (await offerB("CUSTDIAG", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", offered_amount: 30000, materials_policy: "INCLUDED" }, "boiler-diagnostic", "boiler")).code === "INVALID_OFFER");
const diag = await offerB("CUSTDIAG", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", offered_amount: 30000, materials_policy: "QUOTE_REQUIRED" }, "boiler-diagnostic", "boiler");
check("DIAGNOSTIC_PLUS_QUOTE customer offer accepted as a prepaid diagnostic amount", diag.success && Number(diag.fiat_amount) === 30000);
check("Detailed service with no FIXED / diagnostic mode refuses customer offers", (await offerB("CUSTHOUR", { pricing_mode: "FIXED", currency: "KRW", offered_amount: 30000, materials_policy: "INCLUDED" }, "remote-interpretation", "hospital-help")).code === "OFFER_MODE_NOT_ALLOWED");
check("Garbage / negative / sub-cent amounts rejected", (await offerB("CUSTBAD1", { ...offer70, offered_amount: -5 })).code === "INVALID_OFFER" && (await offerB("CUSTBAD1", { ...offer70, offered_amount: "abc" })).code === "INVALID_OFFER" && (await offerB("CUSTBAD1", { ...offer70, offered_amount: 10.001 })).code === "INVALID_OFFER");

// ================= referral payout instruction =================
const idA = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ('REFAAAAA', 'CUSTOMER', md5('a'), 'REFAAAAA') returning id")).id;
const idB = (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash, subject_key) values ('REFBBBBB', 'CUSTOMER', md5('b'), 'REFBBBBB') returning id")).id;
const att = (await one("insert into public.referral_attributions (referred_identity_id, referrer_identity_id) values ($1, $2) returning id", [idB, idA])).id;
const reward = (await one("insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state) values ($1, $2, $3, $4, 'WLH', 1000, 1000, 'QUALIFIED') returning id", [att, legacyAuto, idA, idB])).id;
check("40. Referral reward not PAYABLE -> no payout instruction (qualification logic untouched)", (await rpc("create_referral_payout_obligation", reward, "BANK_PROVIDER", "KR")).code === "REWARD_NOT_PAYABLE");
await db.query("update public.referral_rewards set state = 'PAYABLE' where id = $1", [reward]);
check("40. USDC referral payout refused while its country rail is disabled", (await rpc("create_referral_payout_obligation", reward, "USDC_SOLANA", "KR")).code === "PAYMENT_RAIL_DISABLED");
const ro = await rpc("create_referral_payout_obligation", reward, "BANK_PROVIDER", "KR");
const ro2 = await rpc("create_referral_payout_obligation", reward, "BANK_PROVIDER", "KR");
check("40. PAYABLE -> PAYOUT_PROCESSING + exactly one referral payout obligation (1,000 KRW)", ro.success && ro2.replayed === true && ro2.payout_obligation_id === ro.payout_obligation_id && (await one("select state from public.referral_rewards where id = $1", [reward])).state === "PAYOUT_PROCESSING");
await rpc("record_payout_submission", ro.payout_obligation_id, "BANK_PSP_TEST", "bank-1", null, null);
await rpc("record_payout_result", ro.payout_obligation_id, "BANK_PSP_TEST", "bank-1", true);
check("40. Rail confirmation -> reward PAID", (await one("select state from public.referral_rewards where id = $1", [reward])).state === "PAID");
check("41. Same provider payout id cannot pay two obligations", (await rpc("record_payout_submission", conf.payout_obligation_id, "BANK_PSP_TEST", "bank-1", null, null)).code === "DUPLICATE_PAYOUT_BLOCKED");

// ================= payout destinations / custody =================
check("39. Helper payout destination: one owner (Helper xor identity), no secret material columns", !!(await fails("insert into public.payout_destinations (owner_identity_id, owner_helper_id, country, currency, payout_method) values ($1, $2, 'KR', 'USDC', 'USDC_SOLANA')", [idA, h1.id])) && (await all("select column_name from information_schema.columns where table_name in ('payout_destinations', 'payment_intents', 'payment_rail_policies') and column_name ~ '(secret|private|seed|mnemonic|keypair)'")).length === 0);

// ================= no delete / fixture purge =================
check("Financial rows are never deleted (even by the table owner)", !!(await fails("delete from public.payment_intents where id = $1", [ia.intent_id])) && !!(await fails("delete from public.service_refunds where id = $1", [refunds5[0].id])));
const notFixture = await helperA(p5, "CUSTNOFX", { fixture: false });
check("Fixture purge refuses non-test checkouts", (await rpc("purge_payment_fixture", notFixture.checkout_id)).code === "NOT_A_TEST_FIXTURE");

// ================= legacy / 011 / 012 / 013 regression =================
await db.query("update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where status = 'ACTIVE'");
const la = await helper("LA", { sido: "AUTO" });
await helper("LB", { sido: "AUTO", rating: 4 });
const autoReq = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) values ('AUTOCUST', 'x', 'boiler', 'KR', 'AUTO', 'G1', 'legacy test compat', 'SEARCHING', 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true) returning id")).id;
const m1r = await rpc("match_and_assign_helper", autoReq);
const first = (await activeOf(autoReq))[0];
const relA = await rpc("release_assignment_for_rematch", first.id, "DECLINED");
await rpc("match_and_assign_helper", autoReq);
const second = (await activeOf(autoReq))[0];
check("011 regression: legacy AUTO_MATCH decline -> SEARCHING -> rematch never re-picks the decliner", m1r.status === "MATCHED" && first.helper_id === la.id && relA.request_status === "SEARCHING" && second && second.helper_id !== la.id);
check("012 regression: legacy unpaid customer-selected creation still works for internal compatibility (flagged legacy)", legacySel.success && (await one("select legacy_unfunded, request_mode from public.service_requests where id = $1", [legacySel.request_id])).legacy_unfunded === true);
const legacyRel = await rpc("release_assignment_for_rematch", (await activeOf(legacySel.request_id))[0].id, "DECLINED");
check("013 regression: customer-selected decline -> CUSTOMER_RESELECTION_REQUIRED (not SEARCHING, not re-opened as an offer)", legacyRel.customer_reselection_required === true && legacyRel.customer_offer_reopened === false && (await statusOf(legacySel.request_id)) === "CUSTOMER_RESELECTION_REQUIRED");

console.log(`${passed} passed, ${failed} failed`);
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

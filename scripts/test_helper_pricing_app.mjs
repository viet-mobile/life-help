// Deterministic app-level tests for helper pricing (no network, no staging, no production):
//   * lib/pricing/pricingTerms.ts publish rule + initial amount == the real database (PGlite parity)
//   * opaque offer token: round trip, tamper, expiry, opacity, key binding
//   * source-level authority boundaries of every new route and the request page
// Usage: node scripts/test_helper_pricing_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { PGlite } from "@electric-sql/pglite";

const root = new URL("..", import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), "utf8");
const code = (file) => read(file).replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-pricing-"));
const cloudflare = path.join(stubDir, "cf.mjs");
fs.writeFileSync(cloudflare, "export async function getCloudflareContext() { return { env: globalThis.__env || {} }; }");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(cloudflare).href, shortCircuit: true };
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
    return nextResolve(specifier, context);
  },
});
globalThis.__env = { SUPABASE_URL: "https://wreebowcbiymodswajwe.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-only-key-A" };
const terms = await import(new URL("lib/pricing/pricingTerms.ts", root).href);
const token = await import(new URL("lib/pricing/offerToken.ts", root).href);

// ---------------- parity with the database ----------------
const db = new PGlite();
await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key);");
for (const name of ["202609250001_core_service_matching_schema.sql", "202609250002_assignment_release_rematch.sql", "202609250003_helper_identity_and_accept_assignment.sql", "202609260009_assignment_completed_release.sql", "202609260011_exclude_declined_timeout_from_rematch.sql", "202609260012_helper_service_pricing.sql"]) {
  await db.exec(fs.readFileSync(new URL(`supabase/migrations/${name}`, root), "utf8"));
}
const helperId = (await db.query("insert into public.helpers (helper_id, name, sido) values ('HLP-P', 'P', 'P') returning id")).rows[0].id;
for (const s of ["clog-clearing", "cleaning", "hospital-help", "leak-plumbing", "boiler"]) await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, $2)", [helperId, s]);
await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', 'P', 'G1')", [helperId]);
const SUB = { FIXED: ["clog-clearing", "toilet-simple"], HOURLY: ["hospital-help", "general-outpatient"], PER_UNIT: ["cleaning", "appliance-cleaning"], PER_METER: ["leak-plumbing", "pipe-repair"], PER_AREA: ["cleaning", "move-in-cleaning"], DIAGNOSTIC_PLUS_QUOTE: ["boiler", "boiler-diagnostic"] };
const cases = [
  { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" },
  { pricing_mode: "FIXED", currency: "KRW", base_price: 0, materials_policy: "INCLUDED" },
  { pricing_mode: "FIXED", base_price: 60000, materials_policy: "INCLUDED" },
  { pricing_mode: "FIXED", currency: "KRW", base_price: 60000 },
  { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED", night_multiplier: 4 },
  { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED" },
  { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED", included_minutes: 10 },
  { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED", included_minutes: 90, minimum_charge: 50000 },
  { pricing_mode: "PER_UNIT", currency: "KRW", base_price: 40000, materials_policy: "INCLUDED", included_quantity: 2 },
  { pricing_mode: "PER_UNIT", currency: "KRW", base_price: 40000, materials_policy: "INCLUDED", included_quantity: 0 },
  { pricing_mode: "PER_METER", currency: "KRW", base_price: 20000, materials_policy: "PARTIALLY_INCLUDED", minimum_charge: 80000 },
  { pricing_mode: "PER_AREA", currency: "KRW", base_price: 12000, materials_policy: "INCLUDED", included_quantity: 30 },
  { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "QUOTE_REQUIRED" },
  { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED" },
  { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "EXCLUDED", minimum_charge: 10000 },
];
const mismatches = [];
for (const c of cases) {
  const [service, subitem] = SUB[c.pricing_mode];
  const db_ok = (await db.query("select public.upsert_helper_service_price($1, $2, $3, $4, true) r", [helperId, service, subitem, JSON.stringify(c)])).rows[0].r.success === true;
  const ts_ok = terms.publishProblems(terms.sanitizeTerms(c)).length === 0;
  if (db_ok !== ts_ok) mismatches.push({ c, db_ok, ts_ok });
}
check("Client publish rule matches the database for every pricing mode (15 cases)", mismatches.length === 0, JSON.stringify(mismatches));
const amountMismatch = [];
for (const c of cases.filter((x) => terms.publishProblems(terms.sanitizeTerms(x)).length === 0)) {
  const [service, subitem] = SUB[c.pricing_mode];
  await db.query("update public.request_assignments set status = 'COMPLETED' where helper_id = $1 and status = 'PENDING'", [helperId]);
  const saved = (await db.query("select public.upsert_helper_service_price($1, $2, $3, $4, true) r", [helperId, service, subitem, JSON.stringify(c)])).rows[0].r;
  const made = (await db.query("select public.create_customer_selected_request(gen_random_uuid(), 'CUSTOMRX', 'x', 'en', 'KR', 'P', 'G1', '', '', 'd', '{}', $1, $2) r", [saved.price_id, saved.revision])).rows[0].r;
  if (Number(made.initial_payable_amount) !== terms.initialPayableAmount(terms.sanitizeTerms(c))) amountMismatch.push({ mode: c.pricing_mode, db: made.initial_payable_amount, ts: terms.initialPayableAmount(terms.sanitizeTerms(c)) });
}
check("Displayed initial amount equals the snapshot's initial_payable_amount for every mode", amountMismatch.length === 0, JSON.stringify(amountMismatch));
check("sanitizeTerms drops helper/status/amount-override fields a client might inject", (() => { const s = terms.sanitizeTerms({ pricing_mode: "FIXED", base_price: 1, helper_id: "x", status: "ACTIVE", revision: 9, price_id: "y", initial_payable_amount: 1 }); return s && !("helper_id" in s) && !("status" in s) && !("revision" in s) && !("price_id" in s) && !("initial_payable_amount" in s); })());
check("sanitizeTerms rejects unknown modes and non-numeric amounts", terms.sanitizeTerms({ pricing_mode: "FREE" }) === null && terms.sanitizeTerms({ pricing_mode: "FIXED", base_price: "12abc" }) === null);

// ---------------- opaque offer token ----------------
const claims = { priceId: "11111111-2222-4333-8444-555555555555", revision: 3, helperId: "66666666-7777-4888-8999-000000000000", serviceCode: "clog-clearing", subitemCode: "toilet-simple" };
const tk = await token.issueOfferToken(claims);
const back = await token.readOfferToken(tk);
check("Offer token round-trips (price, revision, helper, sub-item)", back.ok && back.claims.priceId === claims.priceId && back.claims.revision === 3 && back.claims.helperId === claims.helperId && back.claims.subitemCode === "toilet-simple");
const decoded = Buffer.from(tk.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("latin1");
check("Offer token is opaque (no internal ids / codes readable)", !decoded.includes(claims.priceId) && !decoded.includes(claims.helperId) && !decoded.includes("toilet") && !tk.includes(claims.priceId));
const tampered = tk.slice(0, -4) + (tk.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
check("Tampered token rejected (OFFER_INVALID)", (await token.readOfferToken(tampered)).code === "OFFER_INVALID" && (await token.readOfferToken("x".repeat(50))).code === "OFFER_INVALID" && (await token.readOfferToken(123)).code === "OFFER_INVALID");
check("Expired token rejected (OFFER_EXPIRED after 15 minutes)", (await token.readOfferToken(tk, Date.now() + token.OFFER_TOKEN_TTL_MS + 1000)).code === "OFFER_EXPIRED" && token.OFFER_TOKEN_TTL_MS === 15 * 60 * 1000);
globalThis.__env = { ...globalThis.__env, SUPABASE_SERVICE_ROLE_KEY: "test-only-key-B" };
check("Token from another deployment key is rejected", (await token.readOfferToken(tk)).code === "OFFER_INVALID");

// ---------------- source-level authority ----------------
const selected = code("app/api/requests/selected/route.ts");
check("Selected request: owner from device cookie, offer from token, both before the RPC", selected.includes("resolveCustomerOwner(client)") && selected.includes("readOfferToken(body.offer_token)") && selected.indexOf("resolveCustomerOwner(client)") < selected.indexOf('rpc("create_customer_selected_request"') && selected.indexOf("readOfferToken(") < selected.indexOf('rpc("create_customer_selected_request"'));
check("Selected request: helper/price/revision come only from the token; service from the offer", selected.includes("p_price_id: offer.claims.priceId") && selected.includes("p_price_revision: offer.claims.revision") && selected.includes("service_slug: offer.claims.serviceCode") && selected.includes("customer_id: owner.owner.customerId"));
check("Selected request: client amount / currency / helper / terms are never read", !/body\.(price|amount|currency|helper|base_price|pricing_mode|materials|minimum|revision|surcharge|night|weekend|emergency)/i.test(selected));
check("Selected request: stale / unavailable offers surface as 409 conflicts, no substitution", ["PRICE_CHANGED", "HELPER_NO_LONGER_AVAILABLE", "OFFER_UNAVAILABLE"].every((c) => selected.includes(c)) && !selected.includes("match_and_assign_helper"));
check("Selected request: push only for a newly created assignment (never on replay)", /if \(!data\.replayed\) await dispatchPushInBackground\(\(\) => pushHelperAssignment\(client, requestId\)\)/.test(selected));
const offersRoute = code("lib/pricing/publicOffers.ts");
const pushed = offersRoute.slice(offersRoute.indexOf("offers.push({"), offersRoute.indexOf("});", offersRoute.indexOf("offers.push({")));
check("Both offer endpoints use the shared public mapping", code("app/api/pricing/offers/route.ts").includes("toPublicOffers(") && code("app/api/requests/reselection/offers/route.ts").includes("toPublicOffers(rows, { requestId: ctx.requestId })"));
check("Offer discovery returns no internal ids (price_id / helper_id replaced by offerToken)", pushed.length > 0 && !/price_id|helper_id|auth_user|email|name:/.test(pushed) && pushed.includes("offerToken"));
for (const file of ["app/api/helper/prices/route.ts", "app/api/helper/prices/status/route.ts"]) {
  const src = code(file);
  check(`${file}: authenticated helper only; helper id never from the client`, src.includes("resolveAuthenticatedHelper(request)") && (src.match(/p_helper_id: resolved\.value\.helper\.id/g) || []).length >= 1 && !/body\??\.helper|helper_id:\s*body/.test(src));
}
const helperGet = code("app/api/helper/prices/route.ts");
check("Helper sees only its own prices", helperGet.includes('from("helper_service_prices")') && helperGet.includes('.eq("helper_id", helper.id)'));
const decline = code("app/api/helper/assignments/[assignmentId]/decline/route.ts");
check("Decline of a customer-selected helper never auto-rematches (CUSTOMER_RESELECTION_REQUIRED)", decline.includes('selection_mode === "CUSTOMER_SELECTED"') && decline.indexOf("CUSTOMER_RESELECTION_REQUIRED") < decline.indexOf('rpc("match_and_assign_helper"'));
// ---------------- customer re-selection (migration 013) ----------------
const reselect = code("app/api/requests/reselection/route.ts");
const reselectOffers = code("app/api/requests/reselection/offers/route.ts");
const reselectLib = code("lib/request/reselection.ts");
check("Re-selection: owner from the device cookie on every route; never a body / public customer id", [reselect, reselectOffers].every((src) => src.includes("resolveCustomerOwner(client)")) && !/body\.(customer|helper|price|amount|currency|pricing|materials|minimum|extra|night|weekend|emergency|revision)/.test(reselect) && reselect.includes("p_customer_id: owner.owner.customerId"));
check("Re-selection: request must be owned by the cookie's customer (request id alone authorizes nothing)", reselectLib.includes('.eq("customer_id", customerId)') && reselect.indexOf("loadOwnedReselection(") < reselect.indexOf('rpc("reselect_customer_helper"'));
check("Re-selection: offer token must be bound to this exact request; new-request tokens refused and vice versa", reselect.includes("offer.claims.requestId !== requestId") && code("app/api/requests/selected/route.ts").includes("if (offer.claims.requestId) return respond(400"));
check("Re-selection: same service and detailed service enforced", reselect.includes("offer.claims.subitemCode !== lookup.value.subitemCode") && reselect.includes("OFFER_SERVICE_MISMATCH"));
check("Re-selection offers exclude Helpers who declined / timed out on this request", reselectLib.includes('.in("status", ["DECLINED", "TIMEOUT"])') && reselectOffers.includes("!ctx.excludedHelperIds.includes(row.helper_id)"));
check("Re-selection: price / helper / revision come only from the token; push only on a new assignment", reselect.includes("p_price_id: offer.claims.priceId") && reselect.includes("p_price_revision: offer.claims.revision") && /if \(!data\.replayed\) await dispatchPushInBackground\(\(\) => pushHelperAssignment\(client, requestId\)\)/.test(reselect));
const declineRoute = code("app/api/helper/assignments/[assignmentId]/decline/route.ts");
check("Decline -> customer re-selection push is generic (RESELECTION_REQUIRED event), never an auto-rematch", declineRoute.includes('pushCustomerStatus(resolved.value.client, release.request_id, "RESELECTION_REQUIRED")') && declineRoute.indexOf("CUSTOMER_RESELECTION_REQUIRED") < declineRoute.indexOf('rpc("match_and_assign_helper"'));
const priceAuth = code("lib/pricing/requestPrice.ts");
check("Price authority: current ACCEPTED selection first; legacy snapshot only when no selection exists", priceAuth.indexOf('row.status === "ACCEPTED"') < priceAuth.indexOf("request_price_snapshots") && priceAuth.includes("if (selections.length) return null;"));
const page = read("app/request/page.tsx");
check("Request page sends only the opaque offer token for a selected offer", page.includes("...(offerToken ? { offer_token: offerToken } : {})") && !/offer_(price|amount|currency|helper)/.test(page) && page.includes('fetch("/api/requests/selected", requestInit)'));
const picker = read("components/request/PriceOfferPicker.tsx");
check("Picker shows terms before confirming and confirms with the token only", picker.includes("pricing.confirmTitle") && picker.includes("onConfirm(chosen.offerToken)") && picker.includes("pricing.diagnosticNotice") && picker.includes("pricing.approvalNotice"));
const pricingSources = ["lib/pricing/pricingTerms.ts", "lib/pricing/offerToken.ts", "app/api/pricing/offers/route.ts", "app/api/pricing/catalog/route.ts", "app/api/helper/prices/route.ts", "app/api/requests/selected/route.ts", "components/tech/HelperPricingPanel.tsx", "components/request/PriceOfferPicker.tsx"].map(code).join("\n");
check("No market-price / FX import anywhere in the pricing code", !/market|benchmark|exchange.?rate|fx_rate|workbook/i.test(pricingSources));
check("No customer signup / public-ID auth added", !/signUp|signup|referralId/.test(selected) && !/auth\.sign/.test(pricingSources));

fs.rmSync(stubDir, { recursive: true, force: true });
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

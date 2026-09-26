// Deterministic helper-pricing test against the REAL migration SQL, executed in PGlite
// (in-process PostgreSQL). No network, no staging, no production.
// Usage: node scripts/test_helper_pricing_db.mjs
import fs from "node:fs";
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const sql = (name) => fs.readFileSync(new URL(name, dir), "utf8");
const MIGRATION = "202609260012_helper_service_pricing.sql";
const CHAIN = ["202609250001_core_service_matching_schema.sql", "202609250002_assignment_release_rematch.sql", "202609250003_helper_identity_and_accept_assignment.sql", "202609260009_assignment_completed_release.sql", "202609260011_exclude_declined_timeout_from_rematch.sql", MIGRATION];

let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const db = new PGlite();
await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key);");
for (const name of CHAIN) await db.exec(sql(name));
const one = async (text, params = []) => (await db.query(text, params)).rows[0];
const all = async (text, params = []) => (await db.query(text, params)).rows;
const rpc = async (fn, ...args) => (await one(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) as r`, args)).r;
const fails = async (text, params = []) => { try { await db.query(text, params); return null; } catch (error) { return error; } };

async function helper(label, { sido = "P", rating = 5, jobs = 0, active = true, onDuty = true, services = ["clog-clearing", "cleaning", "hospital-help", "leak-plumbing", "boiler"] } = {}) {
  const row = await one("insert into public.helpers (helper_id, name, email, sido, rating, completed_jobs, is_active, on_duty, primary_locale) values ($1, $2, $3, $4, $5, $6, $7, $8, 'ko') returning id", [`HLP-${label}`, `Secret Name ${label}`, `${label.toLowerCase()}@private.example`, sido, rating, jobs, active, onDuty]);
  for (const service of services) await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, $2)", [row.id, service]);
  await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', $2, 'G1')", [row.id, sido]);
  return row.id;
}
const price = (helperId, service, subitem, terms, publish = false) => rpc("upsert_helper_service_price", helperId, service, subitem, JSON.stringify(terms), publish);
const offers = (service, subitem, sido = "P", gungu = "G1") => rpc("list_customer_offers", service, subitem, "KR", sido, gungu);
let seq = 0;
const select = (priceId, revision, { customer = "CUSTOMRA", sido = "P", requestId = crypto.randomUUID() } = {}) =>
  rpc("create_customer_selected_request", requestId, customer, `ID · ${customer}`, "en", "KR", sido, "G1", "D1", `addr ${++seq}`, `desc ${seq}`, [], priceId, revision).then((r) => ({ ...r, requestId }));
const FIXED = { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED", tax_included: true };

// ---------------- catalog ----------------
const catalog = await all("select service_code, subitem_code, allowed_pricing_modes, default_pricing_mode from public.service_subitems where active order by service_code, sort_order");
const services = new Set(catalog.map((c) => c.service_code));
check("Catalog seeded under all 10 existing service codes with stable machine codes", services.size === 10 && catalog.every((c) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.subitem_code)), [...services].join(","));
const modes = new Set(catalog.flatMap((c) => c.allowed_pricing_modes.replace(/[{}]/g, "").split(",")));
check("Catalog covers every pricing mode", ["FIXED", "HOURLY", "PER_UNIT", "PER_METER", "PER_AREA", "DIAGNOSTIC_PLUS_QUOTE"].every((m) => modes.has(m)), [...modes].join(","));
check("Catalog rejects an unknown service code", !!(await fails("insert into public.service_subitems (service_code, subitem_code, allowed_pricing_modes, default_pricing_mode) values ('plumbing', 'x', '{FIXED}', 'FIXED')")));
check("Catalog rejects a default mode outside its allowed modes", !!(await fails("insert into public.service_subitems (service_code, subitem_code, allowed_pricing_modes, default_pricing_mode) values ('boiler', 'x-new', '{FIXED}', 'HOURLY')")));

// ---------------- access boundary ----------------
for (const role of ["anon", "authenticated"]) {
  const t = await one(`select has_table_privilege('${role}', 'public.helper_service_prices', 'insert') i, has_table_privilege('${role}', 'public.helper_service_prices', 'update') u, has_table_privilege('${role}', 'public.helper_service_prices', 'select') s, has_table_privilege('${role}', 'public.request_price_snapshots', 'select') r`);
  const f = await one(`select has_function_privilege('${role}', 'public.upsert_helper_service_price(uuid, text, text, jsonb, boolean)', 'execute') a, has_function_privilege('${role}', 'public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer)', 'execute') b, has_function_privilege('${role}', 'public.list_customer_offers(text, text, text, text, text)', 'execute') c`);
  check(`${role} (anonymous / customer browser) cannot read or write prices, snapshots or RPCs`, !t.i && !t.u && !t.s && !t.r && !f.a && !f.b && !f.c, JSON.stringify({ t, f }));
}
check("Snapshots: service_role may insert/select but not update or delete", (await one("select has_table_privilege('service_role', 'public.request_price_snapshots', 'insert') i, has_table_privilege('service_role', 'public.request_price_snapshots', 'update') u, has_table_privilege('service_role', 'public.request_price_snapshots', 'delete') d")).i === true && !(await one("select has_table_privilege('service_role', 'public.request_price_snapshots', 'update') u")).u && !(await one("select has_table_privilege('service_role', 'public.request_price_snapshots', 'delete') d")).d);

// ---------------- helper pricing ----------------
const h1 = await helper("H1", { rating: 5 });
const h2 = await helper("H2", { rating: 4 });
const draft = await price(h1, "clog-clearing", "toilet-simple", { pricing_mode: "FIXED", base_price: 55000 });
check("Helper H saves an incomplete DRAFT for its own sub-item", draft.success && draft.status === "DRAFT" && draft.revision === 1, JSON.stringify(draft));
const incomplete = await rpc("set_helper_service_price_status", h1, draft.price_id, "ACTIVE");
check("Incomplete DRAFT cannot be published (currency/materials missing)", incomplete.code === "INVALID_TERMS" && incomplete.reason === "helper_price_active_complete", JSON.stringify(incomplete));
const fixed = await price(h1, "clog-clearing", "toilet-simple", FIXED, true);
check("FIXED: complete offer publishes (ACTIVE), revision bumped by the terms change", fixed.success && fixed.status === "ACTIVE" && fixed.revision === 2, JSON.stringify(fixed));
check("ACTIVE with no price at all cannot be published (NULL-safe constraint)", (await price(h1, "clog-clearing", "sink", { pricing_mode: "FIXED", currency: "KRW", materials_policy: "INCLUDED" }, true)).reason === "helper_price_active_complete");
check("FIXED: zero price cannot be published", (await price(h1, "clog-clearing", "sink", { ...FIXED, base_price: 0 }, true)).reason === "helper_price_active_complete");
check("Negative amounts rejected", (await price(h1, "clog-clearing", "sink", { ...FIXED, base_price: -1 })).reason === "helper_price_amounts_nonnegative");
check("Unsupported currency format rejected", (await price(h1, "clog-clearing", "sink", { ...FIXED, currency: "krw" })).code === "INVALID_TERMS");
check("Invalid multipliers rejected (>3 or <1)", (await price(h1, "clog-clearing", "sink", { ...FIXED, night_multiplier: 5 })).reason === "helper_price_multipliers_range" && (await price(h1, "clog-clearing", "sink", { ...FIXED, weekend_multiplier: 0.5 })).reason === "helper_price_multipliers_range");
check("Nonsensical included quantity / minutes rejected", (await price(h1, "cleaning", "appliance-cleaning", { pricing_mode: "PER_UNIT", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED", included_quantity: 0 })).reason === "helper_price_included_positive" && (await price(h1, "cleaning", "regular-cleaning", { pricing_mode: "HOURLY", currency: "KRW", base_price: 25000, materials_policy: "INCLUDED", included_minutes: 5000 })).reason === "helper_price_included_positive");
check("Garbage numbers rejected without partial writes", (await price(h1, "clog-clearing", "sink", { ...FIXED, base_price: "abc" })).code === "INVALID_TERMS" && (await all("select p.id from public.helper_service_prices p join public.service_subitems s on s.id = p.service_subitem_id where p.helper_id = $1 and s.subitem_code = 'sink'", [h1])).length === 0);
check("Pricing mode not allowed for the sub-item is rejected", (await price(h1, "leak-plumbing", "leak-detection", FIXED, true)).code === "PRICING_MODE_NOT_ALLOWED");
check("Helper cannot price a service it is not qualified for", (await price(h1, "bank-help", "account-opening", FIXED, true)).code === "NOT_QUALIFIED_FOR_SERVICE");
check("HOURLY: needs minimum/included time (>=15 min) to publish", (await price(h1, "hospital-help", "general-outpatient", { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED" }, true)).reason === "helper_price_active_complete" && (await price(h1, "hospital-help", "general-outpatient", { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, included_minutes: 120, extra_hour_price: 30000, materials_policy: "INCLUDED", minimum_charge: 60000 }, true)).status === "ACTIVE");
check("PER_UNIT validates and publishes", (await price(h1, "cleaning", "appliance-cleaning", { pricing_mode: "PER_UNIT", currency: "KRW", base_price: 40000, included_quantity: 1, extra_unit_price: 35000, materials_policy: "INCLUDED" }, true)).status === "ACTIVE");
check("PER_METER validates and publishes", (await price(h1, "leak-plumbing", "pipe-repair", { pricing_mode: "PER_METER", currency: "KRW", base_price: 20000, minimum_charge: 80000, materials_policy: "PARTIALLY_INCLUDED", materials_note: "기본 배관 포함" }, true)).status === "ACTIVE");
check("PER_AREA validates and publishes", (await price(h1, "cleaning", "move-in-cleaning", { pricing_mode: "PER_AREA", currency: "KRW", base_price: 12000, included_quantity: 30, materials_policy: "INCLUDED" }, true)).status === "ACTIVE");
check("DIAGNOSTIC_PLUS_QUOTE: 'materials included' is rejected (repair is always quoted)", (await price(h1, "boiler", "boiler-diagnostic", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED" }, true)).reason === "helper_price_active_complete");
check("DIAGNOSTIC_PLUS_QUOTE: diagnostic fee + quote-required materials publishes", (await price(h1, "boiler", "boiler-diagnostic", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "QUOTE_REQUIRED", night_multiplier: 1.5 }, true)).status === "ACTIVE");
check("Same helper prices many sub-items", (await all("select id from public.helper_service_prices where helper_id = $1 and status = 'ACTIVE'", [h1])).length === 6);
const h2Fixed = await price(h2, "clog-clearing", "toilet-simple", { ...FIXED, base_price: 45000, materials_policy: "EXCLUDED" }, true);
const h1Row = await one("select base_price, materials_policy, revision from public.helper_service_prices where id = $1", [fixed.price_id]);
check("Different helpers price the same sub-item independently (H2 cannot touch H1's row)", h2Fixed.success && h2Fixed.price_id !== fixed.price_id && Number(h1Row.base_price) === 60000 && h1Row.materials_policy === "INCLUDED");
check("Helper cannot change another helper's offer status", (await rpc("set_helper_service_price_status", h2, fixed.price_id, "PAUSED")).code === "PRICE_NOT_FOUND" && (await one("select status from public.helper_service_prices where id = $1", [fixed.price_id])).status === "ACTIVE");

// ---------------- customer offer discovery ----------------
const list = await offers("clog-clearing", "toilet-simple");
check("Offers: both helpers, ranked like the matcher (rating first)", list.length === 2 && list[0].price_id === fixed.price_id && list[1].price_id === h2Fixed.price_id, JSON.stringify(list.map((o) => o.helper_alias)));
check("Offers carry terms and a safe alias, never name/email/auth id", list.every((o) => /^Helper [0-9A-F]{4}$/.test(o.helper_alias) && o.currency === "KRW" && o.pricing_mode === "FIXED") && !/Secret Name|private\.example|auth_user/.test(JSON.stringify(list)));
await rpc("set_helper_service_price_status", h2, h2Fixed.price_id, "PAUSED");
check("Paused offer is not customer-visible", (await offers("clog-clearing", "toilet-simple")).length === 1);
await rpc("set_helper_service_price_status", h2, h2Fixed.price_id, "ACTIVE");
const h3 = await helper("H3", { active: false });
const h4 = await helper("H4", { sido: "Q" });
const h5 = await helper("H5", { onDuty: false });
for (const h of [h3, h4, h5]) await price(h, "clog-clearing", "toilet-simple", FIXED, true);
const visible = (await offers("clog-clearing", "toilet-simple")).map((o) => o.helper_id);
check("Inactive helper / off-duty helper / other region are not offered (price ACTIVE != available)", visible.length === 2 && !visible.includes(h3) && !visible.includes(h4) && !visible.includes(h5));
check("Other-region helper is offered in its own region only", (await offers("clog-clearing", "toilet-simple", "Q")).map((o) => o.helper_id).join() === h4);
check("Draft offer is not customer-visible", (await offers("clog-clearing", "sink")).length === 0);

// ---------------- customer-selected request ----------------
const chosen = list[0];
const made = await select(chosen.price_id, chosen.revision);
const snap = await one("select * from public.request_price_snapshots where request_id = $1", [made.requestId]);
const req = await one("select status, selection_mode, service_slug, customer_id from public.service_requests where id = $1", [made.requestId]);
const asg = await all("select helper_id, status from public.request_assignments where request_id = $1", [made.requestId]);
check("Customer selects H1's offer: request MATCHED to exactly H1 (CUSTOMER_SELECTED)", made.success && made.status === "MATCHED" && req.status === "MATCHED" && req.selection_mode === "CUSTOMER_SELECTED" && req.service_slug === "clog-clearing" && asg.length === 1 && asg[0].helper_id === h1, JSON.stringify(made));
check("Snapshot copies the server-side terms (amount, currency, helper, materials)", snap && snap.helper_id === h1 && Number(snap.base_price) === 60000 && snap.currency === "KRW" && snap.materials_policy === "INCLUDED" && Number(snap.initial_payable_amount) === 60000 && snap.source_helper_price_id === fixed.price_id && snap.source_price_revision === fixed.revision);
const notes = await all("select recipient_id from public.app_notifications where type = 'NEW_SERVICE_REQUEST' and payload->>'request_id' = $1", [made.requestId]);
check("Selected helper gets exactly one new-assignment notification", notes.length === 1 && notes[0].recipient_id === "HLP-H1");
const args = (await one("select pg_get_function_arguments('public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer)'::regprocedure) a")).a;
check("Customer cannot send amount / currency / helper / materials: the RPC has no such parameters", !/amount|currency|helper|materials|base_price|pricing_mode/i.test(args), args);
check("Snapshot is immutable (UPDATE rejected even for the table owner)", !!(await fails("update public.request_price_snapshots set base_price = 1 where request_id = $1", [made.requestId])));
await price(h1, "clog-clearing", "toilet-simple", { ...FIXED, base_price: 99000 }, true);
check("Helper's later price change does not alter the existing request snapshot", Number((await one("select base_price from public.request_price_snapshots where request_id = $1", [made.requestId])).base_price) === 60000);

// Stale offer, unavailable helper, replay
const h6 = await helper("H6", { sido: "R" });
const v1 = await price(h6, "clog-clearing", "sink", { ...FIXED, base_price: 50000 }, true);
const v2 = await price(h6, "clog-clearing", "sink", { ...FIXED, base_price: 70000 }, true);
const stale = await select(v1.price_id, v1.revision, { sido: "R" });
check("Stale offer (price changed V1 -> V2) rejected with PRICE_CHANGED; nothing written", stale.code === "PRICE_CHANGED" && stale.current_revision === v2.revision && !(await one("select id from public.service_requests where id = $1", [stale.requestId])));
await rpc("set_helper_service_price_status", h6, v1.price_id, "PAUSED");
check("Paused offer cannot be selected (OFFER_UNAVAILABLE)", (await select(v1.price_id, v2.revision, { sido: "R" })).code === "OFFER_UNAVAILABLE");
await rpc("set_helper_service_price_status", h6, v1.price_id, "ACTIVE");
const firstWin = await select(v1.price_id, v2.revision, { sido: "R", customer: "CUSTOMRB" });
const secondLose = await select(v1.price_id, v2.revision, { sido: "R", customer: "CUSTOMRC" });
check("Two customers pick the same free helper: first wins, second HELPER_NO_LONGER_AVAILABLE with nothing written", firstWin.success && secondLose.code === "HELPER_NO_LONGER_AVAILABLE" && !(await one("select id from public.service_requests where id = $1", [secondLose.requestId])) && (await all("select id from public.request_assignments where helper_id = $1 and status in ('PENDING','NOTIFIED','ACCEPTED')", [h6])).length === 1);
check("Wrong region for the offer -> HELPER_NO_LONGER_AVAILABLE", (await select(h2Fixed.price_id, (await one("select revision from public.helper_service_prices where id = $1", [h2Fixed.price_id])).revision, { sido: "ZZ" })).code === "HELPER_NO_LONGER_AVAILABLE");
const replay = await select(v1.price_id, v2.revision, { sido: "R", customer: "CUSTOMRB", requestId: firstWin.requestId });
const otherCustomer = await select(v1.price_id, v2.revision, { sido: "R", customer: "CUSTOMRZ", requestId: firstWin.requestId });
check("Replay of the same submission is idempotent; another customer with the same id is rejected", replay.success && replay.replayed === true && otherCustomer.code === "IDEMPOTENCY_KEY_CONFLICT" && (await all("select id from public.request_assignments where request_id = $1", [firstWin.requestId])).length === 1);
let indexCode = null;
try { await db.query("insert into public.request_assignments (request_id, helper_id, status) values ($1, $2, 'PENDING')", [made.requestId, h6]); } catch (error) { indexCode = error.code; }
check("Active-helper uniqueness still enforced underneath (second active row rejected)", indexCode !== null);

// No silent substitution after the selected helper declines
const selAsg = await one("select id from public.request_assignments where request_id = $1 and status = 'PENDING'", [made.requestId]);
const release = await rpc("release_assignment_for_rematch", selAsg.id, "DECLINED");
const matcherErr = await fails("select public.match_and_assign_helper($1)", [made.requestId]);
const after = await all("select helper_id, status from public.request_assignments where request_id = $1", [made.requestId]);
check("Selected H1 declines: automatic matcher can NOT substitute H2 at another price (DB guard)", release.request_reopened === true && matcherErr?.message?.includes("CUSTOMER_SELECTED_HELPER_LOCKED") && after.length === 1 && after[0].status === "DECLINED");
check("Direct insert of a different helper for a customer-selected request is rejected", !!(await fails("insert into public.request_assignments (request_id, helper_id, status) values ($1, $2, 'PENDING')", [made.requestId, h2])));

// ---------------- auto-match regression (incl. migration 011) ----------------
const a1 = await helper("A1", { sido: "AUTO", rating: 5 });
const a2 = await helper("A2", { sido: "AUTO", rating: 4 });
const auto = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, sido, gungu, status) values ('AUTOCUST', 'x', 'boiler', 'AUTO', 'G1', 'SEARCHING') returning id")).id;
const m1 = await rpc("match_and_assign_helper", auto);
const autoAsg = await one("select id, helper_id from public.request_assignments where request_id = $1 and status = 'PENDING'", [auto]);
await rpc("release_assignment_for_rematch", autoAsg.id, "DECLINED");
await rpc("match_and_assign_helper", auto);
const autoActive = await one("select helper_id from public.request_assignments where request_id = $1 and status = 'PENDING'", [auto]);
check("AUTO_MATCH path unchanged: default selection_mode, ranking, and 011 decline exclusion", m1.status === "MATCHED" && autoAsg.helper_id === a1 && autoActive?.helper_id === a2 && (await one("select selection_mode from public.service_requests where id = $1", [auto])).selection_mode === "AUTO_MATCH");

// ---------------- static ----------------
const source = sql(MIGRATION);
const body = source.split("-- Rollback")[0].replace(/^--.*$/gm, "");
check("Migration does not edit earlier objects except one additive column", !/\bdrop\s+(table|type|function|index|column|trigger)\b/i.test(body) && (body.match(/alter table public\.service_requests/g) || []).length === 1 && !/create or replace function public\.(match_and_assign_helper|release_assignment_for_rematch|accept_assignment|complete_assignment_service)\b/.test(body));
check("No market-price import in the migration", !/market|benchmark|fx_rate|exchange_rate/i.test(body));

if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

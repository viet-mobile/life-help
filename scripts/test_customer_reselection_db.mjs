// Deterministic test of migration 202609260013 (customer re-selection) against the REAL migration SQL
// in PGlite (in-process PostgreSQL). Builds genuine migration-012 state first (including the interim
// "selected Helper declined -> SEARCHING" request), then applies 013 and checks backfill + behaviour.
// No network, no staging, no production.
// Usage: node scripts/test_customer_reselection_db.mjs
import fs from "node:fs";
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const sql = (name) => fs.readFileSync(new URL(name, dir), "utf8");
const CHAIN_012 = ["202609250001_core_service_matching_schema.sql", "202609250002_assignment_release_rematch.sql", "202609250003_helper_identity_and_accept_assignment.sql", "202609260009_assignment_completed_release.sql", "202609260011_exclude_declined_timeout_from_rematch.sql", "202609260012_helper_service_pricing.sql"];
const MIGRATION = "202609260013_customer_reselection.sql";

let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const db = new PGlite();
await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key);");
for (const name of CHAIN_012) await db.exec(sql(name));
const one = async (text, params = []) => (await db.query(text, params)).rows[0];
const all = async (text, params = []) => (await db.query(text, params)).rows;
const rpc = async (fn, ...args) => (await one(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) as r`, args)).r;
const fails = async (text, params = []) => { try { await db.query(text, params); return null; } catch (error) { return error; } };

async function helper(label, { sido = "P", rating = 5, services = ["clog-clearing", "boiler"] } = {}) {
  const row = await one("insert into public.helpers (helper_id, name, email, sido, rating, completed_jobs, is_active, on_duty, primary_locale) values ($1, $2, $3, $4, $5, 0, true, true, 'ko') returning id, helper_id", [`HLP-${label}`, `Name ${label}`, `${label.toLowerCase()}@private.example`, sido, rating]);
  for (const service of services) await db.query("insert into public.helper_services (helper_id, service_slug) values ($1, $2)", [row.id, service]);
  await db.query("insert into public.helper_regions (helper_id, country, sido, gungu) values ($1, 'KR', $2, 'G1')", [row.id, sido]);
  return row;
}
const FIXED = (base) => ({ pricing_mode: "FIXED", currency: "KRW", base_price: base, materials_policy: "INCLUDED" });
const price = (h, subitem, terms, service = "clog-clearing") => rpc("upsert_helper_service_price", h.id, service, subitem, JSON.stringify(terms), true);
let seq = 0;
const select = (p, { customer = "CUSTOMRA", requestId = crypto.randomUUID() } = {}) =>
  rpc("create_customer_selected_request", requestId, customer, `ID · ${customer}`, "en", "KR", "P", "G1", "D1", `addr ${++seq}`, `desc ${seq}`, [], p.price_id, p.revision).then((r) => ({ ...r, requestId }));
const activeOf = (requestId) => all("select id, helper_id, status from public.request_assignments where request_id = $1 and status in ('PENDING', 'NOTIFIED', 'ACCEPTED')", [requestId]);
const reqStatus = async (id) => (await one("select status::text from public.service_requests where id = $1", [id])).status;
const selections = (id) => all("select selection_version v, helper_id, base_price::float8 base, status::text, ended_reason, assignment_id, source_price_revision from public.request_price_selections where request_id = $1 order by selection_version", [id]);
const reselect = (id, p, customer = "CUSTOMRA") => rpc("reselect_customer_helper", id, customer, p.price_id, p.revision);

// ================= migration-012 state before 013 =================
const legacyH = await helper("L1");
const legacyH2 = await helper("L2");
const autoH = await helper("A1", { sido: "AUTO" });
await helper("A2", { sido: "AUTO", rating: 4 });
const lp1 = await price(legacyH, "toilet-simple", FIXED(60000));
const lp2 = await price(legacyH2, "sink", FIXED(50000));
const legacyActive = await select(lp1);
const legacyDeclined = await select(lp2, { customer: "CUSTOMRB" });
const legacyRelease = await rpc("release_assignment_for_rematch", (await activeOf(legacyDeclined.requestId))[0].id, "DECLINED");
const autoReq = (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status) values ('AUTOCUST', 'x', 'boiler', 'KR', 'AUTO', 'G1', 'auto', 'SEARCHING') returning id")).id;
check("012 interim state reproduced: selected Helper declined -> request SEARCHING (the gap 013 closes)", legacyRelease.success && (await reqStatus(legacyDeclined.requestId)) === "SEARCHING" && legacyActive.success, JSON.stringify(legacyRelease));
const snapsBefore = await all("select * from public.request_price_snapshots order by request_id");

// ================= apply 013 =================
await db.exec(sql(MIGRATION));
check("013 applies cleanly on top of 012 with existing data", true);
const enumValues = (await all("select unnest(enum_range(null::public.service_request_status))::text v")).map((r) => r.v);
check("Request status CUSTOMER_RESELECTION_REQUIRED exists (existing statuses kept)", enumValues.includes("CUSTOMER_RESELECTION_REQUIRED") && enumValues.includes("SEARCHING") && enumValues.includes("NO_HELPER_AVAILABLE"), enumValues.join());

// ---------------- backfill ----------------
const bActive = await selections(legacyActive.requestId);
const bDeclined = await selections(legacyDeclined.requestId);
check("Backfill: active 012 snapshot -> selection v1 ACCEPTED, linked to its assignment", bActive.length === 1 && bActive[0].v === 1 && bActive[0].status === "ACCEPTED" && bActive[0].base === 60000 && bActive[0].assignment_id === (await activeOf(legacyActive.requestId))[0].id, JSON.stringify(bActive));
check("Backfill: declined 012 snapshot -> selection v1 ENDED / HELPER_DECLINED (history kept)", bDeclined.length === 1 && bDeclined[0].status === "ENDED" && bDeclined[0].ended_reason === "HELPER_DECLINED" && bDeclined[0].base === 50000, JSON.stringify(bDeclined));
check("Backfill: interim SEARCHING customer-selected request -> CUSTOMER_RESELECTION_REQUIRED", (await reqStatus(legacyDeclined.requestId)) === "CUSTOMER_RESELECTION_REQUIRED");
check("Backfill: AUTO_MATCH SEARCHING request untouched", (await reqStatus(autoReq)) === "SEARCHING");
check("Legacy snapshots untouched (row-for-row identical) and frozen (service_role can no longer insert)", JSON.stringify(await all("select * from public.request_price_snapshots order by request_id")) === JSON.stringify(snapsBefore) && (await one("select has_table_privilege('service_role', 'public.request_price_snapshots', 'insert') i")).i === false);

// ---------------- access ----------------
for (const role of ["anon", "authenticated"]) {
  const t = await one(`select has_table_privilege('${role}', 'public.request_price_selections', 'select') s, has_table_privilege('${role}', 'public.request_price_selections', 'insert') i, has_function_privilege('${role}', 'public.reselect_customer_helper(uuid, text, uuid, integer)', 'execute') f`);
  check(`${role} cannot read / write selections or call reselect_customer_helper`, !t.s && !t.i && !t.f, JSON.stringify(t));
}
const sr = await one("select has_table_privilege('service_role', 'public.request_price_selections', 'delete') d, has_table_privilege('service_role', 'public.request_price_selections', 'truncate') t, has_column_privilege('service_role', 'public.request_price_selections', 'base_price', 'update') bp, has_column_privilege('service_role', 'public.request_price_selections', 'status', 'update') st, has_function_privilege('service_role', 'public.reselect_customer_helper(uuid, text, uuid, integer)', 'execute') f");
check("service_role: no DELETE / TRUNCATE, no UPDATE of commercial columns; may only end a selection; may call the RPC", !sr.d && !sr.t && !sr.bp && sr.st && sr.f, JSON.stringify(sr));

// ================= new flow =================
const h1 = await helper("H1");
const h2 = await helper("H2", { rating: 4 });
const h3 = await helper("H3", { rating: 3 });
const p1 = await price(h1, "toilet-simple", FIXED(60000));
const p2 = await price(h2, "toilet-simple", FIXED(75000));
const R = await select(p1);
const v1 = await selections(R.requestId);
check("Selected request after 013: selection v1 ACCEPTED (H1 / 60,000), no new legacy snapshot", R.success && v1.length === 1 && v1[0].helper_id === h1.id && v1[0].base === 60000 && v1[0].status === "ACCEPTED" && v1[0].assignment_id === R.assignment_id && !(await one("select 1 x from public.request_price_snapshots where request_id = $1", [R.requestId])), JSON.stringify(v1));
check("012 result contract unchanged (MATCHED, currency, initial amount)", R.status === "MATCHED" && R.currency === "KRW" && Number(R.initial_payable_amount) === 60000);

// H1 declines
const rel = await rpc("release_assignment_for_rematch", R.assignment_id, "DECLINED");
const afterDecline = await selections(R.requestId);
const notice = await all("select recipient_type::text, recipient_id, type, title, body, payload from public.app_notifications where type = 'CUSTOMER_RESELECTION_REQUIRED' and payload->>'request_id' = $1", [R.requestId]);
check("H1 DECLINES -> request CUSTOMER_RESELECTION_REQUIRED (NOT SEARCHING)", rel.success && rel.customer_reselection_required === true && rel.request_status === "CUSTOMER_RESELECTION_REQUIRED" && (await reqStatus(R.requestId)) === "CUSTOMER_RESELECTION_REQUIRED", JSON.stringify(rel));
check("Selection v1 ENDED / HELPER_DECLINED; H1 / 60,000 terms preserved", afterDecline.length === 1 && afterDecline[0].status === "ENDED" && afterDecline[0].ended_reason === "HELPER_DECLINED" && afterDecline[0].base === 60000 && afterDecline[0].helper_id === h1.id);
check("Customer in-app notice once: 새 Helper를 선택해 주세요, no price and no Helper identity in it", notice.length === 1 && notice[0].recipient_type === "CUSTOMER" && notice[0].recipient_id === "CUSTOMRA" && notice[0].title === "새 Helper를 선택해 주세요" && !/60|000|HLP-|Name|@/.test(JSON.stringify(notice[0].title + notice[0].body)) && Object.keys(notice[0].payload).join() === "request_id", JSON.stringify(notice));
const m = await rpc("match_and_assign_helper", R.requestId);
check("Automatic matcher does NOT consume CUSTOMER_RESELECTION_REQUIRED (no assignment, free H2 untouched)", m.success === false && (await activeOf(R.requestId)).length === 0 && (await all("select 1 from public.request_assignments where helper_id = $1", [h2.id])).length === 0, JSON.stringify(m));
check("Direct assignment of another Helper blocked (no current accepted selection)", /CUSTOMER_SELECTED_HELPER_LOCKED/.test(String((await fails("insert into public.request_assignments (request_id, helper_id, status) values ($1, $2, 'PENDING')", [R.requestId, h2.id]))?.message)));
check("Re-release of the ended assignment is refused", (await rpc("release_assignment_for_rematch", R.assignment_id, "DECLINED")).code === "ASSIGNMENT_NOT_ACTIVE");

// re-selection guards
const other = await price(h3, "toilet-simple", FIXED(70000));
check("Re-selection by another customer -> REQUEST_NOT_FOUND (no leak)", (await reselect(R.requestId, p2, "CUSTOMRZ")).code === "REQUEST_NOT_FOUND");
check("Re-selecting the Helper who declined -> HELPER_PREVIOUSLY_DECLINED", (await reselect(R.requestId, (await price(h1, "toilet-simple", FIXED(61000))))).code === "HELPER_PREVIOUSLY_DECLINED");
const staleP2 = await price(h2, "toilet-simple", FIXED(76000));
check("Stale offer revision -> PRICE_CHANGED, nothing written", (await reselect(R.requestId, p2)).code === "PRICE_CHANGED" && (await selections(R.requestId)).length === 1 && (await reqStatus(R.requestId)) === "CUSTOMER_RESELECTION_REQUIRED");
const boilerOffer = await price(h2, "boiler-install", FIXED(300000), "boiler");
check("Offer for a different service -> OFFER_SERVICE_MISMATCH", (await reselect(R.requestId, boilerOffer)).code === "OFFER_SERVICE_MISMATCH");
const busyReq = await select(other, { customer: "CUSTOMRC" });
check("Busy Helper -> HELPER_NO_LONGER_AVAILABLE, nothing written", busyReq.success && (await reselect(R.requestId, other)).code === "HELPER_NO_LONGER_AVAILABLE" && (await selections(R.requestId)).length === 1);
await rpc("set_helper_service_price_status", h2.id, staleP2.price_id, "PAUSED");
check("Paused offer -> OFFER_UNAVAILABLE", (await reselect(R.requestId, staleP2)).code === "OFFER_UNAVAILABLE");
const p2Live = await rpc("set_helper_service_price_status", h2.id, staleP2.price_id, "ACTIVE");
const p2Now = { price_id: staleP2.price_id, revision: p2Live.revision };

// explicit re-selection of H2 / P2
const re = await reselect(R.requestId, p2Now);
const hist = await selections(R.requestId);
const act = await activeOf(R.requestId);
check("Customer explicitly re-selects H2 at 76,000 -> MATCHED, selection v2, new PENDING assignment to H2", re.success && re.selection_version === 2 && re.status === "MATCHED" && (await reqStatus(R.requestId)) === "MATCHED" && act.length === 1 && act[0].helper_id === h2.id && act[0].id === re.assignment_id && Number(re.initial_payable_amount) === 76000, JSON.stringify(re));
check("History: v1 H1 / 60,000 ENDED (unchanged) + v2 H2 / 76,000 ACCEPTED; exactly one accepted", hist.length === 2 && hist[0].helper_id === h1.id && hist[0].base === 60000 && hist[0].status === "ENDED" && hist[1].helper_id === h2.id && hist[1].base === 76000 && hist[1].status === "ACCEPTED" && hist[1].assignment_id === re.assignment_id && hist.filter((h) => h.status === "ACCEPTED").length === 1, JSON.stringify(hist));
check("New Helper gets one NEW_SERVICE_REQUEST notification + a new conversation", (await all("select 1 from public.app_notifications where recipient_id = $1 and type = 'NEW_SERVICE_REQUEST' and payload->>'request_id' = $2", [h2.helper_id, R.requestId])).length === 1 && (await all("select 1 from public.conversations where request_id = $1 and helper_id = $2", [R.requestId, h2.id])).length === 1);
check("Replay of the same accepted offer -> replayed, nothing new", (await reselect(R.requestId, p2Now)).replayed === true && (await selections(R.requestId)).length === 2);
check("Another offer once MATCHED -> REQUEST_NOT_RESELECTABLE", (await reselect(R.requestId, other)).code === "REQUEST_NOT_RESELECTABLE");
await price(h2, "toilet-simple", FIXED(90000));
check("Later Helper price change does not touch any selection version", JSON.stringify((await selections(R.requestId)).map((h) => h.base)) === "[60000,76000]");

// immutability
const vid = (await one("select id from public.request_price_selections where request_id = $1 and selection_version = 1", [R.requestId])).id;
const v2id = (await one("select id from public.request_price_selections where request_id = $1 and selection_version = 2", [R.requestId])).id;
check("Commercial terms immutable (base_price / helper / currency of any version)", !!(await fails("update public.request_price_selections set base_price = 1 where id = $1", [vid])) && !!(await fails("update public.request_price_selections set helper_id = $2 where id = $1", [v2id, h3.id])) && !!(await fails("update public.request_price_selections set currency = 'USD' where id = $1", [v2id])));
check("ENDED cannot be re-accepted; ACCEPTED cannot end without a reason", !!(await fails("update public.request_price_selections set status = 'ACCEPTED', ended_at = null, ended_reason = null where id = $1", [vid])) && !!(await fails("update public.request_price_selections set status = 'ENDED' where id = $1", [v2id])));
check("A second ACCEPTED selection for one request is impossible (partial unique index)", !!(await fails("insert into public.request_price_selections (request_id, selection_version, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price, materials_policy, tax_included, initial_payable_amount, quote_required, source_helper_price_id, source_price_revision, source_price_updated_at) select request_id, 9, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price, materials_policy, tax_included, initial_payable_amount, quote_required, source_helper_price_id, source_price_revision, source_price_updated_at from public.request_price_selections where id = $1", [v2id])));

// TIMEOUT path (conceptual support; no runner exists)
const to = await rpc("release_assignment_for_rematch", re.assignment_id, "TIMEOUT");
const afterTo = await selections(R.requestId);
check("Selected H2 TIMEOUT -> CUSTOMER_RESELECTION_REQUIRED, v2 ENDED / HELPER_TIMEOUT", to.customer_reselection_required === true && (await reqStatus(R.requestId)) === "CUSTOMER_RESELECTION_REQUIRED" && afterTo[1].status === "ENDED" && afterTo[1].ended_reason === "HELPER_TIMEOUT" && afterTo[1].base === 76000);
check("Timed-out H2 cannot be re-selected for this request", (await reselect(R.requestId, { price_id: staleP2.price_id, revision: (await one("select revision from public.helper_service_prices where id = $1", [staleP2.price_id])).revision })).code === "HELPER_PREVIOUSLY_DECLINED");

// legacy interim request can be re-selected
const lp3 = await price(h3, "sink", FIXED(55000));
await db.query("update public.request_assignments set status = 'COMPLETED' where request_id = $1", [busyReq.requestId]);
const legacyRe = await reselect(legacyDeclined.requestId, { price_id: lp3.price_id, revision: lp3.revision }, "CUSTOMRB");
const legacyHist = await selections(legacyDeclined.requestId);
check("Backfilled interim request re-selected: v1 (L2 / 50,000 ENDED, from 012) + v2 (H3 / 55,000 ACCEPTED)", legacyRe.success && legacyHist.length === 2 && legacyHist[0].base === 50000 && legacyHist[0].status === "ENDED" && legacyHist[1].helper_id === h3.id && legacyHist[1].base === 55000 && legacyHist[1].status === "ACCEPTED", JSON.stringify({ legacyRe, legacyHist }));

// AUTO_MATCH regression (011 exclusion, SEARCHING path)
const am = await rpc("match_and_assign_helper", autoReq);
const amAssign = (await activeOf(autoReq))[0];
const amRel = await rpc("release_assignment_for_rematch", amAssign.id, "DECLINED");
const am2 = await rpc("match_and_assign_helper", autoReq);
const am2Assign = (await activeOf(autoReq))[0];
check("AUTO_MATCH unchanged: decline -> SEARCHING (no reselection flag) -> rematch to the other Helper (011)", am.status === "MATCHED" && amAssign.helper_id === autoH.id && amRel.request_status === "SEARCHING" && amRel.customer_reselection_required === false && am2.status === "MATCHED" && am2Assign.helper_id !== autoH.id, JSON.stringify({ amRel, am2 }));
check("No AUTO_MATCH request got a price selection", (await all("select 1 from public.request_price_selections where request_id = $1", [autoReq])).length === 0);

if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");

// Live STAGING verification of migration 202609260012 (helper service pricing), database level.
// Runs BEFORE the Worker is deployed: service role, anon key and a real Helper JWT against PostgREST.
//
//   A. Structure: catalog (19 rows), helper_service_prices, request_price_snapshots, selection_mode,
//      enums, the four RPCs with their exact parameters.
//   B. Access: anon / authenticated (real Helper JWT) cannot read or write any pricing table or RPC;
//      service_role cannot UPDATE / DELETE a price snapshot.
//   C. Behaviour: qualification, cross-helper writes, DRAFT / ACTIVE / PAUSED, all six pricing modes,
//      all four materials policies, publication rules, revision bump, offers visibility,
//      selected-request snapshot + selected-helper lock (no substitution).
// Usage: node scripts/test_pricing_migration_staging.mjs
import crypto from "node:crypto";
import { db, env, fixtures, readResponse, recorder, rpc, serviceKey, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const runId = `PM${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const CATALOG = {
  "clog-clearing": ["toilet-simple", "sink", "floor-drain", "high-pressure"], "leak-plumbing": ["leak-detection", "faucet-repair", "pipe-repair"],
  boiler: ["boiler-diagnostic", "boiler-install"], cleaning: ["move-in-cleaning", "regular-cleaning", "appliance-cleaning"], housing: ["room-search-accompaniment"],
  "bank-help": ["account-opening"], "insurance-help": ["insurance-enrollment"], "job-help": ["job-application-support"], "hospital-help": ["general-outpatient", "remote-interpretation"], "mobile-help": ["phone-plan-setup"],
};
const as = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const upsert = (helperId, service, subitem, terms, publish) => rpc("upsert_helper_service_price", { p_helper_id: helperId, p_service_code: service, p_subitem_code: subitem, p_terms: terms, p_publish: publish }).then((r) => r.data);
const offers = (service, subitem, sido) => rpc("list_customer_offers", { p_service_code: service, p_subitem_code: subitem, p_country: "KR", p_sido: sido, p_gungu: "G1" }).then((r) => (Array.isArray(r.data) ? r.data : []));
const priceRow = async (id) => (await db(`helper_service_prices?id=eq.${id}&select=*`))[0];

try {
  // ================= A. structure =================
  const catalog = await db("service_subitems?select=service_code,subitem_code,active,allowed_pricing_modes,default_pricing_mode&order=service_code,sort_order");
  const expected = Object.entries(CATALOG).flatMap(([s, list]) => list.map((c) => `${s}/${c}`)).sort();
  const actual = catalog.map((c) => `${c.service_code}/${c.subitem_code}`).sort();
  expect("A1. service_subitems exists: exactly the 19 detailed services under the 10 service codes, all active", JSON.stringify(actual) === JSON.stringify(expected) && catalog.every((c) => c.active && c.allowed_pricing_modes.includes(c.default_pricing_mode)), { actual });
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: as(serviceKey) })).json();
  const cols = (table) => Object.keys(spec.definitions?.[table]?.properties || {});
  const priceCols = ["id", "helper_id", "service_subitem_id", "pricing_mode", "currency", "base_price", "minimum_charge", "included_quantity", "included_minutes", "extra_unit_price", "extra_hour_price", "materials_policy", "materials_note", "emergency_multiplier", "night_multiplier", "weekend_multiplier", "tax_included", "status", "revision", "valid_from", "published_at"];
  expect("A2. helper_service_prices exists with every term column", priceCols.every((c) => cols("helper_service_prices").includes(c)), cols("helper_service_prices"));
  const snapCols = ["request_id", "helper_id", "service_subitem_id", "service_code", "subitem_code", "pricing_mode", "currency", "base_price", "minimum_charge", "included_quantity", "included_minutes", "extra_unit_price", "extra_hour_price", "materials_policy", "materials_note", "emergency_multiplier", "night_multiplier", "weekend_multiplier", "tax_included", "initial_payable_amount", "quote_required", "source_helper_price_id", "source_price_revision", "source_price_updated_at", "agreed_at"];
  const snapDef = spec.definitions?.request_price_snapshots;
  expect("A3. request_price_snapshots exists; request_id is the primary key (one snapshot per request)", snapCols.every((c) => cols("request_price_snapshots").includes(c)) && /Primary Key/.test(snapDef?.properties?.request_id?.description || ""), { cols: cols("request_price_snapshots"), pk: snapDef?.properties?.request_id?.description });
  expect("A4. service_requests.selection_mode exists (default AUTO_MATCH)", cols("service_requests").includes("selection_mode") && String(spec.definitions?.service_requests?.properties?.selection_mode?.default) === "AUTO_MATCH", spec.definitions?.service_requests?.properties?.selection_mode);
  const modeEnum = spec.definitions?.helper_service_prices?.properties?.pricing_mode?.enum || [];
  const matEnum = spec.definitions?.helper_service_prices?.properties?.materials_policy?.enum || [];
  const statusEnum = spec.definitions?.helper_service_prices?.properties?.status?.enum || [];
  expect("A5. enums: 6 pricing modes, 4 materials policies, 3 statuses", modeEnum.join() === "FIXED,HOURLY,PER_UNIT,PER_METER,PER_AREA,DIAGNOSTIC_PLUS_QUOTE" && matEnum.join() === "INCLUDED,EXCLUDED,PARTIALLY_INCLUDED,QUOTE_REQUIRED" && statusEnum.join() === "DRAFT,ACTIVE,PAUSED", { modeEnum, matEnum, statusEnum });
  const params = (name) => Object.keys(spec.paths?.[`/rpc/${name}`]?.post?.parameters?.[0]?.schema?.properties || {}).sort().join();
  const rpcs = {
    upsert_helper_service_price: "p_helper_id,p_publish,p_service_code,p_subitem_code,p_terms",
    set_helper_service_price_status: "p_helper_id,p_price_id,p_status",
    list_customer_offers: "p_country,p_gungu,p_service_code,p_sido,p_subitem_code",
    create_customer_selected_request: "p_address,p_country,p_customer_display_name,p_customer_id,p_customer_locale,p_description,p_dong,p_gungu,p_price_id,p_price_revision,p_request_id,p_selected_options,p_sido",
  };
  expect("A6. all four pricing RPCs exist with the exact parameters", Object.entries(rpcs).every(([n, p]) => params(n) === p), Object.fromEntries(Object.keys(rpcs).map((n) => [n, params(n)])));
  const mx = await rpc("match_and_assign_helper", { p_request_id: crypto.randomUUID() });
  expect("A7. migration 011 matcher still present (Request not found for unknown id)", mx.status === 200 && mx.data?.error === "Request not found", mx);

  // ================= fixtures =================
  const h1 = await fx.createHelper("H1", { service: "cleaning" });
  const h2 = await fx.createHelper("H2", { service: "cleaning" });
  for (const s of ["clog-clearing", "leak-plumbing", "boiler", "hospital-help"]) await db("helper_services", "POST", { helper_id: h1.helper.id, service_slug: s });
  const sido = fx.sido;

  // ================= B. access / default deny =================
  const anon = as(anonKey), helperJwt = as(anonKey, h1.token);
  const tables = ["service_subitems", "helper_service_prices", "request_price_snapshots"];
  const reads = [];
  for (const t of tables) for (const [who, h] of [["anon", anon], ["helper", helperJwt]]) { const r = await rest(`${t}?select=*&limit=1`, h); reads.push([who, t, r.status, r.body?.code, Array.isArray(r.body) ? r.body.length : null]); }
  expect("B1. anon + authenticated Helper JWT cannot read any pricing table (permission denied)", reads.every(([, , s, c]) => (s === 401 || s === 403) && (c === "42501" || !c)), reads);
  const catalogId = (await db("service_subitems?service_code=eq.cleaning&subitem_code=eq.move-in-cleaning&select=id"))[0].id;
  const row = { helper_id: h1.helper.id, service_subitem_id: catalogId, pricing_mode: "FIXED", currency: "KRW", base_price: 1, materials_policy: "INCLUDED", status: "ACTIVE" };
  const writes = [];
  for (const [who, h] of [["anon", anon], ["helper", helperJwt]]) {
    writes.push([who, "insert", (await rest("helper_service_prices", h, "POST", row)).status]);
    writes.push([who, "update", (await rest(`helper_service_prices?helper_id=eq.${h2.helper.id}`, h, "PATCH", { base_price: 1 })).status]);
    writes.push([who, "delete", (await rest(`helper_service_prices?helper_id=eq.${h2.helper.id}`, h, "DELETE")).status]);
    writes.push([who, "catalog", (await rest("service_subitems", h, "POST", { service_code: "boiler", subitem_code: "x", allowed_pricing_modes: ["FIXED"], default_pricing_mode: "FIXED" })).status]);
    writes.push([who, "snapshot", (await rest("request_price_snapshots", h, "POST", { request_id: crypto.randomUUID() })).status]);
  }
  expect("B2. anon + authenticated Helper JWT cannot write Helper prices, catalog or snapshots", writes.every(([, , s]) => s === 401 || s === 403), writes);
  const rpcDenied = [];
  for (const [who, h] of [["anon", anon], ["helper", helperJwt]]) for (const [name, args] of [
    ["upsert_helper_service_price", { p_helper_id: h2.helper.id, p_service_code: "cleaning", p_subitem_code: "move-in-cleaning", p_terms: { pricing_mode: "FIXED" }, p_publish: false }],
    ["set_helper_service_price_status", { p_helper_id: h2.helper.id, p_price_id: crypto.randomUUID(), p_status: "ACTIVE" }],
    ["list_customer_offers", { p_service_code: "cleaning", p_subitem_code: "move-in-cleaning", p_country: "KR", p_sido: sido, p_gungu: "G1" }],
    ["create_customer_selected_request", { p_request_id: crypto.randomUUID(), p_customer_id: "X", p_customer_display_name: "x", p_customer_locale: "en", p_country: "KR", p_sido: sido, p_gungu: "G1", p_dong: "", p_address: "", p_description: runId, p_selected_options: [], p_price_id: crypto.randomUUID(), p_price_revision: 1 }],
  ]) { const r = await rest(`rpc/${name}`, h, "POST", args); rpcDenied.push([who, name, r.status]); }
  expect("B3. anon + authenticated cannot execute any pricing RPC", rpcDenied.every(([, , s]) => s === 401 || s === 403 || s === 404), rpcDenied);
  expect("B4. none of those attempts wrote anything", (await db(`helper_service_prices?helper_id=in.(${h1.helper.id},${h2.helper.id})&select=id`)).length === 0 && (await db(`service_requests?description=eq.${runId}&select=id`)).length === 0);

  // ================= C. behaviour =================
  const notQualified = await upsert(h2.helper.id, "boiler", "boiler-diagnostic", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "QUOTE_REQUIRED" }, true);
  expect("C1. Helper can price only qualified services (NOT_QUALIFIED_FOR_SERVICE)", notQualified?.code === "NOT_QUALIFIED_FOR_SERVICE", notQualified);
  const notAllowed = await upsert(h1.helper.id, "clog-clearing", "toilet-simple", { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED", included_minutes: 60 }, true);
  const unknownSub = await upsert(h1.helper.id, "cleaning", "no-such-item", { pricing_mode: "FIXED" }, false);
  expect("C2. mode not allowed for the detailed service / unknown detailed service rejected", notAllowed?.code === "PRICING_MODE_NOT_ALLOWED" && unknownSub?.code === "SUBITEM_NOT_FOUND", { notAllowed, unknownSub });

  const MODES = [
    ["FIXED", "clog-clearing", "toilet-simple", { currency: "KRW", base_price: 60000, materials_policy: "INCLUDED", night_multiplier: 1.3, weekend_multiplier: 1.2, emergency_multiplier: 1.5 }, 60000],
    ["HOURLY", "hospital-help", "general-outpatient", { currency: "KRW", base_price: 30000, included_minutes: 120, extra_hour_price: 25000, minimum_charge: 50000, materials_policy: "EXCLUDED" }, 60000],
    ["PER_UNIT", "cleaning", "appliance-cleaning", { currency: "KRW", base_price: 40000, included_quantity: 2, extra_unit_price: 35000, materials_policy: "PARTIALLY_INCLUDED", materials_note: "detergent included" }, 80000],
    ["PER_METER", "leak-plumbing", "pipe-repair", { currency: "KRW", base_price: 20000, minimum_charge: 80000, extra_unit_price: 20000, materials_policy: "QUOTE_REQUIRED" }, 80000],
    ["PER_AREA", "cleaning", "move-in-cleaning", { currency: "KRW", base_price: 12000, included_quantity: 30, materials_policy: "INCLUDED" }, 360000],
    ["DIAGNOSTIC_PLUS_QUOTE", "boiler", "boiler-diagnostic", { currency: "KRW", base_price: 30000, materials_policy: "QUOTE_REQUIRED" }, 30000],
  ];
  const saved = {};
  for (const [mode, service, subitem, terms] of MODES) {
    const draft = await upsert(h1.helper.id, service, subitem, { pricing_mode: mode, ...terms }, false);
    const draftVisible = (await offers(service, subitem, sido)).length;
    const pub = await upsert(h1.helper.id, service, subitem, { pricing_mode: mode, ...terms }, true);
    const list = await offers(service, subitem, sido);
    saved[mode] = { ...pub, service, subitem };
    expect(`C3. ${mode}: DRAFT saved (not visible) -> published ACTIVE (visible to customers)`, draft?.success === true && draftVisible === 0 && pub?.success === true && list.length === 1 && list[0].pricing_mode === mode && Number(list[0].base_price) === terms.base_price, { draft, pub, list: list.length });
  }
  const materials = [];
  for (const policy of ["INCLUDED", "EXCLUDED", "PARTIALLY_INCLUDED", "QUOTE_REQUIRED"]) {
    const r = await upsert(h1.helper.id, "clog-clearing", "sink", { pricing_mode: "FIXED", currency: "KRW", base_price: 50000, materials_policy: policy, materials_note: `${policy} note` }, true);
    const stored = r?.price_id ? await priceRow(r.price_id) : null;
    materials.push([policy, r?.success, stored?.materials_policy, stored?.materials_note]);
  }
  expect("C4. all four materials policies publish and are stored with their note", materials.every(([p, ok, s, n]) => ok && s === p && n === `${p} note`), materials);
  const invalid = [
    ["HOURLY without included minutes", "hospital-help", "general-outpatient", { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED" }],
    ["HOURLY 10 minutes", "hospital-help", "general-outpatient", { pricing_mode: "HOURLY", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED", included_minutes: 10 }],
    ["zero price", "clog-clearing", "floor-drain", { pricing_mode: "FIXED", currency: "KRW", base_price: 0, materials_policy: "INCLUDED" }],
    ["no currency", "clog-clearing", "floor-drain", { pricing_mode: "FIXED", base_price: 1000, materials_policy: "INCLUDED" }],
    ["no materials policy", "clog-clearing", "floor-drain", { pricing_mode: "FIXED", currency: "KRW", base_price: 1000 }],
    ["diagnostic with materials INCLUDED", "boiler", "boiler-diagnostic", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "INCLUDED" }],
    ["diagnostic with minimum charge", "boiler", "boiler-diagnostic", { pricing_mode: "DIAGNOSTIC_PLUS_QUOTE", currency: "KRW", base_price: 30000, materials_policy: "EXCLUDED", minimum_charge: 10000 }],
    ["multiplier 4", "clog-clearing", "floor-drain", { pricing_mode: "FIXED", currency: "KRW", base_price: 1000, materials_policy: "INCLUDED", night_multiplier: 4 }],
    ["negative extra", "clog-clearing", "floor-drain", { pricing_mode: "FIXED", currency: "KRW", base_price: 1000, materials_policy: "INCLUDED", extra_hour_price: -1 }],
  ];
  const rejected = [];
  for (const [label, s, c, t] of invalid) { const r = await upsert(h1.helper.id, s, c, t, true); rejected.push([label, r?.code, r?.reason]); }
  expect("C5. incomplete / incoherent offers cannot be published (INVALID_TERMS)", rejected.every(([, code]) => code === "INVALID_TERMS"), rejected);
  const stillDiag = await offers("boiler", "boiler-diagnostic", sido);
  expect("C6. rejected publish left the existing ACTIVE diagnostic offer untouched", stillDiag.length === 1 && stillDiag[0].materials_policy === "QUOTE_REQUIRED" && stillDiag[0].revision === saved.DIAGNOSTIC_PLUS_QUOTE.revision, stillDiag);

  // DRAFT / ACTIVE / PAUSED + cross-helper
  const fixedId = saved.FIXED.price_id;
  const cross = await rpc("set_helper_service_price_status", { p_helper_id: h2.helper.id, p_price_id: fixedId, p_status: "PAUSED" });
  const crossUpsert = await upsert(h2.helper.id, "clog-clearing", "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 1, materials_policy: "INCLUDED" }, true);
  const afterCross = await priceRow(fixedId);
  expect("C7. Helper cannot modify another Helper's price (PRICE_NOT_FOUND / not qualified; row unchanged)", cross.data?.code === "PRICE_NOT_FOUND" && crossUpsert?.code === "NOT_QUALIFIED_FOR_SERVICE" && afterCross.status === "ACTIVE" && Number(afterCross.base_price) === 60000, { cross: cross.data, crossUpsert });
  const paused = await rpc("set_helper_service_price_status", { p_helper_id: h1.helper.id, p_price_id: fixedId, p_status: "PAUSED" });
  const pausedVisible = (await offers("clog-clearing", "toilet-simple", sido)).length;
  const resumed = await rpc("set_helper_service_price_status", { p_helper_id: h1.helper.id, p_price_id: fixedId, p_status: "ACTIVE" });
  const resumedVisible = (await offers("clog-clearing", "toilet-simple", sido)).length;
  const toDraft = await rpc("set_helper_service_price_status", { p_helper_id: h1.helper.id, p_price_id: fixedId, p_status: "DRAFT" });
  const draftVisible = (await offers("clog-clearing", "toilet-simple", sido)).length;
  await rpc("set_helper_service_price_status", { p_helper_id: h1.helper.id, p_price_id: fixedId, p_status: "ACTIVE" });
  const statusOnly = await priceRow(fixedId);
  expect("C8. ACTIVE -> PAUSED (hidden) -> ACTIVE (visible) -> DRAFT (hidden); status change keeps the revision", paused.data?.success && pausedVisible === 0 && resumed.data?.success && resumedVisible === 1 && toDraft.data?.success && draftVisible === 0 && statusOnly.revision === saved.FIXED.revision, { paused: paused.data, resumed: resumed.data, rev: statusOnly.revision });
  // H2 same detailed service, higher price -> both listed; off-duty / busy hidden
  await db("helper_services", "POST", { helper_id: h2.helper.id, service_slug: "clog-clearing" });
  const h2Price = await upsert(h2.helper.id, "clog-clearing", "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 75000, materials_policy: "INCLUDED" }, true);
  const both = await offers("clog-clearing", "toilet-simple", sido);
  expect("C9. two Helpers, same detailed service, different prices: both offers listed", both.length === 2 && both.map((o) => Number(o.base_price)).sort().join() === "60000,75000", both.map((o) => o.base_price));
  record("INFO", `Offer row keys (service-role RPC, mapped by the Worker): ${Object.keys(both[0] || {}).sort().join(",")}`);
  await db(`helpers?id=eq.${h2.helper.id}`, "PATCH", { on_duty: false });
  const offDuty = await offers("clog-clearing", "toilet-simple", sido);
  await db(`helpers?id=eq.${h2.helper.id}`, "PATCH", { on_duty: true });
  const otherRegion = await offers("clog-clearing", "toilet-simple", `${sido}-OTHER`);
  expect("C10. off-duty Helper hidden; other region sees no offers", offDuty.length === 1 && otherRegion.length === 0, { offDuty: offDuty.length, otherRegion: otherRegion.length });

  // Revision bump + selected request + snapshot + lock
  const edited = await upsert(h1.helper.id, "clog-clearing", "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED", night_multiplier: 1.3, weekend_multiplier: 1.2, emergency_multiplier: 1.4 }, true);
  expect("C11. any customer-facing term change bumps the revision", edited?.revision === saved.FIXED.revision + 1, { before: saved.FIXED.revision, after: edited?.revision });
  const reqId = crypto.randomUUID();
  fx.created.requestIds.add(reqId);
  const create = (priceId, revision, id = reqId, customer = "PMCUSTOM") => rpc("create_customer_selected_request", { p_request_id: id, p_customer_id: customer, p_customer_display_name: "PM", p_customer_locale: "en", p_country: "KR", p_sido: sido, p_gungu: "G1", p_dong: "", p_address: "", p_description: runId, p_selected_options: [], p_price_id: priceId, p_price_revision: revision }).then((r) => r.data);
  const stale = await create(fixedId, saved.FIXED.revision);
  expect("C12. stale revision -> PRICE_CHANGED, nothing written", stale?.code === "PRICE_CHANGED" && stale.current_revision === edited.revision && (await db(`service_requests?id=eq.${reqId}&select=id`)).length === 0, stale);
  const made = await create(fixedId, edited.revision);
  const req = (await db(`service_requests?id=eq.${reqId}&select=status,selection_mode,customer_id`))[0];
  // Migration 013 froze request_price_snapshots (legacy v1 record); the price authority is request_price_selections.
  const snap = (await db(`request_price_selections?request_id=eq.${reqId}&selection_version=eq.1&select=*`))[0];
  const asg = await db(`request_assignments?request_id=eq.${reqId}&select=id,helper_id,status`);
  expect("C13. selected request: MATCHED / CUSTOMER_SELECTED + PENDING assignment to H1 + price selection v1 of revision", made?.success && req?.status === "MATCHED" && req.selection_mode === "CUSTOMER_SELECTED" && asg.length === 1 && asg[0].helper_id === h1.helper.id && snap?.helper_id === h1.helper.id && Number(snap.base_price) === 60000 && Number(snap.initial_payable_amount) === 60000 && snap.source_price_revision === edited.revision && Number(snap.emergency_multiplier) === 1.4, { made, req, snap });
  const snapPatch = await rest(`request_price_selections?request_id=eq.${reqId}`, as(serviceKey), "PATCH", { base_price: 1 });
  const snapDelete = await rest(`request_price_selections?request_id=eq.${reqId}`, as(serviceKey), "DELETE");
  const snapAfter = (await db(`request_price_selections?request_id=eq.${reqId}&select=base_price`))[0];
  expect("C14. selected price UPDATE / DELETE denied even for service_role; value unchanged", denied(snapPatch) && denied(snapDelete) && Number(snapAfter?.base_price) === 60000, { patch: [snapPatch.status, snapPatch.body?.code], del: [snapDelete.status, snapDelete.body?.code] });
  await upsert(h1.helper.id, "clog-clearing", "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 80000, materials_policy: "INCLUDED" }, true);
  const snapLater = (await db(`request_price_selections?request_id=eq.${reqId}&selection_version=eq.1&select=base_price,initial_payable_amount`))[0];
  expect("C15. later price change (60,000 -> 80,000) does not touch the accepted price selection", Number(snapLater.base_price) === 60000 && Number(snapLater.initial_payable_amount) === 60000 && Number((await priceRow(fixedId)).base_price) === 80000, snapLater);
  let lock = null;
  try { await db("request_assignments", "POST", { request_id: reqId, helper_id: h2.helper.id, status: "DECLINED" }); } catch (error) { lock = String(error.message); }
  expect("C16. assigning a different Helper to a CUSTOMER_SELECTED request is blocked (CUSTOMER_SELECTED_HELPER_LOCKED)", !!lock && (await db(`request_assignments?request_id=eq.${reqId}&helper_id=eq.${h2.helper.id}&select=id`)).length === 0, lock);
  const busy = await offers("clog-clearing", "toilet-simple", sido);
  expect("C17. busy H1 (active selected assignment) no longer offered; H2 still offered", busy.length === 1 && busy[0].helper_id === h2.helper.id, busy.map((o) => o.helper_alias));
  const replay = await create(fixedId, edited.revision);
  const conflict = await create(fixedId, edited.revision, reqId, "OTHERCUS");
  expect("C18. replay returns the original request; another customer with the same id conflicts", replay?.replayed === true && conflict?.code === "IDEMPOTENCY_KEY_CONFLICT", { replay, conflict });
  const r2 = crypto.randomUUID(); fx.created.requestIds.add(r2);
  const taken = await create(h2Price.price_id, h2Price.revision, r2);
  const busyH1 = crypto.randomUUID(); fx.created.requestIds.add(busyH1);
  const h1Busy = await create(fixedId, edited.revision + 1, busyH1);
  expect("C19. busy selected Helper -> HELPER_NO_LONGER_AVAILABLE, nothing written", h1Busy?.code === "HELPER_NO_LONGER_AVAILABLE" && (await db(`service_requests?id=eq.${busyH1}&select=id`)).length === 0 && taken?.success === true, { h1Busy, taken });
} catch (error) {
  record("FAIL", "migration 012 harness", String(error?.stack || error).slice(0, 500));
} finally {
  const leftovers = await fx.cleanup();
  const ids = [...fx.created.helperIds, "00000000-0000-0000-0000-000000000000"].join(",");
  leftovers.prices = (await db(`helper_service_prices?helper_id=in.(${ids})&select=id`)).length;
  leftovers.snapshots = (await db(`request_price_snapshots?helper_id=in.(${ids})&select=request_id`)).length;
  leftovers.catalog = (await db("service_subitems?select=id")).length === 19 ? 0 : 1;
  expect("Fixture cleanup (helpers, auth users, prices, requests, snapshots, notifications)", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

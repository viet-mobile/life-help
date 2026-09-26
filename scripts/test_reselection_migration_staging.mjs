// Live STAGING verification of migration 202609260013 (customer re-selection), database level.
// Runs BEFORE any Worker change: service role, anon key and a real Helper JWT against PostgREST.
//
//   A  CUSTOMER_RESELECTION_REQUIRED exists in the database enum (not just the schema cache)
//   B  request_price_selections + reselect_customer_helper exist with the expected shape
//   C  every 012 snapshot has its v1 selection; the snapshot table is frozen
//   D  one ACCEPTED selection per request
//   E  commercial terms immutable (service_role, anon, Helper JWT); no DELETE
//   F  only ending metadata (status / ended_at / ended_reason) may change, only ACCEPTED -> ENDED
//   G/H fresh CUSTOMER_SELECTED request: request + assignment + v1 selection (exact offer terms,
//      ACCEPTED, linked to the assignment) atomically; no new legacy snapshot
//   I  selected Helper declines -> CUSTOMER_RESELECTION_REQUIRED; the matcher does not consume it
//   J  AUTO_MATCH decline / TIMEOUT exclusion (011) unchanged
// Usage: node scripts/test_reselection_migration_staging.mjs
import crypto from "node:crypto";
import { db, env, fixtures, readResponse, recorder, rpc, serviceKey, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const runId = `RM${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const TERMS = ["pricing_mode", "currency", "base_price", "minimum_charge", "included_quantity", "included_minutes", "extra_unit_price", "extra_hour_price", "materials_policy", "materials_note", "emergency_multiplier", "night_multiplier", "weekend_multiplier", "tax_included"];
const num = (v) => (v === null || v === undefined ? null : typeof v === "boolean" ? v : isNaN(Number(v)) ? v : Number(v));
const selections = (requestId) => db(`request_price_selections?request_id=eq.${requestId}&select=*&order=selection_version`);
const activeOf = (requestId) => db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id,status`);
const statusOf = async (requestId) => (await db(`service_requests?id=eq.${requestId}&select=status`))[0]?.status;
const create = (price, { customer = "RMCUSTOM", id = crypto.randomUUID() } = {}) => {
  fx.created.requestIds.add(id);
  return rpc("create_customer_selected_request", { p_request_id: id, p_customer_id: customer, p_customer_display_name: "RM", p_customer_locale: "en", p_country: "KR", p_sido: fx.sido, p_gungu: "G1", p_dong: "", p_address: "", p_description: `${runId} selected`, p_selected_options: [], p_price_id: price.price_id, p_price_revision: price.revision }).then((r) => ({ ...r.data, requestId: id }));
};
const upsert = (h, subitem, terms) => rpc("upsert_helper_service_price", { p_helper_id: h.helper.id, p_service_code: "clog-clearing", p_subitem_code: subitem, p_terms: terms, p_publish: true }).then((r) => r.data);

try {
  // ================= A / B =================
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: hdr(serviceKey) })).json();
  const statuses = spec.definitions?.service_requests?.properties?.status?.enum || [];
  const probe = await rest("service_requests", hdr(serviceKey), "POST", { request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true, customer_id: "RMPROBEX", customer_display_name: "probe", service_slug: "boiler", country: "KR", sido: `${runId}-PROBE`, gungu: "G1", description: `${runId} probe`, status: "CUSTOMER_RESELECTION_REQUIRED" });
  if (Array.isArray(probe.body) && probe.body[0]?.id) fx.created.requestIds.add(probe.body[0].id);
  expect("A. CUSTOMER_RESELECTION_REQUIRED accepted by the database enum (and listed in the API schema)", statuses.includes("CUSTOMER_RESELECTION_REQUIRED") && probe.status === 201, { statuses, probe: probe.status, err: probe.body?.message });
  const selCols = Object.keys(spec.definitions?.request_price_selections?.properties || {});
  const need = ["id", "request_id", "selection_version", "assignment_id", "helper_id", "service_subitem_id", "service_code", "subitem_code", ...TERMS, "initial_payable_amount", "quote_required", "source_helper_price_id", "source_price_revision", "source_price_updated_at", "status", "accepted_at", "ended_at", "ended_reason"];
  const reParams = Object.keys(spec.paths?.["/rpc/reselect_customer_helper"]?.post?.parameters?.[0]?.schema?.properties || {}).sort().join();
  expect("B. request_price_selections has every column; reselect_customer_helper(p_customer_id, p_price_id, p_price_revision, p_request_id) exists", need.every((c) => selCols.includes(c)) && reParams === "p_customer_id,p_price_id,p_price_revision,p_request_id" && String(spec.definitions?.request_price_selections?.properties?.status?.enum) === "ACCEPTED,ENDED", { missing: need.filter((c) => !selCols.includes(c)), reParams });

  // ================= C =================
  const snaps = await db("request_price_snapshots?select=request_id,helper_id,base_price");
  const v1s = snaps.length ? await db(`request_price_selections?selection_version=eq.1&request_id=in.(${snaps.map((s) => s.request_id).join(",")})&select=request_id,helper_id,base_price`) : [];
  const unmatched = snaps.filter((s) => !v1s.some((v) => v.request_id === s.request_id && v.helper_id === s.helper_id && Number(v.base_price) === Number(s.base_price)));
  const snapInsert = await rest("request_price_snapshots", hdr(serviceKey), "POST", { request_id: crypto.randomUUID() });
  expect(`C. every legacy 012 snapshot (${snaps.length} on staging) has a matching v1 selection; snapshot table frozen (service_role INSERT denied)`, unmatched.length === 0 && denied(snapInsert), { snapshots: snaps.length, unmatched, insert: [snapInsert.status, snapInsert.body?.code] });
  record("INFO", `Legacy request_price_snapshots rows on staging: ${snaps.length} (all 012 fixtures were cleaned up in earlier sprints)`);

  // ================= fixtures =================
  const h1 = await fx.createHelper("H1", { service: "clog-clearing" });
  const h2 = await fx.createHelper("H2", { service: "clog-clearing", rating: 4 });
  const offer1 = await upsert(h1, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, minimum_charge: 50000, included_minutes: 60, extra_hour_price: 20000, materials_policy: "PARTIALLY_INCLUDED", materials_note: `${runId} parts`, night_multiplier: 1.3, weekend_multiplier: 1.2, emergency_multiplier: 1.5, tax_included: true });
  const offer2 = await upsert(h2, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 75000, materials_policy: "INCLUDED" });

  // ================= G / H: fresh post-013 selected request =================
  const made = await create(offer1);
  const row = (await db(`service_requests?id=eq.${made.requestId}&select=status,selection_mode`))[0];
  const asg = await db(`request_assignments?request_id=eq.${made.requestId}&select=id,helper_id,status`);
  const v1 = (await selections(made.requestId))[0];
  const priceRow = (await db(`helper_service_prices?id=eq.${offer1.price_id}&select=*`))[0];
  const termDiff = TERMS.filter((t) => JSON.stringify(num(v1?.[t])) !== JSON.stringify(num(priceRow[t])));
  const legacy = await db(`request_price_snapshots?request_id=eq.${made.requestId}&select=request_id`);
  expect("G. 012 contract of create_customer_selected_request unchanged (success, MATCHED, KRW, initial amount)", made.success === true && made.status === "MATCHED" && made.currency === "KRW" && Number(made.initial_payable_amount) === 60000, made);
  expect("H. fresh request atomically has: request MATCHED / CUSTOMER_SELECTED + one PENDING assignment + v1 selection", row?.status === "MATCHED" && row.selection_mode === "CUSTOMER_SELECTED" && asg.length === 1 && asg[0].helper_id === h1.helper.id && asg[0].status === "PENDING" && (await selections(made.requestId)).length === 1, { row, asg });
  expect("H. v1 terms exactly equal the confirmed offer; v1 ACCEPTED (current), linked to the assignment, source revision recorded", !!v1 && termDiff.length === 0 && v1.status === "ACCEPTED" && v1.selection_version === 1 && v1.assignment_id === asg[0]?.id && v1.source_helper_price_id === offer1.price_id && v1.source_price_revision === offer1.revision && Number(v1.initial_payable_amount) === 60000 && v1.subitem_code === "toilet-simple", { termDiff, v1 });
  expect("H. no new legacy snapshot for a post-013 request (table frozen, history lives in selections)", legacy.length === 0, legacy);

  // ================= D / E / F =================
  const dup = await rest("request_price_selections", hdr(serviceKey), "POST", { ...Object.fromEntries(Object.entries(v1).filter(([k]) => !["id", "accepted_at"].includes(k))), selection_version: 2 });
  expect("D. a second ACCEPTED selection for the same request is rejected (unique current selection)", dup.status === 409 && dup.body?.code === "23505" && /one_accepted/.test(dup.body?.message || ""), [dup.status, dup.body?.code, dup.body?.message]);
  const helperJwt = hdr(anonKey, h1.token);
  const edits = {
    serviceRoleBase: await rest(`request_price_selections?id=eq.${v1.id}`, hdr(serviceKey), "PATCH", { base_price: 1 }),
    serviceRoleHelper: await rest(`request_price_selections?id=eq.${v1.id}`, hdr(serviceKey), "PATCH", { helper_id: h2.helper.id }),
    serviceRoleDelete: await rest(`request_price_selections?id=eq.${v1.id}`, hdr(serviceKey), "DELETE"),
    anonRead: await rest(`request_price_selections?select=id&limit=1`, hdr(anonKey)),
    anonPatch: await rest(`request_price_selections?id=eq.${v1.id}`, hdr(anonKey), "PATCH", { status: "ENDED" }),
    helperPatch: await rest(`request_price_selections?id=eq.${v1.id}`, helperJwt, "PATCH", { base_price: 1 }),
    helperInsert: await rest("request_price_selections", helperJwt, "POST", { request_id: made.requestId }),
  };
  const v1Still = (await selections(made.requestId))[0];
  expect("E. commercial terms immutable and undeletable on every path (service_role, anon, Helper JWT)", Object.values(edits).every(denied) && Number(v1Still.base_price) === 60000 && v1Still.helper_id === h1.helper.id && v1Still.status === "ACCEPTED", Object.fromEntries(Object.entries(edits).map(([k, r]) => [k, [r.status, r.body?.code]])));
  // F on a separate throwaway request (ending metadata is the only mutable part)
  const fReq = await create(offer2, { customer: "RMCUSTOF" });
  const fSel = (await selections(fReq.requestId))[0];
  const endNoReason = await rest(`request_price_selections?id=eq.${fSel.id}`, hdr(serviceKey), "PATCH", { status: "ENDED" });
  const endOk = await rest(`request_price_selections?id=eq.${fSel.id}`, hdr(serviceKey), "PATCH", { status: "ENDED", ended_at: new Date().toISOString(), ended_reason: "REQUEST_CANCELLED" });
  const reAccept = await rest(`request_price_selections?id=eq.${fSel.id}`, hdr(serviceKey), "PATCH", { status: "ACCEPTED", ended_at: null, ended_reason: null });
  const reReason = await rest(`request_price_selections?id=eq.${fSel.id}`, hdr(serviceKey), "PATCH", { ended_reason: "HELPER_DECLINED" });
  const fAfter = (await selections(fReq.requestId))[0];
  expect("F. ACCEPTED -> ENDED with ended_at + ended_reason allowed; without a reason, re-accepting, or rewriting the reason is rejected", endNoReason.status >= 400 && endOk.status === 200 && reAccept.status >= 400 && reReason.status >= 400 && fAfter.status === "ENDED" && fAfter.ended_reason === "REQUEST_CANCELLED" && Number(fAfter.base_price) === 75000, { endNoReason: [endNoReason.status, endNoReason.body?.code], endOk: endOk.status, reAccept: [reAccept.status, reAccept.body?.message], reReason: [reReason.status, reReason.body?.message] });
  // release the F request's assignment so H2 is free again
  const fAsg = (await activeOf(fReq.requestId))[0];
  if (fAsg) await db(`request_assignments?id=eq.${fAsg.id}`, "PATCH", { status: "CANCELLED" });

  // ================= I: decline -> CUSTOMER_RESELECTION_REQUIRED; matcher refuses =================
  const rel = await rpc("release_assignment_for_rematch", { p_assignment_id: asg[0].id, p_release_status: "DECLINED" });
  const afterSel = (await selections(made.requestId))[0];
  const notice = await db(`app_notifications?type=eq.CUSTOMER_RESELECTION_REQUIRED&payload->>request_id=eq.${made.requestId}&select=recipient_type,recipient_id,title,body,payload`);
  expect("I. selected H1 DECLINES -> request CUSTOMER_RESELECTION_REQUIRED (not SEARCHING); v1 ENDED / HELPER_DECLINED; terms intact", rel.data?.success && rel.data.customer_reselection_required === true && rel.data.request_status === "CUSTOMER_RESELECTION_REQUIRED" && (await statusOf(made.requestId)) === "CUSTOMER_RESELECTION_REQUIRED" && afterSel.status === "ENDED" && afterSel.ended_reason === "HELPER_DECLINED" && Number(afterSel.base_price) === 60000, { rel: rel.data, afterSel: afterSel?.status });
  expect("I. customer in-app notice once, generic (no price / Helper identity), payload = request id only", notice.length === 1 && notice[0].recipient_type === "CUSTOMER" && notice[0].recipient_id === "RMCUSTOM" && !/\d{3}|HLP-|@/.test(notice[0].title + notice[0].body) && Object.keys(notice[0].payload).join() === "request_id", notice);
  const m = await rpc("match_and_assign_helper", { p_request_id: made.requestId });
  const h2Active = await db(`request_assignments?helper_id=eq.${h2.helper.id}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id`);
  expect("I. automatic matcher does NOT consume CUSTOMER_RESELECTION_REQUIRED (no assignment; free H2 untouched)", m.data?.success === false && (await activeOf(made.requestId)).length === 0 && h2Active.length === 0 && (await statusOf(made.requestId)) === "CUSTOMER_RESELECTION_REQUIRED", { m: m.data, h2Active: h2Active.length });
  let locked = null;
  try { await db("request_assignments", "POST", { request_id: made.requestId, helper_id: h2.helper.id, status: "PENDING" }); } catch (error) { locked = String(error.message); }
  expect("I. direct assignment of another Helper blocked (no current accepted selection)", !!locked && (await activeOf(made.requestId)).length === 0, locked);
  const wrong = await rpc("reselect_customer_helper", { p_request_id: made.requestId, p_customer_id: "RMOTHERC", p_price_id: offer2.price_id, p_price_revision: offer2.revision });
  const again = await rpc("reselect_customer_helper", { p_request_id: made.requestId, p_customer_id: "RMCUSTOM", p_price_id: (await upsert(h1, "toilet-simple", { pricing_mode: "FIXED", currency: "KRW", base_price: 61000, materials_policy: "INCLUDED" })).price_id, p_price_revision: (await db(`helper_service_prices?id=eq.${offer1.price_id}&select=revision`))[0].revision });
  expect("I. reselect_customer_helper refuses another customer (REQUEST_NOT_FOUND) and the declined Helper (HELPER_PREVIOUSLY_DECLINED)", wrong.data?.code === "REQUEST_NOT_FOUND" && again.data?.code === "HELPER_PREVIOUSLY_DECLINED", { wrong: wrong.data, again: again.data });
  const h2Now = (await db(`helper_service_prices?id=eq.${offer2.price_id}&select=revision`))[0];
  const re = await rpc("reselect_customer_helper", { p_request_id: made.requestId, p_customer_id: "RMCUSTOM", p_price_id: offer2.price_id, p_price_revision: h2Now.revision });
  const hist = await selections(made.requestId);
  expect("I. explicit re-selection of H2 via the RPC: MATCHED, v2 ACCEPTED (75,000), v1 unchanged", re.data?.success && re.data.selection_version === 2 && (await statusOf(made.requestId)) === "MATCHED" && hist.length === 2 && hist[0].status === "ENDED" && Number(hist[0].base_price) === 60000 && hist[1].status === "ACCEPTED" && hist[1].helper_id === h2.helper.id && Number(hist[1].base_price) === 75000, { re: re.data, hist: hist.map((h) => [h.selection_version, h.status, h.base_price]) });

  // ================= J: 011 exclusion unchanged for AUTO_MATCH =================
  const js = `${runId}-J`;
  const a1 = await fx.createHelper("A1", { sido: js, rating: 5 });
  const a2 = await fx.createHelper("A2", { sido: js, rating: 4 });
  const a3 = await fx.createHelper("A3", { sido: js, rating: 3 });
  const auto = await fx.insertRequest("auto", { sido: js });
  const m1 = await rpc("match_and_assign_helper", { p_request_id: auto });
  const first = (await activeOf(auto))[0];
  const d1 = await rpc("release_assignment_for_rematch", { p_assignment_id: first?.id, p_release_status: "DECLINED" });
  const m2 = await rpc("match_and_assign_helper", { p_request_id: auto });
  const second = (await activeOf(auto))[0];
  const d2 = await rpc("release_assignment_for_rematch", { p_assignment_id: second?.id, p_release_status: "TIMEOUT" });
  const m3 = await rpc("match_and_assign_helper", { p_request_id: auto });
  const third = (await activeOf(auto))[0];
  expect("J. AUTO_MATCH (011): DECLINED -> SEARCHING -> next Helper; TIMEOUT -> SEARCHING -> next; neither re-picked; no re-selection flag", m1.data?.status === "MATCHED" && first?.helper_id === a1.helper.id && d1.data?.request_status === "SEARCHING" && d1.data.customer_reselection_required === false && second?.helper_id === a2.helper.id && d2.data?.request_status === "SEARCHING" && third?.helper_id === a3.helper.id && m3.data?.status === "MATCHED" && (await db(`request_price_selections?request_id=eq.${auto}&select=id`)).length === 0, { d1: d1.data, d2: d2.data, m2: m2.data?.status, picks: [first?.helper_id, second?.helper_id, third?.helper_id].map((id) => [a1, a2, a3].findIndex((h) => h.helper.id === id) + 1) });
} catch (error) {
  record("FAIL", "migration 013 harness", String(error?.stack || error).slice(0, 600));
} finally {
  const leftovers = await fx.cleanup();
  const ids = [...fx.created.helperIds, "00000000-0000-0000-0000-000000000000"].join(",");
  leftovers.prices = (await db(`helper_service_prices?helper_id=in.(${ids})&select=id`)).length;
  leftovers.selections = (await db(`request_price_selections?helper_id=in.(${ids})&select=id`)).length;
  leftovers.snapshots = (await db(`request_price_snapshots?helper_id=in.(${ids})&select=request_id`)).length;
  leftovers.probe = (await db(`service_requests?sido=eq.${runId}-PROBE&select=id`)).length;
  expect("Fixture cleanup (helpers, auth users, prices, requests, assignments, selections, notifications)", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

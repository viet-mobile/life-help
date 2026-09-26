// Live STAGING verification of migration 202609270014 (prepaid marketplace + payment ledger +
// USDC foundation + protected media), database level, BEFORE any Worker change.
// Service role / anon key / a real Helper JWT against PostgREST; isolated fixtures only.
// Usage: node scripts/test_prepay_migration_staging.mjs
import crypto from "node:crypto";
import { db, env, fixtures, readResponse, recorder, rpc, serviceKey, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const runId = `PV${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
const MONEY = ["payment_rail_policies", "customer_offers", "service_checkouts", "helper_checkout_reservations", "payment_quotes", "payment_intents", "payment_chain_transactions", "customer_offer_exclusions", "customer_completion_confirmations", "payout_obligations", "service_refunds", "request_media", "request_media_views"];
const checkouts = [];

try {
  const spec = await (await fetch(`${supabaseUrl}/rest/v1/`, { headers: hdr(serviceKey) })).json();
  const defs = spec.definitions || {};
  const cols = (t) => Object.keys(defs[t]?.properties || {});
  expect("A1. every new money / media table exists", MONEY.every((t) => defs[t]), MONEY.filter((t) => !defs[t]));
  const need = {
    service_requests: ["request_mode", "legacy_unfunded", "funding_payment_intent_id", "helper_completed_at", "customer_completed_at", "selection_mode"],
    request_price_selections: ["source_kind", "source_customer_offer_id"],
    payment_events: ["payment_intent_id"],
    payout_destinations: ["owner_helper_id", "owner_identity_id"],
    payout_obligations: ["kind", "request_id", "payment_intent_id", "helper_id", "referral_reward_id", "gross_amount", "platform_fee_amount", "net_amount", "fee_policy", "payout_rail", "status", "provider_payout_id", "chain_signature"],
    payment_intents: ["checkout_id", "quote_id", "customer_id", "request_mode", "fiat_amount", "network", "mint", "amount_base_units", "recipient", "reference", "status", "verified_signature", "held_at", "release_authorized_at", "settled_at", "request_id"],
    payment_quotes: ["source_currency", "source_amount", "network", "mint", "decimals", "asset_amount_base_units", "fx_rate", "fx_provider", "rounding", "expires_at"],
    request_media: ["checkout_id", "request_id", "storage_provider", "object_key", "media_kind", "content_type", "status", "deletion_reason", "deleted_at"],
    request_media_views: ["media_id", "viewer_kind", "viewer_ref", "viewed_at"],
  };
  const missingCols = Object.entries(need).flatMap(([t, cs]) => cs.filter((c) => !cols(t).includes(c)).map((c) => `${t}.${c}`));
  expect("A2. new columns on service_requests / selections / events / destinations / ledger tables", missingCols.length === 0, missingCols);
  const statuses = defs.service_requests?.properties?.status?.enum || [];
  const payStatuses = defs.payment_intents?.properties?.status?.enum || [];
  expect("A3. request statuses OPEN_FOR_HELPERS + CUSTOMER_RESELECTION_REQUIRED; payment states incl. PAID_HELD / RELEASE_AUTHORIZED / REFUNDED", statuses.includes("OPEN_FOR_HELPERS") && statuses.includes("CUSTOMER_RESELECTION_REQUIRED") && ["AWAITING_PAYMENT", "PAID_HELD", "RELEASE_AUTHORIZED", "PAYOUT_PROCESSING", "SETTLED", "REVIEW_REQUIRED", "REFUND_PENDING", "REFUNDED"].every((s) => payStatuses.includes(s)), { statuses, payStatuses });
  const params = (name) => Object.keys(spec.paths?.[`/rpc/${name}`]?.post?.parameters?.[0]?.schema?.properties || {}).sort().join();
  const rpcs = {
    create_helper_price_checkout: "p_address,p_country,p_customer_display_name,p_customer_id,p_customer_locale,p_description,p_dong,p_gungu,p_price_id,p_price_revision,p_selected_options,p_sido,p_test_fixture",
    create_customer_offer_checkout: "p_address,p_country,p_customer_display_name,p_customer_id,p_customer_locale,p_description,p_dong,p_gungu,p_offer,p_selected_options,p_service_code,p_sido,p_subitem_code,p_test_fixture",
    create_payment_quote: "p_checkout_id,p_customer_id,p_fx_provider,p_fx_rate,p_fx_source_ref,p_mint,p_network,p_ttl_seconds",
    create_payment_intent: "p_customer_id,p_quote_id,p_recipient,p_reference",
    record_payment_observation: "p_amount_base_units,p_confirmation,p_intent_id,p_mint,p_network,p_recipient,p_reference_matched,p_signature,p_slot,p_tx_success",
    list_open_customer_offers: "p_helper_id",
    accept_customer_offer_request: "p_helper_id,p_request_id",
    decline_customer_offer_request: "p_helper_id,p_request_id",
    cancel_funded_request: "p_customer_id,p_request_id",
    confirm_service_completion: "p_customer_id,p_request_id",
    record_payout_submission: "p_chain_network,p_chain_signature,p_obligation_id,p_provider,p_provider_payout_id",
    record_payout_result: "p_obligation_id,p_provider,p_provider_payout_id,p_success",
    mark_payout_obligation_review: "p_obligation_id,p_reason",
    create_referral_payout_obligation: "p_country,p_rail,p_reward_id",
    record_refund_result: "p_chain_network,p_chain_signature,p_provider,p_provider_refund_id,p_refund_id,p_success",
    purge_payment_fixture: "p_checkout_id",
    register_request_media: "p_byte_size,p_checkout_id,p_content_type,p_customer_id,p_object_key,p_storage_provider",
    authorize_request_media_view: "p_customer_id,p_helper_id,p_media_id",
    list_media_pending_deletion: "p_limit",
    mark_request_media_deleted: "p_media_id",
    reselect_customer_helper: "p_customer_id,p_price_id,p_price_revision,p_request_id",
    release_assignment_for_rematch: "p_assignment_id,p_release_status",
  };
  const badRpc = Object.entries(rpcs).filter(([n, p]) => params(n) !== p).map(([n]) => [n, params(n)]);
  expect("A4. every RPC exists with the exact parameters (checkout, quote, intent, verification, accept / decline, cancel, completion / release, payout, refund, referral, media)", badRpc.length === 0, badRpc);
  // The schema listing shows every function; the real test is an EXECUTE attempt as service_role.
  const internal = [
    ["activate_funded_checkout", { p_intent_id: "00000000-0000-0000-0000-000000000000" }],
    ["log_payment_event", { p_intent_id: "00000000-0000-0000-0000-000000000000", p_event_type: "PROBE", p_payload: {} }],
  ];
  const internalResults = [];
  for (const [n, body] of internal) internalResults.push([n, (await rest(`rpc/${n}`, hdr(serviceKey), "POST", body)).body?.code]);
  expect("A5. internal functions are not executable by service_role (activation, event log) -> 42501", internalResults.every(([, c]) => c === "42501"), internalResults);

  // ---------------- access ----------------
  const h1 = await fx.createHelper("H1", { service: "clog-clearing", rating: 5 });
  const anon = hdr(anonKey), helperJwt = hdr(anonKey, h1.token), svc = hdr(serviceKey);
  const reads = [];
  for (const t of MONEY) for (const [who, h] of [["anon", anon], ["helper", helperJwt]]) reads.push([who, t, (await rest(`${t}?select=*&limit=1`, h)).status]);
  expect("B1. anon + authenticated Helper cannot read any money / media table", reads.every(([, , s]) => s === 401 || s === 403), reads.filter(([, , s]) => s !== 401 && s !== 403));
  const svcWrites = [];
  for (const t of ["payment_intents", "payment_quotes", "service_checkouts", "customer_offers", "payout_obligations", "service_refunds", "payment_chain_transactions", "payment_rail_policies", "request_media", "customer_completion_confirmations"]) {
    svcWrites.push([t, "insert", (await rest(t, svc, "POST", {})).body?.code ?? "ok"]);
    // A real column of the table (no row matches), so the only possible refusal is the privilege.
    const col = cols(t).find((c) => c !== "id") || cols(t)[0];
    svcWrites.push([t, "update", (await rest(`${t}?${col}=is.null`, svc, "PATCH", { [col]: null })).body?.code ?? "ok"]);
    svcWrites.push([t, "delete", (await rest(`${t}?${col}=is.null`, svc, "DELETE")).body?.code ?? "ok"]);
  }
  expect("B2. service_role is SELECT-only on the money / media tables (every direct write 42501)", svcWrites.every(([, , c]) => c === "42501"), svcWrites.filter(([, , c]) => c !== "42501"));
  const fundingWrite = await rest(`service_requests?id=eq.${crypto.randomUUID()}`, svc, "PATCH", { funding_payment_intent_id: crypto.randomUUID() });
  const modeWrite = await rest(`service_requests?id=eq.${crypto.randomUUID()}`, svc, "PATCH", { request_mode: "CUSTOMER_OFFER_OPEN" });
  const statusWrite = await rest(`service_requests?id=eq.${crypto.randomUUID()}`, svc, "PATCH", { status: "SEARCHING" });
  expect("B3. service_role cannot write funding / mode columns; ordinary lifecycle column (status) still writable", fundingWrite.body?.code === "42501" && modeWrite.body?.code === "42501" && statusWrite.status === 200, { fundingWrite: fundingWrite.body?.code, modeWrite: modeWrite.body?.code, statusWrite: statusWrite.status });
  const rpcAnon = [];
  for (const [who, h] of [["anon", anon], ["helper", helperJwt]]) for (const n of ["confirm_service_completion", "accept_customer_offer_request", "record_payment_observation", "create_payment_quote", "record_payout_result", "authorize_request_media_view"]) {
    rpcAnon.push([who, n, (await rest(`rpc/${n}`, h, "POST", {})).status]);
  }
  expect("B4. anon + authenticated cannot execute the payment / completion / media RPCs", rpcAnon.every(([, , s]) => s === 401 || s === 403 || s === 404), rpcAnon);

  // ---------------- backfill / invariants ----------------
  const unmarked = await db("service_requests?request_mode=is.null&select=id");
  const unfunded = await db("service_requests?legacy_unfunded=eq.false&funding_payment_intent_id=is.null&select=id");
  const legacyCount = (await db("service_requests?legacy_unfunded=eq.true&select=id")).length;
  expect(`C1. every existing request has an explicit mode; no non-legacy unfunded row exists (${legacyCount} legacy rows on staging)`, unmarked.length === 0 && unfunded.length === 0, { unmarked: unmarked.length, unfunded: unfunded.length });
  const bypass = await rest("service_requests", svc, "POST", { customer_id: "PVBYPASS", customer_display_name: "x", service_slug: "boiler", country: "KR", sido: `${runId}-X`, gungu: "G1", status: "MATCHED", request_mode: "HELPER_PRICE_SELECTED", selection_mode: "CUSTOMER_SELECTED" });
  const fake = await rest("service_requests", svc, "POST", { customer_id: "PVBYPASS", customer_display_name: "x", service_slug: "boiler", country: "KR", sido: `${runId}-X`, gungu: "G1", status: "MATCHED", request_mode: "HELPER_PRICE_SELECTED", selection_mode: "CUSTOMER_SELECTED", funding_payment_intent_id: crypto.randomUUID() });
  const openLegacy = await rest("service_requests", svc, "POST", { customer_id: "PVBYPASS", customer_display_name: "x", service_slug: "boiler", country: "KR", sido: `${runId}-X`, gungu: "G1", status: "OPEN_FOR_HELPERS", request_mode: "CUSTOMER_OFFER_OPEN", selection_mode: "CUSTOMER_OFFER", legacy_unfunded: true });
  expect("C2. prepaid invariant enforced by the database: unfunded / fabricated-funding / unfunded open-offer inserts refused", bypass.body?.code === "23514" && /FUNDING_NOT_VERIFIED|23503/.test(`${fake.body?.message} ${fake.body?.code}`) && openLegacy.body?.code === "23514", { bypass: bypass.body?.code, fake: [fake.body?.code, fake.body?.message], openLegacy: openLegacy.body?.code });
  const policies = await db("payment_rail_policies?select=*");
  expect(`C3. payment rail policy table present; nothing on mainnet enabled (${policies.filter((p) => p.enabled).length} enabled rows)`, policies.every((p) => p.network !== "solana-mainnet" || !p.enabled), policies);
  record("INFO", `Enabled rail policies on staging: ${JSON.stringify(policies.filter((p) => p.enabled).map((p) => `${p.country}/${p.capability}/${p.network}`))}`);

  // ---------------- functional smoke (isolated fixtures) ----------------
  const price = (await rpc("upsert_helper_service_price", { p_helper_id: h1.helper.id, p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }, p_publish: true })).data;
  const ca = (await rpc("create_helper_price_checkout", { p_customer_id: "PVCUSTAA", p_customer_display_name: "PV", p_customer_locale: "en", p_country: "KR", p_sido: fx.sido, p_gungu: "G1", p_dong: "", p_address: "a", p_description: `${runId} a`, p_selected_options: [], p_price_id: price.price_id, p_price_revision: price.revision, p_test_fixture: true })).data;
  if (ca?.checkout_id) checkouts.push(ca.checkout_id);
  const noRequest = (await db("service_requests?customer_id=eq.PVCUSTAA&select=id")).length === 0 && (await db(`request_assignments?helper_id=eq.${h1.helper.id}&select=id`)).length === 0;
  const reservation = ca?.checkout_id ? (await db(`helper_checkout_reservations?checkout_id=eq.${ca.checkout_id}&select=status`))[0] : null;
  expect("D1. MODE A checkout: created, Helper reserved, NO request / assignment before payment", ca?.success && Number(ca.fiat_amount) === 60000 && reservation?.status === "ACTIVE" && noRequest, { ca, reservation });
  const mainnetQuote = (await rpc("create_payment_quote", { p_checkout_id: ca.checkout_id, p_customer_id: "PVCUSTAA", p_network: "solana-mainnet", p_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: null, p_ttl_seconds: 600 })).data;
  expect("D2. mainnet quote refused by the database (MAINNET_DISABLED)", mainnetQuote?.code === "MAINNET_DISABLED", mainnetQuote);
  const devnetQuote = (await rpc("create_payment_quote", { p_checkout_id: ca.checkout_id, p_customer_id: "PVCUSTAA", p_network: "solana-devnet", p_mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", p_fx_rate: 1400, p_fx_provider: "TEST_SANDBOX_FX", p_fx_source_ref: "test", p_ttl_seconds: 600 })).data;
  const devnetEnabled = policies.some((p) => p.country === "KR" && p.capability === "USDC_CUSTOMER_PAYMENT" && p.network === "solana-devnet" && p.enabled);
  expect(`D3. devnet quote follows the rail policy (${devnetEnabled ? "enabled -> quote" : "disabled -> PAYMENT_RAIL_DISABLED"})`, devnetEnabled ? devnetQuote?.success === true && Number(devnetQuote.amount_base_units) === 42857143 : devnetQuote?.code === "PAYMENT_RAIL_DISABLED", devnetQuote);
  const cb = (await rpc("create_customer_offer_checkout", { p_customer_id: "PVCUSTBB", p_customer_display_name: "PV", p_customer_locale: "en", p_country: "KR", p_sido: fx.sido, p_gungu: "G1", p_dong: "", p_address: "b", p_description: `${runId} b`, p_selected_options: [], p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "70000", materials_policy: "INCLUDED" }, p_test_fixture: true })).data;
  if (cb?.checkout_id) checkouts.push(cb.checkout_id);
  const feed = (await rpc("list_open_customer_offers", { p_helper_id: h1.helper.id })).data;
  expect("D4. MODE B customer-offer checkout: created, nothing visible to the eligible Helper before payment", cb?.success && Number(cb.fiat_amount) === 70000 && Array.isArray(feed) && feed.length === 0 && (await db("service_requests?customer_id=eq.PVCUSTBB&select=id")).length === 0, { cb, feed });
  const tooPrecise = (await rpc("create_customer_offer_checkout", { p_customer_id: "PVCUSTBB", p_customer_display_name: "PV", p_customer_locale: "en", p_country: "KR", p_sido: fx.sido, p_gungu: "G1", p_dong: "", p_address: "b", p_description: `${runId} b`, p_selected_options: [], p_service_code: "clog-clearing", p_subitem_code: "toilet-simple", p_offer: { pricing_mode: "FIXED", currency: "KRW", offered_amount: "10.001", materials_policy: "INCLUDED" }, p_test_fixture: true })).data;
  expect("D5. customer amount never silently rounded (10.001 -> INVALID_OFFER)", tooPrecise?.code === "INVALID_OFFER", tooPrecise);
  const media = (await rpc("register_request_media", { p_checkout_id: cb.checkout_id, p_customer_id: "PVCUSTBB", p_storage_provider: "SUPABASE_STORAGE_PRIVATE", p_object_key: `requests/${cb.checkout_id}/${crypto.randomUUID()}.jpg`, p_content_type: "image/jpeg", p_byte_size: 1000 })).data;
  const view = media?.media_id ? (await rpc("authorize_request_media_view", { p_media_id: media.media_id, p_customer_id: "PVCUSTBB", p_helper_id: null })).data : null;
  const helperView = media?.media_id ? (await rpc("authorize_request_media_view", { p_media_id: media.media_id, p_customer_id: null, p_helper_id: h1.helper.id })).data : null;
  expect("D6. media metadata: owner registers + views (logged); unassigned Helper refused; no URL returned", media?.success && view?.success && view.viewer_kind === "CUSTOMER" && !("url" in view) && helperView?.code === "MEDIA_NOT_AVAILABLE" && (await db(`request_media_views?media_id=eq.${media.media_id}&select=viewer_kind`)).length === 1, { media, view, helperView });
  const reward = (await rpc("create_referral_payout_obligation", { p_reward_id: crypto.randomUUID(), p_rail: "USDC_SOLANA", p_country: "KR" })).data;
  expect("D7. referral payout linkage RPC present (unknown reward -> REWARD_NOT_FOUND)", reward?.code === "REWARD_NOT_FOUND", reward);

  // ---------------- 011 / 012 / 013 compatibility ----------------
  const js = `${runId}-J`;
  const a1 = await fx.createHelper("A1", { sido: js, rating: 5 });
  await fx.createHelper("A2", { sido: js, rating: 4 });
  const auto = await fx.insertRequest("auto", { sido: js });
  await rpc("match_and_assign_helper", { p_request_id: auto });
  const first = (await db(`request_assignments?request_id=eq.${auto}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id`))[0];
  const rel = (await rpc("release_assignment_for_rematch", { p_assignment_id: first?.id, p_release_status: "DECLINED" })).data;
  await rpc("match_and_assign_helper", { p_request_id: auto });
  const second = (await db(`request_assignments?request_id=eq.${auto}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=helper_id`))[0];
  expect("E1. 011: legacy AUTO_MATCH decline -> SEARCHING -> rematch never re-picks the decliner", first?.helper_id === a1.helper.id && rel?.request_status === "SEARCHING" && rel.customer_offer_reopened === false && second && second.helper_id !== a1.helper.id, { rel, second });
  const legacySel = (await rpc("create_customer_selected_request", { p_request_id: crypto.randomUUID(), p_customer_id: "PVLEGACY", p_customer_display_name: "x", p_customer_locale: "en", p_country: "KR", p_sido: fx.sido, p_gungu: "G1", p_dong: "", p_address: "", p_description: `${runId} legacy`, p_selected_options: [], p_price_id: price.price_id, p_price_revision: price.revision })).data;
  if (legacySel?.request_id) fx.created.requestIds.add(legacySel.request_id);
  const legacyRow = legacySel?.request_id ? (await db(`service_requests?id=eq.${legacySel.request_id}&select=request_mode,legacy_unfunded`))[0] : null;
  const legacyV1 = legacySel?.request_id ? (await db(`request_price_selections?request_id=eq.${legacySel.request_id}&select=status,source_kind,initial_payable_amount`))[0] : null;
  expect("E2. 012/013: legacy customer-selected creation (internal compat) -> flagged legacy, v1 HELPER_PRICE selection ACCEPTED", legacySel?.success === false || (legacyRow?.request_mode === "HELPER_PRICE_SELECTED" && legacyRow.legacy_unfunded === true && legacyV1?.status === "ACCEPTED" && legacyV1.source_kind === "HELPER_PRICE" && Number(legacyV1.initial_payable_amount) === 60000), { legacySel, legacyRow, legacyV1 });
  record("INFO", `Legacy customer-selected creation while H1 is reserved by a checkout: ${legacySel?.success ? "created" : legacySel?.code} (reservation protects H1 from other paths)`);
} catch (error) {
  record("FAIL", "migration 014 harness", String(error?.stack || error).slice(0, 600));
} finally {
  const purged = [];
  for (const id of checkouts) purged.push((await rpc("purge_payment_fixture", { p_checkout_id: id })).data?.success === true);
  const leftovers = await fx.cleanup();
  const ids = [...fx.created.helperIds, "00000000-0000-0000-0000-000000000000"].join(",");
  leftovers.checkouts = (await db(`service_checkouts?customer_id=in.(PVCUSTAA,PVCUSTBB)&select=id`)).length;
  leftovers.offers = (await db(`customer_offers?customer_id=in.(PVCUSTAA,PVCUSTBB)&select=id`)).length;
  leftovers.media = (await db(`request_media?customer_id=eq.PVCUSTBB&select=id`)).length;
  leftovers.prices = (await db(`helper_service_prices?helper_id=in.(${ids})&select=id`)).length;
  leftovers.selections = (await db(`request_price_selections?helper_id=in.(${ids})&select=id`)).length;
  leftovers.bypass = (await db(`service_requests?customer_id=eq.PVBYPASS&select=id`)).length;
  expect("Fixture cleanup (checkouts purged via the test-fixture RPC; helpers, prices, requests, media, notifications)", purged.every(Boolean) && Object.values(leftovers).every((n) => n === 0), { purged, leftovers });
}
if (summary().FAIL > 0) process.exit(1);

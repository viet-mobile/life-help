// Live STAGING verification of migration 202609280021 (admin_audit_logs append-only) and the rollout order.
//   --phase=pre   runtime deployed, 021 NOT applied: the append function is absent (exact PostgREST error),
//                 the deployed runtime's appendAuditLog falls back and writes exactly one audit row.
//   --phase=post  021 applied: live authority probes, trusted append path (all 7 actions), validation,
//                 idempotency, the SAME runtime now writes through the RPC (fallback no longer used).
// Fixture requests are disposable legacy test rows; their audit rows stay (append-only history, reported).
// Usage: node scripts/test_admin_audit_staging.mjs --phase=pre|post
import crypto from "node:crypto";
import { base, db, env, fixtures, readResponse, recorder, serviceKey, settlementToken, supabaseUrl } from "./lib/stagingPushHarness.mjs";

const phase = process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "pre";
const runId = `AA${Date.now()}`;
const startedAt = new Date().toISOString();
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const hdr = (key, bearer = key) => ({ apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" });
const svc = hdr(serviceKey);
const rest = async (pathname, headers, method = "GET", body) => { const r = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await readResponse(r) }; };
const append = (action, entityType, entityId, metadata = {}, headers = svc) => rest("rpc/append_admin_audit_log", headers, "POST", { p_action: action, p_entity_type: entityType, p_entity_id: entityId, p_metadata: metadata });
const sys = async (requestId, status) => { const r = await fetch(`${base}/api/sys/requests/${requestId}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: JSON.stringify({ status }) }); return { status: r.status, body: await readResponse(r) }; };
const auditsOf = (id) => db(`admin_audit_logs?entity_id=eq.${id}&select=id,action,actor_id,metadata&order=id`);
const tableDenied = (r) => r.status === 403 && r.body?.code === "42501";
const denied = (r) => r.status === 401 || r.status === 403 || r.body?.code === "42501";
/** Disposable legacy fixture request moved to COMPLETED (legacy rows have no funding). */
async function completedFixture(label) {
  const id = await fx.insertRequest(label, { service: "clog-clearing" });
  await db(`service_requests?id=eq.${id}`, "PATCH", { status: "COMPLETED" });
  return id;
}

async function pre() {
  const probe = await append("SERVICE_PAYMENT_PENDING", "service_request", "00000000-0000-0000-0000-000000000000", {});
  record("INFO", `append_admin_audit_log before 021: HTTP ${probe.status} code=${probe.body?.code} message="${String(probe.body?.message ?? "").slice(0, 160)}"`);
  expect("P1. before 021 the trusted function is absent: PostgREST PGRST202 naming append_admin_audit_log (the exact fallback condition)", probe.status === 404 && probe.body?.code === "PGRST202" && /append_admin_audit_log/.test(String(probe.body?.message)), probe.body);
  const total0 = (await db("admin_audit_logs?select=id")).length;
  const id = await completedFixture("PRE");
  const moved = await sys(id, "PAYMENT_PENDING");
  const rows = await auditsOf(id);
  const total1 = (await db("admin_audit_logs?select=id")).length;
  expect("P2. deployed runtime pre-021: one audit-producing action (operator PAYMENT_PENDING) -> exactly ONE SERVICE_PAYMENT_PENDING row via the legacy fallback (actor_id null, server metadata); nothing lost, nothing extra", moved.status === 200 && rows.length === 1 && rows[0].action === "SERVICE_PAYMENT_PENDING" && rows[0].actor_id === null && rows[0].metadata?.actor_kind === "PLATFORM_TOKEN" && total1 === total0 + 1, { moved: moved.status, rows });
  record("INFO", `pre-021 baseline: ${total1} admin_audit_logs rows (78 historical before this sprint + test rows since)`);
}

async function post() {
  const before = await db("admin_audit_logs?select=id,action,entity_type,entity_id,actor_id,metadata,created_at&order=id");
  const historical = before.filter((r) => r.id <= 78 || true);
  // ---------- authority probes ----------
  const helper = await fx.createHelper("A", { service: "clog-clearing" });
  const helperHdr = hdr(anonKey, helper.token);
  const target = before[0]?.id ?? -1;
  const probes = {
    insert: await rest("admin_audit_logs", svc, "POST", { action: "SERVICE_SETTLED", entity_type: "service_request", metadata: {} }),
    update: await rest(`admin_audit_logs?id=eq.${target}`, svc, "PATCH", { action: "X" }),
    delete: await rest(`admin_audit_logs?id=eq.${target}`, svc, "DELETE"),
    bulkDelete: await rest("admin_audit_logs?id=gt.0", svc, "DELETE"),
    anonInsert: await rest("admin_audit_logs", hdr(anonKey), "POST", { action: "X", entity_type: "system", metadata: {} }),
    anonUpdate: await rest(`admin_audit_logs?id=eq.${target}`, hdr(anonKey), "PATCH", { action: "X" }),
    helperInsert: await rest("admin_audit_logs", helperHdr, "POST", { action: "X", entity_type: "system", metadata: {} }),
    helperDelete: await rest(`admin_audit_logs?id=eq.${target}`, helperHdr, "DELETE"),
    anonAppend: await append("CONVERSATION_CLEANUP_RETRY", "system", null, {}, hdr(anonKey)),
    helperAppend: await append("CONVERSATION_CLEANUP_RETRY", "system", null, {}, helperHdr),
  };
  const select = await rest("admin_audit_logs?select=id&limit=1", svc);
  const staff = await fx.createHelper("STAFF", { service: "clog-clearing" });
  const staffUserId = staff.helper.auth_user_id;
  await db("profiles", "POST", { id: staffUserId, display_name: `${runId} temp staff` }).catch(() => null);
  await db("user_roles", "POST", { user_id: staffUserId, role: "STAFF" }).catch(() => null);
  const staffSelect = await rest("admin_audit_logs?select=id&order=id&limit=5", hdr(anonKey, staff.token));
  const staffUpdate = await rest(`admin_audit_logs?id=eq.${target}`, hdr(anonKey, staff.token), "PATCH", { action: "X" });
  const staffDelete = await rest(`admin_audit_logs?id=eq.${target}`, hdr(anonKey, staff.token), "DELETE");
  expect("S. authenticated STAFF SELECT preserved (temporary test staff role, removed with its auth user at cleanup): staff reads audit rows; staff cannot UPDATE / DELETE", staffSelect.status === 200 && Array.isArray(staffSelect.body) && staffSelect.body.length > 0 && denied(staffUpdate) && denied(staffDelete), { select: staffSelect.status, rows: staffSelect.body?.length, upd: staffUpdate.status, del: staffDelete.status });
  const helperSelect = await rest("admin_audit_logs?select=id&limit=1", helperHdr);
  expect("A-D. app role direct INSERT / UPDATE / DELETE (single + bulk) -> 42501; anon / authenticated (Helper) mutation refused, append function not executable by them; app role SELECT kept; a non-staff authenticated user reads nothing (staff-only RLS)",
    ["insert", "update", "delete", "bulkDelete"].every((k) => tableDenied(probes[k])) && ["anonInsert", "anonUpdate", "helperInsert", "helperDelete", "anonAppend", "helperAppend"].every((k) => denied(probes[k])) && select.status === 200 && helperSelect.status === 200 && Array.isArray(helperSelect.body) && helperSelect.body.length === 0,
    Object.fromEntries(Object.entries(probes).map(([k, v]) => [k, `${v.status}/${v.body?.code ?? ""}`])));
  record("INFO", "TRUNCATE: not reachable through PostgREST; privilege revoked + BEFORE TRUNCATE trigger; owner UPDATE / DELETE / TRUNCATE blocked by triggers (verified as owner in test_admin_audit_authority_db)");

  // ---------- the SAME deployed runtime now uses the trusted RPC ----------
  const r1 = await completedFixture("POST1");
  const pp = await sys(r1, "PAYMENT_PENDING");
  const st = await sys(r1, "SETTLED");
  const [stA, stB] = await Promise.all([sys(r1, "SETTLED"), sys(r1, "SETTLED")]);
  const rows1 = await auditsOf(r1);
  const count = (a) => rows1.filter((r) => r.action === a).length;
  expect("R1. post-021 the same runtime writes through append_admin_audit_log (direct insert is revoked, so these rows can only come from the RPC): PAYMENT_PENDING, SETTLED (INTERNAL attribution, unverified); settlement retried x3 incl. 2 concurrent -> still ONE SERVICE_SETTLED, ONE SERVICE_PAYMENT_PENDING",
    pp.status === 200 && st.status === 200 && [stA, stB].every((r) => r.status === 200) && count("SERVICE_PAYMENT_PENDING") === 1 && count("SERVICE_SETTLED") === 1 && rows1.find((r) => r.action === "SERVICE_SETTLED")?.metadata?.settlement_rail === "INTERNAL" && rows1.find((r) => r.action === "SERVICE_SETTLED")?.metadata?.external_payment_verified === false && rows1.every((r) => r.actor_id === null),
    { statuses: [pp.status, st.status, stA.status, stB.status], rows: rows1.map((r) => r.action) });
  // cleanup + close through the deployed runtime -> CONVERSATION_CONTENT_DELETED / SERVICE_CLOSED / CONVERSATION_CLEANUP_RETRY
  const cleanup = await fetch(`${base}/api/sys/cleanup/conversations`, { method: "POST", headers: { Authorization: `Bearer ${settlementToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ limit: 20 }) }).then(async (r) => ({ status: r.status, body: await readResponse(r) }));
  const rows1b = await auditsOf(r1);
  const status1 = (await db(`service_requests?id=eq.${r1}&select=status`))[0]?.status;
  record("INFO", `cleanup run: HTTP ${cleanup.status}; request ${status1}; request audits ${rows1b.map((r) => r.action).join(",")}`);
  const retryRows = await db(`admin_audit_logs?action=eq.CONVERSATION_CLEANUP_RETRY&created_at=gte.${startedAt}&select=id,metadata`);
  expect("C. cleanup writer on the trusted RPC: settling a request without conversations closes it inline -> exactly ONE SERVICE_CLOSED written by the runtime through append_admin_audit_log; the following cleanup run had nothing to change, so (by design) it wrote no run row", cleanup.status === 200 && status1 === "CLOSED" && rows1b.filter((r) => r.action === "SERVICE_CLOSED").length === 1, { cleanup: cleanup.status, status1, retry: retryRows.length });
  record("INFO", "CONVERSATION_CLEANUP_RETRY written BY THE ROUTE (a run that actually cleans a conversation) is asserted by test_cleanup_retry_staging in the regression; the action itself is appended through the RPC in T1");
  // ---------- trusted append path: every allow-listed action + validation ----------
  const r2 = await completedFixture("POST2");
  await sys(r2, "PAYMENT_PENDING");
  await sys(r2, "SETTLED");
  const acts = {
    SETTLED_CLEANUP_RECONCILED: await append("SETTLED_CLEANUP_RECONCILED", "service_request", r2, { conversations_scheduled: 0, reason: "SETTLED_WITHOUT_CLEANUP_SCHEDULE" }),
    CONVERSATION_CONTENT_DELETED: await append("CONVERSATION_CONTENT_DELETED", "service_request", r2, { conversation_id: crypto.randomUUID(), messages_deleted: 0 }),
    CONVERSATION_CLEANUP_RETRY: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { actor_kind: "PLATFORM_TOKEN", trigger: runId, reason: "QUEUED_CLEANUP_RETRY", cleaned: 0 }),
    WEB_PUSH_TEST_SENT: await append("WEB_PUSH_TEST_SENT", "push_subscription_owner", helper.helper.id, { actor_kind: "PLATFORM_TOKEN", owner_type: "HELPER", attempted: 0, delivered: 0, invalidated: 0, failed: 0 }),
    SERVICE_PAYMENT_PENDING_replay: await append("SERVICE_PAYMENT_PENDING", "service_request", r2, { actor_kind: "PLATFORM_TOKEN" }),
    SERVICE_SETTLED_replay: await append("SERVICE_SETTLED", "service_request", r2, { actor_kind: "PLATFORM_TOKEN", settlement_rail: "INTERNAL", external_payment_verified: false }),
    // The runtime already closed r2 inline (no conversations) and wrote SERVICE_CLOSED through the RPC.
    SERVICE_CLOSED_replay: await append("SERVICE_CLOSED", "service_request", r2, { actor_kind: "CLEANUP_RUNNER" }),
  };
  const rows2 = await auditsOf(r2);
  expect("T1. append_admin_audit_log live for every action: SETTLED_CLEANUP_RECONCILED, CONVERSATION_CONTENT_DELETED, CONVERSATION_CLEANUP_RETRY, WEB_PUSH_TEST_SENT append; PAYMENT_PENDING / SETTLED / CLOSED (written by the runtime via the RPC) replay on retry - one row per request each",
    ["SETTLED_CLEANUP_RECONCILED", "CONVERSATION_CONTENT_DELETED", "CONVERSATION_CLEANUP_RETRY", "WEB_PUSH_TEST_SENT"].every((k) => acts[k].body?.success === true && acts[k].body.replayed === false)
    && ["SERVICE_PAYMENT_PENDING_replay", "SERVICE_SETTLED_replay", "SERVICE_CLOSED_replay"].every((k) => acts[k].body?.replayed === true)
    && ["SERVICE_PAYMENT_PENDING", "SERVICE_SETTLED", "SERVICE_CLOSED"].every((a) => rows2.filter((r) => r.action === a).length === 1),
    Object.fromEntries(Object.entries(acts).map(([k, v]) => [k, v.body?.code ?? (v.body?.replayed ? "replayed" : v.body?.success)])));
  const r3 = await completedFixture("POST3");
  await sys(r3, "PAYMENT_PENDING");
  const bad = {
    actorIdAsMetadata: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { actor_kind: "admin; drop" }),
    nestedSecret: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { report: { settlement_token: "x" } }),
    authorizationKey: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { headers: { Authorization: "Bearer x" } }),
    oversized: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { blob: "x".repeat(20000) }),
    unknownAction: await append("DELETE_HISTORY", "system", null, {}),
    wrongState: await append("SERVICE_SETTLED", "service_request", r3, { actor_kind: "PLATFORM_TOKEN" }),
    forgedVerified: await append("SERVICE_SETTLED", "service_request", r2, { external_payment_verified: true, external_payment_transaction_id: "fabricated" }),
    missingEntity: await append("SERVICE_CLOSED", "service_request", crypto.randomUUID(), {}),
  };
  const [chainAudit] = await db("admin_audit_logs?id=eq.211&action=eq.SERVICE_SETTLED&select=entity_id,metadata");
  const chainRequest = chainAudit?.entity_id;
  const ob = chainRequest ? (await db(`payout_obligations?request_id=eq.${chainRequest}&kind=eq.HELPER_SERVICE&select=chain_signature`))[0] : null;
  const intent = chainRequest ? (await db(`payment_intents?id=eq.${(await db(`service_requests?id=eq.${chainRequest}&select=funding_payment_intent_id`))[0]?.funding_payment_intent_id}&select=verified_signature`))[0] : null;
  const chainCount = async () => (await db(`admin_audit_logs?entity_id=eq.${chainRequest}&action=eq.SERVICE_SETTLED&select=id`)).length;
  const trueChain = { actor_kind: "PAYOUT_RECONCILER", settlement_method: "STAGING_DEVNET_USDC", settlement_rail: "CHAIN_DIRECT", external_payment_provider: "SOLANA_SOLANA-DEVNET", external_payment_transaction_id: intent?.verified_signature, external_payout_transaction_id: ob?.chain_signature, external_payment_verified: true };
  const otherSettled = (await db("admin_audit_logs?action=eq.SERVICE_SETTLED&id=neq.211&select=entity_id&limit=1"))[0]?.entity_id;
  const evidence = {
    fabricatedPayment: await append("SERVICE_SETTLED", "service_request", chainRequest, { ...trueChain, external_payment_transaction_id: "5Fabricated" + "1".repeat(60) }),
    fabricatedPayout: await append("SERVICE_SETTLED", "service_request", chainRequest, { ...trueChain, external_payout_transaction_id: "5Fabricated" + "2".repeat(60) }),
    borrowedToOtherRequest: await append("SERVICE_SETTLED", "service_request", otherSettled, trueChain),
    trueEvidence: await append("SERVICE_SETTLED", "service_request", chainRequest, trueChain),
    wrongEntityType: await append("SERVICE_SETTLED", "push_subscription_owner", chainRequest, {}),
  };
  expect("F. evidence forgery against the retained REAL-CHAIN settlement (non-destructive): fabricated payment reference, fabricated payout reference, that request's genuine evidence borrowed onto another request -> EVIDENCE_NOT_IN_LEDGER; the genuine ledger evidence -> accepted as a replay (no new row); wrong entity_type -> ENTITY_TYPE_MISMATCH; the real-chain audit row still exactly one",
    !!chainRequest && !!ob?.chain_signature && evidence.fabricatedPayment.body?.code === "EVIDENCE_NOT_IN_LEDGER" && evidence.fabricatedPayout.body?.code === "EVIDENCE_NOT_IN_LEDGER" && evidence.borrowedToOtherRequest.body?.code === "EVIDENCE_NOT_IN_LEDGER" && evidence.trueEvidence.body?.replayed === true && evidence.wrongEntityType.body?.code === "ENTITY_TYPE_MISMATCH" && (await chainCount()) === 1,
    Object.fromEntries(Object.entries(evidence).map(([k, v]) => [k, v.body?.code ?? (v.body?.replayed ? "replayed" : v.status)])));
  record("INFO", "borrowed PROVIDER payment reference: verified in PGlite (test_admin_audit_authority_db F3) - no provider-funded settlement exists on staging and the mock stays disabled");
  const callerActor = await rest("rpc/append_admin_audit_log", svc, "POST", { p_action: "CONVERSATION_CLEANUP_RETRY", p_entity_type: "system", p_entity_id: null, p_metadata: {}, p_actor_id: crypto.randomUUID() });
  expect("T2. fail closed: forged actor_kind, nested secret-like keys (token / Authorization), oversized metadata, unknown action, wrong request state, fabricated settlement evidence, missing entity -> refused; a caller-supplied actor_id is not even a parameter (no such signature)",
    bad.actorIdAsMetadata.body?.code === "ACTOR_KIND_INVALID" && bad.nestedSecret.body?.code === "SECRET_FIELD_REFUSED" && bad.authorizationKey.body?.code === "SECRET_FIELD_REFUSED" && bad.oversized.body?.code === "METADATA_INVALID" && bad.unknownAction.body?.code === "ACTION_NOT_ALLOWED" && bad.wrongState.body?.code === "STATE_MISMATCH" && bad.forgedVerified.body?.code === "EVIDENCE_NOT_IN_LEDGER" && bad.missingEntity.body?.code === "ENTITY_NOT_FOUND" && callerActor.status >= 400,
    { ...Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, v.body?.code])), callerActor: `${callerActor.status}/${callerActor.body?.code}` });
  // ---------- history intact ----------
  const after = await db(`admin_audit_logs?id=lte.${before.at(-1)?.id ?? 0}&select=id,action,entity_type,entity_id,actor_id,metadata,created_at&order=id`);
  expect("H1. every pre-existing audit row still present and unchanged (ids + content identical, incl. the cron rows 332-333 and the pre-021 probe 334); new rows only appended after them", JSON.stringify(after) === JSON.stringify(historical) && [332, 333, 334].every((id) => historical.some((r) => r.id === id)) && (await db(`admin_audit_logs?id=gt.${before.at(-1)?.id ?? 0}&select=id`)).length > 0, { before: historical.length, after: after.length });
}

try {
  if (phase === "pre") await pre();
  else if (phase === "post") await post();
  else throw new Error(`unknown phase ${phase}`);
} catch (error) {
  record("FAIL", "admin audit harness", String(error?.stack || error).slice(0, 600));
} finally {
  const ids = [...fx.created.requestIds];
  const out = await fx.cleanup();
  const retained = ids.length ? (await db(`admin_audit_logs?entity_id=in.(${ids.join(",")})&select=id`)).length : 0;
  record("INFO", `TEST_FIXTURE audit rows retained (append-only, fixture requests removed): ${retained}`);
  expect("Fixture cleanup (disposable requests / helper removed; audit rows NOT deleted)", Object.values(out).every((v) => v === 0), out);
}
if (summary().FAIL > 0) process.exit(1);

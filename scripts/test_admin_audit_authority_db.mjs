// Deterministic test of migration 202609280021 (admin_audit_logs append-only authority) on the REAL chain in
// PGlite; the app role is exercised explicitly (SET ROLE service_role, BYPASSRLS as on Supabase).
// Usage: node scripts/test_admin_audit_authority_db.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one, all, fails } = f;
await f.enablePolicies();
await db.exec("alter role service_role bypassrls");
const asRole = async (role, sql, params = []) => { await db.exec(`set role ${role}`); try { return await fails(sql, params); } finally { await db.exec("reset role"); } };
const named = async (fn, args) => { const k = Object.keys(args); return (await one(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(", ")}) as r`, k.map((x) => args[x]))).r; };
const append = (action, entityType, entityId, metadata = {}) => named("append_admin_audit_log", { p_action: action, p_entity_type: entityType, p_entity_id: entityId, p_metadata: JSON.stringify(metadata) });
const denied = (e) => /permission denied/i.test(String(e?.message));
const count = async (action, entity) => (await one("select count(*)::int n from public.admin_audit_logs where action = $1 and entity_id is not distinct from $2", [action, entity])).n;
const legacyRequest = async (status) => (await one("insert into public.service_requests (customer_id, customer_display_name, service_slug, country, sido, gungu, description, status, request_mode, selection_mode, legacy_unfunded) values ('AUDITXXX', 'x', 'boiler', 'KR', 'AUD', 'G1', 'x', $1, 'LEGACY_AUTO_MATCH', 'AUTO_MATCH', true) returning id", [status])).id;

// ---------- privileges (A-D) ----------
const reqS = await legacyRequest("SETTLED");
const first = await append("SERVICE_SETTLED", "service_request", reqS, { actor_kind: "PLATFORM_TOKEN", settlement_method: "INTERNAL_PLATFORM_CONFIRMATION", settlement_rail: "INTERNAL", external_payment_provider: null, external_payment_transaction_id: null, external_payment_verified: false });
const rowId = first.id;
const grants = await one(`select has_table_privilege('service_role','public.admin_audit_logs','SELECT') s, has_table_privilege('service_role','public.admin_audit_logs','INSERT') i,
  has_table_privilege('service_role','public.admin_audit_logs','UPDATE') u, has_table_privilege('service_role','public.admin_audit_logs','DELETE') d, has_table_privilege('service_role','public.admin_audit_logs','TRUNCATE') t,
  has_table_privilege('anon','public.admin_audit_logs','INSERT') ai, has_table_privilege('authenticated','public.admin_audit_logs','INSERT') ui, has_table_privilege('authenticated','public.admin_audit_logs','SELECT') us`);
check("A-D (grants). app role SELECT only (no INSERT / UPDATE / DELETE / TRUNCATE); anon nothing; authenticated SELECT only (staff RLS policy)", grants.s && !grants.i && !grants.u && !grants.d && !grants.t && !grants.ai && !grants.ui && grants.us, JSON.stringify(grants));
const app = {
  update: await asRole("service_role", "update public.admin_audit_logs set action = 'X' where id = $1", [rowId]),
  delete: await asRole("service_role", "delete from public.admin_audit_logs where id = $1", [rowId]),
  truncate: await asRole("service_role", "truncate public.admin_audit_logs"),
  insert: await asRole("service_role", "insert into public.admin_audit_logs (action, entity_type, entity_id, metadata) values ('SERVICE_SETTLED', 'service_request', $1, '{}')", [reqS]),
  anonInsert: await asRole("anon", "insert into public.admin_audit_logs (action, entity_type, metadata) values ('X', 'system', '{}')"),
  authUpdate: await asRole("authenticated", "update public.admin_audit_logs set action = 'X' where id = $1", [rowId]),
  authDelete: await asRole("authenticated", "delete from public.admin_audit_logs where id = $1", [rowId]),
};
check("A / B / C / D. app role direct UPDATE, DELETE, TRUNCATE, INSERT refused; anon / authenticated mutation refused; the row is unchanged", Object.values(app).every(denied) && (await one("select action from public.admin_audit_logs where id = $1", [rowId])).action === "SERVICE_SETTLED", JSON.stringify(Object.fromEntries(Object.entries(app).map(([k, v]) => [k, v?.message?.slice(0, 40)]))));
const owner = {
  update: await fails("update public.admin_audit_logs set metadata = '{}' where id = $1", [rowId]),
  delete: await fails("delete from public.admin_audit_logs where id = $1", [rowId]),
  truncate: await fails("truncate public.admin_audit_logs"),
};
check("A-C (defense in depth). even the table owner cannot update / delete / truncate audit rows (triggers)", /never modified/.test(owner.update?.message) && /never modified/.test(owner.delete?.message) && /never truncated/.test(owner.truncate?.message));
const executable = await one("select has_function_privilege('service_role', 'public.append_admin_audit_log(text, text, uuid, jsonb)', 'EXECUTE') s, has_function_privilege('anon', 'public.append_admin_audit_log(text, text, uuid, jsonb)', 'EXECUTE') a, has_function_privilege('authenticated', 'public.append_admin_audit_log(text, text, uuid, jsonb)', 'EXECUTE') u");
check("D2. the trusted append path is executable by the server role only (not anon / authenticated)", executable.s && !executable.a && !executable.u);

// ---------- E: operator audits ----------
const h = await f.helper("AUDH");
const push = await append("WEB_PUSH_TEST_SENT", "push_subscription_owner", h.id, { actor_kind: "PLATFORM_TOKEN", owner_type: "HELPER", attempted: 1, delivered: 1, invalidated: 0, failed: 0 });
const cron = await append("CONVERSATION_CLEANUP_RETRY", "system", null, { actor_kind: "CRON", trigger: "scheduled", reason: "QUEUED_CLEANUP_RETRY", cleaned: 1, closedRequests: 0, failed: 0, reconciled: 0 });
const cron2 = await append("CONVERSATION_CLEANUP_RETRY", "system", null, { actor_kind: "CRON", trigger: "scheduled", reason: "QUEUED_CLEANUP_RETRY", cleaned: 2, closedRequests: 0, failed: 0, reconciled: 0 });
check("E1. operator / system audits append: WEB_PUSH_TEST_SENT for an existing Helper, CONVERSATION_CLEANUP_RETRY runs (each run its own row); actor_id never set", push.success && cron.success && cron2.success && cron.id !== cron2.id && (await one("select count(*)::int n from public.admin_audit_logs where actor_id is not null")).n === 0);
const p = await f.completedPayout("AUDOP");
const job = await f.jobFor({ obligationId: p.obligationId });
await db.query("update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'TEST' where id = $1", [job.id]);
const actions = [];
for (const action of ["NOTE", "ESCALATE"]) actions.push(await f.rpc("operator_review_action", "MONEY_JOB", job.id, action, "ops", "SYS_SESSION", `${action} reason`, crypto.randomUUID(), null));
const opRows = await all("select id, action from public.operator_review_actions where case_id = $1 order by created_at", [job.id]);
const opUpd = await fails("update public.operator_review_actions set reason = 'rewritten' where id = $1", [opRows[0]?.id]);
check("E2. Migration 017 operator review actions still record exactly one immutable row each (NOTE, ESCALATE); earlier entries cannot be modified", actions.every((a) => a.success) && opRows.length === 2 && opRows.map((r) => r.action).join() === "NOTE,ESCALATE" && !!opUpd, JSON.stringify(actions));

// ---------- F: settlement audits (INTERNAL / CHAIN_DIRECT / PROVIDER / UNKNOWN) + evidence checks ----------
// CHAIN_DIRECT: a devnet-funded request with a CONFIRMED payout
const cl = await f.rpc("claim_money_job", (await f.jobFor({ obligationId: (await f.completedPayout("AUDCH")).obligationId })).id, 60);
const chainJobId = cl.job.job_id;
const prep = await f.rpc("prepare_money_attempt", chainJobId, cl.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 1000, b58(), b58(88), "{}", "cmVm");
await f.rpc("mark_money_attempt_submitted", chainJobId, cl.job.lease_token, prep.attempt_id);
await f.rpc("record_money_attempt_result", chainJobId, cl.job.lease_token, prep.attempt_id, "CONFIRMED", null);
const chainOb = await one("select o.request_id, o.chain_signature, i.verified_signature from public.payout_obligations o join public.payment_intents i on i.id = o.payment_intent_id where o.id = (select payout_obligation_id from public.money_movement_jobs where id = $1)", [chainJobId]);
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [chainOb.request_id]);
const chainMeta = { actor_kind: "PAYOUT_RECONCILER", settlement_method: "STAGING_DEVNET_USDC", settlement_rail: "CHAIN_DIRECT", external_payment_provider: "SOLANA_SOLANA-DEVNET", external_payment_transaction_id: chainOb.verified_signature, external_payout_transaction_id: chainOb.chain_signature, external_payment_verified: true };
const forgedChain = await append("SERVICE_SETTLED", "service_request", chainOb.request_id, { ...chainMeta, external_payment_transaction_id: b58(88) });
const forgedPayout = await append("SERVICE_SETTLED", "service_request", chainOb.request_id, { ...chainMeta, external_payout_transaction_id: b58(88) });
const chainOk = await append("SERVICE_SETTLED", "service_request", chainOb.request_id, chainMeta);
check("F1. CHAIN_DIRECT settlement audit appends with the ledger's own signatures; a fabricated payment or payout reference is refused (EVIDENCE_NOT_IN_LEDGER)", forgedChain.code === "EVIDENCE_NOT_IN_LEDGER" && forgedPayout.code === "EVIDENCE_NOT_IN_LEDGER" && chainOk.success && chainOk.replayed === false);
const verifiedLegacy = await append("SERVICE_SETTLED", "service_request", await legacyRequest("SETTLED"), { actor_kind: "PLATFORM_TOKEN", settlement_rail: "INTERNAL", external_payment_verified: true });
check("F2. INTERNAL (unfunded) settlement appends unverified (row above); claiming external verification without ledger evidence is refused", first.success && verifiedLegacy.code === "EVIDENCE_NOT_IN_LEDGER");
// PROVIDER: provider-hosted payment (local-only registry enablement), payout confirmed through the outbox
await db.query("update public.payment_providers set enabled = true, approved_by = 't', approved_at = now() where code = 'MOCK_PROVIDER' and environment = 'SANDBOX'");
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, 'MOCK_PROVIDER', 'SANDBOX', 'MOCK_RAIL', true, 't', now())", [cap]);
const ph = await f.helper("AUDPV", { sido: "AUDPV" });
const pp = await f.rpc("upsert_helper_service_price", ph.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }), true);
const pco = await f.helperCheckout(pp, "AUDPROVX", "AUDPV");
const opened = await named("open_provider_payment_intent", { p_checkout_id: pco.checkout_id, p_customer_id: "AUDPROVX", p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_provider_account: "acct", p_reference: b58(), p_ttl_seconds: 900 });
await named("link_provider_payment", { p_intent_id: opened.intent_id, p_provider_payment_id: "mockpay_audit_1" });
await named("ingest_provider_event", { p_provider: "MOCK_PROVIDER", p_environment: "SANDBOX", p_provider_account: "acct", p_provider_event_id: "evt_audit_1", p_source: "WEBHOOK", p_event_type: "PAYMENT_HELD", p_provider_event_type: "payment.held", p_object_ref: "mockpay_audit_1", p_life_help_reference: null, p_amount_minor: 60000, p_currency: "KRW", p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: "a".repeat(64), p_signature_verified: true });
const preq = (await one("select request_id from public.payment_intents where id = $1", [opened.intent_id])).request_id;
await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', 'MOCK_PROVIDER', 'SANDBOX', 'payee_audit', 'x', 'ACTIVE')", [ph.id]);
const [pasg] = await f.activeAssignments(preq);
await f.rpc("accept_assignment", pasg.id, ph.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [preq]);
await f.rpc("complete_assignment_service", pasg.id, ph.id);
await f.rpc("confirm_service_completion", preq, "AUDPROVX");
const pjob = (await one("select id from public.money_movement_jobs where payout_obligation_id = (select id from public.payout_obligations where request_id = $1)", [preq])).id;
const pcl = await f.rpc("claim_money_job", pjob, 60);
const ext = `lh_${pjob.replace(/-/g, "")}_1`;
const pprep = await f.rpc("prepare_money_attempt", pjob, pcl.job.lease_token, "MOCK_PROVIDER", "provider:MOCK_PROVIDER:SANDBOX", "KRW", 60000, "payee_audit", ext, "{}", "{}");
await f.rpc("record_money_attempt_result", pjob, pcl.job.lease_token, pprep.attempt_id, "CONFIRMED", null);
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [preq]);
const provMeta = { actor_kind: "PLATFORM_TOKEN", settlement_method: "PROVIDER_HOSTED", settlement_rail: "PROVIDER", external_payment_provider: "MOCK_PROVIDER", external_payment_environment: "SANDBOX", external_payment_transaction_id: "mockpay_audit_1", external_payout_transaction_id: ext, external_payout_network: "provider:MOCK_PROVIDER:SANDBOX", external_payment_verified: true };
const borrowed = await append("SERVICE_SETTLED", "service_request", preq, { ...provMeta, external_payment_transaction_id: "mockpay_someone_else" });
const provOk = await append("SERVICE_SETTLED", "service_request", preq, provMeta);
check("F3. PROVIDER settlement audit appends with the binding's provider payment reference + the obligation's payout reference; a borrowed provider reference is refused", borrowed.code === "EVIDENCE_NOT_IN_LEDGER" && provOk.success, JSON.stringify([borrowed, provOk]));
const unknownRail = await append("SERVICE_SETTLED", "service_request", await legacyRequest("SETTLED"), { actor_kind: "PLATFORM_TOKEN", settlement_rail: "UNKNOWN", external_payment_verified: false, attribution_issue: "UNKNOWN_FUNDING_RAIL", external_payment_transaction_id: null });
check("F4. UNKNOWN fail-closed attribution (unverified, no references) appends", unknownRail.success);
const state = {
  pendingOnSearching: await append("SERVICE_PAYMENT_PENDING", "service_request", await legacyRequest("SEARCHING"), { actor_kind: "PLATFORM_TOKEN" }),
  closedOnSettled: await append("SERVICE_CLOSED", "service_request", await legacyRequest("SETTLED"), { actor_kind: "CLEANUP_RUNNER" }),
  settledMissing: await append("SERVICE_SETTLED", "service_request", crypto.randomUUID(), {}),
};
check("F5. lifecycle audits must match the request's real state / existence (STATE_MISMATCH, ENTITY_NOT_FOUND)", state.pendingOnSearching.code === "STATE_MISMATCH" && state.closedOnSettled.code === "STATE_MISMATCH" && state.settledMissing.code === "ENTITY_NOT_FOUND");

// ---------- G: duplicates / idempotency ----------
const replay = await append("SERVICE_SETTLED", "service_request", reqS, { actor_kind: "PLATFORM_TOKEN", settlement_rail: "INTERNAL", external_payment_verified: false, reconciled: true });
const reqP = await legacyRequest("SETTLED");
const par = await Promise.all([append("SERVICE_SETTLED", "service_request", reqP, { actor_kind: "PLATFORM_TOKEN" }), append("SERVICE_SETTLED", "service_request", reqP, { actor_kind: "SYS_SESSION" })]);
check("G. duplicate settlement audit (retry / concurrent) -> ONE row, the other a replay; per-run system audits are not collapsed", replay.replayed === true && replay.id === rowId && (await count("SERVICE_SETTLED", reqS)) === 1 && par.filter((r) => r.replayed === false).length === 1 && (await count("SERVICE_SETTLED", reqP)) === 1);

// ---------- input validation ----------
const bad = {
  unknownAction: await append("DROP_EVERYTHING", "system", null, {}),
  typeMismatch: await append("SERVICE_SETTLED", "system", null, {}),
  systemWithEntity: await append("CONVERSATION_CLEANUP_RETRY", "system", reqS, {}),
  secretKey: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { settlement_token: "x" }),
  nestedSecret: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { report: { capability: "abc" } }),
  actorForged: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { actor_kind: "admin'; drop" }),
  pushUnknownOwner: await append("WEB_PUSH_TEST_SENT", "push_subscription_owner", crypto.randomUUID(), {}),
  oversized: await append("CONVERSATION_CLEANUP_RETRY", "system", null, { blob: "x".repeat(20000) }),
};
check("Validation. unknown action, entity-type mismatch, entity on a system action, secret-like keys (top-level or nested), forged actor_kind, unknown push owner, oversized metadata -> refused, nothing written", bad.unknownAction.code === "ACTION_NOT_ALLOWED" && bad.typeMismatch.code === "ENTITY_TYPE_MISMATCH" && bad.systemWithEntity.code === "ENTITY_NOT_ALLOWED" && bad.secretKey.code === "SECRET_FIELD_REFUSED" && bad.nestedSecret.code === "SECRET_FIELD_REFUSED" && bad.actorForged.code === "ACTOR_KIND_INVALID" && bad.pushUnknownOwner.code === "ENTITY_NOT_FOUND" && bad.oversized.code === "METADATA_INVALID", JSON.stringify(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, v.code]))));

// ---------- H + static: writers and fixture cleanup ----------
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const walk = (dir, out = []) => { for (const e of fs.readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(rel, out); else out.push(rel); } return out; };
const appFiles = [...walk("lib"), ...walk("app")].filter((p) => /\.tsx?$/.test(p));
const directWriters = appFiles.filter((p) => /from\("admin_audit_logs"\)\s*\.(insert|update|upsert|delete)/.test(read(p)));
const helper = read("lib/admin/auditLog.ts");
check("Static. application code writes admin_audit_logs only through appendAuditLog (the only direct insert is its pre-021 rollout fallback, taken solely on PGRST202 'function not found')", directWriters.join() === "lib/admin/auditLog.ts" && /if \(error\?\.code === "PGRST202"\) \{/.test(helper) && (helper.match(/from\("admin_audit_logs"\)/g) || []).length === 1, directWriters);
const scriptFiles = walk("scripts").filter((p) => /\.mjs$/.test(p) && !/test_admin_audit_authority_db/.test(p));
const deleters = scriptFiles.filter((p) => /admin_audit_logs[^\n]*"DELETE"|del\(`admin_audit_logs/.test(read(p)));
check("H. no test fixture cleanup deletes audit history any more (audit rows of fixtures remain as immutable history)", deleters.length === 0, deleters);

done();

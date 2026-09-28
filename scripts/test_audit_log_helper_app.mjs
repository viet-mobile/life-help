// appendAuditLog rollout fallback: taken ONLY when PostgREST cannot find append_admin_audit_log (PGRST202 naming
// it = migration 021 not applied). Every other outcome stays exactly what the trusted path said.
// Usage: node scripts/test_audit_log_helper_app.mjs
import { checker } from "./lib/prepayFixtures.mjs";

const { appendAuditLog, isAppendFunctionMissing } = await import(new URL("../lib/admin/auditLog.ts", import.meta.url).href);
const { check, done } = checker();
const client = (rpcResult) => {
  const calls = { rpc: 0, insert: 0 };
  return { calls, rpc: async () => { calls.rpc += 1; return rpcResult; }, from: () => ({ insert: async () => { calls.insert += 1; return { error: null }; } }) };
};
const missing = { data: null, error: { code: "PGRST202", message: "Could not find the function public.append_admin_audit_log(p_action, p_entity_id, p_entity_type, p_metadata) in the schema cache" } };
const c1 = client(missing);
const r1 = await appendAuditLog(c1, "SERVICE_SETTLED", "service_request", "00000000-0000-0000-0000-000000000001", { actor_kind: "PLATFORM_TOKEN" });
check("1. function missing (PGRST202 naming append_admin_audit_log) -> exactly one legacy direct insert", r1.success === true && c1.calls.rpc === 1 && c1.calls.insert === 1);
const noFallback = {
  permissionDenied: { data: null, error: { code: "42501", message: "permission denied for function append_admin_audit_log" } },
  otherFunctionMissing: { data: null, error: { code: "PGRST202", message: "Could not find the function public.some_other_fn in the schema cache" } },
  timeout: { data: null, error: { code: "57014", message: "canceling statement due to statement timeout" } },
  arbitrary: { data: null, error: { code: "XX000", message: "internal error" } },
  network: { data: null, error: { message: "fetch failed" } },
  validationRejection: { data: { success: false, code: "SECRET_FIELD_REFUSED" }, error: null },
  stateRejection: { data: { success: false, code: "STATE_MISMATCH" }, error: null },
  evidenceRejection: { data: { success: false, code: "EVIDENCE_NOT_IN_LEDGER" }, error: null },
};
const results = {};
for (const [k, v] of Object.entries(noFallback)) { const c = client(v); const r = await appendAuditLog(c, "SERVICE_SETTLED", "service_request", "00000000-0000-0000-0000-000000000001", {}); results[k] = { inserts: c.calls.insert, success: r.success, code: r.code }; }
check("2. NO fallback on permission denied, another missing function, timeout, arbitrary DB error, network error, validation / state / evidence rejection - they stay failures / rejections", Object.values(results).every((x) => x.inserts === 0 && x.success === false), results);
check("3. trusted rejections are returned unchanged (the caller sees the function's code)", results.validationRejection.code === "SECRET_FIELD_REFUSED" && results.stateRejection.code === "STATE_MISMATCH" && results.evidenceRejection.code === "EVIDENCE_NOT_IN_LEDGER");
const ok = client({ data: { success: true, replayed: false, id: 7 }, error: null });
const r4 = await appendAuditLog(ok, "SERVICE_CLOSED", "service_request", "00000000-0000-0000-0000-000000000001", {});
check("4. with the function present the trusted RPC is used and nothing is written directly", r4.success === true && ok.calls.rpc === 1 && ok.calls.insert === 0);
check("5. predicate exactness", isAppendFunctionMissing(missing.error) && !isAppendFunctionMissing(null) && !isAppendFunctionMissing({ code: "PGRST202" }) && !isAppendFunctionMissing({ code: "42883", message: "function append_admin_audit_log does not exist" }));
done();

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The only way application code writes admin_audit_logs (append-only since migration 202609280021).
 * append_admin_audit_log validates action -> entity type, entity existence, request state, settlement
 * evidence against the ledger, secret-like keys and size; actor_id is never caller-chosen. Rows are never
 * updated or deleted by anyone.
 *
 * Rollout compatibility: before 021 exists the RPC is unknown to PostgREST (PGRST202) and the previous direct
 * insert is used, so a runtime deployed ahead of the migration never loses an audit row. After 021 the direct
 * path is revoked (fails closed); the fallback can then be removed.
 */
export type AuditAction =
  | "SERVICE_PAYMENT_PENDING" | "SERVICE_SETTLED" | "SERVICE_CLOSED" | "SETTLED_CLEANUP_RECONCILED" | "CONVERSATION_CONTENT_DELETED"
  | "CONVERSATION_CLEANUP_RETRY" | "WEB_PUSH_TEST_SENT";
export type AuditEntityType = "service_request" | "system" | "push_subscription_owner";

export async function appendAuditLog(
  client: SupabaseClient, action: AuditAction, entityType: AuditEntityType, entityId: string | null, metadata: Record<string, unknown>,
): Promise<{ success: boolean; replayed?: boolean; code?: string }> {
  const { data, error } = await client.rpc("append_admin_audit_log", { p_action: action, p_entity_type: entityType, p_entity_id: entityId, p_metadata: metadata });
  if (error?.code === "PGRST202") {
    const { error: insertError } = await client.from("admin_audit_logs").insert({ action, entity_type: entityType, entity_id: entityId, actor_id: null, metadata });
    return insertError ? { success: false, code: "AUDIT_WRITE_FAILED" } : { success: true, replayed: false };
  }
  if (error || !data) return { success: false, code: "AUDIT_WRITE_FAILED" };
  return data as { success: boolean; replayed?: boolean; code?: string };
}

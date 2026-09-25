import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SYS_SESSION_COOKIE, verifySysSessionToken } from "@/lib/auth/sysSession";
import { createRuntimeServiceRoleClient, getRuntimeServiceRoleConfig } from "@/lib/supabase/serviceRole";

const REF = "wreebowcbiymodswajwe";
const PROD = "wstdbymmkrqgtsibhcjz";
const transitions: Record<string, string[]> = { ACCEPTED: ["IN_PROGRESS"], IN_PROGRESS: ["COMPLETED"], COMPLETED: ["PAYMENT_PENDING"], PAYMENT_PENDING: ["SETTLED"] };

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const token = (await cookies()).get(SYS_SESSION_COOKIE)?.value;
  const session = await verifySysSessionToken(token);
  if (!session) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const config = await getRuntimeServiceRoleConfig();
  const ref = config?.url.match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1];
  if (!config || ref !== REF || ref === String(PROD)) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { status?: unknown };
  const target = typeof body.status === "string" ? body.status : "";
  const { requestId } = await context.params;
  if (!transitions[target]) return NextResponse.json({ success: false, code: "INVALID_STATUS" }, { status: 400 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: row, error: lookupError } = await client.from("service_requests").select("id, status").eq("id", requestId).maybeSingle();
  if (lookupError || !row) return NextResponse.json({ success: false, code: "REQUEST_NOT_FOUND" }, { status: 404 });
  if (!transitions[target].includes(row.status)) return NextResponse.json({ success: false, code: "INVALID_TRANSITION" }, { status: 409 });
  const { error } = await client.from("service_requests").update({ status: target, updated_at: new Date().toISOString() }).eq("id", requestId).eq("status", row.status);
  if (error) return NextResponse.json({ success: false, code: "STATUS_UPDATE_FAILED" }, { status: 500 });
  if (target === "SETTLED") {
    const { data: conversations } = await client.from("conversations").select("id").eq("request_id", requestId);
    for (const conversation of conversations ?? []) {
      await client.from("messages").delete().eq("conversation_id", conversation.id);
      await client.from("conversations").update({ status: "DELETED", closed_at: new Date().toISOString() }).eq("id", conversation.id);
    }
    await client.from("admin_audit_logs").insert({ action: "STAGING_SETTLED_CONVERSATION_PURGED", entity_type: "service_request", entity_id: requestId, actor_id: null, metadata: { staging_ref: REF } });
  }
  return NextResponse.json({ success: true, requestId, status: target, conversationContentDeleted: target === "SETTLED" });
}

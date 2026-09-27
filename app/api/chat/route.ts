import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { verifyConversationCapability } from "@/lib/chat/capability";

function fail(status: number, code: string) {
  return NextResponse.json({ success: false, code }, { status, headers: { "Cache-Control": "no-store" } });
}

async function resolveConversation(request: Request, requestId: string, capability?: string) {
  const client = await createRuntimeServiceRoleClient();
  if (!client) return { error: fail(503, "SERVICE_UNAVAILABLE") } as const;
  const helper = await resolveAuthenticatedHelper(request);
  let senderRole: "CUSTOMER" | "HELPER";
  let senderId: string;
  if (helper.ok) {
    const { data: assignment } = await client.from("request_assignments").select("id").eq("request_id", requestId).eq("helper_id", helper.value.helper.id).in("status", ["PENDING", "NOTIFIED", "ACCEPTED", "COMPLETED"]).limit(1).maybeSingle();
    if (!assignment) return { error: fail(403, "HELPER_NOT_ASSIGNED") } as const;
    senderRole = "HELPER";
    senderId = helper.value.helper.id;
  } else {
    if (!capability) return { error: fail(401, "CAPABILITY_REQUIRED") } as const;
    const verified = await verifyConversationCapability(capability, requestId);
    if (!verified) return { error: fail(403, "INVALID_CAPABILITY") } as const;
    senderRole = "CUSTOMER";
    senderId = verified.customerId;
  }
  // A request gets one conversation per assigned Helper (automatic rematch, customer re-selection);
  // a relationship's conversation is closed by the database when it ends (migration 016).
  // A Helper only ever sees its own. The customer sees the CURRENT Helper's conversation (never an
  // older one because of ordering); with no current Helper, the newest one as read-only history.
  let query = client.from("conversations").select("id, request_id, customer_id, helper_id, status, customer_locale, helper_locale").eq("request_id", requestId).eq("conversation_type", "CUSTOMER_HELPER");
  if (senderRole === "HELPER") query = query.eq("helper_id", senderId);
  else {
    const { data: current } = await client.from("request_assignments").select("helper_id").eq("request_id", requestId).in("status", ["PENDING", "NOTIFIED", "ACCEPTED", "COMPLETED"]).order("assigned_at", { ascending: false }).limit(1).maybeSingle();
    if (current?.helper_id) query = query.eq("helper_id", current.helper_id);
  }
  const { data: conversation, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !conversation) return { error: fail(404, "CONVERSATION_NOT_FOUND") } as const;
  return { client, conversation, senderRole, senderId } as const;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId") || "";
  const capability = url.searchParams.get("capability") || undefined;
  if (!/^[0-9a-f-]{36}$/.test(requestId)) return fail(400, "INVALID_REQUEST_ID");
  const resolved = await resolveConversation(request, requestId, capability);
  if ("error" in resolved) return resolved.error;
  // Content of a settled service conversation is withheld once cleanup is scheduled and deleted afterwards.
  if (resolved.conversation.status === "DELETION_SCHEDULED" || resolved.conversation.status === "DELETED") return NextResponse.json({ success: true, conversation: resolved.conversation, messages: [], contentDeleted: true }, { headers: { "Cache-Control": "no-store" } });
  const { data: messages, error } = await resolved.client.from("messages").select("id, conversation_id, sender_role, sender_id, original_language, original_text, translated_language, translated_text, translation_status, created_at").eq("conversation_id", resolved.conversation.id).order("created_at", { ascending: true });
  if (error) return fail(500, "MESSAGE_LOOKUP_FAILED");
  return NextResponse.json({ success: true, conversation: resolved.conversation, messages: messages ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: { requestId?: unknown; capability?: unknown; originalLanguage?: unknown; originalText?: unknown };
  try { body = await request.json(); } catch { return fail(400, "INVALID_JSON"); }
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const originalText = typeof body.originalText === "string" ? body.originalText.trim() : "";
  const originalLanguage = typeof body.originalLanguage === "string" ? body.originalLanguage : "";
  if (!/^[0-9a-f-]{36}$/.test(requestId) || !originalText || !originalLanguage) return fail(400, "VALIDATION_ERROR");
  const resolved = await resolveConversation(request, requestId, typeof body.capability === "string" ? body.capability : undefined);
  if ("error" in resolved) return resolved.error;
  if (resolved.conversation.status !== "ACTIVE") return fail(409, "CONVERSATION_CLOSED");
  const { data, error } = await resolved.client.from("messages").insert({ conversation_id: resolved.conversation.id, sender_role: resolved.senderRole, sender_id: resolved.senderId, original_language: originalLanguage, original_text: originalText, translated_language: null, translated_text: null, translation_status: "FAILED" }).select("id, conversation_id, sender_role, sender_id, original_language, original_text, translated_language, translated_text, translation_status, created_at").single();
  // The database refuses writes outside the current relationship (closed / ended / wrong sender): same
  // answer as a closed conversation, so a refused write reveals nothing more.
  if (error && /CONVERSATION_NOT_WRITABLE/.test(error.message ?? "")) return fail(409, "CONVERSATION_CLOSED");
  if (error || !data) return fail(500, "MESSAGE_CREATE_FAILED");
  const recipientType = resolved.senderRole === "CUSTOMER" ? "HELPER" : "CUSTOMER";
  const recipientId = resolved.senderRole === "CUSTOMER" ? String(resolved.conversation.helper_id || "") : resolved.conversation.customer_id;
  await resolved.client.from("app_notifications").insert({ recipient_type: recipientType, recipient_id: recipientId, type: "NEW_CHAT_MESSAGE", title: "New chat message", body: "A new message is available.", payload: { conversation_id: resolved.conversation.id, message_id: data.id } });
  return NextResponse.json({ success: true, message: data }, { headers: { "Cache-Control": "no-store" } });
}

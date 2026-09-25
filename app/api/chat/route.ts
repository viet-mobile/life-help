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
    const { data: assignment } = await client.from("request_assignments").select("id").eq("request_id", requestId).eq("helper_id", helper.value.helper.id).in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]).maybeSingle();
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
  const { data: conversation, error } = await client.from("conversations").select("id, request_id, customer_id, helper_id, status, customer_locale, helper_locale").eq("request_id", requestId).eq("conversation_type", "CUSTOMER_HELPER").maybeSingle();
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
  const { data, error } = await resolved.client.from("messages").insert({ conversation_id: resolved.conversation.id, sender_role: resolved.senderRole, sender_id: resolved.senderId, original_language: originalLanguage, original_text: originalText, translated_language: null, translated_text: null, translation_status: "FAILED" }).select("id, conversation_id, sender_role, sender_id, original_language, original_text, translated_language, translated_text, translation_status, created_at").single();
  if (error || !data) return fail(500, "MESSAGE_CREATE_FAILED");
  return NextResponse.json({ success: true, message: data }, { headers: { "Cache-Control": "no-store" } });
}

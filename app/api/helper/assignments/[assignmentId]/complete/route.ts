import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { dispatchPushInBackground, notifyCustomerStatusChange, pushCustomerStatus } from "@/lib/push/pushDelivery";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Request IN_PROGRESS -> COMPLETED and assignment ACCEPTED -> COMPLETED happen in one database
// transaction (complete_assignment_service), which releases the helper for new matching.
// Financial settlement, rewards and conversation cleanup are separate and are not triggered here.
export async function POST(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return response({ success: false, code: resolved.code }, resolved.status);
  const { assignmentId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(assignmentId)) return response({ success: false, code: "ASSIGNMENT_NOT_FOUND" }, 404);
  const { helper, client } = resolved.value;
  const { data, error } = await client.rpc("complete_assignment_service", { p_assignment_id: assignmentId, p_helper_id: helper.id });
  if (error || !data) return response({ success: false, code: "COMPLETE_FAILED" }, 502);
  if (!data.success) {
    // A helper never learns whether another helper's assignment exists.
    if (data.code === "ASSIGNMENT_NOT_FOUND" || data.code === "HELPER_MISMATCH") return response({ success: false, code: "ASSIGNMENT_NOT_FOUND" }, 404);
    if (data.code === "REQUEST_NOT_FOUND") return response({ success: false, code: "REQUEST_NOT_FOUND" }, 404);
    return response({ success: false, code: data.code || "COMPLETE_CONFLICT", currentStatus: data.request_status ?? data.assignment_status }, 409);
  }
  // Customer in-app record + Web Push, best effort: never changes the committed result.
  if (data.idempotent !== true && data.request_status === "COMPLETED") {
    const { data: row } = await client.from("service_requests").select("customer_id, funding_payment_intent_id").eq("id", data.request_id).maybeSingle();
    if (row?.funding_payment_intent_id) {
      // Prepaid request: the Helper's completion does NOT release payment. Ask the customer to
      // confirm "서비스 완료" (in-app + generic push without price / ids); funds stay held until then.
      await client.from("app_notifications").insert({ recipient_type: "CUSTOMER", recipient_id: row.customer_id, type: "SERVICE_COMPLETION_CONFIRMATION_REQUESTED", title: "서비스 완료를 확인해 주세요", body: "서비스가 완료되었다면 LIFE.HELP에서 '서비스 완료'를 확인해 주세요.", payload: { request_id: data.request_id } });
      await dispatchPushInBackground(() => pushCustomerStatus(client, data.request_id, "COMPLETION_CONFIRMATION_REQUESTED"));
    } else {
      await notifyCustomerStatusChange(client, data.request_id, "COMPLETED");
    }
  }
  return response({ success: true, idempotent: data.idempotent === true, requestId: data.request_id, status: data.request_status, assignmentStatus: data.assignment_status });
}

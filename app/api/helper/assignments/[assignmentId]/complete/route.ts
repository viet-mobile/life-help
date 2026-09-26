import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { notifyCustomerStatusChange } from "@/lib/push/pushDelivery";

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
  if (data.idempotent !== true && data.request_status === "COMPLETED") await notifyCustomerStatusChange(client, data.request_id, "COMPLETED");
  return response({ success: true, idempotent: data.idempotent === true, requestId: data.request_id, status: data.request_status, assignmentStatus: data.assignment_status });
}

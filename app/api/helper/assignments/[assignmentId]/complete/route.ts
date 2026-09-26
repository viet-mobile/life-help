import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return response({ success: false, code: resolved.code }, resolved.status);
  const { assignmentId } = await context.params;
  const { helper, client } = resolved.value;
  const { data: assignment, error } = await client.from("request_assignments").select("id, request_id, helper_id, status").eq("id", assignmentId).eq("helper_id", helper.id).maybeSingle();
  if (error || !assignment) return response({ success: false, code: "ASSIGNMENT_NOT_FOUND" }, 404);
  const { data: requestRow, error: requestError } = await client.from("service_requests").select("id, status").eq("id", assignment.request_id).maybeSingle();
  if (requestError || !requestRow) return response({ success: false, code: "REQUEST_NOT_FOUND" }, 404);
  if (assignment.status !== "ACCEPTED") return response({ success: false, code: "ASSIGNMENT_NOT_ACCEPTED" }, 409);
  if (requestRow.status === "COMPLETED") return response({ success: true, idempotent: true, requestId: requestRow.id, status: "COMPLETED" });
  if (requestRow.status !== "IN_PROGRESS") return response({ success: false, code: "REQUEST_NOT_COMPLETABLE", currentStatus: requestRow.status }, 409);
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await client.from("service_requests").update({ status: "COMPLETED", updated_at: now }).eq("id", requestRow.id).eq("status", "IN_PROGRESS").select("id, status").maybeSingle();
  if (updateError || !updated) return response({ success: false, code: "COMPLETE_CONFLICT" }, 409);
  await client.from("request_assignments").update({ completed_at: now }).eq("id", assignment.id).eq("status", "ACCEPTED");
  return response({ success: true, idempotent: false, requestId: updated.id, status: updated.status });
}
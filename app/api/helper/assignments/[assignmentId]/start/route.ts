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
  if (requestRow.status === "IN_PROGRESS") return response({ success: true, idempotent: true, requestId: requestRow.id, status: "IN_PROGRESS" });
  if (requestRow.status !== "ACCEPTED") return response({ success: false, code: "REQUEST_NOT_STARTABLE", currentStatus: requestRow.status }, 409);
  const { data: updated, error: updateError } = await client.from("service_requests").update({ status: "IN_PROGRESS", updated_at: new Date().toISOString() }).eq("id", requestRow.id).eq("status", "ACCEPTED").select("id, status").maybeSingle();
  if (updateError || !updated) return response({ success: false, code: "START_CONFLICT" }, 409);
  return response({ success: true, idempotent: false, requestId: updated.id, status: updated.status });
}
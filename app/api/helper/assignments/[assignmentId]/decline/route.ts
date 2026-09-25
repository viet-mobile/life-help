import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";

export async function POST(_request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const resolved = await resolveAuthenticatedHelper(_request);
  if (!resolved.ok) return NextResponse.json({ success: false, code: resolved.code }, { status: resolved.status });
  const { assignmentId } = await context.params;
  const { data: assignment, error: assignmentError } = await resolved.value.client
    .from("request_assignments")
    .select("id, helper_id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (assignmentError || !assignment) return NextResponse.json({ success: false, code: "ASSIGNMENT_NOT_FOUND" }, { status: 404 });
  if (assignment.helper_id !== resolved.value.helper.id) return NextResponse.json({ success: false, code: "HELPER_MISMATCH" }, { status: 403 });

  const { data: release, error: releaseError } = await resolved.value.client.rpc("release_assignment_for_rematch", {
    p_assignment_id: assignmentId,
    p_release_status: "DECLINED",
  });
  if (releaseError) return NextResponse.json({ success: false, code: "DECLINE_FAILED" }, { status: 502 });
  if (!release?.success) return NextResponse.json({ success: false, code: release?.code || "DECLINE_REJECTED" }, { status: 409 });

  let matching = null;
  if (release.request_reopened) {
    const result = await resolved.value.client.rpc("match_and_assign_helper", { p_request_id: release.request_id });
    if (result.error) return NextResponse.json({ success: true, release, matching: { success: false, code: "REMATCH_FAILED" } }, { status: 202 });
    matching = result.data;
  }
  return NextResponse.json({ success: true, release, matching }, { headers: { "Cache-Control": "no-store" } });
}

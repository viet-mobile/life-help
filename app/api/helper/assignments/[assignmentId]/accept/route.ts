import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";

export async function POST(_request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const resolved = await resolveAuthenticatedHelper(_request);
  if (!resolved.ok) return NextResponse.json({ success: false, code: resolved.code }, { status: resolved.status });
  const { assignmentId } = await context.params;
  const { data, error } = await resolved.value.client.rpc("accept_assignment", {
    p_assignment_id: assignmentId,
    p_helper_id: resolved.value.helper.id,
  });
  if (error) return NextResponse.json({ success: false, code: "ACCEPT_FAILED", message: "Assignment acceptance failed." }, { status: 502 });
  if (!data?.success) {
    const status = data?.code === "HELPER_MISMATCH" ? 403 : 409;
    return NextResponse.json({ success: false, code: data?.code || "ACCEPT_REJECTED" }, { status });
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

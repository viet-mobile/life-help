import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SYS_SESSION_COOKIE, verifySysSessionToken } from "@/lib/auth/sysSession";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

async function authorized() {
  const token = (await cookies()).get(SYS_SESSION_COOKIE)?.value;
  return !!(await verifySysSessionToken(token));
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data, error } = await client.from("admin_escalations").select("id, request_id, reason, status, escalated_at, admin_notes, service_requests(id, service_slug, sido, gungu, description, selected_options, status, created_at)").eq("reason", "NO_HELPER_AVAILABLE").order("escalated_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, code: "ESCALATION_LOOKUP_FAILED" }, { status: 500 });
  return NextResponse.json({ success: true, escalations: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

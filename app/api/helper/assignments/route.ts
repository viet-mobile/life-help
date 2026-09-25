import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const resolved = await resolveAuthenticatedHelper();
  if (!resolved.ok) {
    return failure(resolved.status, resolved.code, resolved.status === 401 ? "Authentication required." : "Helper account is not linked.");
  }

  const { helper, client } = resolved.value;
  const { data: assignments, error } = await client
    .from("request_assignments")
    .select("id, request_id, status, assigned_at, responded_at")
    .eq("helper_id", helper.id)
    .in("status", ["PENDING", "NOTIFIED", "ACCEPTED"])
    .order("assigned_at", { ascending: false });

  if (error) return failure(500, "ASSIGNMENT_LOOKUP_FAILED", "Assignments could not be read.");

  const requestIds = (assignments ?? []).map((assignment) => assignment.request_id);
  if (requestIds.length === 0) {
    return NextResponse.json({ success: true, assignments: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: requests, error: requestError } = await client
    .from("service_requests")
    .select("id, service_slug, country, sido, gungu, description, selected_options, customer_locale, status, created_at")
    .in("id", requestIds);
  if (requestError) return failure(500, "REQUEST_LOOKUP_FAILED", "Assigned requests could not be read.");

  const requestById = new Map((requests ?? []).map((request) => [request.id, request]));
  const result = (assignments ?? []).flatMap((assignment) => {
    const request = requestById.get(assignment.request_id);
    if (!request) return [];
    return [{
      assignmentId: assignment.id,
      requestId: request.id,
      assignmentStatus: assignment.status,
      requestStatus: request.status,
      serviceSlug: request.service_slug,
      country: request.country,
      sido: request.sido,
      gungu: request.gungu,
      description: request.description,
      selectedOptions: request.selected_options,
      customerLocale: request.customer_locale,
      assignedAt: assignment.assigned_at,
      createdAt: request.created_at,
    }];
  });

  return NextResponse.json({ success: true, assignments: result }, { headers: { "Cache-Control": "no-store" } });
}

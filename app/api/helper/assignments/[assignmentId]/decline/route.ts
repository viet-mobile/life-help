import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { dispatchPushInBackground, pushCustomerStatus, pushHelperAssignment } from "@/lib/push/pushDelivery";

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
  // A customer chose THIS helper at THIS price: never auto-substitute another helper / price.
  // Migration 013 moved the request to CUSTOMER_RESELECTION_REQUIRED, ended the price selection and
  // wrote the customer's in-app notice; the customer now explicitly chooses a fresh offer.
  // (The selection_mode read keeps the same answer for any request released before 013.)
  // Migration 014: an accepted CUSTOMER_OFFER_OPEN request re-opens to eligible Helpers at the SAME
  // funded customer offer (the declining Helper is excluded); no automatic assignment, no new price.
  if (release.customer_offer_reopened === true) {
    return NextResponse.json({ success: true, release, matching: { success: false, code: "CUSTOMER_OFFER_REOPENED" } }, { headers: { "Cache-Control": "no-store" } });
  }
  const { data: requestRow } = await resolved.value.client.from("service_requests").select("selection_mode").eq("id", release.request_id).maybeSingle();
  if (release.customer_reselection_required === true || (release.request_reopened && requestRow?.selection_mode === "CUSTOMER_SELECTED")) {
    // Generic best-effort push to the owning customer device: no price, no Helper, no address.
    // A retried decline is rejected by the release RPC, so this is sent once.
    if (release.customer_reselection_required === true) await dispatchPushInBackground(() => pushCustomerStatus(resolved.value.client, release.request_id, "RESELECTION_REQUIRED"));
    return NextResponse.json({ success: true, release, matching: { success: false, code: "CUSTOMER_RESELECTION_REQUIRED" } }, { headers: { "Cache-Control": "no-store" } });
  }
  if (release.request_reopened) {
    const result = await resolved.value.client.rpc("match_and_assign_helper", { p_request_id: release.request_id });
    if (result.error) return NextResponse.json({ success: true, release, matching: { success: false, code: "REMATCH_FAILED" } }, { status: 202 });
    matching = result.data;
    // New assignment created by this rematch: notify the newly assigned helper (best effort).
    // A retried decline is rejected by release_assignment_for_rematch, so this never repeats.
    if (matching?.success === true && matching.status === "MATCHED") await dispatchPushInBackground(() => pushHelperAssignment(resolved.value.client, release.request_id));
  }
  return NextResponse.json({ success: true, release, matching }, { headers: { "Cache-Control": "no-store" } });
}

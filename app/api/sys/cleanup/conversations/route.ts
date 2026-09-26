import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { runConversationCleanup } from "@/lib/settlement/serviceSettlement";
import { runMediaDeletion } from "@/lib/media/mediaStorage";
import { reconcileTransfers } from "@/lib/payments/transfers";

/**
 * Runs due settled-conversation cleanup (retry path for the inline cleanup performed at
 * settlement). Called by a SYS operator or by the staging cron trigger (workers/scheduled.mjs),
 * which invokes this route in-process with the platform token.
 */
export async function POST(request: Request) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { requestId?: unknown; limit?: unknown };
  const requestId = typeof body.requestId === "string" && /^[0-9a-f-]{36}$/.test(body.requestId) ? body.requestId : undefined;
  const limit = typeof body.limit === "number" ? body.limit : undefined;
  const report = await runConversationCleanup(client, { requestId, limit });
  // Request photos / videos scheduled at "service complete" (or cancel) are deleted permanently.
  const media = await runMediaDeletion(client);
  const transfers = await reconcileTransfers(client).catch(() => null);
  // Label only; authority comes from authorizePlatformOperator above.
  const trigger = request.headers.get("x-life-help-trigger") === "scheduled" ? "SCHEDULED" : "MANUAL";
  // reason separates a plain queued-cleanup retry from recovery of a SETTLED request whose
  // cleanup was never scheduled (per-request SETTLED_CLEANUP_RECONCILED rows carry the detail).
  const reason = report.reconciled > 0 ? "SETTLED_CLEANUP_RECONCILED" : "QUEUED_CLEANUP_RETRY";
  // Record runs that changed or failed something; empty runs leave no audit noise.
  if (report.cleaned + report.closedRequests + report.failed + report.reconciled > 0) {
    await client.from("admin_audit_logs").insert({ action: "CONVERSATION_CLEANUP_RETRY", entity_type: "system", entity_id: null, actor_id: null, metadata: { actor_kind: actor, trigger, reason, ...report } });
  }
  return NextResponse.json({ success: true, trigger, reason, ...report, media, transfers }, { headers: { "Cache-Control": "no-store" } });
}

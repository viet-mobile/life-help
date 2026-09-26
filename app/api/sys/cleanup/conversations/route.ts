import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { runConversationCleanup } from "@/lib/settlement/serviceSettlement";

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
  // Label only; authority comes from authorizePlatformOperator above.
  const trigger = request.headers.get("x-life-help-trigger") === "scheduled" ? "SCHEDULED" : "MANUAL";
  // Record runs that changed or failed something; empty runs leave no audit noise.
  if (report.cleaned + report.closedRequests + report.failed > 0) {
    await client.from("admin_audit_logs").insert({ action: "CONVERSATION_CLEANUP_RETRY", entity_type: "system", entity_id: null, actor_id: null, metadata: { actor_kind: actor, trigger, ...report } });
  }
  return NextResponse.json({ success: true, trigger, ...report }, { headers: { "Cache-Control": "no-store" } });
}

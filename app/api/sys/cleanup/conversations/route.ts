import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { runConversationCleanup } from "@/lib/settlement/serviceSettlement";

/**
 * Runs due settled-conversation cleanup (retry path for the inline cleanup performed at
 * settlement). Intended for a SYS operator or a future scheduled caller holding the platform token.
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
  return NextResponse.json({ success: true, ...report }, { headers: { "Cache-Control": "no-store" } });
}

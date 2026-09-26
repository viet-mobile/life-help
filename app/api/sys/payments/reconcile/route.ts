import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { reconcileTransfers } from "@/lib/payments/transfers";

/**
 * POST /api/sys/payments/reconcile (platform operator, staging only): dispatch created payouts /
 * pending refunds that have a destination, and reconcile submitted ones against the chain. Nothing is
 * marked paid / refunded without finalized on-chain proof. Idempotent: transfers are claimed once.
 */
export async function POST(request: Request) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const result = await reconcileTransfers(client);
  return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}

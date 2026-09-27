import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { runMoneyOutbox } from "@/lib/payments/transfers";

/**
 * POST /api/sys/payments/reconcile (platform operator, staging only): run every due money job of the
 * durable outbox (payouts, refunds, Referral payouts): reconcile live attempts first, then submit.
 * Nothing is marked paid / refunded without finalized on-chain proof.
 */
export async function POST(request: Request) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  const client = await createStagingSettlementClient();
  if (!client) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const result = await runMoneyOutbox(client);
  return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}

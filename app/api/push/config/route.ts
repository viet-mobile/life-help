import { NextResponse } from "next/server";
import { getPublicPushConfig } from "@/lib/push/pushDelivery";

/** Public Web Push configuration: only whether push is enabled and the VAPID public key. */
export async function GET() {
  const config = await getPublicPushConfig();
  return NextResponse.json({ enabled: config.enabled, publicKey: config.publicKey }, { headers: { "Cache-Control": "no-store" } });
}

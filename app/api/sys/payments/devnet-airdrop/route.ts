import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { getRailConfig } from "@/lib/payments/paymentRail";
import { BASE58_ADDRESS } from "@/lib/payments/solana";
import { DevnetRpc } from "@/lib/payments/solanaTx";

/**
 * POST /api/sys/payments/devnet-airdrop  { address, lamports }  (platform operator, staging only)
 * Requests DEVNET test SOL (requestAirdrop) for a public address through the configured devnet RPC,
 * which only this Worker can reach. The endpoint must first prove it is devnet (genesis hash); the
 * amount is capped at 1 SOL per call. Mints nothing of value, signs nothing, never returns the endpoint.
 */
const MAX_LAMPORTS = 1_000_000_000;
const scrub = (message: string) => message.replace(/https?:\/\/\S+/g, "<endpoint>").slice(0, 200);

export async function POST(request: Request) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  if (!(await createStagingSettlementClient())) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { address?: unknown; lamports?: unknown };
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const lamports = typeof body.lamports === "number" && Number.isInteger(body.lamports) ? body.lamports : 0;
  if (!BASE58_ADDRESS.test(address) || lamports <= 0 || lamports > MAX_LAMPORTS) return NextResponse.json({ success: false, code: "INVALID_REQUEST" }, { status: 400 });
  const rail = await getRailConfig();
  if (!rail) return NextResponse.json({ success: false, code: "RAIL_NOT_CONFIGURED" }, { status: 503 });
  const rpc = new DevnetRpc(rail.rpcUrl);
  try {
    await rpc.assertDevnet();
    const signature = await rpc.call<string>("requestAirdrop", [address, lamports, { commitment: "confirmed" }]);
    return NextResponse.json({ success: true, address, lamports, signature }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, code: "AIRDROP_FAILED", error: scrub(error instanceof Error ? `${error.name}: ${error.message}` : "ERROR") }, { headers: { "Cache-Control": "no-store" } });
  }
}

import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";
import { getRailConfig } from "@/lib/payments/paymentRail";
import { BASE58_ADDRESS, DEVNET_GENESIS_HASH, MAINNET_GENESIS_HASH, NATIVE_USDC_MINT, assertDevnetEndpoint } from "@/lib/payments/solana";
import { DevnetRpc, associatedTokenAddress, prepareUsdcTransfer } from "@/lib/payments/solanaTx";

/**
 * POST /api/sys/payments/rpc-health  { addresses?: string[] }  (platform operator, staging only)
 * Read-only check of the configured devnet RPC FROM INSIDE the Worker: reachability, version, latest
 * blockhash, block height, network identity (genesis hash), the mint allow-list and the mainnet
 * guards; optional public-address balances (SOL + devnet USDC) for funding checks. Never signs,
 * never sends, and never returns or logs the endpoint (it may carry an API key).
 */
const scrub = (message: string) => message.replace(/https?:\/\/\S+/g, "<endpoint>").slice(0, 160);

async function step<T>(run: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try { return { ok: true, value: await run() }; } catch (error) { return { ok: false, error: scrub(error instanceof Error ? `${error.name}: ${error.message}` : "ERROR") }; }
}

export async function POST(request: Request) {
  const actor = await authorizePlatformOperator(request);
  if (!actor) return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  if (!(await createStagingSettlementClient())) return NextResponse.json({ success: false, code: "STAGING_ONLY" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { addresses?: unknown };
  const addresses = Array.isArray(body.addresses) ? body.addresses.filter((a): a is string => typeof a === "string" && BASE58_ADDRESS.test(a)).slice(0, 5) : [];
  const rail = await getRailConfig();
  if (!rail) return NextResponse.json({ success: false, code: "RAIL_NOT_CONFIGURED" }, { headers: { "Cache-Control": "no-store" } });

  const rpc = new DevnetRpc(rail.rpcUrl);
  const genesis = await step(() => rpc.call<string>("getGenesisHash"));
  const network = genesis.ok ? (genesis.value === DEVNET_GENESIS_HASH ? "SOLANA_DEVNET" : genesis.value === MAINNET_GENESIS_HASH ? "MAINNET_REFUSED" : "UNKNOWN_REFUSED") : "UNREACHABLE";
  const devnet = network === "SOLANA_DEVNET";
  // Everything past identity runs only against a proven devnet endpoint.
  const version = devnet ? await step(() => rpc.version()) : null;
  const blockhash = devnet ? await step(() => rpc.latestBlockhashWithHeight()) : null;
  const height = devnet ? await step(() => rpc.finalizedBlockHeight()) : null;
  const balances = devnet ? await Promise.all(addresses.map(async (address) => {
    const sol = await step(() => rpc.lamports(address));
    const usdc = await step(async () => rpc.tokenBaseUnits(await associatedTokenAddress(address, rail.mint)));
    return { address, lamports: sol.ok ? sol.value : null, devnetUsdcBaseUnits: usdc.ok ? usdc.value : null, error: !sol.ok ? sol.error : !usdc.ok ? usdc.error : null };
  })) : [];
  // Guards, exercised in-Worker without any network call that could move value.
  const mainnetUrlRefused = (() => { try { assertDevnetEndpoint("https://api.mainnet-beta.solana.com"); return false; } catch { return true; } })();
  const mainnetMint = await step(() => prepareUsdcTransfer(rpc, { publicKey: rail.recipient, sign: async () => { throw new Error("NEVER_SIGN"); } }, { mint: NATIVE_USDC_MINT["solana-mainnet"], toOwner: rail.recipient, amountBaseUnits: BigInt(1), reference: rail.recipient }));
  const report = {
    network,
    reachable: genesis.ok,
    identityError: genesis.ok ? null : genesis.error,
    version: version?.ok ? version.value : null,
    latestBlockhash: blockhash?.ok ? { ok: true, lastValidBlockHeight: blockhash.value.lastValidBlockHeight } : { ok: false, error: blockhash && !blockhash.ok ? blockhash.error : null },
    finalizedBlockHeight: height?.ok ? height.value : null,
    mint: { configured: rail.mint, allowlisted: rail.mint === NATIVE_USDC_MINT["solana-devnet"] },
    guards: { mainnetUrlRefused, mainnetMintRefusedBeforeSigning: !mainnetMint.ok && /MINT_NOT_ALLOWED/.test(mainnetMint.error) },
    balances,
  };
  const healthy = devnet && !!version?.ok && !!blockhash?.ok && !!height?.ok && report.mint.allowlisted && report.guards.mainnetUrlRefused && report.guards.mainnetMintRefusedBeforeSigning;
  return NextResponse.json({ success: healthy, ...report }, { headers: { "Cache-Control": "no-store" } });
}

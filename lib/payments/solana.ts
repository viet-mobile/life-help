/**
 * Solana rail helpers (native USDC only). Pure functions + a devnet-only JSON-RPC reader.
 *
 * The chain is only the money-movement rail; the LIFE.HELP database is the business ledger.
 * Nothing here holds, derives or accepts private keys, seed phrases or signers.
 * Mainnet is DISABLED: every network / endpoint check refuses it.
 */

export type SolanaNetwork = "solana-devnet" | "solana-mainnet";

/** Native USDC mints (Circle). Any other mint is never accepted as payment. */
export const NATIVE_USDC_MINT: Record<SolanaNetwork, string> = {
  "solana-devnet": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "solana-mainnet": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};
export const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const USDC_DECIMALS = 6;

/** Chain identity: the only trustworthy answer to "which cluster is this endpoint?". */
export const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

export class MainnetDisabledError extends Error {
  constructor() { super("MAINNET_DISABLED"); }
}

/** Only devnet may be used in this phase. */
export function assertNetworkAllowed(network: string): asserts network is "solana-devnet" {
  if (network !== "solana-devnet") throw new MainnetDisabledError();
}

/** An RPC endpoint is accepted only when it is plainly a devnet endpoint over https. */
export function assertDevnetEndpoint(url: string): URL {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || !host.includes("devnet") || /mainnet/.test(host) || /mainnet/.test(parsed.pathname)) throw new MainnetDisabledError();
  return parsed;
}

const ZERO = BigInt(0);
const ONE = BigInt(1);
const HUNDRED = BigInt(100);
const MICRO = BigInt(1000000);

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) { carry += digits[i] << 8; digits[i] = carry % 58; carry = (carry / 58) | 0; }
    while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => B58[d]).join("");
}

/** Solana Pay reference: a fresh random 32-byte public key, used only to find the payment. */
export function newPaymentReference(): string {
  let ref = "";
  while (!BASE58_ADDRESS.test(ref)) ref = base58Encode(crypto.getRandomValues(new Uint8Array(32)));
  return ref;
}

/** Fiat -> USDC base units, always rounded UP (the customer never underpays the fiat amount). */
export function usdcBaseUnits(fiatAmount: number, fxRate: number): bigint {
  if (!(fiatAmount > 0) || !(fxRate > 0)) throw new Error("INVALID_AMOUNT");
  // Work in integer micro-units of fiat (2-decimal amounts) to avoid float drift.
  const fiatCents = BigInt(Math.round(fiatAmount * 100));
  const rateMicros = BigInt(Math.round(fxRate * 1_000_000));
  const numerator = fiatCents * MICRO * MICRO;
  const denominator = rateMicros * HUNDRED;
  return (numerator + denominator - ONE) / denominator;
}

export function formatUsdc(baseUnits: bigint | number | string): string {
  const units = BigInt(baseUnits);
  const whole = units / MICRO;
  const frac = (units % MICRO).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** Solana Pay transfer request URL (the wallet builds the transaction; we never sign). */
export function solanaPayUrl({ recipient, amountBaseUnits, mint, reference, label }: { recipient: string; amountBaseUnits: bigint | number | string; mint: string; reference: string; label: string }): string {
  const params = new URLSearchParams({ amount: formatUsdc(amountBaseUnits), "spl-token": mint, reference, label });
  return `solana:${recipient}?${params.toString()}`;
}

// ---------------------------------------------------------------------------------------------
// Parsed transaction -> observation (what record_payment_observation classifies)
// ---------------------------------------------------------------------------------------------
type TokenBalance = { accountIndex: number; mint: string; owner?: string; programId?: string; uiTokenAmount: { amount: string } };
export type ParsedTransaction = {
  slot?: number;
  meta: { err: unknown; preTokenBalances?: TokenBalance[]; postTokenBalances?: TokenBalance[] } | null;
  transaction: { message: { accountKeys: Array<string | { pubkey: string }> } };
};
export type PaymentObservation = {
  slot: number | null;
  mint: string | null;
  recipient: string | null;
  amountBaseUnits: string;
  referenceMatched: boolean;
  txSuccess: boolean;
};

export function observePayment(tx: ParsedTransaction, expected: { recipient: string; mint: string; reference: string }): PaymentObservation {
  const keys = tx.transaction.message.accountKeys.map((k) => (typeof k === "string" ? k : k.pubkey));
  const pre = new Map<number, TokenBalance>((tx.meta?.preTokenBalances ?? []).map((b) => [b.accountIndex, b]));
  // Positive token-balance deltas per (owner, mint), SPL Token program only.
  const deltas = new Map<string, { owner: string; mint: string; amount: bigint }>();
  for (const post of tx.meta?.postTokenBalances ?? []) {
    if (post.programId && post.programId !== SPL_TOKEN_PROGRAM_ID) continue;
    const before = BigInt(pre.get(post.accountIndex)?.uiTokenAmount.amount ?? "0");
    const delta = BigInt(post.uiTokenAmount.amount) - before;
    if (delta <= ZERO || !post.owner) continue;
    const id = `${post.owner}:${post.mint}`;
    const current = deltas.get(id);
    deltas.set(id, { owner: post.owner, mint: post.mint, amount: (current?.amount ?? ZERO) + delta });
  }
  const credits = [...deltas.values()];
  const exact = credits.find((c) => c.owner === expected.recipient && c.mint === expected.mint);
  const otherMint = credits.find((c) => c.owner === expected.recipient && c.mint !== expected.mint);
  const otherRecipient = credits.find((c) => c.mint === expected.mint && c.owner !== expected.recipient);
  const pick = exact ?? otherMint ?? otherRecipient ?? null;
  return {
    slot: typeof tx.slot === "number" ? tx.slot : null,
    mint: pick?.mint ?? null,
    recipient: pick?.owner ?? null,
    amountBaseUnits: (pick?.amount ?? ZERO).toString(),
    referenceMatched: keys.includes(expected.reference),
    txSuccess: tx.meta !== null && tx.meta.err === null,
  };
}

/** Devnet JSON-RPC reader: finalized first, then confirmed. Never mainnet, never signs. */
export async function fetchDevnetTransaction(rpcUrl: string, signature: string, fetchImpl: typeof fetch = fetch): Promise<{ tx: ParsedTransaction; confirmation: "finalized" | "confirmed" } | null> {
  const endpoint = assertDevnetEndpoint(rpcUrl);
  // Network identity first: whatever the URL claims, only the devnet genesis hash may be trusted.
  const genesis = await fetchImpl(endpoint.toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getGenesisHash" }) });
  const genesisBody = await genesis.json().catch(() => null) as { result?: string } | null;
  if (genesisBody?.result !== DEVNET_GENESIS_HASH) throw new MainnetDisabledError();
  for (const commitment of ["finalized", "confirmed"] as const) {
    const response = await fetchImpl(endpoint.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: [signature, { encoding: "jsonParsed", commitment, maxSupportedTransactionVersion: 0 }] }),
    });
    const body = await response.json().catch(() => null) as { result?: ParsedTransaction | null } | null;
    if (body?.result) return { tx: body.result, confirmation: commitment };
  }
  return null;
}

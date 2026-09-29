/**
 * Server-side display masking for payout destinations in operator surfaces (least exposure). The raw value
 * stays in the ledger only; review APIs return this masked form and never the original.
 *
 * The style is chosen from the LEDGER network, never guessed from the string:
 *   chain networks (solana-*)  wallet address       -> "ABCD…WXYZ"   (first 4 + last 4; public-key shaped)
 *   anything else              opaque recipient id  -> "••••••1234"   (provider payee tokens / future recipients)
 * Short values are masked almost entirely. Deterministic; null / empty -> null.
 */
const CHAIN_NETWORK = /^solana-(devnet|mainnet)$/;
const MASK = "••••••";

export function maskDestination(destination: string | null | undefined, network: string | null | undefined): string | null {
  if (typeof destination !== "string") return null;
  const value = destination.trim();
  if (!value) return null;
  if (CHAIN_NETWORK.test(String(network ?? "")) && value.length >= 16) return `${value.slice(0, 4)}…${value.slice(-4)}`;
  if (value.length >= 12) return `${MASK}${value.slice(-4)}`;
  if (value.length >= 8) return `${MASK}${value.slice(-2)}`;
  return MASK;
}

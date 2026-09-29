/**
 * Server-side display masking for payout destinations AND payment receiving wallets in operator surfaces
 * (least exposure). The raw value stays in the ledger (and in every server-side comparison) only; review APIs
 * return this masked form and never the original.
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

/**
 * Display masking for opaque INTERNAL / PROVIDER identifiers in operator surfaces (provider object references,
 * operator ids, internal ids without a public mapping). A short provider-style prefix ("pi_", "tr_", "lh_") is
 * kept for correlation; the body is masked, keeping at most the last 4 characters (2 for 8-11 characters,
 * none below 8). Deterministic; never used for any decision; null / empty -> null.
 */
const REF_PREFIX = /^([A-Za-z]{2,5}_)/;
export function maskReference(reference: string | null | undefined): string | null {
  if (typeof reference !== "string") return null;
  const value = reference.trim();
  if (!value) return null;
  const prefix = value.match(REF_PREFIX)?.[1] ?? "";
  const body = value.slice(prefix.length);
  if (body.length >= 12) return `${prefix}${MASK}${body.slice(-4)}`;
  if (body.length >= 8) return `${prefix}${MASK}${body.slice(-2)}`;
  return `${prefix}${MASK}`;
}

const PROVIDER_NETWORK = /^provider:/;
/**
 * An attempt's external id for DISPLAY: on provider networks it is the LIFE.HELP idempotency key ("lh_...", also
 * the provider object reference) -> masked with its prefix ("lh_••••••A1B2"). On chain networks it is the public
 * transaction signature (reconciliation evidence, like any on-chain signature) -> unchanged.
 */
export function maskAttemptKey(externalId: string | null | undefined, network: string | null | undefined): string | null {
  if (typeof externalId !== "string" || !externalId) return null;
  return PROVIDER_NETWORK.test(String(network ?? "")) ? maskReference(externalId) : externalId;
}

/** A provider-hosted payment's evidence ("provider:CODE:<provider payment id>") with the provider id masked. */
export function maskProviderEvidence(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !value) return null;
  const m = value.match(/^(provider:[A-Z][A-Z0-9_]{1,39}:)(.+)$/);
  return m ? `${m[1]}${maskReference(m[2])}` : value;
}

/**
 * Minimal Solana transaction toolkit for the STAGING DEVNET rail (no external SDK: every guard is ours).
 *
 *   - base58, SHA-256 PDA / associated-token-account derivation (ed25519 on-curve check)
 *   - legacy message compilation + serialization, Ed25519 signing via WebCrypto
 *   - SPL Token TransferChecked + idempotent ATA creation + System transfer instructions
 *   - a devnet-only JSON-RPC client that verifies the DEVNET genesis hash before anything is signed
 *     or sent (a mainnet / unknown cluster is refused even if an endpoint variable is changed)
 *
 * Nothing here decides business amounts: callers pass amounts computed by the LIFE.HELP ledger.
 */
import { BASE58_ADDRESS, MainnetDisabledError, NATIVE_USDC_MINT, SPL_TOKEN_PROGRAM_ID, USDC_DECIMALS, assertDevnetEndpoint, base58Encode } from "@/lib/payments/solana";

export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58Decode(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of value) {
    let carry = B58.indexOf(char);
    if (carry < 0) throw new Error("INVALID_BASE58");
    for (let i = 0; i < bytes.length; i += 1) { carry += bytes[i] * 58; bytes[i] = carry & 0xff; carry >>= 8; }
    while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  for (const char of value) { if (char !== "1") break; bytes.push(0); }
  return new Uint8Array(bytes.reverse());
}
export const publicKeyBytes = (address: string): Uint8Array => {
  const bytes = base58Decode(address);
  if (bytes.length !== 32) throw new Error("INVALID_PUBLIC_KEY");
  return bytes;
};

const concat = (...parts: Uint8Array[]) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
const sha256 = async (data: Uint8Array) => new Uint8Array(await crypto.subtle.digest("SHA-256", data as BufferSource));

// ---------------------------------------------------------------------------------------------
// ed25519 on-curve check (for program-derived addresses: a PDA must NOT be on the curve)
// ---------------------------------------------------------------------------------------------
const P = BigInt(2) ** BigInt(255) - BigInt(19);
const mod = (a: bigint) => ((a % P) + P) % P;
const pow = (base: bigint, exp: bigint) => { let r = BigInt(1), b = mod(base), e = exp; while (e > BigInt(0)) { if (e & BigInt(1)) r = mod(r * b); b = mod(b * b); e >>= BigInt(1); } return r; };
const D = mod(-BigInt(121665) * pow(BigInt(121666), P - BigInt(2)));
export function isOnCurve(bytes: Uint8Array): boolean {
  const copy = bytes.slice();
  const sign = copy[31] >> 7;
  copy[31] &= 0x7f;
  let y = BigInt(0);
  for (let i = 31; i >= 0; i -= 1) y = (y << BigInt(8)) + BigInt(copy[i]);
  if (y >= P) return false;
  const y2 = mod(y * y);
  const u = mod(y2 - BigInt(1));
  const v = mod(D * y2 + BigInt(1));
  const x2 = mod(u * pow(v, P - BigInt(2)));
  if (x2 === BigInt(0)) return sign === 0;
  return pow(x2, (P - BigInt(1)) / BigInt(2)) === BigInt(1);
}

export async function findProgramAddress(seeds: Uint8Array[], programId: string): Promise<string> {
  const program = publicKeyBytes(programId);
  const marker = new TextEncoder().encode("ProgramDerivedAddress");
  for (let bump = 255; bump >= 0; bump -= 1) {
    const hash = await sha256(concat(...seeds, new Uint8Array([bump]), program, marker));
    if (!isOnCurve(hash)) return base58Encode(hash);
  }
  throw new Error("NO_PROGRAM_ADDRESS");
}

export const associatedTokenAddress = (owner: string, mint: string) =>
  findProgramAddress([publicKeyBytes(owner), publicKeyBytes(SPL_TOKEN_PROGRAM_ID), publicKeyBytes(mint)], ASSOCIATED_TOKEN_PROGRAM_ID);

/** Deterministic transfer reference (a 32-byte key found in the transaction; not a signer). */
export async function transferReference(purpose: string, id: string): Promise<string> {
  let seed = new TextEncoder().encode(`life.help/${purpose}/v1:${id}`);
  for (;;) { const ref = base58Encode(await sha256(seed)); if (BASE58_ADDRESS.test(ref)) return ref; seed = concat(seed, new Uint8Array([0])); }
}

// ---------------------------------------------------------------------------------------------
// Instructions + legacy message
// ---------------------------------------------------------------------------------------------
export type AccountMeta = { pubkey: string; isSigner: boolean; isWritable: boolean };
export type Instruction = { programId: string; keys: AccountMeta[]; data: Uint8Array };

const u64 = (value: bigint) => { const out = new Uint8Array(8); let v = value; for (let i = 0; i < 8; i += 1) { out[i] = Number(v & BigInt(0xff)); v >>= BigInt(8); } return out; };
const shortvec = (n: number) => { const out: number[] = []; let v = n; for (;;) { const b = v & 0x7f; v >>= 7; if (v === 0) { out.push(b); break; } out.push(b | 0x80); } return new Uint8Array(out); };

export function createAtaIdempotentInstruction(payer: string, ata: string, owner: string, mint: string): Instruction {
  return {
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true }, { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false }, { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: SPL_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: new Uint8Array([1]),
  };
}

/** SPL Token TransferChecked; `reference` rides along as a read-only non-signer account (Solana Pay). */
export function transferCheckedInstruction(sourceAta: string, mint: string, destinationAta: string, owner: string, amount: bigint, decimals: number, reference?: string): Instruction {
  const keys: AccountMeta[] = [
    { pubkey: sourceAta, isSigner: false, isWritable: true }, { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: destinationAta, isSigner: false, isWritable: true }, { pubkey: owner, isSigner: true, isWritable: false },
  ];
  if (reference) keys.push({ pubkey: reference, isSigner: false, isWritable: false });
  return { programId: SPL_TOKEN_PROGRAM_ID, keys, data: concat(new Uint8Array([12]), u64(amount), new Uint8Array([decimals])) };
}

export function systemTransferInstruction(from: string, to: string, lamports: bigint): Instruction {
  return { programId: SYSTEM_PROGRAM_ID, keys: [{ pubkey: from, isSigner: true, isWritable: true }, { pubkey: to, isSigner: false, isWritable: true }], data: concat(new Uint8Array([2, 0, 0, 0]), u64(lamports)) };
}

export function compileMessage(feePayer: string, instructions: Instruction[], recentBlockhash: string): { message: Uint8Array; signers: string[] } {
  const metas = new Map<string, { isSigner: boolean; isWritable: boolean }>();
  const touch = (pubkey: string, isSigner: boolean, isWritable: boolean) => {
    const m = metas.get(pubkey) ?? { isSigner: false, isWritable: false };
    metas.set(pubkey, { isSigner: m.isSigner || isSigner, isWritable: m.isWritable || isWritable });
  };
  touch(feePayer, true, true);
  for (const ix of instructions) { for (const k of ix.keys) touch(k.pubkey, k.isSigner, k.isWritable); touch(ix.programId, false, false); }
  const all = [...metas.entries()];
  const group = (s: boolean, w: boolean) => all.filter(([k, m]) => k !== feePayer && m.isSigner === s && m.isWritable === w).map(([k]) => k);
  const ordered = [feePayer, ...group(true, true), ...group(true, false), ...group(false, true), ...group(false, false)];
  const signers = ordered.filter((k) => metas.get(k)!.isSigner);
  const readonlySigned = signers.filter((k) => !metas.get(k)!.isWritable).length;
  const readonlyUnsigned = ordered.filter((k) => !metas.get(k)!.isSigner && !metas.get(k)!.isWritable).length;
  const index = new Map(ordered.map((k, i) => [k, i]));
  const compiled = instructions.map((ix) => concat(
    new Uint8Array([index.get(ix.programId)!]),
    shortvec(ix.keys.length), new Uint8Array(ix.keys.map((k) => index.get(k.pubkey)!)),
    shortvec(ix.data.length), ix.data,
  ));
  const message = concat(
    new Uint8Array([signers.length, readonlySigned, readonlyUnsigned]),
    shortvec(ordered.length), ...ordered.map(publicKeyBytes),
    publicKeyBytes(recentBlockhash),
    shortvec(compiled.length), ...compiled,
  );
  return { message, signers };
}

// ---------------------------------------------------------------------------------------------
// Signing (Ed25519, WebCrypto). A signer is created from a 64-byte Solana secret key (base58).
// ---------------------------------------------------------------------------------------------
export type Signer = { publicKey: string; sign: (message: Uint8Array) => Promise<Uint8Array> };

const PKCS8_ED25519_PREFIX = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]);
export async function signerFromSecret(secretBase58: string): Promise<Signer> {
  const secret = base58Decode(secretBase58.trim());
  if (secret.length !== 64) throw new Error("INVALID_SIGNER_SECRET");
  const key = await crypto.subtle.importKey("pkcs8", concat(PKCS8_ED25519_PREFIX, secret.slice(0, 32)) as BufferSource, { name: "Ed25519" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", key) as JsonWebKey;
  const derived = Uint8Array.from(atob((jwk.x ?? "").replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - ((jwk.x ?? "").length % 4)) % 4)), (c) => c.charCodeAt(0));
  const publicKey = base58Encode(secret.slice(32));
  if (base58Encode(derived) !== publicKey) throw new Error("SIGNER_KEY_MISMATCH");
  return { publicKey, sign: async (message) => new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, message as BufferSource)) };
}

export async function signTransaction(message: Uint8Array, requiredSigners: string[], signers: Signer[]): Promise<{ wire: Uint8Array; signature: string }> {
  const signatures: Uint8Array[] = [];
  for (const pk of requiredSigners) {
    const s = signers.find((x) => x.publicKey === pk);
    if (!s) throw new Error("MISSING_SIGNER");
    signatures.push(await s.sign(message));
  }
  return { wire: concat(shortvec(signatures.length), ...signatures, message), signature: base58Encode(signatures[0]) };
}

// ---------------------------------------------------------------------------------------------
// Devnet-only RPC (genesis-hash verified before any signing / sending)
// ---------------------------------------------------------------------------------------------
const RPC_TIMEOUT_MS = 10000;
function toBase64(bytes: Uint8Array): string {
  let binary = ""; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export class DevnetRpc {
  private verified = false;
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  constructor(url: string, fetchImpl: typeof fetch = fetch) {
    this.endpoint = assertDevnetEndpoint(url).toString();
    this.fetchImpl = fetchImpl;
  }
  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    // Bounded: a hung RPC call must never outlive the caller's money-job lease.
    const response = await this.fetchImpl(this.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(RPC_TIMEOUT_MS) });
    if (response.status === 429 || response.status >= 500) throw new Error(`RPC_${method}_HTTP_${response.status}`);
    const body = await response.json() as { result?: T; error?: { message?: string } };
    if (body.error) throw new Error(`RPC_${method}_${body.error.message ?? "ERROR"}`);
    return body.result as T;
  }
  /** Refuses anything but devnet, whatever the endpoint URL claims. */
  async assertDevnet(): Promise<void> {
    if (this.verified) return;
    const genesis = await this.call<string>("getGenesisHash");
    if (genesis !== DEVNET_GENESIS_HASH) throw new MainnetDisabledError();
    this.verified = true;
  }
  async latestBlockhash(): Promise<string> {
    return (await this.latestBlockhashWithHeight()).blockhash;
  }
  /** Blockhash + the last block height at which a transaction using it can still be processed. */
  async latestBlockhashWithHeight(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    const r = await this.call<{ value: { blockhash: string; lastValidBlockHeight: number } }>("getLatestBlockhash", [{ commitment: "finalized" }]);
    return { blockhash: r.value.blockhash, lastValidBlockHeight: Number(r.value.lastValidBlockHeight) };
  }
  /** Current FINALIZED block height (conservative: it lags the tip, so "expired" is never early). */
  async finalizedBlockHeight(): Promise<number> {
    return Number(await this.call<number>("getBlockHeight", [{ commitment: "finalized" }]));
  }
  async send(wire: Uint8Array): Promise<string> {
    return this.sendBase64(toBase64(wire));
  }
  /** Broadcast an already signed transaction (same bytes = same signature: a rebroadcast never pays twice). */
  async sendBase64(signedBase64: string): Promise<string> {
    await this.assertDevnet();
    return this.call<string>("sendTransaction", [signedBase64, { encoding: "base64", preflightCommitment: "confirmed" }]);
  }
  async signaturesFor(address: string, limit = 10): Promise<Array<{ signature: string; err: unknown; confirmationStatus?: string }>> {
    return this.call("getSignaturesForAddress", [address, { limit, commitment: "confirmed" }]);
  }
  async status(signature: string): Promise<{ confirmationStatus?: string; err: unknown } | null> {
    const r = await this.call<{ value: Array<{ confirmationStatus?: string; err: unknown } | null> }>("getSignatureStatuses", [[signature], { searchTransactionHistory: true }]);
    return r.value[0] ?? null;
  }
  async transaction(signature: string, commitment: "finalized" | "confirmed" = "finalized") {
    return this.call<import("@/lib/payments/solana").ParsedTransaction | null>("getTransaction", [signature, { encoding: "jsonParsed", commitment, maxSupportedTransactionVersion: 0 }]);
  }
}

/**
 * Signed native-USDC transfer (devnet only): creates the destination token account if needed,
 * TransferChecked with a reference key, fee paid by the signer. Returns the signature.
 */
export async function sendUsdcTransfer(rpc: DevnetRpc, signer: Signer, opts: { mint: string; toOwner: string; amountBaseUnits: bigint; reference: string }): Promise<string> {
  const prepared = await prepareUsdcTransfer(rpc, signer, opts);
  return rpc.sendBase64(prepared.signedBase64);
}

export type PreparedUsdcTransfer = { signature: string; signedBase64: string; recentBlockhash: string; lastValidBlockHeight: number };

/**
 * Build + sign (never broadcast) a native-USDC transfer. The caller persists the signature and the
 * signed bytes BEFORE broadcasting, so a crash at any point leaves a recoverable attempt: the retry
 * reconciles / rebroadcasts exactly these bytes until lastValidBlockHeight has provably passed.
 */
export async function prepareUsdcTransfer(rpc: DevnetRpc, signer: Signer, opts: { mint: string; toOwner: string; amountBaseUnits: bigint; reference: string }): Promise<PreparedUsdcTransfer> {
  if (opts.mint !== NATIVE_USDC_MINT["solana-devnet"]) throw new Error("MINT_NOT_ALLOWED");
  if (!(opts.amountBaseUnits > BigInt(0))) throw new Error("INVALID_AMOUNT");
  if (!BASE58_ADDRESS.test(opts.toOwner) || !BASE58_ADDRESS.test(opts.reference)) throw new Error("INVALID_ADDRESS");
  await rpc.assertDevnet();
  const source = await associatedTokenAddress(signer.publicKey, opts.mint);
  const destination = await associatedTokenAddress(opts.toOwner, opts.mint);
  const latest = await rpc.latestBlockhashWithHeight();
  const { message, signers } = compileMessage(signer.publicKey, [
    createAtaIdempotentInstruction(signer.publicKey, destination, opts.toOwner, opts.mint),
    transferCheckedInstruction(source, opts.mint, destination, signer.publicKey, opts.amountBaseUnits, USDC_DECIMALS, opts.reference),
  ], latest.blockhash);
  const { wire, signature } = await signTransaction(message, signers, [signer]);
  return { signature, signedBase64: toBase64(wire), recentBlockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight };
}

/** Wait until a signature is finalized (or failed / timed out). */
export async function waitForFinalized(rpc: DevnetRpc, signature: string, timeoutMs = 60000, pollMs = 2000): Promise<"finalized" | "failed" | "timeout"> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const s = await rpc.status(signature).catch(() => null);
    if (s?.err) return "failed";
    if (s?.confirmationStatus === "finalized") return "finalized";
    if (Date.now() > deadline) return "timeout";
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

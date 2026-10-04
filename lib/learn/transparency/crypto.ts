/**
 * Established primitives only, through WebCrypto (Node, Cloudflare Workers and browsers): SHA-256 and Ed25519. Nothing here is invented.
 * Every signed or hashed message carries a DOMAIN SEPARATOR so a signature made for one purpose can never be replayed as another.
 */
const enc = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;
const buf = (b: Uint8Array) => b as unknown as BufferSource;

export const utf8 = (s: string) => enc.encode(s);
export function toHex(b: Uint8Array): string { let s = ""; for (const x of b) s += x.toString(16).padStart(2, "0"); return s; }
export function fromHex(h: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})*$/.test(h)) throw new Error("fromHex: lowercase hex of even length expected");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
export function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0; for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  return new Uint8Array(await subtle().digest("SHA-256", buf(typeof data === "string" ? utf8(data) : data)));
}
export const sha256Hex = async (data: Uint8Array | string) => toHex(await sha256(data));

/** a message to sign / hash = domain separator, NUL, canonical text */
export const domainMessage = (domain: string, text: string) => utf8(`${domain}\u0000${text}`);

export const DOMAINS = {
  event: "life.help/transparency/event/v1",
  batch: "life.help/transparency/batch/v1",
  credential: "life.help/credential/v1",
  manifest: "life.help/assessment-manifest/v1",
  policy: "life.help/scholarship-policy/v1",
  pseudonym: "life.help/pseudonym/v1",
} as const;

export interface Signer { keyId: string; publicKeyHex: string; sign(message: Uint8Array): Promise<string> }
/** publishable verification keys: keyId -> raw Ed25519 public key (hex) */
export type PublicKeys = Record<string, string>;

export async function keyIdOf(publicKeyHex: string): Promise<string> { return (await sha256Hex(fromHex(publicKeyHex))).slice(0, 16); }

/** New Ed25519 key pair. The private key stays inside the returned signer (non-extractable); production signing keys live in a KMS / secret store. */
export async function generateSigner(): Promise<Signer> {
  const pair = (await subtle().generateKey({ name: "Ed25519" }, false, ["sign", "verify"])) as CryptoKeyPair;
  const publicKeyHex = toHex(new Uint8Array(await subtle().exportKey("raw", pair.publicKey)));
  return { keyId: await keyIdOf(publicKeyHex), publicKeyHex, sign: async (m) => toHex(new Uint8Array(await subtle().sign({ name: "Ed25519" }, pair.privateKey, buf(m)))) };
}

export async function verifySignature(publicKeyHex: string, signatureHex: string, message: Uint8Array): Promise<boolean> {
  try {
    if (!/^[0-9a-f]{128}$/.test(signatureHex)) return false;
    const key = await subtle().importKey("raw", buf(fromHex(publicKeyHex)), { name: "Ed25519" }, false, ["verify"]);
    return await subtle().verify({ name: "Ed25519" }, key, buf(fromHex(signatureHex)), buf(message));
  } catch { return false; }
}

/** verifies with the key that `keyId` names; an unknown keyId or a key whose id does not match fails */
export async function verifyWithKeyId(keys: PublicKeys, keyId: string, signatureHex: string, message: Uint8Array): Promise<boolean> {
  const pub = keys[keyId];
  if (!pub || (await keyIdOf(pub)) !== keyId) return false;
  return verifySignature(pub, signatureHex, message);
}

/** HMAC-SHA-256 pseudonym of an internal id: stable for one secret, not reversible without it, no PII inside */
export async function pseudonymize(internalId: string, secret: Uint8Array): Promise<string> {
  const key = await subtle().importKey("raw", buf(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(new Uint8Array(await subtle().sign("HMAC", key, buf(domainMessage(DOMAINS.pseudonym, internalId))))).slice(0, 32);
}

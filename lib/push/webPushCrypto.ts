// Web Push message encryption (RFC 8291, aes128gcm) and VAPID authorization (RFC 8292),
// implemented on WebCrypto so it runs unchanged in Cloudflare Workers and Node tests.
// No imports: this module is pure and is exercised directly by scripts/test_web_push.mjs.

export type PushSubscriptionKeys = { endpoint: string; p256dh: string; auth: string };
export type VapidKeys = { publicKey: string; privateKey: string; subject: string };

const encoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
}

/**
 * Push services a subscription may point at. Anything else is rejected before storage and before
 * sending, so a crafted subscription can never make the Worker POST to an arbitrary URL.
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /^[a-z0-9-]+\.notify\.windows\.com$/];

export function isAllowedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 2048) return false;
  let url: URL;
  try { url = new URL(endpoint); } catch { return false; }
  return url.protocol === "https:" && url.port === "" && url.username === "" && url.password === "" && PUSH_HOSTS.some((pattern) => pattern.test(url.hostname));
}

/** Validates a browser PushSubscription JSON (endpoint + keys) without trusting any other field. */
export function parseSubscription(value: unknown): PushSubscriptionKeys | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const p256dh = record.keys?.p256dh, auth = record.keys?.auth;
  if (!isAllowedPushEndpoint(record.endpoint)) return null;
  if (typeof p256dh !== "string" || !/^[A-Za-z0-9_-]+={0,2}$/.test(p256dh) || typeof auth !== "string" || !/^[A-Za-z0-9_-]+={0,2}$/.test(auth)) return null;
  try {
    const publicKey = base64UrlDecode(p256dh), secret = base64UrlDecode(auth);
    // P-256 uncompressed point and a 16-byte auth secret, as every browser produces.
    if (publicKey.length !== 65 || publicKey[0] !== 4 || secret.length !== 16) return null;
  } catch { return null; }
  return { endpoint: record.endpoint, p256dh, auth };
}

/** RFC 8291 aes128gcm body: salt | rs | idlen | as_public | ciphertext (single record). */
export async function encryptPayload(subscription: PushSubscriptionKeys, plaintext: Uint8Array<ArrayBuffer>, fixed?: { salt?: Uint8Array<ArrayBuffer>; serverKeys?: CryptoKeyPair }): Promise<Uint8Array<ArrayBuffer>> {
  const uaPublic = base64UrlDecode(subscription.p256dh);
  const authSecret = base64UrlDecode(subscription.auth);
  const serverKeys = fixed?.serverKeys ?? (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, serverKeys.privateKey, 256));

  const prkKey = await hmac(authSecret, ecdhSecret);
  const keyInfo = concat(encoder.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1]));
  const ikm = await hmac(prkKey, keyInfo);
  const salt = fixed?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(encoder.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(encoder.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  // 0x02 = padding delimiter of the final (only) record.
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, concat(plaintext, new Uint8Array([2]))));
  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  return concat(header, asPublic, ciphertext);
}

/** RFC 8292 VAPID header value: "vapid t=<ES256 JWT>, k=<public key>". */
export async function vapidAuthorization(endpoint: string, vapid: VapidKeys, nowSeconds = Math.floor(Date.now() / 1000)): Promise<string> {
  const publicRaw = base64UrlDecode(vapid.publicKey);
  if (publicRaw.length !== 65 || publicRaw[0] !== 4) throw new Error("invalid VAPID public key");
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", d: vapid.privateKey, x: base64UrlEncode(publicRaw.slice(1, 33)), y: base64UrlEncode(publicRaw.slice(33, 65)), ext: false };
  const signingKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = base64UrlEncode(encoder.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: nowSeconds + 12 * 60 * 60, sub: vapid.subject })));
  const signature = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, encoder.encode(`${header}.${claims}`)));
  return `vapid t=${header}.${claims}.${base64UrlEncode(signature)}, k=${vapid.publicKey}`;
}

/** Encrypts and POSTs one message. Returns the push service HTTP status (0 on network failure). */
export async function sendWebPush(subscription: PushSubscriptionKeys, payload: string, vapid: VapidKeys, options: { ttlSeconds?: number; urgency?: "low" | "normal" | "high"; topic?: string } = {}): Promise<number> {
  if (!isAllowedPushEndpoint(subscription.endpoint)) return 400;
  const body = await encryptPayload(subscription, encoder.encode(payload));
  const headers: Record<string, string> = {
    Authorization: await vapidAuthorization(subscription.endpoint, vapid),
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
    TTL: String(options.ttlSeconds ?? 3600),
    Urgency: options.urgency ?? "normal",
  };
  if (options.topic) headers.Topic = options.topic;
  try {
    const response = await fetch(subscription.endpoint, { method: "POST", headers, body, redirect: "manual" });
    return response.status;
  } catch {
    return 0;
  }
}

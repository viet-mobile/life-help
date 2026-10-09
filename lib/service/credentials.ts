/** Opaque credentials. The server keeps only SHA-256 hashes; the raw secret lives in an HttpOnly cookie (or the request link). */
export const CUSTOMER_COOKIE = "lh_c";
export const HELPER_COOKIE = "lh_h";

export function newSecret(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A raw secret has the exact shape newSecret() produces; anything else is treated as "no credential". */
export const isSecret = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function setCookieHeader(name: string, value: string, opts: { maxAgeSec: number; secure: boolean }): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${opts.maxAgeSec}; HttpOnly; SameSite=Lax${opts.secure ? "; Secure" : ""}`;
}
export const clearCookieHeader = (name: string, secure: boolean) => setCookieHeader(name, "", { maxAgeSec: 0, secure });

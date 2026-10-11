/**
 * Small request guards shared by the public JSON/download endpoints that are outside the service-core and learning handlers.
 * The limiter is per Worker isolate (best effort) - Cloudflare WAF rate limiting must back it in production.
 */

const HOST = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

/** life.help or any (multi-level) subdomain of it; never an arbitrary host. */
export function isLifeHelpHost(value: string | null | undefined): boolean {
  const host = (value ?? "").split(":")[0].trim().toLowerCase();
  if (!HOST.test(host) || host.length > 120) return false;
  return host === "life.help" || host.endsWith(".life.help");
}

/** A site-relative path only: starts with one "/", no scheme, no control characters, no backslash. */
export function safeRelativePath(value: string | null | undefined): string {
  const p = (value ?? "/").trim();
  if (!p.startsWith("/") || p.startsWith("//") || p.length > 200) return "/";
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(p) || /^\/[^/?#]*:/.test(p)) return "/";
  return p;
}

/** CSRF defence for browser POSTs: Origin (or Sec-Fetch-Site) must match the host that served the page. */
export function isSameOrigin(request: Request): boolean {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host).toLowerCase();
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === host;
    } catch {
      return false;
    }
  }
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export function createLimiter() {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  /** true when the call is allowed */
  return (key: string, max: number, windowMs: number, now = Date.now()): boolean => {
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
      return true;
    }
    b.count += 1;
    return b.count <= max;
  };
}

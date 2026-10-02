import { allowsLearnPathAccess } from "@/lib/env";
import { parseLearnHost } from "../hosts";
import { LearnError } from "./errors";

const MAX_BODY_BYTES = 64 * 1024;

/**
 * CSRF defence for cookie-authenticated JSON endpoints: browsers always send
 * Origin (or Sec-Fetch-Site) on fetch() POSTs; require it to match this host.
 */
export function assertSameOrigin(request: Request) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  // In production the learning API answers only on the learning hostnames, never on other LIFE.HELP hosts.
  if (!allowsLearnPathAccess() && !parseLearnHost(host)) throw new LearnError("not_found", 404);
  const origin = request.headers.get("origin");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      throw new LearnError("bad_origin", 403);
    }
    if (originHost !== host) throw new LearnError("bad_origin", 403);
    return;
  }
  if (request.headers.get("sec-fetch-site") === "same-origin") return;
  throw new LearnError("bad_origin", 403);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) throw new LearnError("unsupported_media_type", 415);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new LearnError("payload_too_large", 413);
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new LearnError("invalid_json", 400);
  }
}

/* Best-effort per-isolate limiter. Edge/WAF rate limiting should back this in production. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new LearnError("rate_limited", 429);
}

export function errorResponse(err: unknown): Response {
  if (err instanceof LearnError) {
    return Response.json({ error: err.code }, { status: err.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("[learn] unexpected error", err);
  return Response.json({ error: "server_error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

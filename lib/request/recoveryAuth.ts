import "server-only";
import { SYS_SESSION_COOKIE, constantTimeEqual, verifySysSessionToken } from "@/lib/auth/sysSession";

/**
 * Authorization for the orphan-recovery endpoint. Fails closed.
 *
 * Accepted credentials:
 * 1. Operator/scheduler token: "Authorization: Bearer <LIFE_HELP_RECOVERY_TOKEN>". Disabled unless the
 *    server env sets a token of at least 32 characters. Intended for a future Cloudflare cron caller.
 * 2. Existing SYS admin session cookie, verified with the unmodified verifySysSessionToken
 *    (SameSite=strict, so it is not usable cross-site).
 */
export const RECOVERY_TOKEN_MIN_LENGTH = 32;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function authorizeRecoveryRequest(request: Request): Promise<"TOKEN" | "SYS_SESSION" | null> {
  const configuredToken = process.env.LIFE_HELP_RECOVERY_TOKEN;
  const authHeader = request.headers.get("authorization");
  if (configuredToken && configuredToken.length >= RECOVERY_TOKEN_MIN_LENGTH && authHeader?.startsWith("Bearer ")) {
    // Compare fixed-length digests so the comparison leaks neither content nor length.
    const [supplied, expected] = await Promise.all([
      sha256Hex(authHeader.slice("Bearer ".length)),
      sha256Hex(configuredToken),
    ]);
    if (constantTimeEqual(supplied, expected)) return "TOKEN";
  }

  const sessionToken = readCookie(request.headers.get("cookie"), SYS_SESSION_COOKIE);
  if (sessionToken) {
    try {
      if (await verifySysSessionToken(sessionToken)) return "SYS_SESSION";
    } catch {
      // Cloudflare context unavailable or misconfigured: deny.
    }
  }
  return null;
}

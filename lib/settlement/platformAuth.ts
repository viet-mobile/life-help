import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SYS_SESSION_COOKIE, constantTimeEqual, verifySysSessionToken } from "@/lib/auth/sysSession";
import { createRuntimeServiceRoleClient, getRuntimeServiceRoleConfig } from "@/lib/supabase/serviceRole";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Platform-operator authority for financial lifecycle operations (PAYMENT_PENDING, SETTLED, CLOSED)
 * and settled-conversation cleanup. Fails closed.
 *
 * Accepted credentials:
 * 1. SYS admin session cookie (verified by the unmodified verifySysSessionToken).
 * 2. "Authorization: Bearer <LIFE_HELP_SETTLEMENT_TOKEN>" — a dedicated platform operator token.
 *    Disabled unless the Worker env sets a token of at least 32 characters.
 *
 * Helper Supabase JWTs, customer request/conversation capabilities and public 8-letter
 * LIFE.HELP IDs are never accepted here.
 */
export type PlatformActor = "SYS_SESSION" | "PLATFORM_TOKEN";

export const SETTLEMENT_TOKEN_MIN_LENGTH = 32;
const STAGING_REF: string = "wreebowcbiymodswajwe";
const PRODUCTION_REF: string = "wstdbymmkrqgtsibhcjz";

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

async function configuredSettlementToken(): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as Record<string, string | undefined>).LIFE_HELP_SETTLEMENT_TOKEN;
    if (value) return value;
  } catch {
    // Fall through to process.env.
  }
  return process.env.LIFE_HELP_SETTLEMENT_TOKEN;
}

export async function authorizePlatformOperator(request: Request): Promise<PlatformActor | null> {
  const configuredToken = await configuredSettlementToken();
  const authHeader = request.headers.get("authorization");
  if (configuredToken && configuredToken.length >= SETTLEMENT_TOKEN_MIN_LENGTH && authHeader?.startsWith("Bearer ")) {
    // Compare fixed-length digests so the comparison leaks neither content nor length.
    const [supplied, expected] = await Promise.all([sha256Hex(authHeader.slice("Bearer ".length)), sha256Hex(configuredToken)]);
    if (constantTimeEqual(supplied, expected)) return "PLATFORM_TOKEN";
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

/**
 * No real payment provider is connected, so internal settlement confirmation is restricted
 * to the staging Supabase project. Returns null outside staging.
 */
export async function createStagingSettlementClient(): Promise<SupabaseClient | null> {
  const config = await getRuntimeServiceRoleConfig();
  const ref = config?.url.match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1];
  if (!config || ref !== STAGING_REF || ref === PRODUCTION_REF) return null;
  return createRuntimeServiceRoleClient();
}

import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeRuntimeUrl(value: string): string {
  return value.trim().replace(/^(["'])(.*)\1$/, "$2").replace(/\/$/, "");
}

/**
 * Server-only Supabase client authenticated with the service_role key.
 *
 * The Phase 1 core tables and match_and_assign_helper RPC are sealed to service_role,
 * so customer request creation must go through this client from a Route Handler.
 * The key is SUPABASE_SECRET_KEY (new API keys) with SUPABASE_SERVICE_ROLE_KEY as the legacy fallback; this
 * module is the ONLY place that resolves it.
 * Never import this module from a Client Component; the "server-only" import makes
 * such an import a build error. The key is read at request time and never logged.
 *
 * Returns null when the server environment is not configured.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) return null;

  const url = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function createRuntimeServiceRoleClient(): Promise<SupabaseClient | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const runtimeEnv = env as Record<string, string | undefined>;
    const rawUrl = runtimeEnv.SUPABASE_URL || runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = runtimeEnv.SUPABASE_SECRET_KEY || runtimeEnv.SUPABASE_SERVICE_ROLE_KEY;
    if (!rawUrl || !serviceRoleKey) return null;
    return createClient(normalizeRuntimeUrl(rawUrl).replace(/\/rest\/v1\/?$/, ""), serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch {
    return null;
  }
}

export async function getRuntimeServiceRoleConfig(): Promise<{ url: string; key: string } | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const runtimeEnv = env as Record<string, string | undefined>;
    const url = runtimeEnv.SUPABASE_URL;
    const key = runtimeEnv.SUPABASE_SECRET_KEY || runtimeEnv.SUPABASE_SERVICE_ROLE_KEY;
    return url && key ? { url: normalizeRuntimeUrl(url).replace(/\/rest\/v1\/?$/, ""), key } : null;
  } catch {
    return null;
  }
}

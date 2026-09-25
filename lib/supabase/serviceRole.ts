import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client authenticated with the service_role key.
 *
 * The Phase 1 core tables and match_and_assign_helper RPC are sealed to service_role,
 * so customer request creation must go through this client from a Route Handler.
 * Never import this module from a Client Component; the "server-only" import makes
 * such an import a build error. The key is read at request time and never logged.
 *
 * Returns null when the server environment is not configured.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) return null;

  const url = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

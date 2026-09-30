import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY: bypasses RLS, so callers must authorise
 * the user themselves. Never import from a client component.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !key) return null;
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

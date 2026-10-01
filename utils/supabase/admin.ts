import "server-only";
import { createClient } from "@supabase/supabase-js";
import { resolveSecretKey } from "@/lib/supabase/keys";

/**
 * Secret-key client. SERVER ONLY: bypasses RLS, so callers must authorise the user
 * themselves. `server-only` makes any client-component import a build error.
 * Uses SUPABASE_SECRET_KEY (new) with SUPABASE_SERVICE_ROLE_KEY as a legacy fallback.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = resolveSecretKey();
  if (!rawUrl || !key) return null;
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

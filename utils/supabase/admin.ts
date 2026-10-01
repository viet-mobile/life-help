import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * Secret-key client for the learning platform. SERVER ONLY: bypasses RLS, so callers must authorise the user
 * themselves. It is main's service-role client (lib/supabase/serviceRole.ts), so the key is resolved in one place:
 * SUPABASE_SECRET_KEY (new) with the legacy service-role name as fallback.
 */
export function createAdminClient() {
  return createServiceRoleClient();
}

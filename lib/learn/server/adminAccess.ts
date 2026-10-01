import type { User } from "@supabase/supabase-js";
import { getUserRole } from "@/lib/auth/roles";

/**
 * Staff gate for the learning content console. The role comes from the verified
 * Supabase user's `app_metadata` (writable only with the service role), never from
 * `user_metadata` or any cookie/body the browser controls.
 */
export function canAdminister(user: User | null): boolean {
  if (!user || user.is_anonymous) return false;
  const role = getUserRole(user);
  return role === "ADMIN" || role === "STAFF";
}

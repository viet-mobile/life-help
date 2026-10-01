import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Staff gate for the learning content console.
 *
 * The source of truth is the learning platform's own table `public.learn_staff_users` (migration 202609300026), looked up
 * for the VERIFIED Supabase user id (from auth.getUser(), never from a cookie or body the browser controls). Marketplace
 * roles and anything in the user's metadata (app_metadata / user_metadata) are NOT consulted: they are not the learning
 * platform's authorization model. The lookup uses the server key, which can only READ that table; nobody can become staff
 * through the API (the table has no API-role write access), only the database owner grants rows.
 *
 * Fails closed: no client, no user, anonymous session, database error, unknown role -> not staff.
 */
export type LearnStaffRole = "ADMIN" | "EDITOR";
type StaffDb = Pick<SupabaseClient, "from">;

export async function learnStaffRole(db: StaffDb | null, user: User | null): Promise<LearnStaffRole | null> {
  if (!db || !user || user.is_anonymous) return null;
  try {
    const { data, error } = await db.from("learn_staff_users").select("role").eq("user_id", user.id).maybeSingle();
    if (error) return null;
    const role = (data as { role?: unknown } | null)?.role;
    return role === "ADMIN" || role === "EDITOR" ? role : null;
  } catch {
    return null;
  }
}

export async function isLearnStaff(db: StaffDb | null, user: User | null): Promise<boolean> {
  return (await learnStaffRole(db, user)) !== null;
}

import type { User } from "@supabase/supabase-js";
import { isUserRole, type UserRole } from "@/types/auth";
export function getUserRole(user: User | null): UserRole | null {
  const role = user?.app_metadata.role;
  return isUserRole(role) ? role : null;
}
export function hasRole(user: User | null, allowed: readonly UserRole[]) {
  const role = getUserRole(user);
  return role !== null && allowed.includes(role);
}

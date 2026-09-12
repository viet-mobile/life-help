export const roles = ["CUSTOMER", "TECHNICIAN", "ADMIN", "STAFF"] as const;
export type UserRole = (typeof roles)[number];
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && roles.includes(value as UserRole);
}

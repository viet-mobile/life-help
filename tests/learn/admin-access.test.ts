import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { canAdminister } from "@/lib/learn/server/adminAccess";

const user = (over: Partial<User>) => ({ id: "u", aud: "authenticated", created_at: "", app_metadata: {}, user_metadata: {}, ...over }) as User;

describe("content console authorization", () => {
  it("allows only ADMIN/STAFF from app_metadata", () => {
    expect(canAdminister(user({ app_metadata: { role: "ADMIN" } }))).toBe(true);
    expect(canAdminister(user({ app_metadata: { role: "STAFF" } }))).toBe(true);
    expect(canAdminister(user({ app_metadata: { role: "CUSTOMER" } }))).toBe(false);
    expect(canAdminister(user({ app_metadata: { role: "TECHNICIAN" } }))).toBe(false);
    expect(canAdminister(user({}))).toBe(false);
    expect(canAdminister(null)).toBe(false);
  });
  it("ignores a role a student writes into user_metadata or anonymous sessions", () => {
    expect(canAdminister(user({ user_metadata: { role: "ADMIN" } }))).toBe(false);
    expect(canAdminister(user({ app_metadata: { role: "ADMIN" }, is_anonymous: true }))).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isLearnStaff, learnStaffRole } from "@/lib/learn/server/adminAccess";

const user = (over: Partial<User>) => ({ id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", created_at: "", app_metadata: {}, user_metadata: {}, ...over }) as User;

/** Minimal stand-in for the server client: records the table/filter it was asked for and returns the configured result. */
function fakeDb(result: { data?: unknown; error?: unknown } | "throw") {
  const seen: { table?: string; col?: string; val?: string } = {};
  const db = {
    from(table: string) {
      seen.table = table;
      return {
        select: () => ({
          eq: (col: string, val: string) => {
            seen.col = col; seen.val = val;
            return { maybeSingle: async () => { if (result === "throw") throw new Error("boom"); return { data: result.data ?? null, error: result.error ?? null }; } };
          },
        }),
      };
    },
  };
  return { db: db as never, seen };
}

describe("learning content console authorization (learn_staff_users is the source of truth)", () => {
  it("allows exactly the rows of learn_staff_users with role ADMIN or EDITOR, looked up by the verified user id", async () => {
    for (const role of ["ADMIN", "EDITOR"]) {
      const { db, seen } = fakeDb({ data: { role } });
      expect(await learnStaffRole(db, user({}))).toBe(role);
      expect(await isLearnStaff(db, user({}))).toBe(true);
      expect(seen).toEqual({ table: "learn_staff_users", col: "user_id", val: "11111111-1111-1111-1111-111111111111" });
    }
  });

  it("a user without a learn_staff_users row is not staff, whatever their metadata or marketplace role says", async () => {
    const { db } = fakeDb({ data: null });
    for (const u of [
      user({ app_metadata: { role: "ADMIN" } }), // marketplace-style role in app_metadata
      user({ app_metadata: { role: "STAFF" } }),
      user({ user_metadata: { role: "ADMIN", is_staff: true } }), // writable by the student
      user({ app_metadata: { role: "ADMIN", learn_role: "ADMIN" } }),
    ]) expect(await isLearnStaff(db, u)).toBe(false);
  });

  it("fails closed: no client, no user, anonymous session, database error, thrown error, unknown role", async () => {
    expect(await isLearnStaff(null, user({}))).toBe(false);
    expect(await isLearnStaff(fakeDb({ data: { role: "ADMIN" } }).db, null)).toBe(false);
    expect(await isLearnStaff(fakeDb({ data: { role: "ADMIN" } }).db, user({ is_anonymous: true }))).toBe(false);
    expect(await isLearnStaff(fakeDb({ error: { message: "permission denied" } }).db, user({}))).toBe(false);
    expect(await isLearnStaff(fakeDb("throw").db, user({}))).toBe(false);
    for (const role of ["STAFF", "CUSTOMER", "admin", "OWNER", "", null, 1]) expect(await isLearnStaff(fakeDb({ data: { role } }).db, user({})), String(role)).toBe(false);
  });

  it("the module never reads app_metadata / user_metadata and does not import the marketplace role model", () => {
    const src = readFileSync(path.join(__dirname, "../../lib/learn/server/adminAccess.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(src).not.toMatch(/app_metadata|user_metadata|lib\/auth\/roles|types\/auth|getUserRole|hasRole/);
  });

  it("the admin page uses the staff table lookup (not canAdminister / app_metadata)", () => {
    const page = readFileSync(path.join(__dirname, "../../app/study/[site]/(admin)/admin/page.tsx"), "utf8");
    expect(page).toContain("isLearnStaff");
    expect(page).not.toMatch(/canAdminister|app_metadata/);
  });
});

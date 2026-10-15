/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createChainDb } from "./chainDb";

/** Migration 044 widens the Korean level limit from K1..K6 to K1..K10 and nothing else (real migration chain on local PGlite). */
let db: PGlite;
const USER = "00000000-0000-4000-8000-0000000000bb";
beforeAll(async () => {
  db = await createChainDb();
  await db.exec(`insert into auth.users (id, email) values ('${USER}', 'k10@example.test') on conflict do nothing`);
});
afterAll(async () => { await db.close(); });
const asRole = async (role: string, sql: string, params: unknown[] = []) => {
  await db.exec(`set role ${role}`);
  try { return await db.query<any>(sql, params); } finally { await db.exec("reset role"); }
};

describe("migration 044: Korean levels K7..K10 for accounts", () => {
  it("service_role can store every level K1..K10, and the stored level reads back", async () => {
    for (const lv of ["K1", "K6", "K7", "K8", "K9", "K10"]) {
      await asRole("service_role", "select public.learn_set_course_level($1, 'korean', $2)", [USER, lv]);
      const r = await db.query<any>("select level from public.learn_progress_meta where user_id = $1 and site = 'korean'", [USER]);
      expect(r.rows[0].level).toBe(lv);
    }
  });
  it("rejects K11, K0, a non-Korean site, and lowercase", async () => {
    for (const lv of ["K11", "K0", "k7", "E3"]) await expect(asRole("service_role", "select public.learn_set_course_level($1, 'korean', $2)", [USER, lv])).rejects.toThrow();
    await expect(asRole("service_role", "select public.learn_set_course_level($1, 'math', 'K7')", [USER])).rejects.toThrow();
  });
  it("the table check also rejects a bad level written directly, and a non-Korean row with a level", async () => {
    await expect(db.exec(`update public.learn_progress_meta set level = 'K11' where user_id = '${USER}'`)).rejects.toThrow();
    await expect(db.exec(`insert into public.learn_progress_meta(user_id, site, level) values ('${USER}', 'math', 'K7')`)).rejects.toThrow();
  });
  it("anon and authenticated still cannot execute the function (service_role only)", async () => {
    for (const role of ["anon", "authenticated"]) await expect(asRole(role, "select public.learn_set_course_level($1, 'korean', 'K7')", [USER])).rejects.toThrow();
  });
  it("learn_courses accepts K7..K10 grades and still rejects K11", async () => {
    const def = (await db.query<any>("select pg_get_constraintdef(c.oid) as d from pg_constraint c where c.conrelid = 'public.learn_courses'::regclass and c.conname = 'learn_courses_grade_check'")).rows[0].d as string;
    for (const lv of ["K1", "K6", "K7", "K8", "K9", "K10", "E1", "H3"]) expect(def).toContain(`'${lv}'`);
    expect(def).not.toContain("K11");
  });
});

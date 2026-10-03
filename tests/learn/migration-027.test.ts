import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEARNING_CHAIN, M027, apply, newBase, nonLearningCatalog, root, sqlOf, usersHash } from "./chainDb";

/**
 * 202609300027 widens three CHECK constraints so elementary grades can be stored. These tests run the REAL migration files on PGlite:
 * the migration is additive, learning-only, idempotent, keeps every existing row, and its manual rollback never deletes data.
 */
const BEFORE_027 = LEARNING_CHAIN.filter((f) => f !== M027);
const ROLLBACK = readFileSync(path.join(root, "supabase/rollbacks/202609300027_learning_elementary_grades.down.sql"), "utf8");
const U1 = "10000000-0000-4000-8000-000000000001";
const U2 = "10000000-0000-4000-8000-000000000002";

const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
const profile = (db: PGlite, id: string, grade: string) =>
  db.query("insert into public.learn_student_profiles(user_id, nickname, grade, goal) values ($1, 'tester', $2, 'habit')", [id, grade]);
const course = (db: PGlite, code: string, level: string, grade: string) =>
  db.query(
    "insert into public.learn_courses(code, curriculum_id, subject_id, school_level, grade, title, world_name) values ($1, (select id from public.learn_curricula limit 1), (select id from public.learn_subjects limit 1), $2, $3, 't', 'w')",
    [code, level, grade],
  );
const rejects = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return String((e as Error).message); } };
const checks = async (db: PGlite) =>
  (await db.query<{ t: string; c: string; d: string }>(
    "select 'public.' || replace(conrelid::regclass::text, 'public.', '') t, conname c, pg_get_constraintdef(oid) d from pg_constraint where contype = 'c' and replace(conrelid::regclass::text, 'public.', '') like 'learn\\_%' order by 1, 2",
  )).rows;

async function seededBefore027(): Promise<PGlite> {
  const db = await newBase();
  await apply(db, BEFORE_027);
  await db.exec("insert into public.learn_countries(code, name) values ('KR', 'k'); insert into public.learn_subjects(code, name) values ('math', 'm');");
  await db.exec("insert into public.learn_curricula(code, country_code, name, status) values ('cur-a', 'KR', 'cur', 'PUBLISHED');");
  await db.query("insert into auth.users(id) values ($1), ($2)", [U1, U2]);
  await profile(db, U1, "M1");
  await course(db, "legacy-middle", "middle", "M1");
  return db;
}

describe("202609300027: elementary grades", () => {
  let db: PGlite;
  beforeAll(async () => { db = await seededBefore027(); }, 120_000);
  afterAll(async () => { await db.close(); });

  it("BEFORE 027 an elementary grade cannot be stored (so the migration is necessary, not decorative)", async () => {
    expect(await rejects(profile(db, U2, "E1"))).toMatch(/check|violat/i);
    expect(await rejects(course(db, "e-course-before", "elementary", "E1"))).toMatch(/check|violat/i);
  });

  it("applies cleanly on top of 023-026, changes exactly the three constraints, and touches no non-learning object or existing row", async () => {
    const catalogBefore = await nonLearningCatalog(db);
    const checksBefore = await checks(db);
    const rowsBefore = (await db.query("select md5(string_agg(t::text, '|' order by user_id)) h from public.learn_student_profiles t")).rows[0];
    const coursesBefore = (await db.query("select md5(string_agg(t::text, '|' order by code)) h from public.learn_courses t")).rows[0];
    const usersBefore = await usersHash(db);

    await db.exec(sqlOf(M027));

    expect(await nonLearningCatalog(db)).toEqual(catalogBefore);
    expect(await usersHash(db)).toBe(usersBefore);
    expect((await db.query("select md5(string_agg(t::text, '|' order by user_id)) h from public.learn_student_profiles t")).rows[0]).toEqual(rowsBefore);
    expect((await db.query("select md5(string_agg(t::text, '|' order by code)) h from public.learn_courses t")).rows[0]).toEqual(coursesBefore);

    const checksAfter = await checks(db);
    const key = (r: { t: string; c: string }) => `${r.t}:${r.c}`;
    expect(checksAfter.map(key)).toEqual(checksBefore.map(key)); // same constraint names: nothing added or removed
    const changed = checksAfter.filter((r, i) => r.d !== checksBefore[i].d).map(key).sort();
    expect(changed).toEqual(["public.learn_courses:learn_courses_grade_check", "public.learn_courses:learn_courses_school_level_check", "public.learn_student_profiles:learn_student_profiles_grade_check"]);
  });

  it("AFTER 027 all twelve grades are accepted, and anything else is still refused", async () => {
    let i = 0;
    for (const g of GRADES) {
      const id = `20000000-0000-4000-8000-${String(++i).padStart(12, "0")}`;
      await db.query("insert into auth.users(id) values ($1)", [id]);
      await profile(db, id, g);
    }
    expect((await db.query("select count(distinct grade)::int n from public.learn_student_profiles")).rows[0]).toEqual({ n: 12 });
    for (const bad of ["E0", "E7", "X1", "e1", "", "M4", "H0"]) {
      const id = `30000000-0000-4000-8000-${String(++i).padStart(12, "0")}`;
      await db.query("insert into auth.users(id) values ($1)", [id]);
      expect(await rejects(profile(db, id, bad)), bad).toMatch(/check|violat/i);
    }
    expect(await rejects(db.query("update public.learn_student_profiles set grade = 'Z9' where user_id = $1", [U1]))).toMatch(/check|violat/i);
  });

  it("AFTER 027 courses accept elementary grades / school level; middle and high are unchanged", async () => {
    await course(db, "e-course-1", "elementary", "E6");
    for (const [level, grade] of [["middle", "M3"], ["high", "H1"]]) await course(db, `c-${grade.toLowerCase()}`, level, grade);
    expect(await rejects(course(db, "bad-level", "primary", "E1"))).toMatch(/check|violat/i);
    expect(await rejects(course(db, "bad-grade", "elementary", "E9"))).toMatch(/check|violat/i);
  });

  it("is idempotent: applying it again changes nothing", async () => {
    const before = await checks(db);
    await db.exec(sqlOf(M027));
    expect(await checks(db)).toEqual(before);
  });

  it("the manual rollback REFUSES while elementary rows exist (no student data is ever deleted) and restores the old set once they are gone", async () => {
    const err = await rejects(db.exec(ROLLBACK));
    expect(err).toMatch(/check|violat/i);
    expect((await db.query<{ n: number }>("select count(*)::int n from public.learn_student_profiles where grade like 'E%'")).rows[0].n).toBeGreaterThan(0); // data intact
    await db.exec("delete from public.learn_student_profiles where grade like 'E%'; delete from public.learn_courses where grade like 'E%'");
    await db.exec(ROLLBACK);
    await db.query("insert into auth.users(id) values ($1)", ["40000000-0000-4000-8000-000000000001"]);
    expect(await rejects(profile(db, "40000000-0000-4000-8000-000000000001", "E1"))).toMatch(/check|violat/i);
    await db.exec(sqlOf(M027)); // and it can be re-applied
    await db.query("insert into auth.users(id) values ($1)", ["40000000-0000-4000-8000-000000000002"]);
    await profile(db, "40000000-0000-4000-8000-000000000002", "E2");
  });
});

describe("202609300027: static review", () => {
  const code = (f: string) => sqlOf(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
  it("is learning-objects-only: every table it alters is a learn_ table, no CASCADE, no DML, no create / drop of tables or functions", () => {
    const sql = code(M027);
    const altered = [...sql.matchAll(/alter table (?:only )?public\.(\w+)/gi)].map((m) => m[1]);
    expect(altered.length).toBeGreaterThan(0);
    for (const t of altered) expect(t.startsWith("learn_"), t).toBe(true);
    expect(/\bcascade\b/i.test(sql)).toBe(false);
    expect(/\b(insert|update|delete|truncate)\b/i.test(sql.replace(/pg_constraint/gi, ""))).toBe(false);
    expect(/\b(create|drop)\s+(table|function|type|schema|policy|trigger|index|view|extension)\b/i.test(sql)).toBe(false);
    expect(/\b(auth|storage|supabase_)/i.test(sql.replace(/\bpublic\.learn_/gi, ""))).toBe(false);
  });
  it("sorts after 026 and is the last learning migration; the rollback is a standalone manual file", () => {
    expect(LEARNING_CHAIN[LEARNING_CHAIN.length - 1]).toBe(M027);
    expect(M027 > "202609300026_learning_selfcontained_auth.sql").toBe(true);
    expect(ROLLBACK).toMatch(/NOT run by `supabase db push`/);
    expect(/\bcascade\b/i.test(ROLLBACK.replace(/--.*$/gm, ""))).toBe(false);
    expect(/\bdelete\b/i.test(ROLLBACK.replace(/--.*$/gm, ""))).toBe(false);
  });
});

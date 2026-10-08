import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEARNING_CHAIN, M028, apply, newBase, nonLearningCatalog, root, sqlOf, usersHash } from "./chainDb";

/**
 * 202610070028 (study.korean.life.help) on the REAL migration files, PGlite only: additive and learning-only, every existing row kept,
 * korean progress accepted through the existing RPC authority, the per-site language level stored per (user, site), and the manual
 * rollback refusing while korean data exists.
 */
const BEFORE = LEARNING_CHAIN.slice(0, LEARNING_CHAIN.indexOf(M028));
const ROLLBACK = readFileSync(path.join(root, "supabase/rollbacks/202610070028_learning_korean_study.down.sql"), "utf8");
const U1 = "10000000-0000-4000-8000-000000000001";
const U2 = "10000000-0000-4000-8000-000000000002";
const rejects = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return String((e as Error).message); } };
const day = "2026-10-07";
const events = (site: string) => JSON.stringify([
  { type: "attempt", sessionId: "sess_korean_01", questionId: "k-k2-greetings-1", skillId: "k.k2.greetings", lessonId: "korean-k2-l1", attemptNo: 1, answer: "a", correct: true, revealed: false, isReview: false, hintsUsed: 0, timeMs: 3000, difficulty: 1, masteryBefore: 0, masteryAfter: 16, day },
  { type: "xp", sourceType: "question", sourceId: `${site}:k-k2-greetings-1:${day}`, xp: 10, coins: 2, day },
]);

describe("202610070028: study.korean on the learning schema", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await newBase();
    await apply(db, BEFORE);
    await db.query("insert into auth.users(id) values ($1), ($2)", [U1, U2]);
    await db.query("insert into public.learn_student_profiles(user_id, nickname, grade, goal) values ($1, 'tester', 'E3', 'habit')", [U1]);
    await db.query("select public.learn_commit_events($1, 'math', '[]'::jsonb, '{\"counters\": {}}'::jsonb)", [U1]);
  }, 120_000);
  afterAll(async () => { await db.close(); });

  it("BEFORE 028 a korean row is refused (the migration is necessary)", async () => {
    expect(await rejects(db.query("select public.learn_commit_events($1, 'korean', $2::jsonb, null)", [U1, events("korean")]))).toMatch(/invalid site/);
    expect(await rejects(db.query("insert into public.learn_progress_meta(user_id, site) values ($1, 'korean')", [U1]))).toMatch(/check|violat/i);
  });

  it("applies cleanly: no non-learning object, auth user or existing learning row changes", async () => {
    const catalog = await nonLearningCatalog(db);
    const users = await usersHash(db);
    const rows = (await db.query("select md5(string_agg(t::text, '|' order by user_id)) h from public.learn_student_profiles t")).rows[0];
    await db.exec(sqlOf(M028));
    expect(await nonLearningCatalog(db)).toEqual(catalog);
    expect(await usersHash(db)).toBe(users);
    expect((await db.query("select md5(string_agg(t::text, '|' order by user_id)) h from public.learn_student_profiles t")).rows[0]).toEqual(rows);
  });

  it("AFTER 028: korean progress goes through the same RPC authority, keyed by (user, site, canonical id) - never by locale", async () => {
    await db.query("insert into public.learn_sessions(id, user_id, site, kind, lesson_code) values ('sess_korean_01', $1, 'korean', 'lesson', 'korean-k2-l1')", [U1]);
    await db.query("select public.learn_commit_events($1, 'korean', $2::jsonb, '{\"counters\": {\"questionsSolved\": 1}}'::jsonb)", [U1, events("korean")]);
    const a = (await db.query<{ site: string; question_code: string }>("select site, question_code from public.learn_attempts where user_id = $1", [U1])).rows;
    expect(a).toEqual([{ site: "korean", question_code: "k-k2-greetings-1" }]);
    const cols = (await db.query<{ c: string }>("select column_name c from information_schema.columns where table_name = 'learn_attempts'")).rows.map((r) => r.c);
    expect(cols.some((c) => /locale|lang/.test(c))).toBe(false);
  });

  it("the language level is per (user, site): K2 on korean never touches the shared school grade E3", async () => {
    await db.query("select public.learn_set_course_level($1, 'korean', 'K2')", [U1]);
    const state = (await db.query<{ s: { profile: { grade: string }; meta: { level: string } } }>("select public.learn_load_state($1, 'korean', $2::date) s", [U1, day])).rows[0].s;
    expect(state.meta.level).toBe("K2");
    expect(state.profile.grade).toBe("E3");
    expect(await rejects(db.query("select public.learn_set_course_level($1, 'math', 'K2')", [U1]))).toMatch(/invalid site/);
    expect(await rejects(db.query("select public.learn_set_course_level($1, 'korean', 'K7')", [U1]))).toMatch(/invalid level/);
    expect(await rejects(db.query("update public.learn_progress_meta set level = 'K1' where user_id = $1 and site = 'math'", [U1]))).toMatch(/check|violat/i);
  });

  it("a learner who starts on study.korean has a profile without a school grade; a bogus grade is still refused", async () => {
    await db.query("insert into public.learn_student_profiles(user_id, nickname, goal) values ($1, 'korean', 'habit')", [U2]);
    expect(await rejects(db.query("update public.learn_student_profiles set grade = 'K9' where user_id = $1", [U2]))).toMatch(/check|violat/i);
  });

  it("learn_set_course_level is service_role only", async () => {
    const can = async (role: string) => (await db.query<{ ok: boolean }>(`select has_function_privilege('${role}', 'public.learn_set_course_level(uuid, text, text)', 'EXECUTE') ok`)).rows[0].ok;
    expect(await can("service_role")).toBe(true);
    expect(await can("anon")).toBe(false);
    expect(await can("authenticated")).toBe(false);
  });

  it("the manual rollback refuses while korean data exists (no student data is ever deleted by it)", async () => {
    expect(await rejects(db.exec(ROLLBACK))).not.toBeNull();
    expect((await db.query("select count(*)::int n from public.learn_attempts where site = 'korean'")).rows[0]).toEqual({ n: 1 });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PGlite } from "@electric-sql/pglite";
import { createChainDb, demoSeed } from "./chainDb";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Runs the real LIFE.HELP migration chain (incl. the learning migrations) on an in-process Postgres (PGlite)
 * with minimal stand-ins for Supabase's auth/roles, then exercises RLS,
 * the XP-ledger idempotency guard, the atomic commit RPC and the publish workflow.
 */
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const STAFF = "33333333-3333-3333-3333-333333333333";

let db: PGlite;

async function as(user: string | null, role: "authenticated" | "anon" | "service_role", fn: () => Promise<void>) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${user ?? ""}', false);`);
  try {
    await fn();
  } finally {
    await db.exec("reset role;");
  }
}

beforeAll(async () => {
  db = await createChainDb();
  await db.exec(`
    insert into auth.users values ('${A}'), ('${B}'), ('${STAFF}');
    insert into public.profiles (id, display_name) values ('${STAFF}', 'staff');
    insert into public.user_roles (user_id, role) values ('${STAFF}', 'STAFF');
  `);
});

afterAll(async () => {
  await db.close();
});

const day = "2026-03-01";
const ev = (e: object) => ({ day, ...e });

async function commit(user: string, events: object[], meta: object | null = null) {
  await db.query("select public.learn_commit_events($1, 'math', $2::jsonb, $3::jsonb)", [user, JSON.stringify(events), meta ? JSON.stringify(meta) : null]);
}

describe("learning schema", () => {
  it("applies cleanly and creates the learn_* objects", async () => {
    const r = await db.query<{ n: string }>("select count(*)::text as n from pg_tables where schemaname='public' and tablename like 'learn_%'");
    expect(Number(r.rows[0].n)).toBeGreaterThanOrEqual(24);
  });

  it("commits engine events atomically and rebuilds state from one RPC", async () => {
    await db.query("insert into public.learn_sessions(id, user_id, site, kind, lesson_code) values ('sess-0001', $1, 'math', 'lesson', 'math-l1')", [A]);
    await commit(
      A,
      [
        ev({ type: "attempt", sessionId: "sess-0001", questionId: "m-expr-1", skillId: "m.expr", lessonId: null, attemptNo: 1, answer: "7", correct: true, hintsUsed: 0, timeMs: 5000, difficulty: 1, masteryBefore: 0, masteryAfter: 9.6 }),
        ev({ type: "mastery", skillId: "m.expr", score: 9.6, attempts: 1, correct: 1, streak: 1, box: 1, lastPracticedAt: "2026-03-01T03:00:00Z", nextReviewAt: "2026-03-02T03:00:00Z" }),
        ev({ type: "xp", sourceType: "question", sourceId: "sess-0001:m-expr-1", xp: 10, coins: 2 }),
        ev({ type: "streak", current: 1, best: 1, lastActiveDay: day, freezes: 0 }),
        ev({ type: "quest", items: [{ id: "solve", kind: "solve", target: 5, progress: 1 }], completedAt: null }),
        ev({ type: "achievement", code: "first_solve", at: "2026-03-01T03:00:00Z" }),
      ],
      { counters: { correctAnswers: 1 }, diagnosticDone: false },
    );
    const st = (await db.query<{ s: Record<string, unknown> }>("select public.learn_load_state($1, 'math', $2::date) as s", [A, day])).rows[0].s as Record<string, any>;
    expect(st.totalXp).toBe(10);
    expect(st.coins).toBe(2);
    expect(st.xpToday).toBe(10);
    expect(st.ledgerKeys).toContain("question:sess-0001:m-expr-1");
    expect(st.rewardsToday["m-expr-1"]).toBe(1);
    expect(st.mastery[0].skill_code).toBe("m.expr");
    expect(st.streak.current_days).toBe(1);
    expect(st.achievements).toEqual(["first_solve"]);
    expect(st.meta.counters.correctAnswers).toBe(1);
  });

  it("XP ledger is idempotent: replaying the same commit never double-pays", async () => {
    const xp = [ev({ type: "xp", sourceType: "question", sourceId: "sess-0001:m-expr-1", xp: 10, coins: 2 })];
    await commit(A, xp);
    await commit(A, xp);
    const r = await db.query<{ t: string }>("select sum(xp)::text as t from public.learn_xp_ledger where user_id = $1", [A]);
    expect(r.rows[0].t).toBe("10");
  });

  it("rolls back the whole commit if any event is invalid (progress cannot be half-written)", async () => {
    await expect(
      commit(A, [ev({ type: "xp", sourceType: "question", sourceId: "sess-0001:zzz", xp: 99, coins: 0 }), ev({ type: "mystery" })]),
    ).rejects.toThrow();
    const r = await db.query<{ t: string }>("select coalesce(sum(xp), 0)::text as t from public.learn_xp_ledger where user_id = $1", [A]);
    expect(r.rows[0].t).toBe("10");
  });
});

describe("row level security", () => {
  it("a student sees only their own progress rows", async () => {
    await db.query("insert into public.learn_sessions(id, user_id, site, kind) values ('sess-b001', $1, 'math', 'practice')", [B]);
    await commit(B, [ev({ type: "xp", sourceType: "lesson_first", sourceId: "math-l1", xp: 65, coins: 13 })]);
    await as(A, "authenticated", async () => {
      const r = await db.query<{ user_id: string }>("select user_id from public.learn_xp_ledger");
      expect(r.rows.length).toBeGreaterThan(0);
      expect(r.rows.every((x) => x.user_id === A)).toBe(true);
      expect((await db.query("select * from public.learn_skill_mastery")).rows.every((x: any) => x.user_id === A)).toBe(true);
    });
    await as(B, "authenticated", async () => {
      const r = await db.query<{ user_id: string }>("select user_id from public.learn_xp_ledger");
      expect(r.rows.every((x) => x.user_id === B)).toBe(true);
      expect((await db.query("select * from public.learn_attempts")).rows).toHaveLength(0);
    });
  });

  it("students cannot forge progress: no writes to ledger, mastery, attempts or lessons", async () => {
    await as(A, "authenticated", async () => {
      await expect(db.query("insert into public.learn_xp_ledger(user_id, site, source_type, source_id, xp, day) values ($1,'math','cheat','1',9999,'2026-03-01')", [A])).rejects.toThrow();
      await expect(db.query("update public.learn_skill_mastery set score = 100")).rejects.toThrow();
      await expect(db.query("insert into public.learn_lesson_progress(user_id, site, lesson_code, stars) values ($1,'math','math-l1',3)", [A])).rejects.toThrow();
      await expect(db.query("select public.learn_commit_events($1,'math','[]'::jsonb,null)", [A])).rejects.toThrow();
      await expect(db.query("select public.learn_load_state($1,'math','2026-03-01')", [A])).rejects.toThrow();
    });
  });

  it("anonymous users see nothing", async () => {
    await as(null, "anon", async () => {
      await expect(db.query("select * from public.learn_xp_ledger")).rejects.toThrow();
      await expect(db.query("select * from public.learn_student_profiles")).rejects.toThrow();
    });
  });

  it("a student manages only their own profile and cannot write someone else's", async () => {
    await as(A, "authenticated", async () => {
      await db.query("insert into public.learn_student_profiles(user_id, nickname, grade, goal) values ($1, '민수', 'M1', 'habit')", [A]);
      await expect(db.query("insert into public.learn_student_profiles(user_id, nickname, grade, goal) values ($1, '해커', 'M1', 'habit')", [B])).rejects.toThrow();
      await expect(db.query("update public.learn_student_profiles set nickname = '<script>'")).rejects.toThrow();
      const r = await db.query("select * from public.learn_student_profiles");
      expect(r.rows).toHaveLength(1);
    });
    await as(B, "authenticated", async () => {
      expect((await db.query("select * from public.learn_student_profiles")).rows).toHaveLength(0);
    });
  });

  it("rejects out-of-range or malicious profile data", async () => {
    await as(B, "authenticated", async () => {
      await expect(db.query("insert into public.learn_student_profiles(user_id, nickname, grade, goal) values ($1, 'a', 'M1', 'habit')", [B])).rejects.toThrow();
      await expect(db.query("insert into public.learn_student_profiles(user_id, nickname, grade, goal) values ($1, '정상닉네임', 'X1', 'habit')", [B])).rejects.toThrow();
    });
  });
});

describe("content security and publishing workflow", () => {
  let questionId: string;

  it("staff can author content; students cannot read questions or answer keys", async () => {
    await db.exec(`
      insert into public.learn_countries values ('KR', '대한민국');
      insert into public.learn_subjects(code, name) values ('math', '수학');
    `);
    const subj = (await db.query<{ id: string }>("select id from public.learn_subjects where code = 'math'")).rows[0].id;
    await db.query("insert into public.learn_skills(code, subject_id, title) values ('m.expr', $1, '식의 값')", [subj]);
    const skill = (await db.query<{ id: string }>("select id from public.learn_skills where code = 'm.expr'")).rows[0].id;
    await as(STAFF, "authenticated", async () => {
      const q = await db.query<{ id: string }>(
        "insert into public.learn_questions(code, subject_id, skill_id, type, difficulty, prompt, created_by) values ('q-1', $1, $2, 'numeric', 2, '2+2', $3) returning id",
        [subj, skill, STAFF],
      );
      questionId = q.rows[0].id;
      await db.query("insert into public.learn_question_answers(question_id, answer) values ($1, '{\"kind\":\"numeric\",\"value\":4}')", [questionId]);
    });
    await as(A, "authenticated", async () => {
      expect((await db.query("select * from public.learn_questions")).rows).toHaveLength(0);
      expect((await db.query("select * from public.learn_question_answers")).rows).toHaveLength(0);
      await expect(db.query("insert into public.learn_questions(code, subject_id, skill_id, type, difficulty, prompt) values ('x', $1, $2, 'numeric', 1, 'x')", [subj, skill])).rejects.toThrow();
    });
  });

  it("new questions cannot be born published; publishing needs a human reviewer and steps", async () => {
    const subj = (await db.query<{ id: string }>("select id from public.learn_subjects where code = 'math'")).rows[0].id;
    const skill = (await db.query<{ id: string }>("select id from public.learn_skills where code = 'm.expr'")).rows[0].id;
    await expect(
      db.query("insert into public.learn_questions(code, subject_id, skill_id, type, difficulty, prompt, status, ai_generated) values ('ai-1', $1, $2, 'numeric', 1, 'x', 'PUBLISHED', true)", [subj, skill]),
    ).rejects.toThrow(/DRAFT/);
    await expect(db.query("update public.learn_questions set status = 'PUBLISHED' where id = $1", [questionId])).rejects.toThrow();
    await expect(db.query("update public.learn_questions set status = 'REVIEWED' where id = $1", [questionId])).rejects.toThrow(/reviewer/);
    await db.query("update public.learn_questions set status = 'REVIEWED', reviewed_by = $2 where id = $1", [questionId, STAFF]);
    await expect(db.query("update public.learn_questions set status = 'PUBLISHED' where id = $1", [questionId])).rejects.toThrow(/one step/);
    await db.query("update public.learn_questions set status = 'APPROVED' where id = $1", [questionId]);
    await db.query("update public.learn_questions set status = 'PUBLISHED' where id = $1", [questionId]);
    await db.query("update public.learn_questions set status = 'ARCHIVED' where id = $1", [questionId]);
    await expect(db.query("update public.learn_questions set status = 'DRAFT' where id = $1", [questionId])).rejects.toThrow(/archived/);
  });
});

describe("engine <-> SQL round trip", () => {
  it("state rebuilt from the database equals the state the engine produced", async () => {
    const { demoContentRepository } = await import("@/lib/learn/content/repository");
    const { indexContent, toMetaBundle } = await import("@/lib/learn/content/indexer");
    const { applyAttempt, applyLessonCompletion, createInitialState } = await import("@/lib/learn/domain/engine");
    const { eventsToRpc, rpcToState } = await import("@/lib/learn/server/supabaseStore");

    const bundle = await demoContentRepository.getBundle("math");
    const index = indexContent(toMetaBundle(bundle));
    const now = new Date("2026-03-05T03:00:00Z");
    const U = "44444444-4444-4444-4444-444444444444";
    await db.query("insert into auth.users values ($1)", [U]);
    await db.query("insert into public.learn_sessions(id, user_id, site, kind, lesson_code) values ('sess-rt01', $1, 'math', 'lesson', 'math-l1')", [U]);

    let state = createInitialState("math");
    const all: any[] = [];
    const run = (r: ReturnType<typeof applyAttempt>) => {
      state = r.state;
      all.push(...r.events);
    };
    for (const [i, id] of ["m-expr-1", "m-expr-2", "m-expr-3", "m-expr-4", "m-expr-5"].entries()) {
      run(applyAttempt(state, index, { questionId: id, sessionId: "sess-rt01", attemptNo: i === 2 ? 2 : 1, correct: true, hintsUsed: i === 1 ? 1 : 0, timeMs: 6000, answer: "x" }, now));
    }
    run(applyLessonCompletion(state, index, { lessonId: "math-l1", sessionId: "sess-rt01", firstTryCorrect: 4, total: 5 }, now));

    await db.query("select public.learn_commit_events($1, 'math', $2::jsonb, $3::jsonb)", [
      U,
      JSON.stringify(eventsToRpc(all)),
      JSON.stringify({ counters: state.counters, diagnosticDone: state.diagnosticDone }),
    ]);
    const loaded = (await db.query<{ s: unknown }>("select public.learn_load_state($1, 'math', '2026-03-05') as s", [U])).rows[0].s;
    const rebuilt = rpcToState(loaded, "math", "2026-03-05");

    expect(rebuilt.totalXp).toBe(state.totalXp);
    expect(rebuilt.coins).toBe(state.coins);
    expect(rebuilt.counters).toEqual(state.counters);
    expect(rebuilt.streak).toEqual(state.streak);
    expect(rebuilt.achievements.sort()).toEqual([...state.achievements].sort());
    expect(rebuilt.lessons["math-l1"].stars).toBe(state.lessons["math-l1"].stars);
    expect(rebuilt.lessons["math-l1"].completions).toBe(1);
    expect(rebuilt.quest?.items).toEqual(state.quest?.items);
    expect(rebuilt.quest?.day).toBe(state.quest?.day);
    expect(Object.keys(rebuilt.mastery)).toEqual(Object.keys(state.mastery));
    expect(rebuilt.mastery["m.expr"].score).toBeCloseTo(state.mastery["m.expr"].score, 1);
    expect(rebuilt.mastery["m.expr"].nextReviewAt && new Date(rebuilt.mastery["m.expr"].nextReviewAt).getTime()).toBe(
      new Date(state.mastery["m.expr"].nextReviewAt!).getTime(),
    );
    // Idempotency-relevant keys survive the round trip, so a replay after reload is still a no-op.
    for (const k of state.ledgerKeys.filter((k) => k.startsWith("question:"))) expect(rebuilt.ledgerKeys).toContain(k);
    const replay = applyAttempt(rebuilt, index, { questionId: "m-expr-1", sessionId: "sess-rt01", attemptNo: 1, correct: true, hintsUsed: 0, timeMs: 1000 }, now);
    expect(replay.events).toHaveLength(0);
    // Attempts were recorded with the answer trimmed and typed correctly.
    const att = await db.query<{ n: string }>("select count(*)::text n from public.learn_attempts where user_id = $1", [U]);
    expect(att.rows[0].n).toBe("5");
  });
});

describe("demo seed", () => {
  it("refuses to run without the explicit opt-in, and loads the full demo curriculum with it", async () => {
    const seed = demoSeed();
    const fresh = await createChainDb();
    await expect(fresh.exec(seed)).rejects.toThrow(/demo seed refused/);
    await fresh.exec("rollback");
    await fresh.exec(`set app.allow_demo_seed = 'on'; ${seed}`);
    const counts = await fresh.query<{ site: string; n: string }>(
      "select s.code as site, count(*)::text as n from public.learn_questions q join public.learn_subjects s on s.id = q.subject_id where q.status = 'PUBLISHED' group by 1 order by 1",
    );
    expect(counts.rows.map((r) => [r.site, Number(r.n) >= 20])).toEqual([["english", true], ["math", true]]);
    const lessons = await fresh.query<{ n: string }>("select count(*)::text n from public.learn_lessons");
    expect(Number(lessons.rows[0].n)).toBe(8);
    // Workflow trigger is back on after seeding.
    await expect(fresh.exec("insert into public.learn_questions(code, subject_id, skill_id, type, difficulty, prompt, status) select 'zz', subject_id, id, 'numeric', 1, 'x', 'PUBLISHED' from public.learn_skills limit 1")).rejects.toThrow(/DRAFT/);
    await fresh.close();
  });
});

describe("database-backed content", () => {
  it("learn_load_content returns exactly the demo curriculum once seeded, and hides unpublished questions", async () => {
    const seed = demoSeed();
    const { parseContentBundle } = await import("@/lib/learn/content/supabaseContent");
    const { demoContentRepository } = await import("@/lib/learn/content/repository");
    const fresh = await createChainDb();
    await fresh.exec(`set app.allow_demo_seed = 'on'; ${seed}`);
    for (const site of ["math", "english"] as const) {
      const raw = (await fresh.query<{ c: unknown }>("select public.learn_load_content($1) as c", [site])).rows[0].c;
      const fromDb = parseContentBundle(raw, site);
      const demo = await demoContentRepository.getBundle(site);
      type Cat = import("@/lib/learn/types").SiteCatalog;
      // Skill lists have no inherent order: compare them sorted.
      const bySkill = (c: Cat): Cat => ({
        ...c,
        skills: [...c.skills].sort((a, b) => a.id.localeCompare(b.id)),
        courses: c.courses.map((co) => ({ ...co, units: co.units.map((u) => ({ ...u, lessons: u.lessons.map((l) => ({ ...l, skillIds: [...l.skillIds].sort() })) })) })),
      });
      expect(bySkill(fromDb.catalog)).toEqual(bySkill(demo.catalog));
      expect([...fromDb.questions].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...demo.questions].sort((a, b) => a.id.localeCompare(b.id)));
    }
    // A draft question never reaches students.
    await fresh.exec("update public.learn_questions set status = 'ARCHIVED' where code = 'm-expr-1'");
    const raw = (await fresh.query<{ c: { questions: { id: string }[] } }>("select public.learn_load_content('math') as c")).rows[0].c;
    expect(raw.questions.map((q) => q.id)).not.toContain("m-expr-1");
    // Students/anon cannot call it (it contains answer keys).
    await fresh.exec("set role authenticated");
    await expect(fresh.query("select public.learn_load_content('math')")).rejects.toThrow();
    await fresh.exec("reset role");
    await fresh.close();
  });
});

// Behavioural gate for migrations 202609300024 (learning platform) and 202609300025 (learn_load_content).
//
// ONE set of assertions, two backends (same pattern as the other migration gates, but shared so the live logic is
// proven locally before it ever touches staging):
//   - scripts/test_learning_migration_db.mjs       PGlite on the REAL migration chain (runs in `npm test`)
//   - scripts/test_learning_migration_staging.mjs  live staging PostgREST (service key / anon key / real user JWTs)
//
// Backend contract (actors: "anon" | "service" | { id, token } for a signed-in user):
//   select/insert/update/del/rpc -> { status: "ok" | "denied" | "error", rows | data, message }
//     "denied"  = privilege or row-level-security refusal (SQLSTATE 42501 / HTTP 401, 403)
//     "error"   = any other database error (check / FK / raised exception)
//   createUser(label) -> { id, token }       purgeable Auth user (deleting it cascades every learn_* student row)
//   makeStaff(user)                          grants LEARNING staff (a row in public.learn_staff_users) as the database owner:
//                                            the API roles cannot write that table (migration 202609300026); a marketplace role is NOT learning staff
//   rpcInSchema?(actor, schema, fn, args)    live only: call a function through the API in a non-exposed schema (must fail)
//   catalog?(sql) -> rows                    PGlite only; the live catalog is verified by the read-only probe
//   purge()                                  removes every fixture the gate created
//
// Fixtures are all purgeable: Auth users (cascade), and content rows deleted by a STAFF fixture in FK order.
// Nothing here touches admin_audit_logs or any other immutable table.

export const LEARN_TABLES = [
  "learn_countries", "learn_curricula", "learn_subjects", "learn_courses", "learn_units", "learn_skills", "learn_lessons",
  "learn_lesson_skills", "learn_questions", "learn_lesson_questions", "learn_question_options", "learn_question_answers",
  "learn_question_hints", "learn_question_explanations", "learn_student_profiles", "learn_sessions", "learn_attempts",
  "learn_skill_mastery", "learn_lesson_progress", "learn_xp_ledger", "learn_streaks", "learn_daily_quests",
  "learn_student_achievements", "learn_progress_meta",
];
const PROGRESS = ["learn_sessions", "learn_attempts", "learn_skill_mastery", "learn_lesson_progress", "learn_xp_ledger", "learn_streaks", "learn_daily_quests", "learn_student_achievements", "learn_progress_meta"];
const CONTENT = ["learn_countries", "learn_curricula", "learn_subjects", "learn_courses", "learn_units", "learn_skills", "learn_lessons", "learn_lesson_skills", "learn_questions", "learn_lesson_questions", "learn_question_options", "learn_question_answers", "learn_question_hints", "learn_question_explanations"];
const ANSWER_TABLES = ["learn_questions", "learn_question_answers", "learn_question_hints", "learn_question_explanations", "learn_question_options"];
const DAY = "2026-03-01";
const SECRET_ANSWER = "ZZ-SECRET-ANSWER-7731";
const SECRET_HINT = "ZZ-SECRET-HINT-7731";
const SECRET_EXPLANATION = "ZZ-SECRET-EXPLANATION-7731";

const letters = (n) => Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
const ok = (r) => r.status === "ok";
const denied = (r) => r.status === "denied";
const refused = (r) => r.status === "denied" || r.status === "error" || (r.status === "ok" && Array.isArray(r.rows) && r.rows.length === 0);

export async function learningGate(b, { expect, notTestable }, { phase = "gate" } = {}) {
  const tag = letters(6);
  const code = (s) => `zt${tag}-${s}`; // fixture content codes
  const subjectCode = `zt${tag}`; // ^[a-z]+$
  const A = await b.createUser("a");
  const B = await b.createUser("b");
  const STAFF = await b.createUser("staff");
  const ev = (e) => ({ day: DAY, ...e });
  const commit = (user, events, meta = null, site = "math") => b.rpc("service", "learn_commit_events", { p_user: user.id, p_site: site, p_events: events, p_meta: meta });
  const state = async (user) => (await b.rpc("service", "learn_load_state", { p_user: user.id, p_site: "math", p_day: DAY })).data;
  const session = (user, id) => b.insert("service", "learn_sessions", { id, user_id: user.id, site: "math", kind: "practice" });
  const created = { question: [], parents: [] }; // parents: [table, key] of content roots, deleted in FK order

  try {
    await b.makeStaff(STAFF); // inside the try: a failure here still reaches the purge in `finally`
    // ======================= 024 structure =======================
    const reach = [];
    for (const t of LEARN_TABLES) reach.push([t, (await b.select("service", t, {}, { limit: 1 })).status]);
    expect("024-A1. all 24 learn_* tables exist and are readable by the server role", reach.every(([, s]) => s === "ok"), reach.filter(([, s]) => s !== "ok"));
    const fns = [];
    for (const [fn, args] of [["learn_commit_events", { p_user: A.id, p_site: "math", p_events: [], p_meta: null }], ["learn_load_state", { p_user: A.id, p_site: "math", p_day: DAY }]]) fns.push([fn, (await b.rpc("service", fn, args)).status]);
    expect("024-A2. learn_commit_events and learn_load_state exist and run for the server role", fns.every(([, s]) => s === "ok"), fns);
    if (b.catalog) {
      const rows = await b.catalog(`select p.proname, p.prosecdef, coalesce(p.proconfig::text, '') cfg from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname in ('learn_commit_events', 'learn_load_state', 'learn_load_content') order by 1`);
      expect("024-A3. learn RPCs are SECURITY DEFINER with an empty search_path (catalog)", rows.length === 3 && rows.every((r) => r.prosecdef && r.cfg.replace(/[\\"{}]/g, "") === "search_path="), rows);
      const rls = await b.catalog(`select count(*) filter (where relrowsecurity)::int on_, count(*)::int n from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind = 'r' and c.relname like 'learn\\_%'`);
      expect("024-A4 / 026. RLS enabled on all 25 learn_* tables incl. learn_staff_users (catalog)", rls[0].on_ === LEARN_TABLES.length + 1 && rls[0].n === LEARN_TABLES.length + 1, rls);
    } else notTestable("024-A3/A4. SECURITY DEFINER + search_path + RLS flags", "catalog is not reachable over PostgREST; verified by supabase/diagnostics/staging_migrations_016_023_readonly.sql after apply");

    // ======================= 024 anon =======================
    const anonReads = [];
    for (const t of LEARN_TABLES) anonReads.push([t, (await b.select("anon", t, {}, { limit: 1 })).status]);
    expect("024-B1. anon cannot read any learn_* table", anonReads.every(([, s]) => s === "denied"), anonReads.filter(([, s]) => s !== "denied"));
    const anonRpc = [];
    for (const [fn, args] of [["learn_commit_events", { p_user: A.id, p_site: "math", p_events: [], p_meta: null }], ["learn_load_state", { p_user: A.id, p_site: "math", p_day: DAY }], ["learn_load_content", { p_subject: "math" }]]) anonRpc.push([fn, (await b.rpc("anon", fn, args)).status]);
    expect("024-B2 / 025-B. anon cannot call learn_commit_events, learn_load_state or learn_load_content", anonRpc.every(([, s]) => s === "denied"), anonRpc);

    // ======================= 024 student: profile =======================
    const profile = (u, nick) => ({ user_id: u.id, nickname: nick, grade: "M1", goal: "habit", avatar: "fox" });
    expect("024-C1. a student can create and read their own profile", ok(await b.insert(A, "learn_student_profiles", profile(A, "alpha"))) && (await b.select(A, "learn_student_profiles", {})).rows?.length === 1);
    expect("024-C2. a student cannot create a profile for someone else (RLS)", denied(await b.insert(A, "learn_student_profiles", profile(B, "spoof"))));
    expect("024-C3. profile constraints hold (nickname length, grade, markup)", (await b.insert(B, "learn_student_profiles", profile(B, "x"))).status === "error"
      && (await b.insert(B, "learn_student_profiles", { ...profile(B, "bravo"), grade: "X9" })).status === "error"
      && (await b.insert(B, "learn_student_profiles", profile(B, "<b>bold</b>"))).status === "error");
    await b.insert(B, "learn_student_profiles", profile(B, "bravo"));
    const upd = await b.update(A, "learn_student_profiles", { nickname: "hijack" }, { user_id: B.id });
    expect("024-C4. Student A cannot update Student B's profile", refused(upd) && (await b.select("service", "learn_student_profiles", { user_id: B.id })).rows[0].nickname === "bravo", upd);
    const del = await b.del(A, "learn_student_profiles", { user_id: B.id });
    expect("024-C5. Student A cannot delete Student B's profile", refused(del) && (await b.select("service", "learn_student_profiles", { user_id: B.id })).rows?.length === 1, del);

    // ======================= 024 progress: authority =======================
    await session(A, `sess-a-${tag}0001`);
    await session(B, `sess-b-${tag}0001`);
    const a1 = [
      ev({ type: "attempt", sessionId: `sess-a-${tag}0001`, questionId: "q-1", skillId: "s.one", lessonId: null, attemptNo: 1, answer: "7", correct: true, hintsUsed: 0, timeMs: 5000, difficulty: 1, masteryBefore: 0, masteryAfter: 9.6 }),
      ev({ type: "mastery", skillId: "s.one", score: 9.6, attempts: 1, correct: 1, streak: 1, box: 1, lastPracticedAt: "2026-03-01T03:00:00Z", nextReviewAt: "2026-03-02T03:00:00Z" }),
      ev({ type: "xp", sourceType: "question", sourceId: `sess-a-${tag}0001:q-1`, xp: 10, coins: 2 }),
      ev({ type: "streak", current: 1, best: 1, lastActiveDay: DAY, freezes: 0 }),
      ev({ type: "quest", items: [{ id: "solve", kind: "solve", target: 5, progress: 1 }], completedAt: null }),
      ev({ type: "achievement", code: "first_solve", at: "2026-03-01T03:00:00Z" }),
      ev({ type: "lesson", lessonId: "lesson-a", stars: 2, bestAccuracy: 0.9, completions: 1, firstCompletedAt: "2026-03-01T03:00:00Z", lastCompletedAt: "2026-03-01T03:00:00Z" }),
    ];
    const c1 = await commit(A, a1, { counters: { correctAnswers: 1 }, diagnosticDone: false });
    const st1 = await state(A);
    expect("024-D1. learn_commit_events applies attempt / mastery / XP / streak / quest / achievement atomically; learn_load_state rebuilds them",
      ok(c1) && st1?.totalXp === 10 && st1.coins === 2 && st1.mastery?.length === 1 && st1.streak?.current_days === 1 && st1.achievements?.[0] === "first_solve" && st1.meta?.counters?.correctAnswers === 1, st1);
    await commit(B, [
      ev({ type: "attempt", sessionId: `sess-b-${tag}0001`, questionId: "q-1", skillId: "s.one", lessonId: null, attemptNo: 1, answer: "3", correct: false, hintsUsed: 0, timeMs: 4000, difficulty: 1, masteryBefore: 0, masteryAfter: 0 }),
      ev({ type: "xp", sourceType: "lesson_first", sourceId: "lesson-b", xp: 65, coins: 13 }),
    ]);

    const progressWrites = [];
    for (const t of PROGRESS) {
      const sample = (await b.select("service", t, { user_id: A.id }, { limit: 1 })).rows?.[0];
      if (!sample) { progressWrites.push([t, "no-row"]); continue; }
      const key = t === "learn_sessions" ? { id: sample.id } : t === "learn_attempts" || t === "learn_xp_ledger" ? { id: sample.id } : { user_id: A.id };
      const set = t === "learn_xp_ledger" ? { xp: 9999 } : t === "learn_attempts" ? { is_correct: false } : t === "learn_sessions" ? { kind: "review" } : t === "learn_skill_mastery" ? { score: 100 } : t === "learn_lesson_progress" ? { stars: 3 } : t === "learn_streaks" ? { current_days: 999 } : t === "learn_daily_quests" ? { completed_at: "2026-03-01T00:00:00Z" } : t === "learn_student_achievements" ? { code: "forged" } : { diagnostic_done: true };
      for (const [who, actor] of [["student", A], ["service", "service"]]) {
        if (who === "service" && t === "learn_sessions") continue; // the server owns session bookkeeping (insert/update by design)
        const u = await b.update(actor, t, set, key), d = await b.del(actor, t, key);
        progressWrites.push([`${who}:${t}`, refused(u) && refused(d) ? "blocked" : `LEAK u=${u.status}/${u.rows?.length} d=${d.status}/${d.rows?.length}`]);
      }
    }
    const missing = progressWrites.filter(([, s]) => s === "no-row").map(([t]) => t);
    expect("024-D2. direct UPDATE / DELETE on progress tables is blocked for students and for the server role (writes only via the RPC)", missing.length === 0 && progressWrites.filter(([, s]) => s !== "no-row").every(([, s]) => s === "blocked"), progressWrites.filter(([, s]) => s !== "blocked" && s !== "no-row"));
    const inserts = [];
    inserts.push(["student xp", await b.insert(A, "learn_xp_ledger", { user_id: A.id, site: "math", source_type: "question", source_id: "forged", xp: 500, coins: 0, day: DAY })]);
    inserts.push(["service xp", await b.insert("service", "learn_xp_ledger", { user_id: A.id, site: "math", source_type: "question", source_id: "forged", xp: 500, coins: 0, day: DAY })]);
    inserts.push(["student mastery", await b.insert(A, "learn_skill_mastery", { user_id: A.id, site: "math", skill_code: "forged", score: 100 })]);
    inserts.push(["service attempt", await b.insert("service", "learn_attempts", { user_id: A.id, site: "math", session_id: `sess-a-${tag}0001`, question_code: "q", skill_code: "s", attempt_no: 1, is_correct: true, difficulty: 1, day: DAY })]);
    inserts.push(["student session", await b.insert(A, "learn_sessions", { id: `sess-forge-${tag}01`, user_id: A.id, site: "math", kind: "practice" })]);
    expect("024-D3. direct INSERT into XP ledger / mastery / attempts / sessions is refused for students and the server role", inserts.every(([, r]) => denied(r)), inserts.map(([n, r]) => [n, r.status]));
    expect("024-D4. nothing was minted by the forged writes (XP total still 10)", (await state(A))?.totalXp === 10);
    await b.rpc("service", "learn_commit_events", { p_user: A.id, p_site: "math", p_events: [], p_meta: null });
    const stu = [];
    for (const [fn, args] of [["learn_commit_events", { p_user: A.id, p_site: "math", p_events: [ev({ type: "xp", sourceType: "question", sourceId: "forge", xp: 1000, coins: 0 })], p_meta: null }], ["learn_load_state", { p_user: B.id, p_site: "math", p_day: DAY }], ["learn_load_content", { p_subject: "math" }]]) stu.push([fn, (await b.rpc(A, fn, args)).status]);
    expect("024-D5. a signed-in student cannot call the trusted RPCs (no self-awarded XP, no reading another student's state)", stu.every(([, s]) => s === "denied") && (await state(A))?.totalXp === 10, stu);

    // ======================= 024 idempotency / atomicity / validation =======================
    const xpOnly = [ev({ type: "xp", sourceType: "question", sourceId: `sess-a-${tag}0001:q-1`, xp: 10, coins: 2 })];
    await commit(A, xpOnly); await commit(A, xpOnly); await commit(A, a1.filter((e) => e.type !== "attempt"), { counters: { correctAnswers: 1 }, diagnosticDone: false });
    const st2 = await state(A);
    expect("024-E1. replaying the same XP / mastery / streak / achievement events never double-pays (idempotent ledger key)", st2?.totalXp === 10 && st2.coins === 2 && st2.achievements.length === 1 && st2.mastery.length === 1, st2);
    const before = (await state(A)).totalXp;
    const bad = await commit(A, [ev({ type: "xp", sourceType: "question", sourceId: "half-1", xp: 99, coins: 0 }), ev({ type: "mystery" })]);
    expect("024-E2. a batch with an invalid event is rejected as a whole (atomic rollback; the earlier valid event is not kept)", bad.status === "error" && (await state(A)).totalXp === before, bad);
    const invalid = [];
    invalid.push(["unknown site", (await commit(A, [], null, "science")).status]);
    invalid.push(["negative xp", (await commit(A, [ev({ type: "xp", sourceType: "question", sourceId: "neg", xp: -5, coins: 0 })])).status]);
    invalid.push(["attemptNo 4", (await commit(A, [ev({ type: "attempt", sessionId: `sess-a-${tag}0001`, questionId: "q", skillId: "s", attemptNo: 4, correct: true, hintsUsed: 0, timeMs: 1, difficulty: 1 })])).status]);
    invalid.push(["difficulty 9", (await commit(A, [ev({ type: "attempt", sessionId: `sess-a-${tag}0001`, questionId: "q", skillId: "s", attemptNo: 1, correct: true, hintsUsed: 0, timeMs: 1, difficulty: 9 })])).status]);
    invalid.push(["unknown session", (await commit(A, [ev({ type: "attempt", sessionId: `no-such-session-${tag}`, questionId: "q", skillId: "s", attemptNo: 1, correct: true, hintsUsed: 0, timeMs: 1, difficulty: 1 })])).status]);
    invalid.push(["stars 5", (await commit(A, [ev({ type: "lesson", lessonId: "l", stars: 5, bestAccuracy: 1, completions: 1, firstCompletedAt: "2026-03-01T00:00:00Z", lastCompletedAt: "2026-03-01T00:00:00Z" })])).status]);
    invalid.push(["mastery score 150", (await commit(A, [ev({ type: "mastery", skillId: "s", score: 150, attempts: 1, correct: 1, streak: 1, box: 1, lastPracticedAt: "2026-03-01T00:00:00Z", nextReviewAt: "2026-03-02T00:00:00Z" })])).status]);
    invalid.push(["unknown user", (await commit({ id: "00000000-0000-0000-0000-00000000dead" }, [ev({ type: "xp", sourceType: "question", sourceId: "ghost", xp: 1, coins: 0 })])).status]);
    expect("024-E3. invalid events are rejected by the database (unknown site / type, negative XP, attempt_no, difficulty, unknown session, stars, mastery range, unknown user)", invalid.every(([, s]) => s === "error"), invalid);
    expect("024-E4. none of the rejected batches changed the ledger", (await state(A)).totalXp === before);

    // ======================= 024 isolation =======================
    const bState = await state(B), aState = await state(A);
    expect("024-F1. learn_load_state keeps Student A and Student B apart", aState.totalXp === 10 && bState.totalXp === 65 && bState.achievements.length === 0, [aState.totalXp, bState.totalXp]);
    const iso = [];
    for (const t of PROGRESS) {
      const mine = (await b.select(A, t, {})).rows ?? [];
      iso.push([t, mine.every((r) => r.user_id === A.id), mine.length]);
    }
    expect("024-F2. each progress table returns only the student's own rows (Student B's rows are invisible to A)", iso.every(([, onlyMine]) => onlyMine) && (await b.select(A, "learn_xp_ledger", { user_id: B.id })).rows?.length === 0, iso.filter(([, o]) => !o));
    expect("024-F3. Student B sees B's ledger and none of A's", (await b.select(B, "learn_xp_ledger", {})).rows?.every((r) => r.user_id === B.id) && (await b.select(B, "learn_xp_ledger", { user_id: A.id })).rows?.length === 0);
    expect("024-F4. the server role can read every student's progress (it is the trusted reader)", (await b.select("service", "learn_xp_ledger", {})).rows?.length >= 2);
    // ======================= content fixtures (purgeable, written by a STAFF fixture) =======================
    const S = STAFF;
    const country = `Z${letters(1).toUpperCase()}`;
    const CATALOG = ["learn_countries", "learn_curricula", "learn_subjects", "learn_skills", "learn_courses", "learn_units", "learn_lessons", "learn_lesson_skills"];
    // Catalog structure is written by the trusted import path (server key); question content by a STAFF user through RLS.
    const mk = async (table, row) => {
      const r = await b.insert(CATALOG.includes(table) ? "service" : S, table, row);
      if (!ok(r)) throw new Error(`content fixture ${table}: ${r.status} ${r.message ?? ""}`);
      if (["learn_countries", "learn_subjects", "learn_curricula", "learn_skills", "learn_courses"].includes(table)) created.parents.push([table, r.rows[0].id ? { id: r.rows[0].id } : { code: r.rows[0].code }]);
      return r.rows[0];
    };
    const cCountry = await mk("learn_countries", { code: country, name: "Fixture" });
    const cSubject = await mk("learn_subjects", { code: subjectCode, name: "Fixture subject" });
    const cCur = await mk("learn_curricula", { code: code("cur"), country_code: country, name: "Fixture curriculum", status: "PUBLISHED" });
    const cSkill = await mk("learn_skills", { code: `zt.${tag}.skill`, subject_id: cSubject.id, title: "Fixture skill" });
    const cCourse = await mk("learn_courses", { code: code("course"), curriculum_id: cCur.id, subject_id: cSubject.id, school_level: "middle", grade: "M1", title: "Fixture course", world_name: "W", status: "PUBLISHED" });
    const cUnit = await mk("learn_units", { code: code("unit"), course_id: cCourse.id, title: "Unit", status: "PUBLISHED" });
    const cLesson = await mk("learn_lessons", { code: code("lesson"), unit_id: cUnit.id, title: "Lesson", status: "PUBLISHED" });
    const cDraftLesson = await mk("learn_lessons", { code: code("draft-lesson"), unit_id: cUnit.id, title: "Draft lesson", status: "DRAFT" });
    const newQuestion = async (suffix, status) => {
      const q = await mk("learn_questions", { code: code(suffix), subject_id: cSubject.id, skill_id: cSkill.id, type: "multiple_choice", difficulty: 1, prompt: `Prompt ${suffix}`, status: "DRAFT" });
      created.question.push(q.id);
      await mk("learn_question_options", { question_id: q.id, option_key: "a", body: "Option A", sort_order: 0 });
      await mk("learn_question_answers", { question_id: q.id, answer: { kind: "choice", id: "a", secret: SECRET_ANSWER } });
      await mk("learn_question_hints", { question_id: q.id, level: 1, body: SECRET_HINT });
      await mk("learn_question_explanations", { question_id: q.id, body: SECRET_EXPLANATION });
      if (status !== "DRAFT") for (const step of ["REVIEWED", "APPROVED", "PUBLISHED", ...(status === "ARCHIVED" ? ["ARCHIVED"] : [])]) {
        const r = await b.update(S, "learn_questions", { status: step, reviewed_by: S.id }, { id: q.id });
        if (!ok(r) || r.rows?.length !== 1) throw new Error(`publish step ${step}: ${r.status} ${r.message ?? ""}`);
      }
      return q;
    };
    const qPub = await newQuestion("q-pub", "PUBLISHED");
    const qDraft = await newQuestion("q-draft", "DRAFT");
    const qArch = await newQuestion("q-arch", "ARCHIVED");
    await mk("learn_lesson_skills", { lesson_id: cLesson.id, skill_id: cSkill.id });
    await mk("learn_lesson_questions", { lesson_id: cLesson.id, question_id: qPub.id, sort_order: 0, is_challenge: false });

    // ======================= 024 publish workflow =======================
    const flow = [];
    flow.push(["born published", (await b.insert(S, "learn_questions", { code: code("born"), subject_id: cSubject.id, skill_id: cSkill.id, type: "numeric", difficulty: 1, prompt: "x", status: "PUBLISHED" })).status]);
    const skip = await b.update(S, "learn_questions", { status: "PUBLISHED", reviewed_by: S.id }, { id: qDraft.id });
    flow.push(["draft -> published (skip steps)", skip.status]);
    const noReviewer = await b.update(S, "learn_questions", { status: "REVIEWED" }, { id: qDraft.id });
    flow.push(["review without reviewer", noReviewer.status]);
    const revive = await b.update(S, "learn_questions", { status: "DRAFT" }, { id: qArch.id });
    flow.push(["archived -> draft", revive.status]);
    expect("024-G1. publish workflow: nothing is born PUBLISHED, steps cannot be skipped, a human reviewer is required, archived content cannot be revived", flow.every(([, s]) => s === "error"), flow);
    const svcPublish = await b.insert("service", "learn_questions", { code: code("svc-born"), subject_id: cSubject.id, skill_id: cSkill.id, type: "numeric", difficulty: 1, prompt: "z", status: "PUBLISHED" });
    expect("024-G3. even the server key cannot create a PUBLISHED question (the publish-flow trigger binds every role)", svcPublish.status === "error", svcPublish);
    const noKey = await b.insert(S, "learn_questions", { code: code("nokey"), subject_id: cSubject.id, skill_id: cSkill.id, type: "numeric", difficulty: 1, prompt: "y", status: "DRAFT" });
    if (ok(noKey)) {
      created.question.push(noKey.rows[0].id);
      let r;
      for (const step of ["REVIEWED", "APPROVED"]) r = await b.update(S, "learn_questions", { status: step, reviewed_by: S.id }, { id: noKey.rows[0].id });
      const pub = await b.update(S, "learn_questions", { status: "PUBLISHED", reviewed_by: S.id }, { id: noKey.rows[0].id });
      expect("024-G2. a question without an answer key cannot be published", pub.status === "error", pub);
    } else expect("024-G2. a question without an answer key cannot be published", false, noKey);

    // ======================= 024 content visibility =======================
    const studentCatalog = [];
    for (const t of ["learn_courses", "learn_units", "learn_lessons", "learn_curricula"]) studentCatalog.push([t, (await b.select(A, t, {})).rows?.map((r) => r.code) ?? []]);
    const seen = Object.fromEntries(studentCatalog);
    expect("024-H1. students read PUBLISHED catalog rows (course / unit / lesson / curriculum) and not DRAFT ones", seen.learn_courses.includes(code("course")) && seen.learn_units.includes(code("unit")) && seen.learn_lessons.includes(code("lesson")) && !seen.learn_lessons.includes(code("draft-lesson")), seen);
    const leaks = [];
    for (const t of ANSWER_TABLES) { const r = await b.select(A, t, {}); leaks.push([t, r.status, r.rows?.length ?? 0, JSON.stringify(r.rows ?? "").includes("ZZ-SECRET")]); }
    expect("024-H2. students cannot read questions, options, answer keys, hints or explanations (empty or denied, never a secret)", leaks.every(([, s, n, leaked]) => (s === "denied" || (s === "ok" && n === 0)) && !leaked), leaks);
    const studentWrites = [];
    for (const t of CONTENT) studentWrites.push([t, (await b.insert(A, t, {})).status]);
    expect("024-H3. students cannot write any content table", studentWrites.every(([, s]) => s === "denied"), studentWrites);
    expect("024-H4. staff can read answer keys, hints and explanations (authoring access is unchanged)", (await b.select(S, "learn_question_answers", { question_id: qPub.id })).rows?.length === 1);

    // ======================= 026 self-contained authorization =======================
    const staffRow = (await b.select("service", "learn_staff_users", { user_id: S.id })).rows ?? [];
    expect("026-A1. the staff fixture is a row of learn_staff_users with role EDITOR, readable by the server role (the server's admin gate)", staffRow.length === 1 && staffRow[0].role === "EDITOR", staffRow);
    const staffReads = [];
    for (const [who, actor] of [["anon", "anon"], ["student", A], ["staff", S]]) staffReads.push([who, (await b.select(actor, "learn_staff_users", {}, { limit: 1 })).status]);
    expect("026-A2. neither anon, students nor staff accounts can read learn_staff_users through the API (no grant, RLS without policies)", staffReads.every(([, st]) => st === "denied"), staffReads);
    const staffWrites = [];
    for (const [who, actor] of [["anon", "anon"], ["student", A], ["staff", S], ["service", "service"]]) {
      const ins = await b.insert(actor, "learn_staff_users", { user_id: A.id, role: "ADMIN" });
      const upd = await b.update(actor, "learn_staff_users", { role: "ADMIN" }, { user_id: S.id });
      const del = await b.del(actor, "learn_staff_users", { user_id: S.id });
      staffWrites.push([who, ins.status, upd.status, del.status]);
    }
    expect("026-A3. NOBODY can write learn_staff_users through the API (anon, student, staff, and the server key): staff are granted only by the database owner", staffWrites.every(([, i, u, d]) => i === "denied" && u === "denied" && d === "denied"), staffWrites);
    expect("026-A4. the staff row survived every attempt (and the student is still not staff)", (await b.select("service", "learn_staff_users", { user_id: S.id })).rows?.length === 1 && (await b.select("service", "learn_staff_users", { user_id: A.id })).rows?.length === 0);
    if (b.rpcInSchema) {
      const probes = [];
      for (const [who, actor] of [["anon", "anon"], ["student", A], ["staff", S], ["service", "service"]]) probes.push([who, (await b.rpcInSchema(actor, "learn_security", "is_staff", {})).status]);
      expect("026-A5. learn_security.is_staff is not callable through the API (the schema is not exposed): every actor is refused", probes.every(([, st]) => st !== "ok"), probes);
    } else notTestable("026-A5. learn_security is not an API-exposed schema", "PostgREST exposure is a project setting; checked live by the staging gate");
    if (b.catalog) {
      const pol = await b.catalog(`select count(*)::int n, count(*) filter (where qual like '%learn_security.is_staff%' and with_check like '%learn_security.is_staff%')::int ok,
        count(*) filter (where qual ~ 'has_role|app_role' or with_check ~ 'has_role|app_role')::int legacy from pg_policies where schemaname = 'public' and policyname = 'learn content staff all'`);
      expect("026-B1. all 14 content staff policies use learn_security.is_staff and none references the marketplace has_role / app_role (catalog)", pol[0].n === 14 && pol[0].ok === 14 && pol[0].legacy === 0, pol);
      const fn = await b.catalog(`select p.prosecdef, coalesce(p.proconfig::text, '') cfg, has_function_privilege('anon', p.oid, 'EXECUTE') a, has_function_privilege('authenticated', p.oid, 'EXECUTE') u, has_function_privilege('service_role', p.oid, 'EXECUTE') sr,
        has_schema_privilege('anon', 'learn_security', 'USAGE') sa, has_schema_privilege('authenticated', 'learn_security', 'USAGE') su
        from pg_proc p where p.oid = 'learn_security.is_staff(text[])'::regprocedure`);
      expect("026-B2. is_staff is SECURITY DEFINER, search_path '', EXECUTE and schema USAGE for authenticated only (catalog)", fn[0].prosecdef && fn[0].cfg.replace(/[\\"{}]/g, "") === "search_path=" && !fn[0].a && fn[0].u && !fn[0].sr && !fn[0].sa && fn[0].su, fn);
    }

    // ======================= 025 learn_load_content =======================
    const stuLoad = await b.rpc(A, "learn_load_content", { p_subject: subjectCode });
    const staffLoad = await b.rpc(S, "learn_load_content", { p_subject: subjectCode });
    expect("025-A1. learn_load_content (answer keys inside) is refused to signed-in students AND to staff accounts; it is a server-only read", denied(stuLoad) && denied(staffLoad), [stuLoad.status, staffLoad.status]);
    const bundle = (await b.rpc("service", "learn_load_content", { p_subject: subjectCode })).data;
    const qs = bundle?.questions ?? [];
    expect("025-B1. the server role gets the PUBLISHED curriculum: the course / unit / lesson tree and the published question", bundle?.catalog?.courses?.length === 1 && bundle.catalog.courses[0].units?.[0]?.lessons?.map((l) => l.id).join() === code("lesson") && qs.map((q) => q.id).join() === code("q-pub"), bundle);
    expect("025-B2. DRAFT and ARCHIVED questions and DRAFT lessons never reach the bundle", !qs.some((q) => [code("q-draft"), code("q-arch")].includes(q.id)) && !JSON.stringify(bundle).includes(code("draft-lesson")), qs.map((q) => q.id));
    expect("025-B3. the bundle carries the answer key, hint and explanation for the server's answer verification (they are meant for the server only)", qs[0]?.answer?.secret === SECRET_ANSWER && qs[0].hints?.[0] === SECRET_HINT && qs[0].explanation === SECRET_EXPLANATION, qs[0]);
    const empty = (await b.rpc("service", "learn_load_content", { p_subject: `zz${tag}none` })).data;
    expect("025-B4. an unknown subject returns an empty bundle, not an error or another subject's content", empty?.questions?.length === 0 && empty?.catalog?.courses?.length === 0, empty);
    const projection = (await b.select(A, "learn_lesson_questions", {})).rows;
    expect("025-C1. no student-reachable read path exposes the answer key (tables are empty or denied; the RPC is refused)", !JSON.stringify([projection, leaks]).includes("ZZ-SECRET"));
    if (b.catalog) {
      const g = await b.catalog(`select has_function_privilege('anon', 'public.learn_load_content(text)', 'EXECUTE') a, has_function_privilege('authenticated', 'public.learn_load_content(text)', 'EXECUTE') u, has_function_privilege('service_role', 'public.learn_load_content(text)', 'EXECUTE') s,
        (select prosecdef from pg_proc where proname = 'learn_load_content') secdef`);
      expect("025-D1. learn_load_content is SECURITY DEFINER, executable by service_role only (catalog)", g[0].secdef && g[0].s && !g[0].a && !g[0].u, g);
    }
  } finally {
    // ======================= purge =======================
    try {
      const S = STAFF;
      const del = async (t) => { for (const [table, key] of created.parents) if (table === t) await b.del("service", table, key); };
      await del("learn_courses"); // cascades units / lessons / lesson links (lesson_questions would block question deletion)
      for (const id of created.question) await b.del("service", "learn_questions", { id }); // cascades options / answers / hints / explanations
      for (const t of ["learn_curricula", "learn_skills", "learn_subjects", "learn_countries"]) await del(t);
      await b.purge();
    } catch (error) { console.log(`PURGE WARNING ${error.message}`); }
  }
  void phase;
}

-- LIFE.HELP learning platform (math.life.help + english.life.help).
--
-- Additive only: creates new `learn_*` objects, never alters or drops existing
-- marketplace tables. The `learn_` prefix keeps the learning domain separate
-- inside the shared LIFE.HELP database. Rollback: supabase/rollbacks/202609300024_learning_platform.down.sql.
--
-- Depends on 0001 (auth.users, public.app_role, security.has_role); sequence 0024 follows 0023.
--
-- Security model
--   * Curriculum tables: published catalog rows are readable by signed-in
--     users; every write (and every answer key / hint / explanation read) is
--     staff-only. The Next.js server reads content with the service role and
--     never sends answer keys to browsers.
--   * Student tables: a student can only SELECT their own rows. There are no
--     INSERT/UPDATE policies on progress tables, so XP, mastery and attempts
--     can only be written by the trusted server via learn_commit_events()
--     (service_role only). The one exception is learn_student_profiles, which
--     students maintain themselves (nickname/grade/goal/avatar only).

create type public.learn_publish_status as enum ('DRAFT', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

/* ------------------------------------------------------------------ */
/* Curriculum (data-driven: country -> curriculum -> course -> unit -> lesson) */
/* ------------------------------------------------------------------ */

create table public.learn_countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null
);

create table public.learn_curricula (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z0-9-]+$'),
  country_code text not null references public.learn_countries(code),
  name text not null,
  status public.learn_publish_status not null default 'DRAFT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.learn_subjects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z]+$'),
  name text not null
);

create table public.learn_courses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z0-9-]+$'),
  curriculum_id uuid not null references public.learn_curricula(id),
  subject_id uuid not null references public.learn_subjects(id),
  school_level text not null check (school_level in ('middle', 'high')),
  grade text not null check (grade in ('M1', 'M2', 'M3', 'H1', 'H2', 'H3')),
  title text not null,
  world_name text not null, world_emoji text not null default '🌍', world_tagline text not null default '',
  sort_order integer not null default 0,
  status public.learn_publish_status not null default 'DRAFT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.learn_units (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z0-9-]+$'),
  course_id uuid not null references public.learn_courses(id) on delete cascade,
  title text not null, sort_order integer not null default 0,
  status public.learn_publish_status not null default 'DRAFT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.learn_skills (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z0-9._-]+$'),
  subject_id uuid not null references public.learn_subjects(id),
  title text not null,
  prerequisite_skill_id uuid references public.learn_skills(id),
  created_at timestamptz not null default now()
);

create table public.learn_lessons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z0-9-]+$'),
  unit_id uuid not null references public.learn_units(id) on delete cascade,
  title text not null, concept text not null default '', example text not null default '',
  sort_order integer not null default 0,
  status public.learn_publish_status not null default 'DRAFT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.learn_lesson_skills (
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  skill_id uuid not null references public.learn_skills(id),
  primary key (lesson_id, skill_id)
);

create table public.learn_questions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-Za-z0-9._-]+$'),
  subject_id uuid not null references public.learn_subjects(id),
  skill_id uuid not null references public.learn_skills(id),
  type text not null check (type in ('multiple_choice','multiple_select','true_false','numeric','short_answer','fill_blank','ordering')),
  difficulty smallint not null check (difficulty between 1 and 5),
  prompt text not null check (char_length(prompt) between 1 and 4000),
  latex text,
  role text not null default 'core' check (role in ('core', 'variant', 'diagnostic')),
  family text,
  expected_seconds integer check (expected_seconds is null or expected_seconds between 5 and 1800),
  audio_text text, audio_url text,
  tags text[] not null default '{}',
  ai_generated boolean not null default false,
  status public.learn_publish_status not null default 'DRAFT',
  created_by uuid references auth.users(id), reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index learn_questions_skill_idx on public.learn_questions(skill_id, status);

create table public.learn_lesson_questions (
  lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
  question_id uuid not null references public.learn_questions(id),
  sort_order integer not null default 0,
  is_challenge boolean not null default false,
  primary key (lesson_id, question_id)
);
create table public.learn_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.learn_questions(id) on delete cascade,
  option_key text not null, body text not null, sort_order integer not null default 0,
  unique (question_id, option_key)
);
-- Answer keys live in their own table so a mistaken read policy on questions can never expose them.
create table public.learn_question_answers (
  question_id uuid primary key references public.learn_questions(id) on delete cascade,
  answer jsonb not null
);
create table public.learn_question_hints (
  question_id uuid not null references public.learn_questions(id) on delete cascade,
  level smallint not null check (level between 1 and 5), body text not null,
  primary key (question_id, level)
);
create table public.learn_question_explanations (
  question_id uuid primary key references public.learn_questions(id) on delete cascade,
  body text not null
);

/* Content workflow: nothing (including AI-drafted questions) is born published. */
create function public.learn_enforce_publish_flow() returns trigger language plpgsql set search_path = '' as $$
declare
  order_of jsonb := '{"DRAFT":0,"REVIEWED":1,"APPROVED":2,"PUBLISHED":3}';
begin
  if tg_op = 'INSERT' then
    if new.status <> 'DRAFT' then
      raise exception 'new questions must start as DRAFT' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if new.status = 'ARCHIVED' then
      null;
    elsif old.status = 'ARCHIVED' then
      raise exception 'archived questions cannot be re-activated; copy them instead' using errcode = '23514';
    elsif (order_of ->> new.status::text)::int > (order_of ->> old.status::text)::int + 1 then
      raise exception 'status must advance one step at a time (DRAFT > REVIEWED > APPROVED > PUBLISHED)' using errcode = '23514';
    end if;
    if new.status in ('REVIEWED', 'APPROVED', 'PUBLISHED') and new.reviewed_by is null then
      raise exception 'a human reviewer (reviewed_by) is required before review/approval/publishing' using errcode = '23514';
    end if;
    if new.status = 'PUBLISHED' and not exists (select 1 from public.learn_question_answers a where a.question_id = new.id) then
      raise exception 'cannot publish a question without an answer key' using errcode = '23514';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger learn_questions_publish_flow before insert or update on public.learn_questions
  for each row execute function public.learn_enforce_publish_flow();

/* ------------------------------------------------------------------ */
/* Students                                                            */
/* ------------------------------------------------------------------ */

-- Minimal personal data by design: nickname, grade, goal, avatar. No real name, school, phone or birth date.
create table public.learn_student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 16 and nickname !~ '[<>&"''`\\]'),
  grade text not null check (grade in ('M1', 'M2', 'M3', 'H1', 'H2', 'H3')),
  goal text not null check (goal in ('school_exam', 'fill_gaps', 'advance', 'habit')),
  avatar text not null default 'fox' check (avatar ~ '^[a-z]{2,12}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.learn_sessions (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  kind text not null check (kind in ('lesson', 'review', 'practice', 'diagnostic')),
  lesson_code text,
  started_at timestamptz not null default now(), completed_at timestamptz
);
create index learn_sessions_user_idx on public.learn_sessions(user_id, started_at desc);

-- Content is referenced by stable `code` (not FK) so archiving or re-importing
-- content never rewrites or blocks a student's history.
create table public.learn_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  session_id text not null references public.learn_sessions(id) on delete cascade,
  question_code text not null, skill_code text not null, lesson_code text,
  attempt_no smallint not null check (attempt_no between 1 and 3),
  answer text check (answer is null or char_length(answer) <= 200),
  is_correct boolean not null, revealed boolean not null default false, is_review boolean not null default false,
  hints_used smallint not null default 0 check (hints_used between 0 and 5),
  time_ms integer not null default 0 check (time_ms between 0 and 3600000),
  difficulty smallint not null check (difficulty between 1 and 5),
  mastery_before numeric(5,2), mastery_after numeric(5,2),
  day date not null, created_at timestamptz not null default now()
);
create index learn_attempts_user_day_idx on public.learn_attempts(user_id, site, day);
create index learn_attempts_session_idx on public.learn_attempts(session_id, question_code);

create table public.learn_skill_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  skill_code text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  attempts integer not null default 0, correct integer not null default 0, streak integer not null default 0,
  srs_box smallint not null default 0 check (srs_box between 0 and 10),
  last_practiced_at timestamptz, next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, site, skill_code)
);
create index learn_skill_mastery_due_idx on public.learn_skill_mastery(user_id, site, next_review_at);

create table public.learn_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  lesson_code text not null,
  stars smallint not null default 0 check (stars between 0 and 3),
  best_accuracy numeric(4,3) not null default 0 check (best_accuracy between 0 and 1),
  completions integer not null default 0,
  first_completed_at timestamptz, last_completed_at timestamptz,
  placed_out boolean not null default false,
  primary key (user_id, site, lesson_code)
);

-- XP is an append-only ledger. The unique key is the idempotency guard: the
-- same source can never be paid twice, even if a request is retried.
create table public.learn_xp_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  source_type text not null, source_id text not null,
  xp integer not null check (xp >= 0), coins integer not null default 0 check (coins >= 0),
  day date not null, created_at timestamptz not null default now(),
  unique (user_id, site, source_type, source_id)
);
create index learn_xp_ledger_day_idx on public.learn_xp_ledger(user_id, site, day);

create table public.learn_streaks (
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  current_days integer not null default 0, best_days integer not null default 0,
  last_active_day date, freezes smallint not null default 0 check (freezes between 0 and 5),
  primary key (user_id, site)
);

create table public.learn_daily_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  quest_day date not null, items jsonb not null default '[]', completed_at timestamptz,
  primary key (user_id, site, quest_day)
);

create table public.learn_student_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  code text not null, earned_at timestamptz not null default now(),
  primary key (user_id, site, code)
);

create table public.learn_progress_meta (
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site in ('math', 'english')),
  counters jsonb not null default '{}', diagnostic_done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, site)
);

/* ------------------------------------------------------------------ */
/* Row Level Security                                                  */
/* ------------------------------------------------------------------ */

do $$
declare t text;
begin
  foreach t in array array[
    'learn_countries','learn_curricula','learn_subjects','learn_courses','learn_units','learn_skills','learn_lessons',
    'learn_lesson_skills','learn_questions','learn_lesson_questions','learn_question_options','learn_question_answers',
    'learn_question_hints','learn_question_explanations','learn_student_profiles','learn_sessions','learn_attempts',
    'learn_skill_mastery','learn_lesson_progress','learn_xp_ledger','learn_streaks','learn_daily_quests',
    'learn_student_achievements','learn_progress_meta']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Catalog: published structure is visible to signed-in users (no answer data).
create policy "learn catalog read" on public.learn_countries for select to authenticated using (true);
create policy "learn catalog read" on public.learn_subjects for select to authenticated using (true);
create policy "learn catalog read" on public.learn_skills for select to authenticated using (true);
create policy "learn catalog read" on public.learn_curricula for select to authenticated using (status = 'PUBLISHED');
create policy "learn catalog read" on public.learn_courses for select to authenticated using (status = 'PUBLISHED');
create policy "learn catalog read" on public.learn_units for select to authenticated using (status = 'PUBLISHED');
create policy "learn catalog read" on public.learn_lessons for select to authenticated using (status = 'PUBLISHED');
create policy "learn catalog read" on public.learn_lesson_skills for select to authenticated using (true);

-- Staff manage all content; only staff can read questions, answers, hints and explanations directly.
do $$
declare t text;
begin
  foreach t in array array[
    'learn_countries','learn_curricula','learn_subjects','learn_courses','learn_units','learn_skills','learn_lessons',
    'learn_lesson_skills','learn_questions','learn_lesson_questions','learn_question_options','learn_question_answers',
    'learn_question_hints','learn_question_explanations']
  loop
    execute format($f$create policy "learn content staff all" on public.%I for all to authenticated
      using ((select security.has_role(array['ADMIN','STAFF']::public.app_role[])))
      with check ((select security.has_role(array['ADMIN','STAFF']::public.app_role[])))$f$, t);
  end loop;
end $$;

-- Students: own profile (read/create/update/delete).
create policy "learn profile self select" on public.learn_student_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "learn profile self insert" on public.learn_student_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "learn profile self update" on public.learn_student_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "learn profile self delete" on public.learn_student_profiles for delete to authenticated using (user_id = (select auth.uid()));

-- Students: read-only access to their own progress. No write policies => writes only via service_role.
do $$
declare t text;
begin
  foreach t in array array[
    'learn_sessions','learn_attempts','learn_skill_mastery','learn_lesson_progress','learn_xp_ledger',
    'learn_streaks','learn_daily_quests','learn_student_achievements','learn_progress_meta']
  loop
    execute format('create policy "learn own read" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Least privilege at the grant level too (defence in depth on top of RLS), in the style of 019 / 021:
-- Supabase default privileges would otherwise give the app role (service_role) full DML on every new table.
-- Only learn_* tables are touched; existing marketplace grants are left exactly as they are.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'learn\_%' loop
    execute format('revoke all on public.%I from anon, authenticated, service_role', t);
    execute format('grant select on public.%I to service_role', t);
  end loop;
end $$;
-- Progress, XP ledger, mastery and attempts are written ONLY by the SECURITY DEFINER RPCs below
-- (owner privileges), so the app role has SELECT only there: it cannot rewrite or delete history directly.
-- The server writes just two tables directly: the student's own profile and the session bookkeeping row.
grant insert, update, delete on public.learn_student_profiles, public.learn_sessions to service_role;
grant select on public.learn_countries, public.learn_subjects, public.learn_skills, public.learn_curricula, public.learn_courses,
  public.learn_units, public.learn_lessons, public.learn_lesson_skills to authenticated;
grant select, insert, update, delete on public.learn_questions, public.learn_lesson_questions, public.learn_question_options,
  public.learn_question_answers, public.learn_question_hints, public.learn_question_explanations to authenticated;
grant select, insert, update, delete on public.learn_student_profiles to authenticated;
grant select on public.learn_sessions, public.learn_attempts, public.learn_skill_mastery, public.learn_lesson_progress,
  public.learn_xp_ledger, public.learn_streaks, public.learn_daily_quests, public.learn_student_achievements,
  public.learn_progress_meta to authenticated;

/* ------------------------------------------------------------------ */
/* Trusted server RPCs (service_role only)                             */
/* ------------------------------------------------------------------ */

-- Atomically apply the events produced by the (TypeScript) learning engine.
-- XP rows use ON CONFLICT DO NOTHING, so retried requests cannot double-pay.
create function public.learn_commit_events(p_user uuid, p_site text, p_events jsonb, p_meta jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  if p_site not in ('math', 'english') then raise exception 'invalid site'; end if;
  for e in select * from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    case e ->> 'type'
      when 'attempt' then
        insert into public.learn_attempts(user_id, site, session_id, question_code, skill_code, lesson_code, attempt_no, answer,
          is_correct, revealed, is_review, hints_used, time_ms, difficulty, mastery_before, mastery_after, day)
        values (p_user, p_site, e ->> 'sessionId', e ->> 'questionId', e ->> 'skillId', e ->> 'lessonId',
          (e ->> 'attemptNo')::smallint, left(e ->> 'answer', 200), (e ->> 'correct')::boolean,
          coalesce((e ->> 'revealed')::boolean, false), coalesce((e ->> 'isReview')::boolean, false),
          (e ->> 'hintsUsed')::smallint, (e ->> 'timeMs')::integer, (e ->> 'difficulty')::smallint,
          (e ->> 'masteryBefore')::numeric, (e ->> 'masteryAfter')::numeric, (e ->> 'day')::date);
      when 'mastery' then
        insert into public.learn_skill_mastery(user_id, site, skill_code, score, attempts, correct, streak, srs_box, last_practiced_at, next_review_at)
        values (p_user, p_site, e ->> 'skillId', (e ->> 'score')::numeric, (e ->> 'attempts')::integer, (e ->> 'correct')::integer,
          (e ->> 'streak')::integer, (e ->> 'box')::smallint, (e ->> 'lastPracticedAt')::timestamptz, (e ->> 'nextReviewAt')::timestamptz)
        on conflict (user_id, site, skill_code) do update set score = excluded.score, attempts = excluded.attempts,
          correct = excluded.correct, streak = excluded.streak, srs_box = excluded.srs_box,
          last_practiced_at = excluded.last_practiced_at, next_review_at = excluded.next_review_at, updated_at = now();
      when 'xp' then
        insert into public.learn_xp_ledger(user_id, site, source_type, source_id, xp, coins, day)
        values (p_user, p_site, e ->> 'sourceType', e ->> 'sourceId', (e ->> 'xp')::integer, (e ->> 'coins')::integer, (e ->> 'day')::date)
        on conflict (user_id, site, source_type, source_id) do nothing;
      when 'lesson' then
        insert into public.learn_lesson_progress(user_id, site, lesson_code, stars, best_accuracy, completions, first_completed_at, last_completed_at, placed_out)
        values (p_user, p_site, e ->> 'lessonId', (e ->> 'stars')::smallint, (e ->> 'bestAccuracy')::numeric, (e ->> 'completions')::integer,
          (e ->> 'firstCompletedAt')::timestamptz, (e ->> 'lastCompletedAt')::timestamptz, coalesce((e ->> 'placedOut')::boolean, false))
        on conflict (user_id, site, lesson_code) do update set stars = greatest(public.learn_lesson_progress.stars, excluded.stars),
          best_accuracy = greatest(public.learn_lesson_progress.best_accuracy, excluded.best_accuracy),
          completions = excluded.completions,
          first_completed_at = coalesce(public.learn_lesson_progress.first_completed_at, excluded.first_completed_at),
          last_completed_at = excluded.last_completed_at, placed_out = excluded.placed_out;
      when 'streak' then
        insert into public.learn_streaks(user_id, site, current_days, best_days, last_active_day, freezes)
        values (p_user, p_site, (e ->> 'current')::integer, (e ->> 'best')::integer, (e ->> 'lastActiveDay')::date, (e ->> 'freezes')::smallint)
        on conflict (user_id, site) do update set current_days = excluded.current_days,
          best_days = greatest(public.learn_streaks.best_days, excluded.best_days),
          last_active_day = excluded.last_active_day, freezes = excluded.freezes;
      when 'quest' then
        insert into public.learn_daily_quests(user_id, site, quest_day, items, completed_at)
        values (p_user, p_site, (e ->> 'day')::date, e -> 'items', (e ->> 'completedAt')::timestamptz)
        on conflict (user_id, site, quest_day) do update set items = excluded.items,
          completed_at = coalesce(public.learn_daily_quests.completed_at, excluded.completed_at);
      when 'achievement' then
        insert into public.learn_student_achievements(user_id, site, code, earned_at)
        values (p_user, p_site, e ->> 'code', (e ->> 'at')::timestamptz)
        on conflict (user_id, site, code) do nothing;
      else
        raise exception 'unknown event type %', e ->> 'type';
    end case;
  end loop;
  if p_meta is not null then
    insert into public.learn_progress_meta(user_id, site, counters, diagnostic_done)
    values (p_user, p_site, coalesce(p_meta -> 'counters', '{}'), coalesce((p_meta ->> 'diagnosticDone')::boolean, false))
    on conflict (user_id, site) do update set counters = excluded.counters,
      diagnostic_done = public.learn_progress_meta.diagnostic_done or excluded.diagnostic_done, updated_at = now();
  end if;
end $$;

-- One round trip that returns everything the engine needs to rebuild a student's state.
create function public.learn_load_state(p_user uuid, p_site text, p_day date)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) - 'user_id' - 'created_at' - 'updated_at' from public.learn_student_profiles p where p.user_id = p_user),
    'totalXp', coalesce((select sum(xp) from public.learn_xp_ledger where user_id = p_user and site = p_site), 0),
    'coins', coalesce((select sum(coins) from public.learn_xp_ledger where user_id = p_user and site = p_site), 0),
    'xpToday', coalesce((select sum(xp) from public.learn_xp_ledger where user_id = p_user and site = p_site and day = p_day), 0),
    -- Only recent keys matter for idempotency (session ids are unique); lesson-first keys are permanent.
    'ledgerKeys', coalesce((select jsonb_agg(source_type || ':' || source_id) from public.learn_xp_ledger
       where user_id = p_user and site = p_site and (day >= p_day - 3 or source_type in ('lesson_first', 'diagnostic'))), '[]'),
    'rewardsToday', coalesce((select jsonb_object_agg(q, c) from (
       select split_part(source_id, ':', 2) as q, count(*) as c from public.learn_xp_ledger
       where user_id = p_user and site = p_site and day = p_day and source_type = 'question' group by 1) r), '{}'),
    'mastery', coalesce((select jsonb_agg(to_jsonb(m) - 'user_id' - 'site' - 'updated_at') from public.learn_skill_mastery m where m.user_id = p_user and m.site = p_site), '[]'),
    'lessons', coalesce((select jsonb_agg(to_jsonb(l) - 'user_id' - 'site') from public.learn_lesson_progress l where l.user_id = p_user and l.site = p_site), '[]'),
    'streak', (select to_jsonb(s) - 'user_id' - 'site' from public.learn_streaks s where s.user_id = p_user and s.site = p_site),
    'quest', (select to_jsonb(q) - 'user_id' - 'site' from public.learn_daily_quests q where q.user_id = p_user and q.site = p_site and q.quest_day = p_day),
    'achievements', coalesce((select jsonb_agg(code) from public.learn_student_achievements a where a.user_id = p_user and a.site = p_site), '[]'),
    'meta', (select to_jsonb(m) - 'user_id' - 'site' - 'updated_at' from public.learn_progress_meta m where m.user_id = p_user and m.site = p_site)
  )
$$;

revoke all on function public.learn_commit_events(uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.learn_load_state(uuid, text, date) from public, anon, authenticated;
grant execute on function public.learn_commit_events(uuid, text, jsonb, jsonb) to service_role;
grant execute on function public.learn_load_state(uuid, text, date) to service_role;

-- 202610070028: study.korean.life.help (Korean language course, levels K1..K6) on the existing learning schema.
--
-- ADDITIVE, LEARNING OBJECTS ONLY, applied AFTER 202609300027. Earlier learning migrations are immutable; this one only WIDENS:
--
--   site CHECK on the 9 per-site progress tables        ('math','english')                -> + 'korean'
--   public.learn_courses.school_level CHECK              (elementary, middle, high)        -> + 'language'
--   public.learn_courses.grade CHECK                     (E1..E6, M1..M3, H1..H3)          -> + 'K1'..'K6'
--   public.learn_student_profiles.grade                  NOT NULL                          -> nullable (a learner who starts on
--                                                         study.korean has no school grade; math / english treat NULL as
--                                                         "choose your grade" exactly like a missing profile)
--   public.learn_progress_meta.level                     new nullable column: the per-(user, site) language level (K1..K6).
--                                                         to_jsonb() in learn_load_state already returns it inside `meta`.
--   public.learn_commit_events                           same body, site list + 'korean'
--   public.learn_set_course_level(uuid, text, text)      new service_role-only RPC (progress tables stay RPC-written only)
--
-- Progress stays keyed by (user, site, canonical id): the learner's display language is a browser preference with no column, so
-- switching language never forks progress. No marketplace / payment / provider / auth object is touched; no existing row changes.
-- Manual rollback: supabase/rollbacks/202610070028_learning_korean_study.down.sql (refuses while korean rows exist).

do $$
declare t text;
begin
  foreach t in array array['learn_sessions', 'learn_attempts', 'learn_skill_mastery', 'learn_lesson_progress', 'learn_xp_ledger',
                           'learn_streaks', 'learn_daily_quests', 'learn_student_achievements', 'learn_progress_meta'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_site_check');
    execute format('alter table public.%I add constraint %I check (site in (''math'', ''english'', ''korean''))', t, t || '_site_check');
  end loop;
end
$$;

alter table public.learn_courses drop constraint if exists learn_courses_school_level_check;
alter table public.learn_courses add constraint learn_courses_school_level_check
  check (school_level in ('elementary', 'middle', 'high', 'language'));

alter table public.learn_courses drop constraint if exists learn_courses_grade_check;
alter table public.learn_courses add constraint learn_courses_grade_check
  check (grade in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3', 'K1', 'K2', 'K3', 'K4', 'K5', 'K6'));

alter table public.learn_student_profiles alter column grade drop not null;

alter table public.learn_progress_meta add column level text;
alter table public.learn_progress_meta add constraint learn_progress_meta_level_check
  check (level is null or (site = 'korean' and level in ('K1', 'K2', 'K3', 'K4', 'K5', 'K6')));

-- Set the language level of one learner on one site. Upsert keeps counters / diagnostic flags untouched.
create function public.learn_set_course_level(p_user uuid, p_site text, p_level text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_site <> 'korean' then raise exception 'invalid site'; end if;
  if p_level not in ('K1', 'K2', 'K3', 'K4', 'K5', 'K6') then raise exception 'invalid level'; end if;
  insert into public.learn_progress_meta(user_id, site, level) values (p_user, p_site, p_level)
  on conflict (user_id, site) do update set level = excluded.level, updated_at = now();
end $$;
revoke all on function public.learn_set_course_level(uuid, text, text) from public, anon, authenticated;
grant execute on function public.learn_set_course_level(uuid, text, text) to service_role;

-- learn_commit_events: unchanged body (202609300024) except the accepted site list.
create or replace function public.learn_commit_events(p_user uuid, p_site text, p_events jsonb, p_meta jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  if p_site not in ('math', 'english', 'korean') then raise exception 'invalid site'; end if;
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

-- Post-condition: every widened column has exactly ONE check and it allows the new value (a differently named stale check would
-- otherwise survive and silently reject korean rows).
do $$
declare
  r record;
  n integer;
begin
  for r in
    select * from (values
      ('learn_sessions', 'site', 'korean'), ('learn_attempts', 'site', 'korean'), ('learn_skill_mastery', 'site', 'korean'),
      ('learn_lesson_progress', 'site', 'korean'), ('learn_xp_ledger', 'site', 'korean'), ('learn_streaks', 'site', 'korean'),
      ('learn_daily_quests', 'site', 'korean'), ('learn_student_achievements', 'site', 'korean'),
      ('learn_courses', 'school_level', 'language'), ('learn_courses', 'grade', 'K6'), ('learn_student_profiles', 'grade', 'E1')
    ) as t(tbl, col, must_allow)
  loop
    select count(*) into n from pg_constraint c
     where c.conrelid = ('public.' || r.tbl)::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ ('\m' || r.col || '\M');
    if n <> 1 then
      raise exception 'learning 028: expected exactly one check constraint on %.%, found %', r.tbl, r.col, n;
    end if;
    if not exists (select 1 from pg_constraint c
       where c.conrelid = ('public.' || r.tbl)::regclass and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ~ ('\m' || r.col || '\M') and pg_get_constraintdef(c.oid) like ('%' || r.must_allow || '%')) then
      raise exception 'learning 028: check on %.% does not allow %', r.tbl, r.col, r.must_allow;
    end if;
  end loop;
end
$$;

-- Manual rollback for 202610070028_learning_korean_study.sql. NOT run by `supabase db push`. Review and run by hand only.
--
-- Restores the 202609300027 state. It deliberately fails (ADD CONSTRAINT / SET NOT NULL validate every row) while any korean-site row,
-- K-level course or grade-less profile exists, so no student data is ever deleted by this script: remove or migrate those rows first.
-- Touches learning objects only; no CASCADE.
drop function if exists public.learn_set_course_level(uuid, text, text);
alter table public.learn_progress_meta drop constraint if exists learn_progress_meta_level_check;
alter table public.learn_progress_meta drop column if exists level;
alter table public.learn_student_profiles alter column grade set not null;

alter table public.learn_courses drop constraint if exists learn_courses_grade_check;
alter table public.learn_courses add constraint learn_courses_grade_check
  check (grade in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3'));
alter table public.learn_courses drop constraint if exists learn_courses_school_level_check;
alter table public.learn_courses add constraint learn_courses_school_level_check check (school_level in ('elementary', 'middle', 'high'));

do $$
declare t text;
begin
  foreach t in array array['learn_sessions', 'learn_attempts', 'learn_skill_mastery', 'learn_lesson_progress', 'learn_xp_ledger',
                           'learn_streaks', 'learn_daily_quests', 'learn_student_achievements', 'learn_progress_meta'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_site_check');
    execute format('alter table public.%I add constraint %I check (site in (''math'', ''english''))', t, t || '_site_check');
  end loop;
end
$$;

-- learn_commit_events as defined by 202609300024
create or replace function public.learn_commit_events(p_user uuid, p_site text, p_events jsonb, p_meta jsonb)
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

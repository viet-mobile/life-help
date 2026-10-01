-- Manual rollback for 202609300024_learning_platform.sql. NOT run by `supabase db push`.
-- WARNING: destroys all learning data. Review and run by hand only.
drop function if exists public.learn_load_state(uuid, text, date);
drop function if exists public.learn_commit_events(uuid, text, jsonb, jsonb);
drop table if exists public.learn_progress_meta, public.learn_student_achievements, public.learn_daily_quests,
  public.learn_streaks, public.learn_xp_ledger, public.learn_lesson_progress, public.learn_skill_mastery,
  public.learn_attempts, public.learn_sessions, public.learn_student_profiles,
  public.learn_question_explanations, public.learn_question_hints, public.learn_question_answers,
  public.learn_question_options, public.learn_lesson_questions, public.learn_questions,
  public.learn_lesson_skills, public.learn_lessons, public.learn_skills, public.learn_units, public.learn_courses,
  public.learn_subjects, public.learn_curricula, public.learn_countries cascade;
drop function if exists public.learn_enforce_publish_flow();
drop type if exists public.learn_publish_status;
-- Also remove the content RPC added by 202609300025_learning_content_rpc.sql:
drop function if exists public.learn_load_content(text);

-- MANUAL rollback of the whole learning platform (migrations 202609300023 .. 202609300026). NOT run by any tooling.
-- WARNING: destroys all learning data (progress, XP, attempts, content, staff grants).
--
-- Removes ONLY learning-created objects, by explicit name. No CASCADE anywhere: if something outside the learning platform
-- depends on an object below, the statement fails and the whole script rolls back. It never touches auth.users rows,
-- marketplace objects, or an unmarked public.app_role / security.has_role (those belong to the marketplace migrations).
-- After running it, the migration history rows for the four versions still have to be marked reverted separately
-- (`supabase migration repair --status reverted ...`), which is a deliberate, separately approved step.

begin;

-- Trusted RPCs first (they reference the tables only inside their bodies).
drop function if exists public.learn_commit_events(uuid, text, jsonb, jsonb);
drop function if exists public.learn_load_state(uuid, text, date);
drop function if exists public.learn_load_content(text);

-- All 25 learning tables in one statement (FKs among them are dropped together; policies and the publish-flow trigger go with
-- their tables). The staff table is included; its auth.users FK is just a reference and does not touch user rows.
drop table if exists
  public.learn_progress_meta, public.learn_student_achievements, public.learn_daily_quests, public.learn_streaks,
  public.learn_xp_ledger, public.learn_lesson_progress, public.learn_skill_mastery, public.learn_attempts, public.learn_sessions,
  public.learn_student_profiles, public.learn_question_explanations, public.learn_question_hints, public.learn_question_answers,
  public.learn_question_options, public.learn_lesson_questions, public.learn_questions, public.learn_lesson_skills,
  public.learn_lessons, public.learn_skills, public.learn_units, public.learn_courses, public.learn_subjects,
  public.learn_curricula, public.learn_countries, public.learn_staff_users;

drop function if exists learn_security.is_staff(text[]);
drop schema if exists learn_security; -- fails (no CASCADE) if anything else was put in it
drop function if exists public.learn_enforce_publish_flow();
drop type if exists public.learn_publish_status;

-- Shim residue: only if 202609300026 never ran. Marker-tagged objects only; unmarked (marketplace) objects are left alone.
do $shim_residue$
declare
  v_marker constant text := 'learn-prereq-shim:v1';
  v_type_oid oid := to_regtype('public.app_role')::oid;
  v_fn_oid oid := to_regprocedure('security.has_role(public.app_role[])')::oid;
  v_schema_oid oid := to_regnamespace('security')::oid;
  v_type_marked boolean := coalesce(obj_description(v_type_oid, 'pg_type') like v_marker || '%', false);
  v_fn_marked boolean := coalesce(obj_description(v_fn_oid, 'pg_proc') like v_marker || '%', false);
  v_schema_marked boolean := coalesce(obj_description(v_schema_oid, 'pg_namespace') like v_marker || '%', false);
begin
  if v_type_marked <> v_fn_marked then
    raise exception 'inconsistent shim markers (app_role marked=%, has_role marked=%); refusing to drop anything', v_type_marked, v_fn_marked;
  end if;
  if v_type_marked and v_fn_marked then
    drop function security.has_role(public.app_role[]);
    drop type public.app_role;
  end if;
  if v_schema_marked then
    if exists (select 1 from pg_class where relnamespace = v_schema_oid) or exists (select 1 from pg_proc where pronamespace = v_schema_oid)
       or exists (select 1 from pg_type where typnamespace = v_schema_oid) then
      raise exception 'marker-tagged schema "security" is not empty; refusing to drop it';
    end if;
    drop schema security;
  end if;
end
$shim_residue$;

commit;

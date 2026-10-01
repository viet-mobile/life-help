-- READ-ONLY verification of the learning platform on STAGING. Changes nothing.
-- Every row must show ok = true; the last row is the overall verdict.
with t as (
  select tablename from pg_tables where schemaname = 'public' and tablename like 'learn\_%' and tablename <> 'learn_seed_allowed'
),
progress_tables(name) as (
  values ('learn_sessions'),('learn_attempts'),('learn_skill_mastery'),('learn_lesson_progress'),('learn_xp_ledger'),
         ('learn_streaks'),('learn_daily_quests'),('learn_student_achievements'),('learn_progress_meta')
),
checks(ord, check_name, ok, detail) as (
  select 1, 'dependency: security.has_role exists', to_regprocedure('security.has_role(public.app_role[])') is not null, 'from marketplace migration 202609120001'
  union all select 2, 'dependency: public.app_role type exists', to_regtype('public.app_role') is not null, ''
  union all select 3, 'learn_* tables exist (expect 24)', (select count(*) from t) = 24, (select count(*)::text from t)
  union all select 4, 'RLS enabled on every learn_* table', not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname like 'learn\_%' and c.relkind = 'r' and not c.relrowsecurity), ''
  union all select 5, 'student progress tables: own-read policy on all 9', (
      select count(distinct tablename) from pg_policies where schemaname = 'public' and policyname = 'learn own read'
        and tablename in (select name from progress_tables)) = 9, ''
  union all select 6, 'student progress tables: NO insert/update/delete policy (server-only writes)', not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename in (select name from progress_tables)
        and cmd in ('INSERT','UPDATE','DELETE','ALL')), ''
  union all select 7, 'XP ledger unique idempotency constraint', exists (
      select 1 from pg_constraint k join pg_class c on c.oid = k.conrelid
      where c.relname = 'learn_xp_ledger' and k.contype = 'u'
        and (select array_agg(a.attname::text order by a.attname::text) from pg_attribute a
             where a.attrelid = c.oid and a.attnum = any(k.conkey)) = array['site','source_id','source_type','user_id']), ''
  union all select 8, 'anon has no access to learn_* tables', not exists (
      select 1 from t where has_table_privilege('anon', 'public.' || t.tablename, 'select,insert,update,delete')), ''
  union all select 9, 'authenticated cannot write progress tables', not exists (
      select 1 from progress_tables p where has_table_privilege('authenticated', 'public.' || p.name, 'insert,update,delete')), ''
  union all select 10, 'authenticated cannot read answer keys', not has_table_privilege('authenticated', 'public.learn_question_answers', 'select') or
      exists (select 1 from pg_policies where tablename = 'learn_question_answers' and policyname = 'learn content staff all'), 'staff-only policy'
  union all select 11, 'commit/load/content RPCs exist', to_regprocedure('public.learn_commit_events(uuid,text,jsonb,jsonb)') is not null
      and to_regprocedure('public.learn_load_state(uuid,text,date)') is not null and to_regprocedure('public.learn_load_content(text)') is not null, ''
  union all select 12, 'RPCs not executable by anon/authenticated', not (
      has_function_privilege('anon', 'public.learn_load_content(text)', 'execute') or has_function_privilege('authenticated', 'public.learn_load_content(text)', 'execute')
      or has_function_privilege('authenticated', 'public.learn_commit_events(uuid,text,jsonb,jsonb)', 'execute')
      or has_function_privilege('authenticated', 'public.learn_load_state(uuid,text,date)', 'execute')), ''
  union all select 13, 'publish-workflow trigger is enabled', exists (select 1 from pg_trigger where tgname = 'learn_questions_publish_flow' and tgenabled = 'O'), ''
  union all select 14, 'math curriculum published (4 lessons)', (select count(*) from public.learn_lessons l join public.learn_units u on u.id = l.unit_id
      join public.learn_courses c on c.id = u.course_id join public.learn_subjects s on s.id = c.subject_id
      where s.code = 'math' and l.status = 'PUBLISHED') = 4, ''
  union all select 15, 'english curriculum published (4 lessons)', (select count(*) from public.learn_lessons l join public.learn_units u on u.id = l.unit_id
      join public.learn_courses c on c.id = u.course_id join public.learn_subjects s on s.id = c.subject_id
      where s.code = 'english' and l.status = 'PUBLISHED') = 4, ''
  union all select 16, 'math published questions >= 20', (select count(*) from public.learn_questions q join public.learn_subjects s on s.id = q.subject_id where s.code = 'math' and q.status = 'PUBLISHED') >= 20,
      (select count(*)::text from public.learn_questions q join public.learn_subjects s on s.id = q.subject_id where s.code = 'math' and q.status = 'PUBLISHED')
  union all select 17, 'english published questions >= 20', (select count(*) from public.learn_questions q join public.learn_subjects s on s.id = q.subject_id where s.code = 'english' and q.status = 'PUBLISHED') >= 20,
      (select count(*)::text from public.learn_questions q join public.learn_subjects s on s.id = q.subject_id where s.code = 'english' and q.status = 'PUBLISHED')
  union all select 18, 'content RPC returns math + english bundles', jsonb_array_length(public.learn_load_content('math') -> 'questions') >= 20
      and jsonb_array_length(public.learn_load_content('english') -> 'questions') >= 20, ''
  union all select 19, 'every published question has an answer key and 2 hints', not exists (
      select 1 from public.learn_questions q where q.status = 'PUBLISHED' and (
        not exists (select 1 from public.learn_question_answers a where a.question_id = q.id)
        or (select count(*) from public.learn_question_hints h where h.question_id = q.id) < 2)), ''
  union all select 20, 'staging marker present (this is the staging database)', to_regclass('public.learn_seed_allowed') is not null, ''
)
select ord, check_name, ok, detail from checks
union all
select 99, 'OVERALL', bool_and(ok), case when bool_and(ok) then 'ALL GREEN' else 'FAILED - see rows with ok = false' end from checks
order by 1;

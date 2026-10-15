-- Read-only. Run in the SQL editor of the project you are about to change (staging first, then production), BEFORE and AFTER applying
-- supabase/migrations/202610150044_learning_korean_k7_k10.sql. Writes nothing.
-- Expected AFTER: levels_allow_k10 = true, grade_allows_k10 = true, function_allows_k10 = true, one check per column, service_role only.
select
  (select count(*) from pg_constraint c where c.conrelid = 'public.learn_progress_meta'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ '\mlevel\M') as level_checks,
  (select bool_or(pg_get_constraintdef(c.oid) like '%''K10''%') from pg_constraint c where c.conrelid = 'public.learn_progress_meta'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ '\mlevel\M') as levels_allow_k10,
  (select count(*) from pg_constraint c where c.conrelid = 'public.learn_courses'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ '\mgrade\M') as grade_checks,
  (select bool_or(pg_get_constraintdef(c.oid) like '%''K10''%') from pg_constraint c where c.conrelid = 'public.learn_courses'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ '\mgrade\M') as grade_allows_k10,
  (select pg_get_functiondef('public.learn_set_course_level(uuid,text,text)'::regprocedure) like '%''K10''%') as function_allows_k10,
  has_function_privilege('anon', 'public.learn_set_course_level(uuid,text,text)', 'execute') as anon_can_execute,           -- must be false
  has_function_privilege('authenticated', 'public.learn_set_course_level(uuid,text,text)', 'execute') as authed_can_execute, -- must be false
  has_function_privilege('service_role', 'public.learn_set_course_level(uuid,text,text)', 'execute') as service_can_execute;  -- must be true
-- Existing data that 044 must leave untouched (run before and after; the two results must be identical):
select level, count(*) from public.learn_progress_meta where site = 'korean' group by level order by level;

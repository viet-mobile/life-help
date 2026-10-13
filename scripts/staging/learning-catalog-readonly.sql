-- Run only in the STAGING project's SQL editor or a verified read-only connection.
-- Metadata only: no user rows, seed, migrations, function execution or DDL.
-- This supplements OpenAPI; constraint/policy definitions require operator review.
-- It does not prove migration history. Check the actual history before applying files.
begin transaction read only;
with learning_tables as (
  select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname like 'learn\_%'
), target_columns(table_name, column_name) as (
  values ('learn_questions', 'figure'), ('learn_courses', 'elective'), ('learn_progress_meta', 'level')
), grade_targets(table_name, column_name) as (
  values ('learn_courses', 'school_level'), ('learn_courses', 'grade'), ('learn_student_profiles', 'grade')
)
select jsonb_build_object(
  'report_version', 1,
  'migration_history_table_present', to_regclass('supabase_migrations.schema_migrations') is not null,
  'tables', coalesce((select jsonb_agg(jsonb_build_object(
    'name', t.relname, 'rls', t.relrowsecurity, 'force_rls', t.relforcerowsecurity,
    'anon_select', has_table_privilege('anon', t.oid, 'SELECT'),
    'anon_write', has_table_privilege('anon', t.oid, 'INSERT,UPDATE,DELETE'),
    'service_select', has_table_privilege('service_role', t.oid, 'SELECT')
  ) order by t.relname) from learning_tables t), '[]'::jsonb),
  'columns', (select jsonb_agg(jsonb_build_object(
    'table', x.table_name, 'column', x.column_name, 'exists', a.attnum is not null,
    'type', format_type(a.atttypid, a.atttypmod), 'not_null', a.attnotnull
  ) order by x.table_name, x.column_name) from target_columns x
  left join pg_attribute a on a.attrelid = to_regclass('public.' || x.table_name)
    and a.attname = x.column_name and a.attnum > 0 and not a.attisdropped),
  'grade_constraints', (select jsonb_agg(jsonb_build_object(
    'table', x.table_name, 'column', x.column_name,
    'checks', coalesce((select jsonb_agg(jsonb_build_object(
      'name', k.conname, 'validated', k.convalidated, 'definition', pg_get_constraintdef(k.oid)
    ) order by k.conname) from pg_constraint k join pg_attribute a on a.attrelid = k.conrelid
      and a.attname = x.column_name and a.attnum = any(k.conkey)
      where k.conrelid = to_regclass('public.' || x.table_name) and k.contype = 'c'), '[]'::jsonb)
  ) order by x.table_name, x.column_name) from grade_targets x),
  'staff_policies', coalesce((select jsonb_agg(jsonb_build_object(
    'table', tablename, 'name', policyname, 'roles', roles, 'command', cmd,
    'using', qual, 'with_check', with_check
  ) order by tablename) from pg_policies where schemaname = 'public'
    and policyname = 'learn content staff all'), '[]'::jsonb),
  'staff_predicate', (select jsonb_build_object(
    'exists', p.oid is not null, 'security_definer', p.prosecdef,
    'settings', p.proconfig, 'definition_md5', md5(pg_get_functiondef(p.oid))
  ) from (select to_regprocedure('learn_security.is_staff(text[])') as oid) x
    left join pg_proc p on p.oid = x.oid),
  'remaining_shim_markers', coalesce((select jsonb_agg(jsonb_build_object(
    'class_oid', classoid, 'object_oid', objoid, 'marker', description
  ) order by classoid, objoid) from pg_description where description like 'learn-prereq-shim:v1%'), '[]'::jsonb)
) as learning_catalog_report;
rollback;

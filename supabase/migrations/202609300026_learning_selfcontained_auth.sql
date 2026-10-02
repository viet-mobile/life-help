-- 202609300026: learning platform authorization becomes self-contained.
--
-- 024 (immutable) guards content authoring with security.has_role(array['ADMIN','STAFF']::public.app_role[]), i.e. the
-- MARKETPLACE role model. This migration gives the learning platform its own staff source and cuts the dependency:
--
--   1. public.learn_staff_users   who may author / review learning content (ADMIN | EDITOR). It is authority data:
--                                 RLS on, no policies, no API-role write. The app role (service_role) can only READ it;
--                                 rows are granted by the database owner (SQL), never through the API, so a leaked server
--                                 key cannot make anyone staff. Rows cascade away with their auth.users row.
--   2. learn_security.is_staff()  SECURITY DEFINER, search_path = '', evaluated for auth.uid(). Executable by `authenticated`
--                                 only (RLS policies run as the caller). The schema is private: it is not an API-exposed
--                                 schema, so it cannot be called as a PostgREST RPC.
--   3. the 14 "learn content staff all" policies are replaced to use learn_security.is_staff(). Semantics are unchanged:
--                                 students never write content, only staff do; answer keys / hints / explanations stay
--                                 staff-only; the publish-flow trigger (human reviewer required) is untouched; the trusted
--                                 progress / content RPCs stay service_role only.
--   4. cleanup of 202609300023: ONLY objects carrying the marker 'learn-prereq-shim:v1' are removed (has_role, then app_role,
--                                 then the `security` schema if it is marker-tagged AND empty). No CASCADE: if anything still
--                                 depends on them the whole migration fails. Unmarked objects (the marketplace's own
--                                 app_role / security.has_role / user_roles) are never modified or dropped.
-- Marketplace staff (public.user_roles) do NOT become learning staff; learning staff are granted explicitly.

/* ------------------------------------------------------------------ */
/* 1 + 2. Staff source and its predicate                               */
/* ------------------------------------------------------------------ */

create schema learn_security;
comment on schema learn_security is 'learning platform private helpers (202609300026); not an API-exposed schema';
revoke all on schema learn_security from public;
grant usage on schema learn_security to authenticated; -- needed to evaluate the content policies as the caller; nothing else is granted

create table public.learn_staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('ADMIN', 'EDITOR')),
  granted_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 200)
);
alter table public.learn_staff_users enable row level security; -- no policies: no API role can read through RLS
revoke all on public.learn_staff_users from public, anon, authenticated, service_role;
grant select on public.learn_staff_users to service_role; -- the server's admin gate reads it; it cannot write it

create function learn_security.is_staff(required_roles text[] default array['ADMIN', 'EDITOR'])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.learn_staff_users s
    where s.user_id = (select auth.uid()) and s.role = any(coalesce(required_roles, array['ADMIN', 'EDITOR']))
  )
$$;
revoke all on function learn_security.is_staff(text[]) from public, anon, authenticated, service_role;
grant execute on function learn_security.is_staff(text[]) to authenticated;

/* ------------------------------------------------------------------ */
/* 3. Replace the 14 staff content policies                            */
/* ------------------------------------------------------------------ */

do $policies$
declare t text;
begin
  foreach t in array array[
    'learn_countries','learn_curricula','learn_subjects','learn_courses','learn_units','learn_skills','learn_lessons',
    'learn_lesson_skills','learn_questions','learn_lesson_questions','learn_question_options','learn_question_answers',
    'learn_question_hints','learn_question_explanations']
  loop
    execute format('drop policy "learn content staff all" on public.%I', t);
    execute format($f$create policy "learn content staff all" on public.%I for all to authenticated
      using ((select learn_security.is_staff(array['ADMIN','EDITOR'])))
      with check ((select learn_security.is_staff(array['ADMIN','EDITOR'])))$f$, t);
  end loop;
end
$policies$;

/* ------------------------------------------------------------------ */
/* 4. Remove ONLY what 202609300023 created (marker-tagged), no CASCADE */
/* ------------------------------------------------------------------ */

do $cleanup$
declare
  v_marker constant text := 'learn-prereq-shim:v1';
  v_type_oid oid := to_regtype('public.app_role')::oid;
  v_fn_oid oid := to_regprocedure('security.has_role(public.app_role[])')::oid;
  v_schema_oid oid := to_regnamespace('security')::oid;
  v_type_marked boolean := false;
  v_fn_marked boolean := false;
  v_schema_marked boolean := false;
begin
  if v_type_oid is not null then v_type_marked := coalesce(obj_description(v_type_oid, 'pg_type') like v_marker || '%', false); end if;
  if v_fn_oid is not null then v_fn_marked := coalesce(obj_description(v_fn_oid, 'pg_proc') like v_marker || '%', false); end if;
  if v_schema_oid is not null then v_schema_marked := coalesce(obj_description(v_schema_oid, 'pg_namespace') like v_marker || '%', false); end if;

  if v_type_marked <> v_fn_marked then
    raise exception '202609300026: inconsistent shim markers (app_role marked=%, has_role marked=%); refusing to drop anything', v_type_marked, v_fn_marked
      using errcode = 'P0001';
  end if;

  if v_type_marked and v_fn_marked then
    -- No CASCADE: remaining dependents (policies, columns, functions) make these statements fail and abort the migration.
    drop function security.has_role(public.app_role[]);
    drop type public.app_role;
  else
    raise notice '202609300026: no marker-tagged shim objects (marketplace schema present or already clean): nothing to remove';
  end if;

  if v_schema_marked then
    if exists (select 1 from pg_class where relnamespace = v_schema_oid)
       or exists (select 1 from pg_proc where pronamespace = v_schema_oid)
       or exists (select 1 from pg_type where typnamespace = v_schema_oid) then
      raise exception '202609300026: marker-tagged schema "security" is not empty; refusing to drop it' using errcode = 'P0001';
    end if;
    drop schema security;
  end if;
end
$cleanup$;

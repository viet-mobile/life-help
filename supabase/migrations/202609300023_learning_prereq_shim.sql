-- 202609300023: learning prerequisite shim (TEMPORARY, marker-tagged, removed again by 202609300026).
--
-- Why: the immutable 202609300024_learning_platform.sql creates 14 "learn content staff all" policies that reference
-- public.app_role and security.has_role(...), which the marketplace migration 202609120001 normally provides. A database
-- that does NOT have the marketplace schema (the learning-only production project) needs those two objects to exist for
-- 024 to apply. 202609300026 replaces the policies with learn_security.is_staff() and then removes exactly what this
-- migration created, so the learning platform ends up independent of the marketplace authorization model.
--
-- Safety rules (fail closed, never touch what is not ours):
--   * public.app_role AND security.has_role(public.app_role[]) both exist  -> NO-OP (staging / any marketplace database).
--   * exactly one of them exists (partial / foreign state)                 -> RAISE EXCEPTION, nothing is changed.
--   * neither exists                                                      -> create them, and tag every object this migration
--     creates with the marker below (comment). 202609300026 removes only marker-tagged objects.
--   * has_role here ALWAYS returns false and there is no user_roles table: while the shim exists nobody is "staff".
--   * the enum labels are exactly those of 202609120001 so a later marketplace rollout sees the same type shape.
--   * an existing `security` schema that is not ours is never marked and never dropped.
-- Marker: 'learn-prereq-shim:v1'.

do $shim$
declare
  v_marker constant text := 'learn-prereq-shim:v1';
  v_has_type boolean := to_regtype('public.app_role') is not null;
  v_has_fn boolean := false;
  v_has_schema boolean := to_regnamespace('security') is not null;
begin
  if v_has_type and v_has_schema then
    v_has_fn := to_regprocedure('security.has_role(public.app_role[])') is not null;
  end if;

  if v_has_type and v_has_fn then
    raise notice '202609300023: public.app_role and security.has_role already exist (marketplace schema present): no-op';
    return;
  end if;

  if v_has_type or v_has_fn then
    raise exception '202609300023: partial prerequisite state (public.app_role exists=%, security.has_role exists=%); refusing to guess, nothing changed', v_has_type, v_has_fn
      using errcode = 'P0001';
  end if;

  if not v_has_schema then
    create schema security;
    execute format('comment on schema security is %L', v_marker || ':schema created-by=202609300023 removed-by=202609300026');
  end if;

  create type public.app_role as enum ('CUSTOMER', 'TECHNICIAN', 'ADMIN', 'STAFF');
  execute format('comment on type public.app_role is %L', v_marker || ':type created-by=202609300023 removed-by=202609300026');

  create function security.has_role(required_roles public.app_role[]) returns boolean
    language sql stable set search_path = '' as $f$ select false $f$;
  execute format('comment on function security.has_role(public.app_role[]) is %L', v_marker || ':function created-by=202609300023 removed-by=202609300026');

  -- Same grants the marketplace migration gives, so policy evaluation during the shim's lifetime behaves identically.
  grant usage on schema security to authenticated;
  grant execute on function security.has_role(public.app_role[]) to authenticated;
end
$shim$;

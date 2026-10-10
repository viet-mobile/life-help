-- LIFE.HELP service core, step 3: keep the internal svc__* functions out of the Data API (PostgREST) for EVERY API role.
--
-- Finding on staging: after 040/041 the service_role could still see the svc__* internals in the Data API. They are building blocks of the
-- SECURITY DEFINER API functions, never an API: the Worker only calls svc_* wrappers (see lib/service/db*.ts). 040/041 already revoked them
-- in their own grants loop, evidently not enough on that project, so this forward-only migration removes EXECUTE with exact signatures
-- from PUBLIC, anon, authenticated and service_role. Nothing in 040/041 is edited.
--
-- Why the wrappers keep working: every svc_* API function is SECURITY DEFINER, so it (and everything it calls) runs with the OWNER's
-- privileges; the owner's EXECUTE is never revoked here. A caller needs EXECUTE only on the wrapper it calls.
--
-- Recurrence: svc__lockdown_internals() repeats the revoke for every svc__* function (a migration that adds an internal calls it once at
-- its end), and - where the migration role may create event triggers - svc__lockdown_on_create() revokes any svc__* function the moment it
-- is created. Both are scoped to names starting `svc__` in schema public: no default-privilege change, no effect on any other function.
-- This migration also adds the API marker svc_core_schema_version() so the staging gate can tell whether 042 is applied.

create function public.svc_core_schema_version() returns integer
  language sql stable security definer set search_path = '' as $$ select 42 $$;
revoke all on function public.svc_core_schema_version() from public, anon, authenticated;
grant execute on function public.svc_core_schema_version() to service_role;

-- Takes no input; the only dynamic SQL is a revoke over names read from the catalog.
create function public.svc__lockdown_internals() returns integer
  language plpgsql set search_path = '' as $$
declare f record; n integer := 0;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.proname like 'svc\_\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    n := n + 1;
  end loop;
  return n;
end
$$;

create function public.svc__lockdown_on_create() returns event_trigger
  language plpgsql set search_path = '' as $$
declare c record;
begin
  for c in
    select object_identity from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE FUNCTION', 'ALTER FUNCTION') and object_type = 'function' and schema_name = 'public'
      and object_identity like 'public.svc\_\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', c.object_identity);
  end loop;
end
$$;

select public.svc__lockdown_internals(); -- includes the two functions above

-- Automatic guard for future internals. Creating an event trigger needs a privileged role; where the migration role lacks it the
-- convention (call svc__lockdown_internals() in the migration) and the staging DB gate still enforce the same rule.
do $guard$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'svc_lockdown_on_create') then
    create event trigger svc_lockdown_on_create on ddl_command_end when tag in ('CREATE FUNCTION', 'ALTER FUNCTION')
      execute function public.svc__lockdown_on_create();
  end if;
exception when others then
  raise notice 'event trigger svc_lockdown_on_create not created (%): rely on svc__lockdown_internals() and the DB gate', sqlerrm;
end
$guard$;

-- make the new privileges visible to the Data API without waiting for a restart
notify pgrst, 'reload schema';

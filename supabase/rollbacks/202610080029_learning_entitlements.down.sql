-- Manual rollback for 202610080029_learning_entitlements.sql. NOT run by `supabase db push`. Review and run by hand only.
-- Refuses while any entitlement row exists (no learner's Premium history is ever deleted by this script). Learning objects only; no CASCADE.
do $$
begin
  if exists (select 1 from public.learn_entitlements) then
    raise exception 'learn_entitlements is not empty: migrate or remove those rows first';
  end if;
end $$;
drop function if exists public.learn_revoke_entitlement(uuid);
drop function if exists public.learn_grant_entitlement(uuid, text, text, timestamptz, timestamptz, text);
drop table if exists public.learn_entitlements;

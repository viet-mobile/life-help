-- 202610080029: learning Free / Premium entitlements (server-authoritative access to premium lessons).
--
-- ADDITIVE, LEARNING OBJECTS ONLY, applied AFTER 202610070028. One new table and two service_role-only RPCs; nothing existing changes.
--   public.learn_entitlements      who has Premium, for which learning site(s), from which source, until when
--   learn_grant_entitlement(...)   the ONLY way to add one (admin grant / promotion today; subscription or purchase later)
--   learn_revoke_entitlement(...)  ends one (sets revoked_at; history is kept)
-- No payment is connected: there is no price, checkout or provider here. Progress tables are untouched: an entitlement that expires or
-- is revoked removes access to premium lessons, never XP, mastery, attempts or lesson progress (re-granting restores access).
-- Manual rollback: supabase/rollbacks/202610080029_learning_entitlements.down.sql (refuses while entitlement rows exist).

create table public.learn_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'all' check (scope in ('all', 'math', 'english', 'korean')),
  tier text not null default 'PREMIUM' check (tier = 'PREMIUM'),
  source text not null check (source in ('subscription', 'one_time_purchase', 'promotion', 'grant')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at)
);
create index learn_entitlements_user_idx on public.learn_entitlements(user_id);

alter table public.learn_entitlements enable row level security;
-- No policy: students cannot read or write entitlements through the API; the learning server reads them with the service key.
revoke all on public.learn_entitlements from public, anon, authenticated, service_role;
grant select on public.learn_entitlements to service_role;

create function public.learn_grant_entitlement(p_user uuid, p_scope text, p_source text, p_starts_at timestamptz, p_expires_at timestamptz, p_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.learn_entitlements(user_id, scope, source, starts_at, expires_at, note)
  values (p_user, coalesce(p_scope, 'all'), p_source, coalesce(p_starts_at, now()), p_expires_at, p_note)
  returning id into v_id;
  return v_id;
end $$;

create function public.learn_revoke_entitlement(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.learn_entitlements set revoked_at = coalesce(revoked_at, now()) where id = p_id;
  if not found then raise exception 'unknown entitlement'; end if;
end $$;

revoke all on function public.learn_grant_entitlement(uuid, text, text, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function public.learn_revoke_entitlement(uuid) from public, anon, authenticated;
grant execute on function public.learn_grant_entitlement(uuid, text, text, timestamptz, timestamptz, text) to service_role;
grant execute on function public.learn_revoke_entitlement(uuid) to service_role;

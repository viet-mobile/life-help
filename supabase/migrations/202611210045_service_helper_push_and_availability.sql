-- Migration: 202611210045_helper_push_and_availability.sql
-- Enables mobile background Web Push, quiet hours (do-not-disturb), and busy call toggles for helpers.

-- 1. Helper availability & quiet hours extensions
alter table public.svc_helpers
  add column if not exists quiet_start text default '22:00',
  add column if not exists quiet_end text default '08:00',
  add column if not exists quiet_enabled boolean not null default false,
  add column if not exists allow_calls_while_busy boolean not null default true,
  add column if not exists contact_phone text;

-- 2. Web Push Subscriptions table for helpers
create table if not exists public.svc_helper_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.svc_helpers(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists svc_helper_push_sub_helper_idx
  on public.svc_helper_push_subscriptions (helper_id);

alter table public.svc_helper_push_subscriptions enable row level security;
alter table public.svc_helper_push_subscriptions force row level security;


-- 3. Functions for Helper Settings & Push Subscriptions

-- Get helper's push and availability settings
create or replace function public.svc_h_get_push_settings(p_cred text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare
  h public.svc_helpers;
  sub_count integer;
begin
  select * into h from public.svc_helpers where credential_hash = p_cred and status in ('APPROVED', 'PENDING');
  if not found then perform public.svc__fail('FORBIDDEN'); end if;

  select count(*) into sub_count from public.svc_helper_push_subscriptions where helper_id = h.id;

  return jsonb_build_object(
    'quietStart', coalesce(h.quiet_start, '22:00'),
    'quietEnd', coalesce(h.quiet_end, '08:00'),
    'quietEnabled', h.quiet_enabled,
    'allowCallsWhileBusy', h.allow_calls_while_busy,
    'contactPhone', h.contact_phone,
    'hasPushSubscription', (sub_count > 0),
    'deviceCount', sub_count,
    'subscriptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'endpoint', s.endpoint,
        'p256dh', s.p256dh,
        'auth', s.auth
      ))
      from public.svc_helper_push_subscriptions s
      where s.helper_id = h.id
    ), '[]'::jsonb)
  );
end
$$;

-- Update helper's push and availability settings
create or replace function public.svc_h_update_push_settings(
  p_cred text,
  p_quiet_enabled boolean,
  p_quiet_start text,
  p_quiet_end text,
  p_allow_busy boolean,
  p_phone text default null
) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare
  h public.svc_helpers;
begin
  select * into h from public.svc_helpers where credential_hash = p_cred and status in ('APPROVED', 'PENDING');
  if not found then perform public.svc__fail('FORBIDDEN'); end if;

  update public.svc_helpers
  set quiet_enabled = coalesce(p_quiet_enabled, quiet_enabled),
      quiet_start = coalesce(btrim(p_quiet_start), quiet_start),
      quiet_end = coalesce(btrim(p_quiet_end), quiet_end),
      allow_calls_while_busy = coalesce(p_allow_busy, allow_calls_while_busy),
      contact_phone = case when p_phone is not null then btrim(p_phone) else contact_phone end
  where id = h.id
  returning * into h;

  return public.svc_h_get_push_settings(p_cred);
end
$$;

-- Register or update Web Push Subscription
create or replace function public.svc_h_register_push(
  p_cred text,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_ua text default null
) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare
  h public.svc_helpers;
begin
  select * into h from public.svc_helpers where credential_hash = p_cred and status in ('APPROVED', 'PENDING');
  if not found then perform public.svc__fail('FORBIDDEN'); end if;

  if p_endpoint is null or btrim(p_endpoint) = '' or p_p256dh is null or p_auth is null then
    perform public.svc__fail('INVALID_INPUT');
  end if;

  insert into public.svc_helper_push_subscriptions (helper_id, endpoint, p256dh, auth, user_agent, last_used_at)
  values (h.id, btrim(p_endpoint), btrim(p_p256dh), btrim(p_auth), p_ua, now())
  on conflict (endpoint) do update
  set p256dh = excluded.p256dh,
      auth = excluded.auth,
      user_agent = coalesce(excluded.user_agent, svc_helper_push_subscriptions.user_agent),
      last_used_at = now();

  return jsonb_build_object('ok', true, 'helperId', h.id);
end
$$;

-- Unregister Web Push Subscription
create or replace function public.svc_h_unregister_push(
  p_cred text,
  p_endpoint text
) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare
  h public.svc_helpers;
begin
  select * into h from public.svc_helpers where credential_hash = p_cred;
  if not found then perform public.svc__fail('FORBIDDEN'); end if;

  delete from public.svc_helper_push_subscriptions
  where helper_id = h.id and endpoint = btrim(p_endpoint);

  return jsonb_build_object('ok', true);
end
$$;

-- Enhanced query for candidate helpers taking into account quiet hours and busy status
create or replace function public.svc_a_get_push_targets_for_request(p_request_id uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare
  r public.svc_requests;
  targets jsonb := '[]'::jsonb;
begin
  select * into r from public.svc_requests where id = p_request_id;
  if not found then return '[]'::jsonb; end if;

  select jsonb_agg(jsonb_build_object(
    'helperId', h.id,
    'displayName', h.display_name,
    'phone', h.contact_phone,
    'quietEnabled', h.quiet_enabled,
    'quietStart', coalesce(h.quiet_start, '22:00'),
    'quietEnd', coalesce(h.quiet_end, '08:00'),
    'allowCallsWhileBusy', h.allow_calls_while_busy,
    'activeJobsCount', (
      select count(*) from public.svc_requests cur
      where cur.helper_id = h.id and cur.status in ('ASSIGNED', 'IN_PROGRESS')
    ),
    'subscriptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'endpoint', s.endpoint,
        'p256dh', s.p256dh,
        'auth', s.auth
      ))
      from public.svc_helper_push_subscriptions s
      where s.helper_id = h.id
    ), '[]'::jsonb)
  ))
  into targets
  from public.svc_helpers h
  where public.svc__eligible(h, r, true);

  return coalesce(targets, '[]'::jsonb);
end
$$;

-- 4. Permissions
grant execute on function public.svc_h_get_push_settings(text) to service_role;
grant execute on function public.svc_h_update_push_settings(text, boolean, text, text, boolean, text) to service_role;
grant execute on function public.svc_h_register_push(text, text, text, text, text) to service_role;
grant execute on function public.svc_h_unregister_push(text, text) to service_role;
grant execute on function public.svc_a_get_push_targets_for_request(uuid) to service_role;

revoke all on function public.svc_h_get_push_settings(text) from public, anon, authenticated;
revoke all on function public.svc_h_update_push_settings(text, boolean, text, text, boolean, text) from public, anon, authenticated;
revoke all on function public.svc_h_register_push(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.svc_h_unregister_push(text, text) from public, anon, authenticated;
revoke all on function public.svc_a_get_push_targets_for_request(uuid) from public, anon, authenticated;

-- LIFE.HELP: Web Push subscription storage (browser Push API + VAPID)
-- Migration: 202609260010_web_push_subscriptions.sql
-- Apply to STAGING only (wreebowcbiymodswajwe). Never production (wstdbymmkrqgtsibhcjz).
--
-- Why a new table: no existing table can hold a delivery target (endpoint + p256dh + auth) per
-- owner with a lifecycle. app_notifications stores messages, not devices; referral_identities and
-- payout_destinations have no place for it.
--
-- Ownership (resolved by the server, never by client-supplied ids):
--   CUSTOMER -> referral_identities.id reached via the HttpOnly signed device-owner cookie
--   HELPER   -> helpers.id reached via Supabase Auth -> helpers.auth_user_id
-- The public 8-letter LIFE.HELP ID is not stored here and is never an authorization input.
--
-- Endpoints and keys are sensitive operational data: RLS on, no anon/authenticated access,
-- service_role only. The RPCs return ids/status, never endpoints or keys.
-- Rows are never deleted: unsubscribe -> REVOKED, push service 404/410 -> INVALID.
--
-- Paste the whole file into the STAGING SQL editor and run it once.

begin;

create type public.push_subscription_owner_type as enum ('CUSTOMER', 'HELPER');
create type public.push_subscription_status as enum ('ACTIVE', 'REVOKED', 'INVALID');

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_type public.push_subscription_owner_type not null,
  customer_identity_id uuid references public.referral_identities(id),
  helper_id uuid references public.helpers(id) on delete cascade,
  endpoint text not null check (endpoint ~ '^https://' and length(endpoint) <= 2048),
  endpoint_hash text not null check (endpoint_hash ~ '^[0-9a-f]{64}$'),
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]+={0,2}$' and length(p256dh) between 16 and 256),
  auth text not null check (auth ~ '^[A-Za-z0-9_-]+={0,2}$' and length(auth) between 8 and 64),
  status public.push_subscription_status not null default 'ACTIVE',
  failure_count integer not null default 0 check (failure_count >= 0),
  last_failure_status integer,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  invalidated_at timestamptz,
  constraint push_subscriptions_single_owner check (
    (owner_type = 'CUSTOMER' and customer_identity_id is not null and helper_id is null)
    or (owner_type = 'HELPER' and helper_id is not null and customer_identity_id is null)
  )
);

-- One active row per browser endpoint per owner type. The same browser may be both a customer
-- device and a helper login, so CUSTOMER and HELPER rows for one endpoint may coexist.
create unique index push_subscriptions_endpoint_active_uidx
  on public.push_subscriptions(owner_type, endpoint_hash)
  where status = 'ACTIVE';
create index push_subscriptions_helper_active_idx
  on public.push_subscriptions(helper_id)
  where status = 'ACTIVE' and helper_id is not null;
create index push_subscriptions_customer_active_idx
  on public.push_subscriptions(customer_identity_id)
  where status = 'ACTIVE' and customer_identity_id is not null;

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;
grant select, insert, update on public.push_subscriptions to service_role;

-- Idempotent subscribe. Same owner + endpoint -> refresh keys/last_seen (no duplicate row).
-- Endpoint presented by a different owner of the same type -> the previous row is REVOKED and a
-- new ACTIVE row is created (possession of the endpoint and keys means control of that browser).
-- At most 10 ACTIVE rows per owner; the least recently seen are REVOKED beyond that.
create or replace function public.upsert_push_subscription(
  p_owner_type public.push_subscription_owner_type,
  p_customer_identity_id uuid,
  p_helper_id uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hash text := encode(sha256(convert_to(p_endpoint, 'UTF8')), 'hex');
  v_existing public.push_subscriptions%rowtype;
  v_id uuid;
  v_created boolean := false;
  v_replaced boolean := false;
begin
  -- Serialize concurrent subscribes of the same endpoint.
  perform pg_advisory_xact_lock(hashtextextended('push_subscriptions:' || v_hash, 0));

  select * into v_existing
  from public.push_subscriptions
  where owner_type = p_owner_type and endpoint_hash = v_hash and status = 'ACTIVE'
  for update;

  if found
     and v_existing.customer_identity_id is not distinct from p_customer_identity_id
     and v_existing.helper_id is not distinct from p_helper_id then
    update public.push_subscriptions
    set p256dh = p_p256dh, auth = p_auth, last_seen_at = now(), updated_at = now()
    where id = v_existing.id;
    v_id := v_existing.id;
  else
    if found then
      update public.push_subscriptions
      set status = 'REVOKED', revoked_at = now(), updated_at = now()
      where id = v_existing.id;
      v_replaced := true;
    end if;
    insert into public.push_subscriptions (owner_type, customer_identity_id, helper_id, endpoint, endpoint_hash, p256dh, auth)
    values (p_owner_type, p_customer_identity_id, p_helper_id, p_endpoint, v_hash, p_p256dh, p_auth)
    returning id into v_id;
    v_created := true;
  end if;

  update public.push_subscriptions
  set status = 'REVOKED', revoked_at = now(), updated_at = now()
  where id in (
    select id from public.push_subscriptions
    where status = 'ACTIVE' and owner_type = p_owner_type
      and customer_identity_id is not distinct from p_customer_identity_id
      and helper_id is not distinct from p_helper_id
    order by last_seen_at desc, created_at desc
    offset 10
  );

  return jsonb_build_object('success', true, 'subscription_id', v_id, 'created', v_created, 'replaced_other_owner', v_replaced);
end;
$$;

-- Unsubscribe: only the given owner's ACTIVE row for this endpoint. Another owner's row is never
-- matched, so a caller can only revoke its own subscription.
create or replace function public.revoke_push_subscription(
  p_owner_type public.push_subscription_owner_type,
  p_customer_identity_id uuid,
  p_helper_id uuid,
  p_endpoint text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.push_subscriptions
  set status = 'REVOKED', revoked_at = now(), updated_at = now()
  where owner_type = p_owner_type
    and endpoint_hash = encode(sha256(convert_to(p_endpoint, 'UTF8')), 'hex')
    and status = 'ACTIVE'
    and customer_identity_id is not distinct from p_customer_identity_id
    and helper_id is not distinct from p_helper_id;
  get diagnostics v_count = row_count;
  return jsonb_build_object('success', true, 'revoked', v_count);
end;
$$;

-- Delivery bookkeeping. 404/410 from the push service -> INVALID (never retried).
-- 2xx -> success, failure counter reset. Anything else -> counted failure, stays ACTIVE.
create or replace function public.record_push_delivery_result(
  p_subscription_id uuid,
  p_http_status integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status public.push_subscription_status;
begin
  if p_http_status between 200 and 299 then
    update public.push_subscriptions
    set last_success_at = now(), failure_count = 0, updated_at = now()
    where id = p_subscription_id and status = 'ACTIVE'
    returning status into v_status;
  elsif p_http_status in (404, 410) then
    update public.push_subscriptions
    set status = 'INVALID', invalidated_at = now(), last_failure_status = p_http_status,
        last_failure_at = now(), failure_count = failure_count + 1, updated_at = now()
    where id = p_subscription_id and status = 'ACTIVE'
    returning status into v_status;
  else
    update public.push_subscriptions
    set last_failure_status = p_http_status, last_failure_at = now(),
        failure_count = failure_count + 1, updated_at = now()
    where id = p_subscription_id and status = 'ACTIVE'
    returning status into v_status;
  end if;
  return jsonb_build_object('success', v_status is not null, 'status', v_status);
end;
$$;

revoke all on function public.upsert_push_subscription(public.push_subscription_owner_type, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.revoke_push_subscription(public.push_subscription_owner_type, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_push_delivery_result(uuid, integer) from public, anon, authenticated;
grant execute on function public.upsert_push_subscription(public.push_subscription_owner_type, uuid, uuid, text, text, text) to service_role;
grant execute on function public.revoke_push_subscription(public.push_subscription_owner_type, uuid, uuid, text) to service_role;
grant execute on function public.record_push_delivery_result(uuid, integer) to service_role;

commit;

-- Rollback (review-only):
--   drop function if exists public.record_push_delivery_result(uuid, integer);
--   drop function if exists public.revoke_push_subscription(public.push_subscription_owner_type, uuid, uuid, text);
--   drop function if exists public.upsert_push_subscription(public.push_subscription_owner_type, uuid, uuid, text, text, text);
--   drop table if exists public.push_subscriptions;
--   drop type if exists public.push_subscription_status;
--   drop type if exists public.push_subscription_owner_type;

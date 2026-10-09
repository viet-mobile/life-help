-- 202610090040: LIFE.HELP service core - server-authoritative customer <-> helper workflow.
--
-- Replaces the browser-local demo (localStorage requests / helpers / chat) with database-backed state:
--   customer request -> eligible APPROVED helper accepts (or admin assigns) -> server-persisted chat -> start -> complete.
--
-- Trust model (why this is a separate, additive svc_* family instead of the unused marketplace `orders` tables):
--   * customers are ANONYMOUS and give no phone number, so there is no auth.users / profiles row to hang RLS on. A customer is a
--     random credential held in an HttpOnly cookie; only its SHA-256 is stored. A request additionally has its own access token
--     hash so the customer can open it on another device.
--   * helpers are server-known rows. Registration creates PENDING with a server-issued credential (hash stored, 90-day expiry).
--     Only an admin can move a helper to APPROVED; only APPROVED helpers can accept or work on requests.
--   * every table has RLS enabled with NO policy and all privileges revoked from anon / authenticated. The only way in is the
--     svc_* functions below: SECURITY DEFINER, search_path = '', executable by service_role only. The Next.js server (which alone
--     holds the service key) authenticates the actor (cookie credential / admin session) and calls them; every function re-checks
--     ownership / assignment / approval / state itself, so a leaked UUID, a forged credential or a wrong role gets nothing.
--   * all state transitions, matching and notification events are decided here, in one place.
-- Existing tables are not altered. Payment, referral and crypto are intentionally out of scope.

create table public.svc_customers (
  id uuid primary key default gen_random_uuid(),
  credential_hash text not null unique check (credential_hash ~ '^[0-9a-f]{64}$'),
  locale text not null check (char_length(locale) between 2 and 16),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.svc_helpers (
  id uuid primary key default gen_random_uuid(),
  credential_hash text not null unique check (credential_hash ~ '^[0-9a-f]{64}$'),
  credential_expires_at timestamptz not null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'SUSPENDED', 'DISABLED')),
  is_available boolean not null default false,
  capabilities text[] not null default '{}',
  primary_locale text not null check (char_length(primary_locale) between 2 and 16),
  spoken_locales text[] not null default '{}',
  contact_email text check (contact_email is null or contact_email ~ '^[^@\s]+@[^@\s]+$'),
  created_at timestamptz not null default now(),
  status_changed_at timestamptz,
  status_changed_by text,
  constraint svc_helpers_available_only_when_approved check (not is_available or status = 'APPROVED')
);

create table public.svc_helper_regions (
  id bigint generated always as identity primary key,
  helper_id uuid not null references public.svc_helpers(id) on delete cascade,
  country text not null check (country ~ '^[A-Z]{2}$'),
  sido text,
  gungu text,
  constraint svc_helper_regions_gungu_needs_sido check (gungu is null or sido is not null)
);
create unique index svc_helper_regions_unique on public.svc_helper_regions (helper_id, country, coalesce(sido, ''), coalesce(gungu, ''));

create table public.svc_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.svc_customers(id),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  service_slug text not null check (service_slug ~ '^[a-z0-9-]{1,64}$'),
  country text not null check (country ~ '^[A-Z]{2}$'),
  sido text not null check (char_length(sido) between 1 and 60),
  gungu text not null default '' check (char_length(gungu) <= 60),
  address text not null check (char_length(address) between 1 and 300),
  description text not null check (char_length(description) between 1 and 2000),
  source_locale text not null check (char_length(source_locale) between 2 and 16),
  selected_options text[] not null default '{}',
  status text not null default 'WAITING' check (status in ('WAITING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  helper_id uuid references public.svc_helpers(id),
  assigned_by text,
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint svc_requests_helper_matches_status check (
    (status = 'WAITING' and helper_id is null)
    or (status in ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED') and helper_id is not null)
    or status = 'CANCELLED'
  )
);
create index svc_requests_customer_idx on public.svc_requests (customer_id, created_at desc);
create index svc_requests_open_idx on public.svc_requests (status, service_slug, country, sido);
create index svc_requests_helper_idx on public.svc_requests (helper_id) where helper_id is not null;

create table public.svc_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.svc_requests(id) on delete cascade,
  actor_kind text not null check (actor_kind in ('CUSTOMER', 'HELPER', 'ADMIN', 'SYSTEM')),
  actor_id text,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index svc_request_events_request_idx on public.svc_request_events (request_id, id);

create table public.svc_messages (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  request_id uuid not null references public.svc_requests(id) on delete cascade,
  sender_kind text not null check (sender_kind in ('CUSTOMER', 'HELPER', 'ADMIN', 'SYSTEM')),
  sender_id text,
  body text not null check (char_length(body) between 1 and 2000),
  source_locale text not null check (char_length(source_locale) between 2 and 16),
  -- idempotency identity chosen by the sender per message: a retry of the same send stores (and notifies) once
  client_msg_id uuid,
  created_at timestamptz not null default now()
);
create unique index svc_messages_client_idx on public.svc_messages (request_id, sender_kind, coalesce(sender_id, ''), client_msg_id) where client_msg_id is not null;
create unique index svc_messages_seq_idx on public.svc_messages (seq);
create index svc_messages_request_idx on public.svc_messages (request_id, seq);

-- Machine translations are a CACHE next to the original text. The original (svc_messages.body / svc_requests.description) is never
-- overwritten; a failed translation is simply not stored.
create table public.svc_translations (
  entity text not null check (entity in ('MESSAGE', 'REQUEST')),
  entity_id uuid not null,
  target_locale text not null check (char_length(target_locale) between 2 and 16),
  body text not null check (char_length(body) between 1 and 4000),
  provider text not null,
  created_at timestamptz not null default now(),
  primary key (entity, entity_id, target_locale)
);

-- Notification events. IN_APP rows are the feed each actor reads; they are written in the SAME transaction as the state change.
-- The channel / status / attempts columns are the hook for external channels (push / email / SMS) which are NOT configured yet.
create table public.svc_outbox (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('NEW_REQUEST_AVAILABLE', 'REQUEST_ASSIGNED', 'HELPER_ACCEPTED', 'NEW_CHAT_MESSAGE', 'REQUEST_STARTED', 'REQUEST_COMPLETED')),
  request_id uuid not null references public.svc_requests(id) on delete cascade,
  recipient_kind text not null check (recipient_kind in ('CUSTOMER', 'HELPER', 'ADMIN')),
  recipient_id uuid,
  channel text not null default 'IN_APP' check (channel in ('IN_APP', 'PUSH', 'EMAIL', 'SMS')),
  status text not null default 'PENDING' check (status in ('PENDING', 'DELIVERED', 'FAILED')),
  attempts integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz
);
create index svc_outbox_recipient_idx on public.svc_outbox (recipient_kind, recipient_id, id);

create table public.svc_audit (
  id bigint generated always as identity primary key,
  actor_kind text not null,
  actor_id text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------------------------------------
-- No direct table access for API roles: RLS on, no policy, privileges revoked.
-- ---------------------------------------------------------------------------------------------------------------------------
do $lock$
declare t text;
begin
  foreach t in array array['svc_customers', 'svc_helpers', 'svc_helper_regions', 'svc_requests', 'svc_request_events', 'svc_messages', 'svc_translations', 'svc_outbox', 'svc_audit'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end
$lock$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Internal helpers (not callable by API roles)
-- ---------------------------------------------------------------------------------------------------------------------------
create function public.svc__fail(p_code text) returns void
  language plpgsql set search_path = '' as $$
begin
  raise exception '%', p_code using errcode = 'P0001';
end
$$;

create function public.svc__eligible(h public.svc_helpers, r public.svc_requests, p_require_available boolean) returns boolean
  language sql stable set search_path = '' as $$
  select h.status = 'APPROVED'
    and (not p_require_available or h.is_available)
    and r.service_slug = any (h.capabilities)
    and exists (
      select 1 from public.svc_helper_regions g
      where g.helper_id = h.id and g.country = r.country
        and (g.sido is null or g.sido = r.sido)
        and (g.gungu is null or g.gungu = r.gungu)
    )
$$;

create function public.svc__emit(p_event text, p_request uuid, p_kind text, p_recipient uuid, p_ref text, p_payload jsonb default '{}'::jsonb) returns void
  language sql set search_path = '' as $$
  insert into public.svc_outbox (event_type, request_id, recipient_kind, recipient_id, channel, status, delivered_at, payload, dedupe_key)
  values (p_event, p_request, p_kind, p_recipient, 'IN_APP', 'DELIVERED', now(),
          jsonb_build_object('requestId', p_request) || p_payload,
          p_event || ':' || p_request::text || ':' || p_kind || ':' || coalesce(p_recipient::text, '-') || ':' || coalesce(p_ref, ''))
  on conflict (dedupe_key) do nothing
$$;

create function public.svc__helper_json(h public.svc_helpers) returns jsonb
  language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', h.id, 'displayName', h.display_name, 'status', h.status, 'isAvailable', h.is_available,
    'capabilities', to_jsonb(h.capabilities), 'primaryLocale', h.primary_locale, 'spokenLocales', to_jsonb(h.spoken_locales),
    'credentialExpiresAt', h.credential_expires_at, 'createdAt', h.created_at,
    'regions', coalesce((select jsonb_agg(jsonb_build_object('country', g.country, 'sido', g.sido, 'gungu', g.gungu) order by g.id)
                          from public.svc_helper_regions g where g.helper_id = h.id), '[]'::jsonb))
$$;

-- p_view: 'FULL' (customer / assigned helper / admin) or 'PREVIEW' (an eligible helper before accepting: no street address).
create function public.svc__request_json(r public.svc_requests, p_view text) returns jsonb
  language plpgsql stable set search_path = '' as $$
declare
  v_h public.svc_helpers;
  v_helper jsonb := null;
  v_unmatched boolean := false;
begin
  if r.helper_id is not null then
    select * into v_h from public.svc_helpers where id = r.helper_id;
    v_helper := jsonb_build_object('id', v_h.id, 'displayName', v_h.display_name, 'primaryLocale', v_h.primary_locale, 'spokenLocales', to_jsonb(v_h.spoken_locales));
  end if;
  if r.status = 'WAITING' then
    v_unmatched := not exists (select 1 from public.svc_helpers h where public.svc__eligible(h, r, true));
  end if;
  return jsonb_build_object(
    'id', r.id, 'serviceSlug', r.service_slug, 'country', r.country, 'sido', r.sido, 'gungu', r.gungu,
    'address', case when p_view = 'PREVIEW' then null else r.address end,
    'description', r.description, 'sourceLocale', r.source_locale, 'selectedOptions', to_jsonb(r.selected_options),
    'status', r.status, 'unmatched', v_unmatched, 'helper', v_helper,
    'createdAt', r.created_at, 'assignedAt', r.assigned_at, 'startedAt', r.started_at,
    'completedAt', r.completed_at, 'cancelledAt', r.cancelled_at);
end
$$;

-- A helper whose credential is valid (known, not expired, not DISABLED). Status is NOT checked here: PENDING / SUSPENDED helpers may
-- still read their own status. Work functions additionally require APPROVED.
create function public.svc__helper_by_cred(p_cred text) returns public.svc_helpers
  language plpgsql stable set search_path = '' as $$
declare v public.svc_helpers;
begin
  if p_cred is null or p_cred !~ '^[0-9a-f]{64}$' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into v from public.svc_helpers where credential_hash = p_cred;
  if not found or v.status = 'DISABLED' or v.credential_expires_at <= now() then perform public.svc__fail('FORBIDDEN'); end if;
  return v;
end
$$;

create function public.svc__approved_helper(p_cred text) returns public.svc_helpers
  language plpgsql stable set search_path = '' as $$
declare v public.svc_helpers;
begin
  v := public.svc__helper_by_cred(p_cred);
  if v.status <> 'APPROVED' then perform public.svc__fail('NOT_APPROVED'); end if;
  return v;
end
$$;

-- The request as seen by its customer: owner credential OR the request's own access token. Anything else looks like "not found".
create function public.svc__customer_request(p_cred text, p_token text, p_request uuid, p_lock boolean default false) returns public.svc_requests
  language plpgsql set search_path = '' as $$
declare r public.svc_requests; v_cust uuid;
begin
  if p_lock then
    select * into r from public.svc_requests where id = p_request for update;
  else
    select * into r from public.svc_requests where id = p_request;
  end if;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if p_cred is not null and p_cred ~ '^[0-9a-f]{64}$' then
    select id into v_cust from public.svc_customers where credential_hash = p_cred;
  end if;
  if (v_cust is not null and v_cust = r.customer_id) or (p_token is not null and p_token ~ '^[0-9a-f]{64}$' and p_token = r.token_hash) then
    return r;
  end if;
  perform public.svc__fail('NOT_FOUND');
  return r;
end
$$;

create function public.svc__set_status(r public.svc_requests, p_to text, p_actor_kind text, p_actor_id text, p_note text default null) returns void
  language sql set search_path = '' as $$
  insert into public.svc_request_events (request_id, actor_kind, actor_id, from_status, to_status, note)
  values (r.id, p_actor_kind, p_actor_id, r.status, p_to, p_note)
$$;

-- Tell every eligible, available APPROVED helper about a waiting request (and the admin feed).
create function public.svc__announce_request(r public.svc_requests) returns integer
  language plpgsql set search_path = '' as $$
declare h public.svc_helpers; n integer := 0;
begin
  for h in select * from public.svc_helpers x where public.svc__eligible(x, r, true) loop
    perform public.svc__emit('NEW_REQUEST_AVAILABLE', r.id, 'HELPER', h.id, null, jsonb_build_object('serviceSlug', r.service_slug));
    n := n + 1;
  end loop;
  perform public.svc__emit('NEW_REQUEST_AVAILABLE', r.id, 'ADMIN', null, null, jsonb_build_object('serviceSlug', r.service_slug, 'eligibleHelpers', n));
  return n;
end
$$;

-- A helper became available / approved: tell them about the requests already waiting for them.
create function public.svc__announce_to_helper(h public.svc_helpers) returns void
  language plpgsql set search_path = '' as $$
declare r public.svc_requests;
begin
  for r in select * from public.svc_requests x where x.status = 'WAITING' and public.svc__eligible(h, x, true) loop
    perform public.svc__emit('NEW_REQUEST_AVAILABLE', r.id, 'HELPER', h.id, null, jsonb_build_object('serviceSlug', r.service_slug));
  end loop;
end
$$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Customer
-- ---------------------------------------------------------------------------------------------------------------------------
create function public.svc_c_create_request(
  p_cred text, p_token text, p_locale text, p_service text, p_country text, p_sido text, p_gungu text,
  p_address text, p_description text, p_options text[]
) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare v_cust uuid; r public.svc_requests; n integer; v_open integer; v_desc text := btrim(coalesce(p_description, ''));
begin
  if p_cred is null or p_cred !~ '^[0-9a-f]{64}$' or p_token is null or p_token !~ '^[0-9a-f]{64}$' then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_service is null or p_service !~ '^[a-z0-9-]{1,64}$' or p_country is null or p_country !~ '^[A-Z]{2}$' then perform public.svc__fail('INVALID_INPUT'); end if;
  if btrim(coalesce(p_sido, '')) = '' or btrim(coalesce(p_address, '')) = '' or v_desc = '' then perform public.svc__fail('INVALID_INPUT'); end if;
  if char_length(v_desc) > 2000 or char_length(p_address) > 300 or char_length(p_sido) > 60 or char_length(coalesce(p_gungu, '')) > 60 then perform public.svc__fail('INVALID_INPUT'); end if;
  if coalesce(array_length(p_options, 1), 0) > 20 or p_locale is null or char_length(p_locale) not between 2 and 16 then perform public.svc__fail('INVALID_INPUT'); end if;

  insert into public.svc_customers (credential_hash, locale, last_seen_at) values (p_cred, p_locale, now())
  on conflict (credential_hash) do update set last_seen_at = now(), locale = excluded.locale
  returning id into v_cust;

  select count(*) into v_open from public.svc_requests where customer_id = v_cust and status in ('WAITING', 'ASSIGNED', 'IN_PROGRESS');
  if v_open >= 5 then perform public.svc__fail('RATE_LIMITED'); end if;

  insert into public.svc_requests (customer_id, token_hash, service_slug, country, sido, gungu, address, description, source_locale, selected_options)
  values (v_cust, p_token, p_service, p_country, btrim(p_sido), btrim(coalesce(p_gungu, '')), btrim(p_address), v_desc, p_locale, coalesce(p_options, '{}'))
  returning * into r;
  insert into public.svc_request_events (request_id, actor_kind, actor_id, from_status, to_status) values (r.id, 'CUSTOMER', v_cust::text, null, 'WAITING');
  n := public.svc__announce_request(r);
  return jsonb_build_object('request', public.svc__request_json(r, 'FULL'), 'eligibleHelpers', n);
end
$$;

create function public.svc_c_get_request(p_cred text, p_token text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  r := public.svc__customer_request(p_cred, p_token, p_request);
  return jsonb_build_object('request', public.svc__request_json(r, 'FULL'),
    'events', coalesce((select jsonb_agg(jsonb_build_object('actorKind', e.actor_kind, 'from', e.from_status, 'to', e.to_status, 'at', e.created_at) order by e.id)
                         from public.svc_request_events e where e.request_id = r.id), '[]'::jsonb));
end
$$;

create function public.svc_c_list_requests(p_cred text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare v_cust uuid;
begin
  if p_cred is null or p_cred !~ '^[0-9a-f]{64}$' then return '[]'::jsonb; end if;
  select id into v_cust from public.svc_customers where credential_hash = p_cred;
  if v_cust is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(public.svc__request_json(r, 'FULL') order by r.created_at desc)
                   from (select * from public.svc_requests where customer_id = v_cust order by created_at desc limit 50) r), '[]'::jsonb);
end
$$;

create function public.svc_c_cancel_request(p_cred text, p_token text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  r := public.svc__customer_request(p_cred, p_token, p_request, true);
  if r.status not in ('WAITING', 'ASSIGNED') then perform public.svc__fail('INVALID_STATE'); end if;
  perform public.svc__set_status(r, 'CANCELLED', 'CUSTOMER', r.customer_id::text);
  update public.svc_requests set status = 'CANCELLED', cancelled_at = now(), updated_at = now() where id = r.id returning * into r;
  return public.svc__request_json(r, 'FULL');
end
$$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------------------------------------------------------
create function public.svc_h_register(
  p_cred text, p_expires timestamptz, p_name text, p_primary_locale text, p_spoken text[], p_capabilities text[], p_regions jsonb, p_email text
) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; g jsonb; v_pending integer;
begin
  if p_cred is null or p_cred !~ '^[0-9a-f]{64}$' or p_expires is null or p_expires <= now() or p_expires > now() + interval '400 days' then perform public.svc__fail('INVALID_INPUT'); end if;
  if btrim(coalesce(p_name, '')) = '' or char_length(p_name) > 60 or p_primary_locale is null or char_length(p_primary_locale) not between 2 and 16 then perform public.svc__fail('INVALID_INPUT'); end if;
  if coalesce(array_length(p_capabilities, 1), 0) not between 1 and 30 or exists (select 1 from unnest(p_capabilities) c where c !~ '^[a-z0-9-]{1,64}$') then perform public.svc__fail('INVALID_INPUT'); end if;
  if jsonb_typeof(p_regions) <> 'array' or jsonb_array_length(p_regions) not between 1 and 50 then perform public.svc__fail('INVALID_INPUT'); end if;
  select count(*) into v_pending from public.svc_helpers where status = 'PENDING';
  if v_pending >= 500 then perform public.svc__fail('RATE_LIMITED'); end if;

  insert into public.svc_helpers (credential_hash, credential_expires_at, display_name, primary_locale, spoken_locales, capabilities, contact_email)
  values (p_cred, p_expires, btrim(p_name), p_primary_locale, coalesce(p_spoken, '{}'), p_capabilities, nullif(btrim(coalesce(p_email, '')), ''))
  returning * into h;
  for g in select * from jsonb_array_elements(p_regions) loop
    insert into public.svc_helper_regions (helper_id, country, sido, gungu)
    values (h.id, g->>'country', nullif(btrim(coalesce(g->>'sido', '')), ''), nullif(btrim(coalesce(g->>'gungu', '')), ''))
    on conflict do nothing;
  end loop;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('HELPER', h.id::text, 'HELPER_REGISTERED', 'helper', h.id::text);
  return public.svc__helper_json(h);
end
$$;

create function public.svc_h_me(p_cred text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
begin
  return public.svc__helper_json(public.svc__helper_by_cred(p_cred));
end
$$;

create function public.svc_h_set_available(p_cred text, p_available boolean) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers;
begin
  h := public.svc__approved_helper(p_cred);
  update public.svc_helpers set is_available = coalesce(p_available, false) where id = h.id returning * into h;
  if h.is_available then perform public.svc__announce_to_helper(h); end if;
  return public.svc__helper_json(h);
end
$$;

-- Own name / languages for any live helper. Capabilities and regions can only be changed by an admin once APPROVED (they decide what
-- work the helper may take) - before approval the applicant may still correct them.
create function public.svc_h_update_profile(p_cred text, p_name text, p_primary_locale text, p_spoken text[], p_capabilities text[], p_regions jsonb) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; g jsonb;
begin
  h := public.svc__helper_by_cred(p_cred);
  if (p_capabilities is not null or p_regions is not null) and h.status <> 'PENDING' then perform public.svc__fail('NOT_ALLOWED'); end if;
  if p_name is not null and (btrim(p_name) = '' or char_length(p_name) > 60) then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_primary_locale is not null and char_length(p_primary_locale) not between 2 and 16 then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_capabilities is not null and (coalesce(array_length(p_capabilities, 1), 0) not between 1 and 30 or exists (select 1 from unnest(p_capabilities) c where c !~ '^[a-z0-9-]{1,64}$')) then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_regions is not null and (jsonb_typeof(p_regions) <> 'array' or jsonb_array_length(p_regions) not between 1 and 50) then perform public.svc__fail('INVALID_INPUT'); end if;
  update public.svc_helpers set display_name = coalesce(btrim(p_name), display_name), primary_locale = coalesce(p_primary_locale, primary_locale),
    spoken_locales = coalesce(p_spoken, spoken_locales), capabilities = coalesce(p_capabilities, capabilities) where id = h.id returning * into h;
  if p_regions is not null then
    delete from public.svc_helper_regions where helper_id = h.id;
    for g in select * from jsonb_array_elements(p_regions) loop
      insert into public.svc_helper_regions (helper_id, country, sido, gungu)
      values (h.id, g->>'country', nullif(btrim(coalesce(g->>'sido', '')), ''), nullif(btrim(coalesce(g->>'gungu', '')), '')) on conflict do nothing;
    end loop;
  end if;
  return public.svc__helper_json(h);
end
$$;

-- Eligible WAITING requests (no street address yet) and the helper's own jobs.
create function public.svc_h_list_requests(p_cred text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers;
begin
  h := public.svc__approved_helper(p_cred);
  return jsonb_build_object(
    'available', case when not h.is_available then '[]'::jsonb else coalesce((
      select jsonb_agg(public.svc__request_json(r, 'PREVIEW') order by r.created_at)
      from (select * from public.svc_requests x where x.status = 'WAITING' and public.svc__eligible(h, x, true) order by x.created_at limit 100) r), '[]'::jsonb) end,
    'mine', coalesce((
      select jsonb_agg(public.svc__request_json(r, 'FULL') order by r.created_at desc)
      from (select * from public.svc_requests x where x.helper_id = h.id order by x.created_at desc limit 100) r), '[]'::jsonb));
end
$$;

create function public.svc_h_get_request(p_cred text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; r public.svc_requests;
begin
  h := public.svc__approved_helper(p_cred);
  select * into r from public.svc_requests where id = p_request;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if r.helper_id = h.id then return public.svc__request_json(r, 'FULL'); end if;
  if r.status = 'WAITING' and h.is_available and public.svc__eligible(h, r, true) then return public.svc__request_json(r, 'PREVIEW'); end if;
  perform public.svc__fail('NOT_FOUND');
  return null;
end
$$;

create function public.svc_h_accept(p_cred text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; r public.svc_requests;
begin
  h := public.svc__approved_helper(p_cred);
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if r.status <> 'WAITING' then perform public.svc__fail('INVALID_STATE'); end if;
  if not h.is_available then perform public.svc__fail('NOT_AVAILABLE'); end if;
  if not public.svc__eligible(h, r, true) then perform public.svc__fail('NOT_ELIGIBLE'); end if;
  perform public.svc__set_status(r, 'ASSIGNED', 'HELPER', h.id::text);
  update public.svc_requests set status = 'ASSIGNED', helper_id = h.id, assigned_by = 'HELPER', assigned_at = now(), updated_at = now() where id = r.id returning * into r;
  perform public.svc__emit('HELPER_ACCEPTED', r.id, 'CUSTOMER', r.customer_id, h.id::text, jsonb_build_object('helperId', h.id));
  return public.svc__request_json(r, 'FULL');
end
$$;

create function public.svc_h_start_request(p_cred text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; r public.svc_requests;
begin
  h := public.svc__approved_helper(p_cred);
  select * into r from public.svc_requests where id = p_request for update;
  if not found or r.helper_id is distinct from h.id then perform public.svc__fail('NOT_FOUND'); end if;
  if r.status <> 'ASSIGNED' then perform public.svc__fail('INVALID_STATE'); end if;
  perform public.svc__set_status(r, 'IN_PROGRESS', 'HELPER', h.id::text);
  update public.svc_requests set status = 'IN_PROGRESS', started_at = now(), updated_at = now() where id = r.id returning * into r;
  perform public.svc__emit('REQUEST_STARTED', r.id, 'CUSTOMER', r.customer_id, null);
  return public.svc__request_json(r, 'FULL');
end
$$;

create function public.svc_h_complete_request(p_cred text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; r public.svc_requests;
begin
  h := public.svc__approved_helper(p_cred);
  select * into r from public.svc_requests where id = p_request for update;
  if not found or r.helper_id is distinct from h.id then perform public.svc__fail('NOT_FOUND'); end if;
  if r.status <> 'IN_PROGRESS' then perform public.svc__fail('INVALID_STATE'); end if;
  perform public.svc__set_status(r, 'COMPLETED', 'HELPER', h.id::text);
  update public.svc_requests set status = 'COMPLETED', completed_at = now(), updated_at = now() where id = r.id returning * into r;
  perform public.svc__emit('REQUEST_COMPLETED', r.id, 'CUSTOMER', r.customer_id, null);
  return public.svc__request_json(r, 'FULL');
end
$$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Chat (customer <-> assigned helper, admin may join). Originals only; translations are a separate cache.
-- ---------------------------------------------------------------------------------------------------------------------------
create function public.svc__chat_party(p_kind text, p_cred text, p_token text, p_request uuid, p_for_send boolean, out o_kind text, out o_id uuid, out o_request public.svc_requests)
  language plpgsql set search_path = '' as $$
declare h public.svc_helpers;
begin
  if p_kind = 'CUSTOMER' then
    o_request := public.svc__customer_request(p_cred, p_token, p_request);
    o_kind := 'CUSTOMER'; o_id := o_request.customer_id;
    if p_for_send and o_request.status in ('COMPLETED', 'CANCELLED') then perform public.svc__fail('INVALID_STATE'); end if;
  elsif p_kind = 'HELPER' then
    h := public.svc__approved_helper(p_cred);
    select * into o_request from public.svc_requests where id = p_request;
    if not found or o_request.helper_id is distinct from h.id then perform public.svc__fail('NOT_FOUND'); end if;
    o_kind := 'HELPER'; o_id := h.id;
    if p_for_send and o_request.status not in ('ASSIGNED', 'IN_PROGRESS') then perform public.svc__fail('INVALID_STATE'); end if;
  else
    perform public.svc__fail('FORBIDDEN');
  end if;
end
$$;

create function public.svc__msg_json(m public.svc_messages) returns jsonb
  language sql stable set search_path = '' as $$
  select jsonb_build_object('id', m.id, 'seq', m.seq, 'requestId', m.request_id, 'senderKind', m.sender_kind, 'body', m.body,
                            'sourceLocale', m.source_locale, 'createdAt', m.created_at)
$$;

create function public.svc__post_message(r public.svc_requests, p_kind text, p_sender text, p_body text, p_locale text, p_client_id uuid default null) returns public.svc_messages
  language plpgsql set search_path = '' as $$
declare m public.svc_messages; v_body text := btrim(coalesce(p_body, '')); v_waiting_count integer;
begin
  if v_body = '' or char_length(v_body) > 2000 or p_locale is null or char_length(p_locale) not between 2 and 16 then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_client_id is not null then
    select * into m from public.svc_messages
      where request_id = r.id and sender_kind = p_kind and coalesce(sender_id, '') = coalesce(p_sender, '') and client_msg_id = p_client_id;
    if found then return m; end if; -- a replay of an already stored send: same message, no second notification
  end if;
  if r.status = 'WAITING' and p_kind = 'CUSTOMER' then
    select count(*) into v_waiting_count from public.svc_messages where request_id = r.id and sender_kind = 'CUSTOMER';
    if v_waiting_count >= 20 then perform public.svc__fail('RATE_LIMITED'); end if;
  end if;
  insert into public.svc_messages (request_id, sender_kind, sender_id, body, source_locale, client_msg_id) values (r.id, p_kind, p_sender, v_body, p_locale, p_client_id)
    on conflict (request_id, sender_kind, coalesce(sender_id, ''), client_msg_id) where client_msg_id is not null do nothing
    returning * into m;
  if m.id is null then -- lost a race against the same client id: return the winner, notify nothing
    select * into m from public.svc_messages
      where request_id = r.id and sender_kind = p_kind and coalesce(sender_id, '') = coalesce(p_sender, '') and client_msg_id = p_client_id;
    return m;
  end if;
  -- notify the other side(s); the sender never notifies themself, and nobody is notified about a helper that does not exist yet
  if p_kind <> 'CUSTOMER' then perform public.svc__emit('NEW_CHAT_MESSAGE', r.id, 'CUSTOMER', r.customer_id, m.id::text); end if;
  if p_kind <> 'HELPER' and r.helper_id is not null then perform public.svc__emit('NEW_CHAT_MESSAGE', r.id, 'HELPER', r.helper_id, m.id::text); end if;
  return m;
end
$$;

create function public.svc_msg_send(p_kind text, p_cred text, p_token text, p_request uuid, p_body text, p_locale text, p_client_id uuid default null) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare party record; m public.svc_messages;
begin
  select * into party from public.svc__chat_party(p_kind, p_cred, p_token, p_request, true);
  m := public.svc__post_message(party.o_request, party.o_kind, party.o_id::text, p_body, p_locale, p_client_id);
  return public.svc__msg_json(m);
end
$$;

-- p_target_locale: also return the cached translation into that locale (null when none is cached).
create function public.svc_msg_list(p_kind text, p_cred text, p_token text, p_request uuid, p_after bigint default 0, p_target_locale text default null) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare party record;
begin
  select * into party from public.svc__chat_party(p_kind, p_cred, p_token, p_request, false);
  return coalesce((
    select jsonb_agg(public.svc__msg_json(m) || jsonb_build_object('translation', t.body, 'translationLocale', t.target_locale) order by m.seq)
    from (select * from public.svc_messages x where x.request_id = (party.o_request).id and x.seq > coalesce(p_after, 0) order by x.seq limit 200) m
    left join public.svc_translations t on t.entity = 'MESSAGE' and t.entity_id = m.id and t.target_locale = p_target_locale
  ), '[]'::jsonb);
end
$$;

-- Server-side cache write after a successful machine translation (called by the Next.js server only; failures are never stored).
create function public.svc_translation_put(p_entity text, p_id uuid, p_target text, p_body text, p_provider text) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if p_entity not in ('MESSAGE', 'REQUEST') or btrim(coalesce(p_body, '')) = '' then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_entity = 'MESSAGE' and not exists (select 1 from public.svc_messages where id = p_id) then perform public.svc__fail('NOT_FOUND'); end if;
  if p_entity = 'REQUEST' and not exists (select 1 from public.svc_requests where id = p_id) then perform public.svc__fail('NOT_FOUND'); end if;
  insert into public.svc_translations (entity, entity_id, target_locale, body, provider) values (p_entity, p_id, p_target, p_body, p_provider)
  on conflict (entity, entity_id, target_locale) do nothing;
end
$$;

create function public.svc_request_translation(p_request uuid, p_target text) returns text
  language sql stable security definer set search_path = '' as $$
  select body from public.svc_translations where entity = 'REQUEST' and entity_id = p_request and target_locale = p_target
$$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Notifications feed (per actor)
-- ---------------------------------------------------------------------------------------------------------------------------
create function public.svc_notifications_list(p_kind text, p_cred text, p_after bigint default 0) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_kind = 'CUSTOMER' then
    if p_cred is null or p_cred !~ '^[0-9a-f]{64}$' then return '[]'::jsonb; end if;
    select id into v_id from public.svc_customers where credential_hash = p_cred;
    if v_id is null then return '[]'::jsonb; end if;
  elsif p_kind = 'HELPER' then
    v_id := (public.svc__helper_by_cred(p_cred)).id;
  else
    perform public.svc__fail('FORBIDDEN');
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', o.id, 'event', o.event_type, 'requestId', o.request_id, 'payload', o.payload, 'createdAt', o.created_at, 'readAt', o.read_at) order by o.id)
    from (select * from public.svc_outbox x where x.recipient_kind = p_kind and x.recipient_id = v_id and x.channel = 'IN_APP' and x.id > coalesce(p_after, 0) order by x.id limit 100) o), '[]'::jsonb);
end
$$;

create function public.svc_notifications_mark_read(p_kind text, p_cred text, p_up_to bigint) returns integer
  language plpgsql security definer set search_path = '' as $$
declare v_id uuid; n integer;
begin
  if p_kind = 'CUSTOMER' then
    select id into v_id from public.svc_customers where credential_hash = p_cred;
  elsif p_kind = 'HELPER' then
    v_id := (public.svc__helper_by_cred(p_cred)).id;
  else
    perform public.svc__fail('FORBIDDEN');
  end if;
  if v_id is null then return 0; end if;
  update public.svc_outbox set read_at = now() where recipient_kind = p_kind and recipient_id = v_id and id <= p_up_to and read_at is null;
  get diagnostics n = row_count;
  return n;
end
$$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Admin. The caller (the Next.js server) has already verified the signed admin session; p_admin is that verified identity.
-- ---------------------------------------------------------------------------------------------------------------------------
create function public.svc_a_list_requests(p_status text default null, p_limit integer default 200) returns jsonb
  language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(public.svc__request_json(r, 'FULL') order by r.created_at desc), '[]'::jsonb)
  from (select * from public.svc_requests x where p_status is null or x.status = p_status order by x.created_at desc limit least(greatest(coalesce(p_limit, 200), 1), 500)) r
$$;

create function public.svc_a_get_request(p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  select * into r from public.svc_requests where id = p_request;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  return jsonb_build_object('request', public.svc__request_json(r, 'FULL'),
    'events', coalesce((select jsonb_agg(jsonb_build_object('actorKind', e.actor_kind, 'actorId', e.actor_id, 'from', e.from_status, 'to', e.to_status, 'at', e.created_at) order by e.id)
                         from public.svc_request_events e where e.request_id = r.id), '[]'::jsonb),
    'eligibleHelpers', coalesce((select jsonb_agg(h.id) from public.svc_helpers h where public.svc__eligible(h, r, false)), '[]'::jsonb));
end
$$;

create function public.svc_a_list_helpers(p_status text default null) returns jsonb
  language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(public.svc__helper_json(h) || jsonb_build_object('contactEmail', h.contact_email) order by h.created_at desc), '[]'::jsonb)
  from public.svc_helpers h where p_status is null or h.status = p_status
$$;

create function public.svc_a_set_helper_status(p_admin text, p_helper uuid, p_status text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; r public.svc_requests;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into h from public.svc_helpers where id = p_helper for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if not ((h.status = 'PENDING' and p_status in ('APPROVED', 'DISABLED'))
       or (h.status = 'APPROVED' and p_status in ('SUSPENDED', 'DISABLED'))
       or (h.status = 'SUSPENDED' and p_status in ('APPROVED', 'DISABLED'))) then
    perform public.svc__fail('INVALID_STATE');
  end if;
  update public.svc_helpers set status = p_status, is_available = (p_status = 'APPROVED' and is_available), status_changed_at = now(), status_changed_by = p_admin where id = h.id returning * into h;
  -- a helper that can no longer work gives back jobs they have not started
  if p_status in ('SUSPENDED', 'DISABLED') then
    for r in select * from public.svc_requests where helper_id = h.id and status = 'ASSIGNED' for update loop
      perform public.svc__set_status(r, 'WAITING', 'SYSTEM', null, 'helper ' || lower(p_status));
      update public.svc_requests set status = 'WAITING', helper_id = null, assigned_by = null, assigned_at = null, updated_at = now() where id = r.id returning * into r;
      perform public.svc__announce_request(r);
    end loop;
  end if;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id, metadata) values ('ADMIN', p_admin, 'HELPER_STATUS', 'helper', h.id::text, jsonb_build_object('to', p_status));
  return public.svc__helper_json(h);
end
$$;

create function public.svc_a_update_helper(p_admin text, p_helper uuid, p_capabilities text[], p_regions jsonb) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare h public.svc_helpers; g jsonb;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into h from public.svc_helpers where id = p_helper for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if p_capabilities is not null and (coalesce(array_length(p_capabilities, 1), 0) not between 1 and 30 or exists (select 1 from unnest(p_capabilities) c where c !~ '^[a-z0-9-]{1,64}$')) then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_regions is not null and (jsonb_typeof(p_regions) <> 'array' or jsonb_array_length(p_regions) not between 1 and 50) then perform public.svc__fail('INVALID_INPUT'); end if;
  update public.svc_helpers set capabilities = coalesce(p_capabilities, capabilities) where id = h.id returning * into h;
  if p_regions is not null then
    delete from public.svc_helper_regions where helper_id = h.id;
    for g in select * from jsonb_array_elements(p_regions) loop
      insert into public.svc_helper_regions (helper_id, country, sido, gungu)
      values (h.id, g->>'country', nullif(btrim(coalesce(g->>'sido', '')), ''), nullif(btrim(coalesce(g->>'gungu', '')), '')) on conflict do nothing;
    end loop;
  end if;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('ADMIN', p_admin, 'HELPER_UPDATED', 'helper', h.id::text);
  return public.svc__helper_json(h);
end
$$;

create function public.svc_a_assign(p_admin text, p_request uuid, p_helper uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests; h public.svc_helpers;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if r.status not in ('WAITING', 'ASSIGNED') then perform public.svc__fail('INVALID_STATE'); end if;
  select * into h from public.svc_helpers where id = p_helper;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if h.status <> 'APPROVED' then perform public.svc__fail('NOT_APPROVED'); end if;
  if r.helper_id = h.id then perform public.svc__fail('INVALID_STATE'); end if;
  perform public.svc__set_status(r, 'ASSIGNED', 'ADMIN', p_admin);
  update public.svc_requests set status = 'ASSIGNED', helper_id = h.id, assigned_by = 'ADMIN:' || p_admin, assigned_at = now(), updated_at = now() where id = r.id returning * into r;
  perform public.svc__emit('REQUEST_ASSIGNED', r.id, 'HELPER', h.id, h.id::text || ':' || extract(epoch from r.assigned_at)::text, jsonb_build_object('serviceSlug', r.service_slug));
  perform public.svc__emit('REQUEST_ASSIGNED', r.id, 'CUSTOMER', r.customer_id, h.id::text || ':' || extract(epoch from r.assigned_at)::text, jsonb_build_object('helperId', h.id));
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id, metadata) values ('ADMIN', p_admin, 'REQUEST_ASSIGNED', 'request', r.id::text, jsonb_build_object('helperId', h.id));
  return public.svc__request_json(r, 'FULL');
end
$$;

create function public.svc_a_cancel_request(p_admin text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if r.status in ('COMPLETED', 'CANCELLED') then perform public.svc__fail('INVALID_STATE'); end if;
  perform public.svc__set_status(r, 'CANCELLED', 'ADMIN', p_admin);
  update public.svc_requests set status = 'CANCELLED', cancelled_at = now(), updated_at = now() where id = r.id returning * into r;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('ADMIN', p_admin, 'REQUEST_CANCELLED', 'request', r.id::text);
  return public.svc__request_json(r, 'FULL');
end
$$;

create function public.svc_a_msg_send(p_admin text, p_request uuid, p_body text, p_locale text, p_client_id uuid default null) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests; m public.svc_messages;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into r from public.svc_requests where id = p_request;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if r.status in ('COMPLETED', 'CANCELLED') then perform public.svc__fail('INVALID_STATE'); end if;
  m := public.svc__post_message(r, 'ADMIN', p_admin, p_body, p_locale, p_client_id);
  return public.svc__msg_json(m);
end
$$;

create function public.svc_a_msg_list(p_request uuid, p_after bigint default 0, p_target_locale text default null) returns jsonb
  language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.svc_requests where id = p_request) then perform public.svc__fail('NOT_FOUND'); end if;
  return coalesce((
    select jsonb_agg(public.svc__msg_json(m) || jsonb_build_object('translation', t.body, 'translationLocale', t.target_locale) order by m.seq)
    from (select * from public.svc_messages x where x.request_id = p_request and x.seq > coalesce(p_after, 0) order by x.seq limit 200) m
    left join public.svc_translations t on t.entity = 'MESSAGE' and t.entity_id = m.id and t.target_locale = p_target_locale
  ), '[]'::jsonb);
end
$$;

create function public.svc_a_notifications_list(p_after bigint default 0) returns jsonb
  language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'event', o.event_type, 'requestId', o.request_id, 'payload', o.payload, 'createdAt', o.created_at) order by o.id), '[]'::jsonb)
  from (select * from public.svc_outbox x where x.recipient_kind = 'ADMIN' and x.channel = 'IN_APP' and x.id > coalesce(p_after, 0) order by x.id limit 100) o
$$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- Function privileges: public svc_* API -> service_role only; svc__* internals -> nobody directly.
-- ---------------------------------------------------------------------------------------------------------------------------
do $grants$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname as name
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'svc\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if f.name like 'svc\_\_%' then
      -- Supabase default privileges hand service_role EXECUTE on every new function: internals must not stay callable
      execute format('revoke all on function %s from service_role', f.sig);
    else
      execute format('grant execute on function %s to service_role', f.sig);
    end if;
  end loop;
end
$grants$;

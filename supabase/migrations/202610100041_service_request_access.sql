-- LIFE.HELP service core, step 2: request access credentials with SERVER-SIDE expiry and revocation.
--
-- Two separate credentials guard a customer's request on a device that does not hold the owner's customer cookie:
--   A. LINK credential   (svc_requests.token_hash)  - the secret inside the shareable recovery link. Finite life (30 days from issue),
--                         revocable, rotatable. It is only ever EXCHANGED (svc_c_claim) for a session; it never authorizes reads/writes itself.
--   B. SESSION credential (svc_request_sessions)    - what a browser keeps (HttpOnly cookie). One row per claimed device, own expiry
--                         (90 days from claim), individually revocable. Rotating the link does NOT end sessions; revoke-all ends both.
-- The owner's customer credential (svc_customers, cookie lh_c) is the customer's own anonymous identity, not a request session: it is
-- unaffected by link/session revocation and is what authorizes rotate / revoke for the owner (admins may do the same).
-- Only SHA-256 hashes are stored. Additive: migration 040 is not edited; svc_c_create_request is replaced (one new optional argument).

alter table public.svc_requests
  add column token_expires_at timestamptz not null default (now() + interval '30 days'),
  add column token_revoked_at timestamptz,
  add column token_version integer not null default 1 check (token_version >= 1);

create table public.svc_request_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.svc_requests(id) on delete cascade,
  session_hash text not null unique check (session_hash ~ '^[0-9a-f]{64}$'),
  link_version integer not null,
  via text not null check (via in ('CREATE', 'CLAIM')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index svc_request_sessions_request_idx on public.svc_request_sessions (request_id);

alter table public.svc_request_sessions enable row level security;
alter table public.svc_request_sessions force row level security;
revoke all on table public.svc_request_sessions from public, anon, authenticated;

-- The request as seen by its customer: the owner credential OR a live (unexpired, unrevoked) session of THIS request.
-- Anything else - unknown id, wrong/expired/revoked session, a session of another request - is the same NOT_FOUND.
create or replace function public.svc__customer_request(p_cred text, p_token text, p_request uuid, p_lock boolean default false) returns public.svc_requests
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
  if v_cust is not null and v_cust = r.customer_id then return r; end if;
  if p_token is not null and p_token ~ '^[0-9a-f]{64}$' and exists (
    select 1 from public.svc_request_sessions s
    where s.request_id = r.id and s.session_hash = p_token and s.revoked_at is null and s.expires_at > now()
  ) then
    return r;
  end if;
  perform public.svc__fail('NOT_FOUND');
  return r;
end
$$;

-- The owner (customer credential) of a request; used for rotate / revoke. A session alone cannot manage credentials.
create function public.svc__owner_request(p_cred text, p_request uuid) returns public.svc_requests
  language plpgsql set search_path = '' as $$
declare r public.svc_requests; v_cust uuid;
begin
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if p_cred is not null and p_cred ~ '^[0-9a-f]{64}$' then
    select id into v_cust from public.svc_customers where credential_hash = p_cred;
  end if;
  if v_cust is null or v_cust <> r.customer_id then perform public.svc__fail('NOT_FOUND'); end if;
  return r;
end
$$;

drop function public.svc_c_create_request(text, text, text, text, text, text, text, text, text, text[]);
create function public.svc_c_create_request(
  p_cred text, p_token text, p_locale text, p_service text, p_country text, p_sido text, p_gungu text,
  p_address text, p_description text, p_options text[], p_session text default null
) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare v_cust uuid; r public.svc_requests; n integer; v_open integer; v_desc text := btrim(coalesce(p_description, ''));
begin
  if p_cred is null or p_cred !~ '^[0-9a-f]{64}$' or p_token is null or p_token !~ '^[0-9a-f]{64}$' then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_session is not null and (p_session !~ '^[0-9a-f]{64}$' or p_session = p_token) then perform public.svc__fail('INVALID_INPUT'); end if;
  if p_service is null or p_service !~ '^[a-z0-9-]{1,64}$' or p_country is null or p_country !~ '^[A-Z]{2}$' then perform public.svc__fail('INVALID_INPUT'); end if;
  if btrim(coalesce(p_sido, '')) = '' or btrim(coalesce(p_address, '')) = '' or v_desc = '' then perform public.svc__fail('INVALID_INPUT'); end if;
  if char_length(v_desc) > 2000 or char_length(p_address) > 300 or char_length(p_sido) > 60 or char_length(coalesce(p_gungu, '')) > 60 then perform public.svc__fail('INVALID_INPUT'); end if;
  if coalesce(array_length(p_options, 1), 0) > 20 or p_locale is null or char_length(p_locale) not between 2 and 16 then perform public.svc__fail('INVALID_INPUT'); end if;

  insert into public.svc_customers (credential_hash, locale, last_seen_at) values (p_cred, p_locale, now())
  on conflict (credential_hash) do update set last_seen_at = now(), locale = excluded.locale
  returning id into v_cust;

  select count(*) into v_open from public.svc_requests where customer_id = v_cust and status in ('WAITING', 'ASSIGNED', 'IN_PROGRESS');
  if v_open >= 5 then perform public.svc__fail('RATE_LIMITED'); end if;

  insert into public.svc_requests (customer_id, token_hash, token_expires_at, service_slug, country, sido, gungu, address, description, source_locale, selected_options)
  values (v_cust, p_token, now() + interval '30 days', p_service, p_country, btrim(p_sido), btrim(coalesce(p_gungu, '')), btrim(p_address), v_desc, p_locale, coalesce(p_options, '{}'))
  returning * into r;
  if p_session is not null then
    insert into public.svc_request_sessions (request_id, session_hash, link_version, via, expires_at) values (r.id, p_session, r.token_version, 'CREATE', now() + interval '90 days');
  end if;
  insert into public.svc_request_events (request_id, actor_kind, actor_id, from_status, to_status) values (r.id, 'CUSTOMER', v_cust::text, null, 'WAITING');
  n := public.svc__announce_request(r);
  return jsonb_build_object('request', public.svc__request_json(r, 'FULL'), 'eligibleHelpers', n);
end
$$;

-- Exchange the link credential for a session. Every failure (unknown request, wrong / expired / revoked link) is the same NOT_FOUND.
create function public.svc_c_claim(p_request uuid, p_link text, p_session text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests; v_active integer;
begin
  if p_link is null or p_link !~ '^[0-9a-f]{64}$' or p_session is null or p_session !~ '^[0-9a-f]{64}$' or p_link = p_session then perform public.svc__fail('NOT_FOUND'); end if;
  select * into r from public.svc_requests where id = p_request for update;
  if not found or r.token_hash <> p_link or r.token_revoked_at is not null or r.token_expires_at <= now() then perform public.svc__fail('NOT_FOUND'); end if;
  select count(*) into v_active from public.svc_request_sessions where request_id = r.id and revoked_at is null and expires_at > now();
  if v_active >= 20 then perform public.svc__fail('RATE_LIMITED'); end if;
  insert into public.svc_request_sessions (request_id, session_hash, link_version, via, expires_at) values (r.id, p_session, r.token_version, 'CLAIM', now() + interval '90 days');
  return jsonb_build_object('request', public.svc__request_json(r, 'FULL'));
end
$$;

-- Owner actions (customer credential) -----------------------------------------------------------------------------------------
create function public.svc_c_rotate_link(p_cred text, p_request uuid, p_new_link text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  if p_new_link is null or p_new_link !~ '^[0-9a-f]{64}$' then perform public.svc__fail('INVALID_INPUT'); end if;
  r := public.svc__owner_request(p_cred, p_request);
  if p_new_link = r.token_hash then perform public.svc__fail('INVALID_INPUT'); end if;
  update public.svc_requests set token_hash = p_new_link, token_expires_at = now() + interval '30 days', token_revoked_at = null, token_version = token_version + 1, updated_at = now() where id = r.id;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('CUSTOMER', r.customer_id::text, 'LINK_ROTATED', 'request', r.id::text);
  return jsonb_build_object('ok', true, 'linkExpiresAt', now() + interval '30 days');
end
$$;

create function public.svc_c_revoke_link(p_cred text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  r := public.svc__owner_request(p_cred, p_request);
  update public.svc_requests set token_revoked_at = coalesce(token_revoked_at, now()), updated_at = now() where id = r.id;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('CUSTOMER', r.customer_id::text, 'LINK_REVOKED', 'request', r.id::text);
  return jsonb_build_object('ok', true);
end
$$;

-- Ends the link AND every session of the request (the owner's customer credential is a separate identity and stays valid).
create function public.svc_c_revoke_all_access(p_cred text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests; n integer;
begin
  r := public.svc__owner_request(p_cred, p_request);
  update public.svc_requests set token_revoked_at = coalesce(token_revoked_at, now()), updated_at = now() where id = r.id;
  update public.svc_request_sessions set revoked_at = now() where request_id = r.id and revoked_at is null;
  get diagnostics n = row_count;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id, metadata) values ('CUSTOMER', r.customer_id::text, 'ACCESS_REVOKED_ALL', 'request', r.id::text, jsonb_build_object('sessions', n));
  return jsonb_build_object('ok', true, 'sessionsRevoked', n);
end
$$;

-- Admin actions (the server has already verified the admin session) -------------------------------------------------------------
create function public.svc_a_rotate_link(p_admin text, p_request uuid, p_new_link text) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  if p_new_link is null or p_new_link !~ '^[0-9a-f]{64}$' then perform public.svc__fail('INVALID_INPUT'); end if;
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  if p_new_link = r.token_hash then perform public.svc__fail('INVALID_INPUT'); end if;
  update public.svc_requests set token_hash = p_new_link, token_expires_at = now() + interval '30 days', token_revoked_at = null, token_version = token_version + 1, updated_at = now() where id = r.id;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('ADMIN', p_admin, 'LINK_ROTATED', 'request', r.id::text);
  return jsonb_build_object('ok', true, 'linkExpiresAt', now() + interval '30 days');
end
$$;

create function public.svc_a_revoke_link(p_admin text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  update public.svc_requests set token_revoked_at = coalesce(token_revoked_at, now()), updated_at = now() where id = r.id;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id) values ('ADMIN', p_admin, 'LINK_REVOKED', 'request', r.id::text);
  return jsonb_build_object('ok', true);
end
$$;

create function public.svc_a_revoke_all_access(p_admin text, p_request uuid) returns jsonb
  language plpgsql security definer set search_path = '' as $$
declare r public.svc_requests; n integer;
begin
  if btrim(coalesce(p_admin, '')) = '' then perform public.svc__fail('FORBIDDEN'); end if;
  select * into r from public.svc_requests where id = p_request for update;
  if not found then perform public.svc__fail('NOT_FOUND'); end if;
  update public.svc_requests set token_revoked_at = coalesce(token_revoked_at, now()), updated_at = now() where id = r.id;
  update public.svc_request_sessions set revoked_at = now() where request_id = r.id and revoked_at is null;
  get diagnostics n = row_count;
  insert into public.svc_audit (actor_kind, actor_id, action, entity, entity_id, metadata) values ('ADMIN', p_admin, 'ACCESS_REVOKED_ALL', 'request', r.id::text, jsonb_build_object('sessions', n));
  return jsonb_build_object('ok', true, 'sessionsRevoked', n);
end
$$;

-- Function privileges, same rule as 040: svc_* API -> service_role only; svc__* internals -> nobody directly.
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
      execute format('revoke all on function %s from service_role', f.sig);
    else
      execute format('grant execute on function %s to service_role', f.sig);
    end if;
  end loop;
end
$grants$;

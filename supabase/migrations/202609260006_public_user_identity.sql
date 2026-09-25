-- LIFE.HELP common role-independent public user identity
-- Apply to staging only. This is a display/reference identifier, never an auth credential.

begin;

create table public.public_user_identities (
  id uuid primary key default gen_random_uuid(),
  public_user_id text not null check (public_user_id ~ '^[A-Z]{8}$'),
  device_id_hash text unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index public_user_identities_public_user_uidx on public.public_user_identities(public_user_id);

alter table public.service_requests add column public_user_id text;
alter table public.helpers add column public_user_id text;

create index service_requests_public_user_idx on public.service_requests(public_user_id);
create unique index helpers_public_user_uidx on public.helpers(public_user_id) where public_user_id is not null;

alter table public.public_user_identities enable row level security;
revoke all on public.public_user_identities from anon, authenticated;
grant select, insert, update on public.public_user_identities to service_role;

commit;

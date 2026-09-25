-- LIFE.HELP provider-neutral payout destination foundation
-- Apply to staging only. No real payout provider is connected by this migration.

begin;

create type public.payout_destination_status as enum ('PENDING', 'NOT_VERIFIED', 'ACTIVE', 'REVOKED');

create table public.payout_destinations (
  id uuid primary key default gen_random_uuid(),
  owner_public_id text not null,
  request_id uuid not null references public.service_requests(id),
  country text not null,
  currency text not null,
  payout_method text not null,
  provider text,
  provider_payee_token text not null,
  masked_destination text not null,
  account_holder text,
  status public.payout_destination_status not null default 'NOT_VERIFIED',
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index payout_destinations_request_active_uidx
  on public.payout_destinations(request_id)
  where status in ('PENDING', 'NOT_VERIFIED', 'ACTIVE');
create index payout_destinations_owner_idx on public.payout_destinations(owner_public_id, status);

alter table public.payout_destinations enable row level security;
revoke all on public.payout_destinations from anon, authenticated;
grant select, insert, update on public.payout_destinations to service_role;

commit;

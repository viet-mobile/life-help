-- LIFE.HELP rapid sprint: device-scoped referral identity and one-level attribution
-- Draft only until reviewed and applied to staging.

begin;

create type public.referral_subject_type as enum ('CUSTOMER', 'HELPER', 'ADMIN');
create type public.referral_attribution_status as enum ('ACTIVE', 'EXPIRED', 'REVOKED');

create table public.referral_identities (
  id uuid primary key default gen_random_uuid(),
  referral_id text not null check (referral_id ~ '^[A-Z]{8}$'),
  subject_type public.referral_subject_type not null,
  device_id_hash text not null,
  status public.referral_attribution_status not null default 'ACTIVE',
  reward_consent boolean not null default false,
  consent_updated_at timestamptz,
  last_seen_at timestamptz not null default now(),
  inactive_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index referral_identities_referral_uidx on public.referral_identities(referral_id);
create unique index referral_identities_device_active_uidx
  on public.referral_identities(device_id_hash)
  where status = 'ACTIVE';
create index referral_identities_status_seen_idx
  on public.referral_identities(status, last_seen_at);

create table public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referred_identity_id uuid not null references public.referral_identities(id),
  referrer_identity_id uuid not null references public.referral_identities(id),
  status public.referral_attribution_status not null default 'ACTIVE',
  attributed_at timestamptz not null default now(),
  expired_at timestamptz,
  unique(referred_identity_id),
  check (referred_identity_id <> referrer_identity_id)
);

create index referral_attributions_referrer_idx on public.referral_attributions(referrer_identity_id, status);

alter table public.referral_identities enable row level security;
alter table public.referral_attributions enable row level security;
revoke all on public.referral_identities, public.referral_attributions from anon, authenticated;
grant select, insert, update on public.referral_identities, public.referral_attributions to service_role;

commit;

-- Referral IDs are generated server-side with a cryptographically secure random source.
-- Attribution and rewards must be implemented in a later migration with transaction guards.
-- Rollback: drop referral_attributions, drop referral_identities, then drop the enum types.

-- LIFE.HELP final sprint: settled referral reward ledger
-- Apply to staging only after review. Production is forbidden.

begin;

create type public.referral_reward_state as enum (
  'PENDING', 'QUALIFIED', 'HOLD', 'PAYABLE', 'PAYOUT_PROCESSING', 'PAID', 'REVERSED', 'FAILED'
);

alter table public.referral_identities
  add column subject_key text;

create unique index referral_identities_subject_key_uidx
  on public.referral_identities(subject_type, subject_key)
  where subject_key is not null;

create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  attribution_id uuid not null references public.referral_attributions(id),
  qualifying_request_id uuid not null references public.service_requests(id),
  referrer_identity_id uuid not null references public.referral_identities(id),
  referred_identity_id uuid not null references public.referral_identities(id),
  tier text not null check (tier in ('WLH', 'CLH', 'GLH')),
  reward_amount_krw integer not null check (reward_amount_krw in (1000, 5000, 10000)),
  first_service_discount_krw integer not null check (first_service_discount_krw in (1000, 5000, 10000)),
  state public.referral_reward_state not null default 'PENDING',
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(qualifying_request_id),
  unique(attribution_id, qualifying_request_id)
);

create index referral_rewards_referrer_state_idx on public.referral_rewards(referrer_identity_id, state);
create index referral_rewards_referred_state_idx on public.referral_rewards(referred_identity_id, state);

alter table public.referral_rewards enable row level security;
revoke all on public.referral_rewards from anon, authenticated;
grant select, insert, update on public.referral_rewards to service_role;

commit;

-- LIFE.HELP: two-sided price marketplace + prepaid service requests + payment hold / release ledger
--            + provider-neutral USDC-on-Solana foundation
-- Migration: 202609270014_marketplace_prepay_usdc_foundation.sql
-- Apply to STAGING only (wreebowcbiymodswajwe), after 202609260013. Never production (wstdbymmkrqgtsibhcjz).
--
-- Core invariant: NO unpaid service request becomes active. A request is created only by activating
-- a checkout whose payment was verified server-side (PAID_HELD). Legacy rows (created before this
-- migration) are marked legacy_unfunded; new legacy-style rows exist only for explicit internal
-- test compatibility (operator-token routes), never through a public route.
--
-- Two request modes (explicit, never inferred):
--   HELPER_PRICE_SELECTED  customer picks a Helper's own published price -> pays -> request MATCHED
--   CUSTOMER_OFFER_OPEN    customer proposes and prepays an amount -> request OPEN_FOR_HELPERS ->
--                          an eligible Helper voluntarily accepts the customer's funded terms
--   (LEGACY_AUTO_MATCH marks pre-014 automatic-matching rows only.)
--
-- Money: payment_intents move CREATED/AWAITING_PAYMENT -> ... -> PAID_HELD (verified, held) ->
-- RELEASE_AUTHORIZED (customer pressed "service complete") -> PAYOUT_PROCESSING -> SETTLED, or
-- REFUND_PENDING -> REFUNDED. Helper completion alone never releases funds; there is NO automatic
-- release timer, NO dispute deadline and NO platform fee policy (fee = 0, policy UNCONFIGURED_ZERO).
--
-- Blockchain: native USDC on Solana only (mint pinned per network). Mainnet cannot be enabled by
-- this migration (payment_rail_policies constraint); no rail is enabled by default. The database is
-- the business ledger; the chain / a future PSP is only the money-movement rail. No private keys,
-- seed phrases or wallet credentials are stored anywhere.
--
-- Access: every new money table is SELECT-only for service_role; all writes go through the
-- security-definer RPCs below (anon / authenticated have nothing). Payment rows are never deleted,
-- except staging test fixtures through purge_payment_fixture().
--
-- Request media: photos / videos viewable only in-app (owner + currently assigned Helper), every
-- view logged, permanently deleted when the customer confirms "service complete" (or cancels).
--
-- Paste the whole file into the STAGING SQL editor and run it once. Part 1 commits the new enum
-- value on its own because PostgreSQL forbids using a new enum value in the transaction that adds it.

-- =============================================================================================
-- Part 1: new request status (idempotent)
-- =============================================================================================
begin;
alter type public.service_request_status add value if not exists 'OPEN_FOR_HELPERS';
commit;

-- =============================================================================================
-- Part 2
-- =============================================================================================
begin;

create type public.service_payment_status as enum (
  'CREATED', 'AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING', 'PAID_HELD', 'RELEASE_AUTHORIZED',
  'PAYOUT_PROCESSING', 'SETTLED', 'EXPIRED', 'FAILED', 'REVIEW_REQUIRED', 'REFUND_PENDING', 'REFUNDED'
);

-- ---------------------------------------------------------------------------------------------
-- 1. Payment rail policy (country / capability / network / provider). Everything disabled unless
--    a reviewed row enables it; mainnet cannot be enabled by this migration.
-- ---------------------------------------------------------------------------------------------
create table public.payment_rail_policies (
  country text not null check (country ~ '^[A-Z]{2}$'),
  capability text not null check (capability in ('USDC_CUSTOMER_PAYMENT', 'USDC_HELPER_PAYOUT', 'USDC_REFERRAL_PAYOUT')),
  network text not null check (network in ('solana-devnet', 'solana-mainnet')),
  provider text not null check (provider in ('SOLANA_DIRECT_DEVNET', 'PSP_PENDING')),
  enabled boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  notes text,
  primary key (country, capability, network, provider),
  constraint payment_rail_policies_mainnet_disabled check (network <> 'solana-mainnet' or enabled = false),
  constraint payment_rail_policies_direct_devnet_only check (provider <> 'SOLANA_DIRECT_DEVNET' or network = 'solana-devnet')
);

create or replace function public.payment_rail_enabled(p_country text, p_capability text, p_network text, p_provider text)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.payment_rail_policies
                 where country = p_country and capability = p_capability and network = p_network and provider = p_provider and enabled);
$$;

-- ---------------------------------------------------------------------------------------------
-- 2. Customer offers (CUSTOMER_OFFER_OPEN): the customer is the price proposer. Commercial terms
--    are immutable from creation; a changed offer is a new offer + checkout.
-- ---------------------------------------------------------------------------------------------
create table public.customer_offers (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  service_subitem_id uuid not null references public.service_subitems(id) on delete restrict,
  service_code text not null,
  subitem_code text not null,
  country text not null,
  sido text not null,
  gungu text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  offered_amount numeric(12, 2) not null check (offered_amount > 0 and offered_amount <= 100000000),
  pricing_mode public.pricing_mode not null check (pricing_mode in ('FIXED', 'DIAGNOSTIC_PLUS_QUOTE')),
  included_quantity numeric(10, 2) check (included_quantity is null or included_quantity > 0),
  included_minutes integer check (included_minutes is null or included_minutes between 15 and 1440),
  materials_policy public.materials_policy not null,
  materials_note text check (materials_note is null or length(materials_note) <= 300),
  -- Shown to eligible Helpers: coarse, customer-written requirements (no address / contact data).
  public_note text check (public_note is null or length(public_note) <= 300),
  preferred_window text check (preferred_window is null or length(preferred_window) <= 120),
  status text not null default 'CHECKOUT' check (status in ('CHECKOUT', 'FUNDED', 'CANCELLED', 'EXPIRED')),
  request_id uuid unique,
  created_at timestamptz not null default now(),
  funded_at timestamptz,
  -- An uncertain repair is never a fixed final amount: diagnostic offers never include materials.
  constraint customer_offers_diagnostic_terms check (
    pricing_mode <> 'DIAGNOSTIC_PLUS_QUOTE' or (materials_policy <> 'INCLUDED' and included_quantity is null and included_minutes is null)
  )
);

-- ---------------------------------------------------------------------------------------------
-- 3. Checkouts: everything a request needs, BEFORE it exists. Activated only by verified payment.
-- ---------------------------------------------------------------------------------------------
create table public.service_checkouts (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  customer_display_name text not null,
  customer_locale text not null,
  request_mode text not null check (request_mode in ('HELPER_PRICE_SELECTED', 'CUSTOMER_OFFER_OPEN')),
  service_subitem_id uuid not null references public.service_subitems(id) on delete restrict,
  service_code text not null,
  subitem_code text not null,
  country text not null,
  sido text not null,
  gungu text not null,
  dong text not null default '',
  address text not null default '',
  description text not null default '',
  selected_options text[] not null default '{}',
  -- HELPER_PRICE_SELECTED: the exact offer (row + revision) the customer confirmed.
  helper_price_id uuid,
  helper_price_revision integer,
  helper_id uuid,
  -- CUSTOMER_OFFER_OPEN: the customer's own immutable offer.
  customer_offer_id uuid references public.customer_offers(id) on delete restrict,
  terms jsonb not null,
  fiat_currency text not null check (fiat_currency ~ '^[A-Z]{3}$'),
  fiat_amount numeric(12, 2) not null check (fiat_amount > 0),
  status text not null default 'OPEN' check (status in ('OPEN', 'ACTIVATED', 'ACTIVATION_FAILED', 'EXPIRED', 'CANCELLED')),
  expires_at timestamptz not null,
  request_id uuid unique,
  test_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_checkouts_mode_terms check (
    (request_mode = 'HELPER_PRICE_SELECTED' and helper_price_id is not null and helper_price_revision is not null and helper_id is not null and customer_offer_id is null)
    or (request_mode = 'CUSTOMER_OFFER_OPEN' and customer_offer_id is not null and helper_price_id is null and helper_id is null)
  )
);
create index service_checkouts_customer_idx on public.service_checkouts (customer_id, created_at desc);

-- ---------------------------------------------------------------------------------------------
-- 4. Short Helper reservation for HELPER_PRICE_SELECTED checkouts (payment window protection).
--    DB-enforced: one ACTIVE reservation per Helper and per customer, 10-minute TTL, expired lazily
--    by every reservation-aware RPC. It is NOT an assignment: the Helper is not busy for the
--    matcher; only other checkouts and customer-offer acceptance respect it.
-- ---------------------------------------------------------------------------------------------
create table public.helper_checkout_reservations (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null unique references public.service_checkouts(id) on delete cascade,
  helper_id uuid not null references public.helpers(id) on delete cascade,
  customer_id text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CONSUMED', 'EXPIRED', 'RELEASED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index helper_checkout_reservations_helper_uidx on public.helper_checkout_reservations (helper_id) where status = 'ACTIVE';
create unique index helper_checkout_reservations_customer_uidx on public.helper_checkout_reservations (customer_id) where status = 'ACTIVE';

create or replace function public.expire_helper_reservations()
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.helper_checkout_reservations set status = 'EXPIRED', ended_at = now() where status = 'ACTIVE' and expires_at <= now();
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. Payment quotes (immutable): authoritative fiat terms -> USDC base units at an explicit FX rate.
--    Native USDC only: the mint is pinned per network.
-- ---------------------------------------------------------------------------------------------
create table public.payment_quotes (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.service_checkouts(id) on delete restrict,
  source_currency text not null check (source_currency ~ '^[A-Z]{3}$'),
  source_amount numeric(12, 2) not null check (source_amount > 0),
  asset text not null default 'USDC' check (asset = 'USDC'),
  network text not null check (network in ('solana-devnet', 'solana-mainnet')),
  mint text not null,
  decimals integer not null default 6 check (decimals = 6),
  asset_amount_base_units bigint not null check (asset_amount_base_units > 0),
  -- source currency units per 1 USDC, from an explicit provider (never invented, never from the browser)
  fx_rate numeric(20, 8) not null check (fx_rate > 0),
  fx_provider text not null check (length(fx_provider) between 1 and 60),
  fx_source_ref text,
  rounding text not null default 'CEIL_TO_BASE_UNIT' check (rounding = 'CEIL_TO_BASE_UNIT'),
  quoted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint payment_quotes_native_usdc check (
    (network = 'solana-devnet' and mint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
    or (network = 'solana-mainnet' and mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  )
);

-- ---------------------------------------------------------------------------------------------
-- 6. Payment intents: bind checkout + owner + mode + fiat amount + quote + network / mint /
--    recipient / public reference + expiry. Status moves only through the RPCs (guarded below).
-- ---------------------------------------------------------------------------------------------
create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.service_checkouts(id) on delete restrict,
  quote_id uuid not null unique references public.payment_quotes(id) on delete restrict,
  customer_id text not null,
  request_mode text not null check (request_mode in ('HELPER_PRICE_SELECTED', 'CUSTOMER_OFFER_OPEN')),
  fiat_currency text not null,
  fiat_amount numeric(12, 2) not null check (fiat_amount > 0),
  network text not null,
  asset text not null default 'USDC',
  mint text not null,
  amount_base_units bigint not null check (amount_base_units > 0),
  recipient text not null check (recipient ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  reference text not null unique check (reference ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  provider text not null check (provider in ('SOLANA_DIRECT_DEVNET', 'PSP_PENDING')),
  provider_payment_id text,
  status public.service_payment_status not null default 'AWAITING_PAYMENT',
  expires_at timestamptz not null,
  verified_signature text,
  verified_at timestamptz,
  held_at timestamptz,
  release_authorized_at timestamptz,
  settled_at timestamptz,
  request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One live intent per checkout (a new one only after the previous EXPIRED / FAILED).
create unique index payment_intents_checkout_live_uidx on public.payment_intents (checkout_id) where status not in ('EXPIRED', 'FAILED');

-- ---------------------------------------------------------------------------------------------
-- 7. Observed chain transactions. A signature is recorded once per network (duplicate signature
--    blocked); nothing here marks anything paid by itself.
-- ---------------------------------------------------------------------------------------------
create table public.payment_chain_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.payment_intents(id) on delete restrict,
  network text not null,
  signature text not null check (length(signature) between 32 and 128),
  slot bigint,
  mint text,
  recipient text,
  amount_base_units bigint,
  reference_matched boolean not null,
  tx_success boolean not null,
  confirmation text not null check (confirmation in ('processed', 'confirmed', 'finalized')),
  classification text not null check (classification in (
    'MATCHED', 'PENDING_FINALITY', 'UNDERPAID', 'OVERPAID', 'WRONG_MINT', 'WRONG_RECIPIENT', 'WRONG_NETWORK',
    'MISSING_REFERENCE', 'LATE', 'FAILED_TX', 'EXTRA_PAYMENT'
  )),
  observed_at timestamptz not null default now(),
  unique (network, signature)
);

-- Provider-neutral event log: reuse the existing payment_events table (migration 0002).
alter table public.payment_events add column payment_intent_id uuid references public.payment_intents(id) on delete restrict;
create index payment_events_intent_idx on public.payment_events (payment_intent_id);

-- ---------------------------------------------------------------------------------------------
-- 8. service_requests: explicit request mode, prepaid funding link, completion timestamps.
-- ---------------------------------------------------------------------------------------------
alter table public.service_requests
  add column request_mode text,
  add column legacy_unfunded boolean not null default false,
  add column funding_payment_intent_id uuid references public.payment_intents(id) on delete restrict,
  add column helper_completed_at timestamptz,
  add column customer_completed_at timestamptz;

-- Every existing row predates prepayment: explicit legacy marker + explicit mode.
update public.service_requests
set request_mode = case when selection_mode = 'CUSTOMER_SELECTED' then 'HELPER_PRICE_SELECTED' else 'LEGACY_AUTO_MATCH' end,
    legacy_unfunded = true;

alter table public.service_requests alter column request_mode set not null;
alter table public.service_requests drop constraint service_requests_selection_mode_check;
alter table public.service_requests
  add constraint service_requests_selection_mode_check check (selection_mode in ('AUTO_MATCH', 'CUSTOMER_SELECTED', 'CUSTOMER_OFFER')),
  add constraint service_requests_request_mode_check check (
    (request_mode = 'HELPER_PRICE_SELECTED' and selection_mode = 'CUSTOMER_SELECTED')
    or (request_mode = 'CUSTOMER_OFFER_OPEN' and selection_mode = 'CUSTOMER_OFFER')
    or (request_mode = 'LEGACY_AUTO_MATCH' and selection_mode = 'AUTO_MATCH')
  ),
  -- THE prepaid invariant: a non-legacy request always has its verified funding.
  add constraint service_requests_prepaid_check check (legacy_unfunded or funding_payment_intent_id is not null),
  add constraint service_requests_offer_mode_funded check (request_mode <> 'CUSTOMER_OFFER_OPEN' or funding_payment_intent_id is not null);
create unique index service_requests_funding_uidx on public.service_requests (funding_payment_intent_id) where funding_payment_intent_id is not null;

create or replace function public.service_requests_money_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.request_mode is distinct from old.request_mode then
      raise exception 'service_requests.request_mode is immutable' using errcode = 'P0001';
    end if;
    if new.legacy_unfunded and not old.legacy_unfunded then
      raise exception 'service_requests.legacy_unfunded cannot be set after creation' using errcode = 'P0001';
    end if;
    if old.funding_payment_intent_id is not null and new.funding_payment_intent_id is distinct from old.funding_payment_intent_id then
      raise exception 'service_requests.funding_payment_intent_id is immutable' using errcode = 'P0001';
    end if;
    -- Helper marked the work complete (both modes): recorded, but it never releases money.
    if new.status = 'COMPLETED' and old.status is distinct from new.status and new.helper_completed_at is null then
      new.helper_completed_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger service_requests_money_guard
  before update on public.service_requests
  for each row execute function public.service_requests_money_guard();

-- A funded request can only be created by activation: its payment must be verified (PAID_HELD) and
-- not yet linked to any request. A fabricated / unpaid / reused funding reference is refused.
create or replace function public.service_requests_funding_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.funding_payment_intent_id is not null and not exists (
      select 1 from public.payment_intents i
      where i.id = new.funding_payment_intent_id and i.status = 'PAID_HELD' and i.request_id is null and i.request_mode = new.request_mode) then
    raise exception 'FUNDING_NOT_VERIFIED' using errcode = 'P0001';
  end if;
  if new.funding_payment_intent_id is not null and new.legacy_unfunded then
    raise exception 'A funded request is never legacy_unfunded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger service_requests_funding_guard
  before insert on public.service_requests
  for each row execute function public.service_requests_funding_guard();

-- ---------------------------------------------------------------------------------------------
-- 9. Price history: customer-offer acceptances are selections too (source = CUSTOMER_OFFER).
-- ---------------------------------------------------------------------------------------------
alter table public.request_price_selections
  add column source_kind text not null default 'HELPER_PRICE' check (source_kind in ('HELPER_PRICE', 'CUSTOMER_OFFER')),
  add column source_customer_offer_id uuid references public.customer_offers(id) on delete restrict;
alter table public.request_price_selections alter column source_helper_price_id drop not null;
alter table public.request_price_selections alter column source_price_revision drop not null;
alter table public.request_price_selections alter column source_price_updated_at drop not null;
alter table public.request_price_selections
  add constraint request_price_selections_source_check check (
    (source_kind = 'HELPER_PRICE' and source_helper_price_id is not null and source_price_revision is not null and source_price_updated_at is not null and source_customer_offer_id is null)
    or (source_kind = 'CUSTOMER_OFFER' and source_customer_offer_id is not null)
  );
alter table public.request_price_selections drop constraint request_price_selections_ended_reason_check;
alter table public.request_price_selections
  add constraint request_price_selections_ended_reason_check check (ended_reason in ('HELPER_DECLINED', 'HELPER_TIMEOUT', 'REQUEST_CANCELLED', 'HELPER_UNAVAILABLE_AT_ACTIVATION'));

create or replace function public.request_price_selections_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'ACCEPTED' and new.status = 'ENDED'
     and (new.id, new.request_id, new.selection_version, new.assignment_id, new.helper_id, new.service_subitem_id, new.service_code,
          new.subitem_code, new.pricing_mode, new.currency, new.base_price, new.minimum_charge, new.included_quantity, new.included_minutes,
          new.extra_unit_price, new.extra_hour_price, new.materials_policy, new.materials_note, new.emergency_multiplier, new.night_multiplier,
          new.weekend_multiplier, new.tax_included, new.initial_payable_amount, new.quote_required, new.source_helper_price_id,
          new.source_price_revision, new.source_price_updated_at, new.accepted_at, new.source_kind, new.source_customer_offer_id)
         is not distinct from
         (old.id, old.request_id, old.selection_version, old.assignment_id, old.helper_id, old.service_subitem_id, old.service_code,
          old.subitem_code, old.pricing_mode, old.currency, old.base_price, old.minimum_charge, old.included_quantity, old.included_minutes,
          old.extra_unit_price, old.extra_hour_price, old.materials_policy, old.materials_note, old.emergency_multiplier, old.night_multiplier,
          old.weekend_multiplier, old.tax_included, old.initial_payable_amount, old.quote_required, old.source_helper_price_id,
          old.source_price_revision, old.source_price_updated_at, old.accepted_at, old.source_kind, old.source_customer_offer_id) then
    return new;
  end if;
  raise exception 'request_price_selections: commercial terms are immutable; only ACCEPTED -> ENDED is allowed' using errcode = 'P0001';
end;
$$;

-- No silent substitution, for both customer-driven modes.
create or replace function public.request_assignments_selected_helper_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.service_requests r where r.id = new.request_id and r.selection_mode in ('CUSTOMER_SELECTED', 'CUSTOMER_OFFER'))
     and not exists (select 1 from public.request_price_selections s
                     where s.request_id = new.request_id and s.status = 'ACCEPTED' and s.helper_id = new.helper_id) then
    raise exception 'CUSTOMER_SELECTED_HELPER_LOCKED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 10. Open-offer exclusions, customer completion confirmations, payout obligations, refunds.
-- ---------------------------------------------------------------------------------------------
create table public.customer_offer_exclusions (
  request_id uuid not null references public.service_requests(id) on delete cascade,
  helper_id uuid not null references public.helpers(id) on delete cascade,
  reason text not null check (reason in ('DECLINED_OFFER', 'RELEASED_AFTER_ACCEPT')),
  created_at timestamptz not null default now(),
  primary key (request_id, helper_id)
);

create table public.customer_completion_confirmations (
  request_id uuid primary key references public.service_requests(id) on delete restrict,
  customer_id text not null,
  payment_intent_id uuid not null unique references public.payment_intents(id) on delete restrict,
  confirmed_at timestamptz not null default now()
);

create table public.payout_obligations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('HELPER_SERVICE', 'REFERRAL_REWARD')),
  request_id uuid references public.service_requests(id) on delete restrict,
  payment_intent_id uuid references public.payment_intents(id) on delete restrict,
  helper_id uuid,
  referral_reward_id uuid references public.referral_rewards(id) on delete restrict,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  gross_amount numeric(12, 2) not null check (gross_amount > 0),
  platform_fee_amount numeric(12, 2) not null default 0 check (platform_fee_amount >= 0),
  adjustment_amount numeric(12, 2) not null default 0,
  net_amount numeric(12, 2) generated always as (gross_amount - platform_fee_amount + adjustment_amount) stored,
  -- No fee policy exists yet: every obligation records fee 0 under an explicit unconfigured policy.
  fee_policy text not null default 'UNCONFIGURED_ZERO',
  payout_rail text not null default 'UNASSIGNED' check (payout_rail in ('USDC_SOLANA', 'BANK_PROVIDER', 'UNASSIGNED')),
  payout_destination_id uuid references public.payout_destinations(id) on delete restrict,
  status text not null default 'CREATED' check (status in ('CREATED', 'SUBMITTED', 'PAID', 'FAILED', 'REVIEW_REQUIRED', 'CANCELLED')),
  status_reason text,
  provider text,
  provider_payout_id text,
  chain_network text,
  chain_signature text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint payout_obligations_kind_links check (
    (kind = 'HELPER_SERVICE' and request_id is not null and helper_id is not null and payment_intent_id is not null and referral_reward_id is null)
    or (kind = 'REFERRAL_REWARD' and referral_reward_id is not null and request_id is null)
  ),
  constraint payout_obligations_net_nonnegative check (gross_amount - platform_fee_amount + adjustment_amount >= 0)
);
-- Exactly once: one Helper obligation per request, one per referral reward, one per provider payout / chain signature.
create unique index payout_obligations_request_uidx on public.payout_obligations (request_id) where kind = 'HELPER_SERVICE';
create unique index payout_obligations_reward_uidx on public.payout_obligations (referral_reward_id) where kind = 'REFERRAL_REWARD';
create unique index payout_obligations_provider_uidx on public.payout_obligations (provider, provider_payout_id) where provider_payout_id is not null;
create unique index payout_obligations_chain_uidx on public.payout_obligations (chain_network, chain_signature) where chain_signature is not null;

create table public.service_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.payment_intents(id) on delete restrict,
  checkout_id uuid not null references public.service_checkouts(id) on delete restrict,
  request_id uuid,
  currency text not null,
  amount numeric(12, 2) not null check (amount > 0),
  reason text not null check (reason in ('CUSTOMER_CANCELLED_UNMATCHED', 'ACTIVATION_FAILED', 'OPERATOR_APPROVED', 'PRICE_DIFFERENCE')),
  status text not null default 'PENDING' check (status in ('PENDING', 'SUBMITTED', 'COMPLETED', 'FAILED')),
  provider text,
  provider_refund_id text,
  chain_network text,
  chain_signature text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index service_refunds_full_uidx on public.service_refunds (payment_intent_id) where reason in ('CUSTOMER_CANCELLED_UNMATCHED', 'ACTIVATION_FAILED');
create unique index service_refunds_difference_uidx on public.service_refunds (payment_intent_id) where reason = 'PRICE_DIFFERENCE';
create unique index service_refunds_provider_uidx on public.service_refunds (provider, provider_refund_id) where provider_refund_id is not null;
create unique index service_refunds_chain_uidx on public.service_refunds (chain_network, chain_signature) where chain_signature is not null;


-- ---------------------------------------------------------------------------------------------
-- 10b. Request media (customer photos / videos). Files live ONLY in private storage; this table is
--      the metadata + lifecycle. Viewable only inside LIFE.HELP by the owner and the currently
--      assigned Helper (never after that Helper completed the work); never a public / download URL.
--      Every view is logged (watermark traceability). Deletion is scheduled atomically when the
--      customer confirms "service complete" (or cancels) and the storage worker then deletes the
--      object permanently and records DELETED. A web app cannot technically block screenshots or
--      screen recording: that is disclosed honestly to both sides and deterred by per-viewer watermarks.
-- ---------------------------------------------------------------------------------------------
create table public.request_media (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.service_checkouts(id) on delete restrict,
  request_id uuid,
  customer_id text not null,
  storage_provider text not null check (storage_provider in ('SUPABASE_STORAGE_PRIVATE', 'R2_PRIVATE')),
  object_key text not null unique check (length(object_key) between 8 and 300),
  media_kind text not null check (media_kind in ('IMAGE', 'VIDEO')),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DELETION_PENDING', 'DELETED')),
  deletion_reason text check (deletion_reason in ('SERVICE_COMPLETED', 'REQUEST_CANCELLED', 'CHECKOUT_EXPIRED')),
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint request_media_kind_type check ((media_kind = 'IMAGE') = (content_type like 'image/%')),
  constraint request_media_deletion_state check (
    (status = 'ACTIVE' and deletion_requested_at is null and deleted_at is null)
    or (status = 'DELETION_PENDING' and deletion_requested_at is not null and deletion_reason is not null and deleted_at is null)
    or (status = 'DELETED' and deletion_requested_at is not null and deletion_reason is not null and deleted_at is not null)
  )
);
create index request_media_request_idx on public.request_media (request_id);
create index request_media_pending_idx on public.request_media (status, deletion_requested_at) where status = 'DELETION_PENDING';

create table public.request_media_views (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.request_media(id) on delete cascade,
  viewer_kind text not null check (viewer_kind in ('CUSTOMER', 'HELPER')),
  viewer_ref text not null,
  viewed_at timestamptz not null default now()
);
create index request_media_views_media_idx on public.request_media_views (media_id, viewed_at);

-- Helper payout destinations: the existing provider-neutral table gains a Helper owner. Only a
-- provider payee token / public payout address and a masked form are stored; never keys or seeds.
alter table public.payout_destinations alter column owner_identity_id drop not null;
alter table public.payout_destinations add column owner_helper_id uuid references public.helpers(id) on delete cascade;
alter table public.payout_destinations
  add constraint payout_destinations_one_owner check ((owner_identity_id is null) <> (owner_helper_id is null)),
  add constraint payout_destinations_method check (payout_method in ('BANK_PROVIDER', 'USDC_SOLANA') or owner_identity_id is not null);
create unique index payout_destinations_helper_active_uidx on public.payout_destinations (owner_helper_id) where status in ('PENDING', 'NOT_VERIFIED', 'ACTIVE') and owner_helper_id is not null;

-- ---------------------------------------------------------------------------------------------
-- 11. Immutability / no-delete guards on the money tables.
-- ---------------------------------------------------------------------------------------------
create or replace function public.money_row_no_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('life_help.payment_fixture_purge', true), '') <> 'on' then
    raise exception '% rows are financial history and are never deleted', tg_table_name using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create or replace function public.payment_quotes_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'payment_quotes rows are immutable' using errcode = 'P0001';
end;
$$;
create trigger payment_quotes_immutable before update on public.payment_quotes for each row execute function public.payment_quotes_immutable();

create or replace function public.customer_offers_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.id, new.customer_id, new.service_subitem_id, new.service_code, new.subitem_code, new.country, new.sido, new.gungu, new.currency,
      new.offered_amount, new.pricing_mode, new.included_quantity, new.included_minutes, new.materials_policy, new.materials_note,
      new.public_note, new.preferred_window, new.created_at)
     is distinct from
     (old.id, old.customer_id, old.service_subitem_id, old.service_code, old.subitem_code, old.country, old.sido, old.gungu, old.currency,
      old.offered_amount, old.pricing_mode, old.included_quantity, old.included_minutes, old.materials_policy, old.materials_note,
      old.public_note, old.preferred_window, old.created_at)
     or (old.request_id is not null and new.request_id is distinct from old.request_id)
     or (old.funded_at is not null and new.funded_at is distinct from old.funded_at) then
    raise exception 'customer_offers: commercial terms are immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger customer_offers_guard before update on public.customer_offers for each row execute function public.customer_offers_guard();

create or replace function public.service_checkouts_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.id, new.customer_id, new.request_mode, new.service_subitem_id, new.service_code, new.subitem_code, new.country, new.sido, new.gungu,
      new.dong, new.address, new.description, new.selected_options, new.helper_price_id, new.helper_price_revision, new.helper_id,
      new.customer_offer_id, new.terms, new.fiat_currency, new.fiat_amount, new.expires_at, new.test_fixture, new.created_at)
     is distinct from
     (old.id, old.customer_id, old.request_mode, old.service_subitem_id, old.service_code, old.subitem_code, old.country, old.sido, old.gungu,
      old.dong, old.address, old.description, old.selected_options, old.helper_price_id, old.helper_price_revision, old.helper_id,
      old.customer_offer_id, old.terms, old.fiat_currency, old.fiat_amount, old.expires_at, old.test_fixture, old.created_at)
     or (old.request_id is not null and new.request_id is distinct from old.request_id) then
    raise exception 'service_checkouts: checkout terms are immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger service_checkouts_guard before update on public.service_checkouts for each row execute function public.service_checkouts_guard();

-- Payment intent: commercial binding immutable; status only along the allowed ledger transitions.
create or replace function public.payment_intents_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_from text := old.status::text;
  v_to text := new.status::text;
begin
  if (new.id, new.checkout_id, new.quote_id, new.customer_id, new.request_mode, new.fiat_currency, new.fiat_amount, new.network, new.asset,
      new.mint, new.amount_base_units, new.recipient, new.reference, new.provider, new.expires_at, new.created_at)
     is distinct from
     (old.id, old.checkout_id, old.quote_id, old.customer_id, old.request_mode, old.fiat_currency, old.fiat_amount, old.network, old.asset,
      old.mint, old.amount_base_units, old.recipient, old.reference, old.provider, old.expires_at, old.created_at)
     or (old.verified_signature is not null and new.verified_signature is distinct from old.verified_signature)
     or (old.request_id is not null and new.request_id is distinct from old.request_id) then
    raise exception 'payment_intents: payment binding is immutable' using errcode = 'P0001';
  end if;
  if v_from <> v_to and not (
       (v_from in ('CREATED') and v_to in ('AWAITING_PAYMENT', 'EXPIRED', 'FAILED'))
    or (v_from in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING') and v_to in ('TRANSACTION_SEEN', 'CONFIRMING', 'PAID_HELD', 'EXPIRED', 'FAILED', 'REVIEW_REQUIRED'))
    or (v_from = 'PAID_HELD' and v_to in ('RELEASE_AUTHORIZED', 'REFUND_PENDING'))
    or (v_from = 'RELEASE_AUTHORIZED' and v_to in ('PAYOUT_PROCESSING', 'SETTLED'))
    or (v_from = 'PAYOUT_PROCESSING' and v_to = 'SETTLED')
    or (v_from = 'REFUND_PENDING' and v_to = 'REFUNDED')
    or (v_from = 'REVIEW_REQUIRED' and v_to in ('PAID_HELD', 'REFUND_PENDING', 'FAILED'))
  ) then
    raise exception 'payment_intents: invalid status transition % -> %', v_from, v_to using errcode = 'P0001';
  end if;
  if v_to = 'PAID_HELD' and (new.verified_signature is null or new.verified_at is null) then
    raise exception 'payment_intents: PAID_HELD requires a verified transaction' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger payment_intents_guard before update on public.payment_intents for each row execute function public.payment_intents_guard();

create trigger payment_intents_no_delete before delete on public.payment_intents for each row execute function public.money_row_no_delete();
create trigger payment_quotes_no_delete before delete on public.payment_quotes for each row execute function public.money_row_no_delete();
create trigger payment_chain_transactions_no_delete before delete on public.payment_chain_transactions for each row execute function public.money_row_no_delete();
create trigger service_checkouts_no_delete before delete on public.service_checkouts for each row execute function public.money_row_no_delete();
create trigger customer_offers_no_delete before delete on public.customer_offers for each row execute function public.money_row_no_delete();
create trigger payout_obligations_no_delete before delete on public.payout_obligations for each row execute function public.money_row_no_delete();
create trigger service_refunds_no_delete before delete on public.service_refunds for each row execute function public.money_row_no_delete();
create trigger customer_completion_confirmations_no_delete before delete on public.customer_completion_confirmations for each row execute function public.money_row_no_delete();

-- ---------------------------------------------------------------------------------------------
-- 12. Access: SELECT-only for service_role; every write goes through the RPCs.
-- ---------------------------------------------------------------------------------------------
alter table public.payment_rail_policies enable row level security;
alter table public.customer_offers enable row level security;
alter table public.service_checkouts enable row level security;
alter table public.helper_checkout_reservations enable row level security;
alter table public.payment_quotes enable row level security;
alter table public.payment_intents enable row level security;
alter table public.payment_chain_transactions enable row level security;
alter table public.customer_offer_exclusions enable row level security;
alter table public.customer_completion_confirmations enable row level security;
alter table public.payout_obligations enable row level security;
alter table public.service_refunds enable row level security;
alter table public.request_media enable row level security;
alter table public.request_media_views enable row level security;
revoke all on public.request_media, public.request_media_views from public, anon, authenticated, service_role;
grant select on public.request_media, public.request_media_views to service_role;
revoke all on public.payment_rail_policies, public.customer_offers, public.service_checkouts, public.helper_checkout_reservations,
  public.payment_quotes, public.payment_intents, public.payment_chain_transactions, public.customer_offer_exclusions,
  public.customer_completion_confirmations, public.payout_obligations, public.service_refunds
  from public, anon, authenticated, service_role;
grant select on public.payment_rail_policies, public.customer_offers, public.service_checkouts, public.helper_checkout_reservations,
  public.payment_quotes, public.payment_intents, public.payment_chain_transactions, public.customer_offer_exclusions,
  public.customer_completion_confirmations, public.payout_obligations, public.service_refunds
  to service_role;
revoke all on public.payment_events from anon, authenticated;
-- Funding / mode / completion columns of service_requests are written only by the RPCs: the
-- Worker keeps UPDATE on the ordinary lifecycle columns only.
revoke update on public.service_requests from service_role;
grant update (customer_display_name, customer_locale, service_slug, country, sido, gungu, dong, address, description, selected_options,
  status, updated_at, selection_mode) on public.service_requests to service_role;

-- =============================================================================================
-- 13. RPCs
-- =============================================================================================

create or replace function public.log_payment_event(p_intent_id uuid, p_event_type text, p_payload jsonb)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.payment_events (provider, provider_event_id, provider_payment_id, event_type, processing_status, payload, payment_intent_id, processed_at)
  values ('LIFE_HELP_LEDGER', gen_random_uuid()::text, p_intent_id::text, p_event_type, 'PROCESSED', coalesce(p_payload, '{}'::jsonb), p_intent_id, now());
$$;

-- Helper can take new work now: active, on duty, qualified, in the region, not busy.
create or replace function public.helper_is_available(p_helper_id uuid, p_service_code text, p_country text, p_sido text, p_gungu text)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.helpers h
    where h.id = p_helper_id and h.is_active and h.on_duty
      and exists (select 1 from public.helper_services hs where hs.helper_id = h.id and hs.service_slug = p_service_code)
      and exists (select 1 from public.helper_regions hr where hr.helper_id = h.id and hr.country = p_country and hr.sido = p_sido
                  and (hr.gungu = p_gungu or hr.gungu = '전체' or hr.gungu = ''))
      and not exists (select 1 from public.request_assignments ra where ra.helper_id = h.id and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED'))
  );
$$;

create or replace function public.helper_reserved_elsewhere(p_helper_id uuid, p_checkout_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.helper_checkout_reservations r
                 where r.helper_id = p_helper_id and r.status = 'ACTIVE' and r.expires_at > now()
                   and r.checkout_id is distinct from p_checkout_id);
$$;

-- Offer discovery (012) now also hides Helpers held by another customer's payment window.
create or replace function public.list_customer_offers(
  p_service_code text, p_subitem_code text, p_country text, p_sido text, p_gungu text
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(o order by o_rank_rating desc, o_rank_jobs desc, o_price asc), '[]'::jsonb)
  from (
    select distinct on (p.id)
      jsonb_build_object(
        'price_id', p.id, 'revision', p.revision, 'helper_id', h.id,
        'helper_alias', 'Helper ' || upper(substr(md5(h.id::text), 1, 4)),
        'rating', h.rating, 'completed_jobs', h.completed_jobs, 'spoken_locales', to_jsonb(h.spoken_locales),
        'service_code', s.service_code, 'subitem_code', s.subitem_code,
        'pricing_mode', p.pricing_mode, 'currency', p.currency, 'base_price', p.base_price,
        'minimum_charge', p.minimum_charge, 'included_quantity', p.included_quantity, 'included_minutes', p.included_minutes,
        'extra_unit_price', p.extra_unit_price, 'extra_hour_price', p.extra_hour_price,
        'materials_policy', p.materials_policy, 'materials_note', p.materials_note,
        'emergency_multiplier', p.emergency_multiplier, 'night_multiplier', p.night_multiplier,
        'weekend_multiplier', p.weekend_multiplier, 'tax_included', p.tax_included
      ) as o,
      h.rating as o_rank_rating, h.completed_jobs as o_rank_jobs, p.base_price as o_price
    from public.helper_service_prices p
    join public.service_subitems s on s.id = p.service_subitem_id
    join public.helpers h on h.id = p.helper_id
    join public.helper_services hs on hs.helper_id = h.id and hs.service_slug = s.service_code
    join public.helper_regions hr on hr.helper_id = h.id
    where s.service_code = p_service_code and s.subitem_code = p_subitem_code and s.active
      and p.status = 'ACTIVE' and p.pricing_mode = any (s.allowed_pricing_modes)
      and h.is_active = true and h.on_duty = true
      and hr.country = p_country and hr.sido = p_sido and (hr.gungu = p_gungu or hr.gungu = '전체' or hr.gungu = '')
      and not exists (select 1 from public.request_assignments ra where ra.helper_id = h.id and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED'))
      and not exists (select 1 from public.helper_checkout_reservations r where r.helper_id = h.id and r.status = 'ACTIVE' and r.expires_at > now())
    order by p.id
    limit 50
  ) ranked;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13a. Checkout, MODE A: the customer confirmed Helper price row + revision. Validates the offer,
--      reserves the Helper for the payment window, snapshots the terms. No request, no assignment.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_helper_price_checkout(
  p_customer_id text, p_customer_display_name text, p_customer_locale text,
  p_country text, p_sido text, p_gungu text, p_dong text, p_address text, p_description text, p_selected_options text[],
  p_price_id uuid, p_price_revision integer, p_test_fixture boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_price public.helper_service_prices%rowtype;
  v_subitem public.service_subitems%rowtype;
  v_checkout_id uuid;
  v_amount numeric(12, 2);
  v_expires timestamptz := now() + interval '10 minutes';
  v_constraint text;
begin
  perform public.expire_helper_reservations();
  select * into v_price from public.helper_service_prices where id = p_price_id for update;
  if not found or v_price.status <> 'ACTIVE' then return jsonb_build_object('success', false, 'code', 'OFFER_UNAVAILABLE'); end if;
  if v_price.revision <> p_price_revision then
    return jsonb_build_object('success', false, 'code', 'PRICE_CHANGED', 'current_revision', v_price.revision);
  end if;
  select * into v_subitem from public.service_subitems where id = v_price.service_subitem_id;
  if not v_subitem.active or not (v_price.pricing_mode = any (v_subitem.allowed_pricing_modes)) then
    return jsonb_build_object('success', false, 'code', 'OFFER_UNAVAILABLE');
  end if;
  perform 1 from public.helpers where id = v_price.helper_id for update;
  if not public.helper_is_available(v_price.helper_id, v_subitem.service_code, p_country, p_sido, p_gungu)
     or public.helper_reserved_elsewhere(v_price.helper_id, null) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
  end if;
  -- A customer holds at most one Helper at a time: a new choice releases the previous one.
  update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where customer_id = p_customer_id and status = 'ACTIVE';
  update public.service_checkouts c set status = 'EXPIRED', updated_at = now()
  where c.customer_id = p_customer_id and c.status = 'OPEN' and c.request_mode = 'HELPER_PRICE_SELECTED'
    and not exists (select 1 from public.payment_intents i where i.checkout_id = c.id and i.status not in ('EXPIRED', 'FAILED', 'AWAITING_PAYMENT'));

  v_amount := public.helper_price_initial_amount(v_price);
  begin
    insert into public.service_checkouts (
      customer_id, customer_display_name, customer_locale, request_mode, service_subitem_id, service_code, subitem_code,
      country, sido, gungu, dong, address, description, selected_options, helper_price_id, helper_price_revision, helper_id,
      terms, fiat_currency, fiat_amount, expires_at, test_fixture
    ) values (
      p_customer_id, p_customer_display_name, p_customer_locale, 'HELPER_PRICE_SELECTED', v_subitem.id, v_subitem.service_code, v_subitem.subitem_code,
      p_country, p_sido, p_gungu, coalesce(p_dong, ''), coalesce(p_address, ''), coalesce(p_description, ''), coalesce(p_selected_options, '{}'),
      v_price.id, v_price.revision, v_price.helper_id,
      jsonb_build_object('pricing_mode', v_price.pricing_mode, 'currency', v_price.currency, 'base_price', v_price.base_price,
        'minimum_charge', v_price.minimum_charge, 'included_quantity', v_price.included_quantity, 'included_minutes', v_price.included_minutes,
        'extra_unit_price', v_price.extra_unit_price, 'extra_hour_price', v_price.extra_hour_price, 'materials_policy', v_price.materials_policy,
        'materials_note', v_price.materials_note, 'emergency_multiplier', v_price.emergency_multiplier, 'night_multiplier', v_price.night_multiplier,
        'weekend_multiplier', v_price.weekend_multiplier, 'tax_included', v_price.tax_included, 'price_updated_at', v_price.updated_at),
      v_price.currency, v_amount, v_expires, coalesce(p_test_fixture, false)
    ) returning id into v_checkout_id;
    insert into public.helper_checkout_reservations (checkout_id, helper_id, customer_id, expires_at)
    values (v_checkout_id, v_price.helper_id, p_customer_id, v_expires);
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint in ('helper_checkout_reservations_helper_uidx', 'helper_checkout_reservations_customer_uidx') then
        return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
      end if;
      raise;
  end;
  return jsonb_build_object('success', true, 'checkout_id', v_checkout_id, 'request_mode', 'HELPER_PRICE_SELECTED',
    'fiat_currency', v_price.currency, 'fiat_amount', v_amount, 'expires_at', v_expires);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13b. Checkout, MODE B: the customer's own offer (FIXED, or DIAGNOSTIC_PLUS_QUOTE where the
--      detailed service is quote-based). Nothing is visible to any Helper until payment is verified.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_customer_offer_checkout(
  p_customer_id text, p_customer_display_name text, p_customer_locale text,
  p_country text, p_sido text, p_gungu text, p_dong text, p_address text, p_description text, p_selected_options text[],
  p_service_code text, p_subitem_code text, p_offer jsonb, p_test_fixture boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subitem public.service_subitems%rowtype;
  v_mode public.pricing_mode;
  v_materials public.materials_policy;
  v_offer_id uuid;
  v_checkout_id uuid;
  v_amount numeric(12, 2);
  v_raw_amount numeric;
  v_currency text;
  v_expires timestamptz := now() + interval '30 minutes';
  v_constraint text;
begin
  select * into v_subitem from public.service_subitems where service_code = p_service_code and subitem_code = p_subitem_code and active;
  if not found then return jsonb_build_object('success', false, 'code', 'SUBITEM_NOT_FOUND'); end if;
  begin
    v_mode := (p_offer ->> 'pricing_mode')::public.pricing_mode;
    v_materials := (p_offer ->> 'materials_policy')::public.materials_policy;
    v_raw_amount := (p_offer ->> 'offered_amount')::numeric;
  exception when others then
    return jsonb_build_object('success', false, 'code', 'INVALID_OFFER', 'reason', 'format');
  end;
  if v_mode is null or v_mode not in ('FIXED', 'DIAGNOSTIC_PLUS_QUOTE') or not (v_mode = any (v_subitem.allowed_pricing_modes)) then
    return jsonb_build_object('success', false, 'code', 'OFFER_MODE_NOT_ALLOWED');
  end if;
  -- Validate the raw value: never silently round a customer's amount.
  if v_raw_amount is null or v_raw_amount <> round(v_raw_amount, 2) or v_raw_amount <= 0 or v_raw_amount > 100000000 then
    return jsonb_build_object('success', false, 'code', 'INVALID_OFFER', 'reason', 'amount');
  end if;
  v_amount := v_raw_amount;
  v_currency := p_offer ->> 'currency';
  begin
    insert into public.customer_offers (
      customer_id, service_subitem_id, service_code, subitem_code, country, sido, gungu, currency, offered_amount, pricing_mode,
      included_quantity, included_minutes, materials_policy, materials_note, public_note, preferred_window
    ) values (
      p_customer_id, v_subitem.id, v_subitem.service_code, v_subitem.subitem_code, p_country, p_sido, p_gungu, v_currency, v_amount, v_mode,
      nullif(p_offer ->> 'included_quantity', '')::numeric, nullif(p_offer ->> 'included_minutes', '')::integer, v_materials,
      nullif(p_offer ->> 'materials_note', ''), nullif(p_offer ->> 'public_note', ''), nullif(p_offer ->> 'preferred_window', '')
    ) returning id into v_offer_id;
  exception
    when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range then
      get stacked diagnostics v_constraint = constraint_name;
      return jsonb_build_object('success', false, 'code', 'INVALID_OFFER', 'reason', coalesce(nullif(v_constraint, ''), 'format'));
  end;
  insert into public.service_checkouts (
    customer_id, customer_display_name, customer_locale, request_mode, service_subitem_id, service_code, subitem_code,
    country, sido, gungu, dong, address, description, selected_options, customer_offer_id, terms, fiat_currency, fiat_amount, expires_at, test_fixture
  ) values (
    p_customer_id, p_customer_display_name, p_customer_locale, 'CUSTOMER_OFFER_OPEN', v_subitem.id, v_subitem.service_code, v_subitem.subitem_code,
    p_country, p_sido, p_gungu, coalesce(p_dong, ''), coalesce(p_address, ''), coalesce(p_description, ''), coalesce(p_selected_options, '{}'),
    v_offer_id, (select to_jsonb(o) - 'id' - 'customer_id' - 'status' - 'request_id' - 'funded_at' from public.customer_offers o where o.id = v_offer_id),
    v_currency, v_amount, v_expires, coalesce(p_test_fixture, false)
  ) returning id into v_checkout_id;
  return jsonb_build_object('success', true, 'checkout_id', v_checkout_id, 'request_mode', 'CUSTOMER_OFFER_OPEN', 'customer_offer_id', v_offer_id,
    'fiat_currency', v_currency, 'fiat_amount', v_amount, 'expires_at', v_expires);
end;
$$;

-- Checkout still valid for payment: owned, OPEN, unexpired; MODE A also pins price + reservation.
create or replace function public.checkout_payable(p_checkout public.service_checkouts)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_price public.helper_service_prices%rowtype;
begin
  if p_checkout.status <> 'OPEN' then return 'CHECKOUT_NOT_OPEN'; end if;
  if p_checkout.expires_at <= now() then return 'CHECKOUT_EXPIRED'; end if;
  if p_checkout.request_mode = 'HELPER_PRICE_SELECTED' then
    select * into v_price from public.helper_service_prices where id = p_checkout.helper_price_id;
    if not found or v_price.status <> 'ACTIVE' or v_price.revision <> p_checkout.helper_price_revision then return 'CHECKOUT_STALE'; end if;
    if not exists (select 1 from public.helper_checkout_reservations r where r.checkout_id = p_checkout.id and r.status = 'ACTIVE' and r.expires_at > now()) then
      return 'RESERVATION_EXPIRED';
    end if;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13c. Quote + intent. FX rate / provider come from the server's FX adapter; recipient and
--      reference from the server's rail configuration. The browser supplies none of them.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_payment_quote(
  p_checkout_id uuid, p_customer_id text, p_network text, p_mint text, p_fx_rate numeric, p_fx_provider text, p_fx_source_ref text, p_ttl_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout public.service_checkouts%rowtype;
  v_problem text;
  v_quote_id uuid;
  v_units bigint;
  v_expires timestamptz;
begin
  perform public.expire_helper_reservations();
  select * into v_checkout from public.service_checkouts where id = p_checkout_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_FOUND'); end if;
  v_problem := public.checkout_payable(v_checkout);
  if v_problem is not null then
    if v_problem in ('CHECKOUT_EXPIRED', 'CHECKOUT_STALE', 'RESERVATION_EXPIRED') then
      update public.service_checkouts set status = 'EXPIRED', updated_at = now() where id = v_checkout.id and status = 'OPEN';
      update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where checkout_id = v_checkout.id and status = 'ACTIVE';
    end if;
    return jsonb_build_object('success', false, 'code', v_problem);
  end if;
  if p_network = 'solana-mainnet' then return jsonb_build_object('success', false, 'code', 'MAINNET_DISABLED'); end if;
  if not public.payment_rail_enabled(v_checkout.country, 'USDC_CUSTOMER_PAYMENT', p_network, 'SOLANA_DIRECT_DEVNET') then
    return jsonb_build_object('success', false, 'code', 'PAYMENT_RAIL_DISABLED');
  end if;
  if p_fx_rate is null or p_fx_rate <= 0 or coalesce(p_fx_provider, '') = '' then return jsonb_build_object('success', false, 'code', 'FX_UNAVAILABLE'); end if;
  v_units := ceil(v_checkout.fiat_amount * 1000000 / p_fx_rate)::bigint;
  v_expires := least(now() + make_interval(secs => least(greatest(coalesce(p_ttl_seconds, 600), 60), 900)), v_checkout.expires_at);
  begin
    insert into public.payment_quotes (checkout_id, source_currency, source_amount, network, mint, asset_amount_base_units, fx_rate, fx_provider, fx_source_ref, expires_at)
    values (v_checkout.id, v_checkout.fiat_currency, v_checkout.fiat_amount, p_network, p_mint, v_units, p_fx_rate, p_fx_provider, p_fx_source_ref, v_expires)
    returning id into v_quote_id;
  exception when check_violation then
    return jsonb_build_object('success', false, 'code', 'NATIVE_USDC_REQUIRED');
  end;
  return jsonb_build_object('success', true, 'quote_id', v_quote_id, 'source_currency', v_checkout.fiat_currency, 'source_amount', v_checkout.fiat_amount,
    'asset', 'USDC', 'network', p_network, 'mint', p_mint, 'decimals', 6, 'amount_base_units', v_units, 'fx_rate', p_fx_rate,
    'fx_provider', p_fx_provider, 'expires_at', v_expires);
end;
$$;

create or replace function public.create_payment_intent(p_quote_id uuid, p_customer_id text, p_recipient text, p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quote public.payment_quotes%rowtype;
  v_checkout public.service_checkouts%rowtype;
  v_problem text;
  v_intent public.payment_intents%rowtype;
begin
  perform public.expire_helper_reservations();
  select * into v_quote from public.payment_quotes where id = p_quote_id;
  if not found then return jsonb_build_object('success', false, 'code', 'QUOTE_NOT_FOUND'); end if;
  select * into v_checkout from public.service_checkouts where id = v_quote.checkout_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'QUOTE_NOT_FOUND'); end if;
  if v_quote.expires_at <= now() then return jsonb_build_object('success', false, 'code', 'QUOTE_EXPIRED'); end if;
  v_problem := public.checkout_payable(v_checkout);
  if v_problem is not null then
    -- A stale / expired checkout never keeps the Helper reserved.
    if v_problem in ('CHECKOUT_EXPIRED', 'CHECKOUT_STALE', 'RESERVATION_EXPIRED') then
      update public.service_checkouts set status = 'EXPIRED', updated_at = now() where id = v_checkout.id and status = 'OPEN';
      update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where checkout_id = v_checkout.id and status = 'ACTIVE';
    end if;
    return jsonb_build_object('success', false, 'code', v_problem);
  end if;
  -- An unpaid, expired earlier intent of this checkout makes room for the new one.
  update public.payment_intents set status = 'EXPIRED' where checkout_id = v_checkout.id and status = 'AWAITING_PAYMENT' and expires_at <= now();
  select * into v_intent from public.payment_intents where checkout_id = v_checkout.id and status not in ('EXPIRED', 'FAILED');
  if found then
    if v_intent.quote_id = v_quote.id then
      return jsonb_build_object('success', true, 'replayed', true, 'intent_id', v_intent.id, 'status', v_intent.status, 'reference', v_intent.reference,
        'recipient', v_intent.recipient, 'amount_base_units', v_intent.amount_base_units, 'mint', v_intent.mint, 'network', v_intent.network, 'expires_at', v_intent.expires_at);
    end if;
    return jsonb_build_object('success', false, 'code', 'INTENT_ALREADY_OPEN', 'intent_id', v_intent.id);
  end if;
  begin
    insert into public.payment_intents (checkout_id, quote_id, customer_id, request_mode, fiat_currency, fiat_amount, network, mint, amount_base_units,
      recipient, reference, provider, expires_at)
    values (v_checkout.id, v_quote.id, p_customer_id, v_checkout.request_mode, v_checkout.fiat_currency, v_checkout.fiat_amount, v_quote.network, v_quote.mint,
      v_quote.asset_amount_base_units, p_recipient, p_reference, 'SOLANA_DIRECT_DEVNET', v_quote.expires_at)
    returning * into v_intent;
  exception when check_violation then
    return jsonb_build_object('success', false, 'code', 'PAYMENT_RAIL_NOT_CONFIGURED');
  end;
  perform public.log_payment_event(v_intent.id, 'INTENT_CREATED', jsonb_build_object('amount_base_units', v_intent.amount_base_units, 'network', v_intent.network));
  return jsonb_build_object('success', true, 'replayed', false, 'intent_id', v_intent.id, 'status', v_intent.status, 'reference', v_intent.reference,
    'recipient', v_intent.recipient, 'amount_base_units', v_intent.amount_base_units, 'mint', v_intent.mint, 'network', v_intent.network, 'expires_at', v_intent.expires_at);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13d. Activation (internal): runs inside the same transaction that marks the payment PAID_HELD.
-- ---------------------------------------------------------------------------------------------
create or replace function public.activate_funded_checkout(p_intent_id uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_intent public.payment_intents%rowtype;
  v_checkout public.service_checkouts%rowtype;
  v_offer public.customer_offers%rowtype;
  v_price public.helper_service_prices%rowtype;
  v_helper public.helpers%rowtype;
  v_request_id uuid := gen_random_uuid();
  v_assignment_id uuid := gen_random_uuid();
  v_conv_id uuid;
  v_available boolean;
  v_notified integer := 0;
begin
  select * into v_intent from public.payment_intents where id = p_intent_id;
  select * into v_checkout from public.service_checkouts where id = v_intent.checkout_id for update;
  if v_checkout.status = 'ACTIVATED' then
    return jsonb_build_object('success', true, 'replayed', true, 'request_id', v_checkout.request_id);
  end if;

  if v_checkout.request_mode = 'HELPER_PRICE_SELECTED' then
    select * into v_helper from public.helpers where id = v_checkout.helper_id for update;
    select * into v_price from public.helper_service_prices where id = v_checkout.helper_price_id;
    -- The customer paid for exactly this Helper at exactly the checkout's terms (never substituted).
    v_available := found and public.helper_is_available(v_checkout.helper_id, v_checkout.service_code, v_checkout.country, v_checkout.sido, v_checkout.gungu);
    insert into public.service_requests (id, customer_id, customer_display_name, customer_locale, service_slug, country, sido, gungu, dong,
      address, description, selected_options, status, selection_mode, request_mode, funding_payment_intent_id)
    values (v_request_id, v_checkout.customer_id, v_checkout.customer_display_name, v_checkout.customer_locale, v_checkout.service_code,
      v_checkout.country, v_checkout.sido, v_checkout.gungu, v_checkout.dong, v_checkout.address, v_checkout.description, v_checkout.selected_options,
      (case when v_available then 'MATCHED' else 'CUSTOMER_RESELECTION_REQUIRED' end)::public.service_request_status, 'CUSTOMER_SELECTED', 'HELPER_PRICE_SELECTED', v_intent.id);
    insert into public.request_price_selections (
      request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price,
      minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
      source_kind, source_helper_price_id, source_price_revision, source_price_updated_at, status, ended_at, ended_reason
    ) values (
      v_request_id, 1, case when v_available then v_assignment_id end, v_checkout.helper_id, v_checkout.service_subitem_id, v_checkout.service_code, v_checkout.subitem_code,
      (v_checkout.terms ->> 'pricing_mode')::public.pricing_mode, v_checkout.terms ->> 'currency', (v_checkout.terms ->> 'base_price')::numeric,
      (v_checkout.terms ->> 'minimum_charge')::numeric, (v_checkout.terms ->> 'included_quantity')::numeric, (v_checkout.terms ->> 'included_minutes')::integer,
      (v_checkout.terms ->> 'extra_unit_price')::numeric, (v_checkout.terms ->> 'extra_hour_price')::numeric,
      (v_checkout.terms ->> 'materials_policy')::public.materials_policy, v_checkout.terms ->> 'materials_note',
      (v_checkout.terms ->> 'emergency_multiplier')::numeric, (v_checkout.terms ->> 'night_multiplier')::numeric, (v_checkout.terms ->> 'weekend_multiplier')::numeric,
      (v_checkout.terms ->> 'tax_included')::boolean, v_checkout.fiat_amount,
      (v_checkout.terms ->> 'pricing_mode') = 'DIAGNOSTIC_PLUS_QUOTE' or (v_checkout.terms ->> 'materials_policy') = 'QUOTE_REQUIRED',
      'HELPER_PRICE', v_checkout.helper_price_id, v_checkout.helper_price_revision, (v_checkout.terms ->> 'price_updated_at')::timestamptz,
      case when v_available then 'ACCEPTED' else 'ENDED' end::public.price_selection_status,
      case when v_available then null else now() end, case when v_available then null else 'HELPER_UNAVAILABLE_AT_ACTIVATION' end
    );
    update public.helper_checkout_reservations set status = case when v_available then 'CONSUMED' else 'RELEASED' end, ended_at = now()
    where checkout_id = v_checkout.id and status in ('ACTIVE', 'EXPIRED');
    if v_available then
      insert into public.request_assignments (id, request_id, helper_id, status) values (v_assignment_id, v_request_id, v_checkout.helper_id, 'PENDING');
      insert into public.conversations (request_id, conversation_type, customer_id, helper_id, customer_locale, helper_locale)
      values (v_request_id, 'CUSTOMER_HELPER', v_checkout.customer_id, v_checkout.helper_id, v_checkout.customer_locale, v_helper.primary_locale)
      returning id into v_conv_id;
      insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
      values ('HELPER', v_helper.helper_id, 'NEW_SERVICE_REQUEST', '신규 서비스 배정 요청', v_checkout.service_code || ' 서비스 요청이 접수되었습니다.',
              jsonb_build_object('request_id', v_request_id, 'conversation_id', v_conv_id));
    else
      -- Paid, but the chosen Helper became unavailable: funds stay held; the customer explicitly re-selects.
      insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
      values ('CUSTOMER', v_checkout.customer_id, 'CUSTOMER_RESELECTION_REQUIRED', '새 Helper를 선택해 주세요',
              '선택하신 Helper가 이 요청을 진행할 수 없습니다. LIFE.HELP에서 새 Helper를 선택해 주세요.', jsonb_build_object('request_id', v_request_id));
    end if;
  else
    select * into v_offer from public.customer_offers where id = v_checkout.customer_offer_id for update;
    insert into public.service_requests (id, customer_id, customer_display_name, customer_locale, service_slug, country, sido, gungu, dong,
      address, description, selected_options, status, selection_mode, request_mode, funding_payment_intent_id)
    values (v_request_id, v_checkout.customer_id, v_checkout.customer_display_name, v_checkout.customer_locale, v_checkout.service_code,
      v_checkout.country, v_checkout.sido, v_checkout.gungu, v_checkout.dong, v_checkout.address, v_checkout.description, v_checkout.selected_options,
      'OPEN_FOR_HELPERS', 'CUSTOMER_OFFER', 'CUSTOMER_OFFER_OPEN', v_intent.id);
    update public.customer_offers set status = 'FUNDED', funded_at = now(), request_id = v_request_id where id = v_offer.id;
    -- In-app availability notice to a bounded set of eligible Helpers (the feed is authoritative).
    with eligible as (
      select h.id, h.helper_id from public.helpers h
      where public.helper_is_available(h.id, v_offer.service_code, v_offer.country, v_offer.sido, v_offer.gungu)
        and exists (select 1 from public.helper_service_prices p where p.helper_id = h.id and p.service_subitem_id = v_offer.service_subitem_id and p.status in ('ACTIVE', 'PAUSED'))
      order by h.rating desc nulls last, h.completed_jobs desc nulls last
      limit 50
    ), inserted as (
      insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
      select 'HELPER', e.helper_id, 'OPEN_CUSTOMER_OFFER', '새 고객 제시 가격 요청', v_offer.service_code || ' 공개 서비스 요청이 있습니다.', jsonb_build_object('request_id', v_request_id)
      from eligible e returning 1
    )
    select count(*) into v_notified from inserted;
  end if;

  update public.service_checkouts set status = 'ACTIVATED', request_id = v_request_id, updated_at = now() where id = v_checkout.id;
  update public.request_media set request_id = v_request_id where checkout_id = v_checkout.id and status = 'ACTIVE';
  update public.payment_intents set request_id = v_request_id where id = v_intent.id;
  perform public.log_payment_event(v_intent.id, 'REQUEST_ACTIVATED', jsonb_build_object('request_id', v_request_id, 'request_mode', v_checkout.request_mode));
  return jsonb_build_object('success', true, 'replayed', false, 'request_id', v_request_id, 'request_mode', v_checkout.request_mode,
    'helper_available', coalesce(v_available, true), 'assignment_id', case when v_available then v_assignment_id end, 'helpers_notified', v_notified);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13e. Server-side payment verification result. The Worker's rail adapter fetched and parsed the
--      transaction; this classifies it and only an exact, successful, finalized, referenced payment
--      of the pinned native USDC mint to the pinned recipient becomes PAID_HELD (+ activation).
-- ---------------------------------------------------------------------------------------------
create or replace function public.record_payment_observation(
  p_intent_id uuid, p_network text, p_signature text, p_slot bigint, p_mint text, p_recipient text, p_amount_base_units bigint,
  p_reference_matched boolean, p_tx_success boolean, p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.payment_intents%rowtype;
  v_existing public.payment_chain_transactions%rowtype;
  v_class text;
  v_activation jsonb;
begin
  select * into v_intent from public.payment_intents where id = p_intent_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'INTENT_NOT_FOUND'); end if;

  select * into v_existing from public.payment_chain_transactions where network = p_network and signature = p_signature;
  if found then
    if v_existing.payment_intent_id <> v_intent.id then
      perform public.log_payment_event(v_intent.id, 'DUPLICATE_SIGNATURE', jsonb_build_object('signature', p_signature));
      return jsonb_build_object('success', false, 'code', 'DUPLICATE_SIGNATURE');
    end if;
    if v_existing.classification <> 'PENDING_FINALITY' then
      return jsonb_build_object('success', true, 'replayed', true, 'classification', v_existing.classification, 'status', v_intent.status, 'request_id', v_intent.request_id);
    end if;
  end if;

  v_class := case
    when not p_tx_success then 'FAILED_TX'
    when p_network is distinct from v_intent.network then 'WRONG_NETWORK'
    when p_mint is distinct from v_intent.mint then 'WRONG_MINT'
    when p_recipient is distinct from v_intent.recipient then 'WRONG_RECIPIENT'
    when not p_reference_matched then 'MISSING_REFERENCE'
    when v_intent.status not in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING', 'EXPIRED') then 'EXTRA_PAYMENT'
    when v_intent.status = 'EXPIRED' or now() > v_intent.expires_at + interval '2 minutes' then 'LATE'
    when p_amount_base_units < v_intent.amount_base_units then 'UNDERPAID'
    when p_amount_base_units > v_intent.amount_base_units then 'OVERPAID'
    when p_confirmation <> 'finalized' then 'PENDING_FINALITY'
    else 'MATCHED'
  end;

  if v_existing.id is not null then
    update public.payment_chain_transactions set confirmation = p_confirmation, classification = v_class, slot = coalesce(p_slot, slot), observed_at = now() where id = v_existing.id;
  else
    begin
      insert into public.payment_chain_transactions (payment_intent_id, network, signature, slot, mint, recipient, amount_base_units, reference_matched, tx_success, confirmation, classification)
      values (v_intent.id, p_network, p_signature, p_slot, p_mint, p_recipient, p_amount_base_units, p_reference_matched, p_tx_success, p_confirmation, v_class);
    exception when unique_violation then
      return jsonb_build_object('success', false, 'code', 'DUPLICATE_SIGNATURE');
    end;
  end if;
  perform public.log_payment_event(v_intent.id, 'CHAIN_TX_' || v_class, jsonb_build_object('signature', p_signature, 'confirmation', p_confirmation));

  if v_class = 'FAILED_TX' then
    return jsonb_build_object('success', false, 'code', 'PAYMENT_TX_FAILED', 'status', v_intent.status);
  elsif v_class = 'EXTRA_PAYMENT' then
    return jsonb_build_object('success', false, 'code', 'REVIEW_REQUIRED', 'classification', v_class, 'status', v_intent.status);
  elsif v_class in ('WRONG_NETWORK', 'WRONG_MINT', 'WRONG_RECIPIENT', 'MISSING_REFERENCE', 'LATE', 'UNDERPAID', 'OVERPAID') then
    if v_intent.status in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING') then
      update public.payment_intents set status = 'REVIEW_REQUIRED' where id = v_intent.id;
    end if;
    return jsonb_build_object('success', false, 'code', 'REVIEW_REQUIRED', 'classification', v_class, 'status', 'REVIEW_REQUIRED');
  elsif v_class = 'PENDING_FINALITY' then
    update public.payment_intents set status = 'CONFIRMING' where id = v_intent.id and status <> 'CONFIRMING';
    return jsonb_build_object('success', true, 'classification', v_class, 'status', 'CONFIRMING');
  end if;

  -- MATCHED: verified. Hold the funds and activate the request atomically.
  update public.payment_intents set status = 'PAID_HELD', verified_signature = p_signature, verified_at = now(), held_at = now() where id = v_intent.id;
  perform public.log_payment_event(v_intent.id, 'PAID_HELD', jsonb_build_object('signature', p_signature));
  begin
    v_activation := public.activate_funded_checkout(v_intent.id);
  exception when others then
    -- Activation failed irrecoverably after a verified payment: never lose the money, refund it.
    update public.service_checkouts set status = 'ACTIVATION_FAILED', updated_at = now() where id = v_intent.checkout_id;
    update public.payment_intents set status = 'REFUND_PENDING' where id = v_intent.id;
    insert into public.service_refunds (payment_intent_id, checkout_id, currency, amount, reason)
    values (v_intent.id, v_intent.checkout_id, v_intent.fiat_currency, v_intent.fiat_amount, 'ACTIVATION_FAILED');
    perform public.log_payment_event(v_intent.id, 'ACTIVATION_FAILED_REFUND', jsonb_build_object('error', sqlerrm));
    return jsonb_build_object('success', false, 'code', 'ACTIVATION_FAILED_REFUND_PENDING', 'status', 'REFUND_PENDING');
  end;
  return jsonb_build_object('success', true, 'classification', 'MATCHED', 'status', 'PAID_HELD', 'activation', v_activation);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13f. MODE B: eligible Helper feed, voluntary decline, atomic acceptance.
-- ---------------------------------------------------------------------------------------------
create or replace function public.helper_can_take_offer(p_helper_id uuid, p_request_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.service_requests r
    join public.customer_offers o on o.request_id = r.id
    where r.id = p_request_id and r.request_mode = 'CUSTOMER_OFFER_OPEN' and r.status = 'OPEN_FOR_HELPERS'
      and public.helper_is_available(p_helper_id, o.service_code, o.country, o.sido, o.gungu)
      -- qualified for the detailed service: the Helper declares it (ACTIVE or PAUSED price row)
      and exists (select 1 from public.helper_service_prices p where p.helper_id = p_helper_id and p.service_subitem_id = o.service_subitem_id and p.status in ('ACTIVE', 'PAUSED'))
      and not exists (select 1 from public.customer_offer_exclusions x where x.request_id = r.id and x.helper_id = p_helper_id)
      and not exists (select 1 from public.request_assignments ra where ra.request_id = r.id and ra.helper_id = p_helper_id and ra.status in ('DECLINED', 'TIMEOUT'))
      and not public.helper_reserved_elsewhere(p_helper_id, null)
      and exists (select 1 from public.payment_intents i where i.id = r.funding_payment_intent_id and i.status = 'PAID_HELD')
  );
$$;

create or replace function public.list_open_customer_offers(p_helper_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(x order by x_funded desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
             'request_id', r.id, 'service_code', o.service_code, 'subitem_code', o.subitem_code, 'sido', o.sido, 'gungu', o.gungu,
             'currency', o.currency, 'offered_amount', o.offered_amount, 'pricing_mode', o.pricing_mode,
             'included_quantity', o.included_quantity, 'included_minutes', o.included_minutes,
             'materials_policy', o.materials_policy, 'materials_note', o.materials_note,
             'public_note', o.public_note, 'preferred_window', o.preferred_window, 'funded_at', o.funded_at
           ) as x, o.funded_at as x_funded
    from public.service_requests r
    join public.customer_offers o on o.request_id = r.id
    where r.request_mode = 'CUSTOMER_OFFER_OPEN' and r.status = 'OPEN_FOR_HELPERS'
      and public.helper_can_take_offer(p_helper_id, r.id)
    order by o.funded_at desc
    limit 50
  ) feed;
$$;

create or replace function public.decline_customer_offer_request(p_helper_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.customer_offer_exclusions where request_id = p_request_id and helper_id = p_helper_id) then
    return jsonb_build_object('success', true, 'replayed', true);
  end if;
  if not public.helper_can_take_offer(p_helper_id, p_request_id) then
    return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_AVAILABLE');
  end if;
  insert into public.customer_offer_exclusions (request_id, helper_id, reason) values (p_request_id, p_helper_id, 'DECLINED_OFFER');
  return jsonb_build_object('success', true, 'replayed', false);
end;
$$;

create or replace function public.accept_customer_offer_request(p_helper_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.service_requests%rowtype;
  v_offer public.customer_offers%rowtype;
  v_helper public.helpers%rowtype;
  v_version integer;
  v_assignment_id uuid := gen_random_uuid();
  v_conv_id uuid;
  v_constraint text;
begin
  perform public.expire_helper_reservations();
  -- The request row lock serializes every concurrent acceptance of this request.
  select * into v_req from public.service_requests where id = p_request_id and request_mode = 'CUSTOMER_OFFER_OPEN' for update;
  if not found then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_FOUND'); end if;
  if v_req.status <> 'OPEN_FOR_HELPERS' then
    if exists (select 1 from public.request_price_selections s join public.request_assignments a on a.id = s.assignment_id
               where s.request_id = p_request_id and s.status = 'ACCEPTED' and s.helper_id = p_helper_id and a.status in ('PENDING', 'NOTIFIED', 'ACCEPTED')) then
      return jsonb_build_object('success', true, 'replayed', true, 'request_id', p_request_id, 'status', v_req.status);
    end if;
    return jsonb_build_object('success', false, 'code', case when v_req.status in ('CANCELLED', 'CLOSED', 'SETTLED') then 'REQUEST_NOT_OPEN' else 'REQUEST_ALREADY_ACCEPTED' end);
  end if;
  select * into v_helper from public.helpers where id = p_helper_id for update;
  if not found or not public.helper_can_take_offer(p_helper_id, p_request_id) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NOT_ELIGIBLE');
  end if;
  select * into v_offer from public.customer_offers where request_id = p_request_id;
  select coalesce(max(selection_version), 0) + 1 into v_version from public.request_price_selections where request_id = p_request_id;
  begin
    -- The Helper accepts the customer's funded terms exactly; nothing of the Helper's own price is used.
    insert into public.request_price_selections (
      request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price,
      included_quantity, included_minutes, materials_policy, materials_note, tax_included, initial_payable_amount, quote_required,
      source_kind, source_customer_offer_id
    ) values (
      p_request_id, v_version, v_assignment_id, p_helper_id, v_offer.service_subitem_id, v_offer.service_code, v_offer.subitem_code, v_offer.pricing_mode,
      v_offer.currency, v_offer.offered_amount, v_offer.included_quantity, v_offer.included_minutes, v_offer.materials_policy, v_offer.materials_note,
      true, v_offer.offered_amount, v_offer.pricing_mode = 'DIAGNOSTIC_PLUS_QUOTE' or v_offer.materials_policy = 'QUOTE_REQUIRED',
      'CUSTOMER_OFFER', v_offer.id
    );
    insert into public.request_assignments (id, request_id, helper_id, status) values (v_assignment_id, p_request_id, p_helper_id, 'PENDING');
    update public.service_requests set status = 'MATCHED', updated_at = now() where id = p_request_id;
    insert into public.conversations (request_id, conversation_type, customer_id, helper_id, customer_locale, helper_locale)
    values (p_request_id, 'CUSTOMER_HELPER', v_req.customer_id, p_helper_id, v_req.customer_locale, v_helper.primary_locale)
    returning id into v_conv_id;
    insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
    values ('HELPER', v_helper.helper_id, 'NEW_SERVICE_REQUEST', '신규 서비스 배정 요청', v_offer.service_code || ' 서비스 요청이 접수되었습니다.',
            jsonb_build_object('request_id', p_request_id, 'conversation_id', v_conv_id)),
           ('CUSTOMER', v_req.customer_id, 'CUSTOMER_OFFER_ACCEPTED', 'Helper가 요청을 수락했습니다', '제시하신 조건으로 Helper가 배정되었습니다.',
            jsonb_build_object('request_id', p_request_id));
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'request_assignments_helper_active_uidx' then return jsonb_build_object('success', false, 'code', 'HELPER_NOT_ELIGIBLE'); end if;
      if v_constraint = 'request_price_selections_one_accepted_uidx' then return jsonb_build_object('success', false, 'code', 'REQUEST_ALREADY_ACCEPTED'); end if;
      raise;
  end;
  return jsonb_build_object('success', true, 'replayed', false, 'request_id', p_request_id, 'status', 'MATCHED', 'selection_version', v_version,
    'assignment_id', v_assignment_id, 'conversation_id', v_conv_id, 'currency', v_offer.currency, 'agreed_amount', v_offer.offered_amount);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13g. Release (decline / timeout). AUTO_MATCH -> SEARCHING (unchanged); HELPER_PRICE_SELECTED ->
--      CUSTOMER_RESELECTION_REQUIRED (013, unchanged); CUSTOMER_OFFER_OPEN -> the SAME funded offer
--      re-opens (OPEN_FOR_HELPERS), the released Helper is excluded, the price never changes.
-- ---------------------------------------------------------------------------------------------
create or replace function public.release_assignment_for_rematch(
  p_assignment_id uuid,
  p_release_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_assignment record;
  v_request record;
  v_other_active_count integer;
  v_status_enum public.assignment_status;
  v_reselect boolean := false;
  v_reopen_offer boolean := false;
  v_new_status text;
begin
  if p_release_status not in ('DECLINED', 'TIMEOUT') then
    return jsonb_build_object('success', false, 'error', 'Invalid release status. Must be DECLINED or TIMEOUT', 'code', 'INVALID_RELEASE_STATUS');
  end if;
  v_status_enum := p_release_status::public.assignment_status;

  select * into v_assignment from public.request_assignments where id = p_assignment_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Assignment not found', 'code', 'ASSIGNMENT_NOT_FOUND');
  end if;
  if v_assignment.status not in ('PENDING', 'NOTIFIED', 'ACCEPTED') then
    return jsonb_build_object('success', false, 'error', 'Assignment is not in an active releaseable state', 'code', 'ASSIGNMENT_NOT_ACTIVE', 'current_status', v_assignment.status);
  end if;

  select * into v_request from public.service_requests where id = v_assignment.request_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Parent service request not found', 'code', 'REQUEST_NOT_FOUND');
  end if;
  if v_request.status not in ('MATCHED', 'HELPER_NOTIFIED') then
    return jsonb_build_object('success', false, 'error', 'Parent service request is not in a rematchable state', 'code', 'REQUEST_NOT_REMATCHABLE',
      'request_status', v_request.status, 'assignment_status', v_assignment.status);
  end if;

  update public.request_assignments set status = v_status_enum, responded_at = coalesce(responded_at, now()) where id = v_assignment.id;

  select count(*) into v_other_active_count
  from public.request_assignments
  where request_id = v_request.id and id <> v_assignment.id and status in ('PENDING', 'NOTIFIED', 'ACCEPTED');

  v_new_status := v_request.status::text;
  if v_other_active_count = 0 then
    if v_request.request_mode = 'CUSTOMER_OFFER_OPEN' then
      v_reopen_offer := true;
      update public.request_price_selections
      set status = 'ENDED', ended_at = now(), ended_reason = case p_release_status when 'DECLINED' then 'HELPER_DECLINED' else 'HELPER_TIMEOUT' end
      where request_id = v_request.id and status = 'ACCEPTED' and helper_id = v_assignment.helper_id;
      insert into public.customer_offer_exclusions (request_id, helper_id, reason) values (v_request.id, v_assignment.helper_id, 'RELEASED_AFTER_ACCEPT')
      on conflict (request_id, helper_id) do nothing;
      update public.service_requests set status = 'OPEN_FOR_HELPERS', updated_at = now() where id = v_request.id;
      v_new_status := 'OPEN_FOR_HELPERS';
    elsif v_request.selection_mode = 'CUSTOMER_SELECTED' then
      v_reselect := true;
      update public.request_price_selections
      set status = 'ENDED', ended_at = now(), ended_reason = case p_release_status when 'DECLINED' then 'HELPER_DECLINED' else 'HELPER_TIMEOUT' end
      where request_id = v_request.id and status = 'ACCEPTED' and helper_id = v_assignment.helper_id;
      update public.service_requests set status = 'CUSTOMER_RESELECTION_REQUIRED', updated_at = now() where id = v_request.id;
      v_new_status := 'CUSTOMER_RESELECTION_REQUIRED';
      insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
      values ('CUSTOMER', v_request.customer_id, 'CUSTOMER_RESELECTION_REQUIRED', '새 Helper를 선택해 주세요',
              '선택하신 Helper가 이 요청을 진행할 수 없습니다. LIFE.HELP에서 새 Helper를 선택해 주세요.',
              jsonb_build_object('request_id', v_request.id));
    else
      update public.service_requests set status = 'SEARCHING', updated_at = now() where id = v_request.id;
      v_new_status := 'SEARCHING';
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment.id,
    'request_id', v_request.id,
    'new_assignment_status', p_release_status,
    'request_reopened', (v_other_active_count = 0),
    'customer_reselection_required', v_reselect,
    'customer_offer_reopened', v_reopen_offer,
    'request_status', v_new_status
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13h. Re-selection (013) on a PREPAID request: the new Helper's price may not exceed the held
--      amount (a top-up checkout is a later design); a lower price is refunded at release.
-- ---------------------------------------------------------------------------------------------
create or replace function public.reselect_customer_helper(
  p_request_id uuid,
  p_customer_id text,
  p_price_id uuid,
  p_price_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.service_requests%rowtype;
  v_price public.helper_service_prices%rowtype;
  v_subitem public.service_subitems%rowtype;
  v_helper public.helpers%rowtype;
  v_current public.request_price_selections%rowtype;
  v_funding public.payment_intents%rowtype;
  v_version integer;
  v_initial numeric(12, 2);
  v_assignment_id uuid;
  v_conv_id uuid;
  v_constraint text;
begin
  perform public.expire_helper_reservations();
  select * into v_req from public.service_requests where id = p_request_id for update;
  if not found or v_req.customer_id <> p_customer_id then
    return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_FOUND');
  end if;
  if v_req.selection_mode <> 'CUSTOMER_SELECTED' then
    return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_RESELECTABLE', 'status', v_req.status);
  end if;
  if v_req.status <> 'CUSTOMER_RESELECTION_REQUIRED' then
    select * into v_current from public.request_price_selections where request_id = p_request_id and status = 'ACCEPTED';
    if found and v_current.source_helper_price_id = p_price_id and v_current.source_price_revision = p_price_revision then
      return jsonb_build_object('success', true, 'replayed', true, 'request_id', p_request_id, 'status', v_req.status,
        'selection_version', v_current.selection_version);
    end if;
    return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_RESELECTABLE', 'status', v_req.status);
  end if;

  select * into v_price from public.helper_service_prices where id = p_price_id for update;
  if not found or v_price.status <> 'ACTIVE' then
    return jsonb_build_object('success', false, 'code', 'OFFER_UNAVAILABLE');
  end if;
  if v_price.revision <> p_price_revision then
    return jsonb_build_object('success', false, 'code', 'PRICE_CHANGED', 'current_revision', v_price.revision);
  end if;
  select * into v_subitem from public.service_subitems where id = v_price.service_subitem_id;
  if not v_subitem.active or not (v_price.pricing_mode = any (v_subitem.allowed_pricing_modes)) then
    return jsonb_build_object('success', false, 'code', 'OFFER_UNAVAILABLE');
  end if;
  if v_subitem.service_code <> v_req.service_slug then
    return jsonb_build_object('success', false, 'code', 'OFFER_SERVICE_MISMATCH');
  end if;
  if exists (select 1 from public.request_assignments ra where ra.request_id = p_request_id and ra.helper_id = v_price.helper_id and ra.status in ('DECLINED', 'TIMEOUT')) then
    return jsonb_build_object('success', false, 'code', 'HELPER_PREVIOUSLY_DECLINED');
  end if;

  v_initial := public.helper_price_initial_amount(v_price);
  if v_req.funding_payment_intent_id is not null then
    select * into v_funding from public.payment_intents where id = v_req.funding_payment_intent_id;
    if v_funding.status <> 'PAID_HELD' then return jsonb_build_object('success', false, 'code', 'PAYMENT_NOT_HELD'); end if;
    if v_price.currency <> v_funding.fiat_currency then return jsonb_build_object('success', false, 'code', 'CURRENCY_MISMATCH'); end if;
    if v_initial > v_funding.fiat_amount then
      return jsonb_build_object('success', false, 'code', 'TOPUP_REQUIRED', 'held_amount', v_funding.fiat_amount, 'offer_amount', v_initial);
    end if;
  end if;

  select * into v_helper from public.helpers where id = v_price.helper_id for update;
  if not found or not public.helper_is_available(v_helper.id, v_subitem.service_code, v_req.country, v_req.sido, v_req.gungu)
     or public.helper_reserved_elsewhere(v_helper.id, null) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
  end if;

  select coalesce(max(selection_version), 0) + 1 into v_version from public.request_price_selections where request_id = p_request_id;
  v_assignment_id := gen_random_uuid();

  begin
    insert into public.request_price_selections (
      request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price,
      minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
      source_kind, source_helper_price_id, source_price_revision, source_price_updated_at
    ) values (
      p_request_id, v_version, v_assignment_id, v_helper.id, v_subitem.id, v_subitem.service_code, v_subitem.subitem_code, v_price.pricing_mode, v_price.currency,
      v_price.base_price, v_price.minimum_charge, v_price.included_quantity, v_price.included_minutes, v_price.extra_unit_price,
      v_price.extra_hour_price, v_price.materials_policy, v_price.materials_note, v_price.emergency_multiplier, v_price.night_multiplier,
      v_price.weekend_multiplier, v_price.tax_included, v_initial,
      v_price.pricing_mode = 'DIAGNOSTIC_PLUS_QUOTE' or v_price.materials_policy = 'QUOTE_REQUIRED',
      'HELPER_PRICE', v_price.id, v_price.revision, v_price.updated_at
    );
    insert into public.request_assignments (id, request_id, helper_id, status) values (v_assignment_id, p_request_id, v_helper.id, 'PENDING');
    update public.service_requests set status = 'MATCHED', updated_at = now() where id = p_request_id;
    insert into public.conversations (request_id, conversation_type, customer_id, helper_id, customer_locale, helper_locale)
    values (p_request_id, 'CUSTOMER_HELPER', v_req.customer_id, v_helper.id, v_req.customer_locale, v_helper.primary_locale)
    returning id into v_conv_id;
    insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
    values ('HELPER', v_helper.helper_id, 'NEW_SERVICE_REQUEST', '신규 서비스 배정 요청',
            v_subitem.service_code || ' 서비스 요청이 접수되었습니다.',
            jsonb_build_object('request_id', p_request_id, 'conversation_id', v_conv_id));
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'request_assignments_helper_active_uidx' then
        return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
      end if;
      raise;
  end;

  return jsonb_build_object(
    'success', true, 'replayed', false, 'status', 'MATCHED', 'request_id', p_request_id, 'selection_version', v_version,
    'assignment_id', v_assignment_id, 'conversation_id', v_conv_id, 'currency', v_price.currency, 'initial_payable_amount', v_initial
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13i. Legacy unpaid customer-selected creation (012/013): kept ONLY for explicit internal test
--      compatibility behind the operator token; rows are marked legacy_unfunded.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_customer_selected_request(
  p_request_id uuid,
  p_customer_id text,
  p_customer_display_name text,
  p_customer_locale text,
  p_country text,
  p_sido text,
  p_gungu text,
  p_dong text,
  p_address text,
  p_description text,
  p_selected_options text[],
  p_price_id uuid,
  p_price_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing record;
  v_price public.helper_service_prices%rowtype;
  v_subitem public.service_subitems%rowtype;
  v_helper public.helpers%rowtype;
  v_initial numeric(12, 2);
  v_assignment_id uuid;
  v_conv_id uuid;
  v_constraint text;
begin
  select id, customer_id, status, selection_mode into v_existing from public.service_requests where id = p_request_id;
  if found then
    if v_existing.customer_id <> p_customer_id or v_existing.selection_mode <> 'CUSTOMER_SELECTED' then
      return jsonb_build_object('success', false, 'code', 'IDEMPOTENCY_KEY_CONFLICT');
    end if;
    return jsonb_build_object('success', true, 'replayed', true, 'request_id', v_existing.id, 'status', v_existing.status);
  end if;

  select * into v_price from public.helper_service_prices where id = p_price_id for update;
  if not found or v_price.status <> 'ACTIVE' then
    return jsonb_build_object('success', false, 'code', 'OFFER_UNAVAILABLE');
  end if;
  if v_price.revision <> p_price_revision then
    return jsonb_build_object('success', false, 'code', 'PRICE_CHANGED', 'current_revision', v_price.revision);
  end if;
  select * into v_subitem from public.service_subitems where id = v_price.service_subitem_id;
  if not v_subitem.active or not (v_price.pricing_mode = any (v_subitem.allowed_pricing_modes)) then
    return jsonb_build_object('success', false, 'code', 'OFFER_UNAVAILABLE');
  end if;

  select * into v_helper from public.helpers where id = v_price.helper_id for update;
  if not found or not public.helper_is_available(v_helper.id, v_subitem.service_code, p_country, p_sido, p_gungu)
     or public.helper_reserved_elsewhere(v_helper.id, null) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
  end if;

  v_initial := public.helper_price_initial_amount(v_price);
  v_assignment_id := gen_random_uuid();

  begin
    insert into public.service_requests (
      id, customer_id, customer_display_name, customer_locale, service_slug, country, sido, gungu, dong,
      address, description, selected_options, status, selection_mode, request_mode, legacy_unfunded
    ) values (
      p_request_id, p_customer_id, p_customer_display_name, p_customer_locale, v_subitem.service_code, p_country, p_sido, p_gungu,
      coalesce(p_dong, ''), coalesce(p_address, ''), coalesce(p_description, ''), coalesce(p_selected_options, '{}'), 'MATCHED', 'CUSTOMER_SELECTED',
      'HELPER_PRICE_SELECTED', true
    );
    insert into public.request_price_selections (
      request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price,
      minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
      source_kind, source_helper_price_id, source_price_revision, source_price_updated_at
    ) values (
      p_request_id, 1, v_assignment_id, v_helper.id, v_subitem.id, v_subitem.service_code, v_subitem.subitem_code, v_price.pricing_mode, v_price.currency,
      v_price.base_price, v_price.minimum_charge, v_price.included_quantity, v_price.included_minutes, v_price.extra_unit_price,
      v_price.extra_hour_price, v_price.materials_policy, v_price.materials_note, v_price.emergency_multiplier, v_price.night_multiplier,
      v_price.weekend_multiplier, v_price.tax_included, v_initial,
      v_price.pricing_mode = 'DIAGNOSTIC_PLUS_QUOTE' or v_price.materials_policy = 'QUOTE_REQUIRED',
      'HELPER_PRICE', v_price.id, v_price.revision, v_price.updated_at
    );
    insert into public.request_assignments (id, request_id, helper_id, status) values (v_assignment_id, p_request_id, v_helper.id, 'PENDING');
    insert into public.conversations (request_id, conversation_type, customer_id, helper_id, customer_locale, helper_locale)
    values (p_request_id, 'CUSTOMER_HELPER', p_customer_id, v_helper.id, p_customer_locale, v_helper.primary_locale)
    returning id into v_conv_id;
    insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
    values ('HELPER', v_helper.helper_id, 'NEW_SERVICE_REQUEST', '신규 서비스 배정 요청',
            v_subitem.service_code || ' 서비스 요청이 접수되었습니다.',
            jsonb_build_object('request_id', p_request_id, 'conversation_id', v_conv_id));
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'request_assignments_helper_active_uidx' then
        return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
      end if;
      raise;
  end;

  return jsonb_build_object(
    'success', true, 'replayed', false, 'status', 'MATCHED', 'request_id', p_request_id,
    'assignment_id', v_assignment_id, 'conversation_id', v_conv_id,
    'currency', v_price.currency, 'initial_payable_amount', v_initial
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13j. Customer cancels a funded request no Helper has taken (open offer, or waiting for
--      re-selection): request CANCELLED, full refund obligation exactly once, nothing deleted.
-- ---------------------------------------------------------------------------------------------
create or replace function public.cancel_funded_request(p_request_id uuid, p_customer_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.service_requests%rowtype;
  v_intent public.payment_intents%rowtype;
  v_refund_id uuid;
begin
  select * into v_req from public.service_requests where id = p_request_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_FOUND'); end if;
  if v_req.funding_payment_intent_id is null then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_CANCELLABLE'); end if;
  select * into v_intent from public.payment_intents where id = v_req.funding_payment_intent_id for update;
  if v_req.status = 'CANCELLED' then
    select id into v_refund_id from public.service_refunds where payment_intent_id = v_intent.id and reason = 'CUSTOMER_CANCELLED_UNMATCHED';
    return jsonb_build_object('success', true, 'replayed', true, 'status', 'CANCELLED', 'refund_id', v_refund_id, 'payment_status', v_intent.status);
  end if;
  if not ((v_req.request_mode = 'CUSTOMER_OFFER_OPEN' and v_req.status = 'OPEN_FOR_HELPERS')
          or (v_req.request_mode = 'HELPER_PRICE_SELECTED' and v_req.status = 'CUSTOMER_RESELECTION_REQUIRED'))
     or exists (select 1 from public.request_assignments where request_id = p_request_id and status in ('PENDING', 'NOTIFIED', 'ACCEPTED')) then
    return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_CANCELLABLE', 'status', v_req.status);
  end if;
  if v_intent.status <> 'PAID_HELD' then return jsonb_build_object('success', false, 'code', 'PAYMENT_NOT_HELD'); end if;

  update public.service_requests set status = 'CANCELLED', updated_at = now() where id = p_request_id;
  update public.customer_offers set status = 'CANCELLED' where request_id = p_request_id;
  update public.request_price_selections set status = 'ENDED', ended_at = now(), ended_reason = 'REQUEST_CANCELLED' where request_id = p_request_id and status = 'ACCEPTED';
  update public.payment_intents set status = 'REFUND_PENDING' where id = v_intent.id;
  update public.request_media set status = 'DELETION_PENDING', deletion_reason = 'REQUEST_CANCELLED', deletion_requested_at = now()
  where request_id = p_request_id and status = 'ACTIVE';
  insert into public.service_refunds (payment_intent_id, checkout_id, request_id, currency, amount, reason)
  values (v_intent.id, v_intent.checkout_id, p_request_id, v_intent.fiat_currency, v_intent.fiat_amount, 'CUSTOMER_CANCELLED_UNMATCHED')
  returning id into v_refund_id;
  perform public.log_payment_event(v_intent.id, 'CUSTOMER_CANCELLED_REFUND_PENDING', jsonb_build_object('request_id', p_request_id));
  return jsonb_build_object('success', true, 'replayed', false, 'status', 'CANCELLED', 'refund_id', v_refund_id, 'payment_status', 'REFUND_PENDING');
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13k. "서비스 완료": the owner confirms the Helper's completed work. THE release event:
--      confirmation + RELEASE_AUTHORIZED + exactly one Helper payout obligation, atomically.
--      Helper completion alone never gets here; nothing releases funds automatically.
-- ---------------------------------------------------------------------------------------------
create or replace function public.confirm_service_completion(p_request_id uuid, p_customer_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.service_requests%rowtype;
  v_intent public.payment_intents%rowtype;
  v_sel public.request_price_selections%rowtype;
  v_assignment public.request_assignments%rowtype;
  v_destination public.payout_destinations%rowtype;
  v_obligation_id uuid;
  v_refund numeric(12, 2);
  v_rail text := 'UNASSIGNED';
begin
  select * into v_req from public.service_requests where id = p_request_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_FOUND'); end if;
  if v_req.funding_payment_intent_id is null then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_PREPAID'); end if;
  select * into v_intent from public.payment_intents where id = v_req.funding_payment_intent_id for update;

  if exists (select 1 from public.customer_completion_confirmations where request_id = p_request_id) then
    select id into v_obligation_id from public.payout_obligations where request_id = p_request_id and kind = 'HELPER_SERVICE';
    return jsonb_build_object('success', true, 'replayed', true, 'payout_obligation_id', v_obligation_id, 'payment_status', v_intent.status, 'request_status', v_req.status);
  end if;
  if v_req.status <> 'COMPLETED' then return jsonb_build_object('success', false, 'code', 'SERVICE_NOT_COMPLETED', 'status', v_req.status); end if;
  if v_intent.status <> 'PAID_HELD' then return jsonb_build_object('success', false, 'code', 'PAYMENT_NOT_HELD', 'payment_status', v_intent.status); end if;
  select * into v_sel from public.request_price_selections where request_id = p_request_id and status = 'ACCEPTED';
  if not found then return jsonb_build_object('success', false, 'code', 'PRICE_AGREEMENT_MISSING'); end if;
  select * into v_assignment from public.request_assignments where request_id = p_request_id and helper_id = v_sel.helper_id and status = 'COMPLETED'
  order by assigned_at desc limit 1;
  if not found then return jsonb_build_object('success', false, 'code', 'HELPER_COMPLETION_MISSING'); end if;
  if v_sel.currency <> v_intent.fiat_currency or v_sel.initial_payable_amount > v_intent.fiat_amount then
    return jsonb_build_object('success', false, 'code', 'REVIEW_REQUIRED', 'reason', 'HELD_AMOUNT_MISMATCH');
  end if;

  select * into v_destination from public.payout_destinations where owner_helper_id = v_sel.helper_id and status = 'ACTIVE';
  if found then v_rail := v_destination.payout_method; end if;

  insert into public.customer_completion_confirmations (request_id, customer_id, payment_intent_id) values (p_request_id, p_customer_id, v_intent.id);
  update public.service_requests set customer_completed_at = now(), status = 'PAYMENT_PENDING', updated_at = now() where id = p_request_id;
  update public.payment_intents set status = 'RELEASE_AUTHORIZED', release_authorized_at = now() where id = v_intent.id;
  -- Service complete: every photo / video of the request is scheduled for permanent deletion now.
  update public.request_media set status = 'DELETION_PENDING', deletion_reason = 'SERVICE_COMPLETED', deletion_requested_at = now()
  where request_id = p_request_id and status = 'ACTIVE';
  -- Gross = the CURRENT agreed commercial amount (Helper price selection or accepted customer offer).
  insert into public.payout_obligations (kind, request_id, payment_intent_id, helper_id, currency, gross_amount, payout_rail, payout_destination_id)
  values ('HELPER_SERVICE', p_request_id, v_intent.id, v_sel.helper_id, v_sel.currency, v_sel.initial_payable_amount, v_rail,
          case when v_rail <> 'UNASSIGNED' then v_destination.id end)
  returning id into v_obligation_id;
  v_refund := v_intent.fiat_amount - v_sel.initial_payable_amount;
  if v_refund > 0 then
    insert into public.service_refunds (payment_intent_id, checkout_id, request_id, currency, amount, reason)
    values (v_intent.id, v_intent.checkout_id, p_request_id, v_intent.fiat_currency, v_refund, 'PRICE_DIFFERENCE');
  end if;
  insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
  select 'HELPER', h.helper_id, 'PAYOUT_RELEASE_INITIATED', 'Helper 지급 시작', '고객이 서비스 완료를 확인했습니다. 지급 처리가 시작되었습니다.',
         jsonb_build_object('request_id', p_request_id)
  from public.helpers h where h.id = v_sel.helper_id;
  perform public.log_payment_event(v_intent.id, 'RELEASE_AUTHORIZED', jsonb_build_object('request_id', p_request_id, 'payout_obligation_id', v_obligation_id));
  return jsonb_build_object('success', true, 'replayed', false, 'payout_obligation_id', v_obligation_id, 'payment_status', 'RELEASE_AUTHORIZED',
    'request_status', 'PAYMENT_PENDING', 'gross_amount', v_sel.initial_payable_amount, 'currency', v_sel.currency, 'price_difference_refund', greatest(v_refund, 0));
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13l. Payout / refund rail results (exactly once per obligation / refund / provider id / signature).
-- ---------------------------------------------------------------------------------------------
create or replace function public.record_payout_submission(p_obligation_id uuid, p_provider text, p_provider_payout_id text, p_chain_network text, p_chain_signature text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ob public.payout_obligations%rowtype;
  v_constraint text;
begin
  select * into v_ob from public.payout_obligations where id = p_obligation_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'OBLIGATION_NOT_FOUND'); end if;
  if v_ob.status in ('SUBMITTED', 'PAID') then
    if v_ob.provider = p_provider and v_ob.provider_payout_id = p_provider_payout_id then
      return jsonb_build_object('success', true, 'replayed', true, 'status', v_ob.status);
    end if;
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_PAYOUT_BLOCKED', 'status', v_ob.status);
  end if;
  if v_ob.status not in ('CREATED', 'FAILED') then return jsonb_build_object('success', false, 'code', 'OBLIGATION_NOT_SUBMITTABLE', 'status', v_ob.status); end if;
  begin
    update public.payout_obligations set status = 'SUBMITTED', provider = p_provider, provider_payout_id = p_provider_payout_id, chain_network = p_chain_network,
      chain_signature = p_chain_signature, submitted_at = now(), updated_at = now(), status_reason = null where id = v_ob.id;
  exception when unique_violation then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_PAYOUT_BLOCKED');
  end;
  if v_ob.kind = 'HELPER_SERVICE' then
    update public.payment_intents set status = 'PAYOUT_PROCESSING' where id = v_ob.payment_intent_id and status = 'RELEASE_AUTHORIZED';
  end if;
  return jsonb_build_object('success', true, 'replayed', false, 'status', 'SUBMITTED');
end;
$$;

create or replace function public.mark_payout_obligation_review(p_obligation_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.payout_obligations set status = 'REVIEW_REQUIRED', status_reason = left(coalesce(p_reason, 'REVIEW'), 120), updated_at = now()
  where id = p_obligation_id and status in ('CREATED', 'FAILED', 'REVIEW_REQUIRED');
  if not found then return jsonb_build_object('success', false, 'code', 'OBLIGATION_NOT_REVIEWABLE'); end if;
  return jsonb_build_object('success', true, 'status', 'REVIEW_REQUIRED');
end;
$$;

create or replace function public.record_payout_result(p_obligation_id uuid, p_provider text, p_provider_payout_id text, p_success boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ob public.payout_obligations%rowtype;
begin
  select * into v_ob from public.payout_obligations where id = p_obligation_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'OBLIGATION_NOT_FOUND'); end if;
  if v_ob.provider is distinct from p_provider or v_ob.provider_payout_id is distinct from p_provider_payout_id then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_PAYOUT_BLOCKED', 'status', v_ob.status);
  end if;
  if v_ob.status = 'PAID' then return jsonb_build_object('success', true, 'replayed', true, 'status', 'PAID'); end if;
  if v_ob.status <> 'SUBMITTED' then return jsonb_build_object('success', false, 'code', 'OBLIGATION_NOT_SUBMITTED', 'status', v_ob.status); end if;
  if not p_success then
    update public.payout_obligations set status = 'FAILED', updated_at = now() where id = v_ob.id;
    return jsonb_build_object('success', true, 'status', 'FAILED');
  end if;
  update public.payout_obligations set status = 'PAID', paid_at = now(), updated_at = now() where id = v_ob.id;
  if v_ob.kind = 'HELPER_SERVICE' then
    update public.payment_intents set status = 'SETTLED', settled_at = now() where id = v_ob.payment_intent_id and status in ('RELEASE_AUTHORIZED', 'PAYOUT_PROCESSING');
    insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
    select 'HELPER', h.helper_id, 'PAYOUT_COMPLETED', '지급 완료', '서비스 대금 지급이 완료되었습니다.', jsonb_build_object('request_id', v_ob.request_id)
    from public.helpers h where h.id = v_ob.helper_id;
  else
    update public.referral_rewards set state = 'PAID', updated_at = now() where id = v_ob.referral_reward_id and state = 'PAYOUT_PROCESSING';
  end if;
  return jsonb_build_object('success', true, 'replayed', false, 'status', 'PAID');
end;
$$;

-- Referral reward payout instruction: reward lifecycle and qualification unchanged; this only
-- turns a PAYABLE reward into exactly one payout obligation (PAYABLE -> PAYOUT_PROCESSING).
create or replace function public.create_referral_payout_obligation(p_reward_id uuid, p_rail text, p_country text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reward public.referral_rewards%rowtype;
  v_existing uuid;
  v_id uuid;
begin
  select * into v_reward from public.referral_rewards where id = p_reward_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'REWARD_NOT_FOUND'); end if;
  select id into v_existing from public.payout_obligations where referral_reward_id = p_reward_id;
  if v_existing is not null then return jsonb_build_object('success', true, 'replayed', true, 'payout_obligation_id', v_existing); end if;
  if v_reward.state <> 'PAYABLE' then return jsonb_build_object('success', false, 'code', 'REWARD_NOT_PAYABLE', 'state', v_reward.state); end if;
  if p_rail not in ('USDC_SOLANA', 'BANK_PROVIDER') then return jsonb_build_object('success', false, 'code', 'INVALID_RAIL'); end if;
  if p_rail = 'USDC_SOLANA' and not public.payment_rail_enabled(p_country, 'USDC_REFERRAL_PAYOUT', 'solana-devnet', 'SOLANA_DIRECT_DEVNET') then
    return jsonb_build_object('success', false, 'code', 'PAYMENT_RAIL_DISABLED');
  end if;
  insert into public.payout_obligations (kind, referral_reward_id, currency, gross_amount, payout_rail)
  values ('REFERRAL_REWARD', p_reward_id, 'KRW', v_reward.reward_amount_krw, p_rail) returning id into v_id;
  update public.referral_rewards set state = 'PAYOUT_PROCESSING', updated_at = now() where id = p_reward_id;
  return jsonb_build_object('success', true, 'replayed', false, 'payout_obligation_id', v_id);
end;
$$;

create or replace function public.record_refund_result(p_refund_id uuid, p_provider text, p_provider_refund_id text, p_chain_network text, p_chain_signature text, p_success boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_refund public.service_refunds%rowtype;
begin
  select * into v_refund from public.service_refunds where id = p_refund_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'REFUND_NOT_FOUND'); end if;
  if v_refund.status = 'COMPLETED' then
    if v_refund.provider_refund_id = p_provider_refund_id then return jsonb_build_object('success', true, 'replayed', true, 'status', 'COMPLETED'); end if;
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_REFUND_BLOCKED');
  end if;
  begin
    update public.service_refunds set status = case when p_success then 'COMPLETED' else 'FAILED' end, provider = p_provider, provider_refund_id = p_provider_refund_id,
      chain_network = p_chain_network, chain_signature = p_chain_signature, completed_at = case when p_success then now() end
    where id = v_refund.id;
  exception when unique_violation then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_REFUND_BLOCKED');
  end;
  if p_success and v_refund.reason in ('CUSTOMER_CANCELLED_UNMATCHED', 'ACTIVATION_FAILED') then
    update public.payment_intents set status = 'REFUNDED' where id = v_refund.payment_intent_id and status = 'REFUND_PENDING';
  end if;
  return jsonb_build_object('success', true, 'replayed', false, 'status', case when p_success then 'COMPLETED' else 'FAILED' end);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 13m. Staging fixture purge: only checkouts created as test fixtures on a non-mainnet network.
--      The request's non-money children (assignments, conversations, notifications) are removed by
--      the caller first. Production data can never match (test_fixture is never set by the app).
-- ---------------------------------------------------------------------------------------------
create or replace function public.purge_payment_fixture(p_checkout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout public.service_checkouts%rowtype;
begin
  select * into v_checkout from public.service_checkouts where id = p_checkout_id;
  if not found then return jsonb_build_object('success', true, 'purged', false); end if;
  if not v_checkout.test_fixture or exists (select 1 from public.payment_intents where checkout_id = p_checkout_id and network = 'solana-mainnet') then
    return jsonb_build_object('success', false, 'code', 'NOT_A_TEST_FIXTURE');
  end if;
  perform set_config('life_help.payment_fixture_purge', 'on', true);
  delete from public.customer_completion_confirmations where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.payout_obligations where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.service_refunds where checkout_id = p_checkout_id;
  delete from public.request_media where checkout_id = p_checkout_id;
  delete from public.payment_chain_transactions where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.payment_events where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.service_requests where id = v_checkout.request_id;
  delete from public.payment_intents where checkout_id = p_checkout_id;
  delete from public.payment_quotes where checkout_id = p_checkout_id;
  delete from public.helper_checkout_reservations where checkout_id = p_checkout_id;
  delete from public.service_checkouts where id = p_checkout_id;
  if v_checkout.customer_offer_id is not null then delete from public.customer_offers where id = v_checkout.customer_offer_id; end if;
  perform set_config('life_help.payment_fixture_purge', 'off', true);
  return jsonb_build_object('success', true, 'purged', true);
end;
$$;


-- ---------------------------------------------------------------------------------------------
-- 13n. Request media RPCs.
-- ---------------------------------------------------------------------------------------------
create or replace function public.register_request_media(
  p_checkout_id uuid, p_customer_id text, p_storage_provider text, p_object_key text, p_content_type text, p_byte_size bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout public.service_checkouts%rowtype;
  v_id uuid;
begin
  select * into v_checkout from public.service_checkouts where id = p_checkout_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_FOUND'); end if;
  if v_checkout.status <> 'OPEN' then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_OPEN'); end if;
  if (select count(*) from public.request_media where checkout_id = p_checkout_id) >= 10 then
    return jsonb_build_object('success', false, 'code', 'MEDIA_LIMIT_REACHED');
  end if;
  begin
    insert into public.request_media (checkout_id, customer_id, storage_provider, object_key, media_kind, content_type, byte_size)
    values (p_checkout_id, p_customer_id, p_storage_provider, p_object_key, case when p_content_type like 'image/%' then 'IMAGE' else 'VIDEO' end, p_content_type, p_byte_size)
    returning id into v_id;
  exception when check_violation or unique_violation then
    return jsonb_build_object('success', false, 'code', 'MEDIA_REJECTED');
  end;
  return jsonb_build_object('success', true, 'media_id', v_id);
end;
$$;

-- Authorize one in-app view (and log it). Owner: any time while ACTIVE. Helper: only while holding an
-- active assignment on the request (PENDING / NOTIFIED / ACCEPTED), never after completing the work.
create or replace function public.authorize_request_media_view(p_media_id uuid, p_customer_id text, p_helper_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_media public.request_media%rowtype;
  v_kind text;
  v_ref text;
begin
  select * into v_media from public.request_media where id = p_media_id;
  if not found or v_media.status <> 'ACTIVE' then return jsonb_build_object('success', false, 'code', 'MEDIA_NOT_AVAILABLE'); end if;
  if p_customer_id is not null and p_customer_id = v_media.customer_id then
    v_kind := 'CUSTOMER'; v_ref := p_customer_id;
  elsif p_helper_id is not null and v_media.request_id is not null and exists (
      select 1 from public.request_assignments ra where ra.request_id = v_media.request_id and ra.helper_id = p_helper_id and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED')) then
    v_kind := 'HELPER'; v_ref := p_helper_id::text;
  else
    return jsonb_build_object('success', false, 'code', 'MEDIA_NOT_AVAILABLE');
  end if;
  insert into public.request_media_views (media_id, viewer_kind, viewer_ref) values (v_media.id, v_kind, v_ref);
  return jsonb_build_object('success', true, 'viewer_kind', v_kind, 'storage_provider', v_media.storage_provider, 'object_key', v_media.object_key,
    'content_type', v_media.content_type, 'byte_size', v_media.byte_size);
end;
$$;

create or replace function public.list_media_pending_deletion(p_limit integer)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('media_id', m.id, 'storage_provider', m.storage_provider, 'object_key', m.object_key) order by m.deletion_requested_at), '[]'::jsonb)
  from (select * from public.request_media where status = 'DELETION_PENDING' order by deletion_requested_at limit least(greatest(coalesce(p_limit, 50), 1), 200)) m;
$$;

-- Called by the storage worker after the object was permanently deleted from private storage.
create or replace function public.mark_request_media_deleted(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.request_media set status = 'DELETED', deleted_at = now() where id = p_media_id and status = 'DELETION_PENDING';
  if found then return jsonb_build_object('success', true, 'replayed', false); end if;
  if exists (select 1 from public.request_media where id = p_media_id and status = 'DELETED') then return jsonb_build_object('success', true, 'replayed', true); end if;
  return jsonb_build_object('success', false, 'code', 'MEDIA_NOT_PENDING_DELETION');
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 14. Function privileges: service_role executes the public RPCs; internal helpers stay private.
-- ---------------------------------------------------------------------------------------------
revoke all on function public.payment_rail_enabled(text, text, text, text) from public, anon, authenticated;
revoke all on function public.expire_helper_reservations() from public, anon, authenticated;
revoke all on function public.log_payment_event(uuid, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.helper_is_available(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.helper_reserved_elsewhere(uuid, uuid) from public, anon, authenticated;
revoke all on function public.helper_can_take_offer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.checkout_payable(public.service_checkouts) from public, anon, authenticated, service_role;
revoke all on function public.activate_funded_checkout(uuid) from public, anon, authenticated, service_role;
revoke all on function public.list_customer_offers(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.create_helper_price_checkout(text, text, text, text, text, text, text, text, text, text[], uuid, integer, boolean) from public, anon, authenticated;
revoke all on function public.create_customer_offer_checkout(text, text, text, text, text, text, text, text, text, text[], text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.create_payment_quote(uuid, text, text, text, numeric, text, text, integer) from public, anon, authenticated;
revoke all on function public.create_payment_intent(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.record_payment_observation(uuid, text, text, bigint, text, text, bigint, boolean, boolean, text) from public, anon, authenticated;
revoke all on function public.list_open_customer_offers(uuid) from public, anon, authenticated;
revoke all on function public.decline_customer_offer_request(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_customer_offer_request(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_assignment_for_rematch(uuid, text) from public, anon, authenticated;
revoke all on function public.reselect_customer_helper(uuid, text, uuid, integer) from public, anon, authenticated;
revoke all on function public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer) from public, anon, authenticated;
revoke all on function public.cancel_funded_request(uuid, text) from public, anon, authenticated;
revoke all on function public.confirm_service_completion(uuid, text) from public, anon, authenticated;
revoke all on function public.record_payout_submission(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mark_payout_obligation_review(uuid, text) from public, anon, authenticated;
revoke all on function public.record_payout_result(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.create_referral_payout_obligation(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_refund_result(uuid, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.purge_payment_fixture(uuid) from public, anon, authenticated;
revoke all on function public.register_request_media(uuid, text, text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.authorize_request_media_view(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.list_media_pending_deletion(integer) from public, anon, authenticated;
revoke all on function public.mark_request_media_deleted(uuid) from public, anon, authenticated;

grant execute on function public.payment_rail_enabled(text, text, text, text) to service_role;
grant execute on function public.list_customer_offers(text, text, text, text, text) to service_role;
grant execute on function public.create_helper_price_checkout(text, text, text, text, text, text, text, text, text, text[], uuid, integer, boolean) to service_role;
grant execute on function public.create_customer_offer_checkout(text, text, text, text, text, text, text, text, text, text[], text, text, jsonb, boolean) to service_role;
grant execute on function public.create_payment_quote(uuid, text, text, text, numeric, text, text, integer) to service_role;
grant execute on function public.create_payment_intent(uuid, text, text, text) to service_role;
grant execute on function public.record_payment_observation(uuid, text, text, bigint, text, text, bigint, boolean, boolean, text) to service_role;
grant execute on function public.list_open_customer_offers(uuid) to service_role;
grant execute on function public.decline_customer_offer_request(uuid, uuid) to service_role;
grant execute on function public.accept_customer_offer_request(uuid, uuid) to service_role;
grant execute on function public.release_assignment_for_rematch(uuid, text) to service_role;
grant execute on function public.reselect_customer_helper(uuid, text, uuid, integer) to service_role;
grant execute on function public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer) to service_role;
grant execute on function public.cancel_funded_request(uuid, text) to service_role;
grant execute on function public.confirm_service_completion(uuid, text) to service_role;
grant execute on function public.record_payout_submission(uuid, text, text, text, text) to service_role;
grant execute on function public.mark_payout_obligation_review(uuid, text) to service_role;
grant execute on function public.record_payout_result(uuid, text, text, boolean) to service_role;
grant execute on function public.create_referral_payout_obligation(uuid, text, text) to service_role;
grant execute on function public.record_refund_result(uuid, text, text, text, text, boolean) to service_role;
grant execute on function public.purge_payment_fixture(uuid) to service_role;
grant execute on function public.register_request_media(uuid, text, text, text, text, bigint) to service_role;
grant execute on function public.authorize_request_media_view(uuid, text, uuid) to service_role;
grant execute on function public.list_media_pending_deletion(integer) to service_role;
grant execute on function public.mark_request_media_deleted(uuid) to service_role;

commit;

-- Rollback (review-only; PostgreSQL cannot drop an enum value):
--   * No payment row may be dropped while it holds real history; export before any rollback.
--   * Restore release_assignment_for_rematch / reselect_customer_helper / create_customer_selected_request /
--     request_assignments_selected_helper_guard / request_price_selections_guard / list_customer_offers from 013 / 012.
--   * Drop the new RPCs, tables, triggers and service_requests columns; restore the selection_mode check.

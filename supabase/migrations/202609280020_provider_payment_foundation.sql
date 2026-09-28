-- 202609280020: provider-neutral payment provider foundation (NO provider chosen, NO production enablement).
--
-- Makes the financial source of truth able to receive PROVIDER-authoritative evidence (a licensed PSP /
-- custody / escrow / payout provider, later) without letting provider data replace business authority:
--
--   BUSINESS AUTHORITY (unchanged)  helper price / customer offer, request_price_selections, payment_intents,
--                                   service_refunds, payout_obligations, referral_rewards, money outbox.
--   PROVIDER EVIDENCE (new)         provider_events: signed webhook / poll observations, immutable, unique per
--                                   (provider, provider_event_id). They only CONFIRM external money movement.
--
-- Contents
--   1. Hardening found in the audit: payment_events (ledger log) and payout_destinations were writable /
--      deletable by the app role (Supabase default privileges). Now: payment_events immutable (writes only
--      through log_payment_event), payout_destinations no-delete with immutable identity.
--   2. payment_providers registry: provider x environment (SANDBOX | LIVE). LIVE can NOT be enabled by this
--      migration (constraint); a MOCK provider can only ever be SANDBOX. Nothing is enabled by default.
--   3. payment_capability_policies: deny-by-default CUSTOMER_PAYMENT / HELPER_PAYOUT / REFERRAL_PAYOUT /
--      REFUND per country x provider x environment x rail; money_movement_eligibility() = the single
--      eligibility / compliance hook point (LIVE: COMPLIANCE_POLICY_UNCONFIGURED until a later migration).
--   4. Provider-hosted payments: quotes / intents accept a provider network ('provider:<CODE>:<ENV>') in the
--      charged currency (no FX, exact minor units); open_provider_payment_intent(); immutable
--      provider_payment_links (one provider payment id <-> one intent, never reused).
--   5. provider_events + ingest_provider_event(): the one trusted provider-evidence authority. Payments reuse
--      activate_funded_checkout() (PAID_HELD); refunds / payouts reuse the outbox lease +
--      record_money_attempt_result() (the same authority the poller uses). Monotonic: an older / conflicting
--      event never regresses a terminal state; ambiguity goes to the existing REVIEW_REQUIRED states.
--   6. payout_destinations.destination_kind: BLOCKCHAIN_WALLET | PROVIDER_PAYEE | BANK_RECIPIENT_TOKEN (a wallet
--      address is not a universal payout identity; no raw bank data is stored, only provider tokens + masked text).
--   7. Retention classes declared on the tables (provider evidence / business history / operational state).
-- Does not modify migrations 001-019. Existing Solana devnet rail paths are unchanged.

begin;

-- =============================================================================================
-- 1. Hardening: payment_events immutable; payout_destinations no-delete, immutable identity.
-- =============================================================================================
revoke all on public.payment_events from public, anon, authenticated, service_role;
grant select on public.payment_events to service_role;

create or replace function public.audit_row_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception '% rows are audit history and are never modified', tg_table_name using errcode = 'P0001';
end;
$$;
create or replace function public.audit_table_no_truncate()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception '% is audit history and is never truncated', tg_table_name using errcode = 'P0001';
end;
$$;
create trigger payment_events_immutable before update on public.payment_events for each row execute function public.audit_row_immutable();
-- Staging test fixtures are still purgeable (purge_payment_fixture sets the purge flag); nothing else deletes.
create trigger payment_events_no_delete before delete on public.payment_events for each row execute function public.money_row_no_delete();
create trigger payment_events_no_truncate before truncate on public.payment_events for each statement execute function public.audit_table_no_truncate();

revoke delete, truncate on public.payout_destinations from public, anon, authenticated, service_role;

-- =============================================================================================
-- 6 (schema first). Payout destination kinds.
-- =============================================================================================
alter table public.payout_destinations
  add column destination_kind text,
  add column provider_environment text check (provider_environment is null or provider_environment in ('SANDBOX', 'LIVE'));
update public.payout_destinations set destination_kind = case payout_method
  when 'USDC_SOLANA' then 'BLOCKCHAIN_WALLET' when 'BANK_PROVIDER' then 'BANK_RECIPIENT_TOKEN' else 'LEGACY_UNCLASSIFIED' end;
alter table public.payout_destinations drop constraint payout_destinations_method;
alter table public.payout_destinations
  add constraint payout_destinations_method check (payout_method in ('BANK_PROVIDER', 'USDC_SOLANA', 'PROVIDER_PAYEE') or owner_identity_id is not null),
  add constraint payout_destinations_kind check (destination_kind in ('BLOCKCHAIN_WALLET', 'PROVIDER_PAYEE', 'BANK_RECIPIENT_TOKEN', 'LEGACY_UNCLASSIFIED')),
  add constraint payout_destinations_kind_matches_method check (
    (payout_method = 'USDC_SOLANA' and destination_kind = 'BLOCKCHAIN_WALLET')
    or (payout_method = 'BANK_PROVIDER' and destination_kind = 'BANK_RECIPIENT_TOKEN')
    or (payout_method = 'PROVIDER_PAYEE' and destination_kind = 'PROVIDER_PAYEE' and provider is not null and provider_environment is not null)
    or (payout_method not in ('USDC_SOLANA', 'BANK_PROVIDER', 'PROVIDER_PAYEE') and destination_kind = 'LEGACY_UNCLASSIFIED')
  );

create or replace function public.payout_destinations_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    -- Existing inserts do not name a kind: derive it from the method (never from the browser).
    new.destination_kind := coalesce(new.destination_kind, case new.payout_method
      when 'USDC_SOLANA' then 'BLOCKCHAIN_WALLET' when 'BANK_PROVIDER' then 'BANK_RECIPIENT_TOKEN'
      when 'PROVIDER_PAYEE' then 'PROVIDER_PAYEE' else 'LEGACY_UNCLASSIFIED' end);
    return new;
  end if;
  if (new.id, new.owner_identity_id, new.owner_helper_id, new.country, new.currency, new.payout_method, new.provider,
      new.provider_payee_token, new.destination_kind, new.provider_environment, new.created_at)
     is distinct from
     (old.id, old.owner_identity_id, old.owner_helper_id, old.country, old.currency, old.payout_method, old.provider,
      old.provider_payee_token, old.destination_kind, old.provider_environment, old.created_at) then
    raise exception 'payout_destinations: owner, method, provider and payee token are immutable (register a new destination)' using errcode = 'P0001';
  end if;
  if old.status = 'REVOKED' and new.status is distinct from old.status then
    raise exception 'payout_destinations: a revoked destination stays revoked' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger payout_destinations_guard before insert or update on public.payout_destinations
  for each row execute function public.payout_destinations_guard();
alter table public.payout_destinations alter column destination_kind set not null;

alter table public.payout_obligations drop constraint payout_obligations_payout_rail_check;
alter table public.payout_obligations add constraint payout_obligations_payout_rail_check
  check (payout_rail in ('USDC_SOLANA', 'BANK_PROVIDER', 'PROVIDER_PAYEE', 'UNASSIGNED'));

-- =============================================================================================
-- 2. Provider registry (deny-by-default; LIVE never enabled here; MOCK only SANDBOX).
-- =============================================================================================
create table public.payment_providers (
  code text not null check (code ~ '^[A-Z][A-Z0-9_]{1,39}$'),
  environment text not null check (environment in ('SANDBOX', 'LIVE')),
  kind text not null check (kind in ('PSP', 'CUSTODY', 'PAYOUT', 'CHAIN_DIRECT', 'MOCK')),
  enabled boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  primary key (code, environment),
  constraint payment_providers_mock_sandbox_only check (kind <> 'MOCK' or environment = 'SANDBOX'),
  constraint payment_providers_live_disabled check (environment <> 'LIVE' or enabled = false)
);
insert into public.payment_providers (code, environment, kind, enabled, notes) values
  ('SOLANA_DIRECT_DEVNET', 'SANDBOX', 'CHAIN_DIRECT', false, 'existing staging devnet rail (served by the devnet adapter, not by provider events)'),
  ('MOCK_PROVIDER', 'SANDBOX', 'MOCK', false, 'deterministic contract-test provider; never production authority');
revoke all on public.payment_providers from public, anon, authenticated, service_role;
grant select on public.payment_providers to service_role;

-- =============================================================================================
-- 3. Capability policies + eligibility / compliance hook.
-- =============================================================================================
create table public.payment_capability_policies (
  country text not null check (country ~ '^[A-Z]{2}$'),
  capability text not null check (capability in ('CUSTOMER_PAYMENT', 'HELPER_PAYOUT', 'REFERRAL_PAYOUT', 'REFUND')),
  provider text not null,
  environment text not null,
  rail text not null check (rail ~ '^[A-Z0-9_]{2,40}$'),
  enabled boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  primary key (country, capability, provider, environment, rail),
  foreign key (provider, environment) references public.payment_providers (code, environment) on delete restrict,
  constraint payment_capability_policies_live_disabled check (environment <> 'LIVE' or enabled = false),
  constraint payment_capability_policies_enabled_approved check (not enabled or (approved_by is not null and approved_at is not null))
);
revoke all on public.payment_capability_policies from public, anon, authenticated, service_role;
grant select on public.payment_capability_policies to service_role;

create or replace function public.provider_capability_enabled(p_country text, p_capability text, p_provider text, p_environment text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.payment_providers pr where pr.code = p_provider and pr.environment = p_environment and pr.enabled)
     and exists (select 1 from public.payment_capability_policies p where p.country = p_country and p.capability = p_capability
                 and p.provider = p_provider and p.environment = p_environment and p.enabled);
$$;

-- The single eligibility hook point for money movement. No KYC / AML rules are invented here: in LIVE the
-- compliance policy is simply not configured yet, so LIVE money movement is refused. SANDBOX needs only the
-- explicit capability policy. subject_kind: CUSTOMER | HELPER_PAYEE | REFERRAL_RECIPIENT.
create or replace function public.money_movement_eligibility(
  p_capability text, p_country text, p_provider text, p_environment text, p_subject_kind text, p_subject_ref text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_subject_kind not in ('CUSTOMER', 'HELPER_PAYEE', 'REFERRAL_RECIPIENT') or coalesce(p_subject_ref, '') = '' then
    return jsonb_build_object('eligible', false, 'code', 'SUBJECT_INVALID');
  end if;
  if not public.provider_capability_enabled(p_country, p_capability, p_provider, p_environment) then
    return jsonb_build_object('eligible', false, 'code', 'CAPABILITY_DISABLED');
  end if;
  if p_environment <> 'SANDBOX' then
    -- Hook: customer / payee / referral-recipient eligibility, country policy and sanctions / compliance
    -- results plug in here once production policy exists.
    return jsonb_build_object('eligible', false, 'code', 'COMPLIANCE_POLICY_UNCONFIGURED');
  end if;
  return jsonb_build_object('eligible', true, 'code', 'SANDBOX_NO_COMPLIANCE_REQUIRED');
end;
$$;

-- =============================================================================================
-- 4. Provider-hosted payments: quotes / intents in the charged currency; provider payment links.
-- =============================================================================================
-- ISO 4217 minor units for the currencies this ledger may charge through a provider (explicit list;
-- anything else is refused rather than guessed).
create or replace function public.currency_minor_exponent(p_currency text)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_currency when 'KRW' then 0 when 'JPY' then 0 when 'USD' then 2 when 'EUR' then 2 else null end;
$$;

alter table public.payment_quotes
  drop constraint payment_quotes_asset_check,
  drop constraint payment_quotes_network_check,
  drop constraint payment_quotes_decimals_check,
  drop constraint payment_quotes_rounding_check,
  drop constraint payment_quotes_native_usdc;
alter table public.payment_quotes add constraint payment_quotes_rail_shape check (
  (network in ('solana-devnet', 'solana-mainnet') and asset = 'USDC' and decimals = 6 and rounding = 'CEIL_TO_BASE_UNIT'
   and ((network = 'solana-devnet' and mint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
     or (network = 'solana-mainnet' and mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')))
  or (network ~ '^provider:[A-Z][A-Z0-9_]{1,39}:(SANDBOX|LIVE)$' and asset = source_currency and mint = '' and fx_rate = 1
      and decimals = public.currency_minor_exponent(source_currency) and rounding = 'EXACT_MINOR_UNIT'
      and asset_amount_base_units = source_amount * power(10, decimals))
);

alter table public.payment_intents
  drop constraint payment_intents_provider_check,
  drop constraint payment_intents_recipient_check;
alter table public.payment_intents add constraint payment_intents_rail_shape check (
  (network in ('solana-devnet', 'solana-mainnet') and provider in ('SOLANA_DIRECT_DEVNET', 'PSP_PENDING')
   and recipient ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
  or (network = 'provider:' || provider || ':SANDBOX' or network = 'provider:' || provider || ':LIVE')
     and provider ~ '^[A-Z][A-Z0-9_]{1,39}$' and recipient ~ '^[A-Za-z0-9_.:-]{2,120}$' and mint = ''
);

create table public.provider_payment_links (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null unique references public.payment_intents(id) on delete restrict,
  provider text not null,
  environment text not null check (environment in ('SANDBOX', 'LIVE')),
  provider_payment_id text not null check (length(provider_payment_id) between 4 and 200),
  created_at timestamptz not null default now(),
  -- A provider payment reference belongs to exactly one intent, forever.
  unique (provider, environment, provider_payment_id)
);
create trigger provider_payment_links_immutable before update on public.provider_payment_links for each row execute function public.audit_row_immutable();
create trigger provider_payment_links_no_delete before delete on public.provider_payment_links for each row execute function public.money_row_no_delete();
create trigger provider_payment_links_no_truncate before truncate on public.provider_payment_links for each statement execute function public.audit_table_no_truncate();
revoke all on public.provider_payment_links from public, anon, authenticated, service_role;
grant select on public.provider_payment_links to service_role;

-- Quote + intent for a checkout, charged through a registered provider in the checkout's own currency.
-- Amount / currency come from the checkout (business authority); the provider only hosts the payment.
create or replace function public.open_provider_payment_intent(
  p_checkout_id uuid, p_customer_id text, p_provider text, p_environment text, p_provider_account text, p_reference text, p_ttl_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout public.service_checkouts%rowtype;
  v_problem text;
  v_exp integer;
  v_network text := 'provider:' || p_provider || ':' || p_environment;
  v_elig jsonb;
  v_quote_id uuid;
  v_intent public.payment_intents%rowtype;
  v_ttl integer := least(greatest(coalesce(p_ttl_seconds, 900), 60), 3600);
begin
  perform public.expire_helper_reservations();
  select * into v_checkout from public.service_checkouts where id = p_checkout_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_FOUND'); end if;
  v_elig := public.money_movement_eligibility('CUSTOMER_PAYMENT', v_checkout.country, p_provider, p_environment, 'CUSTOMER', p_customer_id);
  if not (v_elig ->> 'eligible')::boolean then return jsonb_build_object('success', false, 'code', v_elig ->> 'code'); end if;
  v_problem := public.checkout_payable(v_checkout);
  if v_problem is not null then
    if v_problem in ('CHECKOUT_EXPIRED', 'CHECKOUT_STALE', 'RESERVATION_EXPIRED') then
      update public.service_checkouts set status = 'EXPIRED', updated_at = now() where id = v_checkout.id and status = 'OPEN';
      update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where checkout_id = v_checkout.id and status = 'ACTIVE';
    end if;
    return jsonb_build_object('success', false, 'code', v_problem);
  end if;
  v_exp := public.currency_minor_exponent(v_checkout.fiat_currency);
  if v_exp is null then return jsonb_build_object('success', false, 'code', 'CURRENCY_UNSUPPORTED'); end if;
  if v_checkout.fiat_amount * power(10, v_exp) <> trunc(v_checkout.fiat_amount * power(10, v_exp)) then
    return jsonb_build_object('success', false, 'code', 'AMOUNT_NOT_REPRESENTABLE');
  end if;
  update public.payment_intents set status = 'EXPIRED' where checkout_id = v_checkout.id and status = 'AWAITING_PAYMENT' and expires_at <= now();
  select * into v_intent from public.payment_intents where checkout_id = v_checkout.id and status not in ('EXPIRED', 'FAILED');
  if found then
    if v_intent.network = v_network then
      return jsonb_build_object('success', true, 'replayed', true, 'intent_id', v_intent.id, 'status', v_intent.status, 'reference', v_intent.reference,
        'currency', v_intent.fiat_currency, 'amount_minor', v_intent.amount_base_units, 'expires_at', v_intent.expires_at);
    end if;
    return jsonb_build_object('success', false, 'code', 'INTENT_ALREADY_OPEN', 'intent_id', v_intent.id);
  end if;
  insert into public.payment_quotes (checkout_id, source_currency, source_amount, asset, network, mint, decimals, asset_amount_base_units,
    fx_rate, fx_provider, fx_source_ref, rounding, expires_at)
  values (v_checkout.id, v_checkout.fiat_currency, v_checkout.fiat_amount, v_checkout.fiat_currency, v_network, '', v_exp,
    (v_checkout.fiat_amount * power(10, v_exp))::bigint, 1, 'NONE_SAME_CURRENCY', null, 'EXACT_MINOR_UNIT', now() + make_interval(secs => v_ttl))
  returning id into v_quote_id;
  insert into public.payment_intents (checkout_id, quote_id, customer_id, request_mode, fiat_currency, fiat_amount, network, asset, mint,
    amount_base_units, recipient, reference, provider, expires_at)
  values (v_checkout.id, v_quote_id, p_customer_id, v_checkout.request_mode, v_checkout.fiat_currency, v_checkout.fiat_amount, v_network,
    v_checkout.fiat_currency, '', (v_checkout.fiat_amount * power(10, v_exp))::bigint, p_provider_account, p_reference, p_provider,
    now() + make_interval(secs => v_ttl))
  returning * into v_intent;
  update public.payment_intents set status = 'AWAITING_PAYMENT' where id = v_intent.id and status = 'CREATED';
  perform public.log_payment_event(v_intent.id, 'PROVIDER_INTENT_OPENED', jsonb_build_object('provider', p_provider, 'environment', p_environment));
  return jsonb_build_object('success', true, 'replayed', false, 'intent_id', v_intent.id, 'status', 'AWAITING_PAYMENT', 'reference', v_intent.reference,
    'currency', v_intent.fiat_currency, 'amount_minor', v_intent.amount_base_units, 'expires_at', v_intent.expires_at);
end;
$$;

-- The provider session / payment id returned by the adapter, bound to its intent exactly once.
create or replace function public.link_provider_payment(p_intent_id uuid, p_provider_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.payment_intents%rowtype;
  v_env text;
  v_link public.provider_payment_links%rowtype;
begin
  select * into v_intent from public.payment_intents where id = p_intent_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'INTENT_NOT_FOUND'); end if;
  if v_intent.network !~ '^provider:' then return jsonb_build_object('success', false, 'code', 'NOT_A_PROVIDER_INTENT'); end if;
  v_env := split_part(v_intent.network, ':', 3);
  select * into v_link from public.provider_payment_links where payment_intent_id = v_intent.id;
  if found then
    if v_link.provider_payment_id = p_provider_payment_id then return jsonb_build_object('success', true, 'replayed', true); end if;
    return jsonb_build_object('success', false, 'code', 'INTENT_ALREADY_LINKED');
  end if;
  begin
    insert into public.provider_payment_links (payment_intent_id, provider, environment, provider_payment_id)
    values (v_intent.id, v_intent.provider, v_env, p_provider_payment_id);
  exception when unique_violation then
    return jsonb_build_object('success', false, 'code', 'PROVIDER_REFERENCE_REUSED');
  end;
  return jsonb_build_object('success', true, 'replayed', false);
end;
$$;

-- =============================================================================================
-- 5. Provider events (immutable evidence) + the single ingestion authority.
-- =============================================================================================
create table public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  environment text not null check (environment in ('SANDBOX', 'LIVE')),
  provider_account text,
  provider_event_id text not null check (length(provider_event_id) between 4 and 200),
  source text not null check (source in ('WEBHOOK', 'POLL')),
  event_type text not null check (event_type in (
    'PAYMENT_AUTHORIZED', 'PAYMENT_HELD', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED',
    'REFUND_SUBMITTED', 'REFUND_CONFIRMED', 'REFUND_FAILED',
    'PAYOUT_SUBMITTED', 'PAYOUT_CONFIRMED', 'PAYOUT_FAILED')),
  provider_event_type text not null check (length(provider_event_type) between 1 and 120),
  object_ref text not null check (length(object_ref) between 4 and 200),
  life_help_reference text,
  amount_minor bigint check (amount_minor is null or amount_minor > 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3,5}$'),
  occurred_at timestamptz,
  provider_sequence bigint,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  signature_verified boolean not null check (signature_verified),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_result text,
  result_code text,
  -- Plain references (no FK): evidence outlives purged staging fixtures.
  payment_intent_id uuid,
  money_job_id uuid,
  unique (provider, provider_event_id)
);
create index provider_events_intent_idx on public.provider_events (payment_intent_id);
create index provider_events_job_idx on public.provider_events (money_job_id);
create index provider_events_result_idx on public.provider_events (processing_result);

create or replace function public.provider_events_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Evidence is immutable; the processing outcome is written exactly once, by the ingestion authority.
  if old.processed_at is not null
     or (new.id, new.provider, new.environment, new.provider_account, new.provider_event_id, new.source, new.event_type, new.provider_event_type,
         new.object_ref, new.life_help_reference, new.amount_minor, new.currency, new.occurred_at, new.provider_sequence, new.payload_sha256,
         new.signature_verified, new.received_at)
        is distinct from
        (old.id, old.provider, old.environment, old.provider_account, old.provider_event_id, old.source, old.event_type, old.provider_event_type,
         old.object_ref, old.life_help_reference, old.amount_minor, old.currency, old.occurred_at, old.provider_sequence, old.payload_sha256,
         old.signature_verified, old.received_at)
     or new.processed_at is null then
    raise exception 'provider_events rows are immutable provider evidence' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger provider_events_guard before update on public.provider_events for each row execute function public.provider_events_guard();
create trigger provider_events_no_delete before delete on public.provider_events for each row execute function public.audit_row_immutable();
create trigger provider_events_no_truncate before truncate on public.provider_events for each statement execute function public.audit_table_no_truncate();
revoke all on public.provider_events from public, anon, authenticated, service_role;
grant select on public.provider_events to service_role;

-- Lease a money job for a provider-evidence write, exactly like claim_money_job grants one (minus the
-- due-time gate: provider evidence is not a retry). NULL when a poller holds a live lease or the job is final.
create or replace function public.provider_event_job_lease(p_job_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_token uuid := gen_random_uuid();
begin
  select * into v_job from public.money_movement_jobs where id = p_job_id for update;
  if not found or v_job.status in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT') then return null; end if;
  if v_job.claim_expires_at is not null and v_job.claim_expires_at > now() then return null; end if;
  update public.money_movement_jobs set lease_token = v_token, claimed_at = now(), claim_expires_at = now() + interval '30 seconds',
    status = case when status in ('PENDING', 'RETRYABLE') then 'CLAIMED' else status end
  where id = v_job.id;
  return v_token;
end;
$$;

create or replace function public.ingest_provider_event(
  p_provider text, p_environment text, p_provider_account text, p_provider_event_id text, p_source text,
  p_event_type text, p_provider_event_type text, p_object_ref text, p_life_help_reference text,
  p_amount_minor bigint, p_currency text, p_occurred_at timestamptz, p_provider_sequence bigint,
  p_payload_sha256 text, p_signature_verified boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.provider_events%rowtype;
  v_existing public.provider_events%rowtype;
  v_link public.provider_payment_links%rowtype;
  v_intent public.payment_intents%rowtype;
  v_attempt public.money_movement_attempts%rowtype;
  v_job public.money_movement_jobs%rowtype;
  v_result text;
  v_code text;
  v_lease uuid;
  v_res jsonb;
  v_activation jsonb;
  v_kind text := split_part(coalesce(p_event_type, ''), '_', 1);
begin
  -- Fail closed before anything is recorded: unsigned, unknown / disabled provider, wrong environment.
  if p_signature_verified is distinct from true then return jsonb_build_object('success', false, 'code', 'SIGNATURE_NOT_VERIFIED'); end if;
  if p_source not in ('WEBHOOK', 'POLL') then return jsonb_build_object('success', false, 'code', 'SOURCE_INVALID'); end if;
  if not exists (select 1 from public.payment_providers where code = p_provider) then return jsonb_build_object('success', false, 'code', 'UNKNOWN_PROVIDER'); end if;
  if not exists (select 1 from public.payment_providers where code = p_provider and environment = p_environment and enabled) then
    return jsonb_build_object('success', false, 'code', 'PROVIDER_ENVIRONMENT_NOT_ENABLED');
  end if;

  -- Idempotency: (provider, provider_event_id) is unique. A replay returns the stored outcome; the same id
  -- with different content is an id-reuse attack / provider fault and is refused.
  insert into public.provider_events (provider, environment, provider_account, provider_event_id, source, event_type, provider_event_type,
    object_ref, life_help_reference, amount_minor, currency, occurred_at, provider_sequence, payload_sha256, signature_verified)
  values (p_provider, p_environment, p_provider_account, p_provider_event_id, p_source, p_event_type, p_provider_event_type,
    p_object_ref, p_life_help_reference, p_amount_minor, p_currency, p_occurred_at, p_provider_sequence, p_payload_sha256, true)
  on conflict (provider, provider_event_id) do nothing
  returning * into v_event;
  if v_event.id is null then
    select * into v_existing from public.provider_events where provider = p_provider and provider_event_id = p_provider_event_id for update;
    if v_existing.payload_sha256 <> p_payload_sha256 or v_existing.environment <> p_environment or v_existing.event_type <> p_event_type
       or v_existing.object_ref <> p_object_ref then
      return jsonb_build_object('success', false, 'code', 'EVENT_ID_REUSED', 'event_id', v_existing.id);
    end if;
    return jsonb_build_object('success', true, 'replayed', true, 'event_id', v_existing.id, 'result', v_existing.processing_result, 'code', v_existing.result_code);
  end if;

  if v_kind = 'PAYMENT' then
    select * into v_link from public.provider_payment_links where provider = p_provider and provider_payment_id = p_object_ref;
    if not found then
      v_result := 'UNMATCHED'; v_code := 'UNKNOWN_PROVIDER_PAYMENT';
    elsif v_link.environment <> p_environment then
      v_result := 'REJECTED'; v_code := 'WRONG_ENVIRONMENT';
    else
      select * into v_intent from public.payment_intents where id = v_link.payment_intent_id for update;
      if p_life_help_reference is not null and p_life_help_reference <> v_intent.reference then
        v_result := 'REVIEW'; v_code := 'TARGET_MISMATCH';
      elsif p_event_type = 'PAYMENT_HELD' then
        if v_intent.status in ('PAID_HELD', 'RELEASE_AUTHORIZED', 'PAYOUT_PROCESSING', 'SETTLED', 'REFUND_PENDING', 'REFUNDED') then
          v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_HELD';
        elsif p_amount_minor is distinct from v_intent.amount_base_units or p_currency is distinct from v_intent.fiat_currency then
          v_result := 'REVIEW'; v_code := case when p_currency is distinct from v_intent.fiat_currency then 'CURRENCY_MISMATCH' else 'AMOUNT_MISMATCH' end;
          if v_intent.status in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING') then
            update public.payment_intents set status = 'REVIEW_REQUIRED' where id = v_intent.id;
          end if;
        elsif v_intent.status not in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING') then
          -- EXPIRED / FAILED / REVIEW_REQUIRED: money held for an intent that is no longer payable -> operator.
          v_result := 'REVIEW'; v_code := 'HELD_FOR_UNPAYABLE_INTENT_' || v_intent.status;
        else
          -- Verified by the provider: hold and activate atomically (the same business authority as the chain rail).
          update public.payment_intents set status = 'PAID_HELD', verified_signature = 'provider:' || p_provider || ':' || p_object_ref,
            verified_at = now(), held_at = now()
          where id = v_intent.id;
          perform public.log_payment_event(v_intent.id, 'PAID_HELD', jsonb_build_object('provider', p_provider, 'provider_event', v_event.id));
          begin
            v_activation := public.activate_funded_checkout(v_intent.id);
            v_result := 'APPLIED'; v_code := 'PAID_HELD';
          exception when others then
            update public.service_checkouts set status = 'ACTIVATION_FAILED', updated_at = now() where id = v_intent.checkout_id;
            update public.payment_intents set status = 'REFUND_PENDING' where id = v_intent.id;
            insert into public.service_refunds (payment_intent_id, checkout_id, currency, amount, reason)
            values (v_intent.id, v_intent.checkout_id, v_intent.fiat_currency, v_intent.fiat_amount, 'ACTIVATION_FAILED');
            perform public.log_payment_event(v_intent.id, 'ACTIVATION_FAILED_REFUND', jsonb_build_object('error', sqlerrm));
            v_result := 'APPLIED'; v_code := 'ACTIVATION_FAILED_REFUND_PENDING';
          end;
        end if;
      elsif p_event_type = 'PAYMENT_AUTHORIZED' then
        if v_intent.status in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN') then
          update public.payment_intents set status = 'CONFIRMING' where id = v_intent.id;
          v_result := 'APPLIED'; v_code := 'CONFIRMING';
        else
          v_result := 'REPLAY_NO_CHANGE'; v_code := 'NOT_APPLICABLE_' || v_intent.status;
        end if;
      else -- PAYMENT_FAILED / PAYMENT_CANCELLED
        if v_intent.status in ('AWAITING_PAYMENT', 'TRANSACTION_SEEN', 'CONFIRMING') then
          update public.payment_intents set status = 'FAILED' where id = v_intent.id;
          v_result := 'APPLIED'; v_code := 'FAILED';
        elsif v_intent.status = 'FAILED' then
          v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_FAILED';
        else
          -- Older / conflicting evidence never regresses a held or later state.
          v_result := 'STALE_IGNORED'; v_code := 'NO_REGRESSION_FROM_' || v_intent.status;
        end if;
      end if;
      update public.provider_events set processed_at = now(), processing_result = v_result, result_code = v_code, payment_intent_id = v_intent.id
      where id = v_event.id;
      return jsonb_build_object('success', v_result in ('APPLIED', 'REPLAY_NO_CHANGE', 'STALE_IGNORED'), 'replayed', false, 'event_id', v_event.id,
        'result', v_result, 'code', v_code, 'payment_intent_id', v_intent.id, 'activation', v_activation);
    end if;
    update public.provider_events set processed_at = now(), processing_result = v_result, result_code = v_code where id = v_event.id;
    return jsonb_build_object('success', false, 'replayed', false, 'event_id', v_event.id, 'result', v_result, 'code', v_code);
  end if;

  -- REFUND_* / PAYOUT_*: only ever matched to an EXISTING outbox attempt (a webhook can never invent an
  -- obligation, a refund or a payout). The attempt's external id is the LIFE.HELP idempotency key the
  -- adapter handed to the provider.
  select * into v_attempt from public.money_movement_attempts
  where network = 'provider:' || p_provider || ':' || p_environment and external_id = p_object_ref;
  if not found then
    v_result := 'UNMATCHED'; v_code := 'UNKNOWN_PROVIDER_TRANSFER';
  else
    select * into v_job from public.money_movement_jobs where id = v_attempt.job_id;
    if (v_kind = 'REFUND') <> (v_job.obligation_type = 'REFUND') then
      v_result := 'REVIEW'; v_code := 'OBJECT_KIND_MISMATCH';
    elsif p_life_help_reference is not null and p_life_help_reference <> coalesce(v_attempt.adapter_payload ->> 'reference', '') then
      v_result := 'REVIEW'; v_code := 'TARGET_MISMATCH';
    elsif p_event_type in ('REFUND_SUBMITTED', 'PAYOUT_SUBMITTED') then
      v_result := 'NOTED'; v_code := 'SUBMITTED_' || v_attempt.state;
    elsif p_event_type in ('REFUND_CONFIRMED', 'PAYOUT_CONFIRMED') and v_attempt.state = 'CONFIRMED' then
      v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_CONFIRMED';
    elsif p_event_type in ('REFUND_FAILED', 'PAYOUT_FAILED') and v_attempt.state = 'CONFIRMED' then
      v_result := 'STALE_IGNORED'; v_code := 'NO_REGRESSION_FROM_CONFIRMED';
    elsif p_event_type in ('REFUND_FAILED', 'PAYOUT_FAILED') and v_attempt.state in ('FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED') then
      v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_TERMINAL';
    elsif v_attempt.state not in ('PREPARED', 'SUBMITTED') then
      -- Provider confirms an attempt this ledger already considers failed: never auto-resolve.
      v_lease := public.provider_event_job_lease(v_job.id);
      if v_lease is not null then
        perform public.release_money_job(v_job.id, v_lease, 'REVIEW', 'PROVIDER_CONFIRMED_TERMINAL_ATTEMPT', null);
      end if;
      v_result := 'REVIEW'; v_code := 'PROVIDER_CONFIRMED_TERMINAL_ATTEMPT';
    elsif p_amount_minor is distinct from v_attempt.amount_base_units or p_currency is distinct from v_attempt.asset then
      v_lease := public.provider_event_job_lease(v_job.id);
      if v_lease is not null then
        perform public.release_money_job(v_job.id, v_lease, 'REVIEW', 'PROVIDER_AMOUNT_MISMATCH', null);
      end if;
      v_result := 'REVIEW'; v_code := case when p_currency is distinct from v_attempt.asset then 'CURRENCY_MISMATCH' else 'AMOUNT_MISMATCH' end;
    else
      v_lease := public.provider_event_job_lease(v_job.id);
      if v_lease is null then
        -- A poller holds the lease (or the job is final): it observes the same provider state itself.
        v_result := 'DEFERRED_TO_RECONCILE'; v_code := 'JOB_BUSY_OR_FINAL';
      else
        v_res := public.record_money_attempt_result(v_job.id, v_lease, v_attempt.id,
          case when p_event_type in ('REFUND_CONFIRMED', 'PAYOUT_CONFIRMED') then 'CONFIRMED' else 'FAILED_ONCHAIN' end,
          case when p_event_type in ('REFUND_FAILED', 'PAYOUT_FAILED') then 'PROVIDER_REPORTED_FAILED' end);
        if coalesce((v_res ->> 'success')::boolean, false) then
          v_result := 'APPLIED'; v_code := v_res ->> 'status';
        else
          perform public.release_money_job(v_job.id, v_lease, 'RETRYABLE', 'PROVIDER_EVENT_NOT_APPLIED', 5);
          v_result := 'DEFERRED_TO_RECONCILE'; v_code := coalesce(v_res ->> 'code', 'NOT_APPLIED');
        end if;
      end if;
    end if;
  end if;
  update public.provider_events set processed_at = now(), processing_result = v_result, result_code = v_code, money_job_id = v_job.id where id = v_event.id;
  return jsonb_build_object('success', v_result in ('APPLIED', 'NOTED', 'REPLAY_NO_CHANGE', 'STALE_IGNORED', 'DEFERRED_TO_RECONCILE'), 'replayed', false,
    'event_id', v_event.id, 'result', v_result, 'code', v_code, 'money_job_id', v_job.id);
end;
$$;

-- Provider transfer target, derived ONLY from business rows: amount / currency from the obligation or refund,
-- payee from the payee's ACTIVE PROVIDER_PAYEE destination for this provider + environment, a refund goes back
-- through the original provider payment. Eligibility (capability policy + compliance hook) is enforced here.
create or replace function public.provider_transfer_target(p_job_id uuid, p_provider text, p_environment text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_ob public.payout_obligations%rowtype;
  v_refund public.service_refunds%rowtype;
  v_intent public.payment_intents%rowtype;
  v_link public.provider_payment_links%rowtype;
  v_dest public.payout_destinations%rowtype;
  v_exp integer;
  v_amount numeric;
  v_currency text;
  v_country text;
  v_capability text;
  v_subject_kind text;
  v_subject text;
  v_elig jsonb;
begin
  select * into v_job from public.money_movement_jobs where id = p_job_id;
  if not found then return jsonb_build_object('success', false, 'code', 'JOB_NOT_FOUND'); end if;
  if v_job.obligation_type = 'REFUND' then
    select * into v_refund from public.service_refunds where id = v_job.service_refund_id;
    select * into v_intent from public.payment_intents where id = v_refund.payment_intent_id;
    if v_intent.network is distinct from 'provider:' || p_provider || ':' || p_environment then
      return jsonb_build_object('success', false, 'code', 'RAIL_MISMATCH');
    end if;
    select * into v_link from public.provider_payment_links where payment_intent_id = v_intent.id;
    if not found then return jsonb_build_object('success', false, 'code', 'PROVIDER_PAYMENT_UNLINKED'); end if;
    select country into v_country from public.service_checkouts where id = v_refund.checkout_id;
    v_amount := v_refund.amount; v_currency := v_refund.currency;
    v_capability := 'REFUND'; v_subject_kind := 'CUSTOMER'; v_subject := v_intent.customer_id;
  else
    select * into v_ob from public.payout_obligations where id = v_job.payout_obligation_id;
    if v_ob.kind = 'HELPER_SERVICE' then
      select * into v_dest from public.payout_destinations where owner_helper_id = v_ob.helper_id and status = 'ACTIVE'
        and payout_method = 'PROVIDER_PAYEE' and provider = p_provider and provider_environment = p_environment;
      v_capability := 'HELPER_PAYOUT'; v_subject_kind := 'HELPER_PAYEE'; v_subject := v_ob.helper_id::text;
    else
      select d.* into v_dest from public.payout_destinations d join public.referral_rewards r on r.referrer_identity_id = d.owner_identity_id
      where r.id = v_ob.referral_reward_id and d.status = 'ACTIVE' and d.payout_method = 'PROVIDER_PAYEE' and d.provider = p_provider
        and d.provider_environment = p_environment;
      v_capability := 'REFERRAL_PAYOUT'; v_subject_kind := 'REFERRAL_RECIPIENT'; v_subject := v_dest.owner_identity_id::text;
    end if;
    if v_dest.id is null then return jsonb_build_object('success', false, 'code', 'PAYOUT_DESTINATION_MISSING'); end if;
    v_country := v_dest.country; v_amount := v_ob.net_amount; v_currency := v_ob.currency;
  end if;
  v_exp := public.currency_minor_exponent(v_currency);
  if v_exp is null then return jsonb_build_object('success', false, 'code', 'CURRENCY_UNSUPPORTED'); end if;
  if v_amount * power(10, v_exp) <> trunc(v_amount * power(10, v_exp)) then return jsonb_build_object('success', false, 'code', 'AMOUNT_NOT_REPRESENTABLE'); end if;
  v_elig := public.money_movement_eligibility(v_capability, v_country, p_provider, p_environment, v_subject_kind, v_subject);
  if not (v_elig ->> 'eligible')::boolean then return jsonb_build_object('success', false, 'code', v_elig ->> 'code'); end if;
  return jsonb_build_object('success', true, 'kind', case when v_job.obligation_type = 'REFUND' then 'REFUND' else 'PAYOUT' end,
    'obligation_type', v_job.obligation_type, 'currency', v_currency, 'amount_minor', (v_amount * power(10, v_exp))::bigint,
    'payee_token', v_dest.provider_payee_token, 'provider_payment_id', v_link.provider_payment_id, 'reference', v_job.id::text);
end;
$$;

-- 020 redefinition: the fixture purge also removes a fixture's provider payment links (provider_events are
-- evidence and stay; they hold no foreign keys).
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
  delete from public.money_movement_attempts where job_id in (
    select j.id from public.money_movement_jobs j
    where j.payout_obligation_id in (select o.id from public.payout_obligations o join public.payment_intents i on i.id = o.payment_intent_id where i.checkout_id = p_checkout_id)
       or j.service_refund_id in (select id from public.service_refunds where checkout_id = p_checkout_id));
  delete from public.money_movement_jobs
  where payout_obligation_id in (select o.id from public.payout_obligations o join public.payment_intents i on i.id = o.payment_intent_id where i.checkout_id = p_checkout_id)
     or service_refund_id in (select id from public.service_refunds where checkout_id = p_checkout_id);
  delete from public.customer_completion_confirmations where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.payout_obligations where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.service_refunds where checkout_id = p_checkout_id;
  delete from public.request_media where checkout_id = p_checkout_id;
  delete from public.payment_chain_transactions where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.payment_events where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.service_requests where id = v_checkout.request_id;
  delete from public.provider_payment_links where payment_intent_id in (select id from public.payment_intents where checkout_id = p_checkout_id);
  delete from public.payment_intents where checkout_id = p_checkout_id;
  delete from public.payment_quotes where checkout_id = p_checkout_id;
  delete from public.helper_checkout_reservations where checkout_id = p_checkout_id;
  delete from public.service_checkouts where id = p_checkout_id;
  if v_checkout.customer_offer_id is not null then delete from public.customer_offers where id = v_checkout.customer_offer_id; end if;
  perform set_config('life_help.payment_fixture_purge', 'off', true);
  return jsonb_build_object('success', true, 'purged', true);
end;
$$;

-- =============================================================================================
-- 7. Retention classes (schema-level distinction; no durations are defined here).
-- =============================================================================================
comment on table public.provider_events is 'RETENTION CLASS: PROVIDER_EVIDENCE - immutable provider webhook / poll evidence; never deleted by cleanup.';
comment on table public.provider_payment_links is 'RETENTION CLASS: PROVIDER_EVIDENCE - immutable provider payment reference binding.';
comment on table public.payment_chain_transactions is 'RETENTION CLASS: PROVIDER_EVIDENCE - chain observations (devnet rail).';
comment on table public.payment_events is 'RETENTION CLASS: FINANCIAL_BUSINESS_HISTORY - internal ledger log; immutable.';
comment on table public.payment_intents is 'RETENTION CLASS: FINANCIAL_BUSINESS_HISTORY';
comment on table public.payout_obligations is 'RETENTION CLASS: FINANCIAL_BUSINESS_HISTORY';
comment on table public.service_refunds is 'RETENTION CLASS: FINANCIAL_BUSINESS_HISTORY';
comment on table public.referral_rewards is 'RETENTION CLASS: FINANCIAL_BUSINESS_HISTORY';
comment on table public.money_movement_jobs is 'RETENTION CLASS: OPERATIONAL_RETRY_STATE (rows kept; lease / retry columns are operational)';
comment on table public.money_movement_attempts is 'RETENTION CLASS: OPERATIONAL_RETRY_STATE (external ids are evidence; signed payloads wiped when terminal)';

-- =============================================================================================
-- Privileges
-- =============================================================================================
revoke all on function public.audit_row_immutable() from public, anon, authenticated, service_role;
revoke all on function public.audit_table_no_truncate() from public, anon, authenticated, service_role;
revoke all on function public.payout_destinations_guard() from public, anon, authenticated, service_role;
revoke all on function public.provider_events_guard() from public, anon, authenticated, service_role;
revoke all on function public.provider_event_job_lease(uuid) from public, anon, authenticated, service_role;
revoke all on function public.provider_capability_enabled(text, text, text, text) from public, anon, authenticated;
revoke all on function public.money_movement_eligibility(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.currency_minor_exponent(text) from public, anon, authenticated;
revoke all on function public.open_provider_payment_intent(uuid, text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.link_provider_payment(uuid, text) from public, anon, authenticated;
revoke all on function public.provider_transfer_target(uuid, text, text) from public, anon, authenticated;
revoke all on function public.ingest_provider_event(text, text, text, text, text, text, text, text, text, bigint, text, timestamptz, bigint, text, boolean) from public, anon, authenticated;
grant execute on function public.provider_capability_enabled(text, text, text, text) to service_role;
grant execute on function public.money_movement_eligibility(text, text, text, text, text, text) to service_role;
grant execute on function public.currency_minor_exponent(text) to service_role;
grant execute on function public.open_provider_payment_intent(uuid, text, text, text, text, text, integer) to service_role;
grant execute on function public.link_provider_payment(uuid, text) to service_role;
grant execute on function public.provider_transfer_target(uuid, text, text) to service_role;
grant execute on function public.ingest_provider_event(text, text, text, text, text, text, text, text, text, bigint, text, timestamptz, bigint, text, boolean) to service_role;

commit;

-- Rollback (review-only): drop ingest_provider_event, provider_event_job_lease, link_provider_payment,
-- open_provider_payment_intent, money_movement_eligibility, provider_capability_enabled, currency_minor_exponent,
-- the provider_* / payment_providers / payment_capability_policies tables (only while they hold no rows of value),
-- the new triggers; restore the 014 check constraints on payment_quotes / payment_intents / payout_obligations /
-- payout_destinations; drop destination_kind / provider_environment; grant the previous payment_events /
-- payout_destinations privileges back only if deliberately reverting the hardening.

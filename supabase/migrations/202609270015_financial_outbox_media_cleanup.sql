-- 202609270015: durable money-movement outbox (crash recovery) + unpaid-checkout media lifecycle.
--
-- A. Money-movement outbox. The 014 ledger (payout_obligations, service_refunds, payment_intents,
--    payment_events) stays the business source of truth and is NOT duplicated. On top of it:
--      money_movement_jobs      exactly ONE logical job per business obligation (Helper payout,
--                               Referral payout, refund); created atomically with the obligation by
--                               trigger, so no crash can leave an obligation without its job.
--      money_movement_attempts  1 -> N external attempts per job, append-only history (never
--                               overwritten). Provider-neutral columns: external_id is a chain
--                               signature or a provider submission id; adapter_payload holds public
--                               adapter metadata (e.g. recent blockhash / last valid block height).
--    Workers take a LEASE (lease_token + claim_expires_at), never a permanent lock: a crashed worker's
--    job is reclaimable after the lease expires, and every write is fenced by the lease token, so a
--    stale worker can no longer change the job. An attempt is persisted as PREPARED (with its public
--    signature and the signed payload, server-only) BEFORE the adapter broadcasts it; a retry always
--    reconciles the existing attempt first (same signature / same signed payload), and a replacement
--    attempt is only possible after the previous one is terminal (FAILED_ONCHAIN or provably
--    EXPIRED_NOT_LANDED). CLAIMED / PREPARED / SUBMITTED / CONFIRMING are never "paid": only CONFIRMED
--    (finalized, re-verified proof) moves the obligation to PAID / COMPLETED, through the existing
--    014 result functions. Bounded retry with exponential backoff; permanent errors -> REVIEW_REQUIRED.
--    No private keys are stored anywhere. The signed payload contains no key material, can only
--    execute the one recorded transfer, is readable by service_role only and is cleared once the
--    attempt is terminal.
--
-- B. Media lifecycle. Media of a checkout that ends without activation (EXPIRED / CANCELLED /
--    ACTIVATION_FAILED) is queued for deletion atomically with the checkout's end (trigger). Stale
--    OPEN checkouts are expired by a server-only sweep; customers can cancel an unpaid checkout.
--    Deletion keeps DELETION_PENDING (= delete queued) until storage deletion is verified; failures
--    are recorded and retried with backoff. All writes go through narrow security-definer RPCs:
--    service_role still has NO direct UPDATE on request_media.
--
-- Applies on top of 014. Does not modify applied migrations; it redefines some 014 functions
-- (create or replace) where noted.

begin;

-- =============================================================================================
-- A1. Jobs
-- =============================================================================================
create table public.money_movement_jobs (
  id uuid primary key default gen_random_uuid(),
  obligation_type text not null check (obligation_type in ('HELPER_PAYOUT', 'REFERRAL_PAYOUT', 'REFUND')),
  payout_obligation_id uuid unique references public.payout_obligations(id) on delete restrict,
  service_refund_id uuid unique references public.service_refunds(id) on delete restrict,
  -- Business rail of the obligation (USDC_SOLANA, BANK_PROVIDER, UNASSIGNED, ORIGINAL_PAYMENT_RAIL, ...).
  rail text not null check (rail ~ '^[A-Z0-9_]{2,40}$'),
  -- Fixed by the first external attempt; every later attempt must match (never a silent change).
  provider text check (provider ~ '^[A-Z0-9_]{2,40}$'),
  network text check (length(network) between 2 and 40),
  asset text check (length(asset) between 2 and 20),
  amount_base_units bigint check (amount_base_units > 0),
  status text not null default 'PENDING' check (status in (
    'PENDING', 'CLAIMED', 'PREPARED', 'SUBMITTED', 'CONFIRMING', 'CONFIRMED', 'RETRYABLE', 'REVIEW_REQUIRED', 'FAILED_PERMANENT'
  )),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  failure_count integer not null default 0 check (failure_count >= 0),
  max_failures integer not null default 8 check (max_failures between 1 and 50),
  lease_token uuid,
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  last_attempt_at timestamptz,
  next_retry_at timestamptz not null default now(),
  last_error_code text check (last_error_code is null or length(last_error_code) <= 120),
  last_error_class text check (last_error_class in ('RETRYABLE', 'PERMANENT', 'REVIEW', 'WAITING')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Business idempotency: exactly one obligation link, of the job's own type (+ unique links above).
  constraint money_movement_jobs_one_obligation check (
    (obligation_type in ('HELPER_PAYOUT', 'REFERRAL_PAYOUT') and payout_obligation_id is not null and service_refund_id is null)
    or (obligation_type = 'REFUND' and service_refund_id is not null and payout_obligation_id is null)
  )
);
create index money_movement_jobs_due_idx on public.money_movement_jobs (next_retry_at)
  where status not in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT');

-- =============================================================================================
-- A2. Attempts (append-only history)
-- =============================================================================================
create table public.money_movement_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.money_movement_jobs(id) on delete restrict,
  attempt_number integer not null check (attempt_number >= 1),
  provider text not null check (provider ~ '^[A-Z0-9_]{2,40}$'),
  network text not null check (length(network) between 2 and 40),
  asset text not null check (length(asset) between 2 and 20),
  amount_base_units bigint not null check (amount_base_units > 0),
  destination text not null check (length(destination) between 8 and 200),
  external_id text not null check (length(external_id) between 8 and 200),
  adapter_payload jsonb not null default '{}'::jsonb,
  signed_payload text check (signed_payload is null or length(signed_payload) <= 4096),
  state text not null default 'PREPARED' check (state in ('PREPARED', 'SUBMITTED', 'CONFIRMED', 'FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED')),
  failure_category text check (failure_category is null or length(failure_category) <= 120),
  prepared_at timestamptz not null default now(),
  submitted_at timestamptz,
  resolved_at timestamptz,
  unique (job_id, attempt_number),
  -- One external transaction / provider submission can never belong to two attempts.
  unique (network, external_id),
  constraint money_movement_attempts_terminal_payload check (state in ('PREPARED', 'SUBMITTED') or signed_payload is null)
);
-- At most one live attempt per job, and at most one confirmed attempt per job.
create unique index money_movement_attempts_live_uidx on public.money_movement_attempts (job_id) where state in ('PREPARED', 'SUBMITTED');
create unique index money_movement_attempts_confirmed_uidx on public.money_movement_attempts (job_id) where state = 'CONFIRMED';

create or replace function public.money_movement_attempts_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.id, new.job_id, new.attempt_number, new.provider, new.network, new.asset, new.amount_base_units, new.destination,
      new.external_id, new.adapter_payload, new.prepared_at)
     is distinct from
     (old.id, old.job_id, old.attempt_number, old.provider, old.network, old.asset, old.amount_base_units, old.destination,
      old.external_id, old.adapter_payload, old.prepared_at) then
    raise exception 'money_movement_attempts: attempt history is immutable' using errcode = 'P0001';
  end if;
  if old.state <> new.state and not (
       (old.state = 'PREPARED' and new.state in ('SUBMITTED', 'CONFIRMED', 'FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED'))
    or (old.state = 'SUBMITTED' and new.state in ('CONFIRMED', 'FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED'))
  ) then
    raise exception 'money_movement_attempts: invalid state transition % -> %', old.state, new.state using errcode = 'P0001';
  end if;
  if old.state in ('CONFIRMED', 'FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED') and (new.state, new.failure_category, new.resolved_at) is distinct from (old.state, old.failure_category, old.resolved_at) then
    raise exception 'money_movement_attempts: a terminal attempt is immutable' using errcode = 'P0001';
  end if;
  if old.signed_payload is null and new.signed_payload is not null then
    raise exception 'money_movement_attempts: a signed payload is never re-attached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger money_movement_attempts_guard before update on public.money_movement_attempts for each row execute function public.money_movement_attempts_guard();

create or replace function public.money_movement_jobs_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.id, new.obligation_type, new.payout_obligation_id, new.service_refund_id, new.rail, new.created_at)
     is distinct from (old.id, old.obligation_type, old.payout_obligation_id, old.service_refund_id, old.rail, old.created_at)
     or (old.provider is not null and new.provider is distinct from old.provider)
     or (old.network is not null and new.network is distinct from old.network)
     or (old.asset is not null and new.asset is distinct from old.asset)
     or (old.amount_base_units is not null and new.amount_base_units is distinct from old.amount_base_units) then
    raise exception 'money_movement_jobs: the business binding of a job is immutable' using errcode = 'P0001';
  end if;
  if old.status in ('CONFIRMED', 'FAILED_PERMANENT') and new.status <> old.status then
    raise exception 'money_movement_jobs: % is final', old.status using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger money_movement_jobs_guard before update on public.money_movement_jobs for each row execute function public.money_movement_jobs_guard();
create trigger money_movement_jobs_no_delete before delete on public.money_movement_jobs for each row execute function public.money_row_no_delete();
create trigger money_movement_attempts_no_delete before delete on public.money_movement_attempts for each row execute function public.money_row_no_delete();

revoke all on public.money_movement_jobs, public.money_movement_attempts from public, anon, authenticated, service_role;
grant select on public.money_movement_jobs, public.money_movement_attempts to service_role;

-- =============================================================================================
-- A3. One job per obligation, created atomically with the obligation.
-- =============================================================================================
create or replace function public.enqueue_payout_money_job()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.money_movement_jobs (obligation_type, payout_obligation_id, rail)
  values (case new.kind when 'HELPER_SERVICE' then 'HELPER_PAYOUT' else 'REFERRAL_PAYOUT' end, new.id, new.payout_rail)
  on conflict (payout_obligation_id) do nothing;
  return new;
end;
$$;
create trigger payout_obligations_enqueue_job after insert on public.payout_obligations for each row execute function public.enqueue_payout_money_job();

create or replace function public.enqueue_refund_money_job()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.money_movement_jobs (obligation_type, service_refund_id, rail)
  values ('REFUND', new.id, 'ORIGINAL_PAYMENT_RAIL')
  on conflict (service_refund_id) do nothing;
  return new;
end;
$$;
create trigger service_refunds_enqueue_job after insert on public.service_refunds for each row execute function public.enqueue_refund_money_job();

-- Backfill: every obligation / refund that is not final gets its job. An already SUBMITTED one (014
-- dispatcher) gets its known chain transaction as attempt 1 WITHOUT blockhash metadata, so it can only
-- be reconciled (never replaced automatically: expiry cannot be proven -> review).
insert into public.money_movement_jobs (obligation_type, payout_obligation_id, rail, status)
select case o.kind when 'HELPER_SERVICE' then 'HELPER_PAYOUT' else 'REFERRAL_PAYOUT' end, o.id, o.payout_rail,
       case o.status when 'SUBMITTED' then 'SUBMITTED' when 'REVIEW_REQUIRED' then 'REVIEW_REQUIRED' else 'PENDING' end
from public.payout_obligations o
where o.status in ('CREATED', 'FAILED', 'SUBMITTED', 'REVIEW_REQUIRED');
insert into public.money_movement_jobs (obligation_type, service_refund_id, rail, status)
select 'REFUND', r.id, 'ORIGINAL_PAYMENT_RAIL', case r.status when 'SUBMITTED' then 'SUBMITTED' else 'PENDING' end
from public.service_refunds r
where r.status in ('PENDING', 'FAILED', 'SUBMITTED');
insert into public.money_movement_attempts (job_id, attempt_number, provider, network, asset, amount_base_units, destination, external_id, adapter_payload, state, submitted_at)
select j.id, 1, o.provider, o.chain_network, 'USDC', 1, 'LEGACY_UNKNOWN_DESTINATION', o.chain_signature, jsonb_build_object('legacy', true), 'SUBMITTED', o.submitted_at
from public.money_movement_jobs j join public.payout_obligations o on o.id = j.payout_obligation_id
where o.status = 'SUBMITTED' and o.chain_signature is not null and o.provider is not null and o.chain_network is not null;
update public.money_movement_jobs j set attempt_count = 1
where exists (select 1 from public.money_movement_attempts a where a.job_id = j.id);

-- =============================================================================================
-- A4. Worker RPCs (service_role only). Every mutation is fenced by the caller's lease token.
-- =============================================================================================

-- Business context for the adapter (read-only snapshot of the 014 ledger rows the job points to).
create or replace function public.money_job_context(p_job public.money_movement_jobs)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_ob public.payout_obligations%rowtype;
  v_refund public.service_refunds%rowtype;
  v_intent public.payment_intents%rowtype;
  v_quote public.payment_quotes%rowtype;
  v_country text;
  v_dest text;
begin
  if p_job.obligation_type = 'REFUND' then
    select * into v_refund from public.service_refunds where id = p_job.service_refund_id;
    select * into v_intent from public.payment_intents where id = v_refund.payment_intent_id;
    select * into v_quote from public.payment_quotes where id = v_intent.quote_id;
    select country into v_country from public.service_checkouts where id = v_refund.checkout_id;
    return jsonb_build_object('kind', 'REFUND', 'refund_id', v_refund.id, 'business_status', v_refund.status, 'reason', v_refund.reason,
      'currency', v_refund.currency, 'amount', v_refund.amount, 'country', v_country,
      'intent', jsonb_build_object('id', v_intent.id, 'network', v_intent.network, 'mint', v_intent.mint, 'recipient', v_intent.recipient,
        'amount_base_units', v_intent.amount_base_units::text, 'fiat_amount', v_intent.fiat_amount, 'verified_signature', v_intent.verified_signature),
      'fx_rate', v_quote.fx_rate);
  end if;
  select * into v_ob from public.payout_obligations where id = p_job.payout_obligation_id;
  if v_ob.kind = 'HELPER_SERVICE' then
    select * into v_intent from public.payment_intents where id = v_ob.payment_intent_id;
    select * into v_quote from public.payment_quotes where id = v_intent.quote_id;
    select country into v_country from public.service_requests where id = v_ob.request_id;
    select provider_payee_token into v_dest from public.payout_destinations
    where owner_helper_id = v_ob.helper_id and payout_method = 'USDC_SOLANA' and status = 'ACTIVE';
  else
    select d.provider_payee_token into v_dest from public.payout_destinations d
    join public.referral_rewards r on r.referrer_identity_id = d.owner_identity_id
    where r.id = v_ob.referral_reward_id and d.payout_method = 'USDC_SOLANA' and d.status = 'ACTIVE';
  end if;
  return jsonb_build_object('kind', v_ob.kind, 'obligation_id', v_ob.id, 'business_status', v_ob.status, 'currency', v_ob.currency,
    'net_amount', v_ob.net_amount, 'helper_id', v_ob.helper_id, 'request_id', v_ob.request_id, 'referral_reward_id', v_ob.referral_reward_id,
    'payout_rail', v_ob.payout_rail, 'country', v_country, 'destination', v_dest,
    'intent', case when v_intent.id is not null then jsonb_build_object('id', v_intent.id, 'amount_base_units', v_intent.amount_base_units::text) end,
    'fx_rate', v_quote.fx_rate);
end;
$$;

create or replace function public.money_attempt_json(p_attempt public.money_movement_attempts, p_with_payload boolean)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object('attempt_id', p_attempt.id, 'attempt_number', p_attempt.attempt_number, 'state', p_attempt.state,
    'provider', p_attempt.provider, 'network', p_attempt.network, 'asset', p_attempt.asset, 'amount_base_units', p_attempt.amount_base_units::text,
    'destination', p_attempt.destination, 'external_id', p_attempt.external_id, 'adapter_payload', p_attempt.adapter_payload,
    'signed_payload', case when p_with_payload then p_attempt.signed_payload end, 'submitted_at', p_attempt.submitted_at);
$$;

create or replace function public.claim_money_job(p_job_id uuid, p_lease_seconds integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_token uuid := gen_random_uuid();
  v_lease integer := least(greatest(coalesce(p_lease_seconds, 120), 15), 900);
  v_recovered boolean;
  v_live public.money_movement_attempts%rowtype;
begin
  if p_job_id is not null then
    select * into v_job from public.money_movement_jobs where id = p_job_id for update skip locked;
    if not found then return jsonb_build_object('success', false, 'code', 'JOB_BUSY_OR_NOT_FOUND'); end if;
  else
    select * into v_job from public.money_movement_jobs
    where status not in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT') and next_retry_at <= now()
      and (claim_expires_at is null or claim_expires_at <= now())
    order by next_retry_at limit 1 for update skip locked;
    if not found then return jsonb_build_object('success', true, 'job', null); end if;
  end if;
  if v_job.status in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT') then
    return jsonb_build_object('success', false, 'code', 'JOB_FINAL', 'status', v_job.status);
  end if;
  if v_job.claim_expires_at is not null and v_job.claim_expires_at > now() then
    return jsonb_build_object('success', false, 'code', 'LEASE_HELD', 'claim_expires_at', v_job.claim_expires_at);
  end if;
  if v_job.next_retry_at > now() then return jsonb_build_object('success', false, 'code', 'NOT_DUE', 'next_retry_at', v_job.next_retry_at); end if;
  -- A previous lease that was never released = that worker died (or stalled) mid-job.
  v_recovered := v_job.lease_token is not null;
  update public.money_movement_jobs set lease_token = v_token, claimed_at = now(), claim_expires_at = now() + make_interval(secs => v_lease),
    status = case when status in ('PENDING', 'RETRYABLE') then 'CLAIMED' else status end
  where id = v_job.id returning * into v_job;
  select * into v_live from public.money_movement_attempts where job_id = v_job.id and state in ('PREPARED', 'SUBMITTED');
  return jsonb_build_object('success', true, 'job', jsonb_build_object(
    'job_id', v_job.id, 'lease_token', v_token, 'claim_expires_at', v_job.claim_expires_at, 'recovered_lease', v_recovered,
    'obligation_type', v_job.obligation_type, 'rail', v_job.rail, 'status', v_job.status, 'provider', v_job.provider, 'network', v_job.network,
    'asset', v_job.asset, 'amount_base_units', v_job.amount_base_units::text, 'attempt_count', v_job.attempt_count, 'max_attempts', v_job.max_attempts,
    'failure_count', v_job.failure_count,
    'live_attempt', case when v_live.id is not null then public.money_attempt_json(v_live, true) end,
    'attempts', (select coalesce(jsonb_agg(public.money_attempt_json(a, false) order by a.attempt_number), '[]'::jsonb) from public.money_movement_attempts a where a.job_id = v_job.id),
    'context', public.money_job_context(v_job)));
end;
$$;

-- Lease fence: the job row (locked) if and only if the caller still holds a live lease.
create or replace function public.money_job_fenced(p_job_id uuid, p_lease uuid)
returns public.money_movement_jobs
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
begin
  select * into v_job from public.money_movement_jobs where id = p_job_id for update;
  if not found or v_job.lease_token is distinct from p_lease or v_job.claim_expires_at is null or v_job.claim_expires_at <= now()
     or v_job.status in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT') then
    return null;
  end if;
  return v_job;
end;
$$;

-- Business side of "the attempt is (or may be) on the network": obligation / refund -> SUBMITTED.
create or replace function public.money_job_mark_business_submitted(p_job public.money_movement_jobs, p_attempt public.money_movement_attempts)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_ob public.payout_obligations%rowtype;
  v_res jsonb;
begin
  if p_job.obligation_type = 'REFUND' then
    update public.service_refunds set status = 'SUBMITTED', provider = p_attempt.provider, provider_refund_id = p_job.id::text,
      chain_network = p_attempt.network, chain_signature = p_attempt.external_id
    where id = p_job.service_refund_id and status in ('PENDING', 'FAILED', 'SUBMITTED');
    return;
  end if;
  select * into v_ob from public.payout_obligations where id = p_job.payout_obligation_id for update;
  if v_ob.status in ('CREATED', 'FAILED') then
    v_res := public.record_payout_submission(v_ob.id, p_attempt.provider, p_job.id::text, p_attempt.network, p_attempt.external_id);
    if not coalesce((v_res ->> 'success')::boolean, false) then
      raise exception 'money job %: payout submission not recorded (%)', p_job.id, v_res ->> 'code' using errcode = 'P0001';
    end if;
  elsif v_ob.status = 'SUBMITTED' and v_ob.chain_signature is distinct from p_attempt.external_id then
    -- Replacement attempt of the SAME logical payout (the previous one provably did not land).
    update public.payout_obligations set chain_network = p_attempt.network, chain_signature = p_attempt.external_id, updated_at = now()
    where id = v_ob.id;
  end if;
end;
$$;

create or replace function public.prepare_money_attempt(
  p_job_id uuid, p_lease uuid, p_provider text, p_network text, p_asset text, p_amount_base_units bigint, p_destination text,
  p_external_id text, p_adapter_payload jsonb, p_signed_payload text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_live public.money_movement_attempts%rowtype;
  v_business text;
  v_id uuid;
begin
  v_job := public.money_job_fenced(p_job_id, p_lease);
  if v_job.id is null then return jsonb_build_object('success', false, 'code', 'LEASE_LOST'); end if;
  if exists (select 1 from public.money_movement_attempts where job_id = v_job.id and state = 'CONFIRMED') then
    return jsonb_build_object('success', false, 'code', 'ALREADY_CONFIRMED');
  end if;
  select * into v_live from public.money_movement_attempts where job_id = v_job.id and state in ('PREPARED', 'SUBMITTED');
  if found then
    -- Never a second live attempt: the caller must reconcile this one first.
    return jsonb_build_object('success', false, 'code', 'LIVE_ATTEMPT_EXISTS', 'attempt', public.money_attempt_json(v_live, true));
  end if;
  if v_job.obligation_type = 'REFUND' then
    select status into v_business from public.service_refunds where id = v_job.service_refund_id;
    if v_business not in ('PENDING', 'FAILED', 'SUBMITTED') then
      update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'BUSINESS_STATE_' || v_business, last_error_class = 'REVIEW',
        lease_token = null, claim_expires_at = null where id = v_job.id;
      return jsonb_build_object('success', false, 'code', 'BUSINESS_NOT_PAYABLE', 'status', 'REVIEW_REQUIRED');
    end if;
  else
    select status into v_business from public.payout_obligations where id = v_job.payout_obligation_id;
    if v_business not in ('CREATED', 'FAILED', 'SUBMITTED') then
      update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'BUSINESS_STATE_' || v_business, last_error_class = 'REVIEW',
        lease_token = null, claim_expires_at = null where id = v_job.id;
      return jsonb_build_object('success', false, 'code', 'BUSINESS_NOT_PAYABLE', 'status', 'REVIEW_REQUIRED');
    end if;
  end if;
  if v_job.attempt_count >= v_job.max_attempts then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'MAX_ATTEMPTS', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', false, 'code', 'MAX_ATTEMPTS', 'status', 'REVIEW_REQUIRED');
  end if;
  if (v_job.amount_base_units is not null and v_job.amount_base_units <> p_amount_base_units)
     or (v_job.provider is not null and v_job.provider <> p_provider)
     or (v_job.network is not null and v_job.network <> p_network)
     or (v_job.asset is not null and v_job.asset <> p_asset) then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'BUSINESS_AMOUNT_MISMATCH', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', false, 'code', 'BUSINESS_AMOUNT_MISMATCH', 'status', 'REVIEW_REQUIRED');
  end if;
  begin
    insert into public.money_movement_attempts (job_id, attempt_number, provider, network, asset, amount_base_units, destination, external_id, adapter_payload, signed_payload)
    values (v_job.id, v_job.attempt_count + 1, p_provider, p_network, p_asset, p_amount_base_units, p_destination, p_external_id,
            coalesce(p_adapter_payload, '{}'::jsonb), p_signed_payload)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('success', false, 'code', 'DUPLICATE_EXTERNAL_ID');
  end;
  update public.money_movement_jobs set status = 'PREPARED', attempt_count = attempt_count + 1, last_attempt_at = now(),
    amount_base_units = p_amount_base_units, provider = p_provider, network = p_network, asset = p_asset
  where id = v_job.id;
  return jsonb_build_object('success', true, 'attempt_id', v_id, 'attempt_number', v_job.attempt_count + 1);
end;
$$;

create or replace function public.mark_money_attempt_submitted(p_job_id uuid, p_lease uuid, p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_attempt public.money_movement_attempts%rowtype;
begin
  v_job := public.money_job_fenced(p_job_id, p_lease);
  if v_job.id is null then return jsonb_build_object('success', false, 'code', 'LEASE_LOST'); end if;
  select * into v_attempt from public.money_movement_attempts where id = p_attempt_id and job_id = v_job.id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_FOUND'); end if;
  if v_attempt.state = 'SUBMITTED' then return jsonb_build_object('success', true, 'replayed', true); end if;
  if v_attempt.state <> 'PREPARED' then return jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_LIVE', 'state', v_attempt.state); end if;
  update public.money_movement_attempts set state = 'SUBMITTED', submitted_at = now() where id = v_attempt.id returning * into v_attempt;
  perform public.money_job_mark_business_submitted(v_job, v_attempt);
  update public.money_movement_jobs set status = 'SUBMITTED' where id = v_job.id;
  return jsonb_build_object('success', true, 'replayed', false);
end;
$$;

-- Result of reconciling an attempt:
--   CONFIRMED           finalized + re-verified (destination, asset, amount, reference) -> business PAID / COMPLETED
--   PENDING             on the network, not final yet -> CONFIRMING, re-check soon (no new attempt)
--   FAILED_ONCHAIN      landed with an error (moved nothing) -> a replacement attempt is allowed
--   EXPIRED_NOT_LANDED  provably can never land (blockhash expired, confirmation search empty) -> replacement allowed
create or replace function public.record_money_attempt_result(p_job_id uuid, p_lease uuid, p_attempt_id uuid, p_outcome text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_attempt public.money_movement_attempts%rowtype;
  v_res jsonb;
  v_backoff integer;
begin
  if p_outcome not in ('CONFIRMED', 'PENDING', 'FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED') then return jsonb_build_object('success', false, 'code', 'INVALID_OUTCOME'); end if;
  v_job := public.money_job_fenced(p_job_id, p_lease);
  if v_job.id is null then return jsonb_build_object('success', false, 'code', 'LEASE_LOST'); end if;
  select * into v_attempt from public.money_movement_attempts where id = p_attempt_id and job_id = v_job.id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_FOUND'); end if;
  if v_attempt.state not in ('PREPARED', 'SUBMITTED') then return jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_LIVE', 'state', v_attempt.state); end if;

  if p_outcome in ('CONFIRMED', 'PENDING') and v_attempt.state = 'PREPARED' then
    -- Seen on the network: it WAS submitted (e.g. the worker died right after broadcasting).
    update public.money_movement_attempts set state = 'SUBMITTED', submitted_at = coalesce(submitted_at, now()) where id = v_attempt.id returning * into v_attempt;
    perform public.money_job_mark_business_submitted(v_job, v_attempt);
  end if;

  if p_outcome = 'PENDING' then
    update public.money_movement_jobs set status = 'CONFIRMING', lease_token = null, claim_expires_at = null, next_retry_at = now() + interval '15 seconds'
    where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'CONFIRMING');
  end if;

  if p_outcome = 'CONFIRMED' then
    update public.money_movement_attempts set state = 'CONFIRMED', signed_payload = null, resolved_at = now() where id = v_attempt.id;
    if v_job.obligation_type = 'REFUND' then
      v_res := public.record_refund_result(v_job.service_refund_id, v_attempt.provider, v_job.id::text, v_attempt.network, v_attempt.external_id, true);
    else
      update public.payout_obligations set chain_network = v_attempt.network, chain_signature = v_attempt.external_id, updated_at = now()
      where id = v_job.payout_obligation_id and status = 'SUBMITTED' and chain_signature is distinct from v_attempt.external_id;
      v_res := public.record_payout_result(v_job.payout_obligation_id, v_attempt.provider, v_job.id::text, true);
    end if;
    if not coalesce((v_res ->> 'success')::boolean, false) then
      raise exception 'money job %: business result not recorded (%)', v_job.id, v_res ->> 'code' using errcode = 'P0001';
    end if;
    update public.money_movement_jobs set status = 'CONFIRMED', confirmed_at = now(), lease_token = null, claim_expires_at = null,
      last_error_code = null, last_error_class = null where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'CONFIRMED', 'business', v_res);
  end if;

  -- FAILED_ONCHAIN / EXPIRED_NOT_LANDED: terminal attempt; the job may try again (bounded).
  update public.money_movement_attempts set state = p_outcome, failure_category = left(coalesce(p_code, p_outcome), 120), signed_payload = null, resolved_at = now()
  where id = v_attempt.id;
  if v_job.attempt_count >= v_job.max_attempts then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'MAX_ATTEMPTS', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'REVIEW_REQUIRED');
  end if;
  v_backoff := least(30 * (2 ^ v_job.attempt_count)::integer, 3600);
  update public.money_movement_jobs set status = 'RETRYABLE', last_error_code = left(coalesce(p_code, p_outcome), 120), last_error_class = 'RETRYABLE',
    lease_token = null, claim_expires_at = null, next_retry_at = now() + make_interval(secs => v_backoff)
  where id = v_job.id;
  return jsonb_build_object('success', true, 'status', 'RETRYABLE', 'next_retry_in_seconds', v_backoff);
end;
$$;

-- Release without a result.
--   RETRYABLE  transient (RPC timeout, 5xx, rate limit): bounded exponential backoff; after max_failures -> REVIEW_REQUIRED
--   PERMANENT / REVIEW  configuration / business error (wrong mint, unsupported network, policy disabled,
--              invalid destination, amount mismatch, unknown transfer found): REVIEW_REQUIRED, never retried automatically
--   WAITING    nothing is wrong, the job waits for an external precondition (e.g. the Helper has no payout
--              destination yet, no adapter configured in this environment): re-check after p_delay_seconds, no counters
create or replace function public.release_money_job(p_job_id uuid, p_lease uuid, p_class text, p_code text, p_delay_seconds integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_backoff integer;
begin
  if p_class not in ('RETRYABLE', 'PERMANENT', 'REVIEW', 'WAITING') then return jsonb_build_object('success', false, 'code', 'INVALID_CLASS'); end if;
  v_job := public.money_job_fenced(p_job_id, p_lease);
  if v_job.id is null then return jsonb_build_object('success', false, 'code', 'LEASE_LOST'); end if;
  if p_class in ('PERMANENT', 'REVIEW') or (p_class = 'RETRYABLE' and v_job.failure_count + 1 >= v_job.max_failures) then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', failure_count = failure_count + case when p_class = 'RETRYABLE' then 1 else 0 end,
      last_error_code = left(coalesce(p_code, p_class), 120), last_error_class = case when p_class = 'RETRYABLE' then 'REVIEW' else p_class end,
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'REVIEW_REQUIRED');
  end if;
  if p_class = 'WAITING' then
    update public.money_movement_jobs set status = case when status = 'CLAIMED' then 'PENDING' else status end,
      last_error_code = left(coalesce(p_code, p_class), 120), last_error_class = 'WAITING', lease_token = null, claim_expires_at = null,
      next_retry_at = now() + make_interval(secs => least(greatest(coalesce(p_delay_seconds, 3600), 15), 21600))
    where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'WAITING');
  end if;
  v_backoff := least(15 * (2 ^ v_job.failure_count)::integer, 3600);
  update public.money_movement_jobs set status = case when status in ('CLAIMED', 'PENDING') then 'RETRYABLE' else status end,
    failure_count = failure_count + 1, last_error_code = left(coalesce(p_code, p_class), 120), last_error_class = 'RETRYABLE',
    lease_token = null, claim_expires_at = null, next_retry_at = now() + make_interval(secs => v_backoff)
  where id = v_job.id;
  return jsonb_build_object('success', true, 'status', 'RETRYABLE', 'next_retry_in_seconds', v_backoff);
end;
$$;

-- A Helper just saved a payout destination: their waiting payout jobs become due now.
create or replace function public.wake_helper_money_jobs(p_helper_id uuid)
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  with woken as (
    update public.money_movement_jobs j set next_retry_at = now()
    where j.last_error_class = 'WAITING' and j.status not in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT')
      and j.payout_obligation_id in (select id from public.payout_obligations where helper_id = p_helper_id)
    returning 1
  )
  select count(*)::integer from woken;
$$;

-- =============================================================================================
-- B. Media lifecycle for checkouts that never become a request
-- =============================================================================================
alter table public.request_media drop constraint request_media_deletion_reason_check;
alter table public.request_media add constraint request_media_deletion_reason_check check (deletion_reason in (
  'SERVICE_COMPLETED', 'REQUEST_CANCELLED', 'CHECKOUT_EXPIRED', 'CHECKOUT_CANCELLED', 'CHECKOUT_ACTIVATION_FAILED'
));
alter table public.request_media
  add column deletion_attempts integer not null default 0 check (deletion_attempts >= 0),
  add column last_deletion_error text check (last_deletion_error is null or length(last_deletion_error) <= 120),
  add column next_deletion_attempt_at timestamptz;

-- The checkout's end and its media deletion schedule commit together.
create or replace function public.queue_unactivated_checkout_media()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'OPEN' and new.status in ('EXPIRED', 'CANCELLED', 'ACTIVATION_FAILED') then
    update public.request_media set status = 'DELETION_PENDING', deletion_requested_at = now(),
      deletion_reason = case new.status when 'EXPIRED' then 'CHECKOUT_EXPIRED' when 'CANCELLED' then 'CHECKOUT_CANCELLED' else 'CHECKOUT_ACTIVATION_FAILED' end
    where checkout_id = new.id and request_id is null and status = 'ACTIVE';
  end if;
  return new;
end;
$$;
create trigger service_checkouts_queue_media after update of status on public.service_checkouts
  for each row execute function public.queue_unactivated_checkout_media();

-- Backfill: media already stranded on ended, never-activated checkouts.
update public.request_media m set status = 'DELETION_PENDING', deletion_requested_at = now(),
  deletion_reason = case c.status when 'EXPIRED' then 'CHECKOUT_EXPIRED' when 'CANCELLED' then 'CHECKOUT_CANCELLED' else 'CHECKOUT_ACTIVATION_FAILED' end
from public.service_checkouts c
where c.id = m.checkout_id and c.status in ('EXPIRED', 'CANCELLED', 'ACTIVATION_FAILED') and m.request_id is null and m.status = 'ACTIVE';

-- Server-only sweep: OPEN checkouts past their expiry (plus a grace period for in-flight payments)
-- with no payment beyond "awaiting" end as EXPIRED; their unpaid intents expire first.
create or replace function public.expire_stale_checkouts(p_limit integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ids uuid[];
  v_media integer;
begin
  select coalesce(array_agg(id), '{}') into v_ids from (
    select c.id from public.service_checkouts c
    where c.status = 'OPEN' and c.expires_at <= now() - interval '15 minutes'
      and not exists (select 1 from public.payment_intents i where i.checkout_id = c.id
                      and (i.status not in ('CREATED', 'AWAITING_PAYMENT', 'EXPIRED', 'FAILED')
                           or (i.status in ('CREATED', 'AWAITING_PAYMENT') and i.expires_at > now() - interval '15 minutes')))
    order by c.expires_at
    limit least(greatest(coalesce(p_limit, 100), 1), 500)
    for update skip locked
  ) s;
  update public.payment_intents set status = 'EXPIRED' where checkout_id = any (v_ids) and status in ('CREATED', 'AWAITING_PAYMENT');
  update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where checkout_id = any (v_ids) and status = 'ACTIVE';
  update public.customer_offers o set status = 'EXPIRED' from public.service_checkouts c
  where c.id = any (v_ids) and o.id = c.customer_offer_id and o.status = 'CHECKOUT';
  update public.service_checkouts set status = 'EXPIRED', updated_at = now() where id = any (v_ids) and status = 'OPEN';
  select count(*) into v_media from public.request_media where checkout_id = any (v_ids) and status = 'DELETION_PENDING';
  return jsonb_build_object('success', true, 'expired', coalesce(array_length(v_ids, 1), 0), 'media_queued', v_media);
end;
$$;

-- The owner cancels an UNPAID checkout (never once money is on its way: then it follows the payment path).
create or replace function public.cancel_open_checkout(p_checkout_id uuid, p_customer_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout public.service_checkouts%rowtype;
begin
  select * into v_checkout from public.service_checkouts where id = p_checkout_id and customer_id = p_customer_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_FOUND'); end if;
  if v_checkout.status = 'CANCELLED' then return jsonb_build_object('success', true, 'replayed', true, 'status', 'CANCELLED'); end if;
  if v_checkout.status <> 'OPEN' then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_OPEN', 'status', v_checkout.status); end if;
  if exists (select 1 from public.payment_intents where checkout_id = v_checkout.id and status not in ('CREATED', 'AWAITING_PAYMENT', 'EXPIRED', 'FAILED')) then
    return jsonb_build_object('success', false, 'code', 'PAYMENT_IN_PROGRESS');
  end if;
  update public.payment_intents set status = 'EXPIRED' where checkout_id = v_checkout.id and status in ('CREATED', 'AWAITING_PAYMENT');
  update public.helper_checkout_reservations set status = 'RELEASED', ended_at = now() where checkout_id = v_checkout.id and status = 'ACTIVE';
  update public.customer_offers set status = 'CANCELLED' where id = v_checkout.customer_offer_id and status = 'CHECKOUT';
  update public.service_checkouts set status = 'CANCELLED', updated_at = now() where id = v_checkout.id;
  return jsonb_build_object('success', true, 'replayed', false, 'status', 'CANCELLED');
end;
$$;

-- 014 redefinition: no new media on a checkout past its expiry.
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
  if v_checkout.status <> 'OPEN' or v_checkout.expires_at <= now() then return jsonb_build_object('success', false, 'code', 'CHECKOUT_NOT_OPEN'); end if;
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

-- 014 redefinition: the one deletion queue honours per-item retry backoff.
create or replace function public.list_media_pending_deletion(p_limit integer)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('media_id', m.id, 'storage_provider', m.storage_provider, 'object_key', m.object_key) order by m.deletion_requested_at), '[]'::jsonb)
  from (select * from public.request_media
        where status = 'DELETION_PENDING' and coalesce(next_deletion_attempt_at, deletion_requested_at) <= now()
        order by deletion_requested_at limit least(greatest(coalesce(p_limit, 50), 1), 200)) m;
$$;

-- Storage deletion failed (or could not be verified): stays DELETION_PENDING, retried with backoff.
create or replace function public.record_media_deletion_failure(p_media_id uuid, p_error_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempts integer;
begin
  update public.request_media set deletion_attempts = deletion_attempts + 1, last_deletion_error = left(coalesce(p_error_code, 'DELETE_FAILED'), 120),
    next_deletion_attempt_at = now() + make_interval(secs => least(60 * (2 ^ least(deletion_attempts, 8))::integer, 21600))
  where id = p_media_id and status = 'DELETION_PENDING'
  returning deletion_attempts into v_attempts;
  if not found then return jsonb_build_object('success', false, 'code', 'MEDIA_NOT_PENDING_DELETION'); end if;
  return jsonb_build_object('success', true, 'status', 'DELETION_PENDING', 'deletion_attempts', v_attempts);
end;
$$;

-- 014 redefinition: fixture purge also removes the fixture's money jobs / attempts.
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
-- C. Function privileges
-- =============================================================================================
revoke all on function public.enqueue_payout_money_job() from public, anon, authenticated, service_role;
revoke all on function public.enqueue_refund_money_job() from public, anon, authenticated, service_role;
revoke all on function public.queue_unactivated_checkout_media() from public, anon, authenticated, service_role;
revoke all on function public.money_job_context(public.money_movement_jobs) from public, anon, authenticated, service_role;
revoke all on function public.money_attempt_json(public.money_movement_attempts, boolean) from public, anon, authenticated, service_role;
revoke all on function public.money_job_fenced(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.money_job_mark_business_submitted(public.money_movement_jobs, public.money_movement_attempts) from public, anon, authenticated, service_role;
revoke all on function public.claim_money_job(uuid, integer) from public, anon, authenticated;
revoke all on function public.prepare_money_attempt(uuid, uuid, text, text, text, bigint, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.mark_money_attempt_submitted(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_money_attempt_result(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.release_money_job(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.wake_helper_money_jobs(uuid) from public, anon, authenticated;
revoke all on function public.expire_stale_checkouts(integer) from public, anon, authenticated;
revoke all on function public.cancel_open_checkout(uuid, text) from public, anon, authenticated;
revoke all on function public.record_media_deletion_failure(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_money_job(uuid, integer) to service_role;
grant execute on function public.prepare_money_attempt(uuid, uuid, text, text, text, bigint, text, text, jsonb, text) to service_role;
grant execute on function public.mark_money_attempt_submitted(uuid, uuid, uuid) to service_role;
grant execute on function public.record_money_attempt_result(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.release_money_job(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.wake_helper_money_jobs(uuid) to service_role;
grant execute on function public.expire_stale_checkouts(integer) to service_role;
grant execute on function public.cancel_open_checkout(uuid, text) to service_role;
grant execute on function public.record_media_deletion_failure(uuid, text) to service_role;

commit;

-- Rollback (review-only):
--   * Export money_movement_jobs / money_movement_attempts first: they are financial history.
--   * Drop the triggers payout_obligations_enqueue_job, service_refunds_enqueue_job, service_checkouts_queue_media,
--     the new functions and the two tables; restore register_request_media, list_media_pending_deletion and
--     purge_payment_fixture from 014; restore request_media_deletion_reason_check and drop the three media columns.

-- 202609290023: provider-reported-paid authority (fix for a defect found in the migration 022 live gate).
--
-- Defect (022): "the provider reported this payout paid" was remembered only in the mutable operational
-- column money_movement_jobs.last_error_code (PROVIDER_PAID_AWAITING_FINALITY). Any release in between
-- (RETRYABLE PROVIDER_LOOKUP_UNKNOWN, WAITING AWAITING_NETWORK, operator actions, ...) overwrote it; a later
-- provider FAILED then became RETRYABLE and the next claim could prepare attempt #2 - a new provider transfer
-- after the provider had reported the first one paid (a blind re-send).
--
-- Fix: durable ATTEMPT-level evidence + database-enforced consequences.
--   * money_movement_attempts.provider_reported_paid_at: NULL -> database time, set once by
--     record_money_attempt_result(PROVIDER_REPORTED_PAID) only (session authority flag + live attempt),
--     never changed, never cleared (update guard). The app role has SELECT only on the table (015).
--   * any later failure of the job's attempt -> REVIEW_REQUIRED (PROVIDER_FAILED_AFTER_REPORTED_PAID),
--     decided by that evidence, never by last_error_code / status / retry counters / event ordering.
--   * no new attempt for such a job: prepare_money_attempt refuses (PROVIDER_REPORTED_PAID_REQUIRES_REVIEW,
--     job -> REVIEW_REQUIRED) and an INSERT guard refuses any other path.
--   * operator review: REQUEUE_SAFE is never offered / accepted once the evidence exists (reconciliation of
--     the EXISTING provider object, notes, escalation, hold and close remain).
--   * provider-event replay (ALREADY_REPORTED_PAID) reads the attempt evidence.
--   * money_attempt_json exposes the evidence to the outbox engine (read-only).
-- Unchanged: 022 finality semantics (no timer; a PROVIDER_FINAL_STATUS provider's CONFIRMED on the SAME attempt
-- still completes; NO_FINAL_SIGNAL stays non-terminal), Solana / mock final flows, every other rule.
-- No backfill: the migration refuses to run if any job / event already carries 022 reported-paid state.
-- Does not modify migrations 001-022.

begin;

-- ---------------------------------------------------------------------------------------------
-- 0. No-backfill precondition (fail closed instead of silently leaving un-marked evidence).
-- ---------------------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.money_movement_jobs where last_error_code in ('PROVIDER_PAID_AWAITING_FINALITY', 'PROVIDER_FAILED_AFTER_REPORTED_PAID'))
     or exists (select 1 from public.provider_events where event_type = 'PAYOUT_REPORTED_PAID') then
    raise exception '023: existing provider-reported-paid state found - a reviewed backfill is required before this migration' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 1. Durable attempt-level evidence + guards.
-- ---------------------------------------------------------------------------------------------
alter table public.money_movement_attempts add column provider_reported_paid_at timestamptz;
comment on column public.money_movement_attempts.provider_reported_paid_at is
  'Provider reported this attempt paid (NOT final). Set once by record_money_attempt_result; immutable. Blocks any further attempt of the job.';

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
  -- 023: provider-reported-paid evidence. Set once (NULL -> database time) only by the trusted result
  -- authority, only on a live attempt; never changed, never cleared.
  if old.provider_reported_paid_at is not null and new.provider_reported_paid_at is distinct from old.provider_reported_paid_at then
    raise exception 'money_movement_attempts: provider-reported-paid evidence is immutable' using errcode = 'P0001';
  end if;
  if old.provider_reported_paid_at is null and new.provider_reported_paid_at is not null then
    if coalesce(current_setting('life_help.reported_paid_authority', true), 'off') <> 'on' then
      raise exception 'money_movement_attempts: provider-reported-paid evidence is recorded only by record_money_attempt_result' using errcode = 'P0001';
    end if;
    if old.state not in ('PREPARED', 'SUBMITTED') then
      raise exception 'money_movement_attempts: provider-reported-paid evidence only on a live attempt' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.money_movement_attempts_insert_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.provider_reported_paid_at is not null then
    raise exception 'money_movement_attempts: an attempt never starts with provider-reported-paid evidence' using errcode = 'P0001';
  end if;
  -- Last line of defence behind prepare_money_attempt: whatever path inserts, a job whose attempt the
  -- provider reported paid never gets another attempt (no second outbound transfer).
  if exists (select 1 from public.money_movement_attempts where job_id = new.job_id and provider_reported_paid_at is not null) then
    raise exception 'money_movement_attempts: job % has provider-reported-paid evidence; no new attempt', new.job_id using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger money_movement_attempts_insert_guard before insert on public.money_movement_attempts for each row execute function public.money_movement_attempts_insert_guard();
revoke all on function public.money_movement_attempts_insert_guard() from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Engine view exposes the evidence (read-only).
-- ---------------------------------------------------------------------------------------------
create or replace function public.money_attempt_json(p_attempt public.money_movement_attempts, p_with_payload boolean)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object('attempt_id', p_attempt.id, 'attempt_number', p_attempt.attempt_number, 'state', p_attempt.state,
    'provider', p_attempt.provider, 'network', p_attempt.network, 'asset', p_attempt.asset, 'amount_base_units', p_attempt.amount_base_units::text,
    'destination', p_attempt.destination, 'external_id', p_attempt.external_id, 'adapter_payload', p_attempt.adapter_payload,
    'signed_payload', case when p_with_payload then p_attempt.signed_payload end, 'submitted_at', p_attempt.submitted_at,
    'provider_reported_paid_at', p_attempt.provider_reported_paid_at);
$$;

-- ---------------------------------------------------------------------------------------------
-- 3. Attempt creation authority (017 definition + 023 refusal).
-- ---------------------------------------------------------------------------------------------
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
  -- 017: an operator-requested reconciliation never creates a new external attempt.
  if v_job.automation_policy = 'RECONCILE_ONLY' then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'RECONCILE_ONLY_NO_NEW_ATTEMPT', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', false, 'code', 'RECONCILE_ONLY_NO_NEW_ATTEMPT', 'status', 'REVIEW_REQUIRED');
  end if;
  if exists (select 1 from public.money_movement_attempts where job_id = v_job.id and state = 'CONFIRMED') then
    return jsonb_build_object('success', false, 'code', 'ALREADY_CONFIRMED');
  end if;
  select * into v_live from public.money_movement_attempts where job_id = v_job.id and state in ('PREPARED', 'SUBMITTED');
  if found then
    -- Never a second live attempt: the caller must reconcile this one first.
    return jsonb_build_object('success', false, 'code', 'LIVE_ATTEMPT_EXISTS', 'attempt', public.money_attempt_json(v_live, true));
  end if;
  -- 023: once a provider reported ANY attempt of this job paid, no new attempt is ever created (the payout may
  -- have reached the payee; only an operator decides). Durable attempt evidence, not job state.
  if exists (select 1 from public.money_movement_attempts where job_id = v_job.id and provider_reported_paid_at is not null) then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'PROVIDER_REPORTED_PAID_REQUIRES_REVIEW', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', false, 'code', 'PROVIDER_REPORTED_PAID_REQUIRES_REVIEW', 'status', 'REVIEW_REQUIRED');
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

-- ---------------------------------------------------------------------------------------------
-- 4. Single result authority (022 definition + 023 durable evidence).
-- ---------------------------------------------------------------------------------------------
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
  v_outcome text := p_outcome;
begin
  if p_outcome not in ('CONFIRMED', 'PENDING', 'FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED', 'PROVIDER_REPORTED_PAID') then return jsonb_build_object('success', false, 'code', 'INVALID_OUTCOME'); end if;
  v_job := public.money_job_fenced(p_job_id, p_lease);
  if v_job.id is null then return jsonb_build_object('success', false, 'code', 'LEASE_LOST'); end if;
  select * into v_attempt from public.money_movement_attempts where id = p_attempt_id and job_id = v_job.id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_FOUND'); end if;
  if v_attempt.state not in ('PREPARED', 'SUBMITTED') then return jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_LIVE', 'state', v_attempt.state); end if;
  -- 022: a provider that documents no final payout status can never produce a terminal payout: its
  -- "confirmed / paid" is recorded as PROVIDER_REPORTED_PAID (defense in depth for any adapter / poller).
  if v_outcome = 'CONFIRMED' and v_job.obligation_type <> 'REFUND' and v_attempt.network ~ '^provider:'
     and not exists (select 1 from public.payment_providers pr where 'provider:' || pr.code || ':' || pr.environment = v_attempt.network
                     and pr.payout_finality = 'PROVIDER_FINAL_STATUS') then
    v_outcome := 'PROVIDER_REPORTED_PAID';
  end if;

  if v_outcome in ('CONFIRMED', 'PENDING', 'PROVIDER_REPORTED_PAID') and v_attempt.state = 'PREPARED' then
    -- Seen on the network: it WAS submitted (e.g. the worker died right after broadcasting).
    update public.money_movement_attempts set state = 'SUBMITTED', submitted_at = coalesce(submitted_at, now()) where id = v_attempt.id returning * into v_attempt;
    perform public.money_job_mark_business_submitted(v_job, v_attempt);
  end if;

  if v_outcome = 'PROVIDER_REPORTED_PAID' then
    -- 022: the provider says "paid" but documents that paid can still fail. Nothing terminal happens: the
    -- attempt stays SUBMITTED, the obligation stays SUBMITTED (settlement stays blocked), the job keeps
    -- reconciling (hourly) so a later failure is always observed. No timer ever turns this into PAID.
    -- 023: the evidence is recorded ON THE ATTEMPT (database time, set once, never changed or cleared);
    -- the job's last_error_code below is display / scheduling only, never financial memory.
    perform set_config('life_help.reported_paid_authority', 'on', true);
    update public.money_movement_attempts set provider_reported_paid_at = now()
    where id = v_attempt.id and provider_reported_paid_at is null;
    perform set_config('life_help.reported_paid_authority', 'off', true);
    update public.money_movement_jobs set status = 'CONFIRMING', last_error_code = 'PROVIDER_PAID_AWAITING_FINALITY', last_error_class = 'WAITING',
      lease_token = null, claim_expires_at = null, next_retry_at = now() + interval '1 hour'
    where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'PROVIDER_PAID_AWAITING_FINALITY',
      'reported_paid_at', (select provider_reported_paid_at from public.money_movement_attempts where id = v_attempt.id));
  end if;

  if v_outcome = 'PENDING' then
    update public.money_movement_jobs set status = 'CONFIRMING', lease_token = null, claim_expires_at = null, next_retry_at = now() + interval '15 seconds'
    where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'CONFIRMING');
  end if;

  if v_outcome = 'CONFIRMED' then
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
  update public.money_movement_attempts set state = v_outcome, failure_category = left(coalesce(p_code, v_outcome), 120), signed_payload = null, resolved_at = now()
  where id = v_attempt.id;
  if exists (select 1 from public.money_movement_attempts where job_id = v_job.id and provider_reported_paid_at is not null) then
    -- 023 (was 022's job-code check): failed AFTER the provider reported it paid - decided by the durable
    -- attempt evidence, whatever the job went through meanwhile (retry / wait / lease release / requeue).
    -- 022: failed AFTER the provider reported it paid (e.g. rejected by the local clearing system / the
    -- recipient bank). Never ignored, never an automatic blind re-send: an operator decides (destination,
    -- returned amount net of provider fees) through the existing review actions.
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'PROVIDER_FAILED_AFTER_REPORTED_PAID', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'REVIEW_REQUIRED', 'code', 'PROVIDER_FAILED_AFTER_REPORTED_PAID');
  end if;
  if v_job.automation_policy = 'RECONCILE_ONLY' then
    -- 017: reconciliation proved the attempt did not land; a replacement needs an explicit operator requeue.
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'RECONCILED_NOT_LANDED', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'REVIEW_REQUIRED');
  end if;
  if v_job.attempt_count >= v_job.max_attempts then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'MAX_ATTEMPTS', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'REVIEW_REQUIRED');
  end if;
  v_backoff := least(30 * (2 ^ v_job.attempt_count)::integer, 3600);
  update public.money_movement_jobs set status = 'RETRYABLE', last_error_code = left(coalesce(p_code, v_outcome), 120), last_error_class = 'RETRYABLE',
    lease_token = null, claim_expires_at = null, next_retry_at = now() + make_interval(secs => v_backoff)
  where id = v_job.id;
  return jsonb_build_object('success', true, 'status', 'RETRYABLE', 'next_retry_in_seconds', v_backoff);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. Provider evidence ingestion (022 definition; replay reads the attempt evidence).
-- ---------------------------------------------------------------------------------------------
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
  v_type text := p_event_type;
begin
  -- Fail closed before anything is recorded: unsigned, unknown / disabled provider, wrong environment.
  if p_signature_verified is distinct from true then return jsonb_build_object('success', false, 'code', 'SIGNATURE_NOT_VERIFIED'); end if;
  if p_source not in ('WEBHOOK', 'POLL') then return jsonb_build_object('success', false, 'code', 'SOURCE_INVALID'); end if;
  if not exists (select 1 from public.payment_providers where code = p_provider) then return jsonb_build_object('success', false, 'code', 'UNKNOWN_PROVIDER'); end if;
  if not exists (select 1 from public.payment_providers where code = p_provider and environment = p_environment and enabled) then
    return jsonb_build_object('success', false, 'code', 'PROVIDER_ENVIRONMENT_NOT_ENABLED');
  end if;

  -- 022: a payout "confirmed" from a provider without a documented final payout status is only "reported paid".
  if p_event_type = 'PAYOUT_CONFIRMED' and not exists (select 1 from public.payment_providers
       where code = p_provider and environment = p_environment and payout_finality = 'PROVIDER_FINAL_STATUS') then
    v_type := 'PAYOUT_REPORTED_PAID';
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
    elsif v_type in ('REFUND_SUBMITTED', 'PAYOUT_SUBMITTED') then
      v_result := 'NOTED'; v_code := 'SUBMITTED_' || v_attempt.state;
    elsif v_type in ('REFUND_CONFIRMED', 'PAYOUT_CONFIRMED') and v_attempt.state = 'CONFIRMED' then
      v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_CONFIRMED';
    elsif v_type in ('REFUND_FAILED', 'PAYOUT_FAILED') and v_attempt.state = 'CONFIRMED' then
      -- 022: a failure after a final confirmation contradicts the provider's own final status: never ignored.
      v_result := 'REVIEW'; v_code := 'PROVIDER_FAILED_AFTER_CONFIRMED';
    elsif v_type = 'PAYOUT_REPORTED_PAID' and v_attempt.state = 'CONFIRMED' then
      v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_CONFIRMED';
    elsif v_type = 'PAYOUT_REPORTED_PAID' and v_attempt.state in ('PREPARED', 'SUBMITTED') and v_attempt.provider_reported_paid_at is not null then
      -- 023: replay decided by the attempt's durable evidence (was the mutable job code).
      v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_REPORTED_PAID';
    elsif v_type in ('REFUND_FAILED', 'PAYOUT_FAILED') and v_attempt.state in ('FAILED_ONCHAIN', 'EXPIRED_NOT_LANDED') then
      v_result := 'REPLAY_NO_CHANGE'; v_code := 'ALREADY_TERMINAL';
    elsif v_attempt.state not in ('PREPARED', 'SUBMITTED') then
      -- Provider confirms an attempt this ledger already considers failed: never auto-resolve.
      v_lease := public.provider_event_job_lease(v_job.id);
      if v_lease is not null then
        perform public.release_money_job(v_job.id, v_lease, 'REVIEW', 'PROVIDER_CONFIRMED_TERMINAL_ATTEMPT', null);
      end if;
      v_result := 'REVIEW'; v_code := 'PROVIDER_CONFIRMED_TERMINAL_ATTEMPT';
    elsif (v_type in ('REFUND_CONFIRMED', 'PAYOUT_CONFIRMED', 'PAYOUT_REPORTED_PAID') or p_amount_minor is not null or p_currency is not null)
          and (p_amount_minor is distinct from v_attempt.amount_base_units or p_currency is distinct from v_attempt.asset) then
      -- 022: confirmations must carry the exact amount; a failure may omit it (a reported amount must match).
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
          case when v_type in ('REFUND_CONFIRMED', 'PAYOUT_CONFIRMED') then 'CONFIRMED' when v_type = 'PAYOUT_REPORTED_PAID' then 'PROVIDER_REPORTED_PAID' else 'FAILED_ONCHAIN' end,
          case when v_type in ('REFUND_FAILED', 'PAYOUT_FAILED') then 'PROVIDER_REPORTED_FAILED' end);
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

-- ---------------------------------------------------------------------------------------------
-- 6. Operator review rules (017 definition; no REQUEUE_SAFE after reported-paid).
-- ---------------------------------------------------------------------------------------------
create or replace function public.review_case_actions(p_case_type text, p_case_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.money_movement_jobs%rowtype;
  v_intent public.payment_intents%rowtype;
  v_closed boolean := public.review_case_closed(p_case_type, p_case_id);
  v_lease_free boolean;
  v_live boolean;
  v_confirmed boolean;
  v_reported boolean := false;
  v_open boolean;
  v_refundable jsonb;
  v_in_flight boolean;
  v_actions text[] := '{}';
begin
  if p_case_type = 'MONEY_JOB' then
    select * into v_job from public.money_movement_jobs where id = p_case_id;
    if not found then return jsonb_build_object('exists', false, 'actions', '[]'::jsonb); end if;
    v_lease_free := v_job.claim_expires_at is null or v_job.claim_expires_at <= now();
    v_live := exists (select 1 from public.money_movement_attempts where job_id = v_job.id and state in ('PREPARED', 'SUBMITTED'));
    v_confirmed := exists (select 1 from public.money_movement_attempts where job_id = v_job.id and state = 'CONFIRMED');
    -- 023: provider-reported-paid evidence: reconciliation of the EXISTING object only, never a requeue.
    v_reported := exists (select 1 from public.money_movement_attempts where job_id = v_job.id and provider_reported_paid_at is not null);
    if v_job.obligation_type = 'REFUND' then
      v_open := exists (select 1 from public.service_refunds where id = v_job.service_refund_id and status in ('PENDING', 'FAILED', 'SUBMITTED'));
    else
      v_open := exists (select 1 from public.payout_obligations o where o.id = v_job.payout_obligation_id and o.status in ('CREATED', 'FAILED', 'SUBMITTED')
        and (o.referral_reward_id is null or exists (select 1 from public.referral_rewards r where r.id = o.referral_reward_id and r.state <> 'PAID')));
    end if;
    if not v_closed and v_job.status = 'REVIEW_REQUIRED' and v_lease_free and not v_confirmed and v_open then
      v_actions := v_actions || 'RETRY_RECONCILIATION'::text;
      if not v_live and not v_reported and v_job.attempt_count < 10 then v_actions := v_actions || 'REQUEUE_SAFE'::text; end if;
    end if;
    if not v_closed and v_job.status in ('PENDING', 'CLAIMED', 'PREPARED', 'SUBMITTED', 'CONFIRMING', 'RETRYABLE') and v_lease_free then
      v_actions := v_actions || 'MARK_NO_FURTHER_AUTOMATION'::text;
    end if;
    if not v_closed and v_job.status in ('REVIEW_REQUIRED', 'FAILED_PERMANENT') then v_actions := v_actions || 'CLOSE_AS_REVIEWED'::text; end if;
    if not v_closed then v_actions := v_actions || 'ESCALATE'::text; end if;
    v_actions := v_actions || 'NOTE'::text;
    return jsonb_build_object('exists', true, 'closed', v_closed, 'status', v_job.status, 'lease_held', not v_lease_free, 'live_attempt', v_live,
      'confirmed_attempt', v_confirmed, 'provider_reported_paid', v_reported, 'business_open', v_open, 'actions', to_jsonb(v_actions));
  elsif p_case_type = 'PAYMENT' then
    select * into v_intent from public.payment_intents where id = p_case_id;
    if not found then return jsonb_build_object('exists', false, 'actions', '[]'::jsonb); end if;
    v_refundable := public.review_refundable_transfers(v_intent.id);
    v_in_flight := exists (select 1 from public.service_refunds where payment_intent_id = v_intent.id and source_signature is not null and status <> 'COMPLETED');
    if not v_closed and jsonb_array_length(v_refundable) > 0
       and (v_intent.status = 'REVIEW_REQUIRED' or exists (select 1 from public.payment_chain_transactions where payment_intent_id = v_intent.id and classification = 'EXTRA_PAYMENT')) then
      v_actions := v_actions || 'INITIATE_REFUND'::text;
    end if;
    if not v_closed and not v_in_flight then v_actions := v_actions || 'CLOSE_AS_REVIEWED'::text; end if;
    if not v_closed then v_actions := v_actions || 'ESCALATE'::text; end if;
    v_actions := v_actions || 'NOTE'::text;
    return jsonb_build_object('exists', true, 'closed', v_closed, 'status', v_intent.status, 'refundable_transfers', v_refundable,
      'refund_in_flight', v_in_flight, 'actions', to_jsonb(v_actions));
  end if;
  return jsonb_build_object('exists', false, 'actions', '[]'::jsonb);
end;
$$;

commit;

-- Rollback (review-only): restore money_movement_attempts_guard / money_attempt_json from 015, prepare_money_attempt and
-- review_case_actions from 017, record_money_attempt_result and ingest_provider_event from 022; drop the insert guard
-- trigger + function; drop money_movement_attempts.provider_reported_paid_at (only while no attempt carries evidence).

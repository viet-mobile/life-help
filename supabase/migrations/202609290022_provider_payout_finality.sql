-- 202609290022: provider payout finality (preparation for providers whose "paid" is NOT final).
--
-- Audit (2026-09-29): the 015 / 017 / 020 model has exactly one payout success signal: an attempt CONFIRMED
-- (terminal) -> obligation PAID -> payment SETTLED -> settlement. A later provider failure for a CONFIRMED
-- attempt was classified STALE_IGNORED (020). That is correct for final signals (a finalized chain transfer,
-- the mock), but wrong for a provider that documents "PAID is not always final. A transfer can still move to
-- FAILED after PAID if it is later rejected by the local clearing system or the recipient bank" - and that
-- documents no later arrival / finality status and no finality period.
--
-- Minimal provider-neutral extension:
--   * payment_providers.payout_finality: PROVIDER_FINAL_STATUS (the provider's payout success is final) |
--     NO_FINAL_SIGNAL (default: its "paid" can still fail). Owner-managed registry data, like "enabled".
--   * normalized event PAYOUT_REPORTED_PAID: "the provider reports the payout paid; finality not asserted".
--     A PAYOUT_CONFIRMED from a NO_FINAL_SIGNAL provider is treated as PAYOUT_REPORTED_PAID (ingestion AND the
--     single result authority record_money_attempt_result enforce it, whichever path - webhook or poll - reports).
--   * PROVIDER_REPORTED_PAID keeps everything non-terminal: attempt SUBMITTED, obligation SUBMITTED (settlement
--     blocked, Helper payout NOT complete), job CONFIRMING with PROVIDER_PAID_AWAITING_FINALITY, reconciled hourly.
--   * a failure after PROVIDER_REPORTED_PAID: attempt terminal, job REVIEW_REQUIRED
--     (PROVIDER_FAILED_AFTER_REPORTED_PAID) - never ignored, never an automatic blind re-send.
--   * a failure after a genuinely FINAL confirmation: REVIEW (PROVIDER_FAILED_AFTER_CONFIRMED) instead of
--     STALE_IGNORED - contradicting evidence is surfaced, never silently dropped.
--   * confirmations must carry the exact amount; a failure may omit it (a reported amount must still match).
--   * provider_object_refs: immutable binding LIFE.HELP idempotency key (attempt external id) <-> provider
--     object id, so a poll can query the provider object without trusting any caller input.
-- NO finality timer exists: nothing turns PROVIDER_REPORTED_PAID into PAID automatically. A provider without a
-- documented final signal needs an explicit, contractual finality decision before it can complete payouts.
-- Does not modify migrations 001-021; existing chain / mock behaviour is unchanged except the two REVIEW cases.

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Registry: payout finality per provider x environment (deny-by-default: not final).
-- ---------------------------------------------------------------------------------------------
alter table public.payment_providers
  add column payout_finality text not null default 'NO_FINAL_SIGNAL' check (payout_finality in ('PROVIDER_FINAL_STATUS', 'NO_FINAL_SIGNAL'));
-- Existing rails whose success signal IS final by their own definition: a finalized chain transfer; the mock.
update public.payment_providers set payout_finality = 'PROVIDER_FINAL_STATUS' where code in ('SOLANA_DIRECT_DEVNET', 'MOCK_PROVIDER');

-- ---------------------------------------------------------------------------------------------
-- 2. Normalized vocabulary: PAYOUT_REPORTED_PAID.
-- ---------------------------------------------------------------------------------------------
alter table public.provider_events drop constraint provider_events_event_type_check;
alter table public.provider_events add constraint provider_events_event_type_check check (event_type in (
  'PAYMENT_AUTHORIZED', 'PAYMENT_HELD', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED',
  'REFUND_SUBMITTED', 'REFUND_CONFIRMED', 'REFUND_FAILED',
  'PAYOUT_SUBMITTED', 'PAYOUT_REPORTED_PAID', 'PAYOUT_CONFIRMED', 'PAYOUT_FAILED'));

-- ---------------------------------------------------------------------------------------------
-- 3. Provider object binding (idempotency key <-> provider object id), immutable evidence.
-- ---------------------------------------------------------------------------------------------
create table public.provider_object_refs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  environment text not null check (environment in ('SANDBOX', 'LIVE')),
  external_id text not null check (length(external_id) between 8 and 200),
  provider_object_id text not null check (length(provider_object_id) between 4 and 200),
  object_kind text not null check (object_kind in ('REFUND', 'PAYOUT')),
  created_at timestamptz not null default now(),
  unique (provider, environment, external_id),
  unique (provider, environment, provider_object_id)
);
create trigger provider_object_refs_immutable before update on public.provider_object_refs for each row execute function public.audit_row_immutable();
create trigger provider_object_refs_no_delete before delete on public.provider_object_refs for each row execute function public.audit_row_immutable();
create trigger provider_object_refs_no_truncate before truncate on public.provider_object_refs for each statement execute function public.audit_table_no_truncate();
revoke all on public.provider_object_refs from public, anon, authenticated, service_role;
grant select on public.provider_object_refs to service_role;
comment on table public.provider_object_refs is 'RETENTION CLASS: PROVIDER_EVIDENCE - immutable idempotency-key <-> provider object binding.';

create or replace function public.bind_provider_object(p_provider text, p_environment text, p_external_id text, p_provider_object_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.money_movement_attempts%rowtype;
  v_job public.money_movement_jobs%rowtype;
  v_existing public.provider_object_refs%rowtype;
begin
  -- Only a key the outbox itself persisted for this provider + environment can be bound.
  select * into v_attempt from public.money_movement_attempts where network = 'provider:' || p_provider || ':' || p_environment and external_id = p_external_id;
  if not found then return jsonb_build_object('success', false, 'code', 'UNKNOWN_PROVIDER_TRANSFER'); end if;
  select * into v_job from public.money_movement_jobs where id = v_attempt.job_id;
  select * into v_existing from public.provider_object_refs where provider = p_provider and environment = p_environment and external_id = p_external_id;
  if found then
    if v_existing.provider_object_id = p_provider_object_id then return jsonb_build_object('success', true, 'replayed', true); end if;
    return jsonb_build_object('success', false, 'code', 'PROVIDER_OBJECT_CONFLICT');
  end if;
  begin
    insert into public.provider_object_refs (provider, environment, external_id, provider_object_id, object_kind)
    values (p_provider, p_environment, p_external_id, p_provider_object_id, case when v_job.obligation_type = 'REFUND' then 'REFUND' else 'PAYOUT' end);
  exception when unique_violation then
    return jsonb_build_object('success', false, 'code', 'PROVIDER_OBJECT_CONFLICT');
  end;
  return jsonb_build_object('success', true, 'replayed', false);
end;
$$;
revoke all on function public.bind_provider_object(text, text, text, text) from public, anon, authenticated;
grant execute on function public.bind_provider_object(text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------------------------
-- 4. The single result authority (017 definition + 022 PROVIDER_REPORTED_PAID semantics).
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
    update public.money_movement_jobs set status = 'CONFIRMING', last_error_code = 'PROVIDER_PAID_AWAITING_FINALITY', last_error_class = 'WAITING',
      lease_token = null, claim_expires_at = null, next_retry_at = now() + interval '1 hour'
    where id = v_job.id;
    return jsonb_build_object('success', true, 'status', 'PROVIDER_PAID_AWAITING_FINALITY');
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
  if v_job.last_error_code = 'PROVIDER_PAID_AWAITING_FINALITY' then
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
-- 5. Provider evidence ingestion (020 definition + 022 finality semantics).
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
    elsif v_type = 'PAYOUT_REPORTED_PAID' and v_attempt.state in ('PREPARED', 'SUBMITTED') and v_job.last_error_code = 'PROVIDER_PAID_AWAITING_FINALITY' then
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


commit;

-- Rollback (review-only): restore record_money_attempt_result from 017 and ingest_provider_event from 020;
-- restore the 020 provider_events_event_type_check (only while no PAYOUT_REPORTED_PAID rows exist); drop
-- bind_provider_object, provider_object_refs (only while empty) and payment_providers.payout_finality.

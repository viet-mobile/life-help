-- 202609280017: operator REVIEW_REQUIRED workflow - safe, audited resolution actions.
--
-- Review cases already exist in the ledger; this adds NO second ledger. Sources of truth:
--   PAYMENT case    payment_intents (REVIEW_REQUIRED) + payment_chain_transactions (what the chain showed:
--                   UNDERPAID / OVERPAID / WRONG_RECIPIENT / WRONG_MINT / WRONG_NETWORK / MISSING_REFERENCE /
--                   LATE / EXTRA_PAYMENT) + payment_events
--   MONEY_JOB case  money_movement_jobs (REVIEW_REQUIRED, or automated but stuck) + money_movement_attempts,
--                   business = the 014 payout obligation / refund / Referral reward it points to
-- Operators never edit statuses. Every action goes through operator_review_action(), which locks the
-- case, re-checks eligibility with review_case_actions() (the single rule set the console also reads),
-- acts only through existing mechanisms, and writes one immutable audit row (idempotency key unique):
--   MONEY_JOB  RETRY_RECONCILIATION   job back to the outbox with automation_policy RECONCILE_ONLY: the live
--                                     attempt is reconciled (same signature) and NO new attempt is ever
--                                     prepared; a non-landed result returns to REVIEW_REQUIRED
--              REQUEUE_SAFE           job back to normal automation (one more attempt budget) only when the
--                                     business obligation is open, no attempt is live or CONFIRMED and no
--                                     lease is held; the outbox still searches the reference before any new
--                                     attempt, so a landed transfer is never paid twice
--              MARK_NO_FURTHER_AUTOMATION  stops automation of an automated job (-> REVIEW_REQUIRED)
--   PAYMENT    INITIATE_REFUND        refund of ONE observed transfer that reached our recipient in our mint
--                                     (never WRONG_RECIPIENT / WRONG_MINT): exact observed base units, back
--                                     to the payer derived by the refund adapter from that transaction; no
--                                     destination can be typed; one refund per source signature (unique)
--   both       CLOSE_AS_REVIEWED / ESCALATE / NOTE   disposition + comment only (no financial change)
-- There is no action that sets PAID / SETTLED / REFUNDED / PAID_HELD: those still come only from the
-- verified external-confirmation paths. Wrong-payment refunds complete through the existing refund
-- outbox (record_refund_result); the payment intent itself stays REVIEW_REQUIRED (history), the case is
-- closed by the operator afterwards.
-- Redefines three 015 functions (create or replace) with the RECONCILE_ONLY / source-refund additions.

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Immutable operator action audit.
-- ---------------------------------------------------------------------------------------------
create table public.operator_review_actions (
  id uuid primary key default gen_random_uuid(),
  case_type text not null check (case_type in ('PAYMENT', 'MONEY_JOB')),
  case_id uuid not null,
  action text not null check (action in ('RETRY_RECONCILIATION', 'REQUEUE_SAFE', 'MARK_NO_FURTHER_AUTOMATION', 'INITIATE_REFUND', 'CLOSE_AS_REVIEWED', 'ESCALATE', 'NOTE')),
  operator_id text not null check (length(operator_id) between 1 and 200),
  operator_kind text not null check (operator_kind in ('SYS_SESSION', 'PLATFORM_TOKEN')),
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  previous_state jsonb not null,
  resulting_state jsonb not null,
  safe_refs jsonb not null default '{}'::jsonb,
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now()
);
create index operator_review_actions_case_idx on public.operator_review_actions (case_type, case_id, created_at);

create or replace function public.operator_review_actions_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'operator_review_actions: audit rows are immutable' using errcode = 'P0001';
end;
$$;
create trigger operator_review_actions_no_update before update on public.operator_review_actions for each row execute function public.operator_review_actions_immutable();
create trigger operator_review_actions_no_delete before delete on public.operator_review_actions for each row execute function public.money_row_no_delete();

revoke all on public.operator_review_actions from public, anon, authenticated, service_role;
grant select on public.operator_review_actions to service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Minimal ledger extensions.
-- ---------------------------------------------------------------------------------------------
alter table public.money_movement_jobs
  add column automation_policy text not null default 'AUTO' check (automation_policy in ('AUTO', 'RECONCILE_ONLY'));

alter table public.service_refunds
  add column source_signature text check (source_signature is null or length(source_signature) between 32 and 128),
  add column asset_amount_base_units bigint check (asset_amount_base_units is null or asset_amount_base_units > 0),
  add constraint service_refunds_source_refund check (
    (source_signature is null and asset_amount_base_units is null)
    or (source_signature is not null and asset_amount_base_units is not null and reason = 'OPERATOR_APPROVED')
  );
create unique index service_refunds_source_signature_uidx on public.service_refunds (source_signature) where source_signature is not null;

-- ---------------------------------------------------------------------------------------------
-- 3. 015 functions with the 017 additions.
-- ---------------------------------------------------------------------------------------------
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
      -- 017: operator-approved refund of ONE observed transfer: exact observed amount, payer derived from it.
      'source_signature', v_refund.source_signature, 'asset_amount_base_units', v_refund.asset_amount_base_units::text,
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
  update public.money_movement_jobs set status = 'RETRYABLE', last_error_code = left(coalesce(p_code, p_outcome), 120), last_error_class = 'RETRYABLE',
    lease_token = null, claim_expires_at = null, next_retry_at = now() + make_interval(secs => v_backoff)
  where id = v_job.id;
  return jsonb_build_object('success', true, 'status', 'RETRYABLE', 'next_retry_in_seconds', v_backoff);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 4. Review rules (single source for the console and the action RPC).
-- ---------------------------------------------------------------------------------------------
create or replace function public.review_case_closed(p_case_type text, p_case_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.operator_review_actions where case_type = p_case_type and case_id = p_case_id and action = 'CLOSE_AS_REVIEWED');
$$;

-- Observed transfers of a payment that may be refunded (reached our recipient, in our mint, succeeded,
-- not refunded yet). WRONG_RECIPIENT / WRONG_MINT / WRONG_NETWORK / FAILED_TX never qualify.
create or replace function public.review_refundable_transfers(p_intent_id uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('signature', t.signature, 'classification', t.classification, 'amount_base_units', t.amount_base_units::text,
    'network', t.network, 'mint', t.mint) order by t.observed_at), '[]'::jsonb)
  from public.payment_chain_transactions t join public.payment_intents i on i.id = t.payment_intent_id
  where t.payment_intent_id = p_intent_id and t.classification in ('UNDERPAID', 'OVERPAID', 'MISSING_REFERENCE', 'LATE', 'EXTRA_PAYMENT')
    and t.tx_success and t.recipient = i.recipient and t.mint = i.mint and t.network = i.network and coalesce(t.amount_base_units, 0) > 0
    and not exists (select 1 from public.service_refunds r where r.source_signature = t.signature);
$$;

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
    if v_job.obligation_type = 'REFUND' then
      v_open := exists (select 1 from public.service_refunds where id = v_job.service_refund_id and status in ('PENDING', 'FAILED', 'SUBMITTED'));
    else
      v_open := exists (select 1 from public.payout_obligations o where o.id = v_job.payout_obligation_id and o.status in ('CREATED', 'FAILED', 'SUBMITTED')
        and (o.referral_reward_id is null or exists (select 1 from public.referral_rewards r where r.id = o.referral_reward_id and r.state <> 'PAID')));
    end if;
    if not v_closed and v_job.status = 'REVIEW_REQUIRED' and v_lease_free and not v_confirmed and v_open then
      v_actions := v_actions || 'RETRY_RECONCILIATION'::text;
      if not v_live and v_job.attempt_count < 10 then v_actions := v_actions || 'REQUEUE_SAFE'::text; end if;
    end if;
    if not v_closed and v_job.status in ('PENDING', 'CLAIMED', 'PREPARED', 'SUBMITTED', 'CONFIRMING', 'RETRYABLE') and v_lease_free then
      v_actions := v_actions || 'MARK_NO_FURTHER_AUTOMATION'::text;
    end if;
    if not v_closed and v_job.status in ('REVIEW_REQUIRED', 'FAILED_PERMANENT') then v_actions := v_actions || 'CLOSE_AS_REVIEWED'::text; end if;
    if not v_closed then v_actions := v_actions || 'ESCALATE'::text; end if;
    v_actions := v_actions || 'NOTE'::text;
    return jsonb_build_object('exists', true, 'closed', v_closed, 'status', v_job.status, 'lease_held', not v_lease_free, 'live_attempt', v_live,
      'confirmed_attempt', v_confirmed, 'business_open', v_open, 'actions', to_jsonb(v_actions));
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

create or replace function public.review_case_state(p_case_type text, p_case_id uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select case when p_case_type = 'MONEY_JOB' then (
      select jsonb_build_object('status', j.status, 'automation_policy', j.automation_policy, 'attempt_count', j.attempt_count, 'max_attempts', j.max_attempts,
        'failure_count', j.failure_count, 'last_error_code', j.last_error_code, 'lease_held', j.claim_expires_at is not null and j.claim_expires_at > now(),
        'closed', public.review_case_closed(p_case_type, p_case_id))
      from public.money_movement_jobs j where j.id = p_case_id)
    else (
      select jsonb_build_object('status', i.status, 'closed', public.review_case_closed(p_case_type, p_case_id),
        'refunds', (select coalesce(jsonb_agg(jsonb_build_object('source_signature', r.source_signature, 'status', r.status) order by r.created_at), '[]'::jsonb)
                    from public.service_refunds r where r.payment_intent_id = i.id and r.source_signature is not null))
      from public.payment_intents i where i.id = p_case_id)
  end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 5. The only operator write path.
-- ---------------------------------------------------------------------------------------------
create or replace function public.operator_review_action(
  p_case_type text, p_case_id uuid, p_action text, p_operator_id text, p_operator_kind text, p_reason text,
  p_idempotency_key uuid, p_signature text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prior public.operator_review_actions%rowtype;
  v_rules jsonb;
  v_before jsonb;
  v_after jsonb;
  v_refs jsonb := '{}'::jsonb;
  v_job public.money_movement_jobs%rowtype;
  v_intent public.payment_intents%rowtype;
  v_tx public.payment_chain_transactions%rowtype;
  v_rate numeric;
  v_refund_id uuid;
begin
  if p_idempotency_key is null or p_reason is null or length(btrim(p_reason)) = 0 or p_operator_id is null or p_operator_kind not in ('SYS_SESSION', 'PLATFORM_TOKEN') then
    return jsonb_build_object('success', false, 'code', 'INVALID_REQUEST');
  end if;
  select * into v_prior from public.operator_review_actions where idempotency_key = p_idempotency_key;
  if found then
    if v_prior.case_type <> p_case_type or v_prior.case_id <> p_case_id or v_prior.action <> p_action then
      return jsonb_build_object('success', false, 'code', 'IDEMPOTENCY_KEY_REUSED');
    end if;
    return jsonb_build_object('success', true, 'replayed', true, 'action_id', v_prior.id, 'resulting_state', v_prior.resulting_state);
  end if;
  -- Serialize every action on the case.
  if p_case_type = 'MONEY_JOB' then
    select * into v_job from public.money_movement_jobs where id = p_case_id for update;
  elsif p_case_type = 'PAYMENT' then
    select * into v_intent from public.payment_intents where id = p_case_id for update;
  end if;
  if not found then return jsonb_build_object('success', false, 'code', 'CASE_NOT_FOUND'); end if;
  v_rules := public.review_case_actions(p_case_type, p_case_id);
  if not (v_rules -> 'actions') ? p_action then
    return jsonb_build_object('success', false, 'code', 'ACTION_NOT_ALLOWED', 'allowed', v_rules -> 'actions');
  end if;
  v_before := public.review_case_state(p_case_type, p_case_id);

  if p_action = 'RETRY_RECONCILIATION' then
    update public.money_movement_jobs set automation_policy = 'RECONCILE_ONLY', status = 'RETRYABLE', next_retry_at = now(), failure_count = 0,
      last_error_code = 'OPERATOR_RECONCILE', last_error_class = null where id = v_job.id;
  elsif p_action = 'REQUEUE_SAFE' then
    update public.money_movement_jobs set automation_policy = 'AUTO', status = 'RETRYABLE', next_retry_at = now(), failure_count = 0,
      max_attempts = greatest(max_attempts, attempt_count + 1), last_error_code = 'OPERATOR_REQUEUE', last_error_class = null where id = v_job.id;
  elsif p_action = 'MARK_NO_FURTHER_AUTOMATION' then
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = 'OPERATOR_HOLD', last_error_class = 'REVIEW',
      lease_token = null, claim_expires_at = null where id = v_job.id;
  elsif p_action = 'INITIATE_REFUND' then
    select t.* into v_tx from public.payment_chain_transactions t
    where t.payment_intent_id = v_intent.id and t.signature = p_signature
      and exists (select 1 from jsonb_array_elements(public.review_refundable_transfers(v_intent.id)) e where e ->> 'signature' = p_signature);
    if not found then return jsonb_build_object('success', false, 'code', 'TRANSFER_NOT_REFUNDABLE'); end if;
    select fx_rate into v_rate from public.payment_quotes where id = v_intent.quote_id;
    begin
      insert into public.service_refunds (payment_intent_id, checkout_id, request_id, currency, amount, reason, source_signature, asset_amount_base_units)
      values (v_intent.id, v_intent.checkout_id, v_intent.request_id, v_intent.fiat_currency,
              greatest(round(v_tx.amount_base_units * coalesce(v_rate, 0) / 1000000, 2), 0.01), 'OPERATOR_APPROVED', v_tx.signature, v_tx.amount_base_units)
      returning id into v_refund_id;
    exception when unique_violation then
      return jsonb_build_object('success', false, 'code', 'ALREADY_REFUNDING');
    end;
    perform public.log_payment_event(v_intent.id, 'OPERATOR_REFUND_REQUESTED', jsonb_build_object('refund_id', v_refund_id, 'source_signature', v_tx.signature,
      'asset_amount_base_units', v_tx.amount_base_units, 'classification', v_tx.classification));
    v_refs := jsonb_build_object('refund_id', v_refund_id, 'source_signature', v_tx.signature, 'asset_amount_base_units', v_tx.amount_base_units::text,
      'network', v_tx.network, 'mint', v_tx.mint, 'destination', 'PAYER_OF_SOURCE_SIGNATURE');
  end if;

  if p_case_type = 'MONEY_JOB' then
    v_refs := v_refs || jsonb_build_object('obligation_type', v_job.obligation_type, 'payout_obligation_id', v_job.payout_obligation_id, 'service_refund_id', v_job.service_refund_id);
  else
    v_refs := v_refs || jsonb_build_object('payment_intent_id', v_intent.id, 'request_id', v_intent.request_id);
  end if;
  v_after := case when p_action in ('CLOSE_AS_REVIEWED') then v_before || jsonb_build_object('closed', true) else public.review_case_state(p_case_type, p_case_id) end;
  begin
    insert into public.operator_review_actions (case_type, case_id, action, operator_id, operator_kind, reason, previous_state, resulting_state, safe_refs, idempotency_key)
    values (p_case_type, p_case_id, p_action, left(p_operator_id, 200), p_operator_kind, left(btrim(p_reason), 1000), v_before, v_after, v_refs, p_idempotency_key);
  exception when unique_violation then
    raise exception 'IDEMPOTENCY_RACE' using errcode = 'P0001';
  end;
  return jsonb_build_object('success', true, 'replayed', false, 'previous_state', v_before, 'resulting_state', v_after, 'refs', v_refs);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 6. Privileges: service_role (the operator-authenticated Worker) only.
-- ---------------------------------------------------------------------------------------------
revoke all on function public.operator_review_actions_immutable() from public, anon, authenticated, service_role;
revoke all on function public.review_case_closed(text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.review_refundable_transfers(uuid) from public, anon, authenticated, service_role;
revoke all on function public.review_case_state(text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.review_case_actions(text, uuid) from public, anon, authenticated;
revoke all on function public.operator_review_action(text, uuid, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.review_case_actions(text, uuid) to service_role;
grant execute on function public.operator_review_action(text, uuid, text, text, text, text, uuid, text) to service_role;

commit;

-- Rollback (review-only): export operator_review_actions first (audit history). Restore money_job_context,
-- prepare_money_attempt and record_money_attempt_result from 015; drop the new functions, the audit
-- table, service_refunds_source_refund / source columns / index and money_movement_jobs.automation_policy.

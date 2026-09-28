-- 202609280018: financial authority hardening found in the migration 017 privilege audit.
--
-- 1. referral_rewards: migration 005 granted the app's service_role a broad UPDATE (and INSERT) on the
--    table, so a direct write could set a reward PAYOUT_PROCESSING / PAID outside the payout path. The
--    application never updates rewards (it only inserts QUALIFIED rows at settlement); every state change
--    runs inside security-definer functions (owner privileges). Now: no UPDATE for service_role, and an
--    insert by the app role may never start a reward in PAYOUT_PROCESSING / PAID.
-- 2. operator_review_action(): the idempotency key is re-checked after the case lock, so a concurrent
--    request with the same key is answered as a replay instead of a refusal (was safe, now also exact).
-- 3. release_money_job(): a RECONCILE_ONLY job released as WAITING (nothing live to reconcile, e.g. no
--    payout destination yet) returns to REVIEW_REQUIRED instead of waiting in automation.
-- Does not modify applied migrations.

begin;

revoke update on public.referral_rewards from service_role;

create or replace function public.referral_rewards_app_insert_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Security-definer ledger functions run as the owner; only the app role is restricted here.
  if current_user = 'service_role' and new.state in ('PAYOUT_PROCESSING', 'PAID') then
    raise exception 'referral_rewards: a reward reaches PAYOUT_PROCESSING / PAID only through the payout path' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger referral_rewards_app_insert_guard before insert on public.referral_rewards
  for each row execute function public.referral_rewards_app_insert_guard();
revoke all on function public.referral_rewards_app_insert_guard() from public, anon, authenticated, service_role;

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
  -- 018: a concurrent request with the SAME key may have committed while we waited for the case lock:
  -- answer it as a replay (not as a refusal).
  select * into v_prior from public.operator_review_actions where idempotency_key = p_idempotency_key;
  if found then
    if v_prior.case_type <> p_case_type or v_prior.case_id <> p_case_id or v_prior.action <> p_action then
      return jsonb_build_object('success', false, 'code', 'IDEMPOTENCY_KEY_REUSED');
    end if;
    return jsonb_build_object('success', true, 'replayed', true, 'action_id', v_prior.id, 'resulting_state', v_prior.resulting_state);
  end if;
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
  if p_class = 'WAITING' and v_job.automation_policy = 'RECONCILE_ONLY' then
    -- 018: an operator reconciliation that finds nothing to reconcile returns to review (never waits in automation).
    update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_code = left('RECONCILE_ONLY_' || coalesce(p_code, 'WAITING'), 120),
      last_error_class = 'REVIEW', lease_token = null, claim_expires_at = null where id = v_job.id;
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

commit;

-- Rollback (review-only): grant update on public.referral_rewards to service_role; drop trigger
-- referral_rewards_app_insert_guard and its function; restore operator_review_action from 017 and release_money_job from 015.

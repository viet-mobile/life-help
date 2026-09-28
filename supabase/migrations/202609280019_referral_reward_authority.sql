-- 202609280019: referral reward authority - rewards are financial history created and advanced ONLY
-- by trusted database functions.
--
-- Closes the two gaps left after 018:
--   * the app role could DELETE reward rows (incl. PAID history): Supabase default privileges were never
--     revoked (005 only revoked anon / authenticated);
--   * the app role could INSERT a reward directly as PAYABLE (qualification bypass; create_referral_payout_
--     obligation then pays it) or in any other non-initial state.
--
-- Lifecycle (policy decision 2026-09-28):
--   QUALIFIED   created only by create_referral_reward_for_settled_request(request) at settlement: every
--               value (referred / referrer identity, attribution, tier, amount) is derived from the settled
--               request and the ACTIVE attribution - nothing is taken from a caller.
--   PAYABLE     only by promote_referral_reward_payable(reward): locks and re-checks that the reward is
--               QUALIFIED, the attribution is still ACTIVE and matches, the qualifying request is SETTLED /
--               CLOSED and belongs to the referred customer, and its payment (if prepaid) is SETTLED and was
--               never refunded / reversed. No time-based hold. Provider-neutral.
--   PAYOUT_PROCESSING -> PAID   unchanged: create_referral_payout_obligation + the confirmed payout path.
--   HOLD / REVERSED / FAILED / PENDING   reserved: no path creates or enters them (future policy).
-- One reward per qualifying request: the existing unique(qualifying_request_id) is reused.
-- Existing rows (PAID history, PAYOUT_PROCESSING fixtures) are not rewritten.
-- Replaces 018's insert guard (referral_rewards_app_insert_guard) with the complete guard below.

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Privileges: SELECT only for the app role; every write is a trusted function.
-- ---------------------------------------------------------------------------------------------
revoke all on public.referral_rewards from public, anon, authenticated, service_role;
grant select on public.referral_rewards to service_role;

drop trigger if exists referral_rewards_app_insert_guard on public.referral_rewards;
drop function if exists public.referral_rewards_app_insert_guard();

-- ---------------------------------------------------------------------------------------------
-- 2. Guards (apply to every role, including the owner): QUALIFIED-only creation through the trusted
--    function, immutable financial columns, forward-only lifecycle, no delete, no truncate.
-- ---------------------------------------------------------------------------------------------
create or replace function public.referral_rewards_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(current_setting('life_help.referral_reward_create', true), '') <> 'on' then
      raise exception 'referral_rewards: rewards are created only by create_referral_reward_for_settled_request()' using errcode = 'P0001';
    end if;
    if new.state <> 'QUALIFIED' then
      raise exception 'referral_rewards: a reward starts QUALIFIED' using errcode = 'P0001';
    end if;
    return new;
  end if;
  if (new.id, new.attribution_id, new.qualifying_request_id, new.referrer_identity_id, new.referred_identity_id, new.tier,
      new.reward_amount_krw, new.first_service_discount_krw, new.settled_at, new.created_at)
     is distinct from
     (old.id, old.attribution_id, old.qualifying_request_id, old.referrer_identity_id, old.referred_identity_id, old.tier,
      old.reward_amount_krw, old.first_service_discount_krw, old.settled_at, old.created_at) then
    raise exception 'referral_rewards: parties, qualifying request and amounts are immutable' using errcode = 'P0001';
  end if;
  if new.state is distinct from old.state and not (
       (old.state = 'QUALIFIED' and new.state = 'PAYABLE' and coalesce(current_setting('life_help.referral_reward_promote', true), '') = 'on')
    or (old.state = 'PAYABLE' and new.state = 'PAYOUT_PROCESSING')
    or (old.state = 'PAYOUT_PROCESSING' and new.state = 'PAID')
  ) then
    raise exception 'referral_rewards: state % -> % is not allowed', old.state, new.state using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger referral_rewards_guard before insert or update on public.referral_rewards
  for each row execute function public.referral_rewards_guard();
create trigger referral_rewards_no_delete before delete on public.referral_rewards
  for each row execute function public.money_row_no_delete();

create or replace function public.referral_rewards_no_truncate()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'referral_rewards: financial history is never truncated' using errcode = 'P0001';
end;
$$;
create trigger referral_rewards_no_truncate before truncate on public.referral_rewards
  for each statement execute function public.referral_rewards_no_truncate();

-- ---------------------------------------------------------------------------------------------
-- 3. Trusted creation at settlement (replaces the application-side insert).
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_referral_reward_for_settled_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.service_requests%rowtype;
  v_payment_status text;
  v_referred public.referral_identities%rowtype;
  v_referrer public.referral_identities%rowtype;
  v_attribution public.referral_attributions%rowtype;
  v_existing uuid;
  v_settled integer;
  v_tier text;
  v_amount integer;
  v_id uuid;
begin
  select * into v_req from public.service_requests where id = p_request_id for share;
  if not found then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_FOUND'); end if;
  if v_req.status not in ('SETTLED', 'CLOSED') then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_SETTLED', 'status', v_req.status); end if;
  if v_req.funding_payment_intent_id is not null then
    select status::text into v_payment_status from public.payment_intents where id = v_req.funding_payment_intent_id;
    if v_payment_status is distinct from 'SETTLED' then return jsonb_build_object('success', false, 'code', 'PAYMENT_NOT_SETTLED', 'payment_status', v_payment_status); end if;
  end if;
  select * into v_referred from public.referral_identities where subject_type = 'CUSTOMER' and subject_key = v_req.customer_id;
  if not found then return jsonb_build_object('success', true, 'code', 'NO_REFERRAL'); end if;
  select * into v_attribution from public.referral_attributions where referred_identity_id = v_referred.id and status = 'ACTIVE' for share;
  if not found then return jsonb_build_object('success', true, 'code', 'NO_REFERRAL'); end if;
  select * into v_referrer from public.referral_identities where id = v_attribution.referrer_identity_id;
  if not found then return jsonb_build_object('success', true, 'code', 'NO_REFERRAL'); end if;
  select id into v_existing from public.referral_rewards where qualifying_request_id = p_request_id;
  if v_existing is not null then return jsonb_build_object('success', true, 'code', 'ALREADY_QUALIFIED', 'reward_id', v_existing); end if;
  -- Tier from the referrer's own settled services (same rule as the settlement code it replaces).
  select count(*) into v_settled from public.service_requests where customer_id = coalesce(v_referrer.subject_key, '') and status in ('SETTLED', 'CLOSED');
  v_tier := case when v_settled >= 5 then 'GLH' when v_settled >= 1 then 'CLH' else 'WLH' end;
  v_amount := case v_tier when 'GLH' then 10000 when 'CLH' then 5000 else 1000 end;
  perform set_config('life_help.referral_reward_create', 'on', true);
  begin
    insert into public.referral_rewards (attribution_id, qualifying_request_id, referrer_identity_id, referred_identity_id, tier, reward_amount_krw, first_service_discount_krw, state, settled_at)
    values (v_attribution.id, p_request_id, v_referrer.id, v_referred.id, v_tier, v_amount, v_amount, 'QUALIFIED', now())
    returning id into v_id;
  exception when unique_violation then
    perform set_config('life_help.referral_reward_create', 'off', true);
    select id into v_existing from public.referral_rewards where qualifying_request_id = p_request_id;
    return jsonb_build_object('success', true, 'code', 'ALREADY_QUALIFIED', 'reward_id', v_existing);
  end;
  perform set_config('life_help.referral_reward_create', 'off', true);
  insert into public.app_notifications (recipient_type, recipient_id, type, title, body, payload)
  values ('CUSTOMER', coalesce(v_referrer.subject_key, ''), 'REFERRAL_REWARD_CONFIRMED', 'Referral reward qualified', v_tier || ' referral reward qualified.',
          jsonb_build_object('request_id', p_request_id, 'tier', v_tier, 'reward_amount_krw', v_amount));
  return jsonb_build_object('success', true, 'code', 'QUALIFIED', 'reward_id', v_id, 'tier', v_tier, 'reward_amount_krw', v_amount);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 4. Trusted promotion QUALIFIED -> PAYABLE (locks + re-checks the whole qualifying basis).
-- ---------------------------------------------------------------------------------------------
create or replace function public.promote_referral_reward_payable(p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reward public.referral_rewards%rowtype;
  v_attribution public.referral_attributions%rowtype;
  v_referred public.referral_identities%rowtype;
  v_req public.service_requests%rowtype;
  v_payment_status text;
begin
  select * into v_reward from public.referral_rewards where id = p_reward_id for update;
  if not found then return jsonb_build_object('success', false, 'code', 'REWARD_NOT_FOUND'); end if;
  if v_reward.state = 'PAYABLE' then return jsonb_build_object('success', true, 'replayed', true, 'state', 'PAYABLE'); end if;
  if v_reward.state <> 'QUALIFIED' then return jsonb_build_object('success', false, 'code', 'REWARD_NOT_QUALIFIED', 'state', v_reward.state); end if;
  select * into v_attribution from public.referral_attributions where id = v_reward.attribution_id for share;
  if not found or v_attribution.status <> 'ACTIVE' or v_attribution.referred_identity_id <> v_reward.referred_identity_id
     or v_attribution.referrer_identity_id <> v_reward.referrer_identity_id then
    return jsonb_build_object('success', false, 'code', 'ATTRIBUTION_NOT_VALID');
  end if;
  select * into v_referred from public.referral_identities where id = v_reward.referred_identity_id;
  select * into v_req from public.service_requests where id = v_reward.qualifying_request_id for share;
  if not found or v_req.customer_id is distinct from v_referred.subject_key then return jsonb_build_object('success', false, 'code', 'QUALIFYING_REQUEST_NOT_VALID'); end if;
  if v_req.status not in ('SETTLED', 'CLOSED') then return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_SETTLED', 'status', v_req.status); end if;
  if v_req.funding_payment_intent_id is not null then
    select status::text into v_payment_status from public.payment_intents where id = v_req.funding_payment_intent_id for share;
    if v_payment_status is distinct from 'SETTLED' then return jsonb_build_object('success', false, 'code', 'PAYMENT_NOT_SETTLED', 'payment_status', v_payment_status); end if;
    -- A refund of the service payment itself (not a price-difference adjustment, not the return of a stray
    -- extra deposit identified by its source signature) reverses the qualifying event.
    if exists (select 1 from public.service_refunds where payment_intent_id = v_req.funding_payment_intent_id
               and reason in ('CUSTOMER_CANCELLED_UNMATCHED', 'ACTIVATION_FAILED', 'OPERATOR_APPROVED')
               and source_signature is null and status <> 'FAILED') then
      return jsonb_build_object('success', false, 'code', 'PAYMENT_REFUNDED_OR_REVERSED');
    end if;
  end if;
  perform set_config('life_help.referral_reward_promote', 'on', true);
  update public.referral_rewards set state = 'PAYABLE' where id = v_reward.id;
  perform set_config('life_help.referral_reward_promote', 'off', true);
  return jsonb_build_object('success', true, 'replayed', false, 'state', 'PAYABLE');
end;
$$;

revoke all on function public.referral_rewards_guard() from public, anon, authenticated, service_role;
revoke all on function public.referral_rewards_no_truncate() from public, anon, authenticated, service_role;
revoke all on function public.create_referral_reward_for_settled_request(uuid) from public, anon, authenticated;
revoke all on function public.promote_referral_reward_payable(uuid) from public, anon, authenticated;
grant execute on function public.create_referral_reward_for_settled_request(uuid) to service_role;
grant execute on function public.promote_referral_reward_payable(uuid) to service_role;

commit;

-- Rollback (review-only): drop the triggers / functions above; grant select, insert, update on
-- public.referral_rewards to service_role and restore the 018 insert guard; restore the application-side
-- reward insert in lib/settlement/serviceSettlement.ts.

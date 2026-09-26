-- LIFE.HELP: customer re-selection after a customer-selected Helper declines (or times out)
-- Migration: 202609260013_customer_reselection.sql
-- Apply to STAGING only (wreebowcbiymodswajwe), after 202609260012. Never production (wstdbymmkrqgtsibhcjz).
--
-- Problem (migration 012, verified live): request_price_snapshots is keyed by request_id, so a request
-- can hold exactly ONE accepted Helper-price agreement. When the selected Helper declines, the request
-- falls back to SEARCHING (a status the platform acts on), and a second agreement could only be stored
-- by overwriting the first, which would destroy the commercial history.
--
-- This migration:
--   1. adds request status CUSTOMER_RESELECTION_REQUIRED (waits for CUSTOMER action; the automatic
--      matcher only ever consumes CREATED / SEARCHING, so it never touches this status);
--   2. adds request_price_selections: every accepted Helper-price agreement of a request, versioned
--      (v1 H1/P1 ... v2 H2/P2). Commercial terms are immutable; the only permitted change is ending an
--      ACCEPTED selection (DECLINED / TIMEOUT / CANCELLED). At most one ACCEPTED selection per request;
--   3. backfills every migration-012 snapshot as selection v1 (history preserved, nothing deleted), and
--      moves interim 012 requests (CUSTOMER_SELECTED + SEARCHING + no active assignment) to
--      CUSTOMER_RESELECTION_REQUIRED;
--   4. freezes request_price_snapshots as the legacy v1 record (no further inserts; rows kept);
--   5. release_assignment_for_rematch: a CUSTOMER_SELECTED request whose selected Helper DECLINES or
--      TIMES OUT goes to CUSTOMER_RESELECTION_REQUIRED (never SEARCHING), its selection is ended, and
--      the customer gets an in-app notification (no price, no Helper identity). AUTO_MATCH unchanged;
--   6. create_customer_selected_request writes selection v1 (same signature and results as 012);
--   7. reselect_customer_helper: the customer explicitly accepts a fresh offer -> new selection
--      version + new assignment + MATCHED, atomically; old versions untouched;
--   8. the selected-helper guard now checks the CURRENT accepted selection (no silent substitution).
--
-- NOT included (separate decisions): automatic timeout runner, cancellation after customer inactivity,
-- "switch to AUTO_MATCH" / price-capped automatic re-selection, Web Push (sent by the Worker).
--
-- Paste the whole file into the STAGING SQL editor and run it once. Part 1 commits the enum value on
-- its own because PostgreSQL forbids using a new enum value in the transaction that adds it.

-- ---------------------------------------------------------------------------------------------
-- Part 1: new request status (idempotent)
-- ---------------------------------------------------------------------------------------------
begin;
alter type public.service_request_status add value if not exists 'CUSTOMER_RESELECTION_REQUIRED';
commit;

-- ---------------------------------------------------------------------------------------------
-- Part 2
-- ---------------------------------------------------------------------------------------------
begin;

create type public.price_selection_status as enum ('ACCEPTED', 'ENDED');

create table public.request_price_selections (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  selection_version integer not null check (selection_version >= 1),
  -- The assignment created for this selection (informational link; assignments are never deleted
  -- by the product, and a hard FK would block fixture cleanup ordering).
  assignment_id uuid,
  helper_id uuid not null references public.helpers(id) on delete restrict,
  service_subitem_id uuid not null references public.service_subitems(id) on delete restrict,
  service_code text not null,
  subitem_code text not null,
  pricing_mode public.pricing_mode not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  base_price numeric(12, 2) not null check (base_price > 0),
  minimum_charge numeric(12, 2) check (minimum_charge >= 0),
  included_quantity numeric(10, 2),
  included_minutes integer,
  extra_unit_price numeric(12, 2),
  extra_hour_price numeric(12, 2),
  materials_policy public.materials_policy not null,
  materials_note text,
  emergency_multiplier numeric(4, 2),
  night_multiplier numeric(4, 2),
  weekend_multiplier numeric(4, 2),
  tax_included boolean not null,
  initial_payable_amount numeric(12, 2) not null check (initial_payable_amount > 0),
  quote_required boolean not null,
  source_helper_price_id uuid not null,
  source_price_revision integer not null,
  source_price_updated_at timestamptz not null,
  status public.price_selection_status not null default 'ACCEPTED',
  accepted_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text check (ended_reason in ('HELPER_DECLINED', 'HELPER_TIMEOUT', 'REQUEST_CANCELLED')),
  unique (request_id, selection_version),
  constraint request_price_selections_end_consistent check (
    (status = 'ACCEPTED' and ended_at is null and ended_reason is null)
    or (status = 'ENDED' and ended_at is not null and ended_reason is not null)
  )
);

-- At most one current accepted selection per request.
create unique index request_price_selections_one_accepted_uidx on public.request_price_selections (request_id) where status = 'ACCEPTED';
create index request_price_selections_helper_idx on public.request_price_selections (helper_id);

-- Commercial terms and history are immutable. The only permitted update is ACCEPTED -> ENDED with
-- ended_at + ended_reason; everything else raises.
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
          new.source_price_revision, new.source_price_updated_at, new.accepted_at)
         is not distinct from
         (old.id, old.request_id, old.selection_version, old.assignment_id, old.helper_id, old.service_subitem_id, old.service_code,
          old.subitem_code, old.pricing_mode, old.currency, old.base_price, old.minimum_charge, old.included_quantity, old.included_minutes,
          old.extra_unit_price, old.extra_hour_price, old.materials_policy, old.materials_note, old.emergency_multiplier, old.night_multiplier,
          old.weekend_multiplier, old.tax_included, old.initial_payable_amount, old.quote_required, old.source_helper_price_id,
          old.source_price_revision, old.source_price_updated_at, old.accepted_at) then
    return new;
  end if;
  raise exception 'request_price_selections: commercial terms are immutable; only ACCEPTED -> ENDED is allowed' using errcode = 'P0001';
end;
$$;

create trigger request_price_selections_guard
  before update on public.request_price_selections
  for each row execute function public.request_price_selections_guard();

-- Initial agreed amount of an offer (same rule as migration 012).
create or replace function public.helper_price_initial_amount(p public.helper_service_prices)
returns numeric
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p.pricing_mode
    when 'HOURLY' then greatest(coalesce(p.minimum_charge, 0), round(p.base_price * p.included_minutes / 60.0, 2))
    when 'PER_UNIT' then greatest(coalesce(p.minimum_charge, 0), round(p.base_price * coalesce(p.included_quantity, 1), 2))
    when 'PER_METER' then greatest(coalesce(p.minimum_charge, 0), round(p.base_price * coalesce(p.included_quantity, 1), 2))
    when 'PER_AREA' then greatest(coalesce(p.minimum_charge, 0), round(p.base_price * coalesce(p.included_quantity, 1), 2))
    else p.base_price -- FIXED price, or DIAGNOSTIC_PLUS_QUOTE diagnostic fee only
  end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Backfill: every 012 snapshot becomes selection v1 (the snapshot rows themselves stay untouched).
-- ---------------------------------------------------------------------------------------------
insert into public.request_price_selections (
  request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency,
  base_price, minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
  emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
  source_helper_price_id, source_price_revision, source_price_updated_at, status, accepted_at, ended_at, ended_reason
)
select s.request_id, 1, a.id, s.helper_id, s.service_subitem_id, s.service_code, s.subitem_code, s.pricing_mode, s.currency,
       s.base_price, s.minimum_charge, s.included_quantity, s.included_minutes, s.extra_unit_price, s.extra_hour_price, s.materials_policy,
       s.materials_note, s.emergency_multiplier, s.night_multiplier, s.weekend_multiplier, s.tax_included, s.initial_payable_amount,
       s.quote_required, s.source_helper_price_id, s.source_price_revision, s.source_price_updated_at,
       case when a.status in ('DECLINED', 'TIMEOUT', 'CANCELLED') then 'ENDED' else 'ACCEPTED' end::public.price_selection_status,
       s.agreed_at,
       case when a.status in ('DECLINED', 'TIMEOUT', 'CANCELLED') then coalesce(a.responded_at, now()) end,
       case a.status when 'DECLINED' then 'HELPER_DECLINED' when 'TIMEOUT' then 'HELPER_TIMEOUT' when 'CANCELLED' then 'REQUEST_CANCELLED' end
from public.request_price_snapshots s
left join lateral (
  select ra.id, ra.status::text as status, ra.responded_at
  from public.request_assignments ra
  where ra.request_id = s.request_id and ra.helper_id = s.helper_id
  order by ra.assigned_at desc
  limit 1
) a on true;

-- Interim 012 state: selected Helper declined, request fell back to SEARCHING. It must wait for the customer.
update public.service_requests r
set status = 'CUSTOMER_RESELECTION_REQUIRED', updated_at = now()
where r.selection_mode = 'CUSTOMER_SELECTED'
  and r.status = 'SEARCHING'
  and not exists (select 1 from public.request_assignments ra where ra.request_id = r.id and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED'));

-- ---------------------------------------------------------------------------------------------
-- Access: default deny; service_role may read, insert and end selections (never delete / rewrite).
-- The legacy snapshot table is frozen (kept for audit; no new rows).
-- ---------------------------------------------------------------------------------------------
alter table public.request_price_selections enable row level security;
revoke all on public.request_price_selections from public, anon, authenticated, service_role;
grant select, insert on public.request_price_selections to service_role;
grant update (status, ended_at, ended_reason) on public.request_price_selections to service_role;
revoke insert on public.request_price_snapshots from service_role;

-- ---------------------------------------------------------------------------------------------
-- No silent substitution: a CUSTOMER_SELECTED request can only be assigned to the Helper of its
-- CURRENT accepted selection.
-- ---------------------------------------------------------------------------------------------
create or replace function public.request_assignments_selected_helper_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.service_requests r where r.id = new.request_id and r.selection_mode = 'CUSTOMER_SELECTED')
     and not exists (select 1 from public.request_price_selections s
                     where s.request_id = new.request_id and s.status = 'ACCEPTED' and s.helper_id = new.helper_id) then
    raise exception 'CUSTOMER_SELECTED_HELPER_LOCKED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Release (DECLINED / TIMEOUT). Identical to 202609250002 for AUTO_MATCH requests. For a
-- CUSTOMER_SELECTED request whose last active assignment is released: end the accepted selection,
-- move the request to CUSTOMER_RESELECTION_REQUIRED, notify the customer in-app.
-- 'request_reopened' keeps its meaning (no active assignment left) for existing callers; the matcher
-- refuses CUSTOMER_RESELECTION_REQUIRED, so no caller can auto-rematch it.
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

  update public.request_assignments
  set status = v_status_enum, responded_at = coalesce(responded_at, now())
  where id = v_assignment.id;

  select count(*) into v_other_active_count
  from public.request_assignments
  where request_id = v_request.id and id <> v_assignment.id and status in ('PENDING', 'NOTIFIED', 'ACCEPTED');

  v_new_status := v_request.status::text;
  if v_other_active_count = 0 then
    v_reselect := v_request.selection_mode = 'CUSTOMER_SELECTED';
    if v_reselect then
      update public.request_price_selections
      set status = 'ENDED', ended_at = now(),
          ended_reason = case p_release_status when 'DECLINED' then 'HELPER_DECLINED' else 'HELPER_TIMEOUT' end
      where request_id = v_request.id and status = 'ACCEPTED' and helper_id = v_assignment.helper_id;

      update public.service_requests set status = 'CUSTOMER_RESELECTION_REQUIRED', updated_at = now() where id = v_request.id;
      v_new_status := 'CUSTOMER_RESELECTION_REQUIRED';

      -- In-app notice for the customer. No price, no Helper identity: fresh offers are shown in the app.
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
    'request_status', v_new_status
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Customer-selected request: same signature and results as 012; the agreement is stored as
-- selection v1 (the frozen snapshot table is no longer written).
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

  -- Lock order: price row, then helper row (see 012).
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
  if not found or not v_helper.is_active or not v_helper.on_duty
     or not exists (select 1 from public.helper_services where helper_id = v_helper.id and service_slug = v_subitem.service_code)
     or not exists (select 1 from public.helper_regions hr where hr.helper_id = v_helper.id and hr.country = p_country and hr.sido = p_sido
                    and (hr.gungu = p_gungu or hr.gungu = '전체' or hr.gungu = ''))
     or exists (select 1 from public.request_assignments ra where ra.helper_id = v_helper.id and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED')) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
  end if;

  v_initial := public.helper_price_initial_amount(v_price);
  -- The assignment id is fixed up front so the selection row is written complete (it is immutable).
  v_assignment_id := gen_random_uuid();

  begin
    insert into public.service_requests (
      id, customer_id, customer_display_name, customer_locale, service_slug, country, sido, gungu, dong,
      address, description, selected_options, status, selection_mode
    ) values (
      p_request_id, p_customer_id, p_customer_display_name, p_customer_locale, v_subitem.service_code, p_country, p_sido, p_gungu,
      coalesce(p_dong, ''), coalesce(p_address, ''), coalesce(p_description, ''), coalesce(p_selected_options, '{}'), 'MATCHED', 'CUSTOMER_SELECTED'
    );

    insert into public.request_price_selections (
      request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price,
      minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
      source_helper_price_id, source_price_revision, source_price_updated_at
    ) values (
      p_request_id, 1, v_assignment_id, v_helper.id, v_subitem.id, v_subitem.service_code, v_subitem.subitem_code, v_price.pricing_mode, v_price.currency,
      v_price.base_price, v_price.minimum_charge, v_price.included_quantity, v_price.included_minutes, v_price.extra_unit_price,
      v_price.extra_hour_price, v_price.materials_policy, v_price.materials_note, v_price.emergency_multiplier, v_price.night_multiplier,
      v_price.weekend_multiplier, v_price.tax_included, v_initial,
      v_price.pricing_mode = 'DIAGNOSTIC_PLUS_QUOTE' or v_price.materials_policy = 'QUOTE_REQUIRED',
      v_price.id, v_price.revision, v_price.updated_at
    );

    insert into public.request_assignments (id, request_id, helper_id, status)
    values (v_assignment_id, p_request_id, v_helper.id, 'PENDING');

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
-- Customer re-selection: the owner of a CUSTOMER_RESELECTION_REQUIRED request explicitly accepts one
-- fresh offer (price id + revision from the Worker's opaque offer token; customer id from the device
-- owner cookie). Atomically: new selection version (ACCEPTED) + PENDING assignment + conversation +
-- Helper notification + request MATCHED. Earlier versions are never modified. Replaying the same
-- accepted offer returns the current result; nothing is ever substituted.
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
  v_version integer;
  v_initial numeric(12, 2);
  v_assignment_id uuid;
  v_conv_id uuid;
  v_constraint text;
begin
  -- Lock order: request, then price, then helper. Concurrent re-selections of one request serialize here.
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
  -- A Helper who already declined / timed out on this request is never selected for it again (as 011).
  if exists (select 1 from public.request_assignments ra where ra.request_id = p_request_id and ra.helper_id = v_price.helper_id and ra.status in ('DECLINED', 'TIMEOUT')) then
    return jsonb_build_object('success', false, 'code', 'HELPER_PREVIOUSLY_DECLINED');
  end if;

  select * into v_helper from public.helpers where id = v_price.helper_id for update;
  if not found or not v_helper.is_active or not v_helper.on_duty
     or not exists (select 1 from public.helper_services where helper_id = v_helper.id and service_slug = v_subitem.service_code)
     or not exists (select 1 from public.helper_regions hr where hr.helper_id = v_helper.id and hr.country = v_req.country and hr.sido = v_req.sido
                    and (hr.gungu = v_req.gungu or hr.gungu = '전체' or hr.gungu = ''))
     or exists (select 1 from public.request_assignments ra where ra.helper_id = v_helper.id and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED')) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NO_LONGER_AVAILABLE');
  end if;

  v_initial := public.helper_price_initial_amount(v_price);
  select coalesce(max(selection_version), 0) + 1 into v_version from public.request_price_selections where request_id = p_request_id;
  v_assignment_id := gen_random_uuid();

  begin
    insert into public.request_price_selections (
      request_id, selection_version, assignment_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price,
      minimum_charge, included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
      source_helper_price_id, source_price_revision, source_price_updated_at
    ) values (
      p_request_id, v_version, v_assignment_id, v_helper.id, v_subitem.id, v_subitem.service_code, v_subitem.subitem_code, v_price.pricing_mode, v_price.currency,
      v_price.base_price, v_price.minimum_charge, v_price.included_quantity, v_price.included_minutes, v_price.extra_unit_price,
      v_price.extra_hour_price, v_price.materials_policy, v_price.materials_note, v_price.emergency_multiplier, v_price.night_multiplier,
      v_price.weekend_multiplier, v_price.tax_included, v_initial,
      v_price.pricing_mode = 'DIAGNOSTIC_PLUS_QUOTE' or v_price.materials_policy = 'QUOTE_REQUIRED',
      v_price.id, v_price.revision, v_price.updated_at
    );

    insert into public.request_assignments (id, request_id, helper_id, status)
    values (v_assignment_id, p_request_id, v_helper.id, 'PENDING');

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

revoke all on function public.release_assignment_for_rematch(uuid, text) from public, anon, authenticated;
revoke all on function public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer) from public, anon, authenticated;
revoke all on function public.reselect_customer_helper(uuid, text, uuid, integer) from public, anon, authenticated;
revoke all on function public.helper_price_initial_amount(public.helper_service_prices) from public, anon, authenticated;
grant execute on function public.release_assignment_for_rematch(uuid, text) to service_role;
grant execute on function public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer) to service_role;
grant execute on function public.reselect_customer_helper(uuid, text, uuid, integer) to service_role;
grant execute on function public.helper_price_initial_amount(public.helper_service_prices) to service_role;

commit;

-- Rollback (review-only; PostgreSQL cannot drop an enum value):
--   1. move CUSTOMER_RESELECTION_REQUIRED requests back to SEARCHING only after deciding each case;
--   2. restore release_assignment_for_rematch (202609250002), create_customer_selected_request and
--      request_assignments_selected_helper_guard (202609260012); grant insert on request_price_snapshots to service_role;
--   3. drop function public.reselect_customer_helper(uuid, text, uuid, integer);
--      drop function public.helper_price_initial_amount(public.helper_service_prices);
--   4. request_price_selections holds commercial history: export it before any drop.

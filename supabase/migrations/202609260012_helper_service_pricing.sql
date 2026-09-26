-- LIFE.HELP: helper-defined service pricing, customer price preview and customer-selected helper
-- Migration: 202609260012_helper_service_pricing.sql
-- Apply to STAGING only (wreebowcbiymodswajwe). Never production (wstdbymmkrqgtsibhcjz).
--
-- Adds (nothing existing is altered except one new service_requests column with a safe default):
--   service_subitems          catalog of detailed services under the 10 existing service codes
--                             (display names live in the i18n files: serviceSubitems.<service>.<code>)
--   helper_service_prices     each helper's own offer per detailed service (DRAFT / ACTIVE / PAUSED)
--   request_price_snapshots   immutable copy of the agreed terms, one per customer-selected request
--   service_requests.selection_mode   AUTO_MATCH (existing flows) | CUSTOMER_SELECTED
--   RPCs (service_role only): upsert_helper_service_price, set_helper_service_price_status,
--     list_customer_offers, create_customer_selected_request
--   Trigger: a CUSTOMER_SELECTED request can only ever be assigned to the helper in its snapshot
--     (no silent substitution by any path, including the automatic matcher).
--
-- Helper prices are the helper's own selling terms. Market research data is NOT imported here.
-- No payment provider exists; initial_payable_amount is the agreed initial amount only.
-- Paste the whole file into the STAGING SQL editor and run it once.

begin;

create type public.pricing_mode as enum ('FIXED', 'HOURLY', 'PER_UNIT', 'PER_METER', 'PER_AREA', 'DIAGNOSTIC_PLUS_QUOTE');
create type public.materials_policy as enum ('INCLUDED', 'EXCLUDED', 'PARTIALLY_INCLUDED', 'QUOTE_REQUIRED');
create type public.helper_price_status as enum ('DRAFT', 'ACTIVE', 'PAUSED');

-- ---------------------------------------------------------------------------------------------
-- Detailed service catalog
-- ---------------------------------------------------------------------------------------------
create table public.service_subitems (
  id uuid primary key default gen_random_uuid(),
  service_code text not null check (service_code in (
    'clog-clearing', 'leak-plumbing', 'boiler', 'cleaning', 'housing',
    'bank-help', 'insurance-help', 'job-help', 'hospital-help', 'mobile-help'
  )),
  subitem_code text not null check (subitem_code ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(subitem_code) <= 60),
  active boolean not null default true,
  sort_order integer not null default 0,
  allowed_pricing_modes public.pricing_mode[] not null check (cardinality(allowed_pricing_modes) > 0),
  default_pricing_mode public.pricing_mode not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_code, subitem_code),
  check (default_pricing_mode = any (allowed_pricing_modes))
);

insert into public.service_subitems (service_code, subitem_code, sort_order, allowed_pricing_modes, default_pricing_mode) values
  ('clog-clearing',  'toilet-simple',            10, '{FIXED}', 'FIXED'),
  ('clog-clearing',  'sink',                     20, '{FIXED}', 'FIXED'),
  ('clog-clearing',  'floor-drain',              30, '{FIXED}', 'FIXED'),
  ('clog-clearing',  'high-pressure',            40, '{FIXED,PER_METER,DIAGNOSTIC_PLUS_QUOTE}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('leak-plumbing',  'leak-detection',           10, '{DIAGNOSTIC_PLUS_QUOTE}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('leak-plumbing',  'faucet-repair',            20, '{FIXED,DIAGNOSTIC_PLUS_QUOTE}', 'FIXED'),
  ('leak-plumbing',  'pipe-repair',              30, '{PER_METER,DIAGNOSTIC_PLUS_QUOTE}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('boiler',         'boiler-diagnostic',        10, '{DIAGNOSTIC_PLUS_QUOTE}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('boiler',         'boiler-install',           20, '{FIXED,DIAGNOSTIC_PLUS_QUOTE}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('cleaning',       'move-in-cleaning',         10, '{PER_AREA,FIXED}', 'PER_AREA'),
  ('cleaning',       'regular-cleaning',         20, '{HOURLY,FIXED}', 'HOURLY'),
  ('cleaning',       'appliance-cleaning',       30, '{PER_UNIT,FIXED}', 'PER_UNIT'),
  ('housing',        'room-search-accompaniment',10, '{HOURLY,FIXED}', 'HOURLY'),
  ('bank-help',      'account-opening',          10, '{FIXED,HOURLY}', 'FIXED'),
  ('insurance-help', 'insurance-enrollment',     10, '{FIXED,HOURLY}', 'FIXED'),
  ('job-help',       'job-application-support',  10, '{FIXED,HOURLY}', 'FIXED'),
  ('hospital-help',  'general-outpatient',       10, '{HOURLY,FIXED}', 'HOURLY'),
  ('hospital-help',  'remote-interpretation',    20, '{HOURLY,PER_UNIT}', 'HOURLY'),
  ('mobile-help',    'phone-plan-setup',         10, '{FIXED,HOURLY}', 'FIXED');

-- ---------------------------------------------------------------------------------------------
-- Helper offers
--   base_price meaning by mode: FIXED = fixed price; HOURLY = price per hour; PER_UNIT / PER_METER /
--   PER_AREA = price per unit / metre / m2; DIAGNOSTIC_PLUS_QUOTE = diagnostic / call-out fee.
-- ---------------------------------------------------------------------------------------------
create table public.helper_service_prices (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.helpers(id) on delete cascade,
  service_subitem_id uuid not null references public.service_subitems(id) on delete restrict,
  pricing_mode public.pricing_mode not null,
  currency text check (currency ~ '^[A-Z]{3}$'),
  base_price numeric(12, 2),
  minimum_charge numeric(12, 2),
  included_quantity numeric(10, 2),
  included_minutes integer,
  extra_unit_price numeric(12, 2),
  extra_hour_price numeric(12, 2),
  materials_policy public.materials_policy,
  materials_note text check (materials_note is null or length(materials_note) <= 300),
  emergency_multiplier numeric(4, 2),
  night_multiplier numeric(4, 2),
  weekend_multiplier numeric(4, 2),
  tax_included boolean not null default true,
  status public.helper_price_status not null default 'DRAFT',
  revision integer not null default 1 check (revision >= 1),
  valid_from timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (helper_id, service_subitem_id),
  constraint helper_price_amounts_nonnegative check (
    coalesce(base_price, 0) >= 0 and coalesce(minimum_charge, 0) >= 0
    and coalesce(extra_unit_price, 0) >= 0 and coalesce(extra_hour_price, 0) >= 0
  ),
  constraint helper_price_included_positive check (
    (included_quantity is null or included_quantity > 0) and (included_minutes is null or included_minutes between 1 and 1440)
  ),
  constraint helper_price_multipliers_range check (
    (emergency_multiplier is null or emergency_multiplier between 1 and 3)
    and (night_multiplier is null or night_multiplier between 1 and 3)
    and (weekend_multiplier is null or weekend_multiplier between 1 and 3)
  ),
  -- Publication rule: an ACTIVE offer must be complete and coherent for its pricing mode.
  -- Every nullable operand is coalesced: a CHECK that evaluates to NULL would otherwise PASS.
  constraint helper_price_active_complete check (
    status <> 'ACTIVE' or (
      currency is not null and materials_policy is not null and coalesce(base_price, 0) > 0
      and (pricing_mode <> 'HOURLY' or coalesce(included_minutes, 0) between 15 and 1440)
      and (pricing_mode <> 'DIAGNOSTIC_PLUS_QUOTE' or coalesce(materials_policy::text, 'INCLUDED') <> 'INCLUDED')
      and (minimum_charge is null or pricing_mode <> 'DIAGNOSTIC_PLUS_QUOTE')
    )
  )
);

create index helper_service_prices_offer_idx on public.helper_service_prices (service_subitem_id, status);

-- Any change to the customer-facing terms bumps the revision (stale-offer detection).
create or replace function public.helper_service_prices_revision()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.pricing_mode, new.currency, new.base_price, new.minimum_charge, new.included_quantity, new.included_minutes,
      new.extra_unit_price, new.extra_hour_price, new.materials_policy, new.materials_note, new.emergency_multiplier,
      new.night_multiplier, new.weekend_multiplier, new.tax_included)
     is distinct from
     (old.pricing_mode, old.currency, old.base_price, old.minimum_charge, old.included_quantity, old.included_minutes,
      old.extra_unit_price, old.extra_hour_price, old.materials_policy, old.materials_note, old.emergency_multiplier,
      old.night_multiplier, old.weekend_multiplier, old.tax_included) then
    new.revision := old.revision + 1;
  else
    new.revision := old.revision;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger helper_service_prices_revision
  before update on public.helper_service_prices
  for each row execute function public.helper_service_prices_revision();

-- ---------------------------------------------------------------------------------------------
-- Request-level selection + immutable price snapshot
-- ---------------------------------------------------------------------------------------------
alter table public.service_requests
  add column selection_mode text not null default 'AUTO_MATCH'
  check (selection_mode in ('AUTO_MATCH', 'CUSTOMER_SELECTED'));

create table public.request_price_snapshots (
  request_id uuid primary key references public.service_requests(id) on delete cascade,
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
  -- Initial amount the customer agreed to (FIXED price, minimum hourly/unit amount, or the
  -- diagnostic fee only). Surcharges and later quotes are NOT included and need approval.
  initial_payable_amount numeric(12, 2) not null check (initial_payable_amount > 0),
  quote_required boolean not null,
  source_helper_price_id uuid not null,
  source_price_revision integer not null,
  source_price_updated_at timestamptz not null,
  agreed_at timestamptz not null default now()
);

create or replace function public.request_price_snapshots_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'request_price_snapshots rows are immutable' using errcode = 'P0001';
end;
$$;

create trigger request_price_snapshots_no_update
  before update on public.request_price_snapshots
  for each row execute function public.request_price_snapshots_immutable();

-- A customer-selected request can only ever be assigned to the helper the customer agreed to.
create or replace function public.request_assignments_selected_helper_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.service_requests r where r.id = new.request_id and r.selection_mode = 'CUSTOMER_SELECTED')
     and not exists (select 1 from public.request_price_snapshots s where s.request_id = new.request_id and s.helper_id = new.helper_id) then
    raise exception 'CUSTOMER_SELECTED_HELPER_LOCKED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger request_assignments_selected_helper_guard
  before insert on public.request_assignments
  for each row execute function public.request_assignments_selected_helper_guard();

-- ---------------------------------------------------------------------------------------------
-- Access: default deny; the Worker uses service_role and these RPCs.
-- ---------------------------------------------------------------------------------------------
alter table public.service_subitems enable row level security;
alter table public.helper_service_prices enable row level security;
alter table public.request_price_snapshots enable row level security;
revoke all on public.service_subitems, public.helper_service_prices, public.request_price_snapshots from public, anon, authenticated;
grant select on public.service_subitems to service_role;
grant select, insert, update on public.helper_service_prices to service_role;
grant select, insert on public.request_price_snapshots to service_role;
revoke update, delete, truncate on public.request_price_snapshots from service_role;

-- ---------------------------------------------------------------------------------------------
-- Helper: save terms (DRAFT) or save + publish (ACTIVE). The server passes the authenticated
-- helper's id; a helper can only price services they are qualified for (helper_services).
-- ---------------------------------------------------------------------------------------------
create or replace function public.upsert_helper_service_price(
  p_helper_id uuid,
  p_service_code text,
  p_subitem_code text,
  p_terms jsonb,
  p_publish boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subitem public.service_subitems%rowtype;
  v_mode public.pricing_mode;
  v_row public.helper_service_prices%rowtype;
  v_constraint text;
begin
  select * into v_subitem from public.service_subitems where service_code = p_service_code and subitem_code = p_subitem_code and active;
  if not found then return jsonb_build_object('success', false, 'code', 'SUBITEM_NOT_FOUND'); end if;
  if not exists (select 1 from public.helpers where id = p_helper_id) then
    return jsonb_build_object('success', false, 'code', 'HELPER_NOT_FOUND');
  end if;
  if not exists (select 1 from public.helper_services where helper_id = p_helper_id and service_slug = p_service_code) then
    return jsonb_build_object('success', false, 'code', 'NOT_QUALIFIED_FOR_SERVICE');
  end if;
  begin
    v_mode := (p_terms->>'pricing_mode')::public.pricing_mode;
  exception when others then
    return jsonb_build_object('success', false, 'code', 'INVALID_PRICING_MODE');
  end;
  if v_mode is null or not (v_mode = any (v_subitem.allowed_pricing_modes)) then
    return jsonb_build_object('success', false, 'code', 'PRICING_MODE_NOT_ALLOWED');
  end if;

  begin
    insert into public.helper_service_prices as p (
      helper_id, service_subitem_id, pricing_mode, currency, base_price, minimum_charge, included_quantity,
      included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, status, published_at
    ) values (
      p_helper_id, v_subitem.id, v_mode,
      nullif(p_terms->>'currency', ''),
      (p_terms->>'base_price')::numeric, (p_terms->>'minimum_charge')::numeric, (p_terms->>'included_quantity')::numeric,
      (p_terms->>'included_minutes')::integer, (p_terms->>'extra_unit_price')::numeric, (p_terms->>'extra_hour_price')::numeric,
      (p_terms->>'materials_policy')::public.materials_policy, nullif(p_terms->>'materials_note', ''),
      (p_terms->>'emergency_multiplier')::numeric, (p_terms->>'night_multiplier')::numeric, (p_terms->>'weekend_multiplier')::numeric,
      coalesce((p_terms->>'tax_included')::boolean, true),
      case when p_publish then 'ACTIVE'::public.helper_price_status else 'DRAFT'::public.helper_price_status end,
      case when p_publish then now() end
    )
    on conflict (helper_id, service_subitem_id) do update set
      pricing_mode = excluded.pricing_mode, currency = excluded.currency, base_price = excluded.base_price,
      minimum_charge = excluded.minimum_charge, included_quantity = excluded.included_quantity,
      included_minutes = excluded.included_minutes, extra_unit_price = excluded.extra_unit_price,
      extra_hour_price = excluded.extra_hour_price, materials_policy = excluded.materials_policy,
      materials_note = excluded.materials_note, emergency_multiplier = excluded.emergency_multiplier,
      night_multiplier = excluded.night_multiplier, weekend_multiplier = excluded.weekend_multiplier,
      tax_included = excluded.tax_included, status = excluded.status,
      published_at = case when excluded.status = 'ACTIVE' then now() else p.published_at end
    returning * into v_row;
  exception
    when check_violation then
      get stacked diagnostics v_constraint = constraint_name;
      return jsonb_build_object('success', false, 'code', 'INVALID_TERMS', 'reason', v_constraint);
    when invalid_text_representation or numeric_value_out_of_range or invalid_parameter_value then
      return jsonb_build_object('success', false, 'code', 'INVALID_TERMS', 'reason', 'format');
  end;

  return jsonb_build_object('success', true, 'price_id', v_row.id, 'status', v_row.status, 'revision', v_row.revision);
end;
$$;

-- Publish / pause / unpublish one of the helper's own offers.
create or replace function public.set_helper_service_price_status(p_helper_id uuid, p_price_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.helper_service_prices%rowtype;
  v_constraint text;
begin
  if p_status not in ('DRAFT', 'ACTIVE', 'PAUSED') then return jsonb_build_object('success', false, 'code', 'INVALID_STATUS'); end if;
  begin
    update public.helper_service_prices
    set status = p_status::public.helper_price_status,
        published_at = case when p_status = 'ACTIVE' then now() else published_at end
    where id = p_price_id and helper_id = p_helper_id
    returning * into v_row;
  exception when check_violation then
    get stacked diagnostics v_constraint = constraint_name;
    return jsonb_build_object('success', false, 'code', 'INVALID_TERMS', 'reason', v_constraint);
  end;
  if not found then return jsonb_build_object('success', false, 'code', 'PRICE_NOT_FOUND'); end if;
  return jsonb_build_object('success', true, 'price_id', v_row.id, 'status', v_row.status, 'revision', v_row.revision);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Customer offer discovery: ACTIVE offer + helper active + on duty + region + qualified + not busy.
-- Ranking matches the automatic matcher (rating, completed jobs), then price.
-- Returns internal ids for the server only; the API replaces them with an opaque offer token.
-- ---------------------------------------------------------------------------------------------
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
    order by p.id
    limit 50
  ) ranked;
$$;

-- ---------------------------------------------------------------------------------------------
-- Customer-selected request: revalidate the offer server-side and atomically create the request,
-- the immutable price snapshot, the assignment to THAT helper, the conversation and the helper
-- notification, or fail with nothing written.
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
  -- Idempotent replay of the same submission (request id is derived from the idempotency key).
  select id, customer_id, status, selection_mode into v_existing from public.service_requests where id = p_request_id;
  if found then
    if v_existing.customer_id <> p_customer_id or v_existing.selection_mode <> 'CUSTOMER_SELECTED' then
      return jsonb_build_object('success', false, 'code', 'IDEMPOTENCY_KEY_CONFLICT');
    end if;
    return jsonb_build_object('success', true, 'replayed', true, 'request_id', v_existing.id, 'status', v_existing.status);
  end if;

  -- Lock order: price row, then helper row. The automatic matcher never waits on helper rows
  -- (FOR UPDATE SKIP LOCKED) and never locks price rows, so no lock cycle is possible.
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

  v_initial := case v_price.pricing_mode
    when 'HOURLY' then greatest(coalesce(v_price.minimum_charge, 0), round(v_price.base_price * v_price.included_minutes / 60.0, 2))
    when 'PER_UNIT' then greatest(coalesce(v_price.minimum_charge, 0), round(v_price.base_price * coalesce(v_price.included_quantity, 1), 2))
    when 'PER_METER' then greatest(coalesce(v_price.minimum_charge, 0), round(v_price.base_price * coalesce(v_price.included_quantity, 1), 2))
    when 'PER_AREA' then greatest(coalesce(v_price.minimum_charge, 0), round(v_price.base_price * coalesce(v_price.included_quantity, 1), 2))
    else v_price.base_price -- FIXED price, or DIAGNOSTIC_PLUS_QUOTE diagnostic fee only
  end;

  begin
    insert into public.service_requests (
      id, customer_id, customer_display_name, customer_locale, service_slug, country, sido, gungu, dong,
      address, description, selected_options, status, selection_mode
    ) values (
      p_request_id, p_customer_id, p_customer_display_name, p_customer_locale, v_subitem.service_code, p_country, p_sido, p_gungu,
      coalesce(p_dong, ''), coalesce(p_address, ''), coalesce(p_description, ''), coalesce(p_selected_options, '{}'), 'MATCHED', 'CUSTOMER_SELECTED'
    );

    insert into public.request_price_snapshots (
      request_id, helper_id, service_subitem_id, service_code, subitem_code, pricing_mode, currency, base_price, minimum_charge,
      included_quantity, included_minutes, extra_unit_price, extra_hour_price, materials_policy, materials_note,
      emergency_multiplier, night_multiplier, weekend_multiplier, tax_included, initial_payable_amount, quote_required,
      source_helper_price_id, source_price_revision, source_price_updated_at
    ) values (
      p_request_id, v_helper.id, v_subitem.id, v_subitem.service_code, v_subitem.subitem_code, v_price.pricing_mode, v_price.currency,
      v_price.base_price, v_price.minimum_charge, v_price.included_quantity, v_price.included_minutes, v_price.extra_unit_price,
      v_price.extra_hour_price, v_price.materials_policy, v_price.materials_note, v_price.emergency_multiplier, v_price.night_multiplier,
      v_price.weekend_multiplier, v_price.tax_included, v_initial,
      v_price.pricing_mode = 'DIAGNOSTIC_PLUS_QUOTE' or v_price.materials_policy = 'QUOTE_REQUIRED',
      v_price.id, v_price.revision, v_price.updated_at
    );

    insert into public.request_assignments (request_id, helper_id, status)
    values (p_request_id, v_helper.id, 'PENDING')
    returning id into v_assignment_id;

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
        -- Lost a race for this helper: nothing from this block is kept.
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

revoke all on function public.upsert_helper_service_price(uuid, text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.set_helper_service_price_status(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.list_customer_offers(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer) from public, anon, authenticated;
grant execute on function public.upsert_helper_service_price(uuid, text, text, jsonb, boolean) to service_role;
grant execute on function public.set_helper_service_price_status(uuid, uuid, text) to service_role;
grant execute on function public.list_customer_offers(text, text, text, text, text) to service_role;
grant execute on function public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer) to service_role;

commit;

-- Rollback (review-only):
--   drop function if exists public.create_customer_selected_request(uuid, text, text, text, text, text, text, text, text, text, text[], uuid, integer);
--   drop function if exists public.list_customer_offers(text, text, text, text, text);
--   drop function if exists public.set_helper_service_price_status(uuid, uuid, text);
--   drop function if exists public.upsert_helper_service_price(uuid, text, text, jsonb, boolean);
--   drop trigger if exists request_assignments_selected_helper_guard on public.request_assignments;
--   drop function if exists public.request_assignments_selected_helper_guard();
--   drop table if exists public.request_price_snapshots;  (only if no real orders exist)
--   alter table public.service_requests drop column if exists selection_mode;
--   drop table if exists public.helper_service_prices; drop table if exists public.service_subitems;
--   drop function if exists public.helper_service_prices_revision(); drop function if exists public.request_price_snapshots_immutable();
--   drop type if exists public.helper_price_status; drop type if exists public.materials_policy; drop type if exists public.pricing_mode;

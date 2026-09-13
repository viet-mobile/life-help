-- LIFE.HELP Payment / Refund / Settlement Upgrade
-- Migration: 202609120002_payment_settlement_upgrade.sql
-- Money is stored as integer KRW. Never store card number/CVC/password.

begin;

-- 1. Order final amount
alter table public.orders
  add column if not exists final_amount_krw integer
  check (final_amount_krw is null or final_amount_krw > 0);

-- 2. Payment transaction upgrade
alter table public.payments
  add column if not exists provider_order_id text,
  add column if not exists payment_method text,
  add column if not exists currency text not null default 'KRW',
  add column if not exists requested_amount_krw integer,
  add column if not exists approved_amount_krw integer,
  add column if not exists cancelled_amount_krw integer not null default 0,
  add column if not exists failure_code text,
  add column if not exists failure_message text,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb,
  add column if not exists approved_at timestamptz,
  add column if not exists cancelled_at timestamptz;

update public.payments
set requested_amount_krw = amount_krw
where requested_amount_krw is null;

update public.payments
set approved_amount_krw = amount_krw
where status in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')
  and approved_amount_krw is null;

alter table public.payments
  add constraint payments_currency_check check (currency = 'KRW'),
  add constraint payments_requested_amount_check check (requested_amount_krw is null or requested_amount_krw > 0),
  add constraint payments_approved_amount_check check (approved_amount_krw is null or approved_amount_krw > 0),
  add constraint payments_cancelled_amount_check check (cancelled_amount_krw >= 0);

create unique index if not exists payments_provider_order_uidx
  on public.payments(provider, provider_order_id)
  where provider_order_id is not null;
create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_customer_id_idx on public.payments(customer_id);

-- 3. Refunds
create type public.refund_status as enum ('REQUESTED','PROCESSING','COMPLETED','FAILED','CANCELLED');

alter table public.refunds
  add column if not exists status public.refund_status not null default 'REQUESTED',
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists processed_at timestamptz,
  add column if not exists failure_code text,
  add column if not exists failure_message text,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

create index if not exists refunds_payment_id_idx on public.refunds(payment_id);
create index if not exists refunds_status_idx on public.refunds(status);

-- 4. Technician settlement summary
create type public.settlement_status as enum ('PENDING','HELD','PARTIALLY_SETTLED','SETTLED','ON_HOLD','CANCELLED');
create type public.settlement_transaction_type as enum ('FIRST','FINAL','ADJUSTMENT','REVERSAL');
create type public.settlement_transaction_status as enum ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED');

alter table public.technician_settlements
  drop column if exists net_amount_krw;

alter table public.technician_settlements
  add column if not exists pg_fee_amount_krw integer not null default 0,
  add column if not exists platform_fee_amount_krw integer not null default 0,
  add column if not exists adjustment_amount_krw integer not null default 0,
  add column if not exists net_amount_krw integer generated always as
    (gross_amount_krw - pg_fee_amount_krw - platform_fee_amount_krw + adjustment_amount_krw) stored,
  add column if not exists first_settlement_amount_krw integer not null default 0,
  add column if not exists first_settled_at timestamptz,
  add column if not exists final_settlement_amount_krw integer not null default 0,
  add column if not exists final_settled_at timestamptz,
  add column if not exists hold_until timestamptz,
  add column if not exists hold_reason text,
  add column if not exists settlement_status public.settlement_status not null default 'PENDING',
  add column if not exists updated_at timestamptz not null default now();

update public.technician_settlements
set platform_fee_amount_krw = fee_amount_krw
where platform_fee_amount_krw = 0 and fee_amount_krw <> 0;

alter table public.technician_settlements
  add constraint settlements_gross_check check (gross_amount_krw > 0),
  add constraint settlements_pg_fee_check check (pg_fee_amount_krw >= 0),
  add constraint settlements_platform_fee_check check (platform_fee_amount_krw >= 0),
  add constraint settlements_first_amount_check check (first_settlement_amount_krw >= 0),
  add constraint settlements_final_amount_check check (final_settlement_amount_krw >= 0),
  add constraint settlements_total_payout_check check (
    first_settlement_amount_krw + final_settlement_amount_krw <=
    gross_amount_krw - pg_fee_amount_krw - platform_fee_amount_krw + adjustment_amount_krw
  );

create index if not exists settlements_technician_status_idx
  on public.technician_settlements(technician_id, settlement_status);
create index if not exists settlements_hold_until_idx
  on public.technician_settlements(hold_until);

-- 5. Individual settlement payout ledger
create table if not exists public.settlement_transactions (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.technician_settlements(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(user_id),
  order_id uuid not null references public.orders(id),
  transaction_type public.settlement_transaction_type not null,
  status public.settlement_transaction_status not null default 'PENDING',
  amount_krw integer not null check (amount_krw > 0),
  provider text,
  provider_payout_id text,
  failure_code text,
  failure_message text,
  provider_metadata jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists settlement_transactions_provider_uidx
  on public.settlement_transactions(provider, provider_payout_id)
  where provider is not null and provider_payout_id is not null;
create index if not exists settlement_transactions_settlement_idx on public.settlement_transactions(settlement_id);
create index if not exists settlement_transactions_technician_idx on public.settlement_transactions(technician_id);
create index if not exists settlement_transactions_order_idx on public.settlement_transactions(order_id);

-- 6. PG webhook idempotency/event log
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  provider_payment_id text,
  event_type text not null,
  processing_status text not null default 'RECEIVED'
    check (processing_status in ('RECEIVED','PROCESSING','PROCESSED','FAILED','IGNORED')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists payment_events_provider_event_uidx
  on public.payment_events(provider, provider_event_id);
create index if not exists payment_events_payment_idx on public.payment_events(provider, provider_payment_id);
create index if not exists payment_events_status_idx on public.payment_events(processing_status);

-- 7. RLS: clients may read permitted records, but payment/refund/settlement writes are server-only.
alter table public.payment_events enable row level security;
alter table public.settlement_transactions enable row level security;

create policy "payment events staff read"
  on public.payment_events for select to authenticated
  using ((select security.has_role(array['ADMIN','STAFF']::public.app_role[])));

create policy "settlement transactions technician or staff"
  on public.settlement_transactions for select to authenticated
  using (
    technician_id = (select auth.uid())
    or (select security.has_role(array['ADMIN','STAFF']::public.app_role[]))
  );

revoke all on public.payment_events from anon;
revoke all on public.settlement_transactions from anon;
revoke insert, update, delete on public.payments from authenticated;
revoke insert, update, delete on public.refunds from authenticated;
revoke insert, update, delete on public.technician_settlements from authenticated;
grant select on public.payment_events to authenticated;
grant select on public.settlement_transactions to authenticated;

commit;

-- Application/server rules:
-- * Webhooks must be idempotent using (provider, provider_event_id).
-- * Refunds must be transactionally capped at the paid amount minus completed refunds.
-- * Open/in-review complaints freeze final settlement.
-- * FIRST + FINAL payout must never exceed net_amount_krw.
-- * Use Supabase service role for webhook/payment/refund/settlement writes.
-- * Never store card PAN/CVC/passwords in provider_metadata or payload.

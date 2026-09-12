-- VIET.MOBILE Step 2: transactional marketplace schema and RLS baseline.
-- Apply with `supabase db push` only after reviewing the deployment environment.

create extension if not exists pgcrypto;
create schema if not exists security;

create type public.app_role as enum ('CUSTOMER', 'TECHNICIAN', 'ADMIN', 'STAFF');
create type public.order_status as enum ('DRAFT', 'REQUESTED', 'MATCHING', 'QUOTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
create type public.document_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
create type public.quote_status as enum ('SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');
create type public.payment_status as enum ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
create type public.complaint_status as enum ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  phone_e164 text unique,
  preferred_locale text not null default 'vi' check (preferred_locale in ('ko', 'vi')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles(id), granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create table public.technician_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text, service_radius_km integer not null default 15 check (service_radius_km between 1 and 100),
  is_available boolean not null default false, verification_status public.document_status not null default 'PENDING',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.technician_documents (
  id uuid primary key default gen_random_uuid(), technician_id uuid not null references public.technician_profiles(user_id) on delete cascade,
  document_type text not null, storage_path text not null, status public.document_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, expires_at date, created_at timestamptz not null default now()
);
create table public.service_regions (
  id uuid primary key default gen_random_uuid(), name_ko text not null, name_vi text not null, province text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), unique(name_ko, province)
);
create table public.services (
  id uuid primary key default gen_random_uuid(), slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name_ko text not null, name_vi text not null, is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.service_areas (
  service_id uuid not null references public.services(id) on delete cascade,
  region_id uuid not null references public.service_regions(id) on delete cascade,
  is_active boolean not null default true, primary key(service_id, region_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
  service_id uuid not null references public.services(id), region_id uuid not null references public.service_regions(id),
  status public.order_status not null default 'REQUESTED', description text not null check (char_length(description) between 1 and 5000),
  address_line1 text not null, address_line2 text, postal_code text, requested_at timestamptz not null default now(),
  scheduled_for timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_photos (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null, uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.order_status_history (
  id bigint generated always as identity primary key, order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status, to_status public.order_status not null, changed_by uuid references public.profiles(id), note text, created_at timestamptz not null default now()
);
create table public.order_assignments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(user_id), assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(), accepted_at timestamptz, declined_at timestamptz, completed_at timestamptz,
  unique(order_id, technician_id)
);
create table public.quotes (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(user_id), amount_krw integer not null check (amount_krw > 0),
  details text not null check (char_length(details) between 1 and 3000), status public.quote_status not null default 'SENT', expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.quote_approvals (
  quote_id uuid primary key references public.quotes(id) on delete cascade, customer_id uuid not null references public.profiles(id),
  approved boolean not null, created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), customer_id uuid not null references public.profiles(id),
  provider text not null, provider_payment_id text unique, amount_krw integer not null check (amount_krw > 0), status public.payment_status not null default 'PENDING',
  paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id), amount_krw integer not null check (amount_krw > 0),
  reason text not null, provider_refund_id text unique, processed_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.technician_settlements (
  id uuid primary key default gen_random_uuid(), technician_id uuid not null references public.technician_profiles(user_id),
  order_id uuid not null unique references public.orders(id), gross_amount_krw integer not null, fee_amount_krw integer not null default 0,
  net_amount_krw integer generated always as (gross_amount_krw - fee_amount_krw) stored, settled_at timestamptz, created_at timestamptz not null default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id), customer_id uuid not null references public.profiles(id),
  technician_id uuid not null references public.technician_profiles(user_id), rating smallint not null check (rating between 1 and 5), comment text check (char_length(comment) <= 2000), created_at timestamptz not null default now()
);
create table public.complaints (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), customer_id uuid not null references public.profiles(id),
  status public.complaint_status not null default 'OPEN', subject text not null, description text not null, resolved_by uuid references public.profiles(id), resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.point_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), amount integer not null check (amount <> 0), reason text not null, order_id uuid references public.orders(id), created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), type text not null, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.admin_audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders(customer_id); create index orders_status_idx on public.orders(status); create index assignments_technician_id_idx on public.order_assignments(technician_id); create index quotes_order_id_idx on public.quotes(order_id); create index notifications_user_id_idx on public.notifications(user_id, read_at); create index audit_logs_actor_id_idx on public.admin_audit_logs(actor_id);

create function security.has_role(required_roles public.app_role[]) returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = any(required_roles)) $$;
create function security.is_order_customer(target_order uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from public.orders where id = target_order and customer_id = (select auth.uid())) $$;
create function security.is_assigned_technician(target_order uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from public.order_assignments where order_id = target_order and technician_id = (select auth.uid()) and declined_at is null) $$;
grant usage on schema security to authenticated; grant execute on function security.has_role(public.app_role[]), security.is_order_customer(uuid), security.is_assigned_technician(uuid) to authenticated;

-- RLS is enabled for every exposed table. Service role bypasses RLS and must remain server-only.
alter table public.profiles enable row level security; alter table public.user_roles enable row level security; alter table public.technician_profiles enable row level security; alter table public.technician_documents enable row level security; alter table public.service_regions enable row level security; alter table public.services enable row level security; alter table public.service_areas enable row level security; alter table public.orders enable row level security; alter table public.order_photos enable row level security; alter table public.order_status_history enable row level security; alter table public.order_assignments enable row level security; alter table public.quotes enable row level security; alter table public.quote_approvals enable row level security; alter table public.payments enable row level security; alter table public.refunds enable row level security; alter table public.technician_settlements enable row level security; alter table public.reviews enable row level security; alter table public.complaints enable row level security; alter table public.point_ledger enable row level security; alter table public.notifications enable row level security; alter table public.admin_audit_logs enable row level security;

create policy "profile self or staff read" on public.profiles for select to authenticated using (id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "profile self update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "roles staff read" on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "technician visibility" on public.technician_profiles for select to authenticated using (user_id = (select auth.uid()) or verification_status = 'APPROVED' or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "technician self update" on public.technician_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "documents owner or staff" on public.technician_documents for select to authenticated using (technician_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "documents owner insert" on public.technician_documents for insert to authenticated with check (technician_id = (select auth.uid()));
create policy "catalog public read regions" on public.service_regions for select using (is_active); create policy "catalog public read services" on public.services for select using (is_active); create policy "catalog public read areas" on public.service_areas for select using (is_active);
create policy "orders customer tech staff read" on public.orders for select to authenticated using (customer_id = (select auth.uid()) or (select security.is_assigned_technician(id)) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "orders customer insert" on public.orders for insert to authenticated with check (customer_id = (select auth.uid()) and status = 'REQUESTED');
create policy "orders customer update while open" on public.orders for update to authenticated using (customer_id = (select auth.uid()) and status in ('REQUESTED','MATCHING')) with check (customer_id = (select auth.uid()) and status in ('REQUESTED','MATCHING','CANCELLED'));
create policy "photos order participants read" on public.order_photos for select to authenticated using ((select security.is_order_customer(order_id)) or (select security.is_assigned_technician(order_id)) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "photos customer insert" on public.order_photos for insert to authenticated with check (uploaded_by = (select auth.uid()) and (select security.is_order_customer(order_id)));
create policy "history order participants" on public.order_status_history for select to authenticated using ((select security.is_order_customer(order_id)) or (select security.is_assigned_technician(order_id)) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "assignments participants" on public.order_assignments for select to authenticated using (technician_id = (select auth.uid()) or (select security.is_order_customer(order_id)) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "quotes participants" on public.quotes for select to authenticated using (technician_id = (select auth.uid()) or (select security.is_order_customer(order_id)) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "quotes assigned technician insert" on public.quotes for insert to authenticated with check (technician_id = (select auth.uid()) and (select security.is_assigned_technician(order_id)));
create policy "quote approvals customer read" on public.quote_approvals for select to authenticated using (customer_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "quote approvals customer insert" on public.quote_approvals for insert to authenticated with check (customer_id = (select auth.uid()) and (select security.is_order_customer((select order_id from public.quotes where id = quote_id))));
create policy "payments customer or staff" on public.payments for select to authenticated using (customer_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "refunds customer or staff" on public.refunds for select to authenticated using ((select security.is_order_customer((select order_id from public.payments where id = payment_id))) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "settlements technician or staff" on public.technician_settlements for select to authenticated using (technician_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "reviews participants" on public.reviews for select to authenticated using (customer_id = (select auth.uid()) or technician_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "reviews customer insert" on public.reviews for insert to authenticated with check (customer_id = (select auth.uid()) and (select security.is_order_customer(order_id)));
create policy "complaints customer or staff" on public.complaints for select to authenticated using (customer_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "complaints customer insert" on public.complaints for insert to authenticated with check (customer_id = (select auth.uid()) and (select security.is_order_customer(order_id)));
create policy "points self or staff" on public.point_ledger for select to authenticated using (user_id = (select auth.uid()) or (select security.has_role(array['ADMIN','STAFF']::public.app_role[])));
create policy "notifications self" on public.notifications for select to authenticated using (user_id = (select auth.uid())); create policy "notifications self update" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "audit staff only" on public.admin_audit_logs for select to authenticated using ((select security.has_role(array['ADMIN','STAFF']::public.app_role[])));

revoke all on all tables in schema public from anon;
grant select on public.services, public.service_regions, public.service_areas to anon;
grant select, insert, update on public.profiles, public.technician_profiles, public.technician_documents, public.orders, public.order_photos, public.quotes, public.quote_approvals, public.reviews, public.complaints, public.notifications to authenticated;
grant select on public.user_roles, public.order_status_history, public.order_assignments, public.payments, public.refunds, public.technician_settlements, public.point_ledger, public.admin_audit_logs, public.services, public.service_regions, public.service_areas to authenticated;

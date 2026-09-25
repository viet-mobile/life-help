-- LIFE.HELP Core Service Matching & Atomic Assignment Schema
-- Migration: 202609250001_core_service_matching_schema.sql

begin;

-- 1. Enums
do $$ begin
  create type public.service_request_status as enum (
    'CREATED',
    'SEARCHING',
    'MATCHED',
    'HELPER_NOTIFIED',
    'ACCEPTED',
    'DECLINED',
    'IN_PROGRESS',
    'COMPLETED',
    'PAYMENT_PENDING',
    'SETTLED',
    'CLOSED',
    'CANCELLED',
    'EXPIRED',
    'NO_HELPER_AVAILABLE'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_status as enum (
    'PENDING',
    'NOTIFIED',
    'ACCEPTED',
    'DECLINED',
    'TIMEOUT',
    'CANCELLED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.conversation_type as enum (
    'CUSTOMER_HELPER',
    'CUSTOMER_ADMIN',
    'HELPER_ADMIN'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.conversation_status as enum (
    'ACTIVE',
    'CLOSED',
    'DELETION_SCHEDULED',
    'DELETED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_sender_role as enum (
    'CUSTOMER',
    'HELPER',
    'ADMIN',
    'SYSTEM'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.escalation_reason as enum (
    'NO_HELPER_AVAILABLE',
    'HELPER_DECLINED_ALL',
    'MATCHING_TIMEOUT',
    'DISPUTE',
    'USER_REQUEST'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.escalation_status as enum (
    'PENDING',
    'ASSIGNED',
    'RESOLVED',
    'CANCELLED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_recipient_type as enum (
    'CUSTOMER',
    'HELPER',
    'ADMIN'
  );
exception when duplicate_object then null; end $$;

-- 2. Core Service Requests
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  customer_display_name text not null,
  customer_locale text not null default 'ko',
  service_slug text not null,
  country text not null default 'KR',
  sido text not null,
  gungu text not null,
  dong text not null default '',
  address text not null default '',
  description text not null default '',
  selected_options text[] not null default '{}',
  status public.service_request_status not null default 'CREATED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Server Helper Profiles
create table if not exists public.helpers (
  id uuid primary key default gen_random_uuid(),
  helper_id text unique not null,
  name text not null,
  email text,
  phone text,
  avatar_icon text not null default '🤝',
  primary_locale text not null default 'ko',
  spoken_locales text[] not null default '{"ko"}',
  country text not null default 'KR',
  sido text not null,
  gungu text,
  is_verified boolean not null default true,
  is_active boolean not null default true,
  on_duty boolean not null default true,
  duty_hours text not null default '09:00 - 18:00',
  rating numeric(3, 2) not null default 5.00,
  completed_jobs integer not null default 0,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Helper Services Junction
create table if not exists public.helper_services (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.helpers(id) on delete cascade,
  service_slug text not null,
  created_at timestamptz not null default now(),
  unique(helper_id, service_slug)
);

-- 5. Helper Regions Junction
create table if not exists public.helper_regions (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.helpers(id) on delete cascade,
  country text not null default 'KR',
  sido text not null,
  gungu text not null,
  created_at timestamptz not null default now(),
  unique(helper_id, country, sido, gungu)
);

-- 6. Request Assignments with Atomic Concurrency Guard
create table if not exists public.request_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  helper_id uuid not null references public.helpers(id) on delete cascade,
  status public.assignment_status not null default 'PENDING',
  assigned_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz
);

-- Guard: Only 1 active assignment allowed per service request at any given time
create unique index if not exists request_assignments_active_uidx
  on public.request_assignments(request_id)
  where status in ('PENDING', 'NOTIFIED', 'ACCEPTED');

-- 7. Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.service_requests(id) on delete set null,
  conversation_type public.conversation_type not null default 'CUSTOMER_HELPER',
  customer_id text not null,
  helper_id uuid references public.helpers(id) on delete set null,
  status public.conversation_status not null default 'ACTIVE',
  customer_locale text not null default 'ko',
  helper_locale text not null default 'ko',
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  deletion_scheduled_at timestamptz
);

-- 8. Messages with Dual Original + Translated Storage
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_role public.message_sender_role not null,
  sender_id text not null,
  original_language text not null,
  original_text text not null,
  translated_language text,
  translated_text text,
  translation_status text not null default 'COMPLETED',
  created_at timestamptz not null default now()
);

-- 9. Admin Escalation Queue
create table if not exists public.admin_escalations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  reason public.escalation_reason not null,
  status public.escalation_status not null default 'PENDING',
  escalated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  admin_notes text
);

-- 10. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type public.notification_recipient_type not null,
  recipient_id text not null,
  type text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists service_requests_status_idx on public.service_requests(status);
create index if not exists service_requests_customer_idx on public.service_requests(customer_id);
create index if not exists helpers_on_duty_idx on public.helpers(on_duty, is_active);
create index if not exists helper_services_slug_idx on public.helper_services(service_slug);
create index if not exists helper_regions_loc_idx on public.helper_regions(country, sido, gungu);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);
create index if not exists escalations_status_idx on public.admin_escalations(status);
create index if not exists notifications_recipient_idx on public.notifications(recipient_type, recipient_id, read_at);

-- 11. Atomic 1:1 Matching Procedure
create or replace function public.match_and_assign_helper(p_request_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_req record;
  v_helper record;
  v_assignment_id uuid;
  v_conv_id uuid;
  v_admin_esc_id uuid;
begin
  -- 1. Fetch and lock request
  select * into v_req
  from public.service_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Request not found');
  end if;

  if v_req.status not in ('CREATED', 'SEARCHING') then
    return jsonb_build_object('success', false, 'error', 'Invalid request status for matching');
  end if;

  -- 2. Find best matching on-duty helper with row lock
  select h.* into v_helper
  from public.helpers h
  join public.helper_services hs on hs.helper_id = h.id
  join public.helper_regions hr on hr.helper_id = h.id
  where h.on_duty = true
    and h.is_active = true
    and hs.service_slug = v_req.service_slug
    and hr.country = v_req.country
    and hr.sido = v_req.sido
    and (hr.gungu = v_req.gungu or hr.gungu = '전체' or hr.gungu = '')
  order by h.rating desc, h.completed_jobs desc
  limit 1
  for update skip locked;

  -- 3. If helper found, atomically assign and create conversation
  if found then
    insert into public.request_assignments (
      request_id,
      helper_id,
      status
    ) values (
      v_req.id,
      v_helper.id,
      'PENDING'
    ) returning id into v_assignment_id;

    update public.service_requests
    set status = 'MATCHED', updated_at = now()
    where id = v_req.id;

    insert into public.conversations (
      request_id,
      conversation_type,
      customer_id,
      helper_id,
      customer_locale,
      helper_locale
    ) values (
      v_req.id,
      'CUSTOMER_HELPER',
      v_req.customer_id,
      v_helper.id,
      v_req.customer_locale,
      v_helper.primary_locale
    ) returning id into v_conv_id;

    insert into public.notifications (
      recipient_type,
      recipient_id,
      type,
      title,
      body,
      payload
    ) values (
      'HELPER',
      v_helper.helper_id,
      'NEW_SERVICE_REQUEST',
      '신규 서비스 배정 요청',
      v_req.service_slug || ' 서비스 요청이 접수되었습니다.',
      jsonb_build_object('request_id', v_req.id, 'conversation_id', v_conv_id)
    );

    return jsonb_build_object(
      'success', true,
      'status', 'MATCHED',
      'helper_id', v_helper.helper_id,
      'helper_name', v_helper.name,
      'conversation_id', v_conv_id
    );
  else
    -- 4. No matching helper found: STRICT ESCALATION, NO RANDOM FALLBACK
    update public.service_requests
    set status = 'NO_HELPER_AVAILABLE', updated_at = now()
    where id = v_req.id;

    insert into public.admin_escalations (
      request_id,
      reason,
      status,
      admin_notes
    ) values (
      v_req.id,
      'NO_HELPER_AVAILABLE',
      'PENDING',
      '해당 지역 및 서비스 조건의 활동 헬퍼 부재로 관리자 큐 이관'
    ) returning id into v_admin_esc_id;

    insert into public.notifications (
      recipient_type,
      recipient_id,
      type,
      title,
      body,
      payload
    ) values (
      'ADMIN',
      'sys@life.help',
      'NO_HELPER_AVAILABLE',
      '헬퍼 부재 에스컬레이션 접수',
      v_req.sido || ' ' || v_req.gungu || ' 지역 ' || v_req.service_slug || ' 헬퍼 부재',
      jsonb_build_object('request_id', v_req.id, 'escalation_id', v_admin_esc_id)
    );

    return jsonb_build_object(
      'success', true,
      'status', 'NO_HELPER_AVAILABLE',
      'escalation_id', v_admin_esc_id
    );
  end if;
end;
$$;

commit;

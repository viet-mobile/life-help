-- 202609280016: conversation lifecycle integrity.
--
-- Problem (found in the staging financial closeout): a customer-Helper conversation stayed ACTIVE
-- after its relationship ended - Helper decline / timeout / release (-> CUSTOMER_RESELECTION_REQUIRED,
-- OPEN_FOR_HELPERS, SEARCHING), funded cancel (CANCELLED), expiry - so the customer could keep
-- posting into a dead conversation (the Helper side was already blocked by the assignment check).
--
-- Invariant: a conversation is writable only while it belongs to the CURRENT communication
-- relationship of a request in service. Enforced in the database, on every call path:
--   1. an assignment leaving the current set (PENDING / NOTIFIED / ACCEPTED / COMPLETED) for DECLINED /
--      TIMEOUT / CANCELLED closes that Helper's ACTIVE conversation on the request, in the same transaction;
--   2. a request leaving the service-authority set (MATCHED / HELPER_NOTIFIED / ACCEPTED / IN_PROGRESS /
--      COMPLETED / PAYMENT_PENDING) closes all its ACTIVE conversations, in the same transaction
--      (CANCELLED, EXPIRED, NO_HELPER_AVAILABLE, reselection / reopen, SETTLED, CLOSED, ...);
--   3. message insert guard (defense in depth): the conversation row is locked FOR SHARE (a concurrent
--      close either waits for the message or wins and the message is refused), must be ACTIVE, its
--      request in service, its Helper still current, and the sender one of its two participants;
--   4. at most one ACTIVE customer-Helper conversation per request.
-- A new current Helper always gets a NEW conversation (every assignment path already inserts one);
-- closed conversations are never reopened. Closing is not deleting: content stays until the existing
-- settlement cleanup / retention rules remove it. Existing status values are reused (CLOSED).
-- Does not modify applied migrations.

begin;

create or replace function public.conversation_request_in_service(p_status public.service_request_status)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p_status in ('MATCHED', 'HELPER_NOTIFIED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING');
$$;

-- 1. Assignment relationship ended -> that Helper's conversation closes.
create or replace function public.close_conversation_on_assignment_end()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status in ('PENDING', 'NOTIFIED', 'ACCEPTED', 'COMPLETED') and new.status in ('DECLINED', 'TIMEOUT', 'CANCELLED') then
    update public.conversations set status = 'CLOSED', closed_at = coalesce(closed_at, now())
    where request_id = new.request_id and helper_id = new.helper_id and status = 'ACTIVE';
  end if;
  return new;
end;
$$;
create trigger request_assignments_close_conversation after update of status on public.request_assignments
  for each row execute function public.close_conversation_on_assignment_end();

-- 2. Request left service authority -> all its conversations close.
create or replace function public.close_conversations_on_request_end()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status and not public.conversation_request_in_service(new.status) then
    update public.conversations set status = 'CLOSED', closed_at = coalesce(closed_at, now())
    where request_id = new.id and status = 'ACTIVE';
  end if;
  return new;
end;
$$;
create trigger service_requests_close_conversations after update of status on public.service_requests
  for each row execute function public.close_conversations_on_request_end();

-- 3. Message writes: only into the current, writable relationship.
create or replace function public.messages_require_writable_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_conv public.conversations%rowtype;
  v_request_status public.service_request_status;
begin
  -- FOR SHARE: serializes with a concurrent close (which updates this row).
  select * into v_conv from public.conversations where id = new.conversation_id for share;
  if not found or v_conv.status <> 'ACTIVE' then
    raise exception 'CONVERSATION_NOT_WRITABLE' using errcode = 'P0001';
  end if;
  if v_conv.conversation_type = 'CUSTOMER_HELPER' then
    select status into v_request_status from public.service_requests where id = v_conv.request_id;
    if v_request_status is null or not public.conversation_request_in_service(v_request_status)
       or v_conv.helper_id is null
       or not exists (select 1 from public.request_assignments a where a.request_id = v_conv.request_id and a.helper_id = v_conv.helper_id
                      and a.status in ('PENDING', 'NOTIFIED', 'ACCEPTED', 'COMPLETED')) then
      raise exception 'CONVERSATION_NOT_WRITABLE' using errcode = 'P0001';
    end if;
    if (new.sender_role = 'CUSTOMER' and new.sender_id is distinct from v_conv.customer_id)
       or (new.sender_role = 'HELPER' and new.sender_id is distinct from v_conv.helper_id::text) then
      raise exception 'CONVERSATION_NOT_WRITABLE' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger messages_require_writable_conversation before insert on public.messages
  for each row execute function public.messages_require_writable_conversation();

-- A conversation only ever moves forward: ACTIVE -> CLOSED / DELETION_SCHEDULED, CLOSED ->
-- DELETION_SCHEDULED, DELETION_SCHEDULED -> DELETED. A closed conversation never becomes current again.
create or replace function public.conversations_status_forward_only()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status and not (
       (old.status = 'ACTIVE' and new.status in ('CLOSED', 'DELETION_SCHEDULED'))
    or (old.status = 'CLOSED' and new.status = 'DELETION_SCHEDULED')
    or (old.status = 'DELETION_SCHEDULED' and new.status = 'DELETED')
  ) then
    raise exception 'conversations: status % -> % is not allowed (never reopened)', old.status, new.status using errcode = 'P0001';
  end if;
  if (new.request_id, new.customer_id, new.helper_id, new.conversation_type) is distinct from (old.request_id, old.customer_id, old.helper_id, old.conversation_type)
     and not (old.request_id is not null and new.request_id is null) and not (old.helper_id is not null and new.helper_id is null) then
    raise exception 'conversations: participants are immutable (a new Helper gets a new conversation)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger conversations_status_forward_only before update on public.conversations
  for each row execute function public.conversations_status_forward_only();

-- Backfill: close every ACTIVE conversation that no longer belongs to a current relationship.
update public.conversations c set status = 'CLOSED', closed_at = coalesce(c.closed_at, now())
where c.status = 'ACTIVE' and c.conversation_type = 'CUSTOMER_HELPER'
  and (c.helper_id is null
    or not exists (select 1 from public.service_requests r where r.id = c.request_id and public.conversation_request_in_service(r.status))
    or not exists (select 1 from public.request_assignments a where a.request_id = c.request_id and a.helper_id = c.helper_id
                   and a.status in ('PENDING', 'NOTIFIED', 'ACCEPTED', 'COMPLETED')));
-- Any remaining duplicates (never expected): keep the newest ACTIVE one per request.
update public.conversations c set status = 'CLOSED', closed_at = coalesce(c.closed_at, now())
where c.status = 'ACTIVE' and c.conversation_type = 'CUSTOMER_HELPER'
  and exists (select 1 from public.conversations n where n.request_id = c.request_id and n.conversation_type = 'CUSTOMER_HELPER'
              and n.status = 'ACTIVE' and (n.created_at, n.id) > (c.created_at, c.id));

-- 4. One ACTIVE customer-Helper conversation per request.
create unique index conversations_one_active_per_request_uidx on public.conversations (request_id)
  where status = 'ACTIVE' and conversation_type = 'CUSTOMER_HELPER';

revoke all on function public.conversation_request_in_service(public.service_request_status) from public, anon, authenticated;
revoke all on function public.close_conversation_on_assignment_end() from public, anon, authenticated, service_role;
revoke all on function public.close_conversations_on_request_end() from public, anon, authenticated, service_role;
revoke all on function public.messages_require_writable_conversation() from public, anon, authenticated, service_role;
revoke all on function public.conversations_status_forward_only() from public, anon, authenticated, service_role;
grant execute on function public.conversation_request_in_service(public.service_request_status) to service_role;

commit;

-- Rollback (review-only): drop the four triggers, their functions, conversation_request_in_service and
-- conversations_one_active_per_request_uidx. Conversations closed by the backfill stay CLOSED (history).

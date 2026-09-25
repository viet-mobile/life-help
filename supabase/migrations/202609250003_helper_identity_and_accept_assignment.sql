-- LIFE.HELP P2-3A: Helper identity mapping and atomic assignment acceptance
-- Draft only. Do not apply until reviewed and explicitly approved.

begin;

-- Existing helper rows remain valid until an authenticated account is linked explicitly.
alter table public.helpers
  add column auth_user_id uuid
  references auth.users(id)
  on delete set null;

-- One authenticated account maps to at most one Phase 1 helper identity.
-- Legacy helpers with no linked account remain allowed.
create unique index helpers_auth_user_uidx
  on public.helpers(auth_user_id)
  where auth_user_id is not null;

-- Atomically accepts one assignment for the server-resolved helper identity.
-- Lock order intentionally matches release_assignment_for_rematch:
-- request_assignments row first, then service_requests row.
create function public.accept_assignment(
  p_assignment_id uuid,
  p_helper_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_assignment record;
  v_request record;
begin
  -- Lock the assignment first so ACCEPT and DECLINE cannot both transition it.
  select * into v_assignment
  from public.request_assignments
  where id = p_assignment_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'ASSIGNMENT_NOT_FOUND',
      'error', 'Assignment not found'
    );
  end if;

  if v_assignment.helper_id <> p_helper_id then
    return jsonb_build_object(
      'success', false,
      'code', 'HELPER_MISMATCH',
      'error', 'Assignment is not assigned to this helper'
    );
  end if;

  -- Lock the parent request using the same order as the existing release RPC.
  select * into v_request
  from public.service_requests
  where id = v_assignment.request_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'REQUEST_NOT_FOUND',
      'error', 'Parent service request not found'
    );
  end if;

  -- A repeated ACCEPT is idempotent only when both rows are already consistent.
  if v_assignment.status = 'ACCEPTED' then
    if v_request.status = 'ACCEPTED' then
      return jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment.id,
        'request_id', v_request.id,
        'assignment_status', v_assignment.status,
        'request_status', v_request.status,
        'idempotent', true
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'code', 'STATE_INCONSISTENT',
      'error', 'Accepted assignment and request states are inconsistent'
    );
  end if;

  if v_assignment.status not in ('PENDING', 'NOTIFIED') then
    return jsonb_build_object(
      'success', false,
      'code', 'ASSIGNMENT_NOT_ACCEPTABLE',
      'error', 'Assignment is not pending acceptance',
      'assignment_status', v_assignment.status
    );
  end if;

  if v_request.status not in ('MATCHED', 'HELPER_NOTIFIED') then
    return jsonb_build_object(
      'success', false,
      'code', 'REQUEST_NOT_ACCEPTABLE',
      'error', 'Service request is not pending helper acceptance',
      'request_status', v_request.status
    );
  end if;

  update public.request_assignments
  set status = 'ACCEPTED',
      responded_at = coalesce(responded_at, now())
  where id = v_assignment.id;

  update public.service_requests
  set status = 'ACCEPTED',
      updated_at = now()
  where id = v_request.id;

  return jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment.id,
    'request_id', v_request.id,
    'assignment_status', 'ACCEPTED',
    'request_status', 'ACCEPTED',
    'idempotent', false
  );
end;
$$;

-- The server resolves the authenticated user and helper identity before calling this RPC.
-- Direct browser invocation remains blocked.
revoke all on function public.accept_assignment(uuid, uuid) from public;
revoke all on function public.accept_assignment(uuid, uuid) from anon;
revoke all on function public.accept_assignment(uuid, uuid) from authenticated;
grant execute on function public.accept_assignment(uuid, uuid) to service_role;

commit;

-- Rollback (review-only; execute only if this migration is explicitly approved for rollback):
-- revoke all on function public.accept_assignment(uuid, uuid) from public;
-- drop function if exists public.accept_assignment(uuid, uuid);
-- drop index if exists public.helpers_auth_user_uidx;
-- alter table public.helpers drop column if exists auth_user_id;

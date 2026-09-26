-- LIFE.HELP: terminal successful assignment state + atomic helper release at service completion
-- Migration: 202609260009_assignment_completed_release.sql
-- Apply to STAGING only (wreebowcbiymodswajwe). Never production (wstdbymmkrqgtsibhcjz).
--
-- Problem: an ACCEPTED assignment stayed ACCEPTED after the service was COMPLETED, so the
-- helper-active unique index and match_and_assign_helper kept treating the helper as occupied.
--
-- Fix:
--   * assignment_status gains the terminal successful value COMPLETED.
--   * Active sets everywhere remain the explicit allow-list ('PENDING','NOTIFIED','ACCEPTED'):
--     request_assignments_active_uidx, request_assignments_helper_active_uidx,
--     match_and_assign_helper and release_assignment_for_rematch therefore treat COMPLETED as
--     inactive without being modified. The one-active-assignment-per-helper guarantee is unchanged.
--   * complete_assignment_service() moves request IN_PROGRESS -> COMPLETED and assignment
--     ACCEPTED -> COMPLETED in one transaction, so the two can never diverge.
--   * Assignments already stuck ACCEPTED behind a finished request are terminalized.
--
-- Additive only: no rows deleted, no existing function or index changed. Completed assignment
-- rows remain as service/settlement/dispute history. Financial states are untouched.
--
-- Paste the whole file into the STAGING SQL editor and run it once. Part 1 commits the enum
-- value on its own because PostgreSQL forbids using a new enum value in the transaction that
-- added it.

-- Part 1: new enum value (idempotent)
begin;
alter type public.assignment_status add value if not exists 'COMPLETED';
commit;

-- Part 2: atomic completion RPC + repair of stuck helpers
begin;

create or replace function public.complete_assignment_service(
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
  -- Lock order matches accept_assignment / release_assignment_for_rematch:
  -- request_assignments row first, then service_requests row.
  select * into v_assignment
  from public.request_assignments
  where id = p_assignment_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'ASSIGNMENT_NOT_FOUND', 'error', 'Assignment not found');
  end if;

  if v_assignment.helper_id <> p_helper_id then
    return jsonb_build_object('success', false, 'code', 'HELPER_MISMATCH', 'error', 'Assignment is not assigned to this helper');
  end if;

  select * into v_request
  from public.service_requests
  where id = v_assignment.request_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'REQUEST_NOT_FOUND', 'error', 'Parent service request not found');
  end if;

  -- Repeated COMPLETE: deterministic success, nothing reopened.
  if v_assignment.status = 'COMPLETED' then
    return jsonb_build_object(
      'success', true, 'idempotent', true,
      'assignment_id', v_assignment.id, 'request_id', v_request.id,
      'assignment_status', 'COMPLETED', 'request_status', v_request.status
    );
  end if;

  if v_assignment.status <> 'ACCEPTED' then
    return jsonb_build_object(
      'success', false, 'code', 'ASSIGNMENT_NOT_ACCEPTED',
      'error', 'Assignment is not accepted', 'assignment_status', v_assignment.status
    );
  end if;

  -- Legacy divergence: service already finished (possibly already in financial states) while
  -- the assignment stayed ACCEPTED. Release the helper; never touch the request status.
  if v_request.status in ('COMPLETED', 'PAYMENT_PENDING', 'SETTLED', 'CLOSED') then
    update public.request_assignments
    set status = 'COMPLETED',
        completed_at = coalesce(completed_at, now())
    where id = v_assignment.id;

    return jsonb_build_object(
      'success', true, 'idempotent', true, 'repaired', true,
      'assignment_id', v_assignment.id, 'request_id', v_request.id,
      'assignment_status', 'COMPLETED', 'request_status', v_request.status
    );
  end if;

  if v_request.status <> 'IN_PROGRESS' then
    return jsonb_build_object(
      'success', false, 'code', 'REQUEST_NOT_COMPLETABLE',
      'error', 'Service request is not in progress', 'request_status', v_request.status
    );
  end if;

  update public.service_requests
  set status = 'COMPLETED',
      updated_at = now()
  where id = v_request.id;

  update public.request_assignments
  set status = 'COMPLETED',
      completed_at = coalesce(completed_at, now())
  where id = v_assignment.id;

  return jsonb_build_object(
    'success', true, 'idempotent', false,
    'assignment_id', v_assignment.id, 'request_id', v_request.id,
    'assignment_status', 'COMPLETED', 'request_status', 'COMPLETED'
  );
end;
$$;

-- The server resolves the authenticated helper identity before calling this RPC.
revoke all on function public.complete_assignment_service(uuid, uuid) from public;
revoke all on function public.complete_assignment_service(uuid, uuid) from anon;
revoke all on function public.complete_assignment_service(uuid, uuid) from authenticated;
grant execute on function public.complete_assignment_service(uuid, uuid) to service_role;

-- Release helpers already stuck behind finished services. Only ACCEPTED rows whose request has
-- finished the service are touched; request rows and financial state are not modified.
update public.request_assignments ra
set status = 'COMPLETED',
    completed_at = coalesce(ra.completed_at, sr.updated_at, now())
from public.service_requests sr
where sr.id = ra.request_id
  and ra.status = 'ACCEPTED'
  and sr.status in ('COMPLETED', 'PAYMENT_PENDING', 'SETTLED', 'CLOSED');

commit;

-- Rollback (review-only): PostgreSQL cannot drop an enum value. To roll back behaviour:
--   drop function if exists public.complete_assignment_service(uuid, uuid);
-- COMPLETED rows then remain inactive history, which is the intended semantic anyway.

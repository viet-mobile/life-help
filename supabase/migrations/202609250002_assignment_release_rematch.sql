-- LIFE.HELP Assignment Release & Atomic Rematch Procedure
-- Migration: 202609250002_assignment_release_rematch.sql
-- Enables atomic release of DECLINED or TIMEOUT assignments and reopens request to SEARCHING

begin;

-- Atomic Assignment Release Procedure
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
begin
  -- 1. Validate release status input
  if p_release_status not in ('DECLINED', 'TIMEOUT') then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid release status. Must be DECLINED or TIMEOUT'
    );
  end if;

  v_status_enum := p_release_status::public.assignment_status;

  -- 2. Fetch and lock target assignment
  select * into v_assignment
  from public.request_assignments
  where id = p_assignment_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Assignment not found'
    );
  end if;

  -- 3. Verify assignment is currently in a releasable active status
  if v_assignment.status not in ('PENDING', 'NOTIFIED', 'ACCEPTED') then
    return jsonb_build_object(
      'success', false,
      'error', 'Assignment is not in an active releaseable state',
      'current_status', v_assignment.status
    );
  end if;

  -- 4. Fetch and lock connected service_request
  select * into v_request
  from public.service_requests
  where id = v_assignment.request_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Parent service request not found'
    );
  end if;

  -- 5. Transition assignment status to release status
  update public.request_assignments
  set status = v_status_enum,
      responded_at = coalesce(responded_at, now())
  where id = v_assignment.id;

  -- 6. Check if any other active assignment exists for this request
  select count(*) into v_other_active_count
  from public.request_assignments
  where request_id = v_request.id
    and id <> v_assignment.id
    and status in ('PENDING', 'NOTIFIED', 'ACCEPTED');

  -- 7. If no other active assignment exists, reopen request for matching
  if v_other_active_count = 0 then
    update public.service_requests
    set status = 'SEARCHING',
        updated_at = now()
    where id = v_request.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment.id,
    'request_id', v_request.id,
    'new_assignment_status', p_release_status,
    'request_reopened', (v_other_active_count = 0),
    'request_status', case when v_other_active_count = 0 then 'SEARCHING' else v_request.status end
  );
end;
$$;

-- RPC Permission Hardening
revoke execute on function public.release_assignment_for_rematch(uuid, text) from public;
revoke execute on function public.release_assignment_for_rematch(uuid, text) from anon;
revoke execute on function public.release_assignment_for_rematch(uuid, text) from authenticated;
grant execute on function public.release_assignment_for_rematch(uuid, text) to service_role;

commit;

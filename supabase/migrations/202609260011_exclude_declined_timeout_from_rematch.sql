-- LIFE.HELP: never re-pick a helper who already declined / timed out on the same request
-- Migration: 202609260011_exclude_declined_timeout_from_rematch.sql
-- Apply to STAGING only (wreebowcbiymodswajwe). Never production (wstdbymmkrqgtsibhcjz).
--
-- Bug: release_assignment_for_rematch (202609250002) moves the helper's assignment to DECLINED or
-- TIMEOUT and reopens the request to SEARCHING; match_and_assign_helper (202609250001, not
-- redefined since) then excluded only helpers holding an ACTIVE assignment (PENDING/NOTIFIED/
-- ACCEPTED), so the helper who just declined was usually selected again for the same request.
--
-- Fix: replace match_and_assign_helper with the identical body plus ONE additional candidate
-- filter: exclude helpers that have a DECLINED or TIMEOUT assignment for THIS request.
--   * Request-specific: the helper stays eligible for every other request.
--   * Unchanged: signature (p_request_id uuid) -> jsonb, security definer, search_path, request
--     row lock, CREATED/SEARCHING guard, service/country/sido/gungu (incl. '전체' / '') criteria,
--     global active-assignment exclusion, rating desc / completed_jobs desc ordering,
--     FOR UPDATE SKIP LOCKED, unique_violation retry on request_assignments_helper_active_uidx,
--     MATCHED / NO_HELPER_AVAILABLE writes, return shapes and grants.
--   * COMPLETED and CANCELLED history is not an exclusion reason.
--
-- No table, index or data change. Paste the whole file into the STAGING SQL editor and run once.

begin;

create or replace function public.match_and_assign_helper(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req record;
  v_helper record;
  v_assigned_helper record;
  v_assignment_id uuid := null;
  v_conv_id uuid;
  v_admin_esc_id uuid;
  v_has_registered_helpers boolean := false;
  v_sub_reason text;
  v_admin_note text;
  v_constraint_name text;
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

  -- 2. Iterate through best matching on-duty helpers with row lock (order by rating desc, completed_jobs desc)
  -- If candidate A fails due to expected concurrency collision, loop moves to candidate B
  for v_helper in
    select h.*
    from public.helpers h
    join public.helper_services hs on hs.helper_id = h.id
    join public.helper_regions hr on hr.helper_id = h.id
    where h.on_duty = true
      and h.is_active = true
      and hs.service_slug = v_req.service_slug
      and hr.country = v_req.country
      and hr.sido = v_req.sido
      and (hr.gungu = v_req.gungu or hr.gungu = '전체' or hr.gungu = '')
      and not exists (
        select 1 from public.request_assignments ra
        where ra.helper_id = h.id
          and ra.status in ('PENDING', 'NOTIFIED', 'ACCEPTED')
      )
      -- 202609260011: a helper who declined / timed out on THIS request is never re-picked for it.
      and not exists (
        select 1 from public.request_assignments previous
        where previous.request_id = v_req.id
          and previous.helper_id = h.id
          and previous.status in ('DECLINED', 'TIMEOUT')
      )
    order by h.rating desc, h.completed_jobs desc
    for update of h skip locked
  loop
    begin
      insert into public.request_assignments (
        request_id,
        helper_id,
        status
      ) values (
        v_req.id,
        v_helper.id,
        'PENDING'
      ) returning id into v_assignment_id;

      -- Assignment succeeded: record assigned helper and exit candidate loop
      v_assigned_helper := v_helper;
      exit;
    exception
      when unique_violation then
        -- Expected helper concurrency collision: helper was taken concurrently
        get stacked diagnostics v_constraint_name = constraint_name;
        if v_constraint_name = 'request_assignments_helper_active_uidx' then
          -- Expected helper active collision: continue loop to inspect next eligible candidate
          continue;
        else
          -- Unexpected unique violation (e.g. request already has active assignment, etc.): re-raise
          raise;
        end if;
    end;
  end loop;

  -- 3. If helper assigned, atomically finalize matching, conversation, and helper notification
  if v_assignment_id is not null then
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
      v_assigned_helper.id,
      v_req.customer_locale,
      v_assigned_helper.primary_locale
    ) returning id into v_conv_id;

    insert into public.app_notifications (
      recipient_type,
      recipient_id,
      type,
      title,
      body,
      payload
    ) values (
      'HELPER',
      v_assigned_helper.helper_id,
      'NEW_SERVICE_REQUEST',
      '신규 서비스 배정 요청',
      v_req.service_slug || ' 서비스 요청이 접수되었습니다.',
      jsonb_build_object('request_id', v_req.id, 'conversation_id', v_conv_id)
    );

    return jsonb_build_object(
      'success', true,
      'status', 'MATCHED',
      'helper_id', v_assigned_helper.helper_id,
      'helper_name', v_assigned_helper.name,
      'conversation_id', v_conv_id
    );
  else
    -- 4. No matching helper available: distinguish between NO_ELIGIBLE_HELPER and ALL_ELIGIBLE_HELPERS_BUSY
    select exists (
      select 1
      from public.helpers h
      join public.helper_services hs on hs.helper_id = h.id
      join public.helper_regions hr on hr.helper_id = h.id
      where h.is_active = true
        and hs.service_slug = v_req.service_slug
        and hr.country = v_req.country
        and hr.sido = v_req.sido
        and (hr.gungu = v_req.gungu or hr.gungu = '전체' or hr.gungu = '')
    ) into v_has_registered_helpers;

    if v_has_registered_helpers then
      v_sub_reason := 'ALL_ELIGIBLE_HELPERS_BUSY';
      v_admin_note := '해당 지역 및 서비스에 등록된 헬퍼가 있으나 현재 전원 다른 요청 수행 또는 비가용 상태임';
    else
      v_sub_reason := 'NO_ELIGIBLE_HELPER';
      v_admin_note := '해당 지역 및 서비스 조건의 가용 헬퍼 부재로 관리자 큐 이관';
    end if;

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
      v_admin_note
    ) returning id into v_admin_esc_id;

    insert into public.app_notifications (
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
      v_req.sido || ' ' || v_req.gungu || ' 지역 ' || v_req.service_slug || ' ' || v_admin_note,
      jsonb_build_object(
        'request_id', v_req.id,
        'escalation_id', v_admin_esc_id,
        'sub_reason', v_sub_reason
      )
    );

    return jsonb_build_object(
      'success', true,
      'status', 'NO_HELPER_AVAILABLE',
      'sub_reason', v_sub_reason,
      'escalation_id', v_admin_esc_id
    );
  end if;
end;
$$;

-- Same grants as 202609250001 (CREATE OR REPLACE keeps them; restated for a reviewable file).
revoke execute on function public.match_and_assign_helper(uuid) from public;
revoke execute on function public.match_and_assign_helper(uuid) from anon;
revoke execute on function public.match_and_assign_helper(uuid) from authenticated;
grant execute on function public.match_and_assign_helper(uuid) to service_role;

commit;

-- Rollback (review-only): re-run the match_and_assign_helper definition from
-- 202609250001_core_service_matching_schema.sql (identical except for the added filter).

-- 202609280021: admin_audit_logs becomes append-only audit evidence.
--
-- Audit finding (2026-09-28): admin_audit_logs (migration 202609120001) was writable, updatable and deletable
-- by the app role through Supabase default privileges; staging fixture cleanups deleted settlement audit rows.
-- It holds FINANCIAL_AUDIT (SERVICE_PAYMENT_PENDING / SERVICE_SETTLED / SERVICE_CLOSED), BUSINESS_AUDIT
-- (SETTLED_CLEANUP_RECONCILED / CONVERSATION_CONTENT_DELETED) and OPERATOR_AUDIT (CONVERSATION_CLEANUP_RETRY,
-- WEB_PUSH_TEST_SENT). The Migration 017 operator review audit lives in operator_review_actions (already immutable).
--
-- Now:
--   * app role: SELECT only; anon: nothing; authenticated: the existing staff-only SELECT policy.
--   * every write goes through append_admin_audit_log() (security definer): allow-listed action -> entity type,
--     the entity must exist, actor_id is never caller-chosen (always null; the server's actor_kind lives in
--     metadata and is format-checked), no secret-like metadata keys, bounded size; the one-per-request
--     settlement lifecycle actions are unique (replay instead of a duplicate); settlement evidence claims
--     (external payment / payout references, "verified") must match the ledger or the write is refused.
--   * no UPDATE / DELETE / TRUNCATE for any role (triggers apply to the owner too; an administrator can only
--     bypass them deliberately by disabling the triggers in a migration).
-- Existing rows are neither rewritten nor deleted. Test fixtures keep their audit rows (immutable history).
-- Does not modify migrations 001-020.

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Privileges + immutability
-- ---------------------------------------------------------------------------------------------
revoke all on public.admin_audit_logs from public, anon, authenticated, service_role;
grant select on public.admin_audit_logs to service_role;
grant select on public.admin_audit_logs to authenticated; -- still filtered by the "audit staff only" RLS policy

create trigger admin_audit_logs_immutable before update on public.admin_audit_logs for each row execute function public.audit_row_immutable();
create trigger admin_audit_logs_no_delete before delete on public.admin_audit_logs for each row execute function public.audit_row_immutable();
create trigger admin_audit_logs_no_truncate before truncate on public.admin_audit_logs for each statement execute function public.audit_table_no_truncate();

-- One lifecycle audit per request (staging has no duplicates; a concurrent retry replays instead).
create unique index admin_audit_logs_request_lifecycle_uidx on public.admin_audit_logs (action, entity_id)
  where action in ('SERVICE_PAYMENT_PENDING', 'SERVICE_SETTLED', 'SERVICE_CLOSED');

comment on table public.admin_audit_logs is 'RETENTION CLASS: FINANCIAL_BUSINESS_HISTORY - append-only (append_admin_audit_log); never updated or deleted.';

-- ---------------------------------------------------------------------------------------------
-- 2. The trusted append path
-- ---------------------------------------------------------------------------------------------
create or replace function public.append_admin_audit_log(p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expected_type text;
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_req public.service_requests%rowtype;
  v_intent public.payment_intents%rowtype;
  v_link public.provider_payment_links%rowtype;
  v_ob public.payout_obligations%rowtype;
  v_payment_ref text;
  v_id bigint;
  v_existing bigint;
begin
  v_expected_type := case p_action
    when 'SERVICE_PAYMENT_PENDING' then 'service_request' when 'SERVICE_SETTLED' then 'service_request' when 'SERVICE_CLOSED' then 'service_request'
    when 'SETTLED_CLEANUP_RECONCILED' then 'service_request' when 'CONVERSATION_CONTENT_DELETED' then 'service_request'
    when 'CONVERSATION_CLEANUP_RETRY' then 'system' when 'WEB_PUSH_TEST_SENT' then 'push_subscription_owner'
    else null end;
  if v_expected_type is null then return jsonb_build_object('success', false, 'code', 'ACTION_NOT_ALLOWED'); end if;
  if p_entity_type is distinct from v_expected_type then return jsonb_build_object('success', false, 'code', 'ENTITY_TYPE_MISMATCH'); end if;
  if jsonb_typeof(v_meta) <> 'object' or octet_length(v_meta::text) > 16384 then return jsonb_build_object('success', false, 'code', 'METADATA_INVALID'); end if;
  -- Audit rows never carry credentials: refuse any secret-like key anywhere in the metadata.
  if v_meta::text ~* '"[^"]*(secret|token|password|passwd|capability|signed_payload|private_key|api_key|authorization|cookie)[^"]*"\s*:' then
    return jsonb_build_object('success', false, 'code', 'SECRET_FIELD_REFUSED');
  end if;
  if v_meta ? 'actor_kind' and (jsonb_typeof(v_meta -> 'actor_kind') <> 'string' or (v_meta ->> 'actor_kind') !~ '^[A-Z][A-Z0-9_]{1,39}$') then
    return jsonb_build_object('success', false, 'code', 'ACTOR_KIND_INVALID');
  end if;

  if v_expected_type = 'system' then
    if p_entity_id is not null then return jsonb_build_object('success', false, 'code', 'ENTITY_NOT_ALLOWED'); end if;
  elsif v_expected_type = 'push_subscription_owner' then
    if p_entity_id is null or not (exists (select 1 from public.helpers where id = p_entity_id) or exists (select 1 from public.referral_identities where id = p_entity_id)) then
      return jsonb_build_object('success', false, 'code', 'ENTITY_NOT_FOUND');
    end if;
  else
    select * into v_req from public.service_requests where id = p_entity_id;
    if not found then return jsonb_build_object('success', false, 'code', 'ENTITY_NOT_FOUND'); end if;
    -- Lifecycle audits must match the request's actual state.
    if (p_action = 'SERVICE_PAYMENT_PENDING' and v_req.status::text not in ('PAYMENT_PENDING', 'SETTLED', 'CLOSED'))
       or (p_action in ('SERVICE_SETTLED', 'SETTLED_CLEANUP_RECONCILED') and v_req.status::text not in ('SETTLED', 'CLOSED'))
       or (p_action = 'SERVICE_CLOSED' and v_req.status::text <> 'CLOSED') then
      return jsonb_build_object('success', false, 'code', 'STATE_MISMATCH', 'status', v_req.status);
    end if;
    -- Settlement evidence claims must be the ledger's own references (never fabricated / borrowed).
    if p_action = 'SERVICE_SETTLED' and (coalesce((v_meta ->> 'external_payment_verified')::boolean, false)
        or v_meta ->> 'external_payment_transaction_id' is not null or v_meta ->> 'external_payout_transaction_id' is not null) then
      if v_req.funding_payment_intent_id is null then return jsonb_build_object('success', false, 'code', 'EVIDENCE_NOT_IN_LEDGER'); end if;
      select * into v_intent from public.payment_intents where id = v_req.funding_payment_intent_id;
      select * into v_ob from public.payout_obligations where request_id = v_req.id and kind = 'HELPER_SERVICE';
      if v_intent.network ~ '^provider:' then
        select * into v_link from public.provider_payment_links where payment_intent_id = v_intent.id;
        v_payment_ref := v_link.provider_payment_id;
      else
        v_payment_ref := v_intent.verified_signature;
      end if;
      if (v_meta ->> 'external_payment_transaction_id' is not null and v_meta ->> 'external_payment_transaction_id' is distinct from v_payment_ref)
         or (v_meta ->> 'external_payout_transaction_id' is not null and v_meta ->> 'external_payout_transaction_id' is distinct from v_ob.chain_signature)
         or (coalesce((v_meta ->> 'external_payment_verified')::boolean, false) and (v_payment_ref is null or v_ob.status is distinct from 'PAID' or v_ob.chain_signature is null)) then
        return jsonb_build_object('success', false, 'code', 'EVIDENCE_NOT_IN_LEDGER');
      end if;
    end if;
  end if;

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (null, p_action, p_entity_type, p_entity_id, v_meta)
  on conflict (action, entity_id) where action in ('SERVICE_PAYMENT_PENDING', 'SERVICE_SETTLED', 'SERVICE_CLOSED') do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_existing from public.admin_audit_logs where action = p_action and entity_id = p_entity_id;
    return jsonb_build_object('success', true, 'replayed', true, 'id', v_existing);
  end if;
  return jsonb_build_object('success', true, 'replayed', false, 'id', v_id);
end;
$$;

revoke all on function public.append_admin_audit_log(text, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.append_admin_audit_log(text, text, uuid, jsonb) to service_role;

commit;

-- Rollback (review-only): drop function append_admin_audit_log, the three triggers and the unique index;
-- grant insert (and only if deliberately reverting: update, delete) on public.admin_audit_logs to service_role.

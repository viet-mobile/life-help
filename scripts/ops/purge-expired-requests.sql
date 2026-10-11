-- Retention job for the Privacy Policy promise "service requests and chat are kept 1 year after completion/cancellation".
-- NOT applied automatically. Run it from the Supabase SQL editor (or psql) on a schedule you control (monthly), review the count first.
-- Cascades remove events, messages, translations, outbox rows and request sessions of each request (ON DELETE CASCADE).
-- Customers (anonymous) and helpers are untouched.

-- 1) dry run: how many requests are past retention
select count(*) as to_delete
from public.svc_requests
where status in ('COMPLETED', 'CANCELLED')
  and coalesce(completed_at, cancelled_at, updated_at) < now() - interval '1 year';

-- 2) delete (uncomment after checking the count)
-- begin;
-- delete from public.svc_requests
-- where status in ('COMPLETED', 'CANCELLED')
--   and coalesce(completed_at, cancelled_at, updated_at) < now() - interval '1 year';
-- commit;

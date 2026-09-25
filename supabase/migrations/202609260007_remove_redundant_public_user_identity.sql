-- LIFE.HELP corrective migration: remove redundant public_user identity experiment.
-- Canonical public identity remains public.referral_identities.referral_id.
-- Apply to staging only. Do not apply to production.

begin;

drop index if exists public.public_user_identities_public_user_uidx;
drop index if exists public.helpers_public_user_uidx;
drop index if exists public.service_requests_public_user_idx;

alter table public.helpers drop column if exists public_user_id;
alter table public.service_requests drop column if exists public_user_id;

drop table if exists public.public_user_identities;

commit;

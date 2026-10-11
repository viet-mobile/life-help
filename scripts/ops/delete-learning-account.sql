-- Right-to-erasure for a learning (email) account, requested by the member or the legal guardian of a child under 14.
-- Run in the Supabase SQL editor as the project owner. Replace the email below, check the user id, then run the delete.
-- Learning tables reference auth.users ON DELETE CASCADE, so deleting the auth user removes profile, progress, attempts, XP,
-- streaks, quests, achievements, sessions and entitlement history.

-- 1) find the user
select id, email, created_at, raw_user_meta_data->'legal_consent' as consent
from auth.users
where lower(email) = lower('member@example.com');

-- 2) delete (use the id from step 1)
-- delete from auth.users where id = '00000000-0000-0000-0000-000000000000';

-- 3) record the request and the date in your privacy-request log (who asked, when, what was done) - keep no personal data in the log.

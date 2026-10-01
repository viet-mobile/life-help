# Staging runbook (workers.dev + real staging Supabase)

Nothing here touches production: no `life.help` DNS/Route/Custom Domain, no production Supabase, no production secrets.

## A. Staging Supabase (owner action)
1. Create a **new** Supabase project (name e.g. `life-help-staging`). Note its project ref `<ref>`.
2. Auth → Providers → Email: enable email+password. For test accounts, either disable "Confirm email" on staging or create users with the script below.
3. Auth → URL Configuration: Site URL = `https://life-help-staging.<account>.workers.dev`; Redirect URLs add `https://life-help-staging.<account>.workers.dev/study/**`.
4. Apply migrations (from a clean checkout of this branch):
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>          # staging ref only
   npx supabase db push                            # applies ALL migrations in order
   psql "<staging DB url>" -v ON_ERROR_STOP=1 -c "set app.allow_demo_seed='on'" -f supabase/seed/learn_demo.sql   # one session; see script header
   ```
5. Create two confirmed test students:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=<staging sb_secret_... key> \
   EXPECTED_SUPABASE_REF=<ref> PRODUCTION_SUPABASE_REF=<prod ref> STAGING_TEST_PASSWORD='<12+ chars>' node scripts/learn/create-staging-users.mjs
   ```

## B. Deploy the staging Worker
Option 1 (local): `npx wrangler login`, then with staging values exported
`NEXT_PUBLIC_SUPABASE_URL=https://wreebowcbiymodswajwe.supabase.co`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...` → `npm run deploy:staging`.
Option 2 (GitHub): Environment `staging` with secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and variable `STAGING_SUPABASE_PUBLISHABLE_KEY` (URL defaults to the staging project); run workflow **Deploy to STAGING (manual)**.
Then set Worker secrets/vars on the **staging** Worker only:
```bash
npx wrangler secret put SUPABASE_SECRET_KEY --env staging
# after the seed is loaded: set "LEARN_CONTENT_SOURCE": "supabase" under env.staging.vars in wrangler.jsonc and redeploy (it is a plain var, not a secret)
```
Open `https://life-help-staging.<account>.workers.dev/study`.

## C. Validate against the real stack
```bash
STAGING_URL=https://life-help-staging.<account>.workers.dev STAGING_TEST_PASSWORD=... \
STAGING_SUPABASE_URL=https://<ref>.supabase.co STAGING_SUPABASE_PUBLISHABLE_KEY=<staging publishable key (sb_publishable_...)> npm run test:staging
```
Covers: login, lesson persistence, reload, logout→login, math+english tracks, student A/B isolation, direct PostgREST RLS attempts,
forged state/userId, replay and XP farming, completion without solving, answer leakage.

## D. Manual checklist
Sign-up e-mail flow, mobile layout, the existing LIFE.HELP hosts on the *production* Worker remain untouched.

# Learning platform (math.life.help / english.life.help) on the LIFE.HELP codebase

The learning platform is an additive feature on top of the existing LIFE.HELP marketplace code and database.
It is NOT a separate project and has no database of its own.

## Database

- `supabase/migrations/202609300024_learning_platform.sql` and `202609300025_learning_content_rpc.sql` come
  AFTER `202609290023`. They create only `learn_*` objects and depend on `auth.users`, `public.app_role`,
  `public.user_roles` and `security.has_role` from `202609120001`.
- The initial marketplace migrations (`202609120001`, `202609120002`) are never re-run or re-added. Applied
  migrations are never edited.
- Authority: student progress / XP ledger / attempts / mastery are written only by `SECURITY DEFINER` RPCs
  (`learn_commit_events`, called with the server key); the app role has SELECT only on those tables, students can
  only SELECT their own rows. Content (incl. answer keys) is staff-only; the server reads it through
  `learn_load_content` (service role only). Rollback: `supabase/rollbacks/202609300024_learning_platform.down.sql`
  (manual, destructive, never run by tooling).
- Migrations are NOT applied by this integration. Applying 024/025 to the LIFE.HELP staging project
  (`wreebowcbiymodswajwe`) is a separate step that needs explicit approval and the same live-verification gate
  as migrations 016-023 (`scripts/test_*_migration_staging.mjs` style).

## Environments

- Staging Worker = `wrangler.staging.jsonc` (`life-help-staging`); it sets `APP_ENV=staging` and
  `EXPECTED_SUPABASE_REF`. Without `APP_ENV`, a production build treats `/study/*` on non-learn hosts as 404.
- Supabase keys: publishable = `SUPABASE_PUBLISHABLE_KEY` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ->
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`; secret = `SUPABASE_SECRET_KEY` -> `SUPABASE_SERVICE_ROLE_KEY`
  (`lib/supabase/keys.ts`). Existing LIFE.HELP code keeps using `SUPABASE_SERVICE_ROLE_KEY` unchanged.
- The demo seed (`npm run seed:learn:generate` -> `supabase/seed/learn_demo.sql`) is for local/PGlite only and
  refuses to run without `set app.allow_demo_seed = 'on'`. Do not run it on shared staging or production.

## Checks (all local)

`npm run typecheck`, `npm run lint:learn`, `npm run test:learn` (vitest, real migration chain on PGlite, incl. a
proxy regression test against a snapshot of main's `proxy.ts`), `npm test` (main suites + learn), `npm run build:next`,
`npm run test:e2e` (needs a build).

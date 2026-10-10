# Integrated staging validation (service core + 47-locale learning)

One command validates the **integrated tree** on the staging project / Worker once the operator has supplied the local env file and the
Worker secrets: `npm run staging:integrated` (`-- --plan` lists the steps and touches nothing).

## What the operator supplies

1. **Local file** `./.env.staging.local` (this repo directory; gitignored). Template with variable *names only*: `.env.staging.local.example`.
   Check without printing values: `npm run staging:preflight` (SET / MISSING, derived project ref, production excluded YES/NO).
   - `SERVICE_CORE_*` (5) feed the service-core harness; `TEST_SUPABASE_*` (3) feed the learning suites and fixtures; the two
     `TEST_LIFE_HELP_SYS_ADMIN_*` sign the admin into the staging Worker in the browser journey. When both contracts point at the same staging
     project, supply equivalent credentials under both names (nothing was renamed or merged).
   - Staging project ref `wreebowcbiymodswajwe`. The production ref `wstdbymmkrqgtsibhcjz` is refused anywhere it appears in a value.
2. **Worker secrets** (never in files): `npx wrangler secret put <NAME> --config wrangler.staging.jsonc` for
   `SERVICE_CORE_SUPABASE_SECRET_KEY`, `LIFE_HELP_SYS_ADMIN_ID`, `LIFE_HELP_SYS_ADMIN_PASSWORD`, `LIFE_HELP_SYS_SESSION_SECRET`
   (and verify `LEARN_SUPABASE_PUBLISHABLE_KEY`, `LEARN_SUPABASE_SECRET_KEY` are installed). Non-secret vars are already in
   `wrangler.staging.jsonc`. Full classification: `WORKER_BINDINGS` in `scripts/staging/contract.cjs`.
3. **Migrations** on the staging project: 028, 029, 040, 041, 042 (the runner audits read-only and reports `MIGRATIONS_PENDING`; it never
   applies anything). Apply only the pending files, as `docs/LEARNING_RELEASE.md` describes (a temporary workdir that holds just them).
4. **Worker version** running the integrated build. Staging deploys from a local worktree, **no git push is involved**:
   `NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npx opennextjs-cloudflare build && npx wrangler deploy --config wrangler.staging.jsonc`
   (Worker `life-help-staging`, https://life-help-staging.simpl2eye.workers.dev). Wrangler authentication is checked just before deploying.

## What the run does (in order)

preflight → target guard → migration audit + DB gate → service-core harness (20 true concurrent connections, admin-vs-accept, cancel-vs-accept,
START/COMPLETE replay ×20, message idempotency, outbox exactness, link expiry/revocation/rotation/revoke-all, negative authorization) →
customer/helper/admin browser journey → main 47-locale smoke + country defaults → learning suite (pickers = registry, switching,
target-language rules, overlay assets) → entitlement gates → run-scoped cleanup + residue → post-smoke.

- Missing env ⇒ `BLOCKED_MISSING_ENV` (exit 3, not a failure). Identity problem ⇒ `REFUSED` (2). Pending migrations ⇒
  `BLOCKED_MIGRATIONS_PENDING` (4). A failed hard gate stops the later gates but cleanup always runs.
- Every fixture carries the run's `STAGING_RUN_ID`; cleanup removes only those rows and checks `CURRENT_RUN_RESIDUE = 0` and that foreign row
  counts equal the baseline recorded before the run.

## Local dry run (spec logic only, not staging evidence)

`playwright.staging-dryrun.config.ts` serves a local build (staging path mode, embedded service-core database) and the specs accept it only with
`STAGING_DRYRUN=1` and an `http://localhost:<port>` target. The entitlement spec needs the real staging project and is excluded.

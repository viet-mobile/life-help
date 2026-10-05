# Production release plan: Learning V3 (prepared 2026-10-05; PLANNING ONLY, NOTHING HERE HAS BEEN EXECUTED)

Owner of every task from here on: Claude (no external bulk agent exists any more). Production is frozen until an explicit written GO. Commands are split into **[READ-ONLY]** and **[PRODUCTION MUTATION: DO NOT RUN WITHOUT EXPLICIT PRODUCTION GO]**.

## 0. Verdict: BLOCKED pending three operator decisions
The staging gate is YES, but the staging-validated artifact is not the same *kind* of release that production currently runs, and one planned step does not apply to the production database. Nothing is wrong with the candidate; the production release scope has to be chosen first.

| # | finding | evidence | decision needed |
|---|---|---|---|
| B1 | **Lineage / scope.** Production runs the learning-only lineage (live `6e68ec3d` (learning-only release lineage); canary `25747a2a` = `c4b03fe`, 7 API routes). The staged artifact `2b80230` also carries the whole marketplace / payment / provider / push app (about 50 more route files, 91 marketplace-side app/lib files, 23 marketplace migrations versus `c4b03fe`). The brief says "no new payment/provider route" and "learning-only"; the staged build has 90 routes including checkouts, payments, provider webhook, helper payouts, devnet airdrop, rewards. | `git diff --name-status c4b03fe 2b80230` classified in section 4 (about 50 added route files) | Path A (recommended, learning-only port) or Path B (ship the full app with marketplace inert) |
| B2 | **Migration 028 does not apply to the production database as recorded.** Production Supabase `wstdbymmkrqgtsibhcjz` holds the learning chain 023-027 only: 25 `learn_*` tables, **no marketplace tables** (recorded 2026-10-05). 028 alters `public.service_requests`, `helper_services`, `service_subitems`, which do not exist there; it would fail. A plain `supabase db push --linked` from this repository would also try to apply the 23 marketplace migrations to production, which must never happen (design decision of 2026-10-01). | `supabase/migrations/202610050028_aircon_service.sql`; memory `production-rollout-state-2026-10-05`; `docs/LEARNING_INTEGRATION.md` (push only from a temporary workdir with the learning files) | Confirm by a read-only catalog query (section 6.1) that the tables are absent; then record `MIGRATION_028_PRODUCTION = NOT_APPLICABLE` unless the marketplace schema is deliberately adopted |
| B3 | **Build path.** The learning-only lineage builds with plain `opennextjs-cloudflare build` and runtime `LEARN_*` secrets so marketplace code stays inert. `npm run build:production` of this branch requires a production *generic* `NEXT_PUBLIC_SUPABASE_URL`, which would activate marketplace client code against a database that has no marketplace tables. | `scripts/lib/envGuard.mjs` (`resolveBuildEnv` production target); memory `learning-prod-release-design` | Choose the production build path with Path A / B |

A read-only production DB query to verify B2 was attempted and **denied by the session's permission classifier**; it was not retried or worked around. (An earlier, identical single-statement SELECT call returned no output that I could use; whether it reached the database is not confirmed. If it did, it was one read-only SELECT of catalog counts and wrote nothing.) B2 therefore rests on the recorded 2026-10-05 production state and must be confirmed by the operator before the plan is executed.

### Paths
* **Path A (recommended; matches the 2026-10-01 learning-only decision):** cut `release/learning-v3-prod` from `release/learning-prod-final` (`c4b03fe`) and port only: Study card + `lib/home/*` + `components/customer/StudyChooser.tsx`, Aircon card / service page / request checklist / `lib/services` entry (UI and copy only, as for the other ten services), merged `messages/*.json` (21 keys x 35 locales), learner-runtime changes since `c4b03fe` that you want live (penguin avatar, Enter-to-continue, ten-level ladder if included), corrected learning translation catalogs (data only; runtime stays ko / vi). Exclude every marketplace / payment / provider / push route and migration. This produces a **new artifact**: it needs its own build, compiled production guard, staging deployment of that exact artifact (learning-only staging config) and the same E2E before production. No database migration is needed.
* **Path B:** ship `feature/learning-v3-core` to production. Needs a per-route audit that all 51 added route files fail closed in the production environment (no Supabase generic credentials, `LIFE_HELP_PAYMENT_MODE` unset, staging-only routes return `STAGING_ONLY`), a guarded production build without activating marketplace paths, and a decision on the DB (028 still not applicable). Higher risk; not recommended.

Everything below is written for Path A, with the Path B differences marked.

## 1. Release identity
* Release record HEAD `10c4479` (`feature/learning-v3-core`, pushed, tree clean). Application source of the staged artifact `2b80230`. `RELEASE_HEAD = 10c4479`, `STAGING_APPLICATION_ARTIFACT_SOURCE = 2b80230` (not the same thing).
* Mechanical check: `git diff --name-status 2b80230 10c4479` = `A docs/learning/staging-run-2026-10-05.md`, `M scripts/test_pricing_migration_staging.mjs`, `A tests/staging/main-services.staging.spec.ts` (plus the docs commit that adds this plan after `10c4479`). **ARTIFACT_EQUIVALENCE = YES** for the Path B artifact. For Path A there is no equivalence: it is a different artifact.

## 2. Staging evidence (authoritative: `docs/learning/staging-run-2026-10-05.md`, `final-staging-prep.md`)
Staging gate YES; final uninterrupted staging E2E 74/74, 0 failed, 0 not run, retries 0, about 9.3 min; compiled guard PASS (production refs 0 in browser and server output); DB gate PASS_WITH_ENVIRONMENTAL_WAIVER (1 waived test, 0 DB failures, 0 business-invariant failures); migration 028 applied to staging only with preflight, rollback dry-run and post-apply verification; Worker `life-help-staging` `a7333a6c-13d2-4acf-b73c-0b3305c88c8a`. Staging validated the Path B artifact. It does not by itself validate a Path A artifact.

## 3. Production baseline (read-only verified 2026-10-05)
`wrangler deployments list --name life-help`: latest deployment = `6e68ec3d-55ca-4249-9b87-3d1d72e46e93` at 100 % ("learning logo + worker-first favicon", 2026-10-02) and `25747a2a-cb88-4d53-a467-4cbd8187aadd` at 0 % ("learning-only c4b03fe secondary-curriculum", 2026-10-04). Both remain deployable. **Rollback target: `6e68ec3d`.** The canary is reachable only with `Cloudflare-Workers-Version-Overrides: life-help="<version-id>"` and only while that version is part of the current deployment. Do not repurpose or delete `25747a2a`. If the state differs at execution time: change nothing and record a blocker.
Production Supabase (recorded): migrations 023-027, 25 `learn_*` tables, no marketplace tables, one pre-existing Auth user, SMTP validated.

## 4. Release diff / scope (classification script over `git diff --name-status`)
Relative to `main` (`1eadaa1`, 85 commits, 527 files at `2b80230`): school learning 133, learning i18n 7, main-service i18n messages 110, Study card 3, migration 028 1, Adult Study foundation 9, non-launched bank / certification / scholarship / transparency foundation 12, test / docs / data 206, learning migrations 6, other 36 (config, layout, manifest), marketplace app files touched 4. Relative to the production learning lineage `c4b03fe` (572 files): school learning 7, learning i18n 5, messages 111, Study card 3, 028 1, Adult Study foundation 9, bank etc. foundation 12, test / docs / data 253, **marketplace migrations 23 and marketplace / payment / provider / push app code 91 (unexpected for production)**, other 57. Class H = unexpected scope: **YES** for the Path B artifact (see B1); **NO** for Path A once the marketplace files are excluded.

## 5. Production scope freeze
Include: school learning E1-H3 and current engine, ko / vi learner runtime, corrected translation catalogs (data), Study card, Aircon (UI/copy), merged main-service copy in 38 locales, existing auth / progress / XP / mastery. Exclude: Adult Study content launch, legacy corpus migration, learner runtime activation of 38 locales, fitted rubric mapping, new calibration, question-bank runtime activation, payment/provider redesign, blockchain.
`TRANSLATION_PACKAGE_38_LOCALE_READY = YES`; `MAIN_SERVICE_38_LOCALE_LIVE_CAPABILITY = YES`; `LEARNER_RUNTIME_38_LOCALE_ENABLED = NO`; `LEARNER_RUNTIME_ACTIVE_LOCALES = ko, vi`. Never describe the school learner runtime as 38-language capable. `BANK_STRESS = PASS`; generated bank items PROVISIONAL; the bank is not wired into the runtime; duplicate diversity FOLLOWUP. `53b1fb3 = REJECTED`; `FIT_MAPPING_STATUS = DEFERRED`.

## 6. Migration 028 production procedure
### 6.1 Applicability check [READ-ONLY, operator, production project; the assistant was denied this read]
Run once, against production only, after confirming the project ref (section 7):
`select (select count(*) from information_schema.tables where table_schema='public' and table_name='service_requests') as sr, (select count(*) from information_schema.tables where table_schema='public' and table_name='service_subitems') as ss, (select count(*) from information_schema.tables where table_schema='public' and table_name like 'learn\_%') as learn;`
Expected per the record: `sr = 0`, `ss = 0`, `learn = 25`. If `sr = 0`: **028 is NOT APPLICABLE; stop this section.** Do not run `supabase db push` from the repository root against production under any circumstances (it would apply 23 marketplace migrations). If `sr > 0` (marketplace schema was adopted since): continue below.
### 6.2 Preconditions if applicable (all required, else ABORT)
CLI pinned to the version used on staging (`2.119.0`); linked explicitly to `wstdbymmkrqgtsibhcjz`; operator confirms the ref twice; `migration list --linked` inspected; only `202610050028` pending; no remote / local divergence; production preflight shows the three CHECKs with exactly the ten pre-aircon slugs, 19 sub-items, zero aircon rows in `service_requests` and `helper_services`; rollback prepared. Push only from a temporary workdir that holds exactly the reviewed pending file(s).
### 6.3 Sequence [each mutating step: DO NOT RUN WITHOUT EXPLICIT PRODUCTION GO]
1. [READ-ONLY] `migration list --linked`; `db push --linked --dry-run` (must list only 028).
2. [READ-ONLY] preflight SQL (`final-staging-prep.md` section 4 / the staging `preflight.sql`: CHECK definitions, sub-item counts, aircon rows).
3. Transactional rollback dry-run (`begin; <028 body without begin/commit>; <state query>; rollback;`) then re-run step 2 and the schema fingerprint: must be identical to before. (A `db query` that writes inside a rolled-back transaction is a production write attempt: needs the GO.)
4. [READ-ONLY] repeat step 1.
5. **[PRODUCTION MUTATION]** `supabase db push --linked` (no `--include-all`, no `--include-seed`).
6. [READ-ONLY] `migration list --linked` (028 recorded), `db push --linked --dry-run` ("up to date"), post-apply SQL: three CHECKs at 11 slugs, three aircon sub-items (`aircon-install`, `aircon-repair`, `aircon-cleaning`), non-aircon sub-items unchanged, schema fingerprint of everything else unchanged.

## 7. Project-ref safety gates (anti wrong-project)
The same Supabase login sees staging and production. Before **every** production DB command, and again immediately before any mutation:
```
REF=$(cat supabase/.temp/project-ref)
[ "$REF" = "wstdbymmkrqgtsibhcjz" ] && echo "PRODUCTION_REF_MATCH = YES" || echo "PRODUCTION_REF_MATCH = NO"
[ "$REF" = "wreebowcbiymodswajwe" ] && echo "STAGING_REF_MATCH = YES" || echo "STAGING_REF_MATCH = NO"
```
Require `PRODUCTION_REF_MATCH = YES` and `STAGING_REF_MATCH = NO`; otherwise stop. Production `.env` values are never copied into a staging worktree and vice versa. No credential is printed.

## 8. Build and compiled guard (production)
* Application source equivalence is not environment equivalence: a staging-configured artifact is never deployed to production. Production needs a fresh build with production-only bindings.
* Path A (learning-only lineage): build from the clean `release/learning-v3-prod` worktree with `npm ci` and the lineage's build (`opennextjs-cloudflare build`), no generic Supabase variables, no staging Worker vars. Then scan the output: staging Supabase ref `wreebowcbiymodswajwe` = 0, staging Worker host = 0, staging-only payment vars = 0; route inventory equals the approved list; `node scripts/learn/check-no-secrets.mjs`; secret patterns (`sb_secret`, `eyJ`, `AKIA`, `-----BEGIN`) over the diff and the output. When the lineage lacks `verify-build.mjs`, port it with `scripts/lib/envGuard.mjs` as part of Path A so the production-target compiled guard exists: `node scripts/verify-build.mjs --target=production` must show staging references 0 and no unexpected provider / payment changes.
* Path B: `npm run build:production` requires production generic Supabase values (see B3); do not run it until B3 is decided.

## 9. Release ordering: DB first or Worker first
Path A: no DB step (028 not applicable), so Worker only. If the marketplace schema exists (Path B variant): *old Worker + new DB* is compatible (028 only broadens CHECKs and adds catalogue rows; the old code never writes `aircon`); *new Worker + old DB* is incompatible only for the `aircon` slug (a CHECK violation on insert, other slugs unaffected). Therefore DB first, then the Worker canary; evidence: `202610050028_aircon_service.sql` (drop and re-add the three CHECKs with one more slug, three `on conflict do nothing` inserts), staging DB gate, `docs/learning/migration-028-review.md`.

## 10. Zero-traffic (0 %) canary
No numeric traffic schedule is defined by LIFE.HELP policy: **CANARY_PERCENTAGE_SCHEDULE = OPERATOR_DECISION.** Options to choose from: (a) 0 % -> header-only smoke -> 100 % after a defined soak; (b) 0 % -> a small percentage -> larger steps with a soak and the stop conditions below between steps (the 2026-10-04 history shows a 25 % gradual step was used once). Nothing is chosen here.
Stages: 0 upload only (no traffic); 1 header-only smoke; 2 small canary only after an explicit GO; 3 incremental increases; 4 full promotion.
* Commands (Worker name `life-help`; the percentages are examples to be replaced by the operator decision):
  * [READ-ONLY] `npx wrangler deployments list --name life-help` ; `npx wrangler versions list --name life-help`
  * **[PRODUCTION MUTATION: DO NOT RUN WITHOUT EXPLICIT PRODUCTION GO]** upload: `npx wrangler versions upload --name life-help --message "learning-v3 <git sha>" --tag <sha>`
  * **[...]** secrets on the NEW version only (`LEARN_SUPABASE_URL`, `EXPECTED_LEARN_SUPABASE_REF`, `LEARN_SUPABASE_PUBLISHABLE_KEY`, `LEARN_SUPABASE_SECRET_KEY`): `npx wrangler versions secret put <NAME> --name life-help` (the CLI masks secret values unless `--reveal` is passed: a masked value was installed once by mistake; verify the bindings of the new version before deploying)
  * **[...]** 0 % deployment: `npx wrangler versions deploy 6e68ec3d-55ca-4249-9b87-3d1d72e46e93@100 <NEW_VERSION_ID>@0 --name life-help --message "learning-v3 candidate at 0%"`
  * **[...]** header smoke (no user traffic): requests with `Cloudflare-Workers-Version-Overrides: life-help="<NEW_VERSION_ID>"`
  * **[...]** step: `npx wrangler versions deploy 6e68ec3d-55ca-4249-9b87-3d1d72e46e93@<100-X> <NEW_VERSION_ID>@<X> --name life-help`
  * **[...]** full promotion: `npx wrangler versions deploy <NEW_VERSION_ID>@100 --name life-help`

## 11. 0 % canary validation (header-only, read-only)
Main page (ko / en / de / zh / ar: Study card before Jobs; Mobile, Aircon, Boiler order), Study chooser (keyboard, Escape, focus return, destinations `https://math.life.help` and `https://english.life.help`, never a staging host), math and english hosts, learning API route guards (ordinary hosts 404 on `/study` and `/api/learn`), auth routing, provider webhook behaviour, no adult-study route (`/adult`, `/study/korean` = 404), no new payment / provider routes, route inventory equal to the approved list.

## 12. Production functional smoke (only after an explicit GO; minimal footprint)
Math and English with a controlled test account (E1, E6, M2, H3 in ko / vi); XP ledger equals browser XP; refresh, sign-out / sign-in persistence; Study card; Aircon: service page, request page with install / repair / cleaning / access options, no catalogue price, Helper price is the source of truth. **Aircon request creation applies only if the marketplace schema exists in production (B2);** otherwise the request path must fail closed exactly as for the other ten services and that is the expected result. Auth: only if needed for end-to-end verification, never with a disposable inbox as the sole gate; no SMTP / Auth reconfiguration.

## 13. Promotion decision points
Promote a step only if: error rate and learning writes are normal; server scoring and XP equal browser values; no DB constraint errors; Aircon requests behave as specified in section 12; no staging reference, no unexpected provider / payment traffic; host guard PASS. The operator decides the step sizes (section 10).

## 14. Rollback
* **Worker rollback (first resort):** [PRODUCTION MUTATION, requires a GO to rollback] `npx wrangler versions deploy 6e68ec3d-55ca-4249-9b87-3d1d72e46e93@100 --name life-help --message "rollback to known good"`; confirm `wrangler deployments list` shows `6e68ec3d` at 100 %; verify known-good endpoints (main page, math / english hosts, `/study` 404 on ordinary hosts); keep the candidate at 0 %.
* **Does a Worker rollback require a DB rollback? No**, if 028 is backward compatible with the old Worker (it is: it only broadens CHECKs and adds catalogue rows). Prefer Worker rollback only.
* **DB rollback decision tree (last resort, only if 028 was applied):** roll back the DB only if the migration itself causes a confirmed problem (an integrity or security issue, or an incompatibility). Conceptual order: (1) confirm no production `aircon` rows exist in `service_requests` / `helper_services` / selections that the narrower CHECK would reject, and decide what to do with any that do; (2) remove the three `aircon` sub-items only if rollback is required; (3) re-create the three CHECKs with the original ten slugs (`service_requests_service_slug_check`, `helper_services_service_slug_check`, `service_subitems_service_code_check`); (4) verify the original ten-service catalogue and the schema fingerprint; (5) repair migration history only with explicit operator approval. No destructive rollback SQL is written here beyond what `migration-028-review.md` derives from the reviewed file; none is executed.

## 15. Observability and stop conditions
Watch: Worker errors and exception rate, auth errors, learning API errors, XP / mastery write failures, server scoring mismatches, service request errors, Aircon slug validation errors, DB constraint errors, notification / send failures, provider webhook anomalies. **Hard stop and roll back on:** auth failure increase, learning state write failure, server scoring mismatch, DB constraint errors, Aircon request failure (when applicable), unexpected payment / provider traffic, host guard failure, any secret or staging reference exposure, migration integrity issue, abnormal Worker exception rate. The web-push browser-display waiver alone is not a trigger unless evidence of a release regression appears.

## 16. Cleanup (for a future smoke)
Remove: the Auth test user (cascades `learn_*` rows), any `learn_*` rows left, service requests and Helper / service rows (only if the marketplace schema exists), media objects, notifications, push subscriptions. Verify counts equal the recorded baseline (Auth users 1, `learn_*` rows 0 per the 2026-10-05 record) before and after.

## 17. Web-push waiver and follow-up (staging, scoped)
Exactly one waived assertion: "REAL Web Push: rematched Helper's browser displays the assignment (Chrome/FCM)". `WEB_PUSH_BROWSER_DISPLAY = WAIVED_ENVIRONMENTAL`; `WEB_PUSH_DELIVERY_ACCEPTANCE = OBSERVED_SUCCESS`; `WEB_PUSH_PRODUCT_REGRESSION = NOT ESTABLISHED`. Follow-up: run it in a headed Chrome with real OS notifications. The waiver is not widened to any other push, notification, DB, business, authority or security assertion. (Under Path A the push code is not in the production artifact at all.)

## 18. Branch strategy and machine readiness
* Do not merge to `main` now. Order: decide the production path -> build and validate the production candidate -> explicit operator GO for production -> only then decide how `main` gets the learning-only lineage (`main` already contains the marketplace app; the learning-only release lineage has its own history), following existing repository policy.
* macOS or another machine: `git fetch origin && git checkout feature/learning-v3-core && git rev-parse --short HEAD` (expect the record head `10c4479` or its docs descendant); `npm ci` (never copy Windows `node_modules` or `.next`); `npx playwright install chromium` if browser tests are needed; restore production environment locally from the secret store (never commit, never copy another worktree's env); pin the Supabase CLI to `2.119.0` (`npx --yes supabase@2.119.0 ...`); `npx wrangler login` / `whoami` for Cloudflare credentials. Do not assume the Windows `--webpack` workaround on macOS.

## 19. What would turn BLOCKED into READY
1. You choose Path A or Path B.
2. The B2 read-only catalog query (6.1) is run by the operator and recorded.
3. For Path A: the learning-only port branch exists, builds, passes the production-target compiled guard locally and passes the staging E2E as a learning-only artifact; then the production steps above need your explicit GO.

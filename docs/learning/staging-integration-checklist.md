# Staging integration checklist (prepared, NOT executed)

See `final-staging-prep.md` for the frozen scope, the migration 028 staging procedure, the compiled-guard prerequisites, the bulk acceptance checklist and the Mac transfer steps.

Nothing here deploys anything. It is the list used AFTER the bulk phase 2 outputs are reviewed. Production stays frozen (live `6e68ec3d` at 100 %, canary `25747a2a` unpromoted); staging only, never production.

## A. Gates that must be true before staging (each one has an owner and evidence)
| # | gate | evidence | state now |
|---|---|---|---|
| 1 | learning 38-locale package reviewed and merged | `lib/learn/i18n/generated/*.json` + `reports/generated/i18n-qa.md` reviewed; accepted only if `node --no-warnings scripts/learn/i18n/verify-generated-locales.mjs --dir <dir>` exits 0 | **OPEN**: Phase-2 package REJECTED (70 verifier problems; 27 locales in the wrong language, family-template copies); re-delivery required. Not a blocker for school-learning staging (the learning app serves ko/vi) |
| 2 | bank stress reviewed | harness accepted (`63e10db`); Hangul leak fixed (`1307bb5`), rerun committed (`48316e6`: 5000 items, 0 throws, 0 determinism mismatches, hangulInEnglishTarget 0); 499 exact fingerprint duplicates across seeds in the backlog; the bank is NOT called clean | **PASS_WITH_FOLLOWUP**: `BANK_STRESS_RERUN_REQUIRED = YES` on the new core SHA, by Antigravity |
| 3 | rubric / mapping decision | candidate `53b1fb3` REJECTED as circular (features assigned from the empirical level); `FIT_MAPPING_STATUS = DEFERRED`; generated items stay PROVISIONAL | DEFERRED (not a blocker) |
| 4 | Study card | home order + chooser tests green (`tests/home`, `tests/e2e/home-cards.spec.ts`) | DONE |
| 5 | Aircon service | UI + request checklist + `202610050028` migration tested on the real chain (PGlite) | DONE locally; applying the migration to staging is part of this checklist (C) |
| 6 | `MAIN_SERVICE_I18N_READY` | `docs/learning/main-service-i18n.md` = messages (test) | YES |
| 7 | main-service translation package reviewed | `messages/generated/main-services/<locale>.json` for 35 locales merged by `merge-main-service-i18n.mjs`, `--check` clean, ordering matrix green | **OPEN**: historical package (`4185537`) passes the core verifier and a merge dry run, but the final regenerated package from `e621a12` is awaited (`verify-main-service-locales.mjs`); English fallback applies meanwhile (not a blocker for ko/en/vi staging) |
| 8 | adult study stays isolated | no adult-study route, host or code path in the staging build; importer refuses all six legacy products; rights gate (`adult-study-rights-policy.md`) | YES |
| 9 | no marketplace / payment / provider route leak | route inventory and production guard (section B) | re-run at staging time |
| 10 | gates on the integration branch | `git diff --check`, `npm run typecheck`, `npx vitest run`, local Playwright (full), `npm test` deterministic suites, secret scan | re-run at staging time |

## B. Route and guard checks (run on the exact build that will be deployed)
1. Route inventory: list every route of the build; there is NO `/study*` route on ordinary hosts in production mode, no adult-study route anywhere, and the only new main route is the existing `/services/aircon` (static param from `lib/services`).
2. Production guard (`scripts/test_environment_isolation_static.mjs`, `npm test` suites) green; compiled guard on the built output (`scripts/verify-build.mjs --target=staging`), confirming the staging build refuses production credentials and hosts. **Compiled guard: OPEN.** It requires real STAGING Supabase configuration in the build output (`.env.staging.local`, git-ignored); fixture values would need a fake staging project, and production env files are never copied. Run it on the machine that holds the staging file; until then the production-ref scan of the output is informational only.
3. `node scripts/learn/check-no-secrets.mjs` (client bundle) and the secret scan patterns (`sb_secret`, `eyJ`, `AKIA`, `-----BEGIN`) over the diff.
4. Study destinations on staging resolve to `math-staging.life.help` / `english-staging.life.help` (`lib/home/studyHosts.ts`), never to production hosts.

## C. Order of work at staging time (each step needs its own explicit go; none is done by preparing this list)
1. Merge reviewed bulk commits (cherry-pick, not blind merge); regenerate generated files with their `--check` scripts.
2. Apply `202610050028_aircon_service.sql` (reviewed: `migration-028-review.md`; broadens three CHECKs, adds three sub-items, no payment/provider change; rollback documented) to STAGING only (after `npm test` DB suites pass locally); run `scripts/test_pricing_migration_staging.mjs` (catalogue now lists aircon) and the staging request-flow suites for the new slug.
3. Build the staging Worker from the integration commit; no production secret on it; version upload, not deploy to production.
4. One uninterrupted staging run, retries 0, FAIL 0, NOT RUN 0: learning (mascot, Enter, ko, vi, a representative all-locale smoke, E1 / E6 / M2 / H3, auth, XP / mastery, persistence), main (Study card, chooser, Aircon, ordering, 38 languages, responsive), and the existing marketplace staging suites.
5. Cleanup of every fixture; evidence recorded (Worker version id, DB gate, durations).
6. STOP. Production release preparation is a separate decision.

## D. Not part of staging (must stay out)
Adult-study hosts, any legacy content import, certification / scholarship / ledger runtime, payment providers, chain anchoring, production DNS, production migrations, `main` merge.

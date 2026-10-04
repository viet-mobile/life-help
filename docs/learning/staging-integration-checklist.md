# Staging integration checklist (prepared, NOT executed)

Nothing here deploys anything. It is the list used AFTER the bulk phase 2 outputs are reviewed. Production stays frozen (live `6e68ec3d` at 100 %, canary `25747a2a` unpromoted); staging only, never production.

## A. Gates that must be true before staging (each one has an owner and evidence)
| # | gate | evidence | state now |
|---|---|---|---|
| 1 | learning 38-locale package reviewed and merged | `lib/learn/i18n/generated/*.json` + `reports/generated/i18n-qa.md` reviewed (representative strings), parity with `en.ts` (301 keys) | WAITING (bulk phase 2) |
| 2 | bank stress reviewed | `reports/generated/bank-stress-*.json`: every counter explained, `bankApiVersion = bank-api-1` | WAITING (bulk phase 2) |
| 3 | rubric / mapping decision | `mapping-decision.json` ACCEPTED for an exact fit, or an explicit DEFERRED note; generated items stay PROVISIONAL either way | DEFERRED until >= 40 items are coded |
| 4 | Study card | home order + chooser tests green (`tests/home`, `tests/e2e/home-cards.spec.ts`) | DONE |
| 5 | Aircon service | UI + request checklist + `202610050028` migration tested on the real chain (PGlite) | DONE locally; applying the migration to staging is part of this checklist (C) |
| 6 | `MAIN_SERVICE_I18N_READY` | `docs/learning/main-service-i18n.md` = messages (test) | YES |
| 7 | main-service translation package reviewed | `messages/generated/main-services/<locale>.json` for 35 locales merged by `merge-main-service-i18n.mjs`, `--check` clean, ordering matrix green | WAITING (bulk package 4) |
| 8 | adult study stays isolated | no adult-study route, host or code path reachable in the staging build; the importer refuses all six legacy products (rights UNCLEARED) | YES (isolated by construction) |
| 9 | no marketplace / payment / provider route leak | route inventory and production guard (section B) | re-run at staging time |
| 10 | gates on the integration branch | `git diff --check`, `npm run typecheck`, `npx vitest run`, local Playwright (full), `npm test` deterministic suites, secret scan | re-run at staging time |

## B. Route and guard checks (run on the exact build that will be deployed)
1. Route inventory: list every route of the build; there is NO `/study*` route on ordinary hosts in production mode, no adult-study route anywhere, and the only new main route is the existing `/services/aircon` (static param from `lib/services`).
2. Production guard (`scripts/test_environment_isolation_static.mjs`, `npm test` suites) green; compiled guard on the built output (`scripts/verify-build.mjs --target=staging`), confirming the staging build refuses production credentials and hosts.
3. `node scripts/learn/check-no-secrets.mjs` (client bundle) and the secret scan patterns (`sb_secret`, `eyJ`, `AKIA`, `-----BEGIN`) over the diff.
4. Study destinations on staging resolve to `math-staging.life.help` / `english-staging.life.help` (`lib/home/studyHosts.ts`), never to production hosts.

## C. Order of work at staging time (each step needs its own explicit go; none is done by preparing this list)
1. Merge reviewed bulk commits (cherry-pick, not blind merge); regenerate generated files with their `--check` scripts.
2. Apply `202610050028_aircon_service.sql` to STAGING only (after `npm test` DB suites pass locally); run `scripts/test_pricing_migration_staging.mjs` (catalogue now lists aircon) and the staging request-flow suites for the new slug.
3. Build the staging Worker from the integration commit; no production secret on it; version upload, not deploy to production.
4. One uninterrupted staging run, retries 0, FAIL 0, NOT RUN 0: learning (mascot, Enter, ko, vi, a representative all-locale smoke, E1 / E6 / M2 / H3, auth, XP / mastery, persistence), main (Study card, chooser, Aircon, ordering, 38 languages, responsive), and the existing marketplace staging suites.
5. Cleanup of every fixture; evidence recorded (Worker version id, DB gate, durations).
6. STOP. Production release preparation is a separate decision.

## D. Not part of staging (must stay out)
Adult-study hosts, any legacy content import, certification / scholarship / ledger runtime, payment providers, chain anchoring, production DNS, production migrations, `main` merge.

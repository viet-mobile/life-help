# Production release plan: learning-only port (prepared 2026-10-05; PLANNING ONLY, NOTHING HERE HAS BEEN EXECUTED)

**This plan supersedes `production-release-plan-2026-10-05.md` of the full-app branch** (`feature/learning-v3-core`, artifact `2b80230`). That plan is BLOCKED and the full staged app is NOT the production candidate. Commands below are marked **[READ-ONLY]** or **[PRODUCTION MUTATION: DO NOT RUN WITHOUT EXPLICIT PRODUCTION GO]**.

## 1. Candidate identity
* `PORT_BASELINE = c4b03fe` (production learning lineage; canary `25747a2a` is built from it). Branch `release/learning-prod-port`.
* `PORT_HEAD` = the head of `release/learning-prod-port` at execution time (see the final report of the port task for the SHA recorded when this plan was written). Application source = every commit up to the last one that touches `app/`, `components/`, `lib/` or `messages/` (the touch-target fix); later commits are tests, docs and release tooling only.
* `PREVIOUS_CANDIDATE = 5391a65` = SUPERSEDED (it lacked the bilingual content). `STAGING_VALIDATED_ARTIFACT` = the OpenNext build of the new port head (see the final report of the bilingual task for the SHA and the staging Worker version; the earlier version `bc972f3b-e1cb-44ee-b15a-8f5c11b0abed` is superseded) with `wrangler.staging.jsonc` (runtime variables only: `APP_ENV=staging`, `LEARN_SUPABASE_URL`, `EXPECTED_LEARN_SUPABASE_REF`).
* `FULL_STAGED_APP_2b80230 = NOT PRODUCTION CANDIDATE`.

## 1b. Bilingual listening content (added 2026-10-05; candidate 5391a65 SUPERSEDED)
* `BILINGUAL_LISTENING_CONTENT_COVERAGE = 100%`
* `TOTAL_LISTENABLE_ENGLISH_SEGMENTS = 241` (88 lesson-example items + 153 reading-passage sentences in 58 passages / 141 questions)
* `WITH_CANONICAL_KOREAN = 241` (8 previously paired in the lesson text, 233 newly authored and reviewed)
* `MISSING_CANONICAL_KOREAN = 0` (3 lessons excluded on purpose: no English to speak)
* `VOCAB_PERSISTENCE = DEVICE_LOCAL` (saved words and flashcards stay in the browser; a signed-in learner does not get them on another device; no server table in this release)
* Passage Korean is server-only until the question is solved or revealed (verified: 0 client bundle files contain it).

## 2. Scope
Included: school learning E1-H3 with the current curricula; Vietnamese learning UI; penguin mascot; Enter-to-continue; guest and account learning with server scoring, XP, mastery; Study card with the math / English chooser (11 keys in 38 locales); English listening (sentence, full, bilingual canonical pairs, repeat range and count, speed), saved words and flashcards (device-local), design in `tts-flashcards-design.md`.
Excluded: Aircon (deferred) and migration 028, Adult Study, legacy corpus, 38-locale learner runtime (runtime stays `ko`, `vi`), fitted rubric, calibration, question-bank runtime, marketplace / payment / provider / settlement / payout / push / blockchain, certification / scholarship runtime. `LEARNER_RUNTIME_38_LOCALE_ENABLED = NO`; `TRANSLATION_PACKAGE_38_LOCALE_READY = YES`. No cloud TTS, no speech recognition, no recording: `TTS_PRODUCTION_INFRA_CHANGE = NO`, `TTS_SERVER_DEPENDENCY = NO`.

## 3. Evidence (all on the exact port artifact; the earlier 74/74 of the full app is NOT evidence for it)
* Scope gate (`node scripts/release/verify_port_scope.mjs`): 75 files against `c4b03fe` (the full app differs by 572): 19 app / component / lib files, 1 route file, 0 migrations, 38 message files, 14 test / doc files, 2 scripts; forbidden categories 0.
* Route inventory (`node scripts/release/test_baseline_routes.mjs --baseline-dir <built c4b03fe>`): baseline 41 routes, port 42, added exactly one (`/study/[site]/(play)/words/page`), removed 0; 27 checks pass (every marketplace / payment / provider / push / reward / media API still 404; learning not exposed on existing hosts).
* Compiled guard (`node scripts/release/test_compiled_guard.mjs` after `opennextjs-cloudflare build`): 5 checks pass (1,520 executed runs of the compiled guards: deny for every empty / odd environment). Bundle secret scan (`node scripts/test_learning_bundle_secrets.mjs`): no staging / production project ref, `sb_` token or service-role JWT in any bundle.
* Local gates: `git diff --check` clean, `npm run typecheck` clean, `npx vitest run` 23 files pass, local production-build Playwright (listening, flashcards, Study card, learning, Vietnamese, secondary) green, one unrelated transient timing flake in a pre-existing Vietnamese title test (passes alone and on rerun).
* Staging E2E on the Worker above: 64 / 64 pass, 0 failed, 0 not run, retries 0, 7.4 minutes (learning E1 / E6 / M2 / H1 / H3, Vietnamese, security / authority, responsive 320 / 390 / 1280, Study card, route negatives, listening and flashcards with mocked speech). Staging database before and after: 41 tables / counters, no differences.
* A first run of the same suite caught a real defect (13 px native radios in the listening panel, below the 40 px touch-target audit); fixed by 44 px segmented buttons and re-validated.

## 4. Database: nothing to apply
The port contains 0 migrations and does not read any marketplace table. Production already holds learning migrations 023-027. `PRODUCTION_DB_MIGRATION_REQUIRED = NO`. `MIGRATION_028_PRODUCTION_STATUS = NOT_APPLICABLE` (Aircon is deferred). **Never run `supabase db push --linked` from the full repository against production**: it would try to apply the marketplace chain. If you want a production schema confirmation anyway, the operator may run the read-only query of section 6.1 of the superseded plan through the approved production SQL channel and record only `service_requests` / `helper_services` / `service_subitems` existence (YES / NO); the answer does not change this release.

## 5. Build (production, fresh)
[READ-ONLY, local] from a clean worktree of the port head: `npm ci`; `npm run typecheck`; `npx vitest run`; `npm run build` (= `opennextjs-cloudflare build`, no environment baked in, no generic Supabase variables); `node scripts/release/test_compiled_guard.mjs`; `node scripts/test_learning_bundle_secrets.mjs`; `node scripts/release/verify_port_scope.mjs`; route inventory against a build of `c4b03fe`. The artifact is production-shaped by construction; staging differs only by Worker variables, so the staged bytes are the production bytes.

## 6. Production Worker procedure (version upload at 0 %, then operator-decided steps)
`CANARY_PERCENTAGE_SCHEDULE = OPERATOR_DECISION` (no policy defines the percentages; options: 0 % -> header-only smoke -> 100 %, or 0 % -> small step -> larger steps with a soak between). Baseline: live `6e68ec3d-55ca-4249-9b87-3d1d72e46e93` 100 %, canary `25747a2a-cb88-4d53-a467-4cbd8187aadd` 0 %; verify with [READ-ONLY] `npx wrangler deployments list --name life-help` before anything.
1. **[PRODUCTION MUTATION: DO NOT RUN WITHOUT EXPLICIT PRODUCTION GO]** `npx wrangler versions upload --name life-help --message "learning-port <sha>" --tag <sha>` (uploads only; no traffic).
2. **[PRODUCTION MUTATION ...]** install the learning runtime bindings on the NEW version only (names, never values): `LEARN_SUPABASE_URL`, `EXPECTED_LEARN_SUPABASE_REF`, `LEARN_SUPABASE_PUBLISHABLE_KEY`, `LEARN_SUPABASE_SECRET_KEY` with `npx wrangler versions secret put <NAME> --name life-help` (the CLI masks secret values unless `--reveal` is given: a masked value was once installed by mistake; inspect the new version's bindings before deploying). Production reads them from `process.env`: confirm the production Worker configuration exposes them the way the canary `25747a2a` did.
3. **[PRODUCTION MUTATION ...]** 0 % deployment: `npx wrangler versions deploy 6e68ec3d-55ca-4249-9b87-3d1d72e46e93@100 <NEW_VERSION_ID>@0 --name life-help --message "learning-port at 0%"`.
4. [READ-ONLY at 0 %] header-only smoke with `Cloudflare-Workers-Version-Overrides: life-help="<NEW_VERSION_ID>"` (works only while the version is in the current deployment): main page (Study card before Jobs, ten existing services in order, no Aircon), chooser (keyboard, Escape, focus; destinations `https://math.life.help` / `https://english.life.help`, never staging), math / english hosts, ordinary hosts 404 on `/study` and `/api/learn`, `/services/aircon` shows no Aircon, every marketplace / payment / provider / push API 404, no Adult Study route.
5. Controlled functional smoke (explicit GO, minimal footprint): one test account, math and English at E1 / E6 / M2 / H3 in ko and vi, XP ledger equals browser XP, refresh and sign-out / sign-in persistence, English listening and flashcards (browser speech may be absent on a machine: the note then appears and the lesson still works). Cleanup: delete the test Auth user (cascades `learn_*`), verify Auth users and `learn_*` rows equal the recorded baseline (Auth 1, `learn_*` 0).
6. **[PRODUCTION MUTATION ...]** steps: `npx wrangler versions deploy 6e68ec3d-55ca-4249-9b87-3d1d72e46e93@<100-X> <NEW_VERSION_ID>@<X> --name life-help`; full promotion: `npx wrangler versions deploy <NEW_VERSION_ID>@100 --name life-help`.

## 7. Rollback
**[PRODUCTION MUTATION ...]** `npx wrangler versions deploy 6e68ec3d-55ca-4249-9b87-3d1d72e46e93@100 --name life-help --message "rollback to known good"`; confirm `wrangler deployments list` shows `6e68ec3d` at 100 %; verify the known-good endpoints. No database rollback exists or is needed: the port wrote no schema and device-local words never reach the server.

## 8. Stop conditions and observability
Watch Worker errors / exception rate, auth errors, learning API errors, XP / mastery write failures, scoring mismatches, the host guard. Roll back on: auth failure increase, learning write failures, scoring mismatch, abnormal exception rate, host-guard failure, any secret or staging reference in a bundle, any marketplace / payment / provider route answering (must stay 404), unexpected traffic to such routes.

## 9. Web push
Not part of the port (no push code). The earlier scoped waiver (`WEB_PUSH_BROWSER_DISPLAY = WAIVED_ENVIRONMENTAL`) concerned the full-app staging suite and does not apply here.

## 10. Main branch and machines
No merge to `main`. After production validation decide, by repository policy, how the learning-only lineage reaches `main` (which already carries the marketplace). On macOS: `git fetch`, `git checkout release/learning-prod-port`, `npm ci` (no copied `node_modules` / `.next`), `npx playwright install chromium` if needed, restore production variables from the secret store (never commit), `npx wrangler login`.

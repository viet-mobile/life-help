# Learning-only production port: manifest (2026-10-05)

Baseline `c4b03fe` (production learning lineage, canary `25747a2a`). Port branch `release/learning-prod-port`. Source for the classification: `git log c4b03fe..ea4089f` of `feature/learning-v3-core` (198 commits, a different lineage: it also carries the whole marketplace). Classification is by the files a commit touches, not by its title; mixed commits were ported by hand, hunk by hunk.

## Ported (what the port branch contains on top of `c4b03fe`)

| port commit | source | scope | files |
|---|---|---|---|
| `27cb0ab` | `9634427` cherry-pick | school learning: penguin mascot, Enter navigation | Diagnostic, QuestionCard, useEnterToContinue, avatars, ko / vi strings, e2e |
| Study card commit | `4ec0306` (Study part only) + `f9992a9` (Study keys only) | Study card, chooser, 11 Study keys in 38 locales | CustomerHome, StudyChooser, studyHosts, mainServiceKeys, messages x 38, tests |
| listening / flashcards commit | new (user-approved scope) | English listening, bilingual pairs, repeat, saved words, flashcards | `lib/learn/listen/*`, `components/learn/{Listening,Flashcards}.tsx`, `app/study/[site]/(play)/words`, ko / vi keys, tests |

## Every source commit

| source | classification | reason / files | scope category |
|---|---|---|---|
| `366151d` feat(db): add core service matching schema, types, and atomic assignme | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `3c01194` fix(db): apply Phase 1 security and atomicity hardening patch | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `0d4efcd` test(concurrency): add 20-way concurrency suite, production safeguards | SKIP | outside the approved port scope | excluded |
| `d061871` fix(matching): implement candidate helper retry loop, admin escalation | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `4ca572e` test(concurrency): enforce EXPECTED_STAGING_PROJECT_REF match and unco | SKIP | outside the approved port scope | excluded |
| `4eec78a` test(concurrency): support reading from gitignored .env.staging.local | SKIP | outside the approved port scope | excluded |
| `bd8cf75` fix(matching): implement atomic release_assignment_for_rematch procedu | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `be2c159` fix(matching): guard rematch release by request state | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `d729498` feat(requests): connect customer requests to atomic database matching | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `bd83e7e` fix(requests): harden idempotency and orphan recovery | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `e3dbe38` feat(helper): add authorized assignments and referral core | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `dd244d7` fix(runtime): use Cloudflare Supabase bindings | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `6c38a73` fix(runtime): wire Cloudflare Supabase bindings correctly | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `84449e6` feat(journey): add secure chat and staging lifecycle APIs | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `f5af910` feat(journey): connect admin queue and referral attribution UI | SKIP | outside the approved port scope | excluded |
| `90c85a2` feat(referral): support manual attribution and URL lock | SKIP | outside the approved port scope | excluded |
| `f3ce690` feat(referral): add settled reward ledger and chat notifications | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `8637670` feat(rewards): qualify settled referral rewards | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `4466857` test(staging): add full journey E2E harness | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `1e0508b` feat(identity): add role-independent public user IDs | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `4d6df4c` fix(identity): unify public ID with referral identity | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `73527f8` fix(identity): remove manual referral entry and add locale coverage | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `a93406a` feat(ui): compact referral identity header control | SKIP | outside the approved port scope | excluded |
| `d4a3e59` feat(referral): add localized reward explanation | SKIP | outside the approved port scope | excluded |
| `02623db` feat(rewards): add ledger view and payout foundation | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `e0d0e8b` feat(rewards): show secure reward panel in chat | SKIP | outside the approved port scope | excluded |
| `49c75e9` fix(payout): scope destinations to identity and secure authorization | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `7265d2c` fix(payout): require private device ownership proof | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `f762f91` fix(payout): issue private owner cookie with referral identity | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `f9257dc` test(staging): verify payout authorization isolation | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `db6b579` test(i18n): expand customer journey coverage manifest | SKIP | outside the approved port scope | excluded |
| `9cf49a1` feat(i18n): complete 38-language customer journey | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `eb8e974` Fix narrow mobile header controls | SKIP | outside the approved port scope | excluded |
| `2abfb75` Keep mobile language controls in viewport | SKIP | outside the approved port scope | excluded |
| `a8e0f91` Wrap long service titles on mobile | SKIP | outside the approved port scope | excluded |
| `74ab7a5` Preserve readable mobile service titles | SKIP | outside the approved port scope | excluded |
| `de51c7d` Keep mobile service titles readable | SKIP | outside the approved port scope | excluded |
| `2264ea7` chore(deploy): prevent accidental production deployment | SKIP | outside the approved port scope | excluded |
| `3a08876` feat(lifecycle): complete helper service transitions | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `5e2d617` test(lifecycle): exercise staged service transitions | SKIP | outside the approved port scope | excluded |
| `d0ebbf9` feat(ui): move desktop shortcut action into ID popover | SKIP | outside the approved port scope | excluded |
| `b928c63` fix(ui): keep ID popover inside mobile viewport | SKIP | outside the approved port scope | excluded |
| `4ed7e85` feat(settlement): complete internal settlement lifecycle and settled c | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `162f09c` feat(cleanup): show settlement states and chat cleanup policy to custo | SKIP | outside the approved port scope | excluded |
| `ef6be10` test(lifecycle): verify settlement and cleanup boundaries | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `67ce72b` test(lifecycle): exercise staging settlement, cleanup and authority bo | SKIP | outside the approved port scope | excluded |
| `d271150` fix(matching): release helper after service completion | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `73d1eae` test(matching): verify helper reuse and real concurrent race on stagin | SKIP | outside the approved port scope | excluded |
| `488d126` test(e2e): assert race loser has no partial assignment; clean chat not | SKIP | outside the approved port scope | excluded |
| `5f47615` feat(cleanup): scheduled staging retry for interrupted settled-convers | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `b6f1bc0` fix(cleanup): reconcile SETTLED requests whose cleanup was never sched | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `faae2ee` feat(push): web push subscription schema (migration 010, not yet appli | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `8983740` feat(push): staging Web Push for helper assignment and customer lifecy | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `468e55c` fix(staging): build staging with staging Supabase public env, never pr | SKIP | outside the approved port scope | excluded |
| `b2bcca0` fix(requests): derive customer ownership server-side; push on every ne | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `c4acb91` fix(env): enforce staging/production isolation for every build, dev, t | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `a5f5f16` fix(matching): never re-pick a helper who declined or timed out on the | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `8bde45c` test(matching): verify migration 011 on live staging; harden real-push | SKIP | outside the approved port scope | excluded |
| `346000d` feat(pricing): helper-defined service pricing, customer price preview  | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `5dfe7e6` test(pricing): verify migration 012 on live staging; real-browser pric | SKIP | outside the approved port scope | excluded |
| `9007d9d` feat(db): prepare migration 013 customer re-selection (NOT applied) | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `787271d` fix(env): retire the legacy live test that spawned a raw `next dev` | SKIP | outside the approved port scope | excluded |
| `994a35d` fix(referral): repeated same-referrer attribution is an idempotent rep | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `3c31cb7` feat(requests): customer re-selection flow and current-selection price | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `49a4c60` test(reselection): live migration 013 verification and customer re-sel | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `9bc2525` test(reselection): report the second matcher result in the 011 check d | SKIP | outside the approved port scope | excluded |
| `b113f94` feat(marketplace): prepaid two-sided marketplace + payment hold/releas | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `b4e4fbe` test(staging): prepare live suites for migration 014 | SKIP | outside the approved port scope | excluded |
| `1311481` feat(payments): staging devnet USDC transfers, Helper payout UI, priva | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `7c46d8c` feat(payments): durable money-movement outbox with crash recovery + un | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `916a966` fix(cron): isolate maintenance subsystems, media items and outbox jobs | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `c2b3e46` fix(media): verify storage deletion from object metadata, not a CDN-ca | SKIP | outside the approved port scope | excluded |
| `16a4407` test(staging): compact deployed outbox regression and live cron failur | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `764472a` feat(payments): provider-neutral devnet RPC secret, genesis tripwire o | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `46f8055` feat(payments): shape-only rail config diagnostics and operator devnet | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `73d1e41` fix(payments): provider-independent finality for payment verification  | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `ed37702` test(staging): real devnet E2E driver phases A-F (payment, Mode B, res | SKIP | outside the approved port scope | excluded |
| `d29571a` test(payments): finality never depends on wall-clock time (verificatio | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `a9260d3` fix(chat): conversation lifecycle integrity - migration 016 (NOT appli | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `b08a6fb` test(staging): live migration 016 verification + extended deployed con | SKIP | outside the approved port scope | excluded |
| `1e370c5` test(staging): reselection API answers 201 for a new selection | SKIP | outside the approved port scope | excluded |
| `2352759` feat(ops): operator REVIEW_REQUIRED console + safe resolution RPCs (mi | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `dd6e70f` feat(ops): migration 018 financial authority hardening (NOT applied) + | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `bf2b10f` test(staging): live migration 018 verification (reward privileges, ope | SKIP | outside the approved port scope | excluded |
| `929f438` feat(ops): migration 019 referral reward authority (NOT applied) | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `1c87f93` test(staging): live migration 019 verification (gate / live / window p | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `d50eafc` test(staging): prepaid browser suites + checkout expiry / abandonment  | SKIP | outside the approved port scope | excluded |
| `0742d3c` feat(payments): provider-neutral payment provider foundation + migrati | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `4e7154b` fix(payments): devnet money runtime is rail-aware (never claims provid | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `46bca4d` test(staging): mock-provider E2E waits for the rotated webhook secret  | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `98a8192` chore(deps): update wrangler | SKIP | outside the approved port scope | excluded |
| `d3235c0` fix(settlement): provider-neutral, ledger-derived settlement attributi | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `6b9ca5f` feat(audit): admin_audit_logs append-only authority + migration 021 (N | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `b0d862b` fix(audit): rollout fallback only when PostgREST cannot find append_ad | SKIP | outside the approved port scope | excluded |
| `369e425` test(staging): live admin_audit_logs rollout verification (pre / post  | SKIP | outside the approved port scope | excluded |
| `47e586e` test(staging): post-021 audit suite - staff SELECT, real-chain evidenc | SKIP | outside the approved port scope | excluded |
| `252c6e8` test: audit-deletion scan excludes the authority probe suites (their D | SKIP | outside the approved port scope | excluded |
| `efe47dd` feat(payments): provider payout finality model + migration 022 (NOT ap | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `d255781` feat(payments): offline Airwallex adapter (no credentials, not registe | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `9794f0d` fix(payments): recover provider objects by LIFE.HELP request_id; drop  | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `92314c2` fix(payments): complete-history provider lookups + create-retry idempo | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `81131fe` fix(payments): durable provider-reported-paid evidence + migration 023 | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `8d09e82` test(staging): live migration 023 gate - reported-paid evidence throug | SKIP | outside the approved port scope | excluded |
| `912977f` feat(review): show provider-reported-paid attempt evidence (read-only) | SKIP | outside the approved port scope | excluded |
| `4350412` feat(review): mask payout destinations in the operator review API + co | SKIP | outside the approved port scope | excluded |
| `4d289fa` test(staging): base58Of32 keeps leading zero bytes (fixes ~1/256 RPC " | SKIP | outside the approved port scope | excluded |
| `c0fbde6` feat(review): mask payment receiving wallets in PAYMENT review cases | SKIP | outside the approved port scope | excluded |
| `43877ec` test(staging): operator review detail check expects the masked recipie | SKIP | outside the approved port scope | excluded |
| `5fdd851` feat(review): least exposure for operator ids, Helper internal ids and | SKIP | outside the approved port scope | excluded |
| `2157e03` test(staging): live check that PAYMENT review shows the Helper public  | SKIP | outside the approved port scope | excluded |
| `47a4a56` feat(review): mask LIFE.HELP attempt keys (and every copy); provider_e | SKIP | outside the approved port scope | excluded |
| `1eadaa1` test(staging): provider_event_id policy checks in the live review mask | SKIP | outside the approved port scope | excluded |
| `517dd92` feat(learn): integrate the learning platform onto latest main (additiv | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `c386b95` fix(learn): resolve the Supabase secret key only in lib/supabase/servi | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `0809f44` test(staging): read-only schema probe for migrations 016-025 (SELECT-o | SKIP | outside the approved port scope | excluded |
| `ab00f26` test(learn): 024/025 behavioural gate (local PGlite + live staging bac | SKIP | learning migrations 023-027 are already applied to production; no new migration is needed | excluded |
| `9e0718a` test(learn): raise vitest hook timeout for PGlite chain builds | SKIP | outside the approved port scope | excluded |
| `9f61a82` test(learn): staging gate --phase=pre is GET-only; publishable key onl | SKIP | outside the approved port scope | excluded |
| `a9b7846` fix(staging): nodejs_compat_populate_process_env on the staging Worker | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `3b348fc` test(learn): real-browser full-flow suite on the staging Worker (guest | SKIP | outside the approved port scope | excluded |
| `ae565e1` test(diagnostics): whole-chain read-only probe (0001-0025) + offline p | SKIP | outside the approved port scope | excluded |
| `ad1facf` feat(learn): self-contained learning authorization: 023 marker-tagged  | SKIP | learning migrations 023-027 are already applied to production; no new migration is needed | excluded |
| `dcf0832` test(learn): live gate hardening - staff fixture via temp SQL file, ma | SKIP | outside the approved port scope | excluded |
| `2af923b` feat(learn): isolate learning Supabase access behind LEARN_SUPABASE_*  | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `dc124ed` test(learn): bundle scan reads the staging env through the shared guar | SKIP | outside the approved port scope | excluded |
| `6457b41` test(learn): bundle scan treats the real publishable key as informatio | SKIP | outside the approved port scope | excluded |
| `60371a7` test(learn): add staging account and security e2e | SKIP | docs / generated reports / staging test harness | excluded |
| `2f16061` feat(learn): MATH / ENGLISH logos (site name in the LIFE.HELP logo's t | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `b43caf1` fix(learn): serve /favicon.ico Worker-first (run_worker_first: ["/favi | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `55237f0` test(learn): staging e2e checks the site logo, favicon and metadata | SKIP | docs / generated reports / staging test harness | excluded |
| `d664916` fix(learn): restore production access guard | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `04c306c` feat(db): learning migration 027 - elementary grades (E1..E6) | SKIP | learning migrations 023-027 are already applied to production; no new migration is needed | excluded |
| `f46917d` feat(learn): elementary (E1..E6) math and english curriculum + Vietnam | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `b1729fa` feat(learn): canonical 12-grade model, grade-scoped curriculum and the | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `7fa5cc1` test(learn): staging e2e for elementary grades and the Vietnamese loca | SKIP | docs / generated reports / staging test harness | excluded |
| `40a3525` test(learn): staging flow answers a wrong ordering question again with | SKIP | docs / generated reports / staging test harness | excluded |
| `54bfff4` feat(learn): strengthen elementary difficulty ladder | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `57faac8` feat(learn): grade-specific secondary curriculum (M2–H3) | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `9634427` feat(learn): replace dragon mascot and add enter navigation | PORT | penguin mascot, Enter-to-continue; cherry-picked as-is (clean) : components/learn/Diagnostic.tsx; components/learn/QuestionCard.tsx; components/learn/useEnterToContinue.ts; lib/learn/avatars.ts; lib/learn/i18n/ko.ts; lib/learn/i18n/vi.ts; tests/e2e/keyboard-avatar.spec.ts | school learning |
| `9d3b0c3` feat(learn): add ten-level question bank foundation | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `e33c521` docs(learn): parallel work plan for core and bulk tracks | SKIP | docs / generated reports / staging test harness | excluded |
| `d522da4` docs(learn): antigravity handoff and baseline | SKIP | docs / generated reports / staging test harness | excluded |
| `f695732` docs(learn): pin v3 parallel execution baseline | SKIP | docs / generated reports / staging test harness | excluded |
| `ec3a82a` feat(learn): formalize difficulty calibration model | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `e0b9071` refactor(learn): define question bank core contracts | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `8c5a25b` feat(i18n): add canonical English learning locale | SKIP | already in the production learning lineage (c4b03fe) or superseded by it | excluded |
| `e944234` feat(learn): define adult study product architecture | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `b019cbf` feat(learn): add transparency ledger and merkle foundation | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `bea221d` feat(learn): add certification and entitlement foundation | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `5c81fbe` feat(learn): add scholarship foundation and trust architecture | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `f707310` feat(learn): add practical reasoning generator families | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `30fda62` data(learn): add public assessment calibration metadata | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `59a4c58` chore(learn): capture supported locale registry | SKIP | 35-locale learner translation catalogs (runtime stays ko / vi) | excluded |
| `2e14907` chore(learn): inventory legacy adult study sites | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `1ec8f75` test(learn): audit calibration provenance and metrics | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `f2f753c` data(learn): review bulk calibration output into contract v1 | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `5302301` chore(learn): keep generated byte-compared files on LF | SKIP | outside the approved port scope | excluded |
| `0ff3145` feat(learn): calibration evidence semantics and independently verified | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `077fb84` chore(i18n): inventory learning translation readiness | SKIP | 35-locale learner translation catalogs (runtime stays ko / vi) | excluded |
| `2e34e06` Revert "chore(i18n): inventory learning translation readiness" | SKIP | 35-locale learner translation catalogs (runtime stays ko / vi) | excluded |
| `3f596ae` feat(learn): adult content contracts, legacy migration plan, Korea evi | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `4fa7ecc` feat(learn): freeze question bank API (bank-api-1) | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `6282f57` docs(learn): correct NAEP partial-credit count in the bulk review | SKIP | docs / generated reports / staging test harness | excluded |
| `1682b55` docs(learn): antigravity phase 2 handoff (i18n ready, bank API frozen) | SKIP | docs / generated reports / staging test harness | excluded |
| `b3f51bd` docs(learn): trim trailing whitespace | SKIP | docs / generated reports / staging test harness | excluded |
| `b310220` feat(home): add aircon installation, repair and cleaning as the 11th c | SKIP | marketplace / payment / provider / push / settlement (outside the learning-only scope) | excluded |
| `f9992a9` feat(home): canonical main-service i18n (21 keys) and the translation  | PARTIAL_PORT | only the 11 Study keys (lib/home/mainServiceKeys.ts) and their verified translations in 38 message files; no Aircon keys : lib/home/mainServiceKeys.ts (Study only); messages/*.json (11 keys x 38 locales); tests/home/study-card.test.ts | Study card main-service copy |
| `4ec0306` feat(home): Study card with a math / English chooser, placed before jo | PARTIAL_PORT | Study card + chooser + host table + tests; the Aircon card hunk and the Aircon test parts were removed : components/customer/CustomerHome.tsx (study entry, CardShell, counts, chooser); components/customer/StudyChooser.tsx; lib/home/studyHosts.ts; tests/e2e/home-cards.spec.ts (rewritten without Aircon) | Study card |
| `1a88898` feat(learn): real-corpus legacy import pipeline with a rights gate (dr | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `e7b7e6a` feat(learn): rubric scoring guide, coding contract and fit acceptance  | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `60f0d3f` docs(learn): staging integration checklist (prepared, not executed) | SKIP | docs / generated reports / staging test harness | excluded |
| `dd42e9e` docs(learn): antigravity handoff for main-service translations and rub | SKIP | docs / generated reports / staging test harness | excluded |
| `1f20923` chore: keep migration files on LF in every checkout | SKIP | outside the approved port scope | excluded |
| `1307bb5` fix(learn): keep Korean answer-format notes out of English target text | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `1a43e78` chore(i18n): refresh canonical 301-key translation metadata | SKIP | 35-locale learner translation catalogs (runtime stays ko / vi) | excluded |
| `63e10db` test(learn): add generated bank stress coverage | SKIP | docs / generated reports / staging test harness | excluded |
| `48316e6` chore(learn): regenerate bank stress report after the Hangul fix (mech | SKIP | docs / generated reports / staging test harness | excluded |
| `3e9a753` feat(learn): content-rights gate and generated-locale acceptance verif | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `a7319c6` docs(learn): adult study rights policy, curriculum spec, phase 2 revie | SKIP | question bank / calibration / certification / Adult Study foundation (not in this release) | excluded |
| `e621a12` chore(learn): trim trailing whitespace in approved generated files | SKIP | docs / generated reports / staging test harness | excluded |
| `fcdc4af` docs(learn): final staging integration prep and main-service locale ve | SKIP | outside the approved port scope | excluded |
| `3971e8b` feat(i18n): regenerate verified main service translations | SKIP | 35-locale learner translation catalogs (runtime stays ko / vi) | excluded |
| `a46feb6` test(learn): rerun bank stress after target-language fix | SKIP | docs / generated reports / staging test harness | excluded |
| `db83016` test(learn): report bank duplicate severity | SKIP | docs / generated reports / staging test harness | excluded |
| `5c7ed2a` docs(i18n): analyze learning translation failure root cause | SKIP | docs / generated reports / staging test harness | excluded |
| `52f1372` feat(i18n): merge verified main-service translations into messages | SKIP | outside the approved port scope | excluded |
| `2e71020` docs(learn): review of the final bulk redelivery; verifier now checks  | SKIP | outside the approved port scope | excluded |
| `06db88c` test(e2e): a merged main-service locale shows its own translation | SKIP | outside the approved port scope | excluded |
| `ce78536` fix(i18n): verifier accepts reviewed number-word forms without weakeni | SKIP | outside the approved port scope | excluded |
| `3902069` docs(learn): correct the review: arz has two genuine drift keys beside | SKIP | docs / generated reports / staging test harness | excluded |
| `bd382fd` fix(i18n): correct canonical semantics in rejected learning locales | SKIP | 35-locale learner translation catalogs (runtime stays ko / vi) | excluded |
| `f73c87f` test(i18n): validate learning numeric and duration parity | SKIP | docs / generated reports / staging test harness | excluded |
| `ca74bc6` docs(learn): final acceptance of the learning locale correction | SKIP | docs / generated reports / staging test harness | excluded |
| `2b80230` test(i18n): range that loses one end fails the number check | SKIP | outside the approved port scope | excluded |
| `30bba7d` test(staging): pricing migration suite expects the 22-row catalog afte | SKIP | outside the approved port scope | excluded |
| `4977bda` test(staging): main-site staging e2e (Study card, Aircon flow, merged  | SKIP | docs / generated reports / staging test harness | excluded |
| `10c4479` docs(learn): staging run record, DB gate with scoped web-push waiver,  | SKIP | docs / generated reports / staging test harness | excluded |
| `ea4089f` docs(learn): prepare production release runbook | SKIP | docs / generated reports / staging test harness | excluded |


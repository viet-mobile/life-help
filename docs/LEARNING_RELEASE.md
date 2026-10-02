# Learning platform: guest-only production release (math.life.help / english.life.help)

Branch `release/learning-prod`, based on `9638f8c` (the production baseline, LIKELY_MATCH of Worker `life-help` version
`b60470a6-f133-40b9-a060-56105ca497ab`). It contains the learning platform and nothing else from the integration branch
(no payments, providers, payouts, referrals, matching, operator review, audit or settlement code).

## What this release does

- Serves the learning sites by hostname: `math.life.help` -> `/study/math/...`, `english.life.help` -> `/study/english/...`.
  Path access (`/study/...`) and the learning API are 404 on every other production host.
- **Guest-only**: no `LEARN_SUPABASE_*` variable is set, so `accountsEnabled()` is false, the account UI is disabled ("준비 중")
  and no Supabase or Auth request is ever made. Progress lives in the browser (localStorage). Bundled demo content is used.
- **Not indexed**: `<meta name="robots" content="noindex, nofollow">` and `X-Robots-Tag: noindex, nofollow` on the learning hosts.
- `wrangler.jsonc` is unchanged (compatibility date `2024-09-23`, flag `nodejs_compat` only; no vars, no routes).

## Database

`supabase/migrations/202609300023..026` are in the repository for the later account release. They are **not applied** to the
production database by this release. `024` / `025` are byte-identical to the versions already applied on staging (sha256 pinned in
`tests/learn/migration-lineage.test.ts`). The repository also contains the marketplace migrations `0001` / `0002`; a plain
`supabase db push` would apply them, so the account release applies the learning files from a temporary workdir that holds only
the four learning migrations.

## Checks (all local)

- `npm run typecheck`, `npm test` (vitest: learning domain / engine / API / proxy regression / migration lineage / env matrix /
  import isolation), `npm run test:learn:db` (learning gate on three migration chains in PGlite)
- `npm run build:next`, then `npm run test:e2e` (production-mode server, guest flows, production Host routing, no Supabase request)
- `node scripts/release/test_baseline_routes.mjs --baseline-dir <9638f8c build>`: route inventory and 38-path status comparison
  against the production baseline
- `node scripts/test_learning_bundle_secrets.mjs [--clean|--canary] [--baseline-dir <9638f8c build>]`: OpenNext build + scan of
  every bundle

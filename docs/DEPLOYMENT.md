# Deployment, environments and go-live (math / english)

Facts marked **[CONFIRMED]** were read from the Cloudflare dashboard by the project owner; everything else is from this repository.

## 1. Confirmed production topology

- Worker `life-help` (structure A: Worker is the origin, OpenNext, see `wrangler.jsonc`).
- **[CONFIRMED]** Zone `life.help` has Worker Route **`*.life.help/* → life-help`** and **Custom Domains `life.help` +61**.
- **[CONFIRMED]** There is **no wildcard DNS record** (`*`). The route alone does not make a hostname resolve: a hostname must have a proxied DNS
  record (the Custom Domains create those for the existing ~60 hosts). Route ≠ DNS.
- **[CONFIRMED]** Production branch `main`; Workers Builds for non-production branches is **on**. Build `npm run build`, deploy `npm run deploy`,
  version `npx wrangler versions upload`. Do **not** click "Set up Worker Previews" (separate migration, later).
- **[CONFIRMED]** Active deployment is version `b60470a6` (100%). Branch builds such as `8a1293af` only upload *versions*; they are not active.
  An uploaded version does not receive production traffic until someone deploys/promotes it. Never promote a branch version.
- Existing hosts are routed inside the Worker by `proxy.ts` (country / tech / chat / sys). Their behaviour is pinned by a regression test
  (`tests/learn/proxy.test.ts` compares against a verbatim copy of `main`'s proxy for 18 hosts × 12 paths).

## 2. What changed with the wildcard-route discovery

| Earlier plan | Now |
|---|---|
| Attach `math-staging.life.help` / `english-staging.life.help` as Custom Domains of `life-help-staging` | **Dropped for now.** Staging uses `life-help-staging.<account>.workers.dev` only. No `life.help` DNS, Custom Domain or Route is created. |
| Path `/study/*` available everywhere | `/study/*` and the API are **404 in production on every non-learning host** (proxy + API guard), so existing hosts cannot expose the learning pages. |

Why the wildcard matters: Cloudflare picks the **most specific route** when several match, and routes take precedence over Custom Domains on the
same hostname. So a future `math-staging.life.help/* → life-help-staging` route (plus a proxied DNS record) *would* win over `*.life.help/*`. That is
workable, but it touches the production zone, so it is deferred until workers.dev validation is complete.

## 3. Staging strategy (chosen: Option A — workers.dev first)

```
LOCAL → life-help-staging.<account>.workers.dev (real staging Supabase) → [only if needed] specific route for *-staging hosts → full E2E → PR → production review
```

- Separate Worker `life-help-staging` (`wrangler.jsonc` → `env.staging`, deployed only with `--env staging`). It shares nothing with `life-help`:
  different name, no routes, own vars/secrets, own `*.workers.dev` URL. The production wildcard route targets `life-help` by name and cannot reach it.
- `APP_ENV=staging` (Worker var) enables the staging-only conveniences: `/study` chooser and path access `/study/math`, `/study/english`
  (workers.dev has no `math.` subdomain). In production none of this exists (404). Production hostname UX is unchanged.
- Staging is `noindex`, and accounts are disabled unless `EXPECTED_SUPABASE_REF` matches the Supabase URL (cannot silently use the production DB).
- Details and commands: `docs/STAGING.md`.

## 4. Future production hostnames (not created yet)

`math.life.help` and `english.life.help` should be added **the same way the existing ~60 hosts are**: Custom Domain on Worker `life-help`
(which creates the proxied DNS record; the wildcard route then also matches). No special-casing. Do this only after staging passes and the
branch is merged through a PR. Until a DNS record exists these names do not resolve, so merging alone exposes nothing; but **merging to `main` triggers
the production build/deploy** (Workers Builds), so merge only when you intend to go live with this code.

## 5. Variables and secrets (names only)

| Name | Kind | Staging | Production |
|---|---|---|---|
| `APP_ENV` | var | `staging` (in wrangler.jsonc) | unset (= production) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build-time | staging project | existing |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker secret | staging key | add only at go-live |
| `EXPECTED_SUPABASE_REF` | var | staging ref (required) | production ref (recommended) |
| `LEARN_CONTENT_SOURCE` | var | `demo` → `supabase` after seeding | `supabase` |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment `staging` secrets | yes | — |

**Do not add `SUPABASE_SERVICE_ROLE_KEY` to the production Worker yet.** Branch versions share the production Worker's secrets/bindings; without the key,
accounts stay disabled and the learning code cannot reach any database from a branch version.

## 6. Database

`supabase/migrations/202609300001_learning_platform.sql` and `…0002_learning_content_rpc.sql` are additive (new `learn_*` objects and one function).
They depend on `security.has_role` and `public.app_role` from the marketplace migrations, so a fresh staging project must receive **all** migrations in order.
Rollback: `supabase/rollbacks/`. Seed (staging only, guarded): `supabase/seed/learn_demo.sql`.

## 7. Guest → account (security design)

Guest progress is client-held and unverifiable, so it is **never imported** into an account (that would let anyone mint XP). On first sign-in only the
harmless profile choices (nickname, grade, goal, avatar) are offered as defaults in onboarding. Everything else is earned again on the account.

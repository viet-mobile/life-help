# Deployment, environments and go-live checklist (math / english)

Audit facts below come from files in this repository. Anything the repository
cannot show (dashboard-only settings) is marked **UNKNOWN – verify in dashboard**.

## 1. Audit

**GitHub**
- Repository: `viet-mobile/life-help`; default branch `main` (remote head `996ec06`).
- Working branch for this work: `claude/compassionate-tesla-70glgy` (not `main`).
- `.github/` did not exist: no CI, no deploy workflow, no staging/production workflow.
  This change adds `ci.yml` (verify only) and `deploy-staging.yml` (manual, staging Worker only).
- No production workflow was added on purpose.
- Secret/variable names referenced by the new workflows: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  (secrets, Environment `staging`), `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY` (variables).

**Cloudflare structure: A — a Cloudflare Worker is the origin.**
Evidence: `wrangler.jsonc` has `main: .open-next/worker.js`, `name: life-help`, an `assets` binding, and
`nodejs_compat`; `open-next.config.ts` uses `@opennextjs/cloudflare`; `package.json` has `deploy = opennextjs-cloudflare build && … deploy`.
There is no Pages config (`_routes.json`, `functions/`), no `routes`/`custom_domains` (so attached hostnames are dashboard-managed),
and no separate origin behind the Worker (not B, C or D).

**Hostname handling in code**
- `proxy.ts` does all host routing inside the single Worker: `<country>.life.help`, `tech.`, `chat.`, `sys.`, `register-device.`.
- New: `math.` / `english.` (and `-staging` variants) are matched by an exact allowlist (`lib/learn/hosts.ts`), never a wildcard, and
  rewritten to `/study/<site>/…`.
- Cookies: the app sets no cookie `Domain`, so Supabase session cookies are host-only. `math` and `english` do **not** share a session with
  each other or with `sys.`/`tech.`. Keep it that way (do not set `Domain=.life.help`).
- CORS: no CORS headers anywhere; the learning API is same-origin only (`Origin` must equal the request host).
- CSP: none exists today. OAuth: none used. Supabase auth redirect: e-mail/password only; confirmation e-mails use the Supabase *Site URL*
  / *Redirect URLs* allowlist (dashboard).
- Collisions found: (1) PWA manifest (`app/manifest.ts`) and site metadata assumed LIFE.HELP customer hosts → learn hosts now get their own manifest;
  (2) the old proxy would have treated `math.life.help` as a customer host with no country → now handled before that logic.
- Not changed, but risky (existing): `lib/auth/adminAuth.ts` sets a client-side `admin auth = true` cookie (spoofable); real protection depends on
  `AUTH_ENFORCEMENT=true`. The README mentions `.env.example`, which does not exist. `npm run lint` already fails on 64 pre-existing errors, so CI lints only new code.

## 2. Architecture decision

One web application, one codebase, hostname-based routing (already the repository's pattern).
- Production Worker: `life-help` (unchanged).
- Staging Worker: **`life-help-staging`** (new `env.staging` block in `wrangler.jsonc`; deploys only with `--env staging`). It never edits the production Worker.
- Shared: auth, engine, gamification, UI, providers (`lib/learn`, `components/learn`). Site-specific: demo content and renderers per site.
- Environments come only from `lib/env.ts` (`APP_ENV`: local | staging | production). Staging is `noindex`, and accounts are disabled unless the Supabase
  project matches `EXPECTED_SUPABASE_REF` (fail closed so staging can never silently use the production database).

## 3. Variables and secrets (names only)

| Name | Kind | Where |
|---|---|---|
| `APP_ENV` | var | staging Worker: `staging` (set in wrangler.jsonc); production: leave unset |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build-time vars | per environment |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker **secret** | per environment, never in git |
| `EXPECTED_SUPABASE_REF` | Worker var | staging: staging project ref (required); production: prod ref (recommended) |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment `staging` secrets | CI staging deploy |

## 4. Connecting hosts (ordering matters)

Use **Worker Custom Domains** (matches structure A). Do not pre-create A/AAAA/CNAME records for these names: attaching a Custom Domain creates them.

1. Staging first: deploy `life-help-staging`, attach `math-staging.life.help` and `english-staging.life.help` to it.
   (Single-label subdomains are covered by Universal SSL. `math.staging.life.help` would not be, so it is not used.)
2. Only after staging passes the checklist below, attach `math.life.help` and `english.life.help` to `life-help` **after** production is deployed with this code.
3. **UNKNOWN – verify first:** whether a wildcard (`*.life.help`) DNS record or Worker route already exists. If it does, `math.life.help` may already reach the
   production Worker, and deploying this code to production makes those hosts live immediately.
4. **UNKNOWN – verify first:** whether Workers Builds (git integration) auto-deploys `main`. If so, merging this branch deploys production.

## 5. Staging verification checklist

math + english landing, onboarding, diagnostic, lesson, hint ladder, XP/level, refresh persistence, daily quest, sign-up/login (staging Supabase only),
mobile layout, and a regression pass on `korea.life.help`, `tech.`, `chat.`, `sys.` staging-equivalents.

## 6. Database

`supabase/migrations/202609300001_learning_platform.sql` is additive (new `learn_*` objects only; no existing table is altered).
Apply to **staging first** with the Supabase CLI against the staging project. Production application requires explicit approval.
Rollback: `supabase/rollbacks/202609300001_learning_platform.down.sql` (manual, destroys learning data).
Demo content: `supabase/seed/` (never in migrations; guarded so it cannot run by accident).

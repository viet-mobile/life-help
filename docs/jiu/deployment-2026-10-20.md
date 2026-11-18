# JIU deployment — 2026-10-20

- Worker: `life-help`
- Live version: `9b1aaed3-d1a2-42ee-8931-f15fc8d8716f` (100%)
- Initial journal release: `a2dafca6-389d-4206-b069-add2473664ee`
- Prior version for rollback: `a2dafca6-389d-4206-b069-add2473664ee`
- Pre-JIU baseline: `eea593a1-cc8b-4b60-a683-ebd9c88179a3`
- Home: https://jiu.life.help/
- Administrator: https://jiu.life.help/jiu/admin (`jiu`; password provided privately in the task conversation)
- Custom domain and HTTPS certificate registered on the existing Worker. Cloudflare and Google public DNS both resolve it; this machine temporarily retained a negative DNS cache entry. Browser verification used the public DNS result with the original hostname and normal TLS verification.
- New runtime secrets: `JIU_ADMIN_PASSWORD_HASH`, `JIU_SESSION_SECRET` (secret_text). Existing learning, service-core, and SYS secrets verified present on the new version.
- Secrets reside locally in ignored `.dev.vars`, not `.env.local`: OpenNext compiles `.env*` files into `next-env.mjs`. Exact-value scan confirmed neither JIU secret occurs in the final build.
- Mail binding: `JIU_EMAIL`, restricted to `jiubag850@gmail.com`. Sender `jiu@life.help`. Domain sending enabled and recipient verification were already configured.
- KV binding: `JIU_MAIL_STATE`, namespace `a9762c3d3317416ea30b09fe1ad7640d`.

## Validation

- 65 relevant unit tests passed (journal, mail reports, mail auth/CSRF/recipient restriction/provider failure, JIU host routing, existing proxy/host regressions, learning Supabase isolation).
- Production build and TypeScript compilation passed.
- Worker gzip: 5.76 MiB, below repository budget 7.5 MiB.
- Bundle scanner passed: no Supabase project refs/tokens/service-role JWTs; no actual JIU secret values.
- Production-domain 0% version-override browser smoke passed: HTTPS and mobile banners, unauthenticated mail denial, administrator login, email enrollment, mail provider acceptance, logout clearing both sessions, math-to-JIU cross-origin journal transfer.
- Main, English, Korean home routes: 200. JIU learning API and marketplace `/study/math`: 404.
- Promoted the same verified version to 100%. Final browser smoke without a version override passed: public home, administrator login, reflection persisted in localStorage, automatic email delivery accepted by the provider, and logout. Two clearly labeled deployment test reports were sent.
- No schema migration or learning-state writes were needed.

The mail provider accepted the deployment verification report. Inbox placement is not asserted. Email enrollment is per browser after administrator login, lasts 90 days, and is cleared on logout. New activity and edited reflections are mailed while a connected page is open, about every five minutes. Closed-browser records wait until the next visit. See README for queue limits and retry/deduplication behavior.

## Rollback

`npx wrangler versions deploy a2dafca6-389d-4206-b069-add2473664ee@100 --name life-help --message "Rollback JIU journal" --yes`

Retain the custom domain and dedicated KV namespace during an application rollback; neither affects the prior version's existing routes. Runtime secret values are never recorded in this document.

## Metadata and shortcut icon update

- Follow-up version: `9b1aaed3-d1a2-42ee-8931-f15fc8d8716f`.
- Rollback target for this update: `a2dafca6-389d-4206-b069-add2473664ee`.
- Title/application name/Apple home-screen name/Open Graph/Twitter metadata: `JIU · 나의 배움 일지`.
- Generated assets with `node scripts/generate_jiu_logos.js`: LIFE.HELP wordmark preserved below the top band; top band changed to JIU. Includes 512px logo, 192px and 32px icons, 180px Apple icon, multi-size ICO, and a padded 512px maskable icon.
- Host-aware `/favicon.ico` serves the embedded JIU ICO via `/jiu/favicon.ico` on JIU hosts. Existing favicon host routing is preserved.
- All three manifest URLs (`/manifest.webmanifest`, `/manifest.json`, `/jiu/manifest.webmanifest`) return the JIU identity on jiu.life.help. The page uses the dedicated, versioned JIU manifest URL. Windows shortcut downloads reference the JIU ICO.
- 63 relevant tests passed; typecheck, production build, bundle secret scan, and size gate passed (5.77 MiB gzip).
- Zero-percent production-domain browser smoke passed: full document/app/Apple/Open Graph/Twitter title checks, manifest names and icon references, ICO response, Windows shortcut content, administrator metadata inheritance, and preserved Math branding. All existing runtime secret bindings verified on the uploaded version.

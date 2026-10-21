# JIU learner journal

`jiu.life.help/` rewrites to `/jiu`; local preview is `/jiu`. Four banners link to math.life.help, english.life.help, korean.life.help, and life.help.

Successful learning API calls (start, attempt, complete, cards, diagnostic) enqueue browser activity for a hidden `/jiu/bridge` frame on jiu.life.help. The receiver checks the exact learning origin, parent window, site, and event schema. Acknowledged IDs prevent duplicates; unacknowledged events stay in a bounded sender queue for retry. No answers, names, account IDs, or tokens are transmitted. Existing historical progress is not imported. LIFE.HELP banner clicks are recorded, but activity inside the marketplace is not tracked.

Records and daily reflections stay in browser localStorage, shared across users of that browser profile, not a publicly published blog. The latest 5,000 activities and 500 pending sender events are retained. Storage restrictions may prevent cross-site recording. Changing browser or device does not carry the journal over. Production and local journals are separate.

## Administrator and email enrollment

Login: `https://jiu.life.help/jiu/admin`, username `jiu`.

- `JIU_ADMIN_PASSWORD_HASH`: `salt:hexDigest`, digest = scrypt(password, salt, 64).
- `JIU_SESSION_SECRET`: random 32-byte secret encoded as hex.

Production reads Cloudflare runtime bindings; local development reads the git-ignored `.dev.vars` via the local Cloudflare runtime. Never commit secret values. Administrator sessions use signed HttpOnly Secure SameSite=Strict cookies and last eight hours. Successful login also enrolls that browser for journal email for 90 days via a separate purpose-bound HttpOnly cookie. Logout clears both cookies. Only the enrolled browser can call the mail endpoint. Other visitors' records are not emailed to the administrator.

## Mail delivery

Sender: `jiu@life.help`. Fixed recipient: `jiubag850@gmail.com` (server-owned, never accepted from the browser). The `JIU_EMAIL` Cloudflare send binding is restricted to this recipient. `JIU_MAIL_STATE` KV records accepted report hashes for 90 days to reduce retry duplicates.

While the blog or a connected learning site is open, new activities and updated reflections are sent in batches approximately every five minutes. First unsent data is checked after a five-second debounce. Each report includes at most 200 new activities and ten updated reflections; larger backlogs drain over subsequent batches. Notes are plain text; no answers or credentials are mailed. No activity means no email. Closed browsers cannot send: pending records are retried when reopened. Mail send status is shown on the blog. A provider rejection keeps the browser's pending data for retry. Email provider acceptance does not prove inbox placement.

KV is eventually consistent and the mail provider does not offer an idempotency transaction with KV. Rare concurrent requests or a crash after provider acceptance can cause a duplicate email. Login and sending have per-isolate rate limits; edge limits may supplement these if needed. Logout disables email enrollment, but does not erase existing browser records.

## Deployment

The jiu.life.help custom domain points to the existing life-help Worker. Preserve existing learning and marketplace secrets when uploading versions. Add the two JIU secrets additively, together with the mail and KV bindings. Upload a version, validate it with a version override before promotion, then deploy it to 100%. Record the previous version for rollback. Existing databases need no migration.

## Checks

- `npx vitest run tests/jiu tests/learn/proxy.test.ts tests/learn/hosts.test.ts tests/learn/supabase-isolation.test.ts tests/learn/country-hosts-47.test.ts`
- `npm run typecheck`
- `npm run build`
- `node scripts/test_learning_bundle_secrets.mjs --skip-build`
- Start development server on port 3100; set `JIU_TEST_PASSWORD` and run `node tests/jiu/browser-check.cjs` for mobile banner, reflection persistence, invalid login, valid login/logout, and bridge header checks.

## Branding

The shared identity is defined in `lib/jiu/brand.ts`: `JIU · 나의 배움 일지`. Regenerate the JIU LIFE.HELP icon family with `node scripts/generate_jiu_logos.js`; it preserves the existing wordmark and replaces the top name band. The manifest, Apple home-screen icon, favicon and Windows shortcut all use the JIU assets. Changing an existing asset requires updating the icon version in the shared branding module and desktop shortcut paths.

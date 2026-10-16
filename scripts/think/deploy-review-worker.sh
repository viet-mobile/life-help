#!/usr/bin/env bash
# Builds and uploads the self-contained review Worker (scripts/think/build-review-worker.mjs) through the Cloudflare API.
# Needs CLOUDFLARE_API_TOKEN (Workers Scripts:Edit) in the environment, or an authenticated proxy; CLOUDFLARE_ACCOUNT_ID defaults to the project account.
set -euo pipefail
A="${CLOUDFLARE_ACCOUNT_ID:-f31907ac016e3095fbeec224acaa2bdb}"; N="${THINK_REVIEW_WORKER:-life-help-think-review}"
AUTH=(); [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
npx next build >/dev/null && node scripts/think/build-review-worker.mjs
curl -fsS -X PUT "https://api.cloudflare.com/client/v4/accounts/$A/workers/scripts/$N" "${AUTH[@]}" \
  -F 'metadata={"main_module":"worker.js","compatibility_date":"2024-09-23"};type=application/json' \
  -F 'worker.js=@.think-review/worker.js;type=application/javascript+module;filename=worker.js' | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d; print('uploaded', d['result']['id'], d['result'].get('etag','')[:12])"
curl -fsS -X POST "https://api.cloudflare.com/client/v4/accounts/$A/workers/scripts/$N/subdomain" "${AUTH[@]}" -H 'content-type: application/json' --data '{"enabled":true,"previews_enabled":false}' >/dev/null
echo "https://$N.simpl2eye.workers.dev/think-pilot"

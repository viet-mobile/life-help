// Short live STAGING smoke after a deploy: proves the deployed Worker is staging-wired end to end.
//   1. Everything the Worker serves to browsers (pages + referenced static chunks, sw.js, manifest)
//      contains zero production Supabase refs (plain, URL or JWT ref claim).
//   2. Runtime env: push config is enabled, which the runtime allow-list permits only on staging.
//   3. Customer identity, request creation and matching write to the STAGING database.
//   4. Helper Bearer auth, and a real /login session (the build-inlined session client) in Chrome.
// Fixtures are removed afterwards. Usage: node scripts/test_staging_smoke.mjs
import crypto from "node:crypto";
import { REFS, refsIn } from "./lib/envGuard.mjs";
import { base, db, fixtures, launchChrome, readResponse, recorder, sleep, trustedClick, vapidPublicKey, waitFor } from "./lib/stagingPushHarness.mjs";

const runId = `SMK${Date.now()}`;
const { expect, record, summary } = recorder();
const fx = fixtures(runId);
let browser = null;
try {
  // 1. live browser-facing bundle scan
  const pages = ["/", "/request", "/chat?requestId=00000000-0000-4000-8000-000000000000&capability=x", "/login", "/tech/assignments", "/tech/workspace", "/sw.js", "/manifest.json"];
  const seen = new Set();
  let scanned = 0, production = 0, staging = 0;
  for (const page of pages) {
    const text = await (await fetch(base + page)).text();
    const assets = [...text.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
    for (const [label, body] of [[page, text], ...await Promise.all(assets.filter((a) => !seen.has(a) && seen.add(a)).map(async (a) => [a, await (await fetch(base + a)).text()]))]) {
      scanned += 1;
      const refs = refsIn(body);
      if (refs.has("PRODUCTION")) { production += 1; record("FAIL", `production ref served in ${label}`); }
      if (refs.has("STAGING")) staging += 1;
    }
  }
  expect(`Live browser-facing responses: 0 production refs (${scanned} pages/chunks scanned; staging refs in ${staging})`, production === 0 && scanned > 10, { scanned, production });

  // 2. runtime environment
  const config = await readResponse(await fetch(`${base}/api/push/config`));
  expect("Runtime env is staging (push allow-list enabled with the staging VAPID key)", config.enabled === true && config.publicKey === vapidPublicKey, config);

  // 3. identity + request + matching land in the staging database
  const helper = await fx.createHelper("SM", { locale: "ko" });
  const customer = await fx.customerDevice("SMC");
  expect("Customer identity created by the Worker in STAGING", customer.status === 200 && customer.cookie && customer.identityId, customer.status);
  const req = await fx.createRequest(customer, { label: "smoke" });
  const stored = req.body.requestId ? (await db(`service_requests?id=eq.${req.body.requestId}&select=customer_id,status`))[0] : null;
  const assignment = req.body.requestId ? (await db(`request_assignments?request_id=eq.${req.body.requestId}&select=helper_id`))[0] : null;
  expect("Request created + matched in STAGING (owner from device cookie)", req.status === 201 && req.body.status === "MATCHED" && stored?.customer_id === customer.publicId && assignment?.helper_id === helper.helper.id, { status: req.status, stored, assignment });

  // 4. helper auth
  const list = await readResponse(await fetch(`${base}/api/helper/assignments`, { headers: helper.auth }));
  expect("Helper Bearer auth resolves against STAGING Supabase Auth", Array.isArray(list.assignments) && list.assignments.some((a) => a.requestId === req.body.requestId), list);
  browser = await launchChrome();
  if (browser) {
    await browser.navigate(`${base}/login`);
    await waitFor(() => browser.evaluate("!!document.querySelector('input[name=\"email\"]')"), 20000, 500);
    await sleep(2000);
    for (const [name, value] of [["email", helper.email], ["password", helper.password]]) {
      await browser.evaluate(`document.querySelector('input[name="${name}"]').focus()`);
      await browser.cdp("Input.insertText", { text: value }, browser.sessionId);
    }
    await trustedClick(browser, 'form button[type="submit"]');
    await waitFor(() => browser.evaluate("!location.pathname.startsWith('/login')"), 20000, 500);
    const status = await browser.evaluate("fetch('/api/helper/assignments', { cache: 'no-store' }).then((r) => r.status)");
    const landed = await browser.evaluate("location.pathname + location.search");
    // Login redirects to "/", whose referral card creates a customer identity for this browser.
    const device = await browser.evaluate("localStorage.getItem('life_help_referral_device_id')");
    if (device) { const row = (await db(`referral_identities?device_id_hash=eq.${crypto.createHash("sha256").update(device).digest("hex")}&select=id,referral_id`))[0]; if (row) { fx.created.identityIds.add(row.id); fx.created.publicIds.add(row.referral_id); } }
    expect("Helper /login session works (build-inlined session client -> STAGING auth)", status === 200 && !landed.includes("error"), { status, landed });
  } else {
    record("NOT_TESTABLE", "Helper browser login", "Chrome not available");
  }
  record("INFO", `Supabase project exercised: ${REFS.STAGING} (staging) only`);
} catch (error) {
  record("FAIL", "Smoke harness", String(error?.stack || error).slice(0, 400));
} finally {
  if (browser) await browser.close();
  const leftovers = await fx.cleanup();
  expect("Fixture cleanup", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

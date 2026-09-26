// Live STAGING Web Push E2E.
//
// Real delivery paths (nothing mocked):
//   * Mozilla autopush: a Node client registers a real channel on push.services.mozilla.com
//     (the protocol Firefox uses); the Worker encrypts + VAPID-signs, Mozilla delivers, and this
//     script decrypts with keys only it holds.
//   * Chrome: a temporary-profile Chrome (DevTools protocol) registers the staging service worker,
//     subscribes through the real UI button after a trusted click, and receives FCM pushes; the
//     displayed notifications are read back from the service worker.
//
// Usage: node scripts/test_web_push_staging.mjs            (headless Chrome)
//        node scripts/test_web_push_staging.mjs --headed   (visible Chrome window)
import crypto from "node:crypto";
import {
  Autopush, base, clickEnable, db, fixtures, launchChrome, minimalPayload, origin, readResponse, recorder,
  serviceKey, serviceWorkerSession, settlementToken, shownNotifications, sleep, subsByEndpoint, subscribe,
  trustedClick, unsubscribe, vapidPublicKey, waitFor,
} from "./lib/stagingPushHarness.mjs";

const runId = `WP${Date.now()}`;
const { expect, notTestable, record, summary } = recorder();
const fx = fixtures(runId);
const autopush = new Autopush();
let browser = null;
try {
  // ---------- config ----------
  const configResponse = await fetch(`${base}/api/push/config`);
  const config = await readResponse(configResponse);
  expect("Config endpoint returns only enabled + public key", configResponse.status === 200 && config.enabled === true && config.publicKey === vapidPublicKey && Object.keys(config).sort().join() === "enabled,publicKey", config);

  // ---------- fixtures ----------
  const h1 = await fx.createHelper("H1", { locale: "ko" });
  const h2 = await fx.createHelper("H2", { locale: "en", onDuty: false });
  const custA = await fx.customerDevice("A");
  const custB = await fx.customerDevice("B");
  expect("Fixtures: helpers + customer device cookies", h1.token && h2.token && custA.cookie && custB.cookie && custA.identityId && custB.identityId && custA.subjectKey === custA.publicId, { a: !!custA.cookie, b: !!custB.cookie });
  await autopush.connect();
  const helperCh = await autopush.register(), helperDeadCh = await autopush.register(), customerCh = await autopush.register();
  expect("Real push service channels registered (Mozilla autopush)", [helperCh, helperDeadCh, customerCh].every((c) => c.endpoint?.startsWith("https://updates.push.services.mozilla.com/")));

  // ---------- customer ownership security ----------
  const cookieA = { Cookie: custA.cookie }, cookieB = { Cookie: custB.cookie };
  const noCookie = await subscribe("customer", customerCh.subscription);
  const publicIdBearer = await subscribe("customer", customerCh.subscription, { Authorization: `Bearer ${custA.publicId}` });
  const publicIdBody = await subscribe("customer", customerCh.subscription, {}, { referralId: custA.publicId, customerId: custA.publicId });
  const refQuery = await subscribe("customer", customerCh.subscription, {}, {}, `?ref=${custA.publicId}`);
  const forged = await subscribe("customer", customerCh.subscription, { Cookie: "life_help_device_owner=eyJkZXZpY2VIYXNoIjoiYSJ9.forged" });
  expect("Customer subscribe without device cookie blocked", noCookie.status === 401, noCookie.status);
  expect("Public 8-letter ID alone cannot subscribe (bearer/body)", publicIdBearer.status === 401 && publicIdBody.status === 401, [publicIdBearer.status, publicIdBody.status]);
  expect("?ref= cannot subscribe", refQuery.status === 401, refQuery.status);
  expect("Forged device cookie blocked", forged.status === 401, forged.status);
  expect("Blocked customer attempts wrote nothing", (await subsByEndpoint(customerCh.endpoint)).length === 0);
  const hijack = await subscribe("customer", customerCh.subscription, cookieA, { referralId: custB.publicId, customerIdentityId: custB.identityId }, `?ref=${custB.publicId}`);
  const ownedA = await subsByEndpoint(customerCh.endpoint);
  expect("Customer owner comes from the device cookie only (B's public ID / ?ref= ignored)", hijack.status === 200 && ownedA.length === 1 && ownedA[0].owner_type === "CUSTOMER" && ownedA[0].customer_identity_id === custA.identityId, { status: hijack.status, ownedA });
  const hijackBody = await readResponse(hijack);
  expect("Subscribe response exposes no endpoint/keys/ids", !JSON.stringify(hijackBody).match(/mozilla|p256dh|auth"|subscription_id|identity/i), hijackBody);
  const again = await readResponse(await subscribe("customer", customerCh.subscription, cookieA));
  expect("Customer re-subscribe idempotent", again.created === false && (await subsByEndpoint(customerCh.endpoint)).length === 1, again);
  const crossDelete = await readResponse(await unsubscribe("customer", customerCh.endpoint, cookieB));
  expect("Device B cannot unsubscribe device A", crossDelete.revoked === 0 && (await subsByEndpoint(customerCh.endpoint))[0].status === "ACTIVE", crossDelete);
  const anonDelete = await unsubscribe("customer", customerCh.endpoint, { Authorization: `Bearer ${custA.publicId}` });
  expect("Public ID cannot unsubscribe", anonDelete.status === 401 && (await subsByEndpoint(customerCh.endpoint))[0].status === "ACTIVE", anonDelete.status);
  const ssrf = await subscribe("customer", { endpoint: "https://evil.example/collect", keys: customerCh.subscription.keys }, cookieA);
  const httpEndpoint = await subscribe("customer", { endpoint: "http://updates.push.services.mozilla.com/x", keys: customerCh.subscription.keys }, cookieA);
  expect("Non-push / non-https endpoints rejected", ssrf.status === 400 && httpEndpoint.status === 400, [ssrf.status, httpEndpoint.status]);

  // ---------- helper ownership security ----------
  const hAnon = await subscribe("helper", helperCh.subscription);
  const hCookie = await subscribe("helper", helperCh.subscription, cookieA);
  const hPublic = await subscribe("helper", helperCh.subscription, { Authorization: `Bearer ${custA.publicId}` });
  expect("Anonymous / customer cookie / public ID cannot manage helper subscriptions", hAnon.status === 401 && hCookie.status === 401 && hPublic.status === 401, [hAnon.status, hCookie.status, hPublic.status]);
  const hOwn = await subscribe("helper", helperCh.subscription, h1.auth, { helperId: h2.helper.id, helper_id: h2.helper.helper_id });
  const ownedH = await subsByEndpoint(helperCh.endpoint);
  expect("Helper owner comes from Supabase Auth only (client helper id ignored)", hOwn.status === 200 && ownedH.length === 1 && ownedH[0].helper_id === h1.helper.id, { status: hOwn.status, ownedH });
  const h2Delete = await readResponse(await unsubscribe("helper", helperCh.endpoint, h2.auth));
  expect("Helper B cannot unsubscribe Helper A", h2Delete.revoked === 0 && (await subsByEndpoint(helperCh.endpoint))[0].status === "ACTIVE", h2Delete);
  await subscribe("helper", helperDeadCh.subscription, h1.auth);
  autopush.unregister(helperDeadCh);
  await sleep(1500);

  // ---------- REAL helper assignment push (with one dead subscription) ----------
  const reqA = await fx.createRequest(custA);
  const capA = (await fx.capabilityFor(custA.cookie, reqA.key)).capability;
  const assignment = reqA.body.requestId ? (await db(`request_assignments?request_id=eq.${reqA.body.requestId}&select=id,helper_id,status`))[0] : null;
  expect("Matching unaffected by push (201 MATCHED to H1)", reqA.status === 201 && reqA.body.status === "MATCHED" && assignment?.helper_id === h1.helper.id, { status: reqA.status, body: reqA.body });
  const helperPayload = await autopush.next(helperCh, (p) => p.type === "HELPER_ASSIGNED");
  expect("REAL Web Push: helper assignment delivered via Mozilla push service", helperPayload?.type === "HELPER_ASSIGNED" && helperPayload.title === "새 서비스 요청" && helperPayload.url === "/tech/assignments", helperPayload);
  expect("Helper payload minimal (no ids, capability, names, address)", minimalPayload(helperPayload, [reqA.body.requestId, capA, "PUSH TEST", `${runId} address`, custA.publicId]), helperPayload);
  const deadRow = await waitFor(async () => { const rows = await subsByEndpoint(helperDeadCh.endpoint); return rows[0]?.status === "INVALID" ? rows[0] : null; }, 20000);
  expect("410 from real push service -> subscription INVALID", deadRow?.status === "INVALID" && [404, 410].includes(deadRow.last_failure_status), deadRow);
  const liveRow = await waitFor(async () => { const rows = await subsByEndpoint(helperCh.endpoint); return rows[0]?.last_success_at ? rows[0] : null; }, 20000);
  expect("Dead subscription did not block the live one (success recorded)", liveRow?.status === "ACTIVE" && liveRow.failure_count === 0, liveRow);
  const helperInApp = await db(`app_notifications?recipient_id=eq.${h1.helper.helper_id}&type=eq.NEW_SERVICE_REQUEST&payload->>request_id=eq.${reqA.body.requestId}&select=id`);
  expect("In-app NEW_SERVICE_REQUEST still recorded", helperInApp.length === 1, helperInApp.length);

  // ---------- REAL customer lifecycle push (with one failing subscription) ----------
  const junkKeys = { p256dh: crypto.createECDH("prime256v1").generateKeys().toString("base64url"), auth: crypto.randomBytes(16).toString("base64url") };
  const junkEndpoint = `https://fcm.googleapis.com/fcm/send/lifehelp-invalid-${runId}`;
  const junk = await subscribe("customer", { endpoint: junkEndpoint, keys: junkKeys }, cookieA);
  expect("Failing customer subscription registered", junk.status === 200, junk.status);
  const steps = [];
  for (const action of ["accept", "start", "complete"]) steps.push((await fetch(`${base}/api/helper/assignments/${assignment?.id}/${action}`, { method: "POST", headers: h1.auth })).status);
  const afterComplete = (await db(`service_requests?id=eq.${reqA.body.requestId}&select=status`))[0]?.status;
  expect("Lifecycle unaffected by push failures (accept/start/complete 200, COMPLETED)", steps.every((s) => s === 200) && afterComplete === "COMPLETED", { steps, afterComplete });
  const customerPayload = await autopush.next(customerCh, (p) => p.type === "SERVICE_STATUS");
  expect("REAL Web Push: customer lifecycle update delivered via Mozilla push service", customerPayload?.type === "SERVICE_STATUS" && customerPayload.title === "Service update" && customerPayload.url === "/request", customerPayload);
  expect("Customer payload minimal (no ids, capability, names, address)", minimalPayload(customerPayload, [reqA.body.requestId, capA, "PUSH TEST", `${runId} address`, custA.publicId]), customerPayload);
  const junkRow = await waitFor(async () => { const rows = await subsByEndpoint(junkEndpoint); return rows[0] && (rows[0].failure_count > 0 || rows[0].status === "INVALID") ? rows[0] : null; }, 20000);
  expect("Failing subscription recorded without blocking delivery", junkRow && !junkRow.last_success_at && junkRow.last_failure_status !== null, junkRow);
  const customerInApp = await db(`app_notifications?recipient_id=eq.${custA.publicId}&type=eq.SERVICE_STATUS_CHANGED&payload->>request_id=eq.${reqA.body.requestId}&payload->>status=eq.COMPLETED&select=id`);
  expect("In-app SERVICE_STATUS_CHANGED (COMPLETED) recorded", customerInApp.length === 1, customerInApp.length);

  // ---------- staging test push authorization ----------
  const testPush = (headers, target = { type: "HELPER", helperId: h1.helper.id }, extra = {}) => fetch(`${base}/api/sys/push/test`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ target, ...extra }) });
  const denied = {
    anonymous: (await testPush({})).status,
    wrongToken: (await testPush({ Authorization: `Bearer ${settlementToken.slice(0, -2)}xx` })).status,
    customerCapability: (await testPush({ Authorization: `Bearer ${capA}` })).status,
    publicId: (await testPush({ Authorization: `Bearer ${custA.publicId}` })).status,
    helper: (await testPush(h1.auth)).status,
    serviceKey: (await testPush({ Authorization: `Bearer ${serviceKey}` })).status,
    customerCookie: (await testPush(cookieA)).status,
  };
  expect("Test push blocked for anon/wrong token/capability/public ID/helper/service key/customer cookie", Object.values(denied).every((s) => s === 401), denied);
  const badTarget = await testPush({ Authorization: `Bearer ${settlementToken}` }, { type: "HELPER", helperId: h1.helper.helper_id });
  expect("Test push rejects non-internal target ids", badTarget.status === 400, badTarget.status);
  const operator = await readResponse(await testPush({ Authorization: `Bearer ${settlementToken}` }, { type: "HELPER", helperId: h1.helper.id }, { title: "<b>custom</b>", body: "custom", url: "https://evil.example" }));
  const testPayload = await autopush.next(helperCh, (p) => p.type === "STAGING_TEST");
  expect("Operator test push delivered with fixed content only", operator.delivered >= 1 && testPayload?.type === "STAGING_TEST" && testPayload.title === "Test notification" && !JSON.stringify(testPayload).includes("custom") && !JSON.stringify(testPayload).includes("evil"), { operator, testPayload });

  // ---------- Chrome: real browser subscription + FCM delivery ----------
  browser = await launchChrome({ headed: process.argv.includes("--headed") });
  if (!browser) {
    notTestable("Browser flow", "Chrome not available");
  } else {
    await browser.instrumentPermission();
    await browser.navigate(`${base}/request`);
    const deviceId = await waitFor(() => browser.evaluate("localStorage.getItem('life_help_referral_device_id')"), 20000, 500);
    const deviceHash = crypto.createHash("sha256").update(deviceId || "").digest("hex");
    const browserIdentity = await waitFor(async () => (await db(`referral_identities?device_id_hash=eq.${deviceHash}&select=id,subject_key,referral_id`))[0], 20000);
    if (browserIdentity) { fx.created.identityIds.add(browserIdentity.id); fx.created.publicIds.add(browserIdentity.referral_id); }
    expect("Browser: device-owner identity issued by the real /request page", !!browserIdentity, deviceId);
    const swReady = await waitFor(() => browser.evaluate("navigator.serviceWorker.getRegistration('/').then((r) => !!(r && r.active && r.active.scriptURL.endsWith('/sw.js')))"), 20000, 500);
    expect("Browser: service worker registered (/sw.js active)", swReady === true);

    // The browser's own request, created with its HttpOnly owner cookie (never readable by Node).
    const payload = JSON.stringify(fx.requestPayload(browserIdentity?.referral_id, "en", "browser request"));
    const reqB = await browser.evaluate(`(async () => { const key = crypto.randomUUID(); const r = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: ${JSON.stringify(payload)} }); const body = await r.json(); const c = await (await fetch('/api/requests/capability', { method: 'POST', headers: { 'Idempotency-Key': key } })).json(); return { status: r.status, body, capability: c.capability }; })()`);
    if (reqB?.body?.requestId) fx.created.requestIds.add(reqB.body.requestId);
    expect("Browser: request created with the browser's own device cookie", reqB?.status === 201 && reqB.body.status === "MATCHED" && reqB.capability, reqB);
    await browser.navigate(`${base}/chat?requestId=${reqB.body.requestId}&capability=${encodeURIComponent(reqB.capability)}`);
    const buttonShown = await waitFor(() => browser.evaluate("!!document.querySelector('[data-testid=\"push-customer-enable\"]')"), 20000, 500);
    const beforeClick = await browser.evaluate("({ calls: window.__permissionCalls.length, permission: Notification.permission })");
    expect("Browser: no permission request on page load", buttonShown === true && beforeClick?.calls === 0 && beforeClick?.permission === "default", beforeClick);
    await browser.cdp("Browser.grantPermissions", { origin, permissions: ["notifications"] });
    const clicked = await clickEnable(browser, "push-customer-enable");
    const turnedOn = await waitFor(() => browser.evaluate("!!document.querySelector('[data-testid=\"push-customer-on\"]')"), 30000, 500);
    const calls = await browser.evaluate("window.__permissionCalls");
    expect("Browser: permission requested once, inside a user gesture", clicked && calls?.length === 1 && calls[0].userActivation === true, calls);
    const browserEndpoint = await browser.evaluate("navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => s && s.endpoint)");
    const browserRow = browserEndpoint ? (await subsByEndpoint(browserEndpoint))[0] : null;
    expect("Browser: PushManager subscription persisted for the device owner", turnedOn === true && browserEndpoint?.startsWith("https://fcm.googleapis.com/") && browserRow?.status === "ACTIVE" && browserRow.owner_type === "CUSTOMER" && browserRow.customer_identity_id === browserIdentity.id, { turnedOn, host: browserEndpoint && new URL(browserEndpoint).host, browserRow });
    const resub = await browser.evaluate(`navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => fetch('/api/push/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audience: 'customer', subscription: s.toJSON() }) })).then((r) => r.json())`);
    expect("Browser: same-browser re-subscribe idempotent", resub?.created === false && (await subsByEndpoint(browserEndpoint)).length === 1, resub);
    const foreignDelete = await readResponse(await unsubscribe("customer", browserEndpoint, cookieB));
    expect("Browser: another device cannot unsubscribe it", foreignDelete.revoked === 0 && (await subsByEndpoint(browserEndpoint))[0].status === "ACTIVE", foreignDelete);

    const asgB = (await db(`request_assignments?request_id=eq.${reqB.body.requestId}&select=id,helper_id`))[0];
    const stepsB = [];
    for (const action of ["accept", "start", "complete"]) stepsB.push((await fetch(`${base}/api/helper/assignments/${asgB?.id}/${action}`, { method: "POST", headers: h1.auth })).status);
    const swSession = await waitFor(() => serviceWorkerSession(browser), 15000, 500);
    const shown = await waitFor(async () => { const list = await shownNotifications(browser); return Array.isArray(list) && list.find((n) => n.data?.type === "SERVICE_STATUS") ? list : null; }, 60000, 2000);
    const statusNote = shown?.find((n) => n.data?.type === "SERVICE_STATUS");
    expect("REAL Web Push: customer lifecycle push received and displayed by Chrome (FCM)", stepsB.every((s) => s === 200) && statusNote?.title === "Service update" && statusNote.data.url === "/request", { stepsB, shown });
    const operatorBrowser = await readResponse(await testPush({ Authorization: `Bearer ${settlementToken}` }, { type: "CUSTOMER", customerIdentityId: browserIdentity.id }));
    const shownTest = await waitFor(async () => (await shownNotifications(browser))?.find((n) => n.data?.type === "STAGING_TEST") || null, 60000, 2000);
    expect("REAL Web Push: operator test push displayed by Chrome", operatorBrowser.delivered === 1 && shownTest?.title === "Test notification", { operatorBrowser, shownTest });

    const routing = await browser.evaluate(`(() => { const p = self.__lifeHelpPush.parsePushPayload; return { evil: p(JSON.stringify({ url: "https://evil.example/x", audience: "customer" })).url, protocolRelative: p(JSON.stringify({ url: "//evil.example" })).url, helper: p(JSON.stringify({ url: "/tech/assignments", audience: "helper" })).url, customer: p(JSON.stringify({ url: "/request", audience: "customer" })).url }; })()`, swSession);
    expect("Service worker: notification routes limited to fixed same-origin paths", routing?.evil === "/" && routing.protocolRelative === "/" && routing.helper === "/tech/assignments" && routing.customer === "/request", routing);
    notTestable("notificationclick via a real OS click", "Chrome DevTools cannot click an OS notification; the click handler's routing is verified inside the live service worker");

    const disableClicked = await trustedClick(browser, "push-customer-disable");
    const revokedRow = await waitFor(async () => { const row = (await subsByEndpoint(browserEndpoint))[0]; return row?.status === "REVOKED" ? row : null; }, 20000);
    expect("Browser: owner unsubscribe via UI revokes the row", disableClicked && revokedRow?.status === "REVOKED", { disableClicked, revokedRow });
  }
} catch (error) {
  record("FAIL", "E2E harness", String(error?.stack || error).slice(0, 500));
} finally {
  if (browser) await browser.close();
  autopush.close();
  await sleep(500);
  const leftovers = await fx.cleanup();
  leftovers.testAudits = (await db(`admin_audit_logs?action=eq.WEB_PUSH_TEST_SENT&created_at=gte.${new Date(Number(runId.slice(2))).toISOString()}&select=id`)).length;
  expect("Fixture cleanup", Object.values(leftovers).every((n) => n === 0), leftovers);
}
if (summary().FAIL > 0) process.exit(1);

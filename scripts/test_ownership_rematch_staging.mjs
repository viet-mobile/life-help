// Live STAGING E2E: customer request ownership hardening + helper rematch push.
//
//   1. Spoofed customer_id: device B files a request claiming A's customer_id.
//   2. Referral: a real Chrome visitor arrives via ?ref=<A>; attribution A -> visitor, but the
//      request, capability and push all belong to the visitor.
//   3. Real authenticated Helper browser: /login (Supabase Auth) -> helper panel push button.
//   4. Decline -> release -> rematch: the newly assigned helper gets a real push (Chrome/FCM +
//      Mozilla autopush); the declining helper is not re-notified; a retried decline sends nothing.
//   5. In-band orphan recovery on an idempotent replay pushes exactly once.
//
// Real services only. Usage: node scripts/test_ownership_rematch_staging.mjs [--headed]
import crypto from "node:crypto";
import {
  Autopush, base, capabilityOwner, clickEnable, db, deriveRequestId, fcmRefusedFreshSubscription, fixtures, launchChrome, minimalPayload,
  origin, readResponse, recorder, serviceWorkerSession, settlementToken, shownNotifications, sleep,
  subsByEndpoint, subscribe, trustedClick, unsubscribe, waitFor,
} from "./lib/stagingPushHarness.mjs";

const runId = `OW${Date.now()}`;
const headed = process.argv.includes("--headed");
const { expect, notTestable, record, summary } = recorder();
const fx = fixtures(runId);
const autopush = new Autopush();
const browsers = [];
const allPayloads = [];
const helperAction = async (helper, assignmentId, action) => { const r = await fetch(`${base}/api/helper/assignments/${assignmentId}/${action}`, { method: "POST", headers: helper.auth }); return { status: r.status, body: await readResponse(r) }; };
const activeAssignment = async (requestId) => (await db(`request_assignments?request_id=eq.${requestId}&status=in.(PENDING,NOTIFIED,ACCEPTED)&select=id,helper_id,status`))[0];
/** Push timing for diagnosis: when the push service accepted delivery (DB) vs when the socket got it. */
async function pushTiming(label, channel, t0, countBefore) {
  const row = (await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(channel.endpoint)}&select=last_success_at`))[0];
  const msg = autopush.messages.filter((m) => m.channelID === channel.channelID)[countBefore];
  const accepted = row?.last_success_at ? `${Math.round((Date.parse(row.last_success_at) - t0) / 1000)}s` : "never";
  const delivered = msg ? `${Math.round((msg.receivedAt - t0) / 1000)}s` : "not yet";
  record("INFO", `${label} push timing: push service accepted ${accepted} after trigger; socket delivery ${delivered}; reconnects ${autopush.reconnects}`);
}
async function finish(helper, requestId) {
  const asg = await activeAssignment(requestId);
  const codes = [];
  for (const action of ["accept", "start", "complete"]) codes.push((await helperAction(helper, asg?.id, action)).status);
  return codes;
}

try {
  // ---------- fixtures ----------
  const h1 = await fx.createHelper("H1", { locale: "ko", rating: 5 });
  const h2 = await fx.createHelper("H2", { locale: "en", rating: 4 });
  const A = await fx.customerDevice("A"), B = await fx.customerDevice("B"), C = await fx.customerDevice("C");
  await autopush.connect();
  const aCh = await autopush.register(), bCh = await autopush.register(), h1Ch = await autopush.register(), h2Ch = await autopush.register();
  const subs = [await subscribe("customer", aCh.subscription, { Cookie: A.cookie }), await subscribe("customer", bCh.subscription, { Cookie: B.cookie }), await subscribe("helper", h1Ch.subscription, h1.auth), await subscribe("helper", h2Ch.subscription, h2.auth)];
  expect("Fixtures: 2 helpers, 3 customer devices, 4 real push channels", subs.every((r) => r.status === 200) && A.cookie && B.cookie && C.cookie, subs.map((r) => r.status));

  // ================= 1. spoofed customer_id =================
  const anon = await fx.createRequest(null, { claimedCustomerId: A.publicId });
  const publicIdAuth = await fetch(`${base}/api/requests?ref=${A.publicId}`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID(), Authorization: `Bearer ${A.publicId}` }, body: JSON.stringify(fx.requestPayload(A.publicId)) });
  expect("No device cookie: request creation blocked (public ID / ?ref= are not credentials)", anon.status === 401 && anon.body.code === "DEVICE_OWNER_REQUIRED" && [401, 402].includes(publicIdAuth.status) && !(await readResponse(publicIdAuth))?.requestId, [anon.status, publicIdAuth.status]);
  const spoof = await fx.createRequest(B, { claimedCustomerId: A.publicId, label: "spoof" });
  const spoofRow = spoof.body.requestId ? (await db(`service_requests?id=eq.${spoof.body.requestId}&select=customer_id`))[0] : null;
  expect("B sending A's customer_id: request stored under B, never A", spoof.status === 201 && spoofRow?.customer_id === B.publicId && spoofRow.customer_id !== A.publicId, { status: spoof.status, spoofRow });
  const capB = await fx.capabilityFor(B.cookie, spoof.key);
  const capA = await fx.capabilityFor(A.cookie, spoof.key);
  const capNone = await fx.capabilityFor(null, spoof.key);
  expect("Capability issued only to B's device and bound to B", capabilityOwner(capB.capability) === B.publicId && !capA.capability && !capNone.capability, { b: capabilityOwner(capB.capability), a: capA.code, none: capNone.code });
  const statusByPublicId = await fetch(`${base}/api/requests/status?requestId=${spoof.body.requestId}&capability=${A.publicId}`);
  expect("Public 8-letter ID cannot read the request", statusByPublicId.status >= 400, statusByPublicId.status);
  const h1First = await autopush.next(h1Ch, (p) => p.type === "HELPER_ASSIGNED");
  allPayloads.push(h1First);
  const finishCodes = await finish(h1, spoof.body.requestId);
  const bPush = await autopush.next(bCh, (p) => p.type === "SERVICE_STATUS");
  allPayloads.push(bPush);
  expect("B receives B's lifecycle push (real, Mozilla push service)", finishCodes.every((c) => c === 200) && bPush?.type === "SERVICE_STATUS", { finishCodes, bPush });
  await sleep(10000);
  expect("A receives nothing for B's request", autopush.received(aCh).length === 0, autopush.received(aCh));
  const inAppA = await db(`app_notifications?recipient_id=eq.${A.publicId}&payload->>request_id=eq.${spoof.body.requestId}&select=id`);
  const inAppB = await db(`app_notifications?recipient_id=eq.${B.publicId}&payload->>request_id=eq.${spoof.body.requestId}&payload->>status=eq.COMPLETED&select=id`);
  expect("In-app status record goes to B only", inAppA.length === 0 && inAppB.length === 1, { a: inAppA.length, b: inAppB.length });

  // ================= 2. referral visitor in a real browser =================
  const visitor = await launchChrome({ headed });
  browsers.push(visitor);
  if (!visitor) notTestable("Referral browser flow", "Chrome not available");
  else {
    await visitor.instrumentPermission();
    await visitor.navigate(`${base}/?ref=${A.publicId}`);
    const deviceId = await waitFor(() => visitor.evaluate("localStorage.getItem('life_help_referral_device_id')"), 20000, 500);
    const hash = crypto.createHash("sha256").update(deviceId || "").digest("hex");
    const V = await waitFor(async () => (await db(`referral_identities?device_id_hash=eq.${hash}&select=id,referral_id,subject_key`))[0], 20000);
    if (V) { fx.created.identityIds.add(V.id); fx.created.publicIds.add(V.referral_id); }
    const attribution = V ? await waitFor(async () => (await db(`referral_attributions?referred_identity_id=eq.${V.id}&select=referrer_identity_id`))[0], 15000) : null;
    expect("Visitor got its OWN identity (not the referrer's)", V && V.referral_id !== A.publicId && V.subject_key === V.referral_id, V);
    expect("Referral attribution A -> visitor preserved", attribution?.referrer_identity_id === A.identityId, attribution);
    await visitor.navigate(`${base}/request?ref=${A.publicId}`);
    await sleep(5000);
    const identitiesForDevice = await db(`referral_identities?device_id_hash=eq.${hash}&select=id`);
    const sameDevice = await visitor.evaluate("localStorage.getItem('life_help_referral_device_id')");
    expect("Home and request page share one device identity", identitiesForDevice.length === 1 && sameDevice === deviceId, { identities: identitiesForDevice.length });
    const created = await visitor.evaluate(`(async () => { const key = crypto.randomUUID(); const unpaid = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: ${JSON.stringify(JSON.stringify(fx.requestPayload(A.publicId, "en", "referral request")))} }); const unpaidBody = await unpaid.json(); const r = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key, Authorization: 'Bearer ' + ${JSON.stringify(settlementToken)} }, body: ${JSON.stringify(JSON.stringify(fx.requestPayload(A.publicId, "en", "referral request")))} }); const body = await r.json(); const c = await (await fetch('/api/requests/capability', { method: 'POST', headers: { 'Idempotency-Key': key } })).json(); return { key, unpaid: [unpaid.status, unpaidBody.code, !!unpaidBody.requestId], status: r.status, body, capability: c.capability }; })()`);
    if (created?.body?.requestId) fx.created.requestIds.add(created.body.requestId);
    const refRow = created?.body?.requestId ? (await db(`service_requests?id=eq.${created.body.requestId}&select=customer_id`))[0] : null;
    expect("Visitor: unpaid public creation from the real browser is refused (402 PREPAYMENT_REQUIRED, nothing created)", created?.unpaid?.[0] === 402 && created.unpaid[1] === "PREPAYMENT_REQUIRED" && created.unpaid[2] === false, created?.unpaid);
    // Prepaid browser creation needs a verified devnet payment (funding unavailable): legacy operator path, same browser cookie.
    expect("Visitor's request belongs to the visitor, not referrer A (even when claiming A; operator legacy path)", created?.status === 201 && refRow?.customer_id === V?.referral_id && refRow.customer_id !== A.publicId, { created, refRow });
    expect("Visitor's conversation capability bound to the visitor", capabilityOwner(created?.capability) === V?.referral_id, capabilityOwner(created?.capability));
    const capForA = await fx.capabilityFor(A.cookie, created?.key);
    expect("Referrer A cannot obtain the visitor's capability", !capForA.capability, capForA);
    await visitor.navigate(`${base}/chat?requestId=${created.body.requestId}&capability=${encodeURIComponent(created.capability)}`);
    await waitFor(() => visitor.evaluate("!!document.querySelector('[data-testid=\"push-customer-enable\"]')"), 20000, 500);
    await visitor.cdp("Browser.grantPermissions", { origin, permissions: ["notifications"] });
    await clickEnable(visitor, "push-customer-enable");
    await waitFor(() => visitor.evaluate("!!document.querySelector('[data-testid=\"push-customer-on\"]')"), 30000, 500);
    const vEndpoint = await visitor.evaluate("navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => s && s.endpoint)");
    const vRow = vEndpoint ? (await subsByEndpoint(vEndpoint))[0] : null;
    expect("Visitor's push subscription owned by the visitor", vRow?.owner_type === "CUSTOMER" && vRow.customer_identity_id === V?.id, vRow);
    const vFinish = await finish(h1, created.body.requestId);
    const vSw = await waitFor(() => serviceWorkerSession(visitor), 15000, 500);
    const vShown = await waitFor(async () => (await shownNotifications(visitor))?.find((n) => n.data?.type === "SERVICE_STATUS") || null, 60000, 2000);
    const vRowNow = vEndpoint ? (await subsByEndpoint(vEndpoint))[0] : null;
    if (!vShown && fcmRefusedFreshSubscription(vRowNow)) notTestable("REAL Web Push: visitor receives its own lifecycle push in Chrome (FCM)", "FCM answered 410 to the first push for a fresh headless-Chrome subscription; the product correctly invalidated it");
    else expect("REAL Web Push: visitor receives its own lifecycle push in Chrome (FCM)", vFinish.every((c) => c === 200) && vShown?.title === "Service update", { vFinish, vShown, row: vEndpoint ? (await subsByEndpoint(vEndpoint))[0] : null, sw: !!vSw });
    await sleep(8000);
    expect("Referrer A receives none of the visitor's pushes", autopush.received(aCh).length === 0, autopush.received(aCh));
    expect("Attribution unchanged after the request (A -> visitor, once)", (await db(`referral_attributions?referred_identity_id=eq.${V.id}&select=referrer_identity_id`)).map((r) => r.referrer_identity_id).join() === A.identityId);
  }

  // ================= 3. real authenticated Helper browser =================
  const helperBrowser = await launchChrome({ headed });
  browsers.push(helperBrowser);
  let h2BrowserEndpoint = null, hSw = null;
  if (!helperBrowser) notTestable("Helper browser flow", "Chrome not available");
  else {
    await helperBrowser.instrumentPermission();
    await helperBrowser.navigate(`${base}/login`);
    await waitFor(() => helperBrowser.evaluate("!!document.querySelector('input[name=\"email\"]') && !!document.querySelector('input[name=\"password\"]')"), 20000, 500);
    await sleep(2000);
    for (const [name, value] of [["email", h2.email], ["password", h2.password]]) {
      await helperBrowser.evaluate(`document.querySelector('input[name="${name}"]').focus()`);
      await helperBrowser.cdp("Input.insertText", { text: value }, helperBrowser.sessionId);
    }
    await trustedClick(helperBrowser, 'form button[type="submit"]');
    await waitFor(() => helperBrowser.evaluate("!location.pathname.startsWith('/login')"), 20000, 500);
    // Login redirects to "/", whose referral card creates a customer identity for this browser too;
    // track it so the fixture cleanup removes it.
    const helperDevice = await waitFor(() => helperBrowser.evaluate("localStorage.getItem('life_help_referral_device_id')"), 15000, 500);
    const helperDeviceIdentity = helperDevice ? await waitFor(async () => (await db(`referral_identities?device_id_hash=eq.${crypto.createHash("sha256").update(helperDevice).digest("hex")}&select=id,referral_id`))[0], 15000) : null;
    if (helperDeviceIdentity) { fx.created.identityIds.add(helperDeviceIdentity.id); fx.created.publicIds.add(helperDeviceIdentity.referral_id); }
    const authCheck = await helperBrowser.evaluate("fetch('/api/helper/assignments', { cache: 'no-store' }).then((r) => r.status)");
    expect("Helper login via Supabase Auth works in the browser", authCheck === 200, authCheck);
    await helperBrowser.navigate(`${base}/tech/assignments`);
    const hButton = await waitFor(() => helperBrowser.evaluate("!!document.querySelector('[data-testid=\"push-helper-enable\"]')"), 20000, 500);
    const hBefore = await helperBrowser.evaluate("({ calls: window.__permissionCalls.length, permission: Notification.permission })");
    expect("Helper notification button visible, no permission request on load", hButton === true && hBefore?.calls === 0 && hBefore.permission === "default", hBefore);
    await helperBrowser.cdp("Browser.grantPermissions", { origin, permissions: ["notifications"] });
    const hClicked = await clickEnable(helperBrowser, "push-helper-enable");
    const hOn = await waitFor(() => helperBrowser.evaluate("!!document.querySelector('[data-testid=\"push-helper-on\"]')"), 30000, 500);
    const hCalls = await helperBrowser.evaluate("window.__permissionCalls");
    expect("Real user click triggers Notification.requestPermission() once", hClicked && hCalls?.length === 1 && hCalls[0].userActivation === true, hCalls);
    h2BrowserEndpoint = await helperBrowser.evaluate("navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => s && s.endpoint)");
    const hRow = h2BrowserEndpoint ? (await subsByEndpoint(h2BrowserEndpoint))[0] : null;
    expect("Real Helper PushManager subscription stored under the authenticated Helper", hOn === true && h2BrowserEndpoint?.startsWith("https://fcm.googleapis.com/") && hRow?.owner_type === "HELPER" && hRow.helper_id === h2.helper.id && hRow.status === "ACTIVE", hRow);
    const hResub = await helperBrowser.evaluate(`navigator.serviceWorker.getRegistration('/').then((r) => r.pushManager.getSubscription()).then((s) => fetch('/api/push/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audience: 'helper', subscription: s.toJSON(), helperId: ${JSON.stringify(h1.helper.id)} }) })).then((r) => r.json())`);
    expect("Second Helper subscribe idempotent (client helperId ignored)", hResub?.created === false && (await subsByEndpoint(h2BrowserEndpoint)).length === 1 && (await subsByEndpoint(h2BrowserEndpoint))[0].helper_id === h2.helper.id, hResub);
    const crossHelper = await readResponse(await unsubscribe("helper", h2BrowserEndpoint, h1.auth));
    expect("Helper H1 cannot unsubscribe Helper H2", crossHelper.revoked === 0 && (await subsByEndpoint(h2BrowserEndpoint))[0].status === "ACTIVE", crossHelper);
    hSw = await waitFor(() => serviceWorkerSession(helperBrowser), 15000, 500);
  }

  // ================= 4. decline -> release -> rematch =================
  const h1Before = autopush.received(h1Ch).length;
  const tRequest = Date.now();
  const reqR = await fx.createRequest(C, { label: "rematch" });
  const firstAsg = reqR.body.requestId ? await activeAssignment(reqR.body.requestId) : null;
  const h1Arrived = await waitFor(async () => (autopush.received(h1Ch).length >= h1Before + 1 ? true : null), 120000, 500);
  const h1Assigned = autopush.received(h1Ch).at(-1);
  allPayloads.push(h1Assigned);
  const h1Accepted = (await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(h1Ch.endpoint)}&select=last_success_at,failure_count`))[0];
  const h1Msg = autopush.messages.filter((m) => m.channelID === h1Ch.channelID).at(-1);
  record("INFO", `H1 push timing: push service accepted ${h1Accepted?.last_success_at ? Math.round((Date.parse(h1Accepted.last_success_at) - tRequest) / 1000) + "s" : "never"} after request; socket delivery ${h1Arrived && h1Msg ? Math.round((h1Msg.receivedAt - tRequest) / 1000) + "s" : "not within 45s"}; autopush reconnects so far ${autopush.reconnects}`);
  expect("Initial Helper push: R assigned to H1, H1 notified", reqR.status === 201 && firstAsg?.helper_id === h1.helper.id && h1Arrived && h1Assigned?.type === "HELPER_ASSIGNED" && autopush.received(h1Ch).length === h1Before + 1, { status: reqR.status, firstAsg, received: autopush.received(h1Ch).length - h1Before, h1Accepted });
  // H1 goes off duty, then declines: the existing matcher now has exactly one eligible helper (H2).
  await db(`helpers?id=eq.${h1.helper.id}`, "PATCH", { on_duty: false });
  const tDecline = Date.now();
  const decline = await helperAction(h1, firstAsg?.id, "decline");
  const secondAsg = await activeAssignment(reqR.body.requestId);
  expect("Decline released and rematched R to H2", decline.status === 200 && decline.body.matching?.status === "MATCHED" && secondAsg?.helper_id === h2.helper.id, { decline, secondAsg });
  const h2Pushed = await autopush.next(h2Ch, (p) => p.type === "HELPER_ASSIGNED");
  await pushTiming("H2 rematch", h2Ch, tDecline, 0);
  allPayloads.push(h2Pushed);
  expect("Release/rematch push delivered to H2 (real, Mozilla push service)", h2Pushed?.type === "HELPER_ASSIGNED" && h2Pushed.title === "New service request", h2Pushed);
  if (helperBrowser && h2BrowserEndpoint) {
    const hShown = await waitFor(async () => (await shownNotifications(helperBrowser))?.find((n) => n.data?.type === "HELPER_ASSIGNED") || null, 60000, 2000);
    const hRowNow = h2BrowserEndpoint ? (await subsByEndpoint(h2BrowserEndpoint))[0] : null;
    if (!hShown && fcmRefusedFreshSubscription(hRowNow)) notTestable("REAL Web Push: rematched Helper's browser displays the assignment (Chrome/FCM)", "FCM answered 410 to the first push for a fresh headless-Chrome subscription; the product correctly invalidated it");
    else expect("REAL Web Push: rematched Helper's browser displays the assignment (Chrome/FCM)", hShown?.title === "New service request" && hShown.data.url === "/tech/assignments", { hShown, row: hRowNow && { status: hRowNow.status, failures: hRowNow.failure_count, lastFailure: hRowNow.last_failure_status, lastSuccess: hRowNow.last_success_at }, shown: await shownNotifications(helperBrowser), sw: !!(await serviceWorkerSession(helperBrowser)) });
  }
  const inAppH2 = await db(`app_notifications?recipient_id=eq.${h2.helper.helper_id}&type=eq.NEW_SERVICE_REQUEST&payload->>request_id=eq.${reqR.body.requestId}&select=id`);
  const inAppH1 = await db(`app_notifications?recipient_id=eq.${h1.helper.helper_id}&type=eq.NEW_SERVICE_REQUEST&payload->>request_id=eq.${reqR.body.requestId}&select=id`);
  expect("In-app notifications consistent (H1 once for its assignment, H2 once for the rematch)", inAppH1.length === 1 && inAppH2.length === 1, { h1: inAppH1.length, h2: inAppH2.length });
  const retryDecline = await helperAction(h1, firstAsg?.id, "decline");
  await sleep(12000);
  expect("H1 not notified about H2's assignment", autopush.received(h1Ch).length === h1Before + 1, autopush.received(h1Ch).length - h1Before);
  expect("Retried decline rejected; no duplicate rematch push", retryDecline.status === 409 && autopush.received(h2Ch).length === 1 && (await db(`request_assignments?request_id=eq.${reqR.body.requestId}&select=id`)).length === 2, { retry: retryDecline.status, h2Messages: autopush.received(h2Ch).length });

  // ================= 5. in-band orphan recovery on replay =================
  await db(`helpers?id=eq.${h1.helper.id}`, "PATCH", { on_duty: true });
  const orphanKey = crypto.randomUUID();
  const orphanId = await deriveRequestId(orphanKey);
  fx.created.requestIds.add(orphanId);
  await db("service_requests", "POST", { id: orphanId, ...fx.requestPayload(C.publicId, "en", "orphan"), customer_display_name: `ORPHAN ${runId}`, status: "SEARCHING", request_mode: "LEGACY_AUTO_MATCH", selection_mode: "AUTO_MATCH", legacy_unfunded: true });
  const h1BeforeOrphan = autopush.received(h1Ch).length;
  const tReplay = Date.now();
  const replay = await fx.createRequest(C, { key: orphanKey, label: "orphan" });
  await waitFor(async () => (autopush.received(h1Ch).length >= h1BeforeOrphan + 1 ? true : null), 120000, 500);
  const orphanPush = autopush.received(h1Ch).length === h1BeforeOrphan + 1 ? autopush.received(h1Ch).at(-1) : null;
  allPayloads.push(orphanPush);
  await pushTiming("Orphan replay", h1Ch, tReplay, h1BeforeOrphan);
  expect("Orphan recovered on replay: MATCHED and helper pushed once", replay.status === 200 && replay.body.status === "MATCHED" && orphanPush?.type === "HELPER_ASSIGNED", { status: replay.status, body: replay.body });
  const replayAgain = await fx.createRequest(C, { key: orphanKey, label: "orphan" });
  await sleep(10000);
  expect("Further replays send no duplicate push", replayAgain.status === 200 && autopush.received(h1Ch).length === h1BeforeOrphan + 1, autopush.received(h1Ch).length - h1BeforeOrphan);

  // ================= 6. admin recovery / timeout =================
  const recoverAnon = await fetch(`${base}/api/sys/requests/recover`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const recoverPlatform = await fetch(`${base}/api/sys/requests/recover`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${settlementToken}` }, body: "{}" });
  expect("Admin recovery stays operator-only (anon / non-recovery token rejected)", recoverAnon.status === 401 && recoverPlatform.status === 401, [recoverAnon.status, recoverPlatform.status]);
  notTestable("Admin recovery rematch push (live)", "staging has no LIFE_HELP_RECOVERY_TOKEN or SYS session; push wiring covered by test_customer_ownership.mjs");
  record("NOT_APPLICABLE", "Timeout/rematch push", "no runtime path releases assignments with TIMEOUT (lib/db/serverMatching.ts is unused)");

  // ================= payload privacy across every push received =================
  const everything = [...[aCh, bCh, h1Ch, h2Ch].flatMap((c) => autopush.received(c)), ...allPayloads.filter(Boolean)];
  const secrets = [A.publicId, B.publicId, C.publicId, spoof.body.requestId, reqR.body.requestId, orphanId, capB.capability, "PUSH TEST", `${runId} address`, h1.email, h2.email, h1.token, h2.token];
  expect("Push payload privacy: every payload minimal, no ids/names/emails/capabilities/tokens", everything.length >= 6 && everything.every((p) => minimalPayload(p, secrets)), everything.filter((p) => !minimalPayload(p, secrets)));

  // Helper browser: UI unsubscribe.
  if (helperBrowser && h2BrowserEndpoint) {
    await trustedClick(helperBrowser, "push-helper-disable");
    const revoked = await waitFor(async () => ((await subsByEndpoint(h2BrowserEndpoint))[0]?.status === "REVOKED" ? true : null), 20000);
    expect("Helper unsubscribe via UI revokes the row", revoked === true);
  }
} catch (error) {
  record("FAIL", "E2E harness", String(error?.stack || error).slice(0, 500));
} finally {
  for (const b of browsers) if (b) await b.close();
  autopush.close();
  await sleep(500);
  const leftovers = await fx.cleanup();
  expect("Fixture cleanup", Object.values(leftovers).every((n) => n === 0), leftovers);
}
console.log(`INFO autopush reconnects: ${autopush.reconnects}`);
if (summary().FAIL > 0) process.exit(1);

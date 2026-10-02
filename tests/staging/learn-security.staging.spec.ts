import { expect, request as pwRequest, test, type BrowserContext, type Page } from "@playwright/test";
import {
  ANON, BASE, DEMO, PRODUCTION_REF, REF, SERVICE, SUPABASE, authUserId, authUsersWithEmail, correctPayload, deleteFixtureUser, diagnostic,
  exactCount, guestSnapshot, LEARN_TABLES, lesson, onboard, restRows, snapshot, url, type Q, type ScreenHook, type Site,
} from "./helpers";

/**
 * STAGING-ONLY real-browser authority / persistence / responsive suite for the learning platform (the lifecycle itself -
 * sign up, learn, refresh, sign out / in on math and english - is tests/staging/learn-full-flow.staging.spec.ts).
 * Importing ./helpers pins the host (life-help-staging workers.dev) and the Supabase project ref and refuses to run otherwise.
 *
 *   authority:   unauthenticated writes, cross-user access, forged client fields, replayed attempts / completions (idempotency),
 *                direct PostgREST access with a student's own token (RLS / grants), cross-origin POST
 *   exposure:    service-role / secret / production-ref / JWT scan of every client asset the learning pages load, plus every host
 *                the browser contacted
 *   database:    the browser-visible XP is correlated with learn_xp_ledger / learn_attempts (read-only, server key, fixtures only)
 *   responsive:  320 / 390 / desktop, every screen of the guest flow audited (overflow, clipped controls, console errors, host/path)
 *
 * Run: npx playwright test -c playwright.staging.config.ts tests/staging/learn-security.staging.spec.ts
 */
const stamp = Date.now();
const rand = () => Math.random().toString(36).slice(2);
const account = (tag: string) => ({ email: `learn.sec.${tag}.${stamp}@example.test`, password: `LH-${rand()}-${stamp}!` });
const A = account("a");
const B = account("b");

type ApiResult = { status: number; json: any };
async function api(page: Page, action: string, body: object): Promise<ApiResult> {
  return page.evaluate(async ({ action, body }) => {
    const r = await fetch(`/api/learn/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let json: unknown = null;
    try { json = await r.json(); } catch { /* no body */ }
    return { status: r.status, json };
  }, { action, body });
}
function wrongPayload(q: Q): string | string[] {
  if (q.type === "multiple_choice") return q.options!.find((o) => o.id !== q.answer.id)!.id;
  if (q.type === "true_false") return q.answer.id === "true" ? "false" : "true";
  if (q.type === "numeric") return "987654";
  if (q.type === "ordering") return [...q.answer.ids!].reverse();
  return "zzzzzz";
}
const demoQ = (site: Site, id: string) => (DEMO[site].questions as unknown as Q[]).find((q) => q.id === id)!;
const ledger = async (userId: string, site: Site) => {
  const rows = await restRows<{ source_type: string; source_id: string; xp: number }>("learn_xp_ledger", `user_id=eq.${userId}&site=eq.${site}&select=source_type,source_id,xp`);
  return { rows: rows.length, sum: rows.reduce((s, r) => s + r.xp, 0), keys: new Set(rows.map((r) => `${r.source_type}|${r.source_id}`)).size };
};
const attemptsCount = async (userId: string) => (await restRows("learn_attempts", `user_id=eq.${userId}&select=user_id`)).length;

// Marketplace / payment / provider tables that must stay untouched by anything the learning suite does (counts only).
const MONEY_TABLES = ["orders", "payments", "payment_intents", "payment_events", "payment_quotes", "payout_obligations", "payout_destinations", "money_movement_jobs", "money_movement_attempts", "point_ledger", "refunds", "provider_events", "provider_payment_links", "payment_chain_transactions", "settlement_transactions", "service_requests"];
const IDENTITY_TABLES = ["profiles", "user_roles", "public_user_identities"];
async function countsOf(tables: string[]): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  for (const t of tables) out[t] = await exactCount(t).catch(() => null);
  return out;
}

test.describe.serial("staging authority: unauthenticated / cross-user / forged / replay, secrets, database correlation", () => {
  let ctxA: BrowserContext, ctxB: BrowserContext;
  let pageA: Page, pageB: Page;
  let idA: string | null = null, idB: string | null = null;
  const consoleErrors: string[] = [];
  const hosts = new Set<string>();
  let moneyBefore: Record<string, number | null> = {};
  let identityBefore: Record<string, number | null> = {};
  const record = (label: string) => (page: Page) => {
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${label}: ${m.text().slice(0, 160)}`); });
    page.on("pageerror", (e) => consoleErrors.push(`${label}: pageerror ${e.message.slice(0, 160)}`));
    page.on("request", (r) => hosts.add(new URL(r.url()).host));
  };
  const lessonState: { id: string; sessionId: string; questions: string[]; xpAttempts: number; xpComplete: number } = { id: "", sessionId: "", questions: [], xpAttempts: 0, xpComplete: 0 };

  test.beforeAll(async ({ browser }) => {
    moneyBefore = await countsOf(MONEY_TABLES);
    identityBefore = await countsOf(IDENTITY_TABLES);
    ctxA = await browser.newContext();
    ctxB = await browser.newContext();
    pageA = await ctxA.newPage();
    pageB = await ctxB.newPage();
    record("A")(pageA);
    record("B")(pageB);
  });

  test.afterAll(async () => {
    try {
      idA = idA ?? (await authUserId(A.email));
      idB = idB ?? (await authUserId(B.email));
      await deleteFixtureUser(idA);
      await deleteFixtureUser(idB);
    } finally {
      await ctxA?.close();
      await ctxB?.close();
    }
  });

  async function signUp(page: Page, who: { email: string; password: string }) {
    await page.goto(url("math", "/login"));
    await expect(page.getByText("계정 기능은 아직 준비 중이에요")).toHaveCount(0);
    await page.getByRole("button", { name: /처음이에요/ }).click();
    await page.locator("#email").fill(who.email);
    await page.locator("#password").fill(who.password);
    await page.getByRole("button", { name: "가입하기", exact: true }).click();
    await expect(page).toHaveURL(url("math", "/dashboard"), { timeout: 30_000 });
  }

  test("identity: the staging Worker is the target, the guard resolves APP_ENV=staging, and the Worker writes to the staging project", async () => {
    expect(new URL(BASE).host).toBe("life-help-staging.simpl2eye.workers.dev");
    expect(SUPABASE).toContain(REF);
    // path-mode /study/<site> is served only when the runtime guard resolved APP_ENV=staging (production builds answer 404 on this host).
    for (const site of ["math", "english"] as const) expect((await fetch(url(site, "/"))).status, `${site} path mode`).toBe(200);
    expect((await fetch(`${BASE}/api/learn/state`, { method: "POST", headers: { "Content-Type": "application/json", Origin: BASE }, body: JSON.stringify({ site: "math" }) })).status).toBe(200);
  });

  test("two disposable students sign up through the real UI; each exists once in STAGING Auth", async () => {
    await signUp(pageA, A);
    await signUp(pageB, B);
    idA = await authUserId(A.email);
    idB = await authUserId(B.email);
    expect(idA, "student A exists in the staging Auth project").toBeTruthy();
    expect(idB, "student B exists in the staging Auth project").toBeTruthy();
    expect(idA).not.toBe(idB);
    expect((await snapshot(pageA, "math")).totalXp).toBe(0);
    expect((await snapshot(pageB, "math")).totalXp).toBe(0);
  });

  test("A: real diagnostic through the UI; the +30 XP bonus is a ledger row owned by A", async () => {
    await onboard(pageA, "math");
    await diagnostic(pageA, "math");
    const snap = await snapshot(pageA, "math");
    expect(snap.totalXp).toBe(30);
    const l = await ledger(idA!, "math");
    expect(l.sum, "browser-visible XP equals the ledger sum").toBe(30);
    expect(l.rows).toBe(l.keys); // no duplicate idempotency keys
    const href = await pageA.getByRole("link", { name: /^▶ 계속 학습하기/ }).getAttribute("href");
    lessonState.id = href!.split("/lesson/")[1];
    expect(lessonState.id).toBeTruthy();
  });

  test("server answer validation: a forged wrong attempt (client claims correct + XP) is judged by the server and awards nothing", async () => {
    const started = await api(pageA, "start", { site: "math", kind: "lesson", lessonId: lessonState.id });
    expect(started.status).toBe(200);
    expect(JSON.stringify(started.json)).not.toMatch(/"answer"|"explanation"|"hints"/);
    lessonState.sessionId = started.json.sessionId;
    lessonState.questions = started.json.questions.map((q: { id: string }) => q.id);
    const before = await ledger(idA!, "math");
    const before401 = await attemptsCount(idA!);
    const q = demoQ("math", lessonState.questions[0]);
    const forged = await api(pageA, "attempt", {
      site: "math", sessionId: lessonState.sessionId, questionId: q.id, answer: wrongPayload(q),
      correct: true, isCorrect: true, xp: 9999, totalXp: 99999, delta: { xp: 9999 }, state: { totalXp: 99999 }, attemptNo: 1,
    });
    expect(forged.status).toBe(200);
    expect(forged.json.correct, "the browser's claim is ignored; the server checked the answer").toBe(false);
    const after = await ledger(idA!, "math");
    expect(after.sum, "no XP for a wrong answer / forged fields").toBe(before.sum);
    expect(after.sum).toBeLessThan(1000);
    expect(await attemptsCount(idA!), "the wrong attempt is recorded server-side").toBe(before401 + 1);
    expect((await snapshot(pageA, "math")).totalXp).toBe(before.sum);
  });

  test("direct client state forgery: a signed-in student's request body state never overrides the database", async () => {
    const forged = await api(pageA, "state", { site: "math", state: { totalXp: 99999, coins: 99999, mastery: {}, lessons: {} } });
    expect(forged.status).toBe(200);
    expect(forged.json.state.totalXp).toBe(30);
  });

  test("idempotency: a replayed correct attempt is rejected and does not double-award; completion awards once, a replayed completion awards nothing", async () => {
    const q0 = demoQ("math", lessonState.questions[0]);
    const first = await api(pageA, "attempt", { site: "math", sessionId: lessonState.sessionId, questionId: q0.id, answer: correctPayload(q0) });
    expect(first.status).toBe(200);
    expect(first.json.correct).toBe(true);
    lessonState.xpAttempts += first.json.delta.xp;
    const afterFirst = await ledger(idA!, "math");
    const replay = await api(pageA, "attempt", { site: "math", sessionId: lessonState.sessionId, questionId: q0.id, answer: correctPayload(q0) });
    expect(replay.status, "replayed attempt on a resolved question").toBe(409);
    expect(await ledger(idA!, "math"), "replay changed nothing").toEqual(afterFirst);

    if (lessonState.questions.length > 1) {
      const early = await api(pageA, "complete", { site: "math", sessionId: lessonState.sessionId, lessonId: lessonState.id, firstTryCorrect: 99 });
      expect(early.status, "completion before every question is resolved").toBe(409);
      expect(await ledger(idA!, "math")).toEqual(afterFirst);
    }
    for (const id of lessonState.questions.slice(1)) {
      const q = demoQ("math", id);
      const r = await api(pageA, "attempt", { site: "math", sessionId: lessonState.sessionId, questionId: id, answer: correctPayload(q) });
      expect(r.json.correct, id).toBe(true);
      lessonState.xpAttempts += r.json.delta.xp;
    }
    const done = await api(pageA, "complete", { site: "math", sessionId: lessonState.sessionId, lessonId: lessonState.id, firstTryCorrect: 0 /* ignored: the server counts */ });
    expect(done.status).toBe(200);
    lessonState.xpComplete = done.json.delta.xp;
    expect(lessonState.xpComplete).toBeGreaterThan(0);
    const afterDone = await ledger(idA!, "math");
    expect(afterDone.sum, "30 (diagnostic) + per-attempt XP + completion XP").toBe(30 + lessonState.xpAttempts + lessonState.xpComplete);
    expect(afterDone.rows, "no duplicate ledger keys").toBe(afterDone.keys);

    const again = await api(pageA, "complete", { site: "math", sessionId: lessonState.sessionId, lessonId: lessonState.id });
    expect(again.status).toBe(200);
    expect(again.json.delta.xp, "replayed completion awards nothing").toBe(0);
    expect(await ledger(idA!, "math"), "replayed completion left the ledger untouched").toEqual(afterDone);
    expect((await snapshot(pageA, "math")).totalXp).toBe(afterDone.sum);
  });

  test("persistence: hard refresh, navigate away and back, sign out and in - XP / mastery / progress unchanged, still ONE identity", async () => {
    const snap = await snapshot(pageA, "math");
    expect(snap.totalXp).toBeGreaterThan(30);
    expect(snap.mastery).toBeGreaterThan(0);
    await pageA.goto(url("math", "/dashboard"));
    await pageA.reload();
    expect(await snapshot(pageA, "math")).toEqual(snap);
    await pageA.goto(url("english", "/dashboard"));
    await pageA.goto(url("math", "/dashboard"));
    expect(await snapshot(pageA, "math")).toEqual(snap);
    await pageA.goto(url("math", "/profile"));
    await pageA.getByRole("button", { name: "로그아웃" }).click();
    await expect(pageA).toHaveURL(new RegExp(`/study/math/?$`));
    expect((await snapshot(pageA, "math")).totalXp, "signed out = guest").toBe(0);
    await pageA.goto(url("math", "/login"));
    await pageA.locator("#email").fill(A.email);
    await pageA.locator("#password").fill(A.password);
    await pageA.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(pageA).toHaveURL(url("math", "/dashboard"));
    expect(await snapshot(pageA, "math")).toEqual(snap);
    expect(await authUsersWithEmail(A.email), "logout/login created no second identity").toBe(1);
    expect((await restRows("learn_student_profiles", `user_id=eq.${idA}&select=user_id`)).length).toBe(1);
  });

  test("cross-user isolation: B cannot read or write A's session / progress", async () => {
    const aBefore = { ledger: await ledger(idA!, "math"), attempts: await attemptsCount(idA!) };
    await pageB.goto(url("math", "/dashboard"));
    const bState = await api(pageB, "state", { site: "math", state: { totalXp: 12345 } });
    expect(bState.json.state.totalXp, "B sees B's own (empty) progress, not A's and not the forged value").toBe(0);
    const q0 = demoQ("math", lessonState.questions[0]);
    const stolenAttempt = await api(pageB, "attempt", { site: "math", sessionId: lessonState.sessionId, questionId: q0.id, answer: correctPayload(q0) });
    expect(stolenAttempt.status, "B posting into A's session").toBe(403);
    const stolenComplete = await api(pageB, "complete", { site: "math", sessionId: lessonState.sessionId, lessonId: lessonState.id });
    expect(stolenComplete.status, "B completing A's session").toBe(403);
    expect({ ledger: await ledger(idA!, "math"), attempts: await attemptsCount(idA!) }, "A's records unchanged").toEqual(aBefore);
    for (const table of LEARN_TABLES.filter((t) => t !== "learn_student_profiles")) {
      expect((await restRows(table, `user_id=eq.${idB}&select=user_id`)).length, `B has no ${table} rows from A's data`).toBe(0);
    }
  });

  test("unauthenticated: no cookies = guest; nothing is written for anyone, a cross-origin POST is refused", async () => {
    const aBefore = { ledger: await ledger(idA!, "math"), attempts: await attemptsCount(idA!) };
    const anon = await pwRequest.newContext({ baseURL: BASE });
    try {
      const q0 = demoQ("math", lessonState.questions[0]);
      const guest = await anon.post("/api/learn/attempt", { headers: { Origin: BASE }, data: { site: "math", sessionId: lessonState.sessionId, questionId: q0.id, answer: correctPayload(q0), state: { totalXp: 5000 } } });
      expect(JSON.stringify(await guest.json())).not.toContain(String(idA)); // never reveals A's identity
      const state = await anon.post("/api/learn/state", { headers: { Origin: BASE }, data: { site: "math" } });
      expect((await state.json()).state.totalXp, "an unauthenticated caller does not get A's progress").toBe(0);
      const evil = await anon.post("/api/learn/attempt", { headers: { Origin: "https://evil.example" }, data: { site: "math", sessionId: lessonState.sessionId, questionId: q0.id, answer: correctPayload(q0) } });
      expect(evil.status(), "cross-origin POST").toBe(403);
      const noOrigin = await anon.post("/api/learn/complete", { data: { site: "math", sessionId: lessonState.sessionId, lessonId: lessonState.id } });
      expect(noOrigin.status(), "POST without an Origin / same-origin fetch metadata").toBe(403);
    } finally {
      await anon.dispose();
    }
    expect({ ledger: await ledger(idA!, "math"), attempts: await attemptsCount(idA!) }, "no write for A from an unauthenticated caller").toEqual(aBefore);
  });

  test("direct database access with a student's own token or the public key cannot read others' progress or award XP (RLS / grants)", async () => {
    test.skip(!ANON, "TEST_SUPABASE_ANON_KEY not set");
    const tokenResp = await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email: B.email, password: B.password }) });
    expect(tokenResp.status).toBe(200);
    const bToken = (await tokenResp.json()).access_token as string;
    const rest = (token: string | null) => (path: string, init: RequestInit = {}) => fetch(`${SUPABASE}/rest/v1/${path}`, { ...init, headers: { apikey: ANON, ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) } });
    const aBefore = await ledger(idA!, "math");
    const readable = async (r: Response) => { const t = await r.text(); try { const j = JSON.parse(t); return Array.isArray(j) ? j.length : -1; } catch { return -1; } };
    for (const [label, call] of [["student B token", rest(bToken)], ["public key only", rest(null)]] as const) {
      for (const table of ["learn_xp_ledger", "learn_attempts", "learn_skill_mastery", "learn_sessions", "learn_student_profiles"]) {
        const r = await call(`${table}?user_id=eq.${idA}&select=user_id`);
        expect([401, 403, 200], `${label} read ${table}`).toContain(r.status);
        if (r.status === 200) expect(await readable(r), `${label} sees none of A's ${table} rows`).toBe(0);
      }
      const forge = await call("learn_xp_ledger", { method: "POST", body: JSON.stringify({ user_id: idB, site: "math", source_type: "forged", source_id: `forge-${stamp}`, xp: 9999, day: "2026-10-02" }) });
      expect(forge.status, `${label}: inserting an XP row directly must be refused`).toBeGreaterThanOrEqual(400);
      const patch = await call(`learn_xp_ledger?user_id=eq.${idA}`, { method: "PATCH", body: JSON.stringify({ xp: 99999 }) });
      expect(patch.status === 200 ? await readable(patch) : 0, `${label}: updating A's ledger touches no row`).toBe(0);
      const del = await call(`learn_xp_ledger?user_id=eq.${idA}`, { method: "DELETE" });
      expect(del.status === 200 ? await readable(del) : 0, `${label}: deleting A's ledger touches no row`).toBe(0);
    }
    expect(await ledger(idA!, "math"), "A's ledger untouched").toEqual(aBefore);
    expect(await restRows("learn_xp_ledger", `user_id=eq.${idB}&select=id`), "no forged XP row exists for B").toEqual([]);
  });

  test("secrets: no service-role / secret key, production ref or server credential in any client asset or page; browser never talks to Supabase", async () => {
    const pages: { name: string; html: string }[] = [];
    for (const site of ["math", "english"] as const) {
      for (const p of ["/", "/login", "/dashboard"]) pages.push({ name: `anon ${site}${p}`, html: await (await fetch(url(site, p))).text() });
    }
    for (const p of ["/dashboard", "/profile"]) {
      await pageA.goto(url("math", p));
      pages.push({ name: `A math${p}`, html: await pageA.content() });
    }
    const assets = new Set<string>();
    for (const { html } of pages) for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)) assets.add(m[1]);
    const bodies = pages.map((p) => ({ name: p.name, text: p.html }));
    for (const a of assets) bodies.push({ name: a, text: await (await fetch(`${BASE}${a}`)).text() });
    expect(assets.size, "client assets were scanned").toBeGreaterThan(5);
    const findings: string[] = [];
    const jwt = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
    for (const { name, text } of bodies) {
      if (text.includes(SERVICE)) findings.push(`${name}: the server key value`);
      if (/sb_secret_/.test(text)) findings.push(`${name}: sb_secret_ token`);
      if (text.includes(PRODUCTION_REF)) findings.push(`${name}: production ref`);
      if (/LEARN_SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(text)) findings.push(`${name}: server credential variable name`);
      for (const m of text.matchAll(jwt)) {
        try { if (JSON.parse(Buffer.from(m[0].split(".")[1], "base64url").toString()).role === "service_role") findings.push(`${name}: a service_role JWT`); } catch { /* not a JWT */ }
      }
    }
    expect(findings, "exposure findings").toEqual([]);
    const contacted = [...hosts];
    expect(contacted.filter((h) => h.endsWith(".supabase.co") || h.includes(PRODUCTION_REF)), "the learning browser never talks to Supabase directly (all through the same-origin API)").toEqual([]);
    console.log(`secret scan: ${bodies.length} bodies (${assets.size} assets); hosts contacted by the browser: ${contacted.join(", ")}`);
  });

  test("database correlation: ledger sum = browser-visible XP, one key per event, owned by A, nothing in money / provider tables changed", async () => {
    const snap = await snapshot(pageA, "math");
    const l = await ledger(idA!, "math");
    expect(l.sum).toBe(snap.totalXp);
    expect(l.rows).toBe(l.keys);
    const owners = await restRows<{ user_id: string }>("learn_xp_ledger", `site=eq.math&source_id=in.(${lessonState.sessionId},${lessonState.id})&select=user_id`);
    for (const o of owners) expect(o.user_id).toBe(idA);
    for (const table of ["learn_attempts", "learn_skill_mastery", "learn_lesson_progress", "learn_sessions", "learn_streaks", "learn_progress_meta"]) {
      expect((await restRows(table, `user_id=eq.${idA}&select=user_id`)).length, `${table} has rows for A`).toBeGreaterThan(0);
    }
    expect(await authUsersWithEmail(A.email)).toBe(1);
    expect(await authUsersWithEmail(B.email)).toBe(1);
    const moneyAfter = await countsOf(MONEY_TABLES);
    expect(moneyAfter, "money / payment / provider tables: row counts unchanged").toEqual(moneyBefore);
    const identityAfter = await countsOf(IDENTITY_TABLES);
    console.log(`identity-table counts before ${JSON.stringify(identityBefore)} after ${JSON.stringify(identityAfter)} (sign-up side effects only; removed with the fixture users)`);
    console.log(`money-table counts (unchanged): ${JSON.stringify(moneyAfter)}`);
    console.log(`A math: browser XP ${snap.totalXp} = ledger sum ${l.sum} over ${l.rows} rows; mastery ${snap.mastery}, lessons ${snap.lessons}`);
  });

  test("no runtime / console errors during the authenticated flows, other than the deliberate rejected requests", async () => {
    // The browser logs "Failed to load resource ... 409 / 403" for the negative-path requests this suite sends on purpose:
    // A: the replayed attempt and the early completion (409 x2); B: posting into / completing A's session (403 x2).
    const expected = (label: string, code: number) => consoleErrors.filter((e) => e.startsWith(`${label}: Failed to load resource`) && e.includes(`status of ${code}`)).length;
    expect(expected("A", 409), "A: replay + early completion were rejected with 409").toBe(2);
    expect(expected("B", 403), "B: both cross-user writes were rejected with 403").toBe(2);
    expect(consoleErrors.filter((e) => !/^[AB]: Failed to load resource: the server responded with a status of (409|403)/.test(e)), "unexpected console / runtime errors").toEqual([]);
  });
});

/* ------------------------------------------- responsive ------------------------------------------- */
const VIEWPORTS = [
  { name: "mobile 320", width: 320, height: 640, mobile: true },
  { name: "mobile 390", width: 390, height: 844, mobile: true },
  { name: "desktop 1280", width: 1280, height: 800, mobile: false },
];

async function audit(page: Page, site: Site, label: string, vp: { width: number; mobile: boolean }, problems: string[], seen: { screens: number; minTarget: number; katex: number }) {
  seen.screens++;
  const r = await page.evaluate(({ site, width }) => {
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth + 1) out.push(`horizontal page overflow ${doc.scrollWidth} > ${window.innerWidth}`);
    const scrollParent = (el: Element) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === "auto" || o === "scroll") && p.scrollWidth > p.clientWidth) return true; } return false; };
    let minTarget = 9999;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select, [role=radio], [role=button]"))) {
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
      const b = el.getBoundingClientRect(); if (b.width === 0 || b.height === 0) continue;
      if (el.closest(".l-sr")) continue;
      const name = `${el.tagName.toLowerCase()}[${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24)}]`;
      if (b.right <= 0) continue; // positioned off-screen on purpose (the "skip to content" link is shown on focus only)
      if ((b.left < -1 || b.right > width + 1) && !scrollParent(el)) out.push(`clipped control ${name} (${Math.round(b.left)}..${Math.round(b.right)} of ${width})`);
      if (el.matches("button, [role=radio], input:not([type=hidden])") && !el.matches("[disabled]")) minTarget = Math.min(minTarget, Math.round(b.height));
    }
    for (const d of Array.from(document.querySelectorAll<HTMLElement>("[role=dialog], dialog[open]"))) { const b = d.getBoundingClientRect(); if (b.left < -1 || b.right > width + 1) out.push("dialog overflows the viewport"); }
    for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
      const h = a.getAttribute("href")!; if (h.startsWith("#") || h.startsWith("mailto:")) continue;
      const u = new URL(h, location.href);
      if (u.host !== location.host) out.push(`link leaves the host: ${h}`);
      else if (!/^\/study\/(math|english)(\/|$)/.test(u.pathname) && !u.pathname.startsWith("/logos/")) out.push(`link leaves the learning site: ${h}`);
    }
    const katex = Array.from(document.querySelectorAll<HTMLElement>(".katex"));
    for (const k of katex) { const b = k.getBoundingClientRect(); if (b.width === 0) out.push("math notation rendered with zero width"); else if ((b.right > width + 1 || b.left < -1) && !scrollParent(k)) out.push(`math notation clipped (${Math.round(b.left)}..${Math.round(b.right)} of ${width})`); }
    return { out, minTarget, katex: katex.length };
  }, { site, width: vp.width });
  for (const p of r.out) problems.push(`${label}: ${p}`);
  seen.minTarget = Math.min(seen.minTarget, r.minTarget);
  seen.katex += r.katex;
}

for (const vp of VIEWPORTS) {
  for (const site of ["math", "english"] as const) {
    test(`responsive ${vp.name} - ${site}: landing -> onboarding -> diagnostic -> dashboard -> lesson (wrong, hint, correct) -> result`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
      const page = await context.newPage();
      const problems: string[] = [];
      const errors: string[] = [];
      const seen = { screens: 0, minTarget: 9999, katex: 0 };
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
      page.on("pageerror", (e) => errors.push(`pageerror ${e.message.slice(0, 160)}`));
      const hook: ScreenHook = (label) => audit(page, site, `${vp.name}/${site}/${label}`, vp, problems, seen);
      try {
        await page.goto(url(site, "/"));
        await expect(page.locator(".l-brand").first()).toBeVisible();
        await hook("landing");
        await onboard(page, site, hook);
        await diagnostic(page, site, hook);
        await lesson(page, site, hook);
        await page.goto(url(site, "/dashboard"));
        await hook("dashboard (after lesson)");
        const guest = await guestSnapshot(page, site);
        expect(guest.totalXp).toBeGreaterThan(30);
      } finally {
        await context.close();
      }
      console.log(`${vp.name}/${site}: ${seen.screens} screens audited, smallest control height ${seen.minTarget}px, math notation nodes ${seen.katex}`);
      expect(problems, "layout problems").toEqual([]);
      expect(errors, "console / runtime errors").toEqual([]);
      if (vp.mobile) expect(seen.minTarget, "answer / action controls stay tappable").toBeGreaterThanOrEqual(40);
    });
  }
}

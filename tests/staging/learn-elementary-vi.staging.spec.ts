import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  BASE, DEMO, authUserId, authUsersWithEmail, correctPayload, deleteFixtureUser, dict, exactCount, restRows, snapshot, url,
  type Grade, type Locale, type Q, type ScreenHook, type Site,
} from "./helpers";
import { diagnostic, lesson, onboard } from "./flow";

/**
 * STAGING-ONLY real-account suite for the two newest capabilities (elementary grades E1..E6, Vietnamese locale). Importing ./helpers
 * pins the host and the Supabase project and refuses to run otherwise. Everything the lifecycle / security suites prove for middle / high
 * Korean mode is proven again here for elementary and Vietnamese mode: sign-up through the real UI, server-judged answers, XP / mastery
 * persistence across refresh and sign out / in, replay idempotency, cross-user isolation, grade scoping on the deployed Worker, and the
 * database rows (including the elementary grade stored by migration 027). Fixtures are disposable and purged.
 */
const stamp = Date.now();
const rand = () => Math.random().toString(36).slice(2);
const account = (tag: string) => ({ email: `learn.elem.${tag}.${stamp}@example.test`, password: `LH-${rand()}-${stamp}!` });
const HANGUL = /[가-힣]/;
const MONEY = ["orders", "payments", "payment_intents", "payment_events", "payout_obligations", "money_movement_jobs", "point_ledger", "service_requests", "refunds", "provider_events"];

type ApiResult = { status: number; json: any };
async function api(page: Page, action: string, body: object): Promise<ApiResult> {
  return page.evaluate(async ({ action, body }) => {
    const r = await fetch(`/api/learn/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let json: unknown = null;
    try { json = await r.json(); } catch { /* no body */ }
    return { status: r.status, json };
  }, { action, body });
}
/** The lesson the dashboard's "continue" button opens: the first one that is unlocked and not yet cleared for THIS student. */
async function currentLessonId(page: Page, site: Site, locale: Locale = "ko"): Promise<string> {
  await page.goto(url(site, "/dashboard"));
  const href = await page.getByRole("link", { name: new RegExp(`^▶ ${dict(locale)["dash.continue"]}`) }).getAttribute("href");
  return href!.split("/lesson/")[1];
}
const bank = (site: Site) => DEMO[site].questions as unknown as Q[];
const ledger = async (userId: string, site: Site) => {
  const rows = await restRows<{ source_type: string; source_id: string; xp: number }>("learn_xp_ledger", `user_id=eq.${userId}&site=eq.${site}&select=source_type,source_id,xp`);
  return { rows: rows.length, sum: rows.reduce((s, r) => s + r.xp, 0), keys: new Set(rows.map((r) => `${r.source_type}|${r.source_id}`)).size };
};

async function signUp(page: Page, who: { email: string; password: string }, locale: Locale = "ko") {
  const t = dict(locale);
  if (locale === "vi") {
    await page.goto(url("math", "/"));
    await page.getByRole("radio", { name: "Tiếng Việt" }).first().click();
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
    await page.getByRole("link", { name: t["landing.cta.login"] }).click();
  } else await page.goto(url("math", "/login"));
  await expect(page.getByText(t["auth.unavailable"])).toHaveCount(0); // accounts are enabled on the Worker
  await page.getByRole("button", { name: t["auth.switch.signup"] }).click();
  await page.locator("#email").fill(who.email);
  await page.locator("#password").fill(who.password);
  await page.getByRole("button", { name: t["auth.submit.signup"], exact: true }).click();
  await expect(page).toHaveURL(url("math", "/dashboard"), { timeout: 30_000 });
}
async function signOutIn(page: Page, who: { email: string; password: string }, site: Site, locale: Locale) {
  const t = dict(locale);
  await page.goto(url(site, "/profile"));
  await page.getByRole("button", { name: t["profile.logout"] }).click();
  await expect(page).toHaveURL(new RegExp(`/study/${site}/?$`));
  await page.goto(url(site, "/login"));
  await page.locator("#email").fill(who.email);
  await page.locator("#password").fill(who.password);
  await page.getByRole("button", { name: t["auth.submit.login"], exact: true }).click();
  await expect(page).toHaveURL(url(site, "/dashboard"));
}

test.describe.serial("elementary + Vietnamese on the deployed staging Worker: real accounts", () => {
  const low = account("e1");
  const up = account("e6");
  const vn = account("vi");
  let ctx: Record<string, BrowserContext> = {};
  let pages: Record<string, Page> = {};
  const ids: Record<string, string | null> = { low: null, up: null, vn: null };
  const consoleErrors: string[] = [];
  let moneyBefore: Record<string, number | null> = {};
  const counts = async () => Object.fromEntries(await Promise.all(MONEY.map(async (t) => [t, await exactCount(t).catch(() => null)])));

  test.beforeAll(async ({ browser }) => {
    moneyBefore = await counts();
    for (const k of ["low", "up", "vn"]) {
      ctx[k] = await browser.newContext();
      pages[k] = await ctx[k].newPage();
      pages[k].on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${k}: ${m.text().slice(0, 140)}`); });
      pages[k].on("pageerror", (e) => consoleErrors.push(`${k}: pageerror ${e.message.slice(0, 140)}`));
    }
  });
  test.afterAll(async () => {
    try {
      for (const [k, who] of [["low", low], ["up", up], ["vn", vn]] as const) {
        ids[k] = ids[k] ?? (await authUserId(who.email));
        await deleteFixtureUser(ids[k]);
        expect(await authUsersWithEmail(who.email), `${k} fixture user removed`).toBe(0);
      }
    } finally {
      for (const c of Object.values(ctx)) await c.close();
    }
  });

  test("the deployed onboarding offers all 12 grades in two groups, Korean and Vietnamese", async ({ page }) => {
    await page.goto(url("math", "/onboarding"));
    await page.locator("#nick").fill("테스터");
    await page.getByRole("button", { name: dict("ko")["onboarding.next"] }).click();
    for (const g of ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"]) await expect(page.getByRole("radio", { name: g, exact: true }), g).toBeVisible();
    await expect(page.locator(".l-grade")).toHaveCount(12);
    await page.getByRole("radio", { name: "Tiếng Việt" }).first().click();
    for (let n = 1; n <= 12; n++) await expect(page.getByRole("radio", { name: `Lớp ${n}`, exact: true }), `Lớp ${n}`).toBeVisible();
  });

  test("MATH, lower elementary (E1): sign up, placement + lesson from the E1 course, XP / mastery saved, refresh keeps them", async () => {
    const page = pages.low;
    await signUp(page, low);
    ids.low = await authUserId(low.email);
    expect(ids.low).toBeTruthy();
    await onboard(page, "math", undefined, { grade: "E1" });
    await diagnostic(page, "math", undefined, { grade: "E1" });
    const gained = await lesson(page, "math", undefined, { grade: "E1" });
    const snap = await snapshot(page, "math");
    expect(snap.totalXp).toBe(30 + gained);
    expect(snap.mastery).toBeGreaterThan(0);
    await page.goto(url("math", "/dashboard"));
    await page.reload();
    expect(await snapshot(page, "math")).toEqual(snap);
    const l = await ledger(ids.low!, "math");
    expect(l.sum, "browser XP = ledger sum").toBe(snap.totalXp);
    expect(l.rows, "one ledger row per event").toBe(l.keys);
    // the elementary grade is a real database row (migration 027 widened the CHECK constraint)
    const prof = await restRows<{ grade: string }>("learn_student_profiles", `user_id=eq.${ids.low}&select=grade`);
    expect(prof).toEqual([{ grade: "E1" }]);
  });

  test("ENGLISH, lower elementary (E1), same account: its own course, progress per subject, persists across sign out / in", async () => {
    const page = pages.low;
    await page.goto(url("english", "/dashboard"));
    expect((await snapshot(page, "english")).totalXp).toBe(0);
    await page.goto(url("english", "/diagnostic"));
    await expect(page.getByRole("heading", { name: dict("ko")["diag.intro.title"] })).toBeVisible();
    await diagnostic(page, "english", undefined, { grade: "E1" });
    const gained = await lesson(page, "english", undefined, { grade: "E1" });
    const snap = await snapshot(page, "english");
    expect(snap.totalXp).toBe(30 + gained);
    const mathSnap = await snapshot(page, "math");
    await signOutIn(page, low, "english", "ko");
    expect(await snapshot(page, "english")).toEqual(snap);
    expect(await snapshot(page, "math")).toEqual(mathSnap);
    expect(await authUsersWithEmail(low.email), "re-login created no second identity").toBe(1);
  });

  test("MATH, upper elementary (E6): own course, 6-question placement from E6, lesson, persistence", async () => {
    const page = pages.up;
    await signUp(page, up);
    ids.up = await authUserId(up.email);
    await onboard(page, "math", undefined, { grade: "E6" });
    await diagnostic(page, "math", undefined, { grade: "E6" });
    const gained = await lesson(page, "math", undefined, { grade: "E6" });
    const snap = await snapshot(page, "math");
    expect(snap.totalXp).toBe(30 + gained);
    await page.reload();
    expect(await snapshot(page, "math")).toEqual(snap);
    expect((await ledger(ids.up!, "math")).sum).toBe(snap.totalXp);
    expect(await restRows("learn_student_profiles", `user_id=eq.${ids.up}&select=grade`)).toEqual([{ grade: "E6" }]);
  });

  test("ENGLISH, upper elementary (E6), same account", async () => {
    const page = pages.up;
    await page.goto(url("english", "/diagnostic"));
    await diagnostic(page, "english", undefined, { grade: "E6" });
    const gained = await lesson(page, "english", undefined, { grade: "E6" });
    const snap = await snapshot(page, "english");
    expect(snap.totalXp).toBe(30 + gained);
    expect((await ledger(ids.up!, "english")).sum).toBe(snap.totalXp);
  });

  test("server authority on elementary: forged claims ignored, replay rejected, completion once, grade scoping and cross-user isolation enforced on the Worker", async () => {
    const page = pages.up;
    const intruder = pages.low; // another signed-in student (E1)
    await page.goto(url("math", "/dashboard"));
    const state = await api(page, "state", { site: "math" });
    const startable = (state.json.state.lessons ? Object.keys(state.json.state.lessons) : []).length;
    expect(startable).toBeGreaterThan(0);
    // grade scoping: an E6 student cannot open an E1 / secondary lesson, nor answer another grade's question
    for (const lessonId of ["math-e1-l1", "math-l1"]) expect((await api(page, "start", { site: "math", kind: "lesson", lessonId })).status, lessonId).toBe(404);
    // a fresh E6 session: play it through the API with the server as the judge
    const lessonId = await currentLessonId(page, "math");
    expect(lessonId.startsWith("math-e6-")).toBe(true);
    const started = await api(page, "start", { site: "math", kind: "lesson", lessonId });
    expect(started.status).toBe(200);
    expect(JSON.stringify(started.json)).not.toMatch(/"answer"|"explanation"|"hints"/);
    const qids: string[] = started.json.questions.map((q: { id: string }) => q.id);
    const first = bank("math").find((q) => q.id === qids[0])!;
    const before = (await ledger(ids.up!, "math")).sum;
    const forged = await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: first.id, answer: "987654", correct: true, xp: 99999, delta: { xp: 99999 }, state: { totalXp: 99999 } });
    expect(forged.status).toBe(200);
    expect(forged.json.correct, "the browser's claim is ignored").toBe(false);
    expect((await ledger(ids.up!, "math")).sum).toBe(before);
    const foreign = bank("math").find((q) => q.id.includes("-e1-"))!;
    expect((await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: foreign.id, answer: correctPayload(foreign) })).status, "another grade's question").toBe(404);
    // cross-user: the E1 student cannot post into / complete the E6 student's session
    await intruder.goto(url("math", "/dashboard"));
    expect((await api(intruder, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: first.id, answer: correctPayload(first) })).status).toBe(404); // not in the intruder's (E1) scope
    expect((await api(intruder, "complete", { site: "math", sessionId: started.json.sessionId, lessonId })).status).toBeGreaterThanOrEqual(403);
    // resolve every question, replay one, complete twice
    for (const id of qids) {
      const q = bank("math").find((x) => x.id === id)!;
      const r = await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: id, answer: correctPayload(q) });
      expect(r.json.correct, id).toBe(true);
    }
    expect((await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: qids[0], answer: correctPayload(first) })).status, "replayed attempt").toBe(409);
    const done = await api(page, "complete", { site: "math", sessionId: started.json.sessionId, lessonId });
    expect(done.status).toBe(200);
    expect(done.json.delta.xp).toBeGreaterThan(0);
    const total = (await ledger(ids.up!, "math"));
    const again = await api(page, "complete", { site: "math", sessionId: started.json.sessionId, lessonId });
    expect(again.json.delta.xp, "replayed completion awards nothing").toBe(0);
    expect(await ledger(ids.up!, "math")).toEqual(total);
    expect(total.rows).toBe(total.keys);
  });

  test("VIETNAMESE account: sign up in Vietnamese, Lớp 3 math + english lessons in Vietnamese, locale and progress survive refresh and sign out / in", async () => {
    const page = pages.vn;
    await signUp(page, vn, "vi");
    ids.vn = await authUserId(vn.email);
    await onboard(page, "math", undefined, { locale: "vi", grade: "E3" });
    await diagnostic(page, "math", undefined, { locale: "vi", grade: "E3" });
    const gained = await lesson(page, "math", undefined, { locale: "vi", grade: "E3" });
    const snap = await snapshot(page, "math");
    expect(snap.totalXp).toBe(30 + gained);
    await page.reload();
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi"); // refresh persistence
    await page.goto(url("math", "/profile"));
    await expect(page.getByText("Lớp 3")).toBeVisible();
    // Vietnamese hints and feedback from the deployed API
    const started = await api(page, "start", { site: "math", kind: "lesson", lessonId: await currentLessonId(page, "math", "vi") });
    expect(started.status).toBe(200);
    for (const q of started.json.questions) expect(HANGUL.test(q.prompt), q.prompt).toBe(false);
    const hint = await api(page, "hint", { site: "math", questionId: started.json.questions[0].id, level: 1 });
    expect(HANGUL.test(hint.json.hint), hint.json.hint).toBe(false);
    // sign out / in: same identity, the language choice (browser cookie) and the progress are intact
    await signOutIn(page, vn, "math", "vi");
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
    expect(await snapshot(page, "math")).toEqual(snap);
    expect(await authUsersWithEmail(vn.email)).toBe(1);
    // english in Vietnamese: instructions Vietnamese, target sentences English
    await page.goto(url("english", "/diagnostic"));
    await diagnostic(page, "english", undefined, { locale: "vi", grade: "E3" });
    const gainedEn = await lesson(page, "english", undefined, { locale: "vi", grade: "E3" });
    const snapEn = await snapshot(page, "english");
    expect(snapEn.totalXp).toBe(30 + gainedEn);
    expect(await restRows("learn_student_profiles", `user_id=eq.${ids.vn}&select=grade`)).toEqual([{ grade: "E3" }]);
    // switching back to Korean does not create another identity and keeps the same learner
    await page.goto(url("math", "/profile"));
    await page.getByRole("radio", { name: "한국어" }).first().click();
    await expect(page.getByText("초3")).toBeVisible();
    expect(await snapshot(page, "math")).toEqual(snap);
    expect(await authUsersWithEmail(vn.email)).toBe(1);
  });

  test("database: every elementary / vi fixture owns its rows, ledgers equal browser XP, no duplicate XP keys, money tables untouched", async () => {
    for (const [k, site] of [["low", "math"], ["low", "english"], ["up", "math"], ["up", "english"], ["vn", "math"], ["vn", "english"]] as const) {
      const l = await ledger(ids[k]!, site);
      expect(l.rows, `${k}/${site} ledger rows`).toBeGreaterThan(0);
      expect(l.rows, `${k}/${site} duplicate keys`).toBe(l.keys);
      expect((await restRows("learn_attempts", `user_id=eq.${ids[k]}&site=eq.${site}&select=user_id`)).length, `${k}/${site} attempts`).toBeGreaterThan(0);
    }
    expect(await counts(), "money / payment / provider tables unchanged").toEqual(moneyBefore);
  });

  test("no unexpected console / runtime errors (only the deliberate 404 / 409 probes)", async () => {
    const unexpected = consoleErrors.filter((e) => !/Failed to load resource: the server responded with a status of (404|409|403)/.test(e));
    expect(unexpected).toEqual([]);
  });
});

/* -------------------------------------- responsive: elementary + Vietnamese -------------------------------------- */
for (const [name, width, height, mobile] of [["320", 320, 640, true], ["390", 390, 844, true], ["1280", 1280, 800, false]] as const) {
  for (const locale of ["ko", "vi"] as const) {
    test(`responsive ${name}px (${locale}) on staging: landing, 12-grade picker, learning world and an elementary lesson`, async ({ browser }) => {
      const t = dict(locale);
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage();
      const errors: string[] = [];
      const problems: string[] = [];
      page.on("console", (m) => { if (m.type() === "error" && !/cdn\.jsdelivr|net::/.test(m.text())) errors.push(m.text().slice(0, 120)); });
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
      const audit: ScreenHook = async (label) => {
        const r = await page.evaluate((w) => {
          const out: string[] = [];
          if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`page overflow ${document.documentElement.scrollWidth} > ${innerWidth}`);
          const scrollParent = (el: Element) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === "auto" || o === "scroll") && p.scrollWidth > p.clientWidth) return true; } return false; };
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("button, a[href], input, [role=radio]"))) {
            const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
            const b = el.getBoundingClientRect(); if (b.width === 0 || b.height === 0 || b.right <= 0) continue;
            if ((b.left < -1 || b.right > w + 1) && !scrollParent(el)) out.push(`clipped ${el.tagName.toLowerCase()}[${(el.textContent ?? "").trim().slice(0, 20)}] ${Math.round(b.left)}..${Math.round(b.right)}`);
          }
          for (const k of Array.from(document.querySelectorAll<HTMLElement>(".katex"))) { const b = k.getBoundingClientRect(); if (b.right > w + 1 && !scrollParent(k)) out.push("math notation clipped"); }
          return out;
        }, width);
        for (const p of r) problems.push(`${label}: ${p}`);
      };
      try {
        await page.goto(url("math", "/"));
        if (locale === "vi") await page.getByRole("radio", { name: "Tiếng Việt" }).first().click();
        await audit("landing");
        await page.getByRole("link", { name: t["landing.cta.start"] }).click();
        await page.locator("#nick").fill("An An");
        await page.getByRole("button", { name: t["onboarding.next"] }).click();
        await audit("grade picker (12 grades)");
        await expect(page.locator(".l-grade")).toHaveCount(12);
        for (const g of await page.locator(".l-grade").all()) expect((await g.boundingBox())!.height, "44px+ touch target").toBeGreaterThanOrEqual(44);
        await page.getByRole("radio", { name: t["grade.E2"], exact: true }).click();
        await page.getByRole("button", { name: t["onboarding.next"] }).click();
        await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
        await page.getByRole("button", { name: t["onboarding.next"] }).click();
        await page.getByRole("radio", { name: t["avatar.robot"] }).click();
        await page.getByRole("button", { name: t["onboarding.finish"] }).click();
        await audit("diagnostic intro");
        await page.getByRole("link", { name: t["diag.later"] }).click();
        await audit("dashboard");
        await page.goto(url("math", "/learn"));
        await audit("learning world");
        await page.getByRole("link", { name: new RegExp(t["learn.lesson.start"]) }).first().click();
        await audit("lesson intro");
        await page.getByRole("button", { name: t["lesson.begin"] }).click();
        await expect(page.getByText(new RegExp(t["lesson.question"].split("{")[0].trim()))).toBeVisible();
        await audit("lesson question");
      } finally {
        await context.close();
      }
      expect(problems, "layout problems").toEqual([]);
      expect(errors, "console / runtime errors").toEqual([]);
      void BASE;
    });
  }
}

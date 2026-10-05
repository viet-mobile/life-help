import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  DEMO, authUserId, authUsersWithEmail, correctPayload, deleteFixtureUser, dict, exactCount, restRows, snapshot, url,
  type Locale, type Q, type Site,
} from "./helpers";
import { diagnostic, lesson, onboard } from "./flow";

/**
 * STAGING-ONLY real-account suite for the grade-specific secondary courses (M2, M3, H1, H2, H3). Importing ./helpers pins the host and
 * the Supabase project and refuses to run otherwise. Proves on the deployed Worker, with real accounts and server-judged answers, that
 * each grade gets ITS OWN course (no M1 fallback), in Korean and Vietnamese: placement and lessons come only from that grade, XP and mastery
 * persist across refresh / sign out / in, grade scoping and cross-user isolation hold, and the stored profile grade is the real database row.
 * Fixtures are disposable and purged.
 */
const stamp = Date.now();
const rand = () => Math.random().toString(36).slice(2);
const account = (tag: string) => ({ email: `learn.sec.${tag}.${stamp}@example.test`, password: `LH-${rand()}-${stamp}!` });
const HANGUL = /[가-힣]/;
const MONEY = ["orders", "payments", "payment_intents", "payment_events", "payout_obligations", "money_movement_jobs", "point_ledger", "service_requests", "refunds", "provider_events"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the API bodies are inspected loosely in the assertions below
type ApiResult = { status: number; json: any };
async function api(page: Page, action: string, body: object): Promise<ApiResult> {
  return page.evaluate(async ({ action, body }) => {
    const r = await fetch(`/api/learn/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let json: unknown = null;
    try { json = await r.json(); } catch { /* no body */ }
    return { status: r.status, json };
  }, { action, body });
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
  await expect(page.getByText(t["auth.unavailable"])).toHaveCount(0);
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

test.describe.serial("secondary grades M2..H3 on the deployed staging Worker: real accounts", () => {
  const mid = account("m2");
  const high = account("h1");
  const vn = account("vi");
  const ctx: Record<string, BrowserContext> = {};
  const pages: Record<string, Page> = {};
  const ids: Record<string, string | null> = { mid: null, high: null, vn: null };
  const consoleErrors: string[] = [];
  let moneyBefore: Record<string, number | null> = {};
  const counts = async () => Object.fromEntries(await Promise.all(MONEY.map(async (t) => [t, await exactCount(t).catch(() => null)])));

  test.beforeAll(async ({ browser }) => {
    moneyBefore = await counts();
    for (const k of ["mid", "high", "vn"]) {
      ctx[k] = await browser.newContext();
      pages[k] = await ctx[k].newPage();
      pages[k].on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${k}: ${m.text().slice(0, 140)}`); });
      pages[k].on("pageerror", (e) => consoleErrors.push(`${k}: pageerror ${e.message.slice(0, 140)}`));
    }
  });
  test.afterAll(async () => {
    try {
      for (const [k, who] of [["mid", mid], ["high", high], ["vn", vn]] as const) {
        ids[k] = ids[k] ?? (await authUserId(who.email));
        await deleteFixtureUser(ids[k]);
        expect(await authUsersWithEmail(who.email), `${k} fixture user removed`).toBe(0);
      }
    } finally {
      for (const c of Object.values(ctx)) await c.close();
    }
  });

  test("MATH M2 (중2): sign up, placement + lesson from the M2 course, XP / mastery saved, refresh keeps them, the grade is a real database row", async () => {
    const page = pages.mid;
    await signUp(page, mid);
    ids.mid = await authUserId(mid.email);
    expect(ids.mid).toBeTruthy();
    await onboard(page, "math", undefined, { grade: "M2" });
    await diagnostic(page, "math", undefined, { grade: "M2" });
    const gained = await lesson(page, "math", undefined, { grade: "M2" });
    const snap = await snapshot(page, "math");
    expect(snap.totalXp).toBe(30 + gained);
    expect(snap.mastery).toBeGreaterThan(0);
    await page.goto(url("math", "/dashboard"));
    await page.reload();
    expect(await snapshot(page, "math")).toEqual(snap);
    const l = await ledger(ids.mid!, "math");
    expect(l.sum, "browser XP = ledger sum").toBe(snap.totalXp);
    expect(l.rows, "one ledger row per event").toBe(l.keys);
    expect(await restRows("learn_student_profiles", `user_id=eq.${ids.mid}&select=grade`)).toEqual([{ grade: "M2" }]);
  });

  test("ENGLISH M2, same account: its own course, progress per subject, persists across sign out / in", async () => {
    const page = pages.mid;
    await page.goto(url("english", "/dashboard"));
    expect((await snapshot(page, "english")).totalXp).toBe(0);
    await page.goto(url("english", "/diagnostic"));
    await diagnostic(page, "english", undefined, { grade: "M2" });
    const gained = await lesson(page, "english", undefined, { grade: "M2" });
    const snap = await snapshot(page, "english");
    expect(snap.totalXp).toBe(30 + gained);
    const mathSnap = await snapshot(page, "math");
    await signOutIn(page, mid, "english", "ko");
    expect(await snapshot(page, "english")).toEqual(snap);
    expect(await snapshot(page, "math")).toEqual(mathSnap);
    expect(await authUsersWithEmail(mid.email), "re-login created no second identity").toBe(1);
  });

  test("MATH H1 (고1) and ENGLISH H1, same account: each subject runs its own H1 course", async () => {
    const page = pages.high;
    await signUp(page, high);
    ids.high = await authUserId(high.email);
    await onboard(page, "math", undefined, { grade: "H1" });
    await diagnostic(page, "math", undefined, { grade: "H1" });
    const gained = await lesson(page, "math", undefined, { grade: "H1" });
    expect((await snapshot(page, "math")).totalXp).toBe(30 + gained);
    await page.goto(url("english", "/diagnostic"));
    await diagnostic(page, "english", undefined, { grade: "H1" });
    const gainedEn = await lesson(page, "english", undefined, { grade: "H1" });
    expect((await snapshot(page, "english")).totalXp).toBe(30 + gainedEn);
    expect(await restRows("learn_student_profiles", `user_id=eq.${ids.high}&select=grade`)).toEqual([{ grade: "H1" }]);
    expect((await ledger(ids.high!, "math")).sum).toBe((await snapshot(page, "math")).totalXp);
  });

  test("server authority and grade scoping on the Worker: an H1 student cannot open M1 / M2 / H2 lessons or answer another grade's question; forged claims are ignored", async () => {
    const page = pages.high;
    const intruder = pages.mid; // another signed-in student (M2)
    await page.goto(url("math", "/dashboard"));
    for (const lessonId of ["math-l1", "math-m2-l1", "math-h2-l1", "math-e6-l1"]) expect((await api(page, "start", { site: "math", kind: "lesson", lessonId })).status, lessonId).toBe(404);
    // the first H1 lesson the server lets this student start (the dashboard may point at practice once lesson 1 is cleared)
    let lessonId = "";
    let started: ApiResult = { status: 0, json: null };
    for (const n of [1, 2, 3, 4, 5]) {
      started = await api(page, "start", { site: "math", kind: "lesson", lessonId: `math-h1-l${n}` });
      if (started.status === 200) { lessonId = `math-h1-l${n}`; break; }
    }
    expect(lessonId.startsWith("math-h1-"), "an H1 lesson can be started").toBe(true);
    expect(started.status).toBe(200);
    expect(JSON.stringify(started.json)).not.toMatch(/"answer"|"explanation"|"hints"/);
    const qids: string[] = started.json.questions.map((q: { id: string }) => q.id);
    expect(qids).toHaveLength(5);
    for (const id of qids) expect(id.includes("-h1-"), id).toBe(true);
    const first = bank("math").find((q) => q.id === qids[0])!;
    const before = (await ledger(ids.high!, "math")).sum;
    const forged = await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: first.id, answer: "987654", correct: true, xp: 99999, delta: { xp: 99999 }, state: { totalXp: 99999 } });
    expect(forged.status).toBe(200);
    expect(forged.json.correct, "the browser's claim is ignored").toBe(false);
    expect((await ledger(ids.high!, "math")).sum).toBe(before);
    const foreign = bank("math").find((q) => q.id.includes("-m2-"))!;
    expect((await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: foreign.id, answer: correctPayload(foreign) })).status, "another grade's question").toBe(404);
    // cross-user: the M2 student cannot post into / complete the H1 student's session
    await intruder.goto(url("math", "/dashboard"));
    expect((await api(intruder, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: first.id, answer: correctPayload(first) })).status).toBe(404);
    expect((await api(intruder, "complete", { site: "math", sessionId: started.json.sessionId, lessonId })).status).toBeGreaterThanOrEqual(403);
    for (const id of qids) {
      const q = bank("math").find((x) => x.id === id)!;
      const r = await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: id, answer: correctPayload(q) });
      expect(r.json.correct, id).toBe(true);
    }
    expect((await api(page, "attempt", { site: "math", sessionId: started.json.sessionId, questionId: qids[0], answer: correctPayload(first) })).status, "replayed attempt").toBe(409);
    const done = await api(page, "complete", { site: "math", sessionId: started.json.sessionId, lessonId });
    expect(done.status).toBe(200);
    expect(done.json.delta.xp).toBeGreaterThan(0);
    const total = await ledger(ids.high!, "math");
    const again = await api(page, "complete", { site: "math", sessionId: started.json.sessionId, lessonId });
    expect(again.json.delta.xp, "replayed completion awards nothing").toBe(0);
    expect(await ledger(ids.high!, "math")).toEqual(total);
    expect(total.rows).toBe(total.keys);
  });

  test("VIETNAMESE account: Lớp 12 (H3) math + english lessons in Vietnamese, locale and progress survive refresh and sign out / in", async () => {
    const page = pages.vn;
    await signUp(page, vn, "vi");
    ids.vn = await authUserId(vn.email);
    await onboard(page, "math", undefined, { locale: "vi", grade: "H3" });
    await diagnostic(page, "math", undefined, { locale: "vi", grade: "H3" });
    const gained = await lesson(page, "math", undefined, { locale: "vi", grade: "H3" });
    const snap = await snapshot(page, "math");
    expect(snap.totalXp).toBe(30 + gained);
    await page.reload();
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
    await page.goto(url("math", "/profile"));
    await expect(page.getByText("Lớp 12")).toBeVisible();
    let started: ApiResult = { status: 0, json: null };
    for (const n of [1, 2, 3, 4, 5]) {
      started = await api(page, "start", { site: "math", kind: "lesson", lessonId: `math-h3-l${n}` });
      if (started.status === 200) break;
    }
    expect(started.status).toBe(200);
    for (const q of started.json.questions) expect(HANGUL.test(q.prompt), q.prompt).toBe(false);
    const hint = await api(page, "hint", { site: "math", questionId: started.json.questions[0].id, level: 1 });
    expect(HANGUL.test(hint.json.hint), hint.json.hint).toBe(false);
    await signOutIn(page, vn, "math", "vi");
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
    expect(await snapshot(page, "math")).toEqual(snap);
    await page.goto(url("english", "/diagnostic"));
    await diagnostic(page, "english", undefined, { locale: "vi", grade: "H3" });
    const gainedEn = await lesson(page, "english", undefined, { locale: "vi", grade: "H3" });
    expect((await snapshot(page, "english")).totalXp).toBe(30 + gainedEn);
    expect(await restRows("learn_student_profiles", `user_id=eq.${ids.vn}&select=grade`)).toEqual([{ grade: "H3" }]);
    await page.goto(url("math", "/profile"));
    await page.getByRole("radio", { name: "한국어" }).first().click();
    await expect(page.getByText("고3")).toBeVisible();
    expect(await snapshot(page, "math")).toEqual(snap);
    expect(await authUsersWithEmail(vn.email)).toBe(1);
  });

  test("database: every fixture owns its rows, ledgers equal browser XP, no duplicate XP keys, money tables untouched", async () => {
    for (const [k, site] of [["mid", "math"], ["mid", "english"], ["high", "math"], ["high", "english"], ["vn", "math"], ["vn", "english"]] as const) {
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

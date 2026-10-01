import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import mathDemo from "../../lib/learn/content/demo/math.json";
import englishDemo from "../../lib/learn/content/demo/english.json";

const URL_ = process.env.STAGING_URL;
const PW = process.env.STAGING_TEST_PASSWORD;
const SB_URL = process.env.STAGING_SUPABASE_URL;
const SB_KEY = process.env.STAGING_SUPABASE_PUBLISHABLE_KEY;
const ready = !!(URL_ && PW && SB_URL && SB_KEY);
test.skip(!ready, "set STAGING_URL, STAGING_TEST_PASSWORD, STAGING_SUPABASE_URL, STAGING_SUPABASE_PUBLISHABLE_KEY");

const A = "learn-staging-a@example.com";
const B = "learn-staging-b@example.com";

type Q = { id: string; type: string; options?: { id: string; text: string }[]; answer: { id?: string; value?: number; accepted?: string[]; ids?: string[] } };
const isApi = (n: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${n}`);

async function login(page: Page, site: "math" | "english", email: string) {
  await page.goto(`/study/${site}/login`);
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel(/비밀번호/).fill(PW!);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL(new RegExp(`/study/${site}/(dashboard|onboarding)`));
}
async function ensureProfile(page: Page, site: "math" | "english") {
  if (!page.url().includes("/onboarding")) return;
  await page.locator("#nick").fill(email(page));
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "중1" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "매일 공부 습관 만들기" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "진단 퀘스트로 출발!" }).click();
  await page.getByRole("link", { name: "나중에 할게요" }).click();
  await page.waitForURL(new RegExp(`/study/${site}/dashboard`));
}
const email = (p: Page) => ((p as unknown as { _n?: string })._n ??= "학생" + Math.floor(Math.random() * 90 + 10));

async function answer(page: Page, q: Q) {
  if (q.type === "multiple_choice" || q.type === "true_false") {
    await page.getByRole("radio").nth(q.type === "true_false" ? (q.answer.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === q.answer.id)).click();
  } else if (q.type === "numeric") await page.locator(`#ans-${q.id}`).fill(String(q.answer.value));
  else if (q.type === "short_answer" || q.type === "fill_blank") await page.locator(`#ans-${q.id}`).fill(q.answer.accepted![0]);
  else for (const id of q.answer.ids!) await page.locator(".l-tokens").getByRole("button", { name: q.options!.find((o) => o.id === id)!.text, exact: true }).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
}

async function playLesson(page: Page, site: "math" | "english", lessonId: string) {
  const demo = (site === "math" ? mathDemo : englishDemo).questions as unknown as Q[];
  await page.goto(`/study/${site}/lesson/${lessonId}`);
  const start = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: "문제 풀러 가기" }).click();
  const body = await (await start).json();
  const sessionId: string = body.sessionId;
  for (const pq of body.questions as { id: string }[]) {
    await answer(page, demo.find((x) => x.id === pq.id)!);
    await expect(page.getByText(/정답이에요!|끝까지 해냈어요!/)).toBeVisible();
    await page.getByRole("button", { name: /^(다음|퀘스트 마무리)$/ }).click();
  }
  await expect(page.getByRole("heading", { name: "레슨 클리어!" })).toBeVisible();
  return sessionId;
}

async function xpOf(ctx: BrowserContext, site: "math" | "english"): Promise<number> {
  const res = await ctx.request.post(`${URL_}/api/learn/state`, { headers: { origin: new globalThis.URL(URL_!).origin }, data: { site } });
  expect(res.status()).toBe(200);
  return (await res.json()).state.totalXp;
}

test("real accounts: progress persists across reload and logout/login (math + english)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, "math", A);
  await ensureProfile(page, "math");
  const before = await xpOf(ctx, "math");
  await playLesson(page, "math", "math-l1");
  const after = await xpOf(ctx, "math");
  expect(after).toBeGreaterThan(before);

  await page.reload();
  expect(await xpOf(ctx, "math")).toBe(after);

  // logout -> login keeps progress (stored in the database, not the browser)
  await page.goto("/study/math/profile");
  await page.getByRole("button", { name: "로그아웃" }).click();
  await ctx.clearCookies();
  await login(page, "math", A);
  expect(await xpOf(ctx, "math")).toBe(after);

  // english is a separate progress track on the same account
  await page.goto("/study/english/dashboard");
  await ensureProfile(page, "english");
  await playLesson(page, "english", "en-l1");
  expect(await xpOf(ctx, "english")).toBeGreaterThan(0);
  expect(await xpOf(ctx, "math")).toBe(after);
  await ctx.close();
});

test("isolation: student B cannot see or use student A's data; RLS blocks direct database access", async ({ browser, request }) => {
  const ca = await browser.newContext();
  const pa = await ca.newPage();
  await login(pa, "math", A);
  const xpA = await xpOf(ca, "math");
  expect(xpA).toBeGreaterThan(0);
  const sidA = await (async () => {
    const r = await ca.request.post(`${URL_}/api/learn/start`, { headers: { origin: new globalThis.URL(URL_!).origin }, data: { site: "math", kind: "lesson", lessonId: "math-l1" } });
    return (await r.json()).sessionId as string;
  })();

  const cb = await browser.newContext();
  const pb = await cb.newPage();
  await login(pb, "math", B);
  await ensureProfile(pb, "math");
  expect(await xpOf(cb, "math")).not.toBe(xpA);
  const hijack = await cb.request.post(`${URL_}/api/learn/attempt`, { headers: { origin: new globalThis.URL(URL_!).origin }, data: { site: "math", questionId: "m-expr-1", sessionId: sidA, answer: "c" } });
  expect(hijack.status()).toBe(403);
  // client-supplied state / userId are ignored
  const forged = await cb.request.post(`${URL_}/api/learn/state`, { headers: { origin: new globalThis.URL(URL_!).origin }, data: { site: "math", userId: "x", state: { site: "math", totalXp: 99999 } } });
  expect((await forged.json()).state.totalXp).toBeLessThan(99999);

  // Direct PostgREST access with B's own JWT: only B's rows, and no writes to progress tables.
  const tok = await request.post(`${SB_URL}/auth/v1/token?grant_type=password`, { headers: { apikey: SB_KEY! }, data: { email: B, password: PW } });
  const jwt = (await tok.json()).access_token as string;
  const h = { apikey: SB_KEY!, Authorization: `Bearer ${jwt}` };
  const rows = await (await request.get(`${SB_URL}/rest/v1/learn_xp_ledger?select=user_id`, { headers: h })).json();
  const uids = new Set((rows as { user_id: string }[]).map((r) => r.user_id));
  expect(uids.size).toBeLessThanOrEqual(1);
  const ins = await request.post(`${SB_URL}/rest/v1/learn_xp_ledger`, { headers: { ...h, "Content-Type": "application/json" }, data: { site: "math", source_type: "cheat", source_id: "1", xp: 9999, day: "2026-01-01" } });
  expect(ins.ok()).toBe(false);
  const rpc = await request.post(`${SB_URL}/rest/v1/rpc/learn_commit_events`, { headers: { ...h, "Content-Type": "application/json" }, data: { p_user: "00000000-0000-0000-0000-000000000000", p_site: "math", p_events: [], p_meta: null } });
  expect(rpc.ok()).toBe(false);
  const answers = await request.get(`${SB_URL}/rest/v1/learn_question_answers?select=*`, { headers: h });
  expect(((await answers.json()) as unknown[]).length ?? 0).toBe(0);
  const anon = await request.get(`${SB_URL}/rest/v1/learn_xp_ledger?select=*`, { headers: { apikey: SB_KEY! } });
  expect(anon.ok() ? ((await anon.json()) as unknown[]).length : 0).toBe(0);
  await ca.close();
  await cb.close();
});

test("reward farming and answer leakage against the real stack", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, "math", A);
  const origin = new globalThis.URL(URL_!).origin;
  const s = await (await ctx.request.post(`${URL_}/api/learn/start`, { headers: { origin }, data: { site: "math", kind: "lesson", lessonId: "math-l1" } })).text();
  expect(s).not.toMatch(/"answer"|"explanation"|"hints"|accepted/);
  const sid = JSON.parse(s).sessionId;
  const first = await ctx.request.post(`${URL_}/api/learn/attempt`, { headers: { origin }, data: { site: "math", questionId: "m-expr-1", sessionId: sid, answer: "c" } });
  const replay = await ctx.request.post(`${URL_}/api/learn/attempt`, { headers: { origin }, data: { site: "math", questionId: "m-expr-1", sessionId: sid, answer: "c" } });
  expect(first.status()).toBe(200);
  expect(replay.status()).toBe(409);
  const done1 = await ctx.request.post(`${URL_}/api/learn/complete`, { headers: { origin }, data: { site: "math", lessonId: "math-l1", sessionId: sid, firstTryCorrect: 5 } });
  expect(done1.status()).toBe(409); // other lesson questions unresolved: cannot claim completion
  await ctx.close();
});

import { expect, test, type Page } from "@playwright/test";
import mathDemo from "../../lib/learn/content/demo/math.json";
import englishDemo from "../../lib/learn/content/demo/english.json";

const PORT = 3100;
const HOSTS = { math: `http://math.localhost:${PORT}`, english: `http://english.localhost:${PORT}` } as const;
const DEMO = { math: mathDemo, english: englishDemo } as const;

type Q = {
  id: string;
  type: string;
  options?: { id: string; text: string }[];
  answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] };
};

async function answer(page: Page, q: Q) {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") {
    const radios = page.getByRole("radio");
    const idx = q.type === "true_false" ? (k.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === k.id);
    await radios.nth(idx).click();
  } else if (q.type === "numeric") {
    await page.locator(`#ans-${q.id}`).fill(String(k.value));
  } else if (q.type === "short_answer" || q.type === "fill_blank") {
    await page.locator(`#ans-${q.id}`).fill(k.accepted![0]);
  } else if (q.type === "ordering") {
    for (const id of k.ids!) {
      const text = q.options!.find((o) => o.id === id)!.text;
      await page.locator(".l-tokens").getByRole("button", { name: text, exact: true }).click();
    }
  }
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
}

const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);

async function onboard(page: Page, site: "math" | "english") {
  await page.goto(`${HOSTS[site]}/`);
  await page.getByRole("link", { name: /1분 만에 시작하기/ }).click();
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "중1" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "부족한 부분 채우기" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "로봇" }).click();
  await page.getByRole("button", { name: "진단 퀘스트로 출발!" }).click();
  await expect(page.getByRole("heading", { name: /2분 실력 탐색/ })).toBeVisible();
}

test("math: onboarding -> adaptive diagnostic -> lesson with hints -> XP persists after refresh", async ({ page }) => {
  await onboard(page, "math");

  // Adaptive diagnostic: answer every question correctly by looking up the demo bundle by question id.
  const demo = DEMO.math.questions as unknown as Q[];
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: "탐색 시작" }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = demo.find((x) => x.id === nextId)!;
    expect(q, `question ${nextId}`).toBeTruthy();
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q);
    nextId = (await (await resp).json()).next?.id ?? null;
    await expect(page.getByRole("button", { name: /다음 문제|결과 보기/ })).toBeVisible();
    await page.getByRole("button", { name: /다음 문제|결과 보기/ }).click();
  }
  await expect(page.getByRole("heading", { name: /나의 스킬 지도/ })).toBeVisible();
  await expect(page.getByText(/탐색 완료 보너스 \+30 XP/)).toBeVisible();
  await page.getByRole("link", { name: /첫 퀘스트 시작/ }).click();

  // Dashboard is the game home: one obvious CTA.
  await expect(page).toHaveURL(`${HOSTS.math}/dashboard`);
  await expect(page.getByRole("heading", { name: /오늘도 한 판/ })).toBeVisible();
  await page.getByRole("link", { name: /^▶ 계속 학습하기/ }).click();
  await expect(page).toHaveURL(/\/lesson\/math-l\d/);

  const startResp = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: "문제 풀러 가기" }).click();
  const startBody = await (await startResp).json();
  expect(JSON.stringify(startBody)).not.toMatch(/"answer"|"explanation"|"hints"/); // no answer leakage
  const queue: string[] = startBody.questions.map((x: { id: string }) => x.id);
  await expect(page.getByText(/문제 1 \//)).toBeVisible();

  // First question: wrong answer -> small hint, then correct.
  const firstQ = demo.find((x) => x.id === queue[0])!;
  if (firstQ.type === "numeric") await page.locator(`#ans-${firstQ.id}`).fill("999");
  else await page.getByRole("radio").nth(firstQ.options!.findIndex((o) => o.id !== firstQ.answer.id)).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
  await expect(page.getByText("아직이에요, 힌트를 볼게요.")).toBeVisible();
  await expect(page.locator(".l-panel-hint")).toBeVisible();

  for (const [n, id] of queue.entries()) {
    const q = demo.find((x) => x.id === id)!;
    if (n > 0) await expect(page.getByText(new RegExp(`문제 ${n + 1} /|도전 문제`))).toBeVisible();
    await answer(page, q);
    await expect(page.getByText(/정답이에요!|끝까지 해냈어요!/)).toBeVisible();
    await page.getByRole("button", { name: /^(다음|퀘스트 마무리)$/ }).click();
  }

  await expect(page.getByRole("heading", { name: "레슨 클리어!" })).toBeVisible();
  await expect(page.getByText(/^\+\d+ XP$/)).toBeVisible();
  const xpText = await page.getByText(/^\+\d+ XP$/).innerText();
  const gained = Number(xpText.replace(/\D/g, ""));
  expect(gained).toBeGreaterThan(50);

  // Refresh: progress persists and the next lesson is recommended.
  await page.goto(`${HOSTS.math}/dashboard`);
  await page.reload();
  await expect(page.getByText(/(다음 레슨|연습하기) ·/)).toBeVisible();
  await expect(page.getByText(new RegExp(`${30 + gained} XP`)).first()).toBeVisible();

  // Daily quest reflects the work.
  await page.goto(`${HOSTS.math}/quest`);
  await expect(page.getByRole("heading", { name: /오늘의 퀘스트/ })).toBeVisible();
  await expect(page.getByText(/레슨 1개 클리어/)).toBeVisible();
});

test("english: shared engine runs an english lesson on its own subdomain", async ({ page }) => {
  await onboard(page, "english");
  await page.getByRole("link", { name: "나중에 할게요" }).click();
  await expect(page).toHaveURL(`${HOSTS.english}/dashboard`);
  await expect(page.locator(".l-brand").first()).toHaveText("ENGLISH.LIFE.HELP");
  await page.goto(`${HOSTS.english}/learn`);
  await expect(page.getByText("Word Village")).toBeVisible();

  await page.goto(`${HOSTS.english}/lesson/en-l1`);
  const startResp = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: "문제 풀러 가기" }).click();
  const queue: string[] = (await (await startResp).json()).questions.map((x: { id: string }) => x.id);
  await expect(page.getByText(/문제 1 \//)).toBeVisible();
  const demo = DEMO.english.questions as unknown as Q[];
  for (const id of queue) {
    await answer(page, demo.find((x) => x.id === id)!);
    await expect(page.getByText(/정답이에요!|끝까지 해냈어요!/)).toBeVisible();
    await page.getByRole("button", { name: /^(다음|퀘스트 마무리)$/ }).click();
  }
  await expect(page.getByRole("heading", { name: "레슨 클리어!" })).toBeVisible();
});

test("hint ladder ends with the explanation and a similar question (3 wrong answers)", async ({ page }) => {
  await onboard(page, "math");
  await page.getByRole("link", { name: "나중에 할게요" }).click();
  await page.goto(`${HOSTS.math}/lesson/math-l1`);
  await page.getByRole("button", { name: "문제 풀러 가기" }).click();
  for (const expected of ["아직이에요, 힌트를 볼게요.", "조금만 더! 더 구체적인 힌트예요."]) {
    await page.locator("input.l-input, [role=radio]").first().waitFor();
    const input = page.locator("input.l-input");
    if (await input.count()) await input.fill("999");
    else await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
    await expect(page.getByText(expected)).toBeVisible();
  }
  const input = page.locator("input.l-input");
  if (await input.count()) await input.fill("999");
  else await page.getByRole("radio").nth(3).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
  await expect(page.getByText("풀이를 같이 볼까요?")).toBeVisible();
  await expect(page.getByRole("button", { name: "비슷한 문제 풀어 보기" })).toBeVisible();
});

test("API is same-origin only, never leaks answers, and cannot be farmed", async ({ page, request }) => {
  await page.goto(`${HOSTS.math}/`);
  // Node cannot resolve *.localhost, so address the server directly and present the Host a browser would.
  const API = `http://127.0.0.1:${PORT}`;
  const host = `math.localhost:${PORT}`;
  // Cross-origin POST (CSRF) is rejected.
  const cross = await request.post(`${API}/api/learn/start`, {
    headers: { Host: host, Origin: "https://evil.example", "Content-Type": "application/json" },
    data: { site: "math", kind: "lesson", lessonId: "math-l1" },
  });
  expect(cross.status()).toBe(403);
  // Same-origin call works and carries no answer data.
  const headers = { Host: host, Origin: HOSTS.math, "Content-Type": "application/json" };
  const start = await request.post(`${API}/api/learn/start`, { headers, data: { site: "math", kind: "lesson", lessonId: "math-l1" } });
  expect(start.status()).toBe(200);
  const sess = await start.json();
  expect(JSON.stringify(sess)).not.toMatch(/"answer"|"explanation"|"hints"/);
  // Direct API replays of a correct answer pay XP once.
  const q = (mathDemo.questions as unknown as Q[]).find((x) => x.id === sess.questions[0].id)!;
  const body = { site: "math", questionId: q.id, sessionId: sess.sessionId, answer: q.type === "numeric" ? String(q.answer.value) : q.answer.id };
  const a1 = await (await request.post(`${API}/api/learn/attempt`, { headers, data: body })).json();
  expect(a1.correct).toBe(true);
  expect(a1.delta.xp).toBeGreaterThan(0);
  const a2 = await (await request.post(`${API}/api/learn/attempt`, { headers, data: { ...body, state: a1.state } })).json();
  expect(a2.delta.xp).toBe(0);
  expect(a2.state.totalXp).toBe(a1.state.totalXp);
  // Locked lessons cannot be entered through the API.
  const locked = await request.post(`${API}/api/learn/start`, { headers, data: { site: "math", kind: "lesson", lessonId: "math-l4" } });
  expect(locked.status()).toBe(403);
  // Admin content page refuses non-staff.
  await page.goto(`${HOSTS.math}/admin`);
  await expect(page.getByText("관리자만 볼 수 있어요.")).toBeVisible();
});

test("generic Supabase credentials never enable learning accounts: the account UI stays disabled and sign-in is unavailable", async ({ page }) => {
  // The server runs with decoy SUPABASE_URL / service-role / secret / publishable variables and NO LEARN_SUPABASE_*.
  for (const site of ["math", "english"] as const) {
    await page.goto(`${HOSTS[site]}/login`);
    await expect(page.getByText("계정 기능은 아직 준비 중이에요")).toBeVisible();
    await expect(page.locator("#email")).toBeDisabled();
    await expect(page.locator("#password")).toBeDisabled();
    await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeDisabled();
    await expect(page.getByRole("link", { name: "가입 없이 체험하기" })).toBeVisible(); // guest mode stays available
  }
  // Guest play is unaffected: the landing page offers the guest start and no account prompt.
  await page.goto(`${HOSTS.math}/`);
  await expect(page.getByRole("link", { name: /1분 만에 시작하기/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "가입하고 기록 지키기" })).toHaveCount(0);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 700 } });
  test("landing and lesson fit a phone with no horizontal scroll and 44px+ tap targets", async ({ page }) => {
    await onboard(page, "math");
    await page.getByRole("link", { name: "나중에 할게요" }).click();
    for (const path of ["/dashboard", "/learn", "/quest", "/profile", "/lesson/math-l1"]) {
      await page.goto(`${HOSTS.math}${path}`);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    const box = await page.getByRole("button", { name: "문제 풀러 가기" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

const LIVE_HOSTS = ["korea.life.help", "life.help", "tech.life.help", "chat.life.help", "vietnam.life.help"];
const API = `http://127.0.0.1:${PORT}`;
const asHost = (host: string) => ({ headers: { Host: host }, maxRedirects: 0 });

test("production host routing (Host header): math.life.help and english.life.help are the learning sites; existing hosts expose no learning route", async ({ request }) => {
  for (const [host, brand] of [["math.life.help", "MATH.LIFE.HELP"], ["english.life.help", "ENGLISH.LIFE.HELP"]] as const) {
    const landing = await request.get(`${API}/`, asHost(host));
    expect(landing.status(), host).toBe(200);
    expect(await landing.text()).toContain(brand);
    expect(landing.headers()["x-robots-tag"], `${host} noindex header`).toBe("noindex, nofollow");
    const login = await request.get(`${API}/login`, asHost(host));
    expect(login.status()).toBe(200);
    expect(await login.text()).toContain("계정 기능은 아직 준비 중이에요"); // accounts are off in the guest-only release
  }
  for (const host of LIVE_HOSTS) {
    for (const p of ["/study", "/study/math", "/study/english", "/study/math/login", "/api/learn/state"]) {
      expect((await request.get(`${API}${p}`, asHost(host))).status(), `${host}${p}`).toBe(404);
    }
    const post = await request.post(`${API}/api/learn/state`, { ...asHost(host), data: { site: "math" } });
    expect(post.status(), `${host} POST /api/learn/state`).toBe(404);
  }
  // No path-based access without a learning hostname in production (it exists only for local / staging).
  for (const base of [`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]) expect((await request.get(`${base}/study/math`, { maxRedirects: 0 })).status(), base).toBe(404);
  // The original customer app is still served on a country host.
  const home = await request.get(`${API}/`, asHost("korea.life.help"));
  expect(home.status()).toBe(200);
  expect(await home.text()).not.toContain("study-root");
});

test("guest-only: no Supabase / Auth request, no server action, learning pages are noindex", async ({ page }) => {
  const seen: { url: string; action: boolean }[] = [];
  page.on("request", (r) => seen.push({ url: r.url(), action: "next-action" in r.headers() }));
  for (const site of ["math", "english"] as const) {
    await page.goto(`${HOSTS[site]}/`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.goto(`${HOSTS[site]}/login`);
    await expect(page.getByText("계정 기능은 아직 준비 중이에요")).toBeVisible();
    await expect(page.locator("#email")).toBeDisabled();
    await onboard(page, site);
    const diag = page.waitForResponse(isApi("diagnostic"));
    await page.getByRole("button", { name: "탐색 시작" }).click();
    expect((await diag).status()).toBe(200);
  }
  // The only external origin is the Pretendard font CDN that the baseline's root layout already loads on every page.
  const origins = new Set(seen.map((r) => new URL(r.url).origin));
  const external = [...origins].filter((o) => o !== `http://math.localhost:${PORT}` && o !== `http://english.localhost:${PORT}` && o !== "https://cdn.jsdelivr.net");
  expect(external, "every request stays on the learning origin (plus the existing font CDN)").toEqual([]);
  expect(seen.some((r) => /supabase|\/auth\/v1/i.test(r.url)), "no Supabase / Auth request").toBe(false);
  expect(seen.some((r) => r.action), "no server action (sign-up / sign-in) was invoked").toBe(false);
});

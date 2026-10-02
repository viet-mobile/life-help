import fs from "node:fs";
import { expect, type Page } from "@playwright/test";
import mathDemo from "../../lib/learn/content/demo/math.json";
import englishDemo from "../../lib/learn/content/demo/english.json";

/**
 * Shared pieces of the STAGING-only real-browser suites (tests/staging/*.staging.spec.ts).
 * The target host and the Supabase project ref are pinned here: every suite imports this module first, so nothing runs (and nothing
 * is mutated) unless the staging identity checks pass. Keys come from the gitignored .env.staging.local and are never printed.
 */
export const BASE = "https://life-help-staging.simpl2eye.workers.dev";
export const REF = "wreebowcbiymodswajwe";
export const PRODUCTION_REF = "wstdbymmkrqgtsibhcjz";
export const DEMO = { math: mathDemo, english: englishDemo } as const;
export type Site = "math" | "english";
export type Q = {
  id: string;
  type: string;
  options?: { id: string; text: string }[];
  answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] };
};

export const env = Object.fromEntries(
  fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/).map((l) => l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/)).filter((m): m is RegExpMatchArray => !!m).map((m) => [m[1], m[2].trim()]),
);
export const SUPABASE = (env.TEST_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SERVICE = env.TEST_SUPABASE_SERVICE_ROLE_KEY ?? "";
export const ANON = env.TEST_SUPABASE_ANON_KEY ?? "";
// Fail closed: the browser target must be the staging Worker, the database must be the staging project, never production.
if (
  new URL(BASE).host !== "life-help-staging.simpl2eye.workers.dev" ||
  !SUPABASE.includes(REF) ||
  SUPABASE.includes(PRODUCTION_REF) ||
  !SERVICE ||
  [SERVICE, ANON, SUPABASE].some((v) => v.includes(PRODUCTION_REF))
) throw new Error("staging pin failed: refusing to run");

export const svcHeaders = (): Record<string, string> => ({ apikey: SERVICE, ...(SERVICE.startsWith("sb_") ? {} : { Authorization: `Bearer ${SERVICE}` }), "Content-Type": "application/json" });
export const url = (site: Site, p = "") => `${BASE}/study/${site}${p}`;
export const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);
const NEXT_OR_RESULT = /다음 문제|결과 보기/;

/** Called at every distinct screen so a suite can audit it (overflow, console, ...). */
export type ScreenHook = (label: string) => Promise<void>;

/** The payload the API expects for a question's correct answer (the demo content bundle holds the answer keys; the server holds its own). */
export function correctPayload(q: Q): string | string[] {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") return k.id!;
  if (q.type === "numeric") return String(k.value);
  if (q.type === "short_answer" || q.type === "fill_blank") return k.accepted![0];
  if (q.type === "ordering") return k.ids!;
  throw new Error(`unsupported question type ${q.type}`);
}

export async function answer(page: Page, q: Q) {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") {
    const idx = q.type === "true_false" ? (k.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === k.id);
    await page.getByRole("radio").nth(idx).click();
  } else if (q.type === "numeric") await page.locator(`#ans-${q.id}`).fill(String(k.value));
  else if (q.type === "short_answer" || q.type === "fill_blank") await page.locator(`#ans-${q.id}`).fill(k.accepted![0]);
  else if (q.type === "ordering") for (const id of k.ids!) await page.locator(".l-tokens").getByRole("button", { name: q.options!.find((o) => o.id === id)!.text, exact: true }).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
}

export async function onboard(page: Page, site: Site, hook?: ScreenHook) {
  await page.goto(url(site, "/onboarding"));
  await hook?.("onboarding 1/4");
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: "다음" }).click();
  await hook?.("onboarding 2/4");
  await page.getByRole("radio", { name: "중1" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await hook?.("onboarding 3/4");
  await page.getByRole("radio", { name: "부족한 부분 채우기" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await hook?.("onboarding 4/4");
  await page.getByRole("radio", { name: "로봇" }).click();
  await page.getByRole("button", { name: "진단 퀘스트로 출발!" }).click();
  await expect(page.getByRole("heading", { name: /2분 실력 탐색/ })).toBeVisible();
  await hook?.("diagnostic intro");
}

/** Adaptive diagnostic: every question answered correctly, found by id in the bundled demo content. */
export async function diagnostic(page: Page, site: Site, hook?: ScreenHook) {
  const demo = DEMO[site].questions as unknown as Q[];
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: "탐색 시작" }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = demo.find((x) => x.id === nextId)!;
    expect(q, `question ${nextId}`).toBeTruthy();
    if (n === 0 || n === 3) await hook?.(`diagnostic question ${n + 1} (${q.type})`);
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q);
    nextId = (await (await resp).json()).next?.id ?? null;
    if (n === 0) await hook?.("diagnostic feedback");
    await page.getByRole("button", { name: NEXT_OR_RESULT }).click();
  }
  await expect(page.getByRole("heading", { name: /나의 스킬 지도/ })).toBeVisible();
  await expect(page.getByText(/탐색 완료 보너스 \+30 XP/)).toBeVisible();
  await hook?.("diagnostic result");
  await page.getByRole("link", { name: /첫 퀘스트 시작/ }).click();
  await expect(page).toHaveURL(url(site, "/dashboard"));
  await hook?.("dashboard");
}

/** Dashboard CTA -> lesson: first answer wrong (hint appears), then everything correct; returns the XP the result screen showed. */
export async function lesson(page: Page, site: Site, hook?: ScreenHook) {
  const demo = DEMO[site].questions as unknown as Q[];
  await page.getByRole("link", { name: /^▶ 계속 학습하기/ }).click();
  await expect(page).toHaveURL(new RegExp(`/study/${site}/lesson/`));
  await hook?.("lesson intro");
  const startResp = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: "문제 풀러 가기" }).click();
  const startBody = await (await startResp).json();
  expect(JSON.stringify(startBody)).not.toMatch(/"answer"|"explanation"|"hints"/); // no answer leakage
  const queue: string[] = startBody.questions.map((x: { id: string }) => x.id);
  await expect(page.getByText(/문제 1 \//)).toBeVisible();
  await hook?.("lesson question 1");
  const firstQ = demo.find((x) => x.id === queue[0])!;
  if (firstQ.type === "numeric" || firstQ.type === "short_answer" || firstQ.type === "fill_blank") await page.locator(`#ans-${firstQ.id}`).fill("999");
  else if (firstQ.type === "ordering") await page.locator(".l-tokens").getByRole("button").first().click();
  else await page.getByRole("radio").nth(firstQ.options ? firstQ.options.findIndex((o) => o.id !== firstQ.answer.id) : 1).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
  await expect(page.getByText("아직이에요, 힌트를 볼게요.")).toBeVisible(); // wrong answer -> first hint
  await expect(page.locator(".l-panel-hint")).toBeVisible();
  await hook?.("lesson wrong answer + hint");
  for (const [n, id] of queue.entries()) {
    const q = demo.find((x) => x.id === id)!;
    if (n > 0) await expect(page.getByText(new RegExp(`문제 ${n + 1} /|도전 문제`))).toBeVisible();
    if (n === 0 && q.type === "ordering") await page.getByRole("button", { name: /다시|지우기|초기화/ }).first().click().catch(() => undefined);
    await answer(page, q);
    await expect(page.getByText(/정답이에요!|끝까지 해냈어요!/)).toBeVisible();
    if (n === 0) await hook?.("lesson correct feedback");
    await page.getByRole("button", { name: /^(다음|퀘스트 마무리)$/ }).click();
  }
  await expect(page.getByRole("heading", { name: "레슨 클리어!" })).toBeVisible();
  await hook?.("lesson result");
  return Number((await page.getByText(/^\+\d+ XP$/).innerText()).replace(/\D/g, ""));
}

export type Snapshot = { totalXp: number; mastery: number; lessons: number; profile: string | null };
export const summarize = (state: { totalXp: number; mastery?: object; lessons?: object; profile?: { nickname?: string } | null }): Snapshot => ({
  totalXp: state.totalXp, mastery: Object.keys(state.mastery ?? {}).length, lessons: Object.keys(state.lessons ?? {}).length, profile: state.profile?.nickname ?? null,
});
/** Account: the learner state the server returns for this browser session (same-origin API call; no secrets). */
export async function snapshot(page: Page, site: Site): Promise<Snapshot> {
  const state = await page.evaluate(async (s) => {
    const r = await fetch(`/api/learn/state`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: s }) });
    return (await r.json()).state;
  }, site);
  return summarize(state);
}
/** Guest: progress lives in this browser's localStorage (the server only echoes the state the client sends). */
export async function guestSnapshot(page: Page, site: Site): Promise<Snapshot> {
  const state = await page.evaluate((s) => {
    const key = Object.keys(window.localStorage).find((k) => k.endsWith(`:${s}`));
    return key ? JSON.parse(window.localStorage.getItem(key)!) : null;
  }, site);
  expect(state, "guest state is stored in this browser").toBeTruthy();
  return summarize(state);
}

/* ------------------------------ staging database (server key, fixtures only) ------------------------------ */
export async function authUserId(email: string): Promise<string | null> {
  const list = await (await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=1000`, { headers: svcHeaders() })).json();
  return (list.users ?? []).find((u: { email: string }) => u.email === email)?.id ?? null;
}
export async function authUsersWithEmail(email: string): Promise<number> {
  const list = await (await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=1000`, { headers: svcHeaders() })).json();
  return (list.users ?? []).filter((u: { email: string }) => u.email === email).length;
}
export async function restRows<T = Record<string, unknown>>(table: string, query: string): Promise<T[]> {
  const r = await fetch(`${SUPABASE}/rest/v1/${table}?${query}`, { headers: svcHeaders() });
  const body = await r.json();
  if (!Array.isArray(body)) throw new Error(`${table}: ${JSON.stringify(body).slice(0, 200)}`);
  return body as T[];
}
export async function exactCount(table: string): Promise<number> {
  const r = await fetch(`${SUPABASE}/rest/v1/${table}?select=*`, { method: "HEAD", headers: { ...svcHeaders(), Prefer: "count=exact", Range: "0-0" } });
  const m = (r.headers.get("content-range") ?? "").match(/\/(\d+|\*)$/);
  if (!m || m[1] === "*") throw new Error(`${table}: no count (${r.status})`);
  return Number(m[1]);
}
export const LEARN_TABLES = ["learn_student_profiles", "learn_sessions", "learn_attempts", "learn_skill_mastery", "learn_lesson_progress", "learn_xp_ledger", "learn_streaks", "learn_daily_quests", "learn_student_achievements", "learn_progress_meta"];
export async function deleteFixtureUser(userId: string | null) {
  if (!userId) return;
  const del = await fetch(`${SUPABASE}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: svcHeaders() });
  expect(del.status, "fixture user deleted").toBeLessThan(300);
  for (const table of LEARN_TABLES) expect(await restRows(table, `user_id=eq.${userId}&select=user_id&limit=1`), `${table} purged with the user`).toEqual([]);
}

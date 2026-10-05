import { expect, type Page } from "@playwright/test";
import { DEMO, dict, isApi, url, type Opts, type Q, type ScreenHook, type Site } from "./helpers";

/**
 * The real UI journey, parameterised by locale (ko | vi) and grade. Texts come from the SAME dictionaries the app renders, so a copy
 * change cannot silently desynchronise the suite, and a missing / untranslated Vietnamese string fails here as a missing control.
 */
type Dict = ReturnType<typeof dict>;
const NEXT_OR_RESULT = (t: Dict) => new RegExp(`${t["diag.next"]}|${t["diag.finish"]}`);
const CHECK = (t: Dict) => new RegExp(`^(${t["lesson.check"]}|${t["lesson.retry"]})$`);
const HANGUL = /[가-힣]/;

export async function answer(page: Page, q: Q, opts: Opts = {}) {
  const t = dict(opts.locale ?? "ko");
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") {
    const idx = q.type === "true_false" ? (k.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === k.id);
    await page.getByRole("radio").nth(idx).click();
  } else if (q.type === "numeric") await page.locator(`#ans-${q.id}`).fill(String(k.value));
  else if (q.type === "short_answer" || q.type === "fill_blank") await page.locator(`#ans-${q.id}`).fill(k.accepted![0]);
  else if (q.type === "ordering") for (const id of k.ids!) await page.locator(".l-tokens").getByRole("button", { name: q.options!.find((o) => o.id === id)!.text, exact: true }).click();
  await page.getByRole("button", { name: CHECK(t) }).click();
}

export async function onboard(page: Page, site: Site, hook?: ScreenHook, opts: Opts = {}) {
  const t = dict(opts.locale ?? "ko");
  await page.goto(url(site, "/onboarding"));
  await hook?.("onboarding 1/4");
  await page.locator("#nick").fill(opts.locale === "vi" ? "An An" : "테스터");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await hook?.("onboarding 2/4");
  await page.getByRole("radio", { name: t[`grade.${opts.grade ?? "M1"}` as keyof Dict], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await hook?.("onboarding 3/4");
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await hook?.("onboarding 4/4");
  await page.getByRole("radio", { name: t["avatar.robot"] }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await expect(page.getByRole("heading", { name: t["diag.intro.title"] })).toBeVisible();
  await hook?.("diagnostic intro");
}

/** Adaptive diagnostic: every question answered correctly, found by id in the bundled content (elementary + secondary). */
export async function diagnostic(page: Page, site: Site, hook?: ScreenHook, opts: Opts = {}) {
  const t = dict(opts.locale ?? "ko");
  const demo = DEMO[site].questions as unknown as Q[];
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: t["diag.start"] }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = demo.find((x) => x.id === nextId)!;
    expect(q, `question ${nextId}`).toBeTruthy();
    if (opts.grade && opts.grade !== "M1") expect(q.id.includes(`-${opts.grade.toLowerCase()}-`), `placement question ${q.id} belongs to ${opts.grade}`).toBe(true);
    if (n === 0 || n === 3) await hook?.(`diagnostic question ${n + 1} (${q.type})`);
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q, opts);
    nextId = (await (await resp).json()).next?.id ?? null;
    if (n === 0) await hook?.("diagnostic feedback");
    await page.getByRole("button", { name: NEXT_OR_RESULT(t) }).click();
  }
  await expect(page.getByRole("heading", { name: t["diag.result.title"] })).toBeVisible();
  await expect(page.getByText(t["diag.result.reward"].replace("{xp}", "30"))).toBeVisible();
  await hook?.("diagnostic result");
  await page.getByRole("link", { name: t["diag.result.cta"] }).click();
  await expect(page).toHaveURL(url(site, "/dashboard"));
  await hook?.("dashboard");
}

/** Dashboard CTA -> lesson: first answer wrong (hint appears), then everything correct; returns the XP the result screen showed. */
export async function lesson(page: Page, site: Site, hook?: ScreenHook, opts: Opts = {}) {
  const t = dict(opts.locale ?? "ko");
  const demo = DEMO[site].questions as unknown as Q[];
  const qWord = t["lesson.question"].split("{")[0].trim(); // "문제" / "Câu"
  await page.getByRole("link", { name: new RegExp(`^▶ ${t["dash.continue"]}`) }).click();
  await expect(page).toHaveURL(new RegExp(`/study/${site}/lesson/`));
  await hook?.("lesson intro");
  const startResp = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: t["lesson.begin"] }).click();
  const startBody = await (await startResp).json();
  expect(JSON.stringify(startBody)).not.toMatch(/"answer"|"explanation"|"hints"/); // no answer leakage
  const queue: string[] = startBody.questions.map((x: { id: string }) => x.id);
  if (opts.locale === "vi") for (const x of startBody.questions) expect(HANGUL.test(x.prompt), `Vietnamese prompt still has Korean: ${x.prompt}`).toBe(false);
  if (opts.grade && opts.grade !== "M1") for (const id of queue) expect(id.includes(`-${opts.grade.toLowerCase()}-`), `${id} belongs to ${opts.grade}`).toBe(true);
  await expect(page.getByText(new RegExp(`${qWord} 1 /`))).toBeVisible();
  await hook?.("lesson question 1");
  const firstQ = demo.find((x) => x.id === queue[0])!;
  if (firstQ.type === "numeric" || firstQ.type === "short_answer" || firstQ.type === "fill_blank") await page.locator(`#ans-${firstQ.id}`).fill("999");
  else if (firstQ.type === "ordering") {
    // "Check" only enables once every tile is placed: place them in the REVERSE of the correct order so the answer is certainly wrong.
    for (const id of [...firstQ.answer.ids!].reverse()) await page.locator(".l-tokens").getByRole("button", { name: firstQ.options!.find((o) => o.id === id)!.text, exact: true }).click();
  }
  else await page.getByRole("radio").nth(firstQ.options ? firstQ.options.findIndex((o) => o.id !== firstQ.answer.id) : 1).click();
  await page.getByRole("button", { name: CHECK(t) }).click();
  await expect(page.getByText(t["lesson.wrong.1"])).toBeVisible(); // wrong answer -> first hint
  await expect(page.locator(".l-panel-hint")).toBeVisible();
  await hook?.("lesson wrong answer + hint");
  for (const [n, id] of queue.entries()) {
    const q = demo.find((x) => x.id === id)!;
    if (n > 0) await expect(page.getByText(new RegExp(`${qWord} ${n + 1} /|${t["lesson.challenge"]}`))).toBeVisible();
    // (after a wrong answer the app clears the chosen tiles itself, so an ordering question is simply answered again)
    await answer(page, q, opts);
    await expect(page.getByText(new RegExp(`${t["lesson.correct"]}|${t["lesson.correct.after"]}`))).toBeVisible();
    if (n === 0) await hook?.("lesson correct feedback");
    await page.getByRole("button", { name: new RegExp(`^(${t["lesson.next"]}|${t["lesson.finish"]})$`) }).click();
  }
  await expect(page.getByRole("heading", { name: t["result.title.lesson"] })).toBeVisible();
  await hook?.("lesson result");
  return Number((await page.getByText(/^\+\d+ XP$/).innerText()).replace(/\D/g, ""));
}

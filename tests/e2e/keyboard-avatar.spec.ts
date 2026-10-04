import { expect, test, type Page } from "@playwright/test";
import elementaryMath from "../../lib/learn/content/elementary/math.json";
import { ko } from "../../lib/learn/i18n/ko";
import { vi } from "../../lib/learn/i18n/vi";

/**
 * Local production-build e2e (guest mode) for two small UX changes:
 *   - the avatar list offers a penguin and no dragon (Korean and Vietnamese labels)
 *   - Enter does what the "next question" button does, in the lesson and in the placement test, without ever skipping a question
 */
const PORT = 3100;
const HOME = `http://math.localhost:${PORT}`;
type Q = { id: string; type: string; options?: { id: string; text: string }[]; answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] } };
const BANK = new Map((elementaryMath.questions as unknown as Q[]).map((q) => [q.id, q]));
const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);
const check = new RegExp(`^(${ko["lesson.check"]}|${ko["lesson.retry"]})$`);

async function answer(page: Page, q: Q) {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") await page.getByRole("radio").nth(q.type === "true_false" ? (k.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === k.id)).click();
  else if (q.type === "numeric") await page.locator(`#ans-${q.id}`).fill(String(k.value));
  else if (q.type === "short_answer" || q.type === "fill_blank") await page.locator(`#ans-${q.id}`).fill(k.accepted![0]);
  else if (q.type === "ordering") for (const id of k.ids!) await page.locator(".l-tokens").getByRole("button", { name: q.options!.find((o) => o.id === id)!.text, exact: true }).click();
  await page.getByRole("button", { name: check }).click();
}
async function toAvatarStep(page: Page, t: typeof ko | typeof vi) {
  await page.goto(`${HOME}/onboarding`);
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["grade.E3"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
}

test("avatars: a penguin is offered, the dragon is gone (Korean)", async ({ page }) => {
  await toAvatarStep(page, ko);
  await expect(page.getByRole("radio", { name: ko["avatar.penguin"], exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "용", exact: true })).toHaveCount(0);
  const group = page.getByRole("radiogroup").filter({ has: page.getByRole("radio", { name: ko["avatar.penguin"], exact: true }) });
  await expect(group.getByRole("radio")).toHaveCount(6); // fox, cat, panda, robot, owl, penguin
  await page.getByRole("radio", { name: ko["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: ko["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: ko["diag.intro.title"] }).waitFor();
  await page.goto(`${HOME}/dashboard`);
  await expect(page.getByText("🐧").first()).toBeVisible(); // the chosen avatar is shown
});

test("avatars: Vietnamese labels (Chim cánh cụt, no Rồng)", async ({ page }) => {
  await page.goto(`${HOME}/`);
  await page.getByRole("radio", { name: "Tiếng Việt" }).first().click();
  await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
  await toAvatarStep(page, vi);
  await expect(page.getByRole("radio", { name: vi["avatar.penguin"], exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Rồng", exact: true })).toHaveCount(0);
});

test("Enter moves to the next question in a lesson (once per press), after both a mouse-driven and an Enter-driven answer", async ({ page }) => {
  await toAvatarStep(page, ko);
  await page.getByRole("radio", { name: ko["avatar.robot"] }).click();
  await page.getByRole("button", { name: ko["onboarding.finish"] }).click();
  await page.getByRole("link", { name: ko["diag.later"] }).click();
  await page.getByRole("link", { name: new RegExp(`^▶ ${ko["dash.continue"]}`) }).click();
  const start = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: ko["lesson.begin"] }).click();
  const body = await (await start).json();
  const qWord = ko["lesson.question"].split("{")[0].trim();
  for (const [i, pq] of (body.questions as { id: string }[]).entries()) {
    const q = BANK.get(pq.id)!;
    if (i > 0) await expect(page.getByText(new RegExp(`${qWord} ${i + 1} /|${ko["lesson.challenge"]}`))).toBeVisible();
    if (q.type === "numeric") { // answer with Enter inside the text field, then Enter again for "next"
      await page.locator(`#ans-${q.id}`).fill(String(q.answer.value));
      await page.locator(`#ans-${q.id}`).press("Enter");
    } else await answer(page, q);
    await expect(page.getByText(new RegExp(`${ko["lesson.correct"]}|${ko["lesson.correct.after"]}`))).toBeVisible();
    if (i < body.questions.length - 1) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter"); // a quick second press must NOT skip the next question
      await expect(page.getByText(new RegExp(`${qWord} ${i + 2} /|${ko["lesson.challenge"]}`))).toBeVisible();
      await expect(page.getByRole("button", { name: check })).toBeDisabled(); // still waiting for an answer to question i+2
    } else {
      await page.keyboard.press("Enter"); // last question: Enter = "finish"
    }
  }
  await expect(page.getByRole("heading", { name: ko["result.title.lesson"] })).toBeVisible();
});

test("Enter moves on in the placement test too", async ({ page }) => {
  await toAvatarStep(page, ko);
  await page.getByRole("radio", { name: ko["avatar.robot"] }).click();
  await page.getByRole("button", { name: ko["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: ko["diag.intro.title"] }).waitFor();
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: ko["diag.start"] }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = BANK.get(nextId!)!;
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q);
    nextId = (await (await resp).json()).next?.id ?? null;
    await expect(page.getByRole("button", { name: new RegExp(`${ko["diag.next"]}|${ko["diag.finish"]}`) })).toBeVisible();
    await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("heading", { name: ko["diag.result.title"] })).toBeVisible();
});

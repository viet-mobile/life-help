import type { Locator, Page } from "@playwright/test";

/**
 * The learner login form, found by STRUCTURE, never by its (localized) label: study.korean renders English by default ("Log in"), math and
 * english render Korean ("로그인"), and the learner may switch to any of the registry locales. The form is the one that holds both the
 * #email and the #password input; its submit control is the only button inside it (the sign-up/log-in mode switch sits outside the form).
 */
export const loginForm = (page: Page): Locator => page.locator("form", { has: page.locator("#email") }).filter({ has: page.locator("#password") });
export const loginSubmit = (page: Page): Locator => loginForm(page).locator("button");

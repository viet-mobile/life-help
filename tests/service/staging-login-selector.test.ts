import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { locales } from "@/messages/registry";
import { siteConfig } from "@/lib/learn/sites";
import { createTranslator } from "@/lib/learn/i18n";
import { loadMessages } from "@/lib/learn/i18n/catalog";
import { SITES, type Site } from "@/lib/learn/types";

/**
 * The login form as the server renders it for every site x every learner locale, and the structural selector the entitlement spec uses
 * (tests/staging/loginForm.ts: the form holding #email and #password; its only button). The accessible name is NOT part of the selector.
 */
let current: { site: Site; t: (k: string) => string } = { site: "math", t: (k) => k };
vi.mock("@/components/learn/LearnerProvider", () => ({ useSite: () => ({ site: current.site, t: current.t, href: (p: string) => `/study/${current.site}${p}` }) }));
vi.mock("@/app/study/[site]/actions", () => ({ authenticate: async () => null }));
vi.mock("next/link", () => ({ default: ({ href, children, className }: { href: string; children: unknown; className?: string }) => createElement("a", { href, className }, children as never) }));

async function render(site: Site, locale: (typeof locales)[number], enabled = true, signupEnabled = true) {
  const t = createTranslator(await loadMessages(locale));
  current = { site, t: t as (k: string) => string };
  const { AuthForm } = await import("@/components/learn/AuthForm");
  return { html: renderToStaticMarkup(createElement(AuthForm, { enabled, signupEnabled })), label: (t as (k: string) => string)("auth.submit.login") };
}
/** what the Playwright locator resolves to: forms holding both inputs, and the buttons inside them */
function structure(html: string) {
  const forms = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]).filter((f) => /id="email"/.test(f) && /id="password"/.test(f));
  const buttons = forms.flatMap((f) => [...f.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => ({ attrs: m[1], text: m[2].replace(/<[^>]*>/g, "") })));
  return { forms: forms.length, buttons, allButtons: [...html.matchAll(/<button\b/g)].length };
}

describe("sign-up closed (the shipped default): the login form is the only form and has no sign-up switch", () => {
  for (const site of SITES) {
    it(`${site}: one login form and no second button`, async () => {
      for (const l of ["ko", "en", "vi", "ur"] as const) {
        const { html } = await render(site, l, true, false);
        const s = structure(html);
        expect(s.forms, `${site}/${l}`).toBe(1);
        expect(s.allButtons, `${site}/${l}: only the submit button`).toBe(1);
        expect(html).not.toContain('name="ageBasis"');
      }
    });
  }
});

describe("login form selector across sites and learner locales", () => {
  for (const site of SITES) {
    it(`${site}: one login form, one submit button, found without its label, in every registry locale`, async () => {
      const labels = new Set<string>();
      for (const l of locales) {
        const { html, label } = await render(site, l);
        const s = structure(html);
        expect(s.forms, `${site}/${l} forms`).toBe(1);
        expect(s.buttons, `${site}/${l} buttons in the login form`).toHaveLength(1);
        expect(s.buttons[0].text, `${site}/${l} label comes from the learner's locale`).toBe(label);
        expect(s.buttons[0].attrs, "a submit control: not type=button").not.toMatch(/type="button"/);
        expect(s.buttons[0].attrs).not.toMatch(/disabled/); // enabled accounts: clickable
        expect(s.allButtons, "the sign-up switch is a second button OUTSIDE the form, so it can never be matched").toBe(2);
        labels.add(label);
      }
      expect(labels.size, "labels differ by language, the selector does not").toBeGreaterThan(10);
    });
  }
  it("study.korean renders English by default and math/english Korean: the exact name \"로그인\" is not a cross-site selector", async () => {
    expect([siteConfig("korean").defaultLocale, siteConfig("math").defaultLocale, siteConfig("english").defaultLocale]).toEqual(["en", "ko", "ko"]);
    const korean = await render("korean", siteConfig("korean").defaultLocale);
    const math = await render("math", siteConfig("math").defaultLocale);
    expect([korean.label, math.label]).toEqual(["Log in", "로그인"]);
    expect(structure(korean.html).buttons[0].text).not.toBe("로그인"); // this is the observed failure: the old getByRole name never matched on study.korean
  });
  it("accounts disabled / loading: the button is rendered disabled (so toBeEnabled keeps waiting) and the inputs too", async () => {
    const { html } = await render("korean", "en", false);
    expect(structure(html).buttons[0].attrs).toMatch(/disabled/);
    expect(readFileSync("components/learn/AuthForm.tsx", "utf8")).toContain("disabled={!enabled || pending}");
  });
});

describe("entitlement spec login()", () => {
  const spec = readFileSync("tests/staging/entitlement.staging.spec.ts", "utf8");
  const login = spec.slice(spec.indexOf("async function login"), spec.indexOf("const sessionFingerprint")).replace(/^\s*\/\/.*$/gm, "");
  it("uses the structural selector, waits for enabled, and keeps the strengthened completion checks", () => {
    expect(login).toContain("loginSubmit(page)");
    expect(login).toContain("toBeEnabled");
    expect(login).not.toMatch(/getByRole\("button"/);
    expect(login).not.toContain("로그인");
    expect(login).toContain('toHaveURL(learnUrl(site, "/dashboard")'); // never the old /study/<site>/ wait
    expect(login).toContain("signed in: Supabase session cookie present");
    expect(spec).toContain("the browser is signed in as the fixture user"); // profile row for the fixture user, checked right after onboarding
    expect(login).not.toMatch(/console\.log|\.fill\(password\)[\s\S]*console/);
  });
  it("the selector helper is structural: form holding #email and #password, then its button; no label, no 'first button'", () => {
    const helper = readFileSync("tests/staging/loginForm.ts", "utf8").replace(/\/\*[\s\S]*?\*\//g, ""); // comments explain the label problem; code must not use it
    expect(helper).toContain('page.locator("form", { has: page.locator("#email") }).filter({ has: page.locator("#password") })');
    expect(helper).toContain('loginForm(page).locator("button")');
    expect(helper).not.toMatch(/getByRole|first\(\)|nth\(|로그인/);
  });
});

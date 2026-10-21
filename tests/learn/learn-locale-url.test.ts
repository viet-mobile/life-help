import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { locales } from "@/messages/registry";
import { localeFromSegment, splitLocalePrefix, withLocalePrefix } from "@/lib/learn/i18n/path";
import { learnHost, learnOrigins, parseLearnHost } from "@/lib/learn/hosts";
import { studyUrl, studyUrls } from "@/lib/home/studyHosts";

vi.mock("next/headers", () => {
  const state = { headers: new Headers() };
  (globalThis as { __learnHeaders?: typeof state }).__learnHeaders = state;
  return { headers: async () => state.headers, cookies: async () => ({ get: () => undefined }) };
});

const run = (host: string, path: string, headers: Record<string, string> = {}) => proxy(new NextRequest(`https://${host}${path}`, { headers: { host, ...headers } }));
const hdr = (res: Response, h: string) => res.headers.get(`x-middleware-request-${h}`);
const rewrite = (res: Response) => { const v = res.headers.get("x-middleware-rewrite"); return v ? new URL(v).pathname : null; };

describe("language in the URL of a learning site", () => {
  it("every registry locale is a valid first segment (any case); aliases zs / zt / zh map to the Chinese variants; look-alikes are not locales", () => {
    for (const l of locales) { expect(localeFromSegment(l)).toBe(l); expect(localeFromSegment(l.toUpperCase())).toBe(l); }
    expect([localeFromSegment("zs"), localeFromSegment("zt"), localeFromSegment("zh")]).toEqual(["zh-Hans", "zh-Hant", "zh-Hans"]);
    for (const s of ["dashboard", "lesson", "onboarding", "x", "", "xx", "english", "korean"]) expect(localeFromSegment(s), s).toBeNull();
  });
  it("splitLocalePrefix / withLocalePrefix", () => {
    expect(splitLocalePrefix("/en")).toEqual({ locale: "en", rest: "/" });
    expect(splitLocalePrefix("/vi/lesson/x")).toEqual({ locale: "vi", rest: "/lesson/x" });
    expect(splitLocalePrefix("/lesson/x")).toEqual({ locale: null, rest: "/lesson/x" });
    expect(withLocalePrefix("/en/dashboard", "ur")).toBe("/ur/dashboard");
    expect(withLocalePrefix("/dashboard", "ur")).toBe("/ur/dashboard");
    expect(withLocalePrefix("/study/math/en/lesson/a", "sw", "/study/math")).toBe("/study/math/sw/lesson/a");
  });

  it("math / english / study.korean / korean.life.help: /<locale> renders the site in that language (rewrite to the site route, locale header, cookie)", async () => {
    for (const [host, site] of [["math.life.help", "math"], ["english.life.help", "english"], ["study.korean.life.help", "korean"], ["korean.life.help", "korean"]]) {
      for (const l of locales) {
        const res = await run(host, `/${l}`);
        expect(rewrite(res), `${host}/${l}`).toBe(`/study/${site}`);
        expect(hdr(res, "x-learn-locale")).toBe(l);
        expect(hdr(res, "x-life-site")).toBe(site);
        expect(hdr(res, "x-learn-base")).toBe(`/${l}`);
        expect(hdr(res, "x-life-language")).toBe(l);
        expect(res.headers.get("set-cookie")).toContain(`learn_lang=${l}`);
      }
    }
  });
  it("a page under a language prefix keeps the prefix for its links and is routed without it", async () => {
    const res = await run("math.life.help", "/vi/lesson/math-e3-l2");
    expect(rewrite(res)).toBe("/study/math/lesson/math-e3-l2");
    expect(hdr(res, "x-learn-base")).toBe("/vi");
    expect(hdr(res, "x-learn-path")).toBe("/lesson/math-e3-l2");
    expect(hdr(await run("math.life.help", "/ZH-hans"), "x-learn-locale")).toBe("zh-Hans");
    expect(hdr(await run("math.life.help", "/zs"), "x-learn-locale")).toBe("zh-Hans");
  });
  it("no prefix: unchanged default behaviour (no locale header, base empty, no cookie written)", async () => {
    const res = await run("math.life.help", "/");
    expect(rewrite(res)).toBe("/study/math");
    expect(hdr(res, "x-learn-locale")).toBeNull();
    expect(hdr(res, "x-learn-base")).toBe("");
    expect(res.headers.get("set-cookie") ?? "").not.toContain("learn_lang=");
    expect(rewrite(await run("math.life.help", "/dashboard"))).toBe("/study/math/dashboard");
  });
  it("a client cannot inject the locale header; the API is never language-prefixed", async () => {
    const spoof = await run("math.life.help", "/", { "x-learn-locale": "ur" });
    expect(hdr(spoof, "x-learn-locale")).toBeNull();
    const api = await run("math.life.help", "/api/learn/state");
    expect(hdr(api, "x-learn-locale")).toBeNull();
    expect(rewrite(api)).toBeNull();
  });
  it("path mode (staging / local) works the same under /study/<site>", async () => {
    const res = await run("localhost:3000", "/study/english/sw/dashboard");
    expect(rewrite(res)).toBe("/study/english/dashboard");
    expect(hdr(res, "x-learn-base")).toBe("/study/english/sw");
    expect(hdr(res, "x-learn-locale")).toBe("sw");
  });
  it("main LIFE.HELP hosts and look-alikes are not touched by the learning language routing", async () => {
    for (const host of ["life.help", "korea.life.help", "vietnam.life.help", "xkorean.life.help", "korean.life.help.evil.test", "study.korean.life.help.evil.test", "a.korean.life.help"]) {
      const res = await run(host, "/en");
      expect(hdr(res, "x-life-portal"), host).not.toBe("learn");
      expect(hdr(res, "x-learn-locale"), host).toBeNull();
    }
  });
});

describe("korean.life.help is registered as a learning host", () => {
  it("resolves to the Korean study site on production; it is an allowed origin; study.korean.life.help still works", () => {
    expect(parseLearnHost("korean.life.help")).toEqual({ site: "korean", stage: "production" });
    expect(parseLearnHost("KOREAN.life.help:443")).toEqual({ site: "korean", stage: "production" });
    expect(parseLearnHost("study.korean.life.help")).toEqual({ site: "korean", stage: "production" });
    expect(learnOrigins()).toContain("https://korean.life.help");
    expect(parseLearnHost("a.korean.life.help")).toBeNull();
    expect(parseLearnHost("korean.life.help.evil.com")).toBeNull();
    expect(parseLearnHost("korea.life.help")).toBeNull();
  });
});

describe("korean.life.help is the representative address", () => {
  it("learnHost, the Study chooser and the Vietnamese entry alias all name korean.life.help; staging is unchanged", async () => {
    expect(learnHost("korean", "production")).toBe("korean.life.help");
    expect(learnHost("math", "production")).toBe("math.life.help");
    expect(learnHost("korean", "staging")).toBe("study-korean-staging.life.help");
    expect(studyUrl("korean", "life.help")).toBe("https://korean.life.help");
    expect(studyUrls("korea.life.help").korean).toBe("https://korean.life.help");
    expect(studyUrl("korean", "somewhere.preview.dev")).toBe("https://study-korean-staging.life.help");
    expect(studyUrl("korean", "localhost", "3100")).toBe("http://korean.localhost:3100");
    const res = await run("hoc.tieng.han.viet.mobile", "/");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://korean.life.help/?lang=vi");
  });
  it("both hosts serve the site; the alias is not redirected (guest progress lives per origin)", async () => {
    for (const host of ["korean.life.help", "study.korean.life.help"]) expect(rewrite(await run(host, "/")), host).toBe("/study/korean");
  });
});

describe("metadata per language (title, description, social preview, hreflang)", () => {
  const set = (h: Record<string, string>) => { (globalThis as unknown as { __learnHeaders: { headers: Headers } }).__learnHeaders.headers = new Headers(h); };

  it("every site x every registry locale: its own language, distinct from the others, with hreflang alternates for all locales", async () => {
    const { generateMetadata } = await import("@/app/study/[site]/layout");
    const { loadMessages } = await import("@/lib/learn/i18n/catalog");
    for (const site of ["math", "english", "korean"] as const) {
      const titles = new Set<string>(), descriptions = new Set<string>();
      for (const l of locales) {
        set({ host: "math.life.help", "x-learn-locale": l, "x-learn-base": `/${l}`, "x-learn-path": "/" });
        const md = await generateMetadata({ params: Promise.resolve({ site }) });
        const m = await loadMessages(l);
        const dict = m as unknown as Record<string, string>;
        const title = (md.title as { default: string }).default;
        expect(title, `${site}/${l}`).toBe(`${dict[`brand.${site}`]} · ${dict[`site.${site}.tagline`]}`);
        expect(md.description).toBe(dict[`site.${site}.description`]);
        expect((md.openGraph as { locale: string }).locale).toBe(l.replace("-", "_"));
        expect((md.openGraph as { title: string }).title).toBe(dict[`site.${site}.tagline`]);
        const langs = (md.alternates as { languages: Record<string, string>; canonical: string }).languages;
        expect(Object.keys(langs).sort()).toEqual([...locales, "x-default"].sort());
        expect(langs[l]).toBe(`https://math.life.help/${l}`);
        expect((md.alternates as { canonical: string }).canonical).toBe(`https://math.life.help/${l}`);
        titles.add(title); descriptions.add(String(md.description));
      }
      expect(titles.size, `${site}: titles are translated, not copies of one language`).toBeGreaterThan(35);
      expect(descriptions.size, `${site}: descriptions are translated`).toBeGreaterThan(35);
    }
  });
  it("requested through the study.korean alias, canonical / og:url / social image still name korean.life.help", async () => {
    const { generateMetadata } = await import("@/app/study/[site]/layout");
    set({ host: "study.korean.life.help", "x-learn-locale": "vi", "x-learn-base": "/vi", "x-learn-path": "/dashboard" });
    const md = await generateMetadata({ params: Promise.resolve({ site: "korean" }) });
    const a = md.alternates as { canonical: string; languages: Record<string, string> };
    expect(a.canonical).toBe("https://korean.life.help/vi/dashboard");
    expect(a.languages.ur).toBe("https://korean.life.help/ur/dashboard");
    expect(a.languages["x-default"]).toBe("https://korean.life.help/dashboard");
    expect((md.openGraph as { url: string; images: Array<{ url: string }> }).url).toBe("https://korean.life.help/vi/dashboard");
    expect((md.openGraph as { images: Array<{ url: string }> }).images[0].url).toBe("https://korean.life.help/logos/logo-korean.png");
    expect(String(md.metadataBase)).toBe("https://korean.life.help/");
    // staging and local hosts keep their own origin
    set({ host: "english-staging.life.help", "x-learn-locale": "en", "x-learn-base": "/en", "x-learn-path": "/" });
    const st = await generateMetadata({ params: Promise.resolve({ site: "english" }) });
    expect((st.alternates as { canonical: string }).canonical).toBe("https://english-staging.life.help/en");
  });
  it("without a language in the URL the site keeps its default language and canonical root", async () => {
    const { generateMetadata } = await import("@/app/study/[site]/layout");
    set({ host: "math.life.help", "x-learn-base": "", "x-learn-path": "/" });
    const md = await generateMetadata({ params: Promise.resolve({ site: "math" }) });
    expect((md.openGraph as { locale: string }).locale).toBe("ko");
    expect((md.alternates as { canonical: string }).canonical).toBe("https://math.life.help/");
  });
  it("path mode keeps the site root in the alternates", async () => {
    const { generateMetadata } = await import("@/app/study/[site]/layout");
    set({ host: "localhost:3100", "x-learn-locale": "vi", "x-learn-base": "/study/english/vi", "x-learn-path": "/dashboard" });
    const md = await generateMetadata({ params: Promise.resolve({ site: "english" }) });
    expect((md.alternates as { languages: Record<string, string> }).languages.ur).toBe("http://localhost:3100/study/english/ur/dashboard");
  });
});

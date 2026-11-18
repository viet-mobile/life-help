import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { COUNTRY_TO_LANGUAGE_MAP } from "@/lib/i18n/siteMetadata";
import { locales } from "@/messages/registry";
import { STUDY_SUBJECTS, studyUrls } from "@/lib/home/studyHosts";
import { proxy } from "@/proxy";

describe("country learning links preserve environment and selected language", () => {
  it("India Hindi goes to production for all three subjects", () => {
    expect(studyUrls("india.life.help", "", "hi")).toEqual({ math: "https://math.life.help/hi", english: "https://english.life.help/hi", korean: "https://korean.life.help/hi" });
  });
  it("every country and every UI language selects production and an explicit canonical language path", () => {
    for (const country of Object.keys(COUNTRY_TO_LANGUAGE_MAP)) for (const locale of locales) {
      const urls = studyUrls(`${country}.life.help`, "", locale);
      for (const subject of STUDY_SUBJECTS) expect(urls[subject], `${country}/${locale}/${subject}`).toBe(`https://${subject}.life.help/${locale}`);
    }
  });
  it("root and www hosts preserve the selected locale too", () => {
    for (const host of ["life.help", "www.life.help", "INDIA.LIFE.HELP:443"]) expect(studyUrls(host, "", "zh-Hant").korean).toBe("https://korean.life.help/zh-Hant");
  });
  it("does not promote staging, previews or lookalikes to production", () => {
    for (const host of ["life-help-staging.example.workers.dev", "india-staging.life.help", "india.life.help.evil.test", "india.life.help.preview.dev", "unknown.life.help"]) expect(studyUrls(host, "", "hi").korean, host).toBe("https://study-korean-staging.life.help/hi");
    expect(studyUrls("localhost", "3100", "ar").english).toBe("http://english.localhost:3100/ar");
  });
  it("all source-language URL modes are routed, including Bengali and Egyptian Arabic", async () => {
    for (const locale of locales) {
      const host = "india.life.help";
      const response = await proxy(new NextRequest(`https://${host}/${locale}`, { headers: { host } }));
      const language = response.headers.get("x-middleware-request-x-life-language");
      expect(language, locale).toBe(locale === "zh-Hans" ? "zs" : locale === "zh-Hant" ? "zt" : locale);
      expect(response.headers.get("x-middleware-rewrite")).toBe(`https://${host}/`);
    }
  });
  it("the destination URL language overrides existing conflicting learning preferences", async () => {
    for (const locale of locales) for (const subject of STUDY_SUBJECTS) {
      const url = new URL(studyUrls("india.life.help", "", locale)[subject]);
      const response = await proxy(new NextRequest(url, { headers: { host: url.host, cookie: "learn_lang=ko" } }));
      expect(response.headers.get("x-middleware-request-x-learn-locale"), url.href).toBe(locale);
      expect(response.headers.get("x-middleware-request-x-learn-base")).toBe(`/${locale}`);
      expect(response.headers.get("set-cookie")).toContain(`learn_lang=${locale}`);
    }
  });
});

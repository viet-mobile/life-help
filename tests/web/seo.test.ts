import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { COUNTRIES } from "@/lib/region/countries";
import { locales } from "@/messages/registry";
import { buildAlternates, brandName, countryBrandName, localePathSegment, ogLocaleFor, originFromHost } from "@/lib/i18n/seo";
import { getSiteMetadata } from "@/lib/i18n/siteMetadata";

describe("og:locale", () => {
  it("is language_TERRITORY for every registry locale", () => {
    for (const l of locales) expect(ogLocaleFor(l), l).toMatch(/^[a-z]{2,3}_[A-Z]{2}$/);
    expect(ogLocaleFor("vi")).toBe("vi_VN");
    expect(ogLocaleFor("zh-Hans")).toBe("zh_CN");
    expect(ogLocaleFor("en", "uk")).toBe("en_GB");
    expect(ogLocaleFor("pt", "brazil")).toBe("pt_BR");
  });
  it("metadata uses it plus the country display name, not the slug", () => {
    const md = getSiteMetadata("uz", "uzbek");
    expect(md.title).toContain("UZBEKISTAN");
    expect((md.openGraph as { siteName: string; locale: string }).siteName).toBe("LIFE.HELP UZBEKISTAN");
    expect((md.openGraph as { locale: string }).locale).toBe("uz_UZ");
    expect(countryBrandName("deutsch")).toBe("GERMANY");
    expect(brandName(null)).toBe("LIFE.HELP");
    for (const c of COUNTRIES) expect(countryBrandName(c.slug), c.slug).toMatch(/^[A-Z0-9 .'()&-]+$/);
  });
});

describe("canonical / hreflang", () => {
  it("builds self-canonical with a locale path alternate for every registry locale", () => {
    const a = buildAlternates("https://life.help", "/visa", "vi")!;
    expect(a.canonical).toBe("https://life.help/vi/visa");
    expect((a.languages as Record<string, string>)["x-default"]).toBe("https://life.help/visa");
    expect((a.languages as Record<string, string>)["zh-Hans"]).toBe("https://life.help/zs/visa");
    expect(Object.keys(a.languages as object)).toHaveLength(locales.length + 1);
    expect(buildAlternates("https://life.help", "/", null)!.canonical).toBe("https://life.help/");
    expect(originFromHost("localhost:3000")).toBe("http://localhost:3000");
  });
  it("every locale path segment is a language path the proxy accepts", async () => {
    for (const l of locales) {
      const seg = localePathSegment(l);
      const res = await proxy(new NextRequest(`https://life.help/${seg}/visa`, { headers: { host: "life.help" } }));
      expect(res.headers.get("x-middleware-request-x-life-url-lang"), seg).toBe(seg.toLowerCase());
      expect(res.headers.get("x-middleware-request-x-life-path"), seg).toBe("/visa");
    }
  });
  it("bare host forwards the public path and ignores a spoofed header", async () => {
    const res = await proxy(new NextRequest("https://life.help/payment", { headers: { host: "life.help", "x-life-path": "/evil", "x-life-url-lang": "xx" } }));
    expect(res.headers.get("x-middleware-request-x-life-path")).toBe("/payment");
    expect(res.headers.get("x-middleware-request-x-life-url-lang")).toBeNull();
  });
  it("lo is no longer treated as a language path", async () => {
    const res = await proxy(new NextRequest("https://life.help/lo", { headers: { host: "life.help" } }));
    expect(res.headers.get("x-middleware-request-x-life-url-lang")).toBeNull();
  });
});

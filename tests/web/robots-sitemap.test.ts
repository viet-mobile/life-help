import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

let hdrs: Record<string, string> = {};
vi.mock("next/headers", () => ({ headers: async () => new Headers(hdrs) }));

import robots from "@/app/robots";
import sitemap, { publicPaths } from "@/app/sitemap";

beforeEach(() => { hdrs = { host: "life.help" }; });

describe("robots.txt", () => {
  it("allows the public site, disallows private paths and names the sitemap", async () => {
    const r = await robots();
    const rule = (Array.isArray(r.rules) ? r.rules[0] : r.rules) as { userAgent: string; allow: string; disallow: string[] };
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    for (const p of ["/admin", "/api/", "/tech/workspace", "/jiu", "/chat", "/login", "/payment"]) expect(rule.disallow).toContain(p);
    expect(r.sitemap).toBe("https://life.help/sitemap.xml");
  });
  it("uses the country host for the sitemap line", async () => {
    hdrs = { host: "vietnam.life.help" };
    expect((await robots()).sitemap).toBe("https://vietnam.life.help/sitemap.xml");
  });
  it("blocks portal and private-journal hosts completely", async () => {
    for (const host of ["tech.life.help", "sys.korea.life.help", "chat.life.help", "jiu.life.help"]) {
      hdrs = { host };
      const r = await robots();
      expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
      expect(r.sitemap).toBeUndefined();
    }
  });
});

describe("sitemap.xml", () => {
  it("lists the main public routes for the current host with locale alternates", async () => {
    hdrs = { host: "korea.life.help" };
    const s = await sitemap();
    const urls = s.map((e) => e.url);
    for (const p of ["/", "/visa", "/privacy", "/terms", "/services/boiler", "/services/bank-help"]) expect(urls).toContain(`https://korea.life.help${p}`);
    expect(urls.every((u) => u.startsWith("https://korea.life.help"))).toBe(true);
    expect(urls.some((u) => /\/support\/|toilet-clog|\/admin|\/tech|\/jiu|\/study/.test(u))).toBe(false);
    expect(Object.keys(s[1].alternates!.languages!)).toContain("vi");
    expect(publicPaths().length).toBe(urls.length);
  });
  it("is empty on portal hosts", async () => {
    hdrs = { host: "tech.life.help" };
    expect(await sitemap()).toEqual([]);
  });
});

describe("static files", () => {
  it("security.txt has contact, a future Expires and languages", () => {
    const t = readFileSync("public/.well-known/security.txt", "utf8");
    expect(t).toMatch(/^Contact: mailto:contact@life\.help$/m);
    expect(t).toMatch(/^Preferred-Languages: ko, en$/m);
    const expires = Date.parse(t.match(/^Expires: (.+)$/m)![1]);
    expect(expires).toBeGreaterThan(Date.now() + 200 * 24 * 3600 * 1000);
  });
  it("_headers makes hashed build output immutable and leaves HTML alone", () => {
    const t = readFileSync("public/_headers", "utf8");
    expect(t).toMatch(/\/_next\/static\/\*\s+Cache-Control: public, max-age=31536000, immutable/);
    expect(t.split("\n").filter((l) => /^\//.test(l))).toEqual(["/_next/static/*"]);
  });
});

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { locales } from "@/messages/registry";

// Host routing of the integrated tree: main site, learning sites and country hosts do not collide.
const run = async (host: string, path = "/") => proxy(new NextRequest(`https://${host}${path}`, { headers: { host } }));
const hdr = (res: Response, h: string) => res.headers.get(`x-middleware-request-${h}`);

describe("integrated host routing", () => {
  for (const [host, lang, country] of [["pakistan.life.help", "ur", "pakistan"], ["centralafrica.life.help", "sg", "centralafrica"], ["kenya.life.help", "sw", "kenya"], ["korea.life.help", "ko", "korea"]]) {
    it(`${host} -> default language ${lang}, a registry locale, country ${country}`, async () => {
      const res = await run(host);
      expect(hdr(res, "x-life-language")).toBe(lang);
      expect(hdr(res, "x-life-country")).toBe(country);
      expect((locales as readonly string[]).includes(lang)).toBe(true);
      expect(hdr(res, "x-life-site")).toBeNull();
    });
  }
  it("the main site is not a learning site", async () => {
    const res = await run("life.help");
    expect(hdr(res, "x-life-portal")).not.toBe("learn");
    expect(hdr(res, "x-life-site")).toBeNull();
  });
  for (const [host, site] of [["math.life.help", "math"], ["english.life.help", "english"], ["study.korean.life.help", "korean"]]) {
    it(`${host} -> learning site ${site}`, async () => {
      const res = await run(host);
      expect(hdr(res, "x-life-portal")).toBe("learn");
      expect(hdr(res, "x-life-site")).toBe(site);
    });
  }
  it("look-alike hosts are not learning hosts", async () => {
    for (const host of ["xmath.life.help", "math.life.help.evil.test", "english-life.help", "korean.life.help.example.com", "math.korea.life.help"]) {
      const res = await run(host);
      expect(hdr(res, "x-life-portal"), host).not.toBe("learn");
    }
  });
});

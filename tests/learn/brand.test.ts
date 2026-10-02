import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

/** The MATH / ENGLISH logos: LIFE.HELP with the site name in the empty band above "LIFE" (scripts/generate_learn_logos.js). */
const root = path.join(__dirname, "../..");
const read = (f: string) => readFileSync(path.join(root, f), "utf8");

describe("learning logos", () => {
  for (const site of ["math", "english"] as const) {
    it(`${site}: every asset exists with the right size, and differs from the plain LIFE.HELP logo only in the top band`, async () => {
      const sizes: Record<string, number> = { [`logo-${site}.png`]: 512, [`favicon-${site}.png`]: 192, [`apple-touch-icon-${site}.png`]: 180, [`favicon-${site}-32.png`]: 32 };
      for (const [file, size] of Object.entries(sizes)) {
        const meta = await sharp(path.join(root, "public/logos", file)).metadata();
        expect([file, meta.width, meta.height]).toEqual([file, size, size]);
      }
      expect(existsSync(path.join(root, `public/logos/favicon-${site}.ico`))).toBe(true);
      // Pixels below the name band (y >= 140) are identical to the country-logo canvas: only the band above "LIFE" changed.
      const mine = await sharp(path.join(root, `public/logos/logo-${site}.png`)).extract({ left: 0, top: 140, width: 512, height: 372 }).raw().toBuffer();
      const canvas = await sharp(path.join(root, "public/logos/logo-nepal.png")).extract({ left: 0, top: 140, width: 512, height: 372 }).raw().toBuffer();
      expect(Buffer.compare(mine, canvas)).toBe(0);
      // ... and the band itself now holds dark (navy) lettering.
      const band = await sharp(path.join(root, `public/logos/logo-${site}.png`)).extract({ left: 36, top: 25, width: 439, height: 105 }).raw().toBuffer();
      let dark = 0;
      for (let i = 0; i < band.length; i += 3) if (band[i] < 60 && band[i + 1] < 70 && band[i + 2] > 40 && band[i + 2] < 140) dark++;
      expect(dark).toBeGreaterThan(8000);
    });
  }
});

describe("where the logo is used", () => {
  it("the top-left brand of the landing page and of every play page is the logo (name kept as hidden text)", () => {
    expect(read("components/learn/PlayShell.tsx")).toContain("<BrandLogo");
    expect(read("app/study/[site]/(public)/page.tsx")).toContain("<BrandLogo");
    const logo = read("components/learn/BrandLogo.tsx");
    expect(logo).toContain("/logos/logo-${site}.png");
    expect(logo).toContain('className="l-sr"');
  });

  it("page metadata uses the site's own logo: icons, apple touch icon, Open Graph and Twitter image, manifest", () => {
    const layout = read("app/study/[site]/layout.tsx");
    for (const needle of ["/logos/favicon-${site}-32.png", "/logos/favicon-${site}.png", "/logos/favicon-${site}.ico", "/logos/apple-touch-icon-${site}.png", "/logos/logo-${site}.png", "twitter:", "images: [{ url: logo"]) {
      if (needle === "twitter:") expect(layout).toContain("twitter: {"); else expect(layout, needle).toContain(needle);
    }
    const manifest = read("app/manifest.ts");
    expect(manifest).toContain("/logos/favicon-${learn.site}.png");
    expect(manifest).toContain("/logos/logo-${learn.site}.png");
  });

  it("/favicon.ico on the learning hosts is the site's logo; every other host keeps its existing favicon routing", async () => {
    const get = (host: string) => proxy(new NextRequest(`https://${host}/favicon.ico`, { headers: { host } }));
    expect((await get("math.life.help")).headers.get("x-middleware-rewrite")).toContain("/logos/favicon-math.ico");
    expect((await get("english.life.help")).headers.get("x-middleware-rewrite")).toContain("/logos/favicon-english.ico");
    expect((await get("korea.life.help")).headers.get("x-middleware-rewrite")).toContain("/logos/favicon-korea.ico");
    expect((await get("life.help")).headers.get("x-middleware-rewrite")).toContain("/logos/favicon-default.ico");
  });
});

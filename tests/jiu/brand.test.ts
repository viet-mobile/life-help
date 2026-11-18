import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { jiuMetadata, jiuManifest, JIU_TITLE } from "@/lib/jiu/brand";
import { JIU_FAVICONS } from "@/lib/jiu/faviconData";
import { getDomainShortcutDetails } from "@/lib/shortcut/desktopShortcut";
import { proxy } from "@/proxy";
const root = path.resolve(__dirname, "../..");
describe("JIU application identity", () => {
  it("uses one title for social previews, browser metadata and installation", () => {
    expect(jiuMetadata.applicationName).toBe(JIU_TITLE);
    expect(jiuMetadata.openGraph?.title).toBe(JIU_TITLE);
    expect(jiuMetadata.twitter?.title).toBe(JIU_TITLE);
    expect(jiuManifest().name).toBe(JIU_TITLE);
    expect(jiuManifest().start_url).toBe("/");
    expect(jiuManifest(true).start_url).toBe("/jiu");
    expect(jiuManifest().icons?.map(i => i.sizes)).toEqual(["192x192", "512x512", "512x512"]);
  });
  it("preserves LIFE.HELP artwork below the JIU name band", async () => {
    const crop = (name: string) => sharp(path.join(root, "public/logos", name)).extract({left:0,top:140,width:512,height:372}).raw().toBuffer();
    expect((await crop("logo-jiu.png")).equals(await crop("logo-nepal.png"))).toBe(true);
    for (const [name, size] of [["logo-jiu.png",512],["favicon-jiu.png",192],["favicon-jiu-32.png",32],["apple-touch-icon-jiu.png",180],["maskable-jiu.png",512]] as const) {
      const m = await sharp(path.join(root,"public/logos",name)).metadata();
      expect([m.width,m.height]).toEqual([size,size]);
    }
    expect(JIU_FAVICONS.jiu).toBe(readFileSync(path.join(root,"public/logos/favicon-jiu.ico")).toString("base64"));
  });
  it("serves the JIU favicon on the JIU host without changing existing favicon routing", async () => {
    const get = (host: string) => proxy(new NextRequest(`https://${host}/favicon.ico`,{headers:{host}}));
    expect((await get("jiu.life.help")).headers.get("x-middleware-rewrite")).toBe("https://jiu.life.help/jiu/favicon.ico");
    expect((await get("life.help")).headers.get("x-middleware-rewrite")).toBeNull();
    expect((await get("math.life.help")).headers.get("x-middleware-rewrite")).toContain("/study/math/favicon.ico");
  });
  it("creates Windows shortcuts with the JIU name, destination and icon", () => {
    const details = getDomainShortcutDetails({host:"jiu.life.help"});
    expect(details.title).toBe(JIU_TITLE);
    expect(details.canonicalUrl).toBe("https://jiu.life.help/");
    expect(details.urlFileContent).toContain("IconFile=https://jiu.life.help/logos/favicon-jiu.ico");
  });
});

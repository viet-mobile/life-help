import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/shortcut/download/route";
import { sanitizeShortcutParams } from "@/lib/shortcut/sanitize";
import { getDomainShortcutDetails, oneLine } from "@/lib/shortcut/desktopShortcut";

const get = async (qs: string) => (await GET(new NextRequest(`https://life.help/api/shortcut/download?${qs}`, { headers: { host: "life.help" } }))).text();

describe(".url shortcut input sanitation", () => {
  it("drops non-allowlisted lang / portal / country", () => {
    const { lang, search } = sanitizeShortcutParams(new URLSearchParams("lang=ko%0d%0aURL=http://evil&portal=x%0d%0a&country=../../etc"));
    expect(lang).toBeUndefined();
    expect(search.toString()).toBe("");
  });
  it("keeps valid values (case-insensitive lang)", () => {
    const { lang, search } = sanitizeShortcutParams(new URLSearchParams("lang=ZH-hans&portal=Tech&country=Vietnam"));
    expect(lang).toBe("zh-Hans");
    expect(search.get("portal")).toBe("tech");
    expect(search.get("country")).toBe("vietnam");
  });
  it("a CRLF injection attempt yields one URL= line pointing at the real host", async () => {
    const body = await get("lang=ko%0d%0aURL=https://evil.example/&portal=sys%0d%0a&country=%0d%0aIconFile=x&path=/visa%0d%0aURL=https://evil.example/");
    expect(body.match(/^URL=/gm)).toHaveLength(1);
    expect(body).not.toContain("evil.example");
    expect(body).toMatch(/^URL=https:\/\/life\.help\/\r?$/m);
  });
  it("oneLine strips control characters", () => {
    expect(oneLine("a\r\nURL=b c")).toBe("a URL=b c");
    const d = getDomainShortcutDetails({ host: "life.help", pathname: "/x", localeOverride: "ko" });
    expect(d.urlFileContent.match(/\r\n/g)!.length).toBe(d.urlFileContent.split("\r\n").length - 1);
  });
});

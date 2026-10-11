import { describe, expect, it } from "vitest";
import { createLimiter, isLifeHelpHost, isSameOrigin, safeRelativePath } from "@/lib/security/guards";

describe("isLifeHelpHost", () => {
  it("accepts life.help and its subdomains only", () => {
    for (const h of ["life.help", "math.life.help", "study.korean.life.help", "LIFE.HELP:443"]) expect(isLifeHelpHost(h), h).toBe(true);
    for (const h of ["attacker.com", "life.help.evil.com", "evillife.help", "evil.example\r\nURL=http://x", "", null, "life.help/x", "a@life.help"]) expect(isLifeHelpHost(h), String(h)).toBe(false);
  });
});

describe("safeRelativePath", () => {
  it("keeps site-relative paths and rejects everything else", () => {
    expect(safeRelativePath("/learn?x=1")).toBe("/learn?x=1");
    for (const p of ["//evil.com", "http://evil.com", "/a\r\nURL=http://x", "/\\evil", "javascript:alert(1)", "/x:y"]) expect(safeRelativePath(p), p).toBe("/");
    expect(safeRelativePath(null)).toBe("/");
  });
});

describe("isSameOrigin", () => {
  const req = (h: Record<string, string>) => new Request("https://life.help/api/x", { method: "POST", headers: h });
  it("checks Origin against the serving host", () => {
    expect(isSameOrigin(req({ origin: "https://life.help", host: "life.help" }))).toBe(true);
    expect(isSameOrigin(req({ origin: "https://evil.com", host: "life.help" }))).toBe(false);
    expect(isSameOrigin(req({ "sec-fetch-site": "same-origin", host: "life.help" }))).toBe(true);
    expect(isSameOrigin(req({ host: "life.help" }))).toBe(false);
  });
});

describe("createLimiter", () => {
  it("allows up to max per window then blocks, and resets", () => {
    const allow = createLimiter();
    expect([1, 2, 3, 4].map(() => allow("k", 3, 1000, 0))).toEqual([true, true, true, false]);
    expect(allow("k", 3, 1000, 1001)).toBe(true);
    expect(allow("other", 3, 1000, 0)).toBe(true);
  });
});

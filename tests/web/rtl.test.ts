import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { directionForLocale } from "@/lib/i18n/direction";

describe("directionForLocale", () => {
  it("is rtl for ar, arz, fa, he, ur only", () => {
    for (const c of ["ar", "arz", "fa", "he", "ur", "AR"]) expect(directionForLocale(c)).toBe("rtl");
    for (const c of ["ko", "en", "vi", "zh-Hans", "xx", "", null, undefined]) expect(directionForLocale(c)).toBe("ltr");
  });
});

describe("study.css skip link", () => {
  it("does not hide the skip link with a huge physical offset", () => {
    const css = readFileSync("app/study/study.css", "utf8");
    expect(css).not.toMatch(/-9999px/);
    expect(css).toMatch(/\.l-skip\s*\{[^}]*clip/);
  });
});

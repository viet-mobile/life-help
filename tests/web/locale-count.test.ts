import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/messages/registry";
import { SUPPORTED_LOCALE_COUNT, formatLocaleCount } from "@/lib/i18n/localeCount";

describe("locale count has one source and Sango is fully retired", () => {
  it("SUPPORTED_LOCALE_COUNT is the registry length", () => {
    expect(SUPPORTED_LOCALE_COUNT).toBe(locales.length);
    expect(formatLocaleCount("en")).toBe(String(locales.length));
  });
  it("no sg dictionary or overlay is shipped", () => {
    expect((locales as readonly string[]).includes("sg")).toBe(false);
    for (const p of ["lib/learn/i18n/locales/sg.json", "content/learn-overlays/sg", "messages/sg.json"]) {
      expect(fs.existsSync(path.join(process.cwd(), p)), p).toBe(false);
    }
  });
});

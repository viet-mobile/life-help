import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { locales, languages, defaultLocale } from "../../messages/index";
import {
  SUPPORTED_LOCALES,
  RTL_LOCALES,
  LOCALE_METADATA,
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  isRtlLocale,
} from "../../lib/learn/i18n/generated/locales.generated";

const rootDir = path.resolve(__dirname, "../..");
const registryJsonPath = path.resolve(rootDir, "messages/generated/locale-registry.json");
const reportPath = path.resolve(rootDir, "reports/generated/locale-registry-report.md");
const extractorScript = path.resolve(rootDir, "scripts/generated/extract-locale-registry.mjs");

describe("LIFE.HELP Locale Registry (Package B)", () => {
  it("extractor script passes --check", () => {
    const res = execFileSync("node", [extractorScript, "--check"], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("OK: all generated locale registry files in sync");
  });

  it("extracts exact 38 locales matching messages/index.ts", () => {
    expect(SUPPORTED_LOCALES.length).toBe(38);
    expect(SUPPORTED_LOCALES.length).toBe(locales.length);
    expect([...SUPPORTED_LOCALES]).toEqual([...locales]);

    const uniqueSet = new Set(SUPPORTED_LOCALES);
    expect(uniqueSet.size).toBe(38);
  });

  it("extracts exact RTL locales (ar, arz, fa, he)", () => {
    const expectedRtl = ["ar", "arz", "fa", "he"];
    expect(RTL_LOCALES.length).toBe(4);
    for (const r of expectedRtl) {
      expect(isRtlLocale(r)).toBe(true);
    }
    expect(isRtlLocale("ko")).toBe(false);
    expect(isRtlLocale("en")).toBe(false);
  });

  it("defaults and fallbacks are correctly mapped", () => {
    expect(DEFAULT_LOCALE).toBe(defaultLocale);
    expect(DEFAULT_LOCALE).toBe("ko");
    expect(FALLBACK_LOCALE).toBe("en");
  });

  it("metadata aligns with languages in messages/index.ts", () => {
    expect(LOCALE_METADATA.length).toBe(languages.length);
    for (let i = 0; i < languages.length; i++) {
      expect(LOCALE_METADATA[i].code).toBe(languages[i].code);
      expect(LOCALE_METADATA[i].name).toBe(languages[i].name);
      expect(LOCALE_METADATA[i].nativeName).toBe(languages[i].nativeName);
      expect(LOCALE_METADATA[i].isRTL).toBe(languages[i].dir === "rtl");
    }
  });

  it("registry JSON and report markdown exist with baseline SHA", () => {
    expect(fs.existsSync(registryJsonPath)).toBe(true);
    expect(fs.existsSync(reportPath)).toBe(true);

    const json = JSON.parse(fs.readFileSync(registryJsonPath, "utf8"));
    expect(json.baselineSha).toBe("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(json.actualCount).toBe(38);

    const md = fs.readFileSync(reportPath, "utf8");
    expect(md).toContain("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(md).toContain("study.korean.life.help");
    expect(md).toContain("study.korean.viet.mobile");
  });
});

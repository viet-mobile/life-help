/**
 * Tests for generated learning translations (35 non-reference locales).
 * Verifies key parity, placeholders, invariants, script share, and cross-locale independence.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { en } from "../../lib/learn/i18n/en";
import { ko } from "../../lib/learn/i18n/ko";
import {
  GENERATED_LOCALES,
  GENERATED_TRANSLATIONS,
  isGeneratedLocale,
} from "../../lib/learn/i18n/generated/translations.generated";
import { SCRIPT, scriptShare, run } from "../../scripts/learn/i18n/verify-generated-locales.mjs";

const LOCALES_DIR = "messages/generated/locales";
const CANONICAL_KEYS = Object.keys(en);
const REFERENCE_LOCALES = ["ko", "en", "vi"];
const TARGETED_13 = ["ar", "de", "es", "fr", "hi", "id", "it", "ja", "nl", "pt", "ru", "zh-Hans", "zh-Hant"];

describe("Learning Translations (35 Non-Reference Locales)", () => {
  it("generates exactly 35 non-reference locale files", () => {
    const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
    expect(files.length).toBe(35);
    for (const ref of REFERENCE_LOCALES) {
      expect(files).not.toContain(`${ref}.json`);
    }
  });

  it("exports matching GENERATED_LOCALES array in TypeScript module", () => {
    expect(GENERATED_LOCALES.length).toBe(35);
    const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    for (const loc of GENERATED_LOCALES) {
      expect(files).toContain(loc);
      expect(isGeneratedLocale(loc)).toBe(true);
    }
  });

  it("verifies all 13 targeted locales pass Claude core verifier with 0 problems", () => {
    const report = run(LOCALES_DIR);
    expect(report.expectedLocales).toBe(35);
    expect(Object.keys(report.locales).length).toBe(35);

    const reportObj = report as any;
    // All 13 targeted locales have zero problems
    for (const loc of TARGETED_13) {
      const locProblems = reportObj.locales[loc]?.problems ?? [];
      expect(locProblems, `Expected 0 problems for targeted locale ${loc}`).toEqual([]);
    }

    // Only documented arz and he number-word false positives remain
    const unexcusedProblems = (reportObj.problems as string[]).filter(
      (p: string) => !p.startsWith("arz: numDiff") && !p.startsWith("he: numDiff")
    );
    expect(unexcusedProblems).toEqual([]);
  });

  it("enforces key parity, invariants, and no Hangul leakage across all 35 locales", () => {
    for (const loc of GENERATED_LOCALES) {
      const data = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${loc}.json`), "utf8"));
      expect(Object.keys(data).length).toBe(301);

      // Invariants
      expect(data["brand.math"]).toBe("MATH.LIFE.HELP");
      expect(data["brand.english"]).toBe("ENGLISH.LIFE.HELP");
      expect(data["dash.xp"]).toBe("XP");
      expect(data["locale.ko"]).toBe("한국어");
      expect(data["locale.vi"]).toBe("Tiếng Việt");

      // No Hangul outside locale.ko
      for (const [key, value] of Object.entries(data)) {
        if (key === "locale.ko") continue;
        expect(/[가-힯]/.test(value as string)).toBe(false);
        expect(/[\r\n<>]|\$/.test(value as string)).toBe(false);
      }
    }
  });

  it("verifies script share for non-Latin writing systems", () => {
    for (const [loc, regex] of Object.entries(SCRIPT)) {
      if (REFERENCE_LOCALES.includes(loc)) continue;
      const data = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${loc}.json`), "utf8"));
      let validScriptCount = 0;
      let totalLetterStrings = 0;

      for (const k of CANONICAL_KEYS) {
        const sh = scriptShare(loc, data[k]);
        if (sh !== null) {
          totalLetterStrings++;
          if (sh >= 0.6) {
            validScriptCount++;
          }
        }
      }

      // At least 90% of strings with letters must be in the native script
      const ratio = validScriptCount / totalLetterStrings;
      expect(ratio).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("guarantees TypeScript module GENERATED_TRANSLATIONS matches JSON files exactly", () => {
    for (const loc of GENERATED_LOCALES) {
      const jsonContent = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${loc}.json`), "utf8"));
      const tsContent = GENERATED_TRANSLATIONS[loc];
      expect(tsContent).toBeDefined();
      expect(Object.keys(tsContent).length).toBe(301);
      for (const key of CANONICAL_KEYS) {
        expect(tsContent[key as keyof typeof tsContent]).toBe(jsonContent[key]);
      }
    }
  });
});

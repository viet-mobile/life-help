import { describe, expect, it } from "vitest";
import {
  languages,
  locales,
  getSortedLanguages,
  getLanguageNameInLocale,
  formatLanguageName,
  type Locale,
} from "@/messages/registry";

describe("Language selection list: sorting and display specifications", () => {
  it("preserves all canonical locales in the registry", () => {
    expect(languages).toHaveLength(locales.length);
    expect(languages.map((l) => l.code).sort()).toEqual([...locales].sort());
  });

  describe("Rule 1: Current language is always at the very top (index 0)", () => {
    const testLocales: Locale[] = ["ko", "en", "ja", "ar", "vi", "ru", "fr", "de", "zh-Hans", "zh-Hant"];

    for (const cur of testLocales) {
      it(`for currentLocale = "${cur}", top item is "${cur}"`, () => {
        const sorted = getSortedLanguages(cur);
        expect(sorted).toHaveLength(languages.length);
        expect(sorted[0].code).toBe(cur);
      });
    }
  });

  describe("Rule 2: Remaining languages are sorted in dictionary order of their names in the current language", () => {
    it("under Korean (ko), remaining languages are in Korean alphabetical order (가나다순)", () => {
      const sorted = getSortedLanguages("ko");
      expect(sorted[0].code).toBe("ko");

      const remaining = sorted.slice(1);
      const names = remaining.map((l) => getLanguageNameInLocale(l.code, "ko"));
      const collator = new Intl.Collator("ko");

      for (let i = 0; i < names.length - 1; i++) {
        expect(
          collator.compare(names[i], names[i + 1]),
          `Korean sort: "${names[i]}" should be <= "${names[i + 1]}"`
        ).toBeLessThanOrEqual(0);
      }
    });

    it("under English (en), remaining languages are in English alphabetical order (A-Z)", () => {
      const sorted = getSortedLanguages("en");
      expect(sorted[0].code).toBe("en");

      const remaining = sorted.slice(1);
      const names = remaining.map((l) => getLanguageNameInLocale(l.code, "en"));
      const collator = new Intl.Collator("en");

      for (let i = 0; i < names.length - 1; i++) {
        expect(
          collator.compare(names[i], names[i + 1]),
          `English sort: "${names[i]}" should be <= "${names[i + 1]}"`
        ).toBeLessThanOrEqual(0);
      }
    });

    it("under Arabic (ar, RTL), remaining languages are in Arabic alphabetical order", () => {
      const sorted = getSortedLanguages("ar");
      expect(sorted[0].code).toBe("ar");

      const remaining = sorted.slice(1);
      const names = remaining.map((l) => getLanguageNameInLocale(l.code, "ar"));
      const collator = new Intl.Collator("ar");

      for (let i = 0; i < names.length - 1; i++) {
        expect(
          collator.compare(names[i], names[i + 1]),
          `Arabic sort: "${names[i]}" should be <= "${names[i + 1]}"`
        ).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("Rule 3: Two-column formatting (Left: name in current language, Right: native name)", () => {
    it("formats options with Left = current lang name and Right = native name", () => {
      const ko = languages.find((l) => l.code === "ko")!;
      const en = languages.find((l) => l.code === "en")!;
      const fr = languages.find((l) => l.code === "fr")!;

      // In Korean
      const formattedEnInKo = formatLanguageName(en, "ko");
      expect(formattedEnInKo).toContain("영어");
      expect(formattedEnInKo).toContain("English");
      expect(formattedEnInKo.indexOf("영어")).toBeLessThan(formattedEnInKo.indexOf("English"));

      const formattedFrInKo = formatLanguageName(fr, "ko");
      expect(formattedFrInKo).toContain("프랑스어");
      expect(formattedFrInKo).toContain("Français");
      expect(formattedFrInKo.indexOf("프랑스어")).toBeLessThan(formattedFrInKo.indexOf("Français"));

      // In English
      const formattedKoInEn = formatLanguageName(ko, "en");
      expect(formattedKoInEn).toContain("Korean");
      expect(formattedKoInEn).toContain("한국어");
      expect(formattedKoInEn.indexOf("Korean")).toBeLessThan(formattedKoInEn.indexOf("한국어"));
    });

    it("applies the exact same Left-to-Right principle even for RTL languages", () => {
      const ar = languages.find((l) => l.code === "ar")!; // Arabic (RTL)
      const he = languages.find((l) => l.code === "he")!; // Hebrew (RTL)
      const fa = languages.find((l) => l.code === "fa")!; // Persian (RTL)
      const ur = languages.find((l) => l.code === "ur")!; // Urdu (RTL)

      // When UI is Korean
      for (const lang of [ar, he, fa, ur]) {
        const str = formatLanguageName(lang, "ko");
        const left = getLanguageNameInLocale(lang.code, "ko");
        const right = lang.nativeName;

        expect(str).toContain(left);
        expect(str).toContain(right);
        // Left name must appear before the native name
        expect(str.indexOf(left)).toBeLessThan(str.indexOf(right));
      }

      // When UI itself is Arabic (RTL)
      const ko = languages.find((l) => l.code === "ko")!;
      const strAr = formatLanguageName(ko, "ar");
      const leftAr = getLanguageNameInLocale("ko", "ar");
      const rightKo = ko.nativeName;

      expect(strAr).toContain(leftAr);
      expect(strAr).toContain(rightKo);
      expect(strAr.indexOf(leftAr)).toBeLessThan(strAr.indexOf(rightKo));
    });

    it("contains non-breaking spaces between left and right for alignment", () => {
      const en = languages.find((l) => l.code === "en")!;
      const str = formatLanguageName(en, "ko");
      expect(str).toMatch(/\u00A0{2,}/);
    });
  });
});

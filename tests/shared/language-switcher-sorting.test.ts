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

  describe("Rule 3: Left-aligned 2-line formatting & Single display for current language", () => {
    it("renders top current language once on 1 line (no redundant duplicate)", () => {
      const ko = languages.find((l) => l.code === "ko")!;
      const en = languages.find((l) => l.code === "en")!;
      const ja = languages.find((l) => l.code === "ja")!;
      const ar = languages.find((l) => l.code === "ar")!;

      expect(formatLanguageName(ko, "ko")).toBe("한국어");
      expect(formatLanguageName(ko, "ko")).not.toContain("\n");

      expect(formatLanguageName(en, "en")).toBe("English");
      expect(formatLanguageName(en, "en")).not.toContain("\n");

      expect(formatLanguageName(ja, "ja")).toBe("日本語");
      expect(formatLanguageName(ja, "ja")).not.toContain("\n");

      expect(formatLanguageName(ar, "ar")).toBe("العربية");
      expect(formatLanguageName(ar, "ar")).not.toContain("\n");
    });

    it("renders non-current languages in 2 lines with exactly 1 newline separator", () => {
      const ko = languages.find((l) => l.code === "ko")!;
      const en = languages.find((l) => l.code === "en")!;
      const fr = languages.find((l) => l.code === "fr")!;
      const ja = languages.find((l) => l.code === "ja")!;

      // In Korean mode: English is rendered as '영어\nEnglish'
      const formattedEnInKo = formatLanguageName(en, "ko");
      const linesEnInKo = formattedEnInKo.split("\n");
      expect(linesEnInKo).toHaveLength(2);
      expect(linesEnInKo[0]).toBe("영어");
      expect(linesEnInKo[1]).toBe("English");

      // In Korean mode: French is rendered as '프랑스어\nFrançais'
      const formattedFrInKo = formatLanguageName(fr, "ko");
      const linesFrInKo = formattedFrInKo.split("\n");
      expect(linesFrInKo).toHaveLength(2);
      expect(linesFrInKo[0]).toBe("프랑스어");
      expect(linesFrInKo[1]).toBe("Français");

      // In English mode: Korean is rendered as 'Korean\n한국어'
      const formattedKoInEn = formatLanguageName(ko, "en");
      const linesKoInEn = formattedKoInEn.split("\n");
      expect(linesKoInEn).toHaveLength(2);
      expect(linesKoInEn[0]).toBe("Korean");
      expect(linesKoInEn[1]).toBe("한국어");

      // In Japanese mode: English is rendered as '英語\nEnglish'
      const formattedEnInJa = formatLanguageName(en, "ja");
      const linesEnInJa = formattedEnInJa.split("\n");
      expect(linesEnInJa).toHaveLength(2);
      expect(linesEnInJa[0]).toBe("英語");
      expect(linesEnInJa[1]).toBe("English");
    });

    it("standardizes Cantonese to '광둥어' in Korean mode without parentheses and '粵語' in Cantonese mode", () => {
      const yue = languages.find((l) => l.code === "yue")!;
      expect(yue.name).toBe("광둥어");
      expect(yue.nativeName).toBe("粵語");
      expect(yue.name).not.toContain("광동어");
      expect(yue.name).not.toContain("(");
      expect(yue.name).not.toContain(")");

      // In Korean mode: '광둥어\n粵語'
      const formattedYueInKo = formatLanguageName(yue, "ko");
      const lines = formattedYueInKo.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe("광둥어");
      expect(lines[1]).toBe("粵語");

      // In Cantonese (yue) mode: must be exactly '粵語' on 1 line (not '廣東話')
      expect(getLanguageNameInLocale("yue", "yue")).toBe("粵語");
      expect(getLanguageNameInLocale("yue", "yue")).not.toContain("廣東話");
      const formattedYueInYue = formatLanguageName(yue, "yue");
      expect(formattedYueInYue).toBe("粵語");
      expect(formattedYueInYue).not.toContain("\n");
      expect(formattedYueInYue).not.toContain("廣東話");

      // In Traditional Chinese (zh-Hant) mode: must also be '粵語'
      expect(getLanguageNameInLocale("yue", "zh-Hant")).toBe("粵語");
      expect(getLanguageNameInLocale("yue", "zh-Hant")).not.toContain("廣東話");
    });

    it("applies 2-line formatting consistently even for RTL languages", () => {
      const ar = languages.find((l) => l.code === "ar")!;
      const he = languages.find((l) => l.code === "he")!;

      // In Korean mode
      const formattedArInKo = formatLanguageName(ar, "ko");
      const linesAr = formattedArInKo.split("\n");
      expect(linesAr).toHaveLength(2);
      expect(linesAr[0]).toBe("아랍어");
      expect(linesAr[1]).toBe("العربية");

      // In Arabic mode: Hebrew
      const formattedHeInAr = formatLanguageName(he, "ar");
      const linesHe = formattedHeInAr.split("\n");
      expect(linesHe).toHaveLength(2);
      expect(linesHe[1]).toBe("עברית");
    });

    it("verifies full 89-locale translations for Egyptian Arabic (arz) and Nigerian Pidgin (pcm)", () => {
      const arz = languages.find((l) => l.code === "arz")!;
      const pcm = languages.find((l) => l.code === "pcm")!;

      expect(arz.name).toBe("이집트 아랍어");
      expect(pcm.name).toBe("나이지리아 피진");

      // Sample key locale checks for arz
      expect(getLanguageNameInLocale("arz", "ko")).toBe("이집트 아랍어");
      expect(getLanguageNameInLocale("arz", "en")).toBe("Egyptian Arabic");
      expect(getLanguageNameInLocale("arz", "ja")).toBe("エジプト・アラビア語");
      expect(getLanguageNameInLocale("arz", "vi")).toBe("Tiếng Ả Rập Ai Cập");
      expect(getLanguageNameInLocale("arz", "zh-Hans")).toBe("埃及阿拉伯语");
      expect(getLanguageNameInLocale("arz", "zh-Hant")).toBe("埃及阿拉伯語");
      expect(getLanguageNameInLocale("arz", "yue")).toBe("埃及阿拉伯話");
      expect(getLanguageNameInLocale("arz", "fr")).toBe("Arabe égyptien");
      expect(getLanguageNameInLocale("arz", "de")).toBe("Ägyptisches Arabisch");
      expect(getLanguageNameInLocale("arz", "ru")).toBe("Египетский арабский");
      expect(getLanguageNameInLocale("arz", "ar")).toBe("العامية المصرية");

      // Sample key locale checks for pcm
      expect(getLanguageNameInLocale("pcm", "ko")).toBe("나이지리아 피진");
      expect(getLanguageNameInLocale("pcm", "en")).toBe("Nigerian Pidgin");
      expect(getLanguageNameInLocale("pcm", "pcm")).toBe("Naijá");
      expect(getLanguageNameInLocale("pcm", "ja")).toBe("ナイジェリア・ピジン");
      expect(getLanguageNameInLocale("pcm", "vi")).toBe("Tiếng Pidgin Nigeria");
      expect(getLanguageNameInLocale("pcm", "zh-Hans")).toBe("尼日利亚皮钦语");
      expect(getLanguageNameInLocale("pcm", "zh-Hant")).toBe("奈及利亞皮欽語");
      expect(getLanguageNameInLocale("pcm", "yue")).toBe("尼日利亞皮欽話");
      expect(getLanguageNameInLocale("pcm", "fr")).toBe("Pidgin nigérian");
      expect(getLanguageNameInLocale("pcm", "de")).toBe("Nigerianisches Pidgin");
      expect(getLanguageNameInLocale("pcm", "ru")).toBe("Нигерийский пиджин");
      expect(getLanguageNameInLocale("pcm", "ar")).toBe("البيجين النيجيري");

      // All 89 locales must have valid translations without falling back to raw English unexpectedly
      for (const loc of locales) {
        const nameArz = getLanguageNameInLocale("arz", loc);
        const namePcm = getLanguageNameInLocale("pcm", loc);

        expect(nameArz.length).toBeGreaterThan(0);
        expect(namePcm.length).toBeGreaterThan(0);

        if (loc !== "en" && loc !== "pcm") {
          expect(nameArz).not.toBe("Egyptian Arabic");
        }
        if (loc !== "en") {
          expect(namePcm).not.toBe("Nigerian Pidgin");
        }
      }
    });

    it("Rule 4: Never emits redundant duplicate parentheses such as (한국어) 한국어", () => {
      const koMeta = languages.find((l) => l.code === "ko")!;

      // In Galician (gl), Korean should be "Coreano\n한국어", NOT "Coreano (한국어) 한국어"
      const formattedInGl = formatLanguageName(koMeta, "gl", false);
      expect(formattedInGl).toBe("Coreano\n한국어");
      expect(formattedInGl).not.toContain("(한국어)");

      const formattedInGlBilingual = formatLanguageName(koMeta, "gl", true);
      expect(formattedInGlBilingual).toBe("Coreano\n한국어");
      expect(formattedInGlBilingual).not.toContain("(한국어)");

      // Across all 89 locales, formatting Korean must never yield "(한국어) 한국어"
      for (const loc of locales) {
        const single = formatLanguageName(koMeta, loc, false);
        const bilingual = formatLanguageName(koMeta, loc, true);

        expect(single).not.toContain("(한국어) 한국어");
        expect(bilingual).not.toContain("(한국어) 한국어");
      }
    });
  });
});

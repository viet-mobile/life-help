import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";
import { NEUTRAL_SET, hintRevealsAnswer } from "@/lib/learn/hintGate";
import safeIds from "@/lib/learn/content/bank/english-hint2-safe.json";
import { pronTipsVisible } from "@/lib/learn/pron";

/** Integration of the four release candidates (hint gate, Korean RC, pronunciation help, English electives). */
describe("integration: English hint gate covers the whole served bank (existing 12,882 + 1,255 linked + 42 electives)", () => {
  it("other learner languages never get a Korean sentence as hint 2 (wordless), for bank and electives", async () => {
    for (const locale of ["vi", "ar", "ur", "en", "ja"] as const) {
      const { bundle } = await loadIndex("english", { locale });
      for (const q of bundle.questions.filter((x) => /^(eb-|e-h3e-)/.test(x.id))) { if (q.hints.length >= 2) expect(q.hints[1], `${locale} ${q.id}`).toBe("💭"); }
      expect(bundle.questions.some((q) => q.id.startsWith("e-h3e-")), locale).toBe(true);
    }
  });
});

describe("integration: Korean bank per-language scope (a missing translation kit never removes the existing course)", () => {
  it("all 46 active languages keep the 718 existing Korean course questions; the bank is all-or-nothing per language; dict only where the dict template exists", async () => {
    const withBank: string[] = [];
    for (const l of LOCALES) {
      const { bundle } = await loadIndex("korean", { locale: l as never });
      const kb = bundle.questions.filter((q) => q.id.startsWith("kb-"));
      expect(bundle.questions.length - kb.length, l).toBe(718);
      const dict = kb.filter((q) => q.id.endsWith("-dict"));
      expect([0, 13445], l).toContain(kb.length);
      if (kb.length) { withBank.push(l); expect(dict.length, l).toBe(60); for (const q of dict) { expect(q.audioText, `${l} ${q.id}`).toBeTruthy(); expect(q.prompt.length, `${l} ${q.id}`).toBeGreaterThan(0); } }
      else expect(dict.length, l).toBe(0);
    }
    expect(withBank.sort()).toEqual(["de", "en", "es", "fr", "id", "ja", "ko", "mn", "ne", "ru", "th", "uz", "vi", "zh-Hans", "zh-Hant"]);
  });
});

describe("integration: unverified translations stay out of learners' sight", () => {
  it("lit-d1 hint 1 in Tetun (reviewer could not judge it) is served as the reviewed English text", () => {
    const get = (l: string) => JSON.parse(fs.readFileSync(`content/learn-overlays/${l}/english.json`, "utf8")).questions["e-h3e-lit-d1"].hints[0];
    expect(get("tet")).toBe(get("en"));
  });
  it("pronunciation help is hidden by default (expert review required)", () => {
    expect(pronTipsVisible()).toBe(false);
  });
});

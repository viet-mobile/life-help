import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { LOCALES } from "@/lib/learn/i18n";
import { ko } from "@/lib/learn/i18n/ko";
import { checkAnswer } from "@/lib/learn/domain/answers";
import { expandKoreanBank, type KBankData, type KKit } from "@/lib/learn/content/korean-bank";
import bankData from "@/lib/learn/content/bank/korean.json";
import kitEn from "@/lib/learn/content/bank/korean-kit.en.json";
import { REVIEW_MODES } from "@/lib/learn/reviewModes";

const COMPLETE = ["ko", "en", "vi", "ja", "zh-Hans", "zh-Hant", "th", "id", "uz", "mn", "ru", "es", "fr", "de", "ne"] as const;

describe("Korean dictation is on only where the language carries its template", () => {
  it("a kit without the dict template produces no dict questions (no silent English fallback)", () => {
    const kit = { templates: { ...(kitEn as unknown as KKit).templates }, texts: {} } as KKit;
    delete (kit.templates as Record<string, unknown>).dict;
    const withDict = expandKoreanBank(bankData as unknown as KBankData, { ...(kitEn as unknown as KKit), texts: {} } as KKit, null, { draft: false });
    const without = expandKoreanBank(bankData as unknown as KBankData, kit, null, { draft: false });
    expect(withDict.filter((q) => q.tags?.[2] === "dict").length).toBeGreaterThan(0);
    expect(without.filter((q) => q.tags?.[2] === "dict").length).toBe(0);
    expect(without.length).toBe(withDict.length - withDict.filter((q) => q.tags?.[2] === "dict").length);
  });
  it.each(["ja", "vi", "ko"])("%s: dictation questions load and grade with Korean rules (spelling and spacing count)", async (loc) => {
    const { bundle } = await loadIndex("korean", { locale: loc as never });
    const d = bundle.questions.filter((q) => q.tags?.[2] === "dict");
    expect(d.length).toBeGreaterThan(0);
    for (const q of d.slice(0, 20)) {
      const ans = q.answer as { kind: string; accepted: string[] };
      expect(ans.kind).toBe("text");
      const good = ans.accepted[0];
      expect(checkAnswer(q, good)).toBe(true);
      expect(checkAnswer(q, `  ${good}. `)).toBe(true); // stray end spaces / punctuation
      if (/\s/.test(good)) expect(checkAnswer(q, good.replace(/\s+/g, "")), q.id).toBe(false); // spacing is not forgiven
      expect(checkAnswer(q, good.slice(0, -1) + "ㅇ"), q.id).toBe(false);
      expect(q.prompt).not.toMatch(/\{\w+\}/);
      for (const h of q.hints) expect(h).not.toMatch(/\{\w+\}/);
    }
  });
  it("the 15 complete languages get the bank; a partial language keeps its course and gets no bank and no dictation", async () => {
    for (const loc of COMPLETE) {
      const { bundle } = await loadIndex("korean", { locale: loc as never });
      expect(bundle.questions.filter((q) => q.id.startsWith("kb-")).length, loc).toBeGreaterThan(13000);
    }
    for (const loc of ["tr", "hi", "ar"]) {
      const { bundle } = await loadIndex("korean", { locale: loc as never });
      expect(bundle.questions.length, loc).toBe(718);
      expect(bundle.questions.some((q) => q.id.startsWith("kb-") || q.type === "short_answer"), loc).toBe(false);
      expect(bundle.catalog.skills.length, loc).toBeGreaterThan(0);
    }
  });
});

describe("review-mode and flashcard strings are really translated and really used", () => {
  const dir = path.join(process.cwd(), "lib/learn/i18n/locales");
  const keys = Object.keys(ko).filter((k) => k.startsWith("modes.") || k.startsWith("cards."));
  it("the screens only use keys that exist (including the per-mode keys they build)", () => {
    const used = new Set<string>();
    for (const f of ["components/learn/ModesPage.tsx", "components/learn/CardsPage.tsx"]) {
      const src = fs.readFileSync(path.join(process.cwd(), f), "utf8");
      for (const m of src.matchAll(/\bt\("([a-zA-Z.]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/\bt\(`([a-zA-Z.]*)\$\{m\}([a-zA-Z.]*)`/g)) for (const mode of REVIEW_MODES) used.add(`${m[1]}${mode}${m[2]}`);
    }
    expect(used.size).toBeGreaterThan(15);
    for (const k of used) expect(Object.keys(ko), k).toContain(k);
    for (const k of keys) expect(used.has(k) || k.startsWith("modes.cards"), `${k} unused`).toBe(true);
  });
  it("all 46 languages have every modes./cards. key, translated (not the key, not Korean) and placeholders intact", () => {
    for (const loc of LOCALES.filter((l) => l !== "ko")) {
      const m = JSON.parse(fs.readFileSync(path.join(dir, `${loc}.json`), "utf8")) as Record<string, string>;
      for (const k of keys) {
        expect(typeof m[k], `${loc} ${k}`).toBe("string");
        expect(m[k], `${loc} ${k}`).not.toBe(k);
        expect(/[가-힣]/.test(m[k]), `${loc} ${k} has Hangul`).toBe(false);
        for (const ph of (ko as Record<string, string>)[k].match(/\{\w+\}/g) ?? []) expect(m[k], `${loc} ${k} ${ph}`).toContain(ph);
      }
    }
  });
});

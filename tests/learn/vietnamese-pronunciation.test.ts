import { describe, expect, it } from "vitest";
import { INITIALS, VOWELS, transcribeSurface, pronunciationVi } from "../../scripts/learn/korean/vietnamese-pronunciation.mjs";
import { loadIndex, toPublicQuestion } from "@/lib/learn/content/repository";
import { checkAnswer } from "@/lib/learn/domain/answers";

const syllable = (onset: number, vowel: number, coda = 0) => String.fromCodePoint(0xac00 + onset * 588 + vowel * 28 + coda);
describe("Vietnamese Korean pronunciation contract", () => {
  it("maps all 19 onsets and all 21 vowels exactly as requested", () => {
    const initials = ["g", "c", "n", "đ", "t", "l", "m", "b", "p", "s", "x", "", "d", "ch", "ch'", "kh", "th", "p'", "h"];
    const vowels = ["a", "e", "ya", "ye", "ơ", "ê", "yơ", "yê", "ô", "oa", "oe", "ôe", "yô", "u", "uơ", "uê", "ui", "yu", "ư", "ưi", "i"];
    expect(INITIALS).toEqual(initials); expect(VOWELS).toEqual(vowels);
    for (let i = 0; i < 19; i++) for (let v = 0; v < 21; v++) {
      const onset = /^[eêiy]/.test(vowels[v]) ? initials[i] === "c" ? "k" : initials[i] === "g" ? "gh" : initials[i] : initials[i];
      const reading = onset === "c" && vowels[v] === "oa" ? "qua" : onset === "c" && vowels[v] === "u" ? "qu" : onset + vowels[v];
      expect(transcribeSurface(syllable(i, v))).toBe(reading);
    }
  });
  it("uses exactly seven codas; onset spelling exceptions never affect a final c", () => {
    for (const [coda, suffix] of [[1, "c"], [4, "n"], [7, "t"], [8, "l"], [16, "m"], [17, "p"], [21, "ng"]] as const) expect(transcribeSurface(syllable(11, 0, coda))).toBe("a" + suffix);
    expect(transcribeSurface("깩 깍 곅 각" )).toBe("kec cac ghyêc gac");
    expect(transcribeSurface("꽈 꾸 꽉 꾹 과 구" )).toBe("qua qu quac quc goa gu");
    for (let c = 1; c < 28; c++) if (![1, 4, 7, 8, 16, 17, 21].includes(c)) expect(() => transcribeSurface(syllable(11, 0, c))).toThrow("seven surface codas");
  });
  it("uses actual pronunciation for liaison, neutralization, nasalization and tense sounds", () => {
    const cases = {
      "감사합니다.": "gamsahamniđa.", "반갑습니다": "bangapxưmniđa", "괜찮아요.": "goench'anayô.",
      "먹어요": "mơgơyô", "셋": "sêt", "학교에 가요.": "hackyôê gayô.",
      "내일 갈 거예요.": "neil gal cơyêyô.", "몇 시예요?": "myơt xiyêyô?",
      "저는 한국 사람이에요.": "dơnưn hanguc xalamiêyô.", "직진하세요.": "dicchinhasêyô.",
    };
    for (const [ko, vi] of Object.entries(cases)) expect(pronunciationVi(ko), ko).toBe(vi);
    expect(() => pronunciationVi("새단어")).toThrow("Review Korean surface pronunciation");
  });
  it("localizes readings throughout the Vietnamese course without changing grading, target text or audio", async () => {
    const en = (await loadIndex("korean", { locale: "en" })).bundle;
    const vi = (await loadIndex("korean", { locale: "vi" })).bundle;
    const fr = (await loadIndex("korean", { locale: "fr" })).bundle;
    for (let i = 0; i < en.questions.length; i++) {
      const a = en.questions[i], b = vi.questions[i];
      expect(b.answer, a.id).toEqual(a.answer); expect(b.target).toEqual(a.target); expect(b.audioText).toEqual(a.audioText);
      expect(b.options?.map(o => o.id)).toEqual(a.options?.map(o => o.id));
      if (a.answer.kind === "choice") expect(checkAnswer(b, a.answer.id)).toBe(true);
      if (a.target?.romanization) expect(b.target?.romanizationVi).toBeTruthy();
      if (a.tags?.includes("read")) {
        if (b.answer.kind === "choice") {
          const correctId = b.answer.id;
          expect(b.options?.find(o => o.id === correctId)?.text).toBe(pronunciationVi(b.target!.text));
        }
        expect(fr.questions[i].options).toEqual(a.options);
        expect(new Set(b.options?.map(o => o.text)).size).toBe(b.options?.length);
      }
      expect(toPublicQuestion(b)).not.toHaveProperty("answer");
    }
    expect(vi.catalog.courses[0].units[0].lessons[0].example).toContain("a · ơ · ô · u · ư · i");
    const thanks = vi.questions.find(q => q.id === "k-k2-greetings-2")!;
    expect(thanks.hints.join(" ")).toContain("gamsahamniđa");
    expect(thanks.explanation).toContain("gamsahamniđa");
  });
});

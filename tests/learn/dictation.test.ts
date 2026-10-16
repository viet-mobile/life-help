import { describe, expect, it } from "vitest";
import { checkAnswer, normalizeDictation, validateResponse } from "@/lib/learn/domain/answers";
import type { Question } from "@/lib/learn/types";

const q = (answer: string, lang: "en" | "ko"): Question => ({ id: "d", site: lang === "en" ? "english" : "korean", skillId: "s", type: "short_answer", difficulty: 1, prompt: "", hints: [], explanation: "", role: "variant", status: "PUBLISHED", answer: { kind: "text", accepted: [answer], dictation: lang } }) as Question;

describe("dictation rules: what is forgiven and what is not", () => {
  it("English: case, spaces, end and inner punctuation, curly quotes and dashes are forgiven", () => {
    const k = q("It's a well-known place, isn't it?", "en");
    for (const ok of ["It's a well-known place, isn't it?", "it's a well-known place isn't it", "  IT’S   a well‑known place,  isn’t it  ", "Its a well-known place isnt it".replace("Its", "It's").replace("isnt", "isn't")]) expect(checkAnswer(k, ok), ok).toBe(true);
  });
  it("English: spelling errors and dropped apostrophes / hyphens are NOT accepted", () => {
    const k = q("It's a well-known place, isn't it?", "en");
    for (const bad of ["Its a well-known place, isn't it?", "It's a wellknown place, isn't it?", "It's a well-known plase, isn't it?", "It's a well known place, isn't it?", "It's a well-known place"]) expect(checkAnswer(k, bad), bad).toBe(false);
  });
  it("Korean: spacing differences are NOT accepted; end punctuation, quotes and repeated spaces are", () => {
    const k = q("저는 어제 친구와 함께 영화를 봤어요.", "ko");
    expect(checkAnswer(k, "저는 어제 친구와 함께 영화를 봤어요")).toBe(true);
    expect(checkAnswer(k, "  저는  어제 친구와 함께 영화를 봤어요!  ")).toBe(true);
    expect(checkAnswer(k, "저는 어제 친구와 함께 영화를봤어요.")).toBe(false); // missing space
    expect(checkAnswer(k, "저는 어제 친구와 함께 영화를 봤 어요.")).toBe(false); // extra space inside a word
    expect(checkAnswer(k, "저는 어제 친구와 함께 영화를 봤어여.")).toBe(false); // spelling
  });
  it("Korean: a decomposed (jamo) typing that composes to the same syllables is the same text", () => {
    expect(normalizeDictation("한국어", "ko")).toBe(normalizeDictation("한국어".normalize("NFD"), "ko"));
  });
  it("validation: an empty or oversized response is refused", () => {
    const k = q("hello", "en");
    expect(validateResponse(k, "")).not.toBeNull();
    expect(validateResponse(k, "x".repeat(2000))).not.toBeNull();
    expect(validateResponse(k, "hello")).toBeNull();
  });
});

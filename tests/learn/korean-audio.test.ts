import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const bundle = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../lib/learn/content/korean/korean.json"), "utf8")) as { questions: Array<{ id: string; type: string; audioText?: string; audioAnswer?: string; target?: { text: string } }> };

describe("study.korean: every question can be heard", () => {
  it("each question has audio up front (audioText) or, for pick-the-Korean / fill-in questions, the correct sentence after answering (audioAnswer)", () => {
    const silent = bundle.questions.filter((q) => !q.audioText && !q.audioAnswer).map((q) => q.id);
    expect(silent).toEqual([]);
  });
  it("audioAnswer is Korean and is never set where the audio is already played up front", () => {
    for (const q of bundle.questions.filter((x) => x.audioAnswer)) {
      expect(/[가-힣]/.test(q.audioAnswer!), q.id).toBe(true);
      expect(q.audioText, q.id).toBeUndefined();
    }
  });
  it("audioAnswer is not part of the question sent to the browser (it would give the answer away)", () => {
    const repo = fs.readFileSync(path.resolve(__dirname, "../../lib/learn/content/repository.ts"), "utf8");
    expect(repo).not.toContain("audioAnswer");
  });
});

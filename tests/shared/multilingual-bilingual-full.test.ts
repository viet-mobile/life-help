import { describe, expect, it } from "vitest";
import { formatLevelLabel, formatMinutes } from "../../lib/think/grades";
import { applyFlat, flatten } from "../../lib/think/flat";
import { mergeBilingual } from "../../lib/think/localize";
import type { ThinkTask } from "../../lib/think/types";

describe("multilingual, bilingual and level translation verification", () => {
  it("formats minutes with proper spacing per language convention (attached for CJK, spaced for others)", () => {
    // Korean: attached without space
    expect(formatMinutes(10, "ko", true)).toBe("≈10분");
    expect(formatMinutes(10, "ko", false)).toBe("10분");

    // Chinese Traditional: attached without space
    expect(formatMinutes(10, "zh-Hant", true)).toBe("≈10分鐘");
    expect(formatMinutes(10, "zh-Hant", false)).toBe("10分鐘");

    // Chinese Simplified: attached without space
    expect(formatMinutes(10, "zh-Hans", true)).toBe("≈10分钟");
    expect(formatMinutes(10, "zh-Hans", false)).toBe("10分钟");

    // Japanese: attached without space
    expect(formatMinutes(10, "ja", true)).toBe("≈10分");
    expect(formatMinutes(10, "ja", false)).toBe("10分");

    // Vietnamese: spaced
    expect(formatMinutes(10, "vi", true)).toBe("≈ 10 phút");
    expect(formatMinutes(10, "vi", false)).toBe("10 phút");

    // English: spaced
    expect(formatMinutes(10, "en", true)).toBe("≈ 10 min");
    expect(formatMinutes(10, "en", false)).toBe("10 min");
  });

  it("translates 초등, 중등, 고등, Beginner, Intermediate, Advanced correctly across languages", () => {
    expect(formatLevelLabel("초등", "vi")).toBe("Tiểu học");
    expect(formatLevelLabel("초등", "en")).toBe("Elementary");
    expect(formatLevelLabel("초등", "ko")).toBe("초등");
    expect(formatLevelLabel("초등", "ar")).toBe("ابتدائي");

    expect(formatLevelLabel("중등", "vi")).toBe("THCS");
    expect(formatLevelLabel("중등", "en")).toBe("Middle School");

    expect(formatLevelLabel("고등", "vi")).toBe("THPT");
    expect(formatLevelLabel("고등", "en")).toBe("High School");

    expect(formatLevelLabel("Beginner", "vi")).toBe("Sơ cấp");
    expect(formatLevelLabel("Intermediate", "vi")).toBe("Trung cấp");
    expect(formatLevelLabel("Advanced", "vi")).toBe("Cao cấp");
  });

  it("ensures applyFlat does not clobber write step prompt and hints with Korean raw text", () => {
    const sampleTask: ThinkTask = {
      id: "test-1",
      subject: "math",
      level: 1,
      levelLabel: "초등",
      title: "Title Ko",
      uiLang: "ko",
      format: "find-error-fix",
      generative: false,
      goal: "Goal Ko",
      thinking: ["Think 1"],
      differsFromPlain: "Diff",
      prerequisites: ["Prereq"],
      minutes: 10,
      curriculum: null,
      material: "Material Ko",
      steps: [
        {
          id: "s1",
          kind: "write",
          prompt: "Write Prompt Ko",
          placeholder: "Placeholder Ko",
          minChars: 10,
          checks: [],
          selfAssess: ["Self 1 Ko"],
          modelAnswers: [{ text: "Model 1 Ko" }],
          badAnswers: [],
          humanReview: "Review Ko",
          hints: ["Hint 1 Ko"],
        },
      ],
      rubric: [],
      alternatives: [],
      hardCases: [],
      cautions: { language: "", culture: "", accessibility: "" },
      autoVsHuman: { auto: [], human: [] },
      status: "draft",
    };

    const flat = flatten(sampleTask);
    expect(flat["s.s1.prompt"]).toBe("Write Prompt Ko");
    expect(flat["s.s1.hint.0"]).toBe("Hint 1 Ko");

    // Translation overlay in Vietnamese
    const overlayVi: Record<string, string> = {
      title: "Title Vi",
      goal: "Goal Vi",
      material: "Material Vi",
      "s.s1.prompt": "Write Prompt Vi",
      "s.s1.placeholder": "Placeholder Vi",
      "s.s1.hint.0": "Hint 1 Vi",
      "s.s1.selfAssess.0": "Self 1 Vi",
      "s.s1.model.0": "Model 1 Vi",
    };

    const translated = applyFlat(sampleTask, overlayVi);
    const step1 = translated.steps[0];
    expect(step1.kind).toBe("write");
    if (step1.kind === "write") {
      // Must NOT be clobbered back to Write Prompt Ko!
      expect(step1.prompt).toBe("Write Prompt Vi");
      expect(step1.hints[0]).toBe("Hint 1 Vi");
      expect(step1.placeholder).toBe("Placeholder Vi");
      expect(step1.selfAssess[0]).toBe("Self 1 Vi");
      expect(step1.modelAnswers[0].text).toBe("Model 1 Vi");
    }
  });

  it("merges multiple languages cleanly without duplicates", () => {
    const taskVi: ThinkTask = {
      id: "test-m",
      subject: "math",
      level: 1,
      levelLabel: "초등",
      title: "Title Vi",
      uiLang: "ko",
      format: "find-error-fix",
      generative: false,
      goal: "Goal Vi",
      thinking: [],
      differsFromPlain: "",
      prerequisites: [],
      minutes: 10,
      curriculum: null,
      material: "Material Vi",
      steps: [
        {
          id: "s1",
          kind: "choose",
          prompt: "Prompt Vi",
          options: [{ id: "a", text: "Option A Vi" }],
          correct: ["a"],
          explain: "Explain Vi",
          hints: ["Hint Vi"],
        },
      ],
      rubric: [],
      alternatives: [],
      hardCases: [],
      cautions: { language: "", culture: "", accessibility: "" },
      autoVsHuman: { auto: [], human: [] },
      status: "draft",
    };

    const taskEn: ThinkTask = {
      ...taskVi,
      title: "Title En",
      goal: "Goal En",
      material: "Material En",
      steps: [
        {
          id: "s1",
          kind: "choose",
          prompt: "Prompt En",
          options: [{ id: "a", text: "Option A En" }],
          correct: ["a"],
          explain: "Explain En",
          hints: ["Hint En"],
        },
      ],
    };

    const taskAr: ThinkTask = {
      ...taskVi,
      title: "Title Ar",
      goal: "Goal Ar",
      material: "Material Ar",
      steps: [
        {
          id: "s1",
          kind: "choose",
          prompt: "Prompt Ar",
          options: [{ id: "a", text: "Option A Ar" }],
          correct: ["a"],
          explain: "Explain Ar",
          hints: ["Hint Ar"],
        },
      ],
    };

    let merged = mergeBilingual(taskVi, taskEn);
    expect(merged.title).toBe("Title Vi\nTitle En");
    expect(merged.steps[0].prompt).toBe("Prompt Vi\nPrompt En");

    merged = mergeBilingual(merged, taskAr);
    expect(merged.title).toBe("Title Vi\nTitle En\nTitle Ar");
    expect(merged.steps[0].prompt).toBe("Prompt Vi\nPrompt En\nPrompt Ar");

    // Merging again should not duplicate
    merged = mergeBilingual(merged, taskEn);
    expect(merged.title).toBe("Title Vi\nTitle En\nTitle Ar");
  });
});

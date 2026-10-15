import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { MATH_HS_DATA } from "@/lib/learn/content/bank";

const hsIds = new Set(MATH_HS_DATA.sets.flatMap((s) => s.rows.map((_, i) => `${s.id}-${String(i + 1).padStart(3, "0")}`)));

describe("high-school math bank reaches the learner path", () => {
  it("Korean learners get all 6,491 questions as PUBLISHED, in Korean", async () => {
    const { bundle } = await loadIndex("math");
    const hs = bundle.questions.filter((q) => hsIds.has(q.id));
    expect(hs.length).toBe(6491);
    expect(hs.every((q) => q.status === "PUBLISHED")).toBe(true);
    expect(hs.some((q) => /[가-힣]/.test(q.prompt))).toBe(true);
  });
  it("English learners get the same questions with English wording only", async () => {
    const { bundle } = await loadIndex("math", { locale: "en" });
    const hs = bundle.questions.filter((q) => hsIds.has(q.id));
    expect(hs.length).toBe(6491);
    for (const q of hs) expect(q.prompt, q.id).not.toMatch(/[가-힣]/);
  });
  it("a language without HS wording gets none of them (never another language), and the original bank is still served", async () => {
    const { bundle } = await loadIndex("math", { locale: "vi" });
    expect(bundle.questions.filter((q) => hsIds.has(q.id)).length).toBe(0);
    expect(bundle.questions.filter((q) => q.id.startsWith("b-")).length).toBe(6672);
  });
});

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
  it("every language now carries the HS wording and gets all of the sets (since 2026-10-22); a language whose overlay lacked any HS template would get none, never another language", async () => {
    const { bundle } = await loadIndex("math", { locale: "vi" });
    expect(bundle.questions.filter((q) => hsIds.has(q.id)).length).toBe(hsIds.size);
    expect(bundle.questions.filter((q) => q.id.startsWith("b-") && !hsIds.has(q.id)).length).toBe(6672);
    const { mathHsTemplates } = await import("@/lib/learn/content/bank");
    expect(mathHsTemplates("vi", { templates: { only_one: { prompt: "x", hints: ["a", "b"], explanation: "y" } } })).toBeNull();
  });
});

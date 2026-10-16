import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import servedBank from "@/lib/learn/content/bank/english-draft.json";
import ledger from "@/scripts/learn/english-bank/ledger.json";
import { checkAnswer } from "@/lib/learn/domain/answers";
import type { Question } from "@/lib/learn/types";

const key = (q: Question): string | string[] => (q.answer.kind === "choice" ? q.answer.id : q.answer.kind === "order" ? q.answer.ids : q.answer.kind === "text" ? q.answer.accepted[0] : "");

describe("Claude English practice bank reaches the learner path", () => {
  it("Korean-language learners get every question of english-draft.json as PUBLISHED practice variants", async () => {
    const { bundle } = await loadIndex("english");
    const eb = bundle.questions.filter((q) => q.id.startsWith("eb-"));
    expect(eb.length).toBe((servedBank as { questions: unknown[] }).questions.length);
    expect(eb.length).toBeGreaterThanOrEqual(4000);
    expect(eb.every((q) => q.status === "PUBLISHED" && q.role === "variant" && q.site === "english")).toBe(true);
    expect(eb.some((q) => "packet" in q)).toBe(false);
  });
  it("publication gate: every served question is a carried-over (already live) question or belongs to an independently reviewed item", () => {
    const carry = new Set((ledger as { carryOverQuestions: string[] }).carryOverQuestions);
    const reviewed = (ledger as { reviewed: Record<string, unknown> }).reviewed;
    for (const q of (servedBank as { questions: { id: string }[] }).questions) expect(carry.has(q.id) || q.id.split("-")[1] in reviewed, q.id).toBe(true);
  });
  it("every question is well formed and graded correct by its own key; options and ids are consistent", async () => {
    const { bundle } = await loadIndex("english");
    const skills = new Set(bundle.catalog.skills.map((s) => s.id));
    for (const q of bundle.questions.filter((x) => x.id.startsWith("eb-"))) {
      expect(skills.has(q.skillId), q.id).toBe(true);
      const ids = (q.options ?? []).map((o) => o.id);
      expect(new Set(ids).size, q.id).toBe(ids.length);
      if (q.answer.kind === "choice") expect(ids, q.id).toContain(q.answer.id);
      if (q.answer.kind === "order") expect([...q.answer.ids].sort(), q.id).toEqual([...ids].sort());
      expect(checkAnswer(q, key(q)), q.id).toBe(true);
      expect(q.hints.length, q.id).toBeGreaterThanOrEqual(1);
      expect(q.explanation.trim().length, q.id).toBeGreaterThan(0);
    }
  });
  it("no two questions are the same after normalisation (prompt + option set)", async () => {
    const { bundle } = await loadIndex("english");
    const seen = new Set<string>();
    for (const q of bundle.questions.filter((x) => x.id.startsWith("eb-"))) {
      const k = `${q.prompt.toLowerCase().replace(/\s+/g, " ")}|${(q.audioText ?? "").toLowerCase()}|${(q.options ?? []).map((o) => o.text.toLowerCase()).sort().join("|")}`;
      expect(seen.has(k), q.id).toBe(false);
      seen.add(k);
    }
  });
  it("a language other than the site's own receives none of them (the wording is Korean)", async () => {
    for (const locale of ["en", "vi", "ja", "zh-Hans"] as const) {
      const { bundle } = await loadIndex("english", { locale });
      expect(bundle.questions.some((q) => q.id.startsWith("eb-")), locale).toBe(false);
    }
  });
  it("an ordering with a repeated word accepts either tile for the repeated word", () => {
    const q = {
      id: "t", site: "english", skillId: "e.x", type: "ordering", difficulty: 1, prompt: "", hints: [], explanation: "", role: "variant",
      options: [{ id: "w1", text: "I" }, { id: "w2", text: "think" }, { id: "w3", text: "so" }, { id: "w4", text: "I" }, { id: "w5", text: "do" }],
      answer: { kind: "order", ids: ["w1", "w2", "w3", "w4", "w5"] },
    } as unknown as Question;
    expect(checkAnswer(q, ["w1", "w2", "w3", "w4", "w5"])).toBe(true);
    expect(checkAnswer(q, ["w4", "w2", "w3", "w1", "w5"])).toBe(true);
    expect(checkAnswer(q, ["w4", "w2", "w3", "w5", "w1"])).toBe(false);
  });
});

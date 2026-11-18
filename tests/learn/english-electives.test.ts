import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import secondary from "@/lib/learn/content/secondary/english.json";
import served from "@/lib/learn/content/bank/english-draft.json";
import pending from "@/lib/learn/content/bank/english-pending.json";
import promoted from "../../scripts/learn/english-bank/electives-core.json";
import { loadIndex } from "@/lib/learn/content/repository";
import { NEUTRAL_SET } from "@/lib/learn/hintGate";
import type { Question } from "@/lib/learn/types";

const SKILLS = ["conv", "job", "media", "world", "lit", "debate", "write"].map((k) => `e.h.${k}`);
type Cat = { catalog: { courses: { id: string; grade: string; elective?: boolean; units: { lessons: { id: string; skillIds: string[]; questionIds: string[]; challengeId: string }[] }[] }[]; skills: { id: string; prerequisiteId?: string }[] }; questions: Question[] };
const cat = secondary as unknown as Cat;
const course = cat.catalog.courses.find((c) => c.id === "en-h3e-electives")!;
const bank = (served as { questions: Question[] }).questions;
/** sha256 of the non-elective served English bank as released on main (be08f10): the elective train must not change a single existing question */
const RELEASED_BANK_SHA = "85641b9c789fd55c2d2d56a59122b3761e5cc4941f68980c4de8d5b09f3c5893";
const sha = (qs: Question[]) => crypto.createHash("sha256").update(JSON.stringify([...qs].sort((a, b) => (a.id < b.id ? -1 : 1)), (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v)).replace(/ /g, " ")).digest("hex");

describe("English H3 electives release candidate", () => {
  it("is an elective H3 course with one lesson per elective skill, 4 core + 1 challenge each, and 7 diagnostics", () => {
    expect(course.elective).toBe(true);
    expect(course.grade).toBe("H3");
    const lessons = course.units.flatMap((u) => u.lessons);
    expect(lessons.map((l) => l.skillIds[0])).toEqual(SKILLS);
    for (const l of lessons) { expect(l.questionIds).toHaveLength(4); expect(l.challengeId).toBeTruthy(); }
    const own = cat.questions.filter((q) => q.id.startsWith("e-h3e-"));
    expect(own).toHaveLength(42);
    expect(own.filter((q) => q.role === "diagnostic")).toHaveLength(7);
    for (const s of SKILLS) { const sk = cat.catalog.skills.find((x) => x.id === s)!; expect(sk, s).toBeDefined(); expect(sk.prerequisiteId, s).toBeUndefined(); }
  });
  it("visible to H2 and H3 learners only, beside (not instead of) their grade course", async () => {
    for (const grade of ["H2", "H3"] as const) {
      const { bundle } = await loadIndex("english", { grade });
      const ids = bundle.catalog.courses.map((c) => c.id);
      expect(ids, grade).toContain("en-h3e-electives");
      expect(ids.filter((id) => id !== "en-h3e-electives"), grade).toHaveLength(1);
    }
    for (const grade of ["E3", "M2", "M3", "H1"] as const) expect((await loadIndex("english", { grade })).bundle.catalog.courses.map((c) => c.id), grade).not.toContain("en-h3e-electives");
  });
  it("bank <-> catalog duplication is 0: promoted bank questions are not served, no catalog prompt is also a bank prompt", () => {
    const ids = new Set(bank.map((q) => q.id));
    for (const id of (promoted as { questionIds: string[] }).questionIds) expect(ids.has(id), id).toBe(false);
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const catalogPrompts = new Set(cat.questions.filter((q) => q.id.startsWith("e-h3e-")).map((q) => norm(q.prompt) + "|" + (q.options ?? []).map((o) => norm(o.text)).sort().join("|")));
    const dup = bank.filter((q) => q.skillId.startsWith("e.h.") && catalogPrompts.has(norm(q.prompt) + "|" + (q.options ?? []).map((o) => norm(o.text)).sort().join("|")));
    expect(dup.map((q) => q.id)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import secondary from "@/lib/learn/content/secondary/english.json";
import served from "@/lib/learn/content/bank/english-draft.json";
import unlinked from "@/lib/learn/content/bank/english-unlinked.json";
import promoted from "../../scripts/learn/english-bank/electives-core.json";

const SKILLS = ["conv", "job", "media", "world", "lit", "debate", "write"].map((k) => `e.h.${k}`);
const course = (secondary as unknown as { catalog: { courses: { id: string; grade: string; elective?: boolean; units: { lessons: { id: string; skillIds: string[]; questionIds: string[]; challengeId: string }[] }[] }[]; skills: { id: string; prerequisiteId?: string }[] }; questions: { id: string; skillId: string; role: string; status: string }[] }).catalog.courses.find((c) => c.id === "en-h3e-electives")!;

describe("English H3 electives are linked into the catalog", () => {
  it("is an elective H3 course with one lesson per elective skill, 4 core + 1 challenge each", () => {
    expect(course.elective).toBe(true);
    expect(course.grade).toBe("H3");
    const lessons = course.units.flatMap((u) => u.lessons);
    expect(lessons.map((l) => l.skillIds[0])).toEqual(SKILLS);
    for (const l of lessons) { expect(l.questionIds).toHaveLength(4); expect(l.challengeId).toBeTruthy(); }
  });
  it("skills exist in the catalog, have no cross-grade prerequisite, and have a diagnostic question", () => {
    const cat = (secondary as unknown as { catalog: { skills: { id: string; prerequisiteId?: string }[] }; questions: { skillId: string; role: string }[] });
    for (const s of SKILLS) {
      const sk = cat.catalog.skills.find((x) => x.id === s)!;
      expect(sk, s).toBeDefined();
      expect(sk.prerequisiteId, s).toBeUndefined();
      expect(cat.questions.some((q) => q.skillId === s && q.role === "diagnostic"), s).toBe(true);
    }
  });
  it("every reviewed elective bank question is served; none is left unlinked; promoted questions are not served twice", () => {
    expect((unlinked as { questions: unknown[] }).questions.length).toBe(0);
    const ids = new Set((served as { questions: { id: string }[] }).questions.map((q) => q.id));
    for (const id of (promoted as { questionIds: string[] }).questionIds) expect(ids.has(id), id).toBe(false);
    const bySkill = (served as { questions: { skillId: string }[] }).questions.filter((q) => SKILLS.includes(q.skillId));
    expect(bySkill.length).toBeGreaterThan(1200);
  });
});

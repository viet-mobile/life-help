import { describe, expect, it } from "vitest";
import { demoContentRepository } from "@/lib/learn/content/repository";
import { indexContent, scopeToGrade, toMetaBundle } from "@/lib/learn/content/indexer";
import mathDemo from "@/lib/learn/content/demo/math.json";
import englishDemo from "@/lib/learn/content/demo/english.json";
import { learnConfig } from "@/lib/learn/config";
import { ko } from "@/lib/learn/i18n/ko";
import { vi } from "@/lib/learn/i18n/vi";
import { parsePlayerState } from "@/lib/learn/server/stateCodec";
import { ELEMENTARY_GRADES, GRADES, SECONDARY_GRADES, SITES, isGrade, schoolLevel, type ContentBundle, type Grade } from "@/lib/learn/types";

const DEMO: Record<string, ContentBundle> = { math: mathDemo as unknown as ContentBundle, english: englishDemo as unknown as ContentBundle };

describe("one canonical grade model (math, english, profile, routing)", () => {
  it("has exactly the twelve expected identifiers, elementary first, and middle / high are unchanged", () => {
    expect([...GRADES]).toEqual(["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"]);
    expect([...ELEMENTARY_GRADES]).toEqual(["E1", "E2", "E3", "E4", "E5", "E6"]);
    expect([...SECONDARY_GRADES]).toEqual(["M1", "M2", "M3", "H1", "H2", "H3"]); // the stored identifiers of existing students keep their meaning
    expect(new Set(GRADES).size).toBe(12);
  });

  it("isGrade accepts the 12 and rejects everything else", () => {
    for (const g of GRADES) expect(isGrade(g)).toBe(true);
    for (const bad of ["E0", "E7", "M0", "M4", "H4", "e1", "m1", "E", "", "1", "초1", "Lớp 1", null, undefined, 1, {}]) expect(isGrade(bad), String(bad)).toBe(false);
  });

  it("classifies the school level (elementary vs secondary)", () => {
    for (const g of ELEMENTARY_GRADES) expect(schoolLevel(g)).toBe("elementary");
    for (const g of SECONDARY_GRADES) expect(schoolLevel(g)).toBe("secondary");
  });

  it("every grade has a placement starting ability, a label in each locale, and survives the state codec", () => {
    for (const g of GRADES) {
      const ability = learnConfig.diagnostic.initialAbilityByGrade[g];
      expect(ability, g).toBeGreaterThanOrEqual(1);
      expect(ability, g).toBeLessThanOrEqual(5);
      expect(ko[`grade.${g}` as keyof typeof ko], g).toBeTruthy();
      expect(vi[`grade.${g}` as keyof typeof vi], g).toBeTruthy();
      const raw = { site: "math", profile: { nickname: "테스터", grade: g, goal: "habit", avatar: "fox", onboardingDone: true } };
      expect(parsePlayerState(raw, "math").profile?.grade, g).toBe(g);
    }
    // no ordering regression: placement ability never decreases as the grade rises
    const order = GRADES.map((g) => learnConfig.diagnostic.initialAbilityByGrade[g]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("an unknown grade in stored / client state is dropped, never trusted", () => {
    const raw = { site: "math", profile: { nickname: "x1", grade: "E9", goal: "habit", avatar: "fox", onboardingDone: true } };
    expect(parsePlayerState(raw, "math").profile).toBeNull();
  });
});

describe.each(SITES)("grade-scoped curriculum: %s", (site) => {
  it("a middle / high student sees EXACTLY the pre-elementary curriculum (scopeToGrade is a no-op for the demo content)", async () => {
    const merged = await demoContentRepository.getBundle(site);
    for (const g of SECONDARY_GRADES) {
      const scoped = scopeToGrade(merged, g);
      expect(scoped.catalog.courses, g).toEqual(DEMO[site].catalog.courses);
      expect(scoped.catalog.skills, g).toEqual(DEMO[site].catalog.skills);
      expect(scoped.questions, g).toEqual(DEMO[site].questions.filter((q) => q.status === "PUBLISHED"));
    }
  });

  it("an elementary student sees only their own grade's course, its skills and its questions", async () => {
    const merged = await demoContentRepository.getBundle(site);
    const seenCourses = new Set<string>();
    for (const g of ELEMENTARY_GRADES) {
      const scoped = scopeToGrade(merged, g);
      expect(scoped.catalog.courses.map((c) => c.grade), g).toEqual([g]);
      const course = scoped.catalog.courses[0];
      seenCourses.add(course.id);
      const index = indexContent(toMetaBundle(scoped));
      const lessons = course.units.flatMap((u) => u.lessons);
      expect(lessons.length, `${g} lessons`).toBe(5);
      // every question the student can reach practises a skill that exists in THEIR scoped curriculum
      for (const q of scoped.questions) expect(index.skills.has(q.skillId), q.id).toBe(true);
      // the placement pool is this grade's, and large enough for the 6-question adaptive diagnostic
      expect(scoped.questions.filter((q) => q.role === "diagnostic").length, `${g} diagnostic`).toBeGreaterThanOrEqual(learnConfig.diagnostic.maxQuestions);
      // nothing from another grade or from the secondary course leaks in: every question id carries this grade
      for (const q of scoped.questions) expect(q.id.includes(`-${g.toLowerCase()}-`), `${g}: ${q.id}`).toBe(true);
    }
    expect(seenCourses.size).toBe(6); // six distinct elementary courses
  });

  it("the learning path of each grade is its own, sequential, and ends with something to play", async () => {
    const merged = await demoContentRepository.getBundle(site);
    for (const g of GRADES) {
      const index = indexContent(toMetaBundle(scopeToGrade(merged, g)));
      expect(index.lessonOrder.length, g).toBeGreaterThanOrEqual(4);
      expect(new Set(index.lessonOrder).size, g).toBe(index.lessonOrder.length);
    }
    const e1 = indexContent(toMetaBundle(scopeToGrade(merged, "E1")));
    const e2 = indexContent(toMetaBundle(scopeToGrade(merged, "E2")));
    expect(e1.lessonOrder.some((id) => e2.lessonOrder.includes(id))).toBe(false);
  });
});

describe("the merged bundle", () => {
  it("lists elementary courses first and keeps ids unique across demo + elementary", async () => {
    for (const site of SITES) {
      const merged = await demoContentRepository.getBundle(site);
      const grades = merged.catalog.courses.map((c) => c.grade as Grade);
      expect(grades.slice(0, 6)).toEqual([...ELEMENTARY_GRADES]);
      expect(grades.slice(6).every((g) => schoolLevel(g) === "secondary")).toBe(true);
      const ids = merged.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      const skills = merged.catalog.skills.map((s) => s.id);
      expect(new Set(skills).size).toBe(skills.length);
    }
  });
});

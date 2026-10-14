import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/learn/domain/answers";
import type { Question } from "@/lib/learn/types";
import {
  advancedReadingBundle,
  advancedReadingViOverlay,
  ADVANCED_READING_COURSES,
  ADVANCED_READING_SKILLS,
  ADVANCED_READING_QUESTIONS,
} from "@/lib/learn/content/reading";

function correctResponse(q: Question): string | string[] {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  return k.ids;
}

describe("English Advanced Reading Track (CEFR B1-B2 / College Preparatory)", () => {
  it("exports bundle and components correctly", () => {
    expect(advancedReadingBundle).toBeDefined();
    expect(advancedReadingViOverlay).toBeDefined();
    expect(ADVANCED_READING_COURSES).toHaveLength(4);
    expect(ADVANCED_READING_SKILLS).toHaveLength(8);
    expect(ADVANCED_READING_QUESTIONS).toHaveLength(56);
  });

  it("defines 4 elective courses in Grade H3", () => {
    const courseIds = ADVANCED_READING_COURSES.map((c) => c.id);
    expect(courseIds).toEqual(["en-el-hum", "en-el-sci", "en-el-eco", "en-el-aca"]);

    for (const course of ADVANCED_READING_COURSES) {
      expect(course.grade).toBe("H3");
      expect(course.elective).toBe(true);
      expect(course.units).toHaveLength(1);
      expect(course.units[0].lessons).toHaveLength(2);
    }
  });

  it("contains 8 lessons across the 4 courses", () => {
    const allLessons = ADVANCED_READING_COURSES.flatMap((c) => c.units.flatMap((u) => u.lessons));
    expect(allLessons).toHaveLength(8);
    const lessonIds = allLessons.map((l) => l.id);
    expect(new Set(lessonIds).size).toBe(8);
  });

  it("contains 56 published questions with full multiple-choice attributes", () => {
    expect(ADVANCED_READING_QUESTIONS).toHaveLength(56);

    for (const q of ADVANCED_READING_QUESTIONS) {
      expect(q.status).toBe("PUBLISHED");
      expect(q.difficulty).toBeGreaterThanOrEqual(1);
      expect(q.difficulty).toBeLessThanOrEqual(5);
      expect(q.type).toBe("multiple_choice");
      expect(q.prompt).toBeTruthy();
      expect(q.hints.length).toBe(2);
      expect(q.hints[0]).toBeTruthy();
      expect(q.hints[1]).toBeTruthy();
      expect(q.explanation).toBeTruthy();

      // Options verification
      expect(q.options).toBeDefined();
      expect(q.options?.length).toBe(4);
      const optionIds = q.options!.map((o) => o.id);
      expect(optionIds).toEqual(["a", "b", "c", "d"]);
      for (const opt of q.options!) {
        expect(opt.text).toBeTruthy();
      }

      // Answer verification
      expect(q.answer.kind).toBe("choice");
      if (q.answer.kind === "choice") {
        expect(q.answer.id).toBe("a");
      }

      // Check grading correctness
      const response = correctResponse(q as unknown as Question);
      const isCorrect = checkAnswer(q as unknown as Question, response);
      expect(isCorrect).toBe(true);
    }
  });

  it("maintains 100% overlay parity with Vietnamese localization", () => {
    const overlayQuestions = advancedReadingViOverlay.questions as Record<
      string,
      { prompt: string; hints: string[]; explanation: string }
    >;

    for (const original of ADVANCED_READING_QUESTIONS) {
      const localized = overlayQuestions[original.id];

      expect(localized).toBeDefined();
      expect(localized.prompt).toBeTruthy();
      expect(localized.explanation).toBeTruthy();
      expect(localized.hints).toHaveLength(2);
      expect(localized.hints[0]).toBeTruthy();
      expect(localized.hints[1]).toBeTruthy();
    }

    // Courses translation
    for (const course of ADVANCED_READING_COURSES) {
      const locCourse = advancedReadingViOverlay.courses?.[course.id as keyof typeof advancedReadingViOverlay.courses];
      expect(locCourse).toBeDefined();
      expect(locCourse?.title).toBeTruthy();
    }

    // Lessons translation
    const allLessons = ADVANCED_READING_COURSES.flatMap((c) => c.units.flatMap((u) => u.lessons));
    for (const lesson of allLessons) {
      const locLesson = advancedReadingViOverlay.lessons?.[lesson.id as keyof typeof advancedReadingViOverlay.lessons];
      expect(locLesson).toBeDefined();
      expect(locLesson?.title).toBeTruthy();
      expect(locLesson?.concept).toBeTruthy();
      expect(locLesson?.example).toBeTruthy();
    }
  });
});

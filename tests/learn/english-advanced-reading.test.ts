import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/learn/domain/answers";
import type { Question } from "@/lib/learn/types";
import {
  advancedReadingBundle,
  advancedReadingViOverlay,
  ADVANCED_READING_COURSES,
  ADVANCED_READING_SKILLS,
  ADVANCED_READING_QUESTIONS,
  ADVANCED_READING_OVERLAY_LOCALES,
  getAdvancedReadingOverlay,
} from "@/lib/learn/content/reading";

const HANGUL = /[가-힣ㄱ-ㆎ]/;

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

  it("contains 56 draft questions quarantined pending quality review", () => {
    expect(ADVANCED_READING_QUESTIONS).toHaveLength(56);

    for (const q of ADVANCED_READING_QUESTIONS) {
      expect(q.status).toBe("DRAFT");
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
        expect(["a", "b", "c", "d"]).toContain(q.answer.id);
      }

      // Check grading correctness
      const response = correctResponse(q as unknown as Question);
      const isCorrect = checkAnswer(q as unknown as Question, response);
      expect(isCorrect).toBe(true);
    }

    // Verify balanced answer key distribution across a, b, c, d (exactly 14 each)
    const answers = ADVANCED_READING_QUESTIONS.map((q) => (q.answer.kind === "choice" ? q.answer.id : null));
    for (const opt of ["a", "b", "c", "d"]) {
      expect(answers.filter((a) => a === opt).length).toBe(14);
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

  it("maintains 100% multi-locale overlay coverage across all 46 non-core locales with no Hangul leaks", () => {
    expect(ADVANCED_READING_OVERLAY_LOCALES).toHaveLength(46);

    for (const locale of ADVANCED_READING_OVERLAY_LOCALES) {
      const overlay = getAdvancedReadingOverlay(locale);
      expect(overlay, `Overlay for ${locale} must load`).toBeDefined();

      const questions = (overlay?.questions ?? {}) as Record<string, { prompt: string; hints: string[]; explanation: string }>;
      expect(Object.keys(questions), `Questions count for ${locale}`).toHaveLength(56);

      // Verify each question has 2 hints and no Hangul
      for (const [qid, q] of Object.entries(questions)) {
        expect(q.prompt, `${locale} ${qid} prompt`).toBeTruthy();
        expect(q.hints, `${locale} ${qid} hints`).toHaveLength(2);
        expect(q.hints[0], `${locale} ${qid} hint 0`).toBeTruthy();
        expect(q.hints[1], `${locale} ${qid} hint 1`).toBeTruthy();
        expect(q.explanation, `${locale} ${qid} explanation`).toBeTruthy();

        // Quality Gate: No Hangul leaks in any non-Korean presentation overlay
        expect(HANGUL.test(q.prompt), `${locale} ${qid} prompt has Hangul`).toBe(false);
        expect(HANGUL.test(q.hints[0]), `${locale} ${qid} hint 0 has Hangul`).toBe(false);
        expect(HANGUL.test(q.hints[1]), `${locale} ${qid} hint 1 has Hangul`).toBe(false);
        expect(HANGUL.test(q.explanation), `${locale} ${qid} explanation has Hangul`).toBe(false);
      }

      // Verify courses and units
      const courses = (overlay?.courses ?? {}) as Record<string, { title: string }>;
      expect(Object.keys(courses), `Courses count for ${locale}`).toHaveLength(4);
      for (const [cid, c] of Object.entries(courses)) {
        expect(c.title, `${locale} ${cid} title`).toBeTruthy();
        expect(HANGUL.test(c.title), `${locale} ${cid} title has Hangul`).toBe(false);
      }
    }
  });
});

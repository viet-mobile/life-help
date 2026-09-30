import type {
  ContentBundle,
  MetaBundle,
  QuestionMeta,
  Course,
  Lesson,
  Skill,
  Unit,
} from "@/lib/learn/types";

export interface ContentIndex {
  bundle: MetaBundle;
  questions: Map<string, QuestionMeta>;
  lessons: Map<string, { lesson: Lesson; unit: Unit; course: Course }>;
  skills: Map<string, Skill>;
  /** Lessons in learning-path order across all courses. */
  lessonOrder: string[];
  /** lesson id -> lesson ids of the same skill (for skill -> lesson lookup). */
  lessonsBySkill: Map<string, string[]>;
}

export function indexContent(bundle: MetaBundle): ContentIndex {
  const questions = new Map(bundle.questions.map((q) => [q.id, q]));
  const skills = new Map(bundle.catalog.skills.map((s) => [s.id, s]));
  const lessons: ContentIndex["lessons"] = new Map();
  const lessonOrder: string[] = [];
  const lessonsBySkill = new Map<string, string[]>();
  for (const course of bundle.catalog.courses) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        lessons.set(lesson.id, { lesson, unit, course });
        lessonOrder.push(lesson.id);
        for (const sid of lesson.skillIds) {
          lessonsBySkill.set(sid, [...(lessonsBySkill.get(sid) ?? []), lesson.id]);
        }
      }
    }
  }
  return { bundle, questions, lessons, skills, lessonOrder, lessonsBySkill };
}

/** Only PUBLISHED questions may reach students. */
export function publishedOnly(bundle: ContentBundle): ContentBundle {
  return { ...bundle, questions: bundle.questions.filter((q) => q.status === "PUBLISHED") };
}

export function toMetaBundle(bundle: ContentBundle): MetaBundle {
  return {
    catalog: bundle.catalog,
    questions: bundle.questions.map((q) => ({
      id: q.id,
      site: q.site,
      skillId: q.skillId,
      type: q.type,
      difficulty: q.difficulty,
      role: q.role,
      family: q.family,
      tags: q.tags,
      expectedSeconds: q.expectedSeconds,
      status: q.status,
    })),
  };
}

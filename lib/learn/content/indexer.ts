import { SECONDARY_GRADES, schoolLevel, type ContentBundle, type Grade, type MetaBundle, type QuestionMeta, type Course, type Lesson, type Skill, type Unit } from "@/lib/learn/types";

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

/**
 * The slice of a bundle one student works in. Pure and shared by the server and the browser, so the learning path, the placement
 * pool, the skills map, the quests and the achievements are all computed over the SAME grade-scoped content:
 *   elementary grade  -> only the course whose grade equals the student's grade
 *   middle / high     -> only the course of the student's own grade (M1..H3). When the content has no course for that grade yet
 *                        (a database that still holds only the original M1 course), the nearest lower grade that has one is served,
 *                        so a student is never left without a path.
 * Skills are those the in-scope lessons teach (plus their prerequisite chain); questions are those that practise those skills.
 */
function coursesFor(all: Course[], grade: Grade, level: ReturnType<typeof schoolLevel>): Course[] {
  if (level === "elementary") return all.filter((c) => c.grade === grade);
  const secondary = all.filter((c) => schoolLevel(c.grade) === "secondary");
  const own = secondary.filter((c) => c.grade === grade);
  if (own.length) return own;
  for (let i = SECONDARY_GRADES.indexOf(grade as (typeof SECONDARY_GRADES)[number]) - 1; i >= 0; i--) {
    const lower = secondary.filter((c) => c.grade === SECONDARY_GRADES[i]);
    if (lower.length) return lower;
  }
  return secondary;
}

export function scopeToGrade<T extends { catalog: MetaBundle["catalog"]; questions: Array<{ skillId: string }> }>(bundle: T, grade: Grade): T {
  const level = schoolLevel(grade);
  const courses = coursesFor(bundle.catalog.courses, grade, level);
  const byId = new Map(bundle.catalog.skills.map((s) => [s.id, s]));
  const wanted = new Set<string>();
  const add = (id: string | undefined) => {
    while (id && !wanted.has(id) && byId.has(id)) {
      wanted.add(id);
      id = byId.get(id)!.prerequisiteId;
    }
  };
  for (const course of courses) for (const unit of course.units) for (const lesson of unit.lessons) lesson.skillIds.forEach(add);
  return {
    ...bundle,
    catalog: { ...bundle.catalog, courses, skills: bundle.catalog.skills.filter((s) => wanted.has(s.id)) },
    questions: bundle.questions.filter((q) => wanted.has(q.skillId)),
  };
}

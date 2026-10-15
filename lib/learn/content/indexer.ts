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

/** Only PUBLISHED questions may reach students. Courses without complete published questions are excluded to preserve lesson reference integrity. */
export function publishedOnly(bundle: ContentBundle): ContentBundle {
  const publishedQuestions = bundle.questions.filter((q) => q.status === "PUBLISHED");
  const publishedQIds = new Set(publishedQuestions.map((q) => q.id));
  const publishedSkills = new Set(publishedQuestions.map((q) => q.skillId));

  const courses = bundle.catalog.courses
    .map((course) => {
      const units = course.units
        .map((unit) => {
          const lessons = unit.lessons.filter(
            (l) =>
              l.questionIds.length > 0 &&
              l.questionIds.every((qid) => publishedQIds.has(qid)) &&
              (!l.challengeId || publishedQIds.has(l.challengeId)),
          );
          return { ...unit, lessons };
        })
        .filter((u) => u.lessons.length > 0);
      return { ...course, units };
    })
    .filter((c) => c.units.length > 0);

  const activeSkills = new Set<string>();
  courses.forEach((c) => c.units.forEach((u) => u.lessons.forEach((l) => l.skillIds.forEach((sid) => activeSkills.add(sid)))));

  return {
    catalog: {
      ...bundle.catalog,
      courses,
      skills: bundle.catalog.skills.filter((s) => activeSkills.has(s.id) || publishedSkills.has(s.id)),
    },
    questions: publishedQuestions,
  };
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
 *   elementary grade  -> only the course whose grade equals the student's grade (a language level K1..K6 works the same way)
 *   middle / high     -> only the course of the student's own grade (M1..H3). When the content has no course for that grade yet
 *                        (a database that still holds only the original M1 course), the nearest lower grade that has one is served,
 *                        so a student is never left without a path.
 * Skills are those the in-scope lessons teach (plus their prerequisite chain); questions are those that practise those skills.
 */
function coursesFor(all: Course[], grade: Grade, level: ReturnType<typeof schoolLevel>): Course[] {
  if (level === "elementary" || level === "language") return all.filter((c) => c.grade === grade);
  const secondary = all.filter((c) => schoolLevel(c.grade) === "secondary" && !c.elective);
  // elective subjects (economic mathematics, ...) sit next to the grade course of the learners who may take them: H2 and H3
  const electives = grade === "H2" || grade === "H3" ? all.filter((c) => c.elective) : [];
  const own = secondary.filter((c) => c.grade === grade);
  if (own.length) return [...own, ...electives];
  for (let i = SECONDARY_GRADES.indexOf(grade as (typeof SECONDARY_GRADES)[number]) - 1; i >= 0; i--) {
    const lower = secondary.filter((c) => c.grade === SECONDARY_GRADES[i]);
    if (lower.length) return [...lower, ...electives];
  }
  return [...secondary, ...electives];
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

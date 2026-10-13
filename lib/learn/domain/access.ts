import type { ContentBundle, Course, Question, SiteCatalog } from "@/lib/learn/types";

/**
 * Free / Premium, decided on CANONICAL content (never on a translated copy, so every locale has the same boundary).
 *
 * Unit = one lesson item (a lesson's core questions + its challenge), counted per course (one grade / level) in curriculum order:
 *   FREE = the first floor(total / 2) items, PREMIUM = the rest    (25 items -> 12 / 13, 20 -> 10 / 10, 15 -> 7 / 8)
 * The boundary is an ITEM boundary: whole lessons before it are FREE, whole lessons after it are PREMIUM, and the one lesson it falls in
 * (if any) is PARTIAL - a free learner plays its free items and then reaches the Premium gate; no exercise is ever cut in half.
 * Follow-up variants share the tier of their skill's first lesson (a PARTIAL lesson's variants stay available as follow-ups);
 * placement items (role "diagnostic", never served with hints / explanations) are FREE so everyone gets the full placement.
 * Anything not attributable fails closed to PREMIUM.
 *
 * Pure: the server uses it to decide what a learner may receive (authoritative); the browser uses it only for badges and locks.
 */
export type Tier = "FREE" | "PREMIUM";
export type LessonTier = Tier | "PARTIAL";

export interface CourseSplit { courseId: string; grade: string; totalUnits: number; freeUnits: number; premiumUnits: number; lessons: number }
export interface AccessPlan {
  lessonTier: Map<string, LessonTier>;
  questionTier: Map<string, Tier>;
  courses: CourseSplit[];
}

const lessonsOf = (c: Course) => c.units.flatMap((u) => u.lessons);
const itemsOf = (l: { questionIds: string[]; challengeId?: string }) => [...l.questionIds, ...(l.challengeId ? [l.challengeId] : [])];

/**
 * Sites whose whole curriculum is free (no Premium boundary, nothing is gated). Paid Premium is switched off for every learning site
 * for now: remove a site from this set to bring the 50 / 50 Free / Premium split back for it (nothing else changes).
 * The set is mutable only so that tests can exercise the gating rules; production code never writes to it.
 */
export const FREE_SITES: Set<string> = new Set(["math", "english", "korean"]);

export function freeCount(total: number, site?: string): number {
  return site && FREE_SITES.has(site) ? total : Math.floor(total / 2);
}

export function buildAccessPlan(catalog: SiteCatalog, questions: Pick<Question, "id" | "skillId" | "role">[]): AccessPlan {
  const lessonTier = new Map<string, LessonTier>();
  const questionTier = new Map<string, Tier>();
  const skillTier = new Map<string, Tier>();
  const courses: CourseSplit[] = [];
  for (const course of catalog.courses) {
    const lessons = lessonsOf(course);
    const total = lessons.reduce((n, l) => n + itemsOf(l).length, 0);
    const free = freeCount(total, catalog.site);
    let seen = 0;
    for (const l of lessons) {
      const items = itemsOf(l);
      items.forEach((q, i) => questionTier.set(q, seen + i < free ? "FREE" : "PREMIUM"));
      const freeHere = Math.max(0, Math.min(items.length, free - seen));
      const tier: LessonTier = freeHere === items.length ? "FREE" : freeHere === 0 ? "PREMIUM" : "PARTIAL";
      lessonTier.set(l.id, tier);
      const skill: Tier = tier === "PREMIUM" ? "PREMIUM" : "FREE"; // a skill taught (even partly) for free keeps its follow-ups free
      for (const s of l.skillIds) if (skillTier.get(s) !== "FREE") skillTier.set(s, skill);
      seen += items.length;
    }
    courses.push({ courseId: course.id, grade: course.grade, totalUnits: total, freeUnits: free, premiumUnits: total - free, lessons: lessons.length });
  }
  for (const q of questions) {
    if (questionTier.has(q.id)) continue;
    questionTier.set(q.id, q.role === "diagnostic" ? "FREE" : skillTier.get(q.skillId) ?? "PREMIUM");
  }
  return { lessonTier, questionTier, courses };
}

/** What a learner may receive right now. Decided on the server from a stored entitlement; never from anything the client sends. */
export interface Access {
  tier: Tier;
  /** none: never had Premium; active: Premium now; expired: had Premium that ended (progress is kept, access is not). */
  status: "none" | "active" | "expired";
  source?: EntitlementSource;
  expiresAt?: string | null;
}
export const ENTITLEMENT_SOURCES = ["subscription", "one_time_purchase", "promotion", "grant"] as const;
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];
export interface EntitlementRecord {
  scope: "all" | "math" | "english" | "korean";
  source: EntitlementSource;
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}
export const FREE_ACCESS: Access = { tier: "FREE", status: "none" };

/** Premium for `site` at `now` from the stored records (scope "all" covers every learning site). Pure. */
export function resolveAccess(records: EntitlementRecord[], site: string, now: Date): Access {
  const mine = records.filter((r) => (r.scope === "all" || r.scope === site) && !r.revokedAt && Date.parse(r.startsAt) <= now.getTime());
  const active = mine.find((r) => r.expiresAt === null || Date.parse(r.expiresAt) > now.getTime());
  if (active) return { tier: "PREMIUM", status: "active", source: active.source, expiresAt: active.expiresAt };
  return mine.length ? { tier: "FREE", status: "expired", expiresAt: mine.map((r) => r.expiresAt).sort().at(-1) ?? null } : FREE_ACCESS;
}

/**
 * The content a learner may receive. Premium learners: everything. Everyone else: every lesson stays in the catalog (so the path can show
 * it as Premium), but PREMIUM lessons lose their teaching text and premium questions are removed, so no lesson / review / practice /
 * placement / hint / attempt / follow-up can ever hand out a premium question payload.
 */
export function accessibleBundle<B extends ContentBundle>(bundle: B, plan: AccessPlan, access: Access): B {
  if (access.tier === "PREMIUM") return bundle;
  const locked = (lessonId: string) => plan.lessonTier.get(lessonId) === "PREMIUM";
  return {
    ...bundle,
    catalog: {
      ...bundle.catalog,
      courses: bundle.catalog.courses.map((c) => ({
        ...c,
        units: c.units.map((u) => ({ ...u, lessons: u.lessons.map((l) => (locked(l.id) ? { ...l, concept: "", example: "" } : l)) })),
      })),
    },
    questions: bundle.questions.filter((q) => plan.questionTier.get(q.id) === "FREE"),
  };
}

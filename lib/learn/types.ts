/** Shared type definitions for the LIFE.HELP learning platform (math, english, study.korean). */

export const SITES = ["math", "english", "korean"] as const;
/** The school-curriculum sites (grades E1..H3); study.korean is a language course with its own levels. */
export const SCHOOL_SITES = ["math", "english"] as const;
export type Site = (typeof SITES)[number];
export function isSite(value: unknown): value is Site {
  return typeof value === "string" && (SITES as readonly string[]).includes(value);
}

/**
 * ONE canonical grade model for every subject, route, profile and curriculum.
 *   E1..E6  elementary (초1-6)      M1..M3  middle (중1-3)      H1..H3  high (고1-3)
 * The identifiers are locale-independent and additive: M1..H3 are unchanged, so stored middle / high profiles keep their meaning.
 */
export const ELEMENTARY_GRADES = ["E1", "E2", "E3", "E4", "E5", "E6"] as const;
export const SECONDARY_GRADES = ["M1", "M2", "M3", "H1", "H2", "H3"] as const;
export const SCHOOL_GRADES = [...ELEMENTARY_GRADES, ...SECONDARY_GRADES] as const;
/**
 * Language-course LEVELS (study.korean): K1..K6 are proficiency levels, not school grades. They share the Grade slot of a course /
 * profile so the engine (paths, placement, scoping) is one engine; which list a site offers comes from its SiteConfig (lib/learn/sites.ts).
 */
export const KOREAN_LEVELS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10"] as const;
export const GRADES = [...SCHOOL_GRADES, ...KOREAN_LEVELS] as const;
export type Grade = (typeof GRADES)[number];
export type SchoolGrade = (typeof SCHOOL_GRADES)[number];
export type KoreanLevel = (typeof KOREAN_LEVELS)[number];
export function isGrade(value: unknown): value is Grade {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}
export function isSchoolGrade(value: unknown): value is SchoolGrade {
  return typeof value === "string" && (SCHOOL_GRADES as readonly string[]).includes(value);
}
export function isKoreanLevel(value: unknown): value is KoreanLevel {
  return typeof value === "string" && (KOREAN_LEVELS as readonly string[]).includes(value);
}
export type SchoolLevel = "elementary" | "secondary" | "language";
/**
 * Elementary students learn their own grade's course; middle / high students share the secondary courses (unchanged behaviour);
 * a language level (K1..K6) learns its own level's course, like an elementary grade.
 */
export function schoolLevel(grade: Grade): SchoolLevel {
  if (grade.startsWith("K")) return "language";
  return grade.startsWith("E") ? "elementary" : "secondary";
}

export const GOALS = ["school_exam", "fill_gaps", "advance", "habit"] as const;
export type Goal = (typeof GOALS)[number];
export function isGoal(value: unknown): value is Goal {
  return typeof value === "string" && (GOALS as readonly string[]).includes(value);
}

export type PublishStatus = "DRAFT" | "REVIEWED" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/* ------------------------------ Questions ------------------------------ */

export const QUESTION_TYPES = [
  "multiple_choice",
  "multiple_select",
  "true_false",
  "numeric",
  "short_answer",
  "fill_blank",
  "ordering",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionOption {
  id: string;
  text: string;
}

/** Server-only answer key. Never serialised to the browser. */
export type AnswerKey =
  | { kind: "choice"; id: string }
  | { kind: "choices"; ids: string[] }
  | { kind: "numeric"; value: number; tolerance?: number }
  | { kind: "text"; accepted: string[]; caseSensitive?: boolean; /** dictation: compare with the dictation rules of that language (see normalizeDictation) */ dictation?: "en" | "ko" }
  | { kind: "order"; ids: string[] };

/** What a student submits. Always a string or string[] so it is trivially validatable. */
export type AnswerValue = string | string[];

/**
 * Language-neutral figure for geometry questions: a tiny declarative drawing (never HTML), rendered as SVG by components/learn/Figure.tsx.
 * Coordinates are in a w x h box; labels are numerals / letters / units only, so one figure serves every locale.
 *   poly   closed polygon      p = [x1,y1,x2,y2,...]      f = fill tone 1..3 (optional), d = dashed
 *   line   segment             p = [x1,y1,x2,y2]          d = dashed, m = "a" arrow head at the end
 *   circle                     c = [cx,cy], r             f = fill tone
 *   ellipse                    c = [cx,cy], rx, ry        f = fill tone
 *   arc    angle mark / arc    c = [cx,cy], r, a0, a1     degrees, counter-clockwise from the +x axis (screen y points down)
 *   text   label               p = [x,y], t               a = anchor "s" | "m" | "e"
 */
export type FigureShape =
  | { k: "poly"; p: number[]; f?: 1 | 2 | 3; d?: boolean }
  | { k: "line"; p: [number, number, number, number]; d?: boolean; m?: "a" }
  | { k: "circle"; c: [number, number]; r: number; f?: 1 | 2 | 3 }
  | { k: "ellipse"; c: [number, number]; rx: number; ry: number; f?: 1 | 2 | 3; d?: boolean }
  | { k: "arc"; c: [number, number]; r: number; a0: number; a1: number }
  | { k: "text"; p: [number, number]; t: string; a?: "s" | "m" | "e" };
export interface Figure {
  w: number;
  h: number;
  s: FigureShape[];
}
/** Labels may only hold numerals, letters, a few math symbols and units. */
export const FIGURE_TEXT = /^[A-Za-z0-9°²³π√.,+\-−=()′∠⊥∥×÷% ]{1,14}$/u;

export interface Question {
  id: string;
  site: Site;
  skillId: string;
  type: QuestionType;
  difficulty: Difficulty;
  /** Plain text prompt. Inline math is written as $...$ (KaTeX). */
  prompt: string;
  /** Optional display-mode LaTeX block. */
  latex?: string;
  /** Optional figure (geometry). Language-neutral: never translated, shown with the prompt. */
  figure?: Figure;
  options?: QuestionOption[];
  answer: AnswerKey;
  /** Progressive hints: hints[0] is small, hints[1] is more concrete. */
  hints: string[];
  explanation: string;
  /** Questions in one family are "similar" and used as follow-ups after mistakes. */
  family?: string;
  /** "core" questions appear in lessons; "variant" only as follow-ups; "diagnostic" only in placement. */
  role: "core" | "variant" | "diagnostic";
  /** Optional audio for listening-style questions (spoken in the site's target language). */
  audioText?: string;
  /**
   * Target-language text the question is about (study.korean: the Korean word / sentence), shown as its own block with an optional
   * romanization (Revised Romanization and an optional reviewed Vietnamese reading aid). Never part of the answer key.
   */
  target?: { text: string; romanization?: string; romanizationVi?: string };
  /** Expected solve time in seconds (used for mastery timing weight). */
  expectedSeconds?: number;
  tags?: string[];
  status: PublishStatus;
}

/** Question as sent to the browser: no answer, hints or explanation. */
export interface PublicQuestion {
  id: string;
  site: Site;
  skillId: string;
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  latex?: string;
  figure?: Figure;
  options?: QuestionOption[];
  audioText?: string;
  target?: { text: string; romanization?: string; romanizationVi?: string };
  hintCount: number;
}

/* ------------------------------ Catalog ------------------------------- */

export interface Skill {
  id: string;
  title: string;
  /** Prerequisite skill (used to pick easier follow-ups after a miss). */
  prerequisiteId?: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** Short concept text; may include $...$ math. */
  concept: string;
  example: string;
  skillIds: string[];
  /** Ordered core question ids for the session (3-6 questions). */
  questionIds: string[];
  /** Optional challenge question (harder) appended at the end. */
  challengeId?: string;
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  grade: Grade;
  /** Elective subject course (high school): shown to H2 and H3 learners next to their own grade's course. */
  elective?: boolean;
  /** Game-world flavour. */
  world: { name: string; emoji: string; tagline: string };
  units: Unit[];
}

export interface SiteCatalog {
  site: Site;
  /** ISO country / curriculum identifiers so curricula stay data-driven. */
  country: string;
  curriculum: string;
  courses: Course[];
  skills: Skill[];
}

/** Question data that is safe to ship to the browser and enough for the engine. */
export type QuestionMeta = Pick<
  Question,
  | "id"
  | "site"
  | "skillId"
  | "type"
  | "difficulty"
  | "role"
  | "family"
  | "tags"
  | "expectedSeconds"
  | "status"
>;

/** Catalog + question metadata: no prompts, answers, hints or explanations. */
export interface MetaBundle {
  catalog: SiteCatalog;
  questions: QuestionMeta[];
}

export interface ContentBundle {
  catalog: SiteCatalog;
  questions: Question[];
}

/* ------------------------------ Player state -------------------------- */

export interface SkillMastery {
  skillId: string;
  /** Raw stored score 0..100 (before time decay). */
  score: number;
  attempts: number;
  correct: number;
  /** Consecutive correct answers. */
  streak: number;
  /** Spaced repetition box index. */
  box: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
}

export interface LessonProgress {
  lessonId: string;
  stars: 0 | 1 | 2 | 3;
  bestAccuracy: number;
  completions: number;
  firstCompletedAt: string | null;
  lastCompletedAt: string | null;
  /** True when the diagnostic showed the student already knows this lesson. */
  placedOut: boolean;
}

export interface StreakState {
  current: number;
  best: number;
  lastActiveDay: string | null;
  freezes: number;
}

export type QuestKind = "solve" | "review" | "lesson";
export interface QuestItem {
  id: string;
  kind: QuestKind;
  target: number;
  progress: number;
  /** Skill focus for "solve"/"review" quests (informational). */
  skillId?: string;
}
export interface DailyQuest {
  day: string;
  items: QuestItem[];
  completedAt: string | null;
}

export interface StudentProfile {
  nickname: string;
  grade: Grade;
  goal: Goal;
  avatar: string;
  onboardingDone: boolean;
}

export interface XpEntry {
  sourceType: string;
  sourceId: string;
  xp: number;
  coins: number;
  at: string;
}

export interface PlayerState {
  site: Site;
  profile: StudentProfile | null;
  totalXp: number;
  coins: number;
  /** xp/day accumulation for the soft cap, keyed by day. */
  xpByDay: Record<string, number>;
  /** How many times each question was rewarded per day: `${day}:${questionId}` -> count. */
  questionRewardCount: Record<string, number>;
  /** Idempotency keys of every ledger entry already applied. */
  ledgerKeys: string[];
  mastery: Record<string, SkillMastery>;
  lessons: Record<string, LessonProgress>;
  streak: StreakState;
  quest: DailyQuest | null;
  achievements: string[];
  diagnosticDone: boolean;
  /** Lifetime counters used by achievements. */
  counters: {
    questionsSolved: number;
    correctAnswers: number;
    lessonsCompleted: number;
    mistakesReviewed: number;
    vocabSolved: number;
  };
}

/* ------------------------------ Engine I/O ---------------------------- */

export interface AttemptInput {
  questionId: string;
  sessionId: string;
  /** 1 for the first try at a question inside this session. */
  attemptNo: number;
  correct: boolean;
  hintsUsed: number;
  timeMs: number;
  /** True when this is a spaced-repetition review question. */
  isReview?: boolean;
  /** True when the student was shown the answer and asked to move on. */
  revealed?: boolean;
  /** Submitted answer, trimmed to 200 chars, kept for mistake analysis. */
  answer?: string;
}

export type LearnEvent =
  | {
      type: "attempt";
      input: AttemptInput;
      skillId: string;
      lessonId: string | null;
      difficulty: Difficulty;
      masteryBefore: number;
      masteryAfter: number;
      at: string;
    }
  | { type: "mastery"; mastery: SkillMastery }
  | { type: "xp"; entry: XpEntry }
  | { type: "lesson"; progress: LessonProgress }
  | { type: "streak"; streak: StreakState }
  | { type: "quest"; quest: DailyQuest }
  | { type: "achievement"; code: string; at: string };

export interface EngineDelta {
  xp: number;
  coins: number;
  levelBefore: number;
  levelAfter: number;
  newAchievements: string[];
  questCompleted: boolean;
  streakIncreased: boolean;
}

export interface EngineResult {
  state: PlayerState;
  events: LearnEvent[];
  delta: EngineDelta;
}

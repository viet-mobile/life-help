/**
 * Canonical contracts of the question bank (server-authoritative).
 *
 * The runtime generator lives in scripts/learn/bank (plain ES modules, the same code the CLIs run). These types describe what any generator,
 * validator or consumer of the bank must provide / may rely on. The vocabularies below mirror scripts/learn/bank/core/taxonomy.mjs; a unit
 * test asserts they are equal.
 *
 * Authority: the correct answer, the explanation and the seed live on the server. A client never receives `correctAnswer` before the attempt
 * is graded, and never chooses its own difficulty: `GenerationContext.requestedDifficulty` is produced by the adaptive policy
 * (scripts/learn/bank/core/bands.mjs) on the server.
 */
import type { AnswerKey, Question } from "../../types";

export const REASONING_DIMENSIONS = [
  "recall", "proceduralFluency", "conceptualUnderstanding", "multiStepReasoning", "logicalInference", "abstraction",
  "transfer", "modeling", "informationFiltering", "errorAnalysis", "optimization", "novelStrategy",
] as const;
export type ReasoningDimension = (typeof REASONING_DIMENSIONS)[number];
/** each dimension 0 (not needed) .. 4 (central) */
export type ReasoningProfile = Record<ReasoningDimension, number>;

export const DIFFICULTY_BASES = ["EMPIRICAL", "STRUCTURAL", "PROVISIONAL"] as const;
/** EMPIRICAL = the item itself was measured; STRUCTURAL = rubric mapping fitted on measured items; PROVISIONAL = design-anchored, never measured */
export type DifficultyBasis = (typeof DIFFICULTY_BASES)[number];

/** what the published number IS (never compare different meanings as if they were the same quantity) */
export const METRIC_TYPES = ["PERCENT_CORRECT", "WEIGHTED_PERCENT_CORRECT", "PERCENT_FULL_CREDIT", "MEAN_ITEM_SCORE", "OTHER"] as const;
export type MetricType = (typeof METRIC_TYPES)[number];
export const SCORING_MODELS = ["DICHOTOMOUS", "PARTIAL_CREDIT", "UNKNOWN"] as const;
export type ScoringModel = (typeof SCORING_MODELS)[number];
/** what a recorded N counts; only ITEM may inform item-level confidence */
export const SAMPLE_SIZE_SCOPES = ["ITEM", "ASSESSMENT", "POPULATION", "UNKNOWN"] as const;
export type SampleSizeScope = (typeof SAMPLE_SIZE_SCOPES)[number];
/** only VERIFIED_EMPIRICAL evidence enters empirical calibration */
export const TRUST_LEVELS = ["VERIFIED_EMPIRICAL", "VERIFIED_STRUCTURAL", "PROVISIONAL"] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];
/** BINARY = dichotomous items (primary scale); FULL_CREDIT = partial-credit items reported as percent full credit (separate scale, never pooled) */
export type ScaleClass = "BINARY" | "FULL_CREDIT";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type SchoolGrade = "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "M1" | "M2" | "M3" | "H1" | "H2" | "H3";
export type BankSubject = "math" | "english";

export interface SourceEvidence { sourceId: string; externalItemId: string; cohort?: string; sampleSize?: number | null }

/** Difficulty and its evidence: the level is always accompanied by how it was obtained and how far it can be trusted. */
export interface DifficultyProfile {
  difficultyLevel: DifficultyLevel | null;
  difficultyBasis: DifficultyBasis;
  /** 0..1 */
  calibrationConfidence: number;
  calibrationVersion: string;
  sourceEvidence: SourceEvidence[];
  /** only for EMPIRICAL items; raw source evidence is never mutated, these are derived */
  rawCorrectRate?: number | null;
  normalizedDifficulty?: number | null;
  metricType?: MetricType | null;
  scoringModel?: ScoringModel | null;
  sampleSizeScope?: SampleSizeScope | null;
  scaleClass?: ScaleClass | null;
}

export interface GenerationContext {
  subject: BankSubject;
  grade: SchoolGrade;
  /** chosen by the server policy, always inside bandFor(grade) */
  requestedDifficulty: DifficultyLevel;
  /** UI locale of the learner; the question content language rules are per blueprint (English texts stay English) */
  locale: string;
  /** deterministic: same context + blueprint = same question */
  seed: string;
  curriculumVersion: string;
}

/** An original generator. Exam text is never a blueprint. */
export interface QuestionBlueprint {
  id: string;
  subject: BankSubject;
  /** advisory range; the real level always comes from the structure of each generated question */
  levels: [DifficultyLevel, DifficultyLevel];
  reasoning: Partial<ReasoningProfile>;
  /** pure and deterministic in (context, seed) */
  generate(context: GenerationContext): GeneratedQuestion;
}

export interface QuestionFingerprints {
  structural: string;
  reasoningPath: string;
  skillCombination: string;
  parameterPattern: string;
  semanticPattern: string;
  surface: string;
}
export type DuplicateClass = "EXACT" | "NEAR" | "SAME_SKELETON" | "DISTINCT";

/** What the server holds for one generated question. Only `publicView` (no answer, no explanation) may be sent before grading. */
export interface GeneratedQuestion {
  id: string;
  blueprintId: string;
  /** schema of lib/learn/content/*.json: prompt, options, hints */
  content: Question;
  answerSchema: AnswerKey["kind"];
  correctAnswer: AnswerKey;
  explanation: string;
  reasoningTags: ReasoningDimension[];
  reasoning: ReasoningProfile;
  difficulty: DifficultyProfile;
  fingerprint: QuestionFingerprints;
}

export interface ValidationIssue { code: string; message: string }
/** Independent of the generator: re-derives the answer, checks domain, ambiguity, options and locale interpolation. */
export interface QuestionValidator {
  validate(q: GeneratedQuestion, context: GenerationContext): ValidationIssue[];
}

export const publicView = (q: GeneratedQuestion) => ({ id: q.id, blueprintId: q.blueprintId, prompt: q.content.prompt, options: q.content.options, difficulty: q.difficulty.difficultyLevel });

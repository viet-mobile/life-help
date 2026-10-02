import type { Question } from "@/lib/learn/types";

/**
 * Provider-neutral AI tutor. Any model (Claude, OpenAI, Gemini, ...) can sit
 * behind this interface; nothing in the schema or engine depends on a vendor.
 * Tutors guide with hints and questions; they must not simply give the answer.
 */
export interface TutorContext {
  question: Question;
  studentAnswer?: string;
  hintsUsed: number;
}
export interface DraftQuestion {
  /** AI output is always a DRAFT: it needs human review before publishing. */
  status: "DRAFT";
  question: Omit<Question, "id" | "status">;
}
export interface AITutorProvider {
  readonly id: string;
  explain(ctx: TutorContext): Promise<string>;
  giveHint(ctx: TutorContext): Promise<string>;
  generateSimilarQuestion(ctx: TutorContext): Promise<DraftQuestion | null>;
  analyzeMistake(ctx: TutorContext): Promise<{ concept: string; suggestion: string }>;
}

/** Deterministic, key-free tutor that reuses authored hints (works offline/in tests). */
export class ScriptedTutorProvider implements AITutorProvider {
  readonly id = "scripted";
  async explain(ctx: TutorContext) {
    return ctx.question.explanation;
  }
  async giveHint(ctx: TutorContext) {
    const hints = ctx.question.hints;
    return hints[Math.min(ctx.hintsUsed, hints.length - 1)] ?? "";
  }
  async generateSimilarQuestion() {
    return null;
  }
  async analyzeMistake(ctx: TutorContext) {
    return { concept: ctx.question.skillId, suggestion: ctx.question.hints[0] ?? "" };
  }
}

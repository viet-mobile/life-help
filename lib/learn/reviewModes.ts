import type { Question } from "./types";

/**
 * Common review modes (docs/learn/review-modes.md). A mode is chosen from what the question actually asks of the learner,
 * never from its subject: the same shared items feed every mode.
 *  - choice    pick the answer from options, no audio needed
 *  - listening pick the answer from options after hearing a sentence that is NOT shown as text (device speech; needs sound)
 *  - order     arrange word chunks
 *  - dictation type what was heard (needs sound; spelling counts, case/space/punctuation slack is explicit in normalizeDictation)
 * Flashcards are not a question mode: they are served separately (fronts only) and carry no mastery or XP.
 */
export const REVIEW_MODES = ["choice", "listening", "order", "dictation"] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];
export const isReviewMode = (v: unknown): v is ReviewMode => typeof v === "string" && (REVIEW_MODES as readonly string[]).includes(v);

/** The mode a question belongs to, or null when it fits none (figures, free numeric answers, ...). */
export function questionMode(q: Pick<Question, "type" | "audioText" | "answer" | "target">): ReviewMode | null {
  if (q.type === "ordering") return "order";
  if (q.type === "short_answer" && q.answer.kind === "text" && q.answer.dictation && q.audioText) return "dictation";
  if ((q.type === "multiple_choice" || q.type === "true_false") && q.audioText && !q.target) return "listening";
  if (q.type === "multiple_choice" || q.type === "true_false") return "choice";
  return null;
}

/** Modes that cannot be done without sound; the UI offers a no-audio alternative instead of a silent session. */
export const NEEDS_AUDIO: readonly ReviewMode[] = ["listening", "dictation"];

/**
 * Flashcards (front = target-language word, back = its meaning in the learner's language). They are built only from questions whose
 * form is a plain word -> meaning lookup (Korean "meaning", English "enko"), so the card never mixes the two languages on one side.
 * Cards carry no XP, mastery or SRS effect on the server: the learner's own rating stays on the device.
 */
export function cardFront(q: Pick<Question, "prompt" | "target" | "tags">): string | null {
  const form = q.tags?.[2];
  if (form === "meaning" && q.target?.text) return q.target.text;
  if (form === "enko") return q.prompt.match(/“([^”]+)”/)?.[1] ?? null;
  return null;
}
export function cardBack(q: Pick<Question, "options" | "answer">): string | null {
  return q.answer.kind === "choice" ? (q.options?.find((o) => o.id === (q.answer as { id: string }).id)?.text ?? null) : null;
}

/**
 * Thinking-task pilot. A task is a SEQUENCE of steps; each step is one of five interaction kinds. Everything a task needs (material, options,
 * model answers, checks, hints, rubric) is data, so tasks can be reviewed as text, played in the review page, and checked by tests.
 *
 * Grading policy (see docs/think-pilot/README.md): only what can be decided from the student's input alone is auto-checked
 * (choices against a key, constraint verification of built examples, the position of an error, surface features of a text). Everything
 * about the QUALITY of an explanation or a written text is shown as "not confirmed - compare with the model answers / ask a teacher",
 * is never turned into a right/wrong verdict, and always allows a retry and a "my answer is also valid" flag.
 */
export type Subject = "math" | "english" | "korean";
export type ThinkLang = "ko" | "en";

export interface Hint { text: string }

/** Shown after the step: what a given choice tells about the student's thinking (diagnostic), not only right/wrong. */
export interface ChoiceOption { id: string; text: string; reveals?: string }

export interface StepBase {
  id: string;
  prompt: string;
  /** staged hints: each tells the next ACTION (observe / compare / test), never the answer */
  hints: string[];
  /** a warm-up / scaffold step a student who already sees the idea may skip */
  scaffold?: boolean;
}

export interface ChooseStep extends StepBase {
  kind: "choose";
  multi?: boolean;
  options: ChoiceOption[];
  /** every id of the full key. For `multi`, the selection must equal this set. Empty array = judgement items where several answers are acceptable (see `acceptable`). */
  correct: string[];
  /** other option sets that are also reasonable (alternative interpretations), each with the reason */
  acceptable?: Array<{ ids: string[]; reason: string }>;
  /** shown after checking, whatever the result */
  explain: string;
}

export interface PickLineStep extends StepBase {
  kind: "pickLine";
  /** the student's work / message / argument, one element per line */
  lines: string[];
  /** indexes of the lines that contain an error (any one of them counts; all are listed in the feedback) */
  wrong: number[];
  explain: string;
}

export interface WriteCheck {
  id: string;
  /** what the check looks for, in the student's words - shown in the result */
  label: string;
  /** "any": at least one pattern matches; "all": every pattern matches; "none": no pattern matches. Patterns are case-insensitive regular expression sources. */
  mode: "any" | "all" | "none";
  patterns: string[];
}
export interface WriteStep extends StepBase {
  kind: "write";
  placeholder?: string;
  minChars?: number;
  /** surface checks only. They can say "this does not contain X", never "this is a good explanation". */
  checks: WriteCheck[];
  /** items the student ticks themselves after reading the model answers (the quality judgement stays with the student / a teacher) */
  selfAssess: string[];
  modelAnswers: Array<{ text: string; note?: string }>;
  /** answers that must NOT pass every check (tests verify the checks really discriminate); each says why it is weak */
  badAnswers: Array<{ text: string; why: string }>;
  /** what needs a human reviewer */
  humanReview: string;
}

export interface BuildConstraint { id: string; expr: string; ok: string; fail: string }
export interface BuildStep extends StepBase {
  kind: "build";
  /** variables of one example, e.g. a, b, c (numbers) */
  vars: Array<{ name: string; label: string }>;
  /** the example must satisfy every constraint (a tiny expression language: lib/think/expr.ts) */
  constraints: BuildConstraint[];
  /** how many different examples are required */
  need: number;
  /** two examples count as different when this expression differs (default: the tuple of variables) */
  distinctBy?: string;
  /** examples known to satisfy / violate the constraints (used by tests to verify the verifier, shown as model answers) */
  modelRows: Array<Record<string, number>>;
  badRows: Array<Record<string, number>>;
  explain: string;
  /** a free-text justification asked after the examples (surface-checked like a write step) */
  because?: WriteStep;
}

export interface RevealStage {
  info: string;
  ask: string;
  options: ChoiceOption[];
  /** options that are reasonable at this stage (several allowed) */
  reasonable: string[];
  after: string;
}
export interface RevealStep extends StepBase {
  kind: "reveal";
  stages: RevealStage[];
  /** what the student should notice about how their judgement changed */
  reflect: string;
}

export type Step = ChooseStep | PickLineStep | WriteStep | BuildStep | RevealStep;

export interface RubricRow { criterion: string; full: string; partial: string; none: string }

export interface ThinkTask {
  id: string;
  subject: Subject;
  /** which school grade / language level / elective subject this task is written for: E1..E6, M1..M3, H1..H3 (math, english), K1..K10 (korean), EL-econ|EL-ai|EL-job|EL-cul|EL-sta|EL-res (math electives). Pilot tasks may omit it. */
  grade?: string;
  /** the sub-field inside the grade (number & operations, geometry, measurement, patterns/functions/algebra, data & probability ...; reading/dialogue/notice/message ... for languages) */
  topic?: string;
  /** "draft" = passed the automatic validator only, not yet blind-reviewed by an independent reviewer; "reviewed-ai" = blind AI review rounds done (never teacher / learner review) */
  status?: "draft" | "reviewed-ai";
  /** 1 = elementary / beginner, 2 = middle / intermediate, 3 = high / advanced */
  level: 1 | 2 | 3;
  levelLabel: string;
  title: string;
  /** the language of the instructions, hints and explanations (the learner's language); `target` text stays in the language being learned */
  uiLang: ThinkLang;
  format: "judge-evidence-explain" | "find-error-fix" | "build-many-verify" | "choose-needed-info" | "reveal-and-revise" | "rewrite-for-audience" | "make-your-own";
  /** the student produces the answer / model / problem / expression themselves */
  generative: boolean;
  goal: string;
  thinking: string[];
  /** what the plain-practice version of this topic asks, and what is different here */
  differsFromPlain: string;
  prerequisites: string[];
  minutes: number;
  /** only when a real standard supports it; never claims a standard is fulfilled by one task */
  curriculum: { standard: string; note: string } | null;
  /** the situation / material shown first */
  material: string;
  steps: Step[];
  rubric: RubricRow[];
  /** other valid answers or interpretations, and cases that are hard to judge */
  alternatives: string[];
  hardCases: string[];
  cautions: { language: string; culture: string; accessibility: string };
  /** what is decided automatically and what needs a person */
  autoVsHuman: { auto: string[]; human: string[] };
}

import type { AnswerKey, AnswerValue, Question, QuestionType } from "@/lib/learn/types";

/**
 * Question-type registry. To add a type: add it to QUESTION_TYPES, register a
 * checker here and a renderer in components/learn/renderers. No other code
 * needs to know about specific types.
 */
export interface QuestionTypeDef {
  type: QuestionType;
  /** Returns null when the response is well-formed, else a reason. */
  validate(response: unknown, q: Question): string | null;
  check(key: AnswerKey, response: AnswerValue, q: Question): boolean;
}

const MAX_TEXT = 200;
const MAX_ITEMS = 24;

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length <= MAX_ITEMS && v.every((x) => isString(x) && x.length <= MAX_TEXT);
}

/**
 * Dictation (typing what was heard). What is forgiven and what is not, the same for every learner:
 *   forgiven   case (English), extra / missing spaces at the ends and repeated inner spaces, sentence-final and inner punctuation (. , ! ? ; : quotes ellipsis),
 *              curly vs straight apostrophes and quotes, en/em dashes vs a hyphen (full-width / compatibility forms via Unicode NFKC)
 *   NOT forgiven  spelling (every letter / syllable counts), the apostrophe or hyphen being there or not (don't vs dont, well-known vs wellknown),
 *              and for Korean the SPACING between words: a missing or extra space is a mistake (띄어쓰기), never silently accepted.
 * Hangul is compared after NFC composition (a typed jamo sequence that composes to the same syllables is the same text).
 */
export function normalizeDictation(input: string, lang: "en" | "ko"): string {
  let s = input.normalize("NFKC").replace(/[\u2018\u2019\u02bc\u0060\u00b4]/g, "'").replace(/[\u2010-\u2015\u2212]/g, "-");
  s = s.replace(/[“”"«»]/g, "").replace(/[.,!?;:…·。、]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  if (lang === "en") s = s.replace(/(^|\s)['-]+|['-]+(?=\s|$)/g, "$1").toLowerCase(); // a quote / dash standing alone at a word edge is punctuation, inner ones are spelling
  else s = s.normalize("NFC");
  return s;
}

export function normalizeText(input: string, caseSensitive = false): string {
  let s = input.normalize("NFKC").trim().replace(/\s+/g, " ");
  s = s.replace(/[.!?。]+$/u, "");
  return caseSensitive ? s : s.toLowerCase();
}

/**
 * Parse "12", "-3.5", "3/4", "−2", "x = 4", "x=-3" into a number.
 * Returns null for anything that is not a plain number/fraction.
 */
export function parseNumeric(input: string): number | null {
  let s = input.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "");
  s = s.replace(/^[a-z]=/, ""); // allow "x=4"
  s = s.replace(/[−–—]/g, "-");
  const frac = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(s);
  if (frac) {
    const d = Number(frac[2]);
    if (d === 0) return null;
    return Number(frac[1]) / d;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  return null;
}

const defs: Record<QuestionType, QuestionTypeDef> = {
  multiple_choice: {
    type: "multiple_choice",
    validate: (r, q) =>
      isString(r) && (q.options ?? []).some((o) => o.id === r) ? null : "invalid_choice",
    check: (k, r) => k.kind === "choice" && r === k.id,
  },
  true_false: {
    type: "true_false",
    validate: (r) => (r === "true" || r === "false" ? null : "invalid_choice"),
    check: (k, r) => k.kind === "choice" && r === k.id,
  },
  multiple_select: {
    type: "multiple_select",
    validate: (r, q) =>
      isStringArray(r) && r.every((id) => (q.options ?? []).some((o) => o.id === id))
        ? null
        : "invalid_choice",
    check: (k, r) => {
      if (k.kind !== "choices" || !Array.isArray(r)) return false;
      const a = new Set(r);
      return a.size === k.ids.length && k.ids.every((id) => a.has(id));
    },
  },
  numeric: {
    type: "numeric",
    validate: (r) => (isString(r) && r.length > 0 && r.length <= 32 ? null : "invalid_text"),
    check: (k, r) => {
      if (k.kind !== "numeric" || typeof r !== "string") return false;
      const n = parseNumeric(r);
      return n !== null && Math.abs(n - k.value) <= (k.tolerance ?? 1e-9);
    },
  },
  short_answer: textDef("short_answer"),
  fill_blank: textDef("fill_blank"),
  ordering: {
    type: "ordering",
    validate: (r, q) =>
      isStringArray(r) &&
      r.length === (q.options ?? []).length &&
      new Set(r).size === r.length &&
      r.every((id) => (q.options ?? []).some((o) => o.id === id))
        ? null
        : "invalid_order",
    // Same id order, or the same WORDS in the same order: a sentence with a repeated word ("I think I can") has two interchangeable tiles.
    check: (k, r, q) => {
      if (k.kind !== "order" || !Array.isArray(r) || r.length !== k.ids.length) return false;
      if (r.every((id, i) => id === k.ids[i])) return true;
      const text = (id: string) => (q.options ?? []).find((o) => o.id === id)?.text;
      return r.every((id, i) => { const a = text(id), b = text(k.ids[i]); return a !== undefined && a === b; });
    },
  },
};

function textDef(type: QuestionType): QuestionTypeDef {
  return {
    type,
    validate: (r) => (isString(r) && r.trim().length > 0 && r.length <= MAX_TEXT ? null : "invalid_text"),
    check: (k, r) => {
      if (k.kind !== "text" || typeof r !== "string") return false;
      if (k.dictation) { const got = normalizeDictation(r, k.dictation); return k.accepted.some((a) => normalizeDictation(a, k.dictation!) === got); }
      const cs = k.caseSensitive ?? false;
      const got = normalizeText(r, cs);
      return k.accepted.some((a) => normalizeText(a, cs) === got);
    },
  };
}

export function getQuestionType(type: QuestionType): QuestionTypeDef {
  return defs[type];
}

export function validateResponse(q: Question, response: unknown): string | null {
  return defs[q.type].validate(response, q);
}

export function checkAnswer(q: Question, response: AnswerValue): boolean {
  return defs[q.type].check(q.answer, response, q);
}

/** Human-readable correct answer for the reveal step (3rd wrong attempt). */
export function describeAnswer(q: Question): string {
  const k = q.answer;
  const opt = (id: string) => q.options?.find((o) => o.id === id)?.text ?? id;
  switch (k.kind) {
    case "choice":
      return q.type === "true_false" ? (k.id === "true" ? "O" : "X") : opt(k.id);
    case "choices":
      return k.ids.map(opt).join(", ");
    case "numeric":
      return String(k.value);
    case "text":
      return k.accepted[0];
    case "order":
      return k.ids.map(opt).join(" ");
  }
}

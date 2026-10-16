import type { Question } from "./types";
import safeIds from "./content/bank/english-hint2-safe.json";

/**
 * English hint 2 fail-closed gate (docs/english-bank/hint-review-20261017.md).
 *
 * Independent AI audits and samples keep finding second hints that give the answer away, and the audits' own sensitivity is low, so English
 * hint 2 is treated as UNSAFE until a question is explicitly cleared. At the content boundary (repository.loadIndex, and the bank shard loader)
 * every hint 2 of an English practice-bank or elective-course question is replaced by one fixed neutral hint that says nothing about the
 * question. Hint 1 is untouched. The authored hint 2 stays in the data files (nothing is deleted); it is served again only for an id listed in
 * content/bank/english-hint2-safe.json AND only while the runtime leak detector below finds nothing in it.
 * Nothing about the request (locale, URL, grade, direct hint call) changes this: the gate runs on the server where the bundle is built.
 */
export const NEUTRAL_HINT2 = "보기를 문제에 하나씩 넣어 읽어 보고, 어색하거나 맞지 않는 것부터 지워 보세요.";
/** Fixed fallbacks for the rare question whose own options contain a word of the primary neutral hint (e.g. an English->Korean meaning question). Deterministic; the last one has no words. */
export const NEUTRAL_FALLBACKS = ["문제를 한 번 더 천천히 읽어 보세요.", "💭"] as const;
export const NEUTRAL_SET: readonly string[] = [NEUTRAL_HINT2, ...NEUTRAL_FALLBACKS];
const GATED_ID = /^(eb-|e-h3e-)/;
const SAFE: ReadonlySet<string> = new Set((safeIds as { ids: string[] }).ids);

const norm = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[\s\p{P}\p{S}]+/gu, "");
const tokens = (s: string): string[] => s.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];

/** The strings a hint must never contain for this question: the key and every option (a hint that lists the options gives the answer by elimination). */
export function protectedStrings(q: Pick<Question, "options" | "answer">): { key: string[]; options: string[] } {
  const a = q.answer as { kind: string; id?: string; ids?: string[]; accepted?: string[]; value?: number };
  const key: string[] = [];
  if (a.kind === "choice") { const t = q.options?.find((o) => o.id === a.id)?.text; if (t) key.push(t); }
  else if (a.kind === "text") key.push(...(a.accepted ?? []));
  else if (a.kind === "order") key.push((a.ids ?? []).map((id) => q.options?.find((o) => o.id === id)?.text ?? "").join(" "));
  else if (a.kind === "numeric" && typeof a.value === "number") key.push(String(a.value));
  return { key, options: (q.options ?? []).map((o) => o.text) };
}

/** True when `hint` shows the answer: the whole key (case / punctuation / spacing ignored), a numeric key as a standalone number, or two or more options. */
export function hintRevealsAnswer(hint: string, q: Pick<Question, "options" | "answer">): boolean {
  const h = norm(hint);
  const ht = new Set(tokens(hint));
  const { key, options } = protectedStrings(q);
  const partial = (q.answer as { kind: string }).kind === "text" || (q.answer as { kind: string }).kind === "order"; // dictation / ordering: a hint quoting a word of the key (e.g. the first word) shows part of the answer
  if (partial) for (const k of key) for (const t of tokens(k)) if (t.length >= 3 && ht.has(t)) return true;
  for (const k of key) {
    const nk = norm(k);
    if (!nk) continue;
    if (/^[\d.,]+$/.test(nk)) { if (tokens(hint).includes(k.toLowerCase().replace(/,/g, ""))) return true; continue; } // numeric key: a standalone number, not a digit inside another number
    if (nk.length >= 2 && h.includes(nk)) return true;
    if (nk.length < 2 && ht.has(nk)) return true; // one-letter keys (a / I): only as a whole token
  }
  let shown = 0;
  for (const o of options) { const no = norm(o); if (no.length >= 3 && h.includes(no)) shown++; else if (no.length >= 1 && no.length < 3 && /[a-z0-9]/i.test(no) && ht.has(no)) shown++; }
  return shown >= 2 || (shown >= 1 && key.length > 0 && options.length <= 1);
}

/** The question as it may be served: hint 2 neutral unless this id is cleared and its authored hint 2 passes the leak detector. */
export function gateHints<T extends Question>(q: T, safe: ReadonlySet<string> = SAFE): T {
  if (!GATED_ID.test(q.id) || q.hints.length < 2) return q;
  const rich = q.hints[1];
  const keep = safe.has(q.id) && !NEUTRAL_SET.includes(rich) && !hintRevealsAnswer(rich, q);
  if (keep || NEUTRAL_SET.includes(q.hints[1])) return q;
  const hints = q.hints.slice();
  hints[1] = NEUTRAL_SET.find((n) => !hintRevealsAnswer(n, q)) ?? NEUTRAL_FALLBACKS[NEUTRAL_FALLBACKS.length - 1];
  return { ...q, hints };
}
export const gateAll = <T extends Question>(qs: T[]): T[] => qs.map((q) => gateHints(q));

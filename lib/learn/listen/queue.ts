import type { ListenSegment } from "./segments";

/** One spoken item. English and the meaning are ALWAYS separate utterances (never mixed languages in one utterance). */
export interface Utterance {
  segmentId: string;
  segmentIndex: number;
  lang: "en-US" | "ko-KR" | "vi-VN";
  text: string;
}

export type ListenMode = "en" | "en+ko";
export const REPEAT_CHOICES = [1, 2, 3, 5, 10] as const;
/** hard upper bound: no endless speech from a slip of the finger */
export const MAX_REPEAT = 20;
export const SPEEDS = [0.75, 1, 1.25] as const;
export type Speed = (typeof SPEEDS)[number];

export function clampRepeat(n: unknown): number {
  const v = typeof n === "number" ? Math.floor(n) : NaN;
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(v, MAX_REPEAT);
}

/** Strict custom count: digits only, 1..MAX_REPEAT; anything else is rejected (null). */
export function parseCustomRepeat(input: string): number | null {
  const s = input.trim();
  if (!/^[1-9][0-9]{0,2}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= MAX_REPEAT ? n : null;
}

export interface QueueOptions {
  mode: ListenMode;
  /** inclusive, 0-based indexes into `segments` */
  from?: number;
  to?: number;
  repeat?: number;
  /** language of the canonical meaning text per segment (set by the caller from the text and the UI locale) */
  meaningLang?: (ko: string) => "ko-KR" | "vi-VN" | null;
}

/** True when at least one segment carries a canonical meaning, i.e. the bilingual mode is meaningful. */
export const hasMeaning = (segments: ListenSegment[]) => segments.some((s) => !!s.ko);

/**
 * The exact utterance queue:
 *   en       EN1 EN2 EN3
 *   en+ko    EN1 KO1 EN2 KO2 EN3 KO3   (a KO item only for segments that have a canonical meaning)
 * `from..to` selects a range; `repeat` plays the whole range that many times in order (2,3,4,2,3,4,...).
 */
export function buildQueue(segments: ListenSegment[], opts: QueueOptions): Utterance[] {
  const n = segments.length;
  if (!n) return [];
  const from = Math.max(0, Math.min(opts.from ?? 0, n - 1));
  const to = Math.max(from, Math.min(opts.to ?? n - 1, n - 1));
  const repeat = clampRepeat(opts.repeat ?? 1);
  const once: Utterance[] = [];
  for (let i = from; i <= to; i++) {
    const s = segments[i];
    once.push({ segmentId: s.id, segmentIndex: i, lang: "en-US", text: s.en });
    if (opts.mode === "en+ko" && s.ko) {
      const lang = opts.meaningLang ? opts.meaningLang(s.ko) : "ko-KR"; // callers pass the resolver (script + UI language); the default is Korean
      if (lang) once.push({ segmentId: s.id, segmentIndex: i, lang, text: s.ko });
    }
  }
  const out: Utterance[] = [];
  for (let r = 0; r < repeat; r++) out.push(...once);
  return out;
}

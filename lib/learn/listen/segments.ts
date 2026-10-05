/**
 * Listening segments, derived from CANONICAL lesson content only (never a second TTS content store, never a runtime translation).
 *
 * What the English course really contains (inspected, see docs/learning/tts-flashcards-design.md):
 *   - `lesson.example`: English words / phrases / sentences, sometimes with a relation to a second item:
 *       "ball → B, cat → C"          the right side is an answer or a derivation, not a translation: NOT spoken
 *       "big ≈ large, happy ↔ sad"   the right side is English (synonym / antonym): spoken as its own segment
 *       "library = 도서관 / desk = 책상"  the right side is the canonical meaning: kept as `ko` (a canonical pair)
 *   - a reading question's prompt: `... "English passage" 질문: English question` : the quoted passage is English, split into sentences
 *   - `question.audioText`: an English word (handled by the existing ListenButton)
 * There is NO sentence-level Korean translation of passages in the content, so the "English + Korean" listening mode is offered only for
 * segments that carry a canonical pair (`ko`).
 */
export interface ListenSegment {
  id: string;
  /** English text to speak (English voice) */
  en: string;
  /** canonical meaning of `en` as written in the lesson (Korean, or the learner's UI language); absent when the content has none */
  ko?: string;
}

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;
/** Latin text for the English voice: letters, digits, spaces and ordinary punctuation, no Hangul / Vietnamese-only letters */
const LATIN_ONLY = /^[A-Za-z0-9\s.,;:!?'’"“”()\-–—/&%$#@+*=]+$/;
const ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "e.g", "i.e", "no", "a.m", "p.m"]);
const RELATION = /\s*(→|=|≈|↔)\s*/;

/** Sentence segmentation that never cuts inside a word, an abbreviation ("Dr.", "e.g.") or a number ("3.5"). */
export function splitSentences(text: string): string[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur: string[] = [];
  tokens.forEach((tok, i) => {
    cur.push(tok);
    const ends = /[.!?]["'’”)\]]*$/.test(tok);
    const bare = tok.replace(/[.!?"'’”)\]]+$/g, "").toLowerCase();
    const next = tokens[i + 1];
    const nextStarts = next === undefined || /^["'“‘(]?[A-Z0-9]/.test(next);
    if (ends && nextStarts && !ABBREVIATIONS.has(bare) && !/^\d+$/.test(bare.replace(/,/g, ""))) { out.push(cur.join(" ")); cur = []; }
  });
  if (cur.length) out.push(cur.join(" "));
  return out.map((s) => s.trim()).filter((s) => /[A-Za-z]{2,}/.test(s));
}

const speakable = (s: string) => /[A-Za-z]{2,}/.test(s) && LATIN_ONLY.test(s) && !/-\s*(,|$)/.test(s);

/** Segments of a lesson's `example` text. Order is the order of the text. */
export function exampleSegments(scope: string, example: string): ListenSegment[] {
  const items: string[] = [];
  const bySlash = example.split(/\s+\/\s+/);
  for (const part of bySlash) {
    const commaParts = part.split(/,\s+/);
    // a comma separates items only when every piece is itself a relation ("ball → B, cat → C"); otherwise it belongs to the sentence
    if (commaParts.length > 1 && commaParts.every((p) => RELATION.test(p))) items.push(...commaParts);
    else items.push(part);
  }
  const segs: { en: string; ko?: string }[] = [];
  for (const raw of items) {
    const m = raw.split(RELATION);
    if (m.length >= 3) {
      const left = m[0].trim(), rel = m[1], right = m.slice(2).join("").trim();
      if (speakable(left)) {
        if (rel === "=" && right && HANGUL.test(right)) segs.push({ en: left, ko: right });
        else segs.push({ en: left });
      }
      if ((rel === "≈" || rel === "↔") && speakable(right)) segs.push({ en: right });
    } else {
      for (const s of splitSentences(raw.trim())) if (speakable(s)) segs.push({ en: s });
    }
  }
  return segs.map((s, i) => ({ id: `${scope}:${i}`, ...s }));
}

/** The English passage of a reading question prompt: `... "passage" 질문: question`. Returns null when the prompt has no English passage. */
export function passageSegments(scope: string, prompt: string): ListenSegment[] | null {
  const m = prompt.match(/["“]([^"”]{12,}?)["”]/);
  if (!m) return null;
  const passage = m[1].trim();
  if (HANGUL.test(passage) || !LATIN_ONLY.test(passage) || !/\s/.test(passage)) return null;
  const sentences = splitSentences(passage);
  if (!sentences.length) return null;
  return sentences.map((en, i) => ({ id: `${scope}:${i}`, en }));
}

/** Vocabulary candidates of a lesson: only items that carry a canonical meaning in the lesson text. */
export function exampleWords(example: string): { en: string; ko: string }[] {
  return exampleSegments("w", example).filter((s): s is ListenSegment & { ko: string } => !!s.ko).map((s) => ({ en: s.en, ko: s.ko }));
}

/** The voice language of a canonical meaning text: Hangul -> Korean; otherwise the learner's UI language when it has a voice */
export function meaningLang(text: string, uiLocale: string): "ko-KR" | "vi-VN" | null {
  if (HANGUL.test(text)) return "ko-KR";
  if (uiLocale === "vi") return "vi-VN";
  return null;
}

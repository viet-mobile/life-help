/**
 * Listening segments, derived from CANONICAL lesson content only (never a second English content store, never a runtime translation).
 *
 * The English stays where it is (lesson `example`, the quoted passage of a reading question); the canonical Korean of each listenable segment
 * is authored content kept beside it and keyed by the same ids (`lib/learn/content/listening/*`). One pair `{ id, en, ko }` feeds the sentence
 * list, the English voice, the Korean voice and the English + Korean queue. See docs/learning/english-bilingual-listening-inventory.md.
 *
 * Lesson `example` grammar (inspected on all 59 English lessons):
 *   "go → goes"            a chain of forms: every English item is spoken in order (go, goes); a single letter ("ball → B") is not
 *   "big ≈ large"          English on both sides: both spoken
 *   "library = 도서관"     the right side is the lesson's own meaning
 *   "🐰 = rabbit"          the English word is on the right
 *   "Mina has a cat. → 고양이"   the Korean right side is an answer / label, not a translation: only the English is spoken
 * Reading questions: `글을 읽고 답하세요. "passage" 질문: ...` (also `문장:`): the passage runs from the first quote to the last quote before the
 * marker, so quotes inside the passage ("woof") stay in it.
 */
export interface ListenSegment {
  id: string;
  /** English text to speak (English voice) */
  en: string;
  /** canonical Korean of `en`; absent only where the content has none (then the bilingual mode says so) */
  ko?: string;
}

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;
/** Latin text for the English voice: letters, digits, spaces and ordinary punctuation, no Hangul / Vietnamese-only letters */
const LATIN_ONLY = /^[A-Za-z0-9\s.,;:!?'’"“”()\-–—/&%$#@+*=]+$/;
const ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "e.g", "i.e", "no", "a.m", "p.m"]);
const RELATION = /\s*(→|=|≈|↔)\s*/;

/** Sentence segmentation that never cuts inside a word or after an abbreviation ("Dr.", "e.g.", "a.m."); "3.5" is one token and never cut. */
export function splitSentences(text: string): string[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur: string[] = [];
  tokens.forEach((tok, i) => {
    cur.push(tok);
    const ends = /[.!?]["'’”)\]]*$/.test(tok);
    const bare = tok.replace(/[.!?"'’”)\]]+$/g, "").replace(/^["'“‘(]+/, "").toLowerCase();
    const next = tokens[i + 1];
    const nextStarts = next === undefined || /^["'“‘(]?[A-Z0-9]/.test(next);
    if (ends && nextStarts && !ABBREVIATIONS.has(bare)) { out.push(cur.join(" ")); cur = []; }
  });
  if (cur.length) out.push(cur.join(" "));
  return out.map((s) => s.trim()).filter((s) => /[A-Za-z]{2,}/.test(s));
}

const speakable = (s: string) => /[A-Za-z]{2,}/.test(s) && LATIN_ONLY.test(s) && !/-\s*(,|$)/.test(s);
const withKo = (scope: string, segs: { en: string; ko?: string }[], ko?: readonly string[]): ListenSegment[] =>
  segs.map((s, i) => ({ id: `${scope}:${i}`, en: s.en, ...((ko?.[i] ?? s.ko) ? { ko: ko?.[i] ?? s.ko } : {}) }));

/** The English items of a lesson's `example`, in text order (the inline "= 뜻" meaning, if any, is kept as `ko`). */
export function exampleItems(example: string): { en: string; ko?: string }[] {
  const items: string[] = [];
  for (const part of example.split(/\s+\/\s+/)) {
    const commaParts = part.split(/,\s+/);
    // a comma separates items only when every piece is itself a relation ("ball → B, cat → C"); otherwise it belongs to the sentence
    if (commaParts.length > 1 && commaParts.every((p) => RELATION.test(p))) items.push(...commaParts);
    else items.push(part);
  }
  const segs: { en: string; ko?: string }[] = [];
  for (const raw of items) {
    const parts = raw.split(RELATION).map((p) => p.trim());
    if (parts.length >= 3) {
      // parts = [item0, rel1, item1, rel2, item2, ...]
      for (let k = 0; k < parts.length; k += 2) {
        const item = parts[k], relAfter = parts[k + 1], next = parts[k + 2];
        if (speakable(item)) {
          if (relAfter === "=" && next && HANGUL.test(next)) segs.push({ en: item, ko: next });
          else segs.push({ en: item });
        }
      }
    } else {
      for (const s of splitSentences(raw.trim())) if (speakable(s)) segs.push({ en: s });
    }
  }
  return segs;
}

/** Segments of a lesson's `example`, paired with the canonical Korean (`ko[i]` belongs to item i). */
export function exampleSegments(scope: string, example: string, ko?: readonly string[]): ListenSegment[] {
  return withKo(scope, exampleItems(example), ko);
}

/** The English passage quoted in a reading prompt, or null. */
export function passageText(prompt: string): string | null {
  const first = prompt.search(/["“]/);
  if (first < 0) return null;
  const marker = prompt.search(/\s(질문|문장|Câu hỏi|Câu)\s*[:：]/);
  const endLimit = marker > first ? marker : prompt.length;
  const head = prompt.slice(0, endLimit);
  const last = Math.max(head.lastIndexOf("\""), head.lastIndexOf("”"));
  if (last <= first) return null;
  // without a marker the quote is the first balanced pair (e.g. 선생님이 "Stand up."라고 말했어요)
  let passage = marker > first ? prompt.slice(first + 1, last) : (prompt.slice(first).match(/["“]([^"”]+)["”]/)?.[1] ?? "");
  passage = passage.trim();
  if (passage.length < 12 || HANGUL.test(passage) || !LATIN_ONLY.test(passage) || !/\s/.test(passage)) return null;
  return passage;
}

/** The passage of a reading prompt split into sentences, paired with the canonical Korean when it is given. */
export function passageSegments(scope: string, prompt: string, ko?: readonly string[]): ListenSegment[] | null {
  const passage = passageText(prompt);
  if (!passage) return null;
  const sentences = splitSentences(passage);
  if (!sentences.length) return null;
  return withKo(scope, sentences.map((en) => ({ en })), ko);
}

/** Vocabulary candidates of a lesson: items that carry a Korean meaning. */
export function exampleWords(example: string, ko?: readonly string[]): { en: string; ko: string }[] {
  return exampleSegments("w", example, ko).filter((s): s is ListenSegment & { ko: string } => !!s.ko).map((s) => ({ en: s.en, ko: s.ko }));
}

/** The voice language of a meaning text: Hangul -> Korean; otherwise the learner's UI language when it has a voice */
export function meaningLang(text: string, uiLocale: string): "ko-KR" | "vi-VN" | null {
  if (HANGUL.test(text)) return "ko-KR";
  if (uiLocale === "vi") return "vi-VN";
  return null;
}

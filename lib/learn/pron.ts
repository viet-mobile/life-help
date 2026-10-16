/**
 * Pronunciation rule tips (docs/learn/pronunciation-help.md). A tip is chosen from the Korean text of a question the learner has
 * actually answered wrongly, and only for rules of the Standard Pronunciation Rules (표준 발음법, National Institute of Korean Language)
 * that the text really contains. It says what the rule is. It never says what the learner's own mistake was, never guesses a first language,
 * and never claims to measure speech: device speech only plays sound.
 */
/**
 * Release gate: the tips are NOT shown to learners until a Korean-pronunciation expert has reviewed them (AI source check is not enough).
 * `NEXT_PUBLIC_PRON_PREVIEW=1` turns them on for staging / local validation only.
 */
export const EXPERT_REVIEW_REQUIRED = true;
export const pronTipsVisible = (): boolean => !EXPERT_REVIEW_REQUIRED || process.env.NEXT_PUBLIC_PRON_PREVIEW === "1";

export type PronRule = "nasal" | "lateral" | "tense" | "liaison" | "final";

export interface PronTip {
  rule: PronRule;
  /** article number of the Standard Pronunciation Rules */
  art: string;
  /** an official example from that article: spelling[pronunciation] */
  ex: string;
}

const RULES: Record<PronRule, { art: string; ex: string }> = {
  nasal: { art: "18", ex: "국물[궁물], 밥물[밤물]" },
  lateral: { art: "20", ex: "신라[실라], 칼날[칼랄]" }, // 제20항 (다만: 의견란[의ː견난] ... are exceptions, see LATERAL_EXCEPTIONS)
  tense: { art: "23", ex: "국밥[국빱], 꽂고[꼳꼬]" },
  liaison: { art: "13", ex: "옷이[오시], 깎아[까까]" },
  final: { art: "9", ex: "옷[옫], 앞[압]" },
};

/** 제20항 다만: these words keep [ㄴㄴ] and 제15항 compounds (a vowel-initial second part after a final consonant): a tip would contradict them. */
const LATERAL_EXCEPTIONS = ["의견란", "임진란", "생산량", "결단력", "공권력", "동원령", "상견례", "횡단로", "이원론", "입원료", "구근류"];
const COMPOUND_EXCEPTIONS = ["겉옷", "맛있", "멋있", "맛없", "멋없", "값있", "상관없", "관계없", "헛웃음", "넋없"];
const SINGLE_FINALS = new Set([1, 2, 4, 7, 8, 16, 17, 19, 20, 22, 23, 24, 25, 26]); // 홑받침·쌍받침 only (제13항); clusters are 제14항

const STOP_FINALS = new Set([1, 2, 3, 7, 17, 18, 19, 20, 22, 23, 24, 25, 26]); // final consonant letters that are pronounced as a stop (ㄱ ㄷ ㅂ group)
const NEUTRALISED = new Set([2, 19, 20, 22, 23, 24, 25, 26]); // ㄲ ㅅ ㅆ ㅈ ㅊ ㅋ ㅌ ㅍ at the end of a syllable (제9항)

function parts(ch: string): { lead: number; tail: number } | null {
  const c = ch.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171) return null;
  return { lead: Math.floor(c / 588), tail: c % 28 };
}

/** The most relevant rule tip for a short Korean text, or null. Long passages never get a tip (a hint on every line would be noise). */
export function pronTipFor(text: string | undefined | null): PronTip | null {
  if (!text) return null;
  const toks = text.split(/[\s.,!?;:·…"“”‘’'()]+/).filter((t) => /[가-힣]/.test(t));
  if (toks.length === 0 || toks.length > 3 || toks.join("").length > 14) return null;
  const found = new Set<PronRule>();
  const joined = toks.join("");
  const isLateralException = LATERAL_EXCEPTIONS.some((w) => joined.includes(w));
  const isCompound = COMPOUND_EXCEPTIONS.some((w) => joined.includes(w));
  if (isCompound) return null; // 제15항: the second part of a compound is pronounced by its own rule; a general tip would mislead
  for (const tok of toks) {
    const ps = [...tok].map(parts);
    for (let i = 0; i < ps.length; i++) {
      const cur = ps[i];
      if (!cur) continue;
      const next = ps[i + 1] ?? null;
      if (next) {
        if (STOP_FINALS.has(cur.tail) && (next.lead === 2 || next.lead === 6)) found.add("nasal");
        else if (((cur.tail === 4 && next.lead === 5) || (cur.tail === 8 && next.lead === 2)) && !isLateralException) found.add("lateral");
        else if (STOP_FINALS.has(cur.tail) && [0, 3, 7, 9, 12].includes(next.lead)) found.add("tense");
        else if (SINGLE_FINALS.has(cur.tail) && next.lead === 11 && !isCompound) found.add("liaison");
      } else if (NEUTRALISED.has(cur.tail)) found.add("final");
    }
  }
  for (const r of ["nasal", "lateral", "tense", "liaison", "final"] as PronRule[]) if (found.has(r)) return { rule: r, ...RULES[r] };
  return null;
}

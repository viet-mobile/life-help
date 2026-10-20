// String-checkable defects that an independent review once missed (see docs/learn/english-bank-review-checklist.md). Meaning judgements are NOT here.
// lintQwhy(locale, srcQ, srcWhy, passage, trQ, trWhy) -> list of flags. A flag blocks the merge unless the id is listed in lint-ack.json with a reason.
type Flag = { code: "gender-added" | "count-added"; detail: string };
const PRON: Record<string, RegExp> = {
  en: /\b(he|she|his|her|hers|him|himself|herself)\b/i,
  vi: /(cô ấy|anh ấy|chị ấy|cậu ấy|bà ấy|ông ấy|cô ta|anh ta)/i,
  ja: /(彼女|彼(?!ら))/,
};
// the grammatical gender of a pronoun in the translation (en / vi); a pronoun is licensed only when the English QUESTION already uses a pronoun of the same gender
const MALE: Record<string, RegExp> = { en: /\b(he|his|him|himself)\b/i, vi: /(anh ấy|cậu ấy|ông ấy|anh ta)/i, ja: /彼(?!女|ら)/ };
const FEMALE: Record<string, RegExp> = { en: /\b(she|her|hers|herself)\b/i, vi: /(cô ấy|chị ấy|bà ấy|cô ta)/i, ja: /彼女/ };
const COUNT: Record<string, RegExp> = {
  en: /\b(both|(two|three|four) (people|friends|kids|students|of them))\b/i,
  vi: /(cả hai|hai người|ba người|bốn người)/i,
  ja: /(二人|ふたり|2人|三人|3人|四人|両方)/,
  ar: /(كلاهما|كلتاهما|اثنان|اثنين|ثلاثة)/,
};
export function lintQwhy(locale: string, srcQ: string, srcWhy: string, passage: string, trQ: string, trWhy: string): Flag[] {
  const out: Flag[] = [];
  const tr = `${trQ}\n${trWhy}`;
  // 1. a gendered pronoun in the translation that the source question/explanation (Korean has none) does not license: the source question may say he/she, then it is allowed
  const pron = PRON[locale];
  // (the referent of a pronoun is not string-checkable: explanations must use names; a pronoun in the QUESTION is only allowed when the English question itself has one)
  const licensedM = MALE.en.test(srcQ), licensedF = FEMALE.en.test(srcQ);
  const unlicensed = pron && (MALE[locale]?.test(tr) && !licensedM || FEMALE[locale]?.test(tr) && !licensedF);
  if (unlicensed) out.push({ code: "gender-added", detail: (tr.match(pron) ?? [""])[0] });
  // 2. a head-count word in the translation although neither the English question, the Korean explanation nor the quoted evidence carries a count
  const cnt = COUNT[locale];
  const srcHasCount = COUNT.en.test(srcQ) || /(둘이|셋이|모두|두 사람|세 사람|\d+명)/.test(srcWhy) || COUNT.en.test(srcWhy);
  if (cnt && cnt.test(tr) && !srcHasCount) out.push({ code: "count-added", detail: (tr.match(cnt) ?? [""])[0] });
  void passage;
  return out;
}

import { T, rng, shuffle } from "./lib.mjs";

/**
 * English question builders. The TARGET language (words, sentences, answers) is always English and identical in every locale;
 * only the instructions, hints and explanations are Korean / Vietnamese ({ ko, vi } pairs).
 *
 * Word glossary entries: { en, ko, vi, e? } (e = optional emoji picture).
 */
export const W = (en, ko, vi, e) => ({ en, ko, vi, e });

export function makeEnglish(b, grade, S) {
  const id = (sk, n) => `e-${grade}-${sk}-${n}`;
  const letters = ["a", "b", "c", "d", "e"];
  const hashOf = (s) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

  /** Multiple choice. items: strings (language-neutral, e.g. English words) or T pairs (localised). The right answer position rotates by id. */
  function mc({ sk, n, role = "core", d, fam, prompt, items, correct, hints, expl, audio, tags }) {
    const qid = id(sk, n);
    const rot = hashOf(qid) % items.length;
    const rotated = items.map((_, i) => items[(i - rot + items.length) % items.length]);
    return b.question({
      id: qid, skill: S[sk], role, type: "multiple_choice", d, family: fam, prompt, hints, expl, audio, tags,
      options: rotated.map((text, i) => ({ id: letters[i], text })), answer: { choice: letters[(correct + rot) % items.length] },
    });
  }
  function tf({ sk, n, role = "core", d, fam, prompt, truth, hints, expl, tags }) {
    return b.question({ id: id(sk, n), skill: S[sk], role, type: "true_false", d, family: fam, prompt, hints, expl, tags, answer: { tf: truth } });
  }
  /** Type the English word / phrase. accepted: list of strings. */
  function write({ sk, n, role = "core", d, fam, prompt, accepted, hints, expl, audio, tags, type = "short_answer" }) {
    return b.question({ id: id(sk, n), skill: S[sk], role, type, d, family: fam, prompt, hints, expl, audio, tags, answer: { accepted } });
  }
  /** Put the words in order. words: correct order; the tiles are shown shuffled (deterministic). */
  function order({ sk, n, role = "core", d, fam, meaning, words, hints, expl, tags }) {
    const qid = id(sk, n);
    const rand = rng(hashOf(qid));
    let tiles = shuffle(words.map((w, i) => ({ w, i })), rand);
    if (tiles.every((t, k) => t.i === k)) tiles = [...tiles.slice(1), tiles[0]];
    const options = tiles.map((t, k) => ({ id: `w${k + 1}`, text: t.w }));
    const idOf = (i) => options[tiles.findIndex((t) => t.i === i)].id;
    return b.question({
      id: qid, skill: S[sk], role, type: "ordering", d, family: fam, tags, hints, expl,
      prompt: T(`단어를 알맞은 순서로 눌러 문장을 만드세요. (뜻: ${meaning.ko})`, `Bấm các từ theo đúng thứ tự để tạo thành câu. (Nghĩa: ${meaning.vi})`),
      options, answer: { order: words.map((_, i) => idOf(i)) },
    });
  }
  return { mc, tf, write, order, id };
}

/** Korean object particle after a Hangul word: 을 when the last syllable has a final consonant, otherwise 를. */
export const eul = (word) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "을" : "를";
};

/** Common instruction texts (ko / vi). */
export const I = {
  meaning: (en) => T(`'${en}'의 뜻은?`, `'${en}' nghĩa là gì?`),
  toEnglish: (w) => T(`'${w.ko}'${eul(w.ko)} 영어로 하면?`, `Từ tiếng Anh của "${w.vi}" là gì?`),
  picture: (w) => T(`그림을 보고 알맞은 영어 단어를 쓰세요: ${w.e}`, `Nhìn hình rồi viết từ tiếng Anh: ${w.e}`),
  blank: (sentence, w) => T(`빈칸에 알맞은 단어를 쓰세요: ${sentence} (${w.ko})`, `Điền từ thích hợp vào chỗ trống: ${sentence} (${w.vi})`),
  chooseBlank: (sentence) => T(`빈칸에 알맞은 말을 고르세요: ${sentence}`, `Chọn từ thích hợp cho chỗ trống: ${sentence}`),
};
export const H = {
  sound: T("소리 내어 읽어 보면 힌트가 떠올라요.", "Hãy đọc to thành tiếng, bạn sẽ nhớ ra."),
  first: (en) => T(`첫 글자: ${en[0]}`, `Chữ cái đầu tiên: ${en[0]}`),
  letters: (en) => T(`${en.length}글자 단어예요.`, `Từ này có ${en.length} chữ cái.`),
  picture: T("그림을 떠올려 보세요.", "Hãy nhớ lại hình ảnh."),
};

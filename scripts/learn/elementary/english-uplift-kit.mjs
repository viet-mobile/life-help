import { T } from "./lib.mjs";
import { makeEnglish } from "./english-helpers.mjs";

export { T };

/**
 * Difficulty ladder for elementary English (see math-uplift-kit.mjs for the idea). The TARGET language stays English in every locale;
 * only instructions, hints and explanations are Korean / Vietnamese. New questions are context-based: a word chosen from its
 * sentence, a grammar error to find, a pronoun or a clue to resolve, a short passage (2-5 sentences) to understand.
 */
export function makeEnglishUplift(b, grade) {
  /** The English builders derive the id from (skill key, n): key "up" + n "1a" gives e-e1-up-1a (database code alphabet). */
  const lessonId = (n) => `en-${grade}-l${n}`;
  const E = (n) => makeEnglish(b, grade, { up: b.peek.lesson(lessonId(n)).skillIds[0] });
  const nn = (n, k) => `${n}${k}`;
  const base = (n, k, d, tags, prompt, hints, expl) => ({ sk: "up", n: nn(n, k), role: "core", d, tags, prompt, hints, expl });
  const mc = (n, k, d, tags, prompt, items, correct, hints, expl) => E(n).mc({ ...base(n, k, d, tags, prompt, hints, expl), items, correct });
  const tf = (n, k, d, tags, prompt, truth, hints, expl) => E(n).tf({ ...base(n, k, d, tags, prompt, hints, expl), truth });
  const write = (n, k, d, tags, prompt, accepted, hints, expl, type = "short_answer") => E(n).write({ ...base(n, k, d, tags, prompt, hints, expl), accepted, type });
  const order = (n, k, d, tags, meaning, words, hints, expl) => E(n).order({ sk: "up", n: nn(n, k), role: "core", d, tags, meaning, words, hints, expl });
  const ladder = (n, keep, added, retune = {}) => {
    const cur = b.peek.lesson(lessonId(n));
    const old = [...cur.questionIds, cur.challengeId];
    for (const [pos, d] of Object.entries(retune)) b.retune(old[Number(pos) - 1], d);
    b.setLesson(lessonId(n), [...keep.map((p) => old[p - 1]), ...added.map((k) => E(n).id("up", nn(n, k)))]);
  };
  /** instruction + passage + question in both languages */
  const read = (passage, q) => T(`글을 읽고 답하세요. "${passage}" 질문: ${q}`, `Đọc đoạn văn rồi trả lời. "${passage}" Câu hỏi: ${q}`);
  const readTf = (passage, s) => T(`글을 읽고 맞는지 고르세요. "${passage}" 문장: ${s}`, `Đọc đoạn văn rồi chọn đúng hay sai. "${passage}" Câu: ${s}`);
  return { mc, tf, write, order, ladder, read, readTf, T };
}

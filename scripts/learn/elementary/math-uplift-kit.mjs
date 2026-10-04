import { T, tex } from "./math-helpers.mjs";
import { fracTex } from "./lib.mjs";
export { T, tex, fracTex };

/**
 * Difficulty ladder for elementary math.
 *
 * Every lesson is re-composed as warm-up -> standard -> challenge (difficulty 1 / 2 / 3) and gets two NEW questions: a context
 * or multi-step problem and a reasoning problem (work backwards, find the error, compare, infer). Multiple-choice distractors are
 * real student errors (place value, borrowing, wrong operation, off-by-one), not random numbers. Answers are computed by code.
 * Questions that leave a lesson stay in the bank as extra practice (role "variant").
 */
const hashOf = (s) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function makeUplift(b, h, grade) {
  const lessonId = (n) => `math-${grade}-l${n}`;
  const qid = (n, k) => `m-${grade}-up-l${n}${k}`; // matches the database code alphabet: m-e1-up-l1a
  const skillOf = (n) => b.peek.lesson(lessonId(n)).skillIds[0];
  /** numeric answer */
  const num = (n, k, d, tags, prompt, value, hints, expl, tol) => h.numeric({ id: qid(n, k), skill: skillOf(n), role: "core", d, tags, prompt, value, hints, expl, tol });
  /** multiple choice; `items` are strings (language-neutral numbers / formulas) or T pairs; the right answer position rotates by id */
  const mc = (n, k, d, tags, prompt, items, correct, hints, expl) => {
    const id = qid(n, k);
    const rot = hashOf(id) % items.length;
    const rotated = items.map((_, i) => items[(i - rot + items.length) % items.length]);
    return h.choice({ id, skill: skillOf(n), role: "core", d, tags, prompt, items: rotated, correct: (correct + rot) % items.length, hints, expl });
  };
  /**
   * ladder(n, "bcd", [a, b]): the lesson becomes [old questions picked by 1-based position among its current five] + the new ones.
   * keep: positions (1..5) of the existing questions to keep, in order; added: keys of the new questions, in order;
   * retune: { position: difficulty } relabels a kept question (a lesson that has no difficulty-1 item gets its simplest question as the warm-up).
   */
  const ladder = (n, keep, added, retune = {}) => {
    const cur = b.peek.lesson(lessonId(n));
    const old = [...cur.questionIds, cur.challengeId];
    for (const [pos, d] of Object.entries(retune)) b.retune(old[Number(pos) - 1], d); // positions are 1-based among the current five
    b.setLesson(lessonId(n), [...keep.map((p) => old[p - 1]), ...added.map((k) => qid(n, k))]);
  };
  return { num, mc, ladder, T, tex };
}

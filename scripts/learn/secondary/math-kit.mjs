import { T, tex, gcd, fracTex, frac } from "../elementary/lib.mjs";
export { T, tex, gcd, fracTex, frac };

/**
 * Builders for the secondary (M2..H3) math generators. Every learner-visible string is a { ko, vi } pair written next to the
 * numbers it is computed from; answers are computed by code, never typed. Multiple-choice distractors are real student errors
 * (sign, exponent rule, forgotten step), and the position of the right option rotates by id.
 */
export const hashOf = (s) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
const LETTERS = ["a", "b", "c", "d", "e"];

/** "3x", "-x", "5" ... a signed term; `first` suppresses a leading "+". */
export const term = (c, v = "", first = false) => {
  if (c === 0) return "";
  const body = v ? (Math.abs(c) === 1 ? v : `${Math.abs(c)}${v}`) : `${Math.abs(c)}`;
  return c < 0 ? `-${body}` : first ? body : `+${body}`;
};
/** a x + b as LaTeX, e.g. lin(3,-2) = "3x-2". */
export const lin = (a, b, v = "x") => (term(a, v, true) + term(b)) || "0";
/** polynomial from coefficients in descending power: poly([2,-3,1]) = "2x^2-3x+1". */
export const poly = (cs, v = "x") => {
  const n = cs.length - 1;
  const out = cs.map((c, i) => { const p = n - i; return term(c, p === 0 ? "" : p === 1 ? v : `${v}^{${p}}`, false); }).join("");
  const s = out.startsWith("+") ? out.slice(1) : out;
  return s || "0";
};
/** a number as TeX with a minus sign kept explicit. */
export const num = (x) => (Number.isInteger(x) ? String(x) : String(Number(x.toFixed(6))));
export const round = (x, d = 6) => Number(x.toFixed(d));
/** distinct options around the correct one: wrong values first (de-duplicated, at most 3), then the right one is returned with its index. */
export function pick(correct, wrong, size = 4) {
  const list = [];
  for (const w of wrong) if (w !== correct && !list.includes(w)) list.push(w);
  return { list: list.slice(0, size - 1), correct };
}

export function makeMathKit(b, grade, S) {
  const id = (k, n) => `m-${grade}-${k}-${n}`;
  const lessonId = (n) => `math-${grade}-l${n}`;

  /** numeric answer */
  function numeric({ k, n, role = "core", d, fam, tags, prompt, value, tol, hints, expl, seconds }) {
    return b.question({ id: id(k, n), skill: S[k], role, type: "numeric", d, family: fam, tags, prompt, hints, expl, seconds, answer: { value, tolerance: tol } });
  }
  /**
   * multiple choice. `wrong` = distractors (strings or T pairs, at least 3), `right` = the correct option (string or T pair).
   * The correct option is placed by hash of the id so the answer position does not give it away.
   */
  function choice({ k, n, role = "core", d, fam, tags, prompt, right, wrong, hints, expl, seconds, latex }) {
    const qid = id(k, n);
    const all = [...new Map(wrong.filter((w) => JSON.stringify(w) !== JSON.stringify(right)).map((w) => [JSON.stringify(w), w])).values()].slice(0, 3);
    if (all.length !== 3) throw new Error(`${qid}: needs 3 distinct wrong options`);
    const at = hashOf(qid) % 4;
    all.splice(at, 0, right);
    return b.question({ id: qid, skill: S[k], role, type: "multiple_choice", d, family: fam, tags, prompt, hints, expl, seconds, latex, options: all.map((text, i) => ({ id: LETTERS[i], text })), answer: { choice: LETTERS[at] } });
  }
  function truefalse({ k, n, role = "core", d, fam, tags, prompt, truth, hints, expl, seconds }) {
    return b.question({ id: id(k, n), skill: S[k], role, type: "true_false", d, family: fam, tags, prompt, hints, expl, seconds, answer: { tf: truth } });
  }
  /** a lesson: five question ids (4 core + the challenge) */
  const lesson = (n, skillKey, title, concept, example, five) => ({
    id: lessonId(n), title, concept, example, skills: [S[skillKey]], core: five.slice(0, 4), challenge: five[4],
  });
  const course = (spec) => b.course({ id: `math-${grade}-${spec.slug}`, grade: grade.toUpperCase(), title: spec.title, world: spec.world, unit: { id: `math-${grade}-unit`, title: spec.unitTitle }, lessons: spec.lessons });
  return { id, numeric, choice, truefalse, lesson, course };
}

/** Common two-line hint helper. */
export const H2 = (h1, h2) => [h1, h2];
export const join = (...parts) => T(parts.map((p) => p.ko).join(" "), parts.map((p) => p.vi).join(" "));
export const ONE = T("(숫자만 쓰세요)", "(chỉ nhập số)");
export const WHICH_WRONG = T("옳지 않은 것을 고르세요.", "Chọn đáp án KHÔNG đúng.");

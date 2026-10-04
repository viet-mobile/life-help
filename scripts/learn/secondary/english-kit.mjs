import { T } from "../elementary/lib.mjs";
import { makeEnglish } from "../elementary/english-helpers.mjs";
export { T };

/**
 * Builders for the secondary (M2..H3) English generators. The TARGET language (sentences, options, accepted answers) is English in
 * every locale; only instructions, rules, clues and explanations are Korean / Vietnamese ({ ko, vi } pairs). Each row carries a
 * grammar RULE (hint 1), a CLUE for this very question (hint 2) and an explanation.
 */
export const BLANK = (s) => T(`빈칸에 알맞은 말을 고르세요: ${s}`, `Chọn từ thích hợp cho chỗ trống: ${s}`);
export const DIALOG = (s) => T(`대화의 빈칸에 알맞은 말을 고르세요. ${s}`, `Chọn từ thích hợp cho chỗ trống trong đoạn hội thoại. ${s}`);
export const WRONG = T("어법상 어색한(옳지 않은) 문장을 고르세요.", "Chọn câu sai ngữ pháp (không đúng).");
export const RIGHT = T("어법상 옳은 문장을 고르세요.", "Chọn câu đúng ngữ pháp.");
export const READ = (passage, q) => T(`글을 읽고 답하세요. "${passage}" 질문: ${q}`, `Đọc đoạn văn rồi trả lời. "${passage}" Câu hỏi: ${q}`);
export const READ_TF = (passage, s) => T(`글을 읽고 맞는지 고르세요. "${passage}" 문장: ${s}`, `Đọc đoạn văn rồi chọn đúng hay sai. "${passage}" Câu: ${s}`);
export const TF = (s) => T(`다음 문장이 어법상 옳은지 고르세요: ${s}`, `Chọn câu sau đúng hay sai về ngữ pháp: ${s}`);
export const FILL = (instr, s) => T(`${instr.ko} ${s}`, `${instr.vi} ${s}`);

export function makeEnglishKit(b, grade, S) {
  const E = makeEnglish(b, grade, S);
  /** mc(sk, n, role, d, tags, prompt, items, correctIndex, rule, clue, expl) */
  const mc = (sk, n, role, d, tags, prompt, items, correct, rule, clue, expl) => E.mc({ sk, n, role, d, fam: `${sk}-mc`, tags, prompt, items, correct, hints: [rule, clue], expl });
  const tf = (sk, n, role, d, tags, prompt, truth, rule, clue, expl) => E.tf({ sk, n, role, d, fam: `${sk}-tf`, tags, prompt, truth, hints: [rule, clue], expl });
  const write = (sk, n, role, d, tags, prompt, accepted, rule, clue, expl, type = "short_answer") => E.write({ sk, n, role, d, fam: `${sk}-wr`, tags, prompt, accepted, hints: [rule, clue], expl, type });
  const order = (sk, n, role, d, tags, meaning, words, rule, clue, expl) => E.order({ sk, n, role, d, fam: `${sk}-od`, tags, meaning, words, hints: [rule, clue], expl });
  const lesson = (n, sk, title, concept, example, five) => ({ id: `en-${grade}-l${n}`, title, concept, example, skills: [S[sk]], core: five.slice(0, 4), challenge: five[4] });
  const course = (spec) => b.course({ id: `en-${grade}-${spec.slug}`, grade: grade.toUpperCase(), title: spec.title, world: spec.world, unit: { id: `en-${grade}-unit`, title: spec.unitTitle }, lessons: spec.lessons });
  return { mc, tf, write, order, lesson, course };
}

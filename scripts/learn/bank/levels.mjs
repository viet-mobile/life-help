/**
 * The ten-step difficulty ladder of the question bank.
 *
 * Level 1 is the easiest question (highest public % correct), level 10 the hardest (lowest). Levels 1..10 correspond to the grades
 * elementary 3 .. high 3, i.e. the ten school years from grade 3 to grade 12.
 */
export const LEVEL_GRADES = ["E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const gradeOfLevel = (level) => LEVEL_GRADES[level - 1] ?? null;
export const levelOfGrade = (grade) => { const i = LEVEL_GRADES.indexOf(grade); return i < 0 ? null : i + 1; };

/** Cognitive demand classes: from "can be answered by memory" to "needs creative, non-routine thinking". */
export const COGNITIVE = {
  MEMORIZE: { ko: "암기", vi: "Ghi nhớ", note: "a remembered fact or table answers it" },
  PROCEDURE: { ko: "절차", vi: "Quy trình", note: "a taught routine, applied to bare numbers or sentences" },
  APPLY: { ko: "응용", vi: "Vận dụng", note: "choose and run routines inside a realistic situation" },
  ANALYZE: { ko: "분석", vi: "Phân tích", note: "compare, evaluate, find the flaw, interpret data or sources" },
  CREATE: { ko: "창의", vi: "Sáng tạo", note: "non-routine: estimate, optimise, generalise, decide with several constraints" },
};

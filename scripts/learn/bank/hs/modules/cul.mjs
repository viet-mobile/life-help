// 수학과 문화 (12수문): the parts of the course that really have a numeric answer. Reference module of the high-school tranche.
// Honest limit: investigating, reporting and judging (most of 12수문) cannot be evidenced by numeric items; see docs/learning/math-hs-bank/allocation.md.
import { C } from "../lib.mjs";

export const TEMPLATES = {
  cul_pitchFifth: {
    ko: ["기준음의 진동수가 ${f}$ Hz입니다. 이 음보다 옥타브 ${k}$개 위로 올린 음에서, 다시 완전5도(진동수 비 $3:2$) 위의 음의 진동수는 몇 Hz인가요? (숫자만 쓰세요)", ["옥타브 위의 음은 진동수가 2배예요.", "완전5도 위는 진동수에 $\\frac{3}{2}$를 곱해요."], "옥타브 ${k}$개 위: ${f}\\times 2^{{k}}={mid}$ Hz, 완전5도 위: ${mid}\\times\\frac{3}{2}={ans}$ Hz입니다."],
    en: ["A reference note has frequency ${f}$ Hz. Raise it by ${k}$ octaves, then by a perfect fifth (frequency ratio $3:2$). What is the frequency of the resulting note in Hz? (digits only)", ["One octave up doubles the frequency.", "A perfect fifth up multiplies the frequency by $\\frac{3}{2}$."], "Up ${k}$ octaves: ${f}\\times 2^{{k}}={mid}$ Hz; a fifth higher: ${mid}\\times\\frac{3}{2}={ans}$ Hz."],
  },
  cul_bordaTotal: {
    ko: ["후보 A, B, C 중 한 명을 뽑는 보르다 투표입니다. 1위에 $2$점, 2위에 $1$점, 3위에 $0$점을 줍니다. 순위표가 'A>B>C' ${n1}명, 'B>C>A' ${n2}명, 'C>A>B' ${n3}명일 때, 후보 A의 총점은? (숫자만 쓰세요)", ["각 순위표에서 A가 몇 위인지 먼저 찾아요.", "(인원)×(순위 점수)를 모두 더해요."], "A는 첫 순위표에서 1위(2점), 둘째에서 3위(0점), 셋째에서 2위(1점)이므로 ${n1}\\times2+{n2}\\times0+{n3}\\times1={ans}$점입니다."],
    en: ["A Borda count chooses among candidates A, B, C: 2 points for first place, 1 for second, 0 for third. ${n1}$ voters rank A>B>C, ${n2}$ rank B>C>A and ${n3}$ rank C>A>B. What is candidate A's total score? (digits only)", ["First find A's place on each kind of ballot.", "Add (number of voters)×(points for that place) over all ballots."], "A is first (2 points) on the first ballot, third (0) on the second and second (1) on the third: ${n1}\\times2+{n2}\\times0+{n3}\\times1={ans}$ points."],
  },
  cul_brailleCells: {
    ko: ["점자는 한 칸에 점 ${d}$개 자리가 있고 각 자리는 솟아오르거나 솟지 않습니다. 점이 하나도 솟지 않은 빈 칸을 제외하면 한 칸으로 나타낼 수 있는 서로 다른 모양은 모두 몇 가지인가요? (숫자만 쓰세요)", ["각 자리는 솟음/솟지 않음의 2가지예요.", "모든 경우의 수에서 아무 점도 솟지 않은 1가지를 빼요."], "$2^{{d}}-1={ans}$가지입니다."],
    en: ["A braille cell has ${d}$ dot positions, each raised or not raised. Not counting the empty cell with no raised dot, how many different patterns can one cell show? (digits only)", ["Each position has 2 states: raised or not.", "Subtract the one pattern with no raised dot from all patterns."], "$2^{{d}}-1={ans}$ patterns."],
  },
};

export const GEN = {
  cul_pitchFifth: (r) => { const k = r.int(1, 3), f = r.pick([110, 120, 130, 140, 150, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 440]); const mid = f * 2 ** k; return { v: { f, k, mid }, ans: (mid * 3) / 2 }; },
  cul_bordaTotal: (r) => { const n1 = r.int(2, 30), n2 = r.int(2, 30), n3 = r.int(2, 30); return { v: { n1, n2, n3 }, ans: n1 * 2 + n3 }; },
  cul_brailleCells: (r) => { const d = r.int(2, 8); return { v: { d }, ans: 2 ** d - 1 }; },
};

export const PLAN = [
  { skill: "m.el.cul1", template: "cul_pitchFifth", levels: [1], count: 20, d: 3, standards: ["12수문01-01"], strategy: "ratio-chaining", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_bordaTotal", levels: [1], count: 20, d: 3, standards: ["12수문02-04"], strategy: "weighted-count", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_brailleCells", levels: [1], count: 7, d: 3, standards: ["12수문03-02"], strategy: "counting-powers", evidence: "counting" },
];

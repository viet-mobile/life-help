// 수학과 문화 (12수문): the parts of the course that really have a numeric answer. Reference module of the high-school tranche.
// Honest limit: investigating, reporting and judging (most of 12수문) cannot be evidenced by numeric items; see docs/learning/math-hs-bank/allocation.md.
import { C } from "../lib.mjs";

export const TEMPLATES = {
  cul_pitchFifth: {
    ko: ["기준음의 진동수가 ${f}$ Hz입니다. 이 음보다 옥타브 ${k}$개 위로 올린 음에서, 다시 완전5도(진동수 비 $3:2$) 위의 음의 진동수는 몇 Hz인가요? (숫자만 쓰세요)", ["옥타브 위의 음은 진동수가 2배예요.", "완전5도 위는 진동수에 $\\frac{3}{2}$를 곱해요."], "옥타브 ${k}$개 위: ${f}\\times 2^{{k}}={mid}$ Hz, 완전5도 위: ${mid}\\times\\frac{3}{2}={ans}$ Hz입니다."],
    en: ["A reference note has frequency ${f}$ Hz. Raise it by ${k}$ octaves, then by a perfect fifth (frequency ratio $3:2$). What is the frequency of the resulting note in Hz? (digits only)", ["One octave up doubles the frequency.", "A perfect fifth up multiplies the frequency by $\\frac{3}{2}$."], "Up ${k}$ octaves: ${f}\\times 2^{{k}}={mid}$ Hz; a fifth higher: ${mid}\\times\\frac{3}{2}={ans}$ Hz."],
  },
  cul_bordaTotal: {
    ko: ["후보 A, B, C 중 한 명을 뽑는 보르다 투표입니다. 1위에 $2$점, 2위에 $1$점, 3위에 $0$점을 줍니다. 순위표가 'A>B>C' ${n1}$명, 'B>C>A' ${n2}$명, 'C>A>B' ${n3}$명일 때, 후보 A의 총점은? (숫자만 쓰세요)", ["각 순위표에서 A가 몇 위인지 먼저 찾아요.", "(인원)×(순위 점수)를 모두 더해요."], "A는 첫 순위표에서 1위(2점), 둘째에서 3위(0점), 셋째에서 2위(1점)이므로 ${n1}\\times2+{n2}\\times0+{n3}\\times1={ans}$점입니다."],
    en: ["A Borda count chooses among candidates A, B, C: 2 points for first place, 1 for second, 0 for third. ${n1}$ voters rank A>B>C, ${n2}$ rank B>C>A and ${n3}$ rank C>A>B. What is candidate A's total score? (digits only)", ["First find A's place on each kind of ballot.", "Add (number of voters)×(points for that place) over all ballots."], "A is first (2 points) on the first ballot, third (0) on the second and second (1) on the third: ${n1}\\times2+{n2}\\times0+{n3}\\times1={ans}$ points."],
  },
  cul_bordaMax: {
    ko: ["후보 A, B, C 중 한 명을 뽑는 보르다 투표입니다. 1위에 $2$점, 2위에 $1$점, 3위에 $0$점을 줍니다. 순위표가 '{b1}' ${n1}$명, '{b2}' ${n2}$명, '{b3}' ${n3}$명일 때, 세 후보 중 가장 높은 총점은? (숫자만 쓰세요)", ["각 후보가 순위표마다 몇 위인지 찾아 점수를 정해요.", "세 후보의 총점을 모두 구한 뒤 가장 큰 값을 골라요."], "A의 총점은 ${eA}$점, B의 총점은 ${eB}$점, C의 총점은 ${eC}$점입니다. 가장 높은 총점은 ${ans}$점입니다."],
    en: ["A Borda count chooses among candidates A, B, C: 2 points for first place, 1 for second, 0 for third. ${n1}$ voters rank '{b1}', ${n2}$ rank '{b2}' and ${n3}$ rank '{b3}'. What is the highest total score among the three candidates? (digits only)", ["Find each candidate's place on every kind of ballot and turn it into points.", "Compute all three totals and pick the largest."], "A's total is ${eA}$ points, B's total is ${eB}$ points and C's total is ${eC}$ points. The highest total is ${ans}$ points."],
  },
  cul_voteGuarantee: {
    ko: ["후보 A, B, C가 가장 많은 표를 얻은 한 명이 당선되는 투표로 겨루고 있습니다. 개표 중간 결과는 A ${a}$표, B ${b}$표, C ${c}$표이고, 아직 개표하지 않은 표가 ${m}$표 남아 있습니다. 남은 표가 A와 B에게 어떻게 나뉘더라도 C가 반드시 혼자 1위가 되려면, C는 남은 ${m}$표 중 적어도 몇 표를 얻어야 하나요? (숫자만 쓰세요)", ["C가 남은 표에서 $x$표를 얻으면 나머지 ${m}$−$x$표는 다른 후보에게 가요. 가장 불리한 경우는 그 표가 모두 지금 앞선 후보에게 가는 경우예요.", "C의 표가 앞선 후보의 표보다 (동점이 아니라) 더 많아야 해요. 부등식을 세워 가장 작은 정수 $x$를 구해요."], "지금 가장 많은 표는 ${M}$표입니다. 남은 표 중 C가 $x$표를 얻고 나머지 ${m}-x$표가 모두 ${M}$표인 후보에게 가면 ${c}+x>{M}+({m}-x)$여야 합니다. 이를 정리하면 $x>{half}$이므로 가장 작은 정수는 ${ans}$입니다."],
    en: ["Candidates A, B, C are in a vote where the one with the most votes wins. The count so far is A ${a}$, B ${b}$, C ${c}$, and ${m}$ votes are still uncounted. However the remaining votes may be split between A and B, C must end up alone in first place. At least how many of the remaining ${m}$ votes must C get? (digits only)", ["If C gets $x$ of the remaining votes, the other ${m}$−$x$ go to the other candidates. The worst case is that all of them go to the candidate currently ahead.", "C must have strictly more votes than that candidate (a tie is not enough). Write the inequality and find the smallest integer $x$."], "The most votes so far is ${M}$. If C gets $x$ of the remaining votes and the other ${m}-x$ all go to the candidate with ${M}$, we need ${c}+x>{M}+({m}-x)$. This simplifies to $x>{half}$, so the smallest integer is ${ans}$."],
  },
  cul_stringLength: {
    ko: ["현악기의 줄은 길이가 짧아질수록 진동수가 높아지며, 줄의 굵기와 팽팽함이 같으면 진동수는 줄의 길이에 반비례합니다. 길이 ${L}$ cm인 줄이 ${f}$ Hz의 음을 낼 때, 같은 줄을 눌러서 울리는 부분의 길이를 ${L2}$ cm로 줄이면 나는 음의 진동수는 몇 Hz인가요? (숫자만 쓰세요)", ["(진동수)×(길이)의 값은 변하지 않아요.", "${f}\\times{L}$의 값을 새 길이 ${L2}$ cm로 나눠요."], "(진동수)×(길이)가 일정하므로 ${f}\\times{L}=x\\times{L2}$입니다. 따라서 $x=\\frac{{f}\\times{L}}{{L2}}={ans}$ Hz입니다."],
    en: ["The shorter a string of a stringed instrument is, the higher its frequency; with the same thickness and tension, the frequency is inversely proportional to the length. A string of length ${L}$ cm sounds at ${f}$ Hz. If the vibrating part of the same string is shortened to ${L2}$ cm by pressing it, what is the frequency in Hz? (digits only)", ["(frequency)×(length) does not change.", "Divide ${f}\\times{L}$ by the new length ${L2}$ cm."], "Since (frequency)×(length) is constant, ${f}\\times{L}=x\\times{L2}$. So $x=\\frac{{f}\\times{L}}{{L2}}={ans}$ Hz."],
  },
  cul_brailleAtMost: {
    ko: ["점자 한 칸에는 점이 놓일 수 있는 자리가 ${d}$개 있고, 각 자리는 솟아오르거나 솟지 않습니다. 솟은 점이 1개 이상 ${k}$개 이하인 서로 다른 모양은 한 칸에서 모두 몇 가지인가요? (숫자만 쓰세요)", ["솟은 점이 정확히 $j$개인 모양의 수는 ${d}$개의 자리 중 $j$개를 고르는 방법의 수예요.", "$j=1$부터 $j={k}$까지 각각 구해 더해요."], "솟은 점이 $j$개인 모양은 $_{{d}}\\mathrm{C}_{j}$가지이므로 ${terms}={ans}$가지입니다."],
    en: ["A braille cell has ${d}$ positions where a dot can be placed, each either raised or not. How many different patterns in one cell have at least 1 and at most ${k}$ raised dots? (digits only)", ["The number of patterns with exactly $j$ raised dots is the number of ways to choose $j$ of the ${d}$ positions.", "Compute it for $j=1$ up to $j={k}$ and add."], "There are $_{{d}}\\mathrm{C}_{j}$ patterns with $j$ raised dots, so ${terms}={ans}$ patterns."],
  },
};

export const GEN = {
  cul_pitchFifth: (r) => { const k = r.int(1, 3), f = r.pick([110, 120, 130, 140, 150, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 440]); const mid = f * 2 ** k; return { v: { f, k, mid }, ans: (mid * 3) / 2 }; },
  cul_bordaTotal: (r) => { const n1 = r.int(2, 30), n2 = r.int(2, 30), n3 = r.int(2, 30); return { v: { n1, n2, n3 }, ans: n1 * 2 + n3 }; },
  cul_bordaMax: (r) => {
    const perms = ["A>B>C", "A>C>B", "B>A>C", "B>C>A", "C>A>B", "C>B>A"];
    for (;;) {
      const bs = [r.pick(perms), r.pick(perms), r.pick(perms)];
      if (new Set(bs).size < 3) continue;
      const ns = [r.int(3, 30), r.int(3, 30), r.int(3, 30)];
      const expr = (c) => bs.map((b, i) => `${ns[i]}\\times${2 - b.split(">").indexOf(c)}`).join("+");
      const tot = (c) => bs.reduce((s, b, i) => s + ns[i] * (2 - b.split(">").indexOf(c)), 0);
      const t = ["A", "B", "C"].map(tot);
      if (new Set(t).size < 3) continue;
      return { v: { b1: bs[0], b2: bs[1], b3: bs[2], n1: ns[0], n2: ns[1], n3: ns[2], eA: `${expr("A")}=${t[0]}`, eB: `${expr("B")}=${t[1]}`, eC: `${expr("C")}=${t[2]}` }, ans: Math.max(...t) };
    }
  },
  cul_voteGuarantee: (r) => {
    for (;;) {
      const a = r.int(20, 90), b = r.int(20, 90), c = r.int(15, 85), m = r.int(10, 60);
      const M = Math.max(a, b);
      if (c >= M || c + m <= M) continue;
      const x = Math.floor((M - c + m) / 2) + 1;
      return { v: { a, b, c, m, M, half: `\\frac{${M - c + m}}{2}` }, ans: x };
    }
  },
  cul_stringLength: (r) => {
    for (;;) {
      const L = r.pick([48, 60, 72, 90, 120]), f = r.pick([110, 120, 130, 150, 160, 180, 200, 220, 240, 260, 330, 440]);
      const L2 = r.int(Math.ceil(L / 3), L - 4);
      if ((f * L) % L2 !== 0) continue;
      return { v: { L, f, L2 }, ans: (f * L) / L2 };
    }
  },
  cul_brailleAtMost: (r) => {
    const d = r.pick([6, 8]), k = r.int(1, d - 1);
    let tot = 0;
    for (let j = 1; j <= k; j++) tot += C(d, j);
    return { v: { d, k, terms: Array.from({ length: k }, (_, i) => `_{${d}}\\mathrm{C}_{${i + 1}}`).join("+") }, ans: tot };
  },
};

export const PLAN = [
  { skill: "m.el.cul1", template: "cul_pitchFifth", levels: [1], count: 14, d: 3, standards: ["12수문01-01"], strategy: "ratio-chaining", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_bordaTotal", levels: [1], count: 14, d: 3, standards: ["12수문02-04"], strategy: "weighted-count", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_bordaMax", levels: [1], count: 12, d: 3, standards: ["12수문02-04"], strategy: "compare-all-totals", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_voteGuarantee", levels: [1], count: 12, d: 4, standards: ["12수문02-04"], strategy: "worst-case-inequality", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_stringLength", levels: [1], count: 12, d: 3, standards: ["12수문01-01"], strategy: "inverse-proportion", evidence: "application" },
  { skill: "m.el.cul1", template: "cul_brailleAtMost", levels: [1], count: 12, d: 3, standards: ["12수문03-02"], strategy: "combination-sum", evidence: "counting" },
];

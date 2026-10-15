// 미적분Ⅰ (12미적Ⅰ): limits and continuity, differentiation and its uses, indefinite / definite integrals and areas.
// All data are integer polynomials; every answer is re-derived in verify/ca1.py with sympy / exact Fractions / brute force.
import { poly, evalPoly, Q, gcd, lin, cf, tfrac } from "../lib.mjs";

export const TEMPLATES = {};
export const GEN = {};
export const PLAN = [];
const def = (key, ko, en, gen, plan) => { TEMPLATES[key] = { ko, en }; GEN[key] = gen; PLAN.push({ template: key, ...plan }); };

const KI = "(숫자만 쓰세요)", KF = "(소수로 써도 되고 3/4 처럼 분수로 써도 돼요)";
const EI = "(digits only)", EF = "(a decimal, or a fraction such as 3/4, is fine)";

// ---- polynomial helpers (coefficient arrays, highest degree first) ----
const P = (c, x = "x") => poly(c, x);
const pd = (c) => c.slice(0, -1).map((a, i) => a * (c.length - 1 - i));
const pmul = (a, b) => { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
const padd = (a, b) => { const n = Math.max(a.length, b.length), r = Array(n).fill(0); a.forEach((x, i) => { r[n - a.length + i] += x; }); b.forEach((x, i) => { r[n - b.length + i] += x; }); return r; };
const psc = (a, k) => a.map((x) => x * k);
const fromRoots = (k, roots) => roots.reduce((p, r) => pmul(p, [1, -r]), [k]);
const ev = (c, x) => evalPoly(c, x);
/** antiderivative (constant 0) with exact rational coefficients, highest degree first */
const pint = (c) => [...c.map((a, i) => new Q(a, c.length - i)), new Q(0)];
const evQ = (cs, x) => cs.reduce((s, c) => s.mul(x).add(c), new Q(0));
const dint = (c, a, b) => { const F = pint(c); return evQ(F, b).sub(evQ(F, a)); };
const fac = (r, x = "x") => (r === 0 ? x : r > 0 ? `(${x}-${r})` : `(${x}+${-r})`);
const num = (n) => (n < 0 ? `(${n})` : `${n}`);       // parenthesised negative for use inside products
const sgnTerm = (n) => (n < 0 ? `-${-n}` : `+${n}`);
const tl = (n) => (n === 0 ? "" : n < 0 ? `-${-n}` : `+${n}`);             // trailing constant, omitted when 0
const tx = (n, x = "x") => (n === 0 ? "" : `${n < 0 ? "-" : "+"}${Math.abs(n) === 1 ? "" : Math.abs(n)}${x}`);  // trailing term n*x
const xminus = (a) => (a === 0 ? "x" : a > 0 ? `x-${a}` : `x+${-a}`);
/** cubic with local extrema at m, n (K>0: max at m<n) : K x^3 - 3K/2 (m+n) x^2 + 3K m n x + c ; null if not integral */
const cubicCrit = (K, m, n, c) => ((3 * K * (m + n)) % 2 !== 0 ? null : [K, (-3 * K * (m + n)) / 2, 3 * K * m * n, c]);
const qans = (q) => q.toNumber();
/** cases-environment for a piecewise definition: rows = [expr, condition] */
const cases = (rows) => `f(x)=\\begin{cases} ${rows.map(([e, cnd]) => `${e} & (${cnd})`).join(" \\\\ ")} \\end{cases}`;
const isInt = Number.isInteger;

// ================= 01 limits and continuity =================
def("ca1_limCoefRational",
  ["$\\lim_{x\\to {c}}\\frac{{num}}{{den}}={L}$ 일 때, 상수 $a$, $b$에 대하여 $a+b$의 값은? " + KI,
   ["분모가 $0$이 되는 $x={c}$에서 극한값이 존재하려면 분자도 $x={c}$에서 $0$이어야 해요.", "분자가 ${xc}$ 인수를 갖도록 $b$를 $a$로 나타낸 뒤, 약분한 식의 극한값이 주어진 값(${L}$)과 같다는 식을 세우세요."],
   "극한값이 존재하고 분모가 $x={c}$에서 $0$이므로 분자도 $x={c}$에서 $0$이어야 합니다. 분자와 분모의 공통인수를 약분한 뒤 극한값이 주어진 값(${L}$)과 같다는 조건에서 $a={av}$, $b={bv}$입니다. 따라서 $a+b={ans}$입니다."],
  ["If $\\lim_{x\\to {c}}\\frac{{num}}{{den}}={L}$, what is $a+b$ for the constants $a$ and $b$? " + EI,
   ["For the limit to exist where the denominator is $0$ at $x={c}$, the numerator must also be $0$ there.", "Make the numerator divisible by ${xc}$, cancel, and require the limit to equal ${L}$."],
   "The limit exists and the denominator is $0$ at $x={c}$, so the numerator is $0$ there too. Cancelling the common factor and requiring the limit ${L}$ gives $a={av}$, $b={bv}$. So $a+b={ans}$."],
  (r, lvl) => {
    const c = r.nonzero(-4, 4), L = r.int(-6, 6);
    let A = 1, a, b, n, d;
    if (lvl === 1) { a = L - 2 * c; d = xminus(c); }
    else if (lvl === 2) { A = r.pick([2, 3, -1, -2]); a = L - 2 * A * c; d = xminus(c); }
    else { A = r.pick([1, 2, 3, -1]); a = 2 * c * L - 2 * A * c; d = `x^2-${c * c}`; }
    b = -A * c * c - a * c;
    n = `${cf(A)}x^2+ax+b`;
    return { v: { c, L, num: n, den: d, xc: xminus(c), av: a, bv: b }, ans: a + b };
  },
  { skill: "m.h2.lim", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-01-02"], strategy: "removable-form-coefficients", evidence: "reverse" });

def("ca1_limInfRatio",
  ["$\\lim_{x\\to\\infty}\\frac{{num}}{{den}}$ 의 값은? " + KF,
   ["$x\\to\\infty$일 때는 분모와 분자의 최고차항(또는 $x$로 묶은 최고차 부분)만 비교하면 돼요.", "분모, 분자를 가장 큰 $x$의 거듭제곱으로 나누어 보세요."],
   "분모, 분자를 $x$의 최고차 거듭제곱으로 나누고 $x\\to\\infty$로 보내면 최고차항의 계수의 비가 남습니다. 따라서 극한값은 ${ansf}$입니다."],
  ["What is $\\lim_{x\\to\\infty}\\frac{{num}}{{den}}$? " + EF,
   ["As $x\\to\\infty$ only the leading behaviour of numerator and denominator matters.", "Divide the numerator and denominator by the highest power of $x$."],
   "Dividing by the highest power of $x$ and letting $x\\to\\infty$ leaves the ratio of the leading coefficients. The limit is ${ansf}$."],
  (r, lvl) => {
    if (lvl === 1) {
      const p = r.nonzero(-7, 7), s = r.nonzero(-6, 6), q = r.int(-9, 9), t = r.int(-9, 9), u = r.int(-9, 9), w = r.int(-9, 9);
      return { v: { num: P([p, q, w]), den: P([s, t, u]), ansf: tfrac(p, s) }, ans: p / s };
    }
    if (lvl === 2) {
      const a = r.nonzero(-4, 4), b = r.int(-5, 5), c = r.nonzero(-4, 4), d = r.int(-5, 5), e = r.nonzero(-4, 4), f = r.int(-5, 5), g = r.nonzero(-4, 4), h = r.int(-5, 5);
      return { v: { num: `(${lin(a, b)})(${lin(c, d)})`, den: `(${lin(e, f)})(${lin(g, h)})`, ansf: tfrac(a * c, e * g) }, ans: (a * c) / (e * g) };
    }
    const m = r.int(1, 5), d = r.nonzero(-6, 6), b = r.int(-9, 9), c = r.int(1, 9), e = r.int(-9, 9);
    const dd = d < 0 ? -d : d;               // keep the linear denominator positive for large x
    return { v: { num: `\\sqrt{${m * m}x^2${tx(b)}+${c}}`, den: `${lin(dd, e)}`, ansf: tfrac(m, dd) }, ans: m / dd };
  },
  { skill: "m.h2.lim", levels: [1, 2, 3], count: 12, d: 2, standards: ["12미적Ⅰ-01-02"], strategy: "limit-at-infinity", evidence: "calc" });

def("ca1_limRadical",
  ["$\\lim_{x\\to\\infty}\\left({expr}\\right)$ 의 값은? " + KF,
   ["루트가 있는 두 항의 차는 분모에 두 항의 합이 오도록 유리화해 보세요.", "유리화한 뒤 분모, 분자를 $x$로 나누고 $x\\to\\infty$로 보내요."],
   "유리화하면 분자는 $x$의 일차식이 되고 분모는 $x$에 비례하는 식이 됩니다. 분모, 분자를 $x$로 나누어 극한을 구하면 ${ansf}$입니다."],
  ["What is $\\lim_{x\\to\\infty}\\left({expr}\\right)$? " + EF,
   ["Rationalise: multiply and divide by the sum of the two radical terms.", "Then divide numerator and denominator by $x$ and let $x\\to\\infty$."],
   "After rationalising the numerator is linear in $x$ and the denominator grows like a multiple of $x$. Dividing by $x$ and taking the limit gives ${ansf}$."],
  (r, lvl) => {
    if (lvl === 1) {
      let a, c; do { a = r.int(-9, 9); c = r.int(-9, 9); } while (a === c);
      const b = r.int(-6, 6), d = r.int(-6, 6);
      return { v: { expr: `\\sqrt{x^2${tx(a)}${tl(b)}}-\\sqrt{x^2${tx(c)}${tl(d)}}`, ansf: tfrac(a - c, 2) }, ans: (a - c) / 2 };
    }
    const m = r.int(1, 4), a = r.nonzero(-9, 9), b = r.int(1, 8), n = r.int(-4, 4);
    return { v: { expr: `\\sqrt{${m * m}x^2${tx(a)}+${b}}-(${lin(m, n)})`, ansf: tfrac(a - 2 * m * n, 2 * m) }, ans: a / (2 * m) - n };
  },
  { skill: "m.h2.lim", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-01-02"], strategy: "rationalise-infinity", evidence: "calc" });

def("ca1_limPiecewise",
  ["함수 ${pw}$ 에 대하여 {ask} 의 값은? " + KI,
   ["$x$가 $k$에 가까워질 때 $x<k$인 쪽(좌극한)과 $x>k$인 쪽(우극한)에서 쓰는 식이 달라요.", "구하는 극한이 어느 쪽에서 다가가는 극한인지 먼저 정하고 그쪽 식에 대입하세요."],
   "함수값 $f(k)$는 극한과 관계없습니다. 해당하는 쪽의 식에 대입하여 계산하면 답은 ${ans}$입니다."],
  ["For the function ${pw}$, what is {ask}? " + EI,
   ["Near $x=k$ the left side ($x<k$) and the right side ($x>k$) use different expressions.", "Decide from which side the variable approaches and substitute into that expression."],
   "The value $f(k)$ plays no role in a limit. Substituting into the expression on the relevant side gives ${ans}$."],
  (r, lvl) => {
    const k = r.int(-3, 3);
    let pl, pr, e;
    do { pl = [r.pick([0, 0, 1, -1]), r.nonzero(-3, 3), r.int(-6, 6)]; pr = [r.pick([0, 0, 1, -1]), r.nonzero(-3, 3), r.int(-6, 6)]; e = r.int(-8, 8); } while (ev(pl, k) === ev(pr, k) || e === ev(pl, k) || e === ev(pr, k));
    const left = ev(pl, k), right = ev(pr, k);
    const pw = cases([[P(pl), `x<${k}`], [String(e), `x=${k}`], [P(pr), `x>${k}`]]);
    const base = { pw, k, pl: P(pl), pr: P(pr), e }, kp = k < 0 ? `(${k})` : `${k}`;
    if (lvl === 1) return { v: { ...base, ask: `$\\lim_{x\\to ${kp}^{-}}f(x)+\\lim_{x\\to ${kp}^{+}}f(x)$`, mode: 1, s: 0 }, ans: left + right };
    const s = r.pick([1, 2, 3, -1, -2, -3]), ts = `${s < 0 ? "-" : "+"}${Math.abs(s) === 1 ? "" : Math.abs(s)}`;
    if (lvl === 2) { const g = `${k}${ts}x^2`; return { v: { ...base, ask: `$\\lim_{x\\to 0}f(${g})$`, mode: 2, s }, ans: s > 0 ? right : left }; }
    const g = `${k}${ts}x-x^2`;
    return { v: { ...base, ask: `$\\lim_{x\\to 0^{+}}f(${g})-\\lim_{x\\to 0^{-}}f(${g})$`, mode: 3, s }, ans: s > 0 ? right - left : left - right };
  },
  { skill: "m.h2.lim", levels: [1, 2, 3], count: 14, d: 2, standards: ["12미적Ⅰ-01-01", "12미적Ⅰ-01-02"], strategy: "one-sided-limits", evidence: "concept" });

def("ca1_contRadical",
  ["함수 ${pw}$ 가 $x={c}$에서 연속일 때, 상수 $k$의 값은? " + KF,
   ["$x={c}$에서 연속이려면 $x\\to {c}$일 때의 극한값이 $k$여야 해요.", "분자나 분모의 무리식을 유리화한 뒤 공통인수를 약분하세요."],
   "연속이려면 $k=\\lim_{x\\to {c}}f(x)$입니다. 무리식을 유리화하여 공통인수를 약분한 뒤 극한값을 구하면 $k={ansf}$입니다."],
  ["The function ${pw}$ is continuous at $x={c}$. What is the constant $k$? " + EF,
   ["Continuity at $x={c}$ requires $\\lim_{x\\to {c}}f(x)=f({c})=k$.", "Rationalise the radical expression and cancel the common factor."],
   "Continuity means $k=\\lim_{x\\to {c}}f(x)$. Rationalising, cancelling the common factor and evaluating the limit gives $k={ansf}$."],
  (r, lvl) => {
    const c = r.int(-4, 4), Q_ = r.int(1, 5);
    const ne = `x\\ne ${c}`;
    if (lvl === 1) {
      const A = 1, B = Q_ * Q_ - A * c;
      return { v: { pw: cases([[`\\frac{\\sqrt{x${tl(B)}}-${Q_}}{${xminus(c)}}`, ne], ["k", `x=${c}`]]), c, e: `\\sqrt{x${tl(B)}}-${Q_}`, d: xminus(c), kind: 1, ansf: tfrac(1, 2 * Q_) }, ans: 1 / (2 * Q_) };
    }
    if (lvl === 2) {
      const A = r.pick([2, 3, 4, -1, -2]), B = Q_ * Q_ - A * c;
      return { v: { pw: cases([[`\\frac{${xminus(c)}}{\\sqrt{${cf(A)}x${tl(B)}}-${Q_}}`, ne], ["k", `x=${c}`]]), c, e: xminus(c), d: `\\sqrt{${cf(A)}x${tl(B)}}-${Q_}`, kind: 2, ansf: tfrac(2 * Q_, A) }, ans: (2 * Q_) / A };
    }
    const S1 = r.int(1, 4), W = r.int(1, 4);
    return { v: { pw: cases([[`\\frac{\\sqrt{x${tl(S1 * S1 - c)}}-${S1}}{\\sqrt{x${tl(W * W - c)}}-${W}}`, ne], ["k", `x=${c}`]]), c, e: `\\sqrt{x${tl(S1 * S1 - c)}}-${S1}`, d: `\\sqrt{x${tl(W * W - c)}}-${W}`, kind: 3, ansf: tfrac(W, S1) }, ans: W / S1 };
  },
  { skill: "m.h2.lim", levels: [1, 2, 3], count: 12, d: 3, standards: ["12미적Ⅰ-01-03"], strategy: "continuity-by-limit", evidence: "calc" });

def("ca1_contTwoJoint",
  ["함수 ${pw}$ 가 모든 실수 $x$에서 연속일 때, 상수 $a$, $b$에 대하여 $a+b$의 값은? " + KI,
   ["연속이 아닐 수 있는 곳은 식이 바뀌는 $x={p1}$, $x={p2}$입니다.", "각 점에서 왼쪽 식과 오른쪽 식의 값이 같다는 방정식을 세우세요."],
   "$x={p1}$, $x={p2}$에서 양쪽 식의 값이 같아야 하므로 두 방정식을 얻고, 풀면 $a={av}$, $b={bv}$입니다. 따라서 $a+b={ans}$입니다."],
  ["The function ${pw}$ is continuous for all real $x$. What is $a+b$ for the constants $a$ and $b$? " + EI,
   ["Continuity can only fail where the formula changes: at $x={p1}$ and $x={p2}$.", "At each of these points set the left expression equal to the right expression."],
   "At $x={p1}$ and $x={p2}$ both expressions must agree. Solving the two equations gives $a={av}$, $b={bv}$, so $a+b={ans}$."],
  (r, lvl) => {
    const p1 = r.int(-3, 1), p2 = p1 + r.int(1, 3);
    let g1, g2, g3, av, bv;
    if (lvl === 1) {
      const s1 = r.nonzero(-3, 3), s2 = r.nonzero(-3, 3), u = r.nonzero(-2, 2), vv = r.int(-4, 4), w = r.int(-5, 5);
      const M = [u, vv, w];
      av = ev(M, p1) - s1 * p1; bv = ev(M, p2) - s2 * p2;
      g1 = `${cf(s1)}x+a`; g2 = P(M); g3 = `${cf(s2)}x+b`;
    } else {
      const a0 = r.nonzero(-3, 3), b0 = r.nonzero(-4, 4);
      let pp = p1, qq = p2;
      if (pp === 0) { pp = -1; }
      if (qq === 0) { qq = 1; }
      const s1 = r.nonzero(-3, 3), s2 = r.nonzero(-3, 3);
      const Lp = a0 * pp * pp + b0 * pp, Rq = a0 * qq * qq + b0 * qq;
      const t1 = Lp - s1 * pp, t2 = Rq - s2 * qq;
      av = a0; bv = b0;
      g1 = `${cf(s1)}x${tl(t1)}`; g2 = "ax^2+bx"; g3 = `${cf(s2)}x${tl(t2)}`;
      return { v: { pw: cases([[g1, `x<${pp}`], [g2, `${pp}\\le x<${qq}`], [g3, `x\\ge ${qq}`]]), p1: pp, p2: qq, g1, g2, g3, av, bv }, ans: av + bv };
    }
    return { v: { pw: cases([[g1, `x<${p1}`], [g2, `${p1}\\le x<${p2}`], [g3, `x\\ge ${p2}`]]), p1, p2, g1, g2, g3, av, bv }, ans: av + bv };
  },
  { skill: "m.h2.lim", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-01-03", "12미적Ⅰ-01-04"], strategy: "piecewise-continuity-system", evidence: "reverse" });

def("ca1_contProduct",
  ["함수 ${pw}$ 와 $g(x)={gd}$ (식에 나온 문자 $a$, $b$, $c$는 상수)에 대하여 $f(x)g(x)$가 모든 실수 $x$에서 연속일 때, $g({kq})$의 값은? " + KI,
   ["$f$가 불연속인 점에서도 $f(x)g(x)$가 연속이려면 그 점에서 $g$의 값이 어떠해야 할까요?", "$g(x)$가 그 점들을 근으로 가지므로 인수분해된 꼴로 나타낼 수 있어요."],
   "$f$의 값이 뛰는 점에서 $f(x)g(x)$가 연속이려면 그 점에서 $g=0$이어야 합니다. 따라서 $g(x)$는 해당 점들을 근으로 가지고, 최고차항의 계수가 $1$이므로 $g({kq})={ans}$입니다."],
  ["For ${pw}$ and $g(x)={gd}$ (letters $a$, $b$, $c$ appearing in the formula are constants), $f(x)g(x)$ is continuous for all real $x$. What is $g({kq})$? " + EI,
   ["At a point where $f$ jumps, what must $g$ equal for $f(x)g(x)$ to stay continuous?", "So $g$ has those points as roots and can be written in factored form."],
   "Where $f$ jumps, $f(x)g(x)$ is continuous only if $g=0$ there. So $g$ has those points as roots and, being monic, $g({kq})={ans}$."],
  (r, lvl) => {
    const nj = lvl;                       // number of jump points
    const pts = [];
    while (pts.length < nj) { const z = r.int(-4, 4); if (!pts.includes(z)) pts.push(z); }
    if (nj === 1 && pts[0] === 0) pts[0] = r.nonzero(-4, 4);
    pts.sort((x, y) => x - y);
    const vals = [r.int(-5, 5)];
    for (let i = 0; i < nj; i++) { let z; do z = r.int(-5, 5); while (z === vals[i]); vals.push(z); }
    const rows = [[String(vals[0]), `x<${pts[0]}`]];
    for (let i = 1; i < nj; i++) rows.push([String(vals[i]), `${pts[i - 1]}\\le x<${pts[i]}`]);
    rows.push([String(vals[nj]), `x\\ge ${pts[nj - 1]}`]);
    const gd = nj === 1 ? "x^2+ax+b" : nj === 2 ? "x^2+ax+b" : "x^3+ax^2+bx+c";
    let g = fromRoots(1, nj === 1 ? [pts[0], r.nonzero(-4, 4)] : pts);
    let gdef;
    if (nj === 1) { gdef = `x^2+ax${tl(g[2])}`; }
    else gdef = gd;
    const kq = r.int(-5, 5);
    return { v: { pw: cases(rows), gd: gdef, kq, pts: pts.join(","), vals: vals.join(",") }, ans: ev(g, kq) };
  },
  { skill: "m.h2.lim", levels: [1, 2, 3], count: 12, d: 3, standards: ["12미적Ⅰ-01-03", "12미적Ⅰ-01-04"], strategy: "product-continuity", evidence: "concept" });

def("ca1_ivtCount",
  ["방정식 ${fx}=0$ 이 열린구간 $({m},{n})$에서 실근을 갖도록 하는 정수 $a$의 개수는? " + KI,
   ["이 함수는 구간 전체에서 증가해요. 그래서 구간 양 끝에서 함숫값의 부호가 서로 달라야 해요.", "$f({m})$, $f({n})$의 부호가 서로 반대, 즉 $f({m})f({n})<0$ 이라는 조건을 $a$에 대한 부등식으로 쓰세요."],
   "$f(x)={fx}$는 $f'(x)>0$이라 증가하므로 구간에서 실근을 가질 필요충분조건은 $f({m})f({n})<0$입니다. 이를 만족시키는 정수 $a$는 ${alo}<a<{ahi}$ 이므로 ${ans}$개입니다."],
  ["How many integers $a$ make the equation ${fx}=0$ have a real root in the open interval $({m},{n})$? " + EI,
   ["This function is increasing everywhere, so a root in the interval needs opposite signs at the two ends.", "Write $f({m})f({n})<0$ as an inequality in $a$."],
   "For $f(x)={fx}$, $f'(x)>0$, so the function is increasing and a root in $({m},{n})$ exists iff $f({m})f({n})<0$. That means ${alo}<a<{ahi}$, giving ${ans}$ integers."],
  (r, lvl) => {
    const p = lvl === 3 ? r.int(3, 8) : r.int(1, 5);
    const m = r.int(-3, lvl === 1 ? 2 : 1);
    const n = m + (lvl === 1 ? 1 : lvl === 2 ? r.int(2, 3) : r.int(2, 4));
    const f0 = (z) => z ** 3 + p * z;
    return { v: { fx: `x^3${p === 1 ? "+x" : `+${p}x`}+a`, m, n, alo: -f0(n), ahi: -f0(m), p }, ans: f0(n) - f0(m) - 1 };
  },
  { skill: "m.h2.lim", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-01-04"], strategy: "ivt-integer-parameter-count", evidence: "counting" });

// ================= 02 derivative =================
const smallPoly = (r, deg) => { const c = [r.nonzero(-4, 4)]; for (let i = 0; i < deg; i++) c.push(r.int(-6, 6)); return c; };
const hterm = (p) => `${p < 0 ? "-" : "+"}${Math.abs(p) === 1 ? "" : Math.abs(p)}h`;

def("ca1_diffLimitPoly",
  ["$f(x)={f}$ 일 때, ${lim}$ 의 값은? " + KF,
   ["분자는 $f$의 미분계수 정의 $\\lim\\frac{f(a+\\Delta)-f(a)}{\\Delta}$ 꼴로 바꿀 수 있어요.", "$f({a})$ 또는 $f'({a})$의 값을 먼저 구한 다음 식에 맞게 조합하세요."],
   "먼저 $f'(x)$를 구하면 $f'({a})={d1}$이고 $f({a})={d0}$입니다. 극한을 미분계수로 나타내어 계산하면 ${ansf}$입니다."],
  ["For $f(x)={f}$, what is ${lim}$? " + EF,
   ["Rewrite the limit with the definition $\\lim\\frac{f(a+\\Delta)-f(a)}{\\Delta}$ of the derivative.", "Compute $f({a})$ or $f'({a})$ first and combine them according to the expression."],
   "First $f'({a})={d1}$ and $f({a})={d0}$. Expressing the limit through the derivative gives ${ansf}$."],
  (r, lvl) => {
    const deg = r.int(2, 4), cs = smallPoly(r, deg), d = pd(cs);
    if (lvl === 1) {
      const a = r.int(-3, 3), p = r.int(1, 4), q = r.int(1, 4);
      const lim = `\\lim_{h\\to 0}\\frac{f(${a}${hterm(p)})-f(${a}${hterm(-q)})}{h}`;
      return { v: { f: P(cs), a, lim, kind: 1, p, q, d1: ev(d, a), d0: ev(cs, a), ansf: String((p + q) * ev(d, a)) }, ans: (p + q) * ev(d, a) };
    }
    const a = r.nonzero(-3, 3);
    if (lvl === 2) {
      const lim = `\\lim_{x\\to ${a}}\\frac{f(x)-f(${a})}{x^2-${a * a}}`;
      return { v: { f: P(cs), a, lim, kind: 2, p: 0, q: 0, d1: ev(d, a), d0: ev(cs, a), ansf: tfrac(ev(d, a), 2 * a) }, ans: ev(d, a) / (2 * a) };
    }
    const lim = `\\lim_{x\\to ${a}}\\frac{x f(${a})${a < 0 ? `+${-a === 1 ? "" : -a}` : `-${a === 1 ? "" : a}`}f(x)}{${xminus(a)}}`;
    return { v: { f: P(cs), a, lim, kind: 3, p: 0, q: 0, d1: ev(d, a), d0: ev(cs, a), ansf: String(ev(cs, a) - a * ev(d, a)) }, ans: ev(cs, a) - a * ev(d, a) };
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-01", "12미적Ⅰ-02-04"], strategy: "derivative-definition-forms", evidence: "calc" });

def("ca1_limDerivForm",
  ["미분가능한 함수 $f(x)$에 대하여 $f({a})={s}$, $f'({a})={t}$ 일 때, ${lim}$ 의 값은? " + KF,
   ["분자를 $f(x)-f({a})$ 꼴(또는 $f(a+h)-f(a)$ 꼴)이 나타나도록 더하고 빼서 바꿔 보세요.", "미분계수의 정의는 $\\lim_{x\\to {a}}\\frac{f(x)-f({a})}{x-{a}}=f'({a})$ 입니다."],
   "분자에서 $f(x)-f({a})$ 꼴을 만들어 미분계수의 정의를 적용하고 주어진 값을 이용하면 극한값은 ${ansf}$입니다."],
  ["For a differentiable function $f$ with $f({a})={s}$ and $f'({a})={t}$, what is ${lim}$? " + EF,
   ["Add and subtract terms so that $f(x)-f({a})$ (or $f(a+h)-f(a)$) appears in the numerator.", "Use the definition $\\lim_{x\\to {a}}\\frac{f(x)-f({a})}{x-{a}}=f'({a})$."],
   "Form $f(x)-f({a})$ in the numerator and apply the definition of the derivative with $f({a})={s}$, $f'({a})={t}$. The value is ${ansf}$."],
  (r, lvl) => {
    const a = r.nonzero(-3, 3), s = r.int(-5, 5), t = r.nonzero(-5, 5);
    let kind = 1;
    if (lvl === 2) kind = r.pick([2, 4]);
    if (lvl === 3) kind = r.pick([3, 5]);
    const xa = xminus(a);
    let lim, ans, p = 0, q = 0, rr = 1;
    if (kind === 1) { p = r.int(1, 4); q = r.int(1, 4); rr = r.pick([1, 2, 3, 4, 5]); lim = `\\lim_{h\\to 0}\\frac{f(${a}${hterm(p)})-f(${a}${hterm(-q)})}{${rr === 1 ? "" : rr}h}`; ans = ((p + q) * t) / rr; }
    else if (kind === 2) { lim = `\\lim_{x\\to ${a}}\\frac{${cf(a * a)}f(x)-x^2f(${a})}{${xa}}`; ans = a * a * t - 2 * a * s; }
    else if (kind === 3) { lim = `\\lim_{x\\to ${a}}\\frac{\\{f(x)\\}^2-${s * s}}{${xa}}`; ans = 2 * s * t; }
    else if (kind === 4) { lim = `\\lim_{x\\to ${a}}\\frac{xf(x)${tl(-a * s)}}{${xa}}`; ans = s + a * t; }
    else { lim = `\\lim_{h\\to 0}\\frac{\\{f(${a}+h)\\}^2-\\{f(${a}-h)\\}^2}{h}`; ans = 4 * s * t; }
    return { v: { a, s, t, lim, kind, p, q, rr, ansf: tfrac(Math.round(ans * rr), kind === 1 ? rr : 1) }, ans };
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-01"], strategy: "abstract-derivative-limit", evidence: "concept" });

def("ca1_limCoefPoly",
  ["함수 $f(x)={f}$ ($a$, $b$는 상수)에 대하여 ${lim}={L}$ 일 때, $f(1)$의 값은? " + KI,
   ["극한값이 존재하고 분모가 $0$이 되므로 분자도 $x={c}$에서 $0$이 되어야 해요.", "그러면 이 극한값이 곧 $f'({c})$이므로, $a$, $b$에 대한 연립방정식을 세우세요."],
   "분자가 $x={c}$에서 $0$이어야 하므로 $f({c})$의 값이 정해지고, 극한값이 곧 $f'({c})$입니다. 두 식을 연립하면 $a={av}$, $b={bv}$이므로 $f(1)={ans}$입니다."],
  ["The function $f(x)={f}$ ($a$, $b$ constants) satisfies ${lim}={L}$. What is $f(1)$? " + EI,
   ["The limit exists with a vanishing denominator, so the numerator is $0$ at $x={c}$.", "Then the limit equals $f'({c})$; set up simultaneous equations in $a$ and $b$."],
   "The numerator vanishes at $x={c}$, which fixes $f({c})$, and the limit equals $f'({c})$. Solving the two equations gives $a={av}$, $b={bv}$, so $f(1)={ans}$."],
  (r, lvl) => {
    if (lvl === 3) {
      const c = r.nonzero(-3, 3), a = r.nonzero(-3, 3), Lv = r.int(-6, 6), b = 2 * c * Lv - 3 * a * c * c, m0 = a * c ** 3 + b * c;
      return { v: { lim: `\\lim_{x\\to ${c}}\\frac{f(x)${tl(-m0)}}{x^2-${c * c}}`, L: Lv, c, av: a, bv: b, f: "ax^3+bx", m0 }, ans: a + b };
    }
    const c = r.nonzero(-3, 3), a = r.int(-4, 4), b0 = r.int(-6, 6);
    if (lvl === 1) {
      const b = -c * c - a * c, Lv = 3 * c * c + 2 * a * c + b;
      return { v: { lim: `\\lim_{x\\to ${c}}\\frac{f(x)}{${xminus(c)}}`, L: Lv, c, av: a, bv: b, f: "x^3+ax^2+bx", m0: 0 }, ans: 1 + a + b };
    }
    const b = b0, m0 = c ** 3 + a * c * c + b * c, Lv = 3 * c * c + 2 * a * c + b;
    return { v: { lim: `\\lim_{x\\to ${c}}\\frac{f(x)${tl(-m0)}}{${xminus(c)}}`, L: Lv, c, av: a, bv: b, f: "x^3+ax^2+bx", m0 }, ans: 1 + a + b };
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 12, d: 3, standards: ["12미적Ⅰ-02-01", "12미적Ⅰ-02-04"], strategy: "limit-condition-to-system", evidence: "reverse" });

def("ca1_powerFindN",
  ["자연수 $n$에 대하여 $f(x)={f}$ 이다. $f'({a})={V}$ 일 때 $n$의 값은? " + KI,
   ["$x^n$의 도함수는 $nx^{n-1}$이에요.", "$f'(x)$를 $n$에 대한 식으로 나타낸 뒤, $n$이 커질수록 값이 어떻게 변하는지 생각해 보세요."],
   "$f'(x)={cc}\\cdot n\\cdot x^{n-1}-{kk}$이므로 $f'({a})={cc}\\cdot n\\cdot{a}^{n-1}-{kk}$입니다. 이 값은 $n$이 커질수록 커지므로 값이 ${V}$인 자연수 $n$은 하나뿐이고 $n={ans}$입니다."],
  ["For a positive integer $n$, $f(x)={f}$. If $f'({a})={V}$, what is $n$? " + EI,
   ["The derivative of $x^n$ is $nx^{n-1}$.", "Write $f'(x)$ in terms of $n$ and think about how it changes as $n$ grows."],
   "$f'(x)={cc}\\cdot n\\cdot x^{n-1}-{kk}$, so $f'({a})={cc}\\cdot n\\cdot{a}^{n-1}-{kk}$, which increases with $n$. Exactly one positive integer gives ${V}$: $n={ans}$."],
  (r, lvl) => {
    const a = r.pick(lvl === 1 ? [2, 3] : [2, 3, 4]), C_ = lvl === 1 ? 1 : r.int(2, 4), k_ = r.int(1, 9), n = r.int(2, lvl === 1 ? 6 : 7);
    const V = C_ * n * a ** (n - 1) - k_;
    return { v: { f: `${cf(C_)}x^n-${k_ === 1 ? "" : k_}x`, a, V, cc: C_, kk: k_ }, ans: n };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-03"], strategy: "unknown-exponent-from-derivative", evidence: "reverse" });

def("ca1_prodAbstract",
  ["미분가능한 두 함수 $f(x)$, $g(x)$에 대하여 $f({a})={s}$, $f'({a})={t}$, $g({a})={u}$, $g'({a})={w}$ 이다. $h(x)={hx}$ 일 때 $h'({a})$의 값은? " + KI,
   ["곱의 미분법은 $\\{f(x)g(x)\\}'=f'(x)g(x)+f(x)g'(x)$ 입니다.", "곱이 셋 이상이면 한 번에 하나씩 미분한 항들을 더해요."],
   "곱의 미분법으로 $h'(x)$를 구하고 $x={a}$ 일 때의 값을 주어진 함숫값과 미분계수로 계산하면 $h'({a})={ans}$입니다."],
  ["For differentiable functions $f$, $g$ with $f({a})={s}$, $f'({a})={t}$, $g({a})={u}$, $g'({a})={w}$, let $h(x)={hx}$. What is $h'({a})$? " + EI,
   ["Use the product rule $\\{f(x)g(x)\\}'=f'(x)g(x)+f(x)g'(x)$.", "For more than two factors, differentiate one factor at a time and add the terms."],
   "Differentiate $h$ with the product rule and substitute $x={a}$ with the given values: $h'({a})={ans}$."],
  (r, lvl) => {
    const a = r.int(-3, 3), s = r.int(-4, 4), t = r.int(-5, 5), u = r.int(-4, 4), w = r.int(-5, 5);
    const kind = lvl === 1 ? 1 : lvl === 2 ? r.pick([2, 3]) : r.pick([4, 5]);
    let hx, ans;
    if (kind === 1) { hx = "f(x)g(x)"; ans = t * u + s * w; }
    else if (kind === 2) { hx = "\\{f(x)\\}^2g(x)"; ans = 2 * s * t * u + s * s * w; }
    else if (kind === 3) { hx = "xf(x)g(x)"; ans = s * u + a * (t * u + s * w); }
    else if (kind === 4) { hx = "\\{f(x)+g(x)\\}\\{f(x)-g(x)\\}"; ans = (t + w) * (s - u) + (s + u) * (t - w); }
    else { hx = "(x^2+1)f(x)g(x)"; ans = 2 * a * s * u + (a * a + 1) * (t * u + s * w); }
    return { v: { a, s, t, u, w, hx, kind }, ans };
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-04"], strategy: "product-rule-values", evidence: "calc" });

def("ca1_limExistence",
  ["함수 ${pw}$ 에 대하여 $\\lim_{x\\to {c}}f(x)$ 의 값이 존재할 때, 상수 $a$의 값은? " + KI,
   ["극한값이 존재하려면 $x\\to {c}$일 때의 좌극한과 우극한이 같아야 해요.", "$x<{c}$일 때의 식과 $x>{c}$일 때의 식에 각각 $x={c}$ 근처의 값을 넣어 두 극한을 $a$로 나타내세요."],
   "좌극한은 $x<{c}$의 식의 $x\\to {c}$일 때의 값, 우극한은 $x>{c}$의 식의 값입니다. 두 값이 같아야 하므로 $a={ans}$입니다."],
  ["For the function ${pw}$, the limit $\\lim_{x\\to {c}}f(x)$ exists. What is the constant $a$? " + EI,
   ["For the limit to exist, the left limit and the right limit at $x\\to {c}$ must be equal.", "Express both one-sided limits in terms of $a$ using the expression for $x<{c}$ and the one for $x>{c}$."],
   "The left limit comes from the expression for $x<{c}$ and the right limit from the one for $x>{c}$. They must be equal, which gives $a={ans}$."],
  (r, lvl) => {
    const c = r.nonzero(-3, 3), a = r.nonzero(-4, 4), d = r.int(-6, 6), e = r.nonzero(-3, 3);
    if (lvl === 1) {
      const g = c * c + a * c + d - e * c;
      return { v: { pw: cases([[`x^2+ax${tl(d)}`, `x<${c}`], [`${cf(e)}x${tl(g)}`, `x>${c}`]]), c, lf: `x^2+ax${tl(d)}`, rt: `${cf(e)}x${tl(g)}` }, ans: a };
    }
    const g = a * c * c + d - e * c, f0 = r.int(-9, 9);
    return { v: { pw: cases([[`ax^2${tl(d)}`, `x<${c}`], [String(f0), `x=${c}`], [`${cf(e)}x${tl(g)}`, `x>${c}`]]), c, lf: `ax^2${tl(d)}`, rt: `${cf(e)}x${tl(g)}` }, ans: a };
  },
  { skill: "m.h2.lim", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-01-01", "12미적Ⅰ-01-02"], strategy: "limit-existence-one-sided-parameter", evidence: "reverse" });

def("ca1_diffParam",
  ["함수 ${pw}$ 가 $x={c}$에서 미분가능할 때, 상수 $a$, $b$에 대하여 $a+b$의 값은? " + KI,
   ["미분가능하면 $x={c}$에서 연속이고, 왼쪽 도함수와 오른쪽 도함수가 같아요.", "두 식의 $x={c}$에서의 함숫값이 같다는 식과 도함수값이 같다는 식, 모두 두 개의 방정식을 세우세요."],
   "$x={c}$에서 연속이므로 두 식의 값이 같고, 미분가능하므로 두 식의 도함수의 값도 같습니다. 두 방정식을 풀면 $a={av}$, $b={bv}$이므로 $a+b={ans}$입니다."],
  ["The function ${pw}$ is differentiable at $x={c}$. What is $a+b$ for the constants $a$ and $b$? " + EI,
   ["Differentiable at $x={c}$ means continuous there with equal left and right derivatives.", "Write two equations: equal function values and equal derivative values at $x={c}$."],
   "Continuity makes the two function values equal, and differentiability makes the two derivative values equal at $x={c}$. Solving gives $a={av}$, $b={bv}$, so $a+b={ans}$."],
  (r, lvl) => {
    const c = r.nonzero(-3, 3);
    let g1, g2, a, b;
    if (lvl === 1) {
      a = r.nonzero(-3, 3); b = r.int(-6, 6);
      const p = 2 * a * c + b, q = -a * c * c;
      g1 = "ax^2+bx"; g2 = P([p, q]);
    } else if (lvl === 2) {
      b = r.nonzero(-3, 3); a = 2 * b * c - 3 * c * c;
      const d = c ** 3 + a * c - b * c * c;
      g1 = "x^3+ax"; g2 = `bx^2${tl(d)}`;
    } else {
      a = r.nonzero(-3, 3); b = r.int(-6, 6);
      const p = r.nonzero(-3, 3), q = 2 * a * c + b - 2 * p * c, rr = a * c * c + b * c - p * c * c - q * c;
      g1 = "ax^2+bx"; g2 = P([p, q, rr]);
    }
    const cond1 = lvl === 2 ? `x<${c}` : `x\\le ${c}`, cond2 = lvl === 2 ? `x\\ge ${c}` : `x>${c}`;
    return { v: { pw: cases([[g1, cond1], [g2, cond2]]), c, g1, g2, av: a, bv: b }, ans: a + b };
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-02", "12미적Ⅰ-02-04"], strategy: "differentiable-gluing", evidence: "reverse" });

def("ca1_absNotDiff",
  ["함수 $f(x)={fx}$ 가 $x=k$에서 미분가능하지 않은 실수 $k$는 모두 몇 개인가요? " + KI,
   ["$|g(x)|$는 $g(x)$의 부호가 바뀌는 점에서 꺾여요. 근에서 부호가 바뀌는지(중근인지) 살펴보세요.", "각 근의 중복도가 홀수이면 그 점에서 미분가능하지 않고, 짝수이면 미분가능해요."],
   "절댓값 안의 식의 근 중 중복도가 홀수인 근에서는 부호가 바뀌어 좌우 미분계수가 달라지므로 미분가능하지 않고, 중복도가 짝수인 근에서는 미분가능합니다. 이런 점을 세면 ${ans}$개입니다."],
  ["For how many real numbers $k$ is $f(x)={fx}$ not differentiable at $x=k$? " + EI,
   ["$|g(x)|$ has a corner where $g(x)$ changes sign; check whether each root is a repeated root.", "A root of odd multiplicity gives a corner; a root of even multiplicity does not."],
   "At a root of odd multiplicity of the expression inside $|\\ |$ the sign changes and the one-sided derivatives differ, so $f$ is not differentiable; at roots of even multiplicity it is. Counting these points gives ${ans}$."],
  (r, lvl) => {
    const mk = () => {
      for (;;) {
        const nr = r.int(2, 3), roots = [];
        while (roots.length < nr) { const z = r.int(-4, 4); if (!roots.includes(z)) roots.push(z); }
        const ex = roots.map(() => r.int(1, 2));
        if (ex.reduce((s, e) => s + e, 0) > 4 || !ex.some((e) => e === 1)) continue;
        return { roots, ex };
      }
    };
    const str = (o, K) => `${K === 1 ? "" : K === -1 ? "-" : K}${o.roots.map((z, i) => fac(z) + (o.ex[i] === 2 ? "^2" : "")).join("")}`;
    const expand = (o, K) => o.roots.reduce((p, z, i) => { let q = p; for (let e = 0; e < o.ex[i]; e++) q = pmul(q, [1, -z]); return q; }, [K]);
    const odd = (o) => o.roots.filter((z, i) => o.ex[i] === 1);
    if (lvl === 1) { const o = mk(), K = r.pick([1, -1, 2, -2, 3]); return { v: { fx: `|${str(o, K)}|`, p1: str(o, K), p2: "0" }, ans: odd(o).length }; }
    if (lvl === 2) { const o = mk(), K = r.pick([1, -1, 2, -2]); return { v: { fx: `|${P(expand(o, K))}|`, p1: P(expand(o, K)), p2: "0" }, ans: odd(o).length }; }
    const o1 = mk(), o2 = mk();
    const u = new Set([...odd(o1), ...odd(o2)]);
    return { v: { fx: `|${str(o1, 1)}|+|${str(o2, 1)}|`, p1: str(o1, 1), p2: str(o2, 1) }, ans: u.size };
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-02"], strategy: "abs-value-nondifferentiable-points", evidence: "counting" });

def("ca1_tangentIntercept",
  ["곡선 $y={f}$ 위의 $x$좌표가 ${a}$인 점에서의 접선이 $y$축과 만나는 점의 $y$좌표는? " + KI,
   ["접선의 기울기는 접점에서의 미분계수 $f'({a})$입니다.", "접선의 방정식 $y-f({a})=f'({a})\\{x-({a})\\}$ 에서 $x=0$일 때의 $y$ 값을 구하세요."],
   "$f'({a})={d1}$, $f({a})={d0}$이므로 접선은 $y-({d0})=({d1})\\{x-({a})\\}$입니다. $x=0$일 때 $y={ans}$입니다."],
  ["The tangent to the curve $y={f}$ at the point with $x$-coordinate ${a}$ meets the $y$-axis at which $y$-coordinate? " + EI,
   ["The slope of the tangent is the derivative $f'({a})$.", "Write the line through $({a}, f({a}))$ with slope $f'({a})$ and put $x=0$."],
   "$f'({a})={d1}$ and $f({a})={d0}$, so the tangent is $y-({d0})=({d1})\\{x-({a})\\}$. At $x=0$ we get $y={ans}$."],
  (r, lvl) => {
    const cs = lvl === 1 ? [r.nonzero(-3, 3), r.int(-6, 6), r.int(-8, 8)] : [r.nonzero(-2, 3), r.int(-4, 4), r.int(-6, 6), r.int(-8, 8)];
    const a = r.int(-3, 3), d = pd(cs);
    return { v: { f: P(cs), a, d1: ev(d, a), d0: ev(cs, a) }, ans: ev(cs, a) - a * ev(d, a) };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 2, standards: ["12미적Ⅰ-02-05"], strategy: "tangent-intercept", evidence: "calc" });

def("ca1_tangentSlopeTwo",
  ["곡선 $y={f}$ 에 접하고 기울기가 ${m}$인 직선은 두 개 있다. 이 두 직선의 $y$절편의 합은? " + KI,
   ["기울기가 ${m}$이면 접점의 $x$좌표는 $f'(x)={m}$의 해예요.", "각 접점 $(s, f(s))$에서 $y$절편은 $f(s)-s\\cdot{m}$ 입니다."],
   "방정식 $f'(x)={m}$ 의 해를 구하면 접점의 $x$좌표가 ${s1}$, ${s2}$입니다. 각 접선의 $y$절편을 구해 더하면 ${ans}$입니다."],
  ["Exactly two lines of slope ${m}$ are tangent to the curve $y={f}$. What is the sum of their $y$-intercepts? " + EI,
   ["A tangent of slope ${m}$ touches where $f'(x)={m}$.", "At a point of tangency $(s, f(s))$ the $y$-intercept is $f(s)-s\\cdot{m}$."],
   "Solving $f'(x)={m}$ gives the points of tangency $x={s1}$ and $x={s2}$. Adding the two $y$-intercepts gives ${ans}$."],
  (r, lvl) => {
    for (;;) {
      const K = lvl === 1 ? 1 : r.pick([1, 2, 3]);
      const s1 = r.int(-3, 2), s2 = s1 + r.int(1, 4), m = r.int(-6, 8), d = r.int(-6, 6);
      if ((3 * K * (s1 + s2)) % 2 !== 0) continue;
      const cs = [K, (-3 * K * (s1 + s2)) / 2, m + 3 * K * s1 * s2, d];
      return { v: { f: P(cs), m, s1, s2 }, ans: ev(cs, s1) - s1 * m + ev(cs, s2) - s2 * m };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-05"], strategy: "tangents-with-given-slope", evidence: "counting" });

def("ca1_tangentFromPoint",
  ["점 $({p},{q})$에서 곡선 $y={f}$ 에 그은 두 접선의 기울기의 곱은? " + KI,
   ["접점의 $x$좌표를 $t$라 하면 접선은 $y=f'(t)(x-t)+f(t)$이고, 이 직선은 $x={p}$일 때 $y={q}$여야 해요.", "이 조건에서 $t$에 대한 이차방정식을 얻어 두 근을 구한 뒤 기울기 $f'(t)$를 계산하세요."],
   "접점의 $x$좌표를 $t$라 하면 접선이 $x={p}$일 때 $y={q}$인 조건에서 이차방정식을 얻고 근은 $t={t1}, {t2}$입니다. 기울기는 각각 $f'({t1})$, $f'({t2})$이고 그 곱은 ${ans}$입니다."],
  ["Two tangents are drawn from the point $({p},{q})$ to the curve $y={f}$. What is the product of their slopes? " + EI,
   ["Let the point of tangency have $x$-coordinate $t$; the tangent $y=f'(t)(x-t)+f(t)$ must pass through $({p},{q})$.", "This gives a quadratic in $t$; find both roots and compute the slopes $f'(t)$."],
   "The condition that the tangent at $x=t$ passes through $({p},{q})$ gives a quadratic with roots $t={t1}, {t2}$. The slopes are $f'({t1})$ and $f'({t2})$ and their product is ${ans}$."],
  (r, lvl) => {
    for (;;) {
      const t1 = r.int(-4, 2), t2 = t1 + r.int(1, 5);
      if ((t1 + t2) % 2 !== 0) continue;
      const m = lvl === 1 ? 1 : r.pick([1, 2, -1, -2]), bb = r.int(-5, 5), c0 = r.int(-6, 6), p = (t1 + t2) / 2;
      const q = m * t1 * t2 + bb * p + c0;
      return { v: { f: P([m, bb, c0]), p, q, t1, t2 }, ans: (2 * m * t1 + bb) * (2 * m * t2 + bb) };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 4, standards: ["12미적Ⅰ-02-05"], strategy: "tangents-from-external-point", evidence: "reverse" });

def("ca1_tangentIntersect",
  ["곡선 $y={f}$ 위의 $x$좌표가 ${a}$인 점에서의 접선이 이 곡선과 접점이 아닌 점에서 한 번 더 만난다. 그 점의 $y$좌표는? " + KI,
   ["접선과 곡선의 교점의 $x$좌표는 (곡선의 식)−(접선의 식)$=0$의 근이고, 이 방정식은 $x={a}$ 에서 중근을 가져요.", "삼차방정식의 세 근의 합은 $x^2$의 계수로 알 수 있으니, 나머지 한 근을 구한 뒤 곡선의 식에 대입하세요."],
   "(곡선)−(접선)$=0$은 $x={a}$ 에서 중근을 가지는 삼차방정식이고, 세 근의 합은 근과 계수의 관계로 정해집니다. 나머지 근은 $x={s}$이고, 곡선의 식에 대입하면 $y$좌표는 ${ans}$입니다."],
  ["The tangent to the curve $y={f}$ at the point with $x$-coordinate ${a}$ meets the curve again at one other point. What is the $y$-coordinate of that point? " + EI,
   ["The intersections are the roots of (curve)−(tangent)$=0$, and $x={a}$ is a double root.", "The sum of the three roots follows from the $x^2$ coefficient; find the third root and substitute it into the curve."],
   "(curve)−(tangent)$=0$ is a cubic with the double root $x={a}$, and the sum of its roots comes from Vieta's formulas. The other root is $x={s}$, and substituting into the curve gives the $y$-coordinate ${ans}$."],
  (r, lvl) => {
    for (;;) {
      const K = r.pick(lvl === 1 ? [1] : [1, 2, -1, 3]), p1 = K * r.int(-4, 4), q = r.int(-6, 6), d = r.int(-8, 8), a = r.int(-3, 3);
      const s = -p1 / K - 2 * a;
      if (s === a) continue;
      const cs = [K, p1, q, d];
      return { v: { f: P(cs), a, s }, ans: ev(cs, s) };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 4, standards: ["12미적Ⅰ-02-05"], strategy: "tangent-second-intersection", evidence: "concept" });

const MVT = [];
for (const K of [1, 2, 3]) for (let p = -6; p <= 6; p++) for (let a = -4; a <= 3; a++) for (let b = a + 2; b <= 4; b++) for (let c = a + 1; c < b; c++) {
  if (3 * K * c * c + 2 * p * c !== K * (a * a + a * b + b * b) + p * (a + b)) continue;
  const c2 = -(2 * p) / (3 * K) - c;
  if (c2 > a && c2 < b) continue;
  MVT.push([K, p, a, b, c]);
}
def("ca1_mvtC",
  ["함수 $f(x)={f}$ 에 대하여 구간 $[{a},{b}]$에서 평균값 정리를 만족시키는 실수 $c$ ($c$는 ${a}$보다 크고 ${b}$보다 작다)의 값은? " + KI,
   ["평균값 정리의 $c$는 $\\frac{f({b})-f({a})}{{b}-({a})}=f'(c)$를 만족시켜요.", "평균변화율을 먼저 구한 뒤, $f'(c)=($평균변화율$)$ 의 해 중 열린구간 안에 있는 것을 고르세요."],
   "평균변화율은 $\\frac{f({b})-f({a})}{{b}-({a})}={sl}$이고, $f'(c)={sl}$의 해는 구간 $({a},{b})$ 안에서 $c={ans}$ 하나뿐입니다."],
  ["For $f(x)={f}$ on the interval $[{a},{b}]$, find the number $c$ with ${a}<c<{b}$ given by the Mean Value Theorem. " + EI,
   ["The MVT number satisfies $\\frac{f({b})-f({a})}{{b}-({a})}=f'(c)$.", "Compute the average rate of change, then solve $f'(c)=$ that value and keep the root inside the open interval."],
   "The average rate of change is $\\frac{f({b})-f({a})}{{b}-({a})}={sl}$, and $f'(c)={sl}$ has exactly one root in $({a},{b})$: $c={ans}$."],
  (r) => {
    const [K, p, a, b, c] = r.pick(MVT), q = r.int(-6, 6);
    const cs = [K, p, q, 0];
    return { v: { f: P(cs), a, b, sl: (ev(cs, b) - ev(cs, a)) / (b - a) }, ans: c };
  },
  { skill: "m.h2.der", levels: [1], count: 40, d: 3, standards: ["12미적Ⅰ-02-06"], strategy: "mvt-solve-c", evidence: "calc" });

def("ca1_mvtBound",
  ["미분가능한 함수 $f(x)$가 모든 실수 $x$에 대하여 ${lo}\\le f'(x)\\le {hi}$ 를 만족시키고 ${cond}$ 이다. $f({b})$의 최댓값은? " + KI,
   ["평균값 정리에 의해 $f(b)-f(a)=f'(c)(b-a)$인 $c$가 있어요. $f'(c)$의 최댓값을 이용하세요.", "알고 있는 점이 둘이면 구하려는 점에 더 가까운 점을 기준으로 생각하세요."],
   "평균값 정리에 의해 구하려는 점과 가장 가까운 알려진 점 사이에서 $f$의 증가량은 (알려진 점과의 간격을 $d$라 하면) $f'(c)\\times d\\le {hi}\\times d$입니다. 기울기 ${hi}$인 직선으로 이 값을 실제로 얻을 수 있으므로 최댓값은 ${ans}$입니다."],
  ["A differentiable function $f$ satisfies ${lo}\\le f'(x)\\le {hi}$ for all real $x$ and ${cond}$. What is the maximum possible value of $f({b})$? " + EI,
   ["By the MVT, $f(b)-f(a)=f'(c)(b-a)$ for some $c$; use the largest possible $f'(c)$.", "If two values are known, base the estimate on the known point closer to $b$."],
   "By the MVT the increase from the nearest known point to $x={b}$ is (with $d$ the gap between the points) $f'(c)\\times d\\le {hi}\\times d$, and a line of slope ${hi}$ attains it, so the maximum is ${ans}$."],
  (r, lvl) => {
    const lo = r.int(-4, 1), hi = lo + r.int(2, 6), b = r.int(3, 7), m0 = r.int(-9, 9);
    if (lvl === 1) return { v: { lo, hi, cond: `f(0)=${m0}`, b, m0, a2: 0, m1: m0 }, ans: m0 + hi * b };
    const a2 = r.int(1, b - 1), m1 = m0 + r.int(lo * a2 + 1, hi * a2 - 1);
    return { v: { lo, hi, cond: `f(0)=${m0},\\ f(${a2})=${m1}`, b, m0, a2, m1 }, ans: m1 + hi * (b - a2) };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-06"], strategy: "mvt-derivative-bound", evidence: "concept" });

def("ca1_powerTangentN",
  ["곡선 $y={fx}$ ($n$은 $2$ 이상의 자연수) 위의 $x$좌표가 ${a}$인 점에서의 접선의 $y$절편이 ${V}$일 때, $n$의 값은? " + KI,
   ["$x^n$의 도함수는 $nx^{n-1}$이므로 접선의 기울기는 $n$에 대한 식으로 나타나요.", "접선의 $y$절편을 $n$에 대한 식으로 나타내면 $n$이 커질수록 절댓값이 커져요."],
   "$f(x)={fx}$에서 $f'(x)={cc}nx^{n-1}$이므로 접선의 $y$절편은 $f({a})-{a}f'({a})=(1-n)\\cdot{ccp}\\cdot{a}^n$입니다. 이 값의 절댓값은 $n$이 커질수록 커지므로 값이 ${V}$인 $n$은 하나뿐이고 $n={ans}$입니다."],
  ["The tangent to the curve $y={fx}$ ($n$ an integer at least $2$) at the point with $x$-coordinate ${a}$ has $y$-intercept ${V}$. What is $n$? " + EI,
   ["The derivative of $x^n$ is $nx^{n-1}$, so the slope of the tangent depends on $n$.", "Write the $y$-intercept in terms of $n$; its absolute value grows with $n$."],
   "For $f(x)={fx}$, $f'(x)={cc}nx^{n-1}$, so the $y$-intercept is $f({a})-{a}f'({a})=(1-n)\\cdot{ccp}\\cdot{a}^n$. Its absolute value increases with $n$, so exactly one $n$ gives ${V}$: $n={ans}$."],
  (r, lvl) => {
    const a = r.pick(lvl === 1 ? [2, 3] : [2, 3, 4]), C_ = lvl === 1 ? 1 : r.pick([2, 3, -1, -2]), n = r.int(2, lvl === 1 ? 6 : 5);
    return { v: { fx: `${cf(C_)}x^n`, a, V: (1 - n) * C_ * a ** n, cc: C_, ccp: C_ < 0 ? `(${C_})` : `${C_}` }, ans: n };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 4, standards: ["12미적Ⅰ-02-03", "12미적Ⅰ-02-05"], strategy: "power-rule-unknown-exponent-tangent", evidence: "reverse" });

// ================= 02 monotonicity, extrema, equations, optimisation =================
def("ca1_monoGiven",
  ["삼차함수 $f(x)={f}$ ($a$, $b$는 상수)가 닫힌구간 $[{m},{n}]$에서 감소하고, 두 구간 $(-\\infty,{m}]$, $[{n},\\infty)$에서 각각 증가할 때, $a+b$의 값은? " + KI,
   ["$f$가 증가에서 감소로, 감소에서 증가로 바뀌는 점 $x={m}$, $x={n}$에서 $f'(x)=0$이에요.", "$f'(x)$는 근이 $x={m}$, $x={n}$ 인 이차식이므로 $f'(x)=($이차항의 계수$)\\times{fm}{fn}$ 꼴로 쓸 수 있어요."],
   "증가·감소가 바뀌는 $x={m}$, $x={n}$에서 $f'(x)=0$이므로 $f'(x)={d3}{fm}{fn}$입니다. 계수를 비교하면 $a={av}$, $b={bv}$이고 $a+b={ans}$입니다."],
  ["The cubic $f(x)={f}$ ($a$, $b$ constants) is decreasing on $[{m},{n}]$ and increasing on $(-\\infty,{m}]$ and on $[{n},\\infty)$. What is $a+b$? " + EI,
   ["$f'(x)=0$ at $x={m}$ and $x={n}$, where the monotonicity changes.", "So $f'(x)$ is a quadratic with roots ${m}$ and ${n}$: $f'(x)=(\\text{leading coefficient})\\times{fm}{fn}$."],
   "Monotonicity changes at $x={m}$ and $x={n}$, so $f'(x)={d3}{fm}{fn}$. Comparing coefficients gives $a={av}$, $b={bv}$, hence $a+b={ans}$."],
  (r, lvl) => {
    for (;;) {
      const K = lvl === 1 ? r.pick([2, 4, 6]) : r.pick([1, 3, 5]);
      const m = r.int(-4, 2), n = m + r.int(1, 5), c0 = r.int(-9, 9);
      const cs = cubicCrit(K, m, n, c0);
      if (!cs) continue;
      return { v: { f: `${cf(K)}x^3+ax^2+bx${tl(c0)}`, m, n, d3: 3 * K, fm: fac(m), fn: fac(n), av: cs[1], bv: cs[2] }, ans: cs[1] + cs[2] };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-07"], strategy: "monotone-interval-to-coefficients", evidence: "representation" });

def("ca1_noExtremum",
  ["삼차함수 $f(x)={f}$ 가 극값을 갖지 않도록 하는 정수 $a$의 개수는? " + KI,
   ["삼차함수가 극값을 갖지 않는다는 것은 $f'(x)$의 부호가 바뀌지 않는다는 뜻이에요.", "이차방정식 $f'(x)=0$의 판별식 $D\\le 0$을 $a$에 대한 부등식으로 쓰고 정수 해를 세세요."],
   "$f'(x)$가 부호를 바꾸지 않아야 하므로 $f'(x)=0$의 판별식 $D\\le 0$입니다. 이를 만족시키는 정수 $a$는 ${lo}\\le a\\le {hi}$ 이므로 ${ans}$개입니다."],
  ["How many integers $a$ make the cubic $f(x)={f}$ have no local extremum? " + EI,
   ["No extremum means $f'(x)$ does not change sign.", "Write the discriminant condition $D\\le 0$ for $f'(x)=0$ as an inequality in $a$ and count integer solutions."],
   "$f'(x)$ must not change sign, so the discriminant of $f'(x)=0$ satisfies $D\\le 0$. The integers are ${lo}\\le a\\le {hi}$, which is ${ans}$ values."],
  (r, lvl) => {
    const c0 = r.int(-9, 9);
    if (lvl === 1) {
      const b = r.int(1, 40), lim = Math.floor(Math.sqrt(3 * b) + 1e-9);
      return { v: { f: `x^3+ax^2+${b === 1 ? "" : b}x${tl(c0)}`, lo: -lim, hi: lim }, ans: 2 * lim + 1 };
    }
    const k = r.pick([-1, 1]) * r.int(1, 12);
    const lo = k > 0 ? 0 : 3 * k, hi = k > 0 ? 3 * k : 0;
    return { v: { f: `x^3+ax^2${tx(k, "ax")}${tl(c0)}`, lo, hi }, ans: hi - lo + 1 };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-07", "12미적Ⅰ-02-09"], strategy: "no-extremum-discriminant-count", evidence: "counting" });

def("ca1_extremaCoef",
  ["삼차함수 $f(x)={f}$ ($a$, $b$, $c$는 상수)가 $x={m}$에서 극대, $x={n}$에서 극소이고 $f({z})={w}$ 일 때, 극댓값과 극솟값의 합은? " + KI,
   ["극대·극소인 점에서 $f'(x)=0$이므로 $f'({m})=f'({n})=0$으로 $a$, $b$를 구할 수 있어요.", "$a$, $b$를 구한 뒤 조건 $f({z})={w}$ 에서 $c$를 정하세요. 마지막으로 극댓값 $f({m})$, 극솟값 $f({n})$ 을 각각 계산해 더하세요."],
   "$f'({m})=f'({n})=0$에서 $a={av}$, $b={bv}$이고, $f({z})={w}$에서 $c={cv}$입니다. 극댓값은 $f({m})={fm}$, 극솟값은 $f({n})={fn}$이므로 합은 ${ans}$입니다."],
  ["The cubic $f(x)={f}$ ($a$, $b$, $c$ constants) has a local maximum at $x={m}$ and a local minimum at $x={n}$, and $f({z})={w}$. What is the sum of the local maximum and the local minimum? " + EI,
   ["At the extrema $f'({m})=f'({n})=0$, which determines $a$ and $b$.", "Then use $f({z})={w}$ to find $c$, and compute the local maximum $f({m})$ and local minimum $f({n})$ and add them."],
   "$f'({m})=f'({n})=0$ gives $a={av}$, $b={bv}$, and $f({z})={w}$ gives $c={cv}$. The local maximum is $f({m})={fm}$, the local minimum is $f({n})={fn}$, and the sum is ${ans}$."],
  (r, lvl) => {
    for (;;) {
      const K = r.pick([1, 2, 3, 4]), m = r.int(-4, 2), n = m + r.int(1, 5), c0 = r.int(-9, 9);
      const cs = cubicCrit(K, m, n, c0);
      if (!cs) continue;
      const z = lvl === 1 ? m : lvl === 2 ? r.pick([0, n, m + 1, n + 1].filter((q) => q !== m)) : r.int(-3, 3);
      const fm = ev(cs, m), fn = ev(cs, n);
      return { v: { f: `${cf(K)}x^3+ax^2+bx+c`, m, n, z, w: ev(cs, z), av: cs[1], bv: cs[2], cv: c0, fm, fn }, ans: fm + fn };
    }
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-07"], strategy: "extremum-conditions-to-coefficients", evidence: "reverse" });

def("ca1_derivSignMin",
  ["다항함수 $f$에 대하여 ${given}$ 일 때, $f$가 극솟값을 갖는 모든 $x$의 값의 합은? " + KI,
   ["극값은 $f'(x)$의 부호가 바뀌는 점에서 생겨요. 중근(제곱 인수)에서는 부호가 바뀌지 않아요.", "각 근의 좌우에서 $f'(x)$의 부호를 조사하여 $-$에서 $+$로 바뀌는 점을 찾으세요."],
   "$f'(x)$의 부호가 $-$에서 $+$로 바뀌는 점이 극소인 점입니다. 부호표를 만들어 보면 그런 점은 $x$가 ${mins}$일 때이고, 합은 ${ans}$입니다."],
  ["For a polynomial function $f$, ${given}$. What is the sum of all values of $x$ at which $f$ has a local minimum? " + EI,
   ["Extrema occur where $f'(x)$ changes sign; squared factors (double roots) do not change the sign.", "Check the sign of $f'(x)$ on both sides of each root and find where it goes from $-$ to $+$."],
   "A local minimum occurs where $f'(x)$ changes from $-$ to $+$. The sign chart gives these points as $x$ equal to ${mins}$, with sum ${ans}$."],
  (r, lvl) => {
    for (;;) {
      if (lvl <= 2) {
        const nr = r.int(2, 3), roots = [];
        while (roots.length < nr) { const z = r.int(-4, 4); if (!roots.includes(z)) roots.push(z); }
        roots.sort((x, y) => x - y);
        const ex = roots.map(() => (lvl === 1 ? 1 : r.int(1, 2)));
        if (lvl === 2 && !ex.includes(2)) continue;
        if (ex.reduce((s, e) => s + e, 0) > 4) continue;
        const K = r.pick([1, -1, 2, -3]);
        const dcs = roots.reduce((p, z, i) => { let q = p; for (let e = 0; e < ex[i]; e++) q = pmul(q, [1, -z]); return q; }, [K]);
        const mins = roots.filter((z, i) => ex[i] % 2 === 1 && ev(dcs, z + 0.5) > 0 && ev(dcs, z - 0.5) < 0);
        if (!mins.length) continue;
        const g = `f'(x)=${cf(K)}${roots.map((z, i) => fac(z) + (ex[i] === 2 ? "^2" : "")).join("")}`;
        return { v: { given: g, mins: mins.join(", ") }, ans: mins.reduce((s, z) => s + z, 0) };
      }
      const rt = [r.int(-3, 1), 0, 0]; rt[1] = rt[0] + r.int(1, 3); rt[2] = rt[1] + r.int(1, 3);
      const k2 = r.pick([1, -1]), c0 = r.int(-9, 9);
      const e1 = rt[0] + rt[1] + rt[2], e2 = rt[0] * rt[1] + rt[1] * rt[2] + rt[0] * rt[2], e3 = rt[0] * rt[1] * rt[2];
      const cs = [3 * k2, -4 * k2 * e1, 6 * k2 * e2, -12 * k2 * e3, c0];
      const d = pd(cs);
      const mins = rt.filter((z) => ev(d, z + 0.25) > 0 && ev(d, z - 0.25) < 0);
      if (!mins.length) continue;
      return { v: { given: `f(x)=${P(cs)}`, mins: mins.join(", ") }, ans: mins.reduce((s, z) => s + z, 0) };
    }
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 3, standards: ["12미적Ⅰ-02-07", "12미적Ⅰ-02-08"], strategy: "sign-chart-of-derivative", evidence: "representation" });

const quartic = (m, n, p, k2, c0) => { const e1 = m + n + p, e2 = m * n + n * p + m * p, e3 = m * n * p; return [3 * k2, -4 * k2 * e1, 6 * k2 * e2, -12 * k2 * e3, c0]; };

def("ca1_rootCountK",
  ["함수 $f(x)={f}$ 에 대하여 방정식 $f(x)=k$ 의 서로 다른 실근의 개수가 정확히 ${nr}$개가 되도록 하는 정수 $k$의 개수는? " + KI,
   ["$y=f(x)$의 그래프와 수평선 $y=k$의 교점의 개수를 생각해 보세요.", "극댓값과 극솟값을 구해 $k$가 어느 범위에 있을 때 교점이 ${nr}$개인지 정하세요."],
   "$f'(x)=0$에서 극값을 구하면 ${ext}$입니다. 서로 다른 ${nr}$개의 실근을 가지려면 ${rng}$이어야 하므로 정수 $k$는 ${ans}$개입니다."],
  ["For $f(x)={f}$, how many integers $k$ make the equation $f(x)=k$ have exactly ${nr}$ distinct real roots? " + EI,
   ["Count the intersections of $y=f(x)$ with the horizontal line $y=k$.", "Find the local maximum and minimum values and decide for which $k$ there are ${nr}$ intersections."],
   "The extreme values from $f'(x)=0$ are ${ext}$. Exactly ${nr}$ distinct roots occur when ${rng}$, so there are ${ans}$ integers $k$."],
  (r, lvl) => {
    for (;;) {
      if (lvl <= 2) {
        const K = lvl === 1 ? r.pick([1, 2]) : r.pick([1, 2, 3, -1, -2]);
        const m = r.int(-4, 2), n = m + r.int(1, 4), c0 = r.int(-9, 9);
        const cs = cubicCrit(K, m, n, c0);
        if (!cs) continue;
        const A = ev(cs, m), B = ev(cs, n), lo = Math.min(A, B), hi = Math.max(A, B);
        if (hi - lo < 3) continue;
        return { v: { f: P(cs), nr: 3, ext: `${A},\\ ${B}`, rng: `${lo}<k<${hi}` }, ans: hi - lo - 1 };
      }
      const rt = [r.int(-3, 1), 0, 0]; rt[1] = rt[0] + r.int(1, 3); rt[2] = rt[1] + r.int(1, 3);
      const cs = quartic(rt[0], rt[1], rt[2], 1, r.int(-9, 9));
      const f0 = ev(cs, rt[0]), f1 = ev(cs, rt[1]), f2 = ev(cs, rt[2]);
      const lo = Math.max(f0, f2);
      if (f1 - lo < 3) continue;
      return { v: { f: P(cs), nr: 4, ext: `${f0},\\ ${f1},\\ ${f2}`, rng: `${lo}<k<${f1}` }, ans: f1 - lo - 1 };
    }
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 14, d: 4, standards: ["12미적Ⅰ-02-09", "12미적Ⅰ-02-08"], strategy: "equation-roots-by-extrema", evidence: "counting" });

def("ca1_twoRootsK",
  ["함수 $f(x)={f}$ 에 대하여 방정식 $f(x)=k$ 의 서로 다른 실근의 개수가 정확히 ${nr}$개가 되도록 하는 모든 실수 $k$의 값의 합은? " + KI,
   ["서로 다른 실근의 개수가 달라지는 경계, 즉 수평선 $y=k$가 극값에서 그래프에 접할 때를 생각해 보세요.", "접하는 경우에 해당하는 극값 중 어느 것이 근이 정확히 ${nr}$개가 되는 경우인지 그래프의 모양으로 판단하세요."],
   "극값은 ${ext}$입니다. 수평선이 극값에서 그래프에 접할 때와 그렇지 않을 때의 교점 수를 따져 보면 조건에 맞는 $k$는 ${kk}$이고, 그 합은 ${ans}$입니다."],
  ["For $f(x)={f}$, what is the sum of all real numbers $k$ for which $f(x)=k$ has exactly ${nr}$ distinct real roots? " + EI,
   ["The number of distinct roots changes when the horizontal line $y=k$ touches the graph at an extremum.", "Use the shape of the graph to decide which touching cases give exactly ${nr}$ roots."],
   "The extreme values are ${ext}$. Comparing the number of intersections at and around each extreme value, the valid $k$ are ${kk}$, and their sum is ${ans}$."],
  (r, lvl) => {
    for (;;) {
      if (lvl <= 2) {
        const K = lvl === 1 ? r.pick([1, 2]) : r.pick([1, 2, 3, -1, -2]);
        const m = r.int(-4, 2), n = m + r.int(1, 4), c0 = r.int(-9, 9);
        const cs = cubicCrit(K, m, n, c0);
        if (!cs) continue;
        const A = ev(cs, m), B = ev(cs, n);
        return { v: { f: P(cs), nr: 2, ext: `${A},\\ ${B}`, kk: `${A},\\ ${B}` }, ans: A + B };
      }
      const rt = [r.int(-3, 1), 0, 0]; rt[1] = rt[0] + r.int(1, 3); rt[2] = rt[1] + r.int(1, 3);
      const cs = quartic(rt[0], rt[1], rt[2], r.pick([1, 1, -1]), r.int(-9, 9));
      const f0 = ev(cs, rt[0]), f1 = ev(cs, rt[1]), f2 = ev(cs, rt[2]);
      if (f0 === f2) continue;
      const sh = cs[0] > 0 ? Math.max(f0, f2) : Math.min(f0, f2);
      return { v: { f: P(cs), nr: 3, ext: `${f0},\\ ${f1},\\ ${f2}`, kk: `${sh},\\ ${f1}` }, ans: sh + f1 };
    }
  },
  { skill: "m.h2.der", levels: [1, 2, 3], count: 12, d: 4, standards: ["12미적Ⅰ-02-09", "12미적Ⅰ-02-08"], strategy: "tangent-horizontal-line-count-boundary", evidence: "counting" });

def("ca1_ineqParam",
  ["함수 $f(x)={f}$ 에 대하여 구간 ${dom}$ 에서 부등식 $f(x)+a\\ge 0$ 이 항상 성립하도록 하는 실수 $a$의 최솟값은? " + KI,
   ["$f(x)+a\\ge0$이 항상 성립하려면 이 구간에서 $f(x)$의 최솟값이 $-a$ 이상이어야 해요.", "구간에서 $f(x)$의 최솟값을 극값과 구간 끝의 함숫값을 비교하여 구하세요."],
   "이 구간에서 $f(x)$의 최솟값은 ${mn}$입니다. $f(x)+a\\ge0$이 항상 성립하려면 $a\\ge {mn2}$이므로 $a$의 최솟값은 ${ans}$입니다."],
  ["For $f(x)={f}$, what is the smallest real number $a$ such that $f(x)+a\\ge 0$ holds for every $x$ in the interval ${dom}$? " + EI,
   ["$f(x)+a\\ge0$ for all $x$ in the interval means the minimum of $f$ there is at least $-a$.", "Find the minimum of $f$ by comparing the extreme values and the function values at the ends."],
   "The minimum of $f(x)$ on this interval is ${mn}$. The inequality always holds iff $a\\ge {mn2}$, so the smallest $a$ is ${ans}$."],
  (r, lvl) => {
    for (;;) {
      if (lvl === 1) {
        const K = r.pick([1, 2, -1, -2]), m = r.int(-3, 2), n = m + r.int(1, 4), c0 = r.int(-9, 9);
        const cs = cubicCrit(K, m, n, c0);
        if (!cs) continue;
        const s = r.int(-4, 2), t = s + r.int(2, 6);
        const cand = [s, t, ...[m, n].filter((z) => z > s && z < t)];
        const mn = Math.min(...cand.map((z) => ev(cs, z)));
        return { v: { dom: `[${s},\\ ${t}]`, f: P(cs), mn, mn2: -mn, s, t }, ans: -mn };
      }
      const rt = [r.int(-3, 1), 0, 0]; rt[1] = rt[0] + r.int(1, 3); rt[2] = rt[1] + r.int(1, 3);
      const cs = quartic(rt[0], rt[1], rt[2], 1, r.int(-9, 9));
      const cand = [0, ...rt.filter((z) => z > 0)];
      const mn = Math.min(...cand.map((z) => ev(cs, z)));
      return { v: { dom: "[0,\\ \\infty)", f: P(cs), mn, mn2: -mn, s: 0, t: -1 }, ans: -mn };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 4, standards: ["12미적Ⅰ-02-09"], strategy: "inequality-parameter-by-minimum", evidence: "reverse" });

def("ca1_maxMinFind",
  ["함수 $f(x)={f}$ ($a$는 상수)의 닫힌구간 $[{s},{t}]$에서의 최댓값이 ${M}$일 때, 이 구간에서의 최솟값은? " + KI,
   ["닫힌구간에서의 최대·최소는 구간 안의 극값과 구간 양 끝의 함숫값을 비교해서 찾아요.", "$a$를 포함한 채로 최댓값을 구해 $a$를 정하고, 같은 방식으로 최솟값을 구하세요."],
   "구간 안의 극값과 양 끝의 함숫값을 비교하면 최댓값은 ${mx0}+a$이고 이것이 ${M}$이므로 $a={av}$입니다. 최솟값은 ${mn0}+a={ans}$입니다."],
  ["The maximum of $f(x)={f}$ ($a$ a constant) on the closed interval $[{s},{t}]$ is ${M}$. What is the minimum on this interval? " + EI,
   ["On a closed interval, compare the extreme values inside it and the function values at both ends.", "Find the maximum in terms of $a$ to determine $a$, then find the minimum the same way."],
   "Comparing interior extreme values and the end values, the maximum is ${mx0}+a={M}$, so $a={av}$. The minimum is ${mn0}+a={ans}$."],
  (r) => {
    for (;;) {
      const K = r.pick([1, 2, -1, -2]), m = r.int(-3, 2), n = m + r.int(1, 4);
      const cs0 = cubicCrit(K, m, n, 0);
      if (!cs0) continue;
      const s = r.int(-4, 2), t = s + r.int(2, 6);
      const cand = [s, t, ...[m, n].filter((z) => z > s && z < t)];
      const vals = cand.map((z) => ev(cs0, z)), mx0 = Math.max(...vals), mn0 = Math.min(...vals);
      if (mx0 === mn0) continue;
      const av = r.int(-9, 9);
      return { v: { f: `${P([...cs0.slice(0, 3), 0])}+a`, s, t, M: mx0 + av, mx0, mn0, av }, ans: mn0 + av };
    }
  },
  { skill: "m.h2.der", levels: [1], count: 20, d: 3, standards: ["12미적Ⅰ-02-07", "12미적Ⅰ-02-09"], strategy: "closed-interval-extremes-with-parameter", evidence: "reverse" });

const BOX = [];
for (let W = 6; W <= 60; W++) for (let H = 6; H < W; H++) { const s2 = W * W - W * H + H * H, d = Math.round(Math.sqrt(s2)); if (d * d !== s2 || (W + H - d) % 6) continue; const x = (W + H - d) / 6; if (x > 0 && x < H / 2) BOX.push([W, H, x]); }
def("ca1_optimBox",
  ["가로의 길이가 ${W}$ cm, 세로의 길이가 ${H}$ cm인 직사각형 모양의 종이의 네 모서리에서 한 변의 길이가 같은 정사각형을 잘라 내고, 남은 부분을 접어 뚜껑이 없는 직육면체 모양의 상자를 만듭니다. 상자의 부피의 최댓값은 몇 cm³인가요? " + KI,
   ["잘라 내는 정사각형의 한 변의 길이를 $x$로 놓고 상자의 부피를 $x$에 대한 함수 $V(x)$로 나타내세요.", "$V'(x)=0$의 해 중 $0<x<(\\text{짧은 변})\\div 2$ 범위에 있는 값에서 부피가 최대가 돼요."],
   "잘라 내는 정사각형의 한 변을 $x$ cm라 하면 $V(x)=x({W}-2x)({H}-2x)$ ($0<x<{hh}$)이고, $V'(x)=0$을 풀어 증가에서 감소로 바뀌는 $x={x}$에서 최대가 됩니다. 최대 부피는 ${ans}$ cm³입니다."],
  ["A rectangular sheet of paper is ${W}$ cm long and ${H}$ cm wide. Squares of equal size are cut from the four corners and the rest is folded into an open-top box. What is the maximum volume of the box, in cm³? " + EI,
   ["Let the side of each removed square be $x$ and write the volume as a function $V(x)$.", "The maximum is at the root of $V'(x)=0$ with $0<x<(\\text{shorter side})\\div 2$."],
   "With squares of side $x$ cm, $V(x)=x({W}-2x)({H}-2x)$ for $0<x<{hh}$; $V'(x)=0$ gives the maximum where $V$ changes from increasing to decreasing, at $x={x}$. The maximum volume is ${ans}$ cm³."],
  (r, lvl) => {
    if (lvl === 1) { const k = r.int(1, 9), W = 6 * k; return { v: { W, H: W, x: k, hh: W / 2 }, ans: 16 * k ** 3 }; }
    const [W, H, x] = r.pick(BOX);
    return { v: { W, H, x, hh: H / 2 }, ans: x * (W - 2 * x) * (H - 2 * x) };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 9, d: 3, standards: ["12미적Ⅰ-02-09", "12미적Ⅰ-02-07"], strategy: "optimisation-open-box", evidence: "application" });

def("ca1_optimProfit",
  ["어떤 물건을 하루에 $x$단위($0\\le x\\le {X}$) 생산하여 모두 판매할 때 드는 총비용은 $C(x)={cost}$ (만 원)이고, 한 단위당 판매 가격은 ${price}$만 원입니다. 하루 이익(판매액에서 총비용을 뺀 값)의 최댓값은 몇 만 원인가요? " + KI,
   ["이익을 $P(x)=({price})x-C(x)$로 놓고 $P'(x)=0$을 풀어 보세요.", "극대가 되는 $x$의 함숫값뿐 아니라 구간의 양 끝 $x=0$, $x={X}$ 에서의 값도 비교하세요."],
   "$P(x)={price}x-C(x)$이고 $P'(x)=0$에서 구간 안의 극대인 점은 $x={xs}$입니다. 이 점과 양 끝점에서 $P({xs})={ans}$, $P(0)={p0}$, $P({X})={pX}$이므로 최댓값은 ${ans}$만 원입니다."],
  ["Producing and selling $x$ units a day ($0\\le x\\le {X}$) costs $C(x)={cost}$ (in ten-thousand won), and each unit sells for ${price}$ ten-thousand won. What is the maximum daily profit (sales minus cost), in ten-thousand won? " + EI,
   ["Write the profit as $P(x)=({price})x-C(x)$ and solve $P'(x)=0$.", "Compare the value at the local maximum with the values at the ends $x=0$ and $x={X}$."],
   "$P(x)={price}x-C(x)$, and $P'(x)=0$ gives the local maximum at $x={xs}$ inside the interval. Comparing $P({xs})={ans}$, $P(0)={p0}$, $P({X})={pX}$, the maximum is ${ans}$."],
  (r) => {
    for (;;) {
      const xs = r.int(3, 8), a = r.int(1, 9), b = r.int(0, 30), c0 = r.int(5, 30), X = xs + r.int(1, 4);
      if (3 * xs <= a) continue;
      const price = 3 * xs * xs - 2 * a * xs + b;
      const C_ = [1, -a, b, c0], Pf = (z) => price * z - ev(C_, z);
      if (!(Pf(xs) > Pf(0) && Pf(xs) > Pf(X))) continue;
      return { v: { cost: P(C_), price, X, xs, p0: Pf(0), pX: Pf(X) }, ans: Pf(xs) };
    }
  },
  { skill: "m.h2.der", levels: [1], count: 20, d: 4, standards: ["12미적Ⅰ-02-09", "12미적Ⅰ-02-07"], strategy: "optimisation-profit-cubic-cost", evidence: "application" });

// ================= 02 velocity and acceleration =================
def("ca1_velZeroAccel",
  ["수직선 위를 움직이는 점 P의 시각 $t$ ($t\\ge0$)에서의 위치가 $x(t)={f}$ 일 때, 점 P의 속도가 $0$이 되는 두 시각 중 나중 시각에서의 가속도는? " + KI,
   ["속도는 위치를 $t$로 미분한 $v(t)=x'(t)$, 가속도는 속도를 미분한 $a(t)=v'(t)$입니다.", "$v(t)=0$의 두 근을 구한 뒤, 나중 근을 $a(t)$에 대입하세요."],
   "$v(t)=x'(t)$이고 $v(t)=0$의 두 근은 $t={t1}$, $t={t2}$입니다. $a(t)=v'(t)$의 나중 시각 $t={t2}$ 에서의 값은 ${ans}$입니다."],
  ["A point P moves on a number line with position $x(t)={f}$ at time $t$ ($t\\ge0$). What is its acceleration at the later of the two times at which its velocity is $0$? " + EI,
   ["Velocity is $v(t)=x'(t)$ and acceleration is $a(t)=v'(t)$.", "Solve $v(t)=0$ for the two times, then substitute the later one into $a(t)$."],
   "$v(t)=x'(t)$ and $v(t)=0$ at $t={t1}$ and $t={t2}$. Substituting the later time $t={t2}$ into $a(t)=v'(t)$ gives ${ans}$."],
  (r, lvl) => {
    for (;;) {
      const K = lvl === 1 ? r.pick([2, 4, 6]) : r.pick([1, 2, 3, -2, -4, 5]);
      const t1 = r.int(1, 4), t2 = t1 + r.int(1, 4), c0 = lvl === 1 ? 0 : r.int(-9, 9);
      const cs = cubicCrit(K, t1, t2, c0);
      if (!cs) continue;
      return { v: { f: P(cs, "t"), t1, t2 }, ans: 3 * K * (t2 - t1) };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-10"], strategy: "velocity-zero-then-acceleration", evidence: "calc" });

def("ca1_kinCoefFind",
  ["수직선 위를 움직이는 점 P의 시각 $t$에서의 위치가 $x(t)={f}$ ($a$, $b$는 상수)이다. 시각 $t={p}$에서 점 P의 속도가 $0$이고 가속도가 ${q}$일 때, 시각 $t={k}$에서의 점 P의 위치는? " + KI,
   ["속도는 $v(t)=x'(t)$, 가속도는 $a(t)=v'(t)$입니다. 두 조건을 식으로 쓰세요: $v({p})=0$, $a({p})={q}$.", "두 식을 연립하여 $a$, $b$를 구한 뒤 $x({k})$ 의 값을 계산하세요."],
   "$v(t)=x'(t)$, $a(t)=x''(t)$이므로 $v({p})=0$, $a({p})={q}$에서 $a={av}$, $b={bv}$입니다. 따라서 $x({k})={ans}$입니다."],
  ["A point P on a number line has position $x(t)={f}$ ($a$, $b$ constants). At $t={p}$ its velocity is $0$ and its acceleration is ${q}$. What is its position at $t={k}$? " + EI,
   ["Velocity is $x'(t)$ and acceleration is $x''(t)$; write $v({p})=0$ and $a({p})={q}$.", "Solve the two equations for $a$ and $b$, then compute $x({k})$."],
   "From $v({p})=0$ and $a({p})={q}$ we get $a={av}$, $b={bv}$. Hence $x({k})={ans}$."],
  (r, lvl) => {
    const K = lvl === 1 ? 1 : r.pick([2, 3, -1]), p = r.int(1, 4), a = r.int(-6, 6), c0 = r.int(-9, 9), k = r.int(1, 5);
    const q = 6 * K * p + 2 * a, b = -3 * K * p * p - 2 * a * p;
    return { v: { f: `${cf(K)}t^3+at^2+bt${tl(c0)}`, p, q, k, av: a, bv: b }, ans: K * k ** 3 + a * k * k + b * k + c0 };
  },
  { skill: "m.h2.der", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-02-10"], strategy: "kinematics-conditions-to-coefficients", evidence: "reverse" });

def("ca1_totalDistPos",
  ["수직선 위를 움직이는 점 P의 시각 $t$ ($t\\ge0$)에서의 위치가 $x(t)={f}$ 이다. 시각 $t=0$부터 $t={T}$까지 점 P가 움직인 거리는? " + KI,
   ["움직인 거리는 위치의 변화량이 아니라, 방향이 바뀌는 시각에서 나누어 각 구간의 이동 거리를 더한 값이에요.", "$v(t)=x'(t)=0$인 시각이 구간 $(0,{T})$ 안에 있는지 먼저 확인하세요."],
   "$v(t)=x'(t)=0$인 시각을 구하면 구간에서 방향이 바뀌는 시각은 ${turns}$입니다. 이 시각에서 구간을 나누어 위치의 변화량의 절댓값을 더하면 움직인 거리는 ${ans}$입니다."],
  ["A point P on a number line has position $x(t)={f}$ at time $t$ ($t\\ge0$). How far does P travel from $t=0$ to $t={T}$? " + EI,
   ["Distance travelled is not the net change in position: split the interval where the direction reverses and add the lengths.", "First find the times in $(0,{T})$ where $v(t)=x'(t)=0$."],
   "Solving $v(t)=x'(t)=0$ shows the direction reverses at ${turns}$ within the interval. Splitting there and adding the absolute changes in position gives the distance ${ans}$."],
  (r, lvl) => {
    for (;;) {
      const K = r.pick([2, 4, 1, 3, -2]), t1 = r.int(0, 3), t2 = t1 + r.int(1, 4), c0 = r.int(-9, 9);
      const cs = cubicCrit(K, t1, t2, c0);
      if (!cs) continue;
      const T = lvl === 1 ? t2 + r.int(1, 3) : r.int(t1 === 0 ? 1 : t1 + 1, t2 + 3);
      const bp = [0, ...[t1, t2].filter((z) => z > 0 && z < T), T];
      let dist = 0; for (let i = 1; i < bp.length; i++) dist += Math.abs(ev(cs, bp[i]) - ev(cs, bp[i - 1]));
      const inside = [t1, t2].filter((z) => z > 0 && z < T);
      if (lvl === 1 && inside.length < 2) continue;
      if (lvl === 2 && inside.length !== 1) continue;
      return { v: { f: P(cs, "t"), T, turns: inside.map((z) => `t=${z}`).join(",\\ ") }, ans: dist };
    }
  },
  { skill: "m.h2.der", levels: [1, 2], count: 12, d: 4, standards: ["12미적Ⅰ-02-10"], strategy: "distance-vs-displacement-turning-points", evidence: "application" });

def("ca1_throwImpact",
  ["지면에서 높이가 ${h0}$ m인 곳에서 공을 위로 던졌더니 $t$초 후의 공의 높이가 $h(t)={h}$ (m)이었다. 공이 지면에 떨어지는 순간의 속력은 몇 m/s인가요? " + KI,
   ["지면에 닿는 순간은 $h(t)=0$인 양수 $t$의 값입니다. 속도는 $h'(t)$입니다.", "$h(t)=0$을 풀어 양의 근을 구하고, 그 시각에서 속도의 절댓값을 계산하세요."],
   "$h(t)=0$의 양의 근은 $t={T}$초이고 $h'(t)={v0}-10t$이므로 $h'({T})={vv}$입니다. 속력은 속도의 절댓값이므로 ${ans}$ m/s입니다."],
  ["A ball is thrown upward from a point ${h0}$ m above the ground, and its height after $t$ seconds is $h(t)={h}$ (m). What is the speed, in m/s, at the instant it hits the ground? " + EI,
   ["It hits the ground when $h(t)=0$ for a positive $t$. The velocity is $h'(t)$.", "Solve for the positive root $t_0$ and compute $|h'(t_0)|$."],
   "The positive root of $h(t)=0$ is $t={T}$ s and $h'(t)={v0}-10t$, so $h'({T})={vv}$. Speed is the absolute value: ${ans}$ m/s."],
  (r) => {
    const T = r.int(3, 9), v0 = r.int(1, 5 * T - 1), h0 = 5 * T * T - v0 * T;
    return { v: { h0, h: `${h0}+${v0}t-5t^2`, T, v0, vv: v0 - 10 * T }, ans: 10 * T - v0 };
  },
  { skill: "m.h2.der", levels: [1], count: 14, d: 3, standards: ["12미적Ⅰ-02-10"], strategy: "projectile-impact-speed", evidence: "application" });

const chk = (q) => q.toNumber();
const fQ = (q) => tfrac(Number(q.p), Number(q.q));

// ================= 03 integration =================
def("ca1_indefInitial",
  ["함수 $f(x)$의 도함수가 $f'(x)={d}$ 이고 $f({p})={q}$ 일 때, $f({r})$의 값은? " + KI,
   ["$f(x)$는 $f'(x)$의 부정적분이에요. 적분상수 $C$를 포함해 $f(x)$를 구하세요.", "조건 $f({p})={q}$ 에서 적분상수 $C$를 정한 뒤, $f({r})$ 의 값을 구하세요."],
   "$f(x)=\\int f'(x)\\,dx={F}+C$이고 $f({p})={q}$에서 $C={C}$입니다. 따라서 $f({r})={ans}$입니다."],
  ["A function $f$ has derivative $f'(x)={d}$ and $f({p})={q}$. What is $f({r})$? " + EI,
   ["$f(x)$ is an antiderivative of $f'(x)$; include the constant of integration $C$.", "Use $f({p})={q}$ to fix $C$, then evaluate $f({r})$."],
   "$f(x)=\\int f'(x)\\,dx={F}+C$, and $f({p})={q}$ gives $C={C}$. Hence $f({r})={ans}$."],
  (r, lvl) => {
    const p = r.int(-2, 3); let rr; do rr = r.int(-3, 4); while (rr === p);
    if (lvl <= 2) {
      const deg = lvl === 1 ? 3 : 4;
      const cs = [r.nonzero(-2, 3)]; for (let i = 1; i <= deg; i++) cs.push(r.int(-4, 4));
      return { v: { d: P(pd(cs)), p, q: ev(cs, p), r: rr, F: P([...cs.slice(0, -1), 0]), C: cs[deg] }, ans: ev(cs, rr) };
    }
    const a = r.nonzero(-3, 3), b = r.nonzero(-3, 3), kk = 6 * r.int(1, 2) * r.pick([1, -1]);
    const Fc = [kk / 3, (kk * (a + b)) / 2, kk * a * b, 0], q = r.int(-8, 8), C = q - ev(Fc, p);
    return { v: { d: `${cf(kk)}${fac(-a)}${fac(-b)}`, p, q, r: rr, F: P(Fc), C }, ans: ev(Fc, rr) + C };
  },
  { skill: "m.h3.int", levels: [1, 2, 3], count: 12, d: 2, standards: ["12미적Ⅰ-03-01", "12미적Ⅰ-03-02"], strategy: "antiderivative-with-initial-value", evidence: "calc" });

def("ca1_indefSecond",
  ["함수 $f(x)$가 $f''(x)={d}$ 를 만족시키고 $f'({p})={s}$, $f({q})={w}$ 일 때, $f({r})$의 값은? " + KI,
   ["$f''$을 한 번 적분하면 $f'$, 한 번 더 적분하면 $f$예요. 적분할 때마다 적분상수가 하나씩 생겨요.", "조건 $f'({p})={s}$ 에서 첫 번째 상수를, 조건 $f({q})={w}$ 에서 두 번째 상수를 정하세요."],
   "$f''$을 적분하고 조건 $f'({p})={s}$ 에서 상수를 정하면 $f'(x)={g1}$이고, 다시 적분하고 조건 $f({q})={w}$ 에서 상수를 정하면 $f(x)={g0}$입니다. 따라서 $f({r})={ans}$입니다."],
  ["A function $f$ satisfies $f''(x)={d}$, $f'({p})={s}$ and $f({q})={w}$. What is $f({r})$? " + EI,
   ["Integrating $f''$ gives $f'$, integrating again gives $f$; each step adds a constant.", "Use $f'({p})={s}$ for the first constant and $f({q})={w}$ for the second."],
   "Integrating $f''$ and using $f'({p})={s}$ gives $f'(x)={g1}$; integrating again and using $f({q})={w}$ gives $f(x)={g0}$. Hence $f({r})={ans}$."],
  (r, lvl) => {
    const deg = lvl === 1 ? 3 : 4;
    const cs = [r.nonzero(-2, 2)]; for (let i = 1; i <= deg; i++) cs.push(r.int(-4, 4));
    const d1 = pd(cs), d2 = pd(d1), p = r.int(-2, 2), q = r.int(-2, 2); let rr; do rr = r.int(-3, 3); while (rr === q);
    return { v: { d: P(d2), p, s: ev(d1, p), q, w: ev(cs, q), r: rr, g1: P(d1), g0: P(cs) }, ans: ev(cs, rr) };
  },
  { skill: "m.h3.int", levels: [1, 2], count: 12, d: 3, standards: ["12미적Ⅰ-03-02", "12미적Ⅰ-03-01"], strategy: "double-antiderivative", evidence: "calc" });

def("ca1_defIntSymm",
  ["$\\int_{-{a}}^{{a}}\\left({g}\\right)dx$ 의 값은? " + KF,
   ["구간이 원점에 대해 대칭이에요. $x$의 홀수 거듭제곱 항의 적분은 $0$이 돼요.", "짝수 거듭제곱 항만 남겨 $2\\int_0^{a}$ 로 계산하세요."],
   "홀수차 항은 $-{a}$부터 ${a}$까지 적분하면 $0$입니다. 짝수차 항만 남기면 $2\\int_0^{a}(\\text{짝수차 항})\\,dx={ansf}$입니다."],
  ["What is $\\int_{-{a}}^{{a}}\\left({g}\\right)dx$? " + EF,
   ["The interval is symmetric about $0$, so integrals of odd powers of $x$ vanish.", "Keep the even-power terms and compute $2\\int_0^{a}$."],
   "Odd-power terms integrate to $0$ over $[-{a},{a}]$. The even-power terms give $2\\int_0^{a}(\\text{even part})\\,dx={ansf}$."],
  (r, lvl) => {
    const a = r.int(1, 4);
    if (lvl === 1) {
      const cs = [r.nonzero(-3, 3), r.int(-4, 4), r.int(-5, 5), r.int(-6, 6)];
      return { v: { a, g: P(cs), ansf: fQ(dint(cs, -a, a)) }, ans: chk(dint(cs, -a, a)) };
    }
    if (lvl === 2) {
      const cs = [r.nonzero(-2, 2), r.int(-3, 3), r.int(-4, 4), r.int(-5, 5), r.int(-6, 6)];
      return { v: { a, g: P(cs), ansf: fQ(dint(cs, -a, a)) }, ans: chk(dint(cs, -a, a)) };
    }
    const p = r.nonzero(-3, 3), q = r.nonzero(-4, 4), u = r.nonzero(-2, 2), w = r.int(-3, 3);
    const cs = pmul([1, p], [u, w, q]);
    return { v: { a, g: `(x${tl(p)})(${P([u, w, q])})`, ansf: fQ(dint(cs, -a, a)) }, ans: chk(dint(cs, -a, a)) };
  },
  { skill: "m.h3.int", levels: [1, 2, 3], count: 12, d: 2, standards: ["12미적Ⅰ-03-03", "12미적Ⅰ-03-04"], strategy: "odd-even-symmetric-interval", evidence: "calc" });


def("ca1_defIntSplit",
  ["연속함수 $f(x)$가 $\\int_{{a0}}^{{p}}f(x)\\,dx={A}$, $\\int_{{a0}}^{{q}}f(x)\\,dx={B}$ 를 만족시킬 때, $\\int_{{lo}}^{{hi}}\\left({mf}\\right)dx$ 의 값은? " + KI,
   ["정적분의 성질 $\\int_a^b f\\,dx+\\int_b^c f\\,dx=\\int_a^c f\\,dx$ 와 $\\int_b^a f\\,dx=-\\int_a^b f\\,dx$ 를 쓰세요.", "구하려는 $f$의 적분을 주어진 두 값으로 나타내고, 상수 부분은 따로 적분하세요."],
   "구하려는 구간에서 $\\int f(x)\\,dx={I}$입니다. 상수항은 $\\int c\\,dx=c\\times(\\text{구간의 방향 있는 길이})$로 계산하여 더합니다. 따라서 값은 ${ans}$입니다."],
  ["A continuous function $f$ satisfies $\\int_{{a0}}^{{p}}f(x)\\,dx={A}$ and $\\int_{{a0}}^{{q}}f(x)\\,dx={B}$. What is $\\int_{{lo}}^{{hi}}\\left({mf}\\right)dx$? " + EI,
   ["Use $\\int_a^b f\\,dx+\\int_b^c f\\,dx=\\int_a^c f\\,dx$ and $\\int_b^a f\\,dx=-\\int_a^b f\\,dx$.", "Express the integral of $f$ over the required interval through the two given values and integrate the constant part separately."],
   "Over the required interval $\\int f(x)\\,dx={I}$. The constant term contributes $c\\times(\\text{signed length})$, and the total is ${ans}$."],
  (r, lvl) => {
    const a0 = r.int(-3, 1), p = a0 + r.int(1, 3), q = p + r.int(1, 3), A = r.int(-9, 9), B = r.int(-9, 9);
    const F = new Map([[a0, 0], [p, A], [q, B]]);
    const pts = [a0, p, q];
    let lo, hi;
    do { lo = r.pick(pts); hi = r.pick(pts); } while (lo === hi || (lvl === 1 && !(lo === p && hi === q)) || (lvl === 2 && !(lo > hi)) || (lvl === 3 && lo >= hi));
    const m = r.nonzero(-4, 4), n = r.nonzero(-6, 6);
    const I = F.get(hi) - F.get(lo);
    return { v: { a0, p, q, A, B, lo, hi, mf: `${cf(m)}f(x)${tl(n)}`, m, n, I }, ans: m * I + n * (hi - lo) };
  },
  { skill: "m.h3.int", levels: [1, 2, 3], count: 12, d: 2, standards: ["12미적Ⅰ-03-03"], strategy: "definite-integral-additivity", evidence: "concept" });

def("ca1_integralEq",
  ["다항함수 $f(x)$가 모든 실수 $x$에 대하여 $f(x)={rhs}$ 를 만족시킬 때, $f({k})$의 값은? " + KI,
   ["$\\int_0^1 f(t)\\,dt$는 $x$와 무관한 상수예요. 이것을 $c$로 놓으면 $f(x)$를 $c$로 나타낼 수 있어요.", "그 $f(x)$를 $\\int_0^1 f(t)\\,dt=c$에 대입하여 $c$를 구하세요."],
   "$\\int_0^1 f(t)\\,dt=c$ (상수)로 놓으면 $f(x)$는 $c$를 포함한 이차식이 됩니다. 이를 $0$부터 $1$까지 적분한 값이 $c$와 같다는 식에서 $c={c}$이고, $f({k})={ans}$입니다."],
  ["A polynomial $f$ satisfies $f(x)={rhs}$ for all real $x$. What is $f({k})$? " + EI,
   ["$\\int_0^1 f(t)\\,dt$ does not depend on $x$: call it $c$ and write $f(x)$ using $c$.", "Substitute that $f$ into $\\int_0^1 f(t)\\,dt=c$ and solve for $c$."],
   "Let $\\int_0^1 f(t)\\,dt=c$, a constant, so $f(x)$ is a quadratic containing $c$. Integrating it from $0$ to $1$ and equating with $c$ gives $c={c}$, and $f({k})={ans}$."],
  (r) => {
    for (;;) {
      const g = r.pick([2, 3, 4, -1, -2, -3]), c = r.nonzero(-4, 4), a1 = r.int(-4, 4), b1 = c * (1 - g) - a1;
      const al = 3 * a1, be = 2 * b1;
      if (al === 0) continue;
      const k = r.int(-3, 3);
      return { v: { rhs: `${P([al, be, 0])}${g < 0 ? "-" : "+"}${Math.abs(g) === 1 ? "" : Math.abs(g)}\\int_0^1 f(t)\\,dt`, k, c }, ans: al * k * k + be * k + g * c };
    }
  },
  { skill: "m.h3.int", levels: [1], count: 18, d: 4, standards: ["12미적Ⅰ-03-04"], strategy: "integral-equation-constant", evidence: "reverse" });

def("ca1_integralLimit",
  ["다항함수 $f(x)={f}$ 에 대하여 ${lim}$ 의 값은? " + KF,
   ["분모와 분자가 모두 $0$에 가까워지는 꼴이에요. 정적분과 부정적분의 관계 $\\frac{d}{d x}\\int_a^x f(t)\\,dt=f(x)$를 써 보세요.", "$F'(x)=f(x)$인 $F$로 $\\int_a^x f(t)\\,dt=F(x)-F(a)$로 놓으면 미분계수의 정의 꼴이 돼요."],
   "$F'(x)=f(x)$인 $F$로 적분을 $F(\\text{위끝})-F(\\text{아래끝})$로 쓰면 극한은 $F$의 미분계수 꼴이 됩니다. 이를 $f$의 값으로 계산하면 ${ansf}$입니다."],
  ["For the polynomial $f(x)={f}$, what is ${lim}$? " + EF,
   ["Both numerator and denominator tend to $0$. Use $\\frac{d}{d x}\\int_a^x f(t)\\,dt=f(x)$.", "Write the integral as $F(\\text{top limit})-F(\\text{bottom limit})$ with $F'=f$; the limit becomes a derivative of $F$."],
   "With $F'=f$, writing the integral as $F(\\text{top limit})-F(\\text{bottom limit})$ turns the limit into a derivative of $F$, which equals ${ansf}$ in terms of values of $f$."],
  (r, lvl) => {
    const cs = [r.nonzero(-3, 3), r.int(-4, 4), r.int(-5, 5), r.int(-6, 6)];
    if (lvl === 1) {
      const a = r.nonzero(-3, 3);
      return { v: { f: P(cs), a, p: 0, q: 0, kind: 1, ansf: tfrac(ev(cs, a), 2 * a), lim: `\\lim_{x\\to ${a}}\\frac{1}{x^2-${a * a}}\\int_{${a}}^{x}f(t)\\,dt` }, ans: ev(cs, a) / (2 * a) };
    }
    if (lvl === 2) {
      const a = r.int(-3, 3), p = r.int(1, 4), q = r.int(1, 4);
      return { v: { f: P(cs), a, p, q, kind: 2, ansf: String((p + q) * ev(cs, a)), lim: `\\lim_{h\\to 0}\\frac{1}{h}\\int_{${a}${hterm(-p)}}^{${a}${hterm(q)}}f(t)\\,dt` }, ans: (p + q) * ev(cs, a) };
    }
    const a = r.nonzero(-2, 2);
    return { v: { f: P(cs), a, p: 0, q: 0, kind: 3, ansf: String(2 * a * ev(cs, a * a)), lim: `\\lim_{x\\to ${a}}\\frac{1}{${xminus(a)}}\\int_{${a * a}}^{x^2}f(t)\\,dt` }, ans: 2 * a * ev(cs, a * a) };
  },
  { skill: "m.h3.int", levels: [1, 2, 3], count: 12, d: 4, standards: ["12미적Ⅰ-03-04"], strategy: "integral-limit-as-derivative", evidence: "concept" });

def("ca1_integralFuncFind",
  ["다항함수 $f(x)$가 모든 실수 $x$에 대하여 $\\int_{{c}}^{x}f(t)\\,dt={F}$ ($a$는 상수)를 만족시킬 때, $f({k})$의 값은? " + KI,
   ["$x={c}$ 일 때 좌변의 적분은 $0$이므로 이를 이용해 $a$를 구할 수 있어요.", "그다음 양변을 $x$에 대하여 미분하면 $f(x)$를 얻어요."],
   "$x={c}$ 일 때 좌변이 $0$이므로 $a={av}$입니다. 양변을 미분하면 $f(x)={fx}$이므로 $f({k})={ans}$입니다."],
  ["A polynomial $f$ satisfies $\\int_{{c}}^{x}f(t)\\,dt={F}$ ($a$ a constant) for all real $x$. What is $f({k})$? " + EI,
   ["At $x={c}$ the left side is $0$, which determines $a$.", "Then differentiate both sides with respect to $x$ to get $f(x)$."],
   "At $x={c}$ the left side is $0$, so $a={av}$. Differentiating gives $f(x)={fx}$, hence $f({k})={ans}$."],
  (r, lvl) => {
    const c = r.nonzero(-3, 3), k = r.int(-3, 3), av = r.int(-6, 6), A = r.int(-4, 4);
    if (lvl === 1) {
      const C0 = -(c ** 3 + A * c * c + av * c);
      const fx = [3, 2 * A, av];
      return { v: { c, k, F: `x^3${tx(A, "x^2")}+ax${tl(C0)}`.replace("+ax", "+ax"), av, fx: P(fx) }, ans: ev(fx, k) };
    }
    const D = r.int(-6, 6), C0 = -(c ** 4 + A * c ** 3 + av * c * c + D * c);
    const fx = [4, 3 * A, 2 * av, D];
    return { v: { c, k, F: `x^4${tx(A, "x^3")}+ax^2${tx(D, "x")}${tl(C0)}`, av, fx: P(fx) }, ans: ev(fx, k) };
  },
  { skill: "m.h3.int", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-03-04"], strategy: "integral-function-identity", evidence: "reverse" });

def("ca1_integralFuncExtremum",
  ["$f(t)={f}$ 일 때, 함수 $G(x)=\\int_{{s}}^{x}f(t)\\,dt$ 의 극솟값은? " + KF,
   ["$G'(x)=f(x)$이므로 $G$의 증가·감소는 $f(x)$의 부호로 결정돼요.", "$f(x)$의 부호가 $-$에서 $+$로 바뀌는 $x$에서 극소이고, 그 값은 $\\int_{s}^{x}f(t)\\,dt$로 계산해요."],
   "$G'(x)=f(x)$의 부호가 $-$에서 $+$로 바뀌는 점은 $x={z}$입니다. 극솟값은 $G({z})=\\int_{{s}}^{{z}}f(t)\\,dt={ansf}$입니다."],
  ["For $f(t)={f}$, what is the local minimum value of $G(x)=\\int_{{s}}^{x}f(t)\\,dt$? " + EF,
   ["$G'(x)=f(x)$, so monotonicity of $G$ is decided by the sign of $f(x)$.", "$G$ has a local minimum where $f$ changes sign from $-$ to $+$; its value is $\\int_{s}^{x}f(t)\\,dt$ there."],
   "$G'(x)=f(x)$ changes sign from $-$ to $+$ at $x={z}$. The local minimum value is $G({z})=\\int_{{s}}^{{z}}f(t)\\,dt={ansf}$."],
  (r, lvl) => {
    const K = lvl === 1 ? r.pick([1, 2]) : r.pick([1, 2, 3, -1, -2]), m = r.int(-3, 2), n = m + r.int(1, 4), s = r.int(-3, 3);
    const cs = [K, -K * (m + n), K * m * n], z = K > 0 ? n : m;
    return { v: { f: P(cs, "t"), s, z, ansf: fQ(dint(cs, s, z)) }, ans: chk(dint(cs, s, z)) };
  },
  { skill: "m.h3.int", levels: [1, 2], count: 14, d: 4, standards: ["12미적Ⅰ-03-04", "12미적Ⅰ-02-07"], strategy: "integral-function-extremum", evidence: "concept" });

def("ca1_defIntAbs",
  ["$\\int_{{p}}^{{q}}|{g}|\\,dx$ 의 값은? " + KF,
   ["절댓값 안의 식의 부호가 바뀌는 점, 즉 $x$의 값이 구간 안에 있는 근을 찾으세요.", "그 점에서 구간을 나누어 각 구간에서 절댓값을 벗기고 적분하세요."],
   "절댓값 안의 식은 $x={zs}$에서 부호가 바뀌므로, 구간을 나누어 각 부분에서 부호에 맞게 절댓값을 벗겨 적분하면 값은 ${ansf}$입니다."],
  ["What is $\\int_{{p}}^{{q}}|{g}|\\,dx$? " + EF,
   ["Find the roots of the expression inside the absolute value that lie in the interval.", "Split the interval there and remove the absolute value piece by piece with the correct sign."],
   "The expression changes sign at $x={zs}$. Splitting the interval and removing the absolute value with the right sign on each part gives ${ansf}$."],
  (r, lvl) => {
    for (;;) {
      const nr = lvl === 1 ? 2 : 3, roots = [];
      while (roots.length < nr) { const z = r.int(-3, 4); if (!roots.includes(z)) roots.push(z); }
      roots.sort((x, y) => x - y);
      const K = r.pick([1, 1, 2, -1]);
      const cs = fromRoots(K, roots);
      const p = r.int(-4, 1), q = p + r.int(3, 7);
      const inside = roots.filter((z) => z > p && z < q);
      if (!inside.length) continue;
      const bp = [p, ...inside, q];
      let tot = new Q(0);
      for (let i = 1; i < bp.length; i++) { const piece = dint(cs, bp[i - 1], bp[i]); const mid = (bp[i - 1] + bp[i]) / 2; tot = tot.add(ev(cs, mid) >= 0 ? piece : new Q(0).sub(piece)); }
      return { v: { p, q, g: P(cs), zs: inside.join(",\\ "), ansf: fQ(tot) }, ans: chk(tot) };
    }
  },
  { skill: "m.h3.int", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-03-03", "12미적Ⅰ-03-04"], strategy: "integral-of-absolute-value", evidence: "calc" });

def("ca1_defIntFindBound",
  ["양수 $a$에 대하여 $\\int_{{lo}}^{a}\\left({g}\\right)dx={V}$ 일 때, $a$의 값은? " + KI,
   ["부정적분을 구해 $\\int_{{lo}}^{a}$ 를 $a$에 대한 다항식으로 나타내세요.", "얻은 방정식에서 $a>{lo}$인 해를 찾으세요. 증가하는 식이므로 해는 하나뿐이에요."],
   "한 부정적분은 $G(x)={G}$이므로 $G(a)-G({lo})={V}$이고, $a>{lo}$에서 이 값은 $a$에 대해 증가하므로 해는 하나뿐입니다. 풀면 $a={ans}$입니다."],
  ["For a positive number $a$, $\\int_{{lo}}^{a}\\left({g}\\right)dx={V}$. What is $a$? " + EI,
   ["Find an antiderivative and write $\\int_{{lo}}^{a}$ as a polynomial in $a$.", "Solve the equation for $a>{lo}$; the expression is increasing there, so the root is unique."],
   "With the antiderivative $G(x)={G}$ we get $G(a)-G({lo})={V}$; for $a>{lo}$ the left side increases with $a$, so the root is unique. Solving gives $a={ans}$."],
  (r, lvl) => {
    const lo = lvl === 1 ? 0 : 1, p1 = r.int(1, 4), q1 = r.int(1, 5), a = r.int(lo + 1, 5);
    const G = [p1, q1, 0, 0];                    // p' x^3 + q' x^2
    const V = ev(G, a) - ev(G, lo);
    return { v: { lo, g: P([3 * p1, 2 * q1, 0]), V, G: P([p1, q1, 0, 0]) }, ans: a };
  },
  { skill: "m.h3.int", levels: [1, 2], count: 12, d: 3, standards: ["12미적Ⅰ-03-04"], strategy: "definite-integral-equation-for-bound", evidence: "reverse" });

def("ca1_areaParabolaLine",
  ["포물선 $y={f}$ 와 직선 $y={g}$ 로 둘러싸인 도형의 넓이는? " + KF,
   ["두 식을 연립하여 교점의 $x$좌표 $\\alpha<\\beta$를 구하세요.", "$\\alpha$부터 $\\beta$까지 (위쪽 식)−(아래쪽 식)을 적분하세요."],
   "두 식을 연립하면 교점의 $x$좌표는 ${al}$, ${be}$입니다. 이 구간에서 (위의 그래프)−(아래 그래프)를 적분하면 넓이는 ${ansf}$입니다."],
  ["What is the area of the region enclosed by the parabola $y={f}$ and the line $y={g}$? " + EF,
   ["Solve the two equations simultaneously for the intersections $\\alpha<\\beta$.", "Integrate (upper graph)−(lower graph) from $\\alpha$ to $\\beta$."],
   "Solving simultaneously gives intersections at $x={al}$ and $x={be}$. Integrating (upper)−(lower) over this interval gives the area ${ansf}$."],
  (r, lvl) => {
    const A = r.pick(lvl === 1 ? [1, -1, 2, -2] : [1, -1, 2, -2, 3, -3, 4]), b = r.int(-5, 5), c = r.int(-6, 6);
    const al = r.int(-4, 2), be = al + r.int(lvl === 1 ? 1 : 2, lvl === 1 ? 4 : 6);
    const m = b + A * (al + be), n = c - A * al * be;
    return { v: { f: P([A, b, c]), g: P([m, n]), al, be, ansf: tfrac(Math.abs(A) * (be - al) ** 3, 6) }, ans: (Math.abs(A) * (be - al) ** 3) / 6 };
  },
  { skill: "m.h3.area", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-03-05"], strategy: "area-parabola-line", evidence: "calc" });

def("ca1_areaCubicAxis",
  ["곡선 $y={f}$ 와 $x$축으로 둘러싸인 두 부분의 넓이의 합은? " + KF,
   ["곡선과 $x$축의 교점의 $x$좌표(삼차식의 세 근)를 구하세요.", "부분마다 곡선이 $x$축의 위인지 아래인지 확인하고, 아래이면 부호를 바꾸어 적분하세요."],
   "곡선과 $x$축의 교점은 $x={rs}$입니다. 두 구간에서 각각 $|f(x)|$를 적분하여 더하면 넓이의 합은 ${ansf}$입니다."],
  ["What is the total area of the two regions enclosed by the curve $y={f}$ and the $x$-axis? " + EF,
   ["Find the $x$-intercepts (the three roots of the cubic).", "On each part decide whether the curve is above or below the axis, and flip the sign where it is below."],
   "The curve meets the $x$-axis at $x={rs}$. Integrating $|f(x)|$ over the two intervals and adding gives the total area ${ansf}$."],
  (r, lvl) => {
    const K = r.pick(lvl === 1 ? [1, -1] : [1, -1, 2, -2, 3]);
    const r1 = r.int(-3, 1), r2 = r1 + r.int(1, 3), r3 = r2 + r.int(1, 3);
    const cs = fromRoots(K, [r1, r2, r3]);
    const a1 = dint(cs, r1, r2), a2 = dint(cs, r2, r3);
    const abs = (q) => (q.p < 0n ? new Q(0).sub(q) : q);
    return { v: { f: P(cs), rs: `${r1},\\ ${r2},\\ ${r3}`, ansf: fQ(abs(a1).add(abs(a2))) }, ans: chk(abs(a1).add(abs(a2))) };
  },
  { skill: "m.h3.area", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-03-05"], strategy: "area-cubic-two-lobes", evidence: "calc" });

def("ca1_areaTangentParabola",
  ["포물선 $y={f}$ 위의 $x$좌표가 ${a}$인 점에서의 접선과 이 포물선, 그리고 $y$축으로 둘러싸인 도형의 넓이는? " + KF,
   ["먼저 접선의 방정식을 구하세요. 접선은 포물선의 한쪽(위 또는 아래)에만 있어요.", "$x=0$부터 $x={a}$까지 (포물선)−(접선)의 절댓값을 적분하세요."],
   "접선의 방정식은 $y={tl}$입니다. 구간에서 포물선과 접선의 차를 적분하면 넓이는 ${ansf}$입니다."],
  ["What is the area of the region enclosed by the parabola $y={f}$, its tangent line at the point with $x$-coordinate ${a}$, and the $y$-axis? " + EF,
   ["First find the tangent line; it lies entirely on one side of the parabola.", "Integrate the absolute difference (parabola)−(tangent) from $x=0$ to $x={a}$."],
   "The tangent line is $y={tl}$. Integrating the difference between the parabola and the tangent over the interval gives the area ${ansf}$."],
  (r) => {
    const A = r.nonzero(-3, 3), b = r.int(-6, 6), c = r.int(-8, 8), a = r.nonzero(-4, 4);
    const m = 2 * A * a + b, n = A * a * a + b * a + c - m * a;
    return { v: { f: P([A, b, c]), a, tl: P([m, n]), ansf: tfrac(Math.abs(A) * Math.abs(a) ** 3, 3) }, ans: (Math.abs(A) * Math.abs(a) ** 3) / 3 };
  },
  { skill: "m.h3.area", levels: [1], count: 20, d: 4, standards: ["12미적Ⅰ-03-05", "12미적Ⅰ-02-05"], strategy: "area-bounded-by-tangent", evidence: "calc" });

def("ca1_areaLineParam",
  ["곡선 $y={cur}$ 와 직선 $y=mx$ ($0<m<{a}$)로 둘러싸인 도형의 넓이가 ${S}$ 일 때, 상수 $m$의 값은? " + KI,
   ["곡선과 직선의 교점의 $x$좌표는 $0$, ${a}-m$입니다.", "두 교점 사이에서 (곡선)−(직선)을 적분한 값을 $m$으로 나타낸 뒤, 그 값이 ${S}$인 방정식을 푸세요."],
   "교점의 $x$좌표는 $0$, ${a}-m$이고 넓이는 $\\int_0^{{a}-m}\\{({a}-m)x-x^2\\}dx=\\frac{({a}-m)^3}{6}$입니다. 이것이 ${S}$이므로 ${a}-m={d}$, 즉 $m={ans}$입니다."],
  ["The curve $y={cur}$ and the line $y=mx$ ($0<m<{a}$) enclose a region of area ${S}$. What is the constant $m$? " + EI,
   ["The curve and the line meet at $x=0$ and $x={a}-m$.", "Integrate (curve)−(line) between the intersections, write it in terms of $m$, and set it equal to ${S}$."],
   "The intersections are $x=0$ and $x={a}-m$, and the area is $\\int_0^{{a}-m}\\{({a}-m)x-x^2\\}dx=\\frac{({a}-m)^3}{6}$. Setting this equal to ${S}$ gives ${a}-m={d}$, so $m={ans}$."],
  (r) => {
    const a = r.int(3, 9), d = r.int(1, a - 1);
    return { v: { a, cur: `${a}x-x^2`, S: tfrac(d ** 3, 6), d }, ans: a - d };
  },
  { skill: "m.h3.area", levels: [1], count: 14, d: 4, standards: ["12미적Ⅰ-03-05"], strategy: "area-given-find-parameter", evidence: "reverse" });

// ================= 03 velocity and distance =================
def("ca1_totalDistVel",
  ["수직선 위를 움직이는 점 P의 시각 $t$ ($t\\ge0$)에서의 속도가 $v(t)={v}$ 이다. 시각 $t=0$부터 $t={T}$까지 점 P가 움직인 거리는? " + KF,
   ["움직인 거리는 속력 $|v(t)|$를 적분한 값이에요.", "$v(t)=0$인 시각에서 구간을 나누어 부호에 맞게 적분하세요."],
   "속도의 부호가 바뀌는 시각은 구간 안에서 ${zs}$입니다. $\\int_0^{T}|v(t)|\\,dt$를 구간을 나누어 계산하면 움직인 거리는 ${ansf}$입니다."],
  ["A point P on a number line has velocity $v(t)={v}$ at time $t$ ($t\\ge0$). How far does P travel from $t=0$ to $t={T}$? " + EF,
   ["Distance travelled is the integral of the speed $|v(t)|$.", "Split the interval at the times where $v(t)=0$ and integrate with the correct sign."],
   "The velocity changes sign at ${zs}$ within the interval. Computing $\\int_0^{T}|v(t)|\\,dt$ piece by piece gives the distance ${ansf}$."],
  (r, lvl) => {
    for (;;) {
      const nr = lvl === 1 ? 2 : 3, roots = [];
      while (roots.length < nr) { const z = r.int(1, 6); if (!roots.includes(z)) roots.push(z); }
      roots.sort((x, y) => x - y);
      const K = r.pick([1, -1, 2]);
      const cs = fromRoots(K, roots), T = roots[roots.length - 1] + r.int(-1, 2);
      const inside = roots.filter((z) => z < T);
      if (T < 2 || !inside.length) continue;
      const bp = [0, ...inside, T];
      let tot = new Q(0);
      for (let i = 1; i < bp.length; i++) { const piece = dint(cs, bp[i - 1], bp[i]); const mid = (bp[i - 1] + bp[i]) / 2; tot = tot.add(ev(cs, mid) >= 0 ? piece : new Q(0).sub(piece)); }
      return { v: { v: P(cs, "t"), T, zs: inside.map((z) => `t=${z}`).join(",\\ "), ansf: fQ(tot) }, ans: chk(tot) };
    }
  },
  { skill: "m.h3.area", levels: [1, 2], count: 14, d: 3, standards: ["12미적Ⅰ-03-06"], strategy: "distance-from-velocity-sign-change", evidence: "application" });

def("ca1_returnTime",
  ["수직선 위를 움직이는 점 P가 시각 $t=0$에 원점을 출발하여, 시각 $t$ ($t\\ge0$)에서의 속도가 $v(t)={v}$ 이다. 점 P가 출발한 뒤 처음으로 다시 원점에 도착하는 시각에서의 점 P의 속도는? " + KI,
   ["위치는 속도의 부정적분이고, 출발 위치가 $0$이므로 $x(t)=\\int_0^t v(s)\\,ds$예요.", "$x(t)=0$을 만족시키는 양의 $t$ 중 가장 작은 값을 찾아 $v(t)$에 대입하세요."],
   "$x(t)=\\int_0^t v(s)\\,ds={xt}$이고 $x(t)=0$인 양의 $t$는 ${rs}$입니다. 가장 작은 값 $t={t0}$에서 $v({t0})={ans}$입니다."],
  ["A point P leaves the origin of a number line at $t=0$, and its velocity at time $t$ ($t\\ge0$) is $v(t)={v}$. What is the velocity of P at the first time after the start when it is back at the origin? " + EI,
   ["Position is the antiderivative of velocity with $x(0)=0$: $x(t)=\\int_0^t v(s)\\,ds$.", "Find the smallest positive $t$ with $x(t)=0$ and substitute it into $v(t)$."],
   "$x(t)=\\int_0^t v(s)\\,ds={xt}$ and the positive solutions of $x(t)=0$ are ${rs}$. At the smallest, $t={t0}$, we get $v({t0})={ans}$."],
  (r) => {
    const K = r.pick([1, 2, 3]), r1 = r.int(1, 6);
    let s = r.int(1, 6); while (s === r1) s = r.int(1, 6);
    const vc = [3 * K, -2 * K * (r1 + s), K * r1 * s], t0 = Math.min(r1, s);
    return { v: { v: P(vc, "t"), xt: P([K, -K * (r1 + s), K * r1 * s, 0], "t"), rs: `t=${r1},\\ ${s}`, t0 }, ans: ev(vc, t0) };
  },
  { skill: "m.h3.area", levels: [1], count: 16, d: 4, standards: ["12미적Ⅰ-03-06", "12미적Ⅰ-03-04"], strategy: "position-from-velocity-first-return", evidence: "application" });

// ---- final shape of the plan: [count per set, levels, mix-of-forms]  (mix: one set whose rows are drawn from several forms)
const SHAPE = {
  ca1_limCoefRational: [12, [1, 3]], ca1_limInfRatio: [12, [1, 3]], ca1_limExistence: [14, null, [1, 2]], ca1_powerTangentN: [14, null, [1, 2]], ca1_limRadical: [14, null, [1, 2]], ca1_limPiecewise: [18, null, [1, 2, 3]],
  ca1_contRadical: [15, null, [1, 2, 3]], ca1_contTwoJoint: [12, [1, 2]], ca1_contProduct: [15, null, [1, 2, 3]], ca1_ivtCount: [14, null, [1, 2, 3]],
  ca1_diffLimitPoly: [16, null, [1, 2, 3]], ca1_limDerivForm: [16, null, [1, 2, 3]], ca1_limCoefPoly: [15, null, [1, 2, 3]], ca1_powerFindN: [14, null, [1, 2]],
  ca1_prodAbstract: [16, null, [1, 2, 3]], ca1_diffParam: [16, null, [1, 2, 3]], ca1_absNotDiff: [16, null, [1, 2, 3]],
  ca1_tangentIntercept: [14, null, [1, 2]], ca1_tangentSlopeTwo: [14, null, [1, 2]], ca1_tangentFromPoint: [14, null, [1, 2]], ca1_tangentIntersect: [14, null, [1, 2]],
  ca1_mvtC: [14, [1]], ca1_mvtBound: [14, null, [1, 2]],
  ca1_monoGiven: [14, null, [1, 2]], ca1_noExtremum: [16, null, [1, 2]], ca1_extremaCoef: [16, null, [1, 2, 3]], ca1_derivSignMin: [18, null, [1, 2, 3]],
  ca1_rootCountK: [18, null, [1, 2, 3]], ca1_twoRootsK: [16, null, [1, 2, 3]], ca1_ineqParam: [14, null, [1, 2]], ca1_maxMinFind: [14, [1]],
  ca1_optimBox: [14, null, [1, 2]], ca1_optimProfit: [14, [1]], ca1_velZeroAccel: [14, null, [1, 2]], ca1_kinCoefFind: [14, null, [1, 2]],
  ca1_totalDistPos: [14, null, [1, 2]], ca1_throwImpact: [14, [1]],
  ca1_indefInitial: [16, null, [1, 2, 3]], ca1_indefSecond: [12, null, [1, 2]], ca1_defIntSymm: [16, null, [1, 2, 3]], ca1_defIntSplit: [16, null, [1, 2, 3]],
  ca1_integralEq: [14, [1]], ca1_integralLimit: [16, null, [1, 2, 3]], ca1_integralFuncFind: [14, null, [1, 2]], ca1_integralFuncExtremum: [14, null, [1, 2]],
  ca1_defIntAbs: [14, null, [1, 2]], ca1_defIntFindBound: [12, null, [1, 2]],
  ca1_areaParabolaLine: [14, null, [1, 2]], ca1_areaCubicAxis: [14, null, [1, 2]], ca1_areaTangentParabola: [14, [1]], ca1_areaLineParam: [12, [1]],
  ca1_totalDistVel: [14, null, [1, 2]], ca1_returnTime: [14, [1]],
};
for (const p of PLAN) {
  const s = SHAPE[p.template];
  if (!s) throw new Error(`no shape for ${p.template}`);
  const [count, levels, mix] = s;
  p.count = count;
  if (mix) { const g = GEN[p.template]; GEN[p.template] = (r) => g(r, r.pick(mix)); p.levels = [1]; } else p.levels = levels;
}

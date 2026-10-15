// cm1: 공통수학1 (10공수1): 다항식, 복소수와 이차방정식, 이차함수와 이차부등식, 삼·사차방정식, 연립방정식과 부등식, 경우의 수, 행렬.
// Draft module of the high-school tranche. Every answer is re-derived by verify/cm1.py (sympy / Fraction / brute force).
// Honest limit: explaining, proving and investigating parts of the standards (class X) are not written; class C standards (10공수1-02-04, 10공수1-04-01)
// only get items whose number really depends on the concept (a discriminant condition, a matrix product).
import { C as nCr, P as nPr, sg, cf, lin, poly, tfrac, evalPoly, Q } from "../lib.mjs";

// ---------- helpers (all local to this module) ----------
const q = (n, d = 1) => new Q(n, d);
const qt = (x) => tfrac(Number(x.p), Number(x.q)); // LaTeX of a rational
const qNum = (x) => Number(x.p) / Number(x.q);
const qfloor = (x) => { const r = ((x.p % x.q) + x.q) % x.q; return Number((x.p - r) / x.q); };
const qceil = (x) => -qfloor(new Q(-x.p, x.q));
const qsign = (x) => (x.p > 0n ? 1 : x.p < 0n ? -1 : 0);
const conv = (a, b) => { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
const addP = (a, b) => { const n = Math.max(a.length, b.length); const A = [...Array(n - a.length).fill(0), ...a], B = [...Array(n - b.length).fill(0), ...b]; return A.map((x, i) => x + B[i]); };
/** consecutive integers a..b for display */
const seq = (a, b) => (b - a + 1 <= 8 ? Array.from({ length: b - a + 1 }, (_, i) => a + i).join(", ") : `${a}, ${a + 1}, \\ldots, ${b}`);
/** signed term c*body (body may be "" for a constant): "+3xy", "-y^2", "" for 0 */
const term = (c, body) => (c === 0 ? "" : `${c < 0 ? "-" : "+"}${Math.abs(c) === 1 && body ? "" : Math.abs(c)}${body}`);
/** "a+bi" (a != 0) */
const cplx = (a, b) => `${a}${b === 1 ? "+i" : b === -1 ? "-i" : `${sg(b)}i`}`;
/** signed expression to append after something: "+x" / "-x" (keeps an own leading sign) */
const sgnAppend = (s) => (s.startsWith("-") ? s : `+${s}`);
const OPS = { lt: "<", le: "\\le ", gt: ">", ge: "\\ge " };
const FLIP = { lt: "gt", le: "ge", gt: "lt", ge: "le" };
const okOp = (l, op, r) => (op === "lt" ? l < r : op === "le" ? l <= r : op === "gt" ? l > r : l >= r);
/** a polynomial in x with a free "k" term of coefficient m at degree j (coefs highest first, entry at j ignored) */
function polyK(coefs, j, m) {
  const n = coefs.length - 1;
  let s = "";
  for (let d = n; d >= 0; d--) {
    let body, neg;
    if (d === j) { neg = m < 0; const am = Math.abs(m); body = `${am === 1 ? "" : am}k${d === 0 ? "" : d === 1 ? "x" : `x^${d}`}`; }
    else { const c = coefs[n - d]; if (c === 0) continue; neg = c < 0; const a = Math.abs(c); body = d === 0 ? `${a}` : `${a === 1 ? "" : a}${d === 1 ? "x" : `x^${d}`}`; }
    s += (neg ? "-" : s ? "+" : "") + body;
  }
  return s;
}
const IP_L1 = [["i", "i"], ["-i", "-i"]];
const IP_L2 = [["\\frac{1+i}{1-i}", "i"], ["\\frac{2}{1-i}-1", "i"], ["\\frac{-1+i}{1+i}", "i"], ["\\frac{1}{i^3}", "i"], ["\\frac{1-i}{1+i}", "-i"], ["\\frac{1}{i}", "-i"], ["\\frac{2}{1+i}-1", "-i"], ["-\\frac{1+i}{1-i}", "-i"]];
/** [re, im] of z^0..z^3 for z = i or z = -i */
const ipows = (zs) => (zs === "i" ? [[1, 0], [0, 1], [-1, 0], [0, -1]] : [[1, 0], [0, -1], [-1, 0], [0, 1]]);
/** a+bi as text */
const cxs = (re, im) => (im === 0 ? `${re}` : `${re === 0 ? "" : re}${im === 1 ? (re === 0 ? "i" : "+i") : im === -1 ? "-i" : re === 0 ? `${im}i` : `${sg(im)}i`}`);
/** solved range of k^2 + Bk + C < 0 as LaTeX (exact endpoints when the discriminant is a square, else surds with decimals) */
function openRange(B, C) {
  const Dd = B * B - 4 * C;
  if (Dd <= 0) throw new Error("openRange: empty");
  const sq = Math.round(Math.sqrt(Dd));
  const l = (-B - Math.sqrt(Dd)) / 2, h = (-B + Math.sqrt(Dd)) / 2;
  if (sq * sq === Dd) return `${tfrac(-B - sq, 2)}<k<${tfrac(-B + sq, 2)}`;
  const side = (sgn) => `\\frac{${-B === 0 ? "" : -B}${sgn}\\sqrt{${Dd}}}{2}`;
  return `${side("-")}<k<${side("+")}\\ \\left(\\approx ${l.toFixed(2)}<k<${h.toFixed(2)}\\right)`;
}
const pmat = (rows) => `\\begin{pmatrix}${rows.map((r) => r.join("&")).join("\\\\")}\\end{pmatrix}`;
const matMul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
const rngShuffle = (r, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const TEMPLATES = {
  cm1_polyProdCoef: {
    ko: ["두 다항식 $A={pa}$, $B={pb}$ 에 대하여 $AB$ 를 전개했을 때 $x^{{k}}$ 의 계수는? (숫자만 쓰세요)", ["$AB$ 를 전부 전개하지 않아도 돼요. 곱이 $x^{{k}}$ 꼴이 되는 항의 짝만 찾아요.", "$A$ 의 항과 $B$ 의 항의 차수를 더한 값이 ${k}$ 인 짝마다 계수를 곱하고, 그 값들을 모두 더해요."], "곱이 $x^{{k}}$ 꼴인 항끼리 계수의 곱을 모두 더하면 ${terms}={ans}$ 입니다. (실제로 전개하면 $AB={prod}$ 입니다.)"],
    en: ["For the polynomials $A={pa}$ and $B={pb}$, what is the coefficient of $x^{{k}}$ in the expansion of $AB$? (digits only)", ["You do not have to expand everything; look only for the pairs of terms whose product is $x^{{k}}$.", "For every pair whose degrees add up to ${k}$, multiply the two coefficients, then add all these products."], "Adding the products of the coefficients of the term pairs that multiply to $x^{{k}}$ gives ${terms}={ans}$. (Expanding completely gives $AB={prod}$.)"],
  },
  cm1_polyDivQR: {
    ko: ["다항식 $P(x)={pp}$ 에 대하여 $P(x)\\div({dv})$ 의 몫을 $Q(x)$, 나머지를 $R(x)$ 라 할 때, $Q({t})+R({t})$ 의 값은? (숫자만 쓰세요)", ["최고차항끼리 나누어 몫의 첫 항을 정하고, 나누는 식을 곱해 빼는 과정을 되풀이해요.", "몫의 첫 항은 ${qlead}$ 이고, 나머지의 차수는 나누는 식의 차수보다 낮아요."], "나눗셈을 하면 $P(x)=({dv})({qq})+({rr})$ 이므로 $Q(x)={qq}$, $R(x)={rr}$ 입니다. 따라서 $Q({t})+R({t})={ans}$ 입니다."],
    en: ["Divide $P(x)={pp}$ by ${dv}$; let $Q(x)$ be the quotient and $R(x)$ the remainder. What is $Q({t})+R({t})$? (digits only)", ["Divide the leading terms to get the first term of the quotient, multiply it back, subtract, and repeat.", "The first term of the quotient is ${qlead}$, and the remainder has smaller degree than the divisor."], "Long division gives $P(x)=({dv})({qq})+({rr})$, so $Q(x)={qq}$ and $R(x)={rr}$. Hence $Q({t})+R({t})={ans}$."],
  },
  cm1_remUnknown: {
    ko: ["다항식 $P(x)={pp}$ 에 대하여 $P(x)\\div({dv})$ 의 나머지가 ${R}$ 이다. 상수 $k$ 의 값은? (숫자만 쓰세요)", ["나머지정리: 다항식 $P(x)$ 를 $x-a$ 로 나눈 나머지는 $P(a)$ 와 같아요.", "나누는 식이 $0$ 이 되는 $x$ 의 값은 다음과 같아요: $x={t}$. 이 값을 $P(x)$ 에 대입하면 $k$ 에 대한 일차방정식이 돼요."], "나머지정리에 의해 $P({t})={R}$ 이어야 합니다. $P({t})={lhs}$ 이므로 ${lhs}={R}$ 에서 $k={ans}$ 입니다."],
    en: ["When $P(x)={pp}$ is divided by ${dv}$, the remainder is ${R}$. What is the constant $k$? (digits only)", ["Remainder theorem: the remainder of $P(x)$ divided by $x-a$ equals $P(a)$.", "Substitute the value ${t}$ that makes the divisor $0$ into $P(x)$; you get a linear equation in $k$."], "By the remainder theorem $P({t})={R}$. Since $P({t})={lhs}$, solving ${lhs}={R}$ gives $k={ans}$."],
  },
  cm1_remQuadDiv: {
    ko: ["다항식 $P(x)$ 에 대하여 $P(x)\\div({dv1})$ 의 나머지가 ${r1}$ 이고 $P(x)\\div({dv2})$ 의 나머지가 ${r2}$ 이다. $P(x)\\div\\left(({dv1})({dv2})\\right)$ 의 나머지를 $R(x)$ 라 할 때, $R({c})$ 의 값은? (숫자만 쓰세요)", ["이차식으로 나눈 나머지는 일차 이하의 식이에요. $R(x)=px+q$ 로 놓아요.", "$P(x)=({dv1})({dv2})Q(x)+R(x)$ 에서 나누는 식이 $0$ 이 되는 두 값을 대입해 보세요."], "$R(x)=px+q$ 라 하면 $R({a})=P({a})={r1}$, $R({b})=P({b})={r2}$ 입니다. 두 식을 연립하면 $p={p}$, $q={q}$ 이므로 $R(x)={Rx}$ 이고 $R({c})={ans}$ 입니다."],
    en: ["When a polynomial $P(x)$ is divided by ${dv1}$ the remainder is ${r1}$, and when divided by ${dv2}$ the remainder is ${r2}$. Let $R(x)$ be the remainder of $P(x)$ divided by $({dv1})({dv2})$. What is $R({c})$? (digits only)", ["The remainder on division by a quadratic has degree at most 1. Write $R(x)=px+q$.", "In $P(x)=({dv1})({dv2})Q(x)+R(x)$, substitute the two values that make the divisor $0$."], "Let $R(x)=px+q$. Then $R({a})=P({a})={r1}$ and $R({b})=P({b})={r2}$. Solving gives $p={p}$, $q={q}$, so $R(x)={Rx}$ and $R({c})={ans}$."],
  },
  cm1_identity: {
    ko: ["$x$ 에 대한 항등식 ${lhs}={rhs}$ 에서, 상수 ${consts}$ 에 대하여 ${ask}$ 의 값은? (숫자만 쓰세요)", ["항등식은 $x$ 에 어떤 값을 넣어도 성립하는 등식이에요. 좌변을 전개해서 같은 차수의 계수를 비교할 수 있어요.", "$x={p}$ 일 때 괄호 안의 식이 $0$ 이 돼요. 이 값을 대입하면 상수항에 해당하는 값이 바로 나와요."], "계수를 비교하거나 $x$ 에 알맞은 값을 대입하여 구하면 ${sol}$ 입니다. 따라서 ${ask}={ans}$ 입니다."],
    en: ["The equation ${lhs}={rhs}$ is an identity in $x$. For the constants ${consts}$, what is the value of ${ask}$? (digits only)", ["An identity holds for every value of $x$. Expand the left side and compare coefficients of equal powers.", "Substituting $x={p}$, which makes the bracket $0$, gives the constant-term value directly."], "Comparing coefficients (or substituting suitable values of $x$) gives ${sol}$. Hence ${ask}={ans}$."],
  },

  cm1_symmetricEval: {
    ko: ["실수 $x$, $y$ 에 대하여 ${cond}$ 일 때, ${expr}$ 의 값은? (숫자만 쓰세요)", ["구하는 식을 합 $x+y$ 와 곱 $xy$ 로 나타내요. 예를 들어 $x^2+y^2=(x+y)^2-2xy$ 예요.", "세제곱은 $x^3+y^3=(x+y)^3-3xy(x+y)$ 를 쓰고, 네제곱은 먼저 $x^2+y^2$ 을 구한 뒤 $x^4+y^4=(x^2+y^2)^2-2(xy)^2$ 을 써요."], "곱셈 공식을 변형하면 ${expr}={work}$ 입니다. (이때 $(x-y)^2=(x+y)^2-4xy={dd}\\ge0$ 이므로 조건을 만족시키는 실수 $x$, $y$ 가 존재합니다.) 따라서 구하는 값은 ${ans}$ 입니다."],
    en: ["For real numbers $x$ and $y$ with ${cond}$, what is the value of ${expr}$? (digits only)", ["Write the required expression through the sum $x+y$ and the product $xy$; for example $x^2+y^2=(x+y)^2-2xy$.", "For cubes use $x^3+y^3=(x+y)^3-3xy(x+y)$; for fourth powers first find $x^2+y^2$ and then use $x^4+y^4=(x^2+y^2)^2-2(xy)^2$."], "Rewriting with the product formulas gives ${expr}={work}$. (Also $(x-y)^2=(x+y)^2-4xy={dd}\\ge0$, so real numbers $x$, $y$ with the given condition exist.) So the value is ${ans}$."],
  },
  cm1_symmetricInv: {
    ko: ["실수 $x$ 에 대하여 $x+\\frac{1}{x}={k}$ 일 때, ${expr}$ 의 값은? (숫자만 쓰세요)", ["$x$ 와 $\\frac{1}{x}$ 의 곱은 $1$ 이에요. 그래서 합 $x+\\frac{1}{x}$ 의 값만 알면 거듭제곱의 합을 구할 수 있어요.", "$x^2+\\frac{1}{x^2}=\\left(x+\\frac{1}{x}\\right)^2-2$, $x^3+\\frac{1}{x^3}=\\left(x+\\frac{1}{x}\\right)^3-3\\left(x+\\frac{1}{x}\\right)$ 이고, 네제곱은 $x^2+\\frac{1}{x^2}$ 을 한 번 더 제곱해서 구해요."], "곱셈 공식을 변형하면 ${expr}={work}$ 입니다. (실수 $x$ 에 대하여 $\\left|x+\\frac{1}{x}\\right|\\ge2$ 이므로 이 조건을 만족시키는 실수가 존재합니다.) 따라서 구하는 값은 ${ans}$ 입니다."],
    en: ["For a real number $x$ with $x+\\frac{1}{x}={k}$, what is the value of ${expr}$? (digits only)", ["The product of $x$ and $\\frac{1}{x}$ is $1$, so the value of the sum $x+\\frac{1}{x}$ is enough to get sums of powers.", "$x^2+\\frac{1}{x^2}=\\left(x+\\frac{1}{x}\\right)^2-2$ and $x^3+\\frac{1}{x^3}=\\left(x+\\frac{1}{x}\\right)^3-3\\left(x+\\frac{1}{x}\\right)$; for the fourth power square $x^2+\\frac{1}{x^2}$ once more."], "Rewriting with the product formulas gives ${expr}={work}$. (For real $x$ we have $\\left|x+\\frac{1}{x}\\right|\\ge2$, so a real number with this condition exists.) So the value is ${ans}$."],
  },
  cm1_factorEval: {
    ko: ["인수분해를 이용하여 ${expr}$ 의 값을 구하면? (숫자만 쓰세요)", ["큰 수를 문자 $N$ 으로 놓고, 분자를 인수분해하여 분모와 약분해요.", "예를 들어 $N^3-1=(N-1)(N^2+N+1)$, $N^4+N^2+1=(N^2+N+1)(N^2-N+1)$, $N^4-1=(N^2+1)(N^2-1)$ 처럼 분모와 같은 식이 분자의 인수로 나와요."], "$N={N}$ 일 때 분자를 인수분해하면 ${fac}$ 이고, 분모와 약분하면 ${simp}$ 입니다. 따라서 값은 ${ans}$ 입니다."],
    en: ["Use factorization to find the value of ${expr}$. (digits only)", ["Let $N$ be the large number, factor the numerator and cancel against the denominator.", "For instance $N^3-1=(N-1)(N^2+N+1)$, $N^4+N^2+1=(N^2+N+1)(N^2-N+1)$ and $N^4-1=(N^2+1)(N^2-1)$: the denominator shows up as a factor of the numerator."], "With $N={N}$ the numerator factors as ${fac}$; cancelling the denominator leaves ${simp}$. So the value is ${ans}$."],
  },

  cm1_iPower: {
    ko: ["$z={z}$ 일 때, ${expr}$ 의 실수부분과 허수부분의 합은? (숫자만 쓰세요)", ["$i$ 의 거듭제곱은 $i,\\ -1,\\ -i,\\ 1$ 이 이 순서로 반복돼요. $z$ 가 복잡한 꼴이면 먼저 $a+bi$ 꼴로 간단히 해요.", "$z^4=1$ 이므로 $z$ 의 거듭제곱은 $4$ 개마다 같은 값이 반복돼요. 지수를 $4$ 로 나눈 나머지만 보면 돼요."], "먼저 간단히 하면 $z={zs}$ 이고 $z^4=1$ 입니다. 지수를 $4$ 로 나눈 나머지로 바꾸면 ${work}$ 입니다. 따라서 실수부분과 허수부분의 합은 ${ans}$ 입니다."],
    en: ["For $z={z}$, what is the sum of the real part and the imaginary part of ${expr}$? (digits only)", ["The powers of $i$ repeat as $i,\\ -1,\\ -i,\\ 1$. If $z$ looks complicated, first simplify it to the form $a+bi$.", "Since $z^4=1$, the powers of $z$ repeat after every $4$ steps; only the exponent modulo $4$ matters."], "Simplifying first gives $z={zs}$ and $z^4=1$. Reducing the exponents modulo $4$ gives ${work}$. So the sum of the real and imaginary parts is ${ans}$."],
  },
  cm1_iPowerSum: {
    ko: ["$z={z}$ 일 때, ${expr}$ 의 실수부분과 허수부분의 합은? (숫자만 쓰세요)", ["$z$ 를 먼저 $a+bi$ 꼴로 간단히 하고, $z^4=1$ 인지 확인해요. 그러면 연속한 네 거듭제곱의 합 $z+z^2+z^3+z^4$ 의 값을 알 수 있어요.", "네 항씩 묶으면 묶음마다 합이 같아요. 항의 개수를 $4$ 로 나눈 나머지만큼의 항이 마지막에 남아요."], "먼저 간단히 하면 $z={zs}$ 이므로 $z^4=1$ 이고 $z+z^2+z^3+z^4=0$ 입니다. 네 항씩 묶으면 각 묶음의 합이 $0$ 이고, ${n}={q4}\\times4+{rm}$ 이므로 남는 항은 처음 ${rm}$ 개뿐이므로 ${work}$ 입니다. 따라서 실수부분과 허수부분의 합은 ${ans}$ 입니다."],
    en: ["For $z={z}$, what is the sum of the real part and the imaginary part of ${expr}$? (digits only)", ["First simplify $z$ to the form $a+bi$ and check that $z^4=1$; then you know the value of four consecutive powers $z+z^2+z^3+z^4$.", "Group the terms four at a time; every group has the same sum. Only as many terms as the remainder of the number of terms divided by $4$ are left at the end."], "Simplifying first gives $z={zs}$, so $z^4=1$ and $z+z^2+z^3+z^4=0$. Every group of four terms sums to $0$, and ${n}={q4}\\times4+{rm}$, so only the first ${rm}$ terms remain, so ${work}$. So the sum of the real and imaginary parts is ${ans}$."],
  },

  cm1_complexCond: {
    ko: ["실수 $x$ 에 대하여 복소수 $z={zs}$ 에서, $z$ 가 순허수가 되는 $x$ 의 값은? (단, 순허수는 실수부분이 $0$ 이고 허수부분이 $0$ 이 아닌 복소수이다.) (숫자만 쓰세요)", ["$z$ 를 (실수부분)$+$(허수부분)$i$ 꼴로 정리해요. $i^2=-1$ 이에요.", "실수부분이 $0$ 이 되는 $x$ 를 구한 뒤, 그 값에서 허수부분이 $0$ 이 아닌지도 꼭 확인해요."], "$z$ 의 실수부분은 ${re}$, 허수부분은 ${im}$ 입니다. 실수부분이 $0$ 이어야 하므로 ${roots}$ 입니다. 이때 허수부분의 값은 ${chk}$ 이므로 순허수가 되는 것은 $x={ans}$ 입니다."],
    en: ["For a real number $x$, consider the complex number $z={zs}$. For which $x$ is $z$ purely imaginary? (A purely imaginary number has real part $0$ and imaginary part not $0$.) (digits only)", ["Write $z$ as (real part)$+$(imaginary part)$i$, using $i^2=-1$.", "Find the $x$ that makes the real part $0$, then check that the imaginary part is not $0$ there."], "The real part of $z$ is ${re}$ and the imaginary part is ${im}$. The real part must be $0$, giving ${roots}$. The value of the imaginary part there is ${chk}$, so $z$ is purely imaginary exactly for $x={ans}$."],
  },
  cm1_discrimCount: {
    ko: ["이차방정식 ${eq}=0$ 의 두 근이 모두 허근이 되도록 하는 정수 $k$ 는 ${lo}\\le k\\le {hi}$ 에서 모두 몇 개인가요? (숫자만 쓰세요)", ["이차방정식이 허근을 가지려면 판별식 $D<0$ 이어야 해요.", "$x$ 의 계수가 짝수이면 $\\frac{D}{4}=\\left(\\frac{b}{2}\\right)^2-ac$ 를 쓰면 편해요. 이 식을 $k$ 에 대한 부등식으로 풀어요."], "$\\frac{D}{4}={d4}<0$ 이어야 하고, 이를 풀면 ${kr}$ 입니다. 이를 만족시키는 정수 $k$ 는 ${ks}$ 이므로 ${lo}\\le k\\le {hi}$ 안에서 모두 ${ans}$ 개입니다."],
    en: ["For how many integers $k$ with ${lo}\\le k\\le {hi}$ does the quadratic equation ${eq}=0$ have non-real roots? (digits only)", ["A quadratic has non-real roots exactly when its discriminant satisfies $D<0$.", "If the coefficient of $x$ is even, $\\frac{D}{4}=\\left(\\frac{b}{2}\\right)^2-ac$ is convenient. Solve the resulting inequality in $k$."], "We need $\\frac{D}{4}={d4}<0$, which gives ${kr}$. The integers $k$ in ${lo}\\le k\\le {hi}$ satisfying this are ${ks}$, so there are ${ans}$ of them."],
  },
  cm1_vietaExpr: {
    ko: ["이차방정식 ${eq}=0$ 의 두 근을 $\\alpha$, $\\beta$ 라 할 때, ${expr}$ 의 값은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["이차방정식 $ax^2+bx+c=0$ 의 두 근의 합은 $-\\frac{b}{a}$, 곱은 $\\frac{c}{a}$ 예요.", "구하는 식을 $\\alpha+\\beta$ 와 $\\alpha\\beta$ 로 나타낸 다음 값을 대입해요."], "근과 계수의 관계에서 $\\alpha+\\beta={sf}$, $\\alpha\\beta={pf}$ 입니다. 따라서 ${expr}={work}={res}$ 입니다."],
    en: ["Let $\\alpha$ and $\\beta$ be the two roots of ${eq}=0$. What is the value of ${expr}$? (write a decimal, or a fraction like 3/4)", ["For $ax^2+bx+c=0$ the sum of the roots is $-\\frac{b}{a}$ and the product is $\\frac{c}{a}$.", "Express the required quantity through $\\alpha+\\beta$ and $\\alpha\\beta$, then substitute."], "By Vieta's formulas $\\alpha+\\beta={sf}$ and $\\alpha\\beta={pf}$. Hence ${expr}={work}={res}$."],
  },
  cm1_vietaUnknown: {
    ko: ["이차방정식 $x^2-kx{cs}=0$ 의 두 근을 $\\alpha$, $\\beta$ 라 하자. ${cond}$ 일 때, 양수 $k$ 의 값은? (숫자만 쓰세요)", ["근과 계수의 관계에서 두 근의 합은 $k$, 두 근의 곱은 ${c}$ 입니다.", "주어진 조건을 $\\alpha+\\beta$, $\\alpha\\beta$ 로 나타내거나, 한 근을 문자로 놓고 다른 근을 그 식으로 나타내어 $k$ 를 구해요."], "근과 계수의 관계에서 $\\alpha+\\beta=k$, $\\alpha\\beta={c}$ 입니다. ${work}$ 따라서 $k={ans}$ 입니다."],
    en: ["Let $\\alpha$ and $\\beta$ be the roots of $x^2-kx{cs}=0$. If ${cond}$, what is the positive number $k$? (digits only)", ["The sum of the roots is $k$ and the product is ${c}$ (Vieta's formulas).", "Express the given condition through $\\alpha+\\beta$ and $\\alpha\\beta$, or write one root in terms of the other, and solve for $k$."], "By Vieta's formulas $\\alpha+\\beta=k$ and $\\alpha\\beta={c}$. ${work}$ Hence $k={ans}$."],
  },
  cm1_rootSignCond: {
    ko: ["이차방정식 ${eq}=0$ 에서 서로 다른 두 실근이 모두 ${t}$ 보다 크도록 하는 정수 $k$ 의 최솟값은? (숫자만 쓰세요)", ["좌변을 $f(x)$ 라 하면, $y=f(x)$ 의 그래프가 $x$ 축과 서로 다른 두 점에서 만나고 두 교점이 모두 $x={t}$ 의 오른쪽에 있는 경우예요.", "판별식 $D>0$, 축의 위치(축 $x>{t}$), $f({t})>0$ 세 조건을 모두 확인해요."], "$f(x)={eq}$ 에서 두 근이 모두 ${t}$ 보다 크려면 (i) $\\frac{D}{4}={d4}>0$, (ii) 축 $x=k$ 에서 $k>{t}$, (iii) $f({t})={ft}>0$ 세 조건을 모두 만족해야 합니다. 이를 만족시키는 가장 작은 정수 $k$ 는 ${ans}$ 입니다."],
    en: ["What is the smallest integer $k$ for which ${eq}=0$ has two distinct real roots, both greater than ${t}$? (digits only)", ["Call the left side $f(x)$. The graph of $y=f(x)$ must cut the $x$-axis at two points, both to the right of $x={t}$.", "Check all three conditions: discriminant $D>0$, axis position (axis $>{t}$), and $f({t})>0$."], "With $f(x)={eq}$, both roots exceed ${t}$ exactly when (i) $\\frac{D}{4}={d4}>0$, (ii) the axis $x=k$ satisfies $k>{t}$, and (iii) $f({t})={ft}>0$. The smallest integer $k$ satisfying all three is ${ans}$."],
  },
  cm1_parabolaLine: {
    ko: ["다음 포물선과 직선이 접할 때, 상수 $k$ 의 값은? (포물선 $y={f}$, 직선 $y={g}$) (숫자만 쓰세요)", ["접한다는 것은 두 식을 연립한 이차방정식이 중근을 갖는다는 뜻이에요.", "두 식에서 $y$ 를 없앤 이차방정식의 판별식이 $0$ 이 되도록 해요."], "${f}={g}$ 에서 ${eq2}=0$ 이고, 접하므로 판별식 $D=({bm})^2-4\\cdot({a})\\cdot({c}-k)=0$ 입니다. 이를 풀면 $k={ans}$ 입니다."],
    en: ["The parabola $y={f}$ is tangent to the line $y={g}$. What is the constant $k$? (digits only)", ["Tangency means the quadratic obtained by equating the two expressions has a double root.", "Eliminate $y$ and make the discriminant of the resulting quadratic equal to $0$."], "Equating gives ${eq2}=0$. Tangency requires the discriminant $D=({bm})^2-4\\cdot({a})\\cdot({c}-k)=0$, which gives $k={ans}$."],
  },
  cm1_parabolaLineCount: {
    ko: ["다음 포물선과 직선이 만나지 않도록 하는 정수 $k$ 는 ${lo}\\le k\\le {hi}$ 에서 모두 몇 개인가요? (포물선 $y={f}$, 직선 $y={g}$) (숫자만 쓰세요)", ["두 그래프가 만나지 않는다는 것은 두 식을 연립한 이차방정식이 실근을 갖지 않는다는 뜻이에요.", "두 식에서 $y$ 를 없앤 이차방정식의 판별식이 $D<0$ 이 되는 $k$ 의 범위를 구한 뒤, 그 안에 들어 있는 정수를 세요."], "${f}={g}$ 에서 ${eq2}=0$ 이고, 만나지 않으려면 판별식 $D<0$ 이어야 합니다. $D=({bm})^2-4\\cdot({a})\\cdot({c}-k)={dk}<0$ 에서 ${kr}$ 이므로 ${lo}\\le k\\le {hi}$ 안의 정수는 ${ks}$ 이고, 모두 ${ans}$ 개입니다."],
    en: ["For how many integers $k$ with ${lo}\\le k\\le {hi}$ do the parabola $y={f}$ and the line $y={g}$ have no common point? (digits only)", ["No common point means that the quadratic obtained by equating the two expressions has no real root.", "Eliminate $y$, find the range of $k$ for which the discriminant satisfies $D<0$, and count the integers in it."], "Equating gives ${eq2}=0$, and there is no intersection exactly when $D<0$. Here $D=({bm})^2-4\\cdot({a})\\cdot({c}-k)={dk}<0$, which gives ${kr}$, so the integers in ${lo}\\le k\\le {hi}$ are ${ks}$, which is ${ans}$ integers."],
  },
  cm1_parabolaXaxis: {
    ko: ["이차함수 $y={f}$ 의 그래프가 $x$ 축과 서로 다른 두 점에서 만나고, 두 점 사이의 거리가 ${d}$ 일 때, 상수 $k$ 의 값은? (숫자만 쓰세요)", ["두 교점의 $x$ 좌표는 방정식 ${f}=0$ 의 두 근이에요.", "두 근을 $\\alpha$, $\\beta$ 라 하면 두 점 사이의 거리는 $|\\alpha-\\beta|$ 이고, $(\\alpha-\\beta)^2=(\\alpha+\\beta)^2-4\\alpha\\beta$ 예요."], "교점의 $x$ 좌표 $\\alpha$, $\\beta$ 는 ${f}=0$ 의 두 근이므로 $\\alpha+\\beta={sm}$ 입니다. $(\\alpha-\\beta)^2=({sm})^2-4\\alpha\\beta={d}^2$ 에서 $\\alpha\\beta={ab}$ 이고, 근과 계수의 관계에서 $\\alpha\\beta=\\frac{k}{{p}}$ 이므로 $k={ans}$ 입니다."],
    en: ["The graph of $y={f}$ meets the $x$-axis at two distinct points whose distance apart is ${d}$. What is the constant $k$? (digits only)", ["The $x$-coordinates of the two points are the two roots of ${f}=0$.", "If the roots are $\\alpha,\\beta$, the distance is $|\\alpha-\\beta|$, and $(\\alpha-\\beta)^2=(\\alpha+\\beta)^2-4\\alpha\\beta$."], "The $x$-coordinates $\\alpha,\\beta$ are the roots of ${f}=0$, so $\\alpha+\\beta={sm}$. From $(\\alpha-\\beta)^2=({sm})^2-4\\alpha\\beta={d}^2$ we get $\\alpha\\beta={ab}$, and Vieta gives $\\alpha\\beta=\\frac{k}{{p}}$, so $k={ans}$."],
  },
  cm1_quadRange: {
    ko: ["함수 $y={f}$ 의 ${m}\\le x\\le {n}$ 에서의 최댓값과 최솟값의 합은? (단, $x$ 는 실수이다.) (숫자만 쓰세요)", ["이차함수는 꼭짓점의 $x$ 좌표가 주어진 구간 안에 있는지부터 확인해요.", "꼭짓점이 구간 안에 있으면 꼭짓점과 두 끝점에서, 밖에 있으면 두 끝점에서의 함숫값을 비교해요."], "이 함수의 꼭짓점은 $({h},{kv})$ 이고, 구간의 양 끝에서 $y$ 의 값은 $x={m}$ 일 때 ${fm}$, $x={n}$ 일 때 ${fn}$ 입니다. 꼭짓점의 $x$ 좌표가 구간 ${m}\\le x\\le {n}$ 안에 있는지 살펴 최댓값과 최솟값을 구하면 그 합은 ${ans}$ 입니다."],
    en: ["For real $x$ with ${m}\\le x\\le {n}$, what is the sum of the maximum and the minimum value of $y={f}$? (digits only)", ["First check whether the $x$-coordinate of the vertex lies inside the given interval.", "If the vertex is inside, compare the values at the vertex and at both endpoints; otherwise compare the two endpoints."], "The vertex of the graph is $({h},{kv})$, and at the ends of the interval $y={fm}$ for $x={m}$ and $y={fn}$ for $x={n}$. Deciding whether the vertex abscissa ${h}$ lies in the interval gives the maximum and minimum, whose sum is ${ans}$."],
  },
  cm1_quadRevenue: {
    ko: ["원가가 ${w}$ 원인 물건을 한 개에 ${a}$ 원에 팔면 하루에 ${b}$ 개가 팔립니다. 판매 가격을 ${s}$ 원 올릴 때마다 하루 판매량은 ${c}$ 개씩 줄어듭니다. 판매 가격을 ${s}$ 원씩 정수 번($0$ 번 포함) 올릴 수 있을 때, 하루 이익의 최댓값은 몇 원인가요? (이익은 (판매 가격 $-$ 원가)$\\times$(판매량)으로 계산합니다.) (숫자만 쓰세요)", ["가격을 올리는 횟수를 $t$ 로 놓고 판매 가격과 판매량을 $t$ 로 나타내요.", "(개당 이익)$\\times$(판매량)은 $t$ 에 대한 이차식이에요. 꼭짓점의 $t$ 가 정수인지 확인해요."], "올리는 횟수를 $t$ 라 하면 개당 이익은 $({e1}+{s}t)$ 원, 판매량은 $({b}-{c}t)$ 개이므로 이익은 $({e1}+{s}t)({b}-{c}t)$ 원입니다. 이 이차식은 $t={tstar}$ 에서 최대가 되고, 그때의 이익은 ${ans}$ 원입니다."],
    en: ["An item with a cost of ${w}$ won sells ${b}$ per day at a price of ${a}$ won each. Every time the price is raised by ${s}$ won, the daily sales drop by ${c}$ items. If the price can be raised by ${s}$ won any whole number of times (including $0$), what is the maximum daily profit in won? (Profit = (selling price $-$ cost) $\\times$ (number sold).) (digits only)", ["Let $t$ be the number of price rises and write the price and the number sold in terms of $t$.", "(profit per item) $\\times$ (number sold) is a quadratic in $t$. Check whether its vertex has an integer $t$."], "After $t$ rises the profit per item is $({e1}+{s}t)$ won and the number sold is $({b}-{c}t)$, so the profit is $({e1}+{s}t)({b}-{c}t)$ won. This quadratic is largest at $t={tstar}$, where the profit is ${ans}$ won."],
  },
  cm1_quadFence: {
    ko: ["길이가 ${L}$ m 인 철망으로, 한 변이 벽에 닿는 직사각형 모양의 울타리를 만들고 벽에 수직인 칸막이를 ${j}$ 개 세워 공간을 나누려고 합니다. 벽 쪽에는 철망을 쓰지 않고 칸막이도 같은 철망으로 만들 때, 울타리 전체의 넓이의 최댓값은 몇 $\\mathrm{m}^2$ 인가요? (숫자만 쓰세요)", ["벽에 수직인 변의 길이를 $x$ m 로 놓고, 그런 변이 모두 몇 개인지 세어요.", "벽에 평행한 변의 길이를 $x$ 로 나타내어 넓이를 $x$ 에 대한 이차식으로 만든 뒤 꼭짓점을 구해요."], "벽에 수직인 변은 양 끝 2개와 칸막이 ${j}$ 개를 합쳐 ${k}$ 개이므로 벽에 평행한 변의 길이는 $({L}-{k}x)$ m 입니다. 넓이 $S(x)=x({L}-{k}x)$ 는 $x={u}$ 에서 최대이고 최댓값은 ${ans}$ $\\mathrm{m}^2$ 입니다."],
    en: ["A ${L}$ m roll of fencing is used to build a rectangular enclosure with one side along a wall, divided by ${j}$ partitions perpendicular to the wall. No fencing is used along the wall, and the partitions are made of the same fencing. What is the maximum total area of the enclosure in $\\mathrm{m}^2$? (digits only)", ["Let $x$ m be the length of a side perpendicular to the wall and count how many such pieces of fencing there are.", "Express the side parallel to the wall through $x$, write the area as a quadratic in $x$ and find its vertex."], "The pieces perpendicular to the wall are the 2 ends and ${j}$ partitions, ${k}$ in all, so the side parallel to the wall is $({L}-{k}x)$ m. The area $S(x)=x({L}-{k}x)$ is largest at $x={u}$, with maximum ${ans}$ $\\mathrm{m}^2$."],
  },
  cm1_omega: {
    ko: ["이차방정식 ${eq}$ 의 한 허근을 $\\omega$ 라 할 때, ${expr}$ 의 값은? (숫자만 쓰세요)", ["방정식의 양변에 $x-1$ 또는 $x+1$ 을 곱하면 $\\omega^3$ 의 값을 알 수 있어요.", "$\\omega^3=\\pm1$ 이면 $\\omega^6=1$ 이에요. 지수를 주기로 나눈 나머지만 보면 돼요."], "$\\omega$ 는 ${eq}$ 의 근이므로 ${rel}$ 입니다. 그러므로 거듭제곱은 ${per}$ 개마다 같은 값으로 되돌아오고, 지수를 ${per}$ 으로 나눈 나머지만 생각하면 ${step}$ 입니다. 따라서 구하는 값은 ${ans}$ 입니다."],
    en: ["Let $\\omega$ be a non-real root of ${eq}$. What is the value of ${expr}$? (digits only)", ["Multiplying both sides of the equation by $x-1$ or $x+1$ gives the value of $\\omega^3$.", "If $\\omega^3=\\pm1$ then $\\omega^6=1$. Only the exponent modulo the period matters."], "Since $\\omega$ is a root of ${eq}$, ${rel}$. The powers therefore repeat with period ${per}$, and reducing the exponents modulo ${per}$ gives ${step}$. So the value is ${ans}$."],
  },
  cm1_cubicOneReal: {
    ko: ["방정식 ${eq}=0$ 의 서로 다른 실근의 합을 $S$, 서로 다른 허근을 모두 곱한 값을 $T$ 라 할 때, $S+T$ 의 값은? (숫자만 쓰세요)", ["최고차항의 계수가 $1$ 인 정수 계수 방정식의 정수인 근은 상수항의 약수 중에 있어요. 인수정리로 확인해요.", "근 하나를 찾아 조립제법으로 나누면 낮은 차수의 식이 남아요. 남은 이차식의 판별식으로 허근인지 확인해요."], "인수분해하면 ${eq}={fac}$ 입니다. 이차식 ${quad}$ 의 판별식은 $D={D}<0$ 이므로 두 허근을 가지며 그 곱은 $T={q}$ 이고, 실근의 합은 $S={S}$ 입니다. 따라서 $S+T={ans}$ 입니다."],
    en: ["Let $S$ be the sum of the distinct real roots and $T$ the product of all distinct non-real roots of ${eq}=0$. What is $S+T$? (digits only)", ["An integer root of a monic integer-coefficient equation divides the constant term; test candidates with the factor theorem.", "Once you find a root, divide (synthetic division) to leave a lower-degree factor, and use the discriminant of the remaining quadratic to see that its roots are non-real."], "${eq}={fac}$. The discriminant of the quadratic ${quad}$ is $D={D}<0$, so it has two non-real roots whose product is $T={q}$, and the real roots add up to $S={S}$. Hence $S+T={ans}$."],
  },
  cm1_sysTwo: {
    ko: ["실수 $x$, $y$ 가 연립방정식 ${e1}$, ${e2}$ 의 해일 때, $x$ 의 최댓값은? (숫자만 쓰세요)", ["한 식을 인수분해하거나 한 문자를 다른 문자로 나타내어 문자의 수를 줄여요.", "가능한 모든 실수해 $(x, y)$ 를 구한 뒤 $x$ 의 값 중 가장 큰 것을 골라요."], "연립방정식을 풀면 $(x,\\ y)={sols}$ 입니다. 이 중 $x$ 의 최댓값은 ${ans}$ 입니다."],
    en: ["Real numbers $x$, $y$ satisfy both ${e1}$ and ${e2}$. What is the largest possible value of $x$? (digits only)", ["Factor one equation, or express one variable through the other, to reduce the number of unknowns.", "Find all real solutions $(x, y)$ and pick the largest $x$."], "Solving the system gives $(x,\\ y)={sols}$. The largest $x$ among them is ${ans}$."],
  },
  cm1_sysReal: {
    ko: ["연립방정식 ${e1}$, ${e2}$ 의 실수해 $(x, y)$ 가 존재하도록 하는 정수 $k$ 는 $-{M}\\le k\\le {M}$ 에서 모두 몇 개인가요? (숫자만 쓰세요)", ["한 식을 이용해 $y$ 를 없애면 $x$ 에 대한 이차방정식이 돼요.", "실수해를 가지려면 그 이차방정식의 판별식이 $0$ 이상이어야 해요."], "한 식으로 $y$ 를 없애면 $x$ 에 대한 이차방정식이 되고, 실수해를 가지려면 ${dcond}$ 이어야 합니다. 즉 ${kr}$ 이므로 $-{M}\\le k\\le {M}$ 안의 정수는 모두 ${ans}$ 개입니다."],
    en: ["For how many integers $k$ with $-{M}\\le k\\le {M}$ does the system ${e1}$, ${e2}$ have a real solution $(x, y)$? (digits only)", ["Eliminate $y$ with one equation; you get a quadratic in $x$.", "A real solution exists exactly when that quadratic has a non-negative discriminant."], "Eliminating $y$ gives a quadratic in $x$, which has a real root exactly when ${dcond}$. That means ${kr}$, so the number of integers in $-{M}\\le k\\le {M}$ is ${ans}$."],
  },
  cm1_linIneqCount: {
    ko: ["연립부등식 ${i1}$, ${i2}$ 의 해 중에서 정수 $x$ 는 모두 몇 개인가요? (숫자만 쓰세요)", ["각 부등식을 따로 풀어 $x$ 의 범위를 구한 다음 공통부분을 찾아요. 양변에 음수를 곱하거나 나누면 부등호의 방향이 바뀌어요.", "수직선에 두 범위를 그려 겹치는 부분에 들어 있는 정수를 세어요. 등호가 있는지에 주의해요."], "첫째 식의 해는 ${s1}$, 둘째 식의 해는 ${s2}$ 이므로 공통 범위는 ${s}$ 입니다. 이를 만족시키는 정수 $x$ 는 ${ints}$ 로 모두 ${ans}$ 개입니다."],
    en: ["How many integers $x$ satisfy both inequalities ${i1}$ and ${i2}$? (digits only)", ["Solve each inequality separately and take the common part. Multiplying or dividing by a negative number reverses the inequality sign.", "Draw both ranges on a number line and count the integers in the overlap; watch whether the endpoints are included."], "The first inequality gives ${s1}$ and the second gives ${s2}$, so the common range is ${s}$. The integers in it are ${ints}$, which is ${ans}$ integers."],
  },
  cm1_linIneqParam: {
    ko: ["연립부등식 ${i1}$, ${i2}$ 의 해 중에서 정수 $x$ 가 정확히 ${n}$ 개가 되도록 하는 정수 $k$ 의 값을 모두 더하면? (숫자만 쓰세요)", ["$k$ 가 없는 부등식부터 풀어 $x$ 의 범위를 구하고, 다른 부등식은 $x$ 의 범위를 $k$ 로 나타내요.", "두 범위가 겹치는 구간 안에 정수가 정확히 ${n}$ 개 들어 있으려면 구간의 끝이 어느 정수들 사이에 있어야 하는지 따져 보세요."], "첫째 식의 해는 ${s1}$, 둘째 식의 해는 ${s2}$ 입니다. 정수 $x$ 가 정확히 ${n}$ 개이려면 ${kr}$ 이어야 하므로 정수 $k$ 는 ${ks}$ 이고, 그 합은 ${ans}$ 입니다."],
    en: ["Exactly ${n}$ integers $x$ satisfy both ${i1}$ and ${i2}$. What is the sum of all possible integer values of $k$? (digits only)", ["Solve the inequality without $k$ first, and write the range of the other one in terms of $k$.", "Decide between which integers an endpoint must lie so that the overlap contains exactly ${n}$ integers."], "The first inequality gives ${s1}$ and the second gives ${s2}$. Exactly ${n}$ integers $x$ occur when ${kr}$, so the integers $k$ are ${ks}$ and their sum is ${ans}$."],
  },
  cm1_absIneqCount: {
    ko: ["부등식 ${expr}$ 의 해 중에서 정수 $x$ 는 모두 몇 개인가요? (숫자만 쓰세요)", ["$|A|<c$ 는 $-c<A<c$ 와 같은 뜻이에요 ($c>0$ 이고, $\\le$ 일 때도 마찬가지예요).", "절댓값 기호가 있는 식을 한쪽으로 모아 $|A|<c$ 꼴로 정리한 뒤 절댓값 기호를 없애요."], "정리하면 ${norm}$, 즉 ${chain}$ 이므로 ${sol}$ 입니다. 이를 만족시키는 정수 $x$ 는 ${ints}$ 로 모두 ${ans}$ 개입니다."],
    en: ["How many integers $x$ satisfy the inequality ${expr}$? (digits only)", ["$|A|<c$ means $-c<A<c$ (for $c>0$; the same holds with $\\le$).", "Collect the absolute-value term on one side to get the form $|A|<c$, then remove the absolute value."], "Simplifying gives ${norm}$, that is ${chain}$, so ${sol}$. The integers satisfying it are ${ints}$, which is ${ans}$ integers."],
  },
  cm1_absIneqRep: {
    ko: ["부등식 $|{mx}-a|{op}c$ 의 해가 ${lo}{op}x{op}{hi}$ 일 때, 상수 $a$, $c$ 에 대하여 $a+c$ 의 값은? (단, $c>0$) (숫자만 쓰세요)", ["$|A|{op}c$ 는 $-c{op}A{op}c$ 와 같은 뜻이에요.", "$a-c{op}{mx}{op}a+c$ 로 바꾼 뒤, $x$ 의 범위의 양 끝을 주어진 해와 비교하면 $a$, $c$ 에 대한 연립일차방정식이 돼요."], "$-c{op}{mx}-a{op}c$ 에서 $a-c{op}{mx}{op}a+c$ 이고 해가 ${lo}{op}x{op}{hi}$ 이므로 $a-c={mlo}$, $a+c={mhi}$ 입니다. 따라서 $a={a}$, $c={c}$ 이고 $a+c={ans}$ 입니다."],
    en: ["The solution of the inequality $|{mx}-a|{op}c$ is ${lo}{op}x{op}{hi}$. For the constants $a$ and $c$ (with $c>0$), what is $a+c$? (digits only)", ["$|A|{op}c$ means $-c{op}A{op}c$.", "Rewrite as $a-c{op}{mx}{op}a+c$ and compare the ends of the range of $x$ with the given solution: this gives linear equations in $a$ and $c$."], "From $-c{op}{mx}-a{op}c$ we get $a-c{op}{mx}{op}a+c$, and since the solution is ${lo}{op}x{op}{hi}$, $a-c={mlo}$ and $a+c={mhi}$. So $a={a}$, $c={c}$ and $a+c={ans}$."],
  },
  cm1_quadIneqSol: {
    ko: ["이차부등식 ${mx2}+ax+b{op}0$ 의 해가 ${sol}$ 일 때, 상수 $a$, $b$ 에 대하여 ${ask}$ 의 값은? (숫자만 쓰세요)", ["부등식의 해의 양 끝값은 이차방정식 ${mx2}+ax+b=0$ 의 두 근이에요.", "이차식을 ($x^2$ 의 계수)$\\times(x-\\alpha)(x-\\beta)$ 꼴로 나타내어 전개한 모양과 비교해요."], "해가 ${sol}$ 이므로 두 근은 ${lo}$, ${hi}$ 이고, $x^2$ 의 계수가 ${m}$ 이므로 ${mx2}+ax+b={fac}={full}$ 입니다. 따라서 $a={a}$, $b={b}$ 이고 ${ask}={ans}$ 입니다."],
    en: ["The solution of the quadratic inequality ${mx2}+ax+b{op}0$ is ${sol}$. For the constants $a$ and $b$, what is the value of ${ask}$? (digits only)", ["The endpoints of the solution are the two roots of ${mx2}+ax+b=0$.", "Write the quadratic as (coefficient of $x^2$)$\\times(x-\\alpha)(x-\\beta)$ and compare with the expanded form."], "Since the solution is ${sol}$, the roots are ${lo}$ and ${hi}$, and the coefficient of $x^2$ is ${m}$, so ${mx2}+ax+b={fac}={full}$. Hence $a={a}$, $b={b}$ and ${ask}={ans}$."],
  },

  cm1_quadIneqAlways: {
    ko: ["부등식 ${ineq}$ 의 해가 모든 실수가 되도록 하는 정수 $k$ 의 개수는? (숫자만 쓰세요)", ["$x^2$ 의 계수가 $k$ 이므로 $k=0$ 인 경우와 아닌 경우로 나누어요. $k\\ne0$ 이면 아래로 볼록하고 판별식이 $D<0$ (또는 $D\\le0$) 이어야 해요.", "판별식 $D$ 를 $k$ 에 대한 식으로 쓰고 부등식을 풀어요. 위로 볼록한 경우($k<0$)는 모든 실수에서 성립할 수 없어요."], "$k=0$ 이면 좌변이 상수 ${n}$ 하나뿐이고 이 값은 $0$ 보다 크므로 부등식이 항상 성립합니다. $k\\ne0$ 이면 아래로 볼록해야 하므로 $k>0$ 이고 $\\frac{D}{4}={d4}{rel}0$ 이어야 하며, 이를 풀면 ${kr}$ 입니다. 따라서 $k=0$ 을 포함하여 정수 $k$ 는 ${ks}$ 이므로 모두 ${ans}$ 개입니다."],
    en: ["For how many integers $k$ is every real number a solution of the inequality ${ineq}$? (digits only)", ["The coefficient of $x^2$ is $k$, so treat $k=0$ separately. For $k\\ne0$ the parabola must open upward and the discriminant must satisfy $D<0$ (or $D\\le0$).", "Write $D$ in terms of $k$ and solve the inequality. If it opens downward ($k<0$), the inequality cannot hold for all real $x$."], "For $k=0$ the left side is just the constant ${n}$, which is positive, so the inequality always holds. For $k\\ne0$ the parabola must open upward, so $k>0$ and $\\frac{D}{4}={d4}{rel}0$, which gives ${kr}$. Including $k=0$, the integers $k$ are ${ks}$, so there are ${ans}$ of them."],
  },
  cm1_divisorCount: {
    ko: ["자연수 $N={fac}$ 의 양의 약수 중에서 ${m}$ 의 배수인 것은 모두 몇 개인가요? (숫자만 쓰세요)", ["${m}$ 의 배수인 약수는 ${m}\\times t$ 꼴로 쓸 수 있어요. 이때 $t$ 가 될 수 있는 수를 생각해요.", "그런 약수는 ${m}\\times t$ 꼴이고, $t$ 는 $\\frac{N}{{m}}$ 의 약수예요."], "${m}$ 의 배수인 약수는 ${m}\\times t$ 꼴이고, $t$ 는 $\\frac{N}{{m}}={Nm}$ 의 약수입니다. 그 약수의 개수는 ${prod}={ans}$ 입니다."],
    en: ["How many positive divisors of $N={fac}$ are multiples of ${m}$? (digits only)", ["A divisor that is a multiple of ${m}$ is a divisor of $N$ that contains the factor ${m}$.", "Such a divisor has the form ${m}\\times t$ where $t$ is a divisor of $\\frac{N}{{m}}$."], "A divisor that is a multiple of ${m}$ has the form ${m}\\times t$ with $t$ a divisor of $\\frac{N}{{m}}={Nm}$. The number of such divisors is ${prod}={ans}$."],
  },

  cm1_coloring: {
    ko: ["영역이 ${n}$ 개 있고 번호는 ${regs}$ 입니다. 다음 쌍의 영역끼리만 서로 맞닿아 있습니다: ${edges}$. 맞닿아 있는 두 영역은 서로 다른 색으로 칠하려고 합니다. ${k}$ 가지 색을 사용할 수 있고 같은 색을 여러 영역에 칠해도 되며 사용하지 않는 색이 있어도 될 때, 모든 영역을 칠하는 방법의 수는? (숫자만 쓰세요)", ["칠하는 순서를 정하고, 영역을 하나씩 칠할 때 이미 칠해진 이웃 영역에 쓰인 색을 제외한 색의 수를 세요.", "앞에서 칠한 이웃 영역들이 같은 색인지 다른 색인지에 따라 쓸 수 있는 색의 수가 달라지면 경우를 나누어 합의 법칙을 써요."], "순서대로 칠하면서 쓸 수 있는 색의 수를 곱의 법칙과 합의 법칙으로 세면 ${work}={ans}$ 가지입니다."],
    en: ["There are ${n}$ regions numbered ${regs}$, and only the following pairs of regions touch each other: ${edges}$. Regions that touch must get different colors. With ${k}$ colors available (a color may be used for several regions, and some colors may stay unused), in how many ways can all regions be colored? (digits only)", ["Fix an order and color one region at a time, counting the colors not used by already-colored neighbours.", "If the number of available colors depends on whether earlier neighbours share a color, split into cases and add (sum rule)."], "Coloring in order and counting the available colors with the product and sum rules gives ${work}={ans}$ ways."],
  },
  cm1_permArrange: {
    ko: ["남학생 ${m}$ 명과 여학생 ${w}$ 명을 일렬로 세울 때, 여학생끼리는 어느 두 명도 서로 이웃하지 않도록 세우는 방법의 수는? (학생은 모두 서로 다른 사람입니다.) (숫자만 쓰세요)", ["이웃하지 않아야 하는 쪽(여학생)을 나중에 넣는 것이 편해요. 먼저 남학생을 일렬로 세워요.", "남학생 사이사이와 양 끝에 여학생이 들어갈 자리가 생겨요. 그 자리 중에서 서로 다른 자리를 골라 여학생을 세워요."], "남학생 ${m}$ 명을 먼저 세우는 방법은 ${m}!={mf}$ 가지입니다. 남학생 사이와 양 끝의 ${m1}$ 곳 중 서로 다른 ${w}$ 곳을 골라 여학생을 세우는 방법은 ${}_{{m1}}\\mathrm{P}_{{w}}={pv}$ 가지입니다. 따라서 ${mf}\\times{pv}={ans}$ 가지입니다."],
    en: ["${m}$ boys and ${w}$ girls (all different people) stand in a line so that no two girls are next to each other. In how many ways can they be arranged? (digits only)", ["It is easier to place the group that must not be adjacent (the girls) afterwards: first line up the boys.", "The boys leave gaps between them and at both ends. Choose different gaps for the girls and arrange them there."], "The boys can be lined up in ${m}!={mf}$ ways. Choosing ordered, distinct places for the ${w}$ girls among the ${m1}$ gaps (between boys and at both ends) can be done in ${}_{{m1}}\\mathrm{P}_{{w}}={pv}$ ways. Hence ${mf}\\times{pv}={ans}$ ways."],
  },
  cm1_permNumbers: {
    ko: ["서로 다른 숫자가 하나씩 적힌 카드 ${nc}$ 장이 있고, 적힌 숫자는 ${digs}$ 입니다. 이 중 ${r}$ 장을 뽑아 일렬로 늘어놓아 ${r}$ 자리 자연수를 만들 때, ${m}$ 의 배수는 모두 몇 개인가요? (맨 앞자리에는 $0$ 이 올 수 없습니다.) (숫자만 쓰세요)", ["${m}$ 의 배수인지는 일의 자리 숫자로 정해져요. 일의 자리에 올 수 있는 숫자부터 정해요.", "일의 자리를 정한 뒤 맨 앞자리는 $0$ 이 아닌 숫자 중에서, 나머지 자리는 남은 카드로 채워요 (곱의 법칙)."], "일의 자리에 올 수 있는 숫자는 ${Lstr}$ 입니다. 각각에 대해 (맨 앞자리를 고르는 방법의 수)$\\times$(나머지 자리를 채우는 방법의 수)를 구해 더하면 ${work}={ans}$ 입니다."],
    en: ["There are ${nc}$ cards, one for each of the different digits ${digs}$. Choosing ${r}$ of them and arranging them in a row forms a ${r}$-digit natural number (the first digit cannot be $0$). How many of these numbers are multiples of ${m}$? (digits only)", ["Being a multiple of ${m}$ depends on the last digit, so decide which digits can go last.", "After fixing the last digit, pick the first digit from the nonzero ones left, and fill the rest from the remaining cards (product rule)."], "The digits that can stand in the units place are ${Lstr}$. For each, multiply (ways to choose the first digit) by (ways to fill the remaining places) and add: ${work}={ans}$."],
  },
  cm1_combCommittee: {
    ko: ["남학생 ${m}$ 명과 여학생 ${w}$ 명 중에서 ${r}$ 명의 위원을 뽑으려 합니다. 특정한 남학생 한 명은 반드시 뽑고, 특정한 여학생 한 명은 뽑지 않으며, 여학생이 적어도 ${a}$ 명 포함되도록 뽑는 방법의 수는? (숫자만 쓰세요)", ["반드시 뽑는 한 명과 뽑지 않는 한 명을 정해 두면, 나머지 사람 중에서 남은 인원을 뽑는 문제가 돼요.", "여학생의 수가 ${a}$ 명, ${a}+1$ 명, $\\ldots$ 인 경우로 나누어 (여학생을 뽑는 방법의 수)$\\times$(남학생을 뽑는 방법의 수)를 더해요."], "남학생 한 명이 이미 뽑혔고 여학생 한 명은 제외되므로, 남학생 ${m1}$ 명과 여학생 ${w1}$ 명 중에서 ${r1}$ 명을 더 뽑되 여학생이 적어도 ${a}$ 명이어야 합니다. ${work}={ans}$ 입니다."],
    en: ["A committee of ${r}$ is chosen from ${m}$ boys and ${w}$ girls. One particular boy must be chosen, one particular girl must not be chosen, and at least ${a}$ girls must be on the committee. In how many ways can it be chosen? (digits only)", ["Once the person who must join and the person who must not are fixed, the rest is a selection of the remaining members from the remaining people.", "Split by the number of girls (${a}$, ${a}+1$, $\\ldots$) and add (ways to choose the girls)$\\times$(ways to choose the boys)."], "One boy is already chosen and one girl is excluded, so ${r1}$ more members are chosen from ${m1}$ boys and ${w1}$ girls with at least ${a}$ girls: ${work}={ans}$."],
  },
  cm1_gridPaths: {
    ko: ["좌표평면에서 점 $(0,0)$ 에서 점 $({a},{b})$ 까지 한 번에 $x$ 축 방향 또는 $y$ 축 방향으로 $+1$ 만큼씩만 이동하여 가는 최단 경로 중에서, 점 A$({p},{q})$ 지점을 지나고 점 B$({u},{v})$ 지점은 지나지 않는 경로는 모두 몇 가지인가요? (숫자만 쓰세요)", ["$(0,0)$ 에서 $(m,n)$ 까지의 최단 경로의 수는 오른쪽으로 $m$ 번, 위로 $n$ 번 가는 순서를 정하는 수 ${}_{m+n}\\mathrm{C}_{m}$ 이에요.", "'지나는' 경로는 구간별 경로의 수를 곱하고, '지나지 않는' 경로는 점 A 를 지나는 전체 경로에서 점 B 도 지나는 경로를 빼요."], "점 A 를 지나는 경로는 ${t1}$ 가지입니다. 이 중 점 B 도 지나는 경로는 ${t2}$ 가지입니다. 따라서 구하는 경로의 수는 ${ans}$ 입니다."],
    en: ["On the coordinate plane, you move from $(0,0)$ to $({a},{b})$ by steps of $+1$ in the $x$ direction or $+1$ in the $y$ direction. How many such shortest paths pass through the point A$({p},{q})$ but do not pass through the point B$({u},{v})$? (digits only)", ["The number of shortest paths from $(0,0)$ to $(m,n)$ is the number of orderings of $m$ steps right and $n$ steps up, ${}_{m+n}\\mathrm{C}_{m}$.", "For 'passes through', multiply the path counts of the stages; for 'does not pass', subtract from the paths through A those that also pass through B."], "The number of paths through A is ${t1}$. Of these, the number that also pass through B is ${t2}$. So the required number of paths is ${ans}$."],
  },
  cm1_matCayley: {
    ko: ["행렬 $A={A}$, $E={Emat}$ 에 대하여 $A^{{n}}=pA+qE$ 를 만족시키는 실수 $p$, $q$ 가 있다. ${ask}$ 의 값은? (숫자만 쓰세요)", ["$A^{{n}}$ 을 행렬의 곱셈으로 직접 계산해서 성분을 구해요.", "$pA+qE$ 의 성분을 $p$, $q$ 로 나타내어 $A^{{n}}$ 의 성분과 비교하면 $p$, $q$ 에 대한 연립방정식이 나와요."], "$A^{{n}}={Apow}$ 이고, 이것을 $pA+qE$ 의 성분과 비교하면 $p={p}$, $q={q}$ 입니다. 따라서 ${ask}={ans}$ 입니다."],
    en: ["For the matrices $A={A}$ and $E={Emat}$ there are real numbers $p$, $q$ with $A^{{n}}=pA+qE$. What is the value of ${ask}$? (digits only)", ["Compute $A^{{n}}$ directly by matrix multiplication to get its entries.", "Write the entries of $pA+qE$ in terms of $p$ and $q$ and compare with those of $A^{{n}}$; this gives equations for $p$ and $q$."], "$A^{{n}}={Apow}$, and comparing with the entries of $pA+qE$ gives $p={p}$, $q={q}$. Hence ${ask}={ans}$."],
  },
  cm1_matWord: {
    ko: ["두 가게 A, B 에서 ${ni}$ 종류의 물건을 팝니다. 행렬 $P={mp}$ 의 (i, j) 성분은 가게 i (1행: 가게 A, 2행: 가게 B) 에서 파는 j 번째 물건 한 개의 가격(원)이고, 행렬 $Q={mq}$ 의 (j, l) 성분은 갑(1열), 을(2열) 중 l 번째 사람이 사려는 j 번째 물건의 개수입니다. 갑과 을이 각각 필요한 물건을 모두 한 가게에서 사는데, 두 사람 모두 값이 더 싼 가게를 고른다고 할 때, 두 사람이 내는 금액의 합은 몇 원인가요? (숫자만 쓰세요)", ["가게 i 에서 사람 l 이 내는 금액은 $P$ 의 i 행과 $Q$ 의 l 열의 성분을 차례로 곱해서 더한 값이에요.", "그 값들이 곧 행렬 $PQ$ 의 성분이에요. $PQ$ 를 구한 뒤 열마다 더 작은 값을 골라 더해요."], "$PQ={pq}$ 입니다. 갑이 내는 금액은 가게 A 에서 ${pq11}$ 원, 가게 B 에서 ${pq21}$ 원이므로 더 싼 ${m1}$ 원이고, 을은 가게 A 에서 ${pq12}$ 원, 가게 B 에서 ${pq22}$ 원이므로 더 싼 ${m2}$ 원입니다. 따라서 합은 ${ans}$ 원입니다."],
    en: ["Two shops A and B sell ${ni}$ kinds of goods. The $(i, j)$ entry of the matrix $P={mp}$ is the price in won of one item of kind j at shop i (row 1: shop A, row 2: shop B), and the $(j, l)$ entry of $Q={mq}$ is the number of items of kind j that person l wants to buy (column 1: person 1, column 2: person 2). Each person buys everything at a single shop, and both choose the cheaper shop. What is the total amount the two pay, in won? (digits only)", ["The amount person l pays at shop i is the sum of products of row i of $P$ with column l of $Q$.", "Those amounts are exactly the entries of the product $PQ$. Compute $PQ$, then take the smaller value in each column and add."], "$PQ={pq}$. Person 1 pays ${pq11}$ won at shop A and ${pq21}$ won at shop B, so the cheaper ${m1}$ won; Person 2 pays ${pq12}$ won at A and ${pq22}$ won at B, so the cheaper ${m2}$ won. The total is ${ans}$ won."],
  },
};

// ---------- generators ----------
export const GEN = {
  cm1_polyProdCoef: (r, lvl) => {
    for (;;) {
      const deg = lvl === 1 ? 2 : 3;
      const mk = () => { const c = [r.nonzero(-5, 5)]; for (let i = 0; i < deg; i++) c.push(lvl === 1 || r.next() > 0.3 ? r.nonzero(-5, 5) : 0); return c; };
      const a = mk(), b = mk();
      const k = lvl === 1 ? r.pick([2, 3]) : r.pick([3, 4]);
      const terms = [];
      let ans = 0;
      for (let i = 0; i <= deg; i++) for (let j = 0; j <= deg; j++) if (deg - i + (deg - j) === k && a[i] && b[j]) { terms.push(`(${a[i]})\\cdot(${b[j]})`); ans += a[i] * b[j]; }
      if (terms.length < 2 || ans === 0) continue;
      return { v: { pa: poly(a), pb: poly(b), k, prod: poly(conv(a, b)), terms: terms.join("+") }, ans };
    }
  },

  cm1_polyDivQR: (r, lvl) => {
    for (;;) {
      const p = r.int(-4, 4), q0 = r.nonzero(-6, 6);
      const qd = lvl === 1 ? 1 : 2;
      const Qc = [r.nonzero(-3, 3)];
      for (let i = 0; i < qd; i++) Qc.push(r.int(-4, 4));
      const Rc = [r.int(-5, 5), r.int(-6, 6)];
      if (Rc[0] === 0 && Rc[1] === 0) continue;
      const D = [1, p, q0];
      const Pc = addP(conv(D, Qc), Rc);
      const t = r.pick([1, 2, -1, -2, 3]);
      const ans = evalPoly(Qc, t) + evalPoly(Rc, t);
      return { v: { pp: poly(Pc), dv: poly(D), qlead: `${cf(Qc[0])}x${qd === 2 ? "^2" : ""}`, qq: poly(Qc), rr: poly(Rc), t }, ans };
    }
  },

  cm1_remUnknown: (r, lvl) => {
    for (;;) {
      const n = lvl === 1 ? 3 : 4;
      const lead = lvl === 1 ? r.pick([1, 1, 2, -1]) : r.pick([1, 2, 3, -1, -2]);
      const j = lvl === 1 ? r.pick([1, 2]) : r.pick([1, 2, 3]);
      const m = lvl === 1 ? r.pick([1, 1, -1, 2]) : r.pick([1, 2, -1, 3, -2]);
      const kk = r.nonzero(-5, 5);
      const t = r.pick(lvl === 1 ? [1, -1, 2, -2] : [1, -1, 2, -2, 3, -3]);
      const co = [lead];
      for (let i = 1; i <= n; i++) co.push(r.int(-6, 6));
      co[n - j] = 0;
      let rest = 0;
      for (let d = 0; d <= n; d++) if (d !== j) rest += co[n - d] * t ** d;
      const A = m * t ** j;
      const R = rest + A * kk;
      if (Math.abs(R) > 600) continue;
      return { v: { pp: polyK(co, j, m), dv: lin(1, -t), R, t, lhs: lin(A, rest, "k") }, ans: kk };
    }
  },

  cm1_remQuadDiv: (r, lvl) => {
    for (;;) {
      const a = r.int(-4, 4), b = r.int(-4, 4);
      if (a === b) continue;
      const pr = lvl === 1 ? r.int(-3, 3) : r.nonzero(-7, 7), qr = lvl === 1 ? r.int(-6, 6) : r.int(-15, 15);
      if (pr === 0 && qr === 0) continue;
      const c = r.pick([0, 1, -1, 2, 3, -2]);
      return { v: { dv1: lin(1, -a), dv2: lin(1, -b), r1: pr * a + qr, r2: pr * b + qr, c, a, b, p: pr, q: qr, Rx: poly([pr, qr]) }, ans: pr * c + qr };
    }
  },

  cm1_identity: (r, lvl) => {
    const p = r.nonzero(-3, 3);
    const xp = lin(1, -p);
    if (lvl === 1) {
      const a = r.nonzero(-4, 4), b = r.nonzero(-5, 5), c = r.nonzero(-5, 5);
      const rhs = [a, b - 2 * a * p, a * p * p - b * p + c];
      const ask = r.pick(["a+b+c", "abc", "a-b+c", "a+2b+c"]);
      const ans = { "a+b+c": a + b + c, abc: a * b * c, "a-b+c": a - b + c, "a+2b+c": a + 2 * b + c }[ask];
      return { v: { lhs: `a(${xp})^2+b(${xp})+c`, rhs: poly(rhs), consts: "a, b, c", ask, sol: `a=${a},\\ b=${b},\\ c=${c}`, p }, ans };
    }
    const a = r.nonzero(-3, 3), b = r.nonzero(-5, 5), c = r.nonzero(-5, 5), d = r.nonzero(-5, 5);
    const rhs = [a, b - 3 * a * p, 3 * a * p * p - 2 * b * p + c, -a * p ** 3 + b * p * p - c * p + d];
    const ask = r.pick(["a+b+c+d", "a-b+c-d", "a+b-c+d", "2a+b+c+d"]);
    const ans = { "a+b+c+d": a + b + c + d, "a-b+c-d": a - b + c - d, "a+b-c+d": a + b - c + d, "2a+b+c+d": 2 * a + b + c + d }[ask];
    return { v: { lhs: `a(${xp})^3+b(${xp})^2+c(${xp})+d`, rhs: poly(rhs), consts: "a, b, c, d", ask, sol: `a=${a},\\ b=${b},\\ c=${c},\\ d=${d}`, p }, ans };
  },


  cm1_symmetricEval: (r) => {
    for (;;) {
      const s = r.nonzero(-7, 7), p = r.nonzero(-9, 9);
      const dd = s * s - 4 * p; // real x, y exist iff (x-y)^2 = (x+y)^2 - 4xy >= 0
      if (dd < 0) continue;
      const types = [
        ["x^3+y^3", s ** 3 - 3 * p * s, `(x+y)^3-3xy(x+y)=(${s})^3-3\\cdot(${p})(${s})=${s ** 3 - 3 * p * s}`],
        ["x^4+y^4", (s * s - 2 * p) ** 2 - 2 * p * p, `(x^2+y^2)^2-2(xy)^2=(${s * s - 2 * p})^2-2\\cdot(${p})^2=${(s * s - 2 * p) ** 2 - 2 * p * p}`],
      ];
      const [expr, ans, work] = r.pick(types);
      return { v: { cond: `x+y=${s},\\ xy=${p}`, expr, work, dd }, ans };
    }
  },

  cm1_symmetricInv: (r) => {
    for (;;) {
      const k = r.nonzero(-8, 8);
      if (Math.abs(k) < 2) continue; // a real x with x+1/x=k needs |k| >= 2
      const types = [
        ["x^2+\\frac{1}{x^2}", k * k - 2, `(x+\\frac{1}{x})^2-2=(${k})^2-2=${k * k - 2}`],
        ["x^3+\\frac{1}{x^3}", k ** 3 - 3 * k, `(x+\\frac{1}{x})^3-3(x+\\frac{1}{x})=(${k})^3-3\\cdot(${k})=${k ** 3 - 3 * k}`],
        ["x^4+\\frac{1}{x^4}", (k * k - 2) ** 2 - 2, `(x^2+\\frac{1}{x^2})^2-2=(${k * k - 2})^2-2=${(k * k - 2) ** 2 - 2}`],
      ];
      const [expr, ans, work] = r.pick(types);
      return { v: { k, expr, work }, ans };
    }
  },

  cm1_factorEval: (r) => {
    const N = r.int(6, 99);
    const t = r.pick([
      [`\\frac{${N}^3-1}{${N}^2+${N}+1}`, "(N-1)(N^2+N+1)", `N-1=${N}-1`, N - 1],
      [`\\frac{${N}^3+1}{${N}^2-${N}+1}`, "(N+1)(N^2-N+1)", `N+1=${N}+1`, N + 1],
      [`\\frac{${N}^4+${N}^2+1}{${N}^2+${N}+1}`, "(N^2+N+1)(N^2-N+1)", `N^2-N+1=${N}^2-${N}+1`, N * N - N + 1],
      [`\\frac{${N}^4-1}{${N}^2+1}`, "(N^2+1)(N+1)(N-1)", `(N+1)(N-1)=(${N}+1)(${N}-1)`, N * N - 1],
    ]);
    return { v: { expr: t[0], N, fac: t[1], simp: t[2] }, ans: t[3] };
  },


  cm1_iPower: (r, lvl) => {
    for (;;) {
      const [z, zs] = r.pick(lvl === 1 ? IP_L1 : IP_L2);
      const pw = ipows(zs);
      const a = r.int(7, 60), b = r.int(7, 60), p = r.nonzero(-6, 6), q0 = r.nonzero(-6, 6);
      if (a === b || a % 4 === b % 4) continue;
      const va = pw[a % 4], vb = pw[b % 4];
      const re = p * va[0] + q0 * vb[0], im = p * va[1] + q0 * vb[1];
      const expr = `${cf(p)}z^{${a}}${q0 < 0 ? "-" : "+"}${Math.abs(q0) === 1 ? "" : Math.abs(q0)}z^{${b}}`;
      const work = `z^{${a}}=z^{${a % 4}}=${cxs(va[0], va[1])},\\ z^{${b}}=z^{${b % 4}}=${cxs(vb[0], vb[1])},\\ ${expr}=(${p})\\cdot(${cxs(va[0], va[1])})+(${q0})\\cdot(${cxs(vb[0], vb[1])})=${cxs(re, im)}`;
      return { v: { z, zs, expr, work, a, b, p, q: q0 }, ans: re + im };
    }
  },

  cm1_iPowerSum: (r) => {
    for (;;) {
      const [z, zs] = r.pick([...IP_L1, ...IP_L2]);
      const pw = ipows(zs);
      const n = r.int(6, 60), c = r.pick([2, 3, 4, 5, -2, -3, -4]);
      const rm = n % 4;
      if (rm === 0) continue;
      let re = 0, im = 0;
      for (let k = 1; k <= rm; k++) { re += pw[k][0]; im += pw[k][1]; }
      const left = ["z", "z+z^2", "z+z^2+z^3"][rm - 1];
      const val = cxs(re, im);
      return { v: { z, zs, n, c, expr: `${c}\\left(z+z^2+z^3+\\cdots+z^{${n}}\\right)`, q4: Math.floor(n / 4), rm, work: `${left}=${val},\\ ${c}\\cdot(${val})=${cxs(c * re, c * im)}` }, ans: c * (re + im) };
    }
  },


  cm1_complexCond: (r, lvl) => {
    if (lvl === 1) {
      for (;;) {
        const a = r.pick([1, 2, 3, -1, -2, -3]), b = r.nonzero(-4, 4), c = r.nonzero(-4, 4);
        if ((b * c) % a !== 0) continue;
        const x = (b * c) / a;
        const ci = c === 1 ? "+i" : c === -1 ? "-i" : `${sg(c)}i`;
        const iv = b * x + a * c;
        return { v: { zs: `(${cplx(a, b)})(x${ci})`, re: poly([a, -b * c]), im: poly([b, a * c]), roots: `x=${x}`, chk: `${iv}\\ne0\\ (x=${x})` }, ans: x };
      }
    }
    for (;;) {
      const [p, q0, s] = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)];
      if (p === q0 || q0 === s || p === s) continue;
      const re = poly([1, -(p + q0), p * q0]), im = poly([1, -(p + s), p * s]);
      const rts = [p, q0].sort((x, y) => x - y);
      const chk = rts.map((x0) => { const val = (x0 - p) * (x0 - s); return val === 0 ? `0\\ (x=${x0})` : `${val}\\ne0\\ (x=${x0})`; }).join(",\\ ");
      return { v: { zs: `(${re})+(${im})i`, re, im, roots: `x=${rts[0]},\\ x=${rts[1]}`, chk }, ans: q0 };
    }
  },


  cm1_discrimCount: (r, lvl) => {
    for (;;) {
      const m = r.pick([2, -2]), a = r.int(-4, 4);
      const n1 = lvl === 1 ? 0 : r.nonzero(-4, 4), n0 = lvl === 1 ? r.int(2, 16) : r.int(-6, 12);
      const lo = r.int(-8, -1), hi = lo + r.int(6, 14);
      const ks = [];
      for (let k = lo; k <= hi; k++) if ((k + a) * (k + a) - (n1 * k + n0) < 0) ks.push(k);
      if (ks.length < 1 || ks.length > 14 || ks.length === hi - lo + 1) continue;
      const mid = `${m < 0 ? "-" : "+"}2${a === 0 ? "k" : `(k${sg(a)})`}x`;
      const cst = n1 === 0 ? sg(n0) : sgnAppend(lin(n1, n0, "k"));
      return { v: { eq: `x^2${mid}${cst}`, lo, hi, d4: poly([1, 2 * a - n1, a * a - n0], "k"), kr: openRange(2 * a - n1, a * a - n0), ks: seq(ks[0], ks[ks.length - 1]) }, ans: ks.length };
    }
  },

  cm1_vietaExpr: (r, lvl) => {
    for (;;) {
      const a = lvl === 1 ? 1 : r.pick([2, 3, 4, 5, -1, -2, -3]);
      const b = r.int(-9, 9), c = r.nonzero(-9, 9);
      const S = q(-b, a), P = q(c, a);
      const sP = `(${qt(S)})`, pP = `(${qt(P)})`;
      const sq = S.mul(S);
      const T = lvl === 1
        ? [
          ["\\alpha^2+\\beta^2", sq.sub(P.mul(2)), `(\\alpha+\\beta)^2-2\\alpha\\beta=${sP}^2-2\\cdot${pP}`],
          ["\\alpha^2\\beta+\\alpha\\beta^2", P.mul(S), `\\alpha\\beta(\\alpha+\\beta)=${pP}${sP}`],
          ["(\\alpha+1)(\\beta+1)", P.add(S).add(1), `\\alpha\\beta+(\\alpha+\\beta)+1=${pP}+${sP}+1`],
          ["(\\alpha-\\beta)^2", sq.sub(P.mul(4)), `(\\alpha+\\beta)^2-4\\alpha\\beta=${sP}^2-4\\cdot${pP}`],
          ["(\\alpha-2)(\\beta-2)", P.sub(S.mul(2)).add(4), `\\alpha\\beta-2(\\alpha+\\beta)+4=${pP}-2\\cdot${sP}+4`],
        ]
        : [
          ["\\frac{1}{\\alpha}+\\frac{1}{\\beta}", S.div(P), `\\frac{\\alpha+\\beta}{\\alpha\\beta}=${sP}\\div${pP}`],
          ["\\frac{\\beta}{\\alpha}+\\frac{\\alpha}{\\beta}", sq.sub(P.mul(2)).div(P), `\\frac{(\\alpha+\\beta)^2-2\\alpha\\beta}{\\alpha\\beta}=\\left(${sP}^2-2\\cdot${pP}\\right)\\div${pP}`],
          ["\\alpha^3+\\beta^3", S.mul(sq).sub(P.mul(S).mul(3)), `(\\alpha+\\beta)^3-3\\alpha\\beta(\\alpha+\\beta)=${sP}^3-3\\cdot${pP}${sP}`],
          ["\\frac{1}{\\alpha^2}+\\frac{1}{\\beta^2}", sq.sub(P.mul(2)).div(P.mul(P)), `\\frac{(\\alpha+\\beta)^2-2\\alpha\\beta}{(\\alpha\\beta)^2}=\\left(${sP}^2-2\\cdot${pP}\\right)\\div${pP}^2`],
        ];
      const [expr, val, work] = r.pick(T);
      if (Number(val.q) > 12 || Math.abs(qNum(val)) > 2000) continue; // keep the denominators of the answers small
      return { v: { eq: poly([a, b, c]), expr, sf: qt(S), pf: qt(P), work, res: qt(val) }, ans: qNum(val) };
    }
  },

  cm1_vietaUnknown: (r, lvl) => {
    const kinds = lvl === 1 ? ["ratio", "sumsq"] : ["diff", "prodsum", "recip"];
    for (;;) {
      const kind = r.pick(kinds);
      let k, c, cond, work;
      if (kind === "ratio") {
        const t = r.pick([2, 3, 4]), m = r.int(1, 4);
        k = (1 + t) * m; c = t * m * m; cond = `\\beta=${t}\\alpha`;
        work = `\\alpha+\\beta=${1 + t}\\alpha=k,\\ \\alpha\\beta=${t}\\alpha^2=${c}\\ \\Rightarrow\\ \\alpha=\\pm${m},\\ k=${1 + t}\\alpha=${k}\\ (k>0)`;
      } else if (kind === "sumsq") {
        k = r.int(2, 9); c = r.nonzero(-9, 9);
        const N = k * k - 2 * c;
        if (N <= 0) continue;
        cond = `\\alpha^2+\\beta^2=${N}`;
        work = `\\alpha^2+\\beta^2=k^2-2\\cdot(${c})=${N}\\ \\Rightarrow\\ k^2=${N + 2 * c}\\ \\Rightarrow\\ k=${k}`;
      } else if (kind === "diff") {
        k = r.int(2, 9); c = 0;
        const d = r.int(1, 10);
        if ((k - d) % 2 !== 0) continue;
        c = (k * k - d * d) / 4;
        if (c === 0) continue;
        cond = `|\\alpha-\\beta|=${d}`;
        work = `(\\alpha-\\beta)^2=k^2-4\\cdot(${c})=${d * d}\\ \\Rightarrow\\ k^2=${d * d + 4 * c}\\ \\Rightarrow\\ k=${k}`;
      } else if (kind === "prodsum") {
        k = r.int(2, 9); c = r.nonzero(-8, 8);
        cond = `\\alpha^2\\beta+\\alpha\\beta^2=${c * k}`;
        work = `\\alpha\\beta(\\alpha+\\beta)=(${c})k=${c * k}\\ \\Rightarrow\\ k=${k}`;
      } else {
        k = r.int(2, 9); c = r.nonzero(-9, 9);
        if (Math.abs(c) === 1) continue;
        cond = `\\frac{1}{\\alpha}+\\frac{1}{\\beta}=${tfrac(k, c)}`;
        work = `\\frac{\\alpha+\\beta}{\\alpha\\beta}=\\frac{k}{${c}}=${tfrac(k, c)}\\ \\Rightarrow\\ k=${k}`;
      }
      return { v: { cs: sg(c), cond, c, work }, ans: k };
    }
  },

  cm1_rootSignCond: (r, lvl) => {
    for (;;) {
      const t = lvl === 1 ? 0 : r.pick([1, 2, -1, -2, 3]);
      const m = r.int(-4, 4), n = r.int(-8, 12);
      if (m === 2 * t || (m === 0 && n === 0)) continue;
      const ok = (k) => k * k - (m * k + n) > 0 && k > t && t * t - 2 * k * t + m * k + n > 0;
      let ans = null;
      for (let k = t + 1; k <= t + 40; k++) if (ok(k)) { ans = k; break; }
      if (ans === null || ans - t > 12 || ans - t < 2) continue;
      const cst = m === 0 ? sg(n) : sgnAppend(lin(m, n, "k"));
      return { v: { eq: `x^2-2kx${cst}`, t, d4: poly([1, -m, -n], "k"), ft: lin(m - 2 * t, t * t + n, "k") }, ans };
    }
  },

  cm1_parabolaLine: (r, lvl) => {
    const a = lvl === 1 ? 1 : r.pick([2, 3, -1, -2, -3]);
    const u = r.int(-3, 3), m = r.nonzero(-4, 4), c = r.int(-6, 6);
    const b = m + 2 * a * u, k = c - a * u * u;
    return { v: { f: poly([a, b, c]), g: `${cf(m)}x+k`, eq2: `${poly([a, b - m, c])}-k`, bm: b - m, a, c }, ans: k };
  },

  cm1_parabolaLineCount: (r) => {
    for (;;) {
      const a = r.pick([1, 2, 3, -1, -2, -3]), m = r.nonzero(-4, 4), b = r.int(-6, 6), c = r.int(-6, 6);
      const bm = b - m;
      const th = q(4 * a * c - bm * bm, 4 * a); // D < 0  <=>  k < th (a > 0)  or  k > th (a < 0)
      const lo = qfloor(th) - r.int(2, 7), hi = qfloor(th) + r.int(2, 7);
      const ks = [];
      for (let k = lo; k <= hi; k++) if (bm * bm - 4 * a * (c - k) < 0) ks.push(k);
      if (ks.length < 2 || ks.length > 12 || ks.length === hi - lo + 1) continue;
      return { v: { f: poly([a, b, c]), g: `${cf(m)}x+k`, eq2: `${poly([a, bm, c])}-k`, bm, a, c, dk: lin(4 * a, bm * bm - 4 * a * c, "k"), kr: `k${a > 0 ? "<" : ">"}${qt(th)}`, ks: seq(ks[0], ks[ks.length - 1]), lo, hi }, ans: ks.length };
    }
  },

  cm1_parabolaXaxis: (r) => {
    for (;;) {
      const p = r.pick([1, 2, 3, -1, -2, -3]);
      const r1 = r.int(-5, 5), r2 = r.int(-5, 6);
      if (r2 <= r1) continue;
      const sm = r1 + r2;
      return { v: { f: `${poly([p, -p * sm, 0])}+k`, d: r2 - r1, p, sm, ab: r1 * r2 }, ans: p * r1 * r2 };
    }
  },

  cm1_quadRange: (r, lvl) => {
    const a = lvl === 1 ? r.pick([1, -1, 2, -2]) : r.pick([1, -1, 2, -2, 3, -3]);
    const m = r.int(-4, 3), n = m + r.int(3, 8);
    const h = lvl === 1 ? r.int(m + 1, n - 1) : r.int(m - 4, n + 4);
    const kv = r.int(-6, 6);
    const co = [a, -2 * a * h, a * h * h + kv];
    const fm = evalPoly(co, m), fn = evalPoly(co, n);
    const cand = [fm, fn];
    if (h >= m && h <= n) cand.push(kv);
    return { v: { f: poly(co), m, n, h, kv, fm, fn }, ans: Math.max(...cand) + Math.min(...cand) };
  },

  cm1_quadRevenue: (r, lvl) => {
    const s = lvl === 1 ? 100 : r.pick([50, 200]);
    const c = lvl === 1 ? r.int(2, 5) : r.int(2, 9);
    const e = lvl === 1 ? r.int(2, 8) : r.int(2, 9);
    const ts = lvl === 1 ? r.int(2, 5) : r.int(3, 9);
    const w = lvl === 1 ? r.int(4, 25) * 100 : r.int(6, 30) * 50;
    const a = w + s * e, b = c * (e + 2 * ts);
    return { v: { w, a, b, s, c, e1: s * e, tstar: ts }, ans: s * c * (e + ts) ** 2 };
  },

  cm1_quadFence: (r, lvl) => {
    const j = lvl === 1 ? r.int(1, 2) : r.int(3, 5);
    const k = j + 2;
    const u = lvl === 1 ? r.int(3, 9) : r.int(2, 7);
    return { v: { L: 2 * k * u, j, k, u }, ans: k * u * u };
  },


  cm1_omega: (r, lvl) => {
    for (;;) {
      const six = r.next() < 0.5;
      const per = six ? 6 : 3;
      const tk = (k) => (six ? [2, 1, -1, -2, -1, 1][k % 6] : [2, -1, -1][k % 3]);
      const eq = six ? "x^2-x+1=0" : "x^2+x+1=0";
      const rel = six ? "(\\omega+1)(\\omega^2-\\omega+1)=\\omega^3+1=0\\ \\Rightarrow\\ \\omega^3=-1,\\ \\omega^6=1" : "(\\omega-1)(\\omega^2+\\omega+1)=\\omega^3-1=0\\ \\Rightarrow\\ \\omega^3=1";
      const wr = (e) => `\\left(\\omega^{${e}}+\\frac{1}{\\omega^{${e}}}\\right)`;
      if (lvl === 1) {
        const a = r.int(7, 120), b = r.int(7, 120), p = r.nonzero(-5, 5), q0 = r.nonzero(-5, 5);
        if (a % per === b % per) continue;
        const ta = tk(a), tb = tk(b), ans = p * ta + q0 * tb;
        const red = (e) => `\\omega^{${e}}+\\frac{1}{\\omega^{${e}}}=\\omega^{${e % per}}+\\frac{1}{\\omega^{${e % per}}}=${tk(e)}`;
        const expr = `${cf(p)}${wr(a)}${q0 < 0 ? "-" : "+"}${Math.abs(q0) === 1 ? "" : Math.abs(q0)}${wr(b)}`;
        return { v: { eq, expr, rel, per, step: `${red(a)},\\ ${red(b)}\\ \\Rightarrow\\ (${p})\\cdot(${ta})+(${q0})\\cdot(${tb})=${ans}`, a, b, p, q: q0 }, ans };
      }
      const n = r.int(7, 60), c = r.pick([2, 3, 4, 5, -2, -3]);
      const rr = n % per, qn = Math.floor(n / per);
      if (rr === 0) continue;
      let sum = 0;
      const ts = [];
      for (let k = 1; k <= rr; k++) { sum += tk(k); ts.push(`(${tk(k)})`); }
      const expr = `${c}\\left[\\left(\\omega+\\frac{1}{\\omega}\\right)+\\left(\\omega^{2}+\\frac{1}{\\omega^{2}}\\right)+\\cdots+\\left(\\omega^{${n}}+\\frac{1}{\\omega^{${n}}}\\right)\\right]`;
      return { v: { eq, expr, rel, per, step: `${n}=${per}\\times${qn}+${rr},\\ ${c}\\left[0\\times${qn}+${ts.join("+")}\\right]=${c}\\cdot(${sum})=${c * sum}`, n, c }, ans: c * sum };
    }
  },

  cm1_cubicOneReal: (r, lvl) => {
    for (;;) {
      const p = r.int(-5, 5), q0 = r.int(1, 9);
      if (p * p >= 4 * q0) continue;
      const quad = poly([1, p, q0]);
      const D = p * p - 4 * q0;
      if (lvl === 1) {
        const rt = r.nonzero(-4, 4);
        return { v: { eq: poly(conv([1, -rt], [1, p, q0])), fac: `(${lin(1, -rt)})(${quad})`, quad, D, q: q0, S: rt }, ans: rt + q0 };
      }
      const a = r.nonzero(-4, 4), b = r.nonzero(-4, 4);
      if (a === b) continue;
      return { v: { eq: poly(conv(conv([1, -a], [1, -b]), [1, p, q0])), fac: `(${lin(1, -a)})(${lin(1, -b)})(${quad})`, quad, D, q: q0, S: a + b }, ans: a + b + q0 };
    }
  },

  cm1_sysTwo: (r, lvl) => {
    const pair = (x, y) => `(${x},${y})`;
    for (;;) {
      let e1, e2, sols;
      if (lvl === 1) {
        const type = r.pick(["A", "B1", "B2"]);
        if (type === "A") {
          const r1 = r.int(-6, 6), r2 = r.int(-6, 6);
          if (r1 === r2) continue;
          e1 = `x+y=${r1 + r2}`; e2 = `xy=${r1 * r2}`; sols = [[r1, r2], [r2, r1]];
        } else if (type === "B1") {
          const m = r.pick([1, 2, 3, -1, -2, -3]), x1 = r.nonzero(-5, 5), x2 = r.nonzero(-5, 5);
          if (x1 === x2) continue;
          const n = -m * (x1 + x2);
          e1 = `y=${lin(m, n)}`; e2 = `xy=${-m * x1 * x2}`; sols = [[x1, m * x1 + n], [x2, m * x2 + n]];
        } else {
          const d = r.nonzero(-4, 4), x1 = r.int(-6, 6), x2 = -d - x1;
          if (x1 === x2) continue;
          e1 = `y=x${sg(d)}`; e2 = `x^2+y^2=${x1 * x1 + (x1 + d) ** 2}`; sols = [[x1, x1 + d], [x2, x2 + d]];
        }
      } else if (r.next() < 0.5) {
        const a = r.int(-3, 4), b = r.int(-3, 4);
        if (a === b || a === -1 || b === -1) continue;
        const w = r.nonzero(-2, 2), c0 = (a + 1) * (b + 1) * w;
        const y1 = c0 / (a + 1), y2 = c0 / (b + 1);
        e1 = `x^2${term(-(a + b), "xy")}${term(a * b, "y^2")}=0`; e2 = `x+y=${c0}`; sols = [[a * y1, y1], [b * y2, y2]];
      } else {
        const x1 = r.int(2, 9), y1 = r.int(1, x1 - 1), sgn = r.pick([1, -1]);
        e1 = `x^2+y^2=${x1 * x1 + y1 * y1}`; e2 = `xy=${sgn * x1 * y1}`;
        sols = sgn === 1 ? [[x1, y1], [y1, x1], [-x1, -y1], [-y1, -x1]] : [[x1, -y1], [-y1, x1], [-x1, y1], [y1, -x1]];
      }
      return { v: { e1, e2, sols: sols.map(([x, y]) => pair(x, y)).join(",\\ ") }, ans: Math.max(...sols.map((s) => s[0])) };
    }
  },

  cm1_sysReal: (r, lvl) => {
    if (lvl === 1) {
      const N = r.int(2, 40), f = Math.floor(Math.sqrt(2 * N) + 1e-9);
      const M = f + r.int(2, 6);
      return { v: { e1: r.pick(["x+y=k", "x-y=k"]), e2: `x^2+y^2=${N}`, M, dcond: `\\frac{D}{4}=${2 * N}-k^2\\ge0`, kr: `-${f}\\le k\\le ${f}` }, ans: 2 * f + 1 };
    }
    throw new Error("cm1_sysReal has a single level");
  },

  cm1_linIneqCount: (r, lvl) => {
    const ops = ["lt", "le", "gt", "ge"];
    const mk = () => {
      const op = r.pick(ops);
      if (lvl === 1) {
        const a = r.nonzero(-4, 5), c = r.int(-4, 5), b = r.int(-9, 9), d = r.int(-9, 9);
        if (a === c) return null;
        return { tex: `${lin(a, b)}${OPS[op]}${c === 0 ? d : lin(c, d)}`, A: q(a), B: q(b), C: q(c), D: q(d), op };
      }
      const a1 = r.nonzero(-3, 4), a2 = r.nonzero(-3, 4), b1 = r.int(-6, 6), b2 = r.int(-6, 6), m1 = r.pick([2, 3, 4, 5]), m2 = r.pick([2, 3, 4, 5]);
      const A = q(a1, m1), C2 = q(a2, m2);
      if (A.sub(C2).p === 0n) return null;
      return { tex: `\\frac{${lin(a1, b1)}}{${m1}}${OPS[op]}\\frac{${lin(a2, b2)}}{${m2}}`, A, B: q(b1, m1), C: C2, D: q(b2, m2), op };
    };
    const solve = (g) => { const co = g.A.sub(g.C); const val = g.D.sub(g.B).div(co); return { op: co.p < 0n ? FLIP[g.op] : g.op, val }; };
    for (;;) {
      const g1 = mk(), g2 = mk();
      if (!g1 || !g2) continue;
      const s1 = solve(g1), s2 = solve(g2);
      const low = [s1, s2].filter((s) => s.op === "gt" || s.op === "ge"), up = [s1, s2].filter((s) => s.op === "lt" || s.op === "le");
      if (low.length !== 1 || up.length !== 1) continue;
      const lo = low[0], hi = up[0];
      const first = lo.op === "gt" ? qfloor(lo.val) + 1 : qceil(lo.val);
      const last = hi.op === "lt" ? qceil(hi.val) - 1 : qfloor(hi.val);
      const cnt = last - first + 1;
      if (cnt < 2 || cnt > 12) continue;
      const one = (s) => `x${OPS[s.op]}${qt(s.val)}`;
      return { v: { i1: g1.tex, i2: g2.tex, s1: one(s1), s2: one(s2), s: `${qt(lo.val)}${lo.op === "gt" ? "<" : "\\le "}x${hi.op === "lt" ? "<" : "\\le "}${qt(hi.val)}`, ints: seq(first, last) }, ans: cnt };
    }
  },

  cm1_linIneqParam: (r) => {
    for (;;) {
      const lowerFirst = r.next() < 0.5;
      const a = r.pick([1, 2, 3, -1, -2]), b = r.int(-6, 6), c = r.int(-6, 9);
      const lowerOps = a > 0 ? ["gt", "ge"] : ["lt", "le"], upperOps = a > 0 ? ["lt", "le"] : ["gt", "ge"];
      const op1 = r.pick(lowerFirst ? lowerOps : upperOps);
      const m = r.pick([2, 3, 4, 5]);
      const op2 = r.pick(lowerFirst ? ["lt", "le"] : ["gt", "ge"]);
      const n = r.int(2, 5);
      const ks = [];
      for (let k = -150; k <= 150; k++) {
        let cnt = 0;
        for (let x = -200; x <= 200; x++) if (okOp(a * x + b, op1, c) && okOp(m * x, op2, k)) cnt++;
        if (cnt === n) ks.push(k);
      }
      if (ks.length !== m || ks[ks.length - 1] - ks[0] !== m - 1 || ks[0] < -120 || ks[ks.length - 1] > 120) continue;
      const g = { A: q(a), B: q(b), C: q(0), D: q(c), op: op1 };
      const co = g.A.sub(g.C);
      const val = g.D.sub(g.B).div(co);
      const sOp = co.p < 0n ? FLIP[op1] : op1;
      return { v: { i1: `${lin(a, b)}${OPS[op1]}${c}`, i2: `${m}x${OPS[op2]}k`, n, s1: `x${OPS[sOp]}${qt(val)}`, s2: `x${OPS[op2]}\\frac{k}{${m}}`, kr: `${ks[0]}\\le k\\le ${ks[ks.length - 1]}`, ks: ks.join(", ") }, ans: ks.reduce((s, x) => s + x, 0) };
    }
  },

  cm1_absIneqCount: (r, lvl) => {
    for (;;) {
      const a = r.pick([1, 2, 3, 4, -1, -2, -3]), b = r.int(-9, 9);
      const strict = r.next() < 0.5, op = strict ? "<" : "\\le ";
      let mm = 1, d = 0, c;
      if (lvl === 1) c = r.int(2, 14);
      else { mm = r.pick([2, 3]); d = r.nonzero(-8, 8); c = d + r.int(mm, 9 * mm); }
      const rr = q(c - d, mm);
      const xs = [];
      for (let x = -100; x <= 100; x++) { const l = mm * Math.abs(a * x + b) + d; if (strict ? l < c : l <= c) xs.push(x); }
      if (xs.length < 2 || xs.length > 14) continue;
      const inner = lin(a, b);
      const b1 = q(-b).sub(rr).div(q(a)), b2 = q(-b).add(rr).div(q(a));
      const lo = qsign(b1.sub(b2)) <= 0 ? b1 : b2, hi = lo === b1 ? b2 : b1;
      const first = strict ? qfloor(lo) + 1 : qceil(lo), last = strict ? qceil(hi) - 1 : qfloor(hi);
      if (first !== xs[0] || last !== xs[xs.length - 1]) throw new Error("absIneqCount: interval/brute mismatch");
      const norm = `|${inner}|${op}${qt(rr)}`;
      return { v: { expr: lvl === 1 ? `|${inner}|${op}${c}` : `${mm}|${inner}|${sg(d)}${op}${c}`, norm, chain: `-${qt(rr)}${op}${inner}${op}${qt(rr)}`, sol: `${qt(lo)}${op}x${op}${qt(hi)}`, ints: seq(first, last) }, ans: xs.length };
    }
  },

  cm1_absIneqRep: (r, lvl) => {
    const m = lvl === 1 ? 1 : r.pick([2, 3, 4]);
    const c = lvl === 1 ? r.int(1, 8) : r.int(1, 9);
    const a = r.int(-8, 8);
    const op = r.pick(["<", "\\le "]);
    return { v: { mx: m === 1 ? "x" : `${m}x`, op, lo: qt(q(a - c, m)), hi: qt(q(a + c, m)), mlo: a - c, mhi: a + c, a, c }, ans: a + c };
  },

  cm1_quadIneqSol: (r, lvl) => {
    const m = lvl === 1 ? r.pick([1, -1]) : r.pick([2, 3, -2, -3]);
    const am = Math.abs(m);
    let lo, hi;
    if (am === 1) { const l = r.int(-6, 5); lo = q(l); hi = q(l + r.int(1, 8)); }
    else { lo = q(r.int(-7, 7), am); hi = q(qfloor(lo) + r.int(1, 7)); }
    const aQ = lo.add(hi).mul(-m), bQ = lo.mul(hi).mul(m);
    if (!aQ.isInt || !bQ.isInt) throw new Error("quadIneqSol: non-integer coefficients");
    const a = Number(aQ.p), b = Number(bQ.p);
    const strict = r.next() < 0.5;
    const so = strict ? "<" : "\\le ";
    const op = m > 0 ? (strict ? "<" : "\\le ") : strict ? ">" : "\\ge ";
    const xf = (z) => (z.isInt ? (z.p === 0n ? "x" : `(x${sg(-Number(z.p))})`) : `\\left(x${z.p < 0n ? "+" : "-"}${qt(new Q(z.p < 0n ? -z.p : z.p, z.q))}\\right)`);
    const ask = r.pick(["a+b", "a-b", "ab"]);
    const ans = { "a+b": a + b, "a-b": a - b, ab: a * b }[ask];
    return { v: { mx2: `${cf(m)}x^2`, op, sol: `${qt(lo)}${so}x${so}${qt(hi)}`, ask, lo: qt(lo), hi: qt(hi), m, fac: `${cf(m)}${xf(lo)}${xf(hi)}`, full: poly([m, a, b]), a, b }, ans };
  },


  cm1_quadIneqAlways: (r) => {
    for (;;) {
      const strict = r.next() < 0.5;
      const OP = strict ? ">" : "\\ge ", rel = strict ? "<" : "\\le ";
      const m = r.int(1, 3), n = r.int(3, 40);
      const kmax = strict ? Math.ceil(n / (m * m)) - 1 : Math.floor(n / (m * m));
      if (kmax < 2 || kmax > 11) continue;
      return { v: { ineq: `kx^2+${2 * m}kx${sg(n)}${OP}0`, n, rel, d4: poly([m * m, -n, 0], "k"), kr: `0<k${rel}${qt(q(n, m * m))}`, ks: seq(0, kmax) }, ans: kmax + 1 };
    }
  },

  cm1_divisorCount: (r, lvl) => {
    const P = [2, 3, 5, 7];
    for (;;) {
      const np = lvl === 1 ? r.int(2, 3) : r.int(3, 4);
      const ps = P.slice(0, np === 4 ? 4 : np === 3 ? 3 : 2);
      const pick3 = np === 3 && r.next() < 0.4 ? [2, 3, 7] : ps;
      const es = pick3.map(() => r.int(1, lvl === 1 ? 3 : 4));
      const xs = es.map((e) => r.int(0, e));
      const N = pick3.reduce((s, p, i) => s * p ** es[i], 1), m = pick3.reduce((s, p, i) => s * p ** xs[i], 1);
      if (m < 2 || m === N || N > 40000) continue;
      const fmt = (arr) => { const t = pick3.map((p, i) => (arr[i] === 0 ? null : arr[i] === 1 ? `${p}` : `${p}^${arr[i]}`)).filter(Boolean); return t.length ? t.join("\\times") : "1"; };
      const rest = es.map((e, i) => e - xs[i]);
      return { v: { fac: fmt(es), m, Nm: fmt(rest), prod: rest.map((e) => `(${e}+1)`).join("") }, ans: rest.reduce((s, e) => s * (e + 1), 1) };
    }
  },

  cm1_coloring: (r, lvl) => {
    const SH = {
      4: [
        { e: [[1, 2], [2, 3], [3, 4]], min: 2, f: (k) => [k * (k - 1) ** 3, `${k}\\times${k - 1}\\times${k - 1}\\times${k - 1}`] },
        { e: [[1, 2], [1, 3], [1, 4]], min: 2, f: (k) => [k * (k - 1) ** 3, `${k}\\times${k - 1}\\times${k - 1}\\times${k - 1}`] },
        { e: [[1, 2], [1, 3], [2, 3], [3, 4]], min: 3, f: (k) => [k * (k - 1) * (k - 2) * (k - 1), `${k}\\times${k - 1}\\times${k - 2}\\times${k - 1}`] },
        { e: [[1, 2], [2, 3], [3, 4], [1, 4]], min: 3, f: (k) => [k * (k - 1) * (k - 1 + (k - 2) ** 2), `${k}\\times${k - 1}\\times\\left[${k - 1}+${k - 2}\\times${k - 2}\\right]`] },
        { e: [[1, 2], [1, 3], [2, 3], [2, 4], [3, 4]], min: 3, f: (k) => [k * (k - 1) * (k - 2) * (k - 2), `${k}\\times${k - 1}\\times${k - 2}\\times${k - 2}`] },
        { e: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]], min: 4, f: (k) => [k * (k - 1) * (k - 2) * (k - 3), `${k}\\times${k - 1}\\times${k - 2}\\times${k - 3}`] },
      ],
      5: [
        { e: [[1, 2], [2, 3], [3, 4], [4, 5]], min: 2, f: (k) => [k * (k - 1) ** 4, `${k}\\times${k - 1}\\times${k - 1}\\times${k - 1}\\times${k - 1}`] },
        { e: [[1, 2], [1, 3], [1, 4], [1, 5]], min: 2, f: (k) => [k * (k - 1) ** 4, `${k}\\times${k - 1}\\times${k - 1}\\times${k - 1}\\times${k - 1}`] },
        { e: [[1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [3, 4], [4, 5], [2, 5]], min: 3, f: (k) => [k * (k - 1) * (k - 2) * (k - 2 + (k - 3) ** 2), `${k}\\times${k - 1}\\times${k - 2}\\times\\left[${k - 2}+${k - 3}\\times${k - 3}\\right]`] },
        { e: [[1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]], min: 3, f: (k) => [k * ((k - 1) ** 3 + (k - 1) * (k - 2) ** 3), `${k}\\times\\left[${k - 1}^3+${k - 1}\\times${k - 2}^3\\right]`] },
        { e: [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5], [2, 5]], min: 3, f: (k) => [k * (k - 1) * (k - 1 + (k - 2) ** 2) * (k - 2), `${k}\\times${k - 1}\\times\\left[${k - 1}+${k - 2}\\times${k - 2}\\right]\\times${k - 2}`] },
        { e: [[1, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]], min: 3, f: (k) => [k * (k - 1) * (k - 2) * (k - 1) * (k - 2), `${k}\\times${k - 1}\\times${k - 2}\\times${k - 1}\\times${k - 2}`] },
        { e: [[1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [3, 4], [4, 5]], min: 3, f: (k) => [k * (k - 1) * (k - 2) ** 3, `${k}\\times${k - 1}\\times${k - 2}\\times${k - 2}\\times${k - 2}`] },
      ],
    };
    const n = lvl === 1 ? 4 : 5;
    const regs = Array.from({ length: n }, (_, i) => i + 1).join(", ");
    const sh = r.pick(SH[n]);
    const k = r.int(Math.max(sh.min, 3), 5);
    const perm = rngShuffle(r, Array.from({ length: n }, (_, i) => i + 1));
    const edges = sh.e.map(([a, b]) => [perm[a - 1], perm[b - 1]].sort((x, y) => x - y)).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const [ans, work] = sh.f(k);
    return { v: { n, regs, k, edges: edges.map(([a, b]) => `(${a},${b})`).join(",\\ "), work }, ans };
  },

  cm1_permArrange: (r) => {
    for (;;) {
      const w = r.int(2, 5), m = r.int(2, 7);
      if (m + 1 < w || m + w > 9) continue;
      const fm = nPr(m, m), pv = nPr(m + 1, w);
      return { v: { m, w, m1: m + 1, mf: fm, pv }, ans: fm * pv };
    }
  },

  cm1_permNumbers: (r) => {
    for (;;) {
      const rr = r.pick([3, 4]);
      const nc = rr === 3 ? r.int(4, 6) : r.int(5, 7);
      let pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pool = rngShuffle(r, pool);
      let D = pool.slice(0, nc);
      if (r.next() < 0.8 && !D.includes(0)) D = [0, ...pool.filter((x) => x !== 0).slice(0, nc - 1)];
      D.sort((x, y) => x - y);
      const m = r.pick([2, 5, 10]);
      const L = D.filter((d) => (m === 2 ? d % 2 === 0 : m === 5 ? d % 5 === 0 : d === 0));
      if (!L.length) continue;
      const terms = [];
      let ans = 0;
      for (const d of L) {
        const rest = D.filter((x) => x !== d);
        const f = rest.length - (rest.includes(0) ? 1 : 0);
        const mid = nPr(rest.length - 1, rr - 2);
        terms.push(`(${f}\\times${mid})`);
        ans += f * mid;
      }
      if (ans <= 0) continue;
      return { v: { digs: D.join(", "), nc, r: rr, m, Lstr: L.join(", "), work: terms.join("+") }, ans };
    }
  },

  cm1_combCommittee: (r) => {
    for (;;) {
      const m = r.int(4, 9), w = r.int(3, 8), rr = r.int(3, 6), a = r.int(1, 3);
      const m1 = m - 1, w1 = w - 1, r1 = rr - 1;
      if (r1 < a || r1 > m1 + w1) continue;
      const ts = [], vs = [];
      let ans = 0;
      for (let g = a; g <= Math.min(w1, r1); g++) {
        if (r1 - g > m1) continue;
        ts.push(`{}_{${w1}}\\mathrm{C}_{${g}}\\times{}_{${m1}}\\mathrm{C}_{${r1 - g}}`);
        vs.push(`${nCr(w1, g)}\\times${nCr(m1, r1 - g)}`);
        ans += nCr(w1, g) * nCr(m1, r1 - g);
      }
      if (ts.length < 2 || ans <= 0) continue;
      return { v: { m, w, r: rr, a, m1, w1, r1, work: `${ts.join("+")}=${vs.join("+")}` }, ans };
    }
  },

  cm1_gridPaths: (r) => {
    for (;;) {
      const a = r.int(3, 6), b = r.int(3, 6), p = r.int(1, a), q0 = r.int(1, b);
      if (p === a && q0 === b) continue;
      const u = r.int(0, a), v = r.int(0, b);
      if ((u === 0 && v === 0) || (u === a && v === b) || (u === p && v === q0)) continue;
      const before = u <= p && v <= q0, after = u >= p && v >= q0;
      if (!before && !after) continue;
      const A = nCr(p + q0, p) * nCr(a + b - p - q0, a - p);
      const B = before ? nCr(u + v, u) * nCr(p - u + q0 - v, p - u) * nCr(a + b - p - q0, a - p) : nCr(p + q0, p) * nCr(u - p + v - q0, u - p) * nCr(a + b - u - v, a - u);
      if (A - B <= 0) continue;
      const t1 = `{}_{${p + q0}}\\mathrm{C}_{${p}}\\times{}_{${a + b - p - q0}}\\mathrm{C}_{${a - p}}=${A}`;
      const t2 = before
        ? `{}_{${u + v}}\\mathrm{C}_{${u}}\\times{}_{${p - u + q0 - v}}\\mathrm{C}_{${p - u}}\\times{}_{${a + b - p - q0}}\\mathrm{C}_{${a - p}}=${B}`
        : `{}_{${p + q0}}\\mathrm{C}_{${p}}\\times{}_{${u - p + v - q0}}\\mathrm{C}_{${u - p}}\\times{}_{${a + b - u - v}}\\mathrm{C}_{${a - u}}=${B}`;
      return { v: { a, b, p, q: q0, u, v, t1, t2 }, ans: A - B };
    }
  },

  cm1_matCayley: (r, lvl) => {
    for (;;) {
      const a = r.int(-3, 4), b = r.int(-3, 4), c = r.int(-3, 4), d = r.int(-3, 4);
      if (b === 0 && c === 0 && a === d) continue;
      const A = [[a, b], [c, d]];
      const n = lvl === 1 ? 2 : 3;
      const A2 = matMul(A, A), An = n === 2 ? A2 : matMul(A2, A);
      const t = a + d, det = a * d - b * c;
      const p = n === 2 ? t : t * t - det, qq = n === 2 ? -det : -t * det;
      const chk = [[p * a + qq, p * b], [p * c, p * d + qq]];
      if (JSON.stringify(chk) !== JSON.stringify(An)) throw new Error("matCayley: identity check failed");
      const ask = r.pick(["p+q", "pq", "p-q", "2p+q"]);
      const ans = { "p+q": p + qq, pq: p * qq, "p-q": p - qq, "2p+q": 2 * p + qq }[ask];
      return { v: { A: pmat(A), Emat: pmat([[1, 0], [0, 1]]), n, ask, Apow: pmat(An), p, q: qq }, ans };
    }
  },

  cm1_matWord: (r) => {
    for (;;) {
      const ni = r.pick([2, 3]);
      const P = [0, 1].map(() => Array.from({ length: ni }, () => 100 * r.int(3, 30)));
      const Qm = Array.from({ length: ni }, () => [r.int(1, 6), r.int(1, 6)]);
      const PQ = matMul(P, Qm);
      if (PQ[0][0] === PQ[1][0] || PQ[0][1] === PQ[1][1]) continue;
      const m1 = Math.min(PQ[0][0], PQ[1][0]), m2 = Math.min(PQ[0][1], PQ[1][1]);
      return { v: { ni, mp: pmat(P), mq: pmat(Qm), pq: pmat(PQ), pq11: PQ[0][0], pq21: PQ[1][0], pq12: PQ[0][1], pq22: PQ[1][1], m1, m2 }, ans: m1 + m2 };
    }
  },
};

const S = (code) => `10공수1-${code}`;
export const PLAN = [
  { skill: "m.h1.poly", template: "cm1_polyProdCoef", levels: [1, 2], count: 12, d: 1, standards: [S("01-01")], strategy: "coefficient-pairing", evidence: "calc" },
  { skill: "m.h1.poly", template: "cm1_polyDivQR", levels: [1, 2], count: 12, d: 2, standards: [S("01-01")], strategy: "long-division-quotient-remainder", evidence: "calc" },
  { skill: "m.h1.poly", template: "cm1_remUnknown", levels: [1, 2], count: 12, d: 2, standards: [S("01-02")], strategy: "remainder-theorem-for-parameter", evidence: "reverse" },
  { skill: "m.h1.poly", template: "cm1_remQuadDiv", levels: [1], count: 12, d: 3, standards: [S("01-02")], strategy: "remainder-of-quadratic-divisor", evidence: "concept" },
  { skill: "m.h1.poly", template: "cm1_identity", levels: [1, 2], count: 12, d: 2, standards: [S("01-02")], strategy: "identity-coefficient-matching", evidence: "reverse" },
  { skill: "m.h1.poly", template: "cm1_symmetricEval", levels: [1], count: 12, d: 3, standards: [S("01-01")], strategy: "sum-product-powers-of-real-pair", evidence: "calc" },
  { skill: "m.h1.poly", template: "cm1_symmetricInv", levels: [1], count: 12, d: 3, standards: [S("01-01")], strategy: "x-plus-reciprocal-powers", evidence: "calc" },
  { skill: "m.h1.pol1", template: "cm1_factorEval", levels: [1], count: 12, d: 3, standards: [S("01-03")], strategy: "factor-and-cancel", evidence: "calc" },
  { skill: "m.h1.cplx", template: "cm1_iPower", levels: [1,2], count: 12, d: 2, standards: [S("02-01")], strategy: "periodicity-of-powers-two-terms", evidence: "calc" },
  { skill: "m.h1.cplx", template: "cm1_iPowerSum", levels: [1], count: 12, d: 3, standards: [S("02-01")], strategy: "periodicity-of-powers-series", evidence: "calc" },
  { skill: "m.h1.cplx", template: "cm1_complexCond", levels: [1,2], count: 12, d: 3, standards: [S("02-01")], strategy: "pure-imaginary-condition", evidence: "reverse" },
  { skill: "m.h1.cplx", template: "cm1_discrimCount", levels: [1, 2], count: 12, d: 2, standards: [S("02-02")], strategy: "discriminant-integer-count", evidence: "counting" },
  { skill: "m.h1.cplx", template: "cm1_vietaExpr", levels: [1, 2], count: 12, d: 2, standards: [S("02-03")], strategy: "vieta-symmetric-expression", evidence: "calc" },
  { skill: "m.h1.cplx", template: "cm1_vietaUnknown", levels: [1, 2], count: 12, d: 3, standards: [S("02-03")], strategy: "vieta-for-parameter", evidence: "reverse" },
  { skill: "m.h1.cplx", template: "cm1_rootSignCond", levels: [1,2], count: 12, d: 4, standards: [S("02-02"), S("02-03")], strategy: "root-location-conditions", evidence: "concept" },
  { skill: "m.h1.ineq", template: "cm1_parabolaLine", levels: [1, 2], count: 12, d: 2, standards: [S("02-05")], strategy: "tangency-discriminant", evidence: "reverse" },
  { skill: "m.h1.ineq", template: "cm1_parabolaLineCount", levels: [1], count: 12, d: 3, standards: [S("02-05")], strategy: "no-intersection-discriminant-count", evidence: "counting" },
  { skill: "m.h1.ineq", template: "cm1_parabolaXaxis", levels: [1], count: 12, d: 3, standards: [S("02-04")], strategy: "x-intercept-distance", evidence: "concept" },
  { skill: "m.h1.cplx", template: "cm1_quadRange", levels: [1, 2], count: 12, d: 2, standards: [S("02-06")], strategy: "extrema-on-closed-interval", evidence: "calc" },
  { skill: "m.h1.cplx", template: "cm1_quadRevenue", levels: [1,2], count: 12, d: 3, standards: [S("02-06")], strategy: "profit-maximisation-model", evidence: "application" },
  { skill: "m.h1.cplx", template: "cm1_quadFence", levels: [1,2], count: 12, d: 3, standards: [S("02-06")], strategy: "area-maximisation-model", evidence: "application" },
  { skill: "m.h1.pol1", template: "cm1_omega", levels: [1,2], count: 12, d: 3, standards: [S("02-07")], strategy: "cube-root-of-unity-powers", evidence: "concept" },
  { skill: "m.h1.pol1", template: "cm1_cubicOneReal", levels: [1,2], count: 12, d: 3, standards: [S("02-07"), S("01-03")], strategy: "factor-theorem-then-discriminant", evidence: "calc" },
  { skill: "m.h1.pol1", template: "cm1_sysTwo", levels: [1, 2], count: 12, d: 3, standards: [S("02-08")], strategy: "eliminate-or-factor-system", evidence: "calc" },
  { skill: "m.h1.pol1", template: "cm1_sysReal", levels: [1], count: 12, d: 4, standards: [S("02-08")], strategy: "existence-of-real-solution", evidence: "counting" },
  { skill: "m.h1.ineq", template: "cm1_linIneqCount", levels: [1,2], count: 12, d: 2, standards: [S("02-09")], strategy: "intersect-ranges-count-integers", evidence: "counting" },
  { skill: "m.h1.ineq", template: "cm1_linIneqParam", levels: [1], count: 12, d: 4, standards: [S("02-09")], strategy: "integer-count-fixes-parameter", evidence: "reverse" },
  { skill: "m.h1.ineq", template: "cm1_absIneqCount", levels: [1, 2], count: 12, d: 2, standards: [S("02-10")], strategy: "remove-absolute-value-count", evidence: "counting" },
  { skill: "m.h1.ineq", template: "cm1_absIneqRep", levels: [1,2], count: 12, d: 3, standards: [S("02-10")], strategy: "solution-set-to-constants", evidence: "representation" },
  { skill: "m.h1.ineq", template: "cm1_quadIneqSol", levels: [1, 2], count: 12, d: 2, standards: [S("02-11")], strategy: "solution-set-to-coefficients", evidence: "representation" },
  { skill: "m.h1.ineq", template: "cm1_quadIneqAlways", levels: [1], count: 12, d: 5, standards: [S("02-11")], strategy: "always-true-with-leading-k-case", evidence: "counting" },
  { skill: "m.h1.comb", template: "cm1_divisorCount", levels: [1], count: 12, d: 3, standards: [S("03-01")], strategy: "product-rule-divisors", evidence: "counting" },
  { skill: "m.h1.comb", template: "cm1_coloring", levels: [1,2], count: 12, d: 3, standards: [S("03-01")], strategy: "region-coloring-cases", evidence: "counting" },
  { skill: "m.h1.comb", template: "cm1_permArrange", levels: [1], count: 14, d: 3, standards: [S("03-02")], strategy: "non-adjacent-gap-method", evidence: "counting" },
  { skill: "m.h1.comb", template: "cm1_permNumbers", levels: [1], count: 12, d: 3, standards: [S("03-02")], strategy: "digit-cards-with-condition", evidence: "counting" },
  { skill: "m.h1.comb", template: "cm1_combCommittee", levels: [1], count: 12, d: 3, standards: [S("03-03")], strategy: "committee-with-constraints", evidence: "counting" },
  { skill: "m.h1.comb", template: "cm1_gridPaths", levels: [1], count: 12, d: 4, standards: [S("03-01"), S("03-03")], strategy: "lattice-paths-pass-avoid", evidence: "counting" },
  { skill: "m.h1.mat1", template: "cm1_matCayley", levels: [1,2], count: 12, d: 3, standards: [S("04-02")], strategy: "matrix-power-by-multiplication-then-compare", evidence: "reverse" },
  { skill: "m.h1.mat1", template: "cm1_matWord", levels: [1], count: 12, d: 3, standards: [S("04-02")], strategy: "price-quantity-matrix-product", evidence: "application" },
];

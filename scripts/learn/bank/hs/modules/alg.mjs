// 대수 (12대수): exponents and logarithms, exponential / logarithmic functions, trigonometric functions, sequences.
// Class X standard 12대수03-07 (mathematical induction proofs) is deliberately not written. Class C standards (01-02, 01-06, 03-01) only get items whose
// numeric result depends on the concept (a rational power, a domain count, the number of integer-valued terms).
import { gcd, tfrac, sg, cf, lin, poly, Q } from "../lib.mjs";

const FK = "(소수로 써도 되고 3/4 처럼 분수로 써도 돼요)";
const FE = "(a decimal is fine, and so is a fraction like 3/4)";
const ID = "(숫자만 쓰세요)";
const IE = "(digits only)";

/* ---------- small helpers ---------- */
const tryGen = (f) => { for (let i = 0; i < 600; i++) { const x = f(); if (x) return x; } throw new Error("alg generator found no valid row"); };
const qt = (q) => tfrac(Number(q.p), Number(q.q));
const qn = (q) => q.toNumber();
const qpow = (b, e) => { b = Q.of(b); const base = e < 0 ? new Q(1).div(b) : b; let r = new Q(1); for (let i = 0; i < Math.abs(e); i++) r = r.mul(base); return r; };
const rt = (n, rad) => (n === 2 ? `\\sqrt{${rad}}` : `\\sqrt[${n}]{${rad}}`);
const argx = (p) => (p === 0 ? "x" : `(x${sg(p)})`);
const sgn = (n) => (n < 0 ? "-" : "+");
const xminus = (m) => (m === 0 ? "x" : m > 0 ? `x-${m}` : `x+${-m}`);
const coefTex = (c) => (c === 1 ? "" : c === -1 ? "-" : String(c));
const fl = (a, b) => Math.floor(a / b);
const cpi = (q) => (Number(q.p) === 1 && Number(q.q) === 1 ? "\\pi" : `${qt(q)}\\pi`);
const pr = (n) => (n < 0 ? `(${n})` : `${n}`);
const cterm = (q, sym) => { if (q.p === 0n) return ""; const neg = q.p < 0n; const ab = new Q(neg ? -q.p : q.p, q.q); const one = ab.p === 1n && ab.q === 1n; const body = sym ? (one ? sym : `${qt(ab)}${sym}`) : qt(ab); return (neg ? "-" : "+") + body; };
const sumTex = (ts) => { let s = ts.join(""); if (s.startsWith("+")) s = s.slice(1); return s || "0"; };
const pyTri = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
/** a lattice point (x, y) off both axes with integer r = |OP|, in quadrant quad (1..4) */
const pointIn = (r, quad, scale = false) => {
  const [a, b, c] = r.pick(pyTri); const sw = r.next() < 0.5; let x = sw ? a : b, y = sw ? b : a, rr = c;
  if (scale && r.next() < 0.4) { const k = r.int(2, 3); x *= k; y *= k; rr *= k; }
  const sx = quad === 1 || quad === 4 ? 1 : -1, sy = quad === 1 || quad === 2 ? 1 : -1;
  return { x: sx * x, y: sy * y, rr };
};
const trigE = (name, s, c, t) => {
  const o = { sc: [`\\sin\\theta\\cos\\theta`, "s*c", s.mul(c)], tms: [`\\tan\\theta-\\sin\\theta`, "t-s", t.sub(s)], sqd: [`\\sin^{2}\\theta-\\cos^{2}\\theta`, "s**2-c**2", s.mul(s).sub(c.mul(c))],
    recsum: [`\\frac{1}{\\sin\\theta}+\\frac{1}{\\cos\\theta}`, "1/s+1/c", new Q(1).div(s).add(new Q(1).div(c))], tpr: [`\\tan\\theta+\\frac{1}{\\tan\\theta}`, "t+1/t", t.add(new Q(1).div(t))],
    ct: [`\\cos\\theta\\tan\\theta+\\sin\\theta`, "c*t+s", c.mul(t).add(s)], tri: [`\\sin\\theta+\\cos\\theta+\\tan\\theta`, "s+c+t", s.add(c).add(t)] };
  return o[name];
};
const trigEnames = ["sc", "tms", "sqd", "recsum", "tpr", "ct", "tri"];

/* ---------- texts ---------- */
export const TEMPLATES = {
  alg_rootEval: {
    ko: ["다음 값을 구하세요. ${expr}$ " + ID, ["근호 안의 수를 어떤 수의 거듭제곱 꼴로 나타내 보세요.", "$\\sqrt[n]{a}\\sqrt[n]{b}=\\sqrt[n]{a\\times b}$, $\\frac{\\sqrt[n]{a}}{\\sqrt[n]{b}}=\\sqrt[n]{\\frac{a}{b}}$, $\\sqrt[m]{\\sqrt[n]{a}}=\\sqrt[mn]{a}$ 중 알맞은 성질을 쓰세요."], "${work}$ 이므로 값은 ${ans}$입니다."],
    en: ["Evaluate ${expr}$. " + IE, ["Write the number under the radical as a power of some number.", "Use $\\sqrt[n]{a}\\sqrt[n]{b}=\\sqrt[n]{a\\times b}$, $\\frac{\\sqrt[n]{a}}{\\sqrt[n]{b}}=\\sqrt[n]{\\frac{a}{b}}$ or $\\sqrt[m]{\\sqrt[n]{a}}=\\sqrt[mn]{a}$, whichever fits."], "${work}$, so the value is ${ans}$."],
  },
  alg_realRootCount: {
    ko: ["$2$ 이상의 정수 $n$에 대하여 $x^{n}=A$를 만족시키는 실수 $x$의 개수를 $f(n)$이라 합니다. $A={rad}$일 때, $f(2)+f(3)+\\cdots+f({N})$의 값은? " + ID, ["$n$이 짝수일 때와 홀수일 때로 나누어 생각해 보세요.", "$A$의 부호에 따라, 짝수 $n$에서는 $f(n)=2$ 또는 $0$이고 홀수 $n$에서는 $f(n)=1$입니다."], "$A$가 양수이면 짝수 $n$에서 $f(n)=2$, 홀수 $n$에서 $f(n)=1$이고, $A$가 음수이면 짝수 $n$에서 $f(n)=0$, 홀수 $n$에서 $f(n)=1$입니다. 짝수와 홀수 $n$의 개수를 세면 ${work}$ 입니다."],
    en: ["For an integer $n\\ge2$, let $f(n)$ be the number of real $x$ with $x^{n}=A$. If $A={rad}$, find $f(2)+f(3)+\\cdots+f({N})$. " + IE, ["Separate even $n$ from odd $n$.", "Depending on the sign of $A$, $f(n)$ is $2$ or $0$ for even $n$ and $1$ for odd $n$."], "If $A>0$ then $f(n)=2$ for even $n$ and $1$ for odd $n$; if $A<0$ then $f(n)=0$ for even $n$ and $1$ for odd $n$. Counting even and odd $n$ gives ${work}$."],
  },
  alg_rationalExp: {
    ko: ["다음 값을 구하세요. ${expr}$ " + FK, ["밑을 어떤 수의 거듭제곱으로 나타내 보세요.", "$(c^{q})^{\\frac{p}{q}}=c^{p}$ 처럼 지수법칙 $(a^{m})^{n}=a^{m\\times n}$ 을 쓰고, 음의 지수는 $a^{-n}=\\frac{1}{a^{n}}$ 로 바꿔요."], "${work}$ 입니다."],
    en: ["Evaluate ${expr}$. " + FE, ["Write each base as a power of some number.", "Use $(a^{m})^{n}=a^{m\\times n}$, for example $(c^{q})^{\\frac{p}{q}}=c^{p}$, and $a^{-n}=\\frac{1}{a^{n}}$."], "${work}$."],
  },
  alg_expSum: {
    ko: ["실수 $x$에 대하여 ${given}$ 일 때, ${ask}$ 의 값은? " + ID, ["$t=$ (주어진 식의 첫 항)으로 놓으면 둘째 항은 $\\frac{1}{t}$ 이에요.", "주어진 식을 제곱하거나 세제곱하여 구하는 식과 연결해 보세요."], "$t$를 주어진 식의 첫 항으로 놓고 곱셈 공식을 쓰면 ${work}$ 입니다."],
    en: ["For a real number $x$, ${given}$. Find the value of ${ask}$. " + IE, ["Let $t$ be the first term of the given expression; the second term is $\\frac{1}{t}$.", "Square or cube the given relation and compare with the expression you need."], "Let $t$ be the first term of the given expression and use the product identity: ${work}$."],
  },
  alg_logChain: {
    ko: ["다음 값을 구하세요. ${expr}$ " + FK, ["밑 변환 공식 $\\log_{a}b=\\frac{\\log_{c}b}{\\log_{c}a}$ 를 쓰면 이웃한 로그가 약분돼요.", "곱 전체를 하나의 로그로 줄인 뒤 진수를 거듭제곱 꼴로 나타내 보세요."], "${work}$ 입니다."],
    en: ["Evaluate ${expr}$. " + FE, ["With the change of base formula $\\log_{a}b=\\frac{\\log_{c}b}{\\log_{c}a}$ the neighbouring logarithms cancel.", "Reduce the whole product to one logarithm and write its argument as a power."], "${work}$."],
  },
  alg_logExpress: {
    ko: ["$\\log_{2}3=a$, $\\log_{2}5=b$일 때, $\\log_{2}{N}$ 의 값을 $xa+yb+z$ ($x, y, z$는 유리수) 꼴로 나타냅니다. $x+y+z$의 값은? " + FK, ["진수 ${N}$ 을 소인수 $2, 3, 5$의 거듭제곱으로 나타내 보세요.", "$\\log_{2}(MN)=\\log_{2}M+\\log_{2}N$, $\\log_{2}M^{k}=k\\log_{2}M$ 을 쓰고, $\\log_{2}2=1$ 임을 이용해요."], "${work}$ 이므로 $x+y+z$ 의 값은 ${sumtex}$ 입니다."],
    en: ["Given $\\log_{2}3=a$ and $\\log_{2}5=b$, write $\\log_{2}{N}$ as $xa+yb+z$ with rational $x, y, z$. Find $x+y+z$. " + FE, ["Factor ${N}$ into powers of the primes $2, 3, 5$.", "Use $\\log_{2}(MN)=\\log_{2}M+\\log_{2}N$, $\\log_{2}M^{k}=k\\log_{2}M$ and $\\log_{2}2=1$."], "${work}$, so $x+y+z={sumtex}$."],
  },
  alg_digitsPow: {
    ko: ["${given}$ 일 때, ${N}$ 은 몇 자리의 수인가요? " + ID, ["양의 정수 $M$이 $k$자리 수이면 $k-1\\le\\log M<k$ 예요.", "${N}$ 의 상용로그를 주어진 값으로 계산해 보세요."], "$\\log({N})={lg}$ 이고 정수 부분이 ${ip}$이므로 ${ans}$자리의 수입니다."],
    en: ["Given ${given}$, how many digits does ${N}$ have? " + IE, ["A positive integer with $k$ digits satisfies $k-1\\le\\log M<k$.", "Compute the common logarithm of ${N}$ with the given values."], "$\\log({N})={lg}$ has integer part ${ip}$, so the number has ${ans}$ digits."],
  },
  alg_growthYears: {
    ko: ["연이율 ${rate}\\%$ 의 복리로 예금할 때, 원리합계가 처음으로 원금의 ${k}$배 이상이 되는 것은 몇 년 후인가요? (단, ${given}$ 이고, 정수 연수로 답하세요.) " + ID, ["$n$년 후 원리합계는 원금의 $(1+\\frac{r}{100})^{n}$배예요.", "양변에 상용로그를 취하면 $n\\log(1+\\frac{r}{100})\\ge\\log k$ 예요."], "$({one})^{n}\\ge {k}$ 의 양변에 상용로그를 취하면 $n\\ge\\frac{{lk}}{{l1}}={q}$ 이므로 가장 작은 자연수 $n$은 ${ans}$입니다."],
    en: ["Money is deposited at an annual compound interest rate of ${rate}\\%$. After how many whole years does the balance first reach at least ${k}$ times the principal? (Given ${given}$; answer in whole years.) " + IE, ["After $n$ years the balance is $(1+\\frac{r}{100})^{n}$ times the principal.", "Taking common logs: $n\\log(1+\\frac{r}{100})\\ge\\log k$."], "From $({one})^{n}\\ge {k}$ we get $n\\ge\\frac{{lk}}{{l1}}={q}$, so the smallest whole number is ${ans}$."],
  },
  alg_expFuncParams: {
    ko: ["함수 $f(x)=a\\cdot b^{x}$ ($a\\ne0$, $b>0$, $b\\ne1$)에 대하여 $f({p})={u}$, $f({q})={v}$ 일 때, $f({r})$의 값은? " + FK, ["$\\frac{f(q)}{f(p)}=b^{q-p}$ 에서 $b$ 부터 구해 보세요.", "$b>0$ 이므로 $b$는 하나로 정해지고, 그다음 $a$를 구해요."], "${work}$ 입니다."],
    en: ["For the function $f(x)=a\\cdot b^{x}$ ($a\\ne0$, $b>0$, $b\\ne1$) we have $f({p})={u}$ and $f({q})={v}$. Find $f({r})$. " + FE, ["From $\\frac{f(q)}{f(p)}=b^{q-p}$ find $b$ first.", "Since $b>0$, $b$ is determined uniquely; then find $a$."], "${work}$."],
  },
  alg_expShiftA: {
    ko: ["함수 ${f}$ 의 그래프가 점 $({p}, {q})$ 를 지날 때, 양수 $a$ ($a\\ne1$)의 값은? " + FK, ["점의 좌표를 식에 대입하면 $a$의 거듭제곱이 하나 남아요.", "$a>0$ 이고 지수가 $0$이 아니므로 $a$는 하나로 정해져요."], "${work}$ 입니다."],
    en: ["The graph of ${f}$ passes through the point $({p}, {q})$. Find the positive number $a$ ($a\\ne1$). " + FE, ["Substitute the coordinates; one power of $a$ remains.", "Since $a>0$ and the exponent is not $0$, $a$ is determined uniquely."], "${work}$."],
  },
  alg_expEquation: {
    ko: ["방정식 ${eq}$ 의 모든 실근의 합은? " + ID, ["지수가 같은 항을 $t$로 놓으면 $t>0$ 인 이차방정식이 돼요.", "$t$ 의 값을 구한 뒤 각각 $x$ 의 값으로 되돌려요."], "${work}$ 이므로 실근의 합은 ${ans}$입니다."],
    en: ["Find the sum of all real solutions of ${eq}$. " + IE, ["Let $t$ be the repeated exponential; it gives a quadratic in $t$ with $t>0$.", "Solve for $t$ and convert each value back to $x$."], "${work}$, so the sum of the solutions is ${ans}$."],
  },
  alg_expInequality: {
    ko: ["부등식 ${ineq}$ 을 만족시키는 정수 $x$의 개수는? " + ID, ["밑을 같게 만들어 지수끼리 비교해요. 밑이 $1$보다 크면 부등호 방향이 그대로예요.", "지수에 대한 이차부등식을 풀어 정수 해를 세어 보세요."], "밑을 ${b}$ 로 같게 하면 지수에 대한 부등식은 ${work}$ 이고, 이를 만족시키는 정수 $x$는 ${xs}$ 이므로 모두 ${ans}$개입니다."],
    en: ["How many integers $x$ satisfy ${ineq}$? " + IE, ["Make the bases equal and compare exponents; the direction is kept if the common base exceeds $1$.", "Solve the resulting quadratic inequality and count the integers."], "Writing everything with base ${b}$, the inequality on the exponents becomes ${work}$; the integers satisfying it are ${xs}$, in total ${ans}$."],
  },
  alg_logEquation: {
    ko: ["$x$는 실수일 때 방정식 ${eq}$ 의 해는? (해가 하나뿐입니다) " + ID, ["진수 조건 ${dom}$ 을 먼저 확인해요.", "로그의 합을 하나의 로그로 묶어 진수에 대한 이차방정식을 세워요."], "진수 조건에서 ${dom}$ 입니다. ${work}$ 이고 이 중 진수 조건을 만족시키는 것은 $x={ans}$ 입니다."],
    en: ["For real $x$, solve ${eq}$. (There is exactly one solution.) " + IE, ["First check the domain condition ${dom}$.", "Combine the logarithms and form a quadratic equation in the argument."], "The domain requires ${dom}$. ${work}$; only $x={ans}$ satisfies the domain."],
  },
  alg_logInequality: {
    ko: ["부등식 ${ineq}$ 을 만족시키는 정수 $x$의 개수는? " + ID, ["먼저 진수 조건(진수는 양수)을 확인해요.", "밑이 $1$보다 작으면 로그를 없앨 때 부등호 방향이 바뀌어요."], "${work}$ 이므로 정수 $x$는 모두 ${ans}$개입니다."],
    en: ["How many integers $x$ satisfy ${ineq}$? " + IE, ["Check the domain first: every argument must be positive.", "If the base is less than $1$, the inequality reverses when the logarithm is removed."], "${work}$, so there are ${ans}$ such integers."],
  },
  alg_inverseGraph: {
    ko: ["함수 ${f}$ 의 역함수의 그래프가 점 $({p}, {q})$ 를 지날 때, 양수 $a$ ($a\\ne1$)의 값은? " + FK, ["역함수의 그래프가 점 $(p, q)$ 를 지나면 원래 함수의 그래프는 점 $(q, p)$ 를 지나요.", "그 점을 원래 함수에 대입해 $a$ 에 대한 식을 얻어요."], "역함수의 그래프가 점 $({p},{q})$ 를 지나므로 원래 함수의 그래프는 점 $({q},{p})$ 를 지납니다. ${work}$ 입니다."],
    en: ["The graph of the inverse function of ${f}$ passes through the point $({p}, {q})$. Find the positive number $a$ ($a\\ne1$). " + FE, ["If the inverse's graph passes through $(p, q)$, the original graph passes through $(q, p)$.", "Substitute that point into the original function to get an equation in $a$."], "The inverse passes through $({p},{q})$, so the original graph passes through $({q},{p})$. ${work}$."],
  },
  alg_logDomain: {
    ko: ["함수 ${f}$ 의 정의역에 속하는 정수 $x$의 개수는? " + ID, ["로그의 진수는 양수이고, 근호 안은 $0$ 이상이에요.", "부등식을 풀어 $x$의 범위를 구한 뒤 그 안의 정수를 세요."], "${work}$ 이므로 정수 $x$는 모두 ${ans}$개입니다."],
    en: ["How many integers $x$ lie in the domain of ${f}$? " + IE, ["The argument of a logarithm must be positive, and an expression under a square root must be at least $0$.", "Solve the inequalities for the range of $x$, then count the integers in it."], "${work}$, so there are ${ans}$ integers."],
  },
  alg_expMaxMin: {
    ko: ["$x$의 범위가 ${s}\\le x\\le {t}$ 일 때, 함수 ${f}$ 의 최댓값은? " + FK, ["지수 $g(x)$ 의 최댓값·최솟값을 먼저 구해요(이차함수의 꼭짓점과 양 끝점).", "밑이 $1$보다 크면 $g$가 클수록, $1$보다 작으면 $g$가 작을수록 지수함수 값이 커요."], "${work}$ 입니다."],
    en: ["For ${s}\\le x\\le {t}$, find the maximum value of ${f}$. " + FE, ["Find the extreme values of the exponent $g(x)$ first (vertex and endpoints of the parabola).", "If the base is greater than $1$, a larger $g$ gives a larger value; if it is less than $1$, a smaller $g$ does."], "${work}$."],
  },
  alg_coterminal: {
    ko: ["크기가 ${theta}$ 인 각과 동경이 일치하는 각 중에서 $0^\\circ$ 이상 $360^\\circ$ 미만인 각은 몇 도인가요? (도 단위의 숫자만 쓰세요)", ["동경이 같은 각은 $360^\\circ\\times n$ 만큼 차이 나요(또는 $2n\\pi$).", "라디안으로 주어졌다면 먼저 도 단위로 바꾸세요($\\pi=180^\\circ$)."], "${work}$ 이므로 구하는 각은 ${ans}^\\circ$ 입니다."],
    en: ["Among the angles whose terminal side coincides with that of the angle ${theta}$, which one is at least $0^\\circ$ and less than $360^\\circ$? (digits only, in degrees)", ["Coterminal angles differ by $360^\\circ\\times n$ (or $2n\\pi$).", "If the angle is in radians, first convert to degrees ($\\pi=180^\\circ$)."], "${work}$, so the angle is ${ans}^\\circ$."],
  },
  alg_halfAngleQuad: {
    ko: ["$\\theta$가 제 ${m}$ 사분면의 각일 때, $\\frac{\\theta}{{n}}$ 의 동경이 위치할 수 있는 사분면의 번호를 모두 더한 값은? (예: 제1사분면과 제3사분면이면 $1+3=4$) " + ID, ["$\\theta=360^\\circ\\times k+\\alpha$ ($k$는 정수, $\\alpha$는 제 ${m}$ 사분면 각의 범위)로 놓아요.", "$k$를 $0,1,2,\\dots$ 로 바꿔 가며 $\\frac{\\theta}{{n}}$ 의 범위가 어느 사분면인지 살펴요."], "${work}$ 이므로 번호의 합은 ${ans}$입니다."],
    en: ["If $\\theta$ is an angle in quadrant ${m}$, the terminal side of $\\frac{\\theta}{{n}}$ can lie in which quadrants? Add up the numbers of all possible quadrants. (Example: quadrants 1 and 3 give $1+3=4$.) " + IE, ["Write $\\theta=360^\\circ\\times k+\\alpha$ with $k$ an integer and $\\alpha$ in the range of quadrant ${m}$.", "Let $k=0,1,2,\\dots$ and see which quadrant the range of $\\frac{\\theta}{{n}}$ falls in."], "${work}$, so the sum of the numbers is ${ans}$."],
  },
  alg_sectorForward: {
    ko: ["반지름의 길이가 ${r}$ cm, 중심각의 크기가 ${th}$ 인 부채꼴의 호의 길이를 $a\\pi$ cm, 넓이를 $b\\pi$ cm$^{2}$ 라 할 때, $a+b$의 값은? " + FK, ["중심각을 라디안으로 바꾸면 호의 길이 $l=r\\theta$, 넓이 $S=\\frac{1}{2}r^{2}\\theta$ 예요.", "$\\theta$ 가 $\\pi$ 의 몇 배인지 먼저 구해요."], "${work}$ 이므로 $a+b$ 의 값은 ${sumtex}$ 입니다."],
    en: ["A sector has radius ${r}$ cm and central angle ${th}$. Its arc length is $a\\pi$ cm and its area is $b\\pi$ cm$^{2}$. Find $a+b$. " + FE, ["In radians, arc length $l=r\\theta$ and area $S=\\frac{1}{2}r^{2}\\theta$.", "First find how many times $\\pi$ the central angle is."], "${work}$, so $a+b={sumtex}$."],
  },
  alg_sectorPerimArea: {
    ko: ["둘레의 길이가 ${P}$ cm이고 넓이가 ${S}$ cm$^{2}$ 인 부채꼴이 두 가지 있습니다(중심각은 $2\\pi$ 미만). 이 중 반지름의 길이가 더 큰 부채꼴의 반지름은 몇 cm인가요? " + ID, ["반지름 $r$, 호의 길이 $l$ 이면 둘레는 $2r+l$, 넓이는 $\\frac{1}{2}rl$ 이에요.", "$l$ 을 소거하면 $r$ 에 대한 이차방정식이 돼요."], "$2r+l={P}$, $\\frac{1}{2}rl={S}$ 에서 $l$ 을 없애면 ${work}$ 이므로 큰 반지름은 ${ans}$ cm입니다."],
    en: ["Two sectors (central angle less than $2\\pi$) both have perimeter ${P}$ cm and area ${S}$ cm$^{2}$. What is the radius, in cm, of the one with the larger radius? " + IE, ["With radius $r$ and arc length $l$, the perimeter is $2r+l$ and the area is $\\frac{1}{2}rl$.", "Eliminating $l$ gives a quadratic equation in $r$."], "From $2r+l={P}$ and $\\frac{1}{2}rl={S}$, eliminating $l$ gives ${work}$, so the larger radius is ${ans}$ cm."],
  },
  alg_trigPoint: {
    ko: ["시초선이 $x$축의 양의 방향이고 동경이 점 P$({xp}, {yp})$ 를 지나는 각의 크기를 $\\theta$라 할 때, ${E}$ 의 값은? " + FK, ["원점 O에서 점 P까지의 거리 $r=\\sqrt{x^{2}+y^{2}}$ 를 먼저 구해요(점 P의 좌표를 $(x, y)$ 라 할 때).", "$\\sin\\theta=\\frac{y}{r}$, $\\cos\\theta=\\frac{x}{r}$, $\\tan\\theta=\\frac{y}{x}$ 예요."], "${work}$ 이므로 ${E}={vt}$ 입니다."],
    en: ["The initial side is the positive $x$-axis and the terminal side of the angle $\\theta$ passes through the point P$({xp}, {yp})$. Find the value of ${E}$. " + FE, ["First find the distance $r=\\sqrt{x^{2}+y^{2}}$ from the origin O to P (writing P as $(x, y)$).", "$\\sin\\theta=\\frac{y}{r}$, $\\cos\\theta=\\frac{x}{r}$, $\\tan\\theta=\\frac{y}{x}$."], "${work}$, so ${E}={vt}$."],
  },
  alg_trigGiven: {
    ko: ["$\\theta$가 제 ${quad}$ 사분면의 각이고 ${given}$ 일 때, ${E}$ 의 값은? " + FK, ["제 ${quad}$ 사분면에서 $\\sin$, $\\cos$, $\\tan$ 의 부호를 확인해요.", "주어진 값을 직각삼각형의 세 변의 비로 바꾸어 나머지 값을 구해요."], "${work}$ 이므로 ${E}={vt}$ 입니다."],
    en: ["The angle $\\theta$ lies in quadrant ${quad}$ and ${given}$. Find the value of ${E}$. " + FE, ["Check the signs of $\\sin$, $\\cos$, $\\tan$ in quadrant ${quad}$.", "Turn the given value into the sides of a right triangle and find the other ratios."], "${work}$, so ${E}={vt}$."],
  },
  alg_trigIdentity: {
    ko: ["실수 $\\theta$에 대하여 ${given}$ 일 때, ${E}$ 의 값은? " + FK, ["$\\sin^{2}\\theta+\\cos^{2}\\theta=1$ 과, 주어진 식을 제곱한 식을 함께 써요.", "구하는 식을 $\\sin\\theta\\cos\\theta$ 또는 $(\\sin\\theta\\pm\\cos\\theta)^{2}$ 로 바꿔 보세요."], "${work}$ 입니다."],
    en: ["For a real number $\\theta$, ${given}$. Find the value of ${E}$. " + FE, ["Use $\\sin^{2}\\theta+\\cos^{2}\\theta=1$ together with the square of the given relation.", "Rewrite the required expression in terms of $\\sin\\theta\\cos\\theta$ or $(\\sin\\theta\\pm\\cos\\theta)^{2}$."], "${work}$."],
  },
  alg_trigRootCount: {
    ko: ["$0\\le\\theta<2\\pi$ 에서 방정식 ${eq}$ 의 서로 다른 실근의 개수는? " + ID, ["$k\\theta=\\phi$ 로 놓으면 $\\phi$ 의 범위는 $0\\le\\phi<2k\\pi$ 예요.", "$y=\\sin\\phi$ 등의 그래프와 직선 $y=$ (상수)의 교점 개수를 한 주기마다 세어 보세요."], "${work}$ 이므로 근의 개수는 ${ans}$입니다."],
    en: ["How many distinct real solutions does ${eq}$ have in $0\\le\\theta<2\\pi$? " + IE, ["Put $\\phi=k\\theta$; then $\\phi$ ranges over $0\\le\\phi<2k\\pi$.", "Count the intersections of the graph with the horizontal line in each period."], "${work}$, so the number of solutions is ${ans}$."],
  },
  alg_trigPeriod: {
    ko: ["함수 ${f}$ 의 가장 작은 양의 주기를 $k\\pi$ 라 할 때, $k$의 값은? " + FK, ["$y=\\sin bx$, $y=\\cos bx$ 의 주기는 $\\frac{2\\pi}{|b|}$, $y=\\tan bx$ 의 주기는 $\\frac{\\pi}{|b|}$ 예요.", "절댓값이나 제곱이 붙으면 그래프의 음의 부분이 접혀 올라가므로 주기가 절반이 될 수 있어요."], "${work}$ 이므로 $k={kt}$ 입니다."],
    en: ["The smallest positive period of ${f}$ is $k\\pi$. Find $k$. " + FE, ["$y=\\sin bx$ and $y=\\cos bx$ have period $\\frac{2\\pi}{|b|}$; $y=\\tan bx$ has period $\\frac{\\pi}{|b|}$.", "With an absolute value or a square, the negative part is folded up, so the period can be half as long."], "${work}$, so $k={kt}$."],
  },
  alg_trigGraphParam: {
    ko: ["함수 $y=a{fn}\\,bx+c$ ($a>0$, $b>0$)의 최댓값이 ${M}$, 최솟값이 ${m}$, 주기가 ${per}$ 일 때, 세 상수의 곱 $abc$의 값은? " + FK, ["최댓값은 $a+c$, 최솟값은 $-a+c$ 예요.", "주기가 $\\frac{2\\pi}{b}$ 임을 이용해 $b$ 를 구해요."], "${work}$ 이므로 $abc={abct}$ 입니다."],
    en: ["The function $y=a{fn}\\,bx+c$ ($a>0$, $b>0$) has maximum ${M}$, minimum ${m}$ and period ${per}$. Find the product $abc$. " + FE, ["The maximum is $a+c$ and the minimum is $-a+c$.", "Use the period $\\frac{2\\pi}{b}$ to find $b$."], "${work}$, so $abc={abct}$."],
  },
  alg_trigSpecial: {
    ko: ["다음 값을 구하세요. ${expr}$ " + FK, ["각을 $0^\\circ$ 이상 $360^\\circ$ 미만의 각(동경이 같은 각)으로 바꾸세요.", "$\\sin30^\\circ=\\frac{1}{2}$, $\\cos60^\\circ=\\frac{1}{2}$, $\\tan45^\\circ=1$ 과 각 사분면에서의 부호를 이용해요."], "${work}$ 입니다."],
    en: ["Evaluate ${expr}$. " + FE, ["Replace each angle by a coterminal angle in $[0^\\circ, 360^\\circ)$.", "Use $\\sin30^\\circ=\\frac{1}{2}$, $\\cos60^\\circ=\\frac{1}{2}$, $\\tan45^\\circ=1$ and the sign in each quadrant."], "${work}$."],
  },
  alg_circumradius: {
    ko: ["삼각형 ABC에서 $\\overline{B C}={side}$ 이고 ${cond}$ 일 때, 삼각형 ABC의 외접원의 반지름의 길이는? " + FK, ["사인법칙 $\\frac{a}{\\sin A}=2R$ ($a=\\overline{B C}$) 을 써요.", "코사인 값이 주어졌다면 $\\sin A>0$ 임을 이용해 $\\sin A$ 부터 구해요."], "${work}$ 이므로 외접원의 반지름은 ${Rt}$ 입니다."],
    en: ["In triangle ABC, $\\overline{B C}={side}$ and ${cond}$. Find the radius of the circumscribed circle. " + FE, ["Use the law of sines $\\frac{a}{\\sin A}=2R$ with $a=\\overline{B C}$.", "If the cosine is given, use $\\sin A>0$ to find $\\sin A$ first."], "${work}$, so the circumradius is ${Rt}$."],
  },
  alg_survey: {
    ko: ["두 지점 A, B 사이의 거리는 ${d}$ m입니다. 또 다른 지점 C에서 보았을 때 $\\angle CAB=\\alpha$, $\\angle CBA=\\beta$ 이고 $\\sin\\alpha={sa}$, $\\sin\\beta={sb}$ ($\\alpha$, $\\beta$는 예각) 입니다. A에서 C까지의 거리는 몇 m인가요? " + ID, ["$\\angle C=180^\\circ-\\alpha-\\beta$ 이므로 $\\sin C=\\sin(\\alpha+\\beta)$ 예요.", "$\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta$ 에서 코사인은 $\\cos=\\sqrt{1-\\sin^{2}}$ 로 구해요. 그다음 사인법칙 $\\frac{\\overline{A C}}{\\sin\\beta}=\\frac{\\overline{A B}}{\\sin C}$ 를 써요."], "${work}$ 이므로 A에서 C까지의 거리는 ${ans}$ m입니다."],
    en: ["Points A and B are ${d}$ m apart. From another point C we have $\\angle CAB=\\alpha$ and $\\angle CBA=\\beta$ with $\\sin\\alpha={sa}$, $\\sin\\beta={sb}$ ($\\alpha$, $\\beta$ acute). How far, in m, is C from A? " + IE, ["$\\angle C=180^\\circ-\\alpha-\\beta$, so $\\sin C=\\sin(\\alpha+\\beta)$.", "$\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta$ with $\\cos=\\sqrt{1-\\sin^{2}}$. Then use the law of sines $\\frac{\\overline{A C}}{\\sin\\beta}=\\frac{\\overline{A B}}{\\sin C}$."], "${work}$, so the distance from A to C is ${ans}$ m."],
  },
  alg_cosLawSide: {
    ko: ["삼각형 ABC에서 $\\overline{B C}={a}$, $\\overline{C A}={b}$ 이고 ${cond}$ 일 때, $\\overline{A B}$의 길이는? " + ID, ["코사인법칙 $c^{2}=a^{2}+b^{2}-2ab\\cos C$ 를 써요.", "$\\cos60^\\circ=\\frac{1}{2}$, $\\cos120^\\circ=-\\frac{1}{2}$ 이고, 길이는 양수예요."], "${work}$ 이므로 $\\overline{A B}={ans}$ 입니다."],
    en: ["In triangle ABC, $\\overline{B C}={a}$, $\\overline{C A}={b}$ and ${cond}$. Find $\\overline{A B}$. " + IE, ["Use the law of cosines $c^{2}=a^{2}+b^{2}-2ab\\cos C$.", "$\\cos60^\\circ=\\frac{1}{2}$, $\\cos120^\\circ=-\\frac{1}{2}$, and a length is positive."], "${work}$, so $\\overline{A B}={ans}$."],
  },
  alg_obtuseCount: {
    ko: ["세 변의 길이가 ${a}$, ${b}$, $x$ 인 둔각삼각형이 존재하도록 하는 자연수 $x$의 개수는? " + ID, ["삼각형이 되려면 가장 긴 변이 나머지 두 변의 합보다 작아야 해요.", "둔각이 되려면 가장 긴 변의 제곱이 나머지 두 변의 제곱의 합보다 커야 해요. $x$가 가장 긴 변인 경우와 ${b}$가 가장 긴 변인 경우로 나누세요."], "${work}$ 이므로 자연수 $x$는 모두 ${ans}$개입니다."],
    en: ["For how many natural numbers $x$ does an obtuse triangle with side lengths ${a}$, ${b}$ and $x$ exist? " + IE, ["For a triangle, the longest side must be shorter than the sum of the other two.", "For an obtuse triangle, the square of the longest side must exceed the sum of the squares of the others. Treat the cases where $x$ is the longest side and where ${b}$ is."], "${work}$, so there are ${ans}$ natural numbers $x$."],
  },
  alg_arithTwoTerms: {
    ko: ["등차수열 $\\{a_n\\}$에서 $a_{{p}}={u}$, $a_{{q}}={v}$ 일 때, $a_{{r}}$ 의 값은? " + FK, ["$a_q-a_p=(q-p)d$ 로 공차 $d$ 를 구해요.", "$a_r=a_p+(r-p)d$ 예요."], "공차는 $d=\\frac{{v}-{ub}}{{q}-{p}}={d}$ 이므로 $a_{{r}}={u}+({r}-{p})\\times{db}={ans}$ 입니다."],
    en: ["In the arithmetic sequence $\\{a_n\\}$, $a_{{p}}={u}$ and $a_{{q}}={v}$. Find $a_{{r}}$. " + FE, ["Use $a_q-a_p=(q-p)d$ to find the common difference $d$.", "Then $a_r=a_p+(r-p)d$."], "The common difference is $d=\\frac{{v}-{ub}}{{q}-{p}}={d}$, so $a_{{r}}={u}+({r}-{p})\\times{db}={ans}$."],
  },
  alg_arithSumMax: {
    ko: ["등차수열 $\\{a_n\\}$에서 $a_{{p}}={u}$, $a_{{q}}={v}$ 일 때, 첫째항부터 제 $n$항까지의 합 $S_n$의 최댓값은? ($n$은 자연수) " + ID, ["공차의 부호를 보고, 항이 양수인 동안만 더하면 합이 커져요.", "첫째항과 공차를 구한 뒤, 처음으로 $0$ 이하가 되는 항의 바로 앞까지의 합을 구해요."], "첫째항은 ${a1}$, 공차는 ${d}$ 이므로 $a_n$ 은 제 ${nm}$항까지 양수 (또는 $0$)입니다. 따라서 최댓값은 $S_{{nm}}=\\frac{{nm}(2\\times{a1}+({nm}-1)\\times({d}))}{2}={ans}$ 입니다."],
    en: ["In the arithmetic sequence $\\{a_n\\}$, $a_{{p}}={u}$ and $a_{{q}}={v}$. Find the maximum value of the sum $S_n$ of the first $n$ terms ($n$ a positive integer). " + IE, ["Look at the sign of the common difference: the sum grows only while the terms are positive.", "Find the first term and the difference, then sum up to just before the terms become non-positive."], "The first term is ${a1}$ and the difference is ${d}$, so the terms stay positive (or zero) up to term ${nm}$. The maximum is $S_{{nm}}=\\frac{{nm}(2\\times{a1}+({nm}-1)\\times({d}))}{2}={ans}$."],
  },
  alg_arithFirstExceeds: {
    ko: ["첫째항이 ${a}$, 공차가 ${d}$ 인 등차수열의 첫째항부터 제 $n$항까지의 합을 $S_n$이라 할 때, $S_n>{N}$ 을 만족시키는 가장 작은 자연수 $n$의 값은? " + ID, ["$S_n=\\frac{n(2a+(n-1)d)}{2}$ 를 $n$ 에 대한 이차식으로 쓰세요.", "이차부등식을 풀거나 $n=1,2,3,\\dots$ 를 차례로 넣어 처음으로 넘는 곳을 찾으세요."], "$S_n=\\frac{n(2\\times{ab}+(n-1)\\times{d})}{2}$ 이고 $S_{{m1}}={s1}\\le{N}$, $S_{{ans}}={s2}>{N}$ 이므로 구하는 $n$은 ${ans}$ 입니다."],
    en: ["An arithmetic sequence has first term ${a}$ and common difference ${d}$; $S_n$ is the sum of its first $n$ terms. Find the smallest positive integer $n$ with $S_n>{N}$. " + IE, ["Write $S_n=\\frac{n(2a+(n-1)d)}{2}$ as a quadratic in $n$.", "Solve the quadratic inequality, or try $n=1,2,3,\\dots$ until the sum first exceeds the bound."], "$S_n=\\frac{n(2\\times{ab}+(n-1)\\times{d})}{2}$, and $S_{{m1}}={s1}\\le{N}$ while $S_{{ans}}={s2}>{N}$, so $n={ans}$."],
  },
  alg_arithGeoMix: {
    ko: ["세 수 $x$, $y$, $z$ 가 이 순서로 공차가 양수인 등차수열을 이루고 $x+y+z={S}$ 입니다. 세 수 $x$, $y$, $z+{k}$ 가 이 순서로 등비수열을 이룰 때, 공차는? " + ID, ["공차를 $d$ 라 하면 $x=y-d$, $z=y+d$ 이고 $3y=S$ 예요.", "등비수열의 조건 $y^{2}=x(z+k)$ 에 대입해 $d$ 에 대한 이차방정식을 세워요."], "$y=\\frac{{S}}{3}={y}$ 이고 $x={y}-d$, $z={y}+d$ 이므로 ${y}^{2}=({y}-d)({y}+d+{k})$, 즉 $d^{2}+{k}d-{yk}=0$ 입니다. 공차가 양수이므로 $d={ans}$ 입니다."],
    en: ["Three numbers $x$, $y$, $z$ form, in this order, an arithmetic sequence with positive common difference, and $x+y+z={S}$. The numbers $x$, $y$, $z+{k}$ form, in this order, a geometric sequence. Find the common difference. " + IE, ["With common difference $d$, $x=y-d$, $z=y+d$ and $3y=S$.", "Substitute into the geometric condition $y^{2}=x(z+k)$ to get a quadratic in $d$."], "$y=\\frac{{S}}{3}={y}$, $x={y}-d$, $z={y}+d$, so ${y}^{2}=({y}-d)({y}+d+{k})$, i.e. $d^{2}+{k}d-{yk}=0$. The difference is positive, so $d={ans}$."],
  },
  alg_sumToTerm: {
    ko: ["수열 $\\{a_n\\}$의 첫째항부터 제 $n$항까지의 합이 $S_n={expr}$ 일 때, $a_{1}+a_{{k}}$ 의 값은? " + ID, ["$a_1=S_1$, 그리고 $n\\ge2$ 일 때 $a_n=S_n-S_{n-1}$ 예요.", "$a_n=S_n-S_{n-1}$ 의 식에 $n=1$ 을 넣은 값이 $S_1$ 과 같다고 단정하면 안 돼요."], "$a_1=S_1={a1}$, $a_{{k}}=S_{{k}}-S_{{km}}={ak}$ 이므로 합은 ${ans}$입니다."],
    en: ["The sum of the first $n$ terms of $\\{a_n\\}$ is $S_n={expr}$. Find $a_{1}+a_{{k}}$. " + IE, ["$a_1=S_1$, and $a_n=S_n-S_{n-1}$ for $n\\ge2$.", "Do not assume that the formula for $S_n-S_{n-1}$ also gives $a_1$."], "$a_1=S_1={a1}$ and $a_{{k}}=S_{{k}}-S_{{km}}={ak}$, so the sum is ${ans}$."],
  },
  alg_geoTwoTerms: {
    ko: ["공비가 양수인 등비수열 $\\{a_n\\}$에서 $a_{{p}}={u}$, $a_{{q}}={v}$ 일 때, $a_{{r}}$ 의 값은? " + FK, ["(뒤의 항)÷(앞의 항)은 공비 $r$ 의 (번호의 차)제곱이에요.", "공비가 양수라는 조건으로 $r$ 이 하나로 정해져요."], "$\\frac{{v}}{{u}}=r^{{dq}}$ 이고 $r>0$ 이므로 $r={rt}$, 따라서 ${work}$ 입니다."],
    en: ["In a geometric sequence $\\{a_n\\}$ with positive common ratio, $a_{{p}}={u}$ and $a_{{q}}={v}$. Find $a_{{r}}$. " + FE, ["(later term) ÷ (earlier term) equals $r$ raised to the difference of the indices.", "The positivity of $r$ makes it unique."], "$\\frac{{v}}{{u}}=r^{{dq}}$ and $r>0$, so $r={rt}$; hence ${work}$."],
  },
  alg_geoSumRatio: {
    ko: ["등비수열 $\\{a_n\\}$의 첫째항부터 제 $n$항까지의 합을 $S_n$이라 하자. $S_{{n1}}={u}$, $S_{{n2}}={v}$ 일 때, $S_{{n3}}$ 의 값은? " + ID, ["$S_{2m}=S_m+r^{m}S_m$ 처럼 뒷부분의 합은 앞부분의 합에 $r^{m}$ 을 곱한 것이에요.", "$r^{{n1}}$ 의 값을 먼저 구하면 $r$ 자체는 필요 없어요."], "$S_{{n2}}=S_{{n1}}(1+r^{{n1}})$ 에서 $r^{{n1}}={q}$ 입니다. $S_{{n3}}=S_{{n1}}(1+r^{{n1}}+r^{{n2}})={u}\\times({qs})={ans}$ 입니다."],
    en: ["Let $S_n$ be the sum of the first $n$ terms of a geometric sequence $\\{a_n\\}$. If $S_{{n1}}={u}$ and $S_{{n2}}={v}$, find $S_{{n3}}$. " + IE, ["The later block of terms is the earlier block times $r^{m}$, e.g. $S_{2m}=S_m+r^{m}S_m$.", "Find $r^{{n1}}$ first; the ratio $r$ itself is not needed."], "From $S_{{n2}}=S_{{n1}}(1+r^{{n1}})$ we get $r^{{n1}}={q}$. Then $S_{{n3}}=S_{{n1}}(1+r^{{n1}}+r^{{n2}})={u}\\times({qs})={ans}$."],
  },
  alg_sigmaSquare: {
    ko: ["두 수열 $\\{a_n\\}$, $\\{b_n\\}$에 대하여 $\\sum_{k=1}^{{n}}a_k^{2}={A}$, $\\sum_{k=1}^{{n}}a_kb_k={B}$, $\\sum_{k=1}^{{n}}b_k^{2}={C}$ 일 때, $\\sum_{k=1}^{{n}}({comb})^{2}$ 의 값은? " + ID, ["괄호 안을 제곱해서 전개하세요.", "$\\sum$ 의 선형성($\\sum(pa_k+qb_k)=p\\sum a_k+q\\sum b_k$)을 써서 주어진 세 합으로 나타내요."], "$({comb})^{2}={expand}$ 이므로 ${work}$ 입니다."],
    en: ["For sequences $\\{a_n\\}$ and $\\{b_n\\}$, $\\sum_{k=1}^{{n}}a_k^{2}={A}$, $\\sum_{k=1}^{{n}}a_kb_k={B}$ and $\\sum_{k=1}^{{n}}b_k^{2}={C}$. Find $\\sum_{k=1}^{{n}}({comb})^{2}$. " + IE, ["Expand the square inside the sum.", "Use linearity of $\\sum$ to express the result by the three given sums."], "$({comb})^{2}={expand}$, so ${work}$."],
  },
  alg_sigmaTelescope: {
    ko: ["다음 합의 값을 구하세요. ${expr}$ " + FK, ["각 항을 부분분수로 나누어 보세요. 예: $\\frac{1}{k(k+1)}=\\frac{1}{k}-\\frac{1}{k+1}$", "더하면 앞뒤 항이 차례로 약분되고 처음 몇 개와 마지막 몇 개만 남아요."], "${work}$ 입니다."],
    en: ["Evaluate the sum ${expr}$. " + FE, ["Split each term into partial fractions, e.g. $\\frac{1}{k(k+1)}=\\frac{1}{k}-\\frac{1}{k+1}$.", "When added, the terms cancel in pairs and only a few at each end remain."], "${work}$."],
  },
  alg_sigmaSubseq: {
    ko: ["수열 $\\{a_n\\}$의 일반항이 $a_n={an}$ 일 때, $\\sum_{k=1}^{{m}}a_{{idx}}$ 의 값은? " + ID, ["$a_{{idx}}$ 의 $n$ 자리에 ${idx}$ 를 넣어 $k$ 에 대한 식으로 만드세요.", "$\\sum k=\\frac{m(m+1)}{2}$, $\\sum k^{2}=\\frac{m(m+1)(2m+1)}{6}$, $\\sum c=cm$ 을 쓰세요."], "$a_{{idx}}={term}$ 이므로 ${work}$ 입니다."],
    en: ["The general term of $\\{a_n\\}$ is $a_n={an}$. Find $\\sum_{k=1}^{{m}}a_{{idx}}$. " + IE, ["Substitute ${idx}$ for $n$ to get an expression in $k$.", "Use $\\sum k=\\frac{m(m+1)}{2}$, $\\sum k^{2}=\\frac{m(m+1)(2m+1)}{6}$ and $\\sum c=cm$."], "$a_{{idx}}={term}$, so ${work}$."],
  },
  alg_seriesPattern: {
    ko: ["다음 합의 값을 구하세요. ${expr}$ " + ID, ["규칙을 찾아 일반항 $a_k$ 를 $k$ 에 대한 식으로 나타내세요.", "$\\sum k$, $\\sum k^{2}$ 등의 공식으로 계산하세요(부호가 번갈아 나오면 둘씩 묶어 보세요)."], "${work}$ 입니다."],
    en: ["Evaluate ${expr}$. " + IE, ["Find the pattern and write the general term $a_k$ as an expression in $k$.", "Use the formulas for $\\sum k$, $\\sum k^{2}$ and so on (if the signs alternate, group the terms in pairs)."], "${work}$."],
  },
  alg_recAffine: {
    ko: ["수열 $\\{a_n\\}$이 $a_1={s}$, $a_{n+1}={rule}$ ($n\\ge1$) 로 정의될 때, $a_{{k}}$ 의 값은? " + FK, ["$a_2, a_3, \\dots$ 를 차례로 구해 보세요.", "항이 많으면 $a_{n+1}-\\alpha=p(a_n-\\alpha)$ 꼴로 바꾸어 일반항을 구할 수도 있어요."], "${work}$ 입니다."],
    en: ["A sequence $\\{a_n\\}$ is defined by $a_1={s}$ and $a_{n+1}={rule}$ ($n\\ge1$). Find $a_{{k}}$. " + FE, ["Compute $a_2, a_3, \\dots$ one after another.", "For many terms, rewrite as $a_{n+1}-\\alpha=p(a_n-\\alpha)$ to get the general term."], "${work}$."],
  },
  alg_collatz: {
    ko: ["수열 $\\{a_n\\}$이 $a_1={s}$ 이고, $a_n$이 짝수이면 $a_{n+1}=\\frac{a_{n}}{2}$, $a_n$이 홀수이면 $a_{n+1}={odd}$ 로 정의될 때, $a_n=1$ 을 만족시키는 가장 작은 자연수 $n$의 값은? " + ID, ["$a_1$ 부터 차례로 구하면서 짝수·홀수에 맞는 식을 적용하세요.", "처음으로 $1$ 이 나오는 항의 번호를 세세요."], "항을 차례로 구하면 ${work}$ 이므로 처음 $1$ 이 나오는 것은 제 ${ans}$ 항입니다."],
    en: ["A sequence $\\{a_n\\}$ has $a_1={s}$; if $a_n$ is even then $a_{n+1}=\\frac{a_{n}}{2}$, and if $a_n$ is odd then $a_{n+1}={odd}$. Find the smallest positive integer $n$ with $a_n=1$. " + IE, ["Compute the terms one by one from $a_1$, using the rule for even or odd values.", "Count the position of the first term equal to $1$."], "The terms are ${work}$, so the first $1$ is term number ${ans}$."],
  },
  alg_recParam: {
    ko: ["수열 $\\{a_n\\}$이 $a_1={s}$, $a_{n+1}=pa_n+{q}$ ($n\\ge1$, $p$는 양수) 로 정의되고 $a_3={t}$ 일 때, $p$의 값은? " + FK, ["$a_2$, $a_3$ 를 $p$ 로 나타내 보세요.", "$a_3$ 이 $p$ 에 대한 이차식이 돼요. 양수인 해를 고르세요."], "$a_2={st}p+{q}$, $a_3=p({st}p+{q})+{q}={st}p^{2}+{q}p+{q}={t}$ 에서 ${work}$ 이고 $p>0$ 이므로 $p={ans}$ 입니다."],
    en: ["A sequence $\\{a_n\\}$ satisfies $a_1={s}$, $a_{n+1}=pa_n+{q}$ ($n\\ge1$, $p$ positive) and $a_3={t}$. Find $p$. " + FE, ["Express $a_2$ and $a_3$ in terms of $p$.", "$a_3$ is a quadratic in $p$; pick the positive solution."], "$a_2={st}p+{q}$ and $a_3=p({st}p+{q})+{q}={st}p^{2}+{q}p+{q}={t}$ give ${work}$; since $p>0$, $p={ans}$."],
  },
  alg_seqIntTerms: {
    ko: ["수열 $\\{a_n\\}$의 일반항이 $a_n=\\frac{{num}}{{den}}$ 일 때, 정수인 항의 개수는? " + ID, ["분자를 분모로 나누어 $a_n=k+\\frac{c}{n+r}$ ($k$는 정수, $c$는 상수) 꼴로 바꿔요.", "상수의 약수 중 분모 $n+r$ 이 될 수 있는 것(자연수 $n$에 대해 $n+r\\ge{r1}$)을 세세요."], "${work}$ 이므로 정수인 항은 모두 ${ans}$개입니다."],
    en: ["The general term of $\\{a_n\\}$ is $a_n=\\frac{{num}}{{den}}$. How many terms are integers? " + IE, ["Divide the numerator by the denominator to get $a_n=k+\\frac{c}{n+r}$ ($k$ an integer, $c$ a constant).", "Count the divisors of the constant that the denominator $n+r$ can equal (for natural $n$, $n+r\\ge{r1}$)."], "${work}$, so ${ans}$ terms are integers."],
  },
};

/* ---------- generators ---------- */
export const GEN = {
  alg_rootEval: (r, lvl) => tryGen(() => {
    const kind = lvl === 1 ? r.pick([1, 2]) : 3;
    if (kind === 1) {
      const n = r.pick([3, 4]), c = r.int(2, n === 3 ? 7 : 5), N = c ** n;
      const divs = []; for (let a = 2; a < N; a++) if (N % a === 0 && N / a !== a) divs.push(a);
      const a = r.pick(divs), b = N / a;
      return { v: { expr: `${rt(n, a)}\\times${rt(n, b)}`, work: `${rt(n, a)}\\times${rt(n, b)}=${rt(n, `${a}\\times${b}`)}=${rt(n, N)}=${rt(n, `${c}^{${n}}`)}=${c}`, kind: 1, ra: a, rb: b, rn: n, rm: 0 }, ans: c };
    }
    if (kind === 2) {
      const n = r.pick([3, 4]), c = r.int(2, n === 3 ? 5 : 3), b = r.int(2, 12), a = b * c ** n;
      if (a > 6000) return null;
      return { v: { expr: `\\frac{${rt(n, a)}}{${rt(n, b)}}`, work: `\\frac{${rt(n, a)}}{${rt(n, b)}}=${rt(n, `\\frac{${a}}{${b}}`)}=${rt(n, c ** n)}=${rt(n, `${c}^{${n}}`)}=${c}`, kind: 2, ra: a, rb: b, rn: n, rm: 0 }, ans: c };
    }
    const [m, n] = r.pick([[2, 2], [2, 3], [3, 2], [3, 3]]), c = r.int(2, m * n === 4 ? 6 : m * n === 6 ? 4 : 3), a = c ** (m * n);
    return { v: { expr: `${rt(m, rt(n, a))}`, work: `${rt(m, rt(n, a))}=${rt(m * n, a)}=${rt(m * n, `${c}^{${m * n}}`)}=${c}`, kind: 3, ra: a, rb: 0, rn: n, rm: m }, ans: c };
  }),
  alg_realRootCount: (r, lvl) => {
    const N = r.int(6, 16), E = fl(N, 2), O = N - 1 - E;
    let rad, neg;
    if (lvl === 1) { const a = r.nonzero(-30, 30); rad = String(a); neg = a < 0; }
    else {
      const b = r.int(2, 5), e = r.int(2, 5), kind = r.int(0, 3);
      if (kind === 0) { rad = `(-${b})^{${e}}`; neg = e % 2 === 1; }
      else if (kind === 1) { rad = `-${b}^{${e}}`; neg = true; }
      else if (kind === 2) { rad = `-(-${b})^{${e}}`; neg = e % 2 === 0; }
      else { rad = `${b}^{${e}}`; neg = false; }
    }
    const ans = neg ? O : 2 * E + O;
    return { v: { rad, N, work: neg ? `0\\times${E}+1\\times${O}=${ans}` : `2\\times${E}+1\\times${O}=${ans}` }, ans };
  },
  alg_rationalExp: (r, lvl) => tryGen(() => {
    const one = (neg) => { const q = r.pick([2, 3, 4]), p = r.int(1, 4); if (gcd(p, q) !== 1) return null; const c = r.int(2, 6), a = c ** q; if (a > 1300) return null; return { q, p, c, a, neg }; };
    if (lvl === 1) {
      const neg = r.next() < 0.5, t = one(neg); if (!t) return null;
      const { q, p, c, a } = t, sgnS = neg ? "-" : "";
      const val = neg ? new Q(1).div(qpow(c, p)) : new Q(c ** p);
      if (c ** p > 700) return null;
      const work = `${a}^{${sgnS}\\frac{${p}}{${q}}}=(${c}^{${q}})^{${sgnS}\\frac{${p}}{${q}}}=${c}^{${sgnS}${p}}=${neg ? `\\frac{1}{${c ** p}}` : c ** p}`;
      return { v: { expr: `${a}^{${sgnS}\\frac{${p}}{${q}}}`, work, a1: a, n1: neg ? -p : p, d1: q, a2: 1, n2: 0, d2: 1 }, ans: qn(val) };
    }
    const t1 = one(), t2 = one(); if (!t1 || !t2) return null;
    const s1 = r.pick([1, -1]), s2 = -s1;
    const k1 = s1 * t1.p, k2 = s2 * t2.p, val = qpow(t1.c, k1).mul(qpow(t2.c, k2));
    if (Math.abs(qn(val)) > 5000 || Number(val.q) > 2000 || qn(val) < 1e-4) return null;
    const ex = (s, p, q) => `${s < 0 ? "-" : ""}\\frac{${p}}{${q}}`;
    const work = `${t1.a}^{${ex(s1, t1.p, t1.q)}}\\times${t2.a}^{${ex(s2, t2.p, t2.q)}}=${t1.c}^{${k1}}\\times${t2.c}^{${k2}}=${qt(val)}`;
    return { v: { expr: `${t1.a}^{${ex(s1, t1.p, t1.q)}}\\times${t2.a}^{${ex(s2, t2.p, t2.q)}}`, work, a1: t1.a, n1: k1, d1: t1.q, a2: t2.a, n2: k2, d2: t2.q }, ans: qn(val) };
  }),
  alg_expSum: (r, lvl) => {
    const a = r.pick([2, 3, 5, 10]), g = r.pick([1, 1, 2]);
    const e1 = lvl === 1 ? 1 : -1, k = r.pick([2, 2, 3]);
    const s = e1 > 0 ? (k === 2 ? r.int(3, 15) : r.int(3, 9)) : r.int(1, 9);
    const gx = g === 1 ? "x" : `${g}x`, kx = `${k * g}x`;
    const e2 = e1 > 0 ? 1 : k === 2 ? 1 : -1;
    const ans = e1 > 0 ? (k === 2 ? s * s - 2 : s ** 3 - 3 * s) : k === 2 ? s * s + 2 : s ** 3 + 3 * s;
    const work = e1 > 0 ? (k === 2 ? `(t+\\frac{1}{t})^{2}=t^{2}+2+\\frac{1}{t^{2}}\\ \\Rightarrow\\ t^{2}+\\frac{1}{t^{2}}=${s}^{2}-2=${ans}` : `(t+\\frac{1}{t})^{3}=t^{3}+3(t+\\frac{1}{t})+\\frac{1}{t^{3}}\\ \\Rightarrow\\ t^{3}+\\frac{1}{t^{3}}=${s}^{3}-3\\times${s}=${ans}`)
      : (k === 2 ? `(t-\\frac{1}{t})^{2}=t^{2}-2+\\frac{1}{t^{2}}\\ \\Rightarrow\\ t^{2}+\\frac{1}{t^{2}}=${s}^{2}+2=${ans}` : `(t-\\frac{1}{t})^{3}=t^{3}-3(t-\\frac{1}{t})-\\frac{1}{t^{3}}\\ \\Rightarrow\\ t^{3}-\\frac{1}{t^{3}}=${s}^{3}+3\\times${s}=${ans}`);
    return { v: { given: `${a}^{${gx}}${e1 > 0 ? "+" : "-"}${a}^{-${gx}}=${s}`, ask: `${a}^{${kx}}${e2 > 0 ? "+" : "-"}${a}^{-${kx}}`, work, a, g, e1, k, e2, s }, ans };
  },
  alg_logChain: (r, lvl) => tryGen(() => {
    const L = (x, y) => `\\log_{${x}}${y}`;
    if (lvl === 1) {
      const a = r.pick([2, 3, 5, 7]), k = r.int(2, a === 7 ? 3 : 5), b = r.int(2, 12), c = r.int(2, 12), d = a ** k;
      if (a === b || b === c || c === d) return null;
      return { v: { expr: `${L(a, b)}\\times${L(b, c)}\\times${L(c, d)}`, work: `${L(a, b)}\\times${L(b, c)}\\times${L(c, d)}=${L(a, d)}=${L(a, `${a}^{${k}}`)}=${k}`, args: `${a},${b},${c},${d}` }, ans: k };
    }
    const a = r.pick([2, 3]), m = r.pick([2, 3]), k = r.int(1, 7), b = a ** m, d = a ** k, c = r.int(2, 11);
    if (c === b || c === d || b === d) return null;
    const w = new Q(k, m);
    return { v: { expr: `${L(b, c)}\\times${L(c, d)}`, work: `${L(b, c)}\\times${L(c, d)}=${L(b, d)}=\\log_{${a}^{${m}}}${a}^{${k}}=${qt(w)}`, args: `${b},${c},${d}` }, ans: qn(w) };
  }),
  alg_logExpress: (r, lvl) => tryGen(() => {
    const m = lvl === 1 ? 1 : r.pick([2, 3, 2]);
    const e2 = r.int(lvl === 1 ? 0 : -3, 3), e3 = r.int(lvl === 1 ? 0 : -2, 3), e5 = r.int(lvl === 1 ? 0 : -2, 2);
    if ((e2 === 0 ? 0 : 1) + (e3 === 0 ? 0 : 1) + (e5 === 0 ? 0 : 1) < 2 || (e3 === 0 && e5 === 0)) return null;
    if (lvl === 1 && !(e3 !== 0 || e5 !== 0)) return null;
    let Rn = 1, Rd = 1; for (const [pr, e] of [[2, e2], [3, e3], [5, e5]]) { if (e > 0) Rn *= pr ** e; else Rd *= pr ** -e; }
    if (Rn > 3000 || Rd > 3000) return null;
    if (lvl === 2 && Rn === 1 && Rd === 1) return null;
    const rad = Rd === 1 ? `${Rn}` : `\\frac{${Rn}}{${Rd}}`;
    const N = m === 1 ? rad : rt(m, rad);
    const x = new Q(e3, m), y = new Q(e5, m), z = new Q(e2, m);
    const form = sumTex([cterm(x, "a"), cterm(y, "b"), cterm(z, "")]);
    const tot = x.add(y).add(z);
    const fac = `${[[2, e2], [3, e3], [5, e5]].filter(([, e]) => e !== 0).map(([pr, e]) => `${pr}^{${e}}`).join("\\times")}`;
    const work = `\\log_{2}${N}=${m === 1 ? "" : `\\frac{1}{${m}}\\log_{2}(${fac})=`}${m === 1 ? `\\log_{2}(${fac})=` : ""}${form}`;
    return { v: { N, work, sumtex: qt(tot), Rn, Rd, m }, ans: qn(tot) };
  }),
  alg_digitsPow: (r, lvl) => tryGen(() => {
    const LG = { 2: 3010, 3: 4771, 5: 6990, 7: 8451 };
    const bs = lvl === 1 ? [r.pick([2, 3, 5, 7])] : r.pick([[2, 3], [2, 5], [2, 7], [3, 5], [3, 7], [5, 7]]);
    const ns = bs.map(() => (lvl === 1 ? r.int(12, 120) : r.int(5, 45)));
    let tot = 0, big = 1n; bs.forEach((b, i) => { tot += ns[i] * LG[b]; big *= BigInt(b) ** BigInt(ns[i]); });
    const dig = big.toString().length, given = Math.floor(tot / 10000) + 1;
    if (dig !== given) return null;
    if (tot % 10000 < 30 || tot % 10000 > 9970) return null;
    const N = bs.map((b, i) => `${b}^{${ns[i]}}`).join("\\times");
    const lg = (tot / 10000).toFixed(4).replace(/0+$/, "");
    const gv = bs.map((b) => `\\log ${b}=0.${String(LG[b]).padStart(4, "0")}`).join(",\\ ");
    return { v: { given: gv, N, lg, ip: Math.floor(tot / 10000), b1: bs[0], n1: ns[0], b2: bs[1] ?? 1, n2: ns[1] ?? 0 }, ans: dig };
  }),
  alg_growthYears: (r, lvl) => tryGen(() => {
    const rate = r.pick([2, 3, 4, 5, 6, 8, 10, 12]), k = lvl === 1 ? r.pick([2, 3]) : r.pick([4, 5, 10]);
    const l1 = Math.log10(1 + rate / 100).toFixed(4), lk = Math.log10(k).toFixed(4);
    const q = Number(lk) / Number(l1);
    const ng = Math.ceil(q - 1e-12);
    if (Math.abs(q - Math.round(q)) < 1e-9) return null;
    // exact smallest n
    let n = 0, num = 1n; const den = 100n ** 0n; let cur = new Q(1); const grow = new Q(100 + rate, 100);
    while (cur.toNumber() < k) { cur = cur.mul(grow); n++; if (n > 400) return null; }
    if (n !== ng || n < 5) return null;
    const one = `1+\\frac{${rate}}{100}`;
    const kl = k === 10 ? "\\log 10=1" : `\\log ${k}=${lk}`;
    return { v: { rate, k, given: `\\log 1.${String(rate).padStart(2, "0")}=${l1},\\ ${kl}`, one: (1 + rate / 100).toFixed(2), lk, l1, q: q.toFixed(2) }, ans: n };
  }),
  alg_expFuncParams: (r, lvl) => tryGen(() => {
    const b = lvl === 1 ? new Q(r.pick([2, 3, 4, 5])) : new Q(...r.pick([[1, 2], [1, 3], [2, 3], [3, 2], [1, 4], [3, 4]]));
    const a = lvl === 1 ? r.int(1, 6) : r.nonzero(-6, 6) * (r.next() < 0.3 ? 1 : 1);
    let p = lvl === 1 ? r.int(1, 3) : r.int(-2, 2); const d = r.pick([1, 2, 2, 3]); let q = p + d; if (r.next() < 0.3) [p, q] = [q, p];
    const rr = lvl === 1 ? r.int(0, 6) : r.int(-3, 5); if (rr === p || rr === q) return null;
    const f = (x) => new Q(a).mul(qpow(b, x));
    const u = f(p), v = f(q), ans = f(rr);
    if (Number(ans.q) > 500 || Number(u.q) > 300 || Number(v.q) > 300 || Math.abs(qn(ans)) > 20000) return null;
    const lo = Math.min(p, q), hi = Math.max(p, q), flo = f(lo), fhi = f(hi);
    const ratio = fhi.div(flo);
    const work = `\\frac{f(${hi})}{f(${lo})}=\\frac{${qt(fhi)}}{${qt(flo)}}=b^{${hi - lo}}=${qt(ratio)}\\ \\Rightarrow\\ b=${qt(b)}\\ (b>0),\\ a=${qt(new Q(a))},\\ f(${rr})=${qt(new Q(a))}\\times(${qt(b)})^{${rr}}=${qt(ans)}`;
    return { v: { p, u: qt(u), q, v: qt(v), r: rr, work }, ans: qn(ans) };
  }),
  alg_expShiftA: (r, lvl) => tryGen(() => {
    const aq = r.pick([new Q(2), new Q(3), new Q(4), new Q(5), new Q(1, 2), new Q(1, 3), new Q(1, 4)]);
    const c = lvl === 1 ? 1 : r.pick([2, 3, -1, -2, 4]);
    const e = r.pick([-3, -2, -1, 1, 2, 3]);
    const w = new Q(c).mul(qpow(aq, e)); if (!w.isInt) return null;
    const rev = lvl === 2 && r.next() < 0.5, m = r.int(-3, 3), n = r.int(-4, 4);
    const W = Number(w.p);
    const p = rev ? m - e : m + e, q = n + W;
    const ex = rev ? (m === 0 ? "-x" : `${m}-x`) : xminus(m);
    const f = `y=${coefTex(c)}a^{${ex}}${n === 0 ? "" : sg(n)}`;
    const asol = qt(aq);
    const nb = n < 0 ? `(${n})` : `${n}`;
    const work = c === 1 ? `a^{${e}}=${q}-${nb}=${W}\\ \\Rightarrow\\ a=${asol}` : `${c}a^{${e}}=${q}-${nb}=${W}\\ \\Rightarrow\\ a^{${e}}=${qt(new Q(W).div(c))}\\ \\Rightarrow\\ a=${asol}`;
    return { v: { f, p, q, c, e, n, work }, ans: qn(aq) };
  }),
  alg_expEquation: (r, lvl) => tryGen(() => {
    const b = r.pick([2, 2, 3]);
    let p, q;
    if (lvl === 1) { p = r.int(0, b === 2 ? 4 : 3); q = r.int(0, b === 2 ? 4 : 3); if (p === q) return null; if (p + q === 0) return null; }
    else { p = r.int(-3, 3); q = r.int(-3, 3); if (p === q || (p >= 0 && q >= 0)) return null; }
    const [lo, hi] = p < q ? [p, q] : [q, p];
    const u1 = b ** Math.max(0, -p), v1 = b ** Math.max(0, p), u2 = b ** Math.max(0, -q), v2 = b ** Math.max(0, q);
    const A = u1 * u2, Bc = u1 * v2 + u2 * v1, Cc = v1 * v2;
    const fac = (u, v) => `${u === 1 ? "" : u}t-${v}`;
    const t1 = qpow(b, p), t2 = qpow(b, q);
    let eq, work, kind;
    if (lvl === 1 && r.next() < 0.45) {
      kind = 2; eq = `${b}^{x}+${Cc}\\cdot${b}^{-x}=${Bc}`;
      work = `${b}^{x}=t\\ (t>0):\\ t+\\frac{${Cc}}{t}=${Bc}\\Rightarrow t^{2}-${Bc}t+${Cc}=0\\Rightarrow(t-${v1})(t-${v2})=0,\\ x=${p},\\ ${q}`;
    } else {
      kind = 1; eq = `${A === 1 ? "" : `${A}\\cdot`}${b * b}^{x}-${Bc}\\cdot${b}^{x}+${Cc}=0`;
      work = `${b}^{x}=t\\ (t>0):\\ (${fac(u1, v1)})(${fac(u2, v2)})=0\\Rightarrow t=${qt(qpow(b, lo))},\\ ${qt(qpow(b, hi))}\\Rightarrow x=${lo},\\ ${hi}`;
    }
    return { v: { eq, work, kind, b, A: kind === 2 ? 1 : A, Bc, Cc }, ans: p + q };
  }),
  alg_expInequality: (r, lvl) => tryGen(() => {
    const b = r.pick([2, 3]);
    const mL = lvl === 1 ? 1 : r.int(1, 3), kR = lvl === 1 ? 1 : r.int(1, 3);
    const sL = lvl === 2 ? r.pick([1, -1]) : 1, sR = lvl === 2 ? r.pick([1, -1]) : 1;
    if (lvl === 2 && mL === 1 && kR === 1 && sL === 1 && sR === 1) return null;
    const uL = r.int(-2, 4), vR = r.nonzero(-3, 3), wR = r.int(-4, 6);
    const rel = r.pick(["le", "lt", "ge", "gt"]);
    const A = sL * mL, B = -sL * mL * uL - sR * kR * vR, C = -sR * kR * wR;
    if ((A > 0 && (rel === "ge" || rel === "gt")) || (A < 0 && (rel === "le" || rel === "lt"))) return null;
    const ok = (x) => { const v = A * x * x + B * x + C; return rel === "le" ? v <= 0 : rel === "lt" ? v < 0 : rel === "ge" ? v >= 0 : v > 0; };
    const sol = []; for (let x = -80; x <= 80; x++) if (ok(x)) sol.push(x);
    if (sol.length < 3 || sol.length > 14) return null;
    const base = (s, mm) => (s * mm > 0 ? `${b ** mm}` : `\\left(\\frac{1}{${b ** mm}}\\right)`);
    const relT = { le: "\\le", lt: "<", ge: "\\ge", gt: ">" }[rel];
    const ineq = `${base(sL, mL)}^{${poly([1, -uL, 0]).replace(/^x\^2/, "x^{2}")}}${relT}${base(sR, kR)}^{${lin(vR, wR)}}`.replace(/x\^2/g, "x^{2}");
    const work = `${poly([A, B, C]).replace(/x\^2/g, "x^{2}")}${relT}0`;
    return { v: { ineq, work, xs: sol.join(", "), b, sL, mL, uL, sR, kR, vR, wR, rel }, ans: sol.length };
  }),
  alg_logEquation: (r, lvl) => tryGen(() => {
    const Bs = lvl === 1 ? 2 : r.pick([2, 3, 5]);
    const i = r.int(0, Bs === 2 ? 4 : 3), j = r.int(0, Bs === 2 ? 4 : 3); if (i === j) return null;
    const p = r.int(-8, 8), x0 = Bs ** i - p, q = Bs ** j - x0;
    if (q === p || Math.abs(q) > 40 || Math.abs(x0) > 60) return null;
    if (lvl === 1 && (p <= 0 || q <= 0)) return null;
    if (lvl === 2 && p > 0 && q > 0) return null;
    const c = i + j, y = -p - q - x0;
    const dom = `x>${Math.max(-p, -q)}`;
    const eq = `\\log_{${Bs}}${argx(p)}+\\log_{${Bs}}${argx(q)}=${c}`;
    const work = `${argx(p)}${argx(q)}=${Bs}^{${c}}=${Bs ** c}\\ \\Rightarrow\\ ${poly([1, p + q, p * q - Bs ** c])}=0\\ \\Rightarrow\\ x=${x0},\\ ${y}`.replace(/x\^2/g, "x^{2}");
    return { v: { eq, dom, work, B: Bs, p, q, c }, ans: x0 };
  }),
  alg_logInequality: (r, lvl) => tryGen(() => {
    if (lvl === 1) {
      const inv = r.next() < 0.4, b = r.pick([2, 3, 4, 5]), k = r.int(-4, 5);
      let lo, hi, L, U;
      if (!inv) { lo = r.int(0, 2); hi = lo + r.int(1, 2); L = b ** lo; U = b ** hi; }
      else { hi = -r.int(0, 2); lo = hi - r.int(1, 2); L = b ** -hi; U = b ** -lo; if (lo < -3) return null; }
      if (U > 64) return null;
      const bt = inv ? `\\frac{1}{${b}}` : `${b}`;
      const ineq = `${lo}\\le\\log_{${bt}}${argx(-k)}\\le ${hi}`.replace(/\(x\+-/, "(x-");
      const cnt = U - L + 1;
      const work = `${inv ? `${b}^{${-hi}}\\le x${sg(-k)}\\le ${b}^{${-lo}}` : `${b}^{${lo}}\\le x${sg(-k)}\\le ${b}^{${hi}}`}\\ \\Rightarrow\\ ${L + k}\\le x\\le ${U + k}`;
      return { v: { ineq, work, kind: 1, bn: inv ? 1 : b, bd: inv ? b : 1, k, lo, hi, p: 0, q: 0, u: 0, c: 0, rel: "" }, ans: cnt };
    }
    if (lvl === 2) {
      const inv = r.next() < 0.4, b = r.pick([2, 3]), p = r.int(-5, 4), gap = r.int(7, 21), q = p + gap, rel = r.pick(["lt", "le", "gt", "ge"]);
      const relT = { le: "\\le", lt: "<", ge: "\\ge", gt: ">" }[rel];
      // effective relation on (x-p) vs (q-x)
      const eff = inv ? { lt: "gt", le: "ge", gt: "lt", ge: "le" }[rel] : rel;
      const hit = []; for (let x = p + 1; x < q; x++) { const u = x - p, w = q - x; if (eff === "lt" ? u < w : eff === "le" ? u <= w : eff === "gt" ? u > w : u >= w) hit.push(x); }
      const cnt = hit.length;
      if (cnt < 3) return null;
      const bt = inv ? `\\frac{1}{${b}}` : `${b}`;
      const ineq = `\\log_{${bt}}${argx(-p)}${relT}\\log_{${bt}}(${q}-x)`;
      const effT = { le: "\\le", lt: "<", ge: "\\ge", gt: ">" }[eff];
      const work = `${p}<x<${q},\\ x${sg(-p)}${effT}${q}-x\\ \\Rightarrow\\ x=${hit[0]},\\ \\ldots,\\ ${hit[hit.length - 1]}`;
      return { v: { ineq, work, kind: 2, bn: inv ? 1 : b, bd: inv ? b : 1, k: 0, lo: 0, hi: 0, p, q, u: 0, c: 0, rel }, ans: cnt };
    }
    const inv = r.next() < 0.4, b = r.pick([2, 3]), u = r.int(1, 5), cexp = r.int(1, 3);
    const strict = r.next() < 0.5;
    const bound = b ** cexp; const cnt = []; for (let x = -60; x <= 60; x++) { const f = x * x - u * x; if (f > 0 && (strict ? f < bound : f <= bound)) cnt.push(x); }
    if (cnt.length < 3 || cnt.length > 16) return null;
    const bt = inv ? `\\frac{1}{${b}}` : `${b}`;
    const rel = inv ? (strict ? "gt" : "ge") : strict ? "lt" : "le";
    const relT = { le: "\\le", lt: "<", ge: "\\ge", gt: ">" }[rel];
    const ineq = `\\log_{${bt}}(x^{2}${u === 1 ? "-x" : `-${u}x`})${relT}${inv ? -cexp : cexp}`;
    const work = `0<x^{2}${u === 1 ? "-x" : `-${u}x`}${strict ? "<" : "\\le"}${bound}\\ \\Rightarrow\\ x\\in\\{${cnt.join(",")}\\}`;
    return { v: { ineq, work, kind: 3, bn: inv ? 1 : b, bd: inv ? b : 1, k: 0, lo: 0, hi: 0, p: 0, q: 0, u, c: inv ? -cexp : cexp, rel }, ans: cnt.length };
  }),
  alg_inverseGraph: (r, lvl) => tryGen(() => {
    const aq = r.pick([new Q(2), new Q(3), new Q(4), new Q(5), new Q(1, 2), new Q(1, 3), new Q(1, 4)]);
    const big = aq.isInt;
    const e = big ? r.int(1, 3) : -r.int(1, 3);
    const w = qpow(aq, e); if (!w.isInt) return null; const W = Number(w.p);
    const m = r.int(-4, 4), n = r.int(-4, 4);
    let f, p, q, work;
    if (lvl === 1) {
      q = W - m; p = n + e;
      f = `y=\\log_{a}${m === 0 ? "x" : `(x${sg(m)})`}${n === 0 ? "" : sg(n)}`;
      work = `\\log_{a}(${q}${sg(m)})${n === 0 ? "" : sg(n)}=${p}\\ \\Rightarrow\\ \\log_{a}${W}=${e}\\ \\Rightarrow\\ a^{${e}}=${W}\\ \\Rightarrow\\ a=${qt(aq)}`;
    } else {
      q = m + e; p = n + W;
      f = `y=a^{${xminus(m)}}${n === 0 ? "" : sg(n)}`;
      work = `a^{${q}${m === 0 ? "" : sg(-m)}}${n === 0 ? "" : sg(n)}=${p}\\ \\Rightarrow\\ a^{${e}}=${W}\\ \\Rightarrow\\ a=${qt(aq)}`;
    }
    return { v: { f, p, q, work, kind: lvl, m, n }, ans: qn(aq) };
  }),
  alg_logDomain: (r, lvl) => tryGen(() => {
    const Bt = r.pick(["2", "3", "5", "10", "\\frac{1}{2}", "\\frac{1}{3}"]);
    const kind = lvl === 1 ? r.pick([1, 2]) : r.pick([3, 4]);
    let f, work, cnt, p = 0, q = 0, u = 0, w = 0, k = 0, r1 = 0, r2 = 0;
    if (kind === 1) {
      p = r.int(-6, 4); q = p + r.int(4, 14); cnt = q - p - 1;
      f = `y=\\log_{${Bt}}${p === 0 ? "x" : `(x${sg(-(-p))})`}`.replace("(x+-", "(x-");
      f = `y=\\log_{${Bt}}${p === 0 ? "x" : `(x${p > 0 ? `-${p}` : `+${-p}`})`}+\\log_{${Bt}}${q === 0 ? "(-x)" : `(${q}-x)`}`;
      work = `x${p > 0 ? `>${p}` : p < 0 ? `>${p}` : ">0"},\\ x<${q}\\ \\Rightarrow\\ ${p}<x<${q}`;
    } else if (kind === 2 || kind === 3) {
      r1 = r.int(-7, 3); r2 = r1 + r.int(4, 12); u = r1 + r2; w = -r1 * r2;
      const quad = poly([-1, u, w]).replace(/x\^2/g, "x^{2}");
      if (kind === 2) { cnt = r2 - r1 - 1; f = `y=\\log_{${Bt}}(${quad})`; work = `${quad}>0\\ \\Rightarrow\\ (x${sg(-r1)})(x${sg(-r2)})<0\\ \\Rightarrow\\ ${r1}<x<${r2}`; }
      else {
        k = r.int(r1 - 2, r2 - 3); cnt = r2 - Math.max(r1, k) - 1; if (cnt < 2) return null;
        f = `y=\\log_{${Bt}}(${quad})+\\log_{${Bt}}${k === 0 ? "x" : `(x${k > 0 ? `-${k}` : `+${-k}`})`}`;
        work = `${r1}<x<${r2},\\ x>${k}\\ \\Rightarrow\\ ${Math.max(r1, k)}<x<${r2}`;
      }
    } else {
      p = r.int(-6, 4); q = r.int(Math.max(-p + 4, 1), -p + 14); cnt = q + p;
      f = `y=\\log_{${Bt}}${p === 0 ? "x" : `(x${p > 0 ? `+${p}` : `-${-p}`})`}+\\sqrt{${q}-x}`.replace("(x+-", "(x-");
      work = `x${sg(p)}>0,\\ ${q}-x\\ge0\\ \\Rightarrow\\ ${-p}<x\\le ${q}`.replace("x+-", "x-").replace(/x\+0>0/, "x>0");
    }
    if (cnt < 3) return null;
    return { v: { f, work, kind, p, q, u, w, k, r1, r2 }, ans: cnt };
  }),
  alg_expMaxMin: (r, lvl) => tryGen(() => {
    const bq = lvl === 1 ? new Q(r.pick([2, 3, 5])) : new Q(...r.pick([[1, 2], [1, 3], [2, 1], [3, 1], [1, 2], [1, 5]]));
    const kk = lvl === 1 ? 1 : r.pick([1, 1, 2, -1, 3]), cc = lvl === 1 ? 0 : r.pick([0, 0, 1, 2, -2, 5]);
    const s = r.int(-2, 2), t = s + r.int(3, 6), pv = r.int(s - 1, t + 1), rv = r.int(-2, 6);
    const g = (x) => x * x - 2 * pv * x + rv;
    const cand = [s, t]; if (pv >= s && pv <= t) cand.push(pv);
    const gs = cand.map(g);
    if (Math.max(...gs) > 11 || Math.min(...gs) < -8) return null;
    const val = (x) => new Q(kk).mul(qpow(bq, g(x))).add(cc);
    const vals = cand.map(val); let best = vals[0], bi = 0; vals.forEach((v, i) => { if (qn(v) > qn(best)) { best = v; bi = i; } });
    if (Number(best.q) > 3000 || Math.abs(qn(best)) > 100000) return null;
    const bT = bq.isInt ? `${bq.p}` : `\\left(\\frac{${bq.p}}{${bq.q}}\\right)`;
    const gT = poly([1, -2 * pv, rv]).replace(/x\^2/g, "x^{2}");
    const f = `y=${kk === 1 ? "" : kk === -1 ? "-" : `${kk}\\cdot`}${bT}^{${gT}}${cc === 0 ? "" : sg(cc)}`;
    const gmax = Math.max(...gs), gmin = Math.min(...gs), gb = g(cand[bi]);
    const yexp = `${kk === 1 ? "" : kk === -1 ? "-" : `${kk}\\cdot`}${bT}^{${gb}}${cc === 0 ? "" : sg(cc)}`;
    const work = `g(x)=${gT}:\\ g_{\\min}=${gmin},\\ g_{\\max}=${gmax}\\ \\Rightarrow\\ y_{\\max}=${yexp}=${qt(best)}`;
    return { v: { f, s, t, work }, ans: qn(best) };
  }),
  alg_coterminal: (r, lvl) => tryGen(() => {
    const al = lvl === 1 ? r.int(1, 359) : 15 * r.int(1, 23);
    const n = lvl === 1 ? r.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]) : r.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    const deg = al + 360 * n;
    let theta, work;
    if (lvl === 1) { theta = `${deg}^\\circ`; work = `${deg}^\\circ=360^\\circ\\times${pr(n)}+${al}^\\circ`; }
    else { const fr = tfrac(deg, 180); theta = `${fr}\\pi`; work = `${theta}=${deg}^\\circ=360^\\circ\\times${pr(n)}+${al}^\\circ`; }
    if (lvl === 2 && gcd(deg, 180) === 180) return null;
    return { v: { theta, work }, ans: al };
  }),
  alg_halfAngleQuad: (r) => {
    const m = r.int(1, 4), n = r.int(2, 6);
    const qs = new Set(); const lo = 90 * (m - 1), step = 90 / 20;
    for (let k = 0; k < n; k++) for (let i = 1; i < 20; i++) { const th = lo + step * i + 360 * k; const a = (th / n) % 360; qs.add(Math.floor(a / 90) + 1); }
    const arr = [...qs].sort((a, b) => a - b), ans = arr.reduce((s, x) => s + x, 0);
    const rangesOf = Array.from({ length: n }, (_, k) => `(${(lo + 360 * k) / n}^\\circ,\\ ${(lo + 90 + 360 * k) / n}^\\circ)`).join(",\\ ");
    return { v: { m, n, work: `\\frac{\\theta}{${n}}\\in ${rangesOf}\\ \\Rightarrow\\ ${arr.join(",\\ ")}\\ \\Rightarrow\\ ${arr.join("+")}` }, ans };
  },
  alg_sectorForward: (r, lvl) => tryGen(() => {
    const rr = r.int(2, 12);
    let th, deg;
    if (lvl === 1) { deg = r.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300]); th = `${deg}^\\circ`; }
    else { const q = r.pick([3, 4, 5, 6, 8, 9, 10, 12]), p = r.int(1, 2 * q - 1); if (gcd(p, q) !== 1) return null; deg = (180 * p) / q; th = `${p === 1 ? "" : p}\\pi`; th = `\\frac{${p === 1 ? "" : p}\\pi}{${q}}`; }
    const a = new Q(rr * deg, 180), b = new Q(rr * rr * deg, 360), tot = a.add(b);
    const thr = new Q(deg, 180);
    const work = `\\theta=${cpi(thr)},\\ l=${rr}\\times${cpi(thr)}=${cpi(a)},\\ S=\\frac{1}{2}\\times${rr}^{2}\\times${cpi(thr)}=${cpi(b)}\\ \\Rightarrow\\ a+b=${qt(a)}+${qt(b)}`;
    return { v: { r: rr, th, work, sumtex: qt(tot) }, ans: qn(tot) };
  }),
  alg_sectorPerimArea: (r) => tryGen(() => {
    const r1 = r.int(2, 12), r2 = r.int(r1 + 1, 3 * r1 - 1);
    const P = 2 * (r1 + r2), S = r1 * r2;
    return { v: { P, S, work: `r^{2}-${r1 + r2}r+${S}=0\\ \\Rightarrow\\ (r-${r1})(r-${r2})=0` }, ans: r2 };
  }),
  alg_trigPoint: (r, lvl) => tryGen(() => {
    const quad = r.int(1, 4), { x, y, rr } = pointIn(r, quad, true);
    const s = new Q(y, rr), c = new Q(x, rr), t = new Q(y, x);
    let E, val;
    if (lvl === 1) {
      const a = r.nonzero(-6, 6), b = r.nonzero(-6, 6);
      E = `${coefTex(a)}\\sin\\theta${b > 0 ? "+" : ""}${coefTex(b)}\\cos\\theta`;
      val = s.mul(a).add(c.mul(b));
    } else { const nm = r.pick(trigEnames); const [tex, , v] = trigE(nm, s, c, t); E = tex; val = v; }
    if (Number(val.q) > 400) return null;
    const work = `r=\\sqrt{(${x})^{2}+(${y})^{2}}=${rr},\\ \\sin\\theta=${qt(s)},\\ \\cos\\theta=${qt(c)},\\ \\tan\\theta=${qt(t)}`;
    return { v: { xp: x, yp: y, E, vt: qt(val), work }, ans: qn(val) };
  }),
  alg_trigGiven: (r, lvl) => tryGen(() => {
    const quad = r.int(1, 4), { x, y, rr } = pointIn(r, quad, false);
    const s = new Q(y, rr), c = new Q(x, rr), t = new Q(y, x);
    const f = r.pick(["sin", "cos", "tan"]);
    const gv = f === "sin" ? s : f === "cos" ? c : t;
    const given = `\\${f}\\theta=${qt(gv)}`;
    const nm = r.pick(trigEnames); const [E, , val] = trigE(nm, s, c, t);
    if (Number(val.q) > 400) return null;
    const work = `\\sin\\theta=${qt(s)},\\ \\cos\\theta=${qt(c)},\\ \\tan\\theta=${qt(t)}`;
    return { v: { quad, given, E, vt: qt(val), work }, ans: qn(val) };
  }),
  alg_trigIdentity: (r, lvl) => tryGen(() => {
    const quad = r.int(1, 4), { x, y, rr } = pointIn(r, quad, false);
    const s = new Q(y, rr), c = new Q(x, rr);
    const sc = s.mul(c), sq = (q) => q.mul(q);
    let given, gval, list;
    const lvlk = lvl === 1 ? r.pick([1, 2]) : 3;
    if (lvlk === 1) { gval = s.add(c); if (gval.p === 0n) return null; given = `\\sin\\theta+\\cos\\theta=${qt(gval)}`; list = ["sc", "d2", "c3", "f4", "tt"]; }
    else if (lvlk === 2) { gval = s.sub(c); if (gval.p === 0n) return null; given = `\\sin\\theta-\\cos\\theta=${qt(gval)}`; list = ["sc", "p2", "c3m", "f4", "tt"]; }
    else { gval = sc; given = `\\sin\\theta\\cos\\theta=${qt(gval)}`; list = ["p2", "d2", "f4", "tt"]; }
    const nm = r.pick(list);
    const ex = { sc: [`\\sin\\theta\\cos\\theta`, sc], d2: [`(\\sin\\theta-\\cos\\theta)^{2}`, sq(s.sub(c))], p2: [`(\\sin\\theta+\\cos\\theta)^{2}`, sq(s.add(c))],
      c3: [`\\sin^{3}\\theta+\\cos^{3}\\theta`, sq(s).mul(s).add(sq(c).mul(c))], c3m: [`\\sin^{3}\\theta-\\cos^{3}\\theta`, sq(s).mul(s).sub(sq(c).mul(c))],
      f4: [`\\sin^{4}\\theta+\\cos^{4}\\theta`, sq(sq(s)).add(sq(sq(c)))], tt: [`\\tan\\theta+\\frac{1}{\\tan\\theta}`, s.div(c).add(c.div(s))] }[nm];
    const [E, val] = ex;
    if (Number(val.q) > 3000) return null;
    const sv = qt(gval), fin = `${E}=${qt(val)}`;
    let work;
    if (lvlk === 1) work = `(\\sin\\theta+\\cos\\theta)^{2}=1+2\\sin\\theta\\cos\\theta\\ \\Rightarrow\\ \\sin\\theta\\cos\\theta=\\frac{(${sv})^{2}-1}{2}=${qt(sc)}\\ \\Rightarrow\\ ${fin}`;
    else if (lvlk === 2) work = `(\\sin\\theta-\\cos\\theta)^{2}=1-2\\sin\\theta\\cos\\theta\\ \\Rightarrow\\ \\sin\\theta\\cos\\theta=\\frac{1-(${sv})^{2}}{2}=${qt(sc)}\\ \\Rightarrow\\ ${fin}`;
    else work = `\\sin\\theta\\cos\\theta=${sv}\\ \\Rightarrow\\ ${fin}`;
    return { v: { given, E, work, gval: qt(gval) }, ans: qn(val) };
  }),
  alg_trigRootCount: (r, lvl) => tryGen(() => {
    const fn = lvl === 1 ? r.pick(["sin", "cos"]) : r.pick(["sin", "cos", "tan"]);
    const m = lvl === 1 ? r.int(1, 2) : r.int(2, 4);
    const a = r.pick([2, 3, 4, 5, 6, -2, -3, -4]);
    let b;
    const u = r.next();
    if (fn === "tan") b = r.int(-6, 6);
    else if (u < 0.22) b = r.pick([a, -a]);
    else if (u < 0.3 && lvl === 2) b = (Math.abs(a) + r.int(1, 3)) * r.pick([1, -1]);
    else { b = r.int(-(Math.abs(a) - 1), Math.abs(a) - 1); }
    if (lvl === 1 && Math.abs(b) > Math.abs(a)) return null;
    const cnt = fn === "tan" ? 2 * m : Math.abs(b) < Math.abs(a) ? 2 * m : Math.abs(b) === Math.abs(a) ? m : 0;
    const eq = `${coefTex(a)}\\${fn}\\,${m === 1 ? "" : m}\\theta=${b}`;
    const ratio = qt(new Q(b, a)), mt = m === 1 ? "" : String(m);
    const work = fn === "tan" ? `\\tan ${mt}\\theta=${ratio}:\ ${mt}\\theta\\in[0,${2 * m}\\pi)\ \\Rightarrow\ 2\\times${m}=${cnt}`
      : Math.abs(b) < Math.abs(a) ? `\\${fn} ${mt}\\theta=${ratio},\ \\left|${ratio}\\right|<1:\ 2\\times${m}=${cnt}`
        : Math.abs(b) === Math.abs(a) ? `\\${fn} ${mt}\\theta=${ratio},\ \\left|${ratio}\\right|=1:\ 1\\times${m}=${cnt}`
          : `\\${fn} ${mt}\\theta=${ratio},\ \\left|${ratio}\\right|>1:\ 0`;
    return { v: { eq, work, fn, a, b, m }, ans: cnt };
  }),
  alg_trigPeriod: (r, lvl) => tryGen(() => {
    const bq = r.pick([new Q(1), new Q(2), new Q(3), new Q(4), new Q(5), new Q(6), new Q(1, 2), new Q(1, 3), new Q(1, 4), new Q(2, 3), new Q(3, 2), new Q(3, 4)]);
    const bn = Number(bq.p), bd = Number(bq.q);
    const bx = bd === 1 ? (bn === 1 ? "x" : `${bn}x`) : `\\frac{${bn === 1 ? "" : bn}x}{${bd}}`.replace("\\frac{x}", "\\frac{x}");
    const sh = r.pick([["", "0"], ["", "0"], ["+\\frac{\\pi}{3}", "+pi/3"], ["-\\frac{\\pi}{4}", "-pi/4"], ["-\\frac{\\pi}{6}", "-pi/6"], ["+\\frac{\\pi}{2}", "+pi/2"]]);
    const codeArg = `${bn}*x/${bd}${sh[1] === "0" ? "" : sh[1]}`;
    const arg = (fnm) => (sh[0] === "" ? `\\${fnm}\\,${bx}` : `\\${fnm}\\left(${bx}${sh[0]}\\right)`);
    const a = lvl === 2 ? 1 : r.pick([1, 2, 3, -1, -2, 4]), d = lvl === 2 ? 0 : r.pick([0, 0, 1, -1, 2, -3]);
    const wrapA = (s) => (a === 1 ? s : a === -1 ? `-${s}` : `${a}${s}`);
    let f, code, base;
    if (lvl === 1) { const fnm = r.pick(["sin", "cos", "tan"]); f = `y=${wrapA(arg(fnm))}${d === 0 ? "" : sg(d)}`; code = `${a}*${fnm}(${codeArg})+${d}`; base = fnm === "tan" ? 1 : 2; }
    else {
      const kind = r.pick(["abs-sin", "abs-cos", "sq-sin", "sq-cos"]);
      const fnm = kind.endsWith("sin") ? "sin" : "cos";
      if (kind.startsWith("abs")) { f = `y=\\left|${arg(fnm)}\\right|`; code = `abs(${fnm}(${codeArg}))`; }
      else { f = sh[0] === "" ? `y=\\${fnm}^{2}${bx}` : `y=\\${fnm}^{2}\\left(${bx}${sh[0]}\\right)`; code = `${fnm}(${codeArg})**2`; }
      base = 1;
    }
    const k = new Q(base).div(bq);
    const kpi = (Number(k.p) === 1 && Number(k.q) === 1) ? "\\pi" : `${qt(k)}\\pi`;
    const work = `\\frac{${base === 2 ? "2\\pi" : "\\pi"}}{${qt(bq)}}=${kpi}`;
    return { v: { f, code, work, kt: qt(k), base, bn, bd }, ans: qn(k) };
  }),
  alg_trigGraphParam: (r) => tryGen(() => {
    const c2 = r.int(-9, 9), a2 = r.int(1, 12); // M = (c2 + a2)/2 ... use integers M, m
    const M = r.int(-4, 8), m = M - r.int(1, 9); if (M === m) return null;
    const bq = r.pick([new Q(1), new Q(2), new Q(3), new Q(4), new Q(1, 2), new Q(2, 3)]);
    const per = new Q(2).div(bq), perT = (Number(per.q) === 1 && Number(per.p) === 1 ? "" : qt(per)) + "\\pi";
    const aq = new Q(M - m, 2), cq = new Q(M + m, 2), abc = aq.mul(bq).mul(cq);
    if (abc.p === 0n || Number(abc.q) > 24) return null;
    const fn = r.pick(["\\sin", "\\cos"]);
    const work = `a=\\frac{${M}-(${m})}{2}=${qt(aq)},\\ c=\\frac{${M}+(${m})}{2}=${qt(cq)},\\ \\frac{2\\pi}{b}=${perT}\\ \\Rightarrow\\ b=${qt(bq)}`;
    return { v: { fn, M, m, per: perT, work, abct: qt(abc), bn: Number(bq.p), bd: Number(bq.q) }, ans: qn(abc) };
  }),
  alg_trigSpecial: (r, lvl) => tryGen(() => {
    const SIN = { 0: [0, 1], 30: [1, 2], 90: [1, 1], 150: [1, 2], 180: [0, 1], 210: [-1, 2], 270: [-1, 1], 330: [-1, 2] };
    const COS = { 0: [1, 1], 60: [1, 2], 90: [0, 1], 120: [-1, 2], 180: [-1, 1], 240: [-1, 2], 270: [0, 1], 300: [1, 2] };
    const TAN = { 0: [0, 1], 45: [1, 1], 135: [-1, 1], 180: [0, 1], 225: [1, 1], 315: [-1, 1] };
    const tabs = { sin: SIN, cos: COS, tan: TAN };
    const nt = lvl === 1 ? 2 : 3, rad = lvl === 2;
    const terms = [];
    let tot = new Q(0);
    for (let i = 0; i < nt; i++) {
      const fn = r.pick(["sin", "cos", "tan"]), tab = tabs[fn];
      const base = Number(r.pick(Object.keys(tab)));
      const off = r.pick([-720, -360, 360, 720, 0, 0]);
      const deg = base + off;
      const [nn, dd] = tab[base]; const co = r.nonzero(-6, 6);
      tot = tot.add(new Q(nn * co, dd));
      let ang;
      if (!rad) ang = deg < 0 ? `\\left(${deg}^\\circ\\right)` : `${deg}^\\circ`;
      else { const f = deg === 0 ? "0" : (() => { const t = tfrac(deg, 180); return t === "1" ? "\\pi" : t === "-1" ? "-\\pi" : `${t}\\pi`; })(); ang = deg < 0 ? `\\left(${f}\\right)` : f; }
      terms.push({ co, fn, ang, deg });
    }
    if (terms.every((t) => t.fn === terms[0].fn && t.deg === terms[0].deg)) return null;
    const expr = terms.map((t, i) => `${i === 0 ? (t.co < 0 ? "-" : "") : t.co < 0 ? "-" : "+"}${Math.abs(t.co) === 1 ? "" : Math.abs(t.co)}\\${t.fn}${t.ang.startsWith("\\left") ? "" : " "}${t.ang}`).join("");
    const vals = terms.map((t) => { const [nn, dd] = tabs[t.fn][((t.deg % 360) + 360) % 360]; return qt(new Q(nn, dd)); });
    const work = `${terms.map((t, i) => `\\${t.fn} ${t.ang}=${vals[i]}`).join(",\\ ")}\\ \\Rightarrow\\ ${terms.map((t, i) => `${i ? "+" : ""}(${t.co})\\times(${vals[i]})`).join("")}=${qt(tot)}`;
    return { v: { expr, work }, ans: qn(tot) };
  }),
  alg_circumradius: (r, lvl) => tryGen(() => {
    const [x, y, rr] = r.pick(pyTri); const sw = r.next() < 0.5; const sy = sw ? y : x, cx = sw ? x : y;
    const useCos = lvl === 2, neg = useCos && r.next() < 0.5;
    const a = r.int(4, 40);
    const sinA = new Q(sy, rr);
    const R = new Q(a).div(sinA.mul(2));
    if (Number(R.q) > 16) return null;
    const cond = useCos ? `\\cos A=${neg ? "-" : ""}\\frac{${cx}}{${rr}}` : `\\sin A=\\frac{${sy}}{${rr}}`;
    const work = useCos ? `\\sin A=\\sqrt{1-\\left(${neg ? "-" : ""}\\frac{${cx}}{${rr}}\\right)^{2}}=\\frac{${sy}}{${rr}},\\ 2R=\\frac{${a}}{\\sin A}=${qt(R.mul(2))}` : `2R=\\frac{${a}}{\\sin A}=${qt(R.mul(2))}`;
    return { v: { side: a, cond, work, Rt: qt(R) }, ans: qn(R) };
  }),
  alg_survey: (r) => tryGen(() => {
    const P = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25]];
    const A = r.pick(P), B = r.pick(P);
    const sa = new Q(A[0], A[2]), ca = new Q(A[1], A[2]), sb = new Q(B[0], B[2]), cb = new Q(B[1], B[2]);
    const sC = sa.mul(cb).add(ca.mul(sb));
    const rho = sb.div(sC); const k = r.int(1, 4);
    const d = Number(rho.q) * k; if (d > 480 || d < 20) return null;
    const ans = Number(rho.p) * k;
    const work = `\\cos\\alpha=${qt(ca)},\\ \\cos\\beta=${qt(cb)},\\ \\sin C=\\sin(\\alpha+\\beta)=${qt(sC)},\\ \\overline{A C}=\\frac{${d}\\times${qt(sb)}}{${qt(sC)}}`;
    return { v: { d, sa: qt(sa), sb: qt(sb), work }, ans };
  }),
  alg_cosLawSide: (r, lvl) => tryGen(() => {
    if (lvl === 1) {
      const ang = r.pick([60, 120]), a = r.int(3, 30), b = r.int(3, 30);
      const c2 = a * a + b * b + (ang === 120 ? a * b : -a * b), c = Math.round(Math.sqrt(c2));
      if (c * c !== c2) return null;
      return { v: { cond: `\\angle C=${ang}^\\circ`, a, b, work: `c^{2}=${a}^{2}+${b}^{2}-2\\times${a}\\times${b}\\times\\cos${ang}^\\circ=${c2}` }, ans: c };
    }
    const a = r.int(4, 20), b = r.int(4, 20), c = r.int(Math.abs(a - b) + 1, a + b - 1);
    const cs = new Q(a * a + b * b - c * c, 2 * a * b);
    return { v: { cond: `\\cos C=${qt(cs)}`, a, b, work: `c^{2}=${a}^{2}+${b}^{2}-2\\times${a}\\times${b}\\times(${qt(cs)})=${c * c}` }, ans: c };
  }),
  alg_obtuseCount: (r) => tryGen(() => {
    const a = r.int(3, 12), b = r.int(a + 1, 18);
    const xs = [];
    for (let x = b - a + 1; x <= a + b - 1; x++) { if (x > b ? x * x > a * a + b * b : b * b > a * a + x * x) xs.push(x); }
    if (xs.length < 3) return null;
    const work = `${b - a}<x<${a + b};\\ x^{2}>${a * a + b * b}\\ \\lor\\ x^{2}<${b * b - a * a}\\ \\Rightarrow\\ x=${xs.join(",\\ ")}`;
    return { v: { a, b, work }, ans: xs.length };
  }),
  alg_arithTwoTerms: (r, lvl) => tryGen(() => {
    let d = lvl === 1 ? r.int(2, 7) : r.pick([-8, -7, -6, -5, -4, -3, -2, -4.5, -3.5, -2.5, -1.5, 0.5, 1.5, 2.5, 3.5, 4.5]);
    const a1 = r.int(-10, 20);
    const gap = Number.isInteger(d) ? r.int(1, 5) : r.pick([2, 4, 6]);
    const p = r.int(1, 5), q = p + gap, rr = r.int(1, 14); if (rr === p || rr === q) return null;
    const u = a1 + (p - 1) * d, v = a1 + (q - 1) * d;
    if (!Number.isInteger(u) || !Number.isInteger(v)) return null;
    const ans = a1 + (rr - 1) * d;
    return { v: { p, u, q, v, r: rr, d, ub: u < 0 ? `(${u})` : `${u}`, db: d < 0 ? `(${d})` : `${d}` }, ans };
  }),
  alg_arithSumMax: (r) => tryGen(() => {
    const d = -r.int(2, 9), a1 = r.int(10, 80);
    const p = r.int(1, 4), q = p + r.int(2, 6);
    const u = a1 + (p - 1) * d, v = a1 + (q - 1) * d;
    let best = 0, nm = 0, s = 0; for (let n = 1; n <= 200; n++) { s += a1 + (n - 1) * d; if (s > best) { best = s; nm = n; } }
    if (nm < 4) return null;
    return { v: { p, u, q, v, a1, d, nm }, ans: best };
  }),
  alg_arithFirstExceeds: (r, lvl) => tryGen(() => {
    const a = lvl === 1 ? r.int(1, 12) : -r.int(2, 14), d = lvl === 1 ? r.int(2, 8) : r.int(2, 6);
    const N = r.int(50, 900);
    const S = (n) => (n * (2 * a + (n - 1) * d)) / 2;
    let n = 1; while (S(n) <= N) n++;
    if (n < 5 || n > 40) return null;
    return { v: { a, d, N, ab: pr(a), m1: n - 1, s1: S(n - 1), s2: S(n) }, ans: n };
  }),
  alg_arithGeoMix: (r) => tryGen(() => {
    const y = r.int(6, 36), d = r.int(1, y - 1), den = y - d;
    if ((d * d) % den !== 0) return null;
    const k = (d * d) / den; if (k < 1 || k > 60) return null;
    return { v: { S: 3 * y, k, y, yk: y * k }, ans: d };
  }),
  alg_sumToTerm: (r, lvl) => tryGen(() => {
    const k = r.int(5, 12);
    if (lvl === 1) {
      const p = r.nonzero(-3, 5), q = r.int(-6, 8), c = r.nonzero(-9, 9);
      const S = (n) => p * n * n + q * n + c, a1 = S(1), ak = S(k) - S(k - 1);
      const expr = poly([p, q, c], "n").replace(/n\^2/g, "n^{2}");
      return { v: { expr, k, km: k - 1, a1, ak, kind: 1, p, q, r: c, b: 0 }, ans: a1 + ak };
    }
    const b = r.pick([2, 3, 4]), p = r.nonzero(-3, 4), c = r.nonzero(-7, 7);
    const S = (n) => p * b ** n + c;
    const a1 = S(1), ak = S(k) - S(k - 1); if (Math.abs(ak) > 1e8) return null;
    const expr = `${p === 1 ? "" : p === -1 ? "-" : `${p}\\cdot`}${b}^{n}${sg(c)}`;
    return { v: { expr, k, km: k - 1, a1, ak, kind: 2, p, q: 0, r: c, b }, ans: a1 + ak };
  }),
  alg_geoTwoTerms: (r, lvl) => tryGen(() => {
    const rat = lvl === 1 ? new Q(r.pick([2, 3, 4])) : new Q(...r.pick([[1, 2], [3, 2], [2, 3], [1, 3], [5, 2], [3, 4]]));
    const p = r.int(1, 3), gap = lvl === 1 ? r.int(1, 3) : r.int(2, 4), q = p + gap;
    const a1 = new Q(r.int(1, lvl === 1 ? 6 : 12));
    const t = (n) => a1.mul(qpow(rat, n - 1));
    const rr = r.int(1, 9); if (rr === p || rr === q) return null;
    const u = t(p), v = t(q), ans = t(rr);
    if (!u.isInt || !v.isInt || Number(ans.q) > 32 || Math.abs(qn(ans)) > 3000 || qn(v) > 1e5) return null;
    const work = `a_{${rr}}=${qt(u)}\\times(${qt(rat)})^{${rr - p}}=${qt(ans)}`;
    return { v: { p, u: Number(u.p), q, v: Number(v.p), r: rr, dq: gap, rt: qt(rat), work }, ans: qn(ans) };
  }),
  alg_geoSumRatio: (r) => tryGen(() => {
    const rt0 = r.pick([2, 3, 4, -2, -3]), n = r.pick([2, 3]), a = r.int(1, 6);
    const q = rt0 ** n; if (q === 1) return null;
    const Sn = (a * (q - 1)) / (rt0 - 1); if (!Number.isInteger(Sn) || Sn === 0) return null;
    const v = Sn * (1 + q), ans = Sn * (1 + q + q * q);
    if (Math.abs(ans) > 5e7) return null;
    return { v: { n1: n, n2: 2 * n, n3: 3 * n, u: Sn, v, q, q2: q * q, qs: `1${q < 0 ? `+(${q})` : `+${q}`}+${q * q}` }, ans };
  }),
  alg_sigmaSquare: (r, lvl) => tryGen(() => {
    const n = lvl === 1 ? r.int(3, 4) : r.int(4, 6);
    const a = [], b = []; for (let i = 0; i < n; i++) { a.push(r.int(-4, 4)); b.push(r.int(-4, 4)); }
    const A = a.reduce((s, x) => s + x * x, 0), B = a.reduce((s, x, i) => s + x * b[i], 0), C = b.reduce((s, x) => s + x * x, 0);
    if (A === 0 || C === 0 || B === 0) return null;
    const p = r.pick([1, 2, 3, -1, -2, -3]), q = r.nonzero(-4, 4);
    if (Math.abs(p) === Math.abs(q)) return null;
    const comb = `${coefTex(p)}a_k${q > 0 ? "+" : "-"}${Math.abs(q) === 1 ? "" : Math.abs(q)}b_k`;
    const expand = `${p * p === 1 ? "" : p * p}a_k^{2}${2 * p * q > 0 ? "+" : "-"}${Math.abs(2 * p * q)}a_kb_k${q * q > 0 ? "+" : "-"}${q * q === 1 ? "" : q * q}b_k^{2}`;
    const ans = p * p * A + 2 * p * q * B + q * q * C;
    const c2 = 2 * p * q;
    const work = `${p * p}\\times${A}${c2 > 0 ? "+" : "-"}${Math.abs(c2)}\\times${pr(B)}+${q * q}\\times${C}=${ans}`;
    return { v: { n, A, B, C, comb, expand, work, p, q }, ans };
  }),
  alg_sigmaTelescope: (r, lvl) => tryGen(() => {
    const n = r.int(5, 30);
    let kind, d, term, val, work;
    const kinds = lvl === 1 ? [["g", 1], ["g", 2]] : [["g", 3], ["o", 0], ["t", 0]];
    [kind, d] = r.pick(kinds);
    if (kind === "g") {
      term = `\\frac{1}{k(k+${d})}`; let s = new Q(0); for (let k = 1; k <= d; k++) s = s.add(new Q(1, k)).sub(new Q(1, n + k)); val = s.div(d);
      const parts = Array.from({ length: d }, (_, i) => (i === 0 ? "1" : `\\frac{1}{${i + 1}}`)).join("+"), tail = Array.from({ length: d }, (_, i) => `\\frac{1}{${n + i + 1}}`).join("+");
      work = d === 1 ? `\\frac{1}{k(k+1)}=\\frac{1}{k}-\\frac{1}{k+1}\\ \\Rightarrow\\ 1-\\frac{1}{${n + 1}}=${qt(val)}` : `\\frac{1}{k(k+${d})}=\\frac{1}{${d}}\\left(\\frac{1}{k}-\\frac{1}{k+${d}}\\right)\\ \\Rightarrow\\ \\frac{1}{${d}}\\left(${parts}-(${tail})\\right)=${qt(val)}`;
    } else if (kind === "o") { term = `\\frac{1}{(2k-1)(2k+1)}`; val = new Q(n, 2 * n + 1); work = `\\frac{1}{(2k-1)(2k+1)}=\\frac{1}{2}\\left(\\frac{1}{2k-1}-\\frac{1}{2k+1}\\right)\\ \\Rightarrow\\ \\frac{1}{2}\\left(1-\\frac{1}{${2 * n + 1}}\\right)=${qt(val)}`; }
    else { term = `\\frac{1}{k(k+1)(k+2)}`; val = new Q(1, 4).sub(new Q(1, 2 * (n + 1) * (n + 2))); work = `\\frac{1}{k(k+1)(k+2)}=\\frac{1}{2}\\left(\\frac{1}{k(k+1)}-\\frac{1}{(k+1)(k+2)}\\right)\\ \\Rightarrow\\ \\frac{1}{2}\\left(\\frac{1}{2}-\\frac{1}{${(n + 1) * (n + 2)}}\\right)=${qt(val)}`; }
    return { v: { expr: `\\displaystyle\\sum_{k=1}^{${n}}${term}`, work, n, kind: kind === "g" ? d : kind === "o" ? 4 : 5 }, ans: qn(val) };
  }),
  alg_sigmaSubseq: (r, lvl) => tryGen(() => {
    const m = r.int(6, 15), c = r.int(1, 3), d = r.int(-1, 3);
    if (c + d <= 0 && true) { /* indices must be >= 1 */ }
    if (c + d < 1) return null;
    const idx = `${c === 1 ? "" : c}k${d === 0 ? "" : sg(d)}`;
    const S1 = (m * (m + 1)) / 2, S2 = (m * (m + 1) * (2 * m + 1)) / 6;
    let an, term, ans, p, q, rr = 0;
    const tk = (cc) => (cc === 1 ? "k" : `${cc}k`);
    if (lvl === 1) {
      p = r.nonzero(-4, 6); q = r.int(-8, 8); an = lin(p, q, "n");
      ans = p * c * S1 + (p * d + q) * m;
      term = lin(p * c, p * d + q, "k");
    } else {
      p = r.nonzero(-2, 3); q = r.int(-4, 4); rr = r.int(-5, 5);
      an = poly([p, q, rr], "n").replace(/n\^2/g, "n^{2}");
      ans = p * (c * c * S2 + 2 * c * d * S1 + d * d * m) + q * (c * S1 + d * m) + rr * m;
      term = poly([p * c * c, 2 * p * c * d + q * c, p * d * d + q * d + rr], "k").replace(/k\^2/g, "k^{2}");
    }
    if (Math.abs(ans) > 1e7) return null;
    const work = lvl === 1 ? `\\sum_{k=1}^{${m}}(${term})=${p * c}\\times${S1}${sg(p * d + q)}\\times${m}=${ans}`.replace(/\+-/g, "-") : `\\sum_{k=1}^{${m}}(${term})=${ans}`;
    return { v: { an, idx, term, m, work, p, q, r: rr, c, d }, ans };
  }),
  alg_seriesPattern: (r, lvl) => tryGen(() => {
    const kinds = lvl === 1 ? ["A", "B", "C"] : ["D", "E", "H"];
    const t = r.pick(kinds); let n = r.int(6, 20); if (t === "D" && n % 2) n++;
    let expr, ans, work;
    const T1 = (k) => (k * (k + 1)) / 2;
    if (t === "A") { expr = `1+(1+2)+(1+2+3)+\\cdots+(1+2+3+\\cdots+${n})`; ans = (n * (n + 1) * (n + 2)) / 6; work = `\\sum_{k=1}^{${n}}\\frac{k(k+1)}{2}=\\frac{${n}\\times${n + 1}\\times${n + 2}}{6}=${ans}`; }
    else if (t === "B") { expr = `1\\cdot${n}+2\\cdot${n - 1}+3\\cdot${n - 2}+\\cdots+${n}\\cdot1`; ans = (n * (n + 1) * (n + 2)) / 6; work = `\\sum_{k=1}^{${n}}k(${n + 1}-k)=${n + 1}\\times${T1(n)}-${(n * (n + 1) * (2 * n + 1)) / 6}=${ans}`; }
    else if (t === "C") { expr = `1\\cdot3+2\\cdot4+3\\cdot5+\\cdots+${n}\\cdot${n + 2}`; const s2 = (n * (n + 1) * (2 * n + 1)) / 6; ans = s2 + 2 * T1(n); work = `\\sum_{k=1}^{${n}}k(k+2)=${s2}+2\\times${T1(n)}=${ans}`; }
    else if (t === "D") { expr = `1^{2}-2^{2}+3^{2}-4^{2}+\\cdots+${n - 1}^{2}-${n}^{2}`; ans = -T1(n); work = `(2j-1)^{2}-(2j)^{2}=-(4j-1)\\ \\Rightarrow\\ -\\sum_{j=1}^{${n / 2}}(4j-1)=${ans}`; }
    else if (t === "E") { expr = `1\\cdot2\\cdot3+2\\cdot3\\cdot4+\\cdots+${n}\\cdot${n + 1}\\cdot${n + 2}`; ans = (n * (n + 1) * (n + 2) * (n + 3)) / 4; work = `\\sum_{k=1}^{${n}}k(k+1)(k+2)=\\frac{${n}\\times${n + 1}\\times${n + 2}\\times${n + 3}}{4}=${ans}`; }
    else { expr = `2+(2+4)+(2+4+6)+\\cdots+(2+4+6+\\cdots+${2 * n})`; ans = (n * (n + 1) * (n + 2)) / 3; work = `\\sum_{k=1}^{${n}}k(k+1)=\\frac{${n}\\times${n + 1}\\times${n + 2}}{3}=${ans}`; }
    return { v: { expr, work, t, n }, ans };
  }),
  alg_recAffine: (r, lvl) => tryGen(() => {
    const pq = lvl === 1 ? new Q(r.pick([2, 3])) : r.next() < 0.3 ? new Q(1, 2) : new Q(r.pick([2, 3, 4, 5, -2, -3, -1]));
    const q = r.nonzero(-8, 8), s = r.int(-3, 8), k = lvl === 1 ? r.int(4, 6) : r.int(4, 8);
    let a = new Q(s); const steps = [qt(a)]; for (let i = 1; i < k; i++) { a = a.mul(pq).add(q); steps.push(qt(a)); }
    if (Number(a.q) > 16 || Math.abs(qn(a)) > 1e6) return null;
    const pT = pq.isInt ? (Number(pq.p) === 1 ? "" : Number(pq.p) === -1 ? "-" : String(pq.p)) : "\\frac{1}{2}";
    const rule = `${pT}a_n${q > 0 ? `+${q}` : q}`;
    const work = `a_n:\\ ${steps.join(",\\ ")}\\ \\Rightarrow\\ a_{${k}}=${qt(a)}`;
    return { v: { s, rule, k, work, pn: Number(pq.p), pd: Number(pq.q), q }, ans: qn(a) };
  }),
  alg_collatz: (r, lvl) => tryGen(() => {
    const s = lvl === 1 ? r.int(3, 120) : r.int(3, 40);
    const [pp, qq] = lvl === 1 ? [1, 1] : [3, 1];
    let a = s, n = 1; const seq = [a];
    while (a !== 1) { a = a % 2 === 0 ? a / 2 : pp * a + qq; seq.push(a); n++; if (n > 60) return null; }
    if (n < 4) return null;
    return { v: { s, odd: pp === 1 ? "a_n+1" : "3a_n+1", p: pp, q: qq, work: seq.join("\\to ") }, ans: n };
  }),
  alg_recParam: (r) => tryGen(() => {
    const p = r.int(2, 5), q = r.int(1, 6), s = r.int(1, 4);
    const t = p * p * s + p * q + q;
    return { v: { s, q, t, st: s === 1 ? "" : String(s), work: `${poly([s, q, q - t], "p").replace(/p\^2/g, "p^{2}")}=0` }, ans: p };
  }),
  alg_seqIntTerms: (r) => tryGen(() => {
    const D0 = r.pick([12, 24, 30, 36, 48, 60, 72, 84, 90, 96, 120, 144, 180]), D = r.next() < 0.3 ? -D0 : D0;
    const rr = r.int(0, 6), p = r.pick([1, 2, 3, 4, 5, -1, -2, -3]), q = D + p * rr;
    const divs = []; for (let d = 1; d <= D0; d++) if (D0 % d === 0 && d >= rr + 1) divs.push(d);
    if (divs.length < 2) return null;
    const num = lin(p, q, "n"), den = rr === 0 ? "n" : `n+${rr}`;
    const work = `a_n=${p}${D < 0 ? "-" : "+"}\\frac{${D0}}{${den}},\\ ${den}\\in\\{${divs.join(",")}\\}`;
    return { v: { num, den, r1: rr + 1, work, p, q, r: rr }, ans: divs.length };
  }),
};

/* ---------- plan ---------- */
const P = (skill, template, levels, count, d, standards, strategy, evidence) => ({ skill, template, levels, count, d, standards, strategy, evidence });
export const PLAN = [
  P("m.h2.log", "alg_rootEval", [1, 2], 12, 2, ["12대수01-01"], "radical-laws", "calc"),
  P("m.h2.log", "alg_realRootCount", [1, 2], 12, 3, ["12대수01-01"], "even-odd-roots-count", "counting"),
  P("m.h2.log", "alg_rationalExp", [1, 2], 12, 2, ["12대수01-02", "12대수01-03"], "rational-exponent", "calc"),
  P("m.h2.log", "alg_expSum", [1, 2], 12, 3, ["12대수01-03"], "t-plus-reciprocal", "concept"),
  P("m.h2.log", "alg_logChain", [1, 2], 12, 3, ["12대수01-04"], "change-of-base-chain", "calc"),
  P("m.h2.log", "alg_logExpress", [1, 2], 12, 3, ["12대수01-04"], "log-representation", "representation"),
  P("m.h2.log", "alg_digitsPow", [1, 2], 12, 3, ["12대수01-05"], "digit-count", "application"),
  P("m.h2.log", "alg_growthYears", [1, 2], 12, 3, ["12대수01-05", "12대수01-08"], "compound-interest-log", "application"),
  P("m.h2.log", "alg_expFuncParams", [1, 2], 12, 3, ["12대수01-06", "12대수01-07"], "two-values-fit", "reverse"),
  P("m.h2.log", "alg_expShiftA", [1, 2], 12, 3, ["12대수01-07"], "graph-point-base", "reverse"),
  P("m.h2.log", "alg_expEquation", [1, 2], 12, 3, ["12대수01-08"], "substitution-quadratic", "calc"),
  P("m.h2.log", "alg_expInequality", [1, 2], 12, 3, ["12대수01-08"], "exp-ineq-integers", "counting"),
  P("m.h2.log", "alg_logEquation", [1, 2], 12, 3, ["12대수01-08"], "domain-filter", "calc"),
  P("m.h2.log", "alg_logInequality", [1, 2, 3], 12, 3, ["12대수01-08"], "log-ineq-integers", "counting"),
  P("m.h2.log", "alg_inverseGraph", [1, 2], 12, 3, ["12대수01-06", "12대수01-07"], "inverse-point-swap", "reverse"),
  P("m.h2.log", "alg_logDomain", [1, 2], 12, 3, ["12대수01-06", "12대수01-07"], "domain-count", "counting"),
  P("m.h2.log", "alg_expMaxMin", [1, 2], 12, 4, ["12대수01-07", "12대수01-08"], "composite-extremum", "application"),
  P("m.h2.geo2", "alg_coterminal", [1, 2], 12, 2, ["12대수02-01"], "coterminal-reduction", "calc"),
  P("m.h2.geo2", "alg_halfAngleQuad", [1], 14, 4, ["12대수02-01"], "quadrant-of-fraction-angle", "counting"),
  P("m.h2.geo2", "alg_sectorForward", [1, 2], 12, 2, ["12대수02-01"], "sector-arc-area", "application"),
  P("m.h2.geo2", "alg_sectorPerimArea", [1], 12, 4, ["12대수02-01"], "sector-quadratic", "reverse"),
  P("m.h2.trig", "alg_trigPoint", [1, 2], 12, 2, ["12대수02-02"], "terminal-point-ratios", "calc"),
  P("m.h2.trig", "alg_trigGiven", [1], 12, 3, ["12대수02-02"], "quadrant-sign-reconstruct", "reverse"),
  P("m.h2.trig", "alg_trigIdentity", [1, 2], 12, 3, ["12대수02-02"], "symmetric-identity", "concept"),
  P("m.h2.trig", "alg_trigRootCount", [1, 2], 12, 3, ["12대수02-02"], "graph-intersections", "counting"),
  P("m.h2.trig", "alg_trigPeriod", [1, 2], 12, 2, ["12대수02-02"], "period-from-formula", "representation"),
  P("m.h2.trig", "alg_trigGraphParam", [1], 12, 3, ["12대수02-02"], "graph-features-to-formula", "reverse"),
  P("m.h2.trig", "alg_trigSpecial", [1, 2], 12, 2, ["12대수02-02"], "special-angle-reduction", "calc"),
  P("m.h2.geo1", "alg_circumradius", [1, 2], 12, 3, ["12대수02-03"], "law-of-sines-radius", "calc"),
  P("m.h2.geo1", "alg_survey", [1], 12, 4, ["12대수02-03"], "survey-two-angles", "application"),
  P("m.h2.geo1", "alg_cosLawSide", [1, 2], 12, 2, ["12대수02-03"], "law-of-cosines-side", "calc"),
  P("m.h2.geo1", "alg_obtuseCount", [1], 12, 4, ["12대수02-03"], "obtuse-triangle-count", "counting"),
  P("m.h2.seq", "alg_arithTwoTerms", [1, 2], 12, 2, ["12대수03-02"], "two-terms-to-difference", "reverse"),
  P("m.h2.seq", "alg_arithSumMax", [1], 12, 3, ["12대수03-02"], "max-partial-sum", "application"),
  P("m.h2.seq", "alg_arithFirstExceeds", [1, 2], 12, 3, ["12대수03-02"], "first-n-exceeding", "counting"),
  P("m.h2.seq", "alg_arithGeoMix", [1], 12, 4, ["12대수03-02", "12대수03-03"], "arith-geo-quadratic", "reverse"),
  P("m.h2.seq", "alg_sumToTerm", [1, 2], 12, 3, ["12대수03-02", "12대수03-03"], "term-from-partial-sum", "concept"),
  P("m.h2.seq", "alg_geoTwoTerms", [1, 2], 12, 2, ["12대수03-03"], "two-terms-to-ratio", "reverse"),
  P("m.h2.seq", "alg_geoSumRatio", [1], 12, 4, ["12대수03-03"], "block-sum-ratio", "concept"),
  P("m.h2.seq1", "alg_sigmaSquare", [1, 2], 12, 3, ["12대수03-04"], "sigma-linearity-expand", "concept"),
  P("m.h2.seq1", "alg_sigmaSubseq", [1, 2], 12, 3, ["12대수03-04"], "sigma-index-substitution", "calc"),
  P("m.h2.seq1", "alg_sigmaTelescope", [1, 2], 12, 4, ["12대수03-05"], "partial-fractions-telescoping", "calc"),
  P("m.h2.seq1", "alg_seriesPattern", [1, 2], 12, 4, ["12대수03-05"], "pattern-to-sigma", "representation"),
  P("m.h2.seq", "alg_recAffine", [1, 2], 12, 2, ["12대수03-06"], "recursive-iteration", "calc"),
  P("m.h2.seq", "alg_collatz", [1, 2], 12, 3, ["12대수03-06"], "case-recursion-first-hit", "counting"),
  P("m.h2.seq", "alg_recParam", [1], 12, 3, ["12대수03-06"], "recursive-unknown-parameter", "reverse"),
  P("m.h2.seq", "alg_seqIntTerms", [1], 14, 4, ["12대수03-01"], "integer-valued-terms-count", "counting"),
];

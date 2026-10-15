// 기본수학1·2 (10기수1, 10기수2): the easier, scaffolded forms of the basic-level common courses.
// Structures: inequality systems / absolute-value inequalities counted as integers, reading features of quadratics, factor and expansion identities,
// discriminant parameter counts, digit counting, matrix equations, line / circle positions, transformations, set listings, propositions as set
// inclusion, composition with a hidden outer function, function counting.
import { lin, poly, sg, cf, tfrac, gcd, P } from "../lib.mjs";

const RELS = ["<", ">", "\\le", "\\ge"];
const FLIP = { "<": ">", ">": "<", "\\le": "\\ge", "\\ge": "\\le" };
const holds = (a, rel, b) => (rel === "<" ? a < b : rel === ">" ? a > b : rel === "\\le" ? a <= b : a >= b);
const isUp = (rel) => rel === "<" || rel === "\\le";
const co = (n) => (Math.abs(n) === 1 ? "" : String(Math.abs(n)));
/** "ax+by" with usual conventions, a != 0 */
const axby = (a, b) => `${cf(a)}x${b > 0 ? "+" : "-"}${co(b)}y`;
const m2 = (e) => `\\begin{pmatrix}${e[0]} & ${e[1]} \\\\ ${e[2]} & ${e[3]}\\end{pmatrix}`;
const perms = (arr, k) => (k === 0 ? [[]] : arr.flatMap((a, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)], k - 1).map((p) => [a, ...p])));

export const TEMPLATES = {
  bm_ineqSystem: {
    ko: ["두 일차부등식 ${i1}$, ${i2}$ 의 공통인 해 중에서 정수 $x$는 모두 몇 개일까요? (숫자만 쓰세요)", ["각 부등식을 따로 풀어서 $x$의 범위를 먼저 구해요.", "두 범위가 겹치는 부분을 수직선에 나타내고 그 안의 정수를 세요. 음수로 나누거나 곱할 때는 부등호의 방향이 바뀌어요."], "첫째 부등식을 풀면 ${s1}$, 둘째 부등식을 풀면 ${s2}$입니다. 공통 범위에 들어 있는 정수는 ${ints}$이므로 모두 ${ans}$개입니다."],
    en: ["Among the common solutions of the two linear inequalities ${i1}$ and ${i2}$, how many are integers $x$? (digits only)", ["Solve each inequality separately to get a range for $x$ first.", "Draw both ranges on a number line and count the integers in the overlap. The inequality sign flips when you multiply or divide by a negative number."], "The first inequality gives ${s1}$ and the second gives ${s2}$. The integers in the common range are ${ints}$, so there are ${ans}$ of them."],
  },
  bm_absIneq: {
    ko: ["부등식 ${ineq}$ 의 해 중에서 $-{N}\\le x\\le {N}$ 인 정수 $x$는 모두 몇 개일까요? (숫자만 쓰세요)", ["절댓값이 어떤 수보다 작은 경우인지, 큰 경우인지부터 구분해요.", "작으면 $-c<A<c$ 꼴로, 크면 $A<-c$ 또는 $A>c$ 꼴로 바꿔서 $x$의 범위를 구한 뒤, 주어진 범위 안의 정수를 세요."], "절댓값 기호를 풀면 ${ineq}$ 의 해는 ${sol}$입니다. 이 중 $-{N}$ 이상 ${N}$ 이하의 정수는 모두 ${ans}$개입니다."],
    en: ["How many integers $x$ with $-{N}\\le x\\le {N}$ satisfy the inequality ${ineq}$? (digits only)", ["First decide whether the absolute value is smaller or larger than the number on the right.", "If smaller, rewrite as $-c<A<c$; if larger, as $A<-c$ or $A>c$. Find the range of $x$, then count the integers of the given range."], "Removing the absolute value, the solution of ${ineq}$ is ${sol}$. Between $-{N}$ and ${N}$ inclusive there are ${ans}$ integers in it."],
  },
  bm_quadRange: {
    ko: ["이차함수 $f(x)={f}$ 에 대하여 ${s}\\le x\\le {t}$ 에서 $f(x)$의 최댓값을 $M$, 최솟값을 $m$이라 할 때, $M+m$의 값은? (숫자만 쓰세요)", ["$f(x)=a(x-p)^2+q$ 꼴로 고쳐서 꼭짓점을 찾아요.", "꼭짓점의 $x$좌표가 주어진 구간 안에 있으니, 꼭짓점과 구간의 양 끝에서의 함숫값을 비교해요."], "$f(x)={vf}$ 이므로 꼭짓점은 $({h},{k})$이고 구간 안에 있습니다. 양 끝의 함숫값은 $f({s})={fs}$, $f({t})={ft}$이므로 최댓값 $M={M}$, 최솟값 $m={m}$이고 $M+m={ans}$입니다."],
    en: ["For the quadratic function $f(x)={f}$, let $M$ be its maximum and $m$ its minimum on ${s}\\le x\\le {t}$. What is $M+m$? (digits only)", ["Rewrite it as $f(x)=a(x-p)^2+q$ to find the vertex.", "The $x$-coordinate of the vertex lies inside the interval, so compare the values at the vertex and at both ends of the interval."], "$f(x)={vf}$, so the vertex $({h},{k})$ lies inside the interval. The end values are $f({s})={fs}$ and $f({t})={ft}$, so $M={M}$, $m={m}$ and $M+m={ans}$."],
  },
  bm_discK: {
    ko: ["이차함수 $y={f}$ 의 그래프가 $x$축과 서로 다른 두 점에서 만나도록 하는 정수 $k$ 중에서 $-{N}\\le k\\le {N}$ 인 것은 모두 몇 개일까요? (숫자만 쓰세요)", ["그래프가 $x$축과 서로 다른 두 점에서 만나는 것은 이차방정식 $y=0$이 서로 다른 두 실근을 갖는 것과 같아요.", "판별식 $D$가 0보다 크도록 $k$의 범위를 구한 뒤, 주어진 범위의 정수를 세요."], "서로 다른 두 실근을 가지려면 판별식 $D={D}>0$ 이어야 하므로 ${cond}$입니다. 이를 만족하는 정수 $k$는 $-{N}\\le k\\le {N}$ 에서 모두 ${ans}$개입니다."],
    en: ["The graph of the quadratic function $y={f}$ meets the $x$-axis at two distinct points. How many integers $k$ with $-{N}\\le k\\le {N}$ make this happen? (digits only)", ["Meeting the $x$-axis at two distinct points means the equation $y=0$ has two distinct real roots.", "Require the discriminant $D>0$ to get the range of $k$, then count the integers of the given range."], "Two distinct real roots need $D={D}>0$, which gives ${cond}$. Among $-{N}\\le k\\le {N}$ there are ${ans}$ integers satisfying it."],
  },
  bm_polyFactor: {
    ko: ["이차식 ${Pex}$ 의 인수분해 결과가 $(ax+b)(cx+d)$ 입니다. $a$, $b$, $c$, $d$는 정수이고 $a>0$, $c>0$, $a\\le c$이며 $a=c$이면 $b\\le d$일 때, $a+b+c+d$의 값은? (숫자만 쓰세요)", ["상수항 $bd$와 $x^2$의 계수 $ac$를 만들 수 있는 정수의 쌍을 생각해 보세요.", "후보를 하나 골라 전개했을 때 $x$의 계수가 $ad+bc$와 같은지 확인해요."], "${Pex}=({f1})({f2})$ 로 인수분해되므로 $a={a}$, $b={b}$, $c={c}$, $d={d}$이고 $a+b+c+d={ans}$입니다."],
    en: ["The quadratic ${Pex}$ factors as $(ax+b)(cx+d)$ with integers $a,b,c,d$, where $a>0$, $c>0$, $a\\le c$, and $b\\le d$ if $a=c$. What is $a+b+c+d$? (digits only)", ["Think of the integer pairs that make the product $ac$ of the $x^2$ coefficients and the product $bd$ of the constants.", "Pick a candidate and expand it: the coefficient of $x$ must equal $ad+bc$."], "${Pex}=({f1})({f2})$, so $a={a}$, $b={b}$, $c={c}$, $d={d}$ and $a+b+c+d={ans}$."],
  },
  bm_polyExpand: {
    ko: ["식 ${expr}$ 의 전개식을 $x$에 대한 내림차순으로 정리했을 때, $x^2$의 계수와 상수항의 합은? (숫자만 쓰세요)", ["각 곱을 따로 전개한 뒤 동류항끼리 모아요.", "곱셈 공식 $(ax+b)^2=a^2x^2+2abx+b^2$를 쓰면 편해요. 앞에 붙은 부호와 계수를 잊지 마세요."], "$({e1}){op}({e2})$ 이므로 정리하면 ${total}$입니다. $x^2$의 계수는 ${c2}$, 상수항은 ${c0}$이므로 합은 ${ans}$입니다."],
    en: ["Expand ${expr}$ and write it in descending powers of $x$. What is the sum of the coefficient of $x^2$ and the constant term? (digits only)", ["Expand each product separately, then collect like terms.", "The identity $(ax+b)^2=a^2x^2+2abx+b^2$ helps. Do not forget the sign and the coefficient in front."], "$({e1}){op}({e2})$, which simplifies to ${total}$. The coefficient of $x^2$ is ${c2}$ and the constant term is ${c0}$, so the sum is ${ans}$."],
  },
  bm_quadRoots: {
    ko: ["$x$에 대한 방정식 ${eq}$ 의 서로 다른 두 실근을 작은 것부터 $\\alpha$, $\\beta$라 할 때, $\\beta-2\\alpha$의 값은? (숫자만 쓰세요)", ["우변의 항을 모두 좌변으로 옮겨 (이차식)$=0$ 꼴로 만들어요.", "인수분해하여 두 근을 구한 뒤, 작은 근을 $\\alpha$, 큰 근을 $\\beta$에 넣으세요."], "정리하면 ${std}=0$ 이고 인수분해하면 ${fac}=0$ 이므로 $\\alpha={al}$, $\\beta={be}$입니다. 따라서 $\\beta-2\\alpha={ans}$입니다."],
    en: ["Let $\\alpha<\\beta$ be the two distinct real roots of the equation ${eq}$ in $x$. What is $\\beta-2\\alpha$? (digits only)", ["Move every term to the left side to get (quadratic)$=0$.", "Factor it to find both roots, then put the smaller one in $\\alpha$ and the larger in $\\beta$."], "It simplifies to ${std}=0$, which factors as ${fac}=0$, so $\\alpha={al}$ and $\\beta={be}$. Hence $\\beta-2\\alpha={ans}$."],
  },
  bm_countDigits: {
    ko: ["서로 다른 숫자가 하나씩 적힌 카드 ${n}$장이 있고, 카드에 적힌 숫자는 ${ds}$ 입니다. 이 중 3장을 뽑아 한 줄로 늘어놓아 만든 세 자리 자연수 중 짝수는 모두 몇 개일까요? (맨 앞자리에는 0이 올 수 없어요. 숫자만 쓰세요)", ["일의 자리는 짝수여야 해요. 일의 자리를 먼저 정하고 나머지 자리를 채워요.", "일의 자리가 0인 경우와 0이 아닌 짝수인 경우로 나누어 순열의 수로 세어 보세요. 0이 아닌 짝수가 일의 자리에 오면 맨 앞자리에는 0이 올 수 없어요."], "일의 자리가 0인 경우: 나머지 두 자리를 남은 카드 ${n1}$장에서 골라 한 줄로 놓으므로 ${zex}$개입니다. 일의 자리가 0이 아닌 짝수인 경우: 일의 자리는 0이 아닌 짝수 카드 ${nz}$장 중에서 정하고, 맨 앞자리는 남은 카드 중 0을 제외한 ${n2}$장에서 정하고, 가운데 자리는 남은 ${n2}$장에서 정하므로 ${oex}$개입니다. 합의 법칙에 의해 ${z}+{o}={ans}$개입니다."],
    en: ["Cards show distinct digits, one digit per card: ${n}$ cards with the digits ${ds}$. Choose 3 cards and line them up to make a three-digit natural number. How many of these numbers are even? (The first digit cannot be 0. Digits only)", ["The last digit must be even. Fix the last digit first, then fill the other places.", "Split into the case where the last digit is 0 and the case where it is a nonzero even digit, and count each with permutations. If a nonzero even digit is last, 0 cannot be placed first."], "Last digit 0: the other two places are filled from the remaining ${n1}$ cards in order, giving ${zex}$ numbers. Last digit a nonzero even digit: choose it among the ${nz}$ nonzero even cards, then the first digit among the remaining ${n2}$ nonzero cards, then the middle digit among the remaining ${n2}$ cards, giving ${oex}$ numbers. By the sum rule ${z}+{o}={ans}$."],
  },
  bm_matUnknown: {
    ko: ["행렬 $A={A}$, $B={B}$, $C={C}$ 에 대하여 ${ex}=C$ 가 성립할 때, 실수 $x$, $y$의 합 $x+y$의 값은? (숫자만 쓰세요)", ["두 행렬이 같으려면 같은 위치의 성분이 서로 같아야 해요.", "$x$가 들어 있는 성분으로 일차방정식을 세워 $x$를 구하고, $y$도 같은 방법으로 구하세요."], "$x$가 있는 성분을 비교하면 ${eqx}$ 이므로 $x={xv}$, $y$가 있는 성분을 비교하면 ${eqy}$ 이므로 $y={yv}$입니다. 따라서 $x+y={ans}$입니다."],
    en: ["For the matrices $A={A}$, $B={B}$, $C={C}$ with ${ex}=C$, what is the sum $x+y$ of the real numbers $x$ and $y$? (digits only)", ["Two matrices are equal when the entries in the same positions are equal.", "Write a linear equation from an entry containing $x$ to find $x$, and do the same for $y$."], "Comparing the entry with $x$ gives ${eqx}$, so $x={xv}$; comparing the entry with $y$ gives ${eqy}$, so $y={yv}$. Hence $x+y={ans}$."],
  },
  bm_lineParPerp: {
    ko: ["직선 $L:{L}$ 이 있고 점 $\\mathrm{P}$의 좌표는 $({x0},{y0})$ 입니다. 점 $\\mathrm{P}$를 지나고 $L$에 평행한 직선의 $y$절편을 $s$, 점 $\\mathrm{P}$를 지나고 $L$에 수직인 직선의 $y$절편을 $t$라 할 때, $s+t$의 값은? (숫자만 쓰세요)", ["$ax+by+c=0$ 꼴의 직선의 기울기는 $-\\frac{a}{b}$이고, 수직인 두 직선의 기울기의 곱은 $-1$이에요.", "평행한 직선은 $x$, $y$의 계수가 같고, 수직인 직선은 $bx-ay=k$ ($k$는 상수) 꼴이에요. 점 P의 좌표를 넣어 $k$를 구해요."], "평행한 직선은 ${par}$ 이고 $x=0$을 넣으면 $s={s}$입니다. 수직인 직선은 ${perp}$ 이고 $x=0$을 넣으면 $t={t}$입니다. 따라서 $s+t={ans}$입니다."],
    en: ["Let $L:{L}$ be a line. The line through $\\mathrm{P}({x0},{y0})$ parallel to $L$ has $y$-intercept $s$, and the line through $\\mathrm{P}$ perpendicular to $L$ has $y$-intercept $t$. What is $s+t$? (digits only)", ["A line $ax+by+c=0$ has slope $-\\frac{a}{b}$, and the slopes of perpendicular lines multiply to $-1$.", "A parallel line has the same coefficients of $x$ and $y$; a perpendicular line has the form $bx-ay=(\\text{a constant})$. Substitute P to find the constant."], "The parallel line is ${par}$; putting $x=0$ gives $s={s}$. The perpendicular line is ${perp}$; putting $x=0$ gives $t={t}$. So $s+t={ans}$."],
  },
  bm_circleLine: {
    ko: ["원: ${circ}$, 직선: ${line}$ 이 서로 다른 두 점에서 만나도록 하는 정수 $m$은 모두 몇 개일까요? (숫자만 쓰세요)", ["직선의 식을 원의 방정식에 대입하면 $x$에 대한 이차방정식이 돼요.", "서로 다른 두 점에서 만나려면 이 이차방정식이 서로 다른 두 실근을 가져야 해요. 판별식 $D>0$ 에서 $m$의 범위를 구한 뒤 정수를 세요."], "직선의 식을 원의 방정식에 대입하면 ${sub}=0$ 입니다. 판별식을 $D$라 하면 $\\frac{D}{4}={d4}$ 이므로 $D>0$ 에서 ${cond}$ 입니다. ${chk}$ 이므로 정수 $m$은 $-{hi}$ 이상 ${hi}$ 이하의 모든 정수이므로 모두 ${ans}$개입니다."],
    en: ["Circle: ${circ}$, line: ${line}$. For how many integers $m$ do they meet at two distinct points? (digits only)", ["Substitute the equation of the line into the equation of the circle to get a quadratic in $x$.", "Two distinct intersection points need two distinct real roots, so $D>0$. Find the range of $m$ from $D>0$ and count the integers."], "Substituting the line into the circle gives ${sub}=0$. With discriminant $D$ we have $\\frac{D}{4}={d4}$, so $D>0$ gives ${cond}$. Since ${chk}$, the integers $m$ are exactly those from $-{hi}$ to ${hi}$, in total ${ans}$."],
  },
  bm_transform: {
    ko: ["점 $\\mathrm{P}$의 좌표는 $({a},{b})$ 입니다. 점 $\\mathrm{P}$를 $x$축의 방향으로 ${p}$만큼, $y$축의 방향으로 ${q}$만큼 평행이동한 점을 $\\mathrm{Q}$, 점 $\\mathrm{Q}$를 $x$축에 대하여 대칭이동한 점을 $\\mathrm{R}$, 점 $\\mathrm{R}$을 직선 $y=x$에 대하여 대칭이동한 점을 $\\mathrm{S}(m,n)$이라 할 때, $2m+n$의 값은? (숫자만 쓰세요)", ["평행이동: $(x,y)\\to(x+p,\\,y+q)$, $x$축 대칭: $(x,y)\\to(x,-y)$, 직선 $y=x$ 대칭: $(x,y)\\to(y,x)$예요.", "순서대로 한 번에 한 점씩 구하세요."], "$\\mathrm{Q}({qx},{qy})$, $\\mathrm{R}({rx},{ry})$, $\\mathrm{S}({m},{n})$이므로 $2m+n={ans}$입니다."],
    en: ["Translate the point $\\mathrm{P}({a},{b})$ by ${p}$ in the $x$-direction and ${q}$ in the $y$-direction to get $\\mathrm{Q}$; reflect $\\mathrm{Q}$ in the $x$-axis to get $\\mathrm{R}$; reflect $\\mathrm{R}$ in the line $y=x$ to get $\\mathrm{S}(m,n)$. What is $2m+n$? (digits only)", ["Translation: $(x,y)\\to(x+p,\\,y+q)$; reflection in the $x$-axis: $(x,y)\\to(x,-y)$; reflection in $y=x$: $(x,y)\\to(y,x)$.", "Find one point at a time, in order."], "$\\mathrm{Q}({qx},{qy})$, $\\mathrm{R}({rx},{ry})$, $\\mathrm{S}({m},{n})$, so $2m+n={ans}$."],
  },
  bm_setOps: {
    ko: ["전체집합 $U$는 ${n}$ 이하의 자연수 전체의 집합이고, $U$의 두 부분집합 $A$는 ${a}$의 약수 전체의 집합, $B$는 ${b}$의 배수 전체의 집합입니다. 집합 $A\\cap B^{c}$ 의 모든 원소의 합은? (숫자만 쓰세요)", ["$A$와 $B$를 원소나열법으로 나타내 보세요. $B$는 $U$ 안에서만 생각해요.", "$B^{c}$는 $U$에서 $B$의 원소를 뺀 나머지예요. $A$의 원소 중 $B$에 속하지 않는 것만 골라요."], "$A=\\{{As}\\}$, $B=\\{{Bs}\\}$이므로 $A\\cap B^{c}=\\{{Rs}\\}$이고 원소의 합은 ${ans}$입니다."],
    en: ["The universal set $U$ is the set of all natural numbers at most ${n}$. Its subsets are $A$, the set of all divisors of ${a}$, and $B$, the set of all multiples of ${b}$. What is the sum of all elements of $A\\cap B^{c}$? (digits only)", ["List $A$ and $B$ by their elements. Only consider multiples inside $U$.", "$B^{c}$ is what remains of $U$ after removing the elements of $B$. Keep the elements of $A$ that are not in $B$."], "$A=\\{{As}\\}$ and $B=\\{{Bs}\\}$, so $A\\cap B^{c}=\\{{Rs}\\}$ and the sum of its elements is ${ans}$."],
  },
  bm_propRange: {
    ko: ["실수 $x$에 대한 두 조건 $p:{pc}$, $q: m\\le x\\le {n}$ 에 대하여 명제 $p\\to q$ 가 참이 되도록 하는 정수 $m$의 최댓값은? (숫자만 쓰세요)", ["명제 $p\\to q$가 참이면 $p$의 진리집합이 $q$의 진리집합에 포함돼요.", "먼저 $p$를 만족하는 $x$의 범위를 구하고, 그 범위의 왼쪽 끝이 $m$ 이상이 되도록 하세요."], "$p$의 진리집합은 $\\{x\\mid {lo}{rl}x{rl}{hi}\\}$ 입니다. 이것이 $q$의 진리집합 $\\{x\\mid m\\le x\\le {n}\\}$에 포함되려면 $m\\le {lo}$이고 ${hi}\\le {n}$이어야 합니다. 따라서 정수 $m$의 최댓값은 ${ans}$입니다."],
    en: ["For real $x$, consider the conditions $p:{pc}$ and $q: m\\le x\\le {n}$. What is the largest integer $m$ for which the proposition $p\\to q$ is true? (digits only)", ["$p\\to q$ is true when the truth set of $p$ is contained in the truth set of $q$.", "First find the range of $x$ satisfying $p$, then make sure its left end is at least $m$."], "The truth set of $p$ is $\\{x\\mid {lo}{rl}x{rl}{hi}\\}$. For it to lie inside $\\{x\\mid m\\le x\\le {n}\\}$ we need $m\\le {lo}$ and ${hi}\\le {n}$. So the largest integer $m$ is ${ans}$."],
  },
  bm_compUnknown: {
    ko: ["두 함수 $f(x)={f}$, $g$ 에 대하여 합성함수 $(g\\circ f)(x)={h}$ 일 때, $g({k})$의 값은? (숫자만 쓰세요)", ["$g({k})$의 값을 얻으려면 $f(x)={k}$ 일 때의 $x$를 찾으면 돼요.", "그 $x$를 합성함수 $(g\\circ f)(x)=g(f(x))$에 넣어요."], "$f(x)={k}$ 에서 $x={x0}$입니다. $(g\\circ f)({x0})=g(f({x0}))=g({k})$이므로 $g({k})={h}$ 에서 $x={x0}$ 일 때의 값 ${ans}$입니다."],
    en: ["For the function $f(x)={f}$ and a function $g$, the composite function satisfies $(g\\circ f)(x)={h}$. What is $g({k})$? (digits only)", ["To get $g({k})$, find the $x$ with $f(x)={k}$.", "Put that $x$ into the composite function $(g\\circ f)(x)=g(f(x))$."], "$f(x)={k}$ gives $x={x0}$. Then $(g\\circ f)({x0})=g(f({x0}))=g({k})$, so put $x={x0}$ into ${h}$ to get ${ans}$."],
  },
  bm_funcCount: {
    ko: ["집합 $X$는 ${m}$ 이하의 자연수 전체의 집합이고, 집합 $Y$는 ${n}$ 이하의 자연수 전체의 집합입니다. $X$에서 $Y$로의 함수 $f$ 중에서 $f(1)=1$ 이고 일대일함수가 아닌 것은 모두 몇 개일까요? (숫자만 쓰세요)", ["$f(1)=1$이면 나머지 원소 각각의 함숫값은 $Y$의 원소 중 하나로 자유롭게 정할 수 있어요.", "(조건을 만족하는 함수 전체) $-$ (그중 일대일함수)로 구해요. 일대일함수에서는 서로 다른 원소의 함숫값이 모두 달라요."], "$f(1)=1$인 함수는 나머지 ${m1}$개의 원소가 각각 ${n}$가지 값을 가질 수 있으므로 ${tot}$개이고, 그중 일대일함수는 나머지 원소가 1이 아닌 서로 다른 값을 가져야 하므로 ${inj}$개입니다. 따라서 ${tot}-{inj}={ans}$개입니다."],
    en: ["The set $X$ is the set of all natural numbers at most ${m}$ and the set $Y$ is the set of all natural numbers at most ${n}$. How many functions $f$ from $X$ to $Y$ satisfy $f(1)=1$ and are not one-to-one? (digits only)", ["If $f(1)=1$, each of the other elements can be sent to any element of $Y$ freely.", "Count (all such functions) $-$ (those that are one-to-one). In a one-to-one function different elements have different images."], "With $f(1)=1$, each of the other ${m1}$ elements has ${n}$ choices, giving ${tot}$ functions. For a one-to-one function the others need distinct values different from 1, giving ${inj}$. So ${tot}-{inj}={ans}$."],
  },
};

// ---------- generators ----------
/** one linear inequality px+q rel rr*x+s, forced to give an upper (wantUp) or lower bound on x */
function oneIneq(r, lvl, wantUp) {
  for (;;) {
    const rel = r.pick(RELS);
    const p = lvl === 1 ? r.int(1, 3) : r.nonzero(-4, 4);
    const q = r.int(-6, 6);
    const rr = lvl === 1 ? 0 : r.pick([0, 0, r.nonzero(-3, 3)]);
    const s = lvl === 1 ? r.int(-9, 9) : r.int(-8, 8);
    const A = p - rr, B = s - q;
    if (A === 0) continue;
    const nrel = A < 0 ? FLIP[rel] : rel;
    if (isUp(nrel) !== wantUp) continue;
    const txt = `${lin(p, q)}${rel}${rr === 0 ? s : lin(rr, s)}`;
    return { txt, sol: `x${nrel}${tfrac(B, A)}`, test: (x) => holds(p * x + q, rel, rr * x + s) };
  }
}

export const GEN = {
  bm_ineqSystem: (r, lvl) => {
    for (;;) {
      let a = oneIneq(r, lvl, true), b = oneIneq(r, lvl, false);
      if (r.next() < 0.5) [a, b] = [b, a];
      const xs = [];
      for (let x = -80; x <= 80; x++) if (a.test(x) && b.test(x)) xs.push(x);
      if (xs.length < 2 || xs.length > 9) continue;
      return { v: { i1: a.txt, i2: b.txt, s1: a.sol, s2: b.sol, ints: xs.join(", ") }, ans: xs.length };
    }
  },
  bm_absIneq: (r) => {
    for (;;) {
      const rel = r.pick(RELS);
      const N = r.int(8, 14);
      let a, b, c;
      if (r.next() < 0.45) { a = 1; b = -r.int(-5, 5); c = r.int(1, 6); }
      else { a = r.pick([2, 3, 4, -2, -3]); b = r.nonzero(-7, 7); c = r.int(2, 12); }
      const lo = Math.min((-c - b) / a, (c - b) / a), hi = Math.max((-c - b) / a, (c - b) / a);
      const fr = (num) => tfrac(num, Math.abs(a));
      const L = a > 0 ? fr(-c - b) : fr(b - c), H = a > 0 ? fr(c - b) : fr(b + c);
      const sol = rel === "<" ? `${L}<x<${H}` : rel === "\\le" ? `${L}\\le x\\le ${H}` : rel === ">" ? `x<${L}\\ \\text{or}\\ x>${H}` : `x\\le ${L}\\ \\text{or}\\ x\\ge ${H}`;
      let cnt = 0;
      for (let x = -N; x <= N; x++) if (holds(Math.abs(a * x + b), rel, c)) cnt++;
      if (cnt < 3 || cnt > 2 * N - 2) continue;
      void lo; void hi;
      return { v: { ineq: `|${lin(a, b)}|${rel}${c}`, N, sol }, ans: cnt };
    }
  },
  bm_quadRange: (r) => {
    for (;;) {
      const a = r.pick([1, 1, 2, -1, -1, -2, 3]);
      const h = r.int(-4, 4), k = r.int(-6, 6);
      const s = h - r.int(1, 4), t = h + r.int(1, 4);
      const f = (x) => a * (x - h) ** 2 + k;
      const vals = [k, f(s), f(t)];
      const M = Math.max(...vals), m = Math.min(...vals);
      return { v: { f: poly([a, -2 * a * h, a * h * h + k]), s, t, vf: `${cf(a)}${h === 0 ? "x" : `(x${sg(-h)})`}^{2}${k === 0 ? "" : sg(k)}`, h, k, fs: f(s), ft: f(t), M, m }, ans: M + m };
    }
  },
  bm_discK: (r) => {
    for (;;) {
      const N = r.int(6, 12);
      let v, ok;
      if (r.next() < 0.55) {
        const a = r.pick([-3, -2, -1, 1, 2, 3]), b = r.nonzero(-6, 6);
        const bound = tfrac(b * b, 4 * a);
        v = { f: `${cf(a)}x^2${b > 0 ? "+" : "-"}${co(b)}x+k`, N, D: `${b * b}${sg(-4 * a)}k`, cond: a > 0 ? `k<${bound}` : `k>${bound}` };
        ok = (k) => b * b - 4 * a * k > 0;
      } else {
        const a = r.int(1, 3), c = r.int(1, 4);
        v = { f: `${cf(a)}x^2+kx+${c}`, N, D: `k^2-${4 * a * c}`, cond: `k^2>${4 * a * c}` };
        ok = (k) => k * k - 4 * a * c > 0;
      }
      let cnt = 0;
      for (let k = -N; k <= N; k++) if (ok(k)) cnt++;
      if (cnt < 3 || cnt > 2 * N - 1) continue;
      return { v, ans: cnt };
    }
  },
  bm_polyFactor: (r) => {
    for (;;) {
      const a = r.int(1, 3), c = r.int(1, 3), b = r.nonzero(-6, 6), d = r.nonzero(-6, 6);
      if (a > c || (a === c && b > d)) continue;
      const A = a * c, B = a * d + b * c, Cc = b * d;
      if (gcd(gcd(A, Math.abs(B)), Math.abs(Cc)) !== 1) continue;
      return { v: { Pex: poly([A, B, Cc]), f1: lin(a, b), f2: lin(c, d), a, b, c, d }, ans: a + b + c + d };
    }
  },
  bm_polyExpand: (r) => {
    const p = r.nonzero(-4, 4), q = r.nonzero(-4, 4), rr = r.nonzero(-5, 5), k = r.int(1, 3), s = r.int(1, 2), t = r.nonzero(-4, 4);
    const sgn = r.next() < 0.5 ? 1 : -1;
    const first = [1, p + q, rr + p * q, p * rr];
    const second = [0, k * s * s, 2 * k * s * t, k * t * t];
    const tot = first.map((c, i) => c + sgn * second[i]);
    const e = `(${lin(1, p)})(${poly([1, q, rr])})${sgn > 0 ? "+" : "-"}${k === 1 ? "" : k}(${lin(s, t)})^2`;
    return { v: { expr: e, e1: poly(first), e2: poly(second.slice(1)), op: sgn > 0 ? "+" : "-", total: poly(tot), c2: tot[1], c0: tot[3] }, ans: tot[1] + tot[3] };
  },
  bm_quadRoots: (r) => {
    for (;;) {
      const al = r.int(-7, 6), be = al + r.int(1, 8);
      if (be > 7) continue;
      const a = r.pick([1, 1, 2, 3]);
      const b = -a * (al + be), c = a * al * be;
      const u = r.nonzero(-4, 4), w = r.int(-6, 6);
      return { v: { eq: `${poly([a, b + u, c + w])}=${lin(u, w)}`, std: poly([a, b, c]), fac: `${a === 1 ? "" : a}${al === 0 ? `x(${lin(1, -be)})` : be === 0 ? `x(${lin(1, -al)})` : `(${lin(1, -al)})(${lin(1, -be)})`}`, al, be }, ans: be - 2 * al };
    }
  },
  bm_countDigits: (r) => {
    for (;;) {
      const n = r.int(5, 7), k = 3;
      const ds = [0];
      while (ds.length < n) { const d = r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9]); if (!ds.includes(d)) ds.push(d); }
      ds.sort((x, y) => x - y);
      const nz = ds.filter((d) => d !== 0 && d % 2 === 0).length;
      if (nz < 1) continue;
      const z = P(n - 1, k - 1), o = nz * (n - 2) * (n - 2);
      let cnt = 0;
      for (const p of perms(ds, k)) if (p[0] !== 0 && p[k - 1] % 2 === 0) cnt++;
      if (cnt !== z + o) throw new Error("countDigits mismatch");
      return { v: { n, ds: ds.join(", "), n1: n - 1, n2: n - 2, nz, z, o, zex: `P(${n - 1},2)=${n - 1}\\times${n - 2}=${z}`, oex: `${nz}\\times${n - 2}\\times${n - 2}=${o}` }, ans: cnt };
    }
  },
  bm_matUnknown: (r) => {
    for (;;) {
    const p = r.pick([1, 2, 3]), q = r.nonzero(-3, 3);
    const idx = r.pick([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);
    const Av = [0, 1, 2, 3].map(() => r.int(-5, 5)), Bv = [0, 1, 2, 3].map(() => r.int(-5, 5));
    const xv = r.int(-5, 5), yv = r.int(-5, 5);
    Av[idx[0]] = xv; Av[idx[1]] = yv;
    const Cv = Av.map((a, i) => p * a + q * Bv[i]);
    const Ad = Av.map((a, i) => (i === idx[0] ? "x" : i === idx[1] ? "y" : a));
    if (p === 1 && (Bv[idx[0]] === 0 || Bv[idx[1]] === 0)) continue;   // would read "x=..." so that the comparison says nothing
    const eqOf = (sym, i) => {
      const b = Bv[i], t = b === 0 ? "" : Math.abs(q) === 1 ? `${q > 0 ? "+" : "-"}${b < 0 ? `(${b})` : b}` : `${q > 0 ? "+" : "-"}${Math.abs(q)}\\times${b < 0 ? `(${b})` : b}`;
      return `${cf(p)}${sym}${t}=${Cv[i]}`;
    };
    return { v: { A: m2(Ad), B: m2(Bv), C: m2(Cv), ex: `${cf(p)}A${q > 0 ? "+" : "-"}${co(q)}B`, eqx: eqOf("x", idx[0]), eqy: eqOf("y", idx[1]), xv, yv }, ans: xv + yv };
    }
  },
  bm_lineParPerp: (r) => {
    for (;;) {
      const a = r.nonzero(-4, 4), b = r.nonzero(-4, 4);
      if (gcd(Math.abs(a), Math.abs(b)) !== 1) continue;
      const ab = Math.abs(a * b), j = r.int(-Math.floor(12 / ab), Math.floor(12 / ab));
      const x0 = ab * j, y0 = r.int(-6, 6), c = r.int(-8, 8);
      if (a * x0 + b * y0 + c === 0) continue;
      const kpar = a * x0 + b * y0, kperp = b * x0 - a * y0;
      const s = kpar / b, t = -kperp / a;
      if (!Number.isInteger(s) || !Number.isInteger(t)) continue;
      return { v: { L: `${axby(a, b)}${c > 0 ? `+${c}` : c < 0 ? c : ""}=0`, x0, y0, par: `${axby(a, b)}=${kpar}`, perp: `${axby(b, -a)}=${kperp}`, s, t }, ans: s + t };
    }
  },
  bm_circleLine: (r) => {
    // circle x^2+y^2=R2 and a line of slope p: substituting gives (1+p^2)x^2+... with D/4 = (1+p^2)R2 - m^2
    const R2 = r.int(2, 20), p = r.nonzero(-3, 3), A = 1 + p * p, B = A * R2;
    const form2 = r.next() < 0.5;
    let hi = Math.floor(Math.sqrt(B)); if (hi * hi === B) hi -= 1;
    const ap = Math.abs(p);
    const line = form2 ? `${cf(p)}x+y=m` : `y=${cf(p)}x+m`;
    const sub = form2 ? `${A}x^{2}${p > 0 ? "-" : "+"}${2 * ap}mx+m^{2}-${R2}` : `${A}x^{2}${p > 0 ? "+" : "-"}${2 * ap}mx+m^{2}-${R2}`;
    const d4 = `(${cf(p)}m)^{2}-${A}(m^{2}-${R2})=${B}-m^{2}`;
    return { v: { circ: `x^{2}+y^{2}=${R2}`, line, sub, d4, cond: `m^{2}<${B}`, chk: `${hi}^{2}=${hi * hi}<${B}\\le ${(hi + 1) ** 2}`, hi }, ans: 2 * hi + 1 };
  },
  bm_transform: (r) => {
    const a = r.int(-6, 6), b = r.int(-6, 6), p = r.nonzero(-5, 5), q = r.nonzero(-5, 5);
    const qx = a + p, qy = b + q, rx = qx, ry = -qy, m = ry, n = rx;
    return { v: { a, b, p, q, qx, qy, rx, ry, m, n }, ans: 2 * m + n };
  },
  bm_setOps: (r) => {
    for (;;) {
      const n = r.int(12, 30), a = r.pick([12, 18, 20, 24, 28, 30, 36, 40, 42]), b = r.int(2, 6);
      if (a > n) continue;
      const A = [], B = [], R = [];
      for (let x = 1; x <= n; x++) { if (a % x === 0) A.push(x); if (x % b === 0) B.push(x); }
      for (const x of A) if (!B.includes(x)) R.push(x);
      if (R.length < 2 || B.length < 2 || A.length === R.length) continue;
      return { v: { n, a, b, As: A.join(", "), Bs: B.join(", "), Rs: R.join(", ") }, ans: R.reduce((s, x) => s + x, 0) };
    }
  },
  bm_propRange: (r) => {
    const c = r.pick([1, 2, 3]), t = r.int(1, 8), s = r.int(-6, 9);
    const rel = r.pick(["<", "\\le"]);
    const lo = (s - t) / c, hi = (s + t) / c;
    const n = Math.ceil(hi) + r.int(0, 3);
    return { v: { pc: `|${lin(c, -s)}|${rel}${t}`, n, rl: rel, lo: tfrac(s - t, c), hi: tfrac(s + t, c) }, ans: Math.floor(lo) };
  },
  bm_compUnknown: (r) => {
    const a = r.pick([-3, -2, -1, 1, 2, 3]), b = r.int(-5, 5), u = r.pick([-3, -2, -1, 2, 3]), w = r.int(-6, 6), x0 = r.int(-4, 4);
    const k = a * x0 + b;
    return { v: { f: lin(a, b), h: lin(u * a, u * b + w), k, x0 }, ans: u * k + w };
  },
  bm_funcCount: (r) => {
    const m = r.int(3, 5), n = r.int(m, 7);
    const tot = n ** (m - 1);
    let inj = 1; for (let i = 0; i < m - 1; i++) inj *= n - 1 - i;
    return { v: { m, n, m1: m - 1, tot, inj }, ans: tot - inj };
  },
};

export const PLAN = [
  { skill: "m.h1.ineq", template: "bm_ineqSystem", levels: [1, 2], count: 12, d: 2, standards: ["10기수1-02-06", "10기수1-02-07"], strategy: "intersect-ranges-count-integers", evidence: "counting" },
  { skill: "m.h1.ineq", template: "bm_absIneq", levels: [1], count: 14, d: 2, standards: ["10기수1-02-08"], strategy: "abs-to-range", evidence: "counting" },
  { skill: "m.h1.cplx", template: "bm_quadRange", levels: [1], count: 14, d: 3, standards: ["10기수1-02-05", "10기수1-02-03"], strategy: "vertex-and-endpoints", evidence: "calc" },
  { skill: "m.h1.cplx", template: "bm_discK", levels: [1], count: 14, d: 3, standards: ["10기수1-02-02", "10기수1-02-04"], strategy: "discriminant-parameter-count", evidence: "concept" },
  { skill: "m.h1.cplx", template: "bm_quadRoots", levels: [1], count: 14, d: 1, standards: ["10기수1-02-01"], strategy: "rearrange-then-factor", evidence: "calc" },
  { skill: "m.h1.pol1", template: "bm_polyFactor", levels: [1], count: 14, d: 2, standards: ["10기수1-01-03"], strategy: "factor-cross-multiplication", evidence: "reverse" },
  { skill: "m.h1.poly", template: "bm_polyExpand", levels: [1], count: 14, d: 2, standards: ["10기수1-01-01", "10기수1-01-02"], strategy: "expand-and-collect", evidence: "calc" },
  { skill: "m.h1.comb", template: "bm_countDigits", levels: [1], count: 14, d: 3, standards: ["10기수1-03-02", "10기수1-03-01"], strategy: "casework-sum-product", evidence: "counting" },
  { skill: "m.h1.mat1", template: "bm_matUnknown", levels: [1], count: 14, d: 2, standards: ["10기수1-04-02"], strategy: "entrywise-equation", evidence: "reverse" },
  { skill: "m.h1.geom", template: "bm_lineParPerp", levels: [1], count: 14, d: 3, standards: ["10기수2-01-02", "10기수2-01-03"], strategy: "parallel-perpendicular-intercepts", evidence: "calc" },
  { skill: "m.h1.geo2", template: "bm_circleLine", levels: [1], count: 14, d: 3, standards: ["10기수2-01-04", "10기수2-01-05"], strategy: "substitute-line-discriminant-count", evidence: "counting" },
  { skill: "m.h1.geo2", template: "bm_transform", levels: [1], count: 14, d: 2, standards: ["10기수2-01-06", "10기수2-01-07"], strategy: "chain-of-transformations", evidence: "calc" },
  { skill: "m.h1.set1", template: "bm_setOps", levels: [1], count: 14, d: 2, standards: ["10기수2-02-01", "10기수2-02-03"], strategy: "list-then-operate", evidence: "representation" },
  { skill: "m.h1.set1", template: "bm_propRange", levels: [1], count: 14, d: 4, standards: ["10기수2-02-02"], strategy: "truth-set-inclusion", evidence: "concept" },
  { skill: "m.h1.fnc1", template: "bm_compUnknown", levels: [1], count: 14, d: 2, standards: ["10기수2-03-02"], strategy: "hidden-outer-function", evidence: "reverse" },
  { skill: "m.h1.fnc1", template: "bm_funcCount", levels: [1], count: 12, d: 4, standards: ["10기수2-03-01"], strategy: "count-functions-by-definition", evidence: "counting" },
];

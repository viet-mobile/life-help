// 공통수학2 (10공수2): 도형의 방정식 (내분점, 직선, 원, 평행·대칭이동), 집합과 명제, 함수 (합성·역함수·유리함수·무리함수).
// Geometry is always given by coordinates / equations (no figure). Every answer is re-derived by verify/cm2.py with a different method.
import { gcd, C, P, sg, cf, lin, poly, tfrac } from "../lib.mjs";

// ---------- small helpers ----------
const find = (fn, n = 40000) => { for (let i = 0; i < n; i++) { const o = fn(); if (o) return o; } throw new Error("cm2: generator found nothing"); };
/** signed term "+3x" / "-y" / "+5" (v = "" for a constant); 0 -> "" */
const tm = (c, v) => { if (c === 0) return ""; const a = Math.abs(c); return `${c < 0 ? "-" : "+"}${v && a === 1 ? "" : a}${v}`; };
const expr = (ts) => { const s = ts.map(([c, v]) => tm(c, v)).join(""); return s ? (s[0] === "+" ? s.slice(1) : s) : "0"; };
/** x - p as text */
const xs = (p, x = "x") => (p === 0 ? x : `${x}${p > 0 ? "-" : "+"}${Math.abs(p)}`);
/** ax+by+c=0 */
const lineEq = (a, b, c) => `${expr([[a, "x"], [b, "y"], [c, ""]])}=0`;
/** (x-a)^2+(y-b)^2=r^2 written with r^2 evaluated */
const circStd = (a, b, r) => `${a === 0 ? "x^2" : `(${xs(a)})^2`}+${b === 0 ? "y^2" : `(${xs(b, "y")})^2`}=${r * r}`;
const circGen = (a, b, r, k = 1) => `${expr([[k, "x^2"], [k, "y^2"], [-2 * k * a, "x"], [-2 * k * b, "y"], [k * (a * a + b * b - r * r), ""]])}=0`;
/** {1, 2, 3} / {1, 2, \\dots, n} */
const setTxt = (n) => (n <= 5 ? Array.from({ length: n }, (_, i) => i + 1).join(", ") : `1, 2, \\dots, ${n}`);
const divisors = (n) => { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; };
const isSq = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
const NORMALS = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]];
const FRAC = "(소수로 써도 되고 3/4 처럼 분수로 써도 돼요)";
const FRAC_EN = "(a decimal or a fraction such as 3/4 is accepted)";

export const TEMPLATES = {
  // ---------------- 도형의 방정식 ----------------
  cm2_divPoint: {
    ko: ["두 점 $A({x1}, {y1})$, $B({x2}, {y2})$를 이은 선분 $AB$를 내분하는 점 $P$가 $\\overline{A P}:\\overline{P B}={m}:{n}$을 만족할 때, 점 $P$의 $x$좌표와 $y$좌표의 합은? (숫자만 쓰세요)", ["선분 $AB$를 $m:n$으로 내분하는 점의 좌표는 $\\left(\\frac{mx_2+nx_1}{m+n},\\ \\frac{my_2+ny_1}{m+n}\\right)$예요.", "$x$좌표와 $y$좌표를 따로 구한 뒤 더해요. $x$좌표는 $\\frac{{m}\\times({x2})+{n}\\times({x1})}{{m}+{n}}$이에요."], "$P\\left(\\frac{{m}\\times({x2})+{n}\\times({x1})}{{m}+{n}},\\ \\frac{{m}\\times({y2})+{n}\\times({y1})}{{m}+{n}}\\right)=({px}, {py})$이므로 두 좌표의 합은 ${px}+({py})={ans}$입니다."],
    en: ["Point $P$ lies on the segment joining $A({x1}, {y1})$ and $B({x2}, {y2})$ and divides it internally with $\\overline{A P}:\\overline{P B}={m}:{n}$. What is the sum of the $x$- and $y$-coordinates of $P$? (digits only)", ["The internal division point in ratio $m:n$ is $\\left(\\frac{mx_2+nx_1}{m+n},\\ \\frac{my_2+ny_1}{m+n}\\right)$.", "Find the two coordinates separately, then add. The $x$-coordinate is $\\frac{{m}\\times({x2})+{n}\\times({x1})}{{m}+{n}}$."], "$P\\left(\\frac{{m}\\times({x2})+{n}\\times({x1})}{{m}+{n}},\\ \\frac{{m}\\times({y2})+{n}\\times({y1})}{{m}+{n}}\\right)=({px}, {py})$, so the sum is ${px}+({py})={ans}$."],
  },
  cm2_divRatioFind: {
    ko: ["세 점 $A({x1}, {y1})$, $B({x2}, {y2})$, $P({px}, {py})$에서 점 $P$는 선분 $AB$ 위의 점이고 $\\overline{A P}:\\overline{P B}=m:n$입니다. $m$, $n$이 서로소인 자연수일 때, $m+n$의 값은? (숫자만 쓰세요)", ["$P$가 $AB$를 $m:n$으로 내분하면 $x$좌표는 $\\frac{mx_2+nx_1}{m+n}$이에요. 거꾸로 $P$의 좌표에서 비를 찾아요.", "$x$좌표의 차이로 $\\overline{A P}:\\overline{P B}=|p_x-x_1|:|x_2-p_x|$를 구하고 약분해요."], "$x$좌표를 비교하면 $|{px}-({x1})|={u}$, $|({x2})-({px})|={w}$이므로 $\\overline{A P}:\\overline{P B}={u}:{w}$이고, 이를 서로소인 정수비로 나타내면 ${m}:{n}$입니다. ($y$좌표도 같은 비를 줍니다.) 따라서 $m+n={ans}$입니다."],
    en: ["For $A({x1}, {y1})$, $B({x2}, {y2})$ and $P({px}, {py})$, the point $P$ lies on the segment $AB$ and $\\overline{A P}:\\overline{P B}=m:n$ with $m$, $n$ coprime positive integers. What is $m+n$? (digits only)", ["If $P$ divides $AB$ in ratio $m:n$, its $x$-coordinate is $\\frac{mx_2+nx_1}{m+n}$. Work backwards from the coordinates of $P$.", "Use the differences of $x$-coordinates: $\\overline{A P}:\\overline{P B}=|p_x-x_1|:|x_2-p_x|$, then reduce."], "Comparing $x$-coordinates: $|{px}-({x1})|={u}$ and $|({x2})-({px})|={w}$, so $\\overline{A P}:\\overline{P B}={u}:{w}$, which in lowest terms is ${m}:{n}$ (the $y$-coordinates give the same ratio). Hence $m+n={ans}$."],
  },
  cm2_lineThroughPerp: {
    ko: ["직선 $l$: ${line}$에 수직이고 점 $P({px}, {py})$를 지나는 직선이 $y$축과 만나는 점의 $y$좌표는? (숫자만 쓰세요)", ["두 직선이 수직이면 기울기의 곱이 $-1$이에요.", "먼저 $l$의 기울기를 구하고, 수직인 직선의 기울기로 점기울기형 식을 세워 $x=0$을 대입해요."], "직선 $l$의 기울기는 ${ms}$이므로 수직인 직선의 기울기는 ${mp}$입니다. 점 $P$를 지나므로 $y-({py})={mp}\\left(x-({px})\\right)$이고, $x=0$을 대입하면 $y={ans}$입니다."],
    en: ["A line is perpendicular to the line $l$: ${line}$ and passes through the point $P({px}, {py})$. What is the $y$-coordinate of the point where it meets the $y$-axis? (digits only)", ["Perpendicular lines have slopes whose product is $-1$.", "Find the slope of $l$, take the perpendicular slope, write the point-slope form and put $x=0$."], "The slope of $l$ is ${ms}$, so the perpendicular slope is ${mp}$. Through $P$: $y-({py})={mp}\\left(x-({px})\\right)$; putting $x=0$ gives $y={ans}$."],
  },
  cm2_perpParam: {
    ko: ["두 직선 $l_1: {l1}$, $l_2: {l2}$가 서로 평행하거나 수직이 되도록 하는 모든 실수 $k$의 값의 합은? (단, 두 직선이 일치하는 경우는 평행으로 보지 않는다.) (숫자만 쓰세요)", ["두 직선 $ax+by+c=0$, $a'x+b'y+c'=0$은 $ab'-a'b=0$이면 평행(또는 일치), $aa'+bb'=0$이면 수직이에요.", "평행 조건은 $k$에 대한 이차방정식, 수직 조건은 일차방정식이 돼요. 각각 풀어 값을 모두 모아요."], "$l_1$의 $x$, $y$의 계수는 ${p}$, $k$이고 $l_2$의 계수는 $k{qs}$, ${rr}$입니다. 평행 조건: ${p}\\times({rr})=k(k{qs})$, 즉 ${eqPar}=0$에서 $k={k1}$ 또는 $k={k2}$이고 두 경우 모두 일치하지 않습니다. 수직 조건: ${p}(k{qs})+({rr})k=0$에서 $k={k3}$입니다. 따라서 합은 ${k1}+({k2})+({k3})={ans}$입니다."],
    en: ["Find the sum of all real values of $k$ for which the lines $l_1: {l1}$ and $l_2: {l2}$ are parallel or perpendicular (coincident lines do not count as parallel). (digits only)", ["Lines $ax+by+c=0$ and $a'x+b'y+c'=0$ are parallel (or coincident) when $ab'-a'b=0$ and perpendicular when $aa'+bb'=0$.", "The parallel condition is a quadratic in $k$, the perpendicular condition is linear. Solve each and collect all values."], "The coefficients of $x$, $y$ in $l_1$ are ${p}$, $k$ and in $l_2$ they are $k{qs}$, ${rr}$. Parallel: ${p}\\times({rr})=k(k{qs})$, i.e. ${eqPar}=0$, so $k={k1}$ or $k={k2}$ (neither makes the lines coincide). Perpendicular: ${p}(k{qs})+({rr})k=0$ gives $k={k3}$. The sum is ${k1}+({k2})+({k3})={ans}$."],
  },
  cm2_pointLineDist: {
    ko: ["점 $P({x0}, {y0})$와 직선 ${line}$ 사이의 거리는? " + FRAC, ["점 $(x_0,y_0)$과 직선 $ax+by+c=0$ 사이의 거리는 $\\frac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$예요.", "분자는 $|{a}\\times({x0})+({b})\\times({y0})+({c})|$를 계산하고, 분모는 $\\sqrt{({a})^2+({b})^2}$예요."], "$\\frac{|{a}\\times({x0})+({b})\\times({y0})+({c})|}{\\sqrt{({a})^2+({b})^2}}=\\frac{{N}}{{h}}={ans}$입니다."],
    en: ["What is the distance between the point $P({x0}, {y0})$ and the line ${line}$? " + FRAC_EN, ["The distance from $(x_0,y_0)$ to $ax+by+c=0$ is $\\frac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$.", "The numerator is $|{a}\\times({x0})+({b})\\times({y0})+({c})|$ and the denominator is $\\sqrt{({a})^2+({b})^2}$."], "$\\frac{|{a}\\times({x0})+({b})\\times({y0})+({c})|}{\\sqrt{({a})^2+({b})^2}}=\\frac{{N}}{{h}}={ans}$."],
  },
  cm2_circleGeneral: {
    ko: ["방정식 ${eq}$이 나타내는 도형은 원입니다. 이 원의 중심의 좌표를 $(a, b)$, 반지름의 길이를 $r$이라 할 때, $a+b+r$의 값은? (숫자만 쓰세요)", ["$x$와 $y$에 대한 완전제곱식 $(x-a)^2+(y-b)^2=r^2$ 꼴로 고쳐요.", "$x^2$, $y^2$의 계수로 양변을 나눈 뒤 $x$끼리, $y$끼리 묶어 완전제곱식을 만들어요."], "$x^2$의 계수 ${kk}$로 나누고 완전제곱식으로 고치면 ${std}$입니다. 중심은 $({cx}, {cy})$, 반지름은 ${rad}$이므로 $a+b+r={cx}+({cy})+{rad}={ans}$입니다."],
    en: ["The equation ${eq}$ represents a circle. If its center is $(a, b)$ and its radius is $r$, what is $a+b+r$? (digits only)", ["Rewrite it in the form $(x-a)^2+(y-b)^2=r^2$.", "Divide by the coefficient of $x^2$, then group the $x$ terms and the $y$ terms and complete the squares."], "Dividing by the coefficient ${kk}$ of $x^2$ and completing squares gives ${std}$. The center is $({cx}, {cy})$ and the radius is ${rad}$, so $a+b+r={cx}+({cy})+{rad}={ans}$."],
  },
  cm2_circleTangentAxes: {
    ko: ["중심이 제1사분면에 있고 $x$축과 $y$축에 동시에 접하면서 점 $P({p}, {q})$를 지나는 원은 모두 두 개입니다. 이 두 원 중 반지름의 길이가 큰 원의 반지름의 길이는? (숫자만 쓰세요)", ["제1사분면에서 두 축에 접하는 원의 중심은 $(r, r)$이고 반지름은 $r$이에요.", "원 $(x-r)^2+(y-r)^2=r^2$에 점의 좌표를 대입해 $r$에 대한 이차방정식을 풀어요."], "원의 방정식은 $(x-r)^2+(y-r)^2=r^2$ ($r>0$)이고 점 $P$를 지나므로 $({p}-r)^2+({q}-r)^2=r^2$, 즉 $r^2-{u}r+{t}=0$입니다. 이를 풀면 $r={rs}$ 또는 $r={rl}$이므로 큰 반지름은 ${ans}$입니다."],
    en: ["There are exactly two circles whose centers lie in the first quadrant, which are tangent to both the $x$-axis and the $y$-axis, and which pass through $P({p}, {q})$. What is the radius of the larger of the two circles? (digits only)", ["A circle in the first quadrant tangent to both axes has center $(r, r)$ and radius $r$.", "Substitute the point into $(x-r)^2+(y-r)^2=r^2$ and solve the quadratic in $r$."], "The circle is $(x-r)^2+(y-r)^2=r^2$ with $r>0$. Passing through $P$: $({p}-r)^2+({q}-r)^2=r^2$, i.e. $r^2-{u}r+{t}=0$, so $r={rs}$ or $r={rl}$. The larger radius is ${ans}$."],
  },
  cm2_lineCircleCount: {
    ko: ["원 $C$: ${circ}$, 직선 $l$: ${line}$. $C$와 $l$이 서로 다른 두 점에서 만나도록 하는 양의 정수 $k$의 개수는? (숫자만 쓰세요)", ["원의 중심과 직선 사이의 거리가 반지름보다 작으면 서로 다른 두 점에서 만나요.", "거리 $\\frac{|{u}\\times({cx})+({w})\\times({cy})-k|}{\\sqrt{({u})^2+({w})^2}}<{rad}$를 $k$에 대한 부등식으로 정리해요."], "중심 $({cx}, {cy})$에서 직선까지의 거리가 반지름 ${rad}$보다 작아야 하므로 $|{K0}-k|<{rad}\\sqrt{({u})^2+({w})^2}=\\sqrt{{R2}}$입니다. 이를 만족하는 정수는 ${lo}\\le k\\le {hi}$이고, 이 중 양의 정수의 개수는 ${ans}$입니다."],
    en: ["Circle $C$: ${circ}$, line $l$: ${line}$. For how many positive integers $k$ do $C$ and $l$ meet at two distinct points? (digits only)", ["The line meets the circle in two points exactly when the distance from the center to the line is less than the radius.", "Turn $\\frac{|{u}\\times({cx})+({w})\\times({cy})-k|}{\\sqrt{({u})^2+({w})^2}}<{rad}$ into an inequality in $k$."], "The distance from the center $({cx}, {cy})$ to the line must be less than the radius ${rad}$: $|{K0}-k|<{rad}\\sqrt{({u})^2+({w})^2}=\\sqrt{{R2}}$. The integers satisfying this are ${lo}\\le k\\le {hi}$, and the number of positive ones is ${ans}$."],
  },
  cm2_chordLength: {
    ko: ["원 $C$: ${circ}$, 직선 $l$: ${line}$. $l$이 $C$에서 잘라내는 현의 길이는? (숫자만 쓰세요)", ["원의 중심에서 직선에 내린 수선은 현을 수직이등분해요. 먼저 중심과 직선 사이의 거리를 구해요.", "반지름 $r$, 중심과 직선 사이의 거리 $d$이면 현의 길이는 $2\\sqrt{r^2-d^2}$예요."], "원의 중심은 $({cx}, {cy})$, 반지름은 ${rad}$입니다. 중심과 직선 사이의 거리는 $d=\\frac{|{la}\\times({cx})+({lb})\\times({cy})+({lc})|}{\\sqrt{({la})^2+({lb})^2}}=\\frac{{dh}}{{h}}={d}$이므로 현의 길이는 $2\\sqrt{{rad}^2-{d}^2}=2\\times{half}={ans}$입니다."],
    en: ["Circle $C$: ${circ}$, line $l$: ${line}$. What is the length of the chord that $l$ cuts from $C$? (digits only)", ["The perpendicular from the center to the line bisects the chord. First find the distance from the center to the line.", "With radius $r$ and center-to-line distance $d$, the chord length is $2\\sqrt{r^2-d^2}$."], "The center is $({cx}, {cy})$ and the radius is ${rad}$. The distance from the center to the line is $d=\\frac{|{la}\\times({cx})+({lb})\\times({cy})+({lc})|}{\\sqrt{({la})^2+({lb})^2}}=\\frac{{dh}}{{h}}={d}$, so the chord has length $2\\sqrt{{rad}^2-{d}^2}=2\\times{half}={ans}$."],
  },
  cm2_tangentAtPoint: {
    ko: ["원 ${circ}$ 위의 점 $({x1}, {y1})$에서의 접선이 점 $Q({t}, k)$를 지날 때, $k$의 값은? (숫자만 쓰세요)", ["원 위의 한 점에서의 접선은 그 점과 중심을 잇는 반지름에 수직이에요.", "접선의 방정식을 먼저 세운 뒤 점 $Q$의 좌표를 대입해요."], "접선의 방정식은 ${tang}$ 입니다. 점 $Q$를 지나므로 $x={t}$, $y=k$를 대입하면 $k={ans}$입니다."],
    en: ["The tangent line to the circle ${circ}$ at the point $({x1}, {y1})$ on the circle passes through the point $Q({t}, k)$. What is $k$? (digits only)", ["The tangent at a point of a circle is perpendicular to the radius to that point.", "Write the equation of the tangent first, then substitute the coordinates of $Q$."], "The tangent line is ${tang}$. It passes through $Q$, so putting $x={t}$, $y=k$ gives $k={ans}$."],
  },
  cm2_translateCurve: {
    ko: ["함수 $y={orig}$의 그래프를 $x$축의 방향으로 $m$만큼, $y$축의 방향으로 $n$만큼 평행이동하였더니 함수 $y={img}$의 그래프와 일치하였습니다. $m+n$의 값은? (숫자만 쓰세요)", ["$x$축의 방향으로 $m$만큼, $y$축의 방향으로 $n$만큼 평행이동하면 $x$ 대신 $x-m$, $y$ 대신 $y-n$을 대입해요.", "$y-n=f(x-m)$을 전개해 $x$의 계수를 먼저 비교하면 $m$을 알 수 있어요."], "평행이동한 식은 $y-n={shift}$입니다. 전개하여 $x$의 계수를 비교하면 ${b}-({tw})m={b2}$이므로 $m={m}$이고, 상수항을 비교하면 $n={n}$입니다. 따라서 $m+n={ans}$입니다."],
    en: ["The graph of $y={orig}$ is translated by $m$ in the direction of the $x$-axis and by $n$ in the direction of the $y$-axis, and then coincides with the graph of $y={img}$. What is $m+n$? (digits only)", ["A translation by $(m, n)$ replaces $x$ by $x-m$ and $y$ by $y-n$.", "Expand $y-n=f(x-m)$ and compare the coefficients of $x$ first to get $m$."], "The translated curve is $y-n={shift}$. Expanding and comparing the coefficients of $x$: ${b}-({tw})m={b2}$, so $m={m}$; comparing constant terms gives $n={n}$. Hence $m+n={ans}$."],
  },
  cm2_reflectPointChain: {
    ko: ["점 $P(a, b)$를 직선 $y=x$에 대하여 대칭이동한 점을 $Q$, 점 $Q$를 $y$축에 대하여 대칭이동한 점을 $R$, 점 $R$을 $x$축의 방향으로 ${m}$만큼, $y$축의 방향으로 ${n}$만큼 평행이동한 점을 $S$라 합니다. $S$의 좌표가 $({sx}, {sy})$일 때, $a+b$의 값은? (숫자만 쓰세요)", ["직선 $y=x$에 대한 대칭이동은 $(x,y)\\to(y,x)$, $y$축에 대한 대칭이동은 $(x,y)\\to(-x,y)$예요.", "$S$에서 거꾸로 한 단계씩 되돌려 가거나, $P(a,b)$에서 $S$까지의 좌표를 $a$, $b$로 나타내요."], "$a$, $b$로 나타내면 $Q(b, a)$, $R(-b, a)$, $S(-b+({m}), a+({n}))$입니다. $-b+({m})={sx}$에서 $b={pb}$, $a+({n})={sy}$에서 $a={pa}$이므로 $a+b={ans}$입니다."],
    en: ["Reflect $P(a, b)$ in the line $y=x$ to get $Q$, reflect $Q$ in the $y$-axis to get $R$, then translate $R$ by ${m}$ in the direction of the $x$-axis and by ${n}$ in the direction of the $y$-axis to get $S$. If $S=({sx}, {sy})$, what is $a+b$? (digits only)", ["Reflection in $y=x$ is $(x,y)\\to(y,x)$; reflection in the $y$-axis is $(x,y)\\to(-x,y)$.", "Work backwards from $S$ one step at a time, or write each image in terms of $a$ and $b$."], "In terms of $a$, $b$: $Q(b, a)$, $R(-b, a)$, $S(-b+({m}), a+({n}))$. From $-b+({m})={sx}$ we get $b={pb}$; from $a+({n})={sy}$ we get $a={pa}$. So $a+b={ans}$."],
  },
  cm2_reflectCurve: {
    ko: ["함수 $y={orig}$의 그래프를 원점에 대하여 대칭이동한 다음, $x$축의 방향으로 ${m}$만큼, $y$축의 방향으로 ${n}$만큼 평행이동한 포물선의 꼭짓점의 좌표를 $(s, t)$라 할 때, $s+t$의 값은? (숫자만 쓰세요)", ["원점에 대한 대칭이동은 $(x,y)\\to(-x,-y)$이므로 식에서 $x$를 $-x$로, $y$를 $-y$로 바꿔요.", "처음 포물선의 꼭짓점을 구해 두 이동을 차례로 적용해도 되고, 이동한 식을 직접 세워도 돼요."], "처음 포물선의 꼭짓점은 $({h}, {k})$입니다. 원점에 대하여 대칭이동하면 $y=-({orig2})$ 꼴의 포물선이 되고 꼭짓점은 $({nh}, {nk})$입니다. 이를 $x$축으로 ${m}$, $y$축으로 ${n}$만큼 평행이동하면 $(s, t)=({s}, {t})$이므로 $s+t={ans}$입니다."],
    en: ["The graph of $y={orig}$ is reflected in the origin and then translated by ${m}$ in the direction of the $x$-axis and by ${n}$ in the direction of the $y$-axis. If the vertex of the resulting parabola is $(s, t)$, what is $s+t$? (digits only)", ["Reflection in the origin is $(x,y)\\to(-x,-y)$: replace $x$ by $-x$ and $y$ by $-y$ in the equation.", "You may find the vertex of the original parabola and apply both moves in turn, or build the new equation directly."], "The original vertex is $({h}, {k})$. After the reflection in the origin the parabola is $y=-({orig2})$, with vertex $({nh}, {nk})$. Translating by ${m}$ along the $x$-axis and ${n}$ along the $y$-axis gives $(s, t)=({s}, {t})$, so $s+t={ans}$."],
  },
  cm2_reflectShortest: {
    ko: ["좌표평면 위의 점 $A({a1}, {a2})$, 점 $B({b1}, {b2})$ 그리고 $x$축 위를 움직이는 점 $P$에 대하여 $\\overline{A P}+\\overline{P B}$의 최솟값은? (숫자만 쓰세요)", ["두 점이 $x$축에 대하여 같은 쪽에 있으므로, 한 점을 $x$축에 대하여 대칭이동하면 $\\overline{A P}+\\overline{P B}$를 한 선분의 길이로 바꿀 수 있어요.", "$B$를 $x$축에 대하여 대칭이동한 점 $B'$을 잡으면 $\\overline{P B}=\\overline{PB'}$이고, $\\overline{A P}+\\overline{PB'}\\ge\\overline{AB'}$예요."], "$B$를 $x$축에 대하여 대칭이동한 점을 $B'({b1}, {nb2})$라 하면 $\\overline{P B}=\\overline{PB'}$이므로 $\\overline{A P}+\\overline{P B}\\ge\\overline{AB'}$이고, $A$와 $B'$은 $x$축의 반대쪽에 있어 선분 $AB'$이 $x$축과 만나므로 등호가 성립합니다. $\\overline{AB'}=\\sqrt{({b1}-({a1}))^2+({a2}-({nb2}))^2}=\\sqrt{{dx}^2+{ss}^2}={ans}$입니다."],
    en: ["For the points $A({a1}, {a2})$, $B({b1}, {b2})$ and a point $P$ moving on the $x$-axis, what is the minimum value of $\\overline{A P}+\\overline{P B}$? (digits only)", ["Both points are on the same side of the $x$-axis, so reflecting one of them in the $x$-axis turns $\\overline{A P}+\\overline{P B}$ into the length of a single path.", "Let $B'$ be the reflection of $B$ in the $x$-axis. Then $\\overline{P B}=\\overline{PB'}$ and $\\overline{A P}+\\overline{PB'}\\ge\\overline{AB'}$."], "Let $B'({b1}, {nb2})$ be the reflection of $B$ in the $x$-axis. Then $\\overline{P B}=\\overline{PB'}$, so $\\overline{A P}+\\overline{P B}\\ge\\overline{AB'}$; since $A$ and $B'$ are on opposite sides of the $x$-axis, segment $AB'$ meets the axis and equality is attained. $\\overline{AB'}=\\sqrt{({b1}-({a1}))^2+({a2}-({nb2}))^2}=\\sqrt{{dx}^2+{ss}^2}={ans}$."],
  },
  // ---------------- 집합과 명제 ----------------
  cm2_setSumCount: {
    ko: ["두 집합 $A=\\{{sa}\\}$, $B=\\{{sb}\\}$에 대하여 집합 $C=\\{x+y\\mid x\\in A,\\ y\\in B\\}$의 모든 원소의 합은? (숫자만 쓰세요)", ["$A$의 원소와 $B$의 원소를 하나씩 골라 더한 값을 모두 만들어 봐요.", "같은 값이 여러 번 나와도 집합의 원소는 한 번만 세요."], "가능한 합을 모두 구하면 서로 다른 값은 ${sc}$입니다. 집합은 같은 원소를 한 번만 쓰므로 원소의 합은 ${ans}$입니다."],
    en: ["For the sets $A=\\{{sa}\\}$ and $B=\\{{sb}\\}$, what is the sum of all elements of $C=\\{x+y\\mid x\\in A,\\ y\\in B\\}$? (digits only)", ["Form every sum of one element of $A$ and one element of $B$.", "A repeated value counts only once as an element of a set."], "The distinct sums are ${sc}$. Equal values are written once in a set, so the sum of the elements is ${ans}$."],
  },
  cm2_setOpSum: {
    ko: ["$U$는 1 이상 ${N}$ 이하의 자연수 전체의 집합이고, $A$는 $U$의 원소 중 ${da}$의 약수 전체의 집합, $B$는 $U$의 원소 중 ${mb}$의 배수 전체의 집합입니다. 집합 ${ex}$의 모든 원소의 합은? (숫자만 쓰세요)", ["$A$와 $B$를 원소나열법으로 먼저 나타내요.", "여집합 $X^c$은 $U$에서 $X$의 원소를 뺀 나머지예요. 괄호 안부터 차례로 계산해요."], "$A=\\{{As}\\}$, $B=\\{{Bs}\\}$이므로 ${ex}=\\{{Rs}\\}$이고 원소의 합은 ${ans}$입니다."],
    en: ["$U$ is the set of natural numbers from 1 to ${N}$, $A$ is the set of divisors of ${da}$ in $U$, and $B$ is the set of multiples of ${mb}$ in $U$. What is the sum of all elements of the set ${ex}$? (digits only)", ["Write $A$ and $B$ by listing their elements.", "The complement $X^c$ is everything in $U$ that is not in $X$. Work from the inside of the brackets outward."], "$A=\\{{As}\\}$ and $B=\\{{Bs}\\}$, so ${ex}=\\{{Rs}\\}$ and the sum of its elements is ${ans}$."],
  },
  cm2_vennReverse: {
    ko: ["전체집합 $U$의 두 부분집합 $A$, $B$에 대하여 $n(U)={nu}$, $n(A)={na}$, $n(B)={nb}$, $n((A\\cup B)^c)={nc}$입니다. $n(A^c\\cup B)$의 값은? (숫자만 쓰세요)", ["$n(A\\cup B)=n(U)-n((A\\cup B)^c)$로 합집합의 원소 수를 먼저 구해요.", "$A^c\\cup B=(A-B)^c$임을 이용하면 $n(A^c\\cup B)=n(U)-n(A-B)$예요."], "$n(A\\cup B)={nu}-{nc}={un}$이고 $n(A\\cap B)=n(A)+n(B)-n(A\\cup B)={na}+{nb}-{un}={ab}$입니다. $A^c\\cup B=(A-B)^c$이고 $n(A-B)={na}-{ab}$이므로 $n(A^c\\cup B)={nu}-({na}-{ab})={ans}$입니다."],
    en: ["For subsets $A$, $B$ of a universal set $U$, $n(U)={nu}$, $n(A)={na}$, $n(B)={nb}$ and $n((A\\cup B)^c)={nc}$. What is $n(A^c\\cup B)$? (digits only)", ["First get $n(A\\cup B)=n(U)-n((A\\cup B)^c)$.", "Use $A^c\\cup B=(A-B)^c$, so $n(A^c\\cup B)=n(U)-n(A-B)$."], "$n(A\\cup B)={nu}-{nc}={un}$ and $n(A\\cap B)=n(A)+n(B)-n(A\\cup B)={na}+{nb}-{un}={ab}$. Since $A^c\\cup B=(A-B)^c$ and $n(A-B)={na}-{ab}$, $n(A^c\\cup B)={nu}-({na}-{ab})={ans}$."],
  },
  cm2_inclusionParam: {
    ko: ["두 집합 $A=\\{x\\mid {Ac}\\}$, $C=\\{x\\mid {Cc}\\}$ ($x$는 실수)에 대하여 $A\\subset B\\subset C$를 만족하는 집합 $B=\\{x\\mid a\\le x\\le b\\}$ ($a$, $b$는 정수)의 개수는? ($A\\subset B$는 $A=B$인 경우도 포함한다.) (숫자만 쓰세요)", ["먼저 $A$와 $C$를 $\\alpha\\le x\\le\\beta$ 꼴의 구간으로 나타내요.", "$A\\subset B$이면 $a$는 $A$의 왼쪽 끝 이하, $b$는 $A$의 오른쪽 끝 이상이고, $B\\subset C$이면 $a$, $b$는 $C$의 구간 안에 있어야 해요. $a$와 $b$의 가능한 값을 각각 세어요."], "$A=\\{x\\mid {al}\\le x\\le {ar}\\}$, $C=\\{x\\mid {cl}\\le x\\le {cr}\\}$입니다. $A\\subset B\\subset C$이려면 ${cl}\\le a\\le {al}$, ${ar}\\le b\\le {cr}$이어야 하므로 $a$는 ${na}$개, $b$는 ${nb}$개이고 $B$의 개수는 ${na}\\times{nb}={ans}$입니다."],
    en: ["For $A=\\{x\\mid {Ac}\\}$ and $C=\\{x\\mid {Cc}\\}$ ($x$ real), how many sets $B=\\{x\\mid a\\le x\\le b\\}$ with integers $a$, $b$ satisfy $A\\subset B\\subset C$ ($A\\subset B$ allows $A=B$)? (digits only)", ["First write $A$ and $C$ as intervals $\\alpha\\le x\\le\\beta$.", "$A\\subset B$ means $a$ is at most the left end of $A$ and $b$ at least its right end; $B\\subset C$ keeps $a$ and $b$ inside the interval of $C$. Count the possible $a$ and $b$ separately."], "$A=\\{x\\mid {al}\\le x\\le {ar}\\}$ and $C=\\{x\\mid {cl}\\le x\\le {cr}\\}$. $A\\subset B\\subset C$ requires ${cl}\\le a\\le {al}$ and ${ar}\\le b\\le {cr}$, giving ${na}$ choices for $a$ and ${nb}$ for $b$: ${na}\\times{nb}={ans}$ sets."],
  },
  cm2_forallQuad: {
    ko: ["명제 '모든 실수 $x$에 대하여 ${form}>0$이다'가 참이 되도록 하는 정수 $k$의 최솟값은? (숫자만 쓰세요)", ["모든 실수 $x$에 대하여 이차식이 양수이려면 그래프가 아래로 볼록하고 $x$축과 만나지 않아야 해요.", "이차방정식 ${form}=0$의 판별식 $D$가 $D<0$이어야 해요."], "모든 실수 $x$에 대하여 성립하려면 판별식 $D=({b})^2-4\\times{a}\\times k<0$이어야 하므로 $k>{kv}$입니다. 이를 만족하는 가장 작은 정수는 ${ans}$입니다."],
    en: ["What is the smallest integer $k$ for which the statement 'for every real number $x$, ${form}>0$' is true? (digits only)", ["For a quadratic to be positive for all real $x$, its graph must open upward and not meet the $x$-axis.", "The discriminant $D$ of ${form}=0$ must satisfy $D<0$."], "The statement holds for all real $x$ exactly when $D=({b})^2-4\\times{a}\\times k<0$, i.e. $k>{kv}$. The smallest such integer is ${ans}$."],
  },
  cm2_existsInterval: {
    ko: ["$U$는 ${p}$ 이상 ${q}$ 이하의 정수 전체의 집합입니다. 명제 '$U$의 어떤 원소 $x$에 대하여 ${form}$이다'가 참이 되도록 하는 정수 $k$의 최댓값은? (숫자만 쓰세요)", ["'어떤 $x$에 대하여'는 조건을 만족하는 $x$가 하나라도 있으면 참이에요.", "부등식을 $k<g(x)$ 꼴로 바꾸고, $U$의 원소에서 $g(x)$가 가장 큰 값을 찾아요."], "${form}$은 $k<{gx}$ 꼴로 바꿀 수 있습니다. $U$의 원소 중 ${gx}$는 $x={xm}$일 때 최대 ${gm}$이고, $k<{gm}$이면 이 $x$에서 참이 됩니다. 따라서 정수 $k$의 최댓값은 ${ans}$입니다."],
    en: ["$U$ is the set of integers from ${p}$ to ${q}$. What is the largest integer $k$ for which the statement 'there is an element $x$ of $U$ with ${form}$' is true? (digits only)", ["'There exists $x$' is true as soon as one $x$ works.", "Rewrite the inequality as $k<g(x)$ and find the largest value of $g(x)$ over the elements of $U$."], "${form}$ is equivalent to $k<{gx}$. Over $U$ the maximum of ${gx}$ is ${gm}$, at $x={xm}$, and $k<{gm}$ makes the statement true there. So the largest integer $k$ is ${ans}$."],
  },
  cm2_contraRange: {
    ko: ["명제 '$x$가 실수일 때, ${quad}\\le 0$이면 $|{cx}|\\le a$이다'의 대우가 참이 되도록 하는 자연수 $a$의 최솟값은? (숫자만 쓰세요)", ["명제와 그 대우는 참, 거짓이 항상 같아요. 그래서 원래 명제가 참이 되는 조건을 찾아도 돼요.", "조건 $p$, $q$의 진리집합 $P$, $Q$에 대하여 $p\\to q$가 참이면 $P\\subset Q$예요."], "대우는 원래 명제와 참, 거짓이 같으므로 '${quad}\\le 0$이면 $|{cx}|\\le a$'가 참이어야 합니다. 진리집합은 $P=\\{x\\mid {m}\\le x\\le {n}\\}$, $Q=\\{x\\mid {c}-a\\le x\\le {c}+a\\}$이고 $P\\subset Q$이려면 $a\\ge {c}-({m})={d1}$, $a\\ge {n}-({c})={d2}$이어야 합니다. 따라서 $a$의 최솟값은 ${ans}$입니다."],
    en: ["For real $x$, find the smallest natural number $a$ for which the contrapositive of the statement 'if ${quad}\\le 0$ then $|{cx}|\\le a$' is true. (digits only)", ["A statement and its contrapositive are always both true or both false, so you may look for when the original statement is true.", "If $p\\to q$ is true, the truth set $P$ of $p$ is contained in the truth set $Q$ of $q$."], "The contrapositive has the same truth value as the original, so 'if ${quad}\\le 0$ then $|{cx}|\\le a$' must be true. The truth sets are $P=\\{x\\mid {m}\\le x\\le {n}\\}$ and $Q=\\{x\\mid {c}-a\\le x\\le {c}+a\\}$; $P\\subset Q$ needs $a\\ge {c}-({m})={d1}$ and $a\\ge {n}-({c})={d2}$. So the smallest $a$ is ${ans}$."],
  },
  cm2_converseRange: {
    ko: ["명제 '$x$가 실수일 때, ${quad}\\le 0$이면 $|{cx}|\\le a$이다'의 역이 참이 되도록 하는 자연수 $a$의 개수는? (숫자만 쓰세요)", ["명제 $p\\to q$의 역은 $q\\to p$예요.", "역이 참이려면 $q$의 진리집합이 $p$의 진리집합에 포함되어야 해요."], "역은 '$|{cx}|\\le a$이면 ${quad}\\le 0$'입니다. $Q=\\{x\\mid {c}-a\\le x\\le {c}+a\\}$, $P=\\{x\\mid {m}\\le x\\le {n}\\}$이고 $Q\\subset P$이려면 ${c}-a\\ge {m}$, ${c}+a\\le {n}$, 즉 $a\\le {d1}$, $a\\le {d2}$이어야 합니다. 이를 만족하는 자연수 $a$는 $1$부터 ${ans}$까지 ${ans}$개입니다."],
    en: ["For real $x$, how many natural numbers $a$ make the converse of the statement 'if ${quad}\\le 0$ then $|{cx}|\\le a$' true? (digits only)", ["The converse of $p\\to q$ is $q\\to p$.", "The converse is true when the truth set of $q$ is contained in the truth set of $p$."], "The converse is 'if $|{cx}|\\le a$ then ${quad}\\le 0$'. With $Q=\\{x\\mid {c}-a\\le x\\le {c}+a\\}$ and $P=\\{x\\mid {m}\\le x\\le {n}\\}$, $Q\\subset P$ needs ${c}-a\\ge {m}$ and ${c}+a\\le {n}$, i.e. $a\\le {d1}$ and $a\\le {d2}$. The natural numbers $a$ from $1$ to ${ans}$ work: ${ans}$ values."],
  },
  cm2_necessaryDiv: {
    ko: ["정수 $x$에 대한 두 조건 $p$: $x$는 $m$의 배수이다. $q$: $x$는 ${n}$의 배수이다. $p$가 $q$이기 위한 필요조건이지만 충분조건은 아닌 자연수 $m$의 개수는? (숫자만 쓰세요)", ["$p$가 $q$이기 위한 필요조건이면 $q\\Rightarrow p$예요. 진리집합으로는 $Q\\subset P$예요.", "${n}$의 배수가 모두 $m$의 배수이려면 $m$이 ${n}$의 약수여야 해요. 충분조건이 아니려면 $p\\Rightarrow q$가 성립하면 안 돼요."], "필요조건이므로 $q\\Rightarrow p$, 즉 ${n}$의 배수가 모두 $m$의 배수이어야 하고 이는 $m$이 ${n}$의 약수일 때입니다. 충분조건이 아니려면 $p\\Rightarrow q$가 거짓이어야 하는데, $m$이 ${n}$의 약수일 때 $p\\Rightarrow q$가 성립하는 것은 $m={n}$뿐입니다. ${n}$의 약수는 ${nd}$개이므로 구하는 $m$의 개수는 ${nd}-1={ans}$입니다."],
    en: ["For an integer $x$, consider $p$: '$x$ is a multiple of $m$' and $q$: '$x$ is a multiple of ${n}$'. How many natural numbers $m$ make $p$ a necessary but not sufficient condition for $q$? (digits only)", ["$p$ is necessary for $q$ means $q\\Rightarrow p$, i.e. the truth set satisfies $Q\\subset P$.", "Every multiple of ${n}$ is a multiple of $m$ only when $m$ divides ${n}$. Not sufficient means $p\\Rightarrow q$ must fail."], "Necessary means $q\\Rightarrow p$: every multiple of ${n}$ is a multiple of $m$, which holds exactly when $m$ divides ${n}$. Not sufficient means $p\\Rightarrow q$ is false; among divisors $m$ of ${n}$ it holds only for $m={n}$. ${n}$ has ${nd}$ divisors, so the count is ${nd}-1={ans}$."],
  },
  cm2_sufficientQuad: {
    ko: ["실수 $x$에 대한 두 조건 $p$: $x>a$, $q$: ${quad}>0$이 있습니다. $p$가 $q$이기 위한 충분조건이 되도록 하는 정수 $a$의 최솟값은? (숫자만 쓰세요)", ["$p$가 $q$이기 위한 충분조건이면 $p\\Rightarrow q$, 즉 $p$의 진리집합이 $q$의 진리집합에 포함돼요.", "먼저 이차부등식 ${quad}>0$을 풀어 $q$의 진리집합을 구해요."], "${quad}>0$의 해는 $x<{Rs}$ 또는 $x>{Rl}$입니다. $p$의 진리집합 $\\{x\\mid x>a\\}$가 이 집합에 포함되려면 $a\\ge {Rl}$이어야 합니다. 따라서 정수 $a$의 최솟값은 ${ans}$입니다."],
    en: ["For a real number $x$, let $p$: $x>a$ and $q$: ${quad}>0$. What is the smallest integer $a$ for which $p$ is a sufficient condition for $q$? (digits only)", ["$p$ sufficient for $q$ means $p\\Rightarrow q$, i.e. the truth set of $p$ is contained in that of $q$.", "First solve the quadratic inequality ${quad}>0$ to get the truth set of $q$."], "The solution of ${quad}>0$ is $x<{Rs}$ or $x>{Rl}$. The truth set $\\{x\\mid x>a\\}$ of $p$ lies inside it exactly when $a\\ge {Rl}$. So the smallest integer $a$ is ${ans}$."],
  },
  cm2_amgmMin: {
    ko: ["${dom}$일 때, ${ex}$의 최솟값은? (숫자만 쓰세요)", ["두 양수 $A$, $B$에 대하여 $A+B\\ge 2\\sqrt{A\\,B}$ (등호는 $A=B$일 때)예요.", "곱이 상수가 되도록 짝지어 산술평균과 기하평균의 관계를 쓰고, 등호가 성립하는 $x$가 조건 ${dom}$을 만족하는지 확인해요."], "${work}$이고, 등호는 $x={xe}$일 때 성립하며 이 값은 ${dom}$을 만족합니다. 따라서 최솟값은 ${ans}$입니다."],
    en: ["For ${dom}$, what is the minimum value of ${ex}$? (digits only)", ["For positive $A$, $B$: $A+B\\ge 2\\sqrt{A\\,B}$, with equality when $A=B$.", "Pair the terms so that their product is constant, apply AM-GM, and check that the equality point satisfies ${dom}$."], "${work}$, and equality holds at $x={xe}$, which satisfies ${dom}$. So the minimum is ${ans}$."],
  },
  // ---------------- 함수 ----------------
  cm2_funcInjective: {
    ko: ["집합 $X=\\{{xset}\\}$에서 집합 $Y=\\{{yset}\\}$로의 일대일함수 $f$ 중에서 $f(1)\\le {t}$이고 $f(2)\\ge {u}$인 것의 개수는? (숫자만 쓰세요)", ["일대일함수는 $X$의 서로 다른 원소에 서로 다른 함숫값을 대응시켜요. $f(1)$, $f(2)$를 먼저 정해요.", "$f(1)\\ne f(2)$인 $(f(1), f(2))$의 가짓수를 센 뒤, 나머지 원소의 함숫값을 정하는 방법의 수를 곱해요."], "$f(1)$은 ${t}$가지, $f(2)$는 ${n}-{u}+1$가지이고 $f(1)=f(2)$가 되는 경우가 ${ov}$가지이므로 $(f(1), f(2))$는 ${pairs}$가지입니다. 나머지 ${mr}$개의 원소는 남은 ${nr}$개의 값에 일대일로 대응시키므로 ${rest}$가지이고, 구하는 개수는 ${pairs}\\times{rest}={ans}$입니다."],
    en: ["How many one-to-one functions $f$ from $X=\\{{xset}\\}$ to $Y=\\{{yset}\\}$ satisfy $f(1)\\le {t}$ and $f(2)\\ge {u}$? (digits only)", ["A one-to-one function gives different elements of $X$ different values. Choose $f(1)$ and $f(2)$ first.", "Count the pairs $(f(1), f(2))$ with $f(1)\\ne f(2)$, then multiply by the number of ways to assign the remaining elements."], "$f(1)$ has ${t}$ choices and $f(2)$ has ${n}-{u}+1$ choices; ${ov}$ of the combinations have $f(1)=f(2)$, so there are ${pairs}$ valid pairs. The remaining ${mr}$ elements go one-to-one into the other ${nr}$ values in ${rest}$ ways, so the count is ${pairs}\\times{rest}={ans}$."],
  },
  cm2_funcMonotone: {
    ko: ["집합 $X=\\{{xset}\\}$에서 집합 $Y=\\{{yset}\\}$로의 함수 $f$ 중에서 ${chain}$이고 $f(1)\\ge {u}$이고 $f({m})\\le {w}$인 것의 개수는? (숫자만 쓰세요)", ["$f(1)<f(2)<\\cdots$이면 함숫값은 모두 다르고, 값을 정하면 크기 순서로 대응이 하나로 정해져요.", "함숫값이 될 수 있는 수는 ${u}$ 이상 ${w}$ 이하의 정수이고, 이 중 서로 다른 ${m}$개를 고르는 경우의 수예요."], "함숫값은 ${u}$ 이상 ${w}$ 이하의 정수 ${k}$개 중에서 서로 다른 ${m}$개를 고르면 됩니다. 고른 값을 작은 것부터 $f(1), f(2), \\dots$에 대응시키면 하나로 정해지므로 개수는 $_{{k}}\\mathrm{C}_{{m}}={ans}$입니다."],
    en: ["How many functions $f$ from $X=\\{{xset}\\}$ to $Y=\\{{yset}\\}$ satisfy ${chain}$, $f(1)\\ge {u}$ and $f({m})\\le {w}$? (digits only)", ["If $f(1)<f(2)<\\cdots$, all values are different and, once the values are chosen, the order of assignment is forced.", "The possible values are the integers from ${u}$ to ${w}$; choose ${m}$ distinct ones."], "The values are ${m}$ distinct integers chosen from the ${k}$ integers ${u},\\dots,{w}$. Assigning them in increasing order to $f(1), f(2), \\dots$ is forced, so the count is $_{{k}}\\mathrm{C}_{{m}}={ans}$."],
  },
  cm2_compFindG: {
    ko: ["두 함수 $f$, $g$에 대하여 $f(x)={f}$이고 합성함수 $(f\\circ g)(x)={comp}$일 때, $g({t})$의 값은? (숫자만 쓰세요)", ["$(f\\circ g)(x)=f(g(x))$이므로 $f$의 식의 $x$ 자리에 $g(x)$를 넣어요.", "$f(g(x))={comp}$에서 $g(x)$에 대한 식을 풀어 $g(x)$를 구한 뒤 $x={t}$를 대입해요."], "$f(g(x))={fg}={comp}$에서 $g(x)={gs}$입니다. 따라서 $g({t})={ans}$입니다."],
    en: ["For functions $f$ and $g$, $f(x)={f}$ and $(f\\circ g)(x)={comp}$. What is $g({t})$? (digits only)", ["$(f\\circ g)(x)=f(g(x))$: put $g(x)$ in the place of $x$ in $f$.", "Solve $f(g(x))={comp}$ for $g(x)$, then put $x={t}$."], "$f(g(x))={fg}={comp}$ gives $g(x)={gs}$. Hence $g({t})={ans}$."],
  },
  cm2_compTable: {
    ko: ["집합 $X=\\{{xset}\\}$에서 $X$로의 두 함수 $f$, $g$가 다음과 같습니다. $f$: ${ft}$, $g$: ${gt}$. $(f\\circ g)(x)=(g\\circ f)(x)$를 만족하는 $X$의 원소 $x$의 개수는? (숫자만 쓰세요)", ["$(f\\circ g)(x)=f(g(x))$, $(g\\circ f)(x)=g(f(x))$예요. 각 $x$마다 두 값을 따로 구해요.", "$x=1, 2, \\dots$에 대해 차례로 $f(g(x))$와 $g(f(x))$를 표로 만들어 비교해요."], "각 $x$에 대하여 $f(g(x))$, $g(f(x))$를 구하면 ${work}$입니다. 두 값이 같은 $x$는 ${ans}$개입니다."],
    en: ["Two functions $f$, $g$ from $X=\\{{xset}\\}$ to $X$ are given by $f$: ${ft}$, $g$: ${gt}$. How many elements $x$ of $X$ satisfy $(f\\circ g)(x)=(g\\circ f)(x)$? (digits only)", ["$(f\\circ g)(x)=f(g(x))$ and $(g\\circ f)(x)=g(f(x))$. Compute both values for each $x$.", "Make a table of $f(g(x))$ and $g(f(x))$ for $x=1, 2, \\dots$ and compare."], "For each $x$, the values of $f(g(x))$ and $g(f(x))$ are ${work}$. The number of $x$ where they agree is ${ans}$."],
  },
  cm2_inverseQuadDom: {
    ko: ["함수 $f(x)={fx}$ (${dom}$)의 역함수를 $g$라 할 때, $g({t})$의 값은? (숫자만 쓰세요)", ["정의역이 ${dom}$로 제한되어 있어서 $f$는 일대일대응이고 역함수가 있어요.", "$g({t})=x$이면 $f(x)={t}$예요. 이차방정식 $f(x)={t}$를 풀고 정의역에 맞는 해를 골라요."], "$f(x)={vf}$ 꼴로 고칠 수 있고 $f(x)={t}$에서 $({xp})^2={s2}$이므로 ${xp}=\\pm{s}$입니다. 정의역이 ${dom}$이므로 ${xp}={rt}$이고 $g({t})={ans}$입니다."],
    en: ["Let $g$ be the inverse function of $f(x)={fx}$ (${dom}$). What is $g({t})$? (digits only)", ["With the domain restricted to ${dom}$, $f$ is one-to-one onto its range, so it has an inverse.", "$g({t})=x$ means $f(x)={t}$. Solve the quadratic equation and pick the root that lies in the domain."], "Write $f(x)={vf}$. From $f(x)={t}$: $({xp})^2={s2}$, so ${xp}=\\pm{s}$. The domain is ${dom}$, hence ${xp}={rt}$ and $g({t})={ans}$."],
  },
  cm2_inverseRational: {
    ko: ["함수 $f(x)=\\frac{{num}}{{den}}$의 역함수를 $g$라 할 때, $g({k})$의 값은? (단, $f$의 정의역은 분모가 $0$이 아닌 실수 전체이다.) (숫자만 쓰세요)", ["$g({k})=x$이면 $f(x)={k}$예요.", "$\\frac{{num}}{{den}}={k}$의 양변에 분모를 곱해 $x$에 대한 일차방정식으로 풀어요."], "$g({k})=x$라 하면 $f(x)={k}$이므로 ${num}={k}\\times({den})$입니다. $x$에 대해 정리하면 $({coef})x={rhs}$이므로 $x={ans}$, 즉 $g({k})={ans}$입니다."],
    en: ["Let $g$ be the inverse function of $f(x)=\\frac{{num}}{{den}}$ (domain: all real $x$ with nonzero denominator). What is $g({k})$? (digits only)", ["$g({k})=x$ means $f(x)={k}$.", "Multiply both sides of $\\frac{{num}}{{den}}={k}$ by the denominator and solve the linear equation for $x$."], "Let $g({k})=x$. Then $f(x)={k}$, so ${num}={k}\\times({den})$. Collecting terms: $({coef})x={rhs}$, so $x={ans}$, i.e. $g({k})={ans}$."],
  },
  cm2_rationalAsym: {
    ko: ["유리함수 $y=\\frac{{num}}{{den}}$의 그래프의 두 점근선이 직선 $x=p$, $y=q$일 때, $p+q$의 값은? " + FRAC, ["분모가 $0$이 되는 $x$의 값이 세로 점근선이에요.", "$x$의 절댓값이 매우 커질 때 $y$가 가까워지는 값이 가로 점근선이에요. 분자와 분모의 $x$의 계수의 비예요."], "세로 점근선은 분모가 $0$이 되는 $x$의 값이므로 직선 $x={px}$입니다. $x\\to\\infty$일 때 $y\\to\\frac{{a}}{{c}}={qy}$이므로 가로 점근선은 $y={qy}$입니다. 따라서 $p+q={px}+{qy}={ans}$입니다."],
    en: ["The two asymptotes of the graph of $y=\\frac{{num}}{{den}}$ are the lines $x=p$ and $y=q$. What is $p+q$? " + FRAC_EN, ["The value of $x$ that makes the denominator $0$ gives the vertical asymptote.", "The value that $y$ approaches when $|x|$ is very large is the horizontal asymptote: the ratio of the $x$-coefficients."], "The denominator is $0$ at $x={px}$, so the vertical asymptote is the line $x={px}$. As $x\\to\\infty$, $y\\to\\frac{{a}}{{c}}={qy}$, the horizontal asymptote. So $p+q={px}+{qy}={ans}$."],
  },
  cm2_rationalParam: {
    ko: ["함수 $y=\\frac{k}{x}$ ($k$는 $0$이 아닌 상수)의 그래프를 $x$축의 방향으로 ${p}$만큼, $y$축의 방향으로 ${q}$만큼 평행이동한 그래프가 점 $P({x0}, {y0})$를 지납니다. 이 그래프가 $x$축과 만나는 점의 $x$좌표는? (숫자만 쓰세요)", ["평행이동하면 $x$ 대신 $x-({p})$, $y$ 대신 $y-({q})$를 넣어요.", "주어진 점의 좌표를 대입해 $k$를 구한 다음, $y=0$을 대입해요."], "평행이동한 그래프는 $y=\\frac{k}{x-({p})}+({q})$입니다. 점 $P$를 지나므로 ${y0}=\\frac{k}{{x0}-({p})}+({q})$에서 $k={kk}$입니다. $y=0$이면 $\\frac{{kk}}{x-({p})}=-({q})$이므로 $x={ans}$입니다."],
    en: ["The graph of $y=\\frac{k}{x}$ ($k$ a nonzero constant) is translated by ${p}$ in the direction of the $x$-axis and by ${q}$ in the direction of the $y$-axis, and the new graph passes through $P({x0}, {y0})$. What is the $x$-coordinate of the point where it meets the $x$-axis? (digits only)", ["A translation replaces $x$ by $x-({p})$ and $y$ by $y-({q})$.", "Substitute the given point to find $k$, then put $y=0$."], "The translated graph is $y=\\frac{k}{x-({p})}+({q})$. Through $P$: ${y0}=\\frac{k}{{x0}-({p})}+({q})$ gives $k={kk}$. Putting $y=0$: $\\frac{{kk}}{x-({p})}=-({q})$, so $x={ans}$."],
  },
  cm2_rationalIntersectCount: {
    ko: ["함수 $y={fr}$의 그래프와 직선 ${line}$의 교점이 2개가 되도록 하는 정수 $n$ 중 $-{N}\\le n\\le {N}$인 것의 개수는? (숫자만 쓰세요)", ["두 식을 연립해 $x$에 대한 이차방정식을 만들고, 서로 다른 두 실근을 가질 조건(판별식)을 생각해요.", "분모를 없애려고 $x$에 관한 식을 곱했으므로, 이차방정식의 근이 분모를 $0$으로 만들지 않는지도 확인해요."], "연립하면 $\\frac{{k}}{{den}}{qs}={mx}+n$에서 분모를 없애 정리한 이차방정식의 판별식은 $D=({nstr})^2{ds}$입니다. (근이 분모를 $0$으로 만들지 않습니다.) $D>0$이어야 하므로 이를 만족하지 않는 정수 $n$을 제외하면, 범위의 ${tot}$개 중 ${bad}$개가 제외되어 ${ans}$개입니다."],
    en: ["For how many integers $n$ with $-{N}\\le n\\le {N}$ do the graph of $y={fr}$ and the line ${line}$ have exactly two points in common? (digits only)", ["Combine the equations into a quadratic in $x$ and use the discriminant for two distinct real roots.", "You multiplied by an expression in $x$ to clear the denominator, so also check that no root makes the denominator $0$."], "From $\\frac{{k}}{{den}}{qs}={mx}+n$, clearing the denominator gives a quadratic with discriminant $D=({nstr})^2{ds}$ (no root makes the denominator $0$). We need $D>0$; among the ${tot}$ integers in the range, ${bad}$ fail, leaving ${ans}$."],
  },
  cm2_irrationalPass: {
    ko: ["무리함수 $y=\\sqrt{a({xp})}{qs}$ ($a$는 $0$이 아닌 상수)의 그래프가 점 $P({x0}, {y0})$를 지날 때, $a$의 값은? (숫자만 쓰세요)", ["점의 좌표를 식에 대입해요. 제곱근은 $0$ 이상이라는 점에 주의해요.", "근호만 남기고 양변을 제곱해서 $a$에 대한 일차방정식으로 풀어요."], "점 $P$를 대입하면 ${y0}=\\sqrt{a({x0}-({p}))}+({q})$이므로 $\\sqrt{a\\times({d})}={s}$입니다. 양변을 제곱하면 $a\\times({d})={s2}$이므로 $a={ans}$입니다."],
    en: ["The graph of the irrational function $y=\\sqrt{a({xp})}{qs}$ ($a$ a nonzero constant) passes through $P({x0}, {y0})$. What is $a$? (digits only)", ["Substitute the coordinates. Remember that a square root is never negative.", "Isolate the radical and square both sides to get a linear equation in $a$."], "Substituting $P$: ${y0}=\\sqrt{a({x0}-({p}))}+({q})$, so $\\sqrt{a\\times({d})}={s}$. Squaring: $a\\times({d})={s2}$, so $a={ans}$."],
  },
  cm2_irrationalMinMax: {
    ko: ["함수 $f(x)={fx}$의 ${lo}\\le x\\le {hi}$에서의 최댓값은? (숫자만 쓰세요)", ["근호 안의 식이 일차식이라 $x$가 커질 때 $f(x)$는 한 방향으로만 변해요. 그래서 구간의 양 끝에서 값을 비교하면 돼요.", "$x={lo}$와 $x={hi}$를 각각 대입해 큰 쪽을 골라요."], "$f({lo})=\\sqrt{{rl}}+({c})={flo}$, $f({hi})=\\sqrt{{rh}}+({c})={fhi}$입니다. 이 구간에서 $f$는 증가하거나 감소하기만 하므로 두 값 중 큰 값이 최댓값이고 ${ans}$입니다."],
    en: ["What is the maximum value of $f(x)={fx}$ on ${lo}\\le x\\le {hi}$? (digits only)", ["The radicand is linear, so $f(x)$ moves in only one direction as $x$ increases; compare the values at the two ends of the interval.", "Substitute $x={lo}$ and $x={hi}$ and take the larger value."], "$f({lo})=\\sqrt{{rl}}+({c})={flo}$ and $f({hi})=\\sqrt{{rh}}+({c})={fhi}$. On this interval $f$ is either increasing or decreasing, so the larger of the two is the maximum, ${ans}$."],
  },
  cm2_irrLineCount: {
    ko: ["곡선 $y=\\sqrt{{fr}}$ 및 직선 $y=x+k$의 교점이 2개가 되도록 하는 정수 $k$의 개수는? (숫자만 쓰세요)", ["$t=\\sqrt{{fr}}$로 놓으면 $t\\ge 0$이고 $x$를 $t$로 나타낼 수 있어요. 교점의 개수는 $t$에 대한 이차방정식의 서로 다른 음이 아닌 실근의 개수와 같아요.", "$t$에 대한 이차방정식이 서로 다른 두 음이 아닌 실근을 가질 조건은 $D>0$, (두 근의 합)$\\ge 0$, (두 근의 곱)$\\ge 0$이에요."], "$t=\\sqrt{{fr}}\\ (t\\ge 0)$로 놓으면 $x=\\frac{t^2-({b})}{{a}}$이고 $t=x+k$에서 $t^2-{a}t+({a}k-({b}))=0$입니다. 서로 다른 두 음이 아닌 실근을 가지려면 $D={a}^2-4({a}k-({b}))>0$이고 곱 ${a}k-({b})\\ge 0$ (합 ${a}>0$)이므로 ${lt}\\le k<{ht}$입니다. 이를 만족하는 정수 $k$는 ${lo}$부터 ${hi}$까지 ${ans}$개입니다."],
    en: ["For how many integers $k$ do the curve $y=\\sqrt{{fr}}$ and the line $y=x+k$ have exactly two points in common? (digits only)", ["Let $t=\\sqrt{{fr}}\\ge 0$ and express $x$ through $t$. The number of intersections equals the number of distinct non-negative real roots of a quadratic in $t$.", "A quadratic has two distinct non-negative roots when $D>0$, (sum of roots) $\\ge 0$ and (product of roots) $\\ge 0$."], "Put $t=\\sqrt{{fr}}\\ (t\\ge 0)$, so $x=\\frac{t^2-({b})}{{a}}$, and $t=x+k$ gives $t^2-{a}t+({a}k-({b}))=0$. Two distinct non-negative roots need $D={a}^2-4({a}k-({b}))>0$ and product ${a}k-({b})\\ge 0$ (the sum ${a}$ is positive), i.e. ${lt}\\le k<{ht}$. The integers $k$ from ${lo}$ to ${hi}$ work: ${ans}$ of them."],
  },
};

// ---------------- generators ----------------
const TRIPLES = [[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5], [15, 9, 12], [15, 12, 9], [17, 8, 15], [17, 15, 8], [20, 12, 16], [20, 16, 12], [25, 7, 24], [25, 15, 20], [25, 20, 15]]; // [r, d, half]
const CIRC_PTS = {};
for (const R of [5, 10, 13, 15, 17, 20, 25]) { CIRC_PTS[R] = []; for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) if (x * x + y * y === R * R && x !== 0 && y !== 0) CIRC_PTS[R].push([x, y]); }
const SHORT = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [8, 15, 17], [15, 8, 17], [12, 16, 20], [16, 12, 20], [15, 20, 25], [20, 15, 25], [7, 24, 25], [24, 7, 25], [18, 24, 30], [20, 21, 29], [21, 20, 29]]; // [dx, s, hyp]

export const GEN = {
  cm2_divPoint: (r, lvl) => find(() => {
    const mx = lvl === 1 ? 3 : 5, m = r.int(1, mx), n = r.int(1, mx);
    if (m === n) return null;
    const s = m + n, st = s / gcd(m, s), dx = st * r.int(-3, 3), dy = st * r.int(-3, 3);
    if (dx === 0 && dy === 0) return null;
    const lo = lvl === 1 ? 0 : -9, x1 = r.int(lo, 9), y1 = r.int(lo, 9), x2 = x1 + dx, y2 = y1 + dy;
    if (lvl === 1 && (x2 < 0 || y2 < 0)) return null;
    if (Math.abs(x2) > 15 || Math.abs(y2) > 15) return null;
    const px = x1 + (m * dx) / s, py = y1 + (m * dy) / s;
    return { v: { x1, y1, x2, y2, m, n, px, py }, ans: px + py };
  }),
  cm2_divRatioFind: (r, lvl) => find(() => {
    const mx = lvl === 1 ? 4 : 8, m = r.int(1, mx), n = r.int(1, mx);
    if (m === n || gcd(m, n) !== 1) return null;
    const s = m + n, t1 = r.nonzero(-2, 2), t2 = r.int(-2, 2);
    const lo = lvl === 1 ? 0 : -8, x1 = r.int(lo, 8), y1 = r.int(lo, 8);
    const x2 = x1 + s * t1, y2 = y1 + s * t2, px = x1 + m * t1, py = y1 + m * t2;
    if (Math.abs(x2) > 20 || Math.abs(y2) > 20) return null;
    return { v: { x1, y1, x2, y2, px, py, m, n, u: m * Math.abs(t1), w: n * Math.abs(t1) }, ans: m + n };
  }),
  cm2_lineThroughPerp: (r, lvl) => find(() => {
    const t = r.nonzero(-3, 3), py = r.int(-6, 6);
    if (lvl === 1) {
      const m0 = r.pick([1, -1, 2, -2, 3, -3, 4, -4, 5]), n0 = r.int(-6, 6), px = m0 * t;
      return { v: { line: `y=${lin(m0, n0)}`, px, py, ms: String(m0), mp: tfrac(-1, m0) }, ans: py + t };
    }
    const a = r.nonzero(-5, 5), b = r.nonzero(-5, 5), c = r.int(-9, 9), px = a * t;
    const ans = py - b * t;
    if (Math.abs(ans) > 40) return null;
    return { v: { line: lineEq(a, b, c), px, py, ms: tfrac(-a, b), mp: tfrac(b, a) }, ans };
  }),
  cm2_perpParam: (r, lvl) => find(() => {
    const R = lvl === 1 ? 5 : 9, k1 = r.nonzero(-R, R), k2 = r.nonzero(-R, R);
    if (k1 === k2 || k1 + k2 === 0) return null;
    const q = -(k1 + k2), pr = -k1 * k2, ds = [];
    for (let d = 1; d <= Math.abs(pr); d++) if (pr % d === 0) ds.push(d, -d);
    const p = r.pick(ds), rr = pr / p;
    if (Math.abs(p) > 6 || Math.abs(rr) > 6 || p + rr === 0) return null;
    if ((-p * q) % (p + rr) !== 0) return null;
    const k3 = (-p * q) / (p + rr);
    if (k3 === k1 || k3 === k2) return null;
    const c1 = r.nonzero(-6, 6), c2 = r.nonzero(-6, 6);
    for (const k of [k1, k2]) if (p * c2 - (k + q) * c1 === 0) return null;
    const l1 = `${cf(p)}x+ky${sg(c1)}=0`, l2 = `(k${sg(q)})x${tm(rr, "y")}${sg(c2)}=0`;
    return { v: { l1, l2, p, qs: sg(q), rr, eqPar: poly([1, q, -p * rr], "k"), k1, k2, k3 }, ans: k1 + k2 + k3 };
  }),
  cm2_pointLineDist: (r, lvl) => find(() => {
    const [p0, q0, h] = r.pick(lvl === 1 ? NORMALS.slice(0, 2) : NORMALS.slice(0, 4));
    const a = r.pick([1, -1]) * p0, b = r.pick([1, -1]) * q0, R = lvl === 1 ? 5 : 9;
    const x0 = r.int(-R, R), y0 = r.int(-R, R), c = r.int(-3 * R, 3 * R), N = Math.abs(a * x0 + b * y0 + c);
    if (N === 0) return null;
    return { v: { x0, y0, line: lineEq(a, b, c), a, b, c, h, N }, ans: N / h };
  }),
  cm2_circleGeneral: (r, lvl) => find(() => {
    const kk = lvl === 1 ? 1 : r.pick([2, 3, 4]), R = lvl === 1 ? 7 : 9;
    const cx = r.int(-R, R), cy = r.int(-R, R), rad = r.int(1, lvl === 1 ? 8 : 10);
    if (lvl === 2 && cx === 0 && cy === 0) return null;
    return { v: { eq: circGen(cx, cy, rad, kk), kk, std: circStd(cx, cy, rad), cx, cy, rad }, ans: cx + cy + rad };
  }),
  cm2_circleTangentAxes: (r, lvl) => find(() => {
    const hi = lvl === 1 ? 12 : 28, lo = lvl === 1 ? 1 : 13, p = r.int(lo, hi), q = r.int(1, hi);
    if (lvl === 2 && Math.max(p, q) < 13) return null;
    const s2 = 2 * p * q;
    if (!isSq(s2)) return null;
    const s = Math.round(Math.sqrt(s2));
    return { v: { p, q, u: 2 * (p + q), t: p * p + q * q, rs: p + q - s, rl: p + q + s }, ans: p + q + s };
  }),
  cm2_lineCircleCount: (r, lvl) => find(() => {
    const [u, w] = r.pick([[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [1, -1], [1, -2], [2, -1], [1, -3], [3, -1], [2, 3], [3, 2], [2, -3], [3, -2]]);
    const R = lvl === 1 ? 3 : 6, cx = r.int(-R, R), cy = r.int(-R, R), rad = r.int(lvl === 1 ? 1 : 2, lvl === 1 ? 3 : 6);
    const K0 = u * cx + w * cy, R2 = rad * rad * (u * u + w * w);
    let lo = null, hi = null;
    for (let k = K0 - 60; k <= K0 + 60; k++) if ((K0 - k) ** 2 < R2) { if (lo === null) lo = k; hi = k; }
    const cnt = Math.max(0, hi - Math.max(lo, 1) + 1);
    if (cnt < 1) return null;
    return { v: { circ: circStd(cx, cy, rad), line: `${cf(u)}x${w < 0 ? "-" : "+"}${Math.abs(w) === 1 ? "" : Math.abs(w)}y=k`, cx, cy, rad, u, w, K0, R2, lo, hi }, ans: cnt };
  }),
  cm2_chordLength: (r, lvl) => find(() => {
    const [rad, d, half] = r.pick(TRIPLES), [p0, q0, h] = r.pick(NORMALS);
    const la = r.pick([1, -1]) * p0, lb = r.pick([1, -1]) * q0, cx = r.int(-5, 5), cy = r.int(-5, 5), sgm = r.pick([1, -1]);
    const lc = sgm * d * h - (la * cx + lb * cy);
    return { v: { circ: lvl === 1 ? circStd(cx, cy, rad) : circGen(cx, cy, rad), line: lineEq(la, lb, lc), cx, cy, rad, la, lb, lc, dh: d * h, h, d, half }, ans: 2 * half };
  }),
  cm2_tangentAtPoint: (r, lvl) => find(() => {
    const R = r.pick(lvl === 1 ? [5, 10, 13, 15, 17, 20, 25] : [5, 10, 13, 17, 25]), [dx, dy] = r.pick(CIRC_PTS[R]);
    const cx = lvl === 1 ? 0 : r.nonzero(-5, 5), cy = lvl === 1 ? 0 : r.nonzero(-5, 5), t = r.int(-10, 10);
    const lc = -(dx * cx + dy * cy + R * R), num = -(lc + dx * t);
    if (num % dy !== 0) return null;
    const ans = num / dy;
    if (Math.abs(ans) > 45) return null;
    return { v: { circ: lvl === 1 ? `x^2+y^2=${R * R}` : circStd(cx, cy, R), x1: cx + dx, y1: cy + dy, t, tang: lineEq(dx, dy, lc) }, ans };
  }),
  cm2_translateCurve: (r, lvl) => find(() => {
    const A = lvl === 1 ? r.pick([1, -1]) : r.pick([1, 2, 3, -1, -2]), b = r.int(-6, 6), c0 = r.int(-6, 6), m = r.nonzero(-5, 5), n = r.nonzero(-6, 6);
    const b2 = b - 2 * A * m, c2 = c0 - b * m + A * m * m + n;
    return { v: { orig: poly([A, b, c0]), img: poly([A, b2, c2]), shift: poly([A, b, c0], "(x-m)"), tw: 2 * A, b, b2, m, n }, ans: m + n };
  }),
  cm2_reflectPointChain: (r) => find(() => {
    const pa = r.int(-8, 8), pb = r.int(-8, 8), m = r.nonzero(-5, 5), n = r.nonzero(-5, 5);
    return { v: { m, n, sx: m - pb, sy: pa + n, pa, pb }, ans: pa + pb };
  }),
  cm2_reflectCurve: (r, lvl) => find(() => {
    const A = lvl === 1 ? r.pick([1, -1]) : r.pick([2, 3, -2, -3]), h = r.int(-4, 4), k = r.int(-4, 4), m = r.nonzero(-5, 5), n = r.nonzero(-5, 5);
    const b = -2 * A * h, c0 = A * h * h + k, s = -h + m, t = -k + n;
    return { v: { orig: poly([A, b, c0]), orig2: poly([A, -b, c0]), m, n, h, k, nh: -h, nk: -k, s, t }, ans: s + t };
  }),
  cm2_reflectShortest: (r, lvl) => find(() => {
    const [dx, s, hyp] = r.pick(lvl === 1 ? SHORT.slice(0, 8) : SHORT), sig = lvl === 1 ? 1 : r.pick([1, -1]);
    const u = r.int(1, s - 1), a1 = r.int(-6, 6), b1 = a1 + r.pick([1, -1]) * dx, a2 = sig * u, b2 = sig * (s - u);
    return { v: { a1, a2, b1, b2, nb2: -b2, dx, ss: s }, ans: hyp };
  }),
  cm2_setSumCount: (r, lvl) => find(() => {
    const pickSet = (k, lo, hi) => { const S = new Set(); while (S.size < k) S.add(r.int(lo, hi)); return [...S].sort((x, y) => x - y); };
    const A = lvl === 1 ? pickSet(3, 1, 8) : pickSet(4, -2, 9), B = lvl === 1 ? pickSet(3, 1, 8) : pickSet(3, -2, 9);
    const S = new Set(); for (const x of A) for (const y of B) S.add(x + y);
    if (S.size >= A.length * B.length) return null;
    const sc = [...S].sort((x, y) => x - y);
    return { v: { sa: A.join(", "), sb: B.join(", "), sc: sc.join(", ") }, ans: sc.reduce((x, y) => x + y, 0) };
  }),
  cm2_setOpSum: (r, lvl) => find(() => {
    const N = lvl === 1 ? r.int(10, 20) : r.int(20, 36), da = r.int(8, N), mb = r.int(2, 7);
    const U = Array.from({ length: N }, (_, i) => i + 1), A = U.filter((x) => da % x === 0), B = U.filter((x) => x % mb === 0);
    if (A.length < 4) return null;
    const inA = (x) => A.includes(x), inB = (x) => B.includes(x);
    const OPS1 = [["A\\cap B", (x) => inA(x) && inB(x)], ["A\\cup B", (x) => inA(x) || inB(x)], ["A-B", (x) => inA(x) && !inB(x)], ["B-A", (x) => inB(x) && !inA(x)], ["A^c\\cap B", (x) => !inA(x) && inB(x)], ["A\\cap B^c", (x) => inA(x) && !inB(x)]];
    const OPS2 = [["(A\\cup B)^c", (x) => !(inA(x) || inB(x))], ["(A\\cap B)^c", (x) => !(inA(x) && inB(x))], ["A^c\\cup B", (x) => !inA(x) || inB(x)], ["(A-B)\\cup(B-A)", (x) => inA(x) !== inB(x)], ["A^c\\cap B^c", (x) => !inA(x) && !inB(x)], ["(A\\cup B)-(A\\cap B)", (x) => inA(x) !== inB(x)]];
    const [ex, f] = r.pick(lvl === 1 ? OPS1 : OPS2), R = U.filter(f);
    if (R.length === 0 || R.length > 24) return null;
    return { v: { N, da, mb, ex, As: A.join(", "), Bs: B.join(", "), Rs: R.join(", ") }, ans: R.reduce((x, y) => x + y, 0) };
  }),
  cm2_vennReverse: (r, lvl) => find(() => {
    const M = lvl === 1 ? 8 : 25, ab = r.int(1, M), oa = r.int(1, M), ob = r.int(1, M), nc = r.int(1, M);
    const na = ab + oa, nb = ab + ob, un = na + nb - ab, nu = un + nc;
    return { v: { nu, na, nb, nc, un, ab }, ans: nu - oa };
  }),
  cm2_inclusionParam: (r, lvl) => find(() => {
    const cl = r.int(-6, 2), al = cl + r.int(1, 5), ar = al + r.int(1, 5), cr = ar + r.int(1, 5);
    if (lvl === 1) return { v: { Ac: `${al}\\le x\\le ${ar}`, Cc: `${cl}\\le x\\le ${cr}`, al, ar, cl, cr, na: al - cl + 1, nb: cr - ar + 1 }, ans: (al - cl + 1) * (cr - ar + 1) };
    if ((cl + cr) % 2 !== 0) return null;
    const c0 = (cl + cr) / 2, d = (cr - cl) / 2;
    return { v: { Ac: `${poly([1, -(al + ar), al * ar])}\\le 0`, Cc: `|${xs(c0)}|\\le ${d}`, al, ar, cl, cr, na: al - cl + 1, nb: cr - ar + 1 }, ans: (al - cl + 1) * (cr - ar + 1) };
  }),
  cm2_forallQuad: (r, lvl) => find(() => {
    const a = lvl === 1 ? 1 : r.pick([2, 3]), b = r.nonzero(lvl === 1 ? -9 : -12, lvl === 1 ? 9 : 12);
    const kmin = Math.floor((b * b) / (4 * a)) + 1;
    return { v: { a, b, form: `${cf(a)}x^2${tm(b, "x")}+k`, kv: tfrac(b * b, 4 * a) }, ans: kmin };
  }),
  cm2_existsInterval: (r, lvl) => find(() => {
    const p = r.int(-3, 3), q = p + r.int(lvl === 1 ? 3 : 5, lvl === 1 ? 6 : 9), b = r.nonzero(-8, 8);
    let best = null, xm = null;
    for (let x = p; x <= q; x++) { const g = b * x - x * x; if (best === null || g > best) { best = g; xm = x; } }
    return { v: { p, q, form: `x^2${tm(-b, "x")}+k<0`, gx: expr([[b, "x"], [-1, "x^2"]]), xm, gm: best }, ans: best - 1 };
  }),
  cm2_contraRange: (r, lvl) => find(() => {
    const R = lvl === 1 ? 5 : 9, m = r.int(-R, R - 1), n = m + r.int(1, lvl === 1 ? 6 : 10), c = r.int(-R, R + 3);
    return { v: { quad: poly([1, -(m + n), m * n]), c, cx: xs(c), m, n, d1: c - m, d2: n - c }, ans: Math.max(c - m, n - c) };
  }),
  cm2_converseRange: (r, lvl) => find(() => {
    const R = lvl === 1 ? 5 : 9, m = r.int(-R, R - 3), n = m + r.int(3, lvl === 1 ? 10 : 22), c = r.int(m + 1, n - 1), ans = Math.min(c - m, n - c);
    if (ans < 1) return null;
    return { v: { quad: poly([1, -(m + n), m * n]), c, cx: xs(c), m, n, d1: c - m, d2: n - c }, ans };
  }),
  cm2_necessaryDiv: (r, lvl) => find(() => {
    const n = lvl === 1 ? r.int(4, 30) : r.int(31, 96);
    if (divisors(n).length < 3) return null;
    return { v: { n, nd: divisors(n).length }, ans: divisors(n).length - 1 };
  }),
  cm2_sufficientQuad: (r, lvl) => find(() => {
    if (lvl === 1) {
      const r1 = r.int(-5, 5), r2 = r1 + r.int(1, 6);
      return { v: { quad: poly([1, -(r1 + r2), r1 * r2]), Rs: String(r1), Rl: String(r2) }, ans: r2 };
    }
    const u = r.pick([2, 3]), v1 = r.nonzero(-9, 9), rr = r.int(-4, 4);
    if (v1 === rr * u) return null;
    const big = v1 > rr * u ? tfrac(v1, u) : String(rr), small = v1 > rr * u ? String(rr) : tfrac(v1, u);
    return { v: { quad: poly([u, -(v1 + u * rr), v1 * rr]), Rs: small, Rl: big }, ans: Math.ceil(Math.max(v1 / u, rr)) };
  }),
  cm2_amgmMin: (r, lvl) => find(() => {
    if (lvl === 1) {
      const p = r.int(1, 9), q = r.int(1, 16), pq = p * q;
      if (!isSq(pq)) return null;
      const s = Math.round(Math.sqrt(pq)), ex = `${cf(p)}x+\\frac{${q}}{x}`;
      return { v: { dom: "x>0", ex, work: `${ex}\\ge 2\\sqrt{ ${cf(p)}x\\cdot\\frac{${q}}{x} }=2\\sqrt{ ${pq} }=${2 * s}`, xe: tfrac(s, p) }, ans: 2 * s };
    }
    if (lvl === 2) {
      const p = r.int(1, 4), q = r.int(1, 16), c = r.nonzero(-5, 5), pq = p * q;
      if (!isSq(pq)) return null;
      const s = Math.round(Math.sqrt(pq)), X = xs(c), ex = `${cf(p)}x+\\frac{${q}}{${X}}`, ans = p * c + 2 * s;
      return { v: { dom: `x>${c}`, ex, work: `${ex}=\\left[${cf(p)}(${X})+\\frac{${q}}{${X}}\\right]${sg(p * c)}\\ge 2\\sqrt{ ${pq} }${sg(p * c)}=${ans}`, xe: tfrac(p * c + s, p) }, ans };
    }
    const p = r.int(1, 4), q = r.int(1, 6), rr = r.int(1, 6), s2 = r.int(1, 4), pst = p * s2, qr = q * rr, prod = pst * qr;
    if (!isSq(prod)) return null;
    const S = Math.round(Math.sqrt(prod)), ans = p * rr + q * s2 + 2 * S, ex = `\\left(${cf(p)}x+${q}\\right)\\left(\\frac{${rr}}{x}+${s2}\\right)`;
    return { v: { dom: "x>0", ex, work: `${ex}=${p * rr + q * s2}+${cf(pst)}x+\\frac{${qr}}{x}\\ge ${p * rr + q * s2}+2\\sqrt{ ${prod} }=${ans}`, xe: tfrac(S, pst) }, ans };
  }),
  cm2_funcInjective: (r, lvl) => find(() => {
    const m = lvl === 1 ? 3 : 4, n = lvl === 1 ? r.int(5, 7) : r.int(6, 8), t = r.int(2, n - 1), u = r.int(2, n - 1);
    const ov = Math.max(0, t - u + 1), pairs = t * (n - u + 1) - ov;
    if (pairs <= 0) return null;
    const rest = P(n - 2, m - 2);
    return { v: { m, n, xset: setTxt(m), yset: setTxt(n), t, u, ov, pairs, mr: m - 2, nr: n - 2, rest }, ans: pairs * rest };
  }),
  cm2_funcMonotone: (r, lvl) => find(() => {
    const m = lvl === 1 ? 3 : 4, u = r.int(2, 3), n = r.int(u + m + 1, 9), w = r.int(u + m, n), k = w - u + 1;
    return { v: { m, n, xset: setTxt(m), yset: setTxt(n), chain: Array.from({ length: m }, (_, i) => `f(${i + 1})`).join("<"), u, w, k }, ans: C(k, m) };
  }),
  cm2_compFindG: (r, lvl) => find(() => {
    const p = r.pick([2, 3, 4, 5, -2, -3, -4]), q = r.int(-6, 6), t = r.int(-3, 3);
    const gco = lvl === 1 ? [r.nonzero(-4, 4), r.int(-6, 6)] : [r.nonzero(-3, 3), r.int(-4, 4), r.int(-5, 5)];
    const comp = gco.map((c, i) => (i === gco.length - 1 ? p * c + q : p * c));
    const gs = poly(gco), g = gco.reduce((s, c) => s * t + c, 0);
    return { v: { f: lin(p, q), comp: poly(comp), t, fg: `${cf(p)}(${gs})${q === 0 ? "" : sg(q)}`, gs }, ans: g };
  }),
  cm2_compTable: (r, lvl) => find(() => {
    const n = lvl === 1 ? 4 : r.pick([5, 6, 7]), mk = () => Array.from({ length: n }, () => r.int(1, n));
    const f = mk(), g = mk(), ws = [];
    let cnt = 0;
    for (let x = 1; x <= n; x++) { const a = f[g[x - 1] - 1], b = g[f[x - 1] - 1]; if (a === b) cnt++; ws.push(`x=${x}:\\ ${a},\\ ${b}`); }
    if (cnt < 1 || cnt > n - 1) return null;
    const tb = (h) => h.map((y, i) => `${i + 1}\\to ${y}`).join(",\\ ");
    return { v: { n, xset: setTxt(n), ft: tb(f), gt: tb(g), work: ws.join(";\\ ") }, ans: cnt };
  }),
  cm2_inverseQuadDom: (r, lvl) => find(() => {
    const a = lvl === 1 ? 1 : r.pick([1, 2, 3]), p = r.int(-4, 5), q2 = r.int(-5, 5), s = r.int(1, 6), up = lvl === 1 ? true : r.pick([true, false]);
    const t = q2 + a * s * s, rt = up ? s : -s;
    return { v: { fx: poly([a, -2 * a * p, a * p * p + q2]), dom: `x\\${up ? "ge" : "le"} ${p}`, t, vf: `${cf(a)}(${xs(p)})^2${q2 === 0 ? "" : sg(q2)}`, xp: xs(p), s2: s * s, s, rt }, ans: p + rt };
  }),
  cm2_inverseRational: (r, lvl) => find(() => {
    const c = lvl === 1 ? 1 : r.pick([2, 3, -1, -2]), a = r.nonzero(-4, 4), d = r.int(-4, 4), x0 = r.int(-4, 4), k = r.int(-4, 4);
    if (c * x0 + d === 0) return null;
    const b = k * (c * x0 + d) - a * x0;
    if (a * d - b * c === 0 || Math.abs(b) > 30) return null;
    return { v: { num: lin(a, b), den: lin(c, d), k, coef: a - c * k, rhs: d * k - b }, ans: x0 };
  }),
  cm2_rationalAsym: (r, lvl) => find(() => {
    const c = lvl === 1 ? 1 : r.pick([2, 4, 5]), a = r.nonzero(-6, 6), d = r.nonzero(-6, 6), b = r.int(-8, 8);
    if (a * d - b * c === 0) return null;
    return { v: { num: lin(a, b), den: lin(c, d), a, c, px: tfrac(-d, c), qy: tfrac(a, c) }, ans: (a - d) / c };
  }),
  cm2_rationalParam: (r, lvl) => find(() => {
    const R = lvl === 1 ? 3 : 5, p = r.int(-R, R), q = r.nonzero(-R, R), u = r.nonzero(-R, R), qu = q * u;
    const ds = []; for (const dv of divisors(Math.abs(qu))) ds.push(dv, -dv);
    const d0 = r.pick(ds), x0 = p + d0, y0 = q + qu / d0;
    return { v: { p, q, x0, y0, kk: qu }, ans: p - u };
  }),
  cm2_irrationalPass: (r, lvl) => find(() => {
    const p = r.int(-4, 4), q = r.int(-4, 4), s = r.int(1, lvl === 1 ? 5 : 7), ds = divisors(s * s);
    const d = r.pick(ds) * (lvl === 1 ? 1 : r.pick([1, -1]));
    return { v: { xp: xs(p), qs: q === 0 ? "" : sg(q), x0: p + d, y0: q + s, p, q, s, s2: s * s, d }, ans: (s * s) / d };
  }),
  cm2_irrationalMinMax: (r, lvl) => find(() => {
    const a = lvl === 1 ? r.pick([1, 2, 3]) : r.pick([-1, -2, -3]), lo = r.int(-6, 4), W = r.int(2, 10), c = r.int(-4, 5);
    const us = []; for (let U = 0; U <= 9; U++) for (let V = 0; V <= 9; V++) if (V * V - U * U === a * W && U !== V) us.push([U, V]);
    if (!us.length) return null;
    const [U, V] = r.pick(us), b = U * U - a * lo, hi = lo + W;
    const flo = U + c, fhi = V + c;
    return { v: { fx: `\\sqrt{${lin(a, b)}}${c === 0 ? "" : sg(c)}`, lo, hi, rl: U * U, rh: V * V, c, flo, fhi }, ans: Math.max(flo, fhi) };
  }),
  cm2_rationalIntersectCount: (r, lvl) => find(() => {
    const m = lvl === 1 ? r.pick([1, 2]) : r.pick([1, 2, 3, -1, -2]), k = (m > 0 ? -1 : 1) * r.int(1, lvl === 1 ? 8 : 12);
    const p = r.int(-3, 3), q = r.int(-3, 3), N = r.int(6, lvl === 1 ? 9 : 12), ee = -q + m * p, e4 = 4 * m * k;
    let cnt = 0; for (let n = -N; n <= N; n++) if ((n + ee) ** 2 + e4 > 0) cnt++;
    const tot = 2 * N + 1;
    if (cnt === tot || cnt < 2) return null;
    return { v: { fr: `\\frac{${k}}{${xs(p)}}${q === 0 ? "" : sg(q)}`, line: `y=${cf(m)}x+n`, N, k, den: xs(p), qs: q === 0 ? "" : sg(q), mx: `${cf(m)}x`, nstr: ee === 0 ? "n" : `n${sg(ee)}`, ds: sg(e4), tot, bad: tot - cnt }, ans: cnt };
  }),
  cm2_irrLineCount: (r, lvl) => find(() => {
    const a = r.pick(lvl === 1 ? [5, 6, 7, 9, 10, 11] : [17, 18, 19, 21, 22, 23, 25, 26, 27]), b = r.int(-12, 12);
    let lo = null, hi = null;
    for (let k = -80; k <= 80; k++) if (a * k >= b && 4 * a * k < a * a + 4 * b) { if (lo === null) lo = k; hi = k; }
    if (lo === null) return null;
    return { v: { fr: lin(a, b), a, b, lt: tfrac(b, a), ht: tfrac(a * a + 4 * b, 4 * a), lo, hi }, ans: hi - lo + 1 };
  }),
};

// ---------------- plan ----------------
const G1 = "m.h1.geo1", GM = "m.h1.geom", G2 = "m.h1.geo2", S1 = "m.h1.set1", F1 = "m.h1.fnc1";
export const PLAN = [
  { skill: G1, template: "cm2_divPoint", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-01-01"], strategy: "internal-division-formula", evidence: "calc" },
  { skill: G1, template: "cm2_divRatioFind", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-01-01"], strategy: "ratio-from-coordinates", evidence: "reverse" },
  { skill: GM, template: "cm2_lineThroughPerp", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-01-02"], strategy: "perpendicular-slope-product", evidence: "calc" },
  { skill: GM, template: "cm2_perpParam", levels: [1, 2], count: 8, d: 4, standards: ["10공수2-01-02"], strategy: "parallel-perpendicular-conditions", evidence: "reverse" },
  { skill: G2, template: "cm2_pointLineDist", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-01-03"], strategy: "point-line-distance-formula", evidence: "calc" },
  { skill: G2, template: "cm2_circleGeneral", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-01-04"], strategy: "complete-the-square", evidence: "representation" },
  { skill: G2, template: "cm2_circleTangentAxes", levels: [1, 2], count: 9, d: 4, standards: ["10공수2-01-04"], strategy: "circle-tangent-to-axes", evidence: "application" },
  { skill: G2, template: "cm2_lineCircleCount", levels: [1, 2], count: 10, d: 4, standards: ["10공수2-01-05"], strategy: "center-distance-vs-radius", evidence: "counting" },
  { skill: G2, template: "cm2_chordLength", levels: [1, 2], count: 10, d: 3, standards: ["10공수2-01-03", "10공수2-01-05"], strategy: "chord-from-center-distance", evidence: "application" },
  { skill: G2, template: "cm2_tangentAtPoint", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-01-05"], strategy: "tangent-line-at-point", evidence: "application" },
  { skill: G2, template: "cm2_translateCurve", levels: [1, 2], count: 10, d: 3, standards: ["10공수2-01-06"], strategy: "translation-coefficient-matching", evidence: "reverse" },
  { skill: G2, template: "cm2_reflectPointChain", levels: [1], count: 18, d: 3, standards: ["10공수2-01-06", "10공수2-01-07"], strategy: "reflection-translation-chain", evidence: "reverse" },
  { skill: G2, template: "cm2_reflectCurve", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-01-06", "10공수2-01-07"], strategy: "reflect-then-translate-vertex", evidence: "calc" },
  { skill: G2, template: "cm2_reflectShortest", levels: [1, 2], count: 9, d: 4, standards: ["10공수2-01-07"], strategy: "shortest-path-by-reflection", evidence: "application" },
  { skill: S1, template: "cm2_setSumCount", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-02-01"], strategy: "set-builder-distinct-elements", evidence: "representation" },
  { skill: S1, template: "cm2_setOpSum", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-02-01", "10공수2-02-03"], strategy: "set-operations-on-listed-sets", evidence: "calc" },
  { skill: S1, template: "cm2_vennReverse", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-02-03"], strategy: "venn-region-counting", evidence: "reverse" },
  { skill: S1, template: "cm2_inclusionParam", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-02-02"], strategy: "inclusion-chain-interval-count", evidence: "counting" },
  { skill: S1, template: "cm2_forallQuad", levels: [1, 2], count: 10, d: 3, standards: ["10공수2-02-04"], strategy: "for-all-statement-discriminant", evidence: "concept" },
  { skill: S1, template: "cm2_existsInterval", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-02-04"], strategy: "exists-statement-max-over-set", evidence: "concept" },
  { skill: S1, template: "cm2_contraRange", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-02-05"], strategy: "contrapositive-truth-sets", evidence: "concept" },
  { skill: S1, template: "cm2_converseRange", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-02-05"], strategy: "converse-truth-sets", evidence: "counting" },
  { skill: S1, template: "cm2_necessaryDiv", levels: [1, 2], count: 9, d: 4, standards: ["10공수2-02-06"], strategy: "necessary-not-sufficient-divisibility", evidence: "counting" },
  { skill: S1, template: "cm2_sufficientQuad", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-02-06"], strategy: "sufficient-condition-truth-set", evidence: "concept" },
  { skill: S1, template: "cm2_amgmMin", levels: [1, 2, 3], count: 7, d: 3, standards: ["10공수2-02-08"], strategy: "am-gm-minimum", evidence: "concept" },
  { skill: F1, template: "cm2_funcInjective", levels: [1, 2], count: 9, d: 4, standards: ["10공수2-03-01"], strategy: "count-one-to-one-functions", evidence: "counting" },
  { skill: F1, template: "cm2_funcMonotone", levels: [1, 2], count: 9, d: 4, standards: ["10공수2-03-01"], strategy: "count-increasing-functions", evidence: "counting" },
  { skill: F1, template: "cm2_compFindG", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-03-02"], strategy: "solve-for-inner-function", evidence: "reverse" },
  { skill: F1, template: "cm2_compTable", levels: [1, 2], count: 9, d: 3, standards: ["10공수2-03-02"], strategy: "composition-table-comparison", evidence: "representation" },
  { skill: F1, template: "cm2_inverseQuadDom", levels: [1, 2], count: 10, d: 4, standards: ["10공수2-03-03"], strategy: "inverse-with-restricted-domain", evidence: "concept" },
  { skill: F1, template: "cm2_inverseRational", levels: [1, 2], count: 10, d: 3, standards: ["10공수2-03-03", "10공수2-03-04"], strategy: "inverse-value-by-solving", evidence: "calc" },
  { skill: F1, template: "cm2_rationalAsym", levels: [1, 2], count: 10, d: 2, standards: ["10공수2-03-04"], strategy: "asymptotes-from-fraction-form", evidence: "representation" },
  { skill: F1, template: "cm2_rationalParam", levels: [1, 2], count: 9, d: 4, standards: ["10공수2-03-04"], strategy: "translated-hyperbola-intercept", evidence: "reverse" },
  { skill: F1, template: "cm2_rationalIntersectCount", levels: [1, 2], count: 9, d: 5, standards: ["10공수2-03-04"], strategy: "hyperbola-line-discriminant-count", evidence: "counting" },
  { skill: F1, template: "cm2_irrationalPass", levels: [1, 2], count: 10, d: 3, standards: ["10공수2-03-05"], strategy: "irrational-function-through-point", evidence: "reverse" },
  { skill: F1, template: "cm2_irrationalMinMax", levels: [1, 2], count: 10, d: 3, standards: ["10공수2-03-05"], strategy: "monotone-extremum-on-interval", evidence: "application" },
  { skill: F1, template: "cm2_irrLineCount", levels: [1, 2], count: 9, d: 5, standards: ["10공수2-03-05"], strategy: "radical-curve-line-substitution", evidence: "counting" },
];

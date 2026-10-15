// 기하 (12기하): conics, coordinate space, projection, three-perpendiculars theorem, vectors, lines and planes, spheres.
// Everything is given by coordinates / equations / lengths (no figure); numbers are Pythagorean-friendly so that answers are integers or simple rationals.
// 12기하02-01 (class X, proofs) gets no items.
import { gcd, sg, cf, tfrac, Q, lin } from "../lib.mjs";

export const TEMPLATES = {};
export const GEN = {};
export const PLAN = [];
const add = (key, txt, gen, plan) => { TEMPLATES[key] = txt; GEN[key] = gen; for (const p of plan) PLAN.push({ template: key, ...p }); };
const G1 = "m.h3.geo1", G2 = "m.h3.geo2";

// ---------- helpers ----------
const sgn = (r) => (r.next() < 0.5 ? -1 : 1);
const BASE = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
/** Pythagorean triples [leg1, leg2, hyp] (leg1 < leg2) with hyp <= 40, and a short list with hyp <= 30 */
const TRIS = [];
for (const [p, q, h] of BASE) for (let s = 1; s * h <= 40; s++) TRIS.push([p * s, q * s, h * s]);
const TRIS30 = TRIS.filter((t) => t[2] <= 30);
const TRIS17 = TRIS.filter((t) => t[2] <= 17);
const QUADS = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [2, 5, 14, 15], [2, 10, 11, 15], [1, 12, 12, 17], [8, 9, 12, 17], [2, 4, 4, 6], [3, 6, 6, 9]];
const shuf3 = (r, v) => { const a = [...v]; for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** a random integer vector d with |d| = L (an integer) */
const quadVec = (r) => { const q = r.pick(QUADS); return { d: shuf3(r, q.slice(0, 3)).map((x) => x * sgn(r)), L: q[3] }; };
const vt = (a) => `(${a.join(",\\ ")})`;
/** (v - off) as an expression: off 0 -> v */
const xo = (v, off) => (off === 0 ? v : off > 0 ? `(${v}-${off})` : `(${v}+${-off})`);
const sq2 = (v, off) => `${xo(v, off)}^2`;
/** v - off without brackets: x-3, x+2, x */
const nm = (v, off) => (off === 0 ? v : off > 0 ? `${v}-${off}` : `${v}+${-off}`);
/** polynomial text from [coef, monomial] pairs */
const pe = (terms) => {
  let s = "";
  for (const [c, m] of terms) {
    if (!c) continue;
    const a = Math.abs(c);
    const body = m === "" ? String(a) : a === 1 ? m : `${a}${m}`;
    s += (c < 0 ? "-" : s ? "+" : "") + body;
  }
  return s || "0";
};
const dot3 = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const gcdAll = (...xs) => xs.reduce((g, x) => gcd(g, Math.abs(x)), 0);
const lcm2 = (a, b) => (a / gcd(a, b)) * b;
const fq = (n, d) => new Q(n, d);
const tq = (q) => tfrac(Number(q.p), Number(q.q));
const qabs = (q) => (q.p < 0n ? new Q(-q.p, q.q) : q);
const AX = ["x", "y", "z"];
/** the standard ellipse text with denominators A (x^2) and B (y^2) */
const ellT = (A, B) => `\\frac{x^2}{${A}}+\\frac{y^2}{${B}}=1`;
const hypT = (A, B, xt) => (xt ? `\\frac{x^2}{${A}}-\\frac{y^2}{${B}}=1` : `\\frac{y^2}{${A}}-\\frac{x^2}{${B}}=1`);
const slopeTex = (sn, n, d) => (d === 1 ? String(sn * n) : tfrac(sn * n, d));
const slopeCoef = (sn, n, d) => (d === 1 ? (n === 1 ? (sn < 0 ? "-" : "") : String(sn * n)) : tfrac(sn * n, d));
const fmtFrac = (q) => q.toNumber();

// ===================================================================================================================================
// 1. parabola from focus and directrix (definition -> equation -> coordinates)
add(
  "geo_parFocusDir",
  {
    ko: ["초점이 $F({fx},\\ {fy})$ 이고 준선이 ${dirEq}$ 인 포물선 위의 점 $P(x,\\ y)$ 가 ${cond}$ 를 만족할 때, ${un}$ 의 최댓값은? (숫자만 쓰세요)", ["포물선 위의 점은 초점까지의 거리와 준선까지의 거리가 같아요.", "초점과 준선의 한가운데가 꼭짓점이에요. 꼭짓점이 $({vx},\\ {vy})$ 이고 $p={pp}$ 인 포물선의 방정식을 먼저 세워 보세요."], "꼭짓점이 $({vx},\\ {vy})$, $p={pp}$ 이므로 포물선의 방정식은 ${eqn}$ 입니다. ${cond}$ 를 대입하면 ${un}={sol}$ 이므로 ${un}$ 의 최댓값은 ${ans}$ 입니다."],
    en: ["A parabola has focus $F({fx},\\ {fy})$ and directrix ${dirEq}$. A point $P(x,\\ y)$ on the parabola satisfies ${cond}$. What is the maximum value of ${un}$? (digits only)", ["A point of a parabola is equally far from the focus and from the directrix.", "The vertex is the midpoint between focus and directrix. Write the equation of the parabola with vertex $({vx},\\ {vy})$ and $p={pp}$ first."], "The vertex is $({vx},\\ {vy})$ and $p={pp}$, so the parabola is ${eqn}$. Substituting ${cond}$ gives ${un}={sol}$, so the maximum of ${un}$ is ${ans}$."],
  },
  (r, lvl) => {
    const hor = r.next() < 0.5;
    let p, s, h = 0, k = 0;
    if (lvl === 1) { p = sgn(r) * r.int(1, 6); s = r.int(1, 4); } else { p = sgn(r) * r.int(1, 4); s = r.int(1, 3); h = r.int(-4, 4); k = r.int(-4, 4); }
    const ap = Math.abs(p), w = 2 * ap * s;
    if (hor) {
      return { v: { fx: h + p, fy: k, dirEq: `x=${h - p}`, cond: `x=${h + p * s * s}`, un: "y", vx: h, vy: k, pp: p, eqn: `${sq2("y", k)}=${4 * p}${xo("x", h)}`, sol: `${k === 0 ? "" : k}\\pm ${w}` }, ans: k + w };
    }
    return { v: { fx: h, fy: k + p, dirEq: `y=${k - p}`, cond: `y=${k + p * s * s}`, un: "x", vx: h, vy: k, pp: p, eqn: `${sq2("x", h)}=${4 * p}${xo("y", k)}`, sol: `${h === 0 ? "" : h}\\pm ${w}` }, ans: h + w };
  },
  [
    { skill: G1, levels: [1, 2], count: 12, d: 2, standards: ["12기하01-01"], strategy: "definition-to-equation", evidence: "application" },
  ],
);

// ===================================================================================================================================
// 2. focal chord of a parabola
add(
  "geo_parFocalChord",
  {
    ko: ["포물선 ${eq}$ 의 초점을 지나고 기울기가 ${m}$ 인 직선이 포물선과 만나는 두 점을 P, Q라 할 때, 선분 PQ의 길이는? (숫자만 쓰세요)", ["포물선 위의 점에서 초점까지의 거리는 그 점에서 준선까지의 거리와 같아요.", "직선의 방정식을 포물선의 방정식에 대입하여 두 교점의 ${w}$좌표의 합을 구해 보세요."], "$p={pp}$ 이므로 초점은 ${foc}$, 직선은 ${line}$ 입니다. 대입하면 두 교점의 ${w}$좌표를 ${w}_1,\\ {w}_2$ 라 할 때 ${w}_1+{w}_2={sum}$ 이고, 준선까지의 거리를 이용하면 $PQ=({w}_1+{pp})+({w}_2+{pp})={sum}+{twop}={ans}$ 입니다."],
    en: ["A line with slope ${m}$ passes through the focus of the parabola ${eq}$ and meets the parabola at P and Q. What is the length of segment PQ? (digits only)", ["For a point of a parabola, the distance to the focus equals the distance to the directrix.", "Substitute the equation of the line into the parabola and find the sum of the ${w}$-coordinates of the two intersection points."], "Since $p={pp}$, the focus is ${foc}$ and the line is ${line}$. Substituting gives ${w}_1+{w}_2={sum}$ for the ${w}$-coordinates, and by the directrix property $PQ=({w}_1+{pp})+({w}_2+{pp})={sum}+{twop}={ans}$."],
  },
  (r, lvl) => {
    const p = r.int(1, 6), sn = sgn(r), c = 4 * p;
    if (lvl === 1) {
      const [n, d] = r.pick([[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 1], [2, 3], [2, 5]]);
      const sum = 2 * p + (4 * p * d * d) / (n * n);
      return { v: { eq: `y^2=${c}x`, m: slopeTex(sn, n, d), pp: p, foc: `(${p},\\ 0)`, line: `y=${slopeCoef(sn, n, d)}(x-${p})`, w: "x", sum, twop: 2 * p }, ans: sum + 2 * p };
    }
    const [n, d] = r.pick([[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [3, 2], [5, 2]]);
    const sum = (4 * p * n * n) / (d * d) + 2 * p;
    return { v: { eq: `x^2=${c}y`, m: slopeTex(sn, n, d), pp: p, foc: `(0,\\ ${p})`, line: `y=${slopeCoef(sn, n, d)}x+${p}`, w: "y", sum, twop: 2 * p }, ans: sum + 2 * p };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-01"], strategy: "focal-chord", evidence: "application" }],
);

// ===================================================================================================================================
// 3. ellipse: sums of focal distances
add(
  "geo_ellipseFocal",
  {
    ko: ["타원 ${eq}$ 의 두 초점을 F, F'이라 하자. 타원 위의 점 P가 ${cond}$ 일 때, ${ask}$ 의 값은? (숫자만 쓰세요)", ["타원 위의 점에서 두 초점까지의 거리의 합은 일정하고, 그 값은 장축의 길이예요.", "장반지름이 $a={a}$, $c={c}$ 예요. $PF+PF'=2a$ 를 이용해 보세요."], "장반지름이 $a={a}$, $c={c}$ 이므로 $PF+PF'=2a={tw}$, $FF'=2c={tc}$ 입니다. ${work}$ 이므로 구하는 값은 ${ans}$ 입니다."],
    en: ["Let F and F' be the foci of the ellipse ${eq}$. A point P on the ellipse satisfies ${cond}$. What is the value of ${ask}$? (digits only)", ["For a point on an ellipse the sum of the distances to the two foci is constant and equals the length of the major axis.", "The semi-major axis is $a={a}$ and $c={c}$. Use $PF+PF'=2a$."], "The semi-major axis is $a={a}$ and $c={c}$, so $PF+PF'=2a={tw}$ and $FF'=2c={tc}$. ${work}$, so the value is ${ans}$."],
  },
  (r, lvl) => {
    const t = r.pick(TRIS30), sw = r.next() < 0.5;
    const a = t[2], b = sw ? t[0] : t[1], c = sw ? t[1] : t[0];
    const eq = r.next() < 0.5 ? ellT(a * a, b * b) : ellT(b * b, a * a);
    const tw = 2 * a, tc = 2 * c;
    if (lvl === 1) {
      const d1 = r.int(a - c, a + c);
      return { v: { eq, cond: `PF=${d1}`, ask: "PF+PF'+FF'", a, c, tw, tc, work: `PF+PF'+FF'=${tw}+${tc}` }, ans: tw + tc };
    }
    // level 2: a ratio or a difference of the two focal distances
    if (r.next() < 0.5) {
      const cands = [];
      for (let m = 1; m <= 5; m++) for (let n = m + 1; n <= 6; n++) { const pf = (tw * m) / (m + n); if (Number.isInteger(pf) && pf >= a - c && pf <= a + c) cands.push([m, n, pf]); }
      if (cands.length) { const [m, n, pf] = r.pick(cands); return { v: { eq, cond: `PF:PF'=${m}:${n}`, ask: "PF", a, c, tw, tc, work: `PF=\\frac{${m}}{${m + n}}\\times ${tw}` }, ans: pf }; }
    }
    const ks = []; for (let k = -2 * c; k <= 2 * c; k += 2) if (k !== 0) ks.push(k);
    const k = r.pick(ks);
    return { v: { eq, cond: `PF-PF'=${k}`, ask: "PF", a, c, tw, tc, work: `PF=\\frac{2a+(${k})}{2}=\\frac{${tw}${sg(k)}}{2}` }, ans: a + k / 2 };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 2, standards: ["12기하01-02"], strategy: "focal-distance-sum", evidence: "application" }],
);

// ===================================================================================================================================
// 4. hyperbola: differences of focal distances
add(
  "geo_hyperFocal",
  {
    ko: ["쌍곡선 ${eq}$ 의 두 초점을 F, F'이라 하자. 쌍곡선 위의 점 P가 ${cond}$ 일 때, ${ask}$ 의 값은? (숫자만 쓰세요)", ["쌍곡선 위의 점에서 두 초점까지의 거리의 차의 절댓값은 주축의 길이 $2a$ 와 같아요.", "$a={a}$, $c={c}$ 이므로 $|PF-PF'|=2a={tw}$ 이고, 쌍곡선 위의 점에서 한 초점까지의 거리는 $c-a={ca}$ 이상이에요."], "$a={a}$, $b={b}$, $c={c}$ 이고 $|PF-PF'|=2a={tw}$, $FF'=2c={tc}$ 입니다. ${work}$ 이므로 구하는 값은 ${ans}$ 입니다."],
    en: ["Let F and F' be the foci of the hyperbola ${eq}$. A point P on the hyperbola satisfies ${cond}$. What is the value of ${ask}$? (digits only)", ["For a point on a hyperbola, the absolute difference of the distances to the foci equals the length $2a$ of the transverse axis.", "Here $a={a}$ and $c={c}$, so $|PF-PF'|=2a={tw}$, and a point of the hyperbola is at least $c-a={ca}$ away from each focus."], "Here $a={a}$, $b={b}$, $c={c}$, $|PF-PF'|=2a={tw}$ and $FF'=2c={tc}$. ${work}$, so the value is ${ans}$."],
  },
  (r, lvl) => {
    const t = r.pick(TRIS30), sw = r.next() < 0.5;
    const c = t[2], a = sw ? t[0] : t[1], b = sw ? t[1] : t[0];
    const eq = hypT(a * a, b * b, r.next() < 0.5);
    const tw = 2 * a, tc = 2 * c, base = { a, b, c, tw, tc, ca: c - a };
    if (lvl === 1) {
      const d1 = r.int(c - a, c + a - 1);
      return { v: { eq, cond: `PF=${d1}`, ask: "PF'", ...base, work: `PF=${d1}<c+a=${c + a},\\ PF'=PF+2a=${d1}+${tw}` }, ans: d1 + tw };
    }
    if (r.next() < 0.6) {
      const cands = [];
      for (let m = 1; m <= 7; m++) for (let n = 1; n <= 7; n++) {
        if (m === n || gcd(m, n) !== 1) continue;
        const ad = Math.abs(n - m);
        if ((tw * (m + n)) % ad !== 0) continue;
        const k = tw / ad;
        if (Math.min(m, n) * k >= c - a) cands.push([m, n, ad, (m + n) * k]);
      }
      if (cands.length) { const [m, n, ad, tot] = r.pick(cands); return { v: { eq, cond: `PF:PF'=${m}:${n}`, ask: "PF+PF'+FF'", ...base, work: `PF+PF'=(${m}+${n})\\times\\frac{${tw}}{${ad}}=${tot},\\ PF+PF'+FF'=${tot}+${tc}` }, ans: tot + tc }; }
    }
    return { v: { eq, cond: "\\angle FPF'=90^\\circ", ask: "PF\\times PF'", ...base, work: `PF\\cdot PF'=\\frac{(2c)^2-(2a)^2}{2}=\\frac{${tc}^2-${tw}^2}{2}` }, ans: 2 * b * b };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-03"], strategy: "focal-distance-difference", evidence: "application" }],
);

// ===================================================================================================================================
// 5. ellipse equation -> distance between the foci
add(
  "geo_ellipseFromEq",
  {
    ko: ["타원 ${eq}$ 의 두 초점 사이의 거리는? (숫자만 쓰세요)", ["타원을 $\\frac{x^2}{\\square}+\\frac{y^2}{\\square}=1$ 꼴로 고쳐 두 분모 중 큰 것이 $a^2$ 예요.", "두 분모는 ${a2}$ 와 ${b2}$ 이고, $c^2=a^2-b^2$ 이에요."], "${std}$ 꼴로 고치면 $a^2={a2}$, $b^2={b2}$ 이므로 $c^2=a^2-b^2={c2}$, $c={c}$ 입니다. 두 초점 사이의 거리는 $2c={ans}$ 입니다."],
    en: ["What is the distance between the two foci of the ellipse ${eq}$? (digits only)", ["Rewrite the ellipse as $\\frac{x^2}{\\square}+\\frac{y^2}{\\square}=1$; the larger denominator is $a^2$.", "The two denominators are ${a2}$ and ${b2}$, and $c^2=a^2-b^2$."], "In the form ${std}$ we have $a^2={a2}$, $b^2={b2}$, so $c^2=a^2-b^2={c2}$ and $c={c}$. The distance between the foci is $2c={ans}$."],
  },
  (r, lvl) => {
    for (;;) {
      const t = r.pick(TRIS), sw = r.next() < 0.5, a = t[2], b = sw ? t[0] : t[1], c = sw ? t[1] : t[0];
      const xm = r.next() < 0.5, ax = xm ? a * a : b * b, by = xm ? b * b : a * a;
      const std = ellT(ax, by);
      let eq = std;
      if (lvl === 2) {
        const Lc = lcm2(ax, by); let p = Lc / ax, q = Lc / by, N = Lc; const g = gcdAll(p, q, N); p /= g; q /= g; N /= g;
        if (N > 8000) continue;
        eq = `${pe([[p, "x^2"], [q, "y^2"]])}=${N}`;
      }
      return { v: { eq, std, a2: a * a, b2: b * b, c2: c * c, c }, ans: 2 * c };
    }
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 2, standards: ["12기하01-02"], strategy: "equation-to-feature", evidence: "representation" }],
);

// ===================================================================================================================================
// 6. hyperbola equation -> asymptote slope
add(
  "geo_hyperAsym",
  {
    ko: ["쌍곡선 ${eq}$ 의 두 점근선 중 기울기가 양수인 직선의 기울기는? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["쌍곡선 $\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1$ 의 점근선은 $y=\\pm\\frac{b}{a}x$, $\\frac{y^2}{a^2}-\\frac{x^2}{b^2}=1$ 의 점근선은 $y=\\pm\\frac{a}{b}x$ 예요.", "먼저 우변이 1인 꼴 ${std}$ 로 정리해서 $a^2$, $b^2$ 을 읽으세요."], "${std}$ 꼴이므로 점근선은 ${asy}$ 입니다. 기울기가 양수인 점근선의 기울기는 ${ans}$ 입니다."],
    en: ["What is the slope of the asymptote with positive slope of the hyperbola ${eq}$? (decimal or fraction such as 3/4)", ["The asymptotes of $\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1$ are $y=\\pm\\frac{b}{a}x$, and those of $\\frac{y^2}{a^2}-\\frac{x^2}{b^2}=1$ are $y=\\pm\\frac{a}{b}x$.", "First rewrite it with right-hand side 1, ${std}$, and read off $a^2$ and $b^2$."], "In the form ${std}$ the asymptotes are ${asy}$, so the asymptote with positive slope has slope ${ans}$."],
  },
  (r, lvl) => {
    for (;;) {
      const al = r.int(2, 9), be = r.int(2, 9), xt = r.next() < 0.5;
      const std = hypT(al * al, be * be, xt);
      const num = xt ? be : al, den = xt ? al : be;
      const asy = `y=\\pm\\frac{${num}}{${den}}x`;
      let eq = std;
      if (lvl === 2) {
        const Lc = lcm2(al * al, be * be); let p = Lc / (al * al), q = Lc / (be * be), N = Lc; const g = gcdAll(p, q, N); p /= g; q /= g; N /= g;
        if (N > 8000) continue;
        eq = xt ? `${pe([[p, "x^2"], [-q, "y^2"]])}=${N}` : `${pe([[p, "y^2"], [-q, "x^2"]])}=${N}`;
      }
      return { v: { eq, std, asy }, ans: num / den };
    }
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 2, standards: ["12기하01-03"], strategy: "equation-to-feature", evidence: "representation" }],
);

// ===================================================================================================================================
// 7. eccentricity -> unknown denominator
add(
  "geo_eccentric",
  {
    ko: ["곡선 ${eq}$ 의 이심률이 ${e}$ 이고 ${cond}$ 일 때, $k$ 의 값은? (숫자만 쓰세요)", ["타원의 이심률은 $e=\\frac{c}{a}$, 쌍곡선의 이심률도 $e=\\frac{c}{a}$ 예요. 어느 분모가 $a^2$ 인지 먼저 정하세요.", "$e^2$ 을 $k$ 로 나타낸 식을 세우세요. 타원은 $e^2=1-\\frac{b^2}{a^2}$, 쌍곡선은 $e^2=1+\\frac{b^2}{a^2}$ 예요."], "$e=\\frac{c}{a}$ 이고 ${work}$ 입니다. 따라서 $k={ans}$ 입니다."],
    en: ["The curve ${eq}$ has eccentricity ${e}$, and ${cond}$. What is the value of $k$? (digits only)", ["For both ellipse and hyperbola $e=\\frac{c}{a}$. First decide which denominator is $a^2$.", "Write $e^2$ in terms of $k$: for an ellipse $e^2=1-\\frac{b^2}{a^2}$, for a hyperbola $e^2=1+\\frac{b^2}{a^2}$."], "We have $e=\\frac{c}{a}$ and ${work}$. Hence $k={ans}$."],
  },
  (r, lvl) => {
    const t = r.pick(TRIS30), sw = r.next() < 0.5, case1 = r.next() < 0.5;
    if (lvl === 1) {
      const a = t[2], b = sw ? t[0] : t[1], c = sw ? t[1] : t[0], e = tfrac(c, a);
      if (case1) return { v: { eq: `\\frac{x^2}{${a * a}}+\\frac{y^2}{k}=1`, e, cond: `0<k<${a * a}`, work: `e^2=1-\\frac{k}{${a * a}}=\\left(${e}\\right)^2,\\ k=${a * a}\\left(1-\\left(${e}\\right)^2\\right)` }, ans: b * b };
      return { v: { eq: `\\frac{x^2}{k}+\\frac{y^2}{${b * b}}=1`, e, cond: `k>${b * b}`, work: `e^2=1-\\frac{${b * b}}{k}=\\left(${e}\\right)^2,\\ k=\\frac{${b * b}}{1-\\left(${e}\\right)^2}` }, ans: a * a };
    }
    const c = t[2], a = sw ? t[0] : t[1], b = sw ? t[1] : t[0], e = tfrac(c, a);
    if (case1) return { v: { eq: `\\frac{x^2}{${a * a}}-\\frac{y^2}{k}=1`, e, cond: "k>0", work: `e^2=1+\\frac{k}{${a * a}}=\\left(${e}\\right)^2,\\ k=${a * a}\\left(\\left(${e}\\right)^2-1\\right)` }, ans: b * b };
    return { v: { eq: `\\frac{x^2}{k}-\\frac{y^2}{${b * b}}=1`, e, cond: "k>0", work: `e^2=1+\\frac{${b * b}}{k}=\\left(${e}\\right)^2,\\ k=\\frac{${b * b}}{\\left(${e}\\right)^2-1}` }, ans: a * a };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-02", "12기하01-03"], strategy: "eccentricity-unknown", evidence: "reverse" }],
);

// ===================================================================================================================================
// 8. tangency condition of a line y = mx + k
const TL_E = [], TL_H = [];
for (let A = 2; A <= 36; A++) for (let B = 2; B <= 36; B++) for (let m = 1; m <= 3; m++) {
  const s = A * m * m + B, k = Math.round(Math.sqrt(s));
  if (k * k === s && A !== B) TL_E.push([A, B, m, k]);
  const s2 = A * m * m - B, k2 = Math.round(Math.sqrt(Math.max(s2, 0)));
  if (s2 > 0 && k2 * k2 === s2) TL_H.push([A, B, m, k2]);
}
add(
  "geo_conicTangentLine",
  {
    ko: ["곡선 ${eq}$ 에 접하는 직선 ${ln}$ 에 대하여 양수 $k$ 의 값은? (숫자만 쓰세요)", ["직선의 식을 곡선의 방정식에 대입하여 $x$ 에 대한 이차방정식을 만들고, 접하면 판별식이 $0$ 이에요.", "판별식 $D=0$ 에서 $k$ 에 대한 식을 얻으세요."], "직선의 방정식을 곡선의 방정식에 대입해 얻은 이차방정식의 판별식을 $D$ 라 하면 접하므로 $D=0$ 입니다. ${work}$ 이므로 양수 $k$ 는 ${ans}$ 입니다."],
    en: ["The line ${ln}$ is tangent to the curve ${eq}$. What is the positive value of $k$? (digits only)", ["Substitute the line into the equation of the curve to get a quadratic in $x$; tangency means its discriminant is $0$.", "Obtain an equation for $k$ from $D=0$."], "Substituting the line into the curve gives a quadratic whose discriminant $D$ must be $0$ for tangency. ${work}$, so the positive $k$ is ${ans}$."],
  },
  (r, lvl) => {
    if (lvl === 1) {
      const m = sgn(r) * r.int(1, 4), n = r.int(1, 8), c = 4 * m * n;
      return { v: { ln: `y=${cf(m)}x+k`, eq: `y^2=${c}x`, work: `D=${c * c}${sg(-4 * m * c)}k=0` }, ans: n };
    }
    const ell = r.next() < 0.5, [A, B, m0, k] = r.pick(ell ? TL_E : TL_H), m = sgn(r) * m0;
    if (ell) return { v: { ln: `y=${cf(m)}x+k`, eq: ellT(A, B), work: `D=0\\ \\Rightarrow\\ k^2=${A}\\cdot ${m * m}+${B}=${k * k}` }, ans: k };
    return { v: { ln: `y=${cf(m)}x+k`, eq: hypT(A, B, true), work: `D=0\\ \\Rightarrow\\ k^2=${A}\\cdot ${m * m}-${B}=${k * k}` }, ans: k };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-04"], strategy: "tangent-discriminant", evidence: "reverse" }],
);

// ===================================================================================================================================
// 9. area cut off by a tangent line and the axes
const TA_E = [], TA_H = [], TA_P = [];
for (let x0 = 1; x0 <= 15; x0++) for (let y0 = 1; y0 <= 15; y0++) for (let A = 2; A <= 150; A++) {
  if (A > x0 * x0) { const num = y0 * y0 * A, den = A - x0 * x0; if (num % den === 0) { const B = num / den; if (B >= 2 && B <= 150 && B !== A) { const q = fq(A * B, 2 * x0 * y0); if (q.q <= 8n && q.toNumber() <= 600) TA_E.push([A, B, x0, y0]); } } }
  if (x0 * x0 > A) { const num = y0 * y0 * A, den = x0 * x0 - A; if (num % den === 0) { const B = num / den; if (B >= 2 && B <= 150) { const q = fq(A * B, 2 * x0 * y0); if (q.q <= 8n && q.toNumber() <= 600) TA_H.push([A, B, x0, y0]); } } }
}
for (let c = -16; c <= 16; c++) { if (!c) continue; for (let y0 = 1; y0 <= 12; y0++) { if ((y0 * y0) % c !== 0) continue; const x0 = (y0 * y0) / c; const q = fq(Math.abs(c) * x0 * x0, 4 * y0); if (q.q <= 4n && q.toNumber() <= 600 && Math.abs(c) >= 2) TA_P.push([c, x0, y0]); } }
add(
  "geo_tangentAt",
  {
    ko: ["곡선 ${eq}$ 위의 점 $P({x0},\\ {y0})$ 에서의 접선과 $x$축, $y$축으로 둘러싸인 삼각형의 넓이는? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["곡선 위의 점 $(x_1,\\ y_1)$ 에서의 접선은 $x^2\\to x_1x$, $y^2\\to y_1y$ 로 바꾸어 얻을 수 있어요(포물선은 $y^2\\to y_1y$, $x\\to\\frac{x+x_1}{2}$).", "접선의 방정식에서 $x$절편, $y$절편을 구해 $\\frac{1}{2}\\times|x\\text{절편}|\\times|y\\text{절편}|$ 을 계산하세요."], "접선의 방정식은 ${tan}$ 이고, $x$절편은 ${xi}$, $y$절편은 ${yi}$ 입니다. 따라서 넓이는 $\\frac{1}{2}\\times|{xi}|\\times|{yi}|={ans}$ 입니다."],
    en: ["What is the area of the triangle bounded by the tangent line to the curve ${eq}$ at the point $P({x0},\\ {y0})$ and the $x$-axis and $y$-axis? (decimal or fraction such as 3/4)", ["The tangent at $(x_1,\\ y_1)$ is obtained by replacing $x^2\\to x_1x$ and $y^2\\to y_1y$ (for a parabola $y^2\\to y_1y$ and $x\\to\\frac{x+x_1}{2}$).", "Find the $x$- and $y$-intercepts of the tangent and compute $\\frac{1}{2}\\times|x\\text{-intercept}|\\times|y\\text{-intercept}|$."], "The tangent is ${tan}$ with $x$-intercept ${xi}$ and $y$-intercept ${yi}$. So the area is $\\frac{1}{2}\\times|{xi}|\\times|{yi}|={ans}$."],
  },
  (r, lvl) => {
    if (lvl === 2) {
      const [c, x0, y0m] = r.pick(TA_P), y0 = sgn(r) * y0m;
      const xi = fq(-x0, 1), yi = fq(c * x0, 2 * y0), area = qabs(xi).mul(qabs(yi)).div(2);
      return { v: { eq: `y^2=${c}x`, x0, y0, tan: `${y0}y=\\frac{${c}}{2}(x${sg(x0)})`, xi: tq(xi), yi: tq(yi) }, ans: area.toNumber() };
    }
    const ell = r.next() < 0.5, [A, B, x0m, y0m] = r.pick(ell ? TA_E : TA_H), x0 = sgn(r) * x0m, y0 = sgn(r) * y0m;
    const xi = fq(A, x0), yi = ell ? fq(B, y0) : fq(-B, y0), area = qabs(xi).mul(qabs(yi)).div(2);
    return { v: { eq: ell ? ellT(A, B) : hypT(A, B, true), x0, y0, tan: `\\frac{${x0}x}{${A}}${ell ? "+" : "-"}\\frac{${y0}y}{${B}}=1`, xi: tq(xi), yi: tq(yi) }, ans: area.toNumber() };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-04"], strategy: "tangent-at-point", evidence: "calc" }],
);

// ===================================================================================================================================
// 10. two tangents from an external point: product of the slopes
const TP_P = [], TP_E = [], TP_H = [];
for (let c = -16; c <= 16; c++) { if (!c) continue; for (let x1 = 1; x1 <= 9; x1++) for (let y1 = 0; y1 <= 9; y1++) { for (const sx of [1, -1]) { const X = sx * x1; if (y1 * y1 > c * X) { const q = fq(c, 4 * X); if (q.q <= 12n) TP_P.push([c, X, y1]); } } } }
for (let A = 2; A <= 30; A++) for (let B = 2; B <= 30; B++) { if (A === B) continue; for (let x1 = 1; x1 <= 8; x1++) for (let y1 = 0; y1 <= 8; y1++) {
  if (x1 * x1 === A || y1 * y1 === B) continue;
  if (x1 * x1 * B + y1 * y1 * A > A * B) { const q = fq(y1 * y1 - B, x1 * x1 - A); if (q.q <= 12n && q.p !== 0n) TP_E.push([A, B, x1, y1]); }
  if (A * y1 * y1 - B * x1 * x1 + A * B > 0 && A * y1 * y1 !== B * x1 * x1) { const q = fq(y1 * y1 + B, x1 * x1 - A); if (q.q <= 12n && q.p !== 0n) TP_H.push([A, B, x1, y1]); }
} }
add(
  "geo_tangentsFromPoint",
  {
    ko: ["점 $({x1},\\ {y1})$ 에서 곡선 ${eq}$ 에 그은 두 접선의 기울기의 곱은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["접선의 기울기를 $m$ 이라 하고 점 $({x1},\\ {y1})$ 을 지나는 직선 ${lnp}$ 을 곡선의 방정식에 대입해 보세요.", "접하는 조건(판별식 $=0$)에서 $m$ 에 대한 이차방정식이 나오고, 두 접선의 기울기는 그 방정식의 두 근이에요."], "접선의 기울기 $m$ 은 접하는 조건 $D=0$ 에서 얻은 이차방정식 ${quad}=0$ 의 두 근입니다. 근과 계수의 관계에서 두 접선의 기울기의 곱은 ${prod}$ 입니다."],
    en: ["Two tangent lines to the curve ${eq}$ are drawn from the point $({x1},\\ {y1})$. What is the product of their slopes? (decimal or fraction such as 3/4)", ["Let the slope be $m$ and substitute the line ${lnp}$ through the point $({x1},\\ {y1})$ into the equation of the curve.", "The tangency condition (discriminant $=0$) gives a quadratic in $m$ whose two roots are the slopes of the tangents."], "The slopes $m$ are the two roots of the quadratic ${quad}=0$ obtained from the tangency condition $D=0$. By Vieta, the product of the slopes is ${prod}$."],
  },
  (r, lvl) => {
    if (lvl === 1) {
      const [c, X, y1m] = r.pick(TP_P), y1 = sgn(r) * y1m, q = fq(c, 4 * X);
      return { v: { x1: X, y1, lnp: `${nm("y", y1)}=m(${nm("x", X)})`, eq: `y^2=${c}x`, quad: pe([[4 * X, "m^2"], [-4 * y1, "m"], [c, ""]]), prod: tq(q) }, ans: q.toNumber() };
    }
    const ell = r.next() < 0.5, [A, B, x1m, y1m] = r.pick(ell ? TP_E : TP_H), x1 = sgn(r) * x1m, y1 = sgn(r) * y1m;
    const q = ell ? fq(y1 * y1 - B, x1 * x1 - A) : fq(y1 * y1 + B, x1 * x1 - A);
    const quad = pe([[x1 * x1 - A, "m^2"], [-2 * x1 * y1, "m"], [ell ? y1 * y1 - B : y1 * y1 + B, ""]]);
    return { v: { x1, y1, lnp: `${nm("y", y1)}=m(${nm("x", x1)})`, eq: ell ? ellT(A, B) : hypT(A, B, true), quad, prod: tq(q) }, ans: q.toNumber() };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 4, standards: ["12기하01-04"], strategy: "tangents-from-point", evidence: "application" }],
);

// ===================================================================================================================================
// 11. slope of the chord with a given midpoint
const CM_P = [], CM_E = [], CM_H = [];
for (let c = -16; c <= 16; c++) { if (!c) continue; for (let x0 = -8; x0 <= 8; x0++) for (let y0 = 1; y0 <= 8; y0++) if (c * x0 > y0 * y0) { const q = fq(c, 2 * y0); if (q.q <= 12n) CM_P.push([c, x0, y0]); } }
for (let A = 3; A <= 40; A++) for (let B = 3; B <= 40; B++) { if (A === B) continue; for (let x0 = 1; x0 <= 8; x0++) for (let y0 = 1; y0 <= 8; y0++) {
  const q = fq(B * x0, A * y0);
  if (q.q > 12n) continue;
  if (x0 * x0 * B + y0 * y0 * A < A * B) CM_E.push([A, B, x0, y0]);
  if (x0 * x0 * B - y0 * y0 * A > A * B) CM_H.push([A, B, x0, y0]);
} }
add(
  "geo_chordMidpoint",
  {
    ko: ["곡선 ${eq}$ 위의 서로 다른 두 점 P, Q를 이은 선분 PQ의 중점이 $M({x0},\\ {y0})$ 일 때, 직선 PQ의 기울기는? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["두 점의 좌표를 $(x_1,\\ y_1)$, $(x_2,\\ y_2)$ 라 하면 $x_1+x_2$, $y_1+y_2$ 의 값을 중점으로부터 알 수 있어요.", "두 점을 곡선의 방정식에 각각 대입한 두 식을 변끼리 빼면 $\\frac{y_1-y_2}{x_1-x_2}$ 가 나와요."], "$P(x_1,\\ y_1)$, $Q(x_2,\\ y_2)$ 라 하면 $x_1+x_2={sx}$, $y_1+y_2={sy}$ 입니다. 두 점을 곡선의 방정식에 대입하여 변끼리 빼면 ${rel}$ 이므로 기울기는 $\\frac{y_1-y_2}{x_1-x_2}={sl}$ 입니다."],
    en: ["The midpoint of the segment PQ joining two distinct points P and Q of the curve ${eq}$ is $M({x0},\\ {y0})$. What is the slope of the line PQ? (decimal or fraction such as 3/4)", ["Write the points as $(x_1,\\ y_1)$, $(x_2,\\ y_2)$; the midpoint tells you $x_1+x_2$ and $y_1+y_2$.", "Substitute both points into the equation of the curve and subtract the two equations to get $\\frac{y_1-y_2}{x_1-x_2}$."], "Let $P(x_1,\\ y_1)$, $Q(x_2,\\ y_2)$. Then $x_1+x_2={sx}$ and $y_1+y_2={sy}$. Substituting both points into the curve and subtracting gives ${rel}$, so the slope is $\\frac{y_1-y_2}{x_1-x_2}={sl}$."],
  },
  (r, lvl) => {
    if (lvl === 1) {
      const [c, x0, y0m] = r.pick(CM_P), y0 = sgn(r) * y0m, q = fq(c, 2 * y0);
      return { v: { eq: `y^2=${c}x`, x0, y0, sx: 2 * x0, sy: 2 * y0, rel: `${2 * y0}(y_1-y_2)=${c}(x_1-x_2)`, sl: tq(q) }, ans: q.toNumber() };
    }
    const ell = r.next() < 0.5, [A, B, x0m, y0m] = r.pick(ell ? CM_E : CM_H), x0 = sgn(r) * x0m, y0 = sgn(r) * y0m;
    const q = ell ? fq(-B * x0, A * y0) : fq(B * x0, A * y0);
    return { v: { eq: ell ? ellT(A, B) : hypT(A, B, true), x0, y0, sx: 2 * x0, sy: 2 * y0, rel: `\\frac{${2 * x0}(x_1-x_2)}{${A}}${ell ? "+" : "-"}\\frac{${2 * y0}(y_1-y_2)}{${B}}=0`, sl: tq(q) }, ans: q.toNumber() };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 4, standards: ["12기하01-01", "12기하01-02", "12기하01-03"], strategy: "chord-midpoint", evidence: "reverse" }],
);

// ===================================================================================================================================
// 12. right angle at P on an ellipse
add(
  "geo_ellipseRightTri",
  {
    ko: ["타원 ${eq}$ 의 두 초점을 F, F'이라 하자. 타원 위의 점 P가 $\\angle FPF'=90^\\circ$ 를 만족할 때, 삼각형 PFF'의 넓이는? (숫자만 쓰세요)", ["타원의 정의에서 $PF+PF'=2a$ 이고, 직각삼각형이므로 $PF^2+PF'^2=(FF')^2$ 예요.", "$(PF+PF')^2=PF^2+PF'^2+2\\,PF\\cdot PF'$ 를 이용해 $PF\\cdot PF'$ 를 구하세요."], "$a^2={a2}$, $b^2={b2}$, $c^2={c2}$ 이므로 $PF+PF'=2a={tw}$, $FF'=2c={tc}$ 입니다. $PF^2+PF'^2={tc2}$ 이므로 $2\\,PF\\cdot PF'=({tw})^2-{tc2}$, 즉 $PF\\cdot PF'={pr}$ 입니다. 넓이는 $\\frac{1}{2}\\times PF\\times PF'={ans}$ 입니다."],
    en: ["Let F and F' be the foci of the ellipse ${eq}$. A point P on the ellipse satisfies $\\angle FPF'=90^\\circ$. What is the area of triangle PFF'? (digits only)", ["By the definition $PF+PF'=2a$, and since the angle at P is right, $PF^2+PF'^2=(FF')^2$.", "Use $(PF+PF')^2=PF^2+PF'^2+2\\,PF\\cdot PF'$ to find $PF\\cdot PF'$."], "Here $a^2={a2}$, $b^2={b2}$, $c^2={c2}$, so $PF+PF'=2a={tw}$ and $FF'=2c={tc}$. Then $PF^2+PF'^2={tc2}$, so $2\\,PF\\cdot PF'=({tw})^2-{tc2}$, that is $PF\\cdot PF'={pr}$. The area is $\\frac{1}{2}\\times PF\\times PF'={ans}$."],
  },
  (r, lvl) => {
    for (;;) {
      const t = r.pick(TRIS.filter((u) => u[2] <= 40)), b = t[0], c = t[1], a = t[2];
      const xm = r.next() < 0.5, ax = xm ? a * a : b * b, by = xm ? b * b : a * a;
      let eq = ellT(ax, by);
      if (r.next() < 0.5) {
        const Lc = lcm2(ax, by); let p = Lc / ax, q = Lc / by, N = Lc; const g = gcdAll(p, q, N); p /= g; q /= g; N /= g;
        if (N > 8000) continue;
        eq = `${pe([[p, "x^2"], [q, "y^2"]])}=${N}`;
      }
      return { v: { eq, a2: a * a, b2: b * b, c2: c * c, tw: 2 * a, tc: 2 * c, tc2: 4 * c * c, pr: 2 * b * b }, ans: b * b };
    }
  },
  [{ skill: G1, levels: [1], count: 14, d: 4, standards: ["12기하01-02"], strategy: "right-angle-focal-triangle", evidence: "application" }],
);

// ===================================================================================================================================
// 13. counting lattice points on a conic
const cntLattice = (test, lo, hi) => { const pts = []; for (let x = lo; x <= hi; x++) for (let y = lo; y <= hi; y++) if (test(x, y)) pts.push([x, y]); return pts; };
add(
  "geo_conicLattice",
  {
    ko: ["곡선 ${eq}$ 위의 점 중에서 $x$좌표와 $y$좌표가 모두 정수인 점의 개수는? (숫자만 쓰세요)", ["가능한 $x$(또는 $y$)의 범위를 먼저 정한 뒤 정수를 하나씩 대입해 보세요.", "곡선의 대칭성을 이용하면 부호만 다른 점이 함께 생겨요."], "조건을 만족하는 정수 $x$, $y$ 를 하나씩 따져 보면 ${sols}$ 이므로 모두 ${ans}$ 개입니다."],
    en: ["How many points on the curve ${eq}$ have both coordinates integers? (digits only)", ["First bound the possible values of $x$ (or $y$), then try the integers one by one.", "By symmetry of the curve, points that differ only in signs come together."], "Checking the integers $x$, $y$ one by one, the points are ${sols}$, so there are ${ans}$ of them."],
  },
  (r, lvl) => {
    for (;;) {
      let eq, pts;
      if (lvl === 1) {
        const p = r.int(1, 6), q = r.int(1, 6), N = r.int(12, 160);
        pts = cntLattice((x, y) => p * x * x + q * y * y === N, -13, 13);
        eq = `${pe([[p, "x^2"], [q, "y^2"]])}=${N}`;
        if (pts.length < 4 || pts.length > 24) continue;
      } else if (r.next() < 0.6) {
        const kk = r.pick([1, 4, 9]), N = r.int(3, 80);
        pts = []; for (let y = -N; y <= N; y++) { const s = N + kk * y * y, x = Math.round(Math.sqrt(s)); if (x * x === s) { pts.push([x, y]); if (x !== 0) pts.push([-x, y]); } }
        eq = `${pe([[1, "x^2"], [-kk, "y^2"]])}=${N}`;
        if (pts.length < 4 || pts.length > 16) continue;
      } else {
        const c = r.int(2, 12), M = r.int(20, 100);
        pts = []; for (let x = 1; x <= M; x++) { const s = c * x, y = Math.round(Math.sqrt(s)); if (y * y === s) { pts.push([x, y]); pts.push([x, -y]); } }
        eq = `y^2=${c}x\\ (0<x\\le ${M})`;
        if (pts.length < 4 || pts.length > 24) continue;
      }
      pts.sort((u, w) => u[0] - w[0] || u[1] - w[1]);
      return { v: { eq, sols: pts.map(([x, y]) => `(${x},\\ ${y})`).join(",\\ ") }, ans: pts.length };
    }
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-01", "12기하01-02", "12기하01-03"], strategy: "lattice-counting", evidence: "counting" }],
);

// ===================================================================================================================================
// 14. general form -> focus (completing the square)
add(
  "geo_conicGeneral",
  {
    ko: ["이차곡선 ${eq}$ 의 초점 중 $x$좌표가 가장 큰 것(초점이 하나뿐이면 그 점)을 $(a,\\ b)$ 라 할 때, $a+b$ 의 값은? (숫자만 쓰세요)", ["$x$ 와 $y$ 에 대해 각각 완전제곱식으로 고쳐 표준형으로 만드세요.", "표준형에서 중심(또는 꼭짓점)을 읽고, 초점이 있는 방향으로 $c$(포물선은 $p$)만큼 이동한 점이 초점이에요."], "완전제곱식으로 고치면 ${std}$ 입니다. 초점은 ${foc}$ 이므로 $a+b={ans}$ 입니다."],
    en: ["Consider the conic ${eq}$. Let $(a,\\ b)$ be its focus with the largest $x$-coordinate (the focus itself if there is only one). What is $a+b$? (digits only)", ["Complete the square in $x$ and in $y$ to reach the standard form.", "Read the center (or vertex) from the standard form and move by $c$ (by $p$ for a parabola) along the axis to reach the focus."], "Completing the squares gives ${std}$. The focus is ${foc}$, so $a+b={ans}$."],
  },
  (r, lvl) => {
    const h = r.int(-4, 4), k = r.int(-4, 4);
    if (lvl === 1) {
      const p = sgn(r) * r.int(1, 4);
      if (r.next() < 0.5) return { v: { eq: `${pe([[1, "y^2"], [-4 * p, "x"], [-2 * k, "y"], [k * k + 4 * p * h, ""]])}=0`, std: `${sq2("y", k)}=${4 * p}${xo("x", h)}`, foc: `(${h + p},\\ ${k})` }, ans: h + p + k };
      return { v: { eq: `${pe([[1, "x^2"], [-2 * h, "x"], [-4 * p, "y"], [h * h + 4 * p * k, ""]])}=0`, std: `${sq2("x", h)}=${4 * p}${xo("y", k)}`, foc: `(${h},\\ ${k + p})` }, ans: h + k + p };
    }
    if (r.next() < 0.5) {
      const t = r.pick(TRIS.filter((u) => u[2] <= 10)), sw = r.next() < 0.5, a = t[2], b = sw ? t[0] : t[1], c = sw ? t[1] : t[0];
      const co = [b * b, a * a, -2 * b * b * h, -2 * a * a * k, b * b * h * h + a * a * k * k - a * a * b * b], g = gcdAll(...co), d = co.map((x) => x / g);
      return { v: { eq: `${pe([[d[0], "x^2"], [d[1], "y^2"], [d[2], "x"], [d[3], "y"], [d[4], ""]])}=0`, std: `\\frac{${sq2("x", h)}}{${a * a}}+\\frac{${sq2("y", k)}}{${b * b}}=1`, foc: `(${h + c},\\ ${k})` }, ans: h + c + k };
    }
    const t = r.pick(TRIS.filter((u) => u[2] <= 10)), sw = r.next() < 0.5, c = t[2], a = sw ? t[0] : t[1], b = sw ? t[1] : t[0];
    const co = [b * b, -a * a, -2 * b * b * h, 2 * a * a * k, b * b * h * h - a * a * k * k - a * a * b * b], g = gcdAll(...co), d = co.map((x) => x / g);
    return { v: { eq: `${pe([[d[0], "x^2"], [d[1], "y^2"], [d[2], "x"], [d[3], "y"], [d[4], ""]])}=0`, std: `\\frac{${sq2("x", h)}}{${a * a}}-\\frac{${sq2("y", k)}}{${b * b}}=1`, foc: `(${h + c},\\ ${k})` }, ans: h + c + k };
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 3, standards: ["12기하01-01", "12기하01-02", "12기하01-03"], strategy: "completing-square", evidence: "representation" }],
);

// ===================================================================================================================================
// 15. min of PA + PF on a parabola
add(
  "geo_parMinSum",
  {
    ko: ["포물선 ${eq}$ 의 초점을 F라 하고, 점 A의 좌표를 $({xa},\\ {ya})$ 라 하자. 포물선 위의 점 P가 움직일 때, $PA+PF$ 의 최솟값은? (숫자만 쓰세요)", ["포물선 위의 점 P에서 초점까지의 거리 $PF$ 는 P에서 준선까지의 거리와 같아요.", "P에서 준선에 내린 수선의 발을 H라 하면 $PA+PH$ 가 가장 작을 때는 A, P, H가 한 직선 위에 있을 때예요."], "준선은 ${dir}$ 입니다. 점 A는 포물선의 안쪽에 있으므로(${chk}$), P에서 준선에 내린 수선의 발을 H라 하면 $PA+PF=PA+PH$ 의 최솟값은 A에서 준선까지의 거리 ${ans}$ 입니다."],
    en: ["Let F be the focus of the parabola ${eq}$ and let A be the point $({xa},\\ {ya})$. As the point P moves on the parabola, what is the minimum value of $PA+PF$? (digits only)", ["For P on the parabola, the distance $PF$ equals the distance from P to the directrix.", "If H is the foot of the perpendicular from P to the directrix, $PA+PH$ is smallest when A, P and H are collinear."], "The directrix is ${dir}$. The point A lies inside the parabola (${chk}$), so with H the foot of the perpendicular from P to the directrix, the minimum of $PA+PF=PA+PH$ is the distance from A to the directrix, ${ans}$."],
  },
  (r, lvl) => {
    const p = r.int(1, 5), c = 4 * p;
    for (;;) {
      const u = r.int(1, 10), w = r.int(-9, 9);
      if (w * w >= c * u) continue;
      if (lvl === 1) return { v: { eq: `y^2=${c}x`, xa: u, ya: w, dir: `x=-${p}`, chk: `${w}^2=${w * w}<${c}\\times ${u}=${c * u}` }, ans: u + p };
      return { v: { eq: `x^2=${c}y`, xa: w, ya: u, dir: `y=-${p}`, chk: `${w}^2=${w * w}<${c}\\times ${u}=${c * u}` }, ans: u + p };
    }
  },
  [{ skill: G1, levels: [1, 2], count: 12, d: 4, standards: ["12기하01-01"], strategy: "reflection-focus-directrix", evidence: "application" }],
);

// ===================================================================================================================================
// 16. max and min of PA + PF on an ellipse
const EX = [];
for (const [a, b, c] of [[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5], [15, 9, 12], [15, 12, 9], [17, 8, 15], [17, 15, 8]]) {
  for (let x = -a + 1; x < a; x++) for (let y = 0; y < b; y++) {
    if (x * x * b * b + y * y * a * a >= a * a * b * b) continue;
    const s = (x + c) * (x + c) + y * y, d = Math.round(Math.sqrt(s));
    if (d > 0 && d * d === s) EX.push([a, b, c, x, y, d]);
  }
}
add(
  "geo_ellipseExtSum",
  {
    ko: ["타원 ${eq}$ 의 한 초점을 $F({fx},\\ {fy})$ 라 하고, 타원 내부의 한 점의 좌표를 $A({xa},\\ {ya})$ 라 하자. 타원 위의 점 P가 움직일 때, $PA+PF$ 의 최댓값과 최솟값의 곱은? (숫자만 쓰세요)", ["다른 초점을 F'이라 하면 $PF=2a-PF'$ 예요. 그러면 $PA+PF=2a+(PA-PF')$ 로 쓸 수 있어요.", "삼각부등식에서 $-AF'\\le PA-PF'\\le AF'$ 이고, A가 타원 안쪽에 있으므로 양쪽 등호가 모두 가능해요."], "다른 초점을 F'이라 하면 $PA+PF=2a+(PA-PF')$ 이고 $a={a}$, $AF'={dd}$ 입니다. $-AF'\\le PA-PF'\\le AF'$ 이므로 최댓값은 $2a+AF'={mx}$, 최솟값은 $2a-AF'={mn}$ 이고 곱은 ${ans}$ 입니다."],
    en: ["The ellipse ${eq}$ has a focus $F({fx},\\ {fy})$, and the point $A({xa},\\ {ya})$ lies inside the ellipse. As the point P moves on the ellipse, what is the product of the maximum and the minimum of $PA+PF$? (digits only)", ["If F' is the other focus, $PF=2a-PF'$, so $PA+PF=2a+(PA-PF')$.", "By the triangle inequality $-AF'\\le PA-PF'\\le AF'$, and both equalities occur because A is inside the ellipse."], "With F' the other focus, $PA+PF=2a+(PA-PF')$, where $a={a}$ and $AF'={dd}$. Since $-AF'\\le PA-PF'\\le AF'$, the maximum is $2a+AF'={mx}$, the minimum is $2a-AF'={mn}$, and the product is ${ans}$."],
  },
  (r) => {
    const [a, b, c, x, y0, d] = r.pick(EX), y = sgn(r) * y0, ver = r.next() < 0.5;
    const mx = 2 * a + d, mn = 2 * a - d;
    return { v: { eq: ver ? ellT(b * b, a * a) : ellT(a * a, b * b), fx: ver ? 0 : c, fy: ver ? c : 0, xa: ver ? y : x, ya: ver ? x : y, a, dd: d, mx, mn }, ans: mx * mn };
  },
  [{ skill: G1, levels: [1], count: 12, d: 5, standards: ["12기하01-02"], strategy: "triangle-inequality-extremum", evidence: "application" }],
);

// ===================================================================================================================================
// 17. distance between two points in space
add(
  "geo_spaceDist",
  {
    ko: ["좌표공간의 두 점 $A{pa}$, $B{pb}$ 사이의 거리는? (숫자만 쓰세요)", ["좌표공간의 두 점 $(x_1,\\ y_1,\\ z_1)$, $(x_2,\\ y_2,\\ z_2)$ 사이의 거리는 $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}$ 예요.", "세 좌표의 차를 먼저 구하세요."], "$AB=\\sqrt{({dx})^2+({dy})^2+({dz})^2}=\\sqrt{{sq}}={ans}$ 입니다."],
    en: ["What is the distance between the points $A{pa}$ and $B{pb}$ in space? (digits only)", ["The distance between $(x_1,\\ y_1,\\ z_1)$ and $(x_2,\\ y_2,\\ z_2)$ is $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}$.", "Find the three coordinate differences first."], "$AB=\\sqrt{({dx})^2+({dy})^2+({dz})^2}=\\sqrt{{sq}}={ans}$."],
  },
  (r) => {
    const A = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)], { d, L } = quadVec(r), B = A.map((x, i) => x + d[i]);
    return { v: { pa: vt(A), pb: vt(B), dx: d[0], dy: d[1], dz: d[2], sq: L * L }, ans: L };
  },
  [{ skill: G2, levels: [1], count: 12, d: 1, standards: ["12기하02-04"], strategy: "distance-formula-3d", evidence: "calc" }],
);

// ===================================================================================================================================
// 18. internal division point in space
add(
  "geo_divPoint",
  {
    ko: ["좌표공간의 두 점 $A{pa}$, $B{pb}$ 에 대하여 점 P는 선분 AB 위의 점이고 $AP:PB={m}:{n}$ 이다. 점 P의 세 좌표의 합은? (숫자만 쓰세요)", ["선분 AB를 $m:n$ 으로 내분하는 점의 좌표는 $\\left(\\frac{mx_2+nx_1}{m+n},\\ \\frac{my_2+ny_1}{m+n},\\ \\frac{mz_2+nz_1}{m+n}\\right)$ 예요.", "각 좌표를 따로 계산하세요."], "$P=\\left(\\frac{{n}\\,x_A+{m}\\,x_B}{{mn}},\\ \\frac{{n}\\,y_A+{m}\\,y_B}{{mn}},\\ \\frac{{n}\\,z_A+{m}\\,z_B}{{mn}}\\right)={pp}$ 이므로 세 좌표의 합은 ${ans}$ 입니다."],
    en: ["For the points $A{pa}$ and $B{pb}$ in space, the point P lies on segment AB with $AP:PB={m}:{n}$. What is the sum of the three coordinates of P? (digits only)", ["The point dividing AB internally in the ratio $m:n$ is $\\left(\\frac{mx_2+nx_1}{m+n},\\ \\frac{my_2+ny_1}{m+n},\\ \\frac{mz_2+nz_1}{m+n}\\right)$.", "Compute each coordinate separately."], "$P=\\left(\\frac{{n}\\,x_A+{m}\\,x_B}{{mn}},\\ \\frac{{n}\\,y_A+{m}\\,y_B}{{mn}},\\ \\frac{{n}\\,z_A+{m}\\,z_B}{{mn}}\\right)={pp}$, so the sum of the coordinates is ${ans}$."],
  },
  (r) => {
    for (;;) {
      const m = r.int(1, 4), n = r.int(1, 4), A = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)], w = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)];
      if (w.every((x) => x === 0)) continue;
      const B = A.map((x, i) => x + (m + n) * w[i]), P = A.map((x, i) => x + m * w[i]);
      return { v: { pa: vt(A), pb: vt(B), m, n, mn: m + n, pp: vt(P) }, ans: P[0] + P[1] + P[2] };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 2, standards: ["12기하02-04"], strategy: "section-formula-3d", evidence: "calc" }],
);

// ===================================================================================================================================
// 19. where does a segment cross a coordinate plane: the ratio
add(
  "geo_divRatioPlane",
  {
    ko: ["좌표공간의 두 점 $A{pa}$, $B{pb}$ 에 대하여 선분 AB가 평면 ${pl}$ 과 만나는 점을 P라 하자. $AP:PB=m:n$ ($m$, $n$ 은 서로소인 자연수)일 때, $m+n$ 의 값은? (숫자만 쓰세요)", ["평면 ${pl}$ 위의 점은 한 좌표가 $0$ 이에요.", "선분 AB를 $s:t$ 로 내분하는 점의 그 좌표를 $s$, $t$ 로 나타내고 $0$ 과 같다고 놓으세요."], "$AP:PB=s:t$ 라 하면 점 P의 해당 좌표는 $\\frac{t\\cdot({za})+s\\cdot({zb})}{s+t}=0$ 이어야 하므로 $s:t=|{za}|:|{zb}|={ua}:{ub}$ 입니다. 서로소로 약분하면 ${m}:{n}$ 이므로 $m+n={ans}$ 입니다."],
    en: ["For the points $A{pa}$ and $B{pb}$ in space, the segment AB meets the plane ${pl}$ at the point P. If $AP:PB=m:n$ with $m$, $n$ coprime positive integers, what is $m+n$? (digits only)", ["A point of the plane ${pl}$ has one coordinate equal to $0$.", "Write that coordinate of the point dividing AB internally in the ratio $s:t$ in terms of $s$ and $t$ and set it equal to $0$."], "Let $AP:PB=s:t$. The relevant coordinate of P is $\\frac{t\\cdot({za})+s\\cdot({zb})}{s+t}=0$, so $s:t=|{za}|:|{zb}|={ua}:{ub}$. In lowest terms this is ${m}:{n}$, so $m+n={ans}$."],
  },
  (r) => {
    const idx = r.int(0, 2), u = r.int(1, 9), w = r.int(1, 9), sn = sgn(r), g = gcd(u, w);
    const A = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)], B = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)];
    A[idx] = sn * u; B[idx] = -sn * w;
    return { v: { pa: vt(A), pb: vt(B), pl: `${AX[idx]}=0`, za: A[idx], zb: B[idx], ua: u, ub: w, m: u / g, n: w / g }, ans: (u + w) / g };
  },
  [{ skill: G2, levels: [1], count: 12, d: 3, standards: ["12기하02-04"], strategy: "section-ratio-reverse", evidence: "reverse" }],
);

// ===================================================================================================================================
// 20. sphere equation in expanded form: unknown constant from the radius
add(
  "geo_sphereExpand",
  {
    ko: ["방정식 ${eq}$ 이 반지름의 길이가 ${rad}$ 인 구를 나타낼 때, 상수 $s$ 의 값은? (숫자만 쓰세요)", ["$x$, $y$, $z$ 에 대해 각각 완전제곱식으로 고쳐서 $(x-a)^2+(y-b)^2+(z-c)^2=r^2$ 꼴로 만드세요.", "우변이 $r^2={rad2}$ 이어야 해요."], "완전제곱식으로 고치면 ${std}$ 입니다. 반지름의 제곱이 ${s4}-s={rad2}$ 이므로 $s={s4}-{rad2}={ans}$ 입니다."],
    en: ["The equation ${eq}$ represents a sphere of radius ${rad}$. What is the constant $s$? (digits only)", ["Complete the square in $x$, $y$ and $z$ to reach $(x-a)^2+(y-b)^2+(z-c)^2=r^2$.", "The right-hand side must equal $r^2={rad2}$."], "Completing the squares gives ${std}$. The squared radius is ${s4}-s={rad2}$, so $s={s4}-{rad2}={ans}$."],
  },
  (r) => {
    for (;;) {
      const R = r.int(2, 9), p = 2 * r.int(-4, 4), q = 2 * r.int(-4, 4), w = 2 * r.int(-4, 4);
      if ([p, q, w].filter((x) => x !== 0).length < 2) continue;
      const s4 = (p * p + q * q + w * w) / 4, s = s4 - R * R;
      return { v: { eq: `${pe([[1, "x^2"], [1, "y^2"], [1, "z^2"], [p, "x"], [q, "y"], [w, "z"]])}+s=0`, rad: R, rad2: R * R, s4, std: `${sq2("x", -p / 2)}+${sq2("y", -q / 2)}+${sq2("z", -w / 2)}=${s4}-s` }, ans: s };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 3, standards: ["12기하02-05"], strategy: "sphere-complete-square", evidence: "reverse" }],
);

// ===================================================================================================================================
// 21. cross-section of a sphere by a coordinate-parallel plane
add(
  "geo_sphereSection",
  {
    ko: ["구 ${eq}$ 의 평면 ${pl}$ 에 의한 단면은 원이다. 이 원의 넓이를 $m\\pi$ 라 할 때, 자연수 $m$ 의 값은? (숫자만 쓰세요)", ["구의 중심과 반지름의 제곱을 방정식에서 읽으세요.", "중심에서 평면까지의 거리 $d$ 를 구하면 단면의 반지름 $r$ 은 $r^2=R^2-d^2$ 예요."], "구의 중심은 ${cc}$, 반지름의 제곱은 $R^2={rr2}$ 입니다. 중심에서 평면 ${pl}$ 까지의 거리가 $d={dd}$ 이므로 단면의 원의 반지름의 제곱은 ${rr2}-{dd}^2={ans}$ 이고 넓이는 ${ans}\\pi$ 입니다."],
    en: ["The cross-section of the sphere ${eq}$ by the plane ${pl}$ is a circle of area $m\\pi$. What is the natural number $m$? (digits only)", ["Read the center and the squared radius from the equation.", "If $d$ is the distance from the center to the plane, the radius $r$ of the circle satisfies $r^2=R^2-d^2$."], "The center is ${cc}$ and $R^2={rr2}$. The distance from the center to the plane ${pl}$ is $d={dd}$, so the circle has $r^2={rr2}-{dd}^2={ans}$ and its area is ${ans}\\pi$."],
  },
  (r) => {
    for (;;) {
      const C = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)], R2 = r.int(10, 80), idx = r.int(0, 2), d = r.int(0, 8), kk = C[idx] + sgn(r) * d;
      if (d * d >= R2) continue;
      return { v: { eq: `${sq2("x", C[0])}+${sq2("y", C[1])}+${sq2("z", C[2])}=${R2}`, pl: `${AX[idx]}=${kk}`, cc: vt(C), rr2: R2, dd: d }, ans: R2 - d * d };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 3, standards: ["12기하02-05"], strategy: "sphere-plane-section", evidence: "application" }],
);

// ===================================================================================================================================
// 22. plane tangent to a sphere
add(
  "geo_sphereTangentPlane",
  {
    ko: ["중심이 $C{cc}$ 이고 반지름의 길이가 ${rad}$ 인 구에 접하는 평면 ${pl}$ 에 대하여, 상수 $k$ 의 값 중 큰 것은? (숫자만 쓰세요)", ["접하면 구의 중심에서 평면까지의 거리가 반지름과 같아요.", "점 $(x_0,\\ y_0,\\ z_0)$ 과 평면 $ax+by+cz=k$ 사이의 거리는 $\\frac{|ax_0+by_0+cz_0-k|}{\\sqrt{a^2+b^2+c^2}}$ 예요."], "법선벡터 $({nv})$ 의 크기는 ${nn}$ 이고 중심을 평면의 식에 대입하면 ${dc}$ 입니다. 거리 $\\frac{|{dc}-k|}{{nn}}={rad}$ 에서 $|{dc}-k|={rl}$ 이므로 $k={dc}\\pm{rl}$ 이고, 큰 값은 ${ans}$ 입니다."],
    en: ["The plane ${pl}$ is tangent to the sphere with center $C{cc}$ and radius ${rad}$. What is the larger value of the constant $k$? (digits only)", ["Tangency means the distance from the center to the plane equals the radius.", "The distance from $(x_0,\\ y_0,\\ z_0)$ to the plane $ax+by+cz=k$ is $\\frac{|ax_0+by_0+cz_0-k|}{\\sqrt{a^2+b^2+c^2}}$."], "The normal vector $({nv})$ has length ${nn}$, and substituting the center into the left side gives ${dc}$. From $\\frac{|{dc}-k|}{{nn}}={rad}$ we get $|{dc}-k|={rl}$, so $k={dc}\\pm{rl}$, and the larger value is ${ans}$."],
  },
  (r) => {
    const { d, L } = quadVec(r), C = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)], R = r.int(1, 5), dc = dot3(d, C);
    return { v: { cc: vt(C), rad: R, pl: `${pe([[d[0], "x"], [d[1], "y"], [d[2], "z"]])}=k`, nv: d.join(",\\ "), nn: L, dc, rl: R * L }, ans: dc + R * L };
  },
  [{ skill: G2, levels: [1], count: 12, d: 4, standards: ["12기하02-05", "12기하03-05"], strategy: "tangent-plane-distance", evidence: "reverse" }],
);

// ===================================================================================================================================
// 23. norm of a linear combination of vectors
const lcText = (k, l) => `${k === 1 ? "" : k === -1 ? "-" : k}\\vec a${l > 0 ? "+" : ""}${l === 1 ? "" : l === -1 ? "-" : l}\\vec b`;
add(
  "geo_vecLinComb",
  {
    ko: ["$\\vec a={va}$, $\\vec b={vb}$ 일 때, $|{ex}|$ 의 값은? (숫자만 쓰세요)", ["벡터의 합과 실수배는 성분끼리 계산해요.", "먼저 ${ex}$ 의 성분을 구한 뒤, 성분의 제곱의 합의 양의 제곱근을 구하세요."], "${ex}={wv}$ 이므로 $|{ex}|=\\sqrt{{nn}}={ans}$ 입니다."],
    en: ["For $\\vec a={va}$ and $\\vec b={vb}$, what is $|{ex}|$? (digits only)", ["Sums and scalar multiples of vectors are computed component by component.", "Find the components of ${ex}$ first, then the square root of the sum of squares."], "${ex}={wv}$, so $|{ex}|=\\sqrt{{nn}}={ans}$."],
  },
  (r, lvl) => {
    const dim = lvl === 1 ? 2 : 3;
    for (;;) {
      const a = Array.from({ length: dim }, () => r.int(-5, 5)), b = Array.from({ length: dim }, () => r.int(-5, 5)), k = r.nonzero(-4, 4), l = r.nonzero(-4, 4);
      if (a.every((x) => x === 0) || b.every((x) => x === 0)) continue;
      if (dim === 2 && a[0] * b[1] - a[1] * b[0] === 0) continue;
      const w = a.map((x, i) => k * x + l * b[i]), nn = w.reduce((s, x) => s + x * x, 0), L = Math.round(Math.sqrt(nn));
      if (nn === 0 || L * L !== nn) continue;
      return { v: { va: vt(a), vb: vt(b), ex: lcText(k, l), wv: vt(w), nn }, ans: L };
    }
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 2, standards: ["12기하03-01", "12기하03-02"], strategy: "component-arithmetic", evidence: "calc" }],
);

// ===================================================================================================================================
// 24. express a vector in terms of two others
add(
  "geo_vecDecompose",
  {
    ko: ["$\\vec a={va}$, $\\vec b={vb}$, $\\vec c={vc}$ 일 때, $\\vec c=m\\vec a+n\\vec b$ 를 만족시키는 실수 $m$, $n$ 에 대하여 ${ask}$ 의 값은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["$m\\vec a+n\\vec b$ 의 성분을 $m$, $n$ 으로 나타내어 $\\vec c$ 의 성분과 같다고 놓으세요.", "두 성분에서 얻은 $m$, $n$ 에 대한 연립방정식을 푸세요."], "성분을 비교하면 ${eqs}$ 이므로 $m={mt}$, $n={nt}$ 입니다. 따라서 ${ask}={ans}$ 입니다."],
    en: ["For $\\vec a={va}$, $\\vec b={vb}$, $\\vec c={vc}$, real numbers $m$, $n$ satisfy $\\vec c=m\\vec a+n\\vec b$. What is the value of ${ask}$? (decimal or fraction such as 3/4)", ["Write the components of $m\\vec a+n\\vec b$ in terms of $m$ and $n$ and equate them with those of $\\vec c$.", "Solve the simultaneous equations for $m$ and $n$ obtained from two components."], "Comparing components gives ${eqs}$, so $m={mt}$ and $n={nt}$. Hence ${ask}={ans}$."],
  },
  (r, lvl) => {
    for (;;) {
      const dim = lvl === 1 ? 2 : 3, a = Array.from({ length: dim }, () => r.int(-4, 4)), b = Array.from({ length: dim }, () => r.int(-4, 4));
      const mi = r.nonzero(-6, 6), ni = r.nonzero(-6, 6), den = lvl === 1 ? 1 : 2;
      const c = a.map((x, i) => (mi * x + ni * b[i]) / den);
      if (!c.every(Number.isInteger)) continue;
      // pick two components with a non-zero determinant
      let pair = null;
      for (const [i, j] of [[0, 1], [0, 2], [1, 2]].slice(0, dim === 2 ? 1 : 3)) if (a[i] * b[j] - a[j] * b[i] !== 0) { pair = [i, j]; break; }
      if (!pair) continue;
      if (c.every((x) => x === 0)) continue;
      const w1 = r.int(1, 3), w2 = sgn(r) * r.int(1, 3), mq = fq(mi, den), nq = fq(ni, den);
      const ans = mq.mul(w1).add(nq.mul(w2));
      const ask = `${w1 === 1 ? "" : w1}m${w2 > 0 ? "+" : "-"}${Math.abs(w2) === 1 ? "" : Math.abs(w2)}n`;
      const [i, j] = pair;
      return { v: { va: vt(a), vb: vt(b), vc: vt(c), ask, eqs: `${pe([[a[i], "m"], [b[i], "n"]])}=${c[i]},\\ ${pe([[a[j], "m"], [b[j], "n"]])}=${c[j]}`, mt: tq(mq), nt: tq(nq) }, ans: ans.toNumber() };
    }
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 3, standards: ["12기하03-01", "12기하03-02"], strategy: "vector-decomposition", evidence: "reverse" }],
);

// ===================================================================================================================================
// 25. |ka + lb|^2 from |a|, |b|, a.b
const exText = (k, l) => lcText(k, l);
add(
  "geo_dotNormExpand",
  {
    ko: ["두 벡터 $\\vec a$, $\\vec b$ 에 대하여 $|\\vec a|={na}$, $|\\vec b|={nb}$, $\\vec a\\cdot\\vec b={dt}$ 일 때, $|{ex}|^2$ 의 값은? (숫자만 쓰세요)", ["$|\\vec x|^2=\\vec x\\cdot\\vec x$ 이므로 ${ex}$ 를 자기 자신과 내적하여 전개하세요.", "$|\\vec a|^2$, $|\\vec b|^2$, $\\vec a\\cdot\\vec b$ 로 나타내어 값을 대입하세요."], "$|{ex}|^2={calc}={ans}$ 입니다."],
    en: ["For vectors $\\vec a$ and $\\vec b$ with $|\\vec a|={na}$, $|\\vec b|={nb}$ and $\\vec a\\cdot\\vec b={dt}$, what is $|{ex}|^2$? (digits only)", ["Since $|\\vec x|^2=\\vec x\\cdot\\vec x$, expand the dot product of ${ex}$ with itself.", "Express it with $|\\vec a|^2$, $|\\vec b|^2$ and $\\vec a\\cdot\\vec b$ and substitute."], "$|{ex}|^2={calc}={ans}$."],
  },
  (r, lvl) => {
    for (;;) {
      const na = r.int(1, 8), nb = r.int(1, 8), dt = r.int(-na * nb + 1, na * nb - 1);
      const k = lvl === 1 ? sgn(r) : r.nonzero(-3, 3), l = lvl === 1 ? sgn(r) : r.nonzero(-3, 3);
      const val = k * k * na * na + 2 * k * l * dt + l * l * nb * nb;
      if (val <= 0) continue;
      return { v: { na, nb, dt, ex: exText(k, l), calc: `${k * k}\\times ${na * na}+(${2 * k * l})(${dt})+${l * l}\\times ${nb * nb}` }, ans: val };
    }
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 2, standards: ["12기하03-03"], strategy: "dot-product-expansion", evidence: "calc" }],
);

// ===================================================================================================================================
// 26. a.b from |a|, |b| and |a +- b|
add(
  "geo_dotFromNorms",
  {
    ko: ["두 벡터 $\\vec a$, $\\vec b$ 에 대하여 $|\\vec a|={na}$, $|\\vec b|={nb}$, $|{ex}|={uu}$ 일 때, $\\vec a\\cdot\\vec b$ 의 값은? (숫자만 쓰세요)", ["$|{ex}|^2$ 을 $|\\vec a|^2$, $|\\vec b|^2$, $\\vec a\\cdot\\vec b$ 로 전개하세요.", "전개한 식에 주어진 크기의 값을 대입하면 $\\vec a\\cdot\\vec b$ 에 대한 일차방정식이 돼요."], "$|{ex}|^2={na2}+{nb2}{sgn}2\\,\\vec a\\cdot\\vec b={uu2}$ 이므로 $\\vec a\\cdot\\vec b={ans}$ 입니다."],
    en: ["For vectors $\\vec a$ and $\\vec b$ with $|\\vec a|={na}$, $|\\vec b|={nb}$ and $|{ex}|={uu}$, what is $\\vec a\\cdot\\vec b$? (digits only)", ["Expand $|{ex}|^2$ in terms of $|\\vec a|^2$, $|\\vec b|^2$ and $\\vec a\\cdot\\vec b$.", "Substituting the given lengths gives a linear equation in $\\vec a\\cdot\\vec b$."], "$|{ex}|^2={na2}+{nb2}{sgn}2\\,\\vec a\\cdot\\vec b={uu2}$, so $\\vec a\\cdot\\vec b={ans}$."],
  },
  (r) => {
    for (;;) {
      const na = r.int(2, 10), nb = r.int(2, 10), dt = r.int(-na * nb + 1, na * nb - 1), plus = r.next() < 0.5;
      const u2 = na * na + nb * nb + (plus ? 2 : -2) * dt, u = Math.round(Math.sqrt(Math.max(u2, 0)));
      if (u2 <= 0 || u * u !== u2) continue;
      return { v: { na, nb, uu: u, ex: plus ? "\\vec a+\\vec b" : "\\vec a-\\vec b", na2: na * na, nb2: nb * nb, sgn: plus ? "+" : "-", uu2: u2 }, ans: dt };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 3, standards: ["12기하03-03"], strategy: "polarization", evidence: "reverse" }],
);

// ===================================================================================================================================
// 27. angle between two vectors
const COS_TAB = { "1/2": [[45, "\\frac{\\sqrt{2}}{2}"], [135, "-\\frac{\\sqrt{2}}{2}"]], "1/4": [[60, "\\frac{1}{2}"], [120, "-\\frac{1}{2}"]], "3/4": [[30, "\\frac{\\sqrt{3}}{2}"], [150, "-\\frac{\\sqrt{3}}{2}"]], "0": [[90, "0"], [90, "0"]] };
add(
  "geo_dotAngle",
  {
    ko: ["$\\vec a={va}$, $\\vec b={vb}$ 가 이루는 각의 크기를 $\\theta$ ($0^\\circ\\le\\theta\\le180^\\circ$) 라 할 때, $\\theta$ 는 몇 도인가요? (숫자만 쓰세요)", ["두 벡터가 이루는 각의 코사인은 $\\cos\\theta=\\frac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$ 예요.", "내적과 두 벡터의 크기를 각각 구하세요."], "$\\vec a\\cdot\\vec b={dt}$, $|\\vec a||\\vec b|=\\sqrt{{na2}}\\sqrt{{nb2}}$ 이므로 $\\cos\\theta={cs}$ 입니다. $0^\\circ\\le\\theta\\le180^\\circ$ 에서 $\\theta={ans}^\\circ$ 입니다."],
    en: ["Let $\\theta$ ($0^\\circ\\le\\theta\\le180^\\circ$) be the angle between $\\vec a={va}$ and $\\vec b={vb}$. How many degrees is $\\theta$? (digits only)", ["The cosine of the angle is $\\cos\\theta=\\frac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$.", "Compute the dot product and the two lengths."], "$\\vec a\\cdot\\vec b={dt}$ and $|\\vec a||\\vec b|=\\sqrt{{na2}}\\sqrt{{nb2}}$, so $\\cos\\theta={cs}$. For $0^\\circ\\le\\theta\\le180^\\circ$ this gives $\\theta={ans}^\\circ$."],
  },
  (r, lvl) => {
    const dim = lvl === 1 ? 2 : 3, M = lvl === 1 ? 6 : 3;
    for (let tries = 0; tries < 100000; tries++) {
      const a = Array.from({ length: dim }, () => r.int(-M, M)), b = Array.from({ length: dim }, () => r.int(-M, M));
      const na2 = dot3(a, a), nb2 = dot3(b, b), dt = dot3(a, b);
      if (!na2 || !nb2) continue;
      const num = dt * dt, den = na2 * nb2;
      let key = null;
      if (num === 0) key = "0"; else if (2 * num === den) key = "1/2"; else if (4 * num === den) key = "1/4"; else if (4 * num * 1 === 3 * den) key = "3/4";
      if (!key) continue;
      if (lvl === 1 && key === "0" && r.next() < 0.6) continue;
      const [deg, cs] = COS_TAB[key][dt >= 0 ? 0 : 1];
      if (dt === 0 && key !== "0") continue;
      return { v: { va: vt(a), vb: vt(b), dt, na2, nb2, cs }, ans: deg };
    }
    throw new Error("geo_dotAngle: no sample");
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 3, standards: ["12기하03-03"], strategy: "angle-from-dot", evidence: "application" }],
);

// ===================================================================================================================================
// 28. unknown t in a dot-product condition
const comp = (c, d) => (c === 0 ? String(d) : lin(c, d, "t"));
add(
  "geo_vecOrthoParam",
  {
    ko: ["두 벡터 $\\vec a={va}$, $\\vec b={vb}$ 에 대하여 $\\vec a\\cdot\\vec b={dd}$ 일 때, 실수 $t$ 의 값 중 가장 큰 것은? (숫자만 쓰세요)", ["성분끼리 곱해서 더하여 $\\vec a\\cdot\\vec b$ 를 $t$ 에 대한 식으로 나타내세요.", "얻은 방정식을 풀어 $t$ 의 값을 모두 구한 뒤 가장 큰 것을 고르세요."], "$\\vec a\\cdot\\vec b={dexp}$ 이므로 방정식 ${dexp}={dd}$ 의 해는 ${sol}$ 입니다. 이 중 가장 큰 값은 ${ans}$ 입니다."],
    en: ["For vectors $\\vec a={va}$ and $\\vec b={vb}$, what is the largest real number $t$ with $\\vec a\\cdot\\vec b={dd}$? (digits only)", ["Multiply the components and add to write $\\vec a\\cdot\\vec b$ as an expression in $t$.", "Solve the resulting equation for all $t$ and pick the largest."], "$\\vec a\\cdot\\vec b={dexp}$, so solving ${dexp}={dd}$ gives ${sol}$. The largest value is ${ans}$."],
  },
  (r, lvl) => {
    if (lvl === 1) {
      const dim = r.int(2, 3);
      for (;;) {
        const ia = r.int(0, dim - 1); let ib = r.int(0, dim - 1); if (ib === ia) ib = (ia + 1) % dim;
        const ac = Array(dim).fill(0), bc = Array(dim).fill(0); ac[ia] = sgn(r) * r.int(1, 3); if (r.next() < 0.7) bc[ib] = sgn(r) * r.int(1, 3);
        const ad = Array.from({ length: dim }, () => r.int(-5, 5)), bd = Array.from({ length: dim }, () => r.int(-5, 5));
        const f = (t) => ad.reduce((s, _, i) => s + (ac[i] * t + ad[i]) * (bc[i] * t + bd[i]), 0), M = f(0), K = f(1) - f(0);
        if (K === 0 || M % K !== 0) continue;
        const t0 = -M / K;
        return { v: { va: vt(ad.map((d, i) => comp(ac[i], d))), vb: vt(bd.map((d, i) => comp(bc[i], d))), dd: 0, dexp: pe([[K, "t"], [M, ""]]), sol: `t=${t0}` }, ans: t0 };
      }
    }
    const dim = r.int(2, 3), t1 = r.int(-6, 6);
    for (;;) {
      const t2 = r.int(-6, 6), al = r.int(-4, 4);
      if (t1 === t2) continue;
      const be = -(t1 + t2) - al, rest = Array.from({ length: dim - 1 }, () => [r.int(-4, 4), r.int(-4, 4)]), R = rest.reduce((s, [x, y]) => s + x * y, 0), s = al * be + R - t1 * t2;
      return { v: { va: vt([lin(1, al, "t"), ...rest.map((p) => p[0])]), vb: vt([lin(1, be, "t"), ...rest.map((p) => p[1])]), dd: s, dexp: pe([[1, "t^2"], [al + be, "t"], [al * be + R, ""]]), sol: `t=${Math.min(t1, t2)},\\ ${Math.max(t1, t2)}` }, ans: Math.max(t1, t2) };
    }
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 3, standards: ["12기하03-03"], strategy: "dot-condition-parameter", evidence: "reverse" }],
);

// ===================================================================================================================================
// 29. the vector equation (p - a).(p - b) = 0
add(
  "geo_vecCircleEq",
  {
    ko: ["점 $A{pa}$, $B{pb}$ 의 위치벡터를 각각 $\\vec a$, $\\vec b$ 라 하고, 점 P의 위치벡터를 $\\vec p$ 라 하자. $(\\vec p-\\vec a)\\cdot(\\vec p-\\vec b)=0$ 을 만족시키는 점 P 전체가 이루는 도형(원 또는 구)의 반지름의 길이는? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["$(\\vec p-\\vec a)\\cdot(\\vec p-\\vec b)=0$ 은 두 벡터 $\\vec p-\\vec a$, $\\vec p-\\vec b$ 가 수직이라는 뜻이에요.", "점 P에서 선분 AB를 바라보는 각이 직각이니, 선분 AB가 지름이에요."], "$(\\vec p-\\vec a)\\cdot(\\vec p-\\vec b)=0$ 은 P가 선분 AB를 지름으로 하는 원(구) 위에 있음을 뜻합니다. $AB={ab}$ 이므로 반지름의 길이는 $\\frac{1}{2}AB={ans}$ 입니다."],
    en: ["Let $\\vec a$ and $\\vec b$ be the position vectors of the points $A{pa}$ and $B{pb}$, and let $\\vec p$ be the position vector of a point P. The points P satisfying $(\\vec p-\\vec a)\\cdot(\\vec p-\\vec b)=0$ form a circle or a sphere. What is its radius? (decimal or fraction such as 3/4)", ["$(\\vec p-\\vec a)\\cdot(\\vec p-\\vec b)=0$ says that the vectors $\\vec p-\\vec a$ and $\\vec p-\\vec b$ are perpendicular.", "So the angle subtended by AB at P is a right angle, and AB is a diameter."], "$(\\vec p-\\vec a)\\cdot(\\vec p-\\vec b)=0$ means P lies on the circle (sphere) with diameter AB. Since $AB={ab}$, the radius is $\\frac{1}{2}AB={ans}$."],
  },
  (r, lvl) => {
    if (lvl === 1) {
      const t = r.pick(TRIS17), A = [r.int(-6, 6), r.int(-6, 6)], dv = shuf3(r, [t[0], t[1]]).slice(0, 2).map((x) => x * sgn(r));
      const B = A.map((x, i) => x + dv[i]);
      return { v: { pa: vt(A), pb: vt(B), ab: t[2] }, ans: t[2] / 2 };
    }
    const { d, L } = quadVec(r), A = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)], B = A.map((x, i) => x + d[i]);
    return { v: { pa: vt(A), pb: vt(B), ab: L }, ans: L / 2 };
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 3, standards: ["12기하03-05", "12기하03-03"], strategy: "vector-equation-of-circle", evidence: "concept" }],
);

// ===================================================================================================================================
// 30. two lines in space meet: unknown direction component
add(
  "geo_lineIntersectParam",
  {
    ko: ["공간에서 두 직선 ${l1}$, ${l2}$ 가 한 점에서 만날 때, 상수 $k$ 의 값은? (숫자만 쓰세요)", ["각 직선의 공통값을 $s$, $t$ 로 놓고 직선 위의 점의 좌표를 $s$, $t$ 로 나타내세요.", "$x$, $y$ 좌표가 같다는 식에서 $s$, $t$ 를 구한 뒤 $z$ 좌표를 비교하세요."], "첫째 직선의 공통값을 $s$, 둘째 직선의 공통값을 $t$ 라 하면 $x$, $y$ 좌표가 같아야 하므로 ${xy}$ 이고, 풀면 $s={ss}$, $t={tt}$ 입니다. $z$ 좌표가 같아야 하므로 ${eq3}$ 이고 $k={ans}$ 입니다."],
    en: ["The two lines ${l1}$ and ${l2}$ in space meet in a point. What is the value of the constant $k$? (digits only)", ["Call the common values of the two lines $s$ and $t$ and write the points of each line using $s$ and $t$.", "Solve for $s$ and $t$ from the equal $x$- and $y$-coordinates, then compare the $z$-coordinates."], "Let $s$ and $t$ be the common values of the first and second line. The $x$- and $y$-coordinates must agree: ${xy}$, which gives $s={ss}$, $t={tt}$. The $z$-coordinates must agree: ${eq3}$, so $k={ans}$."],
  },
  (r) => {
    for (;;) {
      const P = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)], u = [r.nonzero(-3, 3), r.nonzero(-3, 3), r.nonzero(-3, 3)];
      const v1 = r.nonzero(-3, 3), v2 = r.nonzero(-3, 3), k0 = r.nonzero(-4, 4), s = r.nonzero(-3, 3), t = r.nonzero(-3, 3);
      if (u[0] * v2 - u[1] * v1 === 0) continue;
      const A = P.map((x, i) => x - s * u[i]), B = [P[0] - t * v1, P[1] - t * v2, P[2] - t * k0];
      const l1 = `\\frac{${nm("x", A[0])}}{${u[0]}}=\\frac{${nm("y", A[1])}}{${u[1]}}=\\frac{${nm("z", A[2])}}{${u[2]}}`;
      const l2 = `\\frac{${nm("x", B[0])}}{${v1}}=\\frac{${nm("y", B[1])}}{${v2}}=\\frac{${nm("z", B[2])}}{k}`;
      const xy = `${pe([[u[0], "s"], [A[0], ""]])}=${pe([[v1, "t"], [B[0], ""]])},\\ ${pe([[u[1], "s"], [A[1], ""]])}=${pe([[v2, "t"], [B[1], ""]])}`;
      return { v: { l1, l2, xy, ss: s, tt: t, eq3: `${P[2]}=${pe([[t, "k"], [B[2], ""]])}` }, ans: k0 };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 4, standards: ["12기하03-04"], strategy: "line-intersection-parameter", evidence: "reverse" }],
);

// ===================================================================================================================================
// 31. a point of a line in symmetric form
add(
  "geo_lineSpacePoint",
  {
    ko: ["직선 ${ln}$ 위의 점 중에서 ${cond}$ 인 점이 있다. 이 점의 나머지 두 좌표의 합은? (숫자만 쓰세요)", ["세 분수의 공통값을 $s$ 라 하면 $x$, $y$, $z$ 를 모두 $s$ 로 나타낼 수 있어요.", "주어진 조건 ${cond}$ 로 $s$ 를 먼저 구하세요."], "공통값을 $s$ 라 하면 $(x,\\ y,\\ z)=({par})$ 입니다. ${cond}$ 에서 $s={ss}$ 이므로 이 점은 ${pt}$ 이고, 나머지 두 좌표의 합은 ${ans}$ 입니다."],
    en: ["A point on the line ${ln}$ satisfies ${cond}$. What is the sum of its other two coordinates? (digits only)", ["Let the common value of the three fractions be $s$; then $x$, $y$ and $z$ can all be written with $s$.", "Use the given condition ${cond}$ to find $s$ first."], "Let the common value be $s$; then $(x,\\ y,\\ z)=({par})$. From ${cond}$ we get $s={ss}$, so the point is ${pt}$ and the sum of the other two coordinates is ${ans}$."],
  },
  (r) => {
    for (;;) {
      const P0 = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)], u = [r.nonzero(-4, 4), r.nonzero(-4, 4), r.nonzero(-4, 4)], s = r.int(-3, 3), idx = r.int(0, 2);
      const pt = P0.map((x, i) => x + s * u[i]);
      const ln = `\\frac{${nm("x", P0[0])}}{${u[0]}}=\\frac{${nm("y", P0[1])}}{${u[1]}}=\\frac{${nm("z", P0[2])}}{${u[2]}}`;
      const par = P0.map((x, i) => pe([[u[i], "s"], [x, ""]])).join(",\\ ");
      return { v: { ln, cond: `${AX[idx]}=${pt[idx]}`, par, ss: s, pt: vt(pt) }, ans: pt[(idx + 1) % 3] + pt[(idx + 2) % 3] };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 2, standards: ["12기하03-04"], strategy: "line-symmetric-form", evidence: "representation" }],
);

// ===================================================================================================================================
// 32. line in the plane given by a point and a direction vector meets another line
add(
  "geo_lineVec2D",
  {
    ko: ["좌표평면 위의 점 A의 좌표는 $({x1},\\ {y1})$ 이다. 점 A를 지나고 방향벡터가 $\\vec u=({u1},\\ {u2})$ 인 직선과 직선 ${ln}$ 의 교점의 좌표를 $(a,\\ b)$ 라 할 때, $a+b$ 의 값은? (숫자만 쓰세요)", ["방향벡터가 $\\vec u$ 이고 점 A를 지나는 직선 위의 점은 $(x,\\ y)=A+t\\vec u$ 꼴이에요.", "이 점의 좌표를 직선 ${ln}$ 의 방정식에 대입하여 $t$ 를 구하세요."], "직선 위의 점은 $(x,\\ y)=({par})$ 이고 이를 ${ln}$ 에 대입하면 ${eqn}$ 이므로 $t={tt}$ 입니다. 교점은 ${pt}$ 이므로 $a+b={ans}$ 입니다."],
    en: ["In the coordinate plane the point A has coordinates $({x1},\\ {y1})$. The line through A with direction vector $\\vec u=({u1},\\ {u2})$ meets the line ${ln}$ at the point $(a,\\ b)$. What is $a+b$? (digits only)", ["A point of the line through A with direction $\\vec u$ has the form $(x,\\ y)=A+t\\vec u$.", "Substitute its coordinates into the equation ${ln}$ and solve for $t$."], "The points of the line are $(x,\\ y)=({par})$. Substituting into ${ln}$ gives ${eqn}$, so $t={tt}$. The intersection is ${pt}$, hence $a+b={ans}$."],
  },
  (r) => {
    for (;;) {
      const x1 = r.int(-5, 5), y1 = r.int(-5, 5), u1 = r.int(-3, 3), u2 = r.int(-3, 3), t0 = r.nonzero(-3, 3), p = r.int(-4, 4), q = r.int(-4, 4);
      if ((u1 === 0 && u2 === 0) || (p === 0 && q === 0) || p * u1 + q * u2 === 0) continue;
      const X = x1 + t0 * u1, Y = y1 + t0 * u2, rr = p * X + q * Y, K = p * u1 + q * u2, M = p * x1 + q * y1;
      return { v: { x1, y1, u1, u2, ln: `${pe([[p, "x"], [q, "y"]])}=${rr}`, par: `${pe([[u1, "t"], [x1, ""]])},\\ ${pe([[u2, "t"], [y1, ""]])}`, eqn: `${pe([[K, "t"], [M, ""]])}=${rr}`, tt: t0, pt: vt([X, Y]) }, ans: X + Y };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 2, standards: ["12기하03-04"], strategy: "parametric-line-intersection", evidence: "application" }],
);

// ===================================================================================================================================
// 33. plane through a point with a given normal vector: intercept on an axis
add(
  "geo_planeNormal",
  {
    ko: ["점 $A{pa}$ 에 대하여, 점 A를 지나고 벡터 $\\vec n=({vn})$ 에 수직인 평면이 ${ax}$축과 만나는 점의 ${ax}$좌표는? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["평면 위의 임의의 점 P의 위치벡터를 $\\vec p$ 라 하면 $\\vec n\\cdot(\\vec p-\\vec a)=0$ 이에요.", "먼저 평면의 방정식 $ax+by+cz=d$ 를 구한 뒤, ${ax}$축 위의 점은 나머지 두 좌표가 $0$ 임을 이용하세요."], "평면 위의 점 P에 대하여 $\\vec n\\cdot(\\vec p-\\vec a)=0$ 이므로 평면의 방정식은 ${plane}$ 입니다. ${ax}$축 위의 점은 나머지 두 좌표가 $0$ 이므로 ${solve}$ 에서 ${ax}$좌표는 ${ans}$ 입니다."],
    en: ["For the point $A{pa}$, the plane through A perpendicular to the vector $\\vec n=({vn})$ meets the ${ax}$-axis at a point. What is its ${ax}$-coordinate? (decimal or fraction such as 3/4)", ["For a point P of the plane with position vector $\\vec p$, $\\vec n\\cdot(\\vec p-\\vec a)=0$.", "First find the plane $ax+by+cz=d$; a point of the ${ax}$-axis has its other two coordinates equal to $0$."], "For P on the plane $\\vec n\\cdot(\\vec p-\\vec a)=0$, so the plane is ${plane}$. On the ${ax}$-axis the other two coordinates are $0$, so ${solve}$ and the ${ax}$-coordinate is ${ans}$."],
  },
  (r) => {
    for (;;) {
      const n = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)], A = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)], idx = r.int(0, 2);
      if (n[idx] === 0) continue;
      const d = dot3(n, A), q = fq(d, n[idx]);
      return { v: { pa: vt(A), vn: n.join(",\\ "), ax: AX[idx], plane: `${pe([[n[0], "x"], [n[1], "y"], [n[2], "z"]])}=${d}`, solve: `${n[idx]}${AX[idx]}=${d}` }, ans: q.toNumber() };
    }
  },
  [{ skill: G2, levels: [1], count: 12, d: 3, standards: ["12기하03-05"], strategy: "plane-from-normal", evidence: "application" }],
);

// ===================================================================================================================================
// 34. area of the orthogonal projection of a plane figure
add(
  "geo_projPlaneArea",
  {
    ko: ["평면 ${pl}$ 위에 있는 넓이가 ${ar}$ 인 도형을 ${cp}$평면에 정사영시킨 도형의 넓이는? (숫자만 쓰세요)", ["도형이 있는 평면과 ${cp}$평면이 이루는 각을 $\\theta$ 라 하면 정사영의 넓이는 (도형의 넓이)$\\times\\cos\\theta$ 예요.", "두 평면이 이루는 각은 두 평면의 법선벡터가 이루는 각과 같으므로 $\\cos\\theta$ 는 법선벡터로 구해요."], "평면 ${pl}$ 의 법선벡터는 $({nv})$ 이고 크기는 ${nn}$ 입니다. ${cp}$평면의 법선벡터와의 코사인은 $\\cos\\theta=\\frac{{ni}}{{nn}}$ 이므로 정사영의 넓이는 ${ar}\\times\\frac{{ni}}{{nn}}={ans}$ 입니다."],
    en: ["A figure of area ${ar}$ lies in the plane ${pl}$. What is the area of its orthogonal projection onto the ${cp}$-plane? (digits only)", ["If $\\theta$ is the angle between the plane of the figure and the ${cp}$-plane, the projected area is (area)$\\times\\cos\\theta$.", "The angle between two planes equals the angle between their normal vectors, so find $\\cos\\theta$ from the normals."], "The plane ${pl}$ has normal vector $({nv})$ of length ${nn}$. The cosine with the normal of the ${cp}$-plane is $\\cos\\theta=\\frac{{ni}}{{nn}}$, so the projected area is ${ar}\\times\\frac{{ni}}{{nn}}={ans}$."],
  },
  (r) => {
    const { d, L } = quadVec(r), cpI = r.int(0, 2), cp = ["xy", "yz", "zx"][cpI], u = r.int(1, 6), dd = r.nonzero(-12, 12), ni = Math.abs(d[[2, 0, 1][cpI]]);
    return { v: { pl: `${pe([[d[0], "x"], [d[1], "y"], [d[2], "z"]])}=${dd}`, cp, ar: L * u, nv: d.join(",\\ "), nn: L, ni }, ans: ni * u };
  },
  [{ skill: G2, levels: [1], count: 12, d: 3, standards: ["12기하02-03"], strategy: "projection-area-cosine", evidence: "application" }],
);

// ===================================================================================================================================
// 35. orthogonal projection of a circle is an ellipse
add(
  "geo_projEllipse",
  {
    ko: ["평면 $\\alpha$ 위에 반지름의 길이가 ${rr}$ 인 원이 있다. 이 원을 평면 $\\beta$ 에 정사영시키면 타원이 된다. 두 평면 $\\alpha$, $\\beta$ 가 이루는 각의 크기를 $\\theta$ 라 하고 $\\cos\\theta={cs}$ 일 때, 이 타원의 두 초점 사이의 거리는? (숫자만 쓰세요)", ["원의 지름 중 두 평면의 교선과 평행한 것은 길이가 변하지 않고, 수직인 것은 $\\cos\\theta$ 배로 줄어요.", "정사영된 타원의 장반지름과 단반지름을 구하고 $c=\\sqrt{a^2-b^2}$ 를 계산하세요."], "정사영한 타원의 장반지름은 $a={rr}$, 단반지름은 $b={rr}\\cos\\theta={bb}$ 입니다. $c=\\sqrt{{rr}^2-{bb}^2}={cc}$ 이므로 두 초점 사이의 거리는 $2c={ans}$ 입니다."],
    en: ["A circle of radius ${rr}$ lies in the plane $\\alpha$, and its orthogonal projection onto the plane $\\beta$ is an ellipse. Let $\\theta$ be the angle between the planes, with $\\cos\\theta={cs}$. What is the distance between the two foci of this ellipse? (digits only)", ["The diameter parallel to the line of intersection keeps its length, and the perpendicular one shrinks by the factor $\\cos\\theta$.", "Find the semi-axes of the projected ellipse and compute $c=\\sqrt{a^2-b^2}$."], "The projected ellipse has semi-major axis $a={rr}$ and semi-minor axis $b={rr}\\cos\\theta={bb}$. Then $c=\\sqrt{{rr}^2-{bb}^2}={cc}$, so the distance between the foci is $2c={ans}$."],
  },
  (r) => {
    const t = r.pick(BASE.slice(0, 4)), sw = r.next() < 0.5, l1 = sw ? t[0] : t[1], l2 = sw ? t[1] : t[0], s = r.int(1, 6);
    return { v: { rr: t[2] * s, cs: tfrac(l1, t[2]), bb: l1 * s, cc: l2 * s }, ans: 2 * l2 * s };
  },
  [{ skill: G2, levels: [1], count: 12, d: 4, standards: ["12기하02-03", "12기하01-02"], strategy: "projection-of-circle", evidence: "application" }],
);

// ===================================================================================================================================
// 36. three perpendiculars theorem
add(
  "geo_threePerp",
  {
    ko: ["평면 $\\alpha$ 밖의 점 P에서 $\\alpha$ 에 내린 수선의 발을 H, 점 H에서 $\\alpha$ 위의 직선 $\\ell$ 에 내린 수선의 발을 K라 하고, $\\ell$ 위에 K와 다른 점 A를 잡는다. ${giv}$ 일 때, 선분 ${ask}$ 의 길이는? (숫자만 쓰세요)", ["$PH\\perp\\alpha$, $HK\\perp\\ell$ 이므로 삼수선의 정리에 의해 $PK\\perp\\ell$ 이에요.", "삼수선의 정리로 얻은 직각삼각형들에서 피타고라스 정리를 차례로 쓰세요."], "$PH\\perp\\alpha$, $HK\\perp\\ell$ 이므로 삼수선의 정리에 의해 $PK\\perp\\ell$ 입니다. ${work}$ 이므로 구하는 길이는 ${ans}$ 입니다."],
    en: ["From a point P outside the plane $\\alpha$, the foot of the perpendicular to $\\alpha$ is H. From H the foot of the perpendicular to a line $\\ell$ in $\\alpha$ is K, and A is a point of $\\ell$ different from K. If ${giv}$, what is the length of segment ${ask}$? (digits only)", ["Since $PH\\perp\\alpha$ and $HK\\perp\\ell$, the three perpendiculars theorem gives $PK\\perp\\ell$.", "Apply the Pythagorean theorem in the resulting right triangles one after another."], "Since $PH\\perp\\alpha$ and $HK\\perp\\ell$, the three perpendiculars theorem gives $PK\\perp\\ell$. ${work}$, so the length is ${ans}$."],
  },
  (r, lvl) => {
    const sq = (x) => x * x;
    if (lvl === 1) {
      const t = r.pick(TRIS30), [h, d] = r.next() < 0.5 ? [t[0], t[1]] : [t[1], t[0]], l = t[2];
      const m = r.int(0, 2);
      if (m === 0) return { v: { giv: `PH=${h},\\ HK=${d}`, ask: "PK", work: `PK^2=PH^2+HK^2=${h}^2+${d}^2=${l * l}` }, ans: l };
      if (m === 1) return { v: { giv: `PK=${l},\\ PH=${h}`, ask: "HK", work: `HK^2=PK^2-PH^2=${l}^2-${h}^2=${d * d}` }, ans: d };
      return { v: { giv: `PK=${l},\\ HK=${d}`, ask: "PH", work: `PH^2=PK^2-HK^2=${l}^2-${d}^2=${h * h}` }, ans: h };
    }
    if (r.next() < 0.4) {
      const t = r.pick(TRIS30), [l, e] = r.next() < 0.5 ? [t[0], t[1]] : [t[1], t[0]], g = t[2];
      if (r.next() < 0.5) return { v: { giv: `PK=${l},\\ AK=${e}`, ask: "PA", work: `PA^2=PK^2+AK^2=${l}^2+${e}^2=${g * g}` }, ans: g };
      return { v: { giv: `PA=${g},\\ PK=${l}`, ask: "AK", work: `AK^2=PA^2-PK^2=${g}^2-${l}^2=${e * e}` }, ans: e };
    }
    const q = r.pick(QUADS), [h, d, e] = shuf3(r, q.slice(0, 3)), g = q[3];
    const m = r.int(0, 2);
    if (m === 0) return { v: { giv: `PH=${h},\\ HK=${d},\\ AK=${e}`, ask: "PA", work: `PA^2=PH^2+HK^2+AK^2=${h}^2+${d}^2+${e}^2=${g * g}` }, ans: g };
    if (m === 1) return { v: { giv: `PA=${g},\\ PH=${h},\\ HK=${d}`, ask: "AK", work: `AK^2=PA^2-PH^2-HK^2=${g}^2-${h}^2-${d}^2=${e * e}` }, ans: e };
    return { v: { giv: `PA=${g},\\ PH=${h},\\ AK=${e}`, ask: "HK", work: `HK^2=PA^2-PH^2-AK^2=${g}^2-${h}^2-${e}^2=${d * d}` }, ans: d };
  },
  [{ skill: G2, levels: [1, 2], count: 12, d: 3, standards: ["12기하02-02"], strategy: "three-perpendiculars", evidence: "application" }],
);

// 미적분Ⅱ (12미적Ⅱ): limits of sequences, series, exponential / logarithmic / trigonometric calculus, differentiation techniques,
// applications of derivatives, integration techniques and applications.  Numbers are chosen so that the asked value is an integer / simple fraction.
import { gcd, tfrac, poly, lin, cf, evalPoly, Q } from "../lib.mjs";

export const TEMPLATES = {};
export const GEN = {};
export const PLAN = [];

const NUM = "(숫자만 쓰세요)";
const FR = "(소수로 써도 되고 3/4 처럼 분수로 써도 돼요)";
const ENUM = "(digits only)";
const EFR = "(a decimal is fine, or a fraction written like 3/4)";

const q = (p, d = 1) => new Q(p, d);
const tq = (x) => tfrac(Number(x.p), Number(x.q));
const num = (x) => x.toNumber();
const simple = (x, maxDen = 48) => x.q <= BigInt(maxDen) && (x.p < 0n ? -x.p : x.p) <= 100000n;
/** a*x as text: 1 -> x, -1 -> -x */
const ax = (a, x = "x") => (a === 1 ? x : a === -1 ? `-${x}` : `${a}${x}`);
/** coefficient with \cdot in front of a power etc: 1 -> "", else "a\cdot " */
const cd = (a) => (a === 1 ? "" : a === -1 ? "-" : `${a}\\cdot `);
const pm = (c) => (c < 0 ? `-${-c}` : `+${c}`);
/** (num/den) * pi as LaTeX */
const piTex = (n, d) => {
  if (n === 0) return "0";
  const g = gcd(Math.abs(n), d); n /= g; d /= g;
  const s = n < 0 ? "-" : ""; const m = Math.abs(n);
  const top = m === 1 ? "\\pi" : `${m}\\pi`;
  return d === 1 ? `${s}${top}` : `${s}\\frac{${top}}{${d}}`;
};
const lnTex = (m, k = 1) => (k === 1 ? `\\ln ${m}` : `\\frac{1}{${k}}\\ln ${m}`);
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const eP = (k) => (k === 1 ? "e" : `e^{${k}}`);
const fd = (top, den) => (den === 1 ? top : `\\frac{${top}}{${den}}`);
const frk = (num, den) => (den === 1 ? String(num) : `\\frac{${num}}{${den}}`);
/** sum of Q-coefficient terms */
const termsQ = (list) => {
  let out = "";
  for (const [c, body] of list) {
    if (c.p === 0n) continue;
    const neg = c.p < 0n, ab = neg ? new Q(-c.p, c.q) : c;
    const one = ab.p === 1n && ab.q === 1n;
    out += (neg ? "-" : out ? "+" : "") + (one ? (body === "" ? "1" : "") : tq(ab)) + body;
  }
  return out || "0";
};
const pp = (n) => (n < 0 ? `(${n})` : `${n}`);
const fr2 = (a, b) => (b === 1 ? pp(a) : b < 0 ? `\\frac{${-a}}{${-b}}` : `\\frac{${a}}{${b}}`);

function add(key, ko, en, gen) {
  TEMPLATES[key] = { ko, en };
  GEN[key] = gen;
}
function plan(skill, template, levels, count, d, standards, strategy, evidence) {
  PLAN.push({ skill, template, levels, count, d, standards, strategy, evidence });
}

/** join signed pieces: sj("a","-b","c") -> "a-b+c" (empty pieces dropped) */
const sj = (...parts) => parts.filter((s) => s !== "" && s != null).map(String).map((s, i) => (i === 0 || s.startsWith("-") ? s : `+${s}`)).join("");
/** a/b as LaTeX with the sign in front, not reduced */
const sfrac = (a, b) => {
  const g = gcd(Math.abs(a), Math.abs(b)) || 1;
  const n = Math.abs(a) / g, d = Math.abs(b) / g, neg = (a < 0) !== (b < 0) && n !== 0;
  return d === 1 ? `${neg ? "-" : ""}${n}` : `${neg ? "-" : ""}\\frac{${n}}{${d}}`;
};
/** c * s as text: 1 -> s, -1 -> -s */
const cmul = (c, s) => (c === 1 ? s : c === -1 ? `-${s}` : `${c}\\cdot ${s}`);
/** a/b as a coefficient in front of a symbol: 1 -> "", -1 -> "-" */
const sfc = (a, b) => { const t = sfrac(a, b); return t === "1" ? "" : t === "-1" ? "-" : t; };
const plus = (s) => (s.startsWith("-") ? s : `+${s}`);
/** c0 + c1/n + c2/n^2 + ... (zero terms dropped), the working after dividing by the highest power of n */
const invSeries = (co) => co.map((c, i) => {
  if (i === 0) return String(c);
  if (c === 0) return "";
  return `${c < 0 ? "-" : "+"}\\frac{${Math.abs(c)}}{${i === 1 ? "n" : `n^{${i}}`}}`;
}).join("");
/** parentheses only around a sum */
const wrapSum = (s) => (/[+-]/.test(s.slice(1)) ? `(${s})` : s);

// ===================================================================== sequences and series
// ---- 1. limit of a sequence given by an expression (rational, radicals)
add("ca2_seqLimit",
  ["다음 수열의 극한값을 구하세요. $\\lim_{n\\to\\infty}{ex}$ " + FR,
    ["분모의 최고차항으로 분자와 분모를 나누거나, 근호가 있으면 먼저 유리화해 보세요.", "$n\\to\\infty$ 일 때 $\\frac{1}{n}$, $\\frac{1}{n^{2}}$ 같은 항은 $0$ 으로 가요."],
    "식을 정리하면 ${wk}$ 이므로 극한값은 ${res}$ 입니다."],
  ["Find the limit of the sequence. $\\lim_{n\\to\\infty}{ex}$ " + EFR,
    ["Divide numerator and denominator by the highest power of $n$ in the denominator, or rationalize first if there are radicals.", "Terms like $\\frac{1}{n}$ and $\\frac{1}{n^{2}}$ tend to $0$ as $n\\to\\infty$."],
    "Simplifying gives ${wk}$, so the limit is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      if (lvl === 1) {
        if (r.next() < 0.65) {
          const deg = r.pick([1, 2, 2, 3]);
          const nm = range(0, deg).map(() => r.int(-9, 9)), dn = range(0, deg).map(() => r.int(-9, 9));
          if (nm[0] === 0 || dn[0] === 0) continue;
          if (range(1, 60).some((n) => evalPoly(dn, n) === 0)) continue;
          const ans = q(nm[0], dn[0]);
          if (!simple(ans)) continue;
          const dv = deg === 1 ? "n" : `n^{${deg}}`;
          return { v: { ex: `\\frac{${poly(nm, "n")}}{${poly(dn, "n")}}`, wk: `\\frac{\\frac{${poly(nm, "n")}}{${dv}}}{\\frac{${poly(dn, "n")}}{${dv}}}=\\frac{${invSeries(nm)}}{${invSeries(dn)}}\\to ${sfrac(nm[0], dn[0])}`, res: tq(ans) }, ans: num(ans) };
        }
        const a = r.nonzero(-5, 5), b = r.int(-6, 6), c = r.nonzero(-5, 5), d = r.int(-6, 6), e = r.nonzero(-5, 5), f = r.int(1, 9);
        const den = [e, 0, f];
        if (range(1, 60).some((n) => evalPoly(den, n) === 0)) continue;
        const ans = q(a * c, e);
        if (!simple(ans)) continue;
        if (b === 0 && d === 0) continue;
        const f1 = lin(a, b, "n"), f2 = lin(c, d, "n");
        return { v: { ex: `\\frac{(${f1})(${f2})}{${poly(den, "n")}}`, wk: `\\frac{(${invSeries([a, b])})(${invSeries([c, d])})}{${invSeries([e, 0, f])}}\\to ${sfrac(a * c, e)}`, res: tq(ans) }, ans: num(ans) };
      }
      if (lvl === 2) {
        const s = r.pick([1, 1, 2, 3]);
        const sq = (b, c) => `\\sqrt{${poly([s * s, b, c], "n")}}`;
        const sqInv = (b, c) => `\\sqrt{${invSeries([s * s, b, c])}}`;
        if (r.next() < 0.6) {
          const B = r.int(-8, 8), E2 = r.int(-8, 8), C = r.int(-6, 6), F = r.int(-6, 6);
          if (B === E2) continue;
          if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50].every((n) => s * s * n * n + B * n + C > 0 && s * s * n * n + E2 * n + F > 0)) continue;
          const ans = q(B - E2, 2 * s);
          if (!simple(ans)) continue;
          return { v: { ex: `${sq(B, C)}-${sq(E2, F)}`, wk: `\\frac{${lin(B - E2, C - F, "n")}}{${sq(B, C)}+${sq(E2, F)}}=\\frac{${invSeries([B - E2, C - F])}}{${sqInv(B, C)}+${sqInv(E2, F)}}\\to ${sfrac(B - E2, 2 * s)}`, res: tq(ans) }, ans: num(ans) };
        }
        const B = r.nonzero(-9, 9), C = r.int(-6, 6);
        if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50].every((n) => s * s * n * n + B * n + C > 0)) continue;
        const ans = q(B, 2 * s);
        return { v: { ex: `${sq(B, C)}-${s === 1 ? "" : s}n`, wk: `\\frac{${lin(B, C, "n")}}{${sq(B, C)}+${s === 1 ? "" : s}n}=\\frac{${invSeries([B, C])}}{${sqInv(B, C)}+${s}}\\to ${sfrac(B, 2 * s)}`, res: tq(ans) }, ans: num(ans) };
      }
      const kind = r.int(1, 3);
      if (kind === 1) {
        const a = r.nonzero(-9, 9);
        if (a < -1) continue; // keep n^2 + a > 0 for every n >= 1
        const ans = q(a, 2);
        return { v: { ex: `n\\left(\\sqrt{n^{2}${pm(a)}}-n\\right)`, wk: `\\frac{${ax(a, "n")}}{\\sqrt{n^{2}${pm(a)}}+n}=\\frac{${a}}{\\sqrt{1${a < 0 ? "-" : "+"}\\frac{${Math.abs(a)}}{n^{2}}}+1}\\to ${sfrac(a, 2)}`, res: tq(ans) }, ans: num(ans) };
      }
      if (kind === 2) {
        const s = r.pick([1, 2, 3]), t = r.int(1, 4), a = r.nonzero(-9, 9), b = r.int(-6, 6), c = r.int(1, 9);
        const ans = q(a, s + t);
        if (!simple(ans)) continue;
        return { v: { ex: `\\frac{${lin(a, b, "n")}}{\\sqrt{${s === 1 ? "" : s * s}n^{2}+${c}}+${t === 1 ? "" : t}n}`, wk: `\\frac{${invSeries([a, b])}}{\\sqrt{${s * s}+\\frac{${c}}{n^{2}}}+${t}}\\to ${sfrac(a, s + t)}`, res: tq(ans) }, ans: num(ans) };
      }
      const m = r.pick([1, 1, 2, 3]), a = r.int(1, 9);
      const ans = q(m * a, 2);
      return { v: { ex: `${m === 1 ? "" : m}\\sqrt{n}\\left(\\sqrt{n+${a}}-\\sqrt{n}\\right)`, wk: `\\frac{${m === 1 ? "" : m}\\cdot ${a}\\sqrt{n}}{\\sqrt{n+${a}}+\\sqrt{n}}=\\frac{${m * a}}{\\sqrt{1+\\frac{${a}}{n}}+1}\\to ${sfrac(m * a, 2)}`, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("seqLimit");
  });
plan("m.h3.ser", "ca2_seqLimit", [1, 2, 3], 7, 2, ["12미적Ⅱ-01-02"], "limit-by-leading-term-or-rationalizing", "calc");

// ---- 2. geometric-type quotient limit
add("ca2_seqGeoLimit",
  ["다음 수열의 극한값을 구하세요. $\\lim_{n\\to\\infty}{ex}$ " + FR,
    ["분모와 분자에서 밑의 절댓값이 가장 큰 거듭제곱이 극한을 정해요.", "그 거듭제곱으로 분자와 분모를 나누면, 밑의 절댓값이 작은 항은 $0$ 으로 가요."],
    "밑의 절댓값이 가장 큰 항 ${dom}$ 으로 분자와 분모를 나누면 나머지 항은 $0$ 으로 가고 계수 부분만 남아 ${wk}$ 입니다. 따라서 극한값은 ${res}$ 입니다."],
  ["Find the limit. $\\lim_{n\\to\\infty}{ex}$ " + EFR,
    ["The power whose base has the largest absolute value decides the limit.", "Divide numerator and denominator by it; the terms whose bases have smaller absolute values tend to $0$."],
    "Divide the numerator and denominator by the term with the largest absolute base, ${dom}$: the other terms tend to $0$ and only the coefficients remain, ${wk}$. So the limit is ${res}$."],
  (r, lvl) => {
    const bsT = (base) => (base < 0 ? `(${base})` : `${base}`);
    const termTex = (cof, base, e) => `${cd(cof)}${bsT(base)}^{${e === 0 ? "n" : `n+${e}`}}`;
    const sumTex = (parts) => parts.map(([c, b2, e], i) => { const t = termTex(c, b2, e); return i === 0 || c < 0 ? t : `+${t}`; }).join("");
    /** coefficient part of the dominant term: c * base^e */
    const cpow = (cof, base, e) => {
      if (e === 0) return String(cof);
      const pw = e === 1 ? bsT(base) : `${bsT(base)}^{${e}}`;
      return cof === 1 ? pw : cof === -1 ? `-${pw}` : `${cof}\\cdot ${pw}`;
    };
    const co = () => r.pick([1, 1, 2, 3, 4, 5, -1, -2, -3]);
    for (let tries = 0; tries < 800; tries++) {
      let nums, dens;
      if (lvl === 3) {
        const abs3 = [2, 3, 4, 5, 6, 7];
        const pool = [];
        while (pool.length < 3) { const b2 = r.pick(abs3); if (!pool.includes(b2)) pool.push(b2); }
        const neg = r.int(0, 2);
        const bases = pool.map((b2, i) => (i === neg ? -b2 : b2));
        nums = bases.map((b2) => [co(), b2, r.int(0, 2)]);
        dens = bases.map((b2) => [co(), b2, r.int(0, 2)]);
      } else {
        let p = r.int(2, 7), qb = r.int(2, 7);
        if (p === qb) continue;
        if (lvl === 1) {
          nums = [[r.int(1, 5), p, 1], [r.int(1, 5), qb, 0]];
          dens = [[r.int(1, 5), p, 0], [r.int(1, 5), qb, 0]];
        } else {
          nums = [[co(), p, r.int(0, 2)], [co(), qb, r.int(0, 2)]];
          dens = [[co(), p, r.int(0, 2)], [co(), qb, r.int(0, 2)]];
        }
      }
      // denominators must never vanish (checked with exact arithmetic for n = 1..40)
      let bad = false;
      for (let n = 1; n <= 40 && !bad; n++) {
        let s = 0n;
        for (const [c, b2, e] of dens) s += BigInt(c) * BigInt(b2) ** BigInt(n + e);
        if (s === 0n) bad = true;
      }
      if (bad) continue;
      const domIdx = nums.reduce((best, t, i) => (Math.abs(t[1]) > Math.abs(nums[best][1]) ? i : best), 0);
      const [a1, b1, e1] = nums[domIdx], [c1, , e2] = dens[domIdx];
      const ans = q(a1 * b1 ** e1, c1 * b1 ** e2);
      if (!simple(ans, 200) || ans.p === 0n) continue;
      const sgn = c1 < 0 ? -1 : 1;
      const wk = `\\frac{${cpow(a1 * sgn, b1, e1)}}{${cpow(c1 * sgn, b1, e2)}}`;
      return { v: { ex: `\\frac{${sumTex(nums)}}{${sumTex(dens)}}`, dom: `${bsT(b1)}^{n}`, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("seqGeoLimit");
  });
plan("m.h3.ser", "ca2_seqGeoLimit", [1, 2, 3], 7, 2, ["12미적Ⅱ-01-03", "12미적Ⅱ-01-02"], "dominant-base", "calc");

// ---- 3. for which integers does a geometric sequence / series converge (convergence conditions)
add("ca2_geoConvCount",
  ["다음이 수렴하도록 하는 모든 정수 $x$ 의 합을 구하세요. ${obj}$ " + NUM,
    ["수열 $\\{r^{n}\\}$ 은 $-1<r\\le 1$ 일 때, 무한등비급수 $\\sum_{n=1}^{\\infty}r^{n}$ 은 $-1<r<1$ 일 때 수렴해요.", "수렴 조건을 $x$ 에 대한 부등식으로 쓰고, 그 부등식을 만족하는 정수를 모두 찾아 더해요."],
    "수렴 조건에서 ${rg}$ 입니다. 이를 만족하는 정수 $x$ 는 ${lst}$ 이므로 그 합은 ${ans}$ 입니다."],
  ["Find the sum of all integers $x$ for which the following converges. ${obj}$ " + ENUM,
    ["The sequence $\\{r^{n}\\}$ converges when $-1<r\\le 1$; the infinite geometric series $\\sum_{n=1}^{\\infty}r^{n}$ converges when $-1<r<1$.", "Write the convergence condition as an inequality in $x$, find all integers satisfying it and add them."],
    "The convergence condition gives ${rg}$. The integers $x$ satisfying it are ${lst}$, so their sum is ${ans}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      const b = r.int(2, 9);
      let rt, rg, test, series;
      if (lvl === 1) {
        const a = r.nonzero(-6, 6);
        series = false;
        if (r.next() < 0.5) { rt = `\\frac{x${pm(-a)}}{${b}}`; test = (x) => x - a; rg = `-${b}<x${pm(-a)}\\le ${b}`; }
        else { rt = `\\frac{${a}-x}{${b}}`; test = (x) => a - x; rg = `-${b}<${a}-x\\le ${b}`; }
      } else if (lvl === 2) {
        const p = r.pick([2, 3, 4]), a = r.int(-7, 7);
        series = true;
        rt = `\\frac{${p}x${a === 0 ? "" : pm(-a)}}{${b}}`; test = (x) => p * x - a; rg = `-${b}<${p}x${a === 0 ? "" : pm(-a)}<${b}`;
      } else {
        series = r.next() < 0.6;
        const s = r.int(-3, 3), t2 = r.int(s + 1, s + 4), bb = r.int(2, 14);
        rt = `\\frac{${fac(s)}${fac(t2)}}{${bb}}`; test = (x) => (x - s) * (x - t2);
        rg = `-${bb}<${fac(s)}${fac(t2)}${series ? "<" : "\\le "}${bb}`;
        const sol = range(-40, 40).filter((x) => (series ? -bb < test(x) && test(x) < bb : -bb < test(x) && test(x) <= bb));
        const sum = sol.reduce((u, w) => u + w, 0);
        if (sol.length < 3 || sol.length > 12 || sum === 0) continue;
        const obj = series ? `\\sum_{n=1}^{\\infty}\\left(${rt}\\right)^{n}` : `\\left\\{\\left(${rt}\\right)^{n}\\right\\}`;
        return { v: { obj, rg, lst: sol.join(", ") }, ans: sum };
      }
      const sol = range(-60, 60).filter((x) => (series ? -b < test(x) && test(x) < b : -b < test(x) && test(x) <= b));
      const sum = sol.reduce((u, w) => u + w, 0);
      if (sol.length < 3 || sol.length > 24 || sum === 0) continue;
      const obj = series ? `\\sum_{n=1}^{\\infty}\\left(${rt}\\right)^{n}` : `\\left\\{\\left(${rt}\\right)^{n}\\right\\}`;
      return { v: { obj, rg, lst: sol.length > 8 ? `${sol[0]}, ${sol[1]}, \\ldots, ${sol[sol.length - 1]}` : sol.join(", ") }, ans: sum };
    }
    throw new Error("geoConvCount");
  });
plan("m.h3.ser", "ca2_geoConvCount", [1, 2, 3], 7, 2, ["12미적Ⅱ-01-01", "12미적Ⅱ-01-03", "12미적Ⅱ-01-05"], "convergence-range-sum", "concept");

// ---- 4. limit of (1/n^k) * sum
add("ca2_seqSumLimit",
  ["다음 극한값을 구하세요. $\\lim_{n\\to\\infty}{ex}$ " + FR,
    ["$\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}$, $\\sum_{k=1}^{n}k^{2}=\\frac{n(n+1)(2n+1)}{6}$, $\\sum_{k=1}^{n}k^{3}=\\left\\{\\frac{n(n+1)}{2}\\right\\}^{2}$ 을 이용해 합을 $n$ 에 대한 다항식으로 나타내요.", "$n\\to\\infty$ 일 때는 분자와 분모의 최고차항의 계수만 비교하면 돼요."],
    "합을 $n$ 에 대한 식으로 나타내면 ${wk}$ 이므로 극한값은 ${res}$ 입니다."],
  ["Find the limit. $\\lim_{n\\to\\infty}{ex}$ " + EFR,
    ["Use $\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}$, $\\sum_{k=1}^{n}k^{2}=\\frac{n(n+1)(2n+1)}{6}$ and $\\sum_{k=1}^{n}k^{3}=\\left\\{\\frac{n(n+1)}{2}\\right\\}^{2}$ to write the sum as a polynomial in $n$.", "As $n\\to\\infty$ only the leading coefficients of numerator and denominator matter."],
    "Writing the sum in terms of $n$ gives ${wk}$, so the limit is ${res}$."],
  (r, lvl) => {
    const combo = (pieces) => sj(...pieces.filter(([c]) => c !== 0).map(([c, s]) => cmul(c, s)));
    for (let tries = 0; tries < 500; tries++) {
      if (lvl === 1) {
        const d = r.pick([1, 1, 2]);
        const co = range(0, d).map(() => r.int(-6, 6));
        if (co[0] === 0) continue;
        const ans = q(co[0], d + 1);
        const pieces = d === 1
          ? [[co[0], "\\frac{n(n+1)}{2}"], [co[1], "n"]]
          : [[co[0], "\\frac{n(n+1)(2n+1)}{6}"], [co[1], "\\frac{n(n+1)}{2}"], [co[2], "n"]];
        return { v: { ex: `\\frac{1}{n^{${d + 1}}}\\sum_{k=1}^{n}(${poly(co, "k")})`, wk: `\\frac{1}{n^{${d + 1}}}\\left\\{${combo(pieces)}\\right\\}\\to ${sfrac(co[0], d + 1)}`, res: tq(ans) }, ans: num(ans) };
      }
      if (lvl === 2) {
        if (r.next() < 0.5) {
          const a = r.int(1, 5), b = r.int(1, 6), c = r.pick([1, 2, 3, 5, 6, -1, -2, -3]);
          const ans = q(c, 4);
          return { v: { ex: `\\frac{1}{n^{4}}\\sum_{k=1}^{n}${cd(c)}k(k+${a})(k+${b})`, wk: `k(k+${a})(k+${b})=k^{3}+${a + b}k^{2}+${a * b}k,\\ \\sum_{k=1}^{n}k^{3}=\\left\\{\\frac{n(n+1)}{2}\\right\\}^{2}\\ \\Rightarrow\\ ${sfrac(c, 4)}`, res: tq(ans) }, ans: num(ans) };
        }
        const a = r.nonzero(-4, 5), b = r.int(-5, 5), c = r.nonzero(-4, 5), d = r.int(-5, 5);
        const ans = q(a * c, 3);
        return { v: { ex: `\\frac{1}{n^{3}}\\sum_{k=1}^{n}(${lin(a, b, "k")})(${lin(c, d, "k")})`, wk: `(${lin(a, b, "k")})(${lin(c, d, "k")})=${poly([a * c, a * d + b * c, b * d], "k")},\\ \\sum_{k=1}^{n}k^{2}=\\frac{n(n+1)(2n+1)}{6}\\ \\Rightarrow\\ ${sfrac(a * c, 3)}`, res: tq(ans) }, ans: num(ans) };
      }
      const p = r.int(2, 5), qq = r.int(1, p - 1), a = r.pick([1, 1, 2, 3, -1, -2]);
      const gap = p - qq;
      const ans = q(a * (qq + 1), p + 1);
      return { v: { ex: `\\frac{${cd(a).replace("\\cdot ", "")}\\sum_{k=1}^{n}k^{${p}}}{${gap === 1 ? "n" : `n^{${gap}}`}\\sum_{k=1}^{n}k^{${qq}}}`, wk: `\\frac{${a === 1 ? "" : `${a}\\cdot `}\\frac{n^{${p + 1}}}{${p + 1}}}{${gap === 1 ? "n" : `n^{${gap}}`}\\cdot\\frac{n^{${qq + 1}}}{${qq + 1}}}\\to ${sfrac(a * (qq + 1), p + 1)}`, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("seqSumLimit");
  });
plan("m.h3.ser", "ca2_seqSumLimit", [1, 2, 3], 7, 3, ["12미적Ⅱ-01-02"], "sum-closed-form-leading-term", "calc");

// ---- 5. partial sum -> series sum / term / limit of n^2 a_n
add("ca2_partialSumSeries",
  ["수열 $\\{a_n\\}$ 의 첫째항부터 제 $n$ 항까지의 합이 $S_n=\\frac{{sa}}{{sb}}$ 일 때, ${ask}$ 의 값을 구하세요. " + FR,
    ["$a_1=S_1$ 이고, $n\\ge 2$ 일 때 $a_n=S_n-S_{n-1}$ 이에요.", "구하는 값이 항인지 급수의 합인지 먼저 구분해요. 무한급수의 합은 부분합 $S_n$ 의 극한이고, 항은 $S_n-S_{n-1}$ 로 구해요."],
    "${wk}$ 이므로 구하는 값은 ${res}$ 입니다."],
  ["The sum of the first $n$ terms of a sequence $\\{a_n\\}$ is $S_n=\\frac{{sa}}{{sb}}$. Find ${ask}$. " + EFR,
    ["$a_1=S_1$, and $a_n=S_n-S_{n-1}$ for $n\\ge 2$.", "First decide whether a term or the sum of the series is asked. The sum of an infinite series is the limit of its partial sums $S_n$, and a term comes from $S_n-S_{n-1}$."],
    "${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const p = r.nonzero(-6, 9), qv = r.int(-6, 9), rr = r.int(1, 5), s = r.int(1, 6);
      const S = (n) => q(p * n + qv, rr * n + s);
      const sa = lin(p, qv, "n"), sb = lin(rr, s, "n");
      if (p * s - qv * rr === 0) continue;
      if (lvl === 1) {
        if (r.next() < 0.7) {
          const ans = q(p, rr);
          if (!simple(ans)) continue;
          return { v: { sa, sb, ask: "\\sum_{n=1}^{\\infty}a_{n}", wk: `\\sum_{n=1}^{\\infty}a_{n}=\\lim_{n\\to\\infty}S_{n}=${sfrac(p, rr)}`, res: tq(ans) }, ans: num(ans) };
        }
        const ans = S(1);
        if (!simple(ans)) continue;
        return { v: { sa, sb, ask: "a_{1}", wk: `a_{1}=S_{1}=${sfrac(p + qv, rr + s)}`, res: tq(ans) }, ans: num(ans) };
      }
      if (lvl === 2) {
        const k = r.int(2, 6);
        const ans = S(k).sub(S(k - 1));
        if (!simple(ans, 150)) continue;
        return { v: { sa, sb, ask: `a_{${k}}`, wk: `a_{${k}}=S_{${k}}-S_{${k - 1}}=${tq(S(k))}-(${tq(S(k - 1))})`, res: tq(ans) }, ans: num(ans) };
      }
      const ans = q(p * s - qv * rr, rr * rr);
      if (!simple(ans)) continue;
      return { v: { sa, sb, ask: "\\lim_{n\\to\\infty}n^{2}a_{n}", wk: `a_{n}=S_{n}-S_{n-1}=\\frac{${p * s - qv * rr}}{${wrapSum(sb)}\\cdot ${wrapSum(lin(rr, s - rr, "n"))}}\\ (n\\ge 2),\\ \\lim_{n\\to\\infty}n^{2}a_{n}=${sfrac(p * s - qv * rr, rr * rr)}`, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("partialSumSeries");
  });
plan("m.h3.ser", "ca2_partialSumSeries", [1, 2, 3], 7, 3, ["12미적Ⅱ-01-04"], "partial-sums", "concept");

// ---- 6. telescoping series
add("ca2_telescope",
  ["무한급수 $\\sum_{n=1}^{\\infty}{term}$ 의 합을 구하세요. " + FR,
    ["분모의 인수들이 일정한 간격으로 이어져 있어요. 부분분수로 나누어 보세요.", "$\\frac{1}{A(A+d)}=\\frac{1}{d}\\left(\\frac{1}{A}-\\frac{1}{A+d}\\right)$ 이고, 인수가 세 개이면 $\\frac{1}{A(A+1)(A+2)}=\\frac{1}{2}\\left(\\frac{1}{A(A+1)}-\\frac{1}{(A+1)(A+2)}\\right)$ 이에요. 부분합에서 소거되고 남는 항을 찾아요."],
    "부분분수로 나누어 부분합을 구하면 소거 후 ${wk}$ 이므로 합은 ${res}$ 입니다."],
  ["Find the sum of the infinite series $\\sum_{n=1}^{\\infty}{term}$. " + EFR,
    ["The factors in the denominator are spaced by a constant. Split into partial fractions.", "$\\frac{1}{A(A+d)}=\\frac{1}{d}\\left(\\frac{1}{A}-\\frac{1}{A+d}\\right)$, and with three factors $\\frac{1}{A(A+1)(A+2)}=\\frac{1}{2}\\left(\\frac{1}{A(A+1)}-\\frac{1}{(A+1)(A+2)}\\right)$. Find which terms remain after the cancellation in the partial sums."],
    "Splitting into partial fractions and cancelling in the partial sums leaves ${wk}$, so the sum is ${res}$."],
  (r, lvl) => {
    const wr = (f) => (/[+-]/.test(f) ? `(${f})` : f);
    for (let tries = 0; tries < 500; tries++) {
      if (lvl === 3) {
        const b = r.int(0, 5), c = r.int(1, 4);
        const f1 = b === 0 ? "n" : `(n+${b})`, f2 = `(n+${b + 1})`, f3 = `(n+${b + 2})`;
        const ans = q(c, 2 * (b + 1) * (b + 2));
        return { v: { term: `\\frac{${c}}{${f1}${f2}${f3}}`, wk: `${sfrac(c, 2)}\\cdot\\frac{1}{${b + 1}\\cdot ${b + 2}}`, res: tq(ans) }, ans: num(ans) };
      }
      const a = lvl === 1 ? 1 : r.pick([2, 3]);
      const m = lvl === 1 ? r.pick([1, 1, 2, 3]) : r.pick([1, 2]);
      const b = lvl === 1 ? r.int(0, 4) : r.int(0, 3);
      const c = r.int(1, 5);
      let s = q(0);
      for (let i = 1; i <= m; i++) s = s.add(q(1, a * i + b));
      const ans = s.mul(q(c, a * m));
      if (!simple(ans, 300)) continue;
      const f1 = lin(a, b, "n"), f2 = lin(a, b + a * m, "n");
      const parts = range(1, m).map((i) => frk(1, a * i + b)).join("+");
      const coef = sfrac(c, a * m), inner = m === 1 ? parts : `\\left(${parts}\\right)`;
      const wkTxt = m === 1 && parts === "1" ? coef : `${coef === "1" ? "" : `${coef}\\cdot `}${inner}`;
      return { v: { term: `\\frac{${c}}{${wr(f1)}${wr(f2)}}`, wk: wkTxt, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("telescope");
  });
plan("m.h3.ser", "ca2_telescope", [1, 2, 3], 7, 3, ["12미적Ⅱ-01-04"], "partial-fractions-telescoping", "calc");

// ---- 7. find the ratio / first term from the sum of an infinite geometric series
add("ca2_geoSeriesParam",
  ["무한급수 $\\sum_{n=1}^{\\infty}{term}$ 이 수렴하고 그 합이 ${S}$ 일 때, 상수 $r$ 의 값을 구하세요. " + FR,
    ["무한등비급수의 합은 (첫째항)÷(1-공비) 예요.", "급수의 일반항에서 첫째항과 공비를 먼저 찾아요."],
    "첫째항 ${fa}$, 공비 ${ratio}$ 이므로 합은 ${sumf}={S}$ 입니다. 이를 풀면 $r={res}$ 입니다."],
  ["The infinite series $\\sum_{n=1}^{\\infty}{term}$ converges and its sum is ${S}$. Find the constant $r$. " + EFR,
    ["The sum of an infinite geometric series is (first term)÷(1-ratio).", "Identify the first term and the common ratio from the general term."],
    "The first term is ${fa}$ and the ratio is ${ratio}$, so the sum is ${sumf}={S}$. Solving gives $r={res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      const pn = r.int(-5, 5), qd = r.int(2, 7);
      if (pn === 0 || Math.abs(pn) >= qd || gcd(Math.abs(pn), qd) !== 1) continue;
      const rr = q(pn, qd);
      const a = r.pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 12]);
      if (lvl === 1) {
        const S = q(a).div(q(1).sub(rr));
        if (!simple(S, 12)) continue;
        return { v: { term: `${cd(a)}r^{n-1}`, S: tq(S), fa: String(a), ratio: "r", sumf: `\\frac{${a}}{1-r}`, res: tq(rr) }, ans: num(rr) };
      }
      if (lvl === 2) {
        if (pn < 0) continue;
        const S = q(a).mul(rr).div(q(1).sub(rr));
        if (!simple(S, 12)) continue;
        return { v: { term: `${cd(a)}r^{n}`, S: tq(S), fa: `${a}r`, ratio: "r", sumf: `\\frac{${a}r}{1-r}`, res: tq(rr) }, ans: num(rr) };
      }
      const b = r.int(2, 6);
      if (Math.abs(pn) >= qd) continue;
      const rb = rr.mul(q(b));
      // term a (r/b)^n : ratio r/b with |r/b|<1, r = rr*b
      const x = rr; // x = r/b
      const S = q(a).mul(x).div(q(1).sub(x));
      if (!simple(S, 12)) continue;
      return { v: { term: `${cd(a)}\\left(\\frac{r}{${b}}\\right)^{n}`, S: tq(S), fa: `${a}\\cdot\\frac{r}{${b}}`, ratio: `\\frac{r}{${b}}`, sumf: `\\frac{${a}\\cdot\\frac{r}{${b}}}{1-\\frac{r}{${b}}}`, res: tq(rb) }, ans: num(rb) };
    }
    throw new Error("geoSeriesParam");
  });
plan("m.h3.ser", "ca2_geoSeriesParam", [1, 2, 3], 7, 3, ["12미적Ⅱ-01-05"], "solve-for-ratio", "reverse");

// ---- 8. bouncing ball: total distance
add("ca2_ballDistance",
  ["높이 ${h}$ m 에서 공을 떨어뜨립니다. 공은 바닥에 닿을 때마다 직전에 떨어진 높이의 ${ratio}$ 배 높이까지 튀어 올랐다가 다시 떨어지고, 이를 한없이 반복합니다. 공이 움직인 거리의 총합은 몇 m 인가요? " + FR,
    ["처음 떨어지는 거리 ${h}$ m 와, 그 뒤 매번 올라갔다 내려오는 거리(올라간 높이의 2배)로 나누어 생각해요.", "올라간 높이는 첫째항이 (처음 높이)×(튀어 오르는 비율) 인 등비수열을 이뤄요."],
    "올라가는 높이의 합은 ${up}$ m, 올라갔다 내려오는 거리는 그 2배이므로 총 거리는 ${h}+2\\times {up}={res}$ m 입니다."],
  ["A ball is dropped from a height of ${h}$ m. Each time it hits the floor it bounces up to ${ratio}$ times the height it just fell from, then falls again, and this repeats forever. What is the total distance the ball travels, in m? " + EFR,
    ["Treat the first drop of ${h}$ m separately from the later up-and-down trips (each is twice the height reached).", "The heights reached form a geometric sequence whose first term is (initial height)×(bounce ratio)."],
    "The heights reached add up to ${up}$ m and every up-and-down trip is twice that, so the total is ${h}+2\\times {up}={res}$ m."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let rr, ratio;
      if (lvl === 1) { const p = r.int(1, 6), d = r.int(2, 8); if (p >= d || gcd(p, d) !== 1) continue; rr = q(p, d); ratio = tfrac(p, d); }
      else { const dec = r.pick([2, 3, 4, 5, 6, 7, 8, 9]); rr = q(dec, 10); ratio = `0.${dec}`; }
      const h = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 27, 30]);
      const up = q(h).mul(rr).div(q(1).sub(rr));
      const total = q(h).add(up.mul(q(2)));
      if (!simple(total, 30)) continue;
      return { v: { h, ratio, up: tq(up), res: tq(total) }, ans: num(total) };
    }
    throw new Error("ballDistance");
  });
plan("m.h3.ser", "ca2_ballDistance", [1, 2], 7, 3, ["12미적Ⅱ-01-05"], "geometric-series-application", "application");

// ---- 8b. bouncing ball, the height after the n-th bounce is given: reverse
add("ca2_ballReverse",
  ["공을 어떤 높이에서 떨어뜨렸더니, 공은 바닥에 닿을 때마다 직전에 떨어진 높이의 ${ratio}$ 배 높이까지 튀어 올랐다가 다시 떨어지기를 한없이 반복했습니다. ${nb}$ 번째로 튀어 오른 높이가 ${H}$ m 일 때, 공이 움직인 거리의 총합은 몇 m 인가요? " + FR,
    ["처음 높이를 $h$ m 라 하면, 매번 튀어 오르는 높이는 직전 높이의 ${ratio}$ 배이므로 $n$ 번째로 튀어 오른 높이는 $h\\times \\left({ratio}\\right)^{n}$ 이에요.", "먼저 $h$ 를 구한 뒤, 처음 떨어진 거리 $h$ 와 올라갔다 내려오는 거리(올라간 높이의 2배)의 합으로 총 거리를 구해요."],
    "처음 높이를 $h$ m 라 하면 ${H}=h\\times \\left({ratio}\\right)^{{nb}}$ 이므로 $h={h}$ 입니다. 올라가는 높이의 합은 ${up}$ m 이므로 총 거리는 ${h}+2\\times {up}={res}$ m 입니다."],
  ["A ball is dropped from some height. Each time it hits the floor it bounces up to ${ratio}$ times the height it just fell from, then falls again, and this repeats forever. The height reached after bounce number ${nb}$ is ${H}$ m. What is the total distance the ball travels, in m? " + EFR,
    ["If the initial height is $h$ m, the height after bounce $n$ is $h\\times \\left({ratio}\\right)^{n}$.", "Find $h$ first, then add the first drop $h$ and twice the sum of all heights reached."],
    "With initial height $h$ m, ${H}=h\\times \\left({ratio}\\right)^{{nb}}$, so $h={h}$. The heights reached add up to ${up}$ m, so the total distance is ${h}+2\\times {up}={res}$ m."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      const d = r.int(2, lvl === 1 ? 4 : 5), p = r.int(1, d - 1);
      if (gcd(p, d) !== 1) continue;
      const n = lvl === 1 ? 2 : 3;
      const t = r.pick([1, 1, 2, 3]);
      const h = t * d ** n, H = t * p ** n;
      const rr = q(p, d);
      const up = q(h).mul(rr).div(q(1).sub(rr));
      const total = q(h).add(up.mul(q(2)));
      if (!simple(total, 30)) continue;
      return { v: { ratio: tfrac(p, d), nb: n, H, h, up: tq(up), res: tq(total) }, ans: num(total) };
    }
    throw new Error("ballReverse");
  });
plan("m.h3.ser", "ca2_ballReverse", [1, 2], 7, 4, ["12미적Ⅱ-01-05"], "geometric-series-reverse-first-term", "reverse");

// ===================================================================== exponential / logarithmic / trigonometric limits and derivatives
/** sum of c*body terms: [[2,"x"],[-1,"e^{x}"],[3,""]] -> "2x-e^{x}+3" */
const terms = (list) => {
  let s = "";
  for (const [c, body] of list) {
    if (c === 0) continue;
    const a = Math.abs(c);
    const t = body === "" ? String(a) : a === 1 ? body : `${a}${body}`;
    s += (c < 0 ? "-" : s ? "+" : "") + t;
  }
  return s || "0";
};
const E = (a) => `e^{${ax(a)}}`;
/** \\sin 2x, or \\sin(-2x) for a negative coefficient */
const fnx = (name, z) => (z < 0 ? `\\${name}(${ax(z)})` : `\\${name} ${ax(z)}`);
const onePlus = (a, body) => `1${a < 0 ? "-" : "+"}${Math.abs(a) === 1 && body !== "" ? "" : Math.abs(a)}${body}`;
const lnArg = (a) => `\\ln(1${a < 0 ? "-" : "+"}${ax(Math.abs(a))})`;


// ---- 9. limits involving e^x, ln(1+x)
add("ca2_expLogLimit",
  ["다음 극한값을 구하세요. $\\lim_{{to}}{ex}$ " + FR,
    ["$\\lim_{x\\to0}\\frac{e^{x}-1}{x}=1$, $\\lim_{x\\to0}\\frac{\\ln(1+x)}{x}=1$ 을 이용할 수 있게 식을 변형해요.", "분모와 분자에 같은 꼴이 나오도록 계수를 맞추어 곱하고 나눠요."],
    "기본 극한을 쓸 수 있게 변형하면 ${wk}$ 이므로 극한값은 ${res}$ 입니다."],
  ["Find the limit. $\\lim_{{to}}{ex}$ " + EFR,
    ["Use $\\lim_{x\\to0}\\frac{e^{x}-1}{x}=1$ and $\\lim_{x\\to0}\\frac{\\ln(1+x)}{x}=1$ after rewriting the expression.", "Multiply and divide by suitable constants so the same expression appears in numerator and denominator."],
    "Rewriting to use the basic limits gives ${wk}$, so the limit is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const a = r.nonzero(-5, 5), b = r.nonzero(-5, 5), c = r.int(1, 5);
      let to = "x\\to0", ex, ans, wk;
      if (lvl === 1) {
        const k = r.int(1, 3);
        if (k === 1) { ex = `\\frac{${E(a)}-1}{${ax(b)}}`; ans = q(a, b); wk = `\\frac{${E(a)}-1}{${ax(a)}}\\cdot${fr2(a, b)}\\to 1\\cdot${fr2(a, b)}`; }
        else if (k === 2) { ex = `\\frac{${lnArg(a)}}{${ax(b)}}`; ans = q(a, b); wk = `\\frac{${lnArg(a)}}{${ax(a)}}\\cdot${fr2(a, b)}\\to 1\\cdot${fr2(a, b)}`; }
        else { if (a === b) continue; ex = `\\frac{${E(a)}-${E(b)}}{${ax(c)}}`; ans = q(a - b, c); wk = `\\frac{(${E(a)}-1)-(${E(b)}-1)}{${ax(c)}}\\to\\frac{${a}-(${b})}{${c}}`; }
      } else if (lvl === 2) {
        const k = r.int(1, 4);
        if (k === 1) { ex = `\\frac{${E(a)}-1}{${lnArg(b)}}`; ans = q(a, b); wk = `\\frac{${E(a)}-1}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${lnArg(b)}}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else if (k === 2) { ex = `\\frac{${lnArg(a)}}{${E(b)}-1}`; ans = q(a, b); wk = `\\frac{${lnArg(a)}}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${E(b)}-1}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else if (k === 3) { ex = `\\frac{${E(a)}-1}{${fnx("sin", b)}}`; ans = q(a, b); wk = `\\frac{${E(a)}-1}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${fnx("sin", b)}}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else { if (a === b) continue; ex = `\\frac{${lnArg(a)}-${lnArg(b)}}{${ax(c)}}`; ans = q(a - b, c); wk = `\\frac{${lnArg(a)}}{${ax(c)}}-\\frac{${lnArg(b)}}{${ax(c)}}\\to\\frac{${a}}{${c}}-\\frac{${b}}{${c}}`; }
      } else {
        const k = r.int(1, 5);
        const bp = Math.abs(b);
        const aa = r.int(1, 4);
        const cX = aa === 1 ? "" : String(aa);
        const sq = bp === 1 ? "x^{2}" : `(${bp}x)^{2}`;
        if (k === 1) { ex = `\\frac{(${E(a)}-1)(${E(b)}-1)}{x^{2}}`; ans = q(a * b); wk = `\\frac{${E(a)}-1}{x}\\cdot\\frac{${E(b)}-1}{x}\\to ${a}\\cdot ${pp(b)}`; }
        else if (k === 2) { ex = `\\frac{e^{${cX}x^{2}}-1}{1-${fnx("cos", bp)}}`; ans = q(2 * aa, bp * bp); wk = `\\frac{e^{${cX}x^{2}}-1}{${cX}x^{2}}\\cdot\\frac{${sq}}{1-${fnx("cos", bp)}}\\cdot\\frac{${aa}}{${bp * bp}}\\to 1\\cdot 2\\cdot\\frac{${aa}}{${bp * bp}}`; }
        else if (k === 3) { ex = `\\frac{\\ln(1+${cX}x^{2})}{x${fnx("sin", bp)}}`; ans = q(aa, bp); wk = `\\frac{\\ln(1+${cX}x^{2})}{${cX}x^{2}}\\cdot\\frac{${ax(bp)}}{${fnx("sin", bp)}}\\cdot\\frac{${aa}}{${bp}}\\to\\frac{${aa}}{${bp}}`; }
        else if (k === 4) { if (a === b) continue; ex = `\\frac{${E(a)}-${E(b)}}{${fnx("sin", c)}}`; ans = q(a - b, c); wk = `\\frac{(${E(a)}-1)-(${E(b)}-1)}{${fnx("sin", c)}}\\to\\frac{${a}-(${b})}{${c}}`; }
        else { ex = `\\frac{\\ln(1+${cX}x^{2})}{1-${fnx("cos", bp)}}`; ans = q(2 * aa, bp * bp); wk = `\\frac{\\ln(1+${cX}x^{2})}{${cX}x^{2}}\\cdot\\frac{${sq}}{1-${fnx("cos", bp)}}\\cdot\\frac{${aa}}{${bp * bp}}\\to 1\\cdot 2\\cdot\\frac{${aa}}{${bp * bp}}`; }
      }
      if (!simple(ans)) continue;
      return { v: { to, ex, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("expLogLimit");
  });
plan("m.h3.cal1", "ca2_expLogLimit", [1, 2, 3], 7, 2, ["12미적Ⅱ-02-01"], "standard-limit-rewriting", "calc");

// ---- 10. limits of the form (1+h)^(1/h): find the exponent of e
add("ca2_eExponent",
  ["$\\lim_{{to}}{ex}=e^{k}$ 일 때, $k$ 의 값을 구하세요. " + FR,
    ["$\\lim_{h\\to0}(1+h)^{\\frac{1}{h}}=e$ 꼴로 만들어요.", "밑의 $h$ 와 지수가 서로 역수 관계가 되도록 지수를 나누고 곱해 보세요."],
    "$(1+h)^{\\frac{1}{h}}\\to e$ 를 이용하여 지수를 정리하면 $k={wk}={res}$ 입니다."],
  ["If $\\lim_{{to}}{ex}=e^{k}$, find $k$. " + EFR,
    ["Aim for the form $\\lim_{h\\to0}(1+h)^{\\frac{1}{h}}=e$.", "Multiply and divide the exponent so that it is the reciprocal of the added term $h$."],
    "Using $(1+h)^{\\frac{1}{h}}\\to e$ and collecting the exponent gives $k={wk}={res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const a = r.nonzero(-5, 5), b = r.nonzero(-5, 5), c = r.nonzero(-4, 4), bb = r.int(2, 5);
      let to, ex, k, wk;
      const sgnOne = (z, body) => `1${z < 0 ? "-" : "+"}${body}`;
      if (lvl === 1) {
        if (r.next() < 0.5) { to = "x\\to0"; ex = `\\left(${sgnOne(a, ax(Math.abs(a)))}\\right)^{\\frac{${b}}{x}}`; k = q(a * b); wk = `${pp(a)}\\times ${pp(b)}`; }
        else { to = "x\\to\\infty"; ex = `\\left(${sgnOne(a, `\\frac{${Math.abs(a)}}{x}`)}\\right)^{${ax(b)}}`; k = q(a * b); wk = `${pp(a)}\\times ${pp(b)}`; }
      } else if (lvl === 2) {
        const w = r.int(1, 3);
        if (w === 1) { to = "n\\to\\infty"; ex = `\\left(${sgnOne(a, `\\frac{${Math.abs(a)}}{${bb}n}`)}\\right)^{${ax(c, "n")}}`; k = q(a * c, bb); wk = `\\frac{${pp(a)}\\times ${pp(c)}}{${bb}}`; }
        else if (w === 2) { if (a === b) continue; to = "x\\to\\infty"; ex = `\\left(\\frac{x${pm(a)}}{x${pm(b)}}\\right)^{${ax(c)}}`; k = q(c * (a - b)); wk = `${pp(c)}\\times(${a}-(${b}))`; }
        else { to = "x\\to0"; ex = `\\left(${sgnOne(a, ax(Math.abs(a)))}\\right)^{\\frac{1}{${ax(b)}}}`; k = q(a, b); wk = `${fr2(a, b)}`; }
      } else {
        if (r.next() < 0.5) { to = "x\\to0"; ex = `\\left(${sgnOne(a, `${Math.abs(a) === 1 ? "" : Math.abs(a)}\\sin ${ax(Math.abs(b))}`)}\\right)^{\\frac{${c}}{x}}`; k = q(a * Math.abs(b) * c); wk = `${pp(a)}\\times ${Math.abs(b)}\\times ${pp(c)}`; }
        else { to = "x\\to0"; ex = `\\left(${sgnOne(a, `${Math.abs(a) === 1 ? "" : Math.abs(a)}x^{2}`)}\\right)^{\\frac{${b}}{x^{2}}}`; k = q(a * b); wk = `${pp(a)}\\times ${pp(b)}`; }
      }
      if (!simple(k)) continue;
      return { v: { to, ex, wk, res: tq(k) }, ans: num(k) };
    }
    throw new Error("eExponent");
  });
plan("m.h3.cal1", "ca2_eExponent", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-01"], "e-as-limit", "calc");

// ---- 11. derivative value of exponential / logarithmic functions
add("ca2_derivExpLog",
  ["함수 $f(x)={fx}$ 에 대하여 $f'({x0})$ 의 값을 구하세요. " + FR,
    ["$(e^{x})'=e^{x}$, $(\\ln x)'=\\frac{1}{x}$ 와 합성함수의 미분법을 써서 $f'(x)$ 를 먼저 구해요.", "대입하는 값이 $\\ln m$ 꼴이면 $e^{\\ln m}=m$ 임을 이용해요."],
    "$f'(x)={fp}$ 이므로 $f'({x0})={sub}$ 입니다."],
  ["For $f(x)={fx}$, find $f'({x0})$. " + EFR,
    ["Differentiate with $(e^{x})'=e^{x}$, $(\\ln x)'=\\frac{1}{x}$ and the chain rule.", "If the value substituted has the form $\\ln m$, use $e^{\\ln m}=m$."],
    "$f'(x)={fp}$, so $f'({x0})={sub}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      let fx, x0, fp, ans, sub;
      if (lvl === 1) {
        const k = r.pick([1, 1, 2, 3]), m = r.pick([2, 3, 4, 5]), p = r.nonzero(-5, 5);
        x0 = lnTex(m, k);
        const eln = `e^{\\ln ${m}}`;
        if (r.next() < 0.6) {
          const qq = r.nonzero(-5, 5);
          fx = terms([[p, E(k)], [qq, E(-k)]]); fp = terms([[p * k, E(k)], [-qq * k, E(-k)]]);
          ans = q(k).mul(q(p).mul(q(m)).sub(q(qq, m)));
          sub = `${sj(cmul(p * k, eln), cmul(-qq * k, `e^{-\\ln ${m}}`))}=${sj(cmul(p * k, String(m)), cmul(-qq * k, `\\frac{1}{${m}}`))}=${tq(ans)}`;
        } else {
          const s = r.nonzero(-5, 5), c0 = r.int(-5, 5);
          fx = terms([[p, E(k)], [s, "x"], [c0, ""]]); fp = terms([[p * k, E(k)], [s, ""]]);
          ans = q(p * k * m + s);
          sub = `${sj(cmul(p * k, eln), String(s))}=${sj(cmul(p * k, String(m)), String(s))}=${tq(ans)}`;
        }
      } else if (lvl === 2) {
        const kind = r.int(1, 3);
        if (kind === 1) {
          const a = r.int(1, 3), b = r.int(-4, 4), c = r.int(1, 6);
          if (b * b >= 4 * a * c) continue;
          const x1 = r.int(-3, 3);
          fx = `\\ln(${poly([a, b, c], "x")})`; fp = `\\frac{${poly([2 * a, b], "x")}}{${poly([a, b, c], "x")}}`; x0 = String(x1);
          ans = q(2 * a * x1 + b, a * x1 * x1 + b * x1 + c);
          sub = `\\frac{${2 * a * x1 + b}}{${a * x1 * x1 + b * x1 + c}}=${tq(ans)}`;
        } else if (kind === 2) {
          const a = r.nonzero(-4, 4), b = r.int(-5, 5), c = r.nonzero(-4, 4), d = r.int(-5, 5), x1 = r.int(-3, 3);
          if (a * d - b * c === 0 || a * x1 + b <= 0 || c * x1 + d <= 0) continue;
          fx = `\\ln\\frac{${lin(a, b, "x")}}{${lin(c, d, "x")}}`; fp = `\\frac{${a}}{${lin(a, b, "x")}}-\\frac{${c}}{${lin(c, d, "x")}}`; x0 = String(x1);
          ans = q(a, a * x1 + b).sub(q(c, c * x1 + d));
          sub = `${sj(sfrac(a, a * x1 + b), sfrac(-c, c * x1 + d))}=${tq(ans)}`;
        } else {
          const p = r.nonzero(-4, 4), a = r.int(1, 4), b = r.int(0, 5), s = r.nonzero(-3, 3), x1 = r.int(1, 4);
          if (a * x1 + b <= 0) continue;
          fx = `${cf(p)}\\ln(${lin(a, b, "x")})${s < 0 ? "-" : "+"}${Math.abs(s) === 1 ? "" : Math.abs(s)}x^{2}`;
          fp = `\\frac{${p * a}}{${lin(a, b, "x")}}${2 * s < 0 ? "-" : "+"}${Math.abs(2 * s)}x`; x0 = String(x1);
          ans = q(p * a, a * x1 + b).add(q(2 * s * x1));
          sub = `${sj(sfrac(p * a, a * x1 + b), String(2 * s * x1))}=${tq(ans)}`;
        }
      } else {
        const kind = r.int(1, 4);
        if (kind === 1) {
          const k = r.pick([1, 1, 2]), m = r.int(2, 5), a = r.int(1, 5);
          fx = `\\ln(e^{${ax(k)}}+${a})`; fp = `\\frac{${cf(k)}e^{${ax(k)}}}{e^{${ax(k)}}+${a}}`; x0 = lnTex(m, k);
          ans = q(k * m, m + a);
          sub = `\\frac{${cmul(k, `e^{\\ln ${m}}`)}}{e^{\\ln ${m}}+${a}}=\\frac{${k * m}}{${m + a}}=${tq(ans)}`;
        } else if (kind === 2) {
          const k = r.nonzero(-3, 3), p = r.nonzero(-4, 4), qq = r.int(-5, 5);
          fx = `(${lin(p, qq, "x")})e^{${ax(k)}}`; fp = `\\left(${lin(p * k, p + k * qq, "x")}\\right)e^{${ax(k)}}`; x0 = "0";
          ans = q(p + k * qq);
          sub = `\\left(${p * k}\\cdot 0${plus(String(p + k * qq))}\\right)e^{0}=${p + k * qq}`;
        } else if (kind === 3) {
          const p = r.nonzero(-4, 4), qq = r.nonzero(-5, 5);
          fx = `(${poly([p, qq, 0], "x")})\\ln x`; fp = `(${lin(2 * p, qq, "x")})\\ln x${plus(poly([p, qq], "x"))}`; x0 = "1";
          ans = q(p + qq);
          sub = `(${2 * p + qq})\\ln 1${plus(String(p + qq))}=${p + qq}`;
        } else {
          const k = r.nonzero(-3, 3);
          fx = `\\ln(1+e^{${ax(k)}})`; fp = `\\frac{${cf(k)}e^{${ax(k)}}}{1+e^{${ax(k)}}}`; x0 = "0";
          ans = q(k, 2);
          sub = `\\frac{${cmul(k, "e^{0}")}}{1+e^{0}}=\\frac{${k}}{2}=${tq(ans)}`;
        }
      }
      if (!simple(ans)) continue;
      return { v: { fx, x0, fp, sub, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("derivExpLog");
  });
plan("m.h3.cal1", "ca2_derivExpLog", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-01", "12미적Ⅱ-02-05"], "differentiate-exp-log", "calc");

// ---- 12. quotient rule at a point
add("ca2_quotientDeriv",
  ["함수 $f(x)={fx}$ 에 대하여 $f'({x0})$ 의 값을 구하세요. " + FR,
    ["몫의 미분법 $\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^{2}}$ 를 써요.", "$u$, $v$ 와 $u'$, $v'$ 의 값을 $x={x0}$ 에서 각각 구해 대입해요."],
    "$u({x0})={u0}$, $u'({x0})={du}$, $v({x0})={v0}$, $v'({x0})={dv}$ 이므로 $f'({x0})=\\frac{({du})({v0})-({u0})({dv})}{({v0})^{2}}={res}$ 입니다."],
  ["For $f(x)={fx}$, find $f'({x0})$. " + EFR,
    ["Use the quotient rule $\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^{2}}$.", "Evaluate $u$, $v$, $u'$, $v'$ at $x={x0}$ and substitute."],
    "$u({x0})={u0}$, $u'({x0})={du}$, $v({x0})={v0}$, $v'({x0})={dv}$, so $f'({x0})=\\frac{({du})({v0})-({u0})({dv})}{({v0})^{2}}={res}$."],
  (r, lvl) => {
    const sinS = [0, 1, 0, -1], cosS = [1, 0, -1, 0];
    for (let tries = 0; tries < 500; tries++) {
      let fx, x0, u0, du, v0, dv;
      if (lvl === 1) {
        const kind = r.int(1, 3), x1 = r.int(-3, 3);
        x0 = String(x1);
        if (kind === 1) {
          const a = r.nonzero(-5, 5), b = r.int(-5, 5), c = r.int(1, 3), d = r.int(1, 6);
          fx = `\\frac{${lin(a, b, "x")}}{${poly([c, 0, d], "x")}}`; u0 = a * x1 + b; du = a; v0 = c * x1 * x1 + d; dv = 2 * c * x1;
        } else if (kind === 2) {
          const a = r.nonzero(-3, 3), b = r.int(-6, 6), c = r.nonzero(-4, 4), d = r.int(-6, 6);
          const v1 = c * x1 + d; if (v1 === 0) continue;
          fx = `\\frac{${poly([a, 0, b], "x")}}{${lin(c, d, "x")}}`; u0 = a * x1 * x1 + b; du = 2 * a * x1; v0 = v1; dv = c;
        } else {
          const a = r.nonzero(-5, 5), b = r.int(-5, 5), c = r.nonzero(-5, 5), d = r.int(-5, 5);
          const v1 = c * x1 + d; if (v1 === 0 || a * d - b * c === 0) continue;
          fx = `\\frac{${lin(a, b, "x")}}{${lin(c, d, "x")}}`; u0 = a * x1 + b; du = a; v0 = v1; dv = c;
        }
      } else if (lvl === 2) {
        const kind = r.int(1, 4);
        if (kind === 1) { const k = r.nonzero(-3, 3), p = r.nonzero(-4, 4), qq = r.nonzero(-5, 5); fx = `\\frac{e^{${ax(k)}}}{${lin(p, qq, "x")}}`; x0 = "0"; u0 = 1; du = k; v0 = qq; dv = p; }
        else if (kind === 2) { const p = r.int(1, 4), qq = r.int(1, 5); fx = `\\frac{\\ln x}{${poly([p, 0, qq], "x")}}`; x0 = "1"; u0 = 0; du = 1; v0 = p + qq; dv = 2 * p; }
        else if (kind === 3) { const k = r.nonzero(-3, 3), p = r.nonzero(-4, 4), qq = r.nonzero(-5, 5); fx = `\\frac{${lin(p, qq, "x")}}{e^{${ax(k)}}}`; x0 = "0"; u0 = qq; du = p; v0 = 1; dv = k; }
        else { const a = r.int(1, 5), p = r.nonzero(-3, 3); fx = `\\frac{${ax(p)}}{e^{x}+${a}}`; x0 = "0"; u0 = 0; du = p; v0 = 1 + a; dv = 1; }
      } else {
        const j = r.int(0, 3), s = sinS[j], c = cosS[j];
        x0 = piTex(j, 2);
        const kind = r.int(1, 4);
        const a = r.int(2, 6), p = r.nonzero(-4, 4);
        if (kind === 1) { fx = `\\frac{\\sin x}{${a}+\\cos x}`; u0 = s; du = c; v0 = a + c; dv = -s; }
        else if (kind === 2) { fx = `\\frac{${p}+\\sin x}{${a}+\\cos x}`; u0 = p + s; du = c; v0 = a + c; dv = -s; }
        else if (kind === 3) { fx = `\\frac{\\cos x}{${a}+\\sin x}`; u0 = c; du = -s; v0 = a + s; dv = c; }
        else { fx = `\\frac{${p}\\cos x-\\sin x}{${a}-\\sin x}`; u0 = p * c - s; du = -p * s - c; v0 = a - s; dv = -c; }
      }
      const ans = q(du * v0 - u0 * dv, v0 * v0);
      if (!simple(ans, 60)) continue;
      return { v: { fx, x0, u0, du, v0, dv, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("quotientDeriv");
  });
plan("m.h3.cal1", "ca2_quotientDeriv", [1, 2, 3], 7, 2, ["12미적Ⅱ-02-04"], "quotient-rule-at-a-point", "calc");

// ---- 13. trigonometric limits
add("ca2_trigLimit",
  ["다음 극한값을 구하세요. $\\lim_{{to}}{ex}$ " + FR,
    ["$\\lim_{x\\to0}\\frac{\\sin x}{x}=1$, $\\lim_{x\\to0}\\frac{\\tan x}{x}=1$ 과 $1-\\cos x=\\frac{\\sin^{2}x}{1+\\cos x}$ 를 이용해요.", "$x\\to c$ 인 극한은 $t=x-c$ 로 놓고 $t\\to0$ 으로 바꿔 보세요. $x\\to\\infty$ 이면 $h=\\frac{1}{x}$ 로 놓아 보세요."],
    "기본 극한을 쓸 수 있게 변형하면 ${wk}$ 이므로 극한값은 ${res}$ 입니다."],
  ["Find the limit. $\\lim_{{to}}{ex}$ " + EFR,
    ["Use $\\lim_{x\\to0}\\frac{\\sin x}{x}=1$, $\\lim_{x\\to0}\\frac{\\tan x}{x}=1$ and $1-\\cos x=\\frac{\\sin^{2}x}{1+\\cos x}$.", "For $x\\to c$, put $t=x-c$ and let $t\\to0$. For $x\\to\\infty$, put $h=\\frac{1}{x}$."],
    "Rewriting with the basic limits gives ${wk}$, so the limit is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const a = r.nonzero(-6, 6), b = r.nonzero(-6, 6), c = r.int(1, 5);
      let to = "x\\to0", ex, ans, wk;
      const S = (z) => `${fnx("sin", z)}`, T = (z) => `${fnx("tan", z)}`, Cs = (z) => `${fnx("cos", z)}`;
      if (lvl === 1) {
        const k = r.int(1, 4);
        if (k === 1) { ex = `\\frac{${S(a)}}{${ax(b)}}`; ans = q(a, b); wk = `\\frac{${S(a)}}{${ax(a)}}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else if (k === 2) { ex = `\\frac{${T(a)}}{${ax(b)}}`; ans = q(a, b); wk = `\\frac{${T(a)}}{${ax(a)}}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else if (k === 3) { ex = `\\frac{${S(a)}}{${S(b)}}`; ans = q(a, b); wk = `\\frac{${S(a)}}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${S(b)}}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else { if (a === b) continue; ex = `\\frac{${S(a)}-${S(b)}}{${ax(c)}}`; ans = q(a - b, c); wk = `\\frac{${S(a)}}{${ax(c)}}-\\frac{${S(b)}}{${ax(c)}}\\to\\frac{${a}}{${c}}-\\frac{${b}}{${c}}`; }
      } else if (lvl === 2) {
        const k = r.int(1, 4);
        if (k === 1) { ex = `\\frac{1-${Cs(a)}}{x^{2}}`; ans = q(a * a, 2); wk = `\\frac{1-${Cs(a)}}{(${ax(a)})^{2}}\\cdot ${a * a}\\to\\frac{1}{2}\\cdot ${a * a}`; }
        else if (k === 2) { ex = `\\frac{${T(a)}}{${S(b)}}`; ans = q(a, b); wk = `\\frac{${T(a)}}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${S(b)}}\\cdot${fr2(a, b)}\\to${fr2(a, b)}`; }
        else if (k === 3) { ex = `\\frac{x${S(a)}}{1-${Cs(b)}}`; if (a === 1) continue; ans = q(2 * a, b * b); wk = `\\frac{${S(a)}}{${ax(a)}}\\cdot\\frac{(${ax(b)})^{2}}{1-${Cs(b)}}\\cdot\\frac{${a}}{${b * b}}\\to 1\\cdot 2\\cdot\\frac{${a}}{${b * b}}`; }
        else { ex = `\\frac{1-${Cs(a)}}{x${S(b)}}`; ans = q(a * a, 2 * b); wk = `\\frac{1-${Cs(a)}}{(${ax(a)})^{2}}\\cdot\\frac{${ax(b)}}{${S(b)}}\\cdot\\frac{${a * a}}{${b}}\\to\\frac{1}{2}\\cdot\\frac{${a * a}}{${b}}`; }
      } else {
        const k = r.int(1, 7);
        const m = r.int(1, 3);
        if (k === 1) { const mm = r.int(1, 5); to = "x\\to\\pi"; ex = `\\frac{${fnx("sin", mm)}}{x-\\pi}`; ans = q(mm * (mm % 2 === 0 ? 1 : -1)); wk = `t=x-\\pi,\\ \\frac{\\sin(${mm === 1 ? "" : mm}t+${mm}\\pi)}{t}=${mm % 2 === 0 ? "" : "-"}\\frac{\\sin ${ax(mm, "t")}}{t}\\to ${ans.toString()}`; }
        else if (k === 2) { to = `x\\to${piTex(1, 2 * m)}`; ex = `\\frac{\\cos ${ax(m)}}{x-${piTex(1, 2 * m)}}`; ans = q(-m); wk = `t=x-${piTex(1, 2 * m)},\\ \\cos\\left(${ax(m, "t")}+\\frac{\\pi}{2}\\right)=-\\sin ${ax(m, "t")}\\ \\Rightarrow\\ -\\frac{\\sin ${ax(m, "t")}}{t}\\to ${-m}`; }
        else if (k === 3) { const bb = r.int(1, 4); to = `x\\to${piTex(1, 2 * m)}`; ex = `\\frac{1-\\sin ${ax(m)}}{${bb === 1 ? "" : bb}\\left(x-${piTex(1, 2 * m)}\\right)^{2}}`; ans = q(m * m, 2 * bb); wk = `t=x-${piTex(1, 2 * m)},\\ \\sin ${ax(m)}=\\cos ${ax(m, "t")}\\ \\Rightarrow\\ \\frac{1-\\cos ${ax(m, "t")}}{${bb === 1 ? "" : bb}t^{2}}\\to\\frac{${m * m}}{${2 * bb}}`; }
        else if (k === 4) { ex = `\\frac{${S(a)}${T(b)}}{x^{2}}`; ans = q(a * b); wk = `\\frac{${S(a)}}{x}\\cdot\\frac{${T(b)}}{x}\\to ${a}\\cdot ${pp(b)}`; }
        else if (k === 5) { to = "x\\to\\infty"; ex = a > 0 ? `x\\sin\\frac{${a}}{x}` : `x\\sin\\left(-\\frac{${-a}}{x}\\right)`; ans = q(a); wk = `\\frac{\\sin h}{h}\\cdot ${a}\\ (h=\\frac{${a}}{x}\\to0)\\to ${a}`; }
        else if (k === 6) {
          const j = r.pick([1, 2, 4, 5]);
          const cos3 = { 1: q(1, 2), 2: q(-1, 2), 4: q(-1, 2), 5: q(1, 2) }[j];
          ex = `\\frac{\\sin\\left(${piTex(j, 3)}${a < 0 ? "-" : "+"}${ax(Math.abs(a))}\\right)-\\sin ${piTex(j, 3)}}{x}`;
          ans = cos3.mul(q(a)); wk = `${a}\\cdot(\\sin x)'\\Big|_{x=${piTex(j, 3)}}=${a}\\cdot\\cos ${piTex(j, 3)}=${a}\\cdot ${pr(cos3)}`;
        } else {
          const j = r.pick([1, 3]);
          const sin2 = j === 1 ? 1 : -1;
          ex = `\\frac{\\cos\\left(${piTex(j, 2)}${a < 0 ? "-" : "+"}${ax(Math.abs(a))}\\right)-\\cos ${piTex(j, 2)}}{x}`;
          ans = q(-a * sin2); wk = `${a}\\cdot(\\cos x)'\\Big|_{x=${piTex(j, 2)}}=${a}\\cdot\\left(-\\sin ${piTex(j, 2)}\\right)=${a}\\cdot ${pr(q(-sin2))}`;
        }
      }
      if (!simple(ans)) continue;
      return { v: { to, ex, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("trigLimit");
  });
plan("m.h3.cal1", "ca2_trigLimit", [1, 2, 3], 7, 2, ["12미적Ⅱ-02-03"], "standard-trig-limit", "calc");

// ---- 14. unknown constant a from a trig limit (the unknown may appear in several places)
add("ca2_trigLimitUnknown",
  ["등식 ${eq}$ 가 성립하도록 하는 양의 정수 $a$ 의 값을 구하세요. " + NUM,
    ["$x\\to0$ 일 때 극한값을 $a$ 로 나타내 보세요.", "나온 식을 주어진 값과 같다고 놓고 $a$ 에 대해 풀어요. $a$ 가 양의 정수라는 조건으로 하나로 정해져요."],
    "극한값은 ${wk}$ 이고 이것이 주어진 값과 같습니다. 이를 만족하는 양의 정수는 $a={ans}$ 이고, 대입하면 ${chk}$ 로 성립합니다."],
  ["Find the positive integer $a$ for which ${eq}$ holds. " + ENUM,
    ["Express the limit as $x\\to0$ in terms of $a$.", "Set that expression equal to the given value and solve for $a$; the condition that $a$ is a positive integer makes it unique."],
    "The limit equals ${wk}$, which must equal the given value. The positive integer satisfying it is $a={ans}$, and substituting gives ${chk}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const a = r.int(1, 8), b = r.int(1, 6), c = r.int(1, 5);
      let lhs, val, wk, chk;
      if (lvl === 1) {
        const k = r.int(1, 3);
        if (k === 1) { lhs = `\\frac{\\sin ax}{${ax(b)}}`; val = q(a, b); }
        else if (k === 2) { lhs = `\\frac{\\tan ax}{${ax(b)}}`; val = q(a, b); }
        else { lhs = `\\frac{e^{ax}-1}{${fnx("sin", b)}}`; val = q(a, b); }
        wk = `\\frac{a}{${b}}`; chk = `\\frac{${a}}{${b}}=${tq(val)}`;
      } else if (lvl === 2) {
        const k = r.int(1, 3);
        if (k === 1) { lhs = `\\frac{1-\\cos ax}{x${fnx("sin", b)}}`; val = q(a * a, 2 * b); wk = `\\frac{a^{2}}{${2 * b}}`; chk = `\\frac{${a}^{2}}{${2 * b}}=${tq(val)}`; }
        else if (k === 2) { lhs = `\\frac{\\sin ax+${fnx("sin", b)}}{x}`; val = q(a + b); wk = `a+${b}`; chk = `${a}+${b}=${tq(val)}`; }
        else { lhs = `\\frac{\\sin ax}{\\sin((a+${c})x)}`; val = q(a, a + c); wk = `\\frac{a}{a+${c}}`; chk = `\\frac{${a}}{${a}+${c}}=${tq(val)}`; }
      } else {
        const k = r.int(1, 3);
        if (k === 1) { lhs = `\\frac{1-\\cos ax}{x\\sin((a+${c})x)}`; val = q(a * a, 2 * (a + c)); wk = `\\frac{a^{2}}{2(a+${c})}`; chk = `\\frac{${a}^{2}}{2(${a}+${c})}=${tq(val)}`; }
        else if (k === 2) { lhs = `\\frac{\\sin ax\\,\\sin((a+${c})x)}{x^{2}}`; val = q(a * (a + c)); wk = `a(a+${c})`; chk = `${a}(${a}+${c})=${tq(val)}`; }
        else { lhs = `\\frac{\\sin^{2}ax}{1-${fnx("cos", b)}}`; val = q(2 * a * a, b * b); wk = `\\frac{2a^{2}}{${b * b}}`; chk = `\\frac{2\\cdot ${a}^{2}}{${b * b}}=${tq(val)}`; }
      }
      if (!simple(val, 60)) continue;
      return { v: { eq: `\\lim_{x\\to0}${lhs}=${tq(val)}`, wk, chk }, ans: a };
    }
    throw new Error("trigLimitUnknown");
  });
plan("m.h3.cal1", "ca2_trigLimitUnknown", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-03"], "limit-determines-parameter", "reverse");

// ---- 15. two constants determined by the existence of a limit (elementary forms only)
add("ca2_limitPair",
  ["상수 $a$, $b$ 에 대하여 ${eq}$ 일 때, $ab$ 의 값을 구하세요. " + NUM,
    ["극한값이 존재하는데 분모가 극한에서 $0$ 이 되면 분자도 $0$ 이 되어야 해요. 이 조건으로 $a$, $b$ 사이의 관계를 먼저 구해요.", "그 관계를 대입한 뒤, 분자를 인수분해하거나 유리화하거나 $1-\\cos x=\\frac{\\sin^{2}x}{1+\\cos x}$ 로 바꾸어 극한값을 구하고 주어진 값과 같다고 놓아요."],
    "${wk}$ 이므로 $ab={ans}$ 입니다."],
  ["For constants $a$ and $b$, if ${eq}$, find $ab$. " + ENUM,
    ["If the limit exists while the denominator tends to $0$, the numerator must also tend to $0$. Use this to relate $a$ and $b$ first.", "Substitute that relation, then factor, rationalize or use $1-\\cos x=\\frac{\\sin^{2}x}{1+\\cos x}$ to evaluate the limit and set it equal to the given value."],
    "${wk}$, so $ab={ans}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let eq, wk, ans;
      if (lvl === 1) {
        if (r.next() < 0.5) {
          const d = r.pick([-2, -1, 1, 2, 3]), L = r.nonzero(-4, 4);
          const a = L - 2 * d, b = -d * (L - d);
          if (a === 0 || b === 0) continue;
          eq = `\\lim_{x\\to${d}}\\frac{x^{2}+ax+b}{x${pm(-d)}}=${L}`;
          wk = `${pp(d)}^{2}+${pp(d)}a+b=0\\ \\Rightarrow\\ x^{2}+ax+b=(x${pm(-d)})(x${pm(d)}+a),\\ \\lim=2\\cdot ${pp(d)}+a=${L}\\ \\Rightarrow\\ a=${a},\\ b=${b}`;
          ans = a * b;
        } else {
          const b = r.nonzero(-6, 6), c = r.int(1, 3);
          const L = q(-b * c * c, 2);
          eq = `\\lim_{x\\to0}\\frac{a+b\\cos ${ax(c)}}{x^{2}}=${tq(L)}`;
          wk = `a+b=0,\\ \\frac{b(\\cos ${ax(c)}-1)}{x^{2}}=-b\\cdot\\frac{1-\\cos ${ax(c)}}{${c === 1 ? "x^{2}" : `(${c}x)^{2}`}}${c === 1 ? "" : `\\cdot ${c * c}`}\\to -\\frac{${cf(c * c)}b}{2}=${tq(L)}\\ \\Rightarrow\\ b=${b},\\ a=${-b}`;
          ans = -b * b;
        }
      } else if (lvl === 2) {
        if (r.next() < 0.7) {
          const c = r.int(1, 3), d = r.pick([-1, 0, 1, 2, 3]), a = r.nonzero(-8, 8);
          const b = c * c - a * d;
          if (b === 0) continue;
          const L = q(a, 2 * c);
          if (!simple(L, 12)) continue;
          eq = `\\lim_{x\\to${d}}\\frac{\\sqrt{ax+b}-${c}}{x${d === 0 ? "" : pm(-d)}}=${tq(L)}`;
          wk = `\\sqrt{a\\cdot ${pp(d)}+b}=${c}\\ \\Rightarrow\\ b=${c * c}-${pp(d)}a,\\ \\frac{\\sqrt{ax+b}-${c}}{x${d === 0 ? "" : pm(-d)}}=\\frac{a}{\\sqrt{ax+b}+${c}}\\to\\frac{a}{${2 * c}}=${tq(L)}\\ \\Rightarrow\\ a=${a},\\ b=${b}`;
          ans = a * b;
        } else {
          const b = r.int(1, 6);
          const L = q(1, 2 * b);
          eq = `\\lim_{x\\to\\infty}\\left(\\sqrt{ax^{2}+x}-bx\\right)=${tq(L)}`;
          wk = `\\sqrt{ax^{2}+x}-bx=\\frac{(a-b^{2})x^{2}+x}{\\sqrt{ax^{2}+x}+bx}\\ \\Rightarrow\\ a=b^{2},\\ \\frac{x}{\\sqrt{b^{2}x^{2}+x}+bx}\\to\\frac{1}{2b}=${tq(L)}\\ \\Rightarrow\\ b=${b},\\ a=${b * b}`;
          ans = b * b * b;
        }
      } else {
        if (r.next() < 0.45) {
          const a = r.pick([2, 4, 6, -2, -4, -6]);
          const L = q(-a * a, 8);
          eq = `\\lim_{x\\to0}\\frac{\\sqrt{1+ax}-1-bx}{x^{2}}=${tq(L)}`;
          wk = `\\sqrt{1+ax}-1=\\frac{ax}{\\sqrt{1+ax}+1}\\ \\Rightarrow\\ b=\\frac{a}{2},\\ \\frac{\\sqrt{1+ax}-1-\\frac{a}{2}x}{x^{2}}=-\\frac{a^{2}}{2\\left(\\sqrt{1+ax}+1\\right)^{2}}\\to -\\frac{a^{2}}{8}=${tq(L)}\\ \\Rightarrow\\ a^{2}=${a * a},\\ ab=\\frac{a^{2}}{2}`;
          ans = (a * a) / 2;
        } else {
          const b = r.nonzero(-6, 6), c = r.int(1, 3);
          const L = q(-b * c * c, 2);
          eq = `\\lim_{x\\to0}\\frac{a+b\\cos ${ax(c)}}{x\\sin x}=${tq(L)}`;
          wk = `a+b=0,\\ \\frac{b(\\cos ${ax(c)}-1)}{x\\sin x}=-b\\cdot\\frac{1-\\cos ${ax(c)}}{${c === 1 ? "x^{2}" : `(${c}x)^{2}`}}\\cdot\\frac{x}{\\sin x}${c === 1 ? "" : `\\cdot ${c * c}`}\\to -\\frac{${cf(c * c)}b}{2}=${tq(L)}\\ \\Rightarrow\\ b=${b},\\ a=${-b}`;
          ans = -b * b;
        }
      }
      return { v: { eq, wk }, ans };
    }
    throw new Error("limitPair");
  });
plan("m.h3.cal1", "ca2_limitPair", [1, 2, 3], 7, 4, ["12미적Ⅱ-02-03", "12미적Ⅱ-02-01"], "limit-determines-two-parameters", "reverse");

// ---- 16. derivative of trigonometric functions at a point
add("ca2_trigDeriv",
  ["함수 $f(x)={fx}$ 에 대하여 $f'({x0})$ 의 값을 구하세요. " + FR,
    ["$(\\sin x)'=\\cos x$, $(\\cos x)'=-\\sin x$, $(\\tan x)'=\\frac{1}{\\cos^{2}x}$ 와 곱의 미분법, 몫의 미분법, 합성함수의 미분법을 써서 $f'(x)$ 를 구해요.", "구한 $f'(x)$ 에 $x={x0}$ 를 넣고 삼각함수의 값을 계산해요."],
    "$f'(x)={fp}$ 이므로 $f'({x0})={res}$ 입니다."],
  ["For $f(x)={fx}$, find $f'({x0})$. " + EFR,
    ["Use $(\\sin x)'=\\cos x$, $(\\cos x)'=-\\sin x$, $(\\tan x)'=\\frac{1}{\\cos^{2}x}$ together with the product, quotient and chain rules to find $f'(x)$.", "Substitute $x={x0}$ and evaluate the trigonometric values."],
    "$f'(x)={fp}$, so $f'({x0})={res}$."],
  (r, lvl) => {
    const sinS = [0, 1, 0, -1], cosS = [1, 0, -1, 0];
    // sin^2 and cos^2 at pi/6, pi/4, pi/3
    const SQ = { 6: [q(1, 4), q(3, 4)], 4: [q(1, 2), q(1, 2)], 3: [q(3, 4), q(1, 4)] };
    for (let tries = 0; tries < 500; tries++) {
      let fx, x0, fp, ans;
      const S = (z) => `${fnx("sin", z)}`, Cs = (z) => `${fnx("cos", z)}`;
      if (lvl === 1) {
        const k = r.int(1, 3), j = r.int(0, 5), p = r.nonzero(-5, 5), qq = r.nonzero(-5, 5);
        fx = terms([[p, S(k)], [qq, Cs(k)]]); fp = terms([[p * k, Cs(k)], [-qq * k, S(k)]]); x0 = piTex(j, 2 * k);
        ans = q(k * (p * cosS[j % 4] - qq * sinS[j % 4]));
      } else if (lvl === 2) {
        const kind = r.int(1, 5), a = r.nonzero(-5, 5), k = r.int(1, 4);
        if (kind === 1) { fx = `${cf(a)}${fnx("tan", k)}`; fp = `\\frac{${a * k}}{\\cos^{2} ${ax(k)}}`; x0 = piTex(1, 4 * k); ans = q(2 * a * k); }
        else if (kind === 2) { fx = `${cf(a)}\\sin^{2} x`; fp = `${cf(a)}\\sin 2x`; x0 = piTex(1, 4); ans = q(a); }
        else if (kind === 3) { fx = `${cf(a)}\\sin x\\cos x`; fp = `${cf(a)}\\cos 2x`; x0 = piTex(1, 6); ans = q(a, 2); }
        else if (kind === 4) { fx = `${cf(a)}\\sin^{3} x`; fp = `${3 * a}\\sin^{2} x\\cos x`; x0 = piTex(1, 3); ans = q(9 * a, 8); }
        else { fx = `${cf(a)}\\cos^{3} x`; fp = `${-3 * a}\\cos^{2} x\\sin x`; x0 = piTex(1, 6); ans = q(-9 * a, 8); }
      } else {
        const kind = r.int(1, 6), a = r.nonzero(-5, 5), k = r.int(1, 3), p = r.nonzero(-4, 4), qq = r.nonzero(-5, 5);
        if (kind === 1) { fx = `${cf(a)}\\ln(${fnx("cos", k)})`; fp = `${cf(-a * k)}${fnx("tan", k)}`; x0 = piTex(1, 4 * k); ans = q(-a * k); }
        else if (kind === 2) {
          const d = r.pick([6, 4, 3]); const [s2, c2] = SQ[d];
          x0 = piTex(1, d);
          if (r.next() < 0.5) { fx = `${cf(a)}\\sin x\\cos^{3} x`; fp = `${cf(a)}\\left(\\cos^{4} x-3\\sin^{2} x\\cos^{2} x\\right)`; ans = q(a).mul(c2.mul(c2).sub(q(3).mul(s2).mul(c2))); }
          else { fx = `${cf(a)}\\sin^{3} x\\cos x`; fp = `${cf(a)}\\left(3\\sin^{2} x\\cos^{2} x-\\sin^{4} x\\right)`; ans = q(a).mul(q(3).mul(s2).mul(c2).sub(s2.mul(s2))); }
        }
        else if (kind === 3) {
          const c0 = r.int(2, 5), j = r.pick([1, 2]); const cv = j === 1 ? q(1, 2) : q(-1, 2);
          fx = `\\frac{\\sin x}{${c0}+\\cos x}`; fp = `\\frac{1+${c0}\\cos x}{(${c0}+\\cos x)^{2}}`; x0 = piTex(j, 3);
          ans = q(1).add(q(c0).mul(cv)).div(q(c0).add(cv).mul(q(c0).add(cv)));
        }
        else if (kind === 4) { fx = `e^{${ax(a)}}(${terms([[p, "\\sin x"], [qq, "\\cos x"]])})`; fp = `e^{${ax(a)}}\\left(${terms([[a * p - qq, "\\sin x"], [a * qq + p, "\\cos x"]])}\\right)`; x0 = "0"; ans = q(a * qq + p); }
        else if (kind === 5) { const m = r.int(2, 4); fx = `${cf(a)}\\tan^{${m}} ${ax(k)}`; fp = `${a * m * k}\\tan${m === 2 ? "" : `^{${m - 1}}`} ${ax(k)}\\sec^{2} ${ax(k)}`; x0 = piTex(1, 4 * k); ans = q(2 * a * m * k); }
        else { fx = `${cf(a)}\\ln(${fnx("sin", k)})`; fp = `${cd(a * k)}\\frac{${fnx("cos", k)}}{${fnx("sin", k)}}`; x0 = piTex(1, 4 * k); ans = q(a * k); }
      }
      if (!simple(ans, 130)) continue;
      return { v: { fx, x0, fp, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("trigDeriv");
  });
plan("m.h3.cal1", "ca2_trigDeriv", [1, 2, 3], 7, 2, ["12미적Ⅱ-02-03", "12미적Ⅱ-02-04", "12미적Ⅱ-02-05"], "differentiate-trig", "calc");

// ===================================================================== addition formulas, composite / parametric / implicit / inverse derivatives, tangents
const pr = (x) => (x.p < 0n ? `(${tq(x)})` : tq(x));
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
const QUAD = {
  1: ["0<%<\\frac{\\pi}{2}", 1, 1],
  2: ["\\frac{\\pi}{2}<%<\\pi", -1, 1],
  3: ["\\pi<%<\\frac{3\\pi}{2}", -1, -1],
  4: ["\\frac{3\\pi}{2}<%<2\\pi", 1, -1],
};
/** random angle: returns {c, s} exact cos / sin in the given quadrant */
function angleIn(r, quad) {
  const [a, b, c] = r.pick(TRIPLES);
  const [sgC, sgS] = [QUAD[quad][1], QUAD[quad][2]];
  const swap = r.next() < 0.5;
  const sinV = swap ? b : a, cosV = swap ? a : b;
  return { c: q(sgC * cosV, c), s: q(sgS * sinV, c) };
}

// ---- 17. addition formulas
add("ca2_addTheorem",
  ["${ga}$, ${gb}$ 이고 ${ra}$, ${rb}$ 일 때, ${ask}$ 의 값을 구하세요. " + FR,
    ["주어진 값과 $\\sin^{2}\\theta+\\cos^{2}\\theta=1$ 로 필요한 나머지 삼각함수의 값을 구해요. 부호는 각이 속한 사분면으로 정해요.", "구한 값을 덧셈정리에 대입해요."],
    "${kn}$ 이므로 ${ask}={wk}={res}$ 입니다."],
  ["Given ${ga}$, ${gb}$, ${ra}$ and ${rb}$, find ${ask}$. " + EFR,
    ["Use the given value and $\\sin^{2}\\theta+\\cos^{2}\\theta=1$ to get the other values; the quadrant decides the signs.", "Substitute the values into the addition formula."],
    "${kn}$, so ${ask}={wk}={res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      const qa = lvl === 1 ? 1 : r.int(1, 4), qb = lvl === 1 ? 1 : r.int(1, 4);
      const A = angleIn(r, qa), B = angleIn(r, qb);
      const ra = QUAD[qa][0].replace("%", "\\alpha"), rb = QUAD[qb][0].replace("%", "\\beta");
      const giv = (fn, ang, X) => (fn === "sin" ? `\\sin\\${ang}=${tq(X.s)}` : fn === "cos" ? `\\cos\\${ang}=${tq(X.c)}` : `\\tan\\${ang}=${tq(X.s.div(X.c))}`);
      const kn = `\\sin\\alpha=${tq(A.s)},\\ \\cos\\alpha=${tq(A.c)},\\ \\sin\\beta=${tq(B.s)},\\ \\cos\\beta=${tq(B.c)}`;
      // ask: 1..4 sin/cos of sum or difference; 5..6 tan of sum / difference (level 3 only)
      const kind = lvl <= 2 ? r.int(1, 4) : r.int(1, 6);
      const types = lvl <= 2 ? ["sin", "cos"] : kind >= 5 ? ["sin", "cos"] : ["sin", "cos", "tan"];
      const gA = r.pick(types), gB = r.pick(types);
      let ask, ans, wk;
      if (kind === 1) { ask = "\\sin(\\alpha+\\beta)"; ans = A.s.mul(B.c).add(A.c.mul(B.s)); wk = `\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta=${pr(A.s)}\\cdot ${pr(B.c)}+${pr(A.c)}\\cdot ${pr(B.s)}`; }
      else if (kind === 2) { ask = "\\sin(\\alpha-\\beta)"; ans = A.s.mul(B.c).sub(A.c.mul(B.s)); wk = `\\sin\\alpha\\cos\\beta-\\cos\\alpha\\sin\\beta=${pr(A.s)}\\cdot ${pr(B.c)}-${pr(A.c)}\\cdot ${pr(B.s)}`; }
      else if (kind === 3) { ask = "\\cos(\\alpha+\\beta)"; ans = A.c.mul(B.c).sub(A.s.mul(B.s)); wk = `\\cos\\alpha\\cos\\beta-\\sin\\alpha\\sin\\beta=${pr(A.c)}\\cdot ${pr(B.c)}-${pr(A.s)}\\cdot ${pr(B.s)}`; }
      else if (kind === 4) { ask = "\\cos(\\alpha-\\beta)"; ans = A.c.mul(B.c).add(A.s.mul(B.s)); wk = `\\cos\\alpha\\cos\\beta+\\sin\\alpha\\sin\\beta=${pr(A.c)}\\cdot ${pr(B.c)}+${pr(A.s)}\\cdot ${pr(B.s)}`; }
      else {
        const t1 = A.s.div(A.c), t2 = B.s.div(B.c);
        const plus2 = kind === 5;
        const den = plus2 ? q(1).sub(t1.mul(t2)) : q(1).add(t1.mul(t2));
        if (den.p === 0n) continue;
        const nu = plus2 ? t1.add(t2) : t1.sub(t2);
        ans = nu.div(den);
        ask = plus2 ? "\\tan(\\alpha+\\beta)" : "\\tan(\\alpha-\\beta)";
        wk = plus2 ? `\\frac{\\tan\\alpha+\\tan\\beta}{1-\\tan\\alpha\\tan\\beta}=\\frac{${pr(t1)}+${pr(t2)}}{1-${pr(t1)}\\cdot ${pr(t2)}}` : `\\frac{\\tan\\alpha-\\tan\\beta}{1+\\tan\\alpha\\tan\\beta}=\\frac{${pr(t1)}-${pr(t2)}}{1+${pr(t1)}\\cdot ${pr(t2)}}`;
      }
      if (!simple(ans, 340)) continue;
      return { v: { ga: giv(gA, "alpha", A), gb: giv(gB, "beta", B), ra, rb, ask, kn, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("addTheorem");
  });
plan("m.h3.cal1", "ca2_addTheorem", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-02"], "addition-formula-with-quadrants", "calc");

// ---- 18. angle between two lines (tan addition formula applied to slopes)
add("ca2_lineAngle",
  ["두 직선 $ {l1} $, $ {l2} $ 가 이루는 예각의 크기를 $\\theta$ 라 할 때, $\\tan\\theta$ 의 값을 구하세요. " + FR,
    ["기울기가 $m$ 인 직선이 $x$ 축의 양의 방향과 이루는 각 $\\alpha$ 는 $\\tan\\alpha=m$ 을 만족해요. 식을 $y=mx+k$ 꼴로 바꾸면 기울기를 알 수 있어요.", "두 각의 차에 대한 탄젠트 덧셈정리를 쓰고, 예각이므로 양수로 취해요."],
    "두 직선의 기울기는 $m_1={m1}$, $m_2={m2}$ 이므로 $\\tan\\theta=\\left|\\frac{m_1-m_2}{1+m_1m_2}\\right|=\\left|\\frac{({m1})-({m2})}{1+({m1})({m2})}\\right|={res}$ 입니다."],
  ["The acute angle between the lines $ {l1} $ and $ {l2} $ is $\\theta$. Find $\\tan\\theta$. " + EFR,
    ["A line of slope $m$ makes an angle $\\alpha$ with the positive $x$-axis where $\\tan\\alpha=m$. Rewrite the equation as $y=mx+k$ to read off the slope.", "Use the tangent subtraction formula and take the positive value because the angle is acute."],
    "The slopes are $m_1={m1}$ and $m_2={m2}$, so $\\tan\\theta=\\left|\\frac{m_1-m_2}{1+m_1m_2}\\right|=\\left|\\frac{({m1})-({m2})}{1+({m1})({m2})}\\right|={res}$."],
  (r, lvl) => {
    const slope = () => {
      const p = r.nonzero(-6, 6), d = r.pick([1, 1, 2, 3, 4]);
      return q(p, d);
    };
    const slopeForm = (m) => `y=${m.isInt ? (m.p === 1n ? "" : m.p === -1n ? "-" : m.p) : tq(m)}x`;
    const interceptForm = (m) => {
      const t = r.pick([1, 2, 3]);
      const p = Number(m.q) * t, qq = -Number(m.p) * t;
      return `${p === 1 ? "x" : `\\frac{x}{${p}}`}${qq < 0 ? "-" : "+"}${Math.abs(qq) === 1 ? "y" : `\\frac{y}{${Math.abs(qq)}}`}=1`;
    };
    const generalForm = (m) => {
      const k = r.pick([1, 2, 3]);
      let b = Number(m.q) * k, a = -Number(m.p) * k;
      const c = r.int(-8, 8);
      if (b < 0) { a = -a; b = -b; }
      return terms([[a, "x"], [b, "y"], [c, ""]]) + "=0";
    };
    const withIntercept = (m) => {
      const c = r.nonzero(-6, 6);
      const body = m.isInt ? (m.p === 1n ? "x" : m.p === -1n ? "-x" : `${m.p}x`) : `${tq(m)}x`;
      return `y=${body}${pm(c)}`;
    };
    for (let tries = 0; tries < 800; tries++) {
      const m1 = slope(), m2 = slope();
      if (m1.sub(m2).p === 0n) continue;
      const den = q(1).add(m1.mul(m2));
      if (den.p === 0n) continue;
      const ans = m1.sub(m2).div(den);
      const val = ans.p < 0n ? q(-ans.p, ans.q) : ans;
      if (!simple(val, 300)) continue;
      let l1, l2;
      if (lvl === 1) { l1 = withIntercept(m1); l2 = withIntercept(m2); }
      else if (lvl === 2) { l1 = generalForm(m1); l2 = r.next() < 0.5 ? generalForm(m2) : withIntercept(m2); }
      else { l1 = interceptForm(m1); l2 = r.pick([generalForm, withIntercept, interceptForm])(m2); }
      if (l1 === l2) continue;
      return { v: { l1, l2, m1: tq(m1), m2: tq(m2), res: tq(val) }, ans: num(val) };
    }
    throw new Error("lineAngle");
  });
plan("m.h3.cal1", "ca2_lineAngle", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-02"], "slope-as-tangent-addition", "representation");

// ---- 19. double-angle / half-angle and sum-product identities
add("ca2_doubleAngle",
  ["${cd}$ 일 때, ${ask}$ 의 값을 구하세요. " + FR,
    ["$\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$, $\\cos2\\alpha=\\cos^{2}\\alpha-\\sin^{2}\\alpha$ 와 $\\sin^{2}\\alpha+\\cos^{2}\\alpha=1$ 을 이용해요.", "$\\sin\\alpha\\pm\\cos\\alpha$ 가 주어지면 양변을 제곱해 보세요. $\\tan\\alpha=t$ 이면 $\\sin2\\alpha=\\frac{2t}{1+t^{2}}$, $\\cos2\\alpha=\\frac{1-t^{2}}{1+t^{2}}$ 이고, $\\tan\\frac{\\alpha}{2}=t$ 이면 $\\sin\\alpha=\\frac{2t}{1+t^{2}}$, $\\cos\\alpha=\\frac{1-t^{2}}{1+t^{2}}$ 예요."],
    "${wk}$ 이므로 값은 ${res}$ 입니다."],
  ["If ${cd}$, find ${ask}$. " + EFR,
    ["Use $\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$, $\\cos2\\alpha=\\cos^{2}\\alpha-\\sin^{2}\\alpha$ and $\\sin^{2}\\alpha+\\cos^{2}\\alpha=1$.", "If $\\sin\\alpha\\pm\\cos\\alpha$ is given, square both sides. If $\\tan\\alpha=t$, then $\\sin2\\alpha=\\frac{2t}{1+t^{2}}$ and $\\cos2\\alpha=\\frac{1-t^{2}}{1+t^{2}}$; if $\\tan\\frac{\\alpha}{2}=t$, then $\\sin\\alpha=\\frac{2t}{1+t^{2}}$ and $\\cos\\alpha=\\frac{1-t^{2}}{1+t^{2}}$."],
    "${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    const SV = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 5], [4, 5], [6, 5], [7, 5], [5, 4], [9, 8], [1, 4], [5, 6], [3, 5], [7, 6]];
    for (let tries = 0; tries < 800; tries++) {
      const sv = () => { const [p, d] = r.pick(SV); return q(r.pick([1, -1]) * p, d); };
      let cdn, ask, ans, wk;
      const kind = lvl === 1 ? r.pick([1, 2, 3, 4]) : lvl === 2 ? r.pick([5, 6, 7]) : r.pick([8, 9, 10]);
      if (kind === 1) { const s = sv(); if (s.mul(s).sub(q(2)).p >= 0n) continue; cdn = `\\sin\\alpha+\\cos\\alpha=${tq(s)}`; ask = "\\sin2\\alpha"; ans = s.mul(s).sub(q(1)); wk = `(\\sin\\alpha+\\cos\\alpha)^{2}=1+\\sin2\\alpha\\ \\Rightarrow\\ \\sin2\\alpha=(${tq(s)})^{2}-1`; }
      else if (kind === 2) { const s = sv(); if (s.mul(s).sub(q(2)).p >= 0n) continue; cdn = `\\sin\\alpha-\\cos\\alpha=${tq(s)}`; ask = "\\sin2\\alpha"; ans = q(1).sub(s.mul(s)); wk = `(\\sin\\alpha-\\cos\\alpha)^{2}=1-\\sin2\\alpha\\ \\Rightarrow\\ \\sin2\\alpha=1-(${tq(s)})^{2}`; }
      else if (kind === 3) { const s = sv(); if (s.mul(s).sub(q(1)).p > 0n) continue; cdn = `\\sin\\alpha=${tq(s)}`; ask = "\\cos2\\alpha"; ans = q(1).sub(s.mul(s).mul(q(2))); wk = `\\cos2\\alpha=1-2\\sin^{2}\\alpha=1-2\\left(${tq(s)}\\right)^{2}`; }
      else if (kind === 4) { const s = sv(); if (s.mul(s).sub(q(1)).p > 0n) continue; cdn = `\\cos\\alpha=${tq(s)}`; ask = "\\cos2\\alpha"; ans = s.mul(s).mul(q(2)).sub(q(1)); wk = `\\cos2\\alpha=2\\cos^{2}\\alpha-1=2\\left(${tq(s)}\\right)^{2}-1`; }
      else if (kind === 5) { const t = q(r.nonzero(-5, 5), r.pick([1, 1, 2, 3])); cdn = `\\tan\\alpha=${tq(t)}`; const w = r.pick(["sin", "cos"]); const den = q(1).add(t.mul(t)); if (w === "sin") { ask = "\\sin2\\alpha"; ans = t.mul(q(2)).div(den); wk = `\\sin2\\alpha=\\frac{2\\tan\\alpha}{1+\\tan^{2}\\alpha}=\\frac{2\\cdot ${pr(t)}}{1+(${tq(t)})^{2}}`; } else { ask = "\\cos2\\alpha"; ans = q(1).sub(t.mul(t)).div(den); wk = `\\cos2\\alpha=\\frac{1-\\tan^{2}\\alpha}{1+\\tan^{2}\\alpha}=\\frac{1-(${tq(t)})^{2}}{1+(${tq(t)})^{2}}`; } }
      else if (kind === 6) { const s = sv(); if (s.mul(s).sub(q(2)).p >= 0n) continue; cdn = `\\sin\\alpha+\\cos\\alpha=${tq(s)}`; ask = "\\sin^{3}\\alpha+\\cos^{3}\\alpha"; const sc = s.mul(s).sub(q(1)).div(q(2)); ans = s.mul(q(1).sub(sc)); wk = `\\sin\\alpha\\cos\\alpha=\\frac{(${tq(s)})^{2}-1}{2}=${tq(sc)},\\ \\sin^{3}\\alpha+\\cos^{3}\\alpha=(\\sin\\alpha+\\cos\\alpha)(1-\\sin\\alpha\\cos\\alpha)`; }
      else if (kind === 7) { const t = q(r.nonzero(-4, 4), r.pick([1, 2, 3])); const den = q(1).add(t.mul(t)); cdn = `\\tan\\alpha=${tq(t)}`; ask = "\\sin\\alpha\\cos\\alpha"; ans = t.div(den); wk = `\\sin\\alpha\\cos\\alpha=\\frac{\\tan\\alpha}{1+\\tan^{2}\\alpha}=\\frac{${tq(t)}}{1+(${tq(t)})^{2}}`; }
      else if (kind === 8) { const t = q(r.nonzero(-4, 4), r.pick([1, 2, 3, 5])); const den = q(1).add(t.mul(t)); cdn = `\\tan\\frac{\\alpha}{2}=${tq(t)}`; if (r.next() < 0.5) { ask = "\\sin\\alpha"; ans = t.mul(q(2)).div(den); wk = `\\sin\\alpha=\\frac{2\\tan\\frac{\\alpha}{2}}{1+\\tan^{2}\\frac{\\alpha}{2}}=\\frac{2\\cdot ${pr(t)}}{1+(${tq(t)})^{2}}`; } else { ask = "\\cos\\alpha"; ans = q(1).sub(t.mul(t)).div(den); wk = `\\cos\\alpha=\\frac{1-\\tan^{2}\\frac{\\alpha}{2}}{1+\\tan^{2}\\frac{\\alpha}{2}}=\\frac{1-(${tq(t)})^{2}}{1+(${tq(t)})^{2}}`; } }
      else if (kind === 9) { const [a, b, c] = r.pick(TRIPLES); const sw = r.next() < 0.5; const sa = sw ? b : a, ca = sw ? a : b; cdn = `\\sin\\alpha=\\frac{${sa}}{${c}}\\ \\left(0<\\alpha<\\frac{\\pi}{2}\\right)`; ask = "\\tan2\\alpha"; const t = q(sa, ca); ans = t.mul(q(2)).div(q(1).sub(t.mul(t))); wk = `\\cos\\alpha=\\frac{${ca}}{${c}},\\ \\tan\\alpha=${tq(t)},\\ \\tan2\\alpha=\\frac{2\\tan\\alpha}{1-\\tan^{2}\\alpha}=\\frac{2\\cdot ${pr(t)}}{1-(${tq(t)})^{2}}`; }
      else { const [a, b, c] = r.pick(TRIPLES); const sw = r.next() < 0.5; const sa = sw ? b : a, ca = sw ? a : b; cdn = `\\cos\\alpha=\\frac{${ca}}{${c}}\\ \\left(0<\\alpha<\\frac{\\pi}{2}\\right)`; ask = "\\sin2\\alpha+\\cos2\\alpha"; ans = q(2 * sa * ca, c * c).add(q(ca * ca - sa * sa, c * c)); wk = `\\sin\\alpha=\\frac{${sa}}{${c}},\\ \\sin2\\alpha=2\\sin\\alpha\\cos\\alpha=${tq(q(2 * sa * ca, c * c))},\\ \\cos2\\alpha=\\cos^{2}\\alpha-\\sin^{2}\\alpha=${tq(q(ca * ca - sa * sa, c * c))}`; }
      if (!simple(ans, 340)) continue;
      return { v: { cd: cdn, ask, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("doubleAngle");
  });
plan("m.h3.cal1", "ca2_doubleAngle", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-02"], "identity-from-relation", "calc");

// ---- 20. product / quotient / composite from a table of values (only the needed data is given)
add("ca2_chainTable",
  ["미분가능한 두 함수 $f$, $g$ 에 대하여 ${tbl}$ 이다. $h(x)={hx}$ 일 때, $h'({a})$ 의 값을 구하세요. " + FR,
    ["$h$ 가 곱, 몫, 합성 중 어떤 꼴인지 보고 해당 미분법의 공식을 써요.", "$x={a}$ 에서 필요한 함숫값과 미분계수를 표에서 찾아 대입해요. 합성함수이면 안쪽 함수의 값이 바깥쪽 함수에 넣을 점이 돼요."],
    "${rule}$ 이므로 $h'({a})={wk}={res}$ 입니다."],
  ["For differentiable functions $f$ and $g$, ${tbl}$. If $h(x)={hx}$, find $h'({a})$. " + EFR,
    ["Decide whether $h$ is a product, a quotient or a composite and use the matching rule.", "Read the needed values and derivatives at $x={a}$ from the data. For a composite, the value of the inner function is the point at which the outer derivative is taken."],
    "${rule}$, so $h'({a})={wk}={res}$."],
  (r, lvl) => {
    const R = (lo, hi) => r.nonzero(lo, hi);
    for (let tries = 0; tries < 800; tries++) {
      const a = lvl === 3 ? r.pick([-2, -1, 1, 2, 3, 4]) : r.int(-2, 4);
      const ent = []; // [fn, pt, val|null, der|null]
      const put = (fn, pt, val, der) => ent.push([fn, pt, val, der]);
      let hx, rule, wk, ans;
      if (lvl === 1) {
        const b = r.int(-3, 5), al = R(-5, 5), be = R(-5, 5);
        if (b === a) continue;
        put("g", a, b, al); put("f", b, null, be);
        hx = "f(g(x))"; rule = `h'(x)=f'(g(x))\\,g'(x)`; wk = `f'(${b})\\,g'(${a})=${pp(be)}\\cdot ${pp(al)}`; ans = q(be * al);
      } else if (lvl === 2) {
        const fa = R(-4, 5), fdv = R(-5, 5), ga = R(-4, 5), gd = R(-5, 5);
        put("f", a, fa, fdv); put("g", a, ga, gd);
        const kind = r.int(1, 3);
        if (kind === 1) { hx = "f(x)\\cdot g(x)"; rule = "h'(x)=f'(x)g(x)+f(x)g'(x)"; wk = `${pp(fdv)}\\cdot ${pp(ga)}+${pp(fa)}\\cdot ${pp(gd)}`; ans = q(fdv * ga + fa * gd); }
        else if (kind === 2) { hx = "\\frac{f(x)}{g(x)}"; rule = "h'(x)=\\frac{f'(x)g(x)-f(x)g'(x)}{\\{g(x)\\}^{2}}"; wk = `\\frac{${pp(fdv)}\\cdot ${pp(ga)}-${pp(fa)}\\cdot ${pp(gd)}}{(${ga})^{2}}`; ans = q(fdv * ga - fa * gd, ga * ga); }
        else { hx = "\\left(f(x)\\right)^{2}\\cdot g(x)"; rule = "h'(x)=2f(x)f'(x)g(x)+\\{f(x)\\}^{2}g'(x)"; wk = `2\\cdot ${pp(fa)}\\cdot ${pp(fdv)}\\cdot ${pp(ga)}+(${fa})^{2}\\cdot ${pp(gd)}`; ans = q(2 * fa * fdv * ga + fa * fa * gd); }
      } else {
        const kind = r.int(1, 3);
        if (kind === 1) {
          const b = r.int(-3, 5), al = R(-4, 4), be = R(-4, 4);
          if (b === a) continue;
          put("f", a, b, al); put("f", b, null, be);
          hx = "f(f(x))"; rule = "h'(x)=f'(f(x))\\,f'(x)"; wk = `f'(${b})\\,f'(${a})=${pp(be)}\\cdot ${pp(al)}`; ans = q(be * al);
        } else if (kind === 2) {
          const b = r.int(-3, 5), c = r.int(-3, 5), al = R(-3, 3), be = R(-3, 3), ga = R(-3, 3);
          if (a === c || b === a) continue;
          put("g", a, b, al); put("f", b, c, be); put("g", c, null, ga);
          hx = "g(f(g(x)))"; rule = "h'(x)=g'(f(g(x)))\\,f'(g(x))\\,g'(x)"; wk = `g'(${c})\\,f'(${b})\\,g'(${a})=${pp(ga)}\\cdot ${pp(be)}\\cdot ${pp(al)}`; ans = q(ga * be * al);
        } else {
          const b = r.int(-3, 3), al = R(-3, 3), be = R(-4, 4);
          const c = a * b;
          put("g", a, b, al); put("f", c, null, be);
          hx = "f(x\\,g(x))"; rule = "h'(x)=f'(x\\,g(x))\\{g(x)+x\\,g'(x)\\}"; wk = `f'(${c})\\{${b}+${pp(a)}\\cdot ${pp(al)}\\}=${pp(be)}\\cdot ${pp(b + a * al)}`; ans = q(be * (b + a * al));
        }
      }
      if (ans.p === 0n) continue;
      // consistency: no two entries for the same (fn, pt, kind)
      const seen = new Set();
      let bad = false;
      for (const [fn, pt, val, der] of ent) { const k1 = `${fn}${pt}v`, k2 = `${fn}${pt}d`; if (val !== null) { if (seen.has(k1)) bad = true; seen.add(k1); } if (der !== null) { if (seen.has(k2)) bad = true; seen.add(k2); } }
      if (bad) continue;
      if (lvl === 2 && ent[1][2] === 0 && hx.startsWith("\\frac")) continue;
      // merge by (fn, pt) for printing
      const parts = [];
      const done = new Set();
      for (const [fn, pt] of ent) {
        const key = `${fn}${pt}`;
        if (done.has(key)) continue;
        done.add(key);
        const items = ent.filter((e) => e[0] === fn && e[1] === pt);
        const val = items.find((e) => e[2] !== null), der = items.find((e) => e[3] !== null);
        if (val) parts.push(`${fn}(${pt})=${val[2]}`);
        if (der) parts.push(`${fn}'(${pt})=${der[3]}`);
      }
      return { v: { tbl: parts.join(",\\ "), hx, a, rule, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("chainTable");
  });
plan("m.h3.cal1", "ca2_chainTable", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-05", "12미적Ⅱ-02-04"], "differentiation-rules-from-data", "calc");

// ---- 21. parametric curves: dy/dx and d2y/dx2
add("ca2_paramDeriv",
  ["곡선 $x={xt}$, $y={yt}$ 에 대하여 $t={t0}$ 일 때, ${what}$ 의 값을 구하세요. " + FR,
    ["매개변수로 나타낸 함수의 미분법: $\\frac{ dy }{ dx }=\\frac{dy/dt}{dx/dt}$ 예요.", "이계도함수는 $\\frac{ dy }{ dx }$ 를 $t$ 의 식으로 나타내 $t$ 로 미분한 뒤, $\\frac{ dx }{ dt }$ 로 나누어 구해요."],
    "${wk}$ 이므로 값은 ${res}$ 입니다."],
  ["For the curve $x={xt}$, $y={yt}$, find ${what}$ at $t={t0}$. " + EFR,
    ["For parametric functions, $\\frac{ dy }{ dx }=\\frac{dy/dt}{dx/dt}$.", "Write $\\frac{ dy }{ dx }$ as a function of $t$, differentiate it with respect to $t$, and divide by $\\frac{ dx }{ dt }$ to get the second derivative."],
    "${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    const D1 = "\\frac{ dy }{ dx }", D2 = "\\frac{d^{2}y}{dx^{2}}";
    for (let tries = 0; tries < 800; tries++) {
      let xt, yt, t0, what, ans, wk, xp, yp;
      if (lvl === 1 || (lvl === 3 && r.next() < 0.45)) {
        // polynomial pair
        const p = r.nonzero(-3, 3), qq = r.int(-5, 5), s = r.nonzero(-3, 3), u = r.int(-4, 4), w = r.int(-5, 5), t = r.int(-2, 3);
        const rr = r.int(-4, 4);
        const x1 = 2 * p * t + qq, x2 = 2 * p, y1 = 3 * s * t * t + 2 * u * t + w, y2 = 6 * s * t + 2 * u;
        if (x1 === 0) continue;
        xt = poly([p, qq, rr], "t"); yt = poly([s, u, w, 0], "t"); t0 = String(t);
        xp = poly([2 * p, qq], "t"); yp = poly([3 * s, 2 * u, w], "t");
        if (lvl === 1) { what = D1; ans = q(y1, x1); wk = `\\frac{ dx }{ dt }=${xp},\\ \\frac{ dy }{ dt }=${yp}\\ \\Rightarrow\\ \\frac{ dy }{ dx }\\Big|_{t=${t}}=${sfrac(y1, x1)}`; }
        else {
          what = D2;
          const gp = q(y2 * x1 - y1 * x2, x1 * x1);
          ans = q(y2 * x1 - y1 * x2, x1 ** 3);
          wk = `\\frac{ dy }{ dx }=\\frac{${yp}}{${xp}},\\ \\frac{d}{ dt }\\left(\\frac{ dy }{ dx }\\right)=\\frac{(${poly([6 * s, 2 * u], "t")})(${xp})-(${yp})\\cdot ${x2}}{(${xp})^{2}}\\Big|_{t=${t}}=\\frac{(${y2})(${x1})-(${y1})(${x2})}{(${x1})^{2}}=${tq(gp)},\\ \\frac{d^{2}y}{dx^{2}}=${tq(gp)}\\div (${x1})`;
        }
      } else if (lvl <= 2) {
        const kind = r.int(1, 4), a = r.nonzero(-4, 4), b = r.int(-4, 4), c = r.nonzero(-4, 4), d = r.int(-4, 4);
        if (kind === 1) {
          const m = r.int(2, 5); xt = terms([[a, "e^{t}"], [b, ""]]); yt = terms([[c, "e^{-t}"], [d, ""]]); t0 = `\\ln ${m}`; what = D1; ans = q(-c, a * m * m);
          xp = `${cf(a)}e^{t}`; yp = `${cf(-c)}e^{-t}`;
          wk = `\\frac{ dx }{ dt }=${xp},\\ \\frac{ dy }{ dt }=${yp}\\ \\Rightarrow\\ \\frac{ dy }{ dx }=${sfc(-c, a)}e^{-2t},\\ e^{-2\\ln ${m}}=\\frac{1}{${m * m}}\\ \\Rightarrow\\ ${sfrac(-c, a * m * m)}`;
        } else if (kind === 2) {
          const t = r.int(1, 4); xt = `${cf(a)}\\ln t${b === 0 ? "" : pm(b)}`; yt = terms([[c, "t^{2}"], [d, "t"]]); t0 = String(t); what = D1; ans = q(t * (2 * c * t + d), a);
          xp = `\\frac{${a}}{t}`; yp = terms([[2 * c, "t"], [d, ""]]);
          wk = `\\frac{ dx }{ dt }=${xp},\\ \\frac{ dy }{ dt }=${yp}\\ \\Rightarrow\\ \\frac{ dy }{ dx }=\\frac{t(${yp})}{${a}}\\Big|_{t=${t}}=${sfrac(t * (2 * c * t + d), a)}`;
        } else if (kind === 3) {
          const j = r.pick([1, 3]); xt = `${cf(a)}(t-\\sin t)`; yt = `${cf(c)}(1-\\cos t)`; t0 = piTex(j, 2); what = D1; ans = q(j === 1 ? c : -c, a);
          xp = `${cf(a)}(1-\\cos t)`; yp = `${cf(c)}\\sin t`;
          wk = `\\frac{ dx }{ dt }=${xp},\\ \\frac{ dy }{ dt }=${yp}\\ \\Rightarrow\\ \\frac{ dy }{ dx }=\\frac{${yp}}{${xp}}\\Big|_{t=${t0}}=${sfrac(j === 1 ? c : -c, a)}`;
        } else {
          const j = r.pick([1, 3, 5, 7]); xt = `${cf(a)}\\cos t`; yt = `${cf(c)}\\sin t`; t0 = piTex(j, 4); what = D1; const cot = (j === 1 || j === 5) ? 1 : -1; ans = q(-c * cot, a);
          xp = `${cf(-a)}\\sin t`; yp = `${cf(c)}\\cos t`;
          wk = `\\frac{ dx }{ dt }=${xp},\\ \\frac{ dy }{ dt }=${yp}\\ \\Rightarrow\\ \\frac{ dy }{ dx }=${sfc(-c, a)}\\cot t,\\ \\cot ${t0}=${cot}\\ \\Rightarrow\\ ${sfrac(-c * cot, a)}`;
        }
      } else {
        const kind = r.int(1, 2), a = r.nonzero(-4, 4), b = r.int(-4, 4), c = r.nonzero(-4, 4), d = r.int(-4, 4);
        if (kind === 1) {
          const m = r.int(2, 4); xt = terms([[a, "e^{t}"], [b, ""]]); yt = terms([[c, "e^{-t}"], [d, ""]]); t0 = `\\ln ${m}`; what = D2; ans = q(2 * c, a * a * m ** 3);
          xp = `${cf(a)}e^{t}`; yp = `${cf(-c)}e^{-t}`;
          wk = `\\frac{ dy }{ dx }=${sfc(-c, a)}e^{-2t},\\ \\frac{d}{ dt }\\left(\\frac{ dy }{ dx }\\right)=${sfc(2 * c, a)}e^{-2t},\\ \\frac{d^{2}y}{dx^{2}}=\\frac{${sfrac(2 * c, a)}e^{-2t}}{${xp}}=${sfc(2 * c, a * a)}e^{-3t}\\Big|_{t=\\ln ${m}}=${sfrac(2 * c, a * a * m ** 3)}`;
        } else {
          const j = r.pick([1, 3]); xt = `${cf(a)}\\cos t`; yt = `${cf(c)}\\sin t`; t0 = piTex(j, 2); what = D2; ans = q(j === 1 ? -c : c, a * a);
          const sn = j === 1 ? 1 : -1;
          xp = `${cf(-a)}\\sin t`; yp = `${cf(c)}\\cos t`;
          wk = `\\frac{ dy }{ dx }=${sfc(-c, a)}\\cot t,\\ \\frac{d}{ dt }\\left(\\frac{ dy }{ dx }\\right)=${sfc(c, a)}\\frac{1}{\\sin^{2}t},\\ \\frac{d^{2}y}{dx^{2}}=\\frac{${sfc(c, a)}\\frac{1}{\\sin^{2}t}}{${cf(-a)}\\sin t}\\Big|_{t=${t0}}=\\frac{${sfrac(c, a)}}{(${-a})\\cdot ${pp(sn)}}`;
        }
      }
      if (!simple(ans, 600)) continue;
      return { v: { xt, yt, t0, what, xp, yp, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("paramDeriv");
  });
plan("m.h3.cal1", "ca2_paramDeriv", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-06"], "parametric-derivative", "calc");

// ---- polynomial in x, y helpers (implicit curves)
/** terms: [[coef, i, j]] meaning coef * x^i * y^j */
const xyTerm = (c, i, j, first) => {
  const a = Math.abs(c);
  const mon = (i ? (i === 1 ? "x" : `x^{${i}}`) : "") + (j ? (j === 1 ? "y" : `y^{${j}}`) : "");
  const body = mon === "" ? String(a) : a === 1 ? mon : `${a}${mon}`;
  return (c < 0 ? "-" : first ? "" : "+") + body;
};
const xyStr = (ts) => (ts.length ? ts.map(([c, i, j], idx) => xyTerm(c, i, j, idx === 0)).join("") : "0");
const xyVal = (ts, x, y) => ts.reduce((s, [c, i, j]) => s + c * x ** i * y ** j, 0);
const xyD = (ts, dx, dy) => ts.map(([c, i, j]) => {
  let cc = c, ii = i, jj = j;
  for (let k = 0; k < dx; k++) { cc *= ii; ii--; if (ii < 0) cc = 0; }
  for (let k = 0; k < dy; k++) { cc *= jj; jj--; if (jj < 0) cc = 0; }
  return [cc, Math.max(ii, 0), Math.max(jj, 0)];
}).filter(([c]) => c !== 0);
function randPolyXY(r, maxDeg) {
  const pool = maxDeg === 2 ? [[1, 0], [0, 1], [2, 0], [1, 1], [0, 2]] : [[2, 0], [1, 1], [0, 2], [3, 0], [0, 3], [2, 1], [1, 2], [1, 0], [0, 1]];
  const n = r.int(3, 4);
  const chosen = [];
  while (chosen.length < n) { const m = r.pick(pool); if (!chosen.some((e) => e[0] === m[0] && e[1] === m[1])) chosen.push(m); }
  chosen.sort((a, b) => b[0] + b[1] - (a[0] + a[1]) || b[0] - a[0]);
  return chosen.map(([i, j]) => [r.nonzero(-4, 4), i, j]);
}

// ---- 22. implicit differentiation
add("ca2_implicitDeriv",
  ["$y$ 가 $x$ 의 함수일 때, 곡선 ${eq}$ 위의 점 $ {pt} $ 에서 ${what}$ 의 값을 구하세요. " + FR,
    ["식의 양변을 $x$ 에 대하여 미분하되, $y$ 를 포함한 항은 $\\frac{ dy }{ dx }$ 를 곱해요.", "미분한 식에 점의 좌표를 대입하고 $\\frac{ dy }{ dx }$ 에 대해 풀어요. 이계도함수이면 미분한 식을 한 번 더 $x$ 에 대하여 미분해요."],
    "양변을 $x$ 에 대하여 미분하고 $y'=\\frac{ dy }{ dx }$ 로 놓으면 ${wk}$ 이므로 값은 ${res}$ 입니다."],
  ["Treating $y$ as a function of $x$, find ${what}$ at the point $ {pt} $ of the curve ${eq}$. " + EFR,
    ["Differentiate both sides with respect to $x$; terms containing $y$ pick up a factor $\\frac{ dy }{ dx }$.", "Substitute the coordinates of the point and solve for $\\frac{ dy }{ dx }$. For the second derivative, differentiate the differentiated equation once more."],
    "Differentiating both sides with respect to $x$ and writing $y'=\\frac{ dy }{ dx }$ gives ${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let eq, pt, what, ans, wk, dA, dB;
      const x0 = r.int(-3, 3), y0 = r.int(-3, 3);
      if (lvl === 1) {
        const ts = randPolyXY(r, 3);
        const Fx = xyVal(xyD(ts, 1, 0), x0, y0), Fy = xyVal(xyD(ts, 0, 1), x0, y0);
        if (Fy === 0 || !ts.some(([, , j]) => j > 0) || !ts.some(([, i]) => i > 0)) continue;
        const cst = xyVal(ts, x0, y0);
        eq = `${xyStr(ts)}=${cst}`; pt = `(${x0},${y0})`;
        dA = xyStr(xyD(ts, 1, 0)); dB = xyStr(xyD(ts, 0, 1));
        what = "\\frac{ dy }{ dx }"; ans = q(-Fx, Fy);
        wk = `${dA}+\\left(${dB}\\right)y'=0\\ \\Rightarrow\\ ${Fx}+(${Fy})y'=0\\ \\Rightarrow\\ y'=${tq(ans)}`;
      } else if (lvl === 2) {
        const kind = r.int(1, 4), a = r.nonzero(-4, 4), b = r.nonzero(-4, 4);
        what = "\\frac{ dy }{ dx }";
        const sg = (c) => `${c < 0 ? "-" : "+"}${Math.abs(c) === 1 ? "" : Math.abs(c)}`;
        if (kind === 1) {
          if (x0 === 0 || a === -1) continue;
          eq = `xe^{y}${sg(a)}xy+y^{2}=${x0}`; pt = `(${x0},0)`;
          const Fy = x0 * (1 + a); ans = q(-1, Fy);
          dA = terms([[1, "e^{y}"], [a, "y"]]); dB = terms([[1, "xe^{y}"], [a, "x"], [2, "y"]]);
          wk = `${dA}+\\left(${dB}\\right)y'=0\\ \\Rightarrow\\ 1+(${Fy})y'=0\\ \\Rightarrow\\ y'=${tq(ans)}`;
        } else if (kind === 2) {
          const xx = r.int(-2, 4), yy = 1 - xx;
          if (1 + a * xx === 0) continue;
          eq = `\\ln(x+y)${sg(a)}xy=${a * xx * yy}`; pt = `(${xx},${yy})`;
          const Fx = 1 + a * yy, Fy = 1 + a * xx; ans = q(-Fx, Fy);
          dA = terms([[1, "\\frac{1}{x+y}"], [a, "y"]]); dB = terms([[1, "\\frac{1}{x+y}"], [a, "x"]]);
          wk = `${dA}+\\left(${dB}\\right)y'=0\\ \\Rightarrow\\ (x+y=1)\\ ${Fx}+(${Fy})y'=0\\ \\Rightarrow\\ y'=${tq(ans)}`;
        } else if (kind === 3) {
          if (y0 === 0) continue;
          eq = `ye^{x}${sg(a)}xy^{2}=${y0}`; pt = `(0,${y0})`;
          const Fx = y0 + a * y0 * y0; ans = q(-Fx);
          dA = terms([[1, "ye^{x}"], [a, "y^{2}"]]); dB = terms([[1, "e^{x}"], [2 * a, "xy"]]);
          wk = `${dA}+\\left(${dB}\\right)y'=0\\ \\Rightarrow\\ ${Fx}+(1)y'=0\\ \\Rightarrow\\ y'=${tq(ans)}`;
        } else {
          eq = `e^{xy}${sg(a)}x${sg(b)}y=${1 + b * y0}`; pt = `(0,${y0})`;
          const Fx = y0 + a; ans = q(-Fx, b);
          dA = terms([[1, "ye^{xy}"], [a, ""]]); dB = terms([[1, "xe^{xy}"], [b, ""]]);
          wk = `${dA}+\\left(${dB}\\right)y'=0\\ \\Rightarrow\\ ${Fx}+(${b})y'=0\\ \\Rightarrow\\ y'=${tq(ans)}`;
        }
      } else {
        // second derivative of a homogeneous quadratic curve A x^2 + B xy + C y^2 = c
        const A = r.int(-2, 2), B = r.int(-3, 3), C = r.int(-2, 2);
        const nz = [A, B, C].filter((z) => z !== 0).length;
        if (nz < 2 || 4 * A * C - B * B === 0) continue;
        const ts = [[A, 2, 0], [B, 1, 1], [C, 0, 2]].filter(([c]) => c !== 0);
        const Fx = 2 * A * x0 + B * y0, Fy = B * x0 + 2 * C * y0;
        const cst = A * x0 * x0 + B * x0 * y0 + C * y0 * y0;
        if (Fy === 0 || cst === 0) continue;
        const y1 = q(-Fx, Fy);
        const nu = q(2 * A).add(q(2 * B).mul(y1)).add(q(2 * C).mul(y1).mul(y1));
        ans = nu.div(q(Fy)).mul(q(-1));
        if (Math.abs(num(ans)) > 30) continue;
        eq = `${xyStr(ts)}=${cst}`; pt = `(${x0},${y0})`; what = "\\frac{d^{2}y}{dx^{2}}";
        dA = xyStr([[2 * A, 1, 0], [B, 0, 1]].filter(([c]) => c !== 0)); dB = xyStr([[B, 1, 0], [2 * C, 0, 1]].filter(([c]) => c !== 0));
        const t1 = sj(String(2 * A), B === 0 ? "" : cmul(B, "y'")), t2 = sj(B === 0 ? "" : String(B), C === 0 ? "" : cmul(2 * C, "y'"));
        wk = `${dA}+\\left(${dB}\\right)y'=0\\ \\Rightarrow\\ y'=${tq(y1)},\\ \\left(${t1}\\right)+\\left(${t2}\\right)y'+\\left(${dB}\\right)y''=0\\ \\Rightarrow\\ y''=-\\left(${tq(nu)}\\right)\\div\\left(${Fy}\\right)`;
      }
      if (!simple(ans, 250)) continue;
      return { v: { eq, pt, what, dA, dB, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("implicitDeriv");
  });
plan("m.h3.cal1", "ca2_implicitDeriv", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-07"], "implicit-differentiation", "calc");

// ---- 23. derivative of an inverse function
add("ca2_inverseDeriv",
  ["실수 전체의 집합에서 증가하는 함수 $f(x)={fx}$ 의 역함수를 $g(x)$ 라 할 때, $g'({b})$ 의 값을 구하세요. " + FR,
    ["$f(a)={b}$ 를 만족하는 $a$ 를 먼저 찾아요.", "역함수의 미분법: $g'({b})=\\frac{1}{f'(a)}$ 예요."],
    "$f({xa})={b}$ 이므로 $g({b})={xa}$ 이고, $f'(x)={fp}$ 에서 $f'({xa})={fd}$ 입니다. 따라서 $g'({b})=\\frac{1}{f'({xa})}={res}$ 입니다."],
  ["Let $g$ be the inverse function of $f(x)={fx}$, which is increasing on all real numbers. Find $g'({b})$. " + EFR,
    ["First find $a$ with $f(a)={b}$.", "Inverse function rule: $g'({b})=\\frac{1}{f'(a)}$."],
    "Since $f({xa})={b}$ we have $g({b})={xa}$, and $f'(x)={fp}$ gives $f'({xa})={fd}$. Hence $g'({b})=\\frac{1}{f'({xa})}={res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let fx, b, xa, fp, fd;
      if (lvl === 1) {
        const m = r.int(1, 3), p = r.int(0, 5), c0 = r.int(-6, 6), a = r.int(-3, 3);
        fd = 3 * m * a * a + p; if (fd === 0) continue;
        fx = poly([m, 0, p, c0], "x"); b = String(m * a ** 3 + p * a + c0); xa = String(a); fp = poly([3 * m, 0, p], "x");
      } else if (lvl === 2) {
        const p = r.int(1, 5), qq = r.int(1, 4), k = r.pick([1, 1, 2]), c0 = r.int(-5, 5);
        fx = terms([[qq, E(k)], [p, "x"], [c0, ""]]); b = String(qq + c0); xa = "0"; fp = terms([[qq * k, E(k)], [p, ""]]); fd = qq * k + p;
      } else {
        const p = r.int(2, 7), qq = r.int(1, p - 1) * r.pick([1, -1]);
        fx = terms([[p, "x"], [qq, "\\sin x"]]); fp = terms([[p, ""], [qq, "\\cos x"]]);
        const kind = r.int(1, 3);
        if (kind === 1) { b = "0"; xa = "0"; fd = p + qq; }
        else if (kind === 2) { b = piTex(p, 2) + (qq === 0 ? "" : pm(qq)); xa = "\\frac{\\pi}{2}"; fd = p; }
        else { b = piTex(p, 1); xa = "\\pi"; fd = p - qq; }
      }
      if (fd <= 0) continue;
      const ans = q(1, fd);
      return { v: { fx, b, xa, fp, fd, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("inverseDeriv");
  });
plan("m.h3.cal1", "ca2_inverseDeriv", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-07"], "inverse-function-derivative", "calc");


const mCoef = (m) => (m.isInt ? (m.p === 1n ? "" : m.p === -1n ? "-" : String(m.p)) : tq(m));
const addQ = (c) => (c.p === 0n ? "" : c.p < 0n ? tq(c) : `+${tq(c)}`);
/** y = m x + c */
const slopeLine = (m, c) => `${mCoef(m)}x${addQ(c)}`;
/** y = m (x - x0) + y0 */
const pointSlope = (m, x0, y0) => (x0 === 0 ? `${mCoef(m)}x${addQ(y0)}` : `${mCoef(m)}(x${pm(-x0)})${addQ(y0)}`);

// ---- 24. y-intercept of a tangent line to various curves
add("ca2_tangentLine",
  ["곡선 ${cv}$ 위의 점 $ {pt} $ 에서의 접선이 $y$ 축과 만나는 점의 $y$ 좌표를 구하세요. " + FR,
    ["접점에서의 미분계수가 접선의 기울기예요.", "접선의 방정식 $y-y_0=m(x-x_0)$ 에 $x=0$ 을 대입해요."],
    "접점의 좌표 $ {pt} $, 기울기 $m={sl}$ 이므로 접선은 $y={tl}$ 이고, $y$ 절편은 ${res}$ 입니다."],
  ["Find the $y$-coordinate of the point where the tangent line to the curve ${cv}$ at the point $ {pt} $ meets the $y$-axis. " + EFR,
    ["The derivative at the point of tangency is the slope of the tangent line.", "Put $x=0$ into $y-y_0=m(x-x_0)$."],
    "The point of tangency is $ {pt} $ and the slope is $m={sl}$, so the tangent is $y={tl}$ and its $y$-intercept is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let cv, pt, sl, tl, yint;
      if (lvl === 1) {
        const kind = r.int(1, 3);
        if (kind === 1) {
          const a = r.nonzero(-4, 4), b = r.int(-5, 5), c = r.nonzero(-3, 3), d = r.int(-5, 5), x0 = r.int(-3, 3);
          const v0 = c * x0 + d; if (v0 === 0 || a * d - b * c === 0) continue;
          const y0 = q(a * x0 + b, v0), m = q(a * d - b * c, v0 * v0);
          yint = y0.sub(m.mul(q(x0)));
          cv = `y=\\frac{${lin(a, b, "x")}}{${lin(c, d, "x")}}`; pt = `(${x0},${tq(y0)})`; sl = tq(m);
          tl = pointSlope(m, x0, y0);
        } else if (kind === 2) {
          const s = r.int(1, 5), p = r.pick([1, 2, 3, 4]), x0 = r.int(-3, 5);
          const qq = s * s - p * x0; // p x0 + qq = s^2
          const m = q(p, 2 * s); yint = q(s).sub(m.mul(q(x0)));
          cv = `y=\\sqrt{${lin(p, qq, "x")}}`; pt = `(${x0},${s})`; sl = tq(m);
          tl = pointSlope(m, x0, q(s));
        } else {
          const a = r.nonzero(-4, 4), b = r.nonzero(-3, 3), x0 = r.pick([-3, -2, -1, 1, 2, 3, 4]);
          const y0 = q(a).div(q(x0)).add(q(b * x0 * x0)), m = q(-a).div(q(x0 * x0)).add(q(2 * b * x0));
          yint = y0.sub(m.mul(q(x0)));
          cv = `y=${a < 0 ? "-" : ""}\\frac{${Math.abs(a)}}{x}${b < 0 ? "-" : "+"}${Math.abs(b) === 1 ? "" : Math.abs(b)}x^{2}`; pt = `(${x0},${tq(y0)})`; sl = tq(m);
          tl = pointSlope(m, x0, y0);
        }
      } else if (lvl === 2) {
        const a = r.nonzero(-4, 4), b = r.int(-3, 3), c = r.int(-5, 5), k = r.pick([-2, -1, 1, 1, 2, 3]);
        const y0Txt = terms([[a * k + c, ""], [b, eP(k)]]);
        // slope a e^{-k} + b
        cv = `y=${terms([[a, "\\ln x"], [b, "x"], [c, ""]])}`; pt = `\\left(${eP(k)},\\ ${y0Txt}\\right)`;
        sl = terms([[a, eP(-k)], [b, ""]]);
        yint = q(a * (k - 1) + c);
        tl = `\\left(${sl}\\right)x${yint.p < 0n ? tq(yint) : `+${tq(yint)}`}`;
      } else {
        // logarithmic curves at x = 1
        const kind = r.int(1, 3), a = r.nonzero(-4, 4), b = r.nonzero(-4, 4), c = r.nonzero(-5, 5);
        let y0, m;
        if (kind === 1) { y0 = b + c; m = a + 2 * b; cv = `y=${terms([[a, "x\\ln x"], [b, "x^{2}"], [c, ""]])}`; }
        else if (kind === 2) { y0 = c; m = a + b + c; cv = `y=(${lin(a, b, "x")})\\ln x${plus(terms([[c, "x"]]))}`; }
        else { y0 = b; m = a - b; cv = `y=\\frac{${terms([[a, "\\ln x"], [b, ""]])}}{x}`; }
        if (m === 0) continue;
        yint = q(y0 - m); pt = `(1,${y0})`; sl = String(m);
        tl = pointSlope(q(m), 1, q(y0));
      }
      if (!simple(yint, 300)) continue;
      return { v: { cv, pt, sl, tl, res: tq(yint) }, ans: num(yint) };
    }
    throw new Error("tangentLine");
  });
plan("m.h3.cal1", "ca2_tangentLine", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-08"], "tangent-to-various-curves", "calc");

// ---- 25. area of the triangle cut off by a tangent line and the axes
add("ca2_tangentTriangle",
  ["곡선 ${cv}$ 위의 점 $ {pt} $ 에서의 접선과 $x$ 축, $y$ 축으로 둘러싸인 삼각형의 넓이를 구하세요. " + FR,
    ["접선의 방정식을 먼저 구하고, 두 축과 만나는 점(절편)을 찾아요.", "삼각형의 밑변과 높이는 $|x\\text{절편}|$, $|y\\text{절편}|$ 이에요."],
    "접선은 $y={tl}$ 이고, $x$ 절편 ${xi}$, $y$ 절편 ${yi}$ 이므로 넓이는 $\\frac{1}{2}\\times|{xi}|\\times|{yi}|={res}$ 입니다."],
  ["Find the area of the triangle bounded by the tangent line to the curve ${cv}$ at the point $ {pt} $ and the $x$-axis and $y$-axis. " + EFR,
    ["Find the tangent line first, then its intercepts with the two axes.", "The base and height of the triangle are $|x\\text{-intercept}|$ and $|y\\text{-intercept}|$."],
    "The tangent line is $y={tl}$ with $x$-intercept ${xi}$ and $y$-intercept ${yi}$, so the area is $\\frac{1}{2}\\times|{xi}|\\times|{yi}|={res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let cv, pt, x0, y0, m;
      if (lvl === 1) {
        if (r.next() < 0.6) {
          const a = r.nonzero(-3, 3), b = r.int(-5, 5), c = r.int(-6, 6); x0 = r.int(-3, 3);
          y0 = q(a * x0 * x0 + b * x0 + c); m = q(2 * a * x0 + b);
          cv = `y=${poly([a, b, c], "x")}`; pt = `(${x0},${tq(y0)})`;
        } else {
          const a = r.nonzero(-6, 6), b = r.int(-4, 4); x0 = r.pick([-3, -2, -1, 1, 2, 3]);
          y0 = q(a, x0).add(q(b)); m = q(-a, x0 * x0);
          cv = `y=${a < 0 ? "-" : ""}\\frac{${Math.abs(a)}}{x}${b === 0 ? "" : pm(b)}`; pt = `(${x0},${tq(y0)})`;
        }
      } else {
        const kind = r.int(1, 3), a = r.nonzero(-4, 4), b = r.int(-5, 5);
        if (kind === 1) { const k = r.nonzero(-3, 3); x0 = 0; y0 = q(a + b); m = q(a * k); cv = `y=${terms([[a, E(k)], [b, ""]])}`; pt = `(0,${a + b})`; }
        else if (kind === 2) { x0 = 0; y0 = q(b); m = q(a); cv = `y=${terms([[a, "\\sin x"], [b, "\\cos x"]])}`; pt = `(0,${b})`; }
        else { x0 = 1; y0 = q(b); m = q(a + b); cv = `y=${terms([[a, "\\ln x"], [b, "x"]])}`; pt = `(1,${b})`; }
      }
      if (m.p === 0n) continue;
      const yi = y0.sub(m.mul(q(x0)));
      const xi = q(x0).sub(y0.div(m));
      if (yi.p === 0n || xi.p === 0n) continue;
      const aY = yi.p < 0n ? q(-yi.p, yi.q) : yi, aX = xi.p < 0n ? q(-xi.p, xi.q) : xi;
      const area = aX.mul(aY).div(q(2));
      if (!simple(area, 300)) continue;
      return { v: { cv, pt, tl: slopeLine(m, yi), xi: tq(xi), yi: tq(yi), res: tq(area) }, ans: num(area) };
    }
    throw new Error("tangentTriangle");
  });
plan("m.h3.cal1", "ca2_tangentTriangle", [1, 2], 7, 3, ["12미적Ⅱ-02-08"], "tangent-and-intercepts", "calc");

// ---- 26. two curves with a common tangent at a point: determine constants
add("ca2_commonTangent",
  ["두 곡선 $y={f}$, $y={g}$ 가 $x={x0}$ 인 점에서 만나고, 그 점에서 공통인 접선을 가진다. 상수 $a$, $b$ 에 대하여 $ab$ 의 값을 구하세요. " + NUM,
    ["두 곡선이 $x={x0}$ 에서 만나면 두 함숫값이 같고, 접선이 같으면 미분계수가 같아요.", "$a$, $b$ 에 대한 두 식을 연립하여 $a$, $b$ 를 구해요."],
    "$y={f}$ 는 $x={x0}$ 에서 함숫값 ${F}$, 미분계수 ${D}$ 이므로 ${wk}$ 입니다. 따라서 $ab={ans}$ 입니다."],
  ["The curves $y={f}$ and $y={g}$ meet at the point with $x={x0}$ and have a common tangent line there. For the constants $a$ and $b$, find $ab$. " + ENUM,
    ["Meeting at $x={x0}$ means the two function values are equal; having the same tangent means the two derivatives are equal.", "Solve the two equations for $a$ and $b$."],
    "At $x={x0}$ the curve $y={f}$ has value ${F}$ and derivative ${D}$, so ${wk}$. Hence $ab={ans}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      const p0 = lvl === 3 ? r.pick([-1, 2, 3, 4, 9]) : 1;
      // the curve with the unknowns first: a x^2 + b x + c0 (or a x^3 + b x + c0); f is then matched to it
      const a = r.nonzero(-4, 4), b = r.nonzero(-5, 5), c0 = r.int(-4, 4);
      const cubic = lvl === 3 && r.next() < 0.4;
      const G = cubic ? a * p0 ** 3 + b * p0 + c0 : a * p0 ** 2 + b * p0 + c0;
      const Dg = cubic ? 3 * a * p0 ** 2 + b : 2 * a * p0 + b;
      if (Dg === 0) continue;
      const fam = lvl === 1 ? r.pick([1, 2]) : lvl === 2 ? r.pick([3, 4]) : r.pick([2, 3, 4]);
      let f, m, n;
      if (fam === 1) { m = Dg; n = G; f = terms([[m, "\\ln x"], [n, ""]]); }
      else if (fam === 2) {
        m = -Dg * p0 * p0; n = G - m / p0; // m/x + n has derivative -m/p^2 at x = p
        f = `${m < 0 ? "-" : ""}\\frac{${Math.abs(m)}}{x}${n === 0 ? "" : pm(n)}`;
      } else if (fam === 3) {
        const sq = p0 === 1 ? 1 : p0 === 4 ? 2 : p0 === 9 ? 3 : 0; // m sqrt(x) + n has derivative m / (2 sqrt p)
        if (sq === 0) continue;
        m = 2 * sq * Dg; n = G - m * sq;
        f = terms([[m, "\\sqrt{x}"], [n, ""]]);
      } else {
        const k = r.pick([1, 2, 3]);
        if (Dg % k !== 0) continue;
        m = Dg / k; n = G - m;
        const inner = p0 === 1 ? "x-1" : `x${pm(-p0)}`;
        f = terms([[m, `e^{${k === 1 ? inner : `${k}(${inner})`}}`], [n, ""]]);
      }
      if (m === 0 || Math.abs(m) > 150 || Math.abs(n) > 150) continue;
      const g = `a${cubic ? "x^{3}" : "x^{2}"}+bx${c0 === 0 ? "" : pm(c0)}`.replace(/^a/, "a");
      const ca = cubic ? p0 ** 3 : p0 ** 2, da = cubic ? 3 * p0 ** 2 : 2 * p0;
      const wk = `g(${p0})=${sj(`${cf(ca)}a`, `${cf(p0)}b`, c0 === 0 ? "" : String(c0))}=${G},\\ g'(${p0})=${sj(`${cf(da)}a`, "b")}=${Dg}\\ \\Rightarrow\\ a=${a},\\ b=${b}`;
      return { v: { f, g, x0: p0, F: G, D: Dg, wk }, ans: a * b };
    }
    throw new Error("commonTangent");
  });
plan("m.h3.cal1", "ca2_commonTangent", [1, 2, 3], 7, 4, ["12미적Ⅱ-02-08"], "tangency-conditions", "reverse");

// ===================================================================== graphs, equations / inequalities, motion
const fac = (p) => (p === 0 ? "x" : `(x${pm(-p)})`);

// ---- 27. local maximum / minimum points
add("ca2_extremaPair",
  ["함수 $f(x)={fx}$ 는 극댓값과 극솟값을 각각 한 번씩만 가진다. $x=\\alpha$ 에서 극대, $x=\\beta$ 에서 극소일 때, $\\alpha-\\beta$ 의 값을 구하세요. " + NUM,
    ["$f'(x)=0$ 인 $x$ 를 구하고, 그 앞뒤에서 $f'(x)$ 의 부호가 어떻게 바뀌는지 살펴요.", "$f'(x)$ 의 부호가 양에서 음으로 바뀌면 극대, 음에서 양으로 바뀌면 극소예요."],
    "$f'(x)={fp}$ 이므로 $x={mx}$ 에서 극대, $x={mn}$ 에서 극소입니다. 따라서 $\\alpha-\\beta=({mx})-({mn})={ans}$ 입니다."],
  ["The function $f(x)={fx}$ has exactly one local maximum and one local minimum. If the local maximum is at $x=\\alpha$ and the local minimum is at $x=\\beta$, find $\\alpha-\\beta$. " + ENUM,
    ["Find where $f'(x)=0$ and see how the sign of $f'(x)$ changes around those points.", "A sign change of $f'$ from positive to negative gives a local maximum; negative to positive gives a local minimum."],
    "$f'(x)={fp}$, so the local maximum is at $x={mx}$ and the local minimum at $x={mn}$. Hence $\\alpha-\\beta=({mx})-({mn})={ans}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 800; tries++) {
      let fx, fp, mx, mn;
      if (lvl <= 2) {
        const k = lvl === 1 ? 1 : r.pick([1, -1]), a = lvl === 1 ? r.pick([1, -1]) : r.pick([1, 2, -1, -2]);
        const p = r.int(-4, 3), qv = r.int(-3, 5);
        if (qv <= p) continue;
        const b = -a * (p + qv) - 2 * a * k, c = a * p * qv - b * k;
        const L = k * a;
        fx = `(${poly([a, b, c], "x")})e^{${k === 1 ? "x" : "-x"}}`;
        fp = `${L === 1 ? "" : L === -1 ? "-" : L}${fac(p)}${fac(qv)}e^{${k === 1 ? "x" : "-x"}}`;
        if (L > 0) { mx = p; mn = qv; } else { mx = qv; mn = p; }
      } else {
        const r1 = -r.int(1, 5), r2 = r.int(1, 5), P = r.pick([1, 2, 3, -1, -2, -3]);
        if ((P * (r1 + r2)) % 2 !== 0) continue;
        const Q0 = (-P * (r1 + r2)) / 2, s = -r1 * r2;
        fx = `\\frac{${lin(P, Q0, "x")}}{x^{2}+${s}}`;
        const N = `${-P === 1 ? "" : -P === -1 ? "-" : -P}${fac(r1)}${fac(r2)}`;
        fp = `\\frac{${N}}{(x^{2}+${s})^{2}}`;
        if (P > 0) { mx = r2; mn = r1; } else { mx = r1; mn = r2; }
      }
      return { v: { fx, fp, mx, mn }, ans: mx - mn };
    }
    throw new Error("extremaPair");
  });
plan("m.h3.cal1", "ca2_extremaPair", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-09"], "sign-chart-of-derivative", "concept");

// ---- 28. number of real roots of f(x) = k (graph of f)
const E_ = Math.E;
// each entry: the function, its derivative, extreme values (exs = "x|value;..." used by the verifier), limits, and for each right-hand side the exact count and condition
const RC = [
  { f: "xe^{-x}", dom: "", fpx: "f'(x)=(1-x)e^{-x}", ext: "f(1)=\\frac{1}{e}\\approx0.368", exs: "1|\\frac{1}{e}", lim: "f(x)\\to0\\ (x\\to\\infty),\\ f(x)\\to-\\infty\\ (x\\to-\\infty)",
    ks: [["-1", -1], ["0", 0], ["\\frac{1}{4}", 0.25], ["\\frac{1}{2e}", 1 / (2 * E_)], ["\\frac{1}{e^{2}}", 1 / E_ ** 2], ["\\frac{1}{2}", 0.5], ["\\frac{2}{e}", 2 / E_], ["1", 1]],
    cnt: (k) => (k <= 0 ? 1 : k < 1 / E_ ? 2 : 0), cond: (k) => (k <= 0 ? "k\\le0" : k < 1 / E_ ? "0<k<\\frac{1}{e}" : "k>\\frac{1}{e}") },
  { f: "\\frac{\\ln x}{x}", dom: "x>0", fpx: "f'(x)=\\frac{1-\\ln x}{x^{2}}", ext: "f(e)=\\frac{1}{e}\\approx0.368", exs: "e|\\frac{1}{e}", lim: "f(x)\\to-\\infty\\ (x\\to0^{+}),\\ f(x)\\to0\\ (x\\to\\infty)",
    ks: [["-1", -1], ["0", 0], ["\\frac{1}{4}", 0.25], ["\\frac{1}{2e}", 1 / (2 * E_)], ["\\frac{1}{e^{2}}", 1 / E_ ** 2], ["\\frac{1}{2}", 0.5], ["\\frac{2}{e}", 2 / E_], ["1", 1]],
    cnt: (k) => (k <= 0 ? 1 : k < 1 / E_ ? 2 : 0), cond: (k) => (k <= 0 ? "k\\le0" : k < 1 / E_ ? "0<k<\\frac{1}{e}" : "k>\\frac{1}{e}") },
  { f: "x^{2}e^{-x}", dom: "", fpx: "f'(x)=x(2-x)e^{-x}", ext: "f(0)=0,\\ f(2)=\\frac{4}{e^{2}}\\approx0.541", exs: "0|0;2|\\frac{4}{e^{2}}", lim: "f(x)\\to0\\ (x\\to\\infty),\\ f(x)\\to\\infty\\ (x\\to-\\infty)",
    ks: [["-1", -1], ["0", 0], ["\\frac{1}{4}", 0.25], ["\\frac{1}{e}", 1 / E_], ["\\frac{1}{e^{2}}", 1 / E_ ** 2], ["\\frac{2}{e^{2}}", 2 / E_ ** 2], ["\\frac{3}{4}", 0.75], ["1", 1], ["\\frac{8}{e^{2}}", 8 / E_ ** 2]],
    cnt: (k) => (k < 0 ? 0 : k === 0 ? 1 : k < 4 / E_ ** 2 ? 3 : 1), cond: (k) => (k < 0 ? "k<0" : k === 0 ? "k=0" : k < 4 / E_ ** 2 ? "0<k<\\frac{4}{e^{2}}" : "k>\\frac{4}{e^{2}}") },
  { f: "x\\ln x", dom: "x>0", fpx: "f'(x)=\\ln x+1", ext: "f\\left(\\frac{1}{e}\\right)=-\\frac{1}{e}\\approx-0.368", exs: "\\frac{1}{e}|-\\frac{1}{e}", lim: "f(x)\\to0^{-}\\ (x\\to0^{+}),\\ f(x)\\to\\infty\\ (x\\to\\infty)",
    ks: [["-1", -1], ["-\\frac{1}{2}", -0.5], ["-\\frac{1}{4}", -0.25], ["-\\frac{1}{2e}", -1 / (2 * E_)], ["-\\frac{2}{e}", -2 / E_], ["0", 0], ["1", 1], ["\\frac{1}{e}", 1 / E_]],
    cnt: (k) => (k < -1 / E_ ? 0 : k < 0 ? 2 : 1), cond: (k) => (k < -1 / E_ ? "k<-\\frac{1}{e}" : k < 0 ? "-\\frac{1}{e}<k<0" : "k\\ge0") },
  { f: "e^{x}-x", dom: "", fpx: "f'(x)=e^{x}-1", ext: "f(0)=1", exs: "0|1", lim: "f(x)\\to\\infty\\ (x\\to\\pm\\infty)",
    ks: [["-1", -1], ["0", 0], ["\\frac{1}{2}", 0.5], ["2", 2], ["3", 3], ["e", E_]],
    cnt: (k) => (k < 1 ? 0 : 2), cond: (k) => (k < 1 ? "k<1" : "k>1") },
  { f: "\\frac{e^{x}}{x}", dom: "x\\ne0", fpx: "f'(x)=\\frac{(x-1)e^{x}}{x^{2}}", ext: "f(1)=e\\approx2.718\\ (x>0),\\ f<0\\ (x<0)", exs: "1|e", lim: "f(x)\\to\\infty\\ (x\\to0^{+}),\\ f(x)\\to\\infty\\ (x\\to\\infty),\\ f(x)\\to-\\infty\\ (x\\to0^{-}),\\ f(x)\\to0\\ (x\\to-\\infty)",
    ks: [["-2", -2], ["-1", -1], ["0", 0], ["1", 1], ["\\frac{e}{2}", E_ / 2], ["3", 3], ["2e", 2 * E_], ["e^{2}", E_ ** 2]],
    cnt: (k) => (k < 0 ? 1 : k === 0 ? 0 : k < E_ ? 0 : 2), cond: (k) => (k < 0 ? "k<0" : k === 0 ? "k=0" : k < E_ ? "0<k<e" : "k>e") },
  { f: "x^{3}e^{-x}", dom: "", fpx: "f'(x)=x^{2}(3-x)e^{-x}", ext: "f(3)=\\frac{27}{e^{3}}\\approx1.344", exs: "3|\\frac{27}{e^{3}}", lim: "f(x)\\to0\\ (x\\to\\infty),\\ f(x)\\to-\\infty\\ (x\\to-\\infty)",
    ks: [["-1", -1], ["0", 0], ["\\frac{1}{e}", 1 / E_], ["\\frac{1}{2}", 0.5], ["\\frac{27}{2e^{3}}", 27 / (2 * E_ ** 3)], ["1", 1], ["2", 2], ["\\frac{54}{e^{3}}", 54 / E_ ** 3]],
    cnt: (k) => (k <= 0 ? 1 : k < 27 / E_ ** 3 ? 2 : 0), cond: (k) => (k <= 0 ? "k\\le0" : k < 27 / E_ ** 3 ? "0<k<\\frac{27}{e^{3}}" : "k>\\frac{27}{e^{3}}") },
];
add("ca2_rootCount",
  ["방정식 ${eq}$ 의 서로 다른 실근의 개수를 구하세요. " + NUM,
    ["좌변을 $f(x)$ 로 놓고, 곡선 $y=f(x)$ 와 직선 $y=k$ ($k$ 는 우변의 상수) 의 교점의 개수를 생각해요.", "$f$ 의 증감을 조사해 극값과 $x\\to\\pm\\infty$ 일 때의 값을 확인하고, $k$ 가 그 값들과 어떤 관계인지 비교해요. $e$ 의 값은 $2.7<e<2.8$ 로 어림해요."],
    "${fpx}$ 이므로 증감을 조사하면 극값은 ${ext}$ 이고, 극한은 ${lim}$ 입니다. 이때 ${cm}$ 이므로 곡선 $y=f(x)$ 와 직선 $y=k$ 의 교점은 ${ans}$ 개이고, 실근도 ${ans}$ 개입니다."],
  ["Find the number of distinct real roots of the equation ${eq}$. " + ENUM,
    ["Call the left side $f(x)$ and count the intersections of the curve $y=f(x)$ with the line $y=k$, where $k$ is the constant on the right.", "Study where $f$ increases and decreases, find its extreme values and its behaviour as $x\\to\\pm\\infty$, then compare $k$ with those values. Use $2.7<e<2.8$."],
    "From ${fpx}$ the extreme values are ${ext}$ and the limits are ${lim}$. Here ${cm}$, so the curve $y=f(x)$ and the line $y=k$ meet in {ans} point(s), and the equation has {ans} real root(s)."],
  (r, lvl) => {
    const idx = lvl === 1 ? [0, 1, 4] : lvl === 2 ? [2, 3] : [5, 6];
    const F = RC[r.pick(idx)];
    const [kt, kv] = r.pick(F.ks);
    const dom = F.dom ? `\\ (${F.dom})` : "";
    return { v: { eq: `${F.f}=${kt}${dom}`, fpx: F.fpx, ext: F.ext, exs: F.exs, lim: F.lim, cm: `k=${kt}:\\ ${F.cond(kv)}` }, ans: F.cnt(kv) };
  });
plan("m.h3.cal1", "ca2_rootCount", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-10", "12미적Ⅱ-02-09"], "roots-from-graph", "concept");

// ---- 28b. number of integers k for which f(x) = k has a given number of roots
add("ca2_rootCountParam",
  ["방정식 ${eq}$ 가 서로 다른 ${nr}$ 개의 실근을 갖도록 하는 정수 $k$ 의 개수를 구하세요. " + NUM,
    ["좌변을 $f(x)$ 로 놓고, 곡선 $y=f(x)$ 와 직선 $y=k$ 의 교점이 ${nr}$ 개가 되는 $k$ 의 범위를 그래프의 증감과 극값으로 찾아요.", "극값에 $e$ 가 들어 있으면 $2.7<e<2.8$ 로 어림하여 범위 안의 정수를 세요."],
    "${fpx}$ 이므로 극값은 ${ext}$ 이고, 교점이 ${nr}$ 개이려면 ${rg}$ 입니다. 이 범위의 정수 $k$ 는 ${lst}$ 이므로 ${ans}$ 개입니다."],
  ["Find the number of integers $k$ for which the equation ${eq}$ has exactly ${nr}$ distinct real roots. " + ENUM,
    ["Call the left side $f(x)$ and use the increase and decrease and the extreme values of $f$ to find the range of $k$ for which the line $y=k$ meets the curve $y=f(x)$ in ${nr}$ points.", "If the extreme value contains $e$, use $2.7<e<2.8$, and count the integers in the range."],
    "From ${fpx}$ the extreme value is ${ext}$, and ${nr} intersections occur when ${rg}$. The integers $k$ in this range are ${lst}$, so there are ${ans}$ of them."],
  (r, lvl) => {
    const fam = lvl === 1 ? r.pick(["A", "B", "D"]) : r.pick(["C", "E"]);
    for (let tries = 0; tries < 200; tries++) {
      const c = r.int(2, 30);
      let eq, nr, fpx, ext, rg, hi, neg = false;
      if (fam === "A") { hi = c / E_; eq = `${c}xe^{-x}=k`; nr = 2; fpx = `f'(x)=${c}(1-x)e^{-x}`; ext = `f(1)=\\frac{${c}}{e}`; rg = `0<k<\\frac{${c}}{e}`; }
      else if (fam === "B") { hi = c / E_; eq = `\\frac{${c}\\ln x}{x}=k\\ (x>0)`; nr = 2; fpx = `f'(x)=\\frac{${c}(1-\\ln x)}{x^{2}}`; ext = `f(e)=\\frac{${c}}{e}`; rg = `0<k<\\frac{${c}}{e}`; }
      else if (fam === "D") { hi = c / E_; neg = true; eq = `${c}x\\ln x=k\\ (x>0)`; nr = 2; fpx = `f'(x)=${c}(\\ln x+1)`; ext = `f\\left(\\frac{1}{e}\\right)=-\\frac{${c}}{e}`; rg = `-\\frac{${c}}{e}<k<0`; }
      else if (fam === "C") { hi = (4 * c) / E_ ** 2; eq = `${c}x^{2}e^{-x}=k`; nr = 3; fpx = `f'(x)=${c}x(2-x)e^{-x}`; ext = `f(0)=0,\\ f(2)=\\frac{${4 * c}}{e^{2}}`; rg = `0<k<\\frac{${4 * c}}{e^{2}}`; }
      else { hi = (27 * c) / E_ ** 3; eq = `${c}x^{3}e^{-x}=k`; nr = 2; fpx = `f'(x)=${c}x^{2}(3-x)e^{-x}`; ext = `f(3)=\\frac{${27 * c}}{e^{3}}`; rg = `0<k<\\frac{${27 * c}}{e^{3}}`; }
      const cntI = Math.floor(hi);
      if (cntI < 1 || cntI > 6 || hi - cntI < 0.12 || 1 - (hi - cntI) < 0.12) continue;
      const ks = range(1, cntI).map((i) => (neg ? -i : i));
      if (neg) ks.reverse();
      return { v: { eq, nr, fpx, ext, rg, lst: ks.join(", ") }, ans: cntI };
    }
    throw new Error("rootCountParam");
  });
plan("m.h3.cal1", "ca2_rootCountParam", [1, 2], 7, 4, ["12미적Ⅱ-02-10", "12미적Ⅱ-02-09"], "count-integer-parameters-from-graph", "counting");

// ---- 29. parameter range for monotonicity
add("ca2_monotoneParam",
  ["함수 $f(x)={fx}$ 가 실수 전체의 집합에서 증가하도록 하는 정수 $a$ 의 개수를 구하세요. (모든 실수 $x$ 에서 $f'(x)\\ge 0$ 이면 증가한다고 합니다.) " + NUM,
    ["미분가능한 함수가 실수 전체에서 증가하려면 모든 $x$ 에서 $f'(x)\\ge0$ 이어야 해요.", "$f'(x)$ 의 최솟값(또는 판별식)이 $0$ 이상이 되는 $a$ 의 범위를 구한 뒤 정수를 세요."],
    "${wk}$ 입니다. 따라서 조건을 만족하는 정수 $a$ 는 ${lst}$ 이고, 모두 ${ans}$ 개입니다."],
  ["Find the number of integers $a$ for which $f(x)={fx}$ is increasing on all real numbers. (It is increasing when $f'(x)\\ge 0$ for every real $x$.) " + ENUM,
    ["A differentiable function is increasing on all of $\\mathbb{R}$ exactly when $f'(x)\\ge0$ for every $x$.", "Find the range of $a$ for which the minimum of $f'(x)$ (or the discriminant) allows this, then count the integers."],
    "${wk}$. So the integers $a$ satisfying the condition are ${lst}$, in total {ans}."],
  (r, lvl) => {
    const isq = (n) => { let s = 0; while ((s + 1) * (s + 1) <= n) s++; return s; };
    for (let tries = 0; tries < 800; tries++) {
      const kind = lvl === 1 ? r.pick([1, 4]) : lvl === 2 ? 2 : r.pick([3, 5, 2]);
      let fx, wk, hi;
      if (kind === 1) {
        const b = r.int(2, 30); hi = isq(b);
        fx = `\\frac{1}{3}x^{3}+ax^{2}+${b}x`; wk = `f'(x)=x^{2}+2ax+${b}\\ge0\\ \\Leftrightarrow\\ D/4=a^{2}-${b}\\le0\\ \\Leftrightarrow\\ a^{2}\\le ${b}\\ \\Leftrightarrow\\ -${hi}\\le a\\le ${hi}`;
      } else if (kind === 4) {
        const b = r.int(1, 12), c = r.int(-5, 5); hi = isq(3 * b);
        fx = `x^{3}+ax^{2}+${b}x${c === 0 ? "" : pm(c)}`; wk = `f'(x)=3x^{2}+2ax+${b}\\ge0\\ \\Leftrightarrow\\ D/4=a^{2}-${3 * b}\\le0\\ \\Leftrightarrow\\ a^{2}\\le ${3 * b}\\ \\Leftrightarrow\\ -${hi}\\le a\\le ${hi}`;
      } else if (kind === 2) {
        const p = r.int(2, 9), c = lvl === 2 ? r.int(1, 2) : r.int(3, 4);
        hi = Math.floor(p / c);
        if (hi < 1) continue;
        fx = `${p}x+a\\sin ${ax(c)}`; wk = `f'(x)=${p}+${c === 1 ? "" : c}a\\cos ${ax(c)}\\ge0\\ \\Leftrightarrow\\ ${c === 1 ? "" : c}|a|\\le ${p}\\ \\Leftrightarrow\\ |a|\\le\\frac{${p}}{${c}}\\ \\Leftrightarrow\\ -${hi}\\le a\\le ${hi}`;
      } else if (kind === 3) {
        const p = r.int(1, 4), s = r.int(1, 3); hi = p * s;
        fx = `${cf(p)}x+a\\ln(x^{2}+${s * s})`; wk = `f'(x)=${p}+\\frac{2ax}{x^{2}+${s * s}}\\ge0,\\ \\left|\\frac{2x}{x^{2}+${s * s}}\\right|\\le ${tq(q(1, s))}\\ (x=\\pm ${s})\\ \\Leftrightarrow\\ |a|\\le ${p * s}`;
      } else {
        const p = r.pick([2, 3, 4, 5, 6, 8, 9]); hi = Math.floor(p / Math.SQRT2);
        fx = `${p}x+a(\\sin x+\\cos x)`; wk = `f'(x)=${p}+a(\\cos x-\\sin x)=${p}+\\sqrt{2}\\,a\\cos\\left(x+\\frac{\\pi}{4}\\right)\\ge0\\ \\Leftrightarrow\\ \\sqrt{2}|a|\\le ${p}\\ \\Leftrightarrow\\ |a|\\le\\frac{${p}}{\\sqrt{2}}\\approx ${(p / Math.SQRT2).toFixed(2)}`;
      }
      const cnt = 2 * hi + 1;
      const lstArr = range(-hi, hi);
      const lst = lstArr.length > 9 ? `${-hi}, ${-hi + 1}, \\ldots, ${hi}` : lstArr.join(", ");
      if (cnt < 3 || cnt > 25) continue;
      return { v: { fx, wk, lst }, ans: cnt };
    }
    throw new Error("monotoneParam");
  });
plan("m.h3.cal1", "ca2_monotoneParam", [1, 2, 3], 7, 4, ["12미적Ⅱ-02-10"], "derivative-nonnegative-for-all-x", "reverse");

// ---- 30. velocity zero -> acceleration
add("ca2_motionReverse",
  ["수직선 위를 움직이는 점 P 의 시각 $t$ ($t>0$)에서의 위치가 $x(t)={xt}$ 이다. 점 P 의 속도가 처음으로 $0$ 이 되는 시각에서의 가속도를 구하세요. " + FR,
    ["속도는 위치를 $t$ 로 미분한 $v(t)=x'(t)$, 가속도는 $a(t)=v'(t)$ 예요.", "$v(t)=0$ 을 만족하는 가장 작은 양수 $t$ 를 구한 뒤 $a(t)$ 에 대입해요."],
    "${wk}$ 이므로 처음으로 속도가 $0$ 이 되는 시각에서의 가속도는 ${res}$ 입니다."],
  ["A point P moves on a number line and its position at time $t$ ($t>0$) is $x(t)={xt}$. Find its acceleration at the first time its velocity is $0$. " + EFR,
    ["Velocity is $v(t)=x'(t)$ and acceleration is $a(t)=v'(t)$.", "Find the smallest positive $t$ with $v(t)=0$ and substitute it into $a(t)$."],
    "${wk}$, so the acceleration at the first time the velocity is zero is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const kind = lvl === 1 ? 1 : lvl === 2 ? r.pick([2, 3]) : r.pick([4, 5]);
      let xt, wk, ans;
      if (kind === 1) {
        const p = r.int(1, 4), b = r.int(p + 1, 14);
        const t0 = q(b, p).sub(q(1));
        xt = `${cf(p)}t-${b}\\ln(t+1)`; ans = q(p * p, b);
        wk = `v(t)=${p}-\\frac{${b}}{t+1}=0\\ \\Rightarrow\\ t=${tq(t0)},\\ a(t)=\\frac{${b}}{(t+1)^{2}}=\\frac{${b}}{(${tq(t0.add(q(1)))})^{2}}`;
      } else if (kind === 2) {
        // cubic with two positive integer zeros of the velocity
        const r1 = r.int(1, 4), r2 = r.int(r1 + 1, 7), s = r.pick([1, 2, -1, -2]), c0 = r.int(-5, 5);
        if ((r1 + r2) % 2 !== 0) continue;
        xt = poly([s, (-3 * s * (r1 + r2)) / 2, 3 * s * r1 * r2, c0], "t");
        ans = q(3 * s * (r1 - r2));
        wk = `v(t)=${poly([3 * s, -3 * s * (r1 + r2), 3 * s * r1 * r2], "t")}=${3 * s}(t-${r1})(t-${r2})=0\\ \\Rightarrow\\ t=${r1},\\ a(t)=${poly([6 * s, -3 * s * (r1 + r2)], "t")}\\ \\Rightarrow\\ a(${r1})=${3 * s * (r1 - r2)}`;
      } else if (kind === 3) {
        const p = r.nonzero(-6, 6), m = r.int(1, 4);
        xt = `${cf(p)}t${p * m * m < 0 ? "-" : "+"}\\frac{${Math.abs(p * m * m)}}{t}`; ans = q(2 * p, m);
        wk = `v(t)=${p}${p * m * m < 0 ? "+" : "-"}\\frac{${Math.abs(p * m * m)}}{t^{2}}=0\\ \\Rightarrow\\ t=${m},\\ a(t)=\\frac{${2 * p * m * m}}{t^{3}}\\ \\Rightarrow\\ a(${m})=\\frac{${2 * p * m * m}}{${m ** 3}}`;
      } else if (kind === 4) {
        const m = r.int(1, 4), p = r.nonzero(-6, 6);
        xt = `\\frac{${cf(p)}t}{t^{2}+${m * m}}`; ans = q(-p, 2 * m ** 3);
        wk = `v(t)=\\frac{${cf(p)}(${m * m}-t^{2})}{(t^{2}+${m * m})^{2}}=0\\ \\Rightarrow\\ t=${m},\\ a(${m})=\\frac{${p}\\cdot(-${2 * m})}{(${2 * m * m})^{2}}`;
      } else {
        const m = r.int(2, 4), p = r.nonzero(-4, 4);
        if ((p * m ** 3) % 2 !== 0) continue;
        const qq = (p * m ** 3) / 2;
        xt = `${cf(p)}t${qq < 0 ? "-" : "+"}\\frac{${Math.abs(qq)}}{(t+1)^{2}}`; ans = q(3 * p, m);
        wk = `v(t)=${p}${qq < 0 ? "+" : "-"}\\frac{${Math.abs(2 * qq)}}{(t+1)^{3}}=0\\ \\Rightarrow\\ (t+1)^{3}=${m ** 3},\\ t=${m - 1},\\ a(t)=\\frac{${6 * qq}}{(t+1)^{4}}\\ \\Rightarrow\\ a(${m - 1})=\\frac{${6 * qq}}{${m ** 4}}`;
      }
      if (!simple(ans, 400)) continue;
      return { v: { xt, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("motionReverse");
  });
plan("m.h3.cal1", "ca2_motionReverse", [1, 2, 3], 7, 3, ["12미적Ⅱ-02-11"], "velocity-zero-then-acceleration", "application");

// ===================================================================== integration
// ---- 31. definite integral as a limit of sums
add("ca2_riemann",
  ["$L=\\lim_{n\\to\\infty}{pre}\\sum_{k=1}^{n}{body}$ 일 때, ${ask}$ 의 값을 구하세요. " + FR,
    ["구간을 $n$ 등분한 직사각형 넓이의 합으로 보고, $\\frac{k}{n}$ 을 $x$ 로 바꿔 정적분 꼴로 나타내요.", "정적분의 구간은 $k=1$ 일 때와 $k=n$ 일 때의 $\\frac{k}{n}$ 값의 극한으로 정해요."],
    "급수를 정적분으로 바꾸면 $L={wk}$ 입니다. 따라서 ${ask}$ 의 값은 ${res}$ 입니다."],
  ["If $L=\\lim_{n\\to\\infty}{pre}\\sum_{k=1}^{n}{body}$, find ${ask}$. " + EFR,
    ["Read the sum as a sum of rectangle areas over $n$ equal parts and replace $\\frac{k}{n}$ by $x$.", "The limits of integration come from the values of $\\frac{k}{n}$ at the ends, in the limit."],
    "Converting the sum to a definite integral gives $L={wk}$. Hence ${ask}$ equals ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      let pre, body, ask = "L", wk, ans;
      const kind = lvl === 1 ? r.pick([1, 2, 2]) : lvl === 2 ? r.pick([3, 4, 7, 11]) : r.pick([5, 8, 9, 10, 12]);
      const A = (a) => (a === 1 ? "" : String(a));
      if (kind === 1) { const p = r.int(2, 5), c = r.int(1, 6); pre = "\\frac{1}{n}"; body = `${c === 1 ? "" : c}\\left(\\frac{k}{n}\\right)^{${p}}`; ans = q(c, p + 1); wk = `\\int_{0}^{1}${c === 1 ? "" : c}x^{${p}}dx=\\frac{${c}}{${p + 1}}`; }
      else if (kind === 2) {
        const a = r.int(1, 3), c = r.int(1, 3), p = r.int(1, 3);
        pre = `\\frac{${c}}{n}`; body = `\\left(${a}+\\frac{${c === 1 ? "" : c}k}{n}\\right)^{${p}}`;
        ans = q((a + c) ** (p + 1) - a ** (p + 1), p + 1); wk = `\\int_{${a}}^{${a + c}}x^{${p}}dx=\\frac{${a + c}^{${p + 1}}-${a}^{${p + 1}}}{${p + 1}}`;
      } else if (kind === 3) {
        const m = r.pick([1, 2, 3]); pre = m === 1 ? "\\frac{\\pi}{n}" : `\\frac{\\pi}{${m}n}`; body = m === 1 ? "\\sin\\frac{k\\pi}{n}" : `\\sin\\frac{k\\pi}{${m}n}`;
        ans = q(1).sub(m === 1 ? q(-1) : m === 2 ? q(0) : q(1, 2)); wk = `\\int_{0}^{\\frac{\\pi}{${m}}}\\sin x\\,dx=1-\\cos\\frac{\\pi}{${m}}`;
        if (m === 1) wk = "\\int_{0}^{\\pi}\\sin x\\,dx=2";
      } else if (kind === 4) {
        const m = r.pick([2, 6]); pre = `\\frac{\\pi}{${m}n}`; body = `\\cos\\frac{k\\pi}{${m}n}`; ans = m === 2 ? q(1) : q(1, 2); wk = `\\int_{0}^{\\frac{\\pi}{${m}}}\\cos x\\,dx=\\sin\\frac{\\pi}{${m}}`;
      } else if (kind === 11) {
        const m = r.pick([1, 2]); pre = m === 1 ? "\\frac{\\pi}{n}" : "\\frac{\\pi}{2n}"; body = m === 1 ? "\\sin^{2}\\frac{k\\pi}{n}" : "\\sin^{2}\\frac{k\\pi}{2n}"; ask = "\\frac{L}{\\pi}"; ans = q(1, 2 * m);
        wk = m === 1 ? "\\int_{0}^{\\pi}\\sin^{2}x\\,dx=\\int_{0}^{\\pi}\\frac{1-\\cos 2x}{2}dx=\\frac{\\pi}{2}" : "\\int_{0}^{\\frac{\\pi}{2}}\\sin^{2}x\\,dx=\\int_{0}^{\\frac{\\pi}{2}}\\frac{1-\\cos 2x}{2}dx=\\frac{\\pi}{4}";
      } else if (kind === 5) {
        const a = r.int(1, 4); pre = ""; body = `\\frac{1}{n+${A(a)}k}`; ask = a === 1 ? "e^{L}" : `e^{${a}L}`; ans = q(1 + a);
        wk = `\\int_{0}^{1}\\frac{ dx }{1+${A(a)}x}=\\frac{\\ln ${1 + a}}{${a}}`;
      } else if (kind === 7) {
        const a = r.int(1, 4); pre = ""; body = `\\frac{n}{(n+${A(a)}k)^{2}}`; ans = q(1, 1 + a); wk = `\\int_{0}^{1}\\frac{ dx }{(1+${A(a)}x)^{2}}=\\frac{1}{${1 + a}}`;
      } else if (kind === 8) {
        const a = r.int(1, 4); pre = ""; body = `\\frac{k}{n^{2}+${A(a)}k^{2}}`; ask = `e^{${2 * a}L}`; ans = q(1 + a); wk = `\\int_{0}^{1}\\frac{x\\,dx}{1+${A(a)}x^{2}}=\\frac{\\ln ${1 + a}}{${2 * a}}`;
      } else if (kind === 9) {
        const p = r.int(3, 4); pre = ""; body = `\\frac{n^{${p - 1}}}{(n+k)^{${p}}}`; ans = q(1).sub(q(1, 2 ** (p - 1))).div(q(p - 1)); wk = `\\int_{0}^{1}\\frac{ dx }{(1+x)^{${p}}}=\\frac{1}{${p - 1}}\\left(1-\\frac{1}{${2 ** (p - 1)}}\\right)`;
      } else if (kind === 10) {
        const a = r.pick([3, 8, 15]), c = r.pick([1, 1, 2, 3]), s = Math.round(Math.sqrt(1 + a));
        pre = ""; body = `\\frac{${c === 1 ? "1" : c}}{\\sqrt{n(n+${a}k)}}`; ans = q(2 * c * (s - 1), a);
        wk = `${c === 1 ? "" : c}\\int_{0}^{1}\\frac{ dx }{\\sqrt{1+${a}x}}=${c === 1 ? "" : c}\\left[\\frac{2}{${a}}\\sqrt{1+${a}x}\\right]_{0}^{1}=${c === 1 ? "" : c}\\cdot\\frac{2}{${a}}(${s}-1)`;
      } else {
        const a = r.pick([3, 8, 15]), c = r.pick([1, 1, 2, 3]), s = Math.round(Math.sqrt(1 + a));
        pre = c === 1 ? "\\frac{1}{n}" : `\\frac{${c}}{n}`; body = `\\sqrt{1+\\frac{${a}k}{n}}`; ans = q(2 * c * (s ** 3 - 1), 3 * a);
        wk = `${c === 1 ? "" : c}\\int_{0}^{1}\\sqrt{1+${a}x}\\,dx=${c === 1 ? "" : c}\\left[\\frac{2}{${3 * a}}(1+${a}x)^{\\frac{3}{2}}\\right]_{0}^{1}=${c === 1 ? "" : c}\\cdot\\frac{2}{${3 * a}}(${s ** 3}-1)`;
      }
      if (!simple(ans, 100)) continue;
      return { v: { pre, body, ask, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("riemann");
  });
plan("m.h3.int", "ca2_riemann", [1, 2, 3], 7, 4, ["12미적Ⅱ-03-04"], "sum-to-integral", "representation");

// ---- 32. area between curves
add("ca2_areaCurves",
  ["두 그래프 $y={f}$, $y={g}$ 와 두 직선 $x={a}$, $x={b}$ 로 둘러싸인 부분의 넓이를 $S$ 라 할 때, ${ask}$ 의 값을 구하세요. (참고: $x$ 축은 $y=0$ 이에요.) " + FR,
    ["구간에서 위에 있는 그래프의 식에서 아래에 있는 그래프의 식을 뺀 것을 적분해요.", "$(\\tan x)'=\\frac{1}{\\cos^{2}x}$, $(\\ln x)'=\\frac{1}{x}$ 임을 이용해 지수·삼각·유리함수의 부정적분을 구하고, 합성된 꼴이면 치환적분을 써요."],
    "구간 $[{a},{b}]$ 에서 $y={f}$ 가 위에 있으므로 $S=\\int_{{a}}^{{b}}({f}-{gg})\\,dx={wk}$ 입니다. 따라서 ${ask}$ 의 값은 ${res}$ 입니다."],
  ["Let $S$ be the area of the region bounded by the graphs $y={f}$, $y={g}$ and the lines $x={a}$, $x={b}$. Find ${ask}$. (Note: the $x$-axis is $y=0$.) " + EFR,
    ["Integrate (upper graph) minus (lower graph) over the interval.", "Use $(\\tan x)'=\\frac{1}{\\cos^{2}x}$, $(\\ln x)'=\\frac{1}{x}$ to find antiderivatives of exponential, trigonometric and rational functions, and substitution for composite forms."],
    "On $[{a},{b}]$ the graph $y={f}$ lies above, so $S=\\int_{{a}}^{{b}}({f}-{gg})\\,dx={wk}$. Hence ${ask}$ equals ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const kind = lvl === 1 ? r.pick([1, 3, 4]) : lvl === 2 ? r.pick([2, 5, 6, 7, 8]) : r.pick([9, 11, 12, 13, 14]);
      let f, g = "0", a = "0", b, ask = "S", wk, S;
      if (kind === 1) { const aa = r.int(1, 5), k = r.pick([1, 1, 2, 3]), m = r.int(2, 6); f = `${cf(aa)}e^{${ax(k)}}`; b = lnTex(m, k); S = q(aa * (m - 1), k); wk = `\\left[\\frac{${aa}}{${k}}e^{${ax(k)}}\\right]_{0}^{${b}}=\\frac{${aa}}{${k}}(${m}-1)`; }
      else if (kind === 2) { const m = r.int(2, 6); f = "e^{x}"; g = "e^{-x}"; b = `\\ln ${m}`; S = q(m).add(q(1, m)).sub(q(2)); wk = `\\left[e^{x}+e^{-x}\\right]_{0}^{\\ln ${m}}=\\left(${m}+\\frac{1}{${m}}\\right)-2`; }
      else if (kind === 3) { const aa = r.int(1, 6), m = r.int(2, 6); f = `\\frac{${aa}}{x^{2}}`; a = "1"; b = String(m); S = q(aa).mul(q(1).sub(q(1, m))); wk = `\\left[-\\frac{${aa}}{x}\\right]_{1}^{${m}}=${aa}\\left(1-\\frac{1}{${m}}\\right)`; }
      else if (kind === 4) { const c = r.int(1, 4), s = r.int(1, 4); f = `${cf(c)}\\sqrt{x}`; b = String(s * s); S = q(2 * c * s ** 3, 3); wk = `\\left[\\frac{${2 * c}}{3}x\\sqrt{x}\\right]_{0}^{${s * s}}=\\frac{${2 * c}}{3}\\cdot ${s ** 3}`; }
      else if (kind === 5) { const aa = r.int(1, 5), k = r.int(1, 3); f = `${cf(aa)}\\sin ${ax(k)}`; b = piTex(1, k); S = q(2 * aa, k); wk = `\\left[-\\frac{${aa}}{${k}}\\cos ${ax(k)}\\right]_{0}^{${b}}=\\frac{${2 * aa}}{${k}}`; }
      else if (kind === 6) { const aa = r.int(1, 6); f = `${cf(aa)}\\sin x`; g = `${cf(aa)}\\sin x\\cos x`; b = "\\frac{\\pi}{2}"; S = q(aa, 2); wk = `${aa}\\left[-\\cos x-\\frac{\\sin^{2}x}{2}\\right]_{0}^{\\frac{\\pi}{2}}=${aa}\\left(1-\\frac{1}{2}\\right)`; }
      else if (kind === 7) { const aa = r.int(1, 6); f = `\\frac{${aa}}{\\cos^{2}x}`; b = "\\frac{\\pi}{4}"; S = q(aa); wk = `\\left[${aa}\\tan x\\right]_{0}^{\\frac{\\pi}{4}}=${aa}`; }
      else if (kind === 8) { const aa = r.int(1, 6), k = r.int(1, 3); f = `${cf(aa)}\\cos ${ax(k)}`; b = piTex(1, 2 * k); S = q(aa, k); wk = `\\left[\\frac{${aa}}{${k}}\\sin ${ax(k)}\\right]_{0}^{${b}}=\\frac{${aa}}{${k}}`; }
      else if (kind === 9) { const aa = r.int(1, 3), m = r.int(2, 5); f = `\\frac{${aa}}{x}`; a = "1"; b = String(m); ask = "e^{S}"; S = q(m ** aa); wk = `\\left[${aa}\\ln x\\right]_{1}^{${m}}=${aa}\\ln ${m}=\\ln ${m ** aa}`; }
      else if (kind === 11) { const k = r.int(1, 3); f = "\\frac{\\ln x}{x}"; a = "1"; b = eP(k); S = q(k * k, 2); wk = `\\int_{0}^{${k}}u\\,du\\ (u=\\ln x)=\\frac{${k * k}}{2}`; }
      else if (kind === 12) { const [bb, s, u] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]]); f = `\\frac{x}{\\sqrt{x^{2}+${s * s}}}`; b = String(bb); S = q(u - s); wk = `\\frac{1}{2}\\int_{${s * s}}^{${u * u}}u^{-\\frac{1}{2}}du\\ (u=x^{2}+${s * s})=\\sqrt{${u * u}}-\\sqrt{${s * s}}`; }
      else if (kind === 13) { const bb = r.int(1, 4); f = "\\frac{2x}{x^{2}+1}"; b = String(bb); ask = "e^{S}"; S = q(bb * bb + 1); wk = `\\int_{1}^{${bb * bb + 1}}\\frac{du}{u}\\ (u=x^{2}+1)=\\ln ${bb * bb + 1}`; }
      else { const j = r.pick([3, 4]); f = "\\tan x"; b = piTex(1, j); ask = j === 3 ? "e^{S}" : "e^{2S}"; S = q(2); wk = j === 3 ? "\\left[-\\ln(\\cos x)\\right]_{0}^{\\frac{\\pi}{3}}=-\\ln\\frac{1}{2}=\\ln 2" : "\\left[-\\ln(\\cos x)\\right]_{0}^{\\frac{\\pi}{4}}=-\\ln\\frac{1}{\\sqrt{2}}=\\frac{1}{2}\\ln 2"; }
      if (!simple(S, 100)) continue;
      return { v: { f, g, a, b, gg: g, ask, wk, res: tq(S) }, ans: num(S) };
    }
    throw new Error("areaCurves");
  });
plan("m.h3.area", "ca2_areaCurves", [1, 2, 3], 7, 3, ["12미적Ⅱ-03-05"], "area-between-graphs", "calc");

// ---- 33. volume of a solid of revolution
add("ca2_volumeRotate",
  ["두 그래프 $y={f}$, $y={g}$ 와 두 직선 $x={a}$, $x={b}$ 로 둘러싸인 부분을 $x$ 축 둘레로 회전시킨 회전체의 부피를 $V$ 라 할 때, ${ask}$ 의 값을 구하세요. (참고: $x$ 축은 $y=0$ 이에요.) " + FR,
    ["회전체의 부피는 $V=\\pi\\int_{\\alpha}^{\\beta}\\{(\\text{바깥 반지름})^{2}-(\\text{안쪽 반지름})^{2}\\}\\,dx$ 예요.", "위의 그래프를 바깥 반지름, 아래의 그래프를 안쪽 반지름으로 놓아요. $(\\tan x)'=\\frac{1}{\\cos^{2}x}$ 이고 $\\sin^{2}x=\\frac{1-\\cos 2x}{2}$ 예요."],
    "$V=\\pi\\int_{{a}}^{{b}}\\left(({f})^{2}-({g})^{2}\\right)dx={wk}$ 이므로 ${ask}$ 의 값은 ${res}$ 입니다."],
  ["Let $V$ be the volume of the solid obtained by rotating about the $x$-axis the region bounded by the graphs $y={f}$, $y={g}$ and the lines $x={a}$, $x={b}$. Find ${ask}$. (Note: the $x$-axis is $y=0$.) " + EFR,
    ["The volume is $V=\\pi\\int_{\\alpha}^{\\beta}\\{(\\text{outer radius})^{2}-(\\text{inner radius})^{2}\\}\\,dx$.", "Take the upper graph as the outer radius and the lower graph as the inner radius. Note $(\\tan x)'=\\frac{1}{\\cos^{2}x}$ and $\\sin^{2}x=\\frac{1-\\cos 2x}{2}$."],
    "$V=\\pi\\int_{{a}}^{{b}}\\left(({f})^{2}-({g})^{2}\\right)dx={wk}$, so ${ask}$ equals ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const kind = lvl === 1 ? r.pick([1, 2, 3]) : lvl === 2 ? r.pick([4, 5, 6]) : r.pick([7, 8, 10, 11]);
      let f, g = "0", a = "0", b, ask = "\\frac{V}{\\pi}", wk, Vq;
      if (kind === 1) { const c = r.int(1, 6), bb = r.int(1, 5); f = `\\sqrt{${c === 1 ? "" : c}x}`; b = String(bb); Vq = q(c * bb * bb, 2); wk = `\\pi\\left[\\frac{${c}}{2}x^{2}\\right]_{0}^{${bb}}=\\pi\\cdot\\frac{${c * bb * bb}}{2}`; }
      else if (kind === 2) { const k = r.pick([1, 1, 2, 3]), m = r.int(2, 6); f = `e^{${ax(k)}}`; b = lnTex(m, k); Vq = q(m * m - 1, 2 * k); wk = `\\pi\\left[\\frac{1}{${2 * k}}e^{${ax(2 * k)}}\\right]_{0}^{${b}}=\\pi\\cdot\\frac{${m * m}-1}{${2 * k}}`; }
      else if (kind === 3) { const t = r.pick([0, 1, 2]); if (t === 0) { f = "\\sqrt{x}"; g = "x"; Vq = q(1, 6); wk = "\\pi\\int_{0}^{1}(x-x^{2})dx=\\pi\\left(\\frac{1}{2}-\\frac{1}{3}\\right)"; } else if (t === 1) { f = "\\sqrt{x}"; g = "x^{2}"; Vq = q(3, 10); wk = "\\pi\\int_{0}^{1}(x-x^{4})dx=\\pi\\left(\\frac{1}{2}-\\frac{1}{5}\\right)"; } else { const aa = r.int(1, 4); f = `${cf(aa)}x`; g = "x^{2}"; if (aa === 1) continue; Vq = q(aa * aa, 3).sub(q(1, 5)); wk = `\\pi\\int_{0}^{1}(${aa * aa}x^{2}-x^{4})dx=\\pi\\left(\\frac{${aa * aa}}{3}-\\frac{1}{5}\\right)`; } b = "1"; }
      else if (kind === 4) { const aa = r.int(1, 3); f = `${cf(aa)}\\sin x`; b = "\\pi"; ask = "\\frac{V}{\\pi^{2}}"; Vq = q(aa * aa, 2); wk = `\\pi\\int_{0}^{\\pi}${cf(aa * aa)}\\sin^{2}x\\,dx=\\pi\\cdot ${aa * aa}\\cdot\\frac{\\pi}{2}`; }
      else if (kind === 5) { const m = r.int(2, 6); f = "\\frac{1}{x}"; a = "1"; b = String(m); Vq = q(1).sub(q(1, m)); wk = `\\pi\\left[-\\frac{1}{x}\\right]_{1}^{${m}}=\\pi\\left(1-\\frac{1}{${m}}\\right)`; }
      else if (kind === 6) { f = "\\frac{1}{\\cos x}"; b = "\\frac{\\pi}{4}"; Vq = q(1); wk = "\\pi\\int_{0}^{\\frac{\\pi}{4}}\\frac{dx}{\\cos^{2}x}=\\pi\\left[\\tan x\\right]_{0}^{\\frac{\\pi}{4}}=\\pi\\cdot 1"; }
      else if (kind === 7) { f = "\\cos x"; g = "\\sin x"; b = "\\frac{\\pi}{4}"; Vq = q(1, 2); wk = "\\pi\\int_{0}^{\\frac{\\pi}{4}}\\cos 2x\\,dx=\\pi\\left[\\frac{\\sin 2x}{2}\\right]_{0}^{\\frac{\\pi}{4}}=\\pi\\cdot\\frac{1}{2}"; }
      else if (kind === 8) { const m = r.int(2, 5); f = "e^{x}"; g = "e^{-x}"; b = `\\ln ${m}`; Vq = q(m * m).add(q(1, m * m)).sub(q(2)).div(q(2)); wk = `\\pi\\int_{0}^{\\ln ${m}}\\left(e^{2x}-e^{-2x}\\right)dx=\\pi\\left[\\frac{e^{2x}+e^{-2x}}{2}\\right]_{0}^{\\ln ${m}}=\\pi\\left(\\frac{${m * m}+\\frac{1}{${m * m}}}{2}-1\\right)`; }
      else if (kind === 10) { const aa = r.int(1, 3); f = `${cf(aa)}\\sin x\\cos x`; b = "\\frac{\\pi}{2}"; ask = "\\frac{V}{\\pi^{2}}"; Vq = q(aa * aa, 16); wk = `\\pi\\int_{0}^{\\frac{\\pi}{2}}${cf(aa * aa)}\\sin^{2}x\\cos^{2}x\\,dx=\\pi\\cdot\\frac{${aa * aa}}{4}\\int_{0}^{\\frac{\\pi}{2}}\\sin^{2}2x\\,dx=\\pi\\cdot\\frac{${aa * aa}}{4}\\cdot\\frac{\\pi}{4}`; }
      else { const aa = r.int(2, 5); f = `\\sqrt{${aa}x}`; g = "x"; b = String(aa); Vq = q(aa ** 3, 6); wk = `\\pi\\int_{0}^{${aa}}(${aa}x-x^{2})dx=\\pi\\left[\\frac{${aa}}{2}x^{2}-\\frac{x^{3}}{3}\\right]_{0}^{${aa}}=\\pi\\left(\\frac{${aa ** 3}}{2}-\\frac{${aa ** 3}}{3}\\right)`; }
      if (!simple(Vq, 100)) continue;
      return { v: { f, g, a, b, ask, wk, res: tq(Vq) }, ans: num(Vq) };
    }
    throw new Error("volumeRotate");
  });
plan("m.h3.area", "ca2_volumeRotate", [1, 2, 3], 7, 4, ["12미적Ⅱ-03-06"], "disk-washer-method", "calc");

// ---- 34. exponential / trigonometric definite integrals
add("ca2_integralBasic",
  ["$I=\\int_{{lo}}^{{hi}}\\left({fx}\\right)dx$ 일 때, ${ask}$ 의 값을 구하세요. " + FR,
    ["$\\int e^{x}dx=e^{x}$, $\\int\\sin x\\,dx=-\\cos x$, $\\int\\cos x\\,dx=\\sin x$, $\\int\\frac{1}{x}dx=\\ln|x|$, $\\int\\frac{1}{\\cos^{2}x}dx=\\tan x$ 를 이용해요.", "$\\int f(kx)\\,dx=\\frac{1}{k}F(kx)$ 임에 주의하고, 위끝과 아래끝의 값을 대입해 빼요."],
    "${wk}$ 이므로 ${ask}$ 의 값은 ${res}$ 입니다."],
  ["Let $I=\\int_{{lo}}^{{hi}}\\left({fx}\\right)dx$. Find ${ask}$. " + EFR,
    ["Use $\\int e^{x}dx=e^{x}$, $\\int\\sin x\\,dx=-\\cos x$, $\\int\\cos x\\,dx=\\sin x$, $\\int\\frac{1}{x}dx=\\ln|x|$, $\\int\\frac{1}{\\cos^{2}x}dx=\\tan x$.", "Remember $\\int f(kx)\\,dx=\\frac{1}{k}F(kx)$; then substitute the upper and lower limits and subtract."],
    "${wk}$, so ${ask}$ equals ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      const kind = lvl === 1 ? r.pick([1, 2, 3, 4]) : lvl === 2 ? r.pick([5, 6, 7]) : r.pick([8, 10, 11]);
      let fx, lo = "0", hi, ask = "I", wk, val;
      const p = r.nonzero(-5, 5), qv = r.nonzero(-5, 5);
      if (kind === 1) { const m = r.int(2, 6); fx = terms([[p, "e^{x}"], [qv, "e^{-x}"]]); hi = `\\ln ${m}`; val = q(p * (m - 1)).add(q(qv * (m - 1), m)); wk = `\\left[${terms([[p, "e^{x}"], [-qv, "e^{-x}"]])}\\right]_{0}^{\\ln ${m}}=${sj(cmul(p, `(${m}-1)`), cmul(qv, `\\left(1-\\frac{1}{${m}}\\right)`))}`; }
      else if (kind === 2) { fx = terms([[p, "\\sin x"], [qv, "\\cos x"]]); hi = "\\frac{\\pi}{2}"; val = q(p + qv); wk = `\\left[${terms([[-p, "\\cos x"], [qv, "\\sin x"]])}\\right]_{0}^{\\frac{\\pi}{2}}=${sj(String(p), String(qv))}`; }
      else if (kind === 3) { const k = r.int(1, 4); fx = `\\frac{${p}}{x}`; lo = "1"; hi = eP(k); val = q(p * k); wk = `\\left[${p}\\ln x\\right]_{1}^{${eP(k)}}=${p}\\times ${k}`; }
      else if (kind === 4) { const k = r.int(2, 3), m = r.int(2, 4); fx = `${cf(p)}e^{${k}x}`; hi = `\\ln ${m}`; val = q(p * (m ** k - 1), k); wk = `\\left[\\frac{${p}}{${k}}e^{${k}x}\\right]_{0}^{\\ln ${m}}=\\frac{${p}}{${k}}(${m ** k}-1)`; }
      else if (kind === 5) { const k = r.int(2, 4); fx = terms([[p, `\\sin ${k}x`], [qv, `\\cos ${k}x`]]); hi = piTex(1, 2 * k); val = q(p + qv, k); wk = `\\left[\\frac{1}{${k}}\\left(${terms([[-p, `\\cos ${k}x`], [qv, `\\sin ${k}x`]])}\\right)\\right]_{0}^{${hi}}=\\frac{${sj(String(p), String(qv))}}{${k}}`; }
      else if (kind === 6) { fx = `\\frac{${p}}{\\cos^{2}x}`; hi = "\\frac{\\pi}{4}"; val = q(p); wk = `\\left[${cf(p)}\\tan x\\right]_{0}^{\\frac{\\pi}{4}}=${p}`; }
      else if (kind === 7) { const a1 = r.int(2, 4), b1 = r.int(a1 + 1, 7); fx = `${cf(p)}e^{x}`; lo = `\\ln ${a1}`; hi = `\\ln ${b1}`; val = q(p * (b1 - a1)); wk = `\\left[${p}e^{x}\\right]_{\\ln ${a1}}^{\\ln ${b1}}=${p}(${b1}-${a1})`; }
      else if (kind === 8) { const k = r.int(1, 3); fx = `${cf(p)}\\sin^{2}${k === 1 ? "" : k}x`; hi = piTex(1, k); ask = "\\frac{I}{\\pi}"; val = q(p, 2 * k); wk = `\\int_{0}^{${hi}}${p}\\cdot\\frac{1-\\cos ${2 * k}x}{2}dx=\\frac{${p}}{2}\\left[x-\\frac{\\sin ${2 * k}x}{${2 * k}}\\right]_{0}^{${hi}}=\\frac{${p}\\pi}{${2 * k}}`; }
      else if (kind === 10) { fx = `(${terms([[p, "\\sin x"], [qv, "\\cos x"]])})^{2}`; hi = "\\pi"; ask = "\\frac{I}{\\pi}"; val = q(p * p + qv * qv, 2); wk = `(${terms([[p, "\\sin x"], [qv, "\\cos x"]])})^{2}=${p * p}\\sin^{2}x${plus(String(2 * p * qv))}\\sin x\\cos x+${qv * qv}\\cos^{2}x,\\ \\int_{0}^{\\pi}=\\frac{${p * p}\\pi}{2}+0+\\frac{${qv * qv}\\pi}{2}`; }
      else { const k = r.int(1, 3); fx = `${cf(p)}\\sin ${ax(k)}\\cos ${ax(k)}`; hi = piTex(1, 2 * k); val = q(p, 2 * k); wk = `${cf(p)}\\sin ${ax(k)}\\cos ${ax(k)}=${sfc(p, 2)}\\sin ${2 * k}x,\\ \\left[${sfc(-p, 4 * k)}\\cos ${2 * k}x\\right]_{0}^{${hi}}=${sfrac(p, 2 * k)}`; }
      if (!simple(val, 100)) continue;
      return { v: { fx, lo, hi, ask, wk, res: tq(val) }, ans: num(val) };
    }
    throw new Error("integralBasic");
  });
plan("m.h3.int", "ca2_integralBasic", [1, 2, 3], 7, 2, ["12미적Ⅱ-03-01"], "basic-antiderivatives", "calc");

// ---- 35. substitution
add("ca2_substitution",
  ["정적분 $\\int_{{lo}}^{{hi}}{fx}\\,dx$ 의 값을 구하세요. " + FR,
    ["적분 안에서 한 덩어리로 묶이는 식(괄호 안, 근호 안, 지수, 분모 등)을 $u$ 로 놓으면 $du$ 가 나머지 부분과 맞아떨어져요.", "치환하면 적분 구간도 $u$ 의 값으로 바뀐다는 것을 잊지 마세요."],
    "${wk}$ 이므로 값은 ${res}$ 입니다."],
  ["Evaluate $\\int_{{lo}}^{{hi}}{fx}\\,dx$. " + EFR,
    ["Let $u$ be the part of the integrand that is grouped together (inside brackets, a root, an exponent or a denominator); then $du$ matches the remaining factor.", "Remember that the limits of integration change into values of $u$."],
    "${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    const TR3 = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]];
    for (let tries = 0; tries < 500; tries++) {
      const kind = lvl === 1 ? r.pick([1, 3, 5]) : lvl === 2 ? r.pick([2, 4, 6, 8]) : r.pick([7, 9, 10]);
      let fx, lo = "0", hi, wk, val;
      if (kind === 1) { const p = r.int(2, 4), c = r.int(1, 3), bb = r.int(1, 2); fx = `x(x^{2}+${c})^{${p}}`; hi = String(bb); val = q((bb * bb + c) ** (p + 1) - c ** (p + 1), 2 * (p + 1)); wk = `u=x^{2}+${c}:\\ \\frac{1}{2}\\int_{${c}}^{${bb * bb + c}}u^{${p}}du=\\frac{${bb * bb + c}^{${p + 1}}-${c}^{${p + 1}}}{${2 * (p + 1)}}`; }
      else if (kind === 2) { const a = r.int(1, 5); fx = `\\frac{2x}{(x^{2}+${a})^{2}}`; hi = "1"; val = q(1, a).sub(q(1, a + 1)); wk = `u=x^{2}+${a}:\\ \\int_{${a}}^{${a + 1}}u^{-2}du=${frk(1, a)}-\\frac{1}{${a + 1}}`; }
      else if (kind === 3) { const p = r.int(1, 3), k = r.int(1, 3); fx = `\\frac{${p === 1 ? "\\ln x" : `(\\ln x)^{${p}}`}}{x}`; lo = "1"; hi = eP(k); val = q(k ** (p + 1), p + 1); wk = `u=\\ln x:\\ \\int_{0}^{${k}}${p === 1 ? "u" : `u^{${p}}`}du=\\frac{${k}^{${p + 1}}}{${p + 1}}`; }
      else if (kind === 4) {
        if (r.next() < 0.5) { const p = r.int(2, 4); fx = `\\sin^{${p}}x\\cos x`; hi = "\\frac{\\pi}{2}"; val = q(1, p + 1); wk = `u=\\sin x:\\ \\int_{0}^{1}u^{${p}}du=\\frac{1}{${p + 1}}`; }
        else { const a = r.int(1, 3), p = r.int(2, 3); fx = `\\cos x\\,(${a}+\\sin x)^{${p}}`; hi = "\\frac{\\pi}{2}"; val = q((a + 1) ** (p + 1) - a ** (p + 1), p + 1); wk = `u=${a}+\\sin x:\\ \\int_{${a}}^{${a + 1}}u^{${p}}du=\\frac{${a + 1}^{${p + 1}}-${a}^{${p + 1}}}{${p + 1}}`; }
      }
      else if (kind === 5) { const p = r.int(2, 3), a = r.int(1, 3), m = r.int(2, 5); fx = `e^{x}(e^{x}+${a})^{${p}}`; hi = `\\ln ${m}`; val = q((m + a) ** (p + 1) - (1 + a) ** (p + 1), p + 1); wk = `u=e^{x}+${a}:\\ \\int_{${1 + a}}^{${m + a}}u^{${p}}du=\\frac{${m + a}^{${p + 1}}-${1 + a}^{${p + 1}}}{${p + 1}}`; }
      else if (kind === 6) { const a = r.int(1, 4), m = r.int(2, 6); fx = `\\frac{e^{x}}{(e^{x}+${a})^{2}}`; hi = `\\ln ${m}`; val = q(1, 1 + a).sub(q(1, m + a)); wk = `u=e^{x}+${a}:\\ \\int_{${1 + a}}^{${m + a}}u^{-2}du=\\frac{1}{${1 + a}}-\\frac{1}{${m + a}}`; }
      else if (kind === 7) {
        const [bb, s, u] = r.pick(TR3);
        if (r.next() < 0.5) { fx = `\\frac{x}{\\sqrt{x^{2}+${s * s}}}`; hi = String(bb); val = q(u - s); wk = `u=x^{2}+${s * s}:\\ \\frac{1}{2}\\int_{${s * s}}^{${u * u}}u^{-\\frac{1}{2}}du=\\sqrt{${u * u}}-\\sqrt{${s * s}}`; }
        else { fx = `x\\sqrt{x^{2}+${s * s}}`; hi = String(bb); val = q(u ** 3 - s ** 3, 3); wk = `u=x^{2}+${s * s}:\\ \\frac{1}{2}\\int_{${s * s}}^{${u * u}}\\sqrt{u}\\,du=\\frac{1}{3}\\left(${u * u}\\sqrt{${u * u}}-${s * s}\\sqrt{${s * s}}\\right)`; }
      }
      else if (kind === 8) {
        if (r.next() < 0.5) { const p = r.int(1, 3); fx = `\\frac{\\tan^{${p}}x}{\\cos^{2}x}`; hi = "\\frac{\\pi}{4}"; val = q(1, p + 1); wk = `u=\\tan x:\\ \\int_{0}^{1}u^{${p}}du=\\frac{1}{${p + 1}}`; }
        else { const p = r.int(1, 3); fx = `\\sin x\\cos^{${p}}x`; hi = "\\frac{\\pi}{3}"; val = q(1).sub(q(1, 2 ** (p + 1))).div(q(p + 1)); wk = `u=\\cos x:\\ \\int_{\\frac{1}{2}}^{1}u^{${p}}du=\\frac{1}{${p + 1}}\\left(1-\\frac{1}{${2 ** (p + 1)}}\\right)`; }
      }
      else if (kind === 9) { const k = r.int(1, 4); fx = "\\frac{1}{x(1+\\ln x)^{2}}"; lo = "1"; hi = eP(k); val = q(1).sub(q(1, 1 + k)); wk = `u=1+\\ln x:\\ \\int_{1}^{${1 + k}}u^{-2}du=1-\\frac{1}{${1 + k}}`; }
      else { const p = r.int(2, 4); fx = `\\frac{\\sin x}{\\cos^{${p}}x}`; hi = "\\frac{\\pi}{3}"; val = q(2 ** (p - 1) - 1, p - 1); wk = `u=\\cos x:\\ \\int_{\\frac{1}{2}}^{1}u^{-${p}}du=\\frac{1}{${p - 1}}\\left(${2 ** (p - 1)}-1\\right)`; }
      if (!simple(val, 100)) continue;
      return { v: { fx, lo, hi, wk, res: tq(val) }, ans: num(val) };
    }
    throw new Error("substitution");
  });
plan("m.h3.int", "ca2_substitution", [1, 2, 3], 7, 3, ["12미적Ⅱ-03-02"], "u-substitution", "calc");

// ---- 36. substitution, given a known integral of f
add("ca2_subsTransform",
  ["연속함수 $f$ 에 대하여 ${gv}$ 일 때, ${tg}$ 의 값을 구하세요. " + FR,
    ["적분 안의 식을 $u$ 로 놓고, 구간과 $dx$ 를 $u$ 에 대한 것으로 바꿔요.", "바꾼 구간이 주어진 적분의 구간과 같아지는지 확인해요."],
    "${wk}$ 이므로 값은 ${res}$ 입니다."],
  ["For a continuous function $f$, ${gv}$. Find ${tg}$. " + EFR,
    ["Let $u$ be the inner expression and change the limits and $dx$ into the variable $u$.", "Check that the new limits are the same as those of the given integral."],
    "${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      let gv, tg, wk, ans;
      const c = r.nonzero(-9, 9);
      if (lvl === 1) {
        const a = r.pick([2, 3, 4, -1, -2, -3]), b = r.int(-3, 3), al = r.int(-2, 2), be = r.int(al + 1, al + 3);
        const u1 = a * al + b, u2 = a * be + b, lo = Math.min(u1, u2), hi = Math.max(u1, u2);
        gv = `\\int_{${lo}}^{${hi}}f(x)\\,dx=${c}`; tg = `\\int_{${al}}^{${be}}f(${lin(a, b, "x")})\\,dx`;
        ans = q(c, Math.abs(a));
        wk = a > 0
          ? `u=${lin(a, b, "x")},\\ du=${a}\\,dx:\\ \\frac{1}{${a}}\\int_{${lo}}^{${hi}}f(u)\\,du=\\frac{${c}}{${a}}`
          : `u=${lin(a, b, "x")},\\ du=${a}\\,dx,\\ x:${al}\\to ${be}\\Rightarrow u:${u1}\\to ${u2}:\\ \\frac{1}{${a}}\\int_{${u1}}^{${u2}}f(u)\\,du=\\frac{1}{${a}}\\left(-\\int_{${lo}}^{${hi}}f(u)\\,du\\right)=\\frac{${c}}{${-a}}`;
      } else if (lvl === 2) {
        const k = r.pick([2, 4, 6, 3, -2, -4]), al = r.int(0, 2), be = r.int(al + 1, al + 3);
        gv = `\\int_{${al * al}}^{${be * be}}f(x)\\,dx=${c}`; tg = `\\int_{${al}}^{${be}}${k}x\\,f(x^{2})\\,dx`;
        ans = q(k * c, 2); wk = `u=x^{2},\\ du=2x\\,dx:\\ \\frac{${k}}{2}\\int_{${al * al}}^{${be * be}}f(u)\\,du=\\frac{${k}}{2}\\times ${pr(q(c))}`;
      } else {
        const k = r.pick([2, 3, 4, 5, -2, -3]), kind = r.int(1, 3);
        if (kind === 1) { gv = `\\int_{0}^{1}f(x)\\,dx=${c}`; tg = `\\int_{0}^{\\frac{\\pi}{2}}${k}\\cos x\\,f(\\sin x)\\,dx`; wk = `u=\\sin x,\\ du=\\cos x\\,dx:\\ ${k}\\int_{0}^{1}f(u)\\,du=${k}\\times ${pr(q(c))}`; ans = q(k * c); }
        else if (kind === 2) { const n = r.int(1, 4); gv = `\\int_{0}^{${n}}f(x)\\,dx=${c}`; tg = `\\int_{1}^{${eP(n)}}\\frac{${k}f(\\ln x)}{x}\\,dx`; wk = `u=\\ln x,\\ du=\\frac{ dx }{x}:\\ ${k}\\int_{0}^{${n}}f(u)\\,du=${k}\\times ${pr(q(c))}`; ans = q(k * c); }
        else { const m = r.int(2, 5), s = r.int(0, 3); gv = `\\int_{${1 + s}}^{${m + s}}f(x)\\,dx=${c}`; tg = `\\int_{0}^{\\ln ${m}}${k}e^{x}f(e^{x}${s === 0 ? "" : `+${s}`})\\,dx`; wk = `u=e^{x}${s === 0 ? "" : `+${s}`},\\ du=e^{x}dx:\\ ${k}\\int_{${1 + s}}^{${m + s}}f(u)\\,du=${k}\\times ${pr(q(c))}`; ans = q(k * c); }
      }
      if (!simple(ans, 20)) continue;
      return { v: { gv, tg, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("subsTransform");
  });
plan("m.h3.int", "ca2_subsTransform", [1, 2, 3], 7, 4, ["12미적Ⅱ-03-02"], "limits-and-differential-change", "concept");

// ---- 37. integration by parts, abstract form
add("ca2_partsFormula",
  ["함수 $f$ 는 미분가능하고 $f'$ 은 연속이다. ${given}$ 일 때, ${tg}$ 의 값을 구하세요. " + FR,
    ["부분적분법: $\\int_{a}^{b}u\\,v'\\,dx=\\left[uv\\right]_{a}^{b}-\\int_{a}^{b}u'\\,v\\,dx$ 예요.", "$f'(x)$ 를 $v'$ 로, 곱해진 식을 $u$ 로 놓아요."],
    "${wk}$ 이므로 값은 ${res}$ 입니다."],
  ["The function $f$ is differentiable with continuous $f'$, and ${given}$. Find ${tg}$. " + EFR,
    ["Integration by parts: $\\int_{a}^{b}u\\,v'\\,dx=\\left[uv\\right]_{a}^{b}-\\int_{a}^{b}u'\\,v\\,dx$.", "Take $f'(x)$ as $v'$ and the other factor as $u$."],
    "${wk}$, so the value is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      let given, tg, wk, ans;
      const A = r.int(-5, 6), B = r.int(-5, 6), c = r.int(-9, 9);
      if (lvl === 1) {
        const a = r.int(0, 2), b = r.int(a + 1, a + 4);
        given = `f(${a})=${A},\\ f(${b})=${B},\\ \\int_{${a}}^{${b}}f(x)\\,dx=${c}`; tg = `\\int_{${a}}^{${b}}x\\,f'(x)\\,dx`;
        ans = q(b * B - a * A - c); wk = `\\left[xf(x)\\right]_{${a}}^{${b}}-\\int_{${a}}^{${b}}f(x)\\,dx=(${b}\\cdot ${pp(B)}-${a}\\cdot ${pr(q(A))})-${pr(q(c))}`;
      } else if (lvl === 2) {
        const a = r.int(0, 2), b = r.int(a + 1, a + 3), p = r.nonzero(-3, 4), qv = r.int(-4, 4);
        given = `f(${a})=${A},\\ f(${b})=${B},\\ \\int_{${a}}^{${b}}f(x)\\,dx=${c}`; tg = `\\int_{${a}}^{${b}}(${lin(p, qv, "x")})f'(x)\\,dx`;
        ans = q((p * b + qv) * B - (p * a + qv) * A - p * c); wk = `\\left[(${lin(p, qv, "x")})f(x)\\right]_{${a}}^{${b}}${p < 0 ? "+" : "-"}${Math.abs(p) === 1 ? "" : Math.abs(p)}\\int_{${a}}^{${b}}f(x)\\,dx=(${p * b + qv})(${B})-(${p * a + qv})(${A})${p < 0 ? "+" : "-"}${Math.abs(p)}\\cdot ${pr(q(c))}`;
      } else {
        const b = r.int(1, 4);
        given = `f(${b})=${B},\\ \\int_{0}^{${b}}x\\,f(x)\\,dx=${c}`; tg = `\\int_{0}^{${b}}x^{2}f'(x)\\,dx`;
        ans = q(b * b * B - 2 * c); wk = `\\left[x^{2}f(x)\\right]_{0}^{${b}}-2\\int_{0}^{${b}}x\\,f(x)\\,dx=${b * b}\\cdot ${pr(q(B))}-2\\cdot ${pr(q(c))}`;
      }
      return { v: { given, tg, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("partsFormula");
  });
plan("m.h3.int", "ca2_partsFormula", [1, 2, 3], 7, 4, ["12미적Ⅱ-03-03"], "by-parts-with-data", "concept");

// ---- 38. integration by parts, explicit integrals
add("ca2_partsEval",
  ["$I=\\int_{{lo}}^{{hi}}{fx}\\,dx$ 일 때, ${ask}$ 의 값을 구하세요. " + FR,
    ["적분 안의 곱에서 미분하면 간단해지는 쪽을 $u$, 적분하기 쉬운 쪽을 $v'$ 로 놓고 부분적분 $\\int uv'dx=uv-\\int u'v\\,dx$ 를 해요.", "필요하면 부분적분을 한 번 더 해요. 삼각함수의 값은 구간의 끝에서 계산해요."],
    "부분적분을 하면 ${wk}$ 이므로 ${ask}$ 의 값은 ${res}$ 입니다."],
  ["Let $I=\\int_{{lo}}^{{hi}}{fx}\\,dx$. Find ${ask}$. " + EFR,
    ["In the product, let $u$ be the factor that gets simpler when differentiated and $v'$ the one that is easy to integrate; then use $\\int uv'dx=uv-\\int u'v\\,dx$.", "Do it twice if necessary. Evaluate the trigonometric values at the ends of the interval."],
    "Integrating by parts gives ${wk}$, so ${ask}$ equals ${res}$."],
  (r, lvl) => {
    const cp = (p) => (p === 1 ? "" : p === -1 ? "-" : `${p}\\cdot `);
    const fd2 = (top, den) => (den === 1 ? `\\left(${top}\\right)` : `\\frac{${top}}{${den}}`);
    for (let tries = 0; tries < 500; tries++) {
      const kind = lvl === 1 ? r.pick([1, 1, 5]) : lvl === 2 ? 3 : r.pick([4, 2, 2]);
      let fx, lo = "0", hi, ask = "I", wk, val;
      const s = r.nonzero(-3, 3), t = r.nonzero(-5, 5), p = r.nonzero(-4, 4);
      if (kind === 1 || kind === 2) {
        const b = r.int(1, 3), neg = r.next() < 0.5;
        hi = String(b);
        const quad = kind === 2;
        // Q has the zero x = b, P = Q + Q' (e^x) or Q - Q' (e^-x) so that (P -+ P' + P'') is Q
        const Qc = quad ? [s, t - s * b, -b * t] : [s, -s * b];
        const dQ = quad ? [2 * s, t - s * b] : [s];
        const P = quad ? [Qc[0], Qc[1] + dQ[0], Qc[2] + dQ[1]] : [Qc[0], Qc[1] + dQ[0]];
        const Pm = quad ? [Qc[0], Qc[1] - dQ[0], Qc[2] - dQ[1]] : [Qc[0], Qc[1] - dQ[0]];
        const Qtxt = quad ? `(x-${b})(${lin(s, t, "x")})` : `${cf(s)}(x-${b})`;
        const Q0 = quad ? -b * t : -s * b;
        if (!neg) {
          fx = `(${poly(P, "x")})e^{x}`;
          const P1 = poly(quad ? [2 * P[0], P[1]] : [P[0]], "x");
          wk = quad
            ? `\\int Pe^{x}dx=\\left(P-P'+P''\\right)e^{x}\\ (P=${poly(P, "x")}):\\ \\left[\\left(${poly(P, "x")}-(${P1})${plus(String(2 * P[0]))}\\right)e^{x}\\right]_{0}^{${b}}=\\left[(${Qtxt})e^{x}\\right]_{0}^{${b}}=0-(${Q0})`
            : `\\int Pe^{x}dx=\\left(P-P'\\right)e^{x}\\ (P=${poly(P, "x")}):\\ \\left[\\left(${poly(P, "x")}-(${P1})\\right)e^{x}\\right]_{0}^{${b}}=\\left[(${Qtxt})e^{x}\\right]_{0}^{${b}}=0-(${Q0})`;
          val = q(-Q0);
        } else {
          fx = `(${poly(Pm, "x")})e^{-x}`;
          const P1 = poly(quad ? [2 * Pm[0], Pm[1]] : [Pm[0]], "x");
          wk = quad
            ? `\\int Pe^{-x}dx=-\\left(P+P'+P''\\right)e^{-x}\\ (P=${poly(Pm, "x")}):\\ \\left[-\\left(${poly(Pm, "x")}+(${P1})${plus(String(2 * Pm[0]))}\\right)e^{-x}\\right]_{0}^{${b}}=\\left[-(${Qtxt})e^{-x}\\right]_{0}^{${b}}=0+(${Q0})`
            : `\\int Pe^{-x}dx=-\\left(P+P'\\right)e^{-x}\\ (P=${poly(Pm, "x")}):\\ \\left[-\\left(${poly(Pm, "x")}+(${P1})\\right)e^{-x}\\right]_{0}^{${b}}=\\left[-(${Qtxt})e^{-x}\\right]_{0}^{${b}}=0+(${Q0})`;
          val = q(Q0);
        }
      }
      else if (kind === 3) {
        const k = r.int(1, 4), m = r.int(1, 4); const bb = piTex(m, k); const sgn = m % 2 === 0 ? 1 : -1; // cos(m pi)
        const k2 = k * k;
        if (r.next() < 0.5) {
          fx = `${cf(p)}x\\sin ${ax(k)}`; hi = bb; ask = "\\frac{I}{\\pi}"; val = q(-p * sgn * m, k2);
          wk = `${cp(p)}\\left[-${fd(`x\\cos ${ax(k)}`, k)}+${fd(`\\sin ${ax(k)}`, k2)}\\right]_{0}^{${bb}}=${cp(p)}\\left(-${fd(`${bb}\\cdot ${pp(sgn)}`, k)}\\right)=${tq(val)}\\pi`;
        } else {
          fx = `${cf(p)}x\\cos ${ax(k)}`; hi = bb; val = q(p * (sgn - 1), k2);
          wk = `${cp(p)}\\left[${fd(`x\\sin ${ax(k)}`, k)}+${fd(`\\cos ${ax(k)}`, k2)}\\right]_{0}^{${bb}}=${cp(p)}${fd2(`(${sgn})-1`, k2)}`;
        }
      }
      else if (kind === 4) { const k = r.int(1, 3), m = r.int(1, 3); hi = piTex(m, k); const sgn = m % 2 === 0 ? 1 : -1; fx = `${cf(p)}x^{2}\\cos ${ax(k)}`; ask = "\\frac{I}{\\pi}"; val = q(2 * m * sgn * p, k ** 3); wk = `${cp(p)}\\left[${fd(`x^{2}\\sin ${ax(k)}`, k)}+${fd(`2x\\cos ${ax(k)}`, k * k)}-${fd(`2\\sin ${ax(k)}`, k ** 3)}\\right]_{0}^{${hi}}=${cp(p)}${fd(`2\\cdot ${hi}\\cdot ${pp(sgn)}`, k * k)}=${tq(val)}\\pi`; }
      else { fx = `${cf(p)}\\ln x`; lo = "1"; hi = "e"; val = q(p); wk = `\\int ${p}\\ln x\\,dx=${p}(x\\ln x-x),\\ \\left[${p}(x\\ln x-x)\\right]_{1}^{e}=${p}\\cdot (0-(-1))`; }
      if (!simple(val, 100)) continue;
      return { v: { fx, lo, hi, ask, wk, res: tq(val) }, ans: num(val) };
    }
    throw new Error("partsEval");
  });
plan("m.h3.int", "ca2_partsEval", [1, 2, 3], 7, 4, ["12미적Ⅱ-03-03"], "by-parts-explicit", "calc");

// ---- 39. velocity -> distance
add("ca2_velocityIntegral",
  ["수직선 위를 움직이는 점 P 의 시각 $t$ ($t\\ge0$)에서의 속도가 $v(t)={vt}$ 이다. 시각 $t=0$ 부터 $t={T}$ 까지 점 P 가 움직인 거리를 구하세요. " + FR,
    ["움직인 거리는 속력 $|v(t)|$ 의 적분 $\\int_{0}^{T}|v(t)|\\,dt$ 예요.", "속도의 부호가 바뀌는 시각을 찾아 구간을 나누고, 각 구간에서 $|v(t)|$ 의 부호를 정해 적분해요."],
    "${wk}$ 이므로 움직인 거리는 ${res}$ 입니다."],
  ["A point P moves on a number line and its velocity at time $t$ ($t\\ge0$) is $v(t)={vt}$. Find the distance travelled from $t=0$ to $t={T}$. " + EFR,
    ["The distance travelled is $\\int_{0}^{T}|v(t)|\\,dt$.", "Find where the velocity changes sign, split the interval there and integrate $|v|$ piece by piece."],
    "${wk}$, so the distance travelled is ${res}$."],
  (r, lvl) => {
    for (let tries = 0; tries < 500; tries++) {
      let vt, T, wk, ans;
      if (lvl === 1) {
        const r1 = r.int(1, 3), r2 = r.int(r1 + 1, 5), Tn = r.int(r2 + 1, r2 + 3), c = r.pick([1, 2, 3, 6, -1, -2, -3, -6]);
        vt = `${cf(c)}(t-${r1})(t-${r2})`; T = String(Tn);
        const F = (t) => q(c).mul(q(t * t * t, 3).sub(q((r1 + r2) * t * t, 2)).add(q(r1 * r2 * t)));
        const d1 = F(r1).sub(F(0)), d2 = F(r2).sub(F(r1)), d3 = F(Tn).sub(F(r2));
        const ab = (z) => (z.p < 0n ? q(-z.p, z.q) : z);
        ans = ab(d1).add(ab(d2)).add(ab(d3));
        wk = `F(t)=\\int v\\,dt=${termsQ([[q(c, 3), "t^{3}"], [q(-c * (r1 + r2), 2), "t^{2}"], [q(c * r1 * r2), "t"]])},\\ v=0:\\ t=${r1},${r2};\\ |F(${r1})-F(0)|+|F(${r2})-F(${r1})|+|F(${Tn})-F(${r2})|=${tq(ab(d1))}+${tq(ab(d2))}+${tq(ab(d3))}`;
      } else if (lvl === 2) {
        const k = r.int(1, 3), j = r.int(2, 7), a = r.nonzero(-6, 6), useCos = r.next() < 0.5;
        vt = `${cf(a)}${useCos ? "\\cos" : "\\sin"} ${ax(k, "t")}`; T = piTex(j, 2 * k);
        ans = q(Math.abs(a) * j, k);
        wk = `\\int_{\\frac{m\\pi}{${2 * k}}}^{\\frac{(m+1)\\pi}{${2 * k}}}|v|\\,dt=\\frac{${Math.abs(a)}}{${k}}\\ (m=0,1,\\ldots,${j - 1})\\ \\Rightarrow\\ ${j}\\times\\frac{${Math.abs(a)}}{${k}}`.replace(/\\frac\{(\d+)\}\{1\}/g, "$1");
      } else {
        const k = r.int(1, 3), c = r.nonzero(-6, 6), plusSign = r.next() < 0.5;
        const sk = `\\sin ${ax(k, "t")}`, s2k = `\\sin ${2 * k}t`;
        vt = c === 1 ? `${sk}${plusSign ? "+" : "-"}${s2k}` : `${cf(c)}(${sk}${plusSign ? "+" : "-"}${s2k})`;
        T = piTex(1, k);
        ans = q(5 * Math.abs(c), 2 * k);
        wk = `v=${cf(c)}${sk}(1${plusSign ? "+" : "-"}2\\cos ${ax(k, "t")}),\\ v=0\\ \\Rightarrow\\ t=${plusSign ? piTex(2, 3 * k) : piTex(1, 3 * k)},\\ \\int_{0}^{T}|v|\\,dt=${frk(Math.abs(c), k) === "1" ? "" : frk(Math.abs(c), k)}\\left(${plusSign ? "\\frac{9}{4}+\\frac{1}{4}" : "\\frac{1}{4}+\\frac{9}{4}"}\\right)`;
      }
      if (!simple(ans, 200)) continue;
      return { v: { vt, T, wk, res: tq(ans) }, ans: num(ans) };
    }
    throw new Error("velocityIntegral");
  });
plan("m.h3.area", "ca2_velocityIntegral", [1, 2, 3], 7, 4, ["12미적Ⅱ-03-07"], "velocity-to-distance", "application");

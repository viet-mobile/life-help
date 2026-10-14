// Generators of the parametric math question bank. Each generator draws the numbers of ONE question for a template of
// scripts/learn/topics/templates.mjs (the template ids, variable names and the answer's meaning are the template's) and returns
// { v: {variables}, ans, tol? }. Everything is deterministic (seeded per set) and language-neutral; strings in `v` are math or digits only.
// Independent re-computation of every answer lives in tests/learn/bank.test.ts (a generator is never trusted to check itself).

/** mulberry32 seeded from a string */
export function rngOf(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = (h ^= h >>> 16) >>> 0;
  const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(next() * arr.length)];
  const nonzero = (lo, hi) => { let x = 0; while (x === 0) x = int(lo, hi); return x; };
  return { next, int, pick, nonzero };
}
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const r2 = (x) => Math.round(x * 100) / 100;
/** "ax+b" with the usual sign / unit-coefficient conventions */
const lin = (a, b) => `${a === 1 ? "" : a === -1 ? "-" : a}x${b > 0 ? `+${b}` : b < 0 ? `${b}` : ""}`;
/** coefficient before x: 1 -> "", -1 -> "-" */
const coef = (k) => (k === 1 ? "" : k === -1 ? "-" : String(k));
const sgn = (n) => (n < 0 ? `${n}` : `+${n}`);
const list = (xs) => xs.join(", ");
const digits = (n) => String(n).padStart(3, "0").split("").map(Number);

export const GEN = {
  // ---- E3 ari1: three-digit addition / subtraction by the amount of regrouping
  addThree: (r, lvl) => {
    for (;;) {
      const a = r.int(100, 899), b = r.int(100, 899);
      const [a2, a1, a0] = digits(a), [b2, b1, b0] = digits(b);
      const carries = (a0 + b0 >= 10) + (a1 + b1 + (a0 + b0 >= 10 ? 1 : 0) >= 10);
      if (lvl === 1 && carries === 0 && a + b < 1000) return { v: { a, b }, ans: a + b };
      if (lvl === 2 && carries === 1 && a + b < 1000) return { v: { a, b }, ans: a + b };
      if (lvl === 3 && carries === 2) return { v: { a, b }, ans: a + b };
    }
  },
  subThree: (r, lvl) => {
    for (;;) {
      const a = r.int(200, 999), b = r.int(100, a - 1);
      const [, a1, a0] = digits(a), [, b1, b0] = digits(b);
      const borrow0 = a0 < b0, borrow1 = a1 - (borrow0 ? 1 : 0) < b1;
      const k = borrow0 + borrow1;
      if ((lvl === 1 && k === 0) || (lvl === 2 && k === 1) || (lvl === 3 && k === 2)) return { v: { a, b }, ans: a - b };
    }
  },
  // ---- E6 ari1: mixed calculation, five forms of growing depth
  mixedCalc: (r, lvl) => {
    if (lvl === 1) { const a = r.int(2, 30), b = r.int(2, 9), c = r.int(2, 9); return { v: { expr: `${a} + ${b} × ${c}`, steps: `${b}×${c}=${b * c}, ${a}+${b * c}=${a + b * c}` }, ans: a + b * c }; }
    if (lvl === 2) { const b = r.int(2, 9), c = r.int(2, 9), a = r.int(b * c + 1, b * c + 40); return { v: { expr: `${a} - ${b} × ${c}`, steps: `${b}×${c}=${b * c}, ${a}-${b * c}=${a - b * c}` }, ans: a - b * c }; }
    if (lvl === 3) { const a = r.int(2, 20), b = r.int(2, 20), c = r.int(2, 9); return { v: { expr: `(${a} + ${b}) × ${c}`, steps: `${a}+${b}=${a + b}, ${a + b}×${c}=${(a + b) * c}` }, ans: (a + b) * c }; }
    if (lvl === 4) { const d = r.int(2, 9), q = r.int(2, 9), a = r.int(2, 9), b = r.int(2, 9); const p = a * b; if (p <= q) return GEN.mixedCalc(r, lvl); return { v: { expr: `${a} × ${b} - ${d * q} ÷ ${d}`, steps: `${a}×${b}=${p}, ${d * q}÷${d}=${q}, ${p}-${q}=${p - q}` }, ans: p - q }; }
    const a = r.int(10, 40), b = r.int(2, 9), c = r.int(2, 9), e = r.int(2, 9), d = e * r.int(2, 9);
    if (a <= b) return GEN.mixedCalc(r, lvl);
    const s = (a - b) * c, t = d / e;
    return { v: { expr: `(${a} - ${b}) × ${c} + ${d} ÷ ${e}`, steps: `${a}-${b}=${a - b}, ${a - b}×${c}=${s}, ${d}÷${e}=${t}, ${s}+${t}=${s + t}` }, ans: s + t };
  },
  // ---- E6 ari2: rounding to a place (the mode word is the "#rd_*" text of the language)
  roundTo: (r, lvl) => {
    const mode = lvl === 1 ? "up" : lvl === 2 ? "down" : "half";
    const u = r.pick([10, 100, 1000]);
    for (;;) {
      const n = r.int(1000, 99999);
      if (n % u === 0) continue;
      if (mode === "half" && (n % u) * 2 === u) continue;
      const ans = mode === "up" ? Math.ceil(n / u) * u : mode === "down" ? Math.floor(n / u) * u : Math.round(n / u) * u;
      return { v: { n, u, mode: `#rd_${mode}` }, ans };
    }
  },
  // ---- E5 dat1: mean with an integer result
  mean: (r, lvl) => {
    const k = lvl === 1 ? r.int(3, 4) : r.int(5, 7), m = r.int(4, 40);
    for (;;) {
      const xs = Array.from({ length: k }, () => r.int(Math.max(1, m - 12), m + 12));
      const sum = xs.reduce((s, x) => s + x, 0);
      if (sum % k === 0) return { v: { list: list(xs), sum: xs.join("+"), n: k }, ans: sum / k };
    }
  },
  // ---- M1 neg1: integers
  intAdd: (r, lvl) => { const R = lvl === 1 ? 9 : 25; const a = r.nonzero(-R, R), b = r.nonzero(-R, R); return { v: { a, b }, ans: a + b }; },
  intSub: (r, lvl) => { const R = lvl === 1 ? 9 : 25; const a = r.nonzero(-R, R), b = r.nonzero(-R, R); return { v: { a, b, nb: -b }, ans: a - b }; },
  intMul: (r, lvl) => { const R = lvl === 1 ? 9 : 15; const a = r.nonzero(-R, R), b = r.nonzero(-R, R); return { v: { a, b }, ans: a * b }; },
  intDiv: (r, lvl) => { const R = lvl === 1 ? 9 : 15; const b = r.nonzero(-9, 9), q = r.nonzero(-R, R); return { v: { a: b * q, b }, ans: q }; },
  // ---- M1 fac1
  gcd: (r, lvl) => { for (;;) { const g = lvl === 1 ? r.int(2, 6) : r.int(3, 12), x = r.int(2, 9), y = r.int(2, 9); if (x !== y && gcd(x, y) === 1) return { v: { a: g * x, b: g * y }, ans: g }; } },
  lcm: (r, lvl) => { for (;;) { const g = lvl === 1 ? r.int(1, 4) : r.int(2, 6), x = r.int(2, 9), y = r.int(2, 9); if (x !== y && gcd(x, y) === 1 && g * x * y <= 400) return { v: { a: g * x, b: g * y }, ans: g * x * y }; } },
  divisorCount: (r) => { const n = r.int(8, 72); const ds = []; for (let d = 1; d <= n; d++) if (n % d === 0) ds.push(d); return { v: { n, list: list(ds) }, ans: ds.length }; },
  factorExp: (r) => { const a = r.int(1, 5), b = r.int(1, 4); return { v: { n: 2 ** a * 3 ** b, a, b }, ans: a + b }; },
  // ---- M1 sta1
  median: (r, lvl) => {
    const k = lvl === 1 ? r.pick([5, 7]) : r.pick([4, 6, 8]);
    const xs = Array.from({ length: k }, () => r.int(1, 40));
    const s = [...xs].sort((x, y) => x - y);
    const ans = k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2;
    return { v: { list: list(xs), sorted: list(s) }, ans };
  },
  mode: (r) => { for (;;) { const k = r.int(6, 9); const xs = Array.from({ length: k }, () => r.int(1, 12)); const cnt = new Map(); xs.forEach((x) => cnt.set(x, (cnt.get(x) ?? 0) + 1)); const top = Math.max(...cnt.values()); const modes = [...cnt].filter(([, c]) => c === top); if (modes.length === 1 && top >= 2) return { v: { list: list(xs) }, ans: modes[0][0] }; } },
  dataRange: (r) => { const k = r.int(4, 8); const xs = Array.from({ length: k }, () => r.int(2, 60)); const max = Math.max(...xs), min = Math.min(...xs); if (max === min) return GEN.dataRange(r); return { v: { list: list(xs), max, min }, ans: max - min }; },
  relFreq: (r) => { const t = r.pick([20, 25, 40, 50, 80, 100, 200]); const f = r.int(1, t - 1); const ans = Math.round((f / t) * 10000) / 10000; if (String(ans).length > 6) return GEN.relFreq(r); return { v: { t, f }, ans, tol: 0.001 }; },
  // ---- M2 lfn1
  slopeOf: (r) => { const a = r.nonzero(-9, 9), b = r.nonzero(-9, 9); return { v: { a, b }, ans: a }; },
  yInt: (r) => { const a = r.nonzero(-9, 9), b = r.nonzero(-12, 12); return { v: { a, b }, ans: b }; },
  xInt: (r) => { const a = r.nonzero(-6, 6), x = r.nonzero(-9, 9); return { v: { a, b: -a * x }, ans: x }; },
  funcValue: (r) => { const a = r.nonzero(-6, 6), b = r.nonzero(-9, 9), c = r.int(-6, 6); return { v: { a, b, c }, ans: a * c + b }; },
  crossX: (r) => { for (;;) { const x = r.int(-6, 6), a1 = r.nonzero(-5, 5), a2 = r.nonzero(-5, 5), b1 = r.int(-9, 9); if (a1 === a2) continue; const b2 = a1 * x + b1 - a2 * x; if (Math.abs(b2) > 12) continue; return { v: { a1, b1, a2, b2 }, ans: x }; } },
  // ---- M3 sta1: variance / standard deviation with exact results
  variance: (r) => {
    for (;;) {
      const k = r.pick([4, 5, 6]), m = r.int(3, 12);
      const xs = Array.from({ length: k }, () => r.int(Math.max(1, m - 5), m + 5));
      const sum = xs.reduce((s, x) => s + x, 0);
      if (sum % k) continue;
      const mean = sum / k, sq = xs.reduce((s, x) => s + (x - mean) ** 2, 0);
      if (sq % k || sq === 0) continue;
      return { v: { list: list(xs), mean, sq, n: k }, ans: sq / k };
    }
  },
  stdev: (r) => {
    for (;;) {
      const k = r.pick([4, 5, 6]), m = r.int(3, 12);
      const xs = Array.from({ length: k }, () => r.int(Math.max(1, m - 5), m + 5));
      const sum = xs.reduce((s, x) => s + x, 0);
      if (sum % k) continue;
      const mean = sum / k, sq = xs.reduce((s, x) => s + (x - mean) ** 2, 0);
      if (sq % k || sq === 0) continue;
      const vr = sq / k, sd = Math.sqrt(vr);
      if (Number.isInteger(sd)) return { v: { list: list(xs), mean, var: vr }, ans: sd };
    }
  },
  // ---- H2 seq1: sigma sums
  sigmaSum: (r, lvl) => {
    if (lvl === 1) { const n = r.int(3, 20); return { v: { expr: `$\\sum_{k=1}^{${n}} k$`, steps: `${n}×${n + 1}÷2` }, ans: (n * (n + 1)) / 2 }; }
    if (lvl === 2) { const n = r.int(3, 6), p = r.nonzero(-4, 5), q = r.int(-5, 6); const terms = Array.from({ length: n }, (_, i) => p * (i + 1) + q); return { v: { expr: `$\\sum_{k=1}^{${n}} (${lin(p, q).replace("x", "k")})$`, steps: terms.join("+").replace(/\+-/g, "-") }, ans: terms.reduce((s, x) => s + x, 0) }; }
    if (lvl === 3) { const n = r.int(3, 8), c = r.int(2, 9); return { v: { expr: `$\\sum_{k=1}^{${n}} ${c}$`, steps: `${c}×${n}` }, ans: c * n }; }
    const n = r.int(3, 12); return { v: { expr: `$\\sum_{k=1}^{${n}} k^2$`, steps: Array.from({ length: n }, (_, i) => (i + 1) ** 2).join("+") }, ans: (n * (n + 1) * (2 * n + 1)) / 6 };
  },
  // ---- H3 pro1: probabilities in hundredths (integers inside, so no float drift)
  probAdd: (r) => { for (;;) { const a = r.int(2, 18) * 5, b = r.int(2, 18) * 5, ab = r.int(1, Math.min(a, b) / 5) * 5; if (a + b - ab > 100 || ab === Math.min(a, b) && r.next() < 0.5) continue; return { v: { pa: a / 100, pb: b / 100, pab: ab / 100 }, ans: (a + b - ab) / 100, tol: 0.001 }; } },
  probComplement: (r) => { const a = r.int(1, 19) * 5; return { v: { pa: a / 100 }, ans: (100 - a) / 100, tol: 0.001 }; },
  // ---- H1 mat1
  matEntry: (r, lvl) => {
    const M = () => [[r.int(-3, 6), r.int(-3, 6)], [r.int(-3, 6), r.int(-3, 6)]];
    const A = M(), B = M();
    const tex = (X) => `\\begin{pmatrix}${X[0][0]}&${X[0][1]}\\\\${X[1][0]}&${X[1][1]}\\end{pmatrix}`;
    const mats = `$A=${tex(A)},\\ B=${tex(B)}$`;
    const row = r.int(1, 2), col = r.int(1, 2), i = row - 1, j = col - 1;
    const kind = lvl === 1 ? r.pick(["add", "sub"]) : lvl === 2 ? r.pick(["scalar", "lin"]) : "mul";
    if (kind === "add") return { v: { mats, expr: "$A+B$", r: row, c: col, steps: `$${A[i][j]}${sgn(B[i][j])}$` }, ans: A[i][j] + B[i][j] };
    if (kind === "sub") return { v: { mats, expr: "$A-B$", r: row, c: col, steps: `$${A[i][j]}-(${B[i][j]})$` }, ans: A[i][j] - B[i][j] };
    if (kind === "scalar") { const k = r.int(2, 4); return { v: { mats, expr: `$${k}A$`, r: row, c: col, steps: `$${k}\\times(${A[i][j]})$` }, ans: k * A[i][j] }; }
    if (kind === "lin") { const k = r.int(2, 4); return { v: { mats, expr: `$${k}A-B$`, r: row, c: col, steps: `$${k}\\times(${A[i][j]})-(${B[i][j]})$` }, ans: k * A[i][j] - B[i][j] }; }
    const ans = A[i][0] * B[0][j] + A[i][1] * B[1][j];
    return { v: { mats, expr: "$AB$", r: row, c: col, steps: `$(${A[i][0]})\\times(${B[0][j]})+(${A[i][1]})\\times(${B[1][j]})$` }, ans };
  },
  // ---- H1 set1
  setCount: (r) => { const nab = r.int(1, 8), na = nab + r.int(1, 12), nb = nab + r.int(1, 12); return { v: { na, nb, nab }, ans: na + nb - nab }; },
  subsetCount: (r) => { const n = r.int(2, 9); return { v: { n, prod: `$2^${n}$` }, ans: 2 ** n }; },
  // ---- H1 fnc1
  composite: (r, lvl) => {
    const a = r.nonzero(-4, 4), b = r.int(-6, 6), x = r.int(-3, 4);
    if (lvl === 1) { const c = r.nonzero(-4, 4), d = r.int(-6, 6); const fx = a * x + b, ans = c * fx + d; return { v: { f: lin(a, b), g: lin(c, d), comp: `$(g\\circ f)(${x})$`, steps: `$f(${x})=${fx},\\ g(${fx})=${ans}$` }, ans }; }
    const c = r.int(1, 3), d = r.int(-5, 5); // g(x) = c x^2 + d
    const fx = a * x + b, ans = c * fx * fx + d;
    const gs = `${c === 1 ? "" : c}x^2${d > 0 ? `+${d}` : d < 0 ? `${d}` : ""}`;
    return { v: { f: lin(a, b), g: gs, comp: `$(g\\circ f)(${x})$`, steps: `$f(${x})=${fx},\\ g(${fx})=${ans}$` }, ans };
  },
  inverseVal: (r) => { const a = r.nonzero(-5, 5), b = r.int(-9, 9), x = r.int(-6, 8), y = a * x + b; return { v: { f: lin(a, b), y, steps: `$${lin(a, b)}=${y}$, $x=${x}$` }, ans: x }; },
  // ---- H1 pol1: cubic with three integer roots
  rootMax: (r) => { const rs = distinct(r, 3, -4, 5); return { v: polyOf(rs), ans: Math.max(...rs) }; },
  rootSum: (r) => { const rs = distinct(r, 3, -4, 5); return { v: polyOf(rs), ans: rs.reduce((s, x) => s + x, 0) }; },
  // ---- H3 cal1
  derivVal: (r, lvl) => {
    if (lvl === 1) { const k = r.nonzero(-5, 6); return { v: { f: `e^{${coef(k)}x}`, a: 0, steps: `$f'(x)=${k}e^{${coef(k)}x},\\ f'(0)=${k}$` }, ans: k }; }
    if (lvl === 2) { const k = r.nonzero(-5, 6); return { v: { f: `\\sin ${coef(k)}x`, a: 0, steps: `$f'(x)=${k}\\cos ${coef(k)}x,\\ f'(0)=${k}$` }, ans: k }; }
    if (lvl === 3) { const p = r.nonzero(-3, 4), q = r.int(-3, 3), n = r.int(2, 4), a = r.int(0, 2), u = p * a + q; const ans = n * p * u ** (n - 1); return { v: { f: `(${lin(p, q)})^${n}`, a, steps: `$f'(x)=${n * p}(${lin(p, q)})^${n - 1},\\ f'(${a})=${ans}$` }, ans }; }
    for (;;) { const p = r.int(1, 4), q = r.int(0, 3), a = r.int(0, 3), u = p * a + q; if (u < 1 || u > 8 || (p * 100) % u) continue; const ans = p / u; return { v: { f: `\\ln(${lin(p, q)})`, a, steps: `$f'(x)=\\frac{${p}}{${lin(p, q)}},\\ f'(${a})=\\frac{${p}}{${u}}=${ans}$` }, ans, tol: 0.001 }; }
  },
  // ---- H3 cnt1
  repPerm: (r) => { const n = r.int(2, 6), k = r.int(2, 5); if (n ** k > 5000) return GEN.repPerm(r); return { v: { n, r: k, prod: Array(k).fill(n).join("×") }, ans: n ** k }; },
  permSame: (r) => {
    for (;;) {
      const kinds = r.int(2, 3), letters = "abcd".slice(0, kinds).split("");
      const counts = letters.map(() => r.int(1, 3));
      const total = counts.reduce((s, x) => s + x, 0);
      if (total < 4 || total > 7 || counts.every((c) => c === 1) || counts.filter((c) => c > 1).length === 0) continue;
      const word = letters.map((l, i) => l.repeat(counts[i])).join("");
      const denom = counts.map((c) => `${c}!`).join("×");
      const ans = fact(total) / counts.reduce((p, c) => p * fact(c), 1);
      return { v: { word, calc: `${total}!÷(${denom})=${fact(total)}÷${counts.reduce((p, c) => p * fact(c), 1)}` }, ans };
    }
  },
  repComb: (r) => { const n = r.int(2, 5), k = r.int(2, 6); return { v: { n, r: k, calc: `$_${n}H_${k}=\\,_${n + k - 1}C_${k}$` }, ans: C(n + k - 1, k) }; },
  binomCoef: (r) => { const n = r.int(3, 9), k = r.int(1, n - 1); return { v: { n, k, calc: `$_${n}C_${k}$` }, ans: C(n, k) }; },
  // ---- electives
  percentChange: (r) => { for (;;) { const a = r.pick([20, 25, 40, 50, 80, 100, 120, 200]), pct = r.pick([5, 10, 15, 20, 25, 30, 40, 50]); if ((a * pct) % 100) continue; return { v: { a, b: a + (a * pct) / 100 }, ans: pct }; } },
  simpleInterest: (r) => { const p = r.pick([50000, 100000, 200000, 300000, 500000]), rate = r.pick([2, 3, 4, 5, 6]), n = r.int(1, 5); return { v: { p, r: rate, rr: String(rate / 100), n }, ans: (p * rate * n) / 100 }; },
  taxTotal: (r) => { const p = r.pick([10000, 12000, 15000, 20000, 25000, 30000, 45000]), t = r.pick([5, 8, 10]); return { v: { p, t, tr: String(t / 100) }, ans: p + (p * t) / 100 }; },
};

/** n distinct integers in [lo, hi] */
function distinct(r, n, lo, hi) { const s = new Set(); while (s.size < n) s.add(r.int(lo, hi)); return [...s].sort((a, b) => a - b); }
/** x^3 + ... = 0 from three integer roots, with its factored form */
function polyOf(rs) {
  const [p, q, s] = rs;
  const e1 = p + q + s, e2 = p * q + q * s + p * s, e3 = p * q * s;
  const term = (c, pw) => (c === 0 ? "" : `${c > 0 ? "+" : "-"}${Math.abs(c) === 1 && pw > 0 ? "" : Math.abs(c)}${pw === 0 ? "" : pw === 1 ? "x" : `x^${pw}`}`);
  const eq = `x^3${term(-e1, 2)}${term(e2, 1)}${term(-e3, 0)}`;
  const fac = rs.map((x) => (x === 0 ? "x" : `(x${x > 0 ? `-${x}` : `+${-x}`})`)).join("");
  return { eq: `$${eq}=0$`, fact: `$${fac}=0$`, roots: `$${rs.join(",\\ ")}$` };
}

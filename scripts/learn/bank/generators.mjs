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

  // ======================= second tranche: the rest of the core curriculum (templates: scripts/learn/bank/templates.mjs) =======================
  plus: (r, lvl) => {
    if (lvl === 1) { const a = r.int(1, 9), b = r.int(1, 9); return { v: { a, b }, ans: a + b }; }
    if (lvl === 4) { const a = r.int(100, 899), b = r.int(100, 899); return { v: { a, b }, ans: a + b }; }
    if (lvl === 5) { const a = r.int(1000, 49999), b = r.int(1000, 49999); return { v: { a, b }, ans: a + b }; }
    if (lvl === 6) { const a = r.int(11, 99) / 10, b = r.int(11, 99) / 10; return { v: { a, b }, ans: Math.round((a + b) * 10) / 10 }; }
    for (;;) {
      const a = r.int(10, 89), b = r.int(10, 89), c = a % 10 + b % 10 >= 10;
      if (a + b > 99) continue;
      if ((lvl === 2 && !c) || (lvl === 3 && c)) return { v: { a, b }, ans: a + b };
    }
  },
  minus: (r, lvl) => {
    if (lvl === 1) { const a = r.int(5, 18), b = r.int(1, Math.min(9, a - 1)); return { v: { a, b }, ans: a - b }; }
    if (lvl === 4) { const a = r.int(200, 999), b = r.int(100, a - 1); return { v: { a, b }, ans: a - b }; }
    if (lvl === 5) { const a = r.int(2000, 99999), b = r.int(1000, a - 1); return { v: { a, b }, ans: a - b }; }
    if (lvl === 6) { const a = r.int(21, 99) / 10, b = r.int(11, Math.round(a * 10) - 1) / 10; return { v: { a, b }, ans: Math.round((a - b) * 10) / 10 }; }
    for (;;) {
      const a = r.int(20, 99), b = r.int(10, a - 1), bw = a % 10 < b % 10;
      if ((lvl === 2 && !bw) || (lvl === 3 && bw)) return { v: { a, b }, ans: a - b };
    }
  },
  times: (r, lvl) => {
    if (lvl === 1) { const a = r.int(2, 5), b = r.int(2, 9); return { v: { a, b }, ans: a * b }; }
    if (lvl === 2) { const a = r.int(2, 9), b = r.int(2, 9); return { v: { a, b }, ans: a * b }; }
    if (lvl === 4) { const a = r.int(101, 399), b = r.int(11, 29); return { v: { a, b }, ans: a * b }; }
    const a = r.int(12, 49), b = r.int(11, 19); return { v: { a, b }, ans: a * b };
  },
  divide: (r, lvl) => { if (lvl === 3) { const b = r.int(11, 49), q = r.int(11, 99); return { v: { a: b * q, b }, ans: q }; } const b = r.int(2, 9), q = lvl === 1 ? r.int(2, 9) : r.int(11, 99); return { v: { a: b * q, b }, ans: q }; },
  tensDigit: (r) => { const n = r.int(10, 99); return { v: { n }, ans: Math.floor(n / 10) }; },
  seqNext: (r) => { const s0 = r.int(1, 30), d = r.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 10]); const xs = [0, 1, 2, 3].map((i) => s0 + i * d); if (xs.some((x) => x < 0) || s0 + 4 * d < 0) return GEN.seqNext(r); return { v: { list: xs.join(", "), d: d > 0 ? `+${d}` : `${d}` }, ans: s0 + 4 * d }; },
  kmToM: (r) => { const v = r.int(1, 30); return { v: { v }, ans: v * 1000 }; },
  lToMl: (r) => { const v = r.int(1, 20); return { v: { v }, ans: v * 1000 }; },
  convMCm: (r) => { const v = r.int(2, 9); return { v: { v }, ans: v * 100 }; },
  convKgG: (r) => { const t = r.int(10, 99); const v = r.next() < 0.5 ? t / 10 : Math.floor(t / 10); return { v: { v }, ans: Math.round(v * 1000) }; },
  diameter: (r) => { const x = r.int(1, 40); return { v: { r: x }, ans: x * 2 }; },
  triThird: (r) => { for (;;) { const a = r.int(20, 100), b = r.int(20, 100); if (a + b <= 170) return { v: { a, b }, ans: 180 - a - b }; } },
  bigNum: (r) => { const a = r.int(1, 9), b = r.int(1, 9); return { v: { a, b }, ans: a * 10000 + b * 1000 }; },
  fracAdd: (r) => { for (;;) { const b = r.int(2, 9), d = r.int(2, 9), a = r.int(1, b - 1), c = r.int(1, d - 1); if (b === d) continue; const num = a * d + c * b, den = b * d, g = gcd(num, den); return { v: { a, b, c, d, num: num / g, den: den / g }, ans: Math.round((num / den) * 1e6) / 1e6, tol: 0.001 }; } },
  fracDivInt: (r) => { for (;;) { const b = r.int(2, 9), a = r.int(1, b - 1), c = r.int(2, 9), num = a, den = b * c, g = gcd(num, den); if (gcd(a, b) !== 1) continue; return { v: { a, b, c, num: num / g, den: den / g }, ans: Math.round((num / den) * 1e6) / 1e6, tol: 0.001 }; } },
  decTimes: (r, lvl) => { const a = lvl === 1 ? r.int(2, 99) / 10 : r.int(11, 199) / 100, b = r.int(2, 9); const dp = lvl === 1 ? 1 : 2; return { v: { a, b }, ans: Number((a * b).toFixed(dp)) }; },
  rectArea: (r) => { const w = r.int(2, 20), h = r.int(2, 20); return { v: { w, h }, ans: w * h }; },
  rectPerim: (r) => { const w = r.int(2, 20), h = r.int(2, 20); return { v: { w, h }, ans: (w + h) * 2 }; },
  ratioPct: (r) => { const b = r.pick([2, 4, 5, 10, 20, 25, 50]), a = r.int(1, b - 1); return { v: { a, b }, ans: (a * 100) / b }; },
  propX: (r) => { const p = r.int(1, 8), q = r.int(1, 8), s = r.int(1, 5), t = r.int(1, 5); if (p === q) return GEN.propX(r); return { v: { a: p * s, b: q * s, d: q * t }, ans: p * t }; },
  decPct: (r) => { const n = r.int(5, 99); return { v: { d: n / 100 }, ans: n }; },
  cubeVol: (r) => { const a = r.int(2, 12); return { v: { a }, ans: a ** 3 }; },
  cuboidVol: (r) => { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9); return { v: { a, b, c }, ans: a * b * c }; },
  circum: (r) => { const x = r.int(1, 20); return { v: { r: x }, ans: Math.round(2 * 3.14 * x * 100) / 100, tol: 0.001 }; },
  circleArea: (r) => { const x = r.int(1, 15); return { v: { r: x }, ans: Math.round(3.14 * x * x * 100) / 100, tol: 0.001 }; },
  meanSum: (r) => { const n = r.int(3, 9), m = r.int(4, 40); return { v: { n, m }, ans: n * m }; },
  exprValue: (r) => { const a = r.nonzero(-5, 6), b = r.int(-9, 9), x = r.int(-3, 6); return { v: { x, expr: lin(a, b) }, ans: a * x + b }; },
  solveLin: (r, lvl) => {
    const x = r.nonzero(-9, 12), a = r.int(2, 9), b = r.int(1, 12);
    if (lvl === 1) return r.next() < 0.5 ? { v: { eq: `x+${b}=${x + b}` }, ans: x } : { v: { eq: `x-${b}=${x - b}` }, ans: x };
    return r.next() < 0.5 ? { v: { eq: `${a}x+${b}=${a * x + b}` }, ans: x } : { v: { eq: `${a}x-${b}=${a * x - b}` }, ans: x };
  },
  expMul: (r) => { const a = r.int(2, 9), b = r.int(2, 9); return { v: { a, b }, ans: a + b }; },
  expPow: (r) => { const a = r.int(2, 6), b = r.int(2, 6); return { v: { a, b }, ans: a * b }; },
  ineqMax: (r) => { const a = r.int(1, 9), b = r.int(a + 2, a + 15); return { v: { a, b, bound: b - a }, ans: b - a - 1 }; },
  slope2: (r) => { const m = r.nonzero(-5, 5), dx = r.int(1, 4), x1 = r.int(-4, 4), y1 = r.int(-6, 6); return { v: { x1, y1, x2: x1 + dx, y2: y1 + m * dx }, ans: m }; },
  coinCases: (r) => { const n = r.int(2, 8); return { v: { n }, ans: 2 ** n }; },
  isoApex: (r) => { const b = r.int(20, 80); return { v: { b }, ans: 180 - 2 * b }; },
  hypot: (r) => { const [a, b, c] = r.pick(TRIPLES); const k = r.int(1, 4); const [x, y] = r.next() < 0.5 ? [a * k, b * k] : [b * k, a * k]; return { v: { a: x, b: y, sq: (c * k) ** 2 }, ans: c * k }; },
  sqrtVal: (r) => { const k = r.int(2, 25); return { v: { n: k * k }, ans: k }; },
  expandPQ: (r) => { const a = r.nonzero(-9, 9), b = r.nonzero(-9, 9); return { v: { fa: `x${sgn(a)}`, fb: `x${sgn(b)}`, p: a + b, q: a * b }, ans: a + b + a * b }; },
  quadRoot: (r) => { for (;;) { const r1 = r.int(-8, 8), r2 = r.int(-8, 8); if (r1 === r2 || r1 === 0 || r2 === 0) continue; const eq = `x^2${r1 + r2 === 0 ? "" : `${-(r1 + r2) === 1 ? "+x" : -(r1 + r2) === -1 ? "-x" : `${sgn(-(r1 + r2))}x`}`}${sgn(r1 * r2)}=0`; const f = (x) => `(x${x > 0 ? `-${x}` : `+${-x}`})`; return { v: { eq, fact: `${f(r1)}${f(r2)}=0`, roots: `${r1}, ${r2}` }, ans: Math.max(r1, r2) }; } },
  vertexSum: (r) => { const a = r.pick([1, 2, 3, -1, -2]), p = r.int(-6, 6), q = r.int(-9, 9); const sq = `(x${p > 0 ? `-${p}` : p < 0 ? `+${-p}` : ""})`.replace("(x)", "x"); const lead = a === 1 ? "" : a === -1 ? "-" : String(a); return { v: { expr: `${lead}${sq}^2${q > 0 ? `+${q}` : q < 0 ? `${q}` : ""}`, p, q }, ans: p + q }; },
  remainder: (r) => { const deg = r.pick([2, 3]); const cs = Array.from({ length: deg + 1 }, (_, i) => (i === 0 ? r.nonzero(1, 3) : r.int(-6, 6))); const a = r.nonzero(-3, 3); const val = cs.reduce((acc, c) => acc * a + c, 0); return { v: { poly: polyStr(cs), div: `x${a > 0 ? `-${a}` : `+${-a}`}`, a }, ans: val }; },
  complexSum: (r) => { const a = r.int(-6, 9), c = r.int(-6, 9), b = r.nonzero(-6, 6), d = r.nonzero(-6, 6); const im = (n) => (n === 1 ? "i" : n === -1 ? "-i" : `${n}i`); const part = (re, n) => `(${re}${n > 0 ? "+" : ""}${im(n)})`; return { v: { expr: `${part(a, b)}+${part(c, d)}`, re: a + c, im: b + d }, ans: a + c + b + d }; },
  permNP: (r) => { const n = r.int(4, 9), k = r.int(2, 3); const seq = Array.from({ length: k }, (_, i) => n - i); return { v: { n, r: k, calc: seq.join("×") }, ans: seq.reduce((p, x) => p * x, 1) }; },
  combNC: (r) => { const n = r.int(4, 10), k = r.int(2, 3); const seq = Array.from({ length: k }, (_, i) => n - i); const top = seq.reduce((p, x) => p * x, 1), bottom = fact(k); return { v: { n, r: k, calc: `(${seq.join("×")})÷${bottom}` }, ans: top / bottom }; },
  dist2: (r) => { const [a, b, c] = r.pick(TRIPLES); const k = r.int(1, 3); const sx = r.next() < 0.5 ? 1 : -1, sy = r.next() < 0.5 ? 1 : -1; const x1 = r.int(-5, 5), y1 = r.int(-5, 5); return { v: { x1, y1, x2: x1 + sx * a * k, y2: y1 + sy * b * k, dx: a * k, dy: b * k }, ans: c * k }; },
  circleR: (r) => { const a = r.int(-5, 5), b = r.int(-5, 5), k = r.int(2, 12); const f = (ch, n) => (n === 0 ? ch : `${ch}${n > 0 ? `-${n}` : `+${-n}`}`); return { v: { fx: f("x", a), fy: f("y", b), r2: k * k }, ans: k }; },
  ineqCount: (r) => { for (;;) { const r1 = r.int(-6, 4), r2 = r.int(r1 + 2, r1 + 9); if (r1 === 0 || r2 === 0) continue; const f = (x) => `(x${x > 0 ? `-${x}` : `+${-x}`})`; const b = -(r1 + r2), c = r1 * r2; return { v: { eq: `x^2${b === 0 ? "" : `${b === 1 ? "+x" : b === -1 ? "-x" : `${sgn(b)}x`}`}${c === 0 ? "" : sgn(c)}`, fact: `${f(r1)}${f(r2)}`, r1, r2 }, ans: r2 - r1 - 1 }; } },
  logVal: (r) => { const b = r.pick([2, 3, 4, 5, 10]); const k = r.int(1, b === 10 ? 5 : b === 2 ? 8 : 4); return { v: { b, n: b ** k }, ans: k }; },
  radDeg: (r) => { const d = r.pick([2, 3, 4, 6, 9, 12]), k = r.int(1, 2 * d - 1); if (gcd(k, d) !== 1) return GEN.radDeg(r); return { v: { num: k === 1 ? "\\pi" : `${k}\\pi`, d }, ans: (180 * k) / d }; },
  arithTerm: (r) => { const a = r.int(-5, 20), d = r.nonzero(-4, 8), n = r.int(5, 30); return { v: { a, d, n }, ans: a + (n - 1) * d }; },
  geoTerm: (r) => { const a = r.int(1, 5), q = r.pick([2, 3]), n = r.int(3, 7); return { v: { a, r: q, n }, ans: a * q ** (n - 1) }; },
  limLinear: (r) => { const p = r.nonzero(-5, 6), q = r.int(-9, 9), a = r.int(-4, 6); return { v: { f: lin(p, q), a }, ans: p * a + q }; },
  derivAt: (r) => { const cs = [r.nonzero(1, 4), r.int(-5, 5), r.nonzero(-6, 6), r.int(-9, 9)]; const a = r.int(-3, 4); const d = [3 * cs[0], 2 * cs[1], cs[2]]; const ans = d[0] * a * a + d[1] * a + d[2]; return { v: { poly: polyStr(cs), a, deriv: polyStr(d) }, ans }; },
  defInt: (r) => { const p = 2 * r.nonzero(-3, 4), q = r.int(-6, 6), b = r.int(1, 8); const half = p / 2; const anti = `${half === 1 ? "" : half === -1 ? "-" : half}x^2${q === 0 ? "" : `${q === 1 ? "+x" : q === -1 ? "-x" : `${sgn(q)}x`}`}`; return { v: { b, fx: lin(p, q), anti }, ans: half * b * b + q * b }; },
  areaX2: (r) => { for (;;) { const k = r.int(1, 6), a = r.int(1, 8); if ((k * a ** 3) % 3) continue; return { v: { k, a }, ans: (k * a ** 3) / 3 }; } },
  geoSeries: (r) => {
    const a = r.pick([1, 2, 3, 4, 6, 8, 9, 12]), [pn, qn] = r.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3]]);
    const num = a * qn, den = qn - pn, g = gcd(num, den), n2 = num / g, d2 = den / g;
    const rtex = pn < 0 ? `-\\frac{${-pn}}{${qn}}` : `\\frac{${pn}}{${qn}}`;
    return { v: { a, rtex, res: d2 === 1 ? String(n2) : `\\frac{${n2}}{${d2}}` }, ans: Math.round((num / den) * 1e6) / 1e6, tol: 0.001 };
  },
  binomMean: (r) => { const n = r.pick([10, 20, 30, 40, 50, 100]), p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]); return { v: { n, p }, ans: Math.round(n * p * 1e4) / 1e4 }; },
  vecNorm: (r) => { const [a, b, c] = r.pick(TRIPLES); const k = r.int(1, 3); const [x, y] = r.next() < 0.5 ? [a * k, b * k] : [b * k, a * k]; return { v: { x: r.next() < 0.5 ? x : -x, y: r.next() < 0.5 ? y : -y }, ans: c * k }; },
  focusX: (r) => { const c = r.pick([2, 4, 6, 8, 10, 12, 16, 20, 24]); return { v: { c }, ans: c / 4 }; },
  condProb: (r) => { for (;;) { const pa = r.pick([0.4, 0.5, 0.6, 0.8]), pab = r.int(1, Math.round(pa * 20) - 1) / 20; const ans = pab / pa; if (Math.abs(Math.round(ans * 1000) - ans * 1000) < 1e-9) return { v: { pa, pab }, ans: Math.round(ans * 1000) / 1000, tol: 0.001 }; } },
  // ---- reused templates of the topic kit, for other skills
  chanceFraction: (r) => { const total = r.pick([2, 4, 5, 8, 10, 20]), a = r.int(1, total - 1); return { v: { a, b: total - a, total }, ans: a / total, tol: 0.001 }; },
  pieCount: (r) => { const t = r.pick([100, 200, 300, 400, 500, 600]), p = r.int(1, 19) * 5; return { v: { p, t }, ans: (t * p) / 100 }; },
  directConst: (r) => { const a = r.int(2, 12), x1 = r.int(2, 9); return { v: { x1, y1: a * x1 }, ans: a }; },
  inverseConst: (r) => { const x1 = r.int(2, 12), y1 = r.int(2, 12); return { v: { x1, y1 }, ans: x1 * y1 }; },
  discount: (r) => { const p = r.pick([10000, 20000, 30000, 40000, 50000, 80000]), d = r.pick([5, 10, 15, 20, 25, 30, 40]); return { v: { p, d, dr: String(d / 100) }, ans: p - (p * d) / 100 }; },
  pmAverage: (r) => { for (;;) { const xs = Array.from({ length: 5 }, () => r.int(15, 70)); const sum = xs.reduce((s, x) => s + x, 0); if (sum % 5 === 0) return { v: { list: list(xs), sum: xs.join("+") }, ans: sum / 5 }; } },
  equilibrium: (r) => { const q = r.int(2, 30), b = r.int(1, 4), d = r.int(1, 4), c = r.int(5, 40); return { v: { a: c + (b + d) * q, b, c, d }, ans: q }; },
  ciHalf: (r) => { const s = r.pick([5, 10, 15, 20, 25, 30]), rt = r.pick([5, 6, 7, 8, 9, 10, 12]); return { v: { s, n: rt * rt, rt }, ans: Math.round(((1.96 * s) / rt) * 100) / 100, tol: 0.01 }; },

  // ======================= third tranche: grade volume =======================
  maxOf: (r, lvl) => { const [lo, hi] = lvl === 1 ? [1, 20] : [10, 99]; const xs = distinct(r, 3, lo, hi); const o = xs.sort(() => r.next() - 0.5); return { v: { list: list(o) }, ans: Math.max(...xs) }; },
  minOf: (r, lvl) => { const [lo, hi] = lvl === 1 ? [1, 20] : [10, 99]; const xs = distinct(r, 3, lo, hi); const o = xs.sort(() => r.next() - 0.5); return { v: { list: list(o) }, ans: Math.min(...xs) }; },
  nextNum: (r, lvl) => { const n = lvl === 1 ? r.int(1, 19) : r.int(20, 98); return { v: { n }, ans: n + 1 }; },
  prevNum: (r, lvl) => { const n = lvl === 1 ? r.int(2, 20) : r.int(21, 99); return { v: { n }, ans: n - 1 }; },
  makeTen: (r) => { const a = r.int(1, 9); return { v: { a }, ans: 10 - a }; },
  missAdd: (r, lvl) => { const cap = lvl === 1 ? 10 : lvl === 2 ? 20 : 100; const c = r.int(3, cap), b = r.int(1, c - 1); return { v: { b, c }, ans: c - b }; },
  missSub: (r, lvl) => { const cap = lvl === 1 ? 10 : lvl === 2 ? 20 : 100; const a = r.int(3, cap), c = r.int(1, a - 1); return { v: { a, c }, ans: a - c }; },
  onesDigit: (r) => { const n = r.int(10, 999); return { v: { n }, ans: n % 10 }; },
  hundredsDigit: (r) => { const n = r.int(100, 999); return { v: { n }, ans: Math.floor(n / 100) }; },
  moreBy: (r) => { const k = r.pick([10, 100]), n = r.int(100, k === 100 ? 899 : 989); return { v: { n, k }, ans: n + k }; },
  lessBy: (r) => { const k = r.pick([10, 100]), n = r.int(k === 100 ? 200 : 110, 999); return { v: { n, k }, ans: n - k }; },
  groups: (r) => { const a = r.int(2, 9), b = r.int(2, 9); return { v: { a, b }, ans: a * b }; },
  quadFourth: (r) => { for (;;) { const a = r.int(50, 130), b = r.int(50, 130), c = r.int(50, 130); if (a + b + c < 330) return { v: { a, b, c }, ans: 360 - a - b - c }; } },
  fracToDec: (r) => { const b = r.pick([2, 4, 5, 10, 20, 25]), a = r.int(1, b - 1); return { v: { a, b }, ans: Math.round((a / b) * 1e4) / 1e4 }; },
  sqrtProd: (r) => { for (;;) { const k = r.int(2, 12), m = r.int(1, 6), a = m * m * r.int(1, 5), b = (k * k) / (m * m) * 1; if (!Number.isInteger(b) || b === a) continue; const prod = a * b; const root = Math.round(Math.sqrt(prod)); if (root * root !== prod) continue; return { v: { a, b, prod }, ans: root }; } },
  expandSquare: (r) => { const a = r.nonzero(-9, 9); return { v: { e: `x${sgn(a)}`, p: 2 * a, q: a * a }, ans: 2 * a + a * a }; },
  factorDiff: (r) => { for (;;) { const m = r.nonzero(-9, 9), n = r.nonzero(-9, 9); if (m >= n) continue; const b = m + n, c = m * n; const poly = `x^2${b === 0 ? "" : b === 1 ? "+x" : b === -1 ? "-x" : `${sgn(b)}x`}${sgn(c)}`; return { v: { poly, fm: `x${sgn(m)}`, fn: `x${sgn(n)}`, m, n }, ans: n - m }; } },
  quadDisc: (r) => { const a = r.nonzero(-4, 5), b = r.int(-9, 9), c = r.nonzero(-9, 9); const t = (co, p) => (co === 0 ? "" : `${co > 0 ? "+" : "-"}${Math.abs(co) === 1 && p > 0 ? "" : Math.abs(co)}${p === 0 ? "" : p === 1 ? "x" : `x^${p}`}`); const eq = (t(a, 2) + t(b, 1) + t(c, 0)).replace(/^\+/, ""); return { v: { eq, a, b, c }, ans: b * b - 4 * a * c }; },
  qfuncValue: (r) => { const a = r.nonzero(-3, 4), b = r.int(-6, 6), c = r.int(-9, 9), x = r.int(-4, 5); const t = (co, p) => (co === 0 ? "" : `${co > 0 ? "+" : "-"}${Math.abs(co) === 1 && p > 0 ? "" : Math.abs(co)}${p === 0 ? "" : p === 1 ? "x" : `x^${p}`}`); const expr = (t(a, 2) + t(b, 1) + t(c, 0)).replace(/^\+/, ""); return { v: { expr, x }, ans: a * x * x + b * x + c }; },
  logAdd: (r) => { const b = r.pick([2, 3, 5, 10]), k = r.int(2, b === 10 ? 5 : b === 2 ? 8 : 4); for (;;) { const i = r.int(1, k - 1); const m = b ** i, n = b ** (k - i); if (m > 1 && n > 1) return { v: { b, m, n, prod: b ** k }, ans: k }; } },
  arithSum: (r) => { const a = r.int(-5, 20), d = r.nonzero(-4, 8), n = r.int(4, 20); return { v: { a, d, n }, ans: (n * (2 * a + (n - 1) * d)) / 2 }; },
  geoRatio: (r) => { const a = r.int(1, 6), q = r.int(2, 6); return { v: { a, c: a * q * q, sq: q * q }, ans: q }; },
  limFactor: (r) => { const a = r.nonzero(-9, 9); return { v: { a, sq: a * a, den: `x${a > 0 ? `-${a}` : `+${-a}`}` }, ans: 2 * a }; },
};

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
/** coefficients (highest degree first) as a polynomial in x, e.g. [2,-3,1] -> 2x^2-3x+1 */
function polyStr(cs) {
  const n = cs.length - 1;
  return cs.map((c, i) => [c, n - i]).filter(([c]) => c !== 0).map(([c, pw], i) => { const mag = Math.abs(c) === 1 && pw > 0 ? "" : String(Math.abs(c)); const body = pw === 0 ? String(Math.abs(c)) : `${mag}x${pw > 1 ? `^${pw}` : ""}`; return `${c < 0 ? "-" : i === 0 ? "" : "+"}${body}`; }).join("") || "0";
}
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

// Shared helpers of the high-school bank generators (scripts/learn/bank/hs/modules/*.mjs).
// A generator draws the numbers of ONE question and returns { v: {variables}, ans, tol? }. It must be deterministic in the rng it is given,
// and it must NEVER be trusted to check itself: every answer is recomputed by an independent Python/sympy verifier (verify/<module>.py).
export { rngOf } from "../generators.mjs";

export const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
export const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
export const P = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; };
export const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
export const isSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
export const isqrt = (n) => Math.round(Math.sqrt(n));

/** "+3" / "-3" (explicit sign, for building expressions) */
export const sg = (n) => (n < 0 ? `-${-n}` : `+${n}`);
/** coefficient in front of a variable: 1 -> "", -1 -> "-", else the number */
export const cf = (k) => (k === 1 ? "" : k === -1 ? "-" : String(k));
/** "ax+b" with the usual conventions; a != 0 */
export const lin = (a, b, x = "x") => `${cf(a)}${x}${b > 0 ? `+${b}` : b < 0 ? `${b}` : ""}`;
/** polynomial from coefficients, highest degree first: [1,-3,2] -> "x^2-3x+2"; variable x; zero polynomial -> "0" */
export function poly(coefs, x = "x") {
  const n = coefs.length - 1;
  let s = "";
  coefs.forEach((c, i) => {
    const d = n - i;
    if (c === 0) return;
    const a = Math.abs(c);
    const body = d === 0 ? String(a) : `${a === 1 ? "" : a}${x}${d === 1 ? "" : `^${d}`}`;
    s += (c < 0 ? "-" : s ? "+" : "") + body;
  });
  return s || "0";
}
/** LaTeX fraction of two integers, sign in front */
export const tfrac = (n, d) => { const g = gcd(n, d) || 1; n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return d === 1 ? String(n) : `${n < 0 ? "-" : ""}\\frac{${Math.abs(n)}}{${d}}`; };
/** value of a polynomial (coefficients highest degree first) at x */
export const evalPoly = (coefs, x) => coefs.reduce((s, c) => s * x + c, 0);
export const list = (xs) => xs.join(", ");

/** exact rationals: BigInt p/q, always reduced, q > 0 */
export class Q {
  constructor(p, q = 1n) { p = BigInt(p); q = BigInt(q); if (q === 0n) throw new Error("Q: zero denominator"); if (q < 0n) { p = -p; q = -q; } const g = Q.g(p < 0n ? -p : p, q); this.p = p / g; this.q = q / g; }
  static g(a, b) { while (b) [a, b] = [b, a % b]; return a === 0n ? 1n : a; }
  add(o) { o = Q.of(o); return new Q(this.p * o.q + o.p * this.q, this.q * o.q); }
  sub(o) { o = Q.of(o); return new Q(this.p * o.q - o.p * this.q, this.q * o.q); }
  mul(o) { o = Q.of(o); return new Q(this.p * o.p, this.q * o.q); }
  div(o) { o = Q.of(o); return new Q(this.p * o.q, this.q * o.p); }
  static of(x) { return x instanceof Q ? x : new Q(BigInt(x)); }
  get isInt() { return this.q === 1n; }
  toNumber() { return Number(this.p) / Number(this.q); }
  /** true when the decimal expansion terminates within `digits` places */
  terminates(digits = 3) { let q = this.q; for (const f of [2n, 5n]) while (q % f === 0n) q /= f; if (q !== 1n) return false; return (this.p * 10n ** BigInt(digits)) % this.q === 0n; }
  toString() { return this.q === 1n ? `${this.p}` : `${this.p}/${this.q}`; }
}

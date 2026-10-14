/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import bankJson from "@/lib/learn/content/bank/math.json";
import { BANKS, expandBank, type BankData } from "@/lib/learn/content/bank";
import { loadIndex } from "@/lib/learn/content/repository";
import { LearnService } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";

/**
 * The parametric question bank (lib/learn/content/bank/math.json): every answer is recomputed here by a method that shares no code with
 * the generators (scripts/learn/bank/generators.mjs), the wording of every language is complete, and the practice flows of the real
 * server hand the bank questions out and grade them.
 */
const bank = bankJson as unknown as BankData;
const num = (s: unknown) => String(s).split(/[,+]\s*/).map(Number);
const evalExpr = (e: string) => { const s = e.replace(/×/g, "*").replace(/÷/g, "/"); if (!/^[0-9+\-*/(). ]+$/.test(s)) throw new Error(`unsafe expression ${e}`); return Function(`return (${s})`)() as number; };
/** "2x+1", "-3x+6", "x^2-4", "3x^2+1" evaluated at x */
const poly = (s: string, x: number) => { const t0 = s.replace(/(\d)x/g, "$1*x").replace(/(\d|\))\(/g, "$1*(").replace(/x/g, `(${x})`).replace(/\^/g, "**"); const t = t0.startsWith("-") ? `0${t0}` : t0; return Function(`return (${t})`)() as number; };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const matrices = (mats: string) => { const [a, b] = [...mats.matchAll(/pmatrix\}([^\\]*?)\\\\([^\\]*?)\\end/g)].map((m) => [m[1].split("&").map(Number), m[2].split("&").map(Number)]); return { A: a, B: b }; };
const perms = (w: string): number => { const seen = new Set<string>(); const rec = (cur: string, rest: string) => { if (!rest) { seen.add(cur); return; } for (let i = 0; i < rest.length; i++) rec(cur + rest[i], rest.slice(0, i) + rest.slice(i + 1)); }; rec("", w); return seen.size; };
const multisets = (n: number, r: number): number => { let c = 0; const rec = (k: number, left: number) => { if (k === n - 1) { c++; return; } for (let i = 0; i <= left; i++) rec(k + 1, left - i); }; rec(0, r); return c; };
const choose = (n: number, k: number): number => { const row = [1]; for (let i = 1; i <= n; i++) for (let j = i; j >= 1; j--) row[j] = (row[j] ?? 0) + row[j - 1]; return row[k]; };

type V = Record<string, any>;
const VERIFY: Record<string, (v: V) => number> = {
  addThree: (v) => v.a + v.b,
  subThree: (v) => v.a - v.b,
  mixedCalc: (v) => evalExpr(v.expr),
  roundTo: (v) => { const q = v.n / v.u; return v.mode === "#rd_up" ? Math.ceil(q) * v.u : v.mode === "#rd_down" ? Math.floor(q) * v.u : Math.floor(q + 0.5) * v.u; },
  mean: (v) => num(v.list).reduce((s, x) => s + x, 0) / num(v.list).length,
  intAdd: (v) => v.a + v.b, intSub: (v) => v.a - v.b, intMul: (v) => v.a * v.b, intDiv: (v) => v.a / v.b,
  gcd: (v) => { let g = 1; for (let d = 1; d <= Math.min(v.a, v.b); d++) if (v.a % d === 0 && v.b % d === 0) g = d; return g; },
  lcm: (v) => { let m = Math.max(v.a, v.b); while (m % v.a || m % v.b) m++; return m; },
  divisorCount: (v) => { const ds = [...Array(v.n).keys()].map((i) => i + 1).filter((d) => v.n % d === 0); expect(ds).toEqual(num(v.list)); return ds.length; },
  factorExp: (v) => { let n = v.n, a = 0, b = 0; while (n % 2 === 0) { n /= 2; a++; } while (n % 3 === 0) { n /= 3; b++; } expect(n).toBe(1); return a + b; },
  median: (v) => { const s = [...num(v.list)].sort((x, y) => x - y); expect(s).toEqual(num(v.sorted)); const k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; },
  mode: (v) => { const xs = num(v.list); const best = [...new Set(xs)].map((x) => [x, xs.filter((y) => y === x).length]).sort((a, b) => b[1] - a[1]); expect(best[1]?.[1] ?? 0).toBeLessThan(best[0][1]); return best[0][0]; },
  dataRange: (v) => { const xs = num(v.list); expect(v.max).toBe(Math.max(...xs)); expect(v.min).toBe(Math.min(...xs)); return Math.max(...xs) - Math.min(...xs); },
  relFreq: (v) => v.f / v.t,
  slopeOf: (v) => v.a, yInt: (v) => v.b,
  xInt: (v) => -v.b / v.a,
  funcValue: (v) => v.a * v.c + v.b,
  crossX: (v) => (v.b2 - v.b1) / (v.a1 - v.a2),
  variance: (v) => { const xs = num(v.list); const m = xs.reduce((s, x) => s + x, 0) / xs.length; expect(m).toBe(v.mean); const sq = xs.reduce((s, x) => s + (x - m) ** 2, 0); expect(sq).toBe(v.sq); return sq / xs.length; },
  stdev: (v) => { const xs = num(v.list); const m = xs.reduce((s, x) => s + x, 0) / xs.length; const vr = xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length; expect(vr).toBe(v.var); return Math.sqrt(vr); },
  sigmaSum: (v) => {
    const m = /\\sum_\{k=1\}\^\{(\d+)\} (.+)\$$/.exec(v.expr)!; const n = Number(m[1]); const body = m[2].replace(/^\((.*)\)$/, "$1");
    let s = 0; for (let k = 1; k <= n; k++) s += Function("k", `return (${body.replace(/(\d)k/g, "$1*k").replace(/\^/g, "**")})`)(k) as number;
    return s;
  },
  probAdd: (v) => Math.round((v.pa + v.pb - v.pab) * 100) / 100, probComplement: (v) => Math.round((1 - v.pa) * 100) / 100,
  matEntry: (v) => {
    const { A, B } = matrices(v.mats); const i = v.r - 1, j = v.c - 1; const e = String(v.expr).replace(/\$/g, "");
    if (e === "A+B") return A[i][j] + B[i][j]; if (e === "A-B") return A[i][j] - B[i][j];
    if (e === "AB") return A[i][0] * B[0][j] + A[i][1] * B[1][j];
    const k = Number(/^(\d)A/.exec(e)![1]); return e.endsWith("-B") ? k * A[i][j] - B[i][j] : k * A[i][j];
  },
  setCount: (v) => v.na + v.nb - v.nab, subsetCount: (v) => { let c = 0; for (let m = 0; m < 2 ** v.n; m++) c++; return c; },
  composite: (v) => { const m = /\(g\\circ f\)\((-?\d+)\)/.exec(v.comp)!; return poly(v.g, poly(v.f, Number(m[1]))); },
  inverseVal: (v) => { for (let x = -50; x <= 50; x++) if (poly(v.f, x) === v.y) return x; throw new Error("no preimage"); },
  rootMax: (v) => { const rs = roots(v); return Math.max(...rs); }, rootSum: (v) => roots(v).reduce((s, x) => s + x, 0),
  derivVal: (v) => {
    const f = fn(v.f); const h = 1e-5; return (f(v.a_ + h) - f(v.a_ - h)) / (2 * h);
  },
  repPerm: (v) => { let c = 0; const rec = (d: number) => { if (d === v.r) { c++; return; } for (let i = 0; i < v.n; i++) rec(d + 1); }; rec(0); return c; },
  permSame: (v) => perms(v.word),
  repComb: (v) => multisets(v.n, v.r), binomCoef: (v) => choose(v.n, v.k),
  percentChange: (v) => ((v.b - v.a) / v.a) * 100, simpleInterest: (v) => v.p * (v.r / 100) * v.n, taxTotal: (v) => v.p + v.p * (v.t / 100),
};

const simpson = (f: (x: number) => number, lo: number, hi: number) => { const n = 2000, h = (hi - lo) / n; let t = f(lo) + f(hi); for (let i = 1; i < n; i++) t += f(lo + i * h) * (i % 2 ? 4 : 2); return (t * h) / 3; };
const cx = (t: string) => { const m = /^\((-?\d+)([+-]\d*)i\)$/.exec(t)!; const im = m[2] === "+" ? 1 : m[2] === "-" ? -1 : Number(m[2]); return [Number(m[1]), im]; };
const frac = (t: string) => { const m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(t); return m ? (m[1] ? -1 : 1) * (Number(m[2]) / Number(m[3])) : Number(t); };
const VERIFY2: Record<string, (v: V) => number> = {
  plus: (v) => v.a + v.b, minus: (v) => v.a - v.b, times: (v) => v.a * v.b, divide: (v) => { expect(v.a % v.b).toBe(0); return v.a / v.b; },
  tensDigit: (v) => Number(String(v.n)[String(v.n).length - 2]),
  seqNext: (v) => { const xs = num(v.list); const d = xs[1] - xs[0]; xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBe(d)); expect(Number(v.d)).toBe(d); return xs[xs.length - 1] + d; },
  kmToM: (v) => v.v * 1000, lToMl: (v) => v.v * 1000, convMCm: (v) => v.v * 100, convKgG: (v) => Math.round(v.v * 1000),
  diameter: (v) => v.r * 2, triThird: (v) => 180 - v.a - v.b, bigNum: (v) => v.a * 10000 + v.b * 1000,
  fracAdd: (v) => { const t = v.a / v.b + v.c / v.d; expect(Math.abs(v.num / v.den - t)).toBeLessThan(1e-12); expect(gcd(v.num, v.den)).toBe(1); return t; },
  fracDivInt: (v) => { const t = v.a / v.b / v.c; expect(Math.abs(v.num / v.den - t)).toBeLessThan(1e-12); expect(gcd(v.num, v.den)).toBe(1); return t; },
  decTimes: (v) => Math.round(v.a * v.b * 1e4) / 1e4,
  rectArea: (v) => v.w * v.h, rectPerim: (v) => 2 * (v.w + v.h), ratioPct: (v) => (v.a / v.b) * 100,
  propX: (v) => { for (let x = 1; x <= 100; x++) if (x * v.b === v.a * v.d) return x; throw new Error("no integer"); },
  decPct: (v) => Math.round(v.d * 100), cubeVol: (v) => v.a * v.a * v.a, cuboidVol: (v) => v.a * v.b * v.c,
  circum: (v) => Math.round(2 * 3.14 * v.r * 100) / 100, circleArea: (v) => Math.round(3.14 * v.r * v.r * 100) / 100, meanSum: (v) => v.n * v.m,
  exprValue: (v) => poly(v.expr, v.x),
  solveLin: (v) => { const [l, r] = String(v.eq).split("="); for (let x = -60; x <= 60; x++) if (poly(l, x) === Number(r)) return x; throw new Error("no root"); },
  expMul: (v) => v.a + v.b, expPow: (v) => v.a * v.b,
  ineqMax: (v) => { let best = -Infinity; for (let x = -100; x <= 100; x++) if (x + v.a < v.b) best = x; expect(v.bound).toBe(v.b - v.a); return best; },
  slope2: (v) => (v.y2 - v.y1) / (v.x2 - v.x1),
  coinCases: (v) => { let c = 0; for (let m = 0; m < 1 << v.n; m++) c++; return c; },
  isoApex: (v) => 180 - v.b - v.b,
  hypot: (v) => { const c = Math.round(Math.hypot(v.a, v.b)); expect(c * c).toBe(v.a * v.a + v.b * v.b); expect(v.sq).toBe(c * c); return c; },
  sqrtVal: (v) => Math.sqrt(v.n),
  expandPQ: (v) => { const a = Number(String(v.fa).slice(1)), b = Number(String(v.fb).slice(1)); expect(v.p).toBe(a + b); expect(v.q).toBe(a * b); const e = (x: number) => (x + a) * (x + b) - (x * x + (a + b) * x + a * b); for (const x of [-3, 0, 2, 5]) expect(e(x) === 0).toBe(true); return (a + b) + a * b; },
  quadRoot: (v) => { const eq = String(v.eq).replace("=0", ""); const rs: number[] = []; for (let x = -50; x <= 50; x++) if (poly(eq, x) === 0) rs.push(x); expect(rs.length).toBe(2); return Math.max(...rs); },
  vertexSum: (v) => { const f = (x: number) => poly(String(v.expr), x); const lead = f(2) - 2 * f(1) + f(0) > 0 ? "min" : "max"; let bx = 0; for (let x = -30; x <= 30; x++) if (lead === "min" ? f(x) < f(bx) : f(x) > f(bx)) bx = x; expect([bx, f(bx)]).toEqual([v.p, v.q]); return bx + f(bx); },
  remainder: (v) => { expect(String(v.div)).toBe(`x${v.a > 0 ? `-${v.a}` : `+${-v.a}`}`); return poly(String(v.poly), v.a); },
  complexSum: (v) => { const [t1, t2] = String(v.expr).split(/\)\+\(/).map((t, i) => (i === 0 ? t + ")" : "(" + t)); const [a, b] = cx(t1), [c, d] = cx(t2); expect(v.re).toBe(a + c); expect(v.im).toBe(b + d); return a + c + b + d; },
  permNP: (v) => { let c = 1; for (let i = 0; i < v.r; i++) c *= v.n - i; return c; },
  combNC: (v) => choose(v.n, v.r),
  dist2: (v) => { expect(v.dx).toBe(Math.abs(v.x2 - v.x1)); expect(v.dy).toBe(Math.abs(v.y2 - v.y1)); return Math.hypot(v.x2 - v.x1, v.y2 - v.y1); },
  circleR: (v) => { const k = Math.sqrt(v.r2); for (const f of [v.fx, v.fy]) expect(/^[xy]([+-]\d+)?$/.test(f)).toBe(true); return k; },
  ineqCount: (v) => { let c = 0; for (let x = -60; x <= 60; x++) if (poly(String(v.eq), x) < 0) c++; const f = (x: number) => poly(String(v.fact), x); expect(f(v.r1) === 0).toBe(true); expect(f(v.r2) === 0).toBe(true); return c; },
  logVal: (v) => { let k = 0, p = 1; while (p < v.n) { p *= v.b; k++; } expect(p).toBe(v.n); return k; },
  radDeg: (v) => { const k = Number(/^(\d*)\\pi$/.exec(String(v.num))![1] || 1); return (180 * k) / v.d; },
  arithTerm: (v) => { let t = v.a; for (let i = 1; i < v.n; i++) t += v.d; return t; },
  geoTerm: (v) => { let t = v.a; for (let i = 1; i < v.n; i++) t *= v.r; return t; },
  limLinear: (v) => poly(String(v.f), v.a),
  derivAt: (v) => { const f = (x: number) => poly(String(v.poly), x); expect(poly(String(v.deriv), v.a)).toBe(Math.round(((f(v.a + 1e-4) - f(v.a - 1e-4)) / 2e-4) * 1e3) / 1e3); return poly(String(v.deriv), v.a); },
  defInt: (v) => { const f = (x: number) => poly(String(v.fx), x); const t = simpson(f, 0, v.b); expect(Math.abs(poly(String(v.anti), v.b) - t)).toBeLessThan(1e-6); return poly(String(v.anti), v.b); },
  areaX2: (v) => simpson((x) => v.k * x * x, 0, v.a),
  geoSeries: (v) => { const r = frac(String(v.rtex)); let t = 0, term = v.a; for (let i = 0; i < 400; i++) { t += term; term *= r; } expect(Math.abs(frac(String(v.res)) - v.a / (1 - r))).toBeLessThan(1e-9); expect(Math.abs(t - v.a / (1 - r))).toBeLessThan(1e-6); return v.a / (1 - r); },
  binomMean: (v) => v.n * v.p, vecNorm: (v) => Math.hypot(v.x, v.y), focusX: (v) => v.c / 4, condProb: (v) => v.pab / v.pa,
  chanceFraction: (v) => { expect(v.total).toBe(v.a + v.b); return v.a / v.total; },
  pieCount: (v) => (v.t * v.p) / 100, directConst: (v) => v.y1 / v.x1, inverseConst: (v) => v.x1 * v.y1,
  discount: (v) => v.p * (1 - v.d / 100), pmAverage: (v) => { const xs = num(v.list); expect(xs.reduce((s, x) => s + x, 0)).toBe(Number(String(v.sum).split("+").reduce((s, x) => s + Number(x), 0))); return xs.reduce((s, x) => s + x, 0) / xs.length; },
  equilibrium: (v) => { for (let q = 0; q <= 100; q++) if (v.a - v.b * q === v.c + v.d * q) return q; throw new Error("no equilibrium"); },
  ciHalf: (v) => { expect(v.rt * v.rt).toBe(v.n); return Math.round(((1.96 * v.s) / v.rt) * 100) / 100; },
};
Object.assign(VERIFY, VERIFY2);

function roots(v: V): number[] {
  const rs = (String(v.fact).replace(/\$|=0/g, "").match(/\(x[+-]\d+\)|x/g) ?? []).map((t) => (t === "x" ? 0 : -Number(t.slice(2, -1))));
  expect(rs.length).toBe(3);
  for (const r of rs) expect(poly(String(v.eq).replace(/\$|=0/g, ""), r)).toBe(0); // the expanded polynomial vanishes at each root
  return rs;
}
function fn(tex: string): (x: number) => number {
  let m: RegExpExecArray | null;
  if ((m = /^e\^\{(-?\d*)x\}$/.exec(tex))) { const k = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]); return (x) => Math.exp(k * x); }
  if ((m = /^\\sin (-?\d*)x$/.exec(tex))) { const k = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]); return (x) => Math.sin(k * x); }
  if ((m = /^\((.+)\)\^(\d)$/.exec(tex))) return (x) => poly(m![1], x) ** Number(m![2]);
  if ((m = /^\\ln\((.+)\)$/.exec(tex))) return (x) => Math.log(poly(m![1], x));
  throw new Error(`unsupported f ${tex}`);
}

describe("bank answers are right (independent recomputation)", () => {
  it("covers every template it uses", () => {
    for (const t of new Set(bank.sets.map((s) => s.template))) expect(VERIFY[t], t).toBeTypeOf("function");
  });
  for (const set of bank.sets) {
    it(`${set.id} (${set.rows.length} questions)`, () => {
      const seen = new Set<string>();
      for (const row of set.rows) {
        const v: V = Object.fromEntries(set.cols.map((c, j) => [c, row[j]]));
        const ans = row[set.cols.length] as number;
        if (set.template === "derivVal") v.a_ = typeof v.a === "string" ? Math.PI / 4 : v.a;
        const expected = VERIFY[set.template](v);
        const slack = set.template === "derivVal" ? 1e-6 * Math.max(1, Math.abs(ans)) : (set.tolerance ?? 1e-9); // the independent derivative is numeric
        expect(Math.abs(expected - ans), `${set.id} ${JSON.stringify(v)} -> ${ans}, independent ${expected}`).toBeLessThanOrEqual(slack);
        const key = JSON.stringify(v);
        expect(seen.has(key), `duplicate instance ${key}`).toBe(false);
        seen.add(key);
      }
    });
  }
});

describe("bank wording", () => {
  const locales = fs.readdirSync("content/learn-overlays").filter((d) => fs.existsSync(`content/learn-overlays/${d}/math.json`));
  const names = (s: string) => [...s.matchAll(/\{([a-z][a-z0-9]*)\}/g)].map((m) => m[1]);
  it("expands to unique ids, two hints and no unresolved placeholder, in Korean", () => {
    const skills = new Set(bank.sets.map((s) => s.skillId));
    const qs = expandBank(bank, null, skills);
    expect(qs.length).toBe(bank.sets.reduce((n, s) => n + s.rows.length, 0));
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.hints.length).toBe(2);
      expect(q.id).toMatch(/^b-[a-z0-9-]+-\d{3}$/);
      const set = bank.sets.find((x) => q.id.startsWith(x.id + "-"))!;
      const t = bank.templates[set.template];
      const vars = new Set([...set.cols, "ans"]); // other {x} are LaTeX (for example \\frac{u}{v}), not placeholders
      const holes = new Set([...names(t.prompt), ...names(t.explanation), ...t.hints.flatMap(names)].filter((h) => vars.has(h)));
      for (const h of holes) for (const text of [q.prompt, q.explanation, ...q.hints]) expect(text.includes(`{${h}}`), `${q.id} leaves {${h}}`).toBe(false);
    }
  });
  it("every language ships the full wording and the same answers", () => {
    expect(locales.length).toBeGreaterThanOrEqual(44);
    const skills = new Set(bank.sets.map((s) => s.skillId));
    const ko = expandBank(bank, null, skills);
    for (const loc of locales) {
      const file = loc === "vi" ? "lib/learn/content/vi/math.json" : `content/learn-overlays/${loc}/math.json`;
      const ov = JSON.parse(fs.readFileSync(file, "utf8")).bank;
      const qs = expandBank(bank, ov, skills);
      expect(qs.length, loc).toBe(ko.length);
      qs.forEach((q, i) => {
        expect(q.id).toBe(ko[i].id);
        expect(q.answer).toEqual(ko[i].answer);
        expect(/[가-힣]/.test(q.prompt + q.explanation + q.hints.join("")), `${loc} ${q.id} has Hangul`).toBe(false);
      });
    }
  });
});

describe("the real service hands the bank out", () => {
  const NOW = new Date("2026-03-01T03:00:00Z");
  const make = () => { let n = 0; return new LearnService({ store: new MemoryLearnStore(), now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` }); };
  const actor = (locale: "ko" | "ja") => ({ userId: "u-bank", locale });
  it("practice of a skill draws bank questions, in the learner's language, graded by the server", async () => {
    expect(BANKS.math).toBeDefined();
    for (const locale of ["ko", "ja"] as const) {
      const svc = make();
      await svc.saveOnboarding(actor(locale), "math", { nickname: "테스터", grade: "E3", goal: "habit", avatar: "fox" });
      const s = await svc.startSession(actor(locale), "math", { kind: "practice", skillId: "m.e3.ari1" });
      const bankQs = s.questions.filter((q: { id: string }) => q.id.startsWith("b-"));
      expect(bankQs.length).toBeGreaterThan(0);
      const q = bankQs[0] as { id: string; prompt: string };
      expect(/[가-힣]/.test(q.prompt)).toBe(locale === "ko");
      const full = (await loadIndex("math", { grade: "E3", locale })).bundle.questions.find((x) => x.id === q.id)!;
      const right = String((full.answer as { value: number }).value);
      const bad = await svc.submitAttempt(actor(locale), "math", { sessionId: s.sessionId, questionId: q.id, answer: "123456789", attemptNo: 1, hintsUsed: 0, timeMs: 3000 });
      expect(bad.correct).toBe(false);
      const ok = await svc.submitAttempt(actor(locale), "math", { sessionId: s.sessionId, questionId: q.id, answer: right, attemptNo: 2, hintsUsed: 1, timeMs: 3000 });
      expect(ok.correct).toBe(true);
    }
  });
  it("the browser's metadata path (bank:false) never carries the bank, and grade scope keeps only its skills", async () => {
    const without = (await loadIndex("math", { grade: "E3", bank: false })).bundle.questions;
    expect(without.some((q) => q.id.startsWith("b-"))).toBe(false);
    const withBank = (await loadIndex("math", { grade: "E3" })).bundle.questions.filter((q) => q.id.startsWith("b-"));
    expect(withBank.length).toBeGreaterThan(200);
    expect(withBank.every((q) => q.skillId.startsWith("m.e3."))).toBe(true); // only the grade's own skills
  });
});

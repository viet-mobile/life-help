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
const poly = (s: string, x: number) => { const t = s.replace(/(\d)x/g, "$1*x").replace(/x/g, `(${x})`).replace(/\^/g, "**"); return Function(`return (${t})`)() as number; };
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
    expect(withBank.every((q) => q.skillId === "m.e3.ari1")).toBe(true);
  });
});

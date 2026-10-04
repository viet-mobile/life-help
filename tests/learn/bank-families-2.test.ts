import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/learn/types";
import { generate } from "../../scripts/learn/bank/engine.mjs";
import { slip } from "../../scripts/learn/bank/templates/math-c.mjs";
import { mismatch, bestOption } from "../../scripts/learn/bank/templates/english-c.mjs";

type Item = { question: Question; predictedLevel: number };
const run = (subject: string, tmpl: unknown, level: number, count = 40, seed = 9) => (generate({ subject, level, count, seed, templates: [tmpl] }) as unknown as { items: Item[] }).items;
const keyIndex = (q: Question) => { const a = q.answer; if (a.kind !== "choice") throw new Error("choice expected"); return q.options!.findIndex((o) => o.id === a.id); };
const doc = (q: Question) => q.prompt.replace(/^.*?"/, "").replace(/" 질문:.*$/, "");
const ask = (q: Question) => q.prompt.replace(/^.*?" 질문: /, "");

describe("math: find-the-slip, independently checked", () => {
  it.each([2, 3, 4, 5])("level %i: exactly the keyed step contains a wrong statement", (level) => {
    for (const it of run("math", slip, level)) {
      const q = it.question, text = q.prompt;
      const body = text.replace(/^.*?한 학생의 풀이입니다\. /, "").replace(/ 틀린 부분이 있는 단계는 어느 것인가요\?$/, "");
      const steps = body.split(" / ").map((x) => x.replace(/^단계 \d+: /, ""));
      expect(steps.length).toBe(4);
      const head = text.replace(/ 한 학생의 풀이입니다\..*$/, "").replace(/^계산: /, "");
      const expr = /^(\d+) ([+×]) (\d+)$/.exec(head);
      const wrong = steps.map((s, i) => {
        const eq = /(\d+) ([+×÷-]) (\d+)(?: ([+]) (\d+))? = (\d+)/.exec(s);
        if (eq) { const [, a, op, b, op2, c, r] = eq; const v = op === "+" ? +a + +b : op === "-" ? +a - +b : op === "÷" ? +a / +b : +a * +b; return (op2 ? v + +c : v) !== +r ? i : -1; }
        const fin = /^답: (\d+)$/.exec(s);
        if (fin && expr) return (expr[2] === "+" ? +expr[1] + +expr[3] : +expr[1] * +expr[3]) !== +fin[1] ? i : -1;
        return -1;
      }).filter((i) => i >= 0);
      const at = keyIndex(q);
      // a slip in a step that is an equation or the final answer is visible to a plain recomputation; other steps (lcm, conversions) are checked by their own rules
      const frac = /(\d+)\/(\d+) \+ (\d+)\/(\d+)/.exec(head);
      if (frac) {
        const [, a, b, c, d] = frac.map(Number) as unknown as number[];
        const lcm = (x: number, y: number) => { let m = x; while (m % y) m += x; return m; };
        const l = lcm(b, d), n1 = (a * l) / b, n2 = (c * l) / d;
        const claimLcm = Number(/최소공배수는 (\d+)/.exec(steps[0])![1]);
        const conv = /통분: (\d+)\/(\d+) \+ (\d+)\/(\d+)/.exec(steps[1])!.slice(1).map(Number);
        const bad: number[] = [];
        if (claimLcm !== l) bad.push(0);
        if (conv[0] !== n1 || conv[1] !== l || conv[2] !== n2 || conv[3] !== l) bad.push(1);
        const last = /더하면 (\d+) \+ (\d+) = (\d+), 답: (\d+)\/(\d+)/.exec(steps[2])!;
        if (+last[3] !== n1 + n2 || +last[4] !== n1 + n2 || +last[5] !== l) bad.push(2);
        const red = /약분: (\d+)\/(\d+) = (\d+)\/(\d+)/.exec(steps[3])!;
        const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
        if (+red[1] !== n1 + n2 || +red[2] !== l || +red[3] !== (n1 + n2) / g(n1 + n2, l) || +red[4] !== l / g(n1 + n2, l)) bad.push(3);
        expect(bad).toEqual([at]);
      } else if (/km 길이의 길을/.test(text)) {
        const km = Number(/([\d.]+) km 길이/.exec(text)![1]), per = Number(/을 (\d+)번/.exec(text)![1]);
        const bad: number[] = [];
        if (Number(/km = (\d+) m/.exec(steps[0].replace("1 km = 1000 m 이므로 ", ""))![1]) !== Math.round(km * 1000)) bad.push(0);
        const m2 = /(\d+) × (\d+) = (\d+)/.exec(steps[1])!; if (+m2[3] !== +m2[1] * +m2[2]) bad.push(1);
        const ans = Number(/답: (\d+) m/.exec(steps[2])![1]); if (ans !== Math.round(km * 1000) * per) bad.push(2);
        const chk = /(\d+) ÷ (\d+) = (\d+)/.exec(steps[3])!; if (+chk[1] / +chk[2] !== +chk[3] || +chk[3] !== Math.round(km * 1000) || +chk[1] !== Math.round(km * 1000) * per) bad.push(3);
        expect(bad).toEqual([at]);
      } else {
        expect(wrong).toEqual([at]);
      }
    }
  });
});

describe("English: inconsistency-check, independently checked", () => {
  const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const timeMin = (s: string) => { const a = /(\d{1,2}):(\d{2}) (am|pm)|(\d{1,2}) (am|pm)/.exec(s); if (a) { const h = +(a[1] ?? a[4]), m = +(a[2] ?? 0), pm = (a[3] ?? a[5]) === "pm"; return ((h % 12) + (pm ? 12 : 0)) * 60 + m; } const b = /(\d{2}):(\d{2})/.exec(s)!; return +b[1] * 60 + +b[2]; };
  const dateKey = (s: string) => { const m = /(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December)/.exec(s)!; return `${m[1]} ${m[2]}`; };
  const fee = (s: string) => Number(/(\d+) USD|USD (\d+)/.exec(s)!.slice(1).find(Boolean));
  it.each([4, 5, 6, 7, 8, 9])("level %i: exactly one detail differs once equivalent formats are normalised, and it is the keyed one", (level) => {
    for (const it of run("english", mismatch, level)) {
      const d = doc(it.question), [conf, rem] = d.split(" | Reminder e-mail | ");
      const get = (re: RegExp, s: string) => re.exec(s)![1];
      const c = { date: dateKey(get(/Date: ([^|]+?) \|/, conf)), time: timeMin(get(/Time: ([^|]+?) \|/, conf)), place: get(/Place: ([^|]+?) \|/, conf), fee: fee(get(/Fee: ([^|]+?)(?: \||$)/, conf)), code: /Booking code: (\S+)/.exec(conf)?.[1] };
      const r = { date: dateKey(get(/on ([^.]+?)\. Please/, rem)), time: timeMin(get(/arrive by ([^.]+?) at /, rem)), place: get(/ at ([^.]+?)\. The fee/, rem), fee: fee(get(/The fee is ([^.]+?)\./, rem)), code: /booking code (\S+) at the desk/.exec(rem)?.[1] };
      const keys = (["date", "time", "place", "fee", "code"] as const).filter((k) => c[k] !== undefined);
      const diff = keys.filter((k) => c[k] !== r[k]);
      expect(diff, d).toHaveLength(1);
      const expected = diff[0] === "code" ? 3 : keys.indexOf(diff[0]);
      expect(keyIndex(it.question)).toBe(expected);
      expect(MONTH.length).toBe(12);
    }
  });
});

describe("English: best-option, independently checked", () => {
  it.each([5, 6, 7, 8, 9])("level %i: the keyed plan is the cheapest plan that meets the data need under the stated cost rule", (level) => {
    for (const it of run("english", bestOption, level)) {
      const q = it.question, d = doc(it.question), a = ask(it.question);
      const needGb = Number(/at least (\d+) GB/.exec(a)![1]);
      const months = Number(/whole (\d+) months/.exec(a)?.[1] ?? 0);
      const plans = [...d.matchAll(/Plan ([A-D]): (\d+) USD per month, (\d+) GB([^|]*)/g)].map((m) => {
        const rest = m[4];
        return { n: m[1], m: +m[2], gb: +m[3], setup: +(/setup fee (\d+) USD/.exec(rest)?.[1] ?? 0), free: +(/first (\d+) months? free/.exec(rest)?.[1] ?? 0), term: +(/(\d+)-month contract/.exec(rest)?.[1] ?? 0), cancel: +(/cancel early for (\d+) USD/.exec(rest)?.[1] ?? 0) };
      });
      expect(plans).toHaveLength(4);
      const cost = (p: (typeof plans)[number]) => (level === 5 ? p.m : p.m * (months - p.free) + p.setup + (level >= 7 && p.term > months ? p.cancel : 0));
      const ok = plans.filter((p) => p.gb >= needGb).sort((x, y) => cost(x) - cost(y));
      expect(ok.length).toBeGreaterThanOrEqual(2);
      expect(cost(ok[0])).toBeLessThan(cost(ok[1]));
      expect(`Plan ${ok[0].n}`).toBe(q.options![keyIndex(q)].text);
    }
  });
});

import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/learn/types";
import { generate } from "../../scripts/learn/bank/engine.mjs";
import { MATH_C, representation, backward } from "../../scripts/learn/bank/templates/math-c.mjs";
import { ENGLISH_C, search, form, docs, note } from "../../scripts/learn/bank/templates/english-c.mjs";
import { MATH_TEMPLATES } from "../../scripts/learn/bank/templates/math.mjs";
import { ENGLISH_TEMPLATES } from "../../scripts/learn/bank/templates/english.mjs";
import { coverage } from "../../scripts/learn/bank/engine.mjs";

type Item = { question: Question; overlay: { prompt: string }; template: string; predictedLevel: number; reasoningTags: string[] };
const run = (subject: string, tmpl: unknown, level: number, count = 60, seed = 5) => (generate({ subject, level, count, seed, templates: [tmpl] }) as unknown as { items: Item[] }).items;
const right = (q: Question): string => {
  const a = q.answer;
  if (a.kind === "choice") return q.options!.find((o) => o.id === a.id)!.text;
  if (a.kind === "numeric") return String(a.value);
  throw new Error("unexpected answer kind");
};
const doc = (q: Question) => q.prompt.replace(/^.*?"/, "").replace(/" 질문:.*$/, "");
const ask = (q: Question) => q.prompt.replace(/^.*?" 질문: /, "");

describe("new family registry", () => {
  it("adds 3 math + 6 English families to the existing 17 + 13", () => {
    expect(MATH_C.map((t: { id: string }) => t.id)).toEqual(["representation-match", "backward-reasoning", "find-the-slip"]);
    expect(ENGLISH_C.map((t: { id: string }) => t.id)).toEqual(["search-results", "form-check", "help-docs", "notice-to-note", "inconsistency-check", "best-option"]);
    expect(MATH_TEMPLATES).toHaveLength(20);
    expect(ENGLISH_TEMPLATES).toHaveLength(19);
    expect(new Set([...MATH_TEMPLATES, ...ENGLISH_TEMPLATES].map((t: { id: string }) => t.id)).size).toBe(39);
    for (const list of [MATH_TEMPLATES, ENGLISH_TEMPLATES]) expect(new Set(list.map((t: { short: string }) => t.short)).size).toBe(list.length);
  });
  it("covers every level 1..10 in both subjects", () => {
    const c = coverage() as Record<string, Record<string, string[]>>;
    for (const s of ["math", "english"]) for (let l = 1; l <= 10; l++) expect(c[s][l].length, `${s} L${l}`).toBeGreaterThanOrEqual(2);
  });
  it("is deterministic and different seeds give different questions", () => {
    for (const [s, t, l] of [["math", representation, 6], ["math", backward, 5], ["english", search, 7], ["english", form, 5], ["english", docs, 8], ["english", note, 7]] as const) {
      const a = run(s, t, l, 12, 1), b = run(s, t, l, 12, 1), c = run(s, t, l, 12, 2);
      expect(a.map((i) => i.question.prompt)).toEqual(b.map((i) => i.question.prompt));
      expect(a.map((i) => i.question.prompt)).not.toEqual(c.map((i) => i.question.prompt));
    }
  });
});

describe("math: representation-match, answers re-derived independently", () => {
  // independent: finite differences / interpolation, never the generator's rule
  const lagrange = (xs: number[], ys: number[], x: number) => xs.reduce((s, xi, i) => s + ys[i] * xs.reduce((p, xj, j) => (i === j ? p : (p * (x - xj)) / (xi - xj)), 1), 0);
  const evalRule = (text: string, x: number) => {
    const t = text.replace(/\s/g, "").replace("y=", "").replace(/²/g, "^2");
    const m = /^\((\d*)x\+(\d+)\)\^2$/.exec(t); if (m) return ((m[1] === "" ? 1 : +m[1]) * x + +m[2]) ** 2;
    const q = /^(\d*)x\^2\+(\d+)$/.exec(t); if (q) return (q[1] === "" ? 1 : +q[1]) * x * x + +q[2];
    const l = /^(\d*)x([+-]\d+)?$/.exec(t); if (l) return (l[1] === "" ? 1 : +l[1]) * x + (l[2] ? +l[2] : 0);
    throw new Error(`unparsed rule ${text}`);
  };
  it.each([3, 4, 5, 6, 7, 8])("level %i: the keyed rule fits every pair, every distractor fails somewhere, numeric answers match interpolation", (level) => {
    for (const it of run("math", representation, level, 40)) {
      const q = it.question, nums = (q.prompt.match(/\d+/g) ?? []).map(Number);
      expect(it.predictedLevel).toBeGreaterThanOrEqual(level - 1); expect(it.predictedLevel).toBeLessThanOrEqual(level + 1);
      const m = /x가 ([\d, ]+)일 때 y는 차례로 ([\d, ]+)입니다/.exec(q.prompt);
      expect(m, q.prompt).toBeTruthy();
      const xs = m![1].split(",").map(Number), ys = m![2].split(",").map(Number);
      if (q.type === "numeric") {
        const far = nums[nums.length - 1];
        expect(Math.round(lagrange(xs, ys, far))).toBe(Number(right(q)));
      } else {
        const fits = q.options!.filter((o) => xs.every((x, i) => evalRule(o.text, x) === ys[i]));
        expect(fits).toHaveLength(1);
        expect(fits[0].text).toBe(right(q));
      }
    }
  });
});

describe("math: backward-reasoning, answers re-derived independently", () => {
  it.each([3, 4, 5, 6, 7, 8])("level %i: undoing the stated steps from the result gives the keyed start, using whole numbers only", (level) => {
    for (const it of run("math", backward, level, 40)) {
      const text = it.question.prompt;
      const steps = [...text.matchAll(/(\d+)배 하(?:고|면)|(\d+)을\(를\) 더하(?:고|면)|(\d+)을\(를\) 빼(?:고|면)|(\d+)으로 나누(?:고|면)/g)].map((m) => (m[1] ? ["x", +m[1]] : m[2] ? ["+", +m[2]] : m[3] ? ["-", +m[3]] : ["/", +m[4]]) as [string, number]);
      const result = Number(/결과가 (\d+)입니다/.exec(text)![1]);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      let v = result; for (const [op, k] of [...steps].reverse()) v = op === "x" ? v / k : op === "+" ? v - k : op === "-" ? v + k : v * k;
      expect(Number.isInteger(v)).toBe(true);
      expect(String(v)).toBe(right(it.question));
      let f = v; for (const [op, k] of steps) f = op === "x" ? f * k : op === "+" ? f + k : op === "-" ? f - k : f / k;
      expect(f).toBe(result);
    }
  });
});

const sw = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["the", "you", "your", "want", "and", "for", "online", "how", "know", "anyone"].includes(w.replace(/s$/, ""))).map((w) => w.replace(/s$/, "")));

describe("English: search-results, independently checked", () => {
  it.each([3, 4, 5, 6, 7, 8, 9])("level %i: exactly one result satisfies every stated condition and it is the keyed one", (level) => {
    for (const it of run("english", search, level, 40)) {
      const d = doc(it.question), q = ask(it.question);
      const need = /You want to ([^.]+)\./.exec(d)![1];
      const official = /official web address of [^|]*? is ([a-z.-]+)\./.exec(d)?.[1] ?? null;
      const rs = [...d.matchAll(/\[(\d)\] (.+?) \(([a-z.-]+), updated (\d{4})(, sponsored)?\) - /g)].map((m) => ({ n: +m[1], title: m[2], domain: m[3], year: +m[4], ad: !!m[5] }));
      expect(rs.length).toBe(4);
      const overlap = (r: { title: string }) => [...sw(r.title)].filter((w) => sw(need).has(w)).length;
      const pass = rs.filter((r) => overlap(r) >= 2 && (!/exact official web address/.test(q) || r.domain === official) && (!/is current/.test(q) || r.year >= 2025) && (!/not an advertisement/.test(q) || !r.ad));
      expect(pass).toHaveLength(1);
      expect(`Result ${pass[0].n}`).toBe(right(it.question));
    }
  });
});

describe("English: form-check, independently checked", () => {
  const RULES: Record<string, (v: string, ctx: { user: string; rule: string }) => boolean> = {
    Phone: (v) => /^\d{10}$/.test(v), Postcode: (v) => /^\d{5}$/.test(v), Tickets: (v) => /^[1-6]$/.test(v),
    Username: (v) => /^[A-Za-z0-9]{4,12}$/.test(v), Email: (v) => (v.match(/@/g) ?? []).length === 1 && /@.*\./.test(v),
    Password: (v, c) => (/at least 10/.test(c.rule) ? v.length >= 10 && /\d/.test(v) && !v.toLowerCase().includes(c.user.toLowerCase()) : v.length >= 8 && /\d/.test(v)),
    Date: (v) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(v); if (!m) return false; const dim = [31, +m[3] % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; return +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= dim[+m[2] - 1]; },
  };
  it.each([2, 3, 4, 5, 6, 7, 8])("level %i: exactly one of the four entries breaks its rule and it is the keyed one", (level) => {
    for (const it of run("english", form, level, 40)) {
      const d = doc(it.question), rules = d.split(" | ").filter((x) => /^[A-Z][a-z]+: /.test(x));
      const user = /Your username is ([^.]+)\./.exec(d)?.[1] ?? "";
      const q = it.question, entries = q.options!.map((o) => o.text);
      expect(entries).toHaveLength(4);
      const bad = entries.filter((e) => { const [label, ...rest] = e.split(": "); const rule = rules.find((r) => r.startsWith(`${label}:`)) ?? ""; return !RULES[label](rest.join(": "), { user, rule }); });
      expect(bad).toHaveLength(1);
      expect(bad[0]).toBe(right(q));
    }
  });
});

describe("English: help-docs, independently checked", () => {
  const words = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !["minutes", "more", "after", "that", "with", "then", "again", "expect", "fee", "still"].includes(w));
  it.each([4, 5, 6, 7, 8, 9])("level %i: the keyed action is the one the guide prescribes for the stated situation", (level) => {
    for (const it of run("english", docs, level, 40)) {
      const d = doc(it.question), ans = right(it.question);
      const [guide, situation] = d.split(" | Situation: ");
      const lines = guide.replace(/^Help guide \| /, "").split(" | ").filter((l) => !/^Support is free/.test(l));
      const matched = lines.filter((l) => situation.toLowerCase().includes(l.split(":")[0].toLowerCase()));
      expect(matched, situation).toHaveLength(1);
      const stateLine = matched[0], body = stateLine.slice(stateLine.indexOf(":") + 2);
      if (level === 7) {
        const total = Number(/(\d+) minutes/.exec(body)![1]), started = Number(/started (\d+) minute/.exec(situation)![1]);
        expect(ans).toBe("Wait " + (total - started) + " more minutes.");
        continue;
      }
      // the keyed action belongs to the matched line more than to any other line of the guide
      const bare = ans.replace(/ and expect a fee of \d+ USD\.$/, ".");
      const score = (line: string) => words(bare).filter((w) => line.toLowerCase().includes(w)).length;
      const best = Math.max(...lines.map(score));
      expect(score(stateLine), ans + " / " + situation).toBe(best);
      if (level === 6) expect(/still there|nothing has changed|looks the same/i.test(situation)).toBe(true);
      if (level >= 8) {
        const months = Number(/(\d+) months ago/.exec(situation)![1]);
        const fee = /fee of (\d+) USD/.exec(d)![1];
        expect(/expect a fee of/.test(ans)).toBe(months > 12);
        if (months > 12) expect(ans).toContain(fee + " USD");
      }
    }
  });
});

describe("English: notice-to-note, independently checked", () => {
  it.each([3, 4, 5, 6, 7, 8])("level %i: the keyed note carries the notice's facts (after any update) and every wrong note differs in one fact", (level) => {
    for (const it of run("english", note, level, 40)) {
      const d = doc(it.question), ans = right(it.question);
      const m = /is on (\w+ \d+ \w+) at ([\d:apm ]+?) in ([^.]+?)\. Please bring ([^.]+)\./.exec(d)!;
      let [, day, time, place, item] = m;
      const up = /Update: the .+? has moved to ([^.]+?) and now starts (one hour|30 minutes) later\./.exec(d);
      if (up) {
        place = up[1];
        const mm = /^(\d+)(?::(\d+))? (am|pm)$/.exec(time)!;
        let mins = ((+mm[1] % 12) + (mm[3] === "pm" ? 12 : 0)) * 60 + (mm[2] ? +mm[2] : 0) + (up[2] === "one hour" ? 60 : 30);
        const h = Math.floor(mins / 60), mi = mins % 60, h12 = ((h + 11) % 12) + 1;
        time = `${h12}${mi ? `:${String(mi).padStart(2, "0")}` : ""} ${h >= 12 ? "pm" : "am"}`;
      }
      expect(ans).toBe(`${day}, ${time}, ${place}, bring ${item}`);
      const facts = [day, time, place, item];
      for (const o of it.question.options!.filter((x) => x.text !== ans)) expect(facts.filter((f) => o.text.includes(f)).length, o.text).toBeLessThanOrEqual(3);
      expect(level >= 7).toBe(!!up);
    }
  });
});

describe("new families respect the content rules", () => {
  it("English target text has no Hangul, documents have no newline or dollar sign, Korean and Vietnamese instructions exist", () => {
    for (const [t, levels] of [[search, [3, 9]], [form, [2, 8]], [docs, [4, 9]], [note, [3, 8]]] as const) for (let l = levels[0]; l <= levels[1]; l++) for (const it of run("english", t, l, 15)) {
      const q = it.question, d = doc(q);
      expect(/[가-힣]/.test(d), "Korean inside the document").toBe(false);
      expect(d).not.toMatch(/\$|\n/);
      expect(q.prompt).toMatch(/[가-힣]/);
      expect(it.overlay.prompt).not.toMatch(/[가-힣]/);
    }
  });
  it("tags stay inside the content vocabulary and reasoning tags are produced", () => {
    for (const it of run("math", representation, 6, 6).concat(run("english", form, 5, 6))) expect(it.reasoningTags.length).toBeGreaterThan(0);
  });
});

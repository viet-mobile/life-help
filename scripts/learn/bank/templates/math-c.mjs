import { T, ONE, join, round, gcd } from "../util.mjs";

const F = (steps, abstraction, context, novelty, recall, distractor, numberSize) => ({ steps, abstraction, context, novelty, recall, distractor, numberSize });

/* ------------------------------------------------------------------ 18. multiple representations: table <-> rule <-> value */
const rulesFor = (rand, level) => {
  if (level <= 4) {
    const a = rand.int(3, 14);
    return { good: { text: `y = ${a}x`, f: (x) => a * x }, bad: [{ text: `y = x + ${a}`, f: (x) => x + a }, { text: `y = ${a}x + ${a}`, f: (x) => a * x + a }, { text: `y = ${a + 1}x`, f: (x) => (a + 1) * x }, { text: `y = ${a}x - 1`, f: (x) => a * x - 1 }], steps: 2, abstraction: 1 };
  }
  if (level <= 6) {
    const a = rand.int(2, 9), b = rand.int(2, 12);
    return { good: { text: `y = ${a}x + ${b}`, f: (x) => a * x + b }, bad: [{ text: `y = ${b}x + ${a}`, f: (x) => b * x + a }, { text: `y = ${a + b}x`, f: (x) => (a + b) * x }, { text: `y = ${a}x + ${b + 1}`, f: (x) => a * x + b + 1 }, { text: `y = ${a + 1}x + ${b - 1}`, f: (x) => (a + 1) * x + b - 1 }], steps: 3, abstraction: 2 };
  }
  const a = rand.int(1, 4), b = rand.int(1, 12);
  const s = (k) => (k === 1 ? "" : String(k));
  return { good: { text: `y = ${s(a)}x² + ${b}`, f: (x) => a * x * x + b }, bad: [{ text: `y = ${s(a)}x + ${b}`, f: (x) => a * x + b }, { text: `y = ${s(a * 2)}x + ${b}`, f: (x) => a * 2 * x + b }, { text: `y = (${s(a)}x + ${b})²`, f: (x) => (a * x + b) ** 2 }, { text: `y = ${s(a)}x² + ${b + 1}`, f: (x) => a * x * x + b + 1 }], steps: 4, abstraction: 3 };
};

/** rubric features per level (the engine keeps an item only when the rubric level is within one of the requested level) */
const repFeatures = (level, ask) => level <= 3 ? F(2, 0, 1, 1, 0, 0, 1) : level === 4 ? F(2, 1, 1, 1, 0, 2, 1) : level === 5 ? F(3, 1, 1, 1, 0, 3, 1) : level === 6 ? F(ask ? 4 : 3, 2, 1, 1, 0, 3, ask ? 2 : 1) : level === 7 ? F(4, 2, 1, 2, 0, 3, ask ? 2 : 1) : F(4, 3, 1, 2, 0, 3, 2);

export const representation = {
  id: "representation-match", short: "rep", cognitive: "ANALYZE", levels: [3, 8], title: T("표와 식을 오가며 규칙 찾기", "Chuyển giữa bảng và công thức để tìm quy luật"),
  make(rand, level) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const r = rulesFor(rand, level);
      const XS = level <= 4 ? [[1, 2, 3, 4], [2, 3, 4, 5], [1, 3, 5, 7], [2, 4, 6, 8], [5, 10, 15, 20]] : [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6], [1, 3, 5, 7, 9], [2, 4, 6, 8, 10], [3, 4, 5, 6, 7]];
      const xs = rand.pick(XS);
      const ys = xs.map(r.good.f);
      // a distractor must fail somewhere, and the right rule must fit every pair
      const bad = rand.sample(r.bad.filter((b, i, all) => all.findIndex((c) => c.text === b.text) === i && xs.some((x) => b.f(x) !== r.good.f(x))), 3);
      if (bad.length < 3 || !xs.every((x, i) => r.good.f(x) === ys[i])) continue;
      // trap: at least one wrong rule fits the first pair (so checking one pair is not enough)
      if (!bad.some((b) => b.f(xs[0]) === ys[0]) && level >= 5) continue;
      const table = T(`x가 ${xs.join(", ")}일 때 y는 차례로 ${ys.join(", ")}입니다.`, `Khi x lần lượt là ${xs.join(", ")} thì y lần lượt là ${ys.join(", ")}.`);
      const far = rand.int(9, 14);
      const ask = level >= 6 && rand.chance(0.5);
      const features = repFeatures(level, ask);
      if (ask) {
        return { type: "numeric", prompt: join(T(`${table.ko} 모든 짝을 만족하는 규칙을 찾은 뒤, x = ${far}일 때 y의 값을 구하세요.`, `${table.vi} Hãy tìm quy luật đúng với mọi cặp rồi tính y khi x = ${far}.`), ONE), value: r.good.f(far), hints: [T("첫 짝 하나만 맞는 식은 많아요. 모든 짝을 확인해요.", "Nhiều công thức chỉ đúng với cặp đầu tiên. Hãy kiểm tra mọi cặp."), T("규칙을 찾은 뒤 x에 값을 넣어요.", "Tìm ra quy luật rồi thay giá trị của x.")], expl: T(`모든 짝에 맞는 규칙은 ${r.good.text} 이므로 x = ${far}일 때 y = ${r.good.f(far)}`, `Quy luật đúng với mọi cặp là ${r.good.text} nên khi x = ${far} thì y = ${r.good.f(far)}`), tags: ["multistep", "reasoning"], features, verify: () => xs.every((x, i) => r.good.f(x) === ys[i]) && bad.every((b) => xs.some((x) => b.f(x) !== r.good.f(x))) };
      }
      return { type: "multiple_choice", prompt: T(`${table.ko} 모든 짝에 맞는 규칙은 어느 것인가요?`, `${table.vi} Quy luật nào đúng với mọi cặp?`), right: r.good.text, wrong: bad.map((b) => b.text), hints: [T("첫 짝 하나만 맞는 식은 많아요. 모든 짝을 확인해요.", "Nhiều công thức chỉ đúng với cặp đầu tiên. Hãy kiểm tra mọi cặp."), T("x가 커질 때 y가 얼마씩 변하는지 살펴요.", "Xem y thay đổi bao nhiêu khi x tăng.")], expl: T(`모든 짝에 맞는 규칙은 ${r.good.text}`, `Quy luật đúng với mọi cặp là ${r.good.text}`), tags: ["reasoning"], features, verify: () => xs.every((x, i) => r.good.f(x) === ys[i]) && bad.every((b) => xs.some((x) => b.f(x) !== r.good.f(x))) };
    }
    throw new Error("representation-match: could not build a distinguishing set");
  },
};

/* ------------------------------------------------------------------ 19. strategy: work backwards */
const OPS = [
  { id: "mul", ko: (k) => `${k}배 하고`, vi: (k) => `nhân với ${k}`, apply: (v, k) => v * k, undo: (v, k) => v / k, arg: (rand) => rand.int(2, 6) },
  { id: "add", ko: (k) => `${k}을(를) 더하고`, vi: (k) => `cộng thêm ${k}`, apply: (v, k) => v + k, undo: (v, k) => v - k, arg: (rand) => rand.int(3, 25) },
  { id: "sub", ko: (k) => `${k}을(를) 빼고`, vi: (k) => `trừ đi ${k}`, apply: (v, k) => v - k, undo: (v, k) => v + k, arg: (rand) => rand.int(2, 15) },
  { id: "div", ko: (k) => `${k}으로 나누고`, vi: (k) => `chia cho ${k}`, apply: (v, k) => v / k, undo: (v, k) => v * k, arg: (rand) => rand.int(2, 5) },
];

export const backward = {
  id: "backward-reasoning", short: "bwd", cognitive: "ANALYZE", levels: [3, 8], title: T("거꾸로 생각해 처음 수 찾기", "Suy ngược để tìm số ban đầu"),
  make(rand, level) {
    const k = level <= 4 ? 2 : level <= 6 ? 3 : level === 7 ? 4 : 5;
    for (let attempt = 0; attempt < 60; attempt++) {
      let v = rand.int(3, level <= 4 ? 20 : 40);
      const start = v, steps = [];
      let ok = true;
      for (let i = 0; i < k && ok; i++) {
        const op = rand.pick(OPS.filter((o) => !(steps.length && steps[steps.length - 1].op.id === o.id)));
        const arg = op.arg(rand);
        if (op.id === "div" && v % arg !== 0) { ok = false; break; }
        if (op.id === "sub" && v - arg < 1) { ok = false; break; }
        v = op.apply(v, arg);
        if (v > 5000) ok = false;
        steps.push({ op, arg });
      }
      if (!ok || steps.length < k || !Number.isInteger(v)) continue;
      const name = rand.pick(["Mina", "Jun", "Hana", "Minh", "Lan", "Sora"]);
      const ko = steps.map((s) => s.op.ko(s.arg)), vi = steps.map((s) => s.op.vi(s.arg));
      // reading the steps in order and undoing them in reverse order must return the start
      let back = v; for (let i = steps.length - 1; i >= 0; i--) back = steps[i].op.undo(back, steps[i].arg);
      if (back !== start) continue;
      const trail = [v]; for (let i = steps.length - 1; i >= 0; i--) trail.push(steps[i].op.undo(trail[trail.length - 1], steps[i].arg));
      return {
        type: "numeric",
        prompt: join(T(`${name}은(는) 어떤 수를 떠올렸습니다. 그 수를 ${ko.join(" ").replace(/고$/, "면")} 결과가 ${v}입니다. 처음 떠올린 수는 얼마인가요?`, `${name} nghĩ ra một số. Sau khi lấy số đó ${vi.join(", rồi ")} thì được ${v}. Số ban đầu là bao nhiêu?`), ONE),
        value: start,
        hints: [T("일어난 일을 거꾸로 되돌려 보세요. 더하기는 빼기로, 곱하기는 나누기로 되돌려요.", "Hãy làm ngược lại: cộng thì trừ, nhân thì chia."), T("마지막에 한 일부터 차례로 되돌려요.", "Hoàn tác từ bước cuối cùng trở về trước.")],
        expl: T(`결과 ${v}에서 거꾸로 되돌리면 ${trail.join(" → ")}, 처음 수는 ${start}`, `Từ kết quả ${v} làm ngược: ${trail.join(" → ")}, số ban đầu là ${start}`),
        tags: ["multistep", "reasoning"],
        features: level <= 3 ? F(2, 0, 1, 1, 0, 0, 1) : level === 4 ? F(2, 0, 1, 2, 0, 0, 1) : level === 5 ? F(3, 0, 1, 2, 0, 0, 1) : level === 6 ? F(3, 1, 1, 3, 0, 0, 2) : level === 7 ? F(4, 1, 1, 3, 0, 0, 2) : F(5, 2, 1, 3, 0, 1, 2),
        verify: () => { let x = start; for (const s of steps) x = s.op.apply(x, s.arg); return x === v && back === start && round(back) === start; },
      };
    }
    throw new Error("backward-reasoning: could not build a chain with whole numbers");
  },
};

/* ------------------------------------------------------------------ 20. error diagnosis: which step of a worked solution has the slip? */
const LADDER = { 2: F(1, 0, 1, 0, 0, 1, 0), 3: F(1, 0, 2, 1, 0, 1, 0), 4: F(2, 0, 3, 1, 0, 1, 0), 5: F(3, 0, 3, 1, 0, 2, 0) };
const stepKo = (n, t) => t.ko ?? t;
export const slip = {
  id: "find-the-slip", short: "slp", cognitive: "ANALYZE", levels: [2, 5], title: T("풀이에서 틀린 단계 찾기", "Tìm bước sai trong lời giải"),
  make(rand, level) {
    const kind = level <= 2 ? "add2" : level === 3 ? rand.pick(["add3", "mul"]) : level === 4 ? rand.pick(["mul", "frac"]) : rand.pick(["frac", "unit"]);
    let head, steps; // steps: [{ ko, vi, claim, truth }]
    if (kind === "add2" || kind === "add3") {
      const hundreds = kind === "add3";
      let a, b;
      for (;;) {
        a = hundreds ? rand.int(120, 480) : rand.int(21, 69); b = hundreds ? rand.int(130, 480) : rand.int(21, 69);
        const tens = Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10 + 1;
        if (a % 10 + b % 10 >= 10 && (!hundreds || tens < 10)) break;
      }
      const o = (a % 10) + (b % 10), ta = Math.floor(a / 10) % 10, tb = Math.floor(b / 10) % 10, t = ta + tb + 1;
      head = T(a + " + " + b, a + " + " + b);
      steps = [
        { ko: (a % 10) + " + " + (b % 10) + " = " + o + " (일의 자리 " + (o % 10) + ", 올림 1)", vi: (a % 10) + " + " + (b % 10) + " = " + o + " (viết " + (o % 10) + ", nhớ 1)", claim: o, truth: o },
        { ko: ta + " + " + tb + " + 1 = " + t + (hundreds ? " (십의 자리 " + t + ")" : ""), vi: ta + " + " + tb + " + 1 = " + t + (hundreds ? " (hàng chục " + t + ")" : ""), claim: t, truth: t },
      ];
      if (hundreds) { const h = Math.floor(a / 100) + Math.floor(b / 100); steps.push({ ko: Math.floor(a / 100) + " + " + Math.floor(b / 100) + " = " + h + " (백의 자리)", vi: Math.floor(a / 100) + " + " + Math.floor(b / 100) + " = " + h + " (hàng trăm)", claim: h, truth: h }); }
      steps.push({ ko: "답: " + (a + b), vi: "Đáp số: " + (a + b), claim: a + b, truth: a + b });
      if (!hundreds) steps.push({ ko: "검산: " + (a + b) + " - " + b + " = " + a, vi: "Kiểm tra: " + (a + b) + " - " + b + " = " + a, claim: a, truth: a });
    } else if (kind === "mul") {
      const a = rand.int(12, 79), d = rand.int(3, 9), ones = (a % 10) * d, tens = Math.floor(a / 10) * d + Math.floor(ones / 10);
      head = T(a + " × " + d, a + " × " + d);
      steps = [
        { ko: (a % 10) + " × " + d + " = " + ones + " (일의 자리 " + (ones % 10) + ", 올림 " + Math.floor(ones / 10) + ")", vi: (a % 10) + " × " + d + " = " + ones + " (viết " + (ones % 10) + ", nhớ " + Math.floor(ones / 10) + ")", claim: ones, truth: ones },
        { ko: Math.floor(a / 10) + " × " + d + " + " + Math.floor(ones / 10) + " = " + tens, vi: Math.floor(a / 10) + " × " + d + " + " + Math.floor(ones / 10) + " = " + tens, claim: tens, truth: tens },
        { ko: "답: " + a * d, vi: "Đáp số: " + a * d, claim: a * d, truth: a * d },
        { ko: "검산: " + a * d + " ÷ " + d + " = " + a, vi: "Kiểm tra: " + a * d + " ÷ " + d + " = " + a, claim: a, truth: a },
      ];
    } else if (kind === "frac") {
      const b = rand.pick([2, 3, 4, 5, 6]), d = rand.pick([2, 3, 4, 5, 6].filter((x) => x !== b)), a = rand.int(1, b - 1), c = rand.int(1, d - 1);
      const l = (b * d) / gcd(b, d), n1 = (a * l) / b, n2 = (c * l) / d, num = n1 + n2;
      head = T(a + "/" + b + " + " + c + "/" + d, a + "/" + b + " + " + c + "/" + d);
      steps = [
        { ko: "분모 " + b + "와 " + d + "의 최소공배수는 " + l, vi: "Mẫu chung nhỏ nhất của " + b + " và " + d + " là " + l, claim: l, truth: l },
        { ko: "통분: " + n1 + "/" + l + " + " + n2 + "/" + l, vi: "Quy đồng: " + n1 + "/" + l + " + " + n2 + "/" + l, claim: n1, truth: n1, mutate: (w) => ({ ko: "통분: " + w + "/" + l + " + " + n2 + "/" + l, vi: "Quy đồng: " + w + "/" + l + " + " + n2 + "/" + l }) },
        { ko: "분자끼리 더하면 " + n1 + " + " + n2 + " = " + num + ", 답: " + num + "/" + l, vi: "Cộng tử số: " + n1 + " + " + n2 + " = " + num + ", đáp số: " + num + "/" + l, claim: num, truth: num },
        { ko: "약분: " + num + "/" + l + " = " + num / gcd(num, l) + "/" + l / gcd(num, l), vi: "Rút gọn: " + num + "/" + l + " = " + num / gcd(num, l) + "/" + l / gcd(num, l), claim: l / gcd(num, l), truth: l / gcd(num, l) },
      ];
    } else {
      const km = rand.int(11, 49) / 10, per = rand.int(3, 9), m = Math.round(km * 1000), tot = m * per;
      head = T(km + " km 길이의 길을 " + per + "번 오가는 거리는 몇 m인가요?", "Quãng đường dài " + km + " km đi " + per + " lần là bao nhiêu mét?");
      steps = [
        { ko: "1 km = 1000 m 이므로 " + km + " km = " + m + " m", vi: "1 km = 1000 m nên " + km + " km = " + m + " m", claim: m, truth: m },
        { ko: m + " × " + per + " = " + tot, vi: m + " × " + per + " = " + tot, claim: tot, truth: tot },
        { ko: "답: " + tot + " m", vi: "Đáp số: " + tot + " m", claim: tot, truth: tot },
        { ko: "검산: " + tot + " ÷ " + per + " = " + m, vi: "Kiểm tra: " + tot + " ÷ " + per + " = " + m, claim: m, truth: m },
      ];
    }
    // inject exactly one slip into a step whose claim is a number
    const at = rand.int(0, steps.length - 1), s = steps[at];
    const wrongClaim = s.truth + rand.pick([-10, -1, 1, 10, 100].filter((d) => s.truth + d > 0));
    const swap = (txt, from, to) => {
      // an equation is changed where it is STATED (the number right after the last "= "); a step without an equation changes its last occurrence
      const eq = new RegExp("= " + from + "(?![\d./])", "g"); let last = -1, m;
      while ((m = eq.exec(txt))) last = m.index + 2;
      if (last >= 0) return txt.slice(0, last) + to + txt.slice(last + String(from).length);
      const re = new RegExp("(?<![\d/.])" + from + "(?![\d.])", "g"); last = -1;
      while ((m = re.exec(txt))) last = m.index;
      return last < 0 ? txt : txt.slice(0, last) + to + txt.slice(last + String(from).length);
    };
    steps[at] = { ...s, claim: wrongClaim, ...(s.mutate ? s.mutate(wrongClaim) : { ko: swap(s.ko, s.truth, wrongClaim), vi: swap(s.vi, s.truth, wrongClaim) }) };
    if (steps[at].ko === s.ko || steps[at].vi === s.vi) return slip.make(rand, level);
    const right = "Step " + (at + 1);
    const lines = steps.map((x, i) => ({ ko: "단계 " + (i + 1) + ": " + x.ko, vi: "Bước " + (i + 1) + ": " + x.vi }));
    return {
      type: "choice_fixed", items: steps.map((_, i) => "Step " + (i + 1)), correct: at,
      prompt: T((kind === "unit" ? "" : "계산: ") + head.ko + " 한 학생의 풀이입니다. " + lines.map((l) => l.ko).join(" / ") + " 틀린 부분이 있는 단계는 어느 것인가요?", (kind === "unit" ? "" : "Tính: ") + head.vi + " Lời giải của một bạn học sinh: " + lines.map((l) => l.vi).join(" / ") + " Bước nào có chỗ sai?"),
      hints: [T("각 단계의 계산을 직접 다시 해 보세요.", "Hãy tự tính lại từng bước."), T("답에서 거꾸로 확인하거나, 앞 단계와 이어지는지 살펴요.", "Kiểm tra ngược từ đáp số hoặc xem bước này có khớp với bước trước không.")],
      expl: T("단계 " + (at + 1) + "의 계산이 틀렸어요. 올바른 값은 " + s.truth + "입니다.", "Bước " + (at + 1) + " tính sai. Giá trị đúng là " + s.truth + "."),
      tags: ["reasoning"], features: LADDER[level],
      verify: () => steps.filter((x) => x.claim !== x.truth).length === 1 && steps[at].claim !== steps[at].truth && right === "Step " + (at + 1),
    };
  },
};
void stepKo;

export const MATH_C = [representation, backward, slip];

// 직무 수학 (12직수): units, estimation by rounding up, ratios, percentages, table rules, linear equation / inequality, composite figures,
// counting and chance in work situations. Only parts with a numeric answer (see SPEC.md).
import { Q, C as comb, tfrac } from "../lib.mjs";

const r2 = (x) => Math.round(x * 100) / 100;

export const TEMPLATES = {
  job_flowUnits: {
    ko: ["정수기 노즐에서 1분에 ${r}$ mL의 물이 일정하게 나옵니다. 이 노즐을 ${h}$시간 ${m}$분 동안 계속 열어 두면 나오는 물은 모두 몇 L인가요? (1 L = 1000 mL이고, 숫자만 쓰세요)", ["시간을 모두 분으로 바꿔 열어 둔 시간을 구해요.", "(분당 양)×(분)으로 mL를 구한 뒤 1000으로 나누어 L로 바꿔요."], "열어 둔 시간은 ${h}\\times60+{m}={tot}$분이고, 나온 물은 ${r}\\times{tot}={ml}$ mL입니다. ${ml}\\div1000={ans}$ L입니다."],
    en: ["A water dispenser nozzle delivers ${r}$ mL of water per minute at a constant rate. If it is kept open for ${h}$ hours ${m}$ minutes, how many litres of water come out in total? (1 L = 1000 mL. Digits only.)", ["Convert the whole time into minutes.", "Multiply (amount per minute)×(minutes) to get mL, then divide by 1000 to get L."], "The time is ${h}\\times60+{m}={tot}$ minutes, so ${r}\\times{tot}={ml}$ mL come out. ${ml}\\div1000={ans}$ L."],
  },
  job_boxesCeil: {
    ko: ["부품 ${n}$개를 한 상자에 ${k}$개씩 담아 포장하고, 상자는 한 팔레트에 ${m}$개씩 쌓아 운반합니다. 남는 부품이 있어도 상자 하나에 담고, 남는 상자가 있어도 팔레트 하나에 쌓습니다. 필요한 팔레트는 최소 몇 개인가요? (숫자만 쓰세요)", ["나누어떨어지지 않으면 남는 것을 담을 상자(팔레트)가 하나 더 필요해요.", "먼저 필요한 상자 수를 구하고, 같은 방식으로 팔레트 수를 구해요."], "상자는 ${n}\\div{k}$를 올림한 ${bx}$개가 필요하고, 팔레트는 ${bx}\\div{m}$를 올림한 ${ans}$개가 필요합니다."],
    en: ["${n}$ parts are packed ${k}$ to a box, and boxes are stacked ${m}$ to a pallet for transport. A leftover part still goes into a box of its own, and leftover boxes still go onto a pallet. What is the smallest number of pallets needed? (digits only)", ["If the division is not exact, one more box (pallet) is needed for the remainder.", "Find the number of boxes first, then the number of pallets in the same way."], "The number of boxes is ${n}\\div{k}$ rounded up, ${bx}$; the number of pallets is ${bx}\\div{m}$ rounded up, ${ans}$."],
  },
  job_ratioChain: {
    ko: ["세 공정 A, B, C의 하루 생산량의 비가 A : B $={a}:{b}$, B : C $={c}:{d}$입니다. 세 공정의 하루 총생산량이 ${T}$개일 때, 공정 C의 하루 생산량은 몇 개인가요? (숫자만 쓰세요)", ["B를 기준으로 두 비를 한 줄로 이어서 A : B : C를 만들어요.", "A : B : C의 비의 합으로 총생산량 ${T}$개를 나눠 한 몫의 크기를 구해요."], "B의 비율 값을 맞추면 A : B : C $={pa}:{pb}:{pc}$입니다. 비의 합은 ${S}$이므로 한 몫은 ${T}\\div{S}={u}$개이고, C는 ${pc}\\times{u}={ans}$개입니다."],
    en: ["Three processes A, B, C have daily outputs in the ratios A : B $={a}:{b}$ and B : C $={c}:{d}$. The total daily output of the three is ${T}$ items. How many items does process C make per day? (digits only)", ["Use B as the link to join the two ratios into one ratio A : B : C.", "Divide the total ${T}$ by the sum of the parts of A : B : C to get the size of one part."], "Matching the value of B gives A : B : C $={pa}:{pb}:{pc}$. The parts sum to ${S}$, so one part is ${T}\\div{S}={u}$ items and C makes ${pc}\\times{u}={ans}$ items."],
  },
  job_markupProfit: {
    ko: ["가게에서 원가가 ${c}$원인 물건에 원가의 ${u}$%를 이윤으로 붙여 정가를 정하고, 정가의 ${d}$%를 할인하여 ${n}$개를 모두 팔았습니다. 원가에 대한 이익의 합계는 모두 몇 원인가요? (숫자만 쓰세요)", ["정가는 원가의 $(100+{u})$%예요.", "판매 가격은 정가의 $(100-{d})$%이고, 한 개의 이익은 (판매 가격)−(원가)예요."], "정가는 ${c}\\times\\frac{{100+u}}{100}={lp}$원, 판매 가격은 ${lp}\\times\\frac{{100-d}}{100}={sp}$원입니다. 한 개의 이익은 ${sp}-{c}={g}$원이므로 ${n}$개의 이익은 ${g}\\times{n}={ans}$원입니다."],
    en: ["A shop sets the list price of an item costing ${c}$ won by adding ${u}$% of the cost as margin, then sells all ${n}$ items at ${d}$% off the list price. What is the total profit over the cost, in won? (digits only)", ["The list price is $(100+{u})$% of the cost.", "The selling price is $(100-{d})$% of the list price, and the profit per item is (selling price)−(cost)."], "The list price is ${c}\\times\\frac{{100+u}}{100}={lp}$ won and the selling price is ${lp}\\times\\frac{{100-d}}{100}={sp}$ won. The profit per item is ${sp}-{c}={g}$ won, so for ${n}$ items it is ${g}\\times{n}={ans}$ won."],
  },
  job_tableRule: {
    ko: ["장비 대여 요금표입니다. 대여 시간이 1시간 늘어날 때마다 요금은 일정한 금액만큼 늘어납니다. ${x1}$시간은 ${y1}$원, ${x2}$시간은 ${y2}$원, ${x3}$시간은 ${y3}$원입니다. ${N}$시간 대여할 때의 요금은 몇 원인가요? (숫자만 쓰세요)", ["표에서 시간이 1시간 늘 때 요금이 얼마나 늘어나는지 구해요.", "요금을 (1시간당 늘어나는 금액)×(시간)+(기본 금액) 꼴로 나타내 기본 금액을 구해요."], "1시간당 ${k}$원씩 늘어나므로 요금은 $y={k}x+{b}$ 꼴입니다(${x1}$시간일 때 ${y1}$원이 되도록 기본 금액 ${b}$원을 얻음). ${N}$시간은 ${k}\\times{N}+{b}={ans}$원입니다."],
    en: ["Here is the rental price list of a machine. For each extra hour, the price increases by the same amount. ${x1}$ hours cost ${y1}$ won, ${x2}$ hours cost ${y2}$ won and ${x3}$ hours cost ${y3}$ won. What is the price for ${N}$ hours, in won? (digits only)", ["From the table, find how much the price rises per extra hour.", "Write the price as (increase per hour)×(hours)+(base amount) and find the base amount."], "The price rises by ${k}$ won per hour, so $y={k}x+{b}$ (the base amount ${b}$ won makes ${x1}$ hours cost ${y1}$ won). For ${N}$ hours: ${k}\\times{N}+{b}={ans}$ won."],
  },
  job_planCompare: {
    ko: ["요금제 A는 월 기본요금 ${f1}$원에 이용 1회당 ${p1}$원이고, 요금제 B는 월 기본요금 ${f2}$원에 이용 1회당 ${p2}$원입니다. 한 달 이용 횟수를 $x$회($x$는 자연수)라 할 때, 요금제 B의 한 달 요금이 요금제 A보다 낮아지는 가장 작은 $x$는? (숫자만 쓰세요)", ["두 요금제의 한 달 요금을 $x$에 대한 식으로 나타내요.", "(B의 요금)<(A의 요금)인 부등식을 풀어 $x$의 범위를 구해요."], "A의 요금은 ${f1}+{p1}x$, B의 요금은 ${f2}+{p2}x$입니다. ${f2}+{p2}x<{f1}+{p1}x$에서 ${dl}x>{df}$, 곧 $x>\\frac{{df}}{{dl}}$입니다. 이를 만족하는 가장 작은 자연수는 ${ans}$입니다."],
    en: ["Plan A costs a monthly fee of ${f1}$ won plus ${p1}$ won per use; plan B costs a monthly fee of ${f2}$ won plus ${p2}$ won per use. If you use the service $x$ times a month ($x$ is a natural number), what is the smallest $x$ for which plan B's monthly cost is lower than plan A's? (digits only)", ["Write the monthly cost of each plan as an expression in $x$.", "Solve the inequality (cost of B) < (cost of A) for $x$."], "Plan A costs ${f1}+{p1}x$ and plan B costs ${f2}+{p2}x$. From ${f2}+{p2}x<{f1}+{p1}x$ we get ${dl}x>{df}$, i.e. $x>\\frac{{df}}{{dl}}$. The smallest natural number satisfying this is ${ans}$."],
  },
  job_workTogether: {
    ko: ["작업자 A는 시간당 ${a}$개, 작업자 B는 시간당 ${b}$개의 제품을 일정한 속도로 만듭니다. A가 먼저 일을 시작하고 ${h}$시간 뒤부터 B가 함께 일합니다. 두 사람이 만든 제품의 합이 정확히 ${N}$개가 될 때까지 A가 일한 시간은 모두 몇 시간인가요? (숫자만 쓰세요)", ["A가 일한 시간을 $t$시간이라 하면 B가 일한 시간은 $t-{h}$시간이에요.", "(A가 만든 개수)+(B가 만든 개수)$={N}$인 일차방정식을 세워요."], "A가 $t$시간 일하면 B는 $t-{h}$시간 일하므로 ${a}t+{b}(t-{h})={N}$입니다. 정리하면 ${ab}t={tot}$이므로 $t={ans}$시간입니다."],
    en: ["Worker A makes ${a}$ items per hour and worker B makes ${b}$ items per hour, each at a constant speed. A starts first and B joins ${h}$ hours later. How many hours has A worked in total when the two together have made exactly ${N}$ items? (digits only)", ["If A has worked $t$ hours, B has worked $t-{h}$ hours.", "Set up the linear equation (items by A)+(items by B)$={N}$."], "If A works $t$ hours, B works $t-{h}$ hours, so ${a}t+{b}(t-{h})={N}$. This simplifies to ${ab}t={tot}$, so $t={ans}$ hours."],
  },
  job_floorPlan: {
    ko: ["직사각형 모양의 방의 가로가 ${a}$ m, 세로가 ${b}$ m입니다. 가로 벽 한쪽 중간에 폭 ${d}$ m, 깊이 ${c}$ m인 직사각형 모양의 공간이 바깥쪽으로 붙어 있습니다(${d}<{a}$이고 방의 모서리에는 닿지 않습니다). 방 안쪽 벽 전체를 따라 걸레받이를 붙이는데, 폭 ${w}$ m인 출입문 자리에는 붙이지 않습니다. 필요한 걸레받이의 길이는 몇 m인가요? (숫자만 쓰세요)", ["공간이 붙은 도형의 둘레는 직사각형의 둘레와 어떻게 달라지는지 그려 보며 생각해요.", "바깥쪽으로 튀어나온 부분은 폭 ${d}$ m인 변이 없어지는 대신 깊이 ${c}$ m인 변이 두 개 생겨요."], "방 전체의 둘레는 $2({a}+{b})+2\\times{c}={per}$ m입니다(폭 ${d}$ m인 변이 깊이 ${c}$ m인 두 변과 폭 ${d}$ m인 변으로 바뀌므로 ${c}$ m인 변 두 개만큼 늘어납니다). 출입문 자리 ${w}$ m를 빼면 ${per}-{w}={ans}$ m입니다."],
    en: ["A rectangular room is ${a}$ m wide and ${b}$ m deep. A rectangular alcove ${d}$ m wide and ${c}$ m deep is attached outward in the middle of one of the walls of length ${a}$ (${d}<{a}$, and it does not touch the corners of the room). Skirting board is fixed along the whole inner wall, except for a door opening ${w}$ m wide. How many metres of skirting board are needed? (digits only)", ["Sketch the shape and compare its perimeter with that of the plain rectangle.", "The wall of length ${d}$ m is replaced by two sides of ${c}$ m and one side of ${d}$ m."], "The whole perimeter is $2({a}+{b})+2\\times{c}={per}$ m (the side of length ${d}$ is replaced by two sides of ${c}$ and one of ${d}$, so only the two sides of ${c}$ m are added). Subtracting the door ${w}$ m gives ${per}-{w}={ans}$ m."],
  },
  job_boxTunnel: {
    ko: ["가로 ${a}$ cm, 세로 ${b}$ cm, 높이 ${c}$ cm인 직육면체 모양의 나무 블록에, 윗면 중앙에서 아랫면까지 곧게 가로 ${p}$ cm, 세로 ${q}$ cm인 직육면체 모양의 구멍을 뚫었습니다(구멍은 블록의 옆면에 닿지 않습니다). 구멍 안쪽 면도 겉넓이에 포함할 때, 구멍이 뚫린 블록의 겉넓이는 몇 cm²인가요? (숫자만 쓰세요)", ["구멍이 뚫리면 윗면과 아랫면은 구멍의 단면만큼 줄어들어요.", "대신 구멍의 안쪽 옆면 네 개가 새로 생겨요."], "뚫기 전 겉넓이는 $2({a}\\times{b}+{b}\\times{c}+{c}\\times{a})={s0}$ cm²입니다. 윗면과 아랫면에서 ${p}\\times{q}$씩 두 번 빼고, 안쪽 옆면 $2({p}+{q})\\times{c}$를 더하면 ${s0}-{pq2}+{inn}={ans}$ cm²입니다."],
    en: ["A wooden block is a rectangular box ${a}$ cm long, ${b}$ cm wide and ${c}$ cm high. A rectangular hole ${p}$ cm by ${q}$ cm is drilled straight from the middle of the top face to the bottom face (the hole does not touch the side faces of the block). Counting the inner walls of the hole as part of the surface, what is the surface area of the block in cm²? (digits only)", ["Drilling removes a rectangle of the hole's cross-section from both the top and the bottom face.", "On the other hand, four new inner side faces appear."], "Before drilling, the surface area is $2({a}\\times{b}+{b}\\times{c}+{c}\\times{a})={s0}$ cm². Subtract ${p}\\times{q}$ twice for the top and bottom, and add the inner walls $2({p}+{q})\\times{c}$: ${s0}-{pq2}+{inn}={ans}$ cm²."],
  },
  job_scaleDrawing: {
    ko: ["축척이 $1:{k}$인 도면에서 직사각형 모양의 방이 가로 ${w}$ cm, 세로 ${h}$ cm로 그려져 있습니다. 실제 방의 넓이는 몇 m²인가요? (1 m = 100 cm이고, 숫자만 쓰세요)", ["축척 $1:{k}$이면 도면의 길이를 ${k}$배 하면 실제 길이가 돼요.", "실제 가로와 세로를 cm로 구한 뒤 m로 바꿔 곱해요."], "실제 가로는 ${w}\\times{k}={rw}$ cm$={rwm}$ m, 실제 세로는 ${h}\\times{k}={rh}$ cm$={rhm}$ m이므로 넓이는 ${rwm}\\times{rhm}={ans}$ m²입니다."],
    en: ["On a drawing with scale $1:{k}$, a rectangular room is drawn ${w}$ cm long and ${h}$ cm wide. What is the actual floor area of the room in m²? (1 m = 100 cm. Digits only.)", ["With scale $1:{k}$, multiplying a length on the drawing by ${k}$ gives the actual length.", "Find the actual length and width in cm, convert them to m, and multiply."], "The actual length is ${w}\\times{k}={rw}$ cm $={rwm}$ m and the actual width is ${h}\\times{k}={rh}$ cm $={rhm}$ m, so the area is ${rwm}\\times{rhm}={ans}$ m²."],
  },
  job_outfitCount: {
    ko: ["작업복 상의 ${s}$종과 하의 ${p}$종이 있고, 모자는 ${h}$종이 있습니다. 상의와 하의는 하나씩 고르고, 모자는 ${h}$종 중 하나를 쓰거나 쓰지 않을 수 있습니다. 안전 규정상 함께 입을 수 없는 (상의, 하의) 짝이 ${f}$가지 있을 때, 입을 수 있는 서로 다른 복장은 모두 몇 가지인가요? (숫자만 쓰세요)", ["먼저 입을 수 있는 (상의, 하의) 짝의 수를 구해요.", "모자는 ${h}$종 중 하나를 고르거나 쓰지 않는 경우까지 모두 몇 가지인지 세어 곱해요."], "(상의, 하의) 짝은 ${s}\\times{p}-{f}={ok}$가지이고, 모자는 쓰지 않는 경우를 포함해 ${h}+1={hh}$가지입니다. 곱의 법칙에 의해 ${ok}\\times{hh}={ans}$가지입니다."],
    en: ["There are ${s}$ work tops, ${p}$ work bottoms and ${h}$ hats. One top and one bottom are chosen, and one of the ${h}$ hats may be worn or no hat at all. If ${f}$ (top, bottom) pairs may not be worn together for safety reasons, how many different outfits are possible? (digits only)", ["First count the allowed (top, bottom) pairs.", "Count the hat choices, including wearing no hat, and multiply."], "The allowed (top, bottom) pairs number ${s}\\times{p}-{f}={ok}$; the hat choices, including no hat, number ${h}+1={hh}$. By the product rule, ${ok}\\times{hh}={ans}$."],
  },
  job_chanceDraw: {
    ko: ["상자에 부품이 ${n}$개 들어 있고, 그중 ${d}$개가 불량품입니다. 부품을 무작위로 동시에 2개 꺼낼 때, 적어도 1개가 불량품일 확률은? (소수로 써도 되고 3/4 처럼 분수로 써도 돼요)", ["꺼내는 모든 경우의 수는 ${n}$개 중 2개를 고르는 방법의 수예요.", "'적어도 1개가 불량품'의 반대는 '2개 모두 정상품'이에요."], "모든 경우는 $_{{n}}\\mathrm{C}_{2}={tot}$가지이고, 2개 모두 정상품인 경우는 $_{{g}}\\mathrm{C}_{2}={good}$가지입니다. 구하는 확률은 $1-\\frac{{good}}{{tot}}={fr}$입니다."],
    en: ["A box holds ${n}$ parts, of which ${d}$ are defective. Two parts are drawn at random at the same time. What is the probability that at least one of them is defective? (a decimal or a fraction like 3/4 is fine)", ["The number of all possible draws is the number of ways to choose 2 out of ${n}$.", "The opposite of 'at least one defective' is 'both are good'."], "There are $_{{n}}\\mathrm{C}_{2}={tot}$ draws in all, and $_{{g}}\\mathrm{C}_{2}={good}$ of them have two good parts. The probability is $1-\\frac{{good}}{{tot}}={fr}$."],
  },
};

export const GEN = {
  job_flowUnits: (r) => {
    const rate = r.int(15, 250), h = r.int(1, 6), m = r.pick([10, 15, 20, 30, 40, 45]);
    const tot = 60 * h + m;
    return { v: { r: rate, h, m, tot, ml: rate * tot }, ans: (rate * tot) / 1000 };
  },
  job_boxesCeil: (r) => {
    for (let g = 0; g < 500; g++) {
      const n = r.int(200, 5000), k = r.pick([12, 15, 18, 20, 24, 30, 36, 40]), m = r.pick([6, 8, 10, 12, 15, 20]);
      const bx = Math.ceil(n / k);
      if (n % k === 0 && bx % m === 0) continue;
      return { v: { n, k, m, bx }, ans: Math.ceil(bx / m) };
    }
    throw new Error("boxesCeil");
  },
  job_ratioChain: (r) => {
    for (let g = 0; g < 500; g++) {
      const a = r.int(1, 6), b = r.int(1, 6), c = r.int(1, 6), d = r.int(1, 6);
      if (a === b && c === d) continue;
      const pa = a * c, pb = b * c, pc = b * d, S = pa + pb + pc, u = r.int(2, 15);
      return { v: { a, b, c, d, T: S * u, pa, pb, pc, S, u }, ans: pc * u };
    }
    throw new Error("ratioChain");
  },
  job_markupProfit: (r) => {
    for (let g = 0; g < 2000; g++) {
      const c = 100 * r.int(5, 100), u = 5 * r.int(2, 10), d = 5 * r.int(1, 6), n = r.int(10, 200);
      const lp = new Q(c * (100 + u), 100), sp = lp.mul(new Q(100 - d, 100));
      if (!lp.isInt || !sp.isInt) continue;
      const gain = Number(sp.p) - c;
      if (gain <= 0) continue;
      return { v: { c, u, d, n, lp: Number(lp.p), sp: Number(sp.p), g: gain }, ans: gain * n };
    }
    throw new Error("markupProfit");
  },
  job_tableRule: (r) => {
    const k = 500 * r.int(4, 30), b = 500 * r.int(2, 30);
    const xs = new Set();
    while (xs.size < 3) xs.add(r.int(1, 9));
    const [x1, x2, x3] = [...xs].sort((p, q) => p - q);
    const N = r.int(10, 30);
    return { v: { x1, y1: k * x1 + b, x2, y2: k * x2 + b, x3, y3: k * x3 + b, N, k, b }, ans: k * N + b };
  },
  job_planCompare: (r) => {
    const dl = 100 * r.int(2, 20), t0 = r.int(3, 40);
    const frac = r.next() < 0.5;
    const df = dl * t0 + (frac ? 100 * r.int(1, dl / 100 - 1) : 0);
    const p2 = 100 * r.int(5, 30), p1 = p2 + dl, f1 = 1000 * r.int(3, 15), f2 = f1 + df;
    return { v: { f1, p1, f2, p2, dl, df }, ans: Math.floor(df / dl) + 1 };
  },
  job_workTogether: (r) => {
    const a = r.int(3, 12), b = r.int(3, 12), h = r.int(1, 4), t = h + r.int(2, 12);
    const N = a * t + b * (t - h);
    return { v: { a, b, h, N, ab: a + b, tot: N + b * h }, ans: t };
  },
  job_floorPlan: (r) => {
    const a = r.int(5, 12), b = r.int(3, 9), d = r.int(2, a - 3), c = r.int(1, 3), w = r.pick([0.8, 0.9, 1, 1.2, 1.5]);
    const per = 2 * (a + b) + 2 * c;
    return { v: { a, b, d, c, w, per }, ans: r2(per - w) };
  },
  job_boxTunnel: (r) => {
    const a = r.int(8, 30), b = r.int(8, 30), c = r.int(5, 25), p = r.int(2, a - 2), q = r.int(2, b - 2);
    const s0 = 2 * (a * b + b * c + c * a), inn = 2 * (p + q) * c;
    return { v: { a, b, c, p, q, s0, pq2: 2 * p * q, inn }, ans: s0 - 2 * p * q + inn };
  },
  job_scaleDrawing: (r) => {
    const k = r.pick([50, 100, 200, 500]), w = r.int(4, 24), h = r.int(3, 18);
    const rw = w * k, rh = h * k;
    return { v: { k, w, h, rw, rh, rwm: rw / 100, rhm: rh / 100 }, ans: (rw * rh) / 10000 };
  },
  job_outfitCount: (r) => {
    const s = r.int(3, 9), p = r.int(3, 9), h = r.int(2, 6), f = r.int(1, Math.min(8, s * p - 2));
    return { v: { s, p, h, f, ok: s * p - f, hh: h + 1 }, ans: (s * p - f) * (h + 1) };
  },
  job_chanceDraw: (r) => {
    const n = r.int(6, 12), d = r.int(1, 4);
    const tot = comb(n, 2), good = comb(n - d, 2);
    const num = tot - good;
    const q = new Q(num, tot);
    return { v: { n, d, g: n - d, tot, good, fr: tfrac(num, tot) }, ans: q.toNumber() };
  },
};

export const PLAN = [
  { skill: "m.el.job1", template: "job_flowUnits", levels: [1], count: 14, d: 2, standards: ["12직수01-03"], strategy: "compound-unit-conversion", evidence: "application" },
  { skill: "m.el.job1", template: "job_boxesCeil", levels: [1], count: 14, d: 2, standards: ["12직수01-02", "12직수01-01"], strategy: "round-up-chain", evidence: "application" },
  { skill: "m.el.job1", template: "job_ratioChain", levels: [1], count: 14, d: 3, standards: ["12직수02-01"], strategy: "joined-ratio", evidence: "application" },
  { skill: "m.el.job1", template: "job_markupProfit", levels: [1], count: 14, d: 3, standards: ["12직수02-02", "12직수01-01"], strategy: "successive-percent", evidence: "application" },
  { skill: "m.el.job1", template: "job_tableRule", levels: [1], count: 14, d: 3, standards: ["12직수02-03"], strategy: "table-to-linear-rule", evidence: "representation" },
  { skill: "m.el.job1", template: "job_planCompare", levels: [1], count: 14, d: 3, standards: ["12직수02-05"], strategy: "linear-inequality-threshold", evidence: "application" },
  { skill: "m.el.job1", template: "job_workTogether", levels: [1], count: 12, d: 3, standards: ["12직수02-05"], strategy: "linear-equation-staggered-start", evidence: "application" },
  { skill: "m.el.job2", template: "job_floorPlan", levels: [1], count: 14, d: 3, standards: ["12직수03-04"], strategy: "composite-perimeter", evidence: "application" },
  { skill: "m.el.job2", template: "job_boxTunnel", levels: [1], count: 14, d: 4, standards: ["12직수03-05"], strategy: "composite-solid-surface", evidence: "application" },
  { skill: "m.el.job2", template: "job_scaleDrawing", levels: [1], count: 12, d: 3, standards: ["12직수03-03"], strategy: "similarity-scale-area", evidence: "application" },
  { skill: "m.el.job2", template: "job_outfitCount", levels: [1], count: 14, d: 3, standards: ["12직수04-01"], strategy: "product-rule-with-exclusion", evidence: "counting" },
  { skill: "m.el.job2", template: "job_chanceDraw", levels: [1], count: 14, d: 3, standards: ["12직수04-02"], strategy: "complement-probability", evidence: "counting" },
];

import { T, tex, ONE, DEC, NAMES, GOODS, won, fracTex, round, gcd, join } from "../util.mjs";

const F = (steps, abstraction, context, novelty, recall, distractor, numberSize) => ({ steps, abstraction, context, novelty, recall, distractor, numberSize });
const cap = (x, hi) => Math.min(hi, Math.max(0, x));

/* ------------------------------------------------------------------ 1. facts that are answered from memory */
const CONV = [
  { l: 1, ko: "1 m는 몇 cm인가요?", vi: "1 m bằng bao nhiêu cm?", v: 100 }, { l: 1, ko: "1 kg은 몇 g인가요?", vi: "1 kg bằng bao nhiêu g?", v: 1000 },
  { l: 1, ko: "1 km는 몇 m인가요?", vi: "1 km bằng bao nhiêu m?", v: 1000 }, { l: 2, ko: "1시간은 몇 분인가요?", vi: "1 giờ bằng bao nhiêu phút?", v: 60 },
  { l: 2, ko: "1분은 몇 초인가요?", vi: "1 phút bằng bao nhiêu giây?", v: 60 }, { l: 2, ko: "1 L는 몇 mL인가요?", vi: "1 L bằng bao nhiêu mL?", v: 1000 },
  { l: 3, ko: "하루는 몇 시간인가요?", vi: "Một ngày có bao nhiêu giờ?", v: 24 }, { l: 3, ko: "1년은 몇 개월인가요?", vi: "Một năm có bao nhiêu tháng?", v: 12 },
  { l: 3, ko: "1 m²는 몇 cm²인가요?", vi: "1 m² bằng bao nhiêu cm²?", v: 10000 },
];
const PCT = [[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 8, 12.5], [3, 8, 37.5], [7, 10, 70]];
const factRecall = {
  id: "fact-recall", short: "fact", cognitive: "MEMORIZE", levels: [1, 3], title: T("외워서 푸는 기본 사실", "Sự kiện cơ bản cần ghi nhớ"),
  make(rand, level) {
    const kind = rand.pick(level === 1 ? ["mul", "conv"] : level === 2 ? ["mul", "div", "conv"] : ["sq", "pct", "conv"]);
    let prompt, value, expl, recall = 4;
    if (kind === "mul") { const lo = level === 1 ? 2 : 6, hi = level === 1 ? 5 : 9, a = rand.int(lo, hi), b = rand.int(lo, hi); value = a * b; prompt = T(`다음을 계산하세요: ${a} × ${b}`, `Tính: ${a} × ${b}`); expl = T(`${a} × ${b} = ${value}`, `${a} × ${b} = ${value}`); }
    else if (kind === "div") { const a = rand.int(6, 9), b = rand.int(6, 9); value = b; prompt = T(`다음을 계산하세요: ${a * b} ÷ ${a}`, `Tính: ${a * b} ÷ ${a}`); expl = T(`${a} × ${b} = ${a * b} 이므로 ${a * b} ÷ ${a} = ${b}`, `Vì ${a} × ${b} = ${a * b} nên ${a * b} ÷ ${a} = ${b}`); }
    else if (kind === "sq") { const n = rand.int(11, 15); value = n * n; prompt = T(`${n}의 제곱은 얼마인가요?`, `Bình phương của ${n} là bao nhiêu?`); expl = T(`${n} × ${n} = ${value}`, `${n} × ${n} = ${value}`); recall = 3; }
    else if (kind === "pct") { const [n, d, p] = rand.pick(PCT); value = p; prompt = T(`분수 ${n}/${d}을(를) 백분율(%)로 나타내면 몇 %인가요?`, `Phân số ${n}/${d} bằng bao nhiêu phần trăm?`); expl = T(`${n}/${d} = ${p}%`, `${n}/${d} = ${p}%`); recall = 3; }
    else { const c = rand.pick(CONV.filter((x) => x.l <= level)); value = c.v; prompt = T(c.ko, c.vi); expl = T(`정답: ${c.v}`, `Đáp án: ${c.v}`); }
    return { type: "numeric", prompt: join(prompt, ONE), value, hints: [T("외워 둔 곱셈구구나 단위 관계를 떠올려 보세요.", "Hãy nhớ lại bảng cửu chương hoặc quan hệ giữa các đơn vị."), T("바로 떠오르지 않으면 아는 사실에서 한 단계씩 이어 가요.", "Nếu chưa nhớ ra, hãy suy từ một sự kiện đã biết.")], expl, tags: ["numbers"], features: F(1, 0, 0, 0, recall, 0, cap(level - 1, 2)), verify: () => Number.isFinite(value) };
  },
};

/* ------------------------------------------------------------------ 1b. whole-number arithmetic routines (large pool) */
const arith = {
  id: "arith-routine", short: "ari", cognitive: "PROCEDURE", levels: [1, 4], title: T("자연수 계산 절차", "Quy trình tính với số tự nhiên"),
  make(rand, level) {
    let a, b, op, value, steps = 1, num = 0, abs = 0;
    if (level === 1) { op = rand.pick(["+", "-"]); a = rand.int(20, 99); b = rand.int(11, 79); if (op === "-" && b >= a) [a, b] = [Math.max(a, b) + 1, Math.min(a, b)]; value = op === "+" ? a + b : a - b; num = 1; }
    else if (level === 2) { op = rand.pick(["×", "÷", "+", "-"]); if (op === "×") { a = rand.int(12, 99); b = rand.int(3, 9); value = a * b; } else if (op === "÷") { b = rand.int(3, 9); value = rand.int(12, 99); a = b * value; } else { a = rand.int(120, 899); b = rand.int(35, 299); if (op === "-" && b >= a) b = a - 1; value = op === "+" ? a + b : a - b; } num = 1; }
    else if (level === 3) { op = rand.pick(["×", "÷"]); if (op === "×") { a = rand.int(23, 99); b = rand.int(12, 49); value = a * b; } else { b = rand.int(12, 49); value = rand.int(12, 90); a = b * value; } num = 2; steps = 2; }
    else { const c = rand.int(2, 9); a = rand.int(12, 60); b = rand.int(12, 60); op = "(+)×"; value = (a + b) * c; num = 2; steps = 2; abs = 1; return { type: "numeric", prompt: join(T(`다음을 계산하세요: (${a} + ${b}) × ${c}`, `Tính: (${a} + ${b}) × ${c}`), ONE), value, hints: [T("괄호 안을 먼저 계산해요.", "Tính trong ngoặc trước."), T("괄호의 값에 곱해요.", "Rồi nhân với giá trị của ngoặc.")], expl: T(`(${a} + ${b}) × ${c} = ${a + b} × ${c} = ${value}`, `(${a} + ${b}) × ${c} = ${a + b} × ${c} = ${value}`), tags: ["numbers"], features: F(2, 1, 0, 0, 0, 0, 2), verify: () => value === (a + b) * c }; }
    return { type: "numeric", prompt: join(T(`다음을 계산하세요: ${won(a)} ${op} ${won(b)}`, `Tính: ${won(a)} ${op} ${won(b)}`), ONE), value, hints: [T(op === "×" || op === "÷" ? "곱셈·나눗셈은 자릿수별로 나누어 계산해요." : "같은 자리끼리 맞추고, 받아올림·받아내림에 주의해요.", op === "×" || op === "÷" ? "Phép nhân, chia nên tính theo từng hàng." : "Đặt các chữ số cùng hàng thẳng cột và chú ý nhớ/mượn."), T("계산한 뒤 거꾸로(역연산) 확인해 보세요.", "Tính xong hãy kiểm tra ngược bằng phép tính nghịch đảo.")], expl: T(`${won(a)} ${op} ${won(b)} = ${won(value)}`, `${won(a)} ${op} ${won(b)} = ${won(value)}`), tags: ["numbers"], features: F(steps, abs, 0, 0, 0, 0, num), verify: () => Number.isInteger(value) && value >= 0 };
  },
};

/* ------------------------------------------------------------------ 2. place value, rounding, ordering numbers */
const placeValue = {
  id: "place-value", short: "plc", cognitive: "PROCEDURE", levels: [1, 4], title: T("자릿값·어림·수의 크기", "Giá trị theo vị trí, làm tròn, so sánh số"),
  make(rand, level) {
    if (level <= 2) {
      const hundred = level === 2;
      let n; do { n = hundred ? rand.int(1000, 9999) : rand.int(11, 99); } while (n % (hundred ? 100 : 10) === (hundred ? 50 : 5));
      const unit = hundred ? 100 : 10, value = Math.round(n / unit) * unit;
      return { type: "numeric", prompt: join(T(`${won(n)}을(를) 가장 가까운 ${hundred ? "백" : "십"}의 자리까지 어림하면 얼마인가요? (반올림)`, `Làm tròn ${won(n)} đến hàng ${hundred ? "trăm" : "chục"} gần nhất.`), ONE), value, hints: [T("어림할 자리의 바로 아랫자리 숫자를 보세요.", "Hãy nhìn chữ số ở hàng ngay bên phải hàng cần làm tròn."), T("5 이상이면 올리고 4 이하면 버려요.", "Từ 5 trở lên thì làm tròn lên, từ 4 trở xuống thì làm tròn xuống.")], expl: T(`${won(n)}을(를) 반올림하면 ${won(value)}`, `Làm tròn ${won(n)} được ${won(value)}`), tags: ["numbers"], features: F(1, 0, 0, 0, 0, 0, level), verify: () => value % unit === 0 };
    }
    const pool = level === 3 ? [0.4, 0.49, 0.409, 0.094, 0.904, 0.94, 0.04, 0.449] : [-0.5, -0.45, -0.405, -0.054, 0.05, 0.1, -0.095, -0.4];
    const vals = rand.sample(pool, 4);
    const want = level === 3 ? "max" : "min";
    const right = want === "max" ? Math.max(...vals) : Math.min(...vals);
    return { type: "multiple_choice", prompt: T(level === 3 ? "다음 중 가장 큰 수를 고르세요." : "다음 중 가장 작은 수를 고르세요.", level === 3 ? "Chọn số lớn nhất trong các số sau." : "Chọn số nhỏ nhất trong các số sau."), right: String(right), wrong: vals.filter((v) => v !== right).map(String), hints: [T("소수점 아래 자릿수를 맞춰 비교해 보세요(0을 덧붙여 써 봐요).", "Viết các số với cùng số chữ số thập phân (thêm số 0) rồi so sánh."), T(level === 3 ? "높은 자리부터 차례로 비교해요." : "음수는 절댓값이 클수록 더 작아요.", level === 3 ? "So sánh lần lượt từ hàng cao nhất." : "Với số âm, giá trị tuyệt đối càng lớn thì số càng nhỏ.")], expl: T(`정답은 ${right} 이에요.`, `Đáp án là ${right}.`), tags: ["numbers"], features: F(level === 3 ? 1 : 2, level === 3 ? 0 : 1, 0, 0, 0, level === 3 ? 2 : 3, level - 1), verify: () => vals.includes(right) };
  },
};

/* ------------------------------------------------------------------ 3. shopping with several dependent steps */
const shopping = {
  id: "shopping-multistep", short: "shop", cognitive: "APPLY", levels: [2, 7], title: T("장보기 여러 단계 계산", "Tính toán nhiều bước khi mua sắm"),
  make(rand, level) {
    const name = rand.pick(NAMES), [g1, g2, g3] = rand.sample(GOODS, 3);
    const p = () => rand.mult(500, 2500, 100);
    const p1 = p(), p2 = p(), p3 = p(), b = rand.int(2, 5);
    const free = level >= 7;
    const a = free ? rand.pick([3, 6]) : rand.int(2, 6);
    const third = level >= 6, c = rand.int(1, 3);
    const paidA = free ? a - a / 3 : a;
    const subtotal = paidA * p1 + b * p2 + (third ? c * p3 : 0);
    const disc = level >= 4 ? rand.pick([10, 20, 25, 50]) : 0;
    const total = disc ? (subtotal * (100 - disc)) / 100 : subtotal;
    if (!Number.isInteger(total)) return shopping.make(rand, level);
    const bill = level >= 3 ? Math.ceil((total + 1) / 5000) * 5000 : 0;
    const value = bill ? bill - total : total;
    const koP = [`${name} 학생이 ${g1.ko} ${a}개(개당 ${won(p1)}원)와 ${g2.ko} ${b}개(개당 ${won(p2)}원)${third ? `, ${g3.ko} ${c}개(개당 ${won(p3)}원)` : ""}를 샀습니다.`];
    const viP = [`Bạn ${name} mua ${a} ${g1.vi} (mỗi cái ${won(p1)} won) và ${b} ${g2.vi} (mỗi cái ${won(p2)} won)${third ? `, ${c} ${g3.vi} (mỗi cái ${won(p3)} won)` : ""}.`];
    if (free) { koP.push(`행사: ${g1.ko} 3개를 사면 1개는 무료입니다.`); viP.push(`Khuyến mãi: mua 3 ${g1.vi} được tặng 1 cái.`); }
    if (disc) { koP.push(`계산할 때 전체 금액에서 ${disc}%를 할인받았습니다.`); viP.push(`Khi thanh toán được giảm ${disc}% trên tổng tiền.`); }
    if (level >= 5) { koP.push(`(참고: ${g3.ko} 한 개 가격은 ${won(p3)}원이라고 적혀 있습니다.)`); viP.push(`(Ghi chú: giá một ${g3.vi} là ${won(p3)} won.)`); }
    koP.push(bill ? `${won(bill)}원을 냈다면 거스름돈은 얼마인가요?` : "내야 할 금액은 모두 얼마인가요?"); viP.push(bill ? `Nếu trả ${won(bill)} won thì được trả lại bao nhiêu tiền?` : "Tổng số tiền phải trả là bao nhiêu?");
    const steps = 2 + (free ? 1 : 0) + (third ? 1 : 0) + (disc ? 1 : 0) + (bill ? 1 : 0);
    return { type: "numeric", prompt: join(T(koP.join(" "), viP.join(" ")), ONE), value, hints: [T("무엇을 몇 번 계산해야 하는지 순서대로 적어 보세요.", "Hãy liệt kê theo thứ tự các phép tính cần làm."), T(`${disc ? "할인은 전체 금액을 구한 뒤에 적용해요. " : ""}${bill ? "거스름돈 = 낸 돈 − 내야 할 금액" : "각 물건의 값을 먼저 구해 더해요."}`, `${disc ? "Giảm giá áp dụng sau khi có tổng tiền. " : ""}${bill ? "Tiền thừa = tiền đưa − tiền phải trả" : "Tính tiền từng món rồi cộng lại."}`)], expl: T(`합계 ${won(subtotal)}원${disc ? ` → 할인 후 ${won(total)}원` : ""}${bill ? ` → ${won(bill)} − ${won(total)} = ${won(value)}원` : ""}.`, `Tổng ${won(subtotal)} won${disc ? ` → sau giảm giá ${won(total)} won` : ""}${bill ? ` → ${won(bill)} − ${won(total)} = ${won(value)} won` : ""}.`), tags: ["multistep", "context"], features: F(Math.min(6, steps), 0, cap(1 + Math.floor(level / 2), 4), level >= 7 ? 2 : level >= 5 ? 1 : 0, 0, level >= 5 ? 1 : 0, cap(Math.floor(level / 2), 3)), verify: () => (paidA * p1 + b * p2 + (third ? c * p3 : 0)) === subtotal && value >= 0 };
  },
};

/* ------------------------------------------------------------------ 4. fractions, percentages, ratios */
const fractionRatio = {
  id: "fraction-ratio-ops", short: "frac", cognitive: "PROCEDURE", levels: [3, 7], title: T("분수·백분율·비의 계산", "Phân số, phần trăm và tỉ số"),
  make(rand, level) {
    if (level <= 3) {
      const [d1, d2] = rand.pick([[2, 3], [3, 4], [4, 6], [2, 5], [3, 6]]), n1 = rand.int(1, d1 - 1), n2 = rand.int(1, d2 - 1);
      const L = (d1 * d2) / gcd(d1, d2), num = n1 * (L / d1) + n2 * (L / d2), fx = (n, d) => tex(fracTex(n, d));
      const right = fx(num, L);
      return { type: "multiple_choice", prompt: T(`${tex(`${fracTex(n1, d1)} + ${fracTex(n2, d2)}`)} 의 값을 고르세요.`, `Chọn giá trị của ${tex(`${fracTex(n1, d1)} + ${fracTex(n2, d2)}`)}.`), right, wrong: [fx(n1 + n2, d1 + d2), fx(n1 + n2, d1 * d2), fx(num + 1, L), fx(Math.max(1, num - 1), L)], hints: [T("분모를 같게 통분해요.", "Quy đồng mẫu số."), T("분자끼리, 분모끼리 그냥 더하면 안 돼요.", "Không được cộng thẳng tử với tử và mẫu với mẫu.")], expl: T(`통분하면 ${fx(num, L)}.`, `Quy đồng ta được ${fx(num, L)}.`), tags: ["numbers"], features: F(2, 1, 0, 0, 0, 2, 1), verify: () => num * 1 > 0 };
    }
    if (level === 4) {
      const len = rand.mult(60, 240, 30), f1 = rand.pick([[2, 5], [1, 3], [3, 8]]), used1 = (len * f1[0]) / f1[1];
      if (!Number.isInteger(used1)) return fractionRatio.make(rand, level);
      const rest = len - used1, f2 = rand.pick([[1, 3], [1, 2], [2, 3]]), used2 = (rest * f2[0]) / f2[1];
      if (!Number.isInteger(used2)) return fractionRatio.make(rand, level);
      const value = rest - used2;
      return { type: "numeric", prompt: join(T(`길이가 ${len} cm인 리본에서 먼저 전체의 ${f1[0]}/${f1[1]}을(를) 쓰고, 남은 리본의 ${f2[0]}/${f2[1]}을(를) 더 썼습니다. 남은 리본은 몇 cm인가요?`, `Dải ruy băng dài ${len} cm. Đã dùng ${f1[0]}/${f1[1]} cả dải, sau đó dùng thêm ${f2[0]}/${f2[1]} phần còn lại. Còn lại bao nhiêu cm?`), ONE), value, hints: [T("두 번째 분수는 '전체'가 아니라 '남은 것'에 대한 비율이에요.", "Phân số thứ hai tính trên phần CÒN LẠI chứ không phải cả dải."), T("먼저 남은 길이를 구한 뒤 두 번째 계산을 해요.", "Tìm phần còn lại trước rồi mới tính lần thứ hai.")], expl: T(`${len} − ${used1} = ${rest}, 그다음 ${rest} − ${used2} = ${value}`, `${len} − ${used1} = ${rest}, rồi ${rest} − ${used2} = ${value}`), tags: ["multistep", "context"], features: F(3, 1, 2, 1, 0, 0, 2), verify: () => value === len - used1 - used2 };
    }
    if (level === 5) {
      const up = rand.pick([10, 20, 25, 40, 50]);
      const value = round(((100 + up) * (100 - up)) / 100 - 100, 2);
      return { type: "numeric", prompt: join(T(`어떤 상품의 가격을 ${up}% 올렸다가, 다시 그 올린 가격에서 ${up}% 내렸습니다. 처음 가격과 비교하면 몇 % 변했나요? (내려갔으면 음수로)`, `Giá một món hàng được tăng ${up}% rồi lại giảm ${up}% trên giá đã tăng. So với giá ban đầu, giá thay đổi bao nhiêu phần trăm? (giảm thì ghi số âm)`), ONE), value, tol: 0.01, hints: [T("처음 가격을 100으로 놓고 두 번 차례로 계산해 보세요.", "Đặt giá ban đầu là 100 rồi tính lần lượt hai lần."), T("올린 뒤의 가격이 새로운 기준이에요.", "Giá sau khi tăng là cơ sở mới.")], expl: T(`100 → ${100 + up} → ${(100 + up) * (100 - up) / 100}. 변화율 ${value}%`, `100 → ${100 + up} → ${(100 + up) * (100 - up) / 100}. Thay đổi ${value}%`), tags: ["multistep", "reasoning"], features: F(3, 1, 1, 2, 0, 2, 1), verify: () => Math.abs(value - ((1 + up / 100) * (1 - up / 100) - 1) * 100) < 1e-9 };
    }
    if (level === 6) {
      const [x, y, z] = [rand.int(1, 4), rand.int(2, 6), rand.int(5, 9)].sort((a, b) => a - b), k = rand.int(3, 9);
      if (!(y > x)) return fractionRatio.make(rand, level);
      const diff = (y - x) * k, total = (x + y + z) * k;
      return { type: "numeric", prompt: join(T(`세 사람 A, B, C가 상금을 ${x} : ${y} : ${z}의 비로 나누었습니다. B가 A보다 ${won(diff)}원을 더 받았다면 상금 전체는 얼마인가요?`, `Ba người A, B, C chia tiền thưởng theo tỉ lệ ${x} : ${y} : ${z}. B nhận nhiều hơn A ${won(diff)} won. Tổng tiền thưởng là bao nhiêu?`), ONE), value: total, hints: [T("비의 한 칸이 얼마인지 먼저 구해요.", "Trước hết tìm giá trị của một phần trong tỉ số."), T(`B와 A의 차는 ${y - x}칸이에요.`, `B hơn A ${y - x} phần.`)], expl: T(`한 칸 = ${won(diff)} ÷ ${y - x} = ${won(k)}원, 전체 = ${x + y + z}칸 × ${won(k)} = ${won(total)}원`, `Một phần = ${won(diff)} ÷ ${y - x} = ${won(k)} won, tổng = ${x + y + z} phần × ${won(k)} = ${won(total)} won`), tags: ["multistep", "context"], features: F(3, 2, 2, 1, 0, 0, 2), verify: () => diff / (y - x) === k };
    }
    const d1 = rand.pick([10, 20, 30]), d2 = rand.pick([10, 20, 30, 40]);
    const value = round(100 - ((100 - d1) * (100 - d2)) / 100, 2);
    return { type: "numeric", prompt: join(T(`세일 가격에서 ${d1}% 할인을 받고, 계산대에서 그 가격에 ${d2}% 쿠폰을 더 적용했습니다. 처음 가격에 대해 한 번에 할인한 것과 같다면 몇 % 할인일까요?`, `Một món hàng giảm ${d1}%, rồi ở quầy thu ngân dùng thêm phiếu giảm ${d2}% trên giá đã giảm. Điều này tương đương với một lần giảm bao nhiêu phần trăm so với giá ban đầu?`), DEC), value, tol: 0.01, hints: [T("할인율을 그냥 더하면 안 돼요. 곱해서 남는 비율을 구해요.", "Không cộng thẳng các tỉ lệ giảm; hãy nhân phần còn lại."), T("처음 가격을 100이라 하면 두 번 차례로 줄어요.", "Đặt giá ban đầu là 100 và giảm lần lượt hai lần.")], expl: T(`남는 비율 ${100 - d1}% × ${100 - d2}% = ${round(((100 - d1) * (100 - d2)) / 100, 2)}%, 할인 ${value}%`, `Phần còn lại ${100 - d1}% × ${100 - d2}% = ${round(((100 - d1) * (100 - d2)) / 100, 2)}%, giảm ${value}%`), tags: ["multistep", "reasoning"], features: F(3, 2, 2, 2, 0, 2, 2), verify: () => Math.abs(value - (1 - (1 - d1 / 100) * (1 - d2 / 100)) * 100) < 1e-9 };
  },
};

/* ------------------------------------------------------------------ 5. rates: speed, recipes, exchange, catching up */
const rates = {
  id: "rate-travel", short: "rate", cognitive: "APPLY", levels: [4, 8], title: T("속도·비율 활용", "Vận tốc và tỉ lệ trong thực tế"),
  make(rand, level) {
    if (level <= 4) {
      const v = rand.pick([4, 5, 6, 8, 10, 12]), minutes = rand.pick([15, 30, 45, 90, 120]), value = round((v * minutes) / 60, 2);
      return { type: "numeric", prompt: join(T(`시속 ${v} km로 ${minutes}분 동안 걸으면 몇 km를 갈 수 있나요?`, `Đi với vận tốc ${v} km/h trong ${minutes} phút thì đi được bao nhiêu km?`), DEC), value, tol: 0.01, hints: [T("단위가 시간과 분으로 섞여 있어요. 먼저 통일해요.", "Đơn vị giờ và phút đang lẫn; hãy thống nhất trước."), T("거리 = 속력 × 시간", "Quãng đường = vận tốc × thời gian")], expl: T(`${minutes}분 = ${round(minutes / 60, 3)}시간, ${v} × ${round(minutes / 60, 3)} = ${value} km`, `${minutes} phút = ${round(minutes / 60, 3)} giờ, ${v} × ${round(minutes / 60, 3)} = ${value} km`), tags: ["context", "multistep"], features: F(2, 1, 2, 0, 0, 0, 2), verify: () => Math.abs(value - (v * minutes) / 60) < 0.01 };
    }
    if (level === 5) {
      const [v1, v2] = rand.pick([[60, 40], [30, 20], [6, 3], [12, 4], [20, 30], [90, 45]]), value = round((2 * v1 * v2) / (v1 + v2), 2);
      return { type: "numeric", prompt: join(T(`집에서 학교까지 갈 때는 시속 ${v1} km, 같은 길로 돌아올 때는 시속 ${v2} km로 달렸습니다. 왕복 전체의 평균 속력은 시속 몇 km인가요?`, `Đi từ nhà đến trường với vận tốc ${v1} km/h, về theo đường cũ với vận tốc ${v2} km/h. Vận tốc trung bình cả đi lẫn về là bao nhiêu km/h?`), DEC), value, tol: 0.05, hints: [T("속력의 평균(산술평균)이 아니라 전체 거리 ÷ 전체 시간이에요.", "Không phải trung bình cộng các vận tốc mà là tổng quãng đường ÷ tổng thời gian."), T("거리를 아무 수(예: 120 km)로 놓고 걸린 시간을 각각 구해 보세요.", "Hãy chọn một quãng đường bất kỳ (ví dụ 120 km) rồi tính thời gian đi và về.")], expl: T(`평균 속력 = 2·${v1}·${v2} ÷ (${v1}+${v2}) = ${value}`, `Vận tốc trung bình = 2·${v1}·${v2} ÷ (${v1}+${v2}) = ${value}`), tags: ["reasoning", "multistep"], features: F(3, 1, 2, 3, 0, 2, 1), verify: () => { const dist = 2 * v1 * v2; return Math.abs(2 * dist / (dist / v1 + dist / v2) - value) < 0.05; } };
    }
    if (level === 6) {
      const people = rand.pick([4, 6, 8]), want = people * rand.int(2, 4) + rand.pick([0, 2, 3]), per = rand.pick([150, 200, 250]), pack = rand.pick([400, 500, 750]);
      const need = Math.ceil(((per / people) * want) / pack);
      const nmin = (per / people) * want;
      if (!Number.isFinite(nmin)) return rates.make(rand, level);
      return { type: "numeric", prompt: join(T(`${people}인분 레시피에 밀가루 ${per} g이 필요합니다. ${want}명이 먹을 양을 만들려면, ${pack} g들이 밀가루를 최소 몇 봉지 사야 하나요?`, `Công thức cho ${people} người cần ${per} g bột. Để làm cho ${want} người, cần mua ít nhất bao nhiêu túi bột loại ${pack} g?`), ONE), value: need, hints: [T("한 사람당 필요한 양을 먼저 구해요.", "Trước hết tìm lượng bột cho một người."), T("봉지는 쪼개서 살 수 없으니 마지막에 올림해요.", "Không mua được nửa túi nên cuối cùng phải làm tròn lên.")], expl: T(`필요한 양 = ${per}/${people} × ${want} = ${round(nmin, 1)} g, ${pack} g들이 → ${need}봉지`, `Lượng cần = ${per}/${people} × ${want} = ${round(nmin, 1)} g, túi ${pack} g → ${need} túi`), tags: ["context", "multistep"], features: F(3, 1, 3, 1, 0, 1, 2), verify: () => need * pack >= nmin && (need - 1) * pack < nmin };
    }
    if (level === 7) {
      const r1 = rand.pick([1300, 1350, 1400]), r2 = rand.pick([1500, 1600, 1500]), fee = rand.pick([1, 2, 4, 5]);
      const eur = rand.int(8, 30) * 50, krw = eur * r2, value = round(((krw / r2) * (100 - fee)) / 100, 2);
      return { type: "numeric", prompt: join(T(`환전소의 기준환율은 1유로 = ${won(r2)}원입니다. 수수료 ${fee}%를 환전한 유로 금액에서 뺀다고 할 때, ${won(krw)}원을 유로로 바꾸면 받는 돈은 몇 유로인가요?`, `Tỷ giá niêm yết: 1 euro = ${won(r2)} won. Phí đổi ${fee}% được trừ vào số euro đổi được. Đổi ${won(krw)} won thì nhận được bao nhiêu euro?`), DEC), value, tol: 0.05, hints: [T("먼저 수수료를 빼기 전의 유로를 구해요.", "Trước hết tính số euro trước khi trừ phí."), T(`수수료를 뺀 뒤에는 ${100 - fee}%만 남아요.`, `Sau khi trừ phí chỉ còn ${100 - fee}%.`)], expl: T(`${won(krw)} ÷ ${won(r2)} = ${krw / r2}유로, 수수료 ${fee}% 공제 → ${value}유로`, `${won(krw)} ÷ ${won(r2)} = ${krw / r2} euro, trừ phí ${fee}% → ${value} euro`), tags: ["context", "multistep"], features: F(3, 1, 3, 1, 0, 1, 3), verify: () => Math.abs(value - (krw / r2) * (1 - fee / 100)) < 0.05 && r1 > 0 };
    }
    const vA = rand.pick([4, 5, 6]), vB = vA + rand.pick([2, 3, 4]), head = rand.pick([1, 2, 3]) * 60, headKm = round((vA * head) / 60, 2), minutes = Math.round((headKm / (vB - vA)) * 60);
    return { type: "numeric", prompt: join(T(`민수가 시속 ${vA} km로 먼저 출발하고 ${head}분 뒤에 지아가 같은 길을 시속 ${vB} km로 따라갑니다. 지아가 출발한 뒤 몇 분 만에 민수를 따라잡나요?`, `Minsu đi trước với vận tốc ${vA} km/h; ${head} phút sau, Jia xuất phát theo cùng đường với vận tốc ${vB} km/h. Sau bao nhiêu phút kể từ khi Jia xuất phát thì Jia đuổi kịp Minsu?`), ONE), value: minutes, hints: [T("지아가 출발할 때 두 사람 사이의 거리를 먼저 구해요.", "Hãy tìm khoảng cách giữa hai người khi Jia xuất phát."), T("따라잡는 속력은 두 속력의 차예요.", "Tốc độ đuổi kịp là hiệu hai vận tốc.")], expl: T(`처음 거리 ${headKm} km ÷ 속력 차 ${vB - vA} km/h = ${round(headKm / (vB - vA), 3)}시간 = ${minutes}분`, `Khoảng cách ban đầu ${headKm} km ÷ hiệu vận tốc ${vB - vA} km/h = ${round(headKm / (vB - vA), 3)} giờ = ${minutes} phút`), tags: ["reasoning", "multistep"], features: F(4, 2, 3, 2, 0, 1, 2), verify: () => Math.abs(vA * (head + minutes) / 60 - vB * minutes / 60) < 0.02 };
  },
};

/* ------------------------------------------------------------------ 6. data and statistics */
const stats = {
  id: "data-stats", short: "stat", cognitive: "ANALYZE", levels: [3, 9], title: T("자료 읽기와 통계", "Đọc dữ liệu và thống kê"),
  make(rand, level) {
    const list = (n, lo, hi) => Array.from({ length: n }, () => rand.int(lo, hi));
    if (level <= 3) { const n = 5, base = list(n - 1, 4, 9), s = base.reduce((x, y) => x + y, 0), mean = rand.int(5, 8), last = mean * n - s; if (last < 1 || last > 12) return stats.make(rand, level); const xs = [...base, last]; return { type: "numeric", prompt: join(T(`다섯 학생이 일주일 동안 읽은 책의 수는 ${xs.join(", ")}권입니다. 평균은 몇 권인가요?`, `Năm học sinh đọc số sách trong một tuần lần lượt là ${xs.join(", ")}. Trung bình mỗi bạn đọc bao nhiêu quyển?`), ONE), value: mean, hints: [T("모두 더한 뒤 사람 수로 나눠요.", "Cộng tất cả rồi chia cho số bạn."), T("합계가 몇인지 먼저 적어 보세요.", "Hãy ghi ra tổng trước.")], expl: T(`합 ${xs.reduce((x, y) => x + y, 0)} ÷ 5 = ${mean}`, `Tổng ${xs.reduce((x, y) => x + y, 0)} ÷ 5 = ${mean}`), tags: ["context"], features: F(2, 0, 1, 0, 0, 0, 1), verify: () => xs.reduce((x, y) => x + y, 0) / 5 === mean }; }
    if (level === 4 || level === 5) { const n = level === 4 ? 7 : 8, xs = list(n, 3, 40), sorted = [...xs].sort((a, b) => a - b), med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2; return { type: "numeric", prompt: join(T(`한 가게의 ${n}일 동안 판매량은 ${xs.join(", ")}개입니다. 중앙값은 얼마인가요?`, `Doanh số ${n} ngày của một cửa hàng là ${xs.join(", ")}. Trung vị là bao nhiêu?`), DEC), value: med, tol: 0.01, hints: [T("크기 순서대로 먼저 늘어놓아요.", "Sắp xếp các số theo thứ tự tăng dần trước."), T(n % 2 ? "개수가 홀수이면 한가운데 값이에요." : "개수가 짝수이면 가운데 두 값의 평균이에요.", n % 2 ? "Số lượng lẻ thì lấy giá trị ở giữa." : "Số lượng chẵn thì lấy trung bình hai giá trị ở giữa.")], expl: T(`정렬: ${sorted.join(", ")} → 중앙값 ${med}`, `Sắp xếp: ${sorted.join(", ")} → trung vị ${med}`), tags: ["context"], features: F(2, 0, 1, 0, 0, 0, 1 + (level - 4)), verify: () => sorted.length === n }; }
    if (level === 6) { const base = list(5, 10, 20), out = rand.int(70, 99); const withOut = [...base.slice(0, 4), out]; const mean0 = base.reduce((x, y) => x + y, 0) / 5, mean1 = withOut.reduce((x, y) => x + y, 0) / 5; const sort = (a) => [...a].sort((x, y) => x - y)[2]; const medSame = sort(base) === sort(withOut); return { type: "multiple_choice", prompt: T(`점수가 ${base.join(", ")}점인 다섯 명 중 마지막 학생의 점수를 ${base[4]}점에서 ${out}점으로 바꾸었습니다. 평균과 중앙값에 대한 설명으로 옳은 것은?`, `Điểm của năm bạn là ${base.join(", ")}. Điểm của bạn cuối cùng được đổi từ ${base[4]} thành ${out}. Nhận xét nào đúng về trung bình và trung vị?`), right: T(medSame ? "평균은 크게 커지지만 중앙값은 변하지 않는다" : "평균은 크게 커지고 중앙값도 달라질 수 있다", medSame ? "Trung bình tăng mạnh nhưng trung vị không đổi" : "Trung bình tăng mạnh và trung vị cũng có thể đổi"), wrong: [T("평균은 변하지 않는다", "Trung bình không đổi"), T("평균과 중앙값이 똑같이 커진다", "Trung bình và trung vị tăng như nhau"), T(medSame ? "중앙값이 크게 커진다" : "중앙값은 절대로 변하지 않는다", medSame ? "Trung vị tăng mạnh" : "Trung vị tuyệt đối không đổi")], hints: [T("두 값을 직접 계산해 비교해 보세요.", "Hãy tự tính cả hai giá trị rồi so sánh."), T("중앙값은 가운데 순서의 값만 봐요.", "Trung vị chỉ phụ thuộc vào giá trị ở vị trí giữa.")], expl: T(`평균 ${round(mean0, 2)} → ${round(mean1, 2)}, 중앙값 ${sort(base)} → ${sort(withOut)}`, `Trung bình ${round(mean0, 2)} → ${round(mean1, 2)}, trung vị ${sort(base)} → ${sort(withOut)}`), tags: ["reasoning"], features: F(3, 1, 1, 2, 0, 3, 1), verify: () => mean1 > mean0 }; }
    if (level === 7) { const n1 = rand.pick([10, 20, 30]), n2 = rand.pick([20, 30, 40]), m1 = rand.int(50, 70), m2 = rand.int(75, 95); const value = round((n1 * m1 + n2 * m2) / (n1 + n2), 2); return { type: "numeric", prompt: join(T(`A반 ${n1}명의 평균은 ${m1}점, B반 ${n2}명의 평균은 ${m2}점입니다. 두 반 전체 학생의 평균은 몇 점인가요?`, `Lớp A có ${n1} bạn, điểm trung bình ${m1}; lớp B có ${n2} bạn, điểm trung bình ${m2}. Điểm trung bình của tất cả học sinh hai lớp là bao nhiêu?`), DEC), value, tol: 0.05, hints: [T("두 평균을 그냥 평균 내면 안 돼요. 인원수가 달라요.", "Không lấy trung bình hai số trung bình vì số bạn khác nhau."), T("각 반의 점수 합계를 먼저 구해요.", "Trước hết tìm tổng điểm của mỗi lớp.")], expl: T(`(${n1}×${m1} + ${n2}×${m2}) ÷ ${n1 + n2} = ${value}`, `(${n1}×${m1} + ${n2}×${m2}) ÷ ${n1 + n2} = ${value}`), tags: ["reasoning", "context"], features: F(3, 1, 2, 2, 0, 2, 2), verify: () => Math.abs(value - (n1 * m1 + n2 * m2) / (n1 + n2)) < 0.05 }; }
    if (level === 8) { const n = rand.pick([5, 6, 8]), mean = rand.int(60, 80), xs = list(n - 1, mean - 15, mean + 15); const rem = mean * n - xs.reduce((a, b) => a + b, 0); const full = [...xs, rem]; const dropped = rand.pick(xs); const rest = full.filter((v, i) => !(v === dropped && i === full.indexOf(dropped))); const value = round(rest.reduce((a, b) => a + b, 0) / rest.length, 2); return { type: "numeric", prompt: join(T(`${n}명의 평균 점수는 ${mean}점이고, 그중 ${n - 1}명의 점수는 ${xs.join(", ")}점입니다. 점수가 ${dropped}점인 학생 한 명이 빠지면 나머지의 평균은 몇 점인가요?`, `Điểm trung bình của ${n} bạn là ${mean}; điểm của ${n - 1} bạn trong số đó là ${xs.join(", ")}. Nếu một bạn điểm ${dropped} rời đi thì điểm trung bình của những bạn còn lại là bao nhiêu?`), DEC), value, tol: 0.05, hints: [T("전체 합은 평균 × 인원수예요.", "Tổng bằng trung bình × số bạn."), T("빠진 학생의 점수를 뺀 합을 새 인원수로 나눠요.", "Lấy tổng trừ điểm bạn rời đi rồi chia cho số bạn còn lại.")], expl: T(`전체 합 ${mean * n} − ${dropped} = ${mean * n - dropped}, ÷ ${n - 1} = ${value}`, `Tổng ${mean * n} − ${dropped} = ${mean * n - dropped}, ÷ ${n - 1} = ${value}`), tags: ["reasoning", "multistep"], features: F(4, 2, 2, 2, 0, 1, 2), verify: () => Math.abs(value - (mean * n - dropped) / (n - 1)) < 0.05 }; }
    const four = list(4, 40, 90).sort((a, b) => a - b), m5 = rand.int(60, 75), x = m5 * 5 - four.reduce((a, b) => a + b, 0);
    if (x < 30 || x > 100) return stats.make(rand, level);
    const med = [...four, x].sort((a, b) => a - b)[2];
    return { type: "numeric", prompt: join(T(`네 학생의 점수는 ${four.join(", ")}점입니다. 한 학생이 더 시험을 보아 다섯 명의 평균이 ${m5}점이 되었습니다. 다섯 명 점수의 중앙값은 몇 점인가요?`, `Điểm của bốn bạn là ${four.join(", ")}. Một bạn nữa làm bài và điểm trung bình của năm bạn trở thành ${m5}. Trung vị điểm của năm bạn là bao nhiêu?`), ONE), value: med, hints: [T("새 학생의 점수를 먼저 구해야 해요.", "Phải tìm điểm của bạn mới trước."), T("다섯 점수를 크기순으로 세워 가운데 값을 찾아요.", "Sắp xếp năm điểm và lấy giá trị ở giữa.")], expl: T(`새 학생 = ${m5 * 5} − ${four.reduce((a, b) => a + b, 0)} = ${x}, 정렬하면 중앙값 ${med}`, `Bạn mới = ${m5 * 5} − ${four.reduce((a, b) => a + b, 0)} = ${x}, sắp xếp được trung vị ${med}`), tags: ["multistep", "reasoning"], features: F(4, 2, 2, 3, 0, 1, 2), verify: () => [...four, x].sort((a, b) => a - b)[2] === med };
  },
};

/* ------------------------------------------------------------------ 7. comparing plans (linear models) */
const plans = {
  id: "plan-compare-linear", short: "plan", cognitive: "ANALYZE", levels: [5, 9], title: T("요금제 비교와 일차식 모델", "So sánh gói cước và mô hình bậc nhất"),
  make(rand, level) {
    const fa = rand.mult(5000, 15000, 1000), ra = rand.pick([300, 400, 500, 600]), rb = ra - rand.pick([100, 150, 200]), t0 = rand.int(8, 30), fb = fa + t0 * (ra - rb);
    const costA = (t) => fa + ra * t, costB = (t) => fb + rb * t;
    if (level === 5) { const t = rand.int(10, 40); return { type: "numeric", prompt: join(T(`A 요금제는 기본료 ${won(fa)}원에 분당 ${ra}원입니다. 한 달에 ${t}분 쓰면 요금은 얼마인가요?`, `Gói A có cước cơ bản ${won(fa)} won và ${ra} won mỗi phút. Dùng ${t} phút trong tháng thì tiền cước là bao nhiêu?`), ONE), value: costA(t), hints: [T("기본료는 한 번만, 통화료는 분 수만큼 더해요.", "Cước cơ bản tính một lần, cước gọi nhân với số phút."), T("요금 = 기본료 + (분당 요금 × 분)", "Tiền = cước cơ bản + (giá mỗi phút × số phút)")], expl: T(`${won(fa)} + ${ra} × ${t} = ${won(costA(t))}원`, `${won(fa)} + ${ra} × ${t} = ${won(costA(t))} won`), tags: ["context"], features: F(2, 1, 2, 0, 0, 0, 2), verify: () => costA(t) === fa + ra * t }; }
    if (level === 6) { const t = rand.pick([t0 - 5, t0 + 7, t0 + 15]); const cheaper = costA(t) < costB(t) ? "A" : "B", diff = Math.abs(costA(t) - costB(t)); const mk = (who, d) => T(`${who} 요금제가 ${won(d)}원 더 싸다`, `Gói ${who} rẻ hơn ${won(d)} won`); return { type: "multiple_choice", prompt: T(`A: 기본료 ${won(fa)}원 + 분당 ${ra}원, B: 기본료 ${won(fb)}원 + 분당 ${rb}원. 한 달에 ${t}분 쓴다면 어느 요금제가 얼마나 더 싼가요?`, `A: cước cơ bản ${won(fa)} won + ${ra} won/phút. B: cước cơ bản ${won(fb)} won + ${rb} won/phút. Dùng ${t} phút trong tháng thì gói nào rẻ hơn và rẻ hơn bao nhiêu?`), right: mk(cheaper, diff), wrong: [mk(cheaper === "A" ? "B" : "A", diff), mk(cheaper, diff + ra), mk(cheaper === "A" ? "B" : "A", Math.max(100, diff - 100))], hints: [T("두 요금을 각각 계산해서 비교해요.", "Tính từng gói rồi so sánh."), T("차이가 얼마인지도 구해요.", "Cũng cần tìm chênh lệch.")], expl: T(`A ${won(costA(t))}원, B ${won(costB(t))}원 → ${cheaper} 요금제가 ${won(diff)}원 더 싸다`, `A ${won(costA(t))} won, B ${won(costB(t))} won → gói ${cheaper} rẻ hơn ${won(diff)} won`), tags: ["context", "reasoning"], features: F(3, 1, 2, 1, 0, 3, 2), verify: () => cheaper === (costA(t) < costB(t) ? "A" : "B") }; }
    if (level === 7) return { type: "numeric", prompt: join(T(`A: 기본료 ${won(fa)}원 + 분당 ${ra}원, B: 기본료 ${won(fb)}원 + 분당 ${rb}원. 한 달에 몇 분을 쓰면 두 요금제의 요금이 같아지나요?`, `A: cước cơ bản ${won(fa)} won + ${ra} won/phút. B: cước cơ bản ${won(fb)} won + ${rb} won/phút. Dùng bao nhiêu phút trong tháng thì tiền cước hai gói bằng nhau?`), ONE), value: t0, hints: [T("분 수를 x로 놓고 두 요금식이 같다고 써요.", "Gọi số phút là x và viết hai biểu thức cước bằng nhau."), T("x의 계수끼리, 상수끼리 모아 풀어요.", "Gom các số hạng chứa x và hằng số rồi giải.")], expl: T(`${fa} + ${ra}x = ${fb} + ${rb}x → ${ra - rb}x = ${fb - fa} → x = ${t0}`, `${fa} + ${ra}x = ${fb} + ${rb}x → ${ra - rb}x = ${fb - fa} → x = ${t0}`), tags: ["reasoning", "multistep"], features: F(3, 3, 2, 1, 0, 0, 2), verify: () => costA(t0) === costB(t0) };
    if (level === 8) { const fc = fa + rand.pick([2000, 3000, 4000]), rc = rand.pick([200, 250, 350]), t = rand.int(15, 45); const costs = [costA(t), costB(t), fc + rc * t]; return { type: "numeric", prompt: join(T(`세 요금제가 있습니다. A: ${won(fa)}원 + 분당 ${ra}원, B: ${won(fb)}원 + 분당 ${rb}원, C: ${won(fc)}원 + 분당 ${rc}원. ${t}분을 쓸 때 가장 싼 요금제의 요금은 얼마인가요?`, `Có ba gói cước. A: ${won(fa)} won + ${ra}/phút, B: ${won(fb)} won + ${rb}/phút, C: ${won(fc)} won + ${rc}/phút. Dùng ${t} phút thì tiền cước của gói rẻ nhất là bao nhiêu?`), ONE), value: Math.min(...costs), hints: [T("세 요금제를 모두 계산해야 가장 싼 것을 알 수 있어요.", "Phải tính cả ba gói mới biết gói nào rẻ nhất."), T("계산 결과를 표로 적어 비교해요.", "Ghi kết quả vào bảng để so sánh.")], expl: T(`A ${won(costs[0])}, B ${won(costs[1])}, C ${won(costs[2])} → 최저 ${won(Math.min(...costs))}원`, `A ${won(costs[0])}, B ${won(costs[1])}, C ${won(costs[2])} → thấp nhất ${won(Math.min(...costs))} won`), tags: ["context", "multistep"], features: F(4, 2, 3, 1, 0, 1, 2), verify: () => costs.length === 3 }; }
    const fee = rand.mult(20000, 35000, 1000), gb = rand.pick([5, 8, 10]), over = rand.pick([2000, 2500, 3000]), unl = fee + rand.mult(8000, 14000, 1000);
    let value = null; for (let g = 0; g <= 60; g++) { const c = fee + Math.max(0, g - gb) * over; if (c > unl) { value = g; break; } }
    if (value === null) return plans.make(rand, level);
    return { type: "numeric", prompt: join(T(`데이터 요금제 P: 월 ${won(fee)}원에 ${gb} GB까지 포함, 초과 GB마다 ${won(over)}원이 추가됩니다. 무제한 요금제 U는 월 ${won(unl)}원입니다. 한 달에 최소 몇 GB(정수)를 쓰면 U가 P보다 더 싸지나요?`, `Gói dữ liệu P: ${won(fee)} won/tháng gồm ${gb} GB, mỗi GB vượt thêm ${won(over)} won. Gói không giới hạn U giá ${won(unl)} won/tháng. Dùng ít nhất bao nhiêu GB (số nguyên) mỗi tháng thì U rẻ hơn P?`), ONE), value, hints: [T("P의 요금은 ‘포함량’을 넘는 순간부터 늘어나요(구간별 식).", "Cước của P chỉ tăng khi vượt mức gồm sẵn (biểu thức theo đoạn)."), T("U보다 P가 처음으로 비싸지는 GB를 찾아요.", "Tìm số GB đầu tiên mà P đắt hơn U.")], expl: T(`${value} GB일 때 P는 ${won(fee + Math.max(0, value - gb) * over)}원으로 U(${won(unl)}원)보다 비싸요.`, `Với ${value} GB, P là ${won(fee + Math.max(0, value - gb) * over)} won, đắt hơn U (${won(unl)} won).`), tags: ["reasoning", "multistep"], features: F(4, 3, 3, 3, 0, 1, 3), verify: () => fee + Math.max(0, value - gb) * over > unl && fee + Math.max(0, value - 1 - gb) * over <= unl };
  },
};

/* ------------------------------------------------------------------ 8. finding the flaw in a worked solution */
const errorAnalysis = {
  id: "error-analysis", short: "err", cognitive: "ANALYZE", levels: [4, 9], title: T("풀이에서 틀린 곳 찾기", "Tìm lỗi sai trong lời giải"),
  make(rand, level) {
    const k = rand.int(2, 4);
    const marks = ["①", "②", "③", "④"];
    const show = (lines) => lines.map((l, i) => `${marks[i]} ${tex(l)}`).join("   ");
    const finish = (lines, why, steps, abs, nov) => ({ type: "choice_fixed", prompt: T(`다음은 한 학생의 풀이입니다. 처음으로 틀린 줄은 어디인가요? ${show(lines)}`, `Đây là lời giải của một bạn. Dòng nào là dòng sai ĐẦU TIÊN? ${show(lines)}`), items: [T("①줄", "Dòng ①"), T("②줄", "Dòng ②"), T("③줄", "Dòng ③"), T("④줄", "Dòng ④")], correct: k - 1, hints: [T("각 줄이 바로 앞줄에서 맞게 이어지는지 하나씩 확인해요.", "Kiểm tra từng dòng có suy ra đúng từ dòng trước không."), T("틀린 줄 뒤의 줄은 틀린 줄을 이어받았을 뿐이에요.", "Các dòng sau dòng sai chỉ kế thừa sai lầm đó.")], expl: why, tags: ["reasoning"], features: F(steps, abs, 2, nov, 0, 3, 1), verify: () => k >= 2 && k <= 4 });
    if (level <= 5) { // order of operations
      const a = rand.int(2, 9), b = rand.int(2, 9), c = rand.int(2, 9), d = rand.int(1, 9);
      const right = [`${a}+${b}\\times ${c}-${d}`, `${a}+${b * c}-${d}`, `${a + b * c}-${d}`, `${a + b * c - d}`];
      const wrongAt = { 2: [right[0], `${a + b}\\times ${c}-${d}`, `${(a + b) * c}-${d}`, `${(a + b) * c - d}`], 3: [right[0], right[1], `${a + b * c + 1}-${d}`, `${a + b * c + 1 - d}`], 4: [right[0], right[1], right[2], `${a + b * c - d + 2}`] };
      const lines = wrongAt[k];
      return finish(lines, T(`${marks[k - 1]}줄에서 처음 틀렸어요. 곱셈을 먼저 한 다음 덧셈·뺄셈을 해야 하고 계산도 정확해야 해요. 올바른 값은 ${a + b * c - d}.`, `Dòng ${marks[k - 1]} sai đầu tiên. Phải nhân trước rồi mới cộng trừ và phải tính chính xác. Giá trị đúng là ${a + b * c - d}.`), 3, 1, 1);
    }
    if (level <= 7) { // linear equation with unknowns on both sides
      const x = rand.int(2, 9), a = rand.int(4, 9), c = rand.int(1, a - 2), b = rand.int(1, 9), d = (a - c) * x + b;
      const right = [`${a}x+${b}=${c}x+${d}`, `${a}x-${c}x=${d}-${b}`, `${a - c}x=${d - b}`, `x=${x}`];
      const lines = k === 2 ? [right[0], `${a}x-${c}x=${d}+${b}`, `${a - c}x=${d + b}`, `x=${round((d + b) / (a - c), 2)}`]
        : k === 3 ? [right[0], right[1], `${a + c}x=${d - b}`, `x=${round((d - b) / (a + c), 2)}`]
          : [right[0], right[1], right[2], `x=${x + 1}`];
      return finish(lines, T(`${marks[k - 1]}줄에서 처음 틀렸어요. 이항할 때는 부호가 바뀌고, 같은 항끼리는 계수를 정확히 계산해야 해요. 올바른 해는 x=${x}.`, `Dòng ${marks[k - 1]} sai đầu tiên. Khi chuyển vế phải đổi dấu và khi gộp số hạng đồng dạng phải tính hệ số chính xác. Nghiệm đúng là x=${x}.`), 4, 3, 2);
    }
    // inequality: dividing by a negative number flips the sign
    const a = rand.int(2, 6), r = rand.int(-4, 4), b = rand.int(1, 9), c = b + a * r;
    const lines = k === 2 ? [`-${a}x+${b}>${c}`, `-${a}x>${c}+${b}`, `x>\\frac{${c + b}}{-${a}}`, `x>${round((c + b) / -a, 2)}`]
      : k === 3 ? [`-${a}x+${b}>${c}`, `-${a}x>${c - b}`, `x>\\frac{${c - b}}{-${a}}`, `x>${round((c - b) / -a, 2)}`]
        : [`-${a}x+${b}>${c}`, `-${a}x>${c - b}`, `x<\\frac{${c - b}}{-${a}}`, `x<${round((c - b) / -a + 1, 2)}`];
    return finish(lines, T(`${marks[k - 1]}줄에서 처음 틀렸어요. ${k === 3 ? "음수로 나누면 부등호의 방향이 바뀌어야 해요." : k === 2 ? "상수항을 옮길 때 부호를 바꿔야 해요." : "마지막 값을 정확히 계산해야 해요."}`, `Dòng ${marks[k - 1]} sai đầu tiên. ${k === 3 ? "Chia cho số âm phải đổi chiều bất đẳng thức." : k === 2 ? "Khi chuyển hằng số sang vế kia phải đổi dấu." : "Giá trị cuối cần tính chính xác."}`), 4, 4, 3);
  },
};

export const MATH_A = [factRecall, arith, placeValue, shopping, fractionRatio, rates, stats, plans, errorAnalysis];

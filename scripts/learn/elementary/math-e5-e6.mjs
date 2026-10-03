import { T, tex } from "./math-helpers.mjs";
import { fracTex, gcd } from "./lib.mjs";
import { maker, lessonOf } from "./math-e3-e4.mjs";

const round = (x) => Number(x.toFixed(6));
const lcm = (a, c) => (a * c) / gcd(a, c);
const ONE = T("(숫자만 쓰세요)", "(chỉ nhập số)");
const FRACNOTE = T("(3/4 처럼 분수로 써도 돼요)", "(có thể nhập dạng phân số, ví dụ 3/4)");
const join = (...parts) => T(parts.map((p) => p.ko).join(" "), parts.map((p) => p.vi).join(" "));
const P = (ko, vi) => T(ko, vi);

/* ================================ Elementary 5 ================================ */
export function e5(b, h) {
  const S = { frac: "m.e5.frac", dec: "m.e5.dec", factor: "m.e5.factor", area: "m.e5.area", ratio: "m.e5.ratio" };
  b.skill(S.frac, T("분모가 다른 분수의 덧셈·뺄셈", "Cộng trừ phân số khác mẫu số"));
  b.skill(S.dec, T("소수의 곱셈", "Nhân số thập phân"), S.frac);
  b.skill(S.factor, T("약수와 배수", "Ước số và bội số"), S.frac);
  b.skill(S.area, T("넓이와 부피", "Diện tích và thể tích"), S.dec);
  b.skill(S.ratio, T("비와 비율", "Tỉ số và tỉ lệ"), S.dec);
  const { N, C, F } = maker(b, h, "e5", S);
  const lesson = lessonOf("e5");

  // ---- fractions with different denominators ----
  const fr = (n, role, d, a1, d1, a2, d2, op, fam) => {
    const L = lcm(d1, d2); const x = (a1 * L) / d1, y = (a2 * L) / d2; const r = op === "+" ? x + y : x - y;
    return N("frac", n, role, d, fam, join(P(`${tex(`\\frac{${a1}}{${d1}} ${op} \\frac{${a2}}{${d2}}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`\\frac{${a1}}{${d1}} ${op} \\frac{${a2}}{${d2}}`)}.`), FRACNOTE), r / L,
      [P("먼저 분모를 같게 통분해요.", "Trước tiên hãy quy đồng mẫu số."), P(`${d1}, ${d2}의 최소공배수: ${L}. 이 수를 공통분모로 써요.`, `Chọn ${L} (bội chung nhỏ nhất của ${d1} và ${d2}) làm mẫu số chung.`)],
      P(`${tex(`\\frac{${x}}{${L}} ${op} \\frac{${y}}{${L}} = ${fracTex(r, L)}`)}.`, `${tex(`\\frac{${x}}{${L}} ${op} \\frac{${y}}{${L}} = ${fracTex(r, L)}`)}.`), { tol: 1e-6 });
  };
  const common = (n, role, d, d1, d2, fam) => {
    const L = lcm(d1, d2); const pool = [L, L + 1, L - 1, d1 + d2 === L ? L + 2 : d1 + d2].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);
    return C("frac", n, role, d, fam, P(`다음 두 분수를 통분할 때 가장 작은 공통분모는 얼마일까요? ${tex(`\\frac{1}{${d1}}`)}, ${tex(`\\frac{1}{${d2}}`)}`, `Khi quy đồng ${tex(`\\frac{1}{${d1}}`)} và ${tex(`\\frac{1}{${d2}}`)}, mẫu số chung nhỏ nhất là bao nhiêu?`),
      pool.slice(0, 4).map((v) => tex(String(v))), pool.slice(0, 4).indexOf(L), [P("두 분모의 최소공배수를 구해요.", "Hãy tìm bội chung nhỏ nhất của hai mẫu số."), P(`${d1}의 배수와 ${d2}의 배수에서 처음 겹치는 수를 찾아요.`, `Tìm số đầu tiên chung của các bội của ${d1} và ${d2}.`)], P(`${d1}, ${d2}의 최소공배수는 ${L}.`, `Bội chung nhỏ nhất của ${d1} và ${d2} là ${L}.`));
  };
  const q1 = fr(1, "core", 2, 1, 2, 1, 3, "+", "e5-fr");
  const q2 = fr(2, "core", 2, 3, 4, 1, 6, "-", "e5-fr");
  const q3 = fr(3, "core", 3, 2, 3, 3, 4, "+", "e5-fr");
  const q4 = common(4, "core", 2, 2, 3, "e5-lcd");
  const q5 = fr(5, "core", 3, 5, 6, 3, 8, "-", "e5-fr");
  fr("v1", "variant", 2, 1, 4, 1, 6, "+", "e5-fr"); fr("v2", "variant", 2, 5, 6, 1, 3, "-", "e5-fr"); common("v3", "variant", 2, 4, 6, "e5-lcd");
  fr("d1", "diagnostic", 1, 1, 2, 1, 4, "+"); fr("d2", "diagnostic", 2, 2, 5, 1, 10, "+");

  // ---- decimal multiplication ----
  const dm = (n, role, d, a, c, fam) => N("dec", n, role, d, fam, join(P(`${tex(`${a} \\times ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} \\times ${c}`)}.`)), round(a * c),
    [P("소수점을 없애고 자연수처럼 곱해요.", "Bỏ dấu phẩy và nhân như số tự nhiên."), P("곱한 뒤 소수점의 자리를 다시 맞춰요.", "Nhân xong, đặt lại dấu phẩy cho đúng.")], P(`${tex(`${a} \\times ${c} = ${round(a * c)}`)}.`, `${tex(`${a} \\times ${c} = ${round(a * c)}`)}.`));
  const w1 = dm(1, "core", 1, 0.6, 4, "e5-dm");
  const w2 = dm(2, "core", 1, 1.2, 3, "e5-dm");
  const w3 = dm(3, "core", 2, 2.5, 1.2, "e5-dm2");
  const w4 = dm(4, "core", 2, 0.4, 0.5, "e5-dm2");
  const w5 = dm(5, "core", 3, 3.6, 2.5, "e5-dm2");
  dm("v1", "variant", 1, 0.3, 6, "e5-dm"); dm("v2", "variant", 2, 1.5, 0.4, "e5-dm2"); dm("d1", "diagnostic", 1, 0.5, 8);

  // ---- factors & multiples ----
  const divisors = (n) => { let c = 0; for (let i = 1; i <= n; i++) if (n % i === 0) c++; return c; };
  const cnt = (n, role, d, v, fam) => N("factor", n, role, d, fam, join(P(`${v}의 약수는 모두 몇 개일까요?`, `Số ${v} có tất cả bao nhiêu ước số?`), ONE), divisors(v), [P("1부터 차례로 나누어떨어지는 수를 찾아요.", "Lần lượt tìm các số chia hết cho nhau, bắt đầu từ 1."), P("약수는 짝을 지어서 찾으면 쉬워요.", "Tìm các ước theo từng cặp sẽ dễ hơn.")], P(`${v}의 약수의 개수는 ${divisors(v)}개.`, `Số ${v} có ${divisors(v)} ước số.`));
  const lcmQ = (n, role, d, a, c, fam) => N("factor", n, role, d, fam, join(P(`두 수 ${a}, ${c}의 최소공배수는 얼마일까요?`, `Bội chung nhỏ nhất của hai số ${a} và ${c} là bao nhiêu?`), ONE), lcm(a, c), [P("각 수의 배수를 차례로 써 보세요.", "Hãy lần lượt viết các bội của mỗi số."), P("처음으로 같아지는 수가 최소공배수예요.", "Số chung đầu tiên chính là bội chung nhỏ nhất.")], P(`${a}, ${c}의 최소공배수는 ${lcm(a, c)}.`, `Bội chung nhỏ nhất của ${a} và ${c} là ${lcm(a, c)}.`));
  const gcdQ = (n, role, d, a, c, fam) => N("factor", n, role, d, fam, join(P(`두 수 ${a}, ${c}의 최대공약수는 얼마일까요?`, `Ước chung lớn nhất của hai số ${a} và ${c} là bao nhiêu?`), ONE), gcd(a, c), [P("두 수의 약수를 각각 구해요.", "Hãy tìm các ước của từng số."), P("공통인 약수 중 가장 큰 수를 골라요.", "Chọn số lớn nhất trong các ước chung.")], P(`${a}, ${c}의 최대공약수는 ${gcd(a, c)}.`, `Ước chung lớn nhất của ${a} và ${c} là ${gcd(a, c)}.`));
  const x1 = cnt(1, "core", 1, 12, "e5-div");
  const x2 = lcmQ(2, "core", 2, 4, 6, "e5-lcm");
  const x3 = gcdQ(3, "core", 2, 12, 18, "e5-gcd");
  const x4 = F("factor", 4, "core", 2, "e5-mult", P("15는 5의 배수예요. 맞을까요?", "15 là bội số của 5. Đúng hay sai?"), true, [P("5를 1배, 2배, 3배 해 보세요.", "Hãy nhân 5 với 1, 2, 3."), P("5 × 3 = 15 예요.", "5 × 3 = 15.")], P("5 × 3 = 15 이므로 15는 5의 배수예요.", "Vì 5 × 3 = 15 nên 15 là bội số của 5."));
  const x5 = lcmQ(5, "core", 3, 8, 12, "e5-lcm");
  cnt("v1", "variant", 1, 18, "e5-div"); gcdQ("v2", "variant", 2, 6, 9, "e5-gcd");
  C("factor", "v3", "variant", 2, "e5-mult", P("다음 중 7의 배수는?", "Số nào sau đây là bội số của 7?"), ["21", "25", "30", "34"].map((v) => tex(v)), 0, [P("7단 곱셈구구를 떠올려요.", "Hãy nhớ bảng nhân 7."), P("7 × 3 = 21 이에요.", "7 × 3 = 21.")], P("21 = 7 × 3 이므로 7의 배수예요.", "21 = 7 × 3 nên là bội số của 7."));
  cnt("d1", "diagnostic", 2, 10);

  // ---- area & volume ----
  const rect = (n, role, d, w, l, fam) => N("area", n, role, d, fam, join(P(`가로 ${w}cm, 세로 ${l}cm인 직사각형의 넓이는 몇 cm²일까요?`, `Hình chữ nhật có chiều rộng ${w} cm, chiều dài ${l} cm. Diện tích là bao nhiêu cm²?`), ONE), w * l, [P("직사각형의 넓이 = 가로 × 세로", "Diện tích hình chữ nhật = chiều rộng × chiều dài."), P(`${w} × ${l} 의 값을 구해요.`, `Hãy tính ${w} × ${l}.`)], P(`${tex(`${w} \\times ${l} = ${w * l}`)}. 넓이는 ${w * l}cm².`, `${tex(`${w} \\times ${l} = ${w * l}`)}. Diện tích là ${w * l} cm².`));
  const triQ = (n, role, d, base, ht, fam) => N("area", n, role, d, fam, join(P(`밑변이 ${base}cm, 높이가 ${ht}cm인 삼각형의 넓이는 몇 cm²일까요?`, `Tam giác có đáy ${base} cm và chiều cao ${ht} cm. Diện tích là bao nhiêu cm²?`), ONE), (base * ht) / 2, [P("삼각형의 넓이 = 밑변 × 높이 ÷ 2", "Diện tích tam giác = đáy × chiều cao ÷ 2."), P(`밑변 × 높이를 구한 뒤 2로 나눠요.`, `Tính ${base} × ${ht} rồi chia cho 2.`)], P(`${tex(`${base} \\times ${ht} \\div 2 = ${(base * ht) / 2}`)}. 넓이는 ${(base * ht) / 2}cm².`, `${tex(`${base} \\times ${ht} \\div 2 = ${(base * ht) / 2}`)}. Diện tích là ${(base * ht) / 2} cm².`));
  const sq = (n, role, d, a, fam) => N("area", n, role, d, fam, join(P(`한 변이 ${a}cm인 정사각형의 넓이는 몇 cm²일까요?`, `Hình vuông có cạnh ${a} cm. Diện tích là bao nhiêu cm²?`), ONE), a * a, [P("정사각형의 넓이 = 한 변 × 한 변", "Diện tích hình vuông = cạnh × cạnh."), P(`${a} × ${a} 의 값을 구해요.`, `Hãy tính ${a} × ${a}.`)], P(`${tex(`${a} \\times ${a} = ${a * a}`)}. 넓이는 ${a * a}cm².`, `${tex(`${a} \\times ${a} = ${a * a}`)}. Diện tích là ${a * a} cm².`));
  const vol = (n, role, d, a, c, e, fam) => N("area", n, role, d, fam, join(P(`가로 ${a}cm, 세로 ${c}cm, 높이 ${e}cm인 직육면체의 부피는 몇 cm³일까요?`, `Hình hộp chữ nhật có chiều dài ${a} cm, chiều rộng ${c} cm, chiều cao ${e} cm. Thể tích là bao nhiêu cm³?`), ONE), a * c * e, [P("직육면체의 부피 = 가로 × 세로 × 높이", "Thể tích hình hộp chữ nhật = dài × rộng × cao."), P(`${a} × ${c} × ${e} 의 값을 구해요.`, `Hãy tính ${a} × ${c} × ${e}.`)], P(`${tex(`${a} \\times ${c} \\times ${e} = ${a * c * e}`)}. 부피는 ${a * c * e}cm³.`, `${tex(`${a} \\times ${c} \\times ${e} = ${a * c * e}`)}. Thể tích là ${a * c * e} cm³.`));
  const para = (n, role, d, base, ht, fam) => N("area", n, role, d, fam, join(P(`밑변이 ${base}cm, 높이가 ${ht}cm인 평행사변형의 넓이는 몇 cm²일까요?`, `Hình bình hành có đáy ${base} cm và chiều cao ${ht} cm. Diện tích là bao nhiêu cm²?`), ONE), base * ht, [P("평행사변형의 넓이 = 밑변 × 높이", "Diện tích hình bình hành = đáy × chiều cao."), P(`${base} × ${ht} 의 값을 구해요.`, `Hãy tính ${base} × ${ht}.`)], P(`${tex(`${base} \\times ${ht} = ${base * ht}`)}. 넓이는 ${base * ht}cm².`, `${tex(`${base} \\times ${ht} = ${base * ht}`)}. Diện tích là ${base * ht} cm².`));
  const a1 = rect(1, "core", 1, 5, 8, "e5-plane");
  const a2 = triQ(2, "core", 2, 10, 6, "e5-plane");
  const a3 = sq(3, "core", 1, 7, "e5-plane");
  const a4 = vol(4, "core", 2, 4, 3, 5, "e5-vol");
  const a5 = para(5, "core", 3, 9, 7, "e5-plane");
  rect("v1", "variant", 1, 3, 12, "e5-plane"); triQ("v2", "variant", 2, 8, 5, "e5-plane"); vol("v3", "variant", 2, 2, 5, 6, "e5-vol"); rect("d1", "diagnostic", 1, 6, 7);

  // ---- ratio ----
  const ratioDec = (n, role, d, a, c, fam) => N("ratio", n, role, d, fam, join(P(`${tex(`${a} : ${c}`)} 의 비율을 소수로 나타내면 얼마일까요?`, `Tỉ số ${tex(`${a} : ${c}`)} viết dưới dạng số thập phân là bao nhiêu?`), ONE), round(a / c), [P("비율 = 비교하는 양 ÷ 기준량", "Tỉ lệ = số so sánh ÷ số gốc."), P(`${a} ÷ ${c} 의 값을 구해요.`, `Hãy tính ${a} ÷ ${c}.`)], P(`${tex(`${a} \\div ${c} = ${round(a / c)}`)}.`, `${tex(`${a} \\div ${c} = ${round(a / c)}`)}.`));
  const simplest = (n, role, d, a, c, fam) => N("ratio", n, role, d, fam, join(P(`다음 비를 가장 간단한 자연수의 비로 나타낼 때 앞의 수는 얼마일까요? ${tex(`${a} : ${c}`)}`, `Rút gọn tỉ số ${tex(`${a} : ${c}`)} về tỉ số các số tự nhiên đơn giản nhất. Số đứng trước là bao nhiêu?`), ONE), a / gcd(a, c), [P("두 수를 최대공약수로 나눠요.", "Chia cả hai số cho ước chung lớn nhất."), P(`${a}, ${c}의 최대공약수를 구해요.`, `Tìm ước chung lớn nhất của ${a} và ${c}.`)], P(`${tex(`${a} : ${c} = ${a / gcd(a, c)} : ${c / gcd(a, c)}`)}.`, `${tex(`${a} : ${c} = ${a / gcd(a, c)} : ${c / gcd(a, c)}`)}.`));
  const glasses = (n, role, d, total, k, fam) => N("ratio", n, role, d, fam, join(P(`${total}명 중 ${k}명이 안경을 썼어요. 안경을 쓴 학생 수의 비율을 소수로 나타내면 얼마일까요?`, `Trong ${total} bạn có ${k} bạn đeo kính. Tỉ lệ bạn đeo kính viết dưới dạng số thập phân là bao nhiêu?`), ONE), round(k / total), [P("비율 = 안경 쓴 학생 수 ÷ 전체 학생 수", "Tỉ lệ = số bạn đeo kính ÷ tổng số bạn."), P(`${k} ÷ ${total} 의 값을 구해요.`, `Hãy tính ${k} ÷ ${total}.`)], P(`${tex(`${k} \\div ${total} = ${round(k / total)}`)}.`, `${tex(`${k} \\div ${total} = ${round(k / total)}`)}.`));
  const pctOf = (n, role, d, num, den, fam) => N("ratio", n, role, d, fam, join(P(`${den}쪽짜리 책을 ${num}쪽 읽었어요. 읽은 쪽수의 백분율은 몇 %일까요?`, `Một cuốn sách ${den} trang, bạn đã đọc ${num} trang. Số trang đã đọc chiếm bao nhiêu phần trăm?`), ONE), round((num / den) * 100), [P("비율에 100을 곱하면 백분율이에요.", "Lấy tỉ lệ nhân với 100 để được phần trăm."), P(`${num} ÷ ${den} × 100 의 값을 구해요.`, `Hãy tính ${num} ÷ ${den} × 100.`)], P(`${tex(`${num} \\div ${den} \\times 100 = ${round((num / den) * 100)}`)}. ${round((num / den) * 100)}%.`, `${tex(`${num} \\div ${den} \\times 100 = ${round((num / den) * 100)}`)}. Đó là ${round((num / den) * 100)}%.`));
  const frToPct = N("ratio", 4, "core", 2, "e5-pct", join(P(`다음 비율을 백분율로 나타내면 몇 %일까요? ${tex("\\frac{3}{4}")}`, `Tỉ lệ ${tex("\\frac{3}{4}")} viết thành phần trăm là bao nhiêu %?`), ONE), 75, [P("분수를 소수로 바꾼 뒤 100을 곱해요.", "Đổi phân số thành số thập phân rồi nhân với 100."), P("3 ÷ 4 = 0.75 예요.", "3 ÷ 4 = 0.75.")], P(`${tex("\\frac{3}{4} = 0.75 = 75\\%")}.`, `${tex("\\frac{3}{4} = 0.75 = 75\\%")}.`));
  const r1 = ratioDec(1, "core", 1, 3, 5, "e5-rate");
  const r2 = simplest(2, "core", 2, 12, 8, "e5-rate");
  const r3 = glasses(3, "core", 2, 5, 2, "e5-rate");
  const r5 = pctOf(5, "core", 3, 10, 40, "e5-pct");
  ratioDec("v1", "variant", 1, 2, 5, "e5-rate"); simplest("v2", "variant", 2, 20, 30, "e5-rate"); pctOf("v3", "variant", 2, 9, 12, "e5-pct"); ratioDec("d1", "diagnostic", 2, 1, 4);

  b.course({
    id: "math-e5", grade: "E5", title: T("초5 수학 · 분수, 소수, 약수·배수, 넓이", "Toán Lớp 5 · Phân số, số thập phân, ước và bội, diện tích"),
    world: { name: T("Prime Peak", "Đỉnh Núi Số Nguyên Tố"), emoji: "🏔️", tagline: T("약수와 배수의 봉우리를 올라요", "Leo lên đỉnh núi của ước số và bội số") },
    unit: { id: "math-e5-u1", title: T("분수, 소수, 약수와 배수, 넓이와 부피, 비율", "Phân số, số thập phân, ước và bội, diện tích và thể tích, tỉ lệ") },
    lessons: [
      lesson(1, "frac", S, T("분모가 다른 분수의 덧셈·뺄셈", "Cộng trừ phân số khác mẫu số"), T("분모가 다르면 먼저 **통분**해요. 두 분모의 최소공배수를 공통분모로 쓰면 편해요.", "Khi mẫu số khác nhau, hãy **quy đồng** trước. Dùng bội chung nhỏ nhất của hai mẫu số làm mẫu số chung."), T(`${tex("\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}")}`, `${tex("\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}")}`), [q1, q2, q3, q4], q5),
      lesson(2, "dec", S, T("소수의 곱셈", "Nhân số thập phân"), T("소수점을 없애고 자연수처럼 곱한 뒤, 곱해진 소수점 아래 자리 수만큼 소수점을 다시 찍어요.", "Bỏ dấu phẩy, nhân như số tự nhiên, rồi đặt lại dấu phẩy sao cho có đủ chữ số thập phân."), T(`${tex("0.6 \\times 4 = 2.4")}`, `${tex("0.6 \\times 4 = 2.4")}`), [w1, w2, w3, w4], w5),
      lesson(3, "factor", S, T("약수와 배수", "Ước số và bội số"), T("**약수**는 어떤 수를 나누어떨어지게 하는 수, **배수**는 그 수를 1배, 2배, 3배... 한 수예요.", "**Ước số** là số chia hết một số cho trước; **bội số** là kết quả khi nhân số đó với 1, 2, 3, ..."), T("12의 약수: 1, 2, 3, 4, 6, 12", "Các ước của 12: 1, 2, 3, 4, 6, 12"), [x1, x2, x3, x4], x5),
      lesson(4, "area", S, T("넓이와 부피", "Diện tích và thể tích"), T("직사각형은 **가로 × 세로**, 삼각형은 **밑변 × 높이 ÷ 2**, 직육면체의 부피는 **가로 × 세로 × 높이**예요.", "Hình chữ nhật: **dài × rộng**; tam giác: **đáy × chiều cao ÷ 2**; thể tích hình hộp chữ nhật: **dài × rộng × cao**."), T(`${tex("8 \\times 5 = 40")} cm²`, `${tex("8 \\times 5 = 40")} cm²`), [a1, a2, a3, a4], a5),
      lesson(5, "ratio", S, T("비와 비율", "Tỉ số và tỉ lệ"), T("**비율**은 비교하는 양을 기준량으로 나눈 값이에요. 비율에 100을 곱하면 **백분율(%)**이에요.", "**Tỉ lệ** là số so sánh chia cho số gốc. Nhân tỉ lệ với 100 ta được **phần trăm (%)**."), T(`${tex("3 : 5 \\to 3 \\div 5 = 0.6")}`, `${tex("3 : 5 \\to 3 \\div 5 = 0.6")}`), [r1, r2, r3, frToPct], r5),
    ],
  });
}

/* ================================ Elementary 6 ================================ */
export function e6(b, h) {
  const S = { frac: "m.e6.frac", ratio: "m.e6.ratio", pct: "m.e6.pct", geo: "m.e6.geo", stat: "m.e6.stat" };
  b.skill(S.frac, T("분수·소수의 곱셈과 나눗셈", "Nhân chia phân số và số thập phân"));
  b.skill(S.ratio, T("비례식과 비례배분", "Tỉ lệ thức và chia theo tỉ lệ"), S.frac);
  b.skill(S.pct, T("백분율", "Phần trăm"), S.ratio);
  b.skill(S.geo, T("원과 입체도형", "Hình tròn và hình khối"), S.frac);
  b.skill(S.stat, T("평균과 자료 정리", "Trung bình cộng và số liệu"), S.pct);
  const { N, C } = maker(b, h, "e6", S);
  const lesson = lessonOf("e6");

  // ---- fraction / decimal operations ----
  const fmul = (n, role, d, a1, d1, a2, d2, fam) => N("frac", n, role, d, fam, join(P(`${tex(`\\frac{${a1}}{${d1}} \\times \\frac{${a2}}{${d2}}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`\\frac{${a1}}{${d1}} \\times \\frac{${a2}}{${d2}}`)}.`), FRACNOTE), (a1 * a2) / (d1 * d2), [P("분자끼리, 분모끼리 곱해요.", "Nhân tử số với tử số, mẫu số với mẫu số."), P("곱한 뒤 약분할 수 있으면 약분해요.", "Nhân xong, nếu rút gọn được thì hãy rút gọn.")], P(`${tex(`\\frac{${a1}}{${d1}} \\times \\frac{${a2}}{${d2}} = ${fracTex(a1 * a2, d1 * d2)}`)}.`, `${tex(`\\frac{${a1}}{${d1}} \\times \\frac{${a2}}{${d2}} = ${fracTex(a1 * a2, d1 * d2)}`)}.`), { tol: 1e-6 });
  const fdiv = (n, role, d, a1, d1, a2, d2, fam) => N("frac", n, role, d, fam, join(P(`${tex(`\\frac{${a1}}{${d1}} \\div \\frac{${a2}}{${d2}}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`\\frac{${a1}}{${d1}} \\div \\frac{${a2}}{${d2}}`)}.`), FRACNOTE), (a1 * d2) / (d1 * a2), [P("나누는 분수의 분자와 분모를 바꾸어 곱해요.", "Đảo ngược phân số chia rồi nhân."), P("곱한 뒤 약분해요.", "Nhân xong thì rút gọn.")], P(`${tex(`\\frac{${a1}}{${d1}} \\div \\frac{${a2}}{${d2}} = \\frac{${a1}}{${d1}} \\times \\frac{${d2}}{${a2}} = ${fracTex(a1 * d2, d1 * a2)}`)}.`, `${tex(`\\frac{${a1}}{${d1}} \\div \\frac{${a2}}{${d2}} = \\frac{${a1}}{${d1}} \\times \\frac{${d2}}{${a2}} = ${fracTex(a1 * d2, d1 * a2)}`)}.`), { tol: 1e-6 });
  const ddiv = (n, role, d, a, c, fam) => N("frac", n, role, d, fam, join(P(`${tex(`${a} \\div ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} \\div ${c}`)}.`), ONE), round(a / c), [P("나누는 수와 나누어지는 수의 소수점을 같은 자리만큼 옮겨요.", "Dời dấu phẩy của số chia và số bị chia sang phải cùng số chữ số."), P("자연수의 나눗셈처럼 계산해요.", "Rồi chia như số tự nhiên.")], P(`${tex(`${a} \\div ${c} = ${round(a / c)}`)}.`, `${tex(`${a} \\div ${c} = ${round(a / c)}`)}.`));
  const fdivInt = N("frac", 4, "core", 2, "e6-fd", join(P(`${tex("\\frac{5}{6} \\div 5")} 의 값을 구하세요.`, `Tính giá trị của ${tex("\\frac{5}{6} \\div 5")}.`), FRACNOTE), 1 / 6, [P("자연수로 나누는 것은 그 수의 역수를 곱하는 것과 같아요.", "Chia cho một số tự nhiên bằng nhân với số nghịch đảo của nó."), P("5로 나누면 ×1/5 예요.", "Chia cho 5 nghĩa là nhân với 1/5.")], P(`${tex("\\frac{5}{6} \\times \\frac{1}{5} = \\frac{1}{6}")}.`, `${tex("\\frac{5}{6} \\times \\frac{1}{5} = \\frac{1}{6}")}.`), { tol: 1e-6 });
  const f1 = fmul(1, "core", 2, 3, 4, 2, 5, "e6-fm");
  const f2 = fdiv(2, "core", 2, 2, 3, 4, 9, "e6-fd");
  const f3 = ddiv(3, "core", 2, 3.6, 1.2, "e6-dd");
  const f5 = N("frac", 5, "core", 3, "e6-fd", join(P(`${tex("\\frac{7}{8} \\times 4 \\div \\frac{7}{4}")} 의 값을 구하세요.`, `Tính giá trị của ${tex("\\frac{7}{8} \\times 4 \\div \\frac{7}{4}")}.`), ONE), 2, [P("앞에서부터 차례로 계산해요.", "Hãy tính lần lượt từ trái sang phải."), P("나눗셈은 역수를 곱해요.", "Phép chia là nhân với số nghịch đảo.")], P(`${tex("\\frac{7}{8} \\times 4 = \\frac{7}{2},\\ \\frac{7}{2} \\div \\frac{7}{4} = 2")}.`, `${tex("\\frac{7}{8} \\times 4 = \\frac{7}{2},\\ \\frac{7}{2} \\div \\frac{7}{4} = 2")}.`));
  fmul("v1", "variant", 2, 2, 3, 3, 4, "e6-fm"); ddiv("v2", "variant", 2, 8.4, 2.1, "e6-dd"); fdiv("v3", "variant", 2, 3, 4, 3, 8, "e6-fd");
  fmul("d1", "diagnostic", 1, 1, 2, 1, 3); ddiv("d2", "diagnostic", 2, 6, 1.5);

  // ---- ratio / proportion ----
  const prop1 = (n, role, d, a, c, e, fam) => N("ratio", n, role, d, fam, join(P(`비례식 ${tex(`${a} : ${c} = ${e} : \\square`)} 에서 □ 안에 알맞은 수는 얼마일까요?`, `Trong tỉ lệ thức ${tex(`${a} : ${c} = ${e} : \\square`)}, số trong ô vuông là bao nhiêu?`), ONE), (c * e) / a, [P("비례식에서 안쪽의 곱과 바깥쪽의 곱은 같아요.", "Trong tỉ lệ thức, tích hai trung tỉ bằng tích hai ngoại tỉ."), P(`${a} × □ = ${c} × ${e} 로 풀어요.`, `Giải ${a} × □ = ${c} × ${e}.`)], P(`${tex(`${a} \\times \\square = ${c} \\times ${e}`)} 이므로 □ = ${(c * e) / a}.`, `${tex(`${a} \\times \\square = ${c} \\times ${e}`)} nên □ = ${(c * e) / a}.`));
  const prop2 = N("ratio", 2, "core", 2, "e6-prop", join(P(`비례식 ${tex("5 : 2 = \\square : 10")} 에서 □ 안에 알맞은 수는 얼마일까요?`, `Trong tỉ lệ thức ${tex("5 : 2 = \\square : 10")}, số trong ô vuông là bao nhiêu?`), ONE), 25, [P("안쪽의 곱과 바깥쪽의 곱이 같아요.", "Tích hai trung tỉ bằng tích hai ngoại tỉ."), P("2 × □ = 5 × 10 으로 풀어요.", "Giải 2 × □ = 5 × 10.")], P(`${tex("2 \\times \\square = 5 \\times 10 = 50")} 이므로 □ = 25.`, `${tex("2 \\times \\square = 5 \\times 10 = 50")} nên □ = 25.`));
  const split = (n, role, d, total, a, c, fam) => N("ratio", n, role, d, fam, join(P(`사탕 ${total}개를 ${a}:${c}의 비로 나누어 가지려고 해요. 더 많이 가진 쪽은 몇 개를 가질까요?`, `Chia ${total} viên kẹo theo tỉ lệ ${a}:${c}. Bên nhận nhiều hơn được bao nhiêu viên?`), ONE), (total * Math.max(a, c)) / (a + c), [P(`전체를 ${a + c}로 똑같이 나누어 생각해요.`, `Hãy chia cả số kẹo thành ${a + c} phần bằng nhau.`), P("큰 비에 해당하는 몫만큼 가져요.", "Bên có phần lớn hơn nhận số phần tương ứng.")], P(`${tex(`${total} \\div ${a + c} \\times ${Math.max(a, c)} = ${(total * Math.max(a, c)) / (a + c)}`)}.`, `${tex(`${total} \\div ${a + c} \\times ${Math.max(a, c)} = ${(total * Math.max(a, c)) / (a + c)}`)}.`));
  const price = N("ratio", 4, "core", 3, "e6-word", join(P("연필 3자루의 값이 1500원이에요. 같은 연필 7자루의 값은 얼마일까요?", "Giá 3 cây bút chì là 1500 đồng. Giá 7 cây bút chì như vậy là bao nhiêu đồng?"), ONE), 3500, [P("연필 1자루의 값을 먼저 구해요.", "Hãy tìm giá của 1 cây bút chì trước."), P("1500 ÷ 3 = 500 이에요.", "1500 ÷ 3 = 500.")], P(`${tex("1500 \\div 3 \\times 7 = 3500")}. 3500원.`, `${tex("1500 \\div 3 \\times 7 = 3500")}. Là 3500 đồng.`));
  const p1 = prop1(1, "core", 1, 3, 4, 12, "e6-prop");
  const p3 = split(3, "core", 2, 20, 3, 2, "e6-split");
  const p5 = prop1(5, "core", 3, 7, 3, 28, "e6-prop");
  prop1("v1", "variant", 1, 2, 3, 12, "e6-prop"); split("v2", "variant", 2, 30, 2, 3, "e6-split"); N("ratio", "v3", "variant", 3, "e6-word", join(P("공책 4권의 값이 2000원이에요. 같은 공책 9권의 값은 얼마일까요?", "Giá 4 quyển vở là 2000 đồng. Giá 9 quyển vở như vậy là bao nhiêu đồng?"), ONE), 4500, [P("공책 1권의 값을 먼저 구해요.", "Tìm giá của 1 quyển vở trước."), P("2000 ÷ 4 = 500 이에요.", "2000 ÷ 4 = 500.")], P(`${tex("2000 \\div 4 \\times 9 = 4500")}. 4500원.`, `${tex("2000 \\div 4 \\times 9 = 4500")}. Là 4500 đồng.`));
  prop1("d1", "diagnostic", 2, 1, 2, 5);

  // ---- percent ----
  const toPct = (n, role, d, num, den, fam) => N("pct", n, role, d, fam, join(P(`다음 분수를 백분율로 나타내면 몇 %일까요? ${tex(`\\frac{${num}}{${den}}`)}`, `Viết phân số ${tex(`\\frac{${num}}{${den}}`)} thành phần trăm. Kết quả là bao nhiêu %?`), ONE), round((num / den) * 100), [P("분수를 소수로 바꾼 뒤 100을 곱해요.", "Đổi phân số thành số thập phân rồi nhân với 100."), P(`${num} ÷ ${den} 의 값을 구해요.`, `Hãy tính ${num} ÷ ${den}.`)], P(`${tex(`\\frac{${num}}{${den}} = ${round(num / den)} = ${round((num / den) * 100)}\\%`)}.`, `${tex(`\\frac{${num}}{${den}} = ${round(num / den)} = ${round((num / den) * 100)}\\%`)}.`));
  const pctOf = (n, role, d, whole, p, fam) => N("pct", n, role, d, fam, join(P(`${whole}의 ${p}%는 얼마일까요?`, `${p}% của ${whole} là bao nhiêu?`), ONE), round((whole * p) / 100), [P("백분율은 100분의 몇이라는 뜻이에요.", "Phần trăm nghĩa là bao nhiêu phần của 100."), P(`${whole} × ${p} ÷ 100 의 값을 구해요.`, `Hãy tính ${whole} × ${p} ÷ 100.`)], P(`${tex(`${whole} \\times ${p} \\div 100 = ${round((whole * p) / 100)}`)}.`, `${tex(`${whole} \\times ${p} \\div 100 = ${round((whole * p) / 100)}`)}.`));
  const sale = (n, role, d, price, off, fam) => N("pct", n, role, d, fam, join(P(`정가 ${price}원인 물건을 ${off}% 할인해서 팔아요. 할인한 가격은 얼마일까요?`, `Một món hàng giá niêm yết ${price} đồng được giảm ${off}%. Giá sau khi giảm là bao nhiêu đồng?`), ONE), round(price * (1 - off / 100)), [P("할인 금액을 먼저 구해요.", "Hãy tính số tiền được giảm trước."), P("정가에서 할인 금액을 빼요.", "Lấy giá niêm yết trừ đi số tiền giảm.")], P(`${tex(`${price} - ${price} \\times ${off} \\div 100 = ${round(price * (1 - off / 100))}`)}.`, `${tex(`${price} - ${price} \\times ${off} \\div 100 = ${round(price * (1 - off / 100))}`)}.`));
  const decToPct = N("pct", 4, "core", 2, "e6-conv", join(P(`다음 소수를 백분율로 나타내면 몇 %일까요? ${tex("0.35")}`, `Viết số thập phân ${tex("0.35")} thành phần trăm. Kết quả là bao nhiêu %?`), ONE), 35, [P("소수에 100을 곱해요.", "Nhân số thập phân với 100."), P("0.35 × 100 의 값을 구해요.", "Hãy tính 0.35 × 100.")], P(`${tex("0.35 \\times 100 = 35\\%")}.`, `${tex("0.35 \\times 100 = 35\\%")}.`));
  const profit = N("pct", 5, "core", 3, "e6-price", join(P("원가가 20000원인 물건에 15%의 이익을 붙여 팔아요. 판매 가격은 얼마일까요?", "Một món hàng giá vốn 20000 đồng được bán với lợi nhuận 15%. Giá bán là bao nhiêu đồng?"), ONE), 23000, [P("이익 금액을 먼저 구해요.", "Hãy tính số tiền lợi nhuận trước."), P("20000의 15%를 구한 뒤 원가에 더해요.", "Tính 15% của 20000 rồi cộng vào giá vốn.")], P(`${tex("20000 + 20000 \\times 15 \\div 100 = 23000")}.`, `${tex("20000 + 20000 \\times 15 \\div 100 = 23000")}.`));
  const c1 = toPct(1, "core", 1, 3, 5, "e6-conv");
  const c2 = pctOf(2, "core", 1, 80, 25, "e6-of");
  const c3 = sale(3, "core", 2, 5000, 20, "e6-price");
  pctOf("v1", "variant", 1, 200, 30, "e6-of"); sale("v2", "variant", 2, 8000, 25, "e6-price"); toPct("v3", "variant", 1, 1, 4, "e6-conv"); N("pct", "d1", "diagnostic", 1, undefined, join(P(`다음 소수를 백분율로 나타내면 몇 %일까요? ${tex("0.5")}`, `Viết số thập phân ${tex("0.5")} thành phần trăm. Kết quả là bao nhiêu %?`), ONE), 50, [P("소수에 100을 곱해요.", "Nhân số thập phân với 100."), P("0.5 × 100 의 값을 구해요.", "Hãy tính 0.5 × 100.")], P(`${tex("0.5 \\times 100 = 50\\%")}.`, `${tex("0.5 \\times 100 = 50\\%")}.`));

  // ---- circles & solids ----
  const circ = (n, role, d, diam, fam) => N("geo", n, role, d, fam, join(P(`지름이 ${diam}cm인 원의 둘레는 몇 cm일까요? (원주율은 3.14)`, `Hình tròn có đường kính ${diam} cm. Chu vi dài bao nhiêu cm? (lấy π = 3,14)`), ONE), round(diam * 3.14), [P("원의 둘레 = 지름 × 원주율", "Chu vi hình tròn = đường kính × π."), P(`${diam} × 3.14 의 값을 구해요.`, `Hãy tính ${diam} × 3,14.`)], P(`${tex(`${diam} \\times 3.14 = ${round(diam * 3.14)}`)}. 둘레는 ${round(diam * 3.14)}cm.`, `${tex(`${diam} \\times 3.14 = ${round(diam * 3.14)}`)}. Chu vi là ${round(diam * 3.14)} cm.`));
  const circArea = (n, role, d, r, fam) => N("geo", n, role, d, fam, join(P(`반지름이 ${r}cm인 원의 넓이는 몇 cm²일까요? (원주율은 3.14)`, `Hình tròn có bán kính ${r} cm. Diện tích là bao nhiêu cm²? (lấy π = 3,14)`), ONE), round(r * r * 3.14), [P("원의 넓이 = 반지름 × 반지름 × 원주율", "Diện tích hình tròn = bán kính × bán kính × π."), P(`${r} × ${r} × 3.14 의 값을 구해요.`, `Hãy tính ${r} × ${r} × 3,14.`)], P(`${tex(`${r} \\times ${r} \\times 3.14 = ${round(r * r * 3.14)}`)}. 넓이는 ${round(r * r * 3.14)}cm².`, `${tex(`${r} \\times ${r} \\times 3.14 = ${round(r * r * 3.14)}`)}. Diện tích là ${round(r * r * 3.14)} cm².`));
  const box = (n, role, d, a, c, e, fam) => N("geo", n, role, d, fam, join(P(`가로 ${a}cm, 세로 ${c}cm, 높이 ${e}cm인 직육면체의 부피는 몇 cm³일까요?`, `Hình hộp chữ nhật có chiều dài ${a} cm, chiều rộng ${c} cm, chiều cao ${e} cm. Thể tích là bao nhiêu cm³?`), ONE), a * c * e, [P("부피 = 가로 × 세로 × 높이", "Thể tích = dài × rộng × cao."), P(`${a} × ${c} × ${e} 의 값을 구해요.`, `Hãy tính ${a} × ${c} × ${e}.`)], P(`${tex(`${a} \\times ${c} \\times ${e} = ${a * c * e}`)}. 부피는 ${a * c * e}cm³.`, `${tex(`${a} \\times ${c} \\times ${e} = ${a * c * e}`)}. Thể tích là ${a * c * e} cm³.`));
  const cube = N("geo", 4, "core", 2, "e6-box", join(P("한 모서리가 4cm인 정육면체의 부피는 몇 cm³일까요?", "Hình lập phương có cạnh 4 cm. Thể tích là bao nhiêu cm³?"), ONE), 64, [P("정육면체의 부피 = 한 모서리 × 한 모서리 × 한 모서리", "Thể tích hình lập phương = cạnh × cạnh × cạnh."), P("4 × 4 × 4 의 값을 구해요.", "Hãy tính 4 × 4 × 4.")], P(`${tex("4 \\times 4 \\times 4 = 64")}. 부피는 64cm³.`, `${tex("4 \\times 4 \\times 4 = 64")}. Thể tích là 64 cm³.`));
  const g1 = circ(1, "core", 1, 10, "e6-circle");
  const g2 = circArea(2, "core", 2, 5, "e6-circle");
  const g3 = box(3, "core", 2, 5, 4, 3, "e6-box");
  const g5 = circArea(5, "core", 3, 10, "e6-circle");
  circ("v1", "variant", 1, 20, "e6-circle"); box("v2", "variant", 2, 6, 3, 5, "e6-box"); circArea("v3", "variant", 2, 3, "e6-circle"); circ("d1", "diagnostic", 1, 5);

  // ---- statistics ----
  const mean = (n, role, d, list, fam) => N("stat", n, role, d, fam, join(P(`점수가 ${list.join(", ")}점일 때 평균은 몇 점일까요?`, `Các điểm số là ${list.join(", ")}. Điểm trung bình là bao nhiêu?`), ONE), round(list.reduce((a, c) => a + c, 0) / list.length), [P("평균 = 모든 값의 합 ÷ 값의 개수", "Trung bình cộng = tổng các giá trị ÷ số giá trị."), P(`${list.join(" + ")} 를 먼저 구해요.`, `Hãy tính ${list.join(" + ")} trước.`)], P(`${tex(`(${list.join(" + ")}) \\div ${list.length} = ${round(list.reduce((a, c) => a + c, 0) / list.length)}`)}.`, `${tex(`(${list.join(" + ")}) \\div ${list.length} = ${round(list.reduce((a, c) => a + c, 0) / list.length)}`)}.`));
  const median = (n, role, d, list, fam) => { const sorted = [...list].sort((a, c) => a - c); return N("stat", n, role, d, fam, join(P(`수 ${list.join(", ")}의 중앙값은 얼마일까요?`, `Số trung vị của các số ${list.join(", ")} là bao nhiêu?`), ONE), sorted[(sorted.length - 1) / 2], [P("크기 순서대로 늘어놓아요.", "Hãy sắp xếp các số theo thứ tự tăng dần."), P("한가운데 있는 수가 중앙값이에요.", "Số đứng ở chính giữa là số trung vị.")], P(`${sorted.join(", ")} 에서 가운데 수는 ${sorted[(sorted.length - 1) / 2]}.`, `Sau khi sắp xếp: ${sorted.join(", ")}. Số ở giữa là ${sorted[(sorted.length - 1) / 2]}.`)); };
  const total = N("stat", 2, "core", 1, "e6-mean", join(P("5개 수의 평균이 8이에요. 이 5개 수의 합은 얼마일까요?", "Trung bình cộng của 5 số là 8. Tổng của 5 số đó là bao nhiêu?"), ONE), 40, [P("합 = 평균 × 개수", "Tổng = trung bình × số lượng."), P("8 × 5 의 값을 구해요.", "Hãy tính 8 × 5.")], P(`${tex("8 \\times 5 = 40")}.`, `${tex("8 \\times 5 = 40")}.`));
  const mode = N("stat", 4, "core", 2, "e6-mode", join(P("수 2, 3, 3, 5, 3, 7 중에서 가장 많이 나타나는 수(최빈값)는 무엇일까요?", "Trong các số 2, 3, 3, 5, 3, 7, số xuất hiện nhiều nhất (mốt) là số nào?"), ONE), 3, [P("각 수가 몇 번 나왔는지 세어 보세요.", "Hãy đếm xem mỗi số xuất hiện mấy lần."), P("3이 몇 번 나오는지 확인해요.", "Xem số 3 xuất hiện mấy lần.")], P("3이 세 번 나와서 가장 많아요.", "Số 3 xuất hiện 3 lần, nhiều nhất."));
  const fifth = N("stat", 5, "core", 3, "e6-mean", join(P("4명의 평균 점수가 70점이에요. 다섯 번째 학생이 95점이면 5명의 평균 점수는 몇 점일까요?", "Điểm trung bình của 4 bạn là 70. Bạn thứ năm được 95 điểm. Điểm trung bình của cả 5 bạn là bao nhiêu?"), ONE), 75, [P("4명의 점수의 합을 먼저 구해요.", "Hãy tính tổng điểm của 4 bạn trước."), P("70 × 4 = 280 에 95를 더해요.", "70 × 4 = 280, rồi cộng thêm 95.")], P(`${tex("(70 \\times 4 + 95) \\div 5 = 75")}.`, `${tex("(70 \\times 4 + 95) \\div 5 = 75")}.`));
  const s1 = mean(1, "core", 1, [80, 90, 70, 100], "e6-mean");
  const s3 = median(3, "core", 2, [3, 7, 5, 9, 11], "e6-mid");
  mean("v1", "variant", 1, [6, 8, 10], "e6-mean"); median("v2", "variant", 2, [4, 9, 2, 7, 5], "e6-mid"); mean("d1", "diagnostic", 1, [10, 20]);

  b.course({
    id: "math-e6", grade: "E6", title: T("초6 수학 · 분수·소수 연산, 비례식, 원", "Toán Lớp 6 · Phép tính phân số và số thập phân, tỉ lệ thức, hình tròn"),
    world: { name: T("Ratio Reef", "Rạn San Hô Tỉ Lệ"), emoji: "🐠", tagline: T("비율의 바다를 헤엄쳐요", "Bơi trong đại dương của tỉ lệ") },
    unit: { id: "math-e6-u1", title: T("분수·소수의 연산, 비례, 백분율, 원과 부피, 평균", "Phép tính phân số và số thập phân, tỉ lệ, phần trăm, hình tròn và thể tích, trung bình") },
    lessons: [
      lesson(1, "frac", S, T("분수·소수의 곱셈과 나눗셈", "Nhân chia phân số và số thập phân"), T("분수의 곱셈은 분자끼리, 분모끼리 곱해요. 분수의 나눗셈은 **역수**를 곱해요.", "Nhân phân số: nhân tử với tử, mẫu với mẫu. Chia phân số: nhân với **số nghịch đảo**."), T(`${tex("\\frac{3}{4} \\times \\frac{2}{5} = \\frac{3}{10}")}`, `${tex("\\frac{3}{4} \\times \\frac{2}{5} = \\frac{3}{10}")}`), [f1, f2, f3, fdivInt], f5),
      lesson(2, "ratio", S, T("비례식과 비례배분", "Tỉ lệ thức và chia theo tỉ lệ"), T("비례식에서는 **안쪽 수의 곱 = 바깥쪽 수의 곱**이에요. 전체를 비로 나누면 **비례배분**이에요.", "Trong tỉ lệ thức, **tích hai trung tỉ = tích hai ngoại tỉ**. Chia một tổng theo tỉ lệ gọi là **chia tỉ lệ**."), T(`${tex("3 : 4 = 12 : \\square \\to \\square = 16")}`, `${tex("3 : 4 = 12 : \\square \\to \\square = 16")}`), [p1, prop2, p3, price], p5),
      lesson(3, "pct", S, T("백분율", "Phần trăm"), T("**백분율(%)**은 기준량을 100으로 보았을 때의 비율이에요. 소수에 100을 곱하면 %가 돼요.", "**Phần trăm (%)** là tỉ lệ khi coi số gốc là 100. Nhân số thập phân với 100 ta được %."), T(`80의 25% = ${tex("80 \\times 25 \\div 100 = 20")}`, `25% của 80 = ${tex("80 \\times 25 \\div 100 = 20")}`), [c1, c2, c3, decToPct], profit),
      lesson(4, "geo", S, T("원과 입체도형", "Hình tròn và hình khối"), T("원의 둘레는 **지름 × 3.14**, 원의 넓이는 **반지름 × 반지름 × 3.14**예요.", "Chu vi hình tròn = **đường kính × 3,14**; diện tích hình tròn = **bán kính × bán kính × 3,14**."), T(`${tex("10 \\times 3.14 = 31.4")}`, `${tex("10 \\times 3.14 = 31.4")}`), [g1, g2, g3, cube], g5),
      lesson(5, "stat", S, T("평균과 자료 정리", "Trung bình cộng và số liệu"), T("**평균**은 합 ÷ 개수, **중앙값**은 한가운데 수, **최빈값**은 가장 많이 나온 수예요.", "**Trung bình cộng** = tổng ÷ số lượng, **số trung vị** là số ở giữa, **mốt** là số xuất hiện nhiều nhất."), T(`${tex("(80 + 90 + 70 + 100) \\div 4 = 85")}`, `${tex("(80 + 90 + 70 + 100) \\div 4 = 85")}`), [s1, total, s3, mode], fifth),
    ],
  });
}

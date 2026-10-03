import { T, tex } from "./math-helpers.mjs";
import { fracTex, fracText } from "./lib.mjs";

const round = (x) => Number(x.toFixed(6));

/** Shorthand for a numeric question: N(n, role, d, family, promptT, value, [hint1, hint2], explT) */
export function maker(b, h, grade, S) {
  const id = (sk, n) => `m-${grade}-${sk}-${n}`;
  const N = (sk, n, role, d, fam, prompt, value, hints, expl, extra = {}) => h.numeric({ id: id(sk, n), skill: S[sk], role, d, family: fam, prompt, value, hints, expl, ...extra });
  /** Multiple choice. The correct option's position is spread over a..d deterministically (from the question id), so it is not always "a". */
  const C = (sk, n, role, d, fam, prompt, items, correct, hints, expl) => {
    const qid = id(sk, n);
    const rot = [...qid].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % items.length;
    const rotated = items.map((_, i) => items[(i - rot + items.length) % items.length]);
    return h.choice({ id: qid, skill: S[sk], role, d, family: fam, prompt, items: rotated, correct: (correct + rot) % items.length, hints, expl });
  };
  const F = (sk, n, role, d, fam, prompt, tf, hints, expl) => h.truefalse({ id: id(sk, n), skill: S[sk], role, d, family: fam, prompt, tf, hints, expl });
  return { N, C, F, id };
}
export const lessonOf = (grade) => (n, sk, S, title, concept, example, core, challenge) => ({ id: `math-${grade}-l${n}`, title, concept, example, skills: [S[sk]], core, challenge });

/* ================================ Elementary 3 ================================ */
export function e3(b, h) {
  const S = { muldiv: "m.e3.muldiv", frac: "m.e3.frac", unit: "m.e3.unit", geo: "m.e3.geo", data: "m.e3.data" };
  b.skill(S.muldiv, T("곱셈과 나눗셈", "Phép nhân và phép chia"));
  b.skill(S.frac, T("분수 알아보기", "Làm quen với phân số"), S.muldiv);
  b.skill(S.unit, T("길이·들이·무게", "Độ dài, dung tích và khối lượng"), S.muldiv);
  b.skill(S.geo, T("원과 각", "Hình tròn và góc"), S.frac);
  b.skill(S.data, T("표와 그래프", "Bảng và biểu đồ"), S.unit);
  const { N, C, F } = maker(b, h, "e3", S);
  const lesson = lessonOf("e3");

  // ---- multiplication & division ----
  const mul = (n, role, d, a, c, fam) => N("muldiv", n, role, d, fam, T(`${tex(`${a} \\times ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} \\times ${c}`)}.`), a * c, [T("곱셈구구를 떠올려 보세요.", "Hãy nhớ lại bảng nhân."), T(`${a}씩 ${c}번 더해도 돼요.`, `Cũng có thể cộng ${a} với chính nó ${c} lần.`)], T(`${tex(`${a} \\times ${c} = ${a * c}`)}.`, `${tex(`${a} \\times ${c} = ${a * c}`)}.`));
  const div = (n, role, d, a, c, fam) => N("muldiv", n, role, d, fam, T(`${tex(`${a * c} \\div ${a}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a * c} \\div ${a}`)}.`), c, [T(`${a}단 곱셈구구에서 곱이 ${a * c}인 곳을 찾아요.`, `Tìm trong bảng nhân ${a} xem tích nào bằng ${a * c}.`), T(`${a} × □ = ${a * c} 인 □를 구해요.`, `Tìm □ sao cho ${a} × □ = ${a * c}.`)], T(`${tex(`${a} \\times ${c} = ${a * c}`)} 이므로 ${tex(`${a * c} \\div ${a} = ${c}`)}.`, `${tex(`${a} \\times ${c} = ${a * c}`)} nên ${tex(`${a * c} \\div ${a} = ${c}`)}.`));
  const boxes = (n, role, d, per, k, fam) => N("muldiv", n, role, d, fam, T(`한 상자에 사탕이 ${per}개씩 들어 있어요. ${k}상자에는 사탕이 모두 몇 개 있을까요?`, `Mỗi hộp có ${per} viên kẹo. Hỏi ${k} hộp có tất cả bao nhiêu viên kẹo?`), per * k, [T("한 상자의 수와 상자 수를 곱해요.", "Nhân số kẹo trong một hộp với số hộp."), T(`${per} × ${k} 의 값을 구해요.`, `Hãy tính ${per} × ${k}.`)], T(`${tex(`${per} \\times ${k} = ${per * k}`)}. 모두 ${per * k}개예요.`, `${tex(`${per} \\times ${k} = ${per * k}`)}. Có tất cả ${per * k} viên.`));
  const share = (n, role, d, total, k, fam) => N("muldiv", n, role, d, fam, T(`사탕 ${total}개를 ${k}명에게 똑같이 나누어 주려고 해요. 한 명이 몇 개씩 받을까요?`, `Chia đều ${total} viên kẹo cho ${k} bạn. Mỗi bạn nhận được bao nhiêu viên?`), total / k, [T("똑같이 나누면 나눗셈이에요.", "Chia đều thì dùng phép chia."), T(`${total} ÷ ${k} 의 값을 구해요.`, `Hãy tính ${total} ÷ ${k}.`)], T(`${tex(`${total} \\div ${k} = ${total / k}`)}. 한 명이 ${total / k}개씩 받아요.`, `${tex(`${total} \\div ${k} = ${total / k}`)}. Mỗi bạn nhận ${total / k} viên.`));
  const m1 = mul(1, "core", 1, 6, 7, "e3-mul");
  const m2 = div(2, "core", 1, 4, 6, "e3-div");
  const m3 = boxes(3, "core", 2, 8, 5, "e3-word");
  const m4 = share(4, "core", 2, 28, 4, "e3-word");
  const m5 = mul(5, "core", 3, 23, 3, "e3-mul");
  mul("v1", "variant", 1, 9, 3, "e3-mul"); div("v2", "variant", 2, 7, 5, "e3-div"); boxes("v3", "variant", 2, 6, 7, "e3-word"); mul("d1", "diagnostic", 2, 7, 8); div("d2", "diagnostic", 2, 6, 9);

  // ---- fractions ----
  const parts = (n, role, d, num, den, fam) => {
    const opts = [`${num}/${den}`, `${den}/${num}`, `${den - num}/${den}`, `${num}/${den - num}`];
    return C("frac", n, role, d, fam, T(`피자를 똑같이 ${den}조각으로 나누었어요. 그중 ${num}조각을 먹었다면 먹은 양은 전체의 얼마일까요?`, `Một chiếc pizza được chia đều thành ${den} phần. Bạn đã ăn ${num} phần. Phần đã ăn là bao nhiêu phần của cả chiếc?`), opts.map((o) => { const [a, c] = o.split("/").map(Number); return tex(`\\frac{${a}}{${c}}`); }), 0, [T("전체를 똑같이 나눈 수가 분모예요.", "Số phần chia đều là mẫu số."), T("먹은 조각 수가 분자예요.", "Số phần đã ăn là tử số.")], T(`전체가 ${den}조각이고 ${num}조각을 먹었으니 ${tex(`\\frac{${num}}{${den}}`)}.`, `Cả chiếc có ${den} phần, đã ăn ${num} phần nên là ${tex(`\\frac{${num}}{${den}}`)}.`));
  };
  const f1 = parts(1, "core", 1, 3, 8, "e3-parts");
  const f2 = N("frac", 2, "core", 1, "e3-name", T(`${tex("\\frac{2}{5}")} 에서 분모는 무엇일까요? (숫자만 쓰세요)`, `Trong phân số ${tex("\\frac{2}{5}")}, mẫu số là mấy? (chỉ nhập số)`), 5, [T("분수에서 아래에 있는 수가 분모예요.", "Số ở phía dưới của phân số là mẫu số."), T("분모는 전체를 똑같이 나눈 개수예요.", "Mẫu số là số phần chia đều của cả đơn vị.")], T(`${tex("\\frac{2}{5}")} 의 분모는 5, 분자는 2.`, `Phân số ${tex("\\frac{2}{5}")} có mẫu số 5, tử số 2.`));
  const f3 = C("frac", 3, "core", 2, "e3-cmp", T("세 분수 중 가장 큰 수는?", "Trong ba phân số, phân số nào lớn nhất?"), [tex("\\frac{1}{3}"), tex("\\frac{1}{4}"), tex("\\frac{1}{5}")], 0, [T("분자가 같으면 분모가 작을수록 더 커요.", "Khi tử số bằng nhau, mẫu số càng bé thì phân số càng lớn."), T("피자를 3조각으로 나눈 한 조각과 5조각으로 나눈 한 조각을 비교해요.", "Hãy so sánh một phần khi chia pizza làm 3 với một phần khi chia làm 5.")], T(`${tex("\\frac{1}{3} > \\frac{1}{5}")}.`, `${tex("\\frac{1}{3} > \\frac{1}{5}")}.`));
  const f4 = F("frac", 4, "core", 2, "e3-cmp", T(`${tex("\\frac{3}{4} < 1")} 이라는 말은 맞을까요?`, `Phát biểu "${tex("\\frac{3}{4}")} bé hơn 1" có đúng không?`), true, [T("분자가 분모보다 작으면 1보다 작아요.", "Khi tử số bé hơn mẫu số thì phân số bé hơn 1."), T("4조각 중 3조각은 전체보다 작아요.", "3 phần trong 4 phần thì nhỏ hơn cả chiếc.")], T("분자 3이 분모 4보다 작으므로 1보다 작아요.", "Tử số 3 bé hơn mẫu số 4 nên phân số bé hơn 1."));
  const f5 = N("frac", 5, "core", 3, "e3-name", T(`□ 안에 알맞은 수를 쓰세요. ${tex("\\frac{5}{8} = \\frac{1}{8} \\times \\square")} (숫자만 쓰세요)`, `${tex("\\frac{5}{8}")} gồm bao nhiêu phần ${tex("\\frac{1}{8}")}? (chỉ nhập số)`), 5, [T("분자는 단위분수의 개수예요.", "Tử số cho biết có bao nhiêu phần đơn vị."), T("1/8이 5번 모이면?", "5 lần 1/8 bằng bao nhiêu?")], T(`${tex("\\frac{5}{8}")} = ${tex("\\frac{1}{8}")} 이 5개.`, `${tex("\\frac{5}{8}")} gồm 5 phần ${tex("\\frac{1}{8}")}.`));
  parts("v1", "variant", 1, 2, 6, "e3-parts");
  C("frac", "v2", "variant", 2, "e3-cmp", T("세 분수 중 가장 큰 수는?", "Trong ba phân số, phân số nào lớn nhất?"), [tex("\\frac{1}{4}"), tex("\\frac{1}{5}"), tex("\\frac{1}{7}")], 0, [T("분자가 같으면 분모가 작을수록 커요.", "Tử số bằng nhau thì mẫu số càng bé, phân số càng lớn."), T("4와 7 중 더 작은 분모를 찾아요.", "Hãy chọn mẫu số bé hơn trong 4 và 7.")], T(`${tex("\\frac{1}{4} > \\frac{1}{7}")}.`, `${tex("\\frac{1}{4} > \\frac{1}{7}")}.`));
  N("frac", "d1", "diagnostic", 2, undefined, T(`${tex("\\frac{3}{7}")} 에서 분자는 무엇일까요? (숫자만 쓰세요)`, `Trong phân số ${tex("\\frac{3}{7}")}, tử số là mấy? (chỉ nhập số)`), 3, [T("분수에서 위에 있는 수가 분자예요.", "Số ở phía trên của phân số là tử số."), T("색칠한 조각의 수예요.", "Đó là số phần được tô màu.")], T(`${tex("\\frac{3}{7}")} 의 분자는 3.`, `Phân số ${tex("\\frac{3}{7}")} có tử số là 3.`));

  // ---- units ----
  const conv = (n, role, d, k, from, to, factor, fam) => N("unit", n, role, d, fam, T(`단위를 바꾸어요. (1${from.ko} = ${factor}${to.ko}) ${k}${from.ko} = □${to.ko} 에서 □ 안에 알맞은 수는? (숫자만 쓰세요)`, `Đổi đơn vị. (1 ${from.vi} = ${factor} ${to.vi}) ${k} ${from.vi} = □ ${to.vi}. Số trong ô vuông là mấy? (chỉ nhập số)`), k * factor, [T("단위가 바뀌면 같은 수를 곱해요.", "Khi đổi sang đơn vị nhỏ hơn thì nhân với cùng một số."), T(`${k} × ${factor} 의 값을 구해요.`, `Hãy tính ${k} × ${factor}.`)], T(`${tex(`${k} \\times ${factor} = ${k * factor}`)}. 즉 ${k}${from.ko} = ${k * factor}${to.ko}.`, `${tex(`${k} \\times ${factor} = ${k * factor}`)}. Vậy ${k} ${from.vi} = ${k * factor} ${to.vi}.`));
  const KM = { ko: "km", vi: "km" }, M = { ko: "m", vi: "m" }, L = { ko: "L", vi: "lít" }, ML = { ko: "mL", vi: "mL" }, KG = { ko: "kg", vi: "kg" }, G = { ko: "g", vi: "g" };
  const u1 = conv(1, "core", 1, 3, KM, M, 1000, "e3-conv");
  const u2 = conv(2, "core", 1, 2, L, ML, 1000, "e3-conv");
  const u3 = conv(3, "core", 2, 5, KG, G, 1000, "e3-conv");
  const u4 = N("unit", 4, "core", 2, "e3-mixed", T("1m 20cm는 모두 몇 cm일까요? (숫자만 쓰세요)", "1 m 20 cm bằng bao nhiêu cm? (chỉ nhập số)"), 120, [T("1m는 100cm예요.", "1 m bằng 100 cm."), T("100cm에 20cm를 더해요.", "Cộng 100 cm với 20 cm.")], T(`${tex("100 + 20 = 120")}.`, `${tex("100 + 20 = 120")}.`));
  const u5 = N("unit", 5, "core", 3, "e3-mixed", T("2km 300m는 모두 몇 m일까요? (숫자만 쓰세요)", "2 km 300 m bằng bao nhiêu m? (chỉ nhập số)"), 2300, [T("1km는 1000m예요.", "1 km bằng 1000 m."), T("2000m에 300m를 더해요.", "Cộng 2000 m với 300 m.")], T(`${tex("2000 + 300 = 2300")}.`, `${tex("2000 + 300 = 2300")}.`));
  conv("v1", "variant", 1, 4, KM, M, 1000, "e3-conv");
  N("unit", "v2", "variant", 2, "e3-mixed", T("1m 50cm는 모두 몇 cm일까요? (숫자만 쓰세요)", "1 m 50 cm bằng bao nhiêu cm? (chỉ nhập số)"), 150, [T("1m는 100cm예요.", "1 m bằng 100 cm."), T("100 + 50 의 값을 구해요.", "Hãy tính 100 + 50.")], T(`${tex("100 + 50 = 150")}.`, `${tex("100 + 50 = 150")}.`));
  conv("d1", "diagnostic", 2, 6, KG, G, 1000);

  // ---- circles & angles ----
  const g1 = N("geo", 1, "core", 1, "e3-angle", T("직각은 몇 도일까요? (숫자만 쓰세요)", "Góc vuông bằng bao nhiêu độ? (chỉ nhập số)"), 90, [T("네모난 종이의 모서리 각이에요.", "Đó là góc ở góc của tờ giấy hình chữ nhật."), T("직각은 숫자 90으로 기억해요.", "Hãy nhớ góc vuông là 90 độ.")], T("직각은 90°예요.", "Góc vuông bằng 90°."));
  const g2 = N("geo", 2, "core", 1, "e3-angle", T("직사각형에서 직각은 모두 몇 개일까요? (숫자만 쓰세요)", "Hình chữ nhật có tất cả bao nhiêu góc vuông? (chỉ nhập số)"), 4, [T("직사각형의 꼭짓점마다 직각이 있어요.", "Mỗi đỉnh của hình chữ nhật đều là một góc vuông."), T("꼭짓점은 4개예요.", "Hình chữ nhật có 4 đỉnh.")], T("직사각형은 네 각이 모두 직각이에요.", "Hình chữ nhật có cả bốn góc đều là góc vuông."));
  const g3 = N("geo", 3, "core", 2, "e3-circle", T("반지름이 5cm인 원의 지름은 몇 cm일까요? (숫자만 쓰세요)", "Hình tròn có bán kính 5 cm. Đường kính dài bao nhiêu cm? (chỉ nhập số)"), 10, [T("지름은 반지름의 2배예요.", "Đường kính gấp đôi bán kính."), T("5 × 2 의 값을 구해요.", "Hãy tính 5 × 2.")], T(`${tex("5 \\times 2 = 10")}. 지름은 10cm예요.`, `${tex("5 \\times 2 = 10")}. Đường kính là 10 cm.`));
  const g4 = C("geo", 4, "core", 2, "e3-angle", T("다음 중 직각이 있는 도형은?", "Hình nào có góc vuông?"), [T("직각삼각형", "Tam giác vuông"), T("원", "Hình tròn"), T("정삼각형", "Tam giác đều"), T("반원", "Nửa hình tròn")], 0, [T("직각삼각형은 이름에 직각이 들어 있어요.", "Tên 'tam giác vuông' đã có chữ 'vuông'."), T("한 각이 90°인 삼각형을 찾아요.", "Hãy tìm tam giác có một góc 90°.")], T("직각삼각형은 한 각이 직각이에요.", "Tam giác vuông có một góc là góc vuông."));
  const g5 = N("geo", 5, "core", 3, "e3-circle", T("지름이 14cm인 원의 반지름은 몇 cm일까요? (숫자만 쓰세요)", "Hình tròn có đường kính 14 cm. Bán kính dài bao nhiêu cm? (chỉ nhập số)"), 7, [T("반지름은 지름의 반이에요.", "Bán kính bằng một nửa đường kính."), T("14 ÷ 2 의 값을 구해요.", "Hãy tính 14 ÷ 2.")], T(`${tex("14 \\div 2 = 7")}. 반지름은 7cm예요.`, `${tex("14 \\div 2 = 7")}. Bán kính là 7 cm.`));
  N("geo", "v1", "variant", 2, "e3-circle", T("반지름이 8cm인 원의 지름은 몇 cm일까요? (숫자만 쓰세요)", "Hình tròn có bán kính 8 cm. Đường kính dài bao nhiêu cm? (chỉ nhập số)"), 16, [T("지름은 반지름의 2배예요.", "Đường kính gấp đôi bán kính."), T("8 × 2 의 값을 구해요.", "Hãy tính 8 × 2.")], T(`${tex("8 \\times 2 = 16")}. 지름은 16cm예요.`, `${tex("8 \\times 2 = 16")}. Đường kính là 16 cm.`));
  N("geo", "v2", "variant", 1, "e3-angle", T("정사각형에서 직각은 모두 몇 개일까요? (숫자만 쓰세요)", "Hình vuông có tất cả bao nhiêu góc vuông? (chỉ nhập số)"), 4, [T("정사각형의 모든 각을 살펴보세요.", "Hãy xem tất cả các góc của hình vuông."), T("꼭짓점이 4개예요.", "Hình vuông có 4 đỉnh.")], T("정사각형은 네 각이 모두 직각이에요.", "Hình vuông có cả bốn góc đều là góc vuông."));
  N("geo", "d1", "diagnostic", 2, undefined, T("지름이 20cm인 원의 반지름은 몇 cm일까요? (숫자만 쓰세요)", "Hình tròn có đường kính 20 cm. Bán kính dài bao nhiêu cm? (chỉ nhập số)"), 10, [T("반지름은 지름의 반이에요.", "Bán kính bằng một nửa đường kính."), T("20 ÷ 2 의 값을 구해요.", "Hãy tính 20 ÷ 2.")], T(`${tex("20 \\div 2 = 10")}. 반지름은 10cm예요.`, `${tex("20 \\div 2 = 10")}. Bán kính là 10 cm.`));

  // ---- tables & graphs ----
  const fruit = T("좋아하는 과일 조사 결과: 사과 7명, 바나나 5명, 포도 9명, 귤 4명.", "Kết quả khảo sát loại quả yêu thích: táo 7 bạn, chuối 5 bạn, nho 9 bạn, quýt 4 bạn.");
  const withFruit = (q) => T(`${fruit.ko} ${q.ko}`, `${fruit.vi} ${q.vi}`);
  const d1 = N("data", 1, "core", 1, "e3-read", withFruit(T("가장 많은 학생이 좋아하는 과일을 고른 학생은 몇 명일까요? (숫자만 쓰세요)", "Loại quả được nhiều bạn thích nhất có bao nhiêu bạn chọn? (chỉ nhập số)")), 9, [T("표에서 가장 큰 수를 찾아요.", "Hãy tìm số lớn nhất trong bảng."), T("포도가 몇 명인지 확인해요.", "Xem có bao nhiêu bạn chọn nho.")], T("가장 큰 수는 포도의 9명이에요.", "Số lớn nhất là 9 bạn chọn nho."));
  const d2 = N("data", 2, "core", 1, "e3-read", withFruit(T("사과와 바나나를 좋아하는 학생은 모두 몇 명일까요? (숫자만 쓰세요)", "Có tất cả bao nhiêu bạn thích táo và chuối? (chỉ nhập số)")), 12, [T("두 수를 더해요.", "Hãy cộng hai số."), T("7 + 5 의 값을 구해요.", "Hãy tính 7 + 5.")], T(`${tex("7 + 5 = 12")}.`, `${tex("7 + 5 = 12")}.`));
  const d3 = N("data", 3, "core", 2, "e3-compare", withFruit(T("포도를 좋아하는 학생은 귤을 좋아하는 학생보다 몇 명 더 많을까요? (숫자만 쓰세요)", "Số bạn thích nho nhiều hơn số bạn thích quýt bao nhiêu bạn? (chỉ nhập số)")), 5, [T("큰 수에서 작은 수를 빼요.", "Lấy số lớn trừ số bé."), T("9 - 4 의 값을 구해요.", "Hãy tính 9 - 4.")], T(`${tex("9 - 4 = 5")}.`, `${tex("9 - 4 = 5")}.`));
  const d4 = C("data", 4, "core", 2, "e3-compare", withFruit(T("가장 적은 학생이 좋아하는 과일은?", "Loại quả được ít bạn thích nhất là gì?")), [T("사과", "Táo"), T("바나나", "Chuối"), T("포도", "Nho"), T("귤", "Quýt")], 3, [T("표에서 가장 작은 수를 찾아요.", "Hãy tìm số nhỏ nhất trong bảng."), T("4명인 과일이 무엇인지 보세요.", "Xem loại quả có 4 bạn chọn.")], T("가장 작은 수는 귤의 4명이에요.", "Số nhỏ nhất là 4 bạn chọn quýt."));
  const d5 = N("data", 5, "core", 3, "e3-read", withFruit(T("조사한 학생은 모두 몇 명일까요? (숫자만 쓰세요)", "Có tất cả bao nhiêu bạn tham gia khảo sát? (chỉ nhập số)")), 25, [T("모든 과일의 학생 수를 더해요.", "Hãy cộng số bạn của tất cả các loại quả."), T("7 + 5 + 9 + 4 의 값을 구해요.", "Hãy tính 7 + 5 + 9 + 4.")], T(`${tex("7 + 5 + 9 + 4 = 25")}.`, `${tex("7 + 5 + 9 + 4 = 25")}.`));
  N("data", "v1", "variant", 1, "e3-read", withFruit(T("바나나를 좋아하는 학생은 몇 명일까요? (숫자만 쓰세요)", "Có bao nhiêu bạn thích chuối? (chỉ nhập số)")), 5, [T("표에서 바나나 칸을 찾아요.", "Hãy tìm hàng chuối trong bảng."), T("바나나 옆의 수를 읽어요.", "Đọc số bên cạnh chuối.")], T("바나나를 좋아하는 학생은 5명이에요.", "Có 5 bạn thích chuối."));
  N("data", "v2", "variant", 2, "e3-compare", withFruit(T("사과를 좋아하는 학생은 귤을 좋아하는 학생보다 몇 명 더 많을까요? (숫자만 쓰세요)", "Số bạn thích táo nhiều hơn số bạn thích quýt bao nhiêu bạn? (chỉ nhập số)")), 3, [T("큰 수에서 작은 수를 빼요.", "Lấy số lớn trừ số bé."), T("7 - 4 의 값을 구해요.", "Hãy tính 7 - 4.")], T(`${tex("7 - 4 = 3")}.`, `${tex("7 - 4 = 3")}.`));
  N("data", "d1", "diagnostic", 2, undefined, withFruit(T("바나나와 귤을 좋아하는 학생은 모두 몇 명일까요? (숫자만 쓰세요)", "Có tất cả bao nhiêu bạn thích chuối và quýt? (chỉ nhập số)")), 9, [T("두 수를 더해요.", "Hãy cộng hai số."), T("5 + 4 의 값을 구해요.", "Hãy tính 5 + 4.")], T(`${tex("5 + 4 = 9")}.`, `${tex("5 + 4 = 9")}.`));

  b.course({
    id: "math-e3", grade: "E3", title: T("초3 수학 · 곱셈, 나눗셈, 분수", "Toán Lớp 3 · Nhân, chia và phân số"),
    world: { name: T("Fraction Island", "Đảo Phân Số"), emoji: "🏝️", tagline: T("똑같이 나누어 섬을 탐험해요", "Chia đều để khám phá hòn đảo") },
    unit: { id: "math-e3-u1", title: T("곱셈과 나눗셈, 분수, 측정, 도형, 자료", "Nhân chia, phân số, đo lường, hình học, số liệu") },
    lessons: [
      lesson(1, "muldiv", S, T("곱셈과 나눗셈", "Phép nhân và phép chia"), T("곱셈은 같은 수를 여러 번 더하는 것이고, **나눗셈**은 똑같이 나누는 것이에요. 곱셈구구를 알면 나눗셈도 쉬워요.", "Phép nhân là cộng cùng một số nhiều lần, còn **phép chia** là chia đều. Thuộc bảng nhân thì chia cũng dễ."), T(`${tex("6 \\times 7 = 42")}, ${tex("42 \\div 6 = 7")}`, `${tex("6 \\times 7 = 42")}, ${tex("42 \\div 6 = 7")}`), [m1, m2, m3, m4], m5),
      lesson(2, "frac", S, T("분수 알아보기", "Làm quen với phân số"), T("전체를 똑같이 나눈 것 중의 일부를 **분수**로 나타내요. 아래 수가 **분모**, 위의 수가 **분자**예요.", "Một phần của cả đơn vị được chia đều gọi là **phân số**. Số dưới là **mẫu số**, số trên là **tử số**."), T(`${tex("\\frac{3}{8}")} : 8조각 중 3조각`, `${tex("\\frac{3}{8}")} : 3 phần trong 8 phần`), [f1, f2, f3, f4], f5),
      lesson(3, "unit", S, T("길이·들이·무게", "Độ dài, dung tích và khối lượng"), T("**1km = 1000m**, **1L = 1000mL**, **1kg = 1000g**예요. 단위를 바꿀 때는 1000을 곱해요.", "**1 km = 1000 m**, **1 lít = 1000 mL**, **1 kg = 1000 g**. Đổi sang đơn vị nhỏ hơn thì nhân với 1000."), T(`${tex("3\\text{km} = 3000\\text{m}")}`, `${tex("3\\text{ km} = 3000\\text{ m}")}`), [u1, u2, u3, u4], u5),
      lesson(4, "geo", S, T("원과 각", "Hình tròn và góc"), T("**직각**은 90°예요. 원에서 **지름**은 **반지름**의 2배예요.", "**Góc vuông** bằng 90°. Trong hình tròn, **đường kính** gấp đôi **bán kính**."), T("반지름 5cm → 지름 10cm", "Bán kính 5 cm → đường kính 10 cm"), [g1, g2, g3, g4], g5),
      lesson(5, "data", S, T("표와 그래프", "Bảng và biểu đồ"), T("조사한 결과를 표로 정리하면 가장 많은 것, 가장 적은 것, 합계를 쉽게 알 수 있어요.", "Sắp xếp kết quả khảo sát vào bảng giúp ta dễ thấy cái nhiều nhất, ít nhất và tổng số."), T(`${tex("7 + 5 + 9 + 4 = 25")}명`, `${tex("7 + 5 + 9 + 4 = 25")} bạn`), [d1, d2, d3, d4], d5),
    ],
  });
}

/* ================================ Elementary 4 ================================ */
export function e4(b, h) {
  const S = { big: "m.e4.big", muldiv: "m.e4.muldiv", frac: "m.e4.frac", angle: "m.e4.angle", data: "m.e4.data" };
  b.skill(S.big, T("큰 수", "Số lớn"));
  b.skill(S.muldiv, T("큰 수의 곱셈과 나눗셈", "Nhân và chia số lớn"), S.big);
  b.skill(S.frac, T("분수와 소수의 덧셈·뺄셈", "Cộng trừ phân số và số thập phân"), S.muldiv);
  b.skill(S.angle, T("각도와 도형", "Góc và hình học"), S.big);
  b.skill(S.data, T("막대그래프와 평균", "Biểu đồ cột và trung bình cộng"), S.frac);
  const { N, C, F } = maker(b, h, "e4", S);
  const lesson = lessonOf("e4");

  // ---- big numbers ----
  const sum10k = (n, role, d, a, c, fam) => N("big", n, role, d, fam, T(`1만이 ${a}개, 1천이 ${c}개인 수는 얼마일까요? (숫자만 쓰세요)`, `Số gồm ${a} chục nghìn và ${c} nghìn là số nào? (chỉ nhập số)`), a * 10000 + c * 1000, [T("만의 자리와 천의 자리를 나누어 생각해요.", "Hãy nghĩ riêng hàng chục nghìn và hàng nghìn."), T(`${a * 10000} + ${c * 1000} 의 값을 구해요.`, `Hãy cộng ${a * 10000} và ${c * 1000}.`)], T(`${tex(`${a * 10000} + ${c * 1000} = ${a * 10000 + c * 1000}`)}.`, `${tex(`${a * 10000} + ${c * 1000} = ${a * 10000 + c * 1000}`)}.`));
  const digitVal = (n, role, d, num, pos, fam) => { const s = String(num); const digit = Number(s[s.length - pos]); return N("big", n, role, d, fam, T(`${tex(String(num))} 에서 ${pos === 6 ? "십만" : pos === 5 ? "만" : pos === 4 ? "천" : "백"}의 자리 숫자가 나타내는 값은 얼마일까요? (숫자만 쓰세요)`, `Trong số ${tex(String(num))}, chữ số ở hàng ${pos === 6 ? "trăm nghìn" : pos === 5 ? "chục nghìn" : pos === 4 ? "nghìn" : "trăm"} có giá trị bao nhiêu? (chỉ nhập số)`), digit * 10 ** (pos - 1), [T("그 자리의 숫자에 자릿값을 곱해요.", "Lấy chữ số đó nhân với giá trị của hàng."), T(`오른쪽에서 ${pos}번째 자리예요.`, `Đó là hàng thứ ${pos} tính từ bên phải.`)], T(`${tex(`${digit} \\times ${10 ** (pos - 1)} = ${digit * 10 ** (pos - 1)}`)}.`, `Chữ số ${digit} ở hàng thứ ${pos} nên ${tex(`${digit} \\times ${10 ** (pos - 1)} = ${digit * 10 ** (pos - 1)}`)}.`)); };
  const b1 = sum10k(1, "core", 1, 7, 2, "e4-compose");
  const b2 = sum10k(2, "core", 1, 5, 3, "e4-compose");
  const b3 = digitVal(3, "core", 2, 250000, 6, "e4-digit");
  const b4 = digitVal(4, "core", 2, 48200, 4, "e4-digit");
  const b5 = N("big", 5, "core", 3, "e4-compose", T(`${tex("38000 + 47000")} 의 값을 구하세요.`, `Tính giá trị của ${tex("38000 + 47000")}.`), 85000, [T("천의 자리끼리 더해요.", "Cộng các nghìn với nhau."), T("38 + 47 = 85 라는 식을 이용해요.", "Dùng 38 + 47 = 85.")], T(`${tex("38000 + 47000 = 85000")}.`, `${tex("38000 + 47000 = 85000")}.`));
  sum10k("v1", "variant", 1, 4, 6, "e4-compose"); digitVal("v2", "variant", 2, 735000, 6, "e4-digit"); sum10k("d1", "diagnostic", 1, 6, 5);

  // ---- multiply / divide large numbers ----
  const mul = (n, role, d, a, c, fam) => N("muldiv", n, role, d, fam, T(`${tex(`${a} \\times ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} \\times ${c}`)}.`), a * c, [T(`곱하는 수를 일의 자리와 십의 자리로 나누어 곱해요.`, `Hãy tách ${c} thành các chữ số rồi nhân từng phần.`), T("각각의 곱을 더해요.", "Rồi cộng các tích riêng lại.")], T(`${tex(`${a} \\times ${c} = ${a * c}`)}.`, `${tex(`${a} \\times ${c} = ${a * c}`)}.`));
  const div = (n, role, d, a, c, fam) => N("muldiv", n, role, d, fam, T(`${tex(`${a * c} \\div ${a}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a * c} \\div ${a}`)}.`), c, [T(`나누는 수에 어떤 수를 곱하면 ${a * c}에 가까워지는지 생각해요.`, `Hãy nghĩ ${a} nhân với số nào thì gần bằng ${a * c}.`), T("몫을 어림해서 확인해요.", "Hãy ước lượng thương rồi kiểm tra.")], T(`${tex(`${a} \\times ${c} = ${a * c}`)} 이므로 ${tex(`${a * c} \\div ${a} = ${c}`)}.`, `${tex(`${a} \\times ${c} = ${a * c}`)} nên ${tex(`${a * c} \\div ${a} = ${c}`)}.`));
  const bag = (n, role, d, per, k, fam) => N("muldiv", n, role, d, fam, T(`한 봉지에 구슬이 ${per}개씩 들어 있어요. ${k}봉지에는 구슬이 모두 몇 개 있을까요?`, `Mỗi túi có ${per} viên bi. Hỏi ${k} túi có tất cả bao nhiêu viên bi?`), per * k, [T("한 봉지의 수와 봉지 수를 곱해요.", "Nhân số bi trong một túi với số túi."), T(`${per} × ${k} 의 값을 구해요.`, `Hãy tính ${per} × ${k}.`)], T(`${tex(`${per} \\times ${k} = ${per * k}`)}. 모두 ${per * k}개예요.`, `${tex(`${per} \\times ${k} = ${per * k}`)}. Có tất cả ${per * k} viên.`));
  const e1 = mul(1, "core", 1, 34, 12, "e4-mul");
  const e2 = div(2, "core", 1, 12, 13, "e4-div");
  const e3 = mul(3, "core", 2, 25, 40, "e4-mul");
  const e4 = bag(4, "core", 2, 24, 15, "e4-word");
  const e5 = div(5, "core", 3, 15, 49, "e4-div");
  mul("v1", "variant", 1, 21, 14, "e4-mul"); div("v2", "variant", 2, 14, 12, "e4-div"); bag("v3", "variant", 2, 18, 12, "e4-word"); mul("d1", "diagnostic", 2, 45, 12); div("d2", "diagnostic", 3, 13, 21);

  // ---- fractions & decimals ----
  const sameDen = (n, role, d, num1, num2, den, op, fam) => { const value = op === "+" ? (num1 + num2) / den : (num1 - num2) / den; const r = op === "+" ? num1 + num2 : num1 - num2; return N("frac", n, role, d, fam, T(`${tex(`\\frac{${num1}}{${den}} ${op} \\frac{${num2}}{${den}}`)} 의 값을 구하세요. (예: 3/5 처럼 써도 돼요)`, `Tính giá trị của ${tex(`\\frac{${num1}}{${den}} ${op} \\frac{${num2}}{${den}}`)}. (có thể nhập dạng 3/5)`), value, [T("분모가 같으면 분자끼리 계산해요.", "Khi mẫu số bằng nhau, chỉ cần tính trên tử số."), T("분모는 그대로 둬요.", "Giữ nguyên mẫu số.")], T(`${tex(`\\frac{${num1}}{${den}} ${op} \\frac{${num2}}{${den}} = ${fracTex(r, den)}`)}.`, `${tex(`\\frac{${num1}}{${den}} ${op} \\frac{${num2}}{${den}} = ${fracTex(r, den)}`)}.`), { tol: 1e-6 }); };
  const dec = (n, role, d, a, c, op, fam) => { const value = round(op === "+" ? a + c : a - c); return N("frac", n, role, d, fam, T(`${tex(`${a} ${op} ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} ${op} ${c}`)}.`), value, [T("소수점의 자리를 맞추어 계산해요.", "Hãy đặt thẳng hàng dấu phẩy rồi tính."), T("자연수처럼 계산한 뒤 소수점을 찍어요.", "Tính như số tự nhiên rồi đặt dấu phẩy.")], T(`${tex(`${a} ${op} ${c} = ${value}`)}.`, `${tex(`${a} ${op} ${c} = ${value}`)}.`)); };
  const half = N("frac", 3, "core", 2, "e4-conv", T(`다음 분수를 소수로 나타내면 얼마일까요? ${tex("\\frac{1}{2}")} (숫자만 쓰세요)`, `Viết ${tex("\\frac{1}{2}")} dưới dạng số thập phân. Kết quả là bao nhiêu? (chỉ nhập số)`), 0.5, [T("분수는 분자 ÷ 분모예요.", "Phân số là tử số chia cho mẫu số."), T("1 ÷ 2 의 값을 구해요.", "Hãy tính 1 ÷ 2.")], T(`${tex("1 \\div 2 = 0.5")}.`, `${tex("1 \\div 2 = 0.5")}.`));
  const f1 = sameDen(1, "core", 1, 3, 1, 5, "+", "e4-fr");
  const f2 = sameDen(2, "core", 2, 7, 2, 9, "-", "e4-fr");
  const f4 = dec(4, "core", 2, 0.3, 0.4, "+", "e4-dec");
  const f5 = dec(5, "core", 3, 2.5, 1.75, "+", "e4-dec");
  sameDen("v1", "variant", 1, 2, 3, 7, "+", "e4-fr"); dec("v2", "variant", 2, 1.8, 0.6, "-", "e4-dec");
  N("frac", "v3", "variant", 2, "e4-conv", T(`다음 분수를 소수로 나타내면 얼마일까요? ${tex("\\frac{1}{4}")} (숫자만 쓰세요)`, `Viết ${tex("\\frac{1}{4}")} dưới dạng số thập phân. Kết quả là bao nhiêu? (chỉ nhập số)`), 0.25, [T("1 ÷ 4 의 값을 구해요.", "Hãy tính 1 ÷ 4."), T("100원의 4분의 1은 25원이에요.", "Một phần tư của 100 là 25.")], T(`${tex("1 \\div 4 = 0.25")}.`, `${tex("1 \\div 4 = 0.25")}.`));
  sameDen("d1", "diagnostic", 2, 4, 2, 7, "+"); dec("d2", "diagnostic", 2, 0.5, 0.2, "+");

  // ---- angles ----
  const tri = (n, role, d, a1, a2, fam) => N("angle", n, role, d, fam, T(`삼각형의 두 각이 ${a1}°, ${a2}°예요. 나머지 한 각은 몇 도일까요? (숫자만 쓰세요)`, `Một tam giác có hai góc là ${a1}° và ${a2}°. Góc còn lại bằng bao nhiêu độ? (chỉ nhập số)`), 180 - a1 - a2, [T("삼각형의 세 각의 합은 180°예요.", "Tổng ba góc của tam giác là 180°."), T(`180 - ${a1} - ${a2} 의 값을 구해요.`, `Hãy tính 180 - ${a1} - ${a2}.`)], T(`${tex(`180 - ${a1} - ${a2} = ${180 - a1 - a2}`)}. 나머지 각은 ${180 - a1 - a2}°예요.`, `${tex(`180 - ${a1} - ${a2} = ${180 - a1 - a2}`)}. Góc còn lại là ${180 - a1 - a2}°.`));
  const a1 = tri(1, "core", 1, 50, 60, "e4-tri");
  const a2 = N("angle", 2, "core", 1, "e4-sum", T("삼각형의 세 각의 합은 몇 도일까요? (숫자만 쓰세요)", "Tổng ba góc của một tam giác bằng bao nhiêu độ? (chỉ nhập số)"), 180, [T("삼각형의 세 꼭짓점의 각을 모두 더해요.", "Cộng cả ba góc ở ba đỉnh."), T("두 직각삼각형을 합친 사각형을 생각해 보세요.", "Hãy nghĩ đến việc ghép hai tam giác thành một hình chữ nhật.")], T("삼각형의 세 각의 합은 180°예요.", "Tổng ba góc của một tam giác là 180°."));
  const a3 = N("angle", 3, "core", 2, "e4-sum", T("사각형의 네 각의 합은 몇 도일까요? (숫자만 쓰세요)", "Tổng bốn góc của một tứ giác bằng bao nhiêu độ? (chỉ nhập số)"), 360, [T("사각형은 삼각형 2개로 나눌 수 있어요.", "Một tứ giác có thể chia thành 2 tam giác."), T("180 × 2 의 값을 구해요.", "Hãy tính 180 × 2.")], T(`${tex("180 \\times 2 = 360")}.`, `${tex("180 \\times 2 = 360")}.`));
  const a4 = tri(4, "core", 2, 90, 35, "e4-tri");
  const a5 = N("angle", 5, "core", 3, "e4-straight", T("한 직선 위에 두 각이 있어요. 한 각이 120°이면 다른 각은 몇 도일까요? (숫자만 쓰세요)", "Hai góc nằm cạnh nhau trên một đường thẳng. Nếu một góc là 120° thì góc kia bằng bao nhiêu độ? (chỉ nhập số)"), 60, [T("한 직선이 이루는 각은 180°예요.", "Góc bẹt (một đường thẳng) bằng 180°."), T("180 - 120 의 값을 구해요.", "Hãy tính 180 - 120.")], T(`${tex("180 - 120 = 60")}.`, `${tex("180 - 120 = 60")}.`));
  tri("v1", "variant", 1, 40, 70, "e4-tri"); N("angle", "v2", "variant", 2, "e4-straight", T("한 직선 위에 두 각이 있어요. 한 각이 100°이면 다른 각은 몇 도일까요? (숫자만 쓰세요)", "Hai góc nằm cạnh nhau trên một đường thẳng. Nếu một góc là 100° thì góc kia bằng bao nhiêu độ? (chỉ nhập số)"), 80, [T("한 직선이 이루는 각은 180°예요.", "Góc bẹt bằng 180°."), T("180 - 100 의 값을 구해요.", "Hãy tính 180 - 100.")], T(`${tex("180 - 100 = 80")}.`, `${tex("180 - 100 = 80")}.`));
  tri("d1", "diagnostic", 2, 30, 80);

  // ---- bar graph & mean ----
  const books = T("월별로 읽은 책 수: 1월 12권, 2월 18권, 3월 9권, 4월 21권.", "Số sách đã đọc theo tháng: tháng 1 là 12 quyển, tháng 2 là 18 quyển, tháng 3 là 9 quyển, tháng 4 là 21 quyển.");
  const withBooks = (q) => T(`${books.ko} ${q.ko}`, `${books.vi} ${q.vi}`);
  const g1 = N("data", 1, "core", 1, "e4-read", withBooks(T("책을 가장 많이 읽은 달은 몇 권을 읽었을까요? (숫자만 쓰세요)", "Tháng đọc nhiều sách nhất đã đọc bao nhiêu quyển? (chỉ nhập số)")), 21, [T("가장 큰 수를 찾아요.", "Hãy tìm số lớn nhất."), T("4월의 수를 확인해요.", "Xem số của tháng 4.")], T("가장 큰 수는 4월의 21권이에요.", "Số lớn nhất là 21 quyển của tháng 4."));
  const g2 = N("data", 2, "core", 1, "e4-read", withBooks(T("1월과 4월에 읽은 책 수의 차는 몇 권일까요? (숫자만 쓰세요)", "Số sách tháng 1 và tháng 4 chênh nhau bao nhiêu quyển? (chỉ nhập số)")), 9, [T("큰 수에서 작은 수를 빼요.", "Lấy số lớn trừ số bé."), T("21 - 12 의 값을 구해요.", "Hãy tính 21 - 12.")], T(`${tex("21 - 12 = 9")}.`, `${tex("21 - 12 = 9")}.`));
  const g3 = N("data", 3, "core", 2, "e4-total", withBooks(T("4개월 동안 읽은 책은 모두 몇 권일까요? (숫자만 쓰세요)", "Trong 4 tháng đã đọc tất cả bao nhiêu quyển? (chỉ nhập số)")), 60, [T("네 수를 모두 더해요.", "Hãy cộng cả bốn số."), T("12 + 18 + 9 + 21 의 값을 구해요.", "Hãy tính 12 + 18 + 9 + 21.")], T(`${tex("12 + 18 + 9 + 21 = 60")}.`, `${tex("12 + 18 + 9 + 21 = 60")}.`));
  const g4 = N("data", 4, "core", 2, "e4-read", withBooks(T("2월에 읽은 책 수는 3월에 읽은 책 수의 몇 배일까요? (숫자만 쓰세요)", "Số sách tháng 2 gấp mấy lần số sách tháng 3? (chỉ nhập số)")), 2, [T("18은 9의 몇 배인지 생각해요.", "Hãy nghĩ 18 gấp 9 mấy lần."), T("18 ÷ 9 의 값을 구해요.", "Hãy tính 18 ÷ 9.")], T(`${tex("18 \\div 9 = 2")}. 2배예요.`, `${tex("18 \\div 9 = 2")}. Gấp 2 lần.`));
  const g5 = N("data", 5, "core", 3, "e4-total", withBooks(T("4개월 동안 읽은 책 수의 평균은 몇 권일까요? (숫자만 쓰세요)", "Trung bình mỗi tháng đọc bao nhiêu quyển? (chỉ nhập số)")), 15, [T("평균은 모두 더한 값을 개수로 나눈 값이에요.", "Trung bình cộng bằng tổng chia cho số lượng."), T("60 ÷ 4 의 값을 구해요.", "Hãy tính 60 ÷ 4.")], T(`${tex("60 \\div 4 = 15")}. 평균은 15권이에요.`, `${tex("60 \\div 4 = 15")}. Trung bình là 15 quyển.`));
  N("data", "v1", "variant", 1, "e4-read", withBooks(T("3월에 읽은 책은 몇 권일까요? (숫자만 쓰세요)", "Tháng 3 đã đọc bao nhiêu quyển? (chỉ nhập số)")), 9, [T("표에서 3월 칸을 찾아요.", "Tìm cột tháng 3."), T("3월 옆의 수를 읽어요.", "Đọc số của tháng 3.")], T("3월에는 9권을 읽었어요.", "Tháng 3 đã đọc 9 quyển."));
  N("data", "v2", "variant", 2, "e4-total", T("세 수 4, 8, 12 의 평균은 얼마일까요? (숫자만 쓰세요)", "Trung bình cộng của ba số 4, 8, 12 là bao nhiêu? (chỉ nhập số)"), 8, [T("세 수를 더한 뒤 3으로 나눠요.", "Cộng ba số rồi chia cho 3."), T("24 ÷ 3 의 값을 구해요.", "Hãy tính 24 ÷ 3.")], T(`${tex("(4 + 8 + 12) \\div 3 = 8")}.`, `${tex("(4 + 8 + 12) \\div 3 = 8")}.`));
  N("data", "d1", "diagnostic", 2, undefined, withBooks(T("2월과 3월에 읽은 책은 모두 몇 권일까요? (숫자만 쓰세요)", "Tháng 2 và tháng 3 đã đọc tất cả bao nhiêu quyển? (chỉ nhập số)")), 27, [T("두 수를 더해요.", "Hãy cộng hai số."), T("18 + 9 의 값을 구해요.", "Hãy tính 18 + 9.")], T(`${tex("18 + 9 = 27")}.`, `${tex("18 + 9 = 27")}.`));

  b.course({
    id: "math-e4", grade: "E4", title: T("초4 수학 · 큰 수와 분수·소수", "Toán Lớp 4 · Số lớn, phân số và số thập phân"),
    world: { name: T("Big Number Canyon", "Hẻm Núi Số Lớn"), emoji: "🏜️", tagline: T("커다란 수의 협곡을 건너요", "Vượt qua hẻm núi của những con số lớn") },
    unit: { id: "math-e4-u1", title: T("큰 수, 곱셈과 나눗셈, 분수와 소수, 각도, 그래프", "Số lớn, nhân chia, phân số và số thập phân, góc, biểu đồ") },
    lessons: [
      lesson(1, "big", S, T("큰 수", "Số lớn"), T("만(10000) 단위로 큰 수를 읽고 써요. 각 자리의 숫자는 **자릿값**만큼의 크기를 나타내요.", "Đọc và viết số lớn theo đơn vị vạn (10000). Mỗi chữ số có giá trị theo **hàng** của nó."), T(`${tex("5 \\times 10000 + 3 \\times 1000 = 53000")}`, `${tex("5 \\times 10000 + 3 \\times 1000 = 53000")}`), [b1, b2, b3, b4], b5),
      lesson(2, "muldiv", S, T("큰 수의 곱셈과 나눗셈", "Nhân và chia số lớn"), T("곱하는 수를 나누어 곱한 뒤 더해요. 나눗셈은 몫을 어림해서 확인해요.", "Tách số nhân thành từng phần, nhân rồi cộng lại. Với phép chia, hãy ước lượng thương để kiểm tra."), T(`${tex("34 \\times 12 = 408")}`, `${tex("34 \\times 12 = 408")}`), [e1, e2, e3, e4], e5),
      lesson(3, "frac", S, T("분수와 소수의 덧셈·뺄셈", "Cộng trừ phân số và số thập phân"), T("분모가 같은 분수는 **분자끼리** 더하고 빼요. 소수는 소수점의 자리를 맞춰 계산해요.", "Phân số cùng mẫu số thì **cộng trừ các tử số**. Số thập phân thì đặt thẳng hàng dấu phẩy rồi tính."), T(`${tex("\\frac{3}{5} + \\frac{1}{5} = \\frac{4}{5}")}`, `${tex("\\frac{3}{5} + \\frac{1}{5} = \\frac{4}{5}")}`), [f1, f2, half, f4], f5),
      lesson(4, "angle", S, T("각도와 도형", "Góc và hình học"), T("삼각형의 세 각의 합은 **180°**, 사각형의 네 각의 합은 **360°**예요.", "Tổng ba góc của tam giác là **180°**, tổng bốn góc của tứ giác là **360°**."), T(`${tex("180 - 50 - 60 = 70")}`, `${tex("180 - 50 - 60 = 70")}`), [a1, a2, a3, a4], a5),
      lesson(5, "data", S, T("막대그래프와 평균", "Biểu đồ cột và trung bình cộng"), T("자료를 읽어 합계와 차를 구해요. **평균**은 모두 더한 값을 개수로 나눈 값이에요.", "Đọc số liệu để tính tổng và hiệu. **Trung bình cộng** bằng tổng chia cho số lượng."), T(`${tex("60 \\div 4 = 15")}`, `${tex("60 \\div 4 = 15")}`), [g1, g2, g3, g4], g5),
    ],
  });
}

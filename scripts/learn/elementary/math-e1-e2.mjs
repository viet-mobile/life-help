import { OBJ, T, cop, tex, topic } from "./math-helpers.mjs";

/* ================================ Elementary 1 ================================ */
export function e1(b, h) {
  const { numeric, choice, truefalse } = h;
  const S = { count: "m.e1.count", addsub: "m.e1.addsub", cmp: "m.e1.cmp", shape: "m.e1.shape", measure: "m.e1.measure" };
  b.skill(S.count, T("수 세기", "Đếm số"));
  b.skill(S.addsub, T("더하기와 빼기", "Cộng và trừ"), S.count);
  b.skill(S.cmp, T("수의 크기 비교", "So sánh các số"), S.count);
  b.skill(S.shape, T("여러 가지 모양", "Các hình cơ bản"), S.cmp);
  b.skill(S.measure, T("길이와 시계", "Độ dài và đồng hồ"), S.shape);
  const id = (sk, n) => `m-e1-${sk}-${n}`;

  // ---- counting ----
  const count = (n, role, d, key, o, fam) => numeric({
    id: id("count", n), skill: S.count, role, d, family: fam, value: o.n,
    prompt: T(`${o.emoji.repeat(o.n)} ${o.ko}${topic(o)} 모두 몇 ${o.cnt}일까요?`, `Có tất cả bao nhiêu ${o.vi}? ${o.emoji.repeat(o.n)}`),
    hints: [T("하나씩 손가락으로 짚으면서 세어 보세요.", "Hãy chỉ từng hình bằng ngón tay rồi đếm nhé."), T("10개가 넘으면 5개씩 묶어서 세어요.", "Nếu có hơn 10 hình, hãy nhóm 5 hình một rồi đếm.")],
    expl: T(`하나씩 세어 보면 모두 ${o.n}${o.cnt}${cop(o)}.`, `Đếm lần lượt từng hình, ta được tất cả ${o.n}.`),
  });
  const cnt = (key, n) => ({ ...OBJ[key], n });
  const c1 = count(1, "core", 1, "apple", cnt("apple", 4), "e1-count-a");
  const c2 = count(2, "core", 1, "candy", cnt("candy", 7), "e1-count-a");
  const c3 = count(3, "core", 2, "sticker", cnt("sticker", 9), "e1-count-a");
  const c4 = count(4, "core", 2, "balloon", cnt("balloon", 13), "e1-count-b");
  const c5 = count(5, "core", 3, "marble", cnt("marble", 18), "e1-count-b");
  count("v1", "variant", 1, "flower", cnt("flower", 6), "e1-count-a");
  count("v2", "variant", 2, "cookie", cnt("cookie", 15), "e1-count-b");
  count("d1", "diagnostic", 1, "bird", cnt("bird", 8), undefined);

  // ---- add / subtract ----
  const addE = (n, role, d, a, c, fam) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a + c,
    prompt: T(`${tex(`${a} + ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} + ${c}`)}.`),
    hints: [T("손가락이나 그림으로 이어 세어 보세요.", "Hãy dùng ngón tay hoặc hình vẽ để đếm tiếp."), T(`${a}에서 ${c}만큼 이어 세어요.`, `Đếm tiếp từ ${a} thêm ${c} số.`)],
    expl: T(`${tex(`${a} + ${c} = ${a + c}`)}.`, `${tex(`${a} + ${c} = ${a + c}`)}.`),
  });
  const subE = (n, role, d, a, c, fam) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a - c,
    prompt: T(`${tex(`${a} - ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} - ${c}`)}.`),
    hints: [T("큰 수에서 거꾸로 세어 보세요.", "Hãy đếm lùi từ số lớn."), T(`${a}에서 ${c}만큼 거꾸로 세어요.`, `Đếm lùi ${c} số, bắt đầu từ ${a}.`)],
    expl: T(`${tex(`${a} - ${c} = ${a - c}`)}.`, `${tex(`${a} - ${c} = ${a - c}`)}.`),
  });
  const addW = (n, role, d, o, a, c, fam) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a + c,
    prompt: T(`${o.ko}${o.ga} ${a}${o.cnt} 있어요. ${c}${o.cnt}${o.cntEul} 더 받으면 모두 몇 ${o.cnt}일까요?`, `Có ${a} ${o.vi}. Được cho thêm ${c} ${o.cls} nữa. Hỏi có tất cả bao nhiêu ${o.cls}?`),
    hints: [T("처음 수와 더 받은 수를 합쳐요.", "Gộp số lúc đầu với số nhận thêm."), T("더하기(+)로 식을 만들어 보세요.", "Hãy viết phép tính cộng (+).")],
    expl: T(`${tex(`${a} + ${c} = ${a + c}`)} 이므로 모두 ${a + c}${o.cnt}${cop(o)}.`, `${tex(`${a} + ${c} = ${a + c}`)} nên có tất cả ${a + c} ${o.cls}.`),
  });
  const subW = (n, role, d, o, a, c, fam) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a - c,
    prompt: T(`${o.ko}${o.ga} ${a}${o.cnt} 있었어요. ${c}${o.cnt}${o.gone.subj ? o.cntGa : o.cntEul} ${o.gone.ko}. 몇 ${o.cnt} 남았을까요?`, `Có ${a} ${o.vi}. ${o.gone.vi[0].toUpperCase() + o.gone.vi.slice(1)} ${c} ${o.cls}. Hỏi còn lại bao nhiêu ${o.cls}?`),
    hints: [T("처음 수에서 줄어든 수를 빼요.", "Lấy số lúc đầu trừ đi số đã mất."), T("빼기(-)로 식을 만들어 보세요.", "Hãy viết phép tính trừ (-).")],
    expl: T(`${tex(`${a} - ${c} = ${a - c}`)} 이므로 ${a - c}${o.cnt} 남아요.`, `${tex(`${a} - ${c} = ${a - c}`)} nên còn lại ${a - c} ${o.cls}.`),
  });
  const a1 = addE(1, "core", 1, 3, 4, "e1-add");
  const a2 = subE(2, "core", 1, 8, 3, "e1-sub");
  const a3 = addW(3, "core", 2, OBJ.apple, 5, 3, "e1-word");
  const a4 = subW(4, "core", 2, OBJ.candy, 9, 4, "e1-word");
  const a5 = subE(5, "core", 3, 15, 8, "e1-sub");
  addE("v1", "variant", 1, 2, 6, "e1-add");
  subE("v2", "variant", 1, 10, 6, "e1-sub");
  addW("v3", "variant", 2, OBJ.cookie, 6, 5, "e1-word");
  addE("d1", "diagnostic", 1, 4, 5);
  subE("d2", "diagnostic", 2, 13, 6);

  // ---- compare ----
  const bigger = (n, role, d, nums, big, fam) => {
    const target = big ? Math.max(...nums) : Math.min(...nums);
    return choice({
      id: id("cmp", n), skill: S.cmp, role, d, family: fam, items: nums.map((v) => tex(String(v))), correct: nums.indexOf(target),
      prompt: T(`${nums.map((v) => tex(String(v))).join(", ")} 중 가장 ${big ? "큰" : "작은"} 수는?`, `Trong các số ${nums.map((v) => tex(String(v))).join(", ")}, số nào ${big ? "lớn nhất" : "bé nhất"}?`),
      hints: [T("세 수를 십의 자리부터 비교해요.", "Hãy so sánh ba số, bắt đầu từ hàng chục."), T(`수직선에서 ${big ? "가장 오른쪽" : "가장 왼쪽"}에 있는 수를 찾아요.`, `Trên tia số, hãy tìm số ${big ? "nằm ngoài cùng bên phải" : "nằm ngoài cùng bên trái"}.`)],
      expl: T(`${big ? "가장 큰 수" : "가장 작은 수"}: ${tex(String(target))}`, `${big ? "Số lớn nhất" : "Số bé nhất"}: ${tex(String(target))}.`),
    });
  };
  const sym = (n, role, d, x, y, fam) => choice({
    id: id("cmp", n), skill: S.cmp, role, d, family: fam, items: [tex(">"), tex("<"), tex("=")], correct: x > y ? 0 : x < y ? 1 : 2,
    prompt: T(`${tex(`${x} \\square ${y}`)} 의 □ 안에 알맞은 기호는?`, `Chọn dấu thích hợp thay cho ô vuông: ${tex(`${x} \\square ${y}`)}.`),
    hints: [T("왼쪽 수와 오른쪽 수 중 어느 쪽이 더 큰지 살펴요.", "Hãy xem số bên trái hay số bên phải lớn hơn."), T("큰 쪽으로 입을 벌린 모양이 > 또는 < 예요.", "Dấu > hoặc < luôn mở về phía số lớn hơn.")],
    expl: T(`${tex(`${x} ${x > y ? ">" : x < y ? "<" : "="} ${y}`)}.`, `${tex(`${x} ${x > y ? ">" : x < y ? "<" : "="} ${y}`)}.`),
  });
  const ltTf = (n, role, d, x, y, rel, fam) => truefalse({
    id: id("cmp", n), skill: S.cmp, role, d, family: fam, tf: rel === "<" ? x < y : x > y,
    prompt: T(`다음 비교가 맞는지 틀린지 고르세요. ${tex(`${x} ${rel} ${y}`)}`, `Phép so sánh ${tex(`${x} ${rel} ${y}`)} có đúng không?`),
    hints: [T("두 수의 크기를 먼저 비교해 보세요.", "Hãy so sánh hai số trước."), T("기호가 큰 수 쪽으로 벌어져 있는지 확인해요.", "Kiểm tra dấu có mở về phía số lớn hơn không.")],
    expl: T(`비교하면 ${tex(`${x} ${x > y ? ">" : x < y ? "<" : "="} ${y}`)} 이므로 ${(rel === "<" ? x < y : x > y) ? "맞아요" : "틀려요"}.`, `So sánh ta có ${tex(`${x} ${x > y ? ">" : x < y ? "<" : "="} ${y}`)}, nên phép so sánh ${(rel === "<" ? x < y : x > y) ? "đúng" : "sai"}.`),
  });
  const k1 = bigger(1, "core", 1, [5, 8, 6], true, "e1-pair");
  const k2 = bigger(2, "core", 1, [12, 9, 10], false, "e1-pair");
  const k3 = sym(3, "core", 2, 7, 4, "e1-sym");
  const k4 = ltTf(4, "core", 2, 9, 11, "<", "e1-sym");
  const k5 = choice({
    id: id("cmp", 5), skill: S.cmp, role: "core", d: 3, family: "e1-pair", items: ["14", "9", "17", "11"].map((x) => tex(x)), correct: 2,
    prompt: T(`${tex("14")}, ${tex("9")}, ${tex("17")}, ${tex("11")} 중 가장 큰 수는?`, `Trong các số ${tex("14")}, ${tex("9")}, ${tex("17")}, ${tex("11")}, số nào lớn nhất?`),
    hints: [T("십의 자리 수가 큰 수부터 찾아보세요.", "Hãy tìm các số có chữ số hàng chục lớn trước."), T("십의 자리가 같으면 일의 자리를 비교해요.", "Nếu hàng chục bằng nhau, hãy so sánh hàng đơn vị.")],
    expl: T(`가장 큰 수: ${tex("17")}`, `${tex("17")} là số lớn nhất.`),
  });
  bigger("v1", "variant", 1, [11, 10, 13], true, "e1-pair");
  sym("v2", "variant", 1, 6, 6, "e1-sym");
  bigger("d1", "diagnostic", 2, [16, 15, 18], false);

  // ---- shapes ----
  const SH = { tri: T("삼각형", "Hình tam giác"), quad: T("사각형", "Hình tứ giác (có 4 cạnh)"), circ: T("원", "Hình tròn"), pent: T("오각형", "Hình ngũ giác"), sq: T("정사각형", "Hình vuông"), rect: T("직사각형", "Hình chữ nhật") };
  const shapeQ = (n, role, d, promptT, listKeys, correctKey, hintsT, explT, fam) => choice({
    id: id("shape", n), skill: S.shape, role, d, family: fam, items: listKeys.map((k) => SH[k]), correct: listKeys.indexOf(correctKey), prompt: promptT, hints: hintsT, expl: explT,
  });
  const s1 = shapeQ(1, "core", 1, T("꼭짓점이 3개인 도형은?", "Hình nào có 3 đỉnh?"), ["circ", "tri", "quad", "pent"], "tri", [T("꼭짓점은 뾰족하게 만나는 점이에요.", "Đỉnh là điểm nhọn nơi các cạnh gặp nhau."), T("삼각형은 이름에 '3'이 들어 있어요.", "Tên của hình tam giác có số 3 (tam).")], T("꼭짓점이 3개인 도형은 삼각형이에요.", "Hình có 3 đỉnh là hình tam giác."), "e1-vertex");
  const s2 = shapeQ(2, "core", 1, T("둥글고 꼭짓점이 없는 도형은?", "Hình nào tròn và không có đỉnh?"), ["quad", "tri", "pent", "circ"], "circ", [T("모서리 없이 동그란 모양을 떠올려 보세요.", "Hãy nghĩ đến hình tròn trịa, không có góc nhọn."), T("동전이나 접시 모양이에요.", "Giống hình đồng xu hoặc cái đĩa.")], T("둥글고 꼭짓점이 없는 도형은 원이에요.", "Hình tròn trịa và không có đỉnh là hình tròn."), "e1-vertex");
  const s3 = shapeQ(3, "core", 2, T("변이 4개인 도형은?", "Hình nào có 4 cạnh?"), ["tri", "quad", "circ", "pent"], "quad", [T("변은 도형의 곧은 선이에요.", "Cạnh là các đoạn thẳng của hình."), T("'사'는 숫자 4를 뜻해요.", "Chữ 'tứ' trong 'tứ giác' có nghĩa là 4.")], T("변이 4개인 도형은 사각형이에요.", "Hình có 4 cạnh là hình tứ giác."), "e1-side");
  const s4 = truefalse({
    id: id("shape", 4), skill: S.shape, role: "core", d: 2, family: "e1-side", tf: true,
    prompt: T("삼각형의 변은 3개예요.", "Hình tam giác có 3 cạnh. Đúng hay sai?"),
    hints: [T("삼각형을 그리고 변을 하나씩 세어 보세요.", "Hãy vẽ một hình tam giác và đếm từng cạnh."), T("꼭짓점의 수와 변의 수는 같아요.", "Số đỉnh và số cạnh của hình tam giác bằng nhau.")],
    expl: T("삼각형은 변이 3개, 꼭짓점도 3개예요.", "Hình tam giác có 3 cạnh và 3 đỉnh."),
  });
  const s5 = shapeQ(5, "core", 3, T("변이 모두 4개이고 길이가 모두 같은 도형은?", "Hình nào có 4 cạnh và cả 4 cạnh dài bằng nhau?"), ["rect", "tri", "circ", "sq"], "sq", [T("네 변의 길이가 모두 같아야 해요.", "Cả bốn cạnh phải dài bằng nhau."), T("직사각형은 마주 보는 변만 길이가 같아요.", "Hình chữ nhật chỉ có các cạnh đối diện bằng nhau.")], T("네 변의 길이가 모두 같은 도형은 정사각형이에요.", "Hình có 4 cạnh bằng nhau là hình vuông."), "e1-side");
  shapeQ("v1", "variant", 1, T("꼭짓점이 4개인 도형은?", "Hình nào có 4 đỉnh?"), ["circ", "tri", "pent", "quad"], "quad", [T("꼭짓점을 하나씩 세어 보세요.", "Hãy đếm từng đỉnh."), T("변이 4개면 꼭짓점도 4개예요.", "Hình có 4 cạnh thì cũng có 4 đỉnh.")], T("꼭짓점이 4개인 도형은 사각형이에요.", "Hình có 4 đỉnh là hình tứ giác."), "e1-vertex");
  truefalse({
    id: id("shape", "v2"), skill: S.shape, role: "variant", d: 1, family: "e1-side", tf: true,
    prompt: T("원에는 꼭짓점이 없어요.", "Hình tròn không có đỉnh. Đúng hay sai?"),
    hints: [T("원은 뾰족한 곳이 있는지 살펴보세요.", "Hãy xem hình tròn có chỗ nhọn nào không."), T("원은 처음부터 끝까지 둥글어요.", "Hình tròn tròn đều từ đầu đến cuối.")],
    expl: T("원은 둥글어서 꼭짓점도 변도 없어요.", "Hình tròn không có đỉnh và cũng không có cạnh thẳng."),
  });
  shapeQ("d1", "diagnostic", 2, T("변이 3개인 도형은?", "Hình nào có 3 cạnh?"), ["quad", "circ", "tri", "pent"], "tri", [T("변을 하나씩 세어 보세요.", "Hãy đếm từng cạnh."), T("3은 '삼'이에요.", "Số 3 gọi là 'tam'.")], T("변이 3개인 도형은 삼각형이에요.", "Hình có 3 cạnh là hình tam giác."));

  // ---- length / clock ----
  const longer = (n, role, d, lens, fam) => {
    const names = [T("빨간 리본", "Dải ruy băng đỏ"), T("파란 리본", "Dải ruy băng xanh"), T("초록 리본", "Dải ruy băng lục")];
    const kos = ["빨간", "파란", "초록"], vis = ["đỏ", "xanh", "lục"];
    const longest = lens.indexOf(Math.max(...lens));
    return choice({
      id: id("measure", n), skill: S.measure, role, d, family: fam, items: names, correct: longest,
      prompt: T(`빨간 리본은 ${lens[0]}cm, 파란 리본은 ${lens[1]}cm, 초록 리본은 ${lens[2]}cm예요. 가장 긴 리본은?`, `Dải ruy băng đỏ dài ${lens[0]} cm, dải xanh dài ${lens[1]} cm, dải lục dài ${lens[2]} cm. Dải nào dài nhất?`),
      hints: [T("세 길이의 수를 비교해요.", "Hãy so sánh ba số đo độ dài."), T("수가 클수록 더 길어요.", "Số càng lớn thì càng dài.")],
      expl: T(`${Math.max(...lens)}cm가 가장 기니까 ${kos[longest]} 리본이 가장 길어요.`, `${Math.max(...lens)} cm dài nhất nên dải ${vis[longest]} dài nhất.`),
    });
  };
  const diffLen = (n, role, d, x, y, fam) => numeric({
    id: id("measure", n), skill: S.measure, role, d, family: fam, value: x - y,
    prompt: T(`연필은 ${x}cm, 지우개는 ${y}cm예요. 연필은 지우개보다 몇 cm 더 길까요? (숫자만 쓰세요)`, `Bút chì dài ${x} cm, cục tẩy dài ${y} cm. Bút chì dài hơn cục tẩy bao nhiêu cm? (chỉ nhập số)`),
    hints: [T("긴 길이에서 짧은 길이를 빼요.", "Lấy số đo dài trừ số đo ngắn."), T(`${x} - ${y} 의 값을 구해요.`, `Hãy tính ${x} - ${y}.`)],
    expl: T(`${tex(`${x} - ${y} = ${x - y}`)} 이므로 ${x - y}cm 더 길어요.`, `${tex(`${x} - ${y} = ${x - y}`)} nên dài hơn ${x - y} cm.`),
  });
  const clock = (n, role, d, hour, fam) => numeric({
    id: id("measure", n), skill: S.measure, role, d, family: fam, value: hour,
    prompt: T(`시계의 짧은바늘이 ${hour}, 긴바늘이 12를 가리켜요. 몇 시일까요? (숫자만 쓰세요)`, `Kim giờ chỉ số ${hour}, kim phút chỉ số 12. Đồng hồ chỉ mấy giờ? (chỉ nhập số)`),
    hints: [T("짧은바늘은 '시'를 알려 줘요.", "Kim ngắn cho biết số giờ."), T("긴바늘이 12에 있으면 정각이에요.", "Kim dài ở số 12 nghĩa là đúng giờ.")],
    expl: T(`짧은바늘이 ${hour}에 있고 긴바늘이 12에 있으니 ${hour}시예요.`, `Kim ngắn ở số ${hour}, kim dài ở số 12 nên là ${hour} giờ đúng.`),
  });
  const clip = (n, role, d, k, per, fam) => numeric({
    id: id("measure", n), skill: S.measure, role, d, family: fam, value: k * per,
    prompt: T(`길이가 ${per}cm인 클립 ${k}개를 한 줄로 이었어요. 전체 길이는 몇 cm일까요? (숫자만 쓰세요)`, `Nối ${k} chiếc kẹp giấy, mỗi chiếc dài ${per} cm, thành một hàng. Cả hàng dài bao nhiêu cm? (chỉ nhập số)`),
    hints: [T("같은 길이를 여러 번 더해요.", "Cộng cùng một độ dài nhiều lần."), T(`${Array(k).fill(per).join(" + ")} 의 값을 구해요.`, `Hãy tính ${Array(k).fill(per).join(" + ")}.`)],
    expl: T(`${tex(`${Array(k).fill(per).join(" + ")} = ${k * per}`)}.`, `${tex(`${Array(k).fill(per).join(" + ")} = ${k * per}`)}.`),
  });
  const m1 = longer(1, "core", 1, [15, 18, 20], "e1-len");
  const m2 = diffLen(2, "core", 1, 7, 4, "e1-len");
  const m3 = clock(3, "core", 2, 4, "e1-clock");
  const m4 = clip(4, "core", 2, 3, 2, "e1-len");
  const m5 = numeric({
    id: id("measure", 5), skill: S.measure, role: "core", d: 3, family: "e1-len", value: 21,
    prompt: T("빨간 끈은 12cm, 파란 끈은 9cm예요. 두 끈을 길게 이어 붙이면 모두 몇 cm일까요? (숫자만 쓰세요)", "Sợi dây đỏ dài 12 cm, sợi dây xanh dài 9 cm. Nối hai sợi lại thành một sợi dài thì dài bao nhiêu cm? (chỉ nhập số)"),
    hints: [T("이어 붙이면 길이를 더해요.", "Nối lại thì cộng hai độ dài."), T("12 + 9 의 값을 구해요.", "Hãy tính 12 + 9.")],
    expl: T(`${tex("12 + 9 = 21")} 이므로 모두 21cm예요.`, `${tex("12 + 9 = 21")} nên dài tất cả 21 cm.`),
  });
  longer("v1", "variant", 1, [11, 18, 14], "e1-len");
  clock("v2", "variant", 1, 9, "e1-clock");
  diffLen("d1", "diagnostic", 3, 15, 9);

  const lesson = (n, sk, title, concept, example, core, challenge) => ({ id: `math-e1-l${n}`, title, concept, example, skills: [S[sk]], core, challenge });
  b.course({
    id: "math-e1", grade: "E1", title: T("초1 수학 · 수와 모양", "Toán Lớp 1 · Số và hình"),
    world: { name: T("Number Meadow", "Đồng cỏ Số"), emoji: "🌼", tagline: T("수와 모양과 친구가 되어요", "Làm bạn với các con số và hình khối") },
    unit: { id: "math-e1-u1", title: T("수와 연산, 모양", "Số, phép tính và hình") },
    lessons: [
      lesson(1, "count", T("수 세기", "Đếm số"), T("물건을 하나씩 짚으며 세면 몇 개인지 알 수 있어요. 10이 넘으면 5개나 10개씩 묶어서 세면 쉬워요.", "Chỉ vào từng vật và đếm là biết có bao nhiêu. Khi có hơn 10 vật, hãy nhóm 5 hoặc 10 vật một để đếm cho dễ."), T(`🍎🍎🍎🍎🍎 → 사과는 5개예요.`, `🍎🍎🍎🍎🍎 → có 5 quả táo.`), [c1, c2, c3, c4], c5),
      lesson(2, "addsub", T("더하기와 빼기", "Cộng và trừ"), T("**더하기(+)**는 두 수를 합치는 것이고, **빼기(-)**는 큰 수에서 작은 수만큼 덜어 내는 것이에요.", "**Cộng (+)** là gộp hai số lại, còn **trừ (-)** là bớt đi từ số lớn."), T(`${tex("3 + 4 = 7")}, ${tex("8 - 3 = 5")}`, `${tex("3 + 4 = 7")}, ${tex("8 - 3 = 5")}`), [a1, a2, a3, a4], a5),
      lesson(3, "cmp", T("수의 크기 비교", "So sánh các số"), T("두 수 중 더 큰 수는 **>**, 더 작은 수는 **<**로 나타내요. 기호는 큰 수 쪽으로 벌어져요.", "Số lớn hơn dùng dấu **>**, số bé hơn dùng dấu **<**. Dấu luôn mở về phía số lớn hơn."), T(`${tex("8 > 5")}, ${tex("4 < 7")}`, `${tex("8 > 5")}, ${tex("4 < 7")}`), [k1, k2, k3, k4], k5),
      lesson(4, "shape", T("여러 가지 모양", "Các hình cơ bản"), T("**삼각형**은 변이 3개, **사각형**은 변이 4개예요. **원**은 둥글고 꼭짓점이 없어요.", "**Hình tam giác** có 3 cạnh, **hình tứ giác** có 4 cạnh. **Hình tròn** tròn đều và không có đỉnh."), T("삼각형: 변 3개, 꼭짓점 3개", "Hình tam giác: 3 cạnh, 3 đỉnh"), [s1, s2, s3, s4], s5),
      lesson(5, "measure", T("길이와 시계", "Độ dài và đồng hồ"), T("길이는 **cm**로 재요. 시계의 짧은바늘은 '시', 긴바늘은 '분'을 알려 줘요.", "Độ dài đo bằng **cm**. Kim ngắn của đồng hồ chỉ giờ, kim dài chỉ phút."), T("짧은바늘 4, 긴바늘 12 → 4시", "Kim ngắn chỉ 4, kim dài chỉ 12 → 4 giờ"), [m1, m2, m3, m4], m5),
    ],
  });
}

/* ================================ Elementary 2 ================================ */
export function e2(b, h) {
  const { numeric, choice, truefalse } = h;
  const S = { place: "m.e2.place", addsub: "m.e2.addsub", mul: "m.e2.mul", time: "m.e2.time", pattern: "m.e2.pattern" };
  b.skill(S.place, T("자릿값", "Giá trị theo hàng"));
  b.skill(S.addsub, T("두 자리 수의 덧셈과 뺄셈", "Cộng và trừ số có hai chữ số"), S.place);
  b.skill(S.mul, T("곱셈 처음 만나기", "Làm quen với phép nhân"), S.addsub);
  b.skill(S.time, T("길이와 시각", "Độ dài và thời gian"), S.addsub);
  b.skill(S.pattern, T("규칙 찾기", "Tìm quy luật"), S.mul);
  const id = (sk, n) => `m-e2-${sk}-${n}`;

  // ---- place value ----
  const tensDigit = (n, role, d, v, fam) => numeric({
    id: id("place", n), skill: S.place, role, d, family: fam, value: Math.floor(v / 10),
    prompt: T(`${tex(String(v))} 에서 십의 자리 숫자는 무엇일까요? (숫자만 쓰세요)`, `Trong số ${tex(String(v))}, chữ số hàng chục là mấy? (chỉ nhập số)`),
    hints: [T("두 자리 수에서 왼쪽 숫자가 십의 자리예요.", "Trong số có hai chữ số, chữ số bên trái là hàng chục."), T("오른쪽 숫자는 일의 자리예요.", "Chữ số bên phải là hàng đơn vị.")],
    expl: T(`${tex(String(v))} → 십의 자리: ${Math.floor(v / 10)}, 일의 자리: ${v % 10}.`, `Số ${tex(String(v))} có hàng chục là ${Math.floor(v / 10)}, hàng đơn vị là ${v % 10}.`),
  });
  const build = (n, role, d, t, u, fam) => numeric({
    id: id("place", n), skill: S.place, role, d, family: fam, value: t * 10 + u,
    prompt: T(`10이 ${t}개, 1이 ${u}개이면 얼마일까요? (숫자만 쓰세요)`, `${t} chục và ${u} đơn vị là số nào? (chỉ nhập số)`),
    hints: [T("10이 몇 개인지가 십의 자리예요.", "Số chục chính là chữ số hàng chục."), T(`${t}0 + ${u} 의 값을 구해 보세요.`, `Hãy cộng ${t}0 với ${u}.`)],
    expl: T(`${tex(`${t * 10} + ${u} = ${t * 10 + u}`)}.`, `${tex(`${t * 10} + ${u} = ${t * 10 + u}`)}.`),
  });
  const next = (n, role, d, v, fam) => numeric({
    id: id("place", n), skill: S.place, role, d, family: fam, value: v + 1,
    prompt: T(`${tex(String(v))} 보다 1 큰 수는 얼마일까요? (숫자만 쓰세요)`, `Số nào lớn hơn ${tex(String(v))} một đơn vị? (chỉ nhập số)`),
    hints: [T("1을 더해요.", "Hãy cộng thêm 1."), T("일의 자리가 9이면 십의 자리가 하나 늘어요.", "Nếu hàng đơn vị là 9, hàng chục sẽ tăng thêm một.")],
    expl: T(`${tex(`${v} + 1 = ${v + 1}`)}.`, `${tex(`${v} + 1 = ${v + 1}`)}.`),
  });
  const p1 = tensDigit(1, "core", 1, 47, "e2-digit");
  const p2 = build(2, "core", 1, 5, 3, "e2-build");
  const p3 = tensDigit(3, "core", 2, 82, "e2-digit");
  const p4 = next(4, "core", 2, 29, "e2-build");
  const p5 = numeric({
    id: id("place", 5), skill: S.place, role: "core", d: 3, family: "e2-build", value: 10,
    prompt: T("100은 10이 몇 개 모인 수일까요? (숫자만 쓰세요)", "Số 100 gồm bao nhiêu chục? (chỉ nhập số)"),
    hints: [T("10, 20, 30, ... 으로 100까지 세어 보세요.", "Hãy đếm 10, 20, 30, ... cho đến 100."), T("10씩 몇 번 뛰어 세면 100일까요?", "Đếm nhảy cách 10 bao nhiêu lần thì được 100?")],
    expl: T("10이 10개 모이면 100이에요.", "10 chục hợp lại thành 100."),
  });
  tensDigit("v1", "variant", 1, 65, "e2-digit");
  build("v2", "variant", 2, 7, 4, "e2-build");
  build("d1", "diagnostic", 1, 3, 6);

  // ---- two-digit add / subtract ----
  const add2 = (n, role, d, a, c, fam, carry) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a + c,
    prompt: T(`${tex(`${a} + ${c}`)} 의 값을 구하세요.`, `Tính ${tex(`${a} + ${c}`)}.`),
    hints: [T("일의 자리끼리, 십의 자리끼리 더해요.", "Cộng hàng đơn vị với hàng đơn vị, hàng chục với hàng chục."), T(carry ? "일의 자리의 합이 10이 넘으면 십의 자리로 1을 올려요." : "일의 자리를 먼저 더한 다음 십의 자리를 더해요.", carry ? "Nếu tổng hàng đơn vị từ 10 trở lên, hãy nhớ 1 sang hàng chục." : "Cộng hàng đơn vị trước, rồi cộng hàng chục.")],
    expl: T(`${tex(`${a} + ${c} = ${a + c}`)}.`, `${tex(`${a} + ${c} = ${a + c}`)}.`),
  });
  const sub2 = (n, role, d, a, c, fam, borrow) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a - c,
    prompt: T(`${tex(`${a} - ${c}`)} 의 값을 구하세요.`, `Tính ${tex(`${a} - ${c}`)}.`),
    hints: [T("일의 자리끼리, 십의 자리끼리 빼요.", "Trừ hàng đơn vị cho hàng đơn vị, hàng chục cho hàng chục."), T(borrow ? "일의 자리끼리 뺄 수 없으면 십의 자리에서 10을 받아 와요." : "일의 자리를 먼저 빼고 십의 자리를 빼요.", borrow ? "Nếu hàng đơn vị không trừ được, hãy mượn 10 từ hàng chục." : "Trừ hàng đơn vị trước, rồi trừ hàng chục.")],
    expl: T(`${tex(`${a} - ${c} = ${a - c}`)}.`, `${tex(`${a} - ${c} = ${a - c}`)}.`),
  });
  const addWord = (n, role, d, o, a, c, fam) => numeric({
    id: id("addsub", n), skill: S.addsub, role, d, family: fam, value: a + c,
    prompt: T(`${o.ko}${o.ga} ${a}${o.cnt} 있어요. ${c}${o.cnt}${o.cntEul} 더 모으면 모두 몇 ${o.cnt}일까요?`, `Có ${a} ${o.vi}. Gom thêm ${c} ${o.cls} nữa. Hỏi có tất cả bao nhiêu ${o.cls}?`),
    hints: [T("처음 수와 더 모은 수를 더해요.", "Cộng số lúc đầu với số gom thêm."), T("일의 자리부터 더해 보세요.", "Hãy cộng từ hàng đơn vị.")],
    expl: T(`${tex(`${a} + ${c} = ${a + c}`)} 이므로 모두 ${a + c}${o.cnt}${cop(o)}.`, `${tex(`${a} + ${c} = ${a + c}`)} nên có tất cả ${a + c} ${o.cls}.`),
  });
  const q1 = add2(1, "core", 1, 23, 14, "e2-add");
  const q2 = add2(2, "core", 2, 45, 27, "e2-add", true);
  const q3 = sub2(3, "core", 2, 58, 23, "e2-sub");
  const q4 = sub2(4, "core", 3, 61, 28, "e2-sub", true);
  const q5 = addWord(5, "core", 3, OBJ.candy, 36, 28, "e2-add");
  add2("v1", "variant", 1, 32, 15, "e2-add");
  sub2("v2", "variant", 2, 74, 31, "e2-sub");
  add2("d1", "diagnostic", 2, 38, 24, undefined, true);
  sub2("d2", "diagnostic", 2, 83, 41);

  // ---- multiplication intro ----
  const mulE = (n, role, d, a, c, fam) => numeric({
    id: id("mul", n), skill: S.mul, role, d, family: fam, value: a * c,
    prompt: T(`${tex(`${a} \\times ${c}`)} 의 값을 구하세요.`, `Tính giá trị của ${tex(`${a} \\times ${c}`)}.`),
    hints: [T(`${a}씩 ${c}번 더하는 것과 같아요.`, `Phép nhân này giống như cộng ${a} với chính nó ${c} lần.`), T(`${Array(c).fill(a).join(" + ")} 의 값을 구해 보세요.`, `Hãy tính ${Array(c).fill(a).join(" + ")}.`)],
    expl: T(`${tex(`${Array(c).fill(a).join(" + ")} = ${a * c}`)} 이므로 ${tex(`${a} \\times ${c} = ${a * c}`)}.`, `${tex(`${Array(c).fill(a).join(" + ")} = ${a * c}`)} nên ${tex(`${a} \\times ${c} = ${a * c}`)}.`),
  });
  const groups = (n, role, d, per, k, fam) => numeric({
    id: id("mul", n), skill: S.mul, role, d, family: fam, value: per * k,
    prompt: T(`한 접시에 쿠키가 ${per}개씩 ${k}접시 있어요. 쿠키는 모두 몇 개일까요?`, `Mỗi đĩa có ${per} chiếc bánh quy, có ${k} đĩa. Hỏi có tất cả bao nhiêu chiếc bánh quy?`),
    hints: [T("같은 수를 여러 번 더해요.", "Cộng cùng một số nhiều lần."), T(`${per} × ${k} 로 계산할 수 있어요.`, `Có thể tính bằng phép nhân ${per} × ${k}.`)],
    expl: T(`${tex(`${per} \\times ${k} = ${per * k}`)} 이므로 모두 ${per * k}개예요.`, `${tex(`${per} \\times ${k} = ${per * k}`)} nên có tất cả ${per * k} chiếc.`),
  });
  const addToMul = (n, role, d, a, k, fam) => numeric({
    id: id("mul", n), skill: S.mul, role, d, family: fam, value: k,
    prompt: T(`다음 덧셈식을 곱셈식으로 나타낼 때 □ 안에 알맞은 수는? ${tex(Array(k).fill(a).join(" + "))} = ${tex(`${a} \\times \\square`)} (숫자만 쓰세요)`, `Viết ${tex(Array(k).fill(a).join(" + "))} thành phép nhân ${tex(`${a} \\times \\square`)}. Số trong ô vuông là mấy? (chỉ nhập số)`),
    hints: [T(`더해진 ${a}의 개수를 세어 보세요.`, `Hãy đếm xem ${a} được cộng bao nhiêu lần.`), T("더한 횟수가 곱하는 수예요.", "Số lần cộng chính là số đem nhân.")],
    expl: T(`${a}씩 ${k}번 더했으니 ${tex(`${a} \\times ${k}`)}.`, `${a} được cộng ${k} lần nên là ${tex(`${a} \\times ${k}`)}.`),
  });
  const u1 = mulE(1, "core", 1, 2, 4, "e2-mulE");
  const u2 = mulE(2, "core", 1, 3, 5, "e2-mulE");
  const u3 = groups(3, "core", 2, 3, 4, "e2-group");
  const u4 = addToMul(4, "core", 2, 5, 4, "e2-group");
  const u5 = mulE(5, "core", 3, 4, 6, "e2-mulE");
  mulE("v1", "variant", 1, 2, 6, "e2-mulE");
  groups("v2", "variant", 2, 4, 3, "e2-group");
  mulE("d1", "diagnostic", 2, 5, 3);

  // ---- length / time ----
  const meters = (n, role, d, m, fam) => numeric({
    id: id("time", n), skill: S.time, role, d, family: fam, value: m * 100,
    prompt: T(`1m는 100cm예요. ${m}m는 몇 cm일까요? (숫자만 쓰세요)`, `1 m bằng 100 cm. ${m} m bằng bao nhiêu cm? (chỉ nhập số)`),
    hints: [T("1m마다 100cm씩 늘어나요.", "Mỗi 1 m có 100 cm."), T(`100을 ${m}번 더해요.`, `Hãy cộng 100 với chính nó ${m} lần.`)],
    expl: T(`${tex(`${m} \\times 100 = ${m * 100}`)} 이므로 ${m * 100}cm예요.`, `${tex(`${m} \\times 100 = ${m * 100}`)} nên là ${m * 100} cm.`),
  });
  const after = (n, role, d, h0, fam) => numeric({
    id: id("time", n), skill: S.time, role, d, family: fam, value: h0 + 1,
    prompt: T(`지금은 ${h0}시 30분이에요. 30분이 지나면 몇 시일까요? (숫자만 쓰세요)`, `Bây giờ là ${h0} giờ 30 phút. 30 phút nữa là mấy giờ? (chỉ nhập số)`),
    hints: [T("30분 + 30분 = 60분이에요.", "30 phút + 30 phút = 60 phút."), T("60분은 1시간이에요.", "60 phút là 1 giờ.")],
    expl: T(`${h0}시 30분에서 30분이 지나면 ${h0 + 1}시예요.`, `${h0} giờ 30 phút cộng thêm 30 phút là ${h0 + 1} giờ.`),
  });
  const minute = (n, role, d, fam) => numeric({
    id: id("time", n), skill: S.time, role, d, family: fam, value: 30,
    prompt: T("긴바늘이 6을 가리켜요. 몇 분일까요? (숫자만 쓰세요)", "Kim phút chỉ số 6. Đó là bao nhiêu phút? (chỉ nhập số)"),
    hints: [T("시계의 숫자 하나는 5분을 뜻해요.", "Mỗi số trên đồng hồ ứng với 5 phút."), T("5분씩 6번 뛰어 세어 보세요.", "Hãy đếm nhảy cách 5 phút, 6 lần.")],
    expl: T(`${tex("5 \\times 6 = 30")} 이므로 30분이에요.`, `${tex("5 \\times 6 = 30")} nên là 30 phút.`),
  });
  const remain = (n, role, d, total, fam) => numeric({
    id: id("time", n), skill: S.time, role, d, family: fam, value: total - 100,
    prompt: T(`끈의 길이가 ${total}cm예요. 1m(100cm)를 쓰고 남은 길이는 몇 cm일까요? (숫자만 쓰세요)`, `Một sợi dây dài ${total} cm. Dùng hết 1 m (100 cm) thì còn lại bao nhiêu cm? (chỉ nhập số)`),
    hints: [T("처음 길이에서 쓴 길이를 빼요.", "Lấy độ dài lúc đầu trừ đi phần đã dùng."), T(`${total} - 100 의 값을 구해요.`, `Hãy tính ${total} - 100.`)],
    expl: T(`${tex(`${total} - 100 = ${total - 100}`)} 이므로 ${total - 100}cm 남아요.`, `${tex(`${total} - 100 = ${total - 100}`)} nên còn lại ${total - 100} cm.`),
  });
  const t1 = meters(1, "core", 1, 2, "e2-m");
  const t2 = after(2, "core", 1, 5, "e2-clock");
  const t3 = remain(3, "core", 2, 120, "e2-m");
  const t4 = minute(4, "core", 2, "e2-clock");
  const t5 = numeric({
    id: id("time", 5), skill: S.time, role: "core", d: 3, family: "e2-clock", value: 30,
    prompt: T("2시 20분에서 10분이 지나면 몇 시 몇 분일까요? '분'에 해당하는 수만 쓰세요.", "2 giờ 20 phút, sau 10 phút nữa là mấy giờ mấy phút? Chỉ nhập số phút."),
    hints: [T("분끼리 더해요.", "Hãy cộng số phút với nhau."), T("20 + 10 의 값을 구해요.", "Hãy tính 20 + 10.")],
    expl: T(`${tex("20 + 10 = 30")} 이므로 2시 30분이에요.`, `${tex("20 + 10 = 30")} nên là 2 giờ 30 phút.`),
  });
  meters("v1", "variant", 1, 3, "e2-m");
  after("v2", "variant", 2, 8, "e2-clock");
  remain("d1", "diagnostic", 2, 150);

  // ---- patterns ----
  const seq = (n, role, d, start, step, shown, fam, label) => {
    const list = Array.from({ length: shown }, (_, i) => start + i * step);
    const value = start + shown * step;
    return numeric({
      id: id("pattern", n), skill: S.pattern, role, d, family: fam, value,
      prompt: T(`규칙을 찾아 □에 알맞은 수를 쓰세요: ${tex(`${list.join(", ")}, \\square`)}`, `Tìm quy luật rồi điền số thích hợp vào ô vuông: ${tex(`${list.join(", ")}, \\square`)}`),
      hints: [T("이웃한 두 수의 차이를 살펴보세요.", "Hãy xem hiệu của hai số đứng cạnh nhau."), T(`${step > 0 ? "매번 " + step + "씩 커져요." : "매번 " + -step + "씩 작아져요."}`, `${step > 0 ? "Mỗi lần tăng thêm " + step + "." : "Mỗi lần giảm đi " + -step + "."}`)],
      expl: T(`${step > 0 ? step + "씩 커지는" : -step + "씩 작아지는"} 규칙이에요. ${tex(`${list[list.length - 1]} ${step > 0 ? "+" : "-"} ${Math.abs(step)} = ${value}`)}`, `Quy luật là ${step > 0 ? "tăng " + step : "giảm " + -step} mỗi lần. ${tex(`${list[list.length - 1]} ${step > 0 ? "+" : "-"} ${Math.abs(step)} = ${value}`)}`),
    });
  };
  const r1 = seq(1, "core", 1, 2, 2, 4, "e2-up");
  const r2 = seq(2, "core", 1, 5, 5, 3, "e2-up");
  const r3 = seq(3, "core", 2, 1, 2, 4, "e2-up");
  const r4 = seq(4, "core", 2, 20, -2, 3, "e2-down");
  const r5 = seq(5, "core", 3, 3, 3, 5, "e2-up");
  seq("v1", "variant", 1, 4, 4, 3, "e2-up");
  seq("v2", "variant", 2, 30, -5, 3, "e2-down");
  seq("d1", "diagnostic", 2, 10, 10, 4);

  const lesson = (n, sk, title, concept, example, core, challenge) => ({ id: `math-e2-l${n}`, title, concept, example, skills: [S[sk]], core, challenge });
  b.course({
    id: "math-e2", grade: "E2", title: T("초2 수학 · 두 자리 수와 곱셈", "Toán Lớp 2 · Số có hai chữ số và phép nhân"),
    world: { name: T("Multiply Mountain", "Núi Phép Nhân"), emoji: "⛰️", tagline: T("묶어 세며 산을 올라요", "Đếm theo nhóm để leo lên đỉnh núi") },
    unit: { id: "math-e2-u1", title: T("자릿값, 덧셈 뺄셈, 곱셈 시작", "Hàng, cộng trừ và bước đầu làm quen phép nhân") },
    lessons: [
      lesson(1, "place", T("자릿값", "Giá trị theo hàng"), T("두 자리 수에서 왼쪽 숫자는 **십의 자리**, 오른쪽 숫자는 **일의 자리**예요. 10이 10개 모이면 100이에요.", "Trong số có hai chữ số, chữ số bên trái là **hàng chục**, bên phải là **hàng đơn vị**. 10 chục hợp lại thành 100."), T(`${tex("47")} = 10이 4개, 1이 7개`, `${tex("47")} = 4 chục và 7 đơn vị`), [p1, p2, p3, p4], p5),
      lesson(2, "addsub", T("두 자리 수의 덧셈과 뺄셈", "Cộng và trừ số có hai chữ số"), T("일의 자리끼리, 십의 자리끼리 계산해요. 합이 10이 넘으면 올림하고, 뺄 수 없으면 내림해요.", "Tính hàng đơn vị với hàng đơn vị, hàng chục với hàng chục. Tổng từ 10 trở lên thì nhớ, không trừ được thì mượn."), T(`${tex("45 + 27 = 72")}, ${tex("61 - 28 = 33")}`, `${tex("45 + 27 = 72")}, ${tex("61 - 28 = 33")}`), [q1, q2, q3, q4], q5),
      lesson(3, "mul", T("곱셈 처음 만나기", "Làm quen với phép nhân"), T("같은 수를 여러 번 더하는 것을 **곱셈(×)**으로 짧게 쓸 수 있어요.", "Cộng cùng một số nhiều lần có thể viết gọn bằng **phép nhân (×)**."), T(`${tex("3 + 3 + 3 + 3 = 3 \\times 4 = 12")}`, `${tex("3 + 3 + 3 + 3 = 3 \\times 4 = 12")}`), [u1, u2, u3, u4], u5),
      lesson(4, "time", T("길이와 시각", "Độ dài và thời gian"), T("**1m = 100cm**예요. 시계에서 긴바늘이 숫자 하나를 지날 때마다 5분이 지나요.", "**1 m = 100 cm**. Trên đồng hồ, kim dài đi qua mỗi số là 5 phút."), T("긴바늘이 6 → 30분", "Kim dài chỉ số 6 → 30 phút"), [t1, t2, t3, t4], t5),
      lesson(5, "pattern", T("규칙 찾기", "Tìm quy luật"), T("수가 늘어나거나 줄어드는 **규칙**을 찾으면 다음 수를 알 수 있어요.", "Khi tìm ra **quy luật** tăng hoặc giảm của dãy số, ta biết được số tiếp theo."), T(`${tex("2, 4, 6, 8, \\square")} → 2씩 커져요, □ = 10`, `${tex("2, 4, 6, 8, \\square")} → mỗi lần tăng 2, □ = 10`), [r1, r2, r3, r4], r5),
    ],
  });
}

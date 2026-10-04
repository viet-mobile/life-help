import { T, tex, makeUplift } from "./math-uplift-kit.mjs";

const ONE = T("(숫자만 쓰세요)", "(chỉ nhập số)");
const j = (...p) => T(p.map((x) => x.ko).join(" "), p.map((x) => x.vi).join(" "));

/** Elementary 3: multi-step stories, working backwards, unit conversions that mix units, a fraction misconception, a circle fact. */
export function upliftE3(b, h) {
  const u = makeUplift(b, h, "e3");

  // L1 multiplication / division
  u.num(1, "a", 3, ["multistep", "context"], j(T("한 상자에 연필이 12자루씩 들어 있어요. 4상자 중에서 15자루를 나누어 주었어요. 남은 연필은 몇 자루일까요?", "Mỗi hộp có 12 cây bút chì. Có 4 hộp. Đã phát đi 15 cây. Còn lại bao nhiêu cây bút chì?"), ONE), 12 * 4 - 15,
    [T("먼저 연필이 모두 몇 자루인지 구해요.", "Trước tiên tìm tổng số bút chì."), T("전체에서 나누어 준 15자루를 빼요.", "Rồi trừ đi 15 cây đã phát.")],
    T("12 × 4 = 48, 48 - 15 = 33. 33자루가 남아요.", "12 × 4 = 48, 48 - 15 = 33. Còn lại 33 cây."));
  u.num(1, "b", 3, ["multistep", "reasoning"], j(T("어떤 수에 6을 곱했더니 42가 되었어요. 이 어떤 수에 3을 곱하면 얼마일까요?", "Nhân một số với 6 được 42. Nhân số đó với 3 thì được bao nhiêu?"), ONE), (42 / 6) * 3,
    [T("곱셈의 반대는 나눗셈이에요. 어떤 수를 먼저 구해요.", "Phép chia là phép tính ngược của phép nhân. Hãy tìm số đó trước."), T("42 ÷ 6 = 7 이에요.", "42 ÷ 6 = 7.")],
    T("어떤 수는 42 ÷ 6 = 7 이에요. 7 × 3 = 21 이에요.", "Số đó là 42 ÷ 6 = 7. Vậy 7 × 3 = 21."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  // L2 fractions
  u.mc(2, "a", 2, ["context"], T("케이크를 똑같이 6조각으로 나누어 2조각을 먹었어요. 먹은 양을 분수로 나타내면?", "Chia đều chiếc bánh thành 6 phần và ăn 2 phần. Phần đã ăn biểu diễn bằng phân số nào?"),
    [tex("\\frac{2}{6}"), tex("\\frac{2}{4}"), tex("\\frac{4}{6}"), tex("\\frac{6}{2}")], 0,
    [T("분모는 똑같이 나눈 전체 조각 수예요.", "Mẫu số là tổng số phần bằng nhau."), T("분자는 먹은 조각 수예요.", "Tử số là số phần đã ăn.")],
    T("전체 6조각 중 2조각이므로 2/6 이에요. (4/6 은 남은 양이에요.)", "2 trong 6 phần là 2/6. (4/6 là phần còn lại.)"));
  u.num(2, "b", 3, ["reasoning"], j(T(`단위분수 ${tex("\\frac{1}{3}")}, ${tex("\\frac{1}{6}")}, ${tex("\\frac{1}{4}")} 중 가장 큰 분수의 분모는 얼마일까요?`, `Trong các phân số đơn vị ${tex("\\frac{1}{3}")}, ${tex("\\frac{1}{6}")}, ${tex("\\frac{1}{4}")}, mẫu số của phân số lớn nhất là bao nhiêu?`), ONE), 3,
    [T("피자 한 판을 3조각, 4조각, 6조각으로 나눈 한 조각을 떠올려 보세요.", "Hãy hình dung một chiếc bánh chia thành 3, 4 hoặc 6 phần và lấy một phần.") , T("조각 수가 적을수록 한 조각이 커요.", "Chia càng ít phần thì mỗi phần càng lớn.")],
    T("단위분수는 분모가 작을수록 커요. 가장 큰 분수는 1/3 이고 분모는 3이에요.", "Phân số đơn vị có mẫu số càng nhỏ thì càng lớn. Lớn nhất là 1/3, mẫu số là 3."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  // L3 length / capacity / mass
  u.num(3, "a", 2, ["multistep", "context"], j(T("물통에 1L 500mL의 물이 있어요. 그중 300mL를 마셨어요. 남은 물은 몇 mL일까요?", "Bình có 1 L 500 mL nước. Đã uống 300 mL. Còn lại bao nhiêu mL nước?"), ONE), 1500 - 300,
    [T("1L 500mL를 mL로 바꾸어요.", "Hãy đổi 1 L 500 mL ra mL."), T("1L = 1000mL 이에요.", "1 L = 1000 mL.")],
    T("1L 500mL = 1500mL, 1500 - 300 = 1200 이에요. 1200mL가 남아요.", "1 L 500 mL = 1500 mL, 1500 - 300 = 1200. Còn lại 1200 mL."));
  u.mc(3, "b", 3, ["reasoning"], T("다음 중 가장 긴 길이는?", "Độ dài nào dài nhất trong các độ dài sau?"),
    [T("1km 20m", "1 km 20 m"), T("1km 200m", "1 km 200 m"), T("980m", "980 m"), T("1km 2m", "1 km 2 m")], 1,
    [T("모두 m로 바꾸어 비교해요.", "Hãy đổi tất cả ra m rồi so sánh."), T("1km = 1000m 예요.", "1 km = 1000 m.")],
    T("1020m, 1200m, 980m, 1002m 이므로 가장 긴 것은 1km 200m 예요.", "Lần lượt là 1020 m, 1200 m, 980 m, 1002 m nên dài nhất là 1 km 200 m."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  // L4 circles & angles
  u.num(4, "a", 3, ["multistep", "context"], j(T("반지름이 6cm인 원 모양 접시 2개를 한 줄로 딱 붙여 놓았어요. 한 줄의 가로 길이는 모두 몇 cm일까요?", "Xếp sát nhau thành một hàng 2 chiếc đĩa tròn có bán kính 6 cm. Chiều dài cả hàng là bao nhiêu cm?"), ONE), 6 * 2 * 2,
    [T("접시 하나의 가로 길이는 지름이에요.", "Chiều ngang của mỗi đĩa là đường kính."), T("지름 = 반지름 × 2 예요.", "Đường kính = bán kính × 2.")],
    T("지름은 6 × 2 = 12cm, 접시가 2개이므로 12 × 2 = 24cm 예요.", "Đường kính là 6 × 2 = 12 cm, 2 chiếc đĩa nên 12 × 2 = 24 cm."));
  u.mc(4, "b", 3, ["reasoning"], T("지름이 12cm인 원에 대한 설명으로 옳은 것은?", "Câu nào đúng về hình tròn có đường kính 12 cm?"),
    [T("반지름은 24cm예요.", "Bán kính là 24 cm."), T("반지름은 6cm예요.", "Bán kính là 6 cm."), T("지름은 반지름보다 짧아요.", "Đường kính ngắn hơn bán kính."), T("반지름은 지름과 같아요.", "Bán kính bằng đường kính.")], 1,
    [T("지름과 반지름 사이의 관계를 떠올려 보세요.", "Hãy nhớ lại mối quan hệ giữa đường kính và bán kính."), T("지름은 반지름의 2배예요.", "Đường kính gấp 2 lần bán kính.")],
    T("지름은 반지름의 2배이므로 반지름은 12 ÷ 2 = 6cm 예요.", "Đường kính gấp 2 lần bán kính nên bán kính là 12 ÷ 2 = 6 cm."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  // L5 tables & graphs (same survey as the existing questions)
  const SURVEY = T("좋아하는 과일 조사 결과: 사과 7명, 바나나 5명, 포도 9명, 귤 4명.", "Kết quả khảo sát loại quả yêu thích: táo 7 bạn, chuối 5 bạn, nho 9 bạn, quýt 4 bạn.");
  u.num(5, "a", 3, ["multistep"], j(SURVEY, T("사과와 귤을 좋아하는 학생 수의 합은 포도와 바나나를 좋아하는 학생 수의 합보다 몇 명 더 적을까요?", "Tổng số bạn thích táo và quýt ít hơn tổng số bạn thích nho và chuối bao nhiêu bạn?"), ONE), 9 + 5 - (7 + 4),
    [T("두 묶음의 합을 각각 구해요.", "Hãy tính tổng của từng nhóm."), T("7 + 4 와 9 + 5 를 비교해요.", "So sánh 7 + 4 với 9 + 5.")],
    T("7 + 4 = 11, 9 + 5 = 14 이므로 14 - 11 = 3명 더 적어요.", "7 + 4 = 11, 9 + 5 = 14 nên ít hơn 14 - 11 = 3 bạn."));
  u.num(5, "b", 3, ["reasoning", "context"], j(SURVEY, T("바나나를 좋아한다고 했던 학생 중 2명이 포도로 바꿔 말했어요. 이제 가장 많은 학생이 좋아하는 과일은 몇 명이 좋아할까요?", "Có 2 bạn đã nói thích chuối giờ đổi sang thích nho. Bây giờ loại quả được nhiều bạn thích nhất có bao nhiêu bạn thích?"), ONE), 9 + 2,
    [T("바뀌는 두 과일의 학생 수를 다시 계산해요.", "Hãy tính lại số bạn của hai loại quả thay đổi."), T("포도는 2명이 늘고 바나나는 2명이 줄어요.", "Nho tăng 2 bạn, chuối giảm 2 bạn.")],
    T("포도는 9 + 2 = 11명, 바나나는 5 - 2 = 3명이에요. 가장 많은 것은 포도 11명이에요.", "Nho là 9 + 2 = 11 bạn, chuối là 5 - 2 = 3 bạn. Nhiều nhất là nho với 11 bạn."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

/** Elementary 4: place-value reasoning with digit cards, remainders, mixed decimals, finding the error, angle chains, averages worked backwards. */
export function upliftE4(b, h) {
  const u = makeUplift(b, h, "e4");

  // L1 big numbers
  u.num(1, "a", 3, ["reasoning"], j(T("숫자 카드 5, 0, 8, 2 를 한 번씩만 써서 만들 수 있는 가장 작은 네 자리 수는 얼마일까요?", "Dùng mỗi thẻ số 5, 0, 8, 2 đúng một lần. Số có bốn chữ số nhỏ nhất có thể lập được là số nào?"), ONE), 2058,
    [T("가장 작은 수는 높은 자리에 작은 숫자를 놓아요.", "Số nhỏ nhất đặt chữ số bé ở hàng cao."), T("단, 0은 맨 앞에 올 수 없어요.", "Nhưng chữ số 0 không được đứng đầu.")],
    T("맨 앞에는 0 다음으로 작은 2를 놓고 0, 5, 8 순으로 이어요. 2058 이에요.", "Đặt 2 (nhỏ nhất, trừ 0) ở đầu rồi đến 0, 5, 8. Được 2058."));
  u.num(1, "b", 3, ["multistep", "context"], j(T("학교 도서관에 책이 12500권 있었어요. 올해 3400권을 새로 사고 1200권을 버렸어요. 지금 책은 모두 몇 권일까요?", "Thư viện trường có 12500 cuốn sách. Năm nay mua thêm 3400 cuốn và thanh lý 1200 cuốn. Bây giờ có tất cả bao nhiêu cuốn?"), ONE), 12500 + 3400 - 1200,
    [T("산 책은 더하고, 버린 책은 빼요.", "Sách mua thì cộng, sách thanh lý thì trừ."), T("12500 + 3400 을 먼저 구해요.", "Tính 12500 + 3400 trước.")],
    T("12500 + 3400 = 15900, 15900 - 1200 = 14700. 14700권이에요.", "12500 + 3400 = 15900, 15900 - 1200 = 14700. Có 14700 cuốn."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  // L2 multiplication / division
  u.num(2, "a", 2, ["multistep", "context"], j(T("한 상자에 사과가 24개씩 들어 있어요. 15상자 중 4상자를 팔았어요. 남은 사과는 모두 몇 개일까요?", "Mỗi thùng có 24 quả táo, có 15 thùng. Đã bán 4 thùng. Còn lại bao nhiêu quả táo?"), ONE), 24 * (15 - 4),
    [T("남은 상자 수를 먼저 구해요.", "Trước tiên tìm số thùng còn lại."), T("15 - 4 = 11 상자예요.", "15 - 4 = 11 thùng.")],
    T("남은 상자는 11개, 24 × 11 = 264. 사과는 264개예요.", "Còn 11 thùng, 24 × 11 = 264. Có 264 quả táo."));
  u.num(2, "b", 3, ["multistep", "reasoning"], j(T("어떤 수를 12로 나누었더니 몫이 13, 나머지가 5였어요. 어떤 수는 얼마일까요?", "Chia một số cho 12 được thương 13 và dư 5. Số đó là bao nhiêu?"), ONE), 12 * 13 + 5,
    [T("나누는 수 × 몫 + 나머지 = 나누어지는 수예요.", "Số chia × thương + số dư = số bị chia."), T("12 × 13 을 먼저 구해요.", "Tính 12 × 13 trước.")],
    T("12 × 13 = 156, 156 + 5 = 161. 어떤 수는 161이에요.", "12 × 13 = 156, 156 + 5 = 161. Số đó là 161."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  // L3 fractions and decimals
  u.num(3, "a", 3, ["multistep", "context"], j(T("주스가 2.5L 있어요. 0.75L를 마시고 1.5L를 더 넣었어요. 지금 주스는 몇 L일까요?", "Có 2,5 L nước ép. Uống 0,75 L rồi đổ thêm 1,5 L. Bây giờ có bao nhiêu lít nước ép?"), ONE), 2.5 - 0.75 + 1.5,
    [T("마신 양은 빼고, 더 넣은 양은 더해요.", "Lượng đã uống thì trừ, lượng đổ thêm thì cộng."), T("소수점의 위치를 맞춰 계산해요.", "Đặt thẳng hàng dấu phẩy khi tính.")],
    T("2.5 - 0.75 = 1.75, 1.75 + 1.5 = 3.25. 3.25L 예요.", "2,5 - 0,75 = 1,75, 1,75 + 1,5 = 3,25. Được 3,25 L."), 1e-6);
  u.mc(3, "b", 3, ["reasoning"], T(`${tex("\\frac{3}{7}+\\frac{2}{7}")} 을 ${tex("\\frac{5}{14}")} 라고 계산했어요. 무엇이 잘못되었을까요?`, `Một bạn tính ${tex("\\frac{3}{7}+\\frac{2}{7}")} bằng ${tex("\\frac{5}{14}")}. Bạn ấy sai ở đâu?`),
    [T("분모끼리도 더했어요.", "Đã cộng cả hai mẫu số."), T("분자끼리 빼지 않았어요.", "Không trừ các tử số."), T("계산이 맞아요.", "Phép tính đúng."), T("분모를 곱해야 해요.", "Phải nhân các mẫu số.")], 0,
    [T("분모가 같은 분수의 덧셈에서 분모는 어떻게 될까요?", "Khi cộng hai phân số cùng mẫu số, mẫu số thay đổi thế nào?"), T("똑같이 나눈 조각의 크기는 변하지 않아요.", "Kích thước mỗi phần bằng nhau không đổi.")],
    T("분모는 그대로 7이고 분자만 더해요. 3/7 + 2/7 = 5/7 이에요.", "Mẫu số vẫn là 7, chỉ cộng các tử số. 3/7 + 2/7 = 5/7."));
  u.ladder(3, [1, 2, 3], ["a", "b"]);

  // L4 angles
  u.num(4, "a", 2, ["multistep"], j(T("이등변삼각형의 꼭지각이 40°예요. 한 밑각은 몇 도일까요?", "Tam giác cân có góc ở đỉnh là 40°. Mỗi góc ở đáy là bao nhiêu độ?"), ONE), (180 - 40) / 2,
    [T("세 각의 합은 180°예요. 두 밑각은 서로 같아요.", "Tổng ba góc là 180°. Hai góc đáy bằng nhau."), T("180 - 40 을 반으로 나눠요.", "Lấy 180 - 40 rồi chia đôi.")],
    T("두 밑각의 합은 180 - 40 = 140°, 한 밑각은 140 ÷ 2 = 70° 예요.", "Tổng hai góc đáy là 180 - 40 = 140°, mỗi góc là 140 ÷ 2 = 70°."));
  u.num(4, "b", 3, ["reasoning"], j(T("사각형의 세 각이 85°, 95°, 110°예요. 나머지 한 각은 몇 도일까요?", "Ba góc của một hình tứ giác là 85°, 95°, 110°. Góc còn lại là bao nhiêu độ?"), ONE), 360 - (85 + 95 + 110),
    [T("사각형의 네 각의 합은 360°예요.", "Tổng bốn góc của hình tứ giác là 360°."), T("세 각의 합을 구해서 360에서 빼요.", "Tính tổng ba góc rồi lấy 360 trừ đi.")],
    T("85 + 95 + 110 = 290, 360 - 290 = 70. 나머지 각은 70°예요.", "85 + 95 + 110 = 290, 360 - 290 = 70. Góc còn lại là 70°."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  // L5 bar graph and averages (same data as the existing questions)
  const BOOKS = T("월별로 읽은 책 수: 1월 12권, 2월 18권, 3월 9권, 4월 21권.", "Số sách đọc theo từng tháng: tháng 1 là 12 cuốn, tháng 2 là 18 cuốn, tháng 3 là 9 cuốn, tháng 4 là 21 cuốn.");
  u.num(5, "a", 3, ["reasoning", "multistep"], j(BOOKS, T("5월에 몇 권을 읽으면 5개월 동안의 평균이 16권이 될까요?", "Tháng 5 phải đọc bao nhiêu cuốn để trung bình 5 tháng là 16 cuốn?"), ONE), 16 * 5 - (12 + 18 + 9 + 21),
    [T("평균 × 개수 = 전체 합이에요.", "Trung bình × số tháng = tổng."), T("16 × 5 에서 4개월 합을 빼요.", "Lấy 16 × 5 trừ tổng 4 tháng.")],
    T("5개월 합은 16 × 5 = 80, 4개월 합은 60이에요. 80 - 60 = 20권이에요.", "Tổng 5 tháng là 16 × 5 = 80, tổng 4 tháng là 60. 80 - 60 = 20 cuốn."));
  u.num(5, "b", 3, ["multistep", "reasoning"], j(BOOKS, T("읽은 책 수가 4개월 평균보다 많은 달은 모두 몇 달일까요?", "Có bao nhiêu tháng đọc nhiều sách hơn mức trung bình của 4 tháng?"), ONE), [12, 18, 9, 21].filter((x) => x > 15).length,
    [T("먼저 4개월의 평균을 구해요.", "Trước tiên tính trung bình của 4 tháng."), T("평균은 60 ÷ 4 = 15권이에요.", "Trung bình là 60 ÷ 4 = 15 cuốn.")],
    T("평균은 15권이에요. 15권보다 많은 달은 2월(18권)과 4월(21권), 모두 2달이에요.", "Trung bình là 15 cuốn. Các tháng nhiều hơn 15 là tháng 2 (18) và tháng 4 (21), tổng cộng 2 tháng."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

export function upliftE34(b, h) { upliftE3(b, h); upliftE4(b, h); }

import { T, tex, makeUplift } from "./math-uplift-kit.mjs";

const ONE = T("(숫자만 쓰세요)", "(chỉ nhập số)");
const j = (...p) => T(p.map((x) => x.ko).join(" "), p.map((x) => x.vi).join(" "));

/** Elementary 1: "think one more time" - two-step stories, the number that was counted twice, off-by-one, shapes put together. */
export function upliftE1(b, h) {
  const u = makeUplift(b, h, "e1");
  // L1 counting: [1,2,3 kept] -> two groups; a counting slip
  u.num(1, "a", 2, ["context"], j(T("빨간 구슬 🔴🔴🔴🔴🔴 와 파란 구슬 🔵🔵🔵 을 모두 세면 몇 개일까요?", "Có các viên bi đỏ 🔴🔴🔴🔴🔴 và các viên bi xanh 🔵🔵🔵. Đếm tất cả thì được bao nhiêu viên?"), ONE), 8,
    [T("빨간 구슬을 먼저 세고, 이어서 파란 구슬을 세어요.", "Hãy đếm bi đỏ trước, rồi đếm tiếp bi xanh."), T("5 다음부터 6, 7, 8 하고 이어 세요.", "Đếm tiếp từ 5: 6, 7, 8.")],
    T("5개와 3개를 이어 세면 모두 8개예요.", "5 viên và 3 viên, đếm tiếp được tất cả 8 viên."));
  u.num(1, "b", 3, ["reasoning"], j(T("지아가 사탕을 세었는데 한 개를 두 번 세어서 9개라고 했어요. 사탕은 실제로 몇 개일까요?", "Mai đếm kẹo nhưng đếm trùng một viên hai lần nên nói có 9 viên. Thực tế có bao nhiêu viên kẹo?"), ONE), 8,
    [T("두 번 센 사탕 한 개를 빼야 해요.", "Phải bớt đi viên kẹo bị đếm hai lần."), T("9보다 1 작은 수예요.", "Đó là số nhỏ hơn 9 một đơn vị.")],
    T("한 개를 두 번 셌으니 9 - 1 = 8, 실제로는 8개예요.", "Một viên bị đếm hai lần nên 9 - 1 = 8. Thực tế có 8 viên."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  // L2 add / subtract
  u.num(2, "a", 3, ["multistep", "context"], j(T("사과가 8개 있었어요. 3개를 먹고, 5개를 더 샀어요. 지금 사과는 몇 개일까요?", "Có 8 quả táo. Ăn mất 3 quả rồi mua thêm 5 quả. Bây giờ có bao nhiêu quả táo?"), ONE), 8 - 3 + 5,
    [T("먼저 먹은 만큼 빼요.", "Trước tiên hãy trừ đi số táo đã ăn."), T("그다음 산 만큼 더해요.", "Sau đó cộng thêm số táo đã mua.")],
    T("8 - 3 = 5, 5 + 5 = 10. 지금은 10개예요.", "8 - 3 = 5, rồi 5 + 5 = 10. Bây giờ có 10 quả."));
  u.num(2, "b", 3, ["reasoning"], j(T(`${tex("\\square + 6 = 13")} 에서 □ 안에 알맞은 수는 얼마일까요?`, `Trong ${tex("\\square + 6 = 13")}, số nào điền vào ô trống?`), ONE), 7,
    [T("13에서 6을 빼면 □를 알 수 있어요.", "Lấy 13 trừ 6 sẽ ra số trong ô trống."), T("13 - 6 을 계산해 보세요.", "Hãy tính 13 - 6.")],
    T("□ = 13 - 6 = 7 이에요. 7 + 6 = 13 으로 확인해요.", "Ô trống = 13 - 6 = 7. Kiểm tra: 7 + 6 = 13."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  // L3 comparing
  u.mc(3, "a", 2, ["context"], T("민수는 스티커가 14장, 하나는 11장, 서준이는 17장 있어요. 스티커가 가장 적은 사람은?", "Minh có 14 miếng dán, Lan có 11 miếng dán, Nam có 17 miếng dán. Ai có ít miếng dán nhất?"),
    [T("민수", "Minh"), T("하나", "Lan"), T("서준", "Nam")], 1,
    [T("세 수를 모두 비교해요.", "Hãy so sánh cả ba số."), T("11, 14, 17 중 가장 작은 수를 찾아요.", "Tìm số nhỏ nhất trong 11, 14, 17.")],
    T("11이 가장 작아요. 그래서 스티커가 가장 적은 사람은 하나예요.", "11 là số nhỏ nhất, nên Lan có ít miếng dán nhất."));
  u.num(3, "b", 3, ["reasoning"], j(T(`${tex("\\square")} 가 ${tex("9")} 보다 크고 ${tex("12")} 보다 작은 수일 때, □가 될 수 있는 수는 모두 몇 개일까요?`, `Số ${tex("\\square")} lớn hơn ${tex("9")} và nhỏ hơn ${tex("12")}. Có tất cả bao nhiêu số có thể là □?`), ONE), 2,
    [T("9와 12는 포함되지 않아요.", "9 và 12 không tính."), T("9보다 크고 12보다 작은 수를 하나씩 써 보세요.", "Hãy viết từng số lớn hơn 9 và nhỏ hơn 12.")],
    T("10, 11 두 개예요. 9와 12는 들어가지 않아요.", "Đó là 10 và 11, tức là 2 số. 9 và 12 không tính."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  // L4 shapes
  u.num(4, "a", 3, ["multistep"], j(T("삼각형 2개와 사각형 1개의 변은 모두 몇 개일까요?", "2 hình tam giác và 1 hình tứ giác có tất cả bao nhiêu cạnh?"), ONE), 3 * 2 + 4,
    [T("삼각형 하나의 변은 3개, 사각형 하나의 변은 4개예요.", "Mỗi tam giác có 3 cạnh, mỗi hình tứ giác có 4 cạnh."), T("3 + 3 + 4 를 계산해요.", "Hãy tính 3 + 3 + 4.")],
    T("3 + 3 + 4 = 10, 변은 모두 10개예요.", "3 + 3 + 4 = 10. Có tất cả 10 cạnh."));
  u.mc(4, "b", 3, ["reasoning"], T("삼각형 모양 색종이 2장을 긴 변끼리 딱 맞게 붙였어요. 만들 수 있는 도형은?", "Ghép hai tờ giấy hình tam giác sao cho hai cạnh dài khít vào nhau. Có thể tạo ra hình nào?"),
    [T("원", "Hình tròn"), T("사각형", "Hình tứ giác"), T("삼각형", "Hình tam giác"), T("오각형", "Hình ngũ giác")], 1,
    [T("붙인 모양의 변을 세어 보세요.", "Hãy đếm các cạnh của hình sau khi ghép.")  , T("두 삼각형이 맞닿은 변은 안쪽으로 들어가 사라져요.", "Cạnh ghép vào nhau nằm bên trong nên biến mất.")],
    T("삼각형 2개를 붙이면 변이 4개인 사각형이 만들어져요.", "Ghép hai tam giác lại sẽ được hình tứ giác có 4 cạnh."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  // L5 length / clock
  u.num(5, "a", 3, ["multistep", "context"], j(T("12cm 리본에서 5cm를 잘라 내고, 남은 리본에 8cm 리본을 이어 붙였어요. 이어 붙인 리본의 전체 길이는 몇 cm일까요?", "Cắt 5 cm từ dải ruy băng dài 12 cm, rồi nối thêm dải ruy băng 8 cm vào phần còn lại. Tổng chiều dài sau khi nối là bao nhiêu cm?"), ONE), 12 - 5 + 8,
    [T("먼저 잘라 낸 뒤 남은 길이를 구해요.", "Trước tiên tìm phần còn lại sau khi cắt."), T("남은 길이에 8cm를 더해요.", "Rồi cộng thêm 8 cm.")],
    T("12 - 5 = 7, 7 + 8 = 15 이므로 15cm예요.", "12 - 5 = 7, 7 + 8 = 15 nên dài 15 cm."));
  u.mc(5, "b", 3, ["reasoning"], T("연필은 지우개보다 3cm 길고, 지우개는 풀보다 2cm 길어요. 셋 중 가장 짧은 것은?", "Bút chì dài hơn cục tẩy 3 cm, cục tẩy dài hơn hồ dán 2 cm. Vật nào ngắn nhất trong ba vật?"),
    [T("연필", "Bút chì"), T("지우개", "Cục tẩy"), T("풀", "Hồ dán")], 2,
    [T("두 가지 비교를 차례로 이어 보세요.", "Hãy nối hai phép so sánh lại với nhau."), T("연필 > 지우개 > 풀 의 순서예요.", "Thứ tự là bút chì > cục tẩy > hồ dán.")],
    T("연필 > 지우개 > 풀 이므로 가장 짧은 것은 풀이에요.", "Bút chì > cục tẩy > hồ dán nên hồ dán ngắn nhất."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

/** Elementary 2: regrouping, working backwards, "what does this digit stand for", equal groups, rules that change. */
export function upliftE2(b, h) {
  const u = makeUplift(b, h, "e2");
  // L1 place value
  u.mc(1, "a", 2, ["reasoning"], T(`${tex("305")} 에서 숫자 3이 나타내는 값은 얼마일까요?`, `Trong số ${tex("305")}, chữ số 3 biểu thị giá trị nào?`),
    [tex("3"), tex("30"), tex("300"), tex("35")], 2,
    [T("3은 어느 자리에 있는지 먼저 살펴요.", "Hãy xem chữ số 3 đứng ở hàng nào."), T("백의 자리 숫자예요.", "Đó là chữ số hàng trăm.")],
    T("3은 백의 자리라서 300을 나타내요.", "Chữ số 3 ở hàng trăm nên biểu thị 300."));
  u.num(1, "b", 3, ["multistep", "reasoning"], j(T("10이 7개, 1이 15개 모인 수는 얼마일까요?", "Số gồm 7 chục và 15 đơn vị là số nào?"), ONE), 7 * 10 + 15,
    [T("1이 15개이면 10이 1개와 1이 5개예요.", "15 đơn vị là 1 chục và 5 đơn vị."), T("10이 모두 몇 개인지 다시 세어 보세요.", "Hãy đếm lại xem có tất cả mấy chục.")],
    T("70 + 15 = 85 예요. (10이 8개, 1이 5개)", "70 + 15 = 85. (8 chục và 5 đơn vị)"));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  // L2 add / subtract
  u.num(2, "a", 3, ["multistep", "context"], j(T("책 100쪽 중에서 오전에 38쪽, 오후에 27쪽을 읽었어요. 아직 읽지 않은 쪽은 몇 쪽일까요?", "Quyển sách dày 100 trang. Buổi sáng đọc 38 trang, buổi chiều đọc 27 trang. Còn bao nhiêu trang chưa đọc?"), ONE), 100 - 38 - 27,
    [T("먼저 읽은 쪽수를 모두 더해요.", "Trước tiên hãy cộng số trang đã đọc."), T("100에서 읽은 쪽수를 빼요.", "Rồi lấy 100 trừ số trang đã đọc.")],
    T("38 + 27 = 65, 100 - 65 = 35. 35쪽이 남았어요.", "38 + 27 = 65, 100 - 65 = 35. Còn 35 trang."));
  u.num(2, "b", 3, ["reasoning"], j(T(`${tex("\\square + 28 = 61")} 에서 □ 안에 알맞은 수는 얼마일까요?`, `Trong ${tex("\\square + 28 = 61")}, số nào điền vào ô trống?`), ONE), 61 - 28,
    [T("덧셈의 반대는 뺄셈이에요.", "Phép trừ là phép tính ngược của phép cộng."), T("61 - 28 을 계산해요.", "Hãy tính 61 - 28.")],
    T("□ = 61 - 28 = 33 이에요. 33 + 28 = 61 로 확인해요.", "Ô trống = 61 - 28 = 33. Kiểm tra: 33 + 28 = 61."));
  u.ladder(2, [1, 2, 3], ["a", "b"]);

  // L3 multiplication
  u.num(3, "a", 3, ["multistep", "context"], j(T("한 봉지에 사탕이 4개씩 3봉지 있어요. 그중 2개를 먹었어요. 남은 사탕은 몇 개일까요?", "Mỗi túi có 4 viên kẹo, có 3 túi. Đã ăn mất 2 viên. Còn lại bao nhiêu viên kẹo?"), ONE), 4 * 3 - 2,
    [T("먼저 사탕이 모두 몇 개인지 곱셈으로 구해요.", "Trước tiên dùng phép nhân tìm tổng số kẹo."), T("거기에서 먹은 2개를 빼요.", "Rồi trừ đi 2 viên đã ăn.")],
    T("4 × 3 = 12, 12 - 2 = 10. 10개가 남았어요.", "4 × 3 = 12, 12 - 2 = 10. Còn 10 viên."));
  u.mc(3, "b", 3, ["reasoning"], T(`다음 중 ${tex("6 \\times 4")} 와 값이 다른 것은?`, `Biểu thức nào có giá trị khác ${tex("6 \\times 4")}?`),
    [tex("4 \\times 6"), tex("6+6+6+6"), tex("4+4+4+4+4"), tex("3 \\times 8")], 2,
    [T("각 식의 값을 모두 구해서 24와 비교해요.", "Hãy tính giá trị từng biểu thức rồi so với 24."), T("같은 수를 몇 번 더했는지 세어 보세요.", "Đếm xem số đó được cộng bao nhiêu lần.")],
    T("4를 5번 더하면 20이에요. 나머지는 모두 24예요.", "4 cộng 5 lần là 20. Các biểu thức còn lại đều bằng 24."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  // L4 length & time
  u.num(4, "a", 2, ["context"], j(T("영화가 2시에 시작해서 3시간 뒤에 끝나요. 영화가 끝나는 시각은 몇 시일까요?", "Bộ phim bắt đầu lúc 2 giờ và kết thúc sau 3 giờ. Phim kết thúc lúc mấy giờ?"), ONE), 5,
    [T("시작한 시각에 걸린 시간을 더해요.", "Cộng thời gian chiếu vào giờ bắt đầu."), T("2 + 3 을 계산해요.", "Hãy tính 2 + 3.")],
    T("2시에서 3시간이 지나면 5시예요.", "Từ 2 giờ trải qua 3 giờ là 5 giờ."));
  u.num(4, "b", 3, ["multistep"], j(T("길이가 150cm인 끈에서 1m 20cm를 사용했어요. 남은 끈은 몇 cm일까요?", "Sợi dây dài 150 cm. Đã dùng 1 m 20 cm. Còn lại bao nhiêu cm dây?"), ONE), 150 - 120,
    [T("1m 20cm는 몇 cm인지 먼저 바꿔요.", "Trước tiên đổi 1 m 20 cm ra cm."), T("1m = 100cm 예요.", "1 m = 100 cm.")],
    T("1m 20cm = 120cm 이고, 150 - 120 = 30 이므로 30cm가 남아요.", "1 m 20 cm = 120 cm, 150 - 120 = 30 nên còn 30 cm."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  // L5 patterns
  u.num(5, "a", 3, ["reasoning"], j(T(`규칙을 찾아 □에 알맞은 수를 쓰세요: ${tex("3, 7, 11, 15, \\square")}`, `Tìm quy luật rồi điền số vào ô trống: ${tex("3, 7, 11, 15, \\square")}`), ONE), 19,
    [T("이웃한 두 수의 차를 구해 보세요.", "Tính hiệu của hai số liền nhau."), T("매번 4씩 커져요.", "Mỗi lần tăng thêm 4.")],
    T("3, 7, 11, 15 는 4씩 커져요. 15 + 4 = 19 예요.", "3, 7, 11, 15 tăng thêm 4 mỗi lần. 15 + 4 = 19."));
  u.num(5, "b", 3, ["reasoning"], j(T(`규칙을 찾아 □에 알맞은 수를 쓰세요: ${tex("1, 2, 4, 7, 11, \\square")}`, `Tìm quy luật rồi điền số vào ô trống: ${tex("1, 2, 4, 7, 11, \\square")}`), ONE), 16,
    [T("이웃한 수의 차가 일정한지 살펴보세요.", "Xem hiệu của các số liền nhau có giống nhau không."), T("차가 1, 2, 3, 4 로 하나씩 커져요.", "Hiệu là 1, 2, 3, 4, tăng dần từng đơn vị.")],
    T("더하는 수가 1, 2, 3, 4 로 커지므로 다음은 +5, 11 + 5 = 16 이에요.", "Số cộng thêm là 1, 2, 3, 4 nên tiếp theo là +5, 11 + 5 = 16."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

export function upliftE12(b, h) { upliftE1(b, h); upliftE2(b, h); }

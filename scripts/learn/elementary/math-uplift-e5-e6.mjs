import { T, tex, makeUplift } from "./math-uplift-kit.mjs";
import { gcd } from "./lib.mjs";

const ONE = T("(숫자만 쓰세요)", "(chỉ nhập số)");
const FRAC = T("(3/4 처럼 분수로 써도 돼요)", "(có thể nhập dạng phân số, ví dụ 3/4)");
const j = (...p) => T(p.map((x) => x.ko).join(" "), p.map((x) => x.vi).join(" "));
const round = (x) => Number(x.toFixed(6));
const lcm = (a, c) => (a * c) / gcd(a, c);

/** Elementary 5: fraction word problems with a typical error, decimal place value from a known product, gcd / lcm in situations, scaling. */
export function upliftE5(b, h) {
  const u = makeUplift(b, h, "e5");

  // L1 fractions with different denominators
  u.num(1, "a", 3, ["multistep", "context"], j(T(`물통에 물이 ${tex("\\frac{1}{2}")}L 있었어요. ${tex("\\frac{1}{3}")}L를 마시고 ${tex("\\frac{3}{4}")}L를 더 부었어요. 지금 물은 몇 L일까요?`, `Bình có ${tex("\\frac{1}{2}")} L nước. Uống ${tex("\\frac{1}{3}")} L rồi đổ thêm ${tex("\\frac{3}{4}")} L. Bây giờ có bao nhiêu lít nước?`), FRAC), 11 / 12,
    [T("마신 양은 빼고 더 부은 양은 더해요. 12를 공통분모로 써 보세요.", "Lượng uống thì trừ, lượng đổ thêm thì cộng. Hãy dùng mẫu số chung 12."), T("1/2 = 6/12, 1/3 = 4/12, 3/4 = 9/12 예요.", "1/2 = 6/12, 1/3 = 4/12, 3/4 = 9/12.")],
    T("6/12 - 4/12 + 9/12 = 11/12 이에요. 11/12 L가 있어요.", "6/12 - 4/12 + 9/12 = 11/12. Có 11/12 L."), 1e-6);
  u.mc(1, "b", 3, ["reasoning"], T(`${tex("\\frac{2}{5}+\\frac{1}{3}")} 을 ${tex("\\frac{3}{8}")} 이라고 계산했어요. 올바른 값은 무엇일까요?`, `Một bạn tính ${tex("\\frac{2}{5}+\\frac{1}{3}")} bằng ${tex("\\frac{3}{8}")}. Giá trị đúng là bao nhiêu?`),
    [tex("\\frac{11}{15}"), tex("\\frac{3}{8}"), tex("\\frac{3}{15}"), tex("\\frac{2}{15}")], 0,
    [T("분모가 다른 분수는 먼저 통분해야 해요.", "Phân số khác mẫu số phải quy đồng trước."), T("5와 3의 공통분모는 15예요.", "Mẫu số chung của 5 và 3 là 15.")],
    T("2/5 = 6/15, 1/3 = 5/15 이므로 합은 11/15 예요. 분모끼리, 분자끼리 더하면 틀려요.", "2/5 = 6/15, 1/3 = 5/15 nên tổng là 11/15. Cộng tử với tử và mẫu với mẫu là sai."));
  u.ladder(1, [1, 2, 4], ["a", "b"], { 1: 1 });

  // L2 decimals
  u.num(2, "a", 2, ["multistep", "context"], j(T("철사 1m의 무게가 0.35kg이에요. 이 철사 4.2m의 무게는 몇 kg일까요?", "Mỗi mét dây thép nặng 0,35 kg. Dây thép dài 4,2 m nặng bao nhiêu kg?"), ONE), round(0.35 * 4.2),
    [T("(무게) = (1m의 무게) × (길이)", "Khối lượng = khối lượng 1 m × chiều dài."), T("35 × 42 를 먼저 구하고 소수점을 찍어요.", "Tính 35 × 42 trước rồi đặt dấu phẩy.")],
    T("35 × 42 = 1470 이고, 소수점 아래가 모두 3자리이므로 1.470 = 1.47kg 이에요.", "35 × 42 = 1470, có tất cả 3 chữ số sau dấu phẩy nên được 1,470 = 1,47 kg."), 1e-6);
  u.mc(2, "b", 3, ["reasoning"], T(`${tex("12 \\times 15 = 180")} 임을 이용하면 ${tex("1.2 \\times 1.5")} 의 값은 얼마일까요?`, `Biết ${tex("12 \\times 15 = 180")}, hãy suy ra giá trị của ${tex("1.2 \\times 1.5")}.`),
    [tex("18"), tex("0.18"), tex("1.8"), tex("0.018")], 2,
    [T("1.2는 12의 10분의 1, 1.5는 15의 10분의 1이에요.", "1,2 là một phần mười của 12, 1,5 là một phần mười của 15."), T("곱은 10분의 1을 두 번, 즉 100분의 1이 돼요.", "Tích bị giảm đi 10 lần hai lần, tức là giảm 100 lần.")],
    T("180의 100분의 1은 1.8 이에요. 소수점 아래 자리가 1 + 1 = 2자리예요.", "Một phần trăm của 180 là 1,8. Số chữ số thập phân là 1 + 1 = 2."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  // L3 factors and multiples
  u.num(3, "a", 3, ["multistep", "context"], j(T("사탕 24개와 초콜릿 36개를 남김없이 똑같이 나누어 가능한 한 많은 봉지를 만들려고 해요. 몇 봉지를 만들 수 있을까요?", "Có 24 viên kẹo và 36 viên sôcôla. Chia đều, không thừa, vào các túi sao cho được nhiều túi nhất. Làm được nhiều nhất bao nhiêu túi?"), ONE), gcd(24, 36),
    [T("봉지 수는 24와 36의 공약수여야 해요.", "Số túi phải là ước chung của 24 và 36."), T("가장 많은 봉지는 최대공약수예요.", "Nhiều túi nhất là ước chung lớn nhất.")],
    T("24와 36의 최대공약수는 12이므로 12봉지예요. 한 봉지에 사탕 2개, 초콜릿 3개가 들어가요.", "Ước chung lớn nhất của 24 và 36 là 12 nên được 12 túi, mỗi túi có 2 viên kẹo và 3 viên sôcôla."));
  u.num(3, "b", 3, ["multistep", "reasoning", "context"], j(T("A 버스는 12분마다, B 버스는 15분마다 출발해요. 두 버스가 오전 8시에 동시에 출발했다면, 다음에 다시 동시에 출발하는 것은 몇 분 뒤일까요?", "Xe buýt A cứ 12 phút xuất phát một lần, xe buýt B cứ 15 phút một lần. Hai xe cùng xuất phát lúc 8 giờ. Sau bao nhiêu phút hai xe lại cùng xuất phát?"), ONE), lcm(12, 15),
    [T("두 버스가 함께 출발하는 시간은 12의 배수이면서 15의 배수예요.", "Thời gian hai xe cùng xuất phát vừa là bội của 12 vừa là bội của 15."), T("가장 빠른 때는 최소공배수예요.", "Sớm nhất là bội chung nhỏ nhất.")],
    T("12와 15의 최소공배수는 60이에요. 60분 뒤에 다시 만나요.", "Bội chung nhỏ nhất của 12 và 15 là 60. Sau 60 phút hai xe lại gặp nhau."));
  u.ladder(3, [1, 2, 3], ["a", "b"]);

  // L4 area and volume
  u.num(4, "a", 2, ["multistep", "context"], j(T("가로 10cm, 세로 6cm인 직사각형 종이에서 한 변이 3cm인 정사각형을 오려 냈어요. 남은 종이의 넓이는 몇 cm²일까요?", "Từ tờ giấy hình chữ nhật dài 10 cm, rộng 6 cm, cắt bỏ một hình vuông cạnh 3 cm. Diện tích phần giấy còn lại là bao nhiêu cm²?"), ONE), 10 * 6 - 3 * 3,
    [T("전체 넓이에서 오려 낸 넓이를 빼요.", "Lấy diện tích cả tờ giấy trừ diện tích phần đã cắt."), T("정사각형의 넓이는 3 × 3 이에요.", "Diện tích hình vuông là 3 × 3.")],
    T("10 × 6 = 60, 3 × 3 = 9, 60 - 9 = 51. 남은 넓이는 51cm² 예요.", "10 × 6 = 60, 3 × 3 = 9, 60 - 9 = 51. Diện tích còn lại là 51 cm²."));
  u.num(4, "b", 3, ["reasoning"], j(T("직사각형의 가로와 세로를 각각 2배로 늘리면 넓이는 처음의 몇 배가 될까요?", "Nếu chiều dài và chiều rộng của hình chữ nhật đều gấp đôi thì diện tích gấp mấy lần ban đầu?"), ONE), 4,
    [T("가로 2cm, 세로 3cm인 직사각형으로 직접 계산해 보세요.", "Hãy thử với hình chữ nhật dài 2 cm, rộng 3 cm."), T("2배 늘린 직사각형은 4cm × 6cm 예요.", "Hình đã gấp đôi là 4 cm × 6 cm.")],
    T("처음 넓이 6, 늘린 넓이 4 × 6 = 24 이므로 4배예요. 가로 2배 × 세로 2배 = 4배예요.", "Diện tích ban đầu là 6, sau khi gấp đôi là 4 × 6 = 24 nên gấp 4 lần. Gấp 2 lần chiều dài và 2 lần chiều rộng là 2 × 2 = 4 lần."));
  u.ladder(4, [1, 2, 4], ["a", "b"]);

  // L5 ratio and rate
  u.num(5, "a", 3, ["multistep", "reasoning", "context"], j(T("농구 시합에서 A팀은 슛 25번 중 17번, B팀은 슛 20번 중 14번을 성공했어요. 성공률이 더 높은 팀의 성공률은 몇 %일까요?", "Trong trận bóng rổ, đội A ném 25 lần trúng 17 lần, đội B ném 20 lần trúng 14 lần. Tỉ lệ ném trúng của đội cao hơn là bao nhiêu phần trăm?"), ONE), Math.max((17 / 25) * 100, (14 / 20) * 100),
    [T("각 팀의 성공 횟수 ÷ 슛 횟수 로 비율을 구해요.", "Tính tỉ lệ của mỗi đội: số lần trúng ÷ số lần ném."), T("백분율은 비율에 100을 곱해요.", "Phần trăm là tỉ lệ nhân 100.")],
    T("A팀은 17 ÷ 25 = 0.68 → 68%, B팀은 14 ÷ 20 = 0.7 → 70% 예요. 성공률이 더 높은 B팀은 70% 예요.", "Đội A là 17 ÷ 25 = 0,68 → 68%, đội B là 14 ÷ 20 = 0,7 → 70%. Đội B cao hơn với 70%."), 1e-6);
  u.mc(5, "b", 3, ["reasoning", "context"], T("소금 20g을 물 80g에 녹여 소금물을 만들었어요. 소금물 전체 양에 대한 소금 양의 비율은?", "Hòa 20 g muối vào 80 g nước được nước muối. Tỉ lệ khối lượng muối so với toàn bộ nước muối là bao nhiêu?"),
    [tex("0.2"), tex("0.25"), tex("4"), tex("0.8")], 0,
    [T("기준량은 소금물 전체의 양이에요.", "Đại lượng gốc là toàn bộ khối lượng nước muối."), T("소금물의 양 = 소금 + 물 이에요.", "Khối lượng nước muối = muối + nước.")],
    T("소금물은 20 + 80 = 100g 이고 비율은 20 ÷ 100 = 0.2 예요. (0.25 는 물과 비교한 값이에요.)", "Nước muối nặng 20 + 80 = 100 g, tỉ lệ là 20 ÷ 100 = 0,2. (0,25 là so với lượng nước.)"));
  u.ladder(5, [1, 2, 4], ["a", "b"]);
}

/** Elementary 6: operations that do not behave the way you expect, ratio puzzles, percent traps, proportional scaling of area, statistics with an outlier. */
export function upliftE6(b, h) {
  const u = makeUplift(b, h, "e6");

  // L1 fraction / decimal multiplication and division
  u.num(1, "a", 3, ["multistep", "context"], j(T(`리본 ${tex("\\frac{3}{4}")}m 중 ${tex("\\frac{2}{3}")}를 꽃 만드는 데 썼어요. 남은 리본은 몇 m일까요?`, `Trong ${tex("\\frac{3}{4}")} m ruy băng, đã dùng ${tex("\\frac{2}{3}")} số đó để làm hoa. Còn lại bao nhiêu mét ruy băng?`), FRAC), 3 / 4 - (3 / 4) * (2 / 3),
    [T("쓴 양은 3/4 × 2/3 으로 구해요.", "Lượng đã dùng là 3/4 × 2/3."), T("전체에서 쓴 양을 빼요.", "Lấy toàn bộ trừ lượng đã dùng.")],
    T("3/4 × 2/3 = 1/2, 3/4 - 1/2 = 1/4 이에요. 1/4m가 남아요.", "3/4 × 2/3 = 1/2, 3/4 - 1/2 = 1/4. Còn lại 1/4 m."), 1e-6);
  u.mc(1, "b", 3, ["reasoning"], T("1보다 작은 수로 나누면 몫은 나누어지는 수와 비교해 어떻게 될까요?", "Khi chia một số cho một số nhỏ hơn 1 thì thương so với số bị chia thế nào?"),
    [T("더 커져요.", "Lớn hơn."), T("더 작아져요.", "Nhỏ hơn."), T("똑같아요.", "Bằng nhau."), T("알 수 없어요.", "Không thể biết.")], 0,
    [T("6 ÷ 0.5 처럼 직접 계산해 보세요.", "Hãy thử tính, ví dụ 6 ÷ 0,5."), T("0.5 안에 6이 몇 번 들어가는지 생각해 보세요.", "Hãy nghĩ xem 6 chứa bao nhiêu lần 0,5.")],
    T("예를 들어 6 ÷ 0.5 = 12 로 몫이 더 커져요. 나누는 수가 1보다 작으면 몫은 커져요.", "Ví dụ 6 ÷ 0,5 = 12, thương lớn hơn. Chia cho số nhỏ hơn 1 thì thương lớn hơn."));
  u.ladder(1, [1, 2, 4], ["a", "b"], { 1: 1 });

  // L2 ratio / proportion
  u.num(2, "a", 3, ["multistep", "context"], j(T("가로와 세로의 비가 5 : 3 이고 둘레가 48cm인 직사각형이 있어요. 가로는 몇 cm일까요?", "Hình chữ nhật có tỉ số chiều dài và chiều rộng là 5 : 3, chu vi 48 cm. Chiều dài là bao nhiêu cm?"), ONE), (48 / 2) * (5 / 8),
    [T("(가로 + 세로) = 둘레의 반이에요.", "Chiều dài + chiều rộng bằng nửa chu vi."), T("그 합을 5 : 3 으로 나누어요.", "Chia tổng đó theo tỉ số 5 : 3.")],
    T("가로 + 세로 = 24cm 이고, 가로는 24 × 5/8 = 15cm 예요.", "Dài + rộng = 24 cm, chiều dài là 24 × 5/8 = 15 cm."));
  u.num(2, "b", 3, ["reasoning"], j(T("A와 B의 비가 2 : 3 이고 A는 B보다 8 작아요. A는 얼마일까요?", "Tỉ số của A và B là 2 : 3, và A nhỏ hơn B là 8. A bằng bao nhiêu?"), ONE), 8 * 2,
    [T("비의 차 3 - 2 = 1 이 실제로는 8이에요.", "Hiệu của tỉ số 3 - 2 = 1 tương ứng với 8."), T("그러면 비의 1은 8이에요.", "Vậy một phần của tỉ số là 8.")],
    T("비의 1이 8이므로 A = 8 × 2 = 16, B = 8 × 3 = 24 예요.", "Một phần là 8 nên A = 8 × 2 = 16, B = 8 × 3 = 24."));
  u.ladder(2, [1, 2, 3], ["a", "b"]);

  // L3 percent
  u.num(3, "a", 2, ["multistep", "context"], j(T("정가 8000원인 물건을 25% 할인한 가격에서 500원 할인 쿠폰을 한 번 더 썼어요. 내야 하는 돈은 얼마일까요?", "Món hàng giá 8000 đồng được giảm 25%, sau đó dùng thêm phiếu giảm 500 đồng. Phải trả bao nhiêu tiền?"), ONE), 8000 * 0.75 - 500,
    [T("먼저 25% 할인한 가격을 구해요.", "Trước tiên tính giá sau khi giảm 25%."), T("그 가격에서 쿠폰 500원을 빼요.", "Rồi trừ phiếu giảm 500 đồng khỏi giá đó.")],
    T("8000의 75%는 6000원, 6000 - 500 = 5500원이에요.", "75% của 8000 là 6000 đồng, 6000 - 500 = 5500 đồng."));
  u.mc(3, "b", 3, ["reasoning"], T("어떤 물건의 가격이 20% 올랐다가 다시 20% 내렸어요. 처음 가격과 비교하면?", "Giá một món hàng tăng 20% rồi lại giảm 20%. So với giá ban đầu thì thế nào?"),
    [T("처음과 같아요.", "Bằng giá ban đầu."), T("4% 싸요.", "Rẻ hơn 4%."), T("4% 비싸요.", "Đắt hơn 4%."), T("20% 싸요.", "Rẻ hơn 20%.")], 1,
    [T("처음 가격을 100원이라고 놓고 계산해 보세요.", "Giả sử giá ban đầu là 100 đồng rồi tính."), T("내릴 때의 기준은 올린 뒤의 가격이에요.", "Khi giảm, cơ sở là giá sau khi tăng.")],
    T("100원 → 120원 → 120의 80% = 96원이에요. 처음보다 4% 싸요.", "100 đồng → 120 đồng → 80% của 120 là 96 đồng. Rẻ hơn ban đầu 4%."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  // L4 circles and solids
  u.num(4, "a", 3, ["multistep", "context"], j(T("한 변이 20cm인 정사각형 상자 바닥에 지름이 20cm인 원 모양 피자를 넣었어요. 피자를 넣고 남는 바닥의 넓이는 몇 cm²일까요? (원주율은 3.14)", "Đặt chiếc bánh pizza hình tròn đường kính 20 cm vào đáy hộp hình vuông cạnh 20 cm. Phần diện tích đáy hộp còn trống là bao nhiêu cm²? (lấy π = 3,14)"), ONE), 20 * 20 - 3.14 * 10 * 10,
    [T("상자 바닥은 정사각형, 피자는 반지름이 10cm인 원이에요.", "Đáy hộp là hình vuông, bánh pizza là hình tròn bán kính 10 cm."), T("정사각형의 넓이에서 원의 넓이를 빼요.", "Lấy diện tích hình vuông trừ diện tích hình tròn.")],
    T("20 × 20 = 400, 3.14 × 10 × 10 = 314, 400 - 314 = 86. 86cm² 예요.", "20 × 20 = 400, 3,14 × 10 × 10 = 314, 400 - 314 = 86. Diện tích trống là 86 cm²."), 1e-6);
  u.mc(4, "b", 3, ["reasoning"], T("원의 반지름을 2배로 늘리면 원의 넓이는 처음의 몇 배가 될까요?", "Nếu bán kính hình tròn gấp đôi thì diện tích hình tròn gấp mấy lần ban đầu?"),
    [T("2배", "2 lần"), T("4배", "4 lần"), T("6배", "6 lần"), T("8배", "8 lần")], 1,
    [T("넓이는 (반지름) × (반지름) × 3.14 예요.", "Diện tích = bán kính × bán kính × 3,14."), T("반지름이 두 번 곱해지는 점을 생각해 보세요.", "Hãy chú ý bán kính được nhân hai lần.")],
    T("반지름이 2배면 (2 × 2) = 4배가 되어 넓이는 4배예요.", "Bán kính gấp 2 thì diện tích gấp 2 × 2 = 4 lần."));
  u.ladder(4, [1, 2, 3], ["a", "b"]);

  // L5 statistics
  const SCORES = [60, 70, 70, 80, 170];
  const mean = SCORES.reduce((a, c) => a + c, 0) / SCORES.length;
  u.num(5, "a", 2, ["multistep", "reasoning"], j(T("다섯 학생의 점수가 60, 70, 70, 80, 170점이에요. 평균과 중앙값의 차는 몇 점일까요?", "Điểm của năm bạn là 60, 70, 70, 80, 170. Hiệu giữa số trung bình và trung vị là bao nhiêu điểm?"), ONE), mean - 70,
    [T("평균은 모두 더해서 5로 나눠요. 중앙값은 크기순으로 가운데 값이에요.", "Trung bình là tổng chia 5. Trung vị là số ở giữa khi xếp theo thứ tự."), T("170점이 평균을 크게 끌어올려요.", "Điểm 170 kéo trung bình lên rất nhiều.")],
    T("평균은 450 ÷ 5 = 90점, 중앙값은 70점이에요. 차는 20점이에요. 매우 큰 값이 있으면 평균이 커져요.", "Trung bình là 450 ÷ 5 = 90, trung vị là 70. Hiệu là 20 điểm. Có giá trị rất lớn thì trung bình bị kéo lên."));
  u.num(5, "b", 3, ["multistep", "reasoning"], j(T("4명의 평균 점수가 70점이에요. 한 명이 더 들어와 5명의 평균이 72점이 되었어요. 새로 들어온 학생의 점수는 몇 점일까요?", "Điểm trung bình của 4 bạn là 70. Thêm một bạn nữa thì trung bình của 5 bạn là 72. Bạn mới được bao nhiêu điểm?"), ONE), 72 * 5 - 70 * 4,
    [T("평균 × 사람 수 = 점수의 합이에요.", "Trung bình × số người = tổng điểm."), T("5명의 합에서 처음 4명의 합을 빼요.", "Lấy tổng của 5 bạn trừ tổng của 4 bạn đầu.")],
    T("5명의 합은 72 × 5 = 360, 4명의 합은 70 × 4 = 280 이에요. 360 - 280 = 80점이에요.", "Tổng 5 bạn là 72 × 5 = 360, tổng 4 bạn là 70 × 4 = 280. 360 - 280 = 80 điểm."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

export function upliftE56(b, h) { upliftE5(b, h); upliftE6(b, h); }

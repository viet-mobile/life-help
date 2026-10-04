import { T, makeEnglishUplift } from "./english-uplift-kit.mjs";

const blank = (s) => T(`빈칸에 알맞은 말을 고르세요: ${s}`, `Chọn từ thích hợp cho chỗ trống: ${s}`);
const dialog = (s) => T(`대화의 빈칸에 알맞은 말을 고르세요. ${s}`, `Chọn từ thích hợp cho chỗ trống trong đoạn hội thoại. ${s}`);
const right = T("옳은 문장을 고르세요.", "Chọn câu đúng.");
const wrong = T("옳지 않은 문장을 고르세요.", "Chọn câu KHÔNG đúng.");

/** Elementary 3: pronoun reference, tense clues, daily-routine sequences and 2-4 sentence passages with a cause or a main idea. */
export function upliftEnglishE3(b) {
  const u = makeEnglishUplift(b, "e3");

  u.mc(1, "a", 3, ["grammar", "reasoning"], right, ["She play tennis.", "She plays tennis.", "She plays tennises.", "She is play tennis."], 1,
    [T("주어가 She(3인칭 단수)일 때 동사 모양을 생각해요.", "Hãy nghĩ về dạng động từ khi chủ ngữ là She (ngôi thứ ba số ít)."), T("동사 끝에 -s 를 붙여요. tennis 는 그대로 써요.", "Thêm -s vào động từ. Giữ nguyên tennis.")],
    T("She 다음의 동사에는 -s 를 붙여 She plays tennis. 가 맞아요.", "Sau She thêm -s vào động từ: She plays tennis. là đúng."));
  u.order(1, "b", 3, ["grammar", "multistep"], T("내 남동생은 매일 학교에 걸어가요.", "Em trai mình đi bộ đến trường mỗi ngày."), ["My", "brother", "walks", "to", "school", "every", "day"],
    [T("주어 다음에 동사, 그다음 장소와 시간 순서로 써요.", "Viết chủ ngữ, rồi động từ, rồi nơi chốn và thời gian."), T("My brother 다음에 walks 가 와요.", "Sau My brother là walks.")],
    T("My brother walks to school every day. 주어 → 동사 → 장소 → 때 순서예요.", "My brother walks to school every day. Thứ tự: chủ ngữ → động từ → nơi chốn → thời gian."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  u.mc(2, "a", 2, ["reading", "reasoning"], u.read("Tom and Mina are friends. They play soccer together. He is fast, and she is smart.", "Who is smart?"), ["Mina", "Tom", "Tom and Mina", "the teacher"], 0,
    [T("she 는 누구를 가리키는지 생각해요.", "Hãy nghĩ xem she chỉ ai."), T("Tom 은 남자, Mina 는 여자예요.", "Tom là nam, Mina là nữ.")],
    T("she(그녀)는 여자인 Mina 를 가리켜요. 그래서 똑똑한 사람은 Mina 예요.", "she chỉ Mina (nữ) nên người thông minh là Mina."));
  u.mc(2, "b", 3, ["reading", "reasoning"], u.read("The dog is under the table. It is sleeping.", 'What does "It" mean?'), ["the dog", "the table", "Mina", "the floor"], 0,
    [T("It 은 앞 문장의 무엇을 가리키는지 찾아요.", "Hãy tìm xem It chỉ cái gì ở câu trước."), T("잠을 자는 것은 사람이나 동물이에요.", "Chỉ người hoặc con vật mới ngủ.")],
    T("잠을 자고 있는 것은 the dog 이므로 It 은 the dog 를 가리켜요.", "Con đang ngủ là the dog nên It chỉ the dog."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  u.mc(3, "a", 3, ["grammar", "reasoning"], wrong, ["Yesterday I went to the park.", "Every day I walk to school.", "Last night she watch TV.", "We visited the zoo."], 2,
    [T("Last night 은 과거를 나타내는 말이에요.", "Last night chỉ thời gian trong quá khứ."), T("과거를 나타내는 말이 있으면 동사도 과거형이어야 해요.", "Có từ chỉ quá khứ thì động từ cũng phải ở dạng quá khứ.")],
    T("Last night 이 있으므로 watch 가 아니라 watched 를 써야 해요.", "Có Last night nên phải dùng watched chứ không phải watch."));
  u.mc(3, "b", 3, ["grammar", "context"], dialog("A: What did you do yesterday? B: I ____ my grandmother."), ["visited", "visit", "will visit", "visiting"], 0,
    [T("A 가 yesterday(어제)에 한 일을 물었어요.", "A hỏi về việc đã làm hôm qua (yesterday)."), T("과거의 일이니 동사의 과거형을 골라요.", "Đó là việc đã xảy ra nên chọn dạng quá khứ.")],
    T("어제 한 일이므로 과거형 visited 를 써요.", "Việc xảy ra hôm qua nên dùng dạng quá khứ visited."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  u.mc(4, "a", 2, ["reading", "reasoning", "multistep"], u.read("Jin gets up at seven. He eats breakfast at seven thirty. He goes to school at eight.", "What does Jin do right after breakfast?"), ["He gets up.", "He goes to school.", "He goes to bed.", "He eats lunch."], 1,
    [T("시간 순서대로 일을 정리해 보세요.", "Hãy sắp xếp các việc theo thứ tự thời gian."), T("7:30 다음 시각은 8:00 이에요.", "Sau 7:30 là 8:00.")],
    T("7시 기상 → 7시 30분 아침 식사 → 8시 학교 가기 순서예요.", "Thứ tự: 7 giờ thức dậy → 7:30 ăn sáng → 8 giờ đi học."));
  u.mc(4, "b", 3, ["context", "numbers", "multistep", "reasoning"], u.read("Mina goes to bed at ten. She gets up at six.", "How many hours does she sleep?"), ["six", "eight", "ten", "four"], 1,
    [T("10시부터 다음 날 6시까지의 시간을 구해요.", "Tính thời gian từ 10 giờ đến 6 giờ sáng hôm sau."), T("10시에서 12시까지 2시간, 12시에서 6시까지 6시간이에요.", "Từ 10 đến 12 giờ là 2 giờ, từ 12 đến 6 giờ là 6 giờ.")],
    T("2시간 + 6시간 = 8시간이므로 eight 예요.", "2 giờ + 6 giờ = 8 giờ nên là eight."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  const P = "Mina has a new bike. She rides it to school every day. Today it is raining, so she walks.";
  u.mc(5, "a", 3, ["reading", "reasoning"], u.read(P, "Why does Mina walk today?"), ["Her bike is old.", "It is raining.", "She is late.", "School is far."], 1,
    [T("so 앞의 문장이 이유예요.", "Câu đứng trước so là lý do."), T("Today it is raining 에 답이 있어요.", "Đáp án nằm ở câu Today it is raining.")],
    T("비가 와서(it is raining) 걸어가요. so 는 '그래서'라는 뜻이에요.", "Vì trời mưa (it is raining) nên đi bộ. so nghĩa là \"vì vậy\"."));
  u.mc(5, "b", 3, ["reading", "reasoning"], u.read(P, "What is the passage mainly about?"), ["Mina's bike and her way to school", "A rainy day at the zoo", "Mina's birthday party", "A new teacher"], 0,
    [T("글 전체에서 가장 많이 나오는 내용을 찾아요.", "Hãy tìm nội dung xuất hiện nhiều nhất trong cả đoạn."), T("bike, school 이 여러 번 나와요.", "bike và school xuất hiện nhiều lần.")],
    T("자전거와 등굣길에 대한 글이므로 첫 번째 보기가 맞아요.", "Đoạn văn nói về chiếc xe đạp và đường đến trường nên đáp án đầu là đúng."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

/** Elementary 4: two tenses in one sentence, negatives and questions with do / does, opposites, location chains, a cause-and-order passage. */
export function upliftEnglishE4(b) {
  const u = makeEnglishUplift(b, "e4");

  u.mc(1, "a", 3, ["grammar", "context", "multistep"], blank("Last Sunday, Mina ____ to the library. Next Sunday, she ____ to the museum."), ["went / will go", "goes / went", "will go / went", "went / went"], 0,
    [T("Last Sunday 는 과거, Next Sunday 는 미래예요.", "Last Sunday là quá khứ, Next Sunday là tương lai."), T("빈칸마다 시제가 달라요.", "Mỗi chỗ trống có một thì khác nhau.")],
    T("지난 일요일은 과거(went), 다음 일요일은 미래(will go)예요.", "Chủ nhật tuần trước là quá khứ (went), Chủ nhật tuần sau là tương lai (will go)."));
  u.mc(1, "b", 3, ["grammar", "reasoning"], T("시제가 다른 문장 하나를 고르세요.", "Chọn câu có thì khác với các câu còn lại."), ["I visited my aunt.", "She cooked dinner.", "They played soccer.", "He plays the piano."], 3,
    [T("동사의 모양(-ed)을 살펴보세요.", "Hãy xem dạng của động từ (-ed)."), T("세 문장은 과거예요.", "Ba câu còn lại ở quá khứ.")],
    T("visited, cooked, played 는 과거형이고 plays 는 현재형이에요.", "visited, cooked, played ở quá khứ còn plays ở hiện tại."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  u.mc(2, "a", 2, ["grammar", "reasoning"], right, ["She doesn't likes pizza.", "She doesn't like pizza.", "She don't like pizza.", "She not like pizza."], 1,
    [T("She 의 부정문은 doesn't 를 써요.", "Câu phủ định với She dùng doesn't."), T("doesn't 다음의 동사는 -s 가 없는 원형이에요.", "Động từ sau doesn't ở dạng nguyên mẫu, không có -s.")],
    T("doesn't 가 이미 3인칭을 나타내므로 동사는 원형 like 예요.", "doesn't đã thể hiện ngôi thứ ba nên động từ ở dạng nguyên mẫu like."));
  u.mc(2, "b", 3, ["grammar", "context"], dialog("A: ____ he play the guitar? B: Yes, he does."), ["Does", "Do", "Is", "Are"], 0,
    [T("B 의 대답 does 를 힌트로 삼아요.", "Hãy dùng câu trả lời does của B làm gợi ý."), T("he 가 주어이면 Does 로 물어요.", "Chủ ngữ he thì hỏi bằng Does.")],
    T("대답이 Yes, he does. 이므로 질문은 Does he play ...? 예요.", "Câu trả lời là Yes, he does. nên câu hỏi là Does he play ...?"));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  u.mc(3, "a", 3, ["vocab", "context"], blank("The elephant is big, but the mouse is ____ ."), ["small", "tall", "long", "fast"], 0,
    [T("but 은 앞과 반대되는 내용을 이어 줘요.", "but nối hai ý trái ngược nhau."), T("big 의 반대말을 떠올려 보세요.", "Hãy nhớ từ trái nghĩa với big.")],
    T("but 다음에는 big 의 반대인 small 이 와요.", "Sau but là từ trái nghĩa với big, tức small."));
  u.mc(3, "b", 3, ["vocab", "reasoning"], T("반대말 짝이 올바르지 않은 것은?", "Cặp từ trái nghĩa nào KHÔNG đúng?"), ["hot - cold", "big - small", "fast - slow", "happy - tall"], 3,
    [T("두 낱말의 뜻이 정말 반대인지 하나씩 확인해요.", "Hãy kiểm tra từng cặp xem nghĩa có thật sự trái ngược không."), T("happy 의 반대말은 sad 예요.", "Từ trái nghĩa của happy là sad.")],
    T("happy(행복한)와 tall(키가 큰)은 반대말이 아니에요.", "happy (vui) và tall (cao) không phải cặp từ trái nghĩa."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  u.mc(4, "a", 2, ["reading", "reasoning", "multistep"], u.read("The ball is in the box. The box is under the bed.", "Where is the ball?"), ["under the bed", "on the bed", "behind the bed", "in front of the bed"], 0,
    [T("공이 어디에 있는지, 그 상자는 어디에 있는지 차례로 찾아요.", "Hãy tìm quả bóng ở đâu, rồi chiếc hộp ở đâu."), T("공은 상자 안에, 상자는 침대 아래에 있어요.", "Bóng ở trong hộp, hộp ở dưới giường.")],
    T("공은 상자 안에 있고 상자는 침대 아래에 있으므로 공도 침대 아래에 있어요.", "Bóng ở trong hộp và hộp ở dưới giường nên bóng cũng ở dưới giường."));
  u.mc(4, "b", 3, ["reading", "reasoning"], u.read("The book is on the desk. The pen is under the desk.", "Which sentence is true?"), ["The pen is on the desk.", "The book is under the desk.", "The pen is under the desk.", "The book is in the desk."], 2,
    [T("on 과 under 의 뜻을 구별해요.", "Hãy phân biệt nghĩa của on và under."), T("글에서 pen 의 위치를 찾아보세요.", "Hãy tìm vị trí của pen trong đoạn văn.")],
    T("글에서 The pen is under the desk. 라고 했어요.", "Đoạn văn nói The pen is under the desk."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  const P = "Tom is hungry. He opens the refrigerator, but it is empty. So he goes to the store and buys bread and milk.";
  u.mc(5, "a", 3, ["reading", "reasoning"], u.read(P, "Why does Tom go to the store?"), ["The refrigerator is empty.", "He wants to play.", "He is tired.", "It is Sunday."], 0,
    [T("but 과 So 사이의 내용에 이유가 있어요.", "Lý do nằm ở phần giữa but và So."), T("냉장고가 어땠는지 살펴보세요.", "Hãy xem tủ lạnh như thế nào.")],
    T("냉장고가 비어 있어서(empty) 가게에 가요. So 는 '그래서'라는 뜻이에요.", "Tủ lạnh trống (empty) nên đi cửa hàng. So nghĩa là \"vì vậy\"."));
  u.mc(5, "b", 3, ["reading", "reasoning", "multistep"], u.read(P, "Which happened first?"), ["He opened the refrigerator.", "He bought bread and milk.", "He went to the store.", "He ate some bread."], 0,
    [T("일이 일어난 순서대로 정리해 보세요.", "Hãy sắp xếp các việc theo thứ tự xảy ra."), T("Tom 은 먼저 배가 고팠어요.", "Trước hết Tom thấy đói.")],
    T("배가 고파서 냉장고를 열고(opens), 비어 있어서 가게에 가고, 빵과 우유를 샀어요.", "Đói nên mở tủ lạnh, tủ trống nên đi cửa hàng, rồi mua bánh mì và sữa."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

export function upliftEnglishE34(b) { upliftEnglishE3(b); upliftEnglishE4(b); }

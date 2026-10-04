import { T, makeEnglishUplift } from "./english-uplift-kit.mjs";

const blank = (s) => T(`빈칸에 알맞은 말을 고르세요: ${s}`, `Chọn từ thích hợp cho chỗ trống: ${s}`);
const dialog = (s) => T(`대화의 빈칸에 알맞은 말을 고르세요. ${s}`, `Chọn từ thích hợp cho chỗ trống trong đoạn hội thoại. ${s}`);
const right = T("옳은 문장을 고르세요.", "Chọn câu đúng.");
const wrong = T("옳지 않은 문장을 고르세요.", "Chọn câu KHÔNG đúng.");

/** Elementary 5: grammar errors that look right, comparisons from data, plans vs predictions, transformations and a passage with a small calculation. */
export function upliftEnglishE5(b) {
  const u = makeEnglishUplift(b, "e5");

  u.mc(1, "a", 3, ["grammar", "reasoning"], wrong, ["There are two apples.", "There is a pen on the desk.", "There is three books on the shelf.", "I have an umbrella."], 2,
    [T("There is / are 는 뒤에 오는 명사의 수에 맞춰요.", "There is / are phụ thuộc vào số lượng của danh từ phía sau."), T("three books 는 복수예요.", "three books là số nhiều.")],
    T("복수인 three books 앞에는 are 를 써서 There are three books ... 가 맞아요.", "Trước three books (số nhiều) dùng are: There are three books ... mới đúng."));
  u.mc(1, "b", 3, ["grammar", "context"], dialog("A: ____ any milk in the fridge? B: Yes, there is."), ["Is there", "Are there", "Is it", "Do there"], 0,
    [T("B 의 대답 there is 를 힌트로 삼아요.", "Hãy dùng câu trả lời there is của B làm gợi ý."), T("milk 는 셀 수 없는 명사예요.", "milk là danh từ không đếm được.")],
    T("milk 는 셀 수 없는 명사이므로 Is there any milk ...? 라고 물어요.", "milk là danh từ không đếm được nên hỏi Is there any milk ...?"));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  u.mc(2, "a", 2, ["reading", "reasoning", "multistep"], u.read("Tom is 150 cm tall. Ben is 145 cm tall. Mina is 155 cm tall.", "Who is the tallest?"), ["Tom", "Ben", "Mina", "Tom and Ben"], 2,
    [T("세 사람의 키를 비교해 보세요.", "Hãy so sánh chiều cao của ba bạn."), T("the tallest 는 가장 큰 사람이에요.", "the tallest là người cao nhất.")],
    T("155cm 가 가장 크므로 the tallest 는 Mina 예요.", "155 cm là cao nhất nên the tallest là Mina."));
  u.mc(2, "b", 3, ["grammar", "reasoning"], right, ["This box is more heavy than that one.", "This box is heavier than that one.", "This box is heavyer than that one.", "This box is the heavier than that one."], 1,
    [T("짧은 형용사는 -er 을 붙여요. y 로 끝나면 y 를 i 로 바꿔요.", "Tính từ ngắn thêm -er. Nếu tận cùng là y thì đổi y thành i."), T("than 이 있는 문장에는 the 를 붙이지 않아요.", "Câu có than thì không dùng the.")],
    T("heavy → heavier (y 를 i 로 바꾸고 -er) 이므로 heavier than 이 맞아요.", "heavy → heavier (đổi y thành i rồi thêm -er) nên heavier than là đúng."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  u.mc(3, "a", 2, ["grammar", "context"], dialog("A: What are you going to do this weekend? B: I ____ visit my grandparents."), ["am going to", "going to", "will to", "am go to"], 0,
    [T("be going to 에는 be 동사가 꼭 필요해요.", "be going to cần có động từ be."), T("주어가 I 이면 am 을 써요.", "Chủ ngữ là I thì dùng am.")],
    T("I am going to visit ... 처럼 am + going to + 동사원형으로 써요.", "Viết theo mẫu I am going to visit ... gồm am + going to + động từ nguyên mẫu."));
  u.mc(3, "b", 3, ["grammar", "reasoning", "context"], blank("Look at the dark clouds. It ____ soon."), ["is going to rain", "rained", "rains", "was raining"], 0,
    [T("검은 구름은 곧 일어날 일의 증거예요.", "Mây đen là dấu hiệu cho việc sắp xảy ra."), T("눈에 보이는 증거로 가까운 미래를 말할 때 be going to 를 써요.", "Dùng be going to khi nói về tương lai gần dựa trên dấu hiệu nhìn thấy.")],
    T("검은 구름이 보이니 곧 비가 올 거예요. It is going to rain soon.", "Thấy mây đen nên sắp mưa. It is going to rain soon."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  u.write(4, "a", 3, ["grammar", "reasoning"], T("다음 문장을 부정문으로 바꿔 쓰세요. He plays soccer. (does not 을 사용해 쓰세요)", "Hãy viết lại câu sau thành câu phủ định. He plays soccer. (hãy dùng does not)"),
    ["He does not play soccer.", "He doesn't play soccer."],
    [T("일반동사의 부정문은 does not(doesn't) 를 써요.", "Câu phủ định của động từ thường dùng does not (doesn't)."), T("does not 다음의 동사는 원형이에요.", "Động từ sau does not ở dạng nguyên mẫu.")],
    T("He doesn't play soccer. 처럼 doesn't 다음에 plays 가 아니라 play 를 써요.", "Viết He doesn't play soccer. — sau doesn't dùng play chứ không phải plays."));
  u.mc(4, "b", 3, ["grammar", "reasoning"], T("의문문으로 바꾼 문장이 올바르지 않은 것은?", "Câu chuyển sang câu hỏi nào KHÔNG đúng?"),
    ["You like tea. → Do you like tea?", "She is tall. → Is she tall?", "He plays soccer. → Does he play soccer?", "They run. → Are they run?"], 3,
    [T("be 동사 문장과 일반동사 문장은 의문문을 만드는 방법이 달라요.", "Câu có động từ be và câu có động từ thường tạo câu hỏi khác nhau."), T("run 은 일반동사예요.", "run là động từ thường.")],
    T("They run. 은 일반동사 문장이므로 Do they run? 이 맞아요.", "They run. có động từ thường nên câu hỏi đúng là Do they run?"));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  const P = "Mina wants to buy a gift for her mother. She has 10,000 won. A scarf costs 8,000 won and a hat costs 12,000 won. She buys the scarf.";
  u.mc(5, "a", 3, ["reading", "multistep", "numbers"], u.read(P, "How much money does Mina have left?"), ["2,000 won", "1,000 won", "3,000 won", "8,000 won"], 0,
    [T("가지고 있던 돈에서 산 물건의 값을 빼요.", "Lấy số tiền đang có trừ giá món đồ đã mua."), T("어떤 물건을 샀는지 먼저 찾아요.", "Hãy tìm xem bạn ấy đã mua món đồ nào.")],
    T("스카프를 샀으니 10,000 - 8,000 = 2,000원이 남아요.", "Mua khăn quàng cổ nên còn 10.000 - 8.000 = 2.000 won."));
  u.mc(5, "b", 3, ["reading", "reasoning"], u.read(P, "Why can't Mina buy the hat?"), ["It costs more than she has.", "It is too small.", "She doesn't like it.", "The store is closed."], 0,
    [T("모자의 값과 미나가 가진 돈을 비교해요.", "Hãy so sánh giá chiếc mũ với số tiền Mina có."), T("12,000 과 10,000 중 어느 쪽이 더 클까요?", "12.000 và 10.000, số nào lớn hơn?")],
    T("모자는 12,000원이고 미나는 10,000원이 있어서 살 수 없어요.", "Chiếc mũ giá 12.000 won mà Mina chỉ có 10.000 won nên không mua được."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

/** Elementary 6: tenses from context, modal verbs for rules and advice, meaning from context, connectives, and a passage with a lesson to infer. */
export function upliftEnglishE6(b) {
  const u = makeEnglishUplift(b, "e6");

  u.mc(1, "a", 3, ["grammar", "reasoning"], wrong, ["Look! It is raining now.", "Every day she goes to school.", "I watch TV last night.", "They will visit us tomorrow."], 2,
    [T("last night 은 시제를 알려 주는 말이에요.", "last night là từ cho biết thì của câu."), T("동사의 모양이 시간 표현과 어울리는지 확인해요.", "Hãy kiểm tra dạng động từ có hợp với từ chỉ thời gian không.")],
    T("last night 은 과거이므로 I watched TV last night. 이어야 해요.", "last night là quá khứ nên phải viết I watched TV last night."));
  u.mc(1, "b", 3, ["grammar", "context", "multistep"], dialog("A: What did you do last night? B: I ____ my homework. A: What are you doing now? B: I ____ a book."), ["did / am reading", "do / read", "did / read", "will do / reading"], 0,
    [T("첫 번째 질문은 어젯밤(과거), 두 번째 질문은 지금(현재진행)이에요.", "Câu hỏi đầu nói về tối qua (quá khứ), câu hỏi sau nói về bây giờ (hiện tại tiếp diễn)."), T("now 가 있으면 am / is / are + -ing 를 써요.", "Có now thì dùng am / is / are + -ing.")],
    T("어젯밤 한 일은 did, 지금 하는 일은 am reading 이에요.", "Việc làm tối qua dùng did, việc đang làm bây giờ dùng am reading."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  u.mc(2, "a", 2, ["grammar", "reasoning"], T("'~해야 한다'는 강한 의무를 나타내는 문장은?", "Câu nào thể hiện nghĩa vụ mạnh \"phải làm\"?"), ["You must wear a helmet.", "You may wear a helmet.", "You can wear a helmet.", "You will wear a helmet."], 0,
    [T("must 는 꼭 해야 하는 일에 써요.", "must dùng cho việc bắt buộc phải làm."), T("may 와 can 은 허락이나 가능을 나타내요.", "may và can chỉ sự cho phép hoặc khả năng.")],
    T("must 는 '꼭 ~해야 한다'는 뜻이에요.", "must nghĩa là \"nhất định phải\"."));
  u.mc(2, "b", 3, ["grammar", "context", "reasoning"], dialog("A: I have a headache. B: You ____ see a doctor."), ["should", "can't", "may not", "won't"], 0,
    [T("B 는 A 에게 조언을 하고 있어요.", "B đang khuyên A."), T("'~하는 게 좋겠다'는 뜻의 말을 골라요.", "Chọn từ có nghĩa \"nên\".")],
    T("조언을 할 때는 should(~하는 게 좋겠다)를 써요.", "Khi khuyên bảo dùng should (nên)."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  u.mc(3, "a", 3, ["vocab", "reading", "context", "reasoning"], u.read("It was a very tiny puppy. I could hold it in one hand.", 'What does "tiny" mean?'), ["very small", "very big", "very fast", "very old"], 0,
    [T("한 손으로 안을 수 있다는 말에서 크기를 짐작해 보세요.", "Từ chi tiết bế được bằng một tay hãy đoán kích cỡ."), T("크기가 아주 작을 때 쓰는 말이에요.", "Đây là từ dùng cho vật rất nhỏ.")],
    T("한 손에 들 수 있을 만큼 작다는 뜻이므로 tiny 는 very small 이에요.", "Bế được trong một tay nghĩa là rất nhỏ nên tiny là very small."));
  u.mc(3, "b", 3, ["vocab", "reasoning"], T("뜻이 다른 하나를 고르세요.", "Chọn từ có nghĩa khác với các từ còn lại."), ["happy", "glad", "joyful", "angry"], 3,
    [T("낱말 세 개는 기분이 좋다는 뜻이에요.", "Ba từ có nghĩa là cảm thấy vui."), T("angry 의 뜻을 떠올려 보세요.", "Hãy nhớ nghĩa của angry.")],
    T("happy, glad, joyful 은 '기쁜'이고 angry 는 '화난'이에요.", "happy, glad, joyful nghĩa là vui còn angry nghĩa là tức giận."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  u.mc(4, "a", 2, ["grammar", "context"], blank("I wanted to go out, ____ it was raining heavily."), ["but", "and", "so", "because"], 0,
    [T("앞뒤 내용이 서로 반대되는지 확인해요.", "Hãy xem hai vế có trái ngược nhau không."), T("나가고 싶었지만 비가 많이 왔어요.", "Muốn ra ngoài nhưng trời mưa to.")],
    T("앞뒤 내용이 반대이므로 '그러나'라는 뜻의 but 을 써요.", "Hai vế trái ngược nhau nên dùng but (nhưng)."));
  u.mc(4, "b", 3, ["grammar", "reasoning"], T("'It was cold. I wore a coat.' 두 문장을 알맞게 이은 것은?", "Câu nào nối đúng hai câu 'It was cold. I wore a coat.'?"),
    ["It was cold, so I wore a coat.", "It was cold, but I wore a coat.", "It was cold because I wore a coat.", "It was cold or I wore a coat."], 0,
    [T("춥다는 것은 코트를 입은 이유예요.", "Trời lạnh là lý do mặc áo khoác."), T("원인 다음에 결과를 이어 주는 말은 so 예요.", "Từ nối nguyên nhân với kết quả là so.")],
    T("추워서(원인) 코트를 입었어요(결과). 그래서 so 를 써요.", "Vì lạnh (nguyên nhân) nên mặc áo khoác (kết quả). Vì vậy dùng so."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  const P = "Last week, Jiho joined a school cooking club. At first, he burned the eggs and the kitchen smelled bad. But he did not give up. After two weeks of practice, he made a perfect omelet for his family.";
  u.mc(5, "a", 3, ["reading", "reasoning"], u.read(P, "What can we learn from the story?"), ["Practice can make us better.", "Cooking is easy.", "Eggs are expensive.", "Family dinners are boring."], 0,
    [T("처음과 끝에서 지호가 어떻게 달라졌는지 비교해 보세요.", "Hãy so sánh Jiho lúc đầu và lúc cuối."), T("But he did not give up. 이 중요한 문장이에요.", "Câu But he did not give up. rất quan trọng.")],
    T("처음에는 실패했지만 포기하지 않고 연습해서 성공했어요. 연습하면 나아질 수 있어요.", "Lúc đầu thất bại nhưng không bỏ cuộc và luyện tập nên thành công. Luyện tập giúp ta tiến bộ."));
  u.mc(5, "b", 3, ["reading", "vocab", "reasoning"], u.read(P, "Which word best describes Jiho?"), ["determined", "lazy", "angry", "shy"], 0,
    [T("지호가 실패한 뒤 어떻게 행동했는지 살펴보세요.", "Hãy xem Jiho hành động thế nào sau khi thất bại."), T("포기하지 않는 사람을 나타내는 낱말이에요.", "Đây là từ chỉ người không bỏ cuộc.")],
    T("포기하지 않고 연습했으므로 determined(의지가 굳은)가 가장 알맞아요.", "Jiho không bỏ cuộc và luyện tập nên determined (kiên quyết) là phù hợp nhất."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

export function upliftEnglishE56(b) { upliftEnglishE5(b); upliftEnglishE6(b); }

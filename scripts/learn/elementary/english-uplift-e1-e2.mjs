import { T, makeEnglishUplift } from "./english-uplift-kit.mjs";

const blank = (s) => T(`빈칸에 알맞은 말을 고르세요: ${s}`, `Chọn từ thích hợp cho chỗ trống: ${s}`);
const dialog = (s) => T(`대화의 빈칸에 알맞은 말을 고르세요. ${s}`, `Chọn câu thích hợp cho chỗ trống trong đoạn hội thoại. ${s}`);

/** Elementary 1: short sentences, but the answer has to come from the CONTEXT (a clue, a dialogue, a riddle), not from a picture. */
export function upliftEnglishE1(b) {
  const u = makeEnglishUplift(b, "e1");

  u.mc(1, "a", 3, ["phonics", "reasoning"], T("다음 중 첫소리가 다른 하나는?", "Từ nào có âm đầu khác với các từ còn lại?"), ["bag", "ball", "cat", "bed"], 2,
    [T("각 단어의 첫 글자를 소리 내어 읽어 보세요.", "Hãy đọc to chữ cái đầu của từng từ."), T("b로 시작하는 단어가 세 개예요.", "Có ba từ bắt đầu bằng b.")],
    T("bag, ball, bed 는 b로 시작하고 cat 은 c로 시작해요.", "bag, ball, bed bắt đầu bằng b còn cat bắt đầu bằng c."));
  u.mc(1, "b", 3, ["phonics", "reasoning", "multistep"], T("알파벳에서 B 바로 다음 글자로 시작하는 단어는?", "Từ nào bắt đầu bằng chữ cái đứng ngay sau B trong bảng chữ cái?"), ["dog", "cat", "bus", "egg"], 1,
    [T("A, B, C 순서로 읽어 보세요.", "Hãy đọc A, B, C theo thứ tự."), T("B 다음 글자는 C예요.", "Chữ cái sau B là C.")],
    T("B 다음은 C예요. c로 시작하는 단어는 cat 이에요. (bus 는 B로 시작해요.)", "Sau B là C. Từ bắt đầu bằng c là cat. (bus bắt đầu bằng B.)"));
  u.ladder(1, [1, 4, 5], ["a", "b"], { 5: 2 });

  u.mc(2, "a", 2, ["speaking", "context"], dialog("Tom: Thank you! Mina: ____"), ["You're welcome.", "Nice to meet you.", "Good night.", "I'm fine."], 0,
    [T("누군가 고맙다고 했을 때 하는 대답이에요.", "Đây là câu đáp lại khi ai đó cảm ơn bạn."), T("'천만에요'라는 뜻이에요.", "Nghĩa là \"không có gì\".")],
    T("Thank you. 에 대한 대답은 You're welcome. (천만에요) 이에요.", "Đáp lại Thank you. là You're welcome. (không có gì)."));
  u.mc(2, "b", 3, ["speaking", "reasoning"], T("'What's your name?'에 어울리지 않는 대답은?", "Câu nào KHÔNG phù hợp để trả lời cho 'What's your name?'"), ["I'm Mina.", "My name is Mina.", "I'm fine, thank you.", "Mina."], 2,
    [T("이름을 묻는 질문이에요. 이름으로 대답하지 않은 문장을 찾아요.", "Đây là câu hỏi về tên. Hãy tìm câu không nói tên."), T("I'm fine. 은 기분을 말하는 대답이에요.", "I'm fine. là câu trả lời nói về cảm giác.")],
    T("I'm fine, thank you. 는 'How are you?'에 대한 대답이에요.", "I'm fine, thank you. là câu trả lời cho 'How are you?'."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  u.mc(3, "a", 3, ["reading", "numbers", "multistep", "context"], u.read("I have two red apples and one green apple.", "How many apples do I have?"), ["two", "three", "one", "four"], 1,
    [T("빨간 사과와 초록 사과를 모두 세어요.", "Hãy đếm cả táo đỏ lẫn táo xanh."), T("2 + 1 을 계산해요.", "Hãy tính 2 + 1.")],
    T("빨간 사과 두 개와 초록 사과 한 개이므로 모두 세 개(three)예요.", "Hai quả táo đỏ và một quả táo xanh nên có tất cả ba quả (three)."));
  u.mc(3, "b", 3, ["reading", "colors", "reasoning"], u.read("Tom's bag is the color of the sky.", "What color is the bag?"), ["blue", "red", "green", "yellow"], 0,
    [T("하늘은 무슨 색일까요?", "Bầu trời có màu gì?"), T("맑은 날의 하늘을 떠올려 보세요.", "Hãy nghĩ đến bầu trời ngày nắng.")],
    T("하늘은 파란색이므로 가방은 blue(파랑)예요.", "Bầu trời màu xanh nên chiếc cặp màu blue (xanh dương)."));
  u.ladder(3, [1, 4, 5], ["a", "b"], { 5: 2 });

  u.mc(4, "a", 2, ["vocab", "reasoning", "multistep"], blank("Mina's mother's mother is her ____ ."), ["grandmother", "aunt", "sister", "grandfather"], 0,
    [T("엄마의 엄마는 누구일까요?", "Mẹ của mẹ là ai?"), T("할머니를 영어로 하면?", "Bà trong tiếng Anh là gì?")],
    T("엄마의 엄마는 할머니, 즉 grandmother 예요.", "Mẹ của mẹ là bà, tức là grandmother."));
  u.mc(4, "b", 3, ["grammar", "reasoning"], T("알맞은 문장을 고르세요.", "Chọn câu đúng."), ["He is my sister.", "She is my sister.", "She is my brother.", "He is my mother."], 1,
    [T("sister는 여자, brother는 남자예요.", "sister là nữ, brother là nam."), T("he는 남자, she는 여자를 가리켜요.", "he chỉ nam, she chỉ nữ.")],
    T("sister(언니·여동생)는 여자이므로 She is my sister. 가 맞아요.", "sister là nữ nên She is my sister. là đúng."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  u.mc(5, "a", 3, ["vocab", "reasoning", "context"], T('수수께끼를 풀어 보세요. "I write with it. It has a point. It is in my bag." 질문: What is it?', 'Hãy giải câu đố. "I write with it. It has a point. It is in my bag." Câu hỏi: What is it?'), ["pencil", "eraser", "desk", "ruler"], 0,
    [T("글씨를 쓰고, 끝이 뾰족한 물건이에요.", "Đây là vật dùng để viết và có đầu nhọn."), T("가방 안에 들어 있는 물건이에요.", "Vật này để trong cặp.")],
    T("쓸 수 있고 끝이 뾰족한 것은 pencil(연필)이에요.", "Vật dùng để viết và có đầu nhọn là pencil (bút chì)."));
  u.mc(5, "b", 3, ["speaking", "reasoning", "multistep"], T('선생님이 "Stand up and close the door."라고 말했어요. 미나가 가장 먼저 해야 할 일은?', 'Cô giáo nói "Stand up and close the door." Việc đầu tiên Mina phải làm là gì?'),
    [T("일어선다", "Đứng dậy"), T("문을 닫는다", "Đóng cửa"), T("앉는다", "Ngồi xuống"), T("책을 편다", "Mở sách")], 0,
    [T("and 앞의 말이 먼저 해야 할 일이에요.", "Việc đứng trước chữ and là việc làm trước."), T("stand up 의 뜻을 떠올려 보세요.", "Hãy nhớ nghĩa của stand up.")],
    T("Stand up(일어서세요)이 먼저, close the door(문을 닫으세요)가 그다음이에요.", "Stand up (đứng dậy) làm trước, close the door (đóng cửa) làm sau."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

/** Elementary 2: short sentences with a grammar trap or a clue chain; the answer is found from context, without a picture. */
export function upliftEnglishE2(b) {
  const u = makeEnglishUplift(b, "e2");

  u.mc(1, "a", 3, ["reading", "reasoning", "context"], u.read("I see a big animal. It has a long nose. It is gray.", "What is it?"), ["elephant", "mouse", "cat", "bird"], 0,
    [T("큰 동물이고 코가 길어요.", "Đây là con vật to có chiếc mũi dài."), T("회색이에요.", "Nó có màu xám.")],
    T("크고 코가 길고 회색인 동물은 elephant(코끼리)예요.", "Con vật to, mũi dài và màu xám là elephant (con voi)."));
  u.mc(1, "b", 3, ["reading", "reasoning", "multistep"], u.read('Mina has two pets. One says "woof". The other lives in water.', "Which pets does she have?"), ["a dog and a fish", "a cat and a bird", "a dog and a cat", "a fish and a bird"], 0,
    [T("woof 소리를 내는 동물이 무엇인지 먼저 찾아요.", "Trước tiên hãy tìm con vật kêu woof."), T("물에서 사는 동물은 무엇일까요?", "Con vật nào sống dưới nước?")],
    T("woof 는 개(dog), 물에서 사는 동물은 물고기(fish)예요.", "woof là tiếng chó (dog), con vật sống dưới nước là cá (fish)."));
  u.ladder(1, [1, 3, 4], ["a", "b"]);

  u.mc(2, "a", 2, ["vocab", "reasoning", "context"], blank("It is dark. Mina is tired. She will ____ in her bed."), ["sleep", "run", "swim", "jump"], 0,
    [T("어두운 밤에 피곤하면 침대에서 무엇을 할까요?", "Trời tối và mệt thì trên giường người ta làm gì?"), T("침대에서 할 수 있는 동작을 골라요.", "Chọn hành động có thể làm trên giường.")],
    T("어둡고 피곤하니 침대에서 sleep(잠자다)할 거예요.", "Trời tối và mệt nên cô ấy sẽ sleep (ngủ) trên giường."));
  u.mc(2, "b", 3, ["grammar", "reasoning"], T("옳은 문장을 고르세요.", "Chọn câu đúng."), ["I eats an apple.", "I eat an apple.", "I am eat an apple.", "I eating an apple."], 1,
    [T("I 다음에는 동사 원형이 와요.", "Sau I dùng động từ nguyên mẫu."), T("eats, am eat, eating 은 I 와 어울리지 않아요.", "eats, am eat, eating không hợp với I.")],
    T("I 다음에는 동사 원형을 써서 I eat an apple. 이 맞아요.", "Sau I dùng động từ nguyên mẫu nên I eat an apple. là đúng."));
  u.ladder(2, [1, 3, 4], ["a", "b"]);

  u.mc(3, "a", 3, ["grammar", "context"], dialog("Ben: What do you have? Mina: I ____ a red ball."), ["have", "has", "am", "like"], 0,
    [T("'가지고 있다'는 뜻의 말을 골라요.", "Chọn từ có nghĩa \"có\"."), T("주어가 I 일 때는 has 를 쓰지 않아요.", "Với chủ ngữ I không dùng has.")],
    T("I 다음에는 have 를 써서 I have a red ball. (나는 빨간 공이 있어요.)", "Sau I dùng have: I have a red ball. (Mình có một quả bóng đỏ.)"));
  u.tf(3, "b", 3, ["grammar", "reasoning"], T("'I have a dog.'은 '나는 개를 좋아해요.'라는 뜻이에요. 맞을까요?", "'I have a dog.' có nghĩa là 'Mình thích con chó.' Đúng hay sai?"), false,
    [T("have 의 뜻과 like 의 뜻을 구별해 보세요.", "Hãy phân biệt nghĩa của have và like."), T("have 는 '가지고 있다'예요.", "have nghĩa là \"có\".")],
    T("I have a dog. 은 '나는 개를 키워요(가지고 있어요).'예요. '좋아해요'는 I like dogs. 예요.", "I have a dog. nghĩa là 'Mình có một con chó.' Còn 'thích' là I like dogs."));
  u.ladder(3, [1, 3, 4], ["a", "b"]);

  u.mc(4, "a", 2, ["grammar", "context"], blank("Mina and Tom ____ my friends."), ["are", "is", "am", "be"], 0,
    [T("주어가 두 사람이에요. 복수예요.", "Chủ ngữ gồm hai người, là số nhiều."), T("복수 주어 다음에는 are 를 써요.", "Sau chủ ngữ số nhiều dùng are.")],
    T("Mina and Tom 은 두 사람이므로 are 를 써요.", "Mina and Tom là hai người nên dùng are."));
  u.mc(4, "b", 3, ["grammar", "reasoning"], T("옳지 않은 문장을 고르세요.", "Chọn câu KHÔNG đúng."), ["I am a girl.", "You are tall.", "He am happy.", "She is kind."], 2,
    [T("주어에 맞는 am / is / are 를 하나씩 확인해 보세요.", "Hãy kiểm tra từng câu xem am / is / are có hợp chủ ngữ không."), T("am 은 I 와만 써요.", "am chỉ dùng với I.")],
    T("He 다음에는 is 를 써야 해요. He is happy. 가 맞아요.", "Sau He phải dùng is. He is happy. mới đúng."));
  u.ladder(4, [1, 3, 4], ["a", "b"]);

  const P = "Sam has a dog. The dog is brown. It likes to run in the park.";
  u.mc(5, "a", 3, ["reading", "reasoning"], u.read(P, "Where does the dog like to run?"), ["in the park", "in the house", "at school", "at the zoo"], 0,
    [T("마지막 문장에 답이 있어요.", "Đáp án nằm ở câu cuối."), T("It 은 the dog 를 가리켜요.", "It chỉ the dog.")],
    T("It likes to run in the park. 라고 했으니 공원이에요.", "Đoạn văn nói It likes to run in the park. nên là ở công viên."));
  u.mc(5, "b", 3, ["reading", "reasoning", "multistep"], u.read(P, "Which sentence is true?"), ["Sam has a cat.", "The dog is white.", "The dog likes to run.", "Sam likes the zoo."], 2,
    [T("보기의 문장을 글과 하나씩 비교해 보세요.", "Hãy so sánh từng câu với đoạn văn."), T("글에 없는 내용은 답이 아니에요.", "Nội dung không có trong đoạn văn thì không phải đáp án.")],
    T("글에 It likes to run in the park. 가 있으므로 The dog likes to run. 이 맞아요.", "Đoạn văn có câu It likes to run in the park. nên The dog likes to run. là đúng."));
  u.ladder(5, [1, 3, 4], ["a", "b"]);
}

export function upliftEnglishE12(b) { upliftEnglishE1(b); upliftEnglishE2(b); }

import { T } from "./lib.mjs";
import { H, I, W, makeEnglish } from "./english-helpers.mjs";

/** Local shorthands built on the shared English builders. */
function kit(b, grade, S) {
  const E = makeEnglish(b, grade, S);
  /** 'dog'의 뜻은? -> options are meanings (localised) */
  const meaning = (sk, n, role, d, fam, w, others) => E.mc({
    sk, n, role, d, fam, prompt: I.meaning(w.en), items: [T(w.ko, w.vi), ...others.map((o) => T(o.ko, o.vi))], correct: 0, audio: w.en, tags: ["vocab"],
    hints: [H.sound, H.first(w.en)], expl: T(`${w.en} = ${w.ko}`, `${w.en} = ${w.vi}`),
  });
  /** '개'를 영어로 하면? -> options are English words (identical in every locale) */
  const toEn = (sk, n, role, d, fam, w, others) => E.mc({
    sk, n, role, d, fam, prompt: I.toEnglish(w), items: [w.en, ...others.map((o) => o.en)], correct: 0, tags: ["vocab"],
    hints: [H.letters(w.en), H.first(w.en)], expl: T(`${w.ko} = ${w.en}`, `${w.vi} = ${w.en}`),
  });
  const picture = (sk, n, role, d, fam, w) => E.write({
    sk, n, role, d, fam, prompt: I.picture(w), accepted: [w.en], audio: w.en, tags: ["vocab"],
    hints: [H.picture, H.first(w.en)], expl: T(`${w.e} = ${w.en} (${w.ko})`, `${w.e} = ${w.en} (${w.vi})`),
  });
  const blank = (sk, n, role, d, fam, sentence, w, accepted, expl) => E.write({
    sk, n, role, d, fam, type: "fill_blank", prompt: I.blank(sentence, w), accepted, tags: ["vocab"],
    hints: [T(`괄호 안의 뜻을 영어로 바꿔 보세요.`, `Hãy đổi nghĩa trong ngoặc sang tiếng Anh.`), H.first(accepted[0])], expl,
  });
  const choose = (sk, n, role, d, fam, sentence, items, correct, hints, expl) => E.mc({ sk, n, role, d, fam, prompt: I.chooseBlank(sentence), items, correct, hints, expl, tags: ["grammar"] });
  return { ...E, meaning, toEn, picture, blank, choose };
}
const lessonOf = (grade) => (n, sk, S, title, concept, example, core, challenge) => ({ id: `en-${grade}-l${n}`, title, concept, example, skills: [S[sk]], core, challenge });

/* ================================ Elementary 1 ================================ */
export function e1(b) {
  const S = { alpha: "e.e1.alpha", greet: "e.e1.greet", numcol: "e.e1.numcol", family: "e.e1.family", cls: "e.e1.class" };
  b.skill(S.alpha, T("알파벳과 첫소리", "Bảng chữ cái và âm đầu"));
  b.skill(S.greet, T("인사말", "Lời chào"), S.alpha);
  b.skill(S.numcol, T("숫자와 색깔", "Số đếm và màu sắc"), S.alpha);
  b.skill(S.family, T("가족", "Gia đình"), S.greet);
  b.skill(S.cls, T("교실 낱말", "Từ vựng trong lớp học"), S.family);
  const K = kit(b, "e1", S);
  const lesson = lessonOf("e1");
  const startsWith = (n, role, d, letter, word, others, fam) => K.mc({
    sk: "alpha", n, role, d, fam, prompt: T(`다음 중 ${letter}로 시작하는 단어는?`, `Từ nào bắt đầu bằng chữ ${letter}?`), items: [word.en, ...others], correct: 0, audio: word.en, tags: ["phonics"],
    hints: [H.sound, T(`${word.e ?? ""} 그림을 떠올려 보세요.`, `Hãy nhớ lại hình ${word.e ?? ""}.`)], expl: T(`${word.en} → ${letter}`, `${word.en} → ${letter}`),
  });
  const a1 = startsWith(1, "core", 1, "B", W("ball", "공", "quả bóng", "⚽"), ["cat", "dog", "egg"], "e1-start");
  const a2 = startsWith(2, "core", 1, "C", W("cat", "고양이", "con mèo", "🐱"), ["ball", "dog", "fish"], "e1-start");
  const a3 = startsWith(3, "core", 1, "D", W("dog", "개", "con chó", "🐶"), ["cat", "fish", "egg"], "e1-start");
  const a4 = startsWith(4, "core", 2, "F", W("fish", "물고기", "con cá", "🐟"), ["ball", "cat", "dog"], "e1-start");
  const a5 = K.write({ sk: "alpha", n: 5, d: 3, fam: "e1-first", prompt: T("egg는 어떤 알파벳으로 시작할까요? (알파벳 한 글자만 쓰세요)", "Từ egg bắt đầu bằng chữ cái nào? (chỉ nhập một chữ cái)"), accepted: ["e"], audio: "egg", tags: ["phonics"], hints: [H.sound, T("달걀 🥚 을 떠올려 보세요.", "Hãy nghĩ đến quả trứng 🥚.")], expl: T("egg → e", "egg → e") });
  startsWith("v1", "variant", 1, "A", W("apple", "사과", "quả táo", "🍎"), ["dog", "ball", "fish"], "e1-start");
  K.write({ sk: "alpha", n: "v2", role: "variant", d: 2, fam: "e1-first", prompt: T("sun은 어떤 알파벳으로 시작할까요? (알파벳 한 글자만 쓰세요)", "Từ sun bắt đầu bằng chữ cái nào? (chỉ nhập một chữ cái)"), accepted: ["s"], audio: "sun", tags: ["phonics"], hints: [H.sound, T("해 ☀️ 를 떠올려 보세요.", "Hãy nghĩ đến mặt trời ☀️.")], expl: T("sun → s", "sun → s") });
  startsWith("d1", "diagnostic", 1, "E", W("egg", "달걀", "quả trứng", "🥚"), ["ball", "cat", "dog"]);

  // ---- greetings ----
  const g1 = K.mc({ sk: "greet", n: 1, d: 1, fam: "e1-greet", prompt: T("아침에 만났을 때 하는 인사는?", "Lời chào khi gặp nhau vào buổi sáng là gì?"), items: ["Good morning.", "Good night.", "Goodbye.", "Thank you."], correct: 0, tags: ["speaking"], hints: [T("morning은 '아침'이에요.", "morning nghĩa là buổi sáng."), H.sound], expl: T("Good morning. = 좋은 아침이에요.", "Good morning. = Chào buổi sáng.") });
  const g2 = K.mc({ sk: "greet", n: 2, d: 1, fam: "e1-greet", prompt: T("헤어질 때 하는 인사는?", "Lời chào khi chia tay là gì?"), items: ["Hello.", "Goodbye.", "Sorry.", "Please."], correct: 1, tags: ["speaking"], hints: [T("bye는 '안녕(헤어질 때)'이에요.", "bye nghĩa là tạm biệt."), H.sound], expl: T("Goodbye. = 안녕히 가세요.", "Goodbye. = Tạm biệt.") });
  const g3 = K.blank("greet", 3, "core", 2, "e1-phrase", "Nice to ____ you.", W("meet", "만나다", "gặp"), ["meet"], T("Nice to meet you. = 만나서 반가워요.", "Nice to meet you. = Rất vui được gặp bạn."));
  const g4 = K.order({ sk: "greet", n: 4, d: 2, fam: "e1-phrase", meaning: T("내 이름은 미나예요.", "Tên mình là Mina."), words: ["My", "name", "is", "Mina"], tags: ["speaking"], hints: [T("문장은 'My'로 시작해요.", "Câu bắt đầu bằng 'My'."), T("My name is ... 이름을 소개하는 말이에요.", "My name is ... là câu giới thiệu tên.")], expl: T("My name is Mina. = 내 이름은 미나예요.", "My name is Mina. = Tên mình là Mina.") });
  const g5 = K.mc({ sk: "greet", n: 5, d: 3, fam: "e1-greet", prompt: T("'How are you?'에 알맞은 대답은?", "Câu trả lời phù hợp với 'How are you?' là gì?"), items: ["I'm fine, thank you.", "My name is Tom.", "Goodbye.", "It's a pen."], correct: 0, tags: ["speaking"], hints: [T("How are you?는 '잘 지내요?'라는 뜻이에요.", "How are you? nghĩa là Bạn khỏe không?"), T("안부를 묻는 말에는 기분으로 대답해요.", "Hỏi thăm sức khỏe thì trả lời về tình trạng của mình.")], expl: T("I'm fine, thank you. = 잘 지내요, 고마워요.", "I'm fine, thank you. = Mình khỏe, cảm ơn bạn.") });
  K.mc({ sk: "greet", n: "v1", role: "variant", d: 1, fam: "e1-greet", prompt: T("자기 전에 하는 인사는?", "Lời chào trước khi đi ngủ là gì?"), items: ["Good night.", "Good morning.", "Hello.", "Sorry."], correct: 0, tags: ["speaking"], hints: [T("night은 '밤'이에요.", "night nghĩa là ban đêm."), H.sound], expl: T("Good night. = 잘 자요.", "Good night. = Chúc ngủ ngon.") });
  K.order({ sk: "greet", n: "v2", role: "variant", d: 2, fam: "e1-phrase", meaning: T("나는 톰이에요.", "Mình là Tom."), words: ["I", "am", "Tom"], tags: ["speaking"], hints: [T("'I'로 시작해요.", "Câu bắt đầu bằng 'I'."), T("I am ... 은 '나는 ...이에요'예요.", "I am ... nghĩa là Mình là ...")], expl: T("I am Tom. = 나는 톰이에요.", "I am Tom. = Mình là Tom.") });
  K.meaning("greet", "d1", "diagnostic", 1, undefined, W("Hello", "안녕하세요", "xin chào"), [W("Goodbye", "안녕히 가세요", "tạm biệt"), W("Sorry", "미안해요", "xin lỗi"), W("Please", "제발·부탁해요", "làm ơn")]);
  K.meaning("greet", "d2", "diagnostic", 2, undefined, W("Thank you", "고마워요", "cảm ơn"), [W("Sorry", "미안해요", "xin lỗi"), W("Hello", "안녕하세요", "xin chào"), W("Goodbye", "안녕히 가세요", "tạm biệt")]);

  // ---- numbers & colours ----
  const num = (n, role, d, word, digit, fam) => K.mc({ sk: "numcol", n, role, d, fam, prompt: T(`다음 영어 낱말을 숫자로 바꾸면? ${word}`, `Từ ${word} tương ứng với số nào?`), items: [...new Set([digit, String(Number(digit) - 1), String(Number(digit) + 1), String(Number(digit) + 2)])].slice(0, 4), correct: 0, audio: word, tags: ["numbers"], hints: [H.sound, T("1부터 차례로 세어 보세요.", "Hãy đếm lần lượt từ 1.")], expl: T(`${word} = ${digit}`, `${word} = ${digit}`) });
  const n1 = num(1, "core", 1, "three", "3", "e1-num");
  const n2 = num(2, "core", 1, "seven", "7", "e1-num");
  const colors = { red: W("red", "빨강", "đỏ", "🍎"), blue: W("blue", "파랑", "xanh dương", "🐳"), yellow: W("yellow", "노랑", "vàng", "🍌"), green: W("green", "초록", "xanh lá", "🥦") };
  const n3 = K.meaning("numcol", 3, "core", 1, "e1-color", colors.red, [colors.blue, colors.yellow, colors.green]);
  const n4 = K.write({ sk: "numcol", n: 4, d: 2, fam: "e1-color", prompt: T("바나나는 무슨 색일까요? 영어로 쓰세요: 🍌", "Quả chuối màu gì? Viết bằng tiếng Anh: 🍌"), accepted: ["yellow"], audio: "yellow", tags: ["colors"], hints: [H.picture, H.first("yellow")], expl: T("🍌 = yellow (노랑)", "🍌 = yellow (màu vàng)") });
  const n5 = K.blank("numcol", 5, "core", 3, "e1-num", "2 + 3 = ____", W("five", "다섯", "năm"), ["five"], T("2 + 3 = five (다섯)", "2 + 3 = five (năm)"));
  num("v1", "variant", 1, "five", "5", "e1-num"); K.meaning("numcol", "v2", "variant", 1, "e1-color", colors.blue, [colors.red, colors.yellow, colors.green]);
  num("d1", "diagnostic", 1, "two", "2");

  // ---- family ----
  const FAM = { mother: W("mother", "엄마", "mẹ", "👩"), father: W("father", "아빠", "bố", "👨"), grandmother: W("grandmother", "할머니", "bà", "👵"), baby: W("baby", "아기", "em bé", "👶"), grandfather: W("grandfather", "할아버지", "ông", "👴") };
  const f1 = K.meaning("family", 1, "core", 1, "e1-meaning", FAM.mother, [FAM.father, FAM.grandmother, FAM.baby]);
  const f2 = K.toEn("family", 2, "core", 1, "e1-toen", { en: "dad", ko: "아빠", vi: "bố" }, [{ en: "mom" }, { en: "sister" }, { en: "baby" }]);
  const f3 = K.picture("family", 3, "core", 2, "e1-pic", FAM.baby);
  const f4 = K.blank("family", 4, "core", 2, "e1-toen", "This is my ____ .", W("grandmother", "할머니", "bà"), ["grandmother", "grandma"], T("This is my grandmother. = 이분은 우리 할머니예요.", "This is my grandmother. = Đây là bà của mình."));
  const f5 = K.order({ sk: "family", n: 5, d: 3, fam: "e1-pic", meaning: T("이분은 우리 엄마예요.", "Đây là mẹ của mình."), words: ["This", "is", "my", "mother"], tags: ["speaking"], hints: [T("'This'로 시작해요.", "Câu bắt đầu bằng 'This'."), T("my는 '나의'라는 뜻이에요.", "my nghĩa là 'của mình'.")], expl: T("This is my mother. = 이분은 우리 엄마예요.", "This is my mother. = Đây là mẹ của mình.") });
  K.meaning("family", "v1", "variant", 1, "e1-meaning", FAM.grandfather, [FAM.mother, FAM.baby, FAM.father]); K.toEn("family", "v2", "variant", 1, "e1-toen", { en: "mom", ko: "엄마", vi: "mẹ" }, [{ en: "dad" }, { en: "baby" }, { en: "sister" }]);
  K.meaning("family", "d1", "diagnostic", 1, undefined, FAM.father, [FAM.mother, FAM.baby, FAM.grandmother]);

  // ---- classroom ----
  const CL = { desk: W("desk", "책상", "bàn học", "🪑"), chair: W("chair", "의자", "cái ghế", "🪑"), bag: W("bag", "가방", "cặp sách", "🎒"), pencil: W("pencil", "연필", "bút chì", "✏️"), book: W("book", "책", "quyển sách", "📘"), teacher: W("teacher", "선생님", "giáo viên", "🧑‍🏫") };
  const c1 = K.meaning("cls", 1, "core", 1, "e1-meaning", CL.desk, [CL.chair, CL.bag, CL.pencil]);
  const c2 = K.toEn("cls", 2, "core", 1, "e1-toen", CL.chair, [CL.book, CL.bag, CL.pencil]);
  const c3 = K.picture("cls", 3, "core", 2, "e1-pic", CL.bag);
  const c4 = K.blank("cls", 4, "core", 2, "e1-toen", "I read a ____ .", W("book", "책", "quyển sách"), ["book"], T("I read a book. = 나는 책을 읽어요.", "I read a book. = Mình đọc một quyển sách."));
  const c5 = K.order({ sk: "cls", n: 5, d: 3, fam: "e1-pic", meaning: T("나는 연필이 있어요.", "Mình có một cây bút chì."), words: ["I", "have", "a", "pencil"], tags: ["speaking"], hints: [T("'I'로 시작해요.", "Câu bắt đầu bằng 'I'."), T("have는 '가지고 있다'예요.", "have nghĩa là có.")], expl: T("I have a pencil. = 나는 연필이 있어요.", "I have a pencil. = Mình có một cây bút chì.") });
  K.meaning("cls", "v1", "variant", 1, "e1-meaning", CL.teacher, [CL.desk, CL.bag, CL.chair]); K.picture("cls", "v2", "variant", 2, "e1-pic", CL.pencil);
  K.meaning("cls", "d1", "diagnostic", 1, undefined, CL.book, [CL.desk, CL.bag, CL.chair]);

  b.course({
    id: "english-e1", grade: "E1", title: T("초1 영어 · 알파벳과 첫 단어", "Tiếng Anh Lớp 1 · Bảng chữ cái và những từ đầu tiên"),
    world: { name: T("Alphabet Garden", "Vườn Chữ Cái"), emoji: "🌱", tagline: T("알파벳 정원에서 소리를 찾아요", "Tìm âm thanh trong khu vườn chữ cái") },
    unit: { id: "english-e1-u1", title: T("알파벳, 인사, 숫자와 색깔, 가족, 교실", "Chữ cái, chào hỏi, số và màu, gia đình, lớp học") },
    lessons: [
      lesson(1, "alpha", S, T("알파벳과 첫소리", "Bảng chữ cái và âm đầu"), T("낱말은 첫소리와 첫 글자를 알면 쉽게 기억돼요. 소리를 내며 따라 읽어 보세요.", "Biết âm đầu và chữ cái đầu sẽ giúp bạn nhớ từ dễ hơn. Hãy đọc to theo."), T("ball → B, cat → C, dog → D", "ball → B, cat → C, dog → D"), [a1, a2, a3, a4], a5),
      lesson(2, "greet", S, T("인사말", "Lời chào"), T("만났을 때는 **Hello**, 헤어질 때는 **Goodbye**라고 해요. 이름은 **My name is ...**로 말해요.", "Khi gặp nhau nói **Hello**, khi chia tay nói **Goodbye**. Giới thiệu tên bằng **My name is ...**."), T("Hello! My name is Mina.", "Hello! My name is Mina."), [g1, g2, g3, g4], g5),
      lesson(3, "numcol", S, T("숫자와 색깔", "Số đếm và màu sắc"), T("one, two, three... 숫자와 red, blue, yellow... 색깔 낱말을 익혀요.", "Học các từ chỉ số như one, two, three... và màu sắc như red, blue, yellow..."), T("three = 3, red = 빨강", "three = 3, red = màu đỏ"), [n1, n2, n3, n4], n5),
      lesson(4, "family", S, T("가족", "Gia đình"), T("mother(엄마), father(아빠), grandmother(할머니), baby(아기)처럼 가족을 부르는 낱말이에요.", "Các từ gọi người thân như mother (mẹ), father (bố), grandmother (bà), baby (em bé)."), T("This is my mother.", "This is my mother."), [f1, f2, f3, f4], f5),
      lesson(5, "cls", S, T("교실 낱말", "Từ vựng trong lớp học"), T("desk, chair, bag, pencil, book... 교실에서 쓰는 낱말을 영어로 말해 보세요.", "Hãy nói tiếng Anh các đồ vật trong lớp như desk, chair, bag, pencil, book..."), T("I have a pencil.", "I have a pencil."), [c1, c2, c3, c4], c5),
    ],
  });
}

/* ================================ Elementary 2 ================================ */
export function e2(b) {
  const S = { noun: "e.e2.noun", verb: "e.e2.verb", like: "e.e2.like", sent: "e.e2.sent", read: "e.e2.read" };
  b.skill(S.noun, T("동물과 사물 이름", "Tên con vật và đồ vật"));
  b.skill(S.verb, T("움직임을 나타내는 말", "Từ chỉ hành động"), S.noun);
  b.skill(S.like, T("I like / I have", "I like / I have"), S.verb);
  b.skill(S.sent, T("짧은 문장 만들기", "Đặt câu ngắn"), S.like);
  b.skill(S.read, T("짧은 글 읽기", "Đọc đoạn văn ngắn"), S.sent);
  const K = kit(b, "e2", S);
  const lesson = lessonOf("e2");
  const AN = { rabbit: W("rabbit", "토끼", "con thỏ", "🐰"), bird: W("bird", "새", "con chim", "🐦"), fish: W("fish", "물고기", "con cá", "🐟"), cat: W("cat", "고양이", "con mèo", "🐱"), dog: W("dog", "개", "con chó", "🐶") };

  const a1 = K.meaning("noun", 1, "core", 1, "e2-meaning", AN.rabbit, [AN.bird, AN.fish, AN.dog]);
  const a2 = K.toEn("noun", 2, "core", 1, "e2-toen", AN.bird, [AN.cat, AN.fish, AN.dog]);
  const a3 = K.picture("noun", 3, "core", 2, "e2-pic", AN.fish);
  const a4 = K.mc({ sk: "noun", n: 4, d: 2, fam: "e2-meaning", prompt: T("다음 중 동물이 아닌 것은?", "Từ nào sau đây KHÔNG phải là con vật?"), items: ["desk", "dog", "cat", "bird"], correct: 0, tags: ["vocab"], hints: [T("각 낱말의 뜻을 떠올려 보세요.", "Hãy nhớ nghĩa của từng từ."), T("desk는 '책상'이에요.", "desk nghĩa là cái bàn.")], expl: T("desk(책상)는 동물이 아니에요.", "desk (cái bàn) không phải là con vật.") });
  const a5 = K.picture("noun", 5, "core", 3, "e2-pic", AN.rabbit);
  K.meaning("noun", "v1", "variant", 1, "e2-meaning", AN.bird, [AN.rabbit, AN.fish, AN.cat]); K.picture("noun", "v2", "variant", 2, "e2-pic", AN.cat);
  K.picture("noun", "d1", "diagnostic", 1, undefined, AN.dog);
  K.meaning("noun", "d2", "diagnostic", 2, undefined, AN.fish, [AN.rabbit, AN.bird, AN.cat]);

  const V = { jump: W("jump", "점프하다", "nhảy", ""), run: W("run", "달리다", "chạy", ""), eat: W("eat", "먹다", "ăn", ""), sleep: W("sleep", "자다", "ngủ", ""), drink: W("drink", "마시다", "uống", ""), read: W("read", "읽다", "đọc", "") };
  const v1 = K.meaning("verb", 1, "core", 1, "e2-meaning", V.jump, [V.run, V.eat, V.sleep]);
  const v2 = K.toEn("verb", 2, "core", 1, "e2-toen", V.eat, [V.run, V.sleep, V.jump]);
  const v3 = K.blank("verb", 3, "core", 2, "e2-sent", "I ____ milk.", V.drink, ["drink"], T("I drink milk. = 나는 우유를 마셔요.", "I drink milk. = Mình uống sữa."));
  const v4 = K.choose("verb", 4, "core", 2, "e2-sent", "I ____ a book.", ["read", "run", "jump", "sleep"], 0, [T("책으로 할 수 있는 행동을 골라요.", "Chọn hành động có thể làm với quyển sách."), T("'읽다'는 read예요.", "'đọc' là read.")], T("I read a book. = 나는 책을 읽어요.", "I read a book. = Mình đọc sách."));
  const v5 = K.blank("verb", 5, "core", 3, "e2-sent", "I ____ in the park.", V.run, ["run"], T("I run in the park. = 나는 공원에서 달려요.", "I run in the park. = Mình chạy trong công viên."));
  K.meaning("verb", "v1", "variant", 1, "e2-meaning", V.sleep, [V.run, V.eat, V.jump]); K.blank("verb", "v2", "variant", 2, "e2-sent", "I ____ an apple.", V.eat, ["eat"], T("I eat an apple. = 나는 사과를 먹어요.", "I eat an apple. = Mình ăn một quả táo."));
  K.meaning("verb", "d1", "diagnostic", 1, undefined, V.run, [V.eat, V.sleep, V.drink]);

  const l1 = K.choose("like", 1, "core", 1, "e2-like", "I ____ apples.", ["like", "likes", "liking", "liked"], 0, [T("주어가 'I'일 때는 동사에 -s를 붙이지 않아요.", "Khi chủ ngữ là 'I' thì động từ không thêm -s."), T("like는 '좋아하다'예요.", "like nghĩa là thích.")], T("I like apples. = 나는 사과를 좋아해요.", "I like apples. = Mình thích táo."));
  const l2 = K.order({ sk: "like", n: 2, d: 1, fam: "e2-like", meaning: T("나는 개를 좋아해요.", "Mình thích chó."), words: ["I", "like", "dogs"], tags: ["speaking"], hints: [T("'I'로 시작해요.", "Câu bắt đầu bằng 'I'."), T("like 다음에 좋아하는 것이 와요.", "Sau like là thứ mình thích.")], expl: T("I like dogs. = 나는 개를 좋아해요.", "I like dogs. = Mình thích chó.") });
  const l3 = K.blank("like", 3, "core", 2, "e2-have", "I ____ a cat.", W("have", "가지고 있다", "có"), ["have"], T("I have a cat. = 나는 고양이가 있어요.", "I have a cat. = Mình có một con mèo."));
  const l4 = K.tf({ sk: "like", n: 4, d: 2, fam: "e2-like", truth: true, prompt: T("'I like milk.'은 '나는 우유를 좋아해요.'라는 뜻이에요. 맞을까요?", "'I like milk.' nghĩa là 'Mình thích sữa.' Đúng hay sai?"), tags: ["grammar"], hints: [T("like는 '좋아하다', milk는 '우유'예요.", "like là thích, milk là sữa."), T("낱말의 뜻을 차례로 이어 보세요.", "Hãy ghép nghĩa các từ lại.")], expl: T("I like milk. = 나는 우유를 좋아해요.", "I like milk. = Mình thích sữa.") });
  const l5 = K.order({ sk: "like", n: 5, d: 3, fam: "e2-have", meaning: T("나는 빨간 공이 있어요.", "Mình có một quả bóng màu đỏ."), words: ["I", "have", "a", "red", "ball"], tags: ["speaking"], hints: [T("'I have'로 시작해요.", "Câu bắt đầu bằng 'I have'."), T("색깔 낱말은 명사 앞에 와요.", "Từ chỉ màu đứng trước danh từ.")], expl: T("I have a red ball. = 나는 빨간 공이 있어요.", "I have a red ball. = Mình có một quả bóng màu đỏ.") });
  K.choose("like", "v1", "variant", 1, "e2-like", "I ____ pizza.", ["like", "likes", "liking", "liked"], 0, [T("주어가 'I'예요.", "Chủ ngữ là 'I'."), T("동사에 -s를 붙이지 않아요.", "Không thêm -s vào động từ.")], T("I like pizza. = 나는 피자를 좋아해요.", "I like pizza. = Mình thích pizza.")); K.blank("like", "v2", "variant", 2, "e2-have", "I ____ a bag.", W("have", "가지고 있다", "có"), ["have"], T("I have a bag. = 나는 가방이 있어요.", "I have a bag. = Mình có một cái cặp."));
  K.choose("like", "d1", "diagnostic", 1, undefined, "I ____ cats.", ["like", "likes", "liking", "liked"], 0, [T("주어가 'I'예요.", "Chủ ngữ là 'I'."), T("like는 '좋아하다'예요.", "like nghĩa là thích.")], T("I like cats. = 나는 고양이를 좋아해요.", "I like cats. = Mình thích mèo."));

  const s1 = K.order({ sk: "sent", n: 1, d: 1, fam: "e2-be", meaning: T("나는 행복해요.", "Mình rất vui."), words: ["I", "am", "happy"], tags: ["grammar"], hints: [T("'I am'으로 시작해요.", "Câu bắt đầu bằng 'I am'."), T("happy는 마지막에 와요.", "happy đứng cuối câu.")], expl: T("I am happy. = 나는 행복해요.", "I am happy. = Mình rất vui.") });
  const s2 = K.order({ sk: "sent", n: 2, d: 1, fam: "e2-be", meaning: T("너는 친절해요.", "Bạn thật tốt bụng."), words: ["You", "are", "kind"], tags: ["grammar"], hints: [T("'You are'로 시작해요.", "Câu bắt đầu bằng 'You are'."), T("kind는 '친절한'이에요.", "kind nghĩa là tốt bụng.")], expl: T("You are kind. = 너는 친절해요.", "You are kind. = Bạn thật tốt bụng.") });
  const s3 = K.choose("sent", 3, "core", 2, "e2-be", "I ____ a student.", ["am", "is", "are", "be"], 0, [T("'I' 다음에는 am을 써요.", "Sau 'I' ta dùng am."), T("I am = 나는 ~이에요.", "I am = Mình là ...")], T("I am a student. = 나는 학생이에요.", "I am a student. = Mình là học sinh."));
  const s4 = K.choose("sent", 4, "core", 2, "e2-be", "You ____ my friend.", ["are", "am", "is", "be"], 0, [T("'You' 다음에는 are를 써요.", "Sau 'You' ta dùng are."), T("You are = 너는 ~이야.", "You are = Bạn là ...")], T("You are my friend. = 너는 내 친구야.", "You are my friend. = Bạn là bạn của mình."));
  const s5 = K.order({ sk: "sent", n: 5, d: 3, fam: "e2-be", meaning: T("톰은 내 친구예요.", "Tom là bạn của mình."), words: ["Tom", "is", "my", "friend"], tags: ["grammar"], hints: [T("이름으로 시작해요.", "Câu bắt đầu bằng tên người."), T("Tom 다음에는 is를 써요.", "Sau Tom ta dùng is.")], expl: T("Tom is my friend. = 톰은 내 친구예요.", "Tom is my friend. = Tom là bạn của mình.") });
  K.order({ sk: "sent", n: "v1", role: "variant", d: 1, fam: "e2-be", meaning: T("나는 학생이에요.", "Mình là học sinh."), words: ["I", "am", "a", "student"], tags: ["grammar"], hints: [T("'I am'으로 시작해요.", "Câu bắt đầu bằng 'I am'."), T("a student는 마지막에 와요.", "a student đứng cuối câu.")], expl: T("I am a student. = 나는 학생이에요.", "I am a student. = Mình là học sinh.") }); K.choose("sent", "v2", "variant", 2, "e2-be", "You ____ tall.", ["are", "am", "is", "be"], 0, [T("'You' 다음에는 are를 써요.", "Sau 'You' ta dùng are."), T("tall은 '키가 큰'이에요.", "tall nghĩa là cao.")], T("You are tall. = 너는 키가 커.", "You are tall. = Bạn cao đấy."));
  K.choose("sent", "d1", "diagnostic", 2, undefined, "I ____ happy.", ["am", "is", "are", "be"], 0, [T("'I' 다음에는 am을 써요.", "Sau 'I' ta dùng am."), T("happy는 '행복한'이에요.", "happy nghĩa là vui.")], T("I am happy. = 나는 행복해요.", "I am happy. = Mình rất vui."));

  const rd = (n, role, d, fam, passage, q, items, correct, hintT, expl) => K.mc({ sk: "read", n, role, d, fam, prompt: T(`글을 읽고 답하세요. "${passage}" 질문: ${q}`, `Đọc đoạn văn rồi trả lời. "${passage}" Câu hỏi: ${q}`), items, correct, tags: ["reading"], hints: [T("글에서 질문과 같은 낱말을 찾아보세요.", "Hãy tìm trong đoạn văn từ giống trong câu hỏi."), hintT], expl });
  const r1 = rd(1, "core", 1, "e2-read", "Mina has a cat. The cat is white.", "What color is the cat?", ["white", "black", "red", "blue"], 0, T("'The cat is ...' 문장을 읽어 보세요.", "Hãy đọc câu 'The cat is ...'."), T("The cat is white. = 고양이는 하얀색이에요.", "The cat is white. = Con mèo màu trắng."));
  const r2 = rd(2, "core", 1, "e2-read", "Tom likes apples. He eats an apple every day.", "What does Tom like?", ["apples", "bananas", "milk", "fish"], 0, T("'Tom likes ...' 문장을 읽어 보세요.", "Hãy đọc câu 'Tom likes ...'."), T("Tom likes apples. = 톰은 사과를 좋아해요.", "Tom likes apples. = Tom thích táo."));
  const r3 = rd(3, "core", 2, "e2-read", "I have a bag. It is blue.", "What color is the bag?", ["blue", "red", "green", "yellow"], 0, T("'It is ...' 문장을 읽어 보세요.", "Hãy đọc câu 'It is ...'."), T("It is blue. = 파란색이에요.", "It is blue. = Nó màu xanh dương."));
  const r4 = K.tf({ sk: "read", n: 4, d: 2, fam: "e2-read", truth: false, prompt: T(`글을 읽고 맞는지 고르세요. "Mina has a cat. The cat is white." 문장: Mina has a dog.`, `Đọc đoạn văn rồi chọn đúng hay sai. "Mina has a cat. The cat is white." Câu: Mina has a dog.`), tags: ["reading"], hints: [T("글에서 Mina가 가진 동물을 찾아보세요.", "Hãy tìm con vật mà Mina có."), T("cat과 dog는 달라요.", "cat và dog là hai con vật khác nhau.")], expl: T("Mina는 dog이 아니라 cat을 가지고 있어요.", "Mina có một con mèo (cat), không phải con chó (dog).") });
  const r5 = rd(5, "core", 3, "e2-read", "Ben has two balls. One is red. One is blue.", "How many balls does Ben have?", ["2", "1", "3", "4"], 0, T("'two'는 숫자 2예요.", "'two' là số 2."), T("Ben has two balls. = 벤은 공이 두 개 있어요.", "Ben has two balls. = Ben có hai quả bóng."));
  rd("v1", "variant", 1, "e2-read", "Amy has a dog. The dog is brown.", "What color is the dog?", ["brown", "white", "black", "red"], 0, T("'The dog is ...' 문장을 읽어 보세요.", "Hãy đọc câu 'The dog is ...'."), T("The dog is brown. = 개는 갈색이에요.", "The dog is brown. = Con chó màu nâu.")); rd("v2", "variant", 2, "e2-read", "I like milk. I drink milk every morning.", "What do I drink?", ["milk", "juice", "water", "tea"], 0, T("'I drink ...' 문장을 읽어 보세요.", "Hãy đọc câu 'I drink ...'."), T("I drink milk. = 나는 우유를 마셔요.", "I drink milk. = Mình uống sữa."));
  rd("d1", "diagnostic", 2, undefined, "Sam has a ball. The ball is green.", "What color is the ball?", ["green", "red", "blue", "yellow"], 0, T("'The ball is ...' 문장을 읽어 보세요.", "Hãy đọc câu 'The ball is ...'."), T("The ball is green. = 공은 초록색이에요.", "The ball is green. = Quả bóng màu xanh lá."));

  b.course({
    id: "english-e2", grade: "E2", title: T("초2 영어 · 낱말과 짧은 문장", "Tiếng Anh Lớp 2 · Từ vựng và câu ngắn"),
    world: { name: T("Word Pond", "Ao Từ Vựng"), emoji: "🪷", tagline: T("낱말을 모아 짧은 문장을 만들어요", "Gom từ để đặt những câu ngắn") },
    unit: { id: "english-e2-u1", title: T("동물, 동작, I like·I have, 짧은 문장, 읽기", "Con vật, hành động, I like·I have, câu ngắn, đọc hiểu") },
    lessons: [
      lesson(1, "noun", S, T("동물과 사물 이름", "Tên con vật và đồ vật"), T("rabbit(토끼), bird(새), fish(물고기)처럼 이름을 나타내는 낱말을 **명사**라고 해요.", "Những từ chỉ tên như rabbit (thỏ), bird (chim), fish (cá) gọi là **danh từ**."), T("🐰 = rabbit", "🐰 = rabbit"), [a1, a2, a3, a4], a5),
      lesson(2, "verb", S, T("움직임을 나타내는 말", "Từ chỉ hành động"), T("jump(점프하다), run(달리다), eat(먹다)처럼 움직임을 나타내는 낱말을 **동사**라고 해요.", "Những từ chỉ hành động như jump (nhảy), run (chạy), eat (ăn) gọi là **động từ**."), T("I eat an apple.", "I eat an apple."), [v1, v2, v3, v4], v5),
      lesson(3, "like", S, T("I like / I have", "I like / I have"), T("**I like ...**은 '나는 ...을 좋아해요', **I have ...**는 '나는 ...이 있어요'예요.", "**I like ...** nghĩa là 'Mình thích ...', **I have ...** nghĩa là 'Mình có ...'."), T("I like dogs. I have a cat.", "I like dogs. I have a cat."), [l1, l2, l3, l4], l5),
      lesson(4, "sent", S, T("짧은 문장 만들기", "Đặt câu ngắn"), T("I 다음에는 **am**, You 다음에는 **are**를 써요. 문장은 '누가 → 어떻다/한다' 순서예요.", "Sau I dùng **am**, sau You dùng **are**. Câu có thứ tự: ai → thế nào/làm gì."), T("I am a student. You are kind.", "I am a student. You are kind."), [s1, s2, s3, s4], s5),
      lesson(5, "read", S, T("짧은 글 읽기", "Đọc đoạn văn ngắn"), T("글을 읽을 때는 질문의 낱말을 글에서 먼저 찾아보세요.", "Khi đọc hiểu, hãy tìm trong đoạn văn các từ xuất hiện trong câu hỏi."), T("Mina has a cat. → 고양이", "Mina has a cat. → con mèo"), [r1, r2, r3, r4], r5),
    ],
  });
}

/* ================================ Elementary 3 ================================ */
export function e3(b) {
  const S = { build: "e.e3.build", pron: "e.e3.pron", tense: "e.e3.tense", routine: "e.e3.routine", read: "e.e3.read" };
  b.skill(S.build, T("문장 만들기", "Xây dựng câu"));
  b.skill(S.pron, T("대명사", "Đại từ"), S.build);
  b.skill(S.tense, T("현재형과 과거형", "Thì hiện tại và quá khứ"), S.pron);
  b.skill(S.routine, T("하루 일과", "Thói quen hằng ngày"), S.build);
  b.skill(S.read, T("글 이해하기", "Đọc hiểu"), S.tense);
  const K = kit(b, "e3", S);
  const lesson = lessonOf("e3");
  const ord = (sk, n, role, d, fam, meaning, words, hints, expl) => K.order({ sk, n, role, d, fam, meaning, words, tags: ["grammar"], hints, expl });
  const first = (w) => T(`첫 단어: ${w}`, `Từ đầu tiên: ${w}`);

  const b1 = ord("build", 1, "core", 1, "e3-svo", T("그녀는 책을 읽어요.", "Cô ấy đọc sách."), ["She", "reads", "a", "book"], [first("She"), T("'누가 → 무엇을 한다 → 무엇' 순서예요.", "Thứ tự: ai → làm gì → cái gì.")], T("She reads a book. = 그녀는 책을 읽어요.", "She reads a book. = Cô ấy đọc sách."));
  const b2 = ord("build", 2, "core", 1, "e3-svo", T("우리는 축구를 해요.", "Chúng mình chơi bóng đá."), ["We", "play", "soccer"], [first("We"), T("play 다음에 하는 운동이 와요.", "Sau play là môn thể thao.")], T("We play soccer. = 우리는 축구를 해요.", "We play soccer. = Chúng mình chơi bóng đá."));
  const b3 = K.choose("build", 3, "core", 2, "e3-third", "He ____ soccer.", ["plays", "play", "playing", "played"], 0, [T("주어가 He일 때는 동사에 -s를 붙여요.", "Khi chủ ngữ là He thì thêm -s vào động từ."), T("He plays = 그는 ~을 해요.", "He plays = Anh ấy chơi ...")], T("He plays soccer. = 그는 축구를 해요.", "He plays soccer. = Anh ấy chơi bóng đá."));
  const b4 = ord("build", 4, "core", 2, "e3-svo", T("개는 빨리 달려요.", "Con chó chạy nhanh."), ["The", "dog", "runs", "fast"], [first("The"), T("runs 다음에 fast가 와요.", "fast đứng sau runs.")], T("The dog runs fast. = 개는 빨리 달려요.", "The dog runs fast. = Con chó chạy nhanh."));
  const b5 = K.choose("build", 5, "core", 3, "e3-third", "My mother ____ breakfast.", ["cooks", "cook", "cooking", "cooked"], 0, [T("My mother는 한 사람(3인칭 단수)이에요.", "My mother là một người (ngôi thứ ba số ít)."), T("동사에 -s를 붙여요.", "Hãy thêm -s vào động từ.")], T("My mother cooks breakfast. = 엄마는 아침을 요리해요.", "My mother cooks breakfast. = Mẹ nấu bữa sáng."));
  ord("build", "v1", "variant", 1, "e3-svo", T("그는 우유를 마셔요.", "Anh ấy uống sữa."), ["He", "drinks", "milk"], [first("He"), T("drinks 다음에 마시는 것이 와요.", "Sau drinks là thứ để uống.")], T("He drinks milk. = 그는 우유를 마셔요.", "He drinks milk. = Anh ấy uống sữa.")); K.choose("build", "v2", "variant", 2, "e3-third", "She ____ English.", ["studies", "study", "studying", "studied"], 0, [T("자음 + y로 끝나면 y를 i로 바꾸고 -es를 붙여요.", "Từ kết thúc bằng phụ âm + y thì đổi y thành i rồi thêm -es."), T("She는 한 사람이에요.", "She là một người.")], T("She studies English. = 그녀는 영어를 공부해요.", "She studies English. = Cô ấy học tiếng Anh."));
  K.choose("build", "d1", "diagnostic", 2, undefined, "She ____ a song.", ["sings", "sing", "singing", "sang"], 0, [T("She는 한 사람이에요.", "She là một người."), T("동사에 -s를 붙여요.", "Hãy thêm -s vào động từ.")], T("She sings a song. = 그녀는 노래를 불러요.", "She sings a song. = Cô ấy hát một bài hát."));

  const pr = (n, role, d, fam, s1, ans, items, hint2, expl) => K.mc({ sk: "pron", n, role, d, fam, prompt: T(`알맞은 대명사를 고르세요: ${s1}`, `Chọn đại từ thích hợp: ${s1}`), items, correct: items.indexOf(ans), tags: ["grammar"], hints: [T("앞 문장의 주인공이 누구인지 찾아보세요.", "Hãy tìm xem ai là nhân vật ở câu trước."), hint2], expl });
  const p1 = pr(1, "core", 1, "e3-pron", "Tom is tall. ____ is tall.", "He", ["He", "She", "It", "They"], T("Tom은 남자예요.", "Tom là con trai."), T("Tom = He (그)", "Tom = He (anh ấy)"));
  const p2 = pr(2, "core", 1, "e3-pron", "Mina is kind. ____ is kind.", "She", ["She", "He", "It", "They"], T("Mina는 여자예요.", "Mina là con gái."), T("Mina = She (그녀)", "Mina = She (cô ấy)"));
  const p3 = pr(3, "core", 2, "e3-pron", "The books are new. ____ are new.", "They", ["They", "It", "He", "We"], T("books는 여러 개(복수)예요.", "books là số nhiều."), T("The books = They (그것들)", "The books = They (chúng)"));
  const p4 = pr(4, "core", 2, "e3-pron", "Mina and I are friends. ____ are friends.", "We", ["We", "They", "You", "He"], T("Mina와 나, 우리 둘이에요.", "Mina và mình, tức là chúng mình."), T("Mina and I = We (우리)", "Mina and I = We (chúng mình)"));
  const p5 = pr(5, "core", 3, "e3-pron", "My sister is a nurse. ____ works in a hospital.", "She", ["She", "He", "They", "We"], T("sister는 여자 형제예요.", "sister là chị/em gái."), T("My sister = She (그녀)", "My sister = She (cô ấy)"));
  pr("v1", "variant", 1, "e3-pron", "Ben is my brother. ____ is nine.", "He", ["He", "She", "It", "They"], T("brother는 남자 형제예요.", "brother là anh/em trai."), T("Ben = He (그)", "Ben = He (anh ấy)")); pr("v2", "variant", 2, "e3-pron", "The cat is white. ____ is white.", "It", ["It", "He", "She", "They"], T("동물이나 사물은 It으로 말해요.", "Con vật hoặc đồ vật thường dùng It."), T("The cat = It (그것)", "The cat = It (nó)"));
  pr("d2", "diagnostic", 2, undefined, "My brothers are tall. ____ are tall.", "They", ["They", "He", "She", "It"], T("brothers는 여러 명(복수)이에요.", "brothers là số nhiều."), T("My brothers = They (그들)", "My brothers = They (họ)"));
  pr("d1", "diagnostic", 1, undefined, "Anna is happy. ____ is happy.", "She", ["She", "He", "It", "They"], T("Anna는 여자 이름이에요.", "Anna là tên con gái."), T("Anna = She (그녀)", "Anna = She (cô ấy)"));

  const t1 = K.choose("tense", 1, "core", 1, "e3-past", "Yesterday I ____ soccer.", ["played", "play", "plays", "playing"], 0, [T("yesterday는 '어제'예요. 지난 일이에요.", "yesterday là hôm qua, tức là việc đã xảy ra."), T("과거에는 동사 끝에 -ed를 붙여요.", "Thì quá khứ thường thêm -ed vào động từ.")], T("Yesterday I played soccer. = 어제 나는 축구를 했어요.", "Yesterday I played soccer. = Hôm qua mình đã chơi bóng đá."));
  const t2 = K.write({ sk: "tense", n: 2, d: 2, fam: "e3-past", prompt: T("walked의 원래 형태(현재형)를 쓰세요.", "Hãy viết dạng nguyên mẫu (hiện tại) của từ walked."), accepted: ["walk"], tags: ["grammar"], hints: [T("끝의 -ed를 떼어 보세요.", "Hãy bỏ -ed ở cuối từ."), H.first("walk")], expl: T("walked = walk의 과거형", "walked là quá khứ của walk.") });
  const t3 = K.blank("tense", 3, "core", 2, "e3-past", "Yesterday, we ____ the zoo.", W("visited", "방문했다", "đã đến thăm"), ["visited"], T("Yesterday, we visited the zoo. = 어제 우리는 동물원에 갔어요.", "Yesterday, we visited the zoo. = Hôm qua chúng mình đã đến sở thú."));
  const t4 = K.choose("tense", 4, "core", 2, "e3-present", "Every day I ____ to school.", ["walk", "walked", "walks", "walking"], 0, [T("every day는 '매일'이에요. 반복되는 일이라 현재형을 써요.", "every day là mỗi ngày, việc lặp lại nên dùng thì hiện tại."), T("주어가 I예요.", "Chủ ngữ là I.")], T("Every day I walk to school. = 나는 매일 학교에 걸어가요.", "Every day I walk to school. = Mình đi bộ đến trường mỗi ngày."));
  const t5 = K.choose("tense", 5, "core", 3, "e3-past", "Last night, she ____ TV.", ["watched", "watch", "watches", "watching"], 0, [T("last night은 '어젯밤'이에요.", "last night là tối qua."), T("지난 일이므로 -ed를 붙여요.", "Việc đã xảy ra nên thêm -ed.")], T("Last night, she watched TV. = 어젯밤에 그녀는 TV를 봤어요.", "Last night, she watched TV. = Tối qua cô ấy đã xem TV."));
  K.choose("tense", "v1", "variant", 1, "e3-past", "Yesterday he ____ his room.", ["cleaned", "clean", "cleans", "cleaning"], 0, [T("yesterday는 지난 일이에요.", "yesterday nói về việc đã xảy ra."), T("-ed를 붙여요.", "Thêm -ed.")], T("Yesterday he cleaned his room. = 어제 그는 방을 청소했어요.", "Yesterday he cleaned his room. = Hôm qua anh ấy đã dọn phòng.")); K.write({ sk: "tense", n: "v2", role: "variant", d: 2, fam: "e3-past", prompt: T("played의 원래 형태(현재형)를 쓰세요.", "Hãy viết dạng nguyên mẫu (hiện tại) của từ played."), accepted: ["play"], tags: ["grammar"], hints: [T("끝의 -ed를 떼어 보세요.", "Hãy bỏ -ed ở cuối từ."), H.first("play")], expl: T("played = play의 과거형", "played là quá khứ của play.") });
  K.choose("tense", "d1", "diagnostic", 2, undefined, "Yesterday I ____ a movie.", ["watched", "watch", "watches", "watching"], 0, [T("yesterday는 지난 일이에요.", "yesterday nói về việc đã xảy ra."), T("-ed를 붙여요.", "Thêm -ed.")], T("Yesterday I watched a movie. = 어제 나는 영화를 봤어요.", "Yesterday I watched a movie. = Hôm qua mình đã xem phim."));

  const RT = { wake: W("wake up", "일어나다", "thức dậy"), brush: W("brush", "닦다", "đánh (răng)"), eat: W("eat", "먹다", "ăn"), sleep: W("sleep", "자다", "ngủ"), go: W("go", "가다", "đi") };
  const o1 = ord("routine", 1, "core", 1, "e3-routine", T("나는 일곱 시에 일어나요.", "Mình thức dậy lúc bảy giờ."), ["I", "get", "up", "at", "seven"], [first("I"), T("get up은 '일어나다'예요.", "get up nghĩa là thức dậy.")], T("I get up at seven. = 나는 일곱 시에 일어나요.", "I get up at seven. = Mình thức dậy lúc bảy giờ."));
  const o2 = K.blank("routine", 2, "core", 1, "e3-routine", "I ____ my teeth.", RT.brush, ["brush"], T("I brush my teeth. = 나는 이를 닦아요.", "I brush my teeth. = Mình đánh răng."));
  const o3 = K.blank("routine", 3, "core", 2, "e3-routine", "I ____ breakfast at 7.", RT.eat, ["eat", "have"], T("I eat breakfast at 7. = 나는 7시에 아침을 먹어요.", "I eat breakfast at 7. = Mình ăn sáng lúc 7 giờ."));
  const o4 = K.meaning("routine", 4, "core", 2, "e3-meaning", RT.wake, [RT.sleep, RT.go, RT.eat]);
  const o5 = ord("routine", 5, "core", 3, "e3-routine", T("나는 열 시에 자요.", "Mình đi ngủ lúc mười giờ."), ["I", "go", "to", "bed", "at", "ten"], [first("I"), T("go to bed는 '자러 가다'예요.", "go to bed nghĩa là đi ngủ.")], T("I go to bed at ten. = 나는 열 시에 자요.", "I go to bed at ten. = Mình đi ngủ lúc mười giờ."));
  K.blank("routine", "v1", "variant", 1, "e3-routine", "I ____ my face.", W("wash", "씻다", "rửa"), ["wash"], T("I wash my face. = 나는 세수를 해요.", "I wash my face. = Mình rửa mặt.")); K.meaning("routine", "v2", "variant", 2, "e3-meaning", RT.brush, [RT.sleep, RT.go, RT.eat]);
  K.blank("routine", "d1", "diagnostic", 1, undefined, "I ____ lunch at noon.", RT.eat, ["eat", "have"], T("I eat lunch at noon. = 나는 정오에 점심을 먹어요.", "I eat lunch at noon. = Mình ăn trưa vào buổi trưa."));

  const rd = (n, role, d, fam, passage, q, items, correct, hintT, expl) => K.mc({ sk: "read", n, role, d, fam, prompt: T(`글을 읽고 답하세요. "${passage}" 질문: ${q}`, `Đọc đoạn văn rồi trả lời. "${passage}" Câu hỏi: ${q}`), items, correct, tags: ["reading"], hints: [T("글에서 질문과 같은 낱말을 찾아보세요.", "Hãy tìm trong đoạn văn từ giống trong câu hỏi."), hintT], expl });
  const P1 = "Jin gets up at seven. He brushes his teeth. Then he eats breakfast.";
  const r1 = rd(1, "core", 1, "e3-read", P1, "What time does Jin get up?", ["At seven", "At eight", "At nine", "At six"], 0, T("'gets up at ...'을 찾아보세요.", "Hãy tìm 'gets up at ...'."), T("Jin gets up at seven. = 진은 일곱 시에 일어나요.", "Jin gets up at seven. = Jin thức dậy lúc bảy giờ."));
  const r2 = rd(2, "core", 1, "e3-read", P1, "What does Jin do after brushing his teeth?", ["He eats breakfast", "He goes to bed", "He plays soccer", "He watches TV"], 0, T("'Then'은 '그다음에'라는 뜻이에요.", "'Then' nghĩa là sau đó."), T("Then he eats breakfast. = 그다음에 아침을 먹어요.", "Then he eats breakfast. = Sau đó anh ấy ăn sáng."));
  const r3 = K.tf({ sk: "read", n: 3, d: 2, fam: "e3-read", truth: true, prompt: T(`글을 읽고 맞는지 고르세요. "${P1}" 문장: Jin brushes his teeth.`, `Đọc đoạn văn rồi chọn đúng hay sai. "${P1}" Câu: Jin brushes his teeth.`), tags: ["reading"], hints: [T("글에서 brushes를 찾아보세요.", "Hãy tìm từ brushes trong đoạn văn."), T("his teeth는 '그의 이'예요.", "his teeth nghĩa là răng của anh ấy.")], expl: T("He brushes his teeth. 라고 쓰여 있어요.", "Trong đoạn văn có câu He brushes his teeth.") });
  const P2 = "Yesterday Mina visited her grandmother. They cooked dinner together. It was fun.";
  const r4 = rd(4, "core", 2, "e3-read", P2, "Who did Mina visit?", ["Her grandmother", "Her teacher", "Her friend", "Her brother"], 0, T("'visited'는 '방문했다'예요.", "'visited' nghĩa là đã đến thăm."), T("Mina visited her grandmother. = 미나는 할머니를 방문했어요.", "Mina visited her grandmother. = Mina đã đến thăm bà."));
  const r5 = rd(5, "core", 3, "e3-read", P2, "What did they do together?", ["They cooked dinner", "They played soccer", "They watched TV", "They went to school"], 0, T("'together'는 '함께'예요.", "'together' nghĩa là cùng nhau."), T("They cooked dinner together. = 그들은 함께 저녁을 요리했어요.", "They cooked dinner together. = Họ cùng nhau nấu bữa tối."));
  rd("v1", "variant", 1, "e3-read", P1, "Who gets up at seven?", ["Jin", "Mina", "Tom", "Amy"], 0, T("글의 첫 문장을 읽어 보세요.", "Hãy đọc câu đầu tiên."), T("Jin gets up at seven. = 진이 일곱 시에 일어나요.", "Jin gets up at seven. = Jin thức dậy lúc bảy giờ.")); rd("v2", "variant", 2, "e3-read", P2, "When did Mina visit her grandmother?", ["Yesterday", "Today", "Tomorrow", "Last year"], 0, T("글의 첫 낱말을 보세요.", "Hãy xem từ đầu tiên của đoạn văn."), T("Yesterday = 어제", "Yesterday = hôm qua"));
  rd("d1", "diagnostic", 2, undefined, P1, "What does Jin eat?", ["Breakfast", "Dinner", "Lunch", "Snack"], 0, T("'eats ...'를 찾아보세요.", "Hãy tìm 'eats ...'."), T("He eats breakfast. = 그는 아침을 먹어요.", "He eats breakfast. = Anh ấy ăn sáng."));

  b.course({
    id: "english-e3", grade: "E3", title: T("초3 영어 · 문장, 대명사, 과거형", "Tiếng Anh Lớp 3 · Câu, đại từ và thì quá khứ"),
    world: { name: T("Sentence Station", "Ga Đặt Câu"), emoji: "🚉", tagline: T("낱말을 이어 문장 기차를 만들어요", "Nối các từ thành đoàn tàu câu") },
    unit: { id: "english-e3-u1", title: T("문장 만들기, 대명사, 현재와 과거, 하루 일과, 읽기", "Đặt câu, đại từ, hiện tại và quá khứ, thói quen, đọc hiểu") },
    lessons: [
      lesson(1, "build", S, T("문장 만들기", "Xây dựng câu"), T("문장은 '누가 → 무엇을 한다 → 무엇' 순서예요. He, She, 사람 이름 뒤의 동사에는 **-s**를 붙여요.", "Câu có thứ tự: ai → làm gì → cái gì. Động từ sau He, She hoặc tên một người thì thêm **-s**."), T("She reads a book.", "She reads a book."), [b1, b2, b3, b4], b5),
      lesson(2, "pron", S, T("대명사", "Đại từ"), T("이름 대신 **He**(그), **She**(그녀), **It**(그것), **They**(그들), **We**(우리)를 쓸 수 있어요.", "Có thể dùng **He** (anh ấy), **She** (cô ấy), **It** (nó), **They** (họ/chúng), **We** (chúng mình) thay cho tên."), T("Tom is tall. He is tall.", "Tom is tall. He is tall."), [p1, p2, p3, p4], p5),
      lesson(3, "tense", S, T("현재형과 과거형", "Thì hiện tại và quá khứ"), T("지금이나 반복되는 일은 **현재형**, 지난 일은 동사 끝에 **-ed**를 붙인 **과거형**을 써요.", "Việc đang xảy ra hoặc lặp lại dùng **hiện tại**; việc đã xảy ra dùng **quá khứ**, thêm **-ed** vào động từ."), T("I walk. → I walked.", "I walk. → I walked."), [t1, t2, t3, t4], t5),
      lesson(4, "routine", S, T("하루 일과", "Thói quen hằng ngày"), T("get up, brush my teeth, eat breakfast, go to bed... 하루 일과를 영어로 말해 보세요.", "Hãy nói bằng tiếng Anh các việc hằng ngày: get up, brush my teeth, eat breakfast, go to bed..."), T("I get up at seven.", "I get up at seven."), [o1, o2, o3, o4], o5),
      lesson(5, "read", S, T("글 이해하기", "Đọc hiểu"), T("글을 읽고 누가, 언제, 무엇을 했는지 찾아보세요.", "Đọc đoạn văn và tìm xem ai, khi nào, làm gì."), T("Jin gets up at seven.", "Jin gets up at seven."), [r1, r2, r3, r4], r5),
    ],
  });
}

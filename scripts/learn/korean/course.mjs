// study.korean.life.help — canonical Korean course data (K1..K6 language levels).
//
// TARGET material (Korean text, its Revised Romanization, accepted answers, audio) lives here ONCE and is never localized.
// Everything the learner READS around it (prompts, hints, explanations, meaning glosses, lesson concepts, course names) is a key into a
// presentation kit (scripts/learn/korean/kit/<locale>.json); build-korean-content.mjs renders the canonical bundle (English kit) and one
// overlay per registry locale from the same items, so ids, option ids and answer keys are identical in every locale.
//
// Item kinds (k):
//   read     choose the romanization of `ko`                       options = romanizations (target)
//   meaning  what does `ko` mean                                    options = glosses (localized)
//   toko     choose the Korean for gloss `g`                        options = Korean (target)
//   listen   hear `ko`, choose it                                   options = Korean (target)
//   tf       does `ko` mean gloss `claim`                           true / false
//   fill     complete `blank` (Korean with ____) meaning gloss `g`  typed Korean, `answers`
//   order    tap `parts` in order, meaning gloss `g`                options = Korean chunks (target)
//   number   write the number `ko` stands for                       numeric `n`
//   choose   choose the correct sentence for gloss `g`              options = Korean sentences (target), first is correct
// `rr` = Revised Romanization of `ko` (the only romanization system used). `note` = kit key of a grammar note added to the explanation.

export const LEVELS = [
  {
    level: "K1", emoji: "🔤",
    lessons: [
      { skill: "vowels", items: [
        { k: "read", ko: "아", rr: "a", wrong: ["eo", "o", "u"] },
        { k: "read", ko: "어", rr: "eo", wrong: ["a", "o", "u"] },
        { k: "read", ko: "오", rr: "o", wrong: ["u", "eo", "a"] },
        { k: "read", ko: "우", rr: "u", wrong: ["o", "eu", "i"] },
        { k: "read", ko: "으", rr: "eu", wrong: ["u", "i", "eo"], challenge: true },
        { k: "read", ko: "이", rr: "i", wrong: ["eu", "a", "u"], variant: true },
        { k: "listen", ko: "오", rr: "o", wrong: ["아", "우", "어"], variant: true },
      ] },
      { skill: "consonants", items: [
        { k: "read", ko: "가", rr: "ga", wrong: ["na", "da", "ma"] },
        { k: "read", ko: "나", rr: "na", wrong: ["ga", "da", "ra"] },
        { k: "read", ko: "마", rr: "ma", wrong: ["ba", "na", "ha"] },
        { k: "listen", ko: "바", rr: "ba", wrong: ["마", "다", "사"] },
        { k: "read", ko: "하", rr: "ha", wrong: ["a", "ga", "sa"], challenge: true },
        { k: "read", ko: "사", rr: "sa", wrong: ["ja", "ha", "da"], variant: true },
        { k: "read", ko: "다", rr: "da", wrong: ["ga", "na", "ra"], variant: true },
      ] },
      { skill: "words", items: [
        { k: "meaning", ko: "우유", rr: "uyu", g: "milk", wrong: ["cucumber", "child", "tree"] },
        { k: "meaning", ko: "오이", rr: "oi", g: "cucumber", wrong: ["milk", "sea", "child"] },
        { k: "read", ko: "나무", rr: "namu", wrong: ["namo", "nemu", "numa"] },
        { k: "toko", ko: "나무", rr: "namu", g: "tree", wrong: ["우유", "오이", "바다"] },
        { k: "meaning", ko: "바다", rr: "bada", g: "sea", wrong: ["milk", "tree", "child"], challenge: true },
        { k: "meaning", ko: "아이", rr: "ai", g: "child", wrong: ["cucumber", "sea", "milk"], variant: true },
        { k: "listen", ko: "우유", rr: "uyu", wrong: ["오이", "아이", "나무"], variant: true },
      ] },
    ],
    diagnostic: [
      { k: "read", ko: "바", rr: "ba", wrong: ["pa", "ma", "da"] },
      { k: "meaning", ko: "나무", rr: "namu", g: "tree", wrong: ["sea", "milk", "child"] },
    ],
  },
  {
    level: "K2", emoji: "👋",
    lessons: [
      { skill: "greetings", items: [
        { k: "meaning", ko: "안녕하세요.", rr: "annyeonghaseyo.", g: "hello", wrong: ["thanks", "sorry", "byeLeaving"] },
        { k: "meaning", ko: "감사합니다.", rr: "gamsahamnida.", g: "thanks", wrong: ["hello", "sorry", "yes"] },
        { k: "toko", ko: "죄송합니다.", rr: "joesonghamnida.", g: "sorry", wrong: ["감사합니다.", "안녕하세요.", "네."] },
        { k: "tf", ko: "안녕하세요.", rr: "annyeonghaseyo.", claim: "thanks", g: "hello" },
        { k: "listen", ko: "감사합니다.", rr: "gamsahamnida.", wrong: ["죄송합니다.", "안녕하세요.", "괜찮아요."], challenge: true },
        { k: "read", ko: "감사합니다", rr: "gamsahamnida", wrong: ["gamsahapnida", "gamsahamida", "gamsanida"], variant: true },
        { k: "meaning", ko: "죄송합니다.", rr: "joesonghamnida.", g: "sorry", wrong: ["thanks", "hello", "okay"], variant: true },
      ] },
      { skill: "answers", items: [
        { k: "meaning", ko: "네.", rr: "ne.", g: "yes", wrong: ["no", "okay", "moment"] },
        { k: "meaning", ko: "아니요.", rr: "aniyo.", g: "no", wrong: ["yes", "thanks", "moment"] },
        { k: "toko", ko: "괜찮아요.", rr: "gwaenchanayo.", g: "okay", wrong: ["잠깐만요.", "아니요.", "죄송합니다."] },
        { k: "tf", ko: "잠깐만요.", rr: "jamkkanmanyo.", claim: "moment", g: "moment" },
        { k: "meaning", ko: "괜찮아요.", rr: "gwaenchanayo.", g: "okay", wrong: ["sorry", "no", "hello"], challenge: true },
        { k: "listen", ko: "아니요.", rr: "aniyo.", wrong: ["네.", "괜찮아요.", "잠깐만요."], variant: true },
        { k: "toko", ko: "네.", rr: "ne.", g: "yes", wrong: ["아니요.", "괜찮아요.", "감사합니다."], variant: true },
      ] },
      { skill: "meeting", items: [
        { k: "meaning", ko: "만나서 반갑습니다.", rr: "mannaseo bangapseumnida.", g: "niceToMeet", wrong: ["byeLeaving", "thanks", "sorry"] },
        { k: "meaning", ko: "안녕히 가세요.", rr: "annyeonghi gaseyo.", g: "byeLeaving", wrong: ["hello", "niceToMeet", "okay"], note: "gaseyo" },
        { k: "fill", blank: "제 이름은 민수____.", ko: "제 이름은 민수입니다.", rr: "je ireumeun minsuimnida.", answers: ["입니다", "예요"], g: "myNameMinsu", ans_rr: "imnida" },
        { k: "order", parts: ["제", "이름은", "민수입니다."], ko: "제 이름은 민수입니다.", rr: "je ireumeun minsuimnida.", g: "myNameMinsu" },
        { k: "toko", ko: "안녕히 계세요.", rr: "annyeonghi gyeseyo.", g: "byeStaying", wrong: ["안녕히 가세요.", "안녕하세요.", "반갑습니다."], note: "gaseyo", challenge: true },
        { k: "read", ko: "반갑습니다", rr: "bangapseumnida", wrong: ["bangabseumnida", "bangapsumnida", "bangapnida"], variant: true },
        { k: "tf", ko: "안녕히 가세요.", rr: "annyeonghi gaseyo.", claim: "hello", g: "byeLeaving", note: "gaseyo", variant: true },
      ] },
    ],
    diagnostic: [
      { k: "meaning", ko: "감사합니다.", rr: "gamsahamnida.", g: "thanks", wrong: ["sorry", "hello", "no"] },
      { k: "toko", ko: "안녕하세요.", rr: "annyeonghaseyo.", g: "hello", wrong: ["감사합니다.", "죄송합니다.", "아니요."] },
    ],
  },
  {
    level: "K3", emoji: "👨‍👩‍👧",
    lessons: [
      { skill: "self", items: [
        { k: "meaning", ko: "저는 학생이에요.", rr: "jeoneun haksaengieyo.", g: "iAmStudent", wrong: ["iAmTeacher", "iAmDoctor", "iAmKorean"] },
        { k: "meaning", ko: "선생님", rr: "seonsaengnim", g: "teacher", wrong: ["student", "doctor", "family"] },
        { k: "fill", blank: "저는 학생____.", ko: "저는 학생이에요.", rr: "jeoneun haksaengieyo.", answers: ["이에요", "입니다"], g: "iAmStudent", ans_rr: "ieyo", note: "ieyo" },
        { k: "tf", ko: "저는 선생님이에요.", rr: "jeoneun seonsaengnimieyo.", claim: "iAmTeacher", g: "iAmTeacher" },
        { k: "order", parts: ["저는", "한국", "사람이에요."], ko: "저는 한국 사람이에요.", rr: "jeoneun hanguk saramieyo.", g: "iAmKorean", challenge: true },
        { k: "toko", ko: "학생", rr: "haksaeng", g: "student", wrong: ["선생님", "의사", "가족"], variant: true },
        { k: "fill", blank: "저는 의사____.", ko: "저는 의사예요.", rr: "jeoneun uisayeyo.", answers: ["예요", "입니다"], g: "iAmDoctor", ans_rr: "yeyo", note: "ieyo", variant: true },
      ] },
      { skill: "family", items: [
        { k: "meaning", ko: "가족", rr: "gajok", g: "family", wrong: ["friend", "teacher", "school"] },
        { k: "meaning", ko: "어머니", rr: "eomeoni", g: "mother", wrong: ["father", "grandmother", "youngerSibling"] },
        { k: "toko", ko: "아버지", rr: "abeoji", g: "father", wrong: ["어머니", "할머니", "동생"] },
        { k: "tf", ko: "동생", rr: "dongsaeng", claim: "youngerSibling", g: "youngerSibling" },
        { k: "meaning", ko: "할머니", rr: "halmeoni", g: "grandmother", wrong: ["mother", "family", "father"], challenge: true },
        { k: "listen", ko: "아버지", rr: "abeoji", wrong: ["어머니", "할머니", "가족"], variant: true },
        { k: "meaning", ko: "동생", rr: "dongsaeng", g: "youngerSibling", wrong: ["grandmother", "father", "teacher"], variant: true },
      ] },
      { skill: "numbers", items: [
        { k: "meaning", ko: "하나", rr: "hana", g: "one", wrong: ["two", "three", "five"] },
        { k: "number", ko: "셋", rr: "set", n: 3 },
        { k: "toko", ko: "둘", rr: "dul", g: "two", wrong: ["하나", "셋", "넷"] },
        { k: "number", ko: "다섯", rr: "daseot", n: 5 },
        { k: "number", ko: "삼", rr: "sam", n: 3, note: "sino", challenge: true },
        { k: "number", ko: "넷", rr: "net", n: 4, variant: true },
        { k: "number", ko: "일", rr: "il", n: 1, note: "sino", variant: true },
      ] },
    ],
    diagnostic: [
      { k: "meaning", ko: "가족", rr: "gajok", g: "family", wrong: ["school", "friend", "student"] },
      { k: "number", ko: "둘", rr: "dul", n: 2 },
    ],
  },
  {
    level: "K4", emoji: "🏫",
    lessons: [
      { skill: "verbs", items: [
        { k: "meaning", ko: "먹어요.", rr: "meogeoyo.", g: "eat", wrong: ["drink", "sleep", "go"], note: "polite" },
        { k: "meaning", ko: "마셔요.", rr: "masyeoyo.", g: "drink", wrong: ["eat", "come", "study"], note: "polite" },
        { k: "toko", ko: "자요.", rr: "jayo.", g: "sleep", wrong: ["가요.", "와요.", "먹어요."] },
        { k: "tf", ko: "가요.", rr: "gayo.", claim: "go", g: "go" },
        { k: "listen", ko: "공부해요.", rr: "gongbuhaeyo.", wrong: ["마셔요.", "먹어요.", "와요."], challenge: true },
        { k: "meaning", ko: "와요.", rr: "wayo.", g: "come", wrong: ["go", "sleep", "eat"], variant: true },
        { k: "read", ko: "먹어요", rr: "meogeoyo", wrong: ["meokeoyo", "mogoyo", "meogoyo"], variant: true },
      ] },
      { skill: "places", items: [
        { k: "meaning", ko: "학교에 가요.", rr: "hakgyoe gayo.", g: "goSchool", wrong: ["goHome", "comeHome", "goLibrary"], note: "e" },
        { k: "fill", blank: "집____ 가요.", ko: "집에 가요.", rr: "jibe gayo.", answers: ["에"], g: "goHome", ans_rr: "e", note: "e" },
        { k: "choose", options: ["학교에 가요.", "집에 가요.", "학교에 와요.", "집에 와요."], ko: "학교에 가요.", rr: "hakgyoe gayo.", g: "goSchool" },
        { k: "order", parts: ["저는", "학교에", "가요."], ko: "저는 학교에 가요.", rr: "jeoneun hakgyoe gayo.", g: "goSchool", note: "verbEnd" },
        { k: "fill", blank: "도서관____ 가요.", ko: "도서관에 가요.", rr: "doseogwane gayo.", answers: ["에"], g: "goLibrary", ans_rr: "e", note: "e", challenge: true },
        { k: "meaning", ko: "집에 와요.", rr: "jibe wayo.", g: "comeHome", wrong: ["goHome", "goSchool", "goLibrary"], variant: true },
        { k: "tf", ko: "집에 가요.", rr: "jibe gayo.", claim: "goSchool", g: "goHome", variant: true },
      ] },
      { skill: "objects", items: [
        { k: "meaning", ko: "밥을 먹어요.", rr: "babeul meogeoyo.", g: "eatMeal", wrong: ["drinkWater", "readBook", "drinkCoffee"], note: "eul" },
        { k: "fill", blank: "물____ 마셔요.", ko: "물을 마셔요.", rr: "mureul masyeoyo.", answers: ["을"], g: "drinkWater", ans_rr: "eul", note: "eul" },
        { k: "fill", blank: "커피____ 마셔요.", ko: "커피를 마셔요.", rr: "keopireul masyeoyo.", answers: ["를"], g: "drinkCoffee", ans_rr: "reul", note: "eul" },
        { k: "order", parts: ["저는", "책을", "읽어요."], ko: "저는 책을 읽어요.", rr: "jeoneun chaegeul ilgeoyo.", g: "readBook", note: "verbEnd" },
        { k: "choose", options: ["사과를 먹어요.", "사과을 먹어요.", "사과에 먹어요.", "사과 먹어를요."], ko: "사과를 먹어요.", rr: "sagwareul meogeoyo.", g: "eatApple", note: "eul", challenge: true },
        { k: "meaning", ko: "책을 읽어요.", rr: "chaegeul ilgeoyo.", g: "readBook", wrong: ["eatMeal", "drinkWater", "goSchool"], variant: true },
        { k: "fill", blank: "밥____ 먹어요.", ko: "밥을 먹어요.", rr: "babeul meogeoyo.", answers: ["을"], g: "eatMeal", ans_rr: "eul", note: "eul", variant: true },
      ] },
    ],
    diagnostic: [
      { k: "meaning", ko: "마셔요.", rr: "masyeoyo.", g: "drink", wrong: ["eat", "sleep", "come"] },
      { k: "fill", blank: "물____ 마셔요.", ko: "물을 마셔요.", rr: "mureul masyeoyo.", answers: ["을"], g: "drinkWater", ans_rr: "eul", note: "eul" },
    ],
  },
  {
    level: "K5", emoji: "📅",
    lessons: [
      { skill: "time", items: [
        { k: "meaning", ko: "어제", rr: "eoje", g: "yesterday", wrong: ["today", "tomorrow", "now"] },
        { k: "meaning", ko: "내일", rr: "naeil", g: "tomorrow", wrong: ["yesterday", "today", "now"] },
        { k: "toko", ko: "오늘", rr: "oneul", g: "today", wrong: ["어제", "내일", "지금"] },
        { k: "tf", ko: "내일", rr: "naeil", claim: "yesterday", g: "tomorrow" },
        { k: "order", parts: ["저는", "어제", "학교에", "갔어요."], ko: "저는 어제 학교에 갔어요.", rr: "jeoneun eoje hakgyoe gasseoyo.", g: "wentSchoolYesterday", note: "verbEnd", challenge: true },
        { k: "listen", ko: "오늘", rr: "oneul", wrong: ["어제", "내일", "오후"], variant: true },
        { k: "meaning", ko: "지금", rr: "jigeum", g: "now", wrong: ["tomorrow", "yesterday", "today"], variant: true },
      ] },
      { skill: "past", items: [
        { k: "meaning", ko: "먹었어요.", rr: "meogeosseoyo.", g: "ate", wrong: ["eat", "willEat", "drank"], note: "past" },
        { k: "meaning", ko: "갔어요.", rr: "gasseoyo.", g: "went", wrong: ["go", "willGo", "came"], note: "past" },
        { k: "fill", blank: "어제 영화를 ____.", ko: "어제 영화를 봤어요.", rr: "eoje yeonghwareul bwasseoyo.", answers: ["봤어요", "보았어요"], g: "watchedMovie", ans_rr: "bwasseoyo", note: "past" },
        { k: "tf", ko: "마셨어요.", rr: "masyeosseoyo.", claim: "drank", g: "drank", note: "past" },
        { k: "choose", options: ["공부했어요.", "공부해요.", "공부할 거예요.", "공부하세요."], ko: "공부했어요.", rr: "gongbuhaesseoyo.", g: "studied", note: "past", challenge: true },
        { k: "meaning", ko: "봤어요.", rr: "bwasseoyo.", g: "saw", wrong: ["went", "ate", "drank"], variant: true },
        { k: "read", ko: "갔어요", rr: "gasseoyo", wrong: ["gaseoyo", "gatseoyo", "gasseyo"], variant: true },
      ] },
      { skill: "plans", items: [
        { k: "meaning", ko: "내일 갈 거예요.", rr: "naeil gal geoyeyo.", g: "willGoTomorrow", wrong: ["went", "goNow", "willEat"], note: "future" },
        { k: "meaning", ko: "먹을 거예요.", rr: "meogeul geoyeyo.", g: "willEat", wrong: ["ate", "eat", "willGoTomorrow"], note: "future" },
        { k: "toko", ko: "공부할 거예요.", rr: "gongbuhal geoyeyo.", g: "willStudy", wrong: ["공부했어요.", "공부해요.", "공부하고 싶어요."] },
        { k: "tf", ko: "갈 거예요.", rr: "gal geoyeyo.", claim: "went", g: "willGo", note: "future" },
        { k: "order", parts: ["저는", "내일", "친구를", "만날 거예요."], ko: "저는 내일 친구를 만날 거예요.", rr: "jeoneun naeil chingureul mannal geoyeyo.", g: "willMeetFriend", note: "future", challenge: true },
        { k: "fill", blank: "내일 영화를 ____ 거예요.", ko: "내일 영화를 볼 거예요.", rr: "naeil yeonghwareul bol geoyeyo.", answers: ["볼"], g: "willWatchMovie", ans_rr: "bol", note: "future", variant: true },
        { k: "listen", ko: "갈 거예요.", rr: "gal geoyeyo.", wrong: ["갔어요.", "가요.", "가고 싶어요."], variant: true },
      ] },
    ],
    diagnostic: [
      { k: "meaning", ko: "어제", rr: "eoje", g: "yesterday", wrong: ["tomorrow", "today", "now"] },
      { k: "meaning", ko: "갔어요.", rr: "gasseoyo.", g: "went", wrong: ["willGo", "go", "ate"] },
    ],
  },
  {
    level: "K6", emoji: "🛍️",
    lessons: [
      { skill: "shopping", items: [
        { k: "meaning", ko: "얼마예요?", rr: "eolmayeyo?", g: "howMuch", wrong: ["whereIs", "whatTime", "thisPlease"] },
        { k: "meaning", ko: "이거 주세요.", rr: "igeo juseyo.", g: "thisPlease", wrong: ["howMuch", "tooExpensive", "waterPlease"] },
        { k: "toko", ko: "물 주세요.", rr: "mul juseyo.", g: "waterPlease", wrong: ["이거 주세요.", "얼마예요?", "괜찮아요."] },
        { k: "number", ko: "오천 원", rr: "ocheon won", n: 5000, note: "won" },
        { k: "tf", ko: "너무 비싸요.", rr: "neomu bissayo.", claim: "tooExpensive", g: "tooExpensive", challenge: true },
        { k: "listen", ko: "얼마예요?", rr: "eolmayeyo?", wrong: ["어디예요?", "몇 시예요?", "이거 주세요."], variant: true },
        { k: "meaning", ko: "너무 비싸요.", rr: "neomu bissayo.", g: "tooExpensive", wrong: ["howMuch", "thisPlease", "okay"], variant: true },
      ] },
      { skill: "directions", items: [
        { k: "meaning", ko: "화장실이 어디예요?", rr: "hwajangsiri eodiyeyo?", g: "whereRestroom", wrong: ["howMuch", "whatTime", "whereStation"] },
        { k: "meaning", ko: "오른쪽", rr: "oreunjjok", g: "right", wrong: ["left", "straight", "back"] },
        { k: "toko", ko: "왼쪽", rr: "oenjjok", g: "left", wrong: ["오른쪽", "앞", "뒤"] },
        { k: "fill", blank: "역이 ____예요?", ko: "역이 어디예요?", rr: "yeogi eodiyeyo?", answers: ["어디"], g: "whereStation", ans_rr: "eodi" },
        { k: "order", parts: ["은행이", "어디에", "있어요?"], ko: "은행이 어디에 있어요?", rr: "eunhaengi eodie isseoyo?", g: "whereBank", note: "verbEnd", challenge: true },
        { k: "meaning", ko: "왼쪽", rr: "oenjjok", g: "left", wrong: ["right", "back", "straight"], variant: true },
        { k: "tf", ko: "직진하세요.", rr: "jikjinhaseyo.", claim: "straight", g: "straight", variant: true },
      ] },
      { skill: "wants", items: [
        { k: "meaning", ko: "가고 싶어요.", rr: "gago sipeoyo.", g: "wantGo", wrong: ["went", "willGo", "wantEat"], note: "want" },
        { k: "meaning", ko: "몇 시예요?", rr: "myeot siyeyo?", g: "whatTime", wrong: ["howMuch", "whereRestroom", "whatName"] },
        { k: "fill", blank: "저는 한국에 ____ 싶어요.", ko: "저는 한국에 가고 싶어요.", rr: "jeoneun hanguge gago sipeoyo.", answers: ["가고"], g: "wantGoKorea", ans_rr: "gago", note: "want" },
        { k: "toko", ko: "먹고 싶어요.", rr: "meokgo sipeoyo.", g: "wantEat", wrong: ["먹었어요.", "먹을 거예요.", "가고 싶어요."], note: "want" },
        { k: "order", parts: ["저는", "김치를", "먹고", "싶어요."], ko: "저는 김치를 먹고 싶어요.", rr: "jeoneun gimchireul meokgo sipeoyo.", g: "wantEatKimchi", note: "want", challenge: true },
        { k: "tf", ko: "먹고 싶어요.", rr: "meokgo sipeoyo.", claim: "ate", g: "wantEat", note: "want", variant: true },
        { k: "listen", ko: "몇 시예요?", rr: "myeot siyeyo?", wrong: ["얼마예요?", "어디예요?", "누구예요?"], variant: true },
      ] },
    ],
    diagnostic: [
      { k: "meaning", ko: "얼마예요?", rr: "eolmayeyo?", g: "howMuch", wrong: ["whatTime", "whereRestroom", "thisPlease"] },
      { k: "meaning", ko: "가고 싶어요.", rr: "gago sipeoyo.", g: "wantGo", wrong: ["willGo", "went", "go"] },
    ],
  },
];

/** Lesson examples: Korean target + romanization; the gloss after "=" is presentation (kit key). */
export const EXAMPLES = {
  "K1.vowels": [["아 · 어 · 오 · 우 · 으 · 이", "a · eo · o · u · eu · i", null]],
  "K1.consonants": [["가 · 나 · 다 · 마 · 바 · 사 · 하", "ga · na · da · ma · ba · sa · ha", null]],
  "K1.words": [["우유", "uyu", "milk"], ["나무", "namu", "tree"]],
  "K2.greetings": [["안녕하세요.", "annyeonghaseyo.", "hello"], ["감사합니다.", "gamsahamnida.", "thanks"]],
  "K2.answers": [["네.", "ne.", "yes"], ["아니요.", "aniyo.", "no"]],
  "K2.meeting": [["만나서 반갑습니다.", "mannaseo bangapseumnida.", "niceToMeet"]],
  "K3.self": [["저는 학생이에요.", "jeoneun haksaengieyo.", "iAmStudent"]],
  "K3.family": [["가족", "gajok", "family"], ["어머니", "eomeoni", "mother"]],
  "K3.numbers": [["하나 · 둘 · 셋", "hana · dul · set", null]],
  "K4.verbs": [["먹어요.", "meogeoyo.", "eat"], ["마셔요.", "masyeoyo.", "drink"]],
  "K4.places": [["학교에 가요.", "hakgyoe gayo.", "goSchool"]],
  "K4.objects": [["밥을 먹어요.", "babeul meogeoyo.", "eatMeal"]],
  "K5.time": [["어제 · 오늘 · 내일", "eoje · oneul · naeil", null]],
  "K5.past": [["먹었어요.", "meogeosseoyo.", "ate"]],
  "K5.plans": [["내일 갈 거예요.", "naeil gal geoyeyo.", "willGoTomorrow"]],
  "K6.shopping": [["얼마예요?", "eolmayeyo?", "howMuch"]],
  "K6.directions": [["화장실이 어디예요?", "hwajangsiri eodiyeyo?", "whereRestroom"]],
  "K6.wants": [["가고 싶어요.", "gago sipeoyo.", "wantGo"]],
};

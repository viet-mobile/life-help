// study.korean.life.help — additional lessons for K1..K6 (6 per level, on top of the first 3 in course.mjs).
// Same item model as course.mjs (see the header there). Items: 4 core + 1 challenge + 2 variants per lesson.
const M = (ko, rr, g, wrong, o = {}) => ({ k: "meaning", ko, rr, g, wrong, ...o });
const T = (ko, rr, g, wrong, o = {}) => ({ k: "toko", ko, rr, g, wrong, ...o });
const R = (ko, rr, wrong, o = {}) => ({ k: "read", ko, rr, wrong, ...o });
const L = (ko, rr, wrong, o = {}) => ({ k: "listen", ko, rr, wrong, ...o });
const F = (blank, ko, rr, answers, g, ans_rr, o = {}) => ({ k: "fill", blank, ko, rr, answers, g, ans_rr, ...o });
const O = (parts, ko, rr, g, o = {}) => ({ k: "order", parts, ko, rr, g, ...o });
const N = (ko, rr, n, o = {}) => ({ k: "number", ko, rr, n, ...o });
const TF = (ko, rr, claim, g, o = {}) => ({ k: "tf", ko, rr, claim, g, ...o });
const C = (options, ko, rr, g, o = {}) => ({ k: "choose", options, ko, rr, g, ...o });
const c = { challenge: true }, v = { variant: true };

export const EXTRA_LESSONS = {
  K1: [
    { skill: "yvowels", items: [
      R("야", "ya", ["yeo", "yo", "yu"]), R("여", "yeo", ["ya", "yo", "yu"]), R("요", "yo", ["yu", "yeo", "ya"]), R("유", "yu", ["yo", "yeo", "eu"]),
      R("애", "ae", ["e", "a", "ya"], c), R("에", "e", ["ae", "i", "eo"], v), L("요", "yo", ["여", "유", "우"], v),
    ] },
    { skill: "consonants2", items: [
      R("라", "ra", ["na", "da", "ga"]), R("자", "ja", ["cha", "sa", "da"]), R("차", "cha", ["ja", "ka", "ta"]), R("카", "ka", ["ga", "ta", "pa"]),
      R("타", "ta", ["da", "ka", "pa"], c), R("파", "pa", ["ba", "ta", "ka"], v), L("자", "ja", ["차", "사", "하"], v),
    ] },
    { skill: "doubled", items: [
      R("까", "kka", ["ga", "ka", "sa"]), R("따", "tta", ["da", "ta", "ppa"]), R("빠", "ppa", ["ba", "pa", "tta"]), R("싸", "ssa", ["sa", "ja", "ha"]),
      R("짜", "jja", ["ja", "cha", "ssa"], c), M("아빠", "appa", "dad", ["mother", "child", "tree"], v), L("따", "tta", ["다", "타", "까"], v),
    ] },
    { skill: "batchim", items: [
      R("안", "an", ["ang", "am", "al"]), R("말", "mal", ["man", "mam", "mang"]), R("밤", "bam", ["ban", "bang", "bal"]), R("강", "gang", ["gan", "gam", "gal"]),
      R("집", "jip", ["jin", "jim", "jil"], c), R("책", "chaek", ["chaen", "chaem", "chaeng"], v), L("물", "mul", ["문", "불", "풀"], v),
    ] },
    { skill: "words2", items: [
      M("사과", "sagwa", "apple", ["book", "water", "house"]), M("학교", "hakgyo", "school", ["apple", "friend", "house"]),
      T("책", "chaek", "book", ["사과", "물", "집"]), M("물", "mul", "water", ["book", "school", "friend"]),
      T("친구", "chingu", "friend", ["학교", "집", "책"], c), L("사과", "sagwa", ["학교", "책", "물"], v), M("집", "jip", "house", ["water", "school", "apple"], v),
    ] },
    { skill: "words3", items: [
      M("사람", "saram", "person", ["friend", "child", "tree"]), M("나라", "nara", "country", ["sea", "house", "school"]),
      T("하늘", "haneul", "sky", ["바다", "나무", "산"]), M("산", "san", "mountain", ["sea", "sky", "tree"]),
      M("꽃", "kkot", "flower", ["tree", "mountain", "sky"], c), T("강", "gang", "river", ["바다", "산", "하늘"], v), L("꽃", "kkot", ["산", "강", "나라"], v),
    ] },
  ],
  K2: [
    { skill: "manners", items: [
      M("실례합니다.", "sillyehamnida.", "excuseMe", ["sorry", "thanks", "hello"]), M("고마워요.", "gomawoyo.", "thanksCasual", ["excuseMe", "sorry", "hello"]),
      T("천만에요.", "cheonmaneyo.", "youreWelcome", ["감사합니다.", "죄송합니다.", "괜찮아요."]), TF("축하해요.", "chukahaeyo.", "sorry", "congrats"),
      L("실례합니다.", "sillyehamnida.", ["고마워요.", "천만에요.", "죄송합니다."], c), M("축하해요.", "chukahaeyo.", "congrats", ["youreWelcome", "sorry", "excuseMe"], v),
      T("고마워요.", "gomawoyo.", "thanksCasual", ["천만에요.", "실례합니다.", "죄송합니다."], v),
    ] },
    { skill: "introduce", items: [
      M("이름이 뭐예요?", "ireumi mwoyeyo?", "whatsYourName", ["whereFrom", "whatTime", "howMuch"]), M("어느 나라 사람이에요?", "eoneu nara saramieyo?", "whereFrom", ["whatsYourName", "whatTime", "howMuch"]),
      F("저는 베트남 ____이에요.", "저는 베트남 사람이에요.", "jeoneun beteunam saramieyo.", ["사람"], "iAmVietnamese", "saram"),
      O(["제", "이름은", "미나예요."], "제 이름은 미나예요.", "je ireumeun minayeyo.", "myNameMina"),
      T("어느 나라 사람이에요?", "eoneu nara saramieyo?", "whereFrom", ["이름이 뭐예요?", "몇 시예요?", "얼마예요?"], c),
      TF("이름이 뭐예요?", "ireumi mwoyeyo?", "whereFrom", "whatsYourName", v), L("어느 나라 사람이에요?", "eoneu nara saramieyo?", ["이름이 뭐예요?", "몇 시예요?", "얼마예요?"], v),
    ] },
    { skill: "partings", items: [
      M("잘 가요.", "jal gayo.", "goodbyeCasual", ["hello", "thanks", "seeTomorrow"]), M("내일 봐요.", "naeil bwayo.", "seeTomorrow", ["goodbyeCasual", "hello", "sorry"]),
      T("또 만나요.", "tto mannayo.", "seeAgain", ["잘 가요.", "내일 봐요.", "안녕하세요."]), TF("잘 자요.", "jal jayo.", "goodNight", "goodNight"),
      L("내일 봐요.", "naeil bwayo.", ["잘 가요.", "또 만나요.", "잘 자요."], c), M("또 만나요.", "tto mannayo.", "seeAgain", ["seeTomorrow", "goodNight", "hello"], v),
      M("잘 자요.", "jal jayo.", "goodNight", ["goodbyeCasual", "seeAgain", "thanks"], v),
    ] },
    { skill: "wellbeing", items: [
      M("잘 지내요.", "jal jinaeyo.", "imFine", ["howHaveYouBeen", "sorry", "thanks"]), M("잘 지냈어요?", "jal jinaesseoyo?", "howHaveYouBeen", ["imFine", "whereFrom", "whatsYourName"]),
      F("저는 잘 ____.", "저는 잘 지내요.", "jeoneun jal jinaeyo.", ["지내요"], "imFine", "jinaeyo"), O(["저는", "잘", "지내요."], "저는 잘 지내요.", "jeoneun jal jinaeyo.", "imFine"),
      T("잘 지냈어요?", "jal jinaesseoyo?", "howHaveYouBeen", ["잘 지내요.", "이름이 뭐예요?", "안녕히 가세요."], c),
      TF("잘 지내요.", "jal jinaeyo.", "sorry", "imFine", v), M("좋은 아침이에요.", "joeun achimieyo.", "goodMorning", ["goodNight", "hello", "imFine"], v),
    ] },
    { skill: "helpme", items: [
      M("도와주세요.", "dowajuseyo.", "helpMe", ["thisPlease", "waterPlease", "thanks"]), M("모르겠어요.", "moreugesseoyo.", "dontKnow", ["understand", "yes", "no"]),
      M("알겠어요.", "algesseoyo.", "understand", ["dontKnow", "yes", "okay"]), O(["다시", "말해", "주세요."], "다시 말해 주세요.", "dasi malhae juseyo.", "sayAgain"),
      T("천천히 말해 주세요.", "cheoncheonhi malhae juseyo.", "speakSlowly", ["다시 말해 주세요.", "도와주세요.", "이거 주세요."], c),
      TF("알겠어요.", "algesseoyo.", "dontKnow", "understand", v), L("도와주세요.", "dowajuseyo.", ["알겠어요.", "모르겠어요.", "이거 주세요."], v),
    ] },
    { skill: "opinions", items: [
      M("좋아요.", "joayo.", "good", ["dislike", "no", "sorry"]), M("싫어요.", "sireoyo.", "dislike", ["good", "yes", "sorry"]),
      M("맞아요.", "majayo.", "correct", ["incorrect", "no", "dislike"]), M("틀려요.", "teullyeoyo.", "incorrect", ["correct", "good", "dislike"]),
      T("맞아요.", "majayo.", "correct", ["틀려요.", "싫어요.", "아니요."], c), TF("싫어요.", "sireoyo.", "good", "dislike", v), L("좋아요.", "joayo.", ["싫어요.", "맞아요.", "틀려요."], v),
    ] },
    { skill: "signs", items: [
      M("입구", "ipgu", "entrance", ["exit", "restroom", "parkingLot"]), M("출구", "chulgu", "exit", ["entrance", "restroom", "emergencyExit"]),
      T("화장실", "hwajangsil", "restroom", ["입구", "출구", "주차장"]), M("주차장", "juchajang", "parkingLot", ["restroom", "exit", "entrance"]),
      T("비상구", "bisanggu", "emergencyExit", ["입구", "화장실", "주차장"], c), L("출구", "chulgu", ["입구", "비상구", "화장실"], v),
      M("당기세요.", "danggiseyo.", "pull", ["push", "exit", "entrance"], v),
    ] },
    { skill: "culture", items: [
      M("잘 먹겠습니다.", "jal meokgetseumnida.", "beforeMeal", ["afterMeal", "welcome", "thanks"]), M("잘 먹었습니다.", "jal meogeotseumnida.", "afterMeal", ["beforeMeal", "delicious", "welcome"]),
      M("어서 오세요.", "eoseo oseyo.", "welcome", ["goodbyeCasual", "beforeMeal", "excuseMe"]), T("맛있어요.", "masisseoyo.", "delicious", ["잘 먹었습니다.", "어서 오세요.", "잘 먹겠습니다."]),
      F("잘 ____.", "잘 먹겠습니다.", "jal meokgetseumnida.", ["먹겠습니다"], "beforeMeal", "meokgetseumnida", c),
      TF("잘 먹었습니다.", "jal meogeotseumnida.", "beforeMeal", "afterMeal", v), L("어서 오세요.", "eoseo oseyo.", ["잘 먹겠습니다.", "잘 먹었습니다.", "맛있어요."], v),
    ] },
  ],
  K3: [
    { skill: "native10", items: [
      N("여섯", "yeoseot", 6, { note: "native" }), N("일곱", "ilgop", 7), N("여덟", "yeodeol", 8), N("아홉", "ahop", 9),
      N("열", "yeol", 10, c), M("여덟", "yeodeol", "eight", ["six", "nine", "ten"], v), L("아홉", "ahop", ["여덟", "일곱", "여섯"], v),
    ] },
    { skill: "sino", items: [
      N("이", "i", 2, { note: "sino" }), N("사", "sa", 4), N("육", "yuk", 6), N("칠", "chil", 7),
      N("십", "sip", 10, c), N("구", "gu", 9, v), N("팔", "pal", 8, v),
    ] },
    { skill: "ages", items: [
      M("나이", "nai", "age", ["family", "friend", "school"]), M("몇 살이에요?", "myeot sarieyo?", "howOld", ["whatTime", "howMuch", "whatsYourName"]),
      M("저는 열 살이에요.", "jeoneun yeol sarieyo.", "iAmTenYears", ["iAmTwentyYears", "iAmThirtyYears", "iAmStudent"]),
      F("저는 열 ____이에요.", "저는 열 살이에요.", "jeoneun yeol sarieyo.", ["살"], "iAmTenYears", "sal"),
      T("스무 살", "seumu sal", "twentyYears", ["열 살", "서른 살", "한 살"], c), TF("서른 살", "seoreun sal", "twentyYears", "thirtyYears", v),
      M("스무 살", "seumu sal", "twentyYears", ["tenYears", "thirtyYears", "oneYear"], v),
    ] },
    { skill: "people", items: [
      M("친구", "chingu", "friend", ["teacher", "doctor", "student"]), M("의사", "uisa", "doctor", ["teacher", "student", "friend"]),
      T("사람", "saram", "person", ["친구", "의사", "가족"]), M("남자", "namja", "man", ["woman", "child", "person"]),
      T("여자", "yeoja", "woman", ["남자", "아이", "사람"], c), M("여자", "yeoja", "woman", ["man", "doctor", "friend"], v), TF("남자", "namja", "woman", "man", v),
    ] },
    { skill: "family2", items: [
      M("오빠", "oppa", "olderBrotherF", ["olderSisterF", "youngerSibling", "father"]), M("언니", "eonni", "olderSisterF", ["olderBrotherF", "mother", "daughter"]),
      M("아들", "adeul", "son", ["daughter", "father", "youngerSibling"]), M("딸", "ttal", "daughter", ["son", "mother", "olderSisterF"]),
      M("부모님", "bumonim", "parents", ["family", "grandmother", "friend"], c), T("아들", "adeul", "son", ["딸", "오빠", "동생"], v), L("언니", "eonni", ["오빠", "딸", "아들"], v),
    ] },
    { skill: "ourfamily", items: [
      M("우리", "uri", "we", ["I", "you", "friend"]), M("우리 가족", "uri gajok", "ourFamily", ["family", "myFamily", "friend"]),
      M("제 가족", "je gajok", "myFamily", ["ourFamily", "family", "teacher"]),
      F("우리 가족은 네 ____이에요.", "우리 가족은 네 명이에요.", "uri gajogeun ne myeongieyo.", ["명"], "familyOfFour", "myeong"),
      O(["우리", "가족은", "네", "명이에요."], "우리 가족은 네 명이에요.", "uri gajogeun ne myeongieyo.", "familyOfFour", c),
      M("형제가 없어요.", "hyeongjega eopseoyo.", "noSiblings", ["haveSiblings", "ourFamily", "myFamily"], v), TF("우리 가족", "uri gajok", "myFamily", "ourFamily", v),
    ] },
    { skill: "messages", items: [
      M("지금 어디예요?", "jigeum eodiyeyo?", "whereAreYouNow", ["comingSoon", "imLate", "arrivedHome"]), M("곧 가요.", "got gayo.", "comingSoon", ["whereAreYouNow", "imLate", "arrivedHome"]),
      M("늦어요.", "neujeoyo.", "imLate", ["comingSoon", "arrivedHome", "whereAreYouNow"]), M("집에 왔어요.", "jibe wasseoyo.", "arrivedHome", ["imLate", "comingSoon", "whereAreYouNow"]),
      O(["지금", "집에", "가요."], "지금 집에 가요.", "jigeum jibe gayo.", "goingHomeNow", c),
      T("곧 가요.", "got gayo.", "comingSoon", ["늦어요.", "지금 어디예요?", "집에 왔어요."], v), L("늦어요.", "neujeoyo.", ["곧 가요.", "집에 왔어요.", "지금 어디예요?"], v),
    ] },
    { skill: "sounds", items: [
      R("책이", "chaegi", ["chaeki", "chaeni", "chaeji"]), R("밥을", "babeul", ["bapeul", "babul", "bameul"]),
      R("국물", "gungmul", ["gukmul", "gugmul", "gungbul"]), R("같이", "gachi", ["gati", "gaji", "gasi"]),
      R("읽어요", "ilgeoyo", ["ikeoyo", "ilkeoyo", "igeoyo"], c), R("집에", "jibe", ["jipe", "jine", "jime"], v), L("책이", "chaegi", ["책을", "집에", "밥을"], v),
    ] },
  ],
  K4: [
    { skill: "food", items: [
      M("빵", "ppang", "bread", ["rice", "fruit", "meat"]), M("과일", "gwail", "fruit", ["bread", "meat", "rice"]),
      T("고기", "gogi", "meat", ["빵", "과일", "밥"]), M("밥", "bap", "rice", ["bread", "meat", "water"]),
      T("물", "mul", "water", ["밥", "빵", "우유"], c), L("과일", "gwail", ["고기", "빵", "우유"], v), M("고기", "gogi", "meat", ["fruit", "bread", "milk"], v),
    ] },
    { skill: "likes", items: [
      M("좋아해요.", "joahaeyo.", "like", ["dontLike", "eat", "go"]), M("싫어해요.", "sireohaeyo.", "dontLike", ["like", "drink", "sleep"]),
      F("저는 사과를 ____.", "저는 사과를 좋아해요.", "jeoneun sagwareul joahaeyo.", ["좋아해요"], "iLikeApples", "joahaeyo"),
      O(["저는", "김치를", "좋아해요."], "저는 김치를 좋아해요.", "jeoneun gimchireul joahaeyo.", "iLikeKimchi"),
      T("저는 고기를 좋아해요.", "jeoneun gogireul joahaeyo.", "iLikeMeat", ["저는 고기를 싫어해요.", "저는 고기를 먹었어요.", "저는 고기를 먹을 거예요."], c),
      TF("좋아해요.", "joahaeyo.", "dontLike", "like", v), M("저는 사과를 좋아해요.", "jeoneun sagwareul joahaeyo.", "iLikeApples", ["iLikeKimchi", "iLikeMeat", "eatApple"], v),
    ] },
    { skill: "adjectives", items: [
      M("커요.", "keoyo.", "big", ["small", "many", "delicious"]), M("작아요.", "jagayo.", "small", ["big", "many", "delicious"]),
      M("많아요.", "manayo.", "many", ["big", "small", "delicious"]), M("맛있어요.", "masisseoyo.", "delicious", ["big", "small", "many"]),
      M("예뻐요.", "yeppeoyo.", "pretty", ["big", "small", "delicious"], c), T("작아요.", "jagayo.", "small", ["커요.", "많아요.", "맛있어요."], v), TF("맛있어요.", "masisseoyo.", "big", "delicious", v),
    ] },
    { skill: "weather", items: [
      M("날씨", "nalssi", "weather", ["today", "tomorrow", "yesterday"]), M("더워요.", "deowoyo.", "hot", ["cold", "itRains", "big"]),
      T("추워요.", "chuwoyo.", "cold", ["더워요.", "비가 와요.", "작아요."]), M("비가 와요.", "biga wayo.", "itRains", ["itSnows", "hot", "cold"]),
      M("눈이 와요.", "nuni wayo.", "itSnows", ["itRains", "hot", "cold"], c), M("오늘 날씨가 좋아요.", "oneul nalssiga joayo.", "weatherGood", ["itRains", "itSnows", "hot"], v),
      TF("추워요.", "chuwoyo.", "hot", "cold", v),
    ] },
    { skill: "negation", items: [
      M("안 먹어요.", "an meogeoyo.", "dontEat", ["eat", "ate", "willEat"]), M("안 가요.", "an gayo.", "dontGo", ["go", "went", "willGo"]),
      M("못 가요.", "mot gayo.", "cantGo", ["dontGo", "go", "went"]),
      F("저는 커피를 ____ 마셔요.", "저는 커피를 안 마셔요.", "jeoneun keopireul an masyeoyo.", ["안"], "dontDrinkCoffee", "an"),
      T("못 먹어요.", "mot meogeoyo.", "cantEat", ["안 먹어요.", "먹어요.", "먹었어요."], c), TF("안 가요.", "an gayo.", "go", "dontGo", v),
      M("못 마셔요.", "mot masyeoyo.", "cantDrink", ["drink", "dontEat", "cantEat"], v),
    ] },
    { skill: "daily", items: [
      M("일어나요.", "ireonayo.", "wakeUp", ["sleep", "wash", "work"]), M("씻어요.", "ssiseoyo.", "wash", ["wakeUp", "work", "sleep"]),
      T("일해요.", "ilhaeyo.", "work", ["공부해요.", "일어나요.", "자요."]), O(["저는", "아침에", "일어나요."], "저는 아침에 일어나요.", "jeoneun achime ireonayo.", "iWakeUpMorning"),
      F("저는 밤에 ____.", "저는 밤에 자요.", "jeoneun bame jayo.", ["자요"], "iSleepNight", "jayo", c),
      M("아침", "achim", "morning", ["night", "afternoon", "today"], v), L("씻어요.", "ssiseoyo.", ["일어나요.", "일해요.", "자요."], v),
    ] },
  ],
  K5: [
    { skill: "weekdays", items: [
      M("월요일", "woryoil", "monday", ["tuesday", "wednesday", "sunday"]), M("화요일", "hwayoil", "tuesday", ["monday", "wednesday", "friday"]),
      M("수요일", "suyoil", "wednesday", ["tuesday", "friday", "saturday"]), M("금요일", "geumyoil", "friday", ["wednesday", "saturday", "monday"]),
      T("일요일", "iryoil", "sunday", ["월요일", "토요일", "금요일"], c), M("토요일", "toyoil", "saturday", ["sunday", "friday", "monday"], v), TF("화요일", "hwayoil", "wednesday", "tuesday", v),
    ] },
    { skill: "months", items: [
      M("일월", "irwol", "january", ["march", "may", "december"]), M("삼월", "samwol", "march", ["january", "may", "december"]),
      M("오월", "owol", "may", ["march", "july", "december"]), M("십이월", "sibiwol", "december", ["january", "may", "september"]),
      T("칠월", "chilwol", "july", ["일월", "삼월", "오월"], c), M("구월", "guwol", "september", ["july", "may", "december"], v), TF("오월", "owol", "march", "may", v),
    ] },
    { skill: "clock", items: [
      M("한 시", "han si", "oneOclock", ["twoOclock", "threeOclock", "tenOclock"]), M("두 시", "du si", "twoOclock", ["oneOclock", "threeOclock", "tenOclock"]),
      T("세 시", "se si", "threeOclock", ["한 시", "두 시", "열 시"]), F("지금 ____ 시예요.", "지금 세 시예요.", "jigeum se siyeyo.", ["세"], "nowThree", "se"),
      O(["지금", "열", "시예요."], "지금 열 시예요.", "jigeum yeol siyeyo.", "nowTen", c), TF("열 시", "yeol si", "oneOclock", "tenOclock", v), L("두 시", "du si", ["한 시", "세 시", "열 시"], v),
    ] },
    { skill: "frequency", items: [
      M("매일", "maeil", "everyDay", ["sometimes", "always", "often"]), M("자주", "jaju", "often", ["everyDay", "sometimes", "always"]),
      M("가끔", "gakkeum", "sometimes", ["everyDay", "often", "always"]), M("항상", "hangsang", "always", ["sometimes", "often", "everyDay"]),
      O(["저는", "매일", "공부해요."], "저는 매일 공부해요.", "jeoneun maeil gongbuhaeyo.", "iStudyEveryDay", c),
      F("저는 ____ 커피를 마셔요.", "저는 매일 커피를 마셔요.", "jeoneun maeil keopireul masyeoyo.", ["매일"], "iDrinkCoffeeEveryDay", "maeil", v), TF("가끔", "gakkeum", "always", "sometimes", v),
    ] },
    { skill: "past2", items: [
      M("했어요.", "haesseoyo.", "did", ["went", "came", "ate"], { note: "past" }), M("왔어요.", "wasseoyo.", "came", ["went", "did", "ate"]),
      M("만났어요.", "mannasseoyo.", "met", ["saw", "bought", "came"]), T("샀어요.", "sasseoyo.", "bought", ["잤어요.", "갔어요.", "왔어요."]),
      F("어제 친구를 ____.", "어제 친구를 만났어요.", "eoje chingureul mannasseoyo.", ["만났어요", "만났습니다"], "metFriendYesterday", "mannasseoyo", c),
      TF("잤어요.", "jasseoyo.", "ate", "slept", v), L("왔어요.", "wasseoyo.", ["갔어요.", "했어요.", "샀어요."], v),
    ] },
    { skill: "birthday", items: [
      M("생일", "saengil", "birthday", ["today", "weekend", "tomorrow"]), M("생일이 언제예요?", "saengiri eonjeyeyo?", "whenBirthday", ["whatTime", "whereFrom", "howOld"]),
      M("주말", "jumal", "weekend", ["birthday", "today", "tomorrow"]), T("선물", "seonmul", "gift", ["생일", "주말", "친구"]),
      F("제 생일은 ____이에요.", "제 생일은 오월이에요.", "je saengireun owolieyo.", ["오월"], "myBirthdayMay", "owol", c),
      M("선물", "seonmul", "gift", ["birthday", "weekend", "friend"], v), TF("주말", "jumal", "birthday", "weekend", v),
    ] },
  ],
  K6: [
    { skill: "restaurant", items: [
      M("메뉴", "menyu", "menu", ["checkPlease", "waterPlease", "thisPlease"]), M("주문할게요.", "jumunhalgeyo.", "iWillOrder", ["checkPlease", "thisPlease", "howMuch"]),
      T("계산해 주세요.", "gyesanhae juseyo.", "checkPlease", ["이거 주세요.", "물 주세요.", "얼마예요?"]), M("물 더 주세요.", "mul deo juseyo.", "moreWaterPlease", ["waterPlease", "checkPlease", "thisPlease"]),
      O(["김치를", "더", "주세요."], "김치를 더 주세요.", "gimchireul deo juseyo.", "moreKimchiPlease", c), TF("메뉴", "menyu", "thisPlease", "menu", v),
      L("계산해 주세요.", "gyesanhae juseyo.", ["주문할게요.", "이거 주세요.", "얼마예요?"], v),
    ] },
    { skill: "transport", items: [
      M("버스", "beoseu", "bus", ["subway", "taxi", "train"]), M("지하철", "jihacheol", "subway", ["bus", "taxi", "train"]),
      T("택시", "taeksi", "taxi", ["버스", "지하철", "기차"]), F("저는 버스____ 가요.", "저는 버스로 가요.", "jeoneun beoseuro gayo.", ["로"], "goByBus", "ro"),
      O(["저는", "지하철로", "가요."], "저는 지하철로 가요.", "jeoneun jihacheollo gayo.", "goBySubway", c), M("기차", "gicha", "train", ["bus", "subway", "taxi"], v), L("버스", "beoseu", ["택시", "기차", "지하철"], v),
    ] },
    { skill: "phone", items: [
      M("전화", "jeonhwa", "phone", ["textMessage", "phoneNumber", "menu"]), M("전화번호", "jeonhwabeonho", "phoneNumber", ["phone", "textMessage", "menu"]),
      T("문자", "munja", "textMessage", ["전화", "전화번호", "메뉴"]), F("친구에게 ____해요.", "친구에게 전화해요.", "chinguege jeonhwahaeyo.", ["전화"], "callFriend", "jeonhwa"),
      O(["친구에게", "문자를", "보내요."], "친구에게 문자를 보내요.", "chinguege munjareul bonaeyo.", "sendFriendText", c),
      M("전화해요.", "jeonhwahaeyo.", "call", ["textMessage", "phoneNumber", "menu"], v), L("전화번호", "jeonhwabeonho", ["전화", "문자", "메뉴"], v),
    ] },
    { skill: "hospital", items: [
      M("아파요.", "apayo.", "hurts", ["hot", "cold", "big"]), M("병원", "byeongwon", "hospital", ["school", "house", "medicine"]),
      T("약", "yak", "medicine", ["병원", "물", "책"]), M("머리가 아파요.", "meoriga apayo.", "headache", ["goHospital", "hot", "cold"]),
      F("병원에 ____.", "병원에 가요.", "byeongwone gayo.", ["가요"], "goHospital", "gayo", c), TF("약", "yak", "hospital", "medicine", v), L("병원", "byeongwon", ["학교", "약", "집"], v),
    ] },
    { skill: "requests", items: [
      M("앉으세요.", "anjeuseyo.", "pleaseSit", ["pleaseWait", "openDoorPlease", "helpMe"]), M("기다려 주세요.", "gidaryeo juseyo.", "pleaseWait", ["pleaseSit", "openDoorPlease", "helpMe"]),
      T("문을 열어 주세요.", "muneul yeoreo juseyo.", "openDoorPlease", ["앉으세요.", "기다려 주세요.", "도와주세요."]), TF("앉으세요.", "anjeuseyo.", "pleaseWait", "pleaseSit"),
      O(["잠깐", "기다려", "주세요."], "잠깐 기다려 주세요.", "jamkkan gidaryeo juseyo.", "waitAMoment", c),
      F("여기 ____.", "여기 앉으세요.", "yeogi anjeuseyo.", ["앉으세요"], "sitHerePlease", "anjeuseyo", v), L("기다려 주세요.", "gidaryeo juseyo.", ["앉으세요.", "도와주세요.", "이거 주세요."], v),
    ] },
    { skill: "invitations", items: [
      M("같이 가요.", "gachi gayo.", "letsGoTogether", ["wantToGo", "haveTime", "letsEatTogether"]), M("갈래요?", "gallaeyo?", "wantToGo", ["letsGoTogether", "haveTime", "letsEatTogether"]),
      M("시간 있어요?", "sigan isseoyo?", "haveTime", ["wantToGo", "letsGoTogether", "whatTime"]), O(["우리", "같이", "먹어요."], "우리 같이 먹어요.", "uri gachi meogeoyo.", "letsEatTogether"),
      T("같이 공부해요.", "gachi gongbuhaeyo.", "studyTogether", ["같이 가요.", "같이 먹어요.", "혼자 공부해요."], c),
      F("우리 ____ 가요.", "우리 같이 가요.", "uri gachi gayo.", ["같이"], "letsGoTogether", "gachi", v), TF("갈래요?", "gallaeyo?", "haveTime", "wantToGo", v),
    ] },
  ],
};

export const EXTRA_EXAMPLES = {
  "K1.yvowels": [["야 · 여 · 요 · 유", "ya · yeo · yo · yu", null]],
  "K1.consonants2": [["라 · 자 · 차 · 카 · 타 · 파", "ra · ja · cha · ka · ta · pa", null]],
  "K1.doubled": [["까 · 따 · 빠 · 싸 · 짜", "kka · tta · ppa · ssa · jja", null]],
  "K1.batchim": [["안 · 말 · 밤 · 강 · 집", "an · mal · bam · gang · jip", null]],
  "K1.words2": [["사과", "sagwa", "apple"], ["학교", "hakgyo", "school"]],
  "K1.words3": [["사람", "saram", "person"], ["꽃", "kkot", "flower"]],
  "K2.manners": [["실례합니다.", "sillyehamnida.", "excuseMe"], ["고마워요.", "gomawoyo.", "thanksCasual"]],
  "K2.introduce": [["이름이 뭐예요?", "ireumi mwoyeyo?", "whatsYourName"]],
  "K2.partings": [["잘 가요.", "jal gayo.", "goodbyeCasual"], ["내일 봐요.", "naeil bwayo.", "seeTomorrow"]],
  "K2.wellbeing": [["잘 지내요.", "jal jinaeyo.", "imFine"]],
  "K2.helpme": [["도와주세요.", "dowajuseyo.", "helpMe"], ["알겠어요.", "algesseoyo.", "understand"]],
  "K2.signs": [["입구", "ipgu", "entrance"], ["출구", "chulgu", "exit"]],
  "K2.culture": [["잘 먹겠습니다.", "jal meokgetseumnida.", "beforeMeal"], ["잘 먹었습니다.", "jal meogeotseumnida.", "afterMeal"]],
  "K2.opinions": [["좋아요.", "joayo.", "good"], ["싫어요.", "sireoyo.", "dislike"]],
  "K3.messages": [["지금 어디예요?", "jigeum eodiyeyo?", "whereAreYouNow"], ["곧 가요.", "got gayo.", "comingSoon"]],
  "K3.sounds": [["책이", "chaegi", null], ["밥을", "babeul", null]],
  "K3.native10": [["여섯 · 일곱 · 여덟 · 아홉 · 열", "yeoseot · ilgop · yeodeol · ahop · yeol", null]],
  "K3.sino": [["일 · 이 · 삼 · 사 · 오 · 육 · 칠 · 팔 · 구 · 십", "il · i · sam · sa · o · yuk · chil · pal · gu · sip", null]],
  "K3.ages": [["몇 살이에요?", "myeot sarieyo?", "howOld"]],
  "K3.people": [["친구", "chingu", "friend"], ["사람", "saram", "person"]],
  "K3.family2": [["오빠", "oppa", "olderBrotherF"], ["언니", "eonni", "olderSisterF"]],
  "K3.ourfamily": [["우리 가족", "uri gajok", "ourFamily"]],
  "K4.food": [["빵", "ppang", "bread"], ["과일", "gwail", "fruit"]],
  "K4.likes": [["좋아해요.", "joahaeyo.", "like"]],
  "K4.adjectives": [["커요.", "keoyo.", "big"], ["작아요.", "jagayo.", "small"]],
  "K4.weather": [["더워요.", "deowoyo.", "hot"], ["추워요.", "chuwoyo.", "cold"]],
  "K4.negation": [["안 먹어요.", "an meogeoyo.", "dontEat"]],
  "K4.daily": [["일어나요.", "ireonayo.", "wakeUp"]],
  "K5.weekdays": [["월요일 · 화요일 · 수요일", "woryoil · hwayoil · suyoil", null]],
  "K5.months": [["일월 · 삼월 · 오월", "irwol · samwol · owol", null]],
  "K5.clock": [["한 시 · 두 시 · 세 시", "han si · du si · se si", null]],
  "K5.frequency": [["매일", "maeil", "everyDay"], ["가끔", "gakkeum", "sometimes"]],
  "K5.past2": [["했어요.", "haesseoyo.", "did"]],
  "K5.birthday": [["생일이 언제예요?", "saengiri eonjeyeyo?", "whenBirthday"]],
  "K6.restaurant": [["계산해 주세요.", "gyesanhae juseyo.", "checkPlease"]],
  "K6.transport": [["버스", "beoseu", "bus"], ["지하철", "jihacheol", "subway"]],
  "K6.phone": [["전화", "jeonhwa", "phone"]],
  "K6.hospital": [["병원", "byeongwon", "hospital"], ["아파요.", "apayo.", "hurts"]],
  "K6.requests": [["기다려 주세요.", "gidaryeo juseyo.", "pleaseWait"]],
  "K6.invitations": [["같이 가요.", "gachi gayo.", "letsGoTogether"]],
};

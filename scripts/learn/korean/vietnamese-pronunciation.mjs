// User-defined Vietnamese reading aid, not Revised Romanization.
// Map reviewed surface pronunciation, never orthographic batchim. See NIKL
// https://korean.go.kr/kornorms/main/main.do (standard pronunciation, sections 4–7).
export const INITIALS = ["g", "c", "n", "đ", "t", "l", "m", "b", "p", "s", "x", "", "d", "ch", "ch'", "kh", "th", "p'", "h"];
export const VOWELS = ["a", "e", "ya", "ye", "ơ", "ê", "yơ", "yê", "ô", "oa", "oe", "ôe", "yô", "u", "uơ", "uê", "ui", "yu", "ư", "ưi", "i"];
const CODAS = { 0: "", 1: "c", 4: "n", 7: "t", 8: "l", 16: "m", 17: "p", 21: "ng" };
export function transcribeSurface(surface) {
  return [...surface.normalize("NFC")].map((ch) => {
    const n = ch.codePointAt(0) - 0xac00;
    if (n < 0 || n > 11171) {
      if (!/^[ .?!·,\-]$/.test(ch)) throw new Error(`Unsupported pronunciation character: ${ch}`);
      return ch;
    }
    const initial = Math.floor(n / 588), vowel = VOWELS[Math.floor(n % 588 / 28)], coda = n % 28;
    if (!(coda in CODAS)) throw new Error(`Pronunciation must use the seven surface codas: ${ch}`);
    let onset = INITIALS[initial];
    // Only the syllable onset changes; final -c is never rewritten.
    if (/^[eêiy]/.test(vowel)) onset = onset === "c" ? "k" : onset === "g" ? "gh" : onset;
    const reading = onset === "c" && vowel === "oa" ? "qua" : onset === "c" && vowel === "u" ? "qu" : onset + vowel;
    return reading + CODAS[coda];
  }).join("");
}
// Finite, reviewed course vocabulary. New words fail the build until reviewed.
// Liaison, neutralization, assimilation and tensification are resolved here;
// this is deliberately not an incomplete general-purpose Korean G2P engine.
const CHANGED = {
  감사합니다: "감사함니다", 죄송합니다: "죄송함니다", 괜찮아요: "괜차나요",
  반갑습니다: "반갑씀니다", 이름은: "이르믄", 민수입니다: "민수임니다", 입니다: "임니다",
  학생이에요: "학쌩이에요", 학생: "학쌩", 사람이에요: "사라미에요",
  선생님이에요: "선생니미에요",
  셋: "섿", 넷: "넫", 다섯: "다섣", 먹어요: "머거요", 학교에: "학꾜에",
  집에: "지베", 도서관에: "도서과네", 밥을: "바블", 물을: "무를",
  책을: "채글", 읽어요: "일거요", 갔어요: "가써요", 먹었어요: "머거써요",
  봤어요: "봐써요", 보았어요: "보아써요", 마셨어요: "마셔써요", 공부했어요: "공부해써요",
  거예요: "꺼예요", 먹을: "머글", 화장실이: "화장시리", 역이: "여기",
  은행이: "은행이", 있어요: "이써요", 직진하세요: "직찐하세요", 싶어요: "시퍼요",
  몇: "멷", 시예요: "씨예요", 한국에: "한구게", 먹고: "먹꼬",
};
const UNCHANGED = `아 어 오 우 으 이 가 나 마 바 하 사 다 우유 오이 나무 바다 아이 안녕하세요 네 아니요 잠깐만요 만나서 안녕히 가세요 제 예요 계세요 저는 선생님 이에요 선생님이에요 한국 의사예요 가족 어머니 아버지 동생 할머니 하나 둘 삼 일 마셔요 자요 가요 공부해요 와요 에 을 커피를 를 사과를 어제 내일 오늘 지금 영화를 갈 공부할 친구를 만날 볼 얼마예요 이거 주세요 물 오천 원 너무 비싸요 어디예요 오른쪽 왼쪽 어디 어디에 가고 김치를`.split(" ");
const CHANGED_EXTRA = {
  학교: "학꾜",
  꽃: "꼳",
  실례합니다: "실례함니다",
  축하해요: "추카해요",
  이름이: "이르미",
  좋은: "조은",
  아침이에요: "아치미에요",
  지냈어요: "지내써요",
  모르겠어요: "모르게써요",
  알겠어요: "알게써요",
  천천히: "천처니",
  천만에요: "천마네요",
  좋아요: "조아요",
  싫어요: "시러요",
  맞아요: "마자요",
  여섯: "여섣",
  여덟: "여덜",
  살이에요: "사리에요",
  남자: "남짜",
  가족은: "가조근",
  없어요: "업써요",
  좋아해요: "조아해요",
  싫어해요: "시러해요",
  작아요: "자가요",
  많아요: "마나요",
  맛있어요: "마시써요",
  눈이: "누니",
  못: "몯",
  일어나요: "이러나요",
  씻어요: "씨써요",
  일해요: "이래요",
  아침에: "아치메",
  밤에: "바메",
  월요일: "워료일",
  금요일: "그묘일",
  입구: "입꾸",
  먹겠습니다: "먹껃씀니다",
  먹었습니다: "머걷씀니다",
  늦어요: "느저요",
  책이: "채기",
  국물: "궁물",
  일요일: "이료일",
  일월: "이뤌",
  삼월: "사뭘",
  십이월: "시비월",
  칠월: "치뤌",
  했어요: "해써요",
  왔어요: "와써요",
  만났어요: "만나써요",
  샀어요: "사써요",
  만났습니다: "만낟씀니다",
  잤어요: "자써요",
  생일이: "생이리",
  생일은: "생이른",
  오월이에요: "오워리에요",
  주문할게요: "주문할께요",
  계산해: "게산해",
  택시: "택씨",
  전화: "저놔",
  전화번호: "저놔버노",
  문자: "문짜",
  문자를: "문짜를",
  전화해요: "저놔해요",
  병원에: "병워네",
  앉으세요: "안즈세요",
  문을: "무늘",
  열어: "여러",
  같이: "가치",
  말해: "마래",
};
// Extended course words whose surface pronunciation equals their spelling (reviewed: no liaison, tensification or assimilation).
const UNCHANGED_EXTRA = `야 여 요 유 애 라 자 차 카 타 파 까 따 빠 싸 짜 아빠 안 말 밤 강 집 책 사과 친구 사람 나라 하늘 산 고마워요 뭐예요 어느 베트남 미나예요 잘 봐요 또 만나요 지내요 도와주세요 다시 틀려요 일곱 아홉 열 육 칠 십 구 팔 나이 살 스무 서른 의사 여자 오빠 언니 아들 딸 부모님 우리 명이에요 명 형제가 빵 과일 고기 밥 고기를 커요 예뻐요 날씨 더워요 추워요 비가 날씨가 아침 화요일 수요일 토요일 오월 구월 한 시 두 세 매일 자주 가끔 항상 생일 언제예요 주말 선물 메뉴 더 버스 지하철 버스로 로 지하철로 기차 친구에게 보내요 아파요 병원 약 머리가 기다려 잠깐 여기 갈래요 시간 출구 화장실 주차장 비상구 당기세요 어서 오세요 곧 까요`.split(/\s+/);
const WORDS = Object.fromEntries(UNCHANGED.map((w) => [w, w]));
for (const w of UNCHANGED_EXTRA) WORDS[w] = w;
Object.assign(WORDS, CHANGED, CHANGED_EXTRA);
export function pronunciationVi(text) {
  // Obstruent coda + initial ㅅ across this course's phrase boundary.
  const surface = text.replace(/한국 사람이에요/g, "한국 싸라미에요").replace(/곧 가요/g, "곧 까요").replace(/열 시(?![가-힣])/g, "열 씨").replace(/[가-힣]+/g, (word) => {
    if (word === "싸라미에요" || word === "씨") return word;
    if (!(word in WORDS)) throw new Error(`Review Korean surface pronunciation: ${word}`);
    return WORDS[word];
  });
  return transcribeSurface(surface);
}
// Deliberately incorrect readings for read-question distractors. They are not
// passed through pronunciation correction, which could turn a wrong answer right.
export const READ_DISTRACTORS = {
  eo: "어", o: "오", u: "우", a: "아", eu: "으", i: "이",
  na: "나", da: "다", ma: "마", ga: "가", ra: "라", ba: "바", ha: "하", ja: "자", sa: "사", pa: "파",
  namo: "나모", nemu: "네무", numa: "누마",
  gamsahapnida: "감사합니다", gamsahamida: "감사하미다", gamsanida: "감사니다",
  bangabseumnida: "반갑슴니다", bangapsumnida: "반갑쑴니다", bangapnida: "반갑니다",
  meokeoyo: "머커요", mogoyo: "모고요", meogoyo: "머고요",
  yeo: "여", yo: "요", yu: "유", ya: "야", e: "에", ae: "애", cha: "차", ka: "카", ta: "타", ppa: "빠", tta: "따", ssa: "싸",
  ang: "앙", am: "암", al: "알", man: "만", mam: "맘", mang: "망", ban: "반", bang: "방", bal: "발",
  gan: "간", gam: "감", gal: "갈", jin: "진", jim: "짐", jil: "질", chaen: "챈", chaem: "챔", chaeng: "챙",
  chaeki: "채키", chaeni: "채니", chaeji: "채지", bapeul: "밥을", babul: "바불", bameul: "바믈",
  gukmul: "국물", gugmul: "극물", gungbul: "궁불", gati: "가티", gaji: "가지", gasi: "가시",
  ikeoyo: "이커요", ilkeoyo: "일커요", igeoyo: "이거요", jipe: "집에", jine: "지네", jime: "지메",
  gaseoyo: "가서요", gatseoyo: "갇서요", gasseyo: "가쎄요",
};
export function distractorVi(rr) {
  if (!(rr in READ_DISTRACTORS)) throw new Error(`Review Vietnamese read distractor: ${rr}`);
  return transcribeSurface(READ_DISTRACTORS[rr]);
}

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
// Intermediate K7..K10 words
const UNCHANGED_INTERMEDIATE = `다고 하다 친구가 온다고 해요 날씨가 좋다고 비가 밥을 먹는다고 맛있다고 냐고 묻다 어디 가냐고 물었어요 몇 시냐고 밥 먹었냐고 누구냐고 언제 오냐고 라고 자고 빨리 오라고 했어요 같이 가자고 조용히 하라고 기다리라고 먹자고 느라고 는데도 공부하느라고 바빴어요 오는데도 갔어요 일하느라고 늦었어요 준비하느라고 피곤한데도 공부했어요 을수록 기 마련이다 만날수록 좋아요 사람은 실수하기 마련이에요 갈수록 어려워요 시간이 편해요 볼수록 예뻐요 아 어 보이다 는 모양이다 행복해 보여요 오는 모양이에요 맛있어 바쁜 피곤해 척하다 으 아는 척해요 자는 척했어요 안 들리는 모르는 걸 그랬어요 일찍 올 공부할 살 말할 쉴 진지 주무시다 편찮으시다 할머니께서 진지를 드세요 어머니께서 주무세요 선생님께서 편찮으세요 오세요 할아버지께서 먹어요 드리다 뵙다 여쭙다 선물을 드려요 내일 봬요 선생님께 여쭤봐요 친구에게 물어봐요 오늘 만나요 받아요 이 히 리 들리다 열리다 닫히다 문이 열려요 창문이 닫혀요 산이 음악이 들려요 어지다 게 되다 글씨가 써져요 알게 되었어요 한국에 가게 서울에 살게 만나게 잊게 우 보여 주다 먹이다 입히다 사진을 줘요 아기에게 먹여요 동생에게 옷을 입혀요 사 봐요 웃게 기다리게 동생을 울게 동생이 울었어요 기다렸어요 웃었어요 하십시오 하십시다 자리에 앉으십시오 출발하십시다 질문 있으십니까 말씀하십시오 시작하십시다 앉았어요 저희 말씀 올리다 인사 올립니다 학교입니다 감사의 뜻을 전합니다 축하드립니다 우리 인사했어요 할머니께 드렸어요 저절로 닫혔어요 열렸어요 받았어요 에 관하여 검토 부탁드립니다 회의 안건에 말씀드립니다 첨부파일을 확인해 주십시오 통화 가능하신지요 일정을 변경하고자 합니다 안건을 검토합니다 연결해 드리겠습니다 지금 담당자를 메모를 남겨 드릴까요 전화 받았습니다 통화했습니다 양해 너른 편하신 시간을 알려 없습니다 약속을 지키겠습니다 확인합니다 제 생각으로는 찬성합니다 추가 이번 안이 좋습니다 적극 검토가 필요합니다 의견이 반대합니다 의견을 냅니다 진행 상황을 보고합니다 조치를 완료했습니다 프로젝트 결과를 공유해 드립니다 보고서를 시작했습니다 보고 완료합니다 증가했습니다 전년 대비 매출이 상승했습니다 비용이 감소했습니다 가격이 올랐습니다 유지되었습니다 상호 협력을 희망합니다 절충안 제시 절충안을 제안합니다 계약을 체결했습니다 협상을 시작합니다 거절합니다 협력하겠습니다 처음 뵙겠습니다 명함 김 부장님입니다 박 팀장님입니다 이사님입니다 과장님입니다 나눕니다 검토해 주시기 바랍니다 회의에서 검토했습니다 물가 안정 대책 발표 대책을 발표했습니다 수출이 사상 최대를 기록했습니다 인공지능 기술이 발전하고 있습니다 물가가 안정되었습니다 수입이 세웁니다 친환경 에너지가 주목받고 사회적 관심이 커지고 새로운 기술을 도입했습니다 개발합니다 줄어듭니다 에너지를 아낍니다 발 눈 귀 손 발이 넓다 눈이 높다 대리는 넓어요 높아요 귀가 얇아요 손이 커요 아파요 바가지 어깨 바가지를 쓰다 어깨가 무겁다 썼어요 무거워요 발을 벗고 나섰어요 씻었어요 마음이 그릇을 샀어요 소 잃고 외양간 고친다 쇠뿔도 단김에 빼라 없는 말이 천 간다 말을 잘 탑니다 길도 한 걸음부터 소를 길러요 사자성어 일석이조 작심삼일 다다익선 일석이조예요 작심삼일이에요 다다익선이에요 역지사지예요 작심했어요 두 마리 토끼 따르면 한편 요컨대 따라서 의견에 그렇습니다 다른 측면도 본질이 중요합니다 결론입니다 반면에 따뜻한 정 송편을 빚다 정이 있어요 빚어요 음식을 나눠 요리해요 떡을 많아요 일석이조의 효과를 거두었어요 이해를 바탕으로 협력해요 효과가 협력하지 않습니다 일석이조입니다`.split(/\s+/);
for (const w of UNCHANGED_INTERMEDIATE) if (!(w in WORDS)) WORDS[w] = w;

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

const CHANGED_INTERMEDIATE = {
  "좋다고": "조타코",
  "맛있다고": "마싣따고",
  "묻다": "묻따",
  "물었어요": "무러써요",
  "몇": "멷",
  "먹었냐고": "머건냐고",
  "했어요": "해써요",
  "같이": "가치",
  "바빴어요": "바빠써요",
  "갔어요": "가써요",
  "늦었어요": "느저써요",
  "공부했어요": "공부해써요",
  "좋아요": "조아요",
  "맛있어": "마시써",
  "척했어요": "처캐써요",
  "그랬어요": "그래써요",
  "편찮으시다": "편차느시다",
  "편찮으세요": "편차느세요",
  "받아요": "바다요",
  "닫히다": "다치다",
  "닫혀요": "다쳐요",
  "되었어요": "되어써요",
  "잊게": "읻께",
  "옷을": "오슬",
  "웃게": "욷께",
  "울었어요": "우러써요",
  "기다렸어요": "기다려써요",
  "웃었어요": "우서써요",
  "앉으십시오": "안즈십씨오",
  "있으십니까": "이쓰심니까",
  "앉았어요": "안자써요",
  "뜻을": "뜨슬",
  "인사했어요": "인사해써요",
  "드렸어요": "드려써요",
  "닫혔어요": "다쳐써요",
  "열렸어요": "열려써요",
  "받았어요": "바다써요",
  "드리겠습니다": "드리겓씀니다",
  "받았습니다": "바닫씀니다",
  "통화했습니다": "통화핻씀니다",
  "없습니다": "업씀니다",
  "지키겠습니다": "지키겓씀니다",
  "좋습니다": "조씀니다",
  "완료했습니다": "완료핻씀니다",
  "시작했습니다": "시자캗씀니다",
  "증가했습니다": "증가핻씀니다",
  "상승했습니다": "상승핻씀니다",
  "감소했습니다": "감소핻씀니다",
  "올랐습니다": "올랃씀니다",
  "유지되었습니다": "유지되얻씀니다",
  "체결했습니다": "체결핻씀니다",
  "협력하겠습니다": "협려카겓씀니다",
  "뵙겠습니다": "뵘겓씀니다",
  "검토했습니다": "검토핻씀니다",
  "발표했습니다": "발표핻씀니다",
  "기록했습니다": "기로캗씀니다",
  "있습니다": "이씀니다",
  "안정되었습니다": "안정되얻씀니다",
  "주목받고": "주목받꼬",
  "도입했습니다": "도이팯씀니다",
  "넓다": "널따",
  "높다": "놉따",
  "넓어요": "널버요",
  "높아요": "노파요",
  "얇아요": "얄바요",
  "썼어요": "써써요",
  "벗고": "벋꼬",
  "나섰어요": "나서써요",
  "씻었어요": "씨써써요",
  "그릇을": "그르슬",
  "샀어요": "사써요",
  "잃고": "일코",
  "없는": "엄는",
  "작심했어요": "작심해써요",
  "그렇습니다": "그러씀니다",
  "따뜻한": "따뜨탄",
  "빚다": "빋따",
  "있어요": "이써요",
  "빚어요": "비저요",
  "많아요": "마나요",
  "거두었어요": "거두어써요",
  "않습니다": "안씀니다",
  "좋": "졷",
  "좋다": "조타",
  "맛": "맏",
  "빛": "빋",
  "꽃": "꼳"
};
Object.assign(WORDS, CHANGED_INTERMEDIATE);

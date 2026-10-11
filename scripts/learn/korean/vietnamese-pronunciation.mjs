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
const WORDS = Object.fromEntries(UNCHANGED.map((w) => [w, w]));
Object.assign(WORDS, CHANGED);
export function pronunciationVi(text) {
  // Obstruent coda + initial ㅅ across this course's phrase boundary.
  const surface = text.replace(/한국 사람이에요/g, "한국 싸라미에요").replace(/[가-힣]+/g, (word) => {
    if (word === "싸라미에요") return word;
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
  gaseoyo: "가서요", gatseoyo: "갇서요", gasseyo: "가쎄요",
};
export function distractorVi(rr) {
  if (!(rr in READ_DISTRACTORS)) throw new Error(`Review Vietnamese read distractor: ${rr}`);
  return transcribeSurface(READ_DISTRACTORS[rr]);
}

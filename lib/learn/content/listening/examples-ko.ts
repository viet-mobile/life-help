/**
 * Canonical Korean of every listenable English item of the English lessons' `example` text (the English itself stays in the lesson).
 * `EXAMPLE_KO[lessonId][i]` is the Korean of item i of `exampleItems(lesson.example)` (lib/learn/listen/segments.ts); where the lesson already
 * writes a meaning inline ("library = 도서관") the entry repeats it exactly. Authored and reviewed for LIFE.HELP (see
 * docs/learning/english-bilingual-listening-inventory.md); never machine-translated at runtime. Public data: the examples are shown before a
 * lesson starts, so their Korean may ship to the browser.
 */
export const EXAMPLE_KO: Readonly<Record<string, readonly string[]>> = {
  // M1 demo course
  "en-l1": ["도서관", "책상", "우유"],
  "en-l2": ["나는 학생이다.", "그녀는 내 친구이다.", "그들은 교실에 있다."],
  "en-l3": ["가다", "간다", "보다", "본다", "공부하다", "공부한다"],
  "en-l4": ["책", "책들", "상자", "상자들", "아이", "아이들"],
  // E1
  "en-e1-l1": ["공", "고양이", "개"],
  "en-e1-l2": ["안녕하세요!", "내 이름은 미나예요."],
  "en-e1-l3": ["셋", "빨강"],
  "en-e1-l4": ["이분은 우리 엄마예요."],
  "en-e1-l5": ["나는 연필이 있어요."],
  // E2
  "en-e2-l1": ["토끼"],
  "en-e2-l2": ["나는 사과를 먹어요."],
  "en-e2-l3": ["나는 개를 좋아해요.", "나는 고양이가 있어요."],
  "en-e2-l4": ["나는 학생이에요.", "너는 친절하구나."],
  "en-e2-l5": ["미나는 고양이가 있어요."],
  // E3
  "en-e3-l1": ["그녀는 책을 읽어요."],
  "en-e3-l2": ["톰은 키가 커요.", "그는 키가 커요."],
  "en-e3-l3": ["나는 걸어요.", "나는 걸었어요."],
  "en-e3-l4": ["나는 7시에 일어나요."],
  "en-e3-l5": ["진은 7시에 일어나요."],
  // E4
  "en-e4-l1": ["나는 내일 이모를 방문할 거예요."],
  "en-e4-l2": ["너는 피자를 좋아하니?", "나는 양파를 좋아하지 않아요."],
  "en-e4-l3": ["아이스크림이 차가워요."],
  "en-e4-l4": ["책이 책상 위에 있어요."],
  "en-e4-l5": ["미나는 공원에 가요."],
  // E5
  "en-e5-l1": ["사과 한 개, 상자 두 개, 책이 세 권 있어요."],
  "en-e5-l2": ["톰은 벤보다 키가 커요."],
  "en-e5-l3": ["나는 제주를 방문할 거예요."],
  "en-e5-l4": ["나는 행복해요.", "나는 행복하지 않아요."],
  "en-e5-l5": ["켄은 부산에 살아요."],
  // E6
  "en-e6-l1": ["아기가 지금 자고 있어요."],
  "en-e6-l2": ["너는 이를 닦아야 해요."],
  "en-e6-l3": ["큰", "커다란", "행복한", "슬픈"],
  "en-e6-l4": ["나는 피곤해서 일찍 잠자리에 들었어요."],
  "en-e6-l5": ["그들이 많이 걸어서 지나는 피곤했어요."],
  // M2
  "en-m2-l1": ["나는 여기에서 5년 동안 살아 왔다."],
  "en-m2-l2": ["그 방은 미나에 의해 청소된다."],
  "en-m2-l3": ["나는 자전거를 사고 싶다.", "그녀는 노래하는 것을 즐긴다."],
  "en-m2-l4": ["더운", "더 더운", "가장 더운"],
  "en-m2-l5": ["그 결과"],
  // M3
  "en-m3-l1": ["나는 캐나다에 사는 친구가 있다."],
  "en-m3-l2": ["내가 부자라면, 여행을 할 텐데."],
  "en-m3-l3": ["너는 그가 어디에 사는지 아니?"],
  "en-m3-l4": ["신나는 경기", "나는 신이 난다."],
  "en-m3-l5": ["…을 말씀해 주시겠어요?"],
  // H1
  "en-h1-l1": ["나는 한 시간째 기다리고 있다."],
  "en-h1-l2": ["이곳은 내가 태어난 마을이다."],
  "en-h1-l3": ["몸이 아파서 나는 집에 갔다."],
  "en-h1-l4": ["그러나"],
  "en-h1-l5": [],
  // H2
  "en-h2-l1": ["나는 그런 경치를 한 번도 본 적이 없다."],
  "en-h2-l2": ["내가 더 열심히 공부했더라면 좋았을 텐데."],
  "en-h2-l3": ["아무리 힘들어도 나는 노력할 것이다."],
  "en-h2-l4": [],
  "en-h2-l5": ["이런 방식으로"],
  // H3
  "en-h3-l1": ["노래하기, 춤추기, 그리고 수영하기"],
  "en-h3-l2": ["물을 충분히 받아 두세요."],
  "en-h3-l3": [],
  "en-h3-l4": ["마지막 참을성의 한계"],
  "en-h3-l5": ["비용이 더 들다", "장기적으로 돈을 절약하다"],
};

/** Lessons whose example has no English to speak, excluded from bilingual listening on purpose (the reason is part of the record). */
export const EXAMPLE_EXCLUDED: Readonly<Record<string, string>> = {
  "en-h1-l5": "the example is Korean-only notation of a text structure (문제 → 해결 → 효과); there is no English sentence to speak",
  "en-h2-l4": "the example lists prefixes (un-, im-), which are not words or sentences to speak",
  "en-h3-l3": "the example is Korean-only notation of a text structure (원인 → 조치 → 결과); there is no English sentence to speak",
};

# 정규 한국어 코스 발견 사항 (수정하지 않음)

공유 정규 콘텐츠(`lib/learn/content/korean/korean.json`, `scripts/learn/korean/course*.mjs`)는 이 작업에서 **수정하지 않았습니다**. 소유자가 판단하도록 문항 ID와 근거만 남깁니다.
재현: `node scripts/learn/korean/bank/audit-course-rr.mjs` (전체 불일치 목록은 `course-rr-findings.json`, 읽기 전용). 모든 판단은 AI 검토이며 원어민·교사 검토가 아닙니다.

## 정정

이전 보고의 "K1~K6 로마자 오류 약 22개"는 **K1~K10 전체**에서 변환기가 처음 표시한 불일치 수(421개 확인, 22개)였습니다. 변환기를 고친 뒤 **K1~K6의 실제 오류는 2개 문항**이고 나머지는 K7~K10(비공개)입니다. 아래가 현재 기준 분류입니다.

## A. K1~K6 (공개 중인 정규 코스) — 로마자 오류 2건

개정 로마자 표기법(음운 변화를 반영: ㄹ+모음 → r, 연음)에 따름.

| 문항 ID | 위치 | 현재 | 제안 | 근거 |
|---|---|---|---|---|
| `k-k5-months-c` | 해설 | 칠월 `chilwol` | `chirwol` | ㄹ 받침 + 모음 ㅇ → 연음 [치뤌], ㄹ은 모음 앞에서 r |
| `k-k5-birthday-c` | 해설 | 오월이에요 `owolieyo` | `oworieyo` | 오월 [오워]+이에요 → [오워리에요], 연음 ㄹ→r |

(`k-k5-months-c`와 같은 단어가 있는 K5 `months` 스킬의 다른 문항은 정상. 이 두 문항은 해설 문자열만 문제이며 정답·보기는 영향 없음.)

## B. K1~K6 — 영어 문구 대소문자·품질 (Gemini 변경분, e6da450 대비)

e6da450 이후 K1~K6 문항 40개가 바뀌었습니다. 대부분(37개)은 해설의 빈 뜻(`means “”.` → `is read “…”.`)을 고친 개선입니다. **3개 문항은 영어 문구가 퇴행**했습니다.

| 문항 ID | 필드 | e6da450 | 현재 | 문제 |
|---|---|---|---|---|
| `k-k6-requests-1` | 보기 c | `Please wait.` | `please wait` | 다른 보기(`Please help me.`, `Please sit.`)와 형식 불일치(소문자, 마침표 없음) |
| `k-k6-requests-2` | 보기 c, 해설 | `Please wait.` / `means “Please wait.”` | `please wait` / `means “please wait”.` | 같은 문제. 해설의 마침표 위치도 어긋남 |
| `k-k6-requests-4` | 프롬프트 | `Does this mean “Please wait.”?` | `Does this mean “please wait”?` | 소문자 |

제안: `Please wait.`로 복원(다른 보기와 같은 형식). 정답 키는 영향 없음. 보기 형식이 다른 것이 정답 단서가 되지는 않지만(정답은 `b`/`c`/`false`), 다른 보기와 다르게 보이는 것이 오답 선택에 영향을 줄 수 있어 통일이 안전합니다.

## C. K7~K10 (비공개 DRAFT) — 로마자 오류, 소유자 Gemini

문항 ID는 같은 근거로 정리했습니다(같은 문장은 여러 문항 ID에 나옴).

| 문장 | 현재 | 제안 | 근거 | 문항 ID |
|---|---|---|---|---|
| 날씨가 좋다고 해요 | `jotdago` | `jotago` | ㅎ+ㄷ → ㅌ 격음화 [조타고] | `k-k7-indirect_state-2`, `-c` |
| 공부하느라고 바빴어요 | `bapasseoyo` | `bappasseoyo` | 바빴 [바빧]+어 → [바빠써요], ㅃ 연음 | `k-k7-cause_contrast-1`, `-4` |
| 동생에게 옷을 입혀요 | `iphyeoyo` | `ipyeoyo` | ㅂ+ㅎ → ㅍ [이펴요], RR는 p | `k-k8-causative_affix-3`, `-v1` |
| 제 생각으로는 이번 안이 좋습니다 | `saenggakeoroneun … jotseumnida` | `saenggageuroneun … jotseumnida` | 으로는 [으로는]: `eu`(으)이며 `eo` 아님, 연음 | `k-k9-biz_meeting-1`, `-4`, `-v2` |
| 절충안을 제안합니다 | `jeolchuganeul` | `jeolchunganeul` | 절충안 [절충안]: ng 누락 | `k-k9-biz_negotiate-2`, `-c` |
| 새로운 기술을 도입했습니다 | `doiphaesseumnida` | 컨벤션 정리 시 `doipaesseumnida` | ㅂ+ㅎ → ㅍ [도이패씀니다], `ph`는 비표준 | `k-k10-media_article-3`, `-v1` |
| 수출이 사상 최대를 기록했습니다 | `girokhaesseumnida` | 컨벤션 정리 시 `girokaesseumnida` | ㄱ+ㅎ → ㅋ [기로캐씀니다], `kh`는 비표준 | `k-k10-media_headline-2`, `-4`, `-c` |
| 김 대리는 발이 넓어요 | `neobeoyo` | `neolbeoyo` | 넓어 [널버]: ㄼ의 ㄹ이 남음 | `k-k10-idioms_body-1`, `-4`, `-v2` |
| 의견에 따르면 그렇습니다 | `geureotsseumnida` | `geureoseumnida`(발음식) 또는 `geureotseumnida`(받침식) | ㅎ 받침 + ㅅ, 컨벤션 필요 | `k-k10-logic_debate-1`, `-4`, `-v2` |
| 일석이조의 효과를 거두었어요 | `geoduosseoyo` | `geodueosseoyo` | 거두었: 두+었 → 어 보존 | `k-k10-review_k10-1`, `-4`, `-v2` |

### 컨벤션 불일치 (오류가 아니라 정책 문제)

받침 + `ㅅ`로 시작하는 어미(-습니다)의 로마자를 코스 안에서 두 방식으로 씁니다.
- K1~K6, K7 일부: **받침식** (`meogeotseumnida`, `meokgetseumnida`, `itseumnida`)
- K9~K10 (`했습니다` 등): **발음식** (`haesseumnida`, `isseumnida`)

변환기(`bank/hangul.mjs`)와 은행(`korean.json`)은 K1~K6과 같은 받침식입니다. 한 가지로 정하지 않으면 같은 어미가 레벨마다 다르게 표기됩니다. 정책 결정은 소유자(Gemini)와 교사 검토가 필요합니다. 표기가 하이픈을 쓰는 `chinhwan-gyeong`(모호성 방지용, `k-k10-media_article-1`, `-4`, `-v2`)은 오류가 아닙니다.

## 처리 제안

1. A·B는 한 커밋으로 묶고(정규 코스 소유자가), 문항 ID가 바뀌지 않으므로 진도·정답에는 영향이 없습니다.
2. C는 K7~K10이 비공개인 동안 컨벤션을 정한 뒤 일괄 수정하고, `audit-course-rr.mjs`로 재확인합니다.
3. 이 보고와 스크립트는 문서이며 어떤 콘텐츠도 바꾸지 않았습니다.

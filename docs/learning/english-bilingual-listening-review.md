# English bilingual listening: translation review (2026-10-05)

Scope: every listenable English segment of the English course: 88 lesson-example items (59 lessons; 3 lessons have no English to speak and are excluded with a recorded reason) and 153 sentences of the 58 distinct reading passages used by 141 questions. Inventory with every pair: `english-bilingual-listening-inventory.md` (generated, `--check` in the gate). Source of the Korean: `lib/learn/content/listening/examples-ko.ts` (public: examples are shown before a lesson) and `passages-ko.ts` (server-only: sent with the attempt feedback once the question is solved or revealed).

## Counts
* TOTAL_LISTENABLE_ENGLISH_SEGMENTS = 241
* PREVIOUSLY_PAIRED = 8 (lesson text already wrote `english = meaning`; the authored entry repeats it exactly, test-enforced)
* NEWLY_TRANSLATED = 233
* MISSING_CANONICAL_KOREAN = 0

## Method
1. Authoring: meaning first, natural Korean; elementary in the polite `-요` register, middle / high school in the written `-다` register (the register of the course's own Korean); numbers, units, names, negation and logical connectors kept; no explanation added; grammar examples translated as sentences (the passive stays passive, the present perfect keeps its duration, the subjunctive stays conditional).
2. Independent second read of all 241 pairs side by side against the checklist MEANING / NUMBER / NEGATION / ENTITY / TENSE-ASPECT / NO_ADDED_CLAIM / NO_OMISSION. Two corrections came out of it: `passage-58:2` restored the dropped subject ("이 지붕은 또한 ..."); `en-e2-l4` "You are kind." now "너는 친절하구나." (natural register for a child).
3. Mechanical QA on every pair (`tests/learn/listening-content.test.ts`): digits and number words present (150 cm, 10,000 / 8,000 / 12,000 won, $120 / $180 / $90, 2018 / 2021 / 2026, 9 a.m. to 1 p.m., seven -> 7시, six months -> 6개월, five years -> 5년 ...); negated English negated in Korean and no negation added; 27 names / places / weekdays carried over; no English left in the Korean except the labels (A)/(B)/(C) and the unit cm; quotes kept; no long sentence cut short.

## Result
| check | result |
|---|---|
| omissions | 0 (after the passage-58:2 fix) |
| number drift | 0 |
| meaning errors | 0 found in the second read |
| added claims | 0 (see the lexical choices below) |
| negation drift | 0; one reviewed idiom: "This is the last straw." -> "이제 더는 못 참겠어." (meaning translation of the idiom; listed as an allowed exception) |

## Lexical choices recorded (Korean forces a choice the English leaves open)
* "aunt" (en-e4-l1) -> 이모: Korean has no neutral word; 이모 is the common default in children's material.
* "her brother" (passage-12) -> "남자 형제와 함께": keeps older / younger unspecified as in the English.
* "He has two sisters." (passage-11) -> "여자 형제가 두 명": the next sentences of the same passage specify older / younger (누나, 여동생).
* "'waggle dance'" (passage-50) -> "'8자 춤'": the established Korean name of the honeybee waggle dance.
* "Best regards, Hana" -> "하나 드림"; "Dear Mr. Kim," -> "김 선생님께,".
* "Tom's bag is the color of the sky." -> "하늘과 같은 색이에요" (not "파란색": the question asks the learner to infer the colour).

## Pedagogical gate (not a translation issue)
A reading passage's Korean helps answer its question, so the API sends it only with the feedback of a solved or revealed question; before that the panel says so ("한국어 뜻은 문제를 푼 뒤에 들을 수 있어요.") and plays English only. Lesson examples are shown before the lesson starts, so their Korean is available immediately.

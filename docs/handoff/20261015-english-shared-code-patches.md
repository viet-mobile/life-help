# 영어 은행: 공용 파일 변경 패치 제안 (ChatGPT / Gemini 인계)

영어 담당(Claude)은 `bank.ts`, `repository.ts`, `types.ts`, i18n 사전, 공용 컴포넌트, `package.json`, manifest, 공용 감사 도구를 직접 수정하지 않습니다. 영어 은행이 목표(공개 가능 12,000문항 이상)에 도달하려면 아래 변경이 필요합니다. 각 항목은 "왜 필요한지 / 어떻게 바꾸는지 / 어떻게 확인하는지"를 적었습니다.

## P1. 고등 선택과목 스킬 7개를 공용 카탈로그에 추가 (필수: 공개 가능 수량에 영향)
- 문제: `e.h.conv`, `e.h.job`, `e.h.media`, `e.h.world`, `e.h.lit`, `e.h.debate`, `e.h.write`(고등 선택과목: 실생활 영어 회화, 직무 영어, 미디어 영어, 세계 문화와 영어, 영미 문학 읽기, 영어 발표와 토론, 심화 영어 독해와 작문)는 영어 카탈로그에 없습니다. `bank.ts`의 `englishBankQuestions(skills)`가 `skills.has(q.skillId)`로 거르기 때문에 이 스킬의 문항 1,303개는 **학생에게 나가지 않습니다.**
- 변경: `lib/learn/content/secondary/english.json`의 `catalog.skills`에 7개 스킬(id, title, 필요하면 lesson 연결)을 추가. 스킬 제목은 `scripts/learn/english-bank/plan.json`의 `skills[].title`을 쓰면 됩니다. 연습 전용 스킬이면 레슨 없이 `skills`에만 두어도 `bankQuestions`는 동작하지만, 숙달도·복습 선택기(`pickers`)가 레슨 없는 스킬을 어떻게 다루는지 확인이 필요합니다(`lib/learn/content/indexer.ts`).
- 후속: `npm run learn:assets`(manifest 재생성), 47개 언어 오버레이에 새 스킬 제목 번역(`content/learn-overlays/*/english.json`의 `skills`), 교육과정 감사 테스트의 스킬 수 기대값 갱신.
- 확인: `scripts/learn/english-bank/status.py`의 "카탈로그에 없는 질문"이 0이 되어야 합니다.

## P2. 영어 은행 번역 계층 (학습자 언어 제공)
- 현재: 지시문·힌트·해설이 한국어로만 작성되어 **한국어 학습자에게만** 제공됩니다(`bankQuestions`가 `locale === presentationLocale`일 때만 반환). 다른 46개 언어는 0문항이며 다른 언어로 대체 표시하지 않습니다.
- 제안: 문항을 "영어 학습 대상(English content)"과 "학습자 언어 층(instruction, hint, explanation)"으로 나누고, 후자를 기존 수학 은행처럼 템플릿+언어별 오버레이로 번역합니다. 영어 지문·보기·정답은 번역하지 않습니다. 비용은 문구 종류 수에 비례합니다(문항 수가 아님): 형식별 지시문 약 15종, 힌트 약 30종, 해설은 항목마다 달라 가장 큽니다.
- 이 작업은 공용 스키마(`types.ts`, `overlay.ts`)와 오버레이 형식에 걸치므로 별도 설계가 필요합니다. 영어 담당은 번역 대상 문구 목록(형식별 지시문·힌트 템플릿)을 `scripts/learn/english-bank/`에서 추출해 제공할 수 있습니다.

## P3. 독해 지문과 질문의 분리 (신규 작성 형식)
- 현재: 독해 문항은 `prompt`에 지문+`\n\n`+질문을 합쳐 저장합니다. 화면의 줄바꿈은 `6465388`의 `formatPrompt`와 `.l-qprompt { white-space: pre-line }`이 처리합니다(유지).
- 제안: `Question`에 선택 필드 `passage?: string`을 추가하고 `QuestionCard`가 지문 블록과 질문을 따로 그리게 한다. 지문별 질문 묶음(`passageId`)으로 같은 지문의 질문들을 연달아 내거나 한 번에 보여 줄 수 있다. 듣기는 `audioText`가 지문 전체를 가리키도록 한다.
- 호환: 기존 문항은 그대로 두고, 신규 문항만 `passage` 필드를 쓰면 됩니다. `formatPrompt`는 `passage`가 있으면 건너뛴다.
- 영어 담당이 할 일: 풀 형식(`scripts/learn/english-bank/pools/*.json`)의 `r`/`d` 항목은 이미 `text`(지문)와 `qs[]`(질문)로 분리되어 있어, 빌더가 `passage` 필드를 추가로 내보내도록 바꾸는 것은 영어 담당 범위입니다(공용 스키마 변경 수락 후).

## P4. 영어 은행 파일명과 게이트
- `bank.ts`는 `./bank/english-draft.json`을 import합니다. 이 파일 이름은 "초안"이라 오해하기 쉽지만, 빌더(`scripts/learn/english-bank/build.mjs`)가 **검토 장부(`ledger.json`)를 통과한 문항만** 이 파일에 쓰도록 바꿨습니다. 미검토 작성분은 `english-pending.json`(런타임이 읽지 않음)에 있습니다.
- 제안: 파일 이름을 `english.json`으로 바꾸고, 테스트에 "`english-pending.json`은 어떤 소스에서도 import되지 않는다"를 추가한다(수학 고교 은행 테스트의 `not.toMatch(/bank\/math-hs/)` 방식 참고).

## P5. 검증 항목 (테스트로 고정할 것)
- 이미 있는 것: `tests/learn/publish-english.test.ts`(4,031문항 PUBLISHED·정답 정합·정규화 중복 없음·타 언어 0·순서 배열 같은 낱말 타일).
- 추가 제안: (a) 서빙 중인 모든 문항이 `ledger.json`에 있다(미검토 문항이 우연히 나가지 않는다), (b) 카탈로그에 없는 스킬의 문항이 0이다, (c) 정답 위치 분포가 보기 개수별로 균형이다(현재 전체 24~27%, 순환 패턴 없음).

## P6. 공통 복습 UI에 필요한 영어 쪽 조건
`docs/handoff/20261015-claude-handoff-6465388.md` §4 참조(어순 배열은 낱말 텍스트 기준 비교 — `answers.ts`에 이미 반영, 받아쓰기 정규화, 듣기용 `audioText` 영어 문장).

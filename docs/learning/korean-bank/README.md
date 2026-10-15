# 한국어 문제은행 (study.korean, 형식 2)

**상태: 비공개(DRAFT).** 학생에게 노출되지 않습니다. 이 은행과 K7~K10, 새 K7 징검다리 레슨은 독립 검토(원어민·교사 포함)가 끝나기 전까지 공개하지 않습니다. 지금까지의 검토는 모두 AI 검토이며 원어민·교사 검토가 아닙니다.

## 구조

| 파일 | 역할 |
|---|---|
| `scripts/learn/korean/bank/pools/K1~K10.json` | 저작한 학습 항목(풀). 한국어 대상 문장, 영어 뜻, 빈칸·오답 문장·정렬·지문 진위 문항 데이터 |
| `scripts/learn/korean/bank/build.mjs` | 풀 검증 + K1 음절 연습 생성 → `lib/learn/content/bank/korean.json`(형식 2), 번역 원본 `kit/source.en.json` |
| `lib/learn/content/korean-bank.ts` | 순수 확장기. 항목 + 현지화 키트 → 문항. ID·정답은 모든 언어에서 동일 |
| `lib/learn/content/bank/korean-kit.en.json`(영어 원본 템플릿), `scripts/learn/korean/bank/kit/<locale>.json` | 언어별 키트: 문항 문구(prompt·hints·explanation), 영어 뜻(`g:`)·상황(`s:`)·문법 노트(`n:`), 징검다리 제목 |
| `scripts/learn/korean/bank/hangul.mjs` | 한글 조합, 조사 규칙, 풀과 독립된 로마자(개정 로마자 표기법) 변환기 |
| `scripts/learn/korean/course-bridge.mjs` | K6→K7 징검다리 레슨 5개(풀의 검토된 문장에서 선택) |
| `scripts/learn/korean/bank/apply-patches.mjs`, `dedupe.mjs`, `report.ts`, `validate-kit.mjs` | 검토 패치 적용, 중복 제거, 배분표, 키트 검증 |

**학습 대상 한국어**(문장, 로마자, 정답, 오답)는 번역하지 않고 한 번만 저장합니다. **사용자 언어**로 제공되는 지시·힌트·해설·뜻·문법 노트는 기존 현지화 체계(코스의 `kit/<locale>.json`과 같은 방식)를 따라 언어별 키트에서 렌더링됩니다. 한국어 사이트의 표시 언어(presentationLocale)는 영어입니다.

런타임: `bank.ts`의 `bankQuestions('korean')`은 `KOREAN_BANK_LIVE === false`이므로 빈 배열을 반환하고, 확장된 문항도 모두 `DRAFT`라 `pickPractice`·`requestHint`·`submitAttempt`가 거절합니다(`tests/learn/korean-bank.test.ts`가 실제 서비스 경로로 확인). 공개하려면 검토 후 `KOREAN_BANK_LIVE`를 켜고 데이터의 `status`를 바꾸고 키트가 모든 언어에 완전한지 확인해야 합니다(`build-content-assets.mjs`가 PUBLISHED 은행은 모든 언어 완전성을 요구).

## 집계 기준

배분표(`allocation.md`)가 자동 생성됩니다. 집계 기준은 다음과 같습니다.

- **전체 문항(ID)**: 확장된 문항 수. 보기 순서·ID만 바꾼 복제는 없습니다.
- **고유 학습 항목**: 서로 다른 한국어 단어·표현·문장·지문. 음절 치환 연습은 제외합니다.
- **형식 변형**: 같은 학습 항목을 뜻 고르기, 한국어 고르기, 듣기, 참/거짓, 빈칸, 문장 고르기, 정렬로 묻는 문항.
- **단순 치환 변형**: K1 자음·모음·받침 음절 연습(210개 음절).
- 듣기는 음성을 듣고 텍스트를 고르는 인지 문항이며 말하기 능력은 평가하지 않습니다.

## 검증

1. **저작 검사(`build.mjs`)**: 빈칸을 정답으로 채우면 문장이 복원되는지, 정답과 오답이 모두 다른지, 조사(이/가·은/는·을/를)가 앞말 받침 규칙에 맞는지, 한글이 영어 뜻에 없는지, 풀 안 뜻 중복.
2. **로마자**: 모든 항목의 로마자는 풀과 독립된 변환기가 만든 값입니다. 숫자·영문이 섞인 문장은 로마자를 붙이지 않습니다. 변환기에는 ㄴ첨가·연음 예외 목록이 있습니다.
3. **독립 AI 검토 1차**: 숫자·일반 항목 전수 22개 묶음. 319개 패치(삭제 30, 수정 289).
4. **독립 AI 검토 2차**: 1차에서 수정된 282개 항목 재검토. 52개 추가 패치.
5. **중복 제거**: 같은 한국어가 여러 스킬에 있거나 정규 코스가 이미 가르치는 항목 제거(`dedupe-log.json`).
6. **테스트**: `tests/learn/korean-bank.test.ts` — 유일한 ID, 보기 4개 서로 다름, 정답 위치 분산, 참/거짓 균형, 힌트·프롬프트의 정답 노출 금지, 로마자 일치, 서비스 경로 차단.

## 알려진 한계

- 원어민·교사 검토 없음. 1·2차 검토는 AI 검토이고 평가자 간 불일치가 남을 수 있습니다.
- 오답 문장은 "확실히 틀린" 쪽을 우선해 일부 빈칸 문항의 오답이 교육적 가치가 낮은 형태(예: `-려고/-러/-게` 반복)입니다(`bridge_connect`, `bridge_modal` 등).
- 베트남어 발음 보조는 검수된 어휘표(`vietnamese-pronunciation.mjs`)에 있는 단어에만 붙습니다.
- 현지화 키트는 AI 번역이며 번역 검수 전입니다. 언어별 범위는 `kit/README.md` 참고.

## 후속 문서

- `worklist.md` — 미번역 범위(32개 언어)와 레벨별 읽기·대화 부족분 (`node scripts/learn/korean/bank/worklist.mjs`).
- `course-findings.md` — 정규 코스(K1~K10)에서 발견한 로마자·영어 문구 문제의 문항 ID와 근거. 공유 콘텐츠는 수정하지 않음 (`node scripts/learn/korean/bank/audit-course-rr.mjs`).
- K7~K10은 미공개 상태이므로 학습자 화면은 빈 코스 대신 이용 불가 안내와 레벨 재선택 링크를 보여 줍니다 (`components/learn/LevelUnavailable.tsx`, `lib/learn/korean-availability.ts`).

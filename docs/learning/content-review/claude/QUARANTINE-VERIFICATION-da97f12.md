# 비공개(격리) 독립 검증: 콘텐츠 커밋 da97f12

- **검증 대상:** `da97f127ee5c8ee6f1e040711ba3ddbd29ac29c7` (`review/consolidated-learn-da97f12`). 비교 기준 통합 커밋 `e6da450`.
- **성격:** 비공개 확인은 **품질 오류 수정과 별개**입니다. 아래 비공개는 문항 품질을 고친 것이 아니며, 품질 판정은 `RECHECK-REPORT-9c36d27.md`의 미해결 목록이 그대로 유효합니다.
- AI 검증이며 원어민·교사 검토가 아닙니다. 공유 콘텐츠·코드는 수정하지 않았습니다.

## 어떻게 비공개되는가 (코드 확인)

| 대상 | 방식 | 확인 |
|---|---|---|
| K7~K10 문항 260개 | 빌드가 `status: "DRAFT"`로 생성. `publishedOnly`가 문항이 모두 PUBLISHED가 아닌 레슨·코스를 번들에서 제거 | 학생 번들에 K7~K10 코스·레슨·스킬·문항 0개 |
| 영어 심화 독해 56문항 | `DRAFT` + 서비스 어디에도 연결되지 않음 | 56/56 DRAFT, `repository.ts`가 읽지 않음 |
| 영어 은행 4,345 / 한국어 은행 3,510 | `bankQuestions()`가 영어·한국어에 대해 `[]` 반환 | 학생 번들에 `bk-` 문항 0개 |
| 계정 K7~K10 | `saveOnboarding`이 `level_requires_db_upgrade` | **비공개가 아니라 계정만 제한.** 게스트는 선택 가능 |

## 서비스 경로 실측 (LearnService + MemoryLearnStore, 게스트와 계정)

번들·인덱스 검증이 아니라 실제 `LearnService` 메서드를 호출했습니다(`tools/service-path-probe.test.ts.txt`, 결과 `recheck/da97f12/service-path-probe.json`). 긍정 대조군으로 같은 코드가 K1 힌트·시도·복습, 영어 E1·H2 연습·복습, 수학 은행 복습(은행 문항 반환)에서는 정상 동작함을 확인했습니다.

| 경로 | K7~K10 / 독해 / 은행 결과 |
|---|---|
| 직접 요청: 연습(`startSession practice`) | `unknown_skill` (k.k7~k10 4개 스킬, `en.el.hum1`, `e.h2.wh`는 문항이 있을 때만 존재) |
| 직접 요청: 레슨(`startSession lesson`) | `unknown_lesson` (korean-k7..k10-l1, en-el-hum1) |
| 복습(`kind: review`) | 복습 대상 스킬이 K7~K10뿐이면 `nothing_to_review`. K1과 K7·K10을 함께 복습 대기로 두면 **K1 문항 5개만** 반환 |
| 힌트 직접 요청 | `unknown_question` (k-k7/k9/k10, `bk-ko-*`, `bk-en-*`, `en-el-hum1-q1`) |
| 시도 제출·재도전(`submitAttempt`, `isReview`, `seenIds` 포함) | `unknown_question` — 채점되지 않음 |
| `completeLesson` | `unknown_lesson` |
| 계정 K7 온보딩 | `level_requires_db_upgrade`; 계정 K6 정상 |
| 진단(`diagnosticStep`) K7 게스트 | 문항 없이 곧바로 `done: true` |

**한계:** HTTP 라우트(`/api/learn/[action]`), 화면 컴포넌트, Supabase 콘텐츠 경로(`supabaseContent.ts`는 코드상 `publishedOnly`를 쓰지만 이번에 DB로 실행하지 않음)는 직접 호출하지 않았습니다. `/learn-content/*`는 `proxy.ts`가 브라우저 요청을 거절하는 것을 코드로만 확인했습니다. `generate-seed.mjs`는 math/english 정규 JSON만 쓰므로 영향이 없습니다.

## 남은 위험 (비공개 상태에서도)

1. **게스트 UX:** 게스트는 K7~K10을 온보딩에서 계속 고를 수 있고(`saveOnboarding` 성공) 고르면 코스·레슨이 하나도 없으며 진단은 즉시 종료됩니다. 안내 문구가 있어도 빈 화면 처리가 필요합니다.
2. **죽은 공개 API:** `bank.ts`의 `PRACTICE_BANKS`, `getAllBankQuestions`, `getBankQuestionsBySkill`이 여전히 두 은행 전체를 반환합니다(런타임 호출처는 현재 없음). 호출처가 생기면 비공개가 풀립니다.
3. **은행 JSON의 문항 상태:** 은행 파일 안의 문항은 여전히 `PUBLISHED`입니다. 격리는 로더가 비워서 이뤄지며 데이터 자체는 비공개 표시가 아닙니다.
4. **정규 K1~K6 문항이 변경됨:** 418개는 보존됐고 모두 PUBLISHED이지만 `e6da450`과 비교해 **40개의 내용이 바뀌었습니다**(해설 38, 보기 2, 문구 1; `recheck/da97f12/korean-k1-k6-changes-vs-e6da450.json`). 빈 풀이 해설(`means “”`) 수정이 대부분이지만, K6 요청 문항에서 보기·해설의 "Please wait."가 소문자 "please wait"로 바뀐 퇴보가 2건 있습니다(k-k6-requests-1, -2, -4).

## 독해 번역 해설과 정답 일치 (전수)

- 독해 오버레이 46개 × 56문항 = **2,576개 해설 전수 확인.** 영어가 아닌 45개 로케일의 2,520개는 모두 해설의 "option (X)"가 정답 키와 일치합니다(불일치 0). 정답 키는 A/B/C/D 14개씩입니다. 베트남어 56개는 별도 해설로 보기 글자를 쓰지 않습니다. 이전 검토의 1,890개 불일치는 해결됐습니다.
- **그러나 새로 확인된 결함:** 45개 로케일(비-vi)의 힌트 1이 **항상 정답 보기 문구를 인용**합니다(56/56, "Notice the core context and keywords: "…""). 즉 모든 문항에서 힌트가 정답을 알려 줍니다. 또한 힌트·해설 템플릿이 모든 로케일에서 영어 그대로입니다(번역되지 않음). 독해는 비공개라 학생에게 보이지는 않지만 공개 전 수정 대상입니다.

## 보존 확인

| 대상 | 기대 | 실측 |
|---|---|---|
| 수학 은행 | 6,672 | 6,672 (확장·학생 번들 모두), `bank/math.json` 파일이 `e6da450`과 동일 |
| 수학 정규 | — | 1,078, 정규 JSON 파일(elementary/demo/secondary)이 `e6da450`과 동일 |
| 영어 정규 | 628 | 628, 은행·독해 문항 0, 정규 JSON 파일 동일 |
| 한국어 K1~K6 | 418 | 418 (모두 PUBLISHED), 단 40개 내용 변경(위 4번) |

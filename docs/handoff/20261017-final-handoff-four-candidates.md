# 최종 인계 — 4개 후보 (2026-10-17)

이번 작업에서 **배포·원격 DB 변경·production 접근은 실행하지 않았다** (PRODUCTION_TOUCHED=NO). `origin/main`(=be08f10)은 수정하지 않았다. `full-hardening`은 main에 통째로 머지하지 않는다 — 아래 4개 후보를 각각 독립 브랜치로 분리했다. 모든 후보는 `origin/main`(be08f10)에서 갈라졌다.

## 1. 후보 4개

| # | 브랜치 | 최종 SHA | main 대비 변경 | 내용 |
|---|---|---|---|---|
| 1 | `claude/korean-rc-20261017` | 코드 `ff0e19cef498a177591529e08149192d441d319b` (검증 대상) / 문서 HEAD `758b516cb67b6a4cf7db5b5450e6a38b6820eaee` (문서 1개만 추가) | 153 files, +39,749/-244 | 한국어 코스 13,445문항 + 복습 모드/카드/음성 설정(한국어 사이트 전용) |
| 2 | `claude/english-hint-gate-rc-20261017` | `1683b17201e83f9deeb2689d9a24a388bb39a4dc` | 7 files, +254/-1 | 영어 힌트 2 fail-closed 게이트 (중립 힌트) |
| 3 | `claude/english-electives-rc-20261017` | `505f40c155a44a6496fca5f8f61a94fa9fb2fac7` | 83 files, +6,840/-689 | 영어 H3 선택과목 코스 + 은행 1,255문항 연결 |
| 4 | `claude/pronunciation-help-20261017` | `ae81ec7eaea468ea0f8d9be82290d30d0c5abb6e` | 58 files, +1,245/-46 | 발음 도움말 — **기본 숨김** |

참고: `claude/english-hint-safe-rc-20261017`(61e36f5 기반, 7b4b866)은 **superseded**(full 후보 콘텐츠를 포함해 독립 배포 불가) — 삭제하지 않고 남김. 대체: 위 #2. `claude/full-hardening-20261017`(b12af42)은 참조용 통합 후보이며 머지 대상이 아님.

변경 파일 전체 목록은 부록 A. 요약:
- #2: `lib/learn/hintGate.ts`, `lib/learn/content/bank/english-hint2-safe.json`, `lib/learn/content/{repository,assets}.ts`(훅 각 1~2줄), 테스트 2개, `docs/english-bank/hint2-gate.md`.
- #4: `lib/learn/pron.ts`, `components/learn/{PronTip,QuestionCard}.tsx`, `ko.ts` + 46개 locale JSON(`pron.*` 키), 테스트 2개, `docs/learn/pronunciation-*`.
- #1/#3: 부록 A 참조 (콘텐츠 JSON·overlay·시드 대량).

## 2. 상호 의존성 / 충돌 (실제 merge probe 결과)
임시 worktree에서 origin/main 위에 `#2 → #1 → #4 → #3` 순으로 `git merge`를 시도한 결과:
- #2 → main: 충돌 없음. #1 → (main+#2): 충돌 없음.
- #4 → (main+#2+#1): **`docs/learn/pronunciation-help.md` add/add 충돌 1건** (Korean RC에도 같은 이름의 초기 문서가 있음 — #4 버전 채택). `ko.ts`와 46개 locale JSON은 텍스트상 자동 병합됨 (병합 상태의 조합 테스트는 실행하지 않음).
- #3 → (main+#2+…): **`lib/learn/hintGate.ts` add/add 충돌** (#3은 범위를 좁힌 predicate `e-h3e-` / `e.h.*`, #2는 상위집합 `eb-|e-h3e-`) → **#2 버전 채택**. `repository.ts`/`assets.ts`/`english-hint2-safe.json`은 #2와 동일 내용이라 충돌 없음. **`asset-manifest.json` 내용 충돌** (#1·#3 둘 다 재생성) → `npm run learn:assets`로 재생성.
- 기능상 독립: #1(한국어)은 영어·수학에 영향 없음(Korean-only 게이트, DOM 비교 0 diff). #2는 `eb-` 문항만 건드림. #3은 영어 카탈로그/은행 콘텐츠. #4는 `PronTip` 컴포넌트가 기본 숨김.
- 어느 후보도 다른 후보의 코드를 **필요로 하지 않는다** (아래 독립 배포 가능 여부).

## 3. 검증 결과 (각 후보 최종 SHA, 로컬; 종료 코드)
순서: typecheck / 전체 vitest / DB 마이그레이션 체인(A·B·D) / 콘텐츠 에셋 재생성 / clean build / Worker 크기(<7.5 MiB) / 번들 시크릿 / 저장소 시크릿 스캔.

| 후보 | typecheck | vitest | DB | assets | build | Worker | bundle-secrets | secrets |
|---|---|---|---|---|---|---|---|---|
| #1 Korean RC @ff0e19c | 0 | 0 (1,418 passed) | 0 | 0 | 0 | 0 (5.55 MiB) | 0 | 0 |
| #2 hint gate @1683b17 | 0 | 0 (1,401 passed) | 0 | 0 | 0 | 0 (5.06 MiB) | 0 | 0 |
| #3 electives @505f40c | 0 | 0 (1,395 passed) | 0 | 0 | 0 | 0 (5.09 MiB) | 0 | 0 |
| #4 pronunciation @ae81ec7 | 0 | 0 (1,408 passed) | 0 | 0 | 0 | 0 (5.11 MiB) | 0 | 0 |

(#1의 758b516은 문서 1개 추가뿐 — `git diff ff0e19c 758b516 --name-only` = `docs/learn/korean-rc-grade-review-20261017.md`.) 로그: 세션 `/tmp/verify-*.log` (휘발성).
처음 #2에서 `english-bank-assets` 테스트 1건이 실패했으나(샤드 hint 2가 중립으로 바뀐 것을 기대하지 않음) 테스트를 고쳐 1683b17에서 전체 통과.

## 4. 병합 순서 권고 및 독립 배포 가능 여부
권고 순서: **#2 hint gate → #1 Korean RC → #4 pronunciation(숨김 상태) → #3 electives**.
- 근거: #2는 가장 작고 안전 정책이며 #3의 hintGate와 충돌하므로 먼저 넣고 #3에서 #2 버전을 채택. #1·#3은 둘 다 `asset-manifest.json`을 바꾸므로 나중 것은 재생성. #4는 `ko.ts`/locale을 건드리므로 #1 뒤.
- 독립 배포 가능: #1 예(Korean-only), #2 예, #3 예(자체 hint 게이트 범위 포함), #4 예(기본 숨김). 단 **병합 후 조합 테스트·staging 검증은 아직 실행되지 않았다** → 각 병합 뒤 전체 검증 재실행 필요.
- 모든 후보 배포는 별도 GO 필요.

## 5. 요구 보고 키
- CURRENT_PROD_MATH_ENGLISH_UNCHANGED: **YES (코드 수준)** — #1은 수학·영어 UI/API 동일(DOM 비교 0 diff, 한국어 전용 게이트), #3/#4는 영어 카탈로그 추가/숨김 UI. 실제 production에서는 확인하지 않음(PRODUCTION 접근 없음).
- KOREAN_RC_READY: **YES (로컬 검증), 단 staging·원격 검증 INCOMPLETE** — 코드 SHA ff0e19c.
- GRADE_MISMATCH_BLOCKERS: **0** — 4건 모두 메타데이터 불일치(공식 학년 표기 대 코스 배치). 상세 `docs/learn/korean-rc-grade-review-20261017.md`.
- K6_BLOCKER: **NO (후속 과제)** — K6은 읽기 중심이고 듣기/말하기/쓰기 영역이 부족하다. 학년 메타데이터 일관성과 실제 영역별 교육과정 충족은 **별개**이며, 메타데이터가 일치해도 영역 충족을 의미하지 않는다.
- ENGLISH_HINT2_FAIL_CLOSED: **YES** (#2, 서버 `loadIndex` + 샤드 로더, 우회 경로 테스트).
- RICH_HINT_SAFE_COUNT: **0** — "풍부한 힌트가 검토되었다"가 아님. 독립 검증으로 SAFE 판정된 힌트 2가 없다는 뜻.
- NEUTRAL_FALLBACK_COUNT: **main 12,882** (#2 기준); electives 포함 시 은행 14,137 + 선택과목 코스 42.
- 학습 언어별 표시: ko = 중립 한국어 문장, 그 외 46개 학습 언어 = 단어 없는 `💭` (한국어 문구 노출 없음, 테스트 확인).
- ELECTIVES_RC_READY: **YES (로컬 검증)**.
- CORE_DIAGNOSTIC_REVIEWED: **42/42** (AI 독립 검토 1차; 10문항에서 결함 지적 → 5건 문구 수정, `lit-d1` 재검토, 나머지는 힌트 2(중립 제공)·경미 항목). 교사/원어민 검토 아님.
- DUPLICATES: 0 (은행 키 기준 테스트) / UNLINKED: 0.
- PRONUNCIATION_HELP_READY: **기본 숨김으로 준비됨**, **EXPERT_REVIEW_REQUIRED=YES**. SOURCE_CHECK: 제9·13·18·20·23항에 대해 공식 규정 문구와의 **부분 대조**만 수행 — 전문가 검토가 아니다.
- PRODUCTION_TOUCHED: **NO**.

## 6. 수치 재집계 (로컬 `loadIndex` 기준; 코드로 재계산)
**영어** (`ko` 학습 언어 기준 서빙 = 전체)
| | main (be08f10) | #3 electives |
|---|---|---|
| 질문 ID 수 (전체 서빙) | 13,510 | 14,807 |
| ├ 영어 은행(`eb-`) | 12,882 | 14,137 (=12,882 기존 + 1,255 연결 — 바이트 동일 보존, 해시 85641b9c…) |
| ├ 선택과목 코스(`e-h3e-`) | 0 | 42 (35 core + 7 diagnostic) |
| └ 기존 카탈로그 | 628 | 628 |
| 정규화 고유 (스킬+프롬프트+보기+정답) | 13,510 | 14,807 |
| 더 느슨한 기준 (프롬프트+정답만) | 13,500 | 14,797 |
| 독립 학습 항목 | 파생 형식 없음 → ID 수와 같음 | 같음 |
| 언어별 서빙 (한국어 은행은 ko만) | ko 13,510 / 나머지 46개 언어 628 | ko 14,807 / 나머지 670 |
(느슨한 기준의 10건 차이는 프롬프트·정답이 같은 문항 쌍이다 — 개별 확인하지 않았으며, 엄격한 키 기준의 중복 테스트는 0건.) 영어 은행은 한국어 학습자용 콘텐츠라 다른 학습 언어에는 카탈로그(628/670)만 제공된다.

**한국어** (`scripts/learn/korean-counts.ts`, full-hardening 소스를 각 코드에 적용)
| | main | #1 Korean RC |
|---|---|---|
| 질문 ID 수 (`kb-`) | 11,184 | 13,445 |
| 정규화 고유 (스킬+대상+정답) | 11,180 | 13,381 |
| 독립 학습 항목 | 2,407 | 2,905 |
| 서빙 언어 수 | — | 47개 중 15개 (vi,en,zh-Hans,zh-Hant,mn,ru,uz,ne,th,ko,ja,id,fr,de,es 각 13,445) ; 나머지 32개는 0 |
형식별: read 534, listen 2,656, fromrr 210, meaning 2,446, toko 2,446, tf 2,446, sit 223, cloze 1,085, passage 249, choose 1,003, order 87, dict 60 (같은 항목의 형식 변형이며 독립 항목이 아님). 독립 항목 2,905개가 실질 학습량이고, 13,445는 형식 변형을 포함한 ID 수다.
- **K6은 읽기 중심**: 듣기·말하기·쓰기 영역 문항이 부족하다 (후속 과제, 블로커 아님).
- 학년 **메타데이터 일관성**(스킬의 학년 표기 대 공식 학년)과 **영역별 교육과정 충족**(읽기/듣기/말하기/쓰기별 실제 문항)은 별개로 취급한다. 전자는 4건 불일치 모두 분류 완료(블로커 0), 후자는 K6 등에서 미충족.
- 모든 번역은 AI 번역이며 교사·원어민 검토가 없다.

## 7. 이번 작업의 마지막 변경: `lit-d1` 힌트
`lit-d1`(운율 문제) 힌트 1이 두 차례 누출(범주 좁히기)로 판정되어 "정의를 자기 말로 풀어 본 뒤 맞는 보기를 고르세요" 형태의 중립 전략 힌트로 재작성하고 44개 언어로 재번역했다. 독립 검토(47개 언어): **누출 47/47 이상 없음**, 의미 일치 **45 ok + 2 판단 불가(sg·tet)**. 판단 불가 2개는 **미검증**으로 기록하며(AI 번역, 원어민 확인 없음), 소수 언어(am, gu, km, kn, ml, mr, my, ne, pa, si, te, sw, kk, uz, mn)는 신뢰도 보통 — 원어민 확인 필요.

## 8. INCOMPLETE (실행하지 않았거나 못한 것)
- **staging 검증: 미실행 (BLOCKED_MISSING_ENV)** — staging 환경 변수가 없고 production으로 대체하지 않았다. 따라서 staging 배포·staging 사용자 여정 모두 INCOMPLETE.
- **로그인 사용자 흐름 (계정·진행 저장): 미검증.** 로컬 브라우저 확인은 게스트/로컬 상태에서만 수행했고 **원격 검증이 아니다**.
- **production 검증: 미실행** (배포하지 않았으므로 해당 없음, 배포 후 필요).
- 4개 후보를 병합한 조합 상태의 전체 테스트·빌드: 미실행(순서대로 병합 후 재검증 필요).
- 영어 힌트 2 품질: 미보증 — 안전 입증이 없어 중립 힌트로 대체. SAFE 입증 절차(독립 검토자 2명 + 누출 검사)는 제안만 되어 있고 실행 전.
- 교사/원어민 검토: 없음 (한국어·영어 콘텐츠 모두 AI 검토).
- 발음 도움말 전문가 검토: 없음 (`EXPERT_REVIEW_REQUIRED`). 발음 규정 대조는 부분 대조이며 전문가 검토가 아님.
- 선택과목 번역 sg/tet: 판단 불가(미검증).
- Antigravity 로컬 변경: 원격 브랜치가 없어 가져오지 못함 (그쪽에서 push 필요). Antigravity 소유 검증 산출물은 수정하지 않음.

## 9. 다음 단계 (GO 후)
1. #2 머지 → 검증 → 2. #1 → 3. #4(숨김) → 4. #3, 각 단계 후 `npm run learn:assets`·전체 검증. 5. staging 환경 변수 확보 후 staging 배포·로그인 여정 검증. 6. 별도 GO 시 production.

## 부록 A. main 대비 변경 파일 (locale/overlay는 개수만)

### #1 korean (153 files)
```
app/api/learn/[action]/route.ts
app/study/[site]/(play)/cards/page.tsx
app/study/[site]/(play)/modes/page.tsx
app/study/study.css
components/learn/CardsPage.tsx
components/learn/CoursePath.tsx
components/learn/Dashboard.tsx
components/learn/LessonRunner.tsx
components/learn/Listening.tsx
components/learn/ModesPage.tsx
components/learn/OfficialGradeChip.tsx
components/learn/Onboarding.tsx
components/learn/PracticePage.tsx
components/learn/ProfilePage.tsx
components/learn/TtsSettings.tsx
components/learn/renderers.tsx
docs/learn/korean-counts.md
docs/learn/korean-rc-grade-review-20261017.md
docs/learn/pronunciation-help.md
docs/learn/pronunciation-research.json
docs/learn/review-modes.md
docs/learn/translation-coverage.md
lib/learn/content/asset-manifest.json
lib/learn/content/bank/korean-kit.en.json
lib/learn/content/bank/korean.json
lib/learn/content/korean-bank.ts
lib/learn/content/korean/course-grades.json
lib/learn/content/korean/item-grades.json
lib/learn/domain/answers.ts
lib/learn/i18n/ko.ts
lib/learn/korean-grades.ts
lib/learn/listen/speech.ts
lib/learn/listen/ttsSettings.ts
lib/learn/providers/audio.ts
lib/learn/review/korean-locale-status.json
lib/learn/reviewModes.ts
lib/learn/server/service.ts
lib/learn/types.ts
scripts/learn/korean-counts.ts
scripts/learn/korean-levels/build-course-grades.mjs
scripts/learn/korean/bank/PROTOCOL-KAUTHOR.md
scripts/learn/korean/bank/PROTOCOL-KBLIND.md
scripts/learn/korean/bank/PROTOCOL-KINFORMED.md
scripts/learn/korean/bank/additions/KA01-g2-past-plans.json
scripts/learn/korean/bank/additions/KA02-g2-services.json
scripts/learn/korean/bank/additions/KA03-g2-contact.json
scripts/learn/korean/bank/additions/KA04-g3-bridge.json
scripts/learn/korean/bank/additions/KA05-g3-honorific.json
scripts/learn/korean/bank/additions/KA06-g4-work.json
scripts/learn/korean/bank/additions/KA07-g5-media.json
scripts/learn/korean/bank/additions/KA08-g5-logic.json
scripts/learn/korean/bank/additions/KA09-g6-academic.json
scripts/learn/korean/bank/additions/KA10-g6-professional.json
scripts/learn/korean/bank/additions/KA11-g6-idiom.json
scripts/learn/korean/bank/additions/KA12-g6-writing.json
scripts/learn/korean/bank/additions/KB01-g6-expository.json
scripts/learn/korean/bank/additions/KB02-g6-editorial.json
scripts/learn/korean/bank/additions/KB03-g6-dialogue.json
scripts/learn/korean/bank/additions/KB04-g6-professional.json
scripts/learn/korean/bank/additions/KB05-g6-evidence.json
scripts/learn/korean/bank/additions/KB06-g6-figurative.json
scripts/learn/korean/bank/build.mjs
scripts/learn/korean/bank/kit-missing.mjs
scripts/learn/korean/bank/kit/de.json
scripts/learn/korean/bank/kit/es.json
scripts/learn/korean/bank/kit/fr.json
scripts/learn/korean/bank/kit/id.json
scripts/learn/korean/bank/kit/ja.json
scripts/learn/korean/bank/kit/ko.json
scripts/learn/korean/bank/kit/mn.json
scripts/learn/korean/bank/kit/ne.json
scripts/learn/korean/bank/kit/ru.json
scripts/learn/korean/bank/kit/source.en.json
scripts/learn/korean/bank/kit/source.minimal.en.json
scripts/learn/korean/bank/kit/th.json
scripts/learn/korean/bank/kit/uz.json
scripts/learn/korean/bank/kit/vi.json
scripts/learn/korean/bank/kit/zh-Hans.json
scripts/learn/korean/bank/kit/zh-Hant.json
scripts/learn/korean/bank/review-collect.mjs
scripts/learn/korean/bank/review-ledger.json
scripts/learn/korean/bank/review-prepare.ts
scripts/learn/translation-coverage.ts
tests/learn/bank-expansion.test.ts
tests/learn/dictation.test.ts
tests/learn/korean-bank.test.ts
tests/learn/korean-dict-and-mode-strings.test.ts
tests/learn/korean-grades.test.ts
tests/learn/korean-publication.test.ts
tests/learn/korean-review-data.test.ts
tests/learn/publish-english.test.ts
tests/learn/review-modes.test.ts
tests/learn/tts-settings.test.ts
(+ 14 overlay files, 46 locale files)
```

### #2 gate (7 files)
```
docs/english-bank/hint2-gate.md
lib/learn/content/assets.ts
lib/learn/content/bank/english-hint2-safe.json
lib/learn/content/repository.ts
lib/learn/hintGate.ts
tests/learn/english-bank-assets.test.ts
tests/learn/hint-gate.test.ts
(+ 0 overlay files, 0 locale files)
```

### #3 electives (83 files)
```
lib/learn/content/asset-manifest.json
lib/learn/content/assets.ts
lib/learn/content/bank/english-draft.json
lib/learn/content/bank/english-hint2-safe.json
lib/learn/content/bank/english-pending.json
lib/learn/content/listening/examples-ko.ts
lib/learn/content/listening/passages-ko.ts
lib/learn/content/repository.ts
lib/learn/content/secondary/english.json
lib/learn/content/semesters.ts
lib/learn/content/vi/secondary-english.json
lib/learn/hintGate.ts
scripts/learn/elementary/lib.mjs
scripts/learn/english-bank/build.mjs
scripts/learn/english-bank/electives-core.json
scripts/learn/english-bank/ledger.json
scripts/learn/english-bank/pools/H16-h-conv.json
scripts/learn/english-bank/pools/H17-h-job.json
scripts/learn/english-bank/pools/H18-h-media.json
scripts/learn/english-bank/pools/H19-h-world.json
scripts/learn/english-bank/pools/H20-h-lit.json
scripts/learn/english-bank/pools/H21-h-debate.json
scripts/learn/english-bank/pools/H22-h-write.json
scripts/learn/english-bank/report.json
scripts/learn/export-english-needed.mjs
scripts/learn/generated-layers.mjs
scripts/learn/secondary/data/elective-core.json
scripts/learn/secondary/english-h3-elective.mjs
scripts/learn/secondary/english.mjs
supabase/seed/learn_demo.sql
tests/learn/db-load-content-fields.test.ts
tests/learn/db.test.ts
tests/learn/english-electives.test.ts
tests/learn/english-world-names.test.ts
tests/learn/generated-layers.test.ts
tests/learn/grades.test.ts
tests/learn/listening-content.test.ts
tests/learn/secondary.test.ts
(+ 45 overlay files, 0 locale files)
```

### #4 pron (58 files)
```
components/learn/PronTip.tsx
components/learn/QuestionCard.tsx
docs/learn/pronunciation-help.md
docs/learn/pronunciation-l1-sources.json
docs/learn/pronunciation-research.json
docs/learn/pronunciation-rule-check-20261017.md
docs/learn/pronunciation-rule-verification.json
docs/learn/pronunciation-rules-sources.json
lib/learn/i18n/ko.ts
lib/learn/pron.ts
tests/learn/pron-strings.test.ts
tests/learn/pron.test.ts
(+ 0 overlay files, 46 locale files)
```

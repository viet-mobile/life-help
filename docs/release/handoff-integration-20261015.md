# 통합·공개 인계서 (2026-10-15) — `claude/sleepy-ride-4x56y2` → `main`

**상태: 배포 전.** 이 세션에는 Cloudflare 업로드 권한이 없습니다(아래 §7). 코드는 검증을 마쳤지만 **스테이징·프로덕션 배포와 원격 DB 적용은 아직 하지 않았습니다.** 배포 완료로 표현하지 마세요.

## 1. 병합할 정확한 SHA

| 항목 | 값 |
|---|---|
| 검증한 소스 SHA | `8243257531abfc7a68ba48e24619a683cfbe0e58` (새 clone + `npm ci`에서 아래 검사 전부 통과) |
| 병합 방식 | `origin/main`(`35561ea`)이 이 브랜치의 조상이므로 **빨리감기**: `git push origin 8243257:refs/heads/main` (또는 이후 문서만 바뀐 헤드) |
| 이 문서 이후 커밋 | 문서만 변경. 소스 SHA 이후 코드 변경이 생기면 아래 검사를 다시 실행 |

> ChatGPT 작업자는 통합이 끝날 때까지 공유 코드 수정과 `main` 푸시를 멈추기로 했습니다. 병합 직전에 `git fetch && git merge-base --is-ancestor origin/main <SHA>`로 `main`이 움직이지 않았는지 확인하세요.

## 2. 통합한 것
- 기존 실생활 도움 서비스(신청·상담·관리·인증)는 그대로입니다. 변경 파일은 학습 영역(`lib/learn`, `app/study`, `components/learn`, `content/`, `scripts/learn`, `tests/learn`, `supabase/migrations`)과 `package.json`의 `typecheck` 스크립트뿐입니다.
- `main`(수학 고교 은행 병합 `35561ea`) 위에 병합: Claude 영어 은행(`work/english-bank-claude`), 한국어 검토 콘솔 코스 열기·비밀번호 복구, 한국어 후속(`work/korean-bank-claude-followup`: 번역 키트·로케일·읽기 오버레이·도구).
- **제외**: Gemini 반복 복제 영어 은행(`bank/english.json`, 9,990 ID 중 정규화 후 고유 약 1,400, 고유 prompt 약 1,320). 파일도 런타임 연결도 가져오지 않았습니다. 이 계통의 "고교 3,330 고유" 수치는 검증되지 않았고 사실과 다릅니다.
- 충돌 해결: `bank.ts`·`korean.json`·`kit-extra/en.json`·`bank-expansion.test.ts`는 `main` 쪽, `asset-manifest.json`은 재생성.

## 3. 공개한 것 (학생 경로 연결)
| 과목 | 공개 내용 | 도달 경로 | 제한 |
|---|---|---|---|
| 수학 | 원래 은행 6,672 + 고교 은행 6,491 | `loadIndex` → 연습·복습·후속 | 고교 은행은 **한국어·영어 문구만** 있음. 다른 45개 언어는 고교 은행 없이 원래 은행만(다른 언어로 대체 표시 안 함) |
| 영어 | Claude 영어 은행 4,031 | `loadIndex("english")` | 문구가 한국어라 **한국어 학습자에게만**. 다른 언어 0 |
| 한국어 | 코스 K1~K10 전체(718), K6→K7 징검다리, 은행 11,184 | 온보딩 잠금 해제, 진단·레슨·연습 | 은행은 영어 + 의미 번역이 전부 있는 14개 언어(ko vi ja zh-Hans zh-Hant th id uz mn ru es fr de ne). 나머지 32개 언어는 **코스만**, 은행 0 |

- `math-hs.json`·`korean.json`(은행) 파일은 바이트 고정(검증 해시)이라 상태 필드를 고치지 않고 `bank.ts`가 PUBLISHED로 전개합니다.
- 한국어 코스 K7~K10 문항 300개를 `PUBLISHED`로 바꿨고(생성기 포함), `UNAVAILABLE_KOREAN_LEVELS`는 비어 있으며, 계정 저장 제한(`level_requires_db_upgrade`)을 제거했습니다.
- **AI 작성·AI 검토입니다.** 원어민·교사 검토가 아닙니다. 화면 어디에도 그렇게 표시하면 안 됩니다.

## 4. 수량 (`docs/release/bank-counts-generated.md`, `npx tsx scripts/learn/bank-counts.mts`)
| 과목 | 정규 코스 | 은행 ID | 은행 정확 고유 | 은행 정규화 고유(숫자 마스킹) | 독립 학습 항목 |
|---|---:|---:|---:|---:|---:|
| 수학 | 1,078 | 13,163 | 13,052 | 2,035 | 127 구조 |
| 영어 | 628 | 4,031 | 4,031 | 4,031 | 1,812 |
| 한국어 | 718 | 11,184 | 10,895 | 10,549 | 2,407 |

- 수학만 ID 기준 12,000을 넘습니다. 그러나 대부분 같은 구조에 숫자만 바꾼 변형입니다(구조 127개). 영어는 약 7,970 부족, 한국어는 816 부족(ID 기준)입니다. **목표 12,000 미달 과목: 영어, 한국어.**
- 영어 "12,279문항" 보고는 어느 커밋·원격 브랜치에도 없습니다(전 ref 검색). 원격에는 Claude 영어 은행 1차(초등 E01~E18 + 중등 M06·고등 H04 시범)의 4,031문항(독립 항목 1,821)뿐입니다. 12,279는 작성 당시 세션의 **미커밋·미푸시 파일**일 가능성이 큽니다. **영어 중등·고등 작성본은 해당 세션의 작업 폴더와 미푸시 커밋을 먼저 확인하세요.** 확인 전에 같은 내용을 다시 대량 생성하지 마세요.

## 5. 검증 결과 (소스 SHA `8243257`, 새 clone)
- `npm ci` → `next typegen && tsc --noEmit`: **오류 0**. (이전 보고의 3개 오류는 기존 오류가 아니라 Next 라우트 타입 미생성이 원인이었습니다. `typecheck` 스크립트가 이제 `next typegen`을 먼저 실행합니다.)
- `vitest run`: 77 파일 · **1,317 통과**. 교육과정 감사 `node --test scripts/curriculum/*.test.mjs`: 30/30. `test:learn:db`(PGlite 마이그레이션 게이트): 141/141. 한국어 코스 생성기 `--check` 통과. 콘텐츠 manifest 재생성 후 변경 없음.
- `npm run build`(OpenNext 새 빌드) 성공. `check:worker-size`: 5.70 MiB < 7.5. `test:learn:bundle`: 비밀정보 없음(PASS).
- 로컬 `next start`(APP_ENV=staging): `/study`, `/study/{math,english,korean}`, 각 `/onboarding` 모두 200, 🔒 표시 없음.
- 이번 검증에서 찾아 고친 결함: 수학 고교 영어 문구 39개 템플릿(`$` 불균형 1건, 수식 숫자 누락 38건), 영어 은행 표본 검토 결함 11개 항목 + 힌트 문구 2종, 순서 맞추기 채점이 같은 낱말 두 타일을 구분하던 문제(이제 낱말 기준), 오버레이 없는 언어가 정본 언어로 오인되던 버그.
- **영어 은행 독립 검토는 표본뿐입니다**: E 패킷 3,581문항 중 799문항(22%)을 5명의 검토자가 읽었고 정답 오류(blocker) 0, 모호 3, 경미 다수(보고서: `scripts/learn/english-bank/reviews/SAMPLE-*-20261015.json`). 나머지 약 2,800문항은 검토되지 않았습니다. 이 검토는 짧은 시간에 끝난 표본 점검이라 전수 검증이 아닙니다.
- **미검증**: 실제 스테이징에서 로그인한 계정으로 K7~K10 저장·진단·레슨·연습, 영어 은행의 실화면. 영어 독해(`rq` 699문항)의 정답 위치와 번역 해설의 전수 대조는 하지 않았고, 해설이 보기 글자를 가리키는 7건만 확인했습니다.

## 6. 필요한 DB 변경 (원격 적용은 맥북에서)
`supabase/migrations/202610150044_learning_korean_k7_k10.sql` — 가산적·멱등:
- `learn_progress_meta.level` CHECK: K1..K6 → K1..K10(`site='korean'`만, 컬럼 nullable 유지)
- `learn_courses.grade` CHECK: K7..K10 추가
- `learn_set_course_level(uuid,text,text)`: K1..K10 허용. `SECURITY DEFINER`, 빈 `search_path`, **service_role만 실행**(anon·authenticated 거부)을 유지하고 사후 조건이 이를 확인
- 행을 읽거나 바꾸거나 지우지 않습니다. 기존 K1~K6 데이터·RLS 정책은 그대로.
- 로컬 검증: `tests/learn/db-korean-k7-k10.test.ts`(K1~K10 저장, K11·K0·소문자·다른 사이트 거부, anon/authenticated 거부, 테이블 직접 쓰기 거부), `npm run test:learn:db` 141/141.
- **확정 순서** (2026-10-15 확인: 스테이징·운영 DB 모두 044 **미적용**): ① 스테이징 DB 적용 → ② 로그인 계정 검증 → ③ 운영 DB 적용 → ④ 배포. 044가 적용되기 **전에** 새 코드를 배포하면 로그인 계정의 K7~K10 저장이 DB 제약에서 실패하므로 ④는 ③ 뒤에만 합니다.

| 단계 | 할 일 | 통과 기준 |
|---|---|---|
| 0. 적용 전 기록 | 스테이징 SQL 편집기에서 `scripts/staging/044-check.sql` 실행, 결과 저장. `node scripts/staging/probe-044.mjs` | `levels_allow_k10=false`, 프로브 `NOT_APPLIED`. 두 번째 쿼리(레벨별 행 수)를 기록 |
| ① 스테이징 적용 | `supabase/migrations/202610150044_learning_korean_k7_k10.sql` 전체를 스테이징(`wreebowcbiymodswajwe`)에서 실행(SQL 편집기 또는 `supabase db push`). 파일 끝의 사후 조건 블록이 실패하면 전체가 롤백됨 | 오류 없이 종료 |
| ② 로그인 계정 검증 | `044-check.sql` 재실행. `node scripts/staging/probe-044.mjs --user <스테이징 테스트 계정 uuid>`. 이어서 스테이징 워커에 새 코드를 올리고 그 계정으로 로그인해 K7·K10 선택→새로고침 유지, 진단·레슨·연습 | `levels_allow_k10=true`, `grade_allows_k10=true`, `function_allows_k10=true`, 각 check 1개, `anon_can_execute=false`, `authed_can_execute=false`, `service_can_execute=true`, 레벨별 행 수가 0단계와 동일, 프로브 `APPLIED` + `ACCOUNT_PATH_K7_K10 = PASS` |
| ③ 운영 DB 적용 | ②가 모두 통과한 뒤에만. 운영(`wstdbymmkrqgtsibhcjz`) SQL 편집기에서 `044-check.sql`(적용 전) → 044 실행 → `044-check.sql`(적용 후) | 위 ②와 같은 기준. `probe-044.mjs`는 스테이징 전용이라 운영에는 쓰지 않음(SQL로 확인) |
| ④ 배포 | §8 | §9 |

- 044가 이미 적용된 DB에서 다시 실행해도 안전합니다(제약은 drop if exists 후 재생성, 함수는 `create or replace`).
- `probe-044.mjs`는 `.env.staging.local`의 스테이징 서비스 키를 쓰고 대상이 스테이징 프로젝트가 아니면 거부합니다. 기본 모드는 아무것도 쓰지 않으며, `--user` 모드는 테스트 계정의 레벨을 바꿨다가 원래 상태로 복원합니다. 반드시 일회용 스테이징 계정을 쓰세요.

## 7. 해결되지 않은 차단: Cloudflare 업로드 401
- 증상: `wrangler deploy` 에셋 업로드 `POST /accounts/<id>/workers/assets/upload` → `401 Unauthorized`.
- 원인(추정): 이 세션은 `api.cloudflare.com` 요청에 프록시가 토큰을 주입하는데, wrangler는 에셋 업로드에 별도 업로드 JWT를 보내고 프록시가 이를 덮어써 거절됩니다. 코드 문제가 아닙니다.
- 필요한 조치: 맥북(또는 `CLOUDFLARE_API_TOKEN`이 설정된 환경)에서 배포. 이 세션에서는 해결하지 못했습니다.
- 이전 배포 이력: 맥북에서 `life-help-site`(메인만, 학습 없음)가 배포되어 있습니다(버전 `780992b3-9bcb-4007-b526-07e661b97fbc`). 이 배포가 **롤백 기준 버전**입니다.

## 8. 맥북 실행 순서
```bash
cd /Users/juboklee/life-project/life-help      # 통일된 최종 폴더(없으면 새로 clone)
git fetch origin && git merge-base --is-ancestor origin/main 8243257 && echo FF_OK
git checkout claude/sleepy-ride-4x56y2 && npm ci
npm run typecheck && npx vitest run && node --test scripts/curriculum/*.test.mjs   # 선택: 재확인
# 1) DB 먼저 (스테이징 → 확인 → 프로덕션): supabase db push (또는 SQL 편집기에 044 파일 실행)
# 2) 스테이징 배포용 설정 (APP_ENV=staging은 /study 경로 접근에 필요, nodejs_compat_populate_process_env 포함)
cp wrangler.staging.jsonc wrangler.life-help-site.jsonc  # name을 life-help-site로, NEXT_PUBLIC_* vars 추가
export NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=…; unset AUTH_ENFORCEMENT
npm run build && npm run check:worker-size && npm run test:learn:bundle
npx wrangler deploy --config wrangler.life-help-site.jsonc --name life-help-site
npx wrangler secret put LEARN_SUPABASE_PUBLISHABLE_KEY --config wrangler.life-help-site.jsonc
npx wrangler secret put LEARN_SUPABASE_SECRET_KEY      --config wrangler.life-help-site.jsonc
```
- **프로덕션(`life-help`)은 `/study` 경로 접근이 설계상 꺼져 있습니다**(`APP_ENV` 없으면 `notFound`). 프로덕션에서 학습 사이트를 열려면 `docs/learning/production-learning-port-release-plan-2026-10-05.md`의 호스트 방식(math./english./korean. 서브도메인)을 따라야 하며, 이번 작업에서는 변경하지 않았습니다. 기존 워커 `life-help`, `life-help-staging`, `life-help-korean-review`, `viet-mobile`에는 배포하지 마세요.

## 9. 스테이징 확인 (각 항목 확인 후 체크)
1. `/study`, `/study/{math,english,korean}` 200.
2. 한국어 온보딩: K7~K10에 🔒 없음. **로그인한 계정**으로 K7·K10 선택 후 새로고침해도 유지(DB 044 적용 확인).
3. 한국어 K7 진단 → 레슨 → 연습에서 `kb-` 문항이 나옴. 영어(`en`)와 베트남어(`vi`)에서 문항 의미 보기가 해당 언어로 표시됨. 번역이 없는 언어(예: `am`)는 코스만 나옴.
4. 수학 H1~H3 연습에서 고교 문항(`b-hs-`)이 나오고(ko·en), `vi`에서는 원래 은행만.
5. 영어 연습에서 `eb-` 문항이 나옴(ko), 순서 맞추기에서 같은 낱말 타일 교환이 정답 처리됨.
6. 기존 서비스: 로그인, 신청, 상담, 관리자 진입이 이전과 같음.
7. 번들 검사·Worker 크기 통과(§5).

## 10. 롤백
- 코드: `npx wrangler rollback 780992b3-9bcb-4007-b526-07e661b97fbc --name life-help-site` (이전 버전). 사용자 영향이 없는 별도 워커라 `npx wrangler delete --name life-help-site`로 제거도 가능.
- DB: 044는 제약만 넓힙니다. 코드를 되돌려도 안전합니다(K7~K10 저장 행이 생겼다면 되돌려도 행은 남지만 읽기 오류는 없음). 제약을 K1..K6으로 되돌리려면 K7~K10 행을 먼저 정리해야 하므로 **되돌리지 말고 앞으로만** 적용하세요.

## 11. 남은 일 (출시와 분리)
- 영어: 12,000 미달(은행 ID 4,031). 중등·고등 작성본의 원래 세션 폴더 확인이 먼저. 나머지 약 2,800문항 전수 검토.
- 한국어: 12,000 미달(ID 11,184, 816 부족). 번역이 없는 32개 언어의 의미 번역(은행이 그 언어에서 켜지려면 `g:<id>` 전부 필요).
- 수학 고교 은행의 45개 언어 문구(362개 구조 × 4문구). 교사 검토.
- 영어 독해 전수 정답 위치·해설 검사. 읽기 고급 코스(`reading/english.json` 56문항)는 연결하지 않았습니다.
- 참고: 영어 은행은 독립 항목 1,812개가 형식 변형으로 4,031개가 됩니다.

## 12. 백업·정리 (아직 하지 않음)
- 복구 번들: 이 세션의 임시 경로에만 있습니다. 지속 위치로 옮기기 전에는 **브랜치를 삭제하지 마세요**.
- 브랜치·폴더 삭제는 §9 확인과 고유 작업 보존 확인 후 맥북에서 수행합니다. 영어 중등·고등 작성본이 아직 어디에도 푸시되지 않았다면 먼저 푸시하세요.

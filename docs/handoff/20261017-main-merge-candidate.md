# main 병합 후보 · 스테이징 결과 · 운영 절차

## main 병합 후보
- 브랜치 `claude/integration-rc-20261017`. **제품 코드 SHA `483d8d0ff501d87146a286a25482d0bf2bfcd1aa`** (스테이징 Worker가 이 코드로 빌드됨).
- 이후 커밋은 문서·스테이징 검사만 변경 (`git diff --name-only 483d8d0 HEAD` 에 docs/·tests/staging/ 밖의 파일 0개). 검사 보완 b28bcdd3…는 8ada891로, 인계 문서 96c1395는 40a175d로 체리픽(내용 동일). 병합 후보 HEAD = 이 문서를 포함한 최종 커밋(브랜치 끝). 병합 대상 base: origin/main `be08f101353367cd11c23f20204729b8b9a5c074` (변경 없음 확인).
- 로컬 검사(483d8d0): typecheck·전체 vitest 1,460·DB 체인·manifest·clean build·Worker 5.65 MiB·비밀정보 검사 모두 exit 0. 체리픽 후 typecheck exit 0.

## 스테이징 결과 (ChatGPT 실행, 인계서 `20261016-integration-staging-verification.md`)
- Worker `life-help-staging` version `67031d85-7363-4ec0-a487-511bfbf04ea4`, 콘텐츠 `ac85816d559bf65e`.
- PASS: 수학 도형, 한국어 K7·K10 계정 저장·새로고침·진단·레슨·연습·카드·받아쓰기, 영어 선택과목·중립 힌트(ko 문장 / vi·ar `💭`), 은행 직접 접근 404, 모바일 320px·RTL, DB gate, 동시성, 서비스 여정, 47개 언어 화면, 정리(RESIDUE=0, 기존 감사 1,911행 보존).
- **단일 전체 실행이 한 번에 완전 통과한 적은 없다**: 1차는 병렬 임시 계정 검사와 정리 겹침으로 실패, 2차는 국가 언어 검사에서 pakistan 요청 HTTP 503 1회(main-locale-smoke 17/18, 이후 learning/entitlements NOT_RUN). 해당 검사 단독 14/14 PASS, 이전 실행 learning 13/13·entitlements 7/7 PASS.
- **503 재현 시도 (이번 세션, 읽기 전용 GET)**: 같은 `x-forwarded-host: pakistan.life.help`로 순차 40회 + 10병렬 30회 = 70회 전부 HTTP 200. 재현되지 않음, **원인 미확정** (일시적 Worker/엣지 응답으로 추정은 하나 확인 못함). Worker 로그는 스테이징 인증이 없어 조회하지 않음. 반복 시 `wrangler tail --config wrangler.staging.jsonc`로 해당 요청 확인 필요.

## Mac 실행자용 최종 승인 전체 검사 절차 (인증 요청 반복 안 함)
1. `git checkout claude/integration-rc-20261017 && git rev-parse HEAD` — 제품 코드 483d8d0 포함 확인 (`git merge-base --is-ancestor 483d8d0ff501d87146a286a25482d0bf2bfcd1aa HEAD`).
2. 기존 gitignored `.env.staging.local`로 `npm run staging:preflight` = READY (ref wreebowcbiymodswajwe, production 제외).
3. 현재 배포가 67031d85… 인지 확인(코드가 동일하므로 재배포 불필요; 재배포 시 build → deploy `--config wrangler.staging.jsonc`).
4. **다른 임시 계정·DB 검사를 동시에 실행하지 않고** `npm run staging:integrated` 한 번 실행. exit 0 + CURRENT_RUN_RESIDUE=0 + FOREIGN_ROWS_UNTOUCHED가 승인 조건. 국가 언어 503이 다시 나오면 요청 헤더·시각·`wrangler tail`을 기록하고 승인 보류.
5. 로그인 계정 검사 `tests/staging/korean-rc-account.staging.spec.ts`는 단독으로(정리 단계와 겹치지 않게) 실행.

## 남은 제한 (완료로 집계하지 않음)
- 영어 힌트: 중립 힌트는 안전 대체일 뿐 **풍부한 힌트 검토 완료가 아님** (RICH_HINT_SAFE_COUNT=0). 품질 개선은 별도 후속 작업.
- 한국어: K6 등 읽기·대화 및 듣기·말하기·쓰기 영역 공백, 한국어 은행 번역 kit이 있는 15개 언어 외 **부분 번역 32개 언어**는 후속 작업. 이 후보는 해당 공백을 해결하지 않는다.
- AI 번역·검토는 교사/원어민 검토가 아님. sg·tet `lit-d1` 힌트는 영어 대체 유지.
- 발음 도움말: 전문가 검토 전까지 기본 숨김(`EXPERT_REVIEW_REQUIRED`).
- 운영 검증 미실행, 503 원인 미확정.

## 운영 배포 절차 (별도 GO 후에만)
1. main에 `claude/integration-rc-20261017` 병합(PR, 위 base 확인). CI 통과 확인.
2. 현재 운영 Worker 버전 ID를 `wrangler deployments list`로 기록(롤백 기준).
3. `npm run deploy` (콘텐츠 에셋 생성 → opennext build → deploy). 운영 DB 스키마 변경은 이 후보에 없음(마이그레이션 적용 불필요, 확인: DB 체인 테스트는 기존 023~026 기준).
4. 배포 직후 스모크: 메인·수학·영어·study.korean 응답, `/learn-content/*` 에셋, 로그인 후 진도 저장, 영어 hint 2 중립, 모바일/RTL.
## 롤백
- 즉시: `wrangler rollback <기록한 이전 version ID>` (Worker 버전 롤백, DB 변경이 없으므로 데이터 롤백 불필요). 
- 코드: main에서 병합 커밋 revert 후 재배포.
- 롤백 트리거: 로그인/진도 저장 실패, 5xx 반복, 수학·영어 기존 흐름 회귀, 힌트 정답 누출 신고.

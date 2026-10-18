# 최종 스테이징 승인 검사 — 실행 인계 (미실행)

상태: **STAGING_APPROVAL_RUN = NOT_RUN (BLOCKED_MISSING_ENV)**. 이 환경(Claude 클라우드 세션)에는 `.env.staging.local`이 없고 `npm run staging:preflight`가 10개 변수 MISSING으로 종료(exit 3)했다. 운영 인증으로 대체하거나 환경변수를 반복 요청하지 않았다. 전체 검사는 실행되지 않았으므로 "통과"가 아니다.

## 고정 사항 (2026-10-17 확인)
- origin/main = `be08f101353367cd11c23f20204729b8b9a5c074` (후보 base, 변경 없음).
- 후보 브랜치 `claude/integration-rc-20261017`, 후보 HEAD(검사 시점) `1b9be2a6f588b1c11448360c41f4228985fa431d` (이 인계 문서 커밋이 그 위에 추가되며 문서뿐). 제품 코드 `483d8d0ff501d87146a286a25482d0bf2bfcd1aa`는 후보의 ancestor.
- 스테이징 Worker `67031d85-7363-4ec0-a487-511bfbf04ea4`, 콘텐츠 `ac85816d559bf65e`(후보 `asset-manifest.json`과 동일, 이 세션에서 재생성해 같은 버전 확인). 제품 코드·배포 설정이 동일하므로 **재빌드·재배포 불필요**. 스테이징 공개 URL은 200 응답. `/learn-content/*`는 설계상 브라우저에 404이므로 외부에서 콘텐츠 버전을 직접 대조할 수 없다 — 대조는 Mac에서 `wrangler deployments list --config wrangler.staging.jsonc`(현재 version 67031d85…)와 후보 manifest 버전 비교로 한다.

## Mac 실행자 절차
1. `cd <repo> && git fetch origin && git checkout claude/integration-rc-20261017 && git rev-parse HEAD` — 1b9be2a… 이거나 그 위의 문서 전용 커밋인지 확인; `git merge-base --is-ancestor 483d8d0ff501d87146a286a25482d0bf2bfcd1aa HEAD` 성공 확인; `git diff --name-only 483d8d0 HEAD`에 docs/·tests/staging/ 외 파일이 없어야 함.
2. 다른 계정 생성·DB·스테이징 검사 프로세스가 **없는지** 확인(`ps`), 다른 작업자 트리는 건드리지 않는다.
3. `npm run staging:preflight` → `PREFLIGHT = READY`, ref `wreebowcbiymodswajwe`, production excluded = YES.
4. `npm run staging:integrated 2>&1 | tee ~/staging-approval-$(date +%Y%m%d-%H%M%S).log` — 단독 1회, 재시도·조건 완화 금지.
5. 기대 결과: 모든 게이트 PASS(db-gate, service-core 동시성, 서비스 여정, main 47개 언어 + 국가 기본 언어, 학습 suite, entitlements, cleanup, post-smoke), `CURRENT_RUN_RESIDUE = 0`, `FOREIGN_ROWS_UNTOUCHED = PASS`, `APPEND_ONLY_AUDIT_PRESERVED = PASS`(기존 감사 행 ≥ 1,911 보존), 신규 감사 행 전부 해당 실행 ID로 귀속, **종료 코드 0**.
6. 이후 단독으로 `npx playwright test -c playwright.staging.config.ts tests/staging/korean-rc-account.staging.spec.ts` (정리 단계와 겹치지 않게).
7. 실패/HTTP 503 시: 응답 시각(UTC), 경로, 요청 헤더, 응답의 `cf-ray` 기록 → `npx wrangler tail --config wrangler.staging.jsonc`(재현 시) 및 Cloudflare 대시보드 로그에서 해당 Ray ID 조회. 실패 테스트를 삭제·완화하지 말고, 개별 재검사 통과를 전체 통과로 쓰지 않는다. 이전 503: pakistan 국가 기본 언어 요청 1회 (원인 미확정, 70회 재요청 전부 200).
8. 로그 보관: 위 `~/staging-approval-*.log` 와 runner가 출력하는 실행 ID(run id)를 `docs/handoff/` 새 문서에 기록하여 후보 브랜치에 푸시. 결과 기록 형식: 후보 SHA / Worker 버전 / 콘텐츠 버전 / 실행 ID / 게이트별 종료 코드 / 남은 제한.

## 결과 판정
- exit 0 + 위 기대 결과 전부 → "main 병합 가능(별도 GO 필요)".
- 그 외 → 병합 보류, 원인 조사.
현재: **미실행. main 병합 가능 여부는 판단 보류(스테이징 단독 전체 실행이 아직 한 번도 통과하지 않음).**

## 남은 제한
영어 hint 2는 중립 대체(검토 완료 아님), 한국어 말하기·대화·저학년 쓰기 공백과 부분 번역 32개 언어는 미해결(후속 브랜치 `claude/followup-hints-ko-coverage-20261017`), AI 번역은 교사/원어민 검토 아님, 발음 도움말 기본 숨김, 운영 검증 미실행.

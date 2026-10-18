# 채팅 자동 갱신 수정 — 원인, 검증, 배포 인계

수정 브랜치 `claude/chat-autorefresh-fix-20261017` (출시 후보 `7706129a…` 위). **수정 코드 SHA `7a5ab4d26749e65295d25e47e25b1f548d8daecd`** (이 문서 커밋은 문서만 추가). origin/main = `be08f101353367cd11c23f20204729b8b9a5c074`(변경 없음). 새 기능·콘텐츠·번역 변경 없음.

## 원인 (조사 결과와 확실성)
실패 기록(STG-mvb00osw-d579cb): helper 전송 201·DB 저장, 고객 화면 visible·채팅 마운트, 30초 내 미표시, 새로고침 후 표시, 완료된 조회 0건.
- **재현된 결함 (단위 시험으로 입증)**: `usePoll`은 tick이 끝나야만 `running=false`로 돌려 다음 실행을 예약했다. `lib/service/client.ts`의 `fetch`에는 시간 제한이 없어, 응답이 오지도 실패하지도 않는 요청 하나가 `running`을 영구히 true로 남겼다. 이후 타이머·탭 복귀(visibilitychange)·다음 tick이 모두 `if (running) return`에 막혀 폴링이 **영구 정지**한다. 이는 관찰된 증상(마운트·visible인데 완료된 조회 0건, 새로고침으로만 회복)과 일치하며, 수정 전 코드에서 새 회귀 시험 6개가 실패(전부 이 결함 또는 아래 서버 지연)하고 수정 후 통과한다.
- **관련 증폭 요인 (코드로 확인)**: `withTranslations`가 번역이 필요한 새 메시지를 **순차**로 번역(메시지당 제공자 타임아웃 3.5초, 한 응답당 최대 8개 ≈ 28초)해, 목록 응답이 폴링 간격·관찰 창(30초)을 넘길 수 있었다.
- **확정하지 못한 것**: 스테이징에서 그 요청이 실제로 왜 멈췄는지(장기 서버 대기 / 네트워크 정지)는 이 세션에서 스테이징 로그·인증이 없어 직접 관찰하지 못했다. "원인 확정"이 아니라 "폴링 루프가 어떤 정지 요청에도 영구 정지하는 결함을 입증하고 제거"이다. 재실행 시 실패하면 아래 진단 출력으로 구분한다.

## 수정
- `lib/service/usePoll.ts`: tick 워치독 20초(`poll_timeout`으로 `onError` 보고 후 다음 tick 예약), 탭 복귀 시 10초 이상 대기한 tick은 폐기하고 즉시 새로 시작, 폐기된 tick의 늦은 결과 무시(세대 번호), 동기 예외도 다음 실행 예약. 정상적으로 느린 tick은 중첩 없이 유지.
- `lib/service/client.ts`: GET 15초 제한(`TIMEOUT` ApiError, 본문 읽기 포함). POST는 클라이언트 제한 없음(저장됐을 수 있는 쓰기이며 기존 clientId 멱등성으로 재시도).
- `components/service/ServiceChat.tsx`: 언어/대화 변경 중 비행 중이던 오래된 응답 폐기(epoch). 기존 `seen` 집합이 중복 표시를, `sending` 가드+clientId가 중복 전송을 막는 구조는 유지. 권한은 서버 SQL에서 요청·자격 단위로 판정하며 변경 없음.
- `lib/service/core.ts`: 번역을 동시 실행(총 대기 ≈ 제공자 1회 타임아웃), 메시지 순서 유지, 캐시 저장 실패는 번역 표시를 막지 않음(원문은 항상 표시, 실패는 FAILED 표시).
- 회귀 시험 `tests/service/chat-propagation.test.ts`(정지 tick 회복, 탭 복귀, 느린 tick 비중첩, 동기 예외, GET 타임아웃, 동시 번역), `staging-chat-probe.test.ts`(요청 시작/완료/실패/대기 수명주기).
- 스테이징 검사 보강(`tests/staging/chatProbe.ts`, `service-journey.staging.spec.ts`): 실패 보고에 `RECEIVER_REQUEST_LIFECYCLE`(시작·완료·실패 코드·진행 중 수·최장 대기, URL·본문·쿠키 없음)를 추가하고, 기존 양방향 전달 검사는 **그대로** 두고 회복 단계(첫 폴링을 영원히 보류 → 다음 메시지 표시, 폴링 실패 중 재시도 안내 후 복구, 중복 없음, 복구 후 고객→도우미)를 추가. 새로고침·강제 폴링·대기시간 확대 없음.

## 최종 SHA 검사 (7a5ab4d, 로컬)
typecheck 0 · 전체 vitest 1,467 passed (exit 0) · DB 체인 A/B/D 0 · manifest 재생성 diff 없음 0 · clean build 0 · Worker 5.63 MiB (<7.5) 0 · 번들 시크릿 0 · 저장소 시크릿 0.

## 스테이징·운영: **미실행 (이 환경에 스테이징 인증 없음)**
`npm run staging:preflight` BLOCKED_MISSING_ENV(10개 변수 없음). 환경에 주입된 Cloudflare API 토큰은 유효하나 스테이징 Supabase 공개키·테스트 DB 키·관리자 테스트 계정이 없어 전체 `staging:integrated`(정리·감사 귀속 포함)를 실행할 수 없고, 부분 실행을 승인으로 보고하지 않는다. **운영 배포·main 병합은 승인 조건(스테이징 단독 전체 실행 exit 0)이 충족되지 않아 수행하지 않았다.** 어떤 배포도 완료로 보고하지 않는다.

### Mac 실행자 절차
1. `git fetch && git checkout claude/chat-autorefresh-fix-20261017`; `git rev-parse HEAD`가 7a5ab4d… 또는 그 위 문서 전용 커밋인지 확인(`git diff --name-only 7a5ab4d HEAD`가 docs/ 밖 없음).
2. `npm run staging:preflight` = READY. 다른 임시 계정·DB·스테이징 검사 프로세스 없음 확인.
3. 스테이징 빌드·배포: `NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npx opennextjs-cloudflare build && npx wrangler deploy --config wrangler.staging.jsonc` (이전 버전 `67031d85-7363-4ec0-a487-511bfbf04ea4` 기록 — 스테이징 롤백 대상). 번들 검사(`npm run test:learn:bundle`).
4. `npm run staging:integrated 2>&1 | tee ~/staging-chatfix-$(date +%Y%m%d-%H%M%S).log` 단독 1회. 통과 조건: exit 0, 서비스 여정(양방향 + 회복 단계) PASS, CURRENT_RUN_RESIDUE=0, FOREIGN_ROWS_UNTOUCHED, APPEND_ONLY_AUDIT_PRESERVED, 신규 감사 행 전부 귀속. 이어서 단독으로 `tests/staging/korean-rc-account.staging.spec.ts`. 실패/503 시 시각·경로·`cf-ray`·`RECEIVER_REQUEST_LIFECYCLE` 기록, `wrangler tail`로 조사하고 재실행 통과로 원인 해결을 보고하지 않는다.
5. 통과 시: origin/main 최신을 이 브랜치에 병합(`git merge origin/main`, 강제 푸시 금지) → 제품 코드가 달라지면 그 SHA로 위 로컬 검사 재실행 → `main`에 병합·푸시.
6. 운영: `wrangler deployments list`로 현재 운영 Worker 이름·버전·도메인과 롤백 대상 기록 → 운영 설정으로 빌드(스테이징 키 미포함: 번들·저장소 시크릿 검사) → 가능하면 `wrangler versions upload` 후 트래픽 0% 확인 → 승격(`wrangler versions deploy`) → 운영 스모크(메인·서비스 요청 흐름[구분된 테스트 계정/데이터만]·수학/영어/한국어 학습 기본 흐름·채팅 양방향) → 이상 시 `wrangler rollback <기록한 버전>`.
7. 결과(후보 SHA, 스테이징·운영 Worker 버전, 실행 ID, 종료 코드, 롤백 버전)를 `docs/handoff/`에 기록해 푸시.

## 남은 제한
스테이징·운영 검증 미실행. 스테이징 실제 정지 요청의 서버/네트워크 원인은 미관찰(위 참고). 영어 힌트 중립 대체·한국어 부분 번역 32개 언어·교사/원어민/발음 전문가 검토 미완 등 기존 제한은 `20261017-main-merge-candidate.md` 유지.

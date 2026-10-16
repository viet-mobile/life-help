# 통합 후보 (claude/integration-rc-20261017) — 인계

**최종 코드 SHA: `483d8d0ff501d87146a286a25482d0bf2bfcd1aa`** (이 문서를 추가하는 커밋은 문서만 변경). origin/main = `be08f101353367cd11c23f20204729b8b9a5c074` (be08f10 이후 변경 없음 확인). 운영 배포·원격 DB 변경·브랜치/폴더 삭제 없음 (PRODUCTION_TOUCHED=NO).

## 병합 (인계서 SHA와 대조 완료, 모두 ancestor)
1. 힌트 게이트 `1683b17201e83f9deeb2689d9a24a388bb39a4dc` — 충돌 없음
2. 한국어 RC `758b516cb67b6a4cf7db5b5450e6a38b6820eaee` (코드 ff0e19c…) — 충돌 없음
3. 발음 도움말 `ae81ec7eaea468ea0f8d9be82290d30d0c5abb6e` — `docs/learn/pronunciation-help.md` add/add 충돌 → 발음 후보 버전 채택
4. 영어 선택과목 `505f40c155a44a6496fca5f8f61a94fa9fb2fac7` — `hintGate.ts` 충돌 → **힌트 게이트 버전 유지**; `asset-manifest.json` 충돌 → 통합 콘텐츠로 재생성

통합 후 추가 커밋: sg/tet `lit-d1` 대체 문구, 통합 테스트 `tests/learn/integration-rc.test.ts`, 선택과목 테스트를 통합 정책(전체 은행 중립 힌트)에 맞게 수정(데이터 바이트 동일성 검사는 유지), manifest 재생성.

## 통합 확인 (로컬)
- 영어 은행 서빙 14,137 + 선택과목 42: **전부** hint 2가 중립(풍부한 hint 2 0건, 정답 누출 0건), `english-hint2-safe.json` ids=[] (RICH_HINT_SAFE_COUNT=0). 한국어 외 학습 언어는 `💭`.
- 한국어: 47개 언어 모두 기존 코스 718문항 유지(main과 동일). 은행은 언어별 전부-또는-없음: 15개 언어 13,445(dict 60 포함), 나머지 32개 0 — main과 같은 범위(번역 kit이 없는 언어가 코스를 잃지 않음). dict는 dict 템플릿이 있는 언어에만.
- 발음 도움말 기본 숨김 (`pronTipsVisible()=false`), EXPERT_REVIEW_REQUIRED 유지.
- **sg·tet `lit-d1` 힌트 1**: 번역 미검증 → 검토된 영어 문구로 대체 제공(오버레이 수정 + 테스트). **번역 검토 완료로 집계하지 않음.** `export-english-needed --merge`로 오버레이를 재생성하면 되돌아가므로 `integration-rc.test.ts`가 막는다. 설명(explanation) 등 sg/tet의 다른 AI 번역도 원어민 검토 전이다.

## 최종 SHA 검사 (483d8d0, 종료 코드)
typecheck 0 · 전체 vitest 0 (1,460 passed) · DB 체인 A/B/D 0 · manifest 재생성 0 (diff 없음) · clean build 0 · Worker 5.65 MiB (<7.5) 0 · 번들 시크릿 0 · 저장소 시크릿 0.

## 스테이징: **BLOCKED_MISSING_ENV — 배포·검증 미실행**
`npm run staging:preflight` → `.env.staging.local` 없음, 10개 변수 MISSING (SERVICE_CORE_SUPABASE_URL/SECRET_KEY, EXPECTED_SERVICE_CORE_SUPABASE_REF, SERVICE_CORE_STAGING_CONFIRM, SERVICE_CORE_STAGING_ANON_KEY, TEST_SUPABASE_URL/SERVICE_ROLE_KEY/ANON_KEY, TEST_LIFE_HELP_SYS_ADMIN_ID/PASSWORD). 승인된 스테이징 인증이 없고 빌드에 필요한 `NEXT_PUBLIC_SUPABASE_*`도 없어 배포하면 로그인·진도 저장이 깨진 스테이징이 되므로 배포하지 않았다. 운영 인증·Cloudflare 토큰으로 대체하지 않았다.

실행 절차 (승인된 스테이징 인증을 가진 사람/세션):
1. `git checkout claude/integration-rc-20261017` (SHA 483d8d0 확인), `.env.staging.local` 준비 → `npm run staging:preflight` = READY (staging ref `wreebowcbiymodswajwe`, production 거부).
2. `NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npx opennextjs-cloudflare build && npx wrangler deploy --config wrangler.staging.jsonc` (Worker `life-help-staging`). 배포된 Worker 버전 ID 기록.
3. `npm run staging:integrated` (docs/staging-integrated.md).
4. 수동/브라우저 확인: ASSETS 로딩(`/learn-content/*`), 로그인·진도 저장·새로고침, 한국어 K7~K10·받아쓰기·복습·카드, 영어 선택과목·힌트(한국어 중립 문장 / 타 언어 `💭`), 수학 도형, 기존 실생활 도움 서비스, 모바일(320/390)·RTL(ar/ur).

## INCOMPLETE
스테이징 배포, 스테이징 Worker 버전, 스테이징 ASSETS·로그인·진도 저장·새로고침·K7~K10·받아쓰기·복습·카드·영어 선택과목/힌트·수학 도형·실생활 도움 서비스·모바일·RTL 확인, 운영 검증 — **전부 미실행**. 로컬 검사 결과는 원격 검증이 아니다. 영어 힌트 2는 미검증(중립 대체), AI 번역·검토는 교사/원어민 검토 아님, 발음 전문가 검토 없음. Antigravity 로컬 변경은 가져오지 않았다.

# 검토 환경 (배포됨)

**검토 URL: https://life-help-think-review.simpl2eye.workers.dev/think-pilot** — Cloudflare Worker `life-help-think-review` (자체 Worker, 스테이징·운영 Worker·DB와 무관, 비밀·DB 없음, noindex + robots Disallow).

- 코드: 브랜치 `claude/thinking-pilot-20261017`. 빌드/배포: `./scripts/think/deploy-review-worker.sh` (Next 빌드에서 컴파일된 CSS를 가져와 `scripts/think/standalone.tsx`를 esbuild로 묶고, 데이터까지 포함한 단일 모듈 Worker를 Cloudflare API로 업로드하고 workers.dev를 켠다. `wrangler deploy`의 정적 자산 업로드는 이 환경에서 401로 거부되어 쓰지 않았다. `wrangler.think-review.jsonc`는 Mac에서 wrangler로 배포할 때 쓰는 대안 설정.)
- 현재 배포 내용: 470개 과제(수학 210·영어 140·한국어 120) + 5개 언어 지시문(en, zh-Hans, zh-Hant, ja, vi) — 아래 숫자는 이전 436개 배포 때의 확인 기록이며, 470개 확인은 재배포 후 갱신. 업로드 직후 확인: 목록 436개, **436개 과제를 정답 키로 끝까지 풀기(390px)** — 436/436 완료, 가로 스크롤 0, 콘솔 오류 0. (320px 실행 결과는 인계서에 별도 기록.) 이는 화면이 동작하는지에 대한 원격 확인이며 과제 내용의 품질 검증이 아니다.
- 되돌리기/제거: `curl -X DELETE https://api.cloudflare.com/client/v4/accounts/<account>/workers/scripts/life-help-think-review` (이 Worker 전용). 운영·스테이징에는 영향 없음.
- 갱신: 과제 JSON 수정 → `node scripts/think/gen-extra-index.mjs` → `npx vitest run tests/think` → 위 배포 스크립트.

## 2026-10-18 갱신: 3개 Worker
- 번역을 모두 한 모듈에 넣으면 Worker 압축 전 한도(63.9 MiB)를 넘는다(95 MiB). 그래서 `./scripts/think/deploy-review-worker.sh`는 세 Worker를 올린다: `life-help-think-review`(페이지, 과제, ko·en 번역), `life-help-think-review-ovl-a`(zh-Hans, zh-Hant), `life-help-think-review-ovl-b`(ja, vi). 페이지는 `https://<ovl>.simpl2eye.workers.dev/o/<언어>/<파일키>.json`을 CORS로 가져온다.
- 배포 내용: 과제 1,576개(기존 470 + 신규 1,106), 6개 언어 지시문. 확인 결과와 숫자는 `REPORT-1484.md`.
- 삭제(이 세 Worker 전용): `DELETE /accounts/<account>/workers/scripts/<name>`.

## 본 앱 스테이징·운영에 필요한 자격 증명 (이 환경에는 없음)
`wrangler.staging.jsonc` 기준 Worker 비밀: `LEARN_SUPABASE_PUBLISHABLE_KEY`, `LEARN_SUPABASE_SECRET_KEY`(통합 트리에서는 `SERVICE_CORE_SUPABASE_SECRET_KEY`, `LIFE_HELP_SYS_ADMIN_ID`, `LIFE_HELP_SYS_ADMIN_PASSWORD`, `LIFE_HELP_SYS_SESSION_SECRET`)와 Workers 배포 권한 토큰. 이름과 분류는 `scripts/staging/contract.cjs`. 사용자가 클라우드 환경 설정(환경 편집 → 네트워크 비밀/환경 변수)에 스테이징 전용 값을 넣고 새 세션을 시작하면 쓸 수 있다. 값을 채팅에 붙여 넣지 않는다. 운영 값을 스테이징 대용으로 넣지 않는다.

## 2026-10-18 본 앱 스테이징 배포 시도 결과: **배포하지 못함** (SHA `8f2ec6b`)
- 빌드 확인(통과): `node scripts/learn/build-content-assets.mjs && opennextjs-cloudflare build` 성공, `wrangler deploy --config wrangler.staging.jsonc --dry-run` 성공(에셋 1,825개, 125 MiB, gzip 24 MiB). 이 빌드에는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 자리표시 값을 썼으므로 **이 산출물을 배포하면 안 된다**.
- 막힌 곳: 에셋 업로드 `POST /accounts/<id>/workers/assets/upload`가 401. 이 환경의 프록시가 `api.cloudflare.com` 요청의 `Authorization`을 주입 토큰으로 바꿔서, 업로드 세션이 발급한 JWT가 거부된다(세션 생성은 성공, 업로드만 401). 그래서 이 환경에서는 에셋이 있는 Worker를 올릴 수 없다. (에셋 없는 검토용 Worker는 `scripts/think/deploy-review-worker.sh`로 올린다.)
- 스테이징 Worker `life-help-staging`에는 필요한 비밀 15개가 이미 설치되어 있다(이름만 조회: Supabase 키, `LIFE_HELP_SYS_*` 포함). 배포 때 비밀은 유지된다.
- Mac(또는 프록시가 없는 곳) 실행 절차:
  1. `git checkout claude/thinking-pilot-20261017 && git pull`, `npm ci`
  2. `export CLOUDFLARE_API_TOKEN=<Workers 배포 권한 토큰> CLOUDFLARE_ACCOUNT_ID=f31907ac016e3095fbeec224acaa2bdb`
  3. `export NEXT_PUBLIC_SUPABASE_URL=https://wreebowcbiymodswajwe.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=<스테이징 anon 키(Supabase 프로젝트 설정 → API, 공개 키)>`
  4. `node scripts/learn/build-content-assets.mjs && npx opennextjs-cloudflare build && npx wrangler deploy --config wrangler.staging.jsonc`
  5. 확인: https://life-help-staging.simpl2eye.workers.dev/study/math 허브 진입, 대시보드의 사고력 카드, `/study/math/think`에서 과제 하나 풀기(언어별), `/study/korean/think`(ko·en). 스테이징 DB는 바뀌지 않아야 한다.
  6. 되돌리기: `npx wrangler deployments list --name life-help-staging`로 이전 버전 ID를 기록해 두었다가 `npx wrangler rollback <ID> --name life-help-staging`.
- 운영 배포는 하지 않았고, 스테이징 확인과 별도 승인 뒤에만 한다.

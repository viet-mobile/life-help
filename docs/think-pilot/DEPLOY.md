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

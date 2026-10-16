# 검토 환경 (배포됨)

**검토 URL: https://life-help-think-review.simpl2eye.workers.dev/think-pilot** — Cloudflare Worker `life-help-think-review` (자체 Worker, 스테이징·운영 Worker·DB와 무관, 비밀·DB 없음, noindex + robots Disallow).

- 코드: 브랜치 `claude/thinking-pilot-20261017`. 빌드/배포: `./scripts/think/deploy-review-worker.sh` (Next 빌드에서 컴파일된 CSS를 가져와 `scripts/think/standalone.tsx`를 esbuild로 묶고, 데이터까지 포함한 단일 모듈 Worker를 Cloudflare API로 업로드하고 workers.dev를 켠다. `wrangler deploy`의 정적 자산 업로드는 이 환경에서 401로 거부되어 쓰지 않았다. `wrangler.think-review.jsonc`는 Mac에서 wrangler로 배포할 때 쓰는 대안 설정.)
- 현재 배포 내용: 436개 과제(시범 36 + 초안 400). 업로드 직후 확인: 목록 436개, **436개 과제를 정답 키로 끝까지 풀기(390px)** — 436/436 완료, 가로 스크롤 0, 콘솔 오류 0. (320px 실행 결과는 인계서에 별도 기록.) 이는 화면이 동작하는지에 대한 원격 확인이며 과제 내용의 품질 검증이 아니다.
- 되돌리기/제거: `curl -X DELETE https://api.cloudflare.com/client/v4/accounts/<account>/workers/scripts/life-help-think-review` (이 Worker 전용). 운영·스테이징에는 영향 없음.
- 갱신: 과제 JSON 수정 → `node scripts/think/gen-extra-index.mjs` → `npx vitest run tests/think` → 위 배포 스크립트.

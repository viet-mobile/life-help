# 검토 환경 배포 (미실행 — Mac 실행자용)

상태: **검토 환경에 배포되지 않았다.** 이 세션에서 `npx wrangler deploy --config wrangler.think-review.jsonc`를 시도했으나 정적 자산 업로드(`POST /workers/assets/upload`)가 401로 거부됐다(프록시가 주입하는 Cloudflare 토큰이 자산 업로드용 세션 JWT 헤더를 덮어쓰는 것으로 보임; 이 환경에서는 우회하지 않았다). Worker 목록은 변하지 않았다(`life-help`, `life-help-korean-review`, `life-help-site`, `life-help-staging`, `viet-mobile`). 운영·스테이징 Worker는 건드리지 않았다.

로컬 확인(이 SHA의 프로덕션 빌드, `next start`): 36개 과제를 정답 키로 끝까지 풀기(`/think-pilot`, 320·390·1280px) — 36/36 완료, 가로 스크롤 0, 콘솔 오류 0. OpenNext Worker 빌드 성공, Worker 5.74 MiB (< 7.5 MiB). 이것은 로컬 확인이며 원격 검증이 아니다.

## 실행 절차
1. `git fetch && git checkout claude/thinking-pilot-20261017 && git rev-parse HEAD` (코드 SHA는 아래 기록 참고; 문서만 추가된 후속 커밋 가능).
2. `npm ci`(필요 시) → `node scripts/learn/build-content-assets.mjs && npx opennextjs-cloudflare build`.
3. `npx wrangler deploy --config wrangler.think-review.jsonc` → Worker `life-help-think-review` (자체 이름, 다른 Worker·DB·비밀 없음). 검토 URL: `https://life-help-think-review.simpl2eye.workers.dev/think-pilot` (워커 서브도메인은 스테이징과 같은 `simpl2eye`로 추정; wrangler 출력의 URL을 기록).
4. 확인: 목록에 36개, 과제 하나를 끝까지 풀기(선택/줄/서술/숫자/단계 공개), 모바일 폭, "검토자 보기" 체크박스, 의견 JSON 내보내기. 페이지는 noindex이며 로그인·DB를 쓰지 않는다. 이 Worker는 전체 앱 빌드를 담지만 비밀·DB 설정이 없어 다른 기능은 동작하지 않는다.
5. 배포 후 Worker 버전 ID와 URL을 이 문서에 기록. 되돌리기: `npx wrangler delete --name life-help-think-review` (이 Worker 전용, 다른 것에 영향 없음) — 또는 그대로 두고 링크만 비공개.

# K7~K10 학습 과정을 검토 환경에서 직접 풀어 볼 수 있게 열기: 설계 (미구현)

요청: 검토 환경에서 K7~K10(과 징검다리, 새 문제은행)을 목록이 아니라 **실제 학습 흐름(온보딩 → 학습 지도 → 레슨 → 연습)** 으로 열어 달라는 것.

현재(`origin/chatgpt/korean-review-password-recovery-20261015`): 검토 콘솔(`/study/korean/review`)은 모든 문항을 읽기 전용 목록으로 보여 주지만, 학습 흐름은 일반 서비스와 같은 격리 코드를 쓴다 — `publishedOnly`가 DRAFT 레슨을 지우고, `bankQuestions()`는 `KOREAN_BANK_LIVE=false`이면 빈 목록, `pickPractice` 등은 PUBLISHED만 받고, 온보딩은 K7~K10을 막는다.

## 제안(격리 코드를 약화하지 않는 방식)
1. 서버 게이트: 검토 Worker(`KOREAN_REVIEW_MODE=1`, APP_ENV staging|local)에서만, `reviewAccess()`가 `ok`(로그인한 검토자)일 때만 켜짐. 그 외 모든 호스트·요청은 지금과 같음.
2. 콘텐츠: `loadIndex(site, { review: true })` — 검토자 요청에만 메모리 안에서 K1~K10 전체(+징검다리, 은행 11,184문항)를 PUBLISHED로 보여 주는 별도 번들. 일반 번들·`publishedOnly`·`KOREAN_BANK_LIVE`는 그대로.
3. 진도: 검토 모드에서는 계정 상태를 쓰지 않고(userId=null) 브라우저 저장(guest) 방식 — DB 쓰기·`level_requires_db_upgrade` 제약 우회 없음, 사용자 진도와 섞이지 않음(검토 Worker는 별도 origin이라 localStorage도 분리).
4. 화면: 검토 환경 배너("미검토 · AI 번역 · 진도는 이 브라우저에만"), 온보딩의 K7~K10 잠금 해제(검토 모드에서만).
5. 테스트: 일반 환경에서 K7~K10·은행이 여전히 보이지 않음(기존 `quarantine`·`korean-exclusion-integrity`·`korean-level-unavailable` 테스트 유지), 검토 모드·비검토자·플래그 없음 조합별 접근 테스트.

## 막힌 이유
이 변경은 `repository.ts`/`bank.ts`/`service.ts`/`runtime.ts`의 격리(quarantine) 경로에 "검토자일 때 우회" 분기를 추가합니다. 이 세션의 권한 분류기가 이를 "보안 약화"로 보고 편집을 거절했습니다. 우회하지 않고 멈췄습니다.

## 선택지
- A) 사용자가 이 변경을 명시적으로 허용(세션 권한 규칙 추가)하면 Claude가 위 설계를 구현·테스트·푸시하고 ChatGPT가 검토 Worker에 배포.
- B) ChatGPT/사용자가 직접 구현(위 설계를 그대로 사용).
- C) 현재의 목록형 콘솔로 검토(레벨·스킬·언어별 문항, 정답 표시, 문제 기록·내보내기).

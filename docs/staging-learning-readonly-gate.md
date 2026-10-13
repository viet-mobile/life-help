# 스테이징 학습 DB 읽기 전용 점검 보완

기준 커밋: Claude `06683ba`. 학습 콘텐츠와 Worker 코드는 변경하지 않았습니다.

## 자동 API 검사

`node scripts/staging/db-gate.mjs`는 기존 프로젝트·키 검증을 유지하며 다음을 추가합니다.

- 024의 학습 기반 테이블 및 서버 API, 025의 콘텐츠 API, 026의 staff 테이블을 서비스 키 OpenAPI에서 확인합니다. trigger 반환 함수는 API 경로가 아니므로 제외합니다.
- 043의 `learn_questions.figure` 및 `learn_courses.elective` 컬럼을 OpenAPI 정의에서 각각 확인합니다. 기존 `learn_load_content` 이름만 있다고 043이 충족된 것으로 취급하지 않습니다.
- 서비스 키로 학습 문항 테이블을 읽을 수 있는지 확인하고, 공개키로 26개 학습 테이블(콘텐츠·정답·진도·staff·entitlement 포함)과 기존 service 테이블에 접근하면 실패합니다. 신규 테이블 검사는 GET, `limit=0`이므로 행 내용을 요청하지 않습니다. HTTP 200의 빈 배열도 접근 거부의 증거가 아닙니다.
- 이미 있던 service/entitlement RPC 권한 검사는 유지합니다. 새 학습 변경 RPC 실행은 추가하지 않습니다.

로그의 `MIGRATION_OBJECTS_VISIBLE`은 API 후속 상태를 나타냅니다. `MIGRATION_HISTORY = NOT_VERIFIED`를 명시합니다. 접근권한·스키마 캐시 문제도 객체 누락으로 보일 수 있으므로, `MIGRATIONS_PENDING` 출력만 보고 같은 마이그레이션을 재적용하지 않습니다.

## 별도 카탈로그 검사

023의 임시 shim 정리, 026의 private staff 정책, 027의 학년 CHECK 조건은 OpenAPI만으로 확인할 수 없습니다. 가용 API 경로가 있어도 이 항목들이 검증된 것은 아닙니다.

환경과 프로젝트를 확인한 뒤 **Supabase 스테이징 프로젝트** SQL editor 또는 확인된 연결에서 `scripts/staging/learning-catalog-readonly.sql`을 실행합니다. 이 쿼리는 `BEGIN TRANSACTION READ ONLY` 안에서 시스템 카탈로그만 조회하고 `ROLLBACK`합니다. 사용자 행·정답·비밀키를 조회하지 않고 스키마를 변경하지 않습니다.

출력 `learning_catalog_report`에서 확인할 항목:

- 학습 테이블 26개와 각각 `rls=true`, `anon_select=false`, `anon_write=false`, `service_select=true`.
- `figure`가 jsonb, `elective`가 boolean이며 NOT NULL, `level` 컬럼 존재.
- 학년 조건 3개: 각 컬럼을 제한하는 CHECK가 하나씩 존재하고 validated 상태. 초등 학년 E1~E6 및 elementary가 허용되는 정의인지 검토. 현재 028에서 넓힌 language/K1~K6 조건도 보존되어야 합니다.
- 콘텐츠 staff 정책 14개가 `learn_security.is_staff`를 사용하고 private predicate가 SECURITY DEFINER와 고정 search_path를 유지.
- `remaining_shim_markers`가 빈 배열. marketplace의 표시 없는 기존 역할·함수를 제거하라는 의미는 아닙니다.

이 SQL은 메타데이터를 제공하며 실제 migration history를 자동 판정하지 않습니다. 적용 계획이 필요하면 스테이징 migration history와 실제 정의를 별도로 대조합니다. 자동 API gate가 PASS라고 해도 별도 카탈로그 검토를 생략하지 않습니다.

## 실행 상태

로컬에서 mock API 검사와 실제 전체 마이그레이션을 적용한 PGlite 카탈로그 검사를 수행합니다. 실서비스 스테이징 환경변수와 Cloudflare 인증은 제공되지 않았으므로 실제 스테이징 DB 검사·DB 변경·seed 적용·Worker 배포는 실행하지 않았습니다. 환경 설정 위치는 `docs/staging-readiness-280716c.md`를 따릅니다.

검증 결과: 관련 테스트 33개 통과, 전체 Vitest 57개 파일·1,021개 테스트 통과, `tsc --noEmit` exit 0. 실제 환경의 preflight와 db-gate는 각각 `BLOCKED_MISSING_ENV` exit 3으로 종료했습니다.

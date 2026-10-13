# 스테이징 마이그레이션 043 적용 계획 (승인 전 — 아직 실행하지 않음)

기준: 저장소 `7a753aa`, 스테이징 프로젝트 `wreebowcbiymodswajwe`. production은 대상이 아닙니다.

## 근거 (운영자가 실행한 읽기 전용 결과)

- `db-gate`: 043의 컬럼 두 개가 서비스 키에 보이지 않음 (`MIGRATIONS_PENDING`).
- 카탈로그 SQL: `learn_questions.figure`, `learn_courses.elective`가 DB에 없음 (`exists:false`). 캐시 문제가 아님.
- 이력 테이블(`supabase_migrations.schema_migrations`): 저장소의 모든 학습 마이그레이션(`202609300023`~`027`, `202610070028`, `080029`, `090040`, `100041`, `110042`)이 있고 `202610130043`만 없음.
- 같은 이력에 이 저장소에 없는 버전이 있음(`202609250001`~`202609290023`, `202610050028` 등): 다른 계보에서 적용된 것으로, 이번 계획에서 건드리지 않음. 특히 `202610050028`은 저장소의 `202610070028`(korean_study)과 별개의 028이므로 번호만 보고 판단하지 말 것.

## 043의 내용 (추가형)

1. `learn_questions.figure jsonb` 추가 (16384바이트 이하 CHECK, null 허용).
2. `learn_courses.elective boolean not null default false` 추가.
3. `learn_load_content(text)` 재생성(figure, elective 필드 포함), 실행 권한은 `service_role`만.

기존 행은 변하지 않습니다. 데이터 삭제·seed 없음. 저장소에는 043의 down 스크립트가 없습니다.

## 적용 절차 (승인 후 운영자가 스테이징에서만)

1. 대시보드 프로젝트 ref가 `wreebowcbiymodswajwe`인지 확인.
2. 롤백 대비 현재 정의를 저장: SQL Editor에서 `select pg_get_functiondef('public.learn_load_content(text)'::regprocedure);` 결과를 로컬 파일로 보관(내용에 비밀 없음).
3. `supabase/migrations/202610130043_learning_question_figure.sql` 파일 한 개만 SQL Editor에서 실행(하나의 트랜잭션으로, 다른 마이그레이션은 포함하지 않음).
4. `insert into supabase_migrations.schema_migrations(version, name) values (…)`로 이력을 직접 기록하지 말 것. Supabase CLI로 적용한 경우에만 이력이 생기므로, SQL Editor로 적용하면 이력에 043이 없는 채로 남음. 이력을 맞추는 방법(CLI `db push` 또는 `migration repair`)은 별도 승인 항목.
5. 적용 후 `node scripts/staging/db-gate.mjs`와 카탈로그 SQL을 재실행해 컬럼 두 개 존재, 26개 테이블의 RLS·공개키 거부 유지, `MIGRATIONS_PENDING = none` 확인.

## 롤백

컬럼 두 개 삭제(`alter table … drop column figure / elective`)와 2단계에서 저장한 함수 정의 재실행. 컬럼에 값이 쓰이기 전(seed 적용 전)에만 데이터 손실 없이 가능.

## 승인 필요 항목

- 043 적용 자체, 이력 기록 방식(4단계), seed 적용(별도), Worker 배포(별도).

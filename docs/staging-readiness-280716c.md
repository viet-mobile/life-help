# 스테이징 준비 상태 (콘텐츠 커밋 280716c)

값은 어디에도 적지 않습니다. 변수 이름, 값을 확인하는 위치, 파일 경로만 기록합니다.

## 로컬 파일

`./.env.staging.local` (저장소 루트, git 무시됨). 템플릿은 `.env.staging.local.example`입니다.
`node scripts/staging/preflight.mjs`(= `npm run staging:preflight`)는 SET / MISSING과 프로젝트 ref만 출력합니다.

| 변수 | 소비자 | 값을 확인하는 위치 |
|---|---|---|
| `SERVICE_CORE_SUPABASE_URL` | service-core 하네스 | Supabase 대시보드 > staging 프로젝트(`wreebowcbiymodswajwe`) > Project Settings > API (URL) |
| `SERVICE_CORE_SUPABASE_SECRET_KEY` | service-core 하네스 | 같은 화면의 API Keys > secret 키(`sb_secret_…`) |
| `EXPECTED_SERVICE_CORE_SUPABASE_REF` | ref 가드 | 고정값: staging ref |
| `SERVICE_CORE_STAGING_CONFIRM` | 실행 확인 | 고정값: staging ref |
| `SERVICE_CORE_STAGING_ANON_KEY` | 공개키 거부 검증 | API Keys > publishable 키(`sb_publishable_…`) |
| `TEST_SUPABASE_URL` | 학습 스위트·픽스처 | 위와 같은 staging URL |
| `TEST_SUPABASE_SERVICE_ROLE_KEY` | 학습 스위트·픽스처 | 위와 같은 secret 키(같은 프로젝트면 동일 자격 증명) |
| `TEST_SUPABASE_ANON_KEY` | 학습 스위트 | 위와 같은 publishable 키 |
| `TEST_LIFE_HELP_SYS_ADMIN_ID` / `_PASSWORD` | 관리자 브라우저 시나리오 | staging Worker에 설정한 관리자 secret과 동일한 값(운영자 보관) |

production ref(`wstdbymmkrqgtsibhcjz`)가 어느 값에든 들어 있으면 `REFUSED`입니다.

## Worker 설정 (`wrangler.staging.jsonc`, Worker `life-help-staging`)

- 파일에 선언된 변수: `APP_ENV=staging`, `LEARN_SUPABASE_URL`, `EXPECTED_LEARN_SUPABASE_REF`, `SERVICE_CORE_SUPABASE_URL`, `EXPECTED_SERVICE_CORE_SUPABASE_REF`.
- `npx wrangler secret put <이름> --config wrangler.staging.jsonc`로 운영자가 설정할 secret: `LEARN_SUPABASE_PUBLISHABLE_KEY`, `LEARN_SUPABASE_SECRET_KEY`, `SERVICE_CORE_SUPABASE_SECRET_KEY`, `LIFE_HELP_SYS_ADMIN_ID`, `LIFE_HELP_SYS_ADMIN_PASSWORD`, `LIFE_HELP_SYS_SESSION_SECRET`. 설치 여부는 `npx wrangler secret list --config wrangler.staging.jsonc`로 확인합니다(Cloudflare 인증 필요).
- 빌드 시 공개 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(레거시 마켓플레이스 세션 헬퍼).
- Cloudflare 배포 인증: `wrangler login` 또는 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`.

## 현재 절차에서 확인된 공백 (코드는 바꾸지 않음)

1. `scripts/staging/db-gate.mjs`의 `REQUIRED` 마이그레이션은 028, 029, 040, 041, 042뿐입니다. 학습 기반(023~026), 027(초등 학년), 043(문항 도형 컬럼 `learn_questions.figure`, `learn_courses.elective`)의 적용 여부는 검사하지 않습니다. 043은 테이블·함수를 만들지 않아 현재의 "객체 생성" 추론으로는 검출할 수 없고, PostgREST OpenAPI의 컬럼 정의로 확인해야 합니다.
2. 학습 `learn_*` 테이블에 대한 공개키(anon) 거부 검사가 없습니다(entitlement·service-core만 검사). 이전 `learn_staging_verify.sql`이 하던 읽기 전용 확인에 해당합니다.
3. 마이그레이션 적용 도구가 없습니다. 문서(`docs/LEARNING_RELEASE.md`)는 임시 작업 디렉터리에 필요한 파일만 두고 적용하라고 하며, 연결된 CLI 프로젝트가 staging인지 확인하는 가드(`assert-staging-link`)가 없습니다. 적용을 실행하는 단계에서 필요합니다.
4. `supabase/seed/learn_demo.sql`은 로컬/PGlite 전용 가드만 있습니다. staging에 seed를 적용하는 표식 가드와 전용 스크립트는 없고, staging 학습 스위트는 Worker 자산에서 콘텐츠를 읽으므로 이번 검증에는 필요하지 않습니다.

위 1·2는 읽기 전용 확장으로 추가할 수 있고, 3·4는 DB를 바꾸는 단계에서 다시 설계할 항목입니다.

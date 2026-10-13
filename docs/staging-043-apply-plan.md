# 스테이징 043 적용 계획 — 검토 완료, 실행 전

기준: Claude 계획 `ebe10e1`, 스테이징 프로젝트 `wreebowcbiymodswajwe`. 운영자가 제공한 카탈로그·이력 결과를 근거로 합니다. ChatGPT는 실제 DB에 접속하거나 이 결과를 독립 재조회하지 않았습니다.

## 선택한 이력 기록 방식

**SQL Editor에서 043만 하나의 트랜잭션으로 적용 → 카탈로그/함수 검증 → CLI `migration repair 202610130043 --status applied --linked`로 그 버전만 기록**하는 방식을 권장합니다. 승인 범위에는 실제 043 적용과 그 버전의 이력 기록을 함께 포함합니다. seed와 Worker 배포는 별도 작업입니다.

현재 remote-only 이력이 있으므로 043만 넣은 임시 디렉터리에서 전체 `db push`를 시도하는 방식은 선택하지 않습니다. 다른 버전을 reverted로 표시하거나 임시 빈 마이그레이션을 만들어 계보를 맞추지 않습니다. repair는 스키마를 적용하는 명령이 아니라 이력만 고치는 명령이며, 실제 적용 성공과 검증 이후에만 실행합니다.

공식 참고: https://supabase.com/docs/reference/cli/supabase-migration-repair

## 적용 전 운영자가 보관할 자료

대시보드의 프로젝트 ref를 확인하고 다음 읽기 전용 결과를 로컬에 보관합니다. 함수 정의만으로는 권한을 복원할 수 없으므로 owner와 ACL도 저장합니다.

```sql
select p.oid::regprocedure as signature,
       pg_get_functiondef(p.oid) as function_definition,
       pg_get_userbyid(p.proowner) as owner,
       p.proacl::text as acl,
       p.prosecdef, p.proconfig
from pg_proc p
where p.oid = to_regprocedure('public.learn_load_content(text)');

select case when a.grantee = 0 then 'PUBLIC'
            else pg_get_userbyid(a.grantee) end as grantee,
       a.privilege_type, a.is_grantable
from pg_proc p,
     lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
where p.oid = to_regprocedure('public.learn_load_content(text)');

select version from supabase_migrations.schema_migrations order by version;
```

`learning-catalog-readonly.sql`의 적용 전 결과도 보관합니다. 조건은 figure/elective 모두 없음, 043 이력 없음, 그 외 현재 점검 정상입니다. 다른 계보 버전은 그대로 보존합니다. 승인 시점까지 상태가 달라졌다면 아래 적용을 진행하지 않고 다시 비교합니다.

대상 파일은 `supabase/migrations/202610130043_learning_question_figure.sql` 원문 전체입니다. 검토한 파일의 SHA-256은 `ebfb223685b9fe7c58b11115a8106d3f101b325119e21b801c0acf4dff44bad7`입니다. 적용 직전 다시 대조합니다. 기존 컬럼 값을 바꾸는 DML은 없으며, 기존 course 행의 새 elective 값은 DEFAULT false로 보입니다.

## 승인 후 실행할 스키마 적용

1. Worker 콘텐츠 소스·seed를 변경하지 않은 상태에서 대상과 백업을 확인합니다.
2. SQL Editor에서 아래 시작 부분, **043 파일 원문 전체**, 아래 종료 부분을 한 스크립트로 붙여 실행합니다. 파일 자체에는 BEGIN/COMMIT이 없으므로 래퍼를 반드시 포함합니다. 원문을 일부 생략하거나 여러 번 나눠 실행하지 않습니다.

시작 부분:

```sql
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
-- 이 위치에 043 파일 원문 전체를 넣습니다.
```

종료 부분(파일의 마지막 GRANT 뒤):

```sql
do $verify$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='learn_questions'
      and column_name='figure' and data_type='jsonb'
  ) then raise exception '043: figure column verification failed'; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='learn_courses'
      and column_name='elective' and data_type='boolean' and is_nullable='NO'
  ) then raise exception '043: elective column verification failed'; end if;
  if has_function_privilege('anon','public.learn_load_content(text)','EXECUTE')
     or has_function_privilege('authenticated','public.learn_load_content(text)','EXECUTE')
     or not has_function_privilege('service_role','public.learn_load_content(text)','EXECUTE')
  then raise exception '043: content RPC permissions verification failed'; end if;
end
$verify$;
commit;
```

SQL 오류나 잠금 타임아웃을 COMMIT 성공으로 취급하지 않습니다. SQL Editor 결과를 확인하고, 필요하면 ROLLBACK으로 중단된 트랜잭션을 해제합니다. 이 경우 repair applied는 실행하지 않습니다.

## 적용 후 검증과 이력 기록

1. 카탈로그 SQL을 재실행합니다. figure=jsonb, elective=boolean NOT NULL, 26개 테이블의 RLS·공개키 거부·staff 정책·학년 제약조건이 유지되어야 합니다.
2. `pg_get_functiondef`를 다시 조회하여 검토한 043의 함수 본문, SECURITY DEFINER, 빈 search_path, owner·ACL을 대조합니다. DB 콘텐츠가 비어 있어도 `select public.learn_load_content('math');`와 `'english'`가 예외 없이 반환되는지 확인할 수 있습니다. 그러나 빈 DB에서는 도형/선택과목의 실제 데이터 표시까지 검증한 것으로 취급하지 않습니다. 확인을 위해 seed를 추가하지 않습니다.
3. CLI용 전용 디렉터리에서 `supabase init`, `supabase link --project-ref wreebowcbiymodswajwe`를 실행합니다. 링크 정보 `supabase/.temp/project-ref`도 이 ref와 일치해야 합니다. 기존 production 링크를 재사용하지 않습니다. 필요하면 이 디렉터리의 migrations에 043 파일만 둡니다.
4. 스키마·함수 검증 후 **이 버전 하나만** 기록합니다.

```sh
supabase migration repair 202610130043 --status applied --linked
```

5. SQL Editor에서 이력을 재조회합니다. 043이 추가되고 나머지 version 집합은 적용 전과 같아야 합니다.
6. `node scripts/staging/db-gate.mjs`에서 `MIGRATIONS_PENDING = none`과 접근 검사 PASS를 확인합니다. 카탈로그는 정상인데 API 컬럼이 보이지 않으면 캐시를 조사하고 043을 재적용하지 않습니다.

스키마 적용은 성공했지만 repair가 실패했다면 상태는 **스키마 적용 완료·이력 기록 미완료**입니다. 함수와 카탈로그를 다시 확인하고 repair만 재시도합니다. SQL 자체를 반복 적용하지 않습니다.

## 롤백 계획

적용 트랜잭션 중 실패하면 ROLLBACK으로 돌아갑니다. COMMIT 후 롤백은 별도로 판단하고, 저장한 함수 정의·owner·ACL을 사용합니다.

- 새 필드를 사용하는 처리를 멈추고, 한 트랜잭션에서 양쪽 테이블에 ACCESS EXCLUSIVE 잠금을 잡습니다.
- `figure IS NOT NULL` 행 또는 `elective=true` 행이 있으면 데이터 손실을 피하기 위해 컬럼 삭제를 중단합니다. 이 값들을 먼저 지우지 않습니다.
- **저장한 이전 함수 정의를 먼저 복원하고, 변경된 PUBLIC/anon/authenticated/service_role 권한을 백업과 일치시킵니다.** CREATE OR REPLACE는 owner를 유지하므로 owner도 대조합니다.
- 그다음 figure/elective를 CASCADE 없이 삭제합니다. 이전 함수 호출·RLS·권한을 확인하고 COMMIT합니다. 새 외부 의존성이 있으면 강제로 삭제하지 않습니다.
- 스키마 롤백 성공을 확인한 뒤에만 `supabase migration repair 202610130043 --status reverted --linked`로 043 이력을 제거합니다. 다른 버전은 건드리지 않습니다.

## 실행 상태

이 문서는 실행 전 검토를 마친 계획입니다. 실제 DB 변경·migration repair·seed 적용·Worker 배포는 실행하지 않았습니다. 운영자가 **043 스키마 적용과 043만의 이력 기록**을 명시적으로 승인한 뒤 실행하는 범위입니다.

로컬 검증: 실제 저장소 마이그레이션을 043 이전까지 적용한 PGlite에서 위 트랜잭션 래퍼로 043을 실행하고, 두 컬럼 및 콘텐츠 RPC 호출을 확인했습니다. 기존 비학습 카탈로그와 auth 사용자 해시가 유지되었고, 이전 함수를 먼저 복원한 뒤 컬럼을 제거하자 함수 정의·ACL이 원상복구되었습니다. 이 검증은 실제 스테이징이나 CLI 이력 기록의 실행 결과가 아닙니다.

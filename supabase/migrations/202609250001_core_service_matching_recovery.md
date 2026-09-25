# [PHASE 1] Supabase 마이그레이션 복구 및 검증 가이드

본 문서는 `202609250001_core_service_matching_schema.sql` 마이그레이션을 스테이징 또는 프로덕션 Supabase 데이터베이스에 적용하기 전과 후에 참조하는 안전 운영 가이드입니다.

---

## 1. 마이그레이션 적용 전 확인사항

1. **프로덕션 관리자 승인 여부**:
   - 프로덕션 DB에 적용하기 전 반드시 최종 배포 승인을 확인합니다.
2. **사전 연결 점검**:
   - 대상 DB의 URL 및 Service Role Key가 올바른 대상 환경·스테이징 또는 프로덕션인지 검증합니다.
3. **기존 데이터베이스 오브젝트 확인**:
   - 기존 `public.notifications` 테이블이 원형 그대로 존재하는지 확인합니다.

---

## 2. 신규 생성 오브젝트 목록

본 마이그레이션으로 신규 생성되는 오브젝트는 다음과 같습니다.

### 신규 Enum 타입 · 8종
- `public.service_request_status`
- `public.assignment_status`
- `public.conversation_type`
- `public.conversation_status`
- `public.message_sender_role`
- `public.escalation_reason`
- `public.escalation_status`
- `public.notification_recipient_type`

### 신규 테이블 · 9종
- `public.service_requests`
- `public.helpers`
- `public.helper_services`
- `public.helper_regions`
- `public.request_assignments`
- `public.conversations`
- `public.messages`
- `public.admin_escalations`
- `public.app_notifications`

### 신규 고유 인덱스 및 제약조건
- `request_assignments_active_uidx`: 요청당 활성 배정 단 1건 제약
- `request_assignments_helper_active_uidx`: 헬퍼당 동시 활성 배정 단 1건 제약
- `service_requests.service_slug` 10대 서비스 CHECK 제약
- `helper_services.service_slug` 10대 서비스 CHECK 제약

### 신규 저장 프로시저
- `public.match_and_assign_helper(p_request_id uuid)`: SECURITY DEFINER · search_path 고정

---

## 3. 적용 성공 확인 SQL

마이그레이션 적용 후 PostgreSQL 클라이언트 또는 Supabase SQL Editor에서 아래 쿼리를 실행하여 무결성을 검증합니다.

```sql
-- 1. 신규 테이블 9종 생성 및 RLS 활성화 확인
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'service_requests',
    'helpers',
    'helper_services',
    'helper_regions',
    'request_assignments',
    'conversations',
    'messages',
    'admin_escalations',
    'app_notifications'
  );
-- 기대 결과: 9개 행 모두 rowsecurity = true

-- 2. 고유 인덱스 2종 생성 확인
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'request_assignments_active_uidx',
    'request_assignments_helper_active_uidx'
  );
-- 기대 결과: 2개 행 모두 확인

-- 3. 저장 프로시저 권한 확인
select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'match_and_assign_helper';
-- 기대 결과: 1개 행 · security_type = DEFINER
```

---

## 4. 절대로 삭제하면 안 되는 기존 오브젝트

마이그레이션 실패 또는 롤백 검토 시 아래 기존 테이블들은 과거 결제·정산 및 사용자 프로필과 연계되어 있으므로 **절대로 DROP하거나 ALTER해서는 안 됩니다**.

- `public.notifications` · 기존 마켓플레이스 알림 테이블
- `public.profiles` · 기존 프로필 테이블
- `public.user_roles` · 기존 권한 테이블
- `public.orders` · 기존 주문 테이블
- `public.payments` · 기존 결제 테이블
- `public.technician_settlements` · 기존 정산 테이블

---

## 5. 중간 실패 시 확인 및 수동 롤백 복구 방법

본 마이그레이션은 `begin; ... commit;` 단일 트랜잭션 블록으로 감싸져 있으므로 중간 오류 발생 시 PostgreSQL 엔진에 의해 자동 롤백됩니다.

만약 수동으로 신규 오브젝트를 정리해야 할 경우, 기존 테이블에 영향을 주지 않고 안전하게 제거 가능한 순서는 다음과 같습니다.

```sql
-- 안전 수동 롤백 스크립트 · 신규 오브젝트만 역순 제거
begin;

drop function if exists public.match_and_assign_helper(uuid);

drop table if exists public.app_notifications cascade;
drop table if exists public.admin_escalations cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.request_assignments cascade;
drop table if exists public.helper_regions cascade;
drop table if exists public.helper_services cascade;
drop table if exists public.helpers cascade;
drop table if exists public.service_requests cascade;

drop type if exists public.notification_recipient_type cascade;
drop type if exists public.escalation_status cascade;
drop type if exists public.escalation_reason cascade;
drop type if exists public.message_sender_role cascade;
drop type if exists public.conversation_status cascade;
drop type if exists public.conversation_type cascade;
drop type if exists public.assignment_status cascade;
drop type if exists public.service_request_status cascade;

commit;
```

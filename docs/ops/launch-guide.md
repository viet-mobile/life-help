# LIFE.HELP 공식 오픈 가이드 (운영자 작업)

코드로 처리할 수 있는 항목은 모두 저장소에 반영되어 있습니다. 이 문서는 **대시보드/계정에서 운영자가 직접 해야 하는 작업**과
오픈 전 운영 절차(법무, 아동 동의, 모니터링, 백업)를 순서대로 설명합니다. Cloudflare·Supabase 화면의 메뉴 이름은 개편으로
조금씩 다를 수 있으니, 이름이 다르면 같은 뜻의 메뉴를 찾아 주세요.

확인 명령: `node scripts/ops/launch-check.mjs https://life.help` (운영자 정보 누락, 보안 헤더, 법무 페이지, 헬스체크를 점검하고,
빠진 항목이 있으면 목록과 함께 종료 코드 1을 반환합니다).

---------------------------------------------------------------------------------------------------------------------

## A. Cloudflare 보안 설정

### A1. HTTPS 강제 (5분)
1. Cloudflare 대시보드 → 도메인 `life.help` 선택.
2. **SSL/TLS → Overview**: 암호화 모드가 **Full (strict)** 인지 확인합니다(Flexible이면 Full (strict)로).
3. **SSL/TLS → Edge Certificates**:
   - **Always Use HTTPS**: On
   - **Automatic HTTPS Rewrites**: On
   - **Minimum TLS Version**: 1.2
4. 같은 화면의 인증서 목록에 `korean.life.help`, `study.korean.life.help` 호스트가 포함되어 있는지 확인합니다.
   (3단계 하위 도메인은 Universal 인증서에 포함되지 않을 수 있습니다. Workers → life-help → Settings → Domains & Routes에
   Custom Domain으로 등록되어 있으면 인증서가 자동 발급됩니다. 목록에 없으면 Custom Domain을 다시 추가하세요.)
5. 확인: `curl -I http://life.help` 가 `301`과 `location: https://life.help/` 를 반환해야 합니다.
6. HSTS 헤더는 앱이 이미 보냅니다(`max-age=31536000`, includeSubDomains 없음). 모든 하위 도메인의 HTTPS가 정상임을 확인한 뒤에만
   Cloudflare의 **HSTS** 설정에서 includeSubDomains를 켜세요.

### A2. 속도 제한(WAF Rate limiting) — 무차별 대입·비용 남용 방지 (15분)
앱 내부의 속도 제한은 Worker 인스턴스별이라 보조 수단입니다. 실제 방어는 Cloudflare에서 합니다.
1. 도메인 선택 → **Security → WAF → Rate limiting rules → Create rule**.
2. **규칙 1: 관리자 로그인**
   - Rule name: `sys-login`
   - Expression (Edit expression): `(http.request.uri.path eq "/api/sys/auth/login")`
   - Characteristics: IP
   - Requests / Period: **무료 플랜은 10초 단위만 선택 가능**합니다. 무료: `5 requests / 10 seconds`, Pro 이상: `10 requests / 1 minute`
   - Action: Block, Duration: 가능한 가장 긴 값(무료는 10초, Pro는 1시간 등).
3. **규칙 2: 번역·후기·서비스 API** (무료 플랜은 규칙 수 제한이 있으니 하나의 표현식으로 합칩니다)
   - Expression: `(starts_with(http.request.uri.path, "/api/translate") or starts_with(http.request.uri.path, "/api/review") or starts_with(http.request.uri.path, "/api/svc/"))`
   - Characteristics: IP, `30 requests / 1 minute`(무료는 10초 기준으로 환산: 5 requests / 10 seconds), Action: Block.
4. **규칙 3(선택): 학습 API** — `starts_with(http.request.uri.path, "/api/learn/")`, IP당 `120 / 1 minute`.
5. 확인: 터미널에서 `for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://life.help/api/sys/auth/login -H 'content-type: application/json' -d '{}'; done`
   를 실행해 일정 횟수 이후 `429`(또는 차단 응답)가 나오면 정상입니다.

### A3. 관리자 화면 보호 — Cloudflare Access (20분, 권장)
관리자 로그인은 단일 ID/비밀번호입니다. 앞단에 이메일 일회용 코드 인증을 하나 더 두면 비밀번호가 유출돼도 접근이 막힙니다.
1. 대시보드 왼쪽 **Zero Trust**(처음이면 팀 이름 만들고 무료 플랜 선택) → **Access → Applications → Add an application → Self-hosted**.
2. Application name: `LIFE.HELP admin`, Session duration: 8 hours.
3. **Public hostname**을 여러 개 추가합니다(같은 앱에 경로 추가):
   - `sys.life.help` (경로 비움 = 전체)
   - `life.help` 경로 `admin`
   - `life.help` 경로 `api/sys`
   - 사용 중인 다른 국가 도메인(예: `korea.life.help`)에도 `admin`, `api/sys` 경로를 추가합니다.
4. Policy: Action **Allow**, Include → **Emails** → 관리자 이메일(들). Identity provider는 기본 **One-time PIN**이면 충분합니다.
5. 저장 후 시크릿 창에서 `https://sys.life.help` 를 열어 PIN 화면이 먼저 나오는지 확인합니다.
6. 주의: 관리자 외 사용자가 쓰는 경로(`/api/svc/*`, `/tech`, 고객 화면)에는 Access를 걸지 마세요.

### A4. `AUTH_ENFORCEMENT` 확인 — **켜지 마세요**
- 확인 결과(2026-10-12): 프로덕션 Worker(`life-help`)에는 `AUTH_ENFORCEMENT` 변수가 **설정되어 있지 않습니다**
  (`npx wrangler versions view <버전ID> --name life-help` 로 확인, 시크릿 이름만 표시됨).
- 이 값은 구형 Supabase 사용자 역할 검사용 스위치입니다. 현재 관리자 화면은 `/admin` 서버 코드가 관리자 세션 쿠키를 직접
  검증하므로(`app/admin/page.tsx`) 변수 없이도 보호됩니다. 이 값을 `true`로 켜면 관리자 로그인 화면 자체가 리다이렉트
  루프에 빠질 수 있으므로 켜지 않는 것이 맞습니다.

### A5. 시크릿 관리
- 관리자 비밀번호/세션 시크릿을 바꿀 때: `npx wrangler secret put LIFE_HELP_SYS_ADMIN_PASSWORD --name life-help` (프롬프트에 입력),
  `LIFE_HELP_SYS_SESSION_SECRET` 를 바꾸면 모든 관리자 세션이 즉시 무효화됩니다.
- 비밀번호를 대화/문서/저장소에 붙여 넣지 마세요. 90일마다 교체를 권장합니다.

---------------------------------------------------------------------------------------------------------------------

## B. 오류·가동 모니터링

### B1. Cloudflare Workers 로그/관측 (이미 설정됨)
- `wrangler.jsonc`에 `observability.enabled = true`가 추가되었습니다(다음 배포부터 적용).
- 확인: 대시보드 → Workers & Pages → life-help → **Observability**(Logs) 에서 요청 로그, 오류, 지연 시간을 볼 수 있습니다.

### B2. 가동 감시(Uptime) — 무료 서비스로 충분 (10분)
1. UptimeRobot(또는 Better Stack, Cloudflare Health Checks) 계정 생성.
2. 모니터 추가(HTTP(s), 5분 간격):
   - `https://life.help/api/health` — 본문에 `"ok":true` 포함 확인
   - `https://math.life.help/api/health`, `https://english.life.help/api/health`, `https://korean.life.help/api/health`
3. 알림: 이메일 + 모바일 앱 푸시를 켭니다. 연속 2회 실패 시 알림이 오게 설정합니다.

### B3. 오류 추적(Sentry) — 선택, 30분
1. sentry.io 계정 → Project 생성(Next.js).
2. 발급된 DSN을 `npx wrangler secret put SENTRY_DSN --name life-help` 로 등록합니다.
3. 코드 연결(`@sentry/nextjs` 또는 `toucan-js`)은 DSN 확보 후 요청해 주시면 적용하겠습니다. DSN 없이는 연결할 수 없습니다.
   (개인정보 보호를 위해 채팅 본문·주소를 이벤트에 포함하지 않도록 `beforeSend`에서 제거합니다.)

### B4. 알림 담당과 대응
| 상황 | 확인할 곳 | 대응 |
|---|---|---|
| 사이트 전체 5xx | Observability → Errors | 직전 배포 롤백: `npx wrangler versions deploy <이전 버전ID>@100 --name life-help` |
| 로그인/채팅 오류 급증 | Observability + Supabase 상태 | Supabase 대시보드 Logs 확인 |
| 서비스 API 429 급증 | WAF 이벤트 | 공격이면 규칙 강화, 정상 트래픽이면 한도 상향 |

---------------------------------------------------------------------------------------------------------------------

## C. 백업과 복구

### C1. Supabase 자동 백업 확인 (오픈 전 필수)
1. Supabase 대시보드 → 프로젝트 → **Database → Backups**.
2. 플랜에 따라 일일 백업(Pro 이상)이 보관됩니다. **PITR(Point in Time Recovery)** 은 유료 애드온이며,
   서비스 요청·채팅 데이터를 다루므로 오픈 전 켜는 것을 권장합니다.
3. 무료 플랜이면 자동 백업이 없으므로 아래 C2의 수동 백업을 일정에 넣으세요.

### C2. 수동(논리) 백업 — 매주 또는 큰 변경 전
```
# 연결 문자열: Supabase > Project settings > Database > Connection string (Direct connection)
SUPABASE_DB_URL='postgresql://postgres:<비밀번호>@db.<ref>.supabase.co:5432/postgres' \
BACKUP_GPG_RECIPIENT='<본인 gpg 키 이메일>' \
scripts/ops/pg-backup.sh ./backups
```
- 덤프는 gpg로 암호화되어 저장되고 평문 파일은 디스크에 남지 않습니다. `/backups/`는 git에서 제외됩니다.
- 백업 파일은 저장소 밖(암호화된 외장 디스크/클라우드)에 보관하고, 최근 4주분을 유지하세요.

### C3. 복구 리허설(분기 1회)
1. 새 Supabase 프로젝트(또는 로컬 Postgres)를 만듭니다.
2. `gpg --decrypt backup.sql.gpg | psql "<새 DB 연결 문자열>"` 로 복원합니다.
3. 핵심 테이블 건수를 비교합니다(`svc_requests`, `svc_helpers`, `learn_student_profiles`).
4. 소요 시간을 기록하고 이 문서에 반영합니다.

### C4. 데이터 보관 기한 정리(개인정보처리방침 약속)
- 요청·채팅은 완료/취소 후 1년 보관이라고 고지했습니다. `scripts/ops/purge-expired-requests.sql`을 매월 SQL Editor에서
  실행하세요(먼저 건수 확인 → 삭제 구문 주석 해제 → 실행).
- 회원 삭제 요청: `scripts/ops/delete-learning-account.sql` 절차를 따릅니다(10일 이내 처리가 방침에 명시되어 있습니다).

---------------------------------------------------------------------------------------------------------------------

## D. 법무 문서와 만 14세 미만 아동

### D1. 이미 구현된 것
- `/privacy`(개인정보처리방침), `/terms`(이용약관): life.help와 각 학습 사이트(`math/english/korean`)에서 한국어 원문 + 영어 번역으로 제공.
  학습 사이트의 랜딩, 로그인/가입 화면, 메인 사이트 하단에 링크가 있습니다.
- 가입 화면의 **나이 확인(14세 이상 / 법정대리인)** 과 **약관 동의**: 동의하지 않으면 가입이 거절되고, 동의 내용(문서 버전,
  가입 근거, 일시)은 계정 메타데이터(`legal_consent`)로 기록됩니다.
- 게스트 모드(서버에 개인정보 미전송)는 만 14세 미만 아동도 이용 가능하다고 고지했습니다.

### D2. 운영자가 반드시 해야 하는 것
1. `lib/legal/operator.ts` 에 사업자 정보 입력: 상호, 대표자, 사업자등록번호, 통신판매업 신고번호, 주소, 개인정보 보호책임자,
   Supabase 리전, 시행일. 빈 값은 문서에 출력되지 않으며, `launch-check`가 빈 값을 알려 줍니다.
2. 아래 **결정이 필요한 항목**을 확정하고 문서의 숫자를 맞춥니다(`lib/legal/documents.ts`).
3. 변호사 또는 개인정보 전문가의 검토를 받은 뒤 시행일을 넣고 배포합니다. 이 문서는 초안이며 법률 자문이 아닙니다.
4. 문서를 수정해 사용자에게 알려야 하면 `LEGAL_VERSION`을 올립니다(가입 시점의 버전이 기록됩니다).

### D3. 결정이 필요한 항목 (현재 초안 값)
| 항목 | 초안 값 | 비고 |
|---|---|---|
| 요청·채팅 보관 | 완료/취소 후 1년 | C4의 정리 스크립트로 이행 |
| 열람·삭제 요청 처리 | 10일 이내 | 이메일 수동 처리 |
| 환불 기준 | 전자상거래법 및 운영자 기준 | 환불 규정을 별도 문구로 확정해 약관 제6조에 추가 |
| 법령상 보관 | 계약·청약철회 5년, 결제 5년, 불만·분쟁 3년 | 사업 구조에 맞게 검토 |
| 번역 제공자 | MyMemory | 제공자를 바꾸면 방침 5항 수정 |
| 헬퍼의 법적 지위 | 약관 제5조(헬퍼가 서비스 책임) | 중개/직접 제공 구조에 따라 수정 필요 |

### D4. 만 14세 미만 아동 처리 절차
1. 아동은 **게스트 모드**를 기본으로 이용(개인정보 수집 없음).
2. 이메일 계정이 필요하면 **법정대리인이 가입**하고 "법정대리인" 항목을 선택합니다(가입 화면에 구현됨).
3. 법정대리인의 열람·삭제·동의 철회 요청은 개인정보 보호책임자 이메일로 접수 → 본인(법정대리인) 확인(가입 이메일 회신) →
   `delete-learning-account.sql`로 삭제 → 처리 결과를 이메일로 회신 → 요청 처리 로그에 일시만 기록.
4. 아동 가입 사실을 알게 되었는데 동의가 없다면 지체 없이 계정을 삭제합니다.

---------------------------------------------------------------------------------------------------------------------

## E. 오픈 체크리스트
- [ ] A1~A3 완료, `curl -I http://life.help` 가 https로 리다이렉트
- [ ] 관리자 비밀번호 교체, Access 정책 적용
- [ ] UptimeRobot 4개 모니터 + 알림 수신 확인
- [ ] Supabase 백업/PITR 확인, 복구 리허설 1회
- [ ] `lib/legal/operator.ts` 입력, 법률 검토 완료, 시행일 입력
- [ ] 후기 메일 전달 방식 결정(현재는 서버 로그에만 기록되며 사용자에게 "전달됨"이라고 표시하지 않음)
- [ ] `node scripts/ops/launch-check.mjs https://life.help` 가 `ok`
- [ ] 학습 사이트 검색 노출(noindex) 해제 시점 결정(`proxy.ts`의 `X-Robots-Tag`)

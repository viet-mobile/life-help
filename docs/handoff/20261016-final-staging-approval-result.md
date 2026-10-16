# 최종 스테이징 승인 검사 결과

- 실행일: 2026-10-16 (Asia/Seoul).
- 고정 후보: `7706129a7648ea05def92cf5915607f681eec62b` (`claude/integration-rc-20261017`).
- 제품 코드: `483d8d0ff501d87146a286a25482d0bf2bfcd1aa`.
- Worker: `life-help-staging`, version `67031d85-7363-4ec0-a487-511bfbf04ea4`, 100%.
- 콘텐츠: manifest 및 실제 `/api/health` 모두 `ac85816d559bf65e`.
- 제품 코드·콘텐츠·배포 설정은 기존 검증 대상과 동일하므로 재빌드·재배포하지 않았다. 후보와 483d8d0 사이 변경은 docs 및 tests/staging뿐이다.
- 기존 Mac의 gitignored 스테이징 설정으로 preflight READY, staging 프로젝트 ref `wreebowcbiymodswajwe`, production 제외를 확인했다.
- 다른 스테이징 검사 프로세스가 0개인 것을 확인하고 `npm run staging:integrated`를 단독 실행했다. 별도 학습 계정 검사를 겹치지 않았다.

## 결과

**BLOCKED — exit 1. main 병합/운영 승인 보류.**

- 실행 ID: `STG-mvb00osw-d579cb`.
- 시작: 2026-10-16 13:23:42 UTC (22:23:42 KST).
- 종료: 2026-10-16 13:27:21 UTC (22:27:21 KST).
- preflight / target guard / DB gate / service-core harness: PASS.
- service-journey: FAIL (helper → customer 채팅 자동 전달).
- main-locale-smoke / learning-suite / entitlements: 선행 하드 게이트 실패로 NOT_RUN.
- cleanup: PASS. CURRENT_RUN_RESIDUE=0, FOREIGN_ROWS_UNTOUCHED=PASS, APPEND_ONLY_AUDIT_PRESERVED=PASS(기준 1,979행), 신규 감사 68행 모두 이번 실행으로 귀속.
- post-smoke: 9/9 PASS.

### 발견된 차단 사유

도우미의 전송 HTTP 201, DB 메시지 저장 true. 고객 화면은 visible이고 채팅이 마운트되어 있었지만, 30초 내 메시지가 자동 표시되지 않았다. 새로고침 후에는 표시됐다. 검사 분류는 `PERSISTED_BUT_NO_POLL`이며 관찰 창 안에서 완료된 수신 조회가 0개였다. 수신 권한/배정 확인은 정상이다.

원인을 확정하지 않았다. `watchChat`은 response 및 JSON 완료를 관찰하므로, 이 결과만으로 조회 요청 자체가 전혀 없었다고 단정할 수 없다. 먼저 시작된 장기 대기 요청, 네트워크 실패, 실제 polling loop 중단을 구분해야 한다. `lib/service/usePoll.ts`는 tick 완료를 기다린 뒤 다음 실행을 예약하고, `lib/service/client.ts`의 일반 fetch에는 명시적 시간 제한이 없다. 이는 조사 지점이며 원인 입증이나 수정 완료를 뜻하지 않는다. 번역 호출 자체에는 3.5초 제한이 있다.

다음 조치: 기존 fixture/권한/서버 저장 검증을 유지한 채 request 시작·완료·실패·대기 시간을 추가 관찰하여 해당 고객 polling 구간을 조사한다. 새로고침·강제 polling·대기시간 확대를 통과 조건으로 사용하지 않는다. 수정한다면 별도 코드 후보에서 회귀 검사·빌드·스테이징 검증을 다시 수행한다. 현재 승인 후보는 변경하지 않았다.

### 증거 파일 (Mac 로컬)

- `/private/tmp/life-help-final-staging-approval-20261016.log` (전체 검사와 상세 채팅 진단).
- `/private/tmp/life-help-final-staging-approval-20261016.json` (고정 SHA, 버전, 시작/종료, 종료 코드).
- 스테이징 서버 오류 관찰은 본 실행 동안 시작하고 종료했다. 5xx 이벤트가 파일에 기록되지 않았지만, 그것만으로 네트워크 오류나 pending 요청이 없다고 판단하지 않는다. 이번 실패는 503이 아니라 채팅 자동 표시 실패다.

## 이전 실패 기록과의 구분

이전 실행에서는 별도 임시 학습 계정과 정리 검사가 겹친 실패 및 pakistan 기본 언어 요청의 HTTP 503이 있었다. 이 기록을 삭제하지 않는다. 이번 실행의 결과는 이전 개별 재검사 결과를 합쳐 만든 것이 아니라, 위 고정 후보와 배포를 대상으로 실행한 한 번의 전체 검사 결과이다.

## 범위

main 병합·운영 배포·원격 DB 스키마 변경·seed 적용·브랜치/폴더 삭제 없음. 스테이징 검사에서 생성한 임시 사용자·신청·학습 데이터의 정리와 기존 데이터·감사 로그 보존은 검사에 포함된다. 다른 작업자의 로컬 변경은 가져오지 않았다.

영어의 두 번째 힌트는 중립 대체이며 풍부한 힌트의 품질 검토 완료가 아니다. 한국어 부분 번역 32개 언어, 능력별 교육과정 공백, 교사·원어민 및 발음 전문가 검토는 남아 있다. 발음 도움말 기본 숨김, sg·tet lit-d1 영어 대체를 유지한다. 운영 검증은 별도 단계다.

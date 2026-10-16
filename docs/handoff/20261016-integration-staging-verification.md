# 통합 후보 실제 스테이징 검증

- 날짜: 2026-10-16 (Asia/Seoul).
- 검토 코드: `483d8d0ff501d87146a286a25482d0bf2bfcd1aa`.
- 가져온 문서 HEAD: `c8894f8b36d02f12cb0b2eba7dd6348c1afc95eb` (코드 동일).
- 스테이징: https://life-help-staging.simpl2eye.workers.dev
- Worker: `life-help-staging`, version `67031d85-7363-4ec0-a487-511bfbf04ea4`.
- 콘텐츠 버전: `ac85816d559bf65e`.
- 이전 스테이징 버전: `2b2bcf6d-0849-4756-a8c2-4a8f35250ae8`.

## 빌드와 대상 확인

이 Mac의 기존 gitignored 스테이징 설정을 사용했다. preflight READY, 대상 ref `wreebowcbiymodswajwe`, production 제외를 확인했다. 다른 작업자의 주 작업 트리는 수정하지 않았다. 빌드 전 `.next`·`.open-next`를 제거하고 검증된 스테이징 public anon 설정으로 빌드했다. 빌드와 번들 검사는 exit 0. 5,000개 파일에서 승인된 public 설정만 허용하고 서버 키·다른 프로젝트 참조를 거부하는 검사 및 양성 대조군이 통과했다. Worker 5.64 MiB < 기존 예산 7.5 MiB. 읽기 전용 DB gate PASS.

## 실제 스테이징 확인

- 수학 도형: 인접각 115°, 닮음 7.5, 기존 오답 65·9 거부, 영어 도형 동일, 사각형 나머지각 80 채점 PASS.
- 한국어 K7·K10: 실제 은행 문항, 정답 키 미노출, 카드 앞면·뒤집기 API PASS.
- 한국어 받아쓰기: 실제 ASSETS 문항 제공, 올바른 답 인정, 오답·띄어쓰기 오류 거부 PASS.
- 영어 선택과목: 레슨 문항의 hint 2는 ko 중립 안내, vi·ar에서는 `💭`; 진단 문항의 직접 힌트 요청은 거부된다. 은행 index/shard 직접 접근 404 PASS.
- 모바일 브라우저: K7 온보딩, modes/cards, 320px en·vi·ar·ur, 학습 컨테이너 RTL, 중첩 main·원시 번역 키·가로 넘침 없음, 새로고침 후 게스트 상태 유지 PASS.

## 자동 검사 보완

한국어 레벨 버튼에는 공식 등급 배지가 함께 표시되므로 기존의 전체 accessible-name 일치 조건 대신 `data-grade`로 선택하도록 스테이징 검사만 수정했다. 제품 코드는 변경하지 않았다. 실제 로그인 계정 K7·K10의 저장·진단·레슨·연습·카드 검사를 추가했다. 임시 계정만 만들고 finally에서 계정 및 연관 학습 행 제거를 확인한다.

로그인 검사 작성 중 잘못된 submit 선택자, diagnostic 응답 필드, 기록 조회 컬럼을 바로잡았다. 최종 재실행 결과만 아래에 기록한다. 이전 실패를 제품 결함으로 집계하지 않는다.

## 최종 결과

- 추가한 로그인 계정 검사: 최종 재실행 PASS (48초). K7·K10 계정 저장, 새로고침, 실제 DB level, 진단, 레슨 시작·정답 제출·learn_attempts 기록, 연습·카드 및 finally 정리 확인.
- 첫 통합 실행의 모든 기능 게이트는 PASS. 정리 시 별도로 실행한 학습 계정 검사와 겹쳐 learn_student_profiles 수가 1→2로 나타나 runner exit 1이었다. 계정 정리 뒤 원래 기준선에서 foreign-row 수와 기존 감사 행 보존은 PASS. 정리 도구 재실행은 이미 삭제된 도우미의 감사 로그 두 행을 실행과 재연결하지 못해 exit 1이었다. 기준선·검사를 수정하지 않고, 다른 계정 검사를 겹치지 않은 전체 통합 검사를 다시 실행했다.
- 단독 통합 재실행: exit 1. DB gate·동시성·서비스 여정·47개 언어 PC/모바일 화면·정리·post-smoke는 PASS. 국가 기본 언어 검사 중 pakistan 요청이 한 번 HTTP 503을 받아 main-locale-smoke는 FAIL(17/18 통과), 뒤의 learning/entitlements는 정책상 NOT_RUN이었다. 이 둘은 동일 배포의 첫 실행에서 각각 13/13·7/7 PASS였다. 따라서 단일 전체 실행이 exit 0이었다고 보고하지 않는다.
- 두 번째 실행의 정리: CURRENT_RUN_RESIDUE=0, FOREIGN_ROWS_UNTOUCHED=PASS, APPEND_ONLY_AUDIT_PRESERVED=PASS(기존 1,911행), 신규 감사 68행 전부 해당 실행으로 귀속.
- 503 재확인: 같은 pakistan 헤더로 연속 5회 HTTP 200 / lang=ur. 원인은 확정하지 못했으며 일시적 응답으로 보인다는 것은 추정이다. 국가 기본 언어 테스트 전체 재실행 결과: 14/14 PASS, exit 0 (21.2초).
- 타입 검사: 추가 스테이징 테스트 포함 exit 0.


## 범위와 제한

운영 배포, main 변경, DB 마이그레이션·seed 적용은 하지 않았다. 스테이징 테스트는 임시 사용자·요청·학습 기록을 생성하고 정리한다. 교사·원어민·발음 전문가 검토가 완료된 것은 아니다. 영어 hint 2는 안전한 중립 대체이며 풍부한 힌트가 검토 완료된 것이 아니다. sg·tet의 미검증 번역 대체 정책과 발음 도움말 기본 숨김을 유지한다.

## 코드 보존 및 인계

검사 보완 커밋 `b28bcdd3bfa05a3b7fc7ea12bd2fb776b61c4471`, 브랜치 `chatgpt/integration-rc-staging-20261016`. runtime/content/배포 설정은 검토 코드 483d8d0과 동일하다. 원격 main은 be08f10 그대로이며 이번 단계에서 main에 푸시하지 않았다. Claude는 검사 보완만 선택적으로 가져올 수 있다. 실제 운영 승격 전에는 위 단일 실행 실패 기록과 503 관측을 함께 판단해야 한다.

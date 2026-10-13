# Claude 434eb84 콘텐츠·매핑 독립 검증

기준 콘텐츠: `434eb84` (`claude/compassionate-tesla-70glgy`). 별도 ChatGPT 작업 브랜치에서 검증했습니다. Claude 브랜치와 공유 작업 트리는 수정하지 않았습니다.

## 변경 내용

- 원래 생성 커리큘럼을 검사하는 elementary·secondary·grades 테스트와 difficulty-report에서 수학/영어 생성 레이어 ID 판정을 공유합니다. 정규식 목록 대신 실제 geometry·math topics·English topics 생성 정의에서 ID를 수집합니다.
- 영어 토픽 5개 레슨·35개 문항은 원래 생성기의 비교 대상에서 제외합니다. 실제 런타임·DB·교육과정 매핑 검사에서는 전체 콘텐츠를 유지합니다. ID 접두사가 비슷한 원래 항목을 잘못 제외하지 않도록 회귀 검사를 추가했습니다.
- 신규 콘텐츠 관련 성취기준 20개에서 이전의 "해당 문항이 없다"는 근거를 현재 설명으로 교체했습니다. 집합/명제, 합성/역함수, 중복순열/중복조합/이항정리, 미분법에서는 같은 레슨 안의 무관한 문항을 근거 목록에서 제외했습니다. 기존 판정 상태는 유지했습니다.
- 매핑 검증은 중복 근거 ID와 비공개 문항을 추가로 거부합니다.
- coverage 생성기는 출력 전에 공식 기준·매핑·현재 콘텐츠를 검증합니다. 실제 콘텐츠가 지정한 커밋과 일치하는지도 확인합니다. 콘텐츠/매핑 SHA-256과 전체 레슨·문항 수를 문서에 기록하고 `--check`로 오래된 문서를 탐지합니다.

## 전체 콘텐츠와 매핑 집계

| 과목 | 성취기준 | 레슨 | 문항 | covered | partial | gap | unreviewed |
|---|---:|---:|---:|---:|---:|---:|---:|
| 수학 | 435 | 119 | 1078 | 64 | 201 | 170 | 0 |
| 영어 | 270 | 64 | 628 | 35 | 57 | 178 | 0 |

공식 영어 성취기준 근거에 E1·E2 레슨은 사용되지 않았습니다. 영어 E1·E2 확장 레슨은 10개입니다.

## 검증 결과

- 전체 Vitest: 56개 파일, 1,010개 테스트 통과.
- 마지막 M1 원래 커리큘럼 비교 보완 후 관련 테스트: 19개 통과.
- Node 교육과정/coverage 검증: 21개 통과.
- Next route type 생성 후 `tsc --noEmit`: exit 0. 새 작업 공간에서 최초 타입 검사에 필요한 Next 생성 타입이 없어서 `next typegen`을 먼저 실행했습니다.
- 수학/영어 토픽 생성기 `--check`: 최신 상태, 콘텐츠 변경 없음.
- 원래 커리큘럼 difficulty-report `--assert`: 통과.
- coverage 생성 및 `434eb84 --check`: 통과.

재현 명령:

```sh
node --test scripts/curriculum/*.test.mjs
node scripts/curriculum/audit-moe-2022.mjs --mappings docs/learning/curriculum-mappings/reviewed.json --content-revision 434eb84 --curriculum-revision 8b5d815
node scripts/learn/curriculum-coverage-doc.mjs 434eb84 --check
```

## 검증 범위

705개 전체의 구조·ID·공개 상태·근거 연결을 확인했고, 신규 콘텐츠에 연결된 20개 기준의 근거 문장을 재검토했습니다. 전체 성취기준의 교육적 판정을 독립적으로 다시 수행한 것은 아닙니다. 교사·원어민 검토는 없습니다.

이번 작업에서는 Next/OpenNext 빌드, 실제 스테이징 DB 검사와 배포를 실행하지 않았습니다. Claude가 보고한 스테이징 환경변수 부재는 해소되지 않았습니다.

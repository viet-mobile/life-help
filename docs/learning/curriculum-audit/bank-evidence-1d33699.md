# 은행 문항 감사 — 1d33699

콘텐츠 기준 커밋은 `1d33699`이다. 감사 도구가 `lib/learn/content/bank/math.json`의 194개 세트를 펼쳐 6,672개 문항 ID를 읽도록 확장했다. 기존 수학 문항 1,078개와 합쳐 7,750개이며, 영어는 628개다. 은행 파일이 없는 과거 스냅샷도 지원한다.

실행:

```sh
node --test scripts/curriculum/*.test.mjs
node scripts/curriculum/audit-moe-2022.mjs --mappings docs/learning/curriculum-mappings/reviewed.json --bank-evidence docs/learning/curriculum-mappings/bank-evidence.json --content-revision 1d33699
node scripts/learn/curriculum-coverage-doc.mjs 1d33699 --check
```

은행 문항 근거는 실제 존재하고 공개된 문항이어야 하며, 연결된 레슨과 skill을 공유해야 한다. 은행 근거 파일은 수학 성취기준 435개 전체, 현재 매핑 상태, 세트와 표본 문항의 소속, 중복, 인벤토리를 검증한다. 결과는 `none` 276개, `strengthens` 139개, `could_upgrade` 20개다. 후보별 연결 가능한 레슨 ID와 표본 문항 ID는 옆의 JSON 기록에 담았다.

`could_upgrade`는 교육적 상태 판정이 아니다. 도구는 `reviewed.json`을 수정하지 않는다. 수학 판정은 covered 64 / partial 201 / gap 170, 영어는 35 / 57 / 178로 유지했다. 교사 검토와 km, kn, ml, sg, am, my 번역 감수는 여전히 필요하다. 판정을 변경할 때는 해당 근거와 부족한 활동을 직접 검토하고 은행 근거 파일의 현재 상태도 함께 갱신해야 한다.

coverage 생성기의 콘텐츠 해시에 은행 파일을 포함했고 문항 수를 다시 생성했다. 은행 변형 문항은 새 레슨이나 배치고사 문항으로 계산하지 않는다. 런타임 `expandBank`와 감사 도구가 펼친 6,672개 문항의 모든 필드가 일치하는 비교 테스트를 추가했다.

검증: Node 도구 테스트 30/30, 전체 Vitest 1,238/1,238, 타입 검사와 coverage 최신 상태 검사 통과. 콘텐츠·번역·매핑 상태·DB·Worker는 변경하지 않았다. 이 커밋은 배포가 필요 없다.

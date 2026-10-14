# 재검토 절차 (Gemini 수정 커밋 이후)

기존 보고(`README.md`, `01~04-*-findings.md`)와 `findings/`의 원본은 그대로 유지합니다. 각 발견에는 고정 ID가 있습니다(EB 영어 은행, KB 한국어 은행, RD 영어 독해, KT K7~K10). 목록은 `findings/finding-registry.json`.

재검토 대상은 `work/english-korean-i18n`이 아니라 **`integration/consolidated-learn`의 Gemini 최종 콘텐츠 수정 커밋**입니다. `66b4d55`는 코드 수정이라 콘텐츠 품질 수정 완료를 뜻하지 않으므로, Gemini가 콘텐츠 수정 최종 SHA를 보고할 때까지 기다리고 그 SHA를 기준으로 합니다. 해당 SHA를 별도 작업 공간에 체크아웃해 읽기 전용으로 아래를 수행하고, 결과를 이 디렉터리의 `recheck/<짧은 SHA>/`에만 기록합니다. 공유 콘텐츠·코드·매핑은 수정하지 않습니다.

1. `python3 tools/recheck.py --repo <체크아웃> --baseline 46cbf67eefaa6314646fc51b3f0e4a365d2e7a61 --registry findings/finding-registry.json --out recheck/<sha>`: 발견별로 `unchanged`(그대로 = 미해결), `content_changed`(정답·보기·지문·힌트 등 수정), `removed`(삭제), `unpublished`(PUBLISHED 아님), `no_item_id`로 분류하고 학년·레벨별 문항 수와 서로 다른 항목 비율(반복률), 독해 정답 분포·난이도를 다시 계산합니다.
2. **삭제·비공개는 정답 수정과 구분해 별도 집계합니다.** `removed`·`unpublished`는 학습 경로에서 실제로 빠졌는지(PUBLISHED 문항과 비진단 문항만 학생에게 노출됨, `service.ts`·`indexer.ts`), 레슨이 아직 참조하는지(`dangling_lesson_reference`)를 `learner_path`로 확인하고, 삭제는 해결이 아니라 "범위 축소"로 적습니다. 문항 수와 반복률도 PUBLISHED만 셉니다.
3. `content_changed`·`removed`·`unpublished`·`no_item_id` 발견은 에이전트가 새 문항 기준으로 독립 재검토해 해결/부분 해결/미해결과 근거를 기록합니다. 새로 생긴 문항도 같은 기준(정답, 복수 정답, 모호함, 학년, 언어)으로 서로 다른 항목 전수를 검토합니다.
4. `tools/bank-lint.py`로 구조 검사를 다시 실행합니다.
5. K10 난이도, 참/거짓 편중, 빈 해설, K7~K10 번역 필드, 병합 충돌(`git merge-tree`)은 별도로 직접 확인합니다.
6. 보고에는 발견 ID별 상태, 반복률·문항 수의 전후 비교, 미해결 오류 목록, 사용한 콘텐츠 커밋을 적습니다. 검토는 AI 검토이며 원어민·교사 검토가 아닙니다.

현재 상태: `integration/consolidated-learn`은 이 저장소의 원격에서 보이지 않습니다(푸시 전이거나 다른 원격). Gemini의 최종 SHA 보고와 접근 가능한 브랜치를 기다리는 중이며, 그전에는 재검토 결과를 기록하지 않습니다.

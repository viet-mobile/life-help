# 재검토 절차 (Gemini 수정 커밋 이후)

기존 보고(`README.md`, `01~04-*-findings.md`)와 `findings/`의 원본은 그대로 유지합니다. 각 발견에는 고정 ID가 있습니다(EB 영어 은행, KB 한국어 은행, RD 영어 독해, KT K7~K10). 목록은 `findings/finding-registry.json`.

Gemini의 수정 커밋이 나오면 그 커밋을 별도 작업 공간에 체크아웃해 읽기 전용으로 아래를 수행하고, 결과를 이 디렉터리의 `recheck/<짧은 SHA>/`에만 기록합니다. 공유 콘텐츠·코드·매핑은 수정하지 않습니다.

1. `python3 tools/recheck.py --repo <체크아웃> --baseline 46cbf67eefaa6314646fc51b3f0e4a365d2e7a61 --registry findings/finding-registry.json --out recheck/<sha>`: 발견별로 `unchanged`(그대로 = 미해결), `changed`, `item_missing`, `no_item_id`로 분류하고 학년·레벨별 문항 수와 서로 다른 항목 비율(반복률), 독해 정답 분포·난이도를 다시 계산합니다.
2. `changed`·`item_missing`·`no_item_id` 발견은 에이전트가 새 문항 기준으로 독립 재검토해 해결/부분 해결/미해결과 근거를 기록합니다. 새로 생긴 문항도 같은 기준(정답, 복수 정답, 모호함, 학년, 언어)으로 서로 다른 항목 전수를 검토합니다.
3. `tools/bank-lint.py`로 구조 검사를 다시 실행합니다.
4. K10 난이도, 참/거짓 편중, 빈 해설, K7~K10 번역 필드, 병합 충돌(`git merge-tree`)은 별도로 직접 확인합니다.
5. 보고에는 발견 ID별 상태, 반복률·문항 수의 전후 비교, 미해결 오류 목록, 사용한 콘텐츠 커밋을 적습니다. 검토는 AI 검토이며 원어민·교사 검토가 아닙니다.

현재(2026-10-14) `work/english-korean-i18n`은 기준 커밋 `46cbf67`에서 변하지 않았습니다. 수정 커밋은 아직 없습니다.

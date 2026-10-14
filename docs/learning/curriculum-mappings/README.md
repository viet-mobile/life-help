# 성취기준 매핑

`reviewed.json`은 2022 개정 교육과정 수학 435개·영어 270개 성취기준을 사이트 콘텐츠와 대조한 검토 결과입니다(형식과 검증은 `docs/learning/curriculum-audit/README.md`).
검토는 Claude의 자동 검토이며 교사·원어민 검토를 받지 않았습니다. 새 레슨·문항을 추가하면 영향을 받는 기준을 다시 검토하고, 표는 `node scripts/learn/curriculum-coverage-doc.mjs <커밋>`로 재생성합니다.

은행(`lib/learn/content/bank/math.json`) 증거는 `bank-evidence.json`·`bank-evidence.md`에 따로 둡니다. 감사 도구가 은행 문항 ID를 읽지 못해 `reviewed.json`의 상태는 바꾸지 않았습니다.
